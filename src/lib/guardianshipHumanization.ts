/**
 * Guardianship Enum Humanization
 *
 * Centralized interpretation of guardianship structured values into
 * natural language.  No raw enum value, snake_case key, or internal ID
 * should ever reach human-facing output.
 */

// ─── Relationship continuity types ────────────────────────────────────────────

const CONTINUITY_LABELS: Record<string, string> = {
  playdates_visits: 'play dates and visits',
  weekend_visits: 'weekend visits',
  sleepovers: 'sleepovers',
  shared_activity: 'shared activities',
  camp_together: 'summer camp together',
  birthdays_occasions: 'birthday celebrations and special occasions',
  video_calls: 'video calls to stay connected between visits',
  gaming_online: 'gaming and online connection',
  contact_friend_parents: 'staying in touch with the friend\'s parents',
  regular_sibling: 'regular sibling-style time together',
};

export function humanizeContinuityIdeas(ideas: string[]): string[] {
  return ideas.map(i => CONTINUITY_LABELS[i] || humanizeSnakeCase(i));
}

export function interpretContinuityParagraph(
  ideas: string[],
  childName: string,
  personName: string,
  parentLabel: string,
  guardianName?: string
): string {
  if (ideas.length === 0) return '';
  const helper = guardianName || 'a future guardian';
  const humanized = humanizeContinuityIdeas(ideas);
  if (humanized.length === 1) {
    return `${parentLabel} would hope ${helper} helps preserve that connection through ${humanized[0]}.`;
  }
  if (humanized.length === 2) {
    return `${parentLabel} would hope ${helper} makes a deliberate effort to keep ${personName} in ${childName}'s life through ${humanized[0]} and ${humanized[1]}.`;
  }
  const last = humanized.pop()!;
  return `${parentLabel} would hope ${helper} makes a deliberate effort to keep ${personName} in ${childName}'s life through ${humanized.join(', ')}, and ${last}.`;
}

// ─── Connection relationship types ────────────────────────────────────────────

const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  friend: 'a friend',
  family_member: 'a family member',
  extended_family: 'extended family',
  coach: 'a coach',
  teacher: 'a teacher',
  mentor: 'a mentor',
  neighbour: 'a neighbour',
  teammate: 'a teammate',
  camp_friend: 'a camp friend',
  best_friend: 'a best friend',
  sibling: 'a sibling',
  cousin: 'a cousin',
  grandparent: 'a grandparent',
};

export function humanizeRelationshipTypes(types: string[]): string {
  if (types.length === 0) return 'an important person';
  const labels = types.map(t => RELATIONSHIP_TYPE_LABELS[t] || humanizeSnakeCase(t));
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  const last = labels.pop()!;
  return `${labels.join(', ')}, and ${last}`;
}

// ─── Display-text values to filter out (not enums, but labels that carry no human meaning) ──

const FILTER_DISPLAY_VALUES = new Set([
  'Existing connection', 'Club activity', 'Other', 'other',
]);

// ─── Connection contexts ──────────────────────────────────────────────────────

const CONTEXT_LABELS: Record<string, string> = {
  school: 'school',
  sports: 'sports',
  neighbourhood: 'their neighbourhood',
  camp: 'camp',
  family_gatherings: 'family gatherings',
  church: 'church',
  community_program: 'a community program',
  online: 'online communities',
  daycare: 'daycare',
  extended_family: 'extended family connections',
  club_activity: 'a club or activity group',
  existing_connection: '',
};

export function humanizeContexts(contexts: string[]): string {
  if (contexts.length === 0) return 'shared experiences';
  const labels = contexts
    .map(c => {
      if (FILTER_DISPLAY_VALUES.has(c)) return '';
      const label = CONTEXT_LABELS[c];
      if (label !== undefined) return label;
      return humanizeSnakeCase(c);
    })
    .filter(l => l.length > 0);
  if (labels.length === 0) return 'shared experiences';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  const last = labels.pop()!;
  return `${labels.join(', ')}, and ${last}`;
}

// ─── Tradition participant types ──────────────────────────────────────────────

