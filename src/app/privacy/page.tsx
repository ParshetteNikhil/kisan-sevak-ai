import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy – Kisaan Sevak',
};

const CONTACT_EMAIL = 'parshettenikhil01@gmail.com';
const UPDATED = '1 November 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 pt-6 md:p-8 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed">
      <h1 className="text-3xl font-bold font-headline">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <p>
        Kisaan Sevak (&quot;we&quot;, &quot;the app&quot;) helps farmers and produce buyers with farm planning, AI advice
        and a marketplace. This policy explains what information the app collects, why, and the choices you have. It
        applies to the Kisaan Sevak website and Android app.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> when you sign in with Google we receive your name, email address and
          profile photo.
        </li>
        <li>
          <strong>Profile details you add:</strong> phone number, short bio and whether you use the app as a farmer or
          a buyer.
        </li>
        <li>
          <strong>Farm data you enter:</strong> tasks and schedules, harvest records, inventory, and AI assistant
          conversations.
        </li>
        <li>
          <strong>Marketplace listings:</strong> crop, quantity, price, location, your display name and (if you added
          one) your phone number.
        </li>
        <li>
          <strong>Photos you choose to analyse:</strong> crop or soil photos you upload for AI diagnosis.
        </li>
        <li>
          <strong>Approximate location:</strong> only when you allow it, to show local weather and fill in your town
          on listings and analyses.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To provide the app&apos;s features and keep your data in sync across your devices.</li>
        <li>To generate AI advice (crop diagnosis, soil, irrigation, schedules, prices and chat).</li>
        <li>To let buyers find produce and contact farmers through the marketplace.</li>
        <li>To prevent abuse, for example by limiting how many AI requests an account can make.</li>
      </ul>
      <p>We do not sell your personal information and we do not show advertising.</p>

      <h2>Who can see your information</h2>
      <ul>
        <li>
          <strong>Other users:</strong> marketplace listings, including your display name, location and phone number
          if you added one, are visible to every signed-in user. Everything else is private to your account.
        </li>
        <li>
          <strong>Service providers that process data for us:</strong> Google Firebase (sign-in, database and hosting),
          Google Gemini API (AI responses; your prompts and photos are sent to it to generate answers. During the
          free testing phase the app uses Gemini&apos;s free tier, under which Google may use this content to improve
          its products; do not include personal details in questions or photos), Open-Meteo
          (weather, using your coordinates), OpenStreetMap Nominatim (turning coordinates into a town name) and PubChem
          (chemical information lookups). Public government data is also used: mandi prices from Agmarknet
          (data.gov.in) and district soil statistics from the Soil Health Card portal; your district name is used to
          look these up.
        </li>
        <li>When required by law.</li>
      </ul>

      <h2>Storage and security</h2>
      <p>
        Data is stored in Google Cloud Firestore in India (Mumbai region) and transmitted over encrypted connections
        (HTTPS). Access is restricted by security rules so that only you can read your private data.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        We keep your data while your account is active. You can delete your account and all associated data at any time
        from <Link href="/account/delete" className="text-primary underline">Delete account</Link> in the app or on
        the website. Deletion is immediate and permanent. You can also email us to request deletion.
      </p>

      <h2>Children</h2>
      <p>Kisaan Sevak is intended for adults and is not directed at children under 13.</p>

      <h2>Changes</h2>
      <p>If we change this policy we will update the date above and, for significant changes, notify you in the app.</p>

      <h2>Contact</h2>
      <p>
        Questions or requests: <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  );
}
