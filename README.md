# Kisaan Sevak

Smart farming assistant for Indian farmers and produce buyers: AI crop diagnosis, soil and irrigation advice, schedules, farm records, inventory, mandi-price analysis, and a farmer-to-buyer marketplace. Available in 9 Indian languages.

**Stack:** Next.js 15 · Firebase Auth (Google sign-in) · Cloud Firestore · Gemini (via `@google/genai` and Genkit) · Tailwind / shadcn UI.

## Run locally

```bash
npm install                 # first time: also regenerates package-lock.json — commit it
cp .env.example .env.local  # then add your GEMINI_API_KEY
npm run dev                 # http://localhost:3000
```

Without any `NEXT_PUBLIC_FIREBASE_*` values the app uses the Firebase project in `firebase-applet-config.json` (`agriassist-3593e`, default Firestore database in asia-south1).

## What lives where

| Data | Firestore path | Who can access |
|---|---|---|
| Profile (name, phone, role) | `users/{uid}` | Owner only |
| Tasks, farm records, inventory, chat history | `users/{uid}/…` | Owner only |
| Marketplace listings | `listings/{id}` | Any signed-in user reads; only the listing's farmer writes |

Rules are in `firestore.rules`. All AI calls (the `/api/gemini/chat` route and every server action) require a signed-in user and are rate limited per user (`AI_RATE_LIMIT_PER_MINUTE`, `AI_RATE_LIMIT_PER_DAY`).

## Launch checklist (Firebase App Hosting)

1. **Firebase project.** Create one at [console.firebase.google.com](https://console.firebase.google.com) (or keep the AI Studio one). Upgrade to the Blaze plan — App Hosting requires it.
2. **Enable Google sign-in.** Authentication → Sign-in method → Google.
3. **Create Firestore** (Native mode). If you use your own project's `(default)` database, leave `NEXT_PUBLIC_FIREBASE_DATABASE_ID` empty.
4. **Point the app at it.** Add a Web app in Project settings, then fill the `NEXT_PUBLIC_FIREBASE_*` values in `apphosting.yaml` (and `.env.local` for local dev).
5. **Deploy security rules:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules
   ```
6. **Store the Gemini key as a secret:** `firebase apphosting:secrets:set gemini-api-key`
7. **Create the App Hosting backend:** Firebase console → App Hosting → Get started → connect this GitHub repo, branch `main`. Every push to `main` then redeploys.
8. **Authorize the domain.** Authentication → Settings → Authorized domains → add the `*.hosted.app` URL App Hosting gives you (and your custom domain later).
9. **Lock down the browser API key.** Google Cloud console → APIs & Services → Credentials → restrict the web API key to your domains.
10. **Smoke test:** sign in, add a listing as a farmer, switch role to buyer, check it appears on the dashboard and marketplace, and run one AI feature.

## Known gaps

- `next.config.ts` still ignores TypeScript and ESLint errors during build. Run `npm run typecheck` and fix what it reports, then turn those checks back on.
- The "live market prices" table on the Market page is a static reference list, not a live mandi feed. Weather comes from Open-Meteo.
- The AI rate limiter is in memory per server instance; move it to Firestore if you scale out.
