/**
 * Hidden Risk Engine V1 — Individual Rules HR-01 through HR-23
 *
 * Each rule is a pure function that takes a RuleContext and returns a RuleResult.
 * Rules use canonical entity IDs. Name matching is not used for identity.
 * "Unknown" is never treated as "No" — where uncertainty matters, REVIEW is used.
 */

import type { RuleContext, RuleResult, HiddenRiskEvidence, HiddenRiskAuditItem } from './hiddenRiskTypes';
import {
  getWillInfo,
  getChildren,
  getMinorChildren,
  getDependentChildren,
  getCorporations,
  getTrusts,
  getProperties,
  hasForeignProperty,
  getComplexityFactors,
  getSupportObligations,
  getExecutorInfo,
  getGuardianCoordinationGaps,
  getCriticalDocumentLocations,
  getLegacyIntentSummary,
  getGuaranteedObligationsForEntity,
  getAllActiveObligations,
  isSectionCompleted,
  isBlendedFamily,
} from './hiddenRiskSelectors';
import {
  personEvidence,
  trustEvidence,
  corporationEvidence,
  obligationEvidence,
  documentEvidence,
  answerEvidence,
  dateEvidence,
  otherEvidence,
  buildGuaranteedObligationEvidence,
} from './hiddenRiskEvidence';
import type { HiddenRiskRule } from './hiddenRiskTypes';

// ── Family A: Estate Plan Integrity ──

function audit(ruleId: string, condition: string, result: boolean | 'unknown', notes?: string): HiddenRiskAuditItem {
  return { ruleId, condition, result, notes };
}

// HR-01: Core estate documents missing
function hr01(ctx: RuleContext): RuleResult {
  const willsSectionDone = isSectionCompleted(ctx.answers, 'wills');
  const poaSectionDone = isSectionCompleted(ctx.answers, 'powersOfAttorney');
  if (!willsSectionDone && !poaSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-01', 'wills and POA sections not completed', false)] };
  }

  const willInfos = getWillInfo(ctx.answers);
  const findings: HiddenRiskEvidence[] = [];
  const auditItems: HiddenRiskAuditItem[] = [];
  let missingWill = false;
  let missingPoaProperty = false;
  let missingPoaPersonalCare = false;
  let clientName = '';

  for (const will of willInfos) {
    clientName = will.clientName;
    if (willsSectionDone) {
      if (!will.hasWill && !will.hasWillUnknown) {
        missingWill = true;
        findings.push(answerEvidence('Will', 'No', 'wills'));
        auditItems.push(audit('HR-01', `${will.clientName} hasWill == no`, true));
      } else if (will.hasWillUnknown) {
        findings.push(answerEvidence('Will', 'Not sure', 'wills'));
        auditItems.push(audit('HR-01', `${will.clientName} hasWill == unknown`, 'unknown'));
      } else if (will.hasWill) {
        findings.push(answerEvidence('Will', 'Exists', 'wills'));
        auditItems.push(audit('HR-01', `${will.clientName} hasWill == yes`, false));
      }
    }

    if (poaSectionDone) {
      if (!will.hasPoaProperty && !will.hasPoaPropertyUnknown) {
        missingPoaProperty = true;
        findings.push(answerEvidence('POA Property', 'No', 'powersOfAttorney'));
        auditItems.push(audit('HR-01', `${will.clientName} hasPoaProperty == no`, true));
      } else if (will.hasPoaPropertyUnknown) {
        findings.push(answerEvidence('POA Property', 'Not sure', 'powersOfAttorney'));
        auditItems.push(audit('HR-01', `${will.clientName} hasPoaProperty == unknown`, 'unknown'));
      }

      if (!will.hasPoaPersonalCare && !will.hasPoaPersonalCareUnknown) {
        missingPoaPersonalCare = true;
        findings.push(answerEvidence('POA Personal Care', 'No', 'powersOfAttorney'));
        auditItems.push(audit('HR-01', `${will.clientName} hasPoaPersonalCare == no`, true));
      } else if (will.hasPoaPersonalCareUnknown) {
        findings.push(answerEvidence('POA Personal Care', 'Not sure', 'powersOfAttorney'));
        auditItems.push(audit('HR-01', `${will.clientName} hasPoaPersonalCare == unknown`, 'unknown'));
      }
    }
  }

  const missingCount = [missingWill, missingPoaProperty, missingPoaPersonalCare].filter(Boolean).length;
  const hasUnknown = findings.some((e) => e.value === 'Not sure');

  if (missingCount === 0 && !hasUnknown) {
    return { state: 'PASS', evidence: findings, auditItems };
  }

  if (missingCount === 0 && hasUnknown) {
    return {
      state: 'REVIEW',
      level: 'worth_reviewing',
      confidence: 'requires_confirmation',
      evidence: findings,
      auditItems,
      title: `Core estate and incapacity documents may be incomplete for ${clientName}.`,
      summary: `Some core estate documents have an uncertain status for ${clientName}. Confirming whether a Will, Power of Attorney for Property, and Power of Attorney for Personal Care are in place is recommended.`,
      professionalTypes: ['Estate Lawyer'],
      sourceSections: ['wills', 'powersOfAttorney'],
    };
  }

  const missingItems: string[] = [];
  if (missingWill) missingItems.push('Will');
  if (missingPoaProperty) missingItems.push('POA Property');
  if (missingPoaPersonalCare) missingItems.push('POA Personal Care');

  const level = missingWill ? 'needs_attention' : 'planning_gap';

  return {
    state: 'FIRE',
    level,
    confidence: 'confirmed',
    evidence: findings,
    auditItems,
    title: `Core estate and incapacity documents are incomplete for ${clientName}.`,
    summary: `The following core documents are not identified for ${clientName}: ${missingItems.join(', ')}. These documents are fundamental to estate and incapacity planning.`,
    whyItMatters: 'Without a complete set of core estate documents, decisions about property, health care, and estate distribution may not follow your intentions if you become incapacitated or pass away.',
    suggestedActions: ['Confirm which documents are already in place', 'Prepare any missing documents with an estate lawyer'],
    professionalTypes: ['Estate Lawyer'],
    sourceSections: ['wills', 'powersOfAttorney'],
  };
}

