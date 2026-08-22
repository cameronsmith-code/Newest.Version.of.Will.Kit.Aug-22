import { buildGuardianshipRoadmap } from './guardianshipRoadmapBuilder';
import { validateGuardianshipRoadmap } from './guardianshipRoadmapValidation';

type AnswersMap = Map<string, Record<string, unknown>>;

function makeAnswers(entries: Array<[string, Record<string, unknown>]>): AnswersMap {
  return new Map(entries);
}

function runTest(name: string, answers: AnswersMap): void {
  const model = buildGuardianshipRoadmap(answers);
  const findings = validateGuardianshipRoadmap(model);
  const errors = findings.filter(f => f.level === 'error');
  const warnings = findings.filter(f => f.level === 'warning');

  console.log(`\n=== ${name} ===`);
  console.log(`  Guardian assignments: ${model.guardianAssignments.length}`);
  console.log(`  Funding philosophy: ${model.fundingPhilosophy ? 'present' : 'absent'}`);
  if (model.fundingPhilosophy) {
    const fp = model.fundingPhilosophy;
    console.log(`    overallApproach: ${fp.overallApproach || 'unset'}`);
    console.log(`    housingPreference: ${fp.housingPreference || 'unset'}`);
    console.log(`    housingStructureDiscussed: ${fp.housingStructureDiscussed || 'unset'}`);
    console.log(`    workReductionPreference: ${fp.workReductionPreference || 'unset'}`);
    console.log(`    recordKeepingPreference: ${fp.recordKeepingPreference || 'unset'}`);
    console.log(`    decisionMakingApproach: ${fp.decisionMakingApproach || 'unset'}`);
    console.log(`    disagreementApproach: ${fp.disagreementApproach?.join(',') || 'unset'}`);
    console.log(`    escalationPersonIds: ${fp.escalationPersonIds?.join(',') || 'unset'}`);
    console.log(`    parentMessageToGuardian: ${fp.parentMessageToGuardian ? 'present' : 'unset'}`);
    console.log(`    parentMessageAboutWorkingTogether: ${fp.parentMessageAboutWorkingTogether ? 'present' : 'unset'}`);
  }
  console.log(`  Care funding coordination: ${model.careFundingCoordination?.length || 0} entries`);
  if (model.careFundingCoordination) {
    for (const c of model.careFundingCoordination) {
      console.log(`    childIds: ${c.childIds.join(',')}, samePeople: ${c.samePeople}, coordinationNeeded: ${c.coordinationNeeded}`);
    }
  }
  console.log(`  Funding review items: ${model.fundingReviewItems?.length || 0}`);
  if (model.fundingReviewItems) {
    for (const item of model.fundingReviewItems) {
      console.log(`    [${item.severity}] ${item.category}: ${item.description.substring(0, 80)}...`);
    }
  }
  console.log(`  Errors: ${errors.length}, Warnings: ${warnings.length}`);
  if (errors.length) console.log(`  ERRORS: ${errors.map(e => e.message).join('; ')}`);
}

// Test 1: Same person (guardian = trustee)
function testSamePerson(): AnswersMap {
  return makeAnswers([
    ['aboutYou', { fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson', maritalStatus: 'married', province: 'ON' }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          guardianAppliesTo: '1', transitionMoveExpected: 'no_remain_current', attendingSchool: 'yes', schoolName: 'Maple Grove PS' },
        { name: 'Sophie', nickname: 'Sophie', dateOfBirth: '2020-09-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSameAsSibling: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes', transitionMoveExpected: 'no_remain_current', attendingSchool: 'no' },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Toronto', province: 'ON', country: 'Canada' },
      ],
      fundingPhilosophyData: {
        overallApproach: 'shareIncrementalCosts',
        everydayExpenseApproach: 'no_detailed_reimbursement',
        meaningfulExpenseApproach: 'resources_help_cover',
        recordKeepingPreference: 'keep_simple',
        parentMessageToGuardian: 'We chose you because we trust you, not because we expect you to finance our children\'s lives.',
      },
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Michael Morrison', trustTrusteePersonId: 'pp_1' },
    ]}}],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'Michael Morrison' }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

