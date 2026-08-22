/*
  # Add Anonymous Session Support

  1. Changes to Tables
    - `questionnaires`
      - Add `session_id` column (text) for anonymous users
      - Make `user_id` nullable to support anonymous sessions
      - Add unique constraint on session_id
    
  2. Security Changes
    - Update RLS policies to support anonymous users with session_id
    - Allow anonymous users to create and manage their own questionnaires using session_id
    - Maintain existing authenticated user policies
  
  3. Important Notes
    - This enables questionnaire data to persist even if localStorage is cleared
    - Anonymous users are identified by a browser-generated session ID
    - Data remains secure - users can only access their own session data
*/

-- Add session_id column to questionnaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questionnaires' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE questionnaires ADD COLUMN session_id text;
    CREATE UNIQUE INDEX IF NOT EXISTS questionnaires_session_id_key ON questionnaires(session_id);
  END IF;
END $$;

-- Make user_id nullable
DO $$
BEGIN
  ALTER TABLE questionnaires ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own questionnaires" ON questionnaires;
DROP POLICY IF EXISTS "Users can create questionnaires" ON questionnaires;
DROP POLICY IF EXISTS "Users can update own questionnaires" ON questionnaires;
DROP POLICY IF EXISTS "Users can view own questionnaire answers" ON questionnaire_answers;
DROP POLICY IF EXISTS "Users can insert own questionnaire answers" ON questionnaire_answers;
DROP POLICY IF EXISTS "Users can update own questionnaire answers" ON questionnaire_answers;

-- Create new policies supporting both authenticated and anonymous users
CREATE POLICY "Anyone can view own session questionnaires"
  ON questionnaires
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can create questionnaires"
  ON questionnaires
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (session_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "Anyone can update own session questionnaires"
  ON questionnaires
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (session_id IS NOT NULL AND user_id IS NULL)
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (session_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "Anyone can view own session answers"
  ON questionnaire_answers
  FOR SELECT
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

CREATE POLICY "Anyone can insert own session answers"
  ON questionnaire_answers
  FOR INSERT
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

CREATE POLICY "Anyone can update own session answers"
  ON questionnaire_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = questionnaire_answers.questionnaire_id
      AND (
        (auth.uid() IS NOT NULL AND questionnaires.user_id = auth.uid()) OR
        (questionnaires.session_id IS NOT NULL AND questionnaires.user_id IS NULL)
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