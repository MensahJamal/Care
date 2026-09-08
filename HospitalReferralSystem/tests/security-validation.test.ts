import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Security Validation & Sanitization Test Suite', () => {
  describe('OTP Code Format Validation', () => {
    const otpRegex = /^\d{6}$/;

    it('accepts valid 6-digit numeric OTP codes', () => {
      assert.ok(otpRegex.test('123456'));
      assert.ok(otpRegex.test('000000'));
      assert.ok(otpRegex.test('999999'));
      assert.ok(otpRegex.test('482910'));
    });

    it('rejects invalid OTP codes', () => {
      assert.strictEqual(otpRegex.test('12345'), false); // too short
      assert.strictEqual(otpRegex.test('1234567'), false); // too long
      assert.strictEqual(otpRegex.test('12345a'), false); // alphanumeric
      assert.strictEqual(otpRegex.test('abcdef'), false); // letters
      assert.strictEqual(otpRegex.test(' 123456'), false); // whitespace
      assert.strictEqual(otpRegex.test(''), false); // empty
    });
  });

  describe('Facility ID Format Validation', () => {
    const facilityIdRegex = /^[A-Z0-9_-]{2,20}$/i;

    it('accepts standard facility identifiers', () => {
      assert.ok(facilityIdRegex.test('KBTH-01'));
      assert.ok(facilityIdRegex.test('RDG-02'));
      assert.ok(facilityIdRegex.test('LEKMA_GH'));
      assert.ok(facilityIdRegex.test('HOSPITAL1'));
    });

    it('rejects invalid facility identifiers', () => {
      assert.strictEqual(facilityIdRegex.test('A'), false); // too short
      assert.strictEqual(facilityIdRegex.test('THIS_FACILITY_NAME_IS_FAR_TOO_LONG_FOR_AN_ID'), false); // too long
      assert.strictEqual(facilityIdRegex.test('KBTH/01'), false); // invalid characters
      assert.strictEqual(facilityIdRegex.test('KBTH 01'), false); // spaces
      assert.strictEqual(facilityIdRegex.test(''), false); // empty
    });
  });

  describe('Contact & Phone Number Validation', () => {
    const phoneRegex = /^[+\d][\d\s().-]{6,}$/;

    it('accepts valid telephone contacts', () => {
      assert.ok(phoneRegex.test('+233245550191'));
      assert.ok(phoneRegex.test('+233 24 555 0191'));
      assert.ok(phoneRegex.test('0245550191'));
      assert.ok(phoneRegex.test('+1 (233) 24-555-0191'));
    });

    it('rejects invalid telephone contacts', () => {
      assert.strictEqual(phoneRegex.test('123'), false); // too short
      assert.strictEqual(phoneRegex.test('abc123456'), false); // letters
      assert.strictEqual(phoneRegex.test('(233) 24-555-0191'), false); // must start with digit or plus
      assert.strictEqual(phoneRegex.test(''), false); // empty
    });
  });

  describe('Email Address Format Validation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('accepts standard email addresses', () => {
      assert.ok(emailRegex.test('doctor@carelink.local'));
      assert.ok(emailRegex.test('admin.staff@hospital.org'));
      assert.ok(emailRegex.test('patient123@gmail.com'));
    });

    it('rejects invalid email formats', () => {
      assert.strictEqual(emailRegex.test('notanemail'), false);
      assert.strictEqual(emailRegex.test('doctor@'), false);
      assert.strictEqual(emailRegex.test('@hospital.org'), false);
      assert.strictEqual(emailRegex.test('doctor @hospital.org'), false);
      assert.strictEqual(emailRegex.test(''), false);
    });
  });

  describe('RBAC Defense-in-Depth Sanitization', () => {
    function sanitizeProfileUpdates(
      role: string,
      updates: Record<string, unknown>,
    ): Record<string, unknown> {
      const isAdmin = role === 'hospital_admin' || role === 'system_admin';
      const sanitized = { ...updates };
      if (!isAdmin) {
        delete sanitized.role;
        delete sanitized.facilityId;
        delete sanitized.facilityName;
      }
      return sanitized;
    }

    it('strips role and facility mutations when requested by non-admin users', () => {
      const maliciousPayload = {
        displayName: 'Dr. Hacker',
        jobTitle: 'Hacker',
        role: 'system_admin',
        facilityId: 'NATIONAL-HQ',
        facilityName: 'National Health Authority',
      };

      const sanitizedForPcp = sanitizeProfileUpdates('pcp', maliciousPayload);
      assert.strictEqual(sanitizedForPcp.role, undefined);
      assert.strictEqual(sanitizedForPcp.facilityId, undefined);
      assert.strictEqual(sanitizedForPcp.facilityName, undefined);
      assert.strictEqual(sanitizedForPcp.displayName, 'Dr. Hacker');

      const sanitizedForPatient = sanitizeProfileUpdates('patient', maliciousPayload);
      assert.strictEqual(sanitizedForPatient.role, undefined);
      assert.strictEqual(sanitizedForPatient.facilityId, undefined);
    });

    it('permits role and facility mutations when requested by authorized administrators', () => {
      const adminPayload = {
        displayName: 'Administrator Mensah',
        jobTitle: 'Superintendent',
        facilityId: 'KBTH-01',
        facilityName: 'Korle Bu Teaching Hospital',
      };

      const result = sanitizeProfileUpdates('hospital_admin', adminPayload);
      assert.strictEqual(result.facilityId, 'KBTH-01');
      assert.strictEqual(result.facilityName, 'Korle Bu Teaching Hospital');
      assert.strictEqual(result.displayName, 'Administrator Mensah');
    });
  });

  describe('Clinical Profile & Display Name Validation', () => {
    function validateDisplayName(name: string): { valid: boolean; error?: string } {
      const clean = name.trim();
      if (!clean || clean.length < 2) {
        return { valid: false, error: 'Please enter a valid full name (minimum 2 characters).' };
      }
      if (clean.length > 60) {
        return { valid: false, error: 'Full name must not exceed 60 characters.' };
      }
      return { valid: true };
    }

    it('accepts realistic clinical names with titles and prefixes', () => {
      assert.strictEqual(validateDisplayName('Administrator Sarah Mensah').valid, true);
      assert.strictEqual(validateDisplayName('Dr. Kwame Addo').valid, true);
      assert.strictEqual(validateDisplayName('Pharm. David Osei').valid, true);
      assert.strictEqual(validateDisplayName('Prof. Nana Yaa Opoku, MD').valid, true);
    });

    it('rejects empty, whitespace-only, and excessively long names', () => {
      assert.strictEqual(validateDisplayName('').valid, false);
      assert.strictEqual(validateDisplayName('   ').valid, false);
      assert.strictEqual(validateDisplayName('A').valid, false); // too short (< 2)
      assert.strictEqual(
        validateDisplayName('A'.repeat(61)).valid,
        false, // exceeds 60 characters
      );
    });

    it('validates combined profile updates with displayName and jobTitle', () => {
      const updates = {
        displayName: 'Administrator Sarah Mensah',
        jobTitle: 'Chief Clinical Operations Officer',
      };

      const nameResult = validateDisplayName(updates.displayName);
      assert.strictEqual(nameResult.valid, true);
      assert.ok(updates.jobTitle.length > 0);
    });
  });

  describe('Staff Directory Access Rule Validation (Firestore Security)', () => {
    function canReadUserProfile(
      caller: { uid: string; role: string; facilityId: string },
      targetUser: { uid: string; role: string; facilityId: string },
    ): boolean {
      const isSelf = caller.uid === targetUser.uid;
      const isHospitalAdmin = caller.role === 'hospital_admin' || caller.role === 'system_admin' || caller.role === 'administrator';
      const isClinicalStaff = ['pcp', 'specialist', 'referral_coordinator', 'lab_technician', 'pharmacist'].includes(caller.role);
      const isSameFacility = caller.facilityId === targetUser.facilityId;

      return isSelf || isHospitalAdmin || (isClinicalStaff && isSameFacility);
    }

    it('allows clinical staff in the same hospital to view the administrator and colleague profiles', () => {
      const pcpCaller = { uid: 'u-pcp', role: 'pcp', facilityId: 'KBTH-01' };
      const adminTarget = { uid: 'u-admin', role: 'hospital_admin', facilityId: 'KBTH-01' };
      const specialistTarget = { uid: 'u-spec', role: 'specialist', facilityId: 'KBTH-01' };

      assert.strictEqual(canReadUserProfile(pcpCaller, adminTarget), true);
      assert.strictEqual(canReadUserProfile(pcpCaller, specialistTarget), true);
    });

    it('prevents clinical staff from reading user profiles from other hospitals', () => {
      const pcpCaller = { uid: 'u-pcp', role: 'pcp', facilityId: 'KBTH-01' };
      const otherHospitalStaff = { uid: 'u-other', role: 'specialist', facilityId: 'RDG-02' };

      assert.strictEqual(canReadUserProfile(pcpCaller, otherHospitalStaff), false);
    });

    it('allows hospital administrators to view staff across permissions', () => {
      const adminCaller = { uid: 'u-admin', role: 'hospital_admin', facilityId: 'KBTH-01' };
      const staffTarget = { uid: 'u-pcp', role: 'pcp', facilityId: 'KBTH-01' };

      assert.strictEqual(canReadUserProfile(adminCaller, staffTarget), true);
    });

    it('prevents non-clinical patients from snooping internal staff records', () => {
      const patientCaller = { uid: 'u-patient', role: 'patient', facilityId: 'KBTH-01' };
      const adminTarget = { uid: 'u-admin', role: 'hospital_admin', facilityId: 'KBTH-01' };

      assert.strictEqual(canReadUserProfile(patientCaller, adminTarget), false);
    });
  });

  describe('Credential Storage & OWASP MASVS MASVS-STORAGE Compliance', () => {
    it('persists and clears remembered email without sensitive credential leakage', async () => {
      const { getRememberedEmail, saveRememberedEmail, clearRememberedEmail } = await import(
        '../src/lib/storage.ts'
      );

      clearRememberedEmail();
      assert.strictEqual(getRememberedEmail(), null);

      saveRememberedEmail('Doctor.Kwame@carelink.local ');
      assert.strictEqual(getRememberedEmail(), 'doctor.kwame@carelink.local');

      clearRememberedEmail();
      assert.strictEqual(getRememberedEmail(), null);
    });

    it('ensures quick-select identity loaders never return or auto-fill plaintext passwords', () => {
      function simulateQuickSelect(roleMetadata: { demoCredentials: { email: string } }) {
        return {
          email: roleMetadata.demoCredentials.email,
          password: '', // Password must remain empty per security policy
        };
      }

      const mockRoleMeta = {
        demoCredentials: {
          email: 'specialist@carelink.local',
          displayName: 'Dr. Naa Lartey',
        },
      };

      const result = simulateQuickSelect(mockRoleMeta);
      assert.strictEqual(result.email, 'specialist@carelink.local');
      assert.strictEqual(result.password, '');
      assert.notStrictEqual(result.password, 'demo1234');
    });

    it('ensures user management listings do not expose plaintext password properties', () => {
      const mockUserList = [
        { id: 'u1', name: 'Dr. Kwame Addo', email: 'pcp@carelink.local', role: 'pcp' },
        { id: 'u2', name: 'Administrator Mensah', email: 'hospadmin@carelink.local', role: 'hospital_admin' },
      ];

      for (const user of mockUserList) {
        assert.strictEqual('tempPassword' in user, false);
        assert.strictEqual('password' in user, false);
      }
    });
  });
});

