// Acceptance tests for the Document & Records Location Repository
import {
  normalizeLocationLabel,
  classifyLocationType,
  locationSimilarity,
  findSimilarLocations,
  groupDocumentsByLocation,
  DocumentLocationEntry,
  DocumentRecordSummary,
  SIMILARITY_PROMPT_THRESHOLD,
} from './documentLocationTypes';

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

function makeEntry(label: string, id?: string): DocumentLocationEntry {
  return {
    id: id || crypto.randomUUID(),
    canonicalLabel: label,
    normalizedLabel: normalizeLocationLabel(label),
    locationType: classifyLocationType(label),
    active: true,
  };
}

console.log('=== Document Location Repository Acceptance Tests ===\n');

// Test 2 — Safe normalization
console.log('Test 2: Safe normalization');
const norm1 = normalizeLocationLabel('filing cabinet');
const norm2 = normalizeLocationLabel('Filing Cabinet');
const norm3 = normalizeLocationLabel('  Filing  Cabinet  ');
assert(norm1 === norm2, '"filing cabinet" and "Filing Cabinet" normalize to same value');
assert(norm1 === norm3, 'leading/trailing/double spaces are normalized');
assert(norm1 === 'filing cabinet', 'normalized value is lowercase + single-spaced');

// Test 3 — Similar but potentially different
console.log('\nTest 3: Similar but potentially different');
const existing = [makeEntry('Filing Cabinet')];
const similar = findSimilarLocations('Basement Filing Cabinet', existing);
assert(similar.length === 0, '"Basement Filing Cabinet" does NOT auto-match "Filing Cabinet"');

// Test — exact normalized match IS found
console.log('\nTest: Exact normalized match detection');
const exactMatch = findSimilarLocations('filing cabinet', existing);
assert(exactMatch.length === 1, '"filing cabinet" matches "Filing Cabinet" via normalization');

// Test — similarity score
console.log('\nTest: Similarity scoring');
const sim1 = locationSimilarity('Filing Cabinet', 'filing cabinet');
assert(sim1 === 1, 'Exact normalized match has similarity 1.0');
const sim2 = locationSimilarity('Filing Cabinet', 'Filing Cabnet');
assert(sim2 > 0.8, 'Typo has high similarity > 0.8');
const sim3 = locationSimilarity('Filing Cabinet', 'Google Drive');
assert(sim3 < 0.5, 'Clearly different locations have low similarity < 0.5');

// Test 6 — Multiple entities reference same location
console.log('\nTest 6: Multiple entities same location');
const sharedLoc = makeEntry('Smith LLP', 'loc-smith');
const docs: DocumentRecordSummary[] = [
  { documentType: 'minute_book', documentLabel: 'Corporate Minute Book', entityName: 'ABC Holdings Inc.', locationIds: [sharedLoc.id], locationLabels: ['Smith LLP'] },
  { documentType: 'trust_deed', documentLabel: 'Family Trust Deed', entityName: 'Doe Family Trust', locationIds: [sharedLoc.id], locationLabels: ['Smith LLP'] },
];
const grouped = groupDocumentsByLocation(docs, [sharedLoc]);
assert(grouped.length === 1, 'Two documents at same location group into one location');
assert(grouped[0].documents.length === 2, 'Group contains both documents');

// Test 7 — Multiple locations per document
console.log('\nTest 7: Multiple locations per document');
const loc1 = makeEntry('Home Safe', 'loc-safe');
const loc2 = makeEntry("Lawyer's Office", 'loc-lawyer');
const multiDoc: DocumentRecordSummary[] = [
  { documentType: 'will', documentLabel: 'Original Will', locationIds: [loc1.id, loc2.id], locationLabels: ['Home Safe', "Lawyer's Office"] },
];
const multiGrouped = groupDocumentsByLocation(multiDoc, [loc1, loc2]);
assert(multiGrouped.length === 2, 'Document with 2 locations appears in 2 groups');

// Test 8 — Legacy normalization
console.log('\nTest 8: Legacy capitalization normalization');
const legacyEntries = [
  makeEntry('our filing cabinet'),
  makeEntry('Filing cabinet'),
  makeEntry('Filing Cabinet'),
];
const uniqueNorms = new Set(legacyEntries.map(e => e.normalizedLabel));
// 'our filing cabinet' is different from 'filing cabinet'
assert(uniqueNorms.size === 2, '"our filing cabinet" and "Filing Cabinet" are preserved as 2 distinct locations');
// 'Filing cabinet' and 'Filing Cabinet' normalize to same
const fcNorm = normalizeLocationLabel('Filing cabinet');
const FCNorm = normalizeLocationLabel('Filing Cabinet');
assert(fcNorm === FCNorm, '"Filing cabinet" and "Filing Cabinet" normalize identically');

// Test 9 — Guardianship: same cabinet resolves to one location
console.log('\nTest 9: Guardianship education records same cabinet');
const abbyDoc: DocumentRecordSummary = {
  documentType: 'education_records', documentLabel: 'Education Records', subjectName: 'Abby',
  locationIds: ['loc-cabinet'], locationLabels: ['Filing Cabinet'],
};
const lindaDoc: DocumentRecordSummary = {
  documentType: 'education_records', documentLabel: 'Education Records', subjectName: 'Linda',
  locationIds: ['loc-cabinet'], locationLabels: ['Filing Cabinet'],
};
const cabinetLoc = makeEntry('Filing Cabinet', 'loc-cabinet');
const guardianGrouped = groupDocumentsByLocation([abbyDoc, lindaDoc], [cabinetLoc]);
assert(guardianGrouped.length === 1, 'Abby and Linda education records at same cabinet → 1 location group');
assert(guardianGrouped[0].documents.length === 2, 'Group has both children\'s records');

// Test — location type classification
console.log('\nTest: Location type classification');
assert(classifyLocationType('Home Safe') === 'physical', 'Home Safe → physical');
assert(classifyLocationType("Smith LLP") === 'professional', 'Smith LLP → professional');
assert(classifyLocationType('Google Drive') === 'digital', 'Google Drive → digital');
assert(classifyLocationType('Safety Deposit Box at RBC') === 'financial_institution', 'Safety Deposit Box at RBC → financial_institution');

// Test — similarity threshold
console.log('\nTest: Similarity threshold');
assert(SIMILARITY_PROMPT_THRESHOLD >= 0.7, 'Threshold is >= 0.7 to avoid annoying prompts');
assert(SIMILARITY_PROMPT_THRESHOLD < 1.0, 'Threshold is < 1.0 to allow prompts');

console.log(`\n=== Results: ${passCount} passed, ${failCount} failed ===`);
if (failCount > 0) {
  process.exit(1);
}
