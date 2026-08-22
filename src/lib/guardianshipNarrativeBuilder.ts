import type { GuardianshipRoadmapModel, GuardianAssignment, GuardianshipChildProfile } from './guardianshipRoadmapTypes';
import type {
  NarrativeBlock,
  NarrativeImportance,
  NarrativeSourceType,
  GuardianshipNarrativeModel,
  GuardianshipChildNarrative,
  ImmediateActionNarrative,
  QuickReferenceItem,
  ReadinessNarrative,
  NarrativeContext,
  GuardianshipAudience,
} from './guardianshipNarrativeTypes';
import { getParentLabel, ALL_AUDIENCES, GUARDIAN_AUDIENCES, LAWYER_AUDIENCES, ACCOUNTANT_AUDIENCES, TRUSTEE_AUDIENCES, CLIENT_PLANNING_AUDIENCES } from './guardianshipNarrativeTypes';
import { humanizeRelationshipTypes, humanizeContexts, interpretContinuityParagraph, humanizeParticipantTypes, humanizeTrustType, humanizeRecordKeeping, humanizeSiblingRole, humanizeSiblingNotResponsible, humanizeEverydayExpenseApproach, humanizeMeaningfulExpenseApproach, humanizeMajorHouseholdApproach, humanizeSharedBenefitPhilosophy, humanizeOverallApproach, humanizeFinancialType, isLowInformationText, humanizeFrequency } from './guardianshipHumanization';

let blockCounter = 0;

function nextBlockId(): string {
  blockCounter++;
  return `nb_${blockCounter}`;
}

function makeBlock(
  ruleId: string,
  type: NarrativeBlock['type'],
  importance: NarrativeImportance,
  sourceType: NarrativeSourceType,
  opts: Partial<NarrativeBlock> & { audiences?: GuardianshipAudience[] } = {},
): NarrativeBlock {
  return {
    id: nextBlockId(),
    ruleId,
    type,
    importance,
    sourceType,
    ...opts,
  };
}

function guardianLabel(a: GuardianAssignment): string {
  return a.householdLabel || a.guardianPeople.map(p => p.name).join(' and ') || 'the intended guardian';
}

function pluralGuardian(a: GuardianAssignment): string {
  return a.isHousehold ? 'guardians' : 'guardian';
}

function moveAdverb(moveStatus: string): string {
  switch (moveStatus) {
    case 'likely': return 'would most likely';
    case 'possible': return 'might';
    case 'unlikely': return 'are not expected to';
    default: return 'may or may not';
  }
}

function communityString(assignment: GuardianAssignment): string {
  return assignment.guardianCommunity || 'their guardian\'s community';
}

