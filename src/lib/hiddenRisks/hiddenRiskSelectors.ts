/**
 * Hidden Risk Engine — Data Selectors
 *
 * Pure functions that extract structured data from the questionnaire answers
 * and entity graph. All selectors use canonical entity IDs, not name matching.
 * Selectors filter out inactive/deleted/stale data per suppression rule 10C.
 */

import type { EntityEntry, EntityRelationship } from '../entityRegistryTypes';
import type { ObligationRecord } from '../obligationQuery';
import {
  getAllObligations,
  getObligationsForGuarantor,
  getObligationsForBorrower,
} from '../obligationQuery';
import type { QuestionnaireSectionId } from '../steps';

// ── Section completion ──

export function getSectionAnswers(
  answers: Map<string, Record<string, unknown>>,
  sectionId: string
): Record<string, unknown> {
  return answers.get(sectionId as QuestionnaireSectionId) || {};
}

/**
 * A section is considered "completed" if it has at least one non-empty answer.
 * This prevents false findings from unvisited sections (suppression rule 10A/10I).
 */
export function isSectionCompleted(
  answers: Map<string, Record<string, unknown>>,
  sectionId: string
): boolean {
  const section = answers.get(sectionId);
  if (!section) return false;
  for (const value of Object.values(section)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    return true;
  }
  return false;
}

export function getCompletedSections(
  answers: Map<string, Record<string, unknown>>
): Set<string> {
  const completed = new Set<string>();
  for (const sectionId of answers.keys()) {
    if (isSectionCompleted(answers, sectionId)) {
      completed.add(sectionId);
    }
  }
  return completed;
}

// ── Client info ──

export function getClientInfo(answers: Map<string, Record<string, unknown>>) {
  const aboutYou = getSectionAnswers(answers, 'aboutYou');
  const client1Name = (aboutYou['fullName'] as string) || '';
  const client2Name = (aboutYou['spouseName'] as string) || '';
  const maritalStatus = (aboutYou['maritalStatus'] as string) || '';
  const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';
  const client1EntityId = (aboutYou['client1EntityId'] as string) || '';
  const client2EntityId = (aboutYou['client2EntityId'] as string) || '';
  const client1PersonId = (aboutYou['client1PersonId'] as string) || '';
  const client2PersonId = (aboutYou['client2PersonId'] as string) || '';

  return {
    client1Name,
    client2Name,
    maritalStatus,
    hasSpouse,
    client1EntityId,
    client2EntityId,
    client1PersonId,
    client2PersonId,
  };
}

// ── Entity filtering ──

export function getActiveEntities(entities: EntityEntry[]): EntityEntry[] {
  return entities.filter((e) => e.active);
}

export function getActiveRelationships(relationships: EntityRelationship[]): EntityRelationship[] {
  return relationships.filter((r) => r.active);
}

export function getEntitiesByType(entities: EntityEntry[], type: string): EntityEntry[] {
  return entities.filter((e) => e.entityType === type);
}

export function getEntityById(entities: EntityEntry[], id: string): EntityEntry | undefined {
  return entities.find((e) => e.id === id);
}

// ── Obligation helpers ──

export function getAllActiveObligations(
  entities: EntityEntry[],
  relationships: EntityRelationship[]
): ObligationRecord[] {
  return getAllObligations(getActiveEntities(entities), getActiveRelationships(relationships));
}

export function getGuaranteedObligationsForEntity(
  guarantorEntityId: string,
  entities: EntityEntry[],
  relationships: EntityRelationship[]
): ObligationRecord[] {
  return getObligationsForGuarantor(
    guarantorEntityId,
    getActiveEntities(entities),
    getActiveRelationships(relationships)
  );
}

export function getObligationsForBorrowerEntity(
  borrowerEntityId: string,
  entities: EntityEntry[],
  relationships: EntityRelationship[]
): ObligationRecord[] {
  return getObligationsForBorrower(
    borrowerEntityId,
    getActiveEntities(entities),
    getActiveRelationships(relationships)
  );
}

// ── Relationship helpers ──

