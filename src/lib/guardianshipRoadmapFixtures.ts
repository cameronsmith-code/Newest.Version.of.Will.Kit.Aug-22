import { buildGuardianshipRoadmap } from './guardianshipRoadmapBuilder';
import { validateGuardianshipRoadmap } from './guardianshipRoadmapValidation';
import type { GuardianshipRoadmapModel } from './guardianshipRoadmapTypes';

type AnswersMap = Map<string, Record<string, unknown>>;

function makeAnswers(entries: Array<[string, Record<string, unknown>]>): AnswersMap {
  return new Map(entries);
}

function runFixture(name: string, answers: AnswersMap): GuardianshipRoadmapModel {
  const model = buildGuardianshipRoadmap(answers);
  const findings = validateGuardianshipRoadmap(model);
  const errors = findings.filter(f => f.level === 'error');
  const warnings = findings.filter(f => f.level === 'warning');

  console.log(`\n=== ${name} ===`);
  console.log(`  Children: ${model.children.length}`);
  console.log(`  Guardian assignments: ${model.guardianAssignments.length}`);
  console.log(`  Guardian households: ${model.guardianHouseholds.length}`);
  console.log(`  Roles: ${model.roles.length}`);
  console.log(`  Documents: ${model.documents.length}`);
  console.log(`  Estate trustees: ${model.estateTrustees.length}`);
  console.log(`  Financial resources (existing): ${model.financialResources.filter(r => r.exists).length}`);
  console.log(`  Readiness — decisions: ${model.readiness.decisionsMade.length}, confirming: ${model.readiness.thingsWorthConfirming.length}, todo: ${model.readiness.thingsStillToDo.length}`);
  console.log(`  Immediate actions: ${model.immediateActions.length}`);
  console.log(`  Adult sibling roles: ${model.adultSiblingRoles.length}`);
  if (errors.length) console.log(`  ERRORS: ${errors.map(e => e.message).join('; ')}`);
  if (warnings.length) console.log(`  WARNINGS: ${warnings.map(w => w.message).join('; ')}`);

  return model;
}

