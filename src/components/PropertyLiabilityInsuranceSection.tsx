import { useState, useMemo, useCallback } from 'react';
import { ArrowRight, Home, Car, Umbrella, Pencil, Shield } from 'lucide-react';
import {
  inputClass,
  labelClass,
  sectionCardClass,
  YesNoCard,
  OptionButton,
  SummaryCard,
  AddButton,
  SectionHeading,
} from './FinancialFootprintShared';
import RepoDocumentLocationPicker from './DocumentLocationPicker';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';
import type { DocumentLocationRef } from '../lib/documentLocationTypes';
import type {
  PropertyLiabilityPolicy,
  PropertyLiabilityInsuranceData,
  InsurancePolicyType,
  PremiumFrequency,
  PaymentSourceType,
  YesNoNotSure,
  KnownPaymentSource,
  KnownCreditCard,
  PropertyInsuranceStatus,
} from '../lib/propertyLiabilityInsuranceTypes';
import {
  emptyPolicy,
  POLICY_TYPE_LABELS,
  PREMIUM_FREQUENCY_OPTIONS,
  deriveKnownProperties,
  deriveKnownVehicles,
  deriveBankAccounts,
  deriveCreditCards,
  generateBankAccountId,
  generateCreditCardId,
} from '../lib/propertyLiabilityInsuranceTypes';

type Screen =
  | 'intro'
  | 'propertyGate'
  | 'propertyPolicy'
  | 'autoGate'
  | 'autoPolicy'
  | 'rvGate'
  | 'valuableArticlesGate'
  | 'valuableArticlesDetail'
  | 'otherCoverageGate'
  | 'umbrellaGate'
  | 'umbrellaDetail'
  | 'householdManager'
  | 'continuity'
  | 'review';

type Props = {
  answers: Record<string, unknown>;
  allAnswers?: Map<string, Record<string, unknown>>;
  onAnswerChange: (key: string, value: unknown) => void;
  onUpdateFootprint?: (key: string, value: unknown) => void;
};

const DATA_KEY = 'plInsuranceData';

function loadData(answers: Record<string, unknown>): PropertyLiabilityInsuranceData {
  const raw = answers[DATA_KEY] as PropertyLiabilityInsuranceData | undefined;
  if (raw && Array.isArray(raw.policies)) return raw;
  return { policies: [] };
}

function saveData(onAnswerChange: (key: string, value: unknown) => void, data: PropertyLiabilityInsuranceData) {
  onAnswerChange(DATA_KEY, data);
}

