import React, { useState, useMemo, useCallback } from 'react';
import {
  Trash2,
  Pencil,
  Building2,
  Briefcase,
  CheckCircle2,
  Circle,
  ChevronRight,
  Info,
  FileText,
  Shield,
  Coins,
  Landmark,
} from 'lucide-react';
import RepoDocumentLocationPicker from './DocumentLocationPicker';
import DbPensionDetail from './DbPensionDetail';
import EquityBenefitDetail from './EquityBenefitDetail';
import GovernmentRetirementBenefits from './GovernmentRetirementBenefits';
import {
  type WorkplaceBenefit,
  type WorkplaceBenefitType,
  type WorkplaceBenefitFamily,
  type EmployerRecord,
  type DocumentLocationRef,
  type WorkplaceClientData,
  type DbPensionDetails,
  type EquityBenefitDetails,
  type GovernmentBenefitsData,
  WORKPLACE_BENEFIT_OPTIONS,
  DB_PENSION_STATUS_OPTIONS,
  EQUITY_TYPE_OPTIONS,
  EXECUTIVE_TYPE_OPTIONS,
  INSURANCE_CONTACT_OPTIONS,
  ADMINISTRATOR_PRESETS,
  benefitTypeLabel,
  familyForType,
  generateWorkplaceId,
  generateEmployerId,
  mapBenefitTypeToPensionSubtype,
  mapPensionSubtypeToBenefitType,
} from '../lib/workplacePensionsTypes';
import { generateAssetId } from '../lib/financialAssetTypes';
import type { PensionRecord, EquityCompensation } from '../lib/financialAssetTypes';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';

type Props = {
  answers: Record<string, unknown>;
  allAnswers?: Map<string, Record<string, unknown>>;
  onAnswerChange: (key: string, value: unknown) => void;
  onUpdateFootprint?: (key: string, value: unknown) => void;
};

type ClientId = 'client1' | 'client2';

type Screen =
  | 'intro'
  | 'clientGate'
  | 'currentEmployerBenefits'
  | 'benefitDetail'
  | 'dbPensionDetail'
  | 'equityDetail'
  | 'formerEmployerGate'
  | 'formerEmployerName'
  | 'formerEmployerBenefits'
  | 'closingDiscovery'
  | 'governmentBenefits'
  | 'review';

type DraftBenefit = Partial<WorkplaceBenefit> & {
  employerId?: string;
  employerName?: string;
  employerIsCurrent?: boolean;
  clientId?: ClientId;
};

type RecognizedPlan = {
  footprintId: string;
  benefitType: WorkplaceBenefitType;
  label: string;
  planName?: string;
};



// ─── Helpers ──────────────────────────────────────────────────────────────

function getClientNames(allAnswers?: Map<string, Record<string, unknown>>): {
  client1: string;
  client2: string;
  hasSpouse: boolean;
} {
  const aboutYou = allAnswers?.get('aboutYou') || {};
  const client1 = (aboutYou['fullName'] as string) || 'Client 1';
  const client2 = (aboutYou['spouseName'] as string) || 'Client 2';
  const ms = aboutYou['maritalStatus'] as string;
  const hasSpouse = ms === 'married' || ms === 'common_law';
  return { client1, client2, hasSpouse };
}

function getFootprintPensions(
  allAnswers?: Map<string, Record<string, unknown>>,
): PensionRecord[] {
  const footprint = allAnswers?.get('financialFootprint') || {};
  return (footprint['pensionRecordsData'] as PensionRecord[]) || [];
}

function getFootprintEquity(
  allAnswers?: Map<string, Record<string, unknown>>,
): EquityCompensation[] {
  const footprint = allAnswers?.get('financialFootprint') || {};
  return (footprint['equityCompensationData'] as EquityCompensation[]) || [];
}

function findMatchingPensionInFootprint(
  pensions: PensionRecord[],
  clientId: ClientId,
  employerName: string,
  benefitType: WorkplaceBenefitType,
): PensionRecord | undefined {
  const subtype = mapBenefitTypeToPensionSubtype(benefitType);
  return pensions.find((p) => {
    const ownerMatches = p.ownerIds?.includes(clientId);
    const employerMatches =
      p.employer?.toLowerCase().trim() === employerName.toLowerCase().trim();
    const typeMatches = p.pensionType === subtype || p.subtype === subtype;
    return ownerMatches && employerMatches && typeMatches;
  });
}

function findPensionsByEmployer(
  pensions: PensionRecord[],
  clientId: ClientId,
  employerName: string,
): PensionRecord[] {
  return pensions.filter((p) => {
    const ownerMatches = p.ownerIds?.includes(clientId);
    const employerMatches =
      p.employer?.toLowerCase().trim() === employerName.toLowerCase().trim();
    return ownerMatches && employerMatches;
  });
}

function pensionToRecognizedPlan(p: PensionRecord): RecognizedPlan | null {
  const bt = mapPensionSubtypeToBenefitType(p.pensionType || p.subtype || '');
  if (!bt) return null;
  return {
    footprintId: p.id,
    benefitType: bt,
    label: benefitTypeLabel(bt),
    planName: p.planName,
  };
}

function findMatchingEquityInFootprint(
  equity: EquityCompensation[],
  clientId: ClientId,
  employerName: string,
): EquityCompensation | undefined {
  return equity.find((e) => {
    const ownerMatches = e.ownerIds?.includes(clientId);
    const companyMatches =
      e.companyName?.toLowerCase().trim() === employerName.toLowerCase().trim();
    return ownerMatches && companyMatches;
  });
}

// Account-based benefit types that map to Financial Footprint pension records
const ACCOUNT_BASED_TYPES = new Set<WorkplaceBenefitType>([
  'dc', 'group_rrsp', 'dpsp', 'group_tfsa', 'prpp',
]);

const BENEFIT_FAMILY_ICON: Record<WorkplaceBenefitFamily, React.ReactNode> = {
  definedBenefitPension: <Landmark className="w-5 h-5" />,
  accountBasedPlan: <Coins className="w-5 h-5" />,
  employerEquity: <Briefcase className="w-5 h-5" />,
  executiveDeferred: <FileText className="w-5 h-5" />,
  employerInsurance: <Shield className="w-5 h-5" />,
  other: <Info className="w-5 h-5" />,
};

// ─── Component ────────────────────────────────────────────────────────────

