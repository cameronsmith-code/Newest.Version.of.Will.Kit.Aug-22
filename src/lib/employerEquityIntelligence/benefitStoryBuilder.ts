/**
 * Employer Equity Intelligence — Stage 5 Consolidation
 *
 * Groups raw intelligence items into one coherent client story per benefit
 * where possible, with priority ordering and supporting evidence.
 *
 * Pure: no React, no state writes, no side effects.
 * Facts persist. Stories derive.
 */

import type {
  EquityIntelligenceItem,
  EquityIntelligenceTopic,
  EquityIntelligenceClassification,
  EquityIntelligenceEvidence,
  EmployerEquityBenefitInput,
  AudienceWording,
} from './employerEquityIntelligenceTypes';

// ── Priority ordering within a benefit ──

const TOPIC_PRIORITY: Record<EquityIntelligenceTopic, number> = {
  option_expiry: 1,
  death_deadline: 2,
  termination_deadline: 3,
  option_expiry_unknown: 4,
  death_treatment_unknown: 5,
  incapacity_treatment_unknown: 6,
  missing_administrator: 7,
  missing_documents: 8,
  beneficiary_unknown: 9,
  termination_treatment_unknown: 10,
  vesting_event: 11,
  retirement_approaching: 12,
  former_employer_benefit: 13,
  serp_review: 14,
  rca_review: 15,
};

// ── Consolidation groups ──
// Topics that fold into a parent story rather than standing alone.

const FORMER_EMPLOYER_CHILDREN: EquityIntelligenceTopic[] = [
  'option_expiry_unknown',
  'missing_administrator',
  'missing_documents',
];

// (death_treatment_unknown and incapacity_treatment_unknown remain standalone)

// ── Story types ──

export type EquityStoryClassification = EquityIntelligenceClassification;

export interface EquityBenefitStory {
  id: string;
  benefitId: string;
  clientId: string;
  employerName: string;
  benefitTypeLabel: string;
  planName?: string;
  // Primary topic drives the headline
  primaryTopic: EquityIntelligenceTopic;
  classification: EquityStoryClassification;
  confidence: string;
  title: string;
  summary: string;
  whyItMatters: string;
  suggestedActions: string[];
  // All evidence from all items in the story
  evidence: EquityIntelligenceEvidence[];
  // All items that were consolidated into this story
  sourceItems: EquityIntelligenceItem[];
  // Topics covered (for dedup checks)
  topics: EquityIntelligenceTopic[];
  // Audience wording from the primary item
  audienceWording?: AudienceWording;
  // Cross-border linking
  crossBorderStoryId?: string;
  hasCrossBorderStory: boolean;
}

// ── Helpers ──

function storyId(benefitId: string): string {
  return `story_${benefitId}`;
}

function sortByPriority(items: EquityIntelligenceItem[]): EquityIntelligenceItem[] {
  return [...items].sort((a, b) => {
    const pa = TOPIC_PRIORITY[a.topic] ?? 99;
    const pb = TOPIC_PRIORITY[b.topic] ?? 99;
    if (pa !== pb) return pa - pb;
    // Secondary: classification urgency
    const ca = a.classification === 'needs_attention' ? 0
      : a.classification === 'operational_instruction' ? 1
      : a.classification === 'worth_reviewing' ? 2
      : 3;
    const cb = b.classification === 'needs_attention' ? 0
      : b.classification === 'operational_instruction' ? 1
      : b.classification === 'worth_reviewing' ? 2
      : 3;
    return ca - cb;
  });
}

