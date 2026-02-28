const ZODIAC = [
  { sign: 'Aries',       element: 'fire',  from: [3,21],  to: [4,19]  },
  { sign: 'Taurus',      element: 'earth', from: [4,20],  to: [5,20]  },
  { sign: 'Gemini',      element: 'air',   from: [5,21],  to: [6,20]  },
  { sign: 'Cancer',      element: 'water', from: [6,21],  to: [7,22]  },
  { sign: 'Leo',         element: 'fire',  from: [7,23],  to: [8,22]  },
  { sign: 'Virgo',       element: 'earth', from: [8,23],  to: [9,22]  },
  { sign: 'Libra',       element: 'air',   from: [9,23],  to: [10,22] },
  { sign: 'Scorpio',     element: 'water', from: [10,23], to: [11,21] },
  { sign: 'Sagittarius', element: 'fire',  from: [11,22], to: [12,21] },
  { sign: 'Capricorn',   element: 'earth', from: [12,22], to: [1,19]  },
  { sign: 'Aquarius',    element: 'air',   from: [1,20],  to: [2,18]  },
  { sign: 'Pisces',      element: 'water', from: [2,19],  to: [3,20]  },
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
  // Moon moves ~1 sign per 2.3 days; anchor: Jan 6 2000 new moon in Capricorn
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const dateTime = new Date(dateStr + 'T' + (timeStr || '12:00') + ':00');
  const daysElapsed = (dateTime - knownNewMoon) / (1000 * 60 * 60 * 24);
  const signIndex = Math.floor(Math.abs(daysElapsed) / 2.3) % 12;
  return ZODIAC[signIndex];
}

function getLifePath(dateStr) {
  // Sum all digits of YYYY-MM-DD, reduce to 1–9 (master numbers 11, 22, 33 kept)
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
  const sunSign = getSunSign(birthData.date, sidereal);
  const moonSign = getMoonSignApprox(birthData.date, birthData.time);
  const todaySunSign = getSunSign(todayStr, false);
  const lifePath = getLifePath(birthData.date);
  return {
    sunSign,
    moonSign,
    sunElement: sunSign?.element ?? null,
    moonElement: moonSign?.element ?? null,
    todayElement: todaySunSign?.element ?? null,
    lifePath,
    hdType: birthData.hdType ?? null,
    system: birthData.system,
  };
}
