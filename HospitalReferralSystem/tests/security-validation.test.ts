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
});
