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

DROP POLICY IF EXISTS "anon_select_questionnaires" ON questionnaires;
CREATE POLICY "anon_select_questionnaires" ON questionnaires FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_questionnaires" ON questionnaires;
CREATE POLICY "anon_insert_questionnaires" ON questionnaires FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_questionnaires" ON questionnaires;
CREATE POLICY "anon_update_questionnaires" ON questionnaires FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_questionnaires" ON questionnaires;
CREATE POLICY "anon_delete_questionnaires" ON questionnaires FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS questionnaire_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  question_key text NOT NULL,
  answer jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS questionnaire_answers_qid_idx ON questionnaire_answers (questionnaire_id);
CREATE INDEX IF NOT EXISTS questionnaire_answers_section_idx ON questionnaire_answers (section_id);

ALTER TABLE questionnaire_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_answers" ON questionnaire_answers;
CREATE POLICY "anon_select_answers" ON questionnaire_answers FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_answers" ON questionnaire_answers;
CREATE POLICY "anon_insert_answers" ON questionnaire_answers FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_answers" ON questionnaire_answers;
CREATE POLICY "anon_update_answers" ON questionnaire_answers FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_answers" ON questionnaire_answers;
CREATE POLICY "anon_delete_answers" ON questionnaire_answers FOR DELETE
TO anon, authenticated USING (true);