function buildFamilyContext(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const blocks: NarrativeBlock[] = [];

  const minorChildren = model.children.filter(c => c.status === 'minor');
  const adultChildren = model.children.filter(c => c.status !== 'minor');

  const childList = minorChildren.map(c => c.nickname || c.name).join(' and ');
  const hasGuardian = model.guardianAssignments.length > 0;

  const parentNames = model.family.clientNames.join(' and ');
  let intro = `${parentNames} prepared this Guardianship Roadmap for `;
  if (minorChildren.length === 1) {
    intro += `${childList}, their minor child.`;
  } else if (minorChildren.length > 1) {
    intro += `${childList}, their minor children.`;
  } else {
    intro += `their family.`;
  }

  if (adultChildren.length > 0) {
    for (const adult of adultChildren) {
      const adultName = adult.nickname || adult.name;
      if (adult.status === 'adult_independent') {
        const ageStr = adult.age !== undefined ? ` is ${adult.age} and` : ' is';
        intro += ` ${adultName}${ageStr} financially independent. ${parentNames} do not currently expect ${adultName} to require significant ongoing care or financial support. ${adultName} remains an important part of the family and may continue to play an important role in the lives of the younger children.`;
      } else {
        intro += ` ${adultName} is an adult and is not subject to guardianship, but is included where relevant to family dynamics.`;
      }
    }
  }

  blocks.push(makeBlock('GUARDIAN-01', 'intro', 'primary', 'knownFact', {
    heading: 'About This Roadmap',
    body: intro,
  audiences: ALL_AUDIENCES,
  }));

  // Guardian intro is handled by buildGuardianPlan which produces per-assignment
  // "Guardian for {childLabel}" blocks. We do NOT duplicate it here.

  if (model.family.provinceOfResidence) {
    const province = model.family.provinceOfResidence;
    blocks.push(makeBlock('GUARDIAN-01', 'context', 'reference', 'knownFact', {
      body: `The family lives in ${province}. The age of majority there is ${model.family.ageOfMajority}.`,
    audiences: [...GUARDIAN_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return blocks;
}

function buildGuardianPlan(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const blocks: NarrativeBlock[] = [];

  for (const assignment of model.guardianAssignments) {
    const gLabel = guardianLabel(assignment);
    const childLabel = assignment.childNames.length > 1
      ? assignment.childNames.join(' and ')
      : assignment.childNames[0];

    // GUARDIAN-01: Who steps in
    blocks.push(makeBlock('GUARDIAN-01', 'context', 'primary', 'parentPreference', {
      heading: `Guardian for ${childLabel}`,
      body: `${parentLabel} intend ${gLabel} to act as ${pluralGuardian(assignment)} for ${childLabel} if they are no longer able to care for ${assignment.childNames.length > 1 ? 'them' : 'him or her'}.`,
      childIds: assignment.childIds,
      personIds: assignment.guardianPersonIds,
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));

    // GUARDIAN-02: Approached and agreed?
    if (assignment.spokenWith === 'yes_agreed') {
      blocks.push(makeBlock('GUARDIAN-02', 'context', 'primary', 'knownFact', {
        body: `${gLabel} ${assignment.isHousehold ? 'have' : 'has'} been asked and ${assignment.isHousehold ? 'have' : 'has'} agreed to act as ${pluralGuardian(assignment)} for ${childLabel}.`,
        childIds: assignment.childIds,
        personIds: assignment.guardianPersonIds,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (assignment.spokenWith === 'yes_not_confirmed') {
      blocks.push(makeBlock('GUARDIAN-02', 'readiness', 'important', 'parentUnderstanding', {
        body: `${parentLabel} have spoken with ${gLabel} but have not yet formally confirmed the arrangement.`,
        childIds: assignment.childIds,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (assignment.spokenWith === 'not_yet') {
      blocks.push(makeBlock('GUARDIAN-02', 'readiness', 'important', 'parentPreference', {
        body: `${gLabel} ${assignment.isHousehold ? 'have' : 'has'} not yet been asked to take on this role. That conversation is an important next step. Part of the purpose of preparing this Roadmap is to make conversations like this easier and, if ${gLabel} ever did need to step in, to give ${assignment.isHousehold ? 'them' : 'him or her'} more than a name in a Will. ${parentLabel} want ${gLabel} to have a practical starting point and a clearer understanding of their wishes.`,
        childIds: assignment.childIds,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (assignment.spokenWith === 'not_sure') {
      blocks.push(makeBlock('GUARDIAN-02', 'readiness', 'important', 'parentUnderstanding', {
        body: `${parentLabel} are not certain whether ${gLabel} ${assignment.isHousehold ? 'have' : 'has'} been approached about this role. This is worth confirming so that ${gLabel} ${assignment.isHousehold ? 'have' : 'has'} the opportunity to understand what would be involved.`,
        childIds: assignment.childIds,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    // GUARDIAN-03: In Will?
    if (assignment.inWill === 'yes') {
      blocks.push(makeBlock('GUARDIAN-03', 'context', 'primary', 'parentUnderstanding', {
        body: `${parentLabel} believe their Will${model.family.clientNames.length > 1 ? 's' : ''} name${model.family.clientNames.length > 1 ? '' : 's'} ${gLabel} as ${pluralGuardian(assignment)} for ${childLabel}.`,
        childIds: assignment.childIds,
      audiences: [...GUARDIAN_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (assignment.inWill === 'no' || assignment.inWill === 'not_sure') {
      blocks.push(makeBlock('GUARDIAN-03', 'readiness', 'important', 'parentUnderstanding', {
        body: `${parentLabel} are not sure whether ${gLabel} ${assignment.isHousehold ? 'are' : 'is'} currently named in their Will. This is worth confirming.`,
        childIds: assignment.childIds,
      audiences: [...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (assignment.inWill === 'no_will') {
      blocks.push(makeBlock('GUARDIAN-05', 'readiness', 'primary', 'knownFact', {
        body: `${parentLabel} do not currently have a Will. The guardian intentions in this document should be reviewed with an estate lawyer to make them legally effective.`,
        childIds: assignment.childIds,
      audiences: [...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    // GUARDIAN-04: Alternate
    if (assignment.alternatePeople.length > 0) {
      const altLabel = assignment.alternatePeople.map(p => p.name).join(' and ');
      blocks.push(makeBlock('GUARDIAN-04', 'context', 'important', 'parentPreference', {
        body: `If ${gLabel} ${assignment.isHousehold ? 'are' : 'is'} unable to act, ${parentLabel} would want ${altLabel} to serve as alternate ${pluralGuardian(assignment)} for ${childLabel}.`,
        childIds: assignment.childIds,
        personIds: assignment.alternatePersonIds,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    // MOVE-01: Likely move
    if (assignment.moveStatus === 'likely' || assignment.moveStatus === 'possible') {
      const moveVerb = moveAdverb(assignment.moveStatus);
      const community = communityString(assignment);
      blocks.push(makeBlock('MOVE-01', 'transition', 'primary', 'derived', {
        heading: assignment.moveStatus === 'likely' ? 'A Likely Move' : 'A Possible Move',
        body: `${parentLabel} expect ${childLabel} ${moveVerb} move to ${community} to live with ${gLabel}. This would mean establishing a new daily life in a new community.`,
        childIds: assignment.childIds,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));

      // MOVE-03: Cross-province / cross-border
      if (assignment.isCrossBorder) {
        blocks.push(makeBlock('MOVE-03', 'transition', 'important', 'derived', {
          body: `This move would cross an international border. Guardianship, healthcare, and school arrangements may be affected by the difference in legal systems.`,
          childIds: assignment.childIds,
        audiences: [...GUARDIAN_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
        }));
      } else if (assignment.isCrossProvince) {
        blocks.push(makeBlock('MOVE-03', 'transition', 'important', 'derived', {
          body: `This move would be to a different province. Age of majority, healthcare systems, and education rules may differ between provinces.`,
          childIds: assignment.childIds,
        audiences: [...GUARDIAN_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
        }));
      }
    }

    // Parent voice: guardian notes
    if (assignment.notes) {
      blocks.push(makeBlock('PARENT-VOICE-01', 'parentVoice', 'important', 'parentPreference', {
        body: assignment.notes,
        childIds: assignment.childIds,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  return blocks;
}

function buildChildIntroduction(child: GuardianshipChildProfile, ctx: NarrativeContext): NarrativeBlock[] {
  const blocks: NarrativeBlock[] = [];
  const name = child.nickname || child.name;
  const { parentLabel } = ctx;

  let intro = `${name} is ${child.age !== undefined ? `${child.age} years old` : 'a minor'}`;
  if (child.status === 'minor') {
    intro += ` and would be subject to guardianship`;
  }
  intro += `.`;

  if (child.planningFocus && child.planningFocus !== 'Minor') {
    const focusMap: Record<string, string> = {
      'Minor — ongoing support needs': `${name} has ongoing support needs that are part of daily life.`,
      'Minor — support needs being assessed': `${name}'s support needs are still being assessed.`,
      'Adult — ongoing support needs': `${name} is an adult with ongoing support needs.`,
      'Adult — may need support': `${name} is an adult who may need support.`,
    };
    const focusText = focusMap[child.planningFocus];
    if (focusText) intro += ` ${focusText}`;
  }

  blocks.push(makeBlock('GUARDIAN-01', 'intro', 'primary', 'knownFact', {
    heading: name,
    body: intro,
    childIds: [child.childId],
  audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
  }));

  // Parent voice: what parents want you to know
  const pp = child.personalProfile;
  if (pp) {
    const voiceParts: string[] = [];
    if (pp.communicationStyle) voiceParts.push(`How ${name} communicates: ${pp.communicationStyle}`);
    if (pp.emotionalExpression) voiceParts.push(`How ${name} expresses emotions: ${pp.emotionalExpression}`);
    if (pp.comfortStrategies) voiceParts.push(`What helps ${name} feel safe: ${pp.comfortStrategies}`);
    if (pp.importantRoutines) voiceParts.push(`Important routines: ${pp.importantRoutines}`);
    if (pp.behaviouralConsiderations) voiceParts.push(`Behavioural considerations: ${pp.behaviouralConsiderations}`);

    if (voiceParts.length > 0) {
      blocks.push(makeBlock('PARENT-VOICE-01', 'parentVoice', 'primary', 'parentPreference', {
        heading: `What ${parentLabel} want you to know about ${name}`,
        body: voiceParts.join('\n\n'),
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    if (pp.transitionEasier || pp.missedMost || pp.feelConnected) {
      const transitionParts: string[] = [];
      if (pp.transitionEasier) transitionParts.push(`What would make transition easier: ${pp.transitionEasier}`);
      if (pp.missedMost) transitionParts.push(`What ${name} would miss most: ${pp.missedMost}`);
      if (pp.feelConnected) transitionParts.push(`What could help ${name} feel connected: ${pp.feelConnected}`);

      blocks.push(makeBlock('PARENT-VOICE-01', 'parentVoice', 'important', 'parentPreference', {
        heading: `Helping ${name} through transition`,
        body: transitionParts.join('\n\n'),
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  return blocks;
}

function buildEducationBlocks(child: GuardianshipChildProfile, ctx: NarrativeContext): NarrativeBlock[] {
  const et = child.educationTransition;
  if (!et) return [];

  const blocks: NarrativeBlock[] = [];
  const name = child.nickname || child.name;
  const { parentLabel } = ctx;
  const assignment = ctx.model.guardianAssignments.find(a => a.childIds.includes(child.childId));
  const moveLikely = assignment?.moveStatus === 'likely' || assignment?.moveStatus === 'possible';

  // SCHOOL-01: School as transition resource
  if (moveLikely && (et.schoolChangeExpected === 'yes_most_likely' || et.schoolChangeExpected === 'possibly')) {
    const schoolName = et.schoolName ? `${et.schoolName}` : 'their current school';
    blocks.push(makeBlock('SCHOOL-01', 'transition', 'important', 'derived', {
      heading: 'School',
      body: `${name} will likely attend a new school after moving to ${assignment?.guardianCommunity || 'the guardian\'s community'}. ${name}'s current school, ${schoolName}, is included as a starting point for transferring academic history, learning supports, and other information to the new school.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));

    // Future-use temporal guidance
    blocks.push(makeBlock('SCHOOL-01', 'transition', 'important', 'derived', {
      body: `Circumstances may have changed significantly between the date this Roadmap was prepared and the day it is ever needed. Reaching out to ${name}'s current school can provide a valuable current perspective on how ${name} is doing academically, socially and emotionally, what supports are working, and what a new school should understand. The school's contact information can be found later in this Roadmap.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  } else if (et.schoolName) {
    blocks.push(makeBlock('SCHOOL-01', 'context', 'important', 'knownFact', {
      heading: 'School',
      body: `${name} currently attends ${et.schoolName}.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // SCHOOL-02: IEP and learning supports
  if (et.hasIEP && et.iepDetails) {
    blocks.push(makeBlock('SCHOOL-02', 'transition', 'important', 'knownFact', {
      heading: 'Learning Supports',
      body: `${name} currently has learning supports in place. ${name}'s current IEP and related records can help the new school understand the accommodations rather than starting from zero.`,
      bullets: [et.iepDetails],
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));

    if (et.iepDocumentLocation) {
      blocks.push(makeBlock('SCHOOL-02', 'crossReference', 'reference', 'knownFact', {
        body: `The IEP document is located at: ${et.iepDocumentLocation}.`,
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  // SCHOOL-03: Education records location
  if (et.recordLocation) {
    blocks.push(makeBlock('SCHOOL-03', 'crossReference', 'reference', 'knownFact', {
      body: `Education records for ${name} are at: ${et.recordLocation}.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Parent voice: school notes
  if (et.learningStyleNotes || et.schoolFocusHelps || et.schoolExtraSupport) {
    const parts: string[] = [];
    if (et.learningStyleNotes) parts.push(et.learningStyleNotes);
    if (et.schoolFocusHelps) parts.push(et.schoolFocusHelps);
    if (et.schoolExtraSupport) parts.push(et.schoolExtraSupport);
    blocks.push(makeBlock('PARENT-VOICE-01', 'parentVoice', 'important', 'parentPreference', {
      heading: `What helps ${name} at school`,
      body: parts.join('\n\n'),
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Parent voice: new school notes
  if (et.newSchoolNotes) {
    blocks.push(makeBlock('PARENT-VOICE-01', 'parentVoice', 'important', 'parentPreference', {
      body: `${parentLabel}'s notes about a new school: ${et.newSchoolNotes}`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // EDUCATION-02: Current educational setting interpretation
  if (et.settingType && et.settingType !== 'not_attending') {
    const SETTING_LABELS: Record<string, string> = {
      public: 'a public school',
      catholic: 'a Catholic or other publicly funded school',
      private: 'a private school',
      specialized_therapeutic: 'a specialized or therapeutic school or program',
      homeschool: 'a homeschool arrangement',
      other: et.settingTypeDetails || 'another type of educational setting',
    };
    const settingLabel = SETTING_LABELS[et.settingType] || et.settingType;

    blocks.push(makeBlock('EDUCATION-02', 'context', 'important', 'knownFact', {
      heading: 'Current Educational Setting',
      body: `${name} currently attends ${settingLabel}.`,
      childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));

    // Setting reasons
    const REASON_LABELS: Record<string, string> = {
      academic_preference: 'academic preference',
      learns_better: `${name} learns better in this environment`,
      disability_support: 'disability or additional support needs',
      specialized_programming: 'specialized programming',
      smaller_class: 'smaller class size or additional individual attention',
      religious_cultural: 'religious or cultural reasons',
      social_continuity: 'social or community continuity',
      family_preference: 'family preference',
      location_practical: 'location or practical reasons',
    };
    const reasons = (et.settingReasons || []).filter(r => r !== 'other');
    if (reasons.length > 0) {
      const reasonLabels = reasons.map(r => REASON_LABELS[r] || r.replace(/_/g, ' '));
      const reasonList = reasonLabels.length === 1 ? reasonLabels[0] : reasonLabels.length === 2 ? `${reasonLabels[0]} and ${reasonLabels[1]}` : `${reasonLabels.slice(0, -1).join(', ')}, and ${reasonLabels[reasonLabels.length - 1]}`;
      const isDisability = reasons.includes('disability_support');

      if (isDisability) {
        blocks.push(makeBlock('EDUCATION-02', 'context', 'important', 'parentPreference', {
          body: `${parentLabel} chose this setting for ${name} because of ${reasonList}. ${parentLabel} consider this setting to be part of the support ${name} receives, rather than simply a schooling preference.`,
          childIds: [child.childId],
          audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
        }));
      } else {
        blocks.push(makeBlock('EDUCATION-02', 'context', 'important', 'parentPreference', {
          body: `${parentLabel} chose this setting for ${name} because of ${reasonList}.`,
          childIds: [child.childId],
          audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
        }));
      }
    }

    if (et.settingReasonsOther && !isLowInformationText(et.settingReasonsOther)) {
      blocks.push(makeBlock('EDUCATION-02', 'parentVoice', 'supporting', 'parentPreference', {
        body: et.settingReasonsOther,
        childIds: [child.childId],
        audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    if (et.settingReasonsNotes && !isLowInformationText(et.settingReasonsNotes)) {
      blocks.push(makeBlock('EDUCATION-02', 'parentVoice', 'important', 'parentPreference', {
        heading: 'In Their Own Words',
        body: et.settingReasonsNotes,
        childIds: [child.childId],
        audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  // EDUCATION-03: Need vs preference — continuation importance
  if (et.educationImportance) {
    const IMPORTANCE_BODIES: Record<string, string> = {
      essential_support: `${parentLabel} consider this setting, or an equivalent level of support, important to ${name}'s disability, health, learning or wellbeing. If circumstances allow, preserving an equivalent level of educational support would be important to them. They recognize that the specific school, program or location may change over time. Their priority is the level of support ${name} receives, not necessarily the name of the institution.`,
      strong_preference: `${parentLabel} would very much like this type of education to continue, but recognize circumstances could change. They would want ${name}'s existing educational opportunity preserved where resources allow.`,
      preference_with_flexibility: `${parentLabel} value this arrangement, but would want the Guardian to consider what makes sense for their family and for ${name} at that time.`,
      no_strong_preference: `${parentLabel} trust the Guardian to decide what educational environment makes the most sense for ${name}.`,
      unsure: `${parentLabel} have not fully decided how strongly they feel about this. It may be worth discussing.`,
    };
    const body = IMPORTANCE_BODIES[et.educationImportance];
    if (body) {
      blocks.push(makeBlock('EDUCATION-03', 'context', 'important', 'parentPreference', {
        heading: 'How Important Is This Setting?',
        body,
        childIds: [child.childId],
        audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    if (et.educationImportanceDetails && et.educationImportance === 'other' && !isLowInformationText(et.educationImportanceDetails)) {
      blocks.push(makeBlock('EDUCATION-03', 'parentVoice', 'important', 'parentPreference', {
        body: et.educationImportanceDetails,
        childIds: [child.childId],
        audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  // EDUCATION-04: Education-specific fairness
  const ef = child.educationFairness;
  if (ef && ef.principles && ef.principles.length > 0) {
    const FAIRNESS_BODIES: Record<string, string> = {
      preserve_if_need_based: `If the difference is important to ${name}'s disability, learning, health or wellbeing, ${parentLabel} would want that support prioritized where reasonably possible.`,
      preserve_if_resources_allow: `${parentLabel} would like ${name}'s existing educational opportunity preserved where resources allow.`,
      balance_with_guardian_family: `${parentLabel} would want the Guardian to consider how the arrangement affects all of the children and the household.`,
      guardian_discretion: `${parentLabel} trust the Guardian to make the decision that makes the most sense at the time.`,
      guardian_trustee_discussion: `${parentLabel} would want the Guardian and Trustee to discuss a significant schooling decision together.`,
    };
    const fairnessBodies = (ef.principles.filter(p => p !== 'other')).map(p => FAIRNESS_BODIES[p]).filter(Boolean);
    if (fairnessBodies.length > 0) {
      blocks.push(makeBlock('EDUCATION-04', 'context', 'important', 'parentPreference', {
        heading: 'If Schooling Is Materially Different',
        body: `If ${name}'s schooling were materially different from the schooling available to the Guardian's own children, ${parentLabel} would want that considered. ${fairnessBodies.join(' ')}`,
        childIds: [child.childId],
        audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES, ...TRUSTEE_AUDIENCES],
      }));
    }

    if (ef.principlesOther && !isLowInformationText(ef.principlesOther)) {
      blocks.push(makeBlock('EDUCATION-04', 'parentVoice', 'important', 'parentPreference', {
        heading: 'In Their Own Words',
        body: ef.principlesOther,
        childIds: [child.childId],
        audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  return blocks;
}

function buildHealthcareBlocks(child: GuardianshipChildProfile): NarrativeBlock[] {
  const ht = child.healthcareTransition;
  if (!ht) return [];

  const blocks: NarrativeBlock[] = [];
  const name = child.nickname || child.name;

  // HEALTH-01: Current providers as transition resources
  if (ht.providers.length > 0) {
    blocks.push(makeBlock('HEALTH-01', 'transition', 'important', 'knownFact', {
      heading: 'Healthcare',
      body: `${name}'s current care team knows ${name}'s history. If care moves closer to the guardians' home, these professionals can be useful starting points for transferring records, current treatment information, and relevant referrals.`,
      bullets: ht.providers.filter(p => p.name).map(p => `${p.name} — ${p.role}${p.phone ? `, ${p.phone}` : ''}`),
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));

    // Future-use temporal guidance for healthcare
    blocks.push(makeBlock('HEALTH-01', 'transition', 'important', 'derived', {
      body: `Circumstances may have changed between the date this Roadmap was prepared and the day it is ever needed. Contacting ${name}'s current providers can help establish ${name}'s current condition, medications, treatment, recent history, support needs, and any transfer or referral needs. The providers listed here are the current starting point, not necessarily the future providers.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // HEALTH-02: Medications
  if (ht.hasMedications && ht.medications.length > 0) {
    blocks.push(makeBlock('HEALTH-02', 'transition', 'primary', 'knownFact', {
      heading: 'Medications',
      body: `${name} currently takes medication that should be continued and managed carefully.`,
      bullets: ht.medications.map(m => `${m.name} — treats ${m.treats}${m.prescribedBy ? `, prescribed by ${m.prescribedBy}` : ''}`),
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // HEALTH-03: Allergies
  if (ht.hasAllergies && ht.allergies.length > 0) {
    blocks.push(makeBlock('HEALTH-03', 'transition', 'primary', 'knownFact', {
      heading: 'Allergies',
      body: `${name} has allergies that must be communicated to new caregivers and schools.`,
      bullets: ht.allergies.map(a => `${a.details} — severity: ${a.severity}${a.medications ? `, medications: ${a.medications}` : ''}${a.epipen ? `, EpiPen: ${a.epipen}` : ''}`),
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // HEALTH-04: Care plan
  if (ht.carePlanWritten === 'yes' && ht.carePlanStored) {
    blocks.push(makeBlock('HEALTH-04', 'crossReference', 'reference', 'knownFact', {
      body: `A written care plan exists for ${name} and is stored at: ${ht.carePlanStored}.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Cross-reference: health records location
  if (ht.recordLocation) {
    blocks.push(makeBlock('HEALTH-01', 'crossReference', 'reference', 'knownFact', {
      body: `Health records for ${name} are at: ${ht.recordLocation}.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Parent voice: medication notes
  if (ht.medicationNotes) {
    blocks.push(makeBlock('PARENT-VOICE-01', 'parentVoice', 'important', 'parentPreference', {
      body: ht.medicationNotes,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Medical conditions
  if (ht.medicalConditions) {
    blocks.push(makeBlock('HEALTH-01', 'context', 'important', 'knownFact', {
      body: `${name} has the following medical condition${ht.medicalConditions.includes(',') ? 's' : ''}: ${ht.medicalConditions}.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return blocks;
}

function buildSupportTransitionBlocks(child: GuardianshipChildProfile): NarrativeBlock[] {
  const supports = child.supportTransition;
  if (!supports || supports.length === 0) return [];

  const blocks: NarrativeBlock[] = [];
  const name = child.nickname || child.name;

  blocks.push(makeBlock('SUPPORT-01', 'transition', 'primary', 'knownFact', {
    heading: 'Transition of Supports',
    body: `${name} has support needs that are part of daily life. Here is what exists now, why it matters, and what the transition job is.`,
    childIds: [child.childId],
  audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
  }));

  for (const support of supports) {
    const bullets: string[] = [];

    if (support.currentProvider?.name) {
      bullets.push(`Current provider: ${support.currentProvider.name}${support.currentProvider.role ? ` (${support.currentProvider.role})` : ''}`);
    }

    blocks.push(makeBlock('SUPPORT-01', 'transition', 'primary', 'knownFact', {
      heading: support.supportTypeLabel,
      body: `${support.purpose}. ${support.transitionAction}`,
      bullets: bullets.length > 0 ? bullets : undefined,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));

    // SUPPORT-02: Provider can help transfer
    if (support.currentProvider?.name) {
      blocks.push(makeBlock('SUPPORT-02', 'context', 'important', 'derived', {
        body: `${support.currentProvider.name} can help transfer history and records to a new provider.`,
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    if (support.recordLocation) {
      blocks.push(makeBlock('SUPPORT-01', 'crossReference', 'reference', 'knownFact', {
        body: `Records related to this support are at: ${support.recordLocation}.`,
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  // Parent voice: support transition notes
  if (supports[0]?.notes) {
    blocks.push(makeBlock('PARENT-VOICE-03', 'parentVoice', 'important', 'parentPreference', {
      body: supports[0].notes,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return blocks;
}

function buildConnectionBlocks(child: GuardianshipChildProfile, ctx: NarrativeContext): NarrativeBlock[] {
  const connections = child.importantConnections;
  if (!connections || connections.length === 0) return [];

  const blocks: NarrativeBlock[] = [];
  const name = child.nickname || child.name;
  const { parentLabel } = ctx;
  const assignment = ctx.model.guardianAssignments.find(a => a.childIds.includes(child.childId));
  const moveLikely = assignment?.moveStatus === 'likely' || assignment?.moveStatus === 'possible';

  const importantConnections = connections.filter(c => c.name);

  if (importantConnections.length === 0) return [];

  if (moveLikely) {
    const especiallyImportant = importantConnections.filter(c => c.importance === 'especially_important');
    if (especiallyImportant.length > 0) {
      blocks.push(makeBlock('CONNECTION-01', 'transition', 'primary', 'derived', {
        heading: 'Important Relationships',
        body: `A new home does not have to mean leaving every part of ${name}'s old life behind. ${parentLabel} have identified relationships that matter especially to ${name} and may need intentional effort to maintain after a move.`,
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  for (const conn of importantConnections) {
    const relationshipLabel = humanizeRelationshipTypes(conn.relationshipTypes);
    const importancePrefix = conn.importance === 'especially_important'
      ? `${conn.name} is an especially important person in ${name}'s life.`
      : `${conn.name} is an important person in ${name}'s life.`;

    // Compose relationship + context into natural prose
    let body = importancePrefix;
    if (conn.relationshipTypes.length > 0 && conn.contexts.length > 0) {
      // Natural: "Don is one of Linda's closest friends, and they also attend camp together."
      const isBestFriend = conn.relationshipTypes.includes('best_friend');
      const isFriend = conn.relationshipTypes.includes('friend') || isBestFriend;
      if (isBestFriend && conn.contexts.includes('camp')) {
        body += ` ${conn.name} is one of ${name}'s closest friends, and they also attend camp together.`;
      } else if (isFriend && conn.contexts.length > 0) {
        const ctxLabel = humanizeContexts(conn.contexts);
        body += ` ${conn.name} is ${relationshipLabel}, and they share a connection through ${ctxLabel}.`;
      } else {
        body += ` ${conn.name} is ${relationshipLabel}, and they share a connection through ${humanizeContexts(conn.contexts)}.`;
      }
    } else if (conn.relationshipTypes.length > 0) {
      body += ` ${conn.name} is ${relationshipLabel}.`;
    } else if (conn.contexts.length > 0) {
      body += ` They share a connection through ${humanizeContexts(conn.contexts)}.`;
    }

    blocks.push(makeBlock('CONNECTION-01', 'context', 'important', 'parentPreference', {
      heading: conn.name,
      body,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));

    // Parent voice: why this matters
    if (conn.whyItMatters) {
      blocks.push(makeBlock('PARENT-VOICE-01', 'parentVoice', 'primary', 'parentPreference', {
        body: conn.whyItMatters,
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    // CONNECTION-02: Continuity ideas — synthesize into natural language
    if (conn.continuityIdeas.length > 0) {
      const assignment = ctx.model.guardianAssignments.find(a => a.childIds.includes(child.childId));
    const guardianName = assignment ? guardianLabel(assignment) : undefined;
    const continuityText = interpretContinuityParagraph(conn.continuityIdeas, name, conn.name, parentLabel, guardianName);
      blocks.push(makeBlock('CONNECTION-02', 'action', 'important', 'parentPreference', {
        body: continuityText,
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    // CONNECTION-03: Contact info
    if (conn.hasContactInfo) {
      const contactParts: string[] = [];
      if (conn.contactName) contactParts.push(`Contact: ${conn.contactName}`);
      if (conn.contactPhone) contactParts.push(`Phone: ${conn.contactPhone}`);
      if (conn.contactEmail) contactParts.push(`Email: ${conn.contactEmail}`);
      blocks.push(makeBlock('CONNECTION-01', 'crossReference', 'reference', 'knownFact', {
        body: contactParts.join(' | '),
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (conn.importance === 'especially_important' && moveLikely) {
      blocks.push(makeBlock('CONNECTION-03', 'readiness', 'important', 'derived', {
        body: `No practical contact information has been recorded for ${conn.name}. It would be worth obtaining so the relationship can be maintained after a move.`,
        childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  return blocks;
}

function normalizeActivityName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim();
}

function buildActivityFreqClause(name: string, activityName: string, frequency: string): string {
  const freqStr = frequency ? humanizeFrequency(frequency) : '';
  const lowerName = activityName.toLowerCase();
  const startsWithVerb = /^(playing|doing|going|attending|participating|taking|swimming|skiing|dancing|singing|running|reading|drawing|painting|coding|gaming)/.test(lowerName);
  const verbActivity = startsWithVerb ? activityName : `participates in ${activityName}`;
  if (freqStr) {
    return `${name} ${verbActivity} ${freqStr}, and it is`;
  }
  return `${activityName} is`;
}

function buildActivitiesBlocks(child: GuardianshipChildProfile, ctx: NarrativeContext): NarrativeBlock[] {
  const activities = child.personalProfile?.activities;
  if (!activities || activities.length === 0) return [];

  const name = child.nickname || child.name;
  const { parentLabel } = ctx;
  const assignment = ctx.model.guardianAssignments.find(a => a.childIds.includes(child.childId));
  const moveLikely = assignment?.moveStatus === 'likely' || assignment?.moveStatus === 'possible';

  // Deduplicate activities by normalized name (same child + same activity identity)
  const seen = new Map<string, { name: string; importance: string; frequency: string }>();
  for (const a of activities.filter(a => a.name)) {
    const key = normalizeActivityName(a.name);
    const existing = seen.get(key);
    if (existing) {
      // Merge: keep highest importance, combine frequency info
      if (a.importance === 'Critical' || (a.importance === 'Important' && existing.importance !== 'Critical')) {
        existing.importance = a.importance;
      }
      if (a.frequency && !existing.frequency) existing.frequency = a.frequency;
    } else {
      seen.set(key, { name: a.name, importance: a.importance || '', frequency: a.frequency || '' });
    }
  }
  const deduped = Array.from(seen.values());
  if (deduped.length === 0) return [];

  const critical = deduped.filter(a => a.importance === 'Critical');
  const important = deduped.filter(a => a.importance === 'Important');
  const niceToHave = deduped.filter(a => a.importance !== 'Critical' && a.importance !== 'Important');

  const blocks_list: NarrativeBlock[] = [];

  for (const activity of critical) {
    const freqClause = buildActivityFreqClause(name, activity.name, activity.frequency);
    blocks_list.push(makeBlock('ACTIVITY-02', 'context', 'primary', 'parentPreference', {
      heading: activity.name,
      body: `${freqClause} a critical part of ${name}'s routine. ${parentLabel} would hope ${name} can continue this in ${moveLikely ? 'the new community' : 'daily life'} while staying connected with ${moveLikely ? 'former teammates and coaches where practical' : 'existing connections where practical'}.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  for (const activity of important) {
    const freqClause = buildActivityFreqClause(name, activity.name, activity.frequency);
    blocks_list.push(makeBlock('ACTIVITY-01', 'context', 'supporting', 'parentPreference', {
      heading: activity.name,
      body: `${freqClause} an important part of ${name}'s life. Maintaining this activity, or finding something similar near ${moveLikely ? 'the new home' : 'home'}, may help give ${name} a sense of familiarity and continuity.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  if (niceToHave.length > 0) {
    blocks_list.push(makeBlock('ACTIVITY-01', 'context', 'supporting', 'parentPreference', {
      body: `Other activities: ${niceToHave.map(a => a.name).join(', ')}.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return blocks_list;
}

function buildCommunitiesAndTraditionsBlocks(child: GuardianshipChildProfile): NarrativeBlock[] {
  const blocks: NarrativeBlock[] = [];
  const name = child.nickname || child.name;
  const communities = child.communities || [];
  const traditions = child.traditions || [];

  if (communities.length === 0 && traditions.length === 0) return [];

  const hasCommunities = communities.some(c => c.name);
  const hasTraditions = traditions.some(t => t.name);

  if (hasCommunities || hasTraditions) {
    blocks.push(makeBlock('COMMUNITY-01', 'context', 'supporting', 'parentPreference', {
      heading: 'Familiar Parts of Life Worth Keeping',
      body: `These are the communities and traditions that help ${name} feel at home.`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  for (const community of communities.filter(c => c.name)) {
    blocks.push(makeBlock('COMMUNITY-01', 'context', 'supporting', 'parentPreference', {
      heading: community.typeLabel,
      body: `${community.name}${community.importanceNotes ? ` — ${community.importanceNotes}` : ''}`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  for (const tradition of traditions.filter(t => t.name)) {
    const participantLabel = tradition.participantTypes.length > 0
      ? humanizeParticipantTypes(tradition.participantTypes)
      : 'family';
    blocks.push(makeBlock('TRADITION-01', 'context', 'supporting', 'parentPreference', {
      heading: tradition.typeLabel,
      body: `${tradition.name} — with ${participantLabel}${tradition.importanceNotes ? `. ${tradition.importanceNotes}` : ''}${tradition.continueIfPractical === 'yes' ? `. ${child.nickname || child.name}'s parents would like this to continue if practical.` : ''}`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return blocks;
}

function buildInheritanceBlocks(child: GuardianshipChildProfile, ctx: NarrativeContext): NarrativeBlock[] {
  const inheritanceRecords = child.inheritanceByClient;
  if (inheritanceRecords.length === 0) return [];

  const blocks: NarrativeBlock[] = [];
  const name = child.nickname || child.name;
  const { parentLabel } = ctx;

  for (const record of inheritanceRecords) {
    const clientName = record.clientName;

    // INHERITANCE-01: Managed in stages
    if (record.inheritanceType && record.inheritanceType !== 'outright' && record.inheritanceType !== 'not_sure') {
      let body = `${name}'s inheritance from ${clientName} is intended to be managed rather than paid to ${name} all at once.`;

      if (record.stages.length > 0) {
        body += ` ${clientName} understands that ${name} would receive the inheritance in stages over time:`;
        blocks.push(makeBlock('INHERITANCE-01', 'context', 'important', 'parentUnderstanding', {
          heading: `Inheritance from ${clientName}`,
          body,
          bullets: record.stages.map(s => `At age ${s.age}: ${s.fraction}${s.description ? ` — ${s.description}` : ''}`),
          childIds: [child.childId],
        audiences: [...TRUSTEE_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
        }));
      } else {
        blocks.push(makeBlock('INHERITANCE-01', 'context', 'important', 'parentUnderstanding', {
          heading: `Inheritance from ${clientName}`,
          body,
          childIds: [child.childId],
        audiences: [...TRUSTEE_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
        }));
      }

      // INHERITANCE-02: Trustee
      if (record.trusteeName) {
        blocks.push(makeBlock('INHERITANCE-02', 'context', 'important', 'parentUnderstanding', {
          body: `${clientName} believes ${record.trusteeName} would manage the inheritance.`,
          childIds: [child.childId],
        audiences: [...TRUSTEE_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
        }));
      }

      // INHERITANCE-04: Uncertainty
      blocks.push(makeBlock('INHERITANCE-04', 'readiness', 'important', 'parentUnderstanding', {
        body: `This reflects ${parentLabel}'s understanding of their Will. Consider confirming the specifics with an estate lawyer.`,
        childIds: [child.childId],
      audiences: [...LAWYER_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (record.inheritanceType === 'outright') {
      blocks.push(makeBlock('INHERITANCE-01', 'context', 'important', 'parentUnderstanding', {
        heading: `Inheritance from ${clientName}`,
        body: `${clientName} understands that ${name} would receive their inheritance directly.`,
        childIds: [child.childId],
      audiences: [...TRUSTEE_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (record.inheritanceType === 'not_sure') {
      blocks.push(makeBlock('INHERITANCE-04', 'readiness', 'important', 'parentUnderstanding', {
        heading: `Inheritance from ${clientName}`,
        body: `${clientName} is unsure how their Will handles ${name}'s inheritance. This is worth confirming with an estate lawyer.`,
        childIds: [child.childId],
      audiences: [...LAWYER_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    // INHERITANCE-03: Child-specific trust arrangement
    const arr = record.childSpecificArrangement;
    if (arr?.hasDifferentArrangement === 'yes') {
      let body = `${parentLabel} believe ${name}'s inheritance from ${clientName} is intended to be managed through a special trust arrangement designed around ${name}'s longer-term needs.`;
      if (arr.knownTrustType) {
        body += ` They believe this is structured as ${humanizeTrustType(arr.knownTrustType)}.`;
      }
      if (arr.description) {
        body += ` ${arr.description}`;
      }
      blocks.push(makeBlock('INHERITANCE-03', 'context', 'primary', 'parentUnderstanding', {
        heading: `Special Arrangement for ${name}`,
        body,
        childIds: [child.childId],
      audiences: [...TRUSTEE_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));

      blocks.push(makeBlock('INHERITANCE-04', 'readiness', 'primary', 'professionalReview', {
        body: `Consider confirming the structure and its implications for government benefits with the estate lawyer.`,
        childIds: [child.childId],
      audiences: [...LAWYER_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  return blocks;
}

function buildAdultTransitionBlocks(child: GuardianshipChildProfile, ctx: NarrativeContext): NarrativeBlock[] {
  const at = child.adultTransition;
  if (!at) return [];

  const blocks: NarrativeBlock[] = [];
  const name = child.nickname || child.name;
  const { parentLabel } = ctx;

  blocks.push(makeBlock('ADULT-TRANSITION-01', 'transition', 'primary', 'parentPreference', {
    heading: 'Looking Ahead',
    body: `${name} may need support beyond age ${ctx.model.family.ageOfMajority}. Here is what ${parentLabel} currently expect.`,
    childIds: [child.childId],
  audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
  }));

  const bullets: string[] = [];
  if (at.futureIndependenceLevel) {
    const independenceMap: Record<string, string> = {
      'fully_independent': `${parentLabel} expect ${name} to be fully independent`,
      'mostly_independent': `${parentLabel} expect ${name} to be mostly independent with some support`,
      'needs_significant_support': `${parentLabel} expect ${name} to need significant ongoing support`,
      'not_sure': `${parentLabel} are not yet sure about ${name}'s future level of independence`,
    };
    if (independenceMap[at.futureIndependenceLevel]) bullets.push(independenceMap[at.futureIndependenceLevel]);
  }
  if (at.futureFinancialHelp) {
    const helpMap: Record<string, string> = {
      'yes': `${name} may need help with financial decisions`,
      'no': `${name} is expected to manage finances independently`,
      'unsure': `${parentLabel} are unsure whether ${name} will need financial help`,
    };
    if (helpMap[at.futureFinancialHelp]) bullets.push(helpMap[at.futureFinancialHelp]);
  }
  if (at.futurePersonalHealthHelp === 'yes') bullets.push(`${name} may need help with personal care and health decisions`);
  if (at.futureCaregiverName && !isLowInformationText(at.futureCaregiverName) && at.futureCaregiverName.toLowerCase() !== 'other') bullets.push(`${name}'s future caregiver may be: ${at.futureCaregiverName}`);

  if (bullets.length > 0) {
    blocks.push(makeBlock('ADULT-TRANSITION-01', 'context', 'important', 'parentPreference', {
      bullets,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // ADULT-TRANSITION-02: DTC
  if (at.dtcStatus === 'yes') {
    blocks.push(makeBlock('ADULT-TRANSITION-02', 'crossReference', 'important', 'knownFact', {
      body: `${name} has a Disability Tax Credit in place${at.dtcDocLocation ? `. Documentation is at: ${at.dtcDocLocation}` : '.'}`,
      childIds: [child.childId],
    audiences: [...ACCOUNTANT_AUDIENCES, ...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  } else if (at.dtcStatus === 'in-progress') {
    blocks.push(makeBlock('ADULT-TRANSITION-02', 'readiness', 'important', 'parentUnderstanding', {
      body: `An application for the Disability Tax Credit for ${name} is in progress.`,
      childIds: [child.childId],
    audiences: [...ACCOUNTANT_AUDIENCES, ...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Review milestone
  if (at.reviewNeeded) {
    blocks.push(makeBlock('ADULT-TRANSITION-02', 'readiness', 'important', 'derived', {
      body: `${name} is approaching adulthood. A review of future support arrangements may be needed soon.`,
      childIds: [child.childId],
    audiences: [...ACCOUNTANT_AUDIENCES, ...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  if (at.supportLocationDependent === 'yes' && at.supportLocationDependentDetails) {
    blocks.push(makeBlock('ADULT-TRANSITION-01', 'transition', 'important', 'parentPreference', {
      body: `${name}'s support needs may depend on where ${name} lives: ${at.supportLocationDependentDetails}`,
      childIds: [child.childId],
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Adulthood terminology guardrail: ensure the output does not imply that
  // a minor-child guardianship appointment simply continues after adulthood.
  blocks.push(makeBlock('ADULT-TRANSITION-01', 'readiness', 'important', 'professionalReview', {
    body: `A guardianship appointment for a minor child does not automatically continue after ${name} reaches the age of majority. If ${name} may need ongoing decision-making support as an adult, separate legal arrangements (such as a power of attorney or adult guardianship/representation agreement) may need to be put in place. This should be discussed with an estate lawyer familiar with ${ctx.model.family.provinceOfResidence} law.`,
    childIds: [child.childId],
    audiences: [...LAWYER_AUDIENCES, ...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    limitation: {
      message: `Guardianship of a minor does not automatically extend past the age of majority. Adult decision-making support requires separate legal arrangements.`,
      importance: 'professionalReview',
      reviewerType: 'estateLawyer',
    },
  }));

  return blocks;
}

function buildFutureEducationBlocks(child: GuardianshipChildProfile, ctx: NarrativeContext): NarrativeBlock[] {
  const fe = child.futureEducation;
  if (!fe) return [];
  const blocks: NarrativeBlock[] = [];
  const name = child.nickname || child.name;
  const { parentLabel } = ctx;

  // Use new aspirations field if available, fall back to educationPath
  const ASPIRATION_LABELS: Record<string, string> = {
    university: 'university',
    college: 'college',
    trade_apprenticeship: 'a trade or apprenticeship',
    professional_training: 'other professional or post-secondary training',
    employment_focused: 'an employment or work-focused path',
    adapted_education: 'education or training adapted to their abilities and support needs',
    whatever_suits: 'whatever path suits them best',
    too_early_unsure: 'it is too early to say',
    other: 'another path',
  };

  const PATH_LABELS: Record<string, string> = {
    university: 'university',
    college: 'college',
    trade_apprenticeship: 'a trade or apprenticeship',
    other_post_secondary: 'other post-secondary or professional training',
    employment: 'an employment or work-focused path',
    support_whatever: 'whatever path suits them best',
    too_early_unsure: 'it is too early to say',
    other: 'another path',
  };

  // Prefer new aspirations, fall back to legacy educationPath
  const aspirationSource = fe.aspirations || fe.educationPath || [];
  const labelMap = fe.aspirations ? ASPIRATION_LABELS : PATH_LABELS;
  const otherText = fe.aspirations ? fe.aspirationsOther : fe.educationPathOther;

  const paths = aspirationSource.map(p => labelMap[p] || p.replace(/_/g, ' '));
  if (otherText && !isLowInformationText(otherText)) {
    const idx = paths.indexOf('another path');
    if (idx >= 0) paths[idx] = otherText;
  }

  if (paths.length > 0) {
    const pathList = paths.length === 1 ? paths[0] : paths.length === 2 ? `${paths[0]} or ${paths[1]}` : `${paths.slice(0, -1).join(', ')}, or ${paths[paths.length - 1]}`;
    const hasWhatever = aspirationSource.includes('whatever_suits') || aspirationSource.includes('support_whatever');
    const body = hasWhatever
      ? `When ${parentLabel} think about ${name} becoming an adult, they want to support ${name} in pursuing ${pathList}. They do not assume one particular path is superior to another.`
      : `When ${parentLabel} think about ${name} becoming an adult, they currently hope or expect ${name} to pursue ${pathList}.`;
    blocks.push(makeBlock('EDUCATION-01', 'context', 'important', 'parentPreference', {
      heading: 'Looking Ahead',
      body,
      childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Financial support expectation — prefer new field, fall back to legacy
  const expectation = fe.supportExpectation || fe.financialSupportExpectation;
  const expectationDetails = fe.supportExpectationDetails;
  const FINANCIAL_LABELS: Record<string, string> = {
    yes: 'Yes',
    likely: 'Likely',
    unsure: 'Unsure',
    no_specific_expectation: 'No specific expectation',
    not_applicable: 'Not applicable',
    other: 'Other',
  };

  if (expectation) {
    const label = FINANCIAL_LABELS[expectation] || expectation;
    const body = label === 'Yes'
      ? `${parentLabel} currently expect to financially support ${name} through post-secondary education, training or their transition into independence.`
      : label === 'Likely'
        ? `${parentLabel} would likely support ${name} financially through post-secondary education, training or their transition into independence.`
        : label === 'Unsure'
          ? `${parentLabel} are unsure whether they will be able to financially support ${name} through post-secondary education, training or their transition into independence.`
          : label === 'Not applicable'
            ? `${parentLabel} do not consider this applicable to ${name}'s situation.`
            : `${parentLabel} do not have a specific expectation about financially supporting ${name} through post-secondary education, training or their transition into independence.`;
    blocks.push(makeBlock('EDUCATION-01', 'context', 'supporting', 'parentPreference', {
      body,
      childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));

    if (expectation === 'other' && expectationDetails && !isLowInformationText(expectationDetails)) {
      blocks.push(makeBlock('EDUCATION-01', 'parentVoice', 'supporting', 'parentPreference', {
        body: expectationDetails,
        childIds: [child.childId],
        audiences: [...GUARDIAN_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  // Parent notes — prefer new aspirationNotes, fall back to notesForGuardian
  const notes = fe.aspirationNotes || fe.notesForGuardian;
  if (notes && !isLowInformationText(notes)) {
    blocks.push(makeBlock('EDUCATION-01', 'parentVoice', 'important', 'parentPreference', {
      heading: 'In Their Own Words',
      body: notes,
      childIds: [child.childId],
      audiences: [...GUARDIAN_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  blocks.push(makeBlock('EDUCATION-01', 'readiness', 'supporting', 'professionalReview', {
    body: 'These are parental hopes and expectations. They do not constitute legal obligations or guaranteed funding unless supported by legal documents.',
    childIds: [child.childId],
    audiences: [...LAWYER_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
  }));

  return blocks;
}

function buildChildNarrative(child: GuardianshipChildProfile, ctx: NarrativeContext): GuardianshipChildNarrative {
  const narrative: GuardianshipChildNarrative = {
    childId: child.childId,
    childName: child.nickname || child.name,
  };

  narrative.introduction = buildChildIntroduction(child, ctx);
  narrative.education = buildEducationBlocks(child, ctx);
  narrative.healthcare = buildHealthcareBlocks(child);
  narrative.supportTransition = buildSupportTransitionBlocks(child);
  narrative.peopleAndConnections = buildConnectionBlocks(child, ctx);
  narrative.activities = buildActivitiesBlocks(child, ctx);
  narrative.communitiesAndTraditions = buildCommunitiesAndTraditionsBlocks(child);
  narrative.inheritance = buildInheritanceBlocks(child, ctx);

  if (child.adultTransition) {
    narrative.adultTransition = buildAdultTransitionBlocks(child, ctx);
  }

  if (child.futureEducation) {
    narrative.futureEducation = buildFutureEducationBlocks(child, ctx);
  }

  // Remove empty arrays
  for (const key of Object.keys(narrative) as Array<keyof GuardianshipChildNarrative>) {
    if (Array.isArray(narrative[key]) && (narrative[key] as NarrativeBlock[]).length === 0) {
      delete narrative[key];
    }
  }

  return narrative;
}

function buildFamilyRoles(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const blocks: NarrativeBlock[] = [];

  const seenRoles = new Set<string>();
  const siblingRoleKeywords = ['maintain sibling connection', 'sibling connection'];
  for (const role of model.roles) {
    // Skip low-value sibling roles — the Adult Sibling section already covers this
    if (siblingRoleKeywords.some(kw => role.responsibility.toLowerCase().includes(kw))) continue;

    const childLabel = role.childName ? ` for ${role.childName}` : '';
    const roleKey = `${role.responsibility}|${role.childName || ''}|${role.firstChoice || ''}`;
    if (seenRoles.has(roleKey)) continue;
    seenRoles.add(roleKey);
    blocks.push(makeBlock('ROLE-01', 'summary', 'important', 'parentPreference', {
      heading: role.responsibility,
      body: `First choice: ${role.firstChoice || 'not decided'}${role.backup ? `. Backup: ${role.backup}` : ''}${childLabel}.`,
    audiences: [...GUARDIAN_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // SIBLING-01: Adult sibling roles
  for (const siblingRole of model.adultSiblingRoles) {
    blocks.push(makeBlock('SIBLING-01', 'context', 'primary', 'parentPreference', {
      heading: `${siblingRole.adultSiblingName} — a sibling, not a replacement parent`,
      body: `${siblingRole.adultSiblingName} is an adult sibling who matters to the younger children. ${parentLabel} want ${siblingRole.adultSiblingName} to remain their sibling${siblingRole.forMinorChildNames.length > 0 ? ` — not feel responsible for replacing them as a parent to ${siblingRole.forMinorChildNames.join(' and ')}` : ' — not feel responsible for replacing them as a parent'}.`,
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));

    // SIBLING-02: Role and limits
    if (siblingRole.role) {
      blocks.push(makeBlock('SIBLING-02', 'context', 'important', 'parentPreference', {
        body: `${parentLabel} would hope ${siblingRole.adultSiblingName} can help by ${humanizeSiblingRole(siblingRole.role)}.`,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    if (siblingRole.notResponsibleFor.length > 0) {
      const items = humanizeSiblingNotResponsible(siblingRole.notResponsibleFor);
      blocks.push(makeBlock('SIBLING-02', 'context', 'important', 'parentPreference', {
        body: `${parentLabel} specifically do not expect ${siblingRole.adultSiblingName} to be responsible for:`,
        bullets: items,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  return blocks;
}

function buildFinancialResources(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const blocks: NarrativeBlock[] = [];

  for (const fr of model.financialResources) {
    if (!fr.exists) continue;

    if (fr.type === 'life_insurance') {
      blocks.push(makeBlock('FINANCIAL-01', 'crossReference', 'important', 'knownFact', {
        heading: 'Life Insurance',
        body: `Life insurance is in place for the family. See the Family Financial Map for policy details.`,
      audiences: [...ACCOUNTANT_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (fr.type === 'resp') {
      const childLabel = fr.childNames.length > 0 ? ` for ${fr.childNames.join(' and ')}` : '';
      blocks.push(makeBlock('FINANCIAL-02', 'crossReference', 'important', 'knownFact', {
        heading: 'RESP',
        body: `An RESP exists${childLabel}${fr.institution ? ` at ${fr.institution}` : ''}. See the Family Financial Map for account details.`,
        childIds: fr.childIds,
      audiences: [...ACCOUNTANT_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (fr.type === 'rdsp') {
      const childLabel = fr.childNames.length > 0 ? ` for ${fr.childNames.join(' and ')}` : '';
      blocks.push(makeBlock('FINANCIAL-03', 'crossReference', 'important', 'knownFact', {
        heading: 'RDSP',
        body: `An RDSP exists${childLabel}${fr.institution ? ` at ${fr.institution}` : ''}. This is a registered disability savings plan. See the Family Financial Map for account details.`,
        childIds: fr.childIds,
      audiences: [...ACCOUNTANT_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    } else if (fr.type === 'trust') {
      blocks.push(makeBlock('FINANCIAL-01', 'crossReference', 'reference', 'knownFact', {
        heading: 'Family Trusts',
        body: `Family trusts have been identified. See the Family Trusts section for details.`,
      audiences: [...ACCOUNTANT_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  void parentLabel;
  return blocks;
}

function buildDocuments(ctx: NarrativeContext): NarrativeBlock[] {
  const { model } = ctx;
  const blocks: NarrativeBlock[] = [];

  const existingDocs = model.documents.filter(d => d.exists || d.locationKnown);
  if (existingDocs.length === 0) return [];

  blocks.push(makeBlock('DOC-01', 'summary', 'reference', 'knownFact', {
    heading: 'Where to Find Important Documents',
    body: `These are the documents and locations identified during the questionnaire.`,
  audiences: ALL_AUDIENCES,
  }));

  for (const doc of existingDocs) {
    const locationText = doc.locationKnown && doc.location
      ? `Located at: ${doc.location}`
      : 'Location unknown';
    blocks.push(makeBlock('DOC-01', 'crossReference', 'reference', 'knownFact', {
      heading: doc.label,
      body: `${doc.exists ? 'Exists' : 'May exist'}. ${locationText}.`,
      childIds: doc.childId ? [doc.childId] : undefined,
    audiences: ALL_AUDIENCES,
    }));
  }

  return blocks;
}

function buildReadiness(ctx: NarrativeContext): ReadinessNarrative {
  const { model, parentLabel } = ctx;
  const r = model.readiness;

  const decisionsMade: NarrativeBlock[] = r.decisionsMade.map(text =>
    makeBlock('READINESS-01', 'readiness', 'important', 'knownFact', {
      body: text,
    })
  );

  const thingsWorthConfirming: NarrativeBlock[] = r.thingsWorthConfirming.map(text =>
    makeBlock('READINESS-02', 'readiness', 'important', 'professionalReview', {
      body: text,
    })
  );

  const thingsStillToDo: NarrativeBlock[] = r.thingsStillToDo.map(text =>
    makeBlock('READINESS-03', 'readiness', 'primary', 'derived', {
      body: text,
    })
  );

  // Add summary block
  if (decisionsMade.length > 0) {
    decisionsMade.unshift(makeBlock('READINESS-01', 'summary', 'important', 'knownFact', {
      heading: 'Decisions You\'ve Made',
      body: `${parentLabel} have settled on these important decisions.`,
    audiences: [...CLIENT_PLANNING_AUDIENCES],
    }));
  }
  if (thingsWorthConfirming.length > 0) {
    thingsWorthConfirming.unshift(makeBlock('READINESS-02', 'summary', 'important', 'professionalReview', {
      heading: 'Things Worth Confirming',
      body: `These items may benefit from professional confirmation.`,
    audiences: [...LAWYER_AUDIENCES, ...ACCOUNTANT_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }
  if (thingsStillToDo.length > 0) {
    thingsStillToDo.unshift(makeBlock('READINESS-03', 'summary', 'primary', 'derived', {
      heading: 'Things Still To Do',
      body: `These items still need attention.`,
    audiences: [...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return { decisionsMade, thingsWorthConfirming, thingsStillToDo };
}

function buildImmediateActions(ctx: NarrativeContext): ImmediateActionNarrative[] {
  const { model, parentLabel } = ctx;
  const actions: ImmediateActionNarrative[] = [];

  const seenActions = new Map<string, typeof model.immediateActions[number] & { mergedChildNames: string[] }>();
  for (const action of model.immediateActions) {
    const key = action.id.startsWith('keep_connected') ? `keep_connected_${action.childNames.join('_')}`
      : action.id;
    const existing = seenActions.get(key);
    if (existing) {
      for (const cn of action.childNames) {
        if (!existing.mergedChildNames.includes(cn)) existing.mergedChildNames.push(cn);
      }
    } else {
      seenActions.set(key, { ...action, mergedChildNames: [...action.childNames] });
    }
  }
  const dedupedActions = Array.from(seenActions.values());
  let actionPriority = 0;

  for (const action of dedupedActions) {
    actionPriority++;
    let heading = action.action;
    let body = '';
    let ruleId = 'IMMEDIATE-01';

    // Determine rule and refine heading/body
    if (action.id.startsWith('guardian_contact')) {
      ruleId = 'IMMEDIATE-01';
      heading = `Contact the intended guardian${action.childNames.length > 1 ? 's' : ''}`;
      body = `Reach out to the person${action.childNames.length > 1 ? 's' : ''} identified as guardian${action.childNames.length > 1 ? 's' : ''} for ${action.childNames.join(' and ')}.`;
    } else if (action.id.startsWith('keep_together')) {
      ruleId = 'IMMEDIATE-02';
      heading = 'Keep minor siblings together where reasonably possible';
      body = `If practical, keeping the children together can provide stability during a difficult time.`;
    } else if (action.id.startsWith('sibling_contact')) {
      ruleId = 'IMMEDIATE-03';
      heading = 'Contact important family';
      body = action.action.replace(/^Contact /, '');
    } else if (action.id.startsWith('keep_connected')) {
      ruleId = 'IMMEDIATE-06';
      const childNames = action.mergedChildNames;
      const detailText = action.action;
      if (childNames.length === 1) {
        heading = `Help ${childNames[0]} stay connected to important people`;
        body = detailText && detailText !== `Help ${childNames[0]} stay connected — identify  as key relationships`
          ? detailText
          : `Make early plans to help ${childNames[0]} stay connected to the important people identified in their relationship section. Contact information should be obtained where it is not already recorded.`;
      } else if (childNames.length > 1) {
        heading = `Help ${childNames.join(' and ')} stay connected to important people`;
        body = detailText && !detailText.startsWith('Help ')
          ? detailText
          : `Make early plans to help ${childNames.join(' and ')} stay connected to the important people identified in their relationship sections. Contact information should be obtained where it is not already recorded.`;
      } else {
        heading = 'Help the children stay connected to important people';
        body = detailText || `Make early plans to help the children stay connected to the important people identified in their relationship sections.`;
      }
    } else if (action.id.startsWith('obtain_contacts_')) {
      ruleId = 'IMMEDIATE-06';
      heading = 'Obtain contact information for important relationships';
      body = action.action;
    } else if (action.id === 'estate_trustee') {
      ruleId = 'IMMEDIATE-04';
      heading = 'Locate the Wills and contact the Estate Trustee';
      body = action.action.replace(/^Locate /, '');
    } else if (action.id.startsWith('gather_records')) {
      ruleId = 'IMMEDIATE-05';
      heading = 'Gather school and health records';
      const childNames = action.mergedChildNames;
      // Normalize and deduplicate document locations
      const rawLoc = action.action.replace(/^Gather /, '');
      const locParts = rawLoc.split(/[;,]/).map(s => s.trim()).filter(s => s.length > 0);
      const normalized = new Set<string>();
      const cleanParts: string[] = [];
      for (const part of locParts) {
        // Normalize: lowercase, collapse whitespace, strip leading determiners, strip trailing punctuation
        const norm = part
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/^(our|the)\s+/i, '')
          .replace(/\.$/, '')
          .trim();
        if (!normalized.has(norm)) {
          normalized.add(norm);
          // Clean up the display version: strip leading "our "/"the " and trailing period
          const displayPart = part.replace(/^(our|the)\s+/i, '').replace(/\.$/, '').trim();
          cleanParts.push(displayPart.charAt(0).toUpperCase() + displayPart.slice(1));
        }
      }
      if (childNames.length === 1) {
        body = `Gather ${childNames[0]}'s school and health records from ${cleanParts.join(' and ')} so they can be provided to the new school and healthcare providers.`;
      } else {
        body = `Gather school and health records for ${childNames.join(' and ')} from ${cleanParts.join(' and ')} so they can be provided to new schools and healthcare providers.`;
      }
    } else if (action.id.startsWith('firstdays_')) {
      ruleId = 'IMMEDIATE-07';
      heading = `Follow ${parentLabel}'s first-days wishes`;
      body = action.action;
    } else if (action.id === 'avoid_changes') {
      ruleId = 'IMMEDIATE-08';
      heading = 'Avoid unnecessary changes initially';
      body = action.action;
    } else {
      body = action.action;
    }

    actions.push({
      id: action.id,
      heading,
      body,
      personNames: [],
      childNames: action.mergedChildNames,
      priority: actionPriority,
      isParentWish: action.isParentWish,
      ruleId,
    });
  }

  return actions;
}

function buildQuickReference(ctx: NarrativeContext): QuickReferenceItem[] {
  const { model } = ctx;
  const items: QuickReferenceItem[] = [];
  let id = 0;

  // Guardians
  for (const assignment of model.guardianAssignments) {
    items.push({
      id: `qr_${id++}`,
      label: `Guardian for ${assignment.childNames.join(' and ')}`,
      value: assignment.householdLabel,
      category: 'person',
      childIds: assignment.childIds,
    });
    if (assignment.alternatePeople.length > 0) {
      items.push({
        id: `qr_${id++}`,
        label: `Alternate guardian for ${assignment.childNames.join(' and ')}`,
        value: assignment.alternatePeople.map(p => p.name).join(' and '),
        category: 'person',
        childIds: assignment.childIds,
      });
    }
  }

  // Estate Trustees
  for (const et of model.estateTrustees) {
    if (et.primaryTrustee?.name) {
      items.push({
        id: `qr_${id++}`,
        label: `Estate Trustee (${et.clientName})`,
        value: et.primaryTrustee.name,
        category: 'role',
      });
    }
  }

  // Inheritance Trustees (deduplicated by child+trustee)
  const seenTrustees = new Set<string>();
  for (const child of model.children) {
    for (const record of child.inheritanceByClient) {
      if (record.trusteeName) {
        const key = `${child.childId}|${record.trusteeName}`;
        if (seenTrustees.has(key)) continue;
        seenTrustees.add(key);
        items.push({
          id: `qr_${id++}`,
          label: `Inheritance trustee for ${child.nickname || child.name}`,
          value: record.trusteeName,
          category: 'role',
          childIds: [child.childId],
        });
      }
    }
  }

  // Financial resources
  for (const fr of model.financialResources.filter(r => r.exists)) {
    items.push({
      id: `qr_${id++}`,
      label: humanizeFinancialType(fr.type),
      value: fr.childNames.length > 0 ? `For ${fr.childNames.join(', ')}` : 'See Financial Map',
      category: 'financial',
      childIds: fr.childIds.length > 0 ? fr.childIds : undefined,
    });
  }

  // Canonical document-location dedup: identity = childId|documentType|normalizedLocation
  // This prevents the same document at the same location from appearing twice
  // just because it was sourced from the document registry vs. a per-child field.
  const seenDocLocs = new Set<string>();
  const normalizeLoc = (loc: string): string =>
    loc.toLowerCase().replace(/\s+/g, ' ').replace(/^(our|the)\s+/i, '').replace(/[.,;]$/, '').trim();

  // Classify a document label into a canonical type for dedup matching
  const classifyDocLabel = (label: string): string => {
    const l = label.toLowerCase();
    if (l.includes('iep') || l.includes('support records')) return 'iep';
    if (l.includes('education records')) return 'education_records';
    if (l.includes('medical records') || l.includes('health records')) return 'medical_records';
    if (l.includes('dtc') || l.includes('disability tax credit')) return 'dtc';
    if (l.includes('birth cert')) return 'birth_certificate';
    if (l.includes('care plan')) return 'care_plan';
    if (l.includes('will')) return 'will';
    return label.toLowerCase().replace(/\s+/g, ' ').trim();
  };

  for (const doc of model.documents.filter(d => d.locationKnown && d.location)) {
    const normLoc = normalizeLoc(doc.location || '');
    const docType = classifyDocLabel(doc.label);
    const docKey = `${doc.childId || 'household'}|${docType}|${normLoc}`;
    if (seenDocLocs.has(docKey)) continue;
    seenDocLocs.add(docKey);
    items.push({
      id: `qr_${id++}`,
      label: doc.label,
      value: doc.location || '',
      category: 'document',
      childIds: doc.childId ? [doc.childId] : undefined,
    });
  }

  // Healthcare providers from children
  const seenProviders = new Set<string>();
  for (const child of model.children) {
    const ht = child.healthcareTransition;
    if (ht?.providers) {
      for (const p of ht.providers) {
        if (!p.name) continue;
        const key = `${p.name}|${p.role}`;
        if (seenProviders.has(key)) continue;
        seenProviders.add(key);
        const contactParts: string[] = [p.role];
        if (p.phone) contactParts.push(p.phone);
        if (p.email) contactParts.push(p.email);
        items.push({
          id: `qr_${id++}`,
          label: `${p.name} (${child.nickname || child.name})`,
          value: contactParts.join(' — '),
          category: 'person',
          childIds: [child.childId],
        });
      }
    }
  }

  // School contacts from children
  const seenSchools = new Set<string>();
  for (const child of model.children) {
    const et = child.educationTransition;
    if (et?.schoolName && !seenSchools.has(et.schoolName)) {
      seenSchools.add(et.schoolName);
      const schoolContact = [et.schoolName];
      if (et.schoolPhone) schoolContact.push(et.schoolPhone);
      items.push({
        id: `qr_${id++}`,
        label: `School (${child.nickname || child.name})`,
        value: schoolContact.join(' — '),
        category: 'person',
        childIds: [child.childId],
      });
    }
  }

  // Pharmacy info from children
  for (const child of model.children) {
    const ht = child.healthcareTransition;
    if (ht?.pharmacyName) {
      items.push({
        id: `qr_${id++}`,
        label: `Pharmacy (${child.nickname || child.name})`,
        value: ht.pharmacyName,
        category: 'person',
        childIds: [child.childId],
      });
    }
  }

  // Medical records location — dedup against document registry via canonical key
  for (const child of model.children) {
    const ht = child.healthcareTransition;
    if (ht?.recordLocation) {
      const normLoc = normalizeLoc(ht.recordLocation);
      const docKey = `${child.childId}|medical_records|${normLoc}`;
      if (seenDocLocs.has(docKey)) continue;
      seenDocLocs.add(docKey);
      items.push({
        id: `qr_${id++}`,
        label: `Medical records location (${child.nickname || child.name})`,
        value: ht.recordLocation,
        category: 'document',
        childIds: [child.childId],
      });
    }
  }

  // Support providers (therapists, support workers)
  for (const child of model.children) {
    if (child.supportTransition) {
      for (const sr of child.supportTransition) {
        if (sr.currentProvider?.name) {
          items.push({
            id: `qr_${id++}`,
            label: `${sr.currentProvider.role || sr.supportTypeLabel || 'Support provider'} (${child.nickname || child.name})`,
            value: sr.currentProvider.name,
            category: 'person',
            childIds: [child.childId],
          });
        }
      }
    }
  }

  // DTC document location — dedup against document registry via canonical key
  for (const child of model.children) {
    const at = child.adultTransition;
    if (at?.dtcStatus === 'yes' && at.dtcDocLocation) {
      const normLoc = normalizeLoc(at.dtcDocLocation);
      const docKey = `${child.childId}|dtc|${normLoc}`;
      if (seenDocLocs.has(docKey)) continue;
      seenDocLocs.add(docKey);
      items.push({
        id: `qr_${id++}`,
        label: `Disability Tax Credit documentation (${child.nickname || child.name})`,
        value: at.dtcDocLocation,
        category: 'document',
        childIds: [child.childId],
      });
    }
  }

  // IEP / support records location — dedup against document registry via canonical key
  for (const child of model.children) {
    const et = child.educationTransition;
    if (et?.iepDocumentLocation) {
      const normLoc = normalizeLoc(et.iepDocumentLocation);
      const docKey = `${child.childId}|iep|${normLoc}`;
      if (seenDocLocs.has(docKey)) continue;
      seenDocLocs.add(docKey);
      items.push({
        id: `qr_${id++}`,
        label: `IEP/support records location (${child.nickname || child.name})`,
        value: et.iepDocumentLocation,
        category: 'document',
        childIds: [child.childId],
      });
    }
  }

  // Education records location — dedup against document registry via canonical key
  for (const child of model.children) {
    const et = child.educationTransition;
    if (et?.recordLocation) {
      const normLoc = normalizeLoc(et.recordLocation);
      const docKey = `${child.childId}|education_records|${normLoc}`;
      if (seenDocLocs.has(docKey)) continue;
      seenDocLocs.add(docKey);
      items.push({
        id: `qr_${id++}`,
        label: `Education records location (${child.nickname || child.name})`,
        value: et.recordLocation,
        category: 'document',
        childIds: [child.childId],
      });
    }
  }

  // Important connections with contact info
  for (const child of model.children) {
    if (child.importantConnections) {
      for (const conn of child.importantConnections) {
        if (!conn.hasContactInfo) continue;
        const contactParts: string[] = [];
        if (conn.contactName) contactParts.push(conn.contactName);
        if (conn.contactPhone) contactParts.push(conn.contactPhone);
        if (conn.contactEmail) contactParts.push(conn.contactEmail);
        if (contactParts.length > 0) {
          items.push({
            id: `qr_${id++}`,
            label: `${conn.name} (${child.nickname || child.name})`,
            value: contactParts.join(' — '),
            category: 'person',
            childIds: [child.childId],
          });
        }
      }
    }
  }

  return items;
}

function buildFundingPhilosophyNarrative(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const fp = model.fundingPhilosophy;
  if (!fp) return [];

  const blocks: NarrativeBlock[] = [];
  const guardianAudience = [...GUARDIAN_AUDIENCES, ...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES];
  const lawyerAudience = [...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES];

  const childNames = ctx.model.children
    .filter(c => c.status === 'minor')
    .map(c => c.nickname || c.name);
  const childLabel = childNames.length === 0
    ? 'the children'
    : childNames.length === 1 ? childNames[0] : childNames.join(' and ');

  // Block A: Overall philosophy
  const philosophyBody = `${parentLabel} recognize that welcoming ${childLabel} into another household would affect more than the children. It could change the Guardian family's home, routines, work, childcare needs and finances.`;
  blocks.push(makeBlock('FUNDING-01', 'context', 'primary', 'parentPreference', {
    heading: 'The Overall Philosophy',
    body: philosophyBody,
    audiences: guardianAudience,
  }));

  if (fp.overallApproach) {
    const label = humanizeOverallApproach(fp.overallApproach);
    const approachBody = label
      ? `Their intention is that the resources they've left behind should ${label}.`
      : `Their intention is that the resources they've left behind should help make that transition easier for the whole household.`;
    blocks.push(makeBlock('FUNDING-01', 'context', 'primary', 'parentPreference', {
      body: approachBody,
      audiences: guardianAudience,
    }));
  }

  // Block B: Everyday family life
  const everydayParts: string[] = [];
  const everydayText = humanizeEverydayExpenseApproach(fp.everydayExpenseApproach || '');
  if (everydayText) {
    everydayParts.push(everydayText);
  }

  if (fp.recordKeepingPreference) {
    everydayParts.push(humanizeRecordKeeping(fp.recordKeepingPreference));
  }

  if (everydayParts.length > 0) {
    blocks.push(makeBlock('FUNDING-01', 'context', 'important', 'parentPreference', {
      heading: 'Everyday Family Life',
      body: everydayParts.join(' '),
      audiences: guardianAudience,
    }));
  }

  // Block C: Larger adjustments
  const wantsHousing = fp.housingPreference === 'yes' || fp.housingPreference === 'open_to_it';
  const wantsVehicle = fp.vehiclePreference === 'yes' || fp.vehiclePreference === 'open_to_it';
  const wantsWorkReduction = fp.workReductionPreference === 'yes' || fp.workReductionPreference === 'open_to_it';
  const wantsHelp = fp.householdHelpPreference === 'yes' || fp.householdHelpPreference === 'open_to_it';
  const anyMajorSupport = wantsHousing || wantsVehicle || wantsWorkReduction || wantsHelp;

  if (anyMajorSupport) {
    const majorParts: string[] = [];
    if (wantsHousing) majorParts.push('a larger home');
    if (wantsVehicle) majorParts.push('a larger vehicle');
    if (wantsHelp) majorParts.push('childcare or household help');
    if (wantsWorkReduction) majorParts.push('reduced work hours');
    const majorList = majorParts.length === 1 ? majorParts[0] : majorParts.length === 2 ? `${majorParts[0]} or ${majorParts[1]}` : `${majorParts.slice(0, -1).join(', ')}, or ${majorParts[majorParts.length - 1]}`;
    blocks.push(makeBlock('FUNDING-01', 'context', 'important', 'parentPreference', {
      heading: 'Larger Adjustments',
      body: `For larger changes, their thinking is similarly pragmatic. If caring for ${childLabel} required ${majorList}, they would want available resources to help where the estate plan allows.`,
      audiences: guardianAudience,
    }));
  }

  const sharedBenefitText = humanizeSharedBenefitPhilosophy(fp.sharedHouseholdBenefitPhilosophy || '');
  if (sharedBenefitText) {
    blocks.push(makeBlock('FUNDING-01', 'context', 'important', 'parentPreference', {
      body: sharedBenefitText,
      audiences: guardianAudience,
    }));
  }

  if (fp.guardianOwnChildrenFairnessNotes && !isLowInformationText(fp.guardianOwnChildrenFairnessNotes)) {
    blocks.push(makeBlock('FUNDING-01', 'parentVoice', 'important', 'parentPreference', {
      body: fp.guardianOwnChildrenFairnessNotes,
      audiences: guardianAudience,
    }));
  }

  // Legal humility limitation
  blocks.push(makeBlock('FUNDING-01', 'readiness', 'important', 'professionalReview', {
    body: 'These are the parents\' funding intentions. Whether trust or estate resources can be used for these purposes depends on the legal authority granted to the trustee. Worth confirming with the estate lawyer.',
    audiences: lawyerAudience,
  }));

  // FUNDING-12: Parent voice — In Their Own Words
  if (fp.parentMessageToGuardian && !isLowInformationText(fp.parentMessageToGuardian)) {
    blocks.push(makeBlock('FUNDING-12', 'parentVoice', 'primary', 'parentPreference', {
      heading: 'In Their Own Words',
      body: fp.parentMessageToGuardian,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return blocks;
}

function buildCoordinationNarrative(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const coords = model.careFundingCoordination;
  if (!coords || coords.length === 0) return [];

  const blocks: NarrativeBlock[] = [];
  const fp = model.fundingPhilosophy;
  const guardianAudience = [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES];
  const trusteeAudience = [...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES];
  const lawyerAudience = [...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES];

  // Find scenarios where coordination is needed (different people)
  const needsCoordination = coords.filter(c => c.coordinationNeeded);
  const samePerson = coords.filter(c => c.samePeople);

  // COORDINATION-02: Same person holds both roles — only when there is mixed same/different
  if (samePerson.length > 0 && needsCoordination.length === 0 && samePerson.length < coords.length) {
    blocks.push(makeBlock('COORDINATION-02', 'context', 'primary', 'derived', {
      heading: 'One Person, Two Roles',
      body: `The same person who would provide day-to-day care also manages the financial resources. This simplifies decision-making because one person holds both perspectives.`,
      audiences: guardianAudience,
    }));
  }

  // COORDINATION-01: Different people hold care and financial roles
  if (needsCoordination.length > 0) {
    blocks.push(makeBlock('COORDINATION-01', 'context', 'primary', 'derived', {
      heading: 'Working Together for the Children',
      body: `The person providing day-to-day care and the person managing financial resources are different. This means two people need to work together. Each was chosen for different reasons — but for the same purpose.`,
      audiences: [...guardianAudience, ...trusteeAudience],
    }));

    // COORDINATION-03: Guardian judgment
    if (fp?.guardianJudgmentWeight || fp?.guardianJudgmentNotes) {
      const judgmentBody = fp.guardianJudgmentNotes
        || (fp.guardianJudgmentWeight === 'primary'
          ? `${parentLabel} wanted the guardian's day-to-day judgment to carry significant weight.`
          : fp.guardianJudgmentWeight === 'equal'
            ? `${parentLabel} wanted the guardian and financial decision-maker to have equal say.`
            : `${parentLabel} wanted major financial decisions to carry more weight than day-to-day preferences.`);
      blocks.push(makeBlock('COORDINATION-03', 'context', 'important', 'parentPreference', {
        heading: 'How Much Weight to Give the Guardian Perspective',
        body: judgmentBody,
        audiences: [...guardianAudience, ...trusteeAudience],
      }));
    }

    // COORDINATION-04: Long-term financial responsibility
    if (fp?.financialDecisionMakerShouldUnderstand && fp.financialDecisionMakerShouldUnderstand.length > 0) {
      blocks.push(makeBlock('COORDINATION-04', 'context', 'important', 'parentPreference', {
        heading: 'What the Financial Decision-Maker Should Understand',
        body: fp.financialDecisionMakerShouldUnderstand.join('; '),
        audiences: [...trusteeAudience, ...GUARDIAN_AUDIENCES],
      }));
    }

    // COORDINATION-05: Major decisions requiring discussion
    if (fp?.discussionRequiredFor && fp.discussionRequiredFor.length > 0) {
      blocks.push(makeBlock('COORDINATION-05', 'context', 'important', 'parentPreference', {
        heading: 'Major Decisions That Should Involve Discussion',
        body: fp.discussionRequiredFor.join('; '),
        audiences: [...guardianAudience, ...trusteeAudience],
      }));
    }

    // COORDINATION-06: Discussion threshold
    if (fp?.hasDiscussionThreshold || fp?.discussionThresholdAmount) {
      const thresholdBody = fp.hasDiscussionThreshold === 'yes' && fp.discussionThresholdAmount
        ? `${parentLabel} wanted the guardian and financial decision-maker to discuss any expense above ${fp.discussionThresholdAmount}.`
        : `${parentLabel} wanted the guardian and financial decision-maker to use judgment about when to consult each other.`;
      blocks.push(makeBlock('COORDINATION-06', 'context', 'supporting', 'parentPreference', {
        heading: 'When to Consult Each Other',
        body: thresholdBody,
        audiences: [...guardianAudience, ...trusteeAudience],
      }));
    }

    // COORDINATION-07: Disagreement process
    if (fp?.disagreementApproach && fp.disagreementApproach.length > 0) {
      blocks.push(makeBlock('COORDINATION-07', 'context', 'important', 'parentPreference', {
        heading: 'If They Disagree',
        body: fp.disagreementApproach.join('; '),
        audiences: [...guardianAudience, ...trusteeAudience, ...LAWYER_AUDIENCES],
      }));
    }

    // COORDINATION-08: Professional escalation
    if (fp?.escalationPersonIds && fp.escalationPersonIds.length > 0) {
      const escalationPersons = fp.escalationPersonIds
        .map(pid => ctx.model.guardianAssignments
          .flatMap(a => a.guardianPeople)
          .find(p => p.id === pid))
        .filter((p): p is NonNullable<typeof p> => !!p);
      const escalationNames = escalationPersons.map(p => p.name).join(' and ');
      if (escalationNames) {
        blocks.push(makeBlock('COORDINATION-08', 'context', 'important', 'parentPreference', {
          heading: 'Who to Involve If They Cannot Resolve Something',
          body: `${parentLabel} suggested involving: ${escalationNames}.`,
          audiences: [...guardianAudience, ...trusteeAudience, ...LAWYER_AUDIENCES],
        }));
      }
    }

    // COORDINATION-09: Parent message to guardian
    if (fp?.parentMessageToGuardian) {
      blocks.push(makeBlock('COORDINATION-09', 'parentVoice', 'important', 'parentPreference', {
        heading: `A Message for the Guardian`,
        body: fp.parentMessageToGuardian,
        audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    // COORDINATION-10: Parent message to financial decision-maker
    if (fp?.parentMessageToFinancialDecisionMaker) {
      blocks.push(makeBlock('COORDINATION-10', 'parentVoice', 'important', 'parentPreference', {
        heading: `A Message for the Financial Decision-Maker`,
        body: fp.parentMessageToFinancialDecisionMaker,
        audiences: [...TRUSTEE_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }

    // COORDINATION-11: Parent message about working together
    if (fp?.parentMessageAboutWorkingTogether) {
      blocks.push(makeBlock('COORDINATION-11', 'parentVoice', 'primary', 'parentPreference', {
        heading: `A Message About Working Together`,
        body: fp.parentMessageAboutWorkingTogether,
        audiences: [...guardianAudience, ...trusteeAudience],
      }));
    }
  }

  // Identity confidence limitation
  if (coords.some(c => c.identityConfidence === 'low')) {
    blocks.push(makeBlock('COORDINATION-01', 'readiness', 'important', 'professionalReview', {
      body: 'Some role comparisons could not be made with full confidence because identity references were not fully resolved. Worth confirming which roles the same person holds.',
      audiences: lawyerAudience,
    }));
  }

  return blocks;
}

function filterBlocksByAudience(blocks: NarrativeBlock[], audience: GuardianshipAudience): NarrativeBlock[] {
  return blocks.filter(b => !b.audiences || b.audiences.length === 0 || b.audiences.includes(audience));
}

function filterChildByAudience(child: GuardianshipChildNarrative, audience: GuardianshipAudience): GuardianshipChildNarrative {
  return {
    ...child,
    introduction: filterBlocksByAudience(child.introduction || [], audience),
    personalProfile: filterBlocksByAudience(child.personalProfile || [], audience),
    education: filterBlocksByAudience(child.education || [], audience),
    healthcare: filterBlocksByAudience(child.healthcare || [], audience),
    supportTransition: filterBlocksByAudience(child.supportTransition || [], audience),
    peopleAndConnections: filterBlocksByAudience(child.peopleAndConnections || [], audience),
    activities: filterBlocksByAudience(child.activities || [], audience),
    communitiesAndTraditions: filterBlocksByAudience(child.communitiesAndTraditions || [], audience),
    inheritance: filterBlocksByAudience(child.inheritance || [], audience),
    adultTransition: filterBlocksByAudience(child.adultTransition || [], audience),
    futureEducation: filterBlocksByAudience(child.futureEducation || [], audience),
  };
}

export function getNarrativeForAudience(
  narrative: GuardianshipNarrativeModel,
  audience: GuardianshipAudience
): GuardianshipNarrativeModel {
  return {
    familyContext: filterBlocksByAudience(narrative.familyContext, audience),
    guardianPlan: filterBlocksByAudience(narrative.guardianPlan, audience),
    children: narrative.children.map(c => filterChildByAudience(c, audience)),
    familyRoles: filterBlocksByAudience(narrative.familyRoles, audience),
    financialResources: filterBlocksByAudience(narrative.financialResources, audience),
    fundingPhilosophy: filterBlocksByAudience(narrative.fundingPhilosophy, audience),
    coordination: filterBlocksByAudience(narrative.coordination, audience),
    documents: filterBlocksByAudience(narrative.documents, audience),
    readiness: {
      decisionsMade: filterBlocksByAudience(narrative.readiness.decisionsMade, audience),
      thingsWorthConfirming: filterBlocksByAudience(narrative.readiness.thingsWorthConfirming, audience),
      thingsStillToDo: filterBlocksByAudience(narrative.readiness.thingsStillToDo, audience),
    },
    immediateActions: narrative.immediateActions,
    quickReference: narrative.quickReference,
  };
}

// ─── Guardian Trust: Why We Chose You / Trust Message / If Needed ─────────────

function buildGuardianTrustNarrative(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const trust = model.guardianTrust;
  if (!trust) return [];
  if (!trust.selectionReason && !trust.trustMessage && !trust.ifNeededMessage) return [];

  const blocks: NarrativeBlock[] = [];
  const assignment = model.guardianAssignments[0];
  const guardianName = assignment ? guardianLabel(assignment) : 'the Guardian';

  // WHY WE CHOSE YOU — selection reason
  if (trust.selectionReason && !isLowInformationText(trust.selectionReason)) {
    blocks.push(makeBlock('GUARDIAN-TRUST-01', 'intro', 'primary', 'parentPreference', {
      heading: 'Why We Chose You',
      body: `${parentLabel} chose ${guardianName} for reasons that matter deeply to them.`,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
    blocks.push(makeBlock('GUARDIAN-TRUST-01', 'parentVoice', 'primary', 'parentPreference', {
      heading: 'In Their Own Words',
      body: trust.selectionReason,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Trust message — what the trust means
  if (trust.trustMessage && !isLowInformationText(trust.trustMessage)) {
    blocks.push(makeBlock('GUARDIAN-TRUST-02', 'parentVoice', 'primary', 'parentPreference', {
      heading: 'What This Trust Means to Us',
      body: trust.trustMessage,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // If needed message — for the day they might have to step in
  if (trust.ifNeededMessage && !isLowInformationText(trust.ifNeededMessage)) {
    blocks.push(makeBlock('GUARDIAN-TRUST-03', 'parentVoice', 'primary', 'parentPreference', {
      heading: 'If This Day Ever Comes',
      body: trust.ifNeededMessage,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return blocks;
}

// ─── Family Fairness: Life in the Guardian Household ──────────────────────────

const FAMILY_FAIRNESS_LABELS: Record<string, string> = {
  preserve_important_opportunities: 'preserving important existing opportunities for their children where resources allow',
  prioritize_need_based: 'giving particular priority to expenses connected to disability, health, education, learning or wellbeing',
  consider_whole_household: 'considering how significant differences could affect all of the children living in the household',
  guardian_flexibility: 'giving the Guardian meaningful flexibility to adapt their wishes to the realities of their family',
  shared_household_benefit_reasonable: 'being comfortable with some spending that also benefits the Guardian\'s family when it helps the household function well',
  childrens_resources_for_them: 'generally preferring resources intended for their children to remain primarily for their benefit',
  discuss_significant_differences: 'discussing significant differences rather than treating their wishes as rigid instructions',
};

function buildFamilyFairnessNarrative(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const ff = model.familyFairness;
  if (!ff) return [];
  const principles = ff.principles || [];
  if (principles.length === 0 && !ff.details) return [];

  const blocks: NarrativeBlock[] = [];
  const assignment = model.guardianAssignments[0];
  const guardianName = assignment ? guardianLabel(assignment) : 'the Guardian';
  const childNames = model.children.filter(c => c.status === 'minor').map(c => c.nickname || c.name);
  const childLabel = childNames.length === 1 ? childNames[0] : childNames.join(' and ');

  blocks.push(makeBlock('FAIRNESS-01', 'context', 'primary', 'parentPreference', {
    heading: 'Becoming Part of Your Family',
    body: `${childLabel} ${childNames.length === 1 ? 'would not simply be living in another house —' : 'would not simply be living in another house —'} ${childNames.length === 1 ? 'they' : 'they'} would be joining another family. ${parentLabel} have thought about how differences in resources or opportunities could affect everyone in the household.`,
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
  }));

  if (principles.length > 0) {
    const labels = principles
      .filter(p => p !== 'other')
      .map(p => FAMILY_FAIRNESS_LABELS[p] || p.replace(/_/g, ' '));

    if (labels.length > 0) {
      const list = labels.length === 1
        ? labels[0]
        : labels.length === 2
          ? `${labels[0]} and ${labels[1]}`
          : `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;

      blocks.push(makeBlock('FAIRNESS-01', 'context', 'important', 'parentPreference', {
        body: `${parentLabel} would want ${guardianName} and the Trustee to approach these situations by: ${list}.`,
        audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES, ...TRUSTEE_AUDIENCES],
      }));
    }

    if (ff.principlesOther && !isLowInformationText(ff.principlesOther)) {
      blocks.push(makeBlock('FAIRNESS-01', 'parentVoice', 'important', 'parentPreference', {
        heading: 'In Their Own Words',
        body: ff.principlesOther,
        audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
      }));
    }
  }

  if (ff.details && !isLowInformationText(ff.details)) {
    blocks.push(makeBlock('FAIRNESS-01', 'parentVoice', 'important', 'parentPreference', {
      heading: 'In Their Own Words',
      body: ff.details,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  // Professional review: Guardian/Trustee discussion boundary
  if (principles.includes('discuss_significant_differences')) {
    blocks.push(makeBlock('FAIRNESS-01', 'readiness', 'supporting', 'professionalReview', {
      body: 'Where financial decisions are involved, the Guardian should discuss significant funding decisions with the Trustee. The Roadmap expresses parental wishes — it does not grant spending authority. Legal authority depends on the Will, trust terms, and applicable law.',
      audiences: [...GUARDIAN_AUDIENCES, ...TRUSTEE_AUDIENCES, ...LAWYER_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return blocks;
}

// ─── Guardian Discretion: What We Trust You to Decide ─────────────────────────

function buildGuardianDiscretionNarrative(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const disc = model.guardianDiscretion;
  if (!disc) return [];
  if (!disc.trustedDecisions && !disc.especiallyImportantWishes) return [];

  const blocks: NarrativeBlock[] = [];
  const assignment = model.guardianAssignments[0];
  const guardianName = assignment ? guardianLabel(assignment) : 'the Guardian';

  blocks.push(makeBlock('DISCRETION-01', 'context', 'primary', 'parentPreference', {
    heading: 'What We Trust You to Decide',
    body: `No Roadmap prepared today can anticipate the circumstances ${guardianName} may face years from now. The wishes throughout this document matter, but ${parentLabel} have also identified areas where they want ${guardianName} to feel trusted to use their own judgment.`,
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
  }));

  if (disc.trustedDecisions && !isLowInformationText(disc.trustedDecisions)) {
    blocks.push(makeBlock('DISCRETION-01', 'parentVoice', 'primary', 'parentPreference', {
      heading: 'In Their Own Words',
      body: disc.trustedDecisions,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  if (disc.especiallyImportantWishes && !isLowInformationText(disc.especiallyImportantWishes)) {
    blocks.push(makeBlock('DISCRETION-02', 'parentVoice', 'important', 'parentPreference', {
      heading: 'What Matters Most to Us',
      body: disc.especiallyImportantWishes,
      audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
    }));
  }

  return blocks;
}

// ─── Conversation Prompts: Questions to Talk Through Together ─────────────────

function buildConversationPrompts(ctx: NarrativeContext): NarrativeBlock[] {
  const { model, parentLabel } = ctx;
  const blocks: NarrativeBlock[] = [];
  const prompts: string[] = [];

  const assignment = model.guardianAssignments[0];
  const guardianName = assignment ? guardianLabel(assignment) : 'the Guardian';

  for (const child of model.children.filter(c => c.status === 'minor')) {
    const name = child.nickname || child.name;
    const et = child.educationTransition;
    const ef = child.educationFairness;

    // Private school + flexibility/fairness
    if (et?.settingType === 'private' && (et.educationImportance === 'strong_preference' || et.educationImportance === 'preference_with_flexibility')) {
      prompts.push(`How would everyone want to approach ${name}'s schooling if ${name}'s current private school no longer fit comfortably with life in ${guardianName}'s household?`);
    }

    // Specialized school + disability
    if (et?.settingType === 'specialized_therapeutic' && et.settingReasons?.includes('disability_support')) {
      prompts.push(`What parts of ${name}'s current educational support would ${parentLabel} consider most important to preserve if the specific school or program had to change?`);
    }

    // Education fairness — Guardian/Trustee discussion
    if (ef?.principles?.includes('guardian_trustee_discussion')) {
      prompts.push(`How should ${guardianName} and the Trustee approach significant schooling decisions for ${name} together?`);
    }

    // Important friendships + likely move
    const moveLikely = assignment?.moveStatus === 'likely' || assignment?.moveStatus === 'possible';
    const importantConns = (child.importantConnections || []).filter(c => c.importance === 'especially_important' && c.name);
    if (moveLikely && importantConns.length > 0) {
      prompts.push(`What would realistically help ${name} maintain ${importantConns.length === 1 ? `the relationship with ${importantConns[0].name}` : 'close relationships with important people'} after a move?`);
    }
  }

  // Adult sibling role
  if (model.adultSiblingRoles.length > 0) {
    for (const role of model.adultSiblingRoles) {
      prompts.push(`What role does everyone realistically expect ${role.adultSiblingName} to play in the younger children's lives?`);
      break; // One prompt for siblings
    }
  }

  // Guardian/Trustee + household expenses
  const ff = model.familyFairness;
  if (ff?.principles?.includes('discuss_significant_differences')) {
    const childNames = model.children.filter(c => c.status === 'minor').map(c => c.nickname || c.name);
    const childLabel = childNames.length > 0 ? childNames.join(' and ') : 'the children';
    prompts.push(`How should ${guardianName} and the Trustee approach larger household expenses if caring for ${childLabel} required changes to the home or work arrangements?`);
  }

  if (prompts.length === 0) return [];

  // Keep to 3-6 high-value questions
  const selected = prompts.slice(0, 6);

  blocks.push(makeBlock('CONVERSATION-01', 'context', 'important', 'derived', {
    heading: 'Questions to Talk Through Together',
    body: `These questions are conversation prompts — not warnings or legal advice. They are generated from ${parentLabel}'s actual family circumstances and are meant to help everyone think through important topics while ${parentLabel} are still available to discuss them.`,
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
  }));

  blocks.push(makeBlock('CONVERSATION-01', 'summary', 'important', 'derived', {
    bullets: selected,
    audiences: [...GUARDIAN_AUDIENCES, ...CLIENT_PLANNING_AUDIENCES],
  }));

  return blocks;
}

export function buildGuardianshipNarrative(model: GuardianshipRoadmapModel): GuardianshipNarrativeModel {
  blockCounter = 0;

  const clientNames = model.family.clientNames;
  const parentLabel = getParentLabel(clientNames);
  const ctx: NarrativeContext = { model, clientNames, parentLabel };

  const familyContext = buildFamilyContext(ctx);
  const guardianPlan = buildGuardianPlan(ctx);
  const children = model.children
    .filter(c => c.status === 'minor')
    .map(c => buildChildNarrative(c, ctx));
  const familyRoles = buildFamilyRoles(ctx);
  const financialResources = buildFinancialResources(ctx);
  const documents = buildDocuments(ctx);
  const readiness = buildReadiness(ctx);
  const immediateActions = buildImmediateActions(ctx);
  const quickReference = buildQuickReference(ctx);

  const fundingPhilosophy = buildFundingPhilosophyNarrative(ctx);
  const coordination = buildCoordinationNarrative(ctx);
  const guardianTrust = buildGuardianTrustNarrative(ctx);
  const familyFairness = buildFamilyFairnessNarrative(ctx);
  const guardianDiscretion = buildGuardianDiscretionNarrative(ctx);
  const conversationPrompts = buildConversationPrompts(ctx);

  return {
    familyContext,
    guardianPlan,
    children,
    familyRoles,
    financialResources,
    fundingPhilosophy,
    coordination,
    documents,
    guardianTrust,
    familyFairness,
    guardianDiscretion,
    conversationPrompts,
    readiness,
    immediateActions,
    quickReference,
  };
}
