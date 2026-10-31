# Kisaan Sevak – Launch Plan & Progress

Goal: working web app on Firebase (free Spark plan) → Android app on Google Play (Trusted Web Activity wrapping the web app).

| # | Milestone | Status |
|---|---|---|
| M1 | CI on GitHub Actions (install, type check, build, lockfile) | ✅ Done |
| M2 | Firebase project `agriassist-3593e`: Google sign-in, Firestore (asia-south1), rules published, web config in repo | ✅ Done |
| M3 | Build green with type checking enforced | ✅ Done |
| M4 | PWA (manifest, icons, offline page), privacy policy `/privacy`, account deletion `/account/delete`, asset links route, same-origin auth proxy | ✅ Done |
| M5 | Deploy on Firebase App Hosting, Gemini key, OAuth redirect URI, smoke test | ⏳ In progress |
| M6 | Android TWA project, upload keystore, signed `.aab` built by CI, asset links verified | ⬜ |
| M7 | Play Console: account, listing, screenshots, data safety, content rating, closed test (12 testers × 14 days for new personal accounts), production | ⬜ |

## Decisions
- Source of truth: GitHub `ParshetteNikhil/kisan-sevak-ai` (Google AI Studio no longer used for edits).
- Firebase project: `agriassist-3593e`, Spark plan, default Firestore DB in `asia-south1`.
- Android package name: `com.kisaansevak.app`.

## Needs the owner (can't be done by Claude)
- Gemini API key → App Hosting secret `gemini-api-key`.
- Google Play developer account registration fee and identity verification.
- Android signing keystore passwords → GitHub Actions secrets.
