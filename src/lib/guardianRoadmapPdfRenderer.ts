/**
 * Clarify Wealth — Guardian Roadmap PDF Renderer V2
 *
 * Renders a ClarifyDocument to a jsPDF document using native text,
 * the Clarify Wealth brand system, selective evidence display,
 * and proper pagination.
 *
 * The renderer only lays out content. It does not interpret, infer,
 * or create planning conclusions.
 */

import { jsPDF } from 'jspdf';
import type {
  ClarifyDocument,
  ClarifySection,
  ClarifyBlock,
  EvidenceTag,
} from './clarifyDocumentTypes';

// ─── Brand palette ─────────────────────────────────────────────────────────────

const BRAND = {
  navy: [15, 58, 94] as [number, number, number],
  gold: [197, 165, 114] as [number, number, number],
  slate: [51, 65, 85] as [number, number, number],
  lightSlate: [100, 116, 139] as [number, number, number],
  paleBg: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const TAG_COLORS: Record<EvidenceTag, [number, number, number]> = {
  parentWish: [29, 78, 216],
  clientUnderstanding: [21, 128, 61],
  worthConfirming: [180, 83, 9],
  professionalReview: [185, 28, 28],
  missingInfo: [100, 116, 139],
};

// Evidence tags that should be DISPLAYED in the Guardian Roadmap.
// parentWish and clientUnderstanding are suppressed — they describe
// ordinary content that doesn't need a visual label.
const DISPLAYED_EVIDENCE_TAGS: Set<EvidenceTag> = new Set([
  'worthConfirming',
  'professionalReview',
  'missingInfo',
]);

// ─── Layout constants ──────────────────────────────────────────────────────────

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_L = 72;
const MARGIN_R = 72;
const MARGIN_T = 80;
const MARGIN_B = 64;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

// ─── PDF state ─────────────────────────────────────────────────────────────────

interface RenderState {
  pdf: jsPDF;
  y: number;
  page: number;
  familyName: string;
  reportDate: string;
  headerImgUrl: string | null;
  footerImgUrl: string | null;
}

function createState(familyName: string, reportDate: string, headerImgUrl: string | null, footerImgUrl: string | null): RenderState {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  pdf.setFont('helvetica', 'normal');
  return { pdf, y: MARGIN_T, page: 1, familyName, reportDate, headerImgUrl, footerImgUrl };
}

// ─── Page management ───────────────────────────────────────────────────────────

// Header image: 1103x165 px → at 468pt wide = ~70pt tall
const HEADER_IMG_W = 468;
const HEADER_IMG_H = 70;
// Footer image: 1103x156 px → at 468pt wide = ~66pt tall
const FOOTER_IMG_W = 468;
const FOOTER_IMG_H = 66;

function headerFooter(state: RenderState): void {
  const { pdf, page, headerImgUrl, footerImgUrl } = state;

  // Header: Clarify Wealth brand image at proper proportions
  if (headerImgUrl) {
    try {
      pdf.addImage(headerImgUrl, 'PNG', MARGIN_L, MARGIN_T - HEADER_IMG_H - 6, HEADER_IMG_W, HEADER_IMG_H);
    } catch {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...BRAND.navy);
      pdf.text('CLARIFY WEALTH', MARGIN_L, MARGIN_T - 18);
    }
  } else {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...BRAND.navy);
    pdf.text('CLARIFY WEALTH', MARGIN_L, MARGIN_T - 18);
  }

  // Header gold line
  pdf.setDrawColor(...BRAND.gold);
  pdf.setLineWidth(0.75);
  pdf.line(MARGIN_L, MARGIN_T - 4, PAGE_W - MARGIN_R, MARGIN_T - 4);

  // Footer: Clarify Wealth branded footer image
  if (footerImgUrl) {
    try {
      pdf.addImage(footerImgUrl, 'PNG', MARGIN_L, PAGE_H - MARGIN_B - FOOTER_IMG_H + 18, FOOTER_IMG_W, FOOTER_IMG_H);
    } catch {
      // Fallback footer
      pdf.setFontSize(7.5);
      pdf.setTextColor(...BRAND.lightSlate);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${state.familyName} — Guardianship Roadmap`, MARGIN_L, PAGE_H - MARGIN_B + 20);
    }
  } else {
    pdf.setFontSize(7.5);
    pdf.setTextColor(...BRAND.lightSlate);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${state.familyName} — Guardianship Roadmap`, MARGIN_L, PAGE_H - MARGIN_B + 20);
  }

  // Page number (always rendered on top of footer image)
  pdf.setFontSize(8);
  pdf.setTextColor(...BRAND.navy);
  pdf.setFont('helvetica', 'normal');
  pdf.text(String(page), PAGE_W - MARGIN_R, PAGE_H - MARGIN_B + 12, { align: 'right' });
}

