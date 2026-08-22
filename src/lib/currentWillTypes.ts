export type ClientUnderstanding =
  | 'believesAligned'
  | 'partiallyAligned'
  | 'notAligned'
  | 'unsure'
  | 'notAddressed';

export type AlignmentSubjectType =
  | 'legacyAsset'
  | 'residue'
  | 'executor'
  | 'guardian'
  | 'childTrust'
  | 'business'
  | 'charity'
  | 'other';

export type EstatePlanAlignment = {
  subjectType: AlignmentSubjectType;
  subjectId?: string;
  subjectLabel?: string;
  intentionSourceId?: string;
  clientUnderstanding: ClientUnderstanding;
  understoodDifference?: unknown;
  needsProfessionalReview: boolean;
};

export type FirstDeathUnderstanding =
  | 'all_to_spouse'
  | 'mostly_to_spouse'
  | 'some_to_spouse_some_to_others'
  | 'another_arrangement'
  | 'not_sure';

export type FirstDeathException = {
  id: string;
  type: 'dollar' | 'percentage' | 'asset' | 'charity' | 'other';
  recipientName?: string;
  recipientPersonId?: string;
  assetId?: string;
  description?: string;
  amount?: string;
};

export type ResidueUnderstanding =
  | 'children_equally'
  | 'children_different_shares'
  | 'by_family_branch'
  | 'specific_beneficiaries'
  | 'family_and_other'
  | 'charity'
  | 'other'
  | 'not_sure';

export type ChildPredeceaseUnderstanding =
  | 'to_that_child_descendants'
  | 'divided_among_surviving_children'
  | 'goes_elsewhere'
  | 'depends'
  | 'not_sure';

export type InheritanceType =
  | 'outright'
  | 'held_until_age'
  | 'released_gradually'
  | 'held_longer_period'
  | 'different_arrangements'
  | 'not_sure';

export type TrustKnownTypeName =
  | 'henson_trust'
  | 'testamentary_trust'
  | 'lifetime_trust'
  | 'discretionary_trust'
  | 'other'
  | 'not_sure';

export type SpecialArrangementType =
  | 'managed_ongoing'
  | 'trustee_discretion'
  | 'held_for_lifetime'
  | 'different_distribution_ages'
  | 'another_special_arrangement'
  | 'not_sure';

export type TrustStage = {
  id: string;
  age?: string;
  fraction?: string;
  description?: string;
};

export type SpecificGift = {
  id: string;
  type: 'asset' | 'dollar' | 'percentage' | 'possession' | 'person' | 'charity' | 'other';
  recipientName?: string;
  recipientPersonId?: string;
  assetId?: string;
  description?: string;
  amount?: string;
};

export type CharitableGift = {
  id: string;
  charityName: string;
  form: 'fixed_amount' | 'percentage' | 'residue' | 'specific_asset' | 'other';
  amount?: string;
  instructions?: string;
};

export type UltimateContingencyUnderstanding =
  | 'extended_family'
  | 'specific_people'
  | 'friends'
  | 'charity'
  | 'combination'
  | 'other'
  | 'not_sure';

export type OverallConfidence =
  | 'very_confident'
  | 'mostly_confident'
  | 'not_sure'
  | 'knows_changes_needed'
  | 'long_time_since_review';

export type WillJurisdictionType = 'canada' | 'outside_canada' | 'not_sure';

export type WillJurisdiction = {
  type: WillJurisdictionType;
  province?: string;
  country?: string;
  region?: string;
};

export type WillDocumentBasics = {
  hasWill?: 'yes' | 'no';
  willYear?: string;
  willLocation?: string;
  willJurisdiction?: string;
  willJurisdictionStructured?: WillJurisdiction;
  hasSecondaryWill?: 'yes' | 'no';
  secondaryWillLocation?: string;
  secondaryWillJurisdiction?: string;
  willPreparedByLawyer?: 'yes' | 'no' | 'not_sure';
  willLawyerId?: string;
  hasMeaningfulChanges?: 'yes' | 'no';
  meaningfulChangesDetails?: string;
};

