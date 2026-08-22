import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, Home, Building2, Landmark, Shield, FileText, DollarSign, User, Phone, Mail, CreditCard, Pencil } from 'lucide-react';
import CreditCardIntake from './CreditCardIntake';
import { getClientOwnedCorpNames } from '../lib/corporateOwnership';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import { getAllObligations, OBLIGATION_TYPE_LABELS } from '../lib/obligationQuery';
import { calculateHouseholdDebtTotals, groupObligationsForReview } from '../lib/householdDebtTotals';
import { deleteObligation, type ObligationStore } from '../lib/obligationSync';
import RepoDocumentLocationPicker from './DocumentLocationPicker';

type AdditionalDebt = {
  id: string;
  borrower?: string;
  borrowerOtherName?: string;
  borrowerOtherRelationship?: string;
  description?: string;
  lender?: string;
  amount?: string;
  amountUnknown?: string;
  interestRate?: string;
  interestRateUnknown?: string;
  paymentAmount?: string;
  paymentFrequency?: string;
  paymentFrequencyOther?: string;
  paymentSource?: string;
  paymentSourceOther?: string;
  // Reference to a bank account from the financial footprint
  paymentSourceBankRef?: string;
  // New bank account entered via "Other" in Q7
  newBankInstitution?: string;
  newBankAccountType?: string;
  newBankOwner?: string;
  newBankAddedToFootprint?: boolean;
  isSecured?: string;
  securedByType?: string;
  securedByOther?: string;
  hasContact?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  hasDocument?: string;
  documentLocation?: string;
  documentLocationOther?: string;
  documentLocationId?: string;
  documentLocationRef?: { locationId: string; label: string } | null;
  collateralPropertyEntityId?: string;
  specialNotes?: string;
  obligationEntityId?: string;
  borrowerEntityId?: string;
  lenderEntityId?: string;
};

type PropertyDebt = {
  source: 'realEstate';
  propertyName: string;
  debtType: 'Mortgage' | 'HELOC';
  lender: string;
  balance: string;
  borrowers: string;
};

type GuaranteeDebt = {
  source: 'corporateGuarantee';
  corporation: string;
  lender: string;
  borrowingType: string;
  amount: string;
  guarantor: string;
  maxGuarantee: string;
};

type AmountOwedToClient = {
  source: 'corporateOwedByClient';
  corporation: string;
  amount: string;
  owedTo: string;
};

type DerivedObligations = {
  propertyDebts: PropertyDebt[];
  guarantees: GuaranteeDebt[];
  amountsOwedByClient: AmountOwedToClient[];
};

type Props = {
  answers: Record<string, unknown>;
  allAnswers?: Map<string, Record<string, unknown>>;
  onAnswerChange: (key: string, value: unknown) => void;
  onUpdateFootprint?: (key: string, value: unknown) => void;
};

const BORROWING_TYPE_LABELS: Record<string, string> = {
  business_loan: 'Business Loan',
  operating_line: 'Operating Line',
  business_credit_card: 'Business Credit Card',
  commercial_mortgage: 'Commercial Mortgage',
  equipment_financing: 'Equipment Financing',
  equipment_lease: 'Equipment Lease',
  other: 'Other',
  not_sure: 'Not Sure',
};

const GUARANTEE_SCOPE_LABELS: Record<string, string> = {
  entire_amount: 'Entire amount',
  specific_maximum: 'Specific maximum',
  percentage: 'Percentage',
  another_arrangement: 'Another arrangement',
  not_sure: 'Not sure',
};

