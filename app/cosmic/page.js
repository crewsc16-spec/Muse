'use client';

import { useState, useEffect, useRef } from 'react';
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
const BIRTHDAY_NUM = {
  1:  { title: 'The Initiator',       desc: 'Birthday Number 1 marks you as a born leader with fierce independence and original ideas. You have natural courage to forge new paths where none exist. Your creative spark ignites projects, movements, and fresh directions. You thrive when you trust your own vision and step out ahead of the crowd.' },
  2:  { title: 'The Diplomat',        desc: 'Birthday Number 2 gives you an extraordinary gift for sensing what others feel and need. You are a natural mediator who brings opposing sides into balance. Your strength lives in cooperation, patience, and quiet influence. The world opens for you when you trust the power of your gentle persistence.' },
  3:  { title: 'The Communicator',    desc: 'Birthday Number 3 blesses you with expressive talent — words, art, humor, and charm flow through you effortlessly. You light up rooms and inspire others simply by being yourself. Joy is your medicine and creativity is your compass. When you share your gifts openly, abundance follows.' },
  4:  { title: 'The Builder',         desc: 'Birthday Number 4 gives you a rare ability to turn ideas into lasting structures. You are disciplined, reliable, and deeply practical. Others trust you because you follow through. Your greatest power is showing that mastery comes from consistent, devoted effort — one brick at a time.' },
  5:  { title: 'The Freedom Seeker',  desc: 'Birthday Number 5 fills you with restless curiosity and a hunger for experience. Change is not something that happens to you — it is something you create. You are magnetic, versatile, and adaptable. Your gift is showing others that growth requires the courage to let go of the familiar.' },
  6:  { title: 'The Caretaker',       desc: 'Birthday Number 6 makes you a natural healer and guardian of beauty. You carry deep responsibility for those you love and create harmony wherever you go. Home, family, and community thrive under your care. Remember: the love you give so freely to others is meant for you too.' },
  7:  { title: 'The Analyst',         desc: 'Birthday Number 7 gives you a penetrating mind and a soul that craves deep understanding. You are naturally drawn to hidden truths, spiritual questions, and inner exploration. Solitude is where your greatest insights are born. Trust that your need to go deep is itself a gift to the world.' },
  8:  { title: 'The Powerhouse',      desc: 'Birthday Number 8 gives you executive vision and the drive to achieve real-world results. You understand money, power, and influence on an instinctive level. Your ambition is matched by an innate sense of fairness. When you wield your authority with integrity, you build legacies that outlast you.' },
  9:  { title: 'The Old Soul',        desc: 'Birthday Number 9 carries the wisdom of someone who has lived and loved deeply. You are compassionate, idealistic, and naturally drawn to serve the greater good. Letting go comes easier to you than to most — because you understand that release creates space for what is truly meant for you.' },
  11: { title: 'The Intuitive',       desc: 'Birthday Number 11 is a master number that amplifies your spiritual sensitivity and psychic awareness. You receive impressions, ideas, and inspiration from a source beyond logic. You are a channel for higher truths. When you learn to ground this electric energy, you become a beacon for others.' },
  22: { title: 'The Architect',       desc: 'Birthday Number 22 is the master builder — you were born with the ability to manifest grand visions into tangible reality. Your dreams are not small, and neither is your capacity to realize them. You bridge the spiritual and material worlds. Discipline and patience turn your potential into legacy.' },
  33: { title: 'The Healer',          desc: 'Birthday Number 33 is the master healer number — you carry an extraordinary capacity for selfless love and spiritual service. Your mere presence can uplift and transform. Teaching, healing, and nurturing come as naturally as breathing. Your path is to embody compassion so fully that it becomes contagious.' },
};
const EXPRESSION_NUM = {
  1:  { title: 'The Pioneer',         desc: 'Expression Number 1 means you naturally express yourself through leadership, originality, and bold action. You are most alive when forging your own path. Others look to you to go first and show what is possible. Your voice carries authority because it comes from authentic self-trust.' },
  2:  { title: 'The Peacemaker',      desc: 'Expression Number 2 means you express yourself through harmony, sensitivity, and the art of connection. You have a rare talent for making others feel truly seen and heard. Your natural diplomacy draws people together. You communicate with a gentleness that disarms even the most guarded hearts.' },
  3:  { title: 'The Performer',       desc: 'Expression Number 3 means you express yourself through creativity, wit, and infectious enthusiasm. Words, stories, and artistic vision pour through you like water. You are a natural entertainer and mood-lifter. When you stop censoring your joy, the world leans in to listen.' },
  4:  { title: 'The Organizer',       desc: 'Expression Number 4 means you express yourself through structure, dependability, and meticulous craftsmanship. You bring order to chaos and make complex things simple. People trust you because your word means something. Your talent is making the difficult look effortless through quiet, steady mastery.' },
  5:  { title: 'The Adventurer',      desc: 'Expression Number 5 means you express yourself through versatility, curiosity, and magnetic energy. You are a natural storyteller who has lived enough to have something real to say. Change and variety fuel you. You inspire others by showing them how to embrace the unknown with excitement instead of fear.' },
  6:  { title: 'The Nurturer',        desc: 'Expression Number 6 means you express yourself through love, beauty, and devoted service. You have a gift for creating environments where people feel safe enough to bloom. Your aesthetic sense and emotional warmth are felt by everyone around you. You teach by loving — and you love without conditions.' },
  7:  { title: 'The Philosopher',     desc: 'Expression Number 7 means you express yourself through deep thought, research, and spiritual insight. You are naturally drawn to the questions others avoid. Your mind is both analytical and mystical. When you share the truths you have discovered in your solitude, you offer others a rare kind of clarity.' },
  8:  { title: 'The Executive',       desc: 'Expression Number 8 means you express yourself through ambition, strategic thinking, and material mastery. You have a natural command presence that others respect. Business, finance, and leadership are languages you speak fluently. Your gift is showing that power and compassion can coexist beautifully.' },
  9:  { title: 'The Humanitarian',    desc: 'Expression Number 9 means you express yourself through compassion, wisdom, and a desire to serve humanity. You see the big picture where others see only their own corner. Art, healing, and global awareness call to you. You are most fulfilled when your gifts reach beyond yourself to uplift the whole.' },
  11: { title: 'The Visionary',       desc: 'Expression Number 11 is a master number — you express yourself through spiritual insight, inspiration, and illumination. You receive ideas and creative downloads that feel channeled from a higher source. Your nervous system is finely tuned to subtle frequencies. When grounded, your words and art can shift collective consciousness.' },
  22: { title: 'The Master Planner',  desc: 'Expression Number 22 is a master number — you express yourself through visionary planning and the ability to manifest ideas on a grand scale. You think in systems, structures, and legacies. Your talent is taking the impossible and making it inevitable. You are here to build something that outlasts your lifetime.' },
  33: { title: 'The Master Healer',   desc: 'Expression Number 33 is a master number — you express yourself through unconditional love, spiritual teaching, and profound compassion. Your presence alone can be healing. You communicate truth with a gentleness that reaches the deepest wounds. You are here to demonstrate that love itself is the most powerful force in existence.' },
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
        {item.body?.split('\n\n').map((para, i) => (
          <p key={i} className="text-sm text-gray-600 leading-relaxed">{para}</p>
        ))}
      </div>
    </div>
  );
}

// ─── Vedic constants ──────────────────────────────────────────────────────────
const VEDIC_PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const VEDIC_PLANET_SYM = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
const SIGN_LORDS = { Aries:'Mars', Taurus:'Venus', Gemini:'Mercury', Cancer:'Moon', Leo:'Sun', Virgo:'Mercury', Libra:'Venus', Scorpio:'Mars', Sagittarius:'Jupiter', Capricorn:'Saturn', Aquarius:'Saturn', Pisces:'Jupiter' };
const NAKSHATRA_DATA = [
  {name:'Ashwini',lord:'Ketu',symbol:'🐴'},{name:'Bharani',lord:'Venus',symbol:'⚖️'},
  {name:'Krittika',lord:'Sun',symbol:'🔪'},{name:'Rohini',lord:'Moon',symbol:'🌸'},
  {name:'Mrigashira',lord:'Mars',symbol:'🦌'},{name:'Ardra',lord:'Rahu',symbol:'💎'},
  {name:'Punarvasu',lord:'Jupiter',symbol:'🏹'},{name:'Pushya',lord:'Saturn',symbol:'🌺'},
  {name:'Ashlesha',lord:'Mercury',symbol:'🐍'},{name:'Magha',lord:'Ketu',symbol:'🦁'},
  {name:'Purva Phalguni',lord:'Venus',symbol:'🛏️'},{name:'Uttara Phalguni',lord:'Sun',symbol:'🌿'},
  {name:'Hasta',lord:'Moon',symbol:'✋'},{name:'Chitra',lord:'Mars',symbol:'💫'},
  {name:'Swati',lord:'Rahu',symbol:'🌬️'},{name:'Vishakha',lord:'Jupiter',symbol:'⚡'},
  {name:'Anuradha',lord:'Saturn',symbol:'🌸'},{name:'Jyeshtha',lord:'Mercury',symbol:'👑'},
  {name:'Mula',lord:'Ketu',symbol:'🌿'},{name:'Purva Ashadha',lord:'Venus',symbol:'🐘'},
  {name:'Uttara Ashadha',lord:'Sun',symbol:'🐘'},{name:'Shravana',lord:'Moon',symbol:'👂'},
  {name:'Dhanishta',lord:'Mars',symbol:'🥁'},{name:'Shatabhisha',lord:'Rahu',symbol:'⭕'},
  {name:'Purva Bhadrapada',lord:'Jupiter',symbol:'⚔️'},{name:'Uttara Bhadrapada',lord:'Saturn',symbol:'🐍'},
  {name:'Revati',lord:'Mercury',symbol:'🐟'},
];
const NAKSHATRA_DESC = {
  'Ashwini':'The twin horse-headed healers — swift, pioneering, and gifted with natural healing energy. Ashwini begins the zodiac and embodies the pure impulse to act, to arrive, and to restore. Those born under this star move quickly and carry an instinctive gift for renewal.',
  'Bharani':'Ruled by Yama, lord of dharma and death. Bharani holds the fierce creative and destructive power of existence — the womb and the tomb in one. This nakshatra carries intense life force, moral seriousness, and the capacity to bear what others cannot.',
  'Krittika':'The sharp blades of transformation, ruled by the Sun. Krittika cuts through what is false, purifies what remains, and burns with the fire of truth. Those touched by this star are warriors of clarity — honest, direct, and impossible to deceive.',
  'Rohini':'The most beloved nakshatra of the Moon — lush, creative, and sensually rooted. Rohini governs beauty, abundance, and the deep pleasure of being fully in the body. It is where growth is most natural, most fertile, and most graceful.',
  'Mrigashira':'The searching deer — gentle, curious, and eternally seeking. Mrigashira carries a restless intelligence that is always reaching for what lies just beyond the visible. It governs the mind\'s natural longing for beauty, truth, and the perfect thing.',
  'Ardra':'The storm — Rahu\'s nakshatra of dissolution and radical renewal. Ardra carries the energy of Shiva\'s dance of destruction: what it touches, it transforms. This star governs genius, disruption, and the painful gift of seeing through all illusions.',
  'Punarvasu':'Return, renewal, and the restoration of goodness. Governed by Jupiter, Punarvasu brings back what was lost and restores faith after hardship. Its energy is generous, philosophical, and marked by a deep and enduring optimism about the human journey.',
  'Pushya':'The most auspicious nakshatra — the nourisher, governed by Saturn. Pushya feeds, sustains, and provides for all who come to it. It governs nourishment in every form: food, love, dharma, and the slow, patient accumulation of wisdom across time.',
  'Ashlesha':'The coiled serpent, ruled by Mercury. Ashlesha holds the raw, primordial kundalini energy — penetrating, hypnotic, and capable of enormous transformation. This star governs depth of perception, the capacity to hold paradox, and the mysteries of the unconscious.',
  'Magha':'The throne — ancestral power, royal dignity, and deep karmic lineage. Magha carries the weight and blessing of those who came before. Its energy is commanding, proud, and oriented toward greatness earned through the honoring of roots and tradition.',
  'Purva Phalguni':'Rest, pleasure, and the joy of creative expression. Governed by Venus, this nakshatra governs the arts, romance, and the luxury of being fully alive and at ease. It is the resting place before effort — the celebration that restores and prepares.',
  'Uttara Phalguni':'The generous patron — ruled by the Sun. Where Purva Phalguni rests, Uttara Phalguni gives. This nakshatra governs service, agreement, and the sacred contracts between human beings. Its energy is warm, principled, and naturally oriented toward others\' flourishing.',
  'Hasta':'Dexterity, skill, and the power of the hands. Governed by the Moon, Hasta is the craftsperson, the healer, the one who makes with care and precision. This star governs the practical intelligence that translates vision into form.',
  'Chitra':'The bright jewel — beauty, artistry, and the creative intelligence of Mars. Chitra governs the capacity to see and make what is truly beautiful. Its energy is magnetic, precise, and marked by an almost supernatural gift for aesthetic truth.',
  'Swati':'The independent wind — Rahu\'s nakshatra of freedom and self-becoming. Swati governs the sword that cuts its own path. Its energy is flexible, adaptable, and driven by the deep need for autonomy and the right to define itself on its own terms.',
  'Vishakha':'Single-pointed aim and eventual triumph — Jupiter\'s star of the seeker who reaches the goal. Vishakha governs the drive toward a purpose that sustains across time. Its energy is fierce, focused, and capable of delayed but complete fulfillment.',
  'Anuradha':'Devoted friendship, collaboration, and the love that sustains across distance. Saturn\'s nakshatra of loyalty governs the bonds that endure through difficulty. Its energy is warm, inclusive, and marked by a deep and genuine care for those it loves.',
  'Jyeshtha':'The eldest — Mercury\'s nakshatra of authority, seniority, and the weight of responsibility. Jyeshtha governs leadership born from seniority, the capacity to carry what others cannot, and the fierce protectiveness of those who hold the highest position.',
  'Mula':'The root — Ketu\'s nakshatra of radical dissolution and going to the source. Mula strips away everything that is not essential. Its energy is investigative, transformative, and not afraid of destruction — because it knows that something more real lives beneath.',
  'Purva Ashadha':'Early victory — Venus\'s nakshatra of invincibility and the refusal to be defeated. Purva Ashadha carries a deep pride and the energy of the warrior who will not surrender. It governs purification, rejuvenation, and the courage of the unbroken spirit.',
  'Uttara Ashadha':'Final victory — the Sun\'s nakshatra of complete and lasting achievement. Uttara Ashadha governs the triumph that endures: the kind that is earned through discipline, righteousness, and the willingness to stand for what is true no matter the cost.',
  'Shravana':'Listening — the Moon\'s nakshatra of reception, learning, and transmission. Shravana governs the sacred act of truly hearing — wisdom received through attentive silence. Its energy is receptive, intelligent, and marked by the profound gift of knowing how to listen.',
  'Dhanishta':'The drum — Mars\'s nakshatra of rhythm, abundance, and the music of being alive. Dhanishta governs wealth, prosperity, and the power to move through the world with strength and joy. Its energy is vibrant, martial, and marked by a natural charisma.',
  'Shatabhisha':'The hundred healers — Rahu\'s nakshatra of mystery, healing, and the veiled truth. Shatabhisha governs what is hidden, the occult, and the healing that comes from seeing through the surface of things. Its energy is secretive, investigative, and profoundly unusual.',
  'Purva Bhadrapada':'The fire of purification — Jupiter\'s nakshatra of radical transformation through burning. Purva Bhadrapada governs the ascetic fire that destroys what is gross so that what is refined may emerge. Its energy is intense, otherworldly, and marked by spiritual power.',
  'Uttara Bhadrapada':'Deep wisdom and the stillness of the depths — Saturn\'s nakshatra of compassion across lifetimes. Uttara Bhadrapada governs the capacity to hold the full spectrum of experience without being destroyed by it. Its energy is ancient, wise, and boundlessly compassionate.',
  'Revati':'The final nakshatra — Mercury\'s star of completion, abundance, and the journey home. Revati governs the completion of cycles, the guidance of those who are lost, and the gentle transition between worlds. Its energy is nurturing, psychic, and marked by a profound and quiet grace.',
};
const DASHA_DESC = {
  Sun:'A period of clarity, authority, and the illumination of your deepest purpose. The Sun mahadasha brings you into greater alignment with your authentic self — your visibility increases, your willpower strengthens, and life calls you toward leadership and integrity.',
  Moon:'A period of deep feeling, inner attunement, and the nourishing of what matters most. The Moon mahadasha heightens emotional sensitivity, brings significant events around home, mother, and belonging, and opens the inner life in ways that ask for genuine self-care.',
  Mars:'A period of energy, courage, and decisive action. Mars mahadasha brings ambition to the surface, sharpens your drive, and calls you to pursue your goals with force and focus. Conflict may arise, but so does the capacity to meet it and prevail.',
  Rahu:'A period of expansion beyond familiar boundaries — disorienting, ambitious, and ultimately transformative. Rahu mahadasha pulls you toward what is new, foreign, and outside your comfort zone. It is the time of the seeker, the shape-shifter, and the one who outgrows the life they were born into.',
  Jupiter:'A period of grace, expansion, and deepening wisdom. Jupiter mahadasha brings abundance, opportunity, and the blessings of dharma. It is often the most fortunate and growth-filled period in a life — a time when the doors open and the spirit expands.',
  Saturn:'A period of discipline, restriction, and the slow building of something real and lasting. Saturn mahadasha asks you to do the work — not quickly, not easily, but with the kind of sustained effort that produces genuine mastery. What you build here endures.',
  Mercury:'A period of intellectual vitality, communication, and the rapid exchange of ideas. Mercury mahadasha quickens the mind, multiplies connections, and brings education, commerce, and conversation into prominence. It rewards curiosity, adaptability, and the intelligent use of information.',
  Ketu:'A period of spiritual deepening, release of the material, and dissolution of what no longer serves. Ketu mahadasha turns the gaze inward, away from worldly ambition and toward the essential. It can feel like loss — but what falls away is what was never truly yours.',
  Venus:'A period of beauty, love, abundance, and the flowering of all that gives life its richness. Venus mahadasha is often one of the most pleasurable and creatively prolific periods — relationships deepen, beauty multiplies, and the heart opens to what is most genuinely delightful.',
};
const YOGA_DESC = {
  'Vishkumbha':'Powerful and determined — struggles are overcome through persistent effort.',
  'Priti':'Beloved and affectionate — naturally delightful to others.',
  'Ayushman':'Long-lived and vigorous — full of sustaining life force.',
  'Saubhagya':'Fortunate — blessed with natural grace and good luck.',
  'Shobhana':'Beautiful and radiant — marked by natural elegance.',
  'Atiganda':'Potentially challenging — opportunities arise through overcoming obstacles.',
  'Sukarman':'Meritorious and industrious — naturally skilled in one\'s work.',
  'Dhriti':'Patient and steadfast — capable of holding a course through difficulty.',
  'Shula':'Sharp, penetrating intelligence — direct and sometimes cutting.',
  'Ganda':'Requires extra care — energy best directed toward overcoming hidden challenges.',
  'Vriddhi':'Growth and increase — natural expansion flows in all directions.',
  'Dhruva':'Stable, reliable, and enduringly steadfast in all endeavors.',
  'Vyaghata':'Bold and forceful — an energy that breaks through resistance.',
  'Harshana':'Joyful and celebratory — naturally uplifting to all around you.',
  'Vajra':'Adamantine strength — unyielding and capable of cutting through all obstacles.',
  'Siddhi':'Achievement and success — the natural completion of what is begun.',
  'Vyatipata':'Caution and attentiveness are called for — awareness brings protection.',
  'Variyan':'Comfort and ease — the natural enjoyment of life\'s pleasures.',
  'Parigha':'Patience required — barriers become doorways with perseverance.',
  'Shiva':'Auspicious and blessed — deeply aligned with higher purpose.',
  'Siddha':'Accomplished and naturally gifted — capable of remarkable achievement.',
  'Sadhya':'Goals are within reach — consistent effort brings accomplishment.',
  'Shubha':'Benefic and auspicious — naturally inclined toward the good.',
  'Shukla':'Pure, clear, and luminous in character.',
  'Brahma':'High spiritual potential — marked by deep knowledge and wisdom.',
  'Indra':'Leadership and power — the natural authority of one who commands.',
  'Vaidhriti':'A time for completion, release, and turning the page.',
};
const VAARA_DESC = {
  Sunday:'The Sun\'s day — ideal for authority, visibility, health, and matters of the father.',
  Monday:'The Moon\'s day — ideal for emotional matters, home, mother, and intuitive work.',
  Tuesday:'Mars\'s day — favorable for courage, decisive action, and competitive endeavors.',
  Wednesday:'Mercury\'s day — excellent for communication, commerce, learning, and travel.',
  Thursday:'Jupiter\'s day — the most auspicious day for dharmic, educational, and spiritual work.',
  Friday:'Venus\'s day — favorable for beauty, love, creativity, luxury, and all artistic work.',
  Saturday:'Saturn\'s day — suited for discipline, hard work, service, and long-term projects.',
};
const KARANA_DESC = {
  Bava:'Auspicious for all new beginnings.',
  Balava:'Gentle and pleasant — good for creative and social activities.',
  Kaulava:'Friendly energy — favors cooperation and mutual support.',
  Taitila:'Favorable for trade, commerce, and practical endeavors.',
  Garaja:'Steady and enduring — good for long-term commitments.',
  Vanija:'The merchant — excellent for trade, negotiation, and exchange.',
  Vishti:'Inauspicious — best for introspection rather than new action.',
  Shakuni:'Clever and resourceful — unexpected solutions arise.',
  Chatushpada:'Stability and endurance — favorable for foundations.',
  Naga:'Depth and power — favorable for deep work and transformation.',
  Kimstughna:'Purifying — good for clearing and releasing what is complete.',
};
const DIGNITY_STYLE = {
  exalted:     {label:'Exalted',     color:'text-amber-600', bg:'bg-amber-50',   border:'border-amber-200/60'},
  own:         {label:'Own Sign',    color:'text-green-600', bg:'bg-green-50',   border:'border-green-200/60'},
  own_sign:    {label:'Own Sign',    color:'text-green-600', bg:'bg-green-50',   border:'border-green-200/60'},
  moolatrikona:{label:'Moolatrikona',color:'text-emerald-600',bg:'bg-emerald-50',border:'border-emerald-200/60'},
  friendly:    {label:'Friend',      color:'text-sky-600',   bg:'bg-sky-50',     border:'border-sky-200/60'},
  neutral:     {label:'Neutral',     color:'text-gray-500',  bg:'bg-gray-50',    border:'border-gray-200/60'},
  enemy:       {label:'Enemy',       color:'text-orange-600',bg:'bg-orange-50',  border:'border-orange-200/60'},
  debilitated: {label:'Debilitated', color:'text-rose-600',  bg:'bg-rose-50',    border:'border-rose-200/60'},
};
const VARGA_PURPOSE = {
  d9:'Marriage, dharma, and the deeper purpose beneath the surface of your life.',
  d10:'Career, profession, and your public contribution to the world.',
  d3:'Courage, siblings, and the quality of your personal efforts.',
  d7:'Children, creativity, and the legacy you leave.',
  d12:'Parents, ancestors, and the inheritance of your lineage.',
};
const SIGN_ORDER = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const VEDIC_PLANET_DESC = {
  Sun:     { title:'Surya · The Sun', body:'Surya is the soul — the self, the source of light and life in Jyotish. It governs the father, authority, government, and vital life force. Its placement reveals your soul\'s purpose, your relationship with authority and the masculine, and where your light shines most naturally. A strong Sun brings confidence, leadership, and vitality. Its nakshatra and house show the domain of life where purpose and identity are meant to shine most brightly.' },
  Moon:    { title:'Chandra · The Moon', body:'Chandra is the mind — the emotions, the mother, and the capacity for nourishment. In Jyotish the Moon is often considered more important than the Sun, because it governs your felt, lived experience of life. The Moon\'s nakshatra (Janma Nakshatra) is the most personally significant placement in the chart, revealing your deepest psychological nature, emotional needs, and the quality of your inner world. A strong Moon brings peace of mind, loving relationships, and emotional resilience.' },
  Mars:    { title:'Mangala · Mars', body:'Mangala is the warrior — energy, courage, action, and protection. In Jyotish, Mars governs younger siblings, landed property, engineering, surgery, and all competitive pursuits. It rules blood, muscles, and the vital force behind action. Mars placed in the first, fourth, seventh, eighth, or twelfth house creates Mangal Dosha, which traditionally calls for attention in marriage compatibility. A strong Mars bestows courage, athletic ability, and decisive leadership.' },
  Mercury: { title:'Budha · Mercury', body:'Budha is the intellect — the communicator, the merchant, and the student. In Jyotish, Mercury governs trade, mathematics, writing, speech, and all forms of skillful discernment. It rules the nervous system and the faculty of discrimination. Mercury within 8° of the Sun becomes combust (Astangata) and may reduce the clarity of self-expression. A strong Mercury bestows wit, business acumen, and the gift of clear and persuasive communication.' },
  Jupiter: { title:'Guru · Jupiter', body:'Guru is the great benefic — the teacher, the priest, the bestower of wisdom, children, and fortune. In Jyotish, Jupiter governs dharma, children, wealth, higher education, philosophy, and divine grace. It is the most important benefic in the chart — its strength and placement are among the strongest indicators of overall life fortune. Jupiter expands whatever it touches, and its aspect on a house or planet blesses it with protection and growth.' },
  Venus:   { title:'Shukra · Venus', body:'Shukra is the benefic of material life — beauty, love, luxury, art, and the refinements of earthly existence. In Jyotish, Venus governs marriage (especially for men), partnership, vehicles, gems, and all the pleasures that make life beautiful. It rules the reproductive system, the kidneys, and our capacity for relating. A strong Venus brings a beautiful life, loving relationships, and artistic gifts. Shukra is the guru of the asuras — the one who knows both the pleasures and the deeper magic of material existence.' },
  Saturn:  { title:'Shani · Saturn', body:'Shani is the great karmic teacher — discipline, delay, restriction, and the slow harvest of what has been sown across lifetimes. In Jyotish, Saturn governs longevity, service, the masses, and professions requiring sustained effort over time. Sade Sati (7½ years of Saturn transiting moon sign and adjacent signs) is one of the most significant transit periods in a life. A weak or afflicted Saturn brings chronic difficulties; a strong Saturn — especially in exaltation, own sign, or a kendra — confers remarkable endurance, authority, and the ability to build something truly lasting.' },
  Rahu:    { title:'Rahu · North Node', body:'Rahu is the shadow planet of insatiable desire, obsession, and the hunger for worldly experience. In Jyotish, Rahu represents what the soul is reaching for in this incarnation — the new, the foreign, the unconventional. It always moves retrograde and functions as an amplifier, intensifying whatever sign and house it occupies. Rahu governs technology, foreigners, illusion, and the cutting edge of the new. Its Mahadasha (18 years) is often the most dramatic period of worldly rise — and the deepest encounter with illusion and longing.' },
  Ketu:    { title:'Ketu · South Node', body:'Ketu is the shadow planet of liberation, past-life mastery, and spiritual detachment. Where Rahu grasps, Ketu releases. In Jyotish, Ketu represents what the soul has already mastered in previous lifetimes — abilities that feel innate but somehow incomplete or unsatisfying. It governs moksha, psychic ability, occult knowledge, and the path of renunciation. Ketu\'s placement reveals where you are naturally gifted yet strangely detached. Its Mahadasha (7 years) often initiates a turning inward and a releasing of worldly attachment in favor of something more essential.' },
};

