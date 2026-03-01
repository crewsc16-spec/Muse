'use client';

import { useState, useEffect } from 'react';

// ─── HD Gate Wheel (for longitude reconstruction from gate+line) ──────────────
const GATE_WHEEL = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,
  8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,
  47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,
  38,54,61,60,
];

// ─── Zodiac ───────────────────────────────────────────────────────────────────
const SIGN_NAMES     = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_SYMBOLS   = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_ELEMENTS  = ['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
const SIGN_MODALS    = ['cardinal','fixed','mutable','cardinal','fixed','mutable','cardinal','fixed','mutable','cardinal','fixed','mutable'];

function lonToSign(lon) {
  const norm = ((lon % 360) + 360) % 360;
  const i = Math.floor(norm / 30);
  return { name: SIGN_NAMES[i], symbol: SIGN_SYMBOLS[i], element: SIGN_ELEMENTS[i], modality: SIGN_MODALS[i], degree: (norm % 30).toFixed(1) };
}

function gateLineToLon(gate, line) {
  const idx = GATE_WHEEL.indexOf(gate);
  if (idx === -1) return 0;
  return ((302 + idx * 5.625 + (line - 0.5) * 0.9375) % 360 + 360) % 360;
}

// ─── Aspects ──────────────────────────────────────────────────────────────────
const ASPECT_DEFS = [
  { name: 'Conjunction', symbol: '☌', color: '#f59e0b', angle:   0, orb: 8 },
  { name: 'Sextile',     symbol: '⚹', color: '#34d399', angle:  60, orb: 4 },
  { name: 'Square',      symbol: '□', color: '#f87171', angle:  90, orb: 6 },
  { name: 'Trine',       symbol: '△', color: '#60a5fa', angle: 120, orb: 6 },
  { name: 'Opposition',  symbol: '☍', color: '#c084fc', angle: 180, orb: 8 },
];

function computeAspects(lonMap) {
  const bodies = Object.entries(lonMap).filter(([k]) => !['northNode','southNode','earth'].includes(k));
  const aspects = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const [n1, l1] = bodies[i];
      const [n2, l2] = bodies[j];
      const diff  = ((l2 - l1) % 360 + 360) % 360;
      const angle = Math.min(diff, 360 - diff);
      for (const asp of ASPECT_DEFS) {
        if (Math.abs(angle - asp.angle) <= asp.orb) {
          aspects.push({ planet1: n1, planet2: n2, ...asp, orb: Math.abs(angle - asp.angle).toFixed(1) });
          break;
        }
      }
    }
  }
  return aspects;
}

// ─── Numerology ───────────────────────────────────────────────────────────────
function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((s, d) => s + +d, 0);
  }
  return n;
}
function getLifePath(dateStr) {
  return reduceNum(dateStr.replace(/-/g,'').split('').reduce((s, d) => s + +d, 0));
}
function getPersonalYear(dateStr, todayStr) {
  const [, bm, bd] = dateStr.split('-').map(Number);
  const [ty] = todayStr.split('-').map(Number);
  return reduceNum(bm + bd + ty);
}
function getBirthdayNum(dateStr) {
  const day = +dateStr.split('-')[2];
  return day > 9 ? reduceNum(day) : day;
}
function getExpressionNum(name) {
  if (!name?.trim()) return null;
  const MAP = {A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8};
  const sum = name.toUpperCase().replace(/[^A-Z]/g,'').split('').reduce((s,c) => s + (MAP[c]??0), 0);
  return reduceNum(sum);
}

// ─── Descriptions ─────────────────────────────────────────────────────────────
const LIFE_PATH = {
  1:  { title: 'The Leader',        desc: 'You are here to pioneer, to initiate, and to stand in your own power. Independence, originality, and self-reliance are your greatest strengths. Your soul\'s purpose is to learn courage and forge a path where none existed before.' },
  2:  { title: 'The Diplomat',      desc: 'You are here to bring harmony, to partner, and to listen deeply. Sensitivity, cooperation, and intuition are your gifts. Your path is one of service through connection — you thrive when you trust that your presence alone is enough.' },
  3:  { title: 'The Creator',       desc: 'You are here to express, to inspire, and to bring joy. Creativity, communication, and emotional depth are woven into your purpose. When you share what lives inside you freely and without fear, you light up the world around you.' },
  4:  { title: 'The Builder',       desc: 'You are here to create lasting foundations — in work, in relationships, in life. Discipline, loyalty, and methodical effort are your superpowers. The structures you build outlast you; that is your legacy to the world.' },
  5:  { title: 'The Adventurer',    desc: 'You are here to experience, to adventure, and to usher in change. Adaptability, curiosity, and a love of freedom define your path. Your greatest gift is showing others what becomes possible when you stop playing it safe.' },
  6:  { title: 'The Nurturer',      desc: 'You are here to love, to heal, and to serve with grace. Responsibility, beauty, and deep care for others are your nature. You create harmony wherever you go — remember to give that same grace and care to yourself.' },
  7:  { title: 'The Seeker',        desc: 'You are here to know — to go deep, to question, and to touch the mystery of things. Wisdom, introspection, and spiritual insight are your gifts. You carry answers that can only be found in stillness and solitude.' },
  8:  { title: 'The Manifestor',    desc: 'You are here to master the material world — to build empires, lead, and create abundance. Power, ambition, and executive vision are your nature. Your purpose is to wield great influence with equal integrity.' },
  9:  { title: 'The Humanitarian',  desc: 'You are here to serve the whole — to complete, to release, and to love without conditions. Compassion, wisdom, and universal perspective are your gifts. Your deepest fulfillment comes through giving back what you have learned.' },
  11: { title: 'The Illuminator',   desc: 'You carry Master Number 11 — a path of profound spiritual sensitivity, intuition, and inspiration. You are a channel between the seen and unseen worlds. Others are uplifted simply by being near you when you are fully aligned.' },
  22: { title: 'The Master Builder',desc: 'You carry Master Number 22 — the most powerful vibration in numerology. You are here to turn visionary dreams into real-world structures that serve all of humanity. Your potential is enormous; so is your responsibility to ground it.' },
  33: { title: 'The Master Teacher',desc: 'You carry Master Number 33 — the highest expression of compassion and service. You are here to uplift through love, truth, and healing. When you live your purpose fully, you become a light for the collective transformation of consciousness.' },
};

