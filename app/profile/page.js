'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { COLOR_SCHEMES, getSavedScheme, saveScheme } from '@/app/lib/color-schemes';
import { calculateHDChart } from '@/app/lib/hd-chart';

const PROFILE_LINE_NAMES = {
  1: 'Investigator', 2: 'Hermit', 3: 'Martyr',
  4: 'Opportunist',  5: 'Heretic', 6: 'Role Model',
};

function utcLabel(offset) {
  const sign = offset >= 0 ? '+' : '-';
  const abs  = Math.abs(offset);
  const h    = Math.floor(abs);
  const m    = (abs % 1) === 0.5 ? '30' : '00';
  return `UTC${sign}${String(h).padStart(2, '0')}:${m}`;
}

const UTC_OPTIONS = [];
for (let v = -12; v <= 14; v += 0.5) UTC_OPTIONS.push(v);

export default function ProfilePage() {
  const [user, setUser]           = useState(null);
  const [sb, setSb]               = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [activeScheme, setActiveScheme] = useState('blush');

  // Astrology
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [utcOffset, setUtcOffset] = useState(0);
  const [astroSystem, setAstroSystem] = useState('tropical');
  const [hdCalc, setHdCalc] = useState(null);
  const [astroSaved, setAstroSaved] = useState(false);

  // Milestones
  const [milestones, setMilestones] = useState([]);
  const [newLabel, setNewLabel]     = useState('');
  const [newDate, setNewDate]       = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const supabase = createClient();
    setSb(supabase);
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    setDisplayName(localStorage.getItem('displayName') ?? '');
    setAvatarUrl(localStorage.getItem('profilePhotoUrl') ?? '');
    setActiveScheme(getSavedScheme());
    try {
      const saved = localStorage.getItem('milestones');
      if (saved) setMilestones(JSON.parse(saved));
    } catch {}
    try {
      const bd = localStorage.getItem('birthData');
      if (bd) {
        const parsed = JSON.parse(bd);
        setBirthDate(parsed.date ?? '');
        setBirthTime(parsed.time ?? '');
        setUtcOffset(parsed.utcOffset ?? 0);
        setAstroSystem(parsed.system ?? 'tropical');
        if (parsed.hdCalculated) {
          setHdCalc({
            type:         parsed.hdType,
            profile:      parsed.hdProfile,
            profileLine1: parsed.hdProfileLine1,
            profileLine2: parsed.hdProfileLine2,
          });
        }
      }
    } catch {}
  }, []);

  // ── Avatar ──
  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !sb) return;
    setUploading(true); setUploadError('');
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const { data: { user: u } } = await sb.auth.getUser();
      const path = `${u.id}/avatar.${ext}`;
      await sb.storage.from('avatars').remove([path]);
      const { error } = await sb.storage.from('avatars').upload(path, file);
      if (error) throw error;
      const { data } = sb.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      localStorage.setItem('profilePhotoUrl', url);
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // ── Display name ──
  function handleSaveName() {
    localStorage.setItem('displayName', displayName.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  // ── Color scheme ──
  function handleSchemeSelect(key) {
    setActiveScheme(key);
    saveScheme(key);
  }

  // ── Astrology ──
  function handleSaveAstro() {
    const base = { date: birthDate, time: birthTime, utcOffset, system: astroSystem };
    let hdFields = {};
    if (birthDate && birthTime && utcOffset != null) {
      try {
        const result = calculateHDChart(birthDate, birthTime, utcOffset);
        hdFields = {
          hdType:            result.type,
          hdProfile:         result.profile,
          hdProfileLine1:    result.profileLine1,
          hdProfileLine2:    result.profileLine2,
          hdAuthority:       result.authority,
          hdDefinedCenters:  result.definedCenters,
          hdDefinedChannels: result.definedChannels,
          hdAllGates:        result.allGates,
          hdCalculated:      true,
        };
        setHdCalc({
          type:         result.type,
          profile:      result.profile,
          profileLine1: result.profileLine1,
          profileLine2: result.profileLine2,
        });
      } catch {}
    }
    localStorage.setItem('birthData', JSON.stringify({ ...base, ...hdFields }));
    setAstroSaved(true);
    setTimeout(() => setAstroSaved(false), 2000);
  }

  // ── Milestones ──
  function saveMilestones(list) {
    setMilestones(list);
    localStorage.setItem('milestones', JSON.stringify(list));
  }

  function addMilestone() {
    if (!newLabel.trim() || !newDate) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label: newLabel.trim(),
      startDate: new Date(newDate).toISOString(),
    };
    saveMilestones([...milestones, entry]);
    setNewLabel(''); setNewDate('');
  }

  function removeMilestone(id) {
    saveMilestones(milestones.filter(m => m.id !== id));
  }

  // ── Derived ──
  const initials = (displayName.trim() || user?.email || 'U')
    .split(/[\s@]/)[0].slice(0, 2).toUpperCase();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  // datetime-local max = now (milestones start in the past)
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);

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
          <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} />
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
              type="text" value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              placeholder="Your name"
              className="flex-1 border border-white/50 bg-white/50 rounded-full px-4 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
            />
            <button onClick={handleSaveName} className="btn-gradient text-white px-5 py-2 rounded-full text-sm font-medium">
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

      {/* ── Milestones ── */}
      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div>
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Milestones</h2>
          <p className="text-xs text-gray-300 mt-1">Track days sober, smoke-free, or anything meaningful to you.</p>
        </div>

        {/* Existing milestones */}
        {milestones.length > 0 && (
          <div className="space-y-2">
            {milestones.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-2xl border border-white/40">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 capitalize">{m.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Since {new Date(m.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => removeMilestone(m.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-sm px-1 shrink-0">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        <div className="space-y-3 pt-1 border-t border-white/40">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Add a Milestone</p>
          <input
            type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="e.g. days sober, smoke-free, clean, alcohol-free…"
            className="w-full border border-white/50 bg-white/50 rounded-full px-4 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
          />
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={newDate}
              max={nowLocal}
              onChange={e => setNewDate(e.target.value)}
              className="flex-1 border border-white/50 bg-white/50 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
            />
            <button
              onClick={addMilestone}
              disabled={!newLabel.trim() || !newDate}
              className="btn-gradient text-white px-5 py-2 rounded-full text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
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
              <div className="flex gap-1 shrink-0">
                {scheme.preview.map((color, i) => (
                  <div key={i} className="w-6 h-6 rounded-full shadow-sm" style={{ background: color }} />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">{scheme.name}</p>
                <p className="text-xs text-gray-400">{scheme.description}</p>
              </div>
              {activeScheme === key && (
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Astrology ── */}
      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div>
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Astrology</h2>
          <p className="text-xs text-gray-300 mt-1">Your birth data personalises your Daily Oracle pulls.</p>
        </div>

        {/* Birth Date */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest">Birth Date</label>
          <input
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            className="w-full border border-white/50 bg-white/50 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
          />
        </div>

        {/* Birth Time */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest">
            Birth Time <span className="normal-case font-normal">(optional — improves moon sign)</span>
          </label>
          <input
            type="time"
            value={birthTime}
            onChange={e => setBirthTime(e.target.value)}
            className="w-full border border-white/50 bg-white/50 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
          />
        </div>

        {/* Birth Timezone */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest">
            Birth Timezone (UTC±)
          </label>
          <select
            value={utcOffset}
            onChange={e => setUtcOffset(Number(e.target.value))}
            className="w-full border border-white/50 bg-white/50 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
          >
            {UTC_OPTIONS.map(v => (
              <option key={v} value={v}>{utcLabel(v)}</option>
            ))}
          </select>
        </div>

        {/* System selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest">Astrology System</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'tropical', label: 'Tropical' },
              { value: 'sidereal', label: 'Sidereal / Vedic' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setAstroSystem(opt.value)}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                  astroSystem === opt.value
                    ? 'btn-gradient text-white border-transparent'
                    : 'bg-white/50 text-gray-500 border-white/50 hover:bg-white/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSaveAstro}
          disabled={!birthDate}
          className="btn-gradient text-white px-6 py-2 rounded-full text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {astroSaved ? '✓ Saved' : 'Save'}
        </button>

        {/* HD results — shown after successful calculation */}
        {birthDate && !birthTime && (
          <p className="text-xs text-gray-300">Add birth time for HD chart calculation</p>
        )}
        {hdCalc && (
          <div className="space-y-3 pt-3 border-t border-white/40">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Human Design Type</span>
              <span className="text-sm text-gray-600 capitalize">{hdCalc.type.replace(/-/g, ' ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Profile</span>
              <span className="text-sm text-gray-600">
                {hdCalc.profile} — {PROFILE_LINE_NAMES[hdCalc.profileLine1]} / {PROFILE_LINE_NAMES[hdCalc.profileLine2]}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
