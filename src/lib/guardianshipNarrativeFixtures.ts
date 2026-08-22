import { buildGuardianshipRoadmap } from './guardianshipRoadmapBuilder';
import { validateGuardianshipRoadmap } from './guardianshipRoadmapValidation';
import { buildGuardianshipNarrative } from './guardianshipNarrativeBuilder';
import { renderNarrativeAsText } from './guardianshipNarrativePreview';
import { RULE_CATALOGUE } from './guardianshipNarrativeRules';

// Inline fixture builders for testing — mirrors the fixture functions in guardianshipRoadmapFixtures

type AnswersMap = Map<string, Record<string, unknown>>;

function makeAnswers(entries: Array<[string, Record<string, unknown>]>): AnswersMap {
  return new Map(entries);
}

function fixtureH_Morrison(): AnswersMap {
  return makeAnswers([
    ['aboutYou', {
      fullName: 'Daniel Morrison', spouseName: 'Sarah Morrison',
      maritalStatus: 'married', province: 'ON',
    }],
    ['children', {
      childrenData: [
        { name: 'Emma Morrison', nickname: 'Emma', dateOfBirth: '2003-03-15', disabled: 'no', independent: 'yes' },
        { name: 'Jack Morrison', nickname: 'Jack', dateOfBirth: '2014-07-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianPersonId2: 'pp_2', guardianConsidered: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          guardianAppliesTo: '2',
          guardianSameAsSibling: 'yes',
          transitionMoveExpected: 'yes_most_likely',
          transitionSchoolChangeExpected: 'yes_most_likely',
          transitionEducationRecordLocation: 'School office',
          transitionNewSchoolNotes: 'Look for a school with a good hockey program',
          transitionPeopleSelections: 'adult_sib_0',
          transitionActivitySelections: 'Hockey,Baseball,Guitar',
          transitionFirstDaysCount: '3',
          transitionFirstDays_0: 'Keep Jack and Sophie together',
          transitionFirstDays_1: 'Bring his hockey stick and guitar',
          transitionFirstDays_2: 'Contact Coach Mike about continuing hockey',
          transitionAdultSiblingRole_0: 'emotional_support',
          transitionAdultSiblingNotResponsible_0: 'primary_caregiver,managing_finances,providing_housing,medical_decisions',
          transitionEasierText: 'Jack needs routine. His hockey schedule is anchor. Keep him connected with Ben.',
          attendingSchool: 'yes', schoolName: 'Lakeshore Academy', schoolPhone: '905-555-0100',
          hasIEP: 'no',
          cityOfResidence: 'Mississauga', provinceTerritory: 'ON', countryOfResidence: 'Canada',
          birthCertificateLocation: 'Home safe',
          activityList: JSON.stringify([
            { activityName: 'Hockey', activityType: 'Sport', importanceLevel: 'Critical', frequency: '3x/week' },
            { activityName: 'Baseball', activityType: 'Sport', importanceLevel: 'Important', frequency: 'summer' },
            { activityName: 'Guitar', activityType: 'Music', importanceLevel: 'Important', frequency: 'weekly' },
            { activityName: 'Overnight summer camp', activityType: 'Camp', importanceLevel: 'Critical', frequency: 'summer' },
          ]),
          belongingConnections: JSON.stringify([
            { id: 'conn_1', displayName: 'Ben', connectionType: 'best_friend', contexts: ['school', 'sports'],
              importance: 'especially_important', relationshipNotes: 'Best friend since kindergarten',
              contactName: 'Mike Thompson', contactPhone: '905-555-0200', contactEmail: 'mike.t@email.com',
              continuityIdeas: ['weekend_visits', 'shared_activity', 'camp_together', 'gaming_online'],
            },
          ]),
          belongingCommunities: JSON.stringify([
            { id: 'comm_1', type: 'sports_team', name: 'Mississauga Hawks Hockey', importanceNotes: 'Jack lives for hockey season', continuityPreference: 'maybe' },
          ]),
          belongingTraditions: JSON.stringify([
            { id: 'trad_1', type: 'overnight_camp', name: 'Camp Wahanama', participantTypes: ['sibling', 'close_friend'], participantNotes: 'Jack and Ben go together', importanceNotes: 'Highlight of the year', continueIfPractical: 'yes' },
            { id: 'trad_2', type: 'holiday_gathering', name: 'Sunday dinner with grandparents', participantTypes: ['sibling', 'grandparents'], importanceNotes: 'Weekly family anchor', continueIfPractical: 'yes' },
            { id: 'trad_3', type: 'cottage_week', name: 'Annual cottage weekend', participantTypes: ['sibling', 'cousin'], importanceNotes: 'Cousin time', continueIfPractical: 'yes' },
          ]),
        },
        { name: 'Sophie Morrison', nickname: 'Sophie', dateOfBirth: '2017-11-03', disabled: 'yes', independent: 'no',
          guardianPersonId: 'pp_1', guardianPersonId2: 'pp_2', guardianConsidered: 'yes',
          guardianSameAsSibling: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          transitionMoveExpected: 'yes_most_likely',
          transitionSchoolChangeExpected: 'yes_most_likely',
          transitionEducationRecordLocation: 'School office',
          transitionProviderSelections: 'doctor_0,doctor_1,school_0',
          transitionSupportSelections: 'cognitive_developmental,learning,existing_supports',
          transitionSupportNotes: 'Sophie needs visual schedules and sensory breaks. She sees Dr. Patel monthly.',
          transitionPeopleSelections: 'adult_sib_0',
          transitionAdultSiblingRole_0: 'emotional_support',
          transitionAdultSiblingNotResponsible_0: 'primary_caregiver,managing_finances,medical_decisions',
          transitionEasierText: 'Sophie needs her sensory kit and quiet space. Visual schedules are essential.',
          supportNeedTypes: 'cognitive_developmental,learning',
          disabilityTaxCredit: 'yes', disabilityTaxCreditDocLocation: 'Filing cabinet',
          careCoord_doctor_count: '2',
          careCoord_doctor_0_name: 'Dr. Rebecca Patel', careCoord_doctor_0_role: 'Developmental Pediatrician', careCoord_doctor_0_phone: '905-555-0300', careCoord_doctor_0_city: 'Mississauga', careCoord_doctor_0_province: 'ON',
          careCoord_doctor_1_name: 'Karen Lee', careCoord_doctor_1_role: 'Occupational Therapist', careCoord_doctor_1_phone: '905-555-0301', careCoord_doctor_1_city: 'Mississauga', careCoord_doctor_1_province: 'ON',
          careCoord_school_count: '1',
          careCoord_school_0_name: 'Ms. Garcia', careCoord_school_0_role: 'Resource teacher', careCoord_school_0_phone: '905-555-0400',
          attendingSchool: 'yes', schoolName: 'Cedar Elementary', hasIEP: 'yes',
          individualEducationPlan: 'Accommodations: sensory breaks, visual schedules, modified tasks',
          iepDocumentLocation: 'School office',
          futureIndependenceLevel: 'mostly_independent',
          futureFinancialHelp: 'unsure',
          futurePersonalHealthHelp: 'yes',
          carePlanWritten: 'yes', carePlanStored: 'Filing cabinet',
          cityOfResidence: 'Mississauga', provinceTerritory: 'ON', countryOfResidence: 'Canada',
          birthCertificateLocation: 'Home safe',
          activityList: JSON.stringify([
            { activityName: 'Swimming', activityType: 'Sport', importanceLevel: 'Important', frequency: 'weekly' },
          ]),
          belongingConnections: JSON.stringify([
            { id: 'conn_2', displayName: 'Ava', connectionType: 'close_friend', contexts: ['school', 'sports'],
              importance: 'especially_important', relationshipNotes: 'Close friend who understands Sophie',
              contactName: "Ava's mom", contactPhone: '905-555-0500',
              continuityIdeas: ['playdates_visits', 'shared_activity'],
            },
          ]),
        },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: "Uncle (Daniel's brother)", phone: '905-555-1000', email: 'michael.m@email.com', city: 'Oakville', province: 'ON', country: 'Canada' },
        { id: 'pp_2', name: 'Jennifer Morrison', relationship: "Aunt (Michael's wife)", phone: '905-555-1001', email: 'jennifer.m@email.com', city: 'Oakville', province: 'ON', country: 'Canada' },
        { id: 'pp_3', name: 'Laura Chen', relationship: 'Family friend', phone: '416-555-2000', city: 'Mississauga', province: 'ON', country: 'Canada' },
      ],
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home safe' },
        inheritanceType: 'held_until_age',
        trustStages: [{ age: '25', fraction: '50%', description: 'Half at 25' }, { age: '30', fraction: '100%', description: 'Full at 30' }],
        trustTrusteeName: 'Michael Morrison',
        childSpecificArrangements: [
          { childId: 'child_2', childName: 'Sophie', hasDifferentArrangement: 'yes', specialArrangement: 'held_for_lifetime', knownTrustType: 'discretionary_trust', description: 'Disability-sensitive discretionary trust arrangement to protect government benefits' },
        ],
      },
      { clientId: 'client2', clientName: 'Sarah', documentBasics: { hasWill: 'yes', willLocation: 'Home safe' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Michael Morrison',
      },
    ]}}],
    ['estateTrustees', {
      client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'David Morrison',
      client1EstateTrusteePhone: '416-555-3000', client1EstateTrusteeRelationship: 'Brother',
      client2HasEstateTrustee: 'yes', client2EstateTrusteeName: 'David Morrison',
      client2EstateTrusteePhone: '416-555-3000', client2EstateTrusteeRelationship: 'Brother-in-law',
    }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes', client2HasLifeInsurance: 'yes' }],
    ['financialFootprint', { investmentsData: [
      { accountType: 'RESP', institution: 'RBC', respBeneficiaryChildIds: ['child_1', 'child_2'], respBeneficiaryNames: ['Jack', 'Sophie'] },
      { accountType: 'RDSP', institution: 'RBC', selectedKnownBeneficiaries: ['Sophie'] },
    ]}],
    ['familyTrusts', {}],
  ]);
}

