/**
 * Clarify Wealth — HTML Preview Renderer
 *
 * Renders a ClarifyDocument as a self-contained HTML string for
 * in-browser QA preview.  The PDF renderer uses the same document
 * model, so what you see here is what the PDF will contain.
 */

import type {
  ClarifyDocument,
  ClarifySection,
  ClarifyBlock,
  EvidenceTag,
} from './clarifyDocumentTypes';
import { EVIDENCE_TAG_LABELS } from './clarifyDocumentTypes';

const TAG_COLORS: Record<EvidenceTag, { bg: string; text: string; border: string }> = {
  parentWish: { bg: '#eef6ff', text: '#1d4ed8', border: '#bfdbfe' },
  clientUnderstanding: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  worthConfirming: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  professionalReview: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  missingInfo: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const DISPLAYED_EVIDENCE_TAGS: Set<EvidenceTag> = new Set([
  'worthConfirming',
  'professionalReview',
  'missingInfo',
]);

function evidenceTagHtml(tag?: EvidenceTag, label?: string): string {
  if (!tag || !label) return '';
  if (!DISPLAYED_EVIDENCE_TAGS.has(tag)) return '';
  const c = TAG_COLORS[tag];
  return `<span class="ev-tag" style="background:${c.bg};color:${c.text};border:1px solid ${c.border}">${esc(label)}</span>`;
}

function renderBlock(block: ClarifyBlock): string {
  const tag = evidenceTagHtml(block.evidenceTag, block.evidenceLabel);

  switch (block.type) {
    case 'heading':
      return `<div class="child-divider" ${block.pageBreakBefore ? 'style="page-break-before:always"' : ''}>
        <h2 class="child-heading">${esc(block.text || '')}</h2>
        ${block.subtitle ? `<p class="child-subtitle">${esc(block.subtitle)}</p>` : ''}
        <div class="child-gold-line"></div>
      </div>`;

    case 'subheading':
      return `<h3 class="sub-heading"${block.keepWithNext ? ' style="page-break-after:avoid"' : ''}>${esc(block.text || '')} ${tag}</h3>`;

    case 'body':
      return `<p class="body-text">${esc(block.text || '')} ${tag}</p>`;

    case 'bullets':
      return `<ul class="bullet-list">${(block.items || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;

    case 'callout': {
      if (!block.evidenceTag || !DISPLAYED_EVIDENCE_TAGS.has(block.evidenceTag)) {
        return `<p class="body-text">${esc(block.text || '')}</p>`;
      }
      const c = TAG_COLORS[block.evidenceTag];
      return `<div class="callout" style="background:${c.bg};border-color:${c.border}"><span class="callout-tag" style="color:${c.text}">${esc(block.evidenceLabel || '')}</span><p>${esc(block.text || '')}</p></div>`;
    }

    case 'parentVoice': {
      return `<div class="parent-voice"><span class="parent-voice-tag">${block.heading ? esc(block.heading) : 'In Their Own Words'}</span><p>${esc(block.text || '')}</p></div>`;
    }

    case 'card':
      return `<div class="info-card"><h4>${esc(block.title || '')}</h4>${(block.items || []).map(i => `<p>${esc(i)}</p>`).join('')} ${tag}</div>`;

    case 'personCard': {
      const cards = block.cards || [];
      return cards.map(c => {
        const tagHtml = evidenceTagHtml(c.evidenceTag, c.evidenceTag ? EVIDENCE_TAG_LABELS[c.evidenceTag] : undefined);
        return `<div class="person-card"><h4>${esc(c.title)}</h4>${c.subtitle ? `<p class="card-subtitle">${esc(c.subtitle)}</p>` : ''}${c.lines.map(l => `<p>${esc(l)}</p>`).join('')} ${tagHtml}</div>`;
      }).join('');
    }

    case 'roleTable': {
      const rows = block.rows || [];
      return `<table class="role-table"><thead><tr><th>Role</th><th>Person</th><th>What They Handle</th><th>When to Contact</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.role)}</td><td>${esc(r.person)}</td><td>${esc(r.responsibility)}</td><td>${esc(r.whenToContact || '')}</td></tr>`).join('')}</tbody></table>`;
    }

    case 'actionList':
      return `<div class="action-item"><div class="action-title">${esc(block.title || '')}</div><p>${esc(block.text || '')}</p> ${tag}</div>`;

    case 'quickRef':
      return `<div class="quick-ref"><ul>${(block.items || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`;

    case 'limitation':
      return `<div class="limitation-box"><h4>${esc(block.title || '')}</h4><p>${esc(block.text || '')}</p></div>`;

    case 'divider':
      return '<hr class="doc-divider" />';

    case 'spacer':
      return '<div class="doc-spacer"></div>';

    case 'pageBreak':
      return '<div style="page-break-after:always"></div>';

    default:
      return '';
  }
}