const VEDIC_HOUSE_DESC = {
  1:  { name:'Lagna · First House',    themes:'Self, body, personality, dharma', body:'The first house is the Lagna — the most important house in Jyotish. It represents your physical body, personality, temperament, overall vitality, and the lens through which your soul experiences this life. The rising sign and any planets here color everything about how you show up in the world. The Lagna lord is the most important planet in the entire chart — its strength, placement, and aspects profoundly shape your overall life quality and direction.' },
  2:  { name:'Dhana · Second House',   themes:'Wealth, family, speech, food, face', body:'The second house governs accumulated wealth, the immediate family, speech, food habits, the face, and the right eye. It reveals your relationship with your family of origin, your capacity to accumulate material resources, and the quality of your communication. Benefics here tend to bless with good speech and financial stability; malefics can create difficulties with family or indicate a more cutting or caustic manner of speaking.' },
  3:  { name:'Sahaja · Third House',   themes:'Courage, siblings, communication, effort', body:'The third house governs younger siblings, courage, short journeys, communication, hands, and personal sustained effort. It is the house of willpower and initiative — what you can make happen through your own determined effort. A strong third house indicates brave, communicative, and creatively active energy. Planets here reveal the quality of your relationship with siblings and your own gutsy, self-initiating energy.' },
  4:  { name:'Sukha · Fourth House',   themes:'Mother, home, inner peace, property', body:'The fourth house governs the mother, home, property, vehicles, inner happiness, and the chest. It reveals the quality of your home life and your fundamental capacity for contentment. A strong fourth house indicates a nurturing mother, a stable and pleasant home, and an overall sense of inner peace. Planets here reveal the nature of your domestic life, your relationship with your mother, and your deeply felt sense of belonging in the world.' },
  5:  { name:'Putra · Fifth House',    themes:'Children, intelligence, creativity, past-life merit', body:'The fifth house governs children, creative intelligence, speculation, romance, mantras, and the accumulated merit of past lives (purva punya). It is one of the most important trikona houses — its strength indicates the blessings of dharma flowing into this lifetime. Planets here reveal your relationship with children, your creative gifts, and the quality of your intuition and intellect. A strong fifth house is a profound blessing.' },
  6:  { name:'Ari · Sixth House',      themes:'Enemies, disease, debt, service, competition', body:'The sixth house governs enemies, disease, debt, service, litigation, and competition. Paradoxically, it is also the house of victory over these challenges — planets here can both generate and overcome obstacles. Benefics in the sixth can indicate healing gifts and ability to defeat competition; malefics (especially Mars and Saturn) can be powerful in the sixth, granting the strength to overcome enemies and illness. It is an Upachaya house — one that improves with time.' },
  7:  { name:'Kalatra · Seventh House', themes:'Marriage, partnership, spouse, public', body:'The seventh house governs marriage, the spouse, business partnerships, and the public. It is the house of the other — your most important one-on-one relationships and the mirror that partnership holds up to you. Planets here color the nature of the spouse and the quality of relational life. The seventh lord\'s strength and placement are among the most important factors in assessing marriage timing and quality. Opposite the Lagna, it also governs how you appear to and engage with the world at large.' },
  8:  { name:'Ayur · Eighth House',    themes:'Longevity, transformation, hidden, inheritance', body:'The eighth house governs longevity, sudden events, transformation, inheritance, chronic illness, occult knowledge, and the hidden depths of life. It is the house of death and rebirth — not just physical death, but the constant dying and becoming that marks a genuine life. Planets here reveal the nature of transformative experiences, the manner of sudden changes, and access to hidden or occult knowledge. A well-supported eighth house can bestow longevity, deep research ability, and occult gifts.' },
  9:  { name:'Dharma · Ninth House',   themes:'Fortune, father, guru, higher learning, dharma', body:'The ninth house is considered the most auspicious house in Jyotish — the house of dharma, fortune, the father, the guru, higher education, long journeys, and divine grace. A strong ninth house is one of the most powerful indicators of a fortunate, protected, and meaningful life. Planets here reveal your relationship with your father and teachers, the philosophical or spiritual path that gives life meaning, and the quality of the divine grace flowing through your chart.' },
  10: { name:'Karma · Tenth House',    themes:'Career, status, action, public life, authority', body:'The tenth house governs career, public status, profession, the government or employer, and the actions for which you become known. It is the most visible house — planets here have tremendous power to shape your public life and professional path. A strong tenth house and a well-placed tenth lord indicate a prominent and fulfilling career. The tenth from the Moon is equally important for assessing career potential. This is the house of Karma — what you actually do in the world.' },
  11: { name:'Labha · Eleventh House', themes:'Gains, income, friends, aspirations, elder siblings', body:'The eleventh house governs income, gains, the fulfillment of desires, elder siblings, influential friends, and social networks. All planets tend to give good results in the eleventh — it is a house of gain and the realization of hopes. A strong eleventh indicates steady income, well-connected friendships, and the satisfying fulfillment of your most important aspirations. The eleventh lord\'s placement and strength reveal how easily and through what means gains flow into your life.' },
  12: { name:'Vyaya · Twelfth House',  themes:'Liberation, expenses, foreign, sleep, spirituality', body:'The twelfth house governs liberation (moksha), expenses, losses, foreign lands, sleep, retreat, and the dissolution of the ego into something larger. It is the house of endings and of what lies beyond the visible world — the ashram, the hospital, foreign soil, and the meditative stillness of the final stage. A spiritually strong twelfth house (with Jupiter or a strong twelfth lord) can indicate deep spiritual gifts, meaningful time in foreign countries, and genuine capacity for renunciation and liberation.' },
};

const PURPOSE_STYLE = {
  Dharma: 'bg-amber-50 text-amber-600 border-amber-200/50',
  Artha:  'bg-green-50 text-green-600 border-green-200/50',
  Kama:   'bg-rose-50 text-rose-500 border-rose-200/50',
  Moksha: 'bg-violet-50 text-violet-600 border-violet-200/50',
  Kendra: 'bg-sky-50 text-sky-600 border-sky-200/50',
  Trikona:'bg-amber-50 text-amber-700 border-amber-300/50',
  Upachaya:'bg-emerald-50 text-emerald-600 border-emerald-200/50',
  Dusthana:'bg-gray-50 text-gray-500 border-gray-200/50',
};

// ─── Vedic personalized descriptions ─────────────────────────────────────────
const VEDIC_SUN_IN_SIGN = {
  Aries:       'Your Surya in Aries — the sign of its exaltation — blazes with exceptional strength and self-directed force. The pioneering fire of Aries amplifies the Sun\'s natural authority, producing a solar nature that is courageous, independent, and powerfully self-willed. You are built to initiate, to lead, and to act on the truth of your own vision without needing permission.',
  Taurus:      'Your Surya in Taurus grounds the solar light in Venus\'s earthy, sensory world. Your sense of self is rooted in beauty, stability, and what you create and accumulate with patience. Identity emerges through craftsmanship and the pleasure of the physical world — a steady, productive solar nature that builds something real and lasting.',
  Gemini:      'Your Surya in Gemini gives your solar nature a mercurial, quick, and intellectually alive quality. Identity is built through ideas, communication, and the exchange of perspectives. You may express yourself across multiple fields, finding your essential purpose through the versatility of your mind and the breadth of your genuine curiosity.',
  Cancer:      'Your Surya in Cancer turns the solar light inward, toward the emotional and the relational. The ego here is gentler and more permeable — identity is shaped by the quality of your bonds, your home life, and your capacity to nurture and protect. This placement often produces exceptional emotional intelligence and leadership through care rather than command.',
  Leo:         'Your Surya in Leo — its own sign — shines with natural confidence and creative authority. The solar energy finds its most authentic home here. You are meant to be seen, to create, and to lead with warmth and generosity. There is a natural dignity and magnetic radiance in this placement that draws others into your orbit.',
  Virgo:       'Your Surya in Virgo channels solar energy into service, refinement, and the discriminating intelligence of Mercury. Your sense of purpose is tied to doing things precisely and well — being genuinely useful, improving what you touch, and applying discernment to whatever you take on. This solar nature serves rather than commands, and finds deep fulfillment in that.',
  Libra:       'Your Surya in Libra — the sign of its debilitation — softens the solar fire through the relational, harmonizing lens of Venus. The self finds identity through partnership, fairness, and the aesthetic sense of what is beautiful and balanced. You are built for cooperation — your solar purpose is realized most fully through and alongside others.',
  Scorpio:     'Your Surya in Scorpio gives your solar nature a penetrating, intense, and transformative quality. Identity is built through depth of experience, emotional honesty, and a willingness to encounter what is hidden. Your sense of self grows through genuine encounter with life\'s most essential and difficult themes — you are not interested in the surface of things.',
  Sagittarius: 'Your Surya in Sagittarius gives you a solar nature that is expansive, philosophical, and hunger for meaning. Identity is built through wisdom, adventure, and the pursuit of truth across many domains. There is a natural optimism and ethical seriousness here — life is most fully lived when oriented toward something larger than personal gain.',
  Capricorn:   'Your Surya in Capricorn gives your solar nature a disciplined, ambitious, and profoundly long-range quality. Identity emerges through achievement, mastery, and the patient building of something real and enduring. The Sun here is not concerned with immediate recognition — it is building toward authority that cannot be taken away.',
  Aquarius:    'Your Surya in Aquarius turns the solar light toward the collective, the original, and the future. Identity is shaped by your relationship to community and innovation — the vision of what could be. There is a productive tension between individual solar purpose and the pull toward the group; this is your creative field, where your nature finds its most meaningful expression.',
  Pisces:      'Your Surya in Pisces gives the solar nature a fluid, compassionate, and spiritually permeable quality. Identity is shaped by imagination, intuition, and the dissolving of hard edges between self and world. The self here is not fixed — it is responsive, empathic, and capable of extraordinary compassion. Purpose often emerges through the arts, spiritual life, or service that transcends ordinary selfhood.',
};

const VEDIC_MOON_IN_SIGN = {
  Aries:       'Your Chandra in Aries gives your mind and emotional life a quick, impulsive, and intensely responsive quality. Feelings move fast — you react in the moment and recover quickly. The emotional world is active, passionate, and self-directed. You process feelings through action rather than reflection, and you recover your equilibrium most quickly through movement and decisiveness.',
  Taurus:      'Your Chandra in Taurus — the sign of its exaltation — is exceptionally strong and peaceful. The mind is grounded, patient, and deeply sensory. Emotional security comes through stability, beauty, and the nourishing pleasures of the physical world. This is the Moon at its most content and resilient — capable of giving and receiving care with remarkable and consistent ease.',
  Gemini:      'Your Chandra in Gemini creates a mind that is quick, curious, and emotionally engaged through ideas and communication. Your emotional world is broad rather than deep — you process feelings by talking, thinking, and making connections. This placement produces emotional versatility and genuine social ease, with a natural tendency to intellectualize what you feel.',
  Cancer:      'Your Chandra in Cancer — its own sign — is exceptionally strong, empathic, and deeply nourishing. The mind is feeling-rich, receptive, and powerfully oriented toward home, family, and belonging. You have a natural and abundant gift for nurturing and being nurtured. The emotional world is deep and long-memoried — bonds formed here last lifetimes.',
  Leo:         'Your Chandra in Leo gives your emotional life a warm, generous, and expressive quality. You feel most yourself when creating, playing, or receiving genuine recognition and appreciation. The mind needs room to shine — emotional wellbeing comes through creative expression and the warmth of being truly seen by those you love.',
  Virgo:       'Your Chandra in Virgo brings a precise, discerning, and service-oriented quality to your emotional world. The mind is analytical, attentive to detail, and finds peace through order and useful work. Emotional security comes through having clear systems, feeling genuinely competent, and being of real service — the mind is happiest when it has a problem worth solving well.',
  Libra:       'Your Chandra in Libra creates a mind that is harmonious, relational, and oriented toward beauty and balance. Emotional peace depends significantly on the quality of your relationships — you feel most yourself in partnership and most unsettled by conflict or ugliness. There is a natural refinement and diplomatic grace in how your feelings move through you.',
  Scorpio:     'Your Chandra in Scorpio — the sign of its debilitation — creates an intensely feeling, penetrating, and psychologically deep inner world. Emotions run very deep and are not easily or quickly shared. The mind encounters the full spectrum of human experience — including its darkest and most transformative dimensions — with unusual directness and unflinching clarity.',
  Sagittarius: 'Your Chandra in Sagittarius gives your emotional life an optimistic, expansive, and philosophically inclined quality. The mind naturally reaches for meaning — you feel most emotionally alive when learning, traveling, or engaging with ideas that matter. Emotional wellbeing comes through freedom, adventure, and the sense that life is genuinely moving toward something worth understanding.',
  Capricorn:   'Your Chandra in Capricorn brings a measured, self-contained, and deeply serious quality to the emotional world. Feelings are real but rarely displayed freely — the mind is more at ease with structure and responsibility than with open emotional vulnerability. Security comes through competence, a degree of control, and the quiet satisfaction of doing genuinely difficult things well.',
  Aquarius:    'Your Chandra in Aquarius creates a mind that is cool, original, and emotionally oriented toward the collective rather than the purely personal. You care deeply — but often at a certain distance, for humanity as much as for individuals. The mind is independent and inventive, most comfortable when it has the freedom to think and connect entirely on its own terms.',
  Pisces:      'Your Chandra in Pisces gives your emotional world a deeply compassionate, intuitive, and spiritually permeable quality. The boundaries between self and other are genuinely thin — you absorb the emotional atmosphere around you with extraordinary sensitivity. Emotional peace comes through creative solitude, spiritual practice, and the patient honoring of your own immense and complex feeling world.',
};

