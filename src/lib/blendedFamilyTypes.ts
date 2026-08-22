import type { PlanningFlag } from './currentWillTypes';
import { getSectionAnswers } from './steps';

type AnswersMap = Map<string, Record<string, unknown>>;

export interface FamilyComplexityProfile {
  hasPriorRelationship: boolean;
  hasPrenupOrDomesticAgreement: boolean;

  client1PaysSpousalSupport: boolean;
  client1ReceivesSpousalSupport: boolean;
  client2PaysSpousalSupport: boolean;
  client2ReceivesSpousalSupport: boolean;

  client1PaysChildSupport: boolean;
  client1ReceivesChildSupport: boolean;
  client2PaysChildSupport: boolean;
  client2ReceivesChildSupport: boolean;

  hasChildrenFromPriorRelationship: boolean;

  client1HasOwnChildren: boolean;
  client2HasOwnChildren: boolean;
  hasSharedChildren: boolean;

  hasBlendedFamily: boolean;
  needsPriorObligationReview: boolean;
  needsBlendedFamilyWillReview: boolean;
}

export interface SupportObligation {
  id: string;
  payerPersonId: string;
  payerName: string;
  recipientPersonId: string;
  recipientName: string;
  type: 'spousal_support' | 'child_support';
  amount?: string;
  frequency?: string;
  reviewOrEndDate?: string;
  documentLocation?: string;
  clientId: 'client1' | 'client2';
  source: 'previousRelationships' | 'children';
}

export interface DomesticAgreement {
  id: string;
  type: 'prenuptial' | 'marriage_contract' | 'cohabitation' | 'separation' | 'domestic_contract' | 'other';
  documentLocation?: string;
  clientId: 'client1' | 'client2';
}

export interface ChildParentage {
  childId: string;
  childName: string;
  parent1Id: string;
  parent2Id?: string;
  otherParentId?: string;
  otherParentName?: string;
  isShared: boolean;
  client1IsParent: boolean;
  client2IsParent: boolean;
  fromPriorRelationship: boolean;
  priorRelationshipClientId?: 'client1' | 'client2';
}

export interface BlendedFamilyPlanningContext {
  profile: FamilyComplexityProfile;
  childParentage: ChildParentage[];
  supportObligations: SupportObligation[];
  domesticAgreements: DomesticAgreement[];

  client1PriorRelationshipChildIds: string[];
  client2PriorRelationshipChildIds: string[];
  sharedChildIds: string[];

  client1ChildProtectionIntent?: ChildProtectionIntent;
  client2ChildProtectionIntent?: ChildProtectionIntent;

  survivorControlUnderstanding?: SurvivorControlUnderstanding;
  remarriageConcern?: RemarriageConcern;
  currentWillAlignment?: DomesticAgreementAlignment;
  treatChildrenSameWay?: TreatChildrenSameWay;
  childrenTreatmentDifferences?: string;

  mirrorWillRiskUnderstanding?: SurvivorControlUnderstanding;
}

export type ChildProtectionIntent = 'yes' | 'no' | 'not_necessarily' | 'not_sure';
export type ProtectionMechanism =
  | 'direct_on_death'
  | 'assets_set_aside'
  | 'held_in_trust'
  | 'after_surviving_spouse'
  | 'life_insurance'
  | 'another_arrangement'
  | 'not_sure';

export type SurvivorControlUnderstanding = 'yes' | 'no' | 'not_sure' | 'not_discussed';
export type DomesticAgreementAlignment = 'yes' | 'no' | 'not_sure' | 'not_discussed';
export type TreatChildrenSameWay = 'yes' | 'no' | 'mostly_with_differences' | 'not_sure';
export type FirstDeathPassToSpouse = 'yes_substantially_all' | 'mostly_with_exceptions' | 'no' | 'not_sure';