function fixtureA_SimpleFamily(): AnswersMap {
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

function fixtureB_MoveRequired(): AnswersMap {
  return makeAnswers([
    ['aboutYou', {
      fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson',
      maritalStatus: 'married', province: 'ON',
    }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'not_yet', guardianInWill: 'not_sure',
          guardianAppliesTo: '1',
          transitionMoveExpected: 'yes_most_likely',
          transitionSchoolChangeExpected: 'yes_most_likely',
          transitionEducationRecordLocation: 'School office',
          transitionProviderSelections: 'doctor_0',
          transitionSupportSelections: '',
          transitionActivitySelections: 'Soccer',
          transitionPeopleSelections: 'sibling_1',
          transitionFirstDaysCount: '2',
          transitionFirstDays_0: 'Keep the children together',
          transitionFirstDays_1: 'Bring his comfort blanket',
          attendingSchool: 'yes', schoolName: 'Maple Grove PS', hasIEP: 'no',
          activityList: JSON.stringify([{ activityName: 'Soccer', activityType: 'Sport', importanceLevel: 'Critical', frequency: 'weekly' }]),
          cityOfResidence: 'Mississauga', provinceTerritory: 'ON', countryOfResidence: 'Canada',
          birthCertificateLocation: 'Filing cabinet',
          careCoord_doctor_count: '1', careCoord_doctor_0_name: 'Dr. Smith', careCoord_doctor_0_role: 'Family physician', careCoord_doctor_0_phone: '905-555-0100',
        },
        { name: 'Sophie', nickname: 'Sophie', dateOfBirth: '2020-09-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSameAsSibling: 'yes',
          guardianSpokenWith: 'not_yet', guardianInWill: 'not_sure',
          transitionMoveExpected: 'yes_most_likely',
          attendingSchool: 'no',
        },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', phone: '905-555-0100', city: 'Oakville', province: 'ON', country: 'Canada' },
      ],
    }],
    ['wills', {
      currentWillData: { clients: [
        { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home office' } },
      ]},
    }],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'David Morrison' }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

function fixtureC_Disability(): AnswersMap {
  return makeAnswers([
    ['aboutYou', {
      fullName: 'Lisa Chen', spouseName: 'James Chen',
      maritalStatus: 'married', province: 'BC',
    }],
    ['children', {
      childrenData: [
        { name: 'Ethan', nickname: 'Ethan', dateOfBirth: '2016-03-10', disabled: 'yes', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          supportNeedTypes: 'cognitive_developmental,learning',
          disabilityTaxCredit: 'yes', disabilityTaxCreditDocLocation: 'Filing cabinet',
          careCoordinators: 'doctor,school',
          careCoord_doctor_count: '1', careCoord_doctor_0_name: 'Dr. Rebecca Patel', careCoord_doctor_0_role: 'Family physician', careCoord_doctor_0_phone: '604-555-0100',
          careCoord_school_count: '1', careCoord_school_0_name: 'Ms. Garcia', careCoord_school_0_role: 'Resource teacher', careCoord_school_0_phone: '604-555-0200',
          medications: 'yes', medicationList: JSON.stringify([{ name: 'Methylphenidate', treats: 'ADHD', prescription: 'yes', prescribedBy: 'Dr. Patel' }]),
          allergies: 'no',
          transitionMoveExpected: 'possibly',
          transitionProviderSelections: 'doctor_0,school_0',
          transitionSupportSelections: 'cognitive_developmental,learning,existing_supports',
          transitionSupportNotes: 'Ethan needs structure and visual schedules',
          attendingSchool: 'yes', schoolName: 'Cedar Elementary', hasIEP: 'yes', individualEducationPlan: 'Accommodations for attention and sensory needs', iepDocumentLocation: 'School office',
          transitionEducationRecordLocation: 'School office',
          futureIndependenceLevel: 'mostly_independent',
          carePlanWritten: 'yes', carePlanStored: 'Filing cabinet',
          birthCertificateLocation: 'Safe',
        },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Mei Chen', relationship: 'Grandmother', phone: '604-555-0300', city: 'Vancouver', province: 'BC', country: 'Canada' },
      ],
    }],
    ['wills', {
      currentWillData: { clients: [
        { clientId: 'client1', clientName: 'Lisa', documentBasics: { hasWill: 'yes', willLocation: 'Lawyer' },
          inheritanceType: 'held_until_age',
          trustStages: [{ age: '25', fraction: '50%', description: 'Half at 25' }],
          trustTrusteeName: 'James Chen',
          childSpecificArrangements: [{ childId: 'child_0', childName: 'Ethan', hasDifferentArrangement: 'yes', specialArrangement: 'held_for_lifetime', knownTrustType: 'henson_trust', description: 'Henson Trust to protect ODSP eligibility' }],
        },
      ]},
    }],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'James Chen' }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', { investmentsData: [
      { accountType: 'RDSP', selectedKnownBeneficiaries: ['Ethan'], institution: 'RBC' },
      { accountType: 'RESP', respBeneficiaryChildIds: ['child_0'], respBeneficiaryNames: ['Ethan'], institution: 'RBC' },
    ]}],
    ['familyTrusts', {}],
  ]);
}

