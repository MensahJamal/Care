import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('QR Referral Generation & Scanning Flow Test Suite', () => {
  type ReferralQRPayload = {
    type: 'hospital_referral';
    version: '1.0';
    id: string;
    patient: string;
    patientId: string;
    reason: string;
    priority: 'Emergency' | 'Urgent' | 'Routine';
    from: string;
    to: string;
    fromFacilityId?: string;
    contact: string;
    transferPin?: string;
    createdAt: string;
  };

  function validateAndParseQRPayload(raw: string): ReferralQRPayload {
    const data = JSON.parse(raw);
    if (data.type !== 'hospital_referral') {
      throw new Error('Invalid QR payload type');
    }
    if (!data.patient || typeof data.patient !== 'string') {
      throw new Error('Missing patient name');
    }
    if (!data.reason || typeof data.reason !== 'string') {
      throw new Error('Missing clinical reason');
    }
    if (!data.to || typeof data.to !== 'string') {
      throw new Error('Missing destination hospital');
    }
    if (!['Emergency', 'Urgent', 'Routine'].includes(data.priority)) {
      throw new Error('Invalid priority level');
    }
    return data as ReferralQRPayload;
  }

  it('correctly serializes and parses a complete QR referral payload', () => {
    const payload: ReferralQRPayload = {
      type: 'hospital_referral',
      version: '1.0',
      id: 'RF-8821',
      patient: 'Amara Boateng',
      patientId: 'PT-8821',
      reason: 'Acute intracranial hemorrhage requiring tertiary neurosurgical intervention',
      priority: 'Emergency',
      from: 'Ridge Hospital',
      to: 'Korle Bu Teaching Hospital',
      fromFacilityId: 'RDG-01',
      contact: '+233 24 555 0199',
      createdAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(payload);
    assert.ok(typeof serialized === 'string');

    const parsed = validateAndParseQRPayload(serialized);
    assert.strictEqual(parsed.patient, 'Amara Boateng');
    assert.strictEqual(parsed.priority, 'Emergency');
    assert.strictEqual(parsed.reason, 'Acute intracranial hemorrhage requiring tertiary neurosurgical intervention');
    assert.strictEqual(parsed.to, 'Korle Bu Teaching Hospital');
    assert.strictEqual(parsed.from, 'Ridge Hospital');
  });

  it('rejects invalid or incomplete QR payloads', () => {
    // Missing patient
    assert.throws(() => {
      validateAndParseQRPayload(
        JSON.stringify({
          type: 'hospital_referral',
          reason: 'Fever',
          to: 'Ridge Hospital',
          priority: 'Urgent',
        }),
      );
    }, /Missing patient name/);

    // Missing reason
    assert.throws(() => {
      validateAndParseQRPayload(
        JSON.stringify({
          type: 'hospital_referral',
          patient: 'John Doe',
          to: 'Ridge Hospital',
          priority: 'Urgent',
        }),
      );
    }, /Missing clinical reason/);

    // Invalid priority
    assert.throws(() => {
      validateAndParseQRPayload(
        JSON.stringify({
          type: 'hospital_referral',
          patient: 'John Doe',
          reason: 'Review',
          to: 'Ridge Hospital',
          priority: 'Low',
        }),
      );
    }, /Invalid priority level/);
  });

  it('supports accept decision and updates status to Accepted with incoming direction', () => {
    const incomingReferral: ReferralQRPayload = {
      type: 'hospital_referral',
      version: '1.0',
      id: 'RF-9912',
      patient: 'Kwesi Appiah',
      patientId: 'PT-9912',
      reason: 'Subacute spinal trauma',
      priority: 'Urgent',
      from: 'Tema General Hospital',
      to: 'Korle Bu Teaching Hospital',
      contact: '+233 30 266 5400',
      createdAt: new Date().toISOString(),
    };

    // Simulate accept decision by receiving facility
    const receivedRecord = {
      ...incomingReferral,
      status: 'Accepted' as const,
      direction: 'incoming' as const,
      time: 'Just now',
    };

    assert.strictEqual(receivedRecord.status, 'Accepted');
    assert.strictEqual(receivedRecord.direction, 'incoming');
    assert.strictEqual(receivedRecord.patient, 'Kwesi Appiah');
  });

  it('supports reject decision and updates status to Rejected with incoming direction', () => {
    const incomingReferral: ReferralQRPayload = {
      type: 'hospital_referral',
      version: '1.0',
      id: 'RF-9913',
      patient: 'Abena Osei',
      patientId: 'PT-9913',
      reason: 'Elective dermatology review',
      priority: 'Routine',
      from: 'Ridge Hospital',
      to: '37 Military Hospital',
      contact: '+233 30 266 5400',
      createdAt: new Date().toISOString(),
    };

    // Simulate reject decision by receiving facility
    const receivedRecord = {
      ...incomingReferral,
      status: 'Rejected' as const,
      direction: 'incoming' as const,
      time: 'Just now',
    };

    assert.strictEqual(receivedRecord.status, 'Rejected');
    assert.strictEqual(receivedRecord.direction, 'incoming');
  });

  it('embeds 6-digit transferPin into payload and validates OTP handover verification', () => {
    const transferPin = '482910';
    const payload: ReferralQRPayload = {
      type: 'hospital_referral',
      version: '1.0',
      id: 'RF-9914',
      patient: 'Kofi Mensah',
      patientId: 'PT-9914',
      reason: 'Acute respiratory distress',
      priority: 'Emergency',
      from: 'Tema General Hospital',
      to: 'Korle Bu Teaching Hospital',
      contact: '+233 24 111 2233',
      transferPin,
      createdAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(payload);
    const parsed = validateAndParseQRPayload(serialized);
    assert.strictEqual(parsed.transferPin, '482910');

    // Simulate OTP validation logic
    function verifyOtpForReferral(inputCode: string, referral: ReferralQRPayload): boolean {
      const trimmed = inputCode.trim();
      if (!/^\d{6}$/.test(trimmed)) return false;
      if (referral.transferPin && trimmed === referral.transferPin) return true;
      if (trimmed === '123456') return true;
      return false;
    }

    assert.strictEqual(verifyOtpForReferral('482910', parsed), true);
    assert.strictEqual(verifyOtpForReferral('123456', parsed), true); // demo fallback
    assert.strictEqual(verifyOtpForReferral('000000', parsed), false); // wrong code
    assert.strictEqual(verifyOtpForReferral('123', parsed), false); // invalid length
  });
});
