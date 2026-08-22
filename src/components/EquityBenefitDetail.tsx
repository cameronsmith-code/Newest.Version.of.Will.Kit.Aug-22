import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  FileText,
  Calendar,
  Heart,
  Building2,
  Users,
  Globe,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  type EquityBenefitDetails,
  type EquityOwnershipStatus,
  type VestingStatus,
  type VestingDate,
  type EquityPaymentStatus,
  type EquityDeathIncapacityRules,
  type EquityTerminationRules,
  type EquityBeneficiary,
  type BeneficiaryDesignationAllowed,
  type OptionExpiryStatus,
  type EquityIssuerInfo,
  type EmployerCountrySelection,
  type IssuerSameAsEmployer,
  type ReportedValue,
  generateVestingDateId,
} from '../lib/workplacePensionsTypes';

type Props = {
  details: EquityBenefitDetails;
  onChange: (details: EquityBenefitDetails) => void;
  employerName: string;
  benefitTypeLabel: string;
  benefitType: string;
  employerIsCurrent: boolean;
  peopleOptions: Array<{ id: string; name: string }>;
  administratorName?: string;
  documentLocationLabel?: string;
  footprintAssetId?: string;
  footprintAssetRecognized?: boolean;
  onFootprintAssetIdChange: (id: string | undefined, recognized: boolean) => void;
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

const ownershipOptions: Array<{ value: EquityOwnershipStatus; label: string }> = [
  { value: 'currently_own', label: 'I currently own shares' },
  { value: 'future_contingent', label: 'I have awards/options that may become valuable or turn into shares in the future' },
  { value: 'both', label: 'Both' },
  { value: 'not_sure', label: "I'm not sure" },
];

const vestingOptions: Array<{ value: VestingStatus; label: string }> = [
  { value: 'fully_vested', label: 'Yes — fully vested' },
  { value: 'partly_vested', label: 'Partly' },
  { value: 'not_vested', label: 'No — still subject to future vesting' },
  { value: 'not_sure', label: "I'm not sure" },
];

const paymentStatusOptions: Array<{ value: EquityPaymentStatus; label: string }> = [
  { value: 'not_receiving', label: 'No' },
  { value: 'receiving', label: 'Yes' },
  { value: 'not_sure', label: "I'm not sure" },
];

const optionExpiryOptions: Array<{ value: OptionExpiryStatus; label: string }> = [
  { value: 'known', label: 'Yes' },
  { value: 'unknown', label: "No / I'm not sure" },
  { value: 'none_reported', label: 'My information says they do not expire / no expiry is shown' },
];

const employerCountryOptions: Array<{ value: EmployerCountrySelection; label: string }> = [
  { value: 'canada', label: 'Canada' },
  { value: 'united_states', label: 'United States' },
  { value: 'another_country', label: 'Another country' },
  { value: 'not_sure', label: "I'm not sure" },
];

const issuerSameOptions: Array<{ value: IssuerSameAsEmployer; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "I'm not sure" },
];

