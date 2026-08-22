import { useState, useEffect } from 'react';
import {
  PensionRecord,
  generateAssetId,
  PENSION_TYPES,
} from '../lib/financialAssetTypes';
import {
  inputClass,
  labelClass,
  sectionCardClass,
  subtleTextClass,
  OptionButton,
  ProgressBar,
  IntakeNav,
  SummaryCard,
  AddButton,
  DocumentLocationPicker,
} from './FinancialFootprintShared';

type Props = {
  assets: PensionRecord[];
  onChange: (assets: PensionRecord[]) => void;
  allAnswers?: Map<string, Record<string, unknown>>;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  knownIndividuals: Array<{ id: string; name: string; relationship: string }>;
  institutions: Array<{ id: string; name: string }>;
  startSignal?: number;
  presetType?: string;
  presetOwnerIds?: string[];
  hideAddButton?: boolean;
  onSaved?: () => void;
  onCancelled?: () => void;
};

type Draft = Partial<PensionRecord> & {
  hasPension?: string;
  pensionTypes?: string[];
  hasEstimate?: string;
  hasSurvivorBenefit?: string;
};

function emptyDraft(): Draft {
  return {
    id: generateAssetId('pen'),
    category: 'pension',
    pensionType: '',
    ownerIds: [],
    currency: 'CAD',
  };
}