function newPage(state: RenderState): void {
  state.pdf.addPage();
  state.page += 1;
  state.y = MARGIN_T;
  headerFooter(state);
}

function ensureSpace(state: RenderState, needed: number): void {
  if (state.y + needed > PAGE_H - MARGIN_B) {
    newPage(state);
  }
}

// ─── Text helpers ──────────────────────────────────────────────────────────────

function wrappedText(
  state: RenderState,
  text: string,
  fontSize: number,
  fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
  color: [number, number, number] = BRAND.slate,
  lineGap: number = 1.45,
  maxWidth: number = CONTENT_W,
  x: number = MARGIN_L,
): void {
  const { pdf } = state;
  pdf.setFontSize(fontSize);
  pdf.setFont('helvetica', fontStyle);
  pdf.setTextColor(...color);
  const lines = pdf.splitTextToSize(text, maxWidth) as string[];
  const lineHeight = fontSize * lineGap;

  for (const line of lines) {
    ensureSpace(state, lineHeight);
    pdf.text(line, x, state.y);
    state.y += lineHeight;
  }
}

function shouldShowEvidence(block: ClarifyBlock): boolean {
  if (!block.evidenceTag) return false;
  return DISPLAYED_EVIDENCE_TAGS.has(block.evidenceTag);
}

// ─── Block renderers ───────────────────────────────────────────────────────────

function renderHeading(state: RenderState, block: ClarifyBlock): void {
  if (block.pageBreakBefore) {
    newPage(state);
  }
  state.y += 16;
  ensureSpace(state, 50);
  wrappedText(state, block.text || '', 20, 'bold', BRAND.navy, 1.15);
  if (block.subtitle) {
    state.y += 2;
    wrappedText(state, block.subtitle, 10, 'italic', BRAND.lightSlate, 1.3);
  }
  state.pdf.setDrawColor(...BRAND.gold);
  state.pdf.setLineWidth(1.5);
  state.pdf.line(MARGIN_L, state.y, MARGIN_L + 50, state.y);
  state.y += 12;
}

function renderSubheading(state: RenderState, block: ClarifyBlock): void {
  if (state.y > MARGIN_T + 10) state.y += 8;
  ensureSpace(state, 24);
  wrappedText(state, block.text || '', 11.5, 'bold', BRAND.slate, 1.3);
  state.y += 4;
}

function renderBody(state: RenderState, block: ClarifyBlock): void {
  wrappedText(state, block.text || '', 10.5, 'normal', BRAND.slate, 1.5);
  state.y += 5;
}

function renderBullets(state: RenderState, block: ClarifyBlock): void {
  const { pdf } = state;
  const items = block.items || [];
  pdf.setFontSize(10.5);
  pdf.setTextColor(...BRAND.slate);

  for (const item of items) {
    const lines = pdf.splitTextToSize(item, CONTENT_W - 20) as string[];
    const lineHeight = 10.5 * 1.5;
    ensureSpace(state, lineHeight * lines.length);
    pdf.setTextColor(...BRAND.gold);
    pdf.text('\u2022', MARGIN_L + 4, state.y);
    pdf.setTextColor(...BRAND.slate);
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) ensureSpace(state, lineHeight);
      pdf.text(lines[i], MARGIN_L + 16, state.y);
      state.y += lineHeight;
    }
  }
  state.y += 5;
}

function renderCallout(state: RenderState, block: ClarifyBlock): void {
  if (!shouldShowEvidence(block)) {
    // Still render the text, just without the callout box
    renderBody(state, block);
    return;
  }

  const { pdf } = state;
  const tagColor = block.evidenceTag ? TAG_COLORS[block.evidenceTag] : BRAND.lightSlate;
  const bgColor: [number, number, number] = [252, 250, 245];

  const lines = pdf.splitTextToSize(block.text || '', CONTENT_W - 36) as string[];
  const boxH = 20 + lines.length * 13 + 8;

  ensureSpace(state, boxH + 8);

  pdf.setFillColor(...bgColor);
  pdf.setDrawColor(...BRAND.border);
  pdf.setLineWidth(0.5);
  pdf.rect(MARGIN_L, state.y, CONTENT_W, boxH, 'S');
  pdf.setFillColor(...tagColor);
  pdf.rect(MARGIN_L, state.y, 3, boxH, 'F');

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...tagColor);
  pdf.text((block.evidenceLabel || '').toUpperCase(), MARGIN_L + 12, state.y + 13);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...BRAND.slate);
  let ty = state.y + 26;
  for (const line of lines) {
    pdf.text(line, MARGIN_L + 12, ty);
    ty += 13;
  }

  state.y += boxH + 8;
}

