import React, { useState, useCallback } from 'react';
import {
  Info,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Heart,
  FileText,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import RepoDocumentLocationPicker from './DocumentLocationPicker';
import {
  type DbPensionDetails,
  type PensionEstimate,
  type BridgeBenefit,
  type IndexingInfo,
  type SurvivorUnderstanding,
  type SurvivorBenefitType,
  type SurvivorAmountKind,
  type WaiverInfo,
  type GuaranteePeriod,
  type EligibilityMilestone,
  type DocumentLocationRef,
  PENSION_JURISDICTION_OPTIONS,
  SURVIVOR_BENEFIT_TYPE_OPTIONS,
  SURVIVOR_PERCENTAGE_OPTIONS,
  generateEstimateId,
} from '../lib/workplacePensionsTypes';

type Props = {
  details: DbPensionDetails;
  onChange: (details: DbPensionDetails) => void;
  employerName: string;
  pensionStatus: string;
  spouseName?: string;
  spousePersonId?: string;
  hasMarriageContract?: boolean;
  peopleOptions: Array<{ id: string; name: string }>;
  planName?: string;
  administratorName?: string;
  documentLocationLabel?: string;
  onBack: () => void;
  onSave: () => void;
};

const inputClass =
  'w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelClass = 'block text-sm font-medium text-gray-300 mb-2';
const sectionCard = 'border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-4';
const subSectionCard = 'border border-gray-700 rounded-lg p-4 bg-gray-750 space-y-3';

const yesNoOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "I'm not sure" },
];

