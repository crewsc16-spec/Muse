// ─── Vibe Card Canvas Renderer ────────────────────────────────────────────────
// Pure function: renderVibeCard(cardContent, format, colorScheme) → {blob, dataUrl}

import { COLOR_SCHEMES } from './color-schemes';

const FORMATS = {
  story:  { w: 1080, h: 1920, scale: 1 },
  square: { w: 1080, h: 1080, scale: 0.85 },
};

const ELEMENT_DOTS = {
  fire:  ['#f97316', '#e11d48', '#f59e0b'],
  earth: ['#84cc16', '#a16207', '#d4a76a'],
  air:   ['#818cf8', '#a78bfa', '#93c5fd'],
  water: ['#7c3aed', '#0891b2', '#6366f1'],
};

// ── Font helpers ─────────────────────────────────────────────────────────────

function resolveFont(className, fallback) {
  if (typeof document === 'undefined') return fallback;
  const el = document.querySelector(`.${className}`);
  if (!el) return fallback;
  const computed = getComputedStyle(el).fontFamily;
  // Extract first quoted or unquoted family
  const match = computed.match(/^["']?([^"',]+)/);
  return match ? match[1] : fallback;
}

async function waitForFonts() {
  if (typeof document === 'undefined') return;
  try { await document.fonts.ready; } catch { /* noop */ }
}

// ── Text wrapping ────────────────────────────────────────────────────────────

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ── Grain texture ────────────────────────────────────────────────────────────

function applyGrain(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18; // ±9 per channel
    data[i]     += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
}

// ── Rounded rect helper ─────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Main render ──────────────────────────────────────────────────────────────

export async function renderVibeCard(cardContent, format = 'story', colorSchemeKey = 'blush') {
  await waitForFonts();

  const playfair = resolveFont('font-playfair', '"Playfair Display", Georgia, serif');
  const geist = resolveFont('font-sans', '"Geist", system-ui, sans-serif');

  const { w, h, scale } = FORMATS[format] ?? FORMATS.story;
  const s = scale; // font scale multiplier

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // ── Background gradient ──────────────────────────────────────────────────
  const scheme = COLOR_SCHEMES[colorSchemeKey] ?? COLOR_SCHEMES.blush;
  const vars = scheme.vars;
  const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
  grad.addColorStop(0,   vars['--bg-from']);
  grad.addColorStop(0.5, vars['--bg-mid']);
  grad.addColorStop(1,   vars['--bg-to']);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Apply grain at 3% opacity
  ctx.save();
  ctx.globalAlpha = 0.03;
  applyGrain(ctx, w, h);
  ctx.restore();

  // ── Layout ───────────────────────────────────────────────────────────────
  const pad = 80 * s;
  const centerX = w / 2;
  const accent = vars['--accent'] ?? '#b88a92';
  const accentLight = vars['--accent-light'] ?? '#d4adb6';
  const textDark = '#3f3f46';
  const textMuted = '#71717a';
  const textLight = '#a1a1aa';

  let y;
  if (format === 'story') {
    y = 160;
  } else {
    y = 70;
  }

  // ── Date ─────────────────────────────────────────────────────────────────
  const dateObj = new Date(cardContent.date + 'T12:00:00');
  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }).toUpperCase();

  ctx.font = `400 ${Math.round(28 * s)}px ${geist}`;
  ctx.fillStyle = textLight;
  ctx.textAlign = 'center';
  ctx.fillText(dateLabel, centerX, y);
  y += format === 'story' ? 100 : 60;

  // ── Tarot emoji ──────────────────────────────────────────────────────────
  ctx.font = `${Math.round(120 * s)}px serif`;
  ctx.fillText(cardContent.tarot.emoji, centerX, y);
  y += format === 'story' ? 80 : 50;

  // ── Tarot name ───────────────────────────────────────────────────────────
  ctx.font = `700 ${Math.round(48 * s)}px ${playfair}`;
  ctx.fillStyle = textDark;
  ctx.fillText(cardContent.tarot.name.toUpperCase(), centerX, y);
  y += format === 'story' ? 30 : 20;

  // ── Gradient rule ────────────────────────────────────────────────────────
  const ruleW = 200 * s;
  const ruleGrad = ctx.createLinearGradient(centerX - ruleW / 2, 0, centerX + ruleW / 2, 0);
  ruleGrad.addColorStop(0, accent);
  ruleGrad.addColorStop(1, accentLight);
  ctx.fillStyle = ruleGrad;
  ctx.fillRect(centerX - ruleW / 2, y, ruleW, 2);
  y += format === 'story' ? 45 : 30;

  // ── Tarot roast (italic, max 3 lines) ────────────────────────────────────
  const roastSize = Math.round(36 * s);
  ctx.font = `italic 400 ${roastSize}px ${playfair}`;
  ctx.fillStyle = textDark;
  const roastMaxW = w - pad * 2;
  // Add quotes around roast text
  const roastText = `\u201C${cardContent.tarot.roast}\u201D`;
  const roastLines = wrapText(ctx, roastText, roastMaxW).slice(0, 3);
  const roastLineHeight = roastSize * 1.45;
  for (const line of roastLines) {
    ctx.fillText(line, centerX, y);
    y += roastLineHeight;
  }
  y += format === 'story' ? 40 : 20;

  // ── Animal card (white/35% rounded rect) ─────────────────────────────────
  const animalPadX = 30 * s;
  const animalPadY = 24 * s;
  const animalCardX = pad;
  const animalCardW = w - pad * 2;

  // Pre-measure animal text to determine card height
  const animalNameSize = Math.round(24 * s);
  const animalTextSize = Math.round(22 * s);
  const animalTextLineH = animalTextSize * 1.4;
  ctx.font = `400 ${animalTextSize}px ${geist}`;
  const animalLines = wrapText(ctx, cardContent.animal.translation, animalCardW - animalPadX * 2).slice(0, 3);
  const animalCardH = animalPadY + animalNameSize + 12 * s + animalLines.length * animalTextLineH + animalPadY;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  roundRect(ctx, animalCardX, y, animalCardW, animalCardH, 20 * s);
  ctx.fill();

  // Animal name row
  let ay = y + animalPadY + animalNameSize;
  ctx.font = `600 ${animalNameSize}px ${geist}`;
  ctx.fillStyle = textDark;
  ctx.textAlign = 'center';
  ctx.fillText(`${cardContent.animal.emoji}  ${cardContent.animal.name}`, centerX, ay);
  ay += 12 * s;

  // Animal translation text
  ctx.font = `400 ${animalTextSize}px ${geist}`;
  ctx.fillStyle = textMuted;
  for (const line of animalLines) {
    ay += animalTextLineH;
    ctx.fillText(line, centerX, ay);
  }

  y += animalCardH + (format === 'story' ? 50 : 30);

  // ── Element dots + lucky number pills ────────────────────────────────────
  const pillH = Math.round(32 * s);
  const dotR = Math.round(6 * s);
  const dots = ELEMENT_DOTS[cardContent.element] ?? ELEMENT_DOTS.water;
  const elLabel = cardContent.element.charAt(0).toUpperCase() + cardContent.element.slice(1);

  // Measure pill widths
  ctx.font = `500 ${Math.round(16 * s)}px ${geist}`;
  const elText = `   ${elLabel}`;
  const elPillW = dots.length * (dotR * 2 + 6 * s) + ctx.measureText(elText).width + 24 * s;
  const numText = `${cardContent.luckyNumber}  Lucky #`;
  const numPillW = ctx.measureText(numText).width + 28 * s;
  const totalPillW = elPillW + 16 * s + numPillW;
  let px = centerX - totalPillW / 2;

  // Element pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  roundRect(ctx, px, y, elPillW, pillH, pillH / 2);
  ctx.fill();

  // Dots inside element pill
  let dotX = px + 14 * s;
  const dotY = y + pillH / 2;
  for (const color of dots) {
    ctx.beginPath();
    ctx.arc(dotX + dotR, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    dotX += dotR * 2 + 6 * s;
  }
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'left';
  ctx.fillText(elLabel, dotX + 4 * s, y + pillH / 2 + 5 * s);

  // Number pill
  px += elPillW + 16 * s;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  roundRect(ctx, px, y, numPillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'center';
  ctx.fillText(numText, px + numPillW / 2, y + pillH / 2 + 5 * s);

  y += pillH + (format === 'story' ? 80 : 40);

  // ── Footer: sparkle + Muse + url + tagline ───────────────────────────────
  // Sparkle
  ctx.font = `${Math.round(28 * s)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.fillText('\u2726', centerX, y);
  y += Math.round(36 * s);

  // "Muse"
  ctx.font = `700 ${Math.round(32 * s)}px ${playfair}`;
  ctx.fillStyle = accent;
  ctx.fillText('Muse', centerX, y);
  y += Math.round(28 * s);

  // "yourmuse.app"
  ctx.font = `400 ${Math.round(20 * s)}px ${geist}`;
  ctx.fillStyle = textLight;
  ctx.fillText('yourmuse.app', centerX, y);
  y += Math.round(24 * s);

  // "your cosmic vibe check"
  ctx.font = `italic 400 ${Math.round(16 * s)}px ${geist}`;
  ctx.fillStyle = textLight;
  ctx.fillText('your cosmic vibe check', centerX, y);

  // ── Export ────────────────────────────────────────────────────────────────
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

  return { blob, dataUrl };
}
