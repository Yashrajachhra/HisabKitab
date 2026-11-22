# HisabKitab


Privacy-first personal and group expense tracker for university students in Pakistan (hostel / mess bill splitting).

**Currency:** PKR (integer minor units / paisa)  
**Stack:** Expo (React Native) + encrypted SQLite · Express + MongoDB (groups only)

## Principles

- Request only camera (and microphone for voice). No contacts, SMS, location, or analytics SDKs.
- Offline-first: personal data stays in an AES-256 encrypted local database.
- Server is used **only** for group ledgers.
- Logging an expense: 1 photo or at most 3 taps.

## Monorepo layout

```
/app                 Expo Router screens
/src                 components, db, features, i18n, services, store, utils
/server              Group-ledger API
/docs                Product & privacy docs
```

## Prerequisites

- Node.js 20+
- Expo CLI / Android Studio (or a device) for a **development build**
- SQLCipher / OCR / voice require `npx expo prebuild` (not Expo Go)
- MongoDB Atlas free tier (or local Mongo) for group ledgers

## App setup

```bash
npm install
cp .env.example .env
npm start                 # web preview OK for UI
npx expo prebuild && npx expo run:android   # full native
```

## Server setup

```bash
cd server
cp .env.example .env   # set MONGODB_URI + JWT secrets
npm install
npm run dev
```

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh JWT |
| POST | `/groups` | Create group |
| GET | `/groups` | List groups |
| POST | `/groups/join` | Join via invite code |
| POST | `/groups/:id/expenses` | Add shared expense |
| GET | `/groups/:id/balances` | Balances + simplified debts |
| POST | `/groups/:id/settle` | Record settlement |

## Features (MVP complete)

- Onboarding, Quick-Tap, manual / OCR / voice entry
- Budget dashboard + local 80%/100% alerts
- Hostel groups with invite codes + debt simplification
- Freemium flags (`ALL_FREE` / `FREEMIUM`), CSV/PDF export, app lock, settings
- EAS profiles for APK + Play Store AAB (`eas.json`)

## Release builds (EAS)

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview          # APK (GitHub Releases)
eas build -p android --profile production       # AAB (Play Store)
eas build -p android --profile production-apk   # signed APK
```

## Scripts

| Command | Description |
|--------|-------------|
| `npm start` | Expo dev server |
| `npm test` | App unit tests |
| `npm run server:dev` | API watch mode |
| `npm --prefix server test` | API + debt tests |

## Phases

1–7 complete. See `/docs`.

## Security notes

- Never log financial amounts, notes, JWT secrets, or DB encryption keys.
- Personal expenses must not be sent to the API.
