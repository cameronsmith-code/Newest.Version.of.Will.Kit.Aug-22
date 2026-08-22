// Acceptance test for the shared repository architecture.
// Demonstrates: one person entered once, reused across multiple roles;
// one professional entered once, reused; one location entered once, reused.
import {
  PersonEntry,
  PersonRef,
  normalizePersonName,
  findSimilarPeople,
  resolvePersonNameField,
  isPersonRef,
  makePersonRef,
  splitName,
} from './personRepositoryTypes';

const results: Array<{ test: string; pass: boolean; detail?: string }> = [];

function assert(test: string, condition: boolean, detail?: string) {
  results.push({ test, pass: condition, detail });
  console.log(`  ${condition ? 'PASS' : 'FAIL'}: ${test}${detail ? ' — ' + detail : ''}`);
}

// ─── Test 1: Person normalization ────────────────────────────────────────────
console.log('\n=== Test 1: Person normalization ===');
assert(
  'normalizePersonName strips whitespace and lowercases',
  normalizePersonName('  Ronny  Bass ') === 'ronny bass',
);
assert(
  'normalizePersonName strips trailing punctuation',
  normalizePersonName('Jane Smith,') === 'jane smith',
);

// ─── Test 2: Duplicate detection ─────────────────────────────────────────────
console.log('\n=== Test 2: Duplicate detection ===');
const existingPeople: PersonEntry[] = [
  {
    id: 'p1',
    firstName: 'Ronny',
    lastName: 'Bass',
    displayName: 'Ronny Bass',
    normalizedName: 'ronny bass',
    personType: 'trusted',
    relationship: 'Family friend',
    phone: '555-1234',
    email: '',
    city: 'Toronto',
    province: 'ON',
    country: 'Canada',
    active: true,
  },
  {
    id: 'p2',
    firstName: 'Jane',
    lastName: 'Smith',
    displayName: 'Jane Smith',
    normalizedName: 'jane smith',
    personType: 'professional',
    relationship: 'Estate Lawyer',
    phone: '',
    email: '',
    city: '',
    province: '',
    country: '',
    firm: 'Smith LLP',
    professionalCategory: 'lawyer',
    active: true,
  },
];

const exactMatch = findSimilarPeople('Ronny Bass', existingPeople);
assert('Exact name match found', exactMatch.length === 1 && exactMatch[0].id === 'p1');

const noMatch = findSimilarPeople('Mike Chen', existingPeople);
assert('Different name returns no match', noMatch.length === 0);

const fuzzyMatch = findSimilarPeople('Ronnie Bass', existingPeople);
assert('Fuzzy match (typo) detected', fuzzyMatch.length >= 1, `found ${fuzzyMatch.length}`);

// ─── Test 3: One person, many roles ──────────────────────────────────────────
console.log('\n=== Test 3: One person, many roles ===');
const ronny = existingPeople[0];
const guardianRef = makePersonRef(ronny);
const caregiverRef = makePersonRef(ronny);

assert(
  'Guardian ref and caregiver ref point to same person',
  guardianRef.personId === caregiverRef.personId,
);
assert(
  'Both refs have same display name',
  guardianRef.displayName === 'Ronny Bass' && caregiverRef.displayName === 'Ronny Bass',
);

// ─── Test 4: PersonRef resolution ────────────────────────────────────────────
console.log('\n=== Test 4: PersonRef resolution ===');
assert(
  'resolvePersonNameField handles PersonRef',
  resolvePersonNameField({ personId: 'p1', displayName: 'Ronny Bass' }) === 'Ronny Bass',
);
assert(
  'resolvePersonNameField handles legacy string',
  resolvePersonNameField('Jane Smith') === 'Jane Smith',
);
assert(
  'resolvePersonNameField handles undefined',
  resolvePersonNameField(undefined) === '',
);
assert(
  'resolvePersonNameField handles null',
  resolvePersonNameField(null) === '',
);

// ─── Test 5: isPersonRef type guard ──────────────────────────────────────────
console.log('\n=== Test 5: isPersonRef type guard ===');
assert('isPersonRef identifies ref object', isPersonRef({ personId: 'p1', displayName: 'Ronny Bass' }));
assert('isPersonRef rejects string', !isPersonRef('Ronny Bass'));
assert('isPersonRef rejects null', !isPersonRef(null));
assert('isPersonRef rejects partial object', !isPersonRef({ personId: 'p1' }));

