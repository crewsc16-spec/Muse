'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { applyScheme } from '@/app/lib/color-schemes';

const USER_LS_KEYS = ['displayName', 'profilePhotoUrl', 'birthData', 'milestones', 'colorScheme', 'boardSizes', 'quiz-embeds'];

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

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    ),
    iconSm: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    ),
    exact: true,
  },
  {
    href: '/board',
    label: 'Board',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm13 0a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"/>
      </svg>
    ),
    iconSm: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm13 0a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"/>
      </svg>
    ),
  },
  {
    href: '/journal',
    label: 'Journal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM9 7h6v2H9V7zm0 4h6v2H9v-2zm0 4h4v2H9v-2z"/>
      </svg>
    ),
    iconSm: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM9 7h6v2H9V7zm0 4h6v2H9v-2zm0 4h4v2H9v-2z"/>
      </svg>
    ),
  },
  {
    href: '/daily',
    label: 'Daily',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    iconSm: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
  {
    href: '/cosmic',
    label: 'Chart',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>
      </svg>
    ),
    iconSm: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="12" cy="12" r="4"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>
      </svg>
    ),
  },
  {
    href: '/quizzes',
    label: 'Quizzes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l1.5 4.5H18l-3.75 2.72 1.43 4.41L12 11.35l-3.68 2.28 1.43-4.41L6 6.5h4.5z M5 15l1 3H3zm14 0l1 3h-2zm-7 2l1 3h-2z"/>
      </svg>
    ),
    iconSm: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <path d="M12 2l1.5 4.5H18l-3.75 2.72 1.43 4.41L12 11.35l-3.68 2.28 1.43-4.41L6 6.5h4.5z M5 15l1 3H3zm14 0l1 3h-2zm-7 2l1 3h-2z"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/>
      </svg>
    ),
    iconSm: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/>
      </svg>
    ),
  },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setReady(true);
      if (user) syncMetaToLocalStorage(user.user_metadata);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
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

  function isActive(item) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  }

  return (
    <>
      {/* ── Top bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/60 border-b border-white/30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-playfair text-xl tracking-tight" style={{ color: '#b88a92' }}>
            Muse
          </Link>

          {user ? (
            <>
              {/* Desktop nav — hidden on mobile */}
              <div className="hidden md:flex items-center gap-2">
                {NAV_ITEMS.map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors bg-white/60 border border-white/40 rounded-full px-3 py-1.5 ${
                      isActive(item) ? 'text-[#b88a92]' : 'text-gray-600 hover:text-[#b88a92]'
                    }`}
                  >
                    {item.iconSm}
                    {item.label}
                  </a>
                ))}
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-[#b88a92] transition-colors border border-gray-200 rounded-full px-3 py-1.5 hover:border-[#d4adb6]"
                >
                  Log out
                </button>
              </div>

              {/* Mobile top-right: log out only */}
              <button
                onClick={handleLogout}
                className="md:hidden text-xs text-gray-400 hover:text-[#b88a92] transition-colors border border-gray-200 rounded-full px-3 py-1.5"
              >
                Log out
              </button>
            </>
          ) : ready ? (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-xs text-gray-400 hover:text-rose-400 transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="btn-gradient text-white text-xs px-4 py-2 rounded-full font-medium">
                Sign up
              </Link>
            </div>
          ) : null}
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ── */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-t border-white/50"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-stretch">
            {NAV_ITEMS.map(item => {
              const active = isActive(item);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 transition-colors ${
                    active ? 'text-[#b88a92]' : 'text-gray-400'
                  }`}
                  title={item.label}
                >
                  {item.icon}
                  <span className={`w-1.5 h-1.5 rounded-full transition-opacity ${active ? 'bg-[#b88a92] opacity-100' : 'opacity-0'}`} />
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
