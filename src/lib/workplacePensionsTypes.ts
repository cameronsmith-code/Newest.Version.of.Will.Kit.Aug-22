export type WorkplaceBenefitFamily =
  | 'definedBenefitPension'
  | 'accountBasedPlan'
  | 'employerEquity'
  | 'executiveDeferred'
  | 'employerInsurance'
  | 'other';

export type WorkplaceBenefitType =
  | 'db'
  | 'dc'
  | 'group_rrsp'
  | 'dpsp'
  | 'group_tfsa'
  | 'prpp'
  | 'espp'
  | 'stock_options'
  | 'rsu'
  | 'psu'
  | 'dsu'
  | 'supplemental_retirement'
  | 'deferred_comp'
  | 'deferred_bonus'
  | 'rca'
  | 'employer_life_insurance'
  | 'employer_death_benefit'
  | 'pension_death_benefit'
  | 'other'
  | 'not_sure';

export type EmployerRecord = {
  id: string;
  name: string;
  isCurrent: boolean;
  clientId: 'client1' | 'client2';
  // Cross-border: employer country
  countryCode?: string;
  countryName?: string;
};

export type DocumentLocationRef = {
  locationId: string;
  label: string;
};

export type WorkplaceBenefit = {
  id: string;
  clientId: 'client1' | 'client2';
  employerId: string;
  employerName: string;
  employerIsCurrent: boolean;
  family: WorkplaceBenefitFamily;
  benefitType: WorkplaceBenefitType;
  benefitTypeLabel: string;
  planName?: string;
  memberStatus?: string;
  // Link to Financial Footprint account (for account-based plans)
  footprintAccountId?: string;
  footprintAccountRecognized?: boolean;
  // Administrator / contact
  administratorSelection?: string;
  administratorName?: string;
  administratorContactName?: string;
  administratorContactPhone?: string;
  administratorContactEmail?: string;
  // Document location (registry-backed)
  documentLocationRef?: DocumentLocationRef | null;
  // DB pension status
  dbPensionStatus?: string;
  // DB pension detailed review
  dbPensionDetails?: DbPensionDetails;
  // Equity placeholder
  equityTypes?: string[];
  // Equity / executive compensation detailed review
  equityBenefitDetails?: EquityBenefitDetails;
  // Executive / deferred
  executiveType?: string;
  // Employer insurance handoff
  insuranceHandoff?: boolean;
  insuranceContactSource?: string;
  // Closing discovery
  notes?: string;
  // Framework flags
  detailedReviewPending?: boolean;
};

// ─── DB Pension Details ───────────────────────────────────────────────────

export type PensionEstimate = {
  id: string;
  amount: number | undefined;
  frequency: 'monthly' | 'annual' | '';
  basedOnType: 'age' | 'date' | 'not_sure' | '';
  basedOnAge?: number | undefined;
  basedOnDate?: string;
  estimateDate?: string; // month/year
  isPrimary?: boolean;
};

export type EligibilityMilestone = {
  type: 'age' | 'date' | 'years_of_service' | 'other' | '';
  age?: number | undefined;
  date?: string;
  years?: number | undefined;
  otherText?: string;
};

export type BridgeBenefit = {
  hasBridge: 'yes' | 'no' | 'not_sure';
  amount?: number | undefined;
  frequency?: 'monthly' | 'annual' | '';
  endType?: 'age_65' | 'age' | 'date' | 'other' | 'not_sure';
  endAge?: number | undefined;
  endDate?: string;
  endOtherText?: string;
  includedInEstimate?: 'yes' | 'no' | 'not_sure';
};

export type IndexingInfo = {
  hasIndexing: 'yes' | 'no' | 'not_sure';
  method?: 'inflation' | 'fixed_percentage' | 'other' | 'not_sure';
  inflationPercentage?: number | undefined;
  hasMaxIncrease?: 'yes' | 'no' | 'not_sure';
  maxIncreasePercentage?: number | undefined;
  hasMinIncrease?: 'yes' | 'no' | 'not_sure';
  minIncreasePercentage?: number | undefined;
};

export type SurvivorBenefitType =
  | 'ongoing_pension'
  | 'lump_sum'
  | 'choice'
  | 'other'
  | 'not_sure';

export type SurvivorAmountKind = 'percentage' | 'fixed_amount' | 'not_sure';

export type SurvivorUnderstanding = {
  hasSurvivorBenefit: 'yes' | 'no' | 'not_sure';
  beneficiaryPersonIds?: string[];
  beneficiaryOtherText?: string;
  survivorBenefitType?: SurvivorBenefitType;
  // In-payment survivor amount (separate from benefit type)
  survivorAmountKind?: SurvivorAmountKind;
  survivorPercentage?: number | null;
  survivorFixedAmount?: number | null;
  survivorAmountFrequency?: 'monthly' | 'annual' | null;
  // Legacy field kept for migration compatibility
  benefitTypes?: string[];
  // Spouse confirmation
  spouseConfirmed?: 'yes' | 'no' | 'not_sure';
  spousePersonId?: string;
  alternatePersonId?: string;
  alternatePersonName?: string;
};

