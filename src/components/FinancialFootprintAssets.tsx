import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Landmark,
  TrendingUp,
  Briefcase,
  GraduationCap,
  HandCoins,
  MoreHorizontal,
  Check,
  Plus,
  ChevronRight,
  ArrowRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  InvestmentAccount,
  PensionRecord,
  EquityCompensation,
  ReceivableRecord,
  OtherAssetRecord,
  INVESTMENT_ACCOUNT_TYPES,
  PENSION_TYPES,
  EQUITY_AWARD_TYPES,
} from '../lib/financialAssetTypes';
import { getFinancialAdvisors } from '../lib/referentialIntegrity';
import { getClientOwnedCorpNames } from '../lib/corporateOwnership';
import InvestmentsIntake from './InvestmentsIntake';
import PensionsIntake from './PensionsIntake';
import EmployerEquityIntake from './EmployerEquityIntake';
import ReceivablesIntake from './ReceivablesIntake';
import OtherAssetsIntake from './OtherAssetsIntake';

type Props = {
  answers: Record<string, unknown>;
  allAnswers?: Map<string, Record<string, unknown>>;
  onAnswerChange: (key: string, value: unknown) => void;
};

type Screen =
  | 'intro'
  | 'banking'
  | 'investments'
  | 'investmentsType'
  | 'investmentsIntake'
  | 'pensions'
  | 'pensionsClient'
  | 'pensionsType'
  | 'pensionsIntake'
  | 'equity'
  | 'equityClient'
  | 'equityType'
  | 'equityIntake'
  | 'receivables'
  | 'receivablesIntake'
  | 'other'
  | 'otherIntake'
  | 'review'
  | 'reviewAddCategory';

