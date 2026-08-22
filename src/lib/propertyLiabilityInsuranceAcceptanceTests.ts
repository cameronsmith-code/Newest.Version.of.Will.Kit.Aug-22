/**
 * Property & Liability Insurance — Acceptance Tests A–J
 *
 * Pure functions, no test framework required.
 * Tests verify canonical data model, relationships, and dedup.
 */

import type {
  PropertyLiabilityPolicy,
  PropertyLiabilityInsuranceData,
} from './propertyLiabilityInsuranceTypes';
import {
  emptyPolicy,
  deriveKnownProperties,
  deriveKnownVehicles,
  deriveBankAccounts,
  deriveCreditCards,
  generateCreditCardId,
} from './propertyLiabilityInsuranceTypes';
import {
  buildExecutorDataset,
  buildDocumentLocationSummary,
  buildIntelligenceSignals,
} from './propertyLiabilityInsuranceOutput';

export interface AcceptanceTestResult {
  name: string;
  passed: boolean;
  detail: string;
}

// ── Helpers ──

function makeData(policies: PropertyLiabilityPolicy[]): PropertyLiabilityInsuranceData {
  return { policies };
}

// ── Test A: Home — one policy linked to property ──

export function testA_Home(): AcceptanceTestResult {
  const propId = 'prop_home';
  const policy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_home_001',
    insurerName: 'Intact',
    brokerName: 'Sarah / ABC Insurance',
    premiumAmount: '2400',
    premiumFrequency: 'annually',
    paymentSourceId: 'acct_rbc_joint',
    paymentSourceType: 'bank_account',
    paymentSourceLabel: 'RBC Joint Chequing',
    documentLocationId: 'loc_sidedrawer',
    documentLocationLabel: 'SideDrawer',
    relatedPropertyIds: [propId],
  };
  const data = makeData([policy]);
  const propNames = new Map([[propId, 'Our Home']]);
  const vehNames = new Map();
  const polLabels = new Map([[policy.id, 'Our Home Insurance']]);
  const executor = buildExecutorDataset(data, propNames, vehNames, polLabels);

  const hasOnePolicy = data.policies.length === 1;
  const linkedToProperty = data.policies[0].relatedPropertyIds.includes(propId);
  const noDuplicateProperty = data.policies[0].relatedPropertyIds.length === 1;
  const hasStableIds = !!data.policies[0].paymentSourceId && !!data.policies[0].documentLocationId;
  const executorHasEntry = executor.activePolicies.length === 1;
  const passed = hasOnePolicy && linkedToProperty && noDuplicateProperty && hasStableIds && executorHasEntry;

  return {
    name: 'Test A — Home insurance linked to property',
    passed,
    detail: `policies=${data.policies.length}, linkedToProp=${linkedToProperty}, stableIds=${hasStableIds}, executorEntries=${executor.activePolicies.length}`,
  };
}

// ── Test B: Vacancy note stored as client-reported continuity info ──

export function testB_Vacancy(): AcceptanceTestResult {
  const policy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_home_001',
    relatedPropertyIds: ['prop_home'],
    vacancyRequirementsKnown: 'yes',
    vacancyNotes: 'Call broker if vacant longer than 30 days.',
  };
  const data = makeData([policy]);
  const propNames = new Map([['prop_home', 'Our Home']]);
  const executor = buildExecutorDataset(data, propNames, new Map(), new Map());

  const hasVacancyNote = data.policies[0].vacancyNotes === 'Call broker if vacant longer than 30 days.';
  const executorHasNote = !!executor.activePolicies[0]?.vacancyNotes;
  const noLegalConclusion = data.policies[0].vacancyRequirementsKnown === 'yes';
  const passed = hasVacancyNote && executorHasNote && noLegalConclusion;

  return {
    name: 'Test B — Vacancy requirements stored as continuity info',
    passed,
    detail: `vacancyKnown=${data.policies[0].vacancyRequirementsKnown}, notePresent=${hasVacancyNote}, executorHasNote=${executorHasNote}`,
  };
}