// HR-02: Estate plan predates a major life change
function hr02(ctx: RuleContext): RuleResult {
  const willsSectionDone = isSectionCompleted(ctx.answers, 'wills');
  if (!willsSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-02', 'wills section not completed', false)] };
  }

  const willInfos = getWillInfo(ctx.answers);
  const complexity = getComplexityFactors(ctx.answers);

  for (const will of willInfos) {
    if (!will.hasWill || !will.willYear) continue;

    const events: string[] = [];
    const auditItems: HiddenRiskAuditItem[] = [];

    const marriageYear = (ctx.answers.get('aboutYou')?.['marriageYear'] as string) || '';
    if (marriageYear && parseInt(marriageYear, 10) > will.willYear) {
      events.push('marriage or common-law relationship');
      auditItems.push(audit('HR-02', 'marriage after will', true));
    }

    if (complexity.hasMinorChildren) {
      const children = getChildren(ctx.answers);
      const youngest = children.filter((c) => c.isMinor).sort((a, b) => (b.dateOfBirth || '').localeCompare(a.dateOfBirth || ''));
      if (youngest.length > 0 && youngest[0].dateOfBirth) {
        const childYear = new Date(youngest[0].dateOfBirth).getFullYear();
        if (childYear > will.willYear) {
          events.push('birth or adoption of a child');
          auditItems.push(audit('HR-02', 'child born after will', true));
        }
      }
    }

    if (complexity.hasFamilyTrust) {
      const trusts = getTrusts(ctx.answers);
      for (const trust of trusts) {
        if (trust.establishmentYear && trust.establishmentYear > will.willYear) {
          events.push('establishment of a Family Trust');
          auditItems.push(audit('HR-02', `trust ${trust.legalName} established after will`, true));
          break;
        }
      }
    }

    if (complexity.hasPrivateCorpOwnership) {
      events.push('acquisition of private-company ownership');
      auditItems.push(audit('HR-02', 'corporation ownership acquired after will', true));
    }

    if (events.length === 0) {
      auditItems.push(audit('HR-02', 'no major life change after will', false));
      return { state: 'PASS', evidence: [dateEvidence('Will date', String(will.willYear))], auditItems };
    }

    if (will.hasProfessionalReview) {
      auditItems.push(audit('HR-02', 'professional review after event — suppressed', false));
      return {
        state: 'PASS',
        evidence: [dateEvidence('Will date', String(will.willYear)), answerEvidence('Professional review', 'Yes', 'wills')],
        auditItems,
        notes: 'Professional Will review occurred after the relevant change',
      };
    }

    return {
      state: 'FIRE',
      level: 'planning_gap',
      confidence: 'confirmed',
      evidence: [
        dateEvidence('Will date', String(will.willYear)),
        ...events.map((e) => otherEvidence(`Life change after Will: ${e}`)),
      ],
      auditItems,
      title: 'Estate plan predates an important change in your circumstances.',
      summary: `Your Will was prepared in ${will.willYear}. Since then, the following significant changes have occurred: ${events.join(', ')}. Your estate plan may not reflect these changes.`,
      whyItMatters: 'Estate plans that predate major life changes may not account for new family members, new assets, or new planning structures, potentially causing unintended outcomes.',
      suggestedActions: ['Review your Will with an estate lawyer to confirm it reflects your current circumstances'],
      professionalTypes: ['Estate Lawyer'],
      sourceSections: ['wills'],
      affectedEntityIds: [will.clientId === 'client1' ? ctx.client1EntityId : ctx.client2EntityId].filter(Boolean),
    };
  }

  return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-02', 'no will with date found', false)] };
}

// HR-03: Estate complexity has outgrown earlier planning
function hr03(ctx: RuleContext): RuleResult {
  const willsSectionDone = isSectionCompleted(ctx.answers, 'wills');
  if (!willsSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-03', 'wills section not completed', false)] };
  }

  const willInfos = getWillInfo(ctx.answers);
  const complexity = getComplexityFactors(ctx.answers);

  const complexityFactors: string[] = [];
  if (complexity.hasFamilyTrust) complexityFactors.push('Family Trust');
  if (complexity.hasPrivateCorpOwnership) complexityFactors.push('private corporation ownership');
  if (complexity.isBlendedFamily) complexityFactors.push('blended family');
  if (complexity.hasDependentAdult) complexityFactors.push('disabled dependant');
  if (complexity.hasForeignProperty) complexityFactors.push('foreign real property');

  if (complexityFactors.length < 2) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-03', `only ${complexityFactors.length} complexity factors`, false)] };
  }

  for (const will of willInfos) {
    if (!will.hasWill || !will.willYear) continue;

    const events: string[] = [];
    if (complexity.hasFamilyTrust) {
      const trusts = getTrusts(ctx.answers);
      for (const trust of trusts) {
        if (trust.establishmentYear && trust.establishmentYear > will.willYear) {
          events.push('Family Trust');
          break;
        }
      }
    }
    if (complexity.hasPrivateCorpOwnership) events.push('private corporation ownership');
    if (complexity.isBlendedFamily) events.push('blended family');
    if (complexity.hasDependentAdult) events.push('disabled dependant');
    if (complexity.hasForeignProperty) events.push('foreign real property');

    const postWillFactors = events.length;
    if (postWillFactors < 2) {
      return { state: 'PASS', auditItems: [audit('HR-03', `only ${postWillFactors} factors postdate will`, false)] };
    }

    if (will.hasProfessionalReview) {
      return {
        state: 'PASS',
        evidence: [answerEvidence('Professional review', 'Yes', 'wills')],
        auditItems: [audit('HR-03', 'professional review identified — suppressed', false)],
        notes: 'Professional Will review identified',
      };
    }

    return {
      state: 'FIRE',
      level: 'planning_gap',
      confidence: 'confirmed',
      evidence: [
        dateEvidence('Will date', String(will.willYear)),
        ...complexityFactors.map((f) => otherEvidence(`Complexity factor: ${f}`)),
      ],
      auditItems: [audit('HR-03', `${postWillFactors} complexity factors postdate will`, true)],
      title: 'Your financial and family structure has become more complex since your estate plan was prepared.',
      summary: `Your Will was prepared in ${will.willYear}. Since then, multiple complexity factors have developed: ${events.join(', ')}. Your estate plan may not address these structures.`,
      whyItMatters: 'When estate complexity grows beyond what the existing plan anticipated, key structures like trusts, corporations, or blended-family arrangements may not be properly integrated.',
      suggestedActions: ['Review your estate plan with an estate lawyer and accountant to address the new complexity'],
      professionalTypes: ['Estate Lawyer', 'Accountant'],
      sourceSections: ['wills'],
    };
  }

  return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-03', 'no will found', false)] };
}

// HR-04: Will preparation warrants professional review
function hr04(ctx: RuleContext): RuleResult {
  const willsSectionDone = isSectionCompleted(ctx.answers, 'wills');
  if (!willsSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-04', 'wills section not completed', false)] };
  }

  const willInfos = getWillInfo(ctx.answers);
  const complexity = getComplexityFactors(ctx.answers);

  for (const will of willInfos) {
    if (!will.hasWill) continue;

    if (will.willPreparedByLawyer) {
      return { state: 'PASS', evidence: [answerEvidence('Will prepared by lawyer', 'Yes', 'wills')], auditItems: [audit('HR-04', 'will prepared by lawyer', false)] };
    }

    const complexityFactors: string[] = [];
    if (complexity.hasMinorChildren) complexityFactors.push('minor children');
    if (complexity.hasDisabledBeneficiary) complexityFactors.push('disabled dependant');
    if (complexity.hasFamilyTrust) complexityFactors.push('Family Trust');
    if (complexity.hasPrivateCorpOwnership) complexityFactors.push('private corporation');
    if (complexity.isBlendedFamily) complexityFactors.push('blended family');
    if (complexity.hasForeignProperty) complexityFactors.push('foreign real property');

    const level = complexityFactors.length > 0 ? 'planning_gap' : 'worth_reviewing';

    return {
      state: 'FIRE',
      level,
      confidence: will.willPreparedByLawyerUnknown ? 'requires_confirmation' : 'confirmed',
      evidence: [
        answerEvidence('Will prepared by lawyer', will.willPreparedByLawyerUnknown ? 'Not sure' : 'No', 'wills'),
        ...complexityFactors.map((f) => otherEvidence(`Complexity: ${f}`)),
      ],
      auditItems: [audit('HR-04', 'will not prepared by lawyer', true)],
      title: 'Will preparation warrants professional review.',
      summary: `You indicated that the Will${will.willPreparedByLawyerUnknown ? ' may not have' : ' was not'} prepared by a lawyer. That does not by itself mean there is a problem.${complexityFactors.length > 0 ? ` Given ${complexityFactors.join(', ')}, a professional review may help confirm that the document achieves what you intend.` : ''}`,
      whyItMatters: 'A Will that was not professionally prepared may not account for all legal requirements or your specific circumstances, especially when complexity is present.',
      suggestedActions: ['Consider having the Will reviewed by an estate lawyer'],
      professionalTypes: ['Estate Lawyer'],
      sourceSections: ['wills'],
    };
  }

  return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-04', 'no will found', false)] };
}

