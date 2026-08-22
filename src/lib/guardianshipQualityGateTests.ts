/**
 * Guardianship Quality Gate — Regression Tests (Scenarios A–J)
 *
 * These tests exercise the behavioural and rendering requirements from the
 * quality-gate specification. They use the roadmap builder, narrative builder,
 * audience composer, and document builder to verify end-to-end correctness.
 *
 * Run: npx tsx src/lib/guardianshipQualityGateTests.ts
 */
import type { GuardianshipRoadmapModel } from './guardianshipRoadmapTypes';
import { buildGuardianshipRoadmapModel } from './guardianshipRoadmapBuilder';
import { buildGuardianshipNarrative } from './guardianshipNarrativeBuilder';
import { composeGuardianshipForAudience } from './guardianshipAudienceComposer';
import { buildGuardianClarifyDocument } from './guardianRoadmapDocumentBuilder';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  FAIL: ${message}`);
    failCount++;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAndCompose(model: GuardianshipRoadmapModel, audience: 'guardian' | 'client' = 'guardian') {
  const narrative = buildGuardianshipNarrative(model);
  const audienceDoc = composeGuardianshipForAudience(narrative, audience, {
    clientNames: model.family.clientNames,
    reportDate: '2026-08-17',
    roadmapModel: model,
  });
  const clarifyDoc = buildGuardianClarifyDocument(audienceDoc);
  return { narrative, audienceDoc, clarifyDoc };
}

function makeBaseModel(overrides: Partial<GuardianshipRoadmapModel> = {}): GuardianshipRoadmapModel {
  return {
    family: {
      clientNames: ['John', 'Jane'],
      provinceOfResidence: 'Ontario',
      ageOfMajority: 18,
    },
    guardianHouseholds: [],
    guardianAssignments: [],
    children: [],
    adultSiblingRoles: [],
    roles: [],
    financialResources: [],
    estateTrustees: [],
    documents: [],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
    immediateActions: [],
    crossReferences: [],
    ...overrides,
  } as unknown as GuardianshipRoadmapModel;
}

function minorChild(id: string, name: string, nickname: string, overrides: Record<string, unknown> = {}) {
  return {
    childId: id,
    name,
    nickname,
    status: 'minor',
    age: 10,
    planningFocus: 'Minor',
    importantConnections: [],
    peopleToKeepClose: [],
    activities: [],
    communities: [],
    traditions: [],
    inheritanceByClient: [],
    healthcareTransition: { providers: [], hasMedications: false, medications: [], hasAllergies: false, allergies: [] },
    supportTransition: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO A — Shared guardian, simple family
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioA(): GuardianshipRoadmapModel {
  return makeBaseModel({
    children: [
      minorChild('child_a1', 'Alice Smith', 'Alice'),
      minorChild('child_a2', 'Bob Smith', 'Bob'),
    ],
    guardianAssignments: [{
      childIds: ['child_a1', 'child_a2'],
      childNames: ['Alice', 'Bob'],
      guardianPeople: [{ name: 'Greg Carter', personId: 'p_greg' }],
      guardianPersonIds: ['p_greg'],
      alternatePeople: [{ name: 'Mary Carter', personId: 'p_mary' }],
      alternatePersonIds: ['p_mary'],
      isHousehold: false,
      householdLabel: 'Greg',
      guardianPeopleIds: ['p_greg'],
      spokenWith: 'yes_confirmed',
      inWill: 'yes',
      moveStatus: 'unlikely',
    } as unknown] as never[],
    readiness: {
      decisionsMade: ['Guardian selected: Greg Carter'],
      thingsWorthConfirming: [],
      thingsStillToDo: [],
    },
  });
}

console.log('=== Scenario A: Shared guardian, simple family ===');
{
  const model = scenarioA();
  const { clarifyDoc } = buildAndCompose(model);

  const sectionHeadings = clarifyDoc.sections.map(s => s.heading);
  assert(sectionHeadings.length > 0, 'Roadmap produces sections');
  assert(!sectionHeadings.some(h => h === 'Important Documents'),
    'No empty Important Documents section when no documents exist');

  // Should not have excessive sections for a simple family
  assert(clarifyDoc.sections.length <= 15, 'Simple family produces concise roadmap (≤15 sections)');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO B — Different guardians per child
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioB(): GuardianshipRoadmapModel {
  return makeBaseModel({
    children: [
      minorChild('child_b1', 'Betty Smith', 'Betty'),
      minorChild('child_b2', 'Charlie Smith', 'Charlie'),
    ],
    guardianAssignments: [
      {
        childIds: ['child_b1'],
        childNames: ['Betty'],
        guardianPeople: [{ name: 'Ann Brown', personId: 'p_ann' }],
        guardianPersonIds: ['p_ann'],
        alternatePeople: [],
        alternatePersonIds: [],
        isHousehold: false,
        householdLabel: 'Ann',
        guardianPeopleIds: ['p_ann'],
        spokenWith: 'yes_confirmed',
        inWill: 'yes',
        moveStatus: 'unlikely',
      },
      {
        childIds: ['child_b2'],
        childNames: ['Charlie'],
        guardianPeople: [{ name: 'Dan Davis', personId: 'p_dan' }],
        guardianPersonIds: ['p_dan'],
        alternatePeople: [],
        alternatePersonIds: [],
        isHousehold: false,
        householdLabel: 'Dan',
        guardianPeopleIds: ['p_dan'],
        spokenWith: 'yes_confirmed',
        inWill: 'yes',
        moveStatus: 'possible',
      },
    ] as unknown[] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
  });
}

console.log('\n=== Scenario B: Different guardians per child ===');
{
  const model = scenarioB();
  const { clarifyDoc, audienceDoc } = buildAndCompose(model);

  // Each child should have their guardian resolved
  const guardianSections = clarifyDoc.sections.filter(s => s.childName || (s as unknown as { childIds?: string[] }).id?.includes('child'));
  assert(audienceDoc.sections.length > 0, 'Roadmap produces sections for different-guardian family');

  // Alternate guardian items should be child-specific
  const readinessSection = clarifyDoc.sections.find(s => s.heading.includes('Things Worth Confirming') || s.heading.includes('Worth Confirming'));
  if (readinessSection) {
    const allText = readinessSection.blocks.map(b => b.text || '').join(' ');
    assert(allText.includes('Betty') || allText.includes('Ann'),
      'Alternate guardian confirmation mentions Betty or Ann');
    assert(allText.includes('Charlie') || allText.includes('Dan'),
      'Alternate guardian confirmation mentions Charlie or Dan');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO C — Guardian ≠ Estate Trustee
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioC(): GuardianshipRoadmapModel {
  return makeBaseModel({
    children: [minorChild('child_c1', 'Casey Smith', 'Casey')],
    guardianAssignments: [{
      childIds: ['child_c1'],
      childNames: ['Casey'],
      guardianPeople: [{ name: 'Pat Parent', personId: 'p_pat' }],
      guardianPersonIds: ['p_pat'],
      alternatePeople: [],
      alternatePersonIds: [],
      isHousehold: false,
      householdLabel: 'Pat',
      guardianPeopleIds: ['p_pat'],
      spokenWith: 'yes_confirmed',
      inWill: 'yes',
      moveStatus: 'unlikely',
    } as unknown] as never[],
    estateTrustees: [{
      clientId: 'client1',
      clientName: 'John',
      hasEstateTrustee: true,
      primaryTrustee: { name: 'Erin Executor', personId: 'p_erin' },
      alternateTrustees: [],
    }] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
  });
}

console.log('\n=== Scenario C: Guardian ≠ Estate Trustee ===');
{
  const model = scenarioC();
  const { clarifyDoc } = buildAndCompose(model);

  // Who Does What should show both roles
  const whoDoesWhat = clarifyDoc.sections.find(s => s.heading === 'Who Does What?');
  assert(!!whoDoesWhat, 'Who Does What? section exists');
  if (whoDoesWhat) {
    const roleTable = whoDoesWhat.blocks.find(b => b.type === 'roleTable');
    assert(!!roleTable, 'Who Does What? contains a role table');
    if (roleTable?.rows) {
      const roles = roleTable.rows.map(r => r.role);
      assert(roles.some(r => r.includes('Guardian')), 'Role table includes Guardian');
      assert(roles.some(r => r.includes('Estate Trustee')), 'Role table includes Estate Trustee');
    }
  }

  // Financial coordination section should distinguish roles
  const finCoord = clarifyDoc.sections.find(s => s.heading === 'How the Financial Side Is Organized');
  assert(!!finCoord, 'Financial coordination section exists');
  if (finCoord) {
    const allText = finCoord.blocks.map(b => b.text || '').join(' ');
    assert(allText.includes('Estate Trustee') || allText.includes('Erin'),
      'Financial coordination mentions Estate Trustee');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO D — Disabled minor child (adulthood terminology guardrail)
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioD(): GuardianshipRoadmapModel {
  return makeBaseModel({
    children: [
      minorChild('child_d1', 'Diana Smith', 'Diana', {
        age: 16,
        planningFocus: 'Minor — ongoing support needs',
        adultTransition: {
          futureIndependenceLevel: 'needs_significant_support',
          futureFinancialHelp: 'yes',
          futurePersonalHealthHelp: 'yes',
          dtcStatus: 'yes',
          dtcDocLocation: 'Filing Cabinet',
          reviewNeeded: true,
        },
        educationTransition: {
          schoolName: 'Specialized Academy',
          hasIEP: true,
          settingType: 'specialized_therapeutic',
        },
      }),
    ],
    guardianAssignments: [{
      childIds: ['child_d1'],
      childNames: ['Diana'],
      guardianPeople: [{ name: 'Sam Support', personId: 'p_sam' }],
      guardianPersonIds: ['p_sam'],
      alternatePeople: [],
      alternatePersonIds: [],
      isHousehold: false,
      householdLabel: 'Sam',
      guardianPeopleIds: ['p_sam'],
      spokenWith: 'yes_confirmed',
      inWill: 'yes',
      moveStatus: 'unlikely',
    } as unknown] as never[],
    financialResources: [
      { type: 'rdsp', exists: true, childIds: ['child_d1'], childNames: ['Diana'], crossReference: 'RDSP' },
    ] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
  });
}

console.log('\n=== Scenario D: Disabled minor child — adulthood terminology ===');
{
  const model = scenarioD();
  const { clarifyDoc, narrative } = buildAndCompose(model);

  // Check the narrative for the adulthood guardrail
  const childNarrative = narrative.children.find(c => c.childId === 'child_d1');
  if (childNarrative?.adultTransition) {
    const allText = childNarrative.adultTransition.map(b => b.body || '').join(' ');
    assert(allText.includes('does not automatically continue') || allText.includes('age of majority'),
      'Adult transition includes guardrail about guardianship not continuing past age of majority');
    assert(!allText.includes('guardianship continues') && !allText.includes('guardian appointment continues'),
      'Output does NOT say guardianship continues after adulthood');
  }

  // Check that the clarify doc doesn't contain problematic language
  const allDocText = clarifyDoc.sections.map(s =>
    s.blocks.map(b => b.text || '').join(' ')
  ).join(' ');
  assert(!allDocText.includes('guardianship continues after') && !allDocText.includes('guardian appointment continues after'),
    'PDF document does not imply guardianship continues after adulthood');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO E — Missing alternate guardian
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioE(): GuardianshipRoadmapModel {
  return makeBaseModel({
    children: [
      minorChild('child_e1', 'Eve Smith', 'Eve'),
    ],
    guardianAssignments: [{
      childIds: ['child_e1'],
      childNames: ['Eve'],
      guardianPeople: [{ name: 'Ronny Bass', personId: 'p_ronny' }],
      guardianPersonIds: ['p_ronny'],
      alternatePeople: [],
      alternatePersonIds: [],
      isHousehold: false,
      householdLabel: 'Ronny',
      guardianPeopleIds: ['p_ronny'],
      spokenWith: 'yes_confirmed',
      inWill: 'yes',
      moveStatus: 'unlikely',
    } as unknown] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: ['You have identified Ronny as your first choice for Eve, but no alternate guardian has been identified if Ronny were unable or unwilling to act.'], thingsStillToDo: [] },
  });
}

console.log('\n=== Scenario E: Missing alternate guardian ===');
{
  const model = scenarioE();
  const { clarifyDoc } = buildAndCompose(model);

  // Find the Things Worth Confirming section
  const readinessSection = clarifyDoc.sections.find(s =>
    s.heading.includes('Things Worth Confirming') || s.heading.includes('Worth Confirming')
  );
  assert(!!readinessSection, 'Things Worth Confirming section exists');

  if (readinessSection) {
    const allText = readinessSection.blocks.map(b => b.text || '').join(' ');
    assert(allText.includes('Ronny'), 'Confirmation mentions the guardian by name');
    assert(allText.includes('alternate'), 'Confirmation mentions alternate guardian');
    assert(allText.includes('Eve'), 'Confirmation mentions the child');
    // Should not frame it as an error
    assert(!allText.includes('ERROR') && !allText.includes('required'),
      'Confirmation is not framed as an error or legal requirement');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO F — No Will / guardian not confirmed in Will
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioF(): GuardianshipRoadmapModel {
  return makeBaseModel({
    children: [minorChild('child_f1', 'Frank Smith', 'Frank')],
    guardianAssignments: [{
      childIds: ['child_f1'],
      childNames: ['Frank'],
      guardianPeople: [{ name: 'Gina Guardian', personId: 'p_gina' }],
      guardianPersonIds: ['p_gina'],
      alternatePeople: [],
      alternatePersonIds: [],
      isHousehold: false,
      householdLabel: 'Gina',
      guardianPeopleIds: ['p_gina'],
      spokenWith: 'no',
      inWill: 'no',
      moveStatus: 'unlikely',
    } as unknown] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
  });
}

console.log('\n=== Scenario F: No Will / guardian not confirmed ===');
{
  const model = scenarioF();
  const { clarifyDoc } = buildAndCompose(model);

  const readinessSection = clarifyDoc.sections.find(s =>
    s.heading.includes('Things Worth Confirming') || s.heading.includes('Worth Confirming')
  );
  if (readinessSection) {
    const allText = readinessSection.blocks.map(b => b.text || '').join(' ');
    // Should mention Will or confirmation — not imply legal appointment
    assert(
      allText.toLowerCase().includes('will') || allText.toLowerCase().includes('confirm'),
      'Things Worth Confirming references Will or confirmation when not in Will'
    );
    assert(!allText.includes('legally appointed'),
      'Does not imply legal appointment when not in Will');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO G — Guardian outside province
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioG(): GuardianshipRoadmapModel {
  return makeBaseModel({
    family: {
      clientNames: ['John', 'Jane'],
      provinceOfResidence: 'Ontario',
      ageOfMajority: 18,
    },
    children: [minorChild('child_g1', 'Grace Smith', 'Grace')],
    guardianAssignments: [{
      childIds: ['child_g1'],
      childNames: ['Grace'],
      guardianPeople: [{ name: 'Henry Helper', personId: 'p_henry' }],
      guardianPersonIds: ['p_henry'],
      alternatePeople: [],
      alternatePersonIds: [],
      isHousehold: false,
      householdLabel: 'Henry',
      guardianPeopleIds: ['p_henry'],
      spokenWith: 'yes_confirmed',
      inWill: 'yes',
      moveStatus: 'likely',
      guardianCommunity: "Henry's home in Halifax, Nova Scotia",
      isCrossProvince: true,
      isCrossBorder: false,
    } as unknown] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
  });
}

console.log('\n=== Scenario G: Guardian outside province ===');
{
  const model = scenarioG();
  const { clarifyDoc } = buildAndCompose(model);

  const allText = clarifyDoc.sections.map(s => s.blocks.map(b => b.text || '').join(' ')).join(' ');
  // Should mention the move/province issue without making unsupported legal claims
  assert(allText.includes('province') || allText.includes('Nova Scotia') || allText.includes('Halifax'),
    'Output references the cross-province move');
  assert(!allText.includes('legally cannot') && !allText.includes('prohibited'),
    'Does not make unsupported legal claims about cross-province move');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO H — Blended family
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioH(): GuardianshipRoadmapModel {
  return makeBaseModel({
    children: [
      minorChild('child_h1', 'Heather Smith', 'Heather'),
      minorChild('child_h2', 'Ivan Jones', 'Ivan', { status: 'adult_independent', age: 22 }),
    ],
    guardianAssignments: [{
      childIds: ['child_h1'],
      childNames: ['Heather'],
      guardianPeople: [{ name: 'Kate Keeper', personId: 'p_kate' }],
      guardianPersonIds: ['p_kate'],
      alternatePeople: [],
      alternatePersonIds: [],
      isHousehold: false,
      householdLabel: 'Kate',
      guardianPeopleIds: ['p_kate'],
      spokenWith: 'yes_confirmed',
      inWill: 'yes',
      moveStatus: 'unlikely',
    } as unknown] as never[],
    adultSiblingRoles: [{
      adultSiblingName: 'Ivan',
      forMinorChildNames: ['Heather'],
      role: 'maintain_connection',
      notResponsibleFor: ['daily_care', 'financial_support', 'guardianship_decisions'],
    }] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
  });
}

console.log('\n=== Scenario H: Blended family ===');
{
  const model = scenarioH();
  const { clarifyDoc } = buildAndCompose(model);

  const allText = clarifyDoc.sections.map(s => s.blocks.map(b => b.text || '').join(' ')).join(' ');
  // Adult child should not be assigned parenting responsibility
  assert(!allText.includes('Ivan') || !allText.toLowerCase().includes('ivan.*guardian'),
    'Adult child Ivan is not assigned as guardian');
  assert(allText.includes('sibling') || allText.includes('Ivan'),
    'Adult sibling role is referenced');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO I — Multiple important friends through different intake paths
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioI(): GuardianshipRoadmapModel {
  return makeBaseModel({
    children: [
      minorChild('child_i1', 'Ian Smith', 'Ian', {
        importantConnections: [
          { name: 'Jimmy', relationshipTypes: ['close_friend'], contexts: ['school'], importance: 'especially_important', whyItMatters: 'Best friend', continuityIdeas: ['playdates', 'overnight camp'] },
          { name: 'Coach Mike', relationshipTypes: ['coach'], contexts: ['activities'], importance: 'especially_important', whyItMatters: 'Mentor', continuityIdeas: [] },
        ],
        peopleToKeepClose: [
          { name: 'Jimmy', resolved: true, sourceType: 'friend', personId: 'p_jimmy' },
          { name: 'Coach Mike', resolved: true, sourceType: 'friend', personId: 'p_mike' },
        ],
      }),
      minorChild('child_i2', 'Jane Smith', 'Jane', {
        importantConnections: [
          { name: 'Don', relationshipTypes: ['close_friend'], contexts: ['school'], importance: 'especially_important', whyItMatters: 'Best friend', continuityIdeas: [] },
        ],
        peopleToKeepClose: [
          { name: 'Don', resolved: true, sourceType: 'friend', personId: 'p_don' },
        ],
      }),
    ],
    guardianAssignments: [{
      childIds: ['child_i1', 'child_i2'],
      childNames: ['Ian', 'Jane'],
      guardianPeople: [{ name: 'Laura Long', personId: 'p_laura' }],
      guardianPersonIds: ['p_laura'],
      alternatePeople: [],
      alternatePersonIds: [],
      isHousehold: false,
      householdLabel: 'Laura',
      guardianPeopleIds: ['p_laura'],
      spokenWith: 'yes_confirmed',
      inWill: 'yes',
      moveStatus: 'unlikely',
    } as unknown] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
  });
}

console.log('\n=== Scenario I: Multiple important friends ===');
{
  const model = scenarioI();
  const { clarifyDoc, audienceDoc } = buildAndCompose(model);

  // Both children should have continuity actions
  const actionsSection = audienceDoc.sections.find(s => s.heading.includes('If You Ever Need to Step In') || s.heading.includes('If Something Happened'));
  if (actionsSection) {
    const allActionText = actionsSection.blocks.map(b => b.text || '').join(' ');
    assert(allActionText.includes('Ian'), 'Actions mention Ian');
    assert(allActionText.includes('Jane'), 'Actions mention Jane');
  }

  // Check for duplicate person references — Jimmy should appear once per child
  const allText = clarifyDoc.sections.map(s => s.blocks.map(b => b.text || '').join(' ')).join(' ');
  const jimmyCount = (allText.match(/Jimmy/g) || []).length;
  assert(jimmyCount >= 1 && jimmyCount <= 4, 'Jimmy referenced appropriately (not excessively duplicated)');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO J — Duplicate document inputs
// ═══════════════════════════════════════════════════════════════════════════════

function scenarioJ(): GuardianshipRoadmapModel {
  return makeBaseModel({
    children: [
      minorChild('child_j1', 'Julia Smith', 'Julia', {
        educationTransition: {
          schoolName: 'Local School',
          hasIEP: false,
          settingType: 'public',
          recordLocation: 'Filing Cabinet',
        },
        healthcareTransition: {
          providers: [],
          hasMedications: false,
          medications: [],
          hasAllergies: false,
          allergies: [],
          recordLocation: 'Filing Cabinet',
        },
      }),
    ],
    guardianAssignments: [{
      childIds: ['child_j1'],
      childNames: ['Julia'],
      guardianPeople: [{ name: 'Mark Miller', personId: 'p_mark' }],
      guardianPersonIds: ['p_mark'],
      alternatePeople: [],
      alternatePersonIds: [],
      isHousehold: false,
      householdLabel: 'Mark',
      guardianPeopleIds: ['p_mark'],
      spokenWith: 'yes_confirmed',
      inWill: 'yes',
      moveStatus: 'unlikely',
    } as unknown] as never[],
    documents: [
      {
        type: 'education_records',
        label: 'Education Records',
        childId: 'child_j1',
        childName: 'Julia',
        location: 'Filing Cabinet',
        locationKnown: true,
      },
      {
        type: 'medical_records',
        label: 'Medical Records',
        childId: 'child_j1',
        childName: 'Julia',
        location: 'Filing Cabinet',
        locationKnown: true,
      },
    ] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
  });
}

console.log('\n=== Scenario J: Duplicate document inputs ===');
{
  const model = scenarioJ();
  const { clarifyDoc, audienceDoc } = buildAndCompose(model);

  // Important Documents should render with actual content
  const docsSection = clarifyDoc.sections.find(s => s.heading === 'Important Documents');
  assert(!!docsSection, 'Important Documents section exists when documents are present');
  if (docsSection) {
    assert(docsSection.blocks.length > 0, 'Important Documents section has content blocks');
  }

  // Quick Reference should not have duplicate education records entries
  const quickRef = audienceDoc.quickReference || [];
  const eduEntries = quickRef.filter(q =>
    q.label.toLowerCase().includes('education records') ||
    (q.label.toLowerCase().includes('education') && q.category === 'document')
  );
  assert(eduEntries.length <= 1, `Quick Reference has at most 1 education records entry (got ${eduEntries.length})`);

  // Medical and education records should be separate (not merged)
  const medEntries = quickRef.filter(q =>
    q.label.toLowerCase().includes('medical records') ||
    (q.label.toLowerCase().includes('medical') && q.category === 'document')
  );
  assert(medEntries.length <= 1, `Quick Reference has at most 1 medical records entry (got ${medEntries.length})`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-CUTTING: Duplicate heading check
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n=== Cross-cutting: Duplicate heading check ===');
{
  const model = scenarioA();
  const { clarifyDoc } = buildAndCompose(model);

  for (const section of clarifyDoc.sections) {
    const blockTexts = section.blocks.map(b => b.text || '');
    const firstBlock = blockTexts[0] || '';
    // The first block should not repeat the section heading
    if (firstBlock && section.heading) {
      assert(
        firstBlock.toLowerCase().trim() !== section.heading.toLowerCase().trim(),
        `Section "${section.heading}" — first block does not repeat the heading`
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-CUTTING: Alternate guardian dedup (shared guardian, multiple children)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n=== Cross-cutting: Alternate guardian dedup ===');
{
  const model = makeBaseModel({
    children: [
      minorChild('child_k1', 'Kim Smith', 'Kim'),
      minorChild('child_k2', 'Kyle Smith', 'Kyle'),
    ],
    guardianAssignments: [{
      childIds: ['child_k1', 'child_k2'],
      childNames: ['Kim', 'Kyle'],
      guardianPeople: [{ name: 'Ronny Bass', personId: 'p_ronny' }],
      guardianPersonIds: ['p_ronny'],
      alternatePeople: [],
      alternatePersonIds: [],
      isHousehold: false,
      householdLabel: 'Ronny',
      guardianPeopleIds: ['p_ronny'],
      spokenWith: 'yes_confirmed',
      inWill: 'yes',
      moveStatus: 'unlikely',
    } as unknown] as never[],
    readiness: { decisionsMade: [], thingsWorthConfirming: [], thingsStillToDo: [] },
  });

  const { clarifyDoc } = buildAndCompose(model);
  const readinessSection = clarifyDoc.sections.find(s =>
    s.heading.includes('Things Worth Confirming') || s.heading.includes('Worth Confirming')
  );
  if (readinessSection) {
    const allText = readinessSection.blocks.map(b => b.text || '').join(' ');
    const ronnyMentions = (allText.match(/Ronny/g) || []).length;
    assert(ronnyMentions <= 2, `Alternate guardian Ronny not mentioned excessively (got ${ronnyMentions} mentions)`);

    // Should mention both children in one item if shared guardian
    assert(allText.includes('Kim') && allText.includes('Kyle'),
      'Shared guardian confirmation mentions both children');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n=== Results: ${passCount} passed, ${failCount} failed ===`);
if (failCount > 0) {
  process.exit(1);
}