function renderRoleTable(state: RenderState, block: ClarifyBlock): void {
  const { pdf } = state;
  const rows = block.rows || [];
  if (rows.length === 0) return;

  const colWidths = [110, 100, 160, 98];
  const headers = ['Role', 'Person', 'What They Handle', 'When to Contact'];

  pdf.setFillColor(...BRAND.paleBg);
  pdf.rect(MARGIN_L, state.y, CONTENT_W, 20, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...BRAND.navy);
  let x = MARGIN_L + 6;
  for (let i = 0; i < headers.length; i++) {
    pdf.text(headers[i], x, state.y + 13);
    x += colWidths[i];
  }
  state.y += 20;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...BRAND.slate);
  for (const row of rows) {
    const roleLabel = row.appointed ? `${row.role} (appointed)` : row.role;
    const cells = [roleLabel, row.person, row.responsibility, row.whenToContact || ''];
    const maxLines = Math.max(...cells.map((c, i) => {
      const lines = pdf.splitTextToSize(c, colWidths[i] - 8) as string[];
      return lines.length;
    }));
    const rowH = Math.max(18, maxLines * 12 + 6);
    ensureSpace(state, rowH);

    pdf.setDrawColor(...BRAND.border);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_L, state.y + rowH, MARGIN_L + CONTENT_W, state.y + rowH);

    x = MARGIN_L + 6;
    for (let i = 0; i < cells.length; i++) {
      const lines = pdf.splitTextToSize(cells[i], colWidths[i] - 8) as string[];
      for (let j = 0; j < lines.length; j++) {
        pdf.text(lines[j], x, state.y + 13 + j * 12);
      }
      x += colWidths[i];
    }
    state.y += rowH;
  }
  state.y += 8;
}

function renderActionList(state: RenderState, block: ClarifyBlock): void {
  const { pdf } = state;
  const lines = pdf.splitTextToSize(block.text || '', CONTENT_W - 36) as string[];
  const boxH = 16 + lines.length * 13 + 8;

  ensureSpace(state, boxH + 6);

  pdf.setFillColor(...BRAND.gold);
  pdf.rect(MARGIN_L, state.y, 3, boxH, 'F');
  pdf.setFillColor(255, 251, 245);
  pdf.rect(MARGIN_L + 3, state.y, CONTENT_W - 3, boxH, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...BRAND.navy);
  if (block.title) {
    pdf.text(block.title, MARGIN_L + 12, state.y + 14);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...BRAND.slate);
  let ty = state.y + (block.title ? 26 : 14);
  for (const line of lines) {
    pdf.text(line, MARGIN_L + 12, ty);
    ty += 13;
  }

  state.y += boxH + 6;
}

function renderQuickRef(state: RenderState, block: ClarifyBlock): void {
  const { pdf } = state;
  const items = block.items || [];
  pdf.setFontSize(9.5);
  pdf.setTextColor(...BRAND.slate);

  for (const item of items) {
    const lines = pdf.splitTextToSize(item, CONTENT_W) as string[];
    ensureSpace(state, 16);
    pdf.text(lines[0], MARGIN_L, state.y);
    state.y += 15;
    pdf.setDrawColor(...BRAND.border);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_L, state.y - 4, MARGIN_L + CONTENT_W, state.y - 4);
  }
  state.y += 6;
}

function renderLimitation(state: RenderState, block: ClarifyBlock): void {
  const { pdf } = state;
  const lines = pdf.splitTextToSize(block.text || '', CONTENT_W - 32) as string[];
  const boxH = 18 + lines.length * 12 + 8;

  ensureSpace(state, boxH + 6);

  pdf.setFillColor(...BRAND.paleBg);
  pdf.setDrawColor(...BRAND.border);
  pdf.setLineWidth(0.5);
  pdf.rect(MARGIN_L, state.y, CONTENT_W, boxH, 'S');
  pdf.setFillColor(...BRAND.lightSlate);
  pdf.rect(MARGIN_L, state.y, 3, boxH, 'F');

  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...BRAND.slate);
  if (block.title) {
    pdf.text(block.title, MARGIN_L + 12, state.y + 14);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...BRAND.lightSlate);
  let ty = state.y + (block.title ? 25 : 15);
  for (const line of lines) {
    pdf.text(line, MARGIN_L + 12, ty);
    ty += 12;
  }

  state.y += boxH + 6;
}