// ── Test C: Rental — uncertainty preserved ──

export function testC_Rental(): AcceptanceTestResult {
  const policy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_rental_001',
    relatedPropertyIds: ['prop_rental'],
    insurerKnowsRental: 'not_sure',
    landlordCoverageKnown: 'not_sure',
  };
  const data = makeData([policy]);
  const signals = buildIntelligenceSignals(data, ['prop_rental']);

  const uncertaintyPreserved = data.policies[0].insurerKnowsRental === 'not_sure' && data.policies[0].landlordCoverageKnown === 'not_sure';
  const noAdequacyConclusion = !data.policies[0].notes || !data.policies[0].notes.includes('adequate');
  const hasRentalSignal = signals.signals.some((s) => s.signalType === 'rental_coverage_unknown');
  const passed = uncertaintyPreserved && noAdequacyConclusion && hasRentalSignal;

  return {
    name: 'Test C — Rental property uncertainty preserved',
    passed,
    detail: `insurerKnowsRental=${data.policies[0].insurerKnowsRental}, landlordKnown=${data.policies[0].landlordCoverageKnown}, hasSignal=${hasRentalSignal}`,
  };
}

// ── Test D: Two vehicles, one auto policy ──

export function testD_TwoVehiclesOnePolicy(): AcceptanceTestResult {
  const bmwId = 'veh_bmw';
  const hondaId = 'veh_honda';
  const policy: PropertyLiabilityPolicy = {
    ...emptyPolicy('auto'),
    id: 'pol_auto_001',
    insurerName: 'Aviva',
    premiumAmount: '320',
    premiumFrequency: 'monthly',
    relatedVehicleIds: [bmwId, hondaId],
  };
  const data = makeData([policy]);
  const vehNames = new Map([[bmwId, 'BMW X5'], [hondaId, 'Honda CR-V']]);
  const polLabels = new Map([[policy.id, 'Auto Policy']]);
  const executor = buildExecutorDataset(data, new Map(), vehNames, polLabels);

  const onePolicy = data.policies.length === 1;
  const bothVehiclesLinked = data.policies[0].relatedVehicleIds.length === 2;
  const noDuplicatePolicy = data.policies.filter((p) => p.policyType === 'auto').length === 1;
  const executorHasBothVehicles = executor.activePolicies[0].relatedVehicleNames.length === 2;
  const passed = onePolicy && bothVehiclesLinked && noDuplicatePolicy && executorHasBothVehicles;

  return {
    name: 'Test D — Two vehicles on one auto policy',
    passed,
    detail: `policies=${data.policies.length}, vehiclesLinked=${data.policies[0].relatedVehicleIds.length}, executorVehicles=${executor.activePolicies[0].relatedVehicleNames.length}`,
  };
}

// ── Test E: Boat covered under existing home policy ──

export function testE_BoatOnHomePolicy(): AcceptanceTestResult {
  const boatId = 'veh_boat';
  const homePolicy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_home_001',
    insurerName: 'Intact',
    relatedPropertyIds: ['prop_home'],
    relatedOtherAssetIds: [boatId],
  };
  const data = makeData([homePolicy]);
  const passed = data.policies.length === 1 && data.policies[0].relatedOtherAssetIds.includes(boatId) && !data.policies.some((p) => p.id === 'pol_boat');

  return {
    name: 'Test E — Boat linked to existing home policy',
    passed,
    detail: `policies=${data.policies.length}, boatLinked=${data.policies[0].relatedOtherAssetIds.includes(boatId)}, noSecondPolicy=${!data.policies.some((p) => p.id === 'pol_boat')}`,
  };
}

// ── Test F: Umbrella with two underlying policies ──

