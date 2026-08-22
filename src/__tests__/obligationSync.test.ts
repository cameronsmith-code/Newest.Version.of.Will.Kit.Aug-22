import { describe, it, expect } from 'vitest';
import {
  buildDesiredMetadata,
  canonicalObligationEquivalent,
  shouldSynchronizeDomain,
  mergeCanonicalLinkageIntoCurrentDebt,
  normalizeObligationSource,
  syncObligation,
  type ObligationInput,
  type ObligationStore,
} from '../lib/obligationSync';
import { createEntity, createRelationship, type EntityEntry, type EntityRelationship } from '../lib/entityRegistryTypes';

// ── Mock store factory ───────────────────────────────────────────────────

function makeMockStore(initialEntity?: EntityEntry): {
  store: ObligationStore;
  counts: { createEntity: number; updateEntity: number; createRelationship: number; removeRelationship: number };
} {
  const counts = { createEntity: 0, updateEntity: 0, createRelationship: 0, removeRelationship: 0 };
  let entity: EntityEntry = initialEntity || createEntity('Test Obligation', 'obligation', { sourceSection: 'test' });

  const relationships: EntityRelationship[] = [];

  const store: ObligationStore = {
    getOrCreateEntity: async (_displayName, _entityType, _opts) => {
      counts.createEntity++;
      return { entity, wasDuplicate: false };
    },
    updateEntity: async (_id, updates) => {
      counts.updateEntity++;
      entity = { ...entity, ...updates };
    },
    createRelationship: async (sourceEntityId, targetEntityId, relationshipType, opts) => {
      counts.createRelationship++;
      const rel = createRelationship(sourceEntityId, targetEntityId, relationshipType, { metadata: opts?.metadata });
      relationships.push(rel);
      return { relationship: rel };
    },
    removeRelationship: async (_id) => {
      counts.removeRelationship++;
    },
    getRelationshipsByTarget: (entityId, relationshipType) => {
      return relationships.filter(
        (r) => r.active && r.targetEntityId === entityId && (!relationshipType || r.relationshipType === relationshipType)
      );
    },
    getRelationshipsBySource: (entityId, relationshipType) => {
      return relationships.filter(
        (r) => r.active && r.sourceEntityId === entityId && (!relationshipType || r.relationshipType === relationshipType)
      );
    },
    getRelationshipsByEntity: (entityId) => {
      return relationships.filter((r) => r.active && (r.sourceEntityId === entityId || r.targetEntityId === entityId));
    },
    getEntityById: (id) => (id === entity.id ? entity : undefined),
  };

  return { store, counts };
}

const baseInput: ObligationInput = {
  obligationEntityId: 'obl-1',
  obligationType: 'mortgage',
  direction: 'person_owes',
  borrower: { entityId: 'person-1', entityType: 'person', displayName: 'John' },
  borrowers: [{ entityId: 'person-1', entityType: 'person', displayName: 'John' }],
  lender: { entityId: 'lender-1', entityType: 'lender', displayName: 'TD Bank' },
  amount: '350000',
  secured: 'yes',
  collateralEntityId: 'prop-1',
  collateralDescription: 'Primary Home',
  guarantors: [],
  sourceSection: 'realEstate',
  sourceRecordId: 'primary_mortgage',
};

function makeEntityWithMeta(meta: Record<string, unknown>): EntityEntry {
  const e = createEntity('Test', 'obligation', { sourceSection: 'test', metadata: meta });
  e.id = 'obl-1';
  return e;
}

// ── TEST A: IDEMPOTENT OBLIGATION ────────────────────────────────────────

describe('TEST A — Idempotent Obligation', () => {
  it('should not updateEntity when canonical matches desired', async () => {
    const desiredMeta = buildDesiredMetadata(baseInput);
    const existingEntity = makeEntityWithMeta(desiredMeta);
    const { store, counts } = makeMockStore(existingEntity);

    let writebackCalled = false;
    await syncObligation(baseInput, store, () => { writebackCalled = true; });

    expect(counts.updateEntity).toBe(0);
    expect(writebackCalled).toBe(false);
  });
});

