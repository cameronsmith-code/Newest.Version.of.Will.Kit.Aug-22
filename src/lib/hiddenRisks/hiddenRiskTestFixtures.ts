/**
 * Hidden Risk Engine V1 — Test Fixtures
 *
 * Five synthetic households and edge-case tests.
 * Each fixture provides a complete HiddenRiskEngineInput.
 */

import type { EntityEntry, EntityRelationship } from '../entityRegistryTypes';
import type { HiddenRiskEngineInput } from './hiddenRiskTypes';

function makeEntity(
  id: string,
  type: string,
  name: string,
  meta: Record<string, unknown> = {}
): EntityEntry {
  return {
    id,
    entityType: type as EntityEntry['entityType'],
    displayName: name,
    normalizedName: name.toLowerCase(),
    completionStatus: 'complete',
    sourceSection: 'test',
    sourceEntityRef: id,
    metadata: meta,
    active: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };
}

function makeRel(
  id: string,
  source: string,
  target: string,
  type: string
): EntityRelationship {
  return {
    id,
    sourceEntityId: source,
    targetEntityId: target,
    relationshipType: type as EntityRelationship['relationshipType'],
    ownershipPercentage: '',
    metadata: {},
    active: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };
}

// ── FIXTURE 1: Simple Organized Family ──

export function fixture1SimpleOrganized(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', {
    fullName: 'John Smith',
    spouseName: 'Jane Smith',
    maritalStatus: 'married',
    province: 'Ontario',
    client1EntityId: 'ent_john',
    client2EntityId: 'ent_jane',
    client1PersonId: 'pers_john',
    client2PersonId: 'pers_jane',
  });
  answers.set('wills', {
    client1HasWill: 'yes',
    client1WillYear: '2022',
    client1WillPreparedByLawyer: 'yes',
    client1WillJurisdiction: 'canada',
    client1WillLocation: { location: 'home_office' },
    client1WillReviewedAfterChanges: 'yes',
    client2HasWill: 'yes',
    client2WillYear: '2022',
    client2WillPreparedByLawyer: 'yes',
    client2WillJurisdiction: 'canada',
    client2WillLocation: { location: 'home_office' },
  });
  answers.set('powersOfAttorney', {
    client1HasPoaProperty: 'yes',
    client1PoaPropertyLocation: { location: 'home_office' },
    client1HasPoaPersonalCare: 'yes',
    client1PoaPersonalCareLocation: { location: 'home_office' },
    client2HasPoaProperty: 'yes',
    client2PoaPropertyLocation: { location: 'home_office' },
    client2HasPoaPersonalCare: 'yes',
    client2PoaPersonalCareLocation: { location: 'home_office' },
  });
  answers.set('children', {
    childrenData: [
      { id: 'child_1', name: 'Alice Smith', dateOfBirth: '2018-01-01', proposedGuardianId: 'pers_guardian', proposedGuardianName: 'Uncle Bob', spokenToGuardian: 'yes' },
    ],
    guardianRoutineExpensesClear: 'yes',
    guardianMajorExpensesClear: 'yes',
    guardianHousingFundingClear: 'yes',
    guardianTrusteeCommunicationClear: 'yes',
    guardianRoleResponsibilityClear: 'yes',
  });
  answers.set('estateTrustees', {
    client1ExecutorKnowsWillLocation: 'yes',
    client2ExecutorKnowsWillLocation: 'yes',
  });
  answers.set('corporations', { corporationsData: [] });
  answers.set('familyTrusts', {});
  answers.set('realEstate', { propertiesData: [{ id: 'p1', name: 'Home', type: 'primary_home', country: 'canada' }] });

  const entities: EntityEntry[] = [
    makeEntity('ent_john', 'person', 'John Smith'),
    makeEntity('ent_jane', 'person', 'Jane Smith'),
  ];
  const relationships: EntityRelationship[] = [];

  return { answers, entities, relationships };
}

// ── FIXTURE 2: Outdated Estate Plan / New Complexity ──

