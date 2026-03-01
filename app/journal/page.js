'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { getLunarPhase } from '@/app/lib/astrology';
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '@/app/lib/storage';

const PROMPTS = [
  'What am I grateful for today?',
  'What took up the most space in my mind?',
  'What does my body need right now?',
  'A moment I want to remember…',
  'What am I avoiding?',
  'Where did I show up for myself today?',
  'What would I tell a friend who felt the way I do right now?',
  'What feeling am I carrying into tomorrow?',
  'What surprised me today?',
  'What am I ready to release?',
  'Where did I feel most like myself?',
  'What small thing brought me joy?',
  'What am I learning about myself lately?',
  'What boundary do I need to set or honor?',
  'What do I wish I had more time for?',
  'If today had a color, what would it be and why?',
  'What is my heart trying to say?',
  'What felt heavy today — and what might lighten it?',
  'Three words that describe where I am right now.',
  'What does the next right step look like?',
];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatEntryDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function MoonIcon({ dateStr }) {
  const phase = getLunarPhase(dateStr);
  const pct = phase?.illumination ?? 0.5;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="#e8e0f5" />
      <circle cx="8" cy="8" r="7" fill="#b88a92" opacity={Math.max(0.15, pct)} />
    </svg>
  );
}

export default function JournalPage() {
  const supabaseRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftContent, setDraftContent] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedContent, setExpandedContent] = useState({});
  const [expandedSaving, setExpandedSaving] = useState({});
  const expandedTimerRef = useRef({});
  const todayStr = getTodayStr();

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      try {
        const data = await getJournalEntries(supabase);
        setEntries(data);
      } catch (e) {
        console.error('[journal] load', e);
      }
      setLoading(false);
    });
    setPromptIdx(Math.floor(Math.random() * PROMPTS.length));
  }, []);

  async function handleSave() {
    if (!draftContent.trim() || isSaving) return;
    setIsSaving(true);
    const supabase = supabaseRef.current;
    try {
      const prompt = promptDismissed ? null : PROMPTS[promptIdx];
      const entry = await createJournalEntry(supabase, {
        date: todayStr,
        content: draftContent.trim(),
        prompt,
      });
      if (entry) setEntries(prev => [entry, ...prev]);
      // Reset compose for next entry
      setDraftContent('');
      setPromptDismissed(false);
      setPromptIdx(i => (i + 1) % PROMPTS.length);
    } catch (e) {
      console.error('[journal] save', e);
    } finally {
      setIsSaving(false);
    }
  }

  function shufflePrompt() {
    setPromptDismissed(false);
    setPromptIdx(i => (i + 1) % PROMPTS.length);
  }

  // Inline edit for past entries — auto-saves on change
  function startExpand(entry) {
    setExpandedId(entry.id);
    setExpandedContent(prev => ({ ...prev, [entry.id]: entry.content }));
  }

  function handleExpandedChange(id, val) {
    setExpandedContent(prev => ({ ...prev, [id]: val }));
    clearTimeout(expandedTimerRef.current[id]);
    setExpandedSaving(prev => ({ ...prev, [id]: 'saving' }));
    expandedTimerRef.current[id] = setTimeout(async () => {
      try {
        await updateJournalEntry(supabaseRef.current, id, { content: val });
        setEntries(prev => prev.map(e => e.id === id ? { ...e, content: val } : e));
        setExpandedSaving(prev => ({ ...prev, [id]: 'saved' }));
        setTimeout(() => setExpandedSaving(prev => ({ ...prev, [id]: 'idle' })), 2000);
      } catch (e) {
        console.error('[journal] inline save', e);
        setExpandedSaving(prev => ({ ...prev, [id]: 'idle' }));
      }
    }, 1500);
  }

  async function handleDelete(id) {
    try {
      await deleteJournalEntry(supabaseRef.current, id);
      setEntries(prev => prev.filter(e => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e) {
      console.error('[journal] delete', e);
    }
  }

  const activePrompt = promptDismissed ? null : PROMPTS[promptIdx];

  if (loading) {
    return (
      <main className="min-h-screen pt-8 pb-24">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400 text-sm animate-pulse">Opening your journal…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-playfair text-3xl text-gray-800">Journal</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Compose area */}
        <section className="glass-card rounded-3xl p-5">
          {/* Prompt bar */}
          {activePrompt ? (
            <div className="flex items-start gap-2 mb-4 bg-white/50 rounded-2xl px-4 py-3">
              <span className="text-base flex-shrink-0">💬</span>
              <p className="text-sm text-gray-600 italic leading-snug flex-1">{activePrompt}</p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={shufflePrompt}
                  title="Shuffle prompt"
                  className="text-gray-300 hover:text-[#b88a92] transition-colors p-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 4l4 4-4 4V9h-1.5c-1.17 0-2.2.64-2.76 1.59L7.5 19H3v-2h3.5l4.5-7.96A5 5 0 0 1 15.5 7H17V4zm-6.26 9.67l.96-1.7-.74-1.31A5 5 0 0 0 6.5 8H3v2h3.5c.77 0 1.46.41 1.85 1.03l2.39 2.64zm6.26 2.33H15.5a2 2 0 0 1-1.74-1.01L12.83 13l-1 1.77.44.78C13.03 16.75 14.2 18 15.5 18H17v3l4-4-4-4v3z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setPromptDismissed(true)}
                  title="Dismiss prompt"
                  className="text-gray-300 hover:text-[#b88a92] transition-colors p-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={shufflePrompt}
              className="text-xs text-gray-300 hover:text-[#b88a92] transition-colors mb-3 flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 4l4 4-4 4V9h-1.5c-1.17 0-2.2.64-2.76 1.59L7.5 19H3v-2h3.5l4.5-7.96A5 5 0 0 1 15.5 7H17V4zm-6.26 9.67l.96-1.7-.74-1.31A5 5 0 0 0 6.5 8H3v2h3.5c.77 0 1.46.41 1.85 1.03l2.39 2.64zm6.26 2.33H15.5a2 2 0 0 1-1.74-1.01L12.83 13l-1 1.77.44.78C13.03 16.75 14.2 18 15.5 18H17v3l4-4-4-4v3z"/>
              </svg>
              Add a prompt
            </button>
          )}

          <textarea
            value={draftContent}
            onChange={e => setDraftContent(e.target.value)}
            placeholder="Start writing…"
            rows={6}
            className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-base text-gray-700 placeholder-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-rose-200"
            style={{ minHeight: '140px' }}
          />

          <div className="flex justify-end mt-3">
            <button
              onClick={handleSave}
              disabled={!draftContent.trim() || isSaving}
              className="btn-gradient text-white text-sm px-5 py-2 rounded-full font-medium disabled:opacity-40 disabled:cursor-default transition-opacity"
            >
              {isSaving ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        </section>

        {/* Past entries */}
        {entries.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Your Entries</h2>
            <div className="space-y-3">
              {entries.map(entry => {
                const isExpanded = expandedId === entry.id;
                const snippet = entry.content.slice(0, 120) + (entry.content.length > 120 ? '…' : '');
                const expState = expandedSaving[entry.id] ?? 'idle';

                return (
                  <div key={entry.id} className="glass-card rounded-2xl overflow-hidden">
                    <button
                      onClick={() => isExpanded ? setExpandedId(null) : startExpand(entry)}
                      className="w-full text-left px-5 pt-4 pb-3 flex items-start gap-3"
                    >
                      <span className="flex-shrink-0 mt-0.5">
                        <MoonIcon dateStr={entry.date} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">{formatEntryDate(entry.date)}</p>
                        {entry.prompt && (
                          <p className="text-xs text-[#b88a92] italic mb-1 truncate">{entry.prompt}</p>
                        )}
                        {!isExpanded && (
                          <p className="text-sm text-gray-600 leading-relaxed">{snippet || <em className="text-gray-300">Empty entry</em>}</p>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                        className="flex-shrink-0 text-gray-200 hover:text-rose-400 transition-colors p-1 ml-1"
                        title="Delete entry"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/>
                        </svg>
                      </button>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4">
                        <textarea
                          value={expandedContent[entry.id] ?? entry.content}
                          onChange={e => handleExpandedChange(entry.id, e.target.value)}
                          rows={5}
                          className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-base text-gray-700 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-rose-200"
                          autoFocus
                        />
                        <div className="flex justify-end mt-1.5 h-4">
                          {expState === 'saving' && (
                            <span className="text-xs text-gray-300 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                              Saving…
                            </span>
                          )}
                          {expState === 'saved' && (
                            <span className="text-xs text-emerald-400">✓ Saved</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {entries.length === 0 && !loading && (
          <p className="text-center text-sm text-gray-300 py-8">
            Your entries will appear here after you save them.
          </p>
        )}
      </div>
    </main>
  );
}
