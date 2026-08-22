/**
 * Guardianship Audience Composer
 *
 * Turns a GuardianshipNarrativeModel into audience-specific document plans.
 *
 * ONE TRUTH, MULTIPLE USEFUL VIEWS.
 *
 * The Composer:
 *   - selects relevant blocks via relevance routing + rule-level filtering
 *   - orders and groups them into audience-specific sections
 *   - omits irrelevant material (dynamic omission)
 *   - controls repetition (full explanation once + cross-reference elsewhere)
 *   - preserves evidence, limitations, and parent voice on every block
 *   - never reads questionnaire answers directly
 *
 * The Composer does NOT:
 *   - interpret raw questionnaire answers
 *   - invent new conclusions
 *   - change evidence types
 *   - resolve legal uncertainty
 *   - design the final PDF
 */

import type {
  GuardianshipNarrativeModel,
  NarrativeBlock,
  GuardianshipChildNarrative,
  GuardianshipAudience,
  NarrativeImportance,
  ImmediateActionNarrative,
  QuickReferenceItem,
} from './guardianshipNarrativeTypes';
import type {
  ClarifyReviewItem,
  VerificationType,
} from './outputConfidenceTypes';

// ─── Audience Document Contract ──────────────────────────────────────────────

export interface AudienceDocumentMetadata {
  familyName?: string;
  generatedAt?: string;
  sourceModelVersion?: string;
}

export interface ChildSubsectionGroup {
  heading: string;
  blocks: NarrativeBlock[];
}

export interface ChildSection {
  childId: string;
  childName: string;
  subsections: ChildSubsectionGroup[];
}

export interface RoleTableRow {
  role: string;
  person: string;
  responsibility: string;
  appointed?: boolean;
}

export interface GuardianshipAudienceSection {
  id: string;
  heading: string;
  purpose?: string;
  priority: NarrativeImportance;
  blocks: NarrativeBlock[];
  childIds?: string[];
  childSections?: ChildSection[];
  collapsibleInUI?: boolean;
  roleTableRows?: RoleTableRow[];
}

export interface GuardianshipAudienceDocument {
  audience: GuardianshipAudience;
  title: string;
  purpose: string;
  sections: GuardianshipAudienceSection[];
  quickReference?: QuickReferenceItem[];
  reviewItems?: ClarifyReviewItem[];
  limitations?: ClarifyReviewItem[];
  metadata?: AudienceDocumentMetadata;
}

// ─── Section Blueprint ────────────────────────────────────────────────────────
//
// A blueprint declares what a section should contain. The composer resolves
// each blueprint against the filtered narrative and omits sections that end
// up empty (dynamic omission).

type ChildSubsection =
  | 'introduction'
  | 'education'
  | 'healthcare'
  | 'supportTransition'
  | 'peopleAndConnections'
  | 'activities'
  | 'communitiesAndTraditions'
  | 'inheritance'
  | 'adultTransition'
  | 'futureEducation';

type SectionSource =
  | { area: 'familyContext' }
  | { area: 'guardianPlan' }
  | { area: 'familyRoles' }
  | { area: 'financialResources' }
  | { area: 'fundingPhilosophy' }
  | { area: 'coordination' }
  | { area: 'documents' }
  | { area: 'guardianTrust' }
  | { area: 'familyFairness' }
  | { area: 'guardianDiscretion' }
  | { area: 'conversationPrompts' }
  | { area: 'readiness'; subsection: 'decisionsMade' | 'thingsWorthConfirming' | 'thingsStillToDo' }
  | { area: 'children'; subsection?: ChildSubsection; perChild?: boolean }
  | { area: 'immediateActions' };

interface SectionBlueprint {
  id: string;
  heading: string;
  purpose?: string;
  priority: NarrativeImportance;
  sources: SectionSource[];
  includeRules?: string[];
  excludeRules?: string[];
  includeTypes?: NarrativeBlock['type'][];
  excludeTypes?: NarrativeBlock['type'][];
  maxActions?: number;
  childIds?: string[];
  collapsibleInUI?: boolean;
  perChild?: boolean;
  customBuilder?: 'atAGlance' | 'timeHorizonActions' | 'whoDoesWhat' | 'financialCoordination';
  skipRepetitionControl?: boolean;
}

// ─── Relevance Routing ────────────────────────────────────────────────────────

/**
 * Determine whether a narrative block is relevant to a given audience.
 *
 * Routing considers:
 *   1. Explicit audience tags (if present, they are authoritative)
 *   2. Block type + importance
 *   3. Evidence type / limitation reviewer routing
 *   4. Privacy / need-to-know
 */
export function isNarrativeRelevantToAudience(
  block: NarrativeBlock,
  audience: GuardianshipAudience
): boolean {
  if (block.audiences && block.audiences.length > 0) {
    return block.audiences.includes(audience);
  }

  if (audience === 'client' || audience === 'guardian') {
    return true;
  }

  if (audience === 'estateLawyer') {
    return hasProfessionalReviewRouting(block, 'estateLawyer', 'lawyer');
  }

  if (audience === 'accountant') {
    return hasProfessionalReviewRouting(block, 'accountant');
  }

  if (audience === 'estateTrustee' || audience === 'inheritanceTrustee' || audience === 'attorneyForProperty') {
    return block.type === 'crossReference'
      || block.sourceType === 'professionalReview'
      || !!block.limitation;
  }

  return false;
}

function hasProfessionalReviewRouting(
  block: NarrativeBlock,
  ...reviewerTypes: VerificationType[]
): boolean {
  if (block.limitation?.reviewerType && reviewerTypes.includes(block.limitation.reviewerType)) {
    return true;
  }
  if (block.evidence?.verificationType && reviewerTypes.includes(block.evidence.verificationType)) {
    return true;
  }
  if (block.nextAction?.description) {
    const desc = block.nextAction.description.toLowerCase();
    if (reviewerTypes.includes('estateLawyer') || reviewerTypes.includes('lawyer')) {
      if (desc.includes('lawyer') || desc.includes('estate') || desc.includes('legal')) return true;
    }
    if (reviewerTypes.includes('accountant')) {
      if (desc.includes('accountant') || desc.includes('tax') || desc.includes('financial')) return true;
    }
  }
  return false;
}

// ─── Repetition Control ───────────────────────────────────────────────────────

interface RepetitionTracker {
  explained: Set<string>;
  explainedRulesBySection: Map<string, Set<string>>;
  currentSectionId: string | null;
}

function createRepetitionTracker(): RepetitionTracker {
  return { explained: new Set(), explainedRulesBySection: new Map(), currentSectionId: null };
}

function applyRepetitionControl(
  block: NarrativeBlock,
  tracker: RepetitionTracker
): NarrativeBlock {
  if (
    tracker.currentSectionId
    && block.importance !== 'primary'
    && block.type !== 'parentVoice'
  ) {
    let explainedElsewhere = false;
    for (const [sectionId, rules] of tracker.explainedRulesBySection) {
      if (sectionId !== tracker.currentSectionId && rules.has(block.ruleId)) {
        explainedElsewhere = true;
        break;
      }
    }

    if (explainedElsewhere) {
      return {
        ...block,
        type: 'crossReference',
        body: block.heading
          ? `See "${block.heading}" above for details.`
          : 'See above for details.',
        bullets: undefined,
        importance: 'reference',
      };
    }
  }

  if (block.importance === 'primary' || block.importance === 'important') {
    tracker.explained.add(block.id);
    if (tracker.currentSectionId) {
      let rules = tracker.explainedRulesBySection.get(tracker.currentSectionId);
      if (!rules) {
        rules = new Set();
        tracker.explainedRulesBySection.set(tracker.currentSectionId, rules);
      }
      rules.add(block.ruleId);
    }
  }

  return block;
}

