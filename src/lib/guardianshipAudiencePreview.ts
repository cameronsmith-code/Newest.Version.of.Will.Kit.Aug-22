/**
 * Guardianship Audience Document — Development Preview
 *
 * A structured text format for QA-ing composition. Shows:
 *   - document title, audience, purpose
 *   - section order with headings and priorities
 *   - block IDs, text, importance, evidence type, limitation metadata
 *
 * This is NOT the final Clarify Wealth report. It exists to verify
 * that the composer selects, orders, and omits correctly.
 */

import type { GuardianshipAudienceDocument, GuardianshipAudienceSection } from './guardianshipAudienceComposer';
import type { NarrativeBlock } from './guardianshipNarrativeTypes';

const IMPORTANCE_TAG: Record<string, string> = {
  primary: 'PRIMARY',
  important: 'IMPORTANT',
  supporting: 'SUPPORTING',
  reference: 'REFERENCE',
};

const SOURCE_TAG: Record<string, string> = {
  knownFact: 'KnownFact',
  parentPreference: 'ParentPref',
  parentUnderstanding: 'ParentUnderstanding',
  derived: 'Derived',
  professionalReview: 'ProfReview',
};

const EVIDENCE_TAG: Record<string, string> = {
  confirmedClientFact: 'Confirmed',
  parentPreference: 'ParentPref',
  clientUnderstanding: 'ClientUnderstanding',
  derivedInterpretation: 'Derived',
  incompleteInformation: 'Incomplete',
  professionalReviewRequired: 'ProfReviewRequired',
};

const SECTION_SEP = '='.repeat(70);
const BLOCK_SEP = '-'.repeat(50);

function formatBlock(block: NarrativeBlock, index: number): string {
  const lines: string[] = [];
  const imp = IMPORTANCE_TAG[block.importance] || block.importance;
  const src = SOURCE_TAG[block.sourceType] || block.sourceType;
  const evTag = block.evidence ? ` | evidence=${EVIDENCE_TAG[block.evidence.evidenceType] || block.evidence.evidenceType}` : '';
  const confTag = block.evidence ? ` | confidence=${block.evidence.confidence}` : '';
  const limTag = block.limitation ? ` | limitation=${block.limitation.importance}` : '';
  const reviewerTag = block.limitation?.reviewerType ? ` | reviewer=${block.limitation.reviewerType}` : '';
  const nextActionTag = block.nextAction ? ` | nextAction="${block.nextAction.label}"` : '';
  const audienceTag = block.audiences ? ` | audiences=[${block.audiences.join(',')}]` : '';

  lines.push(`  [${String(index + 1).padStart(3, '0')}] ${block.id} | rule=${block.ruleId} | type=${block.type}`);
  lines.push(`        importance=${imp} | source=${src}${evTag}${confTag}${limTag}${reviewerTag}${nextActionTag}${audienceTag}`);

  if (block.heading) {
    lines.push(`        HEADING: "${block.heading}"`);
  }
  if (block.body) {
    // Truncate long bodies for preview
    const body = block.body.length > 120 ? block.body.slice(0, 117) + '...' : block.body;
    lines.push(`        BODY: "${body}"`);
  }
  if (block.bullets && block.bullets.length > 0) {
    lines.push(`        BULLETS:`);
    for (const b of block.bullets) {
      const bullet = b.length > 100 ? b.slice(0, 97) + '...' : b;
      lines.push(`          - ${bullet}`);
    }
  }

  // Limitation detail
  if (block.limitation) {
    lines.push(`        LIMITATION_MSG: "${block.limitation.message}"`);
  }

  // Evidence detail
  if (block.evidence?.limitation) {
    lines.push(`        EVIDENCE_LIMITATION: "${block.evidence.limitation}"`);
  }
  if (block.evidence?.verificationRecommended) {
    lines.push(`        VERIFICATION_RECOMMENDED: true`);
  }

  return lines.join('\n');
}