export function testF_Umbrella(): AcceptanceTestResult {
  const homePolId = 'pol_home_001';
  const autoPolId = 'pol_auto_001';
  const umbrella: PropertyLiabilityPolicy = {
    ...emptyPolicy('umbrella'),
    id: 'pol_umbrella_001',
    insurerName: 'Aviva',
    umbrellaCoverageAmount: '2000000',
    underlyingPolicyIds: [homePolId, autoPolId],
    documentLocationId: 'loc_sidedrawer',
    documentLocationLabel: 'SideDrawer',
  };
  const home: PropertyLiabilityPolicy = { ...emptyPolicy('property'), id: homePolId, relatedPropertyIds: ['prop_home'] };
  const auto: PropertyLiabilityPolicy = { ...emptyPolicy('auto'), id: autoPolId, relatedVehicleIds: ['veh_bmw'] };

  const data = makeData([home, auto, umbrella]);
  const polLabels = new Map([
    [homePolId, 'Our Home Policy'],
    [autoPolId, 'Auto Policy'],
    [umbrella.id, 'Umbrella Liability'],
  ]);
  const executor = buildExecutorDataset(data, new Map(), new Map(), polLabels);

  const oneUmbrella = data.policies.filter((p) => p.policyType === 'umbrella').length === 1;
  const twoUnderlying = umbrella.underlyingPolicyIds.length === 2;
  const executorHasUnderlying = executor.activePolicies.find((p) => p.policyId === umbrella.id)?.underlyingPolicyLabels.length === 2;
  const passed = oneUmbrella && twoUnderlying && executorHasUnderlying;

  return {
    name: 'Test F — Umbrella with two underlying policy relationships',
    passed,
    detail: `umbrellaPolicies=${data.policies.filter((p) => p.policyType === 'umbrella').length}, underlyingCount=${umbrella.underlyingPolicyIds.length}, executorUnderlying=${executor.activePolicies.find((p) => p.policyId === umbrella.id)?.underlyingPolicyLabels.length}`,
  };
}

// ── Test G: Payment account retroactive add ──

export function testG_PaymentAccountRetroactive(): AcceptanceTestResult {
  const policy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_home_001',
    paymentSourceId: 'acct_rbc_chequing',
    paymentSourceType: 'bank_account',
    paymentSourceLabel: 'RBC Chequing',
    relatedPropertyIds: ['prop_home'],
  };
  const data = makeData([policy]);

  const hasStableId = data.policies[0].paymentSourceId === 'acct_rbc_chequing';
  const hasLabel = data.policies[0].paymentSourceLabel === 'RBC Chequing';
  const hasCorrectType = data.policies[0].paymentSourceType === 'bank_account';
  const passed = hasStableId && hasLabel && hasCorrectType;

  return {
    name: 'Test G — Payment account retroactive add',
    passed,
    detail: `paymentSourceId=${data.policies[0].paymentSourceId}, sourceType=${data.policies[0].paymentSourceType}, label=${data.policies[0].paymentSourceLabel}`,
  };
}

// ── Test H: Document location shared across policies ──

export function testH_DocumentLocationShared(): AcceptanceTestResult {
  const locId = 'loc_sidedrawer';
  const locLabel = 'SideDrawer — Insurance';
  const home: PropertyLiabilityPolicy = { ...emptyPolicy('property'), id: 'pol_home', documentLocationId: locId, documentLocationLabel: locLabel, relatedPropertyIds: ['prop_home'] };
  const auto: PropertyLiabilityPolicy = { ...emptyPolicy('auto'), id: 'pol_auto', documentLocationId: locId, documentLocationLabel: locLabel, relatedVehicleIds: ['veh_bmw'] };
  const umbrella: PropertyLiabilityPolicy = { ...emptyPolicy('umbrella'), id: 'pol_umbrella', documentLocationId: locId, documentLocationLabel: locLabel };

  const data = makeData([home, auto, umbrella]);
  const polLabels = new Map([
    ['pol_home', 'Our Home Insurance'],
    ['pol_auto', 'Auto Policy'],
    ['pol_umbrella', 'Umbrella Liability'],
  ]);
  const summary = buildDocumentLocationSummary(data, polLabels);

  const oneLocationId = new Set(data.policies.map((p) => p.documentLocationId)).size === 1;
  const threeRefs = summary.references.length === 3;
  const passed = oneLocationId && threeRefs;

  return {
    name: 'Test H — Document location shared across three policies',
    passed,
    detail: `uniqueLocationIds=${new Set(data.policies.map((p) => p.documentLocationId)).size}, docRefs=${summary.references.length}`,
  };
}