function fixtureA_Simple(): AnswersMap {
  return makeAnswers([
    ['aboutYou', {
      fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson',
      maritalStatus: 'married', province: 'ON',
    }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          guardianAppliesTo: '1',
          transitionMoveExpected: 'no_remain_current', attendingSchool: 'yes', schoolName: 'Maple Grove PS',
          hasIEP: 'no', birthCertificateLocation: 'Safe deposit box',
        },
        { name: 'Sophie', nickname: 'Sophie', dateOfBirth: '2020-09-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSameAsSibling: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          transitionMoveExpected: 'no_remain_current', attendingSchool: 'no',
        },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', phone: '416-555-0100', city: 'Toronto', province: 'ON', country: 'Canada' },
      ],
    }],
    ['wills', {
      currentWillData: { clients: [
        { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home office' } },
        { clientId: 'client2', clientName: 'Sarah', documentBasics: { hasWill: 'yes', willLocation: 'Home office' } },
      ]},
    }],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'David Morrison' }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes', client2HasLifeInsurance: 'yes' }],
    ['financialFootprint', { investmentsData: [{ accountType: 'RESP', respBeneficiaryChildIds: ['child_0', 'child_1'], respBeneficiaryNames: ['Jack', 'Sophie'] }] }],
    ['familyTrusts', {}],
  ]);
}

