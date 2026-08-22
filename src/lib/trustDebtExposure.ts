import type { FamilyTrust, TrustDebt, ExposureClassification } from './familyTrustTypes';
import type { EntityEntry, EntityRelationship } from './entityRegistryTypes';
import type { PersonEntry } from './personRepositoryTypes';

export type TrustExposureAssessment = {
  classification: ExposureClassification;
  clientTrusteeNames: string[];
  allTrusteeNames: string[];
  clientGuarantors: string[];
  allGuarantors: string[];
  hasPersonalGuarantee: boolean;
  guaranteeUnclear: boolean;
  recourseUnclear: boolean;
  hasClientTrustee: boolean;
  hasClientGuarantor: boolean;
  reviewFlag?: string;
  reviewLevel: 'informational' | 'warning';
};

export function classifyTrustDebtExposure(
  debt: TrustDebt,
  trust: FamilyTrust,
  _relationships: EntityRelationship[],
  _entities: EntityEntry[],
  _people: PersonEntry[]
): TrustExposureAssessment {
  const allTrusteeNames = trust.trustees.map((t) => t.personName);
  const clientTrusteeNames = trust.trustees.filter((t) => t.isClient).map((t) => t.personName);
  const hasClientTrustee = clientTrusteeNames.length > 0;

  const allGuarantors: string[] = [];
  const clientGuarantors: string[] = [];
  if (debt.hasPersonalGuarantee === 'yes' && debt.guarantorName) {
    allGuarantors.push(debt.guarantorName);
    const guarantorIsClient = trust.trustees.some(
      (t) => t.isClient && (
        (debt.guarantorPersonId && t.personId === debt.guarantorPersonId) ||
        (!debt.guarantorPersonId && t.personName === debt.guarantorName)
      )
    );
    if (guarantorIsClient) {
      clientGuarantors.push(debt.guarantorName);
    }
  }
  const hasClientGuarantor = clientGuarantors.length > 0;

  const hasPersonalGuarantee = debt.hasPersonalGuarantee === 'yes';
  const guaranteeUnclear = debt.hasPersonalGuarantee === 'not_sure';
  const recourseUnclear = debt.limitedRecourse === 'not_sure' || debt.limitedRecourse === undefined;

  let classification: ExposureClassification;
  let reviewFlag: string | undefined;
  let reviewLevel: 'informational' | 'warning' = 'informational';

  if (hasPersonalGuarantee && hasClientGuarantor) {
    classification = 'contingent_personal_liability';
    reviewLevel = 'warning';
    const guarantorList = clientGuarantors.join(' and ');
    reviewFlag = `Personal Guarantee of Trust Debt: ${guarantorList} has indicated that they personally guaranteed borrowing associated with ${trust.legalName || 'this trust'}. This may create personal financial exposure if the Trust cannot meet the obligation. Confirm the current terms, balance, security and guarantee with the appropriate professional.`;
  } else if (hasPersonalGuarantee && !hasClientGuarantor) {
    classification = 'trust_obligation';
  } else if (guaranteeUnclear && hasClientTrustee) {
    classification = 'legal_exposure_unclear';
    reviewLevel = 'warning';
    reviewFlag = `Trustee Liability Requires Confirmation: ${clientTrusteeNames.join(' and ')} act(s) as trustee of ${trust.legalName || 'this trust'}, which has approximately ${debt.approximateBalance || 'an unknown amount'} of outstanding borrowing. The personal guarantee status could not be determined. Consider having the relevant loan documentation and Trust Deed reviewed by your lawyer.`;
  } else if (recourseUnclear && hasClientTrustee) {
    classification = 'legal_exposure_unclear';
    reviewLevel = 'warning';
    reviewFlag = `Trustee Liability Requires Confirmation: ${clientTrusteeNames.join(' and ')} act(s) as trustee of ${trust.legalName || 'this trust'}, which has approximately ${debt.approximateBalance || 'an unknown amount'} of outstanding borrowing. The limitation of recourse could not be determined. Consider having the relevant loan documentation and Trust Deed reviewed by your lawyer.`;
  } else if (hasClientTrustee && debt.limitedRecourse !== 'yes') {
    classification = 'trustee_related_exposure';
    if (trust.trustees.length > 1) {
      reviewLevel = 'informational';
      reviewFlag = `Multiple Trustee Exposure: ${clientTrusteeNames.join(' and ')} act(s) as one of several trustees of ${trust.legalName || 'this trust'}. The trust has outstanding obligations. Depending on the nature of the obligation and the governing documents, trustee exposure may require confirmation. Consider reviewing the relevant agreement and Trust Deed with your lawyer.`;
    }
  } else {
    classification = 'trust_obligation';
  }

  return {
    classification,
    clientTrusteeNames,
    allTrusteeNames,
    clientGuarantors,
    allGuarantors,
    hasPersonalGuarantee,
    guaranteeUnclear,
    recourseUnclear,
    hasClientTrustee,
    hasClientGuarantor,
    reviewFlag,
    reviewLevel,
  };
}

