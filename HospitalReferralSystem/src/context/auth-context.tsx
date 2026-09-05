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

import { auth, db } from '@/lib/firebase';

export type PortalRole =
  | 'hospital'
  | 'administrator';

export type HospitalJobTitle =
  | 'Doctor'
  | 'Nurse';

export type AppRole =
  | 'administrator'
  | 'staff';

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
  jobTitle: HospitalJobTitle;
  facilityName: string;
  facilityId: string;
  phone?: string;
};

type AuthContextType = {
  user: User | null;
  profile: AppUserProfile | null;
  loading: boolean;
  error: string | null;

  signIn: (
    email: string,
    password: string,
    portal: PortalRole,
  ) => Promise<AppUserProfile>;

  signUp: (
    payload: SignUpPayload,
  ) => Promise<AppUserProfile>;

  signOut: () => Promise<void>;

  resetPassword: (
    email: string,
  ) => Promise<void>;

  refreshProfile: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );

function getAuthErrorMessage(
  error: unknown,
): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? String(
          (error as { code?: unknown }).code,
        )
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

async function readProfile(
  firebaseUser: User,
): Promise<AppUserProfile> {
  if (!db) {
    throw new Error(
      'Firebase Firestore is not configured.',
    );
  }

  const snapshot = await getDoc(
    doc(db, 'users', firebaseUser.uid),
  );

  if (!snapshot.exists()) {
    throw new Error(
      'Your account exists, but your MediRelay profile has not been configured yet. Contact the administrator.',
    );
  }

  const data = snapshot.data();

  return {
    uid: firebaseUser.uid,

    displayName:
      data.displayName ??
      firebaseUser.displayName ??
      'Clinical User',

    email:
      data.email ??
      firebaseUser.email ??
      '',

    role:
      data.role === 'administrator'
        ? 'administrator'
        : 'staff',

    jobTitle:
      data.jobTitle ??
      'Clinical Staff',

    facilityName:
      data.facilityName ??
      'Assigned Facility',

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
  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<AppUserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          setUser(firebaseUser);
          setError(null);

          if (!firebaseUser) {
            setProfile(null);
            setLoading(false);
            return;
          }

          try {
            const nextProfile =
              await readProfile(
                firebaseUser,
              );

            setProfile(nextProfile);
          } catch (err) {
            setProfile(null);
            setError(
              getAuthErrorMessage(err),
            );
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
    portal: PortalRole,
  ) {
    if (!auth || !db) {
      throw new Error(
        'Firebase is not configured. Check your .env file.',
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
        await readProfile(
          credential.user,
        );

      /*
       * Separate authentication portals.
       *
       * Administrator -> administrator only
       * Hospital      -> doctor/nurse only
       */
      if (
        portal === 'administrator' &&
        nextProfile.role !==
          'administrator'
      ) {
        await firebaseSignOut(auth);

        throw new Error(
          'This account is registered as a Hospital User. Use the Hospital User portal.',
        );
      }

      if (
        portal === 'hospital' &&
        nextProfile.role ===
          'administrator'
      ) {
        await firebaseSignOut(auth);

        throw new Error(
          'Administrator accounts must sign in through the Administrator portal.',
        );
      }

      setUser(credential.user);
      setProfile(nextProfile);

      return nextProfile;
    } catch (err) {
      const message =
        getAuthErrorMessage(err);

      setError(message);

      throw new Error(message);
    }
  }

  async function signUp(
    payload: SignUpPayload,
  ) {
    if (!auth || !db) {
      throw new Error(
        'Firebase is not configured. Check your .env file.',
      );
    }

    setError(null);

    try {
      /*
       * Public registration is for Hospital Users.
       * Administrators are provisioned separately.
       */
      const credential =
        await createUserWithEmailAndPassword(
          auth,
          payload.email
            .trim()
            .toLowerCase(),
          payload.password,
        );

      await updateProfile(
        credential.user,
        {
          displayName:
            payload.fullName.trim(),
        },
      );

      const userDocument = {
        uid: credential.user.uid,

        displayName:
          payload.fullName.trim(),

        email:
          payload.email
            .trim()
            .toLowerCase(),

        role: 'staff',

        jobTitle:
          payload.jobTitle,

        facilityName:
          payload.facilityName,

        facilityId:
          payload.facilityId,

        phone:
          payload.phone ?? '',

        notificationsEnabled: true,

        twoStepEnabled: false,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      await setDoc(
        doc(
          db,
          'users',
          credential.user.uid,
        ),
        userDocument,
      );

      const nextProfile =
        await readProfile(
          credential.user,
        );

      setUser(credential.user);
      setProfile(nextProfile);

      return nextProfile;
    } catch (err) {
      const message =
        getAuthErrorMessage(err);

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

  async function resetPassword(
    email: string,
  ) {
    if (!auth) {
      throw new Error(
        'Firebase Authentication is not configured.',
      );
    }

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim().toLowerCase(),
      );
    } catch (err) {
      const message =
        getAuthErrorMessage(err);

      setError(message);

      throw new Error(message);
    }
  }

  async function refreshProfile() {
    if (!auth?.currentUser) {
      return;
    }

    try {
      const nextProfile =
        await readProfile(
          auth.currentUser,
        );

      setProfile(nextProfile);
    } catch (err) {
      setError(
        getAuthErrorMessage(err),
      );
    }
  }

  const value = useMemo(
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
    [
      user,
      profile,
      loading,
      error,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.',
    );
  }

  return context;
}