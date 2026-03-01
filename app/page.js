'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLunarPhase } from './lib/astrology';
import { getQuotes } from './lib/quotes';
import { createClient } from './lib/supabase/client';

// ─── Moon SVG ─────────────────────────────────────────────────────────────────

function computeMoonT(dateStr) {
  const synodicMonth = 29.53058867;
  const knownNew = new Date('2000-01-06T18:14:00Z');
  const date = new Date(dateStr + 'T12:00:00Z');
  const diffDays = (date - knownNew) / 86400000;
  return ((diffDays % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;
}

function MoonPhaseIcon({ dateStr, size = 36 }) {
  const t = computeMoonT(dateStr);
  const r = size / 2;
  const dark = '#1f1535';
  const light = '#ffffff';

  let d;
  if (t < 0.5) {
    const angle = (t / 0.5) * Math.PI;
    const x = r * Math.cos(angle);
    const sweep = t < 0.25 ? 0 : 1;
    d = `M ${r} ${size} A ${r} ${r} 0 0 0 ${r} 0 A ${Math.abs(x)} ${r} 0 0 ${sweep} ${r} ${size} Z`;
  } else {
    const t2 = (t - 0.5) / 0.5;
    const angle = t2 * Math.PI;
    const x = r * Math.cos(angle);
    const sweep = t2 < 0.5 ? 1 : 0;
    d = `M ${r} 0 A ${r} ${r} 0 0 1 ${r} ${size} A ${Math.abs(x)} ${r} 0 0 ${sweep} ${r} 0 Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r} fill={dark} />
      <path d={d} fill={light} />
    </svg>
  );
}

// ─── Feature cards ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    href: '/board',
    emoji: '✨',
    label: 'My Board',
    description: 'Your vision board and mood tracker — the living record of your inner world.',
    gradient: 'from-rose-50 to-pink-50',
    border: 'border-rose-100',
  },
  {
    href: '/daily',
    emoji: '🌙',
    label: 'Daily',
    description: "Today's tarot, spirit animal, vibe, and the wisdom the day is holding for you.",
    gradient: 'from-violet-50 to-purple-50',
    border: 'border-violet-100',
  },
  {
    href: '/cosmic',
    emoji: '🔮',
    label: 'Cosmic Chart',
    description: 'Your natal chart, Human Design, numerology, and live planetary transits.',
    gradient: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-100',
  },
  {
    href: '/quizzes',
    emoji: '🌸',
    label: 'Quizzes',
    description: 'Personality quizzes to explore your attachment style, archetype, love language, and more.',
    gradient: 'from-fuchsia-50 to-rose-50',
    border: 'border-fuchsia-100',
  },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [name, setName]     = useState('');
  const [phase, setPhase]   = useState(null);
  const [quote, setQuote]   = useState(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      const dn = user?.user_metadata?.displayName ?? localStorage.getItem('displayName') ?? '';
      if (dn) setName(dn.split(' ')[0]);
    });

    // Moon phase
    setPhase(getLunarPhase(today));

    // Daily quote — seeded by date so it's consistent all day
    const allQuotes = getQuotes('spirituality').concat(getQuotes('motivation')).concat(getQuotes('growth'));
    const seed = today.replace(/-/g, '');
    const idx = parseInt(seed) % allQuotes.length;
    setQuote(allQuotes[idx]);
  }, [today]);

  const dateLabel = new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* ── Hero greeting ── */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 text-center space-y-5">
          {phase && (
            <div className="flex justify-center">
              <MoonPhaseIcon dateStr={today} size={52} />
            </div>
          )}

          <div>
            <h1 className="font-playfair text-4xl sm:text-5xl mb-2" style={{ color: '#b88a92' }}>
              {name ? `Welcome back, ${name}.` : 'Welcome back.'}
            </h1>
            <p className="text-sm text-gray-400">{dateLabel}</p>
          </div>

          {phase && (
            <div className="inline-flex items-center gap-2 bg-white/50 border border-white/60 rounded-full px-4 py-1.5">
              <span className="text-xs text-gray-500 font-medium">{phase.name}</span>
              {phase.element && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{phase.element} energy</span>
                </>
              )}
            </div>
          )}

          {quote && (
            <div className="max-w-lg mx-auto pt-2">
              <p className="font-playfair italic text-gray-600 text-lg leading-relaxed">
                &ldquo;{quote.text}&rdquo;
              </p>
              {quote.author && (
                <p className="text-xs text-gray-400 mt-2">— {quote.author}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Feature cards ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <Link
              key={f.href}
              href={f.href}
              className={`bg-gradient-to-br ${f.gradient} border ${f.border} rounded-2xl p-6 flex flex-col gap-3 hover:shadow-md hover:scale-[1.01] transition-all duration-200 group`}
            >
              <div className="text-3xl">{f.emoji}</div>
              <div>
                <h2 className="font-playfair text-xl text-gray-800 group-hover:text-[#b88a92] transition-colors">
                  {f.label}
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.description}</p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs font-medium" style={{ color: '#b88a92' }}>
                Open
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Chart chat callout ── */}
        <Link
          href="/cosmic"
          className="block bg-gradient-to-br from-violet-50 to-rose-50 border border-violet-100 rounded-2xl p-6 hover:shadow-md hover:scale-[1.01] transition-all duration-200 group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-playfair text-xl text-gray-800 group-hover:text-[#b88a92] transition-colors">
                ✦ Ask Claude about your chart
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your Human Design, astrology, and numerology — ask anything and get a personal answer.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-sm font-medium text-rose-400">
              Ask now
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
