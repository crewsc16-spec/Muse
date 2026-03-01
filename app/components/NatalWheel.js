'use client';

const SIGN_SYMBOLS  = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_ELEMENTS = ['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];

const EL_FILL   = { fire:'#fff0f0', earth:'#fffbeb', air:'#f0f9ff', water:'#f5f3ff' };
const EL_STROKE = { fire:'#fca5a5', earth:'#fcd34d', air:'#93c5fd', water:'#c4b5fd' };

const PLANET_SYM = {
  sun:'☉', earth:'⊕', moon:'☽', mercury:'☿', venus:'♀', mars:'♂',
  jupiter:'♃', saturn:'♄', uranus:'♅', neptune:'♆', pluto:'♇',
  northNode:'☊', southNode:'☋',
};

const BODY_ORDER = [
  'sun','earth','moon','mercury','venus','mars',
  'jupiter','saturn','uranus','neptune','pluto','northNode','southNode',
];

const ASP_COLORS = {
  Conjunction: '#f59e0b',
  Sextile:     '#34d399',
  Square:      '#f87171',
  Trine:       '#60a5fa',
  Opposition:  '#c084fc',
};

const CX = 178, CY = 178;
const R_OUT  = 156;   // outer edge of zodiac ring
const R_IN   = 132;   // inner edge of zodiac ring
const R_DOT  = 118;   // planet dot
const R_SYM  = 100;   // planet symbol
const R_ASP  = 80;    // aspect line endpoints

// Ecliptic longitude → SVG angle (0° Aries = 12 o'clock, clockwise)
function lonToAngle(lon) {
  return (lon - 90) * Math.PI / 180;
}

function pt(r, angle) {
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

// Annular sector path for one zodiac sign
function sectorPath(rIn, rOut, aStart, aEnd) {
  const [x1, y1] = pt(rOut, aStart);
  const [x2, y2] = pt(rOut, aEnd);
  const [x3, y3] = pt(rIn,  aEnd);
  const [x4, y4] = pt(rIn,  aStart);
  return `M${x1},${y1} A${rOut},${rOut} 0 0,1 ${x2},${y2} L${x3},${y3} A${rIn},${rIn} 0 0,0 ${x4},${y4} Z`;
}

export default function NatalWheel({ natalLons = {}, natalAspects = [], onPlanet, onAspect }) {
  const bodies = BODY_ORDER.filter(b => natalLons[b] != null);

  return (
    <svg viewBox="0 0 356 356" width="100%" style={{ maxWidth: 340, display: 'block', margin: '0 auto' }}>

      {/* Aspect lines — innermost layer */}
      {natalAspects.map((asp, i) => {
        if (natalLons[asp.planet1] == null || natalLons[asp.planet2] == null) return null;
        const a1 = lonToAngle(natalLons[asp.planet1]);
        const a2 = lonToAngle(natalLons[asp.planet2]);
        const [x1, y1] = pt(R_ASP, a1);
        const [x2, y2] = pt(R_ASP, a2);
        const color = ASP_COLORS[asp.name] ?? '#ccc';
        return (
          <g key={i} onClick={() => onAspect?.(asp)} style={{ cursor: 'pointer' }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={8} />
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color} strokeWidth={0.9} strokeOpacity={0.55} />
          </g>
        );
      })}

      {/* Inner circle background */}
      <circle cx={CX} cy={CY} r={R_IN} fill="white" fillOpacity={0.25} stroke="#e5e7eb" strokeWidth={0.5} />

      {/* Zodiac ring segments */}
      {SIGN_SYMBOLS.map((sym, i) => {
        const aStart = lonToAngle(i * 30);
        const aEnd   = lonToAngle((i + 1) * 30);
        const aMid   = lonToAngle(i * 30 + 15);
        const [sx, sy] = pt((R_IN + R_OUT) / 2, aMid);
        const el = SIGN_ELEMENTS[i];
        return (
          <g key={sym}>
            <path d={sectorPath(R_IN, R_OUT, aStart, aEnd)}
              fill={EL_FILL[el]} stroke={EL_STROKE[el]} strokeWidth={0.5} />
            <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle"
              fontSize={11} fill="#6b7280" style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {sym}
            </text>
          </g>
        );
      })}

      {/* Sign boundary tick marks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = lonToAngle(i * 30);
        const [x1, y1] = pt(R_IN,     a);
        const [x2, y2] = pt(R_IN - 5, a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d1d5db" strokeWidth={0.5} />;
      })}

      {/* Planet markers */}
      {bodies.map(body => {
        const a = lonToAngle(natalLons[body]);
        const [dx, dy] = pt(R_DOT, a);
        const [sx, sy] = pt(R_SYM, a);
        const [rx, ry] = pt(R_IN,  a);
        return (
          <g key={body} onClick={() => onPlanet?.(body)} style={{ cursor: 'pointer' }}>
            {/* Radial tick from sign ring to planet dot */}
            <line x1={rx} y1={ry} x2={dx} y2={dy}
              stroke="#b88a92" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Planet dot */}
            <circle cx={dx} cy={dy} r={2.2} fill="#b88a92" />
            {/* Planet symbol */}
            <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle"
              fontSize={11} fill="#4b5563" style={{ userSelect: 'none', fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' }}>
              {PLANET_SYM[body] ?? '·'}
            </text>
            {/* Invisible hit area */}
            <circle cx={sx} cy={sy} r={12} fill="transparent" />
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={2} fill="#b88a92" fillOpacity={0.4} />
    </svg>
  );
}