// HR-05: Jurisdiction / foreign property coordination
function hr05(ctx: RuleContext): RuleResult {
  const willsSectionDone = isSectionCompleted(ctx.answers, 'wills');
  const hasForeign = hasForeignProperty(ctx.answers);
  const willInfos = getWillInfo(ctx.answers);

  const evidence: HiddenRiskEvidence[] = [];
  const auditItems: HiddenRiskAuditItem[] = [];
  let jurisdictionDiffers = false;
  let foreignPropExists = false;

  if (willsSectionDone) {
    for (const will of willInfos) {
      if (will.hasWill && will.willJurisdictionDiffersFromResidence) {
        jurisdictionDiffers = true;
        evidence.push(answerEvidence('Will jurisdiction', will.willJurisdiction, 'wills'));
        auditItems.push(audit('HR-05', 'will jurisdiction differs from residence', true));
      }
    }
  }

  if (hasForeign) {
    foreignPropExists = true;
    const props = getProperties(ctx.answers).filter((p) => p.isForeign);
    for (const p of props) {
      evidence.push(otherEvidence(`Foreign property: ${p.name} (${p.country})`));
    }
    auditItems.push(audit('HR-05', 'foreign real property exists', true));
  }

  if (!jurisdictionDiffers && !foreignPropExists) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-05', 'no jurisdiction mismatch or foreign property', false)] };
  }

  const complexity = getComplexityFactors(ctx.answers);
  const level = (foreignPropExists && !willsSectionDone) || (foreignPropExists && complexity.hasFamilyTrust) ? 'planning_gap' : 'worth_reviewing';

  return {
    state: 'FIRE',
    level,
    confidence: 'confirmed',
    evidence,
    auditItems,
    title: 'Cross-jurisdiction planning may need coordination.',
    summary: foreignPropExists
      ? 'Ownership of property in another country can introduce additional succession, probate, tax and incapacity-planning considerations. It may be worth confirming how your Canadian planning coordinates with the rules where the property is located.'
      : 'Your Will was prepared under a jurisdiction that differs from your current residence. Confirming that your Will remains appropriate for your current jurisdiction may be worthwhile.',
    whyItMatters: 'Different jurisdictions can have different rules for property transfer, probate, and taxation. Without coordination, your planning may not work as intended across borders.',
    suggestedActions: ['Confirm how your planning coordinates across jurisdictions'],
    professionalTypes: ['Estate Lawyer', 'Tax Professional'],
    sourceSections: ['wills', 'realEstate'],
  };
}

// ── Family B: Guardianship & Family Structure ──

// HR-06: Guardianship planning incomplete
function hr06(ctx: RuleContext): RuleResult {
  const childrenSectionDone = isSectionCompleted(ctx.answers, 'children');
  if (!childrenSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-06', 'children section not completed', false)] };
  }

  const minorChildren = getMinorChildren(ctx.answers);
  if (minorChildren.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-06', 'no minor children', false)] };
  }

  const withoutGuardian = minorChildren.filter((c) => !c.proposedGuardianId && !c.proposedGuardianName);
  if (withoutGuardian.length === 0) {
    return { state: 'PASS', evidence: minorChildren.map((c) => personEvidence('', c.name, 'children', 'guardian identified')), auditItems: [audit('HR-06', 'all minor children have guardians', false)] };
  }

  return {
    state: 'FIRE',
    level: 'needs_attention',
    confidence: 'confirmed',
    evidence: withoutGuardian.map((c) => personEvidence('', c.name, 'children', 'no guardian identified')),
    auditItems: [audit('HR-06', `${withoutGuardian.length} minor children without guardian`, true)],
    title: 'Guardianship planning is incomplete.',
    summary: `No proposed guardian has been identified for ${withoutGuardian.map((c) => c.name).join(', ')}. Identifying a guardian is an important part of planning for minor children.`,
    whyItMatters: 'Without a named guardian, a court would determine who cares for your minor children, which may not align with your preferences.',
    suggestedActions: ['Identify a proposed guardian for each minor child', 'Discuss the role with the proposed guardian'],
    professionalTypes: ['Estate Lawyer'],
    sourceSections: ['children'],
  };
}

// HR-07: Proposed guardian has not been approached
function hr07(ctx: RuleContext): RuleResult {
  const childrenSectionDone = isSectionCompleted(ctx.answers, 'children');
  if (!childrenSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-07', 'children section not completed', false)] };
  }

  const minorChildren = getMinorChildren(ctx.answers);
  const withGuardian = minorChildren.filter((c) => c.proposedGuardianId || c.proposedGuardianName);
  if (withGuardian.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-07', 'no guardians identified', false)] };
  }

  const notApproached = withGuardian.filter((c) => c.spokenToGuardian === 'no');
  if (notApproached.length === 0) {
    return { state: 'PASS', evidence: withGuardian.map((c) => personEvidence('', c.name, 'children', 'guardian approached')), auditItems: [audit('HR-07', 'all guardians approached', false)] };
  }

  const guardianGroups = new Map<string, string[]>();
  for (const c of notApproached) {
    const key = c.proposedGuardianName || c.proposedGuardianId || 'unknown';
    if (!guardianGroups.has(key)) guardianGroups.set(key, []);
    guardianGroups.get(key)!.push(c.name);
  }

  return {
    state: 'FIRE',
    level: 'planning_gap',
    confidence: 'confirmed',
    evidence: notApproached.map((c) => personEvidence(c.proposedGuardianId || '', `Guardian: ${c.proposedGuardianName || 'Unknown'} — Child: ${c.name}`, 'children', 'not approached')),
    auditItems: [audit('HR-07', `${notApproached.length} children with unapproached guardians`, true)],
    title: 'Proposed guardian has not been approached.',
    summary: `The proposed guardian for ${notApproached.map((c) => c.name).join(', ')} has not been spoken to about the role. Confirming their willingness is important before relying on them.`,
    whyItMatters: 'A proposed guardian who has not been asked may decline the role, leaving your children without a confirmed caregiver.',
    suggestedActions: ['Discuss the guardian role with each proposed guardian', 'Confirm their willingness to serve'],
    professionalTypes: ['Estate Lawyer'],
    sourceSections: ['children'],
  };
}

// HR-08: Guardian / financial decision-maker coordination is unclear
function hr08(ctx: RuleContext): RuleResult {
  const childrenSectionDone = isSectionCompleted(ctx.answers, 'children');
  if (!childrenSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-08', 'children section not completed', false)] };
  }

  const minorChildren = getMinorChildren(ctx.answers);
  if (minorChildren.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-08', 'no minor children', false)] };
  }

  const gaps = getGuardianCoordinationGaps(ctx.answers);
  if (gaps.length === 0) {
    return { state: 'PASS', auditItems: [audit('HR-08', 'no coordination gaps', false)] };
  }

  return {
    state: 'FIRE',
    level: 'worth_reviewing',
    confidence: 'confirmed',
    evidence: gaps.map((g) => otherEvidence(g.description)),
    auditItems: [audit('HR-08', `${gaps.length} coordination gaps`, true)],
    title: 'Guardian and financial decision-maker coordination is unclear.',
    summary: `The following coordination gaps exist between the proposed guardian and financial decision-maker roles: ${gaps.map((g) => g.description).join('; ')}.`,
    whyItMatters: 'When care and financial roles are held by different people, unclear coordination can create practical difficulties for the people acting on your behalf.',
    suggestedActions: ['Clarify expectations between the guardian and financial decision-maker'],
    professionalTypes: ['Estate Lawyer'],
    sourceSections: ['children'],
  };
}