export default function DbPensionDetail({
  details,
  onChange,
  employerName,
  pensionStatus,
  spouseName,
  spousePersonId,
  hasMarriageContract,
  peopleOptions,
  planName,
  administratorName,
  documentLocationLabel,
  onBack,
  onSave,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['jurisdiction']));

  const update = useCallback(
    (patch: Partial<DbPensionDetails>) => {
      onChange({ ...details, ...patch });
    },
    [details, onChange],
  );

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderYesNo = (
    value: string | undefined,
    onPick: (v: string) => void,
    options = yesNoOptions,
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onPick(opt.value)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            value === opt.value
              ? 'border-blue-500 bg-blue-900/40 text-blue-200'
              : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const renderCollapsible = (
    key: string,
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode,
    defaultOpen = false,
  ) => {
    const isOpen = expandedSections.has(key) || defaultOpen;
    return (
      <div className={sectionCard}>
        <button
          type="button"
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-blue-400">{icon}</span>
            <h4 className="text-base font-semibold text-white">{title}</h4>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {isOpen && <div className="pt-4">{children}</div>}
      </div>
    );
  };

  const renderEligibilityMilestone = (
    label: string,
    milestone: EligibilityMilestone | undefined,
    onMilestone: (m: EligibilityMilestone) => void,
  ) => {
    const m = milestone || { type: '' };
    return (
      <div className={subSectionCard}>
        <label className={labelClass}>{label}</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { value: 'age', label: 'At age' },
            { value: 'date', label: 'On date' },
            { value: 'years_of_service', label: 'After years of service' },
            { value: 'other', label: 'Other' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onMilestone({ ...m, type: opt.value as EligibilityMilestone['type'] })}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                m.type === opt.value
                  ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {m.type === 'age' && (
          <input
            type="number"
            value={m.age ?? ''}
            onChange={(e) => onMilestone({ ...m, age: Number(e.target.value) || undefined })}
            placeholder="Age"
            className={inputClass}
          />
        )}
        {m.type === 'date' && (
          <input
            type="text"
            value={m.date || ''}
            onChange={(e) => onMilestone({ ...m, date: e.target.value })}
            placeholder="e.g., June 2030"
            className={inputClass}
          />
        )}
        {m.type === 'years_of_service' && (
          <input
            type="number"
            value={m.years ?? ''}
            onChange={(e) => onMilestone({ ...m, years: Number(e.target.value) || undefined })}
            placeholder="Years of service"
            className={inputClass}
          />
        )}
        {m.type === 'other' && (
          <input
            type="text"
            value={m.otherText || ''}
            onChange={(e) => onMilestone({ ...m, otherText: e.target.value })}
            placeholder="Describe"
            className={inputClass}
          />
        )}
      </div>
    );
  };

  const renderBridge = (
    bridge: BridgeBenefit | undefined,
    onBridge: (b: BridgeBenefit) => void,
  ) => {
    const b = bridge || { hasBridge: 'not_sure' };
    return (
      <div className={subSectionCard}>
        <label className={labelClass}>
          Does this pension include extra income that stops or changes at a certain age?
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Some pensions include a temporary or "bridge" benefit that commonly ends around age 65.
        </p>
        {renderYesNo(b.hasBridge, (v) => onBridge({ ...b, hasBridge: v as BridgeBenefit['hasBridge'] }))}
        {b.hasBridge === 'yes' && (
          <div className="space-y-4 pt-3">
            <div>
              <label className={labelClass}>About how much is the temporary/bridge benefit?</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={b.amount ?? ''}
                  onChange={(e) => onBridge({ ...b, amount: Number(e.target.value) || undefined })}
                  placeholder="$"
                  className={inputClass}
                />
                <select
                  value={b.frequency || ''}
                  onChange={(e) => onBridge({ ...b, frequency: e.target.value as 'monthly' | 'annual' })}
                  className={`${inputClass} w-32`}
                >
                  <option value="">Frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>When does it end?</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { value: 'age_65', label: 'Age 65' },
                  { value: 'age', label: 'Age' },
                  { value: 'date', label: 'Date' },
                  { value: 'other', label: 'Other' },
                  { value: 'not_sure', label: "I'm not sure" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onBridge({ ...b, endType: opt.value as BridgeBenefit['endType'] })}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      b.endType === opt.value
                        ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {b.endType === 'age' && (
                <input
                  type="number"
                  value={b.endAge ?? ''}
                  onChange={(e) => onBridge({ ...b, endAge: Number(e.target.value) || undefined })}
                  placeholder="Age"
                  className={inputClass}
                />
              )}
              {b.endType === 'date' && (
                <input
                  type="text"
                  value={b.endDate || ''}
                  onChange={(e) => onBridge({ ...b, endDate: e.target.value })}
                  placeholder="e.g., June 2030"
                  className={inputClass}
                />
              )}
              {b.endType === 'other' && (
                <input
                  type="text"
                  value={b.endOtherText || ''}
                  onChange={(e) => onBridge({ ...b, endOtherText: e.target.value })}
                  placeholder="Describe"
                  className={inputClass}
                />
              )}
            </div>
            <div>
              <label className={labelClass}>
                Is the temporary amount included in the pension estimate you entered above?
              </label>
              {renderYesNo(
                b.includedInEstimate,
                (v) => onBridge({ ...b, includedInEstimate: v as BridgeBenefit['includedInEstimate'] }),
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderIndexing = (
    indexing: IndexingInfo | undefined,
    onIndexing: (i: IndexingInfo) => void,
  ) => {
    const i = indexing || { hasIndexing: 'not_sure' };
    return (
      <div className={subSectionCard}>
        <label className={labelClass}>
          Once this pension starts, does it increase over time to help keep up with the cost of living?
        </label>
        {renderYesNo(i.hasIndexing, (v) => onIndexing({ ...i, hasIndexing: v as IndexingInfo['hasIndexing'] }))}
        {i.hasIndexing === 'yes' && (
          <div className="space-y-4 pt-3">
            <div>
              <label className={labelClass}>How are increases determined?</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { value: 'inflation', label: 'Based on inflation' },
                  { value: 'fixed_percentage', label: 'Fixed percentage' },
                  { value: 'other', label: 'Something else' },
                  { value: 'not_sure', label: "I'm not sure" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onIndexing({ ...i, method: opt.value as IndexingInfo['method'] })}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      i.method === opt.value
                        ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {i.method === 'inflation' && (
                <div className="mb-3">
                  <label className="text-xs text-gray-400 mb-1 block">
                    Approximately how much of inflation is covered? (optional)
                  </label>
                  <input
                    type="number"
                    value={i.inflationPercentage ?? ''}
                    onChange={(e) => onIndexing({ ...i, inflationPercentage: Number(e.target.value) || undefined })}
                    placeholder="%"
                    className={`${inputClass} w-24`}
                  />
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Is there a maximum annual increase?</label>
              {renderYesNo(i.hasMaxIncrease, (v) => onIndexing({ ...i, hasMaxIncrease: v as 'yes' | 'no' | 'not_sure' }))}
              {i.hasMaxIncrease === 'yes' && (
                <input
                  type="number"
                  value={i.maxIncreasePercentage ?? ''}
                  onChange={(e) => onIndexing({ ...i, maxIncreasePercentage: Number(e.target.value) || undefined })}
                  placeholder="Max %"
                  className={`${inputClass} w-24 mt-2`}
                />
              )}
            </div>
            <div>
              <label className={labelClass}>Is there a minimum annual increase?</label>
              {renderYesNo(i.hasMinIncrease, (v) => onIndexing({ ...i, hasMinIncrease: v as 'yes' | 'no' | 'not_sure' }))}
              {i.hasMinIncrease === 'yes' && (
                <input
                  type="number"
                  value={i.minIncreasePercentage ?? ''}
                  onChange={(e) => onIndexing({ ...i, minIncreasePercentage: Number(e.target.value) || undefined })}
                  placeholder="Min %"
                  className={`${inputClass} w-24 mt-2`}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSurvivor = (
    survivor: SurvivorUnderstanding | undefined,
    onSurvivor: (s: SurvivorUnderstanding) => void,
    isInPayment: boolean,
  ) => {
    const s = survivor || { hasSurvivorBenefit: 'not_sure' };
    const question = isInPayment
      ? 'If you die first, does any of this pension continue to someone else?'
      : 'If you died before starting this pension, do you know whether it would provide something for your spouse, family or someone else?';
    return (
      <div className={subSectionCard}>
        <label className={labelClass}>{question}</label>
        {renderYesNo(s.hasSurvivorBenefit, (v) => onSurvivor({ ...s, hasSurvivorBenefit: v as SurvivorUnderstanding['hasSurvivorBenefit'] }))}
        {s.hasSurvivorBenefit === 'yes' && (
          <div className="space-y-4 pt-3">
            <div>
              <label className={labelClass}>Who do you understand would receive something?</label>
              <div className="flex flex-wrap gap-2">
                {peopleOptions.map((person) => {
                  const sel = (s.beneficiaryPersonIds || []).includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => {
                        const current = s.beneficiaryPersonIds || [];
                        const next = sel
                          ? current.filter((id) => id !== person.id)
                          : [...current, person.id];
                        onSurvivor({ ...s, beneficiaryPersonIds: next });
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        sel
                          ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                          : 'border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {person.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => onSurvivor({ ...s, beneficiaryOtherText: s.beneficiaryOtherText === undefined ? '' : undefined })}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    s.beneficiaryOtherText !== undefined
                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Other
                </button>
                <button
                  type="button"
                  onClick={() => onSurvivor({ ...s, beneficiaryPersonIds: [], beneficiaryOtherText: undefined })}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    !s.beneficiaryPersonIds?.length && s.beneficiaryOtherText === undefined
                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  I'm not sure
                </button>
              </div>
              {s.beneficiaryOtherText !== undefined && (
                <input
                  type="text"
                  value={s.beneficiaryOtherText}
                  onChange={(e) => onSurvivor({ ...s, beneficiaryOtherText: e.target.value })}
                  placeholder="Describe"
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>
            <div>
              <label className={labelClass}>What do you understand they could receive?</label>
              <div className="flex flex-wrap gap-2">
                {SURVIVOR_BENEFIT_TYPE_OPTIONS.map((opt) => {
                  const sel = s.survivorBenefitType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onSurvivor({ ...s, survivorBenefitType: opt.value as SurvivorBenefitType })}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        sel
                          ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                          : 'border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {isInPayment && (
              <div>
                <label className={labelClass}>
                  How much of your pension do you understand would continue?
                </label>
                <div className="flex flex-wrap gap-2">
                  {SURVIVOR_PERCENTAGE_OPTIONS.map((opt) => {
                    const isPct = opt.value !== 'fixed_amount' && opt.value !== 'not_sure' && opt.value !== 'other';
                    const isFixed = opt.value === 'fixed_amount';
                    const isNotSure = opt.value === 'not_sure';
                    const isOther = opt.value === 'other';
                    const isSelected =
                      (isPct && s.survivorAmountKind === 'percentage' && s.survivorPercentage === Number(opt.value)) ||
                      (isFixed && s.survivorAmountKind === 'fixed_amount') ||
                      (isNotSure && s.survivorAmountKind === 'not_sure') ||
                      (isOther && s.survivorAmountKind === 'percentage' && s.survivorPercentage !== null && !SURVIVOR_PERCENTAGE_OPTIONS.some(o => o.value !== 'other' && o.value !== 'fixed_amount' && o.value !== 'not_sure' && Number(o.value) === s.survivorPercentage));
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          if (isPct) {
                            onSurvivor({
                              ...s,
                              survivorAmountKind: 'percentage' as SurvivorAmountKind,
                              survivorPercentage: Number(opt.value),
                              survivorFixedAmount: null,
                              survivorAmountFrequency: null,
                            });
                          } else if (isFixed) {
                            onSurvivor({
                              ...s,
                              survivorAmountKind: 'fixed_amount' as SurvivorAmountKind,
                              survivorPercentage: null,
                              survivorFixedAmount: s.survivorFixedAmount ?? undefined,
                            });
                          } else if (isNotSure) {
                            onSurvivor({
                              ...s,
                              survivorAmountKind: 'not_sure' as SurvivorAmountKind,
                              survivorPercentage: null,
                              survivorFixedAmount: null,
                              survivorAmountFrequency: null,
                            });
                          } else if (isOther) {
                            onSurvivor({
                              ...s,
                              survivorAmountKind: 'percentage' as SurvivorAmountKind,
                              survivorPercentage: null,
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                            : 'border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {s.survivorAmountKind === 'percentage' && s.survivorPercentage === null && (
                  <input
                    type="number"
                    value={s.survivorPercentage ?? ''}
                    onChange={(e) => onSurvivor({ ...s, survivorPercentage: Number(e.target.value) || null })}
                    placeholder="Enter percentage"
                    className={`${inputClass} w-32 mt-2`}
                  />
                )}
                {s.survivorAmountKind === 'fixed_amount' && (
                  <div className="flex gap-3 mt-2">
                    <input
                      type="number"
                      value={s.survivorFixedAmount ?? ''}
                      onChange={(e) => onSurvivor({ ...s, survivorFixedAmount: Number(e.target.value) || null })}
                      placeholder="$"
                      className={inputClass}
                    />
                    <select
                      value={s.survivorAmountFrequency || ''}
                      onChange={(e) => onSurvivor({ ...s, survivorAmountFrequency: e.target.value as 'monthly' | 'annual' | null })}
                      className={`${inputClass} w-32`}
                    >
                      <option value="">Frequency</option>
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {spouseName && (
          <div className="pt-4 border-t border-gray-700">
            <label className={labelClass}>
              Our records show {spouseName} as your spouse/partner. Is {spouseName} the person you
              understand would have spousal rights under this pension?
            </label>
            {renderYesNo(s.spouseConfirmed, (v) => onSurvivor({
              ...s,
              spouseConfirmed: v as 'yes' | 'no' | 'not_sure',
              spousePersonId: v === 'yes' ? spousePersonId : s.spousePersonId,
            }))}
            {s.spouseConfirmed === 'no' && (
              <div className="pt-3">
                <label className={labelClass}>Who do you understand may have those rights?</label>
                <div className="flex flex-wrap gap-2">
                  {peopleOptions.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => onSurvivor({ ...s, alternatePersonId: person.id, alternatePersonName: person.name })}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        s.alternatePersonId === person.id
                          ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                          : 'border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {person.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderWaiver = (
    waiver: WaiverInfo | undefined,
    onWaiver: (w: WaiverInfo) => void,
    isInPayment: boolean,
  ) => {
    const w = waiver || { hasWaiver: 'not_sure' };
    const question = isInPayment
      ? `Before this pension started, did ${spouseName || 'your spouse or partner'} sign any paperwork giving up rights to a survivor pension?`
      : `Has ${spouseName || 'your spouse or partner'} ever signed paperwork giving up any rights under this pension?`;
    const options = isInPayment
      ? [...yesNoOptions, { value: 'not_applicable', label: 'Not applicable' }]
      : yesNoOptions;
    return (
      <div className={subSectionCard}>
        <label className={labelClass}>{question}</label>
        {renderYesNo(w.hasWaiver, (v) => onWaiver({ ...w, hasWaiver: v as WaiverInfo['hasWaiver'] }), options)}
        {w.hasWaiver === 'yes' && (
          <div className="pt-3">
            <label className={labelClass}>Where could someone find that paperwork?</label>
            <RepoDocumentLocationPicker
              value={w.documentLocationRef ?? undefined}
              onChange={(ref) => {
                if (ref && typeof ref === 'object' && 'locationId' in ref) {
                  onWaiver({ ...w, documentLocationRef: ref as DocumentLocationRef });
                } else {
                  onWaiver({ ...w, documentLocationRef: null });
                }
              }}
              label="Document location"
              placeholder="Select or add a location"
            />
          </div>
        )}
      </div>
    );
  };

  const renderDomesticAgreement = () => {
    const d = details.domesticAgreement || { affectsPension: 'not_sure' };
    if (!hasMarriageContract) return null;
    return (
      <div className={subSectionCard}>
        <label className={labelClass}>
          You told us earlier that you have a marriage or cohabitation agreement. Does it say
          anything specifically about this pension?
        </label>
        {renderYesNo(d.affectsPension, (v) =>
          update({ domesticAgreement: { ...d, affectsPension: v as 'yes' | 'no' | 'not_sure' } }),
        )}
        {d.affectsPension === 'yes' && (
          <div className="pt-3">
            <label className={labelClass}>Where can this agreement be found?</label>
            <RepoDocumentLocationPicker
              value={d.documentLocationRef ?? undefined}
              onChange={(ref) => {
                if (ref && typeof ref === 'object' && 'locationId' in ref) {
                  update({ domesticAgreement: { ...d, documentLocationRef: ref as DocumentLocationRef } });
                } else {
                  update({ domesticAgreement: { ...d, documentLocationRef: null } });
                }
              }}
              label="Document location"
              placeholder="Select or add a location"
            />
          </div>
        )}
      </div>
    );
  };

  const renderEstimate = (est: PensionEstimate, idx: number) => {
    const isPrimary = est.isPrimary || idx === 0;
    return (
      <div key={est.id} className={subSectionCard}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-200">
            {isPrimary ? 'Primary estimate' : `Estimate ${idx + 1}`}
          </span>
          {!isPrimary && (
            <button
              type="button"
              onClick={() => {
                const estimates = (details.estimates || []).filter((e) => e.id !== est.id);
                update({ estimates });
              }}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div>
          <label className={labelClass}>What pension does the statement estimate?</label>
          <div className="flex gap-3">
            <input
              type="number"
              value={est.amount ?? ''}
              onChange={(e) => {
                const estimates = (details.estimates || []).map((e2) =>
                  e2.id === est.id ? { ...e2, amount: Number(e.target.value) || undefined } : e2,
                );
                update({ estimates });
              }}
              placeholder="$"
              className={inputClass}
            />
            <select
              value={est.frequency}
              onChange={(e) => {
                const estimates = (details.estimates || []).map((e2) =>
                  e2.id === est.id ? { ...e2, frequency: e.target.value as 'monthly' | 'annual' } : e2,
                );
                update({ estimates });
              }}
              className={`${inputClass} w-32`}
            >
              <option value="">Frequency</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>What retirement age or start date is that estimate based on?</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              { value: 'age', label: 'Age' },
              { value: 'date', label: 'Date' },
              { value: 'not_sure', label: "I'm not sure" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const estimates = (details.estimates || []).map((e2) =>
                    e2.id === est.id ? { ...e2, basedOnType: opt.value as PensionEstimate['basedOnType'] } : e2,
                  );
                  update({ estimates });
                }}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  est.basedOnType === opt.value
                    ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {est.basedOnType === 'age' && (
            <input
              type="number"
              value={est.basedOnAge ?? ''}
              onChange={(e) => {
                const estimates = (details.estimates || []).map((e2) =>
                  e2.id === est.id ? { ...e2, basedOnAge: Number(e.target.value) || undefined } : e2,
                );
                update({ estimates });
              }}
              placeholder="Age"
              className={inputClass}
            />
          )}
          {est.basedOnType === 'date' && (
            <input
              type="text"
              value={est.basedOnDate || ''}
              onChange={(e) => {
                const estimates = (details.estimates || []).map((e2) =>
                  e2.id === est.id ? { ...e2, basedOnDate: e.target.value } : e2,
                );
                update({ estimates });
              }}
              placeholder="e.g., Jan 2030"
              className={inputClass}
            />
          )}
        </div>
        <div>
          <label className={labelClass}>When was this estimate prepared?</label>
          <input
            type="text"
            value={est.estimateDate || ''}
            onChange={(e) => {
              const estimates = (details.estimates || []).map((e2) =>
                e2.id === est.id ? { ...e2, estimateDate: e.target.value } : e2,
              );
              update({ estimates });
            }}
            placeholder="Month/year (e.g., June 2026)"
            className={inputClass}
          />
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────

  const isActive = pensionStatus === 'active';
  const isDeferred = pensionStatus === 'deferred';
  const isReceiving = pensionStatus === 'receiving';
  const isPreRetirement = isActive || isDeferred;

  // Safe bridge calculation
  const primaryEstimate = details.estimates?.[0];
  const bridge = isReceiving ? details.inPayment?.bridge : details.bridge;
  const canCalcBridgeAfter =
    primaryEstimate?.amount !== undefined &&
    bridge?.amount !== undefined &&
    bridge.includedInEstimate === 'yes' &&
    bridge.frequency === primaryEstimate.frequency;
  const bridgeAfterAmount = canCalcBridgeAfter && primaryEstimate.amount && bridge.amount
    ? primaryEstimate.amount - bridge.amount
    : undefined;

  const inPayment = details.inPayment || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button type="button" onClick={onBack} className="hover:text-blue-400 transition-colors">
          Back
        </button>
        <span>/</span>
        <span className="text-gray-300">
          {employerName} — DB Pension Details
        </span>
      </div>

      {/* Pension guidance */}
      <div className="rounded-xl bg-blue-900/20 border border-blue-700/40 p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200 leading-relaxed">
            Your latest pension statement is the best place to find many of these answers.
            Don't worry if you don't know everything. We're trying to give you, your family and
            the people helping you a useful picture of the pension — not recreate the pension
            administrator's records.
          </p>
        </div>
      </div>

      {/* Jurisdiction */}
      {renderCollapsible(
        'jurisdiction',
        'Pension rules and jurisdiction',
        <FileText className="w-5 h-5" />,
        <div>
          <label className={labelClass}>
            Do you know which pension rules apply to this plan?
          </label>
          <p className="text-xs text-gray-500 mb-3">
            This may be shown on your pension statement or plan booklet. If you're not sure, that's okay.
          </p>
          <div className="flex flex-wrap gap-2">
            {PENSION_JURISDICTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ jurisdiction: opt.value })}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  details.jurisdiction === opt.value
                    ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>,
        true,
      )}

      {/* In-payment: current pension */}
      {isReceiving && (
        <div className={sectionCard}>
          <h4 className="text-base font-semibold text-white">Current pension payment</h4>
          <p className="text-sm text-blue-300 mb-4">
            Let's document the pension you're receiving today. This helps your family understand how
            much income it provides, how it may change over time, and what may continue for someone
            else after your death.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>How much pension are you currently receiving?</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={inPayment.currentAmount ?? ''}
                  onChange={(e) => update({ inPayment: { ...inPayment, currentAmount: Number(e.target.value) || undefined } })}
                  placeholder="$ (gross before tax, if known)"
                  className={inputClass}
                />
                <select
                  value={inPayment.currentFrequency || ''}
                  onChange={(e) => update({ inPayment: { ...inPayment, currentFrequency: e.target.value as 'monthly' | 'annual' } })}
                  className={`${inputClass} w-32`}
                >
                  <option value="">Frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => update({ inPayment: { ...inPayment, currentAmount: undefined } })}
                className="mt-2 text-xs text-gray-400 hover:text-gray-300"
              >
                I'm not sure of the exact amount
              </button>
            </div>
            <div>
              <label className={labelClass}>When did you start receiving this pension?</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <input
                  type="number"
                  value={inPayment.startedAge ?? ''}
                  onChange={(e) => update({ inPayment: { ...inPayment, startedAge: Number(e.target.value) || undefined } })}
                  placeholder="Age"
                  className={`${inputClass} w-24`}
                />
                <input
                  type="text"
                  value={inPayment.startedDate || ''}
                  onChange={(e) => update({ inPayment: { ...inPayment, startedDate: e.target.value } })}
                  placeholder="Month/year"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active/deferred: unreduced pension */}
      {isActive && (
        <div className={sectionCard}>
          <h4 className="text-base font-semibold text-white">Unreduced pension eligibility</h4>
          <label className={labelClass}>
            Do you know when you can start this pension without an early-retirement reduction?
          </label>
          {renderYesNo(details.unreducedEligibilityKnown, (v) =>
            update({ unreducedEligibilityKnown: v as 'yes' | 'no' | 'not_sure' }),
          )}
          {details.unreducedEligibilityKnown === 'yes' && (
            <div className="pt-3">
              {renderEligibilityMilestone(
                'When will you qualify?',
                details.unreducedEligibility,
                (m) => update({ unreducedEligibility: m }),
              )}
            </div>
          )}
        </div>
      )}

      {/* Active: maximum pension accrual */}
      {isActive && (
        <div className={sectionCard}>
          <h4 className="text-base font-semibold text-white">Maximum pension accrual</h4>
          <label className={labelClass}>
            Is there a point when you've earned the maximum pension available under the plan?
          </label>
          {renderYesNo(details.maxAccrualKnown, (v) =>
            update({ maxAccrualKnown: v as 'yes' | 'no' | 'not_sure' }),
          )}
          {details.maxAccrualKnown === 'yes' && (
            <div className="pt-3">
              {renderEligibilityMilestone(
                'When is the pension expected to reach its maximum?',
                details.maxAccrual,
                (m) => update({ maxAccrual: m }),
              )}
            </div>
          )}
        </div>
      )}

      {/* Expected commencement (active/deferred) */}
      {isPreRetirement && (
        <div className={sectionCard}>
          <h4 className="text-base font-semibold text-white">
            When are you currently thinking about starting this pension?
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { value: 'age', label: 'Age' },
              { value: 'date', label: 'Date' },
              { value: 'not_sure', label: "I'm not sure" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ expectedCommencementType: opt.value as 'age' | 'date' | 'not_sure' })}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  details.expectedCommencementType === opt.value
                    ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {details.expectedCommencementType === 'age' && (
            <input
              type="number"
              value={details.expectedCommencementAge ?? ''}
              onChange={(e) => update({ expectedCommencementAge: Number(e.target.value) || undefined })}
              placeholder="Age"
              className={inputClass}
            />
          )}
          {details.expectedCommencementType === 'date' && (
            <input
              type="text"
              value={details.expectedCommencementDate || ''}
              onChange={(e) => update({ expectedCommencementDate: e.target.value })}
              placeholder="e.g., Jan 2030"
              className={inputClass}
            />
          )}
        </div>
      )}

      {/* Pension estimate (active/deferred) */}
      {isPreRetirement && (
        <div className={sectionCard}>
          <h4 className="text-base font-semibold text-white">Pension estimate</h4>
          <label className={labelClass}>
            Does your most recent pension statement show an estimated pension at retirement?
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'no_statement', label: "I don't have the statement handy" },
              { value: 'not_sure', label: "I'm not sure" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (opt.value === 'yes' && !details.estimates?.length) {
                    update({ estimates: [{ id: generateEstimateId(), amount: undefined, frequency: '', basedOnType: '', isPrimary: true }] });
                  } else if (opt.value !== 'yes') {
                    update({ estimates: [] });
                  }
                }}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  (opt.value === 'yes' && details.estimates?.length) ||
                  (opt.value !== 'yes' && !details.estimates?.length)
                    ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {details.estimates?.map((est, idx) => renderEstimate(est, idx))}
          {details.estimates && details.estimates.length > 0 && (
            <button
              type="button"
              onClick={() =>
                update({
                  estimates: [
                    ...details.estimates!,
                    { id: generateEstimateId(), amount: undefined, frequency: '', basedOnType: '', isPrimary: false },
                  ],
                })
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-300 text-sm hover:bg-blue-900/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add another pension estimate
            </button>
          )}
        </div>
      )}

      {/* Bridge benefit */}
      {renderCollapsible(
        'bridge',
        isReceiving ? 'Bridge / temporary benefit (in payment)' : 'Bridge / temporary benefit',
        <Scale className="w-5 h-5" />,
        isReceiving
          ? renderBridge(inPayment.bridge, (b) => update({ inPayment: { ...inPayment, bridge: b } }))
          : renderBridge(details.bridge, (b) => update({ bridge: b })),
      )}

      {/* Safe bridge calculation display */}
      {bridgeAfterAmount !== undefined && primaryEstimate && (
        <div className="rounded-lg bg-emerald-900/20 border border-emerald-700/40 p-4">
          <p className="text-sm text-emerald-200">
            Based on the information you provided:
          </p>
          <p className="text-sm text-emerald-100 mt-2">
            Estimated pension before bridge ends: <strong>${primaryEstimate.amount?.toLocaleString()}/{primaryEstimate.frequency === 'monthly' ? 'month' : 'year'}</strong>
          </p>
          <p className="text-sm text-emerald-100">
            Estimated pension after bridge ends: <strong>${bridgeAfterAmount.toLocaleString()}/{primaryEstimate.frequency === 'monthly' ? 'month' : 'year'}</strong>
          </p>
          <p className="text-xs text-emerald-400 mt-2">
            This is derived from the information you provided. It is not an independent calculation.
          </p>
        </div>
      )}

      {/* Indexing */}
      {renderCollapsible(
        'indexing',
        'Indexing (cost-of-living increases)',
        <Info className="w-5 h-5" />,
        isReceiving
          ? renderIndexing(inPayment.indexing, (i) => update({ inPayment: { ...inPayment, indexing: i } }))
          : renderIndexing(details.indexing, (i) => update({ indexing: i })),
      )}

      {/* Survivor / death benefit (pre-retirement) */}
      {isPreRetirement &&
        renderCollapsible(
          'survivor',
          'Pre-retirement survivor understanding',
          <Heart className="w-5 h-5" />,
          renderSurvivor(details.survivor, (s) => update({ survivor: s }), false),
        )}

      {/* Survivor continuation (in-payment) */}
      {isReceiving &&
        renderCollapsible(
          'survivor_inpayment',
          'Survivor continuation',
          <Heart className="w-5 h-5" />,
          renderSurvivor(inPayment.survivor, (s) => update({ inPayment: { ...inPayment, survivor: s } }), true),
        )}

      {/* Guarantee period (in-payment only) */}
      {isReceiving &&
        renderCollapsible(
          'guarantee',
          'Guarantee period',
          <ShieldCheck className="w-5 h-5" />,
          <div className={subSectionCard}>
            <label className={labelClass}>
              Does your pension have a guaranteed payment period that may continue if you die within
              a certain number of years after retirement?
            </label>
            <p className="text-xs text-gray-500 mb-3">
              For example, some pensions guarantee payments for 5, 10 or 15 years after retirement
              even if the pensioner dies earlier.
            </p>
            {(() => {
              const g = inPayment.guarantee || { hasGuarantee: 'not_sure' };
              return (
                <>
                  {renderYesNo(g.hasGuarantee, (v) =>
                    update({ inPayment: { ...inPayment, guarantee: { ...g, hasGuarantee: v as GuaranteePeriod['hasGuarantee'] } } }),
                  )}
                  {g.hasGuarantee === 'yes' && (
                    <div className="space-y-4 pt-3">
                      <div>
                        <label className={labelClass}>How long is the guarantee period?</label>
                        <input
                          type="number"
                          value={g.years ?? ''}
                          onChange={(e) =>
                            update({ inPayment: { ...inPayment, guarantee: { ...g, years: Number(e.target.value) || undefined } } })
                          }
                          placeholder="Years"
                          className={`${inputClass} w-24`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Who do you understand would receive any remaining guaranteed payments?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'person', label: 'A specific person' },
                            { value: 'estate', label: 'Estate' },
                            { value: 'other', label: 'Other' },
                            { value: 'not_sure', label: "I'm not sure" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                update({ inPayment: { ...inPayment, guarantee: { ...g, beneficiaryType: opt.value as GuaranteePeriod['beneficiaryType'] } } })
                              }
                              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                g.beneficiaryType === opt.value
                                  ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {g.beneficiaryType === 'person' && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {peopleOptions.map((person) => {
                              const sel = (g.beneficiaryPersonIds || []).includes(person.id);
                              return (
                                <button
                                  key={person.id}
                                  type="button"
                                  onClick={() => {
                                    const current = g.beneficiaryPersonIds || [];
                                    const next = sel
                                      ? current.filter((id) => id !== person.id)
                                      : [...current, person.id];
                                    update({ inPayment: { ...inPayment, guarantee: { ...g, beneficiaryPersonIds: next } } });
                                  }}
                                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                    sel
                                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                                  }`}
                                >
                                  {person.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>,
        )}

      {/* Bridge + survivor cross-question (in-payment) */}
      {isReceiving &&
        inPayment.bridge?.hasBridge === 'yes' &&
        inPayment.survivor?.hasSurvivorBenefit === 'yes' &&
        renderCollapsible(
          'bridge_survivor',
          'Bridge and survivor benefit',
          <Info className="w-5 h-5" />,
          <div className={subSectionCard}>
            <label className={labelClass}>
              Do you know whether the temporary/bridge portion would continue to your survivor if you
              died before it ends?
            </label>
            {renderYesNo(inPayment.bridgeAndSurvivor, (v) =>
              update({ inPayment: { ...inPayment, bridgeAndSurvivor: v as 'yes' | 'no' | 'not_sure' } }),
            )}
          </div>,
        )}

      {/* Waiver */}
      {renderCollapsible(
        'waiver',
        'Spousal waiver',
        <FileText className="w-5 h-5" />,
        isReceiving
          ? renderWaiver(inPayment.waiver, (w) => update({ inPayment: { ...inPayment, waiver: w } }), true)
          : renderWaiver(details.waiver, (w) => update({ waiver: w }), false),
      )}

      {/* Domestic agreement */}
      {hasMarriageContract &&
        renderCollapsible(
          'domestic',
          'Domestic agreement',
          <Scale className="w-5 h-5" />,
          renderDomesticAgreement(),
        )}

      {/* Family-readiness confirmation */}
      <div className={sectionCard}>
        <h4 className="text-base font-semibold text-white">Family-readiness confirmation</h4>
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-300">
            <span className="text-gray-400">Plan name:</span>{' '}
            {planName || '— not specified'}
          </p>
          <p className="text-sm text-gray-300">
            <span className="text-gray-400">Administrator:</span>{' '}
            {administratorName || '— not specified'}
          </p>
          <p className="text-sm text-gray-300">
            <span className="text-gray-400">Plan documents:</span>{' '}
            {documentLocationLabel || '— not specified'}
          </p>
          <p className="text-sm text-gray-300">
            <span className="text-gray-400">Jurisdiction:</span>{' '}
            {details.jurisdiction
              ? PENSION_JURISDICTION_OPTIONS.find((o) => o.value === details.jurisdiction)?.label || details.jurisdiction
              : '— not specified'}
          </p>
          <p className="text-sm text-gray-300">
            <span className="text-gray-400">Employer:</span>{' '}
            {employerName}
          </p>
        </div>
        <label className={labelClass}>
          If your family needed to contact the pension administrator, is the information above enough
          to help them get started?
        </label>
        {renderYesNo(details.familyReadinessConfirmed, (v) =>
          update({ familyReadinessConfirmed: v as 'yes' | 'no' | 'not_sure' }),
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
        >
          Save pension details
        </button>
      </div>
    </div>
  );
}
