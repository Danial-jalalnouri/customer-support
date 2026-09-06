import { VoyageAIClient } from 'voyageai';

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

const MODEL = 'voyage-3.5-lite';

export async function getEmbedding(text: string, type: 'query' | 'document' = 'document'): Promise<number[]> {
  const result = await voyage.embed({
    input: text,
    model: MODEL,
    inputType: type,
  });

  return result.data?.[0]?.embedding ?? [];
}

export async function getDocumentEmbedding(text: string): Promise<number[]> {
  return getEmbedding(text, 'document');
}

export async function getQueryEmbedding(text: string): Promise<number[]> {
  return getEmbedding(text, 'query');
}