export function runNarrativeTests(): void {
  console.log('=== RULE CATALOGUE ===');
  console.log(`Total rules: ${RULE_CATALOGUE.length}`);
  for (const rule of RULE_CATALOGUE) {
    console.log(`  ${rule.id}: ${rule.description}`);
  }
  console.log('');

  // Morrison fixture (H)
  console.log('############################################################');
  console.log('# MORRISON FAMILY NARRATIVE (Fixture H)');
  console.log('############################################################');
  const morrisonModel = buildGuardianshipRoadmap(fixtureH_Morrison());
  const morrisonValidation = validateGuardianshipRoadmap(morrisonModel);
  console.log(`Validation: ${morrisonValidation.filter(f => f.level === 'error').length} errors, ${morrisonValidation.filter(f => f.level === 'warning').length} warnings`);
  const morrisonNarrative = buildGuardianshipNarrative(morrisonModel);
  const morrisonText = renderNarrativeAsText(morrisonNarrative);
  console.log(morrisonText);

  // Statistics
  console.log('\n=== MORRISON NARRATIVE STATISTICS ===');
  console.log(`Family context blocks: ${morrisonNarrative.familyContext.length}`);
  console.log(`Guardian plan blocks: ${morrisonNarrative.guardianPlan.length}`);
  console.log(`Child narratives: ${morrisonNarrative.children.length}`);
  for (const child of morrisonNarrative.children) {
    const sections = ['introduction', 'education', 'healthcare', 'supportTransition', 'peopleAndConnections', 'activities', 'communitiesAndTraditions', 'inheritance', 'adultTransition'] as const;
    const counts = sections.map(s => `${s}: ${(child[s]?.length) || 0}`);
    console.log(`  ${child.childName}: ${counts.join(', ')}`);
  }
  console.log(`Family role blocks: ${morrisonNarrative.familyRoles.length}`);
  console.log(`Financial resource blocks: ${morrisonNarrative.financialResources.length}`);
  console.log(`Document blocks: ${morrisonNarrative.documents.length}`);
  console.log(`Readiness — decisions: ${morrisonNarrative.readiness.decisionsMade.length}, confirming: ${morrisonNarrative.readiness.thingsWorthConfirming.length}, todo: ${morrisonNarrative.readiness.thingsStillToDo.length}`);
  console.log(`Immediate actions: ${morrisonNarrative.immediateActions.length}`);
  console.log(`Quick reference items: ${morrisonNarrative.quickReference.length}`);

  // Simple family (A)
  console.log('\n\n############################################################');
  console.log('# SIMPLE FAMILY NARRATIVE (Fixture A)');
  console.log('############################################################');
  const simpleModel = buildGuardianshipRoadmap(fixtureA_Simple());
  const simpleValidation = validateGuardianshipRoadmap(simpleModel);
  console.log(`Validation: ${simpleValidation.filter(f => f.level === 'error').length} errors, ${simpleValidation.filter(f => f.level === 'warning').length} warnings`);
  const simpleNarrative = buildGuardianshipNarrative(simpleModel);
  const simpleText = renderNarrativeAsText(simpleNarrative);
  console.log(simpleText);

  // Statistics
  console.log('\n=== SIMPLE FAMILY NARRATIVE STATISTICS ===');
  console.log(`Family context blocks: ${simpleNarrative.familyContext.length}`);
  console.log(`Guardian plan blocks: ${simpleNarrative.guardianPlan.length}`);
  console.log(`Child narratives: ${simpleNarrative.children.length}`);
  for (const child of simpleNarrative.children) {
    const sections = ['introduction', 'education', 'healthcare', 'supportTransition', 'peopleAndConnections', 'activities', 'communitiesAndTraditions', 'inheritance', 'adultTransition'] as const;
    const counts = sections.map(s => `${s}: ${(child[s]?.length) || 0}`);
    console.log(`  ${child.childName}: ${counts.join(', ')}`);
  }
  console.log(`Family role blocks: ${simpleNarrative.familyRoles.length}`);
  console.log(`Financial resource blocks: ${simpleNarrative.financialResources.length}`);
  console.log(`Document blocks: ${simpleNarrative.documents.length}`);
  console.log(`Readiness — decisions: ${simpleNarrative.readiness.decisionsMade.length}, confirming: ${simpleNarrative.readiness.thingsWorthConfirming.length}, todo: ${simpleNarrative.readiness.thingsStillToDo.length}`);
  console.log(`Immediate actions: ${simpleNarrative.immediateActions.length}`);
  console.log(`Quick reference items: ${simpleNarrative.quickReference.length}`);

  // Comparison
  console.log('\n\n=== COMPARISON ===');
  console.log(`Morrison total blocks: ${morrisonText.length} chars, ${morrisonText.split('\n').length} lines`);
  console.log(`Simple total blocks: ${simpleText.length} chars, ${simpleText.split('\n').length} lines`);
  console.log(`Ratio: ${(morrisonText.length / simpleText.length).toFixed(1)}x longer for Morrison family`);
  console.log('\nAll narrative tests completed.');
}
