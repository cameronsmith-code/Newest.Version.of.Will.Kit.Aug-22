/**
 * Clarify Review Builder
 *
 * Converts structured model data (funding review items, readiness gaps,
 * conflicts) into ClarifyReviewItems using the shared evidence/confidence model.
 *
 * This is the bridge between the roadmap model and the future Narrative Engine.
 */

import type {
  ClarifyReviewItem,
  OutputEvidence,
  EvidenceType,
  ConfidenceLevel,
} from './outputConfidenceTypes';
import type { FundingReviewItem, ChildCareFundingPhilosophy } from './guardianshipRoadmapTypes';
import type { VerificationType } from './outputConfidenceTypes';
import { getRecommendedVerificationTypes, reviewerPhrase } from './verificationRouter';
import type { ProfessionalAdvisor } from './referentialIntegrity';

/**
 * Convert a FundingReviewItem into a ClarifyReviewItem
 * with full evidence metadata and structured "what we know / can't confirm" sections.
 */
export function fundingReviewToClarify(
  item: FundingReviewItem,
  philosophy: ChildCareFundingPhilosophy | undefined,
  advisors: ProfessionalAdvisor[]
): ClarifyReviewItem {
  const evidence = buildFundingEvidence(item);
  const verificationTypes = getRecommendedVerificationTypes('estateDocumentFlexibility');
  const primaryVerification = verificationTypes[0];
  const advisor = advisors.find(a =>
    (primaryVerification === 'estateLawyer' || primaryVerification === 'lawyer')
      ? a.type === 'lawyer' && a.active
      : a.active
  );

  return {
    id: `clarify_${item.id}`,
    title: buildFundingTitle(item),
    whatWeKnow: buildFundingWhatWeKnow(item, philosophy),
    whyItMatters: buildFundingWhyItMatters(item) || undefined,
    whatWeCannotConfirm: buildFundingWhatWeCannotConfirm(item) || undefined,
    suggestedNextStep: buildFundingNextStep(item, advisor, primaryVerification) || undefined,
    verificationType: primaryVerification,
    verificationPersonIds: advisor ? [advisor.id] : undefined,
    importance: item.severity === 'reviewRecommended' ? 'professionalReview' : 'informational',
    evidence,
  };
}

function buildFundingEvidence(
  item: FundingReviewItem
): OutputEvidence {
  const evidenceType: EvidenceType = 'parentPreference';
  const confidence: ConfidenceLevel = 'high';

  const limitationReasonMap: Record<string, OutputEvidence['limitationReason']> = {
    housing: 'legalInterpretationRequired',
    workReduction: 'legalInterpretationRequired',
    broadSupport: 'legalInterpretationRequired',
    coordination: 'missingInformation',
    documentation: 'other',
  };

  return {
    evidenceType,
    confidence,
    sourceFieldIds: ['fundingPhilosophyData'],
    limitation: item.description,
    limitationReason: limitationReasonMap[item.category] || 'other',
    verificationRecommended: item.severity === 'reviewRecommended',
    verificationType: 'estateLawyer',
  };
}

function buildFundingTitle(item: FundingReviewItem): string {
  switch (item.category) {
    case 'housing':
      return 'Guardian Household Support — Professional Review';
    case 'workReduction':
      return 'Guardian Work / Income Support — Professional Review';
    case 'broadSupport':
      return 'Broad Guardian Household Support — Professional Review';
    case 'coordination':
      return 'Guardian / Trustee Coordination — Planning Review';
    case 'documentation':
      return 'Record-Keeping Preference';
    default:
      return 'Funding Philosophy Review';
  }
}

function buildFundingWhatWeKnow(
  item: FundingReviewItem,
  philosophy: ChildCareFundingPhilosophy | undefined
): string {
  switch (item.category) {
    case 'housing':
      return philosophy?.housingPreference === 'stronglySupport'
        ? 'You told us that you would want the resources left for your children to help with a larger home if caring for them made that reasonably necessary.'
        : 'You indicated you may want resources to help with housing if caring for the children required it.';
    case 'workReduction':
      return philosophy?.workReductionPreference === 'yes'
        ? 'You would want available resources to help offset the financial impact if a guardian needed to reduce work or make another meaningful financial sacrifice.'
        : 'You indicated resources may help offset a guardian\'s work reduction.';
    case 'broadSupport':
      return 'You would want the resources used generously to support the guardian household so that taking in your children does not create a financial burden.';
    case 'coordination':
      return 'The people caring for your children and the people managing the money are different, but no funding or decision-making philosophy has been expressed yet.';
    case 'documentation':
      return 'You prefer detailed accounting or trustee approval for larger expenses. This is a planning preference, not a risk.';
    default:
      return 'You expressed a funding philosophy preference that may warrant professional review.';
  }
}

function buildFundingWhyItMatters(item: FundingReviewItem): string | undefined {
  switch (item.category) {
    case 'housing':
      return 'Taking additional children into a household may create significant housing needs.';
    case 'workReduction':
      return 'A guardian who reduces work to care for children may experience a meaningful loss of income.';
    case 'broadSupport':
      return 'Using trust or estate resources broadly for the guardian household may require specific trust powers.';
    case 'coordination':
      return 'When the guardian and the financial decision-maker are different people, documenting how they should work together can reduce future ambiguity and conflict.';
    case 'documentation':
      return undefined;
    default:
      return undefined;
  }
}

function buildFundingWhatWeCannotConfirm(item: FundingReviewItem): string | undefined {
  switch (item.category) {
    case 'housing':
      return 'The Kit has not reviewed the legal terms governing the children\'s inheritance and cannot confirm whether or how those resources could be used toward a guardian-owned home.';
    case 'workReduction':
      return 'The Kit has not reviewed your estate documents and cannot confirm whether they permit resources to be used to offset a guardian\'s reduction in work.';
    case 'broadSupport':
      return 'The Kit has not reviewed your trust provisions and cannot confirm whether they provide the flexibility you intend for broad guardian household support.';
    case 'coordination':
      return undefined;
    case 'documentation':
      return undefined;
    default:
      return 'The Kit has not reviewed your estate documents and cannot confirm whether they support this approach.';
  }
}

function buildFundingNextStep(
  item: FundingReviewItem,
  advisor: ProfessionalAdvisor | undefined,
  verificationType: VerificationType
): string | undefined {
  const reviewer = reviewerPhrase(verificationType, advisor);

  switch (item.category) {
    case 'housing':
      return `Discuss this intention with ${reviewer} and confirm whether your estate documents provide the flexibility you want for major guardian-household expenses.`;
    case 'workReduction':
      return `Ask ${reviewer} specifically whether your current estate documents permit resources to be used to offset a guardian\'s loss of income.`;
    case 'broadSupport':
      return `Ask ${reviewer} whether your current trust provisions provide the flexibility you want for broad guardian household support.`;
    case 'coordination':
      return 'Consider documenting how you would want the guardian and the person managing the money to approach spending decisions and disagreements.';
    case 'documentation':
      return undefined;
    default:
      return `Discuss this with ${reviewer}.`;
  }
}

/**
 * Convert all funding review items into ClarifyReviewItems.
 */
export function buildAllFundingClarifyItems(
  reviewItems: FundingReviewItem[] | undefined,
  philosophy: ChildCareFundingPhilosophy | undefined,
  advisors: ProfessionalAdvisor[]
): ClarifyReviewItem[] {
  if (!reviewItems || reviewItems.length === 0) return [];
  return reviewItems
    .filter(item => item.severity === 'reviewRecommended')
    .map(item => fundingReviewToClarify(item, philosophy, advisors));
}