export type WaiverInfo = {
  hasWaiver: 'yes' | 'no' | 'not_sure' | 'not_applicable';
  documentLocationRef?: DocumentLocationRef | null;
};

export type DomesticAgreementInfo = {
  affectsPension: 'yes' | 'no' | 'not_sure';
  documentLocationRef?: DocumentLocationRef | null;
};

export type GuaranteePeriod = {
  hasGuarantee: 'yes' | 'no' | 'not_sure';
  years?: number | undefined;
  beneficiaryType?: 'person' | 'estate' | 'other' | 'not_sure';
  beneficiaryPersonIds?: string[];
};

export type InPaymentDetails = {
  currentAmount?: number | undefined;
  currentFrequency?: 'monthly' | 'annual' | '';
  startedAge?: number | undefined;
  startedDate?: string; // month/year
  bridge?: BridgeBenefit;
  indexing?: IndexingInfo;
  survivor?: SurvivorUnderstanding;
  guarantee?: GuaranteePeriod;
  bridgeAndSurvivor?: 'yes' | 'no' | 'not_sure';
  waiver?: WaiverInfo;
};

export type DbPensionDetails = {
  jurisdiction?: string;
  // Active/deferred fields
  unreducedEligibilityKnown?: 'yes' | 'no' | 'not_sure';
  unreducedEligibility?: EligibilityMilestone;
  maxAccrualKnown?: 'yes' | 'no' | 'not_sure';
  maxAccrual?: EligibilityMilestone;
  expectedCommencementType?: 'age' | 'date' | 'not_sure';
  expectedCommencementAge?: number | undefined;
  expectedCommencementDate?: string;
  estimates?: PensionEstimate[];
  bridge?: BridgeBenefit;
  indexing?: IndexingInfo;
  survivor?: SurvivorUnderstanding;
  waiver?: WaiverInfo;
  domesticAgreement?: DomesticAgreementInfo;
  familyReadinessConfirmed?: 'yes' | 'no' | 'not_sure';
  // In-payment fields
  inPayment?: InPaymentDetails;
};

// ─── Government Retirement Benefits ────────────────────────────────────────

export type CppQppStatus = 'not_started' | 'receiving' | 'not_sure';

export type CppQppData = {
  programType: 'cpp' | 'qpp' | 'not_sure';
  status: CppQppStatus;
  // Not started
  estimatedAmount?: number | undefined;
  estimateBasedOnAge?: number | undefined;
  estimateDate?: string;
  plannedStartAge?: number | undefined;
  // Receiving
  currentAmount?: number | undefined;
  startedAge?: number | undefined;
  startedDate?: string;
};

export type OasStatus = 'not_started' | 'receiving' | 'not_sure';

export type OasData = {
  status: OasStatus;
  // Not started
  estimatedAmount?: number | undefined;
  estimateDate?: string;
  plannedStartAge?: number | undefined;
  // Receiving
  currentAmount?: number | undefined;
  startedAge?: number | undefined;
  startedDate?: string;
};

export type GovernmentBenefitsData = {
  cppQpp?: CppQppData;
  oas?: OasData;
};

export const PENSION_JURISDICTION_OPTIONS = [
  { value: 'federal', label: 'Federal' },
  { value: 'ontario', label: 'Ontario' },
  { value: 'alberta', label: 'Alberta' },
  { value: 'british_columbia', label: 'British Columbia' },
  { value: 'manitoba', label: 'Manitoba' },
  { value: 'new_brunswick', label: 'New Brunswick' },
  { value: 'newfoundland_labrador', label: 'Newfoundland and Labrador' },
  { value: 'nova_scotia', label: 'Nova Scotia' },
  { value: 'prince_edward_island', label: 'Prince Edward Island' },
  { value: 'quebec', label: 'Quebec' },
  { value: 'saskatchewan', label: 'Saskatchewan' },
  { value: 'other', label: 'Another jurisdiction' },
  { value: 'outside_canada', label: 'Outside Canada' },
  { value: 'not_sure', label: "I'm not sure" },
];

export const SURVIVOR_BENEFIT_TYPE_OPTIONS = [
  { value: 'ongoing_pension', label: 'Ongoing pension income' },
  { value: 'lump_sum', label: 'A lump-sum payment' },
  { value: 'choice', label: 'A choice between different options' },
  { value: 'other', label: 'Something else' },
  { value: 'not_sure', label: "I know there's a benefit, but I'm not sure how it works" },
];

export const SURVIVOR_PERCENTAGE_OPTIONS = [
  { value: '100', label: '100%' },
  { value: '75', label: '75%' },
  { value: '66.67', label: '66⅔%' },
  { value: '60', label: '60%' },
  { value: '50', label: '50%' },
  { value: 'other', label: 'Other percentage' },
  { value: 'fixed_amount', label: 'Approximate fixed amount' },
  { value: 'not_sure', label: "I'm not sure" },
];