const PERSONAL_YEAR = {
  1: 'A year of new beginnings — plant seeds, set clear intentions, and step boldly into something new.',
  2: 'A year of patience and partnership — relationships deepen, intuition sharpens, and cooperation opens doors.',
  3: 'A year of creativity and joy — express yourself freely, say yes to beauty, and expand your social world.',
  4: 'A year of foundations — do the work, build the systems, and lay the bricks that create lasting results.',
  5: 'A year of change and freedom — expect the unexpected, embrace movement, and release what no longer fits.',
  6: 'A year of love and responsibility — home, family, healing, and beauty take center stage.',
  7: 'A year of reflection — go within, rest deeply, and seek the truth that only stillness can reveal.',
  8: 'A year of power and abundance — material matters rise, claim your worth, and step into authority.',
  9: 'A year of completion — release what no longer serves to clear the way for all that is coming next.',
};

const HD_TYPE = {
  'generator':             'You are a Generator — the life force of this world. You are designed to respond to life, not initiate it. When something lights you up with a deep gut "uh-huh," that is your sacral wisdom speaking. Wait to respond, and watch your path illuminate.',
  'manifesting-generator': 'You are a Manifesting Generator — a powerhouse of energy and multi-passionate creation. You respond first, then inform others of your chosen path. You move fast, skip steps others need, and do it your own way. This is not a flaw — it is your design.',
  'manifestor':            'You are a Manifestor — the initiator, the trailblazer, the one who impacts the world simply by moving through it. You don\'t need to wait for anyone. Your strategy is to inform those in your field before you act, releasing resistance before it begins.',
  'projector':             'You are a Projector — the wise guide and the one who truly sees others more deeply than they see themselves. You are designed to manage, direct, and guide — but only when genuinely invited. Your gift is penetrating insight. Wait for the recognition.',
  'reflector':             'You are a Reflector — the rarest and most mystical type in Human Design. You are a mirror of your environment, sampling and reflecting the health and truth of your community back to it. A full lunar cycle (29.5 days) is your timing for major decisions.',
};

const AUTHORITY = {
  'emotional':      'Emotional Authority: You make decisions through your emotional wave. There is no truth in the now for you — clarity comes when the wave has moved through and reached stillness. Sleep on every significant decision. Let yourself feel it across time.',
  'sacral':         'Sacral Authority: Your gut knows before your mind does. The deep body response of "uh-huh" or "uh-uh" is your most reliable oracle. Not logic, not emotion — the immediate felt response in your body. Trust it. It does not explain itself.',
  'splenic':        'Splenic Authority: Your spleen speaks once, quietly, in the moment — and never repeats itself. It is the oldest intelligence in your body, wired for survival and well-being. If you felt it, it was real. It is gone if you wait. Act when you hear it.',
  'ego':            'Ego Authority: Your will and desire are your inner compass. When you speak from the heart about what you want and what you don\'t want, the truth emerges. You make commitments you can keep — and when something no longer calls to you, you honor that too.',
  'self-projected': 'Self-Projected Authority: You discover your truth by hearing yourself speak it. Talk to people you trust, and listen carefully to what you say — not to their response, but to the sound and feel of your own words. Your truth lives in your voice.',
  'mental':         'Mental Authority: There is no inner authority located in your body. You must discuss, move through different environments, and feel the resonance of each space. Gather perspectives from many sources, and let the right decision become clear through that process.',
  'lunar':          'Lunar Authority: As a Reflector, you are designed to wait a full lunar cycle (29.5 days) before making any significant decision. Let the moon move through all 64 gates and carry your question with her. What is true in the end is what was always true.',
};

