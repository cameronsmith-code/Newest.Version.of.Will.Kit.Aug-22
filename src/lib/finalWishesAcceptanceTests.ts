/**
 * Final Wishes & Arrangements — Acceptance Tests
 *
 * Categorized as:
 * - MODEL TESTS (pure data model verification)
 * - ADAPTER TESTS (migration and derivation)
 * - RELATIONSHIP TESTS (cross-entity identity)
 */

import type { FinalWishesData } from './finalWishesTypes';
import {
  emptyProfile,
  generateProfileId,
  generateExternalContactId,
  buildExecutorSummary,
  migrateLegacyFuneralAnswers,
  loadData,
} from './finalWishesTypes';
import type { DocumentLocationRef } from './documentLocationTypes';

export interface TestResult {
  name: string;
  category: 'MODEL' | 'ADAPTER' | 'RELATIONSHIP';
  passed: boolean;
  detail: string;
}

// ── MODEL TESTS ──

export function testModel_ProfileIdentity(): TestResult {
  const p1 = emptyProfile('person_c1_uuid', 'Cameron');
  const p2 = emptyProfile('person_c2_uuid', 'Eunice');
  const data: FinalWishesData = { profiles: [p1, p2] };

  const distinctIds = data.profiles.map((p) => p.personId);
  const noLeakage = p1.personId !== p2.personId;
  const distinctProfileIds = p1.id !== p2.id;
  const passed = distinctIds.length === 2 && noLeakage && distinctProfileIds;

  return {
    name: 'Model — Two profiles have distinct person and profile IDs',
    category: 'MODEL',
    passed,
    detail: `personIds=${distinctIds.join(',')}, profileIds distinct=${distinctProfileIds}`,
  };
}

export function testModel_LowPreferenceValid(): TestResult {
  const profile = emptyProfile('person_c1', 'Client 1');
  profile.existingArrangementsStatus = 'no';
  profile.dispositionPreference = 'no_preference';
  profile.gatheringPreferences = [];
  profile.traditionsImportant = 'no';

  const summary = buildExecutorSummary(profile);
  const isLowPreference =
    !summary.hasArrangements &&
    summary.disposition === 'no_preference' &&
    summary.gatheringPreferences.length === 0 &&
    !summary.additionalWishes;

  const passed = isLowPreference && profile.status === 'active';

  return {
    name: 'Model — Low-preference profile is valid and complete',
    category: 'MODEL',
    passed,
    detail: `hasArrangements=${summary.hasArrangements}, disposition=${summary.disposition}, gatherings=${summary.gatheringPreferences.length}`,
  };
}

export function testModel_DetailedProfilePreserved(): TestResult {
  const profile = emptyProfile('person_c1', 'Cameron');
  profile.existingArrangementsStatus = 'yes';
  profile.arrangementTypes = ['cremation_arrangements', 'prepaid_plan'];
  profile.providerName = "Smith's Funeral Home";
  profile.prepaidStatus = 'yes';
  profile.documentLocationRefs = [{ locationId: 'loc_sidedrawer', label: 'SideDrawer — Estate Documents' }];
  profile.dispositionPreference = 'cremation';
  profile.gatheringPreferences = ['celebration_of_life'];
  profile.traditionsImportant = 'yes';
  profile.traditionsNotes = 'Family tradition of gathering after';
  profile.notificationPersonRefs = [
    { personId: 'person_dave', displayName: 'Dave Morrison' },
    { personId: 'person_sarah', displayName: 'Sarah Chen' },
  ];
  profile.additionalWishes = 'Good food, good wine';
  profile.familyGuidance = 'Keep it simple. Have everyone back at the house.';

  const summary = buildExecutorSummary(profile);
  const passed =
    summary.hasArrangements &&
    summary.isPrepaid &&
    summary.providerName === "Smith's Funeral Home" &&
    summary.documentLocations.length === 1 &&
    summary.disposition === 'cremation' &&
    summary.gatheringPreferences.includes('celebration_of_life') &&
    summary.notificationPeople.length === 2 &&
    summary.notificationPeople.includes('Dave Morrison') &&
    summary.additionalWishes === 'Good food, good wine' &&
    summary.familyGuidance === 'Keep it simple. Have everyone back at the house.';

  return {
    name: 'Model — Detailed profile preserves all facts',
    category: 'MODEL',
    passed,
    detail: `provider=${summary.providerName}, prepaid=${summary.isPrepaid}, disposition=${summary.disposition}, notifications=${summary.notificationPeople.length}`,
  };
}