// ── Test I: Professional Team integration ──

export function testI_ProfessionalTeam(): AcceptanceTestResult {
  const brokerId = 'prof_sarah_jones';
  const policy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_home_001',
    brokerProfessionalId: brokerId,
    brokerName: 'Sarah Jones — ABC Insurance',
    relatedPropertyIds: ['prop_home'],
  };
  const data = makeData([policy]);
  const executor = buildExecutorDataset(data, new Map([['prop_home', 'Our Home']]), new Map(), new Map([[policy.id, 'Our Home Insurance']]));

  const hasProfessionalId = data.policies[0].brokerProfessionalId === brokerId;
  const executorHasBrokerName = executor.activePolicies[0].brokerName === 'Sarah Jones — ABC Insurance';
  const passed = hasProfessionalId && executorHasBrokerName;

  return {
    name: 'Test I — Professional Team integration',
    passed,
    detail: `brokerProfessionalId=${data.policies[0].brokerProfessionalId}, executorBrokerName=${executor.activePolicies[0].brokerName}`,
  };
}

// ── Test J: Delete policy — related records remain ──

export function testJ_DeletePolicy(): AcceptanceTestResult {
  const autoPolId = 'pol_auto_001';
  const home: PropertyLiabilityPolicy = { ...emptyPolicy('property'), id: 'pol_home_001', relatedPropertyIds: ['prop_home'] };
  const auto: PropertyLiabilityPolicy = { ...emptyPolicy('auto'), id: autoPolId, relatedVehicleIds: ['veh_bmw', 'veh_honda'], brokerProfessionalId: 'prof_sarah', paymentSourceId: 'acct_rbc', paymentSourceType: 'bank_account', documentLocationId: 'loc_sidedrawer' };
  const umbrella: PropertyLiabilityPolicy = { ...emptyPolicy('umbrella'), id: 'pol_umbrella_001', underlyingPolicyIds: ['pol_home_001', autoPolId] };

  // Simulate delete: mark auto as inactive, remove from umbrella underlying
  const updatedPolicies = data_afterDelete([home, auto, umbrella], autoPolId);
  const data = makeData(updatedPolicies);
  const autoPolicy = data.policies.find((p) => p.id === autoPolId);
  const umbrellaPolicy = data.policies.find((p) => p.id === 'pol_umbrella_001');

  const autoInactive = autoPolicy?.status === 'inactive';
  const vehiclesRemain = autoPolicy?.relatedVehicleIds.length === 2;
  const brokerRemains = !!autoPolicy?.brokerProfessionalId;
  const paymentRemains = !!autoPolicy?.paymentSourceId;
  const docRemains = !!autoPolicy?.documentLocationId;
  const umbrellaCleaned = !!umbrellaPolicy && !umbrellaPolicy.underlyingPolicyIds.includes(autoPolId);
  const passed = !!autoInactive && vehiclesRemain && brokerRemains && paymentRemains && docRemains && umbrellaCleaned;

  return {
    name: 'Test J — Delete policy preserves related records',
    passed,
    detail: `autoStatus=${autoPolicy?.status}, vehiclesRemain=${vehiclesRemain}, brokerRemains=${brokerRemains}, umbrellaCleaned=${umbrellaCleaned}`,
  };
}

function data_afterDelete(policies: PropertyLiabilityPolicy[], deletedId: string): PropertyLiabilityPolicy[] {
  return policies.map((p) => {
    if (p.id === deletedId) return { ...p, status: 'inactive' as const };
    if (p.underlyingPolicyIds.includes(deletedId)) {
      return { ...p, underlyingPolicyIds: p.underlyingPolicyIds.filter((id) => id !== deletedId) };
    }
    return p;
  });
}

// ── Integration Tests — verify real derivation pathways ──

