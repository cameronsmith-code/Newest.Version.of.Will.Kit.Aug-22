import React, { useState, useMemo, useCallback } from 'react';
import {
  FileText,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Users,
  Building2,
  Heart,
  Shield,
  Gift,
  Info,
  Pencil,
} from 'lucide-react';
import {
  inputClass,
  labelClass,
  sectionCardClass,
  subtleTextClass,
  OptionButton,
  SectionHeading,
} from './FinancialFootprintShared';
import {
  type CurrentWillData,
  type ClientWillUnderstanding,
  type WillDocumentBasics,
  type WillJurisdiction,
  type WillJurisdictionType,
  type ClientUnderstanding,
  type FirstDeathUnderstanding,
  type FirstDeathException,
  type ResidueUnderstanding,
  type ChildPredeceaseUnderstanding,
  type InheritanceType,
  type TrustKnownTypeName,
  type SpecialArrangementType,
  type TrustStage,
  type SpecificGift,
  type CharitableGift,
  type UltimateContingencyUnderstanding,
  type OverallConfidence,
  type EstatePlanAlignment,
  type AlignmentSubjectType,
  type ComplexityFactors,
  type SimilarWillsDifferences,
  emptyClientWill,
  generatePlanningRiskFlags,
  generatePlanningFlags,
  getUnderstandingLabel,
  getUnderstandingColor,
  getFlagSeverityColor,
  getInheritanceTypeLabel,
  getFlagSeverityLabel,
  migrateLegacyWillFields,
} from '../lib/currentWillTypes';
import {
  getCurrentLawyers,
  type ProfessionalAdvisor,
} from '../lib/referentialIntegrity';
import {
  type LegacyIntentRecord,
  type LegacyPerson,
  getEligibleRecipientsForScenario,
  getAvailableLegacyAssets,
} from '../lib/legacyIntentTypes';
import { getClientOwnedCorporations, getClientNames } from '../lib/corporateOwnership';
import DocumentLocationPicker from './DocumentLocationPicker';
import {
  type BlendedFamilyAnswers,
  type ChildProtectionIntent,
  type ProtectionMechanism,
  type SurvivorControlUnderstanding,
  type DomesticAgreementAlignment,
  type TreatChildrenSameWay,
  type FirstDeathPassToSpouse,
  type RemarriageConcern,
  getFamilyComplexityProfile,
  getSupportObligations,
  getDomesticAgreements,
  getChildParentage,
  generateBlendedFamilyFlags,
  getProtectionMechanismLabel,
  getFirstDeathPassToSpouseLabel,
} from '../lib/blendedFamilyTypes';

type Props = {
  answers: Record<string, unknown>;
  allAnswers: Map<string, Record<string, unknown>>;
  onAnswerChange: (key: string, value: unknown) => void;
};

const FAMILIARITY_OPTIONS = [
  { value: 'very_familiar', label: 'Very familiar' },
  { value: 'generally_familiar', label: 'Generally familiar' },
  { value: 'remember_main_parts', label: 'I remember the main parts' },
  { value: 'not_very_familiar', label: 'Not very familiar' },
  { value: 'dont_remember', label: "I don't remember" },
];

const FIRST_DEATH_OPTIONS = [
  { value: 'all_to_spouse', label: 'Everything / substantially everything goes to my spouse' },
  { value: 'mostly_to_spouse', label: 'Most goes to my spouse, with some exceptions' },
  { value: 'some_to_spouse_some_to_others', label: 'Some goes to my spouse and some to other beneficiaries' },
  { value: 'another_arrangement', label: 'My estate follows another arrangement' },
  { value: 'not_sure', label: "I'm not sure" },
];

const SIMILAR_WILLS_OPTIONS = [
  { value: 'yes_similar', label: 'Yes, they\'re generally similar' },
  { value: 'mostly_different', label: 'Mostly, with some differences' },
  { value: 'no_quite_different', label: 'No, they\'re quite different' },
  { value: 'not_sure', label: "I'm not sure" },
];

const SIMILAR_WILLS_DIFFERENCE_OPTIONS = [
  { value: 'estate_trustees', label: 'Different Estate Trustees' },
  { value: 'specific_gifts', label: 'Different specific gifts' },
  { value: 'business_provisions', label: 'Different business provisions' },
  { value: 'beneficiaries', label: 'Different beneficiaries' },
  { value: 'legacy_asset_provisions', label: 'Different Legacy Asset provisions' },
  { value: 'trusts', label: 'Different trusts' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

const CANADIAN_PROVINCES = [
  'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba',
  'Saskatchewan', 'Nova Scotia', 'New Brunswick',
  'Newfoundland and Labrador', 'Prince Edward Island',
  'Northwest Territories', 'Nunavut', 'Yukon',
];

const LAWYER_PREPARED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "I'm not sure" },
];

const JURISDICTION_TYPE_OPTIONS = [
  { value: 'canada', label: 'Canada' },
  { value: 'outside_canada', label: 'Outside Canada' },
  { value: 'not_sure', label: "I'm not sure" },
];

