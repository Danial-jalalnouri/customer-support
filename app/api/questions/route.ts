import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getQueryEmbedding, getDocumentEmbedding } from '@/lib/embeddings';

function serialize(rows: Record<string, unknown>[]) {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === 'embedding') continue;
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
  const similar = searchParams.get('similar') || '';

  if (similar) {
    try {
      const embedding = await getQueryEmbedding(similar);
      const embeddingStr = `[${embedding.join(',')}]`;

      const result = await sql.query(
        `SELECT q.*, CAST(COUNT(a.id) AS INTEGER) as answer_count,
         1 - (q.embedding <=> $1::vector) as similarity
         FROM questions q
         LEFT JOIN answers a ON q.id = a.question_id
         WHERE q.embedding IS NOT NULL
         GROUP BY q.id
         ORDER BY similarity DESC
         LIMIT 5`,
        [embeddingStr]
      );

      return NextResponse.json(serialize(result.rows ?? result));
    } catch (error) {
      console.error('Vector search error:', error);
      return NextResponse.json({ error: 'Vector search failed' }, { status: 500 });
    }
  }

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

  const textToEmbed = `${title.trim()} ${questionBody?.trim() || ''}`.trim();

  let embeddingStr = null;
  try {
    const embedding = await getDocumentEmbedding(textToEmbed);
    embeddingStr = `[${embedding.join(',')}]`;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
  }

  let result;
  if (embeddingStr) {
    result = await sql.query(
      'INSERT INTO questions (title, body, embedding) VALUES ($1, $2, $3::vector) RETURNING *',
      [title.trim(), questionBody?.trim() || null, embeddingStr]
    );
  } else {
    result = await sql.query(
      'INSERT INTO questions (title, body) VALUES ($1, $2) RETURNING *',
      [title.trim(), questionBody?.trim() || null]
    );
  }

  return NextResponse.json(serialize(result.rows ?? result)[0], { status: 201 });
}
