# Google Play listing – Kisaan Sevak

Copy-paste source for Play Console. Assets in this folder: `play-icon-512.png` (app icon), `feature-graphic.png` (1024×500). Phone screenshots: capture 4–8 from the live app (1080×1920 or similar).

## App details
- **App name** (≤30): `Kisaan Sevak – Smart Farming`
- **Package name:** `com.kisaansevak.app`
- **Category:** Productivity (alternative: Business)
- **Contact email:** parshettenikhil01@gmail.com
- **Website:** https://kisaan-sevak--agriassist-3593e.asia-southeast1.hosted.app
- **Privacy policy URL:** https://kisaan-sevak--agriassist-3593e.asia-southeast1.hosted.app/privacy
- **Account deletion URL:** https://kisaan-sevak--agriassist-3593e.asia-southeast1.hosted.app/account/delete
- **Free / Paid:** Free · **Ads:** No · **In-app purchases:** No

## Short description (≤80)
AI farming help: crop diagnosis, mandi prices & sell directly to buyers.

## Full description (≤4000)
Kisaan Sevak is a free farming assistant built for Indian farmers and the buyers who work with them.

🌱 AI CROP DOCTOR
Take a photo of a sick plant and get a likely diagnosis with treatment steps, including organic options and safety precautions for agrochemicals.

🧪 SOIL & IRRIGATION ADVICE
Analyse a soil photo, get nutrient (N-P-K) suggestions, and plan irrigation based on your crop, soil and local weather.

📅 FARM PLANNER
Generate a season schedule for planting, fertilising, weeding and harvesting. Keep farm records and track seeds, fertilisers and pesticides in your inventory.

💰 MARKET PRICES & PROFIT
Compare prices across states, estimate transport costs and forecast profitability before you sell.

🤝 FARMER-TO-BUYER MARKETPLACE
Farmers list produce with quantity, price and location. Buyers browse live listings and call farmers directly – no middlemen.

💬 ASK THE AI AGRONOMIST
Chat with an AI expert about crops, pests, fertilisers, mandi rates and government schemes, with answers backed by Google Search when needed.

🗣️ 9 LANGUAGES
English, हिन्दी, বাংলা, தமிழ், తెలుగు, मराठी, ਪੰਜਾਬੀ, ગુજરાતી, ಕನ್ನಡ.

Sign in with your Google account to keep your data in sync across devices. You can delete your account and all data at any time from within the app.

AI suggestions are for guidance only – always confirm critical decisions (pesticide doses, large purchases) with your local agriculture officer or KVK.

## Content rating questionnaire (IARC)
- Category: Utility / Productivity (not a game)
- Violence, sexual content, profanity, drugs, gambling: **No**
- User-generated content shared between users: **Yes** (marketplace listings: crop, price, location, name, optional phone). No chat between users.
- Shares user's location with other users: **Yes, only the town/district the farmer types into a listing**
- Expected rating: Everyone / 3+

## Target audience
- Age groups: **18 and over** only. Not designed for children.

## Data safety form
**Does the app collect or share user data?** Yes, collects. **Encrypted in transit?** Yes. **Can users request deletion?** Yes (in-app + URL above).

| Data type | Collected | Shared* | Required? | Purpose |
|---|---|---|---|---|
| Name | Yes | No | Required (from Google sign-in) | Account management, App functionality |
| Email address | Yes | No | Required | Account management |
| Phone number | Yes | No | Optional | App functionality (shown to buyers on listings) |
| Approximate location | Yes | No | Optional | App functionality (weather, town name) |
| Photos | Yes | No | Optional | App functionality (crop/soil AI analysis; not stored) |
| Other user-generated content (listings, records, chat) | Yes | No | Optional | App functionality |
| User IDs | Yes | No | Required | Account management |

\*Data sent to service providers that process it on our behalf (Google Firebase, Google Gemini API) is not "sharing" under Play's definitions. Other users seeing a farmer's own listing is a user-initiated disclosure.

Not collected: precise location, contacts, financial info, health info, messages (SMS/email), audio, files, calendar, device IDs for ads, web browsing.

## App access (for Google's reviewers)
All features require Google sign-in. Instructions: "Tap Sign in with Google and use any Google account. No invitation or payment is needed."

## Release plan
1. Internal testing → upload first signed `.aab` (GitHub → Actions → Android → latest run → artifact).
2. Closed testing with ≥12 testers opted in for 14 consecutive days (new personal accounts).
3. Apply for production access → production release (India first, then expand).
4. After the first upload: Play Console → Test and release → App integrity → copy the **App signing key SHA-256** and add it to `ANDROID_CERT_SHA256` in `apphosting.yaml` (comma-separated after the upload key), then push.
