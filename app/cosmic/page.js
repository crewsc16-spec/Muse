'use client';

import { useState, useEffect } from 'react';
import BodyGraph from '@/app/components/BodyGraph';
import NatalWheel from '@/app/components/NatalWheel';
import { createClient } from '@/app/lib/supabase/client';
import { createJournalEntry } from '@/app/lib/storage';

// ─── HD Gate Wheel ────────────────────────────────────────────────────────────
const GATE_WHEEL = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,
  8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,
  47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,
  38,54,61,60,
];

// ─── Zodiac ───────────────────────────────────────────────────────────────────
const SIGN_NAMES    = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_SYMBOLS  = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_ELEMENTS = ['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
const SIGN_MODALS   = ['cardinal','fixed','mutable','cardinal','fixed','mutable','cardinal','fixed','mutable','cardinal','fixed','mutable'];

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
  { name: 'Conjunction',    symbol: '☌', color: '#f59e0b', angle:   0, orb: 8 },
  { name: 'Semisextile',    symbol: '⚺', color: '#a8c8a0', angle:  30, orb: 2 },
  { name: 'Semisquare',     symbol: '∠', color: '#e0b060', angle:  45, orb: 2 },
  { name: 'Sextile',        symbol: '⚹', color: '#34d399', angle:  60, orb: 4 },
  { name: 'Square',         symbol: '□', color: '#f87171', angle:  90, orb: 6 },
  { name: 'Trine',          symbol: '△', color: '#60a5fa', angle: 120, orb: 6 },
  { name: 'Sesquiquadrate', symbol: '⚼', color: '#e08060', angle: 135, orb: 2 },
  { name: 'Quincunx',       symbol: '⚻', color: '#c0a0e0', angle: 150, orb: 3 },
  { name: 'Opposition',     symbol: '☍', color: '#c084fc', angle: 180, orb: 8 },
];

function computeAspects(lonMap) {
  const bodies = Object.entries(lonMap);
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

function computeCrossAspects(natalLons, transitLons) {
  const natalEntries   = Object.entries(natalLons);
  const transitEntries = Object.entries(transitLons);
  const aspects = [];
  for (const [transitBody, tLon] of transitEntries) {
    for (const [natalBody, nLon] of natalEntries) {
      const diff  = ((tLon - nLon) % 360 + 360) % 360;
      const angle = Math.min(diff, 360 - diff);
      for (const asp of ASPECT_DEFS) {
        if (Math.abs(angle - asp.angle) <= asp.orb) {
          aspects.push({ transit: transitBody, natal: natalBody, ...asp, orb: Math.abs(angle - asp.angle).toFixed(1), type: 'transit' });
          break;
        }
      }
    }
  }
  return aspects;
}

// ─── House constants ──────────────────────────────────────────────────────────
const HOUSE_THEMES = {
  1:  'Self & Identity',        2:  'Resources & Values',     3:  'Communication & Mind',
  4:  'Home & Roots',           5:  'Creativity & Play',      6:  'Health & Service',
  7:  'Partnerships',           8:  'Transformation & Depth', 9:  'Philosophy & Expansion',
  10: 'Career & Public Life',   11: 'Community & Ideals',     12: 'Solitude & Transcendence',
};

function nth(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── Numerology ───────────────────────────────────────────────────────────────
function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33)
    n = String(n).split('').reduce((s, d) => s + +d, 0);
  return n;
}
function getLifePath(d)          { return reduceNum(d.replace(/-/g,'').split('').reduce((s,c)=>s+ +c,0)); }
function getPersonalYear(d, t)   { const [,bm,bd]=d.split('-').map(Number); const [ty]=t.split('-').map(Number); return reduceNum(bm+bd+ty); }
function getBirthdayNum(d)       { const day=+d.split('-')[2]; return day>9?reduceNum(day):day; }
function getExpressionNum(name)  {
  if (!name?.trim()) return null;
  const M={A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8};
  return reduceNum(name.toUpperCase().replace(/[^A-Z]/g,'').split('').reduce((s,c)=>s+(M[c]??0),0));
}

// ─── Planet descriptions ──────────────────────────────────────────────────────
const PLANET_DESC = {
  sun:       { title: 'The Sun ☉', body: 'The Sun represents your core identity, your conscious self, and the energy you are here to radiate in this lifetime. It governs vitality, purpose, and creative force. Your sun sign is not who you are — it is who you are actively becoming through the experience of living.' },
  moon:      { title: 'The Moon ☽', body: 'The Moon governs your emotional world, your instincts, your subconscious patterns, and the way you seek comfort and nourishment. It reveals the inner life that lives beneath your persona — the part of you that feels before it thinks. Your moon sign describes your emotional needs and what your soul requires to feel at home.' },
  mercury:   { title: 'Mercury ☿', body: 'Mercury governs the mind — how you think, communicate, process information, and make connections between ideas. It rules language, learning, short travel, and the exchange of intelligence. Mercury\'s placement reveals how your intelligence expresses itself and what your mind is most naturally drawn toward.' },
  venus:     { title: 'Venus ♀', body: 'Venus governs love, beauty, desire, and the things you find most valuable. It shapes how you attract and are attracted, your aesthetic sensibilities, and your relationship to pleasure and abundance. Venus reveals what your heart truly wants and the way you naturally move toward it.' },
  mars:      { title: 'Mars ♂', body: 'Mars governs action, drive, desire, and the force with which you pursue what matters to you. It rules courage, sexuality, assertion, and the way you handle conflict. Your Mars placement reveals how you go after what you want and where your most primal, animating energy lives.' },
  jupiter:   { title: 'Jupiter ♃', body: 'Jupiter governs expansion, wisdom, abundance, and good fortune. It shows where you are naturally blessed, where you grow most readily, and where optimism flows freely. Jupiter expands whatever it touches — and its transits often open doors of opportunity and broadened perspective.' },
  saturn:    { title: 'Saturn ♄', body: 'Saturn governs discipline, structure, responsibility, and the lessons that shape you across time. It rules karma, limitation, mastery, and the long game. Where Saturn lives in your chart is where you face your greatest tests — and where, through sustained effort, you build your most enduring strength and authority.' },
  uranus:    { title: 'Uranus ♅', body: 'Uranus governs revolution, awakening, sudden change, and the liberation of consciousness from its conditioned forms. It rules innovation, eccentricity, and the disruption of patterns that have outlived their purpose. Uranus breaks what is no longer true so that something more authentic can emerge in its place.' },
  neptune:   { title: 'Neptune ♆', body: 'Neptune governs dreams, spirituality, illusion, compassion, and the dissolution of the boundaries between self and other. It rules the mystical, the creative imagination, and our connection to the collective unconscious. Neptune invites surrender — to something larger, more numinous, more true than the individual ego can hold.' },
  pluto:     { title: 'Pluto ♇', body: 'Pluto governs transformation, power, the shadow, and the forces that move beneath the surface of conscious life. It rules death and rebirth in all their forms. Pluto\'s influence is slow and total — it strips away everything that is false so that what is most essential, most indestructible, can emerge and endure.' },
  northNode: { title: 'North Node ☊', body: 'The North Node represents your soul\'s evolutionary direction in this lifetime — the path of growth, the growing edge, the qualities you are here to develop even when they feel unfamiliar or uncomfortable. It is not where you are at ease, but where you are called. Moving toward your North Node brings deep and lasting fulfillment.' },
  southNode: { title: 'South Node ☋', body: 'The South Node represents your karmic past — the strengths, patterns, comfort zones, and tendencies you carry from previous experience. It is where you naturally retreat when life becomes difficult. The invitation is not to abandon these gifts, but to bring them with you as resources as you grow toward your North Node.' },
  earth:     { title: 'Earth ⊕', body: 'In Human Design, the Earth gate is the unconscious grounding complement to the conscious Sun. Where the Sun represents your purpose and your light, the Earth shows how that purpose becomes rooted in physical reality. It is the energetic foundation that stabilizes and grounds your solar expression.' },
};

// ─── Sun in sign descriptions ─────────────────────────────────────────────────
const SUN_IN_SIGN = {
  Aries:       `Your Sun in Aries places your identity at the very threshold of becoming. You are a pioneer — someone who exists most fully at the beginning of things, where no path has been worn yet. You are here to be bold, to act first, and to show others what becomes possible when you stop waiting for permission.`,
  Taurus:      `Your Sun in Taurus grounds your core self in the realm of the body, the senses, and the earth. You are here to build something lasting — to inhabit your life fully and with deep pleasure. Your power comes not from speed but from steadiness: the slow, certain accumulation of beauty, presence, and things made to endure.`,
  Gemini:      `Your Sun in Gemini places your identity at the crossroads of ideas, language, and the electric joy of connection. You are here to learn, to share, and to move between worlds — bringing people and concepts into conversation. Your intelligence is quicksilver: it finds itself through articulation, curiosity, and the endless delight of a mind that never stops.`,
  Cancer:      `Your Sun in Cancer anchors your identity in the realm of feeling, memory, and belonging. You are here to create nourishment — for yourself and for those who find shelter in your presence. Your power flows from your sensitivity: the way you feel deeply, remember everything, and hold the people you love with an almost oceanic care.`,
  Leo:         `Your Sun in Leo places your identity at the heart of creative self-expression and the warm, radiant power of being truly seen. You are here to shine — not out of ego, but because your light genuinely illuminates others. Your gift is generosity: the way you love fully, lead with warmth, and make everyone around you feel like the most important person in the room.`,
  Virgo:       `Your Sun in Virgo places your identity in the quiet, precise, devoted service of bringing things into their right form. You are here to see what others miss, to improve what is broken, and to give your gifts with integrity and intelligence. Your power lives in the details — in the way you care enough to do it right, every single time.`,
  Libra:       `Your Sun in Libra grounds your identity in beauty, relationship, and the search for genuine harmony. You are here to create balance — not by avoiding tension but by learning to hold all sides of it with grace. Your gift is the capacity to truly see the other, to weigh with fairness, and to build things that are beautiful and just at once.`,
  Scorpio:     `Your Sun in Scorpio places your identity in the realm of depth, transformation, and what is most essentially real beneath the surface. You are here to go where most won't — into the territory of feeling, truth, and power — and to emerge changed. Your gift is the fierce, penetrating intelligence that can see through anything false and love what it finds.`,
  Sagittarius: `Your Sun in Sagittarius places your identity at the intersection of adventure, philosophy, and the search for meaning larger than any single life. You are here to expand — in mind, in spirit, in the width of your experience. Your gift is irrepressible optimism and the contagious conviction that life is abundant and the journey is always worth it.`,
  Capricorn:   `Your Sun in Capricorn places your identity in the long game — in the slow building of something real, worthy, and lasting. You are here to master: to understand that the summit requires the climb, and that the climb itself is the point. Your gift is the willingness to do what is necessary, for as long as it takes, without losing sight of what you are building toward.`,
  Aquarius:    `Your Sun in Aquarius places your identity at the edge of the possible — in the revolutionary, the innovative, and the genuinely ahead-of-its-time. You are here to see what others cannot yet see, and to help the collective move toward it. Your gift is the brilliant, slightly detached perspective of someone who loves humanity even when — especially when — it hasn't caught up to your vision.`,
  Pisces:      `Your Sun in Pisces places your identity in the realm of the mystical, the compassionate, and the boundless. You are here to dissolve what is separate and touch what is universal. Your gift is a porousness that lets you feel the whole world — to create, to heal, to dream, and to remind everyone around you that reality is far more mysterious and beautiful than it appears.`,
};

// ─── Moon in sign descriptions ────────────────────────────────────────────────
const MOON_IN_SIGN = {
  Aries:       `Your Moon in Aries gives your emotional interior the quality of fire — immediate, direct, and intensely personal. You feel things fast and fully, and you need space to act on what you feel without delay or explanation. Your emotional nourishment comes from movement, independence, and the freedom to be exactly where you are without apology.`,
  Taurus:      `Your Moon in Taurus gives your emotional world a quality of deep, sensory rootedness. You find safety in the familiar, the beautiful, and the pleasures of a body that is well-tended. Your inner life requires stability — consistent rhythms, physical comfort, and relationships that feel as reliable as the earth beneath your feet.`,
  Gemini:      `Your Moon in Gemini gives your emotional life the quality of quicksilver curiosity. You process feeling through language — talking, writing, and the relief of naming what you experience. You need mental stimulation and variety to feel alive inside; stagnation and silence are often harder for you than almost anything else.`,
  Cancer:      `Your Moon in Cancer places you in your element — the Moon rules Cancer, and here she is fully at home. Your emotional world is vast, rich, and long-memoried. You feel everything deeply and you need genuine belonging: spaces and people where you don't have to explain yourself, because they already know you completely.`,
  Leo:         `Your Moon in Leo gives your emotional interior a quality of warmth, drama, and the deep need to be truly seen and celebrated. You feel most at home when you are fully expressed and when those you love reflect your light back with genuine appreciation. You are generous with your heart — and you need that generosity returned in kind.`,
  Virgo:       `Your Moon in Virgo gives your inner life a quality of quiet, precise attentiveness. You feel most safe when things are in order — when the body is tended, the environment is clean, and the details of daily life are handled with care. Your emotional nourishment lives in usefulness: the deep satisfaction of being genuinely needed and doing your work well.`,
  Libra:       `Your Moon in Libra gives your emotional life an orientation toward harmony, beauty, and genuine connection. You feel most at home in beautiful environments and in relationships where balance is mutual and real. Conflict disturbs you at a cellular level; your soul requires peace — and you are learning that peace built on honesty is the only kind that lasts.`,
  Scorpio:     `Your Moon in Scorpio places your emotional life in deep water. You feel with enormous intensity and almost nothing reaches you at the surface — you always want to go further, to know more, to touch the real. Your inner nourishment comes from depth, loyalty, and relationships where nothing is hidden — where you are known completely and loved for it.`,
  Sagittarius: `Your Moon in Sagittarius gives your emotional life a quality of freedom and philosophical expansiveness. You need space — physical, intellectual, and spiritual — to feel truly alive inside yourself. Your soul is nourished by adventure, by meaning, and by the sense that the world is vast and you are free within it.`,
  Capricorn:   `Your Moon in Capricorn gives your inner life a serious, structured quality. You were shaped early by responsibility, and you find deep emotional safety in competence — in knowing that you can handle what comes. You are learning that strength doesn't require you to need nothing: that asking for care is not weakness but the truest kind of courage.`,
  Aquarius:    `Your Moon in Aquarius gives your emotional interior an airy, slightly detached quality. You process feeling through thought, through ideas, through the communal rather than the intimate. You need freedom to be strange, to be different, to belong to the collective in ways that don't require you to lose yourself in anyone.`,
  Pisces:      `Your Moon in Pisces gives your emotional life a quality of oceanic depth and near-mystical sensitivity. You feel everything — your own feelings, others' feelings, the feeling-tone of a room, a moment, a piece of music. Your soul needs beauty, solitude, and the freedom to float between worlds without being asked to explain what you feel or why.`,
};