export type SimilarWillsDifferences = Array<{
  id: string;
  area: 'estate_trustees' | 'specific_gifts' | 'business_provisions' | 'beneficiaries' | 'legacy_asset_provisions' | 'trusts' | 'other';
  description?: string;
}>;

export type ClientWillUnderstanding = {
  clientId: 'client1' | 'client2';
  clientName: string;
  documentBasics: WillDocumentBasics;
  familiarity?: 'very_familiar' | 'generally_familiar' | 'remember_main_parts' | 'not_very_familiar' | 'dont_remember';
  firstDeath?: FirstDeathUnderstanding;
  firstDeathExceptions?: FirstDeathException[];
  firstDeathExceptionHas?: 'yes' | 'no' | 'not_sure';
  residue?: ResidueUnderstanding;
  residueRecipients?: string[];
  childPredecease?: ChildPredeceaseUnderstanding;
  inheritanceType?: InheritanceType;
  trustStages?: TrustStage[];
  trustTrusteePersonId?: string;
  trustTrusteeName?: string;
  childSpecificArrangements?: Array<{
    childId: string;
    childName: string;
    hasDifferentArrangement: 'yes' | 'no' | 'not_sure';
    specialArrangement?: SpecialArrangementType;
    knownTypeName?: TrustKnownTypeName;
    description?: string;
  }>;
  specificGifts?: SpecificGift[];
  specificGiftsHas?: 'yes' | 'no' | 'not_sure';
  charitableGifts?: CharitableGift[];
  charitableGiftsHas?: 'yes' | 'no' | 'not_sure';
  ultimateContingency?: UltimateContingencyUnderstanding;
  ultimateContingencyRecipients?: string[];
  otherProvisions?: string;
  overallConfidence?: OverallConfidence;
  wantsToDiscussWithLawyer?: string;
  alignments: EstatePlanAlignment[];
  similarToOtherClient?: 'yes' | 'no' | 'not_sure';
  blendedFamilyAnswers?: BlendedFamilyAnswers;
};

import type { BlendedFamilyAnswers } from './blendedFamilyTypes';

export type FlagSeverity = 'informational' | 'yellow' | 'red';

export type PlanningFlag = {
  ruleId: string;
  severity: FlagSeverity;
  title: string;
  observation: string;
  context?: string;
  clientId?: 'client1' | 'client2';
};

export type CurrentWillData = {
  clients: ClientWillUnderstanding[];
  similarWills?: 'yes_similar' | 'mostly_different' | 'no_quite_different' | 'not_sure';
  similarWillsDifferences?: SimilarWillsDifferences;
  reviewConfirmed?: 'yes' | 'needs_changes';
  planningRiskFlags: string[];
  planningFlags: PlanningFlag[];
  blendedFamilyFlags?: PlanningFlag[];
};

