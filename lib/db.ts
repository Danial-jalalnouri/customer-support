import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

export interface Question {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
  answer_count?: number;
}

export interface Answer {
  id: number;
  question_id: number;
  body: string;
  created_at: string;
}
