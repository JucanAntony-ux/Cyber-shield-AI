/*
# Create Cyber Compass schema

1. New Tables
- `lessons`: guides, lessons, and scenarios. Each has a topic, difficulty, summary, body text, a checklist (stored as a list of steps), and an optional deeper-dive section for experienced users.
- `quiz_questions`: multiple-choice questions attached to a lesson, with an explanation for each answer.
- `lesson_progress`: one row per lesson recording the latest quiz score and whether the lesson is completed.
- `problems`: security problems the user describes, with topic, situation, urgency, and status.
- `problem_steps`: the checklist for a problem, copied from its topic guide, with a completed flag per step.
- `notes`: free-text notes attached to a problem or a lesson.
- `resources`: saved useful links with a title, topic, and description.

2. Security
- Row level security is enabled on every table.
- Lessons and quiz questions are read-only for the browser (no write policies).
- The app has no sign-in, so the browser role reads and writes with the anon key. Policies for problems, steps, notes, progress, and resources are scoped to `anon` and `authenticated`, one policy per verb.
- Grants are limited to the verbs each table actually uses.

3. Important notes
- Indexes are added on the foreign keys and on the list sort columns.
- Check constraints restrict topic, kind, difficulty, urgency, and status to known values.
- Deleting a problem or lesson removes its dependent steps, notes, quiz questions, or progress rows.
*/

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  topic text NOT NULL CHECK (topic IN ('account-security', 'phishing', 'network-safety', 'secure-coding', 'incident-response')),
  kind text NOT NULL CHECK (kind IN ('guide', 'lesson', 'scenario')),
  difficulty text NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  summary text NOT NULL,
  body text NOT NULL,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  deeper_dive text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lessons_topic_kind_idx ON lessons (topic, kind);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  position integer NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  answer_index integer NOT NULL CHECK (answer_index >= 0),
  explanation text NOT NULL
);

CREATE INDEX IF NOT EXISTS quiz_questions_lesson_idx ON quiz_questions (lesson_id, position);

CREATE TABLE IF NOT EXISTS lesson_progress (
  lesson_id uuid PRIMARY KEY REFERENCES lessons (id) ON DELETE CASCADE,
  quiz_score integer NOT NULL DEFAULT 0 CHECK (quiz_score >= 0),
  quiz_total integer NOT NULL DEFAULT 0 CHECK (quiz_total >= 0),
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description text NOT NULL CHECK (length(description) BETWEEN 1 AND 5000),
  topic text NOT NULL CHECK (topic IN ('account-security', 'phishing', 'network-safety', 'secure-coding', 'incident-response')),
  situation text NOT NULL,
  urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS problems_created_idx ON problems (created_at DESC);

CREATE TABLE IF NOT EXISTS problem_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES problems (id) ON DELETE CASCADE,
  position integer NOT NULL,
  text text NOT NULL,
  completed boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS problem_steps_problem_idx ON problem_steps (problem_id, position);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid REFERENCES problems (id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (problem_id IS NOT NULL OR lesson_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS notes_problem_idx ON notes (problem_id);
CREATE INDEX IF NOT EXISTS notes_lesson_idx ON notes (lesson_id);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  url text NOT NULL CHECK (url ~* '^https?://'),
  topic text CHECK (topic IS NULL OR topic IN ('account-security', 'phishing', 'network-safety', 'secure-coding', 'incident-response')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON lessons TO anon, authenticated;
GRANT SELECT ON quiz_questions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON lesson_progress TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON problems TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON problem_steps TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON notes TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON resources TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_lessons" ON lessons;
CREATE POLICY "anon_select_lessons" ON lessons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_quiz_questions" ON quiz_questions;
CREATE POLICY "anon_select_quiz_questions" ON quiz_questions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_lesson_progress" ON lesson_progress;
CREATE POLICY "anon_select_lesson_progress" ON lesson_progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lesson_progress" ON lesson_progress;
CREATE POLICY "anon_insert_lesson_progress" ON lesson_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lesson_progress" ON lesson_progress;
CREATE POLICY "anon_update_lesson_progress" ON lesson_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_problems" ON problems;
CREATE POLICY "anon_select_problems" ON problems FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_problems" ON problems;
CREATE POLICY "anon_insert_problems" ON problems FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_problems" ON problems;
CREATE POLICY "anon_update_problems" ON problems FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_problems" ON problems;
CREATE POLICY "anon_delete_problems" ON problems FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_problem_steps" ON problem_steps;
CREATE POLICY "anon_select_problem_steps" ON problem_steps FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_problem_steps" ON problem_steps;
CREATE POLICY "anon_insert_problem_steps" ON problem_steps FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_problem_steps" ON problem_steps;
CREATE POLICY "anon_update_problem_steps" ON problem_steps FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_problem_steps" ON problem_steps;
CREATE POLICY "anon_delete_problem_steps" ON problem_steps FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_notes" ON notes;
CREATE POLICY "anon_select_notes" ON notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notes" ON notes;
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notes" ON notes;
CREATE POLICY "anon_delete_notes" ON notes FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_resources" ON resources;
CREATE POLICY "anon_select_resources" ON resources FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_resources" ON resources;
CREATE POLICY "anon_insert_resources" ON resources FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_resources" ON resources;
CREATE POLICY "anon_delete_resources" ON resources FOR DELETE
  TO anon, authenticated USING (true);
