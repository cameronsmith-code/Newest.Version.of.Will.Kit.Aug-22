/**
 * Property & Liability Insurance — Canonical Policy Data Model
 *
 * Policy-first architecture. One policy can cover multiple assets.
 * Stable IDs are authoritative. Display names are presentation only.
 */

// ── Policy Types ──

export type InsurancePolicyType =
  | 'property'
  | 'auto'
  | 'umbrella'
  | 'valuable_articles'
  | 'other';

export type PremiumFrequency =
  | 'monthly'
  | 'quarterly'
  | 'semi_annually'
  | 'annually'
  | 'other'
  | 'not_sure';

export type PaymentMethodType = PaymentSourceType;

export type CoverageStatus = 'active' | 'inactive';

export type YesNoNotSure = 'yes' | 'no' | 'not_sure';

// ── Canonical Policy Record ──

export interface PropertyLiabilityPolicy {
  id: string;

  policyType: InsurancePolicyType;
  policyName?: string;

  // Carrier / insurer
  insurerName?: string;
  insurerEntityId?: string;

  // Broker / agent / contact
  brokerProfessionalId?: string;
  brokerName?: string;

  policyNumber?: string;

  // Premium
  premiumAmount?: string;
  premiumFrequency?: PremiumFrequency;

  // Payment source (canonical ID from Financial Footprint)
  paymentSourceId?: string;
  paymentSourceType?: PaymentSourceType;
  paymentSourceLabel?: string;
  // Legacy field — preserved for migration
  paymentAccountId?: string;
  paymentMethodType?: PaymentMethodType;
  paymentAccountLabel?: string;

  // Renewal
  renewalDate?: string;

  // Asset relationships (canonical IDs from Real Estate / Other Assets)
  relatedPropertyIds: string[];
  relatedVehicleIds: string[];
  relatedOtherAssetIds: string[];

  // Umbrella-specific
  umbrellaCoverageAmount?: string;
  underlyingPolicyIds: string[];

  // Vacancy (property policies only)
  vacancyRequirementsKnown?: YesNoNotSure;
  vacancyNotes?: string;

  // Rental / landlord (rental/investment property only)
  landlordCoverageKnown?: YesNoNotSure;
  insurerKnowsRental?: YesNoNotSure;

  // Valuable articles
  valuableArticleAssetIds?: string[];
  valuableArticleDescription?: string;
  hasAppraisal?: YesNoNotSure;

  // Document location
  documentLocationId?: string;
  documentLocationLabel?: string;

  // General
  notes?: string;
  status: CoverageStatus;
}

// ── Household Insurance Manager ──

export interface HouseholdInsuranceManager {
  managerType: 'client1' | 'client2' | 'both' | 'other_person' | 'broker' | 'not_sure';
  otherPersonId?: string;
  otherPersonName?: string;
}

// ── Section Data Shape (stored in questionnaire answers) ──

export type PropertyInsuranceStatus = 'insured' | 'not_insured' | 'not_sure';

export interface PropertyInsuranceStatusEntry {
  propertyEntityId: string;
  status: PropertyInsuranceStatus;
}

// ── Section Data Shape (stored in questionnaire answers) ──

export interface PropertyLiabilityInsuranceData {
  policies: PropertyLiabilityPolicy[];
  propertyInsuranceStatuses?: PropertyInsuranceStatusEntry[];
  householdManager?: HouseholdInsuranceManager;
  continuityNotes?: string;
  hasOtherCoverage?: YesNoNotSure;
  hasValuableArticles?: YesNoNotSure;
  hasUmbrella?: YesNoNotSure;
}

// ── Helpers ──

