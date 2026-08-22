/**
 * Hidden Risk Engine — Evidence Builders
 *
 * Helper functions to construct evidence objects from entity graph data.
 */

import type { HiddenRiskEvidence, EvidenceType } from './hiddenRiskTypes';
import type { ObligationRecord } from '../obligationQuery';

export function personEvidence(
  entityId: string,
  displayName: string,
  sourceSection?: string,
  value?: string
): HiddenRiskEvidence {
  return { type: 'person' as EvidenceType, entityId, label: displayName, sourceSection, value };
}

export function trustEvidence(
  entityId: string,
  legalName: string,
  sourceSection?: string
): HiddenRiskEvidence {
  return { type: 'trust', entityId, label: legalName, sourceSection };
}

export function corporationEvidence(
  entityId: string,
  legalName: string,
  sourceSection?: string
): HiddenRiskEvidence {
  return { type: 'corporation', entityId, label: legalName, sourceSection };
}

export function obligationEvidence(
  obligation: ObligationRecord,
  sourceSection?: string
): HiddenRiskEvidence {
  return {
    type: 'obligation',
    entityId: obligation.obligationEntityId,
    label: `${obligation.lenderName} — ${obligation.borrowerName}`,
    value: obligation.amount || (obligation.amountUnknown ? 'Unknown' : 'N/A'),
    sourceSection: sourceSection || obligation.sourceSection,
  };
}

export function documentEvidence(
  label: string,
  sourceSection: string,
  value?: string
): HiddenRiskEvidence {
  return { type: 'document', label, sourceSection, value };
}

export function answerEvidence(
  label: string,
  value: string,
  sourceSection: string
): HiddenRiskEvidence {
  return { type: 'questionnaire_answer', label, value, sourceSection };
}

export function relationshipEvidence(
  label: string,
  value: string,
  sourceSection?: string
): HiddenRiskEvidence {
  return { type: 'relationship', label, value, sourceSection };
}

export function dateEvidence(
  label: string,
  value: string,
  entityId?: string
): HiddenRiskEvidence {
  return { type: 'date', label, value, entityId };
}

export function otherEvidence(
  label: string,
  value?: string
): HiddenRiskEvidence {
  return { type: 'other', label, value };
}

export function propertyEvidence(
  entityId: string,
  name: string,
  sourceSection?: string
): HiddenRiskEvidence {
  return { type: 'property', entityId, label: name, sourceSection };
}

/**
 * Build detailed evidence for a guaranteed obligation,
 * including borrower, lender, balance, and collateral.
 */
export function buildGuaranteedObligationEvidence(
  obligation: ObligationRecord,
  guarantorName: string
): HiddenRiskEvidence[] {
  const evidence: HiddenRiskEvidence[] = [
    personEvidence('', guarantorName, undefined, 'guarantor_of'),
    {
      type: 'obligation',
      entityId: obligation.obligationEntityId,
      label: `${obligation.lenderName} — ${obligation.borrowerName}`,
      value: obligation.amount || (obligation.amountUnknown ? 'Unknown' : 'N/A'),
      sourceSection: obligation.sourceSection,
    },
    {
      type: 'corporation',
      entityId: obligation.borrowerEntityId,
      label: `Borrower: ${obligation.borrowerName}`,
      sourceSection: obligation.sourceSection,
    },
    {
      type: 'other',
      label: `Lender: ${obligation.lenderName}`,
    },
  ];

  if (obligation.collateralDescription) {
    evidence.push({
      type: 'other',
      label: `Collateral: ${obligation.collateralDescription}`,
    });
  }

  if (obligation.documentLocationLabel) {
    evidence.push({
      type: 'document',
      label: `Document location: ${obligation.documentLocationLabel}`,
      sourceSection: obligation.sourceSection,
    });
  }

  return evidence;
}
