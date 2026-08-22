/**
 * Conflict Detection
 *
 * Detects when two or more sources provide different answers to the same
 * logical question. Preserves both sources rather than silently choosing one.
 */

import type { DataConflict, LimitationImportance } from './outputConfidenceTypes';

type ConflictSource = {
  label: string;
  value: string;
  sourceSectionId: string;
  sourceFieldId?: string;
};

/**
 * Detect a simple two-source conflict.
 * Returns a DataConflict if values differ, undefined if they agree or either is empty.
 */
export function detectConflict(
  id: string,
  description: string,
  sourceA: ConflictSource,
  sourceB: ConflictSource,
  options?: {
    importance?: LimitationImportance;
    suggestedNextStep?: string;
    verificationType?: DataConflict['verificationType'];
  }
): DataConflict | undefined {
  if (!sourceA.value || !sourceB.value) return undefined;
  if (sourceA.value.trim().toLowerCase() === sourceB.value.trim().toLowerCase()) return undefined;

  return {
    id,
    description,
    sources: [sourceA, sourceB],
    importance: options?.importance || 'worthConfirming',
    suggestedNextStep: options?.suggestedNextStep,
    verificationType: options?.verificationType,
  };
}

/**
 * Detect conflicts across the Will understanding vs Guardianship planning boundary.
 *
 * Example: Will understanding says guardian is Michael,
 * but Guardianship planning says guardian is Laura.
 */
export function detectWillVsPlanningGuardianConflict(
  willGuardianName: string,
  planningGuardianName: string
): DataConflict | undefined {
  return detectConflict(
    'guardian_will_vs_planning',
    'Your current Guardianship plan and your understanding of your existing Will identify different guardians.',
    {
      label: 'Current Will understanding',
      value: willGuardianName,
      sourceSectionId: 'wills',
      sourceFieldId: 'currentWillGuardianName',
    },
    {
      label: 'Guardianship planning',
      value: planningGuardianName,
      sourceSectionId: 'children',
      sourceFieldId: 'guardianPersonId',
    },
    {
      importance: 'highPriorityReview',
      suggestedNextStep:
        'Consider confirming which appointment reflects your current wishes and updating your estate documents if necessary.',
      verificationType: 'estateLawyer',
    }
  );
}

/**
 * Detect conflict between inheritance age in Will understanding vs legacy intent.
 */
export function detectInheritanceAgeConflict(
  willInheritanceApproach: string,
  legacyIntentDistributionApproach: string
): DataConflict | undefined {
  return detectConflict(
    'inheritance_will_vs_legacy',
    'Your current wishes for how your children should receive their inheritance appear different from your understanding of your existing Will.',
    {
      label: 'Current Will understanding',
      value: willInheritanceApproach,
      sourceSectionId: 'wills',
      sourceFieldId: 'inheritanceType',
    },
    {
      label: 'Legacy intent',
      value: legacyIntentDistributionApproach,
      sourceSectionId: 'legacyIntent',
      sourceFieldId: 'distributionApproach',
    },
    {
      importance: 'highPriorityReview',
      suggestedNextStep:
        'Consider discussing this difference with your estate lawyer to confirm whether your estate documents reflect your current wishes.',
      verificationType: 'estateLawyer',
    }
  );
}