// Test 2: Different guardian and trustee
function testDifferentGuardianTrustee(): AnswersMap {
  return makeAnswers([
    ['aboutYou', { fullName: 'Daniel Morrison', spouseName: 'Sarah Morrison', maritalStatus: 'married', province: 'ON' }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2014-07-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianPersonId2: 'pp_2', guardianConsidered: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes', guardianAppliesTo: '1',
          guardianSameAsSibling: 'yes', transitionMoveExpected: 'yes_most_likely',
          attendingSchool: 'yes', schoolName: 'Lakeshore Academy',
          activityList: JSON.stringify([{ activityName: 'Hockey', activityType: 'Sport', importanceLevel: 'Critical', frequency: '3x/week' }]) },
        { name: 'Sophie', nickname: 'Sophie', dateOfBirth: '2017-11-03', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianPersonId2: 'pp_2', guardianConsidered: 'yes',
          guardianSameAsSibling: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          transitionMoveExpected: 'yes_most_likely', attendingSchool: 'yes', schoolName: 'Cedar Elementary' },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Oakville', province: 'ON', country: 'Canada' },
        { id: 'pp_2', name: 'Jennifer Morrison', relationship: 'Aunt', city: 'Oakville', province: 'ON', country: 'Canada' },
      ],
      fundingPhilosophyData: {
        overallApproach: 'shareIncrementalCosts',
        everydayExpenseApproach: 'no_detailed_reimbursement',
        meaningfulExpenseApproach: 'discuss_larger_costs',
        majorHouseholdExpenseApproach: 'if_reasonably_necessary',
        housingPreference: 'stronglySupport',
        housingStructureDiscussed: 'no',
        vehiclePreference: 'potentially',
        workReductionPreference: 'yes',
        workReductionNotes: 'We don\'t want you putting your own family\'s financial security at risk.',
        householdHelpPreference: 'yes',
        importantLifestyleSupportIds: 'activity_hockey,travel_relationships',
        sharedHouseholdBenefitPhilosophy: 'discuss_major_first',
        recordKeepingPreference: 'track_meaningful',
        decisionMakingApproach: 'guardian_led',
        guardianJudgmentWeight: 'significant_weight',
        guardianShouldUnderstand: 'resources_may_need_to_last,future_education,preserve_capital',
        financialDecisionMakerShouldUnderstand: 'sees_needs_every_day,not_disadvantaged,need_flexibility',
        discussionRequiredFor: 'private_school,significant_healthcare,larger_vehicle,larger_home',
        hasDiscussionThreshold: 'yes',
        discussionThresholdAmount: '5000',
        disagreementApproach: 'talk_it_through,bring_in_professional',
        escalationPersonIds: 'law1,fp1',
        firstEscalationPersonId: 'law1',
        parentMessageToGuardian: 'We chose you because we trust you, not because we expect you to finance our children\'s lives.',
        parentMessageToFinancialDecisionMaker: 'Trust the guardian\'s reasonable judgment. Use the resources when the children genuinely need them.',
        parentMessageAboutWorkingTogether: 'We chose Michael and Jennifer because they know and love our children. We chose Laura because she is thoughtful and careful with money. Please work together with the children at the center.',
      },
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Laura Chen', trustTrusteePersonId: 'pp_3' },
    ]}}],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'Laura Chen' }],
    ['professionalTeam', {
      fpHasAdvisor: 'yes', fpAdvisor1Name: 'Jane Financial', fpAdvisor1Firm: 'Wealth Co',
      lawHasLawyer: 'yes', lawAdvisor1Name: 'Bob Legal', lawAdvisor1Firm: 'Legal Associates',
    }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

// Test 3: Pizza example — no micro-accounting
function testPizzaExample(): AnswersMap {
  return makeAnswers([
    ['aboutYou', { fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson', maritalStatus: 'married', province: 'ON' }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          guardianAppliesTo: '1', transitionMoveExpected: 'no_remain_current', attendingSchool: 'yes' },
        { name: 'Sophie', nickname: 'Sophie', dateOfBirth: '2020-09-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSameAsSibling: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes', transitionMoveExpected: 'no_remain_current', attendingSchool: 'no' },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Toronto', province: 'ON', country: 'Canada' },
      ],
      fundingPhilosophyData: {
        overallApproach: 'shareIncrementalCosts',
        everydayExpenseApproach: 'no_detailed_reimbursement',
        meaningfulExpenseApproach: 'resources_help_cover',
        majorHouseholdExpenseApproach: 'prefer_other_options',
        sharedHouseholdBenefitPhilosophy: 'discuss_major_first',
        recordKeepingPreference: 'keep_simple',
      },
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Laura Chen' },
    ]}}],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'Laura Chen' }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