export function fixture2OutdatedEstatePlan(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', {
    fullName: 'Robert Chen',
    spouseName: 'Mary Chen',
    maritalStatus: 'married',
    marriageYear: '2016',
    province: 'Ontario',
    client1EntityId: 'ent_robert',
    client2EntityId: 'ent_mary',
    client1PersonId: 'pers_robert',
    client2PersonId: 'pers_mary',
  });
  answers.set('wills', {
    client1HasWill: 'yes',
    client1WillYear: '2014',
    client1WillPreparedByLawyer: 'yes',
    client1WillJurisdiction: 'canada',
    client1WillLocation: { location: 'with_lawyer' },
    client2HasWill: 'yes',
    client2WillYear: '2014',
    client2WillPreparedByLawyer: 'yes',
    client2WillJurisdiction: 'canada',
    client2WillLocation: { location: 'with_lawyer' },
  });
  answers.set('powersOfAttorney', {
    client1HasPoaProperty: 'yes',
    client1PoaPropertyLocation: { location: 'with_lawyer' },
    client1HasPoaPersonalCare: 'yes',
    client1PoaPersonalCareLocation: { location: 'with_lawyer' },
    client2HasPoaProperty: 'yes',
    client2PoaPropertyLocation: { location: 'with_lawyer' },
    client2HasPoaPersonalCare: 'yes',
    client2PoaPersonalCareLocation: { location: 'with_lawyer' },
  });
  answers.set('children', {
    childrenData: [
      { id: 'child_1', name: 'Emma Chen', dateOfBirth: '2017-06-01', proposedGuardianId: 'pers_g', proposedGuardianName: 'Aunt Lisa', spokenToGuardian: 'yes' },
    ],
  });
  answers.set('familyTrusts', {
    trustLegalName: 'Chen Family Trust',
    establishmentYear: '2018',
    hasDebts: 'no',
    twentyOneYearRule: { confirmedByProfessional: 'no', planningCompleted: 'not_sure' },
    trustDeedLocation: { location: 'with_lawyer' },
    trustees: [{ id: 't1', personType: 'client1', personName: 'Robert Chen' }],
    beneficiaries: [{ id: 'b1', personName: 'Emma Chen' }],
  });
  answers.set('corporations', {
    corporationsData: [
      { legalName: 'Chen Holdings Inc.', owners: [{ id: 'o1', name: 'Robert Chen', type: 'person' }], shareholderAgreement: 'no', businessContinuesAfterDeath: 'yes' },
    ],
  });
  answers.set('realEstate', { propertiesData: [{ id: 'p1', name: 'Home', type: 'primary_home', country: 'canada' }] });
  answers.set('previousRelationships', {
    client1PreviousRelationshipsData: [],
    client2PreviousRelationshipsData: [],
  });

  const entities: EntityEntry[] = [
    makeEntity('ent_robert', 'person', 'Robert Chen'),
    makeEntity('ent_mary', 'person', 'Mary Chen'),
    makeEntity('ent_chen_holdings', 'corporation', 'Chen Holdings Inc.'),
    makeEntity('ent_chen_trust', 'trust', 'Chen Family Trust'),
  ];
  const relationships: EntityRelationship[] = [];

  return { answers, entities, relationships };
}

// ── FIXTURE 3: Business Owner with Personal Guarantees ──

