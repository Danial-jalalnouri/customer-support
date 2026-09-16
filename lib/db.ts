import { neon } from '@neondatabase/serverless';

let sql: ReturnType<typeof neon>;

export function getSql() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL!);
  }
  return sql;
}

export default getSql;

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
