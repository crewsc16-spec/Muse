'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { saveVisionItem } from '@/app/lib/storage';

// ─── Quiz Data ────────────────────────────────────────────────────────────────

const QUIZZES = [
  {
    id: 'element',
    emoji: '🔮',
    title: "What's Your Elemental Archetype?",
    description: 'Discover which of the four classical elements — fire, earth, air, or water — best mirrors your inner nature.',
    questions: [
      {
        text: 'When you wake up in the morning, your first instinct is to…',
        options: [
          { label: 'Jump up and get moving', value: 'fire' },
          { label: 'Make a slow, nourishing breakfast', value: 'earth' },
          { label: 'Check your messages and plan the day', value: 'air' },
          { label: 'Lie still and let your dreams linger', value: 'water' },
        ],
      },
      {
        text: 'Your ideal creative outlet is…',
        options: [
          { label: 'Dancing, performance, or bold visual art', value: 'fire' },
          { label: 'Gardening, cooking, or sculpting', value: 'earth' },
          { label: 'Writing, music, or design', value: 'air' },
          { label: 'Poetry, painting, or dream journaling', value: 'water' },
        ],
      },
      {
        text: 'In a group setting you tend to be…',
        options: [
          { label: 'The one sparking energy and excitement', value: 'fire' },
          { label: 'The reliable, steady presence', value: 'earth' },
          { label: 'The one full of ideas and questions', value: 'air' },
          { label: 'The empathic listener who reads the room', value: 'water' },
        ],
      },
      {
        text: 'When you face a challenge you…',
        options: [
          { label: 'Attack it head-on with confidence', value: 'fire' },
          { label: 'Work through it step by patient step', value: 'earth' },
          { label: 'Think it through from every angle', value: 'air' },
          { label: 'Sit with it until intuition guides you', value: 'water' },
        ],
      },
      {
        text: 'Your relationship with time is…',
        options: [
          { label: 'Live for the moment', value: 'fire' },
          { label: 'Honour the rhythms and seasons', value: 'earth' },
          { label: 'Plan ahead, always curious about the future', value: 'air' },
          { label: 'Float between past memories and future dreams', value: 'water' },
        ],
      },
      {
        text: 'The phrase that resonates most is…',
        options: [
          { label: '"Fortune favours the bold."', value: 'fire' },
          { label: '"Slow and steady wins the race."', value: 'earth' },
          { label: '"Knowledge is power."', value: 'air' },
          { label: '"Go with the flow."', value: 'water' },
        ],
      },
      {
        text: 'When you need to recharge you…',
        options: [
          { label: 'Get physical — a run, a hike, something intense', value: 'fire' },
          { label: 'Spend time in nature or tending a cosy space', value: 'earth' },
          { label: 'Read, watch something stimulating, or talk it out', value: 'air' },
          { label: 'Take a bath, journal, or just feel your feelings', value: 'water' },
        ],
      },
      {
        text: 'Your greatest strength is…',
        options: [
          { label: 'Courage and infectious enthusiasm', value: 'fire' },
          { label: 'Dependability and practical wisdom', value: 'earth' },
          { label: 'Wit and the ability to see the bigger picture', value: 'air' },
          { label: 'Deep empathy and emotional intelligence', value: 'water' },
        ],
      },
    ],
    results: {
      fire: {
        title: 'Fire Archetype',
        emoji: '🔥',
        tagline: 'You burn bright and lead the way.',
        description:
          'Your spirit is ignited by passion, courage, and the thrill of becoming. You light up every room, inspire others to take risks, and refuse to let life grow dull. The fire within you is a creative force — it demands expression and forward motion.',
        keywords: ['Courage', 'Passion', 'Momentum', 'Leadership', 'Vitality'],
      },
      earth: {
        title: 'Earth Archetype',
        emoji: '🌿',
        tagline: 'You are rooted, real, and deeply nourishing.',
        description:
          'Your power lives in patience, presence, and the quiet wisdom of things that grow slowly. You build what lasts. Others feel safe in your orbit because you offer the rare gift of genuine steadiness. Trust the soil beneath your feet — you were made to bloom.',
        keywords: ['Stability', 'Patience', 'Grounding', 'Nourishment', 'Wisdom'],
      },
      air: {
        title: 'Air Archetype',
        emoji: '🌬️',
        tagline: 'Your mind moves the world.',
        description:
          'You are a natural thinker, connector, and communicator. Ideas flow through you like wind, and your curiosity keeps life perpetually interesting. You thrive in the realm of conversation, learning, and the exchange of perspectives. Your gift is seeing what others miss.',
        keywords: ['Clarity', 'Curiosity', 'Ideas', 'Connection', 'Perspective'],
      },
      water: {
        title: 'Water Archetype',
        emoji: '🌊',
        tagline: 'You feel everything — and that is your power.',
        description:
          'Your depth is immeasurable. You move through the world with heightened intuition, emotional intelligence, and a sensitivity that borders on the mystical. You heal, you reflect, you flow around obstacles rather than forcing your way through. Your greatest wisdom lives below the surface.',
        keywords: ['Intuition', 'Emotion', 'Healing', 'Depth', 'Receptivity'],
      },
    },
  },
  {
    id: 'seeker',
    emoji: '✨',
    title: 'What Kind of Spiritual Seeker Are You?',
    description: 'Uncover your unique path — whether you seek through mystery, groundedness, vision, or empathic connection.',
    questions: [
      {
        text: 'Spiritual growth, to you, looks like…',
        options: [
          { label: 'Diving into ancient traditions and hidden symbols', value: 'mystic' },
          { label: 'Tending your body, routines, and daily rituals', value: 'grounded' },
          { label: 'Dreaming big and aligning your life with a higher purpose', value: 'visionary' },
          { label: 'Opening your heart and serving those around you', value: 'empath' },
        ],
      },
      {
        text: 'Your spiritual practice most often involves…',
        options: [
          { label: 'Tarot, astrology, or ritual magic', value: 'mystic' },
          { label: 'Yoga, meditation, or time in nature', value: 'grounded' },
          { label: 'Visualisation, manifestation work, or vision boards', value: 'visionary' },
          { label: 'Prayer, energy healing, or holding space for others', value: 'empath' },
        ],
      },
      {
        text: 'The concept that resonates most deeply is…',
        options: [
          { label: 'As above, so below', value: 'mystic' },
          { label: 'The present moment is sacred', value: 'grounded' },
          { label: 'You create your own reality', value: 'visionary' },
          { label: 'We are all one', value: 'empath' },
        ],
      },
      {
        text: 'You feel most spiritually alive when…',
        options: [
          { label: 'Uncovering a synchronicity or hidden pattern', value: 'mystic' },
          { label: 'Walking barefoot on earth or tending your garden', value: 'grounded' },
          { label: 'A bold new vision for your life comes into focus', value: 'visionary' },
          { label: 'You feel a profound, wordless connection with another soul', value: 'empath' },
        ],
      },
      {
        text: 'Your spiritual shadow (the thing you most need to work on) is…',
        options: [
          { label: 'Getting lost in esoteric rabbit holes', value: 'mystic' },
          { label: 'Being so rooted you resist necessary change', value: 'grounded' },
          { label: 'Living so much in the future you miss today', value: 'visionary' },
          { label: 'Absorbing others\' energy until you\'re depleted', value: 'empath' },
        ],
      },
      {
        text: 'The book that would most speak to you is…',
        options: [
          { label: 'A guide to occult symbolism or esoteric philosophy', value: 'mystic' },
          { label: 'A wisdom text on mindfulness and embodied living', value: 'grounded' },
          { label: 'A memoir about someone who followed their wildest dream', value: 'visionary' },
          { label: 'A story about deep human connection and compassionate service', value: 'empath' },
        ],
      },
      {
        text: 'The moon speaks to you as…',
        options: [
          { label: 'A portal into hidden realms and occult timing', value: 'mystic' },
          { label: 'A natural anchor for seasons, cycles, and rest', value: 'grounded' },
          { label: 'A reminder to set intentions and track your manifestations', value: 'visionary' },
          { label: 'A reflection of the tides of feeling within you', value: 'empath' },
        ],
      },
      {
        text: 'If you could have one spiritual gift it would be…',
        options: [
          { label: 'The ability to read any symbol, dream, or omen', value: 'mystic' },
          { label: 'Unshakeable peace in any circumstance', value: 'grounded' },
          { label: 'Crystal-clear vision of your soul\'s purpose', value: 'visionary' },
          { label: 'The power to truly feel and heal another\'s pain', value: 'empath' },
        ],
      },
    ],
    results: {
      mystic: {
        title: 'The Mystic',
        emoji: '🌙',
        tagline: 'You walk between worlds.',
        description:
          'You are drawn to the veiled, the symbolic, and the mysteriously interconnected. Astrology, tarot, dreams, and ancient wisdom traditions are your native language. You see meaning where others see coincidence, and your path is one of eternal initiation — always uncovering another layer of the great mystery.',
        keywords: ['Mystery', 'Symbolism', 'Depth', 'Occult', 'Initiation'],
      },
      grounded: {
        title: 'The Grounded Soul',
        emoji: '🌱',
        tagline: 'The sacred lives in the everyday.',
        description:
          'Your spirituality is embodied, practical, and deeply real. You find the divine in a morning ritual, a mindful meal, the soil under your nails. You don\'t need grand revelations — you trust the slow, steady accumulation of presence. Your path is the most ancient of all: to be here, fully.',
        keywords: ['Presence', 'Embodiment', 'Ritual', 'Nature', 'Simplicity'],
      },
      visionary: {
        title: 'The Visionary',
        emoji: '🦋',
        tagline: 'You hold the blueprint for what is possible.',
        description:
          'You are a dreamer and a builder of new worlds. Your spirituality is forward-facing, fuelled by faith in possibility and the conviction that consciousness can shape reality. You are most alive when casting a bold vision, aligning your energy with your purpose, and taking inspired action toward a life that doesn\'t yet exist.',
        keywords: ['Vision', 'Manifestation', 'Purpose', 'Possibility', 'Inspiration'],
      },
      empath: {
        title: 'The Empath',
        emoji: '💜',
        tagline: 'Love is your most powerful practice.',
        description:
          'Your spiritual path runs through the heart. You experience the divine most vividly in connection — in the moment of genuine recognition between souls, in the act of compassionate service, in the beauty of shared vulnerability. Your gift is boundless empathy; your work is to learn to hold that gift without losing yourself.',
        keywords: ['Compassion', 'Connection', 'Healing', 'Service', 'Empathy'],
      },
    },
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuizzesPage() {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [step, setStep]             = useState(0);
  const [answers, setAnswers]       = useState([]);
  const [result, setResult]         = useState(null);
  const [embeds, setEmbeds]         = useState([]);
  const [embedInput, setEmbedInput] = useState({ title: '', url: '' });
  const [saved, setSaved]           = useState({});
  const [saving, setSaving]         = useState({});
  const [sb, setSb]                 = useState(null);

  useEffect(() => {
    const client = createClient();
    setSb(client);
    try {
      const stored = localStorage.getItem('quiz-embeds');
      if (stored) setEmbeds(JSON.parse(stored));
    } catch {}
  }, []);

  // ─── Quiz logic ────────────────────────────────────────────────────────────

  function startQuiz(quiz) {
    setActiveQuiz(quiz);
    setStep(0);
    setAnswers([]);
    setResult(null);
  }

  function resetToList() {
    setActiveQuiz(null);
    setStep(0);
    setAnswers([]);
    setResult(null);
  }

  function retake() {
    setStep(0);
    setAnswers([]);
    setResult(null);
  }

  function handleAnswer(value) {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    const questions = activeQuiz.questions;
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Tally votes
      const tally = {};
      for (const v of newAnswers) tally[v] = (tally[v] ?? 0) + 1;
      const winner = Object.keys(activeQuiz.results).reduce(
        (best, key) => (tally[key] ?? 0) > (tally[best] ?? 0) ? key : best,
        Object.keys(activeQuiz.results)[0]
      );
      setResult(activeQuiz.results[winner]);
    }
  }

  async function handleSave(quizId) {
    if (!sb || !result) return;
    setSaving(s => ({ ...s, [quizId]: true }));
    try {
      await saveVisionItem(sb, {
        type: 'affirmation',
        category: 'personal',
        content: `${result.emoji} ${result.title} — ${result.tagline} ${result.description}`,
      });
      setSaved(s => ({ ...s, [quizId]: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(s => ({ ...s, [quizId]: false }));
    }
  }

  // ─── Embed logic ───────────────────────────────────────────────────────────

  function addEmbed() {
    const url = embedInput.url.trim();
    const title = embedInput.title.trim() || 'Quiz';
    if (!url) return;
    const next = [...embeds, { id: Date.now(), title, url }];
    setEmbeds(next);
    localStorage.setItem('quiz-embeds', JSON.stringify(next));
    setEmbedInput({ title: '', url: '' });
  }

  function removeEmbed(id) {
    const next = embeds.filter(e => e.id !== id);
    setEmbeds(next);
    localStorage.setItem('quiz-embeds', JSON.stringify(next));
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const progress = activeQuiz
    ? Math.round((step / activeQuiz.questions.length) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fdf8f3 0%, #fce8e8 50%, #e8e0f5 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Quiz card ── */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">

          {/* View A: List */}
          {!activeQuiz && (
            <>
              <h1 className="font-playfair text-3xl mb-1" style={{ color: '#b88a92' }}>Quizzes</h1>
              <p className="text-sm text-gray-500 mb-6">Explore yourself through thoughtful personality quizzes.</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {QUIZZES.map(quiz => (
                  <div key={quiz.id} className="bg-white/60 border border-white/50 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="text-3xl">{quiz.emoji}</div>
                    <div>
                      <h2 className="font-playfair text-lg leading-snug text-gray-800">{quiz.title}</h2>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{quiz.description}</p>
                    </div>
                    <button
                      onClick={() => startQuiz(quiz)}
                      className="btn-gradient text-white text-sm font-medium px-5 py-2 rounded-full self-start mt-auto"
                    >
                      Take Quiz
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* View B: In-progress */}
          {activeQuiz && !result && (
            <>
              <button
                onClick={resetToList}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#b88a92] transition-colors mb-5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{activeQuiz.emoji}</span>
                <h2 className="font-playfair text-xl text-gray-800">{activeQuiz.title}</h2>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/40 rounded-full h-1.5 mb-6">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #f43f5e, #a78bfa)' }}
                />
              </div>

              <p className="text-xs text-gray-400 mb-2">
                Question {step + 1} of {activeQuiz.questions.length}
              </p>

              <p className="font-playfair italic text-xl text-gray-700 mb-6 leading-snug">
                {activeQuiz.questions[step].text}
              </p>

              <div className="space-y-3">
                {activeQuiz.questions[step].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.value)}
                    className="w-full text-left p-4 rounded-2xl bg-white/60 border border-white/50 hover:bg-white/80 hover:border-[#d4adb6] transition-all text-sm text-gray-700"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* View C: Result */}
          {activeQuiz && result && (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">{result.emoji}</div>
                <h2 className="font-playfair text-2xl text-gray-800 mb-1">{result.title}</h2>
                <p className="text-sm font-medium" style={{ color: '#b88a92' }}>{result.tagline}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-5">
                {result.keywords.map(kw => (
                  <span
                    key={kw}
                    className="text-xs px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-500 font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed text-center mb-8 max-w-lg mx-auto">
                {result.description}
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => handleSave(activeQuiz.id)}
                  disabled={saving[activeQuiz.id] || saved[activeQuiz.id]}
                  className="btn-gradient text-white text-sm font-medium px-6 py-2.5 rounded-full disabled:opacity-60"
                >
                  {saving[activeQuiz.id]
                    ? 'Saving…'
                    : saved[activeQuiz.id]
                    ? 'Saved to board ✓'
                    : 'Save to board'}
                </button>
                <button
                  onClick={retake}
                  className="text-sm text-gray-500 hover:text-[#b88a92] transition-colors border border-gray-200 hover:border-[#d4adb6] rounded-full px-6 py-2.5"
                >
                  Retake
                </button>
                <button
                  onClick={resetToList}
                  className="text-sm text-gray-500 hover:text-[#b88a92] transition-colors border border-gray-200 hover:border-[#d4adb6] rounded-full px-6 py-2.5"
                >
                  All Quizzes
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── External Embeds ── */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <h2 className="font-playfair text-xl text-gray-800 mb-1">Your Embeds</h2>
          <p className="text-xs text-gray-500 mb-5">
            Paste any quiz URL — Typeform, Google Forms, or any embeddable link.
          </p>

          {/* Add embed row */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Title"
              value={embedInput.title}
              onChange={e => setEmbedInput(v => ({ ...v, title: e.target.value }))}
              className="w-32 flex-shrink-0 text-sm bg-white/60 border border-white/50 rounded-xl px-3 py-2 outline-none focus:border-[#d4adb6] placeholder-gray-300"
            />
            <input
              type="url"
              placeholder="https://…"
              value={embedInput.url}
              onChange={e => setEmbedInput(v => ({ ...v, url: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addEmbed()}
              className="flex-1 text-sm bg-white/60 border border-white/50 rounded-xl px-3 py-2 outline-none focus:border-[#d4adb6] placeholder-gray-300"
            />
            <button
              onClick={addEmbed}
              className="btn-gradient text-white text-sm font-medium px-4 py-2 rounded-xl whitespace-nowrap"
            >
              Add
            </button>
          </div>

          {embeds.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No embeds yet — add one above.</p>
          ) : (
            <div className="space-y-6">
              {embeds.map(embed => (
                <div key={embed.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{embed.title}</span>
                    <button
                      onClick={() => removeEmbed(embed.id)}
                      className="text-gray-300 hover:text-rose-400 transition-colors text-lg leading-none"
                      aria-label="Remove embed"
                    >
                      ×
                    </button>
                  </div>
                  <iframe
                    src={embed.url}
                    width="100%"
                    height="600"
                    className="rounded-2xl border border-white/40"
                    allow="*"
                    title={embed.title}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