export function fixture3BusinessOwnerGuarantees(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', {
    fullName: 'John Doe',
    spouseName: '',
    maritalStatus: 'single',
    province: 'Ontario',
    client1EntityId: 'ent_john_doe',
    client1PersonId: 'pers_john_doe',
  });
  answers.set('wills', {
    client1HasWill: 'yes',
    client1WillYear: '2023',
    client1WillPreparedByLawyer: 'yes',
    client1WillJurisdiction: 'canada',
    client1WillLocation: { location: 'with_lawyer' },
  });
  answers.set('powersOfAttorney', {
    client1HasPoaProperty: 'yes',
    client1PoaPropertyLocation: { location: 'with_lawyer' },
    client1HasPoaPersonalCare: 'yes',
    client1PoaPersonalCareLocation: { location: 'with_lawyer' },
  });
  answers.set('corporations', {
    corporationsData: [
      { legalName: 'HoldCo', owners: [{ id: 'o1', name: 'John Doe', type: 'person' }], shareholderAgreement: 'yes', businessContinuesAfterDeath: 'yes' },
      { legalName: 'OpCo', owners: [{ id: 'o2', name: 'HoldCo', type: 'corporation' }], shareholderAgreement: 'no', businessContinuesAfterDeath: 'yes' },
    ],
  });
  answers.set('children', { childrenData: [] });
  answers.set('realEstate', { propertiesData: [{ id: 'p1', name: 'Home', type: 'primary_home', country: 'canada' }] });
  answers.set('familyTrusts', {});

  // Obligation entities with canonical IDs
  const obl1Meta = {
    obligationType: 'corporate_operating_loan',
    direction: 'other',
    amount: '750000',
    amountUnknown: false,
    secured: 'no',
    borrowerEntityId: 'ent_opco',
    lenderEntityId: 'ent_rbc',
    guarantors: [{ entityId: 'ent_john_doe', entityType: 'person', displayName: 'John Doe' }],
    documentLocationLabel: 'Home office',
    sourceRecordId: 'pg_0',
  };
  const obl2Meta = {
    obligationType: 'corporate_term_loan',
    direction: 'other',
    amount: '300000',
    amountUnknown: false,
    secured: 'no',
    borrowerEntityId: 'ent_opco',
    lenderEntityId: 'ent_td',
    guarantors: [
      { entityId: 'ent_john_doe', entityType: 'person', displayName: 'John Doe' },
      { entityId: 'ent_holdco', entityType: 'corporation', displayName: 'HoldCo' },
    ],
    documentLocationLabel: 'Home office',
    sourceRecordId: 'pg_1',
  };

  const entities: EntityEntry[] = [
    makeEntity('ent_john_doe', 'person', 'John Doe'),
    makeEntity('ent_holdco', 'corporation', 'HoldCo'),
    makeEntity('ent_opco', 'corporation', 'OpCo'),
    makeEntity('ent_rbc', 'lender', 'RBC'),
    makeEntity('ent_td', 'lender', 'TD'),
    makeEntity('obl_1', 'obligation', 'RBC — OpCo', obl1Meta),
    makeEntity('obl_2', 'obligation', 'TD — OpCo', obl2Meta),
  ];

  const relationships: EntityRelationship[] = [
    makeRel('r1', 'ent_opco', 'obl_1', 'borrower_of'),
    makeRel('r2', 'ent_rbc', 'obl_1', 'lender_of'),
    makeRel('r3', 'ent_john_doe', 'obl_1', 'guarantor_of'),
    makeRel('r4', 'ent_opco', 'obl_2', 'borrower_of'),
    makeRel('r5', 'ent_td', 'obl_2', 'lender_of'),
    makeRel('r6', 'ent_john_doe', 'obl_2', 'guarantor_of'),
    makeRel('r7', 'ent_holdco', 'obl_2', 'guarantor_of'),
  ];

  return { answers, entities, relationships };
}

// ── FIXTURE 4: Trustee Exposure Unclear ──

export function fixture4TrusteeExposureUnclear(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', {
    fullName: 'Sarah Johnson',
    spouseName: '',
    maritalStatus: 'single',
    province: 'Ontario',
    client1EntityId: 'ent_sarah',
    client1PersonId: 'pers_sarah',
  });
  answers.set('wills', {
    client1HasWill: 'yes',
    client1WillYear: '2023',
    client1WillPreparedByLawyer: 'yes',
    client1WillJurisdiction: 'canada',
    client1WillLocation: { location: 'with_lawyer' },
  });
  answers.set('powersOfAttorney', {
    client1HasPoaProperty: 'yes',
    client1PoaPropertyLocation: { location: 'with_lawyer' },
    client1HasPoaPersonalCare: 'yes',
    client1PoaPersonalCareLocation: { location: 'with_lawyer' },
  });
  answers.set('familyTrusts', {
    trustLegalName: 'Johnson Family Trust',
    establishmentYear: '2020',
    hasDebts: 'yes',
    debts: [{ id: 'd1', lender: 'BMO', approximateBalance: '500000', hasPersonalGuarantee: 'not_sure', secured: 'not_sure', limitedRecourse: 'not_sure' }],
    twentyOneYearRule: { confirmedByProfessional: 'no', planningCompleted: 'not_sure' },
    trustDeedLocation: { location: 'with_lawyer' },
    trustees: [{ id: 't1', personType: 'client1', personName: 'Sarah Johnson' }],
    beneficiaries: [{ id: 'b1', personName: 'Sarah Johnson' }],
  });
  answers.set('corporations', { corporationsData: [] });
  answers.set('children', { childrenData: [] });
  answers.set('realEstate', { propertiesData: [{ id: 'p1', name: 'Home', type: 'primary_home', country: 'canada' }] });

  const oblMeta = {
    obligationType: 'trust_borrowing',
    direction: 'trust_owes',
    amount: '500000',
    amountUnknown: false,
    secured: 'not_sure',
    borrowerEntityId: 'ent_johnson_trust',
    lenderEntityId: 'ent_bmo',
    guarantors: [],
    sourceRecordId: 'td_0',
  };

  const entities: EntityEntry[] = [
    makeEntity('ent_sarah', 'person', 'Sarah Johnson'),
    makeEntity('ent_johnson_trust', 'trust', 'Johnson Family Trust'),
    makeEntity('ent_bmo', 'lender', 'BMO'),
    makeEntity('obl_trust_1', 'obligation', 'BMO — Johnson Family Trust', oblMeta),
  ];

  const relationships: EntityRelationship[] = [
    makeRel('r1', 'ent_johnson_trust', 'obl_trust_1', 'borrower_of'),
    makeRel('r2', 'ent_bmo', 'obl_trust_1', 'lender_of'),
  ];

  return { answers, entities, relationships };
}

