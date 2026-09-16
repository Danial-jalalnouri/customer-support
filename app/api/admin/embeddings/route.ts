import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { getDocumentEmbedding } from '@/lib/embeddings';

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

export async function GET() {
  const result = await getSql().query(
    `SELECT id, title, body, created_at,
            CASE WHEN embedding IS NOT NULL THEN true ELSE false END AS has_embedding
     FROM questions
     ORDER BY created_at DESC`
  );

  const rows = (result as Record<string, unknown>[]).map((row) => ({
    ...row,
    has_embedding: row.has_embedding === true || row.has_embedding === 'true',
  }));

  return NextResponse.json(serialize(rows));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { questionId } = body;

  if (!questionId) {
    return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
  }

  const sql = getSql();
  const check = await sql.query('SELECT id, title, body FROM questions WHERE id = $1', [questionId]);
  const rows = check as Record<string, unknown>[];

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const question = rows[0];
  const textToEmbed = `${question.title} ${question.body || ''}`.trim();

  try {
    const embedding = await getDocumentEmbedding(textToEmbed);
    const embeddingStr = `[${embedding.join(',')}]`;

    await sql.query(
      'UPDATE questions SET embedding = $1::vector WHERE id = $2',
      [embeddingStr, questionId]
    );

    return NextResponse.json({ success: true, questionId });
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}