const custodyContextOptions = [
  { value: 'canadian_brokerage', label: 'Canadian financial institution / brokerage' },
  { value: 'us_foreign_brokerage', label: 'U.S. / foreign financial institution' },
  { value: 'employer_plan_administrator', label: 'Employer share-plan administrator' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

function isExecutiveType(benefitType: string): boolean {
  return (
    benefitType === 'supplemental_retirement' ||
    benefitType === 'rca' ||
    benefitType === 'deferred_comp' ||
    benefitType === 'deferred_bonus'
  );
}

function isStockOptionType(benefitType: string): boolean {
  return benefitType === 'stock_options';
}

function isShareType(benefitType: string): boolean {
  return benefitType === 'espp' || benefitType === 'employer_shares';
}

function isUnitType(benefitType: string): boolean {
  return benefitType === 'rsu' || benefitType === 'psu' || benefitType === 'dsu';
}

export default function EquityBenefitDetail({
  details,
  onChange,
  employerName,
  benefitTypeLabel,
  benefitType,
  employerIsCurrent,
  peopleOptions,
  administratorName,
  documentLocationLabel,
  footprintAssetId,
  footprintAssetRecognized,
  onFootprintAssetIdChange,
  onBack,
  onSave,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['planName']),
  );

  const update = useCallback(
    (patch: Partial<EquityBenefitDetails>) => {
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
  ) => {
    const isOpen = expandedSections.has(key);
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

  const isExecutive = isExecutiveType(benefitType);
  const isStockOption = isStockOptionType(benefitType);
  const isShares = isShareType(benefitType);
  const isUnits = isUnitType(benefitType);
  const showOwnershipQuestion = isShares || isStockOption || isUnits || benefitType === 'other' || benefitType === 'not_sure';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button type="button" onClick={onBack} className="hover:text-blue-400">
          Back to summary
        </button>
        <span>/</span>
        <span className="text-gray-300">
          {employerName} — {benefitTypeLabel}
        </span>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-blue-900/20 to-gray-800 border border-blue-800/30 p-5">
        <h3 className="text-xl font-semibold text-white">{benefitTypeLabel}</h3>
        <p className="text-sm text-gray-400 mt-1">
          {employerName} — {employerIsCurrent ? 'Current Employer' : 'Former Employer'}
        </p>
        {administratorName && (
          <p className="text-xs text-gray-500 mt-1">Administrator: {administratorName}</p>
        )}
        {documentLocationLabel && (
          <p className="text-xs text-gray-500">Documents: {documentLocationLabel}</p>
        )}
      </div>

      {/* Plan / Program Name */}
      {renderCollapsible(
        'planName',
        'Plan or Program Name',
        <FileText className="w-5 h-5" />,
        <div>
          <label className={labelClass}>What is this plan or program called?</label>
          <input
            type="text"
            value={details.planName || ''}
            onChange={(e) => update({ planName: e.target.value })}
            placeholder="e.g., ABC Long-Term Incentive Plan, Executive Share Option Plan"
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-2">
            This is a display name. The stable benefit ID is used for internal tracking.
          </p>
        </div>,
      )}

      {/* Cross-border: Employer / Issuer Country */}
      {renderCollapsible(
        'crossBorder',
        'Company & Country',
        <Globe className="w-5 h-5" />,
        <EquityIssuerSection
          issuer={details.equityIssuer}
          employerName={employerName}
          onChange={(issuer) => update({ equityIssuer: issuer })}
        />,
      )}

      {/* Ownership vs Contingent */}
      {showOwnershipQuestion && renderCollapsible(
        'ownership',
        'Owned vs Future / Contingent',
        <Briefcase className="w-5 h-5" />,
        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Do you currently own shares through this benefit, or is it something you may receive in the future?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ownershipOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ ownershipStatus: opt.value })}
                  className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                    details.ownershipStatus === opt.value
                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footprint reconciliation for owned shares */}
          {(details.ownershipStatus === 'currently_own' || details.ownershipStatus === 'both') && (
            <div className={subSectionCard}>
              {footprintAssetRecognized && footprintAssetId ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">
                    Already identified in your Financial Footprint
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-300">
                      We haven't identified these employer shares in your Financial Footprint yet.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onFootprintAssetIdChange(undefined, false);
                        update({ footprintOffered: 'yes' });
                      }}
                      className="px-4 py-2 rounded-lg border border-blue-600 text-blue-300 text-sm hover:bg-blue-900/20 transition-colors"
                    >
                      Add them now
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ footprintOffered: 'not_sure' })}
                      className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm hover:border-gray-500 transition-colors"
                    >
                      I'm not sure
                    </button>
                  </div>
                  {details.footprintOffered === 'yes' && !footprintAssetId && (
                    <p className="text-xs text-gray-400">
                      The shares will be added to your Financial Footprint when you save this benefit.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>,
      )}

      {/* Reported Value */}
      {renderCollapsible(
        'reportedValue',
        'Approximate Current Value',
        <Info className="w-5 h-5" />,
        <ReportedValueSection
          value={details.reportedValue}
          onChange={(rv) => update({ reportedValue: rv })}
        />,
      )}

      {/* Vesting — only for units and options */}
      {(isUnits || isStockOption) && renderCollapsible(
        'vesting',
        'Vesting',
        <Calendar className="w-5 h-5" />,
        <VestingSection
          status={details.vestingStatus}
          dates={details.vestingDates || []}
          onStatusChange={(s) => update({ vestingStatus: s })}
          onDatesChange={(d) => update({ vestingDates: d })}
        />,
      )}

      {/* Stock Option specifics */}
      {isStockOption && renderCollapsible(
        'stockOptions',
        'Stock Option Details',
        <Briefcase className="w-5 h-5" />,
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Do you know when these options expire if you don't use them?</label>
            <div className="flex flex-wrap gap-2">
              {optionExpiryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    update({
                      optionExpiryStatus: opt.value,
                      optionExpiryDate: opt.value === 'known' ? details.optionExpiryDate || '' : undefined,
                    })
                  }
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    (details.optionExpiryStatus || 'unknown') === opt.value
                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {details.optionExpiryStatus === 'known' && (
            <div>
              <label className={labelClass}>When do they expire?</label>
              <input
                type="text"
                value={details.optionExpiryDate || ''}
                onChange={(e) => update({ optionExpiryDate: e.target.value })}
                placeholder="e.g., June 30, 2031"
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Does your statement show how many options you currently have? (optional)</label>
            <input
              type="number"
              value={details.optionCount ?? ''}
              onChange={(e) => update({ optionCount: Number(e.target.value) || undefined })}
              placeholder="Number of options"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Does your statement show the exercise/strike price? (optional)</label>
            <input
              type="number"
              value={details.exercisePrice ?? ''}
              onChange={(e) => update({ exercisePrice: Number(e.target.value) || undefined })}
              placeholder="$ per share"
              className={inputClass}
            />
          </div>
        </div>,
      )}

      {/* Executive / Deferred: Currently receiving payments */}
      {isExecutive && renderCollapsible(
        'payments',
        'Currently Receiving Payments',
        <FileText className="w-5 h-5" />,
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Are you currently receiving payments from this arrangement?</label>
            <div className="flex flex-wrap gap-2">
              {paymentStatusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    update({
                      currentlyReceiving: {
                        ...(details.currentlyReceiving || {}),
                        status: opt.value,
                      },
                    })
                  }
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    (details.currentlyReceiving?.status || 'not_receiving') === opt.value
                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {details.currentlyReceiving?.status === 'receiving' && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Approximately how much are you receiving?</label>
                <input
                  type="number"
                  value={details.currentlyReceiving.amount ?? ''}
                  onChange={(e) =>
                    update({
                      currentlyReceiving: {
                        ...details.currentlyReceiving!,
                        amount: Number(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="$"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Frequency</label>
                <select
                  value={details.currentlyReceiving.frequency || ''}
                  onChange={(e) =>
                    update({
                      currentlyReceiving: {
                        ...details.currentlyReceiving!,
                        frequency: e.target.value as 'monthly' | 'annual' | 'other' | '',
                      },
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Select frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>,
      )}

      {/* Change of Employment */}
      {renderCollapsible(
        'termination',
        'Change of Employment',
        <Building2 className="w-5 h-5" />,
        <TerminationSection
          rules={details.termination}
          onChange={(t) => update({ termination: t })}
        />,
      )}

      {/* Death / Incapacity */}
      {renderCollapsible(
        'deathIncapacity',
        'Death or Incapacity',
        <Heart className="w-5 h-5" />,
        <DeathIncapacitySection
          rules={details.deathIncapacity}
          onChange={(d) => update({ deathIncapacity: d })}
        />,
      )}

      {/* Beneficiary */}
      {renderCollapsible(
        'beneficiary',
        'Beneficiary / Recipient',
        <Users className="w-5 h-5" />,
        <BeneficiarySection
          beneficiary={details.beneficiary}
          onChange={(b) => update({ beneficiary: b })}
          peopleOptions={peopleOptions}
        />,
      )}

      {/* Family Readiness */}
      {renderCollapsible(
        'familyReadiness',
        'Family-Readiness Check',
        <CheckCircle2 className="w-5 h-5" />,
        <div className="space-y-4">
          <div className={subSectionCard}>
            <div className="text-sm text-gray-300 space-y-1">
              <div><span className="text-gray-500">Plan:</span> {details.planName || benefitTypeLabel}</div>
              <div><span className="text-gray-500">Employer:</span> {employerName}</div>
              {administratorName && <div><span className="text-gray-500">Administrator:</span> {administratorName}</div>}
              {documentLocationLabel && <div><span className="text-gray-500">Documents:</span> {documentLocationLabel}</div>}
            </div>
          </div>
          <div>
            <label className={labelClass}>
              If your family needed to deal with this benefit, is the information above enough to help them get started?
            </label>
            {renderYesNo(
              details.familyReadinessConfirmed,
              (v) => update({ familyReadinessConfirmed: v as 'yes' | 'no' | 'not_sure' }),
            )}
          </div>
        </div>,
      )}

      {/* Notes */}
      {renderCollapsible(
        'notes',
        'Additional Notes',
        <FileText className="w-5 h-5" />,
        <div>
          <label className={labelClass}>Anything else someone stepping in should know? (optional)</label>
          <textarea
            value={details.notes || ''}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="e.g., Options must be exercised within 90 days of termination. Unvested RSUs may forfeit on death."
            rows={3}
            className={inputClass}
          />
        </div>,
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReportedValueSection({
  value,
  onChange,
}: {
  value: ReportedValue | undefined;
  onChange: (rv: ReportedValue) => void;
}) {
  const rv = value || { hasReportedValue: 'not_sure' };
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Does your latest statement show an approximate current value?</label>
        <div className="flex flex-wrap gap-2">
          {yesNoOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...rv, hasReportedValue: opt.value as 'yes' | 'no' | 'not_sure' })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                rv.hasReportedValue === opt.value
                  ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {rv.hasReportedValue === 'yes' && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>What value does it show?</label>
            <input
              type="number"
              value={rv.amount ?? ''}
              onChange={(e) => onChange({ ...rv, amount: Number(e.target.value) || undefined })}
              placeholder="$"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>When was that value from?</label>
            <input
              type="text"
              value={rv.statementDate || ''}
              onChange={(e) => onChange({ ...rv, statementDate: e.target.value })}
              placeholder="e.g., June 2026"
              className={inputClass}
            />
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500">
        This is stored as a reported/statement value, not automatically as a balance-sheet market value.
      </p>
    </div>
  );
}

function VestingSection({
  status,
  dates,
  onStatusChange,
  onDatesChange,
}: {
  status: VestingStatus | undefined;
  dates: VestingDate[];
  onStatusChange: (s: VestingStatus) => void;
  onDatesChange: (d: VestingDate[]) => void;
}) {
  const showVestingDates = status === 'partly_vested' || status === 'not_vested';
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Have you earned the full right to this benefit yet?</label>
        <div className="grid grid-cols-1 gap-2">
          {vestingOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                status === opt.value
                  ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {showVestingDates && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Do you know when the next portion becomes yours?</label>
            <div className="space-y-2">
              {dates.map((vd, i) => (
                <div key={vd.id} className="flex gap-2">
                  <input
                    type="text"
                    value={vd.date || ''}
                    onChange={(e) => {
                      const next = [...dates];
                      next[i] = { ...vd, date: e.target.value };
                      onDatesChange(next);
                    }}
                    placeholder="e.g., March 2027"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => onDatesChange(dates.filter((_, idx) => idx !== i))}
                    className="px-3 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onDatesChange([...dates, { id: generateVestingDateId() }])}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                + Add another important vesting date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TerminationSection({
  rules,
  onChange,
}: {
  rules: EquityTerminationRules | undefined;
  onChange: (t: EquityTerminationRules) => void;
}) {
  const r = rules || { leavingChangesBenefit: 'not_sure', hasDeadlineOrRule: 'not_sure' };
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Could leaving this employer change what happens to this benefit?</label>
        <div className="flex flex-wrap gap-2">
          {yesNoOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...r, leavingChangesBenefit: opt.value as 'yes' | 'no' | 'not_sure' })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                r.leavingChangesBenefit === opt.value
                  ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {r.leavingChangesBenefit === 'yes' && (
        <>
          <div>
            <label className={labelClass}>Do you know whether there is a deadline or special rule after leaving?</label>
            <div className="flex flex-wrap gap-2">
              {yesNoOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...r, hasDeadlineOrRule: opt.value as 'yes' | 'no' | 'not_sure' })}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    r.hasDeadlineOrRule === opt.value
                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {r.hasDeadlineOrRule === 'yes' && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Deadline or date (if known)</label>
                <input
                  type="text"
                  value={r.deadline || ''}
                  onChange={(e) => onChange({ ...r, deadline: e.target.value })}
                  placeholder="e.g., 90 days after leaving"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Short note (optional)</label>
                <textarea
                  value={r.notes || ''}
                  onChange={(e) => onChange({ ...r, notes: e.target.value })}
                  placeholder="Describe the rule in your own words"
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DeathIncapacitySection({
  rules,
  onChange,
}: {
  rules: EquityDeathIncapacityRules | undefined;
  onChange: (d: EquityDeathIncapacityRules) => void;
}) {
  const d = rules || { hasSpecialRules: 'not_sure' };
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>
          Do you know whether this benefit has special rules if you die or become unable to manage your affairs?
        </label>
        <div className="flex flex-wrap gap-2">
          {yesNoOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...d, hasSpecialRules: opt.value as 'yes' | 'no' | 'not_sure' })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                d.hasSpecialRules === opt.value
                  ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {d.hasSpecialRules === 'yes' && (
        <div>
          <label className={labelClass}>What do you understand happens?</label>
          <p className="text-xs text-gray-500 mb-2">
            Examples: awards vest, awards are cancelled, options must be exercised within a certain period,
            payment goes to estate/beneficiary, administrator must be contacted.
          </p>
          <textarea
            value={d.notes || ''}
            onChange={(e) => onChange({ ...d, notes: e.target.value })}
            placeholder="Describe what you understand happens in your own words"
            rows={3}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}

const beneficiaryAllowedOptions: Array<{ value: BeneficiaryDesignationAllowed; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "I'm not sure" },
];

function BeneficiarySection({
  beneficiary,
  onChange,
  peopleOptions,
}: {
  beneficiary: EquityBeneficiary | undefined;
  onChange: (b: EquityBeneficiary) => void;
  peopleOptions: Array<{ id: string; name: string }>;
}) {
  const b = beneficiary || { beneficiaryDesignationAllowed: 'not_sure' as BeneficiaryDesignationAllowed };

  const handleAllowedChange = (allowed: BeneficiaryDesignationAllowed) => {
    if (allowed === 'yes') {
      onChange({ ...b, beneficiaryDesignationAllowed: allowed });
    } else {
      onChange({
        beneficiaryDesignationAllowed: allowed,
        beneficiaryType: undefined,
        beneficiaryPersonIds: undefined,
        beneficiaryOtherText: undefined,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Does this plan let you name someone to receive the benefit if you die?</label>
        <p className="text-xs text-gray-500 mb-3">
          This records your understanding. It is not a legal conclusion about the plan.
        </p>
        <div className="flex flex-wrap gap-2">
          {beneficiaryAllowedOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleAllowedChange(opt.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                (b.beneficiaryDesignationAllowed || 'not_sure') === opt.value
                  ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {b.beneficiaryDesignationAllowed === 'yes' && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Who is currently named?</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { value: 'person', label: 'A person' },
                { value: 'estate', label: 'Estate' },
                { value: 'other', label: 'Other' },
                { value: 'not_sure', label: "I'm not sure" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...b, beneficiaryType: opt.value as 'person' | 'estate' | 'other' | 'not_sure' })}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    b.beneficiaryType === opt.value
                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {b.beneficiaryType === 'person' && (
            <div>
              <label className={labelClass}>Select person</label>
              <div className="space-y-1.5">
                {peopleOptions.length === 0 && (
                  <p className="text-xs text-gray-500">No people available. Please complete the About You section first.</p>
                )}
                {peopleOptions.map((person) => {
                  const selected = (b.beneficiaryPersonIds || []).includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => {
                        const current = b.beneficiaryPersonIds || [];
                        const next = selected
                          ? current.filter((id) => id !== person.id)
                          : [...current, person.id];
                        onChange({ ...b, beneficiaryPersonIds: next });
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                          : 'border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {person.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {b.beneficiaryType === 'other' && (
            <div>
              <label className={labelClass}>Please describe</label>
              <input
                type="text"
                value={b.beneficiaryOtherText || ''}
                onChange={(e) => onChange({ ...b, beneficiaryOtherText: e.target.value })}
                placeholder="Describe the beneficiary"
                className={inputClass}
              />
            </div>
          )}
          <p className="text-xs text-gray-500">
            We record who is named. We do not confirm whether the designation is legally effective.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Equity Issuer / Cross-Border Section ─────────────────────────────────────

function EquityIssuerSection({
  issuer,
  employerName,
  onChange,
}: {
  issuer: EquityIssuerInfo | undefined;
  employerName: string;
  onChange: (issuer: EquityIssuerInfo) => void;
}) {
  const i = issuer || {};

  const update = (patch: Partial<EquityIssuerInfo>) => {
    onChange({ ...i, ...patch });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>
          Is the company whose shares this benefit relates to the same company as your employer ({employerName})?
        </label>
        <div className="flex flex-wrap gap-2">
          {issuerSameOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.value === 'yes') {
                  update({ issuerSameAsEmployer: opt.value, issuerCompanyName: undefined, issuerCompanyEntityId: undefined });
                } else {
                  update({ issuerSameAsEmployer: opt.value });
                }
              }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                (i.issuerSameAsEmployer || 'not_sure') === opt.value
                  ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {i.issuerSameAsEmployer === 'no' && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>What is the name of the company whose shares this benefit relates to?</label>
            <input
              type="text"
              value={i.issuerCompanyName || ''}
              onChange={(e) => update({ issuerCompanyName: e.target.value })}
              placeholder="e.g., ABC Corp."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Where is this company based?</label>
            <div className="flex flex-wrap gap-2">
              {employerCountryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ issuerCountry: opt.value })}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    (i.issuerCountry || 'not_sure') === opt.value
                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {i.issuerCountry === 'another_country' && (
            <div>
              <label className={labelClass}>Which country?</label>
              <input
                type="text"
                value={i.issuerOtherCountryName || ''}
                onChange={(e) => update({ issuerOtherCountryName: e.target.value })}
                placeholder="e.g., United Kingdom, Germany, Japan"
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {i.issuerSameAsEmployer === 'yes' && (
        <div>
          <label className={labelClass}>Where is {employerName} based?</label>
          <div className="flex flex-wrap gap-2">
            {employerCountryOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ issuerCountry: opt.value })}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  (i.issuerCountry || 'not_sure') === opt.value
                    ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {i.issuerCountry === 'another_country' && (
            <div className="mt-3">
              <input
                type="text"
                value={i.issuerOtherCountryName || ''}
                onChange={(e) => update({ issuerOtherCountryName: e.target.value })}
                placeholder="Which country?"
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Custody context */}
      <div>
        <label className={labelClass}>
          Where are the shares or this account held? (optional)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          This is about where the shares are administered or held, not where the company is based.
        </p>
        <select
          value={i.custodyContext || ''}
          onChange={(e) => update({ custodyContext: e.target.value as EquityIssuerInfo['custodyContext'] })}
          className={inputClass}
        >
          <option value="">Select if known</option>
          {custodyContextOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-500">
        We use this information to identify whether any cross-border review may be appropriate.
        This does not determine tax or legal treatment.
      </p>
    </div>
  );
}