// ─── Sign qualities for dynamic planet+sign descriptions ─────────────────────
const SIGN_Q = {
  Aries:       { themes: 'bold, pioneering, and self-determining',          domain: 'initiative, courage, and the fresh start' },
  Taurus:      { themes: 'patient, sensory, and deeply grounded',           domain: 'beauty, steadiness, and the long build' },
  Gemini:      { themes: 'curious, communicative, and brilliantly agile',   domain: 'ideas, language, and the joy of connection' },
  Cancer:      { themes: 'feeling-rich, protective, and long-memoried',     domain: 'nourishment, belonging, and emotional depth' },
  Leo:         { themes: 'radiant, generous, and powerfully expressive',    domain: 'creativity, visibility, and the warmth of the heart' },
  Virgo:       { themes: 'precise, devoted, and genuinely discerning',      domain: 'service, refinement, and the craft of doing things well' },
  Libra:       { themes: 'harmonious, just, and beautifully relational',    domain: 'balance, beauty, and genuine partnership' },
  Scorpio:     { themes: 'deep, penetrating, and completely committed',     domain: 'transformation, power, and what is most essentially real' },
  Sagittarius: { themes: 'free, visionary, and hungry for meaning',         domain: 'adventure, philosophy, and the breadth of experience' },
  Capricorn:   { themes: 'disciplined, patient, and building toward mastery', domain: 'structure, long-term achievement, and earned authority' },
  Aquarius:    { themes: 'original, independent, and ahead of its time',   domain: 'innovation, collective vision, and the future not yet arrived' },
  Pisces:      { themes: 'compassionate, porous, and profoundly feeling',   domain: 'mysticism, imagination, and the love that has no edges' },
};

// ─── Planet+sign body text generator ─────────────────────────────────────────
function planetSignBody(body, sign) {
  if (!sign) return PLANET_DESC[body]?.body ?? '';
  const q = SIGN_Q[sign.name];
  if (!q) return PLANET_DESC[body]?.body ?? '';
  if (body === 'sun')  return SUN_IN_SIGN[sign.name]  ?? PLANET_DESC.sun.body;
  if (body === 'moon') return MOON_IN_SIGN[sign.name] ?? PLANET_DESC.moon.body;
  const { themes, domain } = q;
  switch (body) {
    case 'mercury':
      return `Your Mercury in ${sign.name} gives your mind a ${themes} quality. Your intelligence is most alive when engaging with the domain of ${domain} — this is the lens through which you naturally think, communicate, and make meaning. The signature of ${sign.name} is present in how your words land, what your curiosity reaches for, and the way your mind moves through the world.`;
    case 'venus':
      return `Your Venus in ${sign.name} brings a ${themes} quality to love, beauty, and desire. In ${sign.name}'s domain of ${domain}, your heart opens most fully. You love, attract, and experience beauty through these qualities — your relationships carry this signature, and what you find most genuinely valuable in life reflects it.`;
    case 'mars':
      return `Your Mars in ${sign.name} gives your drive, desire, and life force a ${themes} quality. You act, pursue, and assert yourself through the lens of ${domain}. This is how your energy moves — where you direct your will, what you instinctively fight for, and the way you go after what genuinely matters to you.`;
    case 'jupiter':
      return `Your Jupiter in ${sign.name} expands you through the domain of ${domain}. The abundance and growth that Jupiter offers flows most readily when you are engaged with what ${sign.name} values: being ${themes}. This is where your natural luck lives — a generational gift that grows most abundantly when consciously engaged.`;
    case 'saturn':
      return `Your Saturn in ${sign.name} places your most important lessons and your greatest eventual mastery in the domain of ${domain}. Saturn asks you to go slowly, carefully, and to build something real here — through the ${themes} qualities of ${sign.name}. This is where the long, patient work yields the most enduring strength.`;
    case 'uranus':
      return `Your Uranus in ${sign.name} — shared with your generation — brings awakening and disruption to the domain of ${domain}. The collective drive to break open what has become too rigid runs through the ${themes} quality of ${sign.name}. In your personal chart, this marks where the revolutionary impulse moves through you most naturally.`;
    case 'neptune':
      return `Your Neptune in ${sign.name} — a generational placement — brings spiritual longing and visionary imagination to the domain of ${domain}. The dreams and ideals of your cohort all run through ${sign.name}'s ${themes} quality. In your chart, this colors where the boundaries between yourself and the larger world feel most permeable.`;
    case 'pluto':
      return `Your Pluto in ${sign.name} — a generational placement — brings transformation and the forces that move beneath the surface to the domain of ${domain}. The shadow work and collective rebirth of your generation all run through ${sign.name}'s ${themes} quality. This marks where the most total and irreversible change is possible — and necessary.`;
    case 'northNode':
      return `Your North Node in ${sign.name} points your soul's evolutionary direction toward the domain of ${domain}. The ${themes} qualities of ${sign.name} are not where you are most comfortable — they are where you are most called. Growing toward this placement brings a sense of rightness and deep fulfillment that no amount of staying in familiar patterns can provide.`;
    case 'southNode':
      return `Your South Node in ${sign.name} describes your karmic past — the strengths and comfort zones you carry forward. ${cap(sign.name)}'s gifts of being ${themes} are deeply ingrained in you. The invitation is not to abandon these abilities, but to bring them as resources as you grow toward the unfamiliar territory your North Node points to.`;
    case 'earth':
      return `Your Earth gate in ${sign.name} is the unconscious grounding that stabilizes your conscious Sun. While your Sun seeks to radiate and express, your Earth provides the root — the domain of ${domain} that anchors your solar purpose in physical reality. ${cap(sign.name)}'s quality of ${themes} is the ground you stand on as you live your purpose.`;
    default:
      return PLANET_DESC[body]?.body ?? '';
  }
}

// ─── Aspect descriptions ──────────────────────────────────────────────────────
const ASPECT_DESC = {
  Conjunction:    { symbol: '☌', color: '#f59e0b', body: 'A conjunction occurs when two planets occupy nearly the same degree of the zodiac, merging their energies into a unified force. This is the most powerful and intimate aspect — the two planets cannot be separated; they intensify, color, and reinforce one another. Conjunctions can be powerfully creative or intensely overwhelming, depending on the planets involved.' },
  Semisextile:    { symbol: '⚺', color: '#a8c8a0', body: 'A semisextile forms when two planets are 30 degrees apart — adjacent signs. It represents a gentle, slightly awkward awareness between two energies that don\'t naturally speak each other\'s language. There is potential for cooperation, but it requires conscious effort to bridge the gap. When engaged with curiosity rather than force, semisextiles become surprisingly rich sources of growth.' },
  Semisquare:     { symbol: '∠', color: '#e0b060', body: 'A semisquare forms when two planets are 45 degrees apart, creating a mild but persistent friction between two energies. Less intense than a square, it nonetheless represents a recurring tension point — a low-level irritation that, when consciously addressed, becomes a motivating source of drive and incremental growth.' },
  Sextile:        { symbol: '⚹', color: '#34d399', body: 'A sextile forms when two planets are approximately 60 degrees apart, creating a harmonious and naturally supportive connection. It represents opportunity — a flowing affinity between two energies that, when consciously engaged, produces ease, talent, and graceful momentum. Sextiles reward initiative; they are gifts that ask to be activated.' },
  Square:         { symbol: '□', color: '#f87171', body: 'A square forms when two planets are 90 degrees apart, creating dynamic friction, tension, and challenge. It is the aspect of growth through difficulty — the two energies are fundamentally at odds and must be consciously integrated rather than avoided. Squares are among the most powerful drivers of achievement and transformation in any chart.' },
  Trine:          { symbol: '△', color: '#60a5fa', body: 'A trine forms when two planets are 120 degrees apart, creating a flow of natural ease and harmonious alignment. It represents innate talent — areas where things come effortlessly, where gifts feel natural, where energy moves without resistance. Trines are the blessings in a chart; their gifts are most fully realized when actively engaged rather than taken for granted.' },
  Sesquiquadrate: { symbol: '⚼', color: '#e08060', body: 'A sesquiquadrate forms when two planets are 135 degrees apart, creating a stressful, agitating energy that demands release. Related to the square in its tense quality, this aspect produces restlessness and urgency — a persistent push toward action or some form of resolution. It is a minor but real source of friction that, when channeled, can generate significant momentum.' },
  Quincunx:       { symbol: '⚻', color: '#c0a0e0', body: 'A quincunx (or inconjunct) forms when two planets are 150 degrees apart. The two signs involved share no element, modality, or polarity — they literally speak different languages. The result is an awkward, adjusting energy that requires constant recalibration. Growth comes through learning to hold these two very different parts of yourself without forcing them into a false harmony.' },
  Opposition:     { symbol: '☍', color: '#c084fc', body: 'An opposition forms when two planets sit directly across the zodiac from one another, creating a polarity of competing energies that each carry a truth. It represents the tension between two forces seeking integration — the invitation is to hold both rather than collapsing into one. Oppositions often manifest through relationships, where we encounter our own disowned qualities mirrored in others.' },
};

// ─── Aspect planet-pair specific body text ────────────────────────────────────
const PLANET_KEYWORDS = {
  sun:       'your identity and conscious purpose',
  moon:      'your emotional life and inner world',
  mercury:   'your mind and communication',
  venus:     'your heart, values, and capacity for love',
  mars:      'your drive, desire, and life force',
  jupiter:   'your expansion and sense of abundance',
  saturn:    'your discipline, limitation, and long-arc mastery',
  uranus:    'your impulse toward freedom and awakening',
  neptune:   'your spiritual sensitivity and imagination',
  pluto:     'your relationship with power and transformation',
  northNode: 'your evolutionary direction and soul growth',
  southNode: 'your karmic past and comfortable patterns',
  earth:     'your grounding and physical embodiment',
};
const ASPECT_SPECIFIC = {
  Conjunction: (p1, p2) => `In your chart, ${PLANET_KEYWORDS[p1]} and ${PLANET_KEYWORDS[p2]} are merged into a single unified force. These two dimensions of your experience cannot be separated — they operate together, intensifying and coloring one another in everything you do. This conjunction is one of the most defining signatures in your chart.`,
  Trine:       (p1, p2) => `In your chart, ${PLANET_KEYWORDS[p1]} flows naturally and harmoniously with ${PLANET_KEYWORDS[p2]}. This is an innate gift — a place where two major forces align without friction, supporting each other effortlessly. The more consciously you engage this trine, the more abundantly its ease and talent flows.`,
  Sextile:     (p1, p2) => `In your chart, ${PLANET_KEYWORDS[p1]} and ${PLANET_KEYWORDS[p2]} are in natural affinity. When you consciously bring these two energies into conversation, they create graceful, mutually supporting momentum. This sextile rewards initiative — the more you engage it, the more it opens for you.`,
  Square:      (p1, p2) => `In your chart, ${PLANET_KEYWORDS[p1]} and ${PLANET_KEYWORDS[p2]} are in dynamic tension — pulling in fundamentally different directions. This friction is not a flaw; it is one of the most powerful growth drivers in your chart. The challenge is to integrate both rather than collapsing into one side, and the reward for doing so is extraordinary.`,
  Opposition:  (p1, p2) => `In your chart, ${PLANET_KEYWORDS[p1]} and ${PLANET_KEYWORDS[p2]} face each other across the polarity of your chart, each carrying a truth the other cannot fully hold. The deepest invitation is to hold both without collapsing into either. This opposition often expresses through relationships, where you encounter one side mirrored in others.`,
};

// ─── Gate context prefix by planet + personality/design ──────────────────────
const GATE_PLANET_CONTEXT = {
  Sun:          { personality: 'This is your Personality Sun gate — the most conscious expression of who you are in this lifetime. You identify with and deliberately radiate this energy into the world.', design: 'This is your Design Sun gate — the unconscious foundation of who you are. Others often see this energy in you before you see it in yourself; it is the signature you carry without trying.' },
  Earth:        { personality: 'Your Personality Earth gate is your conscious grounding point — the energy that stabilizes and roots your solar purpose into physical form.', design: 'Your Design Earth gate is the unconscious anchor beneath your Design Sun — the ground your deepest self stands on.' },
  Moon:         { personality: 'This is your Personality Moon gate — it colors your conscious emotional life and what you need to feel at home in yourself.', design: 'Your Design Moon gate describes your unconscious emotional patterns — the feeling-tones that arise instinctively, often without your awareness.' },
  Mercury:      { personality: 'Your Personality Mercury gate shapes the way your conscious mind naturally thinks, communicates, and makes sense of the world.', design: 'Your Design Mercury gate describes your unconscious way of processing information — the mental patterns you fall into before your mind has a chance to notice.' },
  Venus:        { personality: 'Your Personality Venus gate colors your conscious experience of beauty, love, and what you find most desirable and valuable.', design: 'Your Design Venus gate describes your unconscious aesthetic and relational patterns — what draws you before you have decided to be drawn.' },
  Mars:         { personality: 'Your Personality Mars gate shapes how you consciously direct your drive and desire — how you pursue what you want with intention.', design: 'Your Design Mars gate describes your unconscious motor — the instinctive force that moves you before your mind has had a chance to weigh in.' },
  Jupiter:      { personality: 'Your Personality Jupiter gate marks where you consciously experience expansion, growth, and good fortune in your life.', design: 'Your Design Jupiter gate describes your unconscious gifts — areas of natural blessing woven into your design from before your birth.' },
  Saturn:       { personality: 'Your Personality Saturn gate describes where you are consciously working through your most important lessons of discipline and mastery.', design: 'Your Design Saturn gate marks your unconscious area of deep learning — karmic territory you carry in your bones rather than your awareness.' },
  Uranus:       { personality: 'Your Personality Uranus gate describes how the energy of awakening and disruption expresses consciously through you and your generation.', design: 'Your Design Uranus gate marks the unconscious disruption you carry — the place where the unexpected moves through you rather than being chosen by you.' },
  Neptune:      { personality: 'Your Personality Neptune gate describes where dreams, spiritual longing, and dissolution express consciously in your life.', design: 'Your Design Neptune gate marks your unconscious spiritual sensitivity — the place where the mystical moves through you without being planned.' },
  Pluto:        { personality: 'Your Personality Pluto gate describes how the forces of transformation express consciously through your design and your generation.', design: 'Your Design Pluto gate marks the unconscious transformational forces in your chart — the depths that move in you rather than being chosen by you.' },
  'North Node': { personality: 'Your Personality North Node gate marks your conscious evolutionary direction — the growth edge you are actively aware of and working toward.', design: 'Your Design North Node gate describes the unconscious soul direction woven into your body\'s design — a north star you carry instinctively.' },
  'South Node': { personality: 'Your Personality South Node gate describes the conscious tendencies and comfort zones you carry from your karmic past.', design: 'Your Design South Node gate describes the unconscious karmic patterns in your body — the deep past you embody without always recognizing it.' },
};
function gateContextPrefix(context) {
  if (!context) return '';
  const isTransit = context.startsWith('Transit');
  if (isTransit) {
    const planet = context.replace('Transit ', '');
    return `${planet} is currently transiting through this gate, activating this frequency in the collective field — and in your own energy if this gate is part of your defined channels.\n\n`;
  }
  const isPersonality = context.startsWith('Personality');
  const isDesign = context.startsWith('Design');
  if (!isPersonality && !isDesign) return '';
  const planet = context.split(' · ')[0].split(' ').slice(1).join(' '); // "Personality North Node · Line 3" → "North Node"
  const contextObj = GATE_PLANET_CONTEXT[planet];
  if (!contextObj) return '';
  const prefix = isPersonality ? contextObj.personality : contextObj.design;
  return prefix ? prefix + '\n\n' : '';
}

