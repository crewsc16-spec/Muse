import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Muse — Your cosmic self-discovery guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  // Load Cormorant Garamond (elegant high-contrast serif) for the title
  const fontData = await fetch(
    'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.ttf'
  ).then(r => r.arrayBuffer());

  const stars = [
    { x: 110, y: 70, s: 3, o: 0.5 },
    { x: 240, y: 170, s: 2, o: 0.35 },
    { x: 1020, y: 90, s: 3, o: 0.45 },
    { x: 1100, y: 210, s: 2, o: 0.3 },
    { x: 170, y: 470, s: 2.5, o: 0.35 },
    { x: 960, y: 500, s: 3, o: 0.4 },
    { x: 440, y: 60, s: 2, o: 0.3 },
    { x: 780, y: 80, s: 2.5, o: 0.35 },
    { x: 80, y: 300, s: 2, o: 0.25 },
    { x: 1130, y: 390, s: 2.5, o: 0.35 },
    { x: 550, y: 560, s: 2, o: 0.25 },
    { x: 680, y: 50, s: 2, o: 0.3 },
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
          background: 'linear-gradient(160deg, #0c0a0e 0%, #1a1520 35%, #1e1418 65%, #0c0a0e 100%)',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Warm ambient glow — top center */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(196,164,132,0.12) 0%, rgba(196,164,132,0.04) 45%, transparent 70%)',
          }}
        />

        {/* Secondary glow — lower, rose-tinted */}
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(184,138,146,0.1) 0%, transparent 60%)',
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
              background: `rgba(220,200,180,${s.o})`,
            }}
          />
        ))}

        {/* Thin gold rule above title */}
        <div
          style={{
            width: 60,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(196,174,142,0.5), transparent)',
            marginBottom: 32,
          }}
        />

        {/* Title — Cormorant Garamond */}
        <div
          style={{
            fontSize: 108,
            fontFamily: 'Cormorant Garamond',
            fontWeight: 600,
            color: '#d4c0a8',
            letterSpacing: '0.06em',
            marginBottom: 14,
          }}
        >
          Muse
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(196,174,142,0.55)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 52,
          }}
        >
          Your cosmic self-discovery guide
        </div>

        {/* Feature words — minimal, no pills, just a quiet line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            fontSize: 15,
            color: 'rgba(196,174,142,0.4)',
            letterSpacing: '0.08em',
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
                      background: 'rgba(196,174,142,0.25)',
                      margin: '0 16px',
                    }}
                  />
                )}
                <span>{label}</span>
              </div>
            )
          )}
        </div>

        {/* Bottom accent — warm gold fade */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent 15%, rgba(196,174,142,0.3) 50%, transparent 85%)',
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
