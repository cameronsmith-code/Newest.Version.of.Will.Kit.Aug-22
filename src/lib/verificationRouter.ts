/**
 * Verification Router
 *
 * Maps issue types to the appropriate professional reviewer.
 * Uses current active Professional Team records where available.
 */

import type { VerificationType, LimitationReason } from './outputConfidenceTypes';
import type { ProfessionalAdvisor } from './referentialIntegrity';

export type IssueCategory =
  | 'willInterpretation'
  | 'trustPowers'
  | 'guardianAppointment'
  | 'corporateTax'
  | 'beneficiaryDesignation'
  | 'insurancePolicyDetail'
  | 'schoolTransition'
  | 'medicalRecords'
  | 'rdspAccount'
  | 'estateDocumentFlexibility'
  | 'shareholderAgreement'
  | 'poaAuthority'
  | 'generalLegal'
  | 'generalTax'
  | 'generalMedical'
  | 'generalFinancial';

const ISSUE_TO_VERIFICATION: Record<IssueCategory, VerificationType[]> = {
  willInterpretation: ['estateLawyer'],
  trustPowers: ['estateLawyer'],
  guardianAppointment: ['estateLawyer'],
  corporateTax: ['accountant', 'estateLawyer'],
  beneficiaryDesignation: ['financialInstitution', 'financialPlanner'],
  insurancePolicyDetail: ['insuranceProfessional'],
  schoolTransition: ['school'],
  medicalRecords: ['healthcareProvider'],
  rdspAccount: ['financialInstitution', 'financialPlanner'],
  estateDocumentFlexibility: ['estateLawyer'],
  shareholderAgreement: ['lawyer', 'accountant'],
  poaAuthority: ['estateLawyer'],
  generalLegal: ['estateLawyer'],
  generalTax: ['accountant'],
  generalMedical: ['physician'],
  generalFinancial: ['financialPlanner'],
};

export function getRecommendedVerificationType(
  issueCategory: IssueCategory
): VerificationType | undefined {
  const types = ISSUE_TO_VERIFICATION[issueCategory];
  return types?.[0];
}

export function getRecommendedVerificationTypes(
  issueCategory: IssueCategory
): VerificationType[] {
  return ISSUE_TO_VERIFICATION[issueCategory] || ['other'];
}

/**
 * Map a LimitationReason to a default IssueCategory for verification routing.
 */
export function limitationReasonToIssueCategory(
  reason: LimitationReason
): IssueCategory {
  switch (reason) {
    case 'legalInterpretationRequired':
      return 'generalLegal';
    case 'taxInterpretationRequired':
      return 'generalTax';
    case 'medicalInterpretationRequired':
      return 'generalMedical';
    case 'professionalJudgmentRequired':
      return 'generalFinancial';
    case 'documentNotReviewed':
      return 'generalLegal';
    default:
      return 'generalLegal';
  }
}

export type ProfessionalMatch = {
  verificationType: VerificationType;
  advisor?: ProfessionalAdvisor;
};

/**
 * Find the best-matching professional from the client's active Professional Team
 * for the given verification types.
 *
 * Priority:
 * 1. Exact type match (e.g. estateLawyer → lawyer with wills/estate services)
 * 2. First available professional in the verification chain
 */
export function findProfessionalForVerification(
  verificationTypes: VerificationType[],
  advisors: ProfessionalAdvisor[]
): ProfessionalMatch[] {
  const matches: ProfessionalMatch[] = [];

  for (const vType of verificationTypes) {
    const advisor = findAdvisorByVerificationType(vType, advisors);
    matches.push({ verificationType: vType, advisor });
  }

  return matches;
}

function findAdvisorByVerificationType(
  vType: VerificationType,
  advisors: ProfessionalAdvisor[]
): ProfessionalAdvisor | undefined {
  switch (vType) {
    case 'estateLawyer':
    case 'lawyer':
      return advisors.find(a =>
        a.type === 'lawyer' &&
        a.active &&
        a.services?.includes('wills_powers_of_attorney')
      ) || advisors.find(a => a.type === 'lawyer' && a.active);

    case 'accountant':
      return advisors.find(a => a.type === 'accountant' && a.active);

    case 'financialPlanner':
      return advisors.find(a => a.type === 'financial' && a.active);

    case 'insuranceProfessional':
      return advisors.find(a => a.type === 'insurance' && a.active);

    default:
      return undefined;
  }
}

/**
 * Build a human-readable reviewer phrase.
 *
 * Example: "Sarah Patel, your estate lawyer"
 * Example: "an estate lawyer" (when no named professional exists)
 */
export function reviewerPhrase(
  verificationType: VerificationType,
  advisor?: ProfessionalAdvisor
): string {
  const roleLabel = VERIFICATION_TYPE_LABELS[verificationType] || 'a professional';

  if (advisor?.name) {
    return `${advisor.name}, your ${roleLabel}`;
  }

  return `an ${roleLabel}`;
}

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  estateLawyer: 'estate lawyer',
  lawyer: 'lawyer',
  accountant: 'accountant',
  financialPlanner: 'financial planner',
  insuranceProfessional: 'insurance professional',
  physician: 'physician',
  healthcareProvider: 'healthcare provider',
  school: 'school',
  trustee: 'trustee',
  financialInstitution: 'financial institution',
  employer: 'employer',
  governmentAgency: 'government agency',
  other: 'professional',
};