export type ObligationSummary = {
  obligationEntityId?: string;
  borrowerEntityId?: string;
  borrowerName: string;
  lenderName: string;
  lenderEntityId?: string;
  approximateBalance: string;
  secured: TrustDebt['secured'];
  collateralDescription?: string;
  collateralEntityId?: string;
  hasPersonalGuarantee: TrustDebt['hasPersonalGuarantee'];
  guarantorName?: string;
  guarantorPersonId?: string;
  guarantorIsClient: boolean;
  limitedRecourse?: TrustDebt['limitedRecourse'];
  classification: ExposureClassification;
  documentLocationLabel?: string;
  documentLocationId?: string;
  trustees: Array<{ name: string; isClient: boolean; personId?: string }>;
  clientTrusteeNames: string[];
};

export function buildObligationSummary(
  debt: TrustDebt,
  trust: FamilyTrust,
  relationships: EntityRelationship[],
  entities: EntityEntry[],
  people: PersonEntry[]
): ObligationSummary {
  const assessment = classifyTrustDebtExposure(debt, trust, relationships, entities, people);
  const guarantorIsClient = assessment.clientGuarantors.length > 0;

  return {
    obligationEntityId: debt.obligationEntityId,
    borrowerEntityId: trust.entityId,
    borrowerName: trust.legalName,
    lenderName: debt.lender,
    approximateBalance: debt.approximateBalance || 'Unknown',
    secured: debt.secured,
    collateralDescription: debt.collateralDescription,
    collateralEntityId: debt.collateralEntityId,
    hasPersonalGuarantee: debt.hasPersonalGuarantee,
    guarantorName: debt.guarantorName,
    guarantorPersonId: debt.guarantorPersonId,
    guarantorIsClient,
    limitedRecourse: debt.limitedRecourse,
    classification: assessment.classification,
    documentLocationLabel: debt.documentLocationRef?.label,
    documentLocationId: debt.documentLocationRef?.locationId,
    trustees: trust.trustees.map((t) => ({ name: t.personName, isClient: !!t.isClient, personId: t.personId })),
    clientTrusteeNames: assessment.clientTrusteeNames,
  };
}

export function getObligationsForTrust(
  trust: FamilyTrust,
  relationships: EntityRelationship[],
  entities: EntityEntry[],
  people: PersonEntry[]
): ObligationSummary[] {
  return trust.debts.map((d) => buildObligationSummary(d, trust, relationships, entities, people));
}

export const EXPOSURE_CLASSIFICATION_LABELS: Record<ExposureClassification, string> = {
  trust_obligation: 'Trust Obligation',
  trustee_related_exposure: 'Trustee-Related Exposure',
  contingent_personal_liability: 'Contingent Personal Liability',
  legal_exposure_unclear: 'Legal Exposure Unclear',
};

export const EXPOSURE_CLASSIFICATION_DESCRIPTIONS: Record<ExposureClassification, string> = {
  trust_obligation: 'This is a trust liability. No personal liability has been identified.',
  trustee_related_exposure: 'A client acts as trustee of an indebted trust. No personal guarantee or direct personal liability has been identified. This is informational only and does not count as personal debt.',
  contingent_personal_liability: 'A personal guarantee has been identified. The trust liability remains with the trust, but a contingent exposure exists for the guarantor. This should appear separately as contingent exposure on the personal balance sheet — not as ordinary personal debt.',
  legal_exposure_unclear: 'The extent of personal trustee exposure could not be determined from the information provided. This should be reviewed by a lawyer.',
};