function renderSection(section: ClarifySection): string {
  const blocks = section.blocks.map(renderBlock).join('\n');
  return `<section class="doc-section" id="${esc(section.id)}">
    <h2 class="section-heading">${esc(section.heading)}</h2>
    ${section.purpose ? `<p class="section-purpose">${esc(section.purpose)}</p>` : ''}
    ${blocks}
  </section>`;
}

function renderCover(doc: ClarifyDocument): string {
  const cover = doc.cover;
  return `<section class="cover-page">
    <div class="cover-content">
      <div class="cover-brand">Clarify Wealth</div>
      <h1 class="cover-title">Guardianship Roadmap</h1>
      <p class="cover-subtitle">${esc(cover.subtitle)}</p>
      <div class="cover-meta">
        <p class="cover-label">Prepared for</p>
        <p class="cover-value">${esc(cover.familyName)}</p>
        <p class="cover-label">For</p>
        <p class="cover-value">${cover.childNames.map(esc).join(', ')}</p>
        <p class="cover-label">Prepared</p>
        <p class="cover-value">${esc(cover.preparedDate)}</p>
      </div>
    </div>
  </section>`;
}

function renderIntroPage(): string {
  return `<section class="intro-page">
    <h2 class="intro-heading">About This Roadmap</h2>
    <div class="intro-gold-line"></div>
    <p class="intro-body">
      This Guardianship Roadmap was prepared from information provided by the parents through
      the Will Companion Kit. It reflects their wishes, planning intentions, and the information
      available when the Roadmap was prepared.
    </p>
    <p class="intro-body">
      It does not independently verify legal documents, legal authority, tax treatment, medical
      information, or account values. Important decisions should be confirmed with the appropriate
      lawyer, accountant, financial planner, or healthcare professional.
    </p>
    <p class="intro-body">
      This document is intended to help a guardian understand the family's planning intentions and
      practical information — so they can focus on the children, not on figuring out what the
      parents would have wanted.
    </p>
  </section>`;
}