function formatCurrency(amount: string): string {
  if (!amount) return '';
  const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return amount;
  return num.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatBorrowers(parties: string[], otherBorrowers?: Array<{ name?: string }>): string {
  const names: string[] = [];
  for (const p of parties) {
    if (p === 'client1') names.push('Client 1');
    else if (p === 'client2') names.push('Client 2');
    else if (p === 'joint') names.push('Joint');
    else if (p) names.push(p);
  }
  if (otherBorrowers) {
    otherBorrowers.forEach(o => { if (o.name) names.push(o.name); });
  }
  return names.join(' & ') || '';
}

function deriveObligations(allAnswers?: Map<string, Record<string, unknown>>): DerivedObligations {
  const result: DerivedObligations = { propertyDebts: [], guarantees: [], amountsOwedByClient: [] };
  if (!allAnswers) return result;

  const aboutYou = allAnswers.get('aboutYou') || {};
  const client1Name = (aboutYou['fullName'] as string) || 'Client 1';
  const client2Name = (aboutYou['spouseName'] as string) || 'Client 2';

  // Real Estate debts
  const realEstate = allAnswers.get('realEstate') || {};
  const primaryHome = realEstate['primaryHomeData'] as Record<string, unknown> | undefined;
  const propertiesData = (realEstate['propertiesData'] as Array<Record<string, unknown>>) || [];

  const allProperties: Array<{ name: string; data: Record<string, unknown> }> = [];
  if (primaryHome && primaryHome['hasDebt'] === 'yes') {
    allProperties.push({ name: (primaryHome['name'] as string) || 'Primary Home', data: primaryHome });
  }
  propertiesData.forEach((p) => {
    if (p && p['hasDebt'] === 'yes') {
      allProperties.push({ name: (p['name'] as string) || 'Property', data: p });
    }
  });

  allProperties.forEach(({ name, data }) => {
    const debtType = data['debtType'] as string;
    const responsibleParties = (data['mortgageResponsibleParties'] as string[]) || [];
    const otherBorrowers = data['mortgageOtherBorrowers'] as Array<{ name?: string }> | undefined;
    const borrowers = formatBorrowers(responsibleParties, otherBorrowers);

    if (debtType === 'mortgage' || debtType === 'both') {
      result.propertyDebts.push({
        source: 'realEstate',
        propertyName: name,
        debtType: 'Mortgage',
        lender: (data['mortgageLender'] as string) || '',
        balance: (data['mortgageBalance'] as string) || '',
        borrowers,
      });
    }
    if (debtType === 'heloc' || debtType === 'both') {
      const helocParties = (data['helocResponsibleParties'] as string[]) || [];
      const helocOtherBorrowers = data['helocOtherBorrowers'] as Array<{ name?: string }> | undefined;
      result.propertyDebts.push({
        source: 'realEstate',
        propertyName: name,
        debtType: 'HELOC',
        lender: (data['helocLender'] as string) || '',
        balance: (data['helocBalance'] as string) || '',
        borrowers: formatBorrowers(helocParties, helocOtherBorrowers),
      });
    }
  });

  // Corporate financial connections — personal guarantees
  const corpConnections = allAnswers.get('corporateFinancialConnections') || {};
  const guarantees = (corpConnections['personalGuaranteesData'] as Array<Record<string, unknown>>) || [];
  const validCorpNames = new Set(getClientOwnedCorpNames(allAnswers).map((n) => n.toLowerCase()));
  guarantees.forEach((g) => {
    const corpName = ((g['selectedCompany'] as string) || '').trim().toLowerCase();
    if (corpName && validCorpNames.size > 0 && !validCorpNames.has(corpName)) return;
    const guarantors = (g['guarantors'] as string[]) || [];
    const otherGuarantors = g['otherGuarantors'] as Array<{ name?: string }> | undefined;
    const guarantorNames: string[] = [];
    guarantors.forEach((gtr) => {
      if (gtr === 'client1') guarantorNames.push(client1Name);
      else if (gtr === 'client2') guarantorNames.push(client2Name);
      else if (gtr === 'other') {
        if (otherGuarantors) otherGuarantors.forEach(og => { if (og.name) guarantorNames.push(og.name); });
      }
    });

    const scope = g['guaranteeScope'] as string;
    let maxGuarantee = '';
    if (scope === 'specific_maximum') maxGuarantee = (g['maximumAmount'] as string) || '';
    else if (scope === 'entire_amount') maxGuarantee = 'Entire amount';
    else if (scope === 'percentage') maxGuarantee = `${g['percentage'] || ''}%`;
    else if (scope && GUARANTEE_SCOPE_LABELS[scope]) maxGuarantee = GUARANTEE_SCOPE_LABELS[scope];

    result.guarantees.push({
      source: 'corporateGuarantee',
      corporation: (g['selectedCompany'] as string) || '',
      lender: (g['lenderName'] as string) || (g['lenderUnknown'] === 'yes' ? 'Unknown' : ''),
      borrowingType: BORROWING_TYPE_LABELS[(g['borrowingType'] as string)] || (g['borrowingTypeOther'] as string) || '',
      amount: g['amountOwedUnknown'] === 'yes' ? 'Unknown' : (g['amountOwed'] as string) || '',
      guarantor: guarantorNames.join(' & '),
      maxGuarantee,
    });
  });

  // Corporate financial connections — shareholder loans (corporation owes client)
  // These do NOT show as personal debt — they are assets owed TO the client.
  // We intentionally skip shareholderLoansData here.

  // Note: If there were a "client owes corporation" structure, we'd surface it here.
  // The current data model only has shareholderLoansData (corporation → client), which is an asset, not a debt.

  return result;
}

type CategorizedBankingOptions = {
  client1: Array<{ value: string; label: string; dataKey: string; index: number }>;
  client2: Array<{ value: string; label: string; dataKey: string; index: number }>;
  joint: Array<{ value: string; label: string; dataKey: string; index: number }>;
  all: Array<{ value: string; label: string }>;
};

// Generate a stable account ID from institution data.
// Uses inst.id if present (new records), otherwise creates a deterministic ID from dataKey + index.
// This is NOT position-dependent across reloads — the dataKey + index within that key is stable
// as long as the array order is preserved (which it is — new accounts are appended).
function getStableAccountId(inst: Record<string, unknown>, dataKey: string, index: number): string {
  if (inst['id'] && typeof inst['id'] === 'string') return inst['id'] as string;
  return `${dataKey}_${index}`;
}

function getBankingOptions(allAnswers?: Map<string, Record<string, unknown>>): CategorizedBankingOptions {
  const empty: CategorizedBankingOptions = { client1: [], client2: [], joint: [], all: [] };
  if (!allAnswers) return empty;

  const aboutYou = allAnswers.get('aboutYou') || {};
  const client1Name = (aboutYou['fullName'] as string) || 'Client 1';
  const client2Name = (aboutYou['spouseName'] as string) || 'Client 2';

  const footprint = allAnswers.get('financialFootprint') || {};
  const bankingStructure = (footprint['bankingStructure'] as string) || '';
  const hasSpouse = (aboutYou['maritalStatus'] as string) === 'married' || (aboutYou['maritalStatus'] as string) === 'common_law';

  const result: CategorizedBankingOptions = { client1: [], client2: [], joint: [], all: [] };

  const addInstitution = (
    inst: Record<string, unknown>,
    i: number,
    dataKey: string,
    category: 'client1' | 'client2' | 'joint',
    ownerName: string,
  ) => {
    const name = (inst['name'] as string) || '';
    const acctType = (inst['accountType'] as string) || '';
    if (!name) return;
    const label = acctType ? `${name} — ${acctType}` : name;
    const value = getStableAccountId(inst, dataKey, i);
    result[category].push({ value, label, dataKey, index: i });
    result.all.push({ value, label: `${ownerName} — ${label}` });
  };

  // Determine which institution data keys to read based on banking structure
  if (!hasSpouse) {
    // Single client — always client1InstitutionsData
    const insts = (footprint['client1InstitutionsData'] as Array<Record<string, unknown>>) || [];
    insts.forEach((inst, i) => addInstitution(inst, i, 'client1InstitutionsData', 'client1', client1Name));
  } else {
    if (bankingStructure === 'individual') {
      const c1Insts = (footprint['client1InstitutionsData'] as Array<Record<string, unknown>>) || [];
      c1Insts.forEach((inst, i) => addInstitution(inst, i, 'client1InstitutionsData', 'client1', client1Name));
      const c2Insts = (footprint['client2InstitutionsData'] as Array<Record<string, unknown>>) || [];
      c2Insts.forEach((inst, i) => addInstitution(inst, i, 'client2InstitutionsData', 'client2', client2Name));
    } else if (bankingStructure === 'joint') {
      const jointInsts = (footprint['jointInstitutionsData'] as Array<Record<string, unknown>>) || [];
      jointInsts.forEach((inst, i) => addInstitution(inst, i, 'jointInstitutionsData', 'joint', `${client1Name} & ${client2Name}`));
    } else if (bankingStructure === 'mixed') {
      const jointInsts = (footprint['mixedJointInstitutionsData'] as Array<Record<string, unknown>>) || [];
      jointInsts.forEach((inst, i) => addInstitution(inst, i, 'mixedJointInstitutionsData', 'joint', `${client1Name} & ${client2Name}`));
      const c1Insts = (footprint['mixedClient1InstitutionsData'] as Array<Record<string, unknown>>) || [];
      c1Insts.forEach((inst, i) => addInstitution(inst, i, 'mixedClient1InstitutionsData', 'client1', client1Name));
      const c2Insts = (footprint['mixedClient2InstitutionsData'] as Array<Record<string, unknown>>) || [];
      c2Insts.forEach((inst, i) => addInstitution(inst, i, 'mixedClient2InstitutionsData', 'client2', client2Name));
    }
  }

  return result;
}

// Backward-compatible flat list for CreditCardIntake
function getFlatBankingOptions(categorized: CategorizedBankingOptions): Array<{ value: string; label: string }> {
  return categorized.all;
}

// Retroactively add a new bank account to the financial footprint section
function addNewBankToFootprint(
  draft: AdditionalDebt,
  onUpdateFootprint: (key: string, value: unknown) => void,
  allAnswers?: Map<string, Record<string, unknown>>,
  hasSpouse?: boolean,
): string | undefined {
  const footprint = allAnswers?.get('financialFootprint') || {};
  const bankingStructure = (footprint['bankingStructure'] as string) || '';

  // Determine the correct data key and count key based on banking structure and owner
  let dataKey: string;
  let countKey: string;

  if (!hasSpouse) {
    dataKey = 'client1InstitutionsData';
    countKey = 'client1BankCount';
  } else if (bankingStructure === 'individual') {
    if (draft.newBankOwner === 'client1') {
      dataKey = 'client1InstitutionsData';
      countKey = 'client1BankCount';
    } else if (draft.newBankOwner === 'client2') {
      dataKey = 'client2InstitutionsData';
      countKey = 'client2BankCount';
    } else {
      // joint owner but structure is individual — treat as client1
      dataKey = 'client1InstitutionsData';
      countKey = 'client1BankCount';
    }
  } else if (bankingStructure === 'joint') {
    dataKey = 'jointInstitutionsData';
    countKey = 'jointBankCount';
  } else if (bankingStructure === 'mixed') {
    if (draft.newBankOwner === 'joint') {
      dataKey = 'mixedJointInstitutionsData';
      countKey = 'mixedJointBankCount';
    } else if (draft.newBankOwner === 'client2') {
      dataKey = 'mixedClient2InstitutionsData';
      countKey = 'mixedClient2BankCount';
    } else {
      dataKey = 'mixedClient1InstitutionsData';
      countKey = 'mixedClient1BankCount';
    }
  } else {
    // No banking structure set yet — default to client1
    dataKey = 'client1InstitutionsData';
    countKey = 'client1BankCount';
  }

  // Get existing institutions array
  const existing = (footprint[dataKey] as Array<Record<string, unknown>>) || [];
  const newAccountId = `acct_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newInstitution: Record<string, unknown> = {
    id: newAccountId,
    name: draft.newBankInstitution,
    accountType: draft.newBankAccountType || '',
    accountOwners: [draft.newBankOwner],
  };
  const updated = [...existing, newInstitution];
  onUpdateFootprint(dataKey, updated);
  onUpdateFootprint(countKey, String(updated.length));
  // Return the stable ID so the Debt section can store it immediately
  return newAccountId;
}

function YesNoCard({
  value,
  onChange,
  options = ['yes', 'no'],
  labels = { yes: 'Yes', no: 'No' },
}: {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex items-center justify-center px-6 py-5 rounded-xl border-2 text-lg font-medium transition-all ${
            value === opt
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-750'
          }`}
        >
          {labels[opt] || opt}
        </button>
      ))}
    </div>
  );
}

