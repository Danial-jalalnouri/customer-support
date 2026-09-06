'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AskPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          questionBody: body.trim() || null,
        }),
      });

      if (res.ok) {
        router.push('/qa');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit question');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#cdd6f4] mb-8">Ask a Question</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-[#f38ba8]/20 border border-[#f38ba8] rounded-lg text-[#f38ba8]">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[#a6adc8] mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your question?"
            className="w-full px-4 py-3 bg-[#1e1e2e] border border-[#444] rounded-lg text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-[#a6adc8] mb-2">
            Details (optional)
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Provide more details about your question..."
            rows={5}
            className="w-full px-4 py-3 bg-[#1e1e2e] border border-[#444] rounded-lg text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors resize-none"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-[#89b4fa] text-[#1e1e2e] rounded-lg font-medium hover:bg-[#89b4fa]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Question'}
          </button>
          <a
            href="/qa"
            className="px-6 py-3 bg-[#313244] text-[#cdd6f4] rounded-lg font-medium hover:bg-[#45475a] transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