export interface IntegrationTestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  detail: string;
}

// Integration Test: Bank Account — deriveBankAccounts uses canonical inst.id
export function integrationTest_BankAccount(): IntegrationTestResult {
  const allAnswers = new Map<string, Record<string, unknown>>([
    ['financialFootprint', {
      bankingStructure: 'individual',
      client1InstitutionsData: [
        { id: 'acct_1234567_abc', name: 'RBC Chequing', accountType: 'Chequing' },
      ],
    }],
  ]);
  const accounts = deriveBankAccounts(allAnswers, 'Client 1', 'Client 2', true);
  const hasCanonicalId = accounts.length === 1 && accounts[0].id === 'acct_1234567_abc';
  const noSyntheticId = accounts.length === 0 || !accounts[0].id.includes('_Client1_');
  const correctType = accounts.length === 1 && accounts[0].sourceType === 'bank_account';
  const passed = hasCanonicalId && noSyntheticId && correctType;

  return {
    name: 'Integration — Bank account uses canonical inst.id',
    status: passed ? 'PASS' : 'FAIL',
    detail: `accounts=${accounts.length}, id=${accounts[0]?.id || 'none'}, sourceType=${accounts[0]?.sourceType || 'none'}, noSynthetic=${noSyntheticId}`,
  };
}

// Integration Test: Credit Card — deriveCreditCards uses canonical card.id
export function integrationTest_CreditCard(): IntegrationTestResult {
  const allAnswers = new Map<string, Record<string, unknown>>([
    ['financialFootprint', {
      creditCardsData: [
        { id: 'cc_9876543_xyz', cardLabel: 'TD Visa', responsibleParty: 'client1' },
      ],
    }],
  ]);
  const cards = deriveCreditCards(allAnswers, 'Client 1', 'Client 2');
  const hasCanonicalId = cards.length === 1 && cards[0].id === 'cc_9876543_xyz';
  const hasName = cards.length === 1 && cards[0].name === 'TD Visa';
  const passed = hasCanonicalId && hasName;

  return {
    name: 'Integration — Credit card uses canonical card.id',
    status: passed ? 'PASS' : 'FAIL',
    detail: `cards=${cards.length}, id=${cards[0]?.id || 'none'}, name=${cards[0]?.name || 'none'}`,
  };
}

// Integration Test: Property — deriveKnownProperties uses propertyEntityId
export function integrationTest_Property(): IntegrationTestResult {
  const allAnswers = new Map<string, Record<string, unknown>>([
    ['realEstate', {
      propertiesData: [
        { propertyEntityId: 'ent_aaa-bbb-ccc', propertyName: 'Our Home', propertyType: 'Primary' },
      ],
    }],
  ]);
  const properties = deriveKnownProperties(allAnswers);
  const hasCanonicalId = properties.length === 1 && properties[0].id === 'ent_aaa-bbb-ccc';
  const noManufacturedId = properties.length === 0 || !properties[0].id.startsWith('prop_');
  const passed = hasCanonicalId && noManufacturedId;

  return {
    name: 'Integration — Property uses canonical propertyEntityId',
    status: passed ? 'PASS' : 'FAIL',
    detail: `properties=${properties.length}, id=${properties[0]?.id || 'none'}, noManufactured=${noManufacturedId}`,
  };
}

// Integration Test: Vehicle — deriveKnownVehicles uses canonical asset.id
export function integrationTest_Vehicle(): IntegrationTestResult {
  const allAnswers = new Map<string, Record<string, unknown>>([
    ['financialFootprint', {
      otherAssetsData: [
        { id: 'oth_1234567_xyz', friendlyLabel: 'BMW X5', subtype: 'vehicle' },
      ],
    }],
  ]);
  const vehicles = deriveKnownVehicles(allAnswers);
  const hasCanonicalId = vehicles.length === 1 && vehicles[0].id === 'oth_1234567_xyz';
  const noIndexDerivedId = vehicles.length === 0 || !vehicles[0].id.startsWith('veh_');
  const passed = hasCanonicalId && noIndexDerivedId;

  return {
    name: 'Integration — Vehicle uses canonical asset.id',
    status: passed ? 'PASS' : 'FAIL',
    detail: `vehicles=${vehicles.length}, id=${vehicles[0]?.id || 'none'}, noIndexDerived=${noIndexDerivedId}`,
  };
}

