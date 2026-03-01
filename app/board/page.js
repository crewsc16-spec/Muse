'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';
import {
  getMoodEntries, saveMoodEntry,
  getVisionItems, saveVisionItem, deleteVisionItem,
  getGoals, addGoal, deleteGoal, getTodayCompletions, toggleGoalCompletion,
  uploadVisionImage,
} from '../lib/storage';
import { getQuotes, QUOTE_CATEGORIES } from '../lib/quotes';
import { getLunarPhase } from '../lib/astrology';
import MoodFace from '../components/MoodFace';

const MOODS = [
  { value: 1, label: 'Rough',  color: '#c5bcba' },
  { value: 2, label: 'Meh',    color: '#d0b8b8' },
  { value: 3, label: 'Okay',   color: '#cdb4bc' },
  { value: 4, label: 'Good',   color: '#c9a0a8' },
  { value: 5, label: 'Great',  color: '#b88a92' },
];

const CATEGORIES = [
  { value: 'health',        label: 'Health',        color: '#a8c5a0' },
  { value: 'career',        label: 'Career',        color: '#a0b5c5' },
  { value: 'relationships', label: 'Relationships', color: '#c5a0a8' },
  { value: 'personal',      label: 'Personal',      color: '#c5a0b8' },
  { value: 'travel',        label: 'Travel',        color: '#c5b8a0' },
];

const TYPES = [
  { value: 'image',       label: 'Image' },
  { value: 'quote',       label: 'Quote' },
  { value: 'affirmation', label: 'Affirmation' },
];

// Milestone counter helper
function computeDuration(startDate, now) {
  const diffMs = Math.max(0, now - new Date(startDate));
  const totalMinutes = Math.floor(diffMs / 60000);
  const years   = Math.floor(totalMinutes / 525960);
  const months  = Math.floor((totalMinutes % 525960) / 43830);
  const days    = Math.floor((totalMinutes % 43830) / 1440);
  const hours   = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return { years, months, days, hours, minutes };
}

// Image size → aspect ratio (S=short landscape, M=standard, L=tall portrait)
const IMG_ASPECTS = { sm: 'aspect-[5/3]', md: 'aspect-[4/3]', lg: 'aspect-[3/4]' };

const CATEGORY_BG = {
  health:        '#f0f6f3',
  career:        '#f0f4f8',
  relationships: '#faf0f0',
  personal:      '#faf0f5',
  travel:        '#faf5ee',
  reflection:    '#f5f0fa',
};

// ── Moon phase SVG ──
function computeMoonT(dateStr) {
  const SYNODIC = 29.53058867;
  const ANCHOR  = new Date('2000-01-06T18:14:00Z');
  const days    = (new Date(dateStr + 'T12:00:00Z') - ANCHOR) / 86400000;
  return (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;
}

// Renders the moon disk as raw SVG elements — usable inside an <svg> or <g>
function MoonSVGShape({ dateStr, cx, cy, r, dark = '#1f1535', light = '#ffffff' }) {
  const t  = computeMoonT(dateStr);
  const ex = (Math.abs(Math.cos(t * 2 * Math.PI)) * r).toFixed(3);
  const top = `${cx},${cy - r}`;
  const bot = `${cx},${cy + r}`;

  let litPath;
  if (t < 0.5) {
    const ts = t < 0.25 ? 1 : 0;
    litPath = `M ${top} A ${r},${r} 0 0,1 ${bot} A ${ex},${r} 0 0,${ts} ${top} Z`;
  } else {
    const ts = t < 0.75 ? 1 : 0;
    litPath = `M ${top} A ${r},${r} 0 0,0 ${bot} A ${ex},${r} 0 0,${ts} ${top} Z`;
  }

  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={dark} />
      <path d={litPath} fill={light} />
    </>
  );
}

// Standalone HTML-embeddable moon icon
function MoonPhaseIcon({ dateStr, size = 20, dark = '#1f1535', light = '#ffffff' }) {
  const r = size / 2 - 0.5;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      <MoonSVGShape dateStr={dateStr} cx={c} cy={c} r={r} dark={dark} light={light} />
    </svg>
  );
}