const VEDIC_PLANET_SIGN_TEMPLATE = {
  Mars:    (sign, q) => `Your Mangala (Mars) in ${sign} gives your drive and life force a ${q.themes} quality. Your energy moves most powerfully through the domain of ${q.domain} — this is how you act, pursue, and assert yourself in the world. Mars in this sign gives your ambition and courage the signature of ${sign}: what you fight for and how you fight for it carries this distinct quality.`,
  Mercury: (sign, q) => `Your Budha (Mercury) in ${sign} gives your mind a ${q.themes} quality. Your intellect is most alive when engaging with the domain of ${q.domain}. In Jyotish, Mercury governs commerce, communication, and discrimination — in ${sign}, these faculties are flavored by ${sign}'s qualities, shaping both how your mind works and how your words naturally land.`,
  Jupiter: (sign, q) => `Your Guru (Jupiter) in ${sign} expands you through the domain of ${q.domain}. The abundance and wisdom that Jupiter offers flows most readily when you are engaged with what ${sign} values: being ${q.themes}. This is where your natural grace and growth live — a placement that, when consciously engaged, opens genuine doors.`,
  Venus:   (sign, q) => `Your Shukra (Venus) in ${sign} brings a ${q.themes} quality to love, beauty, and desire. In the domain of ${q.domain}, your heart opens most fully. In Jyotish, Venus governs marriage, luxury, and artistic sense — in ${sign}, these are expressed through the lens of ${q.themes}, shaping the texture of your relationships and what you find most genuinely beautiful.`,
  Saturn:  (sign, q) => `Your Shani (Saturn) in ${sign} places your most important karmic lessons and your greatest eventual mastery in the domain of ${q.domain}. Saturn asks you to go slowly, carefully, and to build something real through the ${q.themes} qualities of ${sign}. This is the domain of your long, patient work — where sustained effort yields the most enduring and unshakeable strength.`,
  Rahu:    (sign, q) => `Your Rahu in ${sign} places the soul's deepest hunger and evolutionary pull in the domain of ${q.domain}. Rahu obsesses over what ${sign} values — the ${q.themes} quality becomes both your greatest longing and your most disorienting fascination. This is what you are being pulled toward in this incarnation: not easily, not without confusion, but with an intensity that cannot ultimately be ignored.`,
  Ketu:    (sign, q) => `Your Ketu in ${sign} marks the domain of ${q.domain} as an area of deep past-life mastery — and present-life ambivalence. The ${q.themes} qualities of ${sign} are deeply familiar to your soul, which is precisely why you may feel both gifted and strangely detached here. Ketu in ${sign} brings natural ability without the usual hunger — and often the invitation to release attachment to this domain as a source of identity.`,
};

const VEDIC_DIGNITY_CTX = {
  exalted:      p => `${p} is exalted here — at the absolute peak of its Jyotish strength — able to deliver its highest gifts with remarkable ease and clarity.`,
  own:          p => `In its own sign, ${p} is especially strong and completely at home — its qualities express cleanly, with natural authority and without distortion.`,
  own_sign:     p => `In its own sign, ${p} is especially strong and completely at home — its qualities express cleanly, with natural authority and without distortion.`,
  moolatrikona: p => `In its moolatrikona position, ${p} occupies an elevated and auspicious dignity — stable, powerful, and reliably able to give its full results.`,
  friendly:     p => `${p} is in a friendly sign, giving it good support and producing reasonably strong, cooperative results throughout the areas it governs.`,
  neutral:      p => `${p} is in a neutral sign — neither especially aided nor impeded — its results depending primarily on the supporting factors of the broader chart.`,
  enemy:        p => `${p} is in an enemy sign, which introduces friction and complexity. Results come, but often through navigating additional layers of challenge before they arrive.`,
  debilitated:  p => `${p} is in the sign of its debilitation — its most challenged Jyotish position. In traditional Jyotish, debilitation is the forge: difficulty becomes the teacher, and what eventually emerges is often a strength that could not have been earned any other way.`,
};

const VEDIC_HOUSE_PLANET_CTX = {
  1:  p => `Placed in the first house — the house of self and body — ${p} colors your entire personality and physical vitality. This is one of the most potent placements: it marks the whole chart.`,
  2:  p => `In the second house, ${p} strongly influences your relationship with wealth, family, and speech — the immediate foundations of material and relational life.`,
  3:  p => `In the third house, ${p} energizes your personal courage, communication, and the quality of your sustained self-directed effort. Siblings may also be colored by this energy.`,
  4:  p => `In the fourth house, ${p} shapes your home, your inner life, and your relationship with your mother — the roots from which your sense of security grows.`,
  5:  p => `In the fifth house — a powerful trikona — ${p} influences your children, creative intelligence, romantic life, and the accumulated merit of your past actions.`,
  6:  p => `In the sixth house, ${p} engages with health, service, and the overcoming of opposition. This can be a powerful placement for defeating obstacles when the planet is strong.`,
  7:  p => `In the seventh house, ${p} directly colors your marriage, partnerships, and how you appear to and engage with the world at large.`,
  8:  p => `In the eighth house, ${p} touches the domain of transformation, hidden knowledge, longevity, and sudden change — deep and intense territory.`,
  9:  p => `In the ninth house — the most auspicious house — ${p} blesses your dharma, fortune, relationship with teachers and the father, and the philosophical path that gives life meaning.`,
  10: p => `In the tenth house, ${p} directly shapes your career, public status, and the professional actions for which you become known. This is a highly visible and powerful placement.`,
  11: p => `In the eleventh house — the house of gain — ${p} influences income, the fulfillment of aspirations, influential friendships, and the realization of your most important goals.`,
  12: p => `In the twelfth house, ${p} governs your relationship with solitude, spiritual practice, foreign lands, expenses, and the eventual liberation of the soul from material attachment.`,
};