// HR-09: Blended-family estate coordination
function hr09(ctx: RuleContext): RuleResult {
  if (!isBlendedFamily(ctx.answers)) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-09', 'not a blended family', false)] };
  }

  const complexity = getComplexityFactors(ctx.answers);
  const supportInfo = getSupportObligations(ctx.answers);
  const legacyInfo = getLegacyIntentSummary(ctx.answers);
  const willInfos = getWillInfo(ctx.answers);

  const complexities: string[] = [];
  if (willInfos.some((w) => w.willYear && complexity.hasFamilyTrust)) {
    const trusts = getTrusts(ctx.answers);
    if (trusts.some((t) => t.establishmentYear && willInfos[0]?.willYear && t.establishmentYear > willInfos[0].willYear)) {
      complexities.push('current Will predates relationship');
    }
  }
  if (supportInfo.hasChildSupport || supportInfo.hasSpousalSupport) complexities.push('support obligation');
  if (legacyInfo.hasLegacyIntent) complexities.push('legacy intention involving children');
  if (complexity.hasPrivateCorpOwnership) complexities.push('ownership that may operate outside estate');

  if (complexities.length === 0) {
    return { state: 'PASS', auditItems: [audit('HR-09', 'blended family but no planning complexity', false)] };
  }

  return {
    state: 'FIRE',
    level: 'planning_gap',
    confidence: 'confirmed',
    evidence: complexities.map((c) => otherEvidence(`Complexity: ${c}`)),
    auditItems: [audit('HR-09', `blended family with ${complexities.length} complexity factors`, true)],
    title: 'Blended-family estate coordination may need review.',
    summary: `Your household includes children from a prior relationship, and the following planning complexities are present: ${complexities.join(', ')}. Coordinating your estate plan across both sides of the family is important.`,
    whyItMatters: 'In blended families, estate plans that do not explicitly address both sides of the family can create unintended outcomes for children from prior relationships.',
    suggestedActions: ['Review your estate plan with an advisor to confirm coordination across both sides of the family'],
    professionalTypes: ['Estate Lawyer', 'Financial Advisor'],
    sourceSections: ['previousRelationships', 'wills', 'legacyIntent'],
  };
}

// HR-10: Existing support obligation needs estate review
function hr10(ctx: RuleContext): RuleResult {
  const supportInfo = getSupportObligations(ctx.answers);
  if (!supportInfo.hasChildSupport && !supportInfo.hasSpousalSupport) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-10', 'no support obligations', false)] };
  }

  if (supportInfo.estateTreatmentReviewed) {
    return { state: 'PASS', evidence: [answerEvidence('Estate treatment reviewed', 'Yes', 'previousRelationships')], auditItems: [audit('HR-10', 'estate treatment reviewed', false)] };
  }

  const obligationTypes: string[] = [];
  if (supportInfo.hasChildSupport) obligationTypes.push('child support');
  if (supportInfo.hasSpousalSupport) obligationTypes.push('spousal support');

  return {
    state: 'FIRE',
    level: 'worth_reviewing',
    confidence: 'confirmed',
    evidence: obligationTypes.map((o) => answerEvidence('Support obligation', o, 'previousRelationships')),
    auditItems: [audit('HR-10', 'support obligation without estate review', true)],
    title: 'Existing support obligation may need estate review.',
    summary: `You currently pay ${obligationTypes.join(' and ')}. Whether and how these obligations are addressed in your estate plan has not been identified for review.`,
    whyItMatters: 'Support obligations may have implications for estate planning. Confirming how they are treated can help avoid unexpected outcomes.',
    suggestedActions: ['Discuss the estate treatment of your support obligations with a family or estate lawyer'],
    professionalTypes: ['Family Lawyer', 'Estate Lawyer'],
    sourceSections: ['previousRelationships'],
  };
}

// ── Family C: Disability & Dependant Planning ──

// HR-11: Long-term planning for dependent adult is incomplete
function hr11(ctx: RuleContext): RuleResult {
  const childrenSectionDone = isSectionCompleted(ctx.answers, 'children');
  if (!childrenSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-11', 'children section not completed', false)] };
  }

  const dependentChildren = getDependentChildren(ctx.answers);
  const disabledChildren = getChildren(ctx.answers).filter((c) => c.hasDisability);
  const relevant = [...new Set([...dependentChildren.filter((c) => !c.isMinor), ...disabledChildren])];

  if (relevant.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-11', 'no dependent adults or disabled dependants', false)] };
  }

  const gaps: string[] = [];
  const childrenSection = ctx.answers.get('children') || {};
  if ((childrenSection['dependentCaregiverIdentified'] as string) !== 'yes') gaps.push('caregiver');
  if ((childrenSection['dependentHousingPlanned'] as string) !== 'yes') gaps.push('housing');
  if ((childrenSection['dependentFundingPlanned'] as string) !== 'yes') gaps.push('funding');
  if ((childrenSection['dependentDecisionMakingPlanned'] as string) !== 'yes') gaps.push('decision-making');

  if (gaps.length === 0) {
    return { state: 'PASS', auditItems: [audit('HR-11', 'dependent planning complete', false)] };
  }

  return {
    state: 'FIRE',
    level: gaps.length >= 3 ? 'needs_attention' : 'planning_gap',
    confidence: 'confirmed',
    evidence: relevant.map((c) => personEvidence('', c.name, 'children', `gaps: ${gaps.join(', ')}`)),
    auditItems: [audit('HR-11', `${gaps.length} planning gaps for dependant`, true)],
    title: 'Long-term planning for a dependant is incomplete.',
    summary: `Planning for ${relevant.map((c) => c.name).join(', ')} has gaps in the following areas: ${gaps.join(', ')}. Long-term planning for dependants who need ongoing support is important.`,
    whyItMatters: 'Without comprehensive long-term planning, a dependant who needs ongoing support may not receive the care and resources they need after you are no longer able to provide them.',
    suggestedActions: ['Develop a comprehensive long-term plan covering caregiver, housing, funding, and decision-making'],
    professionalTypes: ['Estate Lawyer', 'Financial Advisor'],
    sourceSections: ['children'],
  };
}