export function generateCurrentWillId(): string {
  return `cw_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
}

export function emptyClientWill(clientId: 'client1' | 'client2', clientName: string): ClientWillUnderstanding {
  return {
    clientId,
    clientName,
    documentBasics: {},
    alignments: [],
  };
}

export type ComplexityFactors = {
  hasMinorChildren: boolean;
  hasDependentAdult: boolean;
  hasDisabledBeneficiary: boolean;
  hasPrivateCorpOwnership: boolean;
  hasMultipleProperties: boolean;
  hasForeignProperty: boolean;
  hasSignificantTrustPlanning: boolean;
  hasComplexEstate: boolean;
};

export type FlagContext = {
  complexity: ComplexityFactors;
  clientResidenceProvince?: string;
};

function normalizeProvince(province: string | undefined): string {
  if (!province) return '';
  const p = province.trim().toLowerCase();
  const provinceMap: Record<string, string> = {
    'on': 'Ontario', 'ontario': 'Ontario',
    'qc': 'Quebec', 'quebec': 'Quebec',
    'bc': 'British Columbia', 'british columbia': 'British Columbia',
    'ab': 'Alberta', 'alberta': 'Alberta',
    'mb': 'Manitoba', 'manitoba': 'Manitoba',
    'sk': 'Saskatchewan', 'saskatchewan': 'Saskatchewan',
    'ns': 'Nova Scotia', 'nova scotia': 'Nova Scotia',
    'nb': 'New Brunswick', 'new brunswick': 'New Brunswick',
    'nl': 'Newfoundland and Labrador', 'newfoundland': 'Newfoundland and Labrador',
    'newfoundland and labrador': 'Newfoundland and Labrador',
    'pe': 'Prince Edward Island', 'prince edward island': 'Prince Edward Island',
    'nt': 'Northwest Territories', 'northwest territories': 'Northwest Territories',
    'nu': 'Nunavut', 'nunavut': 'Nunavut',
    'yt': 'Yukon', 'yukon': 'Yukon',
  };
  return provinceMap[p] || province.trim();
}

function buildComplexityReasons(complexity: ComplexityFactors): string[] {
  const reasons: string[] = [];
  if (complexity.hasMinorChildren) reasons.push('minor children');
  if (complexity.hasDependentAdult) reasons.push('a financially dependent adult child');
  if (complexity.hasDisabledBeneficiary) reasons.push('a dependant with disability or significant ongoing support needs');
  if (complexity.hasPrivateCorpOwnership) reasons.push('private-company ownership');
  if (complexity.hasMultipleProperties) reasons.push('multiple properties');
  if (complexity.hasForeignProperty) reasons.push('foreign real estate');
  if (complexity.hasSignificantTrustPlanning) reasons.push('significant trust planning already identified');
  return reasons;
}

export function generatePlanningFlags(
  data: CurrentWillData,
  flagContext?: FlagContext
): PlanningFlag[] {
  const flags: PlanningFlag[] = [];
  const complexity = flagContext?.complexity || {
    hasMinorChildren: false,
    hasDependentAdult: false,
    hasDisabledBeneficiary: false,
    hasPrivateCorpOwnership: false,
    hasMultipleProperties: false,
    hasForeignProperty: false,
    hasSignificantTrustPlanning: false,
    hasComplexEstate: false,
  };

  for (const client of data.clients) {
    const name = client.clientName;
    const db = client.documentBasics;

    if (db.hasWill === 'no') {
      flags.push({
        ruleId: 'WILL-NONE-01',
        severity: 'red',
        title: 'No Current Will',
        observation: `${name} does not currently have a Will.`,
        context: 'A Will is the foundation of an estate plan. Consider speaking with an estate-planning lawyer about preparing one.',
        clientId: client.clientId,
      });
      continue;
    }

    if (db.hasWill !== 'yes') continue;

    // Stale review
    if (db.willYear) {
      const yearNum = parseInt(db.willYear, 10);
      const currentYear = new Date().getFullYear();
      if (!isNaN(yearNum) && currentYear - yearNum > 5) {
        flags.push({
          ruleId: 'WILL-STALE-01',
          severity: 'yellow',
          title: 'Will May Be Due for Review',
          observation: `${name}'s Will was prepared in ${db.willYear}.`,
          context: 'It may be due for a review to ensure it still reflects your current wishes and circumstances.',
          clientId: client.clientId,
        });
      }
    } else {
      flags.push({
        ruleId: 'WILL-YEAR-UNKNOWN-01',
        severity: 'yellow',
        title: 'Will Year Unknown',
        observation: `The year ${name}'s Will was prepared is unknown.`,
        context: 'Consider confirming when it was last reviewed.',
        clientId: client.clientId,
      });
    }

    // Lawyer preparation flags
    if (db.willPreparedByLawyer === 'no') {
      const reasons = buildComplexityReasons(complexity);
      const hasComplexity = reasons.length > 0;
      if (hasComplexity) {
        flags.push({
          ruleId: 'WILL-NONLAWYER-COMPLEX-02',
          severity: 'red',
          title: 'High Priority — Legal Review Recommended',
          observation: `${name}'s current Will was not prepared by a lawyer, and the estate includes circumstances that may benefit from professional estate-planning review.`,
          context: `Relevant circumstances: ${reasons.join(', ')}.`,
          clientId: client.clientId,
        });
      } else {
        flags.push({
          ruleId: 'WILL-NONLAWYER-01',
          severity: 'yellow',
          title: 'Review Recommended',
          observation: `${name}'s current Will was not prepared by a lawyer.`,
          context: 'A legal review may help confirm that the document reflects your current wishes and circumstances.',
          clientId: client.clientId,
        });
      }
    }

    if (db.willPreparedByLawyer === 'not_sure') {
      flags.push({
        ruleId: 'WILL-LAWYER-UNKNOWN-01',
        severity: 'yellow',
        title: 'Will Preparation Uncertain',
        observation: `It is uncertain whether ${name}'s Will was prepared by a lawyer.`,
        context: 'Consider confirming how the Will was prepared and whether a legal review would be beneficial.',
        clientId: client.clientId,
      });
    }

    // Jurisdiction flags
    const jur = db.willJurisdictionStructured;
    const residenceProvince = flagContext?.clientResidenceProvince;

    if (jur?.type === 'outside_canada' && jur.country) {
      const crossBorderReasons: string[] = [];
      if (complexity.hasForeignProperty) crossBorderReasons.push('foreign real estate');
      if (complexity.hasMultipleProperties) crossBorderReasons.push('multiple properties');

      flags.push({
        ruleId: 'WILL-JURISDICTION-FOREIGN-02',
        severity: 'red',
        title: 'High Priority — Cross-Border Will Review',
        observation: `${name}'s Will was prepared in ${jur.country}, while ${name} currently resides in Canada.`,
        context: 'Cross-border estate and succession rules can differ. Consider having the Will reviewed by an estate lawyer familiar with your current Canadian jurisdiction and any relevant foreign connections.',
        clientId: client.clientId,
      });
    } else if (jur?.type === 'canada' && jur.province && residenceProvince) {
      const willProv = normalizeProvince(jur.province);
      const resProv = normalizeProvince(residenceProvince);
      if (willProv && resProv && willProv.toLowerCase() !== resProv.toLowerCase()) {
        flags.push({
          ruleId: 'WILL-JURISDICTION-CANADA-01',
          severity: 'yellow',
          title: 'Jurisdiction Review',
          observation: `${name}'s Will was prepared in ${willProv}, and ${name} currently lives in ${resProv}.`,
          context: 'Consider confirming with an estate lawyer in your current province or territory that your Will continues to work as intended.',
          clientId: client.clientId,
        });
      }
    } else if (jur?.type === 'not_sure') {
      flags.push({
        ruleId: 'WILL-JURISDICTION-UNKNOWN-01',
        severity: 'yellow',
        title: 'Will Jurisdiction Uncertain',
        observation: `It is uncertain where ${name}'s Will was prepared.`,
        context: 'Consider confirming the jurisdiction where the Will was prepared, as it may affect how it is administered.',
        clientId: client.clientId,
      });
    }

    // Foreign property + Canadian will cross-border consideration
    if (complexity.hasForeignProperty && jur?.type === 'canada') {
      flags.push({
        ruleId: 'WILL-FOREIGN-PROPERTY-01',
        severity: 'yellow',
        title: 'Cross-Border Property Consideration',
        observation: `${name} owns foreign real estate, and the current Will was prepared in Canada.`,
        context: 'Foreign property may be subject to the laws of the country where it is located. Consider discussing this with an estate-planning professional.',
        clientId: client.clientId,
      });
    }

    // Familiarity flags
    if (client.familiarity === 'not_very_familiar' || client.familiarity === 'dont_remember') {
      flags.push({
        ruleId: 'WILL-FAMILIARITY-01',
        severity: 'yellow',
        title: 'Low Familiarity with Will',
        observation: `${name} has low familiarity with their current Will.`,
        context: 'Consider reviewing the Will or discussing it with the lawyer who prepared it.',
        clientId: client.clientId,
      });
    }

    // Alignment flags
    for (const a of client.alignments) {
      if (a.clientUnderstanding === 'notAligned') {
        flags.push({
          ruleId: 'WILL-ALIGNMENT-NOT-01',
          severity: 'yellow',
          title: 'Potential Planning Gap',
          observation: `${name} believes their Will differs from their stated intention for ${a.subjectLabel || 'an item'}.`,
          context: 'This may be worth discussing with your estate-planning lawyer.',
          clientId: client.clientId,
        });
      }
      if (a.clientUnderstanding === 'unsure') {
        flags.push({
          ruleId: 'WILL-ALIGNMENT-UNSURE-01',
          severity: 'yellow',
          title: 'Alignment Uncertain',
          observation: `${name} is unsure whether their Will reflects their intention for ${a.subjectLabel || 'an item'}.`,
          context: 'Worth confirming with your estate-planning lawyer.',
          clientId: client.clientId,
        });
      }
      if (a.clientUnderstanding === 'notAddressed') {
        flags.push({
          ruleId: 'WILL-ALIGNMENT-NOT-ADDRESSED-01',
          severity: 'yellow',
          title: 'Potential Planning Gap',
          observation: `${name} doesn't believe their Will specifically addresses ${a.subjectLabel || 'an item'}.`,
          context: 'This may be worth discussing with your estate-planning lawyer.',
          clientId: client.clientId,
        });
      }
    }

    if (client.residue === 'not_sure') {
      flags.push({
        ruleId: 'WILL-RESIDUE-UNSURE-01',
        severity: 'yellow',
        title: 'Residue Uncertain',
        observation: `${name} is unsure who receives the residue of their estate under their Will.`,
        clientId: client.clientId,
      });
    }

    if (client.inheritanceType === 'not_sure') {
      flags.push({
        ruleId: 'WILL-INHERITANCE-UNSURE-01',
        severity: 'yellow',
        title: 'Inheritance Arrangement Uncertain',
        observation: `${name} is unsure whether their children's inheritance is held in trust or paid outright.`,
        clientId: client.clientId,
      });
    }

    if ((client.inheritanceType === 'held_until_age' || client.inheritanceType === 'released_gradually' || client.inheritanceType === 'held_longer_period') && (!client.trustStages || client.trustStages.length === 0) && client.inheritanceType !== 'held_longer_period') {
      flags.push({
        ruleId: 'WILL-TRUST-STAGES-01',
        severity: 'yellow',
        title: 'Trust Distribution Unknown',
        observation: `${name}'s Will may hold children's inheritance in trust but distribution ages are unknown.`,
        clientId: client.clientId,
      });
    }

    if (client.ultimateContingency === 'not_sure') {
      flags.push({
        ruleId: 'WILL-ULTIMATE-UNSURE-01',
        severity: 'yellow',
        title: 'Ultimate Contingency Uncertain',
        observation: `${name} is unsure who ultimately receives their estate if no descendants survive.`,
        clientId: client.clientId,
      });
    }

    if (client.overallConfidence === 'knows_changes_needed') {
      flags.push({
        ruleId: 'WILL-CHANGES-NEEDED-01',
        severity: 'yellow',
        title: 'Changes Already Identified',
        observation: `${name} already knows they want changes to their Will.`,
        clientId: client.clientId,
      });
    }
    if (client.overallConfidence === 'long_time_since_review') {
      flags.push({
        ruleId: 'WILL-LONG-REVIEW-01',
        severity: 'yellow',
        title: 'Long Time Since Review',
        observation: `${name} hasn't reviewed their Will in a long time.`,
        clientId: client.clientId,
      });
    }
  }

  if (data.similarWills === 'not_sure') {
    flags.push({
      ruleId: 'WILL-SIMILAR-UNSURE-01',
      severity: 'yellow',
      title: 'Similar Wills Uncertain',
      observation: "It is unclear whether the couple's Wills generally leave things in a similar way.",
    });
  }

  return flags;
}

