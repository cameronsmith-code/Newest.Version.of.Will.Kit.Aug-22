import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  DocumentLocationEntry,
  LocationType,
  normalizeLocationLabel,
  classifyLocationType,
  findSimilarLocations,
  DocumentLocationRef,
  makeLocationRef,
} from '../lib/documentLocationTypes';

type DocumentLocationContextType = {
  locations: DocumentLocationEntry[];
  loading: boolean;
  initLocations: (questionnaireId: string) => Promise<void>;
  getOrCreateLocation: (label: string, notes?: string) => Promise<DocumentLocationEntry | null>;
  getLocationById: (id: string) => DocumentLocationEntry | undefined;
  getLocationByLabel: (label: string) => DocumentLocationEntry | undefined;
  checkSimilar: (label: string) => DocumentLocationEntry[];
  createLocation: (label: string, locationType?: LocationType, notes?: string) => Promise<DocumentLocationEntry | null>;
  updateLocation: (id: string, updates: Partial<Pick<DocumentLocationEntry, 'canonicalLabel' | 'locationType' | 'notes' | 'active'>>) => Promise<void>;
  refToLabel: (ref: DocumentLocationRef | string | undefined) => string;
  refArrayToLabels: (refs: DocumentLocationRef[] | string[] | undefined) => string[];
};

const DocumentLocationContext = createContext<DocumentLocationContextType | undefined>(undefined);

const STORAGE_KEY = 'willprep_document_locations';

function loadFromStorage(): DocumentLocationEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveToStorage(locations: DocumentLocationEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch {
    // ignore
  }
}

export function DocumentLocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<DocumentLocationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);

  const initLocations = useCallback(async (qId: string) => {
    setQuestionnaireId(qId);
    setLoading(true);
    try {
      // Load from localStorage first for instant display
      const local = loadFromStorage();
      if (local.length > 0) {
        setLocations(local);
      }

      // Sync with Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('document_locations')
          .select('*')
          .eq('questionnaire_id', qId)
          .eq('active', true)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const entries: DocumentLocationEntry[] = data.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            canonicalLabel: row.canonical_label as string,
            normalizedLabel: row.normalized_label as string,
            locationType: row.location_type as LocationType | undefined,
            notes: row.notes as string | undefined,
            active: row.active as boolean,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
          }));
          setLocations(entries);
          saveToStorage(entries);
        }
      }
    } catch (err) {
      console.warn('Failed to load document locations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistLocation = useCallback(async (entry: DocumentLocationEntry): Promise<void> => {
    saveToStorage([...locations, entry]);
    if (supabase && questionnaireId) {
      try {
        await supabase.from('document_locations').upsert({
          id: entry.id,
          questionnaire_id: questionnaireId,
          canonical_label: entry.canonicalLabel,
          normalized_label: entry.normalizedLabel,
          location_type: entry.locationType || 'other',
          notes: entry.notes,
          active: entry.active,
        });
      } catch (err) {
        console.warn('Failed to persist document location to DB:', err);
      }
    }
  }, [locations, questionnaireId]);

  const createLocation = useCallback(async (
    label: string,
    locationType?: LocationType,
    notes?: string
  ): Promise<DocumentLocationEntry | null> => {
    const trimmed = label.trim();
    if (!trimmed) return null;

    const normalized = normalizeLocationLabel(trimmed);
    if (!normalized) return null;

    // Check for exact normalized match first
    const existing = locations.find(l => l.normalizedLabel === normalized && l.active);
    if (existing) return existing;

    const entry: DocumentLocationEntry = {
      id: crypto.randomUUID(),
      canonicalLabel: trimmed,
      normalizedLabel: normalized,
      locationType: locationType || classifyLocationType(trimmed),
      notes,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLocations(prev => [...prev, entry]);
    await persistLocation(entry);
    return entry;
  }, [locations, persistLocation]);

  const getOrCreateLocation = useCallback(async (
    label: string,
    notes?: string
  ): Promise<DocumentLocationEntry | null> => {
    const trimmed = label.trim();
    if (!trimmed) return null;

    const normalized = normalizeLocationLabel(trimmed);
    const existing = locations.find(l => l.normalizedLabel === normalized && l.active);
    if (existing) return existing;

    return createLocation(trimmed, undefined, notes);
  }, [locations, createLocation]);

  const getLocationById = useCallback((id: string): DocumentLocationEntry | undefined => {
    return locations.find(l => l.id === id && l.active);
  }, [locations]);

  const getLocationByLabel = useCallback((label: string): DocumentLocationEntry | undefined => {
    const normalized = normalizeLocationLabel(label);
    return locations.find(l => l.normalizedLabel === normalized && l.active);
  }, [locations]);

  const checkSimilar = useCallback((label: string): DocumentLocationEntry[] => {
    return findSimilarLocations(label, locations.filter(l => l.active));
  }, [locations]);

  const updateLocation = useCallback(async (
    id: string,
    updates: Partial<Pick<DocumentLocationEntry, 'canonicalLabel' | 'locationType' | 'notes' | 'active'>>
  ): Promise<void> => {
    setLocations(prev => {
      const updated = prev.map(l => {
        if (l.id !== id) return l;
        const entry: DocumentLocationEntry = {
          ...l,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        if (updates.canonicalLabel) {
          entry.normalizedLabel = normalizeLocationLabel(updates.canonicalLabel);
        }
        return entry;
      });
      saveToStorage(updated);
      return updated;
    });

    if (supabase && questionnaireId) {
      try {
        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.canonicalLabel !== undefined) {
          dbUpdates.canonical_label = updates.canonicalLabel;
          dbUpdates.normalized_label = normalizeLocationLabel(updates.canonicalLabel);
        }
        if (updates.locationType !== undefined) dbUpdates.location_type = updates.locationType;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        await supabase
          .from('document_locations')
          .update(dbUpdates)
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to update document location in DB:', err);
      }
    }
  }, [locations, questionnaireId]);

  const refToLabel = useCallback((ref: DocumentLocationRef | string | undefined): string => {
    if (!ref) return '';
    if (typeof ref === 'string') return ref;
    if (ref.label) return ref.label;
    if (ref.locationId) {
      const loc = getLocationById(ref.locationId);
      return loc?.canonicalLabel || '';
    }
    return '';
  }, [getLocationById]);

  const refArrayToLabels = useCallback((refs: DocumentLocationRef[] | string[] | undefined): string[] => {
    if (!refs || !Array.isArray(refs)) return [];
    return refs.map(r => refToLabel(r)).filter(Boolean);
  }, [refToLabel]);

  // Sync localStorage when locations change
  useEffect(() => {
    if (locations.length > 0) {
      saveToStorage(locations);
    }
  }, [locations]);

  const value: DocumentLocationContextType = {
    locations,
    loading,
    initLocations,
    getOrCreateLocation,
    getLocationById,
    getLocationByLabel,
    checkSimilar,
    createLocation,
    updateLocation,
    refToLabel,
    refArrayToLabels,
  };

  return (
    <DocumentLocationContext.Provider value={value}>
      {children}
    </DocumentLocationContext.Provider>
  );
}

export function useDocumentLocations(): DocumentLocationContextType {
  const ctx = useContext(DocumentLocationContext);
  if (!ctx) {
    throw new Error('useDocumentLocations must be used within a DocumentLocationProvider');
  }
  return ctx;
}
