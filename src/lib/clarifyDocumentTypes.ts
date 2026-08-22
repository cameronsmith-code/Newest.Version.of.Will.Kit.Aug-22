/**
 * Clarify Wealth Document Component System
 *
 * Reusable document model that all audience renderers (Guardian, Client,
 * Lawyer, Accountant) inherit.  The renderer converts a
 * GuardianshipAudienceDocument into these neutral components, then a
 * PDF or HTML writer turns them into the final output.
 *
 * The components carry NO planning conclusions — they only describe
 * layout, typography, and visual treatment.
 */

export type ClarifyBlockType =
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bullets'
  | 'callout'
  | 'card'
  | 'personCard'
  | 'roleTable'
  | 'actionList'
  | 'quickRef'
  | 'limitation'
  | 'parentVoice'
  | 'divider'
  | 'spacer'
  | 'pageBreak'
  | 'coverPage'
  | 'introPage';

export type EvidenceTag =
  | 'parentWish'
  | 'clientUnderstanding'
  | 'worthConfirming'
  | 'professionalReview'
  | 'missingInfo';

export interface ClarifyBlock {
  id: string;
  type: ClarifyBlockType;
  text?: string;
  title?: string;
  heading?: string;
  subtitle?: string;
  items?: string[];
  rows?: ClarifyTableRow[];
  cards?: ClarifyCard[];
  evidenceTag?: EvidenceTag;
  evidenceLabel?: string;
  keepWithNext?: boolean;
  pageBreakBefore?: boolean;
  meta?: Record<string, string>;
}

export interface ClarifyTableRow {
  role: string;
  person: string;
  responsibility: string;
  whenToContact?: string;
  appointed?: boolean;
}

export interface ClarifyCard {
  title: string;
  subtitle?: string;
  lines: string[];
  evidenceTag?: EvidenceTag;
}

export interface ClarifySection {
  id: string;
  heading: string;
  purpose?: string;
  blocks: ClarifyBlock[];
  childName?: string;
  collapsible?: boolean;
}

export interface ClarifyCoverInfo {
  familyName: string;
  childNames: string[];
  preparedDate: string;
  subtitle: string;
}

export interface ClarifyDocument {
  title: string;
  subtitle: string;
  cover: ClarifyCoverInfo;
  sections: ClarifySection[];
  quickReference?: ClarifyQuickRefEntry[];
  limitations?: ClarifyLimitationEntry[];
  metadata: {
    audience: string;
    generatedAt: string;
    familyName: string;
  };
}

export interface ClarifyQuickRefEntry {
  label: string;
  value: string;
  category: string;
}

export interface ClarifyLimitationEntry {
  title: string;
  body: string;
  importance: string;
}

// ─── Evidence tag display labels ─────────────────────────────────────────────

export const EVIDENCE_TAG_LABELS: Record<EvidenceTag, string> = {
  parentWish: 'Parent Wish',
  clientUnderstanding: 'Client Understanding',
  worthConfirming: 'Worth Confirming',
  professionalReview: 'Professional Review',
  missingInfo: 'Information Not Yet Captured',
};
