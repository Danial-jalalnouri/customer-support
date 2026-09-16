'use client';

import { useState, useEffect } from 'react';

interface Question {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
  has_embedding: boolean;
}

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/embeddings');
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const generateEmbedding = async (questionId: number) => {
    setGeneratingId(questionId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate embedding');
      }

      setSuccess(`Embedding generated for question #${questionId}`);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, has_embedding: true } : q))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGeneratingId(null);
    }
  };

  const missingCount = questions.filter((q) => !q.has_embedding).length;
  const embeddedCount = questions.filter((q) => q.has_embedding).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#cdd6f4] mb-2">Embedding Management</h1>
      <p className="text-[#a6adc8] mb-8">
        Manage vector embeddings for questions. Embeddings enable semantic search.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1e1e2e] border border-[#45475a] rounded-lg p-4">
          <div className="text-2xl font-bold text-[#cdd6f4]">{questions.length}</div>
          <div className="text-sm text-[#a6adc8]">Total Questions</div>
        </div>
        <div className="bg-[#1e1e2e] border border-[#a6e3a1]/40 rounded-lg p-4">
          <div className="text-2xl font-bold text-[#a6e3a1]">{embeddedCount}</div>
          <div className="text-sm text-[#a6adc8]">Embedded</div>
        </div>
        <div className="bg-[#1e1e2e] border border-[#f38ba8]/40 rounded-lg p-4">
          <div className="text-2xl font-bold text-[#f38ba8]">{missingCount}</div>
          <div className="text-sm text-[#a6adc8]">Missing Embeddings</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#f38ba8]/10 border border-[#f38ba8]/40 rounded-lg text-[#f38ba8] text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-[#a6e3a1]/10 border border-[#a6e3a1]/40 rounded-lg text-[#a6e3a1] text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#6c7086]">Loading...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-[#6c7086]">No questions found.</div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-[#1e1e2e] border border-[#45475a] rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[#6c7086]">#{question.id}</span>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      question.has_embedding ? 'bg-[#a6e3a1]' : 'bg-[#f38ba8]'
                    }`}
                  />
                  <span className="text-xs text-[#a6adc8]">
                    {question.has_embedding ? 'Embedded' : 'No embedding'}
                  </span>
                </div>
                <h3 className="text-[#cdd6f4] font-medium truncate">{question.title}</h3>
                {question.body && (
                  <p className="text-sm text-[#a6adc8] truncate mt-1">{question.body}</p>
                )}
              </div>
              <button
                onClick={() => generateEmbedding(question.id)}
                disabled={question.has_embedding || generatingId === question.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  question.has_embedding
                    ? 'bg-[#313244] text-[#6c7086] cursor-not-allowed'
                    : generatingId === question.id
                      ? 'bg-[#cba6f7]/50 text-[#1e1e2e] cursor-wait'
                      : 'bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90'
                }`}
              >
                {generatingId === question.id
                  ? 'Generating...'
                  : question.has_embedding
                    ? 'Embedded'
                    : 'Generate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