export const OAS_START_AGE_OPTIONS = [
  { value: '65', label: '65' },
  { value: '66', label: '66' },
  { value: '67', label: '67' },
  { value: '68', label: '68' },
  { value: '69', label: '69' },
  { value: '70', label: '70' },
  { value: 'not_sure', label: "I'm not sure" },
];

export function generateEstimateId(): string {
  return `est_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export type WorkplaceClientData = {
  hasWorkplaceBenefits?: string;
  selectedBenefits?: string[];
  hasFormerEmployerBenefits?: string;
  employers?: EmployerRecord[];
  benefits?: WorkplaceBenefit[];
  hasOtherEmploymentValue?: string;
  governmentBenefits?: GovernmentBenefitsData;
};

export function generateWorkplaceId(prefix: string = 'wpb'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateEmployerId(): string {
  return `emp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const WORKPLACE_BENEFIT_OPTIONS: Array<{
  value: WorkplaceBenefitType;
  label: string;
  family: WorkplaceBenefitFamily;
  description?: string;
}> = [
  { value: 'db', label: 'Defined benefit pension', family: 'definedBenefitPension', description: 'A pension that pays a set amount based on a formula.' },
  { value: 'dc', label: 'Defined contribution pension', family: 'accountBasedPlan', description: 'Retirement savings in an individual plan account.' },
  { value: 'group_rrsp', label: 'Group RRSP', family: 'accountBasedPlan', description: 'An RRSP offered through your employer.' },
  { value: 'dpsp', label: 'DPSP / profit-sharing plan', family: 'accountBasedPlan', description: 'Deferred Profit Sharing Plan.' },
  { value: 'group_tfsa', label: 'Group TFSA', family: 'accountBasedPlan', description: 'A TFSA offered through your employer.' },
  { value: 'prpp', label: 'PRPP or other workplace retirement plan', family: 'accountBasedPlan', description: 'Pooled Registered Pension Plan or similar.' },
  { value: 'espp', label: 'Employee share purchase / ownership plan', family: 'employerEquity', description: 'A plan that lets you buy employer shares.' },
  { value: 'stock_options', label: 'Stock options', family: 'employerEquity', description: 'Options to buy employer shares at a set price.' },
  { value: 'rsu', label: 'Restricted / performance / deferred share units (RSUs, PSUs or DSUs)', family: 'employerEquity', description: 'Share units that may vest over time.' },
  { value: 'supplemental_retirement', label: 'Supplemental or executive retirement plan', family: 'executiveDeferred', description: 'An executive or top-up retirement arrangement.' },
  { value: 'deferred_comp', label: 'Deferred compensation / deferred bonus arrangement', family: 'executiveDeferred', description: 'Compensation deferred to a future date.' },
  { value: 'employer_life_insurance', label: 'Employer-provided life insurance or death benefit', family: 'employerInsurance', description: 'Life insurance or a death benefit through work.' },
  { value: 'other', label: 'Other financial benefit', family: 'other', description: 'Something else with financial value.' },
  { value: 'not_sure', label: "I'm not sure", family: 'other', description: 'Not sure what kind of benefit it is.' },
];

export const DB_PENSION_STATUS_OPTIONS = [
  { value: 'active', label: 'Still earning pension benefits' },
  { value: 'deferred', label: "No longer employed there, but the pension remains in the plan" },
  { value: 'receiving', label: 'Currently receiving the pension' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

export const EQUITY_TYPE_OPTIONS = [
  { value: 'stock_options', label: 'Stock options' },
  { value: 'rsu', label: 'RSUs' },
  { value: 'psu', label: 'PSUs' },
  { value: 'dsu', label: 'DSUs' },
  { value: 'espp', label: 'Employee share purchase / ownership plan' },
  { value: 'employer_shares', label: 'Employer shares' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

export const EXECUTIVE_TYPE_OPTIONS = [
  { value: 'supplemental_retirement', label: 'Supplemental / executive pension' },
  { value: 'rca', label: 'Retirement Compensation Arrangement (RCA)' },
  { value: 'deferred_comp', label: 'Deferred compensation' },
  { value: 'deferred_bonus', label: 'Deferred bonus / incentive' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

export const INSURANCE_CONTACT_OPTIONS = [
  { value: 'employer_hr', label: 'Employer HR' },
  { value: 'benefits_administrator', label: 'Existing benefits administrator' },
  { value: 'add_contact', label: 'Add contact' },
  { value: 'not_sure', label: "I'm not sure" },
];

export const ADMINISTRATOR_PRESETS = [
  'Sun Life',
  'Manulife',
  'Canada Life',
  'Mercer',
  'Employer HR Department',
  'Other',
];

export function familyLabel(family: WorkplaceBenefitFamily): string {
  switch (family) {
    case 'definedBenefitPension': return 'Defined Benefit Pension';
    case 'accountBasedPlan': return 'Account-Based Workplace Plan';
    case 'employerEquity': return 'Employer Equity / Executive Compensation';
    case 'executiveDeferred': return 'Executive / Deferred Compensation';
    case 'employerInsurance': return 'Employer Insurance / Death Benefit';
    case 'other': return 'Other';
  }
}

export function benefitTypeLabel(value: string): string {
  const found = WORKPLACE_BENEFIT_OPTIONS.find((o) => o.value === value);
  return found ? found.label : value;
}

export function familyForType(value: string): WorkplaceBenefitFamily {
  const found = WORKPLACE_BENEFIT_OPTIONS.find((o) => o.value === value);
  return found ? found.family : 'other';
}

export const FOOTPRINT_PENSION_SUBTYPES = new Set([
  'db', 'dc', 'group_rrsp', 'dpsp', 'group_tfsa', 'prpp', 'ipp', 'rca', 'other', 'not_sure',
]);

export function mapBenefitTypeToPensionSubtype(bt: WorkplaceBenefitType): string {
  if (bt === 'db') return 'db';
  if (bt === 'dc') return 'dc';
  if (bt === 'group_rrsp') return 'group_rrsp';
  if (bt === 'dpsp') return 'dpsp';
  if (bt === 'group_tfsa') return 'group_tfsa';
  if (bt === 'prpp') return 'prpp';
  if (bt === 'supplemental_retirement') return 'rca';
  return 'other';
}

export function mapPensionSubtypeToBenefitType(subtype: string): WorkplaceBenefitType | null {
  if (subtype === 'db') return 'db';
  if (subtype === 'dc') return 'dc';
  if (subtype === 'group_rrsp') return 'group_rrsp';
  if (subtype === 'dpsp') return 'dpsp';
  if (subtype === 'group_tfsa') return 'group_tfsa';
  if (subtype === 'prpp') return 'prpp';
  if (subtype === 'rca') return 'supplemental_retirement';
  if (subtype === 'other' || subtype === 'not_sure') return 'other';
  return null;
}

// ─── Retirement Benefit Classification ──────────────────────────────────────

export type RetirementAssetClassification =
  | 'balance_sheet_account'
  | 'income_entitlement'
  | 'unclassified';

const BALANCE_SHEET_BENEFIT_TYPES = new Set<WorkplaceBenefitType>([
  'dc', 'group_rrsp', 'dpsp', 'group_tfsa', 'prpp',
]);

const INCOME_ENTITLEMENT_BENEFIT_TYPES = new Set<WorkplaceBenefitType>([
  'db',
]);

export function classifyRetirementBenefit(
  benefitType: WorkplaceBenefitType,
): RetirementAssetClassification {
  if (BALANCE_SHEET_BENEFIT_TYPES.has(benefitType)) return 'balance_sheet_account';
  if (INCOME_ENTITLEMENT_BENEFIT_TYPES.has(benefitType)) return 'income_entitlement';
  return 'unclassified';
}

export function isBalanceSheetAccount(benefitType: WorkplaceBenefitType): boolean {
  return classifyRetirementBenefit(benefitType) === 'balance_sheet_account';
}

export function isIncomeEntitlement(benefitType: WorkplaceBenefitType): boolean {
  return classifyRetirementBenefit(benefitType) === 'income_entitlement';
}

export function isUnclassifiedRetirementBenefit(
  benefitType: WorkplaceBenefitType,
): boolean {
  return classifyRetirementBenefit(benefitType) === 'unclassified';
}

export function classifyGovernmentBenefit(
  _source: 'cpp_qpp' | 'oas',
): RetirementAssetClassification {
  return 'income_entitlement';
}

export function isGovernmentBenefitIncome(
  govData: GovernmentBenefitsData | undefined,
): boolean {
  if (!govData) return false;
  return !!(govData.cppQpp || govData.oas);
}

// ─── Retirement Income Entitlement Dataset ──────────────────────────────────

export type RetirementIncomeEntitlement = {
  clientId: string;
  source: 'db_pension' | 'cpp_qpp' | 'oas';
  sourceRecordId?: string;
  name: string;
  status: string;
  currentIncome?: number | undefined;
  currentIncomeFrequency?: 'monthly' | 'annual' | '';
  projectedIncome?: number | undefined;
  projectedIncomeFrequency?: 'monthly' | 'annual' | '';
  plannedCommencementAge?: number | undefined;
  plannedCommencementDate?: string;
  bridgeAmount?: number | undefined;
  bridgeEndAge?: number | undefined;
  bridgeEndDate?: string;
  indexingKnown?: 'yes' | 'no' | 'not_sure';
  survivorKnown?: 'yes' | 'no' | 'not_sure';
  jurisdiction?: string;
  employerName?: string;
  administratorName?: string;
  documentLocationId?: string;
};

export function buildRetirementIncomeEntitlements(
  clientId: string,
  clientData: WorkplaceClientData,
): RetirementIncomeEntitlement[] {
  const items: RetirementIncomeEntitlement[] = [];
  const benefits = clientData.benefits || [];

  for (const benefit of benefits) {
    if (benefit.family !== 'definedBenefitPension') continue;
    const details = benefit.dbPensionDetails;
    const isReceiving = benefit.dbPensionStatus === 'receiving';
    const primaryEstimate = details?.estimates?.[0];
    const inPayment = details?.inPayment;

    items.push({
      clientId,
      source: 'db_pension',
      sourceRecordId: benefit.id,
      name: benefit.planName || `${benefit.employerName} Defined Benefit Pension`,
      status: benefit.dbPensionStatus || 'not_sure',
      currentIncome: isReceiving ? inPayment?.currentAmount : undefined,
      currentIncomeFrequency: isReceiving ? inPayment?.currentFrequency : '',
      projectedIncome: !isReceiving ? primaryEstimate?.amount : undefined,
      projectedIncomeFrequency: !isReceiving ? primaryEstimate?.frequency : '',
      plannedCommencementAge: details?.expectedCommencementAge,
      plannedCommencementDate: details?.expectedCommencementDate,
      bridgeAmount: isReceiving ? inPayment?.bridge?.amount : details?.bridge?.amount,
      bridgeEndAge: isReceiving
        ? (inPayment?.bridge?.endType === 'age_65' ? 65 : inPayment?.bridge?.endAge)
        : (details?.bridge?.endType === 'age_65' ? 65 : details?.bridge?.endAge),
      bridgeEndDate: isReceiving ? inPayment?.bridge?.endDate : details?.bridge?.endDate,
      indexingKnown: isReceiving ? inPayment?.indexing?.hasIndexing : details?.indexing?.hasIndexing,
      survivorKnown: isReceiving ? inPayment?.survivor?.hasSurvivorBenefit : details?.survivor?.hasSurvivorBenefit,
      jurisdiction: details?.jurisdiction,
      employerName: benefit.employerName,
      administratorName: benefit.administratorName,
      documentLocationId: benefit.documentLocationRef?.locationId,
    });
  }

  const gov = clientData.governmentBenefits;
  if (gov?.cppQpp) {
    const cpp = gov.cppQpp;
    items.push({
      clientId,
      source: 'cpp_qpp',
      name: cpp.programType === 'qpp' ? 'QPP' : 'CPP',
      status: cpp.status,
      currentIncome: cpp.status === 'receiving' ? cpp.currentAmount : undefined,
      currentIncomeFrequency: cpp.status === 'receiving' ? 'monthly' : '',
      projectedIncome: cpp.status !== 'receiving' ? cpp.estimatedAmount : undefined,
      projectedIncomeFrequency: cpp.status !== 'receiving' ? 'monthly' : '',
      plannedCommencementAge: cpp.status !== 'receiving' ? cpp.plannedStartAge : undefined,
    });
  }
  if (gov?.oas) {
    const oas = gov.oas;
    items.push({
      clientId,
      source: 'oas',
      name: 'OAS',
      status: oas.status,
      currentIncome: oas.status === 'receiving' ? oas.currentAmount : undefined,
      currentIncomeFrequency: oas.status === 'receiving' ? 'monthly' : '',
      projectedIncome: oas.status !== 'receiving' ? oas.estimatedAmount : undefined,
      projectedIncomeFrequency: oas.status !== 'receiving' ? 'monthly' : '',
      plannedCommencementAge: oas.status !== 'receiving' ? oas.plannedStartAge : undefined,
    });
  }

  return items;
}

// ─── Planning Opportunity Selectors ─────────────────────────────────────────

export type PlanningOpportunityPriority = 'planning' | 'higher' | 'action' | 'none';

export type RetirementPlanningOpportunity = {
  clientId: string;
  pensionName: string;
  pensionRecordId: string;
  employerId?: string;
  expectedCommencementAge?: number | undefined;
  expectedCommencementDate?: string;
  yearsRemaining: number;
  priority: PlanningOpportunityPriority;
  unreducedEligibilityAge?: number | undefined;
  maxAccrualAge?: number | undefined;
  survivorKnown: 'yes' | 'no' | 'not_sure';
  cppQppPlannedStartAge?: number | undefined;
  oasPlannedStartAge?: number | undefined;
};

export function estimateClientAge(
  aboutYouData: Record<string, unknown> | undefined,
): number | undefined {
  if (!aboutYouData) return undefined;
  const birthYear = aboutYouData['birthYear'] as string | undefined;
  const ageStr = aboutYouData['age'] as string | undefined;
  if (ageStr) {
    const parsed = parseInt(ageStr, 10);
    if (!isNaN(parsed)) return parsed;
  }
  if (birthYear) {
    const parsed = parseInt(birthYear, 10);
    if (!isNaN(parsed)) {
      const currentYear = new Date().getFullYear();
      return currentYear - parsed;
    }
  }
  return undefined;
}

export function computeRetirementPlanningOpportunities(
  clientId: string,
  clientData: WorkplaceClientData,
  clientAge: number | undefined,
  currentDate: Date = new Date(),
): RetirementPlanningOpportunity[] {
  const benefits = clientData.benefits || [];
  const gov = clientData.governmentBenefits;
  const opportunities: RetirementPlanningOpportunity[] = [];

  for (const dbBenefit of benefits) {
    if (dbBenefit.family !== 'definedBenefitPension') continue;
    const details = dbBenefit.dbPensionDetails;
    if (!details) continue;
    if (dbBenefit.dbPensionStatus === 'receiving') continue;

    let commencementAge: number | undefined;
    let commencementDate: string | undefined;

    if (details.expectedCommencementType === 'age' && details.expectedCommencementAge) {
      commencementAge = details.expectedCommencementAge;
    } else if (details.expectedCommencementType === 'date' && details.expectedCommencementDate) {
      commencementDate = details.expectedCommencementDate;
    }

    let yearsRemaining: number | undefined;

    if (commencementAge !== undefined && clientAge !== undefined) {
      yearsRemaining = commencementAge - clientAge;
    } else if (commencementDate) {
      const parsed = new Date(commencementDate);
      if (!isNaN(parsed.getTime())) {
        const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
        yearsRemaining = (parsed.getTime() - currentDate.getTime()) / msPerYear;
      }
    }

    if (yearsRemaining === undefined || yearsRemaining < 0) continue;
    if (yearsRemaining > 10) continue;

    let priority: PlanningOpportunityPriority = 'planning';
    if (yearsRemaining <= 2) priority = 'action';
    else if (yearsRemaining <= 5) priority = 'higher';

    opportunities.push({
      clientId,
      pensionName: dbBenefit.planName || `${dbBenefit.employerName} Pension`,
      pensionRecordId: dbBenefit.id,
      employerId: dbBenefit.employerId || undefined,
      expectedCommencementAge: commencementAge,
      expectedCommencementDate: commencementDate,
      yearsRemaining: Math.round(yearsRemaining * 10) / 10,
      priority,
      unreducedEligibilityAge: details.unreducedEligibility?.age,
      maxAccrualAge: details.maxAccrual?.age,
      survivorKnown: details.survivor?.hasSurvivorBenefit || 'not_sure',
      cppQppPlannedStartAge: gov?.cppQpp?.plannedStartAge,
      oasPlannedStartAge: gov?.oas?.plannedStartAge,
    });
  }

  return opportunities;
}

// ─── Bridge / Government Benefit Timing Selector ────────────────────────────

export type BridgeTimingGap = {
  clientId: string;
  pensionRecordId: string;
  pensionName: string;
  employerId?: string;
  bridgeAmount?: number | undefined;
  bridgeEndAge?: number | undefined;
  cppQppPlannedStartAge?: number | undefined;
  oasPlannedStartAge?: number | undefined;
  gapYears?: number | undefined;
  insufficientInfo: boolean;
};

export function computeBridgeTimingGaps(
  clientId: string,
  clientData: WorkplaceClientData,
): BridgeTimingGap[] {
  const benefits = clientData.benefits || [];
  const gov = clientData.governmentBenefits;
  const cppStartAge = gov?.cppQpp?.plannedStartAge;
  const oasStartAge = gov?.oas?.plannedStartAge;
  const results: BridgeTimingGap[] = [];

  for (const dbBenefit of benefits) {
    if (dbBenefit.family !== 'definedBenefitPension') continue;
    const details = dbBenefit.dbPensionDetails;
    if (!details) continue;

    const isReceiving = dbBenefit.dbPensionStatus === 'receiving';
    const bridge = isReceiving ? details.inPayment?.bridge : details.bridge;

    if (!bridge || bridge.hasBridge !== 'yes') continue;

    const pensionName = dbBenefit.planName || `${dbBenefit.employerName} Pension`;

    let bridgeEndAge: number | undefined;
    if (bridge.endType === 'age_65') bridgeEndAge = 65;
    else if (bridge.endType === 'age') bridgeEndAge = bridge.endAge;
    else if (bridge.endType === 'date') {
      bridgeEndAge = undefined;
    }

    if (bridgeEndAge === undefined) {
      results.push({
        clientId,
        pensionRecordId: dbBenefit.id,
        pensionName,
        employerId: dbBenefit.employerId || undefined,
        bridgeAmount: bridge.amount,
        bridgeEndAge: undefined,
        cppQppPlannedStartAge: cppStartAge,
        oasPlannedStartAge: oasStartAge,
        insufficientInfo: true,
      });
      continue;
    }

    const referenceGovAge = cppStartAge ?? oasStartAge;
    if (referenceGovAge === undefined) {
      results.push({
        clientId,
        pensionRecordId: dbBenefit.id,
        pensionName,
        employerId: dbBenefit.employerId || undefined,
        bridgeAmount: bridge.amount,
        bridgeEndAge,
        cppQppPlannedStartAge: cppStartAge,
        oasPlannedStartAge: oasStartAge,
        insufficientInfo: true,
      });
      continue;
    }

    const gapYears = referenceGovAge - bridgeEndAge;
    if (gapYears <= 0) continue;

    results.push({
      clientId,
      pensionRecordId: dbBenefit.id,
      pensionName,
      employerId: dbBenefit.employerId || undefined,
      bridgeAmount: bridge.amount,
      bridgeEndAge,
      cppQppPlannedStartAge: cppStartAge,
      oasPlannedStartAge: oasStartAge,
      gapYears,
      insufficientInfo: false,
    });
  }

  return results;
}

// ─── Equity / Executive Compensation Details ──────────────────────────────────

export type EquityOwnershipStatus =
  | 'currently_own'
  | 'future_contingent'
  | 'both'
  | 'not_sure';

export type VestingStatus =
  | 'fully_vested'
  | 'partly_vested'
  | 'not_vested'
  | 'not_sure';

export type VestingDate = {
  id: string;
  date?: string;
  label?: string;
};

export type EquityPaymentStatus =
  | 'not_receiving'
  | 'receiving'
  | 'not_sure';

export type EquityPaymentInfo = {
  status: EquityPaymentStatus;
  amount?: number | undefined;
  frequency?: 'monthly' | 'annual' | 'other' | '';
};

export type ReportedValue = {
  hasReportedValue: 'yes' | 'no' | 'not_sure';
  amount?: number | undefined;
  statementDate?: string;
};

export type EquityDeathIncapacityRules = {
  hasSpecialRules: 'yes' | 'no' | 'not_sure';
  notes?: string;
};

export type EquityTerminationRules = {
  leavingChangesBenefit: 'yes' | 'no' | 'not_sure';
  hasDeadlineOrRule: 'yes' | 'no' | 'not_sure';
  deadline?: string;
  notes?: string;
};

export type BeneficiaryDesignationAllowed = 'yes' | 'no' | 'not_sure';

export type EquityBeneficiary = {
  beneficiaryDesignationAllowed: BeneficiaryDesignationAllowed;
  // Who is named (only when allowed = yes)
  beneficiaryType?: 'person' | 'estate' | 'other' | 'not_sure';
  beneficiaryPersonIds?: string[];
  beneficiaryOtherText?: string;
};

export type OptionExpiryStatus = 'known' | 'unknown' | 'none_reported';

// ─── Cross-border: Equity Issuer ──────────────────────────────────────────────

export type EmployerCountrySelection = 'canada' | 'united_states' | 'another_country' | 'not_sure';

export type IssuerSameAsEmployer = 'yes' | 'no' | 'not_sure';

export type EquityIssuerInfo = {
  issuerSameAsEmployer?: IssuerSameAsEmployer;
  issuerCompanyName?: string;
  issuerCompanyEntityId?: string;
  issuerCountry?: EmployerCountrySelection;
  issuerOtherCountryName?: string;
  custodyContext?: 'canadian_brokerage' | 'us_foreign_brokerage' | 'employer_plan_administrator' | 'other' | 'unknown';
};

export type EquityBenefitDetails = {
  // Plan / program name (display)
  planName?: string;
  // Ownership vs contingent
  ownershipStatus?: EquityOwnershipStatus;
  // Footprint reconciliation
  footprintAssetId?: string;
  footprintAssetRecognized?: boolean;
  footprintOffered?: 'yes' | 'no' | 'not_sure';
  // Reported value (NOT balance-sheet market value)
  reportedValue?: ReportedValue;
  // Vesting
  vestingStatus?: VestingStatus;
  vestingDates?: VestingDate[];
  // Stock option specifics
  optionCount?: number | undefined;
  exercisePrice?: number | undefined;
  optionExpiryStatus?: OptionExpiryStatus;
  optionExpiryDate?: string;
  // Executive / deferred payment
  currentlyReceiving?: EquityPaymentInfo;
  // Death / incapacity
  deathIncapacity?: EquityDeathIncapacityRules;
  // Termination / change of employment
  termination?: EquityTerminationRules;
  // Beneficiary
  beneficiary?: EquityBeneficiary;
  // Family readiness
  familyReadinessConfirmed?: 'yes' | 'no' | 'not_sure';
  // Cross-border: equity issuer (may differ from employer)
  equityIssuer?: EquityIssuerInfo;
  // Free notes
  notes?: string;
};

export function generateVestingDateId(): string {
  return `vd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Equity Benefit Output Datasets ──────────────────────────────────────────

export type EquityExecutorPrompt = {
  clientId: string;
  benefitId: string;
  planName: string;
  employerName: string;
  administratorName?: string;
  documentLocationLabel?: string;
  deathIncapacityKnown: 'yes' | 'no' | 'not_sure';
  terminationKnown: 'yes' | 'no' | 'not_sure';
  optionExpiryStatus?: OptionExpiryStatus;
  optionExpiryDate?: string;
  nextVestingDate?: string;
  beneficiaryDesignationAllowed?: BeneficiaryDesignationAllowed;
  requiresPromptReview: boolean;
};

export type EquityPoaSummary = {
  clientId: string;
  benefitId: string;
  planName: string;
  employerName: string;
  administratorName?: string;
  documentLocationLabel?: string;
  vestingDates: string[];
  optionExpiryStatus?: OptionExpiryStatus;
  optionExpiryDate?: string;
  paymentStream?: { amount: number; frequency: string };
  deathIncapacityKnown: 'yes' | 'no' | 'not_sure';
};

export type EquityBalanceSheetClassification = {
  benefitId: string;
  classification: RetirementAssetClassification;
  footprintAssetId?: string;
  isContingent: boolean;
  reportedValue?: number;
  reportedValueDate?: string;
};

export function classifyEquityBenefit(
  details: EquityBenefitDetails | undefined,
  footprintAssetId: string | undefined,
): EquityBalanceSheetClassification {
  const ownership = details?.ownershipStatus;
  const isOwned = ownership === 'currently_own' || ownership === 'both';
  const isContingent = !isOwned;

  if (isOwned && footprintAssetId) {
    return {
      benefitId: '',
      classification: 'balance_sheet_account',
      footprintAssetId,
      isContingent: false,
      reportedValue: details?.reportedValue?.amount,
      reportedValueDate: details?.reportedValue?.statementDate,
    };
  }

  return {
    benefitId: '',
    classification: 'unclassified',
    footprintAssetId,
    isContingent,
    reportedValue: details?.reportedValue?.amount,
    reportedValueDate: details?.reportedValue?.statementDate,
  };
}

export function buildEquityExecutorPrompts(
  clientId: string,
  clientData: WorkplaceClientData,
): EquityExecutorPrompt[] {
  const benefits = clientData.benefits || [];
  const prompts: EquityExecutorPrompt[] = [];

  for (const benefit of benefits) {
    if (benefit.family !== 'employerEquity' && benefit.family !== 'executiveDeferred') continue;
    const details = benefit.equityBenefitDetails;
    const deathKnown = details?.deathIncapacity?.hasSpecialRules || 'not_sure';
    const termKnown = details?.termination?.leavingChangesBenefit || 'not_sure';
    const optionExpiryStatus = details?.optionExpiryStatus;
    const optionExpiryDate = optionExpiryStatus === 'known' ? details?.optionExpiryDate : undefined;
    const vestingDates = (details?.vestingDates || [])
      .map((v) => v.date)
      .filter((d): d is string => !!d)
      .sort();
    const nextVesting = vestingDates[0];
    const beneficiaryAllowed = details?.beneficiary?.beneficiaryDesignationAllowed;

    const requiresPrompt =
      deathKnown === 'yes' ||
      deathKnown === 'not_sure' ||
      termKnown === 'yes' ||
      termKnown === 'not_sure' ||
      optionExpiryStatus === 'known' ||
      !!nextVesting;

    prompts.push({
      clientId,
      benefitId: benefit.id,
      planName: details?.planName || benefit.benefitTypeLabel,
      employerName: benefit.employerName,
      administratorName: benefit.administratorName,
      documentLocationLabel: benefit.documentLocationRef?.label,
      deathIncapacityKnown: deathKnown,
      terminationKnown: termKnown,
      optionExpiryStatus,
      optionExpiryDate,
      nextVestingDate: nextVesting,
      beneficiaryDesignationAllowed: beneficiaryAllowed,
      requiresPromptReview: requiresPrompt,
    });
  }

  return prompts;
}

export function buildEquityPoaSummaries(
  clientId: string,
  clientData: WorkplaceClientData,
): EquityPoaSummary[] {
  const benefits = clientData.benefits || [];
  const summaries: EquityPoaSummary[] = [];

  for (const benefit of benefits) {
    if (benefit.family !== 'employerEquity' && benefit.family !== 'executiveDeferred') continue;
    const details = benefit.equityBenefitDetails;
    const vestingDates = (details?.vestingDates || [])
      .map((v) => v.date)
      .filter((d): d is string => !!d)
      .sort();
    const payment = details?.currentlyReceiving;

    summaries.push({
      clientId,
      benefitId: benefit.id,
      planName: details?.planName || benefit.benefitTypeLabel,
      employerName: benefit.employerName,
      administratorName: benefit.administratorName,
      documentLocationLabel: benefit.documentLocationRef?.label,
      vestingDates,
      optionExpiryStatus: details?.optionExpiryStatus,
      optionExpiryDate: details?.optionExpiryStatus === 'known' ? details?.optionExpiryDate : undefined,
      paymentStream:
        payment?.status === 'receiving' && payment.amount
          ? { amount: payment.amount, frequency: payment.frequency || '' }
          : undefined,
      deathIncapacityKnown: details?.deathIncapacity?.hasSpecialRules || 'not_sure',
    });
  }

  return summaries;
}

export function buildEquityBalanceSheetClassifications(
  clientData: WorkplaceClientData,
): EquityBalanceSheetClassification[] {
  const benefits = clientData.benefits || [];
  const results: EquityBalanceSheetClassification[] = [];

  for (const benefit of benefits) {
    if (benefit.family !== 'employerEquity' && benefit.family !== 'executiveDeferred') continue;
    const details = benefit.equityBenefitDetails;
    const classification = classifyEquityBenefit(details, benefit.footprintAccountId);
    results.push({ ...classification, benefitId: benefit.id });
  }

  return results;
}