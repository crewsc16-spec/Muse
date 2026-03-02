'use client';

import { useEffect, useRef } from 'react';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function AutoUpdater() {
  const buildId = useRef(null);

  useEffect(() => {
    async function checkForUpdate() {
      try {
        const res = await fetch('/', { method: 'HEAD', cache: 'no-store' });
        const id = res.headers.get('x-nextjs-build-id') || res.headers.get('etag') || res.headers.get('last-modified');
        if (!id) return;
        if (buildId.current === null) {
          buildId.current = id;
        } else if (id !== buildId.current) {
          buildId.current = id;
          window.location.reload();
        }
      } catch {}
    }

    // Initial capture
    checkForUpdate();

    // Periodic check
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL);

    // Check on focus (user returns to app)
    function onFocus() { checkForUpdate(); }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return null;
}