const PROFILE = {
  1: 'Investigator — You need a solid foundation beneath you before you can move. You study, research, and prepare with depth. You feel safe when you know enough. Your gift is embodied knowledge that others can stand on and trust.',
  2: 'Hermit — You carry natural talents that emerge effortlessly when you are left alone to simply be yourself. Others see gifts in you that you may not yet recognize. You are called out of your hermitage by life itself — and you respond when the call is genuine.',
  3: 'Martyr — You learn through direct experience, through bumping into things and discovering what does not work. Your path is beautifully experimental. Every so-called failure is data. You bond deeply with those who witness and honor your process without judgment.',
  4: 'Opportunist — Your network is your life force. Fixed foundations, long friendships, and a trusted inner circle are everything. You influence those closest to you through the quality of your presence. Your opportunities emerge through the warmth of existing relationships.',
  5: 'Heretic — You are seen, often before you speak, as someone who carries practical solutions that work for everyone. Others project a kind of savior quality onto you. You are here to deliver what is genuinely needed — and to manage those projections with care and integrity.',
  6: 'Role Model — Your life unfolds in three distinct phases: experimentation and discovery (roughly 0–30), retreat and observation from the rooftop (roughly 30–50), and embodied role modeling (roughly 50+). You become the living example of what it means to live with wisdom.',
};

const CHANNEL_NAMES = {
  '1-8':   'Inspiration — Creative role modeling that uplifts others',
  '2-14':  'The Beat — Keeper of the keys to higher love and direction',
  '3-60':  'Mutation — A pulse of energy that initiates fundamental change',
  '5-15':  'Rhythm — Fixed patterns and alignment with cosmic order',
  '6-59':  'Mating — Breaking down barriers to deep intimacy',
  '7-31':  'The Alpha — Natural leadership and influence over the collective',
  '9-52':  'Concentration — The gift of focused energy and deep determination',
  '10-20': 'Awakening — Surviving and thriving through authentic action',
  '11-56': 'Curiosity — A natural love of storytelling and the sharing of ideas',
  '12-22': 'Openness — A deeply social and emotionally expressive being',
  '13-33': 'The Prodigal — A sacred witness to the secrets that shape others\' lives',
  '16-48': 'The Wavelength — Exceptional talent in the devoted service of perfection',
  '17-62': 'Acceptance — Following and sharing a logical and reliable role model',
  '18-58': 'Judgment — A drive toward aliveness through the pursuit of perfection',
  '19-49': 'Synthesis — Profound sensitivity to the needs and hungers of others',
  '20-34': 'Charisma — Busy-ness and the power of action expressing itself',
  '21-45': 'Money — The gift of managing resources, communities, and people',
  '22-12': 'Openness — A deeply social and emotionally expressive being',
  '23-43': 'Structuring — Unique individual insights translated into form',
  '24-61': 'Awareness — Inspired thinking arising from inner mental pressure',
  '25-51': 'Initiation — The shock of individuation and the courage it takes',
  '26-44': 'Surrender — The power of transmitting the wisdom of the past into the future',
  '27-50': 'Preservation — Deep caring for the welfare of others and the community',
  '28-38': 'Struggle — The gift of finding purpose through the struggle itself',
  '29-46': 'Discovery — Success and ecstasy arising through complete surrender',
  '30-41': 'Recognition — Focused desire and the alchemy of experience',
  '32-54': 'Transformation — The engine of ambition and the drive to materialize',
  '34-57': 'Power — An archetype of raw power guided by intuitive intelligence',
  '35-36': 'Transitoriness — Moving through crisis to arrive at embodied experience',
  '37-40': 'Community — The sacred art of bargaining for peace and belonging',
  '39-55': 'Emoting — Deep moodiness in the eternal search for spirit and meaning',
  '42-53': 'Maturation — A life lived in balanced and meaningful cycles',
  '43-23': 'Structuring — Unique individual insights translated into clear form',
  '44-26': 'Surrender — Transmitting the wisdom of the past into the future',
  '47-64': 'Abstraction — Mental activity, pattern recognition, and the love of thinking',
  '48-16': 'The Wavelength — Exceptional talent devoted to the pursuit of perfection',
  '49-19': 'Synthesis — Sensitivity to the hungers and needs that shape community',
  '50-27': 'Preservation — Deep and instinctual caring for those in your community',
  '51-25': 'Initiation — The shock and the courage of true individuation',
  '52-9':  'Concentration — Focused stillness and the power of deep determination',
  '53-42': 'Maturation — A life of meaningful cycles and graceful completion',
  '54-32': 'Transformation — Ambition, drive, and the engine of material change',
  '55-39': 'Emoting — The depths of moodiness in search of spirit and aliveness',
  '56-11': 'Curiosity — The love of ideas and the gift of inspired storytelling',
  '57-34': 'Power — Intuitive power and survival intelligence expressed through action',
  '58-18': 'Judgment — Aliveness and the joy of striving for what is truly correct',
  '59-6':  'Mating — The drive to break down barriers in service of authentic intimacy',
  '60-3':  'Mutation — The pressure of a pulse that initiates fundamental change',
  '61-24': 'Awareness — Mental inspiration arising from inner pressure toward knowing',
  '62-17': 'Acceptance — The logic of following a trustworthy and reliable guide',
  '63-4':  'Logic — Doubt, scrutiny, and the arrival at proven, reliable answers',
  '64-47': 'Abstraction — The love of thinking, pattern recognition, and mental synthesis',
};

function channelLabel(pair) {
  const [a, b] = [pair[0], pair[1]].sort((x, y) => x - y);
  return CHANNEL_NAMES[`${a}-${b}`] ?? `Channel ${a}–${b}`;
}

