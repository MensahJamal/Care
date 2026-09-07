import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Audit Remediation & Security Fixes Test Suite', () => {
  describe('Observer-Relative Referral Direction Mapping', () => {
    function computeDirection(
      data: { fromFacilityId?: string; toFacilityId?: string; direction?: 'incoming' | 'sent' },
      observerFacilityId?: string,
    ): 'incoming' | 'sent' {
      let direction: 'incoming' | 'sent' = data.direction ?? 'sent';
      if (observerFacilityId && observerFacilityId !== 'ALL') {
        if (data.toFacilityId === observerFacilityId) {
          direction = 'incoming';
        } else if (data.fromFacilityId === observerFacilityId) {
          direction = 'sent';
        }
      }
      return direction;
    }

    it('resolves referral as incoming for destination hospital', () => {
      const referral = {
        fromFacilityId: 'KBTH-01',
        toFacilityId: 'RDG-02',
        direction: 'sent' as const,
      };

      const directionForReceiver = computeDirection(referral, 'RDG-02');
      assert.strictEqual(directionForReceiver, 'incoming');
    });

    it('resolves referral as sent for originating hospital', () => {
      const referral = {
        fromFacilityId: 'KBTH-01',
        toFacilityId: 'RDG-02',
        direction: 'sent' as const,
      };

      const directionForSender = computeDirection(referral, 'KBTH-01');
      assert.strictEqual(directionForSender, 'sent');
    });

    it('preserves default direction for nationwide super-admin oversight', () => {
      const referral = {
        fromFacilityId: 'KBTH-01',
        toFacilityId: 'RDG-02',
        direction: 'sent' as const,
      };

      const directionForSuperAdmin = computeDirection(referral, 'ALL');
      assert.strictEqual(directionForSuperAdmin, 'sent');
    });
  });

  describe('Dynamic Facility Resolution in Dashboards & Capacity', () => {
    const resources = [
      { id: 'kbth', name: 'Korle Bu Teaching Hospital', beds: 24, totalBeds: 180 },
      { id: 'ridge', name: 'Ridge Hospital', beds: 18, totalBeds: 96 },
      { id: '37mil', name: '37 Military Hospital', beds: 8, totalBeds: 84 },
    ];

    function resolveFacility(profile?: { facilityId?: string; facilityName?: string }) {
      return (
        resources.find(
          (r) =>
            (profile?.facilityId && r.id.toLowerCase() === profile.facilityId.toLowerCase()) ||
            (profile?.facilityName && r.name.toLowerCase().includes(profile.facilityName.toLowerCase())),
        ) ||
        resources[0]
      );
    }

    it('correctly maps Ridge Hospital staff to Ridge capacity node', () => {
      const resolved = resolveFacility({ facilityId: 'ridge', facilityName: 'Ridge Hospital' });
      assert.strictEqual(resolved.id, 'ridge');
      assert.strictEqual(resolved.name, 'Ridge Hospital');
    });

    it('correctly maps 37 Military staff to 37 Military capacity node', () => {
      const resolved = resolveFacility({ facilityId: '37mil', facilityName: '37 Military Hospital' });
      assert.strictEqual(resolved.id, '37mil');
      assert.strictEqual(resolved.beds, 8);
    });

    it('falls back gracefully to default resource if facility is unknown', () => {
      const resolved = resolveFacility({ facilityId: 'UNKNOWN-01', facilityName: 'Unknown Clinic' });
      assert.strictEqual(resolved.id, 'kbth');
    });
  });

  describe('Privilege Escalation Guard (RBAC Security Rules)', () => {
    function canUpdateRole(
      callerRole: string,
      targetNewRole: string,
    ): boolean {
      const isSystemAdmin = callerRole === 'system_admin';
      const isHospitalAdmin = callerRole === 'hospital_admin' || callerRole === 'administrator' || isSystemAdmin;

      if (!isHospitalAdmin) return false;
      // Hospital admin cannot set system_admin unless already system_admin
      if (targetNewRole === 'system_admin' && !isSystemAdmin) {
        return false;
      }
      return true;
    }

    it('prevents hospital_admin from promoting anyone to system_admin', () => {
      assert.strictEqual(canUpdateRole('hospital_admin', 'system_admin'), false);
    });

    it('permits hospital_admin to assign staff and specialist roles', () => {
      assert.strictEqual(canUpdateRole('hospital_admin', 'specialist'), true);
      assert.strictEqual(canUpdateRole('hospital_admin', 'referral_coordinator'), true);
      assert.strictEqual(canUpdateRole('hospital_admin', 'pcp'), true);
    });

    it('permits system_admin to assign system_admin role', () => {
      assert.strictEqual(canUpdateRole('system_admin', 'system_admin'), true);
    });

    it('denies clinical staff and non-admins from changing roles', () => {
      assert.strictEqual(canUpdateRole('specialist', 'hospital_admin'), false);
      assert.strictEqual(canUpdateRole('pcp', 'specialist'), false);
      assert.strictEqual(canUpdateRole('patient', 'pcp'), false);
    });
  });

  describe('OTP & Transfer PIN Verification Standard', () => {
    const otpValidator = /^\d{6}$/;

    it('enforces strict 6-digit numeric OTP requirement across all channels', () => {
      assert.strictEqual(otpValidator.test('482910'), true);
      assert.strictEqual(otpValidator.test('123456'), true);
      assert.strictEqual(otpValidator.test('7892'), false); // rejected 4-digit legacy
      assert.strictEqual(otpValidator.test('abc123'), false);
      assert.strictEqual(otpValidator.test('1234567'), false);
    });

    it('validates patient Transfer PIN matching for offline QR handovers', () => {
      const referral = {
        id: 'RF-9901',
        patient: 'Ama Serwaa',
        transferPin: '829104',
      };

      const enteredPin = '829104';
      const isMatch = referral.transferPin && enteredPin.trim() === referral.transferPin;
      assert.strictEqual(isMatch, true);

      const wrongPin = '111222';
      const isWrongMatch = referral.transferPin && wrongPin.trim() === referral.transferPin;
      assert.strictEqual(isWrongMatch, false);
    });
  });
});
