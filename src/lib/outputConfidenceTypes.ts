/**
 * Shared Output Evidence / Confidence Model
 *
 * Used across all Will Companion Kit outputs to distinguish:
 * - what is known vs intended vs understood vs inferred vs missing
 * - what requires professional confirmation
 * - what the appropriate next step is
 *
 * This is the single source of truth for output confidence.
 * Do not create competing confidence systems per report.
 */

export type EvidenceType =
  | 'confirmedClientFact'
  | 'parentPreference'
  | 'clientUnderstanding'
  | 'derivedInterpretation'
  | 'incompleteInformation'
  | 'professionalReviewRequired';

export type ConfidenceLevel = 'high' | 'moderate' | 'limited';

export type LimitationReason =
  | 'clientUnsure'
  | 'missingInformation'
  | 'missingDocument'
  | 'documentNotReviewed'
  | 'conflictingAnswers'
  | 'professionalJudgmentRequired'
  | 'legalInterpretationRequired'
  | 'taxInterpretationRequired'
  | 'medicalInterpretationRequired'
  | 'dataMayBeOutdated'
  | 'other';

export type VerificationType =
  | 'estateLawyer'
  | 'lawyer'
  | 'accountant'
  | 'financialPlanner'
  | 'insuranceProfessional'
  | 'physician'
  | 'healthcareProvider'
  | 'school'
  | 'trustee'
  | 'financialInstitution'
  | 'employer'
  | 'governmentAgency'
  | 'other';

export type LimitationImportance =
  | 'informational'
  | 'worthConfirming'
  | 'professionalReview'
  | 'highPriorityReview';

export interface OutputEvidence {
  evidenceType: EvidenceType;
  sourceFieldIds?: string[];
  sourceRecordIds?: string[];
  confidence: ConfidenceLevel;
  limitation?: string;
  limitationReason?: LimitationReason;
  verificationRecommended?: boolean;
  verificationType?: VerificationType;
  verificationPersonIds?: string[];
}

export interface NextAction {
  label: string;
  description?: string;
}

export interface NarrativeLimitation {
  message: string;
  importance: LimitationImportance;
  reviewerType?: VerificationType;
  reviewerPersonIds?: string[];
}

/**
 * Structured review item for professional-review issues.
 * Renders as "What we know / Why it matters / What we can't confirm / Suggested next step".
 */
export interface ClarifyReviewItem {
  id: string;
  title: string;
  whatWeKnow: string;
  whyItMatters?: string;
  whatWeCannotConfirm?: string;
  suggestedNextStep?: string;
  verificationType?: VerificationType;
  verificationPersonIds?: string[];
  importance: LimitationImportance;
  evidence: OutputEvidence;
}

/**
 * Conflict between two or more sources for the same logical question.
 */
export interface DataConflict {
  id: string;
  description: string;
  sources: Array<{
    label: string;
    value: string;
    sourceSectionId: string;
    sourceFieldId?: string;
  }>;
  importance: LimitationImportance;
  suggestedNextStep?: string;
  verificationType?: VerificationType;
}

/**
 * Missing information that has been converted into an actionable item.
 */
export interface MissingInformationItem {
  id: string;
  label: string;
  description: string;
  whyItMatters?: string;
  suggestedAction?: string;
  importance: LimitationImportance;
  sourceFieldId?: string;
}

/**
 * Report-specific scope limitation.
 */
export interface ReportScopeLimitation {
  reportId: string;
  title: string;
  body: string;
}