// ─── Center meta ──────────────────────────────────────────────────────────────
const CENTER_META = {
  Head:        { label: 'Head',         theme: 'Inspiration · Mental Pressure',      gates: [64,61,63] },
  Ajna:        { label: 'Ajna',         theme: 'Conceptualization · Mind',           gates: [47,24,4,11,43,17] },
  Throat:      { label: 'Throat',       theme: 'Communication · Manifestation',      gates: [62,23,56,35,12,45,33,8,31,20,16] },
  G:           { label: 'G Center',     theme: 'Identity · Love · Direction',        gates: [1,13,25,46,2,15,10,7] },
  Will:        { label: 'Will / Ego',   theme: 'Will Power · Heart · Promises',      gates: [26,51,21,40] },
  Sacral:      { label: 'Sacral',       theme: 'Life Force · Sexuality · Response',  gates: [9,3,42,14,29,59,27,34,5] },
  SolarPlexus: { label: 'Solar Plexus', theme: 'Emotions · Desire · Spirit',         gates: [36,22,37,55,30,49,6] },
  Spleen:      { label: 'Spleen',       theme: 'Intuition · Health · Survival',      gates: [48,57,44,50,32,28,18] },
  Root:        { label: 'Root',         theme: 'Adrenaline · Pressure · Drive',      gates: [19,39,52,53,60,58,38,54,41] },
};

