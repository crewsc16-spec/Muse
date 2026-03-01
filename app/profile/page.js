'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { COLOR_SCHEMES, getSavedScheme, saveScheme } from '@/app/lib/color-schemes';
// HD calculation is done server-side via /api/hd-chart (uses VSOP87 ephemeris)

const PROFILE_LINE_NAMES = {
  1: 'Investigator', 2: 'Hermit', 3: 'Martyr',
  4: 'Opportunist',  5: 'Heretic', 6: 'Role Model',
};

// Compute UTC offset (hours) for a given IANA timezone on a specific date
function getUtcOffset(tzName, dateStr) {
  try {
    const d = new Date((dateStr || new Date().toISOString().slice(0, 10)) + 'T12:00:00Z');
    const utcMs = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzMs  = new Date(d.toLocaleString('en-US', { timeZone: tzName }));
    return (tzMs - utcMs) / 3600000;
  } catch { return 0; }
}

// Format Nominatim result into a readable city label
function formatNominatimPlace(p) {
  const a = p.address ?? {};
  const city    = a.city || a.town || a.village || a.county || p.name;
  const region  = a.state || a.region;
  const country = a.country;
  return [city, region, country].filter(Boolean).join(', ');
}

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
  const [birthPlace, setBirthPlace] = useState('');
  const [birthTimezone, setBirthTimezone] = useState('');
  const [birthLat, setBirthLat] = useState(null);
  const [birthLon, setBirthLon] = useState(null);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [astroSystem, setAstroSystem] = useState('tropical');
  const [hdCalc, setHdCalc] = useState(null);
  const [astroSaved, setAstroSaved] = useState(false);
  const [hdLoading, setHdLoading] = useState(false);
  const [hdError, setHdError] = useState('');
  // Manual HD override
  const [hdTypeOverride, setHdTypeOverride] = useState('');
  const [hdProfileOverride, setHdProfileOverride] = useState('');
  const [showHdOverride, setShowHdOverride] = useState(false);

  // Milestones
  const [milestones, setMilestones] = useState([]);
  const [newLabel, setNewLabel]     = useState('');
  const [newDate, setNewDate]       = useState('');

  const fileInputRef = useRef(null);
  const debounceRef  = useRef(null);

  useEffect(() => {
    const supabase = createClient();
    setSb(supabase);

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      const meta = user?.user_metadata ?? {};

      // Display name — Supabase metadata wins over localStorage
      const dn = meta.displayName ?? localStorage.getItem('displayName') ?? '';
      setDisplayName(dn);
      if (dn) localStorage.setItem('displayName', dn);

      // Avatar — Supabase metadata wins over localStorage
      const au = meta.profilePhotoUrl ?? localStorage.getItem('profilePhotoUrl') ?? '';
      setAvatarUrl(au);
      if (au) localStorage.setItem('profilePhotoUrl', au);

      // Color scheme
      if (meta.colorScheme) {
        saveScheme(meta.colorScheme);
        setActiveScheme(meta.colorScheme);
      } else {
        setActiveScheme(getSavedScheme());
      }

      // Milestones — Supabase metadata wins over localStorage
      const ms = meta.milestones ?? (() => {
        try { return JSON.parse(localStorage.getItem('milestones') ?? 'null'); } catch { return null; }
      })();
      if (ms) {
        setMilestones(ms);
        localStorage.setItem('milestones', JSON.stringify(ms));
      }

      // Birth data — Supabase metadata wins over localStorage
      const bd = meta.birthData ?? (() => {
        try { return JSON.parse(localStorage.getItem('birthData') ?? 'null'); } catch { return null; }
      })();
      if (bd) {
        setBirthDate(bd.date ?? '');
        setBirthTime(bd.time ?? '');
        setBirthPlace(bd.birthPlace ?? '');
        setBirthTimezone(bd.birthTimezone ?? '');
        if (bd.birthLat != null) setBirthLat(bd.birthLat);
        if (bd.birthLon != null) setBirthLon(bd.birthLon);
        setAstroSystem(bd.system ?? 'tropical');
        if (bd.hdCalculated) {
          setHdCalc({
            type:         bd.hdType,
            profile:      bd.hdProfile,
            profileLine1: bd.hdProfileLine1,
            profileLine2: bd.hdProfileLine2,
          });
        }
        if (bd.hdTypeOverride) setHdTypeOverride(bd.hdTypeOverride);
        if (bd.hdProfileOverride) setHdProfileOverride(bd.hdProfileOverride);
        localStorage.setItem('birthData', JSON.stringify(bd));
      }
    });
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
      sb?.auth.updateUser({ data: { profilePhotoUrl: url } });
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // ── Display name ──
  function handleSaveName() {
    const name = displayName.trim();
    localStorage.setItem('displayName', name);
    sb?.auth.updateUser({ data: { displayName: name } });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  // ── Color scheme ──
  function handleSchemeSelect(key) {
    setActiveScheme(key);
    saveScheme(key);
    sb?.auth.updateUser({ data: { colorScheme: key } });
  }

  // ── Place search ──
  function handlePlaceInput(val) {
    setBirthPlace(val);
    setBirthTimezone('');
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setPlaceSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en-US,en' } }
        );
        const data = await res.json();
        setPlaceSuggestions(data.slice(0, 5).map(p => ({
          label: formatNominatimPlace(p),
          lat: parseFloat(p.lat),
          lon: parseFloat(p.lon),
        })));
        setShowSuggestions(true);
      } catch {}
      setLoadingSuggestions(false);
    }, 400);
  }

  async function handlePlaceSelect(place) {
    setBirthPlace(place.label);
    setBirthLat(place.lat);
    setBirthLon(place.lon);
    setShowSuggestions(false);
    setPlaceSuggestions([]);
    try {
      const res = await fetch(
        `https://timeapi.io/api/TimeZone/coordinate?latitude=${place.lat}&longitude=${place.lon}`
      );
      const data = await res.json();
      if (data.timeZone) setBirthTimezone(data.timeZone);
    } catch {}
  }

  // ── Astrology ──
  async function handleSaveAstro() {
    // Always clear stale result first so the UI reflects the current save
    setHdCalc(null);
    setHdError('');

    // Auto-geocode if birthPlace text is present but lat/lon are missing
    let resolvedLat = birthLat;
    let resolvedLon = birthLon;
    if (birthPlace && (resolvedLat == null || resolvedLon == null)) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(birthPlace)}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en-US,en' } }
        );
        const data = await res.json();
        if (data[0]) {
          resolvedLat = parseFloat(data[0].lat);
          resolvedLon = parseFloat(data[0].lon);
          setBirthLat(resolvedLat);
          setBirthLon(resolvedLon);
        }
      } catch {}
    }

    const utcOffset = birthTimezone ? getUtcOffset(birthTimezone, birthDate) : 0;
    const base = { date: birthDate, time: birthTime, birthPlace, birthTimezone, utcOffset, system: astroSystem, birthLat: resolvedLat, birthLon: resolvedLon };
    let hdFields = {};

    if (birthDate && birthTime && birthTimezone) {
      setHdLoading(true);
      try {
        const res = await fetch('/api/hd-chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ birthDate, birthTime, utcOffset, lat: resolvedLat, lon: resolvedLon }),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const result = await res.json();
        if (result.error) throw new Error(result.error);
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
        console.log('[HD] calculated (VSOP87):', result.type, result.profile, {
          definedCenters: result.definedCenters,
          designDate: result.designDate,
          utcOffset,
        });
      } catch (err) {
        console.error('[HD] calculation failed:', err);
        setHdError('Chart calculation failed — check your birth data and try again.');
      } finally {
        setHdLoading(false);
      }
    }

    // Apply manual overrides on top of calculated values
    if (hdTypeOverride) {
      hdFields.hdType = hdTypeOverride;
      if (hdFields.hdCalculated) {
        setHdCalc(prev => prev ? { ...prev, type: hdTypeOverride } : null);
      }
    }
    if (hdProfileOverride) {
      const [l1, l2] = hdProfileOverride.split('/').map(Number);
      hdFields.hdProfile = hdProfileOverride;
      hdFields.hdProfileLine1 = l1 || hdFields.hdProfileLine1;
      hdFields.hdProfileLine2 = l2 || hdFields.hdProfileLine2;
      if (hdFields.hdCalculated) {
        setHdCalc(prev => prev ? { ...prev, profile: hdProfileOverride, profileLine1: l1 || prev.profileLine1, profileLine2: l2 || prev.profileLine2 } : null);
      }
    }
    // If no birth time/place but override exists, still show it
    if ((hdTypeOverride || hdProfileOverride) && !hdFields.hdCalculated) {
      const [l1, l2] = (hdProfileOverride || '').split('/').map(Number);
      hdFields = {
        ...hdFields,
        hdType:         hdTypeOverride || '',
        hdProfile:      hdProfileOverride || '',
        hdProfileLine1: l1 || 0,
        hdProfileLine2: l2 || 0,
        hdCalculated:   !!(hdTypeOverride || hdProfileOverride),
      };
      if (hdTypeOverride || hdProfileOverride) {
        setHdCalc({
          type:         hdTypeOverride || '',
          profile:      hdProfileOverride || '',
          profileLine1: l1 || 0,
          profileLine2: l2 || 0,
        });
      }
    }

    const birthData = { ...base, ...hdFields, hdTypeOverride, hdProfileOverride };
    localStorage.setItem('birthData', JSON.stringify(birthData));
    sb?.auth.updateUser({ data: { birthData } });
    setAstroSaved(true);
    setTimeout(() => setAstroSaved(false), 2000);
  }

  // ── Milestones ──
  function saveMilestones(list) {
    setMilestones(list);
    localStorage.setItem('milestones', JSON.stringify(list));
    sb?.auth.updateUser({ data: { milestones: list } });
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

      {/* ── Astrology & Human Design ── */}
      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div>
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Astrology and Human Design</h2>
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

        {/* Birth Place */}
        <div className="space-y-2 relative">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest">
            Birth Place <span className="normal-case font-normal">(for timezone — enables HD chart)</span>
          </label>
          <input
            type="text"
            value={birthPlace}
            onChange={e => handlePlaceInput(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => placeSuggestions.length > 0 && setShowSuggestions(true)}
            placeholder="City, Country"
            className="w-full border border-white/50 bg-white/50 rounded-xl px-4 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
          />
          {loadingSuggestions && (
            <p className="text-xs text-gray-300 px-1">Searching…</p>
          )}
          {birthTimezone && !loadingSuggestions && (
            <p className="text-xs text-gray-300 px-1">🌍 {birthTimezone}</p>
          )}
          {showSuggestions && placeSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-sm border border-white/60 rounded-2xl shadow-lg overflow-hidden">
              {placeSuggestions.map((p, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={() => handlePlaceSelect(p)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-rose-50/80 truncate transition-colors"
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
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
          disabled={!birthDate || hdLoading}
          className="btn-gradient text-white px-6 py-2 rounded-full text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {hdLoading ? 'Calculating…' : astroSaved ? '✓ Saved' : 'Save'}
        </button>

        {hdError && <p className="text-xs text-red-400">{hdError}</p>}

        {/* HD results — shown after successful calculation */}
        {birthDate && (!birthTime || !birthTimezone) && (
          <p className="text-xs text-gray-300">
            Add birth time and birth place for HD chart calculation
          </p>
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
                {hdCalc.profile}{hdCalc.profileLine1 && hdCalc.profileLine2 ? ` — ${PROFILE_LINE_NAMES[hdCalc.profileLine1]} / ${PROFILE_LINE_NAMES[hdCalc.profileLine2]}` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Manual HD override */}
        <div className="pt-2 border-t border-white/30">
          <button
            type="button"
            onClick={() => setShowHdOverride(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
          >
            {showHdOverride ? '▲ Hide' : '▼ I know my chart — enter it manually'}
          </button>
          {showHdOverride && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-gray-300">
                If the calculated result doesn't match your official HD reading, enter your correct values below. These override the calculation when you Save.
              </p>
              <div className="space-y-1">
                <label className="block text-xs text-gray-400 uppercase tracking-widest">HD Type</label>
                <select
                  value={hdTypeOverride}
                  onChange={e => setHdTypeOverride(e.target.value)}
                  className="w-full border border-white/50 bg-white/50 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
                >
                  <option value="">— use calculated —</option>
                  <option value="generator">Generator</option>
                  <option value="manifesting-generator">Manifesting Generator</option>
                  <option value="manifestor">Manifestor</option>
                  <option value="projector">Projector</option>
                  <option value="reflector">Reflector</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-gray-400 uppercase tracking-widest">Profile</label>
                <select
                  value={hdProfileOverride}
                  onChange={e => setHdProfileOverride(e.target.value)}
                  className="w-full border border-white/50 bg-white/50 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
                >
                  <option value="">— use calculated —</option>
                  {['1/3','1/4','2/4','2/5','3/5','3/6','4/6','4/1','5/1','5/2','6/2','6/3'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-300">Hit Save above to apply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