// ── Inline photo search ──
function InlinePhotoSearch({ onSelect, sb }) {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setPhotos(data.photos);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  }

  async function handleUpload() {
    if (!uploadFile || !sb) return;
    setUploading(true); setError('');
    try {
      const url = await uploadVisionImage(sb, uploadFile);
      onSelect({ regular: url, thumb: url, id: 'upload', alt: 'Uploaded image' });
      setPreviewUrl(''); setUploadFile(null);
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  }

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {['search', 'upload'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              tab === t ? 'btn-gradient text-white' : 'bg-white/60 text-gray-400 hover:bg-white/80 border border-white/50'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <>
          <form onSubmit={search} className="flex gap-2">
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search mountains, flowers, travel…"
              className="flex-1 border border-white/50 bg-white/50 rounded-full px-4 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
            />
            <button type="submit" disabled={loading} className="btn-gradient text-white px-4 py-2 rounded-full text-sm font-medium">
              {loading ? '…' : 'Search'}
            </button>
          </form>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {photos.length > 0 && (
            <>
              <div className="max-h-48 overflow-y-auto rounded-xl">
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map(photo => (
                    <button key={photo.id} onClick={() => onSelect(photo)}
                      className="relative aspect-square rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#c4929a]">
                      <Image src={photo.thumb} alt={photo.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-200" sizes="100px" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 text-right">
                Photos from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>
              </p>
            </>
          )}
        </>
      )}

      {tab === 'upload' && (
        <div className="space-y-3">
          {!previewUrl ? (
            <label className="block cursor-pointer">
              <div className="w-full rounded-2xl border-2 border-dashed border-white/60 hover:border-[#d4adb6]/60 transition-colors p-8 text-center bg-white/30">
                <p className="text-sm text-gray-400 mb-1">Click to choose a photo</p>
                <p className="text-xs text-gray-300">JPG, PNG, WEBP</p>
              </div>
              <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setPreviewUrl(''); setUploadFile(null); }}
                className="absolute top-2 right-2 bg-black/30 text-white rounded-full w-6 h-6 text-xs hover:bg-black/50 transition-colors">
                ✕
              </button>
            </div>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {uploadFile && (
            <button onClick={handleUpload} disabled={uploading}
              className="w-full btn-gradient text-white py-2.5 rounded-full text-sm font-medium">
              {uploading ? 'Uploading…' : 'Add to Board'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Inline quote search ──
function InlineQuoteSearch({ onSelect }) {
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const quotes = getQuotes(cat, search);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {QUOTE_CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCat(c.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              cat === c.value ? 'btn-gradient text-white' : 'bg-white/60 text-gray-400 hover:bg-white/80 border border-white/50'
            }`}>
            {c.label}
          </button>
        ))}
      </div>
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search quotes or authors…"
        className="w-full border border-white/50 bg-white/50 rounded-full px-4 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
      />
      <div className="max-h-48 overflow-y-auto space-y-1.5">
        {quotes.length === 0
          ? <p className="text-gray-400 text-xs text-center py-4">No quotes found.</p>
          : quotes.map(quote => (
            <button key={quote.id} onClick={() => onSelect(quote)}
              className="w-full text-left p-3 rounded-xl bg-white/50 hover:bg-white/80 border border-white/40 hover:border-[#d4adb6]/50 transition-all">
              <p className="text-gray-600 text-xs italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">— {quote.author}</p>
            </button>
          ))
        }
      </div>
    </div>
  );
}

// ── Mood Trend Chart ──
function MoodTrendChart({ entries }) {
  const [range, setRange] = useState('30');
  const [hovered, setHovered] = useState(null);

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));

  const filtered = range === 'all' ? sorted : sorted.filter(e => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(range));
    return new Date(e.date + 'T00:00:00') >= cutoff;
  });

  const showMoonRow = range === '7' || filtered.length <= 10;
  const W = 320;
  const H = showMoonRow ? 130 : 110;
  const pad = { top: 10, right: 12, bottom: showMoonRow ? 42 : 28, left: 30 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const xScale = i => filtered.length === 1 ? cW / 2 : (i / (filtered.length - 1)) * cW;
  const yScale = v => cH - ((v - 1) / 4) * cH;

  const pts = filtered.map((e, i) => ({
    x: xScale(i), y: yScale(e.mood), entry: e,
    moon: getLunarPhase(e.date),
  }));

  const linePath = pts.length < 2 ? '' : pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + pt.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)} ${cpx} ${pt.y.toFixed(1)} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const fillPath = pts.length < 2 ? '' :
    `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${cH} L ${pts[0].x.toFixed(1)} ${cH} Z`;

  const xLabelIndices = (() => {
    if (pts.length <= 5) return pts.map((_, i) => i);
    const step = Math.floor((pts.length - 1) / 4);
    return [0, step, step * 2, step * 3, pts.length - 1];
  })();

  const yLabels = { 1: 'Rough', 3: 'Okay', 5: 'Great' };

  function formatXLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    if (range === '7') return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const hovEntry = hovered !== null ? pts[hovered]?.entry : null;

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Mood Trend</h2>
        <div className="flex gap-1">
          {[['7', '7d'], ['30', '30d'], ['all', 'All']].map(([v, l]) => (
            <button key={v} onClick={() => { setRange(v); setHovered(null); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                range === v ? 'btn-gradient text-white' : 'bg-white/60 text-gray-400 hover:bg-white/80 border border-white/50'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Hover tooltip row */}
      <div className="min-h-[22px] mb-2 flex items-center gap-2">
        {hovered !== null && pts[hovered] && (() => {
          const pt = pts[hovered];
          return (
            <>
              <MoodFace mood={pt.entry.mood} size={16} />
              <span className="text-xs font-medium" style={{ color: MOODS[pt.entry.mood - 1]?.color }}>
                {MOODS[pt.entry.mood - 1]?.label}
              </span>
              <span className="text-xs text-gray-300">·</span>
              <MoonPhaseIcon dateStr={pt.entry.date} size={14} />
              <span className="text-xs text-gray-400">{pt.moon.name}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">
                {new Date(pt.entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </>
          );
        })()}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-300 py-4 text-center">No entries in this range.</p>
      ) : filtered.length === 1 ? (
        <div className="flex items-center justify-center gap-2 py-4">
          <MoodFace mood={filtered[0].mood} size={28} />
          <span className="text-sm text-gray-400">{MOODS[filtered[0].mood - 1]?.label}</span>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
          <defs>
            <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4929a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c4929a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g transform={`translate(${pad.left}, ${pad.top})`}>
            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map(v => (
              <line key={v} x1={0} y1={yScale(v)} x2={cW} y2={yScale(v)}
                stroke="#ecdde2" strokeWidth="0.5" strokeDasharray="3,3" />
            ))}
            {/* Gradient fill */}
            <path d={fillPath} fill="url(#moodFill)" />
            {/* Line */}
            <path d={linePath} fill="none" stroke="#c4929a" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots */}
            {pts.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y}
                r={hovered === i ? 4.5 : 2.5}
                fill={hovered === i ? '#b88a92' : '#c4929a'}
                stroke="white" strokeWidth={hovered === i ? 1.5 : 0}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
            {/* Y-axis labels */}
            {[1, 3, 5].map(v => (
              <text key={v} x={-6} y={yScale(v) + 3.5} textAnchor="end"
                fontSize="7.5" fill="#c4b4b8" fontFamily="sans-serif">
                {yLabels[v]}
              </text>
            ))}
            {/* Moon phase row — shown when ≤ 14 entries */}
            {showMoonRow && pts.map((pt, i) => (
              <MoonSVGShape key={i} dateStr={pt.entry.date} cx={pt.x} cy={cH + 10} r={5} />
            ))}
            {/* X-axis labels */}
            {xLabelIndices.map(i => (
              <text key={i} x={pts[i].x} y={cH + (showMoonRow ? 30 : 17)} textAnchor="middle"
                fontSize="7.5" fill="#c4b4b8" fontFamily="sans-serif">
                {formatXLabel(filtered[i].date)}
              </text>
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}

// ── Main page ──
export default function Home() {
  const [user, setUser]   = useState(null);
  const [sb, setSb]       = useState(null);

  // Today's entry form
  const [selectedMood, setSelectedMood] = useState(null);
  const [notes, setNotes]               = useState('');
  const [showBoardPiece, setShowBoardPiece] = useState(false);
  const [type, setType]       = useState('image');
  const [category, setCategory] = useState('personal');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving]   = useState(false);
  const [moodSaved, setMoodSaved] = useState(false);

  // Data
  const [entries, setEntries] = useState([]);
  const [items, setItems]     = useState([]);
  const [goals, setGoals]     = useState([]);
  const [completions, setCompletions] = useState(new Set());
  const [newGoalText, setNewGoalText] = useState('');

  // Board interaction
  const [expandedId, setExpandedId] = useState(null);
  const [itemSizes, setItemSizes] = useState({});

  // Milestones
  const [milestones, setMilestones] = useState([]);
  const [now, setNow] = useState(() => new Date());

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const ticker = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    setSb(supabase);
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Load milestones and boardSizes from Supabase metadata
        const meta = user.user_metadata ?? {};
        if (meta.milestones) setMilestones(meta.milestones);
        if (meta.boardSizes) setItemSizes(meta.boardSizes);
        loadAll(supabase);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const meta = session.user.user_metadata ?? {};
        if (meta.milestones) setMilestones(meta.milestones);
        if (meta.boardSizes) setItemSizes(meta.boardSizes);
        loadAll(supabase);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadAll(supabase) {
    const [moodData, boardData, goalsData, completionData] = await Promise.all([
      getMoodEntries(supabase),
      getVisionItems(supabase),
      getGoals(supabase),
      getTodayCompletions(supabase, today),
    ]);
    setEntries(moodData);
    setItems(boardData);
    setGoals(goalsData);
    setCompletions(completionData);
    const todayEntry = moodData.find(e => e.date === today);
    if (todayEntry) {
      setSelectedMood(todayEntry.mood);
      setNotes(todayEntry.notes || '');
    }
  }

  // Save mood + optional board piece together
  async function handleSaveEntry() {
    if (!selectedMood || !sb) return;
    setSaving(true);
    try {
      // 1. Save mood entry, get back its ID
      const moodResult = await saveMoodEntry(sb, {
        date: today, mood: selectedMood, notes: notes.trim(),
      });
      const moodEntryId = moodResult?.[0]?.id;
      const updatedEntries = await getMoodEntries(sb);
      setEntries(updatedEntries);

      // 2. Save linked board piece if one was added
      const hasContent = type === 'image' ? imageUrl.trim() : content.trim();
      if (showBoardPiece && hasContent && moodEntryId) {
        const item = await saveVisionItem(sb, {
          type, category,
          content: content.trim() || null,
          image_url: type === 'image' ? imageUrl.trim() : null,
          mood_entry_id: moodEntryId,
        });
        setItems(prev => [item, ...prev]);
      }

      setContent(''); setImageUrl(''); setShowBoardPiece(false);
      setNotes(''); setSelectedMood(null);
      setMoodSaved(true);
      setTimeout(() => setMoodSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(id) {
    if (!sb) return;
    await deleteVisionItem(sb, id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function handleDeleteMoodEntry(date) {
    if (!sb) return;
    await sb.from('mood_entries').delete().eq('date', date);
    setEntries(prev => prev.filter(e => e.date !== date));
  }

  // Goals
  async function handleAddGoal(e) {
    e.preventDefault();
    if (!newGoalText.trim() || !sb) return;
    const goal = await addGoal(sb, newGoalText.trim());
    setGoals(prev => [...prev, goal]);
    setNewGoalText('');
  }

  async function handleDeleteGoal(id) {
    if (!sb) return;
    await deleteGoal(sb, id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  async function handleToggleCompletion(goalId) {
    const completing = !completions.has(goalId);
    setCompletions(prev => {
      const next = new Set(prev);
      completing ? next.add(goalId) : next.delete(goalId);
      return next;
    });
    await toggleGoalCompletion(sb, goalId, today, completing);
  }

  function setItemSize(key, size) {
    setItemSizes(prev => {
      const next = { ...prev, [key]: size };
      sb?.auth.updateUser({ data: { boardSizes: next } });
      return next;
    });
  }

  // Board: vision items (some linked to mood entries) + pure mood entries
  const linkedMoodIds = new Set(items.filter(i => i.mood_entry_id).map(i => i.mood_entry_id));
  const pureMoodEntries = entries.filter(e => !linkedMoodIds.has(e.id));

  const boardItems = [
    ...items.map(i => ({ _kind: 'vision', _sortDate: i.created_at, ...i })),
    ...pureMoodEntries.map(e => ({ _kind: 'mood', _sortDate: e.created_at || e.date, ...e })),
  ].sort((a, b) => new Date(b._sortDate) - new Date(a._sortDate));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // ── Hero ──
  if (!user) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium" style={{ color: '#b88a92' }}>{todayFormatted}</p>
          <h1 className="font-playfair text-4xl text-gray-700 mt-1">Welcome to Muse</h1>
        </div>
        <div className="glass-card rounded-3xl p-10 text-center">
          <div className="flex justify-center gap-4 mb-6">
            {[1, 2, 3, 4, 5].map(v => <MoodFace key={v} mood={v} size={36} />)}
          </div>
          <h2 className="font-playfair text-2xl text-gray-700 mb-3">Your personal sanctuary</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-8">
            Track your moods, build your vision board, and manifest the life you deserve.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/signup" className="btn-gradient text-white px-6 py-3 rounded-full font-medium text-sm">
              Get started free
            </Link>
            <Link href="/login" className="border text-sm px-6 py-3 rounded-full font-medium hover:bg-white/50 transition-colors" style={{ borderColor: '#d4adb6', color: '#b88a92' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── App ──
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-sm font-medium" style={{ color: '#b88a92' }}>{todayFormatted}</p>
        <h1 className="font-playfair text-4xl text-gray-700 mt-1">{greeting()}</h1>
      </div>

      {/* ── Milestones ── */}
      {milestones.length > 0 && (
        <div className="space-y-3">
          {milestones.map(m => {
            const { years, months, days, hours, minutes } = computeDuration(m.startDate, now);
            const allUnits = [
              { value: years,   label: 'yr' },
              { value: months,  label: 'mo' },
              { value: days,    label: 'd'  },
              { value: hours,   label: 'h'  },
              { value: minutes, label: 'm'  },
            ];
            const firstNZ = allUnits.findIndex(u => u.value > 0);
            const display = firstNZ === -1 ? [{ value: 0, label: 'm' }] : allUnits.slice(firstNZ);
            return (
              <div key={m.id} className="glass-card rounded-3xl px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-widest mb-3 capitalize" style={{ color: 'var(--accent)' }}>
                  {m.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {display.map(u => (
                    <div key={u.label} className="flex flex-col items-center min-w-[52px] bg-white/60 rounded-2xl px-3 py-2 shadow-sm">
                      <span className="font-playfair text-2xl text-gray-700 leading-none">{u.value}</span>
                      <span className="text-xs text-gray-400 mt-1">{u.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Today's Entry — combined mood + board piece ── */}
      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Today&apos;s Entry</h2>
          {(() => {
            const phase = getLunarPhase(today);
            return (
              <div className="flex items-center gap-1.5">
                <MoonPhaseIcon dateStr={today} size={18} />
                <span className="text-xs text-gray-400">{phase.name}</span>
              </div>
            );
          })()}
        </div>

        {/* Mood faces */}
        <div className="flex gap-2">
          {MOODS.map(mood => (
            <button key={mood.value} onClick={() => setSelectedMood(mood.value)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl transition-all ${
                selectedMood === mood.value ? 'bg-white shadow-sm scale-105' : 'hover:bg-white/50'
              }`}>
              <MoodFace mood={mood.value} size={34} selected={selectedMood === mood.value} />
              <span className="text-xs text-gray-400">{mood.label}</span>
            </button>
          ))}
        </div>

        {/* Notes */}
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="What's on your mind today?"
          rows={3}
          className="w-full border border-white/50 bg-white/50 rounded-2xl p-4 text-gray-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40 focus:border-transparent"
        />

        {/* Board piece toggle */}
        <button
          onClick={() => setShowBoardPiece(!showBoardPiece)}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: showBoardPiece ? '#b88a92' : '#c4b4b8' }}
        >
          <span className="text-lg leading-none">{showBoardPiece ? '−' : '+'}</span>
          Add to your board
        </button>

        {/* Board piece form — shown inline when toggled */}
        {showBoardPiece && (
          <div className="space-y-4 pt-1">
            {/* Type */}
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button key={t.value}
                  onClick={() => { setType(t.value); setContent(''); setImageUrl(''); }}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                    type === t.value ? 'btn-gradient text-white' : 'bg-white/60 text-gray-400 hover:bg-white/80 border border-white/50'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Category */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === c.value ? 'bg-white shadow-sm text-gray-600' : 'bg-white/60 text-gray-400 hover:bg-white/80 border border-white/50'
                  }`}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                  {c.label}
                </button>
              ))}
            </div>

            {/* Content — contextual */}
            {type === 'image' && (
              <div className="space-y-3">
                <InlinePhotoSearch onSelect={photo => { setImageUrl(photo.regular); setContent(''); }} sb={sb} />
                {imageUrl && (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden">
                    <Image src={imageUrl} alt="Selected" fill className="object-cover" sizes="600px" />
                  </div>
                )}
                <input type="text" value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Caption (optional)"
                  className="w-full border border-white/50 bg-white/50 rounded-xl p-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
                />
              </div>
            )}

            {type === 'quote' && (
              <div className="space-y-3">
                <InlineQuoteSearch onSelect={quote => setContent(`"${quote.text}" — ${quote.author}`)} />
                {content && (
                  <div className="bg-white/50 rounded-xl p-3 border border-[#d4adb6]/30">
                    <p className="text-sm text-gray-600 italic">{content}</p>
                  </div>
                )}
              </div>
            )}

            {type === 'affirmation' && (
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="e.g. I am capable of achieving great things"
                rows={3}
                className="w-full border border-white/50 bg-white/50 rounded-xl p-3 text-sm text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
              />
            )}
          </div>
        )}

        <button onClick={handleSaveEntry} disabled={!selectedMood || saving}
          className={`w-full py-3 rounded-full font-medium text-sm transition-all ${
            selectedMood ? 'btn-gradient text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}>
          {moodSaved ? '✓ Saved' : saving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>

      {/* ── Daily Goals ── */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Daily Goals</h2>

        {goals.length === 0 && (
          <p className="text-sm text-gray-300">Add goals to check off each day.</p>
        )}

        <div className="space-y-3">
          {goals.map(goal => {
            const done = completions.has(goal.id);
            return (
              <div key={goal.id} className="flex items-center gap-3 group">
                <button onClick={() => handleToggleCompletion(goal.id)}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{ background: done ? '#c4929a' : 'transparent', borderColor: done ? '#c4929a' : '#d5c8c8' }}>
                  {done && <span className="text-white text-xs leading-none">✓</span>}
                </button>
                <span className={`flex-1 text-sm ${done ? 'line-through text-gray-300' : 'text-gray-600'}`}>
                  {goal.title}
                </span>
                <button onClick={() => handleDeleteGoal(goal.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs px-1">
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAddGoal} className="flex gap-2 pt-1">
          <input type="text" value={newGoalText} onChange={e => setNewGoalText(e.target.value)}
            placeholder="Add a daily goal…"
            className="flex-1 border border-white/50 bg-white/50 rounded-full px-4 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d4adb6]/40"
          />
          <button type="submit" className="btn-gradient text-white w-9 h-9 rounded-full text-lg font-light flex items-center justify-center shrink-0">
            +
          </button>
        </form>
      </div>

      {/* ── Mood Trend ── */}
      {entries.length > 0 && <MoodTrendChart entries={entries} />}

      {/* ── Board ── */}
      <div>
        <h2 className="font-playfair text-2xl text-gray-600 mb-4">Your Board</h2>

        {boardItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center gap-3 mb-4 opacity-30">
              {[1, 3, 5].map(v => <MoodFace key={v} mood={v} size={28} />)}
            </div>
            <p className="font-playfair text-lg text-gray-400">Your board is empty</p>
            <p className="text-sm text-gray-300 mt-1">Save today&apos;s entry to get started</p>
          </div>
        ) : (
          <div className="columns-2 gap-0">
            {boardItems.map(item => {
              const itemKey = item._kind === 'mood' ? `mood-${item.id}` : item.id;
              const isExpanded = expandedId === itemKey;
              const moodData = item._kind === 'vision' ? item.mood_entries : null;
              const isCombined = !!moodData;

              const isWide = itemSizes[itemKey] === 'wide';

              return (
                <div key={itemKey} className="break-inside-avoid overflow-hidden relative group"
                  style={isWide ? { columnSpan: 'all' } : {}}>

                  {/* Delete */}
                  <button
                    onClick={() => item._kind === 'mood' ? handleDeleteMoodEntry(item.date) : handleDeleteItem(item.id)}
                    className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 bg-black/20 text-white hover:bg-red-400/60 transition-all text-xs">
                    ✕
                  </button>

                  {/* Resize toggle */}
                  <button
                    onClick={e => { e.stopPropagation(); setItemSize(itemKey, isWide ? 'normal' : 'wide'); }}
                    className="absolute top-2 right-9 z-10 w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 bg-black/20 text-white hover:bg-black/40 transition-all text-xs"
                    title={isWide ? 'Make smaller' : 'Make wider'}>
                    {isWide ? '⊟' : '⊞'}
                  </button>

                  {/* ── Vision card (click to reveal details) ── */}
                  {item._kind === 'vision' && (
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : itemKey)}
                      className="cursor-pointer"
                    >
                      {/* Image */}
                      {item.type === 'image' && item.image_url && (
                        <div className="relative w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image_url} alt={item.content || 'Vision'}
                            className="w-full h-auto block" />
                          {/* Mood hint — small face in corner when combined */}
                          {isCombined && (
                            <div className="absolute top-2 left-2 opacity-70">
                              <MoodFace mood={moodData.mood} size={22} />
                            </div>
                          )}
                          {/* Reveal overlay on click */}
                          {isExpanded && (() => {
                            const entryDate = isCombined ? moodData.date : new Date(item.created_at).toISOString().split('T')[0];
                            const phase = getLunarPhase(entryDate);
                            return (
                              <div className="absolute inset-x-0 bottom-0 bg-white/88 backdrop-blur-sm p-3 animate-in slide-in-from-bottom-2">
                                {isCombined && (
                                  <div className="flex items-center gap-2">
                                    <MoodFace mood={moodData.mood} size={26} />
                                    <span className="text-sm font-medium" style={{ color: MOODS[moodData.mood - 1]?.color }}>
                                      {MOODS[moodData.mood - 1]?.label}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 mt-1">
                                  <MoonPhaseIcon dateStr={entryDate} size={16} />
                                  <span className="text-xs text-gray-400">{phase.name}</span>
                                  <span className="text-xs text-gray-300">·</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(entryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                {isCombined && moodData.notes && (
                                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{moodData.notes}</p>
                                )}
                              </div>
                            );
                          })()}
                          {/* Caption */}
                          {item.content && !isExpanded && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/35 to-transparent px-3 py-2">
                              <p className="text-white text-xs leading-snug">{item.content}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quote / Affirmation */}
                      {item.type !== 'image' && (
                        <div className="p-4" style={{ background: CATEGORY_BG[item.category] ?? '#faf0f5' }}>
                          {isCombined && (
                            <div className="mb-2 opacity-60">
                              <MoodFace mood={moodData.mood} size={20} />
                            </div>
                          )}
                          {item.type === 'reflection' ? (() => {
                            const parts = item.content?.split('\n\n') ?? [];
                            const q = parts[0] ?? '';
                            const a = parts.slice(1).join('\n\n');
                            return (
                              <>
                                <p className="text-xs text-gray-400 italic mb-2">{q}</p>
                                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{a}</p>
                              </>
                            );
                          })() : (
                            <p className={`text-sm leading-relaxed ${item.type === 'quote' ? 'italic font-playfair text-base' : ''} text-gray-600`}>
                              {item.content}
                            </p>
                          )}
                          {/* Reveal on click */}
                          {isExpanded && (() => {
                            const entryDate = isCombined ? moodData.date : new Date(item.created_at).toISOString().split('T')[0];
                            const phase = getLunarPhase(entryDate);
                            return (
                              <div className="mt-3 pt-3 border-t border-white/60">
                                {isCombined && (
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <MoodFace mood={moodData.mood} size={22} />
                                    <div>
                                      <p className="text-xs font-medium" style={{ color: MOODS[moodData.mood - 1]?.color }}>
                                        {MOODS[moodData.mood - 1]?.label}
                                      </p>
                                      {moodData.notes && (
                                        <p className="text-xs text-gray-400 mt-0.5">{moodData.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <MoonPhaseIcon dateStr={entryDate} size={16} />
                                  <span className="text-xs text-gray-400">{phase.name}</span>
                                  <span className="text-xs text-gray-300">·</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(entryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Pure mood card (no board piece) ── */}
                  {item._kind === 'mood' && (
                    <div className="p-4" style={{ background: `${MOODS[item.mood - 1]?.color}18` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <MoodFace mood={item.mood} size={26} />
                        <div>
                          <p className="text-xs font-medium" style={{ color: MOODS[item.mood - 1]?.color }}>
                            {MOODS[item.mood - 1]?.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {item.notes && <p className="text-sm text-gray-500 leading-relaxed">{item.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
