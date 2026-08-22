/**
 * Employer Equity Intelligence — Stage 1 Pure Types
 *
 * Derived intelligence only. Never written back to questionnaire state.
 * No React, no context, no localStorage, no side effects.
 */

// ── Classification ──

export type EquityIntelligenceClassification =
  | 'operational_instruction'
  | 'worth_reviewing'
  | 'planning_opportunity'
  | 'needs_attention';

// ── Confidence ──

export type EquityIntelligenceConfidence =
  | 'confirmed'
  | 'client_reported'
  | 'requires_confirmation';

// ── Topics ──

export type EquityIntelligenceTopic =
  | 'death_treatment_unknown'
  | 'death_deadline'
  | 'beneficiary_unknown'
  | 'termination_treatment_unknown'
  | 'termination_deadline'
  | 'former_employer_benefit'
  | 'option_expiry'
  | 'option_expiry_unknown'
  | 'vesting_event'
  | 'retirement_approaching'
  | 'missing_administrator'
  | 'missing_documents'
  | 'incapacity_treatment_unknown'
  | 'serp_review'
  | 'rca_review';

// ── Deadline Engine ──

export type EquityDeadlineStatus =
  | 'informational'
  | 'planning_horizon'
  | 'approaching'
  | 'urgent'
  | 'passed'
  | 'unknown';

export type EquityDeadlineType =
  | 'option_expiry'
  | 'vesting'
  | 'settlement'
  | 'termination_deadline'
  | 'death_deadline'
  | 'other';

export interface EquityDeadlineInput {
  deadlineDate: string | undefined;
  deadlineType: EquityDeadlineType;
  evaluationDate: Date;
  triggerStatus?: string;
}

export interface EquityDeadlineResult {
  status: EquityDeadlineStatus;
  monthsRemaining: number | undefined;
  deadlineDate: string | undefined;
  deadlineType: EquityDeadlineType;
}

// ── Centralized deadline thresholds (in months) ──

export const DEADLINE_THRESHOLDS = {
  informational: 24, // > 24 months
  planningHorizon: 12, // 12–24 months
  approaching: 6, // 6–12 months
  urgent: 0, // 0–6 months
  passed: -1, // < 0 (past)
} as const;

export const DEADLINE_STATUS_LABELS: Record<EquityDeadlineStatus, string> = {
  informational: 'Informational',
  planning_horizon: 'Planning Horizon',
  approaching: 'Approaching',
  urgent: 'Urgent',
  passed: 'Passed',
  unknown: 'Unknown',
};

export const DEADLINE_STATUS_ORDER: Record<EquityDeadlineStatus, number> = {
  passed: 0,
  urgent: 1,
  approaching: 2,
  planning_horizon: 3,
  informational: 4,
  unknown: 5,
};

// ── Intelligence Item ──

export interface EquityIntelligenceEvidence {
  field: string;
  value: string | number | boolean | undefined;
  label: string;
}

export interface AudienceWording {
  client: string;
  executor: string;
  poa: string;
  professional: string;
}

export interface EquityIntelligenceItem {
  id: string;
  benefitId: string;
  topic: EquityIntelligenceTopic;
  classification: EquityIntelligenceClassification;
  confidence: EquityIntelligenceConfidence;
  title: string;
  summary: string;
  whyItMatters?: string;
  suggestedActions?: string[];
  evidence: EquityIntelligenceEvidence[];
  deadlineResult?: EquityDeadlineResult;
  audienceWording?: AudienceWording;
  crossBorderStoryId?: string;
  sourceIds?: string[];
}

// ── Canonical Benefit Input (plain data, no React) ──

export interface EmployerEquityBenefitInput {
  benefitId: string;
  benefitType: string;
  benefitTypeLabel: string;
  planName?: string;
  employerName: string;
  employerIsCurrent: boolean;
  clientId: 'client1' | 'client2';
  administratorName?: string;
  documentLocationLabel?: string;
  // Equity details (from EquityBenefitDetails)
  ownershipStatus?: string;
  vestingStatus?: string;
  vestingDates?: string[];
  optionExpiryStatus?: string;
  optionExpiryDate?: string;
  optionCount?: number;
  exercisePrice?: number;
  deathIncapacityKnown?: string;
  deathIncapacityNotes?: string;
  terminationKnown?: string;
  terminationDeadlineKnown?: string;
  terminationDeadline?: string;
  beneficiaryAllowed?: string;
  beneficiaryType?: string;
  currentlyReceiving?: string;
  reportedValueAmount?: number;
  executiveType?: string;
  notes?: string;
  yearsToRetirement?: number;
}

// ── Classification Labels ──

export const CLASSIFICATION_LABELS: Record<EquityIntelligenceClassification, string> = {
  operational_instruction: 'Operational Instruction',
  worth_reviewing: 'Worth Reviewing',
  planning_opportunity: 'Planning Opportunity',
  needs_attention: 'Needs Attention',
};

export const CLASSIFICATION_ORDER: Record<EquityIntelligenceClassification, number> = {
  needs_attention: 0,
  operational_instruction: 1,
  worth_reviewing: 2,
  planning_opportunity: 3,
};

export const CONFIDENCE_LABELS: Record<EquityIntelligenceConfidence, string> = {
  confirmed: 'Confirmed',
  client_reported: 'Client Reported',
  requires_confirmation: 'Requires Confirmation',
};

export const CONFIDENCE_ORDER: Record<EquityIntelligenceConfidence, number> = {
  confirmed: 0,
  client_reported: 1,
  requires_confirmation: 2,
};
