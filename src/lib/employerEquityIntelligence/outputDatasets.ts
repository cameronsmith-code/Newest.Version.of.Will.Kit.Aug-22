/**
 * Employer Equity Intelligence — Stage 5 Output Datasets
 *
 * Read-only datasets prepared for each audience.
 * No branded PDF work. No persisted intelligence.
 * Facts persist. Stories derive.
 *
 * Pure: no React, no state writes, no side effects.
 */

import type {
  EquityIntelligenceClassification,
  EquityIntelligenceEvidence,
} from './employerEquityIntelligenceTypes';
import type { EquityBenefitStory } from './benefitStoryBuilder';

// ── Audience types ──

export type OutputAudience =
  | 'client_summary'
  | 'executor'
  | 'poa_property'
  | 'advisor_planner'
  | 'lawyer_accountant'
  | 'hidden_risk';

export const AUDIENCE_LABELS: Record<OutputAudience, string> = {
  client_summary: 'Client Summary',
  executor: 'Executor',
  poa_property: 'Power of Attorney for Property',
  advisor_planner: 'Advisor / Planner',
  lawyer_accountant: 'Lawyer / Accountant',
  hidden_risk: 'Hidden Risk Integration',
};

// ── Output dataset structure ──

export interface OutputStoryEntry {
  storyId: string;
  benefitId: string;
  employerName: string;
  benefitTypeLabel: string;
  planName?: string;
  classification: EquityIntelligenceClassification;
  title: string;
  // Audience-specific wording
  wording: string;
  // Supporting evidence summary
  evidenceSummary: string[];
  // Suggested actions (audience-filtered)
  actions: string[];
  // Whether this story has a linked cross-border story
  hasCrossBorderLink: boolean;
  crossBorderStoryId?: string;
  // Source items for traceability
  sourceItemIds: string[];
  sourceTopics: string[];
}

export interface OutputDataset {
  audience: OutputAudience;
  audienceLabel: string;
  stories: OutputStoryEntry[];
  totalStories: number;
  byClassification: {
    needsAttention: number;
    operationalInstruction: number;
    worthReviewing: number;
    planningOpportunity: number;
  };
}

// ── Audience-specific wording extraction ──

function getAudienceWording(
  story: EquityBenefitStory,
  audience: OutputAudience,
): string {
  const aw = story.audienceWording;
  if (!aw) return story.summary;

  switch (audience) {
    case 'client_summary':
      return aw.client;
    case 'executor':
      return aw.executor;
    case 'poa_property':
      return aw.poa;
    case 'advisor_planner':
    case 'lawyer_accountant':
      return aw.professional;
    case 'hidden_risk':
      // For hidden risk integration: concise description without client-facing tone
      return `${story.title}. ${story.whyItMatters}`;
    default:
      return aw.client;
  }
}

// ── Audience-specific action filtering ──

function filterActionsForAudience(
  actions: string[],
  audience: OutputAudience,
): string[] {
  if (audience === 'hidden_risk') return [];
  if (audience === 'client_summary') {
    // Client sees only planning-oriented actions, not executor/POA actions
    return actions.filter((a) =>
      !a.toLowerCase().includes('executor') &&
      !a.toLowerCase().includes('power of attorney') &&
      !a.toLowerCase().includes('poa'),
    );
  }
  return actions;
}

// ── Evidence summary ──

function evidenceToSummary(evidence: EquityIntelligenceEvidence[]): string[] {
  return evidence.map((e) => `${e.label}: ${e.value !== undefined ? String(e.value) : 'not provided'}`);
}

// ── Build a single output dataset ──

export function buildOutputDataset(
  stories: EquityBenefitStory[],
  audience: OutputAudience,
): OutputDataset {
  const entries: OutputStoryEntry[] = stories.map((story) => ({
    storyId: story.id,
    benefitId: story.benefitId,
    employerName: story.employerName,
    benefitTypeLabel: story.benefitTypeLabel,
    planName: story.planName,
    classification: story.classification,
    title: story.title,
    wording: getAudienceWording(story, audience),
    evidenceSummary: evidenceToSummary(story.evidence),
    actions: filterActionsForAudience(story.suggestedActions, audience),
    hasCrossBorderLink: story.hasCrossBorderStory,
    crossBorderStoryId: story.crossBorderStoryId,
    sourceItemIds: story.sourceItems.map((i) => i.id),
    sourceTopics: story.topics,
  }));

  const byClassification = {
    needsAttention: entries.filter((e) => e.classification === 'needs_attention').length,
    operationalInstruction: entries.filter((e) => e.classification === 'operational_instruction').length,
    worthReviewing: entries.filter((e) => e.classification === 'worth_reviewing').length,
    planningOpportunity: entries.filter((e) => e.classification === 'planning_opportunity').length,
  };

  return {
    audience,
    audienceLabel: AUDIENCE_LABELS[audience],
    stories: entries,
    totalStories: entries.length,
    byClassification,
  };
}

// ── Build all output datasets ──

export interface AllOutputDatasets {
  clientSummary: OutputDataset;
  executor: OutputDataset;
  poaProperty: OutputDataset;
  advisorPlanner: OutputDataset;
  lawyerAccountant: OutputDataset;
  hiddenRisk: OutputDataset;
}

export function buildAllOutputDatasets(stories: EquityBenefitStory[]): AllOutputDatasets {
  return {
    clientSummary: buildOutputDataset(stories, 'client_summary'),
    executor: buildOutputDataset(stories, 'executor'),
    poaProperty: buildOutputDataset(stories, 'poa_property'),
    advisorPlanner: buildOutputDataset(stories, 'advisor_planner'),
    lawyerAccountant: buildOutputDataset(stories, 'lawyer_accountant'),
    hiddenRisk: buildOutputDataset(stories, 'hidden_risk'),
  };
}

// ── Cross-border linking helper ──
// Given a set of cross-border story candidates that have workplaceBenefitId,
// build a map from benefitId → crossBorderStoryId for linking.

export function buildCrossBorderLinkMap(
  crossBorderCandidates: Array<{ workplaceBenefitId?: string; storyGroupId?: string; id: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of crossBorderCandidates) {
    if (c.workplaceBenefitId && c.storyGroupId) {
      map.set(c.workplaceBenefitId, c.storyGroupId);
    }
  }
  return map;
}

// ── Stale story detection ──
// When an answer changes, stories must be re-derived.
// This function identifies which stories are affected by a benefit change.

export function identifyStaleStories(
  stories: EquityBenefitStory[],
  changedBenefitIds: string[],
): string[] {
  const changed = new Set(changedBenefitIds);
  return stories.filter((s) => changed.has(s.benefitId)).map((s) => s.id);
}
