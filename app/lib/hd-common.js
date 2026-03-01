/**
 * Human Design Chart — Shared constants and pure functions
 * Used by both hd-chart.js (client, Keplerian) and hd-chart-server.js (server, VSOP87).
 */

// ─── Julian Date ─────────────────────────────────────────────────────────────
export function toJDE(dateStr, timeStr, utcOffset) {
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

// ─── Gate / Line mapping ─────────────────────────────────────────────────────
// 64 gates clockwise from ~302° ecliptic (empirically verified offset)
export const GATE_WHEEL = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,
  8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,
  47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,
  38,54,61,60,
];

export function longitudeToGate(lon) {
  const pos = ((lon - 302 + 360) % 360) / 5.625;
  return GATE_WHEEL[Math.floor(pos) % 64];
}

export function longitudeToLine(lon) {
  const withinGate = ((lon - 302 + 360) % 360) % 5.625;
  return Math.min(6, Math.floor(withinGate / 0.9375) + 1);
}

// ─── Centers & Channels ──────────────────────────────────────────────────────
export const CENTER_GATES = {
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

export const CHANNELS = [
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
export const GATE_CENTER = (() => {
  const map = {};
  for (const [center, gates] of Object.entries(CENTER_GATES)) {
    for (const g of gates) map[g] = center;
  }
  return map;
})();

export function getDefinedChannels(allGates) {
  const gateSet = new Set(allGates);
  return CHANNELS.filter(([g1, g2]) => gateSet.has(g1) && gateSet.has(g2));
}

export function getDefinedCenters(definedChannels) {
  const defined = new Set();
  for (const [g1, g2] of definedChannels) {
    if (GATE_CENTER[g1]) defined.add(GATE_CENTER[g1]);
    if (GATE_CENTER[g2]) defined.add(GATE_CENTER[g2]);
  }
  return [...defined];
}

export function buildCenterAdj(definedChannels) {
  const adj = {};
  for (const [g1, g2] of definedChannels) {
    const c1 = GATE_CENTER[g1], c2 = GATE_CENTER[g2];
    if (!c1 || !c2 || c1 === c2) continue;
    (adj[c1] = adj[c1] || new Set()).add(c2);
    (adj[c2] = adj[c2] || new Set()).add(c1);
  }
  return adj;
}

export function isConnectedVia(adj, from, to) {
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

// ─── Type & Authority ─────────────────────────────────────────────────────────
export function determineType(definedCenters, centerAdj) {
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

export function determineAuthority(definedCenters) {
  const dc = new Set(definedCenters);
  if (dc.has('SolarPlexus')) return 'emotional';
  if (dc.has('Sacral'))      return 'sacral';
  if (dc.has('Spleen'))      return 'splenic';
  if (dc.has('Will'))        return 'ego';
  if (dc.has('G'))           return 'self-projected';
  if (dc.has('Ajna'))        return 'mental';
  return 'lunar';
}

export const TYPE_META = {
  'generator':             { strategy: 'Respond',                 signature: 'Satisfaction', notSelf: 'Frustration'    },
  'manifesting-generator': { strategy: 'Respond, then Inform',    signature: 'Satisfaction', notSelf: 'Frustration'    },
  'manifestor':            { strategy: 'Inform',                  signature: 'Peace',        notSelf: 'Anger'          },
  'projector':             { strategy: 'Wait for the Invitation', signature: 'Success',      notSelf: 'Bitterness'     },
  'reflector':             { strategy: 'Wait a Lunar Cycle',      signature: 'Surprise',     notSelf: 'Disappointment' },
};

// ─── Mean Lunar Node (ascending) ─────────────────────────────────────────────
export function meanNodeLongitude(jde) {
  const T = (jde - 2451545.0) / 36525;
  const omega = 125.0445479 - 1934.1362608 * T + 0.0020754 * T * T + T * T * T / 467441;
  return ((omega % 360) + 360) % 360;
}
