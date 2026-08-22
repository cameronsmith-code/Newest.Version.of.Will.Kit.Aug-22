/**
 * Guardian Roadmap Document Builder
 *
 * Converts a GuardianshipAudienceDocument (the content source of truth)
 * into a ClarifyDocument (the neutral layout model that the PDF/HTML
 * renderers consume).
 *
 * This layer does NOT create planning conclusions.  It maps composed
 * narrative blocks into typed visual components, applying:
 *   - evidence tags
 *   - child-specific grouping
 *   - empty-section suppression
 *   - pagination hints
 *   - callouts for limitations
 */

import type {
  GuardianshipAudienceDocument,
  GuardianshipAudienceSection,
  ChildSection,
  ChildSubsectionGroup,
} from './guardianshipAudienceComposer';
import type {
  NarrativeBlock,
} from './guardianshipNarrativeTypes';
import type {
  ClarifyDocument,
  ClarifySection,
  ClarifyBlock,
  ClarifyTableRow,
  EvidenceTag,
  ClarifyCoverInfo,
  ClarifyQuickRefEntry,
  ClarifyLimitationEntry,
} from './clarifyDocumentTypes';
import { EVIDENCE_TAG_LABELS } from './clarifyDocumentTypes';
import { sanitizeClarifyDocument, isLowInformationText } from './guardianshipHumanization';

// ─── Evidence mapping ──────────────────────────────────────────────────────────

function mapEvidenceTag(block: NarrativeBlock): EvidenceTag | undefined {
  if (block.sourceType === 'parentPreference') return 'parentWish';
  if (block.sourceType === 'parentUnderstanding') return 'clientUnderstanding';
  if (block.limitation) {
    if (block.limitation.importance === 'professionalReview' || block.limitation.importance === 'highPriorityReview') {
      return 'professionalReview';
    }
    return 'worthConfirming';
  }
  if (block.evidence?.evidenceType === 'incompleteInformation') return 'missingInfo';
  if (block.evidence?.evidenceType === 'derivedInterpretation') return 'worthConfirming';
  return undefined;
}

// ─── Block converters ──────────────────────────────────────────────────────────

let blockCounter = 0;
function nextId(prefix: string): string {
  blockCounter += 1;
  return `${prefix}_${blockCounter}`;
}

function narrativeToBlocks(blocks: NarrativeBlock[], sectionId: string): ClarifyBlock[] {
  const result: ClarifyBlock[] = [];

  for (const block of blocks) {
    const evidenceTag = mapEvidenceTag(block);
    const evidenceLabel = evidenceTag ? EVIDENCE_TAG_LABELS[evidenceTag] : undefined;

    // Skip blocks with low-information parent text that would create noise
    if (block.type === 'parentVoice' && block.body && isLowInformationText(block.body)) {
      continue;
    }

    // crossReference blocks carry document/financial cross-reference info.
    // Render them as subheading + body instead of skipping, so the
    // Important Documents section actually shows its entries.
    if (block.type === 'crossReference') {
      if (block.heading) {
        result.push({
          id: nextId(sectionId),
          type: 'subheading',
          text: block.heading,
          evidenceTag,
          evidenceLabel,
          keepWithNext: true,
        });
      }
      if (block.body) {
        result.push({
          id: nextId(sectionId),
          type: 'body',
          text: block.body,
          evidenceTag,
          evidenceLabel,
        });
      }
      if (block.bullets && block.bullets.length > 0) {
        result.push({
          id: nextId(sectionId),
          type: 'bullets',
          items: block.bullets,
          evidenceTag,
          evidenceLabel,
        });
      }
      continue;
    }

    // Parent voice: render as a dedicated parent voice block with gold styling
    if (block.type === 'parentVoice' && block.body) {
      result.push({
        id: nextId(sectionId),
        type: 'parentVoice',
        text: block.body,
        heading: block.heading || 'In Their Own Words',
      });
      continue;
    }

    // Skip blocks whose heading duplicates the intro section
    if (block.heading === 'About This Roadmap') {
      continue;
    }

    if (block.heading) {
      result.push({
        id: nextId(sectionId),
        type: 'subheading',
        text: block.heading,
        evidenceTag,
        evidenceLabel,
        keepWithNext: true,
      });
    }

    if (block.body) {
      result.push({
        id: nextId(sectionId),
        type: 'body',
        text: block.body,
        evidenceTag,
        evidenceLabel,
      });
    }

    if (block.bullets && block.bullets.length > 0) {
      result.push({
        id: nextId(sectionId),
        type: 'bullets',
        items: block.bullets,
        evidenceTag,
        evidenceLabel,
      });
    }

    // If a limitation exists and has a message, render as a callout
    if (block.limitation?.message && block.limitation.importance !== 'informational') {
      result.push({
        id: nextId(sectionId),
        type: 'callout',
        text: block.limitation.message,
        evidenceTag: evidenceTag || 'worthConfirming',
        evidenceLabel: evidenceLabel || EVIDENCE_TAG_LABELS.worthConfirming,
      });
    }
  }

  return result;
}

