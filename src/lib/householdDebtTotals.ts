/**
 * Household Debt Totals — aggregation helpers that count each Obligation once
 * for household totals, with separate contingent exposure totals.
 *
 * Joint debt (two borrowers on one obligation) counts once.
 * Guaranteed debt counts as contingent exposure, not personal debt.
 * Trust/corporate debt where client is only trustee/shareholder is not personal debt.
 */

import type { ObligationRecord } from './obligationQuery';

export type HouseholdDebtTotals = {
  personalDebtTotal: number;
  contingentExposureTotal: number;
  personalDebtCount: number;
  contingentExposureCount: number;
  hasUnknownAmounts: boolean;
};

function parseAmount(amount: string | undefined, amountUnknown: boolean | undefined): number | null {
  if (amountUnknown) return null;
  if (!amount) return 0;
  const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;
  return num;
}

/**
 * Determine if an obligation is a personal debt of client1 or client2.
 * An obligation is personal debt if the borrower is a person entity
 * AND that person is client1 or client2.
 *
 * Obligations where the borrower is a corporation or trust are NOT personal debt,
 * even if a client is a guarantor or trustee.
 */
function isPersonalDebt(
  obligation: ObligationRecord,
  clientEntityIds: Set<string>
): boolean {
  // An obligation is personal debt if ANY active borrower is a client (person entity).
  // The obligation amount is counted once regardless of how many borrowers are clients.
  const allBorrowers = obligation.borrowers && obligation.borrowers.length > 0
    ? obligation.borrowers
    : [{ entityId: obligation.borrowerEntityId, entityType: obligation.borrowerEntityType, displayName: obligation.borrowerName }];
  return allBorrowers.some((b) => b.entityType === 'person' && clientEntityIds.has(b.entityId));
}

/**
 * Determine if an obligation represents contingent personal exposure
 * for client1 or client2 (i.e., a client is a guarantor but not a borrower).
 */
function isContingentExposure(
  obligation: ObligationRecord,
  clientEntityIds: Set<string>
): boolean {
  // If a client is already a borrower, it's personal debt, not contingent
  if (isPersonalDebt(obligation, clientEntityIds)) return false;

  // Check if any client is a guarantor
  return obligation.guarantors.some((g) => clientEntityIds.has(g.entityId));
}

export function calculateHouseholdDebtTotals(
  obligations: ObligationRecord[],
  client1EntityId: string,
  client2EntityId: string
): HouseholdDebtTotals {
  const clientEntityIds = new Set<string>();
  if (client1EntityId) clientEntityIds.add(client1EntityId);
  if (client2EntityId) clientEntityIds.add(client2EntityId);

  let personalDebtTotal = 0;
  let contingentExposureTotal = 0;
  let personalDebtCount = 0;
  let contingentExposureCount = 0;
  let hasUnknownAmounts = false;

  // Track which obligation IDs we've counted to avoid double-counting
  const countedPersonal = new Set<string>();
  const countedContingent = new Set<string>();

  for (const obligation of obligations) {
    const amount = parseAmount(obligation.amount, obligation.amountUnknown);

    if (isPersonalDebt(obligation, clientEntityIds)) {
      if (!countedPersonal.has(obligation.obligationEntityId)) {
        countedPersonal.add(obligation.obligationEntityId);
        personalDebtCount++;
        if (amount === null) {
          hasUnknownAmounts = true;
        } else {
          personalDebtTotal += amount;
        }
      }
    } else if (isContingentExposure(obligation, clientEntityIds)) {
      if (!countedContingent.has(obligation.obligationEntityId)) {
        countedContingent.add(obligation.obligationEntityId);
        contingentExposureCount++;
        if (amount === null) {
          hasUnknownAmounts = true;
        } else {
          contingentExposureTotal += amount;
        }
      }
    }
  }

  return {
    personalDebtTotal,
    contingentExposureTotal,
    personalDebtCount,
    contingentExposureCount,
    hasUnknownAmounts,
  };
}

/**
 * Group obligations for the review table.
 */
export type ObligationGroup = {
  label: string;
  obligations: ObligationRecord[];
};

export function groupObligationsForReview(
  obligations: ObligationRecord[],
  client1EntityId: string,
  client2EntityId: string
): {
  personalDebts: ObligationRecord[];
  contingentExposures: ObligationRecord[];
  relatedEntityObligations: ObligationRecord[];
} {
  const clientEntityIds = new Set<string>();
  if (client1EntityId) clientEntityIds.add(client1EntityId);
  if (client2EntityId) clientEntityIds.add(client2EntityId);

  const personalDebts: ObligationRecord[] = [];
  const contingentExposures: ObligationRecord[] = [];
  const relatedEntityObligations: ObligationRecord[] = [];
  const seen = new Set<string>();

  for (const obligation of obligations) {
    if (seen.has(obligation.obligationEntityId)) continue;
    seen.add(obligation.obligationEntityId);

    if (isPersonalDebt(obligation, clientEntityIds)) {
      personalDebts.push(obligation);
    } else if (isContingentExposure(obligation, clientEntityIds)) {
      contingentExposures.push(obligation);
    } else {
      // Related-entity obligations (corporate debt, trust debt, intercompany, etc.)
      // Only include if relevant to the household (client is connected somehow)
      const hasClientConnection =
        obligation.guarantors.some((g) => clientEntityIds.has(g.entityId)) ||
        clientEntityIds.has(obligation.borrowerEntityId) ||
        clientEntityIds.has(obligation.lenderEntityId);
      if (hasClientConnection) {
        relatedEntityObligations.push(obligation);
      }
    }
  }

  return { personalDebts, contingentExposures, relatedEntityObligations };
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
