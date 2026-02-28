// Human Design Chart Calculator
// Simplified Meeus astronomical formulas.
// Sun accuracy: ~0.01°; Moon: ~0.3°; outer planets: mean motion only.
// Gate width: 5.625° — sufficient for gate-level calculation.

const J2000 = 2451545.0;

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

function sunLongitude(jde) {
  const d = jde - J2000;
  const L = (280.460 + 0.9856474 * d) % 360;
  const gRad = ((357.528 + 0.9856003 * d) % 360) * (Math.PI / 180);
  const lambda = L + 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);
  return ((lambda % 360) + 360) % 360;
}

function moonLongitude(jde) {
  const d = jde - J2000;
  const L = (218.316 + 13.176396 * d) % 360;
  const M = ((134.963 + 13.064993 * d) % 360) * (Math.PI / 180);
  const F = ((93.272  + 13.229350 * d) % 360) * (Math.PI / 180);
  const lon = L + 6.289 * Math.sin(M) - 1.274 * Math.sin(2 * F - M) + 0.658 * Math.sin(2 * F);
  return ((lon % 360) + 360) % 360;
}

const PLANET_EPOCHS = {
  Mercury: { L0: 252.251, rate: 4.09234 },
  Venus:   { L0: 181.980, rate: 1.60214 },
  Mars:    { L0: 355.433, rate: 0.52403 },
  Jupiter: { L0:  34.396, rate: 0.08308 },
  Saturn:  { L0:  50.077, rate: 0.03346 },
  Uranus:  { L0: 314.055, rate: 0.01172 },
  Neptune: { L0: 304.349, rate: 0.00598 },
  Pluto:   { L0: 238.956, rate: 0.00397 },
};

function planetLongitude(planet, jde) {
  const d = jde - J2000;
  const { L0, rate } = PLANET_EPOCHS[planet];
  return ((L0 + rate * d) % 360 + 360) % 360;
}

// 64 gates clockwise from 0° Capricorn (270° ecliptic)
const GATE_WHEEL = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,
  8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,
  47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,
  38,54,61,60,
];

function longitudeToGate(lon) {
  const pos = ((lon - 270 + 360) % 360) / 5.625;
  return GATE_WHEEL[Math.floor(pos) % 64];
}

function longitudeToLine(lon) {
  const withinGate = ((lon - 270 + 360) % 360) % 5.625;
  return Math.min(6, Math.floor(withinGate / 0.9375) + 1);
}

function getDesignJDE(birthJDE, birthSunLon) {
  const SUN_RATE = 0.9856; // degrees/day
  const targetLon = ((birthSunLon - 88 + 360) % 360);
  let jde = birthJDE - 88 / SUN_RATE;
  // One Newton-Raphson iteration
  let diff = targetLon - sunLongitude(jde);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  jde += diff / SUN_RATE;
  return jde;
}

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

function determineType(definedCenters, centerAdj) {
  if (definedCenters.length === 0) return 'reflector';
  const dc = new Set(definedCenters);
  const sacral = dc.has('Sacral');
  const throat = dc.has('Throat');
  if (sacral) {
    if (throat && isConnectedVia(centerAdj, 'Sacral', 'Throat')) return 'manifesting-generator';
    return 'generator';
  }
  const motorToThroat = ['Will', 'SolarPlexus', 'Root']
    .some(m => dc.has(m) && throat && isConnectedVia(centerAdj, m, 'Throat'));
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

function gateActivations(jde) {
  const sunLon   = sunLongitude(jde);
  const earthLon = (sunLon + 180) % 360;
  const moonLon  = moonLongitude(jde);
  const result = {
    sun:   { gate: longitudeToGate(sunLon),   line: longitudeToLine(sunLon)   },
    earth: { gate: longitudeToGate(earthLon), line: longitudeToLine(earthLon) },
    moon:  { gate: longitudeToGate(moonLon),  line: longitudeToLine(moonLon)  },
  };
  for (const planet of Object.keys(PLANET_EPOCHS)) {
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

  // Convert design JDE to ISO date string
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
