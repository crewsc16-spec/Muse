// Clean SVG line-art faces — not emojis

const FACES = {
  1: { color: '#c5bcba', mouth: 'M 13,26 Q 20,21 27,26', straight: false }, // sad
  2: { color: '#d0b8b8', mouth: 'M 14,25.5 Q 20,23 26,25.5', straight: false }, // slightly sad
  3: { color: '#cdb4bc', mouth: null, straight: true },  // neutral line
  4: { color: '#c9a0a8', mouth: 'M 14,24 Q 20,27.5 26,24', straight: false }, // smile
  5: { color: '#b88a92', mouth: 'M 13,23 Q 20,29.5 27,23', straight: false }, // big smile
};

export default function MoodFace({ mood, size = 40, selected = false }) {
  const face = FACES[mood] ?? FACES[3];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="20" cy="20" r="18"
        stroke={face.color}
        strokeWidth={selected ? 2 : 1.5}
        fill={selected ? `${face.color}18` : 'none'}
      />
      {/* Eyes */}
      <circle cx="14" cy="17" r="1.5" fill={face.color} />
      <circle cx="26" cy="17" r="1.5" fill={face.color} />
      {/* Mouth */}
      {face.straight ? (
        <line
          x1="14" y1="25" x2="26" y2="25"
          stroke={face.color} strokeWidth="1.5" strokeLinecap="round"
        />
      ) : (
        <path
          d={face.mouth}
          stroke={face.color} strokeWidth="1.5" strokeLinecap="round"
        />
      )}
    </svg>
  );
}