// ── FIXTURE 5: Blended Family / Continuity Issues ──

export function fixture5BlendedFamilyContinuity(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', {
    fullName: 'Michael Brown',
    spouseName: 'Lisa Brown',
    maritalStatus: 'married',
    marriageYear: '2020',
    province: 'Ontario',
    client1EntityId: 'ent_michael',
    client2EntityId: 'ent_lisa',
    client1PersonId: 'pers_michael',
    client2PersonId: 'pers_lisa',
    client1HasPreviousRelationship: 'yes',
  });
  answers.set('previousRelationships', {
    client1PreviousRelationshipsData: [
      { id: 'pr1', childrenNames: ['Tom Brown'], paysChildSupport: 'yes', paysSpousalSupport: 'no', estateTreatmentReviewed: 'no' },
    ],
    client2PreviousRelationshipsData: [],
  });
  answers.set('wills', {
    client1HasWill: 'yes',
    client1WillYear: '2018',
    client1WillPreparedByLawyer: 'yes',
    client1WillJurisdiction: 'canada',
    client1WillLocation: { location: 'home_office' },
    client2HasWill: 'yes',
    client2WillYear: '2018',
    client2WillPreparedByLawyer: 'yes',
    client2WillJurisdiction: 'canada',
    client2WillLocation: { location: 'home_office' },
  });
  answers.set('powersOfAttorney', {
    client1HasPoaProperty: 'yes',
    client1PoaPropertyLocation: { location: 'home_office' },
    client1HasPoaPersonalCare: 'yes',
    client1PoaPersonalCareLocation: { location: 'home_office' },
    client2HasPoaProperty: 'yes',
    client2PoaPropertyLocation: { location: 'home_office' },
    client2HasPoaPersonalCare: 'yes',
    client2PoaPersonalCareLocation: { location: 'home_office' },
  });
  answers.set('children', {
    childrenData: [
      { id: 'child_1', name: 'Tom Brown', dateOfBirth: '2012-03-01', proposedGuardianId: 'pers_aunt', proposedGuardianName: 'Aunt Susan', spokenToGuardian: 'yes' },
      { id: 'child_2', name: 'Olivia Brown', dateOfBirth: '2021-05-01', proposedGuardianId: 'pers_aunt', proposedGuardianName: 'Aunt Susan', spokenToGuardian: 'yes' },
    ],
  });
  answers.set('estateTrustees', {
    client1ExecutorKnowsWillLocation: 'no',
    client2ExecutorKnowsWillLocation: 'no',
  });
  answers.set('corporations', {
    corporationsData: [
      { legalName: 'Brown Consulting Inc.', owners: [{ id: 'o1', name: 'Michael Brown', type: 'person' }], shareholderAgreement: 'yes', businessContinuesAfterDeath: 'yes', soleSigningAuthority: 'yes', soleDecisionMaker: 'yes', noBackupSigning: 'yes' },
    ],
  });
  answers.set('realEstate', { propertiesData: [{ id: 'p1', name: 'Home', type: 'primary_home', country: 'canada' }] });
  answers.set('familyTrusts', {});

  const entities: EntityEntry[] = [
    makeEntity('ent_michael', 'person', 'Michael Brown'),
    makeEntity('ent_lisa', 'person', 'Lisa Brown'),
    makeEntity('ent_brown_consulting', 'corporation', 'Brown Consulting Inc.'),
  ];
  const relationships: EntityRelationship[] = [];

  return { answers, entities, relationships };
}