function fixtureD_MixedAge(): AnswersMap {
  return makeAnswers([
    ['aboutYou', {
      fullName: 'Robert Walsh', spouseName: 'Maria Walsh',
      maritalStatus: 'married', province: 'ON',
    }],
    ['children', {
      childrenData: [
        { name: 'Emma', nickname: 'Em', dateOfBirth: '2000-01-15', disabled: 'no', independent: 'yes' },
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          guardianAppliesTo: '2',
          transitionMoveExpected: 'possibly',
          transitionAdultSiblingRole_0: 'emotional_support',
          transitionAdultSiblingNotResponsible_0: 'primary_caregiver,managing_finances',
          attendingSchool: 'yes', schoolName: 'Maple Grove PS', hasIEP: 'no',
        },
        { name: 'Lily', nickname: 'Lily', dateOfBirth: '2019-06-20', disabled: 'yes', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSameAsSibling: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          supportNeedTypes: 'physical',
          careCoord_doctor_count: '1', careCoord_doctor_0_name: 'Dr. Smith', careCoord_doctor_0_role: 'Pediatrician',
          transitionMoveExpected: 'possibly',
          transitionAdultSiblingRole_0: 'family_discussions',
          attendingSchool: 'yes', schoolName: 'Cedar Elementary', hasIEP: 'yes', iepDocumentLocation: 'School',
        },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Laura Walsh', relationship: 'Aunt', phone: '416-555-0100', city: 'Toronto', province: 'ON', country: 'Canada' },
      ],
    }],
    ['wills', {
      currentWillData: { clients: [
        { clientId: 'client1', clientName: 'Robert', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
          inheritanceType: 'released_gradually',
          trustStages: [{ age: '25', fraction: '50%', description: '' }, { age: '30', fraction: '100%', description: '' }],
          trustTrusteeName: 'Laura Walsh',
        },
        { clientId: 'client2', clientName: 'Maria', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
          inheritanceType: 'held_until_age', trustTrusteeName: 'Robert Walsh',
        },
      ]},
    }],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'Laura Walsh' }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes' }],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

function fixtureE_DifferentGuardians(): AnswersMap {
  return makeAnswers([
    ['aboutYou', {
      fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson',
      maritalStatus: 'married', province: 'ON',
    }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          transitionMoveExpected: 'no_remain_current', attendingSchool: 'yes', schoolName: 'Maple Grove PS',
        },
        { name: 'Sophie', nickname: 'Sophie', dateOfBirth: '2020-09-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_2', guardianConsidered: 'yes', guardianSpokenWith: 'not_yet', guardianInWill: 'not_sure',
          alternateGuardianPersonId: 'pp_3', alternateGuardianConsidered: 'yes',
          transitionMoveExpected: 'no_remain_current', attendingSchool: 'no',
        },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Toronto', province: 'ON', country: 'Canada' },
        { id: 'pp_2', name: 'Jennifer Lee', relationship: 'Aunt', city: 'Ottawa', province: 'ON', country: 'Canada' },
        { id: 'pp_3', name: 'David Lee', relationship: 'Uncle', city: 'Ottawa', province: 'ON', country: 'Canada' },
      ],
    }],
    ['wills', {
      currentWillData: { clients: [
        { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' } },
      ]},
    }],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'Michael Morrison' }],
    ['lifeInsurance', {}],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

function fixtureF_CrossProvince(): AnswersMap {
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
          transitionMoveExpected: 'yes_most_likely',
          cityOfResidence: 'Toronto', provinceTerritory: 'ON', countryOfResidence: 'Canada',
          attendingSchool: 'yes', schoolName: 'Maple Grove PS',
        },
        { name: 'Sophie', nickname: 'Sophie', dateOfBirth: '2020-09-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes', guardianSameAsSibling: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          transitionMoveExpected: 'yes_most_likely',
          cityOfResidence: 'Toronto', provinceTerritory: 'ON', countryOfResidence: 'Canada',
        },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', phone: '604-555-0100', city: 'Vancouver', province: 'BC', country: 'Canada' },
      ],
    }],
    ['wills', {
      currentWillData: { clients: [
        { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' } },
      ]},
    }],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'David Morrison' }],
    ['lifeInsurance', {}],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

