import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  PersonEntry,
  PersonRef,
  PersonType,
  RoleType,
  PersonRole,
  ProfessionalCategory,
  normalizePersonName,
  findSimilarPeople,
  makePersonRef,
  splitName,
} from '../lib/personRepositoryTypes';

type PeopleRepositoryContextType = {
  people: PersonEntry[];
  roles: PersonRole[];
  loading: boolean;
  initPeople: (questionnaireId: string) => Promise<void>;
  getOrCreatePerson: (name: string, opts?: {
    personType?: PersonType;
    relationship?: string;
    phone?: string;
    email?: string;
    city?: string;
    province?: string;
    country?: string;
    firm?: string;
    professionalCategory?: ProfessionalCategory;
    notes?: string;
  }) => Promise<PersonEntry | null>;
  getPersonById: (id: string) => PersonEntry | undefined;
  checkSimilar: (name: string) => PersonEntry[];
  createPerson: (name: string, opts?: {
    personType?: PersonType;
    relationship?: string;
    phone?: string;
    email?: string;
    city?: string;
    province?: string;
    country?: string;
    firm?: string;
    professionalCategory?: ProfessionalCategory;
    notes?: string;
  }) => Promise<PersonEntry | null>;
  updatePerson: (id: string, updates: Partial<Omit<PersonEntry, 'id' | 'normalizedName' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  addRole: (personId: string, roleType: RoleType, subject?: { type?: string; id?: string; label?: string; status?: string; sortOrder?: number }) => Promise<void>;
  removeRole: (roleId: string) => Promise<void>;
  getRolesByPerson: (personId: string) => PersonRole[];
  getPeopleByRole: (roleType: RoleType) => PersonEntry[];
  getPeopleByType: (personType: PersonType) => PersonEntry[];
  getProfessionals: (category?: ProfessionalCategory) => PersonEntry[];
  refToName: (ref: PersonRef | string | undefined) => string;
  refArrayToNames: (refs: PersonRef[] | string[] | undefined) => string[];
};

const PeopleRepositoryContext = createContext<PeopleRepositoryContextType | undefined>(undefined);

const STORAGE_KEY = 'willprep_people';
const ROLES_STORAGE_KEY = 'willprep_person_roles';

function loadFromStorage(): PersonEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveToStorage(people: PersonEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  } catch { /* ignore */ }
}

