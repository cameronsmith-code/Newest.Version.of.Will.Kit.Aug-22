import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import {
  ReceivableRecord,
  generateAssetId,
} from '../lib/financialAssetTypes';
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
  assets: ReceivableRecord[];
  onChange: (assets: ReceivableRecord[]) => void;
  allAnswers?: Map<string, Record<string, unknown>>;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  derivedReceivables: Array<{ id: string; corporation: string; amount: string; owedTo: string }>;
  startSignal?: number;
  hideAddButton?: boolean;
  onSaved?: () => void;
  onCancelled?: () => void;
};

type Draft = Partial<ReceivableRecord> & {
  hasReceivable?: string;
};

function emptyDraft(): Draft {
  return {
    id: generateAssetId('rec'),
    category: 'receivable',
    subtype: 'money_owed',
    ownerIds: [],
    currency: 'CAD',
  };
}

export default function ReceivablesIntake({
  assets,
  onChange,
  client1Name,
  client2Name,
  hasSpouse,
  derivedReceivables,
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
    const clean: ReceivableRecord = {
      id: draft.id || generateAssetId('rec'),
      category: 'receivable',
      subtype: 'money_owed',
      ownerIds: draft.ownerIds || [],
      debtor: draft.debtor,
      debtorRelationship: draft.debtorRelationship,
      approximateValue: draft.approximateValue,
      valueUnknown: draft.valueUnknown,
      currency: draft.currency || 'CAD',
      interestRate: draft.interestRate,
      paymentArrangement: draft.paymentArrangement,
      security: draft.security,
      hasWrittenAgreement: draft.hasWrittenAgreement,
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
      {/* Derived receivables from corporate financial connections */}
      {derivedReceivables.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Previously identified</p>
          {derivedReceivables.map((dr) => (
            <div key={dr.id} className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 flex items-center gap-3">
              <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-300">{dr.corporation} owes {dr.owedTo}</p>
                <p className="text-xs text-gray-500">Approximately {dr.amount || 'amount unknown'}</p>
              </div>
              <span className="text-xs text-gray-500 italic">From Corporate Financial Connections</span>
            </div>
          ))}
        </div>
      )}

      {assets.length > 0 && (
        <div className="space-y-3">
          {assets.map((asset, i) => (
            <SummaryCard
              key={asset.id}
              title={asset.debtor ? `${asset.debtor} owes ${asset.ownerIds.includes('client2') ? client2Name : client1Name}` : 'Amount owed'}
              subtitle={asset.debtorRelationship}
              value={asset.valueUnknown ? 'Value unknown' : asset.approximateValue ? `Approximately ${asset.currency} ${asset.approximateValue}` : undefined}
              details={[
                ...(asset.interestRate ? [{ label: 'Interest rate', value: asset.interestRate }] : []),
                ...(asset.hasWrittenAgreement === 'yes' ? [{ label: 'Written agreement', value: 'Yes' }] : []),
              ]}
              onEdit={() => startEdit(i)}
              onDelete={() => deleteAsset(i)}
            />
          ))}
        </div>
      )}
      {!hideAddButton && <AddButton label="Add an amount owed to you" onClick={startNew} />}
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
    title: 'Who owes this money?',
    subtitle: 'This is the person or entity that is expected to repay.',
    render: () => (
      <input
        type="text"
        value={draft.debtor || ''}
        onChange={(e) => updateDraft('debtor', e.target.value)}
        placeholder="Enter the name of the person or entity"
        className={inputClass}
      />
    ),
    canProceed: () => !!draft.debtor?.trim(),
  });

  questions.push({
    title: 'What is their relationship to the client?',
    render: () => (
      <input
        type="text"
        value={draft.debtorRelationship || ''}
        onChange={(e) => updateDraft('debtorRelationship', e.target.value)}
        placeholder="e.g., Family member, friend, business partner"
        className={inputClass}
      />
    ),
    canProceed: () => !!draft.debtorRelationship?.trim(),
  });

  questions.push({
    title: 'Who is this money owed to?',
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
    title: 'How much is currently outstanding?',
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
            placeholder="Enter amount outstanding"
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
          <span className="text-sm text-gray-300">I'm not sure of the exact amount</span>
        </label>
      </div>
    ),
    canProceed: () => !!draft.approximateValue?.trim() || !!draft.valueUnknown,
  });

  questions.push({
    title: 'Is there an interest rate? (optional)',
    render: () => (
      <input
        type="text"
        value={draft.interestRate || ''}
        onChange={(e) => updateDraft('interestRate', e.target.value)}
        placeholder="e.g., 5% annual, or prime + 2%"
        className={inputClass}
      />
    ),
    canProceed: () => true,
  });

  questions.push({
    title: 'What is the payment arrangement? (optional)',
    render: () => (
      <textarea
        value={draft.paymentArrangement || ''}
        onChange={(e) => updateDraft('paymentArrangement', e.target.value)}
        placeholder="e.g., Monthly payments of $500, lump sum due December 2026, no formal schedule"
        rows={2}
        className={inputClass}
      />
    ),
    canProceed: () => true,
  });

  questions.push({
    title: 'Is this loan secured by anything?',
    render: () => (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <OptionButton label="Yes" selected={!!draft.security} onClick={() => updateDraft('security', ' ')} />
          <OptionButton label="No" selected={draft.security === ''} onClick={() => updateDraft('security', '')} />
        </div>
        {draft.security !== undefined && draft.security !== '' && (
          <input
            type="text"
            value={draft.security || ''}
            onChange={(e) => updateDraft('security', e.target.value)}
            placeholder="e.g., Secured against a property, vehicle, or other asset"
            className={inputClass}
          />
        )}
      </div>
    ),
    canProceed: () => true,
  });

  questions.push({
    title: 'Is there a written agreement?',
    render: () => (
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ].map((opt) => (
          <OptionButton key={opt.value} label={opt.label} selected={draft.hasWrittenAgreement === opt.value} onClick={() => updateDraft('hasWrittenAgreement', opt.value)} />
        ))}
      </div>
    ),
    canProceed: () => !!draft.hasWrittenAgreement,
  });

  questions.push({
    title: 'Where is the written agreement or documentation kept?',
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
        placeholder="e.g., This loan was to a family member and repayment is expected but not enforced."
        rows={3}
        className={inputClass}
      />
    ),
    canProceed: () => true,
  });

  return questions;
}
