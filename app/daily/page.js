'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { getDailyContent, TAROT_IMAGES, ANIMAL_IMAGE_QUERIES } from '@/app/lib/daily-content';
import { computeChart, getLunarPhase } from '@/app/lib/astrology';
import { saveVisionItem, getJournalEntries, createJournalEntry, updateJournalEntry } from '@/app/lib/storage';

const VIBE_DATA = {
  fire: {
    palette: ['#f97316', '#e11d48', '#f59e0b'],
    taglines: ['Spark Something New', 'Strike While You\'re Ready', 'Blaze & Shine', 'Let the Fire Transform'],
    keywords: ['Courage', 'Momentum', 'Passion', 'Initiative', 'Vitality'],
    description: 'Fire energy fuels courage and momentum today. Move with intention, let your passion lead, and don\'t be afraid to take up space.',
    leanInto: 'Bold decisions, starting something new, physical movement, creative fire',
    watchFor: 'Impatience, impulsivity, burning yourself out before noon',
  },
  earth: {
    palette: ['#84cc16', '#a16207', '#d4a76a'],
    taglines: ['Plant & Prepare', 'Build & Tend', 'Harvest & Celebrate', 'Rest & Restore'],
    keywords: ['Stability', 'Patience', 'Grounding', 'Nourishment', 'Presence'],
    description: 'Earth energy calls you home to yourself. Slow down, tend to what\'s real, and trust the steady process unfolding beneath your feet.',
    leanInto: 'Practical tasks, nourishing your body, time in nature, finishing what you started',
    watchFor: 'Rigidity, resistance to change, over-scheduling yourself',
  },
  air: {
    palette: ['#818cf8', '#a78bfa', '#93c5fd'],
    taglines: ['Dream & Imagine', 'Think & Act', 'Speak & Connect', 'Let Thoughts Settle'],
    keywords: ['Clarity', 'Curiosity', 'Connection', 'Ideas', 'Perspective'],
    description: 'Air energy sharpens your mind and opens channels of communication. This is a day for ideas, honest conversations, and following your curiosity.',
    leanInto: 'Writing, meaningful conversations, learning, creative brainstorming',
    watchFor: 'Scattered thinking, over-analysis, losing touch with how you feel',
  },
  water: {
    palette: ['#7c3aed', '#0891b2', '#6366f1'],
    taglines: ['Set Your Intentions', 'Dive Deeper', 'Feel Everything', 'Let It Flow Through'],
    keywords: ['Intuition', 'Emotion', 'Depth', 'Healing', 'Receptivity'],
    description: 'Water energy runs deep today. Your intuition is heightened — trust what you sense even when you can\'t fully explain it.',
    leanInto: 'Journaling, rest, creative expression, emotional honesty, solitude',
    watchFor: 'Absorbing others\' emotions, avoidance, mistaking feelings for facts',
  },
};

const PHASE_TO_IDX = {
  seeding: 0, intention: 0,
  action: 1, refinement: 1,
  illumination: 2, gratitude: 2,
  release: 3, surrender: 3,
};

function TodaysVibe({ chartData, dateStr }) {
  const lunarPhase = chartData?.lunarPhase ?? getLunarPhase(dateStr);
  const element    = chartData?.dailyBlend?.[0] ?? lunarPhase?.element ?? 'water';
  const vibe       = VIBE_DATA[element] ?? VIBE_DATA.water;
  const tagline    = vibe.taglines[PHASE_TO_IDX[lunarPhase?.energy] ?? 0];
  const moonSign   = chartData?.transitMoonSign?.sign;

  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-gray-400">Today&apos;s Vibe</p>
        <div className="flex items-center gap-1.5">
          {vibe.palette.map((color, i) => (
            <div key={i} className="w-4 h-4 rounded-full" style={{ background: color }} />
          ))}
          <span className="text-xs text-gray-400 capitalize ml-1">{element}</span>
        </div>
      </div>

      <h2 className="font-playfair text-xl text-gray-800 mb-1">{tagline}</h2>

      {moonSign && (
        <p className="text-xs text-gray-400 mb-3">Moon in {moonSign}{lunarPhase ? ` · ${lunarPhase.name}` : ''}</p>
      )}

      <p className="text-gray-600 text-sm leading-relaxed mb-3">{vibe.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {vibe.keywords.map(k => (
          <span key={k} className="text-xs px-2.5 py-0.5 rounded-full bg-white/60 border border-white/50 text-gray-400">{k}</span>
        ))}
        {lunarPhase && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/60 border border-white/50 text-gray-400 capitalize">{lunarPhase.energy}</span>
        )}
      </div>
    </section>
  );
}

