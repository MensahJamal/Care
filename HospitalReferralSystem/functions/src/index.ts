import sgMail from '@sendgrid/mail';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import twilio from 'twilio';

initializeApp();

const db = getFirestore();
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID');
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN');
const twilioFromPhone = defineSecret('TWILIO_FROM_PHONE');
const sendgridApiKey = defineSecret('SENDGRID_API_KEY');
const sendgridFromEmail = defineSecret('SENDGRID_FROM_EMAIL');
const otpSecret = defineSecret('OTP_SECRET');

function getOtpSecretKey(): string {
  try {
    const val = otpSecret.value();
    if (val) return val;
  } catch {
    // Falls through to process.env or emulator check
  }
  if (process.env.OTP_SECRET) {
    return process.env.OTP_SECRET;
  }
  if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV !== 'production') {
    return 'carelink-local-emulator-otp-salt-key';
  }
  throw new Error('Missing required secret: OTP_SECRET must be configured in production.');
}

function hashOtp(code: string) {
  return createHmac('sha256', getOtpSecretKey()).update(code).digest('hex');
}

function matchesOtp(code: string, expectedHash: string) {
  const actual = Buffer.from(hashOtp(code), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function formatReferralMessage(referralId: string, referral: FirebaseFirestore.DocumentData, otp: string) {
  return [
    `CareLink referral ${referralId}`,
    `Patient: ${referral.patient ?? 'Not provided'}`,
    `Clinical reason: ${referral.reason ?? 'Not provided'}`,
    `Priority: ${referral.priority ?? 'Routine'}`,
    `From: ${referral.from ?? 'Not provided'}`,
    `To: ${referral.to ?? 'Not provided'}`,
    '',
    `Your CareLink confirmation code is ${otp}. It expires in 10 minutes.`,
  ].join('\n');
}

export const deliverConfirmationPrompt = onDocumentCreated(
  {
    document: 'confirmationRequests/{requestId}',
    secrets: [twilioAccountSid, twilioAuthToken, twilioFromPhone, sendgridApiKey, sendgridFromEmail, otpSecret],
    region: 'us-central1',
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const request = snapshot.data();
    const requestRef = snapshot.ref;
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = Timestamp.fromMillis(Date.now() + 10 * 60 * 1000);

    await requestRef.update({
      otpHash: hashOtp(otp),
      otpExpiresAt,
      otpAttempts: 0,
      otpStatus: 'pending',
    });

    try {
      const referralSnapshot = await db.collection('referrals').doc(request.referralId).get();
      if (!referralSnapshot.exists) throw new Error('The referral linked to this request was not found.');

      const referral = referralSnapshot.data() ?? {};
      if (request.createdByUid && referral.createdByUid !== request.createdByUid) {
        throw new Error('The referral sender does not match the confirmation request.');
      }

      const message = formatReferralMessage(request.referralId, referral, otp);
      if (request.contactType === 'phone') {
        const client = twilio(twilioAccountSid.value(), twilioAuthToken.value());
        await client.messages.create({
          body: message,
          from: twilioFromPhone.value(),
          to: request.recipientContact.replace(/[\s().-]/g, ''),
        });
      } else if (request.contactType === 'email') {
        sgMail.setApiKey(sendgridApiKey.value());
        await sgMail.send({
          to: request.recipientContact.trim(),
          from: sendgridFromEmail.value(),
          subject: `Referral confirmation required: ${request.referralId}`,
          text: message,
        });
      } else {
        throw new Error('Unsupported confirmation contact type.');
      }

      await requestRef.update({
        deliveryStatus: 'sent',
        deliveredAt: FieldValue.serverTimestamp(),
        deliveryError: FieldValue.delete(),
      });
    } catch (error) {
      const deliveryError = error instanceof Error ? error.message : 'Unknown delivery error';
      await requestRef.update({
        deliveryStatus: 'failed',
        deliveryError,
        failedAt: FieldValue.serverTimestamp(),
      });
      console.error(`Confirmation delivery failed for ${event.params.requestId}: ${deliveryError}`);
    }
  },
);

export const confirmReferral = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to confirm a referral.');
  }

  // SEC-11: Validate caller role to ensure patients or unauthorized users cannot confirm/reject
  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!callerDoc.exists) {
    throw new HttpsError('permission-denied', 'Caller user profile not found.');
  }
  const callerRole = callerDoc.data()?.role;
  const authorizedRoles = ['specialist', 'referral_coordinator', 'hospital_admin', 'administrator', 'system_admin'];
  if (!authorizedRoles.includes(callerRole)) {
    throw new HttpsError('permission-denied', 'Only authorized clinical specialists, coordinators, and administrators can confirm or reject referrals.');
  }

  const requestId = request.data?.requestId;
  const decision = request.data?.decision;
  if (typeof requestId !== 'string' || !['accepted', 'rejected'].includes(decision)) {
    throw new HttpsError('invalid-argument', 'Provide a requestId and accepted or rejected decision.');
  }

  const requestRef = db.collection('confirmationRequests').doc(requestId);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) {
    throw new HttpsError('not-found', 'Confirmation request not found.');
  }

  const confirmation = requestSnapshot.data();
  const referralId = confirmation?.referralId;
  if (typeof referralId !== 'string') {
    throw new HttpsError('failed-precondition', 'Confirmation request has no referral.');
  }

  const referralStatus = decision === 'accepted' ? 'Accepted' : 'Rejected';
  const batch = db.batch();
  batch.update(requestRef, {
    status: decision,
    confirmedBy: request.auth.uid,
    confirmedAt: FieldValue.serverTimestamp(),
  });
  batch.update(db.collection('referrals').doc(referralId), {
    status: referralStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { ok: true, status: referralStatus };
});

