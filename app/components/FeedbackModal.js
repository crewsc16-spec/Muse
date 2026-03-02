'use client';

import { useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

const CATEGORIES = [
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'general', label: 'General' },
];

export default function FeedbackModal({ onClose }) {
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from('feedback').insert({
      message: message.trim(),
      category,
      page_url: window.location.href,
    });

    setSubmitting(false);

    if (error) {
      alert('Something went wrong — please try again.');
      return;
    }

    setSubmitted(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/30">
          <h2 className="font-playfair text-xl text-gray-800">Send Feedback</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <p className="text-gray-700 font-medium">Thank you!</p>
            <p className="text-sm text-gray-500 mt-1">Your feedback has been sent.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Category selector */}
            <div className="p-5 pb-3">
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
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
            </div>

            {/* Message textarea */}
            <div className="px-5 pb-5">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full border border-white/50 bg-white/50 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="px-5 pb-5">
              <button
                type="submit"
                disabled={!message.trim() || submitting}
                className="w-full btn-gradient text-white text-sm font-medium rounded-full px-6 py-2.5"
              >
                {submitting ? 'Sending…' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
