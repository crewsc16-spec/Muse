import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Muse — Your cosmic self-discovery guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  const fontData = await fetch(
    'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_iE9GnM.ttf'
  ).then(r => r.arrayBuffer());

  const stars = [
    { x: 110, y: 70, s: 3, o: 0.6 },
    { x: 240, y: 150, s: 2, o: 0.4 },
    { x: 1020, y: 90, s: 3.5, o: 0.55 },
    { x: 1100, y: 210, s: 2, o: 0.35 },
    { x: 170, y: 470, s: 2.5, o: 0.4 },
    { x: 960, y: 510, s: 3, o: 0.5 },
    { x: 440, y: 55, s: 2.5, o: 0.35 },
    { x: 780, y: 75, s: 2.5, o: 0.4 },
    { x: 70, y: 290, s: 2, o: 0.3 },
    { x: 1140, y: 400, s: 2.5, o: 0.4 },
    { x: 550, y: 560, s: 2, o: 0.3 },
    { x: 680, y: 45, s: 2.5, o: 0.35 },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #100e14 0%, #1c1724 35%, #211820 65%, #100e14 100%)',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Central warm spotlight — draws the eye inward */}
        <div
          style={{
            position: 'absolute',
            top: '46%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 900,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(220,190,160,0.18) 0%, rgba(200,170,140,0.07) 40%, transparent 68%)',
          }}
        />

        {/* Secondary rose glow — warmth underneath */}
        <div
          style={{
            position: 'absolute',
            top: '52%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(200,150,155,0.1) 0%, transparent 65%)',
          }}
        />

        {/* Subtle stars */}
        {stars.map((s, i) => (
          <div
            key={`s${i}`}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              width: s.s,
              height: s.s,
              borderRadius: '50%',
              background: `rgba(235,220,200,${s.o})`,
            }}
          />
        ))}

        {/* Title — Cormorant Garamond, high contrast */}
        <div
          style={{
            fontSize: 116,
            fontFamily: 'Cormorant Garamond',
            fontWeight: 600,
            color: '#f0e6d8',
            letterSpacing: '0.06em',
            marginBottom: 18,
          }}
        >
          Muse
        </div>

        {/* Tagline — large, readable */}
        <div
          style={{
            fontSize: 36,
            color: 'rgba(240,230,216,0.7)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 48,
          }}
        >
          Your cosmic self-discovery guide
        </div>

        {/* Feature words */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            fontSize: 22,
            color: 'rgba(240,230,216,0.5)',
            letterSpacing: '0.04em',
          }}
        >
          {['Astrology', 'Human Design', 'Tarot', 'Journaling', 'Vision Board'].map(
            (label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <div
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      background: 'rgba(240,230,216,0.3)',
                      margin: '0 18px',
                    }}
                  />
                )}
                <span>{label}</span>
              </div>
            )
          )}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent 10%, rgba(220,190,160,0.35) 50%, transparent 90%)',
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Cormorant Garamond',
          data: fontData,
          style: 'normal',
          weight: 600,
        },
      ],
    }
  );
}
