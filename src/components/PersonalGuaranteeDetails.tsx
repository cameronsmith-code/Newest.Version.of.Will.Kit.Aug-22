import { Trash2 } from 'lucide-react';
import DocumentLocationPicker from './DocumentLocationPicker';
import type { DocumentLocationRef } from '../lib/documentLocationTypes';

export type OtherGuarantor = {
  name: string;
  relationship: string;
  _addMore?: string;
};

export type PersonalGuaranteeData = {
  selectedCompany: string;
  guarantors: string[];
  otherGuarantors: OtherGuarantor[];
  obligationSelection: string;
  selectedObligationId: string;
  borrowingType: string;
  borrowingTypeOther: string;
  lenderName: string;
  lenderUnknown: string;
  amountOwed: string;
  amountOwedUnknown: string;
  guaranteeScope: string;
  maximumAmount: string;
  percentage: string;
  arrangementDescription: string;
  hasPledgedSecurity: string;
  pledgedAssets: string[];
  pledgedAssetsOther: string;
  hasDocCopy: string;
  docLocation: string;
  hasAdditional: string;
  obligationEntityId?: string;
  borrowerEntityId?: string;
  lenderEntityId?: string;
  guarantorEntityIds?: string[];
  guaranteeLinkRequiresConfirmation?: boolean;
};

type ExistingObligationOption = {
  id: string;
  label: string;
  obligationType: string;
  amount: string;
  lenderDisplayName: string;
};

type Props = {
  index: number;
  data: Partial<PersonalGuaranteeData>;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  corporations: Array<{ legalName: string }>;
  existingObligations: ExistingObligationOption[];
  onChange: (field: keyof PersonalGuaranteeData, value: unknown) => void;
  onMultiChange: (updates: Partial<PersonalGuaranteeData>) => void;
  onRemove: () => void;
};

const inputClass =
  'w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
const labelClass = 'block text-sm font-medium text-gray-300 mb-2';

const BORROWING_TYPES = [
  { value: 'business_loan', label: 'Business loan / term loan' },
  { value: 'operating_line', label: 'Operating line of credit' },
  { value: 'business_credit_card', label: 'Business credit card' },
  { value: 'commercial_mortgage', label: 'Commercial mortgage' },
  { value: 'equipment_financing', label: 'Equipment or vehicle financing' },
  { value: 'equipment_lease', label: 'Equipment or vehicle lease' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: 'Not sure' },
];

const GUARANTEE_SCOPES = [
  { value: 'entire_amount', label: 'The entire amount' },
  { value: 'specific_maximum', label: 'A specific maximum amount' },
  { value: 'percentage', label: 'A percentage of the debt' },
  { value: 'another_arrangement', label: 'Another arrangement' },
  { value: 'not_sure', label: "I'm not sure" },
];

const PLEDGED_ASSET_OPTIONS = [
  { value: 'personal_residence', label: 'Personal residence' },
  { value: 'other_real_estate', label: 'Other real estate' },
  { value: 'investment_account', label: 'Investment account' },
  { value: 'cash_gics', label: 'Cash / GICs' },
  { value: 'other_personal_assets', label: 'Other personal assets' },
  { value: 'other', label: 'Other' },
];

