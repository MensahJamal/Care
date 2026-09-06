# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Project overview

- This is an Expo Router app built with Expo SDK 57, React 19, TypeScript 6, and React Native 0.86.
- The app is universal: it targets native platforms and web via Expo Web.
- Routing is file-based under `src/app/`.
- The app is wired to a Firebase backend (Firestore + Auth + Cloud Functions v2).
  - When `EXPO_PUBLIC_FIREBASE_*` env vars are set, the app uses live Firestore data.
  - When env vars are absent, the app runs in **Offline Demo Mode** with seeded local state.

## Backend architecture

| Layer | Tech | Notes |
|---|---|---|
| Auth | Firebase Auth | Email/password; role stored in Firestore `users/{uid}` |
| Database | Cloud Firestore | Collections: `referrals`, `resources`, `specialists`, `departments`, `patients`, `rosterSlots`, `confirmationRequests` |
| Functions | Firebase Functions v2 (Node 22) | `deliverConfirmationPrompt`, `confirmReferral`, `verifyReferralOtp` |
| SMS | Twilio | Secrets managed via `firebase functions:secrets:set` |
| Email | SendGrid | Secrets managed via `firebase functions:secrets:set` |

## OTP acceptance flow

When a clinician accepts an incoming referral:
1. The frontend opens an OTP verification modal.
2. It queries `confirmationRequests` for the referral's linked request document.
3. It calls `verifyReferralOtp` Cloud Function with the requestId + 6-digit code.
4. On success, it calls `updateReferralStatus(id, 'Accepted')` directly in Firestore.
5. In demo mode, any syntactically valid 6-digit code is accepted.

## Key files and folders

- `src/app/` — Expo Router route entrypoints and screens.
- `src/components/` — reusable UI components.
- `src/context/auth-context.tsx` — Firebase Auth state, sign-in/sign-up, profile management.
- `src/context/referral-context.tsx` — referral, resource, and specialist state; Firestore subscriptions.
- `src/lib/firebase.ts` — Firebase app initialisation; exports `auth`, `db`, `functions`, `isFirebaseConfigured`.
- `src/lib/firestore.ts` — all Firestore reads/writes and Cloud Function calls.
- `src/constants/theme.ts` — theme colors and dark/light mode handling.
- `src/hooks/` — platform-specific hook implementations.
- `functions/src/index.ts` — Cloud Functions (OTP delivery, referral confirmation).
- `firestore.rules` — Firestore security rules (deploy with `firebase deploy --only firestore:rules`).
- `app.json` — Expo configuration.
- `tsconfig.json` — TypeScript setup and path aliases.
- `.env.example` — environment variable template; copy to `.env` and fill in Firebase values.

## DataConnect (`dataconnect/`)

The `dataconnect/` directory at the repo root contains a Firebase Data Connect proof-of-concept
with a GraphQL schema (Departments, Specialists, Patients, Referrals, RosterSlots). The equivalent
data model is now implemented as Firestore collections. DataConnect is not yet wired to the app.

## Important conventions

- Use `npm install` to install dependencies.
- Use `npm start` to run the development server.
- Use `npm run android`, `npm run ios`, or `npm run web` for platform-specific development.
- Use `npm run lint` to check formatting/linting via Expo.
- `npm run reset-project` rewrites starter code and should be used only when resetting the demo app.
- Use the TypeScript path alias `@/*` for imports from `src/*`.

## What to avoid

- Do not hard-code facility names or specialist lists — they now come from Firestore in live mode.
- Do not assume the backend is absent; check `isFirebaseConfigured` from `@/lib/firebase` instead.
- Do not use Expo docs for SDK versions other than 57.0.0 unless updating the project's Expo version intentionally.