export function getRelationshipsByType(
  relationships: EntityRelationship[],
  type: string
): EntityRelationship[] {
  return getActiveRelationships(relationships).filter((r) => r.relationshipType === type);
}

export function getRelationshipsFromEntity(
  relationships: EntityRelationship[],
  entityId: string,
  type?: string
): EntityRelationship[] {
  return getActiveRelationships(relationships).filter(
    (r) => r.sourceEntityId === entityId && (!type || r.relationshipType === type)
  );
}

export function getRelationshipsToEntity(
  relationships: EntityRelationship[],
  entityId: string,
  type?: string
): EntityRelationship[] {
  return getActiveRelationships(relationships).filter(
    (r) => r.targetEntityId === entityId && (!type || r.relationshipType === type)
  );
}

// ── Children ──

export interface ChildInfo {
  id: string;
  name: string;
  dateOfBirth?: string;
  isMinor: boolean;
  isFinanciallyIndependent: boolean;
  isDependent: boolean;
  hasDisability: boolean;
  proposedGuardianId?: string;
  proposedGuardianName?: string;
  spokenToGuardian?: string;
}

export function getChildren(answers: Map<string, Record<string, unknown>>): ChildInfo[] {
  const childrenSection = getSectionAnswers(answers, 'children');
  const childrenData = (childrenSection['childrenData'] as Array<Record<string, unknown>>) || [];
  const today = new Date();

  return childrenData.map((c, i) => {
    const name = (c['name'] as string) || `Child ${i + 1}`;
    const dob = (c['dateOfBirth'] as string) || '';
    let isMinor = false;
    if (dob) {
      const birthDate = new Date(dob);
      const age = today.getFullYear() - birthDate.getFullYear();
      isMinor = age < 18;
    }
    const financialStatus = (c['financialStatus'] as string) || '';
    const isFinanciallyIndependent = financialStatus === 'independent' || (!isMinor && financialStatus !== 'dependent');
    const hasDisability = (c['hasDisability'] as string) === 'yes';
    const isDependent = !isFinanciallyIndependent;

    return {
      id: (c['id'] as string) || `child_${i}`,
      name,
      dateOfBirth: dob,
      isMinor,
      isFinanciallyIndependent,
      isDependent,
      hasDisability,
      proposedGuardianId: (c['proposedGuardianId'] as string) || undefined,
      proposedGuardianName: (c['proposedGuardianName'] as string) || undefined,
      spokenToGuardian: (c['spokenToGuardian'] as string) || undefined,
    };
  });
}

export function getMinorChildren(answers: Map<string, Record<string, unknown>>): ChildInfo[] {
  return getChildren(answers).filter((c) => c.isMinor);
}

export function getDependentChildren(answers: Map<string, Record<string, unknown>>): ChildInfo[] {
  return getChildren(answers).filter((c) => c.isDependent && !c.isFinanciallyIndependent);
}

// ── Previous relationships (blended family) ──

export interface PreviousRelationshipInfo {
  client1HasPrevious: boolean;
  client2HasPrevious: boolean;
  client1ChildrenFromPrevious: string[];
  client2ChildrenFromPrevious: string[];
}

export function getPreviousRelationshipInfo(
  answers: Map<string, Record<string, unknown>>
): PreviousRelationshipInfo {
  const prevSection = getSectionAnswers(answers, 'previousRelationships');
  const aboutYou = getSectionAnswers(answers, 'aboutYou');

  const client1HasPrevious = (aboutYou['client1HasPreviousRelationship'] as string) === 'yes';
  const client2HasPrevious = (aboutYou['client2HasPreviousRelationship'] as string) === 'yes';

  const c1PrevData = (prevSection['client1PreviousRelationshipsData'] as Array<Record<string, unknown>>) || [];
  const c2PrevData = (prevSection['client2PreviousRelationshipsData'] as Array<Record<string, unknown>>) || [];

  const client1ChildrenFromPrevious = c1PrevData
    .flatMap((r) => (r['childrenNames'] as string[]) || [])
    .filter(Boolean);
  const client2ChildrenFromPrevious = c2PrevData
    .flatMap((r) => (r['childrenNames'] as string[]) || [])
    .filter(Boolean);

  return {
    client1HasPrevious,
    client2HasPrevious,
    client1ChildrenFromPrevious,
    client2ChildrenFromPrevious,
  };
}