export default function WorkplacePensionsBenefits({
  answers,
  allAnswers,
  onAnswerChange,
  onUpdateFootprint,
}: Props) {
  const { client1: client1Name, client2: client2Name, hasSpouse } = getClientNames(allAnswers);

  // Load persisted client data
  const client1Data: WorkplaceClientData = (answers['client1Data'] as WorkplaceClientData) || {};
  const client2Data: WorkplaceClientData = (answers['client2Data'] as WorkplaceClientData) || {};

  const [activeClientId, setActiveClientId] = useState<ClientId>('client1');
  const [screen, setScreen] = useState<Screen>('intro');
  const [draftBenefit, setDraftBenefit] = useState<DraftBenefit>({});
  const [editingBenefitId, setEditingBenefitId] = useState<string | null>(null);
  const [draftEmployerName, setDraftEmployerName] = useState('');
  const [editingEmployerId, setEditingEmployerId] = useState<string | null>(null);
  const [editEmployerName, setEditEmployerName] = useState('');
  const [adminSelection, setAdminSelection] = useState<string | undefined>(undefined);
  const [adminName, setAdminName] = useState('');
  const [dbPensionDetailEditing, setDbPensionDetailEditing] = useState<string | null>(null);
  const [dbPensionDetailsDraft, setDbPensionDetailsDraft] = useState<DbPensionDetails>({});
  const [equityDetailEditing, setEquityDetailEditing] = useState<string | null>(null);
  const [equityDetailsDraft, setEquityDetailsDraft] = useState<EquityBenefitDetails>({});


  const footprintPensions = useMemo(() => getFootprintPensions(allAnswers), [allAnswers]);
  const footprintEquity = useMemo(() => getFootprintEquity(allAnswers), [allAnswers]);

  const peopleRepo = usePeopleRepository();

  const activeClientData = activeClientId === 'client1' ? client1Data : client2Data;
  const activeClientName = activeClientId === 'client1' ? client1Name : client2Name;

  // ─── People / family helpers (canonical People Repository IDs only) ────────
  const aboutYouData = allAnswers?.get('aboutYou') || {};
  const client1PersonId = aboutYouData['client1PersonId'] as string | undefined;
  const client2PersonId = aboutYouData['client2PersonId'] as string | undefined;
  const activeSpouseName = activeClientId === 'client1' ? client2Name : client1Name;
  const activeSpousePersonId = hasSpouse
    ? (activeClientId === 'client1' ? client2PersonId : client1PersonId)
    : undefined;
  const hasMarriageContract = aboutYouData['hasMarriageContract'] === 'yes';

  // Ensure Client 1 and Client 2 have canonical Person IDs from the People Repository.
  // This guarantees fresh pension data never persists fallback IDs.
  React.useEffect(() => {
    if (client1Name && client1Name !== 'Client 1' && !client1PersonId) {
      let cancelled = false;
      (async () => {
        const person = await peopleRepo.getOrCreatePerson(client1Name, {
          personType: 'client',
          relationship: 'Client 1',
        });
        if (cancelled || !person) return;
        onAnswerChange('client1PersonId', person.id);
      })();
      return () => { cancelled = true; };
    }
  }, [client1Name, client1PersonId, peopleRepo, onAnswerChange]);

  React.useEffect(() => {
    if (hasSpouse && client2Name && client2Name !== 'Client 2' && !client2PersonId) {
      let cancelled = false;
      (async () => {
        const person = await peopleRepo.getOrCreatePerson(client2Name, {
          personType: 'client',
          relationship: 'Client 2',
        });
        if (cancelled || !person) return;
        onAnswerChange('client2PersonId', person.id);
      })();
      return () => { cancelled = true; };
    }
  }, [hasSpouse, client2Name, client2PersonId, peopleRepo, onAnswerChange]);

  // Build people options using canonical People Repository IDs only.
  // People without a canonical Person ID are omitted so no fallback IDs are persisted.
  // Legacy records containing fallback IDs are preserved but not offered for new selection.
  const peopleOptions: Array<{ id: string; name: string }> = useMemo(() => {
    const options: Array<{ id: string; name: string }> = [];
    if (activeClientId === 'client1') {
      if (client1PersonId) options.push({ id: client1PersonId, name: client1Name });
      if (hasSpouse && client2PersonId) options.push({ id: client2PersonId, name: client2Name });
    } else {
      if (client2PersonId) options.push({ id: client2PersonId, name: client2Name });
      if (hasSpouse && client1PersonId) options.push({ id: client1PersonId, name: client1Name });
    }
    const children = (aboutYouData['childrenData'] as Array<Record<string, string>>) || [];
    for (const child of children) {
      if (child.name && child.name.trim()) {
        const childId = child.personId || child.personEntityId;
        if (childId) {
          options.push({ id: childId, name: child.name.trim() });
        }
      }
    }
    return options;
  }, [activeClientId, client1Name, client2Name, hasSpouse, aboutYouData, client1PersonId, client2PersonId]);

  // ─── Persistence helpers ──────────────────────────────────────────────────

  const updateClientData = useCallback(
    (clientId: ClientId, updates: Partial<WorkplaceClientData>) => {
      const current = (answers[`${clientId}Data`] as WorkplaceClientData) || {};
      const merged = { ...current, ...updates };
      onAnswerChange(`${clientId}Data`, merged);
    },
    [answers, onAnswerChange],
  );

  const updateActiveClientData = useCallback(
    (updates: Partial<WorkplaceClientData>) => updateClientData(activeClientId, updates),
    [activeClientId, updateClientData],
  );

  // ─── Employer management ──────────────────────────────────────────────────

  const addOrUpdateEmployer = (
    clientId: ClientId,
    name: string,
    isCurrent: boolean,
    existingId?: string,
  ): string => {
    const data = (answers[`${clientId}Data`] as WorkplaceClientData) || {};
    const employers = data.employers || [];
    if (existingId) {
      const updated = employers.map((e) =>
        e.id === existingId ? { ...e, name, isCurrent } : e,
      );
      updateClientData(clientId, { employers: updated });
      return existingId;
    }
    // Dedup by case-insensitive name match
    const existingByName = employers.find(
      (e) => e.name.toLowerCase().trim() === name.toLowerCase().trim(),
    );
    if (existingByName) {
      // Update isCurrent status if needed
      if (existingByName.isCurrent !== isCurrent) {
        const updated = employers.map((e) =>
          e.id === existingByName.id ? { ...e, isCurrent } : e,
        );
        updateClientData(clientId, { employers: updated });
      }
      return existingByName.id;
    }
    const newId = generateEmployerId();
    const newEmployer: EmployerRecord = { id: newId, name, isCurrent, clientId };
    updateClientData(clientId, { employers: [...employers, newEmployer] });
    return newId;
  };

  const getCurrentEmployer = (clientId: ClientId): EmployerRecord | undefined => {
    const data = (answers[`${clientId}Data`] as WorkplaceClientData) || {};
    return (data.employers || []).find((e) => e.isCurrent);
  };

  // Auto-detect employer from Financial Footprint pension records
  const detectEmployerFromFootprint = (clientId: ClientId): string | null => {
    const pensions = footprintPensions.filter((p) => p.ownerIds?.includes(clientId));
    for (const p of pensions) {
      if (p.employer && p.employer.trim()) return p.employer.trim();
    }
    const equity = footprintEquity.filter((e) => e.ownerIds?.includes(clientId));
    for (const e of equity) {
      if (e.companyName && e.companyName.trim()) return e.companyName.trim();
    }
    return null;
  };

  // Get recognized plans for a client + employer from footprint
  const getRecognizedPlans = (clientId: ClientId, employerName: string): RecognizedPlan[] => {
    if (!employerName) return [];
    const pensions = findPensionsByEmployer(footprintPensions, clientId, employerName);
    const plans: RecognizedPlan[] = [];
    for (const p of pensions) {
      const rp = pensionToRecognizedPlan(p);
      if (rp) plans.push(rp);
    }
    return plans;
  };

  // Check if a benefit type is already in recognized plans
  // Benefits that should appear in the "add new" list (exclude account-based types already recognized)
  const ADDITIONAL_BENEFIT_OPTIONS = WORKPLACE_BENEFIT_OPTIONS.filter(
    (o) => o.value !== 'not_sure',
  );
  const ACCOUNT_BASED_VALUES = new Set(['dc', 'group_rrsp', 'dpsp', 'group_tfsa', 'prpp']);

  // ─── Benefit management ──────────────────────────────────────────────────

  const saveBenefit = (benefit: WorkplaceBenefit) => {
    const data = (answers[`${activeClientId}Data`] as WorkplaceClientData) || {};
    const benefits = data.benefits || [];
    if (editingBenefitId) {
      const updated = benefits.map((b) => (b.id === editingBenefitId ? benefit : b));
      updateActiveClientData({ benefits: updated });
    } else {
      updateActiveClientData({ benefits: [...benefits, benefit] });
    }
    setEditingBenefitId(null);
    setDraftBenefit({});
  };

  const deleteBenefit = (benefitId: string) => {
    const data = (answers[`${activeClientId}Data`] as WorkplaceClientData) || {};
    const benefits = (data.benefits || []).filter((b) => b.id !== benefitId);
    updateActiveClientData({ benefits });
  };

  // ─── Financial Footprint account creation ────────────────────────────────

  const createPensionInFootprint = (
    clientId: ClientId,
    employerName: string,
    benefitType: WorkplaceBenefitType,
    planName?: string,
  ): string => {
    const existing = getFootprintPensions(allAnswers);
    const newId = generateAssetId('pen');
    const subtype = mapBenefitTypeToPensionSubtype(benefitType);
    const newPension: PensionRecord = {
      id: newId,
      category: 'pension',
      subtype,
      pensionType: subtype,
      ownerIds: [clientId],
      employer: employerName,
      planName: planName || '',
    };
    if (onUpdateFootprint) {
      onUpdateFootprint('pensionRecordsData', [...existing, newPension]);
    }
    return newId;
  };

  const createEquityInFootprint = (
    clientId: ClientId,
    employerName: string,
    equityTypes: string[],
  ): string => {
    const existing = getFootprintEquity(allAnswers);
    const newId = generateAssetId('eq');
    const awardType = equityTypes[0] || 'other';
    const newEquity: EquityCompensation = {
      id: newId,
      category: 'employerEquity',
      subtype: awardType,
      awardType,
      ownerIds: [clientId],
      companyName: employerName,
    };
    if (onUpdateFootprint) {
      onUpdateFootprint('equityCompensationData', [...existing, newEquity]);
    }
    return newId;
  };

  // ─── Navigation ──────────────────────────────────────────────────────────

  const startClientReview = (clientId: ClientId) => {
    setActiveClientId(clientId);
    setScreen('clientGate');
  };

  const proceedToBenefitDetail = (benefitType: WorkplaceBenefitType) => {
    const family = familyForType(benefitType);
    const employer = getCurrentEmployer(activeClientId);
    const employerName = employer?.name || draftEmployerName || '';
    const employerId = employer?.id || '';
    setAdminSelection(undefined);
    setAdminName('');
    setEditingBenefitId(null);
    setDraftBenefit({
      clientId: activeClientId,
      employerId,
      employerName,
      employerIsCurrent: true,
      family,
      benefitType,
      benefitTypeLabel: benefitTypeLabel(benefitType),
      detailedReviewPending: family === 'definedBenefitPension' || family === 'employerEquity' || family === 'executiveDeferred',
    });
    setScreen('benefitDetail');
  };

  const proceedToFormerEmployerBenefit = (benefitType: WorkplaceBenefitType, employerId: string, employerName: string) => {
    const family = familyForType(benefitType);
    setAdminSelection(undefined);
    setAdminName('');
    setEditingBenefitId(null);
    setDraftBenefit({
      clientId: activeClientId,
      employerId,
      employerName,
      employerIsCurrent: false,
      family,
      benefitType,
      benefitTypeLabel: benefitTypeLabel(benefitType),
      detailedReviewPending: family === 'definedBenefitPension' || family === 'employerEquity' || family === 'executiveDeferred',
    });
    setScreen('benefitDetail');
  };

  const saveDraftAndReturn = () => {
    if (!draftBenefit.benefitType || !draftBenefit.clientId) {
      setScreen('review');
      return;
    }
    const benefitId = editingBenefitId || generateWorkplaceId();
    const family = familyForType(draftBenefit.benefitType);

    let footprintAccountId: string | undefined;
    let footprintAccountRecognized = false;

    // Reconcile with Financial Footprint
    if (ACCOUNT_BASED_TYPES.has(draftBenefit.benefitType) && draftBenefit.employerName) {
      const match = findMatchingPensionInFootprint(
        footprintPensions,
        draftBenefit.clientId,
        draftBenefit.employerName,
        draftBenefit.benefitType,
      );
      if (match) {
        footprintAccountId = match.id;
        footprintAccountRecognized = true;
      } else {
        // Create in Financial Footprint
        footprintAccountId = createPensionInFootprint(
          draftBenefit.clientId,
          draftBenefit.employerName,
          draftBenefit.benefitType,
          draftBenefit.planName,
        );
      }
    }

    // Equity: Footprint reconciliation is deferred to the equity detail screen.
    // Initial Workplace discovery only creates the Workplace benefit record.
    // Financial Footprint assets are created/linked only when the client confirms
    // they currently own shares (ownershipStatus = currently_own or both) in the
    // equity detail review. This prevents phantom assets for contingent awards.

    // Employer insurance handoff
    const insuranceHandoff = draftBenefit.benefitType === 'employer_life_insurance' || draftBenefit.benefitType === 'employer_death_benefit';

    const benefit: WorkplaceBenefit = {
      id: benefitId,
      clientId: draftBenefit.clientId,
      employerId: draftBenefit.employerId || '',
      employerName: draftBenefit.employerName || '',
      employerIsCurrent: draftBenefit.employerIsCurrent ?? false,
      family,
      benefitType: draftBenefit.benefitType,
      benefitTypeLabel: benefitTypeLabel(draftBenefit.benefitType),
      planName: draftBenefit.planName,
      memberStatus: draftBenefit.memberStatus,
      footprintAccountId,
      footprintAccountRecognized,
      administratorSelection: adminSelection,
      administratorName: adminSelection === 'other' ? adminName : (adminSelection && adminSelection !== 'employer_hr' ? adminSelection : undefined),
      administratorContactName: draftBenefit.administratorContactName,
      administratorContactPhone: draftBenefit.administratorContactPhone,
      administratorContactEmail: draftBenefit.administratorContactEmail,
      documentLocationRef: draftBenefit.documentLocationRef ?? null,
      dbPensionStatus: draftBenefit.dbPensionStatus,
      dbPensionDetails: draftBenefit.dbPensionDetails,
      equityBenefitDetails: draftBenefit.equityBenefitDetails,
      equityTypes: draftBenefit.equityTypes,
      executiveType: draftBenefit.executiveType,
      insuranceHandoff,
      insuranceContactSource: draftBenefit.insuranceContactSource,
      notes: draftBenefit.notes,
      detailedReviewPending: draftBenefit.detailedReviewPending,
    };
    saveBenefit(benefit);
    // Return to the right screen
    if (draftBenefit.employerIsCurrent) {
      setScreen('currentEmployerBenefits');
    } else {
      setScreen('formerEmployerBenefits');
    }
  };

  const editBenefit = (benefit: WorkplaceBenefit) => {
    setEditingBenefitId(benefit.id);
    setDraftBenefit({ ...benefit });
    setAdminSelection(benefit.administratorSelection);
    setAdminName(benefit.administratorName || '');
    setScreen('benefitDetail');
  };

  // ─── Render helpers ──────────────────────────────────────────────────────

  const inputClass =
    'w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-2';
  const sectionCard = 'border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-4';

  const renderOptionCard = (
    value: string,
    label: string,
    description: string,
    selected: boolean,
    onClick: () => void,
    icon?: React.ReactNode,
  ) => (
    <button
      key={value}
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-900/30 ring-1 ring-blue-500'
          : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-blue-400 mt-0.5 shrink-0">{icon}</div>}
        <div className="flex-1">
          <div className="font-medium text-white">{label}</div>
          {description && <div className="text-sm text-gray-400 mt-1">{description}</div>}
        </div>
        {selected ? (
          <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-gray-500 shrink-0" />
        )}
      </div>
    </button>
  );

  const renderYesNo = (
    value: string | undefined,
    onChange: (v: string) => void,
    options: Array<{ value: string; label: string }> = [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not_sure', label: "I'm not sure" },
    ],
  ) => (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-5 py-2.5 rounded-lg border transition-all font-medium ${
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

  // ─── Screens ──────────────────────────────────────────────────────────────

  const renderIntro = () => (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-blue-900/30 to-gray-800 border border-blue-800/40 p-6">
        <h3 className="text-xl font-semibold text-white mb-3">Workplace Pensions & Benefits</h3>
        <p className="text-gray-300 leading-relaxed">
          Some valuable financial benefits don't appear on your regular investment statements.
          Pensions, workplace savings plans, stock compensation and other employer benefits can
          remain with current or former employers for many years.
        </p>
        <p className="text-gray-300 leading-relaxed mt-3">
          We'll identify what you have, who administers it and where the important information can
          be found, so the people helping you know where to start.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {hasSpouse ? (
          <>
            <button
              type="button"
              onClick={() => startClientReview('client1')}
              className="flex items-center justify-between p-5 rounded-xl border border-gray-600 bg-gray-700/50 hover:border-blue-500 hover:bg-gray-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-300 font-bold">
                  {client1Name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">{client1Name}'s Workplace Pensions & Benefits</div>
                  <div className="text-sm text-gray-400">Review pensions, benefits and employer plans</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
            </button>
            <button
              type="button"
              onClick={() => startClientReview('client2')}
              className="flex items-center justify-between p-5 rounded-xl border border-gray-600 bg-gray-700/50 hover:border-blue-500 hover:bg-gray-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600/30 flex items-center justify-center text-emerald-300 font-bold">
                  {client2Name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">{client2Name}'s Workplace Pensions & Benefits</div>
                  <div className="text-sm text-gray-400">Review pensions, benefits and employer plans</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => startClientReview('client1')}
            className="flex items-center justify-between p-5 rounded-xl border border-gray-600 bg-gray-700/50 hover:border-blue-500 hover:bg-gray-700 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-300 font-bold">
                {client1Name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">{client1Name}'s Workplace Pensions & Benefits</div>
                <div className="text-sm text-gray-400">Review pensions, benefits and employer plans</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
          </button>
        )}
      </div>
      {/* Show existing review if data exists */}
      {(client1Data.benefits?.length || client2Data.benefits?.length) ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setScreen('review')}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View existing workplace benefits summary
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderClientGate = () => {
    const currentEmployer = getCurrentEmployer(activeClientId);
    // Auto-detect employer from footprint if not yet stored
    const detectedEmployer = !currentEmployer ? detectEmployerFromFootprint(activeClientId) : null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button type="button" onClick={() => setScreen('intro')} className="hover:text-blue-400 transition-colors">
            Back
          </button>
          <span>/</span>
          <span className="text-gray-300">{activeClientName}</span>
        </div>

        <div className={sectionCard}>
          <h3 className="text-lg font-semibold text-white">
            Does {activeClientName} have any workplace pensions or benefits?
          </h3>
          <p className="text-sm text-gray-400">
            This includes pensions, group savings plans, stock compensation, employer life
            insurance, or other financial benefits connected to current or former employment.
          </p>
          {renderYesNo(activeClientData.hasWorkplaceBenefits, (v) => {
            updateActiveClientData({
              hasWorkplaceBenefits: v,
              selectedBenefits: v !== 'yes' ? [] : activeClientData.selectedBenefits,
              benefits: v !== 'yes' ? [] : activeClientData.benefits,
              hasFormerEmployerBenefits: v !== 'yes' ? undefined : activeClientData.hasFormerEmployerBenefits,
            });
            if (v === 'yes' && detectedEmployer && !currentEmployer) {
              addOrUpdateEmployer(activeClientId, detectedEmployer, true);
            }
          })}
        </div>

        {activeClientData.hasWorkplaceBenefits === 'yes' && (
          <div className={sectionCard}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Current Employer</h3>
            </div>
            {currentEmployer ? (
              <div className="space-y-3">
                {editingEmployerId === currentEmployer.id ? (
                  <div className="space-y-3">
                    <label className={labelClass}>Edit employer name</label>
                    <input
                      type="text"
                      value={editEmployerName}
                      onChange={(e) => setEditEmployerName(e.target.value)}
                      className={inputClass}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (editEmployerName.trim()) {
                            addOrUpdateEmployer(activeClientId, editEmployerName.trim(), true, currentEmployer.id);
                            setEditingEmployerId(null);
                            setEditEmployerName('');
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmployerId(null);
                          setEditEmployerName('');
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm hover:border-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                    <div>
                      <div className="text-sm text-gray-400">Current employer:</div>
                      <div className="font-medium text-white">{currentEmployer.name}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEmployerId(currentEmployer.id);
                        setEditEmployerName(currentEmployer.name);
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
                {editingEmployerId !== currentEmployer.id && (
                  <button
                    type="button"
                    onClick={() => setScreen('currentEmployerBenefits')}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-600 bg-gray-700/50 hover:border-blue-500 transition-all group"
                  >
                    <span className="font-medium text-white">
                      Review benefits through {currentEmployer.name}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                  </button>
                )}
              </div>
            ) : detectedEmployer ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                  <div>
                    <div className="text-sm text-gray-400">Current employer (from your Financial Footprint):</div>
                    <div className="font-medium text-white">{detectedEmployer}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      addOrUpdateEmployer(activeClientId, detectedEmployer, true);
                      setScreen('currentEmployerBenefits');
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
                  >
                    Continue
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen('currentEmployerBenefits')}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {activeClientName} is not currently employed
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className={labelClass}>
                  What is {activeClientName}'s current employer?
                </label>
                <input
                  type="text"
                  value={draftEmployerName}
                  onChange={(e) => setDraftEmployerName(e.target.value)}
                  placeholder="Enter employer name"
                  className={inputClass}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={!draftEmployerName.trim()}
                    onClick={() => {
                      addOrUpdateEmployer(activeClientId, draftEmployerName.trim(), true);
                      setDraftEmployerName('');
                      setScreen('currentEmployerBenefits');
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirm employer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('currentEmployerBenefits');
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm hover:border-gray-500 transition-colors"
                  >
                    {activeClientName} is not currently employed
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeClientData.hasWorkplaceBenefits === 'no' && (
          <div className="rounded-lg bg-gray-700/40 border border-gray-600 p-4">
            <p className="text-sm text-gray-300">
              No workplace pensions or benefits identified for {activeClientName}.
            </p>
            {hasSpouse && activeClientId === 'client1' && (
              <button
                type="button"
                onClick={() => startClientReview('client2')}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                Continue to {client2Name}
              </button>
            )}
            {!hasSpouse || activeClientId === 'client2' ? (
              <button
                type="button"
                onClick={() => setScreen('review')}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                View summary
              </button>
            ) : null}
          </div>
        )}

        {activeClientData.hasWorkplaceBenefits === 'not_sure' && (
          <div className="rounded-lg bg-amber-900/20 border border-amber-700/40 p-4">
            <p className="text-sm text-amber-300">
              That's okay. You can review what you know now and add more later.
            </p>
            <button
              type="button"
              onClick={() => setScreen('currentEmployerBenefits')}
              className="mt-3 px-4 py-2 rounded-lg bg-amber-600/80 text-white text-sm font-medium hover:bg-amber-500 transition-colors"
            >
              Review what {activeClientName} may have
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentEmployerBenefits = () => {
    const employer = getCurrentEmployer(activeClientId);
    const employerName = employer?.name || 'current employer';
    const recognizedPlans = getRecognizedPlans(activeClientId, employerName);
    const recognizedBenefitTypes = new Set(recognizedPlans.map((p) => p.benefitType));

    // Benefits already added via workplace section (not counting auto-recognized ones)
    const addedBenefits = (activeClientData.benefits || []).filter(
      (b) => b.employerIsCurrent && !b.footprintAccountRecognized,
    );
    // Benefits that are recognized from footprint (shown as already identified)
    const recognizedBenefits = (activeClientData.benefits || []).filter(
      (b) => b.employerIsCurrent && b.footprintAccountRecognized,
    );

    // Options for adding new benefits — exclude account-based types already recognized
    const additionalOptions = ADDITIONAL_BENEFIT_OPTIONS.filter((opt) => {
      if (ACCOUNT_BASED_VALUES.has(opt.value) && recognizedBenefitTypes.has(opt.value as WorkplaceBenefitType)) {
        return false;
      }
      return true;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button type="button" onClick={() => setScreen('clientGate')} className="hover:text-blue-400">
            Back
          </button>
          <span>/</span>
          <span className="text-gray-300">{activeClientName} — {employerName}</span>
        </div>

        {/* Already identified from Financial Footprint */}
        {recognizedPlans.length > 0 && (
          <div className={sectionCard}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Already identified</h3>
            </div>
            <div className="space-y-3">
              {recognizedPlans.map((plan) => (
                <div key={plan.footprintId} className="flex items-center gap-3 p-4 rounded-lg bg-emerald-900/20 border border-emerald-700/40">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-white">{plan.label}</div>
                    {plan.planName && <div className="text-sm text-gray-400 mt-0.5">{plan.planName}</div>}
                    <div className="text-xs text-emerald-300 mt-1">Already in your Financial Footprint</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other benefits to add */}
        <div className={sectionCard}>
          <h3 className="text-lg font-semibold text-white">
            Does {activeClientName} have any other benefits through {employerName}?
          </h3>
          <p className="text-sm text-gray-400">Select everything that applies.</p>
          <div className="grid gap-3 mt-4">
            {additionalOptions.map((opt) =>
              renderOptionCard(
                opt.value,
                opt.label,
                opt.description || '',
                false,
                () => proceedToBenefitDetail(opt.value as WorkplaceBenefitType),
                BENEFIT_FAMILY_ICON[opt.family],
              ),
            )}
          </div>
        </div>

        {/* Show manually added benefits for this employer */}
        {addedBenefits.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Other benefits added for {employerName}
            </h4>
            {addedBenefits.map((b) => renderBenefitCard(b))}
          </div>
        )}

        {/* Show recognized benefits that have continuity info added */}
        {recognizedBenefits.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Continuity details added
            </h4>
            {recognizedBenefits.map((b) => renderBenefitCard(b))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setScreen('formerEmployerGate')}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            Continue to former employers
          </button>
        </div>
      </div>
    );
  };

  const renderBenefitDetail = () => {
    const bt = draftBenefit.benefitType;
    if (!bt) return null;
    const family = familyForType(bt);
    const employerName = draftBenefit.employerName || 'this employer';
    const isCurrent = draftBenefit.employerIsCurrent ?? true;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button
            type="button"
            onClick={() => {
              setDraftBenefit({});
              setEditingBenefitId(null);
              setScreen(isCurrent ? 'currentEmployerBenefits' : 'formerEmployerBenefits');
            }}
            className="hover:text-blue-400"
          >
            Back
          </button>
          <span>/</span>
          <span className="text-gray-300">{benefitTypeLabel(bt)}</span>
        </div>

        <div className={sectionCard}>
          <div className="flex items-center gap-3 pb-3 border-b border-gray-600">
            {BENEFIT_FAMILY_ICON[family]}
            <div>
              <h3 className="text-lg font-semibold text-white">{benefitTypeLabel(bt)}</h3>
              <p className="text-sm text-gray-400">
                {isCurrent ? 'Current employer' : 'Former employer'}: {employerName}
              </p>
            </div>
          </div>

          {/* Footprint reconciliation banner */}
          {ACCOUNT_BASED_TYPES.has(bt) && draftBenefit.footprintAccountRecognized && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">
                Already identified in your Financial Footprint — no duplicate will be created.
              </span>
            </div>
          )}

          {/* DB Pension — framework only */}
          {family === 'definedBenefitPension' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>What is the name of the pension plan?</label>
                <input
                  type="text"
                  value={draftBenefit.planName || ''}
                  onChange={(e) => setDraftBenefit({ ...draftBenefit, planName: e.target.value })}
                  placeholder="Enter plan name"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setDraftBenefit({ ...draftBenefit, planName: '' })}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-300"
                >
                  I don't know the formal plan name
                </button>
              </div>
              <div>
                <label className={labelClass}>
                  What is {activeClientName}'s current status in this pension?
                </label>
                <div className="space-y-2">
                  {DB_PENSION_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraftBenefit({ ...draftBenefit, dbPensionStatus: opt.value })}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        draftBenefit.dbPensionStatus === opt.value
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-white text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-900/20 border border-blue-700/40">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm text-blue-300">
                  You'll be able to add detailed pension information (estimates, indexing, survivor benefits, etc.) after saving this pension.
                </span>
              </div>
            </div>
          )}

          {/* Account-based plans — light continuity */}
          {family === 'accountBasedPlan' && !draftBenefit.footprintAccountRecognized && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-700/40 border border-gray-600">
                <Info className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-300">
                  This plan will be added to your Financial Footprint. Balance and account details
                  can be completed there.
                </span>
              </div>
              <div>
                <label className={labelClass}>Plan name (optional)</label>
                <input
                  type="text"
                  value={draftBenefit.planName || ''}
                  onChange={(e) => setDraftBenefit({ ...draftBenefit, planName: e.target.value })}
                  placeholder="e.g., Sun Life Group RRSP"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Employer Equity — framework only */}
          {family === 'employerEquity' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  What types of equity does {activeClientName} have?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EQUITY_TYPE_OPTIONS.map((opt) => {
                    const sel = (draftBenefit.equityTypes || []).includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const current = draftBenefit.equityTypes || [];
                          const next = sel
                            ? current.filter((v) => v !== opt.value)
                            : [...current, opt.value];
                          setDraftBenefit({ ...draftBenefit, equityTypes: next });
                        }}
                        className={`p-3 rounded-lg border text-sm transition-all text-left ${
                          sel
                            ? 'border-blue-500 bg-blue-900/30 text-white'
                            : 'border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-900/20 border border-blue-700/40">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm text-blue-300">
                  Detailed equity review (vesting, exercise, death treatment) will be collected separately.
                </span>
              </div>
            </div>
          )}

          {/* Executive / Deferred — framework */}
          {family === 'executiveDeferred' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Type of arrangement</label>
                <div className="space-y-2">
                  {EXECUTIVE_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraftBenefit({ ...draftBenefit, executiveType: opt.value })}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        draftBenefit.executiveType === opt.value
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-white text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Plan / arrangement name (optional)</label>
                <input
                  type="text"
                  value={draftBenefit.planName || ''}
                  onChange={(e) => setDraftBenefit({ ...draftBenefit, planName: e.target.value })}
                  placeholder="Enter name"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Employer Insurance — handoff */}
          {family === 'employerInsurance' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-900/20 border border-blue-700/40">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm text-blue-300">
                  We've identified that {activeClientName} may have life insurance or a death benefit
                  through {employerName}. We'll collect the policy details in the Life & Disability
                  Insurance section.
                </span>
              </div>
              <div>
                <label className={labelClass}>
                  Who would someone contact about this benefit?
                </label>
                <div className="space-y-2">
                  {INSURANCE_CONTACT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraftBenefit({ ...draftBenefit, insuranceContactSource: opt.value })}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        draftBenefit.insuranceContactSource === opt.value
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-white text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other / not sure */}
          {family === 'other' && (
            <div>
              <label className={labelClass}>Tell us what you know (optional)</label>
              <textarea
                value={draftBenefit.notes || ''}
                onChange={(e) => setDraftBenefit({ ...draftBenefit, notes: e.target.value })}
                placeholder="Describe the benefit as best you can."
                rows={3}
                className={inputClass}
              />
            </div>
          )}

          {/* Shared: administrator */}
          {family !== 'other' && (
            <div className="pt-4 border-t border-gray-600 space-y-3">
              <label className={labelClass}>Who administers this plan? (optional)</label>
              <div className="flex flex-wrap gap-2">
                {ADMINISTRATOR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAdminSelection(preset);
                      if (preset !== 'Other') setAdminName('');
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      adminSelection === preset
                        ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              {adminSelection === 'Other' && (
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Administrator name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Enter administrator name"
                    className={inputClass}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* Shared: document location */}
          <div className="pt-4 border-t border-gray-600">
            <label className={labelClass}>Where could someone find the latest statement or plan information?</label>
            <RepoDocumentLocationPicker
              value={draftBenefit.documentLocationRef ?? undefined}
              onChange={(ref) => {
                if (ref && typeof ref === 'object' && 'locationId' in ref) {
                  const docRef = ref as DocumentLocationRef;
                  setDraftBenefit({ ...draftBenefit, documentLocationRef: docRef });
                } else {
                  setDraftBenefit({ ...draftBenefit, documentLocationRef: null });
                }
              }}
              label="Document location"
              placeholder="Select or add a location"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setDraftBenefit({});
              setEditingBenefitId(null);
              setScreen(isCurrent ? 'currentEmployerBenefits' : 'formerEmployerBenefits');
            }}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveDraftAndReturn}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            {editingBenefitId ? 'Update benefit' : 'Add benefit'}
          </button>
        </div>
      </div>
    );
  };

  const renderFormerEmployerGate = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button type="button" onClick={() => setScreen('currentEmployerBenefits')} className="hover:text-blue-400">
          Back
        </button>
        <span>/</span>
        <span className="text-gray-300">Former employers</span>
      </div>

      <div className={sectionCard}>
        <h3 className="text-lg font-semibold text-white">
          Does {activeClientName} still have any pensions, retirement savings, shares, stock options
          or other financial benefits with a former employer?
        </h3>
        <p className="text-sm text-gray-400">
          Think about employers where you may have left a pension behind, workplace savings you
          didn't transfer, share plans, stock awards or other benefits that may still exist.
        </p>
        {renderYesNo(activeClientData.hasFormerEmployerBenefits, (v) => {
          updateActiveClientData({
            hasFormerEmployerBenefits: v,
            employers: v !== 'yes' ? activeClientData.employers?.filter((e) => e.isCurrent) : activeClientData.employers,
            benefits: v !== 'yes' ? (activeClientData.benefits || []).filter((b) => b.employerIsCurrent) : activeClientData.benefits,
          });
          if (v === 'yes') setScreen('formerEmployerName');
          if (v === 'no' || v === 'not_sure') setScreen('closingDiscovery');
        })}
      </div>
    </div>
  );

  const renderFormerEmployerName = () => {
    const data = activeClientData;
    const formerEmployers = (data.employers || []).filter((e) => !e.isCurrent);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button type="button" onClick={() => setScreen('formerEmployerGate')} className="hover:text-blue-400">
            Back
          </button>
          <span>/</span>
          <span className="text-gray-300">Former employer</span>
        </div>

        <div className={sectionCard}>
          <h3 className="text-lg font-semibold text-white">
            Which former employer is this connected to?
          </h3>
          <input
            type="text"
            value={draftEmployerName}
            onChange={(e) => setDraftEmployerName(e.target.value)}
            placeholder="Enter former employer name"
            className={inputClass}
          />
          <button
            type="button"
            disabled={!draftEmployerName.trim()}
            onClick={() => {
              const newId = addOrUpdateEmployer(activeClientId, draftEmployerName.trim(), false);
              setDraftEmployerName('');
              // Store the newly created employer ID for the benefit selector
              setDraftBenefit({ ...draftBenefit, employerId: newId, employerName: draftEmployerName.trim(), employerIsCurrent: false });
              setScreen('formerEmployerBenefits');
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-40"
          >
            Add former employer
          </button>
        </div>

        {formerEmployers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Former employers added
            </h4>
            {formerEmployers.map((emp) => {
              const empBenefits = (data.benefits || []).filter((b) => b.employerId === emp.id);
              return (
                <div key={emp.id} className="border border-gray-600 rounded-xl p-4 bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white">{emp.name}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftBenefit({ ...draftBenefit, employerId: emp.id, employerName: emp.name, employerIsCurrent: false });
                        setScreen('formerEmployerBenefits');
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Review benefits
                    </button>
                  </div>
                  {empBenefits.length > 0 && (
                    <div className="text-sm text-gray-400">{empBenefits.length} benefit(s) added</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setScreen('closingDiscovery')}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500"
          >
            Done adding former employers
          </button>
        </div>
      </div>
    );
  };

  const renderFormerEmployerBenefits = () => {
    const employerId = draftBenefit.employerId;
    const employerName = draftBenefit.employerName || '';
    if (!employerId) {
      return (
        <div className={sectionCard}>
          <p className="text-gray-300">No former employer selected.</p>
          <button type="button" onClick={() => setScreen('formerEmployerName')} className="text-blue-400">
            Select a former employer
          </button>
        </div>
      );
    }
    const recognizedPlans = getRecognizedPlans(activeClientId, employerName);
    const recognizedBenefitTypes = new Set(recognizedPlans.map((p) => p.benefitType));
    const addedBenefits = (activeClientData.benefits || []).filter(
      (b) => b.employerId === employerId && !b.footprintAccountRecognized,
    );
    const recognizedBenefits = (activeClientData.benefits || []).filter(
      (b) => b.employerId === employerId && b.footprintAccountRecognized,
    );
    const additionalOptions = ADDITIONAL_BENEFIT_OPTIONS.filter((opt) => {
      if (ACCOUNT_BASED_VALUES.has(opt.value) && recognizedBenefitTypes.has(opt.value as WorkplaceBenefitType)) {
        return false;
      }
      return true;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button type="button" onClick={() => setScreen('formerEmployerName')} className="hover:text-blue-400">
            Back
          </button>
          <span>/</span>
          <span className="text-gray-300">{employerName}</span>
        </div>

        {recognizedPlans.length > 0 && (
          <div className={sectionCard}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Already identified</h3>
            </div>
            <div className="space-y-3">
              {recognizedPlans.map((plan) => (
                <div key={plan.footprintId} className="flex items-center gap-3 p-4 rounded-lg bg-emerald-900/20 border border-emerald-700/40">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-white">{plan.label}</div>
                    {plan.planName && <div className="text-sm text-gray-400 mt-0.5">{plan.planName}</div>}
                    <div className="text-xs text-emerald-300 mt-1">Already in your Financial Footprint</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={sectionCard}>
          <h3 className="text-lg font-semibold text-white">
            What other benefits does {activeClientName} still have connected to {employerName}?
          </h3>
          <p className="text-sm text-gray-400">Select everything that applies.</p>
          <div className="grid gap-3 mt-4">
            {additionalOptions.map((opt) =>
              renderOptionCard(
                opt.value,
                opt.label,
                opt.description || '',
                false,
                () => proceedToFormerEmployerBenefit(opt.value as WorkplaceBenefitType, employerId, employerName),
                BENEFIT_FAMILY_ICON[opt.family],
              ),
            )}
          </div>
        </div>

        {addedBenefits.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Other benefits added for {employerName}
            </h4>
            {addedBenefits.map((b) => renderBenefitCard(b))}
          </div>
        )}

        {recognizedBenefits.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Continuity details added
            </h4>
            {recognizedBenefits.map((b) => renderBenefitCard(b))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setScreen('formerEmployerName')}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500"
        >
          Add another former employer
        </button>
        <button
          type="button"
          onClick={() => setScreen('closingDiscovery')}
          className="ml-3 px-5 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500"
        >
          Continue
        </button>
      </div>
    );
  };

  const renderClosingDiscovery = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button
          type="button"
          onClick={() => setScreen('formerEmployerGate')}
          className="hover:text-blue-400"
        >
          Back
        </button>
        <span>/</span>
        <span className="text-gray-300">Anything else?</span>
      </div>

      <div className={sectionCard}>
        <h3 className="text-lg font-semibold text-white">
          Is there anything else connected to {activeClientName}'s current or former employment that
          could have financial value for {activeClientName} or {activeClientName}'s family?
        </h3>
        <p className="text-sm text-gray-400">
          For example, an old pension, share plan, deferred compensation, death benefit or something
          you aren't quite sure how to classify.
        </p>
        {renderYesNo(activeClientData.hasOtherEmploymentValue, (v) => {
          updateActiveClientData({ hasOtherEmploymentValue: v });
          if (v === 'yes') {
            // Add an "other" benefit
            setDraftBenefit({
              clientId: activeClientId,
              employerName: '',
              employerIsCurrent: false,
              family: 'other',
              benefitType: 'other',
              benefitTypeLabel: 'Other financial benefit',
            });
            setScreen('benefitDetail');
          } else {
            setScreen('review');
          }
        })}
      </div>
    </div>
  );

  const renderBenefitCard = (b: WorkplaceBenefit) => (
    <div key={b.id} className="border border-gray-600 rounded-xl p-5 bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-blue-400 mt-0.5">{BENEFIT_FAMILY_ICON[b.family]}</div>
          <div className="flex-1">
            <div className="font-medium text-white">{b.benefitTypeLabel}</div>
            {b.planName && <div className="text-sm text-gray-400 mt-0.5">{b.planName}</div>}
            {b.footprintAccountRecognized && (
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-300">In Financial Footprint</span>
              </div>
            )}
            {b.footprintAccountId && !b.footprintAccountRecognized && (
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-300">Added to Financial Footprint</span>
              </div>
            )}
            {b.detailedReviewPending && (
              <div className="text-xs text-amber-300 mt-1">Detailed review to be completed</div>
            )}
            {b.insuranceHandoff && (
              <div className="text-xs text-blue-300 mt-1">
                Policy details will be collected in Life & Disability Insurance
              </div>
            )}
            {b.administratorName && (
              <div className="text-xs text-gray-400 mt-1">Administrator: {b.administratorName}</div>
            )}
            {b.administratorSelection && b.administratorSelection !== 'other' && !b.administratorName && (
              <div className="text-xs text-gray-400 mt-1">Administrator: {b.administratorSelection}</div>
            )}
            {b.documentLocationRef && (
              <div className="text-xs text-gray-400">Documents: {b.documentLocationRef.label}</div>
            )}
            {b.dbPensionStatus && (
              <div className="text-xs text-gray-400">
                Status: {DB_PENSION_STATUS_OPTIONS.find((s) => s.value === b.dbPensionStatus)?.label || b.dbPensionStatus}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => editBenefit(b)}
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => deleteBenefit(b.id)}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Equity Detail helpers ─────────────────────────────────────────────────
  const openEquityDetail = (benefit: WorkplaceBenefit, clientId: ClientId) => {
    setActiveClientId(clientId);
    setEquityDetailEditing(benefit.id);
    setEquityDetailsDraft(benefit.equityBenefitDetails || {});
    setScreen('equityDetail');
  };

  const saveEquityDetails = () => {
    if (!equityDetailEditing) {
      setScreen('review');
      return;
    }
    const data = (answers[`${activeClientId}Data`] as WorkplaceClientData) || {};
    const benefits = data.benefits || [];
    const benefitBeingSaved = benefits.find((b) => b.id === equityDetailEditing);
    if (!benefitBeingSaved) {
      setEquityDetailEditing(null);
      setEquityDetailsDraft({});
      setScreen('review');
      return;
    }

    const draft = equityDetailsDraft;
    const ownership = draft.ownershipStatus;
    const isOwned = ownership === 'currently_own' || ownership === 'both';

    // Determine footprint reconciliation
    let footprintAccountId = benefitBeingSaved.footprintAccountId;
    let footprintAccountRecognized = benefitBeingSaved.footprintAccountRecognized || false;

    if (isOwned) {
      // Search for existing matching equity in footprint first
      const existingMatch = findMatchingEquityInFootprint(
        footprintEquity,
        activeClientId,
        benefitBeingSaved.employerName,
      );
      if (existingMatch) {
        footprintAccountId = existingMatch.id;
        footprintAccountRecognized = true;
      } else if (draft.footprintOffered === 'yes' && !footprintAccountId) {
        // Client chose "Add them now" — create the canonical footprint asset
        footprintAccountId = createEquityInFootprint(
          activeClientId,
          benefitBeingSaved.employerName,
          [benefitBeingSaved.benefitType],
        );
        footprintAccountRecognized = false;
      }
    } else {
      // Ownership changed away from owned — remove the Workplace relationship
      // but do NOT delete the Financial Footprint asset itself
      if (footprintAccountId && !footprintAccountRecognized) {
        // Only clear if it was created via Workplace (not recognized from footprint)
        footprintAccountId = undefined;
        footprintAccountRecognized = false;
      }
    }

    const updated = benefits.map((b) =>
      b.id === equityDetailEditing
        ? {
            ...b,
            equityBenefitDetails: draft,
            detailedReviewPending: false,
            planName: draft.planName || b.planName,
            footprintAccountId,
            footprintAccountRecognized,
          }
        : b,
    );
    updateActiveClientData({ benefits: updated });
    setEquityDetailEditing(null);
    setEquityDetailsDraft({});
    setScreen('review');
  };

  // ─── DB Pension Detail helpers (must be before renderReview) ───────────────
  const openDbPensionDetail = (benefit: WorkplaceBenefit, clientId: ClientId) => {
    setActiveClientId(clientId);
    setDbPensionDetailEditing(benefit.id);
    setDbPensionDetailsDraft(benefit.dbPensionDetails || {});
    setScreen('dbPensionDetail');
  };

  const saveDbPensionDetails = () => {
    if (!dbPensionDetailEditing) {
      setScreen('benefitDetail');
      return;
    }
    const data = (answers[`${activeClientId}Data`] as WorkplaceClientData) || {};
    const benefits = data.benefits || [];
    const updated = benefits.map((b) =>
      b.id === dbPensionDetailEditing
        ? { ...b, dbPensionDetails: dbPensionDetailsDraft, detailedReviewPending: false }
        : b,
    );
    updateActiveClientData({ benefits: updated });
    setDbPensionDetailEditing(null);
    setDbPensionDetailsDraft({});
    setScreen('review');
  };

  const renderReview = () => {
    const clients: Array<{ id: ClientId; name: string; data: WorkplaceClientData }> = [
      { id: 'client1', name: client1Name, data: client1Data },
    ];
    if (hasSpouse) {
      clients.push({ id: 'client2', name: client2Name, data: client2Data });
    }

    const hasAnyBenefits = clients.some((c) => (c.data.benefits || []).length > 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button type="button" onClick={() => setScreen('intro')} className="hover:text-blue-400">
            Back
          </button>
        </div>

        <h3 className="text-xl font-semibold text-white">Workplace Pensions & Benefits Summary</h3>

        {!hasAnyBenefits && (
          <div className="rounded-lg bg-gray-700/40 border border-gray-600 p-4">
            <p className="text-sm text-gray-300">
              No workplace pensions or benefits have been identified yet.
            </p>
          </div>
        )}

        {clients.map((client) => {
          const benefits = client.data.benefits || [];
          if (benefits.length === 0 && !client.data.governmentBenefits) return null;

          // Group by employer
          const byEmployer = new Map<string, { employer: EmployerRecord | undefined; benefits: WorkplaceBenefit[] }>();
          benefits.forEach((b) => {
            const key = b.employerId || b.employerName || '_unknown';
            if (!byEmployer.has(key)) {
              const employer = (client.data.employers || []).find((e) => e.id === b.employerId);
              byEmployer.set(key, { employer, benefits: [] });
            }
            byEmployer.get(key)!.benefits.push(b);
          });


          const govData = client.data.governmentBenefits;

          return (
            <div key={client.id} className="space-y-4">
              <div className="pb-2 border-b border-gray-600">
                <h4 className="text-lg font-semibold text-white uppercase tracking-wide">
                  {client.name}'s Workplace Pensions & Benefits
                </h4>
              </div>

              {Array.from(byEmployer.entries()).map(([key, group]) => {
                const empName = group.employer?.name || benefits.find((b) => b.employerId === key)?.employerName || 'Unknown employer';
                const isCurrent = group.employer?.isCurrent ?? benefits.find((b) => b.employerId === key)?.employerIsCurrent ?? true;
                return (
                  <div key={key} className="space-y-3 ml-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-200">
                        {empName} — {isCurrent ? 'Current Employer' : 'Former Employer'}
                      </span>
                    </div>
                    <div className="ml-6 space-y-2">
                      {group.benefits.map((b) => renderBenefitCard(b))}
                      {group.benefits.filter((b) => b.family === 'definedBenefitPension').map((b) => (
                        <button
                          key={`dbp-${b.id}`}
                          type="button"
                          onClick={() => openDbPensionDetail(b, client.id)}
                          className="w-full text-left px-4 py-2 rounded-lg border border-blue-600 text-blue-300 text-sm hover:bg-blue-900/20 transition-colors"
                        >
                          {b.dbPensionDetails ? 'Edit pension details' : 'Add pension details (estimates, survivor, indexing...)'}
                        </button>
                      ))}
                      {group.benefits.filter((b) => b.family === 'employerEquity' || b.family === 'executiveDeferred').map((b) => (
                        <button
                          key={`eqd-${b.id}`}
                          type="button"
                          onClick={() => openEquityDetail(b, client.id)}
                          className="w-full text-left px-4 py-2 rounded-lg border border-blue-600 text-blue-300 text-sm hover:bg-blue-900/20 transition-colors"
                        >
                          {b.equityBenefitDetails ? 'Edit equity/compensation details' : 'Add equity/compensation details (vesting, value, death rules...)'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Government Benefits section */}
              <div className="ml-2 space-y-3">
                <div className="flex items-center gap-2 pt-2">
                  <Landmark className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-200">Government Retirement Benefits</span>
                </div>
                <div className="ml-6">
                  {govData?.cppQpp || govData?.oas ? (
                    <div className="space-y-2">
                      {govData.cppQpp && (
                        <div className="border border-gray-600 rounded-lg p-3 bg-gray-800 text-sm">
                          <span className="text-white font-medium">{govData.cppQpp.programType === 'qpp' ? 'QPP' : 'CPP'}</span>
                          <span className="text-gray-400 ml-2">
                            {govData.cppQpp.status === 'receiving'
                              ? `Receiving ${govData.cppQpp.currentAmount ?? '—'}/mo`
                              : govData.cppQpp.estimatedAmount !== undefined
                                ? `Est. ${govData.cppQpp.estimatedAmount}/mo at age ${govData.cppQpp.estimateBasedOnAge ?? '—'}`
                                : 'No estimate yet'}
                          </span>
                        </div>
                      )}
                      {govData.oas && (
                        <div className="border border-gray-600 rounded-lg p-3 bg-gray-800 text-sm">
                          <span className="text-white font-medium">OAS</span>
                          <span className="text-gray-400 ml-2">
                            {govData.oas.status === 'receiving'
                              ? `Receiving ${govData.oas.currentAmount ?? '—'}/mo`
                              : govData.oas.estimatedAmount !== undefined
                                ? `Est. ${govData.oas.estimatedAmount}/mo`
                                : 'No estimate yet'}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveClientId(client.id);
                          setScreen('governmentBenefits');
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Edit government benefits
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveClientId(client.id);
                        setScreen('governmentBenefits');
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm hover:border-gray-500 transition-colors"
                    >
                      Add CPP/QPP and OAS information
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => startClientReview('client1')}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-colors"
          >
            Edit {client1Name}'s benefits
          </button>
          {hasSpouse && (
            <button
              type="button"
              onClick={() => startClientReview('client2')}
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-colors"
            >
              Edit {client2Name}'s benefits
            </button>
          )}
        </div>
      </div>
    );
  };

  // ─── Equity Detail screen ──────────────────────────────────────────────────
  const renderEquityDetail = () => {
    if (!equityDetailEditing) {
      return (
        <div className={sectionCard}>
          <p className="text-gray-300">No benefit selected for detailed review.</p>
          <button type="button" onClick={() => setScreen('review')} className="text-blue-400">
            Back to summary
          </button>
        </div>
      );
    }
    const benefit = (activeClientData.benefits || []).find((b) => b.id === equityDetailEditing);
    if (!benefit) {
      return (
        <div className={sectionCard}>
          <p className="text-gray-300">Benefit not found.</p>
          <button type="button" onClick={() => setScreen('review')} className="text-blue-400">
            Back to summary
          </button>
        </div>
      );
    }
    return (
      <EquityBenefitDetail
        details={equityDetailsDraft}
        onChange={setEquityDetailsDraft}
        employerName={benefit.employerName}
        benefitTypeLabel={benefit.benefitTypeLabel}
        benefitType={benefit.benefitType}
        employerIsCurrent={benefit.employerIsCurrent}
        peopleOptions={peopleOptions}
        administratorName={benefit.administratorName}
        documentLocationLabel={benefit.documentLocationRef?.label}
        footprintAssetId={equityDetailsDraft.footprintAssetId ?? benefit.footprintAccountId}
        footprintAssetRecognized={equityDetailsDraft.footprintAssetRecognized ?? benefit.footprintAccountRecognized}
        onFootprintAssetIdChange={(id, recognized) => {
          // When user clicks "Add them now", search for existing match first
          if (!id && !recognized) {
            const existingMatch = findMatchingEquityInFootprint(
              footprintEquity,
              activeClientId,
              benefit.employerName,
            );
            if (existingMatch) {
              setEquityDetailsDraft((prev) => ({
                ...prev,
                footprintAssetId: existingMatch.id,
                footprintAssetRecognized: true,
                footprintOffered: 'yes',
              }));
              return;
            }
          }
          setEquityDetailsDraft((prev) => ({
            ...prev,
            footprintAssetId: id,
            footprintAssetRecognized: recognized,
          }));
        }}
        onBack={() => {
          setEquityDetailEditing(null);
          setEquityDetailsDraft({});
          setScreen('review');
        }}
        onSave={saveEquityDetails}
      />
    );
  };

  // ─── DB Pension Detail screen ──────────────────────────────────────────────
  const renderDbPensionDetail = () => {
    if (!dbPensionDetailEditing) {
      return (
        <div className={sectionCard}>
          <p className="text-gray-300">No pension selected for detailed review.</p>
          <button type="button" onClick={() => setScreen('review')} className="text-blue-400">
            Back to summary
          </button>
        </div>
      );
    }
    const benefit = (activeClientData.benefits || []).find((b) => b.id === dbPensionDetailEditing);
    if (!benefit) {
      return (
        <div className={sectionCard}>
          <p className="text-gray-300">Pension not found.</p>
          <button type="button" onClick={() => setScreen('review')} className="text-blue-400">
            Back to summary
          </button>
        </div>
      );
    }
    return (
      <DbPensionDetail
        details={dbPensionDetailsDraft}
        onChange={setDbPensionDetailsDraft}
        employerName={benefit.employerName}
        pensionStatus={benefit.dbPensionStatus || 'not_sure'}
        spouseName={hasSpouse ? activeSpouseName : undefined}
        spousePersonId={activeSpousePersonId}
        hasMarriageContract={hasMarriageContract}
        peopleOptions={peopleOptions}
        planName={benefit.planName}
        administratorName={benefit.administratorName}
        documentLocationLabel={benefit.documentLocationRef?.label}
        onBack={() => {
          setDbPensionDetailEditing(null);
          setDbPensionDetailsDraft({});
          setScreen('review');
        }}
        onSave={saveDbPensionDetails}
      />
    );
  };

  // ─── Government Retirement Benefits screen ──────────────────────────────────
  const renderGovernmentBenefits = () => {
    const govData: GovernmentBenefitsData = activeClientData.governmentBenefits || {};
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button type="button" onClick={() => setScreen('review')} className="hover:text-blue-400">
            Back
          </button>
          <span>/</span>
          <span className="text-gray-300">{activeClientName} — Government Benefits</span>
        </div>
        <GovernmentRetirementBenefits
          data={govData}
          onChange={(d) => updateActiveClientData({ governmentBenefits: d })}
          clientName={activeClientName}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setScreen('review')}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            Save and return to summary
          </button>
        </div>
      </div>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────────

  switch (screen) {
    case 'intro': return renderIntro();
    case 'clientGate': return renderClientGate();
    case 'currentEmployerBenefits': return renderCurrentEmployerBenefits();
    case 'benefitDetail': return renderBenefitDetail();
    case 'dbPensionDetail': return renderDbPensionDetail();
    case 'equityDetail': return renderEquityDetail();
    case 'formerEmployerGate': return renderFormerEmployerGate();
    case 'formerEmployerName': return renderFormerEmployerName();
    case 'formerEmployerBenefits': return renderFormerEmployerBenefits();
    case 'closingDiscovery': return renderClosingDiscovery();
    case 'governmentBenefits': return renderGovernmentBenefits();
    case 'review': return renderReview();
    default: return renderIntro();
  }
}
