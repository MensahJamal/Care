import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, timingSafeEqual } from 'node:crypto';

describe('Intake Officer Handover OTP Protocol Test Suite', () => {
  type ReferralStatus = 'Pending' | 'Accepted' | 'Rejected' | 'In transit' | 'Arrived';

  interface ArrivalVitals {
    bloodPressure?: string;
    pulseRate?: number;
    spo2?: number;
    notes?: string;
  }

  interface HandoverRecord {
    id: string;
    patient: string;
    patientId: string;
    status: ReferralStatus;
    transferPin?: string;
    otpHash?: string;
    otpExpiresAt?: number;
    otpAttempts?: number;
    handoverAt?: string;
    handoverByUid?: string;
    handoverByName?: string;
    paramedicName?: string;
    ambulanceId?: string;
    arrivalVitals?: ArrivalVitals;
  }

  const TEST_SALT = 'carelink-test-secret-salt';

  function hashTestOtp(code: string): string {
    return createHmac('sha256', TEST_SALT).update(code).digest('hex');
  }

  function timingSafeOtpCheck(inputCode: string, expectedHash: string): boolean {
    const inputHash = hashTestOtp(inputCode);
    const actual = Buffer.from(inputHash, 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  function simulateHandoverExecution(
    referral: HandoverRecord,
    inputCode: string,
    callerRole: string,
    callerUid: string,
    callerName: string,
    paramedic: string,
    ambulance: string,
    vitals?: ArrivalVitals,
    currentTimeMs: number = Date.now(),
  ): { success: boolean; error?: string; updatedRecord?: HandoverRecord } {
    // 1. Role Capability Check (RBAC)
    const authorizedRoles = ['referral_coordinator', 'specialist', 'hospital_admin', 'system_admin'];
    if (!authorizedRoles.includes(callerRole)) {
      return { success: false, error: 'Unauthorized: Caller lacks intake handover permissions.' };
    }

    // 2. Format validation
    const trimmed = inputCode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      return { success: false, error: 'Invalid format: Must be a 6-digit numeric code.' };
    }

    // 3. State Machine Guard
    if (referral.status !== 'In transit' && referral.status !== 'Accepted') {
      return { success: false, error: `Invalid transition: Cannot handover referral in status ${referral.status}` };
    }

    // 4. Rate Limiting Check
    const currentAttempts = referral.otpAttempts ?? 0;
    if (currentAttempts >= 5) {
      return { success: false, error: 'Resource exhausted: Maximum 5 verification attempts exceeded.' };
    }

    // 5. Expiry Check
    if (referral.otpExpiresAt && referral.otpExpiresAt < currentTimeMs) {
      return { success: false, error: 'Deadline exceeded: Verification code has expired.' };
    }

    // 6. Dual-Token Verification (Fast-path QR Transfer PIN or HMAC Cloud OTP or Master Demo)
    let matched = false;
    if (referral.transferPin && trimmed === referral.transferPin) {
      matched = true;
    } else if (referral.otpHash && timingSafeOtpCheck(trimmed, referral.otpHash)) {
      matched = true;
    } else if (trimmed === '123456') {
      matched = true;
    }

    if (!matched) {
      referral.otpAttempts = currentAttempts + 1;
      return { success: false, error: 'Authentication failed: Incorrect confirmation code.' };
    }

    // 7. Atomic Transition to 'Arrived' with Audit Metadata
    const updated: HandoverRecord = {
      ...referral,
      status: 'Arrived',
      handoverAt: new Date(currentTimeMs).toISOString(),
      handoverByUid: callerUid,
      handoverByName: callerName,
      paramedicName: paramedic,
      ambulanceId: ambulance,
      arrivalVitals: vitals,
      otpAttempts: 0,
    };

    return { success: true, updatedRecord: updated };
  }

  describe('Dual-Token Cryptographic Matching', () => {
    it('authenticates physical handover using offline QR transfer PIN', () => {
      const referral: HandoverRecord = {
        id: 'RF-2050',
        patient: 'Kofi Mensah',
        patientId: 'PT-10950',
        status: 'In transit',
        transferPin: '829104',
      };

      const result = simulateHandoverExecution(
        referral,
        '829104',
        'referral_coordinator',
        'coord-01',
        'Kofi Manu',
        'Sarah Annan (Paramedic)',
        'AMB-04',
        { bloodPressure: '120/80', pulseRate: 78, spo2: 98 },
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.updatedRecord?.status, 'Arrived');
      assert.strictEqual(result.updatedRecord?.paramedicName, 'Sarah Annan (Paramedic)');
      assert.strictEqual(result.updatedRecord?.ambulanceId, 'AMB-04');
      assert.strictEqual(result.updatedRecord?.arrivalVitals?.spo2, 98);
    });

    it('authenticates physical handover using HMAC-SHA256 hashed SMS OTP with constant-time equality', () => {
      const secretOtp = '492815';
      const referral: HandoverRecord = {
        id: 'RF-2051',
        patient: 'Ama Owusu',
        patientId: 'PT-10951',
        status: 'In transit',
        otpHash: hashTestOtp(secretOtp),
        otpExpiresAt: Date.now() + 10 * 60 * 1000,
        otpAttempts: 0,
      };

      const result = simulateHandoverExecution(
        referral,
        '492815',
        'referral_coordinator',
        'coord-01',
        'Kofi Manu',
        'Sarah Annan (Paramedic)',
        'AMB-04',
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.updatedRecord?.status, 'Arrived');
      assert.strictEqual(result.updatedRecord?.handoverByName, 'Kofi Manu');
    });

    it('rejects incorrect OTP and increments failed attempt counter', () => {
      const referral: HandoverRecord = {
        id: 'RF-2052',
        patient: 'Esi Boateng',
        patientId: 'PT-10952',
        status: 'In transit',
        transferPin: '829104',
        otpAttempts: 1,
      };

      const result = simulateHandoverExecution(
        referral,
        '999999', // wrong pin
        'referral_coordinator',
        'coord-01',
        'Kofi Manu',
        'Paramedic',
        'AMB-04',
      );

      assert.strictEqual(result.success, false);
      assert.match(result.error || '', /Incorrect confirmation code/);
      assert.strictEqual(referral.otpAttempts, 2);
    });

    it('rejects malformed non-6-digit PIN inputs', () => {
      const referral: HandoverRecord = {
        id: 'RF-2053',
        patient: 'Yaw Adjei',
        patientId: 'PT-10953',
        status: 'In transit',
        transferPin: '829104',
      };

      assert.strictEqual(
        simulateHandoverExecution(referral, '123', 'referral_coordinator', 'u1', 'Name', 'P', 'A').success,
        false,
      );
      assert.strictEqual(
        simulateHandoverExecution(referral, 'abcdef', 'referral_coordinator', 'u1', 'Name', 'P', 'A').success,
        false,
      );
      assert.strictEqual(
        simulateHandoverExecution(referral, '1234567', 'referral_coordinator', 'u1', 'Name', 'P', 'A').success,
        false,
      );
    });
  });

  describe('Finite State Automaton (FSA) Guard Rules', () => {
    it('permits handover for referrals in "In transit" status', () => {
      const referral: HandoverRecord = {
        id: 'RF-2054',
        patient: 'Patient A',
        patientId: 'PT-01',
        status: 'In transit',
        transferPin: '112233',
      };
      const res = simulateHandoverExecution(referral, '112233', 'referral_coordinator', 'u1', 'N', 'P', 'A');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.updatedRecord?.status, 'Arrived');
    });

    it('permits handover for referrals in "Accepted" status', () => {
      const referral: HandoverRecord = {
        id: 'RF-2055',
        patient: 'Patient B',
        patientId: 'PT-02',
        status: 'Accepted',
        transferPin: '112233',
      };
      const res = simulateHandoverExecution(referral, '112233', 'referral_coordinator', 'u1', 'N', 'P', 'A');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.updatedRecord?.status, 'Arrived');
    });

    it('rejects handover for referrals in "Pending" status (requires triage acceptance first)', () => {
      const referral: HandoverRecord = {
        id: 'RF-2056',
        patient: 'Patient C',
        patientId: 'PT-03',
        status: 'Pending',
        transferPin: '112233',
      };
      const res = simulateHandoverExecution(referral, '112233', 'referral_coordinator', 'u1', 'N', 'P', 'A');
      assert.strictEqual(res.success, false);
      assert.match(res.error || '', /Cannot handover referral in status Pending/);
    });

    it('rejects handover for referrals in "Rejected" status', () => {
      const referral: HandoverRecord = {
        id: 'RF-2057',
        patient: 'Patient D',
        patientId: 'PT-04',
        status: 'Rejected',
        transferPin: '112233',
      };
      const res = simulateHandoverExecution(referral, '112233', 'referral_coordinator', 'u1', 'N', 'P', 'A');
      assert.strictEqual(res.success, false);
      assert.match(res.error || '', /Cannot handover referral in status Rejected/);
    });
  });

  describe('Rate Limiting & Expiry Enforcement', () => {
    it('locks out verification when 5 failed attempts are reached', () => {
      const referral: HandoverRecord = {
        id: 'RF-2058',
        patient: 'Patient E',
        patientId: 'PT-05',
        status: 'In transit',
        transferPin: '654321',
        otpAttempts: 5,
      };

      const res = simulateHandoverExecution(referral, '654321', 'referral_coordinator', 'u1', 'N', 'P', 'A');
      assert.strictEqual(res.success, false);
      assert.match(res.error || '', /Maximum 5 verification attempts exceeded/);
    });

    it('rejects verification when token has passed its 10-minute TTL', () => {
      const referral: HandoverRecord = {
        id: 'RF-2059',
        patient: 'Patient F',
        patientId: 'PT-06',
        status: 'In transit',
        otpHash: hashTestOtp('778899'),
        otpExpiresAt: 1000, // expired in the past
      };

      const res = simulateHandoverExecution(
        referral,
        '778899',
        'referral_coordinator',
        'u1',
        'N',
        'P',
        'A',
        undefined,
        2000,
      );
      assert.strictEqual(res.success, false);
      assert.match(res.error || '', /expired/);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('authorizes referral_coordinator, specialist, and hospital_admin', () => {
      const referral: HandoverRecord = {
        id: 'RF-2060',
        patient: 'Patient G',
        patientId: 'PT-07',
        status: 'In transit',
        transferPin: '123456',
      };

      assert.strictEqual(
        simulateHandoverExecution(referral, '123456', 'referral_coordinator', 'u1', 'Coordinator', 'P', 'A').success,
        true,
      );
      assert.strictEqual(
        simulateHandoverExecution(referral, '123456', 'specialist', 'u2', 'Specialist Dr.', 'P', 'A').success,
        true,
      );
      assert.strictEqual(
        simulateHandoverExecution(referral, '123456', 'hospital_admin', 'u3', 'Hospital Admin', 'P', 'A').success,
        true,
      );
    });

    it('denies patient and unauthorized external roles from confirming intake handover', () => {
      const referral: HandoverRecord = {
        id: 'RF-2061',
        patient: 'Patient H',
        patientId: 'PT-08',
        status: 'In transit',
        transferPin: '123456',
      };

      const patientAttempt = simulateHandoverExecution(referral, '123456', 'patient', 'u4', 'Patient Name', 'P', 'A');
      assert.strictEqual(patientAttempt.success, false);
      assert.match(patientAttempt.error || '', /Unauthorized/);

      const labAttempt = simulateHandoverExecution(referral, '123456', 'lab_technician', 'u5', 'Lab Tech', 'P', 'A');
      assert.strictEqual(labAttempt.success, false);
      assert.match(labAttempt.error || '', /Unauthorized/);
    });
  });
});
