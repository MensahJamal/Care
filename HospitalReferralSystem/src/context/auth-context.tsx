import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { AppRole, ROLE_DEFINITIONS } from '@/constants/roles';

export type { AppRole };

export type PortalRole =
  | AppRole
  | 'hospital'
  | 'administrator';

export type HospitalJobTitle =
  | 'Doctor'
  | 'Nurse'
  | 'Consultant'
  | 'Intake Officer'
  | 'Lab Scientist'
  | 'Pharmacist'
  | 'Administrator'
  | 'Patient';

export type AppUserProfile = {
  uid: string;
  displayName: string;
  email: string;
  role: AppRole;
  jobTitle: string;
  facilityName: string;
  facilityId: string;
  phone: string;
  notificationsEnabled: boolean;
  twoStepEnabled: boolean;
};

export type SignUpPayload = {
  fullName: string;
  email: string;
  password: string;
  role?: AppRole;
  jobTitle?: string;
  facilityName?: string;
  facilityId?: string;
  phone?: string;
};

export const DEMO_PROFILES: Record<AppRole, AppUserProfile> = {
  patient: {
    uid: 'demo-patient-uid',
    displayName: 'Ama Serwaa Owusu',
    email: 'patient@carelink.local',
    role: 'patient',
    jobTitle: 'Registered Patient',
    facilityName: 'Korle Bu Teaching Hospital',
    facilityId: 'KBTH-01',
    phone: '+233 24 555 0191',
    notificationsEnabled: true,
    twoStepEnabled: false,
  },
  pcp: {
    uid: 'demo-pcp-uid',
    displayName: 'Dr. Kwame Addo',
    email: 'pcp@carelink.local',
    role: 'pcp',
    jobTitle: 'Primary Care Physician / SMO',
    facilityName: 'Ridge Hospital PolyClinic',
    facilityId: 'RDG-02',
    phone: '+233 24 555 0199',
    notificationsEnabled: true,
    twoStepEnabled: false,
  },
  specialist: {
    uid: 'demo-specialist-uid',
    displayName: 'Dr. Naa Lartey',
    email: 'specialist@carelink.local',
    role: 'specialist',
    jobTitle: 'Senior Consultant Cardiologist',
    facilityName: 'Korle Bu Teaching Hospital',
    facilityId: 'KBTH-01',
    phone: '+233 24 555 0244',
    notificationsEnabled: true,
    twoStepEnabled: false,
  },
  referral_coordinator: {
    uid: 'demo-coordinator-uid',
    displayName: 'Kofi Manu',
    email: 'coordinator@carelink.local',
    role: 'referral_coordinator',
    jobTitle: 'Senior Referral & Intake Coordinator',
    facilityName: 'Korle Bu Central Triage',
    facilityId: 'KBTH-01',
    phone: '+233 24 555 0155',
    notificationsEnabled: true,
    twoStepEnabled: false,
  },
  hospital_admin: {
    uid: 'demo-hospadmin-uid',
    displayName: 'Administrator Mensah',
    email: 'hospadmin@carelink.local',
    role: 'hospital_admin',
    jobTitle: 'Director of Clinical Operations',
    facilityName: 'Korle Bu Teaching Hospital',
    facilityId: 'KBTH-01',
    phone: '+233 24 555 0100',
    notificationsEnabled: true,
    twoStepEnabled: true,
  },
  system_admin: {
    uid: 'demo-sysadmin-uid',
    displayName: 'Emmanuel Asare',
    email: 'sysadmin@carelink.local',
    role: 'system_admin',
    jobTitle: 'National Health IT Director',
    facilityName: 'National Referral Health Exchange',
    facilityId: 'HQ-SYS-001',
    phone: '+233 20 555 9900',
    notificationsEnabled: true,
    twoStepEnabled: true,
  },
  lab_technician: {
    uid: 'demo-lab-uid',
    displayName: 'Akosua Darko',
    email: 'lab@carelink.local',
    role: 'lab_technician',
    jobTitle: 'Lead Medical Laboratory Scientist',
    facilityName: 'Korle Bu Pathology & Diagnostics',
    facilityId: 'KBTH-01',
    phone: '+233 24 555 0331',
    notificationsEnabled: true,
    twoStepEnabled: false,
  },
  pharmacist: {
    uid: 'demo-pharm-uid',
    displayName: 'Pharm. David Osei',
    email: 'pharmacy@carelink.local',
    role: 'pharmacist',
    jobTitle: 'Clinical Specialist Pharmacist',
    facilityName: 'Korle Bu Central Pharmacy',
    facilityId: 'KBTH-01',
    phone: '+233 24 555 0412',
    notificationsEnabled: true,
    twoStepEnabled: false,
  },
};

