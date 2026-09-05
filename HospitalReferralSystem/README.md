# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Firebase setup

The app uses Cloud Firestore for referrals and hospital resources. It falls back to the included demo data until Firebase is configured.

1. Create a Firebase project and register a Web app in the Firebase console.
2. Create a Firestore database and enable Email/Password under Authentication > Sign-in method.
3. Copy `.env.example` to `.env.local` and fill in the Web app configuration values.
4. Create each staff login in Authentication, then create a matching `users/{uid}` document in Firestore with `displayName`, `email`, `role` (`administrator` or `staff`), `jobTitle`, `facilityName`, `facilityId`, and `phone`.
5. Publish `firestore.rules` in the Firestore Rules tab, then restart Expo.

The Firebase configuration is client-side configuration, not a service-account secret. Never add service-account JSON or private keys to this app. The included rules require an authenticated client; replace anonymous authentication with your organization’s identity and facility-based rules before using real patient data.

Without `.env.local`, the app starts in local demo mode. Use `demo@carelink.local` with password `demo1234`; this uses bundled data and does not connect to Firebase. Configure Firebase before using real accounts or patient data.

## Confirmation delivery backend

The `functions/` workspace contains Firebase Cloud Functions that deliver confirmation prompts for new referrals. Phone contacts use Twilio and email contacts use SendGrid. The app creates the request; the backend sends it and records `sent` or `failed` in `confirmationRequests`.

From the project root, install the Firebase CLI and select your Firebase project:

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
```

Configure provider secrets, then deploy Firestore rules and functions:

```bash
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_FROM_PHONE
firebase functions:secrets:set SENDGRID_API_KEY
firebase functions:secrets:set SENDGRID_FROM_EMAIL
firebase deploy --only firestore:rules,functions
```

Twilio phone numbers must be in E.164 format, for example `+233245550138`. The receiving hospital confirms the referral in the CareLink app; the deployed `confirmReferral` function updates both the confirmation request and referral status. Provider credentials must remain in Firebase Secrets and must never be placed in `.env.local`.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
