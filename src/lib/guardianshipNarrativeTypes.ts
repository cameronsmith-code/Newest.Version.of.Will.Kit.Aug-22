import type { GuardianshipRoadmapModel } from './guardianshipRoadmapTypes';

export type NarrativeBlockType =
  | 'intro'
  | 'context'
  | 'parentVoice'
  | 'transition'
  | 'action'
  | 'priority'
  | 'readiness'
  | 'crossReference'
  | 'summary';

export type NarrativeImportance =
  | 'primary'
  | 'important'
  | 'supporting'
  | 'reference';

export type NarrativeSourceType =
  | 'knownFact'
  | 'parentPreference'
  | 'parentUnderstanding'
  | 'derived'
  | 'professionalReview';

export type GuardianshipAudience =
  | 'client'
  | 'guardian'
  | 'estateTrustee'
  | 'inheritanceTrustee'
  | 'attorneyForProperty'
  | 'estateLawyer'
  | 'accountant';

export const ALL_AUDIENCES: GuardianshipAudience[] = [
  'client',
  'guardian',
  'estateTrustee',
  'inheritanceTrustee',
  'attorneyForProperty',
  'estateLawyer',
  'accountant',
];

export const CLIENT_PLANNING_AUDIENCES: GuardianshipAudience[] = ['client'];
export const GUARDIAN_AUDIENCES: GuardianshipAudience[] = ['guardian', 'client'];
export const LAWYER_AUDIENCES: GuardianshipAudience[] = ['estateLawyer', 'client'];
export const ACCOUNTANT_AUDIENCES: GuardianshipAudience[] = ['accountant', 'client'];
export const TRUSTEE_AUDIENCES: GuardianshipAudience[] = ['estateTrustee', 'inheritanceTrustee', 'attorneyForProperty', 'client'];

export interface NarrativeBlock {
  id: string;
  ruleId: string;
  type: NarrativeBlockType;
  heading?: string;
  body?: string;
  bullets?: string[];
  childIds?: string[];
  personIds?: string[];
  importance: NarrativeImportance;
  sourceType: NarrativeSourceType;
  audiences?: GuardianshipAudience[];
  evidence?: import('./outputConfidenceTypes').OutputEvidence;
  limitation?: import('./outputConfidenceTypes').NarrativeLimitation;
  nextAction?: import('./outputConfidenceTypes').NextAction;
}

export interface QuickReferenceItem {
  id: string;
  label: string;
  value: string;
  category: 'person' | 'document' | 'financial' | 'role';
  childIds?: string[];
}

export interface ImmediateActionNarrative {
  id: string;
  heading: string;
  body: string;
  personNames: string[];
  childNames: string[];
  priority: number;
  isParentWish: boolean;
  ruleId: string;
}

export interface ReadinessNarrative {
  decisionsMade: NarrativeBlock[];
  thingsWorthConfirming: NarrativeBlock[];
  thingsStillToDo: NarrativeBlock[];
}

export interface GuardianshipChildNarrative {
  childId: string;
  childName: string;
  introduction?: NarrativeBlock[];
  personalProfile?: NarrativeBlock[];
  education?: NarrativeBlock[];
  healthcare?: NarrativeBlock[];
  supportTransition?: NarrativeBlock[];
  peopleAndConnections?: NarrativeBlock[];
  communitiesAndTraditions?: NarrativeBlock[];
  activities?: NarrativeBlock[];
  inheritance?: NarrativeBlock[];
  adultTransition?: NarrativeBlock[];
  futureEducation?: NarrativeBlock[];
}

export interface GuardianshipNarrativeModel {
  familyContext: NarrativeBlock[];
  guardianPlan: NarrativeBlock[];
  children: GuardianshipChildNarrative[];
  familyRoles: NarrativeBlock[];
  financialResources: NarrativeBlock[];
  fundingPhilosophy: NarrativeBlock[];
  coordination: NarrativeBlock[];
  documents: NarrativeBlock[];
  guardianTrust: NarrativeBlock[];
  familyFairness: NarrativeBlock[];
  guardianDiscretion: NarrativeBlock[];
  conversationPrompts: NarrativeBlock[];
  readiness: ReadinessNarrative;
  immediateActions: ImmediateActionNarrative[];
  quickReference: QuickReferenceItem[];
}

export interface NarrativeRule {
  id: string;
  description: string;
}

export type NarrativeContext = {
  model: GuardianshipRoadmapModel;
  clientNames: string[];
  parentLabel: string;
};

export function getParentLabel(clientNames: string[]): string {
  if (clientNames.length === 0) return 'The parents';
  if (clientNames.length === 1) return clientNames[0];
  if (clientNames.length === 2) return `${clientNames[0]} and ${clientNames[1]}`;
  return clientNames.join(' and ');
}

export function childName(model: GuardianshipRoadmapModel, childId: string): string {
  const child = model.children.find(c => c.childId === childId);
  return child?.nickname || child?.name || childId;
}
