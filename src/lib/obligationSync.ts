/**
 * Shared Obligation Architecture — sync helpers reused across Trust debt,
 * corporate debt, shareholder loans, intercompany loans, related-party loans,
 * and personal/corporate guarantees.
 *
 * One Obligation entity exists once. Relationships explain who owes it,
 * who is owed, who guarantees it, and what secures it.
 */

import type { EntityEntry, EntityRelationship, EntityType, RelationshipType } from './entityRegistryTypes';

export type ObligationType =
  | 'bank_institutional_borrowing'
  | 'mortgage'
  | 'heloc'
  | 'corporate_operating_loan'
  | 'corporate_term_loan'
  | 'shareholder_loan'
  | 'intercompany_loan'
  | 'related_party_loan'
  | 'trust_borrowing'
  | 'personal_guarantee_exposure'
  | 'corporate_guarantee_exposure'
  | 'personal_loc'
  | 'personal_loan'
  | 'vehicle_loan'
  | 'tax_obligation'
  | 'student_loan'
  | 'family_private_loan'
  | 'credit_facility'
  | 'other_liability';

export type ObligationDirection = 'corporation_owes_person' | 'person_owes_corporation' | 'corporation_owes_corporation' | 'trust_owes' | 'person_owes' | 'other';

export type ObligationRole = {
  entityId: string;
  entityType: EntityType;
  displayName: string;
};

export type ObligationInput = {
  obligationEntityId?: string;
  obligationType: ObligationType;
  direction: ObligationDirection;
  borrower: ObligationRole;
  borrowers?: Array<ObligationRole>;
  lender: ObligationRole;
  amount?: string;
  amountUnknown?: boolean;
  interestRate?: string;
  secured: 'yes' | 'no' | 'not_sure';
  collateralEntityId?: string;
  collateralDescription?: string;
  guarantors: Array<ObligationRole>;
  documentLocationLabel?: string;
  documentLocationId?: string;
  notes?: string;
  sourceSection: string;
  sourceRecordId: string;
  paymentAmount?: string;
  paymentFrequency?: string;
  paymentSourceBankRef?: string;
  creditLimit?: string;
};

