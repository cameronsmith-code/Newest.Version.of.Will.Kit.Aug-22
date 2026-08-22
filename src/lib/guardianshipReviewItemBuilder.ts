/**
 * Guardianship Review Item Generator
 *
 * Builds ClarifyReviewItems from the GuardianshipRoadmapModel.
 * Pre-computes limitations so the Narrative Engine does not
 * need to reach back into raw questionnaire answers.
 */

import type { ClarifyReviewItem, OutputEvidence, LimitationImportance } from './outputConfidenceTypes';
import type { GuardianshipRoadmapModel } from './guardianshipRoadmapTypes';
import { fundingReviewToClarify } from './clarifyReviewBuilder';
import type { ProfessionalAdvisor } from './referentialIntegrity';

function makeEvidence(
  evidenceType: OutputEvidence['evidenceType'],
  confidence: OutputEvidence['confidence'],
  options?: Partial<OutputEvidence>
): OutputEvidence {
  return { evidenceType, confidence, ...options };
}

function makeReviewItem(
  id: string,
  title: string,
  whatWeKnow: string,
  importance: LimitationImportance,
  evidence: OutputEvidence,
  options?: {
    whyItMatters?: string;
    whatWeCannotConfirm?: string;
    suggestedNextStep?: string;
    verificationType?: ClarifyReviewItem['verificationType'];
  }
): ClarifyReviewItem {
  return {
    id, title, whatWeKnow,
    whyItMatters: options?.whyItMatters,
    whatWeCannotConfirm: options?.whatWeCannotConfirm,
    suggestedNextStep: options?.suggestedNextStep,
    verificationType: options?.verificationType,
    importance, evidence,
  };
}

function guardianLabel(assignment: GuardianshipRoadmapModel['guardianAssignments'][number]): string {
  const names = assignment.guardianPeople.map(p => p.name).filter(Boolean);
  return names.length > 0 ? names.join(' and ') : 'your intended guardian';
}

function checkGuardianMismatch(
  model: GuardianshipRoadmapModel,
  willsAnswers: Record<string, unknown>
): ClarifyReviewItem[] {
  const items: ClarifyReviewItem[] = [];
  const currentWillData = willsAnswers.currentWillData as Record<string, unknown> | undefined;
  const willClients = (currentWillData?.clients as Array<Record<string, unknown>>) || [];

  const willGuardianName = willClients.map(c => String(c.guardianName || '')).find(Boolean);
  if (!willGuardianName) return items;

  const planningNames = model.guardianAssignments.flatMap(a => a.guardianPeople.map(p => p.name)).filter(Boolean);
  if (planningNames.length === 0) return items;

  const willNameLower = willGuardianName.toLowerCase();
  if (!planningNames.some(n => n.toLowerCase() === willNameLower)) {
    items.push(makeReviewItem(
      'conflict_guardian_will_vs_planning',
      'Guardian Appointment Mismatch',
      `Your current Guardianship plan identifies ${planningNames.join(' and ')} as your intended guardian${planningNames.length > 1 ? 's' : ''}, while your understanding of your existing Will identifies ${willGuardianName}.`,
      'highPriorityReview',
      makeEvidence('clientUnderstanding', 'moderate', {
        limitationReason: 'conflictingAnswers',
        verificationRecommended: true,
        verificationType: 'estateLawyer',
      }),
      {
        whyItMatters: 'If your estate documents name a different guardian than your current preference, the legal appointment may not reflect your current wishes.',
        whatWeCannotConfirm: 'The Kit has not reviewed your Will and cannot confirm which guardian is legally appointed.',
        suggestedNextStep: 'Consider confirming which appointment reflects your current wishes and updating your estate documents if necessary.',
        verificationType: 'estateLawyer',
      }
    ));
  }

  return items;
}

function checkGuardianNotAsked(model: GuardianshipRoadmapModel): ClarifyReviewItem[] {
  const items: ClarifyReviewItem[] = [];

  for (const assignment of model.guardianAssignments) {
    if (!assignment.spokenWith || assignment.spokenWith === 'not_yet' || assignment.spokenWith === 'not_sure') {
      const label = guardianLabel(assignment);
      const plural = assignment.guardianPeople.length > 1;
      items.push(makeReviewItem(
        `incomplete_guardian_not_asked_${assignment.id}`,
        'Have the Guardian Conversation',
        `${label} ${plural ? 'are' : 'is'} currently identified as your intended guardian${plural ? 's' : ''}, but the Kit does not have confirmation that you've discussed the role with them.`,
        'worthConfirming',
        makeEvidence('incompleteInformation', 'moderate', {
          limitationReason: 'missingInformation',
        }),
        {
          whyItMatters: 'Your guardian should understand the role, be willing to act, and have the opportunity to ask questions before they are named in your Will.',
          suggestedNextStep: `Discuss the role with ${label} and confirm they are willing to act.`,
        }
      ));
    }
  }

  return items;
}

function checkMissingImportantContacts(model: GuardianshipRoadmapModel): ClarifyReviewItem[] {
  const items: ClarifyReviewItem[] = [];

  for (const child of model.children) {
    if (child.status !== 'minor' || !child.importantConnections) continue;

    for (const conn of child.importantConnections) {
      if (conn.importance === 'especially_important' && !conn.hasContactInfo) {
        const childName = child.nickname || child.name;
        items.push(makeReviewItem(
          `incomplete_contact_${child.childId}_${conn.id}`,
          `Add ${conn.name}'s parent or guardian contact information`,
          `${conn.name} is identified as one of ${childName}'s most important relationships, but no practical parent or guardian contact has been recorded.`,
          'worthConfirming',
          makeEvidence('incompleteInformation', 'moderate', {
            limitationReason: 'missingInformation',
          }),
          {
            whyItMatters: `If ${childName} moves, having a contact could make it much easier for the guardians to help maintain the relationship.`,
            suggestedNextStep: `Add contact details for ${conn.name}'s parent or guardian.`,
          }
        ));
      }
    }
  }

  return items;
}