export const verifyReferralOtp = onCall({ region: 'us-central1', secrets: [otpSecret] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to verify a referral code.');
  }

  const requestId = request.data?.requestId;
  const code = request.data?.code;
  if (typeof requestId !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    throw new HttpsError('invalid-argument', 'Provide a six-digit confirmation code and requestId.');
  }

  const requestRef = db.collection('confirmationRequests').doc(requestId);
  const verification = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(requestRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Confirmation request not found.');
    const data = snapshot.data() ?? {};
    const attempts = Number(data.otpAttempts ?? 0);
    const expiresAt = data.otpExpiresAt as Timestamp | undefined;

    if (data.otpStatus === 'verified') return { verified: true };
    if (attempts >= 5) throw new HttpsError('resource-exhausted', 'Too many attempts. Request a new code.');
    if (!expiresAt || expiresAt.toMillis() < Date.now()) {
      throw new HttpsError('deadline-exceeded', 'This confirmation code has expired.');
    }
    if (typeof data.otpHash !== 'string' || !matchesOtp(code, data.otpHash)) {
      transaction.update(requestRef, { otpAttempts: attempts + 1 });
      return { verified: false };
    }

    transaction.update(requestRef, {
      status: 'verified',
      otpStatus: 'verified',
      verifiedBy: request.auth!.uid,
      verifiedAt: FieldValue.serverTimestamp(),
    });
    return { verified: true };
  });

  if (!verification.verified) {
    throw new HttpsError('invalid-argument', 'The confirmation code is incorrect.');
  }
  return verification;
});

export const confirmHandover = onCall({ region: 'us-central1', secrets: [otpSecret] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Intake staff must be authenticated to confirm patient handover.');
  }

  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!callerDoc.exists) {
    throw new HttpsError('permission-denied', 'Caller user profile not found.');
  }
  const callerData = callerDoc.data();
  const callerRole = callerData?.role;
  const authorizedRoles = ['referral_coordinator', 'specialist', 'hospital_admin', 'administrator', 'system_admin'];
  if (!authorizedRoles.includes(callerRole)) {
    throw new HttpsError('permission-denied', 'Only authorized referral coordinators, intake staff, and specialists can confirm handovers.');
  }

  const { referralId, otpCode, paramedicName, ambulanceId, arrivalVitals } = request.data ?? {};
  if (typeof referralId !== 'string' || typeof otpCode !== 'string' || !/^\d{6}$/.test(otpCode.trim())) {
    throw new HttpsError('invalid-argument', 'Valid referralId and 6-digit handover OTP required.');
  }

  const trimmedCode = otpCode.trim();
  const referralRef = db.collection('referrals').doc(referralId);

  return await db.runTransaction(async (transaction) => {
    const refSnap = await transaction.get(referralRef);
    if (!refSnap.exists) {
      throw new HttpsError('not-found', 'Referral document not found.');
    }
    const referral = refSnap.data() ?? {};
    if (referral.status !== 'In transit' && referral.status !== 'Accepted') {
      throw new HttpsError('failed-precondition', `Cannot complete handover for referral in status: ${referral.status}`);
    }

    let isCodeValid = false;
    // Fast-path: Transfer PIN match from offline QR transfer card
    if (referral.transferPin && trimmedCode === referral.transferPin) {
      isCodeValid = true;
    } else {
      const reqQuery = await db.collection('confirmationRequests')
        .where('referralId', '==', referralId)
        .limit(1)
        .get();

      if (!reqQuery.empty) {
        const reqDoc = reqQuery.docs[0];
        const reqData = reqDoc.data();
        const attempts = Number(reqData.otpAttempts ?? 0);
        const expiresAt = reqData.otpExpiresAt as Timestamp | undefined;

        if (attempts >= 5) {
          throw new HttpsError('resource-exhausted', 'Too many failed verification attempts. Request a new code.');
        }
        if (expiresAt && expiresAt.toMillis() < Date.now()) {
          throw new HttpsError('deadline-exceeded', 'The transfer confirmation code has expired.');
        }
        if (typeof reqData.otpHash === 'string' && matchesOtp(trimmedCode, reqData.otpHash)) {
          isCodeValid = true;
          transaction.update(reqDoc.ref, {
            status: 'verified',
            otpStatus: 'verified',
            verifiedBy: request.auth!.uid,
            verifiedAt: FieldValue.serverTimestamp(),
          });
        } else {
          transaction.update(reqDoc.ref, { otpAttempts: attempts + 1 });
        }
      }
    }

    if (!isCodeValid) {
      throw new HttpsError('invalid-argument', 'The handover confirmation code or Transfer PIN is incorrect.');
    }

    // Atomically transition referral to 'Arrived' with immutable audit fields
    transaction.update(referralRef, {
      status: 'Arrived',
      handoverAt: FieldValue.serverTimestamp(),
      handoverByUid: request.auth!.uid,
      handoverByName: callerData?.displayName || 'Intake Officer',
      paramedicName: typeof paramedicName === 'string' && paramedicName.trim() ? paramedicName.trim() : 'Paramedic',
      ambulanceId: typeof ambulanceId === 'string' && ambulanceId.trim() ? ambulanceId.trim() : 'Emergency Transport',
      arrivalVitals: arrivalVitals || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Write audit log entry
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      event: 'PATIENT_HANDOVER_CONFIRMED',
      referralId,
      patientId: referral.patientId || null,
      receivingFacilityId: callerData?.facilityId || null,
      verifiedByUid: request.auth!.uid,
      verifiedByName: callerData?.displayName || 'Intake Officer',
      timestamp: FieldValue.serverTimestamp(),
      authType: 'DUAL_TOKEN_OTP',
    });

    return { ok: true, status: 'Arrived' as const };
  });
});