export interface BlendedFamilyAnswers {
  client1FirstDeathPassToSpouse?: FirstDeathPassToSpouse;
  client1ChildProtectionIntent?: ChildProtectionIntent;
  client1ProtectionMechanism?: ProtectionMechanism;
  client2FirstDeathPassToSpouse?: FirstDeathPassToSpouse;
  client2ChildProtectionIntent?: ChildProtectionIntent;
  client2ProtectionMechanism?: ProtectionMechanism;
  survivorControlUnderstanding?: SurvivorControlUnderstanding;
  remarriageConcern?: RemarriageConcern;
  currentWillAlignment?: DomesticAgreementAlignment;
  supportObligationAlignment?: DomesticAgreementAlignment;
  treatChildrenSameWay?: TreatChildrenSameWay;
  childrenTreatmentDifferences?: string;
  mirrorWillRiskUnderstanding?: SurvivorControlUnderstanding;
}

export type RemarriageConcern = 'yes' | 'no' | 'not_necessarily' | 'not_considered' | 'not_sure';

function hasClient2(aboutYou: Record<string, unknown>): boolean {
  const status = aboutYou['maritalStatus'] as string;
  return status === 'married' || status === 'common_law';
}

function getChildrenData(allAnswers: QuestionnaireAnswers): Array<Record<string, string>> {
  const childrenSection = getSectionAnswers(allAnswers, 'children');
  return (childrenSection['childrenData'] as Array<Record<string, string>>) || [];
}