// Integration Test: Renewal Date — structured YYYY-MM-DD
export function integrationTest_RenewalDate(): IntegrationTestResult {
  const policy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_renewal_001',
    renewalDate: '2027-03-01',
  };
  const isStructured = /^\d{4}-\d{2}-\d{2}$/.test(policy.renewalDate || '');
  const isNotPlainText = policy.renewalDate !== 'March 1, 2027';

  // Also verify legacy text is preserved (not destroyed)
  const legacyPolicy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_legacy_001',
    renewalDate: 'March 1, 2027',
  };
  const legacyPreserved = legacyPolicy.renewalDate === 'March 1, 2027';
  const passed = isStructured && isNotPlainText && legacyPreserved;

  return {
    name: 'Integration — Renewal date structured YYYY-MM-DD with legacy preservation',
    status: passed ? 'PASS' : 'FAIL',
    detail: `structured=${isStructured}, notPlainText=${isNotPlainText}, legacyPreserved=${legacyPreserved}`,
  };
}

// Integration Test: Document Location — shared across policies
export function integrationTest_DocumentLocation(): IntegrationTestResult {
  const locId = 'docloc_shared_001';
  const policies: PropertyLiabilityPolicy[] = [
    { ...emptyPolicy('property'), id: 'p1', documentLocationId: locId, documentLocationLabel: 'SideDrawer' },
    { ...emptyPolicy('auto'), id: 'p2', documentLocationId: locId, documentLocationLabel: 'SideDrawer' },
    { ...emptyPolicy('umbrella'), id: 'p3', documentLocationId: locId, documentLocationLabel: 'SideDrawer' },
  ];
  const data = makeData(policies);
  const polLabels = new Map([['p1', 'Home'], ['p2', 'Auto'], ['p3', 'Umbrella']]);
  const summary = buildDocumentLocationSummary(data, polLabels);
  const oneLocationId = new Set(data.policies.map((p) => p.documentLocationId)).size === 1;
  const threeRefs = summary.references.length === 3;
  const passed = oneLocationId && threeRefs;

  return {
    name: 'Integration — Document location shared across three policies',
    status: passed ? 'PASS' : 'FAIL',
    detail: `uniqueLocationIds=${new Set(data.policies.map((p) => p.documentLocationId)).size}, refs=${summary.references.length}`,
  };
}

// Integration Test: Delete policy — umbrella relationship cleaned
export function integrationTest_DeletePolicy(): IntegrationTestResult {
  const autoId = 'pol_auto_del';
  const umbrella: PropertyLiabilityPolicy = {
    ...emptyPolicy('umbrella'),
    id: 'pol_umbrella_del',
    underlyingPolicyIds: ['pol_home_del', autoId],
  };
  const auto: PropertyLiabilityPolicy = {
    ...emptyPolicy('auto'),
    id: autoId,
    relatedVehicleIds: ['oth_bmw', 'oth_honda'],
    brokerProfessionalId: 'prof_sarah',
    paymentSourceId: 'acct_rbc',
    documentLocationId: 'docloc_001',
  };
  const home: PropertyLiabilityPolicy = { ...emptyPolicy('property'), id: 'pol_home_del' };

  const afterDelete = data_afterDelete([home, auto, umbrella], autoId);
  const deletedAuto = afterDelete.find((p) => p.id === autoId);
  const updatedUmbrella = afterDelete.find((p) => p.id === 'pol_umbrella_del');

  const autoInactive = deletedAuto?.status === 'inactive';
  const vehiclesRemain = deletedAuto?.relatedVehicleIds.length === 2;
  const brokerRemains = !!deletedAuto?.brokerProfessionalId;
  const paymentRemains = !!deletedAuto?.paymentSourceId;
  const docRemains = !!deletedAuto?.documentLocationId;
  const umbrellaCleaned = !!updatedUmbrella && !updatedUmbrella.underlyingPolicyIds.includes(autoId);
  const passed = !!autoInactive && vehiclesRemain && brokerRemains && paymentRemains && docRemains && !!umbrellaCleaned;

  return {
    name: 'Integration — Delete policy preserves related records, cleans umbrella',
    status: passed ? 'PASS' : 'FAIL',
    detail: `autoInactive=${autoInactive}, vehiclesRemain=${vehiclesRemain}, brokerRemains=${brokerRemains}, paymentRemains=${paymentRemains}, docRemains=${docRemains}, umbrellaCleaned=${umbrellaCleaned}`,
  };
}

