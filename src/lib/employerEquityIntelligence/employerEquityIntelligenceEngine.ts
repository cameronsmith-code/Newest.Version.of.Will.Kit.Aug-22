/**
 * Employer Equity Intelligence — Stage 1 Pure Engine
 *
 * Orchestrates rules over a set of benefits and returns intelligence items.
 * Pure: no React, no context, no localStorage, no state writes, no side effects.
 */

import type {
  EmployerEquityBenefitInput,
  EquityIntelligenceClassification,
  EquityIntelligenceConfidence,
  EquityIntelligenceItem,
} from './employerEquityIntelligenceTypes';
import {
  CLASSIFICATION_ORDER,
  CONFIDENCE_ORDER,
} from './employerEquityIntelligenceTypes';
import { ALL_EQUITY_INTELLIGENCE_RULES, FORMER_EMPLOYER_CONSOLIDATION_TOPICS } from './employerEquityIntelligenceRules';

function isMeaningfulBenefitForConsolidation(benefit: EmployerEquityBenefitInput): boolean {
  if (benefit.reportedValueAmount && benefit.reportedValueAmount > 0) return true;
  if (benefit.optionCount && benefit.optionCount > 0) return true;
  const ownership = benefit.ownershipStatus;
  if (ownership === 'currently_own' || ownership === 'both' || ownership === 'future_contingent') return true;
  if (benefit.vestingStatus && benefit.vestingStatus !== 'fully_vested') return true;
  return false;
}

export interface EquityIntelligenceEngineResult {
  items: EquityIntelligenceItem[];
  byClassification: {
    needsAttention: EquityIntelligenceItem[];
    operationalInstruction: EquityIntelligenceItem[];
    worthReviewing: EquityIntelligenceItem[];
    planningOpportunity: EquityIntelligenceItem[];
  };
  byBenefit: Map<string, EquityIntelligenceItem[]>;
  totalEvaluated: number;
  totalFindings: number;
}

/**
 * Evaluate a single benefit against all rules.
 * Returns all intelligence items produced for that benefit.
 */
export function evaluateEmployerEquityBenefit(
  benefit: EmployerEquityBenefitInput,
  evaluationDate: Date = new Date(),
): EquityIntelligenceItem[] {
  const items: EquityIntelligenceItem[] = [];
  const suppressedTopics = new Set<string>();

  // If this is a former-employer benefit, the former_employer_benefit rule
  // consolidates option_expiry_unknown, missing_administrator, and missing_documents
  // into a single item. Suppress those individual topics.
  if (!benefit.employerIsCurrent && isMeaningfulBenefitForConsolidation(benefit)) {
    for (const t of FORMER_EMPLOYER_CONSOLIDATION_TOPICS) {
      suppressedTopics.add(t);
    }
  }

  for (const rule of ALL_EQUITY_INTELLIGENCE_RULES) {
    // Skip rules whose topic is suppressed for this benefit
    if (suppressedTopics.has(rule.topic)) continue;
    // The former_employer_benefit rule itself always runs (it's not suppressed)
    const item = rule.evaluate(benefit, evaluationDate);
    if (item) items.push(item);
  }
  return items;
}

/**
 * Evaluate a set of benefits and return a structured result.
 */
export function buildEmployerEquityIntelligenceItems(
  benefits: EmployerEquityBenefitInput[],
  evaluationDate: Date = new Date(),
): EquityIntelligenceResult {
  const allItems: EquityIntelligenceItem[] = [];
  const byBenefit = new Map<string, EquityIntelligenceItem[]>();

  for (const benefit of benefits) {
    const items = evaluateEmployerEquityBenefit(benefit, evaluationDate);
    if (items.length > 0) {
      byBenefit.set(benefit.benefitId, items);
      allItems.push(...items);
    }
  }

  // Sort by classification urgency, then confidence
  const sorted = [...allItems].sort((a, b) => {
    const classDiff = CLASSIFICATION_ORDER[a.classification] - CLASSIFICATION_ORDER[b.classification];
    if (classDiff !== 0) return classDiff;
    return CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence];
  });

  const byClassification = {
    needsAttention: sorted.filter((i) => i.classification === 'needs_attention'),
    operationalInstruction: sorted.filter((i) => i.classification === 'operational_instruction'),
    worthReviewing: sorted.filter((i) => i.classification === 'worth_reviewing'),
    planningOpportunity: sorted.filter((i) => i.classification === 'planning_opportunity'),
  };

  return {
    items: sorted,
    byClassification,
    byBenefit,
    totalEvaluated: benefits.length,
    totalFindings: sorted.length,
  };
}

export type EquityIntelligenceResult = EquityIntelligenceEngineResult;

export type {
  EmployerEquityBenefitInput,
  EquityIntelligenceItem,
  EquityIntelligenceClassification,
  EquityIntelligenceConfidence,
};
