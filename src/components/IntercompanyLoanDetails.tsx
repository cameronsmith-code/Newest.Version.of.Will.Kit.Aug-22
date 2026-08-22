import { Trash2 } from 'lucide-react';
import DocumentLocationPicker from './DocumentLocationPicker';
import type { DocumentLocationRef } from '../lib/documentLocationTypes';

export type IntercompanyLoanData = {
  lenderCompany: string;
  borrowerCompany: string;
  amount: string;
  amountUnknown: string;
  balanceChanges: string;
  hasWrittenAgreement: string;
  docLocation: string;
  chargesInterest: string;
  interestRate: string;
  hasRepaymentTerms: string;
  repaymentDescription: string;
  hasAdditional: string;
  obligationEntityId?: string;
  lenderEntityId?: string;
  borrowerEntityId?: string;
};

type Props = {
  index: number;
  data: Partial<IntercompanyLoanData>;
  corporations: Array<{ legalName: string }>;
  onChange: (field: keyof IntercompanyLoanData, value: unknown) => void;
  onMultiChange: (updates: Partial<IntercompanyLoanData>) => void;
  onRemove: () => void;
};

const inputClass =
  'w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
const labelClass = 'block text-sm font-medium text-gray-300 mb-2';

export default function IntercompanyLoanDetails({
  index,
  data,
  corporations,
  onChange,
  onMultiChange,
  onRemove,
}: Props) {
  const lenderName = data.lenderCompany || `Entry ${index + 1}`;
  const borrowerName = data.borrowerCompany;
  const headerLabel = lenderName && borrowerName ? `${lenderName} → ${borrowerName}` : `Entry ${index + 1}`;

  const availableBorrowers = corporations
    .filter((c) => c.legalName?.trim() && c.legalName !== data.lenderCompany)
    .map((c) => c.legalName);

  return (
    <div className="border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-5 mt-2">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-600">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
          {index + 1}
        </div>
        <h3 className="text-lg font-semibold text-white truncate">{headerLabel}</h3>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (typeof onRemove === 'function') onRemove();
          }}
          aria-label={`Remove ${headerLabel}`}
          title="Remove this entry"
          className="ml-auto inline-flex items-center gap-1.5 justify-center rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <Trash2 size={16} />
          Remove
        </button>
      </div>

      {/* Which company provided the money? */}
      <div>
        <label className={labelClass}>Which company provided the money?</label>
        <select
          value={data.lenderCompany || ''}
          onChange={(e) => onMultiChange({
            lenderCompany: e.target.value,
            borrowerCompany: e.target.value === data.borrowerCompany ? '' : data.borrowerCompany,
          })}
          className={inputClass}
        >
          <option value="">Select a company</option>
          {corporations.filter((c) => c.legalName?.trim()).map((corp, i) => (
            <option key={i} value={corp.legalName}>{corp.legalName}</option>
          ))}
        </select>
      </div>

      {/* Which company received the money? */}
      <div>
        <label className={labelClass}>Which company received the money?</label>
        <select
          value={data.borrowerCompany || ''}
          onChange={(e) => onChange('borrowerCompany', e.target.value)}
          className={inputClass}
        >
          <option value="">Select a company</option>
          {availableBorrowers.map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
        </select>
        {data.lenderCompany && availableBorrowers.length === 0 && (
          <p className="text-xs text-amber-400 mt-1">No other companies available to select as the borrower.</p>
        )}
      </div>

      {/* Approximately how much is currently owing? */}
      <div>
        <label className={labelClass}>Approximately how much is currently owing?</label>
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
        <label className={labelClass}>Does this amount change regularly as money moves between the companies?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`ic-balanceChanges-${index}`}
                value={opt.value}
                checked={data.balanceChanges === opt.value}
                onChange={() => onChange('balanceChanges', opt.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Is there a written agreement? */}
      <div>
        <label className={labelClass}>Is there a written agreement or promissory note for this amount?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`ic-hasWrittenAgreement-${index}`}
                value={opt.value}
                checked={data.hasWrittenAgreement === opt.value}
                onChange={() => onMultiChange({
                  hasWrittenAgreement: opt.value,
                  docLocation: '',
                })}
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

      {/* Is interest charged? */}
      <div>
        <label className={labelClass}>Is interest charged on this amount?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`ic-chargesInterest-${index}`}
                value={opt.value}
                checked={data.chargesInterest === opt.value}
                onChange={() => onMultiChange({
                  chargesInterest: opt.value,
                  interestRate: '',
                })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* If yes: Interest rate */}
      {data.chargesInterest === 'yes' && (
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
        <label className={labelClass}>Are there specific repayment terms?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`ic-hasRepaymentTerms-${index}`}
                value={opt.value}
                checked={data.hasRepaymentTerms === opt.value}
                onChange={() => onMultiChange({
                  hasRepaymentTerms: opt.value,
                  repaymentDescription: '',
                })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* If yes: Briefly describe them */}
      {data.hasRepaymentTerms === 'yes' && (
        <div className="ml-6">
          <label className={labelClass}>Briefly describe them:</label>
          <textarea
            value={data.repaymentDescription || ''}
            onChange={(e) => onChange('repaymentDescription', e.target.value)}
            placeholder="Enter description of the repayment terms"
            rows={3}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
