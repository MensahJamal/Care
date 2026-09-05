# CareLink Firebase Functions

These functions send confirmation prompts created by the Expo app.

## Provider secrets

Configure secrets with the Firebase CLI. Do not put these values in the Expo app or commit them:

```bash
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_FROM_PHONE
firebase functions:secrets:set SENDGRID_API_KEY
firebase functions:secrets:set SENDGRID_FROM_EMAIL
```

Twilio sends phone prompts. SendGrid sends email prompts. Deploy with `npm run deploy` from this directory.