function getClient1PrevRels(allAnswers: QuestionnaireAnswers): Array<Record<string, string>> {
  const prevSection = getSectionAnswers(allAnswers, 'previousRelationships');
  return (prevSection['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
}

function getClient2PrevRels(allAnswers: QuestionnaireAnswers): Array<Record<string, string>> {
  const prevSection = getSectionAnswers(allAnswers, 'previousRelationships');
  return (prevSection['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
}

export function getChildParentage(
  allAnswers: AnswersMap,
): ChildParentage[] {
  const aboutYou = getSectionAnswers(allAnswers, 'aboutYou');
  const hasC2 = hasClient2(aboutYou);
  const childrenData = getChildrenData(allAnswers);

  return childrenData.map((child, i) => {
    const childId = `child_${i}`;
    const childName = child['name'] || child['nickname'] || `Child ${i + 1}`;
    const parentsOption = child['parentsOption'] as string;

    let parent1Id = 'client1';
    let parent2Id: string | undefined = hasC2 ? 'client2' : undefined;
    let otherParentId: string | undefined;
    let otherParentName: string | undefined;
    let isShared = false;
    let client1IsParent = false;
    let client2IsParent = false;
    let fromPriorRelationship = false;
    let priorRelationshipClientId: 'client1' | 'client2' | undefined;

    if (parentsOption === 'both') {
      parent1Id = 'client1';
      parent2Id = hasC2 ? 'client2' : undefined;
      isShared = hasC2;
      client1IsParent = true;
      client2IsParent = hasC2;
    } else if (parentsOption === 'parent1') {
      parent1Id = 'client1';
      parent2Id = undefined;
      client1IsParent = true;
      client2IsParent = false;
    } else if (parentsOption === 'client1-other') {
      parent1Id = 'client1';
      otherParentName = child['otherParentName'];
      otherParentId = otherParentName ? `c1prev_other_${i}` : undefined;
      client1IsParent = true;
      client2IsParent = false;
      fromPriorRelationship = true;
      priorRelationshipClientId = 'client1';
    } else if (parentsOption === 'client2-other') {
      parent1Id = 'client2';
      otherParentName = child['otherParentName'];
      otherParentId = otherParentName ? `c2prev_other_${i}` : undefined;
      client1IsParent = false;
      client2IsParent = true;
      fromPriorRelationship = true;
      priorRelationshipClientId = 'client2';
    } else {
      client1IsParent = true;
      client2IsParent = hasC2;
      isShared = hasC2;
    }

    return {
      childId,
      childName,
      parent1Id,
      parent2Id,
      otherParentId,
      otherParentName,
      isShared,
      client1IsParent,
      client2IsParent,
      fromPriorRelationship,
      priorRelationshipClientId,
    };
  });
}

export function getSupportObligations(
  allAnswers: AnswersMap,
): SupportObligation[] {
  const aboutYou = getSectionAnswers(allAnswers, 'aboutYou');
  const hasC2 = hasClient2(aboutYou);
  const obligations: SupportObligation[] = [];

  const client1PrevRels = getClient1PrevRels(allAnswers);
  client1PrevRels.forEach((rel, i) => {
    if (rel['hasSpousalSupport'] === 'yes') {
      obligations.push({
        id: `c1_spousal_${i}`,
        payerPersonId: 'client1',
        payerName: (aboutYou['fullName'] as string) || 'Client 1',
        recipientPersonId: `c1prev_${i}`,
        recipientName: rel['name'] || 'Former Partner',
        type: 'spousal_support',
        documentLocation: rel['supportDocumentLocation'] || undefined,
        clientId: 'client1',
        source: 'previousRelationships',
      });
    }
  });

  if (hasC2) {
    const client2PrevRels = getClient2PrevRels(allAnswers);
    client2PrevRels.forEach((rel, i) => {
      if (rel['hasSpousalSupport'] === 'yes') {
        obligations.push({
          id: `c2_spousal_${i}`,
          payerPersonId: 'client2',
          payerName: (aboutYou['spouseName'] as string) || 'Client 2',
          recipientPersonId: `c2prev_${i}`,
          recipientName: rel['name'] || 'Former Partner',
          type: 'spousal_support',
          documentLocation: rel['supportDocumentLocation'] || undefined,
          clientId: 'client2',
          source: 'previousRelationships',
        });
      }
    });
  }

  const childrenData = getChildrenData(allAnswers);
  childrenData.forEach((child, i) => {
    const supportStatus = child['childSupportStatus'] as string;
    if (!supportStatus) return;
    const childId = `child_${i}`;
    const childName = child['name'] || `Child ${i + 1}`;
    const docLocation = child['childSupportDocLocation'] || undefined;
    const parentsOption = child['parentsOption'] as string;

    const pays = supportStatus === 'paying' || supportStatus === 'yes_paying';
    const receives = supportStatus === 'receiving' || supportStatus === 'yes_receiving';

    if (pays || receives) {
      let payerId = 'client1';
      let recipientId = `c1prev_${i}`;
      let clientId: 'client1' | 'client2' = 'client1';

      if (parentsOption === 'client1-other') {
        if (pays) { payerId = 'client1'; recipientId = `c1prev_other_${i}`; }
        else { payerId = `c1prev_other_${i}`; recipientId = 'client1'; }
        clientId = 'client1';
      } else if (parentsOption === 'client2-other') {
        if (pays) { payerId = 'client2'; recipientId = `c2prev_other_${i}`; }
        else { payerId = `c2prev_other_${i}`; recipientId = 'client2'; }
        clientId = 'client2';
      } else if (parentsOption === 'parent1') {
        if (pays) { payerId = 'client1'; recipientId = `child_otherparent_${i}`; }
        else { payerId = `child_otherparent_${i}`; recipientId = 'client1'; }
      }

      obligations.push({
        id: `${childId}_support`,
        payerPersonId: payerId,
        payerName: payerId === 'client1' ? (aboutYou['fullName'] as string) || 'Client 1'
          : payerId === 'client2' ? (aboutYou['spouseName'] as string) || 'Client 2'
          : child['otherParentName'] || 'Other Parent',
        recipientPersonId: recipientId,
        recipientName: recipientId.startsWith('client') ? (aboutYou[recipientId === 'client1' ? 'fullName' : 'spouseName'] as string) || 'Client'
          : child['otherParentName'] || 'Other Parent',
        type: 'child_support',
        documentLocation: docLocation,
        clientId,
        source: 'children',
      });
    }
  });

  return obligations;
}

export function getDomesticAgreements(
  allAnswers: AnswersMap,
): DomesticAgreement[] {
  const aboutYou = getSectionAnswers(allAnswers, 'aboutYou');
  const agreements: DomesticAgreement[] = [];

  if (aboutYou['hasMarriageContract'] === 'yes') {
    agreements.push({
      id: 'domestic_marriage_contract',
      type: 'marriage_contract',
      documentLocation: (aboutYou['marriageContractLocation'] as string) || undefined,
      clientId: 'client1',
    });
  }

  const client1PrevRels = getClient1PrevRels(allAnswers);
  client1PrevRels.forEach((rel, i) => {
    if (rel['supportDocumentLocation']) {
      agreements.push({
        id: `c1_separation_${i}`,
        type: 'separation',
        documentLocation: rel['supportDocumentLocation'],
        clientId: 'client1',
      });
    }
  });

  const client2PrevRels = getClient2PrevRels(allAnswers);
  client2PrevRels.forEach((rel, i) => {
    if (rel['supportDocumentLocation']) {
      agreements.push({
        id: `c2_separation_${i}`,
        type: 'separation',
        documentLocation: rel['supportDocumentLocation'],
        clientId: 'client2',
      });
    }
  });

  const childrenData = getChildrenData(allAnswers);
  childrenData.forEach((child, i) => {
    if (child['childSupportDocLocation']) {
      agreements.push({
        id: `child_support_agreement_${i}`,
        type: 'other',
        documentLocation: child['childSupportDocLocation'],
        clientId: child['parentsOption'] === 'client2-other' ? 'client2' : 'client1',
      });
    }
  });

  return agreements;
}

export function getFamilyComplexityProfile(
  allAnswers: AnswersMap,
): FamilyComplexityProfile {
  const aboutYou = getSectionAnswers(allAnswers, 'aboutYou');
  const hasC2 = hasClient2(aboutYou);

  const client1PrevRels = getClient1PrevRels(allAnswers);
  const client2PrevRels = getClient2PrevRels(allAnswers);

  const hasPriorRelationship =
    aboutYou['client1HasPreviousRelationship'] === 'yes' ||
    (hasC2 && aboutYou['client2HasPreviousRelationship'] === 'yes') ||
    client1PrevRels.length > 0 ||
    client2PrevRels.length > 0;

  const hasPrenupOrDomesticAgreement =
    aboutYou['hasMarriageContract'] === 'yes' ||
    client1PrevRels.some(r => r['supportDocumentLocation']) ||
    client2PrevRels.some(r => r['supportDocumentLocation']);

  const c1PaysSpousal = client1PrevRels.some(r => r['hasSpousalSupport'] === 'yes');
  const c2PaysSpousal = client2PrevRels.some(r => r['hasSpousalSupport'] === 'yes');

  const childrenData = getChildrenData(allAnswers);
  const parentage = getChildParentage(allAnswers);

  const client1HasOwnChildren = parentage.some(p => p.client1IsParent);
  const client2HasOwnChildren = hasC2 && parentage.some(p => p.client2IsParent);
  const hasSharedChildren = parentage.some(p => p.isShared);

  const c1PriorChildren = parentage.filter(p => p.fromPriorRelationship && p.priorRelationshipClientId === 'client1');
  const c2PriorChildren = parentage.filter(p => p.fromPriorRelationship && p.priorRelationshipClientId === 'client2');
  const hasChildrenFromPriorRelationship = c1PriorChildren.length > 0 || c2PriorChildren.length > 0;

  const hasBlendedFamily =
    hasChildrenFromPriorRelationship ||
    (hasC2 && c1PriorChildren.length > 0 && parentage.some(p => p.isShared)) ||
    (hasC2 && c2PriorChildren.length > 0 && parentage.some(p => p.isShared)) ||
    (hasC2 && client1HasOwnChildren && client2HasOwnChildren && !hasSharedChildren);

  const childSupportObligations = getSupportObligations(allAnswers).filter(o => o.type === 'child_support');

  const client1PaysChildSupport = childSupportObligations.some(o => o.clientId === 'client1' && o.payerPersonId === 'client1');
  const client1ReceivesChildSupport = childSupportObligations.some(o => o.clientId === 'client1' && o.recipientPersonId === 'client1');
  const client2PaysChildSupport = childSupportObligations.some(o => o.clientId === 'client2' && o.payerPersonId === 'client2');
  const client2ReceivesChildSupport = childSupportObligations.some(o => o.clientId === 'client2' && o.recipientPersonId === 'client2');

  const supportObligations = getSupportObligations(allAnswers);
  const needsPriorObligationReview = supportObligations.length > 0 || hasPrenupOrDomesticAgreement;
  const needsBlendedFamilyWillReview = hasBlendedFamily || hasChildrenFromPriorRelationship;

  return {
    hasPriorRelationship,
    hasPrenupOrDomesticAgreement,
    client1PaysSpousalSupport: c1PaysSpousal,
    client1ReceivesSpousalSupport: false,
    client2PaysSpousalSupport: c2PaysSpousal,
    client2ReceivesSpousalSupport: false,
    client1PaysChildSupport,
    client1ReceivesChildSupport,
    client2PaysChildSupport,
    client2ReceivesChildSupport,
    hasChildrenFromPriorRelationship,
    hasBlendedFamily,
    client1HasOwnChildren,
    client2HasOwnChildren,
    hasSharedChildren,
    needsPriorObligationReview,
    needsBlendedFamilyWillReview,
  };
}

export function buildBlendedFamilyContext(
  allAnswers: AnswersMap,
  blendedAnswers?: BlendedFamilyAnswers,
): BlendedFamilyPlanningContext {
  const profile = getFamilyComplexityProfile(allAnswers);
  const childParentage = getChildParentage(allAnswers);
  const supportObligations = getSupportObligations(allAnswers);
  const domesticAgreements = getDomesticAgreements(allAnswers);

  const client1PriorRelationshipChildIds = childParentage
    .filter(p => p.fromPriorRelationship && p.priorRelationshipClientId === 'client1')
    .map(p => p.childId);
  const client2PriorRelationshipChildIds = childParentage
    .filter(p => p.fromPriorRelationship && p.priorRelationshipClientId === 'client2')
    .map(p => p.childId);
  const sharedChildIds = childParentage.filter(p => p.isShared).map(p => p.childId);

  return {
    profile,
    childParentage,
    supportObligations,
    domesticAgreements,
    client1PriorRelationshipChildIds,
    client2PriorRelationshipChildIds,
    sharedChildIds,
    client1ChildProtectionIntent: blendedAnswers?.client1ChildProtectionIntent,
    client2ChildProtectionIntent: blendedAnswers?.client2ChildProtectionIntent,
    survivorControlUnderstanding: blendedAnswers?.survivorControlUnderstanding,
    remarriageConcern: blendedAnswers?.remarriageConcern,
    currentWillAlignment: blendedAnswers?.currentWillAlignment,
    treatChildrenSameWay: blendedAnswers?.treatChildrenSameWay,
    childrenTreatmentDifferences: blendedAnswers?.childrenTreatmentDifferences,
    mirrorWillRiskUnderstanding: blendedAnswers?.mirrorWillRiskUnderstanding,
  };
}

export function generateBlendedFamilyFlags(
  allAnswers: AnswersMap,
  blendedAnswers: BlendedFamilyAnswers | undefined,
  willFirstDeath?: Record<'client1' | 'client2', string | undefined>,
): PlanningFlag[] {
  const profile = getFamilyComplexityProfile(allAnswers);
  const obligations = getSupportObligations(allAnswers);
  const domesticAgreements = getDomesticAgreements(allAnswers);
  const flags: PlanningFlag[] = [];

  if (!profile.needsPriorObligationReview && !profile.needsBlendedFamilyWillReview) {
    return flags;
  }

  for (const obligation of obligations) {
    const obligationLocationUnknown = !obligation.documentLocation;
    const isEscalated =
      obligationLocationUnknown ||
      (blendedAnswers?.supportObligationAlignment === 'no') ||
      (blendedAnswers?.supportObligationAlignment === 'not_sure') ||
      (blendedAnswers?.supportObligationAlignment === 'not_discussed');

    if (isEscalated) {
      flags.push({
        ruleId: 'BLENDED-SUPPORT-ESCALATED-01',
        severity: 'red',
        title: 'Support Obligation Review',
        observation: `An ongoing ${obligation.type === 'spousal_support' ? 'spousal support' : 'child support'} obligation has been identified${obligationLocationUnknown ? ' and the governing document location is unknown' : ''}. Make sure your Attorney for Property, Estate Trustee and estate-planning lawyer can identify the obligation and locate the governing agreement or order.`,
        context: `${obligation.payerName} pays ${obligation.recipientName}. ${blendedAnswers?.supportObligationAlignment ? `Client believes estate plan ${blendedAnswers.supportObligationAlignment === 'yes' ? 'addresses' : 'may not address'} this obligation.` : ''}`,
        clientId: obligation.clientId,
      });
    } else {
      flags.push({
        ruleId: 'BLENDED-SUPPORT-01',
        severity: 'yellow',
        title: 'Ongoing Support Obligation',
        observation: `An ongoing ${obligation.type === 'spousal_support' ? 'spousal support' : 'child support'} obligation has been identified. Make sure your Attorney for Property, Estate Trustee and estate-planning lawyer can identify the obligation and locate the governing agreement or order.`,
        context: `${obligation.payerName} pays ${obligation.recipientName}.`,
        clientId: obligation.clientId,
      });
    }
  }

  if (profile.hasBlendedFamily) {
    const c1Prior = profile.client1HasOwnChildren && !profile.hasSharedChildren;
    const c1WantsProtection = blendedAnswers?.client1ChildProtectionIntent === 'yes';
    const c1FirstDeathSpouse = willFirstDeath?.client1 === 'all_to_spouse' || willFirstDeath?.client1 === 'mostly_to_spouse' ||
      blendedAnswers?.client1FirstDeathPassToSpouse === 'yes_substantially_all' || blendedAnswers?.client1FirstDeathPassToSpouse === 'mostly_with_exceptions';
    const c1ProtectionUnclear = blendedAnswers?.client1ProtectionMechanism === 'not_sure' || !blendedAnswers?.client1ProtectionMechanism;

    if (c1WantsProtection && c1FirstDeathSpouse) {
      flags.push({
        ruleId: 'BLENDED-FIRST-DEATH-01',
        severity: 'red',
        title: 'Blended Family Estate Review',
        observation: `You indicated that most or all of the estate may pass to the surviving spouse on first death, while also wanting assets to ultimately reach children from a previous relationship. Consider confirming with your estate lawyer how those intentions are protected after the first death.`,
        clientId: 'client1',
      });
    } else if (c1WantsProtection && c1ProtectionUnclear && !c1FirstDeathSpouse) {
      flags.push({
        ruleId: 'BLENDED-PROTECTION-UNCLEAR-01',
        severity: 'yellow',
        title: "Children's Inheritance Protection",
        observation: `You want assets to ultimately reach children from a previous relationship, but it is unclear how the current estate plan accomplishes this. Consider reviewing with your estate lawyer.`,
        clientId: 'client1',
      });
    }

    const c2Prior = profile.client2HasOwnChildren && !profile.hasSharedChildren;
    const c2WantsProtection = blendedAnswers?.client2ChildProtectionIntent === 'yes';
    const c2FirstDeathSpouse = willFirstDeath?.client2 === 'all_to_spouse' || willFirstDeath?.client2 === 'mostly_to_spouse' ||
      blendedAnswers?.client2FirstDeathPassToSpouse === 'yes_substantially_all' || blendedAnswers?.client2FirstDeathPassToSpouse === 'mostly_with_exceptions';
    const c2ProtectionUnclear = blendedAnswers?.client2ProtectionMechanism === 'not_sure' || !blendedAnswers?.client2ProtectionMechanism;

    if (c2WantsProtection && c2FirstDeathSpouse) {
      flags.push({
        ruleId: 'BLENDED-FIRST-DEATH-02',
        severity: 'red',
        title: 'Blended Family Estate Review',
        observation: `You indicated that most or all of the estate may pass to the surviving spouse on first death, while also wanting assets to ultimately reach children from a previous relationship. Consider confirming with your estate lawyer how those intentions are protected after the first death.`,
        clientId: 'client2',
      });
    } else if (c2WantsProtection && c2ProtectionUnclear && !c2FirstDeathSpouse) {
      flags.push({
        ruleId: 'BLENDED-PROTECTION-UNCLEAR-02',
        severity: 'yellow',
        title: "Children's Inheritance Protection",
        observation: `You want assets to ultimately reach children from a previous relationship, but it is unclear how the current estate plan accomplishes this. Consider reviewing with your estate lawyer.`,
        clientId: 'client2',
      });
    }

    if (c1WantsProtection && (blendedAnswers?.survivorControlUnderstanding === 'yes' || blendedAnswers?.survivorControlUnderstanding === 'not_sure')) {
      flags.push({
        ruleId: 'BLENDED-SURVIVOR-CONTROL-01',
        severity: 'red',
        title: 'Ultimate Beneficiary Control',
        observation: `You indicated that the surviving spouse may have the ability to change who ultimately receives inherited assets, while also wanting part of the estate preserved for children from a previous relationship. Consider reviewing with your estate lawyer whether the current structure provides the level of protection you intend.`,
        clientId: 'client1',
      });
    }

    if (c2WantsProtection && (blendedAnswers?.survivorControlUnderstanding === 'yes' || blendedAnswers?.survivorControlUnderstanding === 'not_sure')) {
      flags.push({
        ruleId: 'BLENDED-SURVIVOR-CONTROL-02',
        severity: 'red',
        title: 'Ultimate Beneficiary Control',
        observation: `You indicated that the surviving spouse may have the ability to change who ultimately receives inherited assets, while also wanting part of the estate preserved for children from a previous relationship. Consider reviewing with your estate lawyer whether the current structure provides the level of protection you intend.`,
        clientId: 'client2',
      });
    }

    if (blendedAnswers?.mirrorWillRiskUnderstanding === 'no' || blendedAnswers?.mirrorWillRiskUnderstanding === 'not_sure') {
      flags.push({
        ruleId: 'BLENDED-MIRROR-01',
        severity: 'yellow',
        title: 'Blended Family Will Protection',
        observation: `You indicated that your current Wills may not protect each person's intended inheritance for their own children if the surviving spouse later changes their Will. Consider discussing this with your estate lawyer.`,
      });
    }
  }

  if (profile.hasPrenupOrDomesticAgreement) {
    const alignment = blendedAnswers?.currentWillAlignment;
    if (alignment === 'no' || alignment === 'not_sure' || alignment === 'not_discussed') {
      const agreement = domesticAgreements[0];
      flags.push({
        ruleId: 'BLENDED-DOMESTIC-AGREEMENT-01',
        severity: 'yellow',
        title: 'Estate Plan / Domestic Agreement Alignment',
        observation: `Earlier, you indicated that you have a domestic agreement. You are unsure whether your current Will and estate plan are consistent with this agreement. Consider reviewing this with your estate lawyer.`,
        context: agreement?.documentLocation ? `Document location: ${agreement.documentLocation}` : 'Document location not provided.',
      });
    }
  }

  return flags;
}

export function getBlendedFamilyContext(allAnswers: AnswersMap): BlendedFamilyPlanningContext {
  return buildBlendedFamilyContext(allAnswers, undefined);
}

export function getChildrenOfPerson(allAnswers: AnswersMap, personId: string): ChildParentage[] {
  const parentage = getChildParentage(allAnswers);
  return parentage.filter(p => p.parent1Id === personId || p.parent2Id === personId);
}

export function getSharedChildren(allAnswers: AnswersMap): ChildParentage[] {
  const parentage = getChildParentage(allAnswers);
  return parentage.filter(p => p.isShared);
}

export function getChildrenFromPriorRelationships(allAnswers: AnswersMap, clientId: 'client1' | 'client2'): ChildParentage[] {
  const parentage = getChildParentage(allAnswers);
  return parentage.filter(p => p.fromPriorRelationship && p.priorRelationshipClientId === clientId);
}

export function getProtectionMechanismLabel(mechanism?: ProtectionMechanism): string {
  if (!mechanism) return '';
  switch (mechanism) {
    case 'direct_on_death': return 'They receive something directly when the client dies';
    case 'assets_set_aside': return 'Certain assets are set aside for them';
    case 'held_in_trust': return 'Their inheritance is held in trust';
    case 'after_surviving_spouse': return 'They inherit after the surviving spouse dies';
    case 'life_insurance': return 'Life insurance is intended for them';
    case 'another_arrangement': return 'Another arrangement';
    case 'not_sure': return "I'm not sure";
  }
}

export function getFirstDeathPassToSpouseLabel(value?: FirstDeathPassToSpouse): string {
  if (!value) return '';
  switch (value) {
    case 'yes_substantially_all': return 'Yes, substantially all';
    case 'mostly_with_exceptions': return 'Mostly, with some exceptions';
    case 'no': return 'No';
    case 'not_sure': return "I'm not sure";
  }
}
