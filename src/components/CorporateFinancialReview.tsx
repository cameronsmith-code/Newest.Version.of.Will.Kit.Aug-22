import React from 'react';
import { Pencil, Trash2, Plus, ArrowRight, Shield, ArrowLeftRight, Building2, Users } from 'lucide-react';
import type { PersonalGuaranteeData, OtherGuarantor } from './PersonalGuaranteeDetails';
import type { ShareholderLoanData } from './ShareholderLoanDetails';
import type { CompanyOwedData } from './CompanyOwedDetails';
import type { IntercompanyLoanData } from './IntercompanyLoanDetails';
import type { RelatedPartyLoanData } from './RelatedPartyLoanDetails';

type Props = {
  answers: Record<string, unknown>;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  corporations: Array<{ legalName: string }>;
  onEdit: (section: string) => void;
  onRemove: (section: string, index: number) => void;
  onAddAnother: (section: string) => void;
  onConfirm: () => void;
  onMakeChanges: () => void;
};

type ConnectionCard = {
  id: string;
  section: string;
  index: number;
  icon: React.ReactElement;
  title: string;
  flow: { from: string; to: string; label: string; amount: string };
  details: Array<{ label: string; value: string }>;
};

function formatAmount(amount: string | undefined, unknown: string | undefined): string {
  if (unknown === 'yes') return 'Amount unknown';
  if (!amount) return 'Amount not specified';
  const formatted = amount.replace(/[^0-9.]/g, '');
  if (!formatted) return amount;
  const num = parseFloat(formatted);
  if (isNaN(num)) return amount;
  return `$${num.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`;
}