function SaveButton({ itemKey, saved, saving, onClick }) {
  const isSaved  = saved[itemKey];
  const isSaving = saving[itemKey];
  return (
    <button
      onClick={onClick}
      disabled={isSaved || isSaving}
      className={`text-xs px-3 py-1 rounded-full transition-all disabled:cursor-default ${
        isSaved
          ? 'bg-green-50 text-green-500 border border-green-200'
          : 'bg-white/60 border border-white/50 text-gray-400 hover:text-gray-600 hover:bg-white/80'
      }`}
    >
      {isSaved ? 'Saved' : isSaving ? 'Saving…' : 'Save to board'}
    </button>
  );
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DailyPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animalImage, setAnimalImage] = useState(null);
  const [answer, setAnswer] = useState('');
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [reflectionSaved, setReflectionSaved]   = useState(false);
  const [saved, setSaved]   = useState({});
  const [saving, setSaving] = useState({});
  const [journalEntryId, setJournalEntryId] = useState(null);
  const [goodNews, setGoodNews] = useState([]);
  const journalSaveTimer = useRef(null);

  const dateStr = getTodayStr();

  useEffect(() => {
    // localStorage fallback — will be overridden if Supabase entry found
    setAnswer(localStorage.getItem(`daily-reflection-${dateStr}`) ?? '');
    setReflectionSaved(localStorage.getItem(`daily-reflection-saved-${dateStr}`) === 'true');

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const dateStr = getTodayStr();
        const meta = user.user_metadata ?? {};
        let chartData = null;
        try {
          const bd = meta.birthData ?? JSON.parse(localStorage.getItem('birthData') ?? 'null');
          if (bd) chartData = computeChart(bd, dateStr);
        } catch {}
        const dailyContent = getDailyContent(user.id, dateStr, chartData);
        setContent({ ...dailyContent, chartData });

        // Load today's journal entry (overrides localStorage)
        try {
          const entries = await getJournalEntries(supabase);
          const todayEntry = entries.find(e => e.date === dateStr);
          if (todayEntry) {
            setAnswer(todayEntry.content);
            setJournalEntryId(todayEntry.id);
          }
        } catch (e) {
          console.error('[daily] load journal', e);
        }

        // Spirit animal image — cached by date so it stays consistent all day
        const imgCacheKey = `daily-animal-image-${dateStr}`;

        // Evict any cached images from previous days
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('daily-animal-image-') && key !== imgCacheKey) {
            localStorage.removeItem(key);
          }
        }

        const cached = localStorage.getItem(imgCacheKey);
        if (cached) {
          try { setAnimalImage(JSON.parse(cached)); } catch {}
        } else {
          try {
            const query = ANIMAL_IMAGE_QUERIES[dailyContent.animal.name] ?? `${dailyContent.animal.name} watercolor art`;
            const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}&orientation=squarish`);
            const data = await res.json();
            if (data.photos?.length) {
              setAnimalImage(data.photos[0]);
              localStorage.setItem(imgCacheKey, JSON.stringify(data.photos[0]));
            }
          } catch {}
        }
      }

      // Good news — cached per day
      const newsCacheKey = `daily-good-news-${dateStr}`;
      const cachedNews = localStorage.getItem(newsCacheKey);
      if (cachedNews) {
        try { setGoodNews(JSON.parse(cachedNews)); } catch {}
      } else {
        try {
          const newsRes = await fetch('/api/good-news');
          const newsData = await newsRes.json();
          if (newsData.headlines?.length) {
            setGoodNews(newsData.headlines);
            localStorage.setItem(newsCacheKey, JSON.stringify(newsData.headlines));
          }
        } catch {}
      }

      setLoading(false);
    });
  }, []);

  function handleAnswerChange(val) {
    setAnswer(val);
    localStorage.setItem(`daily-reflection-${dateStr}`, val);
    // Debounce auto-save to Supabase
    clearTimeout(journalSaveTimer.current);
    if (!val.trim()) return;
    journalSaveTimer.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        if (journalEntryId) {
          await updateJournalEntry(supabase, journalEntryId, { content: val });
        } else {
          const entry = await createJournalEntry(supabase, {
            date: dateStr,
            content: val,
            prompt: content?.question ?? null,
          });
          if (entry) setJournalEntryId(entry.id);
        }
      } catch (e) {
        console.error('[daily] journal save', e);
      }
    }, 1500);
  }

  async function handleSaveToBoard() {
    if (!answer.trim() || !content?.question) return;
    setReflectionSaving(true);
    try {
      const supabase = createClient();
      await saveVisionItem(supabase, {
        type: 'reflection',
        category: 'reflection',
        content: `${content.question}\n\n${answer.trim()}`,
      });
      localStorage.setItem(`daily-reflection-saved-${dateStr}`, 'true');
      setReflectionSaved(true);
    } catch (err) {
      console.error('[save reflection]', err);
    } finally {
      setReflectionSaving(false);
    }
  }

  async function handleSave(key, visionItem) {
    if (saved[key] || saving[key]) return;
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const sb = createClient();
      await saveVisionItem(sb, visionItem);
      setSaved(prev => ({ ...prev, [key]: true }));
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  }

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

  // Route Wikimedia images through our own API proxy (avoids hotlink/referrer blocking)
  const rawUrl = TAROT_IMAGES[tarot.name];
  const tarotFilename = rawUrl?.split('/Special:FilePath/')[1];
  const tarotImageUrl = tarotFilename
    ? `/api/tarot?file=${encodeURIComponent(tarotFilename)}`
    : null;

  return (
    <main className="min-h-screen pt-8 pb-16">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Page title */}
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl text-gray-800 mb-2">Daily Oracle</h1>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {content.chartData?.sunSign && (
            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-gray-300">✦ Personalised by your natal chart</p>
              <p className="text-xs text-gray-300/60">Guided by your chart — with space left for your higher power.</p>
            </div>
          )}
          {/* Cosmic weather strip — changes daily based on transits */}
          {content.chartData?.lunarPhase && (
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
              <span className="text-xs text-gray-400">
                {content.chartData.lunarPhase.emoji} {content.chartData.lunarPhase.name}
              </span>
              {content.chartData.transitMoonSign && (
                <span className="text-xs text-gray-400">
                  🌙 Moon in {content.chartData.transitMoonSign.sign}
                </span>
              )}
              {content.chartData.dayRuler && (
                <span className="text-xs text-gray-400">
                  ✶ {content.chartData.dayRuler.planet} day
                </span>
              )}
              {content.chartData?.hdType && content.chartData?.hdProfile && (
                <span className="text-xs text-gray-400">
                  ✦ {content.chartData.hdType.replace(/-/g, ' ')} {content.chartData.hdProfile}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Today's Vibe */}
        <TodaysVibe chartData={content.chartData} dateStr={getTodayStr()} />

        {/* Good News */}
        {goodNews.length > 0 && (
          <section className="glass-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Good News Today</p>
            <div className="space-y-3">
              {goodNews.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white/40 border border-white/50 rounded-2xl px-4 py-3 hover:bg-white/60 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-700 leading-snug">{item.title}</p>
                  {item.snippet && (
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{item.snippet}</p>
                  )}
                </a>
              ))}
            </div>
            <p className="text-[10px] text-gray-300 mt-3 text-right">via Good News Network</p>
          </section>
        )}

        {/* 1. Tarot Card */}
        <section
          className="rounded-3xl shadow-lg overflow-hidden"
          style={{
            backgroundColor: '#fdf8f3',
            backgroundImage: `radial-gradient(circle at top right, ${tarot.gradient[0]}22, ${tarot.gradient[1]}10 60%)`,
          }}
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
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Tarot Card of the Day</p>
            <h2 className="font-playfair text-3xl font-bold text-gray-800 mb-3">{tarot.name}</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {tarot.keywords.map(k => (
                <span
                  key={k}
                  className="text-gray-700 text-xs px-3 py-1 rounded-full border"
                  style={{ borderColor: `${tarot.gradient[0]}50`, background: `${tarot.gradient[0]}20` }}
                >
                  {k}
                </span>
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{tarot.description}</p>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">Today's Message</p>
              <p className="text-gray-700 font-medium leading-relaxed">{tarot.message}</p>
            </div>
            <div className="flex justify-end mt-4">
              <SaveButton
                itemKey="tarot"
                saved={saved}
                saving={saving}
                onClick={() => handleSave('tarot', { type: 'image', category: 'personal', content: tarot.name, image_url: tarotImageUrl })}
              />
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
            <div className="flex justify-end mt-4">
              <SaveButton
                itemKey="animal"
                saved={saved}
                saving={saving}
                onClick={() => handleSave('animal', animalImage
                  ? { type: 'image', category: 'personal', content: animal.name, image_url: animalImage.regular }
                  : { type: 'affirmation', category: 'personal', content: `${animal.name} — ${animal.message}` }
                )}
              />
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
          <div className="flex justify-end mt-4">
            <SaveButton
              itemKey="quote"
              saved={saved}
              saving={saving}
              onClick={() => handleSave('quote', { type: 'quote', category: 'personal', content: `"${quote.text}" — ${quote.author}` })}
            />
          </div>
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
          <div className="flex justify-end mt-4">
            <SaveButton
              itemKey="word"
              saved={saved}
              saving={saving}
              onClick={() => handleSave('word', { type: 'affirmation', category: 'personal', content: `${word.word}: ${word.definition}` })}
            />
          </div>
        </section>

        {/* 5. Philosophical Question */}
        <section className="glass-card rounded-3xl p-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-5 text-center">Today&apos;s Question</p>
          <p className="font-playfair text-xl text-gray-800 italic leading-relaxed text-center mb-6">{question}</p>
          <div className="flex justify-end mb-4">
            <SaveButton
              itemKey="question"
              saved={saved}
              saving={saving}
              onClick={() => handleSave('question', { type: 'affirmation', category: 'personal', content: question })}
            />
          </div>
          <textarea
            value={answer}
            onChange={e => handleAnswerChange(e.target.value)}
            placeholder="Write your reflection here…"
            rows={4}
            className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-base text-gray-700 placeholder-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-rose-200"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-300">{answer.trim() ? 'Draft saved' : ''}</p>
            {answer.trim() && (
              <button
                onClick={handleSaveToBoard}
                disabled={reflectionSaving || reflectionSaved}
                className={`text-xs px-4 py-2 rounded-full font-medium transition-all ${
                  reflectionSaved ? 'bg-green-100 text-green-600' : 'btn-gradient text-white hover:opacity-90 disabled:opacity-60'
                }`}
              >
                {reflectionSaved ? 'Saved to board ✓' : reflectionSaving ? 'Saving…' : 'Save to Board'}
              </button>
            )}
          </div>
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
          <div className="flex justify-end mt-4">
            <SaveButton
              itemKey="numerology"
              saved={saved}
              saving={saving}
              onClick={() => handleSave('numerology', { type: 'affirmation', category: 'personal', content: `${numerology.number} — ${numerology.advice}` })}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
