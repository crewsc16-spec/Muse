'use client';

import Link from 'next/link';

const STEPS = [
  {
    icon: '1',
    title: 'Set up your profile',
    desc: 'Add your name, birth date, time, and location so Muse can calculate your chart.',
  },
  {
    icon: '2',
    title: 'Explore your cosmic chart',
    desc: 'Astrology, Human Design, numerology — all personalized to you.',
  },
  {
    icon: '3',
    title: 'Check in daily',
    desc: 'Tarot pulls, moon phases, journal prompts, and a daily vibe curated for your energy.',
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="glass-card rounded-3xl p-8 text-center space-y-3">
          <p className="text-4xl">✦</p>
          <h1 className="font-playfair text-3xl text-gray-800">Welcome to Muse</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your personal space for cosmic self-discovery. Here&apos;s how to get the most out of it.
          </p>
        </div>

        <div className="space-y-3">
          {STEPS.map(s => (
            <div key={s.icon} className="glass-card rounded-2xl p-5 flex gap-4 items-start">
              <span className="shrink-0 w-8 h-8 rounded-full btn-gradient text-white text-sm font-bold flex items-center justify-center">
                {s.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-700">{s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/profile"
          className="btn-gradient block w-full py-3.5 rounded-full text-white font-medium text-sm text-center shadow-sm"
        >
          Set up my profile
        </Link>

        <Link
          href="/"
          className="block text-center text-xs text-gray-400 hover:text-gray-500 transition-colors"
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}