export function flagsToStrings(flags: PlanningFlag[]): string[] {
  return flags.map(f => {
    const prefix = f.severity === 'red' ? '[HIGH PRIORITY] ' : f.severity === 'yellow' ? '[Review] ' : '';
    const msg = f.context ? `${f.observation} ${f.context}` : f.observation;
    return `${prefix}${msg}`;
  });
}

export function generatePlanningRiskFlags(data: CurrentWillData, flagContext?: FlagContext): string[] {
  return flagsToStrings(generatePlanningFlags(data, flagContext));
}

export function getUnderstandingLabel(understanding: ClientUnderstanding): string {
  switch (understanding) {
    case 'believesAligned':
      return 'Client believes intention is reflected';
    case 'partiallyAligned':
      return 'Some of it is reflected';
    case 'notAligned':
      return 'Client believes Will differs from intention';
    case 'unsure':
      return 'Client is unsure';
    case 'notAddressed':
      return "Client doesn't believe Will addresses this";
  }
}

export function getUnderstandingColor(understanding: ClientUnderstanding): string {
  switch (understanding) {
    case 'believesAligned':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'partiallyAligned':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'notAligned':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'unsure':
      return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    case 'notAddressed':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  }
}

export function getFlagSeverityColor(severity: FlagSeverity): string {
  switch (severity) {
    case 'red':
      return 'text-red-300 bg-red-500/10 border-red-500/30';
    case 'yellow':
      return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
    case 'informational':
      return 'text-blue-300 bg-blue-500/10 border-blue-500/30';
  }
}

