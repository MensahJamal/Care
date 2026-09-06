import type { HospitalResource, Referral, ReferralStatus } from '@/context/referral-context';
import { auth, db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import {
    collection,
    doc,
    getDocs,
    limit,
    onSnapshot,
    or,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
    type DocumentData,
    type Unsubscribe,
} from 'firebase/firestore';


// ─── Specialist / Department / Patient / Roster types ─────────────────────────

export type Specialist = {
  id: string;
  name: string;
  specialty: string;
  departmentId: string;
  isOnCall: boolean;
  email?: string;
  profilePhotoUrl?: string;
  /** Derived from isOnCall + any manual status set in Firestore */
  status: 'On call' | 'Available' | 'In theatre' | 'Unavailable';
  facilityId: string;
};

export type Department = {
  id: string;
  name: string;
  headPhysicianId: string;
  contactPhone?: string;
  facilityId: string;
};

export type Patient = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  medicalRecordNumber: string;
  contactNumber?: string;
  facilityId: string;
};

export type RosterSlot = {
  id: string;
  specialistId: string;
  startTime: string;
  endTime: string;
  locationRoom?: string;
};

export type ConfirmationRequest = {
  id: string;
  referralId: string;
  createdByUid: string;
  recipientHospital: string;
  recipientContact: string;
  contactType: 'email' | 'phone';
  status: string;
  otpStatus?: string;
};

// ─── Collection helpers ───────────────────────────────────────────────────────

const referralsCollection = () => collection(db!, 'referrals');
const resourcesCollection = () => collection(db!, 'resources');
const specialistsCollection = () => collection(db!, 'specialists');
const confirmationRequestsCollection = () => collection(db!, 'confirmationRequests');


// ─── Timestamp helper ─────────────────────────────────────────────────────────

function formatTimestamp(value: unknown, fallback: string) {
  if (!value) return fallback;
  const timestamp = value as { toDate?: () => Date };
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return fallback;

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hrs ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}

// ─── Map helpers ──────────────────────────────────────────────────────────────

function mapReferral(id: string, data: DocumentData): Referral {
  return {
    id,
    patient: data.patient ?? '',
    patientId: data.patientId ?? '',
    reason: data.reason ?? '',
    priority: data.priority ?? 'Routine',
    from: data.from ?? '',
    to: data.to ?? '',
    fromFacilityId: data.fromFacilityId,
    toFacilityId: data.toFacilityId,
    time: formatTimestamp(data.createdAt, data.time ?? 'Recently'),
    status: data.status ?? 'Pending',
    direction: data.direction ?? 'sent',
    contact: data.contact ?? '',
  };
}

function mapResource(id: string, data: DocumentData): HospitalResource {
  return {
    id,
    name: data.name ?? '',
    distance: data.distance ?? '',
    beds: data.beds ?? 0,
    totalBeds: data.totalBeds ?? 0,
    specialists: data.specialists ?? 0,
    specialties: data.specialties ?? [],
    lastUpdated: formatTimestamp(data.updatedAt, 'Updated recently'),
  };
}

function mapSpecialist(id: string, data: DocumentData): Specialist {
  const isOnCall = data.isOnCall ?? false;
  return {
    id,
    name: data.name ?? '',
    specialty: data.specialty ?? '',
    departmentId: data.departmentId ?? '',
    isOnCall,
    email: data.email,
    profilePhotoUrl: data.profilePhotoUrl,
    status: data.status ?? (isOnCall ? 'Available' : 'Unavailable'),
    facilityId: data.facilityId ?? '',
  };
}

// ─── Referral subscriptions ───────────────────────────────────────────────────

export function subscribeToReferrals(
  facilityId: string | undefined,
  onData: (referrals: Referral[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = facilityId && facilityId !== 'ALL'
    ? query(
        referralsCollection(),
        or(where('fromFacilityId', '==', facilityId), where('toFacilityId', '==', facilityId)),
      )
    : referralsCollection();

  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapReferral(item.id, item.data()))),
    onError,
  );
}

export function subscribeToResources(
  onData: (resources: HospitalResource[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    resourcesCollection(),
    (snapshot) => onData(snapshot.docs.map((item) => mapResource(item.id, item.data()))),
    onError,
  );
}

// ─── Specialist subscriptions ─────────────────────────────────────────────────

export function subscribeToSpecialists(
  facilityId: string,
  onData: (specialists: Specialist[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(specialistsCollection(), where('facilityId', '==', facilityId));
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapSpecialist(item.id, item.data()))),
    onError,
  );
}

