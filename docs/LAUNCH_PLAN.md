# Kisaan Sevak – Launch Plan & Progress

Goal: working web app on Firebase (free Spark plan) → Android app on Google Play (Trusted Web Activity wrapping the web app).

| # | Milestone | Status |
|---|---|---|
| M1 | CI on GitHub Actions (install, type check, build, lockfile) | ✅ Done |
| M2 | Firebase project `agriassist-3593e`: Google sign-in, Firestore (asia-south1), rules published, web config in repo | ✅ Done |
| M3 | Build green with type checking enforced | ✅ Done |
| M4 | PWA (manifest, icons, offline page), privacy policy `/privacy`, account deletion `/account/delete`, asset links route, same-origin auth proxy | ✅ Done |
| M5 | Live on Firebase App Hosting (Blaze, ₹100 budget alert); Gemini key secret (Accessor + Viewer for App Hosting & Cloud Build SAs); authorized domain + OAuth redirect URI. Pending: signed-in smoke test by owner | ✅ Deployed |
| M6 | Android TWA project (`android/`, target API 36), upload key generated, CI builds `.aab`/`.apk` (Actions → Android), asset links verified | ⏳ In progress |
| M7 | Play Console: account, listing, screenshots, data safety, content rating, closed test (12 testers × 14 days for new personal accounts), production | ⬜ |

## Decisions
- Live URL: https://kisaan-sevak--agriassist-3593e.asia-southeast1.hosted.app (App Hosting backend `kisaan-sevak`, asia-southeast1, auto-deploys from `main`).
- Source of truth: GitHub `ParshetteNikhil/kisan-sevak-ai` (Google AI Studio no longer used for edits).
- Firebase project: `agriassist-3593e`, Blaze plan (₹100 budget alert), default Firestore DB in `asia-south1`.
- Android package name: `com.kisaansevak.app`.

## Needs the owner (can't be done by Claude)
- ~~Gemini API key → secret `gemini-api-key`~~ ✅ done.
- Google Play developer account registration fee and identity verification.
- Add `ANDROID_KEYSTORE_BASE64` and `ANDROID_KEYSTORE_PASSWORD` GitHub Actions secrets (values in the private file shared in chat).
