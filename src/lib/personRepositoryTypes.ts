// ─── People & Professionals Repository Types ────────────────────────────────
// Household-wide source of truth for real people: family, trusted contacts,
// professionals (lawyers, accountants, advisors). One real person = one row.

export type PersonType = 'family' | 'trusted' | 'professional' | 'client' | 'child' | 'other';

export type RoleType =
  | 'guardian'
  | 'alternate_guardian'
  | 'estate_trustee'
  | 'alternate_estate_trustee'
  | 'attorney_property'
  | 'alternate_attorney_property'
  | 'attorney_personal_care'
  | 'alternate_attorney_personal_care'
  | 'emergency_caregiver'
  | 'important_adult'
  | 'family_member'
  | 'corporate_owner'
  | 'corporate_director'
  | 'trustee'
  | 'beneficiary'
  | 'other';

export type ProfessionalCategory = 'financial' | 'accountant' | 'lawyer' | 'insurance' | 'physician' | 'pharmacist' | 'other';

export interface PersonEntry {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  normalizedName: string;
  personType: PersonType;
  relationship: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  country: string;
  // Professional-specific fields
  firm?: string;
  professionalCategory?: ProfessionalCategory;
  notes?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonRole {
  id: string;
  personId: string;
  roleType: RoleType;
  subjectType: string;
  subjectId: string;
  subjectLabel: string;
  status: string;
  sortOrder: number;
}

// Reference stored in questionnaire answers — points to a PersonEntry by ID
// with a display-name snapshot for resilient output.
export interface PersonRef {
  personId: string;
  displayName: string;
}

// ─── Normalization ────────────────────────────────────────────────────────────

export function normalizePersonName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[.,;:!?]+$/g, '');
}

// ─── Similarity Detection ─────────────────────────────────────────────────────

export function personNameSimilarity(a: string, b: string): number {
  const normA = normalizePersonName(a);
  const normB = normalizePersonName(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(normA, normB);
  return 1 - dist / maxLen;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export const SIMILARITY_PROMPT_THRESHOLD = 0.8;

export function findSimilarPeople(
  newName: string,
  existing: PersonEntry[]
): PersonEntry[] {
  const norm = normalizePersonName(newName);
  if (!norm) return [];

  const exact = existing.filter(e => e.normalizedName === norm && e.active);
  if (exact.length > 0) return exact;

  return existing
    .filter(e => e.active)
    .map(e => ({ entry: e, score: personNameSimilarity(newName, e.displayName) }))
    .filter(x => x.score >= SIMILARITY_PROMPT_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .map(x => x.entry);
}

// ─── Reference Helpers ────────────────────────────────────────────────────────

export function makePersonRef(entry: PersonEntry): PersonRef {
  return { personId: entry.id, displayName: entry.displayName };
}

export function isPersonRef(value: unknown): value is PersonRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'personId' in value &&
    'displayName' in value
  );
}

export function isPersonRefArray(value: unknown): value is PersonRef[] {
  return Array.isArray(value) && value.length > 0 && value.every(isPersonRef);
}

// Convert legacy free-text name to a ref-compatible shape
export function legacyTextToPersonRef(text: string): { personId: string; displayName: string } | null {
  if (!text || !text.trim()) return null;
  return { personId: '', displayName: text.trim() };
}

// Resolve a field value that could be a PersonRef, a string, or null to a display name.
// Used by output builders to handle both legacy string values and new PersonRef objects.
export function resolvePersonNameField(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (isPersonRef(value)) return value.displayName;
  return '';
}

// ─── Split name into first/last ───────────────────────────────────────────────

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