// ─── Center descriptions ──────────────────────────────────────────────────────
const CENTER_DESC = {
  Head: {
    defined: 'Your Head Center is defined — you carry a consistent and reliable pressure of mental inspiration. You are always being pressed to make sense of things, to formulate questions, to find answers that resolve the pressure you feel. This drive can be channeled productively when you learn which questions are genuinely yours to answer, and which belong to others.',
    open:    'Your Head Center is open — you are not consistently under mental pressure of your own. Instead, you absorb and amplify the inspiration and mental pressure of others around you, which can lead to preoccupation with questions that were never yours. Your gift is a fluid ability to receive inspiration from many different sources without being fixed in any single frame.',
  },
  Ajna: {
    defined: 'Your Ajna Center is defined — you have a consistent, recognizable way of processing thought and formulating perspective. Your mind works in a particular pattern that is reliable and repeatable. You are not here to be certain; you are here to have a consistent way of engaging with uncertainty, and to share that perspective when it is asked for.',
    open:    'Your Ajna Center is open — your mind is naturally flexible and takes in many different ways of thinking and knowing. You may feel that your certainties shift, that you struggle to hold a fixed perspective. This is a gift: you are not locked into any single mental framework and can genuinely hold multiple truths simultaneously with wisdom.',
  },
  Throat: {
    defined: 'Your Throat Center is defined — you have consistent, reliable access to communication, expression, and the power to manifest things into reality through action and speech. Your voice carries weight. The practice is learning which expressions are truly authentic — coming from your inner authority — and which are driven by conditioning or the pressure to fill silence.',
    open:    'Your Throat Center is open — your expression is conditioned by who you are with and what the moment calls for, giving you a potentially vast range of voices. You may feel pressure to speak, to attract attention, to be heard. The invitation is to release that urgency and wait for the genuine moment when what you have to say will truly land.',
  },
  G: {
    defined: 'Your G Center is defined — you have a consistent, reliable sense of self, identity, and direction. You know, at some level, who you are, even when the external world shifts. You are not easily knocked off your path by others\' opinions. Your magnetic field has a steady quality that naturally attracts the people and experiences that belong in your life.',
    open:    'Your G Center is open — your sense of self and direction is fluid and shaped by the environments and people you move through. You may have wrestled with the question "who am I?" Your deepest gift is a profound sensitivity to the love and direction present in spaces and in others; you reflect back the quality of what surrounds you with remarkable clarity.',
  },
  Will: {
    defined: 'Your Will Center is defined — you have consistent access to willpower and the capacity to make and keep genuine commitments. When you say you will do something, you can deliver. The practice is making only the promises that truly come from your heart — because your will is built to honor exactly what it commits to, and overextending it depletes you.',
    open:    'Your Will Center is open — your willpower is not consistent, and it is not designed to be. Attempting to operate through sheer force of will leads to exhaustion and broken promises. Your gift is wisdom about ego, will, and commitment — you understand it deeply precisely because it does not function reliably within you, and so you have learned its true nature.',
  },
  Sacral: {
    defined: 'Your Sacral Center is defined — you are a Generator or Manifesting Generator. You carry consistent, self-regenerating life force energy. When engaged in what is truly correct for you, your energy sustains itself and restores overnight. Your sacral response — the gut "uh-huh" or "uh-uh" — is your most reliable and honest inner oracle.',
    open:    'Your Sacral Center is open — you do not have consistent sustaining life force energy of your own. You amplify the sacral energy of Generators around you, which can make you feel more energetic than you truly are. Rest is not optional for you — it is essential. Knowing when you are genuinely full, and stopping before depletion, is one of your most important practices.',
  },
  SolarPlexus: {
    defined: 'Your Solar Plexus Center is defined — you have emotional authority. Your decision-making process moves through waves of feeling, and clarity is not found in the peak or the valley of that wave, but in the stillness that comes with time and patience. You are not designed to decide in the now. Sleep on things. Feel them over days. The truth clarifies as the wave settles.',
    open:    'Your Solar Plexus Center is open — you absorb and amplify the emotional energy of everyone around you, often feeling their emotions more intensely than they do themselves. The practice is learning to distinguish your own feelings from what you are picking up from the field. Never make significant decisions when you or others are in emotional turmoil — wait for the calm.',
  },
  Spleen: {
    defined: 'Your Spleen Center is defined — you have consistent access to intuitive knowing, instinct, and moment-to-moment awareness of what is healthy and safe. Your body speaks to you clearly. The Spleen\'s voice is quiet, immediate, and never repeats itself — it speaks once, in the present moment. Learning to trust this voice is one of the most powerful practices available to you.',
    open:    'Your Spleen Center is open — your intuition is not consistently available and is conditioned by others. You may hold on to people, situations, and patterns past the time they are healthy, driven by a background fear that lives in the open Spleen. Your gift is an extraordinary sensitivity to others\' well-being, health, instincts, and fear — you feel it all.',
  },
  Root: {
    defined: 'Your Root Center is defined — you carry a consistent adrenaline pressure and a reliable drive to act, to resolve tension, and to get things done. This pressure is a source of tremendous productivity when consciously directed. The practice is learning to work with the pressure without letting it drive you — acting from choice rather than from urgency.',
    open:    'Your Root Center is open — you absorb and amplify the adrenaline and pressure of those around you. You may find yourself rushing to resolve pressure that isn\'t truly yours, or taking on others\' sense of urgency as if it were your own. Your gift is deep wisdom about pressure, stress, and the systems that generate them — you understand these forces profoundly.',
  },
};

// ─── Gate descriptions ────────────────────────────────────────────────────────
const GATE_DESC = {
  1:  ['Self-Expression', 'Creative force and the power of individual self-expression. This gate carries the frequency of contribution: who you uniquely are, expressed without apology or modification, becomes a genuine gift to the whole. The call is simply to be yourself — fully, creatively, without performance.'],
  2:  ['Direction of Self', 'The receptive and the keeper of direction. Gate 2 holds an unconscious knowing of where to go and how to align with higher purpose — even when the mind cannot explain it. It is the magnetic navigator, pointing toward home before the journey has been consciously chosen.'],
  3:  ['Ordering', 'The energy of chaos seeking to crystallize into new order. Gate 3 sits at the threshold between the known and unknown, turning the pressure to begin into the first act of creation. This is the gate of the child, the innovation, the new thing that needs time and support to find its form.'],
  4:  ['Formulization', 'The mental pressure to formulate answers and solutions to the questions that arise in consciousness. Gate 4 generates questions that must be resolved into logical understanding — driving the mind toward clarity even when certainty remains genuinely elusive. The gift is the answer; the shadow is holding answers as fixed truth.'],
  5:  ['Fixed Rhythms', 'Universal timing and the wisdom of natural pattern. Gate 5 knows that everything has its season — that aligning with the right rhythm, waiting, pacing, and flowing with what is, is the secret to sustainable and deeply satisfying success. Forcing what is not yet ready creates friction; attuning creates flow.'],
  6:  ['Friction', 'Emotional boundaries, conflict, and the conditions necessary for true intimacy. Gate 6 governs how we regulate closeness and distance; its energy creates the productive friction that makes genuine connection and profound emotional growth possible. Without this gate\'s discernment, intimacy becomes indiscriminate and draining.'],
  7:  ['The Role of the Self', 'Natural leadership that emerges from authentic self-expression rather than position or force. Gate 7 carries the frequency of the democratic leader — one whose authority is felt, recognized, and followed because they are genuinely, unmistakably themselves. This gate leads by being, not by doing.'],
  8:  ['Contribution', 'The gift of individual difference placed in service of the collective. Gate 8 asks: what is uniquely yours to offer? When this energy is expressed authentically, it becomes a creative role model that gives others implicit permission to also be exactly who they are, without apology.'],
  9:  ['Focus', 'The power of concentrated attention and wholehearted commitment to the detail of what matters. Gate 9 grants the ability to give sustained, precise focus to a specific domain — contributing that finely held energy to something larger that it serves. It is the gift of the devoted specialist.'],
  10: ['Behavior of the Self', 'Self-love expressed as a way of walking through the world. Gate 10 holds the codes for authentic behavior — honoring your own values, walking your own path, and living in a way that genuinely reflects your nature regardless of what the world expects or demands. This is not selfishness; it is integrity.'],
  11: ['Ideas', 'Harmony, peace through ideas, and a love of the possible. Gate 11 generates a continuous stream of images and concepts that seek expression — it is the gate of the storyteller, the visionary, and the mind that sees connection where others see only chaos. The gift is the idea; the work is knowing which ones to act on.'],
  12: ['Caution', 'Articulation, standstill, and social grace. Gate 12 understands the power of timing in communication — when to speak and when to be still. Its energy carries the frequency of the poet and the one who waits for the precise moment when words will truly land in the hearts of those who need to hear them.'],
  13: ['The Listener', 'The sacred capacity to hold the secrets and stories of others. Gate 13 draws people to confide their deepest experiences; it is the witness, the keeper of collective memory, and the one who transforms personal stories into universal wisdom that can serve those who come after.'],
  14: ['Power Skills', 'The accumulation of power and resources in service of a higher purpose. Gate 14 does not hoard; it generates energy that supports what is truly aligned, acting as a conduit for life force flowing in the direction that the G Center points. This gate\'s gift is not abundance for its own sake but abundance as a vehicle for purpose.'],
  15: ['Extremes', 'The love of humanity and a deep embrace of the full spectrum of human behavior. Gate 15 does not seek the middle or the moderate; it honors all expressions of the human experience — the extreme, the eccentric, the inconsistent — as beautiful and necessary parts of the great design. Its gift is radical acceptance.'],
  16: ['Skills', 'Enthusiasm, talent, and the drive to master a skill through devoted practice. Gate 16 is the energy of the enthusiast who understands that talent alone is not enough — that genuine mastery is cultivated through repetition, love, and the willingness to begin again every single time without resentment.'],
  17: ['Opinions', 'The formation and sharing of logical perspective. Gate 17 generates opinions that, when welcomed and asked for, offer genuine guidance and orientation. It is the energy of the one who sees the pattern clearly and wants others to benefit from that clarity — but must learn to wait until the perspective is genuinely invited.'],
  18: ['Correction', 'The drive to improve, perfect, and bring what is broken back into rightness. Gate 18 carries an instinctive recognition of what is not working; its gift is the courage and capability to correct it — not from criticism or superiority, but from a deep and authentic love of excellence and the desire to see things thrive.'],
  19: ['Wanting', 'Sensitivity to the fundamental needs of others — for belonging, for nourishment, for the recognition of spirit. Gate 19 feels what is missing in the field around it and responds to those needs with natural, instinctive care; its energy is the basis of community, deep caring, and the bonds that sustain life across generations.'],
  20: ['The Now', 'Pure presence and the power of contemplation expressed as authentic action in the present moment. Gate 20 is the bridge between inner awareness and outward expression; what is known in the deepest self becomes, through this gate, what is lived, spoken, and embodied now — without delay, without performance.'],
  21: ['The Hunter', 'The drive to control, manage, and secure resources through focused will and authority. Gate 21 is the energy of the one who takes charge — not from ego, but from an instinctive understanding that things must be managed, held, and protected for the whole to thrive. This gate is not afraid of responsibility.'],
  22: ['Openness', 'The grace of emotional listening and the gift of genuine receptivity to life. Gate 22 is social grace in its purest form — the ability to meet others with full presence, to listen deeply without an agenda, and to move with the natural rhythm of emotional exchange rather than trying to manage or control it.'],
  23: ['Assimilation', 'The ability to translate individual breakthrough insight into language that others can actually receive and use. Gate 23 is the bridge between the inexplicable knowing of Gate 43 and the world that needs to understand it. Its gift is making the strange comprehensible, the fringe accessible, the revolutionary practical.'],
  24: ['Return', 'The mind cycling back to find meaning and resolution for the unanswered questions it carries. Gate 24 is the energy of rationalization and return — turning ideas and experiences over and over until clarity arrives, not through force, but through the patient willingness to stay with what is not yet resolved.'],
  25: ['The Spirit of the Self', 'Universal love, innocence, and the unconditional acceptance of all of life as it is. Gate 25 carries a frequency of impersonal, boundless love — not love that is earned or withheld, but love as a fundamental orientation toward existence itself. It is the gate of the one who loves life because life is, in its essence, love.'],
  26: ['The Egoist', 'The art of promotion, persuasion, and the transmission of memory and accumulated wisdom. Gate 26 is the trickster, the storyteller, the one who can make others believe — not through manipulation, but through a genuine gift for bringing things to life through the telling of their story. It is the energy of the inspired salesperson.'],
  27: ['Caring', 'The primal and beautiful instinct to nurture, protect, and sustain what is precious. Gate 27 is the frequency of the caregiver who ensures the continuation of life itself — in the form of children, community, values, animals, and the things most worth preserving and passing forward across time.'],
  28: ['The Game Player', 'The struggle to find purpose and the courage to keep fighting for it. Gate 28 carries the energy of the one who knows that something is at stake — not physically, necessarily, but in the deepest sense of: what is this life for? It fuels a powerful, purposeful search for meaning through the lived experience of struggle itself.'],
  29: ['Perseverance', 'The energy of total commitment and the gift of the wholehearted yes. Gate 29 carries the power of devotion — when engaged with what is truly aligned, it sustains effort through every obstacle and every setback. Its shadow is saying yes out of conditioning or fear rather than genuine sacral truth.'],
  30: ['Desires', 'The recognition and embracing of feeling as the force of fate. Gate 30 is the frequency of desire in its most essential form — the longing that pulls you toward what you are here to experience. It does not seek to control fate; it submits to it with full emotional presence, trusting that what is felt is pointing somewhere real.'],
  31: ['Influence', 'The natural authority of the one who speaks for and leads the collective. Gate 31\'s influence is democratic — it is earned through being genuinely representative of the needs, direction, and well-being of those it leads, not imposed through force or hierarchy. This is the voice of the recognized leader.'],
  32: ['Continuity', 'The instinctive recognition of what has endurance and what will genuinely survive across time. Gate 32 is the voice of the Spleen reading the field for viability — what is worth protecting, what has the strength to last, and what should be released before it drains the system it is part of.'],
  33: ['Privacy', 'Retreat, testimony, and the transformative power of memory and witness. Gate 33 witnesses life\'s experiences and, after a period of genuine withdrawal and digestion, transmutes them into wisdom that can be shared — but only when the moment is truly right, when the story has become something more than personal.'],
  34: ['Power', 'Pure, raw, individual life force energy available to be expressed in the present moment. Gate 34 does not wait for permission — it is the frequency of the sacral in its most potent and undiluted form: the power of a body doing exactly what it is built to do, fully, generously, and without apology.'],
  35: ['Change', 'The desire for progress, new experience, and the rich sense of having truly lived. Gate 35 moves through the full range of human experience not from restlessness or dissatisfaction, but from a genuine and beautiful hunger for what it means to be alive — to feel everything, to learn everything, to grow through contact with the breadth of life.'],
  36: ['Crisis', 'The drive to seek depth of feeling and new experience through the intensity of the dark night. Gate 36 is the energy that enters crisis not to suffer but to discover what lives on the other side — it is the initiatory frequency of the emotional system at its most courageous, moving through the fire to arrive at genuine wisdom.'],
  37: ['Friendship', 'The agreements, bonds, and sacred contracts that hold community together across time. Gate 37 is the frequency of family — not only by blood but chosen: the ones with whom you make the silent and binding agreement to show up, to be loyal, and to sustain the bond through every season of life.'],
  38: ['Opposition', 'The fighter who finds meaning, purpose, and aliveness through the struggle itself. Gate 38 is the energy of the one who will not give up — not from stubbornness, but from a deep and cellular knowing that the resistance they face is precisely what their purpose requires them to move through and transform.'],
  39: ['Provocation', 'The ability to stir emotional energy in others so that spirit can be found within it. Gate 39 does not provoke to cause harm — it provokes to awaken, to interrupt patterns of numbness or stagnation, and to open the door to what is truly alive and seeking expression beneath the surface of ordinary life.'],
  40: ['Aloneness', 'The need for genuine rest, solitude, and the capacity to deliver on what has been genuinely promised. Gate 40 works hard and needs to withdraw afterward in order to restore. Its rhythm is give and rest — it cannot sustain endless output without periods of real aloneness in which to return to itself and refill.'],
  41: ['Fantasy', 'The initiating energy of new experience arising through imagination, longing, and desire. Gate 41 holds the frequency of possibility before it becomes form — the dream, the image, the contraction of desire that precedes the expansion of a new cycle of living. It is the seed of every new beginning.'],
  42: ['Growth', 'The energy of bringing cycles to their natural, meaningful, and satisfying completion. Gate 42 enters what others begin and sees it through to its full expression, understanding that growth is not linear but cyclical, spiral, and always reaching toward a completion that makes the next beginning possible and worthwhile.'],
  43: ['Breakthrough', 'Sudden individual knowing that arrives complete and whole, without logical process or preparation. Gate 43 is the frequency of the download — the insight that comes from nowhere, bypasses the mind\'s usual procedures, and arrives as a certainty that feels undeniable. The challenge is finding language for what cannot quite be explained.'],
  44: ['Coming to Meet', 'Pattern recognition and the instinct for what has worked before. Gate 44 is the memory of the Spleen — it reads the past for what succeeded, for what the patterns reveal, and brings that intelligence to bear on what is currently needed in the field. This gate does not forget; it learns and applies what it learns.'],
  45: ['The Gatherer', 'Natural authority that gathers resources, people, and direction around a shared vision. Gate 45 is the king or queen frequency — the one who speaks for the tribe, manages its material reality, and holds the collective vision with clarity and consistency. Its power is to gather what is needed and distribute it wisely.'],
  46: ['Determination of the Self', 'The love of the body and the quality of luck that arises from being fully, completely present in physical form. Gate 46 carries a serendipitous quality — things find it, opportunities open around it — not because it seeks them, but because it is so wholly inhabiting itself that life flows toward it as water flows toward the lowest point.'],
  47: ['Realization', 'The mind struggling to find meaning in the experiences that have been lived but not yet understood. Gate 47 carries the pressure of oppression — the exhaustion of a consciousness that has been given more experience than it can yet integrate. Its gift emerges when it relaxes the need to understand and allows the realization to arise on its own.'],
  48: ['Depth', 'The drive for depth of understanding and the existential fear of not knowing enough. Gate 48 is never satisfied with the surface of anything; it wants to go all the way down to the root. Its deepest fear is being found inadequate — and its greatest gift is precisely the extraordinary depth it cultivates through that very fear of shallowness.'],
  49: ['Revolution', 'Transformation through the willingness to reject and release what no longer serves the principles that matter. Gate 49 is the frequency of revolution — not violence, but the clear-eyed, principled decision to end what is finished and to restructure when the agreements that sustained life have been fundamentally violated.'],
  50: ['Values', 'The responsibility for the welfare of the collective and the preservation of what genuinely works and sustains life. Gate 50 carries the values and codes that allow a healthy community to thrive across time. It is the frequency of the one who knows what is worth keeping — and protects those things with quiet, fierce, unwavering dedication.'],
  51: ['Shock', 'The initiatory energy of awakening through shock, surprise, and the completely unexpected. Gate 51 is the gate of individuation — the shockwave that disrupts the comfortable trance, breaks the pattern, and forces a genuine encounter with what is most fundamentally real and alive. It awakens through disruption rather than gentleness.'],
  52: ['Stillness', 'The gift of not moving, of focused inaction, and the immense power of concentrated, patient presence. Gate 52 understands what most cannot: that stillness is not passivity but a form of tremendous power. From the mountain of non-action, the right moment for movement becomes completely and unmistakably clear.'],
  53: ['Starting Things', 'The pressure, excitement, and momentum of initiating new cycles of development and experience. Gate 53 is the energy of the beginning — the surge that starts something genuinely new. Its gift is the capacity to initiate; its practice is learning to begin only what has the genuine potential for completion and growth.'],
  54: ['Ambition', 'The transformative drive to rise, to achieve, and to materialize what spirit envisions in the physical world. Gate 54 is ambition in its truest and most exalted form — not grasping or competitive, but reaching toward something higher and bringing it into tangible reality through sustained, purposeful effort and aspiration.'],
  55: ['Spirit', 'Mood, abundance, and the individual search for spirit within the full spectrum of emotional experience. Gate 55 rides the waves of feeling not as a victim of them but as a navigator — understanding that beneath every mood is a frequency of spirit waiting to be recognized, honored, and ultimately released into freedom.'],
  56: ['Stimulation', 'The energy of the storyteller who turns lived experience into meaning through the alchemy of language. Gate 56 weaves ideas, experiences, and images into narratives that stimulate, provoke, and inspire genuine thinking. It understands deeply that how a story is told matters as much as what it contains — the form is the message.'],
  57: ['Intuitive Clarity', 'The quiet, precise voice of intuitive knowing speaking in the present moment. Gate 57 is the sharpest frequency of the Spleen: a cellular, immediate awareness that knows before the mind forms its first thought. This voice whispers once, softly, in the now. Those who have learned to trust it have learned to trust the deepest intelligence of life.'],
  58: ['Vitality', 'The joy of life and the drive toward aliveness, excellence, and what is authentically flourishing. Gate 58 cannot help but be enthusiastic about what is working, what is beautiful, and what could be even more fully and genuinely alive. Its gift is a contagious, irresistible love of existence that awakens this love in others.'],
  59: ['Sexuality', 'The energy that breaks down barriers to create the genuine conditions for deep intimacy and authentic connection. Gate 59 is the sacral frequency that governs bonding — the aura-penetrating capacity to dissolve the distance between self and other, whether in sexual, creative, emotional, or spiritual union.'],
  60: ['Acceptance', 'The wisdom of limitation as the very condition that makes all mutation and genuine growth possible. Gate 60 understands that all lasting change begins within constraint — that the seed must press against the shell. The pressure of limitation is not the obstacle but the precise force that drives transformation forward into new forms.'],
  61: ['Mystery', 'Inner truth and the powerful pressure to know what cannot be known through ordinary means. Gate 61 lives permanently at the edge of the unknowable — pressing toward what the logical mind cannot grasp, sustained by a certainty that the answer exists and matters, even when its form remains stubbornly and beautifully mysterious.'],
  62: ['Details', 'The power of the small, the factual, the precisely articulated, and the carefully expressed. Gate 62 is the mind that notices what others consistently miss: the detail, the discrepancy, the nuance that changes everything. Its gift is the ability to translate complex, abstract understanding into clear, concrete, and actionable form.'],
  63: ['Doubt', 'The pressure of logical inquiry and the absolute necessity of questioning what merely appears to be true. Gate 63 holds the doubt that drives the scientific and philosophical mind — the principled refusal to accept what cannot be genuinely proven, the pressure to examine and re-examine what seems true until its truth has been truly established.'],
  64: ['Confusion', 'The integration of accumulated past experiences into wisdom, moving through and out of confusion. Gate 64 is the pressure of the unresolved past seeking to become coherent and useful — images, memories, and experiences cycling through consciousness until they resolve into a pattern of understanding that can finally and peacefully be released.'],
};

