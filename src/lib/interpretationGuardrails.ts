/**
 * Legal / Tax / Medical Guardrails
 *
 * Defines what the Narrative Engine may and may not independently conclude.
 * These are guardrails, not logic — the Narrative Engine should check these
 * before emitting a conclusion.
 */

import type { EvidenceType, VerificationType } from './outputConfidenceTypes';

/**
 * Legal conclusions the Kit must NOT make independently.
 */
export const LEGAL_GUARDRAILS = [
  'will_is_legally_valid',
  'guardian_appointment_legally_effective',
  'trust_qualifies_as_henson_trust',
  'distribution_is_permitted',
  'beneficiary_designation_is_valid',
  'probate_can_be_avoided',
  'post_mortem_strategy_available',
  'will_reflects_current_wishes',
  'poa_is_in_effect',
  'trustee_has_specific_powers',
] as const;

/**
 * Tax conclusions the Kit must NOT make independently.
 */
export const TAX_GUARDRAILS = [
  'prescribe_pipeline_strategy',
  'prescribe_loss_carryback',
  'determine_tax_result',
  'calculate_estate_administration_tax',
  'determine_capital_gains_consequences',
  'determine_rrsp_rrif_tax_treatment',
] as const;

/**
 * Medical conclusions the Kit must NOT make independently.
 */
export const MEDICAL_GUARDRAILS = [
  'diagnose_condition',
  'alter_medication',
  'recommend_treatment',
  'determine_capacity',
  'assess_medical_prognosis',
] as const;

type GuardrailCategory = 'legal' | 'tax' | 'medical';

const GUARDRAIL_MAP: Record<GuardrailCategory, readonly string[]> = {
  legal: LEGAL_GUARDRAILS,
  tax: TAX_GUARDRAILS,
  medical: MEDICAL_GUARDRAILS,
};

const GUARDRAIL_VERIFICATION: Record<GuardrailCategory, VerificationType[]> = {
  legal: ['estateLawyer'],
  tax: ['accountant', 'estateLawyer'],
  medical: ['physician'],
};

/**
 * Check whether a proposed conclusion is within guardrails.
 * Returns the guardrail category if blocked, undefined if allowed.
 */
export function checkGuardrail(
  proposedConclusion: string
): { category: GuardrailCategory; blocked: string } | undefined {
  for (const category of ['legal', 'tax', 'medical'] as GuardrailCategory[]) {
    const blocked = GUARDRAIL_MAP[category].find(g =>
      proposedConclusion.includes(g)
    );
    if (blocked) {
      return { category, blocked };
    }
  }
  return undefined;
}

/**
 * Get the appropriate verification types for a guardrail category.
 */
export function getGuardrailVerification(
  category: GuardrailCategory
): VerificationType[] {
  return GUARDRAIL_VERIFICATION[category];
}

/**
 * Determine the appropriate EvidenceType for a conclusion that touches
 * a guardrail area. The conclusion should be framed as client understanding
 * or parent preference, not as verified fact.
 */
export function guardrailEvidenceType(
  hasDocumentBeenReviewed: boolean,
  isClientStated: boolean
): EvidenceType {
  if (hasDocumentBeenReviewed) return 'confirmedClientFact';
  if (isClientStated) return 'clientUnderstanding';
  return 'professionalReviewRequired';
}
