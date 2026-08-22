CREATE TABLE IF NOT EXISTS document_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
  canonical_label text NOT NULL,
  normalized_label text NOT NULL,
  location_type text DEFAULT 'other',
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS document_locations_questionnaire_normalized_idx
  ON document_locations (questionnaire_id, normalized_label)
  WHERE active = true;

ALTER TABLE document_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_document_locations" ON document_locations;
CREATE POLICY "anon_select_document_locations" ON document_locations FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_document_locations" ON document_locations;
CREATE POLICY "anon_insert_document_locations" ON document_locations FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_document_locations" ON document_locations;
CREATE POLICY "anon_update_document_locations" ON document_locations FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_document_locations" ON document_locations;
CREATE POLICY "anon_delete_document_locations" ON document_locations FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  display_name text NOT NULL,
  normalized_name text NOT NULL,
  person_type text DEFAULT 'other',
  relationship text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  city text DEFAULT '',
  province text DEFAULT '',
  country text DEFAULT '',
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS people_questionnaire_normalized_idx
  ON people (questionnaire_id, normalized_name)
  WHERE active = true;

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_people" ON people;
CREATE POLICY "anon_select_people" ON people FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_people" ON people;
CREATE POLICY "anon_insert_people" ON people FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_people" ON people;
CREATE POLICY "anon_update_people" ON people FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_people" ON people;
CREATE POLICY "anon_delete_people" ON people FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS person_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE,
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  role_type text NOT NULL,
  subject_type text DEFAULT '',
  subject_id text DEFAULT '',
  subject_label text DEFAULT '',
  status text DEFAULT 'confirmed',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS person_roles_person_idx ON person_roles (person_id);
CREATE INDEX IF NOT EXISTS person_roles_questionnaire_role_idx ON person_roles (questionnaire_id, role_type);

ALTER TABLE person_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_person_roles" ON person_roles;
CREATE POLICY "anon_select_person_roles" ON person_roles FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_person_roles" ON person_roles;
CREATE POLICY "anon_insert_person_roles" ON person_roles FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_person_roles" ON person_roles;
CREATE POLICY "anon_update_person_roles" ON person_roles FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_person_roles" ON person_roles;
CREATE POLICY "anon_delete_person_roles" ON person_roles FOR DELETE
TO anon, authenticated USING (true);