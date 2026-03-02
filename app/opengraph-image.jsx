import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Muse — Your cosmic self-discovery guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
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
          background: 'linear-gradient(135deg, #fdf8f3 0%, #fce8e8 50%, #e8e0f5 100%)',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: '#b88a92',
            marginBottom: 12,
          }}
        >
          Muse
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#6b7280',
            marginBottom: 48,
          }}
        >
          Your cosmic self-discovery guide
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          {['Astrology', 'Human Design', 'Tarot', 'Journaling', 'Vision Board'].map(
            (label) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(255,255,255,0.6)',
                  borderRadius: 9999,
                  padding: '10px 24px',
                  fontSize: 18,
                  color: '#6b7280',
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
