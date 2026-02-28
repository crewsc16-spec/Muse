'use client';

import { useState } from 'react';
import { getQuotes, QUOTE_CATEGORIES } from '@/app/lib/quotes';

export default function QuoteModal({ onSelect, onClose }) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const quotes = getQuotes(category, search);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/30">
          <h2 className="font-playfair text-xl text-gray-800">Quote Library</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3 border-b border-white/30">
          <div className="flex flex-wrap gap-2">
            {QUOTE_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  category === cat.value
                    ? 'btn-gradient text-white'
                    : 'bg-white/60 text-gray-500 hover:bg-white/80 border border-white/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search quotes or authors…"
            className="w-full border border-white/50 bg-white/50 rounded-full px-4 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        {/* Quote list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {quotes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No quotes found.</p>
          ) : (
            quotes.map(quote => (
              <button
                key={quote.id}
                onClick={() => onSelect(quote)}
                className="w-full text-left p-4 rounded-2xl bg-white/50 hover:bg-white/80 border border-white/40 hover:border-rose-200 transition-all group"
              >
                <p className="text-gray-700 text-sm italic leading-relaxed group-hover:text-gray-900">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="text-xs text-gray-400 mt-1.5">— {quote.author}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