// ─── Block Integrity Preservation ─────────────────────────────────────────────

function preserveBlockIntegrity(block: NarrativeBlock): NarrativeBlock {
  return {
    ...block,
    evidence: block.evidence,
    limitation: block.limitation,
    nextAction: block.nextAction,
    sourceType: block.sourceType,
    ruleId: block.ruleId,
  };
}

// ─── Blueprint Filtering ──────────────────────────────────────────────────────

function passesBlueprintFilters(
  block: NarrativeBlock,
  blueprint: SectionBlueprint
): boolean {
  if (blueprint.includeRules && !blueprint.includeRules.includes(block.ruleId)) return false;
  if (blueprint.excludeRules && blueprint.excludeRules.includes(block.ruleId)) return false;
  if (blueprint.includeTypes && !blueprint.includeTypes.includes(block.type)) return false;
  if (blueprint.excludeTypes && blueprint.excludeTypes.includes(block.type)) return false;
  return true;
}

// ─── Custom Section Builders ──────────────────────────────────────────────────

function buildAtAGlanceSection(
  blueprint: SectionBlueprint,
  narrative: GuardianshipNarrativeModel,
  audience: GuardianshipAudience,
  tracker: RepetitionTracker,
  roadmapModel?: unknown
): GuardianshipAudienceSection | null {
  const blocks: NarrativeBlock[] = [];
  const rm = roadmapModel as {
    children: { childId: string; name: string; nickname: string; status: string; age?: number; planningFocus?: string }[];
    guardianAssignments: { childIds: string[]; childNames: string[]; guardianPeople: { name: string }[]; alternatePeople: { name: string }[]; moveStatus?: string; guardianCommunity?: string }[];
    readiness: { thingsWorthConfirming: string[] };
  } | undefined;

  if (!rm) return null;

  // 1. Children summary — all children with concise status
  for (const child of rm.children) {
    const displayName = child.nickname || child.name;
    const ageStr = child.age !== undefined ? ` — age ${child.age}` : '';
    let statusLine = '';
    if (child.status === 'minor') {
      const hasSupport = child.planningFocus && child.planningFocus !== 'Minor';
      statusLine = hasSupport ? `Minor child with additional ongoing support needs.` : 'Minor child.';
    } else if (child.status === 'adult_independent') {
      statusLine = 'Financially independent adult child.';
    } else {
      statusLine = 'Adult child.';
    }
    blocks.push({
      id: `ataglance_child_${child.childId}`,
      ruleId: 'GUARDIAN-01',
      type: 'context',
      importance: 'primary',
      sourceType: 'knownFact',
      heading: `${displayName}${ageStr}`,
      body: statusLine,
    });
  }

  // 2. Guardian summary — concise, no narrative repetition
  for (const assignment of rm.guardianAssignments) {
    const childLabel = assignment.childNames.length > 1
      ? assignment.childNames.join(' and ')
      : assignment.childNames[0];
    const guardianName = assignment.guardianPeople.map(p => p.name).join(' and ');
    blocks.push({
      id: `ataglance_guardian_${assignment.childIds.join('_')}`,
      ruleId: 'GUARDIAN-01',
      type: 'context',
      importance: 'primary',
      sourceType: 'parentPreference',
      heading: 'Intended Guardian',
      body: `${guardianName} — for ${childLabel}.`,
    });
    if (assignment.alternatePeople.length > 0) {
      blocks.push({
        id: `ataglance_alt_${assignment.childIds.join('_')}`,
        ruleId: 'GUARDIAN-04',
        type: 'context',
        importance: 'important',
        sourceType: 'parentPreference',
        heading: 'Alternate Guardian',
        body: assignment.alternatePeople.map(p => p.name).join(' and '),
      });
    }
    if (assignment.moveStatus === 'likely' || assignment.moveStatus === 'possible') {
      blocks.push({
        id: `ataglance_move_${assignment.childIds.join('_')}`,
        ruleId: 'MOVE-01',
        type: 'context',
        importance: 'important',
        sourceType: 'derived',
        heading: 'Likely Move',
        body: assignment.guardianCommunity || 'To the guardian\'s community.',
      });
    }
  }

  // 3. Additional support needs flag
  const childrenWithSupport = rm.children.filter(c => c.status === 'minor' && c.planningFocus && c.planningFocus !== 'Minor');
  if (childrenWithSupport.length > 0) {
    blocks.push({
      id: 'ataglance_support',
      ruleId: 'HEALTH-01',
      type: 'context',
      importance: 'important',
      sourceType: 'knownFact',
      heading: 'Additional Support Needs',
      body: `${childrenWithSupport.map(c => c.nickname || c.name).join(' and ')} ${childrenWithSupport.length === 1 ? 'has' : 'have'} additional ongoing support needs. See the child-specific sections for detail.`,
    });
  }

  // 4. Things worth confirming (concise, material items only)
  const confirmations = (rm.readiness?.thingsWorthConfirming || []).slice(0, 3);
  if (confirmations.length > 0) {
    blocks.push({
      id: 'ataglance_confirm',
      ruleId: 'READINESS-02',
      type: 'readiness',
      importance: 'important',
      sourceType: 'professionalReview',
      heading: 'Things Worth Confirming',
      bullets: confirmations,
    });
  }

  if (blocks.length === 0) return null;

  // Apply repetition control
  const processedBlocks = blocks.map(b => {
    const controlled = applyRepetitionControl(b, tracker);
    return preserveBlockIntegrity(controlled);
  });

  return {
    id: blueprint.id,
    heading: blueprint.heading,
    purpose: blueprint.purpose,
    priority: blueprint.priority,
    blocks: processedBlocks,
    collapsibleInUI: blueprint.collapsibleInUI,
  };
}

// ─── Who Does What? Custom Builder ─────────────────────────────────────────────

