import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { supabase } from '../lib/supabase';
import {
  EntityEntry,
  EntityRelationship,
  EntityType,
  RelationshipType,
  CompletionStatus,
  createEntity as makeEntity,
  createRelationship as makeRelationship,
  normalizeEntityName,
  findExactEntity,
  findSimilarEntities,
  wouldCreateCircularOwnership,
} from '../lib/entityRegistryTypes';

type CircularOwnershipResult = {
  blocked: boolean;
  reason?: string;
};

type CreateEntityResult = {
  entity: EntityEntry;
  wasDuplicate: boolean;
  duplicateOf?: EntityEntry;
};

type CreateRelationshipResult = {
  relationship: EntityRelationship | null;
  circularOwnership?: CircularOwnershipResult;
};

type EntityRegistryContextType = {
  entities: EntityEntry[];
  relationships: EntityRelationship[];
  loading: boolean;
  initRegistry: (questionnaireId: string) => Promise<void>;

  getOrCreateEntity: (
    displayName: string,
    entityType: EntityType,
    opts?: {
      sourceSection?: string;
      sourceEntityRef?: string;
      completionStatus?: CompletionStatus;
      metadata?: Record<string, unknown>;
    }
  ) => Promise<CreateEntityResult>;

  createEntity: (
    displayName: string,
    entityType: EntityType,
    opts?: {
      sourceSection?: string;
      sourceEntityRef?: string;
      completionStatus?: CompletionStatus;
      metadata?: Record<string, unknown>;
    }
  ) => Promise<CreateEntityResult>;

  updateEntity: (
    id: string,
    updates: Partial<Omit<EntityEntry, 'id' | 'normalizedName' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;

  getEntityById: (id: string) => EntityEntry | undefined;
  getEntitiesByType: (entityType: EntityType) => EntityEntry[];
  getEntitiesBySourceSection: (sectionId: string) => EntityEntry[];
  checkSimilar: (name: string, entityType: EntityType) => EntityEntry[];

  createRelationship: (
    sourceEntityId: string,
    targetEntityId: string,
    relationshipType: RelationshipType,
    opts?: {
      ownershipPercentage?: string;
      metadata?: Record<string, unknown>;
    }
  ) => Promise<CreateRelationshipResult>;

  updateRelationship: (
    id: string,
    updates: Partial<Omit<EntityRelationship, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;

  removeRelationship: (id: string) => Promise<void>;

  getRelationshipsByEntity: (entityId: string) => EntityRelationship[];
  getRelationshipsBySource: (entityId: string, relationshipType?: RelationshipType) => EntityRelationship[];
  getRelationshipsByTarget: (entityId: string, relationshipType?: RelationshipType) => EntityRelationship[];
  getOwnersOf: (entityId: string) => EntityRelationship[];
  getOwnedBy: (entityId: string) => EntityRelationship[];

  checkCircularOwnership: (sourceEntityId: string, targetEntityId: string) => CircularOwnershipResult;
  clearRegistry: () => void;
};

const EntityRegistryContext = createContext<EntityRegistryContextType | undefined>(undefined);

const ENTITIES_STORAGE_KEY = 'willprep_entities';
const RELATIONSHIPS_STORAGE_KEY = 'willprep_entity_relationships';

function loadEntitiesFromStorage(): EntityEntry[] {
  try {
    const stored = localStorage.getItem(ENTITIES_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveEntitiesToStorage(entities: EntityEntry[]) {
  try {
    localStorage.setItem(ENTITIES_STORAGE_KEY, JSON.stringify(entities));
  } catch { /* ignore */ }
}

function loadRelationshipsFromStorage(): EntityRelationship[] {
  try {
    const stored = localStorage.getItem(RELATIONSHIPS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveRelationshipsToStorage(rels: EntityRelationship[]) {
  try {
    localStorage.setItem(RELATIONSHIPS_STORAGE_KEY, JSON.stringify(rels));
  } catch { /* ignore */ }
}

export function EntityRegistryProvider({ children }: { children: ReactNode }) {
  const [entities, setEntities] = useState<EntityEntry[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);

  const clearRegistry = useCallback(() => {
    setEntities([]);
    setRelationships([]);
    try {
      localStorage.removeItem(ENTITIES_STORAGE_KEY);
      localStorage.removeItem(RELATIONSHIPS_STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  const initRegistry = useCallback(async (qId: string) => {
    setQuestionnaireId(qId);
    setLoading(true);
    try {
      const localEntities = loadEntitiesFromStorage();
      if (localEntities.length > 0) setEntities(localEntities);
      const localRels = loadRelationshipsFromStorage();
      if (localRels.length > 0) setRelationships(localRels);

      if (supabase) {
        const { data: eData, error: eErr } = await supabase
          .from('entities')
          .select('*')
          .eq('questionnaire_id', qId)
          .eq('active', true)
          .order('created_at', { ascending: true });

        if (!eErr && eData) {
          const entries: EntityEntry[] = eData.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            entityType: row.entity_type as EntityType,
            displayName: row.display_name as string,
            normalizedName: row.normalized_name as string,
            completionStatus: row.completion_status as CompletionStatus,
            sourceSection: row.source_section as string || '',
            sourceEntityRef: row.source_entity_ref as string || '',
            metadata: row.metadata as Record<string, unknown> || {},
            active: row.active as boolean,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
          }));
          setEntities(entries);
          saveEntitiesToStorage(entries);
        }

        const { data: rData, error: rErr } = await supabase
          .from('entity_relationships')
          .select('*')
          .eq('questionnaire_id', qId)
          .eq('active', true)
          .order('created_at', { ascending: true });

        if (!rErr && rData) {
          const relEntries: EntityRelationship[] = rData.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            sourceEntityId: row.source_entity_id as string,
            targetEntityId: row.target_entity_id as string,
            relationshipType: row.relationship_type as RelationshipType,
            ownershipPercentage: row.ownership_percentage as string || '',
            metadata: row.metadata as Record<string, unknown> || {},
            active: row.active as boolean,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
          }));
          setRelationships(relEntries);
          saveRelationshipsToStorage(relEntries);
        }
      }
    } catch (err) {
      console.warn('Failed to load entity registry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistEntity = useCallback(async (entry: EntityEntry): Promise<void> => {
    saveEntitiesToStorage([...entities.filter((e) => e.id !== entry.id), entry]);
    if (supabase && questionnaireId) {
      try {
        await supabase.from('entities').upsert({
          id: entry.id,
          questionnaire_id: questionnaireId,
          entity_type: entry.entityType,
          display_name: entry.displayName,
          normalized_name: entry.normalizedName,
          completion_status: entry.completionStatus,
          source_section: entry.sourceSection,
          source_entity_ref: entry.sourceEntityRef,
          metadata: entry.metadata,
          active: entry.active,
        });
      } catch (err) {
        console.warn('Failed to persist entity to DB:', err);
      }
    }
  }, [entities, questionnaireId]);

  const createEntity = useCallback(async (
    displayName: string,
    entityType: EntityType,
    opts?: {
      sourceSection?: string;
      sourceEntityRef?: string;
      completionStatus?: CompletionStatus;
      metadata?: Record<string, unknown>;
    }
  ): Promise<CreateEntityResult> => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      return { entity: makeEntity('Untitled', entityType, opts), wasDuplicate: false };
    }

    const exact = findExactEntity(trimmed, entityType, entities);
    if (exact) {
      return { entity: exact, wasDuplicate: true, duplicateOf: exact };
    }

    const entry = makeEntity(trimmed, entityType, opts);
    setEntities((prev) => [...prev, entry]);
    await persistEntity(entry);
    return { entity: entry, wasDuplicate: false };
  }, [entities, persistEntity]);

  const getOrCreateEntity = useCallback(async (
    displayName: string,
    entityType: EntityType,
    opts?: Parameters<typeof createEntity>[2]
  ): Promise<CreateEntityResult> => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      return { entity: makeEntity('Untitled', entityType, opts), wasDuplicate: false };
    }
    const exact = findExactEntity(trimmed, entityType, entities);
    if (exact) {
      const needsUpdate =
        (opts?.completionStatus && exact.completionStatus === 'identified' && opts.completionStatus !== 'identified') ||
        (opts?.sourceSection && !exact.sourceSection);
      if (needsUpdate) {
        const updates: Partial<EntityEntry> = {};
        if (opts.completionStatus && exact.completionStatus === 'identified') {
          updates.completionStatus = opts.completionStatus;
        }
        if (opts.sourceSection && !exact.sourceSection) {
          updates.sourceSection = opts.sourceSection;
        }
        if (Object.keys(updates).length > 0) {
          await updateEntityDirect(exact.id, updates);
        }
      }
      return { entity: { ...exact, ...opts }, wasDuplicate: true, duplicateOf: exact };
    }
    return createEntity(trimmed, entityType, opts);
  }, [entities, createEntity]);

  const updateEntityDirect = useCallback(async (
    id: string,
    updates: Partial<Omit<EntityEntry, 'id' | 'normalizedName' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> => {
    let updatedEntry: EntityEntry | null = null;
    setEntities((prev) => {
      const updated = prev.map((e) => {
        if (e.id !== id) return e;
        const entry: EntityEntry = { ...e, ...updates, updatedAt: new Date().toISOString() };
        if (updates.displayName) {
          entry.normalizedName = normalizeEntityName(updates.displayName);
        }
        updatedEntry = entry;
        return entry;
      });
      saveEntitiesToStorage(updated);
      return updated;
    });

    if (updatedEntry && supabase && questionnaireId) {
      try {
        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.displayName !== undefined) {
          dbUpdates.display_name = updates.displayName;
          dbUpdates.normalized_name = normalizeEntityName(updates.displayName);
        }
        if (updates.completionStatus !== undefined) dbUpdates.completion_status = updates.completionStatus;
        if (updates.sourceSection !== undefined) dbUpdates.source_section = updates.sourceSection;
        if (updates.sourceEntityRef !== undefined) dbUpdates.source_entity_ref = updates.sourceEntityRef;
        if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        await supabase.from('entities').update(dbUpdates).eq('id', id);
      } catch (err) {
        console.warn('Failed to update entity in DB:', err);
      }
    }
  }, [questionnaireId]);

  const updateEntity = updateEntityDirect;

  const getEntityById = useCallback((id: string): EntityEntry | undefined => {
    return entities.find((e) => e.id === id && e.active);
  }, [entities]);

  const getEntitiesByType = useCallback((entityType: EntityType): EntityEntry[] => {
    return entities.filter((e) => e.active && e.entityType === entityType);
  }, [entities]);

  const getEntitiesBySourceSection = useCallback((sectionId: string): EntityEntry[] => {
    return entities.filter((e) => e.active && e.sourceSection === sectionId);
  }, [entities]);

  const checkSimilar = useCallback((name: string, entityType: EntityType): EntityEntry[] => {
    return findSimilarEntities(name, entityType, entities);
  }, [entities]);

  const persistRelationship = useCallback(async (rel: EntityRelationship): Promise<void> => {
    saveRelationshipsToStorage([...relationships.filter((r) => r.id !== rel.id), rel]);
    if (supabase && questionnaireId) {
      try {
        await supabase.from('entity_relationships').upsert({
          id: rel.id,
          questionnaire_id: questionnaireId,
          source_entity_id: rel.sourceEntityId,
          target_entity_id: rel.targetEntityId,
          relationship_type: rel.relationshipType,
          ownership_percentage: rel.ownershipPercentage,
          metadata: rel.metadata,
          active: rel.active,
        });
      } catch (err) {
        console.warn('Failed to persist relationship to DB:', err);
      }
    }
  }, [relationships, questionnaireId]);

  const checkCircularOwnership = useCallback(
    (sourceEntityId: string, targetEntityId: string): CircularOwnershipResult => {
      if (sourceEntityId === targetEntityId) {
        return { blocked: true, reason: 'An entity cannot own itself.' };
      }
      if (wouldCreateCircularOwnership(sourceEntityId, targetEntityId, relationships)) {
        const sourceEntity = entities.find((e) => e.id === sourceEntityId);
        const targetEntity = entities.find((e) => e.id === targetEntityId);
        return {
          blocked: true,
          reason: `Circular ownership detected: ${targetEntity?.displayName || 'target'} already owns (directly or indirectly) ${sourceEntity?.displayName || 'source'}. This structure has been flagged for review.`,
        };
      }
      return { blocked: false };
    },
    [entities, relationships]
  );

  const createRelationship = useCallback(async (
    sourceEntityId: string,
    targetEntityId: string,
    relationshipType: RelationshipType,
    opts?: {
      ownershipPercentage?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<CreateRelationshipResult> => {
    if (relationshipType === 'owns') {
      const circular = checkCircularOwnership(sourceEntityId, targetEntityId);
      if (circular.blocked) {
        return { relationship: null, circularOwnership: circular };
      }
    }

    const existing = relationships.find(
      (r) =>
        r.active &&
        r.sourceEntityId === sourceEntityId &&
        r.targetEntityId === targetEntityId &&
        r.relationshipType === relationshipType
    );

    if (existing) {
      if (opts?.ownershipPercentage !== undefined || opts?.metadata !== undefined) {
        const updates: Partial<EntityRelationship> = {};
        if (opts.ownershipPercentage !== undefined) updates.ownershipPercentage = opts.ownershipPercentage;
        if (opts.metadata !== undefined) updates.metadata = opts.metadata;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        setRelationships((prev) => {
          const next = prev.map((r) => (r.id === existing.id ? updated : r));
          saveRelationshipsToStorage(next);
          return next;
        });
        await persistRelationship(updated);
        return { relationship: updated };
      }
      return { relationship: existing };
    }

    const rel = makeRelationship(sourceEntityId, targetEntityId, relationshipType, opts);
    setRelationships((prev) => [...prev, rel]);
    await persistRelationship(rel);
    return { relationship: rel };
  }, [relationships, persistRelationship, checkCircularOwnership]);

  const updateRelationship = useCallback(async (
    id: string,
    updates: Partial<Omit<EntityRelationship, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> => {
    let updatedRel: EntityRelationship | null = null;
    setRelationships((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== id) return r;
        const entry: EntityRelationship = { ...r, ...updates, updatedAt: new Date().toISOString() };
        updatedRel = entry;
        return entry;
      });
      saveRelationshipsToStorage(updated);
      return updated;
    });

    if (updatedRel && supabase && questionnaireId) {
      try {
        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.ownershipPercentage !== undefined) dbUpdates.ownership_percentage = updates.ownershipPercentage;
        if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        await supabase.from('entity_relationships').update(dbUpdates).eq('id', id);
      } catch (err) {
        console.warn('Failed to update relationship in DB:', err);
      }
    }
  }, [questionnaireId]);

  const removeRelationship = useCallback(async (id: string): Promise<void> => {
    setRelationships((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, active: false, updatedAt: new Date().toISOString() } : r
      );
      saveRelationshipsToStorage(updated);
      return updated;
    });

    if (supabase && questionnaireId) {
      try {
        await supabase
          .from('entity_relationships')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to deactivate relationship in DB:', err);
      }
    }
  }, [questionnaireId]);

  const getRelationshipsByEntity = useCallback((entityId: string): EntityRelationship[] => {
    return relationships.filter(
      (r) => r.active && (r.sourceEntityId === entityId || r.targetEntityId === entityId)
    );
  }, [relationships]);

  const getRelationshipsBySource = useCallback(
    (entityId: string, relationshipType?: RelationshipType): EntityRelationship[] => {
      return relationships.filter(
        (r) =>
          r.active &&
          r.sourceEntityId === entityId &&
          (!relationshipType || r.relationshipType === relationshipType)
      );
    },
    [relationships]
  );

  const getRelationshipsByTarget = useCallback(
    (entityId: string, relationshipType?: RelationshipType): EntityRelationship[] => {
      return relationships.filter(
        (r) =>
          r.active &&
          r.targetEntityId === entityId &&
          (!relationshipType || r.relationshipType === relationshipType)
      );
    },
    [relationships]
  );

  const getOwnersOf = useCallback((entityId: string): EntityRelationship[] => {
    return relationships.filter(
      (r) => r.active && r.relationshipType === 'owns' && r.targetEntityId === entityId
    );
  }, [relationships]);

  const getOwnedBy = useCallback((entityId: string): EntityRelationship[] => {
    return relationships.filter(
      (r) => r.active && r.relationshipType === 'owns' && r.sourceEntityId === entityId
    );
  }, [relationships]);

  useEffect(() => {
    if (entities.length > 0) saveEntitiesToStorage(entities);
  }, [entities]);

  useEffect(() => {
    if (relationships.length > 0) saveRelationshipsToStorage(relationships);
  }, [relationships]);

  const value: EntityRegistryContextType = {
    entities,
    relationships,
    loading,
    initRegistry,
    getOrCreateEntity,
    createEntity,
    updateEntity,
    getEntityById,
    getEntitiesByType,
    getEntitiesBySourceSection,
    checkSimilar,
    createRelationship,
    updateRelationship,
    removeRelationship,
    getRelationshipsByEntity,
    getRelationshipsBySource,
    getRelationshipsByTarget,
    getOwnersOf,
    getOwnedBy,
    checkCircularOwnership,
    clearRegistry,
  };

  return (
    <EntityRegistryContext.Provider value={value}>
      {children}
    </EntityRegistryContext.Provider>
  );
}

export function useEntityRegistry(): EntityRegistryContextType {
  const ctx = useContext(EntityRegistryContext);
  if (!ctx) {
    throw new Error('useEntityRegistry must be used within an EntityRegistryProvider');
  }
  return ctx;
}
