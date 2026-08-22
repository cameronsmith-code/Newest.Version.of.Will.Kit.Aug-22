/*
# Create Entity Registry — entities + entity_relationships tables

## Purpose
A shared entity model that unifies Person, Trust, Corporation, Partnership,
Sole Proprietorship, and Property into a single registry with typed
relationships (ownership, beneficiary, trustee, etc.). This replaces the
pattern of each section independently maintaining its own free-text lists
of corporations/trusts with no cross-section identity.

## New Tables

### 1. `entities`
- `id` (uuid, primary key)
- `questionnaire_id` (uuid, references questionnaires)
- `entity_type` (text: 'person' | 'trust' | 'corporation' | 'partnership' | 'sole_proprietorship' | 'property')
- `display_name` (text, canonical name for display)
- `normalized_name` (text, for duplicate detection — lowercased + trimmed)
- `completion_status` (text: 'identified' | 'partial' | 'complete')
- `source_section` (text, which questionnaire section first identified this entity)
- `source_entity_ref` (text, optional reference to the section-specific record ID, e.g. trust_abc123)
- `metadata` (jsonb, flexible storage for section-specific details that haven't been migrated yet)
- `active` (boolean, soft-delete flag, default true)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. `entity_relationships`
- `id` (uuid, primary key)
- `questionnaire_id` (uuid, references questionnaires)
- `source_entity_id` (uuid, references entities — the owner/trustee/beneficiary)
- `target_entity_id` (uuid, references entities — the owned entity / trust)
- `relationship_type` (text: 'owns' | 'beneficiary_of' | 'trustee_of' | 'partner_in')
- `ownership_percentage` (text, optional — stored on the relationship, not duplicated)
- `metadata` (jsonb, for future: share class, voting rights, loan details, etc.)
- `active` (boolean, soft-delete flag, default true)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security
- Single-tenant app (no auth screen) → policies use `TO anon, authenticated` with `USING (true)`.
- RLS enabled on both tables.
- 4 policies per table (SELECT/INSERT/UPDATE/DELETE).

## Important Notes
1. The `entities` table is the single source of truth for entity identity.
2. The `entity_relationships` table is the single source of truth for ownership and other relationships.
3. `ownership_percentage` lives on the relationship record — it must NOT be duplicated in section-specific arrays.
4. `source_section` and `source_entity_ref` allow tracing an entity back to the section that first created it.
5. `metadata` jsonb allows storing partial details without requiring a full section migration.
6. `completion_status` tracks: 'identified' (just a name), 'partial' (some details), 'complete' (full intake done).
*/

CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('person', 'trust', 'corporation', 'partnership', 'sole_proprietorship', 'property')),
  display_name text NOT NULL,
  normalized_name text NOT NULL,
  completion_status text NOT NULL DEFAULT 'identified' CHECK (completion_status IN ('identified', 'partial', 'complete')),
  source_section text NOT NULL DEFAULT '',
  source_entity_ref text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_entities_questionnaire_id ON entities(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_entities_normalized_name ON entities(questionnaire_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_entities_entity_type ON entities(questionnaire_id, entity_type);

DROP POLICY IF EXISTS "anon_select_entities" ON entities;
CREATE POLICY "anon_select_entities" ON entities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_entities" ON entities;
CREATE POLICY "anon_insert_entities" ON entities FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_entities" ON entities;
CREATE POLICY "anon_update_entities" ON entities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_entities" ON entities;
CREATE POLICY "anon_delete_entities" ON entities FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  source_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('owns', 'beneficiary_of', 'trustee_of', 'partner_in')),
  ownership_percentage text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_entity_id != target_entity_id)
);

ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_entity_rel_questionnaire_id ON entity_relationships(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_entity_rel_source ON entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_rel_target ON entity_relationships(target_entity_id);

DROP POLICY IF EXISTS "anon_select_entity_relationships" ON entity_relationships;
CREATE POLICY "anon_select_entity_relationships" ON entity_relationships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_entity_relationships" ON entity_relationships;
CREATE POLICY "anon_insert_entity_relationships" ON entity_relationships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_entity_relationships" ON entity_relationships;
CREATE POLICY "anon_update_entity_relationships" ON entity_relationships FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_entity_relationships" ON entity_relationships;
CREATE POLICY "anon_delete_entity_relationships" ON entity_relationships FOR DELETE
  TO anon, authenticated USING (true);
