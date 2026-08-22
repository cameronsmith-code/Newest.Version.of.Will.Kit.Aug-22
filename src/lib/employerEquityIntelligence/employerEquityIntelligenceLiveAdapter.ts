/**
 * Employer Equity Intelligence — Stage 2 Live Read Adapter
 *
 * Pure read-only transformation from live WorkplaceBenefit data
 * into the Stage 1 engine input (EmployerEquityBenefitInput).
 *
 * Does NOT mutate source data. Does NOT write back to state.
 */

import type { WorkplaceBenefit, WorkplaceClientData } from '../workplacePensionsTypes';
import type { EmployerEquityBenefitInput } from './employerEquityIntelligenceTypes';

/**
 * Map a live WorkplaceBenefit (with its EquityBenefitDetails) into
 * the plain engine input shape.
 *
 * Only employerEquity and executiveDeferred families are relevant —
 * other benefit families (DB pensions, account-based plans, insurance)
 * are not in scope for this engine.
 */
export function mapWorkplaceBenefitToEngineInput(
  benefit: WorkplaceBenefit,
): EmployerEquityBenefitInput | null {
  if (benefit.family !== 'employerEquity' && benefit.family !== 'executiveDeferred') {
    return null;
  }

  const details = benefit.equityBenefitDetails;

  return {
    benefitId: benefit.id,
    benefitType: benefit.benefitType,
    benefitTypeLabel: benefit.benefitTypeLabel,
    planName: details?.planName || benefit.planName,
    employerName: benefit.employerName,
    employerIsCurrent: benefit.employerIsCurrent,
    clientId: benefit.clientId,
    administratorName: benefit.administratorName,
    documentLocationLabel: benefit.documentLocationRef?.label,
    // Equity details
    ownershipStatus: details?.ownershipStatus,
    vestingStatus: details?.vestingStatus,
    vestingDates: (details?.vestingDates || [])
      .map((v) => v.date)
      .filter((d): d is string => !!d),
    optionExpiryStatus: details?.optionExpiryStatus,
    optionExpiryDate: details?.optionExpiryStatus === 'known' ? details?.optionExpiryDate : undefined,
    optionCount: details?.optionCount,
    exercisePrice: details?.exercisePrice,
    deathIncapacityKnown: details?.deathIncapacity?.hasSpecialRules,
    deathIncapacityNotes: details?.deathIncapacity?.notes,
    terminationKnown: details?.termination?.leavingChangesBenefit,
    terminationDeadlineKnown: details?.termination?.hasDeadlineOrRule,
    terminationDeadline: details?.termination?.deadline,
    beneficiaryAllowed: details?.beneficiary?.beneficiaryDesignationAllowed,
    beneficiaryType: details?.beneficiary?.beneficiaryType,
    currentlyReceiving: details?.currentlyReceiving?.status,
    reportedValueAmount: details?.reportedValue?.amount,
    executiveType: benefit.executiveType,
    notes: details?.notes || benefit.notes,
  };
}

/**
 * Extract all equity/executive benefits from a WorkplaceClientData
 * for a single client, mapping each to engine input.
 */
export function extractEquityBenefitsFromClient(
  clientId: 'client1' | 'client2',
  clientData: WorkplaceClientData | undefined,
): EmployerEquityBenefitInput[] {
  if (!clientData || !clientData.benefits) return [];
  const inputs: EmployerEquityBenefitInput[] = [];
  for (const benefit of clientData.benefits) {
    if (benefit.clientId !== clientId) continue;
    const mapped = mapWorkplaceBenefitToEngineInput(benefit);
    if (mapped) inputs.push(mapped);
  }
  return inputs;
}

/**
 * Build the full set of engine inputs from a live answers map.
 *
 * Reads the 'workplacePensionsBenefits' section, extracts client1Data
 * and client2Data, and maps all equity/executive benefits.
 *
 * Pure: does not mutate answers, does not write anywhere.
 */
export function buildLiveEquityIntelligenceInputs(
  answers: Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>> | undefined,
): EmployerEquityBenefitInput[] {
  if (!answers) return [];

  let sectionData: Record<string, unknown> | undefined;

  if (answers instanceof Map) {
    sectionData = answers.get('workplacePensionsBenefits');
  } else {
    sectionData = answers['workplacePensionsBenefits'];
  }

  if (!sectionData) return [];

  const client1Data = sectionData['client1Data'] as WorkplaceClientData | undefined;
  const client2Data = sectionData['client2Data'] as WorkplaceClientData | undefined;

  return [
    ...extractEquityBenefitsFromClient('client1', client1Data),
    ...extractEquityBenefitsFromClient('client2', client2Data),
  ];
}