function formatSection(section: GuardianshipAudienceSection): string {
  const lines: string[] = [];
  const priority = IMPORTANCE_TAG[section.priority] || section.priority;
  const collapsible = section.collapsibleInUI ? ' [collapsible]' : '';

  lines.push(SECTION_SEP);
  lines.push(`SECTION: ${section.heading} | priority=${priority}${collapsible}`);
  lines.push(`  id: ${section.id}`);
  if (section.purpose) {
    lines.push(`  purpose: ${section.purpose}`);
  }
  lines.push(`  blocks: ${section.blocks.length}`);
  if (section.childIds && section.childIds.length > 0) {
    lines.push(`  childIds: ${section.childIds.join(', ')}`);
  }
  lines.push(SECTION_SEP);
  lines.push('');

  for (let i = 0; i < section.blocks.length; i++) {
    lines.push(formatBlock(section.blocks[i], i));
    lines.push(BLOCK_SEP);
  }

  lines.push('');
  return lines.join('\n');
}

export function renderAudienceDocumentPreview(doc: GuardianshipAudienceDocument): string {
  const lines: string[] = [];
  const topSep = '#'.repeat(70);

  lines.push(topSep);
  lines.push(`AUDIENCE DOCUMENT PREVIEW`);
  lines.push(topSep);
  lines.push(`  audience:   ${doc.audience}`);
  lines.push(`  title:      ${doc.title}`);
  lines.push(`  purpose:    ${doc.purpose}`);
  if (doc.metadata) {
    lines.push(`  familyName: ${doc.metadata.familyName || 'N/A'}`);
    lines.push(`  generated:  ${doc.metadata.generatedAt || 'N/A'}`);
    lines.push(`  modelVer:   ${doc.metadata.sourceModelVersion || 'N/A'}`);
  }
  lines.push(`  sections:   ${doc.sections.length}`);
  if (doc.quickReference) {
    lines.push(`  quickRef:   ${doc.quickReference.length} items`);
  }
  if (doc.reviewItems) {
    lines.push(`  reviewItems: ${doc.reviewItems.length} items`);
  }
  if (doc.limitations) {
    lines.push(`  limitations: ${doc.limitations.length} items`);
  }
  lines.push(topSep);
  lines.push('');

  // Section summary table
  lines.push('SECTION ORDER:');
  for (let i = 0; i < doc.sections.length; i++) {
    const s = doc.sections[i];
    const blockCount = s.blocks.length;
    lines.push(`  ${String(i + 1).padStart(2, '0')}. ${s.id.padEnd(25)} | ${s.heading.padEnd(40)} | ${blockCount} blocks | ${IMPORTANCE_TAG[s.priority] || s.priority}`);
  }
  lines.push('');

  // Detailed sections
  for (const section of doc.sections) {
    lines.push(formatSection(section));
  }

  // Quick reference
  if (doc.quickReference && doc.quickReference.length > 0) {
    lines.push(SECTION_SEP);
    lines.push('QUICK REFERENCE:');
    lines.push(SECTION_SEP);
    for (const item of doc.quickReference) {
      lines.push(`  ${item.label}: ${item.value}  [${item.category}]`);
    }
    lines.push('');
  }

  // Review items
  if (doc.reviewItems && doc.reviewItems.length > 0) {
    lines.push(SECTION_SEP);
    lines.push('REVIEW ITEMS:');
    lines.push(SECTION_SEP);
    for (const item of doc.reviewItems) {
      lines.push(`  [${item.importance}] ${item.title}`);
      if (item.whatWeKnow) lines.push(`    whatWeKnow: ${item.whatWeKnow}`);
      if (item.whatWeCannotConfirm) lines.push(`    whatWeCannotConfirm: ${item.whatWeCannotConfirm}`);
      if (item.suggestedNextStep) lines.push(`    nextStep: ${item.suggestedNextStep}`);
      lines.push('');
    }
  }

  // Limitations
  if (doc.limitations && doc.limitations.length > 0) {
    lines.push(SECTION_SEP);
    lines.push('LIMITATIONS:');
    lines.push(SECTION_SEP);
    for (const item of doc.limitations) {
      lines.push(`  [${item.importance}] ${item.title}: ${item.whatWeKnow}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
