/**
 * Hidden Risk Engine V1 — Compound Rules C-01 through C-04
 *
 * Compound rules aggregate child findings into a single stronger finding
 * when multiple related issues tell a coherent story.
 */

import type { RuleResult, CompoundRule, HiddenRiskEvidence, HiddenRiskAuditItem } from './hiddenRiskTypes';

function audit(ruleId: string, condition: string, result: boolean | 'unknown', notes?: string): HiddenRiskAuditItem {
  return { ruleId, condition, result, notes };
}

// C-01: Estate complexity has increased
const c01: CompoundRule = {
  id: 'C-01',
  title: 'Estate complexity has increased since your estate plan was prepared',
  family: 'Compound',
  professionalTypes: ['Estate Lawyer', 'Accountant'],
  childRuleIds: ['HR-02', 'HR-03', 'HR-04', 'HR-05', 'HR-09', 'HR-13'],
  evaluate: (_ctx, childResults): RuleResult => {
    const firedChildren: string[] = [];
    const evidence: HiddenRiskEvidence[] = [];

    for (const [ruleId, result] of childResults) {
      if (result.state === 'FIRE' || result.state === 'REVIEW') {
        firedChildren.push(ruleId);
        if (result.evidence) evidence.push(...result.evidence);
      }
    }

    if (firedChildren.length < 2) {
      return { state: 'NOT_APPLICABLE', auditItems: [audit('C-01', `only ${firedChildren.length} child findings`, false)] };
    }

    return {
      state: 'FIRE',
      level: 'planning_gap',
      confidence: 'confirmed',
      evidence,
      auditItems: [audit('C-01', `${firedChildren.length} related estate-plan findings: ${firedChildren.join(', ')}`, true)],
      title: 'Estate complexity has increased since your estate plan was prepared.',
      summary: `Multiple aspects of your estate plan may benefit from a coordinated review. The following related findings were identified: ${firedChildren.join(', ')}. A comprehensive review may be more useful than addressing each issue separately.`,
      whyItMatters: 'When multiple estate-plan issues exist together, a coordinated review can address them more effectively than piecemeal updates.',
      suggestedActions: ['Schedule a comprehensive estate plan review with an estate lawyer'],
      professionalTypes: ['Estate Lawyer', 'Accountant'],
      sourceSections: ['wills', 'familyTrusts', 'corporations'],
      notes: `Suppressed children: ${firedChildren.join(', ')}`,
    };
  },
};

// C-02: Personal financial exposure extends beyond reported personal debt
const c02: CompoundRule = {
  id: 'C-02',
  title: 'Personal financial exposure extends beyond reported personal debt',
  family: 'Compound',
  professionalTypes: ['Lawyer', 'Accountant', 'Financial Advisor'],
  childRuleIds: ['HR-20', 'HR-21'],
  evaluate: (_ctx, childResults): RuleResult => {
    const hr21 = childResults.get('HR-21');
    const hr20 = childResults.get('HR-20');

    if (hr21?.state === 'FIRE') {
      return {
        state: 'FIRE',
        level: 'needs_attention',
        confidence: 'confirmed',
        evidence: hr21.evidence || [],
        auditItems: [
          audit('C-02', 'HR-21 fires — aggregating personal exposure', true),
          audit('C-02', 'HR-20 suppressed as child', false, 'HR-20'),
        ],
        title: 'Personal financial exposure extends beyond reported personal debt.',
        summary: hr21.summary,
        whyItMatters: hr21.whyItMatters,
        suggestedActions: hr21.suggestedActions,
        professionalTypes: ['Lawyer', 'Accountant', 'Financial Advisor'],
        sourceSections: hr21.sourceSections,
        relatedObligationIds: hr21.relatedObligationIds,
        notes: 'HR-20 suppressed as child evidence',
      };
    }

    if (hr20?.state === 'FIRE') {
      return {
        state: 'FIRE',
        level: 'needs_attention',
        confidence: 'confirmed',
        evidence: hr20.evidence || [],
        auditItems: [audit('C-02', 'HR-20 fires — trust guarantee exposure', true)],
        title: 'Personal financial exposure extends beyond reported personal debt.',
        summary: hr20.summary,
        whyItMatters: hr20.whyItMatters,
        suggestedActions: hr20.suggestedActions,
        professionalTypes: ['Lawyer', 'Accountant'],
        sourceSections: hr20.sourceSections,
        relatedObligationIds: hr20.relatedObligationIds,
      };
    }

    return { state: 'NOT_APPLICABLE', auditItems: [audit('C-02', 'no personal exposure findings', false)] };
  },
};