// HR-12: Inheritance / benefit coordination requires review
function hr12(ctx: RuleContext): RuleResult {
  const childrenSectionDone = isSectionCompleted(ctx.answers, 'children');
  if (!childrenSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-12', 'children section not completed', false)] };
  }

  const disabledChildren = getChildren(ctx.answers).filter((c) => c.hasDisability);
  if (disabledChildren.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-12', 'no disabled beneficiaries', false)] };
  }

  const childrenSection = ctx.answers.get('children') || {};
  const receivesMeansTestedSupport = (childrenSection['disabledChildReceivesSupport'] as string) === 'yes';
  const mayReceiveInheritance = (childrenSection['disabledChildMayInherit'] as string) !== 'no';

  if (!receivesMeansTestedSupport && !mayReceiveInheritance) {
    return { state: 'PASS', auditItems: [audit('HR-12', 'no means-tested support or inheritance concern', false)] };
  }

  return {
    state: 'FIRE',
    level: 'planning_gap',
    confidence: receivesMeansTestedSupport ? 'confirmed' : 'requires_confirmation',
    evidence: disabledChildren.map((c) => personEvidence('', c.name, 'children')),
    auditItems: [audit('HR-12', 'disabled beneficiary with potential inheritance/benefit coordination', true)],
    title: 'Inheritance and benefit coordination may require review.',
    summary: `A dependant who receives or may receive means-tested support may also be in line for an inheritance. Coordinating how these interact is important to review.`,
    whyItMatters: 'Direct inheritance may affect eligibility for means-tested support programs. Proper planning can help preserve both the inheritance and the support.',
    suggestedActions: ['Discuss inheritance planning with an estate lawyer and advisor who understands disability benefits'],
    professionalTypes: ['Estate Lawyer', 'Financial Advisor'],
    sourceSections: ['children'],
  };
}

// HR-13: Disability trust / testamentary planning review
function hr13(ctx: RuleContext): RuleResult {
  const childrenSectionDone = isSectionCompleted(ctx.answers, 'children');
  if (!childrenSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-13', 'children section not completed', false)] };
  }

  const disabledChildren = getChildren(ctx.answers).filter((c) => c.hasDisability);
  if (disabledChildren.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-13', 'no disabled beneficiaries', false)] };
  }

  const childrenSection = ctx.answers.get('children') || {};
  const trustPlanningReviewed = (childrenSection['disabledChildTrustPlanningReviewed'] as string) === 'yes';

  if (trustPlanningReviewed) {
    return { state: 'PASS', auditItems: [audit('HR-13', 'trust planning reviewed', false)] };
  }

  return {
    state: 'FIRE',
    level: 'worth_reviewing',
    confidence: 'confirmed',
    evidence: disabledChildren.map((c) => personEvidence('', c.name, 'children')),
    auditItems: [audit('HR-13', 'disabled beneficiary without trust/testamentary planning review', true)],
    title: 'Trust-based or testamentary planning may be worth discussing.',
    summary: `A dependant who may receive a meaningful inheritance has not had trust-based or testamentary planning reviewed. This type of planning can help protect the inheritance and preserve benefit eligibility.`,
    whyItMatters: 'Trust-based or testamentary planning can provide ongoing management of assets for a dependant who may not be able to manage them directly.',
    suggestedActions: ['Discuss trust-based or testamentary planning options with an estate lawyer'],
    professionalTypes: ['Estate Lawyer'],
    sourceSections: ['children'],
  };
}

// ── Family D: Continuity & Access ──

// HR-14: Critical documents may be difficult to locate
function hr14(ctx: RuleContext): RuleResult {
  const docs = getCriticalDocumentLocations(ctx.answers);
  if (docs.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-14', 'no critical documents identified', false)] };
  }

  const missingLocations = docs.filter((d) => !d.locationKnown);
  if (missingLocations.length === 0) {
    return { state: 'PASS', evidence: docs.map((d) => documentEvidence(d.documentType, d.sourceSection, 'location known')), auditItems: [audit('HR-14', 'all critical document locations known', false)] };
  }

  return {
    state: 'FIRE',
    level: 'planning_gap',
    confidence: 'confirmed',
    evidence: missingLocations.map((d) => documentEvidence(d.documentType, d.sourceSection, 'location unknown')),
    auditItems: [audit('HR-14', `${missingLocations.length} critical documents with unknown locations`, true)],
    title: 'Critical documents may be difficult to locate.',
    summary: `The following critical documents have unknown or blank locations: ${missingLocations.map((d) => d.documentType).join(', ')}. Ensuring these documents can be found when needed is important.`,
    whyItMatters: 'If critical documents cannot be located, executors and family members may face delays, costs, or difficulties in carrying out your wishes.',
    suggestedActions: ['Record the location of each critical document', 'Ensure your executor knows where to find them'],
    professionalTypes: ['Estate Lawyer'],
    sourceSections: missingLocations.map((d) => d.sourceSection),
  };
}

// HR-15: Executor may not have practical access
function hr15(ctx: RuleContext): RuleResult {
  const willsSectionDone = isSectionCompleted(ctx.answers, 'wills');
  if (!willsSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-15', 'wills section not completed', false)] };
  }

  const executorInfo = getExecutorInfo(ctx.answers);
  const willInfos = getWillInfo(ctx.answers);

  const accessIssues: string[] = [];
  for (const will of willInfos) {
    if (!will.hasWill) continue;
    const executorKnows = will.clientId === 'client1' ? executorInfo.client1ExecutorKnowsWillLocation : executorInfo.client2ExecutorKnowsWillLocation;
    if (!executorKnows && will.willLocationKnown) {
      accessIssues.push(`Executor does not know Will location for ${will.clientName}`);
    }
  }

  if (accessIssues.length === 0) {
    return { state: 'PASS', auditItems: [audit('HR-15', 'executor has access', false)] };
  }

  return {
    state: 'FIRE',
    level: 'planning_gap',
    confidence: 'confirmed',
    evidence: accessIssues.map((s) => otherEvidence(s)),
    auditItems: [audit('HR-15', `${accessIssues.length} executor access issues`, true)],
    title: 'Executor may not have practical access to critical documents.',
    summary: `While the location of some critical documents is known, the executor may not know where to find them. Practical access is as important as the location itself.`,
    whyItMatters: 'An executor who cannot locate or access critical documents may face significant delays and difficulties in administering the estate.',
    suggestedActions: ['Inform your executor of the location of critical documents', 'Ensure access credentials or professional contacts are shared'],
    professionalTypes: ['Estate Lawyer'],
    sourceSections: ['wills', 'estateTrustees'],
  };
}

// ── Family E: Business Continuity ──

// HR-16: Business continuity depends heavily on one person
function hr16(ctx: RuleContext): RuleResult {
  const corpSectionDone = isSectionCompleted(ctx.answers, 'corporations');
  if (!corpSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-16', 'corporations section not completed', false)] };
  }

  const corps = getCorporations(ctx.answers).filter((c) => c.expectsToContinue);
  if (corps.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-16', 'no corporations expected to continue', false)] };
  }

  let maxFactors = 0;
  let worstCorp = '';
  for (const corp of corps) {
    if (corp.continuityFactors.length > maxFactors) {
      maxFactors = corp.continuityFactors.length;
      worstCorp = corp.legalName;
    }
  }

  if (maxFactors === 0) {
    return { state: 'PASS', auditItems: [audit('HR-16', 'no continuity concentration factors', false)] };
  }

  const level = maxFactors >= 3 ? 'needs_attention' : maxFactors >= 2 ? 'planning_gap' : 'worth_reviewing';

  const worstCorpData = corps.find((c) => c.legalName === worstCorp)!;

  return {
    state: 'FIRE',
    level,
    confidence: 'confirmed',
    evidence: worstCorpData.continuityFactors.map((f) => corporationEvidence('', `${worstCorp}: ${f}`, 'corporations')),
    auditItems: [audit('HR-16', `${maxFactors} continuity factors for ${worstCorp}`, true, worstCorp)],
    title: 'Business continuity depends heavily on one person.',
    summary: `${worstCorp} has ${maxFactors} continuity concentration factor${maxFactors > 1 ? 's' : ''}: ${worstCorpData.continuityFactors.join(', ')}. This means the business may depend heavily on one person for continued operation.`,
    whyItMatters: 'When business operations, signing authority, and key knowledge all rest with one person, the business may face significant disruption if that person becomes incapacitated or passes away.',
    suggestedActions: ['Identify backup signing authority', 'Document key operational information', 'Consider a continuity plan'],
    professionalTypes: ['Accountant', 'Lawyer'],
    sourceSections: ['corporations'],
  };
}

