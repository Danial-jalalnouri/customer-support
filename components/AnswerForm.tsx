'use client';

import { useState } from 'react';

interface AnswerFormProps {
  questionId: number;
  onAnswerSubmitted: () => void;
}

export default function AnswerForm({ questionId, onAnswerSubmitted }: AnswerFormProps) {
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerBody.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          answerBody: answerBody.trim(),
        }),
      });

      if (res.ok) {
        setAnswerBody('');
        onAnswerSubmitted();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
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
  );
}
