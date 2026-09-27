'use client';

import { useState, useEffect } from 'react';
import { useOrganizationList } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

interface Question {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
  has_embedding: boolean;
}

interface ClerkUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
  createdAt: string;
  lastSignInAt: string | null;
  lastActiveAt: string | null;
  banned: boolean;
  locked: boolean;
}

const USERS_PAGE_SIZE = 25;

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminPage() {
  const [tab, setTab] = useState<'questions' | 'users'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [usersError, setUsersError] = useState('');

  const { userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const isAdmin = userMemberships?.data?.some(
    (m) => m.role === 'org:admin'
  ) ?? false;

  const fetchQuestions = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/embeddings');
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  };

  const fetchUsers = async (offset = 0) => {
    setUsersLoading(true);
    setUsersError('');

    try {
      const res = await fetch(
        `/api/admin/users?limit=${USERS_PAGE_SIZE}&offset=${offset}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load users');
      }

      setUsers((prev) => (offset === 0 ? data.users : [...prev, ...data.users]));
      setUsersTotal(data.totalCount);
      setUsersLoaded(true);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchQuestions();
    }
  }, [isAdmin]);

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

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-[#f38ba8] mb-4">Access Denied</h1>
        <p className="text-[#a6adc8] mb-6">You need admin privileges to access this page.</p>
        <Link
          href="/qa"
          className="px-4 py-2 bg-[#89b4fa] text-[#1e1e2e] rounded-lg font-medium hover:bg-[#74c7ec] transition-colors"
        >
          Go to Q&A
        </Link>
      </div>
    );
  }

  const missingCount = questions.filter((q) => !q.has_embedding).length;
  const embeddedCount = questions.filter((q) => q.has_embedding).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#cdd6f4] mb-2">Admin Panel</h1>
      <p className="text-[#a6adc8] mb-8">
        {tab === 'questions'
          ? 'Manage vector embeddings for questions. Embeddings enable semantic search.'
          : 'View the users registered through Clerk.'}
      </p>

      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab('questions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'questions'
              ? 'bg-[#89b4fa] text-[#1e1e2e]'
              : 'bg-[#313244] text-[#a6adc8] hover:bg-[#45475a]'
          }`}
        >
          Embeddings
        </button>
        <button
          onClick={() => {
            setTab('users');
            if (!usersLoaded && !usersLoading) {
              fetchUsers(0);
            }
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'users'
              ? 'bg-[#cba6f7] text-[#1e1e2e]'
              : 'bg-[#313244] text-[#a6adc8] hover:bg-[#45475a]'
          }`}
        >
          Users
        </button>
      </div>

      {tab === 'questions' ? (
        <>
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
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1e1e2e] border border-[#45475a] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#cdd6f4]">{usersTotal}</div>
              <div className="text-sm text-[#a6adc8]">Total Users</div>
            </div>
            <div className="bg-[#1e1e2e] border border-[#89b4fa]/40 rounded-lg p-4">
              <div className="text-2xl font-bold text-[#89b4fa]">{users.length}</div>
              <div className="text-sm text-[#a6adc8]">Showing</div>
            </div>
            <div className="bg-[#1e1e2e] border border-[#f38ba8]/40 rounded-lg p-4">
              <div className="text-2xl font-bold text-[#f38ba8]">
                {users.filter((user) => user.banned).length}
              </div>
              <div className="text-sm text-[#a6adc8]">Banned</div>
            </div>
          </div>

          {usersError && (
            <div className="mb-4 p-3 bg-[#f38ba8]/10 border border-[#f38ba8]/40 rounded-lg text-[#f38ba8] text-sm">
              {usersError}
            </div>
          )}

          {usersLoading && users.length === 0 ? (
            <div className="text-center py-12 text-[#6c7086]">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-[#6c7086]">No users found.</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const name =
                  [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                  user.username ||
                  user.email ||
                  user.id;

                return (
                  <div
                    key={user.id}
                    className="bg-[#1e1e2e] border border-[#45475a] rounded-lg p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Image
                        src={user.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full bg-[#313244] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[#cdd6f4] font-medium truncate">{name}</span>
                          {user.banned && (
                            <span className="px-2 py-0.5 bg-[#f38ba8]/20 text-[#f38ba8] rounded-full text-xs font-medium">
                              Banned
                            </span>
                          )}
                        </div>
                        {user.email && (
                          <div className="text-sm text-[#a6adc8] truncate">{user.email}</div>
                        )}
                        <div className="text-xs text-[#6c7086] mt-1">
                          Joined {formatDate(user.createdAt)} · Last active{' '}
                          {formatDate(user.lastActiveAt)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                        user.lastSignInAt
                          ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]'
                          : 'bg-[#313244] text-[#6c7086]'
                      }`}
                    >
                      {user.lastSignInAt ? 'Signed in' : 'Never signed in'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {users.length < usersTotal && (
            <div className="mt-4 text-center">
              <button
                onClick={() => fetchUsers(users.length)}
                disabled={usersLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {usersLoading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}