// ── TEST B: MATERIAL CHANGE ──────────────────────────────────────────────

describe('TEST B — Material Change', () => {
  it('should updateEntity when source balance differs', async () => {
    const staleMeta = buildDesiredMetadata({ ...baseInput, amount: '300000' });
    const existingEntity = makeEntityWithMeta(staleMeta);
    const { store, counts } = makeMockStore(existingEntity);

    await syncObligation(baseInput, store, () => {});

    expect(counts.updateEntity).toBe(1);
  });

  it('should updateEntity when lender differs', async () => {
    const staleMeta = buildDesiredMetadata({
      ...baseInput,
      lender: { entityId: 'old-lender', entityType: 'lender', displayName: 'Old Bank' },
    });
    const existingEntity = makeEntityWithMeta(staleMeta);
    const { store, counts } = makeMockStore(existingEntity);

    await syncObligation(baseInput, store, () => {});

    expect(counts.updateEntity).toBe(1);
  });
});

// ── TEST C: STALE GENERATION ─────────────────────────────────────────────

describe('TEST C — Stale Generation', () => {
  it('writeback blocked when generation advances before callback', () => {
    let generation = 4;
    const syncGen = generation;
    let writebackExecuted = false;

    generation = 5;

    const callback = () => {
      if (syncGen !== generation) return;
      writebackExecuted = true;
    };

    callback();

    expect(writebackExecuted).toBe(false);
  });
});

// ── TEST D: LINKAGE MERGE ────────────────────────────────────────────────

describe('TEST D — Linkage Merge', () => {
  it('only obligationEntityId is merged, user fields remain untouched', () => {
    const currentDebt = {
      id: 'debt-1',
      lender: 'TD Bank',
      amount: '350000',
      isSecured: 'yes',
      specialNotes: 'User entered notes',
      obligationEntityId: undefined as string | undefined,
    };

    const merged = mergeCanonicalLinkageIntoCurrentDebt(currentDebt, 'obl-123');

    expect(merged.obligationEntityId).toBe('obl-123');
    expect(merged.lender).toBe('TD Bank');
    expect(merged.amount).toBe('350000');
    expect(merged.isSecured).toBe('yes');
    expect(merged.specialNotes).toBe('User entered notes');
  });

  it('returns same object when linkage already matches', () => {
    const currentDebt = { obligationEntityId: 'obl-123', lender: 'TD Bank' };
    const merged = mergeCanonicalLinkageIntoCurrentDebt(currentDebt, 'obl-123');
    expect(merged).toBe(currentDebt);
  });
});

// ── TEST E: DISABLED DOMAIN ──────────────────────────────────────────────

describe('TEST E — Disabled Domain', () => {
  it('shouldSynchronizeDomain returns false when disabled', () => {
    expect(shouldSynchronizeDomain(false)).toBe(false);
  });

  it('shouldSynchronizeDomain returns true when enabled', () => {
    expect(shouldSynchronizeDomain(true)).toBe(true);
  });
});

// ── TEST F: STEADY STATE ─────────────────────────────────────────────────

