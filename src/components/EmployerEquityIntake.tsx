import { useState, useEffect } from 'react';
import {
  EquityCompensation,
  generateAssetId,
  EQUITY_AWARD_TYPES,
} from '../lib/financialAssetTypes';
import {
  inputClass,
  labelClass,
  sectionCardClass,
  OptionButton,
  ProgressBar,
  IntakeNav,
  SummaryCard,
  AddButton,
  DocumentLocationPicker,
} from './FinancialFootprintShared';

type Props = {
  assets: EquityCompensation[];
  onChange: (assets: EquityCompensation[]) => void;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  employers: Array<{ id: string; name: string }>;
  startSignal?: number;
  presetType?: string;
  presetOwnerIds?: string[];
  hideAddButton?: boolean;
  onSaved?: () => void;
  onCancelled?: () => void;
};

type Draft = Partial<EquityCompensation> & {
  hasEquity?: string;
  equityTypes?: string[];
  hasUnvested?: string;
  planTreatmentKnown?: string;
  payrollOngoing?: string;
  sharesInExistingAccount?: string;
};

function emptyDraft(): Draft {
  return {
    id: generateAssetId('eq'),
    category: 'employerEquity',
    awardType: '',
    ownerIds: [],
    currency: 'CAD',
  };
}

export default function EmployerEquityIntake({
  assets,
  onChange,
  client1Name,
  client2Name,
  hasSpouse,
  employers,
  startSignal,
  presetType,
  presetOwnerIds,
  hideAddButton,
  onSaved,
  onCancelled,
}: Props) {
  const [intakeActive, setIntakeActive] = useState(false);
  const [intakeStep, setIntakeStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (startSignal && startSignal > 0) {
      const d = { ...emptyDraft(), awardType: presetType || '' };
      if (presetOwnerIds) d.ownerIds = presetOwnerIds;
      setDraft(d);
      setEditingIndex(null);
      setIntakeStep(presetOwnerIds ? (presetType ? 2 : 0) : (presetType ? 1 : 0));
      setIntakeActive(true);
    }
  }, [startSignal]);

  const updateDraft = (field: keyof Draft, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const startNew = () => {
    setDraft(emptyDraft());
    setEditingIndex(null);
    setIntakeStep(0);
    setIntakeActive(true);
  };

  const startEdit = (index: number) => {
    setDraft({ ...assets[index] });
    setEditingIndex(index);
    setIntakeStep(0);
    setIntakeActive(true);
  };

  const cancelIntake = () => {
    setIntakeActive(false);
    setDraft(emptyDraft());
    setIntakeStep(0);
    setEditingIndex(null);
    onCancelled?.();
  };

  const saveDraft = () => {
    const clean: EquityCompensation = {
      id: draft.id || generateAssetId('eq'),
      category: 'employerEquity',
      subtype: draft.awardType || 'other',
      awardType: draft.awardType || '',
      ownerIds: draft.ownerIds || [],
      companyName: draft.companyName,
      quantity: draft.quantity,
      vestedQuantity: draft.vestedQuantity,
      unvestedQuantity: draft.unvestedQuantity,
      exercisePrice: draft.exercisePrice,
      expiryDate: draft.expiryDate,
      planTreatmentKnown: draft.planTreatmentKnown,
      planTreatmentNotes: draft.planTreatmentNotes,
      sharesHeldWhere: draft.sharesHeldWhere,
      payrollContributionsOngoing: draft.payrollContributionsOngoing,
      expectedSettlementDate: draft.expectedSettlementDate,
      payableStatus: draft.payableStatus,
      approximateValue: draft.approximateValue,
      valueUnknown: draft.valueUnknown,
      currency: draft.currency || 'CAD',
      contact: draft.contact,
      documentLocation: draft.documentLocation,
      notes: draft.notes,
    };
    if (editingIndex !== null) {
      const updated = [...assets];
      updated[editingIndex] = clean;
      onChange(updated);
    } else {
      onChange([...assets, clean]);
    }
    setIntakeActive(false);
    setDraft(emptyDraft());
    setIntakeStep(0);
    setEditingIndex(null);
    onSaved?.();
  };

  const deleteAsset = (index: number) => {
    onChange(assets.filter((_, i) => i !== index));
  };

  const isRSU = draft.awardType === 'rsu';
  const isStockOption = draft.awardType === 'stock_option';
  const isESPP = draft.awardType === 'espp';

  const questions = buildQuestions(
    draft,
    updateDraft,
    client1Name,
    client2Name,
    hasSpouse,
    isRSU,
    isStockOption,
    isESPP,
    employers,
  );

  const currentQuestion = questions[intakeStep];
  const isLastStep = intakeStep === questions.length - 1;
  const canProceed = currentQuestion?.canProceed() ?? false;

  if (intakeActive) {
    return (
      <div className="space-y-6">
        <ProgressBar current={intakeStep} total={questions.length} />
        <div className={sectionCardClass}>
          {currentQuestion.title && <h3 className="text-xl font-semibold text-white">{currentQuestion.title}</h3>}
          {currentQuestion.subtitle && <p className="text-sm text-gray-400">{currentQuestion.subtitle}</p>}
          <div className="pt-2">{currentQuestion.render()}</div>
        </div>
        <IntakeNav
          step={intakeStep}
          total={questions.length}
          isFirst={intakeStep === 0}
          isLast={isLastStep}
          canProceed={canProceed}
          onBack={intakeStep === 0 ? cancelIntake : () => setIntakeStep(intakeStep - 1)}
          onNext={() => (isLastStep ? saveDraft() : setIntakeStep(intakeStep + 1))}
          nextLabel={isLastStep ? 'Save' : 'Next'}
        />
      </div>
    );
  }

  const awardTypeLabel = (t: string) => EQUITY_AWARD_TYPES.find((o) => o.value === t)?.label || t;
  const ownerLabel = (ids: string[]) => {
    if (ids.includes('client2')) return client2Name;
    return client1Name;
  };

  return (
    <div className="space-y-5">
      {assets.length > 0 && (
        <div className="space-y-3">
          {assets.map((asset, i) => (
            <SummaryCard
              key={asset.id}
              title={`${awardTypeLabel(asset.awardType)}${asset.companyName ? ` — ${asset.companyName}` : ''}`}
              subtitle={ownerLabel(asset.ownerIds)}
              value={asset.approximateValue ? `Approximately ${asset.currency} ${asset.approximateValue}` : asset.quantity ? `${asset.quantity} units` : undefined}
              details={[
                ...(asset.unvestedQuantity ? [{ label: 'Unvested', value: asset.unvestedQuantity }] : []),
                ...(asset.exercisePrice ? [{ label: 'Exercise price', value: asset.exercisePrice }] : []),
                ...(asset.expiryDate ? [{ label: 'Expiry', value: asset.expiryDate }] : []),
              ]}
              onEdit={() => startEdit(i)}
              onDelete={() => deleteAsset(i)}
            />
          ))}
        </div>
      )}
      {!hideAddButton && <AddButton label="Add employer equity or compensation" onClick={startNew} />}
    </div>
  );
}

