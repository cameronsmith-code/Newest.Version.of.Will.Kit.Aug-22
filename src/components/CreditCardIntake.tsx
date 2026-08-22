import React, { useState, useEffect } from 'react';
import { Trash2, ChevronRight, CreditCard, Landmark, Repeat } from 'lucide-react';

export type CreditCardData = {
  id: string;
  responsibleParty?: string;
  responsiblePartyOtherName?: string;
  responsiblePartyOtherRelationship?: string;
  responsiblePartyRole?: string;
  hasAdditionalUsers?: string;
  additionalUsers?: Array<{
    id: string;
    personId?: string;
    personName?: string;
    personRelationship?: string;
    role?: string;
  }>;
  issuer?: string;
  cardLabel?: string;
  lastFour?: string;
  balanceStatus?: string;
  balance?: string;
  creditLimit?: string;
  creditLimitUnknown?: string;
  paymentMethod?: string;
  paymentAccountId?: string;
  paymentAccountLabel?: string;
  paymentSourceOther?: string;
  hasRecurringPayments?: string;
  recurringPaymentTypes?: string[];
  recurringPaymentTypesOther?: string;
  recurringNotes?: string;
  hasRewards?: string;
  rewardsProgram?: string;
  rewardsBalance?: string;
  rewardsAccessLocation?: string;
  statementAccess?: string;
  statementAccessOther?: string;
  loginLocation?: string;
  specialNotes?: string;
};

type Props = {
  answers: Record<string, unknown>;
  allAnswers?: Map<string, Record<string, unknown>>;
  onAnswerChange: (key: string, value: unknown) => void;
  bankingOptions: Array<{ value: string; label: string }>;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  hasCreditCardsAnswer: string;
  onHasCreditCardsChange: (value: string) => void;
};

const PAYMENT_METHOD_OPTIONS = [
  { value: 'auto_full', label: 'Automatically in full' },
  { value: 'auto_min', label: 'Automatic minimum / fixed payment' },
  { value: 'manual', label: 'Paid manually' },
  { value: 'varies', label: 'Varies' },
  { value: 'not_sure', label: "I'm not sure" },
];

const RECURRING_PAYMENT_TYPES = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'phone_internet', label: 'Phone / Internet' },
  { value: 'streaming', label: 'Streaming / Subscriptions' },
  { value: 'child_expenses', label: 'Child-related expenses' },
  { value: 'memberships', label: 'Memberships' },
  { value: 'property_expenses', label: 'Property expenses' },
  { value: 'business_expenses', label: 'Business expenses' },
  { value: 'charitable', label: 'Charitable donations' },
  { value: 'other', label: 'Other' },
];

