/**
 * Obligation query helpers — bidirectional views and output-readiness
 * classification selectors. These do NOT render anything; they let future
 * outputs (Hidden Risks, Personal Balance Sheet, Corporate Balance Sheet,
 * Executor Handbook, POA) consume the unified obligation data.
 */

import type { EntityEntry, EntityRelationship, EntityType } from './entityRegistryTypes';
import type { ObligationType } from './obligationSync';

export type ObligationRecord = {
  obligationEntityId: string;
  obligationType: ObligationType;
  direction: string;
  borrowerEntityId: string;
  borrowerName: string;
  borrowerEntityType: EntityType;
  borrowers: Array<{ entityId: string; entityType: EntityType; displayName: string }>;
  lenderEntityId: string;
  lenderName: string;
  lenderEntityType: EntityType;
  amount?: string;
  amountUnknown?: boolean;
  interestRate?: string;
  secured: 'yes' | 'no' | 'not_sure';
  collateralEntityId?: string;
  collateralDescription?: string;
  guarantors: Array<{ entityId: string; entityType: EntityType; displayName: string }>;
  documentLocationLabel?: string;
  documentLocationId?: string;
  notes?: string;
  sourceSection: string;
  sourceRecordId?: string;
  paymentAmount?: string;
  paymentFrequency?: string;
  paymentSourceBankRef?: string;
  creditLimit?: string;
};

export function getActiveObligationEntities(entities: EntityEntry[]): EntityEntry[] {
  return entities.filter((e) => e.active && e.entityType === 'obligation');
}

export function buildObligationRecord(
  entity: EntityEntry,
  relationships: EntityRelationship[],
  entities: EntityEntry[],
): ObligationRecord | null {
  if (!entity.active || entity.entityType !== 'obligation') return null;

  const borrowerRels = relationships.filter(
    (r) => r.active && r.relationshipType === 'borrower_of' && r.targetEntityId === entity.id
  );
  const lenderRels = relationships.filter(
    (r) => r.active && r.relationshipType === 'lender_of' && r.targetEntityId === entity.id
  );
  const borrowers = borrowerRels.map((r) => {
    const ent = entities.find((e) => e.id === r.sourceEntityId);
    return {
      entityId: r.sourceEntityId,
      entityType: ent?.entityType || ('person' as EntityType),
      displayName: ent?.displayName || '',
    };
  });
  const borrowerEntity = borrowerRels[0] ? entities.find((e) => e.id === borrowerRels[0].sourceEntityId) : undefined;
  const lenderEntity = lenderRels[0] ? entities.find((e) => e.id === lenderRels[0].sourceEntityId) : undefined;

  const meta = entity.metadata as Record<string, unknown>;

  return {
    obligationEntityId: entity.id,
    obligationType: (meta.obligationType as ObligationType) || 'other_liability',
    direction: (meta.direction as string) || 'other',
    borrowerEntityId: borrowerEntity?.id || (meta.borrowerEntityId as string) || '',
    borrowerName: borrowerEntity?.displayName || '',
    borrowerEntityType: borrowerEntity?.entityType || 'person',
    borrowers,
    lenderEntityId: lenderEntity?.id || (meta.lenderEntityId as string) || '',
    lenderName: lenderEntity?.displayName || '',
    lenderEntityType: lenderEntity?.entityType || 'lender',
    amount: meta.amount as string | undefined,
    amountUnknown: meta.amountUnknown as boolean | undefined,
    interestRate: meta.interestRate as string | undefined,
    secured: (meta.secured as 'yes' | 'no' | 'not_sure') || 'not_sure',
    collateralEntityId: meta.collateralEntityId as string | undefined,
    collateralDescription: meta.collateralDescription as string | undefined,
    guarantors: (meta.guarantors as Array<{ entityId: string; entityType: EntityType; displayName: string }>) || [],
    documentLocationLabel: meta.documentLocationLabel as string | undefined,
    documentLocationId: meta.documentLocationId as string | undefined,
    notes: meta.notes as string | undefined,
    sourceSection: entity.sourceSection,
    sourceRecordId: meta.sourceRecordId as string | undefined,
    paymentAmount: meta.paymentAmount as string | undefined,
    paymentFrequency: meta.paymentFrequency as string | undefined,
    paymentSourceBankRef: meta.paymentSourceBankRef as string | undefined,
    creditLimit: meta.creditLimit as string | undefined,
  };
}

export function getAllObligations(
  entities: EntityEntry[],
  relationships: EntityRelationship[],
): ObligationRecord[] {
  return getActiveObligationEntities(entities)
    .map((e) => buildObligationRecord(e, relationships, entities))
    .filter((o): o is ObligationRecord => o !== null);
}

export function getObligationsForBorrower(
  borrowerEntityId: string,
  entities: EntityEntry[],
  relationships: EntityRelationship[],
): ObligationRecord[] {
  return getAllObligations(entities, relationships).filter(
    (o) => o.borrowerEntityId === borrowerEntityId
  );
}

export function getObligationsForLender(
  lenderEntityId: string,
  entities: EntityEntry[],
  relationships: EntityRelationship[],
): ObligationRecord[] {
  return getAllObligations(entities, relationships).filter(
    (o) => o.lenderEntityId === lenderEntityId
  );
}