export default function CorporateFinancialReview({
  answers,
  client1Name,
  client2Name,
  hasSpouse,
  corporations,
  onEdit,
  onRemove,
  onAddAnother,
  onConfirm,
  onMakeChanges,
}: Props) {
  const pgEntries = (answers['personalGuaranteesData'] as PersonalGuaranteeData[]) || [];
  const slEntries = (answers['shareholderLoansData'] as ShareholderLoanData[]) || [];
  const coEntries = (answers['companyOwedData'] as CompanyOwedData[]) || [];
  const icEntries = (answers['intercompanyLoansData'] as IntercompanyLoanData[]) || [];
  const rplEntries = (answers['relatedPartyLoansData'] as RelatedPartyLoanData[]) || [];

  const cards: ConnectionCard[] = [];

  pgEntries.forEach((entry, idx) => {
    const guarantorNames: string[] = [];
    (entry.guarantors || []).forEach((g) => {
      if (g === 'client1') guarantorNames.push(client1Name);
      else if (g === 'client2') guarantorNames.push(client2Name);
      else if (g === 'other') {
        (entry.otherGuarantors || []).forEach((og: OtherGuarantor) => {
          if (og.name) guarantorNames.push(og.name);
        });
      }
    });

    const scopeText =
      entry.guaranteeScope === 'entire_amount' ? 'Entire amount' :
      entry.guaranteeScope === 'specific_maximum' ? `Up to ${formatAmount(entry.maximumAmount, undefined)}` :
      entry.guaranteeScope === 'percentage' ? `${entry.percentage || ''}%` :
      entry.guaranteeScope === 'another_arrangement' ? (entry.arrangementDescription || 'Custom arrangement') :
      'Not specified';

    const securityText =
      entry.hasPledgedSecurity === 'yes'
        ? (entry.pledgedAssets || []).map((a) =>
            a === 'personal_residence' ? 'Personal residence' :
            a === 'other_real_estate' ? 'Other real estate' :
            a === 'investment_account' ? 'Investment account' :
            a === 'cash_gics' ? 'Cash / GICs' :
            a === 'other_personal_assets' ? 'Other personal assets' :
            a === 'other' ? (entry.pledgedAssetsOther || 'Other') : a
          ).join(', ')
        : entry.hasPledgedSecurity === 'no' ? 'None identified' : 'Not specified';

    cards.push({
      id: `pg-${idx}`,
      section: 'pg',
      index: idx,
      icon: <Shield size={20} />,
      title: 'Personal Guarantee',
      flow: {
        from: entry.lenderName || 'Lender',
        to: entry.selectedCompany || 'Company',
        label: entry.borrowingType === 'operating_line' ? 'Operating Line' :
               entry.borrowingType === 'business_loan' ? 'Business Loan' :
               entry.borrowingType === 'business_credit_card' ? 'Credit Card' :
               entry.borrowingType === 'commercial_mortgage' ? 'Commercial Mortgage' :
               entry.borrowingType === 'equipment_financing' ? 'Equipment Financing' :
               entry.borrowingType === 'equipment_lease' ? 'Equipment Lease' :
               entry.borrowingType === 'other' ? (entry.borrowingTypeOther || 'Other') :
               entry.borrowingType === 'not_sure' ? 'Borrowing' : 'Borrowing',
        amount: formatAmount(entry.amountOwed, entry.amountOwedUnknown),
      },
      details: [
        { label: 'Personal guarantee', value: guarantorNames.join(', ') || 'Not specified' },
        { label: 'Guarantee scope', value: scopeText },
        { label: 'Personal security', value: securityText },
      ],
    });
  });

  slEntries.forEach((entry, idx) => {
    const personName = entry.owedTo === 'client2' ? client2Name : client1Name;
    cards.push({
      id: `sl-${idx}`,
      section: 'sl',
      index: idx,
      icon: <Users size={20} />,
      title: 'Money You Have Put Into Your Company',
      flow: {
        from: personName,
        to: entry.selectedCompany || 'Company',
        label: 'Shareholder loan',
        amount: formatAmount(entry.amount, entry.amountUnknown),
      },
      details: [
        { label: `${entry.selectedCompany || 'Company'} owes ${personName}`, value: `Approximately ${formatAmount(entry.amount, entry.amountUnknown)}` },
      ],
    });
  });

  coEntries.forEach((entry, idx) => {
    const personName = entry.owedBy === 'client2' ? client2Name : client1Name;
    cards.push({
      id: `co-${idx}`,
      section: 'co',
      index: idx,
      icon: <ArrowLeftRight size={20} />,
      title: 'Money You Owe Your Company',
      flow: {
        from: personName,
        to: entry.selectedCompany || 'Company',
        label: 'Amount owed to company',
        amount: formatAmount(entry.amount, entry.amountUnknown),
      },
      details: [
        { label: `${personName} owes ${entry.selectedCompany || 'company'}`, value: `Approximately ${formatAmount(entry.amount, entry.amountUnknown)}` },
      ],
    });
  });

  icEntries.forEach((entry, idx) => {
    cards.push({
      id: `ic-${idx}`,
      section: 'ic',
      index: idx,
      icon: <Building2 size={20} />,
      title: 'Between Companies',
      flow: {
        from: entry.lenderCompany || 'Company',
        to: entry.borrowerCompany || 'Company',
        label: 'Intercompany amount owing',
        amount: formatAmount(entry.amount, entry.amountUnknown),
      },
      details: [
        { label: 'Intercompany amount owing', value: `Approximately ${formatAmount(entry.amount, entry.amountUnknown)}` },
      ],
    });
  });

  rplEntries.forEach((entry, idx) => {
    const direction = entry.direction || '';
    let fromName = 'Other party';
    let toName = 'Other party';
    let descLabel = 'Related-party amount';

    if (direction.startsWith('company_owes_other_')) {
      const corpIdx = parseInt(direction.replace('company_owes_other_', ''));
      fromName = corporations[corpIdx]?.legalName || 'Your company';
      toName = 'Other party';
      descLabel = `${fromName} owes other party`;
    } else if (direction.startsWith('other_owes_company_')) {
      const corpIdx = parseInt(direction.replace('other_owes_company_', ''));
      fromName = 'Other party';
      toName = corporations[corpIdx]?.legalName || 'Your company';
      descLabel = `Other party owes ${toName}`;
    } else if (direction === 'not_sure') {
      fromName = 'Your company';
      toName = 'Other party';
      descLabel = 'Direction uncertain';
    }

    cards.push({
      id: `rpl-${idx}`,
      section: 'rpl',
      index: idx,
      icon: <ArrowLeftRight size={20} />,
      title: 'Other Related-Party Loan',
      flow: {
        from: fromName,
        to: toName,
        label: descLabel,
        amount: formatAmount(entry.amount, entry.amountUnknown),
      },
      details: [
        { label: descLabel, value: `Approximately ${formatAmount(entry.amount, entry.amountUnknown)}` },
        { label: 'Written agreement', value: entry.hasWrittenAgreement === 'yes' ? `Yes — ${entry.docLocation || 'Location not specified'}` : entry.hasWrittenAgreement === 'no' ? 'No' : entry.hasWrittenAgreement === 'not_sure' ? 'Not sure' : 'Not specified' },
      ],
    });
  });

  if (cards.length === 0) {
    return null;
  }

  const sectionLabels: Record<string, string> = {
    pg: 'Personal Guarantees',
    sl: 'Money You Have Put Into Your Companies',
    co: 'Money You Owe Your Companies',
    ic: 'Between Companies',
    rpl: 'Other Related-Party Loans',
  };

  const existingSections = [...new Set(cards.map((c) => c.section))];

  return (
    <div className="mt-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Here's how we understand your corporate financial picture</h3>
        <p className="text-gray-400 max-w-2xl mx-auto">
          We've brought together the financial connections you've told us about. Take a moment to make sure nothing important is missing.
        </p>
      </div>

      <div className="space-y-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="border border-gray-600 rounded-xl p-6 bg-gray-800 hover:border-gray-500 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 shrink-0">
                {card.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">{card.title}</h4>

                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className="px-3 py-1.5 bg-gray-700 rounded-lg text-white text-sm font-medium">
                    {card.flow.from}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400 mb-0.5">{card.flow.label}</span>
                      <span className="text-blue-400 font-semibold text-sm">{card.flow.amount}</span>
                    </div>
                    <ArrowRight size={20} className="text-gray-500" />
                  </div>
                  <span className="px-3 py-1.5 bg-gray-700 rounded-lg text-white text-sm font-medium">
                    {card.flow.to}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {card.details.map((detail, di) => (
                    <div key={di} className="flex items-baseline gap-2 text-sm">
                      <span className="text-gray-400 font-medium">{detail.label}:</span>
                      <span className="text-gray-200">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(card.section)}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-2 rounded-lg transition-colors"
                  aria-label="Edit this entry"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(card.section, card.index)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
                  aria-label="Remove this entry"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {existingSections.map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => onAddAnother(section)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mr-6 mb-2"
          >
            <Plus size={16} />
            Add another {sectionLabels[section]?.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700">
        <label className="block text-lg font-semibold text-white mb-4 text-center">
          Does this look right?
        </label>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={onConfirm}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Yes, continue
          </button>
          <button
            type="button"
            onClick={onMakeChanges}
            className="px-8 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            I need to make changes
          </button>
        </div>
      </div>
    </div>
  );
}