function vedicPlanetBody(p) {
  const planet  = p.celestialBody;
  const sign    = p.sign;
  const house   = p.houseNumber ?? p.house;
  const nak     = p.nakshatra;
  const dig     = p.dignities?.dignity?.toLowerCase();
  const isNode  = planet === 'Rahu' || planet === 'Ketu';
  const isRx    = !isNode && p.motion_type === 'retrograde';
  const nakD    = NAKSHATRA_DATA.find(n => n.name === nak);
  const signQ   = SIGN_Q[sign];
  const hCtx    = VEDIC_HOUSE_PLANET_CTX[house];
  const digNorm = dig === 'own_sign' ? 'own' : dig;

  // ── Sign body
  let signBody = '';
  if (planet === 'Sun')  signBody = VEDIC_SUN_IN_SIGN[sign]  ?? VEDIC_PLANET_DESC.Sun.body;
  else if (planet === 'Moon') signBody = VEDIC_MOON_IN_SIGN[sign] ?? VEDIC_PLANET_DESC.Moon.body;
  else if (signQ && VEDIC_PLANET_SIGN_TEMPLATE[planet]) {
    signBody = VEDIC_PLANET_SIGN_TEMPLATE[planet](sign, signQ);
  } else {
    signBody = VEDIC_PLANET_DESC[planet]?.body ?? '';
  }

  // ── House context
  const houseBody = hCtx ? hCtx(planet) : '';

  // ── Dignity
  const digBody = digNorm && VEDIC_DIGNITY_CTX[digNorm] ? VEDIC_DIGNITY_CTX[digNorm](planet) : '';

  // ── Retrograde
  const rxBody = isRx ? `${planet} moves retrograde here — internalizing its energy, slowing its outward delivery, and often producing a more reflective, subtle, and ultimately deeper expression of its themes.` : '';

  // ── Nakshatra
  const nakBody = nak && nakD
    ? `Moving through ${nakD.symbol} ${nak} (pada ${p.pada ?? '—'}), ruled by ${nakD.lord} — ${NAKSHATRA_DESC[nak]?.split('.')[0] ?? ''}. This nakshatra colors the specific texture and expression of ${planet}'s placement.`
    : '';

  return [signBody, houseBody, digBody || rxBody, nakBody].filter(Boolean).join('\n\n');
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
  const [hdIntroOpen,  setHdIntroOpen]  = useState(false);
  const [today] = useState(() => new Date().toISOString().slice(0,10));
  const [vedicMode,    setVedicMode]    = useState('western');
  const [vedicData,    setVedicData]    = useState(null);
  const [vedicLoading, setVedicLoading] = useState(false);
  const [vedicTab,     setVedicTab]     = useState('rasi');
  const vedicFetchedRef = useRef(false);

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

  useEffect(() => {
    if (vedicMode !== 'vedic') return;
    if (vedicFetchedRef.current) return;
    if (!birthData?.date || !birthData?.time || birthData?.birthLat == null) return;
    vedicFetchedRef.current = true;
    setVedicLoading(true);
    fetch('/api/vedic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthDate:      birthData.date,
        birthTime:      birthData.time,
        timezoneOffset: birthData.utcOffset ?? 0,
        latitude:       birthData.birthLat,
        longitude:      birthData.birthLon,
        name:           displayName,
        locationName:   birthData.birthPlace ?? '',
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(data => { setVedicData(data); setVedicLoading(false); });
  }, [vedicMode, birthData, displayName]);

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

    // Natal aspects — major first, then minor
    const MAJOR_NAMES = new Set(['Conjunction','Sextile','Square','Trine','Opposition']);
    const MINOR_NAMES = new Set(['Semisextile','Semisquare','Sesquiquadrate','Quincunx']);
    const majorAspects = natalAspects.filter(a => MAJOR_NAMES.has(a.name));
    const minorAspects = natalAspects.filter(a => MINOR_NAMES.has(a.name));
    if (majorAspects.length > 0) {
      lines.push('');
      lines.push('## Major Natal Aspects');
      lines.push('(Conjunctions/Trines/Sextiles = flowing; Squares/Oppositions = tension/growth challenge)');
      for (const a of majorAspects) {
        lines.push(`${PLANET_LBL[a.planet1] ?? a.planet1} ${a.symbol} ${PLANET_LBL[a.planet2] ?? a.planet2} (${a.name}, orb ${a.orb}°)`);
      }
    }
    if (minorAspects.length > 0) {
      lines.push('');
      lines.push('## Minor Natal Aspects');
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
    {id:'synthesis',  label:'Synthesis'},
    {id:'transits',   label:'Affecting You Now'},
  ];
  const VEDIC_TABS = [
    {id:'rasi',     label:'Rasi Chart'},
    {id:'panchanga',label:'Panchanga'},
    {id:'dashas',   label:'Dashas'},
    {id:'varga',    label:'Varga'},
    {id:'strength', label:'Strength'},
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

      {/* ── Western / Vedic toggle ── */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-white/50 border border-white/40 rounded-full p-1">
          <button
            onClick={() => setVedicMode('western')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${vedicMode==='western'?'btn-gradient text-white shadow-sm':'text-gray-500 hover:text-gray-700'}`}
          >Western</button>
          <button
            onClick={() => setVedicMode('vedic')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${vedicMode==='vedic'?'btn-gradient text-white shadow-sm':'text-gray-500 hover:text-gray-700'}`}
          >Vedic ✦</button>
        </div>
        {vedicMode==='vedic' && (
          <span className="text-xs text-gray-400">Sidereal · JPL DE421 · Lahiri ayanamsha</span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(vedicMode==='western' ? TABS : VEDIC_TABS).map(t => (
          <button key={t.id} onClick={()=> vedicMode==='western' ? setTab(t.id) : setVedicTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${(vedicMode==='western'?tab:vedicTab)===t.id?'btn-gradient text-white shadow-sm':'bg-white/60 text-gray-500 border border-white/50 hover:bg-white/80'}`}>
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
              <div className="flex items-center justify-between pt-1 gap-2">
                {chatSaved ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-200/50">✓ Saved to journal</span>
                    <a
                      href="/journal"
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/60 text-violet-500 border border-violet-200/50 hover:bg-violet-50 transition-all"
                    >View →</a>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
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
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/60 text-gray-500 border border-white/50 hover:bg-white/80 hover:text-violet-500 transition-all"
                  >
                    ↓ Save to journal
                  </button>
                )}
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
      {vedicMode === 'western' && tab === 'overview' && (
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
      {vedicMode === 'western' && tab === 'astrology' && (
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
      {vedicMode === 'western' && tab === 'hd' && (
        <div className="space-y-4">

          {/* ── What is Human Design? ── */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <button
              onClick={() => setHdIntroOpen(o => !o)}
              className="w-full flex items-center justify-between px-6 py-5 text-left"
            >
              <div>
                <h2 className="font-playfair text-xl text-gray-700">What is Human Design?</h2>
                <p className="text-xs text-gray-400 mt-0.5">A beginner's guide to the system</p>
              </div>
              <span className="text-gray-300 text-xl leading-none ml-4">{hdIntroOpen ? '−' : '+'}</span>
            </button>

            {hdIntroOpen && (
              <div className="px-6 pb-6 space-y-6 border-t border-white/40 pt-5">

                {/* Intro */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Human Design is a system for understanding how you are uniquely wired — energetically, mentally, and emotionally. It was synthesized in 1987 by Ra Uru Hu, who described receiving a mystical transmission that wove together four ancient traditions: the <strong className="text-gray-700">I Ching</strong>, <strong className="text-gray-700">Kabbalah</strong>, <strong className="text-gray-700">Hindu chakras</strong>, and <strong className="text-gray-700">Western astrology</strong>.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your chart is calculated from your exact birth date, time, and location. The positions of the planets at the moment of your birth — and again 88 days before your birth (your unconscious "Design" imprint) — are mapped onto a <strong className="text-gray-700">Body Graph</strong>: a diagram of 9 energy centers, 64 gates, and 36 channels that describes how your energy flows and where it is consistent or open to influence.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Human Design is not about prediction. It is about recognition — understanding your natural way of operating so you can make decisions from a place of alignment rather than conditioning. The two most important things in your chart are your <strong className="text-gray-700">Type</strong> (how your energy works) and your <strong className="text-gray-700">Authority</strong> (how to make decisions that are correct for you).
                  </p>
                </div>

                {/* The 5 Types */}
                <div className="space-y-3">
                  <h3 className="font-playfair text-base text-gray-700">The 5 Energy Types</h3>
                  <p className="text-xs text-gray-400">Tap any type to learn more.</p>
                  <div className="space-y-2">
                    {[
                      { key: 'generator',             label: 'Generator',             pct: '37%', strategy: 'Wait to respond',           icon: '⚡', color: 'from-amber-50 to-yellow-50',   border: 'border-amber-200/60',  pill: 'bg-amber-100 text-amber-700' },
                      { key: 'manifesting-generator', label: 'Manifesting Generator', pct: '33%', strategy: 'Respond, then inform',        icon: '🔥', color: 'from-orange-50 to-amber-50', border: 'border-orange-200/60', pill: 'bg-orange-100 text-orange-700' },
                      { key: 'projector',             label: 'Projector',             pct: '20%', strategy: 'Wait for the invitation',     icon: '🔭', color: 'from-blue-50 to-indigo-50',  border: 'border-blue-200/60',   pill: 'bg-blue-100 text-blue-700' },
                      { key: 'manifestor',            label: 'Manifestor',            pct: '9%',  strategy: 'Inform before acting',        icon: '🌊', color: 'from-rose-50 to-pink-50',    border: 'border-rose-200/60',   pill: 'bg-rose-100 text-rose-700' },
                      { key: 'reflector',             label: 'Reflector',             pct: '1%',  strategy: 'Wait a lunar cycle (29 days)', icon: '🌙', color: 'from-violet-50 to-purple-50', border: 'border-violet-200/60', pill: 'bg-violet-100 text-violet-700' },
                    ].map(t => (
                      <button key={t.key}
                        onClick={() => setDetail({ title: t.label, subtitle: 'Human Design Type · ' + t.pct + ' of people', body: HD_TYPE[t.key] ?? '' })}
                        className={`w-full bg-gradient-to-r ${t.color} border ${t.border} rounded-2xl p-4 text-left hover:brightness-[0.97] transition-all active:scale-[0.99]`}>
                        <div className="flex items-start gap-3">
                          <span className="text-xl mt-0.5">{t.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-700">{t.label}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.pill}`}>{t.pct}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Strategy: {t.strategy}</p>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mt-1 shrink-0"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key concepts */}
                <div className="space-y-3">
                  <h3 className="font-playfair text-base text-gray-700">Key Concepts</h3>
                  <div className="space-y-2">
                    {[
                      {
                        label: 'Strategy',
                        body: 'Your Strategy is the practical guidance for how to move through life in a way that creates the least resistance. It is specific to your Type. Generators and Manifesting Generators wait to respond to life before committing. Projectors wait for a genuine invitation before sharing their gifts. Manifestors inform those in their field before taking action. Reflectors wait a full lunar cycle before major decisions. Following your Strategy consistently is the foundation of a life that feels right.',
                      },
                      {
                        label: 'Authority',
                        body: 'Your Authority is the specific inner guidance system you should use when making decisions — especially important ones. Logic, advice from others, and analysis are not your Authority. Your Authority lives in your body: it may be a gut response (Sacral), an emotional wave that needs time (Emotional), a quiet instinctive knowing (Splenic), or something else entirely. When you make decisions from your Authority rather than your mind, you align with what is actually correct for you.',
                      },
                      {
                        label: 'Profile',
                        body: 'Your Profile is a pair of numbers (like 2/4 or 6/2) derived from the lines of your Personality and Design Sun gates. It describes the archetypal role you are here to play in this lifetime — the costume your Type wears. Line 1 is the Investigator; Line 2, the Hermit; Line 3, the Martyr; Line 4, the Opportunist; Line 5, the Heretic; Line 6, the Role Model. The first number describes your conscious, recognizable self — the second describes the deeper unconscious layer that others often see more clearly than you do.',
                      },
                      {
                        label: 'Defined vs. Open Centers',
                        body: 'The 9 energy centers in your Body Graph are either Defined (colored in) or Open (white). Defined centers have consistent, reliable energy — they are the fixed parts of who you are. Open centers are not broken or missing something; they are where you receive, amplify, and learn from the energy of others. Open centers are also where you are most susceptible to conditioning — to taking on the energy of your environment and believing it is your own. Understanding which centers are open is one of the most liberating things Human Design offers.',
                      },
                      {
                        label: 'Gates & Channels',
                        body: 'The 64 gates in Human Design correspond to the 64 hexagrams of the I Ching. Each gate represents a specific energetic quality or gift. When a gate in one center connects to a gate in an adjacent center, it forms a Channel — a fully active energy circuit. Defined Channels are the consistent, reliable energies you carry with you everywhere. They are neither better nor worse than open channels; they simply describe where your energy is always "on." Your gate activations come from the planetary positions at your birth (Personality) and 88 days prior (Design).',
                      },
                    ].map(({ label, body }) => (
                      <button key={label}
                        onClick={() => setDetail({ title: label, subtitle: 'Human Design · Key Concept', body })}
                        className="w-full bg-white/50 rounded-2xl p-4 border border-white/40 text-left hover:bg-white/70 transition-colors active:scale-[0.99] flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* How to read your chart */}
                <div className="space-y-3">
                  <h3 className="font-playfair text-base text-gray-700">How to read your chart</h3>
                  <div className="space-y-2">
                    {[
                      { step: '1', title: 'Find your Type', desc: 'Your Type tells you how your aura interacts with the world and gives you your Strategy — the most important thing to experiment with first.' },
                      { step: '2', title: 'Follow your Strategy', desc: 'Before anything else, experiment with your Strategy for 90 days. Notice how life responds when you wait to respond, wait for an invitation, or inform before acting.' },
                      { step: '3', title: 'Trust your Authority', desc: 'When facing a decision, stop going to your mind. Instead, go to the specific body intelligence your Authority points to — gut, emotional wave, splenic flash, or other.' },
                      { step: '4', title: 'Explore your Profile & Centers', desc: 'Once Strategy and Authority feel natural, dive deeper into your Profile, Defined Centers, and Channels to understand the consistent themes and gifts of your design.' },
                    ].map(({ step, title, desc }) => (
                      <div key={step} className="flex gap-3 p-3 bg-white/40 rounded-2xl border border-white/40">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-300 to-violet-300 text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">{step}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!hdData && (
                  <div className="bg-gradient-to-r from-rose-50 to-violet-50 border border-rose-100 rounded-2xl p-4 text-center space-y-2">
                    <p className="text-sm text-gray-600">Ready to see your personal chart?</p>
                    <a href="/profile" className="inline-block btn-gradient text-white text-sm font-medium px-5 py-2 rounded-full">Add birth details on Profile →</a>
                  </div>
                )}
              </div>
            )}
          </div>

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

              {hdData.definedChannels?.length > 0 && (
                <div className="glass-card rounded-3xl p-6 space-y-3">
                  <h2 className="font-playfair text-xl text-gray-700">Your Channels as a Whole</h2>
                  <p className="text-xs text-gray-400">
                    Your defined channels are the consistent energies you carry — they don&apos;t come and go. Seen together, they form the architecture of your gifts.
                  </p>
                  <div className="space-y-2">
                    {hdData.definedChannels.map(([g1, g2]) => {
                      const key  = `${g1}-${g2}`;
                      const name = CHANNEL_NAMES[key] ?? CHANNEL_NAMES[`${g2}-${g1}`] ?? `Channel ${g1}–${g2}`;
                      const [nameShort, nameLong] = name.split(' — ');
                      return (
                        <button key={key} onClick={() => openChannel([g1, g2])}
                          className="w-full flex items-start gap-3 p-3 rounded-2xl border bg-white/30 border-white/30 hover:bg-white/50 text-left transition-colors">
                          <div className="mt-1 w-2 h-2 rounded-full shrink-0 bg-[#b88a92] opacity-60" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500">{g1} — {g2} · {nameShort}</p>
                            {nameLong && <p className="text-sm text-gray-600 mt-0.5">{nameLong}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 pt-1">Tap any channel to read its full description.</p>
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
      {vedicMode === 'western' && tab === 'numerology' && (
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
              {birthdayNum && BIRTHDAY_NUM[birthdayNum] && (
                <button onClick={()=>setDetail({title:`Birthday Number ${birthdayNum} · ${BIRTHDAY_NUM[birthdayNum].title}`,subtitle:'The gifts you were born with',body:BIRTHDAY_NUM[birthdayNum].desc})}
                  className="w-full bg-white/50 rounded-2xl p-4 border border-white/40 text-left hover:bg-white/70 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Birthday Number</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{BIRTHDAY_NUM[birthdayNum].title}</p>
                      <p className="text-xs text-gray-400">The gifts you were born with</p>
                    </div>
                    <NumBadge n={birthdayNum} sm />
                  </div>
                </button>
              )}
              {expressNum && EXPRESSION_NUM[expressNum] && (
                <button onClick={()=>setDetail({title:`Expression Number ${expressNum} · ${EXPRESSION_NUM[expressNum].title}`,subtitle:'Based on your display name',body:EXPRESSION_NUM[expressNum].desc})}
                  className="w-full bg-white/50 rounded-2xl p-4 border border-white/40 text-left hover:bg-white/70 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Expression Number</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{EXPRESSION_NUM[expressNum].title}</p>
                      <p className="text-xs text-gray-400">Based on your display name</p>
                    </div>
                    <NumBadge n={expressNum} sm />
                  </div>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ════ SYNTHESIS ════ */}
      {vedicMode === 'western' && tab === 'synthesis' && (
        <div className="space-y-4">
          {hdData && lifePath && sunSign ? (() => {
            // ── helpers ──────────────────────────────────────────────────────
            const elDesc = {
              fire:  'radiant, initiating vitality that moves before it thinks',
              earth: 'grounded, embodying steadiness that builds before it speaks',
              air:   'connecting, articulating intelligence that understands before it feels',
              water: 'feeling, receptive depth that knows before it sees',
            };
            const typeGift = {
              'generator':             'life force that is activated through response',
              'manifesting-generator': 'multi-passionate life force that responds and then moves fast',
              'projector':             'penetrating wisdom that sees others more clearly than they see themselves',
              'manifestor':            'initiating force that impacts simply by moving through the world',
              'reflector':             'lunar mirror that reflects the health and truth of its environment',
            };
            const typeStrategy = {
              'generator':             (lp) => `As a Generator in a Personal Year ${lp}, the year\'s themes will show up as things that either light up your sacral or leave it flat — trust the gut yes and let it filter everything the year brings.`,
              'manifesting-generator': (lp) => `As a Manifesting Generator in a Personal Year ${lp}, respond first — then move at your own pace. This year\'s energy is yours to multitask and make your own.`,
              'projector':             (lp) => `As a Projector in a Personal Year ${lp}, this year\'s gifts arrive through recognition and invitation — watch for the specific people who call you into the year\'s themes.`,
              'manifestor':            (lp) => `As a Manifestor in a Personal Year ${lp}, you have a clear field to initiate into — inform those around you as you move, and watch what you set in motion now.`,
              'reflector':             (lp) => `As a Reflector in a Personal Year ${lp}, sample this year\'s themes across each 29-day lunar cycle before committing — you\'ll sense its truth differently as the moon moves through each gate.`,
            };
            const lpSoulThread = lifePath <= 3
              ? 'emergence, authentic expression, and the courage to take up space'
              : lifePath <= 6
              ? 'building lasting foundations, serving with devotion, and learning to love fully'
              : lifePath <= 9
              ? 'deep seeking, releasing what no longer belongs, and wisdom earned through experience'
              : 'mastery, spiritual mission, and service at the level of the collective';
            const moonAuthority = (() => {
              if (hdData.authority === 'emotional') return `Your ${moonSign?.name ?? ''} moon and Emotional Authority share the same teacher: time. Both ask you to feel the full arc before acting — the wave, not the peak.`;
              if (hdData.authority === 'sacral')    return `Your ${moonSign?.name ?? ''} moon colors the emotional texture of your experience, but your Sacral Authority grounds your decisions in something even more immediate — the body\'s instant yes or no.`;
              if (hdData.authority === 'splenic')   return `Your ${moonSign?.name ?? ''} moon gives your inner world richness and depth; your Splenic Authority adds a quiet, first-moment knowing that speaks underneath the feelings — one voice, one time, always in the now.`;
              return `Your ${moonSign?.name ?? ''} moon shapes what you feel; your ${hdData.authority} authority shapes how you decide. The invitation is to let the feeling inform, and the authority guide.`;
            })();
            const sunTypeBody = (() => {
              const el = sunSign.element;
              if (hdData.type === 'generator' || hdData.type === 'manifesting-generator') {
                return el === 'fire'  ? `Your ${sunSign.name} fire and Generator sacral are a powerful pairing — both want to burn, but the sacral\'s yes is what gives the flame its direction. When your gut lights up, you move with a force that\'s hard to ignore.`
                  : el === 'earth' ? `Your ${sunSign.name} groundedness and Generator design create a potent steadiness — you respond with the body and follow through with consistency. You build things that last.`
                  : el === 'air'   ? `Your ${sunSign.name} mind is brilliant at seeing what to respond to. The challenge — and the gift — is letting the sacral\'s embodied yes confirm what the mind already suspects.`
                  : `Your ${sunSign.name} sensitivity makes your sacral responses even more nuanced — you feel the yes in your whole body, not just your gut. That depth of response is a gift.`;
              }
              if (hdData.type === 'projector') {
                return el === 'fire'  ? `Your ${sunSign.name} fire gives your Projector perception an inspired, visionary edge — you don\'t just see others clearly, you see what they could become. The art is waiting for the invitation before sharing that vision.`
                  : el === 'earth' ? `Your ${sunSign.name} groundedness gives your Projector guidance a practical, embodied quality — your insights land because they are both penetrating and real.`
                  : el === 'air'   ? `Your ${sunSign.name} mind and Projector perception are a natural pair — you process, connect, and articulate what others cannot yet see in themselves.`
                  : `Your ${sunSign.name} empathy deepens your Projector sight — you guide others not just from observation, but from genuine feeling for who they are.`;
              }
              if (hdData.type === 'manifestor') {
                return `Your ${sunSign.name} ${el} energy is the fuel behind your Manifestor impact. You initiate with ${el === 'fire' ? 'radiant force' : el === 'earth' ? 'grounded conviction' : el === 'air' ? 'clear vision' : 'felt knowing'} — inform those around you before you move, and your impact flows without resistance.`;
              }
              return `The ${el} ${sunSign.modality} energy of ${sunSign.name} moves through your ${hdData.type.replace(/-/g, ' ')} design in a way that is entirely your own — ${elDesc[el]}, expressed through a ${hdData.profile} life story.`;
            })();
            const lpProfileBody = (() => {
              const p1name = PROFILE[hdData.profileLine1]?.split(' — ')[0] ?? `Line ${hdData.profileLine1}`;
              const p2name = PROFILE[hdData.profileLine2]?.split(' — ')[0] ?? `Line ${hdData.profileLine2}`;
              const lpTitle = LIFE_PATH[lifePath]?.title ?? `Life Path ${lifePath}`;
              return `Your Life Path ${lifePath} — ${lpTitle} — is the soul-level thread woven through every chapter of your life. Your ${hdData.profile} Profile (${p1name} / ${p2name}) is the story structure through which that thread expresses itself: ${p1name.toLowerCase()} meets ${p2name.toLowerCase()}, creating a life arc shaped by ${lpSoulThread}.`;
            })();

            return (
              <>
                {/* ── Soul Signature banner ── */}
                <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4" style={{ borderLeft: '3px solid #b88a92' }}>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Your Soul Signature</p>
                    <h2 className="font-playfair text-2xl text-gray-700">
                      {cap(hdData.type.replace(/-/g, ' '))} · {sunSign.name} Sun · Life Path {lifePath}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    You carry a <span className="font-medium text-gray-700">{typeGift[hdData.type] ?? hdData.type}</span>, fueled by{' '}
                    <span className="font-medium text-gray-700">{sunSign.name} {sunSign.element} energy</span> — {elDesc[sunSign.element]}.{' '}
                    Threaded through everything is a <span className="font-medium text-gray-700">Life Path {lifePath}</span> calling toward {lpSoulThread}.{' '}
                    Your <span className="font-medium text-gray-700">{hdData.profile} Profile</span> is the story structure through which all of it moves into the world.
                  </p>
                  {expressNum && (
                    <p className="text-xs text-gray-400 leading-relaxed border-t border-white/40 pt-3">
                      Expression Number {expressNum} — <span className="text-gray-500">{EXPRESSION_NUM[expressNum]?.title}</span> — is the voice through which all of this reaches others.
                    </p>
                  )}
                </div>

                {/* ── Pairwise cards ── */}
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <h2 className="font-playfair text-xl text-gray-700">Cross-System Synthesis</h2>
                  <p className="text-xs text-gray-400">Where your astrology, numerology, and Human Design weave together.</p>
                  <div className="space-y-3">

                    <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Sun Sign + HD Type</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{sunTypeBody}</p>
                    </div>

                    {moonSign && (
                      <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Moon Sign + Authority</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{moonAuthority}</p>
                      </div>
                    )}

                    <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Life Path {lifePath} + {hdData.profile} Profile</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{lpProfileBody}</p>
                    </div>

                    {personalYr && (
                      <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Personal Year {personalYr} + Your Strategy</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          You are in a Personal Year {personalYr} — <span className="italic">{PERSONAL_YEAR[personalYr]}</span>{' '}
                          {(typeStrategy[hdData.type] ?? typeStrategy['generator'])(personalYr)}
                        </p>
                      </div>
                    )}

                    {expressNum && (
                      <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Expression {expressNum} + {hdData.profile} Profile</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Your Expression Number {expressNum} — <span className="font-medium text-gray-700">{EXPRESSION_NUM[expressNum]?.title}</span> — describes the natural mode through which your gifts move into the world.{' '}
                          Your {hdData.profile} Profile shapes the life story through which that expression travels.{' '}
                          {EXPRESSION_NUM[expressNum]?.desc.split('. ')[0]}. The {hdData.profileLine1}/{hdData.profileLine2} adds the arc: {(PROFILE[hdData.profileLine1] ?? '').split(' — ')[1]?.split('.')[0]?.toLowerCase()}.
                        </p>
                      </div>
                    )}

                    {birthdayNum && (
                      <div className="bg-white/50 rounded-2xl p-4 border border-white/40 space-y-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Birthday Number {birthdayNum} + Authority</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Your Birthday Number {birthdayNum} — <span className="font-medium text-gray-700">{BIRTHDAY_NUM[birthdayNum]?.title}</span> — marks a specific gift you arrived with at birth.{' '}
                          Paired with your {hdData.authority} authority, this gift is most alive when you honor how you are designed to decide:{' '}
                          {hdData.authority === 'emotional' ? 'waiting for emotional clarity before you act with it'
                            : hdData.authority === 'sacral'  ? 'trusting the gut yes that arises when this gift is truly called for'
                            : hdData.authority === 'splenic' ? 'following the quiet in-the-moment knowing of when to deploy it'
                            : 'letting dialogue and discernment reveal when and how to share it'}.
                        </p>
                      </div>
                    )}

                  </div>
                </div>

                {/* ── You in Relationships ── */}
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <h2 className="font-playfair text-xl text-gray-700">You in Relationships</h2>
                  <p className="text-xs text-gray-400">How your astrology, HD, and numerology shape your love life.</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {(() => {
                      const venusSign = natalLons.venus != null ? lonToSign(natalLons.venus) : null;
                      const marsSign  = natalLons.mars  != null ? lonToSign(natalLons.mars)  : null;
                      const venusLine = venusSign ? `Venus in ${venusSign.name} shapes how you love — ${SIGN_Q[venusSign.name]?.themes ?? 'deeply'} in your affections, drawn to ${SIGN_Q[venusSign.name]?.domain ?? 'connection'}.` : '';
                      const marsLine  = marsSign  ? `Mars in ${marsSign.name} drives your desire — you pursue what you want with a ${SIGN_Q[marsSign.name]?.themes ?? 'direct'} force.` : '';
                      const modNote = sunSign.modality === 'cardinal' ? `${sunSign.name} is cardinal — you initiate in love, often being the one to make the first move or redefine the dynamic.`
                        : sunSign.modality === 'fixed' ? `${sunSign.name} is fixed — once you commit, you commit deeply, and loyalty is non-negotiable.`
                        : `${sunSign.name} is mutable — you adapt to your partner and thrive when love has room to evolve.`;
                      const moonLine = moonSign ? `Your ${moonSign.name} moon needs ${SIGN_Q[moonSign.name]?.domain ?? 'emotional depth'} to feel safe in partnership.` : '';
                      const authLine = hdData.authority === 'emotional' ? 'With Emotional Authority, never commit at the peak or the trough — clarity lives in the middle of the wave.'
                        : hdData.authority === 'sacral' ? 'Your Sacral Authority is your compass — a lit-up gut response means yes; a flat one means no, regardless of logic.'
                        : hdData.authority === 'splenic' ? 'Splenic Authority gives you one quiet hit about who is safe for you — trust it the first time.'
                        : `Your ${hdData.authority} authority reveals your truth about a relationship through conversation — listen to what you hear yourself say.`;
                      const spDefined = hdData.centers?.SolarPlexus;
                      const emoteLine = spDefined ? 'Your defined Solar Plexus means you ride your own emotional wave in relationships — your partner feels your moods, not the other way around.' : 'Your open Solar Plexus absorbs your partner\'s emotions — learning what\'s yours vs. theirs is essential.';
                      const profileRelate = hdData.profileLine1 === 1 ? 'The 1-line in you wants to research the relationship before fully committing.'
                        : hdData.profileLine1 === 2 ? 'Your 2-line needs alone time — the right partner respects your withdrawals without taking them personally.'
                        : hdData.profileLine1 === 3 ? 'Your 3-line learns love through trial and experience — each bond teaches you something irreplaceable.'
                        : hdData.profileLine1 === 4 ? 'Your 4-line finds love through existing connections — your network holds the key.'
                        : hdData.profileLine1 === 5 ? 'Others project ideals onto your 5-line — the right partner sees you, not a savior.'
                        : 'Your 6-line deepens in love with time — relationships get richer after you stop experimenting and start modeling.';
                      const lpRelate = lifePath === 2 ? 'Life Path 2 is the natural partner — relationships are your classroom and your calling.'
                        : lifePath === 4 ? 'Life Path 4 builds lasting foundations in love — you need reliability and shared commitment.'
                        : lifePath === 6 ? 'Life Path 6 is the nurturer — you give deeply and must learn to receive equally.'
                        : '';
                      return [venusLine, marsLine, modNote, moonLine, authLine, emoteLine, profileRelate, lpRelate].filter(Boolean).join(' ');
                    })()}
                  </p>
                </div>

                {/* ── You at Work ── */}
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <h2 className="font-playfair text-xl text-gray-700">You at Work</h2>
                  <p className="text-xs text-gray-400">Your professional design across all three systems.</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {(() => {
                      const mcSign   = hdData.houses?.mc != null ? lonToSign(hdData.houses.mc) : null;
                      const mercSign = natalLons.mercury != null ? lonToSign(natalLons.mercury) : null;
                      const satSign  = natalLons.saturn  != null ? lonToSign(natalLons.saturn)  : null;
                      const workStyle = hdData.type === 'generator' ? 'As a Generator, your work thrives through response — the sacral lights up for what\'s correct and goes flat for what isn\'t.'
                        : hdData.type === 'manifesting-generator' ? 'As a Manifesting Generator, you multitask and move fast — follow what excites you, skip steps that bore you, and trust the non-linear path.'
                        : hdData.type === 'projector' ? 'As a Projector, your genius is guiding others\' energy — wait for recognition and invitation into the roles where your insight is truly valued.'
                        : hdData.type === 'manifestor' ? 'As a Manifestor, you initiate — your career flourishes when you have freedom to start things and inform those around you as you move.'
                        : 'As a Reflector, you mirror your work environment — in the right place with the right people, your assessment ability is unmatched.';
                      const sacralDef = hdData.centers?.Sacral;
                      const throatDef = hdData.centers?.Throat;
                      const centerLine = (sacralDef ? 'Your defined Sacral gives you consistent workforce energy — you can sustain effort when the work is correct.' : 'Your open Sacral means you amplify others\' energy; honor your own limits and don\'t overwork to keep up.')
                        + ' ' + (throatDef ? 'A defined Throat gives you a reliable voice — you can manifest and communicate consistently.' : 'Your open Throat finds its voice through timing; speak when recognized, not from pressure.');
                      const mcLine = mcSign ? `Your Midheaven in ${mcSign.name} points your public career toward ${SIGN_Q[mcSign.name]?.domain ?? 'contribution'} — this is the reputation you build over time.` : '';
                      const mercLine = mercSign ? `Mercury in ${mercSign.name} makes your professional communication ${SIGN_Q[mercSign.name]?.themes ?? 'sharp'}.` : '';
                      const satLine = satSign ? `Saturn in ${satSign.name} is where you build lasting mastery — the domain of ${SIGN_Q[satSign.name]?.domain ?? 'discipline'} asks for patient, sustained effort that pays off over decades.` : '';
                      const careerTheme = lifePath === 1 ? 'Life Path 1 drives you toward pioneering roles where you forge your own path.'
                        : lifePath === 2 ? 'Life Path 2 excels behind the scenes — partnership, mediation, and bringing people together.'
                        : lifePath === 3 ? 'Life Path 3 thrives where creative expression and your voice take center stage.'
                        : lifePath === 4 ? 'Life Path 4 builds systems and structures others depend on.'
                        : lifePath === 5 ? 'Life Path 5 needs variety — rigid roles drain you, dynamic careers keep you alive.'
                        : lifePath === 6 ? 'Life Path 6 fulfills through service — healing, teaching, and nurturing roles.'
                        : lifePath === 7 ? 'Life Path 7 pulls toward depth — research, analysis, and spiritual inquiry.'
                        : lifePath === 8 ? 'Life Path 8 is built for executive leadership, financial mastery, and large-scale impact.'
                        : lifePath === 9 ? 'Life Path 9 finds fulfillment through work that serves the collective.'
                        : `Life Path ${lifePath} carries a master frequency — work that channels higher purpose into tangible impact.`;
                      const expressVoice = expressNum ? `Expression ${expressNum} (${EXPRESSION_NUM[expressNum]?.title ?? ''}) is the voice through which all of this reaches colleagues and clients.` : '';
                      return [workStyle, centerLine, mcLine, mercLine, satLine, careerTheme, expressVoice].filter(Boolean).join(' ');
                    })()}
                  </p>
                </div>

                {/* ── First Impression ── */}
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <h2 className="font-playfair text-xl text-gray-700">First Impression</h2>
                  <p className="text-xs text-gray-400">What others sense before you say a word.</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {(() => {
                      const ascSign = hdData.houses?.asc != null ? lonToSign(hdData.houses.asc) : null;
                      const ascLine = ascSign ? `Your rising sign is ${ascSign.name} — before anyone knows your sun sign, they meet your ${ascSign.name} mask: ${SIGN_Q[ascSign.name]?.themes ?? 'distinctive'} energy in the domain of ${SIGN_Q[ascSign.name]?.domain ?? 'self-presentation'}.` : '';
                      const auraDesc = hdData.type === 'generator' || hdData.type === 'manifesting-generator'
                        ? `Your ${cap(hdData.type.replace(/-/g, ' '))} aura is open and enveloping — people feel drawn in by your life force before understanding why.`
                        : hdData.type === 'projector'
                        ? 'Your Projector aura is focused and penetrating — others feel deeply seen by you, sometimes before you\'ve spoken.'
                        : hdData.type === 'manifestor'
                        ? 'Your Manifestor aura pushes outward — others feel your impact before they understand its source.'
                        : 'Your Reflector aura samples and mirrors — people sense something shifting and unusual about you.';
                      const sunGate = hdData.personality?.sun?.gate;
                      const gateLine = sunGate ? `You consciously radiate Gate ${sunGate} — ${GATE_DESC[sunGate]?.[0] ?? ''} — the energy others most consistently feel coming from you.` : '';
                      const modLine = sunSign.modality === 'cardinal' ? `${sunSign.name}\'s cardinal quality gives your presence an initiating, take-charge feel.`
                        : sunSign.modality === 'fixed' ? `${sunSign.name}\'s fixed quality gives your presence a solid, unmovable steadiness.`
                        : `${sunSign.name}\'s mutable quality gives your presence an adaptive, fluid openness.`;
                      const p1perception = hdData.profileLine1 === 1 ? 'Your 1-line reads as grounded authority — people sense your depth of preparation.'
                        : hdData.profileLine1 === 2 ? 'Your 2-line reads as natural talent — others see gifts in you that you may not fully recognize.'
                        : hdData.profileLine1 === 3 ? 'Your 3-line reads as resilience — people sense someone who has been through things and emerged stronger.'
                        : hdData.profileLine1 === 4 ? 'Your 4-line reads as warm and connected — people feel instantly welcomed into your world.'
                        : hdData.profileLine1 === 5 ? 'Your 5-line reads as magnetic and heroic — others project solutions onto you before you speak.'
                        : 'Your 6-line reads as earned wisdom — people sense someone who has seen it all and carries that experience with grace.';
                      const expressLine = expressNum ? `Expression ${expressNum} (${EXPRESSION_NUM[expressNum]?.title ?? ''}) adds a specific tone to how your personality lands with others.` : '';
                      return [ascLine, auraDesc, gateLine, modLine, p1perception, expressLine].filter(Boolean).join(' ');
                    })()}
                  </p>
                </div>

                {/* ── Core Desires & Needs ── */}
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <h2 className="font-playfair text-xl text-gray-700">Core Desires &amp; Needs</h2>
                  <p className="text-xs text-gray-400">What your soul craves at the deepest level.</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {(() => {
                      const nnSign = natalLons.northNode != null ? lonToSign(natalLons.northNode) : null;
                      const venusSign = natalLons.venus != null ? lonToSign(natalLons.venus) : null;
                      const nnLine = nnSign ? `Your North Node in ${nnSign.name} pulls your soul toward ${SIGN_Q[nnSign.name]?.domain ?? 'growth'} — this is unfamiliar territory, but growing into it brings the deepest fulfillment.` : '';
                      const venusLine = venusSign ? `Venus in ${venusSign.name} reveals what you truly value — ${SIGN_Q[venusSign.name]?.domain ?? 'beauty and love'}.` : '';
                      const lpDesire = lifePath === 1 ? 'Life Path 1 desires sovereignty — the freedom to pioneer and stand in your own power.'
                        : lifePath === 2 ? 'Life Path 2 desires true partnership — to be seen, received, and met halfway.'
                        : lifePath === 3 ? 'Life Path 3 desires creative expression — to share what lives inside you without fear.'
                        : lifePath === 4 ? 'Life Path 4 desires stability — to build something lasting and know it will hold.'
                        : lifePath === 5 ? 'Life Path 5 desires freedom — to experience everything and be contained by nothing.'
                        : lifePath === 6 ? 'Life Path 6 desires harmony — to love deeply and create beauty wherever you go.'
                        : lifePath === 7 ? 'Life Path 7 desires understanding — to touch the mystery beneath the surface.'
                        : lifePath === 8 ? 'Life Path 8 desires mastery — to wield influence with integrity and create abundance.'
                        : lifePath === 9 ? 'Life Path 9 desires completion — to give back everything you\'ve learned and love without conditions.'
                        : `Life Path ${lifePath} desires transcendence — to channel a spiritual mission that serves beyond yourself.`;
                      const moonLine = moonSign ? `Your ${moonSign.name} moon craves ${SIGN_Q[moonSign.name]?.domain ?? 'emotional depth'} — this is what your inner world needs to feel safe and nourished.` : '';
                      const sigLine = hdData.signature ? `Your HD signature is ${hdData.signature} — when you feel it, you\'re living correctly.` : '';
                      const notSelfLine = hdData.notSelf ? `When ${hdData.notSelf.toLowerCase()} shows up, it\'s a signal to return to your strategy, not push harder.` : '';
                      const typeNeed = hdData.type === 'generator' || hdData.type === 'manifesting-generator'
                        ? `As a ${cap(hdData.type.replace(/-/g, ' '))}, your core energetic need is satisfaction — the feeling of having spent your energy on what truly lights you up.`
                        : hdData.type === 'projector'
                        ? 'As a Projector, your core need is recognition — being truly seen and invited into what\'s correct for you.'
                        : hdData.type === 'manifestor'
                        ? 'As a Manifestor, your core need is peace — the inner stillness that comes when you can initiate without resistance.'
                        : 'As a Reflector, your core need is surprise and delight — the magic that reflects back when you\'re in the right environment.';
                      const openCenters = hdData.centers ? Object.entries(hdData.centers).filter(([,v]) => !v).map(([k]) => CENTER_META[k]?.label ?? k) : [];
                      const openLine = openCenters.length ? `Your open centers (${openCenters.join(', ')}) are where you take in and amplify others\' energy — wisdom lives there, but so does conditioning.` : '';
                      return [lpDesire, nnLine, venusLine, moonLine, typeNeed, sigLine, notSelfLine, openLine].filter(Boolean).join(' ');
                    })()}
                  </p>
                </div>
              </>
            );
          })() : (
            <div className="glass-card rounded-3xl p-10 text-center space-y-3">
              <p className="text-gray-500 text-sm">Synthesis requires your birth chart and numerology data.</p>
              <p className="text-xs text-gray-400">Add your birth details on <a href="/profile" className="text-[#b88a92] underline">Profile</a> to unlock cross-system insights.</p>
            </div>
          )}
        </div>
      )}

      {/* ════ TRANSITS ════ */}
      {vedicMode === 'western' && tab === 'transits' && (
        <div className="space-y-4">

          {/* ── Affecting You Now ── */}
          {(() => {
            if (!transitData?.personality || !hdData?.personality) return null;

            const OUTER = ['jupiter','saturn','uranus','neptune','pluto'];
            const OUTER_ORB = 5;
            const OUTER_EMOJI = { jupiter:'🪐', saturn:'⏳', uranus:'⚡', neptune:'🌊', pluto:'🌑' };
            const OUTER_COLOR = {
              jupiter: { bg:'from-amber-50 to-yellow-50',  border:'border-amber-200/60',  dot:'bg-amber-400',  pill:'bg-amber-100 text-amber-600' },
              saturn:  { bg:'from-stone-50 to-slate-50',   border:'border-stone-200/60',   dot:'bg-stone-400',  pill:'bg-stone-100 text-stone-600' },
              uranus:  { bg:'from-cyan-50 to-sky-50',      border:'border-cyan-200/60',    dot:'bg-cyan-400',   pill:'bg-cyan-100 text-cyan-600' },
              neptune: { bg:'from-violet-50 to-purple-50', border:'border-violet-200/60',  dot:'bg-violet-400', pill:'bg-violet-100 text-violet-600' },
              pluto:   { bg:'from-rose-50 to-pink-50',     border:'border-rose-200/60',    dot:'bg-rose-400',   pill:'bg-rose-100 text-rose-600' },
            };
            const OUTER_DURATION = {
              jupiter:'~1–3 months', saturn:'~3–6 months',
              uranus:'~1–2 years', neptune:'~2–3 years', pluto:'~3–5 years',
            };
            const NATAL_DOMAIN = {
              sun:       'your sense of self and core purpose',
              moon:      'your emotional foundations and inner world',
              mercury:   'your mind and the way you communicate',
              venus:     'your heart, your capacity for love, and what you value most',
              mars:      'your drive, desire, and the force behind your actions',
              jupiter:   'your relationship with abundance and faith',
              saturn:    'your discipline and your long-arc mastery',
              uranus:    'your impulse toward freedom and reinvention',
              neptune:   'your spiritual sensitivity and imagination',
              pluto:     'your relationship with power and deep transformation',
              northNode: 'your soul\'s evolutionary direction',
              southNode: 'your karmic past and comfort zones',
            };
            const TRANSIT_BODY = {
              jupiter: {
                Conjunction: (nd) => `Jupiter is meeting ${nd} directly — this is a genuine opening. Expansion, luck, and new possibility are flowing into this area of your life. Say yes.`,
                Square:      (nd) => `Jupiter is stretching ${nd} beyond familiar bounds. Growth is available here, but it asks you to reach further than feels comfortable.`,
                Opposition:  (nd) => `Jupiter is illuminating ${nd} through contrast and tension — abundance and excess are both in play. Discernment is the practice.`,
                Trine:       (nd) => `Jupiter is flowing harmoniously with ${nd} right now — a quiet but real blessing. Doors are opening without you having to force them.`,
                Sextile:     (nd) => `Jupiter is creating gentle opportunity in ${nd}. The door is ajar — walk through it with intention and watch what opens.`,
              },
              saturn: {
                Conjunction: (nd) => `Saturn is sitting directly on ${nd} — something is being crystallized, tested, and restructured at its root. This chapter is asking for your full honesty and your best effort. What you build here lasts.`,
                Square:      (nd) => `Saturn is testing ${nd} with friction and delay. The resistance is real, but it is clarifying exactly what is true and what is not. What survives this transit has earned its place.`,
                Opposition:  (nd) => `Saturn is bringing ${nd} to a point of reckoning — a reality check that ultimately serves you. What has been building is now being weighed against what is real.`,
                Trine:       (nd) => `Saturn is supporting ${nd} with quiet, enduring strength. Long-term work is paying off here — steady effort is being rewarded.`,
                Sextile:     (nd) => `Saturn is offering structured opportunity through ${nd}. Slow and deliberate action now creates something that will hold for a long time.`,
              },
              uranus: {
                Conjunction: (nd) => `Uranus is breaking ${nd} open — expect the unexpected. A liberation you didn't know you needed is arriving, often disguised as disruption.`,
                Square:      (nd) => `Uranus is shaking ${nd} loose from its familiar shape. The instability is real, but it is clearing space for something more authentic to take root.`,
                Opposition:  (nd) => `Uranus is polarizing ${nd} — what was settled is up for reinvention. The sudden shifts are asking which version of this part of your life is actually true.`,
                Trine:       (nd) => `Uranus is awakening ${nd} with surprising ease — an exciting, liberating shift that feels energizing rather than destabilizing. Let it move you.`,
                Sextile:     (nd) => `Uranus is opening a window through ${nd} — a chance to refresh and renovate in a way that doesn't require upheaval.`,
              },
              neptune: {
                Conjunction: (nd) => `Neptune is dissolving the edges of ${nd} — clarity may feel elusive right now, but something more whole and more honest is forming in the fog. Trust the not-knowing.`,
                Square:      (nd) => `Neptune is blurring ${nd} — illusions and longings are more active than usual here. Trust your felt experience over the stories you're telling yourself.`,
                Opposition:  (nd) => `Neptune is casting ${nd} in a dreamlike quality — the boundary between what is real and what is longed for is thinning. Gentle discernment is your compass.`,
                Trine:       (nd) => `Neptune is softening ${nd} with grace and beauty — spiritual sensitivity and inspiration are flowing more freely through this area of your life.`,
                Sextile:     (nd) => `Neptune is opening a gentle channel through ${nd} — imagination, empathy, and spiritual awareness are quietly enriching this domain.`,
              },
              pluto: {
                Conjunction: (nd) => `Pluto is transforming ${nd} at the very root — this is a multi-year chapter of deep, total change. What can no longer be sustained will not survive it. What remains will be more essentially and unmistakably you.`,
                Square:      (nd) => `Pluto is forcing a reckoning with ${nd} — power, control, and what must finally be released are all on the table. This is not a comfortable transit, but it is an honest one.`,
                Opposition:  (nd) => `Pluto is pulling ${nd} through its deepest transformation via contrast — what can no longer be sustained is ending, and what is most essential is being revealed through that ending.`,
                Trine:       (nd) => `Pluto is transforming ${nd} with surprising depth and relative ease — deep change is underway without the usual upheaval. Something old is composting into something far more alive.`,
                Sextile:     (nd) => `Pluto is opening a subtle channel of transformation through ${nd} — power and depth are quietly becoming available in this area of your life.`,
              },
            };
            const TRANSIT_GUIDANCE = {
              jupiter: {
                Conjunction: 'Your move: Say yes to what excites you — even if it feels bigger than you\'re ready for. Apply for the thing. Start the project. Book the trip. Jupiter conjunctions are rare and they reward bold, open-hearted action.\n\nWatch for: Overcommitting or inflating expectations. Jupiter can make everything feel possible, which is beautiful — but make sure you\'re building on something real, not just riding a high.\n\nRitual: Write down three doors that feel like they\'re opening right now. Pick the one that scares you the most and take one step toward it today.',
                Square:      'Your move: Let the discomfort stretch you. This is growing pains energy — you\'re expanding beyond old limits. Focus on the one or two things that feel most alive and let the rest fall away.\n\nWatch for: Saying yes to everything. Growth requires discernment right now. Not every opportunity that shows up during this transit is yours to take.\n\nRitual: Make a "stop doing" list. What commitments, habits, or obligations have you outgrown? Release one this week.',
                Opposition:  'Your move: Listen to what the friction is teaching you. The tension between your desires and reality is pointing you toward a more honest version of abundance. You don\'t have to choose one side — hold both.\n\nWatch for: Projecting your unlived possibilities onto others, or letting someone else\'s vision override your own.\n\nRitual: Journal on this question: "Where am I reaching for more when what I have is already enough — and where am I settling when I deserve to reach?"',
                Trine:       'Your move: Take action while the current is carrying you. This transit won\'t last forever, and the things you initiate now will have Jupiter\'s blessing behind them. Don\'t waste the grace by being passive.\n\nWatch for: Taking the ease for granted. Trines can be so smooth that you coast through them without capitalizing on the opportunity.\n\nRitual: Start one project or take one leap of faith this week that you\'ve been putting off. The timing is on your side.',
                Sextile:     'Your move: Follow the thread. This transit rewards initiative — the door is cracked open but won\'t swing wide on its own. One intentional step is all it takes to set something in motion.\n\nWatch for: Dismissing the subtle. Sextiles whisper — if you\'re waiting for a shout, you\'ll miss it.\n\nRitual: Pay attention to what shows up uninvited this week — a conversation, an idea, a random invitation. Follow the one that sparks curiosity.',
              },
              saturn: {
                Conjunction: 'Your move: Get honest about what you want to be known for. Do the hard thing with integrity. Show up even when it\'s not fun. Saturn conjunctions happen roughly every 29 years and they define entire chapters of your life. What you build now has to be built to last.\n\nWatch for: Becoming rigid or harsh with yourself. Saturn asks for discipline, not self-punishment. Build with care, not cruelty.\n\nRitual: Write a letter to yourself ten years from now. What do you want to have built? Let that vision anchor your choices during this transit.',
                Square:      'Your move: Slow down and assess what\'s actually solid versus what\'s been held together by habit. The resistance is showing you where the cracks are — so you can reinforce what matters and release what doesn\'t.\n\nWatch for: Forcing your way through. Saturn squares reward patience and strategy, not brute force. Work smarter.\n\nRitual: Pick one area where you feel stuck. Instead of pushing harder, ask: "What is this friction trying to teach me?" Journal your honest answer.',
                Opposition:  'Your move: Face it honestly. Don\'t deflect, don\'t blame, don\'t avoid. The people and situations showing up right now are your mirrors — what they reflect is information you need.\n\nWatch for: Resentment toward the messenger. The external pressure is pointing at an internal restructuring that\'s overdue.\n\nRitual: Have the conversation you\'ve been putting off. Say the honest thing. Saturn oppositions reward those who stop performing and start being real.',
                Trine:       'Your move: Double down on what\'s working. This is the harvest of past discipline. Lean into structure, routine, and long-term thinking. The universe is matching your consistency with results.\n\nWatch for: Overlooking steady progress because it doesn\'t come with a spotlight. The wins right now are quiet but real.\n\nRitual: Acknowledge one thing you\'ve worked hard on that\'s actually paying off. Let yourself feel the pride without minimizing it.',
                Sextile:     'Your move: Pick one area that matters and commit to consistent, small actions. This transit won\'t hand you anything, but every deliberate step you take will compound.\n\nWatch for: Waiting for the right time. The right time is now — Saturn sextiles reward those who start, not those who plan to start.\n\nRitual: Choose one daily habit you\'ve been meaning to build. Start it this week — even imperfectly. Five minutes counts.',
              },
              uranus: {
                Conjunction: 'Your move: Let yourself be liberated. The part of your life that feels most claustrophobic is the part Uranus is breaking open. Don\'t cling to the old form. The version of you emerging from this transit is more authentic than anything that came before.\n\nWatch for: Burning bridges impulsively. Freedom is the goal, but you don\'t have to destroy everything to get there. Be revolutionary, not reckless.\n\nRitual: Ask yourself: "If I weren\'t afraid of what people would think, what would I change right now?" Write down the answer. Then take one small step toward it.',
                Square:      'Your move: Stop resisting the instability. The part of your life that feels most shaky right now is the part most overdue for reinvention. Let it rearrange and trust that you\'ll find your footing on the other side.\n\nWatch for: Clinging to control. The more you resist, the more disruptive it feels. Loosen your grip.\n\nRitual: Intentionally break one small routine this week. Take a different route, try a new approach, do something out of character. Practice being surprised by yourself.',
                Opposition:  'Your move: Let the old identity go. This transit is pointing you toward a freedom you didn\'t know you needed. Be willing to surprise yourself — and the people around you.\n\nWatch for: Projecting your need for freedom onto others. The revolution starts within, not by blowing up your relationships.\n\nRitual: Write down who you were five years ago and who you are now. Then write down who you\'re becoming. Let the gap between the last two guide your choices.',
                Trine:       'Your move: Be bold. Experiment. Try the unconventional approach. This is your window to reinvent something in your life while the energy actually supports it — without the usual chaos.\n\nWatch for: Playing it safe when the energy is inviting you to be daring. Don\'t waste a smooth Uranus transit on incremental tweaks.\n\nRitual: Do one thing this week that your "old self" never would have done. Something that makes you feel alive in a new way.',
                Sextile:     'Your move: Follow the curiosity. Break a small pattern. Try a new approach to an old problem. This transit rewards experimentation and open-mindedness.\n\nWatch for: Ignoring the itch for something new. Sextiles are gentle invitations — they open doors that won\'t stay open forever.\n\nRitual: Say yes to one unexpected thing this week. A new place, a new conversation, a new idea. See where it takes you.',
              },
              neptune: {
                Conjunction: 'Your move: Trust your intuition over your logic right now. Something is being dreamed into existence through you, but it can\'t be forced into a spreadsheet. Let beauty, inspiration, and felt experience guide you. Spend time near water, in nature, or with art.\n\nWatch for: Escapism, addiction, and self-deception. Neptune dissolves boundaries — including the ones that protect you. Stay grounded in your body and your daily practices.\n\nRitual: Start a dream journal. Before bed, set an intention to receive guidance. Write down whatever comes — images, feelings, fragments — before you fully wake.',
                Square:      'Your move: Get honest with yourself — gently. Ask: where am I seeing what I want to see instead of what\'s actually there? Ground yourself in your body, in nature, in the people who tell you the truth even when it\'s hard.\n\nWatch for: Making major decisions in the fog. If you can\'t see clearly, don\'t commit to anything permanent. Wait for clarity to return.\n\nRitual: Name one thing you\'ve been romanticizing. Write the version you wish were true, and then write what\'s actually true. Let the difference inform your next step.',
                Opposition:  'Your move: Get clear on what\'s yours and what isn\'t. Not every feeling you\'re having originated in you. Practice energetic boundaries — not walls, but discernment. Your sensitivity is a gift, not a weakness.\n\nWatch for: Losing yourself in someone else\'s story. Compassion doesn\'t mean merging.\n\nRitual: At the end of each day this week, ask: "Which of my emotions today were actually mine, and which did I absorb from others?" Notice the patterns.',
                Trine:       'Your move: Create. Dream. Meditate. Connect with whatever feeds your soul. This is one of the most artistically and spiritually fertile transits you can have. Whatever you channel right now will carry a quality of grace.\n\nWatch for: Basking in the inspiration without putting it into action. The muse is visiting — give her something to work with.\n\nRitual: Dedicate 20 minutes this week to pure creative expression with no purpose — paint, write, sing, move. Don\'t judge it. Just let it flow.',
                Sextile:     'Your move: Pay attention to the whispers. Journal your dreams. Follow the synchronicities. This transit rewards those who slow down enough to notice the magic in the mundane.\n\nWatch for: Moving too fast to catch the subtleties. Neptune sextiles speak in symbols and feelings, not headlines.\n\nRitual: Pick one day this week to move slowly on purpose. No rushing. Notice what you see, feel, and sense when you\'re not in a hurry.',
              },
              pluto: {
                Conjunction: 'Your move: Surrender to the transformation. What\'s dying needs to die — you can\'t save it, and trying will only prolong the pain. The version of you on the other side will be more powerful, more honest, and more essentially yourself than you\'ve ever been.\n\nWatch for: Trying to control the process. Pluto is bigger than your will. Let it work through you rather than fighting it.\n\nRitual: Write down what you\'re most afraid of losing right now. Then ask: "Who would I be without it?" Sit with the answer. That\'s who\'s emerging.',
                Square:      'Your move: Go toward what scares you. Pluto squares surface the things you\'ve been burying, and the only way out is through. Therapy, shadow work, honest conversations — this is the time.\n\nWatch for: Manipulation and control — from others or from yourself. When Pluto is activated, power dynamics get loud. Stay honest about where you\'re trying to control outcomes.\n\nRitual: Identify one thing you\'ve been avoiding looking at — a pattern, a conversation, a feeling. Face it this week. Even naming it out loud is a form of reclaiming your power.',
                Opposition:  'Your move: Release your grip. What falls away during this transit was never really yours to keep. What remains after the storm is the unshakable core of who you are. Trust the process of letting go.\n\nWatch for: Holding on out of fear. The tighter you grip, the more painful the release. Practice radical honesty about what you actually need versus what you\'re afraid to lose.\n\nRitual: Write a goodbye letter to something that\'s ending — a relationship, a version of yourself, a chapter. You don\'t have to send it. Just let the grief move through you.',
                Trine:       'Your move: Use this transit for deep inner work — therapy, journaling, shadow integration, ancestral healing. The transformation is happening quietly but powerfully. Step into the version of your power that doesn\'t need to prove anything.\n\nWatch for: Ignoring the depth because the surface is calm. Just because it\'s not dramatic doesn\'t mean it\'s not significant.\n\nRitual: Set aside time this week for a solo deep-dive: journal on what patterns from your family or past keep repeating. Name them. Understanding them is the first step to breaking them.',
                Sextile:     'Your move: Look at where you\'ve been giving your power away and gently reclaim it. This is Pluto at its kindest — offering transformation without forcing it. A pattern released, a truth spoken, a boundary drawn.\n\nWatch for: Dismissing the opportunity because it doesn\'t feel urgent. Pluto sextiles are rare moments of accessible depth. Don\'t wait for a crisis to do the work you could do peacefully now.\n\nRitual: Draw one boundary this week that you\'ve been putting off. It doesn\'t have to be dramatic — even a quiet "no" counts as reclaiming your power.',
              },
            };
            const TRANSIT_NAMES = {
              jupiter: {
                Conjunction: 'The Lucky Break',
                Square:      'The Growth Spurt',
                Opposition:  'The Balancing Act',
                Trine:       'The Golden Door',
                Sextile:     'The Gentle Nudge',
              },
              saturn: {
                Conjunction: 'The Masterclass',
                Square:      'The Stress Test',
                Opposition:  'The Reality Check',
                Trine:       'The Slow Reward',
                Sextile:     'The Quiet Build',
              },
              uranus: {
                Conjunction: 'The Plot Twist',
                Square:      'The Shake-Up',
                Opposition:  'The Great Reinvention',
                Trine:       'The Electric Spark',
                Sextile:     'The Fresh Start',
              },
              neptune: {
                Conjunction: 'The Fog & The Dream',
                Square:      'The Rose-Colored Glasses',
                Opposition:  'The Veil Thins',
                Trine:       'The Muse Arrives',
                Sextile:     'The Soft Opening',
              },
              pluto: {
                Conjunction: 'The Phoenix Season',
                Square:      'The Power Struggle',
                Opposition:  'The Great Unraveling',
                Trine:       'The Deep Current',
                Sextile:     'The Quiet Revolution',
              },
            };
            const ASP_HEADLINE = {
              Conjunction: (tp, np) => TRANSIT_NAMES[tp]?.Conjunction ?? `${cap(tp)} conjunct ${PLANET_LBL[np] ?? np}`,
              Square:      (tp, np) => TRANSIT_NAMES[tp]?.Square      ?? `${cap(tp)} square ${PLANET_LBL[np] ?? np}`,
              Opposition:  (tp, np) => TRANSIT_NAMES[tp]?.Opposition  ?? `${cap(tp)} opposite ${PLANET_LBL[np] ?? np}`,
              Trine:       (tp, np) => TRANSIT_NAMES[tp]?.Trine       ?? `${cap(tp)} trine ${PLANET_LBL[np] ?? np}`,
              Sextile:     (tp, np) => TRANSIT_NAMES[tp]?.Sextile     ?? `${cap(tp)} sextile ${PLANET_LBL[np] ?? np}`,
            };
            const MAJOR = new Set(['Conjunction','Square','Opposition','Trine','Sextile']);

            // Compute outer-planet transit aspects with tighter personal orb
            const outerAspects = [];
            for (const tb of OUTER) {
              if (transitLons[tb] == null) continue;
              for (const [nb, nLon] of Object.entries(natalLons)) {
                if (nLon == null) continue;
                const diff  = ((transitLons[tb] - nLon) % 360 + 360) % 360;
                const angle = Math.min(diff, 360 - diff);
                for (const asp of ASPECT_DEFS) {
                  const orb = Math.abs(angle - asp.angle);
                  if (MAJOR.has(asp.name) && orb <= OUTER_ORB) {
                    outerAspects.push({ transit: tb, natal: nb, aspName: asp.name, orb: orb.toFixed(1), symbol: asp.symbol });
                    break;
                  }
                }
              }
            }

            // Deduplicate: keep tightest orb per transit-planet × aspect-type combo
            // (same clever name = same transit+aspect, so only show once with tightest hit)
            const seen = new Map();
            for (const a of outerAspects.sort((x,y)=>+x.orb - +y.orb)) {
              const k = `${a.transit}-${a.aspName}`;
              if (!seen.has(k)) seen.set(k, a);
            }
            const active = [...seen.values()].sort((a,b)=>
              OUTER.indexOf(a.transit) - OUTER.indexOf(b.transit) || +a.orb - +b.orb
            );

            if (!active.length) return null;

            return (
              <div className="space-y-3">
                <div className="px-1">
                  <h2 className="font-playfair text-xl text-gray-700">Affecting You Now</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Longer-arc transits currently shaping your season. Tap any card to learn more.</p>
                </div>
                {active.map((a) => {
                  const c   = OUTER_COLOR[a.transit];
                  const nd  = NATAL_DOMAIN[a.natal] ?? `your ${PLANET_LBL[a.natal] ?? a.natal}`;
                  const fn  = TRANSIT_BODY[a.transit]?.[a.aspName];
                  const body = fn ? fn(nd) : null;
                  if (!body) return null;
                  const headline = (ASP_HEADLINE[a.aspName] ?? ((tp,np)=>`${cap(tp)} × ${PLANET_LBL[np]??np}`))(a.transit, a.natal);
                  const planetsLine = `${cap(a.transit)} ${a.aspName.toLowerCase()} your ${PLANET_LBL[a.natal] ?? a.natal}`;
                  return (
                    <button key={`${a.transit}-${a.natal}`}
                      onClick={() => {
                        const asp = ASPECT_DESC[a.aspName];
                        if (!asp) return;
                        const guidance = TRANSIT_GUIDANCE[a.transit]?.[a.aspName] ?? body;
                        setDetail({
                          title: headline,
                          subtitle: `${OUTER_EMOJI[a.transit]} ${planetsLine} · ${a.orb}° orb · ${OUTER_DURATION[a.transit]}`,
                          tags: [a.aspName, cap(a.transit), OUTER_DURATION[a.transit]],
                          body: guidance,
                        });
                      }}
                      className={`w-full text-left bg-gradient-to-br ${c.bg} border ${c.border} rounded-3xl p-5 space-y-3 hover:shadow-sm active:scale-[0.99] transition-all`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{OUTER_EMOJI[a.transit]}</span>
                            <span className="font-playfair text-base text-gray-700">{headline}</span>
                          </div>
                          <p className="text-xs text-gray-400 pl-7">{planetsLine} · {a.orb}°</p>
                        </div>
                        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${c.pill}`}>
                          {OUTER_DURATION[a.transit]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed pl-1">{body}</p>
                    </button>
                  );
                })}
              </div>
            );
          })()}

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

      {/* ════ VEDIC MODE ════ */}
      {vedicMode === 'vedic' && (() => {
        if (vedicLoading) return (
          <div className="glass-card rounded-3xl p-12 text-center space-y-2">
            <p className="text-gray-500 text-sm">Calculating your Vedic chart…</p>
            <p className="text-xs text-gray-400">JPL DE421 ephemeris · Chitra Paksha ayanamsha</p>
          </div>
        );
        if (!vedicData && !birthData?.birthLat) return (
          <div className="glass-card rounded-3xl p-10 text-center space-y-3">
            <p className="text-gray-500 text-sm">Birth location required for Vedic chart.</p>
            <p className="text-xs text-gray-400">Add your birth city on <a href="/profile" className="text-[#b88a92] underline">Profile</a> to unlock Jyotish calculations.</p>
          </div>
        );
        if (!vedicData) return (
          <div className="glass-card rounded-3xl p-10 text-center space-y-3">
            <p className="text-gray-500 text-sm">Vedic chart unavailable.</p>
            <p className="text-xs text-gray-400">The Vedic service may be starting up — try again in a moment.</p>
          </div>
        );

        // ── Data extraction (camelCase JSON from jyotishganit) ───────────────
        const d1Houses   = vedicData?.d1Chart?.houses ?? [];
        const planets    = d1Houses.flatMap(h => (h.occupants ?? []).map(p => ({ ...p, houseNumber: h.number })));
        const houses     = d1Houses;
        const lagna      = houses[0];
        const panchanga  = vedicData?.panchanga ?? {};
        const ayanamsa   = vedicData?.ayanamsa;
        const allMd      = vedicData?.dashas?.all?.mahadashas ?? {};
        const curMd      = vedicData?.dashas?.current?.mahadashas ?? {};
        const divCharts  = vedicData?.divisionalCharts ?? {};
        const sav        = vedicData?.ashtakavarga?.sav ?? {};
        const bhavMap    = {
          Sun: vedicData?.ashtakavarga?.sunBhav ?? {},
          Moon: vedicData?.ashtakavarga?.moonBhav ?? {},
          Mars: vedicData?.ashtakavarga?.marsBhav ?? {},
          Mercury: vedicData?.ashtakavarga?.mercuryBhav ?? {},
          Jupiter: vedicData?.ashtakavarga?.jupiterBhav ?? {},
          Venus: vedicData?.ashtakavarga?.venusBhav ?? {},
          Saturn: vedicData?.ashtakavarga?.saturnBhav ?? {},
        };

        const currentMdName = Object.keys(curMd)[0] ?? null;
        const currentMdData = currentMdName ? curMd[currentMdName] : null;
        const antardashas   = currentMdData?.antardashas ?? {};
        const currentAdName = Object.keys(antardashas)[0] ?? null;
        const currentAdData = currentAdName ? antardashas[currentAdName] : null;
        const pratyantars   = currentAdData?.pratyantardashas ?? {};
        const currentPtName = Object.keys(pratyantars)[0] ?? null;
        const currentPtData = currentPtName ? pratyantars[currentPtName] : null;

        const moonPlanet  = planets.find(p => p.celestialBody === 'Moon');
        const moonNak     = moonPlanet?.nakshatra;
        const moonNakData = NAKSHATRA_DATA.find(n => n.name === moonNak);
        const lagnaSign   = lagna?.sign;
        const lagnaLord   = lagnaSign ? SIGN_LORDS[lagnaSign] : null;
        const lagnaHouseDesc = VEDIC_HOUSE_DESC[1];
        const lagnaNak    = lagna?.nakshatra;
        const lagnaPada   = lagna?.pada;
        const lagnaNakD   = NAKSHATRA_DATA.find(n => n.name === lagnaNak);

        function openNakshatra(name, context) {
          const d  = NAKSHATRA_DESC[name];
          const nd = NAKSHATRA_DATA.find(n => n.name === name);
          if (!d) return;
          let body = d;
          if (context === 'janma') {
            const moonP = planets.find(pl => pl.celestialBody === 'Moon');
            const moonSign = moonP?.sign ?? '';
            const moonHouse = moonP?.houseNumber ?? moonP?.house;
            const hDesc = moonHouse ? VEDIC_HOUSE_DESC[moonHouse] : null;
            const intro = `Your Moon is in ${name} — this is your Janma Nakshatra, the most personally significant placement in your entire Vedic chart.\n\nIn Jyotish, the nakshatra your Moon occupies at birth is the foundation of your inner world: your emotional nature, your instinctive responses, your subconscious, and the quality of your felt experience of life from the inside. Where your Sun describes your soul's purpose, your Janma Nakshatra describes the texture of the soul itself.\n\nYour Moon is in ${moonSign}${moonHouse ? ` in the ${moonHouse}${[1,21].includes(moonHouse)?'st':[2,22].includes(moonHouse)?'nd':[3].includes(moonHouse)?'rd':'th'} house` : ''}${hDesc ? ` — the house of ${hDesc.themes.split(',')[0].toLowerCase()}` : ''}, moving through ${nd?.symbol ?? ''} ${name} (ruled by ${nd?.lord ?? '—'}).\n\nThis nakshatra also determines the starting point of your Vimshottari Dasha sequence — the unfoldment of your karma across time begins from the Moon's position in ${name} at birth.\n\n`;
            body = intro + d;
          }
          setDetail({ title:`${nd?.symbol ?? '✦'} ${name}`, subtitle: context === 'janma' ? `Your Janma Nakshatra · Ruled by ${nd?.lord ?? '—'}` : `Ruled by ${nd?.lord ?? '—'}`, body });
        }
        function openVedicPlanet(p) {
          const desc   = VEDIC_PLANET_DESC[p.celestialBody];
          if (!desc) return;
          const isNode = p.celestialBody === 'Rahu' || p.celestialBody === 'Ketu';
          const dig    = p.dignities?.dignity;
          const digKey = dig ? (dig.toLowerCase() === 'own_sign' ? 'own' : dig.toLowerCase()) : null;
          const digSt  = digKey ? DIGNITY_STYLE[digKey] : null;
          const house  = p.houseNumber ?? p.house;
          const hDesc  = VEDIC_HOUSE_DESC[house];
          setDetail({
            title:    `${VEDIC_PLANET_SYM[p.celestialBody] ?? ''} ${desc.title}`,
            subtitle: `${p.sign} · House ${house}${hDesc ? ' · ' + hDesc.themes.split(',')[0] : ''} · ${p.nakshatra ?? ''} P${p.pada ?? ''}${(p.motion_type === 'retrograde' && !isNode) ? ' · Rx' : ''}`,
            tags:     [p.sign, digSt?.label ?? '', (p.motion_type === 'retrograde' && !isNode) ? 'Retrograde' : ''].filter(Boolean),
            body:     vedicPlanetBody(p),
          });
        }
        function openVedicHouse(h) {
          const desc = VEDIC_HOUSE_DESC[h.number];
          if (!desc) return;
          const signQ   = SIGN_Q[h.sign];
          const lord    = h.lord ?? SIGN_LORDS[h.sign];
          const lordH   = h.lordPlacedHouse;
          const occs    = (h.occupants ?? []).map(o => o.celestialBody);
          const occLine = occs.length
            ? `${occs.join(' and ')} ${occs.length === 1 ? 'occupies' : 'occupy'} this house, bringing ${occs.length === 1 ? 'its' : 'their'} energy directly into the domain of ${desc.themes.split(',')[0].toLowerCase()}.`
            : `No planets occupy this house — its matters are governed entirely through its lord, ${lord}.`;
          const signLine = signQ
            ? `With ${h.sign} on the cusp, you experience this house through a ${signQ.themes} lens — the domain of ${signQ.domain} colors how these themes unfold for you.`
            : '';
          const lordLine = lordH
            ? `The house lord ${lord} is placed in the ${lordH}${lordH===1?'st':lordH===2?'nd':lordH===3?'rd':'th'} house, directing ${desc.themes.split(',')[0].toLowerCase()} energy toward those themes.`
            : '';
          setDetail({
            title:    desc.name,
            subtitle: `${h.sign} · Ruled by ${lord}`,
            tags:     (h.purposes ?? []),
            body:     [signLine, desc.body, lordLine, occLine].filter(Boolean).join('\n\n'),
          });
        }

        // ── RASI TAB ──────────────────────────────────────────────────────────
        if (vedicTab === 'rasi') return (
          <div className="space-y-4">
            {/* Lagna + Moon nakshatra */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <button onClick={() => lagna && openVedicHouse(lagna)} className="text-left hover:opacity-80 transition-opacity">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Lagna · Ascendant</p>
                  <p className="font-playfair text-2xl text-gray-700 mt-0.5">{lagnaSign ?? '—'}</p>
                  <p className="text-xs text-gray-400 mt-1">Ruled by {lagnaLord}{lagnaNak ? ` · ${lagnaNakD?.symbol ?? ''} ${lagnaNak} P${lagnaPada}` : ''}</p>
                  <p className="text-xs text-[#b88a92] mt-0.5">tap to learn more ›</p>
                </button>
                {moonNak && (
                  <button onClick={() => openNakshatra(moonNak, 'janma')}
                    className="text-right bg-white/50 border border-white/40 rounded-2xl px-4 py-3 hover:bg-white/70 transition-colors">
                    <p className="text-xs text-gray-400">Janma Nakshatra</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">{moonNakData?.symbol} {moonNak}</p>
                    <p className="text-xs text-gray-400 mt-0.5">pada {moonPlanet?.pada ?? '—'} · {moonNakData?.lord} dasha</p>
                    <p className="text-xs text-[#b88a92] mt-1">tap to learn more ›</p>
                  </button>
                )}
              </div>
              {ayanamsa && (
                <div className="flex items-center gap-2 pt-1 border-t border-white/30">
                  <span className="text-xs text-gray-400">Ayanamsha</span>
                  <span className="text-xs font-medium text-gray-600">{ayanamsa.name ?? 'Lahiri'}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs font-medium text-gray-600">{Number(ayanamsa.value).toFixed(4)}°</span>
                  <span className="text-xs text-gray-300">· JPL DE421</span>
                </div>
              )}
            </div>

            {/* Planet list — fully tappable */}
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <div>
                <h2 className="font-playfair text-xl text-gray-700">Graha · Planetary Positions</h2>
                <p className="text-xs text-gray-400 mt-1">Sidereal zodiac · Tap any planet for its Jyotish meaning.</p>
              </div>
              <div className="divide-y divide-white/30">
                {planets.map(p => {
                  const sym    = VEDIC_PLANET_SYM[p.celestialBody] ?? '•';
                  const digRaw = p.dignities?.dignity?.toLowerCase();
                  const dig    = digRaw === 'own_sign' ? 'own' : digRaw;
                  const digSt  = DIGNITY_STYLE[dig] ?? DIGNITY_STYLE.neutral;
                  const nakD   = NAKSHATRA_DATA.find(n => n.name === p.nakshatra);
                  const isRx   = p.motion_type === 'retrograde' && p.celestialBody !== 'Rahu' && p.celestialBody !== 'Ketu';
                  return (
                    <button key={p.celestialBody} onClick={() => openVedicPlanet(p)}
                      className="w-full py-3 flex items-center gap-2 flex-wrap hover:bg-white/40 rounded-xl px-2 -mx-2 transition-colors text-left">
                      <span className="text-base w-6 text-center text-gray-500 shrink-0">{sym}</span>
                      <div className="w-20 shrink-0">
                        <p className="text-xs font-medium text-gray-600">{p.celestialBody}</p>
                        {isRx && <p className="text-[10px] text-orange-400">Retrograde</p>}
                      </div>
                      <div className="shrink-0">
                        <p className="text-sm font-medium text-gray-700">{p.sign}</p>
                        <p className="text-xs text-gray-400">{p.signDegrees?.toFixed(1)}° · H{p.houseNumber ?? p.house}</p>
                      </div>
                      <div className="flex-1 text-right space-y-0.5">
                        {p.nakshatra && (
                          <p className="text-xs text-[#b88a92]">{nakD?.symbol} {p.nakshatra} P{p.pada}</p>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-block ${digSt.bg} ${digSt.color} ${digSt.border}`}>{digSt.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* House grid — fully tappable */}
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <div>
                <h2 className="font-playfair text-xl text-gray-700">Bhava · Houses</h2>
                <p className="text-xs text-gray-400 mt-1">Tap any house to learn its domain and meaning.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {houses.slice(0,12).map(h => {
                  const hd = VEDIC_HOUSE_DESC[h.number];
                  const occs = (h.occupants ?? []).map(o => o.celestialBody);
                  return (
                    <button key={h.number} onClick={() => openVedicHouse(h)}
                      className="bg-white/50 border border-white/40 rounded-2xl p-3 text-left hover:bg-white/70 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">House {h.number}</p>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {(h.purposes ?? []).slice(0,2).map(pu => (
                            <span key={pu} className={`text-[9px] px-1 py-0.5 rounded border ${PURPOSE_STYLE[pu] ?? 'bg-gray-50 text-gray-400 border-gray-200/40'}`}>{pu}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{h.sign}</p>
                      <p className="text-xs text-gray-400">Lord: {h.lord ?? SIGN_LORDS[h.sign]}</p>
                      {occs.length > 0 && <p className="text-xs text-[#b88a92]">{occs.join(', ')}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

        // ── PANCHANGA TAB ──────────────────────────────────────────────────────
        if (vedicTab === 'panchanga') return (
          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-6 space-y-2">
              <h2 className="font-playfair text-xl text-gray-700">Panchanga at Birth</h2>
              <p className="text-sm text-gray-500 leading-relaxed">The Panchanga — "five limbs" — is the Vedic almanac that describes the cosmic quality of any given moment. Your birth panchanga reveals the energetic signature of the instant your soul entered this body: the quality of the lunar day, the Moon's nakshatra, the yoga formed by Sun and Moon, the karana governing the half-day, and the weekday's ruling deity. Together they paint a portrait of the moment you arrived.</p>
            </div>
            {[
              {
                label:'Vaara', emoji:'🌞', value: panchanga.vaara, subtitle:'Day of the week · Ruling planet',
                desc: (() => {
                  const v = panchanga.vaara ?? '';
                  const dayPlanet = { Sunday:'Sun', Monday:'Moon', Tuesday:'Mars', Wednesday:'Mercury', Thursday:'Jupiter', Friday:'Venus', Saturday:'Saturn' }[v];
                  const dp = dayPlanet ? planets.find(pl => pl.celestialBody === dayPlanet) : null;
                  const planetLine = dp
                    ? `Your birth weekday is ruled by ${dayPlanet}, and your ${dayPlanet} is placed in ${dp.sign} in the ${dp.houseNumber ?? dp.house}${[1,21].includes(dp.houseNumber??dp.house)?'st':[2,22].includes(dp.houseNumber??dp.house)?'nd':[3].includes(dp.houseNumber??dp.house)?'rd':'th'} house — so the ruling energy of your birth day is directly colored by those themes in your chart.`
                    : '';
                  const baseDesc = VAARA_DESC[v] ?? 'Each weekday is ruled by a planetary deity whose energy colors everything that arises during it.';
                  return `You were born on ${v} — ${baseDesc}\n\n${planetLine}\n\nIn Jyotish the weekday (Vaara) is considered one of the five limbs of the Panchanga because the planetary deity of the day imprints its quality on everything born within it. The Vaara lord is worth noting alongside your chart's planetary strengths.`;
                })(),
              },
              {
                label:'Tithi', emoji:'🌙', value: panchanga.tithi, subtitle:'Lunar day · 1 of 30 divisions of the lunar month',
                desc: (() => {
                  const t = panchanga.tithi ?? '';
                  const isKrishna  = t.startsWith('Krishna');
                  const isShukla   = t.startsWith('Shukla');
                  const isPurnima  = t === 'Purnima';
                  const isAmavasya = t === 'Amavasya';
                  let personalLine = '';
                  if (isPurnima)   personalLine = `You were born on Purnima — the full moon, the most luminous and emotionally potent of all tithis. The Sun and Moon are directly opposite each other at your birth, creating a polarity of full awareness. Purnima births often carry great visibility, emotional intensity, and a life that tends toward culmination and fullness rather than beginning and becoming.`;
                  else if (isAmavasya) personalLine = `You were born on Amavasya — the new moon, the most inward and ancestrally charged of all tithis. Sun and Moon are conjunct at your birth, seed-point energy turned entirely within. Amavasya births are associated with strong psychic sensitivity, a deep ancestral connection, and a life that tends to move in cycles of withdrawal and renewal.`;
                  else if (isKrishna) personalLine = `You were born on ${t} — a Krishna paksha (waning lunar) tithi. The Moon is moving from fullness back toward darkness, and the quality of your birth moment carries the energy of discernment, release, and the refinement of what has been accumulated. Krishna tithi births often indicate souls with depth of introspection, strength in endings, and natural wisdom about impermanence.`;
                  else if (isShukla) personalLine = `You were born on ${t} — a Shukla paksha (waxing lunar) tithi. The Moon is growing toward fullness, and the quality of your birth moment carries the energy of momentum, expansion, and the building of something new. Shukla tithi births often indicate souls with natural creative drive, a forward-moving life force, and ease with beginnings.`;
                  else personalLine = `You were born on the ${t} tithi.`;
                  return `${personalLine}\n\nThe tithi — lunar day — is formed by every 12° of angular separation between the Sun and Moon. There are 30 tithis in a lunar month: 15 in the brightening Shukla paksha and 15 in the darkening Krishna paksha. Each has a presiding deity and a distinct quality that colors everything born within it.`;
                })(),
              },
              {
                label:'Nakshatra', emoji:'⭐', value: panchanga.nakshatra, subtitle:'Janma Nakshatra · Your lunar mansion',
                desc: (() => {
                  const nak = panchanga.nakshatra;
                  const nd  = NAKSHATRA_DATA.find(n => n.name === nak);
                  const moonP = planets.find(pl => pl.celestialBody === 'Moon');
                  const moonSign = moonP?.sign ?? '';
                  const moonHouse = moonP?.houseNumber ?? moonP?.house;
                  const hDesc = moonHouse ? VEDIC_HOUSE_DESC[moonHouse] : null;
                  const intro = `Your Moon is in ${nd?.symbol ?? ''} ${nak} — your Janma Nakshatra. This is the most personally significant placement in Jyotish: the lunar mansion your Moon occupies defines the deepest layer of your psychological nature, your emotional instincts, and the quality of your felt experience of life from within.\n\nYour Moon is in ${moonSign}${moonHouse ? ` in the ${moonHouse}${[1,21].includes(moonHouse)?'st':[2,22].includes(moonHouse)?'nd':[3].includes(moonHouse)?'rd':'th'} house` : ''}${hDesc ? ` — the house of ${hDesc.themes.split(',')[0].toLowerCase()}` : ''}. ${nak} is ruled by ${nd?.lord ?? '—'}, which means your Dasha sequence originates here.\n\n`;
                  return intro + (NAKSHATRA_DESC[nak] ?? '');
                })(),
              },
              {
                label:'Yoga', emoji:'☯️', value: panchanga.yoga, subtitle:'Sun + Moon combined longitude ÷ 13°20\'',
                desc: (() => {
                  const y = panchanga.yoga ?? '';
                  const yd = YOGA_DESC[y];
                  const sunP  = planets.find(pl => pl.celestialBody === 'Sun');
                  const moonP = planets.find(pl => pl.celestialBody === 'Moon');
                  const combLine = (sunP && moonP) ? `At your birth, your Sun in ${sunP.sign} and Moon in ${moonP.sign} combined to form the ${y} yoga.` : `You were born under the ${y} yoga.`;
                  return `${combLine}${yd ? ` ${yd}` : ''}\n\nThe yoga is one of the 27 divisions formed by adding the sidereal longitudes of the Sun and Moon and dividing by 13°20'. Each yoga carries a distinct quality — from the most auspicious (Siddhi, Shiva, Brahma, Indra) to the more challenging (Vishkumbha, Ganda, Vyatipata, Vaidhriti). The yoga of the birth moment is considered a subtle but persistent background quality that colors your life's overall energetic signature and the ease or challenge with which your efforts tend to bear fruit.`;
                })(),
              },
              {
                label:'Karana', emoji:'🌗', value: panchanga.karana, subtitle:'Half of a tithi · 1 of 11 karanas',
                desc: (() => {
                  const k = panchanga.karana ?? '';
                  const kd = KARANA_DESC[k];
                  return `You were born under the ${k} karana.${kd ? ` ${kd}` : ''}\n\nA karana is half of a tithi — each lunar day (tithi) contains two karanas, so there are roughly 60 karana periods in a lunar month. There are 11 karanas in total: 7 movable ones (Bava, Balava, Kaulava, Taitila, Garaja, Vanija, Vishti) that repeat throughout the month, and 4 fixed ones (Shakuni, Chatushpada, Naga, Kimstughna) that occur only once. The karana governs the quality of action and initiative suited to that half-day window — in Jyotish it is used when choosing auspicious moments for important undertakings.`;
                })(),
              },
            ].map(item => (
              <button key={item.label} onClick={() => setDetail({ title:`${item.emoji} ${item.label} · ${item.value}`, subtitle: item.subtitle, body: item.desc ?? '' })}
                className="w-full glass-card rounded-3xl p-6 text-left hover:bg-white/80 transition-colors space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">{item.label}</p>
                    <p className="font-playfair text-xl text-gray-700 mt-0.5">{item.value ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.subtitle}</p>
                  </div>
                  <div className="text-center shrink-0">
                    <span className="text-2xl">{item.emoji}</span>
                    <p className="text-xs text-[#b88a92] mt-1">tap ›</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{item.desc}</p>
              </button>
            ))}
          </div>
        );

        // ── DASHAS TAB ────────────────────────────────────────────────────────
        if (vedicTab === 'dashas') return (
          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-6 space-y-2">
              <h2 className="font-playfair text-xl text-gray-700">Vimshottari Dasha</h2>
              <p className="text-sm text-gray-500 leading-relaxed">The Vimshottari Dasha is a 120-year cycle of planetary periods that governs the unfolding of your karma across time. The sequence is determined by the Moon's nakshatra at birth, which reveals which planet's period you begin life under. Each Mahadasha (major period) has a dominant planetary theme that colors the events and inner experiences of those years — and within each Mahadasha, Antardashas (sub-periods) bring the flavors of other planets into the mix. Tap any period to learn what it means for you.</p>
            </div>

            {/* Current period banner */}
            {currentMdName && (
              <div className="glass-card rounded-3xl p-6 space-y-4" style={{ borderLeft:'3px solid #b88a92' }}>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">You are currently in</p>
                  <p className="font-playfair text-2xl text-gray-700 mt-1">{VEDIC_PLANET_SYM[currentMdName]} {currentMdName} Mahadasha</p>
                  <p className="text-xs text-gray-400 mt-1">{currentMdData?.start} → {currentMdData?.end}</p>
                </div>
                {(() => {
                  const mdPlanet = planets.find(pl => pl.celestialBody === currentMdName);
                  const placementNote = mdPlanet ? ` Your ${currentMdName} sits in ${mdPlanet.sign} in your ${mdPlanet.houseNumber ?? mdPlanet.house}${[1,21].includes(mdPlanet.houseNumber??mdPlanet.house)?'st':[2,22].includes(mdPlanet.houseNumber??mdPlanet.house)?'nd':[3].includes(mdPlanet.houseNumber??mdPlanet.house)?'rd':'th'} house, which means this period activates the themes of that house with particular force.` : '';
                  return <p className="text-sm text-gray-600 leading-relaxed">{(DASHA_DESC[currentMdName] ?? '') + placementNote}</p>;
                })()}

                {currentAdName && (
                  <div className="bg-white/60 border border-white/50 rounded-2xl p-4 space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Current Antardasha (sub-period)</p>
                    <p className="text-sm font-medium text-gray-700">{VEDIC_PLANET_SYM[currentAdName]} {currentAdName} Antardasha</p>
                    <p className="text-xs text-gray-400">{currentAdData?.start} → {currentAdData?.end}</p>
                    {(() => {
                      const adPlanet = planets.find(pl => pl.celestialBody === currentAdName);
                      const adNote = adPlanet ? ` ${currentAdName} sits in ${adPlanet.sign} in your ${adPlanet.houseNumber ?? adPlanet.house}${[1,21].includes(adPlanet.houseNumber??adPlanet.house)?'st':[2,22].includes(adPlanet.houseNumber??adPlanet.house)?'nd':[3].includes(adPlanet.houseNumber??adPlanet.house)?'rd':'th'} house, pulling those themes into the foreground of this sub-period.` : '';
                      return <p className="text-xs text-gray-500 leading-relaxed">The {currentAdName} sub-period within your {currentMdName} Mahadasha brings {currentAdName === currentMdName ? 'the pure, undiluted expression of this period\'s themes' : `the qualities of ${currentAdName} into the broader themes of the ${currentMdName} period — coloring the texture of this specific window of time with ${currentAdName}'s particular energy`}.{adNote}</p>;
                    })()}
                  </div>
                )}

                {currentPtName && (
                  <div className="bg-white/40 border border-white/30 rounded-2xl p-3 space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Pratyantardasha (sub-sub-period)</p>
                    <p className="text-xs font-medium text-gray-600">{VEDIC_PLANET_SYM[currentPtName]} {currentPtName} · {currentPtData?.start} → {currentPtData?.end}</p>
                  </div>
                )}
              </div>
            )}

            {/* Full timeline */}
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h2 className="font-playfair text-xl text-gray-700">Your Full Dasha Timeline</h2>
              <div className="space-y-2">
                {Object.entries(allMd).map(([lord, md]) => {
                  const isCurrent = lord === currentMdName;
                  const isPast    = (md.end ?? '') < today;
                  const isFuture  = (md.start ?? '') > today;
                  return (
                    <button key={lord}
                      onClick={() => {
                        const dp = planets.find(pl => pl.celestialBody === lord);
                        const placementLine = dp ? `Your ${lord} sits in ${dp.sign} in the ${dp.houseNumber ?? dp.house}${[1,21,31].includes(dp.houseNumber??dp.house)?'st':[2,22,32].includes(dp.houseNumber??dp.house)?'nd':[3,23].includes(dp.houseNumber??dp.house)?'rd':'th'} house — so this period activates those themes in your life with particular force.` : '';
                        setDetail({ title:`${VEDIC_PLANET_SYM[lord]} ${lord} Mahadasha`, subtitle:`${md.start} → ${md.end}`, body: [DASHA_DESC[lord], placementLine].filter(Boolean).join('\n\n') });
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors ${isCurrent ? 'bg-rose-50/60 border-rose-200/50 hover:bg-rose-50/80' : isPast ? 'bg-gray-50/40 border-gray-200/30 opacity-50 hover:opacity-75' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}>
                      <span className="text-xl w-8 text-center shrink-0">{VEDIC_PLANET_SYM[lord]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700">{lord} Mahadasha</p>
                        <p className="text-xs text-gray-400">{md.start} → {md.end}</p>
                      </div>
                      {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-500 shrink-0">now</span>}
                      {isFuture && <span className="text-xs text-gray-300 shrink-0">upcoming</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Antardasha breakdown */}
            {currentMdName && Object.keys(antardashas).length > 0 && (
              <div className="glass-card rounded-3xl p-6 space-y-3">
                <h2 className="font-playfair text-xl text-gray-700">{currentMdName} Antardasha Periods</h2>
                <p className="text-xs text-gray-400">Sub-periods within your current {currentMdName} Mahadasha. Each brings a distinct planetary flavor into the overarching theme.</p>
                <div className="space-y-1.5">
                  {Object.entries(antardashas).map(([alord, ad]) => {
                    const isCur  = alord === currentAdName;
                    const isPast = (ad.end ?? '') < today;
                    return (
                      <button key={alord}
                        onClick={() => {
                          const adp = planets.find(pl => pl.celestialBody === alord);
                          const adPlaceLine = adp ? `\n\nYour ${alord} is placed in ${adp.sign} in the ${adp.houseNumber ?? adp.house}${[1,21].includes(adp.houseNumber??adp.house)?'st':[2,22].includes(adp.houseNumber??adp.house)?'nd':[3].includes(adp.houseNumber??adp.house)?'rd':'th'} house — so this sub-period brings those themes forward within the overarching ${currentMdName} period.` : '';
                          setDetail({ title:`${alord} Antardasha within ${currentMdName} Mahadasha`, subtitle:`${ad.start} → ${ad.end}`, body:`The ${alord} sub-period within the ${currentMdName} Mahadasha ${alord === currentMdName ? 'expresses the pure, undiluted themes of this period at their most concentrated' : `brings ${alord}'s energy — ${DASHA_DESC[alord]?.split('.')[0] ?? ''} — into the context of the ${currentMdName} major period`}.${adPlaceLine}` });
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left hover:bg-white/50 transition-colors ${isCur ? 'bg-rose-50/60 border-rose-200/40' : isPast ? 'opacity-40 border-white/10' : 'border-white/20'}`}>
                        <span className="w-5 text-center text-gray-400 shrink-0">{VEDIC_PLANET_SYM[alord]}</span>
                        <div className="flex-1">
                          <p className={`text-sm ${isCur ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{alord}</p>
                          <p className="text-xs text-gray-400">{ad.start} → {ad.end}</p>
                        </div>
                        {isCur && <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-400 shrink-0">now</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

        // ── VARGA TAB ──────────────────────────────────────────────────────────
        if (vedicTab === 'varga') {
          const VARGA_EXALT = { Sun:'Aries', Moon:'Taurus', Mars:'Capricorn', Mercury:'Virgo', Jupiter:'Cancer', Venus:'Pisces', Saturn:'Libra' };
          const VARGA_DEBIL = { Sun:'Libra', Moon:'Scorpio', Mars:'Cancer', Mercury:'Pisces', Jupiter:'Capricorn', Venus:'Virgo', Saturn:'Aries' };
          const VARGA_OWN   = { Sun:['Leo'], Moon:['Cancer'], Mars:['Aries','Scorpio'], Mercury:['Gemini','Virgo'], Jupiter:['Sagittarius','Pisces'], Venus:['Taurus','Libra'], Saturn:['Capricorn','Aquarius'] };
          function vargaDig(planet, sign) {
            if (VARGA_EXALT[planet] === sign)    return 'exalted';
            if (VARGA_DEBIL[planet] === sign)    return 'debilitated';
            if (VARGA_OWN[planet]?.includes(sign)) return 'own';
            return null;
          }
          const showVargas = ['d9','d10','d3','d7','d12'].filter(k => divCharts[k]);
          const vargaLabel = { d9:'D9 · Navamsa', d10:'D10 · Dasamsa', d3:'D3 · Drekkana', d7:'D7 · Saptamsa', d12:'D12 · Dwadasamsa' };
          const vargaDesc  = {
            d9: 'The Navamsa is considered the most important divisional chart after D1. It reveals the deeper soul purpose behind this incarnation, the nature of your spouse and marriage, and the spiritual potential that underlies the surface of your natal chart. A planet that is strong in D1 but weak in D9 will deliver less of its promise; a planet weak in D1 but strong in D9 often rises to deliver surprising grace.',
            d10:'The Dasamsa governs career, profession, and your contribution to the world. It reveals the domain and manner in which you are meant to create impact, build your professional reputation, and fulfill your dharma in the public sphere. A strong D10 chart indicates significant professional achievement.',
            d3: 'The Drekkana governs courage, siblings, and your capacity for sustained personal effort. It reveals the quality of your relationship with siblings, your stamina and willpower, and the domain where your independent initiative is most potent.',
            d7: 'The Saptamsa governs children, creativity, and the legacy you leave behind. It reveals your relationship with children, your creative output, and the ways your life force continues beyond your individual existence through what you create and who you nurture.',
            d12:'The Dwadasamsa governs parents, ancestors, and the karmic inheritance of your lineage. It reveals the nature of your relationships with your mother and father, the ancestral patterns you carry, and the blessings and burdens inherited from your lineage.',
          };
          return (
            <div className="space-y-4">
              <div className="glass-card rounded-3xl p-6 space-y-2">
                <h2 className="font-playfair text-xl text-gray-700">Varga Charts · Divisional Charts</h2>
                <p className="text-sm text-gray-500 leading-relaxed">The Varga charts are harmonic divisions of the birth chart, each one a lens that illuminates a specific domain of life with greater precision. Where the D1 (Rasi) chart shows the overall landscape of your karma, the divisional charts reveal the terrain of each specific area — marriage, career, children, parents, and more.</p>
              </div>
              {showVargas.length === 0 && (
                <div className="glass-card rounded-3xl p-8 text-center">
                  <p className="text-sm text-gray-400">Divisional chart data not available.</p>
                </div>
              )}
              {showVargas.map(key => {
                const vc       = divCharts[key];
                const vHouses  = vc?.houses ?? [];
                const vPlanets = vHouses.flatMap(h => (h.occupants ?? []).map(o => ({ ...o, hNum: h.number, hSign: h.sign })));
                const vAsc     = vc?.ascendant;
                const vAscSig  = vAsc?.sign;
                const vAscLord = vAscSig ? SIGN_LORDS[vAscSig] : null;
                return (
                  <div key={key} className="glass-card rounded-3xl p-6 space-y-3">
                    <div>
                      <h3 className="font-playfair text-lg text-gray-700">{vargaLabel[key]}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{vargaDesc[key] ?? VARGA_PURPOSE[key]}</p>
                    </div>
                    {vAscSig && (
                      <div className="flex items-center gap-2 bg-white/50 rounded-2xl px-4 py-2.5 border border-white/40">
                        <span className="text-xs text-gray-400 uppercase tracking-widest">Lagna</span>
                        <span className="text-sm font-medium text-gray-700 ml-1">{vAscSig}</span>
                        {vAscLord && <span className="text-xs text-gray-400">· Ruled by {vAscLord}</span>}
                        {(() => {
                          const dig = vargaDig(vAscLord, vAscSig);
                          const st  = dig ? DIGNITY_STYLE[dig] : null;
                          return st ? <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ml-auto ${st.bg} ${st.color} ${st.border}`}>{st.label}</span> : null;
                        })()}
                      </div>
                    )}
                    {vPlanets.length > 0 ? (
                      <div className="divide-y divide-white/30">
                        {vPlanets.map((p, i) => {
                          const vSign    = p.sign ?? p.hSign;
                          const vSignQ   = SIGN_Q[vSign];
                          const dig      = vargaDig(p.celestialBody, vSign);
                          const digSt    = dig ? DIGNITY_STYLE[dig] : null;
                          const vargaPurpose = VARGA_PURPOSE[key];
                          const d1Planet = planets.find(pl => pl.celestialBody === p.celestialBody);
                          const d1Info   = d1Planet ? `In your birth chart (D1), ${p.celestialBody} sits in ${d1Planet.sign} in house ${d1Planet.houseNumber ?? d1Planet.house}. ` : '';
                          const digNote  = dig === 'exalted'     ? `${p.celestialBody} is exalted in ${vSign} — at its peak strength in this chart.`
                                         : dig === 'debilitated' ? `${p.celestialBody} is debilitated in ${vSign} — challenged in this domain; the lesson becomes the gift.`
                                         : dig === 'own'         ? `${p.celestialBody} is in its own sign — strong, at home, and able to fully express its qualities here.`
                                         : '';
                          const vargaBody = `Your ${p.celestialBody} occupies ${vSign} in the ${vargaLabel[key]}.\n\n${vargaDesc[key] ?? vargaPurpose}\n\n${d1Info}${digNote ? digNote + '\n\n' : ''}${vSignQ ? `In ${vSign}, this domain carries a ${vSignQ.themes} quality — expressed through ${vSignQ.domain}.` : ''}`;
                          return (
                          <button key={i} onClick={() => setDetail({ title:`${VEDIC_PLANET_SYM[p.celestialBody] ?? '•'} ${p.celestialBody} in ${vargaLabel[key]}`, subtitle:`${vSign} · House ${p.hNum}${digSt ? ' · ' + digSt.label : ''}`, tags: digSt ? [digSt.label] : [], body: vargaBody })}
                            className="w-full py-2.5 flex items-center gap-2 text-sm hover:bg-white/40 rounded-xl px-2 -mx-2 transition-colors text-left">
                            <span className="w-6 text-center text-gray-400 shrink-0">{VEDIC_PLANET_SYM[p.celestialBody] ?? '•'}</span>
                            <span className="text-xs text-gray-500 w-20 shrink-0">{p.celestialBody}</span>
                            <span className="text-gray-700 font-medium flex-1">{vSign}</span>
                            {digSt && <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${digSt.bg} ${digSt.color} ${digSt.border}`}>{digSt.label}</span>}
                            <span className="text-xs text-gray-400 shrink-0">H{p.hNum}</span>
                          </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-2">No planets in occupied houses.</p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        // ── STRENGTH TAB ───────────────────────────────────────────────────────
        if (vedicTab === 'strength') {
          const savEntries  = SIGN_ORDER.map(s => ({ sign:s, pts: sav[s] ?? 0 }));
          const maxSav      = Math.max(...savEntries.map(e => e.pts), 1);
          const PLANET_ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
          const shadbalas   = PLANET_ORDER
            .map(name => planets.find(p => p.celestialBody === name))
            .filter(p => p?.shadbala?.Shadbala);
          return (
            <div className="space-y-4">
              {/* Shadbala intro */}
              <div className="glass-card rounded-3xl p-6 space-y-3">
                <div>
                  <h2 className="font-playfair text-xl text-gray-700">Shadbala · Six-Fold Planetary Strength</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">Shadbala is the traditional Vedic system for measuring planetary strength across six distinct dimensions: positional (Sthanabala), directional (Digbala), temporal (Kaalabala), motional (Cheshtabala), natural (Naisargikabala), and aspectual (Drikbala). A planet meeting its minimum required Rupas is considered fully functional and able to deliver its significations completely. Tap any planet for the full breakdown.</p>
                </div>
                <div className="space-y-2">
                  {shadbalas.map(p => {
                    const sb      = p.shadbala.Shadbala;
                    const rupas   = sb.Rupas ?? 0;
                    const minReq  = sb.MinRequired ?? 0;
                    const strong  = sb.MeetsRequirement === 'Yes';
                    const pct     = minReq ? Math.min(rupas / minReq * 100, 120) : 50;
                    return (
                      <button key={p.celestialBody}
                        onClick={() => setDetail({
                          title:`${VEDIC_PLANET_SYM[p.celestialBody]} ${p.celestialBody} · Shadbala`,
                          subtitle:`${rupas.toFixed(2)} Rupas · minimum required: ${minReq}`,
                          tags: [strong ? '✓ Meets requirement' : '✗ Below minimum', p.sign],
                          body: [
                            strong
                              ? `Your ${p.celestialBody} is a strong planet in your chart, scoring ${rupas.toFixed(2)} Rupas against a minimum requirement of ${minReq} — meaning it is fully capable of delivering its significations and fulfilling its promised results.`
                              : `Your ${p.celestialBody} scores ${rupas.toFixed(2)} Rupas, slightly below the required ${minReq}. In Jyotish this indicates the planet may need extra support — through its dasha period, strong aspects, or remedial measures — to fully deliver its results.`,
                            `Sthanabala (positional strength) measures how well ${p.celestialBody} is placed by sign, house, and varga position: ${p.shadbala.Sthanabala?.Total?.toFixed(1) ?? '—'} units.`,
                            `Digbala (directional strength) reflects whether ${p.celestialBody} is in the house of its preferred direction: ${p.shadbala.Digbala?.toFixed?.(1) ?? '—'} units.`,
                            `Kaalabala (temporal strength) measures the time-based strength — day vs night birth, lunar phase, season: ${p.shadbala.Kaalabala?.Total?.toFixed(1) ?? '—'} units.`,
                            `Cheshtabala (motional strength) reflects speed of motion — planets at their fastest or at stations gain strength here: ${p.shadbala.Cheshtabala?.toFixed?.(1) ?? '—'} units.`,
                            `Naisargikabala (natural strength) is fixed for each planet — the Sun is always strongest, Saturn always weakest by nature: ${p.shadbala.Naisargikabala?.toFixed?.(1) ?? '—'} units.`,
                            `Drikbala (aspectual strength) reflects the benefic or malefic aspects the planet receives from others: ${p.shadbala.Drikbala?.toFixed?.(1) ?? '—'} units.`,
                          ].join('\n\n'),
                        })}
                        className="w-full flex items-center gap-3 bg-white/50 border border-white/40 rounded-2xl p-3 hover:bg-white/70 transition-colors text-left">
                        <span className="text-sm w-6 text-center shrink-0">{VEDIC_PLANET_SYM[p.celestialBody]}</span>
                        <span className="text-xs text-gray-500 w-16 shrink-0">{p.celestialBody}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">{rupas.toFixed(2)} / {minReq} rupas</span>
                            <span className={`text-xs ${strong ? 'text-green-500' : 'text-orange-400'}`}>{strong ? '✓ strong' : '✗ weak'}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${strong ? 'bg-green-400' : 'bg-orange-300'}`} style={{ width:`${Math.min(pct,100)}%` }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {shadbalas.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Shadbala data not available.</p>}
                </div>
              </div>

              {/* Ashtakavarga */}
              <div className="glass-card rounded-3xl p-6 space-y-4">
                <div>
                  <h2 className="font-playfair text-xl text-gray-700">Sarvashtakavarga</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">The Ashtakavarga system assigns benefic points to each sign from the perspective of each of the 7 classical planets plus the Lagna. The Sarvashtakavarga (SAV) is the total of all contributions — a maximum of 56 points per sign. Signs with 28 or more points are considered strong and productive for transits and periods; signs with fewer than 25 points indicate areas of the chart requiring more careful navigation.</p>
                </div>
                {savEntries.some(e => e.pts > 0) ? (
                  <div className="space-y-1.5">
                    {savEntries.map(({ sign, pts }) => {
                      const signPlanets = planets.filter(p => p.sign === sign).map(p => p.celestialBody);
                      const quality = pts >= 28 ? 'strong and productive' : pts >= 25 ? 'moderately supportive' : 'more challenging';
                      const transitNote = pts >= 28
                        ? `Transiting planets moving through ${sign} tend to give good and productive results for you — this is one of your most favorable signs for new ventures, important meetings, and key decisions made during those windows.`
                        : pts >= 25
                        ? `Transiting planets through ${sign} give moderate results — neither especially favored nor difficult. Standard care and awareness applies during these windows.`
                        : `Transiting planets through ${sign} require more careful navigation — this is not your most favorable sign for new ventures, and it benefits from extra mindfulness during transit periods here.`;
                      const occupantNote = signPlanets.length ? `Your natal ${signPlanets.join(' and ')} ${signPlanets.length === 1 ? 'is' : 'are'} placed in ${sign}, making this sign especially significant in your chart.` : '';
                      return (
                        <button key={sign} onClick={() => setDetail({ title:`${sign} · SAV ${pts}`, subtitle:`Sarvashtakavarga · ${quality}`, body: `${sign} has ${pts} Sarvashtakavarga points out of a maximum of 56.\n\n${transitNote}\n\n${occupantNote}`.trim() })}
                          className="w-full flex items-center gap-2 hover:bg-white/40 rounded-xl px-2 py-1 -mx-2 transition-colors text-left">
                          <span className="text-xs text-gray-500 w-24 shrink-0">{sign}</span>
                          <div className="flex-1 h-2 rounded-full bg-white/60 overflow-hidden">
                            <div className={`h-full rounded-full ${pts >= 28 ? 'bg-green-400' : pts >= 25 ? 'bg-amber-400' : 'bg-rose-300'}`} style={{ width:`${(pts/maxSav)*100}%` }} />
                          </div>
                          <span className={`text-xs w-6 text-right shrink-0 font-medium ${pts >= 28 ? 'text-green-600' : pts >= 25 ? 'text-amber-600' : 'text-rose-400'}`}>{pts}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : <p className="text-sm text-gray-400 text-center py-4">Ashtakavarga data not available.</p>}
              </div>

              {/* Bhinnashtakavarga */}
              {Object.values(bhavMap).some(b => Object.keys(b).length > 0) && (
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <div>
                    <h2 className="font-playfair text-xl text-gray-700">Bhinnashtakavarga</h2>
                    <p className="text-xs text-gray-400 mt-1">Each planet's individual contribution of benefic points across the 12 signs. Green (4+) = strong · Amber (3) = moderate · Rose (0-2) = weak.</p>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(bhavMap).filter(([,b]) => Object.keys(b).length > 0).map(([planet, signPts]) => (
                      <div key={planet}>
                        <p className="text-xs font-medium text-gray-500 mb-1.5">{VEDIC_PLANET_SYM[planet]} {planet}</p>
                        <div className="flex gap-1">
                          {SIGN_ORDER.map(s => {
                            const pts = signPts[s] ?? 0;
                            return (
                              <div key={s} className="flex-1 text-center">
                                <div className={`h-5 rounded-sm mx-0.5 flex items-center justify-center ${pts >= 4 ? 'bg-green-200' : pts === 3 ? 'bg-amber-100' : 'bg-rose-100'}`}>
                                  <span className="text-[9px] font-medium text-gray-600">{pts}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex text-[8px] text-gray-300 mt-0.5">
                          {SIGN_ORDER.map(s => <div key={s} className="flex-1 text-center truncate px-0.5">{s.slice(0,3)}</div>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        return null;
      })()}

    </div>
  );
}
