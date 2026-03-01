'use client';

// All 33 unique HD channels as [g1, g2] gate pairs
const ALL_CHANNELS = [
  [1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],
  [11,56],[12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],
  [21,45],[25,51],[26,44],[27,50],[28,38],[29,46],[30,41],[32,54],
  [34,57],[35,36],[37,40],[39,55],[42,53],[43,23],[47,64],[61,24],[63,4],
];

// Gate → Center mapping (from CENTER_META gates arrays)
const GATE_CENTER = {
  64:'Head', 61:'Head', 63:'Head',
  47:'Ajna', 24:'Ajna', 4:'Ajna', 11:'Ajna', 43:'Ajna', 17:'Ajna',
  62:'Throat', 23:'Throat', 56:'Throat', 35:'Throat', 12:'Throat',
  45:'Throat', 33:'Throat', 8:'Throat', 31:'Throat', 20:'Throat', 16:'Throat',
  1:'G', 13:'G', 25:'G', 46:'G', 2:'G', 15:'G', 10:'G', 7:'G',
  26:'Will', 51:'Will', 21:'Will', 40:'Will',
  9:'Sacral', 3:'Sacral', 42:'Sacral', 14:'Sacral', 29:'Sacral',
  59:'Sacral', 27:'Sacral', 34:'Sacral', 5:'Sacral',
  36:'SolarPlexus', 22:'SolarPlexus', 37:'SolarPlexus', 55:'SolarPlexus',
  30:'SolarPlexus', 49:'SolarPlexus', 6:'SolarPlexus',
  48:'Spleen', 57:'Spleen', 44:'Spleen', 50:'Spleen', 32:'Spleen', 28:'Spleen', 18:'Spleen',
  19:'Root', 39:'Root', 52:'Root', 53:'Root', 60:'Root', 58:'Root', 38:'Root', 54:'Root', 41:'Root',
};

// Center positions and shapes (viewBox: 0 0 360 450)
const CTR = {
  Head:        { x:180, y:48,  shape:'tri-up',   r:30,      label:'Head'   },
  Ajna:        { x:180, y:114, shape:'tri-down',  r:30,      label:'Ajna'   },
  Throat:      { x:180, y:175, shape:'rect',      w:56, h:28, label:'Throat' },
  G:           { x:180, y:250, shape:'diamond',   r:38,      label:'G'      },
  Will:        { x:264, y:224, shape:'tri-down',  r:22,      label:'Will'   },
  Sacral:      { x:180, y:328, shape:'rect',      w:64, h:36, label:'Sacral' },
  SolarPlexus: { x:271, y:354, shape:'tri-up',    r:25,      label:'SP'     },
  Spleen:      { x:89,  y:354, shape:'tri-up',    r:25,      label:'Spleen' },
  Root:        { x:180, y:416, shape:'rect',      w:64, h:28, label:'Root'   },
};

function triPts(cx, cy, r, up) {
  const h = r * 0.866;
  return up
    ? `${cx},${cy - r} ${cx - h},${cy + r * 0.5} ${cx + h},${cy + r * 0.5}`
    : `${cx},${cy + r} ${cx - h},${cy - r * 0.5} ${cx + h},${cy - r * 0.5}`;
}

function diamondPts(cx, cy, r) {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
}

// Returns N parallel lines between two points, offset perpendicularly
function parallelLines(x1, y1, x2, y2, n, s = 3) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (!len) return Array(n).fill({ x1, y1, x2, y2 });
  const nx = -dy / len, ny = dx / len;
  const offsets = n === 1 ? [0]
    : n === 2 ? [-s / 2, s / 2]
    : n === 3 ? [-s, 0, s]
    : [-1.5 * s, -s / 2, s / 2, 1.5 * s];
  return offsets.map(o => ({ x1: x1 + o * nx, y1: y1 + o * ny, x2: x2 + o * nx, y2: y2 + o * ny }));
}

export default function BodyGraph({ definedCenters = [], definedChannels = [], onCenter, onChannel }) {
  const defCSet = new Set(definedCenters);
  const defChSet = new Set(
    definedChannels.map(([a, b]) => {
      const [x, y] = [a, b].sort((p, q) => p - q);
      return `${x}-${y}`;
    })
  );

  function isDefCh(g1, g2) {
    const [a, b] = [g1, g2].sort((x, y) => x - y);
    return defChSet.has(`${a}-${b}`);
  }

  // Group all channels by sorted center-pair key
  const groups = {};
  for (const [g1, g2] of ALL_CHANNELS) {
    const c1 = GATE_CENTER[g1], c2 = GATE_CENTER[g2];
    if (!c1 || !c2 || c1 === c2) continue;
    const key = [c1, c2].sort().join('|');
    if (!groups[key]) groups[key] = [];
    groups[key].push([g1, g2]);
  }

  const GRAD = 'url(#bgGrd)';

  return (
    <svg viewBox="0 0 360 450" width="100%" style={{ maxWidth: 300, display: 'block', margin: '0 auto' }}>
      <defs>
        <linearGradient id="bgGrd" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fb7185" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Channel lines — rendered under centers */}
      {Object.entries(groups).flatMap(([key, chans]) => {
        const [c1n, c2n] = key.split('|');
        const c1 = CTR[c1n], c2 = CTR[c2n];
        if (!c1 || !c2) return [];
        const lines = parallelLines(c1.x, c1.y, c2.x, c2.y, chans.length);
        return chans.map(([g1, g2], i) => {
          const def = isDefCh(g1, g2);
          const { x1, y1, x2, y2 } = lines[i];
          const ck = [g1, g2].sort((a, b) => a - b).join('-');
          return (
            <g key={ck} onClick={() => onChannel?.([g1, g2])} style={{ cursor: 'pointer' }}>
              {/* Wide invisible hit area */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} />
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={def ? '#d4adb6' : '#e5e7eb'}
                strokeWidth={def ? 2.5 : 1.5}
                strokeLinecap="round"
              />
            </g>
          );
        });
      })}

      {/* Centers — rendered above channels */}
      {Object.entries(CTR).map(([key, c]) => {
        const def  = defCSet.has(key);
        const fill   = def ? GRAD : 'white';
        const stroke = def ? '#d4adb6' : '#d1d5db';
        const tc     = def ? 'white' : '#9ca3af';
        const sw     = def ? 1 : 0.8;
        const textStyle = { userSelect: 'none', fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' };

        let inner;
        if (c.shape === 'rect') {
          inner = (
            <>
              <rect
                x={c.x - c.w / 2} y={c.y - c.h / 2}
                width={c.w} height={c.h}
                rx={3} fill={fill} stroke={stroke} strokeWidth={sw}
              />
              <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fill={tc} style={textStyle}>
                {c.label}
              </text>
            </>
          );
        } else if (c.shape === 'diamond') {
          inner = (
            <>
              <polygon points={diamondPts(c.x, c.y, c.r)} fill={fill} stroke={stroke} strokeWidth={sw} />
              <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={9} fill={tc} style={textStyle}>
                {c.label}
              </text>
            </>
          );
        } else {
          const up = c.shape === 'tri-up';
          inner = (
            <>
              <polygon points={triPts(c.x, c.y, c.r, up)} fill={fill} stroke={stroke} strokeWidth={sw} />
              <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fill={tc} style={textStyle}>
                {c.label}
              </text>
            </>
          );
        }

        return (
          <g key={key} onClick={() => onCenter?.(key, def)} style={{ cursor: 'pointer' }}>
            {inner}
          </g>
        );
      })}
    </svg>
  );
}
