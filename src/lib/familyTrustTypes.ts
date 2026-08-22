import type { DocumentLocation } from './financialAssetTypes';
import type { DocumentLocationRef } from './documentLocationTypes';

export type ExposureClassification =
  | 'trust_obligation'
  | 'trustee_related_exposure'
  | 'contingent_personal_liability'
  | 'legal_exposure_unclear';

export type TrustEstablishmentDate = {
  dateType: 'exact' | 'year' | 'unknown';
  exactDate?: string;
  year?: string;
};

export type TrustSettlor = {
  name: string;
  relationshipToClient1?: string;
  relationshipToClient2?: string;
  status: 'living' | 'deceased' | 'unknown';
};

export type TrusteeDecisionRule =
  | 'any_one'
  | 'all_together'
  | 'majority'
  | 'other'
  | 'not_sure';

export type TrusteeEntry = {
  id: string;
  personId?: string;
  personName: string;
  personType: 'client1' | 'client2' | 'person' | 'entity';
  isClient?: boolean;
};

export type TrusteeContinuity = {
  clientId: 'client1' | 'client2';
  knownSuccession: 'successor_identified' | 'remaining_continue' | 'other_process' | 'not_sure';
  successorTrusteeId?: string;
  successorTrusteeName?: string;
  successorTrusteeType?: 'person' | 'entity';
  successionDocLocation?: 'trust_deed' | 'amendment' | 'appointment_document' | 'other' | 'not_sure';
  successionDocLocationOther?: string;
};

export type TrustBeneficiaryEntry = {
  id: string;
  personId?: string;
  personName: string;
  relationship?: string;
  entitlement: 'income' | 'capital' | 'income_and_capital' | 'not_sure';
};

export type TrustAssetHolding = {
  id: string;
  assetType: 'private_corp_shares' | 'investment_accounts' | 'bank_cash' | 'real_estate' | 'loans_receivable' | 'life_insurance' | 'partnership_interests' | 'other_assets' | 'not_sure';
  corporationId?: string;
  corporationEntityId?: string;
  corporationName?: string;
  shareClass?: string;
  ownershipPercentage?: string;
  votingShares?: 'yes' | 'no' | 'not_sure';
  propertyId?: string;
  propertyName?: string;
  financialAccountIds?: string[];
  description?: string;
};

export type TrustDebt = {
  id: string;
  lender: string;
  loanType?: string;
  approximateBalance?: string;
  balanceUnknown?: boolean;
  secured: 'yes' | 'no' | 'not_sure';
  collateralDescription?: string;
  collateralEntityId?: string;
  hasPersonalGuarantee: 'yes' | 'no' | 'not_sure';
  guarantorName?: string;
  guarantorPersonId?: string;
  limitedRecourse?: 'yes' | 'no' | 'not_sure';
  obligationEntityId?: string;
  documentLocationRef?: DocumentLocationRef;
  documentLocation?: DocumentLocation;
  exposureClassification?: ExposureClassification;
};

export type TrustReceivable = {
  id: string;
  borrower: string;
  borrowerType?: 'person' | 'corporation' | 'family_member' | 'beneficiary' | 'other';
  amountOwingType?: string;
  approximateAmount?: string;
  amountUnknown?: boolean;
  documentLocation?: DocumentLocation;
  notes?: string;
};

export type TrustAdvisorLink = {
  advisorId?: string;
  advisorName: string;
  advisorType: 'accountant' | 'lawyer';
  isExisting: boolean;
};

export type TrustTaxRecords = {
  documentLocation: DocumentLocation;
};

export type Trust21YearRule = {
  confirmedByProfessional: 'yes' | 'no' | 'not_sure';
  confirmedDate?: string;
  planningCompleted: 'yes' | 'no' | 'years_away' | 'not_sure';
  planningNotes?: string;
  planningDocLocation?: DocumentLocation;
};

export type TrustDocumentEntry = {
  id: string;
  docType:
    | 'trust_deed'
    | 'amendments'
    | 'trustee_appointment'
    | 'trust_tax_returns'
    | 'financial_statements'
    | 'bank_investment_statements'
    | 'share_certificates'
    | 'loan_agreements'
    | 'trustee_resolutions'
    | 'letter_of_wishes'
    | 'other';
  documentLocation: DocumentLocation;
  notes?: string;
};