export default function PensionsIntake({
  assets,
  onChange,
  client1Name,
  client2Name,
  hasSpouse,
  knownIndividuals,
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
      const d = { ...emptyDraft(), pensionType: presetType || '' };
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
    const clean: PensionRecord = {
      id: draft.id || generateAssetId('pen'),
      category: 'pension',
      subtype: draft.pensionType || 'other',
      pensionType: draft.pensionType || '',
      ownerIds: draft.ownerIds || [],
      employer: draft.employer,
      planName: draft.planName,
      institutionName: draft.institutionName,
      institutionId: draft.institutionId,
      memberStatus: draft.memberStatus,
      estimatedPensionAmount: draft.estimatedPensionAmount,
      pensionFrequency: draft.pensionFrequency,
      expectedStartAge: draft.expectedStartAge,
      currentPensionAmount: draft.currentPensionAmount,
      hasSurvivorBenefit: draft.hasSurvivorBenefit,
      survivorPersonId: draft.survivorPersonId,
      survivorPersonName: draft.survivorPersonName,
      planProvider: draft.planProvider,
      planAdministrator: draft.planAdministrator,
      memberReference: draft.memberReference,
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

  const isDB = draft.pensionType === 'db';
  const isDC = draft.pensionType === 'dc';

  const questions = buildQuestions(
    draft,
    updateDraft,
    client1Name,
    client2Name,
    hasSpouse,
    isDB,
    isDC,
    knownIndividuals,
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
          nextLabel={isLastStep ? 'Save Pension' : 'Next'}
        />
      </div>
    );
  }

  const pensionTypeLabel = (t: string) => PENSION_TYPES.find((o) => o.value === t)?.label || t;
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
              title={asset.planName || pensionTypeLabel(asset.pensionType)}
              subtitle={`${ownerLabel(asset.ownerIds)}${asset.employer ? ` — ${asset.employer}` : ''}`}
              value={
                isDB && asset.id === asset.id
                  ? asset.memberStatus === 'receiving'
                    ? `Currently receiving ${asset.currentPensionAmount || ''} ${asset.pensionFrequency || ''}`
                    : asset.estimatedPensionAmount
                      ? `Estimated ${asset.estimatedPensionAmount} ${asset.pensionFrequency || ''}`
                      : undefined
                  : asset.approximateValue
                    ? `Approximately ${asset.currency} ${asset.approximateValue}`
                    : undefined
              }
              details={[
                ...(asset.hasSurvivorBenefit === 'yes' && asset.survivorPersonName ? [{ label: 'Survivor benefit', value: asset.survivorPersonName }] : []),
                ...(asset.planProvider ? [{ label: 'Plan provider', value: asset.planProvider }] : []),
              ]}
              onEdit={() => startEdit(i)}
              onDelete={() => deleteAsset(i)}
            />
          ))}
        </div>
      )}
      {!hideAddButton && <AddButton label="Add a pension or workplace retirement plan" onClick={startNew} />}
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
  isDB: boolean,
  isDC: boolean,
  knownIndividuals: Array<{ id: string; name: string; relationship: string }>,
): Question[] {
  const questions: Question[] = [];

  // Q1: Owner / member
  questions.push({
    title: 'Whose pension or retirement plan is this?',
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <OptionButton label={client1Name} selected={(draft.ownerIds || []).includes('client1')} onClick={() => updateDraft('ownerIds', ['client1'])} />
        {hasSpouse && <OptionButton label={client2Name} selected={(draft.ownerIds || []).includes('client2')} onClick={() => updateDraft('ownerIds', ['client2'])} />}
      </div>
    ),
    canProceed: () => (draft.ownerIds || []).length > 0,
  });

  // Q2: Pension type
  questions.push({
    title: 'What kind of pension or retirement plan is it?',
    subtitle: 'Select all that apply if there are multiple plans.',
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PENSION_TYPES.map((opt) => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            selected={draft.pensionType === opt.value}
            onClick={() => updateDraft('pensionType', opt.value)}
          />
        ))}
      </div>
    ),
    canProceed: () => !!draft.pensionType,
  });

  // Q3: Employer
  questions.push({
    title: 'Who provides the pension?',
    subtitle: 'This is the employer or organization sponsoring the plan.',
    render: () => (
      <input
        type="text"
        value={draft.employer || ''}
        onChange={(e) => updateDraft('employer', e.target.value)}
        placeholder="Enter employer or plan sponsor name"
        className={inputClass}
      />
    ),
    canProceed: () => !!draft.employer?.trim(),
  });

  // Q4: Plan name (optional)
  questions.push({
    title: 'What is the pension plan called? (optional)',
    render: () => (
      <input
        type="text"
        value={draft.planName || ''}
        onChange={(e) => updateDraft('planName', e.target.value)}
        placeholder="e.g., Registered Pension Plan — ABC Corp"
        className={inputClass}
      />
    ),
    canProceed: () => true,
  });

  // DB-specific questions
  if (isDB) {
    // Q5: Member status
    questions.push({
      title: 'Is the member currently:',
      render: () => (
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { value: 'active', label: 'Active member' },
            { value: 'deferred', label: 'Deferred / former member' },
            { value: 'receiving', label: 'Receiving pension' },
            { value: 'unknown', label: "I'm not sure" },
          ].map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              selected={draft.memberStatus === opt.value}
              onClick={() => updateDraft('memberStatus', opt.value)}
            />
          ))}
        </div>
      ),
      canProceed: () => !!draft.memberStatus,
    });

    // Q6: Estimate (active/deferred) or current amount (receiving)
    if (draft.memberStatus === 'active' || draft.memberStatus === 'deferred') {
      questions.push({
        title: 'Do you have an estimate of the pension the member is expected to receive?',
        render: () => (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'not_sure', label: "I'm not sure" },
            ].map((opt) => (
              <OptionButton
                key={opt.value}
                label={opt.label}
                selected={draft.hasEstimate === opt.value}
                onClick={() => updateDraft('hasEstimate', opt.value)}
              />
            ))}
          </div>
        ),
        canProceed: () => !!draft.hasEstimate,
      });

      if (draft.hasEstimate === 'yes') {
        questions.push({
          title: 'Estimated pension amount',
          render: () => (
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={draft.estimatedPensionAmount || ''}
                  onChange={(e) => updateDraft('estimatedPensionAmount', e.target.value)}
                  placeholder="Enter estimated amount"
                  className={inputClass}
                />
                <select
                  value={draft.pensionFrequency || ''}
                  onChange={(e) => updateDraft('pensionFrequency', e.target.value)}
                  className="w-32 px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg"
                >
                  <option value="">Frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Expected start age or date (optional)</label>
                <input
                  type="text"
                  value={draft.expectedStartAge || ''}
                  onChange={(e) => updateDraft('expectedStartAge', e.target.value)}
                  placeholder="e.g., Age 65, or January 2030"
                  className={inputClass}
                />
              </div>
            </div>
          ),
          canProceed: () => !!draft.estimatedPensionAmount?.trim(),
        });
      }
    } else if (draft.memberStatus === 'receiving') {
      questions.push({
        title: 'Current pension amount',
        render: () => (
          <div className="flex gap-3">
            <input
              type="text"
              value={draft.currentPensionAmount || ''}
              onChange={(e) => updateDraft('currentPensionAmount', e.target.value)}
              placeholder="Enter current pension amount"
              className={inputClass}
            />
            <select
              value={draft.pensionFrequency || ''}
              onChange={(e) => updateDraft('pensionFrequency', e.target.value)}
              className="w-32 px-3 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg"
            >
              <option value="">Frequency</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        ),
        canProceed: () => !!draft.currentPensionAmount?.trim(),
      });
    }

    // Q7: Survivor benefit
    questions.push({
      title: 'Is there a survivor benefit associated with this pension?',
      subtitle: 'A survivor benefit provides ongoing payments to a designated person after the member dies.',
      render: () => (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'not_sure', label: "I'm not sure" },
          ].map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              selected={draft.hasSurvivorBenefit === opt.value}
              onClick={() => updateDraft('hasSurvivorBenefit', opt.value)}
            />
          ))}
        </div>
      ),
      canProceed: () => !!draft.hasSurvivorBenefit,
    });

    if (draft.hasSurvivorBenefit === 'yes') {
      questions.push({
        title: 'Who would currently receive the survivor benefit?',
        render: () => {
          const spouse = knownIndividuals.find((k) => k.relationship === 'Spouse' || k.relationship === 'Partner');
          const candidates = spouse ? [spouse, ...knownIndividuals.filter((k) => k.id !== spouse.id)] : knownIndividuals;
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {candidates.map((person) => (
                <OptionButton
                  key={person.id}
                  label={`${person.name} (${person.relationship})`}
                  selected={draft.survivorPersonId === person.id}
                  onClick={() => {
                    updateDraft('survivorPersonId', person.id);
                    updateDraft('survivorPersonName', person.name);
                  }}
                />
              ))}
            </div>
          );
        },
        canProceed: () => !!draft.survivorPersonId,
      });
    }
  }

  // DC-specific questions
  if (isDC) {
    questions.push({
      title: 'Who is the plan provider?',
      subtitle: 'This is the financial institution that holds the plan assets.',
      render: () => (
        <input
          type="text"
          value={draft.planProvider || ''}
          onChange={(e) => updateDraft('planProvider', e.target.value)}
          placeholder="e.g., Sun Life, Manulife, Great-West Life"
          className={inputClass}
        />
      ),
      canProceed: () => !!draft.planProvider?.trim(),
    });

    questions.push({
      title: 'Approximately what is the current balance?',
      render: () => (
        <div className="space-y-3">
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
              onChange={(e) => {
                updateDraft('approximateValue', e.target.value);
                updateDraft('valueUnknown', false);
              }}
              placeholder="Enter approximate balance"
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.valueUnknown || false}
              onChange={(e) => {
                updateDraft('valueUnknown', e.target.checked);
                if (e.target.checked) updateDraft('approximateValue', undefined);
              }}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
            />
            <span className="text-sm text-gray-300">I'm not sure of the current balance</span>
          </label>
        </div>
      ),
      canProceed: () => !!draft.approximateValue?.trim() || !!draft.valueUnknown,
    });
  }

  // Plan administrator contact (all types)
  questions.push({
    title: 'Plan administrator or contact (optional)',
    subtitle: 'Someone who could answer questions about this plan.',
    render: () => (
      <div className="space-y-3">
        <input
          type="text"
          value={draft.planAdministrator || ''}
          onChange={(e) => updateDraft('planAdministrator', e.target.value)}
          placeholder="Plan administrator name or HR contact"
          className={inputClass}
        />
        <div>
          <label className={labelClass}>Member reference or ID (optional)</label>
          <p className={subtleTextClass}>Only enter a partial reference — never a full member ID.</p>
          <input
            type="text"
            value={draft.memberReference || ''}
            onChange={(e) => updateDraft('memberReference', e.target.value)}
            placeholder="e.g., Last 4 digits or employee ID reference"
            className={inputClass}
          />
        </div>
      </div>
    ),
    canProceed: () => true,
  });

  // Document location
  questions.push({
    title: 'Is there a pension statement or plan information someone could refer to?',
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
    title: 'Anything someone stepping in should know about this pension? (optional)',
    render: () => (
      <textarea
        value={draft.notes || ''}
        onChange={(e) => updateDraft('notes', e.target.value)}
        placeholder="e.g., The pension has a guaranteed term. The survivor benefit is 60% of the full amount."
        rows={3}
        className={inputClass}
      />
    ),
    canProceed: () => true,
  });

  return questions;
}
