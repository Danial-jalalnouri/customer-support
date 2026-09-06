'use client';

import { useState, useEffect, useCallback } from 'react';
import { Question, Answer } from '@/lib/db';
import QuestionCard from '@/components/QuestionCard';
import SearchBar from '@/components/SearchBar';

type SortOption = 'newest' | 'oldest' | 'most_answers';
type SearchMode = 'keyword' | 'semantic';

type QuestionWithSimilarity = Question & { similarity?: number };

export default function QAPage() {
  const [questions, setQuestions] = useState<QuestionWithSimilarity[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer[]>>({});
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<SearchMode>('keyword');
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState('');
  const [isSemanticResult, setIsSemanticResult] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sort', sort);

    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();
    setQuestions(data);
    setIsSemanticResult(false);
    setLoading(false);
  }, [search, sort]);

  const handleSemanticSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (semanticQuery.trim().length < 3) {
      setSemanticError('Please enter at least 3 characters.');
      return;
    }

    setSemanticLoading(true);
    setSemanticError('');

    try {
      const res = await fetch(
        `/api/questions?similar=${encodeURIComponent(semanticQuery.trim())}`
      );
      if (!res.ok) {
        throw new Error('search failed');
      }
      const data = await res.json();
      setQuestions(data);
      setIsSemanticResult(true);
    } catch {
      setSemanticError('Semantic search failed. Please wait a moment and try again.');
    } finally {
      setSemanticLoading(false);
    }
  };

  const clearSemanticSearch = () => {
    setSemanticQuery('');
    setSemanticError('');
    fetchQuestions();
  };

  useEffect(() => {
    if (mode === 'keyword') {
      fetchQuestions();
    }
  }, [fetchQuestions, mode]);

  const loadAnswersForQuestions = async (questionsList: Question[]) => {
    const answersMap: Record<number, Answer[]> = {};
    for (const q of questionsList) {
      answersMap[q.id] = [];
    }
    setAnswers(answersMap);
  };

  useEffect(() => {
    if (questions.length > 0) {
      loadAnswersForQuestions(questions);
    }
  }, [questions]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#cdd6f4]">Q&A</h1>
        <a
          href="/ask"
          className="px-4 py-2 bg-[#89b4fa] text-[#1e1e2e] rounded-lg font-medium hover:bg-[#89b4fa]/90 transition-colors"
        >
          Ask a Question
        </a>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('keyword')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'keyword'
              ? 'bg-[#89b4fa] text-[#1e1e2e]'
              : 'bg-[#313244] text-[#a6adc8] hover:bg-[#45475a]'
          }`}
        >
          Keyword
        </button>
        <button
          onClick={() => setMode('semantic')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'semantic'
              ? 'bg-[#cba6f7] text-[#1e1e2e]'
              : 'bg-[#313244] text-[#a6adc8] hover:bg-[#45475a]'
          }`}
        >
          Semantic
        </button>
      </div>

      {mode === 'keyword' ? (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar onSearch={setSearch} />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-4 py-3 bg-[#1e1e2e] border border-[#444] rounded-lg text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_answers">Most Answers</option>
          </select>
        </div>
      ) : (
        <form onSubmit={handleSemanticSearch} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                placeholder="Describe your question in your own words..."
                className="w-full px-4 py-3 bg-[#1e1e2e] border border-[#cba6f7]/40 rounded-lg text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#cba6f7] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={semanticLoading}
              className="px-6 py-3 bg-[#cba6f7] text-[#1e1e2e] rounded-lg font-medium hover:bg-[#cba6f7]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {semanticLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {semanticError && (
            <p className="mt-2 text-sm text-[#f38ba8]">{semanticError}</p>
          )}
          {isSemanticResult && (
            <div className="mt-3 flex items-center gap-3">
              <p className="text-sm text-[#cba6f7]">
                Showing the {questions.length} most semantically similar questions.
              </p>
              <button
                type="button"
                onClick={clearSemanticSearch}
                className="text-sm text-[#6c7086] hover:text-[#cdd6f4] underline transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </form>
      )}

      {loading || semanticLoading ? (
        <div className="text-center py-12 text-[#6c7086]">Loading...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-[#6c7086]">
          {isSemanticResult
            ? 'No similar questions found.'
            : search
              ? 'No questions found matching your search.'
              : 'No questions yet. Be the first to ask!'}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="relative">
              {isSemanticResult && question.similarity !== undefined && (
                <div className="mb-1 text-xs font-medium text-[#cba6f7]">
                  {(question.similarity * 100).toFixed(1)}% match
                </div>
              )}
              <QuestionCard
                question={question}
                answers={answers[question.id] || []}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