// ── EDGE CASES ──

// Edge A: Unknown answer is not interpreted as No
export function edgeA_UnknownIsNotNo(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', {
    fullName: 'Test A',
    maritalStatus: 'single',
    province: 'Ontario',
    client1EntityId: 'ent_a',
    client1PersonId: 'pers_a',
  });
  answers.set('wills', {
    client1HasWill: 'not_sure',
  });
  answers.set('powersOfAttorney', {
    client1HasPoaProperty: 'not_sure',
    client1HasPoaPersonalCare: 'not_sure',
  });

  return {
    answers,
    entities: [makeEntity('ent_a', 'person', 'Test A')],
    relationships: [],
  };
}

// Edge B: Deleted Corporation cannot trigger HR-16 or HR-17
export function edgeB_DeletedCorporation(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', { fullName: 'Test B', maritalStatus: 'single', province: 'Ontario', client1EntityId: 'ent_b' });
  answers.set('corporations', {
    corporationsData: [
      { legalName: 'Deleted Corp', owners: [{ id: 'o1', name: 'A' }, { id: 'o2', name: 'B' }], shareholderAgreement: 'no', businessContinuesAfterDeath: 'yes', soleSigningAuthority: 'yes', soleDecisionMaker: 'yes', noBackupSigning: 'yes' },
    ],
  });
  answers.set('wills', { client1HasWill: 'yes', client1WillYear: '2023', client1WillPreparedByLawyer: 'yes', client1WillJurisdiction: 'canada', client1WillLocation: { location: 'home' } });
  answers.set('powersOfAttorney', { client1HasPoaProperty: 'yes', client1PoaPropertyLocation: { location: 'home' }, client1HasPoaPersonalCare: 'yes', client1PoaPersonalCareLocation: { location: 'home' } });

  // Entity is inactive
  const inactiveCorp = makeEntity('ent_deleted_corp', 'corporation', 'Deleted Corp');
  inactiveCorp.active = false;

  return {
    answers,
    entities: [makeEntity('ent_b', 'person', 'Test B'), inactiveCorp],
    relationships: [],
  };
}

// Edge C: Deleted Obligation cannot trigger HR-21
export function edgeC_DeletedObligation(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', { fullName: 'Test C', maritalStatus: 'single', province: 'Ontario', client1EntityId: 'ent_c', client1PersonId: 'pers_c' });
  answers.set('wills', { client1HasWill: 'yes', client1WillYear: '2023', client1WillPreparedByLawyer: 'yes', client1WillJurisdiction: 'canada', client1WillLocation: { location: 'home' } });
  answers.set('powersOfAttorney', { client1HasPoaProperty: 'yes', client1PoaPropertyLocation: { location: 'home' }, client1HasPoaPersonalCare: 'yes', client1PoaPersonalCareLocation: { location: 'home' } });

  const inactiveObl = makeEntity('obl_inactive', 'obligation', 'RBC — OpCo', {
    obligationType: 'corporate_operating_loan',
    borrowerEntityId: 'ent_opco_c',
    lenderEntityId: 'ent_rbc_c',
    amount: '500000',
    guarantors: [{ entityId: 'ent_c', entityType: 'person', displayName: 'Test C' }],
  });
  inactiveObl.active = false;

  return {
    answers,
    entities: [makeEntity('ent_c', 'person', 'Test C'), makeEntity('ent_opco_c', 'corporation', 'OpCo'), inactiveObl],
    relationships: [],
  };
}

