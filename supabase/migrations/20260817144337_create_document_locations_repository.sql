/*
# Create Document & Records Location Repository

1. New Tables
- `document_locations`: Household-wide repository of locations where documents/records can be found.
  - `id` (uuid, primary key)
  - `questionnaire_id` (uuid, references questionnaires, cascade delete)
  - `canonical_label` (text, not null) — the display label (e.g. "Filing Cabinet")
  - `normalized_label` (text, not null) — lowercased/trimmed version for duplicate detection
  - `location_type` (text) — auto-classified: physical | professional | digital | financial_institution | other
  - `notes` (text) — optional notes about this location
  - `active` (boolean, default true) — soft-deactivation
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint on (questionnaire_id, normalized_label) to prevent duplicates

2. Security
- Enable RLS on `document_locations`.
- Allow anon + authenticated CRUD (single-tenant, no sign-in).
- Unique constraint prevents accidental duplicate creation.

3. Important Notes
- This table is the single source of truth for where documents/records are stored.
- Document records throughout the app reference a `locationId` instead of free-text.
- Existing free-text values are migrated into this table during questionnaire initialization.
- The `normalized_label` column enables duplicate detection without merging genuinely different locations.
*/

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

-- Unique constraint: one canonical location per normalized label per questionnaire
CREATE UNIQUE INDEX IF NOT EXISTS document_locations_questionnaire_normalized_idx
  ON document_locations (questionnaire_id, normalized_label)
  WHERE active = true;

ALTER TABLE document_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_document_locations" ON document_locations;
CREATE POLICY "anon_select_document_locations"
ON document_locations FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_document_locations" ON document_locations;
CREATE POLICY "anon_insert_document_locations"
ON document_locations FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_document_locations" ON document_locations;
CREATE POLICY "anon_update_document_locations"
ON document_locations FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_document_locations" ON document_locations;
CREATE POLICY "anon_delete_document_locations"
ON document_locations FOR DELETE
TO anon, authenticated USING (true);