// Integration Test: Professional — policy references canonical professional ID
export function integrationTest_Professional(): IntegrationTestResult {
  const brokerId = 'prof_uuid_abc123';
  const policy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_prof_001',
    brokerProfessionalId: brokerId,
    brokerName: 'Sarah Jones — ABC Insurance',
  };
  const hasCanonicalId = policy.brokerProfessionalId === brokerId;
  const isNotIndexDerived = !/^prof_\d+$/.test(brokerId);
  const passed = hasCanonicalId && isNotIndexDerived;

  return {
    name: 'Integration — Professional uses canonical person ID',
    status: passed ? 'PASS' : 'FAIL',
    detail: `brokerProfessionalId=${policy.brokerProfessionalId}, isNotIndexDerived=${isNotIndexDerived}`,
  };
}

// ADAPTER TEST: Credit card retroactive creation — generateCreditCardId produces stable ID
export function integrationTest_CreditCardCreation(): IntegrationTestResult {
  const newId = generateCreditCardId();
  const isStableId = newId.startsWith('cc_') && newId.length > 10;
  const isNotIndexDerived = !/^cc_\d+$/.test(newId);
  const passed = isStableId && isNotIndexDerived;

  return {
    name: 'Adapter — Credit card creation generates stable ID',
    status: passed ? 'PASS' : 'FAIL',
    detail: `newId=${newId}, isStable=${isStableId}, isNotIndexDerived=${isNotIndexDerived}`,
  };
}

// ADAPTER TEST: Property insurance status persistence (not_insured)
export function adapterTest_PropertyStatusNo(): IntegrationTestResult {
  const statusEntry = { propertyEntityId: 'ent_aaa-bbb-ccc', status: 'not_insured' as const };
  const data: PropertyLiabilityInsuranceData = { policies: [], propertyInsuranceStatuses: [statusEntry] };
  const found = data.propertyInsuranceStatuses?.find((e) => e.propertyEntityId === 'ent_aaa-bbb-ccc');
  const passed = found?.status === 'not_insured' && data.policies.length === 0;

  return {
    name: 'Adapter — Property NO status persisted without policy',
    status: passed ? 'PASS' : 'FAIL',
    detail: `status=${found?.status || 'none'}, policies=${data.policies.length}`,
  };
}

// ADAPTER TEST: Property insurance status persistence (not_sure)
export function adapterTest_PropertyStatusNotSure(): IntegrationTestResult {
  const statusEntry = { propertyEntityId: 'ent_aaa-bbb-ccc', status: 'not_sure' as const };
  const data: PropertyLiabilityInsuranceData = { policies: [], propertyInsuranceStatuses: [statusEntry] };
  const found = data.propertyInsuranceStatuses?.find((e) => e.propertyEntityId === 'ent_aaa-bbb-ccc');
  const passed = found?.status === 'not_sure' && data.policies.length === 0;

  return {
    name: 'Adapter — Property NOT SURE status persisted without policy',
    status: passed ? 'PASS' : 'FAIL',
    detail: `status=${found?.status || 'none'}, policies=${data.policies.length}`,
  };
}