export function isBlendedFamily(answers: Map<string, Record<string, unknown>>): boolean {
  const clientInfo = getClientInfo(answers);
  if (!clientInfo.hasSpouse) return false;
  const prevInfo = getPreviousRelationshipInfo(answers);
  return prevInfo.client1HasPrevious || prevInfo.client2HasPrevious;
}

// ── Support obligations ──

export interface SupportObligationInfo {
  hasChildSupport: boolean;
  hasSpousalSupport: boolean;
  estateTreatmentReviewed: boolean;
}

export function getSupportObligations(
  answers: Map<string, Record<string, unknown>>
): SupportObligationInfo {
  const prevSection = getSectionAnswers(answers, 'previousRelationships');
  const c1PrevData = (prevSection['client1PreviousRelationshipsData'] as Array<Record<string, unknown>>) || [];
  const c2PrevData = (prevSection['client2PreviousRelationshipsData'] as Array<Record<string, unknown>>) || [];

  const allPrev = [...c1PrevData, ...c2PrevData];
  const hasChildSupport = allPrev.some((r) => (r['paysChildSupport'] as string) === 'yes');
  const hasSpousalSupport = allPrev.some((r) => (r['paysSpousalSupport'] as string) === 'yes');
  const estateTreatmentReviewed = allPrev.some(
    (r) => (r['estateTreatmentReviewed'] as string) === 'yes'
  );

  return { hasChildSupport, hasSpousalSupport, estateTreatmentReviewed };
}

// ── Corporation info ──

export interface CorporationInfo {
  entityId?: string;
  legalName: string;
  shareholderCount: number;
  hasShareholderAgreement: boolean;
  shareholderAgreementUnknown: boolean;
  isSoleShareholder: boolean;
  continuityFactors: string[];
  expectsToContinue: boolean;
}

export function getCorporations(answers: Map<string, Record<string, unknown>>): CorporationInfo[] {
  const corpSection = getSectionAnswers(answers, 'corporations');
  const corpData = (corpSection['corporationsData'] as Array<Record<string, unknown>>) || [];

  return corpData.map((c, i) => {
    const legalName = (c['legalName'] as string) || `Corporation ${i + 1}`;
    const owners = (c['owners'] as Array<Record<string, unknown>>) || [];
    const shareholderCount = owners.length;
    const isSoleShareholder = shareholderCount === 1;
    const saStatus = (c['shareholderAgreement'] as string) || '';
    const hasShareholderAgreement = saStatus === 'yes';
    const shareholderAgreementUnknown = saStatus === 'not_sure' || saStatus === '';

    const continuityFactors: string[] = [];
    if ((c['soleSigningAuthority'] as string) === 'yes') continuityFactors.push('Sole bank signing authority');
    if ((c['soleDecisionMaker'] as string) === 'yes') continuityFactors.push('Sole operational decision-maker');
    if ((c['noBackupSigning'] as string) === 'yes') continuityFactors.push('No backup signing authority');
    if ((c['noContinuityPerson'] as string) === 'yes') continuityFactors.push('No identified continuity person');
    if ((c['soleKeyAccess'] as string) === 'yes') continuityFactors.push('Only person with key access/information');

    const expectsToContinue = (c['businessContinuesAfterDeath'] as string) !== 'no';

    return {
      legalName,
      shareholderCount,
      hasShareholderAgreement,
      shareholderAgreementUnknown,
      isSoleShareholder,
      continuityFactors,
      expectsToContinue,
    };
  });
}

// ── Trust info ──

