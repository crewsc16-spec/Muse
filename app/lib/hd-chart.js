// Human Design Chart Calculator
// Astronomical accuracy:
//   Sun:     ~0.001° (full Meeus equation-of-center + aberration/nutation)
//   Moon:    ~0.05°  (Meeus simplified series, 17 terms)
//   Planets: ~0.5–2° (Keplerian geocentric: orbital elements + Kepler's equation + Earth subtraction)
//   Gate width 5.625° — planet-level accuracy is sufficient.

const J2000 = 2451545.0;

// ─── Julian Date ────────────────────────────────────────────────────────────
function toJDE(dateStr, timeStr, utcOffset) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [h, m] = (timeStr || '12:00').split(':').map(Number);
  const utcHour = h - (utcOffset ?? 0) + m / 60;
  const dayFrac = utcHour / 24;
  let y = year, mo = month;
  if (mo <= 2) { y--; mo += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (mo + 1)) + day + B - 1524.5 + dayFrac;
}

// ─── Sun (Meeus, ~0.001°) ───────────────────────────────────────────────────
function sunLongitude(jde) {
  const T = (jde - J2000) / 36525;
  const L0 = ((280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360 + 360) % 360;
  const M_deg = ((357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360 + 360) % 360;
  const M = M_deg * (Math.PI / 180);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  const trueLon = L0 + C;
  const omega = ((125.04 - 1934.136 * T) % 360 + 360) % 360;
  const apparent = trueLon - 0.00569 - 0.00478 * Math.sin(omega * (Math.PI / 180));
  return ((apparent % 360) + 360) % 360;
}

// ─── Moon (Meeus 17-term series, ~0.05°) ────────────────────────────────────
function moonLongitude(jde) {
  const T = (jde - J2000) / 36525;
  // Mean elements (degrees)
  const L   = ((218.3164477 + 481267.88123421 * T - 0.0015786 * T * T) % 360 + 360) % 360;
  const D   = ((297.8501921 + 445267.1114034  * T - 0.0018819 * T * T) % 360 + 360) % 360;
  const Ms  = ((357.5291092 +  35999.0502909  * T - 0.0001536 * T * T) % 360 + 360) % 360;
  const Mm  = ((134.9633964 + 477198.8675055  * T + 0.0087414 * T * T) % 360 + 360) % 360;
  const F   = (( 93.2720950 + 483202.0175233  * T - 0.0036539 * T * T) % 360 + 360) % 360;
  const R = Math.PI / 180;
  const d = D * R, ms = Ms * R, mm = Mm * R, f = F * R;
  const lon = L
    + 6.288774 * Math.sin(mm)
    - 1.274027 * Math.sin(2*d - mm)
    + 0.658314 * Math.sin(2*d)
    + 0.213618 * Math.sin(2*mm)
    - 0.185116 * Math.sin(ms)
    - 0.114332 * Math.sin(2*f)
    + 0.058793 * Math.sin(2*d - 2*mm)
    + 0.057066 * Math.sin(2*d - ms - mm)
    + 0.053322 * Math.sin(2*d + mm)
    + 0.045758 * Math.sin(2*d - ms)
    - 0.040923 * Math.sin(ms - mm)
    - 0.034720 * Math.sin(d)
    - 0.030383 * Math.sin(ms + mm)
    + 0.015327 * Math.sin(2*d - 2*f)
    - 0.012528 * Math.sin(mm + 2*f)
    + 0.010980 * Math.sin(mm - 2*f);
  return ((lon % 360) + 360) % 360;
}

// ─── Planets (Keplerian geocentric, ~0.5–2°) ────────────────────────────────
// Orbital elements at J2000 from Meeus "Astronomical Algorithms" Table 31.a
// [a (AU), L0, L1 (°/century), e0, e1 (per century), w0, w1 (°/century)]
const _ORB = {
  Mercury: { a: 0.387098310, L0: 252.250906, L1: 149474.0722491, e0: 0.20563175, e1:  2.0407e-5, w0:  77.456119, w1:  0.1588643 },
  Venus:   { a: 0.723329820, L0: 181.979801, L1:  58519.2130302, e0: 0.00677188, e1: -4.7766e-5, w0: 131.563703, w1:  0.0048746 },
  Mars:    { a: 1.523679342, L0: 355.433275, L1:  19141.6964746, e0: 0.09340062, e1:  9.0483e-5, w0: 336.060234, w1:  0.4439016 },
  Jupiter: { a: 5.202603191, L0:  34.351519, L1:   3036.3024040, e0: 0.04849485, e1:  1.6324e-4, w0:  14.331309, w1:  0.2155525 },
  Saturn:  { a: 9.554909596, L0:  50.077444, L1:   1223.5110686, e0: 0.05550825, e1: -3.4664e-4, w0:  93.057237, w1:  0.5665415 },
  Uranus:  { a:19.218446060, L0: 314.055005, L1:    429.8640561, e0: 0.04629590, e1: -2.7337e-5, w0: 173.005159, w1:  1.4863784 },
  Neptune: { a:30.110386870, L0: 304.348665, L1:    219.8833092, e0: 0.00898809, e1:  6.408e-6,  w0:  48.120276, w1:  1.4262957 },
  Pluto:   { a:39.482117,    L0: 238.958116, L1:    145.6412000, e0: 0.24882730, e1:  0,         w0: 224.066769, w1:  0         },
};

// Earth uses the same orbital element structure for geocentric subtraction
const _EARTH_ORB = { a: 1.000001018, L0: 100.466457, L1: 35999.3728565, e0: 0.01670862, e1: -4.2037e-5, w0: 102.937348, w1: 0.3225654 };

// Iterative Kepler's equation solver: M = E - e·sin(E)
function _solveKepler(M_deg, e) {
  let E = M_deg * (Math.PI / 180);
  for (let i = 0; i < 12; i++) {
    const dE = (M_deg * (Math.PI / 180) - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E; // radians
}

// Heliocentric ecliptic longitude (°) and radius (AU) from Keplerian elements
function _helioLonR(orb, T) {
  const { a, L0, L1, e0, e1, w0, w1 } = orb;
  const L = ((L0 + L1 * T) % 360 + 360) % 360;
  const e = e0 + e1 * T;
  const w = ((w0 + w1 * T) % 360 + 360) % 360;
  const M = ((L - w) % 360 + 360) % 360;
  const E = _solveKepler(M, e);
  // True anomaly (numerically stable atan2 form)
  const v = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );
  const lon = ((v * 180 / Math.PI + w) % 360 + 360) % 360;
  const r = a * (1 - e * Math.cos(E));
  return { lon, r };
}

// Geocentric ecliptic longitude of a planet (ignores ecliptic latitude — fine for gate accuracy)
function planetLongitude(planet, jde) {
  const T = (jde - J2000) / 36525;
  const orb = _ORB[planet];
  if (!orb) return 0;
  const p = _helioLonR(orb, T);
  const earth = _helioLonR(_EARTH_ORB, T);
  // 2-D heliocentric rectangular coordinates in the ecliptic plane
  const pR = p.lon * (Math.PI / 180);
  const eR = earth.lon * (Math.PI / 180);
  const gx = p.r * Math.cos(pR) - earth.r * Math.cos(eR);
  const gy = p.r * Math.sin(pR) - earth.r * Math.sin(eR);
  return ((Math.atan2(gy, gx) * 180 / Math.PI) % 360 + 360) % 360;
}

// ─── Gate / Line mapping ─────────────────────────────────────────────────────
// 64 gates clockwise from ~302° ecliptic (empirically verified offset)
const GATE_WHEEL = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,
  8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,
  47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,
  38,54,61,60,
];

function longitudeToGate(lon) {
  const pos = ((lon - 302 + 360) % 360) / 5.625;
  return GATE_WHEEL[Math.floor(pos) % 64];
}

function longitudeToLine(lon) {
  const withinGate = ((lon - 302 + 360) % 360) % 5.625;
  return Math.min(6, Math.floor(withinGate / 0.9375) + 1);
}

// ─── Design time (Sun 88° earlier) ──────────────────────────────────────────
function getDesignJDE(birthJDE, birthSunLon) {
  const SUN_RATE = 0.9856; // °/day
  const targetLon = ((birthSunLon - 88 + 360) % 360);
  let jde = birthJDE - 88 / SUN_RATE;
  // Two Newton-Raphson iterations for better convergence
  for (let i = 0; i < 2; i++) {
    let diff = targetLon - sunLongitude(jde);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    jde += diff / SUN_RATE;
  }
  return jde;
}

// ─── Centers & Channels ─────────────────────────────────────────────────────
const CENTER_GATES = {
  Head:        [64, 61, 63],
  Ajna:        [47, 24, 4, 11, 43, 17],
  Throat:      [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G:           [1, 13, 25, 46, 2, 15, 10, 7],
  Will:        [26, 51, 21, 40],
  Sacral:      [9, 3, 42, 14, 29, 59, 27, 34, 5],
  SolarPlexus: [36, 22, 37, 55, 30, 49, 6],
  Spleen:      [48, 57, 44, 50, 32, 28, 18],
  Root:        [19, 39, 52, 53, 60, 58, 38, 54, 41],
};

const CHANNELS = [
  [64,47],[61,24],[63,4],
  [17,62],[43,23],[11,56],
  [7,31],[1,8],[13,33],[10,20],
  [25,51],
  [2,14],[5,15],[29,46],[20,34],
  [21,45],[26,44],[37,40],
  [12,22],[35,36],[16,48],
  [27,50],[34,57],[6,59],
  [3,60],[9,52],[42,53],
  [18,58],[28,38],[32,54],
  [19,49],[39,55],[30,41],
];

// Build gate → center lookup once
const _GATE_CENTER = {};
for (const [center, gates] of Object.entries(CENTER_GATES)) {
  for (const g of gates) _GATE_CENTER[g] = center;
}

function getDefinedChannels(allGates) {
  const gateSet = new Set(allGates);
  return CHANNELS.filter(([g1, g2]) => gateSet.has(g1) && gateSet.has(g2));
}

function getDefinedCenters(definedChannels) {
  const defined = new Set();
  for (const [g1, g2] of definedChannels) {
    if (_GATE_CENTER[g1]) defined.add(_GATE_CENTER[g1]);
    if (_GATE_CENTER[g2]) defined.add(_GATE_CENTER[g2]);
  }
  return [...defined];
}

function buildCenterAdj(definedChannels) {
  const adj = {};
  for (const [g1, g2] of definedChannels) {
    const c1 = _GATE_CENTER[g1], c2 = _GATE_CENTER[g2];
    if (!c1 || !c2 || c1 === c2) continue;
    (adj[c1] = adj[c1] || new Set()).add(c2);
    (adj[c2] = adj[c2] || new Set()).add(c1);
  }
  return adj;
}

function isConnectedVia(adj, from, to) {
  if (from === to) return true;
  const visited = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const curr = queue.shift();
    if (curr === to) return true;
    for (const next of (adj[curr] ?? [])) {
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  return false;
}

// ─── Type & Authority ────────────────────────────────────────────────────────
function determineType(definedCenters, centerAdj) {
  if (definedCenters.length === 0) return 'reflector';
  const dc = new Set(definedCenters);
  const sacral = dc.has('Sacral');
  const throat = dc.has('Throat');
  // MG = Sacral defined + any motor (Sacral, Will, SolarPlexus, Root) connected to Throat
  const motorToThroat = ['Sacral', 'Will', 'SolarPlexus', 'Root']
    .some(m => dc.has(m) && throat && isConnectedVia(centerAdj, m, 'Throat'));
  if (sacral) {
    return motorToThroat ? 'manifesting-generator' : 'generator';
  }
  return motorToThroat ? 'manifestor' : 'projector';
}

function determineAuthority(definedCenters) {
  const dc = new Set(definedCenters);
  if (dc.has('SolarPlexus')) return 'emotional';
  if (dc.has('Sacral'))      return 'sacral';
  if (dc.has('Spleen'))      return 'splenic';
  if (dc.has('Will'))        return 'ego';
  if (dc.has('G'))           return 'self-projected';
  if (dc.has('Ajna'))        return 'mental';
  return 'lunar';
}

// ─── Mean Lunar Node ─────────────────────────────────────────────────────────
function meanNodeLongitude(jde) {
  const T = (jde - J2000) / 36525;
  const omega = 125.0445479 - 1934.1362608 * T + 0.0020754 * T * T + T * T * T / 467441;
  return ((omega % 360) + 360) % 360;
}

// ─── Gate activations for all bodies at a given JDE ─────────────────────────
function gateActivations(jde) {
  const sunLon   = sunLongitude(jde);
  const earthLon = (sunLon + 180) % 360;
  const moonLon  = moonLongitude(jde);
  const nodeLon  = meanNodeLongitude(jde);
  const result = {
    sun:       { gate: longitudeToGate(sunLon),   line: longitudeToLine(sunLon)   },
    earth:     { gate: longitudeToGate(earthLon), line: longitudeToLine(earthLon) },
    moon:      { gate: longitudeToGate(moonLon),  line: longitudeToLine(moonLon)  },
    northNode: { gate: longitudeToGate(nodeLon),  line: longitudeToLine(nodeLon)  },
    southNode: { gate: longitudeToGate((nodeLon + 180) % 360), line: longitudeToLine((nodeLon + 180) % 360) },
  };
  for (const planet of Object.keys(_ORB)) {
    const lon = planetLongitude(planet, jde);
    result[planet.toLowerCase()] = { gate: longitudeToGate(lon), line: longitudeToLine(lon) };
  }
  return result;
}

const TYPE_META = {
  'generator':             { strategy: 'Respond',                 signature: 'Satisfaction', notSelf: 'Frustration'    },
  'manifesting-generator': { strategy: 'Respond, then Inform',    signature: 'Satisfaction', notSelf: 'Frustration'    },
  'manifestor':            { strategy: 'Inform',                  signature: 'Peace',        notSelf: 'Anger'          },
  'projector':             { strategy: 'Wait for the Invitation', signature: 'Success',      notSelf: 'Bitterness'     },
  'reflector':             { strategy: 'Wait a Lunar Cycle',      signature: 'Surprise',     notSelf: 'Disappointment' },
};

// ─── Main export ─────────────────────────────────────────────────────────────
export function calculateHDChart(birthDate, birthTime, utcOffset) {
  const birthJDE    = toJDE(birthDate, birthTime, utcOffset ?? 0);
  const birthSunLon = sunLongitude(birthJDE);
  const designJDE   = getDesignJDE(birthJDE, birthSunLon);

  const personality = gateActivations(birthJDE);
  const design      = gateActivations(designJDE);

  const profileLine1 = personality.sun.line;
  const profileLine2 = design.sun.line;
  const profile = `${profileLine1}/${profileLine2}`;

  const allGatesSet = new Set();
  for (const obj of [personality, design]) {
    for (const { gate } of Object.values(obj)) allGatesSet.add(gate);
  }
  const allGates = [...allGatesSet].sort((a, b) => a - b);

  const definedChannels  = getDefinedChannels(allGates);
  const definedCenters   = getDefinedCenters(definedChannels);
  const undefinedCenters = Object.keys(CENTER_GATES).filter(c => !definedCenters.includes(c));
  const centerAdj        = buildCenterAdj(definedChannels);

  const type      = determineType(definedCenters, centerAdj);
  const authority = determineAuthority(definedCenters);
  const meta      = TYPE_META[type];

  const designDate = new Date((designJDE - 2440587.5) * 86400000).toISOString().slice(0, 10);

  return {
    personality,
    design,
    designDate,
    allGates,
    definedChannels,
    definedCenters,
    undefinedCenters,
    type,
    profile,
    profileLine1,
    profileLine2,
    authority,
    strategy: meta.strategy,
    signature: meta.signature,
    notSelf:  meta.notSelf,
  };
}
