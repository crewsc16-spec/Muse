'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { applyScheme } from '@/app/lib/color-schemes';

const USER_LS_KEYS = ['displayName', 'profilePhotoUrl', 'birthData', 'milestones', 'colorScheme'];

function syncMetaToLocalStorage(meta) {
  if (!meta) return;
  if (meta.displayName)    localStorage.setItem('displayName',    meta.displayName);
  if (meta.profilePhotoUrl) localStorage.setItem('profilePhotoUrl', meta.profilePhotoUrl);
  if (meta.birthData)      localStorage.setItem('birthData',      JSON.stringify(meta.birthData));
  if (meta.milestones)     localStorage.setItem('milestones',     JSON.stringify(meta.milestones));
  if (meta.colorScheme) {
    localStorage.setItem('colorScheme', meta.colorScheme);
    applyScheme(meta.colorScheme);
  }
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) syncMetaToLocalStorage(user.user_metadata);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        syncMetaToLocalStorage(session.user.user_metadata);
      }
      if (event === 'SIGNED_OUT') {
        USER_LS_KEYS.forEach(k => localStorage.removeItem(k));
        applyScheme('blush');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 backdrop-blur-md bg-white/60 border-b border-white/30 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-playfair text-xl tracking-tight" style={{ color: '#b88a92' }}>
          Muse
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/daily"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#b88a92] transition-colors font-medium bg-white/60 border border-white/40 rounded-full px-3 py-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[#b88a92] flex-shrink-0">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Daily
              </Link>
              <Link
                href="/cosmic"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#b88a92] transition-colors font-medium bg-white/60 border border-white/40 rounded-full px-3 py-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#b88a92] flex-shrink-0">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>
                </svg>
                Chart
              </Link>
              <Link
                href="/quizzes"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#b88a92] transition-colors font-medium bg-white/60 border border-white/40 rounded-full px-3 py-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[#b88a92] flex-shrink-0">
                  <path d="M12 2l1.5 4.5H18l-3.75 2.72 1.43 4.41L12 11.35l-3.68 2.28 1.43-4.41L6 6.5h4.5z M5 15l1 3H3zm14 0l1 3h-2zm-7 2l1 3h-2z"/>
                </svg>
                Quizzes
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#b88a92] transition-colors font-medium bg-white/60 border border-white/40 rounded-full px-3 py-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[#b88a92] flex-shrink-0">
                  <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/>
                </svg>
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-[#b88a92] transition-colors border border-gray-200 rounded-full px-3 py-1.5 hover:border-[#d4adb6]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs text-gray-400 hover:text-rose-400 transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="btn-gradient text-white text-xs px-4 py-2 rounded-full font-medium">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