type Question = {
  title?: string;
  subtitle?: string;
  render: () => React.ReactNode;
  canProceed: () => boolean;
};

function buildQuestions(
  draft: Draft,
  updateDraft: (field: keyof Draft, value: unknown) => void,
  client1Name: string,
  client2Name: string,
  hasSpouse: boolean,
  isRSU: boolean,
  isStockOption: boolean,
  isESPP: boolean,
  employers: Array<{ id: string; name: string }>,
): Question[] {
  const questions: Question[] = [];

  // Q1: Award type
  questions.push({
    title: 'What type of equity or compensation is this?',
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {EQUITY_AWARD_TYPES.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={draft.awardType === opt.value}
            onClick={() => updateDraft('awardType', opt.value)}
          />
        ))}
      </div>
    ),
    canProceed: () => !!draft.awardType,
  });

  // Q2: Owner
  questions.push({
    title: 'Whose equity or compensation is this?',
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <OptionButton label={client1Name} selected={(draft.ownerIds || []).includes('client1')} onClick={() => updateDraft('ownerIds', ['client1'])} />
        {hasSpouse && <OptionButton label={client2Name} selected={(draft.ownerIds || []).includes('client2')} onClick={() => updateDraft('ownerIds', ['client2'])} />}
      </div>
    ),
    canProceed: () => (draft.ownerIds || []).length > 0,
  });

  // Q3: Company
  questions.push({
    title: 'Which company issued this?',
    subtitle: employers.length > 0 ? 'Select the employer or enter a new company.' : 'Enter the company name.',
    render: () => (
      <div className="space-y-3">
        {employers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {employers.map((emp) => (
              <OptionButton
                key={emp.id}
                label={emp.name}
                selected={draft.companyName === emp.name}
                onClick={() => updateDraft('companyName', emp.name)}
              />
            ))}
          </div>
        )}
        <input
          type="text"
          value={draft.companyName || ''}
          onChange={(e) => updateDraft('companyName', e.target.value)}
          placeholder="Enter company name"
          className={inputClass}
        />
      </div>
    ),
    canProceed: () => !!draft.companyName?.trim(),
  });

  // RSU-specific
  if (isRSU) {
    questions.push({
      title: 'Approximately how many RSUs are currently outstanding? (optional)',
      render: () => (
        <input
          type="text"
          value={draft.quantity || ''}
          onChange={(e) => updateDraft('quantity', e.target.value)}
          placeholder="Enter approximate number"
          className={inputClass}
        />
      ),
      canProceed: () => true,
    });

    questions.push({
      title: 'Do any of these RSUs remain unvested?',
      render: () => (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: "I'm not sure" },
          ].map((opt) => (
            <OptionButton key={opt.value} label={opt.label} selected={draft.hasUnvested === opt.value} onClick={() => updateDraft('hasUnvested', opt.value)} />
          ))}
        </div>
      ),
      canProceed: () => !!draft.hasUnvested,
    });

    if (draft.hasUnvested === 'yes') {
      questions.push({
        title: 'Approximately how many are unvested? (optional)',
        render: () => (
          <input
            type="text"
            value={draft.unvestedQuantity || ''}
            onChange={(e) => updateDraft('unvestedQuantity', e.target.value)}
            placeholder="Enter approximate number unvested"
            className={inputClass}
          />
        ),
        canProceed: () => true,
      });
    }

    questions.push({
      title: 'Do you know what happens to unvested RSUs if the holder dies or becomes unable to work?',
      render: () => (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: "I'm not sure" },
          ].map((opt) => (
            <OptionButton key={opt.value} label={opt.label} selected={draft.planTreatmentKnown === opt.value} onClick={() => updateDraft('planTreatmentKnown', opt.value)} />
          ))}
        </div>
      ),
      canProceed: () => !!draft.planTreatmentKnown,
    });

    if (draft.planTreatmentKnown === 'yes') {
      questions.push({
        title: 'What does the plan provide?',
        subtitle: 'We collect what the client believes the plan says — the system does not determine the treatment itself.',
        render: () => (
          <textarea
            value={draft.planTreatmentNotes || ''}
            onChange={(e) => updateDraft('planTreatmentNotes', e.target.value)}
            placeholder="Describe what happens to unvested RSUs on death or disability"
            rows={3}
            className={inputClass}
          />
        ),
        canProceed: () => true,
      });
    }
  }

  // Stock option-specific
  if (isStockOption) {
    questions.push({
      title: 'Approximately how many options are outstanding? (optional)',
      render: () => (
        <input
          type="text"
          value={draft.quantity || ''}
          onChange={(e) => updateDraft('quantity', e.target.value)}
          placeholder="Enter approximate number"
          className={inputClass}
        />
      ),
      canProceed: () => true,
    });

    questions.push({
      title: 'How many are vested vs. unvested? (optional)',
      render: () => (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Vested</label>
            <input type="text" value={draft.vestedQuantity || ''} onChange={(e) => updateDraft('vestedQuantity', e.target.value)} placeholder="Vested" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Unvested</label>
            <input type="text" value={draft.unvestedQuantity || ''} onChange={(e) => updateDraft('unvestedQuantity', e.target.value)} placeholder="Unvested" className={inputClass} />
          </div>
        </div>
      ),
      canProceed: () => true,
    });

    questions.push({
      title: 'Exercise price (if known, optional)',
      render: () => (
        <input
          type="text"
          value={draft.exercisePrice || ''}
          onChange={(e) => updateDraft('exercisePrice', e.target.value)}
          placeholder="Enter exercise price per share"
          className={inputClass}
        />
      ),
      canProceed: () => true,
    });

    questions.push({
      title: 'Expiry date (if known, optional)',
      render: () => (
        <input
          type="text"
          value={draft.expiryDate || ''}
          onChange={(e) => updateDraft('expiryDate', e.target.value)}
          placeholder="e.g., December 2030, or 90 days after termination"
          className={inputClass}
        />
      ),
      canProceed: () => true,
    });

    questions.push({
      title: 'Do you know whether death, disability, retirement or termination changes the time available to exercise these options?',
      render: () => (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: "I'm not sure" },
          ].map((opt) => (
            <OptionButton key={opt.value} label={opt.label} selected={draft.planTreatmentKnown === opt.value} onClick={() => updateDraft('planTreatmentKnown', opt.value)} />
          ))}
        </div>
      ),
      canProceed: () => !!draft.planTreatmentKnown,
    });

    if (draft.planTreatmentKnown === 'yes') {
      questions.push({
        title: 'What should someone know?',
        render: () => (
          <textarea
            value={draft.planTreatmentNotes || ''}
            onChange={(e) => updateDraft('planTreatmentNotes', e.target.value)}
            placeholder="Describe what happens to options on death, disability, retirement or termination"
            rows={3}
            className={inputClass}
          />
        ),
        canProceed: () => true,
      });
    }
  }

  // PSU / DSU / deferred comp — simpler shared intake
  if (draft.awardType === 'psu' || draft.awardType === 'dsu' || draft.awardType === 'deferred_comp' || draft.awardType === 'other') {
    questions.push({
      title: 'Approximate number or value (optional)',
      render: () => (
        <div className="space-y-3">
          <input
            type="text"
            value={draft.quantity || ''}
            onChange={(e) => updateDraft('quantity', e.target.value)}
            placeholder="Enter approximate number of units or value"
            className={inputClass}
          />
          <div>
            <label className={labelClass}>Vested / payable status (optional)</label>
            <input
              type="text"
              value={draft.payableStatus || ''}
              onChange={(e) => updateDraft('payableStatus', e.target.value)}
              placeholder="e.g., Vested, payable in 2027"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Expected payment or settlement date (optional)</label>
            <input
              type="text"
              value={draft.expectedSettlementDate || ''}
              onChange={(e) => updateDraft('expectedSettlementDate', e.target.value)}
              placeholder="e.g., March 2028"
              className={inputClass}
            />
          </div>
        </div>
      ),
      canProceed: () => true,
    });
  }

  // ESPP-specific
  if (isESPP) {
    questions.push({
      title: 'Are payroll contributions ongoing?',
      render: () => (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: "I'm not sure" },
          ].map((opt) => (
            <OptionButton key={opt.value} label={opt.label} selected={draft.payrollContributionsOngoing === opt.value} onClick={() => updateDraft('payrollContributionsOngoing', opt.value)} />
          ))}
        </div>
      ),
      canProceed: () => !!draft.payrollContributionsOngoing,
    });

    questions.push({
      title: 'Where are the shares held?',
      subtitle: 'If the shares sit in a brokerage account already captured, link to that account instead.',
      render: () => (
        <input
          type="text"
          value={draft.sharesHeldWhere || ''}
          onChange={(e) => updateDraft('sharesHeldWhere', e.target.value)}
          placeholder="e.g., Brokerage account at TD, or link to existing investment account"
          className={inputClass}
        />
      ),
      canProceed: () => true,
    });

    questions.push({
      title: 'Approximate current value (optional)',
      render: () => (
        <div className="flex gap-3">
          <select
            value={draft.currency || 'CAD'}
            onChange={(e) => updateDraft('currency', e.target.value)}
            className="w-28 px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg"
          >
            <option value="CAD">CAD</option>
            <option value="USD">USD</option>
          </select>
          <input
            type="text"
            value={draft.approximateValue || ''}
            onChange={(e) => updateDraft('approximateValue', e.target.value)}
            placeholder="Enter approximate value"
            className={inputClass}
          />
        </div>
      ),
      canProceed: () => true,
    });
  }

  // Employer shares — approximate value
  if (draft.awardType === 'employer_shares') {
    questions.push({
      title: 'Approximate current value (optional)',
      render: () => (
        <div className="flex gap-3">
          <select
            value={draft.currency || 'CAD'}
            onChange={(e) => updateDraft('currency', e.target.value)}
            className="w-28 px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg"
          >
            <option value="CAD">CAD</option>
            <option value="USD">USD</option>
          </select>
          <input
            type="text"
            value={draft.approximateValue || ''}
            onChange={(e) => updateDraft('approximateValue', e.target.value)}
            placeholder="Enter approximate value"
            className={inputClass}
          />
        </div>
      ),
      canProceed: () => true,
    });
  }

  // Plan administrator / broker contact
  questions.push({
    title: 'Plan administrator or broker (optional)',
    render: () => (
      <div className="space-y-3">
        <input
          type="text"
          value={draft.contact?.contactName || ''}
          onChange={(e) => updateDraft('contact', { ...draft.contact, contactName: e.target.value })}
          placeholder="Plan administrator or broker name"
          className={inputClass}
        />
        <input
          type="text"
          value={draft.contact?.contactFirm || ''}
          onChange={(e) => updateDraft('contact', { ...draft.contact, contactFirm: e.target.value })}
          placeholder="Firm or platform (e.g., Computershare, E*Trade)"
          className={inputClass}
        />
      </div>
    ),
    canProceed: () => true,
  });

  // Document location
  questions.push({
    title: 'Where is the award or plan information kept?',
    render: () => (
      <DocumentLocationPicker
        value={draft.documentLocation?.accessMethod || ''}
        otherValue={draft.documentLocation?.accessMethodOther}
        locationValue={draft.documentLocation?.location || ''}
        locationOtherValue={draft.documentLocation?.locationOther}
        onAccessMethodChange={(v) => updateDraft('documentLocation', { ...draft.documentLocation, accessMethod: v })}
        onAccessMethodOtherChange={(v) => updateDraft('documentLocation', { ...draft.documentLocation, accessMethodOther: v })}
        onLocationChange={(v) => updateDraft('documentLocation', { ...draft.documentLocation, location: v })}
        onLocationOtherChange={(v) => updateDraft('documentLocation', { ...draft.documentLocation, locationOther: v })}
      />
    ),
    canProceed: () => true,
  });

  // Notes
  questions.push({
    title: 'Anything someone stepping in should know? (optional)',
    render: () => (
      <textarea
        value={draft.notes || ''}
        onChange={(e) => updateDraft('notes', e.target.value)}
        placeholder="e.g., Options must be exercised within 90 days of termination. Unvested RSUs forfeit on death."
        rows={3}
        className={inputClass}
      />
    ),
    canProceed: () => true,
  });

  return questions;
}
