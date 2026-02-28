'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function UnsplashModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setPhotos(data.photos);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/30">
          <h2 className="font-playfair text-xl text-gray-800">Search Photos</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="p-4 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search mountains, flowers, travel…"
            className="flex-1 border border-white/50 bg-white/50 rounded-full px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient px-5 py-2.5 rounded-full text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? '…' : 'Search'}
          </button>
        </form>

        {/* Results */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {error && (
            <p className="text-rose-500 text-sm text-center py-4">{error}</p>
          )}

          {!searched && !loading && (
            <p className="text-gray-400 text-sm text-center py-8">
              Search for images to add to your vision board
            </p>
          )}

          {searched && photos.length === 0 && !loading && (
            <p className="text-gray-400 text-sm text-center py-8">No results found. Try a different search.</p>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => onSelect(photo)}
                  className="relative aspect-square rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <Image
                    src={photo.thumb}
                    alt={photo.alt}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 220px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 rounded-full px-2 py-0.5 transition-opacity">
                      Select
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Unsplash attribution */}
        <div className="px-5 py-3 border-t border-white/30 text-center">
          <p className="text-xs text-gray-400">
            Photos from{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-400 hover:underline"
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