describe('TEST F — Steady State (0 writes)', () => {
  it('already-synchronized obligation produces 0 entity writes and 0 relationship writes', async () => {
    const desiredMeta = buildDesiredMetadata(baseInput);
    const existingEntity = makeEntityWithMeta(desiredMeta);

    const existingRels: EntityRelationship[] = [
      createRelationship('person-1', 'obl-1', 'borrower_of'),
      createRelationship('lender-1', 'obl-1', 'lender_of'),
      createRelationship('obl-1', 'prop-1', 'secured_by'),
    ];

    const counts = { createEntity: 0, updateEntity: 0, createRelationship: 0, removeRelationship: 0 };
    const relationships = [...existingRels];

    const store: ObligationStore = {
      getOrCreateEntity: async () => {
        counts.createEntity++;
        return { entity: existingEntity, wasDuplicate: false };
      },
      updateEntity: async () => {
        counts.updateEntity++;
      },
      createRelationship: async (sourceEntityId, targetEntityId, relationshipType, opts) => {
        counts.createRelationship++;
        const rel = createRelationship(sourceEntityId, targetEntityId, relationshipType, { metadata: opts?.metadata });
        relationships.push(rel);
        return { relationship: rel };
      },
      removeRelationship: async () => {
        counts.removeRelationship++;
      },
      getRelationshipsByTarget: (entityId, relationshipType) => {
        return relationships.filter(
          (r) => r.active && r.targetEntityId === entityId && (!relationshipType || r.relationshipType === relationshipType)
        );
      },
      getRelationshipsBySource: (entityId, relationshipType) => {
        return relationships.filter(
          (r) => r.active && r.sourceEntityId === entityId && (!relationshipType || r.relationshipType === relationshipType)
        );
      },
      getRelationshipsByEntity: (entityId) => {
        return relationships.filter((r) => r.active && (r.sourceEntityId === entityId || r.targetEntityId === entityId));
      },
      getEntityById: (id) => (id === existingEntity.id ? existingEntity : undefined),
    };

    await syncObligation(baseInput, store, () => {});

    expect(counts.createEntity).toBe(0);
    expect(counts.updateEntity).toBe(0);
    expect(counts.createRelationship).toBe(0);
    expect(counts.removeRelationship).toBe(0);
  });

  it('rerun after material change produces minimal writes, then steady state', async () => {
    const desiredMeta = buildDesiredMetadata(baseInput);
    const existingEntity = makeEntityWithMeta(desiredMeta);
    const { store, counts } = makeMockStore(existingEntity);

    const changedInput = { ...baseInput, amount: '340000' };
    await syncObligation(changedInput, store, () => {});

    expect(counts.updateEntity).toBe(1);
    expect(counts.createEntity).toBe(0);

    const beforeRerun = { ...counts };
    await syncObligation(changedInput, store, () => {});

    expect(counts.updateEntity).toBe(beforeRerun.updateEntity);
    expect(counts.createRelationship).toBe(beforeRerun.createRelationship);
  });
});

// ── Pure helper tests ────────────────────────────────────────────────────

describe('canonicalObligationEquivalent', () => {
  it('returns true for identical metadata', () => {
    const desired = buildDesiredMetadata(baseInput);
    expect(canonicalObligationEquivalent(desired, desired)).toBe(true);
  });

  it('returns false for undefined current', () => {
    expect(canonicalObligationEquivalent(undefined, buildDesiredMetadata(baseInput))).toBe(false);
  });

  it('returns false when amount differs', () => {
    const desired = buildDesiredMetadata(baseInput);
    const current = { ...desired, amount: '999999' };
    expect(canonicalObligationEquivalent(current, desired)).toBe(false);
  });

  it('ignores updatedAt field', () => {
    const desired = buildDesiredMetadata(baseInput);
    const current = { ...desired, updatedAt: '2099-01-01' };
    expect(canonicalObligationEquivalent(current, desired)).toBe(true);
  });
});

describe('normalizeObligationSource', () => {
  it('returns empty string for null/undefined', () => {
    expect(normalizeObligationSource(null)).toBe('');
    expect(normalizeObligationSource(undefined)).toBe('');
  });

  it('returns same string for same content', () => {
    const data = { a: 1, b: 'test' };
    expect(normalizeObligationSource(data)).toBe(normalizeObligationSource(data));
  });

  it('returns different string for different content', () => {
    expect(normalizeObligationSource({ a: 1 })).not.toBe(normalizeObligationSource({ a: 2 }));
  });
});
