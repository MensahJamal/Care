import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import {
    createReferral,
    subscribeToReferrals,
    subscribeToResources,
    updateReferralStatus,
    updateResourceBeds,
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

type ReferralContextValue = {
  referrals: Referral[];
  resources: HospitalResource[];
  loading: boolean;
  error: string | null;
  decideReferral: (id: string, status: 'Accepted' | 'Rejected') => Promise<void>;
  addReferral: (input: Pick<Referral, 'patient' | 'reason' | 'priority' | 'to' | 'contact'>) => Promise<boolean>;
  updateBeds: (id: string, beds: number) => Promise<void>;
};

const ReferralContext = createContext<ReferralContextValue | null>(null);

export function ReferralProvider({ children }: PropsWithChildren) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [resources, setResources] = useState(initialResources);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !user) return;

    let referralUnsubscribe: (() => void) | undefined;
    let resourceUnsubscribe: (() => void) | undefined;
    let mounted = true;

    referralUnsubscribe = subscribeToReferrals(setReferrals, (nextError) => setError(nextError.message));
    resourceUnsubscribe = subscribeToResources(setResources, (nextError) => setError(nextError.message));
    setLoading(false);

    return () => {
      mounted = false;
      referralUnsubscribe?.();
      resourceUnsubscribe?.();
    };
  }, [user]);

  const value = useMemo<ReferralContextValue>(
    () => ({
      referrals,
      resources,
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
        if (isFirebaseConfigured) {
          await createReferral({
            ...input,
            patientId: `PT-${11000 + referrals.length}`,
            from: 'Korle Bu Teaching Hospital',
            status: 'Pending',
            direction: 'sent',
          });
          return true;
        }
        setReferrals((current) => [
          {
            ...input,
            id: `RF-${2050 + current.length}`,
            patientId: `PT-${11000 + current.length}`,
            from: 'Korle Bu Teaching Hospital',
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
          current.map((resource) =>
            resource.id === id
              ? {
                  ...resource,
                  beds: nextBeds,
                  lastUpdated: 'Updated now',
                }
              : resource,
          ),
        );
      },
    }),
    [error, loading, referrals, resources],
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