function buildWhoDoesWhatSection(
  blueprint: SectionBlueprint,
  _narrative: GuardianshipNarrativeModel,
  _audience: GuardianshipAudience,
  _tracker: RepetitionTracker,
  roadmapModel?: unknown
): GuardianshipAudienceSection | null {
  const rm = roadmapModel as {
    guardianAssignments: { childIds: string[]; childNames: string[]; guardianPeople: { name: string }[]; isHousehold?: boolean; alternatePeople?: { name: string }[] }[];
    estateTrustees: { clientName: string; primaryTrustee?: { name: string } }[];
    children: { childId: string; name: string; nickname: string; inheritanceByClient: { trusteeName?: string; clientName: string }[] }[];
    financialResources: { type: string; exists: boolean; childNames: string[] }[];
    professionalContacts?: { id: string; name: string; role: string; type: string; firm?: string; phone?: string; email?: string; isAppointedRole: false }[];
  } | undefined;

  if (!rm) return null;

  const rows: RoleTableRow[] = [];
  const hasEstateTrustee = rm.estateTrustees.some(et => et.primaryTrustee?.name);

  // Guardian — formally appointed (parent preference, confirmed in Will or not)
  for (const assignment of rm.guardianAssignments) {
    if (!assignment.guardianPeople.length) continue;
    const guardianName = assignment.guardianPeople.map(p => p.name).join(' and ');
    const childLabel = assignment.childNames.length > 1
      ? assignment.childNames.join(' and ')
      : assignment.childNames[0];
    rows.push({
      role: 'Guardian',
      person: guardianName,
      responsibility: `Day-to-day parenting and care for ${childLabel}.`,
      appointed: true,
    });
    // Alternate Guardian
    if (assignment.alternatePeople && assignment.alternatePeople.length > 0) {
      const altName = assignment.alternatePeople.map(p => p.name).join(' and ');
      rows.push({
        role: 'Alternate Guardian',
        person: altName,
        responsibility: `Steps in if the primary guardian cannot serve for ${childLabel}.`,
        appointed: true,
      });
    }
  }

  // Estate Trustee — formally appointed (from Will data)
  if (hasEstateTrustee) {
    for (const et of rm.estateTrustees) {
      if (et.primaryTrustee?.name) {
        rows.push({
          role: 'Estate Trustee',
          person: et.primaryTrustee.name,
          responsibility: `Administration of ${et.clientName}'s estate and trust funds.`,
          appointed: true,
        });
      }
    }
  } else {
    // No Estate Trustee identified — flag as unresolved
    rows.push({
      role: 'Estate Trustee — Confirm from Will',
      person: '—',
      responsibility: 'The Estate Trustee should be confirmed from the current Will. This appointment should be verified before relying on this Roadmap.',
      appointed: false,
    });
  }

  // Inheritance Trustee — where explicitly identified
  const seenTrustees = new Set<string>();
  for (const child of rm.children) {
    for (const record of child.inheritanceByClient) {
      if (record.trusteeName && !seenTrustees.has(record.trusteeName)) {
        seenTrustees.add(record.trusteeName);
        rows.push({
          role: 'Inheritance Trustee',
          person: record.trusteeName,
          responsibility: `Managing inheritance funds for ${child.nickname || child.name} per ${record.clientName}'s Will.`,
          appointed: true,
        });
      }
    }
  }

  // Financial resources flags — RESP, RDSP, insurance, trust
  for (const fr of rm.financialResources.filter(r => r.exists)) {
    let role = '';
    let responsibility = '';
    if (fr.type === 'resp') {
      role = 'RESP';
      responsibility = `Registered education savings plan${fr.childNames.length > 0 ? ` for ${fr.childNames.join(' and ')}` : ''}.`;
    } else if (fr.type === 'rdsp') {
      role = 'RDSP';
      responsibility = `Registered disability savings plan${fr.childNames.length > 0 ? ` for ${fr.childNames.join(' and ')}` : ''}.`;
    } else if (fr.type === 'life_insurance' || fr.type === 'insurance') {
      role = 'Life Insurance';
      responsibility = `Insurance coverage identified${fr.childNames.length > 0 ? ` relating to ${fr.childNames.join(' and ')}` : ''}.`;
    } else if (fr.type === 'trust') {
      role = 'Trust';
      responsibility = `Trust arrangement identified${fr.childNames.length > 0 ? ` for ${fr.childNames.join(' and ')}` : ''}.`;
    }
    if (role) {
      rows.push({
        role,
        person: '—',
        responsibility,
        appointed: false,
      });
    }
  }

  // Professional contacts — NOT appointed roles, may assist
  if (rm.professionalContacts && rm.professionalContacts.length > 0) {
    for (const pc of rm.professionalContacts) {
      rows.push({
        role: pc.role,
        person: pc.name,
        responsibility: `Professional contact who may assist with ${pc.role === 'Financial Advisor' ? 'investment and financial information' : pc.role === 'Estate Lawyer' ? 'legal and estate matters' : pc.role === 'Accountant' ? 'tax and accounting matters' : pc.role === 'Insurance Advisor' ? 'insurance matters' : 'professional matters'}.`,
        appointed: false,
      });
    }
  }

  if (rows.length === 0) return null;

  return {
    id: blueprint.id,
    heading: blueprint.heading,
    purpose: blueprint.purpose,
    priority: blueprint.priority,
    blocks: [],
    roleTableRows: rows,
    collapsibleInUI: blueprint.collapsibleInUI,
  };
}

// ─── Financial Coordination Custom Builder ─────────────────────────────────────

function buildFinancialCoordinationSection(
  blueprint: SectionBlueprint,
  _narrative: GuardianshipNarrativeModel,
  _audience: GuardianshipAudience,
  _tracker: RepetitionTracker,
  roadmapModel?: unknown
): GuardianshipAudienceSection | null {
  const rm = roadmapModel as {
    guardianAssignments: { childIds: string[]; childNames: string[]; guardianPeople: { name: string }[] }[];
    estateTrustees: { clientName: string; primaryTrustee?: { name: string } }[];
    children: { childId: string; name: string; nickname: string; inheritanceByClient: { trusteeName?: string; clientName: string; inheritanceType?: string }[] }[];
    financialResources: { type: string; exists: boolean; childNames: string[] }[];
    fundingPhilosophy?: { notes?: string };
  } | undefined;

  if (!rm) return null;

  const blocks: NarrativeBlock[] = [];
  const items: string[] = [];

  // Estate Trustee
  for (const et of rm.estateTrustees) {
    if (et.primaryTrustee?.name) {
      items.push(`${et.primaryTrustee.name} is identified as ${et.clientName}'s Estate Trustee and would be responsible for administering the estate.`);
    }
  }

  // Inheritance trustees
  const seenTrustees = new Set<string>();
  for (const child of rm.children) {
    for (const record of child.inheritanceByClient) {
      if (record.trusteeName && !seenTrustees.has(record.trusteeName)) {
        seenTrustees.add(record.trusteeName);
        items.push(`${record.trusteeName} is identified as the trustee for ${child.nickname || child.name}'s inheritance under ${record.clientName}'s Will.`);
      }
    }
  }

  // Financial resources — RESP, RDSP, insurance, trust
  for (const fr of rm.financialResources.filter(r => r.exists)) {
    if (fr.type === 'resp') {
      items.push(`An RESP has been identified${fr.childNames.length > 0 ? ` for ${fr.childNames.join(' and ')}` : ''}.`);
    } else if (fr.type === 'rdsp') {
      items.push(`An RDSP has been identified${fr.childNames.length > 0 ? ` for ${fr.childNames.join(' and ')}` : ''}.`);
    } else if (fr.type === 'life_insurance' || fr.type === 'insurance') {
      items.push(`Life insurance has been identified${fr.childNames.length > 0 ? ` that may relate to ${fr.childNames.join(' and ')}` : ''}.`);
    } else if (fr.type === 'trust') {
      items.push(`A trust arrangement has been identified${fr.childNames.length > 0 ? ` for ${fr.childNames.join(' and ')}` : ''}.`);
    }
  }

  // Guardian ≠ Estate Trustee distinction with named coordination
  const guardianNames = rm.guardianAssignments
    .flatMap(a => a.guardianPeople.map(p => p.name));
  const guardianLabel = guardianNames.length > 0 ? guardianNames.join(' and ') : 'The Guardian';
  const trusteeNames = rm.estateTrustees
    .map(et => et.primaryTrustee?.name)
    .filter(Boolean) as string[];
  const guardianIsTrustee = guardianNames.some(gn => trusteeNames.includes(gn));
  if (guardianNames.length > 0 && trusteeNames.length > 0 && !guardianIsTrustee) {
    items.push(`The Guardian and the Estate Trustee are different people. The Guardian handles day-to-day parenting; the Estate Trustee handles the financial and estate administration. For financial matters, ${guardianLabel} should coordinate with ${trusteeNames.join(' and ')}, the Estate Trustee.`);
  } else if (guardianNames.length > 0 && trusteeNames.length === 0) {
    items.push(`For financial matters, ${guardianLabel} should coordinate with the Estate Trustee identified in the current Will. That appointment should be confirmed before relying on this Roadmap.`);
  }

  if (items.length === 0) return null;

  blocks.push({
    id: 'fincoord_overview',
    ruleId: 'FUNDING-01',
    type: 'context',
    importance: 'important',
    sourceType: 'knownFact',
    heading: '',
    body: 'This section explains the financial architecture — who controls or coordinates funds, and what financial resources have been identified. It is not a balance sheet, and does not include account numbers.',
  });

  blocks.push({
    id: 'fincoord_items',
    ruleId: 'FUNDING-01',
    type: 'summary',
    importance: 'primary',
    sourceType: 'knownFact',
    heading: '',
    body: '',
    bullets: items,
  });

  blocks.push({
    id: 'fincoord_note',
    ruleId: 'FUNDING-01',
    type: 'context',
    importance: 'important',
    sourceType: 'professionalReview',
    heading: '',
    body: trusteeNames.length > 0
      ? `Whether specific funds will be available, and in what amount, depends on the estate plan, the Will, and professional advice. For financial matters, ${guardianLabel} should coordinate with ${trusteeNames.join(' and ')}, the Estate Trustee.`
      : 'Whether specific funds will be available, and in what amount, depends on the estate plan, the Will, and professional advice. The Guardian should coordinate with the Estate Trustee identified in the current Will. That appointment should be confirmed before relying on this Roadmap.',
    limitation: {
      message: 'This overview identifies the financial architecture only. It does not confirm that any particular fund will be available.',
      importance: 'professionalReview',
      reviewerType: 'estateLawyer',
    },
  });

  return {
    id: blueprint.id,
    heading: blueprint.heading,
    purpose: blueprint.purpose,
    priority: blueprint.priority,
    blocks,
    collapsibleInUI: blueprint.collapsibleInUI,
  };
}

