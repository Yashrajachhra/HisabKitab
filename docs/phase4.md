# Phase 4 — Voice entry

Delivered:

- On-device speech recognition via `expo-speech-recognition` (`requiresOnDeviceRecognition: true`)
- Phrase parser for inputs like “Spent 200 on lunch” / “Paid 150 rupees for chai”
- Category aliases (lunch→Food, rickshaw→Transport, etc.)
- Mic permission asked once; denial remembered (no nag)
- Editable confirmation screen (`source: voice`)
- Unit tests for the pure parser

Privacy:

- Cloud STT is refused when on-device recognition is unavailable
- Transcripts / amounts are never logged

Requirements:

- Custom native build: `npx expo prebuild && npx expo run:android`
- Device must support on-device speech recognition

Next: Phase 5 — Auth + backend group ledger + debt simplification + sync.
