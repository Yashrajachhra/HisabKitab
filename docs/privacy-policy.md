# HisabKitab Privacy Policy

**Last updated:** 28 October 2026

## Summary

HisabKitab is privacy-first. Personal expenses are stored in an encrypted database on your device. We do not sell data. We do not ship analytics or advertising SDKs.

## Data processed on device

- Expense amounts, categories, notes, dates, payment methods
- Optional receipt images for on-device OCR (deleted after parsing unless you choose to keep them)
- Optional voice transcripts for on-device speech parsing
- Budgets and local notifications for budget thresholds
- App lock PIN / biometric preference (when enabled)
- Theme preference

## Permissions

- **Camera** — receipt scanning only
- **Microphone** — voice entry only
- **Notifications** — local budget alerts only (optional)
- We do **not** request contacts, SMS, or location

## Server data (optional)

An account is required only for **group ledgers**. The API stores:

- Account email, display name, and password hash (bcrypt)
- Group membership, invite codes, shared expenses, and settlements

Personal ledgers are **not** uploaded. Group sync uses HTTPS and last-write-wins conflict handling.

## Freemium / feature flags

Product limits (OCR scans, group count, PDF export) are controlled by a launch-phase flag (`ALL_FREE` vs `FREEMIUM`). No payment card data is collected in the current release.

## Your controls

- Export CSV (all users) / PDF (Plus)
- Delete all local data
- Log out / clear account session
- Decline permissions once — we do not nag

## Contact

Replace with a support email before Play Store / GitHub release.
