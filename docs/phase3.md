# Phase 3 — Smart Snap & Log (OCR)

Delivered:

- On-device ML Kit text recognition (`@react-native-ml-kit/text-recognition`)
- Receipt parser heuristics for PKR totals, store name, date
- JazzCash / Easypaisa / bank screenshot format detection
- Camera + gallery capture with one-shot permission UX (no nagging)
- Editable confirmation screen before save (`source: ocr`)
- Image deleted after parse/save unless user opts to keep it
- Configurable monthly OCR limit scaffolding (`EXPO_PUBLIC_OCR_FREE_MONTHLY_LIMIT`)
- Unit tests on sample OCR strings (no images required)

Requirements:

- Custom native build: `npx expo prebuild && npx expo run:android`
- Not available in Expo Go

Privacy:

- Images never uploaded
- Parser unit tests use synthetic sample text only
- App never logs raw receipt text or amounts

Next: Phase 4 — voice entry + parser tests.