function fixtureG_SamePrimaryDifferentAlternates(): AnswersMap {
  return makeAnswers([
    ['aboutYou', {
      fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson',
      maritalStatus: 'married', province: 'ON',
    }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2018-05-15', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianPersonId2: 'pp_2', guardianConsidered: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          alternateGuardianPersonId: 'pp_3', alternateGuardianConsidered: 'yes',
          transitionMoveExpected: 'no_remain_current', attendingSchool: 'yes', schoolName: 'Maple Grove PS',
        },
        { name: 'Sophie', nickname: 'Sophie', dateOfBirth: '2020-09-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianPersonId2: 'pp_2', guardianConsidered: 'yes',
          guardianSameAsSibling: 'yes',
          guardianSpokenWith: 'yes_agreed', guardianInWill: 'yes',
          alternateGuardianPersonId: 'pp_4', alternateGuardianConsidered: 'yes',
          transitionMoveExpected: 'no_remain_current', attendingSchool: 'no',
        },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Toronto', province: 'ON', country: 'Canada' },
        { id: 'pp_2', name: 'Jennifer Morrison', relationship: 'Aunt', city: 'Toronto', province: 'ON', country: 'Canada' },
        { id: 'pp_3', name: 'Laura Chen', relationship: 'Family friend', city: 'Toronto', province: 'ON', country: 'Canada' },
        { id: 'pp_4', name: 'David Park', relationship: 'Uncle', city: 'Ottawa', province: 'ON', country: 'Canada' },
      ],
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' } },
    ]}}],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'David Morrison' }],
    ['lifeInsurance', {}],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

function fixtureH_SampleRoadmapFamily(): AnswersMap {
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
          careCoordinators: 'doctor,school',
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
        { id: 'pp_3', name: 'Laura Chen', relationship: 'Trustee (family friend)', phone: '416-555-2000', email: 'laura.c@email.com', city: 'Toronto', province: 'ON', country: 'Canada' },
        { id: 'pp_4', name: 'David Morrison', relationship: 'Brother (Attorney for Property)', phone: '416-555-3000', email: 'david.m@email.com', city: 'Toronto', province: 'ON', country: 'Canada' },
      ],
      fundingPhilosophyData: {
        overallApproach: 'shareIncrementalCosts',
        everydayExpenseApproach: 'no_detailed_reimbursement',
        meaningfulExpenseApproach: 'resources_help_cover',
        majorHouseholdExpenseApproach: 'if_reasonably_necessary',
        housingPreference: 'considerIfNecessary',
        vehiclePreference: 'potentially',
        workReductionPreference: 'potentially',
        householdHelpPreference: 'yes',
        sharedHouseholdBenefitPhilosophy: 'discuss_major_first',
        recordKeepingPreference: 'track_meaningful',
        decisionMakingApproach: 'collaborative',
        guardianJudgmentWeight: 'significant_weight',
        discussionRequiredFor: 'private_school,larger_vehicle,larger_home,significant_healthcare',
        hasDiscussionThreshold: 'no',
        disagreementApproach: 'talk_it_through,bring_in_professional',
        escalationPersonIds: 'law_1,fp_1',
        firstEscalationPersonId: 'law_1',
        parentMessageToGuardian: 'We chose you because we trust you, not because we expect you to finance our children\'s lives.',
        parentMessageAboutWorkingTogether: 'We chose you for different reasons and trust you both. Please don\'t let different responsibilities turn you into opposing sides.',
      },
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home safe' },
        inheritanceType: 'held_until_age',
        trustStages: [{ age: '25', fraction: '50%', description: 'Half at 25' }, { age: '30', fraction: '100%', description: 'Full at 30' }],
        trustTrusteeName: 'Laura Chen', trustTrusteePersonId: 'pp_3',
        childSpecificArrangements: [
          { childId: 'child_2', childName: 'Sophie', hasDifferentArrangement: 'yes', specialArrangement: 'held_for_lifetime', knownTrustType: 'discretionary_trust', description: 'Disability-sensitive discretionary trust arrangement to protect government benefits' },
        ],
      },
      { clientId: 'client2', clientName: 'Sarah', documentBasics: { hasWill: 'yes', willLocation: 'Home safe' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Laura Chen', trustTrusteePersonId: 'pp_3',
      },
    ]}}],
    ['estateTrustees', {
      client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'David Morrison',
      client1EstateTrusteePhone: '416-555-3000', client1EstateTrusteeRelationship: 'Brother',
      client2HasEstateTrustee: 'yes', client2EstateTrusteeName: 'David Morrison',
      client2EstateTrusteePhone: '416-555-3000', client2EstateTrusteeRelationship: 'Brother-in-law',
    }],
    ['professionalTeam', {
      fpHasAdvisor: 'yes', fpAdvisor1Id: 'fp_1', fpAdvisor1Name: 'Jane Financial', fpAdvisor1Firm: 'Wealth Co', fpAdvisor1IsCameronSmith: false,
      lawHasLawyer: 'yes', lawAdvisor1Id: 'law_1', lawAdvisor1Name: 'Robert Legal', lawAdvisor1Firm: 'Legal Associates',
    }],
    ['powersOfAttorney', {
      poaPropertyData: [
        { attorneyPersonId: 'pp_4', attorneyName: 'David Morrison', attorneyRelationship: 'Brother' },
      ],
    }],
    ['lifeInsurance', { client1HasLifeInsurance: 'yes', client2HasLifeInsurance: 'yes' }],
    ['financialFootprint', { investmentsData: [
      { accountType: 'RESP', institution: 'RBC', respBeneficiaryChildIds: ['child_1', 'child_2'], respBeneficiaryNames: ['Jack', 'Sophie'] },
      { accountType: 'RDSP', institution: 'RBC', selectedKnownBeneficiaries: ['Sophie'] },
    ]}],
    ['familyTrusts', {}],
  ]);
}

