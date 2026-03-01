'use client';

import Link from 'next/link';

const FEATURES = [
  { label: 'Your birth chart', desc: 'Astrology, Human Design, and numerology tailored to you' },
  { label: 'Daily guidance', desc: 'Tarot pulls, moon phases, and a vibe matched to your energy' },
  { label: 'Journal & vision board', desc: 'Track your moods, reflect, and visualize your intentions' },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="glass-card rounded-3xl p-8 text-center space-y-3">
          <p className="text-4xl">✦</p>
          <h1 className="font-playfair text-3xl text-gray-800">Welcome to Muse</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            To unlock everything Muse has to offer, we need a few details first — your name, birth date, time, and location. This is what powers your entire experience.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">What you'll unlock</p>
          {FEATURES.map(f => (
            <div key={f.label} className="flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-rose-400 to-violet-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">{f.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
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
      </div>
    </div>
  );
}