function childSubsectionToBlocks(sub: ChildSubsectionGroup, sectionId: string): ClarifyBlock[] {
  const blocks = narrativeToBlocks(sub.blocks, sectionId);
  if (blocks.length === 0) return [];

  // Prepend a subheading for this subsection if the first block isn't already one
  const result: ClarifyBlock[] = [];
  if (blocks[0].type !== 'subheading') {
    result.push({
      id: nextId(sectionId),
      type: 'subheading',
      text: sub.heading,
      keepWithNext: true,
    });
  } else {
    // Replace the first subheading with the subsection heading
    blocks[0].text = sub.heading;
  }
  result.push(...blocks);
  return result;
}

function childSectionToBlocks(childSec: ChildSection, sectionId: string): ClarifyBlock[] {
  const result: ClarifyBlock[] = [];

  // Child name as a heading + divider subtitle
  result.push({
    id: nextId(sectionId),
    type: 'heading',
    text: childSec.childName,
    subtitle: 'What a future Guardian should know',
    keepWithNext: true,
    pageBreakBefore: result.length > 0,
  });

  if (childSec.subsections.length === 0 || childSec.subsections.every(s => s.blocks.length === 0)) {
    return result;
  }

  for (const sub of childSec.subsections) {
    const subBlocks = childSubsectionToBlocks(sub, sectionId);
    result.push(...subBlocks);
  }

  return result;
}

// ─── Immediate Actions to Action List ──────────────────────────────────────────

function actionsToBlocks(blocks: NarrativeBlock[], sectionId: string): ClarifyBlock[] {
  const result: ClarifyBlock[] = [];
  for (const block of blocks) {
    const tag = mapEvidenceTag(block);
    const label = tag ? EVIDENCE_TAG_LABELS[tag] : undefined;
    if (block.heading || block.body) {
      result.push({
        id: nextId(sectionId),
        type: 'actionList',
        title: block.heading,
        text: block.body,
        evidenceTag: tag,
        evidenceLabel: label,
      });
    }
  }
  return result;
}

// ─── Quick Reference to Table ──────────────────────────────────────────────────

// ─── Limitations ───────────────────────────────────────────────────────────────

function limitationsToBlocks(
  limitations: ClarifyLimitationEntry[],
  sectionId: string
): ClarifyBlock[] {
  const result: ClarifyBlock[] = [];
  for (const lim of limitations) {
    result.push({
      id: nextId(sectionId),
      type: 'limitation',
      title: lim.title,
      text: lim.body,
    });
  }
  return result;
}

// ─── Role Table ────────────────────────────────────────────────────────────────

function isRoleTableSection(section: GuardianshipAudienceSection): boolean {
  return section.id === 'who-does-what' && !!section.roleTableRows && section.roleTableRows.length > 0;
}

function blocksToRoleTable(section: GuardianshipAudienceSection, sectionId: string): ClarifyBlock[] {
  // If the section has roleTableRows from the custom builder, use them directly
  if (section.roleTableRows && section.roleTableRows.length > 0) {
    return [
      {
        id: nextId(sectionId),
        type: 'roleTable',
        rows: section.roleTableRows.map(r => ({
          role: r.role,
          person: r.person,
          responsibility: r.responsibility,
          appointed: r.appointed,
        })),
      },
    ];
  }
  // Fallback: try to parse from narrative blocks
  const rows: ClarifyTableRow[] = [];
  for (const b of section.blocks) {
    if (b.type === 'summary' && b.bullets) {
      for (const bullet of b.bullets) {
        rows.push({ role: bullet, person: '', responsibility: '' });
      }
    }
    if (b.body && b.type === 'context') {
      rows.push({ role: b.heading || '', person: b.body, responsibility: '' });
    }
  }
  if (rows.length === 0) {
    return narrativeToBlocks(section.blocks, sectionId);
  }
  return [
    {
      id: nextId(sectionId),
      type: 'roleTable',
      rows,
    },
  ];
}

// ─── Section converter ─────────────────────────────────────────────────────────