// Legacy exports for backwards compatibility
export const demoStaffProfile: AppUserProfile = DEMO_PROFILES.pcp;
export const demoAdminProfile: AppUserProfile = DEMO_PROFILES.hospital_admin;

type AuthContextType = {
  user: User | null;
  profile: AppUserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isFirebaseMode: boolean;

  signIn: (
    email: string,
    password: string,
    portal?: PortalRole,
  ) => Promise<AppUserProfile>;

  signUp: (
    payload: SignUpPayload,
  ) => Promise<AppUserProfile>;

  signOut: () => Promise<void>;
  signOutUser: () => Promise<void>;

  resetPassword: (
    email: string,
  ) => Promise<void>;

  refreshProfile: () => Promise<void>;
  editProfile: (updates: Partial<AppUserProfile>) => Promise<void>;
  registerProvisionedAccount: (newProfile: AppUserProfile, tempPassword: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password must contain at least 8 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your administrator.';
    case 'auth/network-request-failed':
      return 'Unable to connect to Firebase. Check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    default:
      return error instanceof Error
        ? error.message
        : 'Authentication failed. Please try again.';
  }
}

function normalizeRole(rawRole: string | undefined): AppRole {
  if (!rawRole) {
    throw new Error('User profile role is not configured.');
  }
  if (rawRole === 'administrator') return 'hospital_admin';
  if (rawRole === 'staff') return 'pcp';
  if (rawRole in DEMO_PROFILES) return rawRole as AppRole;
  throw new Error(`Unauthorized or unrecognized role "${rawRole}". Please contact your administrator.`);
}

async function readProfile(firebaseUser: User): Promise<AppUserProfile> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));

  if (!snapshot.exists()) {
    throw new Error(
      'Your account exists, but your CareLink profile has not been configured yet. Contact your administrator.',
    );
  }

  const data = snapshot.data();
  const role = normalizeRole(data.role);

  return {
    uid: firebaseUser.uid,
    displayName:
      data.displayName ??
      firebaseUser.displayName ??
      ROLE_DEFINITIONS[role]?.demoCredentials.displayName ??
      'CareLink User',
    email: data.email ?? firebaseUser.email ?? '',
    role,
    jobTitle: data.jobTitle ?? ROLE_DEFINITIONS[role]?.demoCredentials.jobTitle ?? 'Clinical Staff',
    facilityName: data.facilityName ?? 'Korle Bu Teaching Hospital',
    facilityId: data.facilityId ?? 'KBTH-01',
    phone: data.phone ?? firebaseUser.phoneNumber ?? '',
    notificationsEnabled: data.notificationsEnabled ?? true,
    twoStepEnabled: data.twoStepEnabled ?? false,
  };
}

// Registry for dynamically provisioned demo accounts (persisted across reloads on web via sessionStorage)
const DEMO_REGISTRY_KEY = 'carelink_provisioned_demo_registry';