// ─── Parent voice block ────────────────────────────────────────────────────────

function renderParentVoice(state: RenderState, block: ClarifyBlock): void {
  const { pdf } = state;
  const lines = pdf.splitTextToSize(block.text || '', CONTENT_W - 36) as string[];
  const boxH = 24 + lines.length * 13 + 10;

  ensureSpace(state, boxH + 8);

  // Warm background, left gold accent
  pdf.setFillColor(253, 249, 240);
  pdf.setDrawColor(...BRAND.gold);
  pdf.setLineWidth(0.75);
  pdf.rect(MARGIN_L, state.y, CONTENT_W, boxH, 'S');
  pdf.setFillColor(...BRAND.gold);
  pdf.rect(MARGIN_L, state.y, 3, boxH, 'F');

  if (block.heading) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...BRAND.gold);
    pdf.text(block.heading.toUpperCase(), MARGIN_L + 12, state.y + 14);
  }

  pdf.setFontSize(10.5);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...BRAND.slate);
  let ty = state.y + (block.heading ? 28 : 16);
  for (const line of lines) {
    pdf.text(line, MARGIN_L + 12, ty);
    ty += 13;
  }

  state.y += boxH + 8;
}

// ─── Block dispatcher ──────────────────────────────────────────────────────────

function renderBlock(state: RenderState, block: ClarifyBlock): void {
  switch (block.type) {
    case 'heading': renderHeading(state, block); break;
    case 'subheading': renderSubheading(state, block); break;
    case 'body': renderBody(state, block); break;
    case 'bullets': renderBullets(state, block); break;
    case 'callout': renderCallout(state, block); break;
    case 'roleTable': renderRoleTable(state, block); break;
    case 'actionList': renderActionList(state, block); break;
    case 'quickRef': renderQuickRef(state, block); break;
    case 'limitation': renderLimitation(state, block); break;
    case 'parentVoice': renderParentVoice(state, block); break;
    case 'pageBreak': newPage(state); break;
    default: break;
  }
}

// ─── Section renderer ──────────────────────────────────────────────────────────

function renderSection(state: RenderState, section: ClarifySection): void {
  if (state.y > MARGIN_T + 20) state.y += 14;
  ensureSpace(state, 40);

  wrappedText(state, section.heading, 15, 'bold', BRAND.navy, 1.25);
  state.pdf.setDrawColor(...BRAND.gold);
  state.pdf.setLineWidth(1.5);
  state.pdf.line(MARGIN_L, state.y - 2, MARGIN_L + 50, state.y - 2);
  state.y += 8;

  if (section.purpose) {
    wrappedText(state, section.purpose, 9.5, 'italic', BRAND.lightSlate, 1.35);
    state.y += 6;
  }

  for (const block of section.blocks) {
    renderBlock(state, block);
  }
}

// ─── Cover page ────────────────────────────────────────────────────────────────

function renderCover(state: RenderState, doc: ClarifyDocument): void {
  const { pdf, headerImgUrl } = state;
  const cover = doc.cover;

  // Clarify Wealth brand image centered on cover, at proper proportions
  // Header image is 1103x165 → at 300pt wide = ~45pt tall
  const coverImgW = 300;
  const coverImgH = 45;
  if (headerImgUrl) {
    try {
      pdf.addImage(headerImgUrl, 'PNG', PAGE_W / 2 - coverImgW / 2, 140, coverImgW, coverImgH);
    } catch {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...BRAND.navy);
      pdf.text('CLARIFY WEALTH', PAGE_W / 2, 170, { align: 'center' });
    }
  } else {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...BRAND.navy);
    pdf.text('CLARIFY WEALTH', PAGE_W / 2, 170, { align: 'center' });
  }

  // Gold line
  pdf.setDrawColor(...BRAND.gold);
  pdf.setLineWidth(1.5);
  pdf.line(PAGE_W / 2 - 80, 200, PAGE_W / 2 + 80, 200);

  // Title
  pdf.setFontSize(34);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...BRAND.navy);
  pdf.text('Guardianship Roadmap', PAGE_W / 2, 260, { align: 'center' });

  // Subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...BRAND.lightSlate);
  const subLines = pdf.splitTextToSize(cover.subtitle, 380) as string[];
  let sy = 290;
  for (const line of subLines) {
    pdf.text(line, PAGE_W / 2, sy, { align: 'center' });
    sy += 16;
  }

  // Meta
  const metaY = 420;
  const metaItems = [
    { label: 'PREPARED FOR', value: cover.familyName },
    { label: 'FOR', value: cover.childNames.join(', ') || 'Your children' },
    { label: 'PREPARED', value: cover.preparedDate },
  ];

  let my = metaY;
  for (const item of metaItems) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...BRAND.lightSlate);
    pdf.text(item.label, PAGE_W / 2, my, { align: 'center' });
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...BRAND.slate);
    pdf.text(item.value, PAGE_W / 2, my + 16, { align: 'center' });
    my += 42;
  }

  // No header/footer on cover — page stays at 1
}

