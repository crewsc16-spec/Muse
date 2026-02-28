'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from './lib/supabase/client';
import {
  getMoodEntries, saveMoodEntry,
  getVisionItems, saveVisionItem, deleteVisionItem,
  getGoals, addGoal, deleteGoal, getTodayCompletions, toggleGoalCompletion,
  uploadVisionImage,
} from './lib/storage';
import { getQuotes, QUOTE_CATEGORIES } from './lib/quotes';
import MoodFace from './components/MoodFace';

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

// Image size → aspect ratio (S=short landscape, M=standard, L=tall portrait)
const IMG_ASPECTS = { sm: 'aspect-[5/3]', md: 'aspect-[4/3]', lg: 'aspect-[3/4]' };

const CATEGORY_BG = {
  health:        '#f0f6f3',
  career:        '#f0f4f8',
  relationships: '#faf0f0',
  personal:      '#faf0f5',
  travel:        '#faf5ee',
};

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
              <div className="grid grid-cols-2 gap-2 rounded-xl">
                {photos.map(photo => (
                  <button key={photo.id} onClick={() => onSelect(photo)}
                    className="relative aspect-square rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#c4929a]">
                    <Image src={photo.thumb} alt={photo.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-200" sizes="(max-width: 640px) 50vw, 200px" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                  </button>
                ))}
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

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('boardSizes');
      if (saved) setItemSizes(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    const supabase = createClient();
    setSb(supabase);
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadAll(supabase);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadAll(supabase);
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
      localStorage.setItem('boardSizes', JSON.stringify(next));
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

  const last7 = entries.slice(0, 7).reverse();

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

      {/* ── Today's Entry — combined mood + board piece ── */}
      <div className="glass-card rounded-3xl p-6 space-y-5">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest">Today&apos;s Entry</h2>

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

      {/* ── 7-day chart ── */}
      {last7.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Last 7 Days</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '64px' }}>
            {last7.map(entry => {
              const mood = MOODS.find(m => m.value === entry.mood);
              return (
                <div key={entry.id} style={{
                  flex: 1, minHeight: '4px',
                  height: `${(entry.mood / 5) * 100}%`,
                  background: mood?.color ?? '#c5bcba',
                  borderRadius: '4px 4px 0 0',
                }} />
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            {last7.map(entry => (
              <div key={entry.id} className="flex-1 text-center">
                <span className="text-xs text-gray-400">
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

              return (
                <div key={itemKey} className="break-inside-avoid overflow-hidden relative group">

                  {/* Delete */}
                  <button
                    onClick={() => item._kind === 'mood' ? handleDeleteMoodEntry(item.date) : handleDeleteItem(item.id)}
                    className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 bg-black/20 text-white hover:bg-red-400/60 transition-all text-xs">
                    ✕
                  </button>

                  {/* ── Combined vision card (click to reveal mood) ── */}
                  {item._kind === 'vision' && (
                    <div
                      onClick={() => isCombined && setExpandedId(isExpanded ? null : itemKey)}
                      className={isCombined ? 'cursor-pointer' : ''}
                    >
                      {/* Image */}
                      {item.type === 'image' && item.image_url && (
                        <div className={`relative w-full ${IMG_ASPECTS[itemSizes[itemKey] ?? 'md']}`}>
                          <Image src={item.image_url} alt={item.content || 'Vision'} fill
                            className="object-cover" sizes="(max-width: 640px) 50vw, 400px" />
                          {/* Mood hint — small face in corner when combined */}
                          {isCombined && (
                            <div className="absolute top-2 left-2 opacity-70">
                              <MoodFace mood={moodData.mood} size={22} />
                            </div>
                          )}
                          {/* Size control — bottom-left on hover */}
                          <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 flex gap-0.5 bg-black/30 rounded-full px-1 py-0.5 backdrop-blur-sm transition-opacity">
                            {['sm', 'md', 'lg'].map(s => (
                              <button key={s} onClick={e => { e.stopPropagation(); setItemSize(itemKey, s); }}
                                className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-colors ${
                                  (itemSizes[itemKey] ?? 'md') === s ? 'bg-white text-gray-700' : 'text-white/80 hover:bg-white/20'
                                }`}>
                                {s[0].toUpperCase()}
                              </button>
                            ))}
                          </div>
                          {/* Mood reveal overlay on click */}
                          {isCombined && isExpanded && (
                            <div className="absolute inset-x-0 bottom-0 bg-white/88 backdrop-blur-sm p-3 animate-in slide-in-from-bottom-2">
                              <div className="flex items-center gap-2">
                                <MoodFace mood={moodData.mood} size={26} />
                                <span className="text-sm font-medium" style={{ color: MOODS[moodData.mood - 1]?.color }}>
                                  {MOODS[moodData.mood - 1]?.label}
                                </span>
                              </div>
                              {moodData.notes && (
                                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{moodData.notes}</p>
                              )}
                            </div>
                          )}
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
                          <p className={`text-sm leading-relaxed ${item.type === 'quote' ? 'italic font-playfair text-base' : ''} text-gray-600`}>
                            {item.content}
                          </p>
                          {/* Mood reveal on click */}
                          {isCombined && isExpanded && (
                            <div className="mt-3 pt-3 border-t border-white/60 flex items-center gap-2">
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