// ─── Numerology descriptions ──────────────────────────────────────────────────
const LIFE_PATH = {
  1:  { title: 'The Leader',         desc: 'You are here to pioneer, to initiate, and to stand in your own power. Independence, originality, and self-reliance are your greatest strengths. Your soul\'s purpose is to learn courage and forge a path where none existed before.' },
  2:  { title: 'The Diplomat',       desc: 'You are here to bring harmony, to partner, and to listen deeply. Sensitivity, cooperation, and intuition are your gifts. Your path is one of service through connection — you thrive when you trust that your presence alone is enough.' },
  3:  { title: 'The Creator',        desc: 'You are here to express, to inspire, and to bring joy. Creativity, communication, and emotional depth are woven into your purpose. When you share what lives inside you freely and without fear, you light up the world around you.' },
  4:  { title: 'The Builder',        desc: 'You are here to create lasting foundations — in work, in relationships, in life. Discipline, loyalty, and methodical effort are your superpowers. The structures you build outlast you; that is your legacy to the world.' },
  5:  { title: 'The Adventurer',     desc: 'You are here to experience, to adventure, and to usher in change. Adaptability, curiosity, and a love of freedom define your path. Your greatest gift is showing others what becomes possible when you stop playing it safe.' },
  6:  { title: 'The Nurturer',       desc: 'You are here to love, to heal, and to serve with grace. Responsibility, beauty, and deep care for others are your nature. You create harmony wherever you go — remember to give that same grace to yourself.' },
  7:  { title: 'The Seeker',         desc: 'You are here to know — to go deep, to question, and to touch the mystery. Wisdom, introspection, and spiritual insight are your gifts. You carry answers that can only be found in stillness.' },
  8:  { title: 'The Manifestor',     desc: 'You are here to master the material world — to build, lead, and create abundance. Power, ambition, and executive vision are your nature. Your purpose is to wield great influence with equal integrity.' },
  9:  { title: 'The Humanitarian',   desc: 'You are here to serve the whole — to complete, to release, and to love without conditions. Compassion, wisdom, and universal perspective are your gifts. Your deepest fulfillment comes through giving back what you have learned.' },
  11: { title: 'The Illuminator',    desc: 'You carry Master Number 11 — a path of profound spiritual sensitivity, intuition, and inspiration. You are a channel between the seen and unseen. Others are uplifted simply by being near you when you are fully aligned.' },
  22: { title: 'The Master Builder', desc: 'You carry Master Number 22 — the most powerful vibration in numerology. You are here to turn visionary dreams into real-world structures that serve all of humanity. Your potential is enormous; so is your responsibility to ground it.' },
  33: { title: 'The Master Teacher', desc: 'You carry Master Number 33 — the highest expression of compassion and service. You are here to uplift through love, truth, and healing. When you live your purpose fully, you become a light for the collective transformation of consciousness.' },
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
  'manifestor':            'You are a Manifestor — the initiator, the trailblazer, the one who impacts the world simply by moving through it. You don\'t need to wait. Your strategy is to inform those in your field before you act, releasing resistance before it begins.',
  'projector':             'You are a Projector — the wise guide who truly sees others more deeply than they see themselves. You are designed to manage, direct, and guide — but only when genuinely invited. Your gift is penetrating insight. Wait for the recognition.',
  'reflector':             'You are a Reflector — the rarest and most mystical type. You are a mirror of your environment, sampling and reflecting the health and truth of your community. A full lunar cycle (29.5 days) is your timing for major decisions.',
};
const AUTHORITY = {
  'emotional':      'Emotional Authority: You make decisions through your emotional wave. Clarity comes when the wave has moved through and reached stillness — not at the peak or the bottom. Sleep on every significant decision. Let yourself feel it across time.',
  'sacral':         'Sacral Authority: Your gut knows before your mind does. The deep body response of "uh-huh" or "uh-uh" is your most reliable oracle. Not logic, not emotion — the immediate felt response in your body. Trust it.',
  'splenic':        'Splenic Authority: Your spleen speaks once, quietly, in the moment — and never repeats itself. It is the oldest intelligence in your body. If you felt it, it was real. Act when you hear it.',
  'ego':            'Ego Authority: Your will and desire are your inner compass. When you speak from the heart about what you truly want, the truth emerges. Make only commitments you can keep — and honor what you said you would do.',
  'self-projected': 'Self-Projected Authority: You discover your truth by hearing yourself speak it. Talk to people you trust, and listen carefully to what you say — not to their response, but to the sound and feel of your own words.',
  'mental':         'Mental Authority: There is no inner authority located in your body. Discuss, move through different environments, and feel the resonance of each space. Let the right decision become clear through dialogue and discernment.',
  'lunar':          'Lunar Authority: As a Reflector, you are designed to wait a full lunar cycle (29.5 days) before any significant decision. Let the moon move through all 64 gates and carry your question with her.',
};
const PROFILE = {
  1: 'Investigator — You need a solid foundation beneath you before you can move. You study, research, and prepare with depth. You feel safe when you know enough. Your gift is embodied knowledge that others can stand on.',
  2: 'Hermit — You carry natural talents that emerge effortlessly when left alone to simply be yourself. Others see gifts in you that you may not yet recognize. You are called out of your hermitage by life itself.',
  3: 'Martyr — You learn through direct experience, through bumping into things and discovering what does not work. Your path is beautifully experimental. Every so-called failure is data. You bond deeply with those who witness your process.',
  4: 'Opportunist — Your network is your life force. Fixed foundations, long friendships, and a trusted inner circle are everything. You influence those closest to you. Your opportunities emerge through the warmth of existing relationships.',
  5: 'Heretic — You are seen, often before you speak, as someone who carries practical solutions for everyone. Others project a savior quality onto you. You are here to deliver what is genuinely needed — and to manage those projections with integrity.',
  6: 'Role Model — Your life unfolds in three phases: experimentation (roughly 0–30), rooftop observation (roughly 30–50), and embodied role modeling (roughly 50+). You become the living example of what it means to live with wisdom.',
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
  '25-51': 'Initiation — The shock and the courage of true individuation',
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
  '47-64': 'Abstraction — Mental activity, pattern recognition, and the love of thinking',
  '48-16': 'The Wavelength — Exceptional talent devoted to the pursuit of perfection',
  '49-19': 'Synthesis — Sensitivity to the hungers and needs that shape community',
  '59-6':  'Mating — The drive to break down barriers in service of authentic intimacy',
  '61-24': 'Awareness — Mental inspiration arising from inner pressure toward knowing',
  '62-17': 'Acceptance — The logic of following a trustworthy and reliable guide',
  '63-4':  'Logic — Doubt, scrutiny, and the arrival at proven, reliable answers',
  '64-47': 'Abstraction — The love of thinking, pattern recognition, and mental synthesis',
};

