'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { COLOR_SCHEMES, getSavedScheme, saveScheme } from '@/app/lib/color-schemes';

export default function ProfilePage() {
  const [user, setUser]           = useState(null);
  const [sb, setSb]               = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [activeScheme, setActiveScheme] = useState('blush');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const supabase = createClient();
    setSb(supabase);
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    setDisplayName(localStorage.getItem('displayName') ?? '');
    setAvatarUrl(localStorage.getItem('profilePhotoUrl') ?? '');
    setActiveScheme(getSavedScheme());
  }, []);

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !sb) return;
    setUploading(true); setUploadError('');
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const { data: { user: u } } = await sb.auth.getUser();
      const path = `${u.id}/avatar.${ext}`;
      // Overwrite any existing avatar
      await sb.storage.from('avatars').remove([path]);
      const { error } = await sb.storage.from('avatars').upload(path, file);
      if (error) throw error;
      const { data } = sb.storage.from('avatars').getPublicUrl(path);
      // Cache-bust so the browser re-fetches the updated image
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      localStorage.setItem('profilePhotoUrl', url);
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleSaveName() {
    localStorage.setItem('displayName', displayName.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  function handleSchemeSelect(key) {
    setActiveScheme(key);
    saveScheme(key);
  }

  const initials = (displayName.trim() || user?.email || 'U')
    .split(/[\s@]/)[0]
    .slice(0, 2)
    .toUpperCase();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="font-playfair text-3xl text-gray-700">Profile</h1>

      {/* ── Account card ── */}
      <div className="glass-card rounded-3xl p-6 space-y-6">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/60"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile photo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full btn-gradient flex items-center justify-center">
                <span className="text-white text-2xl font-semibold select-none">{initials}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? 'Uploading…' : 'Change'}
              </span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarUpload}
          />
          <p className="text-xs text-gray-400">Click to upload a photo</p>
          {uploadError && <p className="text-red-400 text-xs text-center">{uploadError}</p>}
        </div>

        {/* Display name */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest">
            Display Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              placeholder="Your name"
              className="flex-1 border border-white/50 bg-white/50 rounded-full px-4 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
            />
            <button
              onClick={handleSaveName}
              className="btn-gradient text-white px-5 py-2 rounded-full text-sm font-medium"
            >
              {nameSaved ? '✓' : 'Save'}
            </button>
          </div>
        </div>

        {/* Account info */}
        <div className="space-y-3 pt-2 border-t border-white/40">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Email</span>
            <span className="text-sm text-gray-600 truncate max-w-[200px]">{user?.email ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Member since</span>
            <span className="text-sm text-gray-600">{memberSince}</span>
          </div>
        </div>
      </div>

      {/* ── Color scheme ── */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Color Scheme</h2>
        <div className="space-y-2">
          {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
            <button
              key={key}
              onClick={() => handleSchemeSelect(key)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                activeScheme === key
                  ? 'border-[var(--accent)] bg-white/70'
                  : 'border-transparent bg-white/40 hover:bg-white/60'
              }`}
            >
              {/* Color preview swatches */}
              <div className="flex gap-1 shrink-0">
                {scheme.preview.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full shadow-sm"
                    style={{ background: color }}
                  />
                ))}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">{scheme.name}</p>
                <p className="text-xs text-gray-400">{scheme.description}</p>
              </div>

              {/* Active dot */}
              {activeScheme === key && (
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
