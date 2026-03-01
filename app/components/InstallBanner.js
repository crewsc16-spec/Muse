'use client';

import { useEffect, useState } from 'react';
import { track } from '@vercel/analytics';

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState(null); // 'ios' | 'android'

  useEffect(() => {
    // Don't show if already installed as PWA
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      // Track that this session is running from home screen (once per session)
      if (!sessionStorage.getItem('pwa-tracked')) {
        const ua = navigator.userAgent;
        const os = /iphone|ipad|ipod/i.test(ua) ? 'ios' : /android/i.test(ua) ? 'android' : 'desktop';
        track('pwa_opened', { os });
        sessionStorage.setItem('pwa-tracked', '1');
      }
      return;
    }

    // Don't show if already dismissed
    if (localStorage.getItem('pwa-banner-dismissed')) return;

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);

    if (isIOS) { setPlatform('ios'); setShow(true); }
    else if (isAndroid) { setPlatform('android'); setShow(true); }
  }, []);

  function dismiss() {
    localStorage.setItem('pwa-banner-dismissed', '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-[72px] left-3 right-3 z-40 glass-card rounded-2xl p-4 shadow-lg border border-white/50 md:hidden">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      <div className="flex items-start gap-3 pr-4">
        {/* App icon */}
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm"
          style={{ background: 'linear-gradient(135deg, #fdf8f3, #fce8e8, #e8e0f5)' }}>
          <span className="font-playfair text-lg" style={{ color: '#b88a92' }}>M</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 mb-0.5">Add Muse to your home screen</p>

          {platform === 'ios' && (
            <p className="text-xs text-gray-400 leading-snug">
              Tap the{' '}
              <svg className="inline w-3.5 h-3.5 mb-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h3v2H6v11h12V10h-3V8h3a2 2 0 0 1 2 2z"/>
              </svg>
              {' '}Share button, then <strong>Add to Home Screen</strong>
            </p>
          )}

          {platform === 'android' && (
            <p className="text-xs text-gray-400 leading-snug">
              Tap the <strong>⋮</strong> menu in Chrome, then <strong>Add to Home Screen</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
