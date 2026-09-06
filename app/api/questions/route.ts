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
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const unanswered = searchParams.get('unanswered') === 'true';

  let query = `
    SELECT q.*, CAST(COUNT(a.id) AS INTEGER) as answer_count
    FROM questions q
    LEFT JOIN answers a ON q.id = a.question_id
  `;

  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(q.title ILIKE $${paramIndex} OR q.body ILIKE $${paramIndex + 1})`);
    values.push(`%${search}%`, `%${search}%`);
    paramIndex += 2;
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

  const result = await sql.query(query, values);
  return NextResponse.json(serialize(result.rows ?? result));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, questionBody } = body;

  if (!title || title.trim() === '') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const result = await sql.query(
    'INSERT INTO questions (title, body) VALUES ($1, $2) RETURNING *',
    [title.trim(), questionBody?.trim() || null]
  );

  return NextResponse.json(serialize(result.rows ?? result)[0], { status: 201 });
}
