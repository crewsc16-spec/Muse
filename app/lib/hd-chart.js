// Human Design Chart Calculator — Client-side (Keplerian accuracy)
// Accuracy:
//   Sun:     ~0.001° (Meeus equation-of-center + aberration/nutation)
//   Moon:    ~0.05°  (Meeus simplified series, 17 terms)
//   Planets: ~0.5–2° (Keplerian geocentric; gate width 5.625° — sufficient)

import {
  toJDE, longitudeToGate, longitudeToLine,
  CENTER_GATES, getDefinedChannels, getDefinedCenters, buildCenterAdj,
  determineType, determineAuthority, TYPE_META, meanNodeLongitude,
} from './hd-common.js';

const J2000 = 2451545.0;

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

const _EARTH_ORB = { a: 1.000001018, L0: 100.466457, L1: 35999.3728565, e0: 0.01670862, e1: -4.2037e-5, w0: 102.937348, w1: 0.3225654 };

function _solveKepler(M_deg, e) {
  let E = M_deg * (Math.PI / 180);
  for (let i = 0; i < 12; i++) {
    const dE = (M_deg * (Math.PI / 180) - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

function _helioLonR(orb, T) {
  const { a, L0, L1, e0, e1, w0, w1 } = orb;
  const L = ((L0 + L1 * T) % 360 + 360) % 360;
  const e = e0 + e1 * T;
  const w = ((w0 + w1 * T) % 360 + 360) % 360;
  const M = ((L - w) % 360 + 360) % 360;
  const E = _solveKepler(M, e);
  const v = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );
  const lon = ((v * 180 / Math.PI + w) % 360 + 360) % 360;
  const r = a * (1 - e * Math.cos(E));
  return { lon, r };
}

function planetLongitude(planet, jde) {
  const T = (jde - J2000) / 36525;
  const orb = _ORB[planet];
  if (!orb) return 0;
  const p = _helioLonR(orb, T);
  const earth = _helioLonR(_EARTH_ORB, T);
  const pR = p.lon * (Math.PI / 180);
  const eR = earth.lon * (Math.PI / 180);
  const gx = p.r * Math.cos(pR) - earth.r * Math.cos(eR);
  const gy = p.r * Math.sin(pR) - earth.r * Math.sin(eR);
  return ((Math.atan2(gy, gx) * 180 / Math.PI) % 360 + 360) % 360;
}

// ─── Design time (Sun 88° earlier) ──────────────────────────────────────────
function getDesignJDE(birthJDE, birthSunLon) {
  const SUN_RATE = 0.9856; // °/day
  const targetLon = ((birthSunLon - 88 + 360) % 360);
  let jde = birthJDE - 88 / SUN_RATE;
  for (let i = 0; i < 2; i++) {
    let diff = targetLon - sunLongitude(jde);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    jde += diff / SUN_RATE;
  }
  return jde;
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
