/**
 * Hidden Risk Engine V1 — Suppression Hierarchy
 *
 * Determines which findings are primary and which are suppressed.
 * Suppressed findings remain in the audit trail but are not shown
 * in the primary client-facing list.
 */

import type { HiddenRiskFinding, RulePresentationState } from './hiddenRiskTypes';

/**
 * Apply suppression rules based on compound rule results.
 *
 * Rules:
 * - C-01 fires → suppress HR-02 from primary (HR-03 tells the chronology story)
 * - C-02 fires → suppress HR-20 from primary (C-02 aggregates)
 * - C-03 fires → suppress HR-14 and HR-15 from primary
 * - HR-03 fires → suppress HR-02 from primary
 */
export function applySuppression(
  allFindings: HiddenRiskFinding[],
  compoundFindings: HiddenRiskFinding[]
): {
  primaryFindings: HiddenRiskFinding[];
  suppressedFindings: HiddenRiskFinding[];
  presentationStates: RulePresentationState[];
} {
  const presentationStates: RulePresentationState[] = [];
  const suppressedRuleIds = new Set<string>();

  // Determine which compound rules fired
  for (const compound of compoundFindings) {
    if (compound.state !== 'FIRE' && compound.state !== 'REVIEW') continue;

    if (compound.ruleId === 'C-01') {
      suppressedRuleIds.add('HR-02');
    }
    if (compound.ruleId === 'C-02') {
      suppressedRuleIds.add('HR-20');
    }
    if (compound.ruleId === 'C-03') {
      suppressedRuleIds.add('HR-14');
      suppressedRuleIds.add('HR-15');
    }
  }

  // HR-03 suppresses HR-02
  const hr03Fired = allFindings.some((f) => f.ruleId === 'HR-03' && f.state === 'FIRE');
  if (hr03Fired) {
    suppressedRuleIds.add('HR-02');
  }

  // C-01 suppresses HR-02 (already handled above but also check non-compound)
  const c01Fired = compoundFindings.some((f) => f.ruleId === 'C-01' && (f.state === 'FIRE' || f.state === 'REVIEW'));
  if (c01Fired) {
    suppressedRuleIds.add('HR-02');
    suppressedRuleIds.add('HR-04');
  }

  const primaryFindings: HiddenRiskFinding[] = [];
  const suppressedFindings: HiddenRiskFinding[] = [];

  // Add compound findings first (they are primary by definition)
  for (const compound of compoundFindings) {
    if (compound.state === 'FIRE' || compound.state === 'REVIEW') {
      primaryFindings.push(compound);
      presentationStates.push({ ruleId: compound.ruleId, isPrimary: true });
    }
  }

  // Add individual findings, suppressing as needed
  for (const finding of allFindings) {
    if (suppressedRuleIds.has(finding.ruleId)) {
      suppressedFindings.push(finding);
      presentationStates.push({ ruleId: finding.ruleId, isPrimary: false, suppressedBy: findSuppressor(finding.ruleId, compoundFindings, hr03Fired) });
    } else {
      // Don't duplicate if already added as compound
      if (!primaryFindings.some((f) => f.ruleId === finding.ruleId)) {
        primaryFindings.push(finding);
        presentationStates.push({ ruleId: finding.ruleId, isPrimary: true });
      }
    }
  }

  return { primaryFindings, suppressedFindings, presentationStates };
}

function findSuppressor(
  ruleId: string,
  compoundFindings: HiddenRiskFinding[],
  hr03Fired: boolean
): string | undefined {
  if (hr03Fired && ruleId === 'HR-02') return 'HR-03';
  for (const c of compoundFindings) {
    if (c.ruleId === 'C-01' && ruleId === 'HR-02') return 'C-01';
    if (c.ruleId === 'C-01' && ruleId === 'HR-04') return 'C-01';
    if (c.ruleId === 'C-02' && ruleId === 'HR-20') return 'C-02';
    if (c.ruleId === 'C-03' && (ruleId === 'HR-14' || ruleId === 'HR-15')) return 'C-03';
  }
  return undefined;
}

/**
 * Sort primary findings by level, then confidence, then rule order.
 */
export function sortFindings(
  findings: HiddenRiskFinding[],
  levelOrder: Record<string, number>,
  confidenceOrder: Record<string, number>
): HiddenRiskFinding[] {
  return [...findings].sort((a, b) => {
    const levelDiff = (levelOrder[a.level] ?? 99) - (levelOrder[b.level] ?? 99);
    if (levelDiff !== 0) return levelDiff;
    const confDiff = (confidenceOrder[a.confidence] ?? 99) - (confidenceOrder[b.confidence] ?? 99);
    if (confDiff !== 0) return confDiff;
    return a.ruleId.localeCompare(b.ruleId);
  });
}
