import { GATE_WHEEL } from './hd-common.js';

const ZODIAC = [
  { sign: 'Aries',       element: 'fire',  modality: 'cardinal', from: [3,21],  to: [4,19]  },
  { sign: 'Taurus',      element: 'earth', modality: 'fixed',    from: [4,20],  to: [5,20]  },
  { sign: 'Gemini',      element: 'air',   modality: 'mutable',  from: [5,21],  to: [6,20]  },
  { sign: 'Cancer',      element: 'water', modality: 'cardinal', from: [6,21],  to: [7,22]  },
  { sign: 'Leo',         element: 'fire',  modality: 'fixed',    from: [7,23],  to: [8,22]  },
  { sign: 'Virgo',       element: 'earth', modality: 'mutable',  from: [8,23],  to: [9,22]  },
  { sign: 'Libra',       element: 'air',   modality: 'cardinal', from: [9,23],  to: [10,22] },
  { sign: 'Scorpio',     element: 'water', modality: 'fixed',    from: [10,23], to: [11,21] },
  { sign: 'Sagittarius', element: 'fire',  modality: 'mutable',  from: [11,22], to: [12,21] },
  { sign: 'Capricorn',   element: 'earth', modality: 'cardinal', from: [12,22], to: [1,19]  },
  { sign: 'Aquarius',    element: 'air',   modality: 'fixed',    from: [1,20],  to: [2,18]  },
  { sign: 'Pisces',      element: 'water', modality: 'mutable',  from: [2,19],  to: [3,20]  },
];

function inRange(month, day, from, to) {
  const [fm, fd] = from;
  const [tm, td] = to;
  if (fm <= tm) {
    if (month < fm || month > tm) return false;
    if (month === fm && day < fd) return false;
    if (month === tm && day > td) return false;
    return true;
  } else {
    // Wrap-around case (Capricorn: Dec 22 – Jan 19)
    if (month === fm) return day >= fd;
    if (month === tm) return day <= td;
    return month > fm || month < tm;
  }
}

function getSunSign(dateStr, sidereal = false) {
  let d = new Date(dateStr + 'T12:00:00');
  if (sidereal) {
    // Simplified ayanamsha ≈ 24° → subtract 24 days
    d = new Date(d.getTime() - 24 * 24 * 60 * 60 * 1000);
  }
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return ZODIAC.find(z => inRange(month, day, z.from, z.to)) ?? null;
}

function getMoonSignApprox(dateStr, timeStr) {
  // Moon moves ~1 sign per 2.3 days; anchor: Jan 6 2000 new moon in Capricorn (index 9)
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const dateTime = new Date(dateStr + 'T' + (timeStr || '12:00') + ':00');
  const daysElapsed = (dateTime - knownNewMoon) / (1000 * 60 * 60 * 24);
  const signIndex = (9 + Math.floor(Math.abs(daysElapsed) / 2.3)) % 12;
  return ZODIAC[signIndex];
}

