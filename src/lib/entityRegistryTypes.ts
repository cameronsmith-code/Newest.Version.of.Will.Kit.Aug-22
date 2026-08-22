/**
 * Entity Registry Types
 *
 * Shared entity model representing Person, Trust, Corporation, Partnership,
 * Sole Proprietorship, and Property as unified entities with typed relationships.
 */

export type EntityType =
  | 'person'
  | 'trust'
  | 'corporation'
  | 'partnership'
  | 'sole_proprietorship'
  | 'property'
  | 'obligation'
  | 'lender';

export type CompletionStatus = 'identified' | 'partial' | 'complete';

export type RelationshipType =
  | 'owns'
  | 'beneficiary_of'
  | 'trustee_of'
  | 'partner_in'
  | 'borrower_of'
  | 'guarantor_of'
  | 'secured_by'
  | 'lender_of';

export type EntityEntry = {
  id: string;
  entityType: EntityType;
  displayName: string;
  normalizedName: string;
  completionStatus: CompletionStatus;
  sourceSection: string;
  sourceEntityRef: string;
  metadata: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EntityRelationship = {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  ownershipPercentage: string;
  metadata: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export function normalizeEntityName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function generateEntityId(): string {
  return crypto.randomUUID();
}

export function generateRelationshipId(): string {
  return crypto.randomUUID();
}

export function createEntity(
  displayName: string,
  entityType: EntityType,
  opts?: {
    sourceSection?: string;
    sourceEntityRef?: string;
    completionStatus?: CompletionStatus;
    metadata?: Record<string, unknown>;
  }
): EntityEntry {
  const now = new Date().toISOString();
  return {
    id: generateEntityId(),
    entityType,
    displayName: displayName.trim(),
    normalizedName: normalizeEntityName(displayName),
    completionStatus: opts?.completionStatus || 'identified',
    sourceSection: opts?.sourceSection || '',
    sourceEntityRef: opts?.sourceEntityRef || '',
    metadata: opts?.metadata || {},
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function createRelationship(
  sourceEntityId: string,
  targetEntityId: string,
  relationshipType: RelationshipType,
  opts?: {
    ownershipPercentage?: string;
    metadata?: Record<string, unknown>;
  }
): EntityRelationship {
  const now = new Date().toISOString();
  return {
    id: generateRelationshipId(),
    sourceEntityId,
    targetEntityId,
    relationshipType,
    ownershipPercentage: opts?.ownershipPercentage || '',
    metadata: opts?.metadata || {},
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Levenshtein distance for fuzzy duplicate detection.
 * Returns a similarity score between 0 and 1.
 */
export function nameSimilarity(a: string, b: string): number {
  const s1 = normalizeEntityName(a);
  const s2 = normalizeEntityName(b);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1;

  const matrix: number[][] = Array.from({ length: len1 + 1 }, () =>
    new Array(len2 + 1).fill(0)
  );

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
}

export const DUPLICATE_THRESHOLD = 0.85;

export function findSimilarEntities(
  name: string,
  entityType: EntityType,
  entities: EntityEntry[]
): EntityEntry[] {
  const normalized = normalizeEntityName(name);
  if (!normalized) return [];

  return entities
    .filter((e) => e.active && e.entityType === entityType)
    .filter((e) => {
      if (e.normalizedName === normalized) return true;
      return nameSimilarity(name, e.displayName) >= DUPLICATE_THRESHOLD;
    });
}

export function findExactEntity(
  name: string,
  entityType: EntityType,
  entities: EntityEntry[]
): EntityEntry | undefined {
  const normalized = normalizeEntityName(name);
  return entities.find(
    (e) => e.active && e.entityType === entityType && e.normalizedName === normalized
  );
}

/**
 * Detect circular ownership by walking the ownership graph.
 * Returns true if adding source→target would create a cycle.
 */
export function wouldCreateCircularOwnership(
  sourceEntityId: string,
  targetEntityId: string,
  relationships: EntityRelationship[]
): boolean {
  if (sourceEntityId === targetEntityId) return true;

  const visited = new Set<string>();
  const queue = [targetEntityId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const ownedByCurrent = relationships
      .filter(
        (r) =>
          r.active &&
          r.relationshipType === 'owns' &&
          r.sourceEntityId === current
      )
      .map((r) => r.targetEntityId);

    for (const ownedId of ownedByCurrent) {
      if (ownedId === sourceEntityId) return true;
      if (!visited.has(ownedId)) queue.push(ownedId);
    }
  }

  return false;
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  person: 'Person',
  trust: 'Trust',
  corporation: 'Corporation',
  partnership: 'Partnership',
  sole_proprietorship: 'Sole Proprietorship',
  property: 'Property',
  obligation: 'Obligation / Debt',
  lender: 'Lender',
};

export const COMPLETION_STATUS_LABELS: Record<CompletionStatus, string> = {
  identified: 'Identified — details incomplete',
  partial: 'Partially completed',
  complete: 'Complete',
};