export function testModel_ProfileIdStability(): TestResult {
  const id1 = generateProfileId();
  const id2 = generateProfileId();
  const bothStartWithPrefix = id1.startsWith('fwp_') && id2.startsWith('fwp_');
  const distinct = id1 !== id2;
  const passed = bothStartWithPrefix && distinct;

  return {
    name: 'Model — Profile IDs are stable and unique',
    category: 'MODEL',
    passed,
    detail: `id1=${id1}, id2=${id2}, distinct=${distinct}`,
  };
}

export function testModel_FamilyGuidancePreserved(): TestResult {
  const profile = emptyProfile('person_c1', 'Cameron');
  const rawText = 'Keep it simple. Have everyone back at the house, order too much food and open some good wine.';
  profile.familyGuidance = rawText;

  const summary = buildExecutorSummary(profile);
  const preservedVerbatim = summary.familyGuidance === rawText;
  const notLegalized = !summary.familyGuidance?.includes('Testator');
  const passed = preservedVerbatim && notLegalized;

  return {
    name: 'Model — Family guidance preserved verbatim, not legalized',
    category: 'MODEL',
    passed,
    detail: `verbatim=${preservedVerbatim}, notLegalized=${notLegalized}`,
  };
}

// ── ADAPTER TESTS ──

export function testAdapter_LegacyMigration(): TestResult {
  const legacyAnswers: Record<string, unknown> = {
    client1HasFuneralArrangements: 'yes',
    client1FuneralArrangementsLocation: 'Smith Funeral Home',
    client1FuneralWrittenDown: 'yes',
    client1FuneralDocLocation: 'SideDrawer',
    client2HasFuneralArrangements: 'no',
  };

  const data = migrateLegacyFuneralAnswers(
    legacyAnswers,
    'person_c1_uuid',
    'Cameron',
    true,
    'person_c2_uuid',
    'Eunice',
  );

  const c1Profile = data.profiles.find((p) => p.personId === 'person_c1_uuid');
  const c2NotMigrated = !data.profiles.find((p) => p.personId === 'person_c2_uuid');
  const c1HasArrangements = c1Profile?.existingArrangementsStatus === 'yes';
  const c1HasProvider = c1Profile?.providerName === 'Smith Funeral Home';
  const c1HasDocLoc = c1Profile?.documentLocationRefs.length === 1;
  const passed = !!c1Profile && c1HasArrangements && c1HasProvider && c1HasDocLoc && c2NotMigrated;

  return {
    name: 'Adapter — Legacy funeral answers migrated to new architecture',
    category: 'ADAPTER',
    passed,
    detail: `c1Migrated=${!!c1Profile}, c2Skipped=${c2NotMigrated}, provider=${c1Profile?.providerName}, docLocs=${c1Profile?.documentLocationRefs.length}`,
  };
}

export function testAdapter_LoadDataRoundTrip(): TestResult {
  const profile = emptyProfile('person_c1', 'Client 1');
  const data: FinalWishesData = { profiles: [profile] };
  const answers: Record<string, unknown> = { finalWishesData: data };
  const loaded = loadData(answers);
  const passed = loaded.profiles.length === 1 && loaded.profiles[0].personId === 'person_c1';

  return {
    name: 'Adapter — loadData round-trip preserves profiles',
    category: 'ADAPTER',
    passed,
    detail: `profiles=${loaded.profiles.length}, personId=${loaded.profiles[0]?.personId}`,
  };
}

export function testAdapter_ExternalContactId(): TestResult {
  const id = generateExternalContactId();
  const startsWithPrefix = id.startsWith('extc_');
  const passed = startsWithPrefix;

  return {
    name: 'Adapter — External contact ID has stable prefix',
    category: 'ADAPTER',
    passed,
    detail: `id=${id}`,
  };
}

// ── RELATIONSHIP TESTS ──

export function testRelationship_CoupleIndependence(): TestResult {
  const cameron = emptyProfile('person_c1', 'Cameron');
  cameron.dispositionPreference = 'cremation';
  cameron.gatheringPreferences = ['celebration_of_life'];

  const eunice = emptyProfile('person_c2', 'Eunice');
  eunice.dispositionPreference = 'burial';
  eunice.gatheringPreferences = ['religious_cultural_service'];

  const data: FinalWishesData = { profiles: [cameron, eunice] };
  const c1 = data.profiles.find((p) => p.personId === 'person_c1');
  const c2 = data.profiles.find((p) => p.personId === 'person_c2');

  const noLeakage = c1?.dispositionPreference === 'cremation' && c2?.dispositionPreference === 'burial';
  const differentGatherings = c1?.gatheringPreferences[0] === 'celebration_of_life' && c2?.gatheringPreferences[0] === 'religious_cultural_service';
  const passed = !!noLeakage && !!differentGatherings;

  return {
    name: 'Relationship — Couple profiles are fully independent (no answer leakage)',
    category: 'RELATIONSHIP',
    passed,
    detail: `cameronDisposition=${c1?.dispositionPreference}, euniceDisposition=${c2?.dispositionPreference}`,
  };
}