// ─── Dynamic Omission ─────────────────────────────────────────────────────────

function resolveSection(
  blueprint: SectionBlueprint,
  narrative: GuardianshipNarrativeModel,
  audience: GuardianshipAudience,
  tracker: RepetitionTracker,
  roadmapModel?: unknown
): GuardianshipAudienceSection | null {
  tracker.currentSectionId = blueprint.id;

  if (blueprint.customBuilder === 'atAGlance') {
    return buildAtAGlanceSection(blueprint, narrative, audience, tracker, roadmapModel);
  }

  if (blueprint.customBuilder === 'whoDoesWhat') {
    return buildWhoDoesWhatSection(blueprint, narrative, audience, tracker, roadmapModel);
  }

  if (blueprint.customBuilder === 'financialCoordination') {
    return buildFinancialCoordinationSection(blueprint, narrative, audience, tracker, roadmapModel);
  }

  if (blueprint.perChild) {
    return resolvePerChildSection(blueprint, narrative, audience, tracker);
  }

  const blocks: NarrativeBlock[] = [];

  for (const source of blueprint.sources) {
    const sourceBlocks = extractBlocks(narrative, source, blueprint);
    for (const block of sourceBlocks) {
      if (!isNarrativeRelevantToAudience(block, audience)) continue;
      if (!passesBlueprintFilters(block, blueprint)) continue;
      if (blueprint.childIds && block.childIds) {
        if (!block.childIds.some(id => blueprint.childIds!.includes(id))) continue;
      }
      const controlled = blueprint.skipRepetitionControl ? block : applyRepetitionControl(block, tracker);
      blocks.push(preserveBlockIntegrity(controlled));
    }
  }

  if (blocks.length === 0) return null;

  return {
    id: blueprint.id,
    heading: blueprint.heading,
    purpose: blueprint.purpose,
    priority: blueprint.priority,
    blocks,
    childIds: blueprint.childIds,
    collapsibleInUI: blueprint.collapsibleInUI,
  };
}

const CHILD_SUBSECTION_HEADINGS: Record<ChildSubsection, string> = {
  introduction: 'Who {childName} Is',
  education: 'Education & School Transition',
  healthcare: 'Healthcare & Care Transition',
  supportTransition: 'Transition of Supports',
  peopleAndConnections: 'People & Connections',
  activities: 'Activities',
  communitiesAndTraditions: 'Communities / Activities / Traditions',
  inheritance: 'Inheritance',
  adultTransition: 'Looking Ahead',
  futureEducation: 'Looking Ahead: Education',
};

function resolvePerChildSection(
  blueprint: SectionBlueprint,
  narrative: GuardianshipNarrativeModel,
  audience: GuardianshipAudience,
  tracker: RepetitionTracker
): GuardianshipAudienceSection | null {
  const childSections: ChildSection[] = [];
  const allBlocks: NarrativeBlock[] = [];

  const subsectionOrder: ChildSubsection[] = blueprint.sources
    .map(s => s.area === 'children' ? s.subsection : undefined)
    .filter((s): s is ChildSubsection => s !== undefined);

  for (const child of narrative.children) {
    const subsections: ChildSubsectionGroup[] = [];

    for (const subsection of subsectionOrder) {
      const rawBlocks = child[subsection] || [];
      const filtered = rawBlocks
        .filter(b => isNarrativeRelevantToAudience(b, audience))
        .filter(b => passesBlueprintFilters(b, blueprint))
        .filter(b => {
          if (blueprint.childIds && b.childIds) {
            return b.childIds.some(id => blueprint.childIds!.includes(id));
          }
          return true;
        });

      if (filtered.length === 0) continue;

      const processed = filtered.map(b => {
        const controlled = applyRepetitionControl(b, tracker);
        return preserveBlockIntegrity(controlled);
      });

      const headingTemplate = CHILD_SUBSECTION_HEADINGS[subsection];
      const heading = headingTemplate.replace('{childName}', child.childName);
      subsections.push({ heading, blocks: processed });
      allBlocks.push(...processed);
    }

    // Semantic deduplication: if both 'activities' and 'communitiesAndTraditions'
    // subsections exist, merge them into one subsection and remove duplicate
    // activity names.
    const activitiesIdx = subsections.findIndex(s => s.heading === 'Activities');
    const communitiesIdx = subsections.findIndex(s => s.heading === 'Communities / Activities / Traditions');
    if (activitiesIdx >= 0 && communitiesIdx >= 0) {
      const seenHeadings = new Set<string>(
        subsections[communitiesIdx].blocks
          .map(b => b.heading)
          .filter((h): h is string => !!h)
      );
      const dedupedActivityBlocks = subsections[activitiesIdx].blocks.filter(b => {
        if (b.heading && seenHeadings.has(b.heading)) return false;
        if (b.heading) seenHeadings.add(b.heading);
        return true;
      });
      subsections[communitiesIdx].blocks.push(...dedupedActivityBlocks);
      subsections.splice(activitiesIdx, 1);
    }

    if (subsections.length > 0) {
      childSections.push({
        childId: child.childId,
        childName: child.childName,
        subsections,
      });
    }
  }

  if (childSections.length === 0) return null;

  return {
    id: blueprint.id,
    heading: blueprint.heading,
    purpose: blueprint.purpose,
    priority: blueprint.priority,
    blocks: allBlocks,
    childSections,
    collapsibleInUI: blueprint.collapsibleInUI,
  };
}

function extractBlocks(
  narrative: GuardianshipNarrativeModel,
  source: SectionSource,
  blueprint: SectionBlueprint
): NarrativeBlock[] {
  switch (source.area) {
    case 'familyContext':
      return narrative.familyContext;
    case 'guardianPlan':
      return narrative.guardianPlan;
    case 'familyRoles':
      return narrative.familyRoles;
    case 'financialResources':
      return narrative.financialResources;
    case 'fundingPhilosophy':
      return narrative.fundingPhilosophy;
    case 'coordination':
      return narrative.coordination;
    case 'documents':
      return narrative.documents;
    case 'guardianTrust':
      return narrative.guardianTrust;
    case 'familyFairness':
      return narrative.familyFairness;
    case 'guardianDiscretion':
      return narrative.guardianDiscretion;
    case 'conversationPrompts':
      return narrative.conversationPrompts;
    case 'readiness':
      return narrative.readiness[source.subsection];
    case 'immediateActions':
      return [];
    case 'children': {
      if (!source.subsection) {
        return narrative.children.flatMap(c => flattenChild(c));
      }
      if (source.perChild) {
        // Return all blocks from the specified subsection across all children
        return narrative.children.flatMap(c => c[source.subsection!] || []);
      }
      return narrative.children.flatMap(c => c[source.subsection!] || []);
    }
    default:
      return [];
  }
}