const RESIDUE_OPTIONS = [
  { value: 'children_equally', label: 'Children equally' },
  { value: 'children_different_shares', label: 'Children in different shares' },
  { value: 'by_family_branch', label: 'Children/descendants by family branch' },
  { value: 'specific_beneficiaries', label: 'Specific beneficiaries' },
  { value: 'family_and_other', label: 'A combination of family and other beneficiaries' },
  { value: 'charity', label: 'Charity/charities' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

const CHILD_PREDECEASE_OPTIONS = [
  { value: 'to_that_child_descendants', label: 'Their share goes to their children/descendants' },
  { value: 'divided_among_surviving_children', label: 'Their share is divided among my surviving children' },
  { value: 'goes_elsewhere', label: 'Their share goes somewhere else' },
  { value: 'depends', label: 'It depends on the circumstances' },
  { value: 'not_sure', label: "I'm not sure" },
];

const INHERITANCE_OPTIONS = [
  { value: 'outright', label: 'Paid to them outright' },
  { value: 'held_until_age', label: 'Held and managed for them until a certain age' },
  { value: 'released_gradually', label: 'Released gradually at different ages or stages' },
  { value: 'held_longer_period', label: 'Held and managed for them for a longer period' },
  { value: 'different_arrangements', label: 'Different arrangements apply to different children' },
  { value: 'not_sure', label: "I'm not sure" },
];

const ULTIMATE_CONTINGENCY_OPTIONS = [
  { value: 'extended_family', label: 'Extended family' },
  { value: 'specific_people', label: 'Specific people' },
  { value: 'friends', label: 'Friends' },
  { value: 'charity', label: 'Charity/charities' },
  { value: 'combination', label: 'A combination' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

const CONFIDENCE_OPTIONS = [
  { value: 'very_confident', label: 'Very confident' },
  { value: 'mostly_confident', label: 'Mostly confident' },
  { value: 'not_sure', label: "I'm not sure" },
  { value: 'knows_changes_needed', label: 'I know there are things I want changed' },
  { value: 'long_time_since_review', label: "I haven't reviewed it in a long time" },
];

const ALIGNMENT_OPTIONS: Array<{ value: ClientUnderstanding; label: string }> = [
  { value: 'believesAligned', label: 'Yes, I believe so' },
  { value: 'partiallyAligned', label: 'Some of it is' },
  { value: 'notAligned', label: 'No' },
  { value: 'unsure', label: "I'm not sure" },
  { value: 'notAddressed', label: "I don't believe my Will specifically addresses this asset" },
];

const YES_NO_UNSURE = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "I'm not sure" },
];

const GIFT_TYPE_OPTIONS = [
  { value: 'asset', label: 'Specific asset' },
  { value: 'dollar', label: 'Dollar amount' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'possession', label: 'Personal possession' },
  { value: 'person', label: 'Gift to a person' },
  { value: 'charity', label: 'Gift to a charity/organization' },
  { value: 'other', label: 'Other' },
];

const CHARITY_FORM_OPTIONS = [
  { value: 'fixed_amount', label: 'Fixed amount' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'residue', label: 'Residue of estate' },
  { value: 'specific_asset', label: 'Specific asset' },
  { value: 'other', label: 'Other' },
];

const SPECIAL_ARRANGEMENT_OPTIONS = [
  { value: 'managed_ongoing', label: 'Money is managed for them on an ongoing basis' },
  { value: 'trustee_discretion', label: 'The trustee has discretion over when and how much is paid' },
  { value: 'held_for_lifetime', label: 'Inheritance is held for their lifetime' },
  { value: 'different_distribution_ages', label: 'Different distribution ages apply' },
  { value: 'another_special_arrangement', label: 'Another special arrangement' },
  { value: 'not_sure', label: "I'm not sure" },
];

const TRUST_KNOWN_NAME_OPTIONS = [
  { value: 'henson_trust', label: 'Henson Trust' },
  { value: 'testamentary_trust', label: 'Testamentary trust' },
  { value: 'lifetime_trust', label: 'Lifetime trust' },
  { value: 'discretionary_trust', label: 'Another discretionary trust' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
}

function scenarioLabel(scenario: string): string {
  switch (scenario) {
    case 'firstDeath': return 'First death';
    case 'bothDeceased': return 'Neither of you living';
    case 'noSurvivingDescendants': return 'No surviving descendants';
    default: return scenario;
  }
}

function intentSummary(intent: LegacyIntentRecord | undefined): React.ReactNode {
  if (!intent) return null;
  const lines: string[] = [];
  if (intent.firstDeath?.outcome) lines.push(`First death → ${intent.firstDeath.outcome}`);
  if (intent.bothDeceased?.outcome) lines.push(`Neither living → ${intent.bothDeceased.outcome}`);
  if (intent.noSurvivingDescendants?.outcome) lines.push(`No surviving descendants → ${intent.noSurvivingDescendants.outcome}`);
  if (lines.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {lines.map((l, i) => (
        <p key={i} className="text-xs text-gray-400">{l}</p>
      ))}
    </div>
  );
}

export default function CurrentWillSection({ answers, allAnswers, onAnswerChange }: Props) {
  const data = (answers['currentWillData'] as CurrentWillData) || {
    clients: [],
    planningRiskFlags: [],
  };

  const aboutYou = allAnswers.get('aboutYou') || {};
  const client1Name = (aboutYou['fullName'] as string) || 'Client 1';
  const client2Name = (aboutYou['spouseName'] as string) || 'Client 2';
  const maritalStatus = aboutYou['maritalStatus'] as string;
  const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';

  const willsAnswers = answers;
  const c1HasWill = (willsAnswers['client1HasWill'] as string) || (data.clients.find(c => c.clientId === 'client1')?.documentBasics.hasWill);
  const c2HasWill = (willsAnswers['client2HasWill'] as string) || (data.clients.find(c => c.clientId === 'client2')?.documentBasics.hasWill);

  const childrenData = (allAnswers.get('children')?.['childrenData'] as Array<Record<string, string>>) || [];
  const hasChildren = childrenData.some((c) => c?.name?.trim());
  const minorChildren = childrenData.filter((c) => {
    const classification = c.classification as string;
    return classification === 'minor';
  });

  const people = useMemo<LegacyPerson[]>(() => {
    const allPeople: LegacyPerson[] = [
      { id: 'client1', name: client1Name, relationship: 'Self', isClient: true },
    ];
    if (hasSpouse) {
      allPeople.push({ id: 'client2', name: client2Name, relationship: 'Spouse', isClient: true });
    }
    childrenData.forEach((c, i) => {
      if (c?.name) {
        allPeople.push({ id: `child_${i}`, name: c.name, relationship: 'Child', isDescendant: true });
      }
    });
    const prevRels = allAnswers.get('previousRelationships') || {};
    const c1Rels = (prevRels['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
    c1Rels.forEach((r, i) => {
      if (r?.name) allPeople.push({ id: `c1prev_${i}`, name: r.name, relationship: 'Previous Partner' });
    });
    const c2Rels = (prevRels['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
    c2Rels.forEach((r, i) => {
      if (r?.name) allPeople.push({ id: `c2prev_${i}`, name: r.name, relationship: 'Previous Partner' });
    });
    return allPeople;
  }, [allAnswers, client1Name, client2Name, hasSpouse, childrenData]);

  const legacyIntents = useMemo(() => {
    const liSection = allAnswers.get('legacyIntent') || {};
    return (liSection['legacyIntentsData'] as LegacyIntentRecord[]) || [];
  }, [allAnswers]);

  const availableAssets = useMemo(() => getAvailableLegacyAssets(allAnswers), [allAnswers]);

  const clientOwnedCorps = useMemo(() => getClientOwnedCorporations(allAnswers), [allAnswers]);

  const estateTrusteeAnswers = allAnswers.get('estateTrustees') || {};
  const allLawyers = useMemo(() => getCurrentLawyers(allAnswers), [allAnswers]);

  const handleAddLawyer = useCallback((record: Record<string, unknown>) => {
    const willsSection = allAnswers.get('wills') || {};
    const existing = (willsSection['willLawyersData'] as Array<Record<string, unknown>>) || [];
    onAnswerChange('willLawyersData', [...existing, record]);
  }, [allAnswers, onAnswerChange]);

  const [activeView, setActiveView] = useState<'intro' | 'main' | 'summary' | 'transition'>('intro');
  const [activeClientId, setActiveClientId] = useState<'client1' | 'client2' | null>(null);

  const clientResidenceProvince = (aboutYou['province'] as string) || undefined;

  const complexityFactors = useMemo<ComplexityFactors>(() => {
    const realEstate = allAnswers.get('realEstate') || {};
    const primaryHome = realEstate['primaryHomeData'] as Record<string, string> | undefined;
    const propertiesData = (realEstate['propertiesData'] as Array<Record<string, string>>) || [];
    const additionalCount = parseInt((realEstate['additionalPropertiesCount'] as string) || '0', 10);
    const totalProperties = (primaryHome ? 1 : 0) + (isNaN(additionalCount) ? 0 : additionalCount) + propertiesData.length;

    const hasForeignProperty = (
      (primaryHome?.country && primaryHome.country.toLowerCase() !== 'canada' && primaryHome.country.toLowerCase() !== 'ca') ||
      propertiesData.some(p => p.country && p.country.toLowerCase() !== 'canada' && p.country.toLowerCase() !== 'ca')
    ) || false;

    const hasPrivateCorpOwnership = clientOwnedCorps.length > 0;

    const hasMinor = minorChildren.length > 0;
    const hasDependant = childrenData.some(c => c.classification === 'adult_dependant');
    const hasDisabled = childrenData.some(c => c.disabled === 'yes' || c.disabled === 'not_sure');

    const familyTrusts = allAnswers.get('familyTrusts')?.['familyTrustsData'] as Array<Record<string, unknown>> | undefined;
    const hasSignificantTrust = (familyTrusts && familyTrusts.length > 0) || false;

    const hasComplex = hasMinor || hasDependant || hasDisabled || hasPrivateCorpOwnership || totalProperties > 1 || hasForeignProperty || hasSignificantTrust;

    return {
      hasMinorChildren: hasMinor,
      hasDependentAdult: hasDependant,
      hasDisabledBeneficiary: hasDisabled,
      hasPrivateCorpOwnership,
      hasMultipleProperties: totalProperties > 1,
      hasForeignProperty,
      hasSignificantTrustPlanning: hasSignificantTrust,
      hasComplexEstate: hasComplex,
    };
  }, [allAnswers, childrenData, minorChildren, clientOwnedCorps]);

  const updateData = useCallback((updated: CurrentWillData) => {
    const planningFlags = generatePlanningFlags(updated, { complexity: complexityFactors, clientResidenceProvince });
    const allBlendedAnswers = updated.clients.map(c => c.blendedFamilyAnswers).filter(Boolean) as BlendedFamilyAnswers[];
    const firstBlendedAnswers = allBlendedAnswers[0];
    const willFirstDeath: Record<'client1' | 'client2', string | undefined> = {
      client1: updated.clients.find(c => c.clientId === 'client1')?.firstDeath,
      client2: updated.clients.find(c => c.clientId === 'client2')?.firstDeath,
    };
    const blendedFlags = generateBlendedFamilyFlags(allAnswers, firstBlendedAnswers, willFirstDeath);
    const allFlags = [...planningFlags, ...blendedFlags];
    const withFlags = {
      ...updated,
      planningFlags: allFlags,
      blendedFamilyFlags: blendedFlags,
      planningRiskFlags: generatePlanningRiskFlags(updated, { complexity: complexityFactors, clientResidenceProvince }),
    };
    onAnswerChange('currentWillData', withFlags);
  }, [onAnswerChange, complexityFactors, clientResidenceProvince, allAnswers]);

  const ensureClient = (clientId: 'client1' | 'client2'): ClientWillUnderstanding => {
    const existing = data.clients.find(c => c.clientId === clientId);
    if (existing) return existing;
    const name = clientId === 'client1' ? client1Name : client2Name;
    const fresh = emptyClientWill(clientId, name);
    const migrated = migrateLegacyWillFields(willsAnswers, clientId, undefined);
    if (migrated.documentBasics) {
      const merged = { ...fresh, documentBasics: { ...fresh.documentBasics, ...migrated.documentBasics } };
      updateData({ ...data, clients: [...data.clients, merged] });
      return merged;
    }
    return fresh;
  };

  const updateClient = (clientId: 'client1' | 'client2', updates: Partial<ClientWillUnderstanding>) => {
    const current = ensureClient(clientId);
    const updatedClient = { ...current, ...updates };
    const otherClients = data.clients.filter(c => c.clientId !== clientId);
    updateData({ ...data, clients: [...otherClients, updatedClient] });
  };

  const updateDocBasics = (clientId: 'client1' | 'client2', updates: Partial<WillDocumentBasics>) => {
    const current = ensureClient(clientId);
    updateClient(clientId, { documentBasics: { ...current.documentBasics, ...updates } });
  };

  const updateAlignment = (clientId: 'client1' | 'client2', subjectType: AlignmentSubjectType, subjectId: string, subjectLabel: string, understanding: ClientUnderstanding, intentionSourceId?: string, difference?: unknown) => {
    const current = ensureClient(clientId);
    const existing = current.alignments.find(a => a.subjectType === subjectType && a.subjectId === subjectId);
    let updatedAlignments: EstatePlanAlignment[];
    if (existing) {
      updatedAlignments = current.alignments.map(a =>
        a === existing
          ? { ...a, clientUnderstanding: understanding, understoodDifference: difference, needsProfessionalReview: understanding !== 'believesAligned' }
          : a
      );
    } else {
      updatedAlignments = [...current.alignments, {
        subjectType,
        subjectId,
        subjectLabel,
        intentionSourceId,
        clientUnderstanding: understanding,
        understoodDifference: difference,
        needsProfessionalReview: understanding !== 'believesAligned',
      }];
    }
    updateClient(clientId, { alignments: updatedAlignments });
  };

  const c1Will = c1HasWill === 'yes';
  const c2Will = c2HasWill === 'yes';
  const bothHaveWills = c1Will && c2Will;
  const neitherHasWill = !c1Will && !c2Will;
  const onlyOneHasWill = (c1Will && !c2Will) || (!c1Will && c2Will);

  if (activeView === 'intro') {
    return (
      <IntroScreen
        onContinue={() => {
          if (neitherHasWill) return;
          if (onlyOneHasWill) {
            const willClientId = c1Will ? 'client1' : 'client2';
            setActiveClientId(willClientId);
          }
          setActiveView('main');
        }}
        neitherHasWill={neitherHasWill}
        onlyOneHasWill={onlyOneHasWill}
        willClientName={onlyOneHasWill ? (c1Will ? client1Name : client2Name) : undefined}
        noWillClientName={onlyOneHasWill ? (c1Will ? client2Name : client1Name) : undefined}
      />
    );
  }

  if (activeView === 'summary') {
    return (
      <SummaryScreen
        data={data}
        client1Name={client1Name}
        client2Name={client2Name}
        hasSpouse={hasSpouse}
        onEdit={() => setActiveView('main')}
        onConfirm={() => updateData({ ...data, reviewConfirmed: 'yes' })}
      />
    );
  }

  if (activeView === 'transition' && activeClientId) {
    const nextClientName = activeClientId === 'client1' ? client2Name : client1Name;
    const prevClientName = activeClientId === 'client1' ? client1Name : client2Name;
    const isSimilar = data.similarWills === 'yes_similar';
    return (
      <div className="space-y-6">
        <div className={sectionCardClass}>
          <h2 className="text-2xl font-bold text-white mb-3">Next: {nextClientName}'s Will</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            We've finished capturing how {prevClientName} understands their current Will. Next, we'll look at {nextClientName}'s Will.
          </p>
          {isSimilar && (
            <div className="mt-4 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <p className="text-xs text-blue-200/80 leading-relaxed">
                Because you've told us your Wills are generally similar, we'll carry forward what you've already told us and only ask where {nextClientName}'s understanding may differ.
              </p>
            </div>
          )}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => { setActiveView('main'); }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
            >
              Continue to {nextClientName}'s Will
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeClientId) {
    const client = ensureClient(activeClientId);
    const nextClientHasWill = activeClientId === 'client1' ? c2Will : false;
    return (
      <ClientWillFlow
        client={client}
        allAnswers={allAnswers}
        people={people}
        hasChildren={hasChildren}
        minorChildren={minorChildren}
        childrenData={childrenData}
        legacyIntents={legacyIntents}
        availableAssets={availableAssets}
        clientOwnedCorps={clientOwnedCorps}
        estateTrusteeAnswers={estateTrusteeAnswers}
        hasSpouse={hasSpouse}
        spouseName={activeClientId === 'client1' ? client2Name : client1Name}
        willsAnswers={willsAnswers}
        onUpdate={(updates) => updateClient(activeClientId, updates)}
        onUpdateDocBasics={(updates) => updateDocBasics(activeClientId, updates)}
        onUpdateAlignment={(subjectType, subjectId, subjectLabel, understanding, intentionSourceId, difference) =>
          updateAlignment(activeClientId, subjectType, subjectId, subjectLabel, understanding, intentionSourceId, difference)}
        onBack={() => { setActiveClientId(null); setActiveView('main'); }}
        onDone={() => {
          if (bothHaveWills && activeClientId === 'client1') {
            setActiveView('transition');
            setActiveClientId('client2');
          } else if (activeClientId === 'client1' && nextClientHasWill) {
            setActiveView('transition');
            setActiveClientId('client2');
          } else {
            setActiveClientId(null);
            setActiveView('summary');
          }
        }}
        similarWills={data.similarWills}
        isSecondClient={bothHaveWills && activeClientId === 'client2'}
        client1Name={client1Name}
        client2Name={client2Name}
        allLawyers={allLawyers}
        onAddLawyer={handleAddLawyer}
        clientResidenceProvince={clientResidenceProvince}
      />
    );
  }

  const willClients: Array<{ id: 'client1' | 'client2'; name: string }> = [];
  if (c1Will) willClients.push({ id: 'client1', name: client1Name });
  if (c2Will && hasSpouse) willClients.push({ id: 'client2', name: client2Name });

  return (
    <div className="space-y-6">
      <div className={sectionCardClass}>
        <h2 className="text-2xl font-bold text-white mb-3">Your Current Will</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          You've already told us a lot about your family, your assets and what you'd ideally like to happen in the future.
          Now let's look at what you understand your current Will to provide.
        </p>
        <div className="mt-4 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <p className="text-xs text-blue-200/80 leading-relaxed">
            This isn't a legal review of your Will. We're recording your understanding so we can help organize what may be worth
            confirming with your estate-planning lawyer.
          </p>
        </div>
      </div>

      {bothHaveWills && (
        <div className={sectionCardClass}>
          <SectionHeading label="Based on your understanding, do your Wills generally leave things in a similar way?" icon={<Scale className="w-4 h-4" />} />
          <p className="text-xs text-gray-400 mt-2">For example, you may both leave most of your estate to each other first, then follow a similar plan for your children or other beneficiaries.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {SIMILAR_WILLS_OPTIONS.map(opt => (
              <OptionButton
                key={opt.value}
                label={opt.label}
                selected={data.similarWills === opt.value}
                onClick={() => updateData({ ...data, similarWills: opt.value as CurrentWillData['similarWills'], similarWillsDifferences: opt.value === 'mostly_different' ? data.similarWillsDifferences : [] })}
              />
            ))}
          </div>

          {data.similarWills === 'mostly_different' && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <label className={labelClass}>Where do you understand the main differences to be?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {SIMILAR_WILLS_DIFFERENCE_OPTIONS.map(opt => {
                  const selected = (data.similarWillsDifferences || []).some(d => d.area === opt.value);
                  return (
                    <OptionButton
                      key={opt.value}
                      label={opt.label}
                      selected={selected}
                      onClick={() => {
                        const current = data.similarWillsDifferences || [];
                        if (selected) {
                          updateData({ ...data, similarWillsDifferences: current.filter(d => d.area !== opt.value) });
                        } else {
                          updateData({ ...data, similarWillsDifferences: [...current, { id: genId('diff'), area: opt.value as SimilarWillsDifferences[0]['area'] }] });
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {willClients.map(({ id, name }) => {
          const clientData = data.clients.find(c => c.clientId === id);
          const alignmentCount = clientData?.alignments.length || 0;
          const hasContent = !!clientData?.familiarity || alignmentCount > 0 || !!clientData?.firstDeath;
          return (
            <button
              key={id}
              type="button"
              onClick={() => { setActiveClientId(id); setActiveView('main'); }}
              className="flex items-center gap-4 px-5 py-4 rounded-xl border border-gray-600 bg-gray-800 text-left w-full hover:border-blue-500 hover:text-white transition-all"
            >
              <FileText className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-white">{name}'s Current Will — Understanding</span>
                {hasContent && (
                  <span className="text-xs text-gray-400 ml-2">({alignmentCount} alignment{alignmentCount !== 1 ? 's' : ''} recorded)</span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          );
        })}
      </div>

      {(data.clients.length > 0 || bothHaveWills) && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setActiveView('summary')}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Review Summary
          </button>
        </div>
      )}
    </div>
  );
}

function IntroScreen({
  onContinue,
  neitherHasWill,
  onlyOneHasWill,
  willClientName,
  noWillClientName,
}: {
  onContinue: () => void;
  neitherHasWill: boolean;
  onlyOneHasWill: boolean;
  willClientName?: string;
  noWillClientName?: string;
}) {
  return (
    <div className="space-y-6">
      <div className={sectionCardClass}>
        <h2 className="text-2xl font-bold text-white mb-3">Your Current Will</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          You've already told us a lot about your family, your assets and what you'd ideally like to happen in the future.
          Now let's look at what you understand your current Will to provide.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed mt-3">
          You don't need to know every legal detail. In fact, knowing where you're unsure can be just as useful as knowing what
          you're confident about.
        </p>
        <div className="mt-4 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <p className="text-xs text-blue-200/80 leading-relaxed">
            This isn't a legal review of your Will. We're recording your understanding so we can help organize what may be worth
            confirming with your estate-planning lawyer.
          </p>
        </div>
      </div>

      {neitherHasWill && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 leading-relaxed">
                You've told us that you don't currently have a Will. We'll use the information you've provided throughout the
                questionnaire to help organize the decisions and information you may want to discuss with your estate-planning lawyer.
              </p>
              <p className="text-xs text-amber-300/60 mt-2">
                Not having a Will is an important planning-readiness item that will be flagged for future review.
              </p>
            </div>
          </div>
        </div>
      )}

      {onlyOneHasWill && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-200 leading-relaxed">
                {willClientName} has a Will, but {noWillClientName} does not. We'll walk through {willClientName}'s current Will
                understanding now. {noWillClientName}'s lack of a Will will be preserved as a future planning-readiness item.
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ClientWillFlow({
  client,
  allAnswers,
  people,
  hasChildren,
  minorChildren,
  childrenData,
  legacyIntents,
  availableAssets,
  clientOwnedCorps,
  estateTrusteeAnswers,
  hasSpouse,
  spouseName,
  willsAnswers,
  onUpdate,
  onUpdateDocBasics,
  onUpdateAlignment,
  onBack,
  onDone,
  similarWills: _similarWills,
  isSecondClient: _isSecondClient,
  client1Name: _client1Name,
  client2Name: _client2Name,
  allLawyers,
  onAddLawyer,
  clientResidenceProvince,
}: {
  client: ClientWillUnderstanding;
  allAnswers: Map<string, Record<string, unknown>>;
  people: LegacyPerson[];
  hasChildren: boolean;
  minorChildren: Array<Record<string, string>>;
  childrenData: Array<Record<string, string>>;
  legacyIntents: LegacyIntentRecord[];
  availableAssets: ReturnType<typeof getAvailableLegacyAssets>;
  clientOwnedCorps: ReturnType<typeof getClientOwnedCorporations>;
  estateTrusteeAnswers: Record<string, unknown>;
  hasSpouse: boolean;
  spouseName: string;
  willsAnswers: Record<string, unknown>;
  onUpdate: (updates: Partial<ClientWillUnderstanding>) => void;
  onUpdateDocBasics: (updates: Partial<WillDocumentBasics>) => void;
  onUpdateAlignment: (subjectType: AlignmentSubjectType, subjectId: string, subjectLabel: string, understanding: ClientUnderstanding, intentionSourceId?: string, difference?: unknown) => void;
  onBack: () => void;
  onDone: () => void;
  similarWills?: string;
  isSecondClient: boolean;
  client1Name: string;
  client2Name: string;
  allLawyers: ProfessionalAdvisor[];
  onAddLawyer: (record: Record<string, unknown>) => void;
  clientResidenceProvince?: string;
}) {
  const [section, setSection] = useState(0);
  const clientPrefix = client.clientId === 'client1' ? 'client1' : 'client2';
  const db = client.documentBasics;

  const client1Name = _client1Name;
  const client2Name = _client2Name;

  const willYear = (willsAnswers[`${clientPrefix}WillYear`] as string) || db.willYear;
  const willLocation = (willsAnswers[`${clientPrefix}WillLocation`] as string) || db.willLocation;
  const _willJurisdiction = (willsAnswers[`${clientPrefix}WillJurisdiction`] as string) || db.willJurisdiction;
  const hasSecondaryWill = (willsAnswers[`${clientPrefix}HasSecondaryWill`] as string) || db.hasSecondaryWill;
  const secondaryWillLocation = (willsAnswers[`${clientPrefix}SecondaryWillLocation`] as string) || db.secondaryWillLocation;
  const secondaryWillJurisdiction = (willsAnswers[`${clientPrefix}SecondaryWillJurisdiction`] as string) || db.secondaryWillJurisdiction;

  const sections: Array<{ label: string; icon: React.ReactNode }> = [
    { label: 'Will Document Basics', icon: <FileText className="w-4 h-4" /> },
    { label: 'Familiarity', icon: <Info className="w-4 h-4" /> },
    { label: 'First Death', icon: <Heart className="w-4 h-4" /> },
    { label: 'If Neither of You Is Living', icon: <Users className="w-4 h-4" /> },
    { label: 'Children & Trusts', icon: <Shield className="w-4 h-4" /> },
    { label: 'Blended Family Planning', icon: <Users className="w-4 h-4" /> },
    { label: 'Specific & Charitable Gifts', icon: <Gift className="w-4 h-4" /> },
    { label: 'Legacy Intent Alignment', icon: <Scale className="w-4 h-4" /> },
    { label: 'Executor & Guardian', icon: <Users className="w-4 h-4" /> },
    { label: 'Business Owner', icon: <Building2 className="w-4 h-4" /> },
    { label: 'Ultimate Contingency', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: 'Other & Confidence', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const hasClientOwnedCorps = clientOwnedCorps.length > 0;
  const hasLegacyIntents = legacyIntents.length > 0;
  const hasMinorChildren = minorChildren.length > 0;

  const blendedFamilyProfile = useMemo(() => getFamilyComplexityProfile(allAnswers), [allAnswers]);
  const blendedSupportObligations = useMemo(() => getSupportObligations(allAnswers), [allAnswers]);
  const blendedDomesticAgreements = useMemo(() => getDomesticAgreements(allAnswers), [allAnswers]);
  const blendedChildParentage = useMemo(() => getChildParentage(allAnswers), [allAnswers]);

  const visibleSections = sections.filter((_, i) => {
    if (i === 4) return hasChildren;
    if (i === 5) return blendedFamilyProfile.needsBlendedFamilyWillReview;
    if (i === 8 && !hasMinorChildren) {
      return estateTrusteeAnswers[`${clientPrefix}HasEstateTrustee`] === 'yes' || estateTrusteeAnswers[`${clientPrefix}HasAlternateEstateTrustee`] === 'yes';
    }
    if (i === 8) return true;
    if (i === 9) return hasClientOwnedCorps;
    return true;
  });

  const nextSection = () => {
    if (section < visibleSections.length - 1) setSection(section + 1);
    else onDone();
  };

  const prevSection = () => {
    if (section > 0) setSection(section - 1);
    else onBack();
  };

  const currentSectionLabel = visibleSections[section]?.label;
  const currentSectionIndex = sections.findIndex(s => s.label === currentSectionLabel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to overview
        </button>
        <span className="text-sm font-medium text-white">{client.clientName}'s Will</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleSections.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setSection(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === section ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      <div className={sectionCardClass}>
        {currentSectionIndex === 0 && (
          <DocBasicsSection
            clientName={client.clientName}
            willYear={willYear}
            willLocation={willLocation}
            willJurisdiction={_willJurisdiction}
            willJurisdictionStructured={db.willJurisdictionStructured}
            hasSecondaryWill={hasSecondaryWill}
            secondaryWillLocation={secondaryWillLocation}
            secondaryWillJurisdiction={secondaryWillJurisdiction}
            willPreparedByLawyer={db.willPreparedByLawyer}
            willLawyerId={db.willLawyerId}
            hasMeaningfulChanges={db.hasMeaningfulChanges}
            meaningfulChangesDetails={db.meaningfulChangesDetails}
            onUpdate={onUpdateDocBasics}
            allLawyers={allLawyers}
            onAddLawyer={onAddLawyer}
            clientResidenceProvince={clientResidenceProvince}
          />
        )}

        {currentSectionIndex === 1 && (
          <FamiliaritySection
            clientName={client.clientName}
            familiarity={client.familiarity}
            onUpdate={(familiarity) => onUpdate({ familiarity })}
          />
        )}

        {currentSectionIndex === 2 && (
          <FirstDeathSection
            clientName={client.clientName}
            spouseName={spouseName}
            hasSpouse={hasSpouse}
            firstDeath={client.firstDeath}
            exceptionHas={client.firstDeathExceptionHas}
            exceptions={client.firstDeathExceptions || []}
            onUpdate={(updates) => onUpdate(updates)}
            people={people}
            availableAssets={availableAssets}
          />
        )}

        {currentSectionIndex === 3 && (
          <ResidueSection
            clientName={client.clientName}
            hasSpouse={hasSpouse}
            residue={client.residue}
            residueRecipients={client.residueRecipients || []}
            people={people}
            hasChildren={hasChildren}
            onUpdate={(updates) => onUpdate(updates)}
          />
        )}

        {currentSectionIndex === 4 && hasChildren && (
          <ChildrenTrustSection
            clientName={client.clientName}
            childrenData={childrenData}
            childPredecease={client.childPredecease}
            inheritanceType={client.inheritanceType}
            trustStages={client.trustStages || []}
            trustTrusteePersonId={client.trustTrusteePersonId}
            people={people}
            childSpecificArrangements={client.childSpecificArrangements || []}
            onUpdate={(updates) => onUpdate(updates)}
          />
        )}

        {currentSectionIndex === 5 && blendedFamilyProfile.needsBlendedFamilyWillReview && (
          <BlendedFamilySection
            clientName={client.clientName}
            clientId={client.clientId}
            client1Name={client1Name}
            client2Name={client2Name}
            hasSpouse={hasSpouse}
            blendedFamilyProfile={blendedFamilyProfile}
            supportObligations={blendedSupportObligations}
            domesticAgreements={blendedDomesticAgreements}
            childParentage={blendedChildParentage}
            blendedAnswers={client.blendedFamilyAnswers}
            firstDeath={client.firstDeath}
            onUpdate={(updates) => onUpdate(updates)}
          />
        )}

        {currentSectionIndex === 6 && (
          <GiftsSection
            clientName={client.clientName}
            specificGiftsHas={client.specificGiftsHas}
            specificGifts={client.specificGifts || []}
            charitableGiftsHas={client.charitableGiftsHas}
            charitableGifts={client.charitableGifts || []}
            people={people}
            availableAssets={availableAssets}
            onUpdate={(updates) => onUpdate(updates)}
          />
        )}

        {currentSectionIndex === 7 && hasLegacyIntents && (
          <LegacyAlignmentSection
            clientName={client.clientName}
            legacyIntents={legacyIntents}
            alignments={client.alignments}
            onUpdateAlignment={onUpdateAlignment}
          />
        )}
        {currentSectionIndex === 7 && !hasLegacyIntents && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No Legacy Intent records have been created yet. You can skip this section.</p>
          </div>
        )}

        {currentSectionIndex === 8 && (
          <ExecutorGuardianSection
            client={client}
            estateTrusteeAnswers={estateTrusteeAnswers}
            clientPrefix={clientPrefix}
            hasMinorChildren={hasMinorChildren}
            childrenData={childrenData}
            people={people}
            onUpdateAlignment={onUpdateAlignment}
            onUpdate={onUpdate}
          />
        )}

        {currentSectionIndex === 9 && hasClientOwnedCorps && (
          <BusinessOwnerSection
            clientName={client.clientName}
            clientOwnedCorps={clientOwnedCorps}
            legacyIntents={legacyIntents}
            alignments={client.alignments}
            onUpdateAlignment={onUpdateAlignment}
          />
        )}
        {currentSectionIndex === 9 && !hasClientOwnedCorps && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No client-owned corporations were identified. This section is not applicable.</p>
          </div>
        )}

        {currentSectionIndex === 10 && (
          <UltimateContingencySection
            clientName={client.clientName}
            ultimateContingency={client.ultimateContingency}
            ultimateContingencyRecipients={client.ultimateContingencyRecipients || []}
            people={people}
            allAnswers={allAnswers}
            onUpdate={(updates) => onUpdate(updates)}
          />
        )}

        {currentSectionIndex === 11 && (
          <OtherAndConfidenceSection
            clientName={client.clientName}
            otherProvisions={client.otherProvisions}
            overallConfidence={client.overallConfidence}
            wantsToDiscussWithLawyer={client.wantsToDiscussWithLawyer}
            onUpdate={(updates) => onUpdate(updates)}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={prevSection} className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" />
          {section === 0 ? 'Back' : 'Previous'}
        </button>
        <span className="text-xs text-gray-500">{section + 1} of {visibleSections.length}</span>
        <button type="button" onClick={nextSection} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors text-sm">
          {section === visibleSections.length - 1 ? 'Done' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function DocBasicsSection({
  clientName,
  willYear,
  willLocation,
  willJurisdiction,
  willJurisdictionStructured,
  hasSecondaryWill,
  secondaryWillLocation,
  secondaryWillJurisdiction,
  willPreparedByLawyer,
  willLawyerId,
  hasMeaningfulChanges,
  meaningfulChangesDetails,
  onUpdate,
  allLawyers,
  onAddLawyer,
  clientResidenceProvince,
}: {
  clientName: string;
  willYear?: string;
  willLocation?: string;
  willJurisdiction?: string;
  willJurisdictionStructured?: WillJurisdiction;
  hasSecondaryWill?: string;
  secondaryWillLocation?: string;
  secondaryWillJurisdiction?: string;
  willPreparedByLawyer?: string;
  willLawyerId?: string;
  hasMeaningfulChanges?: string;
  meaningfulChangesDetails?: string;
  onUpdate: (updates: Partial<WillDocumentBasics>) => void;
  allLawyers: ProfessionalAdvisor[];
  onAddLawyer: (record: Record<string, unknown>) => void;
  clientResidenceProvince?: string;
}) {
  const currentYear = new Date().getFullYear();
  const years: Array<{ value: string; label: string }> = [];
  for (let y = currentYear; y >= 1950; y--) years.push({ value: String(y), label: String(y) });
  const [showNewLawyerForm, setShowNewLawyerForm] = useState(false);

  const selectedLawyer = allLawyers.find(l => l.id === willLawyerId);
  const jurType = willJurisdictionStructured?.type;

  return (
    <div className="space-y-5">
      <SectionHeading label="Will Document Basics" icon={<FileText className="w-4 h-4" />} />
      <p className={subtleTextClass}>We've pulled in what you've already told us. Please confirm or fill in any gaps.</p>

      <div>
        <label className={labelClass}>Was {clientName}'s current Will prepared by a lawyer?</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {LAWYER_PREPARED_OPTIONS.map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={willPreparedByLawyer === opt.value} onClick={() => onUpdate({ willPreparedByLawyer: opt.value as 'yes' | 'no' | 'not_sure', willLawyerId: opt.value !== 'yes' ? undefined : willLawyerId })} />
          ))}
        </div>
      </div>

      {willPreparedByLawyer === 'yes' && (
        <div className="pt-3 border-t border-gray-700">
          <label className={labelClass}>Who prepared {clientName}'s Will?</label>
          <p className="text-xs text-gray-400 mb-3">Select from lawyers you've already told us about, or add someone new.</p>
          <div className="space-y-2.5">
            {allLawyers.map(lawyer => (
              <button
                key={lawyer.id}
                type="button"
                onClick={() => onUpdate({ willLawyerId: lawyer.id })}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left w-full transition-all ${
                  willLawyerId === lawyer.id
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-200 hover:border-blue-500 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium block">{lawyer.name || 'Unnamed lawyer'}</span>
                  <span className="text-xs text-gray-400 block">{lawyer.firm}{lawyer.source === 'corporate' && lawyer.corpName ? ` — Corporate Lawyer for ${lawyer.corpName}` : ''}</span>
                </div>
                {willLawyerId === lawyer.id && <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowNewLawyerForm(true)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left w-full transition-all ${
                showNewLawyerForm
                  ? 'bg-gray-800 border-gray-600'
                  : 'bg-gray-800 border-dashed border-gray-500 text-gray-300 hover:border-blue-500 hover:text-blue-400'
              }`}
            >
              <Plus className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Someone else</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdate({ willLawyerId: undefined })}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left w-full transition-all ${
                willLawyerId === undefined && !showNewLawyerForm && willPreparedByLawyer === 'yes'
                  ? 'bg-gray-800 border-gray-600 text-gray-400'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:text-white'
              }`}
            >
              <Info className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">I'm not sure</span>
            </button>
          </div>

          {showNewLawyerForm && (
            <NewLawyerForm
              onAdd={(record) => { onAddLawyer(record); onUpdate({ willLawyerId: record.id as string }); setShowNewLawyerForm(false); }}
              onCancel={() => setShowNewLawyerForm(false)}
            />
          )}

          {selectedLawyer && !showNewLawyerForm && (
            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-xs text-blue-200/80 leading-relaxed">
                <span className="font-medium">{selectedLawyer.name}</span>
                {selectedLawyer.firm && <span> — {selectedLawyer.firm}</span>}
                {selectedLawyer.phone && <span> — {selectedLawyer.phone}</span>}
                {selectedLawyer.email && <span> — {selectedLawyer.email}</span>}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-gray-700">
        <label className={labelClass}>In what year was {clientName}'s Will prepared?</label>
        <select value={willYear || ''} onChange={e => onUpdate({ willYear: e.target.value })} className={inputClass}>
          <option value="">Select year</option>
          {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
        </select>
      </div>

      <div>
        <DocumentLocationPicker
          label="Where is the Will located?"
          value={willLocation as unknown}
          onChange={(val) => onUpdate({ willLocation: val })}
          placeholder="e.g., Lawyer's office, home safe, safety deposit box"
        />
      </div>

      <div>
        <label className={labelClass}>Where was this Will prepared?</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {JURISDICTION_TYPE_OPTIONS.map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={jurType === opt.value} onClick={() => onUpdate({ willJurisdictionStructured: { type: opt.value as WillJurisdictionType } })} />
          ))}
        </div>
      </div>

      {jurType === 'canada' && (
        <div>
          <label className={labelClass}>Province / territory</label>
          <select
            value={willJurisdictionStructured?.province || ''}
            onChange={e => onUpdate({ willJurisdictionStructured: { type: 'canada', province: e.target.value } })}
            className={inputClass}
          >
            <option value="">Select province or territory</option>
            {CANADIAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {clientResidenceProvince && willJurisdictionStructured?.province && (
            <JurisdictionComparison willProvince={willJurisdictionStructured.province} residenceProvince={clientResidenceProvince} />
          )}
        </div>
      )}

      {jurType === 'outside_canada' && (
        <>
          <div>
            <label className={labelClass}>Country</label>
            <input type="text" value={willJurisdictionStructured?.country || ''} onChange={e => onUpdate({ willJurisdictionStructured: { type: 'outside_canada', country: e.target.value } })} placeholder="e.g., United Kingdom, United States" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>State / province / region (optional)</label>
            <input type="text" value={willJurisdictionStructured?.region || ''} onChange={e => onUpdate({ willJurisdictionStructured: { type: 'outside_canada', country: willJurisdictionStructured?.country || '', region: e.target.value } })} placeholder="e.g., California, England" className={inputClass} />
          </div>
        </>
      )}

      <div>
        <label className={labelClass}>Does {clientName} have a secondary Will (e.g., for private-company shares)?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {YES_NO_UNSURE.filter(o => o.value !== 'not_sure').map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={hasSecondaryWill === opt.value} onClick={() => onUpdate({ hasSecondaryWill: opt.value as 'yes' | 'no' })} />
          ))}
        </div>
      </div>

      {hasSecondaryWill === 'yes' && (
        <>
          <div>
            <DocumentLocationPicker
              label="Where is the secondary Will located?"
              value={secondaryWillLocation as unknown}
              onChange={(val) => onUpdate({ secondaryWillLocation: val })}
              placeholder="Enter location"
            />
          </div>
          <div>
            <label className={labelClass}>In what jurisdiction was the secondary Will prepared?</label>
            <input type="text" value={secondaryWillJurisdiction || ''} onChange={e => onUpdate({ secondaryWillJurisdiction: e.target.value })} placeholder="e.g., Ontario, Florida" className={inputClass} />
          </div>
        </>
      )}

      <div>
        <label className={labelClass}>Have there been any meaningful changes in {clientName}'s life, family, or financial situation since the Will was prepared?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {YES_NO_UNSURE.filter(o => o.value !== 'not_sure').map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={hasMeaningfulChanges === opt.value} onClick={() => onUpdate({ hasMeaningfulChanges: opt.value as 'yes' | 'no' })} />
          ))}
        </div>
      </div>

      {hasMeaningfulChanges === 'yes' && (
        <div>
          <label className={labelClass}>Please describe the meaningful changes:</label>
          <textarea value={meaningfulChangesDetails || ''} onChange={e => onUpdate({ meaningfulChangesDetails: e.target.value })} placeholder="Describe the changes that have occurred..." className={inputClass} rows={3} />
        </div>
      )}
    </div>
  );
}

function FamiliaritySection({
  clientName,
  familiarity,
  onUpdate,
}: {
  clientName: string;
  familiarity?: string;
  onUpdate: (familiarity: ClientWillUnderstanding['familiarity']) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeading label="Familiarity with Your Will" icon={<Info className="w-4 h-4" />} />
      <p className="text-sm text-gray-300">How familiar are you with what {clientName}'s current Will says?</p>
      <div className="grid grid-cols-1 gap-3">
        {FAMILIARITY_OPTIONS.map(opt => (
          <OptionButton key={opt.value} label={opt.label} selected={familiarity === opt.value} onClick={() => onUpdate(opt.value as ClientWillUnderstanding['familiarity'])} />
        ))}
      </div>
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mt-2">
        <p className="text-xs text-blue-200/80 leading-relaxed">
          If you're unsure about something later in this section, that's perfectly fine. Knowing where you're unsure is just as
          useful as knowing what you're confident about.
        </p>
      </div>
    </div>
  );
}

function FirstDeathSection({
  clientName,
  spouseName,
  hasSpouse,
  firstDeath,
  exceptionHas,
  exceptions,
  onUpdate,
  people,
  availableAssets,
}: {
  clientName: string;
  spouseName: string;
  hasSpouse: boolean;
  firstDeath?: FirstDeathUnderstanding;
  exceptionHas?: string;
  exceptions: FirstDeathException[];
  onUpdate: (updates: Partial<ClientWillUnderstanding>) => void;
  people: LegacyPerson[];
  availableAssets: ReturnType<typeof getAvailableLegacyAssets>;
}) {
  const eligibleRecipients = people.filter(p => !p.isClient || p.id !== 'client1');
  const [showExceptionForm, setShowExceptionForm] = useState(false);

  const addException = (exc: FirstDeathException) => {
    onUpdate({ firstDeathExceptions: [...exceptions, exc] });
    setShowExceptionForm(false);
  };

  const removeException = (id: string) => {
    onUpdate({ firstDeathExceptions: exceptions.filter(e => e.id !== id) });
  };

  return (
    <div className="space-y-5">
      <SectionHeading label={hasSpouse ? `If one of you dies first` : 'First Death'} icon={<Heart className="w-4 h-4" />} />
      <p className="text-sm text-gray-300">
        Based on your understanding of {clientName}'s current Will, what generally happens to the estate if {clientName} dies
        {hasSpouse ? ` while ${spouseName} is still living` : ''}?
      </p>
      <div className="grid grid-cols-1 gap-3">
        {FIRST_DEATH_OPTIONS.map(opt => (
          <OptionButton key={opt.value} label={opt.label} selected={firstDeath === opt.value} onClick={() => onUpdate({ firstDeath: opt.value as FirstDeathUnderstanding })} />
        ))}
      </div>

      {(firstDeath === 'mostly_to_spouse' || firstDeath === 'some_to_spouse_some_to_others' || firstDeath === 'another_arrangement') && (
        <>
          <div className="pt-3 border-t border-gray-700">
            <label className={labelClass}>Are there specific gifts, assets or amounts that you understand go to someone else?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {YES_NO_UNSURE.map(opt => (
                <OptionButton key={opt.value} label={opt.label} selected={exceptionHas === opt.value} onClick={() => onUpdate({ firstDeathExceptionHas: opt.value as 'yes' | 'no' | 'not_sure' })} />
              ))}
            </div>
          </div>

          {exceptionHas === 'yes' && (
            <div className="space-y-3">
              {exceptions.map(exc => (
                <div key={exc.id} className="flex items-start gap-3 p-3 bg-gray-800 border border-gray-600 rounded-lg">
                  <div className="flex-1 text-sm text-gray-200">
                    <span className="font-medium capitalize">{exc.type.replace(/_/g, ' ')}</span>
                    {exc.recipientName && <span className="text-gray-400"> → {exc.recipientName}</span>}
                    {exc.amount && <span className="text-gray-400"> ({exc.amount})</span>}
                    {exc.description && <p className="text-xs text-gray-500 mt-1">{exc.description}</p>}
                  </div>
                  <button type="button" onClick={() => removeException(exc.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {showExceptionForm ? (
                <ExceptionForm onAdd={addException} onCancel={() => setShowExceptionForm(false)} people={eligibleRecipients} availableAssets={availableAssets} />
              ) : (
                <button type="button" onClick={() => setShowExceptionForm(true)} className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-sm">
                  <Plus className="w-4 h-4" /> Add a specific gift or exception
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExceptionForm({
  onAdd,
  onCancel,
  people,
  availableAssets,
}: {
  onAdd: (exc: FirstDeathException) => void;
  onCancel: () => void;
  people: LegacyPerson[];
  availableAssets: ReturnType<typeof getAvailableLegacyAssets>;
}) {
  const [type, setType] = useState<FirstDeathException['type']>('dollar');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPersonId, setRecipientPersonId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onAdd({
      id: genId('exc'),
      type,
      recipientName: recipientName || undefined,
      recipientPersonId: recipientPersonId || undefined,
      assetId: assetId || undefined,
      amount: amount || undefined,
      description: description || undefined,
    });
  };

  return (
    <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
      <div>
        <label className={labelClass}>Type</label>
        <select value={type} onChange={e => setType(e.target.value as FirstDeathException['type'])} className={inputClass}>
          {GIFT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {(type === 'dollar' || type === 'percentage' || type === 'asset' || type === 'person' || type === 'possession') && (
        <div>
          <label className={labelClass}>Recipient</label>
          <select value={recipientPersonId} onChange={e => {
            setRecipientPersonId(e.target.value);
            const p = people.find(p => p.id === e.target.value);
            if (p) setRecipientName(p.name);
          }} className={inputClass}>
            <option value="">Select person</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name} ({p.relationship})</option>)}
            <option value="other">Other</option>
          </select>
          {recipientPersonId === 'other' && (
            <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Enter name" className={`${inputClass} mt-2`} />
          )}
        </div>
      )}
      {type === 'charity' && (
        <div>
          <label className={labelClass}>Charity/Organization</label>
          <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Enter charity name" className={inputClass} />
        </div>
      )}
      {type === 'asset' && (
        <div>
          <label className={labelClass}>Asset</label>
          <select value={assetId} onChange={e => setAssetId(e.target.value)} className={inputClass}>
            <option value="">Select asset</option>
            {availableAssets.map(a => <option key={a.assetId} value={a.assetId}>{a.assetName}</option>)}
          </select>
        </div>
      )}
      {(type === 'dollar' || type === 'percentage') && (
        <div>
          <label className={labelClass}>{type === 'dollar' ? 'Amount' : 'Percentage'}</label>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder={type === 'dollar' ? 'e.g., $50,000' : 'e.g., 10%'} className={inputClass} />
        </div>
      )}
      <div>
        <label className={labelClass}>Description (optional)</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Any additional details" className={inputClass} />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">Add</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function ResidueSection({
  clientName,
  hasSpouse,
  residue,
  residueRecipients,
  people,
  hasChildren,
  onUpdate,
}: {
  clientName: string;
  hasSpouse: boolean;
  residue?: ResidueUnderstanding;
  residueRecipients: string[];
  people: LegacyPerson[];
  hasChildren: boolean;
  onUpdate: (updates: Partial<ClientWillUnderstanding>) => void;
}) {
  const eligibleRecipients = people.filter(p => !p.isClient);
  const needsRecipients = residue === 'specific_beneficiaries' || residue === 'family_and_other' || residue === 'by_family_branch';

  return (
    <div className="space-y-5">
      <SectionHeading label="If Neither of You Is Living" icon={<Users className="w-4 h-4" />} />
      <p className="text-sm text-gray-300">
        Based on your understanding of {clientName}'s current Will, who receives the remainder of the estate if neither of you is living?
      </p>
      <div className="grid grid-cols-1 gap-3">
        {RESIDUE_OPTIONS.map(opt => (
          <OptionButton key={opt.value} label={opt.label} selected={residue === opt.value} onClick={() => onUpdate({ residue: opt.value as ResidueUnderstanding })} />
        ))}
      </div>

      {needsRecipients && (
        <div>
          <label className={labelClass}>Select the beneficiaries</label>
          <div className="space-y-2 mt-2">
            {eligibleRecipients.map(p => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={residueRecipients.includes(p.id)}
                  onChange={e => {
                    const next = e.target.checked
                      ? [...residueRecipients, p.id]
                      : residueRecipients.filter(id => id !== p.id);
                    onUpdate({ residueRecipients: next });
                  }}
                  className="rounded border-gray-500"
                />
                {p.name} ({p.relationship})
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChildrenTrustSection({
  clientName,
  childrenData,
  childPredecease,
  inheritanceType,
  trustStages,
  trustTrusteePersonId,
  people,
  childSpecificArrangements,
  onUpdate,
}: {
  clientName: string;
  childrenData: Array<Record<string, string>>;
  childPredecease?: ChildPredeceaseUnderstanding;
  inheritanceType?: InheritanceType;
  trustStages: TrustStage[];
  trustTrusteePersonId?: string;
  people: LegacyPerson[];
  childSpecificArrangements: ClientWillUnderstanding['childSpecificArrangements'];
  onUpdate: (updates: Partial<ClientWillUnderstanding>) => void;
}) {
  const childPeople = people.filter(p => p.isDescendant);
  const hasMinor = childrenData.some(c => c.classification === 'minor' || c.ageGroup === 'minor');
  const hasDependant = childrenData.some(c => c.classification === 'adult_dependant');
  const hasDisabled = childrenData.some(c => c.disabled === 'yes' || c.disabled === 'not_sure' || c.isDisabled === 'yes');
  const showPerChildQuestion = hasMinor || hasDependant || hasDisabled || childrenData.length > 1;

  const addTrustStage = () => {
    onUpdate({ trustStages: [...trustStages, { id: genId('stage') }] });
  };
  const updateTrustStage = (id: string, updates: Partial<TrustStage>) => {
    onUpdate({ trustStages: trustStages.map(s => s.id === id ? { ...s, ...updates } : s) });
  };
  const removeTrustStage = (id: string) => {
    onUpdate({ trustStages: trustStages.filter(s => s.id !== id) });
  };

  const showStages = inheritanceType === 'held_until_age' || inheritanceType === 'released_gradually';
  const showTrustee = inheritanceType === 'held_until_age' || inheritanceType === 'released_gradually' || inheritanceType === 'held_longer_period';

  const updateChildArrangement = (childId: string, childName: string, updates: Partial<NonNullable<ClientWillUnderstanding['childSpecificArrangements']>[number]>) => {
    const current = [...(childSpecificArrangements || [])];
    const idx = current.findIndex(a => a.childId === childId);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...updates };
    } else {
      current.push({ childId, childName, hasDifferentArrangement: 'not_sure', ...updates });
    }
    onUpdate({ childSpecificArrangements: current });
  };

  return (
    <div className="space-y-6">
      <SectionHeading label="Children & Inheritance" icon={<Shield className="w-4 h-4" />} />

      <div>
        <p className="text-sm text-gray-300 mb-3">
          Based on your understanding of {clientName}'s Will, what happens to a child's share if that child dies before {clientName}?
        </p>
        <div className="grid grid-cols-1 gap-3">
          {CHILD_PREDECEASE_OPTIONS.map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={childPredecease === opt.value} onClick={() => onUpdate({ childPredecease: opt.value as ChildPredeceaseUnderstanding })} />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-300 mb-2">
          Based on your understanding of {clientName}'s Will, would your children's inheritance be paid to them right away, or would someone manage it for them for a period of time?
        </p>
        <p className={subtleTextClass}>
          A Will can direct that an inheritance be managed by a trustee instead of being paid out all at once. For example, a child might receive part at age 25, another portion at 30, and the balance at 35.
        </p>
        <div className="grid grid-cols-1 gap-3 mt-3">
          {INHERITANCE_OPTIONS.map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={inheritanceType === opt.value} onClick={() => onUpdate({ inheritanceType: opt.value as InheritanceType })} />
          ))}
        </div>
      </div>

      {showStages && (
        <div className="pt-4 border-t border-gray-700 space-y-4">
          <div>
            <label className={labelClass}>How do you understand the inheritance to be released?</label>
            <p className={subtleTextClass}>Add each stage you understand to apply. You don't need to know exact percentages.</p>
            <div className="space-y-2 mt-2">
              {trustStages.map(stage => (
                <div key={stage.id} className="flex items-center gap-2">
                  <input type="text" value={stage.age || ''} onChange={e => updateTrustStage(stage.id, { age: e.target.value })} placeholder="Age / stage" className={`${inputClass} w-28`} />
                  <input type="text" value={stage.fraction || ''} onChange={e => updateTrustStage(stage.id, { fraction: e.target.value })} placeholder="Portion (e.g., 1/3)" className={`${inputClass} w-28`} />
                  <input type="text" value={stage.description || ''} onChange={e => updateTrustStage(stage.id, { description: e.target.value })} placeholder="Description (optional)" className={`${inputClass} flex-1`} />
                  <button type="button" onClick={() => removeTrustStage(stage.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addTrustStage} className="flex items-center gap-2 mt-2 text-sm text-blue-400 hover:text-blue-300">
              <Plus className="w-4 h-4" /> Add stage
            </button>
          </div>
        </div>
      )}

      {showTrustee && (
        <div className="pt-4 border-t border-gray-700">
          <label className={labelClass}>Who do you understand would manage the inheritance until it is paid out?</label>
          <p className={subtleTextClass}>
            This person is often called the trustee. They manage the money according to the instructions in the Will until the beneficiary is entitled to receive it.
          </p>
          <select value={trustTrusteePersonId || ''} onChange={e => {
            const personId = e.target.value;
            const person = people.find(p => p.id === personId);
            onUpdate({ trustTrusteePersonId: personId, trustTrusteeName: person?.name });
          }} className={`${inputClass} mt-2`}>
            <option value="">Select person</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name} ({p.relationship})</option>)}
            <option value="other">Other</option>
          </select>
          <p className={subtleTextClass}>This may or may not be the same person as the Estate Trustee or guardian.</p>
        </div>
      )}

      {inheritanceType && inheritanceType !== 'not_sure' && (
        <div className="pt-4 border-t border-gray-700 bg-blue-900/10 border border-blue-700/20 rounded-lg p-3">
          <p className="text-xs text-blue-200/70 leading-relaxed">
            A testamentary trust is simply a trust created through a Will after someone dies. Instead of a beneficiary receiving an inheritance all at once, a trustee can manage the money and distribute it according to the instructions in the Will. For example, parents might choose to have a child's inheritance managed until age 25, then release portions at ages 25, 30 and 35 rather than paying everything immediately.
          </p>
        </div>
      )}

      {showPerChildQuestion && (
        <div className="pt-4 border-t border-gray-700 space-y-4">
          <p className="text-sm text-gray-300">
            Do you understand {clientName}'s Will to use a different inheritance arrangement for any child or beneficiary?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {YES_NO_UNSURE.map(opt => (
              <OptionButton key={opt.value} label={opt.label} selected={inheritanceType === 'different_arrangements' && opt.value === 'yes'} onClick={() => onUpdate({ inheritanceType: opt.value === 'yes' ? 'different_arrangements' : inheritanceType })} />
            ))}
          </div>

          {inheritanceType === 'different_arrangements' && childrenData.map((child, i) => {
            const childName = child.nickname || child.name || `Child ${i + 1}`;
            const childId = `child_${i}`;
            const existing = childSpecificArrangements?.find(a => a.childId === childId);
            const isDisabledChild = child.classification === 'adult_dependant' || child.disabled === 'yes' || child.disabled === 'not_sure' || child.isDisabled === 'yes';
            return (
              <div key={childId} className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
                <p className="text-sm font-medium text-white">{childName}</p>

                {isDisabledChild && (
                  <p className="text-xs text-amber-300/70">
                    Do you understand {clientName}'s Will to include a special arrangement for managing {childName}'s inheritance?
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {YES_NO_UNSURE.map(opt => (
                    <OptionButton key={opt.value} label={opt.label} selected={existing?.hasDifferentArrangement === opt.value} onClick={() => {
                      updateChildArrangement(childId, childName, { hasDifferentArrangement: opt.value as 'yes' | 'no' | 'not_sure' });
                    }} />
                  ))}
                </div>

                {existing?.hasDifferentArrangement === 'yes' && (
                  <>
                    <div>
                      <label className={labelClass}>How do you understand it to work?</label>
                      <select
                        value={existing.specialArrangement || ''}
                        onChange={e => updateChildArrangement(childId, childName, { specialArrangement: e.target.value as SpecialArrangementType })}
                        className={inputClass}
                      >
                        <option value="">Select arrangement</option>
                        {SPECIAL_ARRANGEMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Do you know what this type of trust or arrangement is called?</label>
                      <p className={subtleTextClass}>This is optional — you don't need to know the legal term.</p>
                      <select
                        value={existing.knownTypeName || ''}
                        onChange={e => updateChildArrangement(childId, childName, { knownTypeName: e.target.value as TrustKnownTypeName })}
                        className={`${inputClass} mt-1`}
                      >
                        <option value="">Select if known</option>
                        {TRUST_KNOWN_NAME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Description (optional)</label>
                      <textarea
                        value={existing.description || ''}
                        onChange={e => updateChildArrangement(childId, childName, { description: e.target.value })}
                        placeholder="Describe what you understand at a high level..."
                        className={inputClass}
                        rows={2}
                      />
                    </div>

                    {existing.knownTypeName === 'henson_trust' && (
                      <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
                        <p className="text-xs text-amber-200/80 leading-relaxed">
                          A Henson Trust (also called an absolute discretionary trust) is a type of trust sometimes used in estate planning for a beneficiary who receives government disability benefits. The trustee has full discretion over whether and when to distribute funds. This can help preserve the beneficiary's eligibility for certain government support programs. Recording this here does not mean the trust legally qualifies as a Henson Trust — your lawyer can confirm.
                        </p>
                      </div>
                    )}

                    {existing.knownTypeName && existing.knownTypeName !== 'not_sure' && existing.knownTypeName !== 'other' && (
                      <div className="bg-amber-900/10 border border-amber-700/20 rounded-lg p-3">
                        <p className="text-xs text-amber-200/60 leading-relaxed">
                          Selecting a label here records your understanding only. It does not mean the arrangement legally qualifies as any particular type. Your lawyer can confirm.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GiftsSection({
  clientName,
  specificGiftsHas,
  specificGifts,
  charitableGiftsHas,
  charitableGifts,
  people,
  availableAssets,
  onUpdate,
}: {
  clientName: string;
  specificGiftsHas?: string;
  specificGifts: SpecificGift[];
  charitableGiftsHas?: string;
  charitableGifts: CharitableGift[];
  people: LegacyPerson[];
  availableAssets: ReturnType<typeof getAvailableLegacyAssets>;
  onUpdate: (updates: Partial<ClientWillUnderstanding>) => void;
}) {
  const [showGiftForm, setShowGiftForm] = useState(false);
  const [showCharityForm, setShowCharityForm] = useState(false);

  return (
    <div className="space-y-6">
      <SectionHeading label="Specific Gifts" icon={<Gift className="w-4 h-4" />} />
      <p className="text-sm text-gray-300">
        Does {clientName}'s current Will include any specific gifts that haven't already been discussed?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {YES_NO_UNSURE.map(opt => (
          <OptionButton key={opt.value} label={opt.label} selected={specificGiftsHas === opt.value} onClick={() => onUpdate({ specificGiftsHas: opt.value as 'yes' | 'no' | 'not_sure' })} />
        ))}
      </div>

      {specificGiftsHas === 'yes' && (
        <div className="space-y-3">
          {specificGifts.map(gift => (
            <div key={gift.id} className="flex items-start gap-3 p-3 bg-gray-800 border border-gray-600 rounded-lg">
              <div className="flex-1 text-sm text-gray-200">
                <span className="font-medium capitalize">{gift.type.replace(/_/g, ' ')}</span>
                {gift.recipientName && <span className="text-gray-400"> → {gift.recipientName}</span>}
                {gift.amount && <span className="text-gray-400"> ({gift.amount})</span>}
                {gift.description && <p className="text-xs text-gray-500 mt-1">{gift.description}</p>}
              </div>
              <button type="button" onClick={() => onUpdate({ specificGifts: specificGifts.filter(g => g.id !== gift.id) })} className="text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {showGiftForm ? (
            <GiftForm onAdd={(gift) => { onUpdate({ specificGifts: [...specificGifts, gift] }); setShowGiftForm(false); }} onCancel={() => setShowGiftForm(false)} people={people} availableAssets={availableAssets} />
          ) : (
            <button type="button" onClick={() => setShowGiftForm(true)} className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-sm">
              <Plus className="w-4 h-4" /> Add a specific gift
            </button>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-gray-700">
        <SectionHeading label="Charitable Gifts" icon={<Heart className="w-4 h-4" />} />
        <p className="text-sm text-gray-300">
          Do you understand {clientName}'s Will to include any gifts to charities or other organizations?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {YES_NO_UNSURE.map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={charitableGiftsHas === opt.value} onClick={() => onUpdate({ charitableGiftsHas: opt.value as 'yes' | 'no' | 'not_sure' })} />
          ))}
        </div>
      </div>

      {charitableGiftsHas === 'yes' && (
        <div className="space-y-3">
          {charitableGifts.map(gift => (
            <div key={gift.id} className="flex items-start gap-3 p-3 bg-gray-800 border border-gray-600 rounded-lg">
              <div className="flex-1 text-sm text-gray-200">
                <span className="font-medium">{gift.charityName}</span>
                <span className="text-gray-400 capitalize"> — {gift.form.replace(/_/g, ' ')}</span>
                {gift.amount && <span className="text-gray-400"> ({gift.amount})</span>}
                {gift.instructions && <p className="text-xs text-gray-500 mt-1">{gift.instructions}</p>}
              </div>
              <button type="button" onClick={() => onUpdate({ charitableGifts: charitableGifts.filter(g => g.id !== gift.id) })} className="text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {showCharityForm ? (
            <CharityForm onAdd={(gift) => { onUpdate({ charitableGifts: [...charitableGifts, gift] }); setShowCharityForm(false); }} onCancel={() => setShowCharityForm(false)} />
          ) : (
            <button type="button" onClick={() => setShowCharityForm(true)} className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-sm">
              <Plus className="w-4 h-4" /> Add a charitable gift
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GiftForm({
  onAdd,
  onCancel,
  people,
  availableAssets,
}: {
  onAdd: (gift: SpecificGift) => void;
  onCancel: () => void;
  people: LegacyPerson[];
  availableAssets: ReturnType<typeof getAvailableLegacyAssets>;
}) {
  const [type, setType] = useState<SpecificGift['type']>('dollar');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPersonId, setRecipientPersonId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
      <div>
        <label className={labelClass}>Type</label>
        <select value={type} onChange={e => setType(e.target.value as SpecificGift['type'])} className={inputClass}>
          {GIFT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {(type === 'person' || type === 'possession' || type === 'dollar' || type === 'percentage' || type === 'asset') && (
        <div>
          <label className={labelClass}>Recipient</label>
          <select value={recipientPersonId} onChange={e => {
            setRecipientPersonId(e.target.value);
            const p = people.find(p => p.id === e.target.value);
            if (p) setRecipientName(p.name);
          }} className={inputClass}>
            <option value="">Select person</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name} ({p.relationship})</option>)}
            <option value="other">Other</option>
          </select>
          {recipientPersonId === 'other' && (
            <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Enter name" className={`${inputClass} mt-2`} />
          )}
        </div>
      )}
      {type === 'charity' && (
        <div>
          <label className={labelClass}>Charity/Organization</label>
          <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Enter charity name" className={inputClass} />
        </div>
      )}
      {type === 'asset' && (
        <div>
          <label className={labelClass}>Asset</label>
          <select value={assetId} onChange={e => setAssetId(e.target.value)} className={inputClass}>
            <option value="">Select asset</option>
            {availableAssets.map(a => <option key={a.assetId} value={a.assetId}>{a.assetName}</option>)}
          </select>
        </div>
      )}
      {(type === 'dollar' || type === 'percentage') && (
        <div>
          <label className={labelClass}>{type === 'dollar' ? 'Amount' : 'Percentage'}</label>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder={type === 'dollar' ? 'e.g., $50,000' : 'e.g., 10%'} className={inputClass} />
        </div>
      )}
      <div>
        <label className={labelClass}>Description (optional)</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Any additional details" className={inputClass} />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={() => onAdd({ id: genId('gift'), type, recipientName: recipientName || undefined, recipientPersonId: recipientPersonId || undefined, assetId: assetId || undefined, amount: amount || undefined, description: description || undefined })} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">Add</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function CharityForm({
  onAdd,
  onCancel,
}: {
  onAdd: (gift: CharitableGift) => void;
  onCancel: () => void;
}) {
  const [charityName, setCharityName] = useState('');
  const [form, setForm] = useState<CharitableGift['form']>('fixed_amount');
  const [amount, setAmount] = useState('');
  const [instructions, setInstructions] = useState('');

  return (
    <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
      <div>
        <label className={labelClass}>Charity/Organization</label>
        <input type="text" value={charityName} onChange={e => setCharityName(e.target.value)} placeholder="Enter charity name" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Form of gift</label>
        <select value={form} onChange={e => setForm(e.target.value as CharitableGift['form'])} className={inputClass}>
          {CHARITY_FORM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {(form === 'fixed_amount' || form === 'percentage') && (
        <div>
          <label className={labelClass}>{form === 'fixed_amount' ? 'Amount' : 'Percentage'}</label>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder={form === 'fixed_amount' ? 'e.g., $10,000' : 'e.g., 5%'} className={inputClass} />
        </div>
      )}
      <div>
        <label className={labelClass}>Any known instructions (optional)</label>
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g., Used for cancer research" className={inputClass} rows={2} />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={() => onAdd({ id: genId('charity'), charityName, form, amount: amount || undefined, instructions: instructions || undefined })} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">Add</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function LegacyAlignmentSection({
  clientName,
  legacyIntents,
  alignments,
  onUpdateAlignment,
}: {
  clientName: string;
  legacyIntents: LegacyIntentRecord[];
  alignments: EstatePlanAlignment[];
  onUpdateAlignment: (subjectType: AlignmentSubjectType, subjectId: string, subjectLabel: string, understanding: ClientUnderstanding, intentionSourceId?: string, difference?: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading label="Legacy Intent Alignment" icon={<Scale className="w-4 h-4" />} />
      <p className="text-sm text-gray-300">
        We've pulled in the intentions you've already told us about. For each one, let us know whether you believe {clientName}'s
        current Will reflects that intention.
      </p>

      {legacyIntents.map((intent) => {
        const alignment = alignments.find(a => a.subjectType === 'legacyAsset' && a.subjectId === intent.asset.assetId);
        return (
          <div key={intent.id} className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
            <div>
              <p className="text-sm font-medium text-white">{intent.asset.assetName}</p>
              <p className="text-xs text-gray-400 mt-1">What you told us you'd ideally like:</p>
              {intentSummary(intent)}
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-2">
                Based on your understanding of {clientName}'s current Will, is this generally what the Will provides for?
              </p>
              <div className="grid grid-cols-1 gap-2">
                {ALIGNMENT_OPTIONS.map(opt => (
                  <OptionButton
                    key={opt.value}
                    label={opt.label}
                    selected={alignment?.clientUnderstanding === opt.value}
                    onClick={() => onUpdateAlignment('legacyAsset', intent.asset.assetId, intent.asset.assetName, opt.value, intent.id)}
                  />
                ))}
              </div>
            </div>
            {alignment?.clientUnderstanding === 'partiallyAligned' && (
              <PartialAlignmentEditor
                intent={intent}
                onDifference={(diff) => onUpdateAlignment('legacyAsset', intent.asset.assetId, intent.asset.assetName, 'partiallyAligned', intent.id, diff)}
                currentDifference={alignment.understoodDifference}
              />
            )}
            {alignment?.clientUnderstanding === 'notAligned' && (
              <div>
                <p className="text-sm text-gray-300 mb-2">What do you understand {clientName}'s current Will to provide instead?</p>
                <NotAlignedEditor
                  intent={intent}
                  onDifference={(diff) => onUpdateAlignment('legacyAsset', intent.asset.assetId, intent.asset.assetName, 'notAligned', intent.id, diff)}
                  currentDifference={alignment.understoodDifference}
                />
              </div>
            )}
            {alignment && (
              <div className={`text-xs px-3 py-2 rounded-lg border ${getUnderstandingColor(alignment.clientUnderstanding)}`}>
                {getUnderstandingLabel(alignment.clientUnderstanding)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PartialAlignmentEditor({
  intent,
  onDifference,
  currentDifference,
}: {
  intent: LegacyIntentRecord;
  onDifference: (diff: string[]) => void;
  currentDifference?: unknown;
}) {
  const scenarios = [
    { key: 'firstDeath', label: 'First death' },
    { key: 'bothDeceased', label: 'Neither of you living' },
    { key: 'noSurvivingDescendants', label: 'No surviving descendants' },
  ];
  const selected = (Array.isArray(currentDifference) ? currentDifference : []) as string[];

  return (
    <div>
      <p className="text-sm text-gray-300 mb-2">Which part do you understand differently?</p>
      <div className="space-y-2">
        {scenarios.filter(s => intent[s.key as keyof LegacyIntentRecord]).map(s => (
          <label key={s.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
            <input
              type="checkbox"
              checked={selected.includes(s.key)}
              onChange={e => {
                const next = e.target.checked ? [...selected, s.key] : selected.filter(k => k !== s.key);
                onDifference(next);
              }}
              className="rounded border-gray-500"
            />
            {s.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function NotAlignedEditor({
  intent,
  onDifference,
  currentDifference,
}: {
  intent: LegacyIntentRecord;
  onDifference: (diff: string) => void;
  currentDifference?: unknown;
}) {
  const value = (typeof currentDifference === 'string' ? currentDifference : '') as string;
  return (
    <textarea
      value={value}
      onChange={e => onDifference(e.target.value)}
      placeholder="Describe what you understand the Will provides instead..."
      className={inputClass}
      rows={3}
    />
  );
}

function ExecutorGuardianSection({
  client,
  estateTrusteeAnswers,
  clientPrefix,
  hasMinorChildren,
  childrenData,
  people,
  onUpdateAlignment,
  onUpdate,
}: {
  client: ClientWillUnderstanding;
  estateTrusteeAnswers: Record<string, unknown>;
  clientPrefix: string;
  hasMinorChildren: boolean;
  childrenData: Array<Record<string, string>>;
  people: LegacyPerson[];
  onUpdateAlignment: (subjectType: AlignmentSubjectType, subjectId: string, subjectLabel: string, understanding: ClientUnderstanding, intentionSourceId?: string, difference?: unknown) => void;
  onUpdate: (updates: Partial<ClientWillUnderstanding>) => void;
}) {
  const hasTrustee = estateTrusteeAnswers[`${clientPrefix}HasEstateTrustee`] === 'yes';
  const trusteeIsSpouse = estateTrusteeAnswers[`${clientPrefix}SpouseIsEstateTrustee`] === 'yes';
  const trusteeName = trusteeIsSpouse
    ? (estateTrusteeAnswers['spouseName'] as string) || 'your spouse'
    : (estateTrusteeAnswers[`${clientPrefix}EstateTrusteeName`] as string) || 'your Estate Trustee';
  const hasAlternate = estateTrusteeAnswers[`${clientPrefix}HasAlternateEstateTrustee`] === 'yes';
  const alternateName = (estateTrusteeAnswers[`${clientPrefix}AlternateEstateTrustee1Name`] as string) || '';

  const guardianPersonId = childrenData.find(c => c.guardianPersonId)?.guardianPersonId;
  const guardianData = childrenData.find(c => c.guardianConsidered === 'yes' || c.guardianPersonId);

  return (
    <div className="space-y-6">
      <SectionHeading label="Executor / Estate Trustee" icon={<Scale className="w-4 h-4" />} />

      {hasTrustee ? (
        <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
          <p className="text-sm text-gray-300">
            Earlier, you told us that you understand <span className="text-white font-medium">{trusteeName}</span> to be
            {client.clientName}'s first-choice Estate Trustee.
          </p>
          <p className="text-sm text-gray-300">Is that person actually named in {client.clientName}'s current Will, to your knowledge?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'not_sure', label: "I'm not sure" },
            ].map(opt => {
              const existing = client.alignments.find(a => a.subjectType === 'executor' && a.subjectId === `${clientPrefix}_et`);
              return (
                <OptionButton key={opt.value} label={opt.label} selected={existing?.clientUnderstanding === (opt.value === 'yes' ? 'believesAligned' : opt.value === 'no' ? 'notAligned' : 'unsure')} onClick={() => {
                  const understanding = opt.value === 'yes' ? 'believesAligned' : opt.value === 'no' ? 'notAligned' : 'unsure';
                  onUpdateAlignment('executor', `${clientPrefix}_et`, trusteeName, understanding);
                }} />
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No Estate Trustee has been identified in the earlier section yet.</p>
      )}

      {hasAlternate && alternateName && (
        <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
          <p className="text-sm text-gray-300">
            You also identified <span className="text-white font-medium">{alternateName}</span> as an alternate Estate Trustee.
          </p>
          <p className="text-sm text-gray-300">Is {alternateName} named in {client.clientName}'s current Will as an alternate?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'not_sure', label: "I'm not sure" },
            ].map(opt => {
              const existing = client.alignments.find(a => a.subjectType === 'executor' && a.subjectId === `${clientPrefix}_et_alt`);
              return (
                <OptionButton key={opt.value} label={opt.label} selected={existing?.clientUnderstanding === (opt.value === 'yes' ? 'believesAligned' : opt.value === 'no' ? 'notAligned' : 'unsure')} onClick={() => {
                  const understanding = opt.value === 'yes' ? 'believesAligned' : opt.value === 'no' ? 'notAligned' : 'unsure';
                  onUpdateAlignment('executor', `${clientPrefix}_et_alt`, alternateName, understanding);
                }} />
              );
            })}
          </div>
        </div>
      )}

      {hasMinorChildren && guardianData?.guardianPersonId && (
        <div className="pt-4 border-t border-gray-700">
          <SectionHeading label="Guardianship" icon={<Shield className="w-4 h-4" />} />
          <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
            <p className="text-sm text-gray-300">
              Earlier, you told us that you would ideally want <span className="text-white font-medium">{guardianData.guardianPersonName || 'the named guardian'}</span> to care for
              your children if neither of you could.
            </p>
            <p className="text-sm text-gray-300">
              To your knowledge, is this person named in {client.clientName}'s current Will as guardian?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'not_sure', label: "I'm not sure" },
                { value: 'not_addressed', label: 'My Will does not address this' },
              ].map(opt => {
                const existing = client.alignments.find(a => a.subjectType === 'guardian' && a.subjectId === `${clientPrefix}_guardian`);
                return (
                  <OptionButton key={opt.value} label={opt.label} selected={existing?.clientUnderstanding === (opt.value === 'yes' ? 'believesAligned' : opt.value === 'no' ? 'notAligned' : opt.value === 'not_sure' ? 'unsure' : 'notAddressed')} onClick={() => {
                    const understanding = opt.value === 'yes' ? 'believesAligned' : opt.value === 'no' ? 'notAligned' : opt.value === 'not_sure' ? 'unsure' : 'notAddressed';
                    onUpdateAlignment('guardian', `${clientPrefix}_guardian`, guardianData.guardianPersonName || 'Guardian', understanding);
                  }} />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BusinessOwnerSection({
  clientName,
  clientOwnedCorps,
  legacyIntents,
  alignments,
  onUpdateAlignment,
}: {
  clientName: string;
  clientOwnedCorps: ReturnType<typeof getClientOwnedCorporations>;
  legacyIntents: LegacyIntentRecord[];
  alignments: EstatePlanAlignment[];
  onUpdateAlignment: (subjectType: AlignmentSubjectType, subjectId: string, subjectLabel: string, understanding: ClientUnderstanding, intentionSourceId?: string, difference?: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading label="Business Owner Cross-Reference" icon={<Building2 className="w-4 h-4" />} />

      {clientOwnedCorps.map((corp, i) => {
        const corpName = (corp['legalName'] as string) || `Corporation ${i + 1}`;
        const corpId = `corp_${i}`;
        const intent = legacyIntents.find(li => li.asset.assetId === corpId);
        const alignment = alignments.find(a => a.subjectType === 'business' && a.subjectId === corpId);

        return (
          <div key={corpId} className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
            <p className="text-sm font-medium text-white">{corpName}</p>

            {intent?.businessBranch && (
              <div>
                <p className="text-xs text-gray-400 mt-1">What you told us you'd ideally like:</p>
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-400">Ownership → {intent.businessBranch.ownershipSuccession.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">Immediate management → {intent.businessBranch.managementSuccession.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">Shareholder agreement → {intent.businessBranch.shareholderAgreementConsistent.replace(/_/g, ' ')}</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-300">
              Based on your understanding of {clientName}'s current Will and estate plan, is this generally consistent with the
              arrangements currently in place?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {ALIGNMENT_OPTIONS.map(opt => (
                <OptionButton
                  key={opt.value}
                  label={opt.label}
                  selected={alignment?.clientUnderstanding === opt.value}
                  onClick={() => onUpdateAlignment('business', corpId, corpName, opt.value, intent?.id)}
                />
              ))}
            </div>

            {intent?.businessBranch && (
              <div className="pt-3 border-t border-gray-600">
                <p className="text-sm text-gray-300 mb-2">
                  To your knowledge, does {clientName}'s current Will give the Estate Trustee enough flexibility to work with
                  the lawyer and accountant on tax and corporate planning after death?
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'not_sure', label: "I'm not sure" },
                    { value: 'not_discussed', label: "This hasn't been discussed with my lawyer/accountant" },
                  ].map(opt => {
                    const flexAlignment = alignments.find(a => a.subjectType === 'business' && a.subjectId === `${corpId}_flex`);
                    const mappedUnderstanding = opt.value === 'yes' ? 'believesAligned' : opt.value === 'no' ? 'notAligned' : 'unsure';
                    return (
                      <OptionButton
                        key={opt.value}
                        label={opt.label}
                        selected={flexAlignment?.clientUnderstanding === mappedUnderstanding && (flexAlignment?.understoodDifference as string) === opt.value}
                        onClick={() => onUpdateAlignment('business', `${corpId}_flex`, `${corpName} — Post-mortem flexibility`, mappedUnderstanding, intent?.id, opt.value)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UltimateContingencySection({
  clientName,
  ultimateContingency,
  ultimateContingencyRecipients,
  people,
  allAnswers,
  onUpdate,
}: {
  clientName: string;
  ultimateContingency?: UltimateContingencyUnderstanding;
  ultimateContingencyRecipients: string[];
  people: LegacyPerson[];
  allAnswers: Map<string, Record<string, unknown>>;
  onUpdate: (updates: Partial<ClientWillUnderstanding>) => void;
}) {
  const eligibleRecipients = people.filter(p => !p.isClient && !p.isDescendant);
  const needsRecipients = ultimateContingency === 'specific_people' || ultimateContingency === 'combination';

  return (
    <div className="space-y-5">
      <SectionHeading label="One Last Scenario" icon={<AlertTriangle className="w-4 h-4" />} />
      <p className="text-sm text-gray-300">
        A Will also usually considers what happens if the people you would normally leave your estate to are no longer living.
      </p>
      <p className="text-sm text-gray-300">
        Based on your understanding of {clientName}'s current Will, who ultimately receives the estate if neither of you nor any
        of your descendants are living?
      </p>
      <div className="grid grid-cols-1 gap-3">
        {ULTIMATE_CONTINGENCY_OPTIONS.map(opt => (
          <OptionButton key={opt.value} label={opt.label} selected={ultimateContingency === opt.value} onClick={() => onUpdate({ ultimateContingency: opt.value as UltimateContingencyUnderstanding })} />
        ))}
      </div>

      {needsRecipients && (
        <div>
          <label className={labelClass}>Select people</label>
          <div className="space-y-2 mt-2">
            {eligibleRecipients.map(p => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={ultimateContingencyRecipients.includes(p.id)}
                  onChange={e => {
                    const next = e.target.checked
                      ? [...ultimateContingencyRecipients, p.id]
                      : ultimateContingencyRecipients.filter(id => id !== p.id);
                    onUpdate({ ultimateContingencyRecipients: next });
                  }}
                  className="rounded border-gray-500"
                />
                {p.name} ({p.relationship})
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OtherAndConfidenceSection({
  clientName,
  otherProvisions,
  overallConfidence,
  wantsToDiscussWithLawyer,
  onUpdate,
}: {
  clientName: string;
  otherProvisions?: string;
  overallConfidence?: OverallConfidence;
  wantsToDiscussWithLawyer?: string;
  onUpdate: (updates: Partial<ClientWillUnderstanding>) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading label="Other Will Provisions" icon={<FileText className="w-4 h-4" />} />
      <p className="text-sm text-gray-300">
        Is there anything else in {clientName}'s Will that you think is particularly important for us to understand?
      </p>
      <textarea
        value={otherProvisions || ''}
        onChange={e => onUpdate({ otherProvisions: e.target.value })}
        placeholder="For example, a special trust, unusual gift, family arrangement, business provision or instructions that haven't come up yet."
        className={inputClass}
        rows={4}
      />

      <div className="pt-4 border-t border-gray-700">
        <SectionHeading label="Overall Confidence" icon={<CheckCircle2 className="w-4 h-4" />} />
        <p className="text-sm text-gray-300">
          Overall, how confident are you that {clientName}'s current Will still reflects what you want today?
        </p>
        <div className="grid grid-cols-1 gap-3 mt-2">
          {CONFIDENCE_OPTIONS.map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={overallConfidence === opt.value} onClick={() => onUpdate({ overallConfidence: opt.value as OverallConfidence })} />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-300 mb-2">Is there anything you already know you want to discuss with your lawyer?</p>
        <textarea
          value={wantsToDiscussWithLawyer || ''}
          onChange={e => onUpdate({ wantsToDiscussWithLawyer: e.target.value })}
          placeholder="Optional — note any questions or changes you already have in mind."
          className={inputClass}
          rows={3}
        />
      </div>
    </div>
  );
}

function SummaryScreen({
  data,
  client1Name,
  client2Name,
  hasSpouse,
  onEdit,
  onConfirm,
}: {
  data: CurrentWillData;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className={sectionCardClass}>
        <h2 className="text-2xl font-bold text-white mb-3">Your Current Will — Your Understanding</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          Here's what you've told us about how you understand your current Will to work.
        </p>
      </div>

      {data.clients.map(client => (
        <div key={client.clientId} className={sectionCardClass}>
          <h3 className="text-lg font-semibold text-white mb-4">{client.clientName}</h3>

          {client.documentBasics.hasWill === 'no' && (
            <p className="text-sm text-amber-300">{client.clientName} does not currently have a Will.</p>
          )}

          {client.documentBasics.hasWill !== 'no' && (
            <div className="space-y-4">
              {client.documentBasics.willYear && (
                <SummaryRow label="Will prepared" value={client.documentBasics.willYear} />
              )}
              {client.documentBasics.willLocation && (
                <SummaryRow label="Location" value={client.documentBasics.willLocation} />
              )}
              {client.documentBasics.willPreparedByLawyer && (
                <SummaryRow label="Prepared by lawyer" value={LAWYER_PREPARED_OPTIONS.find(o => o.value === client.documentBasics.willPreparedByLawyer)?.label || client.documentBasics.willPreparedByLawyer} />
              )}
              {client.documentBasics.willJurisdictionStructured && (
                <SummaryRow
                  label="Will prepared in"
                  value={client.documentBasics.willJurisdictionStructured.type === 'canada'
                    ? client.documentBasics.willJurisdictionStructured.province || 'Canada'
                    : client.documentBasics.willJurisdictionStructured.type === 'outside_canada'
                      ? [client.documentBasics.willJurisdictionStructured.country, client.documentBasics.willJurisdictionStructured.region].filter(Boolean).join(', ')
                      : 'Uncertain'}
                />
              )}

              {client.familiarity && (
                <SummaryRow label="Familiarity" value={FAMILIARITY_OPTIONS.find(f => f.value === client.familiarity)?.label || client.familiarity} />
              )}

              {client.firstDeath && (
                <SummaryRow label="First death" value={FIRST_DEATH_OPTIONS.find(f => f.value === client.firstDeath)?.label || client.firstDeath} />
              )}

              {client.residue && (
                <SummaryRow label="If neither living — residue" value={RESIDUE_OPTIONS.find(r => r.value === client.residue)?.label || client.residue} />
              )}

              {client.childPredecease && (
                <SummaryRow label="If a child predeceases" value={CHILD_PREDECEASE_OPTIONS.find(c => c.value === client.childPredecease)?.label || client.childPredecease} />
              )}

              {client.inheritanceType && (
                <SummaryRow label="Children's inheritance" value={getInheritanceTypeLabel(client.inheritanceType)} />
              )}

              {(client.inheritanceType === 'held_until_age' || client.inheritanceType === 'released_gradually') && client.trustStages && client.trustStages.length > 0 && (
                <SummaryRow label="Distribution" value={client.trustStages.map(s => [s.fraction, s.age].filter(Boolean).join(' at ').trim()).join(', ')} />
              )}

              {client.blendedFamilyAnswers?.client1ChildProtectionIntent && (
                <SummaryRow label="Child protection intent (Client 1)" value={client.blendedFamilyAnswers.client1ChildProtectionIntent} />
              )}
              {client.blendedFamilyAnswers?.client2ChildProtectionIntent && (
                <SummaryRow label="Child protection intent (Client 2)" value={client.blendedFamilyAnswers.client2ChildProtectionIntent} />
              )}
              {client.blendedFamilyAnswers?.survivorControlUnderstanding && (
                <SummaryRow label="Survivor control understanding" value={client.blendedFamilyAnswers.survivorControlUnderstanding} />
              )}

              {client.ultimateContingency && (
                <SummaryRow label="Ultimate contingency" value={ULTIMATE_CONTINGENCY_OPTIONS.find(u => u.value === client.ultimateContingency)?.label || client.ultimateContingency} />
              )}

              {client.overallConfidence && (
                <SummaryRow label="Overall confidence" value={CONFIDENCE_OPTIONS.find(c => c.value === client.overallConfidence)?.label || client.overallConfidence} />
              )}

              {client.alignments.length > 0 && (
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Alignment with Legacy Intentions</p>
                  <div className="space-y-2">
                    {client.alignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{a.subjectLabel}</span>
                        <span className={`text-xs px-2 py-1 rounded border ${getUnderstandingColor(a.clientUnderstanding)}`}>
                          {getUnderstandingLabel(a.clientUnderstanding)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {(data.planningFlags?.length || 0) > 0 && (
        <div className="bg-gray-900/80 border border-gray-600 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Planning Review Indicators</h3>
          </div>
          <div className="space-y-3">
            {(data.planningFlags || []).map((flag, i) => (
              <div key={i} className={`p-3 rounded-lg border ${getFlagSeverityColor(flag.severity)}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide">{getFlagSeverityLabel(flag.severity)}</span>
                </div>
                <p className="text-sm leading-relaxed">{flag.observation}</p>
                {flag.context && <p className="text-xs mt-1 opacity-80 leading-relaxed">{flag.context}</p>}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            These are planning indicators, not legal findings. They identify areas worth discussing with your estate-planning lawyer.
          </p>
        </div>
      )}

      {data.planningRiskFlags.length > 0 && !data.planningFlags && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-200">Planning Review Indicators</h3>
          </div>
          <ul className="space-y-1.5">
            {data.planningRiskFlags.map((flag, i) => (
              <li key={i} className="text-xs text-amber-200/80 leading-relaxed">• {flag}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-300/50 mt-3">
            These are planning indicators, not legal findings. They identify areas worth discussing with your estate-planning lawyer.
          </p>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-5">
        <p className="text-sm text-blue-200 mb-4">Does this accurately reflect your understanding?</p>
        <div className="flex gap-3">
          <button type="button" onClick={onConfirm} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors text-sm">
            <CheckCircle2 className="w-4 h-4" /> Yes, looks right
          </button>
          <button type="button" onClick={onEdit} className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm">
            <Pencil className="w-4 h-4" /> I need to make a change
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-sm text-white text-right ml-4">{value}</span>
    </div>
  );
}

function NewLawyerForm({
  onAdd,
  onCancel,
}: {
  onAdd: (record: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('');

  const handleSubmit = () => {
    if (!name.trim() && !firm.trim()) return;
    const id = `willlaw_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
    onAdd({ id, name, firm, phone, email, website, city, province, country });
  };

  return (
    <div className="mt-4 p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-3">
      <p className="text-sm font-medium text-white">Lawyer Contact Information</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className={inputClass} />
        <input type="text" value={firm} onChange={e => setFirm(e.target.value)} placeholder="Law firm" className={inputClass} />
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className={inputClass} />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
        <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className={inputClass} />
        <input type="text" value={province} onChange={e => setProvince(e.target.value)} placeholder="Province / state" className={inputClass} />
        <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" className={inputClass} />
        <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website (optional)" className={inputClass} />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">Add Lawyer</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function JurisdictionComparison({ willProvince, residenceProvince }: { willProvince: string; residenceProvince: string }) {
  const normalize = (p: string) => p.trim().toLowerCase();
  const same = normalize(willProvince) === normalize(residenceProvince);
  if (same) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        This matches your current province of residence.
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
      <AlertTriangle className="w-3.5 h-3.5" />
      Your Will was prepared in {willProvince}, and you currently live in {residenceProvince}. Consider confirming with an estate lawyer in your current province that your Will continues to work as intended.
    </div>
  );
}

const FIRST_DEATH_PASS_OPTIONS: Array<{ value: FirstDeathPassToSpouse; label: string }> = [
  { value: 'yes_substantially_all', label: 'Yes, substantially all' },
  { value: 'mostly_with_exceptions', label: 'Mostly, with some exceptions' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "I'm not sure" },
];

const CHILD_PROTECTION_INTENT_OPTIONS: Array<{ value: ChildProtectionIntent; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_necessarily', label: 'Not necessarily' },
  { value: 'not_sure', label: "I'm not sure" },
];

const PROTECTION_MECHANISM_OPTIONS: Array<{ value: ProtectionMechanism; label: string }> = [
  { value: 'direct_on_death', label: 'They receive something directly when the client dies' },
  { value: 'assets_set_aside', label: 'Certain assets are set aside for them' },
  { value: 'held_in_trust', label: 'Their inheritance is held in trust' },
  { value: 'after_surviving_spouse', label: 'They inherit after the surviving spouse dies' },
  { value: 'life_insurance', label: 'Life insurance is intended for them' },
  { value: 'another_arrangement', label: 'Another arrangement' },
  { value: 'not_sure', label: "I'm not sure" },
];

const SURVIVOR_CONTROL_OPTIONS: Array<{ value: SurvivorControlUnderstanding; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "I'm not sure" },
  { value: 'not_discussed', label: "We haven't discussed this with our lawyer" },
];

const REMARRIAGE_OPTIONS: Array<{ value: RemarriageConcern; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_necessarily', label: 'Not necessarily' },
  { value: 'not_considered', label: "We haven't considered this" },
  { value: 'not_sure', label: "I'm not sure" },
];

const DOMESTIC_ALIGNMENT_OPTIONS: Array<{ value: DomesticAgreementAlignment; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "I'm not sure" },
  { value: 'not_discussed', label: "We haven't discussed this with our lawyer" },
];

const TREAT_CHILDREN_OPTIONS: Array<{ value: TreatChildrenSameWay; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'mostly_with_differences', label: 'Mostly, with some differences' },
  { value: 'not_sure', label: "I'm not sure" },
];

function BlendedFamilySection({
  clientName,
  clientId,
  client1Name,
  client2Name,
  hasSpouse,
  blendedFamilyProfile,
  supportObligations,
  domesticAgreements,
  childParentage,
  blendedAnswers,
  firstDeath,
  onUpdate,
}: {
  clientName: string;
  clientId: 'client1' | 'client2';
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  blendedFamilyProfile: ReturnType<typeof getFamilyComplexityProfile>;
  supportObligations: ReturnType<typeof getSupportObligations>;
  domesticAgreements: ReturnType<typeof getDomesticAgreements>;
  childParentage: ReturnType<typeof getChildParentage>;
  blendedAnswers?: BlendedFamilyAnswers;
  firstDeath?: string;
  onUpdate: (updates: Partial<ClientWillUnderstanding>) => void;
}) {
  const updateBlended = (updates: Partial<BlendedFamilyAnswers>) => {
    onUpdate({ blendedFamilyAnswers: { ...blendedAnswers, ...updates } });
  };

  const otherClientName = clientId === 'client1' ? client2Name : client1Name;
  const hasPriorChildren = clientId === 'client1'
    ? blendedFamilyProfile.hasChildrenFromPriorRelationship && childParentage.some(p => p.priorRelationshipClientId === 'client1')
    : blendedFamilyProfile.hasChildrenFromPriorRelationship && childParentage.some(p => p.priorRelationshipClientId === 'client2');

  const priorChildrenNames = childParentage
    .filter(p => p.fromPriorRelationship && p.priorRelationshipClientId === clientId)
    .map(p => p.childName);

  const spouseFirstPlan = firstDeath === 'all_to_spouse' || firstDeath === 'mostly_to_spouse';

  return (
    <div className="space-y-6">
      <SectionHeading label="Blended Family Planning" icon={<Users className="w-4 h-4" />} />

      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 space-y-2">
        <p className="text-sm text-blue-100 leading-relaxed">
          Because your family includes children from different relationships, there are a few additional questions that can help us understand how you want your estate to work and what you believe your current Will provides.
        </p>
        <p className="text-xs text-blue-200/60 leading-relaxed">
          These questions are about your intentions and your understanding of your current plan. They are not a legal interpretation of your Will.
        </p>
      </div>

      {supportObligations.length > 0 && (
        <div className="pt-4 border-t border-gray-700 space-y-3">
          <SectionHeading label="Support Obligations" icon={<Scale className="w-4 h-4" />} />
          <p className="text-sm text-gray-300">
            The following support obligations were identified from your earlier answers:
          </p>
          {supportObligations.map(obligation => (
            <div key={obligation.id} className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
              <p className="text-sm text-white font-medium">
                {obligation.type === 'spousal_support' ? 'Spousal Support' : 'Child Support'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {obligation.payerName} pays {obligation.recipientName}
              </p>
              {obligation.documentLocation && (
                <p className="text-xs text-gray-500 mt-1">Document location: {obligation.documentLocation}</p>
              )}
            </div>
          ))}
          <div>
            <label className={labelClass}>Do you believe your current estate plan takes this obligation into account?</label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
              {DOMESTIC_ALIGNMENT_OPTIONS.map(opt => (
                <OptionButton key={opt.value} label={opt.label} selected={blendedAnswers?.supportObligationAlignment === opt.value} onClick={() => updateBlended({ supportObligationAlignment: opt.value })} />
              ))}
            </div>
          </div>
        </div>
      )}

      {domesticAgreements.length > 0 && (
        <div className="pt-4 border-t border-gray-700 space-y-3">
          <SectionHeading label="Domestic Agreements" icon={<FileText className="w-4 h-4" />} />
          <p className="text-sm text-gray-300">
            Earlier, you told us that you have a domestic agreement.
          </p>
          {domesticAgreements.map(agreement => (
            <div key={agreement.id} className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
              <p className="text-sm text-white font-medium">
                {agreement.type === 'marriage_contract' ? 'Marriage Contract / Prenuptial Agreement' :
                 agreement.type === 'separation' ? 'Separation Agreement' : 'Domestic Agreement'}
              </p>
              {agreement.documentLocation && (
                <p className="text-xs text-gray-500 mt-1">Document location: {agreement.documentLocation}</p>
              )}
            </div>
          ))}
          <div>
            <label className={labelClass}>Do you believe your current Will and estate plan are consistent with this agreement?</label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
              {DOMESTIC_ALIGNMENT_OPTIONS.map(opt => (
                <OptionButton key={opt.value} label={opt.label} selected={blendedAnswers?.currentWillAlignment === opt.value} onClick={() => updateBlended({ currentWillAlignment: opt.value })} />
              ))}
            </div>
          </div>
        </div>
      )}

      {hasPriorChildren && hasSpouse && (
        <div className="pt-4 border-t border-gray-700 space-y-4">
          <SectionHeading label={`${clientName}'s Children from a Previous Relationship`} icon={<Heart className="w-4 h-4" />} />
          <p className="text-sm text-gray-300">
            {priorChildrenNames.length > 0 ? `Your children from a previous relationship: ${priorChildrenNames.join(', ')}.` : 'You have children from a previous relationship.'}
          </p>

          <div>
            <p className="text-sm text-gray-300 mb-2">
              If {clientName} dies first, do you understand most or all of {clientName}'s estate to pass to {otherClientName}?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {FIRST_DEATH_PASS_OPTIONS.map(opt => (
                <OptionButton key={opt.value} label={opt.label} selected={blendedAnswers?.[clientId === 'client1' ? 'client1FirstDeathPassToSpouse' : 'client2FirstDeathPassToSpouse'] === opt.value} onClick={() => updateBlended({ [clientId === 'client1' ? 'client1FirstDeathPassToSpouse' : 'client2FirstDeathPassToSpouse']: opt.value } as Partial<BlendedFamilyAnswers>)} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-300 mb-2">
              Is it important to {clientName} that some portion of {clientName}'s estate ultimately reaches {clientName}'s children from a previous relationship, regardless of which spouse dies first?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {CHILD_PROTECTION_INTENT_OPTIONS.map(opt => (
                <OptionButton key={opt.value} label={opt.label} selected={blendedAnswers?.[clientId === 'client1' ? 'client1ChildProtectionIntent' : 'client2ChildProtectionIntent'] === opt.value} onClick={() => updateBlended({ [clientId === 'client1' ? 'client1ChildProtectionIntent' : 'client2ChildProtectionIntent']: opt.value } as Partial<BlendedFamilyAnswers>)} />
              ))}
            </div>
          </div>

          {(blendedAnswers?.[clientId === 'client1' ? 'client1ChildProtectionIntent' : 'client2ChildProtectionIntent'] === 'yes') && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-300 mb-2">
                  How do you understand your current estate plan to protect that intention?
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {PROTECTION_MECHANISM_OPTIONS.map(opt => (
                    <OptionButton key={opt.value} label={opt.label} selected={blendedAnswers?.[clientId === 'client1' ? 'client1ProtectionMechanism' : 'client2ProtectionMechanism'] === opt.value} onClick={() => updateBlended({ [clientId === 'client1' ? 'client1ProtectionMechanism' : 'client2ProtectionMechanism']: opt.value } as Partial<BlendedFamilyAnswers>)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-300 mb-2">
                  After {clientName} dies, do you understand {otherClientName} to have the ability to change who ultimately receives the assets {otherClientName} inherits from {clientName}?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {SURVIVOR_CONTROL_OPTIONS.map(opt => (
                    <OptionButton key={opt.value} label={opt.label} selected={blendedAnswers?.survivorControlUnderstanding === opt.value} onClick={() => updateBlended({ survivorControlUnderstanding: opt.value })} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-300 mb-2">
                  If {otherClientName} later remarried or entered a new long-term relationship, is it important that some assets remain protected for {clientName}'s children?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {REMARRIAGE_OPTIONS.map(opt => (
                    <OptionButton key={opt.value} label={opt.label} selected={blendedAnswers?.remarriageConcern === opt.value} onClick={() => updateBlended({ remarriageConcern: opt.value })} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {blendedFamilyProfile.hasBlendedFamily && blendedFamilyProfile.hasSharedChildren && blendedFamilyProfile.hasChildrenFromPriorRelationship && (
        <div className="pt-4 border-t border-gray-700 space-y-3">
          <SectionHeading label="Shared Children vs Prior-Relationship Children" icon={<Users className="w-4 h-4" />} />
          <div>
            <p className="text-sm text-gray-300 mb-2">
              Do you want your children to be treated the same way regardless of which relationship they are from?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {TREAT_CHILDREN_OPTIONS.map(opt => (
                <OptionButton key={opt.value} label={opt.label} selected={blendedAnswers?.treatChildrenSameWay === opt.value} onClick={() => updateBlended({ treatChildrenSameWay: opt.value })} />
              ))}
            </div>
          </div>
          {(blendedAnswers?.treatChildrenSameWay === 'no' || blendedAnswers?.treatChildrenSameWay === 'mostly_with_differences') && (
            <div>
              <label className={labelClass}>What differences are important to you?</label>
              <textarea
                value={blendedAnswers?.childrenTreatmentDifferences || ''}
                onChange={e => updateBlended({ childrenTreatmentDifferences: e.target.value })}
                placeholder="Describe the differences (e.g., different percentages, different assets, different trust arrangements, direct gift on first death, later inheritance, etc.)..."
                className={inputClass}
                rows={3}
              />
            </div>
          )}
        </div>
      )}

      {blendedFamilyProfile.hasBlendedFamily && (spouseFirstPlan || firstDeath === 'not_sure') && (
        <div className="pt-4 border-t border-gray-700 space-y-3">
          <SectionHeading label="Mirror Will Risk" icon={<AlertTriangle className="w-4 h-4" />} />
          <p className="text-sm text-gray-300 mb-2">
            Do you understand your current Wills to protect each person's intended inheritance for their own children, even if the surviving spouse later changes their Will?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {SURVIVOR_CONTROL_OPTIONS.map(opt => (
              <OptionButton key={opt.value} label={opt.label} selected={blendedAnswers?.mirrorWillRiskUnderstanding === opt.value} onClick={() => updateBlended({ mirrorWillRiskUnderstanding: opt.value })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
