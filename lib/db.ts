import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'customer_support.db');

let db: Database.Database;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `);
} catch (error) {
  console.error('Database initialization error:', error);
  throw error;
}

export default db;

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