export function getObligationsForGuarantor(
  guarantorEntityId: string,
  entities: EntityEntry[],
  relationships: EntityRelationship[],
): ObligationRecord[] {
  return getAllObligations(entities, relationships).filter(
    (o) => o.guarantors.some((g) => g.entityId === guarantorEntityId)
  );
}

export type ObligationPerspective =
  | 'direct_liability'
  | 'contingent_liability'
  | 'receivable'
  | 'intercompany_payable'
  | 'intercompany_receivable'
  | 'shareholder_loan_payable'
  | 'shareholder_loan_receivable'
  | 'related_party_liability'
  | 'related_party_receivable';

export function classifyObligationForEntity(
  obligation: ObligationRecord,
  entityId: string,
): ObligationPerspective | null {
  if (obligation.borrowerEntityId === entityId) {
    switch (obligation.obligationType) {
      case 'intercompany_loan':
        return 'intercompany_payable';
      case 'shareholder_loan':
        if (obligation.direction === 'person_owes_corporation') return 'related_party_liability';
        return 'shareholder_loan_payable';
      case 'related_party_loan':
        return 'related_party_liability';
      case 'trust_borrowing':
        return 'direct_liability';
      default:
        return 'direct_liability';
    }
  }

  if (obligation.lenderEntityId === entityId) {
    switch (obligation.obligationType) {
      case 'intercompany_loan':
        return 'intercompany_receivable';
      case 'shareholder_loan':
        if (obligation.direction === 'person_owes_corporation') return 'related_party_receivable';
        return 'shareholder_loan_receivable';
      case 'related_party_loan':
        return 'related_party_receivable';
      default:
        return 'receivable';
    }
  }

  if (obligation.guarantors.some((g) => g.entityId === entityId)) {
    return 'contingent_liability';
  }

  return null;
}

export type HiddenRiskClassification =
  | 'contingent_personal_liability'
  | 'corporate_cross_guarantee'
  | 'intercompany_exposure'
  | 'shareholder_loan_direction_requires_confirmation'
  | null;

export function classifyHiddenRisk(obligation: ObligationRecord): HiddenRiskClassification {
  const hasPersonGuarantor = obligation.guarantors.some((g) => g.entityType === 'person');
  const hasCorpGuarantor = obligation.guarantors.some((g) => g.entityType === 'corporation');

  if (hasPersonGuarantor && obligation.obligationType !== 'personal_guarantee_exposure') {
    return 'contingent_personal_liability';
  }

  if (hasCorpGuarantor && obligation.borrowerEntityType === 'corporation') {
    return 'corporate_cross_guarantee';
  }

  if (obligation.obligationType === 'intercompany_loan') {
    return 'intercompany_exposure';
  }

  if (obligation.obligationType === 'shareholder_loan' && obligation.direction === 'other') {
    return 'shareholder_loan_direction_requires_confirmation';
  }

  return null;
}

export function getObligationsByType(
  type: ObligationType,
  entities: EntityEntry[],
  relationships: EntityRelationship[],
): ObligationRecord[] {
  return getAllObligations(entities, relationships).filter((o) => o.obligationType === type);
}

export function countActiveObligationRelationships(
  obligationEntityId: string,
  relationships: EntityRelationship[],
): number {
  return relationships.filter(
    (r) =>
      r.active &&
      (r.sourceEntityId === obligationEntityId || r.targetEntityId === obligationEntityId)
  ).length;
}

export const OBLIGATION_TYPE_LABELS: Record<ObligationType, string> = {
  bank_institutional_borrowing: 'Bank / Institutional Borrowing',
  mortgage: 'Mortgage',
  heloc: 'HELOC',
  corporate_operating_loan: 'Corporate Operating Loan',
  corporate_term_loan: 'Corporate Term Loan',
  shareholder_loan: 'Shareholder Loan',
  intercompany_loan: 'Intercompany Loan',
  related_party_loan: 'Related-Party Loan',
  trust_borrowing: 'Trust Borrowing',
  personal_guarantee_exposure: 'Personal Guarantee Exposure',
  corporate_guarantee_exposure: 'Corporate Guarantee Exposure',
  personal_loc: 'Personal Line of Credit',
  personal_loan: 'Personal Loan',
  vehicle_loan: 'Vehicle Loan / Financing',
  tax_obligation: 'Tax Obligation',
  student_loan: 'Student Loan',
  family_private_loan: 'Family / Private Loan',
  credit_facility: 'Credit Facility',
  other_liability: 'Other Liability',
};

export const PERSPECTIVE_LABELS: Record<ObligationPerspective, string> = {
  direct_liability: 'Direct Liability',
  contingent_liability: 'Contingent / Guaranteed Obligation',
  receivable: 'Receivable',
  intercompany_payable: 'Intercompany Payable',
  intercompany_receivable: 'Intercompany Receivable',
  shareholder_loan_payable: 'Shareholder Loan Payable',
  shareholder_loan_receivable: 'Shareholder Loan Receivable',
  related_party_liability: 'Related-Party Liability',
  related_party_receivable: 'Related-Party Receivable',
};