const STATEMENT_ACCESS_OPTIONS = [
  { value: 'online', label: 'Online account' },
  { value: 'paper', label: 'Paper statements' },
  { value: 'both', label: 'Both' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

function formatCurrency(amount: string): string {
  if (!amount) return '';
  const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return amount;
  return num.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function YesNoCard({
  value,
  onChange,
  options = ['yes', 'no'],
  labels = { yes: 'Yes', no: 'No' },
}: {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex items-center justify-center px-6 py-5 rounded-xl border-2 text-lg font-medium transition-all ${
            value === opt
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-750'
          }`}
        >
          {labels[opt] || opt}
        </button>
      ))}
    </div>
  );
}

function OptionCard({
  value,
  selectedValue,
  onClick,
  icon,
}: {
  value: string;
  selectedValue: string;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left ${
        selectedValue === value
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
      }`}
    >
      {icon && <span className="flex-shrink-0 opacity-60">{icon}</span>}
      {value}
    </button>
  );
}

function CreditCardSummaryCard({
  card,
  client1Name,
  client2Name,
  onDelete,
}: {
  card: CreditCardData;
  client1Name: string;
  client2Name: string;
  onDelete?: () => void;
}) {
  const responsibleLabel =
    card.responsibleParty === 'client1' ? client1Name :
    card.responsibleParty === 'client2' ? client2Name :
    card.responsibleParty === 'joint' ? `${client1Name} & ${client2Name}` :
    card.responsibleParty === 'other' ? (card.responsiblePartyOtherName || 'Other') :
    card.responsibleParty?.startsWith('child_') ? (card.responsiblePartyOtherName || 'Child') :
    '';

  const balanceLabel =
    card.balanceStatus === 'paid_in_full' ? 'Paid in full' :
    card.balanceStatus === 'not_sure' ? "Not sure" :
    card.balance ? formatCurrency(card.balance) : '';

  const title = card.cardLabel || card.issuer || 'Credit Card';
  const subtitle = [card.issuer, card.lastFour ? `•••• ${card.lastFour}` : ''].filter(Boolean).join(' ');

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <h4 className="text-base font-semibold text-white truncate">{title}</h4>
          </div>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
        {responsibleLabel && (
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Account Holder</dt>
            <dd className="text-sm text-gray-200 mt-0.5">{responsibleLabel}</dd>
          </div>
        )}
        {balanceLabel && (
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Balance</dt>
            <dd className="text-sm text-gray-200 mt-0.5">{balanceLabel}</dd>
          </div>
        )}
        {card.paymentMethod && (
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Payment</dt>
            <dd className="text-sm text-gray-200 mt-0.5">
              {PAYMENT_METHOD_OPTIONS.find(o => o.value === card.paymentMethod)?.label || card.paymentMethod}
            </dd>
          </div>
        )}
        {card.paymentAccountLabel && (
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Paid From</dt>
            <dd className="text-sm text-gray-200 mt-0.5">{card.paymentAccountLabel}</dd>
          </div>
        )}
        {card.hasRecurringPayments === 'yes' && card.recurringPaymentTypes && card.recurringPaymentTypes.length > 0 && (
          <div className="col-span-2">
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Recurring Payments</dt>
            <dd className="text-sm text-gray-200 mt-0.5">
              {card.recurringPaymentTypes
                .map(t => RECURRING_PAYMENT_TYPES.find(o => o.value === t)?.label || t)
                .join(', ')}
            </dd>
          </div>
        )}
        {card.hasRewards === 'yes' && card.rewardsProgram && (
          <div>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">Rewards</dt>
            <dd className="text-sm text-gray-200 mt-0.5">{card.rewardsProgram}</dd>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreditCardIntake({
  answers,
  allAnswers,
  onAnswerChange,
  bankingOptions,
  client1Name,
  client2Name,
  hasSpouse,
  hasCreditCardsAnswer,
  onHasCreditCardsChange,
}: Props) {
  const creditCards = (answers['creditCardsData'] as CreditCardData[]) || [];

  const [intakeActive, setIntakeActive] = useState(false);
  const [intakeStep, setIntakeStep] = useState(0);
  const [draft, setDraft] = useState<CreditCardData>({ id: '' });

  // Children from the children section
  const childrenData = ((allAnswers?.get('children') || {})['childrenData'] as Array<Record<string, string>>) || [];
  const children = childrenData
    .map((c, i) => ({ id: `child_${i}`, name: (c['name'] as string) || '', nickname: (c['nickname'] as string) || '' }))
    .filter(c => c.name.trim() || c.nickname.trim());

  const startIntake = () => {
    setDraft({ id: `cc-${Date.now()}-${creditCards.length}` });
    setIntakeStep(0);
    setIntakeActive(true);
  };

  const cancelIntake = () => {
    setIntakeActive(false);
    setDraft({ id: '' });
    setIntakeStep(0);
  };

  const saveDraft = () => {
    const updated = [...creditCards, draft];
    onAnswerChange('creditCardsData', updated);
    setIntakeActive(false);
    setDraft({ id: '' });
    setIntakeStep(0);
  };

  const deleteCard = (index: number) => {
    const updated = creditCards.filter((_, i) => i !== index);
    onAnswerChange('creditCardsData', updated.length > 0 ? updated : undefined);
  };

  const updateDraft = (field: keyof CreditCardData, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (creditCards.length === 0 && hasCreditCardsAnswer === 'no') {
      if (intakeActive) cancelIntake();
    }
  }, [hasCreditCardsAnswer, creditCards.length, intakeActive]);

  // Build responsible party options
  const responsibleOptions: Array<{ value: string; label: string }> = [
    { value: 'client1', label: client1Name },
  ];
  if (hasSpouse) {
    responsibleOptions.push({ value: 'client2', label: client2Name });
    responsibleOptions.push({ value: 'joint', label: `${client1Name} & ${client2Name}` });
  }
  children.forEach((child) => {
    responsibleOptions.push({ value: child.id, label: child.name || child.nickname });
  });
  responsibleOptions.push({ value: 'other', label: 'Other' });

  // Build "additional users" person options
  const additionalUserOptions: Array<{ value: string; label: string }> = [];
  if (hasSpouse) additionalUserOptions.push({ value: 'spouse', label: client2Name });
  children.forEach((child) => {
    additionalUserOptions.push({ value: child.id, label: child.name || child.nickname });
  });
  additionalUserOptions.push({ value: 'other', label: 'Someone else' });

  const inputClass = 'w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-2';
  const sectionCardClass = 'bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4';

  const ROLE_OPTIONS = [
    { value: 'joint', label: 'Joint / co-borrower' },
    { value: 'authorized', label: 'Authorized / supplementary cardholder' },
    { value: 'not_sure', label: "I'm not sure" },
  ];

  // === INTAKE QUESTIONS ===
  const QUESTIONS = [
    // Q1: Who is responsible?
    {
      title: 'Who is responsible for this credit card account?',
      subtitle: 'This is the person legally responsible for the debt — not just someone who has a card.',
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {responsibleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateDraft('responsibleParty', opt.value)}
                className={`flex items-center justify-center px-5 py-4 rounded-xl border-2 text-base font-medium transition-all ${
                  draft.responsibleParty === opt.value
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {draft.responsibleParty === 'other' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className={labelClass}>Name</label>
                <input type="text" value={draft.responsiblePartyOtherName || ''} onChange={(e) => updateDraft('responsiblePartyOtherName', e.target.value)} placeholder="Enter name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Relationship</label>
                <input type="text" value={draft.responsiblePartyOtherRelationship || ''} onChange={(e) => updateDraft('responsiblePartyOtherRelationship', e.target.value)} placeholder="e.g., Son, Parent, Friend" className={inputClass} />
              </div>
            </div>
          )}
          {(draft.responsibleParty?.startsWith('child_') || draft.responsibleParty === 'other') && (
            <div className="pt-2">
              <label className={labelClass}>
                Is {draft.responsiblePartyOtherName || draft.responsibleParty?.startsWith('child_') ? responsibleOptions.find(o => o.value === draft.responsibleParty)?.label : 'this person'} legally responsible for the account, or do they simply have a card connected to someone else's account?
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateDraft('responsiblePartyRole', opt.value)}
                    className={`flex items-center px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left ${
                      draft.responsiblePartyRole === opt.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      canProceed: () => !!draft.responsibleParty && (draft.responsibleParty !== 'other' || !!draft.responsiblePartyOtherName?.trim()),
    },
    // Q2: Additional users
    {
      title: 'Does anyone else have a card connected to this account?',
      subtitle: 'This includes authorized or supplementary cardholders.',
      render: () => (
        <div className="space-y-5">
          <YesNoCard value={draft.hasAdditionalUsers || ''} onChange={(v) => updateDraft('hasAdditionalUsers', v)} />
          {draft.hasAdditionalUsers === 'yes' && (
            <div className="space-y-4">
              {(draft.additionalUsers || []).map((user, idx) => (
                <div key={user.id} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Person {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (draft.additionalUsers || []).filter((_, i) => i !== idx);
                        updateDraft('additionalUsers', updated);
                      }}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>Who?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {additionalUserOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const updated = [...(draft.additionalUsers || [])];
                            updated[idx] = { ...user, personId: opt.value, personName: opt.label };
                            updateDraft('additionalUsers', updated);
                          }}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            user.personId === opt.value
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {user.personId === 'other' && (
                    <div>
                      <label className={labelClass}>Name</label>
                      <input type="text" value={user.personName || ''} onChange={(e) => {
                        const updated = [...(draft.additionalUsers || [])];
                        updated[idx] = { ...user, personName: e.target.value };
                        updateDraft('additionalUsers', updated);
                      }} placeholder="Enter name" className={inputClass} />
                    </div>
                  )}
                  {user.personId && (
                    <div>
                      <label className={labelClass}>What is their role?</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {ROLE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const updated = [...(draft.additionalUsers || [])];
                              updated[idx] = { ...user, role: opt.value };
                              updateDraft('additionalUsers', updated);
                            }}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                              user.role === opt.value
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const updated = [...(draft.additionalUsers || []), { id: `user-${Date.now()}-${(draft.additionalUsers || []).length}` }];
                  updateDraft('additionalUsers', updated);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
                Add another person
              </button>
            </div>
          )}
        </div>
      ),
      canProceed: () => true,
    },
    // Q3: Card identification
    {
      title: 'Who issued the card?',
      subtitle: 'You can also add a short label to help identify this card.',
      render: () => (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Issuer</label>
            <input type="text" value={draft.issuer || ''} onChange={(e) => updateDraft('issuer', e.target.value)} placeholder="e.g., TD, RBC, Amex, CIBC" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>How would you identify this card? (optional)</label>
            <input type="text" value={draft.cardLabel || ''} onChange={(e) => updateDraft('cardLabel', e.target.value)} placeholder="e.g., Aeroplan Visa, Amex Cobalt, Household Mastercard" className={inputClass} />
          </div>
          <div className="max-w-xs">
            <label className={labelClass}>Last four digits (optional)</label>
            <input type="text" maxLength={4} inputMode="numeric" value={draft.lastFour || ''} onChange={(e) => updateDraft('lastFour', e.target.value)} placeholder="e.g., 1234" className={inputClass} />
          </div>
        </div>
      ),
      canProceed: () => !!draft.issuer?.trim(),
    },
    // Q4: Balance
    {
      title: 'Approximately how much is currently owing?',
      subtitle: 'A credit card can be financially important even if there is no long-term debt.',
      render: () => (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => updateDraft('balanceStatus', 'amount')}
              className={`px-4 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                draft.balanceStatus === 'amount' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              Enter amount
            </button>
            <button
              type="button"
              onClick={() => { updateDraft('balanceStatus', 'paid_in_full'); updateDraft('balance', ''); }}
              className={`px-4 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                draft.balanceStatus === 'paid_in_full' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              Paid in full
            </button>
            <button
              type="button"
              onClick={() => { updateDraft('balanceStatus', 'not_sure'); updateDraft('balance', ''); }}
              className={`px-4 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                draft.balanceStatus === 'not_sure' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              I'm not sure
            </button>
          </div>
          {draft.balanceStatus === 'amount' && (
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input type="text" inputMode="numeric" value={draft.balance || ''} onChange={(e) => updateDraft('balance', e.target.value)} placeholder="e.g., 2,500" className={`${inputClass} pl-8`} />
            </div>
          )}
        </div>
      ),
      canProceed: () => !!draft.balanceStatus && (draft.balanceStatus !== 'amount' || !!draft.balance?.trim()),
    },
    // Q5: Credit limit
    {
      title: 'What is the credit limit?',
      subtitle: 'Optional — this helps distinguish a $2,000 balance on a $5,000 card from unusual exposure.',
      render: () => (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input type="text" inputMode="numeric" value={draft.creditLimit || ''} onChange={(e) => updateDraft('creditLimit', e.target.value)} placeholder="e.g., 10,000" className={`${inputClass} pl-8`} disabled={draft.creditLimitUnknown === 'yes'} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.creditLimitUnknown === 'yes'}
              onChange={(e) => {
                updateDraft('creditLimitUnknown', e.target.checked ? 'yes' : '');
                if (e.target.checked) updateDraft('creditLimit', '');
              }}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">I'm not sure</span>
          </label>
        </div>
      ),
      canProceed: () => true,
    },
    // Q6: Payment method
    {
      title: 'How is this card usually paid?',
      subtitle: 'This is important for your Power of Attorney for Property.',
      render: () => (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateDraft('paymentMethod', opt.value)}
                className={`flex items-center justify-center px-5 py-4 rounded-xl border-2 text-base font-medium transition-all ${
                  draft.paymentMethod === opt.value
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {(draft.paymentMethod === 'auto_full' || draft.paymentMethod === 'auto_min') && (
            <div>
              <label className={labelClass}>Which account is this card usually paid from?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {bankingOptions.length > 0 ? (
                  bankingOptions.map((opt) => (
                    <OptionCard
                      key={opt.value}
                      value={opt.label}
                      selectedValue={draft.paymentAccountLabel || ''}
                      onClick={() => {
                        updateDraft('paymentAccountId', opt.value);
                        updateDraft('paymentAccountLabel', opt.label);
                        updateDraft('paymentSourceOther', '');
                      }}
                      icon={<Landmark className="w-4 h-4" />}
                    />
                  ))
                ) : null}
                <OptionCard
                  value={`${client1Name}'s account`}
                  selectedValue={draft.paymentAccountLabel || ''}
                  onClick={() => {
                    updateDraft('paymentAccountId', `client1_account`);
                    updateDraft('paymentAccountLabel', `${client1Name}'s account`);
                    updateDraft('paymentSourceOther', '');
                  }}
                  icon={<Landmark className="w-4 h-4" />}
                />
                {hasSpouse && (
                  <>
                    <OptionCard
                      value={`${client2Name}'s account`}
                      selectedValue={draft.paymentAccountLabel || ''}
                      onClick={() => {
                        updateDraft('paymentAccountId', `client2_account`);
                        updateDraft('paymentAccountLabel', `${client2Name}'s account`);
                        updateDraft('paymentSourceOther', '');
                      }}
                      icon={<Landmark className="w-4 h-4" />}
                    />
                    <OptionCard
                      value="Joint account"
                      selectedValue={draft.paymentAccountLabel || ''}
                      onClick={() => {
                        updateDraft('paymentAccountId', `joint_account`);
                        updateDraft('paymentAccountLabel', 'Joint account');
                        updateDraft('paymentSourceOther', '');
                      }}
                      icon={<Landmark className="w-4 h-4" />}
                    />
                  </>
                )}
                <OptionCard
                  value="Other account"
                  selectedValue={draft.paymentAccountLabel || ''}
                  onClick={() => {
                    updateDraft('paymentAccountId', 'other');
                    updateDraft('paymentAccountLabel', 'Other account');
                  }}
                  icon={<Landmark className="w-4 h-4" />}
                />
                <OptionCard
                  value="I'm not sure"
                  selectedValue={draft.paymentAccountLabel || ''}
                  onClick={() => {
                    updateDraft('paymentAccountId', 'not_sure');
                    updateDraft('paymentAccountLabel', "I'm not sure");
                  }}
                  icon={<Landmark className="w-4 h-4" />}
                />
              </div>
              {draft.paymentAccountId === 'other' && (
                <div className="mt-3">
                  <label className={labelClass}>Please describe</label>
                  <input type="text" value={draft.paymentSourceOther || ''} onChange={(e) => updateDraft('paymentSourceOther', e.target.value)} placeholder="Brief description — no account numbers needed" className={inputClass} />
                </div>
              )}
            </div>
          )}
        </div>
      ),
      canProceed: () => !!draft.paymentMethod,
    },
    // Q7: Recurring payments
    {
      title: 'Is this card used for any important recurring payments?',
      subtitle: 'For example, home insurance, electricity, or phone bills charged to this card. This is key information for your Power of Attorney.',
      render: () => (
        <div className="space-y-5">
          <YesNoCard
            value={draft.hasRecurringPayments || ''}
            onChange={(v) => updateDraft('hasRecurringPayments', v)}
            options={['yes', 'no', 'not_sure']}
            labels={{ yes: 'Yes', no: 'No', not_sure: "I'm not sure" }}
          />
          {draft.hasRecurringPayments === 'yes' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>What kinds of payments rely on this card?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {RECURRING_PAYMENT_TYPES.map((opt) => {
                    const selected = (draft.recurringPaymentTypes || []).includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const current = draft.recurringPaymentTypes || [];
                          const updated = selected
                            ? current.filter(v => v !== opt.value)
                            : [...current, opt.value];
                          updateDraft('recurringPaymentTypes', updated);
                        }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                          selected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <Repeat className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {(draft.recurringPaymentTypes || []).includes('other') && (
                <div>
                  <label className={labelClass}>Please specify</label>
                  <input type="text" value={draft.recurringPaymentTypesOther || ''} onChange={(e) => updateDraft('recurringPaymentTypesOther', e.target.value)} placeholder="What other recurring payments?" className={inputClass} />
                </div>
              )}
              <div>
                <label className={labelClass}>Anything someone stepping in should know about these payments? (optional)</label>
                <textarea value={draft.recurringNotes || ''} onChange={(e) => updateDraft('recurringNotes', e.target.value)} placeholder="e.g., Home insurance auto-renews in March, utilities are about $200/month" rows={3} className={`${inputClass} resize-none`} />
              </div>
            </div>
          )}
        </div>
      ),
      canProceed: () => true,
    },
    // Q8: Rewards
    {
      title: 'Does this card have rewards, points, or travel benefits that may have meaningful value?',
      subtitle: 'Some families have thousands of dollars of value in points.',
      render: () => (
        <div className="space-y-5">
          <YesNoCard
            value={draft.hasRewards || ''}
            onChange={(v) => updateDraft('hasRewards', v)}
            options={['yes', 'no', 'not_sure']}
            labels={{ yes: 'Yes', no: 'No', not_sure: 'Not sure' }}
          />
          {draft.hasRewards === 'yes' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Rewards program</label>
                <input type="text" value={draft.rewardsProgram || ''} onChange={(e) => updateDraft('rewardsProgram', e.target.value)} placeholder="e.g., Aeroplan, TD Rewards, Amex Membership Rewards" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Approximate points / rewards balance (optional)</label>
                  <input type="text" value={draft.rewardsBalance || ''} onChange={(e) => updateDraft('rewardsBalance', e.target.value)} placeholder="e.g., 50,000 points" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Where is login / access info kept? (optional)</label>
                  <input type="text" value={draft.rewardsAccessLocation || ''} onChange={(e) => updateDraft('rewardsAccessLocation', e.target.value)} placeholder="e.g., Password manager, Home office" className={inputClass} />
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      canProceed: () => true,
    },
    // Q9: Statement access
    {
      title: 'How would someone access statements or account information if needed?',
      render: () => (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {STATEMENT_ACCESS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateDraft('statementAccess', opt.value)}
                className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all ${
                  draft.statementAccess === opt.value
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {draft.statementAccess === 'other' && (
            <div>
              <label className={labelClass}>Please specify</label>
              <input type="text" value={draft.statementAccessOther || ''} onChange={(e) => updateDraft('statementAccessOther', e.target.value)} placeholder="How would someone access statements?" className={inputClass} />
            </div>
          )}
          {(draft.statementAccess === 'online' || draft.statementAccess === 'both') && (
            <div>
              <label className={labelClass}>Where are the login or access instructions kept?</label>
              <input type="text" value={draft.loginLocation || ''} onChange={(e) => updateDraft('loginLocation', e.target.value)} placeholder="e.g., Password manager, Written instructions in home office" className={inputClass} />
              <p className="text-xs text-gray-500 mt-2">Store only the location of login info — never the password itself.</p>
            </div>
          )}
        </div>
      ),
      canProceed: () => !!draft.statementAccess,
    },
    // Q10: Anything unusual
    {
      title: 'Is there anything someone managing your affairs should know about this card?',
      subtitle: 'For example, someone else regularly uses the card, expenses are reimbursed by a business, or the balance is expected to be repaid by someone else.',
      render: () => (
        <textarea
          value={draft.specialNotes || ''}
          onChange={(e) => updateDraft('specialNotes', e.target.value)}
          placeholder="Optional — add any context that would help someone managing your affairs"
          rows={4}
          className={`${inputClass} resize-none`}
        />
      ),
      canProceed: () => true,
    },
  ];

  const currentQuestion = QUESTIONS[intakeStep];
  const isLastStep = intakeStep === QUESTIONS.length - 1;
  const canProceed = currentQuestion?.canProceed() ?? false;

  // === INTAKE MODE ===
  if (intakeActive) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CreditCard className="w-4 h-4 text-blue-400" />
          <span>Credit Card {creditCards.length + 1}</span>
          <ChevronRight className="w-4 h-4" />
          <span>Question {intakeStep + 1} of {QUESTIONS.length}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${((intakeStep + 1) / QUESTIONS.length) * 100}%` }} />
        </div>

        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">{currentQuestion.title}</h3>
          {currentQuestion.subtitle && <p className="text-sm text-gray-400">{currentQuestion.subtitle}</p>}
          <div className="pt-2">{currentQuestion.render()}</div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={intakeStep === 0 ? cancelIntake : () => setIntakeStep(intakeStep - 1)}
            className="px-5 py-2.5 text-gray-400 hover:text-gray-200 font-medium transition-colors"
          >
            {intakeStep === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            disabled={!canProceed}
            onClick={() => {
              if (isLastStep) saveDraft();
              else setIntakeStep(intakeStep + 1);
            }}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              canProceed ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLastStep ? 'Save Card' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  // === DEFAULT / REVIEW MODE ===
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className={sectionCardClass}>
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-xl font-semibold text-white">Personal Credit Cards</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Personal credit cards — not corporate or business-owned cards.
            </p>
          </div>
        </div>
      </div>

      {/* Credit card summary cards */}
      {creditCards.length > 0 && (
        <div className="space-y-3">
          {creditCards.map((card, i) => (
            <CreditCardSummaryCard
              key={card.id || i}
              card={card}
              client1Name={client1Name}
              client2Name={client2Name}
              onDelete={() => deleteCard(i)}
            />
          ))}
        </div>
      )}

      {/* "Do you have credit cards?" initial question */}
      {creditCards.length === 0 && hasCreditCardsAnswer === '' && (
        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">Do you have any personal credit cards to add?</h3>
          <YesNoCard
            value={hasCreditCardsAnswer}
            onChange={(v) => {
              onHasCreditCardsChange(v);
              if (v === 'yes') startIntake();
            }}
          />
        </div>
      )}

      {/* Repeat question after adding at least one card */}
      {creditCards.length > 0 && (
        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">Do you have another credit card to add?</h3>
          <YesNoCard
            value={hasCreditCardsAnswer === 'yes' ? 'yes' : (hasCreditCardsAnswer === 'no' ? 'no' : '')}
            onChange={(v) => {
              onHasCreditCardsChange(v);
              if (v === 'yes') startIntake();
            }}
          />
        </div>
      )}

      {/* If answered no */}
      {hasCreditCardsAnswer === 'no' && creditCards.length === 0 && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
          <p className="text-gray-300 text-sm">
            No personal credit cards to add. You can return to this section if your situation changes.
          </p>
        </div>
      )}
    </div>
  );
}