export interface TrustInfo {
  entityId?: string;
  legalName: string;
  establishmentYear?: number;
  trusteeClientIds: string[];
  hasDebts: boolean;
  hasPersonalGuaranteeOfTrustDebt: boolean;
  trustDebtGuaranteeUnknown: boolean;
  twentyOneYearStatus: string;
  hasProfessionalReview: boolean;
  trustDeedLocationKnown: boolean;
  beneficiaryNames: string[];
}

export function getTrusts(answers: Map<string, Record<string, unknown>>): TrustInfo[] {
  const trustSection = getSectionAnswers(answers, 'familyTrusts');
  const trusts: TrustInfo[] = [];

  // Primary trust
  const primaryName = (trustSection['trustLegalName'] as string) || '';
  if (primaryName.trim()) {
    trusts.push(buildTrustInfo(trustSection, primaryName, 1));
  }

  // Additional trusts (trust2 through trust4)
  for (let i = 2; i <= 4; i++) {
    const name = (trustSection[`trust${i}LegalName`] as string) || '';
    if (name.trim()) {
      trusts.push(buildTrustInfo(trustSection, name, i));
    }
  }

  return trusts;
}

function buildTrustInfo(section: Record<string, unknown>, legalName: string, index: number): TrustInfo {
  const prefix = index === 1 ? '' : `trust${index}`;
  const estYear = (section[`${prefix}establishmentYear`] as string) || '';
  const trustees = (section[`${prefix}trustees`] as Array<Record<string, unknown>>) || [];
  const trusteeClientIds = trustees
    .filter((t) => t['personType'] === 'client1' || t['personType'] === 'client2')
    .map((t) => (t['personType'] as string) || '');

  const hasDebts = (section[`${prefix}hasDebts`] as string) === 'yes';
  const debts = (section[`${prefix}debts`] as Array<Record<string, unknown>>) || [];
  const hasPersonalGuarantee = debts.some((d) => (d['hasPersonalGuarantee'] as string) === 'yes');
  const trustDebtGuaranteeUnknown = debts.some((d) => (d['hasPersonalGuarantee'] as string) === 'not_sure');

  const twentyOneYear = (section[`${prefix}twentyOneYearRule`] as Record<string, unknown>) || {};
  const twentyOneYearStatus = (twentyOneYear['planningCompleted'] as string) || 'not_sure';
  const hasProfessionalReview = (twentyOneYear['confirmedByProfessional'] as string) === 'yes';

  const trustDeedLocation = (section[`${prefix}trustDeedLocation`] as Record<string, unknown>) || {};
  const trustDeedLocationKnown = !!((trustDeedLocation['location'] as string) || '').trim();

  const beneficiaries = (section[`${prefix}beneficiaries`] as Array<Record<string, unknown>>) || [];
  const beneficiaryNames = beneficiaries.map((b) => (b['personName'] as string) || '').filter(Boolean);

  return {
    legalName,
    establishmentYear: estYear ? parseInt(estYear, 10) : undefined,
    trusteeClientIds,
    hasDebts,
    hasPersonalGuaranteeOfTrustDebt: hasPersonalGuarantee,
    trustDebtGuaranteeUnknown,
    twentyOneYearStatus,
    hasProfessionalReview,
    trustDeedLocationKnown,
    beneficiaryNames,
  };
}

// ── Will info ──

export interface WillInfo {
  clientId: 'client1' | 'client2';
  clientName: string;
  hasWill: boolean;
  hasWillUnknown: boolean;
  willYear?: number;
  willPreparedByLawyer: boolean;
  willPreparedByLawyerUnknown: boolean;
  willJurisdiction: string;
  willJurisdictionDiffersFromResidence: boolean;
  hasSecondaryWill: boolean;
  hasMeaningfulChanges: boolean;
  meaningfulChangesDetails?: string;
  willLocationKnown: boolean;
  hasPoaProperty: boolean;
  hasPoaPropertyUnknown: boolean;
  hasPoaPersonalCare: boolean;
  hasPoaPersonalCareUnknown: boolean;
  poaPropertyLocationKnown: boolean;
  poaPersonalCareLocationKnown: boolean;
  hasProfessionalReview: boolean;
}

