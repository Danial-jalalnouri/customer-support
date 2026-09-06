import { NextRequest, NextResponse } from 'next/server';
import db, { Answer } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question_id, answerBody } = body;

  if (!question_id) {
    return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
  }

  if (!answerBody || answerBody.trim() === '') {
    return NextResponse.json({ error: 'Answer body is required' }, { status: 400 });
  }

  const question = db.prepare('SELECT id FROM questions WHERE id = ?').get(question_id);
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const stmt = db.prepare('INSERT INTO answers (question_id, body) VALUES (?, ?)');
  const result = stmt.run(question_id, answerBody.trim());

  const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(result.lastInsertRowid) as Answer;

  return NextResponse.json(answer, { status: 201 });
}