export type FamilyTrust = {
  id: string;
  entityId?: string;
  legalName: string;
  establishmentDate: TrustEstablishmentDate;
  trustDeedLocation: DocumentLocation;
  trustDeedLocationRef?: DocumentLocationRef;
  trustDeedMissing?: boolean;
  trustDeedNoCopy?: boolean;
  settlor: TrustSettlor;
  trustees: TrusteeEntry[];
  trusteeDecisionRule: TrusteeDecisionRule;
  trusteeDecisionRuleOther?: string;
  trusteeContinuity: TrusteeContinuity[];
  beneficiaries: TrustBeneficiaryEntry[];
  additionalBeneficiaryClasses: 'yes' | 'no' | 'not_sure';
  additionalBeneficiaryDescription?: string;
  assetHoldings: TrustAssetHolding[];
  hasDebts: 'yes' | 'no' | 'not_sure';
  debts: TrustDebt[];
  hasReceivables: 'yes' | 'no' | 'not_sure';
  receivables: TrustReceivable[];
  accountantAdvisor: TrustAdvisorLink | null;
  lawyerAdvisor: TrustAdvisorLink | null;
  taxRecords: TrustTaxRecords | null;
  twentyOneYearRule: Trust21YearRule | null;
  trustDocuments: TrustDocumentEntry[];
  familyNotes?: string;
  reviewFlags: string[];
};

