import type { GuardianshipRoadmapModel } from './guardianshipRoadmapTypes';

export type ValidationFinding = {
  level: 'error' | 'warning';
  message: string;
  childId?: string;
};

const RAW_ID_PATTERNS = [
  /^doctor_\d+$/,
  /^support_\d+$/,
  /^adult_sib_\d+$/,
  /^sibling_\d+$/,
  /^pp_/,
  /^child_\d+$/,
];

function looksLikeRawId(value: string): boolean {
  return RAW_ID_PATTERNS.some(p => p.test(value));
}

export function validateGuardianshipRoadmap(model: GuardianshipRoadmapModel): ValidationFinding[] {
  const findings: ValidationFinding[] = [];

  for (const child of model.children) {
    if (!child.name && !child.nickname) {
      findings.push({ level: 'error', message: `Child at index ${child.index} has no name`, childId: child.childId });
    }

    if (child.status === 'minor' && child.age !== undefined && child.age >= model.family.ageOfMajority) {
      findings.push({ level: 'error', message: `${child.nickname || child.name} classified as minor but age ${child.age} >= age of majority ${model.family.ageOfMajority}`, childId: child.childId });
    }

    if (child.status === 'adult_independent') {
      const assignment = model.guardianAssignments.find(a => a.childIds.includes(child.childId));
      if (assignment) {
        findings.push({ level: 'warning', message: `Adult independent child ${child.nickname || child.name} appears in a guardian assignment`, childId: child.childId });
      }
    }

    if (child.healthcareTransition) {
      for (const provider of child.healthcareTransition.selectedProviders) {
        if (!provider.resolved) {
          findings.push({ level: 'warning', message: `Healthcare provider ID ${provider.id} not resolved for ${child.nickname || child.name}`, childId: child.childId });
        }
      }
    }

    for (const person of child.peopleToKeepClose || []) {
      if (!person.resolved && person.name) {
        findings.push({ level: 'warning', message: `Person to keep close ${person.name} not resolved for ${child.nickname || child.name}`, childId: child.childId });
      }
      if (person.name && looksLikeRawId(person.name)) {
        findings.push({ level: 'error', message: `Raw ID ${person.name} in peopleToKeepClose for ${child.nickname || child.name}`, childId: child.childId });
      }
    }

    for (const conn of child.importantConnections || []) {
      if (conn.name && looksLikeRawId(conn.name)) {
        findings.push({ level: 'error', message: `Raw ID in importantConnection name for ${child.nickname || child.name}`, childId: child.childId });
      }
    }

    for (const support of child.supportTransition || []) {
      if (looksLikeRawId(support.supportTypeLabel)) {
        findings.push({ level: 'error', message: `Raw ID in supportTypeLabel for ${child.nickname || child.name}`, childId: child.childId });
      }
      if (support.currentProvider && looksLikeRawId(support.currentProvider.name)) {
        findings.push({ level: 'error', message: `Raw ID in support provider name for ${child.nickname || child.name}`, childId: child.childId });
      }
    }
  }

  for (const assignment of model.guardianAssignments) {
    for (const id of assignment.guardianPersonIds) {
      if (!assignment.guardianPeople.find(p => p.id === id)) {
        findings.push({ level: 'error', message: `Guardian assignment references nonexistent person ID ${id}` });
      }
    }
    for (const id of assignment.alternatePersonIds) {
      if (!assignment.alternatePeople.find(p => p.id === id)) {
        findings.push({ level: 'error', message: `Alternate guardian assignment references nonexistent person ID ${id}` });
      }
    }
  }

  for (const household of model.guardianHouseholds) {
    for (const id of household.guardianPersonIds) {
      if (!household.guardianPeople.find(p => p.id === id)) {
        findings.push({ level: 'error', message: `Guardian household ${household.id} references nonexistent person ID ${id}` });
      }
    }
  }

  for (const et of model.estateTrustees) {
    if (et.hasEstateTrustee && !et.primaryTrustee?.name) {
      findings.push({ level: 'warning', message: `Estate Trustee for ${et.clientName} marked as having a trustee but no name resolved` });
    }
  }

  for (const doc of model.documents) {
    if (looksLikeRawId(doc.label)) {
      findings.push({ level: 'error', message: `Raw ID in document label: ${doc.label}` });
    }
  }

  for (const action of model.immediateActions) {
    if (looksLikeRawId(action.action)) {
      findings.push({ level: 'error', message: `Raw ID in immediate action: ${action.action}` });
    }
  }

  const actionTexts = new Set<string>();
  for (const action of model.immediateActions) {
    if (actionTexts.has(action.action)) {
      findings.push({ level: 'warning', message: `Duplicate immediate action: ${action.action}` });
    }
    actionTexts.add(action.action);
  }

  const docKeys = new Set<string>();
  for (const doc of model.documents) {
    const key = `${doc.type}_${doc.childId || ''}_${doc.clientId || ''}`;
    if (docKeys.has(key)) {
      findings.push({ level: 'warning', message: `Duplicate document record: ${doc.label}` });
    }
    docKeys.add(key);
  }

  for (const fr of model.financialResources) {
    if (fr.type === 'rdsp' && fr.exists) {
      for (const childId of fr.childIds) {
        const child = model.children.find(c => c.childId === childId);
        if (child && !child.disabled && !child.disabilityUncertain) {
          findings.push({ level: 'warning', message: `RDSP attached to ${child.nickname || child.name} who is not flagged as having a disability` });
        }
      }
    }
  }

  if (model.fundingReviewItems) {
    for (const item of model.fundingReviewItems) {
      if (item.severity === 'reviewRecommended') {
        findings.push({ level: 'warning', message: `Funding review: ${item.description}` });
      }
    }
  }

  if (model.careFundingCoordination && model.fundingPhilosophy) {
    const needsCoordination = model.careFundingCoordination.some(c => c.coordinationNeeded);
    if (needsCoordination && !model.fundingPhilosophy.decisionMakingApproach) {
      findings.push({ level: 'warning', message: 'Guardian and financial decision-maker are different people but no decision-making approach has been documented' });
    }
  }

  // Check for coordination scenarios missing financial decision-makers
  if (model.careFundingCoordination) {
    for (const coord of model.careFundingCoordination) {
      if (coord.financialDecisionMakers.length === 0 && coord.caregiverPersonIds.length > 0) {
        findings.push({ level: 'warning', message: `Coordination scenario ${coord.scenario} for children ${coord.childIds.join(', ')} has no financial decision-maker identified` });
      }
    }
  }

  // Check for duplicate review items
  if (model.reviewItems) {
    const reviewIds = new Set<string>();
    for (const item of model.reviewItems) {
      if (reviewIds.has(item.id)) {
        findings.push({ level: 'warning', message: `Duplicate review item: ${item.id}` });
      }
      reviewIds.add(item.id);
    }

    // Check for professional-review items without a limitation reason
    for (const item of model.reviewItems) {
      if (item.importance === 'professionalReview' && !item.evidence.limitationReason) {
        findings.push({ level: 'warning', message: `Professional review item ${item.id} has no limitation reason` });
      }
    }
  }

  // Check for raw internal IDs leaking into display-facing fields
  if (model.fundingPhilosophy) {
    const fp = model.fundingPhilosophy;
    const displayFields = [
      fp.parentMessageToGuardian,
      fp.parentMessageToFinancialDecisionMaker,
      fp.parentMessageAboutWorkingTogether,
      fp.guardianOwnChildrenFairnessNotes,
      fp.guardianJudgmentNotes,
      fp.workReductionNotes,
    ];
    for (const field of displayFields) {
      if (field && looksLikeRawId(field)) {
        findings.push({ level: 'error', message: `Raw ID in funding philosophy display field: ${field.substring(0, 50)}` });
      }
    }
  }

  // Check for parent preference accidentally represented as confirmed legal fact
  if (model.reviewItems) {
    for (const item of model.reviewItems) {
      if (item.evidence.evidenceType === 'confirmedClientFact' && item.importance === 'professionalReview') {
        findings.push({ level: 'error', message: `Review item ${item.id} marked as confirmedClientFact but tagged for professional review` });
      }
    }
  }

  // Check for contradictory guardian assignments (same child in multiple non-overlapping assignments)
  const childToAssignments = new Map<string, string[]>();
  for (const assignment of model.guardianAssignments) {
    for (const childId of assignment.childIds) {
      const existing = childToAssignments.get(childId) || [];
      existing.push(assignment.id);
      childToAssignments.set(childId, existing);
    }
  }
  for (const [childId, assignmentIds] of childToAssignments) {
    if (assignmentIds.length > 1) {
      findings.push({ level: 'warning', message: `Child ${childId} appears in ${assignmentIds.length} guardian assignments: ${assignmentIds.join(', ')}` });
    }
  }

  return findings;
}