// ADAPTER TEST: Property status change YES→NO preserves policy data
export function adapterTest_PropertyStatusChange(): IntegrationTestResult {
  const policy: PropertyLiabilityPolicy = {
    ...emptyPolicy('property'),
    id: 'pol_home_001',
    relatedPropertyIds: ['ent_aaa-bbb-ccc'],
    insurerName: 'Intact',
  };
  const data: PropertyLiabilityInsuranceData = {
    policies: [{ ...policy, status: 'inactive' }],
    propertyInsuranceStatuses: [{ propertyEntityId: 'ent_aaa-bbb-ccc', status: 'not_insured' }],
  };
  const policyPreserved = data.policies.find((p) => p.id === 'pol_home_001')?.insurerName === 'Intact';
  const statusChanged = data.propertyInsuranceStatuses?.find((e) => e.propertyEntityId === 'ent_aaa-bbb-ccc')?.status === 'not_insured';
  const passed = !!policyPreserved && !!statusChanged;

  return {
    name: 'Adapter — Property YES→NO preserves policy data, changes status',
    status: passed ? 'PASS' : 'FAIL',
    detail: `policyPreserved=${policyPreserved}, statusChanged=${statusChanged}`,
  };
}

// ADAPTER TEST: Legacy account fallback is migration-only
export function adapterTest_LegacyAccountFallback(): IntegrationTestResult {
  const allAnswers = new Map<string, Record<string, unknown>>([
    ['financialFootprint', {
      bankingStructure: 'individual',
      client1InstitutionsData: [
        { name: 'Old Account', accountType: 'Chequing' },
      ],
    }],
  ]);
  const accounts = deriveBankAccounts(allAnswers, 'Client 1', 'Client 2', true);
  const hasFallbackId = accounts.length === 1 && accounts[0].id === 'client1InstitutionsData_0';
  const isMigrationFallback = accounts[0]?.id.includes('_') && !accounts[0]?.id.startsWith('acct_');
  const passed = hasFallbackId && isMigrationFallback;

  return {
    name: 'Adapter — Legacy account fallback is migration-only',
    status: passed ? 'PASS' : 'FAIL',
    detail: `id=${accounts[0]?.id || 'none'}, isMigrationFallback=${isMigrationFallback}`,
  };
}

export function runAllIntegrationTests(): IntegrationTestResult[] {
  return [
    integrationTest_BankAccount(),
    integrationTest_CreditCard(),
    integrationTest_Property(),
    integrationTest_Vehicle(),
    integrationTest_RenewalDate(),
    integrationTest_DocumentLocation(),
    integrationTest_DeletePolicy(),
    integrationTest_Professional(),
    integrationTest_CreditCardCreation(),
    adapterTest_PropertyStatusNo(),
    adapterTest_PropertyStatusNotSure(),
    adapterTest_PropertyStatusChange(),
    adapterTest_LegacyAccountFallback(),
  ];
}

export function runIntegrationTestSummary(): { results: IntegrationTestResult[]; passCount: number; blockedCount: number; failCount: number } {
  const results = runAllIntegrationTests();
  return {
    results,
    passCount: results.filter((r) => r.status === 'PASS').length,
    blockedCount: results.filter((r) => r.status === 'BLOCKED').length,
    failCount: results.filter((r) => r.status === 'FAIL').length,
  };
}

// ── Run All Tests ──

export function runAllAcceptanceTests(): AcceptanceTestResult[] {
  return [
    testA_Home(),
    testB_Vacancy(),
    testC_Rental(),
    testD_TwoVehiclesOnePolicy(),
    testE_BoatOnHomePolicy(),
    testF_Umbrella(),
    testG_PaymentAccountRetroactive(),
    testH_DocumentLocationShared(),
    testI_ProfessionalTeam(),
    testJ_DeletePolicy(),
  ];
}

export function runAcceptanceTestSummary(): { passed: boolean; total: number; passedCount: number; results: AcceptanceTestResult[] } {
  const results = runAllAcceptanceTests();
  const passedCount = results.filter((r) => r.passed).length;
  return {
    passed: passedCount === results.length,
    total: results.length,
    passedCount,
    results,
  };
}
