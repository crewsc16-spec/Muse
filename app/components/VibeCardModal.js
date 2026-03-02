'use client';

import { useEffect, useState, useCallback } from 'react';
import { buildVibeCardContent } from '@/app/lib/cosmic-roast';
import { renderVibeCard } from '@/app/lib/vibe-card-canvas';
import { getSavedScheme } from '@/app/lib/color-schemes';

const FORMATS = [
  { key: 'story',  label: 'Story 9:16' },
  { key: 'square', label: 'Square 1:1' },
];

export default function VibeCardModal({ content, dateStr, onClose }) {
  const [format, setFormat] = useState('story');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [blobRef, setBlobRef] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [sharing, setSharing] = useState(false);

  const generate = useCallback(async (fmt) => {
    setRendering(true);
    setPreviewUrl(null);
    try {
      const cardContent = buildVibeCardContent(content, dateStr);
      const scheme = getSavedScheme();
      const { blob, dataUrl } = await renderVibeCard(cardContent, fmt, scheme);
      setPreviewUrl(dataUrl);
      setBlobRef(blob);
    } catch (err) {
      console.error('Vibe card render error:', err);
    } finally {
      setRendering(false);
    }
  }, [content, dateStr]);

  useEffect(() => {
    generate(format);
  }, [format, generate]);

  const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare;

  async function handleShare() {
    if (!blobRef) return;
    setSharing(true);
    try {
      const file = new File([blobRef], 'cosmic-vibe-check.png', { type: 'image/png' });
      if (canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Cosmic Vibe Check',
          text: 'yourmuse.app',
        });
      } else {
        downloadBlob();
      }
    } catch (err) {
      // User cancelled share sheet — not an error
      if (err.name !== 'AbortError') console.error('Share error:', err);
    } finally {
      setSharing(false);
    }
  }

  function downloadBlob() {
    if (!blobRef) return;
    const url = URL.createObjectURL(blobRef);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmic-vibe-check-${dateStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/30">
          <h2 className="font-playfair text-xl text-gray-800">Share Your Vibe</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-5 flex items-center justify-center">
          {rendering ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Rendering...</p>
            </div>
          ) : previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt="Cosmic Vibe Check card preview"
              className="rounded-2xl shadow-lg"
              style={{ maxHeight: '50vh', objectFit: 'contain', width: 'auto' }}
            />
          ) : (
            <p className="text-sm text-gray-400 py-12">Could not generate card</p>
          )}
        </div>

        {/* Format toggle */}
        <div className="flex justify-center gap-2 px-5 pb-3">
          {FORMATS.map(f => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                format === f.key
                  ? 'btn-gradient text-white'
                  : 'bg-white/60 text-gray-500 hover:bg-white/80 border border-white/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={handleShare}
            disabled={!previewUrl || rendering || sharing}
            className="w-full btn-gradient text-white text-sm font-medium rounded-full px-6 py-2.5 disabled:opacity-50"
          >
            {sharing ? 'Sharing...' : canShare ? 'Share' : 'Download'}
          </button>
          {canShare && previewUrl && (
            <button
              onClick={downloadBlob}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              or download image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