// HR-17: Shareholder agreement missing or uncertain
function hr17(ctx: RuleContext): RuleResult {
  const corpSectionDone = isSectionCompleted(ctx.answers, 'corporations');
  if (!corpSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-17', 'corporations section not completed', false)] };
  }

  const corps = getCorporations(ctx.answers).filter((c) => !c.isSoleShareholder);
  if (corps.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-17', 'no multi-shareholder corporations', false)] };
  }

  const missingSA = corps.filter((c) => !c.hasShareholderAgreement);
  if (missingSA.length === 0) {
    return { state: 'PASS', auditItems: [audit('HR-17', 'all multi-shareholder corps have shareholder agreements', false)] };
  }

  const hasUnknown = missingSA.some((c) => c.shareholderAgreementUnknown);
  const level = hasUnknown ? 'worth_reviewing' : 'planning_gap';

  return {
    state: 'FIRE',
    level,
    confidence: hasUnknown ? 'requires_confirmation' : 'confirmed',
    evidence: missingSA.map((c) => corporationEvidence('', c.legalName, 'corporations')),
    auditItems: [audit('HR-17', `${missingSA.length} corps without shareholder agreement`, true)],
    title: 'Shareholder agreement missing or uncertain.',
    summary: `The following corporations with multiple shareholders do not have a confirmed shareholder agreement: ${missingSA.map((c) => c.legalName).join(', ')}.`,
    whyItMatters: 'A shareholder agreement addresses important matters like governance, transfer restrictions, and buy-sell arrangements. Without one, disputes or unexpected transitions may be harder to manage.',
    suggestedActions: ['Confirm whether a shareholder agreement exists', 'If not, consider preparing one with a lawyer'],
    professionalTypes: ['Lawyer'],
    sourceSections: ['corporations'],
  };
}

// ── Family F: Trust Planning ──

// HR-18: Trust 21-year planning horizon
function hr18(ctx: RuleContext): RuleResult {
  const trustSectionDone = isSectionCompleted(ctx.answers, 'familyTrusts');
  if (!trustSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-18', 'family trusts section not completed', false)] };
  }

  const trusts = getTrusts(ctx.answers);
  if (trusts.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-18', 'no trusts', false)] };
  }

  for (const trust of trusts) {
    if (!trust.establishmentYear) continue;

    const anniversaryYear = trust.establishmentYear + 21;
    const currentYear = new Date().getFullYear();
    const yearsRemaining = anniversaryYear - currentYear;

    if (trust.hasProfessionalReview && yearsRemaining > 5) {
      return { state: 'PASS', auditItems: [audit('HR-18', 'professional review and >5 years remaining', false)] };
    }

    let level: 'planning_opportunity' | 'worth_reviewing' | 'planning_gap';
    if (yearsRemaining > 5) level = 'planning_opportunity';
    else if (yearsRemaining >= 2) level = 'worth_reviewing';
    else level = 'planning_gap';

    if (yearsRemaining < 0 && !trust.hasProfessionalReview) {
      level = 'planning_gap';
    }

    return {
      state: 'FIRE',
      level,
      confidence: 'confirmed',
      evidence: [
        trustEvidence('', trust.legalName, 'familyTrusts'),
        dateEvidence('Establishment year', String(trust.establishmentYear)),
        otherEvidence(`21-year anniversary: ${anniversaryYear}`, `${yearsRemaining} years remaining`),
      ],
      auditItems: [audit('HR-18', `${yearsRemaining} years to 21-year anniversary`, true)],
      title: 'The Trust is approaching an important tax-planning milestone.',
      summary: `The Trust ${trust.legalName} was established in ${trust.establishmentYear}. Many Canadian trusts are subject to deemed-disposition rules at specified intervals, commonly including a 21-year anniversary. The application and available planning depend on the Trust and its assets.`,
      whyItMatters: 'Planning before the 21-year anniversary can help manage potential tax consequences of deemed disposition rules.',
      suggestedActions: ['Discuss the 21-year planning horizon with your accountant or tax lawyer'],
      professionalTypes: ['Accountant', 'Tax Lawyer'],
      sourceSections: ['familyTrusts'],
    };
  }

  return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-18', 'no trust with establishment date', false)] };
}

// HR-19: Trustee exposure requires confirmation
function hr19(ctx: RuleContext): RuleResult {
  const trustSectionDone = isSectionCompleted(ctx.answers, 'familyTrusts');
  if (!trustSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-19', 'family trusts section not completed', false)] };
  }

  const trusts = getTrusts(ctx.answers);

  for (const trust of trusts) {
    if (!trust.hasDebts) continue;
    if (!trust.trusteeClientIds.includes('client1') && !trust.trusteeClientIds.includes('client2')) continue;

    if (trust.hasPersonalGuaranteeOfTrustDebt) {
      return { state: 'PASS', auditItems: [audit('HR-19', 'personal guarantee confirmed — HR-20 will handle', false)] };
    }

    if (trust.trustDebtGuaranteeUnknown) {
      return {
        state: 'REVIEW',
        level: 'worth_reviewing',
        confidence: 'requires_confirmation',
        evidence: [
          trustEvidence('', trust.legalName, 'familyTrusts'),
          otherEvidence('Client is trustee'),
          otherEvidence('Trust has borrowing'),
          otherEvidence('Personal guarantee / recourse: Not sure'),
        ],
        auditItems: [audit('HR-19', 'trustee with trust debt and unknown personal guarantee', 'unknown')],
        title: 'Trustee liability requires confirmation.',
        summary: `You are a trustee of ${trust.legalName}, which has borrowing. Whether there is personal guarantee, recourse, or personal exposure related to this trust debt is not confirmed.`,
        whyItMatters: 'Trustees may have personal exposure for trust obligations in certain circumstances. Confirming the nature of any personal exposure is important for accurate planning.',
        suggestedActions: ['Confirm whether there is any personal guarantee or recourse related to trust borrowing'],
        professionalTypes: ['Lawyer', 'Accountant'],
        sourceSections: ['familyTrusts'],
      };
    }
  }

  return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-19', 'no trust with debt and client as trustee', false)] };
}

