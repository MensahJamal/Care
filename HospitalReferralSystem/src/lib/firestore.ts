import type { HospitalResource, Referral, ReferralStatus } from '@/context/referral-context';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import {
    collection,
    doc,
    onSnapshot,
    serverTimestamp,
    setDoc,
    updateDoc,
    writeBatch,
    type DocumentData,
    type Unsubscribe,
} from 'firebase/firestore';

export type UserRole = 'administrator' | 'staff';

export type UserProfile = {
  displayName: string;
  email: string;
  role: UserRole;
  jobTitle: string;
  facilityName: string;
  facilityId: string;
  phone: string;
  notificationsEnabled?: boolean;
  twoStepEnabled?: boolean;
};

const referralsCollection = () => collection(db!, 'referrals');
const resourcesCollection = () => collection(db!, 'resources');

export async function getUserProfile(uid: string, user: User): Promise<UserProfile> {
  const { getDoc } = await import('firebase/firestore');
  const snapshot = await getDoc(doc(db!, 'users', uid));
  const data = snapshot.data() ?? {};
  return {
    displayName: data.displayName ?? user.displayName ?? user.email?.split('@')[0] ?? 'Clinical user',
    email: data.email ?? user.email ?? '',
    role: data.role === 'administrator' ? 'administrator' : 'staff',
    jobTitle: data.jobTitle ?? 'Clinical staff',
    facilityName: data.facilityName ?? 'Assigned facility',
    facilityId: data.facilityId ?? '',
    phone: data.phone ?? user.phoneNumber ?? 'Not provided',
    notificationsEnabled: data.notificationsEnabled ?? true,
    twoStepEnabled: data.twoStepEnabled ?? false,
  };
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  await setDoc(doc(db!, 'users', uid), updates, { merge: true });
}

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

function mapReferral(id: string, data: DocumentData): Referral {
  return {
    id,
    patient: data.patient ?? '',
    patientId: data.patientId ?? '',
    reason: data.reason ?? '',
    priority: data.priority ?? 'Routine',
    from: data.from ?? '',
    to: data.to ?? '',
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

export function subscribeToReferrals(
  onData: (referrals: Referral[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    referralsCollection(),
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

export async function createReferral(input: Omit<Referral, 'id' | 'time'>) {
  const senderUid = auth?.currentUser?.uid;
  if (!senderUid) throw new Error('You must be signed in to send a referral.');

  const batch = writeBatch(db!);
  const referral = doc(referralsCollection());
  batch.set(referral, { ...input, createdByUid: senderUid, createdAt: serverTimestamp() });
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