function DebtCard({
  title,
  subtitle,
  lender,
  balance,
  borrower,
  badge,
  badgeIcon,
  badgeColor = 'blue',
  onDelete,
  onEdit,
  isDeleting,
}: {
  title: string;
  subtitle: string;
  lender: string;
  balance: string;
  borrower: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  badgeColor?: 'blue' | 'amber';
  onDelete?: () => void;
  onEdit?: () => void;
  isDeleting?: boolean;
}) {
  const badgeColors = {
    blue: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    amber: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  };
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-semibold text-white truncate">{title}</h4>
            {badge && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColors[badgeColor]}`}>
                {badgeIcon}
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-2 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-wait"
            >
              <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
        {lender && (
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Lender</dt>
            <dd className="text-sm text-gray-200 mt-0.5">{lender}</dd>
          </div>
        )}
        {balance && (
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Balance</dt>
            <dd className="text-sm text-gray-200 mt-0.5">{balance}</dd>
          </div>
        )}
        {borrower && (
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Borrower(s)</dt>
            <dd className="text-sm text-gray-200 mt-0.5">{borrower}</dd>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-blue-400">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">{text}</h3>
    </div>
  );
}

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every two weeks' },
  { value: 'semimonthly', label: 'Twice a month' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'No regular payment' },
  { value: 'not_sure', label: "I'm not sure" },
];

const SECURED_BY_OPTIONS = [
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'investment_account', label: 'Investment account' },
  { value: 'business_interest', label: 'Business / corporate interest' },
  { value: 'other', label: 'Other' },
];

export default function DebtObligations({ answers, allAnswers, onAnswerChange, onUpdateFootprint }: Props) {
  const aboutYou = allAnswers?.get('aboutYou') || {};
  const client1Name = (aboutYou['fullName'] as string) || 'Client 1';
  const client2Name = (aboutYou['spouseName'] as string) || 'Client 2';
  const maritalStatus = aboutYou['maritalStatus'] as string;
  const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';

  const entityRegistry = useEntityRegistry();

  const obligationStore: ObligationStore = {
    getOrCreateEntity: entityRegistry.getOrCreateEntity,
    updateEntity: entityRegistry.updateEntity,
    createRelationship: entityRegistry.createRelationship,
    removeRelationship: entityRegistry.removeRelationship,
    getRelationshipsByTarget: entityRegistry.getRelationshipsByTarget,
    getRelationshipsBySource: entityRegistry.getRelationshipsBySource,
    getRelationshipsByEntity: entityRegistry.getRelationshipsByEntity,
  };

  // Client entity IDs from the About You step
  const client1EntityId = (aboutYou['client1EntityId'] as string) || '';
  const client2EntityId = (aboutYou['client2EntityId'] as string) || '';

  // Canonical obligation data from the entity registry
  const allObligations = getAllObligations(entityRegistry.entities, entityRegistry.relationships);
  const groupedObligations = groupObligationsForReview(allObligations, client1EntityId, client2EntityId);
  const householdTotals = calculateHouseholdDebtTotals(allObligations, client1EntityId, client2EntityId);

  const derived = deriveObligations(allAnswers);
  const categorizedBanking = getBankingOptions(allAnswers);
  const bankingOptions = getFlatBankingOptions(categorizedBanking);
  const hasDerivedObligations = derived.propertyDebts.length > 0 || derived.guarantees.length > 0;

  const additionalDebts = (answers['additionalDebtsData'] as AdditionalDebt[]) || [];
  const hasAdditionalDebtsAnswer = (answers['hasAdditionalDebts'] as string) || '';
  const hasCreditCardsAnswer = (answers['hasCreditCards'] as string) || '';
  const reviewConfirmed = (answers['reviewConfirmed'] as string) || '';

  const creditCards = (answers['creditCardsData'] as Array<Record<string, unknown>>) || [];

  // Final review shows when additional debts are done AND credit cards are done
  const additionalDebtsDone = hasAdditionalDebtsAnswer === 'no' || (additionalDebts.length === 0 && hasAdditionalDebtsAnswer === 'no');
  const creditCardsDone = hasCreditCardsAnswer === 'no' || (creditCards.length === 0 && hasCreditCardsAnswer === 'no');
  const showFinalReview = additionalDebtsDone && creditCardsDone && (hasDerivedObligations || additionalDebts.length > 0 || creditCards.length > 0);

  // UI state for the intake flow
  const [intakeActive, setIntakeActive] = useState(false);
  const [intakeStep, setIntakeStep] = useState(0);
  const [draft, setDraft] = useState<AdditionalDebt>({ id: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Reset intake when starting fresh
  const startIntake = () => {
    setDraft({ id: `debt-${Date.now()}-${additionalDebts.length}` });
    setIntakeStep(0);
    setEditingIndex(null);
    setIntakeActive(true);
  };

  const editDebt = (index: number) => {
    const debt = additionalDebts[index];
    if (!debt) return;
    setDraft({ ...debt });
    setEditingIndex(index);
    setIntakeStep(0);
    setIntakeActive(true);
  };

  const cancelIntake = () => {
    setIntakeActive(false);
    setDraft({ id: '' });
    setIntakeStep(0);
  };

  const saveDraft = () => {
    // If user entered a new bank account via "Other", retroactively add it to the financial footprint
    let newBankId: string | undefined;
    if (draft.paymentSource === 'other' && draft.newBankInstitution?.trim() && draft.newBankOwner && onUpdateFootprint) {
      newBankId = addNewBankToFootprint(draft, onUpdateFootprint, allAnswers, hasSpouse);
    }

    if (editingIndex !== null) {
      const updated = [...additionalDebts];
      updated[editingIndex] = { ...draft, paymentSourceBankRef: newBankId || draft.paymentSourceBankRef, newBankAddedToFootprint: draft.paymentSource === 'other' && !!draft.newBankInstitution?.trim() };
      onAnswerChange('additionalDebtsData', updated);
    } else {
      const updated = [...additionalDebts, { ...draft, paymentSourceBankRef: newBankId || draft.paymentSourceBankRef, newBankAddedToFootprint: draft.paymentSource === 'other' && !!draft.newBankInstitution?.trim() }];
      onAnswerChange('additionalDebtsData', updated);
      onAnswerChange('hasAdditionalDebts', 'yes');
    }
    setIntakeActive(false);
    setDraft({ id: '' });
    setIntakeStep(0);
    setEditingIndex(null);
  };

  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const deleteDebt = async (index: number) => {
    const debt = additionalDebts[index];
    setDeletingIndex(index);
    try {
      if (debt?.obligationEntityId) {
        await deleteObligation(debt.obligationEntityId, obligationStore);
      }
    } catch (err) {
      console.error('Failed to delete canonical obligation:', err);
      setDeletingIndex(null);
      return;
    }
    const updated = additionalDebts.filter((_, i) => i !== index);
    onAnswerChange('additionalDebtsData', updated.length > 0 ? updated : undefined);
    setDeletingIndex(null);
  };

  const updateDraft = (field: keyof AdditionalDebt, value: string | { locationId: string; label: string } | null) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  // Clean up conditional fields when parent answer changes
  useEffect(() => {
    if (answers['hasAdditionalDebts'] !== 'yes') {
      if (intakeActive) cancelIntake();
    }
  }, [answers['hasAdditionalDebts']]);

  // Clean up review state when debts change
  useEffect(() => {
    if (reviewConfirmed === 'add_another') {
      onAnswerChange('reviewConfirmed', undefined);
    }
  }, [additionalDebts.length]);

  // Known properties for collateral selection
  const realEstateAnswers = allAnswers?.get('realEstate') || {};
  const primaryHome = realEstateAnswers['primaryHomeData'] as Record<string, unknown> | undefined;
  const propertiesArr = (realEstateAnswers['propertiesData'] as Array<Record<string, unknown>>) || [];
  const knownProperties: Array<{ entityId: string; name: string }> = [];
  if (primaryHome?.['propertyEntityId']) {
    knownProperties.push({ entityId: primaryHome['propertyEntityId'] as string, name: (primaryHome['name'] as string) || 'Primary Home' });
  }
  propertiesArr.forEach((p) => {
    if (p?.['propertyEntityId']) {
      knownProperties.push({ entityId: p['propertyEntityId'] as string, name: (p['name'] as string) || 'Property' });
    }
  });

  const borrowerOptions: Array<{ value: string; label: string }> = [
    { value: 'client1', label: client1Name },
  ];
  if (hasSpouse) {
    borrowerOptions.push({ value: 'client2', label: client2Name });
    borrowerOptions.push({ value: 'joint', label: `${client1Name} & ${client2Name} jointly` });
  }
  borrowerOptions.push({ value: 'other', label: 'Other' });

  const inputClass = 'w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-2';
  const sectionCardClass = 'bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4';

  // === INTAKE QUESTIONS ===
  const INTAKE_QUESTIONS = [
    // Q1: Whose debt is it?
    {
      title: 'Who is responsible for this debt or obligation?',
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {borrowerOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateDraft('borrower', opt.value)}
                className={`flex items-center justify-center px-5 py-4 rounded-xl border-2 text-base font-medium transition-all ${
                  draft.borrower === opt.value
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {draft.borrower === 'other' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className={labelClass}>Name</label>
                <input type="text" value={draft.borrowerOtherName || ''} onChange={(e) => updateDraft('borrowerOtherName', e.target.value)} placeholder="Enter name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Relationship</label>
                <input type="text" value={draft.borrowerOtherRelationship || ''} onChange={(e) => updateDraft('borrowerOtherRelationship', e.target.value)} placeholder="e.g., Son, Daughter, Friend" className={inputClass} />
              </div>
            </div>
          )}
        </div>
      ),
      canProceed: () => !!draft.borrower && (draft.borrower !== 'other' || !!draft.borrowerOtherName?.trim()),
    },
    // Q2: What is it?
    {
      title: 'What would you call this debt or obligation?',
      subtitle: 'A short description is fine — you don\'t need to categorize it.',
      render: () => (
        <input
          type="text"
          value={draft.description || ''}
          onChange={(e) => updateDraft('description', e.target.value)}
          placeholder="e.g., Personal line of credit, Loan from family, Vehicle financing, Tax amount owing"
          className={inputClass}
        />
      ),
      canProceed: () => !!draft.description?.trim(),
    },
    // Q3: Lender
    {
      title: 'Who is the lender or who is the money owed to?',
      render: () => (
        <input
          type="text"
          value={draft.lender || ''}
          onChange={(e) => updateDraft('lender', e.target.value)}
          placeholder="e.g., RBC, Family member, Canada Revenue Agency"
          className={inputClass}
        />
      ),
      canProceed: () => !!draft.lender?.trim(),
    },
    // Q4: Amount
    {
      title: 'Approximately how much is currently owing?',
      render: () => (
        <div className="space-y-4">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              inputMode="numeric"
              value={draft.amount || ''}
              onChange={(e) => updateDraft('amount', e.target.value)}
              placeholder="e.g., 25,000"
              className={`${inputClass} pl-10`}
              disabled={draft.amountUnknown === 'yes'}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.amountUnknown === 'yes'}
              onChange={(e) => {
                updateDraft('amountUnknown', e.target.checked ? 'yes' : '');
                if (e.target.checked) updateDraft('amount', '');
              }}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">I'm not sure</span>
          </label>
        </div>
      ),
      canProceed: () => !!draft.amount?.trim() || draft.amountUnknown === 'yes',
    },
    // Q5: Interest rate
    {
      title: 'What is the current interest rate?',
      subtitle: 'Optional — skip if you\'re not sure.',
      render: () => (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={draft.interestRate || ''}
              onChange={(e) => updateDraft('interestRate', e.target.value)}
              placeholder="e.g., 5.25"
              className={`${inputClass} pr-8`}
              disabled={draft.interestRateUnknown === 'yes'}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.interestRateUnknown === 'yes'}
              onChange={(e) => {
                updateDraft('interestRateUnknown', e.target.checked ? 'yes' : '');
                if (e.target.checked) updateDraft('interestRate', '');
              }}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">I'm not sure</span>
          </label>
        </div>
      ),
      canProceed: () => true,
    },
    // Q6: Payment
    {
      title: 'What is the regular payment?',
      subtitle: 'If there\'s no regular payment, just say so below.',
      render: () => (
        <div className="space-y-5">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              inputMode="numeric"
              value={draft.paymentAmount || ''}
              onChange={(e) => updateDraft('paymentAmount', e.target.value)}
              placeholder="e.g., 1,200"
              className={`${inputClass} pl-10`}
            />
          </div>
          <div>
            <label className={labelClass}>How often is it paid?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PAYMENT_FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateDraft('paymentFrequency', opt.value)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    draft.paymentFrequency === opt.value
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {draft.paymentFrequency === 'other' && (
            <div>
              <label className={labelClass}>Please specify</label>
              <input type="text" value={draft.paymentFrequencyOther || ''} onChange={(e) => updateDraft('paymentFrequencyOther', e.target.value)} placeholder="Describe the payment schedule" className={inputClass} />
            </div>
          )}
        </div>
      ),
      canProceed: () => true,
    },
    // Q7: Payment account — categorized bank accounts from footprint + Other
    {
      title: 'Where is this payment usually made from?',
      subtitle: 'We\'ll use the banking information you\'ve already provided where possible.',
      render: () => {
        const hasC1 = categorizedBanking.client1.length > 0;
        const hasC2 = categorizedBanking.client2.length > 0;
        const hasJoint = categorizedBanking.joint.length > 0;
        const hasAnyBanks = hasC1 || hasC2 || hasJoint;

        const renderBankGroup = (
          groupLabel: string,
          opts: Array<{ value: string; label: string }>,
        ) => (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">{groupLabel}</p>
            {opts.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  updateDraft('paymentSource', 'bank_account');
                  updateDraft('paymentSourceBankRef', opt.value);
                  updateDraft('paymentSourceOther', '');
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left w-full ${
                  draft.paymentSource === 'bank_account' && draft.paymentSourceBankRef === opt.value
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                <Landmark className="w-4 h-4 flex-shrink-0 opacity-60" />
                {opt.label}
              </button>
            ))}
          </div>
        );

        return (
          <div className="space-y-4">
            {hasAnyBanks ? (
              <div className="space-y-1">
                {hasC1 && renderBankGroup(`${client1Name}'s Accounts`, categorizedBanking.client1)}
                {hasC2 && renderBankGroup(`${client2Name}'s Accounts`, categorizedBanking.client2)}
                {hasJoint && renderBankGroup('Joint Accounts', categorizedBanking.joint)}
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">No bank accounts were entered in the Financial Footprint section yet.</p>
              </div>
            )}

            {/* Other — opens bank account intake */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other</p>
              <button
                type="button"
                onClick={() => {
                  updateDraft('paymentSource', 'other');
                  updateDraft('paymentSourceBankRef', '');
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left w-full ${
                  draft.paymentSource === 'other'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                <Plus className="w-4 h-4 flex-shrink-0 opacity-60" />
                Add a new bank account
              </button>

              {draft.paymentSource === 'other' && (
                <div className="ml-4 pl-4 border-l-2 border-blue-500/40 space-y-4 pt-3">
                  <div>
                    <label className={labelClass}>Institution name</label>
                    <p className="text-xs italic text-gray-400 mb-2">e.g., TD Bank, RBC, Scotiabank</p>
                    <input
                      type="text"
                      value={draft.newBankInstitution || ''}
                      onChange={(e) => updateDraft('newBankInstitution', e.target.value)}
                      placeholder="Enter bank or financial institution name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Account type</label>
                    <p className="text-xs italic text-gray-400 mb-2">e.g., Checking, Savings, TFSA</p>
                    <input
                      type="text"
                      value={draft.newBankAccountType || ''}
                      onChange={(e) => updateDraft('newBankAccountType', e.target.value)}
                      placeholder="Enter account type"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Account owner</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => updateDraft('newBankOwner', 'client1')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all text-left w-full ${
                          draft.newBankOwner === 'client1'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {client1Name}
                      </button>
                      {hasSpouse && (
                        <button
                          type="button"
                          onClick={() => updateDraft('newBankOwner', 'client2')}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all text-left w-full ${
                            draft.newBankOwner === 'client2'
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {client2Name}
                        </button>
                      )}
                      {hasSpouse && (
                        <button
                          type="button"
                          onClick={() => updateDraft('newBankOwner', 'joint')}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all text-left w-full ${
                            draft.newBankOwner === 'joint'
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          Joint Account
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 italic">
                    This account will be added to the Banking section of Your Financial Footprint automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  updateDraft('paymentSource', 'not_sure');
                  updateDraft('paymentSourceBankRef', '');
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left w-full ${
                  draft.paymentSource === 'not_sure'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                I'm not sure
              </button>
            </div>
          </div>
        );
      },
      canProceed: () => {
        if (!draft.paymentSource) return false;
        if (draft.paymentSource === 'other') {
          return !!draft.newBankInstitution?.trim() && !!draft.newBankOwner;
        }
        return true;
      },
    },
    // Q8: Secured or unsecured
    {
      title: 'Is this debt secured by anything?',
      subtitle: 'A secured debt is backed by an asset — like a car, property, or investment.',
      render: () => (
        <div className="space-y-5">
          <YesNoCard
            value={draft.isSecured || ''}
            onChange={(v) => updateDraft('isSecured', v)}
            options={['yes', 'no', 'not_sure']}
            labels={{ yes: 'Yes', no: 'No', not_sure: "I'm not sure" }}
          />
          {draft.isSecured === 'yes' && (
            <div>
              <label className={labelClass}>What is it secured by?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SECURED_BY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateDraft('securedByType', opt.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left ${
                      draft.securedByType === opt.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {opt.value === 'real_estate' && <Home className="w-4 h-4 opacity-60" />}
                    {opt.value === 'vehicle' && <Plus className="w-4 h-4 opacity-60" />}
                    {opt.value === 'investment_account' && <DollarSign className="w-4 h-4 opacity-60" />}
                    {opt.value === 'business_interest' && <Building2 className="w-4 h-4 opacity-60" />}
                    {opt.value === 'other' && <FileText className="w-4 h-4 opacity-60" />}
                    {opt.label}
                  </button>
                ))}
              </div>
              {draft.securedByType === 'other' && (
                <input type="text" value={draft.securedByOther || ''} onChange={(e) => updateDraft('securedByOther', e.target.value)} placeholder="Describe what secures this debt" className={`${inputClass} mt-3`} />
              )}
              {draft.securedByType === 'real_estate' && knownProperties.length > 0 && (
                <div className="mt-3 space-y-2">
                  <label className={labelClass}>Which property secures this debt?</label>
                  {knownProperties.map((prop) => (
                    <button
                      key={prop.entityId}
                      type="button"
                      onClick={() => updateDraft('collateralPropertyEntityId', prop.entityId)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left w-full ${
                        draft.collateralPropertyEntityId === prop.entityId
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Home className="w-4 h-4 opacity-60" />
                      {prop.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { updateDraft('collateralPropertyEntityId', ''); updateDraft('securedByOther', ''); }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left w-full ${
                      !draft.collateralPropertyEntityId
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <FileText className="w-4 h-4 opacity-60" />
                    Other property / describe
                  </button>
                  {!draft.collateralPropertyEntityId && (
                    <input type="text" value={draft.securedByOther || ''} onChange={(e) => updateDraft('securedByOther', e.target.value)} placeholder="Describe the property" className={`${inputClass} mt-1`} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ),
      canProceed: () => !!draft.isSecured && (draft.isSecured !== 'yes' || !!draft.securedByType),
    },
    // Q9: Contact information
    {
      title: 'Is there a person someone managing your affairs should contact about this debt?',
      subtitle: 'Optional — but helpful for your executor or power of attorney.',
      render: () => (
        <div className="space-y-5">
          <YesNoCard value={draft.hasContact || ''} onChange={(v) => updateDraft('hasContact', v)} />
          {draft.hasContact === 'yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-1">
                <label className={labelClass}>Contact name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={draft.contactName || ''} onChange={(e) => updateDraft('contactName', e.target.value)} placeholder="Full name" className={`${inputClass} pl-9`} />
                </div>
              </div>
              <div className="sm:col-span-1">
                <label className={labelClass}>Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="tel" value={draft.contactPhone || ''} onChange={(e) => updateDraft('contactPhone', e.target.value)} placeholder="Phone number" className={`${inputClass} pl-9`} />
                </div>
              </div>
              <div className="sm:col-span-1">
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="email" value={draft.contactEmail || ''} onChange={(e) => updateDraft('contactEmail', e.target.value)} placeholder="Email address" className={`${inputClass} pl-9`} />
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      canProceed: () => true,
    },
    // Q10: Document location
    {
      title: 'Is there an agreement, statement, or other document someone may need?',
      render: () => (
        <div className="space-y-5">
          <YesNoCard
            value={draft.hasDocument || ''}
            onChange={(v) => updateDraft('hasDocument', v)}
            options={['yes', 'no', 'not_sure']}
            labels={{ yes: 'Yes', no: 'No', not_sure: "I'm not sure" }}
          />
          {draft.hasDocument === 'yes' && (
            <div>
              <label className={labelClass}>Where is it kept?</label>
              <RepoDocumentLocationPicker
                value={draft.documentLocationRef ?? (draft.documentLocation ? { locationId: draft.documentLocationId || '', label: draft.documentLocation } : undefined)}
                onChange={(ref) => {
                  if (ref && typeof ref === 'object' && 'locationId' in ref) {
                    const docRef = ref as { locationId: string; label: string };
                    updateDraft('documentLocationRef', docRef);
                    updateDraft('documentLocation', docRef.label);
                    updateDraft('documentLocationId', docRef.locationId);
                  } else {
                    updateDraft('documentLocationRef', null);
                    updateDraft('documentLocation', '');
                    updateDraft('documentLocationId', '');
                  }
                }}
                label="Where is it kept?"
              />
            </div>
          )}
        </div>
      ),
      canProceed: () => true,
    },
    // Q11: Anything someone should know
    {
      title: 'Is there anything someone stepping in for you should know about this debt?',
      subtitle: 'For example, another person is expected to repay part of it, the balance changes frequently, or there are unusual repayment arrangements.',
      render: () => (
        <textarea
          value={draft.specialNotes || ''}
          onChange={(e) => updateDraft('specialNotes', e.target.value)}
          placeholder="Optional — add any context that would help someone managing your affairs"
          rows={4}
          className={`${inputClass} resize-none`}
        />
      ),
      canProceed: () => true,
    },
  ];

  const currentQuestion = INTAKE_QUESTIONS[intakeStep];
  const isLastIntakeStep = intakeStep === INTAKE_QUESTIONS.length - 1;
  const canProceedFromCurrent = currentQuestion?.canProceed() ?? false;

  // ====== RENDER ======

  // INTAKE MODE
  if (intakeActive) {
    return (
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Debt {additionalDebts.length + 1}</span>
          <ChevronRight className="w-4 h-4" />
          <span>Question {intakeStep + 1} of {INTAKE_QUESTIONS.length}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${((intakeStep + 1) / INTAKE_QUESTIONS.length) * 100}%` }} />
        </div>

        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">{currentQuestion.title}</h3>
          {currentQuestion.subtitle && <p className="text-sm text-gray-400">{currentQuestion.subtitle}</p>}
          <div className="pt-2">{currentQuestion.render()}</div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={intakeStep === 0 ? cancelIntake : () => setIntakeStep(intakeStep - 1)}
            className="px-5 py-2.5 text-gray-400 hover:text-gray-200 font-medium transition-colors"
          >
            {intakeStep === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            disabled={!canProceedFromCurrent}
            onClick={() => {
              if (isLastIntakeStep) saveDraft();
              else setIntakeStep(intakeStep + 1);
            }}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              canProceedFromCurrent
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLastIntakeStep ? 'Save Debt' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  // DEFAULT / REVIEW MODE
  return (
    <div className="space-y-8">
      {/* === SECTION INTRO === */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Debts & Obligations</h2>
        <p className="text-gray-400 leading-relaxed">
          We've already identified some debts and financial obligations from the information you provided earlier.
          Review them below, then let us know if there's anything else we should add.
        </p>
        <p className="text-gray-500 text-sm mt-3">
          You don't need to re-enter mortgages, home equity lines of credit, or personal guarantees that are already shown here.
        </p>
      </div>

      {/* === PREVIOUSLY IDENTIFIED OBLIGATIONS === */}
      {hasDerivedObligations ? (
        <div className="space-y-6">
          <SectionLabel icon={<Home className="w-4 h-4" />} text="Previously Identified Obligations" />

          {/* Real Estate debts */}
          {derived.propertyDebts.length > 0 && (
            <div className="space-y-3">
              {derived.propertyDebts.map((debt, i) => (
                <DebtCard
                  key={`prop-${i}`}
                  title={debt.propertyName}
                  subtitle={debt.debtType}
                  lender={debt.lender || 'Not specified'}
                  balance={debt.balance ? formatCurrency(debt.balance) : 'Not specified'}
                  borrower={debt.borrowers || 'Not specified'}
                />
              ))}
            </div>
          )}

          {/* Personal guarantees (contingent obligations) */}
          {derived.guarantees.length > 0 && (
            <div className="space-y-3 pt-2">
              {derived.guarantees.map((g, i) => (
                <DebtCard
                  key={`guar-${i}`}
                  title={g.corporation || 'Corporation'}
                  subtitle={g.borrowingType ? `Personal Guarantee — ${g.borrowingType}` : 'Personal Guarantee'}
                  lender={g.lender || 'Not specified'}
                  balance={g.amount ? (g.amount === 'Unknown' ? 'Unknown' : formatCurrency(g.amount)) : 'Not specified'}
                  borrower={g.guarantor || 'Not specified'}
                  badge="Contingent obligation"
                  badgeIcon={<Shield className="w-3 h-3" />}
                  badgeColor="amber"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 text-center">
          <p className="text-gray-400">
            We haven't identified any debts or financial obligations from your earlier answers yet.
          </p>
        </div>
      )}

      {/* === ADDITIONAL DEBT SUMMARY === */}
      {additionalDebts.length > 0 && (
        <div className="space-y-6">
          <SectionLabel icon={<FileText className="w-4 h-4" />} text="Additional Debts You've Added" />
          <div className="space-y-3">
            {additionalDebts.map((debt, i) => (
              <DebtCard
                key={debt.id || i}
                title={debt.description || 'Additional Debt'}
                subtitle={debt.lender || ''}
                lender={debt.lender || ''}
                balance={debt.amountUnknown === 'yes' ? 'Unknown' : (debt.amount ? formatCurrency(debt.amount) : '')}
                borrower={
                  debt.borrower === 'client1' ? client1Name :
                  debt.borrower === 'client2' ? client2Name :
                  debt.borrower === 'joint' ? `${client1Name} & ${client2Name}` :
                  debt.borrower === 'other' ? (debt.borrowerOtherName || 'Other') :
                  ''
                }
                onEdit={() => editDebt(i)}
                onDelete={() => deleteDebt(i)}
                isDeleting={deletingIndex === i}
              />
            ))}
          </div>
        </div>
      )}

      {/* === "ANY ADDITIONAL DEBTS?" QUESTION === */}
      {additionalDebts.length === 0 && hasAdditionalDebtsAnswer === '' && (
        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">
            Do you have any additional debts or financial obligations, excluding credit cards?
          </h3>
          <p className="text-sm text-gray-400">
            Credit cards are handled separately. This is for loans, lines of credit, tax amounts owing, family loans, and similar obligations.
          </p>
          <YesNoCard
            value={hasAdditionalDebtsAnswer}
            onChange={(v) => {
              onAnswerChange('hasAdditionalDebts', v);
              if (v === 'yes') startIntake();
            }}
          />
        </div>
      )}

      {/* === REPEAT QUESTION (after adding first debt) === */}
      {additionalDebts.length > 0 && reviewConfirmed !== 'yes' && (
        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">
            Are there any additional debts or financial obligations, excluding credit cards?
          </h3>
          <YesNoCard
            value={hasAdditionalDebtsAnswer === 'yes' ? 'yes' : (hasAdditionalDebtsAnswer === 'no' ? 'no' : '')}
            onChange={(v) => {
              onAnswerChange('hasAdditionalDebts', v);
              if (v === 'yes') startIntake();
            }}
          />
        </div>
      )}

      {/* === CREDIT CARDS SECTION === */}
      {additionalDebtsDone && (
        <CreditCardIntake
          answers={answers}
          allAnswers={allAnswers}
          onAnswerChange={onAnswerChange}
          bankingOptions={bankingOptions}
          client1Name={client1Name}
          client2Name={client2Name}
          hasSpouse={hasSpouse}
          hasCreditCardsAnswer={hasCreditCardsAnswer}
          onHasCreditCardsChange={(v) => onAnswerChange('hasCreditCards', v)}
        />
      )}

      {/* === FINAL REVIEW === */}
      {showFinalReview && (
        <div className="space-y-6">
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-xl font-semibold text-white mb-2">Review</h3>
            <p className="text-gray-400 text-sm">
              Here's the full picture of your debts and financial obligations.
            </p>
          </div>

          {/* Canonical obligation summary from the Entity Registry */}
          {allObligations.length > 0 && (
            <div className="space-y-4">
              {/* Personal Debt group */}
              {groupedObligations.personalDebts.length > 0 && (
                <div className="space-y-3">
                  <SectionLabel icon={<FileText className="w-4 h-4" />} text="Personal Debt" />
                  {groupedObligations.personalDebts.map((ob) => (
                    <DebtCard
                      key={`canon-pers-${ob.obligationEntityId}`}
                      title={ob.borrowerName || 'Personal Debt'}
                      subtitle={OBLIGATION_TYPE_LABELS[ob.obligationType] || 'Debt'}
                      lender={ob.lenderName || 'Not specified'}
                      balance={ob.amountUnknown ? 'Unknown' : (ob.amount ? formatCurrency(ob.amount) : 'Not specified')}
                      borrower={ob.borrowerName || ''}
                      badge={ob.obligationType === 'mortgage' ? 'Mortgage' : ob.obligationType === 'heloc' ? 'HELOC' : undefined}
                      badgeColor="blue"
                    />
                  ))}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <span className="text-sm font-medium text-gray-300">Personal Debt Total</span>
                    <span className="text-sm font-bold text-white">
                      {householdTotals.hasUnknownAmounts && householdTotals.personalDebtTotal === 0 ? 'Some amounts unknown' : householdTotals.personalDebtTotal.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Contingent Exposure group */}
              {groupedObligations.contingentExposures.length > 0 && (
                <div className="space-y-3">
                  <SectionLabel icon={<Shield className="w-4 h-4" />} text="Contingent / Guaranteed Obligations" />
                  {groupedObligations.contingentExposures.map((ob) => (
                    <DebtCard
                      key={`canon-cont-${ob.obligationEntityId}`}
                      title={ob.borrowerName || 'Guaranteed Obligation'}
                      subtitle={OBLIGATION_TYPE_LABELS[ob.obligationType] || 'Guarantee'}
                      lender={ob.lenderName || 'Not specified'}
                      balance={ob.amountUnknown ? 'Unknown' : (ob.amount ? formatCurrency(ob.amount) : 'Not specified')}
                      borrower={ob.guarantors.map((g) => g.displayName).join(' & ') || ''}
                      badge="Contingent"
                      badgeIcon={<Shield className="w-3 h-3" />}
                      badgeColor="amber"
                    />
                  ))}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <span className="text-sm font-medium text-gray-300">Contingent Exposure Total</span>
                    <span className="text-sm font-bold text-white">
                      {householdTotals.hasUnknownAmounts && householdTotals.contingentExposureTotal === 0 ? 'Some amounts unknown' : householdTotals.contingentExposureTotal.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Related-Entity Obligations group */}
              {groupedObligations.relatedEntityObligations.length > 0 && (
                <div className="space-y-3">
                  <SectionLabel icon={<Building2 className="w-4 h-4" />} text="Related-Entity Obligations" />
                  {groupedObligations.relatedEntityObligations.map((ob) => (
                    <DebtCard
                      key={`canon-rel-${ob.obligationEntityId}`}
                      title={ob.borrowerName || 'Related Entity'}
                      subtitle={OBLIGATION_TYPE_LABELS[ob.obligationType] || 'Obligation'}
                      lender={ob.lenderName || 'Not specified'}
                      balance={ob.amountUnknown ? 'Unknown' : (ob.amount ? formatCurrency(ob.amount) : 'Not specified')}
                      borrower={ob.borrowerName || ''}
                      badge={ob.borrowerEntityType === 'corporation' ? 'Corporate' : ob.borrowerEntityType === 'trust' ? 'Trust' : undefined}
                      badgeColor="blue"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Previously identified — legacy derived view (preserved for backward compatibility) */}
          {derived.propertyDebts.length > 0 && (
            <div className="space-y-3">
              <SectionLabel icon={<Home className="w-4 h-4" />} text="Real Estate & Property Debts" />
              {derived.propertyDebts.map((debt, i) => (
                <DebtCard
                  key={`rev-prop-${i}`}
                  title={debt.propertyName}
                  subtitle={debt.debtType}
                  lender={debt.lender || 'Not specified'}
                  balance={debt.balance ? formatCurrency(debt.balance) : 'Not specified'}
                  borrower={debt.borrowers || 'Not specified'}
                />
              ))}
            </div>
          )}

          {/* Contingent obligations */}
          {derived.guarantees.length > 0 && (
            <div className="space-y-3">
              <SectionLabel icon={<Shield className="w-4 h-4" />} text="Personally Guaranteed Obligations" />
              {derived.guarantees.map((g, i) => (
                <DebtCard
                  key={`rev-guar-${i}`}
                  title={g.corporation || 'Corporation'}
                  subtitle={g.borrowingType ? `Personal Guarantee — ${g.borrowingType}` : 'Personal Guarantee'}
                  lender={g.lender || 'Not specified'}
                  balance={g.amount ? (g.amount === 'Unknown' ? 'Unknown' : formatCurrency(g.amount)) : 'Not specified'}
                  borrower={g.guarantor || 'Not specified'}
                  badge="Contingent"
                  badgeIcon={<Shield className="w-3 h-3" />}
                  badgeColor="amber"
                />
              ))}
            </div>
          )}

          {/* Additional debts */}
          <div className="space-y-3">
            <SectionLabel icon={<FileText className="w-4 h-4" />} text="Additional Debts" />
            {additionalDebts.map((debt, i) => (
              <DebtCard
                key={`rev-debt-${debt.id || i}`}
                title={debt.description || 'Additional Debt'}
                subtitle={debt.lender || ''}
                lender={debt.lender || ''}
                balance={debt.amountUnknown === 'yes' ? 'Unknown' : (debt.amount ? formatCurrency(debt.amount) : '')}
                borrower={
                  debt.borrower === 'client1' ? client1Name :
                  debt.borrower === 'client2' ? client2Name :
                  debt.borrower === 'joint' ? `${client1Name} & ${client2Name}` :
                  debt.borrower === 'other' ? (debt.borrowerOtherName || 'Other') :
                  ''
                }
                onEdit={() => editDebt(i)}
                onDelete={() => deleteDebt(i)}
                isDeleting={deletingIndex === i}
              />
            ))}
          </div>

          {/* Credit cards in review */}
          {creditCards.length > 0 && (
            <div className="space-y-3">
              <SectionLabel icon={<CreditCard className="w-4 h-4" />} text="Credit Cards" />
              {creditCards.map((card, i) => {
                const cardData = card as Record<string, unknown>;
                const title = (cardData['cardLabel'] as string) || (cardData['issuer'] as string) || 'Credit Card';
                const subtitle = [cardData['issuer'] as string, cardData['lastFour'] ? `•••• ${cardData['lastFour']}` : ''].filter(Boolean).join(' ');
                const balanceStatus = cardData['balanceStatus'] as string;
                const balance = balanceStatus === 'paid_in_full' ? 'Paid in full' : balanceStatus === 'not_sure' ? 'Not sure' : (cardData['balance'] ? formatCurrency(cardData['balance'] as string) : '');
                const responsible = cardData['responsibleParty'] as string;
                const responsibleLabel = responsible === 'client1' ? client1Name : responsible === 'client2' ? client2Name : responsible === 'joint' ? `${client1Name} & ${client2Name}` : responsible === 'other' ? (cardData['responsiblePartyOtherName'] as string) || 'Other' : responsible?.startsWith('child_') ? (cardData['responsiblePartyOtherName'] as string) || 'Child' : '';
                return (
                  <DebtCard
                    key={`rev-cc-${cardData['id'] || i}`}
                    title={title}
                    subtitle={subtitle}
                    lender={cardData['issuer'] as string || ''}
                    balance={balance}
                    borrower={responsibleLabel}
                    badge="Credit Card"
                    badgeIcon={<CreditCard className="w-3 h-3" />}
                    badgeColor="blue"
                  />
                );
              })}
            </div>
          )}

          {/* Completeness check */}
          <div className={sectionCardClass}>
            <h3 className="text-lg font-semibold text-white">
              Does this look like a complete picture of your debts and financial obligations?
            </h3>
            <YesNoCard
              value={reviewConfirmed}
              onChange={(v) => {
                onAnswerChange('reviewConfirmed', v);
                if (v === 'add_another') startIntake();
              }}
              options={['yes', 'add_another']}
              labels={{ yes: 'Yes, this is complete', add_another: 'I need to add another' }}
            />
          </div>
        </div>
      )}

      {/* If no additional debts and no credit cards */}
      {additionalDebtsDone && creditCardsDone && additionalDebts.length === 0 && creditCards.length === 0 && !hasDerivedObligations && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <p className="text-gray-400 text-sm">
            No additional debts or credit cards to add. You can come back to this section if your situation changes.
          </p>
        </div>
      )}
    </div>
  );
}