function checkMissingRecordLocations(model: GuardianshipRoadmapModel): ClarifyReviewItem[] {
  const items: ClarifyReviewItem[] = [];

  for (const child of model.children) {
    if (child.status !== 'minor') continue;
    const childName = child.nickname || child.name;

    if (child.educationTransition?.hasIEP && !child.educationTransition.iepDocumentLocation) {
      items.push(makeReviewItem(
        `incomplete_iep_location_${child.childId}`,
        `Locate ${childName}'s IEP`,
        `${childName}'s IEP was identified, but its current location wasn't provided.`,
        'worthConfirming',
        makeEvidence('incompleteInformation', 'moderate', {
          limitationReason: 'missingDocument',
        }),
        {
          whyItMatters: `This document may be important if ${childName} changes schools. Having it accessible could save time during a transition.`,
          suggestedNextStep: 'Consider keeping an up-to-date copy with other important records.',
        }
      ));
    }

    if (child.healthcareTransition?.carePlanWritten === 'yes' && !child.healthcareTransition.carePlanStored) {
      items.push(makeReviewItem(
        `incomplete_care_plan_${child.childId}`,
        `Locate ${childName}'s care plan`,
        `${childName}'s care plan was identified, but its current location wasn't provided.`,
        'worthConfirming',
        makeEvidence('incompleteInformation', 'moderate', {
          limitationReason: 'missingDocument',
        }),
        {
          whyItMatters: `This document may be important if ${childName} transitions to new caregivers or healthcare providers.`,
          suggestedNextStep: 'Consider keeping an up-to-date copy with other important records.',
        }
      ));
    }
  }

  return items;
}

function checkFundingLegalUncertainty(
  model: GuardianshipRoadmapModel,
  advisors: ProfessionalAdvisor[]
): ClarifyReviewItem[] {
  if (!model.fundingReviewItems) return [];
  return model.fundingReviewItems
    .filter(item => item.severity === 'reviewRecommended')
    .map(item => fundingReviewToClarify(item, model.fundingPhilosophy, advisors));
}

function checkCoordinationGap(model: GuardianshipRoadmapModel): ClarifyReviewItem[] {
  if (!model.careFundingCoordination) return [];
  const needsCoordination = model.careFundingCoordination.some(c => c.coordinationNeeded);
  if (!needsCoordination) return [];
  if (!model.fundingPhilosophy || !model.fundingPhilosophy.decisionMakingApproach) {
    return [makeReviewItem(
      'incomplete_coordination_philosophy',
      'Guardian / Trustee Coordination — Planning Review',
      'The people caring for your children and the people managing the money are different, but no decision-making philosophy has been expressed yet.',
      'worthConfirming',
      makeEvidence('incompleteInformation', 'moderate', {
        limitationReason: 'missingInformation',
      }),
      {
        whyItMatters: 'When the guardian and the financial decision-maker are different people, documenting how they should work together can reduce future ambiguity and conflict.',
        suggestedNextStep: 'Consider documenting how you would want the guardian and the person managing the money to approach spending decisions and disagreements.',
      }
    )];
  }
  return [];
}

function checkStaleEscalationRefs(
  model: GuardianshipRoadmapModel,
  advisors: ProfessionalAdvisor[]
): ClarifyReviewItem[] {
  if (!model.fundingPhilosophy?.escalationPersonIds) return [];
  const activeIds = new Set(advisors.filter(a => a.active).map(a => a.id));
  const stale = model.fundingPhilosophy.escalationPersonIds.filter(id => !activeIds.has(id));
  if (stale.length === 0) return [];
  return [makeReviewItem(
    'unresolved_stale_escalation',
    'Stale Professional Reference in Funding Philosophy',
    'Some professional contacts selected for escalation in your funding philosophy are no longer in your Professional Team.',
    'informational',
    makeEvidence('incompleteInformation', 'limited', {
      limitationReason: 'dataMayBeOutdated',
    }),
    {
      suggestedNextStep: 'Review your escalation contacts and update them if your professional team has changed.',
    }
  )];
}

export function buildGuardianshipLimitations(
  model: GuardianshipRoadmapModel,
  willsAnswers: Record<string, unknown>,
  advisors: ProfessionalAdvisor[]
): import('./guardianshipRoadmapTypes').GuardianshipLimitations {
  const incompleteItems: ClarifyReviewItem[] = [
    ...checkGuardianNotAsked(model),
    ...checkMissingImportantContacts(model),
    ...checkMissingRecordLocations(model),
    ...checkCoordinationGap(model),
  ];

  const professionalReviewItems: ClarifyReviewItem[] = [
    ...checkFundingLegalUncertainty(model, advisors),
    ...checkGuardianMismatch(model, willsAnswers),
  ];

  const conflicts: ClarifyReviewItem[] = [];
  const unresolvedReferences: ClarifyReviewItem[] = [
    ...checkStaleEscalationRefs(model, advisors),
  ];

  return { incompleteItems, professionalReviewItems, conflicts, unresolvedReferences };
}

export function buildAllReviewItems(
  model: GuardianshipRoadmapModel,
  willsAnswers: Record<string, unknown>,
  advisors: ProfessionalAdvisor[]
): ClarifyReviewItem[] {
  const l = buildGuardianshipLimitations(model, willsAnswers, advisors);
  return [...l.incompleteItems, ...l.professionalReviewItems, ...l.conflicts, ...l.unresolvedReferences];
}
