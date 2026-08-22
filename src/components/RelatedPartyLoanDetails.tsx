import React from 'react';
import { Trash2 } from 'lucide-react';
import DocumentLocationPicker from './DocumentLocationPicker';
import type { DocumentLocationRef } from '../lib/documentLocationTypes';

export type RelatedPartyLoanData = {
  direction: string;
  amount: string;
  amountUnknown: string;
  hasWrittenAgreement: string;
  docLocation: string;
  hasAdditional: string;
  obligationEntityId?: string;
  borrowerEntityId?: string;
  lenderEntityId?: string;
};

type Props = {
  index: number;
  data: Partial<RelatedPartyLoanData>;
  corporations: Array<{ legalName: string }>;
  onChange: (field: keyof RelatedPartyLoanData, value: unknown) => void;
  onMultiChange: (updates: Partial<RelatedPartyLoanData>) => void;
  onRemove: () => void;
};

const inputClass =
  'w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
const labelClass = 'block text-sm font-medium text-gray-300 mb-2';

export default function RelatedPartyLoanDetails({
  index,
  data,
  corporations,
  onChange,
  onMultiChange,
  onRemove,
}: Props) {
  const corpName = corporations[0]?.legalName || 'Your Company';
  const directionLabel =
    data.direction === 'company_owes_other' ? `${corpName} owes the other party` :
    data.direction === 'other_owes_company' ? `The other party owes ${corpName}` :
    data.direction === 'not_sure' ? 'Direction uncertain' :
    `Entry ${index + 1}`;

  return (
    <div className="border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-5 mt-2">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-600">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
          {index + 1}
        </div>
        <h3 className="text-lg font-semibold text-white truncate">{directionLabel}</h3>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (typeof onRemove === 'function') onRemove();
          }}
          aria-label={`Remove ${directionLabel}`}
          title="Remove this entry"
          className="ml-auto inline-flex items-center gap-1.5 justify-center rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <Trash2 size={16} />
          Remove
        </button>
      </div>

      {/* Who owes the money? */}
      <div>
        <label className={labelClass}>Who owes the money?</label>
        <div className="space-y-2">
          {corporations.map((corp, i) => (
            <React.Fragment key={i}>
              <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name={`rpl-direction-${index}`}
                  value={`company_owes_other_${i}`}
                  checked={data.direction === `company_owes_other_${i}`}
                  onChange={() => onChange('direction', `company_owes_other_${i}`)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-300">{corp.legalName} owes the other party</span>
              </label>
              <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name={`rpl-direction-${index}`}
                  value={`other_owes_company_${i}`}
                  checked={data.direction === `other_owes_company_${i}`}
                  onChange={() => onChange('direction', `other_owes_company_${i}`)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-300">The other party owes {corp.legalName}</span>
              </label>
            </React.Fragment>
          ))}
          <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
            <input
              type="radio"
              name={`rpl-direction-${index}`}
              value="not_sure"
              checked={data.direction === 'not_sure'}
              onChange={() => onChange('direction', 'not_sure')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-gray-300">I'm not sure</span>
          </label>
        </div>
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

      {/* Is there a written agreement? */}
      <div>
        <label className={labelClass}>Is there a written agreement or other documentation for this amount?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`rpl-hasWrittenAgreement-${index}`}
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
    </div>
  );
}
