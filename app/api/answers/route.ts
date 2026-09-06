import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function serialize(rows: Record<string, unknown>[]) {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'bigint') {
        out[key] = Number(value);
      } else if (value instanceof Date) {
        out[key] = value.toISOString();
      } else {
        out[key] = value;
      }
    }
    return out;
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const questionId = searchParams.get('question_id');

  if (!questionId) {
    return NextResponse.json({ error: 'question_id is required' }, { status: 400 });
  }

  const result = await sql.query(
    'SELECT * FROM answers WHERE question_id = $1 ORDER BY created_at ASC',
    [questionId]
  );

  return NextResponse.json(serialize(result.rows ?? result));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question_id, answerBody } = body;

  if (!question_id) {
    return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
  }

  if (!answerBody || answerBody.trim() === '') {
    return NextResponse.json({ error: 'Answer body is required' }, { status: 400 });
  }

  const questionCheck = await sql.query('SELECT id FROM questions WHERE id = $1', [question_id]);
  if ((questionCheck.rows ?? questionCheck).length === 0) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const result = await sql.query(
    'INSERT INTO answers (question_id, body) VALUES ($1, $2) RETURNING *',
    [question_id, answerBody.trim()]
  );

  return NextResponse.json(serialize(result.rows ?? result)[0], { status: 201 });
}
