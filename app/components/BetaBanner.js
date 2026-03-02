'use client';

import { useState, useEffect } from 'react';

export default function BetaBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('betaBannerDismissed')) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem('betaBannerDismissed', '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative glass-card rounded-3xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/30">
          <h2 className="font-playfair text-xl text-gray-800">Under Construction</h2>
          <button
            onClick={dismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Muse is still being built! You may run into the occasional hiccup.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            If something looks off, try <strong>closing and reopening the app</strong> — that fixes most things.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Spot something off? Tap the
            <span className="inline-flex align-middle mx-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            feedback icon in the top bar anytime.
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button
            onClick={dismiss}
            className="w-full btn-gradient text-white text-sm font-medium rounded-full px-6 py-2.5"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