// C-03: Family continuity depends on information held by too few people
const c03: CompoundRule = {
  id: 'C-03',
  title: 'Family continuity depends on information or authority concentrated with too few people',
  family: 'Compound',
  professionalTypes: ['Estate Lawyer', 'Accountant'],
  childRuleIds: ['HR-14', 'HR-15', 'HR-16'],
  evaluate: (_ctx, childResults): RuleResult => {
    const dependencies: string[] = [];
    const evidence: HiddenRiskEvidence[] = [];

    for (const [ruleId, result] of childResults) {
      if (result.state === 'FIRE' || result.state === 'REVIEW') {
        if (ruleId === 'HR-14' || ruleId === 'HR-15' || ruleId === 'HR-16') {
          dependencies.push(ruleId);
          if (result.evidence) evidence.push(...result.evidence);
        }
      }
    }

    if (dependencies.length < 2) {
      return { state: 'NOT_APPLICABLE', auditItems: [audit('C-03', `only ${dependencies.length} continuity dependencies`, false)] };
    }

    const level = dependencies.length >= 3 ? 'needs_attention' : 'planning_gap';

    return {
      state: 'FIRE',
      level,
      confidence: 'confirmed',
      evidence,
      auditItems: [audit('C-03', `${dependencies.length} continuity dependencies: ${dependencies.join(', ')}`, true)],
      title: 'Family continuity depends on information or authority concentrated with too few people.',
      summary: `Multiple continuity dependencies exist: ${dependencies.join(', ')}. When key information, access, or authority is concentrated with too few people, it can create significant difficulties during a transition.`,
      whyItMatters: 'Continuity planning that depends on one person for multiple critical functions creates a single point of failure that can disrupt estate administration and business operations.',
      suggestedActions: ['Distribute critical information and access across multiple trusted people', 'Document key information and processes'],
      professionalTypes: ['Estate Lawyer', 'Accountant'],
      sourceSections: ['wills', 'corporations', 'estateTrustees'],
      notes: `Suppressed children: ${dependencies.join(', ')}`,
    };
  },
};

// C-04: Estate plan components may be working from different assumptions
const c04: CompoundRule = {
  id: 'C-04',
  title: 'Estate plan components may be working from different assumptions',
  family: 'Compound',
  professionalTypes: ['Estate Lawyer'],
  childRuleIds: ['HR-09'],
  evaluate: (ctx, childResults): RuleResult => {
    const hr09 = childResults.get('HR-09');
    void ctx;
    if (!hr09 || hr09.state !== 'FIRE') {
      return { state: 'NOT_APPLICABLE', auditItems: [audit('C-04', 'no inconsistency evidence', false)] };
    }

    // C-04 requires an actual unresolved inconsistency, not just blended family
    // Conservative in V1: only fire if HR-09 fires AND legacy intent has potential conflict
    const legacySummary = ctx.answers.get('legacyIntent');
    if (!legacySummary) {
      return { state: 'NOT_APPLICABLE', auditItems: [audit('C-04', 'no legacy intent data for inconsistency check', false)] };
    }

    return {
      state: 'REVIEW',
      level: 'planning_gap',
      confidence: 'requires_confirmation',
      evidence: hr09.evidence || [],
      auditItems: [audit('C-04', 'potential inconsistency between legacy intent and estate documents', 'unknown')],
      title: 'Different parts of your planning appear to describe different outcomes for the same assets.',
      summary: 'Your legacy intentions and estate documents may describe different outcomes for certain assets. Confirming that all components of your plan are aligned may be worthwhile.',
      whyItMatters: 'When different planning components describe different outcomes, the result may not match your intentions for important assets.',
      suggestedActions: ['Review your legacy intentions and estate documents together with an estate lawyer'],
      professionalTypes: ['Estate Lawyer'],
      sourceSections: ['legacyIntent', 'wills'],
    };
  },
};

export const ALL_COMPOUND_RULES: CompoundRule[] = [c01, c02, c03, c04];
