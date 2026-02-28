/**
 * Human Design Chart Calculator — Server-Side (VSOP87 accuracy)
 *
 * Uses the `astronomia` library for planet positions:
 *   Sun, Earth:  VSOP87 via solar.apparentVSOP87  (~0.0001°)
 *   Moon:        ELP-2000 via moonposition.position (~0.01°)
 *   Planets:     VSOP87B heliocentric → geocentric  (~0.001°)
 *   Pluto:       Series table via pluto.astrometric  (~0.01°)
 *
 * This file must NOT be imported on the client — use the API route instead.
 */

import * as solar      from 'astronomia/solar';
import * as moonpos    from 'astronomia/moonposition';
import { Planet }      from 'astronomia/planetposition';
import * as plutoLib   from 'astronomia/pluto';
import base            from 'astronomia/base';

import vsopEarth   from 'astronomia/data/vsop87Bearth';
import vsopMercury from 'astronomia/data/vsop87Bmercury';
import vsopVenus   from 'astronomia/data/vsop87Bvenus';
import vsopMars    from 'astronomia/data/vsop87Bmars';
import vsopJupiter from 'astronomia/data/vsop87Bjupiter';
import vsopSaturn  from 'astronomia/data/vsop87Bsaturn';
import vsopUranus  from 'astronomia/data/vsop87Buranus';
import vsopNeptune from 'astronomia/data/vsop87Bneptune';

// Instantiate planets once (module-level, reused per request)
const _earth   = new Planet(vsopEarth);
const _mercury = new Planet(vsopMercury);
const _venus   = new Planet(vsopVenus);
const _mars    = new Planet(vsopMars);
const _jupiter = new Planet(vsopJupiter);
const _saturn  = new Planet(vsopSaturn);
const _uranus  = new Planet(vsopUranus);
const _neptune = new Planet(vsopNeptune);

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

// ─── Geocentric ecliptic longitude from VSOP87B heliocentric position ───────
function _geoLon(planet, jde) {
  const P = planet.position(jde);
  const E = _earth.position(jde);
  // 3D heliocentric cartesian (ecliptic plane)
  const px = P.range * Math.cos(P.lat) * Math.cos(P.lon);
  const py = P.range * Math.cos(P.lat) * Math.sin(P.lon);
  const ex = E.range * Math.cos(E.lat) * Math.cos(E.lon);
  const ey = E.range * Math.cos(E.lat) * Math.sin(E.lon);
  const lon_rad = Math.atan2(py - ey, px - ex);
  return ((lon_rad * 180 / Math.PI) % 360 + 360) % 360;
}

// ─── Mean Lunar Node (ascending) ────────────────────────────────────────────
function _meanNode(jde) {
  const T = (jde - 2451545.0) / 36525;
  const omega = 125.0445479 - 1934.1362608 * T + 0.0020754 * T * T + T * T * T / 467441;
  return ((omega % 360) + 360) % 360;
}

// ─── All body positions at a given JDE ──────────────────────────────────────
function _allLongitudes(jde) {
  // Sun: use VSOP87 apparent geocentric longitude
  const sunRad = solar.apparentVSOP87(_earth, jde).lon;
  const sunLon = ((sunRad * 180 / Math.PI) % 360 + 360) % 360;
  // Earth gate = opposite the Sun
  const earthLon = (sunLon + 180) % 360;
  // Moon: ELP-2000 geocentric
  const moonLon = ((moonpos.position(jde).lon * 180 / Math.PI) % 360 + 360) % 360;
  // Pluto: astrometric geocentric (table-based)
  const plutoLon = ((plutoLib.astrometric(jde, _earth).lon * 180 / Math.PI) % 360 + 360) % 360;
  // Lunar nodes
  const nodeLon = _meanNode(jde);

  return {
    sun:       sunLon,
    earth:     earthLon,
    moon:      moonLon,
    mercury:   _geoLon(_mercury, jde),
    venus:     _geoLon(_venus,   jde),
    mars:      _geoLon(_mars,    jde),
    jupiter:   _geoLon(_jupiter, jde),
    saturn:    _geoLon(_saturn,  jde),
    uranus:    _geoLon(_uranus,  jde),
    neptune:   _geoLon(_neptune, jde),
    pluto:     plutoLon,
    northNode: nodeLon,
    southNode: (nodeLon + 180) % 360,
  };
}

// ─── Design time: find JDE where Sun was 88° before birth Sun ───────────────
function _designJDE(birthJDE, birthSunLon) {
  const SUN_RATE = 0.9856; // °/day
  const target = ((birthSunLon - 88 + 360) % 360);
  let jde = birthJDE - 88 / SUN_RATE;
  for (let i = 0; i < 3; i++) {
    const curLon = ((solar.apparentVSOP87(_earth, jde).lon * 180 / Math.PI) % 360 + 360) % 360;
    let diff = target - curLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    jde += diff / SUN_RATE;
  }
  return jde;
}

// ─── Gate / Line mapping ─────────────────────────────────────────────────────
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

function _activations(lons) {
  const result = {};
  for (const [body, lon] of Object.entries(lons)) {
    result[body] = { gate: longitudeToGate(lon), line: longitudeToLine(lon) };
  }
  return result;
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

const TYPE_META = {
  'generator':             { strategy: 'Respond',                 signature: 'Satisfaction', notSelf: 'Frustration'    },
  'manifesting-generator': { strategy: 'Respond, then Inform',    signature: 'Satisfaction', notSelf: 'Frustration'    },
  'manifestor':            { strategy: 'Inform',                  signature: 'Peace',        notSelf: 'Anger'          },
  'projector':             { strategy: 'Wait for the Invitation', signature: 'Success',      notSelf: 'Bitterness'     },
  'reflector':             { strategy: 'Wait a Lunar Cycle',      signature: 'Surprise',     notSelf: 'Disappointment' },
};

// ─── Main export ─────────────────────────────────────────────────────────────
export function calculateHDChartServer(birthDate, birthTime, utcOffset) {
  const birthJDE  = toJDE(birthDate, birthTime, utcOffset ?? 0);
  const birthLons = _allLongitudes(birthJDE);
  const birthSunLon = birthLons.sun;

  const designJDE  = _designJDE(birthJDE, birthSunLon);
  const designLons = _allLongitudes(designJDE);

  const personality = _activations(birthLons);
  const design      = _activations(designLons);

  const profileLine1 = personality.sun.line;
  const profileLine2 = design.sun.line;
  const profile = `${profileLine1}/${profileLine2}`;

  const allGatesSet = new Set();
  for (const { gate } of Object.values(personality)) allGatesSet.add(gate);
  for (const { gate } of Object.values(design)) allGatesSet.add(gate);
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
    notSelf:   meta.notSelf,
  };
}