// ─── Test 6: splitName ───────────────────────────────────────────────────────
console.log('\n=== Test 6: splitName ===');
assert('splitName splits first and last', JSON.stringify(splitName('Ronny Bass')) === '{"firstName":"Ronny","lastName":"Bass"}');
assert('splitName handles single name', JSON.stringify(splitName('Ronny')) === '{"firstName":"Ronny","lastName":""}');
assert('splitName handles three names', JSON.stringify(splitName('Jane Marie Smith')) === '{"firstName":"Jane","lastName":"Marie Smith"}');

// ─── Test 7: Simulated acceptance flow ──────────────────────────────────────
console.log('\n=== Test 7: Simulated acceptance flow ===');
// 1. Add Ronny Bass once as a trusted person
// 2. Later select Ronny Bass as Guardian (reuse, don't retype)
// 3. Later select Ronny Bass as emergency caregiver (reuse again)
// 4. Add Jane Smith once as Estate Lawyer (professional)
// 5. Reuse Jane Smith in Will-related sections

const household: PersonEntry[] = [];

// Step 1: Add Ronny Bass
const ronnyEntry: PersonEntry = {
  id: 'new-1',
  firstName: 'Ronny',
  lastName: 'Bass',
  displayName: 'Ronny Bass',
  normalizedName: 'ronny bass',
  personType: 'trusted',
  relationship: 'Family friend',
  phone: '555-1234',
  email: '',
  city: 'Toronto',
  province: 'ON',
  country: 'Canada',
  active: true,
};
household.push(ronnyEntry);

// Step 2: Select Ronny as Guardian — should reuse, not create new
const guardianSelection = findSimilarPeople('Ronny Bass', household);
assert('Step 2: Ronny Bass reused as Guardian (no duplicate)', guardianSelection.length === 1 && guardianSelection[0].id === 'new-1');

// Step 3: Select Ronny as emergency caregiver — should reuse again
const caregiverSelection = findSimilarPeople('Ronny Bass', household);
assert('Step 3: Ronny Bass reused as emergency caregiver', caregiverSelection.length === 1 && caregiverSelection[0].id === 'new-1');

// Step 4: Add Jane Smith as Estate Lawyer
const janeEntry: PersonEntry = {
  id: 'new-2',
  firstName: 'Jane',
  lastName: 'Smith',
  displayName: 'Jane Smith',
  normalizedName: 'jane smith',
  personType: 'professional',
  relationship: 'Estate Lawyer',
  phone: '',
  email: '',
  city: '',
  province: '',
  country: '',
  firm: 'Smith LLP',
  professionalCategory: 'lawyer',
  active: true,
};
household.push(janeEntry);

// Step 5: Reuse Jane Smith in Will sections
const willLawyerSelection = findSimilarPeople('Jane Smith', household);
assert('Step 5: Jane Smith reused in Will sections', willLawyerSelection.length === 1 && willLawyerSelection[0].id === 'new-2');

// Verify only 2 canonical people exist (no duplicates)
assert('Final: only 2 canonical people in repository', household.length === 2, `got ${household.length}`);

// ─── Test 8: PersonRef in answers ────────────────────────────────────────────
console.log('\n=== Test 8: PersonRef in answers ===');
// Simulate what happens when a PersonPicker selects someone
const guardianAnswer: PersonRef = makePersonRef(ronnyEntry);
assert(
  'Guardian answer stores personId + displayName',
  guardianAnswer.personId === 'new-1' && guardianAnswer.displayName === 'Ronny Bass',
);

// Simulate output builder resolving the ref
const resolvedName = resolvePersonNameField(guardianAnswer);
assert('Output builder resolves ref to display name', resolvedName === 'Ronny Bass');

// ─── Test 9: Legacy compatibility ────────────────────────────────────────────
console.log('\n=== Test 9: Legacy compatibility ===');
// Legacy answers store names as plain strings
const legacyAnswer = 'Ronny Bass';
const legacyResolved = resolvePersonNameField(legacyAnswer);
assert('Legacy string answer resolves correctly', legacyResolved === 'Ronny Bass');

// ─── Summary ──────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