// Test 4: Larger home — no structure discussed
function testLargerHome(): AnswersMap {
  return makeAnswers([
    ['aboutYou', { fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson', maritalStatus: 'married', province: 'ON' }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          transitionMoveExpected: 'yes_most_likely', attendingSchool: 'yes' },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Oakville', province: 'ON', country: 'Canada' },
      ],
      fundingPhilosophyData: {
        overallApproach: 'generousHouseholdSupport',
        housingPreference: 'stronglySupport',
        housingStructureDiscussed: 'no',
      },
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Laura Chen' },
    ]}}],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'Laura Chen' }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

// Test 5: Reduced work support
function testReducedWork(): AnswersMap {
  return makeAnswers([
    ['aboutYou', { fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson', maritalStatus: 'married', province: 'ON' }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          transitionMoveExpected: 'yes_most_likely', attendingSchool: 'yes' },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Oakville', province: 'ON', country: 'Canada' },
      ],
      fundingPhilosophyData: {
        workReductionPreference: 'yes',
        workReductionNotes: 'We don\'t want you putting your own family\'s financial security at risk.',
      },
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Laura Chen' },
    ]}}],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'Laura Chen' }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

// Test 6: POA incapacity scenario
function testPOAIncapacity(): AnswersMap {
  return makeAnswers([
    ['aboutYou', { fullName: 'Daniel Morrison', spouseName: 'Sarah Morrison', maritalStatus: 'married', province: 'ON' }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2014-07-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianPersonId2: 'pp_2', guardianConsidered: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes', guardianAppliesTo: '1',
          guardianSameAsSibling: 'yes', transitionMoveExpected: 'no_remain_current', attendingSchool: 'yes' },
        { name: 'Sophie', nickname: 'Sophie', dateOfBirth: '2017-11-03', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianPersonId2: 'pp_2', guardianConsidered: 'yes',
          guardianSameAsSibling: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          transitionMoveExpected: 'no_remain_current', attendingSchool: 'yes' },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Oakville', province: 'ON', country: 'Canada' },
        { id: 'pp_2', name: 'Jennifer Morrison', relationship: 'Aunt', city: 'Oakville', province: 'ON', country: 'Canada' },
      ],
      fundingPhilosophyData: {
        overallApproach: 'shareIncrementalCosts',
        everydayExpenseApproach: 'reasonable_contribution',
        decisionMakingApproach: 'collaborative',
        parentMessageAboutWorkingTogether: 'Work together with the children at the center.',
      },
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Michael Morrison' },
    ]}}],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'Michael Morrison' }],
    ['powersOfAttorney', {
      poaPropertyData: [
        { attorneyPersonId: 'poa_1', attorneyName: 'David Morrison', attorneyRelationship: 'Brother' },
      ],
    }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

// Test 7: No funding philosophy captured
function testNoPhilosophy(): AnswersMap {
  return makeAnswers([
    ['aboutYou', { fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson', maritalStatus: 'married', province: 'ON' }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          transitionMoveExpected: 'no_remain_current', attendingSchool: 'yes' },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Toronto', province: 'ON', country: 'Canada' },
      ],
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Laura Chen' },
    ]}}],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'Laura Chen' }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

