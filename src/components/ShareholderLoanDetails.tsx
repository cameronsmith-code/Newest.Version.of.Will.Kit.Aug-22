import { Trash2 } from 'lucide-react';
import DocumentLocationPicker from './DocumentLocationPicker';
import type { DocumentLocationRef } from '../lib/documentLocationTypes';

export type ShareholderLoanData = {
  owedTo: string;
  selectedCompany: string;
  amount: string;
  amountUnknown: string;
  balanceChanges: string;
  hasWrittenAgreement: string;
  docLocation: string;
  paysInterest: string;
  interestRate: string;
  hasRepaymentTerms: string;
  repaymentDescription: string;
  hasAdditional: string;
  obligationEntityId?: string;
  borrowerEntityId?: string;
  lenderEntityId?: string;
};

type Props = {
  index: number;
  data: Partial<ShareholderLoanData>;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  corporations: Array<{ legalName: string }>;
  onChange: (field: keyof ShareholderLoanData, value: unknown) => void;
  onMultiChange: (updates: Partial<ShareholderLoanData>) => void;
  onRemove: () => void;
};

const inputClass =
  'w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
const labelClass = 'block text-sm font-medium text-gray-300 mb-2';

export default function ShareholderLoanDetails({
  index,
  data,
  client1Name,
  client2Name,
  hasSpouse,
  corporations,
  onChange,
  onMultiChange,
  onRemove,
}: Props) {
  const companyName = data.selectedCompany || `Company ${index + 1}`;
  const validCorps = corporations.filter((c) => c.legalName?.trim());

  const owedToLabel = data.owedTo === 'client1'
    ? client1Name
    : data.owedTo === 'client2'
      ? client2Name
      : data.owedTo === 'both'
        ? `${client1Name} and ${client2Name}`
        : 'the client';

  return (
    <div className="border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-5 mt-2">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-600">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
          {index + 1}
        </div>
        <h3 className="text-lg font-semibold text-white">{companyName}</h3>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (typeof onRemove === 'function') onRemove();
          }}
          aria-label={`Remove ${companyName}`}
          title="Remove this shareholder loan"
          className="ml-auto inline-flex items-center gap-1.5 justify-center rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <Trash2 size={16} />
          Remove
        </button>
      </div>

      {/* Who is the company required to repay? */}
      <div>
        <label className={labelClass}>Who is the company required to repay?</label>
        <div className="space-y-2">
          {[
            { value: 'client1', label: client1Name },
            ...(hasSpouse ? [{ value: 'client2', label: client2Name }] : []),
            ...(hasSpouse ? [{ value: 'both', label: `Both ${client1Name} and ${client2Name}` }] : []),
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`sl-owedTo-${index}`}
                value={opt.value}
                checked={data.owedTo === opt.value}
                onChange={() => onMultiChange({ owedTo: opt.value })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Which company owes the money? */}
      <div>
        <label className={labelClass}>Which company owes the money?</label>
        <select
          value={data.selectedCompany || ''}
          onChange={(e) => onChange('selectedCompany', e.target.value)}
          className={inputClass}
        >
          <option value="">Select a company</option>
          {validCorps.map((corp, i) => (
            <option key={i} value={corp.legalName}>{corp.legalName}</option>
          ))}
        </select>
      </div>

      {/* Approximately how much does [Company] currently owe [Client]? */}
      <div>
        <label className={labelClass}>Approximately how much does {companyName} currently owe {owedToLabel}?</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            type="text"
            value={data.amount || ''}
            onChange={(e) => onChange('amount', e.target.value)}
            placeholder="___________"
            disabled={data.amountUnknown === 'yes'}
            className={`${inputClass} pl-7`}
          />
        </div>
        <label className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={data.amountUnknown === 'yes'}
            onChange={(e) => onMultiChange({
              amountUnknown: e.target.checked ? 'yes' : '',
              amount: e.target.checked ? '' : data.amount,
            })}
            className="mr-2"
          />
          <span className="text-gray-300">I don't know</span>
        </label>
        <p className="text-xs text-gray-400 mt-1 italic">An estimate is fine. This can be confirmed later.</p>
      </div>

      {/* Does this amount change regularly? */}
      <div>
        <label className={labelClass}>Does this amount change regularly as money moves in or out of the company?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`sl-balanceChanges-${index}`}
                value={opt.value}
                checked={data.balanceChanges === opt.value}
                onChange={() => onChange('balanceChanges', opt.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1 italic">It's common for shareholder loan balances to change throughout the year. An approximate current amount is fine.</p>
      </div>

      {/* Is there a written loan agreement? */}
      <div>
        <label className={labelClass}>Is there a written loan agreement, promissory note, or other document describing this amount?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`sl-hasWrittenAgreement-${index}`}
                value={opt.value}
                checked={data.hasWrittenAgreement === opt.value}
                onChange={() => {
                  onMultiChange({
                    hasWrittenAgreement: opt.value,
                    docLocation: '',
                  });
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* If yes: Where can someone find these documents? */}
      {data.hasWrittenAgreement === 'yes' && (
        <div className="ml-6">
          <DocumentLocationPicker
            label="Where can someone find these documents?"
            value={data.docLocation as DocumentLocationRef | string | undefined}
            onChange={(val) => onChange('docLocation', val)}
            placeholder="Select or add a location"
          />
        </div>
      )}

      {/* Does the company pay interest? */}
      <div>
        <label className={labelClass}>Does the company pay interest on this amount?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`sl-paysInterest-${index}`}
                value={opt.value}
                checked={data.paysInterest === opt.value}
                onChange={() => {
                  onMultiChange({
                    paysInterest: opt.value,
                    interestRate: '',
                  });
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* If yes: Interest rate */}
      {data.paysInterest === 'yes' && (
        <div className="ml-6">
          <label className={labelClass}>Interest rate:</label>
          <div className="relative max-w-[200px]">
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.interestRate || ''}
              onChange={(e) => onChange('interestRate', e.target.value)}
              placeholder="__"
              className={inputClass}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>
      )}

      {/* Are there specific repayment terms? */}
      <div>
        <label className={labelClass}>Are there specific terms for when or how this amount must be repaid?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`sl-hasRepaymentTerms-${index}`}
                value={opt.value}
                checked={data.hasRepaymentTerms === opt.value}
                onChange={() => {
                  onMultiChange({
                    hasRepaymentTerms: opt.value,
                    repaymentDescription: '',
                  });
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* If yes: Briefly describe the repayment arrangement */}
      {data.hasRepaymentTerms === 'yes' && (
        <div className="ml-6">
          <label className={labelClass}>Briefly describe the repayment arrangement:</label>
          <textarea
            value={data.repaymentDescription || ''}
            onChange={(e) => onChange('repaymentDescription', e.target.value)}
            placeholder="Enter description of the repayment arrangement"
            rows={3}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