export function getFlagSeverityLabel(severity: FlagSeverity): string {
  switch (severity) {
    case 'red':
      return 'High Priority Review';
    case 'yellow':
      return 'Review Recommended';
    case 'informational':
      return 'Informational';
  }
}

export function migrateLegacyWillFields(
  willsAnswers: Record<string, unknown>,
  clientId: 'client1' | 'client2',
  existing: ClientWillUnderstanding | undefined,
): Partial<ClientWillUnderstanding> {
  if (existing?.documentBasics?.willYear || existing?.documentBasics?.willLocation) {
    return {};
  }
  const prefix = clientId;
  const legacyYear = willsAnswers[`${prefix}WillYear`] as string | undefined;
  const legacyLocation = willsAnswers[`${prefix}WillLocation`] as string | undefined;
  const legacyJurisdiction = willsAnswers[`${prefix}WillJurisdiction`] as string | undefined;
  const legacyMeaningfulChanges = willsAnswers[`${prefix}HasWillMeaningfulChanges`] as string | undefined;
  const legacyMeanfulDetails = willsAnswers[`${prefix}WillMeaningfulChangesDetails`] as string | undefined;

  const docBasics: Partial<WillDocumentBasics> = {};
  if (legacyYear) docBasics.willYear = legacyYear;
  if (legacyLocation) docBasics.willLocation = legacyLocation;
  if (legacyJurisdiction) docBasics.willJurisdiction = legacyJurisdiction;
  if (legacyMeaningfulChanges) docBasics.hasMeaningfulChanges = legacyMeaningfulChanges as 'yes' | 'no';
  if (legacyMeanfulDetails) docBasics.meaningfulChangesDetails = legacyMeanfulDetails;

  if (Object.keys(docBasics).length === 0) return {};
  return { documentBasics: { ...(existing?.documentBasics || emptyClientWill(clientId, '').documentBasics), ...docBasics } };
}

export function getInheritanceTypeLabel(type: InheritanceType | undefined): string {
  if (!type) return '';
  switch (type) {
    case 'outright': return 'Paid to them outright';
    case 'held_until_age': return 'Held and managed until a certain age';
    case 'released_gradually': return 'Released gradually at different ages or stages';
    case 'held_longer_period': return 'Held and managed for a longer period';
    case 'different_arrangements': return 'Different arrangements for different children';
    case 'not_sure': return "I'm not sure";
  }
}
