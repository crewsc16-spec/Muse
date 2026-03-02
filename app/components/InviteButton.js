'use client';

import { useState } from 'react';

const SHARE_DATA = {
  title: 'Muse',
  text: 'Check out Muse — astrology, Human Design, tarot, journaling & vision boards all in one place.',
  url: 'https://yourmuse.app',
};

export default function InviteButton({ className = '' }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (navigator.share) {
      try {
        await navigator.share(SHARE_DATA);
      } catch {
        // user cancelled share sheet
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(SHARE_DATA.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <button
      onClick={handleClick}
      title={copied ? 'Copied!' : 'Invite a friend'}
      className={`text-gray-400 hover:text-[#b88a92] transition-colors border border-gray-200 rounded-full p-1.5 hover:border-[#d4adb6] ${className}`}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      )}
    </button>
  );
}
