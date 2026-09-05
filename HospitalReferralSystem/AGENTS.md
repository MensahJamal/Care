# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Project overview

- This is an Expo Router app built with Expo SDK 57, React 19, TypeScript 6, and React Native 0.86.
- The app is universal: it targets native platforms and web via Expo Web.
- Routing is file-based under `src/app/`.
- The app state is currently mocked in `src/context/referral-context.tsx`; there is no backend API included.

## Important conventions

- Use `npm install` to install dependencies.
- Use `npm start` to run the development server.
- Use `npm run android`, `npm run ios`, or `npm run web` for platform-specific development.
- Use `npm run lint` to check formatting/linting via Expo.
- `npm run reset-project` rewrites starter code and should be used only when resetting the demo app.
- Use the TypeScript path alias `@/*` for imports from `src/*`.

## Key files and folders

- `src/app/` — Expo Router route entrypoints and screens.
- `src/components/` — reusable UI components.
- `src/context/referral-context.tsx` — referral and resource state management.
- `src/constants/theme.ts` — theme colors and dark/light mode handling.
- `src/hooks/` — platform-specific hook implementations.
- `app.json` — Expo configuration.
- `tsconfig.json` — TypeScript setup and path aliases.

## What to avoid

- Do not assume a backend or database exists; the current app uses local state only.
- Do not use Expo docs for SDK versions other than 57.0.0 unless updating the project's Expo version intentionally.