// HR-20: Personal guarantee of trust borrowing
function hr20(ctx: RuleContext): RuleResult {
  const trustSectionDone = isSectionCompleted(ctx.answers, 'familyTrusts');
  if (!trustSectionDone) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-20', 'family trusts section not completed', false)] };
  }

  const trusts = getTrusts(ctx.answers);

  for (const trust of trusts) {
    if (!trust.hasPersonalGuaranteeOfTrustDebt) continue;

    // Also check canonical graph for guarantor_of relationship where borrower is a trust
    const trustEntities = ctx.trustEntities.filter((e) => e.displayName === trust.legalName);
    for (const trustEntity of trustEntities) {
      const obligations = getGuaranteedObligationsForEntity(ctx.client1EntityId, ctx.entities, ctx.relationships);
      const trustObligations = obligations.filter((o) => o.borrowerEntityId === trustEntity.id);
      if (trustObligations.length > 0) {
        return {
          state: 'FIRE',
          level: 'needs_attention',
          confidence: 'confirmed',
          evidence: trustObligations.flatMap((o) => buildGuaranteedObligationEvidence(o, ctx.client1Name)),
          auditItems: [audit('HR-20', `client guarantees trust ${trust.legalName} borrowing`, true, trustEntity.id)],
          title: 'Personal guarantee of trust borrowing.',
          summary: `${ctx.client1Name} personally guarantees borrowing of ${trust.legalName}. This creates personal exposure beyond the trust's own liabilities.`,
          whyItMatters: 'A personal guarantee of trust borrowing means the guarantor is personally liable if the trust cannot repay. This exposure does not appear on the personal balance sheet.',
          suggestedActions: ['Review the guarantee terms with a lawyer', 'Consider whether the guarantee can be limited or removed'],
          professionalTypes: ['Lawyer', 'Accountant'],
          sourceSections: ['familyTrusts'],
          relatedObligationIds: trustObligations.map((o) => o.obligationEntityId),
        };
      }
    }

    // Fallback: questionnaire indicates guarantee exists
    return {
      state: 'FIRE',
      level: 'needs_attention',
      confidence: 'confirmed',
      evidence: [
        trustEvidence('', trust.legalName, 'familyTrusts'),
        answerEvidence('Personal guarantee of trust debt', 'Yes', 'familyTrusts'),
      ],
      auditItems: [audit('HR-20', `questionnaire indicates guarantee for ${trust.legalName}`, true)],
      title: 'Personal guarantee of trust borrowing.',
      summary: `${ctx.client1Name} personally guarantees borrowing of ${trust.legalName}. This creates personal exposure beyond the trust's own liabilities.`,
      whyItMatters: 'A personal guarantee of trust borrowing means the guarantor is personally liable if the trust cannot repay.',
      suggestedActions: ['Review the guarantee terms with a lawyer'],
      professionalTypes: ['Lawyer', 'Accountant'],
      sourceSections: ['familyTrusts'],
    };
  }

  return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-20', 'no personal guarantee of trust debt', false)] };
}

// ── Family G: Debt & Cross-Entity Exposure ──

// HR-21: Personal exposure extends beyond personal balance sheet
function hr21(ctx: RuleContext): RuleResult {
  if (!ctx.client1EntityId && !ctx.client2EntityId) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-21', 'no client entity IDs', false)] };
  }

  const clientIds = [ctx.client1EntityId, ctx.client2EntityId].filter(Boolean);
  const allGuaranteedObligations: Array<{ obligation: typeof obligations[number]; guarantorName: string }> = [];
  const obligations = getAllActiveObligations(ctx.entities, ctx.relationships);

  for (const clientId of clientIds) {
    const guaranteed = getGuaranteedObligationsForEntity(clientId, ctx.entities, ctx.relationships);
    const guarantorName = clientId === ctx.client1EntityId ? ctx.client1Name : ctx.client2Name;
    for (const obl of guaranteed) {
      // Only count where borrower is NOT the client themselves
      if (obl.borrowerEntityId !== clientId) {
        allGuaranteedObligations.push({ obligation: obl, guarantorName });
      }
    }
  }

  if (allGuaranteedObligations.length === 0) {
    return { state: 'PASS', auditItems: [audit('HR-21', 'no personal guarantees of non-self obligations', false)] };
  }

  // Deduplicate by obligation entity ID (count each obligation ONCE)
  const seenObligationIds = new Set<string>();
  const uniqueObligations = allGuaranteedObligations.filter((o) => {
    if (seenObligationIds.has(o.obligation.obligationEntityId)) return false;
    seenObligationIds.add(o.obligation.obligationEntityId);
    return true;
  });

  // Aggregate by guarantor
  const byGuarantor = new Map<string, typeof uniqueObligations>();
  for (const item of uniqueObligations) {
    if (!byGuarantor.has(item.guarantorName)) byGuarantor.set(item.guarantorName, []);
    byGuarantor.get(item.guarantorName)!.push(item);
  }

  const findings: HiddenRiskEvidence[] = [];
  const auditItems: HiddenRiskAuditItem[] = [];

  for (const [guarantorName, items] of byGuarantor) {
    const totalAmount = items.reduce((sum, item) => {
      const amt = item.obligation.amount;
      if (amt && !item.obligation.amountUnknown) {
        const parsed = parseFloat(amt.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed)) return sum + parsed;
      }
      return sum;
    }, 0);

    findings.push(personEvidence('', guarantorName, undefined, `${items.length} guaranteed obligation(s)`));
    for (const item of items) {
      findings.push(...buildGuaranteedObligationEvidence(item.obligation, guarantorName));
    }
    auditItems.push(audit('HR-21', `${guarantorName} guarantees ${items.length} obligations totaling ~$${totalAmount}`, true));
  }

  const totalAll = uniqueObligations.reduce((sum, item) => {
    const amt = item.obligation.amount;
    if (amt && !item.obligation.amountUnknown) {
      const parsed = parseFloat(amt.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) return sum + parsed;
    }
    return sum;
  }, 0);

  const guarantorNames = Array.from(byGuarantor.keys());
  const summary = guarantorNames.length === 1
    ? `${guarantorNames[0]} has personally guaranteed approximately $${totalAll.toLocaleString()} across ${uniqueObligations.length} obligation${uniqueObligations.length > 1 ? 's' : ''}. These guarantees create potential personal exposure beyond the liabilities shown on the ordinary personal balance sheet.`
    : `Personal guarantees create approximately $${totalAll.toLocaleString()} of contingent exposure across ${uniqueObligations.length} obligation${uniqueObligations.length > 1 ? 's' : ''}.`;

  return {
    state: 'FIRE',
    level: 'needs_attention',
    confidence: 'confirmed',
    evidence: findings,
    auditItems,
    title: 'Personal exposure extends beyond the personal balance sheet.',
    summary,
    whyItMatters: 'Personal guarantees create contingent liabilities that do not appear as ordinary debt on the personal balance sheet. Understanding the full scope of these commitments is important for accurate financial planning.',
    suggestedActions: ['Review each guarantee to understand the scope and terms', 'Consider whether any guarantees can be limited or restructured'],
    professionalTypes: ['Lawyer', 'Accountant', 'Financial Advisor'],
    sourceSections: ['corporateFinancialConnections', 'familyTrusts'],
    relatedObligationIds: uniqueObligations.map((o) => o.obligation.obligationEntityId),
  };
}

// HR-22: Cross-entity guarantee exposure
function hr22(ctx: RuleContext): RuleResult {
  const obligations = getAllActiveObligations(ctx.entities, ctx.relationships);

  const crossGuarantees: Array<{ obligation: typeof obligations[number]; guarantorEntityId: string; guarantorName: string }> = [];

  for (const obl of obligations) {
    for (const guarantor of obl.guarantors) {
      if (guarantor.entityType === 'corporation' || guarantor.entityType === 'trust') {
        if (guarantor.entityId !== obl.borrowerEntityId) {
          crossGuarantees.push({ obligation: obl, guarantorEntityId: guarantor.entityId, guarantorName: guarantor.displayName });
        }
      }
    }
  }

  if (crossGuarantees.length === 0) {
    return { state: 'PASS', auditItems: [audit('HR-22', 'no cross-entity guarantees', false)] };
  }

  return {
    state: 'FIRE',
    level: 'planning_gap',
    confidence: 'confirmed',
    evidence: crossGuarantees.map((cg) => corporationEvidence(cg.guarantorEntityId, `${cg.guarantorName} guarantees ${cg.obligation.borrowerName}`, 'corporateFinancialConnections')),
    auditItems: [audit('HR-22', `${crossGuarantees.length} cross-entity guarantees`, true)],
    title: 'One part of your structure is supporting borrowing elsewhere in the structure.',
    summary: `A corporation or trust within your structure is guaranteeing borrowing for another entity. This creates cross-entity exposure that is worth reviewing.`,
    whyItMatters: 'Cross-entity guarantees mean that one part of your structure may become liable for the debts of another. Understanding these connections is important for comprehensive risk management.',
    suggestedActions: ['Review cross-entity guarantees with your accountant and lawyer'],
    professionalTypes: ['Accountant', 'Lawyer'],
    sourceSections: ['corporateFinancialConnections'],
    relatedObligationIds: crossGuarantees.map((cg) => cg.obligation.obligationEntityId),
  };
}

