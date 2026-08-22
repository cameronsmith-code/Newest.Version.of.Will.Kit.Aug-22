/*
# Create People & Professionals Shared Repositories

1. New Tables
- `people`: Household-wide repository of real people (family, trusted contacts, friends, etc.).
  - `id` (uuid, primary key)
  - `questionnaire_id` (uuid, references questionnaires, cascade delete)
  - `first_name` (text) — person's first name
  - `last_name` (text) — person's last name
  - `display_name` (text, not null) — canonical display name (e.g. "Ronny Bass")
  - `normalized_name` (text, not null) — lowercased/trimmed for duplicate detection
  - `person_type` (text) — family | trusted | professional | other
  - `relationship` (text) — free-text relationship to the client (e.g. "Sister", "Family friend")
  - `phone` (text) — phone number
  - `email` (text) — email address
  - `city` (text) — city
  - `province` (text) — province/state
  - `country` (text) — country
  - `notes` (text) — optional notes
  - `active` (boolean, default true) — soft-deactivation
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint on (questionnaire_id, normalized_name) to prevent duplicates

- `person_roles`: Separate table linking people to roles they hold (guardian, executor, attorney, etc.).
  - `id` (uuid, primary key)
  - `questionnaire_id` (uuid, references questionnaires, cascade delete)
  - `person_id` (uuid, references people, cascade delete)
  - `role_type` (text, not null) — guardian | alternate_guardian | estate_trustee | alternate_estate_trustee | attorney_property | attorney_personal_care | emergency_caregiver | important_adult | family_member | other
  - `subject_type` (text) — child | client | household | corporation | trust
  - `subject_id` (text) — ID of the subject (child ID, client ID, etc.)
  - `subject_label` (text) — display label for the subject
  - `status` (text) — confirmed | proposed | not_sure
  - `sort_order` (int, default 0) — ordering within a role type
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- Allow anon + authenticated CRUD (single-tenant, no sign-in).
- Unique constraint on people prevents accidental duplicate creation.

3. Important Notes
- The `people` table is the single source of truth for person identity across the app.
- One real person = one row in `people`. Multiple roles are stored as separate rows in `person_roles`.
- Questionnaire answers store PersonRef objects ({ personId, displayName }) referencing people.id.
- The `normalized_name` column enables duplicate detection without merging genuinely different people.
- Professionals (lawyers, accountants, advisors) are also stored in `people` with person_type = 'professional'.
- The `person_roles` table enables "one person, many roles" without duplicating person data.
*/
