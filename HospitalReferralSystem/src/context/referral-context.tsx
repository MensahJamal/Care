import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import {
    createReferral,
    type Specialist,
    subscribeToReferrals,
    subscribeToResources,
    subscribeToSpecialists,
    updateReferralStatus,
    updateResourceBeds,
    updateSpecialistStatus as firestoreUpdateSpecialistStatus,
} from '@/lib/firestore';

export type ReferralStatus = 'Pending' | 'Accepted' | 'Rejected' | 'In transit';
export type ReferralDirection = 'incoming' | 'sent';

export type Referral = {
  id: string;
  patient: string;
  patientId: string;
  reason: string;
  priority: 'Emergency' | 'Urgent' | 'Routine';
  from: string;
  to: string;
  fromFacilityId?: string;
  toFacilityId?: string;
  time: string;
  status: ReferralStatus;
  direction: ReferralDirection;
  contact: string;
};

export type HospitalResource = {
  id: string;
  name: string;
  distance: string;
  beds: number;
  totalBeds: number;
  specialists: number;
  specialties: string[];
  lastUpdated: string;
};

// Re-export for convenience so screens only need one context import
export type { Specialist };

// ─── Demo / seed data (used when Firebase is not configured) ──────────────────

const initialReferrals: Referral[] = [
  {
    id: 'RF-2048',
    patient: 'Ama Owusu',
    patientId: 'PT-10942',
    reason: 'Acute respiratory distress',
    priority: 'Emergency',
    from: 'Ridge Hospital',
    to: 'Korle Bu Teaching Hospital',
    time: '10 min ago',
    status: 'Pending',
    direction: 'incoming',
    contact: '+233 24 555 0138',
  },
  {
    id: 'RF-2047',
    patient: 'Kwame Mensah',
    patientId: 'PT-10935',
    reason: 'Suspected ischemic stroke',
    priority: 'Urgent',
    from: 'Tema General Hospital',
    to: 'Korle Bu Teaching Hospital',
    time: '35 min ago',
    status: 'Pending',
    direction: 'incoming',
    contact: 'referrals@temageneral.org',
  },
  {
    id: 'RF-2043',
    patient: 'Esi Boateng',
    patientId: 'PT-10898',
    reason: 'Neonatal intensive care',
    priority: 'Urgent',
    from: 'Korle Bu Teaching Hospital',
    to: 'Princess Marie Louise Hospital',
    time: '2 hrs ago',
    status: 'Accepted',
    direction: 'sent',
    contact: '+233 30 266 2540',
  },
  {
    id: 'RF-2039',
    patient: 'Yaw Adjei',
    patientId: 'PT-10861',
    reason: 'Orthopaedic trauma review',
    priority: 'Routine',
    from: 'Korle Bu Teaching Hospital',
    to: '37 Military Hospital',
    time: 'Yesterday',
    status: 'In transit',
    direction: 'sent',
    contact: 'referrals@37military.gov.gh',
  },
];

const initialResources: HospitalResource[] = [
  {
    id: 'kbth',
    name: 'Korle Bu Teaching Hospital',
    distance: 'Your facility',
    beds: 24,
    totalBeds: 180,
    specialists: 12,
    specialties: ['Cardiology', 'Neurology', 'Trauma'],
    lastUpdated: 'Updated now',
  },
  {
    id: 'ridge',
    name: 'Ridge Hospital',
    distance: '4.2 km away',
    beds: 18,
    totalBeds: 96,
    specialists: 7,
    specialties: ['Emergency', 'Obstetrics', 'Surgery'],
    lastUpdated: 'Updated 8 min ago',
  },
  {
    id: '37mil',
    name: '37 Military Hospital',
    distance: '7.8 km away',
    beds: 8,
    totalBeds: 84,
    specialists: 9,
    specialties: ['Trauma', 'Orthopaedics', 'ICU'],
    lastUpdated: 'Updated 14 min ago',
  },
  {
    id: 'tema',
    name: 'Tema General Hospital',
    distance: '29 km away',
    beds: 31,
    totalBeds: 120,
    specialists: 5,
    specialties: ['Paediatrics', 'Medicine', 'Dialysis'],
    lastUpdated: 'Updated 21 min ago',
  },
];

/**
 * Temporary demo specialist roster.
 * In Firebase mode this is replaced by real-time data from the `specialists` collection,
 * filtered by the signed-in user's facilityId.
 */
const initialSpecialists: Specialist[] = [
  {
    id: 's1',
    name: 'Dr. Naa Lartey',
    specialty: 'Cardiology',
    departmentId: 'd1',
    isOnCall: true,
    status: 'On call',
    facilityId: 'KBTH-01',
  },
  {
    id: 's2',
    name: 'Dr. Kojo Arthur',
    specialty: 'Neurology',
    departmentId: 'd2',
    isOnCall: true,
    status: 'Available',
    facilityId: 'KBTH-01',
  },
  {
    id: 's3',
    name: 'Dr. Abena Tetteh',
    specialty: 'Trauma Surgery',
    departmentId: 'd3',
    isOnCall: false,
    status: 'In theatre',
    facilityId: 'KBTH-01',
  },
];

