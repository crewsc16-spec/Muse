import { ImageResponse } from 'next/og';

export function generateImageMetadata() {
  return [
    { id: '192', size: { width: 192, height: 192 }, contentType: 'image/png' },
    { id: '512', size: { width: 512, height: 512 }, contentType: 'image/png' },
  ];
}

export default function Icon({ id }) {
  const size = id === '192' ? 192 : 512;
  const fontSize = Math.round(size * 0.52);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fdf8f3 0%, #fce8e8 50%, #e8e0f5 100%)',
          borderRadius: size * 0.22,
        }}
      >
        <span
          style={{
            fontSize,
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
    { width: size, height: size }
  );
}
