import { NextRequest, NextResponse } from 'next/server';
import db, { Question } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const unanswered = searchParams.get('unanswered') === 'true';

  let query = `
    SELECT q.*, COUNT(a.id) as answer_count
    FROM questions q
    LEFT JOIN answers a ON q.id = a.question_id
  `;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(q.title LIKE ? OR q.body LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (unanswered) {
    conditions.push('NOT EXISTS (SELECT 1 FROM answers WHERE question_id = q.id)');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY q.id';

  switch (sort) {
    case 'oldest':
      query += ' ORDER BY q.created_at ASC';
      break;
    case 'most_answers':
      query += ' ORDER BY answer_count DESC, q.created_at DESC';
      break;
    case 'newest':
    default:
      query += ' ORDER BY q.created_at DESC';
  }

  const questions = db.prepare(query).all(...params) as Question[];
  return NextResponse.json(questions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, questionBody } = body;

  if (!title || title.trim() === '') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const stmt = db.prepare('INSERT INTO questions (title, body) VALUES (?, ?)');
  const result = stmt.run(title.trim(), questionBody?.trim() || null);

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid) as Question;

  return NextResponse.json(question, { status: 201 });
}