function mergeEvidence(items: EquityIntelligenceItem[]): EquityIntelligenceEvidence[] {
  const seen = new Set<string>();
  const merged: EquityIntelligenceEvidence[] = [];
  for (const item of items) {
    for (const ev of item.evidence) {
      const key = `${ev.field}:${ev.label}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(ev);
      }
    }
  }
  return merged;
}

function mergeActions(items: EquityIntelligenceItem[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const item of items) {
    for (const action of item.suggestedActions || []) {
      if (!seen.has(action)) {
        seen.add(action);
        merged.push(action);
      }
    }
  }
  return merged;
}

function highestClassification(items: EquityIntelligenceItem[]): EquityIntelligenceClassification {
  const order: EquityIntelligenceClassification[] = ['needs_attention', 'operational_instruction', 'worth_reviewing', 'planning_opportunity'];
  for (const cls of order) {
    if (items.some((i) => i.classification === cls)) return cls;
  }
  return 'worth_reviewing';
}

function highestConfidence(items: EquityIntelligenceItem[]): string {
  const order = ['confirmed', 'client_reported', 'requires_confirmation'];
  for (const conf of order) {
    if (items.some((i) => i.confidence === conf)) return conf;
  }
  return 'requires_confirmation';
}

// ── Consolidation logic ──

function determineConsolidation(
  items: EquityIntelligenceItem[],
): Map<EquityIntelligenceTopic, EquityIntelligenceItem[]> {
  const groups = new Map<EquityIntelligenceTopic, EquityIntelligenceItem[]>();
  const assigned = new Set<string>();

  // Former employer consolidation: if former_employer_benefit exists,
  // fold its child topics into it
  const formerEmployerItem = items.find((i) => i.topic === 'former_employer_benefit');
  if (formerEmployerItem) {
    const group: EquityIntelligenceItem[] = [formerEmployerItem];
    assigned.add(formerEmployerItem.id);
    for (const childTopic of FORMER_EMPLOYER_CHILDREN) {
      const child = items.find((i) => i.topic === childTopic && !assigned.has(i.id));
      if (child) {
        group.push(child);
        assigned.add(child.id);
      }
    }
    groups.set('former_employer_benefit', group);
  }

  // Remaining items are standalone (each is its own story or grouped by topic)
  for (const item of items) {
    if (assigned.has(item.id)) continue;
    // If multiple items share the same topic, group them
    if (!groups.has(item.topic)) {
      groups.set(item.topic, []);
    }
    groups.get(item.topic)!.push(item);
    assigned.add(item.id);
  }

  return groups;
}

// ── Story builder ──

export interface BenefitStoryInput {
  benefit: EmployerEquityBenefitInput;
  items: EquityIntelligenceItem[];
  crossBorderStoryIds?: Map<string, string>;
}

export function buildBenefitStory(input: BenefitStoryInput): EquityBenefitStory | null {
  const { benefit, items, crossBorderStoryIds } = input;
  if (items.length === 0) return null;

  // Consolidation groups are computed for future per-group story splitting.
  // Currently all items merge into one story per benefit with priority ordering.
  determineConsolidation(items);

  // If there's only one group, produce one story
  // If there are multiple groups, produce one story per group
  // (each group is a coherent sub-story)
  // For now, we produce ONE story per benefit by merging all groups,
  // with the highest-priority group's topic as primary

  const allSorted = sortByPriority(items);
  const primaryItem = allSorted[0];
  const primaryTopic = primaryItem.topic;

  // Build the story from all items
  const classification = highestClassification(items);
  const confidence = highestConfidence(items);
  const evidence = mergeEvidence(items);
  const actions = mergeActions(items);
  const topics = [...new Set(items.map((i) => i.topic))];

  // Check cross-border link
  const cbId = crossBorderStoryIds?.get(benefit.benefitId);
  const hasCrossBorder = !!cbId;

  // Build summary: lead with primary topic, list supporting evidence
  const supportingTopics = topics.filter((t) => t !== primaryTopic);
  const supportingLabel = supportingTopics.length > 0
    ? ` Supporting concerns: ${supportingTopics.map((t) => t.replace(/_/g, ' ')).join(', ')}.`
    : '';

  return {
    id: storyId(benefit.benefitId),
    benefitId: benefit.benefitId,
    clientId: benefit.clientId,
    employerName: benefit.employerName,
    benefitTypeLabel: benefit.benefitTypeLabel,
    planName: benefit.planName,
    primaryTopic,
    classification,
    confidence,
    title: primaryItem.title,
    summary: `${primaryItem.summary}${supportingLabel}`,
    whyItMatters: primaryItem.whyItMatters || '',
    suggestedActions: actions,
    evidence,
    sourceItems: allSorted,
    topics,
    audienceWording: primaryItem.audienceWording,
    crossBorderStoryId: cbId,
    hasCrossBorderStory: hasCrossBorder,
  };
}

// ── Build stories for a set of benefits ──

export interface BuildStoriesInput {
  benefits: EmployerEquityBenefitInput[];
  itemsByBenefit: Map<string, EquityIntelligenceItem[]>;
  crossBorderStoryIds?: Map<string, string>;
}

export function buildAllBenefitStories(input: BuildStoriesInput): EquityBenefitStory[] {
  const stories: EquityBenefitStory[] = [];
  for (const benefit of input.benefits) {
    const items = input.itemsByBenefit.get(benefit.benefitId);
    if (!items || items.length === 0) continue;
    const story = buildBenefitStory({ benefit, items, crossBorderStoryIds: input.crossBorderStoryIds });
    if (story) stories.push(story);
  }
  return stories.sort((a, b) => {
    // Sort by classification urgency
    const order: EquityStoryClassification[] = ['needs_attention', 'operational_instruction', 'worth_reviewing', 'planning_opportunity'];
    const ai = order.indexOf(a.classification);
    const bi = order.indexOf(b.classification);
    if (ai !== bi) return ai - bi;
    // Then by primary topic priority
    const pa = TOPIC_PRIORITY[a.primaryTopic] ?? 99;
    const pb = TOPIC_PRIORITY[b.primaryTopic] ?? 99;
    return pa - pb;
  });
}