// ─── Channel full descriptions (keys are always numerically sorted) ───────────
const CHANNEL_DESC = {
  '1-8':   `This channel connects the G Center's pure creative life force (Gate 1) with the Throat's power of individual contribution (Gate 8). You have a consistent, reliable energy for creative self-expression that naturally becomes a role model for others — not because you are trying to inspire, but because the authenticity of your expression gives others permission to be themselves. Your creative life is not a project; it is how you live. When you stop performing and simply express, the contribution emerges on its own.`,
  '2-14':  `This channel connects the G Center's magnetic, unconscious keeper of direction (Gate 2) with the Sacral's power of skill accumulation and resource generation (Gate 14). You have a deep, instinctive knowing of where to go — and the life force energy to get there and sustain what you build. The direction this channel finds is not merely personal; it serves something larger. The energy you generate naturally flows toward what is genuinely aligned, and when it does, abundance follows.`,
  '3-60':  `This channel connects the Root Center's pressure of limitation and acceptance (Gate 60) with the Sacral's power of ordering chaos into new form (Gate 3). You carry a pulse of energy that moves in waves — periods of building pressure followed by the sudden, irreversible mutation that pressure makes possible. The gift is not in forcing the timing but in recognizing when the pulse is alive and riding it fully in those moments. When this channel fires, things shift at their roots — not incrementally, but fundamentally.`,
  '4-63':  `This channel connects the Head Center's pressure of principled doubt (Gate 63) with the Ajna's drive to formulate logical answers (Gate 4). You carry a perpetual pressure to test what appears to be true and to work until the answer is genuinely established — not accepted on faith or authority, but proven. This is not skepticism for its own sake; it is a love of what is genuinely reliable. When this channel finds its right question, the depth and rigor of the answer it produces is remarkable.`,
  '5-15':  `This channel connects the Sacral's wisdom of fixed rhythms and natural timing (Gate 5) with the G Center's love of humanity and embrace of all extremes (Gate 15). You have a natural attunement to the flow patterns that underlie all things — the right time, the right pace, the natural season — and your life works best when you honor that attunement rather than force it. Others may find it hard to understand why you cannot simply speed up or slow down at will. When you honor your rhythms, everything else finds its place around you.`,
  '6-59':  `This channel connects the Sacral's aura-penetrating power to create genuine intimacy (Gate 59) with the Solar Plexus's emotional boundaries and conditions for deep connection (Gate 6). You have a consistent, reliable energy for intimacy — a near-magnetic ability to dissolve the distance between yourself and others and create authentic bonds. This channel governs the conditions for genuine bonding at every level — physical, emotional, creative, spiritual. The invitation is to honor the emotional wave that governs when those walls come down and when they must be held.`,
  '7-31':  `This channel connects the G Center's natural, self-emerging leadership (Gate 7) with the Throat's democratic, recognized authority (Gate 31). You carry a consistent frequency of guidance and direction — not through force, but through the genuine embodiment of a self that others naturally recognize and follow. This is the energy of the leader whose authority is felt before it is announced and followed because it is genuinely representative. Your leadership works best when invited; and when invited, it has a quiet, stabilizing power that is difficult to replace.`,
  '9-52':  `This channel connects the Root Center's gift of stillness and focused inaction (Gate 52) with the Sacral's power of precise concentration and wholehearted attention (Gate 9). You have an extraordinary capacity for the kind of deep, sustained focus that turns devotion into mastery — blocking out distraction, resisting pressure to scatter, and staying with something until it yields its full depth. This is the channel of the devoted specialist: someone who goes all the way into whatever they commit to. The key is finding what is genuinely worth that depth of commitment, and then giving it everything.`,
  '10-20': `This channel connects the G Center's codes for authentic behavior and self-love (Gate 10) with the Throat's power of pure presence and action in the now (Gate 20). Your authentic self-expression is not a practice or an aspiration — it is a consistent, reliable channel through which something genuine moves. When you are most fully yourself, you wake things up in others without trying. This is an Individual circuit channel, meaning its frequency is potent and timing-based: it awakens through presence, not performance, and its impact cannot be manufactured.`,
  '11-56': `This channel connects the Ajna's overflow of ideas and images (Gate 11) with the Throat's gift of stimulation through storytelling (Gate 56). You have a consistent, reliable love of ideas expressed through the alchemy of narrative — your mind generates a continuous stream of concepts that seek expression, and your communication is most alive when weaving those ideas into something that moves others to think and feel differently. This is not the channel of the expert or the doer; it is the channel of the storyteller whose ideas themselves are the contribution. When you share freely, you expand the edges of what others believe is possible.`,
  '12-22': `This channel connects the Throat's capacity for precise timing and caution in expression (Gate 12) with the Solar Plexus's grace of emotional listening and genuine receptivity (Gate 22). You have a profound gift for social grace and deeply expressive emotion — for listening fully, for speaking when the moment is exactly right, and for moving with the emotional field around you with an almost uncanny naturalness. This channel operates in waves: there are times when it is fully open and expressive, and times when it needs to be still. Honoring that rhythm is the condition for its deepest gift — not a retreat, but a preparation.`,
  '13-33': `This channel connects the G Center's capacity to hold the secrets and stories of others (Gate 13) with the Throat's power of testimony and the transmutation of experience into wisdom (Gate 33). People will tell you things they have told no one else — and you have the rare capacity to receive those stories and, with time, to transform them into universal wisdom that serves those who come after. This channel requires genuine withdrawal and digestion between expressions; what emerges after that stillness carries a depth that immediate expression cannot. You are not just a listener — you are an alchemist of human experience.`,
  '16-48': `This channel connects the Spleen's drive for depth of understanding (Gate 48) with the Throat's enthusiasm and devotion to developing genuine skill (Gate 16). You have a consistent, reliable energy for going all the way into whatever calls your enthusiasm — not stopping at the surface but finding the depth that makes real talent possible. The shadow of this channel is the feeling of never being quite ready; its gift is the extraordinary excellence that emerges precisely because you kept going deeper. When this energy is given to something it truly loves, the result is a level of mastery that changes what others believe is possible.`,
  '17-62': `This channel connects the Ajna's formation of logical opinions and perspectives (Gate 17) with the Throat's power of precise, factual, detailed articulation (Gate 62). You have a gift for taking what is true and useful and making it accessible — receiving a perspective and translating it into a clear, concrete, shareable form that others can stand on. The practice is waiting until your perspective is genuinely invited: your opinions carry real weight when asked for, and can meet resistance when offered without that invitation. When welcomed, this channel provides the kind of grounded, reliable logic that genuinely helps people navigate.`,
  '18-58': `This channel connects the Root's joy of life and drive toward aliveness (Gate 58) with the Spleen's instinct to recognize what is broken and correct it (Gate 18). You are moved by an authentic love of excellence and a deep desire to see things — and people — truly flourish. This is the loving critic in its highest form: one who recognizes what is falling short of its potential and is moved to restore it — not from negativity, but from genuine care for what life could be. The practice is offering that gift only when invited; when welcomed, this channel is one of the most powerful forces for genuine improvement in the world.`,
  '19-49': `This channel connects the Root's profound sensitivity to fundamental needs for belonging and nourishment (Gate 19) with the Solar Plexus's principled willingness to reject what violates those needs (Gate 49). You feel the hungers of the community at a cellular level — what is missing, what is failing to nourish, what agreement has been violated — and you are moved to restructure it when the conditions for genuine belonging are no longer being met. This is the channel that reshapes the agreements that hold life together, from the intimate to the collective. Its gift is the courage to end what is finished so something more nourishing can begin.`,
  '20-34': `This channel connects the Sacral's raw, individual life force energy (Gate 34) with the Throat's capacity for pure presence and action in the now (Gate 20). You are at your most powerful when you are simply doing what you are built to do — fully, without restraint — and others feel it. This is not performative charisma; it is the magnetism that arises from a body doing exactly what it is designed for, with nothing held back. The invitation is to respond authentically to what calls you rather than initiating from the mind, and to let the doing itself be the message.`,
  '21-45': `This channel connects the Will Center's drive to control and manage resources through focused authority (Gate 21) with the Throat's natural power to gather people and resources around a shared vision (Gate 45). You have the willpower to take genuine charge of what needs to be managed and the voice to articulate the shared vision that gives that management its meaning. This is the 'money channel' not because it guarantees wealth, but because it carries embodied authority over material reality — the one who can look at what is and make it function at the level it is meant to. When aligned, people follow naturally.`,
  '23-43': `This channel connects the Ajna's capacity for sudden, complete individual breakthrough insight (Gate 43) with the Throat's gift of assimilation — translating the strange into language others can receive (Gate 23). You regularly receive insights that are ahead of their time, and you have the rare capacity to make those insights genuinely comprehensible to the world. The challenge is the gap between the knowing and the language: Gate 43's downloads arrive whole but wordless, and Gate 23 must find words without distorting them. Trust the gap — when the right language comes, it genuinely shifts something for those who receive it.`,
  '24-61': `This channel connects the Head Center's pressure of inner truth and the drive to know what cannot be easily known (Gate 61) with the Ajna's frequency of return — the mind cycling back over experiences until clarity arrives (Gate 24). You live at the threshold of what can and cannot be known, and your mind returns again and again to the questions that most resist easy resolution. The practice is trusting the cycling rather than forcing premature conclusions. What emerges after sufficient return carries a quality of genuine awareness that more hurried thinking cannot access; when the realization comes, it arrives complete.`,
  '25-51': `This channel connects the G Center's frequency of universal love and innocence (Gate 25) with the Will Center's energy of shock and the courage of true individuation (Gate 51). You are not broken by what shocks you — you are, in some essential way, built for it. Gate 51 is the only Individual circuit gate connected to the Will Center, making this channel uniquely about the courage to individuate: to become, through disruption, more fully and irreversibly yourself. The love in Gate 25 is what makes that courage possible — an impersonal, boundless acceptance that holds even the most shattering encounters with grace.`,
  '26-44': `This channel connects the Will Center's art of promotion, storytelling, and memory transmission (Gate 26) with the Spleen's pattern recognition and instinct for what has genuinely survived across time (Gate 44). You carry the wisdom of what has worked forward through the power of compelling transmission — you know what the patterns reveal, and you can tell its story in a way others can receive and use. This channel is in the Tribal circuit, meaning its gifts serve the community it belongs to concretely and materially. The practice is surrender: trusting that what has genuinely endured is worth sharing, and sharing it with skill.`,
  '27-50': `This channel connects the Sacral's primal instinct to nurture and protect what is precious (Gate 27) with the Spleen's responsibility for the values and welfare that sustain community (Gate 50). You have an instinctive, embodied commitment to the welfare of others — not as an idea but as a physical, felt reality. This channel carries the frequency of the nurturing authority: someone whose care is not soft but deeply principled, guided by a cellular knowing of what sustains life and what depletes it. The practice is turning that same fierce devotion inward — caring for yourself with the same quality of attention you extend to everyone else.`,
  '28-38': `This channel connects the Root's fighter who finds meaning through the struggle (Gate 38) with the Spleen's existential drive to find purpose and the courage to keep fighting for it (Gate 28). The struggle is not the obstacle to your purpose — it is the territory through which your purpose is found and proven. The shadow is fighting without knowing what is worth fighting for; the gift is the depth of purpose that only emerges through sustained, genuine engagement with difficulty. When you know what you are fighting for, there is very little that can stop you, and your perseverance becomes an example of what is possible when someone refuses to quit.`,
  '29-46': `This channel connects the Sacral's power of total commitment and the wholehearted yes (Gate 29) with the G Center's love of the body and the luck that arises from full, embodied presence (Gate 46). You have a consistent, reliable energy for finding the ecstasy that lives on the other side of complete commitment. The key is that the yes must come from the gut, not from obligation or the desire to please: this channel's gifts are unlocked only when the commitment is genuinely correct for you. When it is, what looks like luck to others is the extraordinary magnetism of a body wholly inhabiting its yes — and everything flows toward it.`,
  '30-41': `This channel connects the Root's fantasy and initiating desire (Gate 41) with the Solar Plexus's recognition that feeling is fate and desire is directional (Gate 30). You are moved by desire at a very deep level and you are here to experience the full range of what that desire can carry you toward — including its most unexpected destinations. This is the channel of the human experience collector: the one who lives fully, feels everything, and transforms lived experience into the alchemy of recognition. The practice is not to control the desire but to feel it fully, knowing that the experience itself — whatever it brings — is always the point.`,
  '32-54': `This channel connects the Root's transformative ambition and drive to materialize (Gate 54) with the Spleen's instinctive recognition of what has genuine endurance and will survive across time (Gate 32). You are not ambitious for its own sake; you are ambitious for what is genuinely worth building — for what has the survival value to actually last. This channel is Tribal, meaning its drive to materialize is always in service of the community: building the structures and accumulating the resources that allow those you are bonded to, to thrive. When aligned, this is one of the most powerful and sustained engines of purposeful material achievement.`,
  '34-57': `This channel connects the Sacral's raw, individual, undiluted life force energy (Gate 34) with the Spleen's quiet, precise, moment-to-moment intuitive intelligence (Gate 57). You have consistent, reliable access to both the force of action and the cellular intelligence that knows when and how to direct it — what Human Design describes as an archetype of raw power guided by instinct. The invitation is to follow the intuition completely rather than second-guessing the first knowing. When you trust your body's wisdom fully, the precision and power with which it moves can feel almost uncanny to those who witness it.`,
  '35-36': `This channel connects the Throat's desire for progress and hunger for new experience (Gate 35) with the Solar Plexus's drive to seek depth through crisis and the dark night (Gate 36). You are not here to observe life from a comfortable distance — you are here to live it fully, including its most difficult and transformative territories. What others call crisis, you are instinctively inclined to enter, and what you bring back from those territories is embodied wisdom that no amount of theorizing can produce. This channel runs in emotional waves; its gifts are unlocked through full feeling, not around it, and the experiential depth you accumulate becomes the foundation of your genuine authority.`,
  '37-40': `This channel connects the Solar Plexus's frequency of friendship and the sacred contracts that hold community together (Gate 37) with the Will Center's need for genuine rest and the power to keep exactly what has been truly promised (Gate 40). You build and sustain genuine community through the art of authentic bargaining — making only the agreements you can keep, then keeping exactly what you agreed to. The practice is knowing what you genuinely have to give before you offer it, because resentment is the shadow of a promise made from conditioning rather than from genuine willingness. When this channel operates in alignment, it creates the kind of belonging that lasts through every season.`,
  '39-55': `This channel connects the Root's ability to provoke and stir spirit into aliveness (Gate 39) with the Solar Plexus's mood, abundance, and the individual search for spirit within the full range of feeling (Gate 55). Your emotional life is not background noise — it is the primary medium through which you encounter what is real and alive. You ride the waves of feeling not as a victim but as a navigator, and your depth of emotion becomes, when honored, a vehicle for finding the spirit that lives beneath and within every mood. The invitation is not to manage or flatten the feeling but to follow it all the way down, trusting that what you are seeking can only be found in the depths.`,
  '42-53': `This channel connects the Root's pressure and excitement of initiating new cycles (Gate 53) with the Sacral's energy of bringing those cycles to their natural, meaningful completion (Gate 42). Your life is organized around the full arc of experience — from the beginning that starts something genuinely new to the ending that makes the next beginning possible. The practice is learning which cycles are genuinely correct to enter, because this channel's life force is built to finish what it starts. When you begin what is correct, the maturation that results carries a depth and richness that serves not just you but everyone who witnesses the full arc of what you became through the commitment.`,
  '47-64': `This channel connects the Head Center's pressure of accumulated past experiences seeking integration (Gate 64) with the Ajna's drive to find meaning in what has been lived but not yet understood (Gate 47). You are a natural synthesizer: a mind that processes images, memories, and experiences — cycling through them until they resolve into a pattern of understanding that is genuinely illuminating. The practice is trusting that the realization is coming — that the pressure of not-yet-knowing is not failure but the necessary condition for a synthesis that will eventually be complete and true. When it arrives, it arrives with a wholeness that more hurried thinking cannot access.`,
};

