/**
 * Property & Liability Insurance — Output Datasets
 *
 * Read-only derived datasets for Executor, POA Property,
 * Document Location Summary, and future intelligence rules.
 *
 * Facts persist. Output derives.
 */

import type {
  PropertyLiabilityInsuranceData,
  InsurancePolicyType,
} from './propertyLiabilityInsuranceTypes';
// (DocumentLocationRef not needed in this module — policy stores locationId and label directly)

// ── Executor Dataset ──

export interface ExecutorPolicyEntry {
  policyId: string;
  policyType: InsurancePolicyType;
  policyTypeLabel: string;
  policyName?: string;
  insurerName?: string;
  brokerName?: string;
  policyNumber?: string;
  premiumAmount?: string;
  premiumFrequency?: string;
  paymentSourceLabel?: string;
  renewalDate?: string;
  documentLocationLabel?: string;
  relatedPropertyNames: string[];
  relatedVehicleNames: string[];
  vacancyNotes?: string;
  landlordCoverageKnown?: string;
  insurerKnowsRental?: string;
  umbrellaCoverageAmount?: string;
  underlyingPolicyLabels: string[];
}

export interface ExecutorInsuranceDataset {
  activePolicies: ExecutorPolicyEntry[];
  totalPolicies: number;
  householdManager?: string;
  continuityNotes?: string;
}

// ── POA Property Dataset ──

export interface PoaPropertyPolicyEntry {
  policyId: string;
  policyTypeLabel: string;
  insurerName?: string;
  brokerName?: string;
  premiumAmount?: string;
  premiumFrequency?: string;
  paymentSourceLabel?: string;
  renewalDate?: string;
  relatedPropertyNames: string[];
  specialConsiderations: string[];
}

export interface PoaPropertyInsuranceDataset {
  activePolicies: PoaPropertyPolicyEntry[];
  totalPolicies: number;
  totalPremiums: Array<{ label: string; amount: string; frequency: string }>;
}

// ── Document Location Summary ──

export interface DocumentLocationPolicyRef {
  policyId: string;
  policyLabel: string;
  documentLocationId?: string;
  documentLocationLabel?: string;
}

export interface DocumentLocationSummary {
  references: DocumentLocationPolicyRef[];
}

// ── Future Intelligence Signals ──

export interface InsuranceIntelligenceSignal {
  signalType:
    | 'property_insurance_unknown'
    | 'rental_coverage_unknown'
    | 'vacancy_requirements_unknown'
    | 'umbrella_underlying_unknown'
    | 'payment_source_unknown'
    | 'policy_documents_not_located'
    | 'former_property_contact_missing';
  policyId: string;
  description: string;
}

export interface IntelligenceDataset {
  signals: InsuranceIntelligenceSignal[];
}

// ── Builders ──

function policyTypeLabel(type: InsurancePolicyType): string {
  const labels: Record<InsurancePolicyType, string> = {
    property: 'Property Insurance',
    auto: 'Auto Insurance',
    umbrella: 'Umbrella / Excess Liability',
    valuable_articles: 'Valuable Articles',
    other: 'Other Property Coverage',
  };
  return labels[type] || type;
}

export function buildExecutorDataset(
  data: PropertyLiabilityInsuranceData,
  propertyNames: Map<string, string>,
  vehicleNames: Map<string, string>,
  policyLabels: Map<string, string>,
): ExecutorInsuranceDataset {
  const activePolicies = data.policies
    .filter((p) => p.status === 'active')
    .map((p) => ({
      policyId: p.id,
      policyType: p.policyType,
      policyTypeLabel: policyTypeLabel(p.policyType),
      policyName: p.policyName,
      insurerName: p.insurerName,
      brokerName: p.brokerName,
      policyNumber: p.policyNumber,
      premiumAmount: p.premiumAmount,
      premiumFrequency: p.premiumFrequency,
      paymentSourceLabel: p.paymentSourceLabel || p.paymentAccountLabel,
      renewalDate: p.renewalDate,
      documentLocationLabel: p.documentLocationLabel,
      relatedPropertyNames: p.relatedPropertyIds.map((id) => propertyNames.get(id) || id).filter(Boolean),
      relatedVehicleNames: p.relatedVehicleIds.map((id) => vehicleNames.get(id) || id).filter(Boolean),
      vacancyNotes: p.vacancyNotes,
      landlordCoverageKnown: p.landlordCoverageKnown,
      insurerKnowsRental: p.insurerKnowsRental,
      umbrellaCoverageAmount: p.umbrellaCoverageAmount,
      underlyingPolicyLabels: p.underlyingPolicyIds.map((id) => policyLabels.get(id) || id).filter(Boolean),
    }));

  const managerLabel = data.householdManager
    ? data.householdManager.managerType === 'client1'
      ? 'Client 1'
      : data.householdManager.managerType === 'client2'
        ? 'Client 2'
        : data.householdManager.managerType === 'both'
          ? 'Both clients'
          : data.householdManager.managerType === 'broker'
            ? 'Insurance broker largely handles it'
            : data.householdManager.otherPersonName || 'Another person'
    : undefined;

  return {
    activePolicies,
    totalPolicies: activePolicies.length,
    householdManager: managerLabel,
    continuityNotes: data.continuityNotes,
  };
}