// ─── Lunar phase ──────────────────────────────────────────────────────────────
// Moon phase shifts every 3–4 days — primary source of daily variation
export function getLunarPhase(todayStr) {
  const SYNODIC_MONTH = 29.53058867;
  const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z');
  const today = new Date(todayStr + 'T12:00:00Z');
  const daysSince = (today - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const cyclePos = ((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const angle = (cyclePos / SYNODIC_MONTH) * 360;

  if (angle < 45)  return { name: 'New Moon',        emoji: '🌑', element: 'water', energy: 'seeding'      };
  if (angle < 90)  return { name: 'Waxing Crescent', emoji: '🌒', element: 'fire',  energy: 'intention'    };
  if (angle < 135) return { name: 'First Quarter',   emoji: '🌓', element: 'air',   energy: 'action'       };
  if (angle < 180) return { name: 'Waxing Gibbous',  emoji: '🌔', element: 'earth', energy: 'refinement'   };
  if (angle < 225) return { name: 'Full Moon',        emoji: '🌕', element: 'air',   energy: 'illumination' };
  if (angle < 270) return { name: 'Waning Gibbous',  emoji: '🌖', element: 'water', energy: 'gratitude'    };
  if (angle < 315) return { name: 'Last Quarter',    emoji: '🌗', element: 'earth', energy: 'release'      };
  return                  { name: 'Waning Crescent', emoji: '🌘', element: 'water', energy: 'surrender'    };
}

// ─── Day ruler ────────────────────────────────────────────────────────────────
// Each day of the week is ruled by a planet — changes every day
function getDayRuler(todayStr) {
  const day = new Date(todayStr + 'T12:00:00').getDay(); // 0=Sun … 6=Sat
  return [
    { planet: 'Sun',     element: 'fire'  }, // Sunday
    { planet: 'Moon',    element: 'water' }, // Monday
    { planet: 'Mars',    element: 'fire'  }, // Tuesday
    { planet: 'Mercury', element: 'air'   }, // Wednesday
    { planet: 'Jupiter', element: 'fire'  }, // Thursday
    { planet: 'Venus',   element: 'earth' }, // Friday
    { planet: 'Saturn',  element: 'earth' }, // Saturday
  ][day];
}

// ─── Season ───────────────────────────────────────────────────────────────────
// Astronomical seasons by equinox / solstice (northern hemisphere)
function getSeason(todayStr) {
  const d = new Date(todayStr + 'T12:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 3 && day >= 20) || m === 4 || m === 5 || (m === 6 && day < 21))
    return { name: 'Spring', element: 'air'   };
  if ((m === 6 && day >= 21) || m === 7 || m === 8 || (m === 9 && day < 23))
    return { name: 'Summer', element: 'fire'  };
  if ((m === 9 && day >= 23) || m === 10 || m === 11 || (m === 12 && day < 22))
    return { name: 'Autumn', element: 'water' };
  return { name: 'Winter', element: 'earth' };
}

function getLifePath(dateStr) {
  const digits = dateStr.replace(/-/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

export function computeChart(birthData, todayStr) {
  if (!birthData?.date) return null;

  const sidereal = birthData.system === 'sidereal' || birthData.system === 'vedic';

  // ── Natal ──────────────────────────────────────────────────────────────────
  const sunSign  = getSunSign(birthData.date, sidereal);
  const moonSign = getMoonSignApprox(birthData.date, birthData.time);
  const lifePath = getLifePath(birthData.date);

  // ── Today's cosmic weather ─────────────────────────────────────────────────
  // These change daily / every few days and are the primary driver of variation
  const transitSunSign  = getSunSign(todayStr, false);
  const transitMoonSign = getMoonSignApprox(todayStr, '12:00');
  const lunarPhase      = getLunarPhase(todayStr);
  const dayRuler        = getDayRuler(todayStr);
  const season          = getSeason(todayStr);

  // ── Daily blend ────────────────────────────────────────────────────────────
  // Transits drive today's energy (70%), natal chart provides personal resonance (30%).
  // The remaining 30% of content picks are pure chance — space for your higher power.
  const weights = { fire: 0, earth: 0, air: 0, water: 0 };

  // Natal (30% of blend weight)
  if (sunSign?.element)  weights[sunSign.element]  += 2; // who you fundamentally are
  if (moonSign?.element) weights[moonSign.element] += 1; // your emotional undercurrent

  // Cosmic transits (70% of blend weight)
  if (transitMoonSign?.element) weights[transitMoonSign.element] += 3; // moon: shifts every 2.5 days
  if (lunarPhase?.element)      weights[lunarPhase.element]      += 2; // phase: shifts every 3–4 days
  if (transitSunSign?.element)  weights[transitSunSign.element]  += 2; // sun: collective monthly energy
  if (dayRuler?.element)        weights[dayRuler.element]        += 1; // planetary day tone
  if (season?.element)          weights[season.element]          += 1; // seasonal backdrop

  // HD center → element mapping (adds at most ~2 pts per element, keeps transit dominance)
  const _CENTER_EL = {
    Head: 'air', Ajna: 'air', Throat: 'air', G: 'fire', Will: 'fire',
    Sacral: 'earth', Root: 'earth', SolarPlexus: 'water', Spleen: 'water',
  };
  (birthData.hdDefinedCenters ?? []).forEach(c => {
    if (_CENTER_EL[c]) weights[_CENTER_EL[c]] += 1;
  });

  // Ranked array of elements — most cosmically active today listed first
  const dailyBlend = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .map(([el]) => el);

  return {
    // Natal
    sunSign,
    moonSign,
    sunElement:  sunSign?.element  ?? null,
    moonElement: moonSign?.element ?? null,
    sunModality: sunSign?.modality ?? null,
    lifePath,
    hdType:           birthData.hdType            ?? null,
    hdProfile:        birthData.hdProfile         ?? null,
    hdProfileLine1:   birthData.hdProfileLine1    ?? null,
    hdProfileLine2:   birthData.hdProfileLine2    ?? null,
    hdAuthority:      birthData.hdAuthority       ?? null,
    hdDefinedCenters: birthData.hdDefinedCenters  ?? [],
    hdDefinedChannels:birthData.hdDefinedChannels ?? [],
    hdAllGates:       birthData.hdAllGates        ?? [],
    system:  birthData.system,

    // Today's cosmic weather
    transitSunSign,
    transitMoonSign,
    transitSunElement:  transitSunSign?.element  ?? null,
    transitMoonElement: transitMoonSign?.element ?? null,
    lunarPhase,
    dayRuler,
    season,

    // Primary selection driver — changes daily based on transits
    dailyBlend,
  };
}

// ─── Shared aspect definitions (9 aspects) ──────────────────────────────────
export const ASPECT_DEFS = [
  { name: 'Conjunction',    angle:   0, orb: 8 },
  { name: 'Semisextile',    angle:  30, orb: 2 },
  { name: 'Semisquare',     angle:  45, orb: 2 },
  { name: 'Sextile',        angle:  60, orb: 4 },
  { name: 'Square',         angle:  90, orb: 6 },
  { name: 'Trine',          angle: 120, orb: 6 },
  { name: 'Sesquiquadrate', angle: 135, orb: 2 },
  { name: 'Quincunx',       angle: 150, orb: 3 },
  { name: 'Opposition',     angle: 180, orb: 8 },
];

// ─── Gate+line → ecliptic longitude ──────────────────────────────────────────
export function gateLineToLon(gate, line) {
  const idx = GATE_WHEEL.indexOf(gate);
  if (idx === -1) return 0;
  return ((302 + idx * 5.625 + (line - 0.5) * 0.9375) % 360 + 360) % 360;
}

// ─── Transit-to-natal cross-aspects ──────────────────────────────────────────
export function computeCrossAspects(natalLons, transitLons) {
  const aspects = [];
  for (const [transitBody, tLon] of Object.entries(transitLons)) {
    for (const [natalBody, nLon] of Object.entries(natalLons)) {
      const diff  = ((tLon - nLon) % 360 + 360) % 360;
      const angle = Math.min(diff, 360 - diff);
      for (const asp of ASPECT_DEFS) {
        if (Math.abs(angle - asp.angle) <= asp.orb) {
          aspects.push({ transit: transitBody, natal: natalBody, name: asp.name, angle: asp.angle });
          break;
        }
      }
    }
  }
  return aspects;
}

// ─── Personal year (numerology) ──────────────────────────────────────────────
export function getPersonalYear(birthDateStr, todayStr) {
  const [bm, bd] = birthDateStr.split('-').slice(1).map(Number);
  const year = parseInt(todayStr.split('-')[0], 10);
  const digits = `${bm}${bd}${year}`.split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum > 9 ? (sum % 9 || 9) : sum; // reduce master numbers to 1-9 for matching
}

// ─── Vedic Panchanga (client-side approximation) ─────────────────────────────
// Uses Lahiri ayanamsha ≈ 24.17° (2025 epoch, drifts ~0.014°/yr — close enough)
const LAHIRI_AYANAMSHA = 24.17;

export const NAKSHATRA_META = [
  { name: 'Ashwini',       animal: 'horse',    lord: 'Ketu',    element: 'fire'  },
  { name: 'Bharani',       animal: 'elephant',  lord: 'Venus',   element: 'earth' },
  { name: 'Krittika',      animal: 'goat',      lord: 'Sun',     element: 'fire'  },
  { name: 'Rohini',        animal: 'serpent',   lord: 'Moon',    element: 'earth' },
  { name: 'Mrigashira',    animal: 'serpent',   lord: 'Mars',    element: 'air'   },
  { name: 'Ardra',         animal: 'dog',       lord: 'Rahu',    element: 'water' },
  { name: 'Punarvasu',     animal: 'cat',       lord: 'Jupiter', element: 'air'   },
  { name: 'Pushya',        animal: 'goat',      lord: 'Saturn',  element: 'water' },
  { name: 'Ashlesha',      animal: 'cat',       lord: 'Mercury', element: 'water' },
  { name: 'Magha',         animal: 'rat',       lord: 'Ketu',    element: 'fire'  },
  { name: 'Purva Phalguni',animal: 'rat',       lord: 'Venus',   element: 'fire'  },
  { name: 'Uttara Phalguni',animal:'cow',       lord: 'Sun',     element: 'earth' },
  { name: 'Hasta',         animal: 'buffalo',   lord: 'Moon',    element: 'air'   },
  { name: 'Chitra',        animal: 'tiger',     lord: 'Mars',    element: 'fire'  },
  { name: 'Swati',         animal: 'buffalo',   lord: 'Rahu',    element: 'air'   },
  { name: 'Vishakha',      animal: 'tiger',     lord: 'Jupiter', element: 'fire'  },
  { name: 'Anuradha',      animal: 'deer',      lord: 'Saturn',  element: 'water' },
  { name: 'Jyeshtha',      animal: 'deer',      lord: 'Mercury', element: 'water' },
  { name: 'Mula',          animal: 'dog',       lord: 'Ketu',    element: 'fire'  },
  { name: 'Purva Ashadha', animal: 'monkey',    lord: 'Venus',   element: 'earth' },
  { name: 'Uttara Ashadha',animal: 'mongoose',  lord: 'Sun',     element: 'earth' },
  { name: 'Shravana',      animal: 'monkey',    lord: 'Moon',    element: 'air'   },
  { name: 'Dhanishta',     animal: 'lion',      lord: 'Mars',    element: 'air'   },
  { name: 'Shatabhisha',   animal: 'horse',     lord: 'Rahu',    element: 'air'   },
  { name: 'Purva Bhadrapada',animal:'lion',     lord: 'Jupiter', element: 'water' },
  { name: 'Uttara Bhadrapada',animal:'cow',     lord: 'Saturn',  element: 'water' },
  { name: 'Revati',        animal: 'elephant',  lord: 'Mercury', element: 'earth' },
];

export function computePanchanga(sunLon, moonLon) {
  const sideralMoon = ((moonLon - LAHIRI_AYANAMSHA) % 360 + 360) % 360;
  const sideralSun  = ((sunLon  - LAHIRI_AYANAMSHA) % 360 + 360) % 360;

  // Nakshatra (Moon's sidereal position / 13.333°)
  const nakIdx = Math.floor(sideralMoon / (360 / 27)) % 27;
  const nakshatra = NAKSHATRA_META[nakIdx];

  // Tithi (Moon–Sun elongation / 12°, 30 tithis)
  const elongation = ((moonLon - sunLon) % 360 + 360) % 360;
  const tithiNum = Math.floor(elongation / 12) + 1; // 1–30

  // Yoga (Sun + Moon sidereal positions / 13.333°, 27 yogas)
  const yogaSum = ((sideralSun + sideralMoon) % 360 + 360) % 360;
  const yogaIdx = Math.floor(yogaSum / (360 / 27)) % 27;

  return { nakshatra, nakIdx, tithiNum, yogaIdx };
}