const PARTICIPANT_LABELS: Record<string, string> = {
  sibling: 'siblings',
  close_friend: 'close friends',
  grandparents: 'grandparents',
  cousin: 'cousins',
  extended_family: 'extended family',
  parents: 'parents',
  teammates: 'teammates',
  coach: 'coaches',
  neighbour: 'neighbours',
  community_group: 'community groups',
  existing_connection: '',
};

export function humanizeParticipantTypes(types: string[]): string {
  if (types.length === 0) return 'family and friends';
  const labels = types
    .map(t => {
      if (FILTER_DISPLAY_VALUES.has(t)) return '';
      const label = PARTICIPANT_LABELS[t];
      if (label !== undefined) return label;
      return humanizeSnakeCase(t);
    })
    .filter(l => l.length > 0);
  if (labels.length === 0) return 'family and friends';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  const last = labels.pop()!;
  return `${labels.join(', ')}, and ${last}`;
}

// ─── Funding record-keeping ───────────────────────────────────────────────────

const RECORD_KEEPING_LABELS: Record<string, string> = {
  keep_simple: 'They would prefer to keep record-keeping simple and practical rather than tracking every expense.',
  detailed_tracking: 'They are comfortable with more detailed record-keeping if it helps ensure transparency.',
  trustee_manages: 'They would expect the trustee to handle record-keeping and provide periodic summaries.',
};

export function humanizeRecordKeeping(preference: string): string {
  return RECORD_KEEPING_LABELS[preference] || humanizeSnakeCase(preference);
}

// ─── Funding everyday expense approach ────────────────────────────────────────

const EVERYDAY_EXPENSE_LABELS: Record<string, string> = {
  no_detailed_reimbursement: 'They do not expect everyday family life to become an exercise in tracking every small household expense.',
  reasonable_shared_okay: 'They are comfortable with reasonable expenses that may benefit the whole household where those costs help the family function well.',
  separate_tracking: 'They would prefer child-specific expenses to be tracked separately from general household costs.',
};

export function humanizeEverydayExpenseApproach(value: string): string {
  return EVERYDAY_EXPENSE_LABELS[value] || (value && !isLowInformationText(value) ? value : '');
}

// ─── Funding meaningful expense approach ──────────────────────────────────────

const MEANINGFUL_EXPENSE_LABELS: Record<string, string> = {
  resources_help_cover: 'They would want the resources they have left behind to help cover meaningful child-specific expenses — things like education, activities, and healthcare.',
  guardian_judgment: 'They would trust the guardian to use reasonable judgment about which child-specific expenses are meaningful.',
  trustee_decides: 'They would want the trustee to determine which expenses are covered based on the child\'s needs.',
};

export function humanizeMeaningfulExpenseApproach(value: string): string {
  return MEANINGFUL_EXPENSE_LABELS[value] || (value && !isLowInformationText(value) ? value : '');
}

// ─── Funding major household expense approach ─────────────────────────────────

const MAJOR_HOUSEHOLD_LABELS: Record<string, string> = {
  strongly_want_considered: 'They would strongly want these kinds of major adjustments to be considered and supported where the estate plan allows.',
  open_to_it: 'They would be open to supporting major adjustments if they become necessary.',
  not_anticipated: 'They did not specifically anticipate major household adjustments, but the overall funding philosophy still applies.',
};

export function humanizeMajorHouseholdApproach(value: string): string {
  return MAJOR_HOUSEHOLD_LABELS[value] || (value && !isLowInformationText(value) ? value : '');
}

// ─── Funding shared household benefit ─────────────────────────────────────────

const SHARED_BENEFIT_LABELS: Record<string, string> = {
  reasonable_shared_okay: 'They are comfortable with reasonable expenses that may benefit the whole household where those costs help the family function well.',
  separate_only: 'They would prefer resources to be used specifically for the children rather than for general household expenses.',
  generous_shared: 'They would want resources to generously support the whole guardian household, recognizing that the children benefit from a stable home.',
};

export function humanizeSharedBenefitPhilosophy(value: string): string {
  return SHARED_BENEFIT_LABELS[value] || (value && !isLowInformationText(value) ? value : '');
}

// ─── Funding overall approach ─────────────────────────────────────────────────

