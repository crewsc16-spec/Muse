'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { getDailyContent, TAROT_IMAGES, ANIMAL_IMAGE_QUERIES } from '@/app/lib/daily-content';

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DailyPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animalImage, setAnimalImage] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const dateStr = getTodayStr();
        const dailyContent = getDailyContent(user.id, dateStr);
        setContent(dailyContent);

        // Fetch watercolor illustration for the spirit animal
        try {
          const query = ANIMAL_IMAGE_QUERIES[dailyContent.animal.name] ?? `${dailyContent.animal.name} watercolor art`;
          const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}&orientation=squarish`);
          const data = await res.json();
          if (data.photos?.length) setAnimalImage(data.photos[0]);
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen pt-8 pb-16">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400 text-sm animate-pulse">Consulting the oracle…</p>
        </div>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="min-h-screen pt-8 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-gray-400 text-sm text-center">Please log in to access your Daily Oracle.</p>
        </div>
      </main>
    );
  }

  const { tarot, animal, quote, word, question, numerology } = content;
  const tarotImageUrl = TAROT_IMAGES[tarot.name];

  return (
    <main className="min-h-screen pt-8 pb-16">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Page title */}
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl text-gray-800 mb-2">Daily Oracle</h1>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* 1. Tarot Card */}
        <section
          className="rounded-3xl text-white shadow-lg overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #16112b, #1e1840)' }}
        >
          {/* Card-specific gradient accent bar */}
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${tarot.gradient[0]}, ${tarot.gradient[1]})` }} />

          {/* Rider-Waite card image — centered, portrait */}
          <div className="flex justify-center pt-8 pb-2 px-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tarotImageUrl}
              alt={tarot.name}
              className="h-72 w-auto rounded-xl shadow-2xl"
              style={{ maxWidth: '185px' }}
            />
          </div>

          <div className="p-8 pt-5">
            <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Tarot Card of the Day</p>
            <h2 className="font-playfair text-3xl font-bold mb-3">{tarot.name}</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {tarot.keywords.map(k => (
                <span
                  key={k}
                  className="text-white/80 text-xs px-3 py-1 rounded-full border"
                  style={{ borderColor: `${tarot.gradient[0]}60`, background: `${tarot.gradient[0]}25` }}
                >
                  {k}
                </span>
              ))}
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">{tarot.description}</p>
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Today's Message</p>
              <p className="text-white/90 font-medium leading-relaxed">{tarot.message}</p>
            </div>
          </div>
        </section>

        {/* 2. Animal Medicine */}
        <section className="glass-card rounded-3xl overflow-hidden">
          {animalImage && (
            <div className="relative w-full h-64 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={animalImage.regular}
                alt={animal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90" />
            </div>
          )}
          <div className="p-8">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Spirit Animal</p>
            <h2 className="font-playfair text-2xl text-gray-800 mb-3">{animal.name}</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{animal.medicine}</p>
            <div className="bg-rose-50 rounded-2xl px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-rose-400 mb-1">Guidance</p>
              <p className="text-gray-700 text-sm leading-relaxed italic">{animal.message}</p>
            </div>
          </div>
        </section>

        {/* 3. Quote of the Day */}
        <section className="glass-card rounded-3xl p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">Quote of the Day</p>
          <blockquote>
            <p className="font-playfair text-xl text-gray-800 italic leading-relaxed mb-4">
              &ldquo;{quote.text}&rdquo;
            </p>
            <footer className="text-sm text-gray-400">— {quote.author}</footer>
          </blockquote>
        </section>

        {/* 4. Word of the Day */}
        <section className="glass-card rounded-3xl p-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Word of the Day</p>
          <div className="mb-4">
            <h2 className="font-playfair text-3xl text-gray-800 mb-1">{word.word}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">{word.pronunciation}</span>
              <span className="bg-violet-100 text-violet-600 text-xs px-2 py-0.5 rounded-full">{word.partOfSpeech}</span>
            </div>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">{word.definition}</p>
          {word.origin && (
            <div className="flex items-start gap-2 mb-4">
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">Origin</span>
              <p className="text-gray-500 text-xs leading-relaxed">{word.origin}</p>
            </div>
          )}
          {word.example && (
            <div className="border-t border-white/50 pt-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Example</p>
              <p className="text-gray-600 text-sm italic leading-relaxed">{word.example}</p>
            </div>
          )}
        </section>

        {/* 5. Philosophical Question */}
        <section className="glass-card rounded-3xl p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">Today's Question</p>
          <p className="font-playfair text-xl text-gray-800 italic leading-relaxed">{question}</p>
        </section>

        {/* 6. Lucky Number */}
        <section className="glass-card rounded-3xl p-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Lucky Number</p>
          <div className="flex items-center gap-6 mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #f9a8d4, #a78bfa)' }}
            >
              <span className="font-playfair text-4xl text-white font-bold">{numerology.number}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {numerology.keywords.map(k => (
                <span key={k} className="bg-violet-100 text-violet-600 text-xs px-2 py-0.5 rounded-full">
                  {k}
                </span>
              ))}
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{numerology.description}</p>
          <div className="border-t border-white/50 pt-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Today's Guidance</p>
            <p className="text-gray-700 text-sm leading-relaxed">{numerology.advice}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
