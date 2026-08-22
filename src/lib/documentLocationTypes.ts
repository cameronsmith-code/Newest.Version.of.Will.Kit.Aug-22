// ─── Document Location Repository Types ──────────────────────────────────────
// Household-wide source of truth for where documents and records can be found.

export type LocationType = 'physical' | 'professional' | 'digital' | 'financial_institution' | 'other';

export interface DocumentLocationEntry {
  id: string;
  canonicalLabel: string;
  normalizedLabel: string;
  locationType?: LocationType;
  notes?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// A reference from a document/record to a location in the repository.
// Stored inline in questionnaire answers as { locationId, label } pairs.
export interface DocumentLocationRef {
  locationId: string;
  label: string;
}

// ─── Normalization ────────────────────────────────────────────────────────────

export function normalizeLocationLabel(label: string): string {
  if (!label) return '';
  return label
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[.,;:!?]+$/g, '');
}

// Heuristic classification of a location label into a type.
const FINANCIAL_KEYWORDS = ['bank', 'safety deposit', 'deposit box', 'rbc', 'td', 'scotiabank', 'bmo', 'cibc', 'credit union', 'branch'];
const PROFESSIONAL_KEYWORDS = ['lawyer', 'notary', 'accountant', 'firm', 'llp', 'lp', 'inc.', 'professional', 'office', 'advisor'];
const DIGITAL_KEYWORDS = ['google drive', 'dropbox', 'icloud', 'onedrive', 'cloud', 'digital', 'password manager', 'online', 'portal', 'email', 'computer', 'laptop', 'hard drive', 'usb'];

export function classifyLocationType(label: string): LocationType {
  const lower = label.toLowerCase();
  if (FINANCIAL_KEYWORDS.some(kw => lower.includes(kw))) return 'financial_institution';
  if (PROFESSIONAL_KEYWORDS.some(kw => lower.includes(kw))) return 'professional';
  if (DIGITAL_KEYWORDS.some(kw => lower.includes(kw))) return 'digital';
  return 'physical';
}

// ─── Similarity Detection ────────────────────────────────────────────────────
// Returns a similarity score 0-1. Only used to prompt, never to auto-merge.
export function locationSimilarity(a: string, b: string): number {
  const normA = normalizeLocationLabel(a);
  const normB = normalizeLocationLabel(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  // Levenshtein-based similarity
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

// Threshold for prompting "is this the same location?"
// High enough to avoid annoying prompts, low enough to catch likely duplicates.
export const SIMILARITY_PROMPT_THRESHOLD = 0.75;

export function findSimilarLocations(
  newLabel: string,
  existing: DocumentLocationEntry[]
): DocumentLocationEntry[] {
  const norm = normalizeLocationLabel(newLabel);
  if (!norm) return [];

  // Exact normalized match → same location
  const exact = existing.filter(e => e.normalizedLabel === norm);
  if (exact.length > 0) return exact;

  // Similar but not identical → prompt
  return existing
    .map(e => ({ entry: e, score: locationSimilarity(newLabel, e.canonicalLabel) }))
    .filter(x => x.score >= SIMILARITY_PROMPT_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .map(x => x.entry);
}

// ─── Location Reference Helpers ──────────────────────────────────────────────

export function makeLocationRef(entry: DocumentLocationEntry): DocumentLocationRef {
  return { locationId: entry.id, label: entry.canonicalLabel };
}

export function isLocationRef(value: unknown): value is DocumentLocationRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'locationId' in value &&
    'label' in value
  );
}

export function isLocationRefArray(value: unknown): value is DocumentLocationRef[] {
  return Array.isArray(value) && value.length > 0 && value.every(isLocationRef);
}

// Convert legacy free-text to a ref-compatible shape
export function legacyTextToRef(text: string): { label: string } | null {
  if (!text || !text.trim()) return null;
  return { label: text.trim() };
}

// ─── Document Summary Model (for output builders) ────────────────────────────

export interface DocumentRecordSummary {
  documentType: string;
  documentLabel: string;
  subjectName?: string;
  entityName?: string;
  locationIds: string[];
  locationLabels: string[];
  notes?: string;
}

export interface LocationGroupSummary {
  locationId: string;
  locationLabel: string;
  locationType?: LocationType;
  documents: DocumentRecordSummary[];
}

// Group documents by their location for the "by location" output view
export function groupDocumentsByLocation(
  documents: DocumentRecordSummary[],
  locations: DocumentLocationEntry[]
): LocationGroupSummary[] {
  const groups = new Map<string, DocumentRecordSummary[]>();

  for (const doc of documents) {
    for (const locId of doc.locationIds) {
      if (!groups.has(locId)) groups.set(locId, []);
      groups.get(locId)!.push(doc);
    }
  }

  const result: LocationGroupSummary[] = [];
  for (const [locId, docs] of groups) {
    const loc = locations.find(l => l.id === locId);
    if (loc) {
      result.push({
        locationId: locId,
        locationLabel: loc.canonicalLabel,
        locationType: loc.locationType,
        documents: docs,
      });
    }
  }

  return result.sort((a, b) => a.locationLabel.localeCompare(b.locationLabel));
}