const OVERALL_APPROACH_LABELS: Record<string, string> = {
  majorExpensesOnly: 'help cover the major costs that come with expanding a household',
  shareIncrementalCosts: 'help cover the incremental costs of adding the children to the guardian household',
  generousHouseholdSupport: 'help make that transition easier for the whole household',
  custom: 'help support the guardian household in the way the parents have described',
  unsure: 'help support the guardian household, though the parents were still working out the details',
};

export function humanizeOverallApproach(value: string): string {
  return OVERALL_APPROACH_LABELS[value] || '';
}

// ─── Adult sibling role ───────────────────────────────────────────────────────

const SIBLING_ROLE_LABELS: Record<string, string> = {
  emotional_support: 'providing emotional support and a familiar presence',
  family_discussions: 'being part of family discussions about the children',
  practical_help: 'helping with practical day-to-day things',
  financial_support: 'contributing financially where possible',
  regular_sibling: 'remaining a regular and meaningful presence in the younger children\'s lives',
  other: 'being there in whatever way feels right',
};

export function humanizeSiblingRole(role: string): string {
  return SIBLING_ROLE_LABELS[role] || humanizeSnakeCase(role);
}

const SIBLING_NOT_RESPONSIBLE_LABELS: Record<string, string> = {
  primary_caregiver: 'being a primary caregiver or replacement parent',
  managing_finances: 'managing the children\'s finances',
  providing_housing: 'providing housing for the children',
  medical_decisions: 'making medical decisions',
  career_sacrifice: 'sacrificing their own career to care for the children',
};

export function humanizeSiblingNotResponsible(items: string[]): string[] {
  return items.map(r => SIBLING_NOT_RESPONSIBLE_LABELS[r] || humanizeSnakeCase(r));
}

// ─── Trust type ───────────────────────────────────────────────────────────────

const TRUST_TYPE_LABELS: Record<string, string> = {
  discretionary_trust: 'a discretionary trust',
  bare_trust: 'a bare trust',
  family_trust: 'a family trust',
  alter_ego_trust: 'an alter ego trust',
  spousal_trust: 'a spousal trust',
  testamentary_trust: 'a testamentary trust',
  disabled_person_trust: 'a trust for persons with disabilities',
};

export function humanizeTrustType(type: string): string {
  return TRUST_TYPE_LABELS[type] || humanizeSnakeCase(type);
}

// ─── Financial resource type ──────────────────────────────────────────────────

const FINANCIAL_TYPE_LABELS: Record<string, string> = {
  life_insurance: 'Life Insurance',
  resp: 'RESP (Registered Education Savings Plan)',
  rdsp: 'RDSP (Registered Disability Savings Plan)',
  trust: 'Trust',
  savings: 'Savings',
  investment: 'Investments',
  pension: 'Pension',
};

export function humanizeFinancialType(type: string): string {
  return FINANCIAL_TYPE_LABELS[type] || humanizeSnakeCase(type);
}

// ─── Fallback: snake_case to readable ─────────────────────────────────────────

export function humanizeSnakeCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toLowerCase())
    .replace(/^\w/, c => c.toUpperCase());
}

// ─── Low-information text detection ───────────────────────────────────────────

