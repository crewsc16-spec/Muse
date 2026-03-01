export const metadata = {
  title: 'Privacy Policy — Muse',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-gray-700">
      <div>
        <h1 className="font-playfair text-4xl text-gray-800 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Last updated: March 1, 2026</p>
      </div>

      <p className="text-sm leading-relaxed">
        Muse ("we", "our", or "us") is a personal wellness and self-discovery app. This policy explains
        what information we collect, how we use it, and your rights. We keep this simple because we
        respect your privacy.
      </p>

      <Section title="1. Information We Collect">
        <p>We collect only what's needed to make the app work for you:</p>
        <ul>
          <li><strong>Account information</strong> — your email address and display name when you create an account.</li>
          <li><strong>Birth data</strong> — date, time, and location of birth, used solely to calculate your astrological and Human Design charts. This is stored in your account and never shared.</li>
          <li><strong>Journal entries</strong> — text you write in the journal. Stored privately in your account and never read by us.</li>
          <li><strong>Mood entries</strong> — daily mood scores and optional notes you log.</li>
          <li><strong>Vision board items</strong> — images and text you save to your board.</li>
          <li><strong>Usage data</strong> — basic analytics such as which features are used, collected in aggregate and never tied to your identity.</li>
        </ul>
        <p className="mt-3">We do not collect location beyond what you voluntarily enter for birth chart purposes. We do not access your camera, microphone, or contacts.</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul>
          <li>To calculate and display your personal charts (astrology, Human Design, numerology).</li>
          <li>To store and sync your journal, mood, and vision board across devices.</li>
          <li>To personalize daily content (tarot, spirit animal, vibe) to your chart data.</li>
          <li>To power the AI chart chat feature, which sends your chart summary — not your personal details — to an AI model to answer your questions.</li>
          <li>To improve the app based on aggregate usage patterns.</li>
        </ul>
        <p className="mt-3">We do not sell your data. We do not use your data for advertising.</p>
      </Section>

      <Section title="3. Third-Party Services">
        <p>Muse uses the following third-party services to operate:</p>
        <ul>
          <li><strong>Supabase</strong> — our database and authentication provider. Your account data, journal, mood, and board items are stored on Supabase servers. <a href="https://supabase.com/privacy" className="text-[#b88a92] underline" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a></li>
          <li><strong>Anthropic (Claude AI)</strong> — powers the chart chat feature. When you ask a question, your chart summary and question are sent to Anthropic's API. No personally identifying information beyond your chart data is sent. <a href="https://www.anthropic.com/privacy" className="text-[#b88a92] underline" target="_blank" rel="noopener noreferrer">Anthropic Privacy Policy</a></li>
          <li><strong>Unsplash</strong> — provides imagery for the vision board and daily features. Photo searches are proxied through our server; your identity is not shared with Unsplash. <a href="https://unsplash.com/privacy" className="text-[#b88a92] underline" target="_blank" rel="noopener noreferrer">Unsplash Privacy Policy</a></li>
        </ul>
      </Section>

      <Section title="4. Data Storage and Security">
        <p>
          Your data is stored on Supabase infrastructure with row-level security enabled — meaning only
          you can access your own data. We use HTTPS for all data transmission. We do not store passwords;
          authentication is handled securely by Supabase.
        </p>
      </Section>

      <Section title="5. Your Rights">
        <ul>
          <li><strong>Access</strong> — you can view all your data within the app at any time.</li>
          <li><strong>Delete</strong> — you can delete individual journal entries, mood logs, and board items within the app. To delete your account and all associated data, email us at the address below.</li>
          <li><strong>Export</strong> — contact us if you'd like a copy of your data.</li>
          <li><strong>Opt out</strong> — you can stop using the app at any time. Data is not retained after account deletion.</li>
        </ul>
      </Section>

      <Section title="6. Children">
        <p>
          Muse is not directed at children under 13. We do not knowingly collect information from
          anyone under 13. If you believe a child has provided us with personal information, please
          contact us and we will delete it promptly.
        </p>
      </Section>

      <Section title="7. Changes to This Policy">
        <p>
          We may update this policy from time to time. If we make material changes, we will notify
          you via the app or by email. The date at the top of this page reflects the most recent update.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          Questions or requests? Email us at{' '}
          <a href="mailto:hello@yourmuse.app" className="text-[#b88a92] underline">hello@yourmuse.app</a>.
        </p>
      </Section>

      <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
        © 2026 Muse. All rights reserved.
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h2 className="font-playfair text-xl text-gray-800">{title}</h2>
      <div className="text-sm leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