function channelKey(pair) { const [a,b]=[pair[0],pair[1]].sort((x,y)=>x-y); return `${a}-${b}`; }
function channelLabel(pair) { return CHANNEL_NAMES[channelKey(pair)] ?? `Channel ${pair[0]}–${pair[1]}`; }

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
const PLANET_SYM = { sun:'☉',earth:'⊕',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',northNode:'☊',southNode:'☋' };
const PLANET_LBL = { sun:'Sun',earth:'Earth',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto',northNode:'North Node',southNode:'South Node' };
const BODY_ORDER = ['sun','earth','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','northNode','southNode'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function fmtDate(d) {
  if (!d) return '';
  return new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
}

function NumBadge({ n, sm }) {
  return (
    <span className={`rounded-full btn-gradient flex items-center justify-center shrink-0 ${sm?'w-7 h-7':'w-12 h-12'}`}>
      <span className={`text-white font-bold ${sm?'text-xs':'text-lg'}`}>{n}</span>
    </span>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function InfoModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative glass-card rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto space-y-3 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            {item.symbol && (
              <p className="text-2xl mb-1" style={item.color ? { color: item.color } : {}}>{item.symbol}</p>
            )}
            <h3 className="font-playfair text-xl text-gray-700">{item.title}</h3>
            {item.subtitle && <p className="text-xs text-gray-400 mt-0.5">{item.subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 transition-colors text-xl leading-none shrink-0 mt-1"
          >
            ×
          </button>
        </div>
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map(t => (
              <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-white/60 border border-white/40 text-gray-500">{t}</span>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CosmicPage() {
  const [birthData,    setBirthData]    = useState(null);
  const [hdData,       setHdData]       = useState(null);
  const [transitData,  setTransitData]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState('overview');
  const [displayName,  setDisplayName]  = useState('');
  const [detail,       setDetail]       = useState(null);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading,  setChatLoading]  = useState(false);
  const [chatAsked,    setChatAsked]    = useState('');
  const [chatSaved,    setChatSaved]    = useState(false);
  const [today] = useState(() => new Date().toISOString().slice(0,10));

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const meta = user?.user_metadata ?? {};
      setDisplayName(meta.displayName ?? localStorage.getItem('displayName') ?? '');
      let bd = null;
      try { bd = meta.birthData ?? JSON.parse(localStorage.getItem('birthData') ?? 'null'); } catch {}
      // Auto-geocode birthPlace if lat/lon were never saved
      if (bd?.birthPlace && (bd.birthLat == null || bd.birthLon == null)) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(bd.birthPlace)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en-US,en' } }
          );
          const geoData = await geoRes.json();
          if (geoData[0]) {
            bd = { ...bd, birthLat: parseFloat(geoData[0].lat), birthLon: parseFloat(geoData[0].lon) };
            localStorage.setItem('birthData', JSON.stringify(bd));
          }
        } catch {}
      }

      setBirthData(bd);
      const fetchHD = (date, time, utcOffset, lat, lon) =>
        fetch('/api/hd-chart',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({birthDate:date,birthTime:time,utcOffset,lat,lon}) })
          .then(r => r.ok ? r.json() : null).catch(()=>null);
      const [natal, transit] = await Promise.all([
        bd?.date && bd?.time && bd?.utcOffset != null ? fetchHD(bd.date, bd.time, bd.utcOffset, bd.birthLat, bd.birthLon) : Promise.resolve(null),
        fetchHD(today,'12:00',0),
      ]);
      setHdData(natal);
      setTransitData(transit);
      setLoading(false);
    }
    load();
  }, [today]);

  const natalLons = {};
  if (hdData?.personality) for (const [b,{gate,line}] of Object.entries(hdData.personality)) natalLons[b] = gateLineToLon(gate,line);
  const transitLons = {};
  if (transitData?.personality) for (const [b,{gate,line}] of Object.entries(transitData.personality)) transitLons[b] = gateLineToLon(gate,line);

  const natalAspects   = computeAspects(natalLons);
  const transitGateSet = new Set(transitData?.personality ? Object.values(transitData.personality).map(a=>a.gate) : []);

  const lifePath    = birthData?.date ? getLifePath(birthData.date)            : null;
  const personalYr  = birthData?.date ? getPersonalYear(birthData.date, today) : null;
  const birthdayNum = birthData?.date ? getBirthdayNum(birthData.date)         : null;
  const expressNum  = displayName     ? getExpressionNum(displayName)          : null;

  const sunSign         = natalLons.sun    != null ? lonToSign(natalLons.sun)    : null;
  const moonSign        = natalLons.moon   != null ? lonToSign(natalLons.moon)   : null;
  const transitSunSign  = transitLons.sun  != null ? lonToSign(transitLons.sun)  : null;
  const transitMoonSign = transitLons.moon != null ? lonToSign(transitLons.moon) : null;

  // ── Detail openers ─────────────────────────────────────────────────────────
  function openPlanet(body, sign) {
    if (!PLANET_DESC[body]) return;
    setDetail({
      title: sign ? `${PLANET_LBL[body]} in ${sign.name}` : PLANET_DESC[body].title,
      subtitle: sign ? `${sign.symbol} ${sign.degree}° · ${cap(sign.element)} · ${cap(sign.modality)}` : undefined,
      tags: sign ? [cap(sign.element), cap(sign.modality)] : [],
      body: planetSignBody(body, sign),
    });
  }
  function openAspect(asp) {
    const d = ASPECT_DESC[asp.name];
    if (!d) return;
    const specific = ASPECT_SPECIFIC[asp.name]?.(asp.planet1, asp.planet2) ?? '';
    const isTransit = asp.transit != null;
    setDetail({
      symbol: d.symbol,
      color: d.color,
      title: isTransit
        ? `Transit ${PLANET_LBL[asp.transit]} ${asp.name} Natal ${PLANET_LBL[asp.natal]}`
        : `${PLANET_LBL[asp.planet1]} ${asp.name} ${PLANET_LBL[asp.planet2]}`,
      subtitle: `${asp.orb}° orb`,
      body: (specific ? specific + '\n\n' : '') + d.body,
    });
  }
  function openGate(gate, line, context) {
    const d = GATE_DESC[gate];
    if (!d) return;
    const prefix = gateContextPrefix(context);
    setDetail({
      title: `Gate ${gate} · ${d[0]}`,
      subtitle: context ?? (line ? `Line ${line}` : undefined),
      body: prefix + d[1],
    });
  }
  function openCenter(key, isDefined) {
    const d = CENTER_DESC[key];
    const m = CENTER_META[key];
    if (!d || !m) return;
    setDetail({
      title: m.label,
      subtitle: isDefined ? 'Defined' : 'Open / Undefined',
      tags: [isDefined ? 'Defined' : 'Open', m.theme],
      body: isDefined ? d.defined : d.open,
    });
  }
  function openChannel(pair) {
    const key = channelKey(pair);
    const label = CHANNEL_NAMES[key];
    const name = label?.split('—')[0].trim();
    const desc = CHANNEL_DESC[key];
    setDetail({
      title: name ? `Channel ${pair[0]}–${pair[1]} · ${name}` : `Channel ${pair[0]}–${pair[1]}`,
      subtitle: label?.split('—')[1]?.trim(),
      body: desc ?? label ?? `The channel connecting gates ${pair[0]} and ${pair[1]}.`,
    });
  }
  function openTransitPlanet(body, gate, line) {
    if (!PLANET_DESC[body]) return;
    const sign = lonToSign(gateLineToLon(gate, line));
    const natalHits = [];
    if (hdData?.personality) {
      for (const [planet, { gate: ng }] of Object.entries(hdData.personality)) {
        if (ng === gate) natalHits.push(`natal ${PLANET_LBL[planet]}`);
      }
    }
    if (hdData?.design) {
      for (const [planet, { gate: ng }] of Object.entries(hdData.design)) {
        if (ng === gate) natalHits.push(`design ${PLANET_LBL[planet]}`);
      }
    }
    const natalCtx = natalHits.length > 0
      ? `Transit ${PLANET_LBL[body]} is currently activating Gate ${gate} — the same gate as your ${natalHits.join(' and ')} in your natal chart. This energy is alive in both the collective field and your own design right now.\n\n`
      : `Transit ${PLANET_LBL[body]} is currently in Gate ${gate}.${line} in the collective field.\n\n`;
    setDetail({
      title: `Transit ${PLANET_LBL[body]} in ${sign.name}`,
      subtitle: `Gate ${gate}.${line} · ${sign.symbol} ${sign.degree}°`,
      tags: ['Transit', cap(sign.element)],
      body: natalCtx + planetSignBody(body, sign),
    });
  }

  // ── Chart summary for AI chat ───────────────────────────────────────────────
  function buildChartSummary() {
    const lines = [];
    lines.push(`Name: ${displayName || 'Unknown'}`);
    lines.push(`Birth: ${birthData?.date ?? '?'} at ${birthData?.time ?? '?'}`);
    lines.push('');

    if (hdData) {
      lines.push('Human Design');
      lines.push(`Type: ${hdData.type?.replace(/-/g,' ')} | Profile: ${hdData.profile} | Authority: ${hdData.authority}`);
      lines.push(`Strategy: ${hdData.strategy ?? '—'} | Signature: ${hdData.signature ?? '—'} | Not-Self: ${hdData.notSelf ?? '—'}`);
      if (hdData.definedChannels?.length) {
        const chs = hdData.definedChannels.map(([g1,g2]) => {
          const k = [g1,g2].sort((a,b)=>a-b).join('-');
          const label = CHANNEL_NAMES?.[k]?.split('—')[0]?.trim() ?? '';
          return label ? `${g1}–${g2} (${label})` : `${g1}–${g2}`;
        }).join(', ');
        lines.push(`Defined Channels: ${chs}`);
      }
      if (hdData.centers) {
        const def = Object.entries(hdData.centers).filter(([,v])=>v).map(([k])=>k).join(', ');
        const undef = Object.entries(hdData.centers).filter(([,v])=>!v).map(([k])=>k).join(', ');
        if (def)   lines.push(`Defined Centers: ${def}`);
        if (undef) lines.push(`Undefined Centers: ${undef}`);
      }
      if (hdData.personality) {
        lines.push('');
        lines.push('Personality (Conscious) Activations:');
        for (const [body, { gate, line }] of Object.entries(hdData.personality)) {
          lines.push(`  ${PLANET_LBL[body] ?? body}: Gate ${gate}, Line ${line}`);
        }
      }
      if (hdData.design) {
        lines.push('');
        lines.push('Design (Unconscious) Activations:');
        for (const [body, { gate, line }] of Object.entries(hdData.design)) {
          lines.push(`  ${PLANET_LBL[body] ?? body}: Gate ${gate}, Line ${line}`);
        }
      }
      lines.push('');
    }

    lines.push('Astrology');
    const astroPlanets = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','northNode'];
    for (const body of astroPlanets) {
      if (natalLons[body] != null) {
        const s = lonToSign(natalLons[body]);
        lines.push(`${PLANET_LBL[body] ?? body} in ${s.name} (${s.degree}°)`);
      }
    }
    lines.push('');

    lines.push('Numerology');
    const nums = [];
    if (lifePath)    nums.push(`Life Path: ${lifePath}`);
    if (personalYr)  nums.push(`Personal Year: ${personalYr}`);
    if (birthdayNum) nums.push(`Birthday: ${birthdayNum}`);
    if (expressNum)  nums.push(`Expression: ${expressNum}`);
    lines.push(nums.join(' | '));
    lines.push('');

    // Houses
    if (hdData?.houses) {
      lines.push('');
      lines.push('## Houses (Placidus)');
      const ascSign = lonToSign(hdData.houses.asc);
      const mcSign  = lonToSign(hdData.houses.mc);
      lines.push(`Ascendant: ${ascSign.name} ${ascSign.degree}°  |  Midheaven: ${mcSign.name} ${mcSign.degree}°`);
      const cuspStr = hdData.houses.cusps
        .map((c, i) => { const s = lonToSign(c); return `H${i+1}=${s.name} ${s.degree}°`; })
        .join(', ');
      lines.push(cuspStr);
      if (hdData.housePlacements) {
        const hp = Object.entries(hdData.housePlacements)
          .map(([p, h]) => `${PLANET_LBL[p] ?? p} in H${h}`)
          .join(', ');
        lines.push(`Planet placements: ${hp}`);
      }
    }

    // Retrograde
    if (hdData?.retrograde) {
      lines.push('');
      lines.push('## Retrograde Planets at Birth');
      const rxList = Object.entries(hdData.retrograde).filter(([, rx]) => rx).map(([p]) => `${PLANET_LBL[p] ?? p} (Rx)`);
      lines.push(rxList.length > 0 ? rxList.join(', ') : 'None');
    }

    // Minor aspects
    const MINOR_NAMES = new Set(['Semisextile','Semisquare','Sesquiquadrate','Quincunx']);
    const minorAspects = natalAspects.filter(a => MINOR_NAMES.has(a.name));
    if (minorAspects.length > 0) {
      lines.push('');
      lines.push('## Minor Aspects');
      for (const a of minorAspects) {
        lines.push(`${PLANET_LBL[a.planet1] ?? a.planet1} ${a.symbol} ${PLANET_LBL[a.planet2] ?? a.planet2} (${a.name}, orb ${a.orb}°)`);
      }
    }

    if (transitData?.personality) {
      lines.push('');
      lines.push(`Today's Transits (${today})`);
      for (const [body, { gate, line }] of Object.entries(transitData.personality)) {
        const natalHits = [];
        if (hdData?.personality) for (const [p,{gate:ng}] of Object.entries(hdData.personality)) { if (ng===gate) natalHits.push(`Personality ${PLANET_LBL[p]??p}`); }
        if (hdData?.design)      for (const [p,{gate:ng}] of Object.entries(hdData.design))      { if (ng===gate) natalHits.push(`Design ${PLANET_LBL[p]??p}`); }
        const hit = natalHits.length ? ` ← hits natal ${natalHits.join(', ')}` : '';
        lines.push(`  Transit ${PLANET_LBL[body] ?? body}: Gate ${gate}.${line}${hit}`);
      }
    }

    return lines.join('\n');
  }

  async function askChart() {
    const q = chatQuestion.trim();
    if (!q || chatLoading) return;
    setChatAsked(q);
    setChatQuestion('');
    setChatResponse('');
    setChatSaved(false);
    setChatLoading(true);
    try {
      const res = await fetch('/api/cosmic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, chartSummary: buildChartSummary() }),
      });
      if (!res.ok) { setChatResponse('Something went wrong. Please try again.'); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setChatResponse(text);
      }
    } catch {
      setChatResponse('Something went wrong. Please try again.');
    } finally {
      setChatLoading(false);
    }
  }

  const TABS = [
    {id:'overview',   label:'Overview'},
    {id:'astrology',  label:'Astrology'},
    {id:'hd',         label:'Human Design'},
    {id:'numerology', label:'Numerology'},
    {id:'transits',   label:'Transits'},
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
        <p className="text-xs text-gray-400">Go to <a href="/profile" className="text-[#b88a92] underline">Profile</a> and enter your birth date, time, and location to unlock your full chart.</p>
      </div>
    </div>
  );

  const elColor = { fire:'rose', earth:'amber', air:'sky', water:'violet' };
  function elStyle(el) {
    const c = elColor[el];
    return c ? `bg-${c}-50 text-${c}-${el==='earth'?'600':'500'} border-${c}-200/50` : 'bg-gray-50 text-gray-400 border-gray-200/50';
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <InfoModal item={detail} onClose={() => setDetail(null)} />

      <div>
        <h1 className="font-playfair text-3xl text-gray-700">Your Cosmic Chart</h1>
        <p className="text-sm text-gray-400 mt-1">
          {[birthData.birthPlace, fmtDate(birthData.date), birthData.time].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${tab===t.id?'btn-gradient text-white shadow-sm':'bg-white/60 text-gray-500 border border-white/50 hover:bg-white/80'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════ CHART CHAT ════ */}
      <div className="bg-gradient-to-br from-rose-50/60 to-violet-50/40 backdrop-blur-md border border-white/40 rounded-3xl shadow-sm shadow-rose-100/30 p-6 space-y-4">
        <div>
          <h2 className="font-playfair text-xl text-gray-700">✦ Ask your chart anything</h2>
          <p className="text-xs text-gray-400 mt-0.5">Claude reads your full chart data and answers personally.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={chatQuestion}
            onChange={e => setChatQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askChart()}
            placeholder="e.g. Why do I feel drained by social situations?"
            className="flex-1 bg-white/60 border border-white/50 rounded-2xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-rose-200"
            disabled={chatLoading}
          />
          <button
            onClick={askChart}
            disabled={chatLoading || !chatQuestion.trim()}
            className="btn-gradient text-white text-sm font-medium px-5 py-2.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
          >
            {chatLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
            ) : 'Ask →'}
          </button>
        </div>
        {chatResponse && (
          <div className="bg-white/40 rounded-2xl p-4 border border-white/40 space-y-3">
            {chatAsked && <p className="text-xs text-gray-400 italic">"{chatAsked}"</p>}
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{chatResponse}</p>
            {!chatLoading && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={async () => {
                    if (chatSaved) return;
                    try {
                      const supabase = createClient();
                      const today = new Date().toISOString().slice(0, 10);
                      await createJournalEntry(supabase, {
                        date: today,
                        content: `**Q:** ${chatAsked}\n\n${chatResponse}`,
                        prompt: 'Chart Insight',
                      });
                      setChatSaved(true);
                    } catch { /* silent */ }
                  }}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${chatSaved ? 'bg-emerald-50 text-emerald-500 border border-emerald-200/50' : 'bg-white/60 text-gray-500 border border-white/50 hover:bg-white/80 hover:text-violet-500'}`}
                >
                  {chatSaved ? '✓ Saved to journal' : '↓ Save to journal'}
                </button>
                <button
                  onClick={() => { setChatResponse(''); setChatAsked(''); setChatSaved(false); }}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/60 text-gray-400 border border-white/50 hover:bg-white/80 hover:text-gray-600 transition-all"
                >
                  ✕ Dismiss
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════ OVERVIEW ════ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h2 className="font-playfair text-xl text-gray-700">{displayName || 'Your'} Cosmic Identity</h2>
            <p className="text-xs text-gray-400">Tap any card to learn more.</p>
            <div className="grid grid-cols-2 gap-3">
              {sunSign && (
                <button onClick={() => openPlanet('sun', sunSign)} className="bg-white/50 rounded-2xl p-3 border border-white/40 text-left hover:bg-white/70 transition-colors active:scale-[0.98]">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Sun Sign</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{sunSign.symbol} {sunSign.name}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{sunSign.element} · {sunSign.modality}</p>
                </button>
              )}
              {moonSign && (
                <button onClick={() => openPlanet('moon', moonSign)} className="bg-white/50 rounded-2xl p-3 border border-white/40 text-left hover:bg-white/70 transition-colors active:scale-[0.98]">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Moon Sign</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">☽ {moonSign.name}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{moonSign.element} · {moonSign.modality}</p>
                </button>
              )}
              {hdData?.type && (
                <button onClick={() => setDetail({ title: cap(hdData.type.replace(/-/g,' ')), subtitle: 'Human Design Type', body: HD_TYPE[hdData.type] ?? '' })} className="bg-white/50 rounded-2xl p-3 border border-white/40 text-left hover:bg-white/70 transition-colors active:scale-[0.98]">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">HD Type</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5 capitalize">{hdData.type.replace(/-/g,' ')}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{hdData.authority} authority</p>
                </button>
              )}
              {hdData?.profile && (
                <button onClick={() => setDetail({ title: `Profile ${hdData.profile}`, subtitle: `Line ${hdData.profileLine1} / Line ${hdData.profileLine2}`, body: [PROFILE[hdData.profileLine1], PROFILE[hdData.profileLine2]].filter(Boolean).join('\n\n') })} className="bg-white/50 rounded-2xl p-3 border border-white/40 text-left hover:bg-white/70 transition-colors active:scale-[0.98]">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Profile</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{hdData.profile}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{PROFILE[hdData.profileLine1]?.split('—')[0].trim()} / {PROFILE[hdData.profileLine2]?.split('—')[0].trim()}</p>
                </button>
              )}
              {lifePath && (
                <button onClick={() => setDetail({ title: `Life Path ${lifePath} · ${LIFE_PATH[lifePath]?.title}`, subtitle: 'Numerology', body: LIFE_PATH[lifePath]?.desc ?? '' })} className="bg-white/50 rounded-2xl p-3 border border-white/40 text-left hover:bg-white/70 transition-colors active:scale-[0.98]">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Life Path</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{lifePath}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{LIFE_PATH[lifePath]?.title}</p>
                </button>
              )}
              {personalYr && (
                <button onClick={() => setDetail({ title: `Personal Year ${personalYr}`, subtitle: today.slice(0,4), body: PERSONAL_YEAR[personalYr] ?? '' })} className="bg-white/50 rounded-2xl p-3 border border-white/40 text-left hover:bg-white/70 transition-colors active:scale-[0.98]">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Personal Year</p>
                  <p className="text-base font-medium text-gray-700 mt-0.5">{personalYr}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{PERSONAL_YEAR[personalYr]?.split('—')[0].trim()}</p>
                </button>
              )}
            </div>
          </div>

          {(transitSunSign || transitMoonSign) && (
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Today's Sky — {fmtDate(today)}</p>
              {transitSunSign && (
                <button onClick={() => openTransitPlanet('sun', transitData.personality.sun.gate, transitData.personality.sun.line)} className="w-full flex items-center gap-3 text-left hover:bg-white/40 rounded-2xl p-2 -mx-2 transition-colors">
                  <span className="text-2xl w-8 text-center">{transitSunSign.symbol}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Sun in {transitSunSign.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{transitSunSign.element} · {transitSunSign.modality} collective energy</p>
                  </div>
                </button>
              )}
              {transitMoonSign && (
                <button onClick={() => openTransitPlanet('moon', transitData.personality.moon.gate, transitData.personality.moon.line)} className="w-full flex items-center gap-3 text-left hover:bg-white/40 rounded-2xl p-2 -mx-2 transition-colors">
                  <span className="text-2xl w-8 text-center">☽</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Moon in {transitMoonSign.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{transitMoonSign.element} · {transitMoonSign.modality} emotional undercurrent</p>
                  </div>
                </button>
              )}
            </div>
          )}

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
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Life Path {lifePath}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{LIFE_PATH[lifePath].desc}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════ ASTROLOGY ════ */}
      {tab === 'astrology' && (
        <div className="space-y-4">
          {Object.keys(natalLons).length > 0 && (
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <div>
                <h2 className="font-playfair text-xl text-gray-700">Natal Chart</h2>
                <p className="text-xs text-gray-400 mt-1">Tap any planet or aspect line to learn more.</p>
              </div>
              <NatalWheel
                natalLons={natalLons}
                natalAspects={natalAspects}
                onPlanet={(body) => openPlanet(body, lonToSign(natalLons[body]))}
                onAspect={(asp) => openAspect(asp)}
              />
            </div>
          )}

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="font-playfair text-xl text-gray-700">Natal Planets</h2>
              <p className="text-xs text-gray-400 mt-1">Tap any row to learn about that planet.</p>
            </div>
            {Object.keys(natalLons).length > 0 ? (
              <div className="divide-y divide-white/30">
                {BODY_ORDER.filter(b => natalLons[b] != null).map(body => {
                  const sign = lonToSign(natalLons[body]);
                  const isRx = hdData?.retrograde?.[body];
                  const hNum = hdData?.housePlacements?.[body];
                  return (
                    <button key={body} onClick={() => openPlanet(body, sign)}
                      className="w-full flex items-center gap-3 py-2.5 hover:bg-white/40 rounded-xl px-2 -mx-2 transition-colors text-left">
                      <span className="text-base w-7 text-center text-gray-400 shrink-0">{PLANET_SYM[body]}</span>
                      <span className="text-sm text-gray-500 w-20 shrink-0">{PLANET_LBL[body]}{isRx && <em className="text-xs text-amber-500 not-italic ml-1">Rx</em>}</span>
                      <span className="text-sm font-medium text-gray-700 flex-1">{sign.symbol} {sign.name} {sign.degree}°</span>
                      {hNum && <span className="text-xs text-gray-300 shrink-0 mr-1">H{hNum}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${elStyle(sign.element)}`}>{sign.element}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Save your birth data on <a href="/profile" className="text-[#b88a92] underline">Profile</a> to see your natal planets.</p>
            )}
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="font-playfair text-xl text-gray-700">Houses (Placidus)</h2>
              <p className="text-xs text-gray-400 mt-1">Your chart divided into 12 life domains. Tap any row to learn more.</p>
            </div>
            {hdData?.houses ? (
              <div className="divide-y divide-white/30">
                {hdData.houses.cusps.map((cusp, i) => {
                  const hNum = i + 1;
                  const sign = lonToSign(cusp);
                  const planetsHere = Object.entries(hdData.housePlacements ?? {})
                    .filter(([, h]) => h === hNum)
                    .map(([p]) => PLANET_SYM[p])
                    .join('');
                  const angleLabel = { 1: 'ASC', 4: 'IC', 7: 'DC', 10: 'MC' }[hNum];
                  return (
                    <button key={hNum}
                      onClick={() => setDetail({
                        title: `House ${hNum} — ${HOUSE_THEMES[hNum]}`,
                        subtitle: `${sign.symbol} ${sign.name} ${sign.degree}°`,
                        tags: [sign.name, cap(sign.element), cap(sign.modality)],
                        body: `The ${nth(hNum)} house covers the domain of ${HOUSE_THEMES[hNum].toLowerCase()}. With ${sign.name} on the cusp, you experience this area of life through a ${SIGN_Q[sign.name]?.themes ?? sign.name} lens — the qualities of ${SIGN_Q[sign.name]?.domain ?? 'this sign'} color how this domain unfolds for you.`,
                      })}
                      className="w-full flex items-center gap-3 py-2.5 hover:bg-white/40 rounded-xl px-2 -mx-2 transition-colors text-left">
                      <span className={`text-xs w-10 shrink-0 ${angleLabel ? 'font-semibold text-rose-400' : 'text-gray-400'}`}>
                        {angleLabel ? `${angleLabel}` : `H${hNum}`}
                      </span>
                      <span className="text-sm text-gray-700 flex-1">{sign.symbol} {sign.name} {sign.degree}°</span>
                      {planetsHere && <span className="text-sm text-gray-400 shrink-0">{planetsHere}</span>}
                      <span className="text-xs text-gray-300 shrink-0 hidden sm:block">{HOUSE_THEMES[hNum]}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Add your birth city in <a href="/profile" className="text-[#b88a92] underline">Profile</a> to unlock house placements.
              </p>
            )}
          </div>

          {natalAspects.length > 0 && (
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div>
                <h2 className="font-playfair text-xl text-gray-700">Natal Aspects</h2>
                <p className="text-xs text-gray-400 mt-1">Tap any aspect to learn what it means.</p>
              </div>
              <div className="divide-y divide-white/30">
                {natalAspects.map((asp, i) => (
                  <button key={i} onClick={() => openAspect(asp)}
                    className="w-full flex items-center gap-2 py-2.5 hover:bg-white/40 rounded-xl px-2 -mx-2 transition-colors text-left">
                    <span className="text-sm text-gray-500 w-6 text-center">{PLANET_SYM[asp.planet1]}</span>
                    <span className="text-sm font-bold w-5 text-center" style={{color:asp.color}}>{asp.symbol}</span>
                    <span className="text-sm text-gray-500 w-6 text-center">{PLANET_SYM[asp.planet2]}</span>
                    <span className="text-xs text-gray-600 flex-1">{PLANET_LBL[asp.planet1]} {asp.name} {PLANET_LBL[asp.planet2]}</span>
                    <span className="text-xs text-gray-300">{asp.orb}° orb</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/20">
                {ASPECT_DEFS.map(a => (
                  <button key={a.name} onClick={() => setDetail({ symbol:a.symbol, color:a.color, title:a.name, body:ASPECT_DESC[a.name]?.body??'' })}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="font-semibold" style={{color:a.color}}>{a.symbol}</span> {a.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hdData?.designDate && (
            <div className="glass-card rounded-3xl p-6 space-y-2">
              <h2 className="font-playfair text-xl text-gray-700">Design Date</h2>
              <p className="text-sm text-gray-600">{fmtDate(hdData.designDate)}</p>
              <p className="text-xs text-gray-400 leading-relaxed">Approximately 88 days before your birth — when your unconscious (Design) imprinting occurred as the Sun transited 88° behind your birth Sun position.</p>
            </div>
          )}
        </div>
      )}

      {/* ════ HUMAN DESIGN ════ */}
      {tab === 'hd' && (
        <div className="space-y-4">
          {hdData ? (
            <>
              <div className="glass-card rounded-3xl p-6 space-y-3">
                <div>
                  <h2 className="font-playfair text-xl text-gray-700">Body Graph</h2>
                  <p className="text-xs text-gray-400 mt-1">Tap any center or channel to learn more.</p>
                </div>
                <BodyGraph
                  definedCenters={hdData.definedCenters ?? []}
                  definedChannels={hdData.definedChannels ?? []}
                  onCenter={(key, isDefined) => openCenter(key, isDefined)}
                  onChannel={(pair) => openChannel(pair)}
                />
              </div>

              <div className="glass-card rounded-3xl p-6 space-y-4">
                <h2 className="font-playfair text-xl text-gray-700">Human Design</h2>
                <p className="text-xs text-gray-400">Tap any card to learn more.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label:'Type',      value:cap(hdData.type.replace(/-/g,' ')), onClick:()=>setDetail({title:cap(hdData.type.replace(/-/g,' ')),subtitle:'Human Design Type',body:HD_TYPE[hdData.type]??''}) },
                    { label:'Profile',   value:hdData.profile,                     onClick:()=>setDetail({title:`Profile ${hdData.profile}`,subtitle:`Line ${hdData.profileLine1} / Line ${hdData.profileLine2}`,body:[PROFILE[hdData.profileLine1],PROFILE[hdData.profileLine2]].filter(Boolean).join('\n\n')}) },
                    { label:'Authority', value:cap(hdData.authority),              onClick:()=>setDetail({title:`${cap(hdData.authority)} Authority`,subtitle:'Inner Authority',body:AUTHORITY[hdData.authority]??''}) },
                    { label:'Strategy',  value:hdData.strategy,                    onClick:()=>setDetail({title:'Strategy',subtitle:hdData.strategy,body:`Your strategy is to ${hdData.strategy.toLowerCase()}. This is the practical guidance for how to move through life in alignment with your design, reducing resistance and increasing the quality of your experiences.`}) },
                    { label:'Signature', value:hdData.signature,                   onClick:()=>setDetail({title:'Signature',subtitle:hdData.signature,body:`${hdData.signature} is the feeling you experience when you are living in alignment with your design. When you feel ${hdData.signature.toLowerCase()}, it is a signal that you are on track — that your strategy and authority are being honored.`}) },
                    { label:'Not-Self',  value:hdData.notSelf,                     onClick:()=>setDetail({title:'Not-Self Theme',subtitle:hdData.notSelf,body:`${hdData.notSelf} is the emotion that arises when you are not living in alignment with your design. It is a signal, not a judgment — an invitation to return to your strategy and authority rather than to continue forcing what is not correct for you.`}) },
                  ].map(({label,value,onClick}) => (
                    <button key={label} onClick={onClick} className="bg-white/50 rounded-2xl p-3 border border-white/40 text-left hover:bg-white/70 transition-colors active:scale-[0.98]">
                      <p className="text-xs text-gray-400 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{value}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 space-y-3">
                <h2 className="font-playfair text-xl text-gray-700">Profile Lines</h2>
                {[{line:hdData.profileLine1,role:'Conscious (Personality)'},{line:hdData.profileLine2,role:'Unconscious (Design)'}]
                  .filter(({line})=>line&&PROFILE[line]).map(({line,role})=>(
                    <button key={line} onClick={()=>setDetail({title:`Line ${line} · ${PROFILE[line]?.split('—')[0].trim()}`,subtitle:role,body:PROFILE[line]})}
                      className="w-full bg-white/50 rounded-2xl p-4 border border-white/40 text-left space-y-1 hover:bg-white/70 transition-colors">
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Line {line} · {role}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{PROFILE[line]}</p>
                    </button>
                  ))}
              </div>

              <div className="glass-card rounded-3xl p-6 space-y-3">
                <h2 className="font-playfair text-xl text-gray-700">Energy Centers</h2>
                <p className="text-xs text-gray-400">Tap any center to understand what it means for you.</p>
                <div className="space-y-2">
                  {Object.entries(CENTER_META).map(([key,meta])=>{
                    const defined = hdData.definedCenters?.includes(key);
                    return (
                      <button key={key} onClick={()=>openCenter(key,defined)}
                        className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-colors ${defined?'bg-gradient-to-r from-rose-50/80 to-violet-50/80 border-rose-200/50 hover:from-rose-50 hover:to-violet-50':'bg-white/30 border-white/30 hover:bg-white/50'}`}>
                        <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${defined?'bg-gradient-to-br from-rose-400 to-violet-400':'bg-gray-200'}`}/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-700">{meta.label}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${defined?'bg-rose-100 text-rose-500':'bg-gray-100 text-gray-400'}`}>{defined?'Defined':'Open'}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{meta.theme}</p>
                          <p className="text-xs text-gray-300 mt-0.5">Gates: {meta.gates.join(', ')}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {hdData.definedChannels?.length > 0 && (
                <div className="glass-card rounded-3xl p-6 space-y-3">
                  <h2 className="font-playfair text-xl text-gray-700">Defined Channels</h2>
                  <p className="text-xs text-gray-400">Your consistent, reliable energies. Tap to explore each one.</p>
                  <div className="space-y-2">
                    {hdData.definedChannels.map(([g1,g2])=>(
                      <button key={`${g1}-${g2}`} onClick={()=>openChannel([g1,g2])}
                        className="w-full bg-white/50 rounded-2xl p-3 border border-white/40 text-left hover:bg-white/70 transition-colors">
                        <p className="text-xs font-semibold text-rose-400 mb-0.5">{g1} — {g2}</p>
                        <p className="text-sm text-gray-600">{channelLabel([g1,g2])}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-card rounded-3xl p-6 space-y-4">
                <div>
                  <h2 className="font-playfair text-xl text-gray-700">Gate Activations</h2>
                  <p className="text-xs text-gray-400 mt-1">Tap any gate to learn its meaning.</p>
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
                      {BODY_ORDER.filter(b=>hdData.personality?.[b]||hdData.design?.[b]).map(body=>{
                        const p=hdData.personality?.[body];
                        const d=hdData.design?.[body];
                        const pInCh=hdData.definedChannels?.some(([a,b2])=>a===p?.gate||b2===p?.gate);
                        const dInCh=hdData.definedChannels?.some(([a,b2])=>a===d?.gate||b2===d?.gate);
                        return (
                          <tr key={body} className="border-b border-white/20 last:border-0">
                            <td className="py-2 px-2 text-gray-400">{PLANET_SYM[body]} {PLANET_LBL[body]}</td>
                            <td className="py-2 px-2">
                              {p ? (
                                <button onClick={()=>openGate(p.gate,p.line,`Personality ${PLANET_LBL[body]} · Line ${p.line}`)}
                                  className={`font-semibold hover:underline ${pInCh?'text-gray-800':'text-gray-500'}`}>
                                  {p.gate}.{p.line}
                                </button>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-2 px-2">
                              {d ? (
                                <button onClick={()=>openGate(d.gate,d.line,`Design ${PLANET_LBL[body]} · Line ${d.line}`)}
                                  className={`font-medium hover:underline ${dInCh?'text-rose-400':'text-gray-400'}`}>
                                  {d.gate}.{d.line}
                                </button>
                              ) : <span className="text-gray-300">—</span>}
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
              <p className="text-xs text-gray-400">Add your birth time and location on <a href="/profile" className="text-[#b88a92] underline">Profile</a> and save.</p>
            </div>
          )}
        </div>
      )}

      {/* ════ NUMEROLOGY ════ */}
      {tab === 'numerology' && (
        <div className="space-y-4">
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
          <div className="glass-card rounded-3xl p-6 space-y-3">
            <h2 className="font-playfair text-xl text-gray-700">Your Numbers</h2>
            <div className="space-y-3">
              {personalYr && (
                <button onClick={()=>setDetail({title:`Personal Year ${personalYr}`,subtitle:today.slice(0,4),body:PERSONAL_YEAR[personalYr]??''})}
                  className="w-full bg-white/50 rounded-2xl p-4 border border-white/40 text-left hover:bg-white/70 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Personal Year {today.slice(0,4)}</p>
                      <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{PERSONAL_YEAR[personalYr]}</p>
                    </div>
                    <NumBadge n={personalYr} sm />
                  </div>
                </button>
              )}
              {birthdayNum && (
                <button onClick={()=>setDetail({title:`Birthday Number ${birthdayNum}`,subtitle:'The gifts you were born with',body:`Your Birthday Number ${birthdayNum} describes the specific talents and gifts you carry into this life. It is derived from the day of the month you were born — a personal signature of energy that colors the way your Life Path expresses itself.`})}
                  className="w-full bg-white/50 rounded-2xl p-4 border border-white/40 text-left hover:bg-white/70 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Birthday Number</p>
                      <p className="text-sm text-gray-600 mt-0.5">The gifts and talents you were born with</p>
                    </div>
                    <NumBadge n={birthdayNum} sm />
                  </div>
                </button>
              )}
              {expressNum && LIFE_PATH[expressNum] && (
                <button onClick={()=>setDetail({title:`Expression Number ${expressNum} · ${LIFE_PATH[expressNum]?.title}`,subtitle:'Based on your display name',body:`Your Expression Number ${expressNum} is calculated from the numerical values of all the letters in your name. It describes your natural abilities, the talents and skills you came into this life already carrying, and the way you naturally express yourself in the world.`})}
                  className="w-full bg-white/50 rounded-2xl p-4 border border-white/40 text-left hover:bg-white/70 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Expression Number</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{LIFE_PATH[expressNum].title}</p>
                      <p className="text-xs text-gray-400">Based on your display name</p>
                    </div>
                    <NumBadge n={expressNum} sm />
                  </div>
                </button>
              )}
            </div>
          </div>

          {hdData && lifePath && sunSign && (
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h2 className="font-playfair text-xl text-gray-700">Cross-System Synthesis</h2>
              <div className="space-y-3">
                <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Life Path + Profile</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your Life Path {lifePath} ({LIFE_PATH[lifePath]?.title}) and your {hdData.profile} profile ({PROFILE[hdData.profileLine1]?.split('—')[0].trim()} / {PROFILE[hdData.profileLine2]?.split('—')[0].trim()}) describe a soul journey of{' '}
                    {lifePath<=3?'emergence, expression, and finding your voice':lifePath<=6?'building, serving, and learning to love fully':lifePath<=9?'deep seeking, releasing, and wisdom earned through experience':'mastery, mission, and service at the highest level'}.
                  </p>
                </div>
                <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Moon Sign + Authority</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your moon in {moonSign?.name} gives your emotional interior a {moonSign?.element} quality. Combined with your {hdData.authority} authority, your inner truth emerges{' '}
                    {hdData.authority==='emotional'?'through the full arc of your emotional wave — never in the peak or the valley, but in the stillness between':hdData.authority==='sacral'?'in the immediate gut response that your body knows before your mind catches up':hdData.authority==='splenic'?'in the quiet first-moment knowing that speaks once and never repeats itself':'through conversation, discernment, and moving through different environments'}.
                  </p>
                </div>
                <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Sun Sign + HD Type</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The {sunSign.element} {sunSign.modality} energy of {sunSign.name} flows through the lens of your {hdData.type.replace(/-/g,' ')} design.
                    {hdData.type==='generator'||hdData.type==='manifesting-generator'?` Your ${sunSign.element} vitality is activated through response — when your sacral lights up, the world lights up with you.`:hdData.type==='projector'?` Your ${sunSign.element} nature is channeled through deep perception — you guide others into what they cannot yet see in themselves.`:` Your ${sunSign.element} fire expresses itself through bold initiation — you don't need permission to begin.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ TRANSITS ════ */}
      {tab === 'transits' && (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="font-playfair text-xl text-gray-700">Current Planetary Positions</h2>
              <p className="text-xs text-gray-400 mt-1">{fmtDate(today)} · Tap any planet to learn more.</p>
            </div>
            {transitData?.personality ? (
              <div className="divide-y divide-white/30">
                {BODY_ORDER.filter(b=>transitData.personality[b]!=null).map(body=>{
                  const {gate,line}=transitData.personality[body];
                  const sign=lonToSign(gateLineToLon(gate,line));
                  const hitsNatal=hdData&&(
                    Object.values(hdData.personality??{}).some(a=>a.gate===gate)||
                    Object.values(hdData.design??{}).some(a=>a.gate===gate)
                  );
                  return (
                    <button key={body} onClick={()=>openTransitPlanet(body,gate,line)}
                      className="w-full flex items-center gap-2 py-2.5 hover:bg-white/40 rounded-xl px-2 -mx-2 transition-colors text-left">
                      <span className="text-sm w-6 text-center text-gray-400 shrink-0">{PLANET_SYM[body]}</span>
                      <span className="text-xs text-gray-500 w-20 shrink-0">{PLANET_LBL[body]}</span>
                      <span className="text-sm font-medium text-gray-700 flex-1">{sign.symbol} {sign.name}</span>
                      <button onClick={e=>{e.stopPropagation();openGate(gate,line,`Transit ${PLANET_LBL[body]}`);}}
                        className="text-xs text-gray-400 hover:text-[#b88a92] transition-colors shrink-0 mr-1">Gate {gate}.{line}</button>
                      {hitsNatal&&<span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-500 shrink-0">↔ natal</span>}
                    </button>
                  );
                })}
              </div>
            ) : <p className="text-sm text-gray-400">Unable to load current positions.</p>}
          </div>

          {hdData?.definedChannels?.length > 0 && (
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h2 className="font-playfair text-xl text-gray-700">Your Channels Today</h2>
              <p className="text-xs text-gray-400">When a transit planet enters a gate in your defined channels, that channel's energy is amplified. Tap to learn about each channel.</p>
              <div className="space-y-2">
                {hdData.definedChannels.map(([g1,g2])=>{
                  const g1Active=transitGateSet.has(g1);
                  const g2Active=transitGateSet.has(g2);
                  const active=g1Active||g2Active;
                  return (
                    <button key={`${g1}-${g2}`} onClick={()=>openChannel([g1,g2])}
                      className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-colors ${active?'bg-rose-50/60 border-rose-200/50 hover:bg-rose-50/80':'bg-white/30 border-white/30 hover:bg-white/50'}`}>
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${active?'bg-rose-400':'bg-gray-200'}`}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-600">{g1} — {g2}</p>
                        <p className="text-sm text-gray-600">{channelLabel([g1,g2])}</p>
                        {active&&<p className="text-xs text-rose-400 mt-0.5">Gate {g1Active?g1:g2} lit up by transit</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hdData && (()=>{
            const innerPlanets=['sun','moon','mercury','venus','mars'];
            const aspects=[];
            for (const tb of innerPlanets) {
              if (transitLons[tb]==null) continue;
              for (const nb of BODY_ORDER.slice(0,11)) {
                if (natalLons[nb]==null) continue;
                const diff=((transitLons[tb]-natalLons[nb])%360+360)%360;
                const angle=Math.min(diff,360-diff);
                for (const asp of ASPECT_DEFS) {
                  if (Math.abs(angle-asp.angle)<=asp.orb) {
                    aspects.push({transit:tb,natal:nb,...asp,orb:Math.abs(angle-asp.angle).toFixed(1)});
                    break;
                  }
                }
              }
            }
            if (!aspects.length) return null;
            return (
              <div className="glass-card rounded-3xl p-6 space-y-3">
                <h2 className="font-playfair text-xl text-gray-700">Transit Aspects to Your Chart</h2>
                <p className="text-xs text-gray-400">Tap any aspect to learn what it means.</p>
                <div className="divide-y divide-white/30">
                  {aspects.map((asp,i)=>(
                    <button key={i} onClick={()=>openAspect({...asp,planet1:asp.transit,planet2:asp.natal})}
                      className="w-full flex items-center gap-2 py-2.5 hover:bg-white/40 rounded-xl px-2 -mx-2 transition-colors text-left">
                      <span className="text-sm text-gray-500 w-5 text-center">{PLANET_SYM[asp.transit]}</span>
                      <span className="text-sm font-bold w-5 text-center" style={{color:asp.color}}>{asp.symbol}</span>
                      <span className="text-sm text-gray-500 w-5 text-center">{PLANET_SYM[asp.natal]}</span>
                      <span className="text-xs text-gray-600 flex-1">Transit {PLANET_LBL[asp.transit]} {asp.name} natal {PLANET_LBL[asp.natal]}</span>
                      <span className="text-xs text-gray-300">{asp.orb}°</span>
                    </button>
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
