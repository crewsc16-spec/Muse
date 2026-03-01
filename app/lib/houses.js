/**
 * Placidus house system calculation
 *
 * Reference: Classical Placidus algorithm using diurnal/nocturnal semi-arcs.
 *
 * @module houses
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function norm360(x) { return ((x % 360) + 360) % 360; }

/**
 * Calculate Placidus house cusps for a given time and location.
 *
 * @param {number} jd - Julian Day Number (TT/TDT)
 * @param {number} latDeg - Geographic latitude in degrees (north positive)
 * @param {number} lonDeg - Geographic longitude in degrees (east positive)
 * @returns {{ asc: number, mc: number, ic: number, dc: number, cusps: number[] }}
 *   All four angles and 12 cusp ecliptic longitudes H1…H12
 */
export function calcPlacidusHouses(jd, latDeg, lonDeg) {
  const T = (jd - 2451545.0) / 36525;

  // Mean obliquity of the ecliptic (degrees)
  const ε = 23.439291111 - 0.013004167 * T;
  const εR = ε * DEG;

  // Greenwich Apparent Sidereal Time → RAMC (Right Ascension of Midheaven)
  const GST  = norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0));
  const RAMC = norm360(GST + lonDeg);
  const RAMCr = RAMC * DEG;

  const latR = latDeg * DEG;

  // ── MC (Midheaven) ─────────────────────────────────────────────────────────
  const mcR = Math.atan2(Math.sin(RAMCr), Math.cos(RAMCr) * Math.cos(εR));
  const mc  = norm360(mcR * RAD);

  // ── ASC (Ascendant) ────────────────────────────────────────────────────────
  const ascR = Math.atan2(
    Math.cos(RAMCr),
    -(Math.sin(RAMCr) * Math.cos(εR) + Math.tan(latR) * Math.sin(εR))
  );
  const asc = norm360(ascR * RAD);

  const ic = norm360(mc  + 180);
  const dc = norm360(asc + 180);

  // ── Intermediate cusps via 30-step iteration ───────────────────────────────
  // For each cusp we solve:  target_RA = RAMC + frac * semi_arc(λ)
  // where semi_arc(λ) = D(λ) (diurnal) or N(λ) (nocturnal)
  // then invert RA → λ:  λ = atan2(sin(RA), cos(RA)·cos(ε))

  function solveCusp(frac, nocturnal) {
    // Initial λ estimate: invert the base RA
    const baseRAr = RAMCr + (nocturnal ? Math.PI : 0);
    let λ = norm360(Math.atan2(Math.sin(baseRAr), Math.cos(baseRAr) * Math.cos(εR)) * RAD);

    for (let i = 0; i < 30; i++) {
      const dec = Math.asin(
        Math.max(-1, Math.min(1, Math.sin(εR) * Math.sin(λ * DEG)))
      );
      // Diurnal semi-arc D (radians); clamp for circumpolar latitudes
      const cosD  = Math.max(-1, Math.min(1, -Math.tan(latR) * Math.tan(dec)));
      const D     = Math.acos(cosD);
      const semi  = nocturnal ? (Math.PI - D) : D;

      const targetRAr = RAMCr + (nocturnal ? Math.PI : 0) + frac * semi;
      const newλ = norm360(
        Math.atan2(Math.sin(targetRAr), Math.cos(targetRAr) * Math.cos(εR)) * RAD
      );

      if (Math.abs(newλ - λ) < 0.0001) { λ = newλ; break; }
      λ = newλ;
    }
    return λ;
  }

  // Upper hemisphere (above horizon): H11, H12
  const h11 = solveCusp(1 / 3, false);
  const h12 = solveCusp(2 / 3, false);

  // Lower hemisphere (below horizon): H2, H3
  const h2 = solveCusp(1 / 3, true);
  const h3 = solveCusp(2 / 3, true);

  // Opposite cusps
  const h5 = norm360(h11 + 180);
  const h6 = norm360(h12 + 180);
  const h8 = norm360(h2  + 180);
  const h9 = norm360(h3  + 180);

  // cusps[0] = H1 (ASC) … cusps[11] = H12
  const cusps = [asc, h2, h3, ic, h5, h6, dc, h8, h9, mc, h11, h12];

  return { asc, mc, ic, dc, cusps };
}

/**
 * Get the house number (1–12) for a given ecliptic longitude.
 *
 * @param {number} planetLon - Ecliptic longitude in degrees
 * @param {number[]} cusps   - Array of 12 cusp longitudes (H1 … H12)
 * @returns {number} House number 1–12
 */
export function getHouseNum(planetLon, cusps) {
  const lon = norm360(planetLon);
  for (let i = 0; i < 12; i++) {
    const c1 = cusps[i];
    const c2 = cusps[(i + 1) % 12];
    if (c2 > c1) {
      if (lon >= c1 && lon < c2) return i + 1;
    } else {
      // Cusp interval wraps around 0°/360°
      if (lon >= c1 || lon < c2) return i + 1;
    }
  }
  return 1; // fallback
}