const LOW_INFO_PATTERNS = [
  /^(n\/?a)$/i,
  /^(same as above)$/i,
  /^(already entered)$/i,
  /^(nothing)$/i,
  /^(see above)$/i,
  /^(none)$/i,
  /^(nothing to add)$/i,
  /^(i'?ve already entered this\.?)$/i,
];

export function isLowInformationText(text: string | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;
  return LOW_INFO_PATTERNS.some(p => p.test(trimmed));
}

// ─── Document QA sanitization ─────────────────────────────────────────────────

const SNAKE_CASE_PATTERN = /[a-z]+_[a-z]+/;
const JSON_PATTERN = /^\[{|^{|"name"\s*:/;
const RAW_ID_PATTERN = /^(pp_|conn_|nb_|child_)/;

export interface QaFinding {
  severity: 'blocking' | 'warning';
  path: string;
  issue: string;
  sample: string;
}

// Known enum values that must never appear in human-facing text
const KNOWN_ENUM_VALUES = [
  'playdates_visits', 'weekend_visits', 'sleepovers', 'shared_activity',
  'camp_together', 'birthdays_occasions', 'video_calls', 'gaming_online',
  'contact_friend_parents', 'regular_sibling', 'club_activity',
  'keep_simple', 'detailed_tracking', 'trustee_manages',
  'no_detailed_reimbursement', 'resources_help_cover', 'strongly_want_considered',
  'reasonable_shared_okay', 'separate_tracking', 'guardian_judgment',
  'trustee_decides', 'not_anticipated', 'separate_only', 'generous_shared',
  'career_sacrifice', 'emotional_support', 'family_discussions',
  'practical_help', 'financial_support', 'primary_caregiver',
  'managing_finances', 'providing_housing', 'medical_decisions',
  'best_friend', 'camp_friend', 'family_member', 'extended_family',
  'community_program', 'family_gatherings', 'close_friend',
  'community_group', 'discretionary_trust', 'bare_trust', 'family_trust',
  'alter_ego_trust', 'spousal_trust', 'testamentary_trust',
  'disabled_person_trust', 'fully_independent', 'mostly_independent',
  'needs_significant_support', 'not_sure', 'existing_connection',
];

const SNAKE_CASE_ALLOWLIST = new Set([
  'ad_hoc', 'per_se', 'ex_gratia', 'pro_rata',
]);

function findEmbeddedEnums(text: string): string[] {
  const found: string[] = [];
  const matches = text.match(/[a-z]+_[a-z_]+/g);
  if (matches) {
    for (const m of matches) {
      if (SNAKE_CASE_ALLOWLIST.has(m)) continue;
      if (KNOWN_ENUM_VALUES.includes(m)) {
        found.push(m);
      } else if (m.length < 40 && !m.includes(' ')) {
        found.push(m);
      }
    }
  }
  return found;
}

export function sanitizeClarifyDocument(doc: {
  sections: { id: string; heading: string; blocks: { type: string; text?: string; title?: string; items?: string[]; heading?: string; rows?: { role: string; person: string; responsibility: string; whenToContact?: string }[] }[] }[];
  quickReference?: { label: string; value: string }[];
}): QaFinding[] {
  const findings: QaFinding[] = [];

  const checkText = (text: string | undefined, path: string) => {
    if (!text) return;

    const embeddedEnums = findEmbeddedEnums(text);
    for (const e of embeddedEnums) {
      findings.push({ severity: 'blocking', path, issue: 'Raw enum value detected in text', sample: e });
    }

    if (JSON_PATTERN.test(text) || text.includes('[{') || text.includes('"name":')) {
      findings.push({ severity: 'blocking', path, issue: 'Serialized JSON detected', sample: text.substring(0, 80) });
    }

    if (/\b(pp_|conn_|nb_|child_|et_|fdm_)/.test(text)) {
      findings.push({ severity: 'blocking', path, issue: 'Internal ID prefix detected', sample: text.substring(0, 80) });
    }

    if (/\btrue\b|\bfalse\b/.test(text) && text.length < 20) {
      findings.push({ severity: 'warning', path, issue: 'Raw boolean value detected', sample: text });
    }

    if (/\bundefined\b|\bnull\b|\bNaN\b|\[object Object\]/.test(text)) {
      findings.push({ severity: 'blocking', path, issue: 'Implementation value detected', sample: text.substring(0, 80) });
    }

    if (findBadFallbacks(text)) {
      findings.push({ severity: 'blocking', path, issue: 'Bad display fallback detected', sample: text.substring(0, 80) });
    }

    if (text.length > 100) {
      const dupes = findDuplicateClauses(text);
      if (dupes.length > 0) {
        findings.push({ severity: 'warning', path, issue: 'Duplicate clause detected', sample: dupes[0].substring(0, 80) });
      }
    }

    if (/\.\s*\./.test(text) || /\?\s*\?/.test(text) || /!\s*!/.test(text)) {
      findings.push({ severity: 'warning', path, issue: 'Duplicate punctuation detected', sample: text.substring(0, 80) });
    }
  };

  for (const section of doc.sections) {
    checkText(section.heading, `${section.id}.heading`);
    for (const block of section.blocks) {
      checkText(block.text, `${section.id}.${block.type}.text`);
      checkText(block.title, `${section.id}.${block.type}.title`);
      checkText(block.heading, `${section.id}.${block.type}.heading`);
      if (block.items) {
        for (const item of block.items) {
          checkText(item, `${section.id}.${block.type}.items`);
        }
      }
      if (block.rows) {
        for (const row of block.rows) {
          checkText(row.role, `${section.id}.${block.type}.rows.role`);
          checkText(row.person, `${section.id}.${block.type}.rows.person`);
          checkText(row.responsibility, `${section.id}.${block.type}.rows.responsibility`);
          checkText(row.whenToContact, `${section.id}.${block.type}.rows.whenToContact`);
        }
      }
    }
  }

  if (doc.quickReference) {
    for (const qr of doc.quickReference) {
      checkText(qr.value, `quickRef.${qr.label}`);
      checkText(qr.label, `quickRef.${qr.label}.label`);
    }
  }

  return findings;
}

export function hasBlockingFindings(findings: QaFinding[]): boolean {
  return findings.some(f => f.severity === 'blocking');
}

// ─── Document location normalization ──────────────────────────────────────────

export function normalizeLocation(loc: string): string {
  return loc
    .toLowerCase()
    .replace(/^(our|the|my|their)\s+/, '')
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')
    .trim();
}

// ─── Punctuation normalization ────────────────────────────────────────────────

export function normalizePunctuation(text: string): string {
  if (!text) return text;
  return text
    .replace(/\.\s*\.\s*\./g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,{2,}/g, ',')
    .replace(/\s+;/g, ';')
    .trim();
}

// ─── Activity frequency humanization ──────────────────────────────────────────

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'each week',
  'twice per week': 'twice each week',
  twice_per_week: 'twice each week',
  twice_weekly: 'twice each week',
  biweekly: 'every two weeks',
  monthly: 'each month',
  daily: 'every day',
  weekdays: 'on weekdays',
  weekends: 'on weekends',
  saturdays: 'on Saturdays',
  sundays: 'on Sundays',
  mondays: 'on Mondays',
  fridays: 'on Fridays',
  occasionally: 'occasionally',
  seasonally: 'in season',
  yearly: 'each year',
  annually: 'each year',
};

export function humanizeFrequency(frequency: string): string {
  if (!frequency) return '';
  const lower = frequency.toLowerCase().trim().replace(/[.,;]+$/, '').trim();
  const label = FREQUENCY_LABELS[lower];
  if (label) return label;
  if (/once\s+a\s+week/i.test(frequency)) return 'each week';
  if (/once\s+a\s+month/i.test(frequency)) return 'each month';
  if (/every\s+other\s+week/i.test(frequency)) return 'every two weeks';
  if (/twice\s+a\s+week/i.test(frequency)) return 'twice each week';
  if (/twice\s+per\s+week/i.test(frequency)) return 'twice each week';
  if (/^[a-z_]+$/i.test(lower) || /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(frequency)) {
    return '';
  }
  return lower;
}

// ─── Duplicate clause detection ───────────────────────────────────────────────

const BAD_FALLBACK_PATTERNS = [
  /:\s*other\s*$/i,
  /by\s+Regular sibling\s*\.?$/i,
  /:\s*Club activity\s*$/i,
  /:\s*Existing connection\s*$/i,
  /Future caregiver consideration:\s*other\s*$/i,
];

export function findBadFallbacks(text: string): boolean {
  return BAD_FALLBACK_PATTERNS.some(p => p.test(text));
}

export function findDuplicateClauses(text: string): string[] {
  const duplicates: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>();
  for (const s of sentences) {
    const norm = s.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    if (norm.split(/\s+/).length >= 6) {
      if (seen.has(norm)) {
        duplicates.push(s.substring(0, 80));
      }
      seen.add(norm);
    }
  }
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  for (let len = 8; len <= 12; len++) {
    for (let i = 0; i + len * 2 <= words.length; i++) {
      const phrase = words.slice(i, i + len).join(' ');
      if (phrase.length < 30) continue;
      const rest = words.slice(i + len).join(' ');
      if (rest.includes(phrase)) {
        duplicates.push(phrase);
      }
    }
  }
  return Array.from(new Set(duplicates));
}