export function generateTrustId(): string {
  return `trust_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
}

export function generateTrustEntityId(prefix: string = 'te'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
}

export function emptyTrust(): FamilyTrust {
  return {
    id: generateTrustId(),
    legalName: '',
    establishmentDate: { dateType: 'year' },
    trustDeedLocation: {},
    settlor: { name: '', status: 'unknown' },
    trustees: [],
    trusteeDecisionRule: 'not_sure',
    trusteeContinuity: [],
    beneficiaries: [],
    additionalBeneficiaryClasses: 'no',
    assetHoldings: [],
    hasDebts: 'no',
    debts: [],
    hasReceivables: 'no',
    receivables: [],
    accountantAdvisor: null,
    lawyerAdvisor: null,
    taxRecords: null,
    twentyOneYearRule: null,
    trustDocuments: [],
    familyNotes: '',
    reviewFlags: [],
  };
}

export function calculate21YearAnniversary(trust: FamilyTrust): Date | null {
  const est = trust.establishmentDate;
  if (est.dateType === 'unknown') return null;
  if (est.dateType === 'exact' && est.exactDate) {
    const d = new Date(est.exactDate);
    if (isNaN(d.getTime())) return null;
    d.setFullYear(d.getFullYear() + 21);
    return d;
  }
  if (est.dateType === 'year' && est.year) {
    const y = parseInt(est.year, 10);
    if (isNaN(y)) return null;
    return new Date(y + 21, 0, 1);
  }
  return null;
}

export type AnniversaryStatus =
  | 'more_than_5_years'
  | 'within_5_years'
  | 'within_2_years'
  | 'passed'
  | 'unknown';

export function getAnniversaryStatus(trust: FamilyTrust): AnniversaryStatus {
  const confirmed = trust.twentyOneYearRule?.confirmedDate;
  const anniversary = confirmed
    ? new Date(confirmed)
    : calculate21YearAnniversary(trust);
  if (!anniversary) return 'unknown';
  const now = new Date();
  const diffMs = anniversary.getTime() - now.getTime();
  const diffYears = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  if (diffYears < 0) return 'passed';
  if (diffYears <= 2) return 'within_2_years';
  if (diffYears <= 5) return 'within_5_years';
  return 'more_than_5_years';
}

export function formatAnniversaryDate(trust: FamilyTrust): string {
  const confirmed = trust.twentyOneYearRule?.confirmedDate;
  if (confirmed) {
    const d = new Date(confirmed);
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) + ' (professionally confirmed)';
  }
  const anniversary = calculate21YearAnniversary(trust);
  if (!anniversary) return 'Unknown';
  const est = trust.establishmentDate;
  if (est.dateType === 'year') {
    return String(anniversary.getFullYear());
  }
  return anniversary.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) + ' (estimated)';
}

export function generateReviewFlags(trust: FamilyTrust): string[] {
  const flags: string[] = [];

  if (trust.trustDeedMissing || trust.trustDeedNoCopy) {
    flags.push('Trust Deed location unknown — recommend locating the original Trust Deed');
  }
  if (trust.establishmentDate.dateType === 'unknown') {
    flags.push('Trust establishment date unknown — 21-year rule anniversary cannot be estimated');
  }
  const continuityIssues = trust.trusteeContinuity.filter(
    (c) => c.knownSuccession === 'not_sure' || c.knownSuccession === 'other_process'
  );
  if (continuityIssues.length > 0) {
    const names = continuityIssues.map((c) => c.clientId === 'client1' ? 'Client 1' : 'Client 2');
    flags.push(`Trustee succession unclear for ${names.join(' and ')} — consider confirming what happens if they can no longer act as trustee`);
  }
  if (!trust.accountantAdvisor?.advisorName) {
    flags.push(`No accountant identified for ${trust.legalName || 'this trust'} — tax filing and 21-year planning may require professional guidance`);
  }
  if (!trust.lawyerAdvisor?.advisorName) {
    flags.push(`No lawyer identified for ${trust.legalName || 'this trust'} — trust governance and amendments may require legal guidance`);
  }

  const anniversaryStatus = getAnniversaryStatus(trust);
  const confirmed = trust.twentyOneYearRule?.confirmedByProfessional;
  if (confirmed !== 'yes' && anniversaryStatus !== 'unknown') {
    flags.push('21-year anniversary date has not been professionally confirmed — recommend having the trust\'s accountant or lawyer confirm the applicable date');
  }
  if (anniversaryStatus === 'within_5_years') {
    flags.push(`Potential 21-year deemed disposition anniversary within 5 years — recommend reviewing planning with accountant and lawyer well in advance`);
  }
  if (anniversaryStatus === 'within_2_years') {
    flags.push(`IMPORTANT: 21-year deemed disposition anniversary within 2 years — urgent professional review recommended`);
  }
  if (anniversaryStatus === 'passed') {
    flags.push(`21-year deemed disposition anniversary may have already passed — confirm with accountant whether planning was completed`);
  }

  const incompleteCorpShares = trust.assetHoldings.filter(
    (h) => h.assetType === 'private_corp_shares' && (!h.shareClass || !h.ownershipPercentage)
  );
  if (incompleteCorpShares.length > 0) {
    flags.push('Trust owns private-company shares but share class or ownership percentage is incomplete — recommend confirming details');
  }

  const guaranteedDebts = trust.debts.filter((d) => d.hasPersonalGuarantee === 'yes');
  if (guaranteedDebts.length > 0) {
    const guarantors = guaranteedDebts.map((d) => d.guarantorName).filter(Boolean);
    flags.push(`Trust debt is personally guaranteed${guarantors.length > 0 ? ` by ${guarantors.join(', ')}` : ''} — this creates contingent personal liability for the guarantor(s)`);
  }

  const unclearExposureDebts = trust.debts.filter(
    (d) => d.hasPersonalGuarantee === 'not_sure' || (d.limitedRecourse === 'not_sure')
  );
  if (unclearExposureDebts.length > 0) {
    flags.push('Trustee liability exposure is unclear for one or more trust debts — recommend having loan documentation and Trust Deed reviewed by a lawyer');
  }

  const multiTrusteeDebts = trust.debts.length > 0 && trust.trustees.length > 1;
  if (multiTrusteeDebts) {
    const noGuarantee = trust.debts.filter((d) => d.hasPersonalGuarantee !== 'yes');
    if (noGuarantee.length > 0) {
      flags.push(`Multiple trustees identified for an indebted trust — trustee exposure for ${noGuarantee.length} debt(s) may require confirmation depending on the governing documents`);
    }
  }

  const undocumentedReceivables = trust.receivables.filter(
    (r) => !r.documentLocation?.location && !r.documentLocation?.accessMethod
  );
  if (undocumentedReceivables.length > 0) {
    flags.push('Trust receivable with inadequate documentation — recommend locating supporting records');
  }

  if (trust.additionalBeneficiaryClasses === 'yes' && !trust.additionalBeneficiaryDescription?.trim()) {
    flags.push('Additional beneficiary classes indicated but not described — recommend documenting the description from the Trust Deed');
  }

  return flags;
}