function loadRolesFromStorage(): PersonRole[] {
  try {
    const stored = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveRolesToStorage(roles: PersonRole[]) {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  } catch { /* ignore */ }
}

export function PeopleRepositoryProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<PersonEntry[]>([]);
  const [roles, setRoles] = useState<PersonRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);

  const initPeople = useCallback(async (qId: string) => {
    setQuestionnaireId(qId);
    setLoading(true);
    try {
      const local = loadFromStorage();
      if (local.length > 0) setPeople(local);
      const localRoles = loadRolesFromStorage();
      if (localRoles.length > 0) setRoles(localRoles);

      if (supabase) {
        const { data: pData, error: pErr } = await supabase
          .from('people')
          .select('*')
          .eq('questionnaire_id', qId)
          .eq('active', true)
          .order('created_at', { ascending: true });

        if (!pErr && pData) {
          const entries: PersonEntry[] = pData.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            firstName: row.first_name as string || '',
            lastName: row.last_name as string || '',
            displayName: row.display_name as string,
            normalizedName: row.normalized_name as string,
            personType: (row.person_type as PersonType) || 'other',
            relationship: row.relationship as string || '',
            phone: row.phone as string || '',
            email: row.email as string || '',
            city: row.city as string || '',
            province: row.province as string || '',
            country: row.country as string || '',
            firm: row.firm as string || undefined,
            professionalCategory: row.professional_category as ProfessionalCategory | undefined,
            notes: row.notes as string | undefined,
            active: row.active as boolean,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
          }));
          setPeople(entries);
          saveToStorage(entries);
        }

        const { data: rData, error: rErr } = await supabase
          .from('person_roles')
          .select('*')
          .eq('questionnaire_id', qId)
          .order('sort_order', { ascending: true });

        if (!rErr && rData) {
          const roleEntries: PersonRole[] = rData.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            personId: row.person_id as string,
            roleType: row.role_type as RoleType,
            subjectType: row.subject_type as string || '',
            subjectId: row.subject_id as string || '',
            subjectLabel: row.subject_label as string || '',
            status: row.status as string || 'confirmed',
            sortOrder: row.sort_order as number || 0,
          }));
          setRoles(roleEntries);
          saveRolesToStorage(roleEntries);
        }
      }
    } catch (err) {
      console.warn('Failed to load people repository:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistPerson = useCallback(async (entry: PersonEntry): Promise<void> => {
    saveToStorage([...people, entry]);
    if (supabase && questionnaireId) {
      try {
        await supabase.from('people').upsert({
          id: entry.id,
          questionnaire_id: questionnaireId,
          first_name: entry.firstName,
          last_name: entry.lastName,
          display_name: entry.displayName,
          normalized_name: entry.normalizedName,
          person_type: entry.personType,
          relationship: entry.relationship,
          phone: entry.phone,
          email: entry.email,
          city: entry.city,
          province: entry.province,
          country: entry.country,
          firm: entry.firm,
          professional_category: entry.professionalCategory,
          notes: entry.notes,
          active: entry.active,
        });
      } catch (err) {
        console.warn('Failed to persist person to DB:', err);
      }
    }
  }, [people, questionnaireId]);

  const createPerson = useCallback(async (
    name: string,
    opts?: {
      personType?: PersonType;
      relationship?: string;
      phone?: string;
      email?: string;
      city?: string;
      province?: string;
      country?: string;
      firm?: string;
      professionalCategory?: ProfessionalCategory;
      notes?: string;
    }
  ): Promise<PersonEntry | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const normalized = normalizePersonName(trimmed);
    if (!normalized) return null;

    // Check for exact normalized match
    const existing = people.find(p => p.normalizedName === normalized && p.active);
    if (existing) return existing;

    const { firstName, lastName } = splitName(trimmed);
    const entry: PersonEntry = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      displayName: trimmed,
      normalizedName: normalized,
      personType: opts?.personType || 'other',
      relationship: opts?.relationship || '',
      phone: opts?.phone || '',
      email: opts?.email || '',
      city: opts?.city || '',
      province: opts?.province || '',
      country: opts?.country || '',
      firm: opts?.firm,
      professionalCategory: opts?.professionalCategory,
      notes: opts?.notes,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPeople(prev => [...prev, entry]);
    await persistPerson(entry);
    return entry;
  }, [people, persistPerson]);

  const getOrCreatePerson = useCallback(async (
    name: string,
    opts?: Parameters<typeof createPerson>[1]
  ): Promise<PersonEntry | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const normalized = normalizePersonName(trimmed);
    const existing = people.find(p => p.normalizedName === normalized && p.active);
    if (existing) return existing;
    return createPerson(trimmed, opts);
  }, [people, createPerson]);

  const getPersonById = useCallback((id: string): PersonEntry | undefined => {
    return people.find(p => p.id === id && p.active);
  }, [people]);

  const checkSimilar = useCallback((name: string): PersonEntry[] => {
    return findSimilarPeople(name, people.filter(p => p.active));
  }, [people]);

  const updatePerson = useCallback(async (
    id: string,
    updates: Partial<Omit<PersonEntry, 'id' | 'normalizedName' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> => {
    setPeople(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        const entry: PersonEntry = { ...p, ...updates, updatedAt: new Date().toISOString() };
        if (updates.displayName) {
          entry.normalizedName = normalizePersonName(updates.displayName);
        }
        return entry;
      });
      saveToStorage(updated);
      return updated;
    });

    if (supabase && questionnaireId) {
      try {
        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.displayName !== undefined) {
          dbUpdates.display_name = updates.displayName;
          dbUpdates.normalized_name = normalizePersonName(updates.displayName);
        }
        if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
        if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
        if (updates.personType !== undefined) dbUpdates.person_type = updates.personType;
        if (updates.relationship !== undefined) dbUpdates.relationship = updates.relationship;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.city !== undefined) dbUpdates.city = updates.city;
        if (updates.province !== undefined) dbUpdates.province = updates.province;
        if (updates.country !== undefined) dbUpdates.country = updates.country;
        if (updates.firm !== undefined) dbUpdates.firm = updates.firm;
        if (updates.professionalCategory !== undefined) dbUpdates.professional_category = updates.professionalCategory;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        await supabase.from('people').update(dbUpdates).eq('id', id);
      } catch (err) {
        console.warn('Failed to update person in DB:', err);
      }
    }
  }, [people, questionnaireId]);

  const addRole = useCallback(async (
    personId: string,
    roleType: RoleType,
    subject?: { type?: string; id?: string; label?: string; status?: string; sortOrder?: number }
  ): Promise<void> => {
    const role: PersonRole = {
      id: crypto.randomUUID(),
      personId,
      roleType,
      subjectType: subject?.type || '',
      subjectId: subject?.id || '',
      subjectLabel: subject?.label || '',
      status: subject?.status || 'confirmed',
      sortOrder: subject?.sortOrder || 0,
    };

    setRoles(prev => {
      const updated = [...prev, role];
      saveRolesToStorage(updated);
      return updated;
    });

    if (supabase && questionnaireId) {
      try {
        await supabase.from('person_roles').upsert({
          id: role.id,
          questionnaire_id: questionnaireId,
          person_id: personId,
          role_type: roleType,
          subject_type: role.subjectType,
          subject_id: role.subjectId,
          subject_label: role.subjectLabel,
          status: role.status,
          sort_order: role.sortOrder,
        });
      } catch (err) {
        console.warn('Failed to persist role to DB:', err);
      }
    }
  }, [questionnaireId]);

  const removeRole = useCallback(async (roleId: string): Promise<void> => {
    setRoles(prev => {
      const updated = prev.filter(r => r.id !== roleId);
      saveRolesToStorage(updated);
      return updated;
    });

    if (supabase && questionnaireId) {
      try {
        await supabase.from('person_roles').delete().eq('id', roleId);
      } catch (err) {
        console.warn('Failed to delete role from DB:', err);
      }
    }
  }, [questionnaireId]);

  const getRolesByPerson = useCallback((personId: string): PersonRole[] => {
    return roles.filter(r => r.personId === personId);
  }, [roles]);

  const getPeopleByRole = useCallback((roleType: RoleType): PersonEntry[] => {
    const personIds = new Set(roles.filter(r => r.roleType === roleType).map(r => r.personId));
    return people.filter(p => personIds.has(p.id) && p.active);
  }, [people, roles]);

  const getPeopleByType = useCallback((personType: PersonType): PersonEntry[] => {
    return people.filter(p => p.personType === personType && p.active);
  }, [people]);

  const getProfessionals = useCallback((category?: ProfessionalCategory): PersonEntry[] => {
    return people.filter(p =>
      p.active &&
      p.personType === 'professional' &&
      (!category || p.professionalCategory === category)
    );
  }, [people]);

  const refToName = useCallback((ref: PersonRef | string | undefined): string => {
    if (!ref) return '';
    if (typeof ref === 'string') return ref;
    if (ref.displayName) return ref.displayName;
    if (ref.personId) {
      const person = getPersonById(ref.personId);
      return person?.displayName || '';
    }
    return '';
  }, [getPersonById]);

  const refArrayToNames = useCallback((refs: PersonRef[] | string[] | undefined): string[] => {
    if (!refs || !Array.isArray(refs)) return [];
    return refs.map(r => refToName(r)).filter(Boolean);
  }, [refToName]);

  useEffect(() => {
    if (people.length > 0) saveToStorage(people);
  }, [people]);

  useEffect(() => {
    if (roles.length > 0) saveRolesToStorage(roles);
  }, [roles]);

  const value: PeopleRepositoryContextType = {
    people,
    roles,
    loading,
    initPeople,
    getOrCreatePerson,
    getPersonById,
    checkSimilar,
    createPerson,
    updatePerson,
    addRole,
    removeRole,
    getRolesByPerson,
    getPeopleByRole,
    getPeopleByType,
    getProfessionals,
    refToName,
    refArrayToNames,
  };

  return (
    <PeopleRepositoryContext.Provider value={value}>
      {children}
    </PeopleRepositoryContext.Provider>
  );
}

export function usePeopleRepository(): PeopleRepositoryContextType {
  const ctx = useContext(PeopleRepositoryContext);
  if (!ctx) {
    throw new Error('usePeopleRepository must be used within a PeopleRepositoryProvider');
  }
  return ctx;
}