export function getWillInfo(answers: Map<string, Record<string, unknown>>): WillInfo[] {
  const willsSection = getSectionAnswers(answers, 'wills');
  const poaSection = getSectionAnswers(answers, 'powersOfAttorney');
  const clientInfo = getClientInfo(answers);

  const results: WillInfo[] = [];
  const clientIds: Array<'client1' | 'client2'> = ['client1'];
  if (clientInfo.hasSpouse) clientIds.push('client2');

  for (const clientId of clientIds) {
    const clientName = clientId === 'client1' ? clientInfo.client1Name : clientInfo.client2Name;
    const prefix = clientId;

    const hasWill = (willsSection[`${prefix}HasWill`] as string) === 'yes';
    const hasWillUnknown = (willsSection[`${prefix}HasWill`] as string) === 'not_sure';
    const willYearStr = (willsSection[`${prefix}WillYear`] as string) || '';
    const willYear = willYearStr ? parseInt(willYearStr, 10) : undefined;
    const preparedByLawyer = (willsSection[`${prefix}WillPreparedByLawyer`] as string) === 'yes';
    const preparedByLawyerUnknown = (willsSection[`${prefix}WillPreparedByLawyer`] as string) === 'not_sure';
    const willJurisdiction = (willsSection[`${prefix}WillJurisdiction`] as string) || 'canada';
    const clientResidence = (answers.get('aboutYou')?.['province'] as string) || '';
    const willJurisdictionDiffersFromResidence =
      willJurisdiction !== 'canada' && willJurisdiction !== '' && willJurisdiction !== clientResidence;

    const hasSecondaryWill = (willsSection[`${prefix}HasSecondaryWill`] as string) === 'yes';
    const hasMeaningfulChanges = (willsSection[`${prefix}HasMeaningfulChanges`] as string) === 'yes';
    const meaningfulChangesDetails = (willsSection[`${prefix}MeaningfulChangesDetails`] as string) || undefined;

    const willLocation = (willsSection[`${prefix}WillLocation`] as Record<string, unknown>) || {};
    const willLocationKnown = !!((willLocation['location'] as string) || '').trim();

    const hasPoaProperty = (poaSection[`${prefix}HasPoaProperty`] as string) === 'yes';
    const hasPoaPropertyUnknown = (poaSection[`${prefix}HasPoaProperty`] as string) === 'not_sure';
    const hasPoaPersonalCare = (poaSection[`${prefix}HasPoaPersonalCare`] as string) === 'yes';
    const hasPoaPersonalCareUnknown = (poaSection[`${prefix}HasPoaPersonalCare`] as string) === 'not_sure';

    const poaPropertyLocation = (poaSection[`${prefix}PoaPropertyLocation`] as Record<string, unknown>) || {};
    const poaPropertyLocationKnown = !!((poaPropertyLocation['location'] as string) || '').trim();
    const poaPersonalCareLocation = (poaSection[`${prefix}PoaPersonalCareLocation`] as Record<string, unknown>) || {};
    const poaPersonalCareLocationKnown = !!((poaPersonalCareLocation['location'] as string) || '').trim();

    const hasProfessionalReview = (willsSection[`${prefix}WillReviewedAfterChanges`] as string) === 'yes';

    results.push({
      clientId,
      clientName,
      hasWill,
      hasWillUnknown,
      willYear,
      willPreparedByLawyer: preparedByLawyer,
      willPreparedByLawyerUnknown: preparedByLawyerUnknown,
      willJurisdiction,
      willJurisdictionDiffersFromResidence,
      hasSecondaryWill,
      hasMeaningfulChanges,
      meaningfulChangesDetails,
      willLocationKnown,
      hasPoaProperty,
      hasPoaPropertyUnknown,
      hasPoaPersonalCare,
      hasPoaPersonalCareUnknown,
      poaPropertyLocationKnown,
      poaPersonalCareLocationKnown,
      hasProfessionalReview,
    });
  }

  return results;
}

// ── Real estate / foreign property ──

export interface PropertyInfo {
  id: string;
  name: string;
  type: string;
  isForeign: boolean;
  country?: string;
}