export const provisionStaffUser = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to provision user accounts.');
  }

  // Verify that the caller is a hospital_admin or system_admin
  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!callerDoc.exists) {
    throw new HttpsError('permission-denied', 'Caller user profile not found.');
  }
  const callerRole = callerDoc.data()?.role;
  const isSysAdmin = callerRole === 'system_admin';
  const isHospAdmin = callerRole === 'hospital_admin' || callerRole === 'administrator';

  if (!isSysAdmin && !isHospAdmin) {
    throw new HttpsError('permission-denied', 'Only Hospital Administrators and System Administrators can provision staff accounts.');
  }

  const { email, password, displayName, role, jobTitle, facilityId, facilityName, phone } = request.data ?? {};

  if (typeof email !== 'string' || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'A valid email address is required.');
  }

  // Hospital Admins cannot provision system_admin accounts
  if (role === 'system_admin' && !isSysAdmin) {
    throw new HttpsError('permission-denied', 'Only IT Super Admins can provision System Administrator accounts.');
  }

  // QA-01: Generate secure temporary password server-side if not provided
  const tempPassword = (typeof password === 'string' && password.length >= 8)
    ? password
    : `CareLink#${randomBytes(4).toString('hex')}!`;

  // SEC-06: Validate targetFacilityId
  let targetFacilityId = callerDoc.data()?.facilityId || 'KBTH-01';
  let targetFacilityName = callerDoc.data()?.facilityName || 'Assigned Hospital';

  if (isSysAdmin && facilityId) {
    if (typeof facilityId !== 'string' || !/^[A-Z0-9_-]{2,20}$/i.test(facilityId)) {
      throw new HttpsError('invalid-argument', 'Invalid facility ID format.');
    }
    targetFacilityId = facilityId.trim();
    targetFacilityName = typeof facilityName === 'string' && facilityName.trim() ? facilityName.trim() : 'Assigned Hospital';
  }

  try {
    const adminAuth = getAuth();
    const newUser = await adminAuth.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      displayName: displayName || 'Staff Member',
    });

    const userProfile = {
      uid: newUser.uid,
      displayName: displayName || 'Staff Member',
      email: email.trim().toLowerCase(),
      role: role || 'pcp',
      jobTitle: jobTitle || 'Clinical Staff',
      facilityName: targetFacilityName,
      facilityId: targetFacilityId,
      phone: phone || '',
      notificationsEnabled: true,
      twoStepEnabled: role === 'hospital_admin' || role === 'system_admin',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      provisionedBy: request.auth.uid,
    };

    await db.collection('users').doc(newUser.uid).set(userProfile);

    return { ok: true, uid: newUser.uid, user: userProfile, tempPassword };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Provisioning failed';
    throw new HttpsError('internal', errMsg);
  }
});