function fixtureI_IncompleteFamily(): AnswersMap {
  return makeAnswers([
    ['aboutYou', {
      fullName: 'Daniel Thompson', spouseName: 'Sarah Thompson',
      maritalStatus: 'married', province: 'ON',
    }],
    ['children', {
      childrenData: [
        { name: 'Jack', nickname: 'Jack', dateOfBirth: '2016-03-20', disabled: 'no', independent: 'no',
          guardianPersonId: 'pp_1', guardianConsidered: 'yes',
          guardianSpokenWith: 'not_sure', guardianInWill: 'not_sure',
          transitionMoveExpected: 'yes_most_likely',
          attendingSchool: 'yes', schoolName: 'Maple Grove PS',
          hasIEP: 'yes', individualEducationPlan: 'Reading support and accommodations',
          belongingConnections: JSON.stringify([
            { id: 'conn_1', displayName: 'Ben', connectionType: 'best_friend', contexts: ['school'],
              importance: 'especially_important', relationshipNotes: 'Best friend',
              continuityIdeas: ['playdates_visits'],
            },
          ]),
        },
      ],
      planningPersons: [
        { id: 'pp_1', name: 'Michael Morrison', relationship: 'Uncle', city: 'Oakville', province: 'ON', country: 'Canada' },
      ],
      fundingPhilosophyData: {
        housingPreference: 'stronglySupport',
        housingStructureDiscussed: 'not_sure',
      },
    }],
    ['wills', { currentWillData: { clients: [
      { clientId: 'client1', clientName: 'Daniel', documentBasics: { hasWill: 'yes', willLocation: 'Home' },
        inheritanceType: 'held_until_age', trustTrusteeName: 'Laura Chen',
      },
    ]}}],
    ['estateTrustees', { client1HasEstateTrustee: 'yes', client1EstateTrusteeName: 'David Morrison' }],
    ['lifeInsurance', {}],
    ['financialFootprint', {}],
    ['familyTrusts', {}],
  ]);
}

