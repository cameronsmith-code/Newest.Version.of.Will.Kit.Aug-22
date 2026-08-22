/**
 * Hidden Risk Engine V1 — Main Engine Orchestrator
 *
 * Evaluates all 23 individual rules + 4 compound rules,
 * applies suppression, generates positive findings,
 * and returns a structured HiddenRiskEngineResult.
 */

import type {
  HiddenRiskEngineInput,
  HiddenRiskEngineResult,
  HiddenRiskFinding,
  HiddenRiskRuleEvaluation,
  HiddenRiskAuditItem,
  HiddenRiskPositiveFinding,
  RuleContext,
  RuleResult,
} from './hiddenRiskTypes';
import { LEVEL_ORDER, CONFIDENCE_ORDER } from './hiddenRiskTypes';
import { ALL_RULES } from './hiddenRiskRules';
import { ALL_COMPOUND_RULES } from './hiddenRiskCompoundRules';
import { applySuppression, sortFindings } from './hiddenRiskSuppression';
import {
  getClientInfo,
  getActiveEntities,
  getActiveRelationships,
  getEntitiesByType,
  getCompletedSections,
} from './hiddenRiskSelectors';

/**
 * Build the RuleContext from raw engine input.
 */
function buildContext(input: HiddenRiskEngineInput): RuleContext {
  const clientInfo = getClientInfo(input.answers);
  const activeEntities = getActiveEntities(input.entities);
  const activeRelationships = getActiveRelationships(input.relationships);
  const completedSections = getCompletedSections(input.answers);

  return {
    answers: input.answers,
    entities: input.entities,
    relationships: input.relationships,
    completedSections,
    client1Name: clientInfo.client1Name,
    client2Name: clientInfo.client2Name,
    client1EntityId: clientInfo.client1EntityId,
    client2EntityId: clientInfo.client2EntityId,
    hasSpouse: clientInfo.hasSpouse,
    maritalStatus: clientInfo.maritalStatus,
    personEntities: getEntitiesByType(activeEntities, 'person'),
    trustEntities: getEntitiesByType(activeEntities, 'trust'),
    corporationEntities: getEntitiesByType(activeEntities, 'corporation'),
    obligationEntities: getEntitiesByType(activeEntities, 'obligation'),
    lenderEntities: getEntitiesByType(activeEntities, 'lender'),
    propertyEntities: getEntitiesByType(activeEntities, 'property'),
    activeEntities,
    activeRelationships,
  };
}

/**
 * Convert a RuleResult + rule metadata into a HiddenRiskFinding.
 */
function resultToFinding(
  ruleId: string,
  title: string,
  family: string,
  professionalTypes: string[] | undefined,
  result: RuleResult,
  counter: number
): HiddenRiskFinding | null {
  if (result.state !== 'FIRE' && result.state !== 'REVIEW') return null;

  return {
    id: `finding_${ruleId}_${counter}`,
    ruleId,
    state: result.state,
    level: result.level || 'worth_reviewing',
    confidence: result.confidence || 'requires_confirmation',
    family,
    title: result.title || title,
    summary: result.summary || '',
    whyItMatters: result.whyItMatters,
    evidence: result.evidence || [],
    affectedEntityIds: result.affectedEntityIds,
    relatedObligationIds: result.relatedObligationIds,
    suggestedActions: result.suggestedActions,
    professionalTypes: professionalTypes || result.professionalTypes,
    sourceSections: result.sourceSections,
    findingAuditTrail: result.auditItems,
  };
}

/**
 * Build a positive finding from a PASS result with evidence.
 */
function buildPositiveFinding(
  ruleId: string,
  title: string,
  result: RuleResult
): HiddenRiskPositiveFinding | null {
  if (result.state !== 'PASS') return null;
  if (!result.evidence || result.evidence.length === 0) return null;

  // Generate positive title from notes or default
  const positiveTitle = result.notes || title;
  return {
    sourceRuleId: ruleId,
    title: positiveTitle,
    evidence: result.evidence,
  };
}

/**
 * Run the engine.
 */
export function runHiddenRiskEngine(input: HiddenRiskEngineInput): HiddenRiskEngineResult {
  const ctx = buildContext(input);

  // ── Evaluate individual rules ──
  const ruleResults = new Map<string, RuleResult>();
  const evaluations: HiddenRiskRuleEvaluation[] = [];
  const allAuditItems: HiddenRiskAuditItem[] = [];
  const findings: HiddenRiskFinding[] = [];
  const positiveFindings: HiddenRiskPositiveFinding[] = [];
  let findingCounter = 0;

  for (const rule of ALL_RULES) {
    const result = rule.evaluate(ctx);
    ruleResults.set(rule.id, result);

    if (result.auditItems) {
      allAuditItems.push(...result.auditItems);
    }

    evaluations.push({
      ruleId: rule.id,
      ruleTitle: rule.title,
      state: result.state,
      level: result.level,
      confidence: result.confidence,
      evidence: result.evidence || [],
      auditItems: result.auditItems || [],
      isPrimary: true,
      notes: result.notes,
    });

    const finding = resultToFinding(rule.id, rule.title, rule.family, rule.professionalTypes, result, findingCounter);
    void findingCounter;
    if (finding) {
      findings.push(finding);
      findingCounter++;
    }

    const positive = buildPositiveFinding(rule.id, rule.title, result);
    if (positive) {
      positiveFindings.push(positive);
    }
  }

  // ── Evaluate compound rules ──
  const compoundFindings: HiddenRiskFinding[] = [];
  for (const compound of ALL_COMPOUND_RULES) {
    // Build child results map (only for this compound's children)
    const childResults = new Map<string, RuleResult>();
    for (const childId of compound.childRuleIds) {
      const childResult = ruleResults.get(childId);
      if (childResult) childResults.set(childId, childResult);
    }

    const result = compound.evaluate(ctx, childResults);

    if (result.auditItems) {
      allAuditItems.push(...result.auditItems);
    }

    const finding = resultToFinding(compound.id, compound.title, compound.family, compound.professionalTypes, result, findingCounter);
    if (finding) {
      compoundFindings.push(finding);
      findingCounter++;

      // Update evaluations for compound
      evaluations.push({
        ruleId: compound.id,
        ruleTitle: compound.title,
        state: result.state,
        level: result.level,
        confidence: result.confidence,
        evidence: result.evidence || [],
        auditItems: result.auditItems || [],
        isPrimary: true,
        notes: result.notes,
      });
    }
  }

  // ── Apply suppression ──
  const { primaryFindings: unsorted, suppressedFindings, presentationStates } = applySuppression(findings, compoundFindings);

  // Update evaluation primary/suppressed status
  for (const evalItem of evaluations) {
    const state = presentationStates.find((s) => s.ruleId === evalItem.ruleId);
    if (state) {
      evalItem.isPrimary = state.isPrimary;
      evalItem.suppressedBy = state.suppressedBy;
    }
  }

  // ── Sort primary findings ──
  const sorted = sortFindings(unsorted, LEVEL_ORDER, CONFIDENCE_ORDER);

  // ── Group by level ──
  const byLevel = {
    needsAttention: sorted.filter((f) => f.level === 'needs_attention'),
    planningGaps: sorted.filter((f) => f.level === 'planning_gap'),
    worthReviewing: sorted.filter((f) => f.level === 'worth_reviewing'),
    planningOpportunities: sorted.filter((f) => f.level === 'planning_opportunity'),
  };

  return {
    primaryFindings: sorted,
    byLevel,
    suppressedFindings,
    positiveFindings,
    evaluations,
    auditTrail: allAuditItems,
  };
}