function flattenChild(child: GuardianshipChildNarrative): NarrativeBlock[] {
  return [
    ...(child.introduction || []),
    ...(child.education || []),
    ...(child.healthcare || []),
    ...(child.supportTransition || []),
    ...(child.peopleAndConnections || []),
    ...(child.activities || []),
    ...(child.communitiesAndTraditions || []),
    ...(child.inheritance || []),
    ...(child.adultTransition || []),
    ...(child.futureEducation || []),
  ];
}

// ─── Quick Reference Filtering ────────────────────────────────────────────────

function filterQuickReference(
  items: QuickReferenceItem[],
  audience: GuardianshipAudience
): QuickReferenceItem[] {
  switch (audience) {
    case 'client':
      return items;
    case 'guardian':
      return items.filter(i => i.category !== 'financial');
    case 'estateLawyer':
      return items.filter(i => i.category === 'document' || i.category === 'role');
    case 'accountant':
      return items.filter(i => i.category === 'financial' || i.category === 'document' || i.category === 'role');
    default:
      return items.filter(i => i.category === 'document' || i.category === 'role');
  }
}

// ─── Review Items & Limitations Filtering ─────────────────────────────────────

function filterReviewItems(
  items: ClarifyReviewItem[] | undefined,
  audience: GuardianshipAudience
): ClarifyReviewItem[] | undefined {
  if (!items || items.length === 0) return undefined;

  return items.filter(item => {
    if (audience === 'estateLawyer') {
      return item.verificationType === 'estateLawyer'
        || item.verificationType === 'lawyer'
        || item.evidence.limitationReason === 'legalInterpretationRequired'
        || item.evidence.verificationType === 'estateLawyer';
    }
    if (audience === 'accountant') {
      return item.verificationType === 'accountant'
        || item.evidence.limitationReason === 'taxInterpretationRequired'
        || item.evidence.verificationType === 'accountant';
    }
    return true;
  });
}

function filterLimitations(
  limitations: ClarifyReviewItem[] | undefined,
  audience: GuardianshipAudience
): ClarifyReviewItem[] | undefined {
  if (!limitations || limitations.length === 0) return undefined;
  return filterReviewItems(limitations, audience);
}

// ─── Immediate Actions Section Builder ────────────────────────────────────────

function buildImmediateActionsSection(
  actions: ImmediateActionNarrative[],
  audience: GuardianshipAudience,
  maxActions?: number
): GuardianshipAudienceSection | null {
  let relevant: ImmediateActionNarrative[];

  if (audience === 'client' || audience === 'guardian') {
    relevant = actions;
    if (audience === 'guardian') {
      // Guardian actions only — exclude executor/POA duties
      const executorKeywords = ['estate trustee', 'inventory', 'probate', 'cancel credit', 'notify bank', 'file tax', 'settle debt', 'investment decision', 'administer'];
      relevant = actions.filter(a => {
        const text = `${a.heading} ${a.body}`.toLowerCase();
        if (executorKeywords.some(kw => text.includes(kw))) return false;
        return true;
      });
    }
  } else {
    relevant = actions.filter(a => {
      const text = `${a.heading} ${a.body}`.toLowerCase();
      if (audience === 'estateLawyer') return text.includes('lawyer') || text.includes('legal') || text.includes('estate') || text.includes('will');
      if (audience === 'accountant') return text.includes('accountant') || text.includes('tax') || text.includes('financial');
      return false;
    });
  }

  if (maxActions !== undefined && maxActions > 0) {
    relevant = relevant.slice(0, maxActions);
  }

  if (relevant.length === 0) return null;

  // For guardian audience, organize into time horizons
  if (audience === 'guardian') {
    return buildTimeHorizonActionsSection(relevant);
  }

  const blocks: NarrativeBlock[] = relevant.map(a => ({
    id: a.id,
    ruleId: a.ruleId,
    type: 'action' as const,
    heading: a.heading,
    body: a.body,
    importance: (a.priority <= 3 ? 'primary' : a.priority <= 6 ? 'important' : 'supporting') as NarrativeImportance,
    sourceType: a.isParentWish ? 'parentPreference' as const : 'derived' as const,
  }));

  return {
    id: 'immediate-actions',
    heading: 'If You Ever Need to Step In',
    purpose: 'A starting point — not a list of everything that needs to happen at once',
    priority: 'primary',
    blocks,
  };
}

function classifyActionTimeHorizon(action: ImmediateActionNarrative): 'rightAway' | 'soon' | 'settling' {
  const text = `${action.heading} ${action.body}`.toLowerCase();
  // Right away: immediate guardian concerns
  if (
    text.includes('guardian') && (text.includes('contact') || text.includes('reach out')) ||
    text.includes('be with the children') ||
    text.includes('medication') ||
    text.includes('urgent health') ||
    text.includes('keep minor siblings together') ||
    text.includes('familiar trusted adult') ||
    text.includes('avoid unnecessary') ||
    text.includes('first-days') ||
    text.includes('first days')
  ) {
    return 'rightAway';
  }
  // Soon: school, healthcare, records, relationships, trustee
  if (
    text.includes('school') && (text.includes('contact') || text.includes('records')) ||
    text.includes('healthcare provider') ||
    text.includes('records') ||
    text.includes('friend') && text.includes('contact') ||
    text.includes('important people') ||
    text.includes('stay connected') ||
    text.includes('important relationship') ||
    text.includes('routine') ||
    text.includes('estate trustee') && text.includes('connect') ||
    text.includes('inheritance trustee') && text.includes('connect')
  ) {
    return 'soon';
  }
  // Once things begin to settle: longer-term
  return 'settling';
}

function buildTimeHorizonActionsSection(
  relevant: ImmediateActionNarrative[]
): GuardianshipAudienceSection {
  const rightAway = relevant.filter(a => classifyActionTimeHorizon(a) === 'rightAway');
  const soon = relevant.filter(a => classifyActionTimeHorizon(a) === 'soon');
  const settling = relevant.filter(a => classifyActionTimeHorizon(a) === 'settling');

  const blocks: NarrativeBlock[] = [];

  if (rightAway.length > 0) {
    blocks.push({
      id: 'th_right_away',
      ruleId: 'IMMEDIATE-01',
      type: 'action',
      importance: 'primary',
      sourceType: 'derived',
      heading: 'Right Away',
      body: '',
    });
    for (const a of rightAway) {
      blocks.push({
        id: a.id,
        ruleId: a.ruleId,
        type: 'action',
        importance: 'primary',
        sourceType: a.isParentWish ? 'parentPreference' : 'derived',
        heading: a.heading,
        body: a.body,
        childNames: a.childNames,
      });
    }
  }

  if (soon.length > 0) {
    blocks.push({
      id: 'th_soon',
      ruleId: 'IMMEDIATE-01',
      type: 'action',
      importance: 'important',
      sourceType: 'derived',
      heading: 'Soon',
      body: '',
    });
    for (const a of soon) {
      blocks.push({
        id: a.id,
        ruleId: a.ruleId,
        type: 'action',
        importance: 'important',
        sourceType: a.isParentWish ? 'parentPreference' : 'derived',
        heading: a.heading,
        body: a.body,
        childNames: a.childNames,
      });
    }
  }

  if (settling.length > 0) {
    blocks.push({
      id: 'th_settling',
      ruleId: 'IMMEDIATE-01',
      type: 'action',
      importance: 'supporting',
      sourceType: 'derived',
      heading: 'Once Things Begin to Settle',
      body: '',
    });
    for (const a of settling) {
      blocks.push({
        id: a.id,
        ruleId: a.ruleId,
        type: 'action',
        importance: 'supporting',
        sourceType: a.isParentWish ? 'parentPreference' : 'derived',
        heading: a.heading,
        body: a.body,
        childNames: a.childNames,
      });
    }
  }

  return {
    id: 'immediate-actions',
    heading: 'If You Ever Need to Step In',
    purpose: 'A starting point — not a list of everything that needs to happen at once',
    priority: 'primary',
    blocks,
  };
}