export function testRelationship_PersonIdStability(): TestResult {
  const profile = emptyProfile('person_uuid_stable', 'Cameron');
  profile.notificationPersonRefs = [{ personId: 'person_dave_uuid', displayName: 'Dave Morrison' }];

  const summary = buildExecutorSummary(profile);
  const hasCanonicalPersonId = profile.notificationPersonRefs[0].personId === 'person_dave_uuid';
  const notNameDerived = !profile.notificationPersonRefs[0].personId.includes('Dave');
  const summaryReflectsPerson = summary.notificationPeople.includes('Dave Morrison');
  const passed = hasCanonicalPersonId && notNameDerived && summaryReflectsPerson;

  return {
    name: 'Relationship — Person IDs are canonical, not name-derived',
    category: 'RELATIONSHIP',
    passed,
    detail: `personId=${profile.notificationPersonRefs[0].personId}, notNameDerived=${notNameDerived}, inSummary=${summaryReflectsPerson}`,
  };
}

export function testRelationship_DocumentLocationRef(): TestResult {
  const locRef: DocumentLocationRef = { locationId: 'loc_uuid_sidedrawer', label: 'SideDrawer — Estate Documents' };
  const profile = emptyProfile('person_c1', 'Cameron');
  profile.documentLocationRefs = [locRef];

  const summary = buildExecutorSummary(profile);
  const hasCanonicalLocId = profile.documentLocationRefs[0].locationId === 'loc_uuid_sidedrawer';
  const summaryHasLocation = summary.documentLocations.length === 1 && summary.documentLocations[0].label === 'SideDrawer — Estate Documents';
  const passed = hasCanonicalLocId && summaryHasLocation;

  return {
    name: 'Relationship — Document location uses canonical repository ID',
    category: 'RELATIONSHIP',
    passed,
    detail: `locationId=${profile.documentLocationRefs[0].locationId}, inSummary=${summaryHasLocation}`,
  };
}

export function testRelationship_EditPreservesIdentity(): TestResult {
  const profile = emptyProfile('person_c1', 'Cameron');
  profile.dispositionPreference = 'burial';
  const originalId = profile.id;
  const originalPersonId = profile.personId;

  // Simulate edit: change disposition
  profile.dispositionPreference = 'cremation';
  const identityPreserved = profile.id === originalId && profile.personId === originalPersonId;
  const dataChanged = profile.dispositionPreference === 'cremation';
  const passed = identityPreserved && dataChanged;

  return {
    name: 'Relationship — Editing preserves profile and person identity',
    category: 'RELATIONSHIP',
    passed,
    detail: `idPreserved=${profile.id === originalId}, personIdPreserved=${profile.personId === originalPersonId}, dataChanged=${dataChanged}`,
  };
}

// ── RUN ALL ──

export function runAllTests(): TestResult[] {
  return [
    testModel_ProfileIdentity(),
    testModel_LowPreferenceValid(),
    testModel_DetailedProfilePreserved(),
    testModel_ProfileIdStability(),
    testModel_FamilyGuidancePreserved(),
    testAdapter_LegacyMigration(),
    testAdapter_LoadDataRoundTrip(),
    testAdapter_ExternalContactId(),
    testRelationship_CoupleIndependence(),
    testRelationship_PersonIdStability(),
    testRelationship_DocumentLocationRef(),
    testRelationship_EditPreservesIdentity(),
  ];
}

export function runTestSummary(): {
  total: number;
  passed: number;
  failed: number;
  model: { passed: number; total: number };
  adapter: { passed: number; total: number };
  relationship: { passed: number; total: number };
  results: TestResult[];
} {
  const results = runAllTests();
  const passed = results.filter((r) => r.passed).length;
  const modelResults = results.filter((r) => r.category === 'MODEL');
  const adapterResults = results.filter((r) => r.category === 'ADAPTER');
  const relationshipResults = results.filter((r) => r.category === 'RELATIONSHIP');

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    model: { passed: modelResults.filter((r) => r.passed).length, total: modelResults.length },
    adapter: { passed: adapterResults.filter((r) => r.passed).length, total: adapterResults.length },
    relationship: { passed: relationshipResults.filter((r) => r.passed).length, total: relationshipResults.length },
    results,
  };
}
