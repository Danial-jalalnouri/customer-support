'use client';

import { useState, useEffect, useCallback } from 'react';
import { Question, Answer } from '@/lib/db';
import QuestionCard from '@/components/QuestionCard';
import SearchBar from '@/components/SearchBar';

type SortOption = 'newest' | 'oldest' | 'most_answers';

export default function QAPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer[]>>({});
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sort', sort);

    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();
    setQuestions(data);

    const answersMap: Record<number, Answer[]> = {};
    for (const q of data) {
      const qParams = new URLSearchParams();
      qParams.set('search', '');
      qParams.set('sort', 'newest');
    }
    setLoading(false);
  }, [search, sort]);

  const fetchAnswers = async (questionId: number) => {
    const res = await fetch(`/api/questions?search=&sort=newest`);
    const data = await res.json();
    const q = data.find((item: Question) => item.id === questionId);
    if (q) {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: [],
      }));
    }
  };

  const loadAnswersForQuestions = async (questionsList: Question[]) => {
    const answersMap: Record<number, Answer[]> = {};
    for (const q of questionsList) {
      answersMap[q.id] = [];
    }
    setAnswers(answersMap);
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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

      {loading ? (
        <div className="text-center py-12 text-[#6c7086]">Loading...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-[#6c7086]">
          {search ? 'No questions found matching your search.' : 'No questions yet. Be the first to ask!'}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              answers={answers[question.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
