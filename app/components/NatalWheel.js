'use client';

import { useState } from 'react';

const SIGN_SYMBOLS  = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_NAMES    = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_ELEMENTS = ['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];

const EL_FILL       = { fire:'#fff0f0', earth:'#fffbeb', air:'#f0f9ff', water:'#f5f3ff' };
const EL_STROKE     = { fire:'#fca5a5', earth:'#fcd34d', air:'#93c5fd', water:'#c4b5fd' };
const EL_FILL_INNER = { fire:'#fce8e8', earth:'#fef3cc', air:'#dbeefe', water:'#ede9fe' };

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
const R_OUT   = 156;
const R_IN    = 128;
const R_SLICE = 86;
const R_DOT   = 114;
const R_SYM   = 102;
const R_ASP   = 72;

function lonToAngle(lon) { return (lon - 90) * Math.PI / 180; }
function pt(r, angle) { return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]; }

function sectorPath(rIn, rOut, aStart, aEnd) {
  const [x1, y1] = pt(rOut, aStart);
  const [x2, y2] = pt(rOut, aEnd);
  const [x3, y3] = pt(rIn,  aEnd);
  const [x4, y4] = pt(rIn,  aStart);
  return `M${x1},${y1} A${rOut},${rOut} 0 0,1 ${x2},${y2} L${x3},${y3} A${rIn},${rIn} 0 0,0 ${x4},${y4} Z`;
}

export default function NatalWheel({ natalLons = {}, natalAspects = [], onPlanet, onAspect }) {
  const [hovPlanet, setHovPlanet] = useState(null);
  const [hovAsp,    setHovAsp]    = useState(null);

  const bodies = BODY_ORDER.filter(b => natalLons[b] != null);

  return (
    <svg viewBox="0 0 356 356" width="100%" style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}>

      {/* Aspect lines */}
      {natalAspects.map((asp, i) => {
        if (natalLons[asp.planet1] == null || natalLons[asp.planet2] == null) return null;
        const a1 = lonToAngle(natalLons[asp.planet1]);
        const a2 = lonToAngle(natalLons[asp.planet2]);
        const [x1, y1] = pt(R_ASP, a1);
        const [x2, y2] = pt(R_ASP, a2);
        const color = ASP_COLORS[asp.name] ?? '#ccc';
        const hov = hovAsp === i;
        return (
          <g key={i}
            onClick={() => onAspect?.(asp)}
            onMouseEnter={() => setHovAsp(i)}
            onMouseLeave={() => setHovAsp(null)}
            style={{ cursor: 'pointer' }}
          >
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={16} />
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color}
              strokeWidth={hov ? 2.5 : 1.2}
              strokeOpacity={hov ? 1 : 0.65}
              style={{ transition: 'stroke-width 0.12s, stroke-opacity 0.12s' }}
            />
          </g>
        );
      })}

      {/* Inner sector slices */}
      {SIGN_NAMES.map((name, i) => {
        const aStart = lonToAngle(i * 30);
        const aEnd   = lonToAngle((i + 1) * 30);
        const el = SIGN_ELEMENTS[i];
        return (
          <path key={`inner-${name}`}
            d={sectorPath(R_SLICE, R_IN, aStart, aEnd)}
            fill={EL_FILL_INNER[el]}
            stroke={EL_STROKE[el]}
            strokeWidth={0.5}
            strokeOpacity={0.6}
          />
        );
      })}

      {/* Center circle */}
      <circle cx={CX} cy={CY} r={R_SLICE} fill="white" fillOpacity={0.55} stroke="#e5e7eb" strokeWidth={0.5} />

      {/* Outer zodiac ring */}
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
              fontSize={12} fill="#6b7280" style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {sym}
            </text>
          </g>
        );
      })}

      {/* Sign boundary dividers */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = lonToAngle(i * 30);
        const [x1, y1] = pt(R_SLICE, a);
        const [x2, y2] = pt(R_OUT,   a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d1d5db" strokeWidth={0.5} />;
      })}

      {/* Planet markers */}
      {bodies.map(body => {
        const a = lonToAngle(natalLons[body]);
        const [dx, dy] = pt(R_DOT, a);
        const [sx, sy] = pt(R_SYM, a);
        const [rx, ry] = pt(R_IN,  a);
        const hov = hovPlanet === body;
        return (
          <g key={body}
            onClick={() => onPlanet?.(body)}
            onMouseEnter={() => setHovPlanet(body)}
            onMouseLeave={() => setHovPlanet(null)}
            style={{ cursor: 'pointer' }}
          >
            <line x1={rx} y1={ry} x2={dx} y2={dy}
              stroke="#b88a92" strokeWidth={0.8} strokeOpacity={hov ? 0.9 : 0.45} />
            <circle cx={dx} cy={dy} r={hov ? 4 : 2.5} fill="#b88a92"
              style={{ transition: 'r 0.12s' }} />
            <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle"
              fontSize={hov ? 13 : 12}
              fill={hov ? '#b88a92' : '#374151'}
              fontWeight={hov ? 600 : 400}
              style={{ userSelect: 'none', fontFamily: 'system-ui,sans-serif', pointerEvents: 'none', transition: 'fill 0.12s' }}>
              {PLANET_SYM[body] ?? '·'}
            </text>
            <circle cx={sx} cy={sy} r={16} fill="transparent" />
          </g>
        );
      })}

      <circle cx={CX} cy={CY} r={2.5} fill="#b88a92" fillOpacity={0.4} />
    </svg>
  );
}