// ─── Planet display ───────────────────────────────────────────────────────────
const PLANET_SYM = {
  sun: '☉', earth: '⊕', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  northNode: '☊', southNode: '☋',
};
const PLANET_LBL = {
  sun: 'Sun', earth: 'Earth', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus',
  neptune: 'Neptune', pluto: 'Pluto', northNode: 'North Node', southNode: 'South Node',
};
const BODY_ORDER = ['sun','earth','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','northNode','southNode'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function NumBadge({ n, sm }) {
  return (
    <span className={`rounded-full btn-gradient flex items-center justify-center shrink-0 ${sm ? 'w-7 h-7' : 'w-12 h-12'}`}>
      <span className={`text-white font-bold ${sm ? 'text-xs' : 'text-lg'}`}>{n}</span>
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CosmicPage() {
  const [birthData,   setBirthData]   = useState(null);
  const [hdData,      setHdData]      = useState(null);
  const [transitData, setTransitData] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('overview');
  const [displayName, setDisplayName] = useState('');
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setDisplayName(localStorage.getItem('displayName') ?? '');

    async function load() {
      let bd = null;
      try { bd = JSON.parse(localStorage.getItem('birthData') ?? 'null'); } catch {}
      setBirthData(bd);

      const fetchHD = (date, time, utcOffset) =>
        fetch('/api/hd-chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ birthDate: date, birthTime: time, utcOffset }),
        }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [natal, transit] = await Promise.all([
        bd?.date && bd?.time && bd?.utcOffset != null
          ? fetchHD(bd.date, bd.time, bd.utcOffset)
          : Promise.resolve(null),
        fetchHD(today, '12:00', 0),
      ]);

      setHdData(natal);
      setTransitData(transit);
      setLoading(false);
    }
    load();
  }, [today]);

  // ── Derive longitude maps from gate+line ───────────────────────────────────
  const natalLons = {};
  if (hdData?.personality) {
    for (const [body, { gate, line }] of Object.entries(hdData.personality)) {
      natalLons[body] = gateLineToLon(gate, line);
    }
  }
  const transitLons = {};
  if (transitData?.personality) {
    for (const [body, { gate, line }] of Object.entries(transitData.personality)) {
      transitLons[body] = gateLineToLon(gate, line);
    }
  }

  const natalAspects   = computeAspects(natalLons);
  const transitGateSet = new Set(
    transitData?.personality ? Object.values(transitData.personality).map(a => a.gate) : []
  );

  // ── Numerology ─────────────────────────────────────────────────────────────
  const lifePath    = birthData?.date ? getLifePath(birthData.date)              : null;
  const personalYr  = birthData?.date ? getPersonalYear(birthData.date, today)   : null;
  const birthdayNum = birthData?.date ? getBirthdayNum(birthData.date)           : null;
  const expressNum  = displayName     ? getExpressionNum(displayName)            : null;

  // ── Signs ──────────────────────────────────────────────────────────────────
  const sunSign        = natalLons.sun   != null ? lonToSign(natalLons.sun)         : null;
  const moonSign       = natalLons.moon  != null ? lonToSign(natalLons.moon)        : null;
  const transitSunSign = transitLons.sun != null ? lonToSign(transitLons.sun)       : null;
  const transitMoonSign= transitLons.moon!= null ? lonToSign(transitLons.moon)      : null;

  const TABS = [
    { id: 'overview',   label: 'Overview'     },
    { id: 'astrology',  label: 'Astrology'    },
    { id: 'hd',         label: 'Human Design' },
    { id: 'numerology', label: 'Numerology'   },
    { id: 'transits',   label: 'Transits'     },
  ];

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="font-playfair text-3xl text-gray-700">Your Cosmic Chart</h1>
      <div className="glass-card rounded-3xl p-12 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Calculating your chart…</p>
      </div>
    </div>
  );

  if (!birthData?.date) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="font-playfair text-3xl text-gray-700">Your Cosmic Chart</h1>
      <div className="glass-card rounded-3xl p-10 text-center space-y-3">
        <p className="text-gray-500 text-sm">No birth data found.</p>
        <p className="text-xs text-gray-400">
          Go to <a href="/profile" className="text-[#b88a92] underline">Profile</a> and enter your birth date, time, and location to unlock your full chart.
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">

      {/* Header */}
      <div>
        <h1 className="font-playfair text-3xl text-gray-700">Your Cosmic Chart</h1>
        <p className="text-sm text-gray-400 mt-1">
          {[birthData.birthPlace, fmtDate(birthData.date), birthData.time].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              tab === t.id
                ? 'btn-gradient text-white shadow-sm'
                : 'bg-white/60 text-gray-500 border border-white/50 hover:bg-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════ OVERVIEW ════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-4">

          {/* Identity grid */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h2 className="font-playfair text-xl text-gray-700">{displayName || 'Your'} Cosmic Identity</h2>
            <div className="grid grid-cols-2 gap-3">
              {sunSign && (
                <div className="bg-white/50 rounded-2xl p-3 border border-white/40">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Sun Sign</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{sunSign.symbol} {sunSign.name}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{sunSign.element} · {sunSign.modality}</p>
                </div>
              )}
              {moonSign && (
                <div className="bg-white/50 rounded-2xl p-3 border border-white/40">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Moon Sign</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">☽ {moonSign.name}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{moonSign.element} · {moonSign.modality}</p>
                </div>
              )}
              {hdData?.type && (
                <div className="bg-white/50 rounded-2xl p-3 border border-white/40">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">HD Type</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5 capitalize">{hdData.type.replace(/-/g,' ')}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{hdData.authority} authority</p>
                </div>
              )}
              {hdData?.profile && (
                <div className="bg-white/50 rounded-2xl p-3 border border-white/40">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Profile</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{hdData.profile}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {PROFILE[hdData.profileLine1]?.split('—')[0].trim()} / {PROFILE[hdData.profileLine2]?.split('—')[0].trim()}
                  </p>
                </div>
              )}
              {lifePath && (
                <div className="bg-white/50 rounded-2xl p-3 border border-white/40">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Life Path</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{lifePath}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{LIFE_PATH[lifePath]?.title}</p>
                </div>
              )}
              {personalYr && (
                <div className="bg-white/50 rounded-2xl p-3 border border-white/40">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Personal Year</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{personalYr}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{PERSONAL_YEAR[personalYr]?.split('—')[0].trim()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Today's sky */}
          {(transitSunSign || transitMoonSign) && (
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Today's Sky — {fmtDate(today)}</p>
              {transitSunSign && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">{transitSunSign.symbol}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Sun in {transitSunSign.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{transitSunSign.element} · {transitSunSign.modality} collective energy</p>
                  </div>
                </div>
              )}
              {transitMoonSign && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">☽</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Moon in {transitMoonSign.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{transitMoonSign.element} · {transitMoonSign.modality} emotional undercurrent</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Synthesis */}
          {(hdData || lifePath) && (
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h2 className="font-playfair text-xl text-gray-700">Your Reading</h2>
              {hdData?.type && HD_TYPE[hdData.type] && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Human Design Type</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{HD_TYPE[hdData.type]}</p>
                </div>
              )}
              {hdData?.authority && AUTHORITY[hdData.authority] && (
                <div className="space-y-1 pt-3 border-t border-white/30">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Decision-Making Authority</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{AUTHORITY[hdData.authority]}</p>
                </div>
              )}
              {lifePath && LIFE_PATH[lifePath] && (
                <div className="space-y-1 pt-3 border-t border-white/30">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Numerology · Life Path {lifePath}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{LIFE_PATH[lifePath].desc}</p>
                </div>
              )}
              {sunSign && hdData && (
                <div className="space-y-1 pt-3 border-t border-white/30">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Sun Sign + HD Type</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    As a {sunSign.name} sun and {hdData.type.replace(/-/g,' ')}, you bring {sunSign.element} {sunSign.modality} energy through{' '}
                    {hdData.type === 'generator' || hdData.type === 'manifesting-generator'
                      ? 'the power of response and sacred satisfaction'
                      : hdData.type === 'projector'
                        ? 'the penetrating wisdom of seeing others clearly'
                        : hdData.type === 'manifestor'
                          ? 'the boldness of initiation and impact'
                          : 'the mirror of reflection and communal wisdom'
                    }.
                    {moonSign && ` Your moon in ${moonSign.name} colors your emotional interior with ${moonSign.element} depth.`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ ASTROLOGY ════════════════ */}
      {tab === 'astrology' && (
        <div className="space-y-4">

          {/* Natal planets */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="font-playfair text-xl text-gray-700">Natal Planets</h2>
              <p className="text-xs text-gray-400 mt-1">Planetary positions at the moment of your birth</p>
            </div>
            {Object.keys(natalLons).length > 0 ? (
              <div className="divide-y divide-white/30">
                {BODY_ORDER.filter(b => natalLons[b] != null).map(body => {
                  const sign = lonToSign(natalLons[body]);
                  return (
                    <div key={body} className="flex items-center gap-3 py-2.5">
                      <span className="text-base w-7 text-center text-gray-400 shrink-0" title={PLANET_LBL[body]}>{PLANET_SYM[body]}</span>
                      <span className="text-sm text-gray-500 w-24 shrink-0">{PLANET_LBL[body]}</span>
                      <span className="text-sm font-medium text-gray-700 flex-1">{sign.symbol} {sign.name} {sign.degree}°</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        sign.element === 'fire'  ? 'bg-rose-50   text-rose-400   border-rose-200/50'  :
                        sign.element === 'earth' ? 'bg-amber-50  text-amber-600  border-amber-200/50' :
                        sign.element === 'air'   ? 'bg-sky-50    text-sky-500    border-sky-200/50'   :
                                                   'bg-violet-50 text-violet-500 border-violet-200/50'
                      }`}>{sign.element}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Save your birth data on <a href="/profile" className="text-[#b88a92] underline">Profile</a> to see your natal planets.</p>
            )}
          </div>

          {/* Aspects */}
          {natalAspects.length > 0 && (
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div>
                <h2 className="font-playfair text-xl text-gray-700">Natal Aspects</h2>
                <p className="text-xs text-gray-400 mt-1">Angular relationships between your natal planets</p>
              </div>
              <div className="divide-y divide-white/30">
                {natalAspects.map((asp, i) => (
                  <div key={i} className="flex items-center gap-2 py-2">
                    <span className="text-sm text-gray-500 w-6 text-center">{PLANET_SYM[asp.planet1]}</span>
                    <span className="text-sm font-bold w-5 text-center" style={{ color: asp.color }}>{asp.symbol}</span>
                    <span className="text-sm text-gray-500 w-6 text-center">{PLANET_SYM[asp.planet2]}</span>
                    <span className="text-xs text-gray-600 flex-1">
                      {PLANET_LBL[asp.planet1]} {asp.name} {PLANET_LBL[asp.planet2]}
                    </span>
                    <span className="text-xs text-gray-300">{asp.orb}° orb</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/20">
                {ASPECT_DEFS.map(a => (
                  <span key={a.name} className="text-xs text-gray-400">
                    <span className="font-semibold" style={{ color: a.color }}>{a.symbol}</span> {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Design date */}
          {hdData?.designDate && (
            <div className="glass-card rounded-3xl p-6 space-y-2">
              <h2 className="font-playfair text-xl text-gray-700">Design Date</h2>
              <p className="text-sm text-gray-600">{fmtDate(hdData.designDate)}</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Your Design is calculated from when the Sun was 88° behind your birth Sun — approximately 88 days before you were born. This is when your unconscious (red) imprinting occurred.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ HUMAN DESIGN ════════════════ */}
      {tab === 'hd' && (
        <div className="space-y-4">
          {hdData ? (
            <>
              {/* Type summary */}
              <div className="glass-card rounded-3xl p-6 space-y-4">
                <h2 className="font-playfair text-xl text-gray-700">Human Design</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Type',      value: cap(hdData.type.replace(/-/g,' ')) },
                    { label: 'Profile',   value: hdData.profile },
                    { label: 'Authority', value: cap(hdData.authority) },
                    { label: 'Strategy',  value: hdData.strategy },
                    { label: 'Signature', value: hdData.signature },
                    { label: 'Not-Self',  value: hdData.notSelf },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/50 rounded-2xl p-3 border border-white/40">
                      <p className="text-xs text-gray-400 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile lines */}
              <div className="glass-card rounded-3xl p-6 space-y-3">
                <h2 className="font-playfair text-xl text-gray-700">Profile Lines</h2>
                {[
                  { line: hdData.profileLine1, role: 'Conscious (Personality)' },
                  { line: hdData.profileLine2, role: 'Unconscious (Design)' },
                ].filter(({ line }) => line && PROFILE[line]).map(({ line, role }) => (
                  <div key={line} className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Line {line} · {role}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{PROFILE[line]}</p>
                  </div>
                ))}
              </div>

              {/* Energy centers */}
              <div className="glass-card rounded-3xl p-6 space-y-3">
                <h2 className="font-playfair text-xl text-gray-700">Energy Centers</h2>
                <div className="space-y-2">
                  {Object.entries(CENTER_META).map(([key, meta]) => {
                    const defined = hdData.definedCenters?.includes(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-start gap-3 p-3 rounded-2xl border ${
                          defined
                            ? 'bg-gradient-to-r from-rose-50/80 to-violet-50/80 border-rose-200/50'
                            : 'bg-white/30 border-white/30'
                        }`}
                      >
                        <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${defined ? 'bg-gradient-to-br from-rose-400 to-violet-400' : 'bg-gray-200'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-700">{meta.label}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${defined ? 'bg-rose-100 text-rose-500' : 'bg-gray-100 text-gray-400'}`}>
                              {defined ? 'Defined' : 'Open'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{meta.theme}</p>
                          <p className="text-xs text-gray-300 mt-0.5">Gates: {meta.gates.join(', ')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Defined channels */}
              {hdData.definedChannels?.length > 0 && (
                <div className="glass-card rounded-3xl p-6 space-y-3">
                  <h2 className="font-playfair text-xl text-gray-700">Defined Channels</h2>
                  <p className="text-xs text-gray-400">These are your consistent, reliable energies — available to you every day.</p>
                  <div className="space-y-2">
                    {hdData.definedChannels.map(([g1, g2]) => (
                      <div key={`${g1}-${g2}`} className="bg-white/50 rounded-2xl p-3 border border-white/40">
                        <p className="text-xs font-semibold text-rose-400 mb-0.5">{g1} — {g2}</p>
                        <p className="text-sm text-gray-600">{channelLabel([g1, g2])}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gate activations table */}
              <div className="glass-card rounded-3xl p-6 space-y-4">
                <div>
                  <h2 className="font-playfair text-xl text-gray-700">Gate Activations</h2>
                  <p className="text-xs text-gray-400 mt-1">Personality = conscious (black) · Design = unconscious (red)</p>
                </div>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-xs min-w-[300px]">
                    <thead>
                      <tr className="border-b border-white/30 text-gray-400 uppercase tracking-widest">
                        <th className="text-left py-2 px-2 font-medium">Planet</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Personality</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-400">Design</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BODY_ORDER.filter(b => hdData.personality?.[b] || hdData.design?.[b]).map(body => {
                        const p = hdData.personality?.[body];
                        const d = hdData.design?.[body];
                        const pInChannel = hdData.definedChannels?.some(([a,b2]) => a===p?.gate || b2===p?.gate);
                        const dInChannel = hdData.definedChannels?.some(([a,b2]) => a===d?.gate || b2===d?.gate);
                        return (
                          <tr key={body} className="border-b border-white/20 last:border-0">
                            <td className="py-2 px-2 text-gray-400">
                              {PLANET_SYM[body]} {PLANET_LBL[body]}
                            </td>
                            <td className={`py-2 px-2 font-semibold ${pInChannel ? 'text-gray-800' : 'text-gray-500'}`}>
                              {p ? `${p.gate}.${p.line}` : '—'}
                            </td>
                            <td className={`py-2 px-2 font-medium ${dInChannel ? 'text-rose-400' : 'text-gray-400'}`}>
                              {d ? `${d.gate}.${d.line}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card rounded-3xl p-10 text-center space-y-3">
              <p className="text-gray-500 text-sm">HD chart data unavailable.</p>
              <p className="text-xs text-gray-400">
                Add your birth time and location on <a href="/profile" className="text-[#b88a92] underline">Profile</a> and save.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ NUMEROLOGY ════════════════ */}
      {tab === 'numerology' && (
        <div className="space-y-4">

          {/* Life path */}
          {lifePath && LIFE_PATH[lifePath] && (
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <NumBadge n={lifePath} />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Life Path Number</p>
                  <p className="font-playfair text-xl text-gray-700">{LIFE_PATH[lifePath].title}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{LIFE_PATH[lifePath].desc}</p>
            </div>
          )}

          {/* Other numbers */}
          <div className="glass-card rounded-3xl p-6 space-y-3">
            <h2 className="font-playfair text-xl text-gray-700">Your Numbers</h2>
            <div className="space-y-3">

              {personalYr && (
                <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Personal Year {today.slice(0,4)}</p>
                      <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{PERSONAL_YEAR[personalYr]}</p>
                    </div>
                    <NumBadge n={personalYr} sm />
                  </div>
                </div>
              )}

              {birthdayNum && (
                <div className="bg-white/50 rounded-2xl p-4 border border-white/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Birthday Number</p>
                      <p className="text-sm text-gray-600 mt-0.5">The talents and gifts you were born with on day {+birthData.date.split('-')[2]} of the month.</p>
                    </div>
                    <NumBadge n={birthdayNum} sm />
                  </div>
                </div>
              )}

              {expressNum && LIFE_PATH[expressNum] && (
                <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Expression Number</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{LIFE_PATH[expressNum].title}</p>
                      <p className="text-xs text-gray-400">Based on the letters in your display name</p>
                    </div>
                    <NumBadge n={expressNum} sm />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cross-system */}
          {hdData && lifePath && sunSign && (
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h2 className="font-playfair text-xl text-gray-700">Cross-System Synthesis</h2>

              <div className="space-y-3">
                <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Life Path + Profile</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your Life Path {lifePath} ({LIFE_PATH[lifePath]?.title}) and your {hdData.profile} profile ({PROFILE[hdData.profileLine1]?.split('—')[0].trim()} / {PROFILE[hdData.profileLine2]?.split('—')[0].trim()}) describe a soul journey of{' '}
                    {lifePath <= 3 ? 'emergence, expression, and finding your voice' :
                     lifePath <= 6 ? 'building, serving, and learning to love fully' :
                     lifePath <= 9 ? 'deep seeking, releasing, and wisdom earned through experience' :
                     'mastery, mission, and service at the highest level'}.
                  </p>
                </div>

                <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Moon Sign + Authority</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your moon in {moonSign?.name} gives your emotional interior a {moonSign?.element} quality.
                    Combined with your {hdData.authority} authority, your inner truth emerges{' '}
                    {hdData.authority === 'emotional'  ? 'through the full arc of your emotional wave — never in the peak or the valley, but in the stillness between' :
                     hdData.authority === 'sacral'     ? 'in the immediate gut response that your body knows before your mind catches up' :
                     hdData.authority === 'splenic'    ? 'in the quiet first-moment knowing that speaks once and never repeats itself' :
                     hdData.authority === 'ego'        ? 'through what your heart genuinely wants and is willing to commit to' :
                     'through conversation, discernment, and moving through different environments'}.
                  </p>
                </div>

                <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Sun Sign + HD Type</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The {sunSign.element} {sunSign.modality} energy of {sunSign.name} flows through the lens of your {hdData.type.replace(/-/g,' ')} design.
                    {hdData.type === 'generator' || hdData.type === 'manifesting-generator'
                      ? ' Your {sunSign.element} vitality is activated and amplified through response — when your sacral lights up, the world lights up with you.'
                      : hdData.type === 'projector'
                        ? ` Your ${sunSign.element} nature is channeled through deep perception — you guide others into what they cannot yet see in themselves.`
                        : hdData.type === 'manifestor'
                          ? ` Your ${sunSign.element} fire expresses itself through bold initiation — you don't need permission to begin.`
                          : ` Your ${sunSign.element} nature samples and reflects the truth of the community around you.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ TRANSITS ════════════════ */}
      {tab === 'transits' && (
        <div className="space-y-4">

          {/* Current planet positions */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="font-playfair text-xl text-gray-700">Current Planetary Positions</h2>
              <p className="text-xs text-gray-400 mt-1">{fmtDate(today)}</p>
            </div>
            {transitData?.personality ? (
              <div className="divide-y divide-white/30">
                {BODY_ORDER.filter(b => transitData.personality[b] != null).map(body => {
                  const { gate, line } = transitData.personality[body];
                  const sign = lonToSign(gateLineToLon(gate, line));
                  const hitsNatal = hdData && (
                    Object.values(hdData.personality ?? {}).some(a => a.gate === gate) ||
                    Object.values(hdData.design ?? {}).some(a => a.gate === gate)
                  );
                  return (
                    <div key={body} className="flex items-center gap-2 py-2.5">
                      <span className="text-sm w-6 text-center text-gray-400 shrink-0">{PLANET_SYM[body]}</span>
                      <span className="text-xs text-gray-500 w-20 shrink-0">{PLANET_LBL[body]}</span>
                      <span className="text-sm font-medium text-gray-700 flex-1">{sign.symbol} {sign.name}</span>
                      <span className="text-xs text-gray-400">Gate {gate}.{line}</span>
                      {hitsNatal && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-500 shrink-0">↔ natal</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unable to load current positions.</p>
            )}
          </div>

          {/* Channel activations today */}
          {hdData?.definedChannels?.length > 0 && (
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h2 className="font-playfair text-xl text-gray-700">Your Channels Today</h2>
              <p className="text-xs text-gray-400">When a transit planet activates a gate in your defined channels, that channel's energy is amplified.</p>
              <div className="space-y-2">
                {hdData.definedChannels.map(([g1, g2]) => {
                  const g1Active = transitGateSet.has(g1);
                  const g2Active = transitGateSet.has(g2);
                  const active = g1Active || g2Active;
                  return (
                    <div
                      key={`${g1}-${g2}`}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                        active ? 'bg-rose-50/60 border-rose-200/50' : 'bg-white/30 border-white/30'
                      }`}
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${active ? 'bg-rose-400' : 'bg-gray-200'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-600">{g1} — {g2}</p>
                        <p className="text-sm text-gray-600">{channelLabel([g1, g2])}</p>
                        {active && (
                          <p className="text-xs text-rose-400 mt-0.5">
                            Gate {g1Active ? g1 : g2} lit up by transit
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transit aspects to natal */}
          {hdData && (() => {
            const innerPlanets = ['sun','moon','mercury','venus','mars'];
            const aspects = [];
            for (const tb of innerPlanets) {
              if (transitLons[tb] == null) continue;
              for (const nb of BODY_ORDER.slice(0, 11)) {
                if (natalLons[nb] == null) continue;
                const diff  = ((transitLons[tb] - natalLons[nb]) % 360 + 360) % 360;
                const angle = Math.min(diff, 360 - diff);
                for (const asp of ASPECT_DEFS) {
                  if (Math.abs(angle - asp.angle) <= asp.orb) {
                    aspects.push({ transit: tb, natal: nb, ...asp, orb: Math.abs(angle - asp.angle).toFixed(1) });
                    break;
                  }
                }
              }
            }
            if (!aspects.length) return null;
            return (
              <div className="glass-card rounded-3xl p-6 space-y-3">
                <h2 className="font-playfair text-xl text-gray-700">Transit Aspects to Your Chart</h2>
                <p className="text-xs text-gray-400">Current planet positions aspecting your natal placements.</p>
                <div className="divide-y divide-white/30">
                  {aspects.map((asp, i) => (
                    <div key={i} className="flex items-center gap-2 py-2">
                      <span className="text-sm text-gray-500 w-5 text-center">{PLANET_SYM[asp.transit]}</span>
                      <span className="text-sm font-bold w-5 text-center" style={{ color: asp.color }}>{asp.symbol}</span>
                      <span className="text-sm text-gray-500 w-5 text-center">{PLANET_SYM[asp.natal]}</span>
                      <span className="text-xs text-gray-600 flex-1">
                        Transit {PLANET_LBL[asp.transit]} {asp.name} natal {PLANET_LBL[asp.natal]}
                      </span>
                      <span className="text-xs text-gray-300">{asp.orb}°</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
