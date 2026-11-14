# Phase 2 — Budgeting dashboard

Delivered:

- Monthly budget (PKR minor units) with progress bar (warning ≥80%, exceeded ≥100%)
- Per-category spend pie + bar charts (`react-native-gifted-charts`)
- Optional per-category limits
- Local notifications at 80%/100% via `expo-notifications` (permission asked once; denial remembered, never nagged)
- In-app alert banner mirroring the same thresholds
- Pure unit tests for progress / alert sequencing

Privacy notes:

- Notification copy uses percentages only (no rupee amounts)
- Alerts are local; nothing is uploaded

Next: Phase 3 — on-device OCR receipt scanning.