export default function PropertyLiabilityInsuranceSection({ answers, allAnswers, onAnswerChange, onUpdateFootprint }: Props) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [draftPolicy, setDraftPolicy] = useState<PropertyLiabilityPolicy | null>(null);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  const peopleRepo = usePeopleRepository();

  const aboutAnswers = allAnswers?.get('aboutYou') || {};
  const client1Name = (aboutAnswers['fullName'] as string) || 'Client 1';
  const hasSpouse = aboutAnswers['maritalStatus'] === 'married' || aboutAnswers['maritalStatus'] === 'common_law';
  const client2Name = (aboutAnswers['spouseName'] as string) || 'Client 2';

  const data = useMemo(() => loadData(answers), [answers]);
  const knownProperties = useMemo(() => deriveKnownProperties(allAnswers || new Map()), [allAnswers]);
  const knownVehicles = useMemo(() => deriveKnownVehicles(allAnswers || new Map()), [allAnswers]);
  const bankAccounts = useMemo(
    () => deriveBankAccounts(allAnswers || new Map(), client1Name, client2Name, hasSpouse),
    [allAnswers, client1Name, client2Name, hasSpouse],
  );
  const creditCards = useMemo(
    () => deriveCreditCards(allAnswers || new Map(), client1Name, client2Name),
    [allAnswers, client1Name, client2Name],
  );

  const insuranceBrokers = useMemo(() => peopleRepo.getProfessionals('insurance'), [peopleRepo]);

  const [showAddBroker, setShowAddBroker] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  const addBroker = async (name: string, firm: string, phone: string, email: string) => {
    const entry = await peopleRepo.createPerson(name, {
      personType: 'professional',
      professionalCategory: 'insurance',
      firm: firm || undefined,
      phone: phone || undefined,
      email: email || undefined,
    });
    if (entry && draftPolicy) {
      setDraftPolicy({ ...draftPolicy, brokerProfessionalId: entry.id, brokerName: entry.displayName });
    }
    setShowAddBroker(false);
  };

  const addCreditCard = (cardLabel: string, issuer: string, owner: string) => {
    const newId = generateCreditCardId();
    const footprint = allAnswers?.get('financialFootprint') || {};
    const existing = (footprint['creditCardsData'] as Array<Record<string, unknown>>) || [];
    const newCard: Record<string, unknown> = {
      id: newId,
      cardLabel: cardLabel || undefined,
      issuer: issuer || undefined,
      responsibleParty: owner,
    };
    const updated = [...existing, newCard];
    onUpdateFootprint?.('creditCardsData', updated);
    const label = cardLabel || issuer || 'Credit Card';
    if (draftPolicy) {
      setDraftPolicy({ ...draftPolicy, paymentSourceId: newId, paymentSourceType: 'credit_card' as PaymentSourceType, paymentSourceLabel: label });
    }
    setShowAddCard(false);
  };

  const setPropertyStatus = (propertyEntityId: string, status: PropertyInsuranceStatus) => {
    const existing = data.propertyInsuranceStatuses || [];
    const filtered = existing.filter((e) => e.propertyEntityId !== propertyEntityId);
    const updated = [...filtered, { propertyEntityId, status }];
    updateData({ propertyInsuranceStatuses: updated });
  };

  const getPropertyStatus = (propertyEntityId: string): PropertyInsuranceStatus | undefined => {
    return data.propertyInsuranceStatuses?.find((e) => e.propertyEntityId === propertyEntityId)?.status;
  };

  const addBankAccount = (institutionName: string, accountType: string, owner: string) => {
    const newId = generateBankAccountId();
    const footprint = allAnswers?.get('financialFootprint') || {};
    const bankingStructure = (footprint['bankingStructure'] as string) || '';
    const dataKey = !hasSpouse ? 'client1InstitutionsData'
      : bankingStructure === 'individual' ? (owner === 'client2' ? 'client2InstitutionsData' : 'client1InstitutionsData')
      : bankingStructure === 'joint' ? 'jointInstitutionsData'
      : bankingStructure === 'mixed' ? (owner === 'client2' ? 'mixedClient2InstitutionsData' : owner === 'joint' ? 'mixedJointInstitutionsData' : 'mixedClient1InstitutionsData')
      : 'client1InstitutionsData';
    const existing = (footprint[dataKey] as Array<Record<string, unknown>>) || [];
    const newInstitution: Record<string, unknown> = {
      id: newId,
      name: institutionName,
      accountType,
      accountOwners: [owner],
    };
    const updated = [...existing, newInstitution];
    const countKey = dataKey.replace('InstitutionsData', 'InstitutionsCount');
    onUpdateFootprint?.(dataKey, updated);
    onUpdateFootprint?.(countKey, String(updated.length));
    if (draftPolicy) {
      setDraftPolicy({ ...draftPolicy, paymentSourceId: newId, paymentSourceType: 'bank_account', paymentSourceLabel: `${institutionName}${accountType ? ' — ' + accountType : ''}` });
    }
    setShowAddBank(false);
  };

  const updatePolicies = useCallback((updater: (policies: PropertyLiabilityPolicy[]) => PropertyLiabilityPolicy[]) => {
    const newData = { ...data, policies: updater(data.policies) };
    saveData(onAnswerChange, newData);
  }, [data, onAnswerChange]);

  const updateData = useCallback((updates: Partial<PropertyLiabilityInsuranceData>) => {
    const newData = { ...data, ...updates };
    saveData(onAnswerChange, newData);
  }, [data, onAnswerChange]);

  const startNewPolicy = (type: InsurancePolicyType) => {
    setDraftPolicy(emptyPolicy(type));
    setEditingPolicyId(null);
    if (type === 'property') setScreen('propertyPolicy');
    else if (type === 'auto') setScreen('autoPolicy');
    else if (type === 'umbrella') setScreen('umbrellaDetail');
    else if (type === 'valuable_articles') setScreen('valuableArticlesDetail');
    else setScreen('propertyPolicy');
  };

  const startEditPolicy = (policy: PropertyLiabilityPolicy) => {
    setDraftPolicy({ ...policy });
    setEditingPolicyId(policy.id);
    if (policy.policyType === 'property') setScreen('propertyPolicy');
    else if (policy.policyType === 'auto') setScreen('autoPolicy');
    else if (policy.policyType === 'umbrella') setScreen('umbrellaDetail');
    else if (policy.policyType === 'valuable_articles') setScreen('valuableArticlesDetail');
    else setScreen('propertyPolicy');
  };

  const saveDraftPolicy = () => {
    if (!draftPolicy) return;
    if (editingPolicyId) {
      updatePolicies((ps) => ps.map((p) => (p.id === editingPolicyId ? draftPolicy : p)));
    } else {
      updatePolicies((ps) => [...ps, draftPolicy]);
    }
    setDraftPolicy(null);
    setEditingPolicyId(null);
    setScreen('review');
  };

  const deletePolicy = (id: string) => {
    updatePolicies((ps) =>
      ps.map((p) => {
        if (p.id === id) return { ...p, status: 'inactive' as const };
        if (p.underlyingPolicyIds.includes(id)) {
          return { ...p, underlyingPolicyIds: p.underlyingPolicyIds.filter((pid) => pid !== id) };
        }
        return p;
      }),
    );
  };

  const activePolicies = data.policies.filter((p) => p.status === 'active');
  const propertyPolicies = activePolicies.filter((p) => p.policyType === 'property');
  const autoPolicies = activePolicies.filter((p) => p.policyType === 'auto');
  const umbrellaPolicies = activePolicies.filter((p) => p.policyType === 'umbrella');
  const valuableArticlesPolicies = activePolicies.filter((p) => p.policyType === 'valuable_articles');
  const otherPolicies = activePolicies.filter((p) => p.policyType === 'other');

  const formatPremium = (amount?: string, freq?: PremiumFrequency) => {
    if (!amount) return '';
    const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
    const formatted = isNaN(num) ? amount : num.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const freqLabel = freq ? PREMIUM_FREQUENCY_OPTIONS.find((f) => f.value === freq)?.label : '';
    return `${formatted}${freqLabel ? ' ' + freqLabel.toLowerCase() : ''}`;
  };

  // ── SCREEN: INTRO ──
  if (screen === 'intro') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Property &amp; Liability Insurance</h2>
          <p className="text-gray-400 leading-relaxed">
            This section covers insurance that protects your property and household from liability — such as your home, cottage, rental property, vehicles and umbrella coverage.
          </p>
          <p className="text-gray-400 leading-relaxed mt-3">
            We'll connect these policies to information you've already provided so the people helping you can quickly understand what is insured, who to contact, how the premiums are paid and where the policy information is kept.
          </p>
          <p className="text-sm text-gray-500 mt-4 italic">
            Life, disability and critical illness insurance are captured separately.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScreen('propertyGate')}
          className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-blue-600/20"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ── SCREEN: PROPERTY GATE ──
  if (screen === 'propertyGate') {
    return (
      <div className="space-y-6">
        <SectionHeading label="Property Insurance" icon={<Home className="w-4 h-4" />} />

        {knownProperties.length > 0 ? (
          <div className="space-y-4">
            <p className="text-gray-400 leading-relaxed">
              Here are the properties you've already told us about. Let's check which ones are insured.
            </p>
            {knownProperties.map((prop) => {
              const policy = propertyPolicies.find((p) => p.relatedPropertyIds.includes(prop.id));
              const status = getPropertyStatus(prop.id);
              const insuredStatus = policy ? 'insured' : status;
              return (
                <div key={prop.id} className={sectionCardClass}>
                  <h3 className="text-lg font-semibold text-white">{prop.name}</h3>
                  {prop.propertyType && <p className="text-xs text-gray-500">{prop.propertyType}</p>}
                  {policy ? (
                    <div className="space-y-2 mt-3">
                      <p className="text-sm text-green-400 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Insured — {policy.insurerName || 'Carrier not specified'}
                      </p>
                      <button
                        type="button"
                        onClick={() => startEditPolicy(policy)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Edit policy details
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-3">Is {prop.name} currently insured?</p>
                      <YesNoCard
                        selectedValue={insuredStatus === 'insured' ? 'yes' : insuredStatus === 'not_insured' ? 'no' : insuredStatus === 'not_sure' ? 'not_sure' : ''}
                        onClick={(v) => {
                          if (v === 'yes') {
                            setPropertyStatus(prop.id, 'insured');
                            const p = emptyPolicy('property');
                            p.relatedPropertyIds = [prop.id];
                            p.policyName = prop.name + ' Insurance';
                            setDraftPolicy(p);
                            setEditingPolicyId(null);
                            setScreen('propertyPolicy');
                          } else if (v === 'no') {
                            setPropertyStatus(prop.id, 'not_insured');
                          } else if (v === 'not_sure') {
                            setPropertyStatus(prop.id, 'not_sure');
                          }
                        }}
                        options={[
                          { value: 'yes', label: 'Yes' },
                          { value: 'no', label: 'No' },
                          { value: 'not_sure', label: "I'm not sure" },
                        ]}
                      />
                      {insuredStatus === 'not_insured' && (
                        <p className="text-sm text-gray-500 mt-2">Marked as not insured. This will be noted in your review.</p>
                      )}
                      {insuredStatus === 'not_sure' && (
                        <p className="text-sm text-gray-500 mt-2">Marked as not sure. This will be flagged for review.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={sectionCardClass}>
            <p className="text-gray-400">No properties have been added to your Real Estate information yet.</p>
          </div>
        )}

        <div className={sectionCardClass}>
          <h3 className="text-lg font-semibold text-white">Do you have any other property insurance we haven't captured?</h3>
          <YesNoCard
            selectedValue={data.hasOtherCoverage || ''}
            onClick={(v) => {
              updateData({ hasOtherCoverage: v as YesNoNotSure });
              if (v === 'yes') startNewPolicy('other');
              else setScreen('autoGate');
            }}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'not_sure', label: "I'm not sure" },
            ]}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setScreen('autoGate')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
          >
            Continue to Vehicle Insurance
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: PROPERTY POLICY DETAIL ──
  if (screen === 'propertyPolicy' && draftPolicy) {
    return (
      <PolicyDetailEditor
        policy={draftPolicy}
        onChange={setDraftPolicy}
        onSave={saveDraftPolicy}
        onCancel={() => { setDraftPolicy(null); setEditingPolicyId(null); setScreen('propertyGate'); }}
        knownProperties={knownProperties}
        knownVehicles={knownVehicles}
        bankAccounts={bankAccounts}
        creditCards={creditCards}
        insuranceBrokers={insuranceBrokers}
        showAddBroker={showAddBroker}
        onToggleAddBroker={() => setShowAddBroker(!showAddBroker)}
        onAddBroker={addBroker}
        showAddBank={showAddBank}
        onToggleAddBank={() => setShowAddBank(!showAddBank)}
        onAddBankAccount={addBankAccount}
        showAddCard={showAddCard}
        onToggleAddCard={() => setShowAddCard(!showAddCard)}
        onAddCreditCard={addCreditCard}
        hasSpouse={hasSpouse}
        client1Name={client1Name}
        client2Name={client2Name}
        showVacancy={true}
        showRental={knownProperties.some((p) => p.isRental && draftPolicy.relatedPropertyIds.includes(p.id))}
        title="Property Insurance Details"
      />
    );
  }

  // ── SCREEN: AUTO GATE ──
  if (screen === 'autoGate') {
    return (
      <div className="space-y-6">
        <SectionHeading label="Vehicle Insurance" icon={<Car className="w-4 h-4" />} />

        {knownVehicles.length > 0 && (
          <div className={sectionCardClass}>
            <p className="text-gray-400 leading-relaxed mb-4">
              You have these vehicles or recreational assets on file. One auto policy can cover multiple vehicles.
            </p>
            <div className="space-y-2">
              {knownVehicles.map((v) => (
                <div key={v.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <Car className="w-4 h-4 text-gray-500" />
                  {v.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {autoPolicies.length > 0 ? (
          <div className="space-y-3">
            {autoPolicies.map((p) => (
              <SummaryCard
                key={p.id}
                title={p.policyName || 'Auto Policy'}
                subtitle={p.insurerName}
                value={formatPremium(p.premiumAmount, p.premiumFrequency)}
                details={[
                  ...(p.relatedVehicleIds.length > 0 ? [{ label: 'Vehicles', value: p.relatedVehicleIds.map((id) => knownVehicles.find((v) => v.id === id)?.name || id).join(', ') }] : []),
                  ...(p.brokerName ? [{ label: 'Broker', value: p.brokerName }] : []),
                  ...(p.paymentSourceLabel ? [{ label: 'Payment', value: p.paymentSourceLabel }] : []),
                ]}
                onEdit={() => startEditPolicy(p)}
                onDelete={() => deletePolicy(p.id)}
              />
            ))}
            <AddButton label="Add another auto policy" onClick={() => startNewPolicy('auto')} />
          </div>
        ) : (
          <div className={sectionCardClass}>
            <h3 className="text-lg font-semibold text-white">Do you have auto insurance?</h3>
            <YesNoCard
              selectedValue=""
              onClick={(v) => {
                if (v === 'yes') startNewPolicy('auto');
                else setScreen('rvGate');
              }}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'not_sure', label: "I'm not sure" },
              ]}
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setScreen('rvGate')}
            className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-gray-200 font-medium transition-colors"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: AUTO POLICY DETAIL ──
  if (screen === 'autoPolicy' && draftPolicy) {
    return (
      <PolicyDetailEditor
        policy={draftPolicy}
        onChange={setDraftPolicy}
        onSave={saveDraftPolicy}
        onCancel={() => { setDraftPolicy(null); setEditingPolicyId(null); setScreen('autoGate'); }}
        knownProperties={knownProperties}
        knownVehicles={knownVehicles}
        bankAccounts={bankAccounts}
        creditCards={creditCards}
        insuranceBrokers={insuranceBrokers}
        showAddBroker={showAddBroker}
        onToggleAddBroker={() => setShowAddBroker(!showAddBroker)}
        onAddBroker={addBroker}
        showAddBank={showAddBank}
        onToggleAddBank={() => setShowAddBank(!showAddBank)}
        onAddBankAccount={addBankAccount}
        showAddCard={showAddCard}
        onToggleAddCard={() => setShowAddCard(!showAddCard)}
        onAddCreditCard={addCreditCard}
        hasSpouse={hasSpouse}
        client1Name={client1Name}
        client2Name={client2Name}
        showVehicleMultiSelect={true}
        title="Auto Insurance Details"
      />
    );
  }

  // ── SCREEN: RV GATE ──
  if (screen === 'rvGate') {
    const rvAssets = knownVehicles.filter((v) => {
      const sub = (v.subtype || '').toLowerCase();
      return sub.includes('boat') || sub.includes('motorcycle') || sub.includes('atv') || sub.includes('snowmobile') || sub.includes('trailer') || sub.includes('motorhome') || sub.includes('rv');
    });
    return (
      <div className="space-y-6">
        <SectionHeading label="Recreational Vehicles &amp; Boats" />

        {rvAssets.length > 0 ? (
          <div className="space-y-3">
            {rvAssets.map((rv) => {
              const linkedPolicy = activePolicies.find((p) => p.relatedOtherAssetIds.includes(rv.id) || p.relatedVehicleIds.includes(rv.id));
              return (
                <div key={rv.id} className={sectionCardClass}>
                  <h3 className="text-lg font-semibold text-white">{rv.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{rv.subtype}</p>
                  {linkedPolicy ? (
                    <p className="text-sm text-green-400">
                      Covered under: {linkedPolicy.policyName || POLICY_TYPE_LABELS[linkedPolicy.policyType]}
                    </p>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-400 mb-3">How is {rv.name} insured?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <OptionButton label="Covered under an existing policy" selected={false} onClick={() => {
                          const p = emptyPolicy('property');
                          p.relatedOtherAssetIds = [rv.id];
                          p.policyName = rv.name + ' Coverage';
                          setDraftPolicy(p);
                          setEditingPolicyId(null);
                          setScreen('propertyPolicy');
                        }} />
                        <OptionButton label="Has its own policy" selected={false} onClick={() => startNewPolicy('other')} />
                        <OptionButton label="Not insured" selected={false} onClick={() => {}} />
                        <OptionButton label="I'm not sure" selected={false} onClick={() => {}} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={sectionCardClass}>
            <p className="text-gray-400">No recreational vehicles or boats have been identified in your assets.</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setScreen('valuableArticlesGate')}
            className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-gray-200 font-medium transition-colors"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: VALUABLE ARTICLES GATE ──
  if (screen === 'valuableArticlesGate') {
    return (
      <div className="space-y-6">
        <SectionHeading label="Valuable Articles" />
        <div className={sectionCardClass}>
          <h3 className="text-lg font-semibold text-white">
            Do you have additional insurance for any particularly valuable belongings?
          </h3>
          <p className="text-sm text-gray-400">
            For example, jewellery, artwork, watches, collectibles, musical instruments or other valuable property.
          </p>
          <YesNoCard
            selectedValue={data.hasValuableArticles || ''}
            onClick={(v) => {
              updateData({ hasValuableArticles: v as YesNoNotSure });
              if (v === 'yes') startNewPolicy('valuable_articles');
              else setScreen('umbrellaGate');
            }}
          />
        </div>

        {valuableArticlesPolicies.length > 0 && (
          <div className="space-y-3">
            {valuableArticlesPolicies.map((p) => (
              <SummaryCard
                key={p.id}
                title={p.valuableArticleDescription || 'Valuable Articles'}
                subtitle={p.insurerName}
                onEdit={() => startEditPolicy(p)}
                onDelete={() => deletePolicy(p.id)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setScreen('umbrellaGate')}
            className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-gray-200 font-medium transition-colors"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: VALUABLE ARTICLES DETAIL ──
  if (screen === 'valuableArticlesDetail' && draftPolicy) {
    return (
      <PolicyDetailEditor
        policy={draftPolicy}
        onChange={setDraftPolicy}
        onSave={saveDraftPolicy}
        onCancel={() => { setDraftPolicy(null); setEditingPolicyId(null); setScreen('valuableArticlesGate'); }}
        knownProperties={knownProperties}
        knownVehicles={knownVehicles}
        bankAccounts={bankAccounts}
        creditCards={creditCards}
        insuranceBrokers={insuranceBrokers}
        showAddBroker={showAddBroker}
        onToggleAddBroker={() => setShowAddBroker(!showAddBroker)}
        onAddBroker={addBroker}
        showAddBank={showAddBank}
        onToggleAddBank={() => setShowAddBank(!showAddBank)}
        onAddBankAccount={addBankAccount}
        showAddCard={showAddCard}
        onToggleAddCard={() => setShowAddCard(!showAddCard)}
        onAddCreditCard={addCreditCard}
        hasSpouse={hasSpouse}
        client1Name={client1Name}
        client2Name={client2Name}
        showValuableArticles={true}
        title="Valuable Articles Insurance"
      />
    );
  }

  // ── SCREEN: UMBRELLA GATE ──
  if (screen === 'umbrellaGate') {
    return (
      <div className="space-y-6">
        <SectionHeading label="Additional Liability Protection" icon={<Umbrella className="w-4 h-4" />} />
        <div className={sectionCardClass}>
          <h3 className="text-lg font-semibold text-white">
            Do you have a personal umbrella or excess liability insurance policy?
          </h3>
          <p className="text-sm text-gray-400">
            Umbrella or excess liability insurance provides additional liability protection above certain home, auto or other underlying policies.
          </p>
          <YesNoCard
            selectedValue={data.hasUmbrella || ''}
            onClick={(v) => {
              updateData({ hasUmbrella: v as YesNoNotSure });
              if (v === 'yes') startNewPolicy('umbrella');
              else setScreen('householdManager');
            }}
          />
        </div>

        {umbrellaPolicies.length > 0 && (
          <div className="space-y-3">
            {umbrellaPolicies.map((p) => (
              <SummaryCard
                key={p.id}
                title="Umbrella Liability"
                subtitle={p.insurerName}
                value={p.umbrellaCoverageAmount ? `Coverage: $${parseFloat(p.umbrellaCoverageAmount).toLocaleString()}` : ''}
                details={p.underlyingPolicyIds.length > 0 ? [{ label: 'Underlying', value: p.underlyingPolicyIds.map((id) => activePolicies.find((ap) => ap.id === id)?.policyName || POLICY_TYPE_LABELS[activePolicies.find((ap) => ap.id === id)?.policyType || 'other']).join(', ') }] : []}
                onEdit={() => startEditPolicy(p)}
                onDelete={() => deletePolicy(p.id)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setScreen('householdManager')}
            className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-gray-200 font-medium transition-colors"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: UMBRELLA DETAIL ──
  if (screen === 'umbrellaDetail' && draftPolicy) {
    return (
      <PolicyDetailEditor
        policy={draftPolicy}
        onChange={setDraftPolicy}
        onSave={saveDraftPolicy}
        onCancel={() => { setDraftPolicy(null); setEditingPolicyId(null); setScreen('umbrellaGate'); }}
        knownProperties={knownProperties}
        knownVehicles={knownVehicles}
        bankAccounts={bankAccounts}
        creditCards={creditCards}
        insuranceBrokers={insuranceBrokers}
        showAddBroker={showAddBroker}
        onToggleAddBroker={() => setShowAddBroker(!showAddBroker)}
        onAddBroker={addBroker}
        showAddBank={showAddBank}
        onToggleAddBank={() => setShowAddBank(!showAddBank)}
        onAddBankAccount={addBankAccount}
        showAddCard={showAddCard}
        onToggleAddCard={() => setShowAddCard(!showAddCard)}
        onAddCreditCard={addCreditCard}
        hasSpouse={hasSpouse}
        client1Name={client1Name}
        client2Name={client2Name}
        showUmbrella={true}
        underlyingPolicyOptions={activePolicies.filter((p) => p.id !== draftPolicy.id)}
        title="Umbrella / Excess Liability Details"
      />
    );
  }

  // ── SCREEN: HOUSEHOLD MANAGER ──
  if (screen === 'householdManager') {
    const manager = data.householdManager;
    return (
      <div className="space-y-6">
        <SectionHeading label="Who Manages the Insurance" />
        <div className={sectionCardClass}>
          <h3 className="text-lg font-semibold text-white">
            Who normally looks after your household's property and liability insurance?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
            <OptionButton label={client1Name} selected={manager?.managerType === 'client1'} onClick={() => updateData({ householdManager: { managerType: 'client1' } })} />
            {hasSpouse && <OptionButton label={client2Name} selected={manager?.managerType === 'client2'} onClick={() => updateData({ householdManager: { managerType: 'client2' } })} />}
            {hasSpouse && <OptionButton label="Both" selected={manager?.managerType === 'both'} onClick={() => updateData({ householdManager: { managerType: 'both' } })} />}
            <OptionButton label="Another person" selected={manager?.managerType === 'other_person'} onClick={() => updateData({ householdManager: { managerType: 'other_person' } })} />
            <OptionButton label="Our insurance broker largely handles it" selected={manager?.managerType === 'broker'} onClick={() => updateData({ householdManager: { managerType: 'broker' } })} />
            <OptionButton label="I'm not sure" selected={manager?.managerType === 'not_sure'} onClick={() => updateData({ householdManager: { managerType: 'not_sure' } })} />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setScreen('continuity')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: CONTINUITY ──
  if (screen === 'continuity') {
    return (
      <div className="space-y-6">
        <SectionHeading label="Continuity Notes" />
        <div className={sectionCardClass}>
          <h3 className="text-lg font-semibold text-white">
            If someone else had to look after these policies tomorrow, is there anything they would need to know?
          </h3>
          <p className="text-sm text-gray-400">
            For example, a broker who handles everything for you, a seasonal property that needs regular checks, a vehicle stored somewhere else, an upcoming renewal, or a policy with special requirements.
          </p>
          <textarea
            value={data.continuityNotes || ''}
            onChange={(e) => updateData({ continuityNotes: e.target.value })}
            placeholder="Optional — add any notes that would help someone step in"
            rows={4}
            className={inputClass}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setScreen('review')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
          >
            Review
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: REVIEW ──
  if (screen === 'review') {
    return (
      <div className="space-y-6">
        <SectionHeading label="Review" />
        <p className="text-gray-400">Here's a summary of your property and liability insurance.</p>

        {activePolicies.length === 0 && (
          <div className={sectionCardClass}>
            <p className="text-gray-400">No insurance policies have been added yet.</p>
          </div>
        )}

        {propertyPolicies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Property Insurance</h3>
            <div className="space-y-3">
              {propertyPolicies.map((p) => (
                <SummaryCard
                  key={p.id}
                  title={p.policyName || 'Property Insurance'}
                  subtitle={p.insurerName}
                  value={formatPremium(p.premiumAmount, p.premiumFrequency)}
                  details={[
                    ...(p.relatedPropertyIds.length > 0 ? [{ label: 'Properties', value: p.relatedPropertyIds.map((id) => knownProperties.find((kp) => kp.id === id)?.name || id).join(', ') }] : []),
                    ...(p.brokerName ? [{ label: 'Broker', value: p.brokerName }] : []),
                    ...(p.paymentSourceLabel ? [{ label: 'Payment', value: p.paymentSourceLabel }] : []),
                    ...(p.documentLocationLabel ? [{ label: 'Documents', value: p.documentLocationLabel }] : []),
                    ...(p.vacancyNotes ? [{ label: 'Vacancy requirements', value: p.vacancyNotes }] : []),
                  ]}
                  onEdit={() => startEditPolicy(p)}
                  onDelete={() => deletePolicy(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {autoPolicies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Auto Insurance</h3>
            <div className="space-y-3">
              {autoPolicies.map((p) => (
                <SummaryCard
                  key={p.id}
                  title={p.policyName || 'Auto Policy'}
                  subtitle={p.insurerName}
                  value={formatPremium(p.premiumAmount, p.premiumFrequency)}
                  details={[
                    ...(p.relatedVehicleIds.length > 0 ? [{ label: 'Vehicles', value: p.relatedVehicleIds.map((id) => knownVehicles.find((v) => v.id === id)?.name || id).join(', ') }] : []),
                    ...(p.brokerName ? [{ label: 'Broker', value: p.brokerName }] : []),
                    ...(p.paymentSourceLabel ? [{ label: 'Payment', value: p.paymentSourceLabel }] : []),
                  ]}
                  onEdit={() => startEditPolicy(p)}
                  onDelete={() => deletePolicy(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {umbrellaPolicies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Umbrella Liability</h3>
            <div className="space-y-3">
              {umbrellaPolicies.map((p) => (
                <SummaryCard
                  key={p.id}
                  title="Umbrella Liability"
                  subtitle={p.insurerName}
                  value={p.umbrellaCoverageAmount ? `Coverage: $${parseFloat(p.umbrellaCoverageAmount).toLocaleString()}` : ''}
                  details={[
                    ...(p.underlyingPolicyIds.length > 0 ? [{ label: 'Underlying', value: p.underlyingPolicyIds.map((id) => activePolicies.find((ap) => ap.id === id)?.policyName || POLICY_TYPE_LABELS[activePolicies.find((ap) => ap.id === id)?.policyType || 'other']).join(', ') }] : []),
                    ...(p.documentLocationLabel ? [{ label: 'Documents', value: p.documentLocationLabel }] : []),
                  ]}
                  onEdit={() => startEditPolicy(p)}
                  onDelete={() => deletePolicy(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {valuableArticlesPolicies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Valuable Articles</h3>
            <div className="space-y-3">
              {valuableArticlesPolicies.map((p) => (
                <SummaryCard
                  key={p.id}
                  title={p.valuableArticleDescription || 'Valuable Articles'}
                  subtitle={p.insurerName}
                  onEdit={() => startEditPolicy(p)}
                  onDelete={() => deletePolicy(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {otherPolicies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Other Coverage</h3>
            <div className="space-y-3">
              {otherPolicies.map((p) => (
                <SummaryCard
                  key={p.id}
                  title={p.policyName || 'Other Property Coverage'}
                  subtitle={p.insurerName}
                  value={formatPremium(p.premiumAmount, p.premiumFrequency)}
                  onEdit={() => startEditPolicy(p)}
                  onDelete={() => deletePolicy(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {data.continuityNotes && (
          <div className={sectionCardClass}>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Continuity Notes</h3>
            <p className="text-sm text-gray-300">{data.continuityNotes}</p>
          </div>
        )}

        <div className={sectionCardClass}>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Add Another Policy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AddButton label="Add Property Insurance" onClick={() => startNewPolicy('property')} />
            <AddButton label="Add Auto Insurance" onClick={() => startNewPolicy('auto')} />
            <AddButton label="Add Umbrella Coverage" onClick={() => startNewPolicy('umbrella')} />
            <AddButton label="Add Other Coverage" onClick={() => startNewPolicy('other')} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Policy Detail Editor (shared across policy types) ──

interface PolicyDetailEditorProps {
  policy: PropertyLiabilityPolicy;
  onChange: (p: PropertyLiabilityPolicy) => void;
  onSave: () => void;
  onCancel: () => void;
  knownProperties: Array<{ id: string; name: string; isRental?: boolean }>;
  knownVehicles: Array<{ id: string; name: string }>;
  bankAccounts: KnownPaymentSource[];
  creditCards: KnownCreditCard[];
  insuranceBrokers: Array<{ id: string; displayName: string }>;
  showAddBroker: boolean;
  onToggleAddBroker: () => void;
  onAddBroker: (name: string, firm: string, phone: string, email: string) => void;
  showAddBank: boolean;
  onToggleAddBank: () => void;
  onAddBankAccount: (institutionName: string, accountType: string, owner: string) => void;
  showAddCard: boolean;
  onToggleAddCard: () => void;
  onAddCreditCard: (cardLabel: string, issuer: string, owner: string) => void;
  hasSpouse: boolean;
  client1Name: string;
  client2Name: string;
  showVacancy?: boolean;
  showRental?: boolean;
  showVehicleMultiSelect?: boolean;
  showUmbrella?: boolean;
  showValuableArticles?: boolean;
  underlyingPolicyOptions?: PropertyLiabilityPolicy[];
  title: string;
}

function PolicyDetailEditor({
  policy,
  onChange,
  onSave,
  onCancel,
  knownProperties,
  knownVehicles,
  bankAccounts,
  creditCards,
  insuranceBrokers,
  showAddBroker,
  onToggleAddBroker,
  onAddBroker,
  showAddBank,
  onToggleAddBank,
  onAddBankAccount,
  showAddCard,
  onToggleAddCard,
  onAddCreditCard,
  hasSpouse,
  client1Name,
  client2Name,
  showVacancy,
  showRental,
  showVehicleMultiSelect,
  showUmbrella,
  showValuableArticles,
  underlyingPolicyOptions,
  title,
}: PolicyDetailEditorProps) {
  const [brokerNameInput, setBrokerNameInput] = useState('');
  const [brokerFirmInput, setBrokerFirmInput] = useState('');
  const [brokerPhoneInput, setBrokerPhoneInput] = useState('');
  const [brokerEmailInput, setBrokerEmailInput] = useState('');
  const [bankInstitutionInput, setBankInstitutionInput] = useState('');
  const [bankAccountTypeInput, setBankAccountTypeInput] = useState('');
  const [bankOwnerInput, setBankOwnerInput] = useState('client1');
  const [cardLabelInput, setCardLabelInput] = useState('');
  const [cardIssuerInput, setCardIssuerInput] = useState('');
  const [cardOwnerInput, setCardOwnerInput] = useState('client1');
  const update = (updates: Partial<PropertyLiabilityPolicy>) => onChange({ ...policy, ...updates });

  const toggleProperty = (propId: string) => {
    const ids = policy.relatedPropertyIds.includes(propId)
      ? policy.relatedPropertyIds.filter((id) => id !== propId)
      : [...policy.relatedPropertyIds, propId];
    update({ relatedPropertyIds: ids });
  };

  const toggleVehicle = (vehId: string) => {
    const ids = policy.relatedVehicleIds.includes(vehId)
      ? policy.relatedVehicleIds.filter((id) => id !== vehId)
      : [...policy.relatedVehicleIds, vehId];
    update({ relatedVehicleIds: ids });
  };

  const toggleUnderlying = (polId: string) => {
    const ids = policy.underlyingPolicyIds.includes(polId)
      ? policy.underlyingPolicyIds.filter((id) => id !== polId)
      : [...policy.underlyingPolicyIds, polId];
    update({ underlyingPolicyIds: ids });
  };

  const handleDocLocationChange = (ref: DocumentLocationRef | DocumentLocationRef[] | undefined) => {
    if (ref && !Array.isArray(ref)) {
      update({ documentLocationId: ref.locationId, documentLocationLabel: ref.label });
    } else if (!ref) {
      update({ documentLocationId: undefined, documentLocationLabel: undefined });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      </div>

      {/* Insurer */}
      <div>
        <label className={labelClass}>Who provides the insurance?</label>
        <input
          type="text"
          value={policy.insurerName || ''}
          onChange={(e) => update({ insurerName: e.target.value })}
          placeholder="e.g., Intact, Aviva, TD Insurance"
          className={inputClass}
        />
      </div>

      {/* Broker */}
      <div>
        <label className={labelClass}>Who would you contact about this policy?</label>
        {insuranceBrokers.length > 0 && (
          <div className="space-y-2 mb-2">
            {insuranceBrokers.map((b) => (
              <OptionButton
                key={b.id}
                label={b.displayName}
                selected={policy.brokerProfessionalId === b.id}
                onClick={() => update({ brokerProfessionalId: b.id, brokerName: b.displayName })}
              />
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
          <OptionButton label="+ Add insurance broker / agent" selected={showAddBroker} onClick={onToggleAddBroker} />
          <OptionButton label="I deal directly with the insurance company" selected={policy.brokerProfessionalId === '__direct'} onClick={() => update({ brokerProfessionalId: '__direct', brokerName: undefined })} />
          <OptionButton label="I'm not sure" selected={!policy.brokerProfessionalId && !policy.brokerName} onClick={() => update({ brokerProfessionalId: undefined, brokerName: undefined })} />
        </div>
        {showAddBroker && (
          <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <input type="text" value={brokerNameInput} onChange={(e) => setBrokerNameInput(e.target.value)} placeholder="Broker or agent name" className={inputClass} />
            <input type="text" value={brokerFirmInput} onChange={(e) => setBrokerFirmInput(e.target.value)} placeholder="Company / firm (optional)" className={inputClass} />
            <input type="text" value={brokerPhoneInput} onChange={(e) => setBrokerPhoneInput(e.target.value)} placeholder="Phone (optional)" className={inputClass} />
            <input type="text" value={brokerEmailInput} onChange={(e) => setBrokerEmailInput(e.target.value)} placeholder="Email (optional)" className={inputClass} />
            <button
              type="button"
              disabled={!brokerNameInput.trim()}
              onClick={() => onAddBroker(brokerNameInput.trim(), brokerFirmInput.trim(), brokerPhoneInput.trim(), brokerEmailInput.trim())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Broker to Professional Team
            </button>
          </div>
        )}
      </div>

      {/* Policy number */}
      <div>
        <label className={labelClass}>Policy number (optional)</label>
        <input
          type="text"
          value={policy.policyNumber || ''}
          onChange={(e) => update({ policyNumber: e.target.value })}
          placeholder="Enter policy number if known"
          className={inputClass}
        />
      </div>

      {/* Premium amount */}
      <div>
        <label className={labelClass}>How much is the premium?</label>
        <input
          type="text"
          value={policy.premiumAmount || ''}
          onChange={(e) => update({ premiumAmount: e.target.value })}
          placeholder="e.g., 2,400"
          className={inputClass}
        />
      </div>

      {/* Premium frequency */}
      <div>
        <label className={labelClass}>How often is it paid?</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {PREMIUM_FREQUENCY_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              selected={policy.premiumFrequency === opt.value}
              onClick={() => update({ premiumFrequency: opt.value })}
            />
          ))}
        </div>
      </div>

      {/* Payment source */}
      <div>
        <label className={labelClass}>How is this premium paid?</label>
        {bankAccounts.length > 0 && (
          <div className="space-y-2 mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Bank Accounts</p>
            {bankAccounts.map((acct) => (
              <OptionButton
                key={acct.id}
                label={`${acct.name} (${acct.owner})`}
                selected={policy.paymentSourceId === acct.id}
                onClick={() => update({ paymentSourceId: acct.id, paymentSourceType: 'bank_account' as PaymentSourceType, paymentSourceLabel: acct.name, paymentAccountId: undefined, paymentMethodType: undefined, paymentAccountLabel: undefined })}
              />
            ))}
          </div>
        )}
        {creditCards.length > 0 && (
          <div className="space-y-2 mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Credit Cards</p>
            {creditCards.map((card) => (
              <OptionButton
                key={card.id}
                label={`${card.name} (${card.owner})`}
                selected={policy.paymentSourceId === card.id}
                onClick={() => update({ paymentSourceId: card.id, paymentSourceType: 'credit_card' as PaymentSourceType, paymentSourceLabel: card.name, paymentAccountId: undefined, paymentMethodType: undefined, paymentAccountLabel: undefined })}
              />
            ))}
          </div>
        )}
        {bankAccounts.length === 0 && creditCards.length === 0 && (
          <p className="text-sm text-gray-400 italic mb-2">
            No payment accounts have been added to your Financial Footprint yet.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
          <OptionButton label="+ Add a bank account" selected={showAddBank} onClick={onToggleAddBank} />
          <OptionButton label="+ Add a credit card" selected={showAddCard} onClick={onToggleAddCard} />
          <OptionButton label="Paid another way" selected={policy.paymentSourceType === 'other'} onClick={() => update({ paymentSourceType: 'other' as PaymentSourceType, paymentSourceId: undefined, paymentSourceLabel: undefined })} />
          <OptionButton label="I'm not sure" selected={policy.paymentSourceType === 'not_sure' || (!policy.paymentSourceType && !policy.paymentSourceId)} onClick={() => update({ paymentSourceType: 'not_sure' as PaymentSourceType, paymentSourceId: undefined, paymentSourceLabel: undefined })} />
        </div>
        {showAddBank && (
          <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700 mt-2">
            <input type="text" value={bankInstitutionInput} onChange={(e) => setBankInstitutionInput(e.target.value)} placeholder="Institution name (e.g., RBC)" className={inputClass} />
            <input type="text" value={bankAccountTypeInput} onChange={(e) => setBankAccountTypeInput(e.target.value)} placeholder="Account type (e.g., Chequing)" className={inputClass} />
            {hasSpouse && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Account owner</p>
                <div className="grid grid-cols-3 gap-2">
                  <OptionButton label={client1Name} selected={bankOwnerInput === 'client1'} onClick={() => setBankOwnerInput('client1')} />
                  <OptionButton label={client2Name} selected={bankOwnerInput === 'client2'} onClick={() => setBankOwnerInput('client2')} />
                  <OptionButton label="Joint" selected={bankOwnerInput === 'joint'} onClick={() => setBankOwnerInput('joint')} />
                </div>
              </div>
            )}
            <button
              type="button"
              disabled={!bankInstitutionInput.trim()}
              onClick={() => onAddBankAccount(bankInstitutionInput.trim(), bankAccountTypeInput.trim(), bankOwnerInput)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Bank Account to Financial Footprint
            </button>
          </div>
        )}
        {showAddCard && (
          <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700 mt-2">
            <input type="text" value={cardLabelInput} onChange={(e) => setCardLabelInput(e.target.value)} placeholder="Card label (e.g., TD Visa)" className={inputClass} />
            <input type="text" value={cardIssuerInput} onChange={(e) => setCardIssuerInput(e.target.value)} placeholder="Issuer (optional, e.g., TD Bank)" className={inputClass} />
            {hasSpouse && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Card owner</p>
                <div className="grid grid-cols-3 gap-2">
                  <OptionButton label={client1Name} selected={cardOwnerInput === 'client1'} onClick={() => setCardOwnerInput('client1')} />
                  <OptionButton label={client2Name} selected={cardOwnerInput === 'client2'} onClick={() => setCardOwnerInput('client2')} />
                  <OptionButton label="Joint" selected={cardOwnerInput === 'joint'} onClick={() => setCardOwnerInput('joint')} />
                </div>
              </div>
            )}
            <button
              type="button"
              disabled={!cardLabelInput.trim()}
              onClick={() => onAddCreditCard(cardLabelInput.trim(), cardIssuerInput.trim(), cardOwnerInput)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Credit Card to Financial Footprint
            </button>
          </div>
        )}
      </div>
      <div>
        <label className={labelClass}>Renewal date (optional but useful)</label>
        <input
          type="date"
          value={policy.renewalDate || ''}
          onChange={(e) => update({ renewalDate: e.target.value })}
          className={inputClass}
        />
        {policy.renewalDate && !/^\d{4}-\d{2}-\d{2}$/.test(policy.renewalDate) && (
          <p className="text-xs text-amber-400 mt-1">
            Previous entry: {policy.renewalDate} (client-reported text — select a structured date to replace)
          </p>
        )}
      </div>

      {/* Property multi-select */}
      {knownProperties.length > 0 && policy.policyType === 'property' && (
        <div>
          <label className={labelClass}>Which properties are covered by this policy?</label>
          <div className="space-y-2">
            {knownProperties.map((prop) => (
              <OptionButton
                key={prop.id}
                label={prop.name}
                selected={policy.relatedPropertyIds.includes(prop.id)}
                onClick={() => toggleProperty(prop.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vehicle multi-select */}
      {showVehicleMultiSelect && knownVehicles.length > 0 && (
        <div>
          <label className={labelClass}>Which vehicles are covered by this policy?</label>
          <div className="space-y-2">
            {knownVehicles.map((veh) => (
              <OptionButton
                key={veh.id}
                label={veh.name}
                selected={policy.relatedVehicleIds.includes(veh.id)}
                onClick={() => toggleVehicle(veh.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vacancy */}
      {showVacancy && (
        <div>
          <label className={labelClass}>
            Do you know whether this policy has any requirements if the property is left vacant or unoccupied for an extended period?
          </label>
          <YesNoCard
            selectedValue={policy.vacancyRequirementsKnown || ''}
            onClick={(v) => update({ vacancyRequirementsKnown: v as YesNoNotSure })}
          />
          {policy.vacancyRequirementsKnown === 'yes' && (
            <div className="mt-3">
              <label className={labelClass}>What should someone looking after the property know?</label>
              <textarea
                value={policy.vacancyNotes || ''}
                onChange={(e) => update({ vacancyNotes: e.target.value })}
                placeholder="e.g., Call broker if vacant longer than 30 days. Notify insurer. Keep heating on."
                rows={3}
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Rental / landlord */}
      {showRental && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Does the insurer know this property is rented to others?</label>
            <YesNoCard
              selectedValue={policy.insurerKnowsRental || ''}
              onClick={(v) => update({ insurerKnowsRental: v as YesNoNotSure })}
            />
          </div>
          <div>
            <label className={labelClass}>Do you understand landlord/rental-property coverage to be in place?</label>
            <YesNoCard
              selectedValue={policy.landlordCoverageKnown || ''}
              onClick={(v) => update({ landlordCoverageKnown: v as YesNoNotSure })}
            />
          </div>
        </div>
      )}

      {/* Umbrella-specific */}
      {showUmbrella && (
        <>
          <div>
            <label className={labelClass}>Coverage amount</label>
            <input
              type="text"
              value={policy.umbrellaCoverageAmount || ''}
              onChange={(e) => update({ umbrellaCoverageAmount: e.target.value })}
              placeholder="e.g., 2,000,000"
              className={inputClass}
            />
          </div>
          {underlyingPolicyOptions && underlyingPolicyOptions.length > 0 && (
            <div>
              <label className={labelClass}>Which policies does this umbrella coverage sit above or rely on?</label>
              <div className="space-y-2">
                {underlyingPolicyOptions.map((up) => (
                  <OptionButton
                    key={up.id}
                    label={up.policyName || POLICY_TYPE_LABELS[up.policyType]}
                    selected={policy.underlyingPolicyIds.includes(up.id)}
                    onClick={() => toggleUnderlying(up.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Valuable articles */}
      {showValuableArticles && (
        <div>
          <label className={labelClass}>What is covered?</label>
          <input
            type="text"
            value={policy.valuableArticleDescription || ''}
            onChange={(e) => update({ valuableArticleDescription: e.target.value })}
            placeholder="e.g., Jewellery, artwork, watches"
            className={inputClass}
          />
          <div className="mt-3">
            <label className={labelClass}>Is there a recent appraisal or valuation document?</label>
            <YesNoCard
              selectedValue={policy.hasAppraisal || ''}
              onClick={(v) => update({ hasAppraisal: v as YesNoNotSure })}
            />
          </div>
        </div>
      )}

      {/* Document location */}
      <div>
        <label className={labelClass}>Where could someone find the policy or latest insurance documents?</label>
        <RepoDocumentLocationPicker
          label=""
          value={policy.documentLocationId ? { locationId: policy.documentLocationId, label: policy.documentLocationLabel || '' } : undefined}
          onChange={handleDocLocationChange}
          placeholder="Select or add a location"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-gray-400 hover:text-gray-200 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-all"
        >
          Save Policy
        </button>
      </div>
    </div>
  );
}
