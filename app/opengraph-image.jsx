import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Muse — Your cosmic self-discovery guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  const stars = [
    { x: 90, y: 80, s: 6, o: 0.7 },
    { x: 210, y: 160, s: 4, o: 0.5 },
    { x: 1050, y: 100, s: 7, o: 0.6 },
    { x: 1110, y: 200, s: 4, o: 0.4 },
    { x: 150, y: 480, s: 5, o: 0.5 },
    { x: 980, y: 520, s: 6, o: 0.6 },
    { x: 400, y: 70, s: 3, o: 0.4 },
    { x: 800, y: 90, s: 5, o: 0.5 },
    { x: 60, y: 320, s: 4, o: 0.3 },
    { x: 1140, y: 420, s: 5, o: 0.5 },
  ];

  const sparkles = [
    { x: 320, y: 130, s: 28, o: 0.3 },
    { x: 900, y: 140, s: 24, o: 0.25 },
    { x: 130, y: 400, s: 20, o: 0.2 },
    { x: 1060, y: 460, s: 22, o: 0.25 },
  ];

  const pills = [
    { label: 'Astrology', emoji: '🌙' },
    { label: 'Human Design', emoji: '🔮' },
    { label: 'Tarot', emoji: '✦' },
    { label: 'Journaling', emoji: '📓' },
    { label: 'Vision Board', emoji: '✨' },
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
          background: 'linear-gradient(145deg, #1f1535 0%, #2d1b4e 30%, #4a2040 60%, #1f1535 100%)',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow behind title */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -55%)',
            width: 700,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(184,138,146,0.25) 0%, rgba(184,138,146,0.08) 40%, transparent 70%)',
          }}
        />

        {/* Stars */}
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
              background: `rgba(255,255,255,${s.o})`,
            }}
          />
        ))}

        {/* Four-point sparkles */}
        {sparkles.map((sp, i) => (
          <div
            key={`sp${i}`}
            style={{
              position: 'absolute',
              left: sp.x,
              top: sp.y,
              width: sp.s,
              height: sp.s,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: sp.s,
              opacity: sp.o,
              color: '#e8c4c8',
            }}
          >
            ✦
          </div>
        ))}

        {/* Moon crescent */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 120,
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: 'transparent',
            boxShadow: '-12px 0 0 0 rgba(232,196,200,0.3)',
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#e8c4c8',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          Muse
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: 'rgba(232,196,200,0.7)',
            marginBottom: 48,
            letterSpacing: '0.05em',
          }}
        >
          Your cosmic self-discovery guide
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 14,
          }}
        >
          {pills.map((p) => (
            <div
              key={p.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(232,196,200,0.2)',
                borderRadius: 9999,
                padding: '10px 22px',
                fontSize: 17,
                color: 'rgba(232,196,200,0.8)',
              }}
            >
              <span>{p.emoji}</span>
              {p.label}
            </div>
          ))}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #b88a92, #9b7ab8, transparent)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
