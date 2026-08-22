export type AssetCategory =
  | 'investmentAccount'
  | 'pension'
  | 'employerEquity'
  | 'receivable'
  | 'other';

export type OwnerType = 'client1' | 'client2' | 'joint' | 'other';

export type DocumentLocation = {
  accessMethod?: string;
  accessMethodOther?: string;
  location?: string;
  locationOther?: string;
};

export type ContactInfo = {
  contactName?: string;
  contactFirm?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactPersonId?: string;
};

export type BeneficiaryDesignation = {
  id: string;
  personId?: string;
  personName?: string;
  relationship?: string;
  percentage?: string;
  designationType?: string;
};

export type FinancialAssetBase = {
  id: string;
  category: AssetCategory;
  subtype: string;
  ownerIds: string[];
  institutionId?: string;
  institutionName?: string;
  approximateValue?: string;
  valueUnknown?: boolean;
  currency?: string;
  friendlyLabel?: string;
  lastFour?: string;
  contact?: ContactInfo;
  documentLocation?: DocumentLocation;
  notes?: string;
};

export type InvestmentAccount = FinancialAssetBase & {
  category: 'investmentAccount';
  accountType: string;
  accountTypeOther?: string;
  hasBeneficiary?: string;
  beneficiaries?: BeneficiaryDesignation[];
  managedBy?: string;
  managedByOther?: string;
  // RESP-specific
  respSubscriber?: string;
  respBeneficiaryChildIds?: string[];
  respBeneficiaryNames?: string[];
};

export type PensionRecord = FinancialAssetBase & {
  category: 'pension';
  pensionType: string;
  employer?: string;
  planName?: string;
  // DB-specific
  memberStatus?: string;
  estimatedPensionAmount?: string;
  pensionFrequency?: string;
  expectedStartAge?: string;
  currentPensionAmount?: string;
  // Survivor
  hasSurvivorBenefit?: string;
  survivorPersonId?: string;
  survivorPersonName?: string;
  // DC-specific
  planProvider?: string;
  // Contact/admin
  planAdministrator?: string;
  memberReference?: string;
};

export type EquityCompensation = FinancialAssetBase & {
  category: 'employerEquity';
  awardType: string;
  companyName?: string;
  quantity?: string;
  vestedQuantity?: string;
  unvestedQuantity?: string;
  exercisePrice?: string;
  expiryDate?: string;
  planTreatmentKnown?: string;
  planTreatmentNotes?: string;
  sharesHeldWhere?: string;
  payrollContributionsOngoing?: string;
  expectedSettlementDate?: string;
  payableStatus?: string;
};

export type ReceivableRecord = FinancialAssetBase & {
  category: 'receivable';
  debtor?: string;
  debtorRelationship?: string;
  interestRate?: string;
  paymentArrangement?: string;
  security?: string;
  hasWrittenAgreement?: string;
  derivedFrom?: string;
};

export type OtherAssetRecord = FinancialAssetBase & {
  category: 'other';
  assetDescription?: string;
  provider?: string;
  importantDates?: string;
};

export type AnyFinancialAsset =
  | InvestmentAccount
  | PensionRecord
  | EquityCompensation
  | ReceivableRecord
  | OtherAssetRecord;

export function generateAssetId(prefix: string = 'fa'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const INVESTMENT_ACCOUNT_TYPES = [
  { value: 'rrsp', label: 'RRSP', description: 'Registered Retirement Savings Plan' },
  { value: 'rrif', label: 'RRIF', description: 'Registered Retirement Income Fund' },
  { value: 'tfsa', label: 'TFSA', description: 'Tax-Free Savings Account' },
  { value: 'fhsa', label: 'FHSA', description: 'First Home Savings Account' },
  { value: 'non_registered', label: 'Non-Registered Investment', description: 'Individual or joint investment account' },
  { value: 'lira', label: 'Locked-In Retirement Account', description: 'LIRA / LRSP / other locked-in retirement savings' },
  { value: 'lif', label: 'LIF / Locked-In Income Account', description: 'Retirement income from locked-in savings' },
  { value: 'resp', label: 'RESP', description: 'Registered Education Savings Plan' },
  { value: 'gic', label: 'GIC / Term Deposit', description: 'Guaranteed investment certificate or term deposit' },
  { value: 'other_investment', label: 'Other Investment', description: 'Any other investment account not listed above' },
];

export const PENSION_TYPES = [
  { value: 'db', label: 'Defined Benefit Pension', description: "Provides a pension based on the plan's formula." },
  { value: 'dc', label: 'Defined Contribution Pension', description: 'Retirement savings accumulated in an individual plan account.' },
  { value: 'group_rrsp', label: 'Group RRSP', description: 'RRSP provided through an employer.' },
  { value: 'dpsp', label: 'DPSP', description: 'Deferred Profit Sharing Plan.' },
  { value: 'group_tfsa', label: 'Group TFSA', description: 'TFSA offered through an employer plan.' },
  { value: 'prpp', label: 'PRPP', description: 'Pooled Registered Pension Plan.' },
  { value: 'ipp', label: 'IPP', description: 'Individual Pension Plan.' },
  { value: 'rca', label: 'RCA', description: 'Retirement Compensation Arrangement.' },
  { value: 'other', label: 'Other Employer Retirement/Savings Plan', description: 'Any other workplace retirement or savings plan.' },
  { value: 'not_sure', label: "I'm not sure", description: 'Not sure what kind of plan it is.' },
];

export const EQUITY_AWARD_TYPES = [
  { value: 'rsu', label: 'Restricted Share Units (RSUs)', description: '' },
  { value: 'psu', label: 'Performance Share Units (PSUs)', description: '' },
  { value: 'dsu', label: 'Deferred Share Units (DSUs)', description: '' },
  { value: 'stock_option', label: 'Stock Options', description: '' },
  { value: 'espp', label: 'Employee Share Purchase Plan', description: '' },
  { value: 'employer_shares', label: 'Employer Shares', description: '' },
  { value: 'deferred_comp', label: 'Deferred Compensation', description: '' },
  { value: 'other', label: 'Other', description: '' },
];

export const JOINT_ELIGIBLE_ACCOUNT_TYPES = [
  'rrsp', 'rrif', 'tfsa', 'fhsa', 'non_registered', 'lif', 'gic',
  'other_investment',
];

export const RESP_BENEFICIARY_ACCOUNT_TYPES = ['resp'];

export const DESIGNATION_TYPES = [
  { value: 'beneficiary', label: 'Beneficiary' },
  { value: 'successor', label: 'Successor holder / successor annuitant' },
  { value: 'not_sure', label: "I'm not sure" },
];

export const STATEMENT_ACCESS_OPTIONS = [
  { value: 'online', label: 'Online statements' },
  { value: 'paper', label: 'Paper statements' },
  { value: 'advisor', label: 'Through our financial advisor' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

export const DOCUMENT_LOCATION_OPTIONS = [
  { value: 'home_office', label: 'Home office' },
  { value: 'safety_deposit', label: 'Safety deposit box' },
  { value: 'fireproof_box', label: 'Fireproof box' },
  { value: 'with_advisor', label: 'With financial advisor' },
  { value: 'with_lawyer', label: 'With lawyer' },
  { value: 'digital', label: 'Digital / password manager' },
  { value: 'other', label: 'Other' },
];
