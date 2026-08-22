/**
 * Hidden Risk Engine V1 — Core Type Definitions
 *
 * Every rule evaluates to exactly one of four states.
 * Findings are separated from confidence from level.
 * Evidence and audit trails are first-class.
 */

import type { EntityEntry, EntityRelationship } from '../entityRegistryTypes';

// ── Evaluation States ──

export type RiskEvaluationState = 'PASS' | 'FIRE' | 'REVIEW' | 'NOT_APPLICABLE';

// ── Finding Levels ──

export type HiddenRiskLevel =
  | 'needs_attention'
  | 'planning_gap'
  | 'worth_reviewing'
  | 'planning_opportunity';

// ── Confidence ──

export type FindingConfidence = 'confirmed' | 'likely' | 'requires_confirmation';

// ── Evidence ──

export type EvidenceType =
  | 'person'
  | 'trust'
  | 'corporation'
  | 'property'
  | 'obligation'
  | 'document'
  | 'questionnaire_answer'
  | 'relationship'
  | 'date'
  | 'other';

export interface HiddenRiskEvidence {
  type: EvidenceType;
  entityId?: string;
  label: string;
  value?: string | number | boolean;
  sourceSection?: string;
}

// ── Audit Trail ──

export interface HiddenRiskAuditItem {
  ruleId: string;
  condition: string;
  result: boolean | 'unknown';
  source?: string;
  entityId?: string;
  notes?: string;
}

// ── Findings ──

export interface HiddenRiskFinding {
  id: string;
  ruleId: string;
  state: 'FIRE' | 'REVIEW';
  level: HiddenRiskLevel;
  confidence: FindingConfidence;
  family: string;
  title: string;
  summary: string;
  whyItMatters?: string;
  evidence: HiddenRiskEvidence[];
  affectedEntityIds?: string[];
  relatedObligationIds?: string[];
  relatedDocumentIds?: string[];
  suggestedActions?: string[];
  professionalTypes?: string[];
  sourceSections?: string[];
  suppressedRuleIds?: string[];
  findingAuditTrail?: HiddenRiskAuditItem[];
}

// ── Positive Findings ──

export interface HiddenRiskPositiveFinding {
  sourceRuleId: string;
  title: string;
  evidence: HiddenRiskEvidence[];
}

// ── Rule Evaluation ──

export interface HiddenRiskRuleEvaluation {
  ruleId: string;
  ruleTitle: string;
  state: RiskEvaluationState;
  level?: HiddenRiskLevel;
  confidence?: FindingConfidence;
  evidence: HiddenRiskEvidence[];
  auditItems: HiddenRiskAuditItem[];
  suppressedBy?: string;
  isPrimary: boolean;
  notes?: string;
}

// ── Suppression ──

export interface RulePresentationState {
  ruleId: string;
  isPrimary: boolean;
  suppressedBy?: string;
}

// ── Engine Result ──

export interface HiddenRiskEngineResult {
  primaryFindings: HiddenRiskFinding[];
  byLevel: {
    needsAttention: HiddenRiskFinding[];
    planningGaps: HiddenRiskFinding[];
    worthReviewing: HiddenRiskFinding[];
    planningOpportunities: HiddenRiskFinding[];
  };
  suppressedFindings: HiddenRiskFinding[];
  positiveFindings: HiddenRiskPositiveFinding[];
  evaluations: HiddenRiskRuleEvaluation[];
  auditTrail: HiddenRiskAuditItem[];
}

// ── Engine Input ──

export interface HiddenRiskEngineInput {
  answers: Map<string, Record<string, unknown>>;
  entities: EntityEntry[];
  relationships: EntityRelationship[];
}

// ── Rule Context (pre-computed data passed to each rule) ──

export interface RuleContext {
  answers: Map<string, Record<string, unknown>>;
  entities: EntityEntry[];
  relationships: EntityRelationship[];

  // Section completion tracking
  completedSections: Set<string>;

  // Client info
  client1Name: string;
  client2Name: string;
  client1EntityId: string;
  client2EntityId: string;
  hasSpouse: boolean;
  maritalStatus: string;

  // Canonical entity lookups
  personEntities: EntityEntry[];
  trustEntities: EntityEntry[];
  corporationEntities: EntityEntry[];
  obligationEntities: EntityEntry[];
  lenderEntities: EntityEntry[];
  propertyEntities: EntityEntry[];

  // Active-only filters
  activeEntities: EntityEntry[];
  activeRelationships: EntityRelationship[];
}

// ── Rule Definition ──

export interface HiddenRiskRule {
  id: string;
  title: string;
  family: string;
  professionalTypes?: string[];
  evaluate: (ctx: RuleContext) => RuleResult;
}

// ── Rule Result ──

export interface RuleResult {
  state: RiskEvaluationState;
  level?: HiddenRiskLevel;
  confidence?: FindingConfidence;
  evidence?: HiddenRiskEvidence[];
  auditItems?: HiddenRiskAuditItem[];
  title?: string;
  summary?: string;
  whyItMatters?: string;
  suggestedActions?: string[];
  affectedEntityIds?: string[];
  relatedObligationIds?: string[];
  sourceSections?: string[];
  professionalTypes?: string[];
  notes?: string;
}

// ── Compound Rule Definition ──

export interface CompoundRule {
  id: string;
  title: string;
  family: string;
  professionalTypes?: string[];
  childRuleIds: string[];
  evaluate: (ctx: RuleContext, childResults: Map<string, RuleResult>) => RuleResult;
}

// ── Helper: Level ordering for sorting ──

export const LEVEL_ORDER: Record<HiddenRiskLevel, number> = {
  needs_attention: 0,
  planning_gap: 1,
  worth_reviewing: 2,
  planning_opportunity: 3,
};

export const CONFIDENCE_ORDER: Record<FindingConfidence, number> = {
  confirmed: 0,
  likely: 1,
  requires_confirmation: 2,
};

export const LEVEL_LABELS: Record<HiddenRiskLevel, string> = {
  needs_attention: 'Needs Attention',
  planning_gap: 'Planning Gap',
  worth_reviewing: 'Worth Reviewing',
  planning_opportunity: 'Planning Opportunity',
};

export const CONFIDENCE_LABELS: Record<FindingConfidence, string> = {
  confirmed: 'Confirmed',
  likely: 'Likely',
  requires_confirmation: 'Requires Confirmation',
};

export const STATE_LABELS: Record<RiskEvaluationState, string> = {
  PASS: 'PASS',
  FIRE: 'FIRE',
  REVIEW: 'REVIEW',
  NOT_APPLICABLE: 'NOT APPLICABLE',
};
