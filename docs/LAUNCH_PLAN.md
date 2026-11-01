# Kisaan Sevak – Launch Plan & Progress

Goal: working web app on Firebase (free Spark plan) → Android app on Google Play (Trusted Web Activity wrapping the web app).

| # | Milestone | Status |
|---|---|---|
| M1 | CI on GitHub Actions (install, type check, build, lockfile) | ✅ Done |
| M2 | Firebase project `agriassist-3593e`: Google sign-in, Firestore (asia-south1), rules published, web config in repo | ✅ Done |
| M3 | Build green with type checking enforced | ✅ Done |
| M4 | PWA (manifest, icons, offline page), privacy policy `/privacy`, account deletion `/account/delete`, asset links route, same-origin auth proxy | ✅ Done |
| M5 | Live on Firebase App Hosting (Blaze, ₹100 budget alert); Gemini key secret (Accessor + Viewer for App Hosting & Cloud Build SAs); authorized domain + OAuth redirect URI. Smoke test passed (sign-in, Firestore, AI chat) | ✅ Done |
| M6 | Mobile UI (app bar + Menu, bottom nav, safe areas) ✅. Android TWA project (`android/`, target API 36), upload key generated, CI builds `.aab`/`.apk`, emulator launch test gates the APK link (releases/android-latest). APK signed with the upload key (fingerprint matches assetlinks) → opens full-screen | ✅ Done |
| M6b | Farmer-first redesign: language-first onboarding, picture tiles, voice in/out, 9 languages, Crop Doctor, Ask Expert, Mandi price, sell by voice, Farm Profile with Soil Health Card photo reading, hybrid soil advice (photo + card + profile + 30-day weather), weather alerts, feedback + analytics, offline caching. Firestore rules for `farm` and `feedback` published | ✅ Done |
| M6c | Field test (APK from releases/android-latest): kit in `store/field-test-kit.pdf` (poster with APK QR, observation sheet, facilitator checklist). Results: Firestore `feedback`, Analytics events. 12+ testers for 14 days doubles as the Play closed test | ⏳ Next (owner) |
| M6d | Fixes from first phone test: Mandi Price from Agmarknet (data.gov.in key in secret `data-gov-in-key`), busy card + AI quota fallback/cache, crop chips, header/greeting, adaptive layout on all screen sizes. Govt district soil baseline (Soil Health Card portal) + My Farm needs only crop + location. Free-tier Gemini (Flash-Lite default) for field test | ✅ Done |
| M7 | Listing kit ready in `store/`. Play Console: account, listing, screenshots, data safety, content rating, closed test (12 testers × 14 days for new personal accounts), production | ⬜ |

## Decisions
- Live URL: https://kisaan-sevak--agriassist-3593e.asia-southeast1.hosted.app (App Hosting backend `kisaan-sevak`, asia-southeast1, auto-deploys from `main`).
- Source of truth: GitHub `ParshetteNikhil/kisan-sevak-ai` (Google AI Studio no longer used for edits).
- Firebase project: `agriassist-3593e`, Blaze plan (₹100 budget alert), default Firestore DB in `asia-south1`.
- Android package name: `com.kisaansevak.app`.

## Needs the owner (can't be done by Claude)
- ~~Gemini API key → secret `gemini-api-key`~~ ✅ done.
- Before Play launch: paid Gemini API key from the agriassist-3593e project → new version of secret `gemini-api-key` (free tier has small daily limits and lets Google use the data).
- Field test with 12 to 20 farmers using `store/field-test-kit.pdf`; collect testers' Gmail for the Play closed test.
- Native-speaker check of the 8 non-English languages (`src/locales/farmer.ts`).
- Google Play developer account registration fee and identity verification.
- ~~Signing secrets in GitHub~~ ✅ done (2026-11-02).