export function generatePolicyId(): string {
  return `plpol_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function emptyPolicy(policyType: InsurancePolicyType): PropertyLiabilityPolicy {
  return {
    id: generatePolicyId(),
    policyType,
    relatedPropertyIds: [],
    relatedVehicleIds: [],
    relatedOtherAssetIds: [],
    underlyingPolicyIds: [],
    status: 'active',
  };
}

export const POLICY_TYPE_LABELS: Record<InsurancePolicyType, string> = {
  property: 'Property Insurance',
  auto: 'Auto Insurance',
  umbrella: 'Umbrella / Excess Liability',
  valuable_articles: 'Valuable Articles',
  other: 'Other Property Coverage',
};

export const PREMIUM_FREQUENCY_LABELS: Record<PremiumFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annually: 'Semi-annually',
  annually: 'Annually',
  other: 'Other',
  not_sure: "I'm not sure",
};

export const PREMIUM_FREQUENCY_OPTIONS: Array<{ value: PremiumFrequency; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annually', label: 'Semi-annually' },
  { value: 'annually', label: 'Annually' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

// ── Derivation helpers (read from allAnswers) ──

export interface KnownProperty {
  id: string;
  name: string;
  propertyType?: string;
  isRental?: boolean;
}

export function deriveKnownProperties(
  allAnswers: Map<string, Record<string, unknown>>
): KnownProperty[] {
  const realEstate = allAnswers.get('realEstate') || {};
  const propertiesData = (realEstate['propertiesData'] as Array<Record<string, unknown>>) || [];
  return propertiesData
    .map((p) => {
      const name = (p['propertyName'] as string) || (p['name'] as string) || '';
      const propertyEntityId = (p['propertyEntityId'] as string) || '';
      const propertyType = (p['propertyType'] as string) || '';
      const isRental = propertyType === 'Rental' || propertyType === 'Investment' || propertyType === 'Commercial';
      return { id: propertyEntityId, name, propertyType, isRental };
    })
    .filter((p) => p.name && p.id);
}

/** Legacy fallback for properties that pre-date propertyEntityId. Migration-only. */
export function deriveKnownPropertiesWithFallback(
  allAnswers: Map<string, Record<string, unknown>>
): KnownProperty[] {
  const realEstate = allAnswers.get('realEstate') || {};
  const propertiesData = (realEstate['propertiesData'] as Array<Record<string, unknown>>) || [];
  return propertiesData
    .map((p, i) => {
      const name = (p['propertyName'] as string) || (p['name'] as string) || '';
      const propertyEntityId = (p['propertyEntityId'] as string) || '';
      const propertyType = (p['propertyType'] as string) || '';
      const isRental = propertyType === 'Rental' || propertyType === 'Investment' || propertyType === 'Commercial';
      const id = propertyEntityId || `legacy_prop_${i}`;
      return { id, name, propertyType, isRental };
    })
    .filter((p) => p.name);
}

export interface KnownVehicle {
  id: string;
  name: string;
  subtype?: string;
}

export function deriveKnownVehicles(
  allAnswers: Map<string, Record<string, unknown>>
): KnownVehicle[] {
  const footprint = allAnswers.get('financialFootprint') || {};
  const otherAssets = (footprint['otherAssetsData'] as Array<Record<string, unknown>>) || [];
  const vehicleSubtypes = ['vehicle', 'boat', 'motorcycle', 'atv', 'snowmobile', 'trailer', 'motorhome', 'rv'];
  return otherAssets
    .filter((a) => {
      const subtype = (a['subtype'] as string) || '';
      return vehicleSubtypes.some((v) => subtype.toLowerCase().includes(v));
    })
    .map((a) => {
      const name = (a['friendlyLabel'] as string) || (a['description'] as string) || '';
      const id = (a['id'] as string) || '';
      return { id, name, subtype: (a['subtype'] as string) || '' };
    })
    .filter((v) => v.name && v.id);
}

export type PaymentSourceType = 'bank_account' | 'credit_card' | 'other' | 'not_sure';

export interface KnownPaymentSource {
  id: string;
  name: string;
  sourceType: PaymentSourceType;
  owner: string;
}

function getStableAccountId(inst: Record<string, unknown>, dataKey: string, index: number): string {
  if (inst['id'] && typeof inst['id'] === 'string') return inst['id'] as string;
  // LEGACY MIGRATION FALLBACK ONLY — do not use for newly created accounts
  return `${dataKey}_${index}`;
}

export function deriveBankAccounts(
  allAnswers: Map<string, Record<string, unknown>>,
  client1Name: string,
  client2Name: string,
  hasSpouse: boolean
): KnownPaymentSource[] {
  const footprint = allAnswers.get('financialFootprint') || {};
  const accounts: KnownPaymentSource[] = [];

  const addAccounts = (data: unknown, ownerLabel: string, dataKey: string) => {
    const arr = data as Array<Record<string, unknown>>;
    if (!Array.isArray(arr)) return;
    arr.forEach((inst, i) => {
      const name = (inst['name'] as string) || '';
      const type = (inst['accountType'] as string) || '';
      if (name) {
        const id = getStableAccountId(inst, dataKey, i);
        accounts.push({
          id,
          name: `${name}${type ? ` — ${type}` : ''}`,
          sourceType: 'bank_account' as PaymentSourceType,
          owner: ownerLabel,
        });
      }
    });
  };

  const bankingStructure = (footprint['bankingStructure'] as string) || '';
  if (!hasSpouse) {
    addAccounts(footprint['client1InstitutionsData'], client1Name, 'client1InstitutionsData');
  } else if (bankingStructure === 'individual') {
    addAccounts(footprint['client1InstitutionsData'], client1Name, 'client1InstitutionsData');
    addAccounts(footprint['client2InstitutionsData'], client2Name, 'client2InstitutionsData');
  } else if (bankingStructure === 'joint') {
    addAccounts(footprint['jointInstitutionsData'], `${client1Name} & ${client2Name}`, 'jointInstitutionsData');
  } else if (bankingStructure === 'mixed') {
    addAccounts(footprint['mixedJointInstitutionsData'], `${client1Name} & ${client2Name}`, 'mixedJointInstitutionsData');
    addAccounts(footprint['mixedClient1InstitutionsData'], client1Name, 'mixedClient1InstitutionsData');
    addAccounts(footprint['mixedClient2InstitutionsData'], client2Name, 'mixedClient2InstitutionsData');
  }

  return accounts;
}

export interface KnownCreditCard {
  id: string;
  name: string;
  owner: string;
}

export function deriveCreditCards(
  allAnswers: Map<string, Record<string, unknown>>,
  client1Name: string,
  client2Name: string
): KnownCreditCard[] {
  const footprint = allAnswers.get('financialFootprint') || {};
  const cards = (footprint['creditCardsData'] as Array<Record<string, unknown>>) || [];
  return cards
    .map((c) => {
      const id = (c['id'] as string) || '';
      const name = (c['cardLabel'] as string) || (c['issuer'] as string) || (c['nickname'] as string) || '';
      const responsibleParty = (c['responsibleParty'] as string) || '';
      const owner = responsibleParty === 'client2' ? client2Name : responsibleParty === 'joint' ? `${client1Name} & ${client2Name}` : client1Name;
      return { id, name, owner };
    })
    .filter((c) => c.id && c.name);
}

export function generateBankAccountId(): string {
  return `acct_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateCreditCardId(): string {
  return `cc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
