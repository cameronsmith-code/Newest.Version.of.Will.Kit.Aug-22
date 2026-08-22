import { useState, useEffect } from 'react';
import { OtherAssetRecord, generateAssetId } from '../lib/financialAssetTypes';
import {
  inputClass,
  sectionCardClass,
  OptionButton,
  ProgressBar,
  IntakeNav,
  SummaryCard,
  AddButton,
  DocumentLocationPicker,
} from './FinancialFootprintShared';

type Props = {
  assets: OtherAssetRecord[];
  onChange: (assets: OtherAssetRecord[]) => void;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  startSignal?: number;
  hideAddButton?: boolean;
  onSaved?: () => void;
  onCancelled?: () => void;
};

type Draft = Partial<OtherAssetRecord> & {
  hasOtherAssets?: string;
};

function emptyDraft(): Draft {
  return {
    id: generateAssetId('oth'),
    category: 'other',
    subtype: 'other',
    ownerIds: [],
    currency: 'CAD',
  };
}

export default function OtherAssetsIntake({
  assets,
  onChange,
  client1Name,
  client2Name,
  hasSpouse,
  startSignal,
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
      setDraft(emptyDraft());
      setEditingIndex(null);
      setIntakeStep(0);
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
    const clean: OtherAssetRecord = {
      id: draft.id || generateAssetId('oth'),
      category: 'other',
      subtype: 'other',
      ownerIds: draft.ownerIds || [],
      assetDescription: draft.assetDescription,
      provider: draft.provider,
      approximateValue: draft.approximateValue,
      valueUnknown: draft.valueUnknown,
      currency: draft.currency || 'CAD',
      importantDates: draft.importantDates,
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

  const questions = buildQuestions(draft, updateDraft, client1Name, client2Name, hasSpouse);
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

  return (
    <div className="space-y-5">
      {assets.length > 0 && (
        <div className="space-y-3">
          {assets.map((asset, i) => (
            <SummaryCard
              key={asset.id}
              title={asset.assetDescription || 'Other financial asset'}
              subtitle={asset.provider}
              value={asset.valueUnknown ? 'Value unknown' : asset.approximateValue ? `Approximately ${asset.currency} ${asset.approximateValue}` : undefined}
              onEdit={() => startEdit(i)}
              onDelete={() => deleteAsset(i)}
            />
          ))}
        </div>
      )}
      {!hideAddButton && <AddButton label="Add another financial asset" onClick={startNew} />}
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
): Question[] {
  const questions: Question[] = [];

  questions.push({
    title: 'What is it?',
    subtitle: 'Describe the asset — e.g., private investment, promissory note, annuity, structured investment.',
    render: () => (
      <textarea
        value={draft.assetDescription || ''}
        onChange={(e) => updateDraft('assetDescription', e.target.value)}
        placeholder="Describe the financial asset"
        rows={2}
        className={inputClass}
      />
    ),
    canProceed: () => !!draft.assetDescription?.trim(),
  });

  questions.push({
    title: 'Who owns it?',
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <OptionButton label={client1Name} selected={(draft.ownerIds || []).includes('client1')} onClick={() => updateDraft('ownerIds', ['client1'])} />
        {hasSpouse && <OptionButton label={client2Name} selected={(draft.ownerIds || []).includes('client2')} onClick={() => updateDraft('ownerIds', ['client2'])} />}
        {hasSpouse && <OptionButton label="Joint" selected={draft.ownerIds?.includes('joint')} onClick={() => updateDraft('ownerIds', ['joint'])} />}
      </div>
    ),
    canProceed: () => (draft.ownerIds || []).length > 0,
  });

  questions.push({
    title: 'Who provides or owes it? (optional)',
    render: () => (
      <input
        type="text"
        value={draft.provider || ''}
        onChange={(e) => updateDraft('provider', e.target.value)}
        placeholder="e.g., Insurance company, investment firm, individual"
        className={inputClass}
      />
    ),
    canProceed: () => true,
  });

  questions.push({
    title: 'Approximate value (optional)',
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
            placeholder="Enter approximate value"
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
          <span className="text-sm text-gray-300">I'm not sure of the current value</span>
        </label>
      </div>
    ),
    canProceed: () => true,
  });

  questions.push({
    title: 'Are there any important dates? (optional)',
    render: () => (
      <input
        type="text"
        value={draft.importantDates || ''}
        onChange={(e) => updateDraft('importantDates', e.target.value)}
        placeholder="e.g., Matures January 2028, vests in 2027"
        className={inputClass}
      />
    ),
    canProceed: () => true,
  });

  questions.push({
    title: 'Contact information (optional)',
    render: () => (
      <div className="space-y-3">
        <input
          type="text"
          value={draft.contact?.contactName || ''}
          onChange={(e) => updateDraft('contact', { ...draft.contact, contactName: e.target.value })}
          placeholder="Contact name"
          className={inputClass}
        />
        <input
          type="text"
          value={draft.contact?.contactPhone || ''}
          onChange={(e) => updateDraft('contact', { ...draft.contact, contactPhone: e.target.value })}
          placeholder="Phone"
          className={inputClass}
        />
      </div>
    ),
    canProceed: () => true,
  });

  questions.push({
    title: 'Where is the documentation kept?',
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

  questions.push({
    title: 'Anything someone stepping in should know? (optional)',
    render: () => (
      <textarea
        value={draft.notes || ''}
        onChange={(e) => updateDraft('notes', e.target.value)}
        placeholder="e.g., This is a private placement with restrictions on transfer."
        rows={3}
        className={inputClass}
      />
    ),
    canProceed: () => true,
  });

  return questions;
}