export function renderClarifyDocumentHtml(doc: ClarifyDocument): string {
  const cover = renderCover(doc);
  const intro = renderIntroPage();
  const sections = doc.sections.map(renderSection).join('\n');

  // Quick reference section
  let quickRefHtml = '';
  if (doc.quickReference && doc.quickReference.length > 0) {
    quickRefHtml = renderSection({
      id: 'quick-reference',
      heading: 'Quick Reference',
      blocks: [{
        id: 'qr',
        type: 'quickRef',
        items: doc.quickReference.map(q => `${q.label}: ${q.value}`),
      }],
    });
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(doc.title)} — ${esc(doc.cover.familyName)}</title>
<style>
  @page { margin: 0.75in 0.85in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 11pt;
    max-width: 800px;
    margin: 0 auto;
    background: #f8fafc;
    padding: 20px;
  }
  /* Cover */
  .cover-page {
    text-align: center;
    padding: 120px 40px 80px;
    page-break-after: always;
    background: #fff;
  }
  .cover-brand {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 14pt;
    letter-spacing: 4px;
    color: #0f3a5e;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 60px;
    border-bottom: 2px solid #c5a572;
    display: inline-block;
    padding-bottom: 10px;
  }
  .cover-title {
    font-size: 32pt;
    color: #0f3a5e;
    font-weight: 400;
    margin-bottom: 16px;
    letter-spacing: 1px;
  }
  .cover-subtitle {
    font-size: 13pt;
    color: #64748b;
    font-style: italic;
    margin-bottom: 60px;
  }
  .cover-meta { text-align: left; max-width: 360px; margin: 0 auto; }
  .cover-label {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #94a3b8;
    margin-top: 20px;
  }
  .cover-value {
    font-size: 13pt;
    color: #1e293b;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  /* Intro */
  .intro-page {
    page-break-after: always;
    background: #fff;
    padding: 40px;
  }
  .intro-heading {
    font-size: 18pt;
    color: #0f3a5e;
    margin-bottom: 24px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
  }
  .intro-body { margin-bottom: 16px; color: #334155; }
  /* Sections */
  .doc-section {
    background: #fff;
    margin-bottom: 20px;
    padding: 30px 40px;
    page-break-inside: auto;
  }
  .section-heading {
    font-size: 17pt;
    color: #0f3a5e;
    margin-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    page-break-after: avoid;
  }
  .section-purpose {
    font-size: 10pt;
    color: #94a3b8;
    font-style: italic;
    margin-bottom: 16px;
  }
  .child-heading {
    font-size: 20pt;
    color: #0f3a5e;
    margin-top: 0;
    margin-bottom: 4px;
    page-break-after: avoid;
  }
  .child-subtitle {
    font-size: 11pt;
    color: #64748b;
    font-style: italic;
    margin-bottom: 8px;
  }
  .child-gold-line {
    width: 50px;
    height: 2px;
    background: #c5a572;
    margin-bottom: 16px;
  }
  .child-divider {
    margin-top: 20px;
    page-break-inside: avoid;
  }
  .sub-heading {
    font-size: 12pt;
    color: #334155;
    margin-top: 18px;
    margin-bottom: 6px;
    page-break-after: avoid;
    font-weight: 600;
  }
  .body-text {
    margin-bottom: 12px;
    color: #334155;
  }
  .bullet-list {
    margin: 8px 0 12px 20px;
    color: #334155;
  }
  .bullet-list li { margin-bottom: 4px; }
  /* Evidence tags */
  .ev-tag {
    display: inline-block;
    font-size: 8pt;
    padding: 2px 8px;
    border-radius: 3px;
    margin-left: 6px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    vertical-align: middle;
  }
  /* Callouts */
  .callout {
    border-left: 3px solid;
    padding: 12px 16px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
  }
  .callout-tag {
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: block;
    margin-bottom: 4px;
  }
  .callout p { font-size: 10pt; color: #475569; }
  /* Cards */
  .info-card, .person-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 16px;
    margin: 12px 0;
    page-break-inside: avoid;
  }
  .info-card h4, .person-card h4 {
    font-size: 11pt;
    color: #0f3a5e;
    margin-bottom: 6px;
  }
  .card-subtitle { font-size: 9pt; color: #64748b; margin-bottom: 8px; font-style: italic; }
  /* Role table */
  .role-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10pt;
  }
  .role-table th {
    text-align: left;
    padding: 8px 10px;
    background: #f1f5f9;
    color: #0f3a5e;
    font-size: 9pt;
    border-bottom: 2px solid #cbd5e1;
  }
  .role-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  /* Actions */
  .action-item {
    border-left: 3px solid #c5a572;
    padding: 10px 16px;
    margin: 10px 0;
    background: #fffbf5;
    page-break-inside: avoid;
  }
  .action-title {
    font-size: 11pt;
    font-weight: 600;
    color: #0f3a5e;
    margin-bottom: 4px;
  }
  /* Quick ref */
  .quick-ref ul {
    list-style: none;
    margin: 0;
  }
  .quick-ref li {
    padding: 6px 0;
    border-bottom: 1px solid #f1f5f9;
    font-size: 10pt;
  }
  /* Limitations */
  .limitation-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #94a3b8;
    padding: 14px 16px;
    margin: 10px 0;
    page-break-inside: avoid;
  }
  .limitation-box h4 {
    font-size: 10pt;
    color: #475569;
    margin-bottom: 4px;
  }
  .limitation-box p {
    font-size: 10pt;
    color: #64748b;
  }
  .intro-gold-line {
    width: 50px;
    height: 2px;
    background: #c5a572;
    margin-bottom: 16px;
  }
  /* Parent voice */
  .parent-voice {
    background: #fdf9f0;
    border: 1px solid #c5a572;
    border-left: 3px solid #c5a572;
    padding: 16px 20px;
    margin: 14px 0;
    page-break-inside: avoid;
    border-radius: 0 4px 4px 0;
  }
  .parent-voice-tag {
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #c5a572;
    display: block;
    margin-bottom: 6px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .parent-voice p {
    font-size: 11pt;
    color: #334155;
    font-style: italic;
  }
  /* Print */
  @media print {
    body { background: #fff; padding: 0; max-width: none; }
    .doc-section { padding: 20px 0; margin: 0; }
    .cover-page { padding: 200px 60px 100px; }
  }
</style>
</head>
<body>
${cover}
${intro}
${sections}
${quickRefHtml}
</body>
</html>`;
}