// Edge D: Same person with multiple roles remains one Person entity
export function edgeD_MultipleRolesOnePerson(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', { fullName: 'Test D', maritalStatus: 'single', province: 'Ontario', client1EntityId: 'ent_d', client1PersonId: 'pers_d' });
  answers.set('wills', { client1HasWill: 'yes', client1WillYear: '2023', client1WillPreparedByLawyer: 'yes', client1WillJurisdiction: 'canada', client1WillLocation: { location: 'home' } });
  answers.set('powersOfAttorney', { client1HasPoaProperty: 'yes', client1PoaPropertyLocation: { location: 'home' }, client1HasPoaPersonalCare: 'yes', client1PoaPersonalCareLocation: { location: 'home' } });

  // Single person entity that is both executor and guardian
  return {
    answers,
    entities: [makeEntity('ent_d', 'person', 'Test D')],
    relationships: [],
  };
}

// Edge E: Same Obligation guaranteed by Client and Corporation is counted once in borrower debt
export function edgeE_SameObligationMultipleGuarantors(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', { fullName: 'Test E', maritalStatus: 'single', province: 'Ontario', client1EntityId: 'ent_e', client1PersonId: 'pers_e' });
  answers.set('wills', { client1HasWill: 'yes', client1WillYear: '2023', client1WillPreparedByLawyer: 'yes', client1WillJurisdiction: 'canada', client1WillLocation: { location: 'home' } });
  answers.set('powersOfAttorney', { client1HasPoaProperty: 'yes', client1PoaPropertyLocation: { location: 'home' }, client1HasPoaPersonalCare: 'yes', client1PoaPersonalCareLocation: { location: 'home' } });

  const oblMeta = {
    obligationType: 'corporate_term_loan',
    borrowerEntityId: 'ent_opco_e',
    lenderEntityId: 'ent_rbc_e',
    amount: '500000',
    guarantors: [
      { entityId: 'ent_e', entityType: 'person', displayName: 'Test E' },
      { entityId: 'ent_holdco_e', entityType: 'corporation', displayName: 'HoldCo' },
    ],
  };

  return {
    answers,
    entities: [
      makeEntity('ent_e', 'person', 'Test E'),
      makeEntity('ent_holdco_e', 'corporation', 'HoldCo'),
      makeEntity('ent_opco_e', 'corporation', 'OpCo'),
      makeEntity('ent_rbc_e', 'lender', 'RBC'),
      makeEntity('obl_e', 'obligation', 'RBC — OpCo', oblMeta),
    ],
    relationships: [
      makeRel('r1', 'ent_opco_e', 'obl_e', 'borrower_of'),
      makeRel('r2', 'ent_rbc_e', 'obl_e', 'lender_of'),
      makeRel('r3', 'ent_e', 'obl_e', 'guarantor_of'),
      makeRel('r4', 'ent_holdco_e', 'obl_e', 'guarantor_of'),
    ],
  };
}

// Edge F: Professional review after life event suppresses HR-02
export function edgeF_ProfessionalReviewSuppressesHR02(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', { fullName: 'Test F', maritalStatus: 'married', spouseName: 'Spouse F', marriageYear: '2020', province: 'Ontario', client1EntityId: 'ent_f', client2EntityId: 'ent_f2' });
  answers.set('wills', {
    client1HasWill: 'yes',
    client1WillYear: '2018',
    client1WillPreparedByLawyer: 'yes',
    client1WillJurisdiction: 'canada',
    client1WillLocation: { location: 'home' },
    client1WillReviewedAfterChanges: 'yes',
  });
  answers.set('powersOfAttorney', { client1HasPoaProperty: 'yes', client1PoaPropertyLocation: { location: 'home' }, client1HasPoaPersonalCare: 'yes', client1PoaPersonalCareLocation: { location: 'home' } });
  answers.set('children', { childrenData: [] });
  answers.set('corporations', { corporationsData: [] });
  answers.set('familyTrusts', {});
  answers.set('realEstate', { propertiesData: [{ id: 'p1', name: 'Home', type: 'primary_home', country: 'canada' }] });

  return {
    answers,
    entities: [makeEntity('ent_f', 'person', 'Test F'), makeEntity('ent_f2', 'person', 'Spouse F')],
    relationships: [],
  };
}