function loadProvisionedDemoRegistry(): Map<string, { profile: AppUserProfile; password: string }> {
  const map = new Map<string, { profile: AppUserProfile; password: string }>();
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(DEMO_REGISTRY_KEY);
      if (raw) {
        const entries = JSON.parse(raw) as [string, { profile: AppUserProfile; password: string }][];
        for (const [k, v] of entries) {
          map.set(k, v);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return map;
}

function persistProvisionedDemoRegistry(registry: Map<string, { profile: AppUserProfile; password: string }>) {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(DEMO_REGISTRY_KEY, JSON.stringify(Array.from(registry.entries())));
    } catch {
      // Ignore storage errors
    }
  }
}

const provisionedDemoRegistry = loadProvisionedDemoRegistry();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(auth && isFirebaseConfigured));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setUser(firebaseUser);
      setError(null);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const nextProfile = await readProfile(firebaseUser);
        setProfile(nextProfile);
      } catch (err) {
        setProfile(null);
        setError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  function registerProvisionedAccount(newProfile: AppUserProfile, tempPassword: string) {
    provisionedDemoRegistry.set(newProfile.email.trim().toLowerCase(), {
      profile: newProfile,
      password: tempPassword,
    });
    persistProvisionedDemoRegistry(provisionedDemoRegistry);
  }

  async function signIn(
    email: string,
    password: string,
    portal?: PortalRole,
  ): Promise<AppUserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    setError(null);

    if (!isFirebaseConfigured || !auth || !db) {
      // ── Offline Demo Mode Authentication ──
      let matchedProfile: AppUserProfile | null = null;
      let expectedPassword = 'demo1234';

      // 1. Check newly provisioned demo accounts
      if (provisionedDemoRegistry.has(cleanEmail)) {
        const item = provisionedDemoRegistry.get(cleanEmail)!;
        matchedProfile = item.profile;
        expectedPassword = item.password;
      } else {
        // 2. Check predefined demo profiles
        const matchedDemoRole = (Object.keys(DEMO_PROFILES) as AppRole[]).find((r) => {
          const demoEmail = DEMO_PROFILES[r].email.toLowerCase();
          return cleanEmail === demoEmail;
        });

        if (matchedDemoRole) {
          matchedProfile = DEMO_PROFILES[matchedDemoRole];
        } else if (cleanEmail === 'demo@carelink.local') {
          matchedProfile = DEMO_PROFILES.pcp;
        } else if (cleanEmail === 'admin@carelink.local') {
          matchedProfile = DEMO_PROFILES.hospital_admin;
        }
      }

      if (!matchedProfile) {
        throw new Error('Invalid email or password. Please verify your credentials.');
      }

      if (password !== expectedPassword) {
        throw new Error('Incorrect password. For testing default accounts, use "demo1234".');
      }

      // Strict role check against portal requested if specified
      if (portal && portal in DEMO_PROFILES && portal !== matchedProfile.role) {
        throw new Error(
          'Access Denied: You do not have permission to access the selected portal.',
        );
      }

      if (portal === 'administrator' && matchedProfile.role !== 'hospital_admin' && matchedProfile.role !== 'system_admin') {
        throw new Error('Access Denied: Administrator portal requires an administrative account.');
      }

      setUser(null);
      setProfile(matchedProfile);
      return matchedProfile;
    }

    // ── Live Firebase Authentication ──
    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const nextProfile = await readProfile(credential.user);

      // Strict role enforcement
      if (portal && portal in DEMO_PROFILES && portal !== nextProfile.role) {
        await firebaseSignOut(auth);
        throw new Error(
          'Access Denied: You do not have permission to access the selected portal.',
        );
      }

      if (portal === 'administrator' && nextProfile.role !== 'hospital_admin' && nextProfile.role !== 'system_admin') {
        await firebaseSignOut(auth);
        throw new Error('Access Denied: Administrator portal requires an administrative account.');
      }

      setUser(credential.user);
      setProfile(nextProfile);
      return nextProfile;
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  }

  async function signUp(payload: SignUpPayload): Promise<AppUserProfile> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const targetRole: AppRole = payload.role || 'patient';
    setError(null);

    if (payload.password.length < 8) {
      throw new Error('Security requirement: Password must be at least 8 characters long.');
    }

    // Prevent unauthorized self-registration as staff or admin
    if (targetRole !== 'patient') {
      throw new Error(
        'Security Policy: Staff and Administrator accounts must be provisioned by an authorized Hospital or Super Admin.',
      );
    }

    if (!isFirebaseConfigured || !auth || !db) {
      const mockProfile: AppUserProfile = {
        uid: `patient-${Date.now()}`,
        displayName: payload.fullName.trim(),
        email: cleanEmail,
        role: 'patient',
        jobTitle: 'Registered Patient',
        facilityName: payload.facilityName || 'Korle Bu Teaching Hospital',
        facilityId: payload.facilityId || 'KBTH-01',
        phone: payload.phone ?? '',
        notificationsEnabled: true,
        twoStepEnabled: false,
      };
      provisionedDemoRegistry.set(cleanEmail, { profile: mockProfile, password: payload.password });
      persistProvisionedDemoRegistry(provisionedDemoRegistry);
      setUser(null);
      setProfile(mockProfile);
      return mockProfile;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);

      await updateProfile(credential.user, {
        displayName: payload.fullName.trim(),
      });

      const userDocument = {
        uid: credential.user.uid,
        displayName: payload.fullName.trim(),
        email: cleanEmail,
        role: 'patient',
        jobTitle: 'Registered Patient',
        facilityName: payload.facilityName || 'Korle Bu Teaching Hospital',
        facilityId: payload.facilityId || 'KBTH-01',
        phone: payload.phone ?? '',
        notificationsEnabled: true,
        twoStepEnabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', credential.user.uid), userDocument);

      const nextProfile = await readProfile(credential.user);
      setUser(credential.user);
      setProfile(nextProfile);
      return nextProfile;
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  }

  const signOut = useCallback(async () => {
    if (auth && user) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // Continue clearing local state
      }
    }
    setUser(null);
    setProfile(null);
    setError(null);
  }, [user]);

  const signOutUser = useCallback(async () => {
    await signOut();
  }, [signOut]);

  async function resetPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    if (!isFirebaseConfigured || !auth) {
      // Simulate network request in demo mode
      await new Promise((resolve) => setTimeout(resolve, 600));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  }

  async function refreshProfile() {
    if (!auth?.currentUser) {
      return;
    }

    try {
      const nextProfile = await readProfile(auth.currentUser);
      setProfile(nextProfile);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  }

  const editProfile = useCallback(async (updates: Partial<AppUserProfile>) => {
    if (!profile) return;

    // Defense-in-depth: non-admins cannot mutate their assigned role or facility
    const isAdmin = profile.role === 'hospital_admin' || profile.role === 'system_admin';
    const sanitizedUpdates = { ...updates };
    if (!isAdmin) {
      delete sanitizedUpdates.role;
      delete sanitizedUpdates.facilityId;
      delete sanitizedUpdates.facilityName;
    }

    const updated = { ...profile, ...sanitizedUpdates };
    setProfile(updated);

    if (isFirebaseConfigured && db && user) {
      try {
        await setDoc(doc(db, 'users', user.uid), sanitizedUpdates, { merge: true });
        if (sanitizedUpdates.displayName && auth?.currentUser) {
          await updateProfile(auth.currentUser, { displayName: sanitizedUpdates.displayName });
        }
      } catch (err) {
        console.error('Failed to sync profile update to Firestore:', err);
        throw err;
      }
    }
  }, [profile, user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      isAuthenticated: Boolean(profile),
      isFirebaseMode: Boolean(isFirebaseConfigured && auth),
      signIn,
      signUp,
      signOut,
      signOutUser,
      resetPassword,
      refreshProfile,
      editProfile,
      registerProvisionedAccount,
    }),
    [user, profile, loading, error, signOut, signOutUser, editProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}