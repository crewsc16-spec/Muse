import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fdf8f3 0%, #fce8e8 50%, #e8e0f5 100%)',
        }}
      >
        <span
          style={{
            fontSize: 94,
            color: '#b88a92',
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
