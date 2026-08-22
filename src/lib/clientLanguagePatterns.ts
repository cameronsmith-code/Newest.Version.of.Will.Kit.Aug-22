/**
 * Client-Facing Language Patterns
 *
 * Reusable phrasings that naturally distinguish what is known,
 * what is intended, what is understood, what has been inferred,
 * and what should be professionally confirmed.
 *
 * These are building blocks for the Narrative Engine, not final prose.
 */

import type { EvidenceType, ConfidenceLevel, LimitationImportance } from './outputConfidenceTypes';
import { reviewerPhrase } from './verificationRouter';
import type { ProfessionalAdvisor } from './referentialIntegrity';

/**
 * Opening phrase based on evidence type.
 */
export function sourcePhrase(evidenceType: EvidenceType): string {
  switch (evidenceType) {
    case 'confirmedClientFact':
      return 'Based on what you told us';
    case 'parentPreference':
      return 'You would prefer';
    case 'clientUnderstanding':
      return 'Based on your understanding';
    case 'derivedInterpretation':
      return 'It appears that';
    case 'incompleteInformation':
      return 'We weren\'t given enough information to determine';
    case 'professionalReviewRequired':
      return 'Professional review recommended';
  }
}

/**
 * Limitation phrase for "worth confirming" items.
 */
export function worthConfirmingPhrase(
  whatIsKnown: string,
  whatIsUncertain: string
): string {
  return `Worth confirming: ${whatIsKnown}, but ${whatIsUncertain}.`;
}

/**
 * Professional review phrase.
 */
export function professionalReviewPhrase(
  whatIsKnown: string,
  whatCannotBeConfirmed: string,
  verificationType: string,
  advisor?: ProfessionalAdvisor
): string {
  const reviewer = advisor?.name
    ? reviewerPhrase(verificationType as never, advisor)
    : `a ${verificationType}`;
  return `Professional review recommended: ${whatIsKnown}. ${whatCannotBeConfirmed}. Ask ${reviewer} about this specifically.`;
}

/**
 * Information incomplete phrase.
 */
export function informationIncompletePhrase(
  whatIsMissing: string,
  whyItMatters: string
): string {
  return `Information incomplete: ${whatIsMissing}. ${whyItMatters}.`;
}

/**
 * Full "what we know / what we can't confirm" block.
 */
export function clarifyReviewBlock(
  title: string,
  whatWeKnow: string,
  options?: {
    whyItMatters?: string;
    whatWeCannotConfirm?: string;
    suggestedNextStep?: string;
  }
): { title: string; sections: Array<{ heading: string; body: string }> } {
  const sections: Array<{ heading: string; body: string }> = [
    { heading: 'What we know', body: whatWeKnow },
  ];
  if (options?.whyItMatters) {
    sections.push({ heading: 'Why it matters', body: options.whyItMatters });
  }
  if (options?.whatWeCannotConfirm) {
    sections.push({ heading: 'What we can\'t confirm', body: options.whatWeCannotConfirm });
  }
  if (options?.suggestedNextStep) {
    sections.push({ heading: 'Suggested next step', body: options.suggestedNextStep });
  }
  return { title, sections };
}

/**
 * Map internal confidence to client-facing tone.
 * Never show numeric confidence scores.
 */
export function confidenceTone(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return '';
    case 'moderate':
      return 'likely';
    case 'limited':
      return 'may';
  }
}

/**
 * Map limitation importance to client-facing label.
 */
export const IMPORTANCE_LABELS: Record<LimitationImportance, string> = {
  informational: 'Informational',
  worthConfirming: 'Worth confirming',
  professionalReview: 'Professional review recommended',
  highPriorityReview: 'High priority review',
};

/**
 * General scope statement for report introductions.
 * Keep it human and readable, not legal boilerplate.
 */
export const REPORT_SCOPE_STATEMENT = `About this Roadmap

This Roadmap is built from the information and preferences you provided through the Will Companion Kit. It is designed to organize that information, highlight important planning considerations and help the people you trust understand your intentions.

It does not independently verify your legal documents, account records, tax information or medical information, and it does not replace legal, tax, accounting or medical advice.

Where something is uncertain or requires professional interpretation, we've tried to identify that clearly and point you toward the right next conversation.`;

/**
 * Report-specific scope limitations.
 */
export const REPORT_SPECIFIC_LIMITATIONS: Record<string, string> = {
  guardianshipRoadmap:
    'This Roadmap does not establish legal guardianship and does not override Will or court requirements. Guardian appointments should be confirmed in your estate documents.',
  poaProperty:
    'This output does not determine legal authority under a Power of Attorney document that has not been professionally reviewed.',
  executorGuide:
    'This guide does not replace estate-law or tax advice and does not establish executor authority or obligations.',
  corporateContinuity:
    'This output does not determine corporate, legal or tax consequences of any business succession strategy.',
  hiddenRisks:
    'This report identifies planning considerations based on information you supplied. It is not a legal or tax opinion.',
};