export function buildPoaPropertyDataset(
  data: PropertyLiabilityInsuranceData,
  propertyNames: Map<string, string>,
): PoaPropertyInsuranceDataset {
  const activePolicies = data.policies
    .filter((p) => p.status === 'active')
    .map((p) => {
      const specialConsiderations: string[] = [];
      if (p.vacancyNotes) specialConsiderations.push(`Vacancy: ${p.vacancyNotes}`);
      if (p.insurerKnowsRental && p.insurerKnowsRental !== 'yes') {
        specialConsiderations.push('Insurer may not know property is rented');
      }
      if (p.landlordCoverageKnown && p.landlordCoverageKnown !== 'yes') {
        specialConsiderations.push('Landlord coverage status uncertain');
      }
      if (p.renewalDate) specialConsiderations.push(`Renewal: ${p.renewalDate}`);

      return {
        policyId: p.id,
        policyTypeLabel: policyTypeLabel(p.policyType),
        insurerName: p.insurerName,
        brokerName: p.brokerName,
        premiumAmount: p.premiumAmount,
        premiumFrequency: p.premiumFrequency,
        paymentSourceLabel: p.paymentSourceLabel || p.paymentAccountLabel,
        renewalDate: p.renewalDate,
        relatedPropertyNames: p.relatedPropertyIds.map((id) => propertyNames.get(id) || id).filter(Boolean),
        specialConsiderations,
      };
    });

  const totalPremiums = activePolicies
    .filter((p) => p.premiumAmount)
    .map((p) => ({
      label: p.policyTypeLabel,
      amount: p.premiumAmount!,
      frequency: p.premiumFrequency || 'not_sure',
    }));

  return {
    activePolicies,
    totalPolicies: activePolicies.length,
    totalPremiums,
  };
}

export function buildDocumentLocationSummary(
  data: PropertyLiabilityInsuranceData,
  policyLabels: Map<string, string>,
): DocumentLocationSummary {
  const references = data.policies
    .filter((p) => p.status === 'active' && p.documentLocationLabel)
    .map((p) => ({
      policyId: p.id,
      policyLabel: policyLabels.get(p.id) || p.policyName || policyTypeLabel(p.policyType),
      documentLocationId: p.documentLocationId,
      documentLocationLabel: p.documentLocationLabel,
    }));

  return { references };
}

export function buildIntelligenceSignals(
  data: PropertyLiabilityInsuranceData,
  knownPropertyIds: string[],
): IntelligenceDataset {
  const signals: InsuranceIntelligenceSignal[] = [];

  for (const policy of data.policies) {
    if (policy.status !== 'active') continue;

    // Property insurance unknown for known property
    if (policy.policyType === 'property') {
      // Check if any known property has no policy
    }

    // Rental coverage unknown
    if (policy.insurerKnowsRental && policy.insurerKnowsRental === 'not_sure') {
      signals.push({
        signalType: 'rental_coverage_unknown',
        policyId: policy.id,
        description: 'Insurer awareness of rental status is unknown for this property policy.',
      });
    }

    // Vacancy requirements unknown
    if (policy.vacancyRequirementsKnown === 'not_sure' || policy.vacancyRequirementsKnown === undefined) {
      if (policy.policyType === 'property') {
        signals.push({
          signalType: 'vacancy_requirements_unknown',
          policyId: policy.id,
          description: 'Vacancy requirements are not known for this property policy.',
        });
      }
    }

    // Umbrella underlying policies unknown
    if (policy.policyType === 'umbrella' && policy.underlyingPolicyIds.length === 0) {
      signals.push({
        signalType: 'umbrella_underlying_unknown',
        policyId: policy.id,
        description: 'Umbrella policy has no underlying policies identified.',
      });
    }

    // Payment source unknown
    if (!policy.paymentAccountId && policy.paymentMethodType === 'not_sure') {
      signals.push({
        signalType: 'payment_source_unknown',
        policyId: policy.id,
        description: 'Payment source for this policy is unknown.',
      });
    }

    // Policy documents not located
    if (!policy.documentLocationId && !policy.documentLocationLabel) {
      signals.push({
        signalType: 'policy_documents_not_located',
        policyId: policy.id,
        description: 'Document location for this policy has not been identified.',
      });
    }
  }

  // Check for known properties without any policy
  const insuredPropertyIds = new Set(
    data.policies
      .filter((p) => p.status === 'active' && p.policyType === 'property')
      .flatMap((p) => p.relatedPropertyIds)
  );
  for (const propId of knownPropertyIds) {
    if (!insuredPropertyIds.has(propId)) {
      signals.push({
        signalType: 'property_insurance_unknown',
        policyId: propId,
        description: 'A known property has no active insurance policy linked to it.',
      });
    }
  }

  return { signals };
}
