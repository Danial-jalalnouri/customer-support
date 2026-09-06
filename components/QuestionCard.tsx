'use client';

import { useState, useEffect } from 'react';
import { Question, Answer } from '@/lib/db';

interface QuestionCardProps {
  question: Question;
  answers?: Answer[];
  showAnswerForm?: boolean;
  onAnswerSubmitted?: () => void;
}

export default function QuestionCard({
  question,
  answers: initialAnswers,
  showAnswerForm = false,
  onAnswerSubmitted,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>(initialAnswers || []);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [answersFetched, setAnswersFetched] = useState(false);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expanded && !answersFetched && !loadingAnswers) {
      setLoadingAnswers(true);
      fetch(`/api/answers?question_id=${question.id}`)
        .then((res) => res.json())
        .then((data) => {
          setAnswers(data);
          setAnswersFetched(true);
          setLoadingAnswers(false);
        })
        .catch(() => {
          setLoadingAnswers(false);
          setAnswersFetched(true);
        });
    }
  }, [expanded, question.id, answersFetched, loadingAnswers]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerBody.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          answerBody: answerBody.trim(),
        }),
      });

      if (res.ok) {
        const newAnswer = await res.json();
        setAnswers((prev) => [...prev, newAnswer]);
        setAnswerBody('');
        onAnswerSubmitted?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#1e1e2e] border border-[#444] rounded-xl p-5 hover:border-[#89b4fa] transition-colors">
      <div
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#cdd6f4] mb-2">
              {question.title}
            </h3>
            {question.body && (
              <p className="text-[#a6adc8] text-sm line-clamp-2">
                {question.body}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#89b4fa]/20 text-[#89b4fa] rounded-full text-sm font-medium">
              {question.answer_count || 0} answers
            </span>
            <svg
              className={`w-5 h-5 text-[#6c7086] transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        <div className="mt-3 text-xs text-[#6c7086]">
          {new Date(question.created_at).toLocaleDateString()}
        </div>
      </div>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-[#444]">
          {loadingAnswers ? (
            <p className="text-[#6c7086] text-sm">Loading answers...</p>
          ) : answers.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-[#a6adc8]">Answers</h4>
              {answers.map((answer) => (
                <div
                  key={answer.id}
                  className="bg-[#313244] rounded-lg p-4"
                >
                  <p className="text-[#cdd6f4]">{answer.body}</p>
                  <div className="mt-2 text-xs text-[#6c7086]">
                    {new Date(answer.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6c7086] text-sm">No answers yet.</p>
          )}

          {showAnswerForm && (
            <form onSubmit={handleSubmitAnswer} className="mt-4">
              <textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder="Write your answer..."
                rows={3}
                className="w-full px-4 py-3 bg-[#181825] border border-[#444] rounded-lg text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={submitting || !answerBody.trim()}
                className="mt-3 px-4 py-2 bg-[#a6e3a1] text-[#1e1e2e] rounded-lg font-medium hover:bg-[#a6e3a1]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
