# Customer Support System - Implementation Plan

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (via better-sqlite3)
- **No Authentication**: For now (to be added later)

---

## Project Structure

```
customer_support/
├── app/
│   ├── layout.tsx                    # Root layout with navigation
│   ├── page.tsx                      # Home → redirects to /qa
│   │
│   ├── qa/
│   │   └── page.tsx                  # Q&A listing (search + sort)
│   │
│   ├── ask/
│   │   └── page.tsx                  # Submit a new question
│   │
│   ├── unanswered/
│   │   └── page.tsx                  # Unanswered questions + answer form
│   │
│   └── api/
│       ├── questions/
│       │   └── route.ts              # GET (list/search/sort) + POST (create)
│       │
│       └── answers/
│           └── route.ts              # POST (create answer for a question)
│
├── lib/
│   └── db.ts                         # SQLite connection + schema init
│
├── components/
│   ├── Navbar.tsx                    # Navigation bar
│   ├── QuestionCard.tsx              # Reusable question display
│   ├── AnswerForm.tsx                # Form to submit an answer
│   └── SearchBar.tsx                 # Search input component
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Database Schema

### `questions` table
| Column      | Type    | Description                  |
|-------------|---------|------------------------------|
| id          | INTEGER | Primary key, auto-increment  |
| title       | TEXT    | Question title, not null     |
| body        | TEXT    | Question body/description    |
| created_at  | TEXT    | ISO timestamp, default now   |

### `answers` table
| Column      | Type    | Description                  |
|-------------|---------|------------------------------|
| id          | INTEGER | Primary key, auto-increment  |
| question_id | INTEGER | Foreign key → questions.id   |
| body        | TEXT    | Answer text, not null        |
| created_at  | TEXT    | ISO timestamp, default now   |

---

## Pages & Features

### 1. `/qa` — Q&A Page (Main Page)
- **Purpose**: Display all questions with their answers
- **Features**:
  - Search bar to filter questions by title or body text
  - Sort options: Newest first, Oldest first, Most answers
  - Each question shows: title, body preview, answer count, created date
  - Click a question to expand and see its answers
  - Link to submit a new question

### 2. `/ask` — Submit Question Page
- **Purpose**: Write and submit a new question
- **Features**:
  - Form with title (required) and body (textarea, optional)
  - Submit button → POST to `/api/questions`
  - Success redirect to `/qa`

### 3. `/unanswered` — Unanswered Questions Page
- **Purpose**: Show questions with 0 answers and allow answering them
- **Features**:
  - List of questions that have no answers yet
  - Each question has an inline answer form (AnswerForm component)
  - Submit answer → POST to `/api/answers`
  - After answering, question disappears from this list and appears in `/qa`

---

## API Routes

### `GET /api/questions`
- **Query params**:
  - `search` (string) — filter by title or body LIKE match
  - `sort` (string) — `newest` | `oldest` | `most_answers`
  - `unanswered` (boolean) — if `true`, return only questions with 0 answers
- **Response**: Array of question objects with `answer_count`

### `POST /api/questions`
- **Body**: `{ title: string, body?: string }`
- **Response**: Created question object

### `POST /api/answers`
- **Body**: `{ question_id: number, body: string }`
- **Response**: Created answer object

---

## Components

### `Navbar.tsx`
- Links: Q&A, Ask a Question, Unanswered
- Active state highlighting for current page

### `QuestionCard.tsx`
- Props: question object + answer count
- Displays: title, body preview (truncated), date, answer count badge
- Expandable to show answers list

### `AnswerForm.tsx`
- Props: `questionId`
- Textarea for answer body
- Submit button
- Calls POST `/api/answers` then refreshes parent

### `SearchBar.tsx`
- Controlled input
- Debounced onChange callback
- Placeholder: "Search questions..."

---

## Implementation Order

1. Initialize Next.js project with TypeScript + Tailwind
2. Install dependencies: `better-sqlite3`, `@types/better-sqlite3`
3. Create `lib/db.ts` — SQLite setup + schema initialization
4. Create API routes (`/api/questions`, `/api/answers`)
5. Create shared components (`Navbar`, `QuestionCard`, `AnswerForm`, `SearchBar`)
6. Create `/qa` page (search + sort + question list)
7. Create `/ask` page (question form)
8. Create `/unanswered` page (unanswered list + answer form)
9. Create root layout with Navbar
10. Test full flow: ask → see in QA → see in unanswered → answer → see in QA with answer

---

## Notes

- SQLite file will be stored as `customer_support.db` in project root
- Database auto-creates tables on first API call
- No auth for now — all operations are open
- Future: add Clerk authentication
- Future: replace SQLite with production database