function sectionToClarifySection(
  section: GuardianshipAudienceSection,
  _isFirstContentSection: boolean,
): ClarifySection | null {
  const blocks: ClarifyBlock[] = [];

  if (section.id === 'immediate-actions') {
    blocks.push(...actionsToBlocks(section.blocks, section.id));
  } else if (isRoleTableSection(section)) {
    blocks.push(...blocksToRoleTable(section, section.id));
  } else if (section.childSections && section.childSections.length > 0) {
    for (let i = 0; i < section.childSections.length; i++) {
      const childBlocks = childSectionToBlocks(section.childSections[i], section.id);
      // Don't force page break before the first child if this is the first content section
      if (i === 0 && childBlocks[0]) {
        childBlocks[0].pageBreakBefore = false;
      }
      blocks.push(...childBlocks);
    }
  } else {
    blocks.push(...narrativeToBlocks(section.blocks, section.id));
  }

  if (blocks.length === 0) return null;

  // Suppress duplicate headings: if the first block is a subheading that
  // repeats the section heading, remove it so the PDF doesn't render the
  // same title twice in a row.
  const sectionHeadingLower = section.heading.toLowerCase().trim();
  while (blocks.length > 0 &&
    blocks[0].type === 'subheading' &&
    typeof blocks[0].text === 'string' &&
    blocks[0].text.toLowerCase().trim() === sectionHeadingLower) {
    blocks.shift();
  }

  // Also suppress any leading subheading that duplicates the section purpose
  const sectionPurposeLower = (section.purpose || '').toLowerCase().trim();
  if (sectionPurposeLower &&
    blocks.length > 0 &&
    blocks[0].type === 'subheading' &&
    typeof blocks[0].text === 'string' &&
    blocks[0].text.toLowerCase().trim() === sectionPurposeLower) {
    blocks.shift();
  }

  // After removing duplicate headings, check if we now have no content
  if (blocks.length === 0) return null;

  return {
    id: section.id,
    heading: section.heading,
    purpose: section.purpose,
    blocks,
    collapsible: section.collapsibleInUI,
  };
}

// ─── Cover Page ────────────────────────────────────────────────────────────────

function buildCover(doc: GuardianshipAudienceDocument): ClarifyCoverInfo {
  const familyName = doc.metadata?.familyName || 'Your Family';
  const childNames: string[] = [];

  // Extract child names from child sections
  for (const section of doc.sections) {
    if (section.childSections) {
      for (const cs of section.childSections) {
        if (!childNames.includes(cs.childName)) {
          childNames.push(cs.childName);
        }
      }
    }
  }

  return {
    familyName,
    childNames,
    preparedDate: doc.metadata?.generatedAt || new Date().toISOString().split('T')[0],
    subtitle: 'A practical guide for the people you would trust to care for your children.',
  };
}

// ─── Main Builder ──────────────────────────────────────────────────────────────

export function buildGuardianClarifyDocument(
  doc: GuardianshipAudienceDocument
): ClarifyDocument {
  blockCounter = 0;

  const cover = buildCover(doc);
  const clarifySections: ClarifySection[] = [];
  let firstContent = true;

  for (const section of doc.sections) {
    const clarifySection = sectionToClarifySection(section, firstContent);
    if (clarifySection) {
      clarifySections.push(clarifySection);
      firstContent = false;
    }
  }

  // Build Quick Reference section
  const quickRef: ClarifyQuickRefEntry[] = (doc.quickReference || []).map(item => ({
    label: item.label,
    value: item.value,
    category: item.category,
  }));

  // Build Limitations section
  const limitations: ClarifyLimitationEntry[] = (doc.limitations || []).map(item => ({
    title: item.title,
    body: item.whatWeKnow + (item.whatWeCannotConfirm ? ` ${item.whatWeCannotConfirm}` : ''),
    importance: item.importance,
  }));

  // Add closing limitations section if there are any
  if (limitations.length > 0) {
    clarifySections.push({
      id: 'limitations',
      heading: 'Important Limitations',
      blocks: limitationsToBlocks(limitations, 'limitations'),
    });
  }

  const result: ClarifyDocument = {
    title: doc.title,
    subtitle: doc.purpose,
    cover,
    sections: clarifySections,
    quickReference: quickRef.length > 0 ? quickRef : undefined,
    limitations: limitations.length > 0 ? limitations : undefined,
    metadata: {
      audience: doc.audience,
      generatedAt: doc.metadata?.generatedAt || new Date().toISOString(),
      familyName: cover.familyName,
    },
  };

  // QA sanitization pass — log warnings and throw on blocking findings
  const findings = sanitizeClarifyDocument(result);
  for (const f of findings) {
    console.warn(`[QA] ${f.severity.toUpperCase()}: ${f.path} — ${f.issue} ("${f.sample}")`);
  }
  const blocking = findings.filter(f => f.severity === 'blocking');
  if (blocking.length > 0) {
    console.error(`[QA] ${blocking.length} BLOCKING findings — document may contain raw implementation values:`);
    for (const f of blocking) {
      console.error(`[QA]   ${f.path}: ${f.issue} ("${f.sample}")`);
    }
  }

  return result;
}