// HR-23: Related-party debt requires attention
function hr23(ctx: RuleContext): RuleResult {
  const obligations = getAllActiveObligations(ctx.entities, ctx.relationships);
  const relatedPartyLoans = obligations.filter(
    (o) => o.obligationType === 'shareholder_loan' || o.obligationType === 'intercompany_loan' || o.obligationType === 'related_party_loan'
  );

  if (relatedPartyLoans.length === 0) {
    return { state: 'NOT_APPLICABLE', auditItems: [audit('HR-23', 'no related-party loans', false)] };
  }

  const issues: string[] = [];
  const evidence: HiddenRiskEvidence[] = [];

  for (const loan of relatedPartyLoans) {
    if (!loan.documentLocationLabel) {
      issues.push('supporting documentation missing');
      evidence.push(obligationEvidence(loan));
    }
    if (loan.amountUnknown) {
      issues.push('balance unknown');
      evidence.push(obligationEvidence(loan));
    }
  }

  if (issues.length === 0) {
    return { state: 'PASS', auditItems: [audit('HR-23', 'related-party loans have documentation and amounts', false)] };
  }

  return {
    state: 'FIRE',
    level: 'worth_reviewing',
    confidence: 'confirmed',
    evidence,
    auditItems: [audit('HR-23', `${issues.length} issues with related-party loans`, true)],
    title: 'Related-party debt requires attention.',
    summary: `Related-party loans have the following issues: ${issues.join(', ')}. While related-party loans are common, ensuring they are properly documented and tracked is important.`,
    whyItMatters: 'Related-party loans that lack documentation or have unknown balances can create complications during estate administration or corporate transitions.',
    suggestedActions: ['Ensure related-party loans are properly documented', 'Confirm current balances and terms'],
    professionalTypes: ['Accountant', 'Lawyer'],
    sourceSections: ['corporateFinancialConnections'],
    relatedObligationIds: relatedPartyLoans.map((l) => l.obligationEntityId),
  };
}

// ── Rule Registry ──

export const ALL_RULES: HiddenRiskRule[] = [
  { id: 'HR-01', title: 'Core estate documents missing', family: 'Estate Plan Integrity', professionalTypes: ['Estate Lawyer'], evaluate: hr01 },
  { id: 'HR-02', title: 'Estate plan predates a major life change', family: 'Estate Plan Integrity', professionalTypes: ['Estate Lawyer'], evaluate: hr02 },
  { id: 'HR-03', title: 'Estate complexity has outgrown earlier planning', family: 'Estate Plan Integrity', professionalTypes: ['Estate Lawyer', 'Accountant'], evaluate: hr03 },
  { id: 'HR-04', title: 'Will preparation warrants professional review', family: 'Estate Plan Integrity', professionalTypes: ['Estate Lawyer'], evaluate: hr04 },
  { id: 'HR-05', title: 'Jurisdiction / foreign property coordination', family: 'Estate Plan Integrity', professionalTypes: ['Estate Lawyer', 'Tax Professional'], evaluate: hr05 },
  { id: 'HR-06', title: 'Guardianship planning incomplete', family: 'Guardianship & Family Structure', professionalTypes: ['Estate Lawyer'], evaluate: hr06 },
  { id: 'HR-07', title: 'Proposed guardian has not been approached', family: 'Guardianship & Family Structure', professionalTypes: ['Estate Lawyer'], evaluate: hr07 },
  { id: 'HR-08', title: 'Guardian / financial decision-maker coordination is unclear', family: 'Guardianship & Family Structure', professionalTypes: ['Estate Lawyer'], evaluate: hr08 },
  { id: 'HR-09', title: 'Blended-family estate coordination', family: 'Guardianship & Family Structure', professionalTypes: ['Estate Lawyer', 'Financial Advisor'], evaluate: hr09 },
  { id: 'HR-10', title: 'Existing support obligation needs estate review', family: 'Guardianship & Family Structure', professionalTypes: ['Family Lawyer', 'Estate Lawyer'], evaluate: hr10 },
  { id: 'HR-11', title: 'Long-term planning for dependent adult is incomplete', family: 'Disability & Dependant Planning', professionalTypes: ['Estate Lawyer', 'Financial Advisor'], evaluate: hr11 },
  { id: 'HR-12', title: 'Inheritance / benefit coordination requires review', family: 'Disability & Dependant Planning', professionalTypes: ['Estate Lawyer', 'Financial Advisor'], evaluate: hr12 },
  { id: 'HR-13', title: 'Disability trust / testamentary planning review', family: 'Disability & Dependant Planning', professionalTypes: ['Estate Lawyer'], evaluate: hr13 },
  { id: 'HR-14', title: 'Critical documents may be difficult to locate', family: 'Continuity & Access', professionalTypes: ['Estate Lawyer'], evaluate: hr14 },
  { id: 'HR-15', title: 'Executor may not have practical access', family: 'Continuity & Access', professionalTypes: ['Estate Lawyer'], evaluate: hr15 },
  { id: 'HR-16', title: 'Business continuity depends heavily on one person', family: 'Business Continuity', professionalTypes: ['Accountant', 'Lawyer'], evaluate: hr16 },
  { id: 'HR-17', title: 'Shareholder agreement missing or uncertain', family: 'Business Continuity', professionalTypes: ['Lawyer'], evaluate: hr17 },
  { id: 'HR-18', title: 'Trust 21-year planning horizon', family: 'Trust Planning', professionalTypes: ['Accountant', 'Tax Lawyer'], evaluate: hr18 },
  { id: 'HR-19', title: 'Trustee exposure requires confirmation', family: 'Trust Planning', professionalTypes: ['Lawyer', 'Accountant'], evaluate: hr19 },
  { id: 'HR-20', title: 'Personal guarantee of trust borrowing', family: 'Trust Planning', professionalTypes: ['Lawyer', 'Accountant'], evaluate: hr20 },
  { id: 'HR-21', title: 'Personal exposure extends beyond personal balance sheet', family: 'Debt & Cross-Entity Exposure', professionalTypes: ['Lawyer', 'Accountant', 'Financial Advisor'], evaluate: hr21 },
  { id: 'HR-22', title: 'Cross-entity guarantee exposure', family: 'Debt & Cross-Entity Exposure', professionalTypes: ['Accountant', 'Lawyer'], evaluate: hr22 },
  { id: 'HR-23', title: 'Related-party debt requires attention', family: 'Debt & Cross-Entity Exposure', professionalTypes: ['Accountant', 'Lawyer'], evaluate: hr23 },
];
