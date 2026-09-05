import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

export type AppUserRole =
  | 'administrator'
  | 'doctor'
  | 'nurse';

export type AuthUserProfile = {
  uid: string;
  displayName: string;
  email: string;
  role: AppUserRole;
  jobTitle: string;
  facilityName: string;
  facilityId: string;
  phone: string;
  notificationsEnabled: boolean;
  twoStepEnabled: boolean;
};

type SignUpPayload = {
  fullName: string;
  email: string;
  password: string;
  role: 'administrator' | 'doctor' | 'nurse';
  facilityName: string;
  adminCode?: string;
};

type AuthContextValue = {
  user: User | null;
  profile: AuthUserProfile | null;
  loading: boolean;
  error: string | null;

  signIn: (
    email: string,
    password: string,
    expectedRole?: 'hospital' | 'administrator',
  ) => Promise<void>;

  signUp: (payload: SignUpPayload) => Promise<void>;

  signOut: () => Promise<void>;

  resetPassword: (email: string) => Promise<void>;

  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyAuthError(error: unknown): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is not valid.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your administrator.';

    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';

    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';

    case 'auth/weak-password':
      return 'Your password is too weak. Use at least 8 characters.';

    case 'auth/network-request-failed':
      return 'Network connection failed. Check your internet connection and try again.';

    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';

    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.';

    default:
      return error instanceof Error
        ? error.message
        : 'Authentication failed. Please try again.';
  }
}

async function loadUserProfile(firebaseUser: User): Promise<AuthUserProfile> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const snapshot = await getDoc(
    doc(db, 'users', firebaseUser.uid),
  );

  const data = snapshot.data() ?? {};

  return {
    uid: firebaseUser.uid,
    displayName:
      data.displayName ??
      firebaseUser.displayName ??
      firebaseUser.email?.split('@')[0] ??
      'Clinical User',

    email: data.email ?? firebaseUser.email ?? '',

    role:
      data.role === 'administrator'
        ? 'administrator'
        : data.role === 'nurse'
          ? 'nurse'
          : 'doctor',

    jobTitle:
      data.jobTitle ??
      (data.role === 'nurse' ? 'Nurse' : 'Doctor'),

    facilityName:
      data.facilityName ??
      'Assigned facility',

    facilityId:
      data.facilityId ??
      '',

    phone:
      data.phone ??
      firebaseUser.phoneNumber ??
      '',

    notificationsEnabled:
      data.notificationsEnabled ?? true,

    twoStepEnabled:
      data.twoStepEnabled ?? false,
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshProfile() {
    if (!auth?.currentUser) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await loadUserProfile(auth.currentUser);
      setProfile(nextProfile);
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setError(null);
        setUser(firebaseUser);

        if (!firebaseUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        try {
          const nextProfile =
            await loadUserProfile(firebaseUser);

          setProfile(nextProfile);
        } catch (err) {
          setProfile(null);
          setError(friendlyAuthError(err));
        } finally {
          setLoading(false);
        }
      },
    );

    return unsubscribe;
  }, []);

  async function signIn(
    email: string,
    password: string,
    expectedRole: 'hospital' | 'administrator' = 'hospital',
  ) {
    if (!auth || !db) {
      throw new Error(
        'Firebase is not configured. Add your Expo Firebase environment variables first.',
      );
    }

    setError(null);

    try {
      const credential =
        await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        );

      const nextProfile =
        await loadUserProfile(credential.user);

      const administrator =
        nextProfile.role === 'administrator';

      if (
        expectedRole === 'administrator' &&
        !administrator
      ) {
        await firebaseSignOut(auth);

        throw new Error(
          'This account is not registered as an administrator.',
        );
      }

      if (
        expectedRole === 'hospital' &&
        administrator
      ) {
        await firebaseSignOut(auth);

        throw new Error(
          'Administrator accounts must use the Administrator portal.',
        );
      }

      setUser(credential.user);
      setProfile(nextProfile);
    } catch (err) {
      const message = friendlyAuthError(err);
      setError(message);
      throw new Error(message);
    }
  }

  async function signUp(payload: SignUpPayload) {
    if (!auth || !db) {
      throw new Error(
        'Firebase is not configured. Connect Firebase before creating an account.',
      );
    }

    setError(null);

    try {
      /*
       * Administrator accounts should be provisioned by the system.
       * Do not allow arbitrary users to create administrator accounts
       * from the mobile client.
       */
      if (payload.role === 'administrator') {
        throw new Error(
          'Administrator accounts must be created by the system administrator.',
        );
      }

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          payload.email.trim().toLowerCase(),
          payload.password,
        );

      await updateProfile(credential.user, {
        displayName: payload.fullName.trim(),
      });

      const profileData = {
        uid: credential.user.uid,
        displayName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role,
        jobTitle:
          payload.role === 'nurse'
            ? 'Nurse'
            : 'Doctor',
        facilityName: payload.facilityName,
        facilityId: '',
        phone: '',
        notificationsEnabled: true,
        twoStepEnabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(
        doc(db, 'users', credential.user.uid),
        profileData,
        { merge: true },
      );

      const nextProfile =
        await loadUserProfile(credential.user);

      setUser(credential.user);
      setProfile(nextProfile);
    } catch (err) {
      const message = friendlyAuthError(err);
      setError(message);
      throw new Error(message);
    }
  }

  async function signOut() {
    if (!auth) return;

    await firebaseSignOut(auth);

    setUser(null);
    setProfile(null);
    setError(null);
  }

  async function resetPassword(email: string) {
    if (!auth) {
      throw new Error(
        'Firebase authentication is not configured.',
      );
    }

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim().toLowerCase(),
      );
    } catch (err) {
      const message = friendlyAuthError(err);
      setError(message);
      throw new Error(message);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile,
    }),
    [user, profile, loading, error],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.',
    );
  }

  return context;
}