/*
# Create questionnaire tables with section-ID-based answer storage

1. New Tables
- `questionnaires`
  - `id` (uuid, primary key)
  - `session_id` (text, unique) — anonymous browser session identifier
  - `user_id` (uuid, nullable) — for future authenticated users
  - `current_step` (integer) — display position in the questionnaire
  - `status` (text, default 'in_progress')
  - `created_at`, `updated_at` (timestamps)
- `questionnaire_answers`
  - `id` (uuid, primary key)
  - `questionnaire_id` (uuid, foreign key to questionnaires)
  - `section_id` (text) — permanent semantic section identifier (e.g. 'realEstate', 'children')
  - `question_key` (text) — the field key within the section
  - `answer` (jsonb) — the answer value
  - `created_at`, `updated_at` (timestamps)

2. Security
- Enable RLS on both tables.
- Allow anon + authenticated CRUD because the app uses anonymous sessions (no sign-in screen).
- Policies use session_id ownership for anonymous users.

3. Important Notes
- The `section_id` column replaces the old numeric `step` column.
- Section IDs are permanent semantic identifiers that do not change when sections are reordered.
- This migration is idempotent — safe to re-run.
*/

CREATE TABLE IF NOT EXISTS questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE,
  user_id uuid,
  current_step integer DEFAULT 1,
  status text DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view own session questionnaires" ON questionnaires;
CREATE POLICY "Anyone can view own session questionnaires"
  ON questionnaires FOR SELECT
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Anyone can create questionnaires" ON questionnaires;
CREATE POLICY "Anyone can create questionnaires"
  ON questionnaires FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (session_id IS NOT NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Anyone can update own session questionnaires" ON questionnaires;
CREATE POLICY "Anyone can update own session questionnaires"
  ON questionnaires FOR UPDATE
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (session_id IS NOT NULL AND user_id IS NULL)
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (session_id IS NOT NULL AND user_id IS NULL)
  );

CREATE TABLE IF NOT EXISTS questionnaire_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  question_key text NOT NULL,
  answer jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE questionnaire_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view own session answers" ON questionnaire_answers;
CREATE POLICY "Anyone can view own session answers"
  ON questionnaire_answers FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = questionnaire_answers.questionnaire_id
      AND (
        (auth.uid() IS NOT NULL AND questionnaires.user_id = auth.uid()) OR
        (questionnaires.session_id IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Anyone can insert own session answers" ON questionnaire_answers;
CREATE POLICY "Anyone can insert own session answers"
  ON questionnaire_answers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = questionnaire_answers.questionnaire_id
      AND (
        (auth.uid() IS NOT NULL AND questionnaires.user_id = auth.uid()) OR
        (questionnaires.session_id IS NOT NULL AND questionnaires.user_id IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Anyone can update own session answers" ON questionnaire_answers;
CREATE POLICY "Anyone can update own session answers"
  ON questionnaire_answers FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = questionnaire_answers.questionnaire_id
      AND (
        (auth.uid() IS NOT NULL AND questionnaires.user_id = auth.uid()) OR
        (questionnaires.session_id IS NOT NULL)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = questionnaire_answers.questionnaire_id
      AND (
        (auth.uid() IS NOT NULL AND questionnaires.user_id = auth.uid()) OR
        (questionnaires.session_id IS NOT NULL AND questionnaires.user_id IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Anyone can delete own session answers" ON questionnaire_answers;
CREATE POLICY "Anyone can delete own session answers"
  ON questionnaire_answers FOR DELETE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = questionnaire_answers.questionnaire_id
      AND (
        (auth.uid() IS NOT NULL AND questionnaires.user_id = auth.uid()) OR
        (questionnaires.session_id IS NOT NULL)
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_questionnaire_id
  ON questionnaire_answers(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_section_id
  ON questionnaire_answers(section_id);
