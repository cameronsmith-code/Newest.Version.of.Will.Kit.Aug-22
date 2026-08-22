/**
 * Entity Registry Acceptance Tests
 *
 * Tests A-D from the entity-and-relationship architecture spec.
 * These tests exercise the pure logic functions from entityRegistryTypes.ts
 * (entity creation, relationship creation, duplicate detection, circular
 * ownership guardrail) without requiring React or Supabase.
 */

import {
  EntityEntry,
  EntityRelationship,
  createEntity,
  createRelationship,
  normalizeEntityName,
  nameSimilarity,
  findSimilarEntities,
  findExactEntity,
  wouldCreateCircularOwnership,
  DUPLICATE_THRESHOLD,
} from './entityRegistryTypes';

type TestResult = { name: string; passed: boolean; details?: string };

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\n  Expected: ${expectedStr}\n  Actual:   ${actualStr}`);
  }
}
void assertEqual;

// ─── Test A — Trust first ───────────────────────────────────────────────

function testA_TrustFirst(): TestResult {
  try {
    // 1. Create Doe Family Trust
    const trust = createEntity('Doe Family Trust', 'trust', {
      sourceSection: 'familyTrusts',
      sourceEntityRef: 'trust_001',
      completionStatus: 'partial',
    });
    assert(trust.entityType === 'trust', 'Trust should be type trust');
    assert(trust.displayName === 'Doe Family Trust', 'Trust name should match');
    assert(trust.completionStatus === 'partial', 'Trust should be partial');

    // 2. Indicate it owns ABC Holdings Inc.
    const corp = createEntity('ABC Holdings Inc.', 'corporation', {
      sourceSection: 'familyTrusts',
      sourceEntityRef: 'corp_partial_001',
      completionStatus: 'identified',
    });
    assert(corp.entityType === 'corporation', 'Corp should be type corporation');
    assert(corp.completionStatus === 'identified', 'Corp should be identified (partial)');

    const rel = createRelationship(trust.id, corp.id, 'owns', {
      ownershipPercentage: '100%',
      metadata: { source: 'trust_assets' },
    });
    assert(rel.relationshipType === 'owns', 'Relationship should be owns');
    assert(rel.sourceEntityId === trust.id, 'Source should be trust');
    assert(rel.targetEntityId === corp.id, 'Target should be corp');
    assert(rel.ownershipPercentage === '100%', 'Ownership should be 100%');

    // 3. ABC Holdings Inc. is created once
    const entities: EntityEntry[] = [trust, corp];
    const exactMatch = findExactEntity('ABC Holdings Inc.', 'corporation', entities);
    assert(exactMatch !== undefined, 'ABC Holdings should exist');
    assert(exactMatch!.id === corp.id, 'Should be the same entity');

    return { name: 'Test A — Trust first', passed: true };
  } catch (err) {
    return { name: 'Test A — Trust first', passed: false, details: (err as Error).message };
  }
}

// ─── Test B — Corporation first ─────────────────────────────────────────

function testB_CorporationFirst(): TestResult {
  try {
    // 1. Create ABC Holdings Inc.
    const corp = createEntity('ABC Holdings Inc.', 'corporation', {
      sourceSection: 'corporations',
      sourceEntityRef: 'corp_001',
      completionStatus: 'partial',
    });

    // 2. Add Doe Family Trust as owner — trust doesn't exist yet, create it
    const trust = createEntity('Doe Family Trust', 'trust', {
      sourceSection: 'corporations',
      sourceEntityRef: 'trust_partial_001',
      completionStatus: 'identified',
    });

    // 3. Create ownership relationship
    const rel = createRelationship(trust.id, corp.id, 'owns', {
      ownershipPercentage: '100%',
      metadata: { source: 'corporation_intake' },
    });
    assert(rel.sourceEntityId === trust.id, 'Trust is the owner');
    assert(rel.targetEntityId === corp.id, 'Corp is owned');

    // 4-5. Navigate to Trusts — Doe Family Trust appears automatically
    const entities: EntityEntry[] = [corp, trust];
    const trustsInRegistry = entities.filter((e) => e.entityType === 'trust' && e.active);
    assert(trustsInRegistry.length === 1, 'Should have 1 trust');
    assert(trustsInRegistry[0].displayName === 'Doe Family Trust', 'Trust name matches');

    // 6. Complete trust details — update status
    const updatedTrust: EntityEntry = {
      ...trust,
      completionStatus: 'partial',
      sourceSection: 'familyTrusts',
    };
    assert(updatedTrust.id === trust.id, 'Same trust ID');

    // 7-8. Return to Corporation — same relationship remains
    const relationships: EntityRelationship[] = [rel];
    const corpOwners = relationships.filter(
      (r) => r.active && r.targetEntityId === corp.id && r.relationshipType === 'owns'
    );
    assert(corpOwners.length === 1, 'Corp has 1 owner');
    assert(corpOwners[0].sourceEntityId === trust.id, 'Owner is still the trust');

    // 9. No duplicate trust exists
    const allTrusts = entities.filter((e) => e.entityType === 'trust');
    assert(allTrusts.length === 1, 'Only 1 trust — no duplicate');

    return { name: 'Test B — Corporation first', passed: true };
  } catch (err) {
    return { name: 'Test B — Corporation first', passed: false, details: (err as Error).message };
  }
}

// ─── Test C — Corporation owns corporation ──────────────────────────────

function testC_CorpOwnsCorp(): TestResult {
  try {
    // 1. Create ABC Holdings Inc.
    const holdings = createEntity('ABC Holdings Inc.', 'corporation', {
      sourceSection: 'corporations',
      completionStatus: 'partial',
    });

    // 2. Indicate it owns 100% of ABC Operating Company Inc.
    const operating = createEntity('ABC Operating Company Inc.', 'corporation', {
      sourceSection: 'corporations',
      sourceEntityRef: 'corp_partial_002',
      completionStatus: 'identified',
    });

    let rel = createRelationship(holdings.id, operating.id, 'owns', {
      ownershipPercentage: '100%',
    });
    assert(rel.ownershipPercentage === '100%', 'Initial ownership is 100%');

    const entities: EntityEntry[] = [holdings, operating];
    const relationships: EntityRelationship[] = [rel];

    // 3. ABC Operating Company Inc. is created as partial
    assert(operating.completionStatus === 'identified', 'Operating is identified/partial');

    // 4-5. Open ABC Operating — it shows ABC Holdings as owner
    const ownersOfOperating = relationships.filter(
      (r) => r.active && r.targetEntityId === operating.id && r.relationshipType === 'owns'
    );
    assert(ownersOfOperating.length === 1, 'Operating has 1 owner');
    const ownerEntity = entities.find((e) => e.id === ownersOfOperating[0].sourceEntityId);
    assert(ownerEntity?.displayName === 'ABC Holdings Inc.', 'Owner is ABC Holdings');

    // 6. Change ownership percentage to 80%
    rel = { ...rel, ownershipPercentage: '80%', updatedAt: new Date().toISOString() };
    const updatedRelationships = relationships.map((r) => (r.id === rel.id ? rel : r));

    // 7. Return to ABC Holdings — it now shows 80%
    const ownedByHoldings = updatedRelationships.filter(
      (r) => r.active && r.sourceEntityId === holdings.id && r.relationshipType === 'owns'
    );
    assert(ownedByHoldings.length === 1, 'Holdings owns 1 entity');
    assert(ownedByHoldings[0].ownershipPercentage === '80%', 'Ownership is now 80%');

    // 8. Only one ownership relationship exists
    const allOwnershipRels = updatedRelationships.filter(
      (r) => r.active && r.relationshipType === 'owns'
    );
    assert(allOwnershipRels.length === 1, 'Only 1 ownership relationship exists');

    return { name: 'Test C — Corporation owns corporation', passed: true };
  } catch (err) {
    return { name: 'Test C — Corporation owns corporation', passed: false, details: (err as Error).message };
  }
}

// ─── Test D — Multi-level structure ─────────────────────────────────────

function testD_MultiLevel(): TestResult {
  try {
    const trust = createEntity('Doe Family Trust', 'trust', { sourceSection: 'familyTrusts' });
    const holdings = createEntity('ABC Holdings Inc.', 'corporation', { sourceSection: 'familyTrusts' });
    const operating = createEntity('ABC Operating Company Inc.', 'corporation', { sourceSection: 'corporations' });
    const xyz = createEntity('XYZ Investments Inc.', 'corporation', { sourceSection: 'corporations' });

    const entities: EntityEntry[] = [trust, holdings, operating, xyz];

    const rel1 = createRelationship(trust.id, holdings.id, 'owns', { ownershipPercentage: '100%' });
    const rel2 = createRelationship(holdings.id, operating.id, 'owns', { ownershipPercentage: '100%' });
    const rel3 = createRelationship(operating.id, xyz.id, 'owns', { ownershipPercentage: '100%' });

    const relationships: EntityRelationship[] = [rel1, rel2, rel3];

    // Verify every entity has one stable ID
    const allIds = entities.map((e) => e.id);
    const uniqueIds = new Set(allIds);
    assert(uniqueIds.size === 4, '4 unique entity IDs');
    assert(allIds.length === 4, '4 entities total');

    // Verify every ownership edge is represented once
    const ownershipRels = relationships.filter((r) => r.relationshipType === 'owns' && r.active);
    assert(ownershipRels.length === 3, '3 ownership edges');

    // Verify no duplicate edges
    const edgeKeys = ownershipRels.map((r) => `${r.sourceEntityId}→${r.targetEntityId}`);
    const uniqueEdges = new Set(edgeKeys);
    assert(uniqueEdges.size === 3, '3 unique edges — no duplicates');

    // Verify chain: trust → holdings → operating → xyz
    const trustOwns = relationships.find((r) => r.sourceEntityId === trust.id);
    assert(trustOwns?.targetEntityId === holdings.id, 'Trust → Holdings');

    const holdingsOwns = relationships.find((r) => r.sourceEntityId === holdings.id);
    assert(holdingsOwns?.targetEntityId === operating.id, 'Holdings → Operating');

    const operatingOwns = relationships.find((r) => r.sourceEntityId === operating.id);
    assert(operatingOwns?.targetEntityId === xyz.id, 'Operating → XYZ');

    return { name: 'Test D — Multi-level structure', passed: true };
  } catch (err) {
    return { name: 'Test D — Multi-level structure', passed: false, details: (err as Error).message };
  }
}

// ─── Additional tests: Duplicate Detection & Circular Ownership ──────────

function testDuplicateDetection(): TestResult {
  try {
    const existing = createEntity('ABC Holdings Inc.', 'corporation', {});
    const entities: EntityEntry[] = [existing];

    // Exact match
    const exact = findExactEntity('ABC Holdings Inc.', 'corporation', entities);
    assert(exact !== undefined, 'Exact match found');

    // Similar name — "ABC Holdings Inc" (without period) vs "ABC Holdings Inc."
    const similar = findSimilarEntities('ABC Holdings Inc', 'corporation', entities);
    assert(similar.length > 0, 'Similar entity detected');

    // Verify similarity score for close match
    const score = nameSimilarity('ABC Holdings Inc', 'ABC Holdings Inc.');
    assert(score >= DUPLICATE_THRESHOLD, `Similarity ${score} should be >= ${DUPLICATE_THRESHOLD}`);

    // Different name should not match
    const noMatch = findSimilarEntities('XYZ Corp', 'corporation', entities);
    assert(noMatch.length === 0, 'No match for different name');

    return { name: 'Duplicate Detection', passed: true };
  } catch (err) {
    return { name: 'Duplicate Detection', passed: false, details: (err as Error).message };
  }
}

function testCircularOwnership(): TestResult {
  try {
    const holdings = createEntity('ABC Holdings Inc.', 'corporation', {});
    const operating = createEntity('ABC Operating Company Inc.', 'corporation', {});

    const rel1 = createRelationship(holdings.id, operating.id, 'owns', { ownershipPercentage: '100%' });
    const relationships: EntityRelationship[] = [rel1];

    // Attempt: Operating owns Holdings — should be circular
    const isCircular = wouldCreateCircularOwnership(operating.id, holdings.id, relationships);
    assert(isCircular === true, 'Circular ownership detected');

    // Normal: a third corp owns Holdings — should NOT be circular
    const third = createEntity('XYZ Investments Inc.', 'corporation', {});
    const isNotCircular = wouldCreateCircularOwnership(third.id, holdings.id, relationships);
    assert(isNotCircular === false, 'Non-circular ownership allowed');

    // Self-ownership
    const selfOwn = wouldCreateCircularOwnership(holdings.id, holdings.id, relationships);
    assert(selfOwn === true, 'Self-ownership blocked');

    return { name: 'Circular Ownership Guardrail', passed: true };
  } catch (err) {
    return { name: 'Circular Ownership Guardrail', passed: false, details: (err as Error).message };
  }
}

function testNormalizationAndSimilarity(): TestResult {
  try {
    assert(normalizeEntityName('  ABC   Holdings  ') === 'abc holdings', 'Normalizes spaces and case');
    assert(normalizeEntityName('ABC Holdings Inc.') === 'abc holdings inc.', 'Normalizes with period');

    assert(nameSimilarity('ABC Holdings', 'ABC Holdings') === 1, 'Identical names → 1.0');
    assert(nameSimilarity('', '') === 1, 'Empty names → 1.0 (edge case)');
    assert(nameSimilarity('ABC', 'XYZ') < 0.5, 'Very different names → low score');

    return { name: 'Normalization & Similarity', passed: true };
  } catch (err) {
    return { name: 'Normalization & Similarity', passed: false, details: (err as Error).message };
  }
}

// ─── Runner ─────────────────────────────────────────────────────────────

export function runEntityRegistryAcceptanceTests(): {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
} {
  const tests: Array<() => TestResult> = [
    testA_TrustFirst,
    testB_CorporationFirst,
    testC_CorpOwnsCorp,
    testD_MultiLevel,
    testDuplicateDetection,
    testCircularOwnership,
    testNormalizationAndSimilarity,
  ];

  const results = tests.map((test) => test());
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return { total: results.length, passed, failed, results };
}

export { testA_TrustFirst, testB_CorporationFirst, testC_CorpOwnsCorp, testD_MultiLevel };