// ─── Child Section Grouping ───────────────────────────────────────────────────
//
// For sections that pull from child subsections with perChild=true, we need
// to group blocks by child and create sub-sections within the main section.

interface ChildGroup {
  childId: string;
  childName: string;
  subsections: { heading: string; blocks: NarrativeBlock[] }[];
}

function groupChildBlocksByChild(
  narrative: GuardianshipNarrativeModel,
  subsection: ChildSubsection,
  heading: string
): ChildGroup[] {
  return narrative.children
    .map(child => {
      const blocks = child[subsection] || [];
      if (blocks.length === 0) return null;
      return {
        childId: child.childId,
        childName: child.childName,
        subsections: [{ heading, blocks }],
      };
    })
    .filter((g): g is ChildGroup => g !== null);
}

// ─── Audience Strategies ──────────────────────────────────────────────────────

interface AudienceStrategy {
  title: string;
  purpose: string;
  blueprints: SectionBlueprint[];
  /** Which readiness subsections to include as separate sections. */
  readinessMode?: 'full' | 'split' | 'lawyer' | 'accountant' | 'none';
  /** Max immediate actions. */
  maxActions?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

const clientStrategy: AudienceStrategy = {
  title: 'Guardianship Planning Summary',
  purpose: 'A complete picture of your plan and what still deserves your attention.',
  blueprints: [
    // 1. Your Family & Guardianship Plan
    {
      id: 'family-and-plan',
      heading: 'Your Family & Guardianship Plan',
      priority: 'primary',
      sources: [
        { area: 'familyContext' },
        { area: 'guardianPlan' },
      ],
    },
    // 2. If the Children Had to Move
    {
      id: 'move-transition',
      heading: 'If the Children Had to Move',
      purpose: 'What would change and what should be preserved',
      priority: 'important',
      sources: [
        { area: 'guardianPlan' },
        { area: 'children', subsection: 'education' },
        { area: 'children', subsection: 'supportTransition' },
      ],
      includeRules: ['MOVE-01', 'MOVE-03', 'SCHOOL-01', 'SCHOOL-02', 'SUPPORT-01', 'SUPPORT-02'],
      excludeTypes: ['parentVoice'],
      collapsibleInUI: true,
    },
    // 3. What You Want Preserved
    {
      id: 'preserve',
      heading: 'What You Want Preserved',
      purpose: 'The people, communities, and traditions that matter to your children',
      priority: 'important',
      sources: [
        { area: 'children', subsection: 'peopleAndConnections' },
        { area: 'children', subsection: 'communitiesAndTraditions' },
        { area: 'children', subsection: 'activities' },
      ],
      includeRules: ['CONNECTION-01', 'CONNECTION-02', 'COMMUNITY-01', 'TRADITION-01', 'ACTIVITY-01', 'ACTIVITY-02'],
      excludeTypes: ['crossReference'],
      collapsibleInUI: true,
    },
    // 4. How You Want the Financial Side to Work
    {
      id: 'funding',
      heading: 'How You Want the Financial Side to Work',
      priority: 'important',
      sources: [{ area: 'fundingPhilosophy' }],
    },
    // 5. How the People You've Chosen Should Work Together
    {
      id: 'coordination',
      heading: 'How the People You\'ve Chosen Should Work Together',
      priority: 'important',
      sources: [{ area: 'coordination' }],
    },
    // 6. Children's Inheritance & Longer-Term Planning
    {
      id: 'inheritance',
      heading: 'Children\'s Inheritance & Longer-Term Planning',
      priority: 'important',
      sources: [
        { area: 'children', subsection: 'inheritance' },
        { area: 'children', subsection: 'adultTransition' },
      ],
      includeRules: ['INHERITANCE-01', 'INHERITANCE-02', 'INHERITANCE-03', 'INHERITANCE-04', 'ADULT-TRANSITION-01', 'ADULT-TRANSITION-02'],
    },
    // 7. Decisions You've Made
    {
      id: 'decisions',
      heading: 'Decisions You\'ve Made',
      priority: 'supporting',
      sources: [{ area: 'readiness', subsection: 'decisionsMade' }],
    },
    // 8. Things Worth Confirming
    {
      id: 'worth-confirming',
      heading: 'Things Worth Confirming',
      priority: 'important',
      sources: [{ area: 'readiness', subsection: 'thingsWorthConfirming' }],
    },
    // 9. Professional Review (inline — not a separate section for client)
    // handled via reviewItems/limitations on the document
    // 10. Your Next Steps
    {
      id: 'next-steps',
      heading: 'Your Next Steps',
      priority: 'primary',
      sources: [{ area: 'readiness', subsection: 'thingsStillToDo' }],
    },
  ],
  maxActions: 5,
};

// ═══════════════════════════════════════════════════════════════════════════════
// GUARDIAN STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

const guardianStrategy: AudienceStrategy = {
  title: 'Guardianship Roadmap',
  purpose: 'What you need to know, who to call, and how the parents want you to approach this.',
  blueprints: [
    // 1. Who Would Step In
    {
      id: 'start-here',
      heading: 'Who Would Step In',
      purpose: 'The essentials, right at the top',
      priority: 'primary',
      sources: [
        { area: 'familyContext' },
        { area: 'guardianPlan' },
      ],
      includeRules: ['GUARDIAN-01', 'GUARDIAN-02', 'GUARDIAN-03', 'GUARDIAN-04'],
    },
    // 1b. Roadmap at a Glance — orientation dashboard, not a second narrative
    {
      id: 'at-a-glance',
      heading: 'Roadmap at a Glance',
      purpose: 'A quick orientation before the detail begins',
      priority: 'primary',
      sources: [
        { area: 'familyContext' },
      ],
      includeRules: ['GUARDIAN-01'],
      includeTypes: ['intro', 'context'],
      customBuilder: 'atAGlance',
      collapsibleInUI: true,
    },
    // 1c. Why We Chose You — parent voice, early in the document
    {
      id: 'why-we-chose-you',
      heading: 'Why We Chose You',
      purpose: 'A message from the parents to the Guardian',
      priority: 'primary',
      sources: [{ area: 'guardianTrust' }],
    },
    // 2. A Note from the Parents
    {
      id: 'parent-voice',
      heading: 'A Note from the Parents',
      priority: 'primary',
      sources: [
        { area: 'guardianPlan' },
        { area: 'fundingPhilosophy' },
        { area: 'coordination' },
      ],
      includeTypes: ['parentVoice'],
      excludeRules: ['GUARDIAN-TRUST-01', 'GUARDIAN-TRUST-02', 'GUARDIAN-TRUST-03'],
    },
    // 3. Family at a Glance
    {
      id: 'family-glance',
      heading: 'Family at a Glance',
      priority: 'primary',
      sources: [
        { area: 'children', subsection: 'introduction' },
      ],
      includeRules: ['GUARDIAN-01'],
    },
    // 4. Guardian Plan
    {
      id: 'guardian-plan',
      heading: 'Guardian Plan',
      purpose: 'Who cares for whom, expected move, and backup',
      priority: 'primary',
      sources: [
        { area: 'guardianPlan' },
      ],
      excludeRules: ['GUARDIAN-01'],
    },
    // 5. Child-Specific Sections (per-child hierarchy)
    {
      id: 'child-details',
      heading: 'About Each Child',
      purpose: 'Important things their parents would want a future Guardian to know',
      priority: 'primary',
      sources: [
        { area: 'children', subsection: 'introduction' },
        { area: 'children', subsection: 'education' },
        { area: 'children', subsection: 'healthcare' },
        { area: 'children', subsection: 'supportTransition' },
        { area: 'children', subsection: 'peopleAndConnections' },
        { area: 'children', subsection: 'communitiesAndTraditions' },
        { area: 'children', subsection: 'activities' },
        { area: 'children', subsection: 'inheritance' },
        { area: 'children', subsection: 'adultTransition' },
        { area: 'children', subsection: 'futureEducation' },
      ],
      excludeRules: ['GUARDIAN-01'],
      perChild: true,
      collapsibleInUI: true,
    },
    // 6. Adult Sibling Role
    {
      id: 'adult-sibling',
      heading: 'Adult Sibling Role',
      purpose: 'An important family relationship — not an automatic parenting responsibility',
      priority: 'important',
      sources: [{ area: 'familyRoles' }],
      includeRules: ['SIBLING-01', 'SIBLING-02'],
    },
    // 7. Caring for Them Shouldn't Mean Carrying the Cost Alone
    {
      id: 'funding',
      heading: 'Caring for Them Shouldn\'t Mean Carrying the Cost Alone',
      purpose: 'How the parents want resources to be used',
      priority: 'important',
      sources: [{ area: 'fundingPhilosophy' }],
      excludeTypes: ['parentVoice'],
    },
    // 7b. Becoming Part of Your Family — fairness & belonging
    {
      id: 'family-fairness',
      heading: 'Becoming Part of Your Family',
      purpose: 'How the parents thought about differences in resources and opportunities',
      priority: 'important',
      sources: [{ area: 'familyFairness' }],
      excludeTypes: ['parentVoice'],
    },
    // 7c. What We Trust You to Decide — discretion guidance
    {
      id: 'what-we-trust',
      heading: 'What We Trust You to Decide',
      purpose: 'Where the parents want the Guardian to feel free to use their own judgment',
      priority: 'primary',
      sources: [{ area: 'guardianDiscretion' }],
    },
    // 8. Working Together for the Children
    {
      id: 'coordination',
      heading: 'Working Together for the Children',
      purpose: 'When the guardian and financial decision-maker are different people',
      priority: 'important',
      sources: [{ area: 'coordination' }],
      excludeTypes: ['parentVoice'],
    },
    // 9. Who Does What?
    {
      id: 'who-does-what',
      heading: 'Who Does What?',
      purpose: 'Who holds which role — appointed roles vs. professional contacts who may assist',
      priority: 'supporting',
      sources: [],
      customBuilder: 'whoDoesWhat',
    },
    // 9b. How the Financial Side Is Organized
    {
      id: 'financial-coordination',
      heading: 'How the Financial Side Is Organized',
      purpose: 'A compact overview of who controls or coordinates funds — not a balance sheet',
      priority: 'supporting',
      sources: [],
      customBuilder: 'financialCoordination',
    },
    // 9c. Questions to Talk Through Together
    {
      id: 'conversation-prompts',
      heading: 'Questions to Talk Through Together',
      purpose: 'Conversation prompts for the planning discussion — not warnings or legal advice',
      priority: 'supporting',
      sources: [{ area: 'conversationPrompts' }],
      collapsibleInUI: true,
    },
    // 9d. Things Worth Confirming
    {
      id: 'worth-confirming',
      heading: 'Things Worth Confirming',
      purpose: 'Planning items to discuss — not errors or legal requirements',
      priority: 'important',
      sources: [{ area: 'readiness', subsection: 'thingsWorthConfirming' }],
      collapsibleInUI: true,
      skipRepetitionControl: true,
    },
    // 10. Important Documents
    {
      id: 'documents',
      heading: 'Important Documents',
      priority: 'supporting',
      sources: [{ area: 'documents' }],
    },
    // 11. If Something Happened Tomorrow
    // handled via immediate actions builder
  ],
  maxActions: 8,
};

// ═══════════════════════════════════════════════════════════════════════════════
// ESTATE LAWYER STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

const estateLawyerStrategy: AudienceStrategy = {
  title: 'Guardianship & Estate Planning Brief',
  purpose: 'What these clients want their legal plan to accomplish, and what should be reviewed.',
  blueprints: [
    // 1. Family Context
    {
      id: 'family-context',
      heading: 'Family Context',
      priority: 'primary',
      sources: [{ area: 'familyContext' }],
    },
    // 2. Intended Guardian Appointments
    {
      id: 'guardian-appointments',
      heading: 'Intended Guardian Appointments',
      purpose: 'Primary, alternate, applicable children, household, conversations',
      priority: 'primary',
      sources: [{ area: 'guardianPlan' }],
      includeRules: ['GUARDIAN-01', 'GUARDIAN-02', 'GUARDIAN-03', 'GUARDIAN-04', 'GUARDIAN-05'],
    },
    // 3. Current Will Understanding
    {
      id: 'will-understanding',
      heading: 'Current Will Understanding',
      purpose: 'Who clients believe is named, mismatches, uncertainty',
      priority: 'primary',
      sources: [{ area: 'guardianPlan' }],
      includeRules: ['GUARDIAN-03', 'GUARDIAN-05'],
    },
    // 4. Child Inheritance Intentions
    {
      id: 'inheritance',
      heading: 'Child Inheritance Intentions',
      purpose: 'Outright vs managed, staged distributions, trustees, disability-sensitive planning',
      priority: 'primary',
      sources: [
        { area: 'children', subsection: 'inheritance' },
        { area: 'children', subsection: 'adultTransition' },
      ],
      includeRules: ['INHERITANCE-01', 'INHERITANCE-02', 'INHERITANCE-03', 'INHERITANCE-04', 'ADULT-TRANSITION-01', 'ADULT-TRANSITION-02'],
    },
    // 5. Guardian Household Funding Intentions
    {
      id: 'funding',
      heading: 'Guardian Household Funding Intentions',
      purpose: 'Material preferences that may require trust flexibility',
      priority: 'important',
      sources: [{ area: 'fundingPhilosophy' }],
      excludeTypes: ['parentVoice'],
    },
    // 6. Role Separation & Coordination
    {
      id: 'coordination',
      heading: 'Role Separation & Coordination',
      purpose: 'Guardian, Attorney, Estate Trustee, inheritance trustee',
      priority: 'important',
      sources: [{ area: 'coordination' }],
      excludeTypes: ['parentVoice'],
    },
    // 7. Legal Review Items (readiness things worth confirming + reviewItems)
    {
      id: 'legal-review',
      heading: 'Legal Review Items',
      purpose: 'What clients want/understand, why it matters, what the Kit cannot confirm',
      priority: 'primary',
      sources: [{ area: 'readiness', subsection: 'thingsWorthConfirming' }],
    },
    // 8. Relevant Documents
    {
      id: 'documents',
      heading: 'Relevant Documents',
      priority: 'supporting',
      sources: [{ area: 'documents' }],
    },
  ],
  maxActions: 3,
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTANT STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

const accountantStrategy: AudienceStrategy = {
  title: 'Guardianship Financial Coordination Brief',
  purpose: 'Financial or tax structures that may affect implementation.',
  blueprints: [
    // 1. Relevant Family Context
    {
      id: 'family-context',
      heading: 'Relevant Family Context',
      priority: 'primary',
      sources: [{ area: 'familyContext' }],
    },
    // 2. Financial Resources for Children
    {
      id: 'financial-resources',
      heading: 'Financial Resources for Children',
      purpose: 'RESP, RDSP, trusts, insurance, other funds',
      priority: 'primary',
      sources: [{ area: 'financialResources' }],
    },
    // 3. Disability / Government Program Context
    {
      id: 'disability-context',
      heading: 'Disability / Government Program Context',
      purpose: 'DTC, RDSP, long-term support where relevant',
      priority: 'important',
      sources: [
        { area: 'children', subsection: 'adultTransition' },
      ],
      includeRules: ['ADULT-TRANSITION-02'],
    },
    // 4. Guardian Household Funding Intentions
    {
      id: 'funding',
      heading: 'Guardian Household Funding Intentions',
      purpose: 'Materially financial items only',
      priority: 'important',
      sources: [{ area: 'fundingPhilosophy' }],
      excludeTypes: ['parentVoice'],
      includeRules: ['FUNDING-01', 'FUNDING-04', 'FUNDING-05', 'FUNDING-06', 'FUNDING-07', 'FUNDING-08', 'FUNDING-09', 'FUNDING-10', 'FUNDING-11'],
    },
    // 5. Trust / Distribution Context
    {
      id: 'trust-context',
      heading: 'Trust / Distribution Context',
      purpose: 'Trust existence, inheritance trustee, staged distributions, disability-sensitive structure',
      priority: 'important',
      sources: [
        { area: 'children', subsection: 'inheritance' },
      ],
      includeRules: ['INHERITANCE-01', 'INHERITANCE-02', 'INHERITANCE-03', 'INHERITANCE-04'],
    },
    // 6. Accounting / Tax Review Items
    {
      id: 'tax-review',
      heading: 'Accounting / Tax Review Items',
      priority: 'primary',
      sources: [{ area: 'readiness', subsection: 'thingsWorthConfirming' }],
    },
    // 7. Relevant Cross-References (financial resources cross-refs)
    {
      id: 'cross-refs',
      heading: 'Relevant Cross-References',
      purpose: 'Family Financial Map, trusts, corporate structure, Will review',
      priority: 'supporting',
      sources: [
        { area: 'financialResources' },
        { area: 'documents' },
      ],
      includeTypes: ['crossReference'],
    },
  ],
  maxActions: 0,
};

// ─── Strategy Registry ────────────────────────────────────────────────────────

const strategies: Partial<Record<GuardianshipAudience, AudienceStrategy>> = {
  client: clientStrategy,
  guardian: guardianStrategy,
  estateLawyer: estateLawyerStrategy,
  accountant: accountantStrategy,
};

// ─── Main Composer ────────────────────────────────────────────────────────────

export interface ComposeOptions {
  clientNames?: string[];
  reportDate?: Date | string;
  reviewItems?: ClarifyReviewItem[];
  limitations?: ClarifyReviewItem[];
  roadmapModel?: unknown;
}

/**
 * Compose a GuardianshipAudienceDocument from the narrative model.
 *
 * For the four primary audiences (client, guardian, estateLawyer, accountant),
 * audience-specific blueprints control section ordering, content selection,
 * and emphasis. For other audiences (trustees, attorneyForProperty), a
 * default blueprint set is used.
 */
export function composeGuardianshipForAudience(
  narrativeModel: GuardianshipNarrativeModel,
  audience: GuardianshipAudience,
  options?: ComposeOptions
): GuardianshipAudienceDocument {
  const strategy = strategies[audience];
  const blueprints = strategy?.blueprints || DEFAULT_BLUEPRINTS;
  const tracker = createRepetitionTracker();

  const sections: GuardianshipAudienceSection[] = [];
  for (const blueprint of blueprints) {
    const section = resolveSection(blueprint, narrativeModel, audience, tracker, options?.roadmapModel);
    if (section) sections.push(section);
  }

  // Immediate actions
  if (narrativeModel.immediateActions.length > 0) {
    const maxActions = strategy?.maxActions;
    if (maxActions !== 0) {
      const actionsSection = buildImmediateActionsSection(
        narrativeModel.immediateActions,
        audience,
        maxActions
      );
      if (actionsSection) sections.push(actionsSection);
    }
  }

  // Quick reference
  const quickRef = filterQuickReference(narrativeModel.quickReference, audience);
  const filteredQuickRef = quickRef.length > 0 ? quickRef : undefined;

  // Review items and limitations
  const reviewItems = filterReviewItems(options?.reviewItems, audience);
  const limitations = filterLimitations(options?.limitations, audience);

  // Metadata
  const metadata: AudienceDocumentMetadata = {
    familyName: options?.clientNames?.join(' & '),
    generatedAt: typeof (options?.reportDate) === 'string' ? options.reportDate : (options?.reportDate || new Date()).toISOString(),
    sourceModelVersion: 'guardianship-v1',
  };

  // Title and purpose
  const titleMap: Record<GuardianshipAudience, string> = {
    client: 'Guardianship Planning Summary',
    guardian: 'Guardianship Roadmap',
    estateLawyer: 'Guardianship & Estate Planning Brief',
    accountant: 'Guardianship Financial Coordination Brief',
    estateTrustee: 'Guardianship Roadmap — Trustee Review',
    inheritanceTrustee: 'Guardianship Roadmap — Trustee Review',
    attorneyForProperty: 'Guardianship Roadmap — Attorney Review',
  };

  const purposeMap: Record<GuardianshipAudience, string> = {
    client: 'A complete picture of your plan and what still deserves your attention.',
    guardian: 'What you need to know, who to call, and how the parents want you to approach this.',
    estateLawyer: 'What these clients want their legal plan to accomplish, and what should be reviewed.',
    accountant: 'Financial or tax structures that may affect implementation.',
    estateTrustee: 'Your responsibilities and the context you need to carry them out.',
    inheritanceTrustee: 'Your responsibilities and the context you need to carry them out.',
    attorneyForProperty: 'Your responsibilities and the context you need to carry them out.',
  };

  return {
    audience,
    title: titleMap[audience],
    purpose: purposeMap[audience],
    sections,
    quickReference: filteredQuickRef,
    reviewItems,
    limitations,
    metadata,
  };
}

// ─── Default Blueprints (for trustee/attorney audiences) ──────────────────────

const DEFAULT_BLUEPRINTS: SectionBlueprint[] = [
  {
    id: 'family-context',
    heading: 'Family Context',
    priority: 'primary',
    sources: [{ area: 'familyContext' }],
  },
  {
    id: 'guardian-plan',
    heading: 'Guardian Plan',
    priority: 'primary',
    sources: [{ area: 'guardianPlan' }],
  },
  {
    id: 'children',
    heading: 'Children',
    priority: 'primary',
    sources: [{ area: 'children' }],
  },
  {
    id: 'family-roles',
    heading: 'Who Does What',
    priority: 'important',
    sources: [{ area: 'familyRoles' }],
  },
  {
    id: 'financial-resources',
    heading: 'Financial Resources',
    priority: 'important',
    sources: [{ area: 'financialResources' }],
  },
  {
    id: 'funding-philosophy',
    heading: 'Funding Philosophy',
    priority: 'important',
    sources: [{ area: 'fundingPhilosophy' }],
  },
  {
    id: 'coordination',
    heading: 'Working Together',
    priority: 'important',
    sources: [{ area: 'coordination' }],
  },
  {
    id: 'documents',
    heading: 'Documents',
    priority: 'supporting',
    sources: [{ area: 'documents' }],
  },
  {
    id: 'readiness',
    heading: 'Readiness',
    priority: 'important',
    sources: [
      { area: 'readiness', subsection: 'decisionsMade' },
      { area: 'readiness', subsection: 'thingsWorthConfirming' },
      { area: 'readiness', subsection: 'thingsStillToDo' },
    ],
  },
];

// ─── Public Exports ───────────────────────────────────────────────────────────

export type { SectionBlueprint, SectionSource, ChildSubsection };
export { DEFAULT_BLUEPRINTS };