// ─── Context type ─────────────────────────────────────────────────────────────

type ReferralContextValue = {
  referrals: Referral[];
  resources: HospitalResource[];
  /** Live specialist roster for the signed-in user's facility */
  specialists: Specialist[];
  loading: boolean;
  error: string | null;
  decideReferral: (id: string, status: 'Accepted' | 'Rejected') => Promise<void>;
  addReferral: (input: Pick<Referral, 'patient' | 'reason' | 'priority' | 'to' | 'contact'>) => Promise<boolean>;
  updateBeds: (id: string, beds: number) => Promise<void>;
  updateSpecialistStatus: (id: string, isOnCall: boolean) => Promise<void>;
};

const ReferralContext = createContext<ReferralContextValue | null>(null);

export function ReferralProvider({ children }: PropsWithChildren) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [resources, setResources] = useState(initialResources);
  const [specialists, setSpecialists] = useState<Specialist[]>(initialSpecialists);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    // If Firebase is not configured or no signed-in user, stay on demo data
    if (!isFirebaseConfigured || !auth || !user) {
      return;
    }

    const isCoordinatorOrAdmin =
      profile?.role === 'referral_coordinator' ||
      profile?.role === 'hospital_admin' ||
      profile?.role === 'system_admin';
    // Admins and coordinators monitor full network; clinicians subscribe scoped to their own facility
    const facilityScoped = isCoordinatorOrAdmin ? undefined : (profile?.facilityId ?? 'KBTH-01');

    const referralUnsubscribe = subscribeToReferrals(
      facilityScoped,
      (data) => {
        setReferrals(data);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError.message);
        setLoading(false);
      },
    );
    const resourceUnsubscribe = subscribeToResources(
      setResources,
      (nextError) => setError(nextError.message),
    );
    const targetFacilityId = profile?.facilityId ?? 'KBTH-01';
    const specialistUnsubscribe = subscribeToSpecialists(
      targetFacilityId,
      setSpecialists,
      (nextError) => setError(nextError.message),
    );

    return () => {
      referralUnsubscribe?.();
      resourceUnsubscribe?.();
      specialistUnsubscribe?.();
    };
  }, [user, profile?.facilityId, profile?.role]);

  const value = useMemo<ReferralContextValue>(
    () => ({
      referrals,
      resources,
      specialists,
      loading,
      error,

      decideReferral: async (id, status) => {
        if (isFirebaseConfigured) {
          await updateReferralStatus(id, status);
          return;
        }
        setReferrals((current) =>
          current.map((referral) => (referral.id === id ? { ...referral, status } : referral)),
        );
      },

      addReferral: async (input) => {
        // Always use the signed-in user's facility name so multi-tenant data is correct
        const from = profile?.facilityName ?? 'Korle Bu Teaching Hospital';
        const fromFacilityId = profile?.facilityId ?? 'KBTH-01';
        const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
        const patientId = `PT-${uniqueSuffix}`;
        if (isFirebaseConfigured) {
          await createReferral({
            ...input,
            patientId,
            from,
            fromFacilityId,
            status: 'Pending',
            direction: 'sent',
          });
          return true;
        }
        setReferrals((current) => [
          {
            ...input,
            id: `RF-${uniqueSuffix}`,
            patientId,
            from,
            fromFacilityId,
            time: 'Just now',
            status: 'Pending',
            direction: 'sent',
          },
          ...current,
        ]);
        return false;
      },

      updateBeds: async (id, beds) => {
        const resource = resources.find((item) => item.id === id);
        if (!resource) return;
        const nextBeds = Math.max(0, Math.min(resource.totalBeds, beds));
        if (isFirebaseConfigured) {
          await updateResourceBeds(id, nextBeds);
          return;
        }
        setResources((current) =>
          current.map((r) =>
            r.id === id ? { ...r, beds: nextBeds, lastUpdated: 'Updated now' } : r,
          ),
        );
      },

      updateSpecialistStatus: async (id, isOnCall) => {
        if (isFirebaseConfigured) {
          await firestoreUpdateSpecialistStatus(id, isOnCall);
          return;
        }
        setSpecialists((current) =>
          current.map((specialist) =>
            specialist.id === id
              ? {
                  ...specialist,
                  isOnCall,
                  status: isOnCall ? 'Available' : ('Unavailable' as Specialist['status']),
                }
              : specialist,
          ),
        );
      },
    }),
    [error, loading, referrals, resources, specialists, profile?.facilityName, profile?.facilityId],
  );

  return <ReferralContext.Provider value={value}>{children}</ReferralContext.Provider>;
}

export function useReferrals() {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error('useReferrals must be used inside ReferralProvider');
  }
  return context;
}
