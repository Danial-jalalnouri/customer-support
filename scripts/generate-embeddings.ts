import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';
import { VoyageAIClient } from 'voyageai';

config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

const MODEL = 'voyage-3.5-lite';
const DELAY_MS = 22000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateEmbeddings() {
  console.log('Fetching questions without embeddings...\n');

  const questions = await sql`
    SELECT id, title, body FROM questions WHERE embedding IS NULL
  `;

  console.log(`Found ${questions.length} questions to process\n`);
  console.log(`Rate limit: 3 RPM (1 request per 20s)\n`);

  for (const q of questions) {
    const text = `${q.title} ${q.body || ''}`.trim();
    console.log(`Processing: "${q.title.substring(0, 50)}..."`);

    try {
      const result = await voyage.embed({
        input: text,
        model: MODEL,
        inputType: 'document',
      });

      const embedding = result.data?.[0]?.embedding ?? [];
      const embeddingStr = `[${embedding.join(',')}]`;

      await sql`
        UPDATE questions SET embedding = ${embeddingStr}::vector WHERE id = ${q.id}
      `;

      console.log(`  ✓ Embedding generated (${embedding.length} dimensions)`);
    } catch (error) {
      console.error(`  ✗ Failed: ${error}`);
    }

    if (questions.indexOf(q) < questions.length - 1) {
      console.log(`  ⏳ Waiting ${DELAY_MS / 1000}s for rate limit...`);
      await sleep(DELAY_MS);
    }
  }

  console.log('\nDone!');
}

generateEmbeddings().catch(console.error);