export function runAllFixtures(): void {
  console.log('Running Guardianship Roadmap test fixtures...\n');

  const a = runFixture('A. Simple Family (two minors, same local guardian)', fixtureA_SimpleFamily());
  const b = runFixture('B. Move-Required Family (guardian 1hr away)', fixtureB_MoveRequired());
  const c = runFixture('C. Disability Family (IEP, specialists, therapy, medication)', fixtureC_Disability());
  const d = runFixture('D. Mixed-Age Family (adult independent + minor + disabled minor)', fixtureD_MixedAge());
  const e = runFixture('E. Different Guardians (two minors, different guardians)', fixtureE_DifferentGuardians());
  const f = runFixture('F. Cross-Province Guardian (ON -> BC)', fixtureF_CrossProvince());
  const g = runFixture('G. Same Primary / Different Alternates', fixtureG_SamePrimaryDifferentAlternates());
  const h = runFixture('H. Sample Roadmap Family (Morrison family)', fixtureH_SampleRoadmapFamily());
  const i = runFixture('I. Incomplete Family (limitations testing)', fixtureI_IncompleteFamily());

  console.log('\n=== Summary ===');
  console.log(`A: ${a.guardianAssignments.length} assignments, ${a.roles.length} roles`);
  console.log(`B: ${b.guardianAssignments.length} assignments, moveStatus=${b.guardianAssignments[0]?.moveStatus}`);
  console.log(`C: ${c.children[0].supportTransition?.length || 0} support transitions, ${c.children[0].healthcareTransition?.selectedProviders.length || 0} providers`);
  console.log(`D: ${d.adultSiblingRoles.length} adult sibling roles, ${d.children[0].inheritanceByClient.length} inheritance records for child 0`);
  console.log(`E: ${e.guardianAssignments.length} assignments (should be 2)`);
  console.log(`F: crossProvince=${f.guardianAssignments[0]?.isCrossProvince}, ageOfMajority=${f.family.ageOfMajority}`);
  console.log(`G: ${g.guardianAssignments.length} assignments, ${g.guardianHouseholds.length} households, isJoint=${g.guardianAssignments[0]?.isHousehold}`);
  console.log(`G: Jack alternate=${g.guardianAssignments[0]?.alternatePeople[0]?.name}, Sophie alternate=${g.guardianAssignments[1]?.alternatePeople[0]?.name}`);
  console.log(`H: households=${h.guardianHouseholds.length}, assignments=${h.guardianAssignments.length}, joint=${h.guardianAssignments[0]?.isHousehold}, householdLabel=${h.guardianAssignments[0]?.householdLabel}`);
  console.log(`H: estateTrustees=${h.estateTrustees.length}, financialResources=${h.financialResources.filter(r => r.exists).length}`);
  console.log(`H: RESP children=${h.financialResources.find(r => r.type === 'resp')?.childNames.join(',')}, RDSP children=${h.financialResources.find(r => r.type === 'rdsp')?.childNames.join(',')}`);
  console.log(`H: supportTransition for Sophie=${h.children[2].supportTransition?.length || 0}, currentProvider for first=${h.children[2].supportTransition?.[0]?.currentProvider?.name || 'none'}`);
  console.log(`H: adultSiblingRoles=${h.adultSiblingRoles.length}, Emma role=${h.adultSiblingRoles[0]?.role}, notResponsible=${h.adultSiblingRoles[0]?.notResponsibleFor.join(',')}`);
  console.log(`H: documents=${h.documents.length}, immediateActions=${h.immediateActions.length}`);
  console.log(`H: parent wishes=${h.immediateActions.filter(a => a.isParentWish).length}`);
  console.log(`H: fundingPhilosophy=${h.fundingPhilosophy ? 'present' : 'absent'}, coordination=${h.careFundingCoordination?.length || 0}`);
  console.log(`H: reviewItems=${h.reviewItems?.length || 0}, limitations=${h.limitations ? 'present' : 'absent'}`);
  console.log(`I: reviewItems=${i.reviewItems?.length || 0}, incompleteItems=${i.limitations?.incompleteItems.length || 0}, professionalReviewItems=${i.limitations?.professionalReviewItems.length || 0}`);
  console.log(`I: fundingPhilosophy=${i.fundingPhilosophy ? 'present' : 'absent'}, coordinationNeeded=${i.careFundingCoordination?.some(c => c.coordinationNeeded) || false}`);

  console.log('\nAll fixtures completed.');
}