export default function PersonalGuaranteeDetails({
  index,
  data,
  client1Name,
  client2Name,
  hasSpouse,
  corporations,
  existingObligations,
  onChange,
  onMultiChange,
  onRemove,
}: Props) {
  const companyName = data.selectedCompany || `Guarantee ${index + 1}`;
  const guarantors = data.guarantors || [];
  const otherGuarantors = data.otherGuarantors || [];
  const validCorps = corporations.filter((c) => c.legalName?.trim());
  const obligationSelection = data.obligationSelection || '';
  const showBorrowingDetails = obligationSelection === 'another_borrowing' || (obligationSelection === '' && existingObligations.length === 0);

  const handleGuarantorToggle = (value: string, checked: boolean) => {
    const updated = checked ? [...guarantors, value] : guarantors.filter((v) => v !== value);
    onMultiChange({
      guarantors: updated,
      otherGuarantors: value === 'other' && !checked ? [] : otherGuarantors,
    });
  };

  const handleOtherGuarantorChange = (i: number, field: keyof OtherGuarantor, value: string) => {
    const updated = [...otherGuarantors];
    if (!updated[i]) updated[i] = { name: '', relationship: '' };
    updated[i] = { ...updated[i], [field]: value };
    onChange('otherGuarantors', updated);
  };

  const resetGuaranteeScope = () => {
    onMultiChange({
      guaranteeScope: '',
      maximumAmount: '',
      percentage: '',
      arrangementDescription: '',
    });
  };

  const pledgedAssets = data.pledgedAssets || [];

  const handlePledgedAssetToggle = (value: string, checked: boolean) => {
    const updated = checked ? [...pledgedAssets, value] : pledgedAssets.filter((v) => v !== value);
    onMultiChange({
      pledgedAssets: updated,
      pledgedAssetsOther: value === 'other' && !checked ? '' : data.pledgedAssetsOther,
    });
  };

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
            onRemove();
          }}
          aria-label={`Remove ${companyName}`}
          title="Remove this personal guarantee"
          className="ml-auto inline-flex items-center gap-1.5 justify-center rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <Trash2 size={16} />
          Remove
        </button>
      </div>

      {/* Which company has the borrowing that was personally guaranteed? */}
      <div>
        <label className={labelClass}>Which company has the borrowing that was personally guaranteed?</label>
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

      {/* Which borrowing is guaranteed? — only show if a company is selected */}
      {data.selectedCompany && (
        <div>
          <label className={labelClass}>Which borrowing is guaranteed?</label>
          <div className="space-y-2">
            {existingObligations.map((opt) => (
              <label key={opt.id} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name={`pg-obligationSelection-${index}`}
                  value={opt.id}
                  checked={obligationSelection === 'existing_obligation' && data.selectedObligationId === opt.id}
                  onChange={() => onMultiChange({ obligationSelection: 'existing_obligation', selectedObligationId: opt.id })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-300">{opt.label}</span>
              </label>
            ))}
            <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`pg-obligationSelection-${index}`}
                value="another_borrowing"
                checked={obligationSelection === 'another_borrowing'}
                onChange={() => onMultiChange({ obligationSelection: 'another_borrowing', selectedObligationId: '' })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">Another borrowing not listed</span>
            </label>
            <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`pg-obligationSelection-${index}`}
                value="not_sure"
                checked={obligationSelection === 'not_sure'}
                onChange={() => onMultiChange({ obligationSelection: 'not_sure', selectedObligationId: '' })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">I'm not sure</span>
            </label>
          </div>
        </div>
      )}

      {/* Who personally guaranteed this borrowing? */}
      <div>
        <label className={labelClass}>Who personally guaranteed this borrowing?</label>
        <div className="space-y-2">
          <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={guarantors.includes('client1')}
              onChange={(e) => handleGuarantorToggle('client1', e.target.checked)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <span className="ml-3 text-gray-300">{client1Name}</span>
          </label>
          {hasSpouse && (
            <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={guarantors.includes('client2')}
                onChange={(e) => handleGuarantorToggle('client2', e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="ml-3 text-gray-300">{client2Name}</span>
            </label>
          )}
          <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={guarantors.includes('other')}
              onChange={(e) => handleGuarantorToggle('other', e.target.checked)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <span className="ml-3 text-gray-300">Other person</span>
          </label>
          {validCorps.map((corp, ci) => (
            <label key={`corp-${ci}`} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={guarantors.includes(`corp_${ci}`)}
                onChange={(e) => handleGuarantorToggle(`corp_${ci}`, e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="ml-3 text-gray-300">{corp.legalName} (corporate guarantee)</span>
            </label>
          ))}
        </div>
      </div>

      {/* If Other: Who else provided a personal guarantee? */}
      {guarantors.includes('other') && (
        <div className="ml-6 space-y-5">
          <label className="block text-sm font-semibold text-gray-200">Who else provided a personal guarantee?</label>
          {otherGuarantors.map((og, oi) => (
            <div key={oi} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Person {oi + 1}</h4>
                <button
                  type="button"
                  onClick={() => {
                    const updated = otherGuarantors.filter((_, idx) => idx !== oi);
                    onChange('otherGuarantors', updated);
                  }}
                  className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={og.name || ''}
                  onChange={(e) => handleOtherGuarantorChange(oi, 'name', e.target.value)}
                  placeholder="Enter name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Relationship or connection</label>
                <input
                  type="text"
                  value={og.relationship || ''}
                  onChange={(e) => handleOtherGuarantorChange(oi, 'relationship', e.target.value)}
                  placeholder="Enter relationship or connection"
                  className={inputClass}
                />
              </div>
              {oi === otherGuarantors.length - 1 && (
                <div>
                  <label className={labelClass}>Is there another person who provided a personal guarantee?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`pg-other-hasMore-${index}-${oi}`}
                        value="yes"
                        checked={og._addMore === 'yes'}
                        onChange={() => {
                          const updated = [...otherGuarantors];
                          updated[oi] = { ...updated[oi], _addMore: 'yes' };
                          onChange('otherGuarantors', [...updated, { name: '', relationship: '' }]);
                        }}
                        className="mr-2"
                      />
                      <span className="text-gray-300">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`pg-other-hasMore-${index}-${oi}`}
                        value="no"
                        checked={og._addMore === 'no' || !og._addMore}
                        onChange={() => {
                          const updated = [...otherGuarantors];
                          updated[oi] = { ...updated[oi], _addMore: 'no' };
                          onChange('otherGuarantors', updated);
                        }}
                        className="mr-2"
                      />
                      <span className="text-gray-300">No</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
          {otherGuarantors.length === 0 && (
            <div>
              <label className={labelClass}>Is there another person who provided a personal guarantee?</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`pg-other-initial-${index}`}
                    value="yes"
                    checked={false}
                    onChange={() => {
                      onChange('otherGuarantors', [{ name: '', relationship: '' }]);
                    }}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`pg-other-initial-${index}`}
                    value="no"
                    checked={false}
                    onChange={() => {}}
                    className="mr-2"
                  />
                  <span className="text-gray-300">No</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Borrowing detail fields — only shown for "Another borrowing" or when no existing obligations */}
      {showBorrowingDetails && (
        <>
      {/* What type of company borrowing was guaranteed? */}
      <div>
        <label className={labelClass}>What type of company borrowing was guaranteed?</label>
        <div className="space-y-2">
          {BORROWING_TYPES.map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`pg-borrowingType-${index}`}
                value={opt.value}
                checked={data.borrowingType === opt.value}
                onChange={() => onMultiChange({ borrowingType: opt.value, borrowingTypeOther: '' })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* If Other: Please describe the borrowing */}
      {data.borrowingType === 'other' && (
        <div className="ml-6">
          <label className={labelClass}>Please describe the borrowing:</label>
          <input
            type="text"
            value={data.borrowingTypeOther || ''}
            onChange={(e) => onChange('borrowingTypeOther', e.target.value)}
            placeholder="Enter description of the borrowing"
            className={inputClass}
          />
        </div>
      )}

      {/* Who is the lender or creditor? */}
      <div>
        <label className={labelClass}>Who is the lender or creditor?</label>
        <input
          type="text"
          value={data.lenderName || ''}
          onChange={(e) => onChange('lenderName', e.target.value)}
          placeholder="Enter lender or creditor name"
          disabled={data.lenderUnknown === 'yes'}
          className={inputClass}
        />
        <label className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={data.lenderUnknown === 'yes'}
            onChange={(e) => onMultiChange({
              lenderUnknown: e.target.checked ? 'yes' : '',
              lenderName: e.target.checked ? '' : data.lenderName,
            })}
            className="mr-2"
          />
          <span className="text-gray-300">I don't know</span>
        </label>
      </div>

      {/* Approximately how much does [Company Name] currently owe on this borrowing? */}
      <div>
        <label className={labelClass}>Approximately how much does {companyName} currently owe on this borrowing?</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            type="text"
            value={data.amountOwed || ''}
            onChange={(e) => onChange('amountOwed', e.target.value)}
            placeholder="___________"
            disabled={data.amountOwedUnknown === 'yes'}
            className={`${inputClass} pl-7`}
          />
        </div>
        <label className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={data.amountOwedUnknown === 'yes'}
            onChange={(e) => onMultiChange({
              amountOwedUnknown: e.target.checked ? 'yes' : '',
              amountOwed: e.target.checked ? '' : data.amountOwed,
            })}
            className="mr-2"
          />
          <span className="text-gray-300">I don't know</span>
        </label>
        <p className="text-xs text-gray-400 mt-1 italic">An estimate is fine. This can be confirmed later.</p>
      </div>
        </>
      )}

      {/* Do you know how much of this borrowing is personally guaranteed? */}
      <div>
        <label className={labelClass}>Do you know how much of this borrowing is personally guaranteed?</label>
        <div className="space-y-2">
          {GUARANTEE_SCOPES.map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`pg-guaranteeScope-${index}`}
                value={opt.value}
                checked={data.guaranteeScope === opt.value}
                onChange={() => {
                  resetGuaranteeScope();
                  onChange('guaranteeScope', opt.value);
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* If specific maximum: What is the maximum amount guaranteed? */}
      {data.guaranteeScope === 'specific_maximum' && (
        <div className="ml-6">
          <label className={labelClass}>What is the maximum amount guaranteed?</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="text"
              value={data.maximumAmount || ''}
              onChange={(e) => onChange('maximumAmount', e.target.value)}
              placeholder="___________"
              className={`${inputClass} pl-7`}
            />
          </div>
        </div>
      )}

      {/* If percentage: What percentage is guaranteed? */}
      {data.guaranteeScope === 'percentage' && (
        <div className="ml-6">
          <label className={labelClass}>What percentage is guaranteed?</label>
          <div className="relative max-w-[160px]">
            <input
              type="number"
              min="0"
              max="100"
              value={data.percentage || ''}
              onChange={(e) => onChange('percentage', e.target.value)}
              placeholder="__"
              className={inputClass}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>
      )}

      {/* If another arrangement: Briefly describe the guarantee */}
      {data.guaranteeScope === 'another_arrangement' && (
        <div className="ml-6">
          <label className={labelClass}>Briefly describe the guarantee:</label>
          <textarea
            value={data.arrangementDescription || ''}
            onChange={(e) => onChange('arrangementDescription', e.target.value)}
            placeholder="Enter description of the guarantee arrangement"
            rows={3}
            className={inputClass}
          />
        </div>
      )}

      {/* Has any personal property or investment been pledged as security for this borrowing? */}
      <div>
        <label className={labelClass}>Has any personal property or investment been pledged as security for this borrowing?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`pg-hasPledgedSecurity-${index}`}
                value={opt.value}
                checked={data.hasPledgedSecurity === opt.value}
                onChange={() => {
                  onMultiChange({
                    hasPledgedSecurity: opt.value,
                    pledgedAssets: [],
                    pledgedAssetsOther: '',
                  });
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* If yes: What has been pledged? (multi-select) */}
      {data.hasPledgedSecurity === 'yes' && (
        <div className="ml-6">
          <label className={labelClass}>What has been pledged?</label>
          <div className="space-y-2">
            {PLEDGED_ASSET_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pledgedAssets.includes(opt.value)}
                  onChange={(e) => handlePledgedAssetToggle(opt.value, e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="ml-3 text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
          {pledgedAssets.includes('other') && (
            <div className="mt-3">
              <label className={labelClass}>Please describe:</label>
              <input
                type="text"
                value={data.pledgedAssetsOther || ''}
                onChange={(e) => onChange('pledgedAssetsOther', e.target.value)}
                placeholder="Enter description of the other pledged asset"
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Do you have a copy of the personal guarantee or lending documents? */}
      <div>
        <label className={labelClass}>Do you have a copy of the personal guarantee or lending documents?</label>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: 'Not sure' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`pg-hasDocCopy-${index}`}
                value={opt.value}
                checked={data.hasDocCopy === opt.value}
                onChange={() => {
                  onMultiChange({
                    hasDocCopy: opt.value,
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
      {data.hasDocCopy === 'yes' && (
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