// ─── Staff & Users subscriptions ──────────────────────────────────────────────

export function subscribeToUsers(
  facilityId: string | undefined,
  onData: (users: DocumentData[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const usersCol = collection(db!, 'users');
  const q = facilityId && facilityId !== 'ALL'
    ? query(usersCol, where('facilityId', '==', facilityId))
    : usersCol;
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

// ─── Referral mutations ───────────────────────────────────────────────────────

export async function createReferral(input: Omit<Referral, 'id' | 'time'>) {
  const senderUid = auth?.currentUser?.uid;
  if (!senderUid) throw new Error('You must be signed in to send a referral.');

  const batch = writeBatch(db!);
  const referral = doc(referralsCollection());
  batch.set(referral, {
    ...input,
    fromFacilityId: input.fromFacilityId ?? 'KBTH-01',
    toFacilityId: input.toFacilityId ?? 'KBTH-01',
    createdByUid: senderUid,
    createdAt: serverTimestamp(),
  });
  const contactType = input.contact.includes('@') ? 'email' : 'phone';
  batch.set(doc(collection(db!, 'confirmationRequests')), {
    referralId: referral.id,
    createdByUid: senderUid,
    recipientHospital: input.to,
    recipientContact: input.contact,
    contactType,
    status: 'pending',
    prompt: `Please confirm referral ${referral.id} for ${input.patient}.`,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return referral.id;
}

export async function updateReferralStatus(id: string, status: ReferralStatus) {
  await updateDoc(doc(db!, 'referrals', id), { status, updatedAt: serverTimestamp() });
}

export async function updateResourceBeds(id: string, beds: number) {
  await updateDoc(doc(db!, 'resources', id), { beds, updatedAt: serverTimestamp() });
}

// ─── Specialist mutations ─────────────────────────────────────────────────────

export async function updateSpecialistStatus(id: string, isOnCall: boolean) {
  const status: Specialist['status'] = isOnCall ? 'Available' : 'Unavailable';
  await updateDoc(doc(db!, 'specialists', id), { isOnCall, status, updatedAt: serverTimestamp() });
}

// ─── Confirmation request queries ─────────────────────────────────────────────

/**
 * Looks up the confirmationRequest linked to a referral.
 * Used by the OTP acceptance flow to obtain the requestId required by verifyReferralOtp.
 */
export async function getConfirmationRequestByReferral(referralId: string): Promise<ConfirmationRequest | null> {
  const q = query(confirmationRequestsCollection(), where('referralId', '==', referralId), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as ConfirmationRequest;
}

// ─── Cloud Function calls ─────────────────────────────────────────────────────

export async function callConfirmReferral(requestId: string, decision: 'accepted' | 'rejected') {
  if (functions) {
    const fn = httpsCallable<{ requestId: string; decision: string }, { ok: boolean; status: ReferralStatus }>(
      functions,
      'confirmReferral',
    );
    const result = await fn({ requestId, decision });
    return result.data;
  }
  return { ok: true, status: decision === 'accepted' ? ('Accepted' as ReferralStatus) : ('Rejected' as ReferralStatus) };
}

export async function callVerifyOtp(requestId: string, code: string) {
  if (functions) {
    const fn = httpsCallable<{ requestId: string; code: string }, { verified: boolean }>(
      functions,
      'verifyReferralOtp',
    );
    const result = await fn({ requestId, code });
    return result.data;
  }
  return { verified: true };
}

export type ProvisionUserInput = {
  email: string;
  password?: string;
  displayName: string;
  role: string;
  jobTitle?: string;
  facilityId?: string;
  facilityName?: string;
  phone?: string;
};

export async function callProvisionStaffUser(input: ProvisionUserInput) {
  if (functions) {
    const fn = httpsCallable<ProvisionUserInput, { ok: boolean; uid: string; user: DocumentData; tempPassword?: string }>(
      functions,
      'provisionStaffUser',
    );
    const result = await fn(input);
    return result.data;
  }
  return { ok: true, uid: `prov-${Date.now()}`, user: input, tempPassword: input.password };
}
