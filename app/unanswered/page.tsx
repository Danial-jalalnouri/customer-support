'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/db';
import QuestionCard from '@/components/QuestionCard';

export default function UnansweredPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnanswered = async () => {
    setLoading(true);
    const res = await fetch('/api/questions?unanswered=true&sort=newest');
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUnanswered();
  }, []);

  const handleAnswerSubmitted = () => {
    fetchUnanswered();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#cdd6f4]">Unanswered</h1>
          <p className="text-[#6c7086] mt-1">Questions waiting for answers</p>
        </div>
        <a
          href="/ask"
          className="px-4 py-2 bg-[#89b4fa] text-[#1e1e2e] rounded-lg font-medium hover:bg-[#89b4fa]/90 transition-colors"
        >
          Ask a Question
        </a>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6c7086]">Loading...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-[#a6adc8] text-lg">All questions have been answered!</p>
          <a
            href="/ask"
            className="inline-block mt-4 px-4 py-2 bg-[#89b4fa] text-[#1e1e2e] rounded-lg font-medium hover:bg-[#89b4fa]/90 transition-colors"
          >
            Ask a New Question
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              answers={[]}
              showAnswerForm={true}
              onAnswerSubmitted={handleAnswerSubmitted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