export default function FinancialFootprintAssets({
  answers,
  allAnswers,
  onAnswerChange,
}: Props) {
  const aboutYou = allAnswers?.get('aboutYou') || {};
  const client1Name = (aboutYou['fullName'] as string) || 'Client 1';
  const client2Name = (aboutYou['spouseName'] as string) || 'Client 2';
  const maritalStatus = aboutYou['maritalStatus'] as string;
  const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';

  const [screen, setScreen] = useState<Screen>('intro');
  const [intakeStartSignal, setIntakeStartSignal] = useState(0);
  const [presetType, setPresetType] = useState<string | undefined>(undefined);
  const [presetOwnerIds, setPresetOwnerIds] = useState<string[] | undefined>(undefined);
  const [activeClient, setActiveClient] = useState<'client1' | 'client2'>('client1');
  const [client1PensionDone, setClient1PensionDone] = useState(false);
  const [client2PensionDone, setClient2PensionDone] = useState(false);
  const [client1EquityDone, setClient1EquityDone] = useState(false);
  const [client2EquityDone, setClient2EquityDone] = useState(false);
  const intakeRef = useRef<HTMLDivElement>(null);

  // Load existing assets from answers
  const investmentAccounts = (answers['investmentAccountsData'] as InvestmentAccount[]) || [];
  const pensionRecords = (answers['pensionRecordsData'] as PensionRecord[]) || [];
  const equityRecords = (answers['equityCompensationData'] as EquityCompensation[]) || [];
  const receivableRecords = (answers['receivablesData'] as ReceivableRecord[]) || [];
  const otherAssets = (answers['otherAssetsData'] as OtherAssetRecord[]) || [];

  // Persist gate answers for data continuity
  const hasInvestments = (answers['hasInvestments'] as string) || '';
  const hasReceivables = (answers['hasReceivables'] as string) || '';
  const hasOtherAssets = (answers['hasOtherAssets'] as string) || '';

  useEffect(() => {
    if (intakeRef.current) {
      intakeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [screen]);

  // Derive known individuals for beneficiary/child selection
  const knownIndividuals = useMemo(() => {
    const individuals: Array<{ id: string; name: string; relationship: string }> = [];
    const prevRels = allAnswers?.get('previousRelationships') || {};
    const c1Rels = (prevRels['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
    c1Rels.forEach((r, i) => {
      if (r?.name) individuals.push({ id: `c1prev_${i}`, name: r.name, relationship: 'Previous Partner' });
    });
    const c2Rels = (prevRels['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
    c2Rels.forEach((r, i) => {
      if (r?.name) individuals.push({ id: `c2prev_${i}`, name: r.name, relationship: 'Previous Partner' });
    });
    const childrenData = allAnswers?.get('children') || {};
    const children = (childrenData['childrenData'] as Array<Record<string, string>>) || [];
    children.forEach((c, i) => {
      if (c?.name) individuals.push({ id: `child_${i}`, name: c.name, relationship: 'Child' });
    });
    if (hasSpouse) {
      individuals.unshift({ id: 'client2', name: client2Name, relationship: 'Spouse' });
    }
    individuals.unshift({ id: 'client1', name: client1Name, relationship: 'Self' });
    return individuals;
  }, [allAnswers, client1Name, client2Name, hasSpouse]);

  // Derive all financial advisors from professional team via referential integrity registry
  const financialAdvisors = useMemo(
    () => getFinancialAdvisors(allAnswers || new Map()),
    [allAnswers]
  );

  // Derive institutions from banking data
  const institutions = useMemo(() => {
    const footprint = allAnswers?.get('financialFootprint') || {};
    const insts: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();
    const addInst = (data: unknown, key: string) => {
      const arr = data as unknown as Array<Record<string, unknown>>;
      if (!Array.isArray(arr)) return;
      arr.forEach((inst, i) => {
        const name = (inst['name'] as string) || '';
        if (name && !seen.has(name)) {
          seen.add(name);
          insts.push({ id: `${key}_${i}`, name });
        }
      });
    };
    addInst(footprint['client1InstitutionsData'], 'c1');
    addInst(footprint['client2InstitutionsData'], 'c2');
    addInst(footprint['jointInstitutionsData'], 'j');
    addInst(footprint['mixedJointInstitutionsData'], 'mj');
    addInst(footprint['mixedClient1InstitutionsData'], 'mc1');
    addInst(footprint['mixedClient2InstitutionsData'], 'mc2');
    return insts;
  }, [allAnswers]);

  // Derive employers from corporations
  const employers = useMemo(() => {
    const corps = allAnswers?.get('corporations') || {};
    const corpData = (corps['corporationsData'] as Array<Record<string, string>>) || [];
    return corpData.map((c, i) => ({ id: `corp_${i}`, name: c.legalName || c.name || '' })).filter((e) => e.name);
  }, [allAnswers]);

  // Derive receivables from corporate financial connections (shareholder loans)
  const derivedReceivables = useMemo(() => {
    const corpConn = allAnswers?.get('corporateFinancialConnections') || {};
    const slData = (corpConn['shareholderLoansData'] as Array<Record<string, unknown>>) || [];
    const validCorpNames = new Set(getClientOwnedCorpNames(allAnswers || new Map()).map((n) => n.toLowerCase()));
    return slData
      .filter((sl) => {
        const corpName = ((sl['selectedCompany'] as string) || '').trim().toLowerCase();
        return corpName === '' || validCorpNames.size === 0 || validCorpNames.has(corpName);
      })
      .map((sl, i) => {
      const owedTo = sl['owedTo'] === 'client2' ? client2Name : client1Name;
      return {
        id: `sl_${i}`,
        corporation: (sl['selectedCompany'] as string) || 'Company',
        amount: (sl['amount'] as string) || 'amount unknown',
        owedTo,
      };
    });
  }, [allAnswers, client1Name, client2Name]);

  // Derive banking summary from existing banking data
  const bankingSummary = useMemo(() => {
    const footprint = allAnswers?.get('financialFootprint') || {};
    const accounts: Array<{ name: string; type: string; owner: string }> = [];
    const addAccounts = (data: unknown, ownerLabel: string) => {
      const arr = data as Array<Record<string, unknown>>;
      if (!Array.isArray(arr)) return;
      arr.forEach((inst) => {
        const name = (inst['name'] as string) || '';
        const type = (inst['accountType'] as string) || '';
        if (name) accounts.push({ name, type, owner: ownerLabel });
      });
    };
    const bankingStructure = (footprint['bankingStructure'] as string) || '';
    if (!hasSpouse) {
      addAccounts(footprint['client1InstitutionsData'], client1Name);
    } else if (bankingStructure === 'individual') {
      addAccounts(footprint['client1InstitutionsData'], client1Name);
      addAccounts(footprint['client2InstitutionsData'], client2Name);
    } else if (bankingStructure === 'joint') {
      addAccounts(footprint['jointInstitutionsData'], `${client1Name} & ${client2Name}`);
    } else if (bankingStructure === 'mixed') {
      addAccounts(footprint['mixedJointInstitutionsData'], `${client1Name} & ${client2Name}`);
      addAccounts(footprint['mixedClient1InstitutionsData'], client1Name);
      addAccounts(footprint['mixedClient2InstitutionsData'], client2Name);
    }
    return accounts;
  }, [allAnswers, client1Name, client2Name, hasSpouse]);

  // Helpers
  const sectionCardClass = 'bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4';

  const launchIntake = (type?: string, ownerIds?: string[]) => {
    setPresetType(type);
    setPresetOwnerIds(ownerIds);
    setIntakeStartSignal((s) => s + 1);
  };

  const handleIntakeSaved = () => {
    // Return to the appropriate summary screen after save
    if (screen === 'investmentsIntake') setScreen('investments');
    else if (screen === 'pensionsIntake') setScreen('pensions');
    else if (screen === 'equityIntake') setScreen('equity');
    else if (screen === 'receivablesIntake') setScreen('receivables');
    else if (screen === 'otherIntake') setScreen('other');
  };

  const handleIntakeCancelled = () => {
    if (screen === 'investmentsIntake') setScreen('investments');
    else if (screen === 'pensionsIntake') setScreen('pensions');
    else if (screen === 'equityIntake') setScreen('equity');
    else if (screen === 'receivablesIntake') setScreen('receivables');
    else if (screen === 'otherIntake') setScreen('other');
  };

  // === INVESTMENTS SUMMARY ===
  const renderInvestmentsSummary = () => {
    if (investmentAccounts.length > 0) {
      return (
        <div className="space-y-3">
          {investmentAccounts.map((acct, i) => (
            <AssetCard
              key={acct.id || i}
              title={acct.friendlyLabel || accountTypeShort(acct.accountType)}
              subtitle={ownerShort(acct.ownerIds)}
              value={acct.valueUnknown ? 'Value unknown' : acct.approximateValue ? `~${acct.currency} ${acct.approximateValue}` : undefined}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  const accountTypeShort = (t: string) => {
    const found = INVESTMENT_ACCOUNT_TYPES.find((a) => a.value === t);
    return found ? found.label : t;
  };

  const pensionTypeShort = (t: string) => {
    const found = PENSION_TYPES.find((a) => a.value === t);
    return found ? found.label : t;
  };

  const awardTypeShort = (t: string) => {
    const found = EQUITY_AWARD_TYPES.find((a) => a.value === t);
    return found ? found.label : t;
  };

  const ownerShort = (ids: string[]) => {
    if (!ids || ids.length === 0) return client1Name;
    if (ids.includes('joint')) return 'Joint';
    if (ids.includes('client2')) return client2Name;
    return client1Name;
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return '';
    const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return amount;
    return num.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // === SCREEN: INTRO ===
  if (screen === 'intro') {
    return (
      <div className="space-y-6" ref={intakeRef}>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Savings, Investments &amp; Retirement</h2>
          <p className="text-gray-400 leading-relaxed">
            Next, let's make sure we have a clear picture of your savings, investments and retirement benefits.
          </p>
          <p className="text-gray-500 text-sm mt-3">
            We'll go through these one area at a time. If something doesn't apply to you, just select No and move on.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScreen('banking')}
          className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-blue-600/20"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // === SCREEN: BANKING ===
  if (screen === 'banking') {
    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Banking &amp; Cash" />
        <p className="text-gray-400 leading-relaxed">
          Here's what you've already told us about your everyday banking.
        </p>

        {bankingSummary.length > 0 ? (
          <div className="space-y-3">
            {bankingSummary.map((acct, i) => (
              <AssetCard
                key={i}
                title={`${acct.name}${acct.type ? ` — ${acct.type}` : ''}`}
                subtitle={acct.owner}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm">No bank accounts have been entered yet.</p>
          </div>
        )}

        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">
            Do you have another bank or cash account to add?
          </h3>
          <YesNoCard
            value={hasInvestments === '' ? '' : 'no'}
            onChange={(v) => {
              if (v === 'yes') {
                // This would ideally open the existing bank intake from the financial footprint section
                // For now, proceed to investments since banking is captured earlier in the questionnaire
                setScreen('investments');
              } else {
                onAnswerChange('hasInvestments', '');
                setScreen('investments');
              }
            }}
            options={['yes', 'no']}
            labels={{ yes: 'Yes', no: 'No, continue to investments' }}
          />
        </div>
      </div>
    );
  }

  // === SCREEN: INVESTMENTS ===
  if (screen === 'investments') {
    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Investments" />

        {hasInvestments === '' && investmentAccounts.length === 0 && (
          <div className={sectionCardClass}>
            <h3 className="text-xl font-semibold text-white">
              Do you have any personal investment or registered accounts?
            </h3>
            <p className="text-sm text-gray-400">
              This includes accounts you manage yourself or through an advisor. We'll ask about workplace retirement plans separately.
            </p>
            <YesNoCard
              value=""
              onChange={(v) => {
                onAnswerChange('hasInvestments', v);
                if (v === 'yes') setScreen('investmentsType');
                else if (v === 'no') setScreen('pensions');
              }}
              options={['yes', 'no']}
              labels={{ yes: 'Yes', no: 'No' }}
            />
          </div>
        )}

        {investmentAccounts.length > 0 && (
          <>
            {renderInvestmentsSummary()}
            <div className={sectionCardClass}>
              <h3 className="text-lg font-semibold text-white">
                Do you have another investment account to add?
              </h3>
              <YesNoCard
                value={hasInvestments === 'no' ? 'no' : ''}
                onChange={(v) => {
                  onAnswerChange('hasInvestments', 'yes');
                  if (v === 'yes') setScreen('investmentsType');
                  else if (v === 'no') setScreen('pensions');
                }}
                options={['yes', 'no']}
                labels={{ yes: 'Yes', no: 'No, continue to workplace retirement' }}
              />
            </div>
          </>
        )}

        {hasInvestments === 'no' && investmentAccounts.length === 0 && (
          <div className={sectionCardClass}>
            <p className="text-sm text-gray-400">
              No problem. We'll move on to workplace retirement plans.
            </p>
            <button
              type="button"
              onClick={() => setScreen('pensions')}
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
            >
              Continue to Workplace Retirement
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // === SCREEN: INVESTMENTS TYPE SELECTION ===
  if (screen === 'investmentsType') {
    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Investments" />
        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">
            What type of account would you like to add?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {INVESTMENT_ACCOUNT_TYPES.map((opt) => (
              <SelectionCard
                key={opt.value}
                title={opt.label}
                description={opt.description}
                onClick={() => {
                  setPresetType(opt.value);
                  setScreen('investmentsIntake');
                  setTimeout(() => launchIntake(opt.value), 50);
                }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setScreen('investments')}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Back to Investments
        </button>
      </div>
    );
  }

  // === SCREEN: INVESTMENTS INTAKE ===
  if (screen === 'investmentsIntake') {
    return (
      <div className="space-y-5" ref={intakeRef}>
        <BackLink onClick={() => setScreen('investmentsType')} label="Back to account types" />
        <InvestmentsIntake
          assets={investmentAccounts}
          onChange={(assets) => onAnswerChange('investmentAccountsData', assets)}
          client1Name={client1Name}
          client2Name={client2Name}
          hasSpouse={hasSpouse}
          knownIndividuals={knownIndividuals}
          financialAdvisors={financialAdvisors}
          institutions={institutions}
          startSignal={intakeStartSignal}
          presetType={presetType}
          hideAddButton
          onSaved={handleIntakeSaved}
          onCancelled={handleIntakeCancelled}
        />
      </div>
    );
  }

  // === SCREEN: WORKPLACE RETIREMENT ===
  if (screen === 'pensions') {
    const currentClientName = activeClient === 'client1' ? client1Name : client2Name;
    const clientDone = activeClient === 'client1' ? client1PensionDone : client2PensionDone;

    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Workplace Retirement Plans" />
        <p className="text-gray-400 leading-relaxed">
          Many employers provide pensions or retirement savings plans in addition to your personal investments.
        </p>

        {/* Show existing pensions */}
        {pensionRecords.length > 0 && (
          <div className="space-y-3">
            {pensionRecords.map((pen, i) => (
              <AssetCard
                key={pen.id || i}
                title={pen.planName || pensionTypeShort(pen.pensionType)}
                subtitle={ownerShort(pen.ownerIds)}
                value={
                  pen.currentPensionAmount
                    ? `Receiving ${pen.currentPensionAmount} ${pen.pensionFrequency || ''}`
                    : pen.approximateValue
                    ? `~${pen.currency} ${pen.approximateValue}`
                    : pen.valueUnknown
                    ? 'Value unknown'
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {!clientDone && (
          <div className={sectionCardClass}>
            <h3 className="text-xl font-semibold text-white">
              Does {currentClientName} have a pension or retirement savings plan through a current or former employer?
            </h3>
            <YesNoCard
              value=""
              onChange={(v) => {
                onAnswerChange('hasPensions', 'yes');
                if (v === 'yes') {
                  setScreen('pensionsType');
                } else if (v === 'no' || v === 'not_sure') {
                  if (activeClient === 'client1') {
                    setClient1PensionDone(true);
                    if (hasSpouse) {
                      setActiveClient('client2');
                    } else {
                      onAnswerChange('hasPensions', v === 'not_sure' ? 'not_sure' : 'no');
                      setScreen('equity');
                    }
                  } else {
                    setClient2PensionDone(true);
                    onAnswerChange('hasPensions', v === 'not_sure' ? 'not_sure' : 'no');
                    setScreen('equity');
                  }
                }
              }}
              options={['yes', 'no', 'not_sure']}
              labels={{ yes: 'Yes', no: 'No', not_sure: "I'm not sure" }}
            />
          </div>
        )}

        {/* If client1 done and spouse exists, show transition */}
        {clientDone && activeClient === 'client1' && hasSpouse && !client2PensionDone && (
          <div className={sectionCardClass}>
            <p className="text-sm text-gray-400">
              Now let's ask about {client2Name}.
            </p>
            <button
              type="button"
              onClick={() => setActiveClient('client2')}
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // === SCREEN: PENSIONS TYPE SELECTION ===
  if (screen === 'pensionsType') {
    const currentClientName = activeClient === 'client1' ? client1Name : client2Name;
    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Workplace Retirement Plans" />
        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">
            What kind of plan does {currentClientName} have?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {PENSION_TYPES.map((opt) => (
              <SelectionCard
                key={opt.value}
                title={opt.label}
                description={opt.description}
                onClick={() => {
                  setPresetType(opt.value);
                  setPresetOwnerIds([activeClient]);
                  setScreen('pensionsIntake');
                  setTimeout(() => launchIntake(opt.value, [activeClient]), 50);
                }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setScreen('pensions')}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  // === SCREEN: PENSIONS INTAKE ===
  if (screen === 'pensionsIntake') {
    return (
      <div className="space-y-5" ref={intakeRef}>
        <BackLink onClick={() => setScreen('pensionsType')} label="Back to plan types" />
        <PensionsIntake
          assets={pensionRecords}
          onChange={(assets) => onAnswerChange('pensionRecordsData', assets)}
          client1Name={client1Name}
          client2Name={client2Name}
          hasSpouse={hasSpouse}
          knownIndividuals={knownIndividuals}
          institutions={institutions}
          startSignal={intakeStartSignal}
          presetType={presetType}
          presetOwnerIds={presetOwnerIds}
          hideAddButton
          onSaved={handleIntakeSaved}
          onCancelled={handleIntakeCancelled}
        />
      </div>
    );
  }

  // === SCREEN: EMPLOYER SHARES & COMPENSATION ===
  if (screen === 'equity') {
    const currentClientName = activeClient === 'client1' ? client1Name : client2Name;
    const clientDone = activeClient === 'client1' ? client1EquityDone : client2EquityDone;

    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Employer Shares &amp; Compensation" />

        {/* Show existing equity records */}
        {equityRecords.length > 0 && (
          <div className="space-y-3">
            {equityRecords.map((eq, i) => (
              <AssetCard
                key={eq.id || i}
                title={`${awardTypeShort(eq.awardType)}${eq.companyName ? ` — ${eq.companyName}` : ''}`}
                subtitle={ownerShort(eq.ownerIds)}
              />
            ))}
          </div>
        )}

        {!clientDone && (
          <div className={sectionCardClass}>
            <h3 className="text-xl font-semibold text-white">
              Does {currentClientName} receive shares, stock-based compensation, or other long-term incentives through work?
            </h3>
            <YesNoCard
              value=""
              onChange={(v) => {
                onAnswerChange('hasEquity', 'yes');
                if (v === 'yes') {
                  setScreen('equityType');
                } else if (v === 'no' || v === 'not_sure') {
                  if (activeClient === 'client1') {
                    setClient1EquityDone(true);
                    if (hasSpouse) {
                      setActiveClient('client2');
                      setScreen('equity');
                    } else {
                      onAnswerChange('hasEquity', v === 'not_sure' ? 'not_sure' : 'no');
                      setScreen('receivables');
                    }
                  } else {
                    setClient2EquityDone(true);
                    onAnswerChange('hasEquity', v === 'not_sure' ? 'not_sure' : 'no');
                    setScreen('receivables');
                  }
                }
              }}
              options={['yes', 'no', 'not_sure']}
              labels={{ yes: 'Yes', no: 'No', not_sure: "I'm not sure" }}
            />
          </div>
        )}

        {clientDone && activeClient === 'client1' && hasSpouse && !client2EquityDone && (
          <div className={sectionCardClass}>
            <p className="text-sm text-gray-400">
              Now let's ask about {client2Name}.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveClient('client2');
                setScreen('equity');
              }}
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* After both clients done, ask "add another" */}
        {(activeClient === 'client2' ? client2EquityDone : client1EquityDone && !hasSpouse) && equityRecords.length > 0 && (
          <div className={sectionCardClass}>
            <h3 className="text-lg font-semibold text-white">
              Does {hasSpouse ? 'either of you' : 'you'} have another employer share or compensation plan?
            </h3>
            <YesNoCard
              value=""
              onChange={(v) => {
                if (v === 'yes') {
                  setActiveClient('client1');
                  setClient1EquityDone(false);
                  setClient2EquityDone(false);
                  setScreen('equityType');
                } else {
                  onAnswerChange('hasEquity', 'no');
                  setScreen('receivables');
                }
              }}
              options={['yes', 'no']}
              labels={{ yes: 'Yes', no: 'No, continue' }}
            />
          </div>
        )}
      </div>
    );
  }

  // === SCREEN: EQUITY TYPE SELECTION ===
  if (screen === 'equityType') {
    const currentClientName = activeClient === 'client1' ? client1Name : client2Name;
    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Employer Shares &amp; Compensation" />
        <div className={sectionCardClass}>
          <h3 className="text-xl font-semibold text-white">
            What does {currentClientName} have?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {EQUITY_AWARD_TYPES.map((opt) => (
              <SelectionCard
                key={opt.value}
                title={opt.label}
                onClick={() => {
                  setPresetType(opt.value);
                  setPresetOwnerIds([activeClient]);
                  setScreen('equityIntake');
                  setTimeout(() => launchIntake(opt.value, [activeClient]), 50);
                }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setScreen('equity')}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  // === SCREEN: EQUITY INTAKE ===
  if (screen === 'equityIntake') {
    return (
      <div className="space-y-5" ref={intakeRef}>
        <BackLink onClick={() => setScreen('equityType')} label="Back to selection" />
        <EmployerEquityIntake
          assets={equityRecords}
          onChange={(assets) => onAnswerChange('equityCompensationData', assets)}
          client1Name={client1Name}
          client2Name={client2Name}
          hasSpouse={hasSpouse}
          employers={employers}
          startSignal={intakeStartSignal}
          presetType={presetType}
          presetOwnerIds={presetOwnerIds}
          hideAddButton
          onSaved={handleIntakeSaved}
          onCancelled={handleIntakeCancelled}
        />
      </div>
    );
  }

  // === SCREEN: MONEY OWED TO YOU ===
  if (screen === 'receivables') {
    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Money Owed to You" />

        {/* Show derived receivables from corporate connections */}
        {derivedReceivables.length > 0 && (
          <div className="space-y-3">
            {derivedReceivables.map((dr) => (
              <div
                key={dr.id}
                className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-base font-semibold text-white">{dr.corporation}</h4>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Owes {dr.owedTo}
                    </p>
                  </div>
                  <span className="text-sm text-blue-400 flex-shrink-0">
                    {dr.amount !== 'amount unknown' ? `~${formatCurrency(dr.amount)}` : 'Amount unknown'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  This was identified in Corporate Financial Connections and is managed there.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Show manually entered receivables */}
        {receivableRecords.length > 0 && (
          <div className="space-y-3">
            {receivableRecords.map((rec, i) => (
              <AssetCard
                key={rec.id || i}
                title={rec.debtor || 'Debtor'}
                subtitle={`Owes ${ownerShort(rec.ownerIds)}`}
                value={rec.valueUnknown ? 'Value unknown' : rec.approximateValue ? `~${rec.currency} ${rec.approximateValue}` : undefined}
              />
            ))}
          </div>
        )}

        {hasReceivables === '' && (
          <div className={sectionCardClass}>
            <h3 className="text-xl font-semibold text-white">
              Is anyone else expected to repay money to you?
            </h3>
            <p className="text-sm text-gray-400">
              For example, a loan to a family member, private mortgage, promissory note, or other amount someone owes you.
            </p>
            <YesNoCard
              value=""
              onChange={(v) => {
                onAnswerChange('hasReceivables', v);
                if (v === 'yes') {
                  setScreen('receivablesIntake');
                  setTimeout(() => launchIntake(), 50);
                } else {
                  setScreen('other');
                }
              }}
              options={['yes', 'no']}
              labels={{ yes: 'Yes', no: 'No' }}
            />
          </div>
        )}

        {receivableRecords.length > 0 && hasReceivables !== 'no' && (
          <div className={sectionCardClass}>
            <h3 className="text-lg font-semibold text-white">
              Is anyone else expected to repay money to you?
            </h3>
            <YesNoCard
              value=""
              onChange={(v) => {
                onAnswerChange('hasReceivables', v);
                if (v === 'yes') {
                  setScreen('receivablesIntake');
                  setTimeout(() => launchIntake(), 50);
                } else {
                  setScreen('other');
                }
              }}
              options={['yes', 'no']}
              labels={{ yes: 'Yes', no: 'No, continue' }}
            />
          </div>
        )}
      </div>
    );
  }

  // === SCREEN: RECEIVABLES INTAKE ===
  if (screen === 'receivablesIntake') {
    return (
      <div className="space-y-5" ref={intakeRef}>
        <BackLink onClick={() => setScreen('receivables')} label="Back to Money Owed to You" />
        <ReceivablesIntake
          assets={receivableRecords}
          onChange={(assets) => onAnswerChange('receivablesData', assets)}
          client1Name={client1Name}
          client2Name={client2Name}
          hasSpouse={hasSpouse}
          derivedReceivables={derivedReceivables}
          startSignal={intakeStartSignal}
          hideAddButton
          onSaved={handleIntakeSaved}
          onCancelled={handleIntakeCancelled}
        />
      </div>
    );
  }

  // === SCREEN: ANYTHING ELSE ===
  if (screen === 'other') {
    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Anything Else?" />

        {otherAssets.length > 0 && (
          <div className="space-y-3">
            {otherAssets.map((asset, i) => (
              <AssetCard
                key={asset.id || i}
                title={asset.assetDescription || 'Other asset'}
                subtitle={ownerShort(asset.ownerIds)}
                value={asset.valueUnknown ? 'Value unknown' : asset.approximateValue ? `~${asset.currency} ${asset.approximateValue}` : undefined}
              />
            ))}
          </div>
        )}

        {hasOtherAssets === '' && otherAssets.length === 0 && (
          <div className={sectionCardClass}>
            <h3 className="text-xl font-semibold text-white">
              Are there any other financial assets we haven't captured?
            </h3>
            <YesNoCard
              value=""
              onChange={(v) => {
                onAnswerChange('hasOtherAssets', v);
                if (v === 'yes') {
                  setScreen('otherIntake');
                  setTimeout(() => launchIntake(), 50);
                } else {
                  setScreen('review');
                }
              }}
              options={['yes', 'no']}
              labels={{ yes: 'Yes', no: 'No' }}
            />
          </div>
        )}

        {otherAssets.length > 0 && (
          <div className={sectionCardClass}>
            <h3 className="text-lg font-semibold text-white">
              Are there any other financial assets we haven't captured?
            </h3>
            <YesNoCard
              value=""
              onChange={(v) => {
                onAnswerChange('hasOtherAssets', v);
                if (v === 'yes') {
                  setScreen('otherIntake');
                  setTimeout(() => launchIntake(), 50);
                } else {
                  setScreen('review');
                }
              }}
              options={['yes', 'no']}
              labels={{ yes: 'Yes', no: 'No, see my summary' }}
            />
          </div>
        )}
      </div>
    );
  }

  // === SCREEN: OTHER INTAKE ===
  if (screen === 'otherIntake') {
    return (
      <div className="space-y-5" ref={intakeRef}>
        <BackLink onClick={() => setScreen('other')} label="Back to Anything Else?" />
        <OtherAssetsIntake
          assets={otherAssets}
          onChange={(assets) => onAnswerChange('otherAssetsData', assets)}
          client1Name={client1Name}
          client2Name={client2Name}
          hasSpouse={hasSpouse}
          startSignal={intakeStartSignal}
          hideAddButton
          onSaved={handleIntakeSaved}
          onCancelled={handleIntakeCancelled}
        />
      </div>
    );
  }

  // === SCREEN: REVIEW ===
  if (screen === 'review') {
    const totalBanking = bankingSummary.length;
    const totalInvestments = investmentAccounts.length;
    const totalPensions = pensionRecords.length;
    const totalEquity = equityRecords.length;
    const totalReceivables = receivableRecords.length + derivedReceivables.length;
    const totalOther = otherAssets.length;
    const hasAnything = totalBanking + totalInvestments + totalPensions + totalEquity + totalReceivables + totalOther > 0;

    if (!hasAnything) {
      return (
        <div className="space-y-6" ref={intakeRef}>
          <ScreenHeading title="Your Financial Picture" />
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm">
              Nothing has been added yet. You can come back to this section if your situation changes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScreen('intro')}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
          >
            Start Over
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8" ref={intakeRef}>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Financial Picture</h2>
          <p className="text-gray-400 leading-relaxed">
            Here's what we've captured so far.
          </p>
        </div>

        <div className="space-y-6">
          {/* Banking & Cash */}
          {totalBanking > 0 && (
            <ReviewGroup label="Banking &amp; Cash" count={totalBanking}>
              {bankingSummary.map((acct, i) => (
                <ReviewLine key={i} title={`${acct.name}${acct.type ? ` — ${acct.type}` : ''}`} subtitle={acct.owner} />
              ))}
            </ReviewGroup>
          )}

          {/* Investments */}
          {totalInvestments > 0 && (
            <ReviewGroup label="Investments" count={totalInvestments}>
              {investmentAccounts.map((acct) => (
                <ReviewLine
                  key={acct.id}
                  title={acct.friendlyLabel || accountTypeShort(acct.accountType)}
                  subtitle={ownerShort(acct.ownerIds)}
                  value={acct.valueUnknown ? 'Value unknown' : acct.approximateValue ? `~${formatCurrency(acct.approximateValue)}` : undefined}
                />
              ))}
            </ReviewGroup>
          )}

          {/* Workplace Retirement */}
          {totalPensions > 0 && (
            <ReviewGroup label="Workplace Retirement" count={totalPensions}>
              {pensionRecords.map((pen) => (
                <ReviewLine
                  key={pen.id}
                  title={pen.planName || pensionTypeShort(pen.pensionType)}
                  subtitle={ownerShort(pen.ownerIds)}
                  value={
                    pen.currentPensionAmount
                      ? `Receiving ${pen.currentPensionAmount} ${pen.pensionFrequency || ''}`
                      : pen.valueUnknown
                      ? 'Value unknown'
                      : pen.approximateValue
                      ? `~${formatCurrency(pen.approximateValue)}`
                      : undefined
                  }
                />
              ))}
            </ReviewGroup>
          )}

          {/* Employer Shares & Compensation */}
          {totalEquity > 0 && (
            <ReviewGroup label="Employer Shares &amp; Compensation" count={totalEquity}>
              {equityRecords.map((eq) => (
                <ReviewLine
                  key={eq.id}
                  title={`${awardTypeShort(eq.awardType)}${eq.companyName ? ` — ${eq.companyName}` : ''}`}
                  subtitle={ownerShort(eq.ownerIds)}
                />
              ))}
            </ReviewGroup>
          )}

          {/* Money Owed to You */}
          {totalReceivables > 0 && (
            <ReviewGroup label="Money Owed to You" count={totalReceivables}>
              {derivedReceivables.map((dr) => (
                <ReviewLine
                  key={dr.id}
                  title={`${dr.corporation} → ${dr.owedTo}`}
                  value={dr.amount !== 'amount unknown' ? `~${formatCurrency(dr.amount)}` : 'Amount unknown'}
                />
              ))}
              {receivableRecords.map((rec) => (
                <ReviewLine
                  key={rec.id}
                  title={`${rec.debtor || 'Debtor'} → ${ownerShort(rec.ownerIds)}`}
                  value={rec.valueUnknown ? 'Value unknown' : rec.approximateValue ? `~${formatCurrency(rec.approximateValue)}` : undefined}
                />
              ))}
            </ReviewGroup>
          )}

          {/* Other */}
          {totalOther > 0 && (
            <ReviewGroup label="Other Financial Assets" count={totalOther}>
              {otherAssets.map((asset) => (
                <ReviewLine
                  key={asset.id}
                  title={asset.assetDescription || 'Other asset'}
                  subtitle={ownerShort(asset.ownerIds)}
                  value={asset.valueUnknown ? 'Value unknown' : asset.approximateValue ? `~${formatCurrency(asset.approximateValue)}` : undefined}
                />
              ))}
            </ReviewGroup>
          )}
        </div>

        <div className={sectionCardClass}>
          <h3 className="text-lg font-semibold text-white">
            Does this look like a complete picture of your savings, investments and retirement benefits?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onAnswerChange('reviewConfirmed', 'yes')}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
            >
              <Check className="w-4 h-4" />
              Yes, looks good
            </button>
            <button
              type="button"
              onClick={() => setScreen('reviewAddCategory')}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-800 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              I need to add something
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === SCREEN: REVIEW ADD CATEGORY ===
  if (screen === 'reviewAddCategory') {
    const categories: Array<{ label: string; icon: React.ReactNode; screen: Screen }> = [
      { label: 'Banking & Cash', icon: <Landmark className="w-5 h-5" />, screen: 'banking' },
      { label: 'Investments', icon: <TrendingUp className="w-5 h-5" />, screen: 'investments' },
      { label: 'Workplace Retirement', icon: <Briefcase className="w-5 h-5" />, screen: 'pensions' },
      { label: 'Employer Shares & Compensation', icon: <GraduationCap className="w-5 h-5" />, screen: 'equity' },
      { label: 'Money Owed to You', icon: <HandCoins className="w-5 h-5" />, screen: 'receivables' },
      { label: 'Other', icon: <MoreHorizontal className="w-5 h-5" />, screen: 'other' },
    ];

    return (
      <div className="space-y-6" ref={intakeRef}>
        <ScreenHeading title="Add Something" />
        <p className="text-gray-400 leading-relaxed">
          Which area would you like to add to?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => {
                // Reset relevant gate state
                if (cat.screen === 'pensions') {
                  setActiveClient('client1');
                  setClient1PensionDone(false);
                  setClient2PensionDone(false);
                } else if (cat.screen === 'equity') {
                  setActiveClient('client1');
                  setClient1EquityDone(false);
                  setClient2EquityDone(false);
                }
                setScreen(cat.screen);
              }}
              className="flex items-center gap-3 px-5 py-4 bg-gray-800 border border-gray-600 hover:border-blue-500 text-gray-300 hover:text-white rounded-xl font-medium transition-all text-left"
            >
              <span className="text-blue-400 flex-shrink-0">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setScreen('review')}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Back to summary
        </button>
      </div>
    );
  }

  // Fallback
  return null;
}

// === SHARED UI COMPONENTS ===

function ScreenHeading({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
  );
}

function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
    >
      <ChevronRight className="w-4 h-4 rotate-180" />
      {label}
    </button>
  );
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

function SelectionCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left px-5 py-4 bg-gray-800 border-2 border-gray-600 hover:border-blue-500 rounded-xl transition-all group"
    >
      <p className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
        {title}
      </p>
      {description && (
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{description}</p>
      )}
    </button>
  );
}

function AssetCard({
  title,
  subtitle,
  value,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-white truncate">{title}</h4>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          {value && <p className="text-sm text-blue-400 mt-1">{value}</p>}
        </div>
        {(onEdit || onDelete) && (
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
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">{label}</h3>
        <span className="text-xs text-gray-500">
          {count} {count !== 1 ? 'items' : 'item'}
        </span>
      </div>
      <div className="space-y-2 ml-2">{children}</div>
    </div>
  );
}

function ReviewLine({
  title,
  subtitle,
  value,
}: {
  title: string;
  subtitle?: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-700/30 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-gray-300 truncate">{title}</span>
        {subtitle && <span className="text-gray-500 ml-2 text-xs">— {subtitle}</span>}
      </div>
      {value && <span className="text-blue-400 text-xs ml-2 flex-shrink-0">{value}</span>}
    </div>
  );
}