// Edge G: Guardian different from Estate Trustee does NOT trigger HR-08 without coordination gaps
export function edgeG_GuardianDifferentFromTrusteeNoGap(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', { fullName: 'Test G', maritalStatus: 'single', province: 'Ontario', client1EntityId: 'ent_g' });
  answers.set('wills', { client1HasWill: 'yes', client1WillYear: '2023', client1WillPreparedByLawyer: 'yes', client1WillJurisdiction: 'canada', client1WillLocation: { location: 'home' } });
  answers.set('powersOfAttorney', { client1HasPoaProperty: 'yes', client1PoaPropertyLocation: { location: 'home' }, client1HasPoaPersonalCare: 'yes', client1PoaPersonalCareLocation: { location: 'home' } });
  answers.set('children', {
    childrenData: [
      { id: 'c1', name: 'Kid G', dateOfBirth: '2018-01-01', proposedGuardianId: 'pers_guardian_g', proposedGuardianName: 'Guardian G', spokenToGuardian: 'yes' },
    ],
    guardianRoutineExpensesClear: 'yes',
    guardianMajorExpensesClear: 'yes',
    guardianHousingFundingClear: 'yes',
    guardianTrusteeCommunicationClear: 'yes',
    guardianRoleResponsibilityClear: 'yes',
  });

  return {
    answers,
    entities: [makeEntity('ent_g', 'person', 'Test G')],
    relationships: [],
  };
}

// Edge H: Shareholder loan existence alone does NOT trigger HR-23
export function edgeH_ShareholderLoanAloneNoTrigger(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', { fullName: 'Test H', maritalStatus: 'single', province: 'Ontario', client1EntityId: 'ent_h' });
  answers.set('wills', { client1HasWill: 'yes', client1WillYear: '2023', client1WillPreparedByLawyer: 'yes', client1WillJurisdiction: 'canada', client1WillLocation: { location: 'home' } });
  answers.set('powersOfAttorney', { client1HasPoaProperty: 'yes', client1PoaPropertyLocation: { location: 'home' }, client1HasPoaPersonalCare: 'yes', client1PoaPersonalCareLocation: { location: 'home' } });

  // Well-documented shareholder loan with no issues
  const oblMeta = {
    obligationType: 'shareholder_loan',
    borrowerEntityId: 'ent_opco_h',
    lenderEntityId: 'ent_h',
    amount: '100000',
    guarantors: [],
    documentLocationLabel: 'Home office',
    sourceRecordId: 'sl_0',
  };

  return {
    answers,
    entities: [
      makeEntity('ent_h', 'person', 'Test H'),
      makeEntity('ent_opco_h', 'corporation', 'OpCo'),
      makeEntity('obl_h', 'obligation', 'Test H — OpCo', oblMeta),
    ],
    relationships: [
      makeRel('r1', 'ent_opco_h', 'obl_h', 'borrower_of'),
      makeRel('r2', 'ent_h', 'obl_h', 'lender_of'),
    ],
  };
}

// Edge I: Incomplete/unvisited section does NOT create false findings
export function edgeI_IncompleteSectionNoFalseFindings(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', { fullName: 'Test I', maritalStatus: 'single', province: 'Ontario', client1EntityId: 'ent_i' });
  // No wills, no POA, no children, no corporations sections at all

  return {
    answers,
    entities: [makeEntity('ent_i', 'person', 'Test I')],
    relationships: [],
  };
}

// Edge J: Foreign property does not automatically create recommendation for foreign Will
export function edgeJ_ForeignPropertyNoForeignWillRecommendation(): HiddenRiskEngineInput {
  const answers = new Map<string, Record<string, unknown>>();
  answers.set('aboutYou', { fullName: 'Test J', maritalStatus: 'single', province: 'Ontario', client1EntityId: 'ent_j' });
  answers.set('wills', { client1HasWill: 'yes', client1WillYear: '2023', client1WillPreparedByLawyer: 'yes', client1WillJurisdiction: 'canada', client1WillLocation: { location: 'home' } });
  answers.set('powersOfAttorney', { client1HasPoaProperty: 'yes', client1PoaPropertyLocation: { location: 'home' }, client1HasPoaPersonalCare: 'yes', client1PoaPersonalCareLocation: { location: 'home' } });
  answers.set('realEstate', { propertiesData: [{ id: 'p1', name: 'Florida Condo', type: 'vacation_home', country: 'USA' }] });
  answers.set('children', { childrenData: [] });
  answers.set('corporations', { corporationsData: [] });
  answers.set('familyTrusts', {});

  return {
    answers,
    entities: [makeEntity('ent_j', 'person', 'Test J')],
    relationships: [],
  };
}
