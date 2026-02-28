'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
                className="text-xs text-gray-500 hover:text-[#b88a92] transition-colors font-medium"
              >
                Daily
              </Link>
              <span className="hidden sm:block text-xs text-gray-400 max-w-[140px] truncate">
                {user.email}
              </span>
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
