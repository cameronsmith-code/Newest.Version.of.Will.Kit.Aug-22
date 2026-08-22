import { Pencil, Plus, Trash2 } from 'lucide-react';

export const inputClass =
  'w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

export const labelClass =
  'block text-sm font-medium text-gray-300 mb-2';

export const sectionCardClass =
  'bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4';

export const summaryCardClass =
  'bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 transition-all hover:border-gray-600';

export const subtleTextClass = 'text-xs italic text-gray-400 mb-2';

type OptionButtonProps = {
  label: string;
  selected?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
};

export function OptionButton({
  label,
  selected,
  onClick,
  icon,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left w-full ${
        selected
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
      }`}
    >
      {icon && <span className="flex-shrink-0 opacity-60">{icon}</span>}
      {label}
    </button>
  );
}

type YesNoCardProps = {
  selectedValue: string;
  onClick: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
};

export function YesNoCard({
  selectedValue,
  onClick,
  options = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'not_sure', label: "I'm not sure" },
  ],
}: YesNoCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {options.map((opt) => (
        <OptionButton
          key={opt.value}
          label={opt.label}
          selected={selectedValue === opt.value}
          onClick={() => onClick(opt.value)}
        />
      ))}
    </div>
  );
}

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </>
  );
}

type IntakeNavProps = {
  step: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
};

export function IntakeNav({
  step,
  total,
  isFirst,
  isLast,
  canProceed,
  onBack,
  onNext,
  nextLabel,
  backLabel,
}: IntakeNavProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Question {step + 1} of {total}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 text-gray-400 hover:text-gray-200 font-medium transition-colors"
        >
          {isFirst ? (backLabel || 'Cancel') : 'Back'}
        </button>
        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLast ? (nextLabel || 'Save') : 'Next'}
        </button>
      </div>
    </div>
  );
}

type SectionHeadingProps = {
  label: string;
  icon?: React.ReactNode;
};

export function SectionHeading({ label, icon }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
      <h3 className="text-sm font-semibold tracking-widest text-blue-400 uppercase whitespace-nowrap flex items-center gap-2">
        {icon}
        {label}
      </h3>
      <div className="h-px flex-1 bg-gradient-to-l from-blue-500/50 to-transparent" />
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  subtitle?: string;
  value?: string;
  details?: Array<{ label: string; value: string }>;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function SummaryCard({
  title,
  subtitle,
  value,
  details,
  onEdit,
  onDelete,
}: SummaryCardProps) {
  return (
    <div className={summaryCardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {value && <p className="text-sm text-blue-400 mt-1">{value}</p>}
          {details && details.length > 0 && (
            <div className="mt-2 space-y-1">
              {details.map((d, i) => (
                <div key={i} className="text-xs text-gray-400">
                  <span className="text-gray-500">{d.label}:</span> {d.value}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
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
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type AddButtonProps = {
  label: string;
  onClick: () => void;
};

export function AddButton({ label, onClick }: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-3 bg-gray-800 border border-gray-600 hover:border-blue-500 text-gray-300 hover:text-white rounded-xl font-medium transition-all w-full sm:w-auto"
    >
      <Plus className="w-5 h-5" />
      {label}
    </button>
  );
}

type DocumentLocationPickerProps = {
  value: string;
  otherValue?: string;
  locationValue?: string;
  locationOtherValue?: string;
  onAccessMethodChange: (value: string) => void;
  onAccessMethodOtherChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onLocationOtherChange: (value: string) => void;
};

export function DocumentLocationPicker({
  value,
  otherValue,
  locationValue,
  locationOtherValue,
  onAccessMethodChange,
  onAccessMethodOtherChange,
  onLocationChange,
  onLocationOtherChange,
}: DocumentLocationPickerProps) {
  const accessOptions = [
    { value: 'online', label: 'Online statements' },
    { value: 'paper', label: 'Paper statements' },
    { value: 'advisor', label: 'Through our financial advisor' },
    { value: 'other', label: 'Other' },
    { value: 'not_sure', label: "I'm not sure" },
  ];

  const locationOptions = [
    { value: 'home_office', label: 'Home office' },
    { value: 'safety_deposit', label: 'Safety deposit box' },
    { value: 'fireproof_box', label: 'Fireproof box' },
    { value: 'with_advisor', label: 'With financial advisor' },
    { value: 'with_lawyer', label: 'With lawyer' },
    { value: 'digital', label: 'Digital / password manager' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>How would someone find information about this account if they needed it?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {accessOptions.map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              selected={value === opt.value}
              onClick={() => onAccessMethodChange(opt.value)}
            />
          ))}
        </div>
      </div>
      {value === 'other' && (
        <div>
          <label className={labelClass}>Please specify</label>
          <input
            type="text"
            value={otherValue || ''}
            onChange={(e) => onAccessMethodOtherChange(e.target.value)}
            placeholder="Describe how someone would find this information"
            className={inputClass}
          />
        </div>
      )}
      <div>
        <label className={labelClass}>Where are the statements or access instructions kept?</label>
        <p className={subtleTextClass}>Store only the location — never the password itself.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {locationOptions.map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              selected={locationValue === opt.value}
              onClick={() => onLocationChange(opt.value)}
            />
          ))}
        </div>
      </div>
      {locationValue === 'other' && (
        <div>
          <label className={labelClass}>Please specify</label>
          <input
            type="text"
            value={locationOtherValue || ''}
            onChange={(e) => onLocationOtherChange(e.target.value)}
            placeholder="Describe where it's kept"
            className={inputClass}
          />
        </div>
      )}
      {(value === 'online' || value === 'other') && !locationValue && (
        <p className={subtleTextClass}>
          If access is online, note where the login instructions are kept (e.g., password manager, written instructions in home office).
        </p>
      )}
    </div>
  );
}

type OwnerSelectorProps = {
  value: string[];
  onChange: (value: string[]) => void;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  allowJoint?: boolean;
  allowOther?: boolean;
  singleSelect?: boolean;
};

export function OwnerSelector({
  value,
  onChange,
  client1Name,
  client2Name,
  hasSpouse,
  allowJoint = true,
  allowOther = true,
  singleSelect = false,
}: OwnerSelectorProps) {
  const toggle = (owner: string) => {
    if (singleSelect) {
      onChange([owner]);
      return;
    }
    if (value.includes(owner)) {
      onChange(value.filter((v) => v !== owner));
    } else {
      onChange([...value, owner]);
    }
  };

  const options: Array<{ value: string; label: string }> = [
    { value: 'client1', label: client1Name },
  ];
  if (hasSpouse) {
    options.push({ value: 'client2', label: client2Name });
    if (allowJoint) {
      options.push({ value: 'joint', label: 'Joint' });
    }
  }
  if (allowOther) {
    options.push({ value: 'other', label: 'Other' });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {options.map((opt) => (
        <OptionButton
          key={opt.value}
          label={opt.label}
          selected={value.includes(opt.value)}
          onClick={() => toggle(opt.value)}
        />
      ))}
    </div>
  );
}
