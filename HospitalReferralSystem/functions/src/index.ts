import sgMail from '@sendgrid/mail';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createHash, timingSafeEqual } from 'node:crypto';
import twilio from 'twilio';

initializeApp();

const db = getFirestore();
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID');
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN');
const twilioFromPhone = defineSecret('TWILIO_FROM_PHONE');
const sendgridApiKey = defineSecret('SENDGRID_API_KEY');
const sendgridFromEmail = defineSecret('SENDGRID_FROM_EMAIL');

function hashOtp(code: string) {
  return createHash('sha256').update(code).digest('hex');
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
    secrets: [twilioAccountSid, twilioAuthToken, twilioFromPhone, sendgridApiKey, sendgridFromEmail],
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

export const verifyReferralOtp = onCall({ region: 'us-central1' }, async (request) => {
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
