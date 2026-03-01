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

import vsopEarth   from 'astronomia/data/vsop87Bearth';
import vsopMercury from 'astronomia/data/vsop87Bmercury';
import vsopVenus   from 'astronomia/data/vsop87Bvenus';
import vsopMars    from 'astronomia/data/vsop87Bmars';
import vsopJupiter from 'astronomia/data/vsop87Bjupiter';
import vsopSaturn  from 'astronomia/data/vsop87Bsaturn';
import vsopUranus  from 'astronomia/data/vsop87Buranus';
import vsopNeptune from 'astronomia/data/vsop87Bneptune';

import {
  toJDE, longitudeToGate, longitudeToLine,
  CENTER_GATES, getDefinedChannels, getDefinedCenters, buildCenterAdj,
  determineType, determineAuthority, TYPE_META, meanNodeLongitude,
} from './hd-common.js';

// Instantiate planets once (module-level, reused per request)
const _earth   = new Planet(vsopEarth);
const _mercury = new Planet(vsopMercury);
const _venus   = new Planet(vsopVenus);
const _mars    = new Planet(vsopMars);
const _jupiter = new Planet(vsopJupiter);
const _saturn  = new Planet(vsopSaturn);
const _uranus  = new Planet(vsopUranus);
const _neptune = new Planet(vsopNeptune);

// ─── Geocentric ecliptic longitude from VSOP87B heliocentric position ───────
// earthPos is the pre-computed _earth.position(jde) — passed in to avoid redundant calls
function _geoLon(planet, jde, earthPos) {
  const P = planet.position(jde);
  const E = earthPos;
  const px = P.range * Math.cos(P.lat) * Math.cos(P.lon);
  const py = P.range * Math.cos(P.lat) * Math.sin(P.lon);
  const ex = E.range * Math.cos(E.lat) * Math.cos(E.lon);
  const ey = E.range * Math.cos(E.lat) * Math.sin(E.lon);
  const lon_rad = Math.atan2(py - ey, px - ex);
  return ((lon_rad * 180 / Math.PI) % 360 + 360) % 360;
}

// ─── All body positions at a given JDE ──────────────────────────────────────
function _allLongitudes(jde) {
  // Compute Earth position once — used by solar.apparentVSOP87 and all _geoLon calls
  const earthPos = _earth.position(jde);

  const sunRad  = solar.apparentVSOP87(_earth, jde).lon;
  const sunLon  = ((sunRad * 180 / Math.PI) % 360 + 360) % 360;
  const earthLon = (sunLon + 180) % 360;
  const moonLon  = ((moonpos.position(jde).lon * 180 / Math.PI) % 360 + 360) % 360;
  const plutoLon = ((plutoLib.astrometric(jde, _earth).lon * 180 / Math.PI) % 360 + 360) % 360;
  const nodeLon  = meanNodeLongitude(jde);

  return {
    sun:       sunLon,
    earth:     earthLon,
    moon:      moonLon,
    mercury:   _geoLon(_mercury, jde, earthPos),
    venus:     _geoLon(_venus,   jde, earthPos),
    mars:      _geoLon(_mars,    jde, earthPos),
    jupiter:   _geoLon(_jupiter, jde, earthPos),
    saturn:    _geoLon(_saturn,  jde, earthPos),
    uranus:    _geoLon(_uranus,  jde, earthPos),
    neptune:   _geoLon(_neptune, jde, earthPos),
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

function _activations(lons) {
  const result = {};
  for (const [body, lon] of Object.entries(lons)) {
    result[body] = { gate: longitudeToGate(lon), line: longitudeToLine(lon) };
  }
  return result;
}

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