export function runFundingAcceptanceTests(): void {
  console.log('Running Guardian Funding Philosophy acceptance tests...\n');

  runTest('Test 1: Same Person (guardian = trustee)', testSamePerson());
  runTest('Test 2: Different Guardian and Trustee (full philosophy)', testDifferentGuardianTrustee());
  runTest('Test 3: Pizza Example (no micro-accounting)', testPizzaExample());
  runTest('Test 4: Larger Home (no structure discussed)', testLargerHome());
  runTest('Test 5: Reduced Work Support', testReducedWork());
  runTest('Test 6: POA Incapacity Scenario', testPOAIncapacity());
  runTest('Test 7: No Philosophy Captured (coordination gap)', testNoPhilosophy());

  console.log('\n=== Acceptance Test Summary ===');

  // Test 1 assertions
  const t1 = buildGuardianshipRoadmap(testSamePerson());
  console.log(`Test 1 (same person): coordinationNeeded=${t1.careFundingCoordination?.[0]?.coordinationNeeded}, samePeople=${t1.careFundingCoordination?.[0]?.samePeople}`);
  console.log(`  Expected: coordinationNeeded=false, samePeople=true`);

  // Test 2 assertions
  const t2 = buildGuardianshipRoadmap(testDifferentGuardianTrustee());
  console.log(`Test 2 (different): coordinationNeeded=${t2.careFundingCoordination?.[0]?.coordinationNeeded}, fundingPhilosophy present=${!!t2.fundingPhilosophy}`);
  console.log(`  Expected: coordinationNeeded=true, all philosophy fields populated`);
  console.log(`  disagreementApproach: ${t2.fundingPhilosophy?.disagreementApproach?.join(',')}`);
  console.log(`  escalationPersonIds: ${t2.fundingPhilosophy?.escalationPersonIds?.join(',')}`);
  console.log(`  firstEscalationPersonId: ${t2.fundingPhilosophy?.firstEscalationPersonId}`);

  // Test 3 assertions
  const t3 = buildGuardianshipRoadmap(testPizzaExample());
  console.log(`Test 3 (pizza): everydayExpenseApproach=${t3.fundingPhilosophy?.everydayExpenseApproach}`);
  console.log(`  Expected: no_detailed_reimbursement (no micro-accounting)`);

  // Test 4 assertions
  const t4 = buildGuardianshipRoadmap(testLargerHome());
  console.log(`Test 4 (larger home): housingPreference=${t4.fundingPhilosophy?.housingPreference}, housingStructureDiscussed=${t4.fundingPhilosophy?.housingStructureDiscussed}`);
  console.log(`  Expected: stronglySupport, no`);
  const t4Review = t4.fundingReviewItems?.find(r => r.category === 'housing');
  console.log(`  Housing review item: ${t4Review ? 'present' : 'absent'}`);

  // Test 5 assertions
  const t5 = buildGuardianshipRoadmap(testReducedWork());
  console.log(`Test 5 (reduced work): workReductionPreference=${t5.fundingPhilosophy?.workReductionPreference}`);
  console.log(`  Expected: yes`);
  const t5Review = t5.fundingReviewItems?.find(r => r.category === 'workReduction');
  console.log(`  Work reduction review item: ${t5Review ? 'present' : 'absent'}`);

  // Test 6 assertions
  const t6 = buildGuardianshipRoadmap(testPOAIncapacity());
  console.log(`Test 6 (POA): financialDecisionMakers roles: ${t6.careFundingCoordination?.[0]?.financialDecisionMakers.map(f => f.role).join(',')}`);
  console.log(`  Expected: includes attorneyForProperty`);

  // Test 7 assertions
  const t7 = buildGuardianshipRoadmap(testNoPhilosophy());
  console.log(`Test 7 (no philosophy): fundingPhilosophy=${t7.fundingPhilosophy ? 'present' : 'absent'}, coordinationNeeded=${t7.careFundingCoordination?.[0]?.coordinationNeeded}`);
  const t7Review = t7.fundingReviewItems?.find(r => r.category === 'coordination');
  console.log(`  Coordination gap review: ${t7Review ? 'present' : 'absent'}`);

  console.log('\nAll acceptance tests completed.');
}
