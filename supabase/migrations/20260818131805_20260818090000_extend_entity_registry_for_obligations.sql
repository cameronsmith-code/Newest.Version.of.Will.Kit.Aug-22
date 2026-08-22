/*
# Extend Entity Registry for Obligation Architecture

## Purpose
Extends the existing entity_registry tables to support the Trust debt / trustee
exposure architecture. Adds 'obligation' and 'lender' as valid entity types,
and adds new relationship types for debt-related relationships
(borrower_of, guarantor_of, secured_by, lender_of).

## Changes
1. `entities.entity_type` CHECK constraint: add 'obligation' and 'lender'
2. `entity_relationships.relationship_type` CHECK constraint: add
   'borrower_of', 'guarantor_of', 'secured_by', 'lender_of'

## Security
- No new tables. Existing RLS policies remain in effect.
- The CHECK constraints are widened, not narrowed — no data loss.
*/

-- Extend entities.entity_type to include 'obligation' and 'lender'
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_entity_type_check;
ALTER TABLE entities ADD CONSTRAINT entities_entity_type_check
  CHECK (entity_type IN ('person', 'trust', 'corporation', 'partnership', 'sole_proprietorship', 'property', 'obligation', 'lender'));

-- Extend entity_relationships.relationship_type to include debt-related types
ALTER TABLE entity_relationships DROP CONSTRAINT IF EXISTS entity_relationships_relationship_type_check;
ALTER TABLE entity_relationships ADD CONSTRAINT entity_relationships_relationship_type_check
  CHECK (relationship_type IN ('owns', 'beneficiary_of', 'trustee_of', 'partner_in', 'borrower_of', 'guarantor_of', 'secured_by', 'lender_of'));