// ─── Intro / About This Roadmap ────────────────────────────────────────────────

function renderIntro(state: RenderState, doc: ClarifyDocument): void {
  // Start on page 2 (first interior page)
  newPage(state);

  // Section heading with generous spacing to prevent rule collision
  state.y += 8;
  wrappedText(state, 'About This Roadmap', 16, 'bold', BRAND.navy, 1.25);
  state.y += 6;
  // Gold rule positioned safely below the heading baseline
  state.pdf.setDrawColor(...BRAND.gold);
  state.pdf.setLineWidth(1.5);
  state.pdf.line(MARGIN_L, state.y, MARGIN_L + 50, state.y);
  state.y += 16;

  const familyName = doc.cover.familyName || 'the parents';
  const childNames = doc.cover.childNames.length > 0
    ? doc.cover.childNames
    : ['the children'];

  const introTexts = [
    `If you are reading this because you have had to step into ${childNames.length === 1 ? `${childNames[0]}'s` : 'the children\'s'} life, ${familyName} recognize that their world may have changed profoundly — and yours may have too.`,
    `${familyName} know that caring for ${childNames.length === 1 ? childNames[0] : 'their children'} could affect far more than the children themselves. It could change your home, your routines, your work, your finances and the lives of the people in your family.`,
    `No planning document can anticipate every circumstance or provide every answer. This Roadmap is intended to give you an organized starting point: what ${familyName} wanted you to know about ${childNames.length === 1 ? childNames[0] : 'their children'}, the people and routines that matter to them, the plans they have made, and the practical information that may help you find your footing.`,
    `Some legal, financial, medical and practical matters will still need to be confirmed with the appropriate professionals.`,
  ];

  for (const text of introTexts) {
    wrappedText(state, text, 10.5, 'normal', BRAND.slate, 1.55);
    state.y += 8;
  }
}

// ─── Quick reference section ───────────────────────────────────────────────────

function renderQuickReference(state: RenderState, doc: ClarifyDocument): void {
  if (!doc.quickReference || doc.quickReference.length === 0) return;
  renderSection(state, {
    id: 'quick-reference',
    heading: 'Quick Reference',
    blocks: [{
      id: 'qr',
      type: 'quickRef',
      items: doc.quickReference.map(q => `${q.label}: ${q.value}`),
    }],
  });
}

// ─── Brand image loading ─────────────────────────────────────────────────────

let cachedHeaderImg: string | null | undefined;
let cachedFooterImg: string | null | undefined;

async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function loadHeaderImg(): Promise<string | null> {
  if (cachedHeaderImg !== undefined) return cachedHeaderImg;
  cachedHeaderImg = await loadImageDataUrl('/branding/word/media/image1.png');
  return cachedHeaderImg;
}

async function loadFooterImg(): Promise<string | null> {
  if (cachedFooterImg !== undefined) return cachedFooterImg;
  cachedFooterImg = await loadImageDataUrl('/branding/word/media/image2.png');
  return cachedFooterImg;
}

// ─── Main renderer ─────────────────────────────────────────────────────────────

export function renderGuardianRoadmapPdf(
  doc: ClarifyDocument,
  headerImgUrl?: string | null,
  footerImgUrl?: string | null,
): jsPDF {
  const state = createState(doc.cover.familyName, doc.cover.preparedDate, headerImgUrl ?? null, footerImgUrl ?? null);

  // Cover page (page 1, no header/footer)
  renderCover(state, doc);

  // Page 2: About This Roadmap (NOT a separate blank page)
  renderIntro(state, doc);

  // Render all content sections
  for (const section of doc.sections) {
    renderSection(state, section);
  }

  // Quick reference
  renderQuickReference(state, doc);

  return state.pdf;
}

export async function generateGuardianRoadmapPdf(doc: ClarifyDocument): Promise<Blob> {
  const [header, footer] = await Promise.all([loadHeaderImg(), loadFooterImg()]);
  const pdf = renderGuardianRoadmapPdf(doc, header, footer);
  return pdf.output('blob');
}