export function getProperties(answers: Map<string, Record<string, unknown>>): PropertyInfo[] {
  const realEstateSection = getSectionAnswers(answers, 'realEstate');
  const properties = (realEstateSection['propertiesData'] as Array<Record<string, unknown>>) || [];

  return properties.map((p, i) => ({
    id: (p['id'] as string) || `prop_${i}`,
    name: (p['name'] as string) || `Property ${i + 1}`,
    type: (p['type'] as string) || '',
    isForeign: ((p['country'] as string) || '').toLowerCase() !== 'canada' && !!(p['country'] as string),
    country: (p['country'] as string) || undefined,
  }));
}

export function hasForeignProperty(answers: Map<string, Record<string, unknown>>): boolean {
  return getProperties(answers).some((p) => p.isForeign);
}

// ── Complexity factors ──

export interface ComplexityFactors {
  hasMinorChildren: boolean;
  hasDependentAdult: boolean;
  hasDisabledBeneficiary: boolean;
  hasPrivateCorpOwnership: boolean;
  hasFamilyTrust: boolean;
  hasForeignProperty: boolean;
  isBlendedFamily: boolean;
  hasSupportObligation: boolean;
}

export function getComplexityFactors(answers: Map<string, Record<string, unknown>>): ComplexityFactors {
  const children = getChildren(answers);
  const corps = getCorporations(answers);
  const trusts = getTrusts(answers);

  return {
    hasMinorChildren: children.some((c) => c.isMinor),
    hasDependentAdult: children.some((c) => !c.isMinor && c.isDependent && !c.isFinanciallyIndependent),
    hasDisabledBeneficiary: children.some((c) => c.hasDisability),
    hasPrivateCorpOwnership: corps.length > 0,
    hasFamilyTrust: trusts.length > 0,
    hasForeignProperty: hasForeignProperty(answers),
    isBlendedFamily: isBlendedFamily(answers),
    hasSupportObligation: getSupportObligations(answers).hasChildSupport || getSupportObligations(answers).hasSpousalSupport,
  };
}

// ── Executor / guardian info ──

export interface ExecutorInfo {
  client1ExecutorKnowsWillLocation: boolean;
  client2ExecutorKnowsWillLocation: boolean;
  client1ExecutorName?: string;
  client2ExecutorName?: string;
}

export function getExecutorInfo(answers: Map<string, Record<string, unknown>>): ExecutorInfo {
  const executorSection = getSectionAnswers(answers, 'estateTrustees');
  return {
    client1ExecutorKnowsWillLocation: (executorSection['client1ExecutorKnowsWillLocation'] as string) === 'yes',
    client2ExecutorKnowsWillLocation: (executorSection['client2ExecutorKnowsWillLocation'] as string) === 'yes',
    client1ExecutorName: (executorSection['client1ExecutorName'] as string) || undefined,
    client2ExecutorName: (executorSection['client2ExecutorName'] as string) || undefined,
  };
}

// ── Guardian coordination gaps ──

export interface GuardianCoordinationGap {
  type: string;
  description: string;
}

export function getGuardianCoordinationGaps(
  answers: Map<string, Record<string, unknown>>
): GuardianCoordinationGap[] {
  const guardianSection = getSectionAnswers(answers, 'children');
  const gaps: GuardianCoordinationGap[] = [];

  const routineExpenses = (guardianSection['guardianRoutineExpensesClear'] as string) || '';
  if (routineExpenses === 'no' || routineExpenses === 'not_sure') {
    gaps.push({ type: 'routine_expenses', description: 'Routine expense expectations are unclear' });
  }

  const majorExpenses = (guardianSection['guardianMajorExpensesClear'] as string) || '';
  if (majorExpenses === 'no' || majorExpenses === 'not_sure') {
    gaps.push({ type: 'major_expenses', description: 'Major expense treatment is unclear' });
  }

  const housingFunding = (guardianSection['guardianHousingFundingClear'] as string) || '';
  if (housingFunding === 'no' || housingFunding === 'not_sure') {
    gaps.push({ type: 'housing_funding', description: 'Housing-expansion funding is unclear' });
  }

  const communication = (guardianSection['guardianTrusteeCommunicationClear'] as string) || '';
  if (communication === 'no' || communication === 'not_sure') {
    gaps.push({ type: 'communication', description: 'Trustee/guardian communication expectations are unclear' });
  }

  const roleResponsibility = (guardianSection['guardianRoleResponsibilityClear'] as string) || '';
  if (roleResponsibility === 'no' || roleResponsibility === 'not_sure') {
    gaps.push({ type: 'role_responsibility', description: 'Role responsibility is unclear' });
  }

  return gaps;
}

