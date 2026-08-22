/*
# Create People & Professionals Shared Repositories (Tables)

1. New Tables
- `people`: Household-wide repository of real people (family, trusted contacts, friends, professionals).
  - `id` (uuid, primary key)
  - `questionnaire_id` (uuid, references questionnaires, cascade delete)
  - `first_name` (text)
  - `last_name` (text)
  - `display_name` (text, not null) — canonical display name
  - `normalized_name` (text, not null) — lowercased/trimmed for dedup
  - `person_type` (text) — family | trusted | professional | other
  - `relationship` (text) — free-text relationship to client
  - `phone`, `email`, `city`, `province`, `country` (text) — contact info
  - `notes` (text)
  - `active` (boolean, default true)
  - `created_at`, `updated_at` (timestamptz)
  - Unique constraint on (questionnaire_id, normalized_name) where active

- `person_roles`: Links people to roles (guardian, executor, attorney, etc.)
  - `id` (uuid, primary key)
  - `questionnaire_id` (uuid, references questionnaires, cascade delete)
  - `person_id` (uuid, references people, cascade delete)
  - `role_type` (text, not null)
  - `subject_type` (text), `subject_id` (text), `subject_label` (text)
  - `status` (text), `sort_order` (int, default 0)
  - `created_at`, `updated_at` (timestamptz)

2. Security
- RLS enabled on both tables.
- anon + authenticated CRUD (single-tenant, no sign-in).
*/