export type ObligationStore = {
  getOrCreateEntity: (
    displayName: string,
    entityType: EntityType,
    opts?: {
      sourceSection?: string;
      sourceEntityRef?: string;
      completionStatus?: 'identified' | 'partial' | 'complete';
      metadata?: Record<string, unknown>;
    }
  ) => Promise<{ entity: EntityEntry; wasDuplicate: boolean }>;
  updateEntity: (
    id: string,
    updates: Partial<Omit<EntityEntry, 'id' | 'normalizedName' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  createRelationship: (
    sourceEntityId: string,
    targetEntityId: string,
    relationshipType: 'borrower_of' | 'lender_of' | 'guarantor_of' | 'secured_by',
    opts?: { metadata?: Record<string, unknown> }
  ) => Promise<{ relationship: EntityRelationship | null }>;
  removeRelationship: (id: string) => Promise<void>;
  getRelationshipsByTarget: (entityId: string, relationshipType?: RelationshipType) => EntityRelationship[];
  getRelationshipsBySource: (entityId: string, relationshipType?: RelationshipType) => EntityRelationship[];
  getRelationshipsByEntity: (entityId: string) => EntityRelationship[];
  getEntityById: (entityId: string) => EntityEntry | undefined;
};

function buildObligationName(input: ObligationInput): string {
  const lenderPart = input.lender.displayName || 'Lender';
  const allBorrowers = input.borrowers && input.borrowers.length > 0 ? input.borrowers : [input.borrower];
  const borrowerNames = allBorrowers.map((b) => b.displayName || 'Borrower').join(' & ');
  return `${lenderPart} — ${borrowerNames}`;
}

// ── Pure helpers for idempotent synchronization ──────────────────────────

/**
 * Build the desired metadata object from an ObligationInput.
 * This is the canonical shape that syncObligation wants the entity to have.
 */
export function buildDesiredMetadata(input: ObligationInput): Record<string, unknown> {
  const allBorrowers = input.borrowers && input.borrowers.length > 0 ? input.borrowers : [input.borrower];
  return {
    obligationType: input.obligationType,
    direction: input.direction,
    amount: input.amount,
    amountUnknown: input.amountUnknown,
    interestRate: input.interestRate,
    secured: input.secured,
    collateralDescription: input.collateralDescription,
    collateralEntityId: input.collateralEntityId,
    borrowerEntityId: input.borrower.entityId,
    borrowerEntityIds: allBorrowers.map((b) => b.entityId),
    borrowers: allBorrowers.map((b) => ({ entityId: b.entityId, entityType: b.entityType, displayName: b.displayName })),
    lenderEntityId: input.lender.entityId,
    guarantors: input.guarantors.map((g) => ({ entityId: g.entityId, entityType: g.entityType, displayName: g.displayName })),
    documentLocationLabel: input.documentLocationLabel,
    documentLocationId: input.documentLocationId,
    notes: input.notes,
    sourceRecordId: input.sourceRecordId,
    paymentAmount: input.paymentAmount,
    paymentFrequency: input.paymentFrequency,
    paymentSourceBankRef: input.paymentSourceBankRef,
    creditLimit: input.creditLimit,
  };
}

/**
 * Fields that syncObligation owns and should compare for idempotency.
 * Excludes irrelevant fields like updatedAt, createdAt, normalizedName.
 */
const COMPARED_FIELDS = [
  'obligationType', 'direction', 'amount', 'amountUnknown', 'interestRate',
  'secured', 'collateralDescription', 'collateralEntityId',
  'borrowerEntityId', 'borrowerEntityIds', 'lenderEntityId',
  'documentLocationLabel', 'documentLocationId', 'notes',
  'sourceRecordId', 'paymentAmount', 'paymentFrequency',
  'paymentSourceBankRef', 'creditLimit',
] as const;

/**
 * Compare current canonical obligation metadata with desired metadata.
 * Returns true if they are equivalent (no write needed).
 * Only compares fields owned by sync — ignores updatedAt, etc.
 */
export function canonicalObligationEquivalent(
  current: Record<string, unknown> | undefined,
  desired: Record<string, unknown>
): boolean {
  if (!current) return false;
  for (const field of COMPARED_FIELDS) {
    const curVal = current[field];
    const desVal = desired[field];
    if (Array.isArray(desVal)) {
      const curArr = Array.isArray(curVal) ? curVal : [];
      if (desVal.length !== curArr.length) return false;
      for (let i = 0; i < desVal.length; i++) {
        if (JSON.stringify(desVal[i]) !== JSON.stringify(curArr[i])) return false;
      }
    } else if (JSON.stringify(curVal) !== JSON.stringify(desVal)) {
      return false;
    }
  }
  return true;
}

/**
 * Determine whether synchronization should run for a domain.
 * Pure function — tests can verify scoping logic without React.
 */
export function shouldSynchronizeDomain(enabled: boolean): boolean {
  return enabled;
}

/**
 * Merge only the canonical linkage field (obligationEntityId) into a source
 * record without touching user-entered fields. Returns a new object with
 * only the linkage merged, or the original if no merge needed.
 */
export function mergeCanonicalLinkageIntoCurrentDebt<
  T extends Record<string, unknown>
>(current: T, obligationEntityId: string): T {
  if (current.obligationEntityId === obligationEntityId) return current;
  return { ...current, obligationEntityId };
}

/**
 * Compute a stable source signature for a set of source records.
 * Used as an effect dependency to detect actual content changes
 * without being affected by object identity churn.
 */
export function normalizeObligationSource(data: unknown): string {
  if (!data) return '';
  try {
    return JSON.stringify(data);
  } catch {
    return '';
  }
}

// ── Core sync function ───────────────────────────────────────────────────

export async function syncObligation(
  input: ObligationInput,
  store: ObligationStore,
  onObligationId: (obligationId: string) => void,
): Promise<string | undefined> {
  const allBorrowers = input.borrowers && input.borrowers.length > 0 ? input.borrowers : [input.borrower];
  if (!allBorrowers.some((b) => b.entityId) || !input.lender.entityId) return undefined;

  let obligationId = input.obligationEntityId;

  if (!obligationId) {
    const displayName = buildObligationName(input);
    const result = await store.getOrCreateEntity(displayName, 'obligation', {
      sourceSection: input.sourceSection,
      sourceEntityRef: input.sourceRecordId,
      completionStatus: 'partial',
      metadata: {
        obligationType: input.obligationType,
        direction: input.direction,
        amount: input.amount,
        borrowerEntityId: input.borrower.entityId,
        borrowerEntityIds: allBorrowers.map((b) => b.entityId),
        lenderEntityId: input.lender.entityId,
      },
    });
    obligationId = result.entity.id;
    onObligationId(obligationId);
  }

  if (!obligationId) return undefined;

  // Idempotency check: compare current canonical metadata with desired
  const desiredMeta = buildDesiredMetadata(input);
  const existingEntity = store.getEntityById(obligationId);
  const currentMeta = (existingEntity?.metadata || {}) as Record<string, unknown>;

  if (!canonicalObligationEquivalent(currentMeta, desiredMeta)) {
    await store.updateEntity(obligationId, { metadata: desiredMeta });
  }

  await syncBorrowerRelationships(obligationId, allBorrowers, input, store);
  await syncLenderRelationship(obligationId, input, store);
  await syncGuarantorRelationships(obligationId, input, store);
  await syncCollateralRelationship(obligationId, input, store);

  return obligationId;
}

async function syncBorrowerRelationships(
  obligationId: string,
  borrowers: Array<ObligationRole>,
  input: ObligationInput,
  store: ObligationStore,
): Promise<void> {
  const existing = store.getRelationshipsByTarget(obligationId).filter(
    (r) => r.active && r.relationshipType === 'borrower_of'
  );
  const desiredIds = new Set(borrowers.map((b) => b.entityId));

  for (const r of existing) {
    if (!desiredIds.has(r.sourceEntityId)) {
      await store.removeRelationship(r.id);
    }
  }

  for (const b of borrowers) {
    if (!b.entityId) continue;
    const alreadyExists = existing.some((r) => r.sourceEntityId === b.entityId);
    if (!alreadyExists) {
      await store.createRelationship(b.entityId, obligationId, 'borrower_of', {
        metadata: { source: input.sourceSection, obligationType: input.obligationType },
      });
    }
  }
}

async function syncLenderRelationship(
  obligationId: string,
  input: ObligationInput,
  store: ObligationStore,
): Promise<void> {
  const existing = store.getRelationshipsByTarget(obligationId).filter(
    (r) => r.active && r.relationshipType === 'lender_of'
  );
  const correct = existing.find((r) => r.sourceEntityId === input.lender.entityId);
  if (correct) {
    for (const r of existing) {
      if (r.sourceEntityId !== input.lender.entityId) await store.removeRelationship(r.id);
    }
    return;
  }
  for (const r of existing) {
    await store.removeRelationship(r.id);
  }
  await store.createRelationship(input.lender.entityId, obligationId, 'lender_of', {
    metadata: { source: input.sourceSection, obligationType: input.obligationType },
  });
}

async function syncGuarantorRelationships(
  obligationId: string,
  input: ObligationInput,
  store: ObligationStore,
): Promise<void> {
  const existing = store.getRelationshipsByTarget(obligationId).filter(
    (r) => r.active && r.relationshipType === 'guarantor_of'
  );
  const desiredIds = new Set(input.guarantors.map((g) => g.entityId));

  for (const r of existing) {
    if (!desiredIds.has(r.sourceEntityId)) {
      await store.removeRelationship(r.id);
    }
  }

  for (const g of input.guarantors) {
    const alreadyExists = existing.some((r) => r.sourceEntityId === g.entityId);
    if (!alreadyExists) {
      await store.createRelationship(g.entityId, obligationId, 'guarantor_of', {
        metadata: { source: input.sourceSection, guarantorName: g.displayName, guarantorType: g.entityType },
      });
    }
  }
}

async function syncCollateralRelationship(
  obligationId: string,
  input: ObligationInput,
  store: ObligationStore,
): Promise<void> {
  const existing = store.getRelationshipsBySource(obligationId).filter(
    (r) => r.active && r.relationshipType === 'secured_by'
  );

  if (input.secured !== 'yes' || !input.collateralEntityId) {
    for (const r of existing) {
      await store.removeRelationship(r.id);
    }
    return;
  }

  const correct = existing.find((r) => r.targetEntityId === input.collateralEntityId);
  if (correct) {
    for (const r of existing) {
      if (r.targetEntityId !== input.collateralEntityId) await store.removeRelationship(r.id);
    }
    return;
  }
  for (const r of existing) {
    await store.removeRelationship(r.id);
  }
  await store.createRelationship(obligationId, input.collateralEntityId, 'secured_by', {
    metadata: { source: input.sourceSection, collateralDescription: input.collateralDescription },
  });
}

export async function deleteObligation(
  obligationEntityId: string | undefined,
  store: ObligationStore,
): Promise<void> {
  if (!obligationEntityId) return;
  const rels = store.getRelationshipsByEntity(obligationEntityId);
  for (const r of rels) {
    if (r.active) await store.removeRelationship(r.id);
  }
  await store.updateEntity(obligationEntityId, { active: false });
}