// ── Legacy intent / beneficiary coordination ──

export interface LegacyIntentSummary {
  hasLegacyIntent: boolean;
  hasCottageToSpecificChild: boolean;
  hasEqualDivisionInWill: boolean;
  potentialConflict: boolean;
  reflectedInEstateDocuments: boolean;
  assetDescriptions: string[];
}

export function getLegacyIntentSummary(
  answers: Map<string, Record<string, unknown>>
): LegacyIntentSummary {
  const legacySection = getSectionAnswers(answers, 'legacyIntent');
  const records = (legacySection['legacyIntentRecords'] as Array<Record<string, unknown>>) || [];

  const hasLegacyIntent = records.length > 0;
  const assetDescriptions = records.map((r) => {
    const asset = (r['asset'] as Record<string, unknown>) || {};
    return (asset['assetName'] as string) || '';
  }).filter(Boolean);

  const hasCottageToSpecificChild = records.some((r) => {
    const asset = (r['asset'] as Record<string, unknown>) || {};
    const assetType = (asset['assetSubtype'] as string) || '';
    const bothDeceased = (r['bothDeceased'] as Record<string, unknown>) || {};
    const recipients = (bothDeceased['recipients'] as Array<Record<string, unknown>>) || [];
    return (assetType === 'family_cottage' || assetType === 'vacation_home') && recipients.length === 1;
  });

  const reflectedInEstateDocuments = records.every(
    (r) => (r['reflectedInEstateDocuments'] as string) === 'yes'
  );

  return {
    hasLegacyIntent,
    hasCottageToSpecificChild,
    hasEqualDivisionInWill: false,
    potentialConflict: hasCottageToSpecificChild && !reflectedInEstateDocuments,
    reflectedInEstateDocuments,
    assetDescriptions,
  };
}

// ── Document location helpers ──

export interface DocumentLocationInfo {
  documentType: string;
  locationKnown: boolean;
  locationLabel?: string;
  sourceSection: string;
}

export function getCriticalDocumentLocations(
  answers: Map<string, Record<string, unknown>>
): DocumentLocationInfo[] {
  const docs: DocumentLocationInfo[] = [];
  const willInfo = getWillInfo(answers);
  const trusts = getTrusts(answers);
  const corps = getCorporations(answers);

  for (const will of willInfo) {
    if (will.hasWill) {
      docs.push({
        documentType: 'will',
        locationKnown: will.willLocationKnown,
        sourceSection: 'wills',
      });
    }
    if (will.hasPoaProperty) {
      docs.push({
        documentType: 'poa_property',
        locationKnown: will.poaPropertyLocationKnown,
        sourceSection: 'powersOfAttorney',
      });
    }
    if (will.hasPoaPersonalCare) {
      docs.push({
        documentType: 'poa_personal_care',
        locationKnown: will.poaPersonalCareLocationKnown,
        sourceSection: 'powersOfAttorney',
      });
    }
  }

  for (const trust of trusts) {
    docs.push({
      documentType: 'trust_deed',
      locationKnown: trust.trustDeedLocationKnown,
      sourceSection: 'familyTrusts',
    });
  }

  for (const corp of corps) {
    if (corp.hasShareholderAgreement) {
      docs.push({
        documentType: 'shareholder_agreement',
        locationKnown: false,
        sourceSection: 'corporations',
      });
    }
  }

  return docs;
}
