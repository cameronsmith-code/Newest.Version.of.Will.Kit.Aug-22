import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ChevronRight,
  Home,
  Building2,
  Heart,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Users,
  ArrowRight,
  Pencil,
} from 'lucide-react';
import {
  inputClass,
  labelClass,
  sectionCardClass,
  subtleTextClass,
  OptionButton,
  YesNoCard,
  SummaryCard,
  AddButton,
  DocumentLocationPicker,
  SectionHeading,
} from './FinancialFootprintShared';
import {
  type LegacyIntentRecord,
  type LegacyAssetRef,
  type SuccessionIntent,
  type RecipientRef,
  type BusinessOwnerBranch,
  type AvailableLegacyAsset,
  type LegacyPerson,
  type LegacyScenario,
  emptyLegacyIntent,
  generateReviewFlags,
  isIndivisibleAsset,
  getAvailableLegacyAssets,
  getCorporationShareholders,
  getCorporationKeyPeople,
  getEligibleRecipientsForScenario,
  getFirstDeathDeceasedClientId,
  filterValidRecipientIds,
  filterValidRecipients,
} from '../lib/legacyIntentTypes';
import type { ProfessionalAdvisor } from '../lib/referentialIntegrity';
import { getProfessionalAdvisors } from '../lib/referentialIntegrity';

type Props = {
  answers: Record<string, unknown>;
  allAnswers: Map<string, Record<string, unknown>>;
  onAnswerChange: (key: string, value: unknown) => void;
};

export default function LegacyIntentSection({ answers, allAnswers, onAnswerChange }: Props) {
  const intents = (answers['legacyIntentsData'] as LegacyIntentRecord[]) || [];

  const aboutYou = allAnswers.get('aboutYou') || {};
  const client1Name = (aboutYou['fullName'] as string) || 'Client 1';
  const client2Name = (aboutYou['spouseName'] as string) || 'Client 2';
  const maritalStatus = aboutYou['maritalStatus'] as string;
  const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';
  const hasChildren = (() => {
    const childrenData = (allAnswers.get('children')?.['childrenData'] as Array<Record<string, string>>) || [];
    return childrenData.some((c) => c?.name?.trim());
  })();

  const people = useMemo(() => {
    // Full people list — individual steps will filter by scenario
    const aboutYou = allAnswers.get('aboutYou') || {};
    const client1Name = (aboutYou['fullName'] as string) || 'Client 1';
    const maritalStatus = aboutYou['maritalStatus'] as string;
    const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';
    const client2Name = (aboutYou['spouseName'] as string) || 'Client 2';
    const allPeople: LegacyPerson[] = [
      { id: 'client1', name: client1Name, relationship: 'Self', isClient: true },
    ];
    if (hasSpouse) {
      allPeople.push({ id: 'client2', name: client2Name, relationship: 'Spouse', isClient: true });
    }
    const childrenSection = allAnswers.get('children') || {};
    const children = (childrenSection['childrenData'] as Array<Record<string, string>>) || [];
    children.forEach((c, i) => {
      if (c?.name) {
        allPeople.push({ id: `child_${i}`, name: c.name, relationship: 'Child', isDescendant: true });
        const gcCount = parseInt(c.numberOfGrandchildren || '0', 10);
        for (let g = 1; g <= gcCount; g++) {
          const gcName = c[`grandchild${g}Name`];
          if (gcName) {
            allPeople.push({ id: `child_${i}_grandchild_${g}`, name: gcName, relationship: 'Grandchild', isDescendant: true });
          }
        }
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
  }, [allAnswers]);
  const advisors = useMemo(() => getProfessionalAdvisors(allAnswers), [allAnswers]);
  const accountants = advisors.filter((a) => a.type === 'accountant' && a.name);
  const lawyers = advisors.filter((a) => a.type === 'lawyer' && a.name);
  const financialAdvisors = advisors.filter((a) => a.type === 'financial' && a.name);
  const insuranceAdvisors = advisors.filter((a) => a.type === 'insurance' && a.name);

  const availableAssets = useMemo(() => getAvailableLegacyAssets(allAnswers), [allAnswers]);

  const [activeIntentId, setActiveIntentId] = useState<string | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showFinalReview, setShowFinalReview] = useState(false);

  const updateIntents = (updated: LegacyIntentRecord[]) => {
    onAnswerChange('legacyIntentsData', updated.length > 0 ? updated : undefined);
  };

  const updateIntent = (id: string, updates: Partial<LegacyIntentRecord>) => {
    const updated = intents.map((r) => (r.id === id ? { ...r, ...updates } : r));
    const target = updated.find((r) => r.id === id);
    if (target) {
      target.reviewFlags = generateReviewFlags(target);
    }
    updateIntents(updated);
  };

  const addIntent = (asset: AvailableLegacyAsset) => {
    const assetRef: LegacyAssetRef = {
      id: `asset_${asset.assetId}`,
      assetId: asset.assetId,
      assetSourceSectionId: asset.assetSourceSectionId,
      assetName: asset.assetName,
      assetType: asset.assetType,
      assetSubtype: asset.assetSubtype,
      ownership: asset.ownership,
      isBusiness: asset.isBusiness,
    };
    const newIntent = emptyLegacyIntent(assetRef);
    updateIntents([...intents, newIntent]);
    setActiveIntentId(newIntent.id);
    setShowAssetPicker(false);
  };

  const deleteIntent = (id: string) => {
    updateIntents(intents.filter((r) => r.id !== id));
    if (activeIntentId === id) setActiveIntentId(null);
  };

  const activeIntent = intents.find((r) => r.id === activeIntentId);
  const usedAssetIds = new Set(intents.map((r) => r.asset.assetId));

  if (activeIntent) {
    return (
      <LegacyIntentEditor
        record={activeIntent}
        onUpdate={(updates) => updateIntent(activeIntent.id, updates)}
        onBack={() => setActiveIntentId(null)}
        client1Name={client1Name}
        client2Name={client2Name}
        hasSpouse={hasSpouse}
        hasChildren={hasChildren}
        people={people}
        accountants={accountants}
        lawyers={lawyers}
        financialAdvisors={financialAdvisors}
        insuranceAdvisors={insuranceAdvisors}
        allAnswers={allAnswers}
      />
    );
  }

  if (showFinalReview) {
    return (
      <FinalReview
        intents={intents}
        onEdit={(id) => { setActiveIntentId(id); setShowFinalReview(false); }}
        onBack={() => setShowFinalReview(false)}
        onConfirm={() => setShowFinalReview(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className={sectionCardClass}>
        <h2 className="text-2xl font-bold text-white mb-3">Your Legacy Intentions</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          Some assets are more than just numbers on a balance sheet. A family cottage, business, piece of land, collection
          or family heirloom may come with important wishes about what happens to it in the future.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed mt-3">
          Here, we'll identify the assets where you have a particular intention and walk through what you'd ideally like
          to happen in different circumstances.
        </p>
        <div className="mt-4 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <p className="text-xs text-blue-200/80 leading-relaxed">
            These are your intentions. They do not replace your Will or other legal documents, but they can help identify
            important matters to discuss with your estate-planning professionals.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeading label="Anything you want to plan around specifically?" icon={<Heart className="w-4 h-4" />} />
        <p className={subtleTextClass}>
          Most assets can simply form part of your overall estate plan. But some may have particular family, emotional or
          practical importance.
        </p>

        {availableAssets.length > 0 && (
          <div>
            <p className="text-sm text-gray-300 mb-3">
              Are there any of these assets where you have a particular intention for what should happen in the future?
            </p>
            <div className="space-y-2.5">
              {availableAssets.map((asset) => {
                const alreadyAdded = usedAssetIds.has(asset.assetId);
                return (
                  <button
                    key={asset.assetId}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => addIntent(asset)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left w-full transition-all ${
                      alreadyAdded
                        ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-800 border-gray-600 text-gray-200 hover:border-blue-500 hover:text-white'
                    }`}
                  >
                    {asset.assetType === 'corporation' ? (
                      <Building2 className="w-5 h-5 flex-shrink-0 text-blue-400" />
                    ) : (
                      <Home className="w-5 h-5 flex-shrink-0 text-blue-400" />
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-medium">{asset.assetName}</span>
                      {asset.assetSubtype && (
                        <span className="text-xs text-gray-500 ml-2">({asset.assetSubtype.replace(/_/g, ' ')})</span>
                      )}
                    </div>
                    {alreadyAdded ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {availableAssets.length === 0 && (
          <div className="border border-dashed border-gray-600 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400">
              No assets have been entered in the Real Estate or Corporation sections yet.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              You can still add a meaningful asset manually below.
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAssetPicker(true)}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add another meaningful asset
          </button>
        </div>

        {showAssetPicker && (
          <CustomAssetPicker
            onAdd={(name, type, notes) => {
              const assetRef: LegacyAssetRef = {
                id: `asset_custom_${Date.now()}`,
                assetId: `custom_${Date.now()}`,
                assetSourceSectionId: 'legacyIntent',
                assetName: name,
                assetType: 'other',
                assetSubtype: type,
              };
              const newIntent = emptyLegacyIntent(assetRef);
              newIntent.notes = notes;
              updateIntents([...intents, newIntent]);
              setActiveIntentId(newIntent.id);
              setShowAssetPicker(false);
            }}
            onCancel={() => setShowAssetPicker(false)}
          />
        )}
      </div>

      {intents.length > 0 && (
        <div className="space-y-4 pt-4">
          <SectionHeading label="Your Legacy Intent Assets" icon={<Heart className="w-4 h-4" />} />
          <div className="space-y-3">
            {intents.map((record) => {
              const flags = generateReviewFlags(record);
              return (
                <SummaryCard
                  key={record.id}
                  title={record.asset.assetName}
                  subtitle={record.asset.assetType === 'corporation' ? 'Family Business / Corporation' : record.asset.assetSubtype?.replace(/_/g, ' ') || record.asset.assetType}
                  details={[
                    ...(record.firstDeath?.outcome ? [{ label: 'First death', value: outcomeLabel(record.firstDeath.outcome) }] : []),
                    ...(record.bothDeceased?.outcome ? [{ label: 'If neither is living', value: outcomeLabel(record.bothDeceased.outcome) }] : []),
                    ...(record.noSurvivingDescendants?.outcome ? [{ label: 'If no descendants survive', value: outcomeLabel(record.noSurvivingDescendants.outcome) }] : []),
                    ...(record.stayInFamilyIntent === 'yes' ? [{ label: 'Stay in family', value: 'Yes' }] : []),
                    ...(record.reflectedInEstateDocuments ? [{ label: 'In estate documents', value: docStatus(record.reflectedInEstateDocuments) }] : []),
                    ...(flags.length > 0 ? [{ label: 'Flags', value: `${flags.length} item(s) to review` }] : []),
                  ]}
                  onEdit={() => setActiveIntentId(record.id)}
                  onDelete={() => deleteIntent(record.id)}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowFinalReview(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            Review All Legacy Intentions
          </button>
        </div>
      )}
    </div>
  );
}

function outcomeLabel(outcome: string): string {
  const map: Record<string, string> = {
    surviving_spouse: 'Surviving spouse/partner',
    specific_persons: 'Specific person(s)',
    shared_among: 'Shared among people',
    held_for_someone: 'Held for someone',
    sold: 'Be sold',
    transferred: 'Transferred to another owner',
    general_estate: 'Part of general estate',
    equally_to_children: 'Equally to children',
    to_descendants: 'To descendants',
    shared_proportions: 'Shared in different proportions',
    held_in_trust: 'Held in trust',
    offered_to_family_first: 'Offered to family first',
    sold_proceeds_estate: 'Sold — proceeds to estate',
    sold_proceeds_particular: 'Sold — proceeds distributed specifically',
    to_charity: 'To a charity or organization',
    extended_family: 'Extended family',
    divided_extended_family: 'Divided among extended family',
    friends_others: 'Friends or other people',
    sold_distributed_estate: 'Sold and distributed through estate',
    spouse_becomes_owner: 'Surviving spouse becomes owner',
    children_become_owners: 'Children become owners',
    specific_family_member: 'Specific family member becomes owner',
    existing_shareholders_acquire: 'Existing shareholders acquire shares',
    management_employees_acquire: 'Management/employees acquire',
    business_sold: 'Business is sold',
    business_wound_down: 'Business is wound down',
    follow_shareholder_agreement: 'Follow shareholder agreement',
    other: 'Other',
    not_sure: "I'm not sure",
  };
  return map[outcome] || outcome;
}

function docStatus(val: string): string {
  const map: Record<string, string> = {
    yes: 'Yes',
    no: 'No',
    not_sure: 'Not sure',
    not_discussed: "Haven't discussed with lawyer",
  };
  return map[val] || val;
}

// ─── Custom Asset Picker ──────────────────────────────────────────────────

function CustomAssetPicker({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, type: string, notes?: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');

  const typeOptions: Array<{ value: string; label: string }> = [
    { value: 'family_cottage', label: 'Family cottage' },
    { value: 'vacation_home', label: 'Vacation home' },
    { value: 'farm', label: 'Farm' },
    { value: 'investment_property', label: 'Investment property' },
    { value: 'collectibles', label: 'Collectibles' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'heirloom', label: 'Family heirloom' },
    { value: 'artwork', label: 'Artwork' },
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'boats', label: 'Boat' },
    { value: 'other_meaningful', label: 'Other personally meaningful asset' },
  ];

  return (
    <div className="border border-blue-500/40 rounded-xl p-5 bg-gray-800 space-y-4">
      <h4 className="text-sm font-semibold text-white">Add a meaningful asset</h4>
      <div>
        <label className={labelClass}>Asset name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Grandfather's Rolex, Family Boat" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>What type of asset is it?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {typeOptions.map((opt) => (
            <OptionButton key={opt.value} label={opt.label} selected={type === opt.value} onClick={() => setType(opt.value)} />
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass}>Why is this asset important? (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any context about why this asset has particular significance" className={inputClass} />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => onAdd(name.trim(), type, notes.trim() || undefined)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500"
        >
          Add Asset
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 text-gray-400 hover:text-gray-300 text-sm">Cancel</button>
      </div>
    </div>
  );
}

// ─── Final Review ─────────────────────────────────────────────────────────

function FinalReview({
  intents,
  onEdit,
  onBack,
  onConfirm,
}: {
  intents: LegacyIntentRecord[];
  onEdit: (id: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className={sectionCardClass}>
        <h2 className="text-2xl font-bold text-white">Your Legacy Intentions</h2>
        <p className="text-sm text-gray-300 mt-2">
          Here's what you've told us about the assets that matter most to your estate plan.
        </p>
      </div>

      <div className="space-y-4">
        {intents.map((record) => {
          const flags = generateReviewFlags(record);
          return (
            <div key={record.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{record.asset.assetName}</h3>
                  <p className="text-xs text-gray-400">
                    {record.asset.assetType === 'corporation' ? 'Family Business' : record.asset.assetSubtype?.replace(/_/g, ' ') || record.asset.assetType.replace(/_/g, ' ')}
                  </p>
                </div>
                <button type="button" onClick={() => onEdit(record.id)} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-2 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <div className="space-y-2">
                {record.firstDeath?.outcome && (
                  <ReviewRow label="First death" value={outcomeLabel(record.firstDeath.outcome)} recipients={record.firstDeath.recipients} />
                )}
                {record.bothDeceased?.outcome && (
                  <ReviewRow label="If neither is living" value={outcomeLabel(record.bothDeceased.outcome)} recipients={record.bothDeceased.recipients} />
                )}
                {record.noSurvivingDescendants?.outcome && (
                  <ReviewRow label="If no descendants survive" value={outcomeLabel(record.noSurvivingDescendants.outcome)} recipients={record.noSurvivingDescendants.recipients} />
                )}
                {record.stayInFamilyIntent && (
                  <ReviewRow label="Stay in family" value={record.stayInFamilyIntent === 'yes' ? 'Yes' : record.stayInFamilyIntent === 'no' ? 'No' : 'No preference / Not sure'} />
                )}
                {record.equalizationIntent && (
                  <ReviewRow label="Equalization important" value={record.equalizationIntent === 'yes' ? 'Yes' : record.equalizationIntent === 'no' ? 'No' : 'Not necessarily / Not sure'} />
                )}
                {record.discussedWithFamily && (
                  <ReviewRow label="Discussed with family" value={record.discussedWithFamily === 'yes' ? 'Yes' : record.discussedWithFamily === 'somewhat' ? 'Somewhat' : record.discussedWithFamily === 'no' ? 'No' : 'Not applicable'} />
                )}
                {record.reflectedInEstateDocuments && (
                  <ReviewRow label="Reflected in estate documents" value={docStatus(record.reflectedInEstateDocuments)} />
                )}
                {record.asset.isBusiness && record.businessBranch && (
                  <>
                    <ReviewRow label="Ownership succession" value={outcomeLabel(record.businessBranch.ownershipSuccession)} />
                    <ReviewRow label="Management succession" value={record.businessBranch.managementSuccessionPersonName || outcomeLabel(record.businessBranch.managementSuccession)} />
                    <ReviewRow label="Shareholder agreement consistent" value={record.businessBranch.shareholderAgreementConsistent === 'yes' ? 'Yes' : record.businessBranch.shareholderAgreementConsistent === 'no' ? 'No' : 'Not sure / Not discussed'} />
                    <ReviewRow label="Post-mortem planning considered" value={record.businessBranch.postMortemConsidered === 'yes' ? 'Yes' : record.businessBranch.postMortemConsidered === 'no' ? 'No' : 'Not sure'} />
                  </>
                )}
              </div>

              {flags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-amber-400 font-medium mb-1">Review Flags:</p>
                  {flags.map((f, i) => (
                    <p key={i} className="text-xs text-amber-300/80 mb-1">{f}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-300">Does this reflect what you would ideally like to happen?</p>
        <div className="flex gap-3">
          <button type="button" onClick={onConfirm} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-500 transition-all">
            <CheckCircle2 className="w-5 h-5" /> Yes, looks right
          </button>
          <button type="button" onClick={onBack} className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-gray-200 rounded-xl font-medium hover:bg-gray-600 transition-all">
            I need to make a change
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, recipients }: { label: string; value: string; recipients?: RecipientRef[] }) {
  return (
    <div className="flex items-start justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white text-right">
        {value}
        {recipients && recipients.length > 0 && (
          <span className="text-gray-400 text-xs block">{recipients.map((r) => r.personName + (r.share ? ` (${r.share})` : '')).join(', ')}</span>
        )}
      </span>
    </div>
  );
}

// ─── Legacy Intent Editor ─────────────────────────────────────────────────

type EditorProps = {
  record: LegacyIntentRecord;
  onUpdate: (u: Partial<LegacyIntentRecord>) => void;
  onBack: () => void;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  hasChildren: boolean;
  people: LegacyPerson[];
  accountants: ProfessionalAdvisor[];
  lawyers: ProfessionalAdvisor[];
  financialAdvisors: ProfessionalAdvisor[];
  insuranceAdvisors: ProfessionalAdvisor[];
  allAnswers: Map<string, Record<string, unknown>>;
};

type EditorStep =
  | 'first_death'
  | 'both_deceased'
  | 'no_descendants'
  | 'stay_in_family'
  | 'equalization'
  | 'family_discussion'
  | 'documentation'
  | 'business_branch'
  | 'summary';

function getEditorSteps(record: LegacyIntentRecord, hasSpouse: boolean, isBusiness: boolean): EditorStep[] {
  const steps: EditorStep[] = [];
  if (hasSpouse) steps.push('first_death');
  steps.push('both_deceased');
  steps.push('no_descendants');
  if (isIndivisibleAsset(record)) {
    steps.push('stay_in_family');
    steps.push('equalization');
  }
  if (isBusiness) steps.push('business_branch');
  steps.push('family_discussion');
  steps.push('documentation');
  steps.push('summary');
  return steps;
}

function LegacyIntentEditor({
  record,
  onUpdate,
  onBack,
  client1Name,
  client2Name,
  hasSpouse,
  hasChildren,
  people,
  accountants,
  lawyers,
  financialAdvisors,
  insuranceAdvisors,
  allAnswers,
}: EditorProps) {
  const steps = getEditorSteps(record, hasSpouse, !!record.asset.isBusiness);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = steps[currentStepIdx];
  const assetName = record.asset.assetName;
  const isBusiness = !!record.asset.isBusiness;

  const goNext = () => {
    if (currentStepIdx < steps.length - 1) setCurrentStepIdx(currentStepIdx + 1);
  };
  const goPrev = () => {
    if (currentStepIdx > 0) setCurrentStepIdx(currentStepIdx - 1);
  };

  const updateSuccession = (field: 'firstDeath' | 'bothDeceased' | 'noSurvivingDescendants', updates: Partial<SuccessionIntent>) => {
    const existing = record[field] || { outcome: '', recipientIds: [], recipients: [] };
    onUpdate({ [field]: { ...existing, ...updates } });
  };

  const updateBusinessBranch = (updates: Partial<BusinessOwnerBranch>) => {
    const existing = record.businessBranch || {
      ownershipSuccession: 'not_sure',
      ownershipSuccessionRecipients: [],
      managementSuccession: 'not_sure',
      shareholderAgreementConsistent: 'not_sure',
      postMortemFlexibility: 'not_sure',
      postMortemConsidered: 'not_sure',
      hasPlanningDocuments: 'not_sure',
      professionalContactIds: [],
      businessDiscussedWithFamily: 'not_applicable',
      successorHasDiscussed: 'not_sure',
    };
    onUpdate({ businessBranch: { ...existing, ...updates } });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Legacy Intent List
        </button>
      </div>

      <div className={sectionCardClass}>
        <div className="flex items-center gap-3">
          {isBusiness ? <Building2 className="w-8 h-8 text-blue-400" /> : <Home className="w-8 h-8 text-blue-400" />}
          <div>
            <h2 className="text-2xl font-bold text-white">{assetName}</h2>
            <p className="text-xs text-gray-400">
              {isBusiness ? 'Family Business / Corporation' : record.asset.assetSubtype?.replace(/_/g, ' ') || record.asset.assetType.replace(/_/g, ' ')}
              {record.asset.ownership === 'joint' && ' — Jointly owned'}
              {record.asset.ownership === 'client1' && ` — Owned by ${client1Name}`}
              {record.asset.ownership === 'client2' && ` — Owned by ${client2Name}`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => {
          const isActive = i === currentStepIdx;
          const isDone = i < currentStepIdx;
          const labels: Record<EditorStep, string> = {
            first_death: 'First Death',
            both_deceased: 'Neither Living',
            no_descendants: 'Ultimate Contingency',
            stay_in_family: 'Stay in Family',
            equalization: 'Fairness',
            family_discussion: 'Family Discussion',
            documentation: 'Documentation',
            business_branch: 'Business Planning',
            summary: 'Summary',
          };
          return (
            <button
              key={s}
              type="button"
              onClick={() => setCurrentStepIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-gray-500'
              }`}
            >
              {isDone && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
              {labels[s]}
            </button>
          );
        })}
      </div>

      <div className={sectionCardClass}>
        {currentStep === 'first_death' && (
          <FirstDeathStep record={record} onUpdate={updateSuccession} assetName={assetName} client1Name={client1Name} client2Name={client2Name} people={getEligibleRecipientsForScenario('firstDeath', allAnswers, getFirstDeathDeceasedClientId(record.asset.ownership))} />
        )}
        {currentStep === 'both_deceased' && (
          <BothDeceasedStep record={record} onUpdate={updateSuccession} assetName={assetName} client1Name={client1Name} client2Name={client2Name} hasSpouse={hasSpouse} hasChildren={hasChildren} people={getEligibleRecipientsForScenario('bothDeceased', allAnswers)} />
        )}
        {currentStep === 'no_descendants' && (
          <NoDescendantsStep record={record} onUpdate={updateSuccession} assetName={assetName} client1Name={client1Name} client2Name={client2Name} hasSpouse={hasSpouse} people={getEligibleRecipientsForScenario('noSurvivingDescendants', allAnswers)} />
        )}
        {currentStep === 'stay_in_family' && (
          <StayInFamilyStep record={record} onUpdate={onUpdate} assetName={assetName} people={getEligibleRecipientsForScenario('bothDeceased', allAnswers)} />
        )}
        {currentStep === 'equalization' && (
          <EqualizationStep record={record} onUpdate={onUpdate} assetName={assetName} />
        )}
        {currentStep === 'family_discussion' && (
          <FamilyDiscussionStep record={record} onUpdate={onUpdate} assetName={assetName} isBusiness={isBusiness} />
        )}
        {currentStep === 'documentation' && (
          <DocumentationStep record={record} onUpdate={onUpdate} assetName={assetName} />
        )}
        {currentStep === 'business_branch' && (
          <BusinessBranchStep
            record={record}
            onUpdate={updateBusinessBranch}
            assetName={assetName}
            client1Name={client1Name}
            client2Name={client2Name}
            people={getEligibleRecipientsForScenario('firstDeath', allAnswers, getFirstDeathDeceasedClientId(record.asset.ownership))}
            accountants={accountants}
            lawyers={lawyers}
            financialAdvisors={financialAdvisors}
            insuranceAdvisors={insuranceAdvisors}
            allAnswers={allAnswers}
          />
        )}
        {currentStep === 'summary' && (
          <SummaryStep record={record} assetName={assetName} />
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={goPrev} disabled={currentStepIdx === 0} className="px-5 py-2.5 text-gray-400 hover:text-gray-200 font-medium transition-colors disabled:opacity-30">
          Previous
        </button>
        <div className="text-sm text-gray-500">{currentStepIdx + 1} of {steps.length}</div>
        {currentStepIdx < steps.length - 1 ? (
          <button type="button" onClick={goNext} className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={onBack} className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-green-600 text-white hover:bg-green-500 transition-all">
            <CheckCircle2 className="w-4 h-4" /> Done
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Person Picker ────────────────────────────────────────────────────────

function PersonPicker({
  people,
  selectedIds,
  onToggle,
  onAddOther,
  allowAddOther = true,
}: {
  people: LegacyPerson[];
  selectedIds: string[];
  onToggle: (personId: string, name: string) => void;
  onAddOther?: (name: string) => void;
  allowAddOther?: boolean;
}) {
  const [showOther, setShowOther] = useState(false);
  const [otherName, setOtherName] = useState('');

  return (
    <div className="space-y-2.5">
      {people.map((p) => (
        <OptionButton
          key={p.id}
          label={`${p.name} (${p.relationship})`}
          selected={selectedIds.includes(p.id)}
          onClick={() => onToggle(p.id, p.name)}
        />
      ))}
      {allowAddOther && (
        <>
          {!showOther ? (
            <button type="button" onClick={() => setShowOther(true)} className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-sm">
              <Plus className="w-4 h-4" /> Add someone else
            </button>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="Enter name" className={inputClass} />
              <button type="button" onClick={() => { if (otherName.trim() && onAddOther) { onAddOther(otherName.trim()); setOtherName(''); setShowOther(false); } }} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500">Add</button>
              <button type="button" onClick={() => setShowOther(false)} className="text-sm text-gray-400 px-2">Cancel</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Recipient Manager ────────────────────────────────────────────────────

function updateRecipients(recipients: RecipientRef[], personId: string, name: string): RecipientRef[] {
  if (recipients.some((r) => r.personId === personId)) {
    return recipients.filter((r) => r.personId !== personId);
  }
  return [...recipients, { personId, personName: name }];
}

function RecipientList({ recipients, onUpdate }: { recipients: RecipientRef[]; onUpdate: (r: RecipientRef[]) => void }) {
  if (recipients.length === 0) return null;
  return (
    <div className="space-y-2 mt-3">
      {recipients.map((r, i) => (
        <div key={i} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
          <span className="text-sm text-white flex-1">{r.personName}</span>
          <input type="text" value={r.share || ''} onChange={(e) => { const updated = [...recipients]; updated[i] = { ...r, share: e.target.value }; onUpdate(updated); }} placeholder="e.g., 50%" className="w-20 px-2 py-1 text-xs bg-gray-700 border border-gray-600 text-white rounded" />
          <button type="button" onClick={() => onUpdate(recipients.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <p className={subtleTextClass}>Shares/percentages are optional — leave blank if you're unsure.</p>
    </div>
  );
}

// ─── First Death Step ─────────────────────────────────────────────────────

function FirstDeathStep({
  record,
  onUpdate,
  assetName,
  client1Name,
  client2Name,
  people,
}: {
  record: LegacyIntentRecord;
  onUpdate: (field: 'firstDeath', updates: Partial<SuccessionIntent>) => void;
  assetName: string;
  client1Name: string;
  client2Name: string;
  people: LegacyPerson[];
}) {
  const intent = record.firstDeath || { outcome: '', recipientIds: [], recipients: [] };
  const ownership = record.asset.ownership;

  let question = '';
  if (ownership === 'joint') {
    question = `If either of you dies while the other is still living, what would you ideally like to happen to ${assetName}?`;
  } else if (ownership === 'client1') {
    question = `If ${client1Name} dies while ${client2Name} is still living, what would you ideally like to happen to ${assetName}?`;
  } else if (ownership === 'client2') {
    question = `If ${client2Name} dies while ${client1Name} is still living, what would you ideally like to happen to ${assetName}?`;
  } else {
    question = `If either of you dies while the other is still living, what would you ideally like to happen to ${assetName}?`;
  }

  const outcomes = [
    { value: 'surviving_spouse', label: 'Go to the surviving spouse/partner' },
    { value: 'specific_persons', label: 'Go to specific person(s)' },
    { value: 'shared_among', label: 'Be shared among specific people' },
    { value: 'held_for_someone', label: 'Be held for someone' },
    { value: 'sold', label: 'Be sold' },
    { value: 'transferred', label: 'Be transferred to another owner' },
    { value: 'general_estate', label: 'Become part of the general estate' },
    { value: 'other', label: 'Other' },
    { value: 'not_sure', label: "I'm not sure" },
  ];

  const needsRecipients = ['specific_persons', 'shared_among', 'held_for_someone'].includes(intent.outcome);

  return (
    <div className="space-y-5">
      <StepTitle title="First Death" icon={<Heart className="w-5 h-5" />} />
      <div>
        <label className={labelClass}>{question}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          {outcomes.map((o) => (
            <OptionButton key={o.value} label={o.label} selected={intent.outcome === o.value} onClick={() => onUpdate('firstDeath', { outcome: o.value, recipientIds: [], recipients: [] })} />
          ))}
        </div>
      </div>

      {needsRecipients && (
        <div>
          <label className={labelClass}>Who would you like to receive {assetName}?</label>
          <PersonPicker
            people={people}
            selectedIds={intent.recipientIds}
            onToggle={(pid, name) => onUpdate('firstDeath', { recipientIds: intent.recipientIds.includes(pid) ? intent.recipientIds.filter((id) => id !== pid) : [...intent.recipientIds, pid], recipients: updateRecipients(intent.recipients, pid, name) })}
            onAddOther={(name) => onUpdate('firstDeath', { recipientIds: [...intent.recipientIds, `other_${Date.now()}`], recipients: [...intent.recipients, { personName: name }] })}
          />
          <RecipientList recipients={intent.recipients} onUpdate={(r) => onUpdate('firstDeath', { recipients: r })} />
        </div>
      )}

      {intent.outcome === 'other' && (
        <div>
          <label className={labelClass}>Please describe what you would want:</label>
          <textarea value={intent.notes || ''} onChange={(e) => onUpdate('firstDeath', { notes: e.target.value })} rows={3} className={inputClass} placeholder="Describe your intention..." />
        </div>
      )}
    </div>
  );
}

// ─── Both Deceased Step ───────────────────────────────────────────────────

function BothDeceasedStep({
  record,
  onUpdate,
  assetName,
  client1Name,
  client2Name,
  hasSpouse,
  hasChildren,
  people,
}: {
  record: LegacyIntentRecord;
  onUpdate: (field: 'bothDeceased', updates: Partial<SuccessionIntent>) => void;
  assetName: string;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  hasChildren: boolean;
  people: LegacyPerson[];
}) {
  const intent = record.bothDeceased || { outcome: '', recipientIds: [], recipients: [] };

  const question = hasSpouse
    ? `If neither of you is living, what would you ideally like to happen to ${assetName}?`
    : `If you are no longer living, what would you ideally like to happen to ${assetName}?`;

  const supporting = hasChildren ? 'Think about what you would want if your children or other descendants are still living.' : '';

  const outcomes = [
    { value: 'equally_to_children', label: 'Go equally to our children' },
    { value: 'to_descendants', label: 'Go to our descendants' },
    { value: 'specific_persons', label: 'Go to specific person(s)' },
    { value: 'shared_proportions', label: 'Be shared in different proportions' },
    { value: 'held_in_trust', label: 'Be held in trust' },
    { value: 'offered_to_family_first', label: 'Be offered to certain family members first' },
    { value: 'sold_proceeds_estate', label: 'Be sold and the proceeds form part of the estate' },
    { value: 'sold_proceeds_particular', label: 'Be sold and proceeds distributed in a particular way' },
    { value: 'to_charity', label: 'Go to a charity or organization' },
    { value: 'other', label: 'Other' },
    { value: 'not_sure', label: "I'm not sure" },
  ];

  const needsRecipients = ['specific_persons', 'shared_proportions', 'offered_to_family_first', 'sold_proceeds_particular'].includes(intent.outcome);

  return (
    <div className="space-y-5">
      <StepTitle title="If Neither Spouse/Partner Is Living" icon={<Users className="w-5 h-5" />} />
      <div>
        <label className={labelClass}>{question}</label>
        {supporting && <p className={subtleTextClass}>{supporting}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          {outcomes.map((o) => (
            <OptionButton key={o.value} label={o.label} selected={intent.outcome === o.value} onClick={() => onUpdate('bothDeceased', { outcome: o.value, recipientIds: [], recipients: [] })} />
          ))}
        </div>
      </div>

      {needsRecipients && (
        <div>
          <label className={labelClass}>Who would you like to receive {assetName}?</label>
          <PersonPicker
            people={people}
            selectedIds={intent.recipientIds}
            onToggle={(pid, name) => onUpdate('bothDeceased', { recipientIds: intent.recipientIds.includes(pid) ? intent.recipientIds.filter((id) => id !== pid) : [...intent.recipientIds, pid], recipients: updateRecipients(intent.recipients, pid, name) })}
            onAddOther={(name) => onUpdate('bothDeceased', { recipientIds: [...intent.recipientIds, `other_${Date.now()}`], recipients: [...intent.recipients, { personName: name }] })}
          />
          <RecipientList recipients={intent.recipients} onUpdate={(r) => onUpdate('bothDeceased', { recipients: r })} />
        </div>
      )}

      {intent.outcome === 'other' && (
        <div>
          <label className={labelClass}>Please describe what you would want:</label>
          <textarea value={intent.notes || ''} onChange={(e) => onUpdate('bothDeceased', { notes: e.target.value })} rows={3} className={inputClass} placeholder="Describe your intention..." />
        </div>
      )}
    </div>
  );
}

// ─── No Descendants Step ──────────────────────────────────────────────────

function NoDescendantsStep({
  record,
  onUpdate,
  assetName,
  client1Name,
  client2Name,
  hasSpouse,
  people,
}: {
  record: LegacyIntentRecord;
  onUpdate: (field: 'noSurvivingDescendants', updates: Partial<SuccessionIntent>) => void;
  assetName: string;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  people: LegacyPerson[];
}) {
  const intent = record.noSurvivingDescendants || { outcome: '', recipientIds: [], recipients: [] };

  const question = hasSpouse
    ? `If neither of you nor any of your descendants are living, what would you ideally like to happen to ${assetName}?`
    : `If you and none of your descendants are living, what would you ideally like to happen to ${assetName}?`;

  const outcomes = [
    { value: 'extended_family', label: 'Go to specific extended family members' },
    { value: 'divided_extended_family', label: 'Be divided among extended family' },
    { value: 'friends_others', label: 'Go to friends or other people' },
    { value: 'to_charity', label: 'Go to a charity or charities' },
    { value: 'sold_distributed_estate', label: 'Be sold and distributed through the rest of my estate' },
    { value: 'other', label: 'Other' },
    { value: 'not_sure', label: "I'm not sure" },
  ];

  const needsRecipients = ['extended_family', 'friends_others', 'to_charity'].includes(intent.outcome);

  return (
    <div className="space-y-5">
      <StepTitle title="One Last Scenario" icon={<Scale className="w-5 h-5" />} />
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <p className="text-sm text-blue-200/80 leading-relaxed">
          It may be unlikely, but a complete estate plan also considers what should happen if none of your descendants are living.
        </p>
      </div>
      <div>
        <label className={labelClass}>{question}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          {outcomes.map((o) => (
            <OptionButton key={o.value} label={o.label} selected={intent.outcome === o.value} onClick={() => onUpdate('noSurvivingDescendants', { outcome: o.value, recipientIds: [], recipients: [] })} />
          ))}
        </div>
      </div>

      {needsRecipients && (
        <div>
          <label className={labelClass}>Who would you like to receive {assetName}?</label>
          <PersonPicker
            people={people}
            selectedIds={intent.recipientIds}
            onToggle={(pid, name) => onUpdate('noSurvivingDescendants', { recipientIds: intent.recipientIds.includes(pid) ? intent.recipientIds.filter((id) => id !== pid) : [...intent.recipientIds, pid], recipients: updateRecipients(intent.recipients, pid, name) })}
            onAddOther={(name) => onUpdate('noSurvivingDescendants', { recipientIds: [...intent.recipientIds, `other_${Date.now()}`], recipients: [...intent.recipients, { personName: name }] })}
          />
          <RecipientList recipients={intent.recipients} onUpdate={(r) => onUpdate('noSurvivingDescendants', { recipients: r })} />
        </div>
      )}

      {intent.outcome === 'other' && (
        <div>
          <label className={labelClass}>Please describe what you would want:</label>
          <textarea value={intent.notes || ''} onChange={(e) => onUpdate('noSurvivingDescendants', { notes: e.target.value })} rows={3} className={inputClass} placeholder="Describe your intention..." />
        </div>
      )}
    </div>
  );
}

// ─── Stay in Family Step ──────────────────────────────────────────────────

function StayInFamilyStep({
  record,
  onUpdate,
  assetName,
  people,
}: {
  record: LegacyIntentRecord;
  onUpdate: (u: Partial<LegacyIntentRecord>) => void;
  assetName: string;
  people: LegacyPerson[];
}) {
  const intent = record.stayInFamilyIntent;
  const recipientIds = record.stayInFamilyRecipientIds || [];

  return (
    <div className="space-y-5">
      <StepTitle title="Keeping It in the Family" icon={<Home className="w-5 h-5" />} />
      <div>
        <label className={labelClass}>Would you ideally like {assetName} to stay in the family?</label>
        <YesNoCard
          selectedValue={intent || ''}
          onClick={(v) => onUpdate({ stayInFamilyIntent: v as LegacyIntentRecord['stayInFamilyIntent'], stayInFamilyRecipientIds: v !== 'yes' ? undefined : recipientIds, stayInFamilyFallback: v !== 'yes' ? undefined : record.stayInFamilyFallback })}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'no_preference', label: 'No preference' }, { value: 'not_sure', label: "I'm not sure" }]}
        />
      </div>

      {intent === 'yes' && (
        <>
          <div>
            <label className={labelClass}>Who would you ideally like to have the opportunity to keep it?</label>
            <PersonPicker
              people={people}
              selectedIds={recipientIds}
              onToggle={(pid, _name) => onUpdate({ stayInFamilyRecipientIds: recipientIds.includes(pid) ? recipientIds.filter((id) => id !== pid) : [...recipientIds, pid] })}
            />
          </div>
          <div>
            <label className={labelClass}>If they didn't want or weren't able to keep it, what would you want to happen?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              <OptionButton label="Offer it to another family member" selected={record.stayInFamilyFallback === 'offer_another'} onClick={() => onUpdate({ stayInFamilyFallback: 'offer_another' })} />
              <OptionButton label="Sell it" selected={record.stayInFamilyFallback === 'sell'} onClick={() => onUpdate({ stayInFamilyFallback: 'sell' })} />
              <OptionButton label="Follow my general estate instructions" selected={record.stayInFamilyFallback === 'general_estate'} onClick={() => onUpdate({ stayInFamilyFallback: 'general_estate' })} />
              <OptionButton label="Other" selected={record.stayInFamilyFallback === 'other'} onClick={() => onUpdate({ stayInFamilyFallback: 'other' })} />
              <OptionButton label="I'm not sure" selected={record.stayInFamilyFallback === 'not_sure' || !record.stayInFamilyFallback} onClick={() => onUpdate({ stayInFamilyFallback: 'not_sure' })} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Equalization Step ────────────────────────────────────────────────────

function EqualizationStep({
  record,
  onUpdate,
  assetName,
}: {
  record: LegacyIntentRecord;
  onUpdate: (u: Partial<LegacyIntentRecord>) => void;
  assetName: string;
}) {
  return (
    <div className="space-y-5">
      <StepTitle title="Fairness vs. Equal Ownership" icon={<Scale className="w-5 h-5" />} />
      <div>
        <label className={labelClass}>
          If one person receives {assetName}, is it important to you that other beneficiaries receive something of similar value?
        </label>
        <p className={subtleTextClass}>
          This is an intention only. It does not calculate equalization or recommend any particular strategy.
        </p>
        <YesNoCard
          selectedValue={record.equalizationIntent || ''}
          onClick={(v) => onUpdate({ equalizationIntent: v as LegacyIntentRecord['equalizationIntent'] })}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_necessarily', label: 'Not necessarily' }, { value: 'not_sure', label: "I'm not sure" }]}
        />
      </div>
    </div>
  );
}

// ─── Family Discussion Step ───────────────────────────────────────────────

function FamilyDiscussionStep({
  record,
  onUpdate,
  assetName,
  isBusiness,
}: {
  record: LegacyIntentRecord;
  onUpdate: (u: Partial<LegacyIntentRecord>) => void;
  assetName: string;
  isBusiness: boolean;
}) {
  return (
    <div className="space-y-5">
      <StepTitle title="Family Discussion" icon={<Users className="w-5 h-5" />} />
      <div>
        <label className={labelClass}>
          Have you discussed your intentions for {assetName} with the people involved?
        </label>
        <YesNoCard
          selectedValue={record.discussedWithFamily || ''}
          onClick={(v) => onUpdate({ discussedWithFamily: v as LegacyIntentRecord['discussedWithFamily'] })}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'somewhat', label: 'Somewhat' }, { value: 'no', label: 'No' }, { value: 'not_applicable', label: 'Not applicable' }]}
        />
      </div>

      {(record.discussedWithFamily === 'yes' || record.discussedWithFamily === 'somewhat') && (
        <div>
          <label className={labelClass}>Is there anything about those conversations someone should know?</label>
          <textarea value={record.discussionNotes || ''} onChange={(e) => onUpdate({ discussionNotes: e.target.value })} rows={3} className={inputClass} placeholder="Optional — note any important context from these conversations" />
        </div>
      )}

      {(record.discussedWithFamily === 'no' || record.discussedWithFamily === 'somewhat') && isIndivisibleAsset(record) && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          This asset may involve multiple people. Consider having these conversations to avoid future misunderstandings.
        </div>
      )}
    </div>
  );
}

// ─── Documentation Step ───────────────────────────────────────────────────

function DocumentationStep({
  record,
  onUpdate,
  assetName,
}: {
  record: LegacyIntentRecord;
  onUpdate: (u: Partial<LegacyIntentRecord>) => void;
  assetName: string;
}) {
  return (
    <div className="space-y-5">
      <StepTitle title="Documentation Check" icon={<FileText className="w-5 h-5" />} />
      <div>
        <label className={labelClass}>
          Do you believe these intentions for {assetName} are currently reflected in your Will or other estate-planning documents?
        </label>
        <p className={subtleTextClass}>
          This captures your understanding only. We do not interpret your Will or tell you whether your documents accomplish this.
        </p>
        <YesNoCard
          selectedValue={record.reflectedInEstateDocuments || ''}
          onClick={(v) => onUpdate({ reflectedInEstateDocuments: v as LegacyIntentRecord['reflectedInEstateDocuments'] })}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: "I'm not sure" }, { value: 'not_discussed', label: "We haven't discussed this with our lawyer" }]}
        />
      </div>

      {(record.reflectedInEstateDocuments === 'no' || record.reflectedInEstateDocuments === 'not_sure' || record.reflectedInEstateDocuments === 'not_discussed') && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-sm text-amber-300">
          <p>A review flag has been created. Consider discussing your intentions for {assetName} with your estate-planning lawyer.</p>
        </div>
      )}
    </div>
  );
}

// ─── Business Branch Step ─────────────────────────────────────────────────

function BusinessBranchStep({
  record,
  onUpdate,
  assetName,
  client1Name,
  client2Name,
  people,
  accountants,
  lawyers,
  financialAdvisors,
  insuranceAdvisors,
  allAnswers,
}: {
  record: LegacyIntentRecord;
  onUpdate: (u: Partial<BusinessOwnerBranch>) => void;
  assetName: string;
  client1Name: string;
  client2Name: string;
  people: LegacyPerson[];
  accountants: ProfessionalAdvisor[];
  lawyers: ProfessionalAdvisor[];
  financialAdvisors: ProfessionalAdvisor[];
  insuranceAdvisors: ProfessionalAdvisor[];
  allAnswers: Map<string, Record<string, unknown>>;
}) {
  const branch = record.businessBranch || {
    ownershipSuccession: 'not_sure',
    ownershipSuccessionRecipients: [],
    managementSuccession: 'not_sure',
    shareholderAgreementConsistent: 'not_sure',
    postMortemFlexibility: 'not_sure',
    postMortemConsidered: 'not_sure',
    hasPlanningDocuments: 'not_sure',
    professionalContactIds: [],
    businessDiscussedWithFamily: 'not_applicable',
    successorHasDiscussed: 'not_sure',
  };

  const corpData = useMemo(() => {
    if (record.asset.assetSourceSectionId !== 'corporations') return null;
    const corps = (allAnswers.get('corporations')?.['corporationsData'] as Array<Record<string, unknown>>) || [];
    const corpIdx = parseInt(record.asset.assetId.replace('corp_', ''), 10);
    return corps[corpIdx] || null;
  }, [record.asset, allAnswers]);

  const shareholders = useMemo(() => corpData ? getCorporationShareholders(corpData) : [], [corpData]);
  const keyPeople = useMemo(() => corpData ? getCorporationKeyPeople(corpData) : [], [corpData]);
  const hasShareholderAgreement = corpData?.hasShareholderAgreement === 'yes';
  const shareholderAgreementLocation = corpData?.shareholderAgreementLocation as string || '';
  const minuteBookLocation = corpData?.minuteBookLocation as string || '';

  const ownerName = record.asset.ownership === 'client2' ? client2Name : client1Name;

  const ownershipOutcomes = [
    { value: 'spouse_becomes_owner', label: 'Surviving spouse/partner becomes owner' },
    { value: 'children_become_owners', label: 'Child/children become owners' },
    { value: 'specific_family_member', label: 'Specific family member becomes owner' },
    { value: 'existing_shareholders_acquire', label: 'Existing shareholder(s) acquire the shares' },
    { value: 'management_employees_acquire', label: 'Management/employees acquire the business' },
    { value: 'business_sold', label: 'Business is sold' },
    { value: 'business_wound_down', label: 'Business is wound down' },
    { value: 'follow_shareholder_agreement', label: 'Follow the shareholder agreement / buy-sell arrangement' },
    { value: 'other', label: 'Other' },
    { value: 'not_sure', label: "I'm not sure" },
  ];

  const managementOptions = [
    { value: 'existing_shareholder', label: 'Existing shareholder' },
    { value: 'existing_manager', label: 'Existing manager / key employee' },
    { value: 'spouse_partner', label: 'Spouse / partner' },
    { value: 'child_family', label: 'Child / family member' },
    { value: 'professional_external', label: 'Professional / external manager' },
    { value: 'business_should_not_continue', label: 'Business should not continue operating' },
    { value: 'other', label: 'Other' },
    { value: 'not_sure', label: "I'm not sure" },
  ];

  const allProfessionals = [...accountants, ...lawyers, ...financialAdvisors, ...insuranceAdvisors];
  const needsRecipients = ['specific_family_member', 'children_become_owners'].includes(branch.ownershipSuccession);

  return (
    <div className="space-y-6">
      <StepTitle title="Business Succession Planning" icon={<Building2 className="w-5 h-5" />} />

      {/* Ownership succession */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Ownership Succession</h4>
        <div>
          <label className={labelClass}>If {ownerName} dies, what would you ideally like to happen to {assetName}?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
            {ownershipOutcomes.map((o) => (
              <OptionButton key={o.value} label={o.label} selected={branch.ownershipSuccession === o.value} onClick={() => onUpdate({ ownershipSuccession: o.value, ownershipSuccessionRecipients: [] })} />
            ))}
          </div>
        </div>

        {needsRecipients && (
          <div>
            <label className={labelClass}>Who would become the owner(s)?</label>
            <PersonPicker
              people={people}
              selectedIds={branch.ownershipSuccessionRecipients.map((r) => r.personId || '')}
              onToggle={(pid, name) => onUpdate({ ownershipSuccessionRecipients: updateRecipients(branch.ownershipSuccessionRecipients, pid, name) })}
              onAddOther={(name) => onUpdate({ ownershipSuccessionRecipients: [...branch.ownershipSuccessionRecipients, { personName: name }] })}
            />
          </div>
        )}
      </div>

      {/* Management succession */}
      <div className="space-y-4 pt-4 border-t border-gray-700">
        <h4 className="text-lg font-semibold text-white">Management Succession</h4>
        <p className={subtleTextClass}>
          The person receiving the economic value of the business may not be the person who should operate it.
        </p>
        <div>
          <label className={labelClass}>If {ownerName} were to die, who would you ideally want to take the lead in running or managing {assetName} immediately afterward?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
            {managementOptions.map((o) => (
              <OptionButton key={o.value} label={o.label} selected={branch.managementSuccession === o.value} onClick={() => onUpdate({ managementSuccession: o.value, managementSuccessionPersonId: undefined, managementSuccessionPersonName: undefined })} />
            ))}
          </div>
        </div>

        {(branch.managementSuccession === 'existing_manager' || branch.managementSuccession === 'existing_shareholder') && keyPeople.length > 0 && (
          <div>
            <label className={labelClass}>Select from people already identified for {assetName}:</label>
            <div className="space-y-2 mt-2">
              {keyPeople.map((p) => (
                <OptionButton key={p.id} label={`${p.name} (${p.role})`} selected={branch.managementSuccessionPersonId === p.id} onClick={() => onUpdate({ managementSuccessionPersonId: p.id, managementSuccessionPersonName: p.name })} />
              ))}
            </div>
          </div>
        )}

        {branch.managementSuccession === 'child_family' && (
          <div>
            <label className={labelClass}>Which family member?</label>
            <PersonPicker
              people={people}
              selectedIds={branch.managementSuccessionPersonId ? [branch.managementSuccessionPersonId] : []}
              onToggle={(pid, name) => onUpdate({ managementSuccessionPersonId: pid, managementSuccessionPersonName: name })}
            />
          </div>
        )}
      </div>

      {/* Shareholder agreement cross-reference */}
      {hasShareholderAgreement && (
        <div className="space-y-4 pt-4 border-t border-gray-700">
          <h4 className="text-lg font-semibold text-white">Shareholder Agreement</h4>
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              Earlier, you told us that {assetName} has a shareholder agreement.
            </p>
            {shareholderAgreementLocation && (
              <p className="text-xs text-gray-400 mt-1">Location: {shareholderAgreementLocation}</p>
            )}
            {minuteBookLocation && (
              <p className="text-xs text-gray-400">Minute book: {minuteBookLocation}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Do you believe your intentions for the business are consistent with the shareholder agreement?</label>
            <YesNoCard
              selectedValue={branch.shareholderAgreementConsistent}
              onClick={(v) => onUpdate({ shareholderAgreementConsistent: v as BusinessOwnerBranch['shareholderAgreementConsistent'] })}
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: "I'm not sure" }, { value: 'not_discussed', label: "I haven't discussed this with my lawyer" }]}
            />
          </div>
        </div>
      )}

      {/* Post-mortem planning */}
      <div className="space-y-4 pt-4 border-t border-gray-700">
        <h4 className="text-lg font-semibold text-white">Post-Mortem Planning Readiness</h4>
        <div>
          <label className={labelClass}>
            To your knowledge, does your Will give your Estate Trustee enough flexibility to work with your lawyer and accountant on tax and corporate planning after your death?
          </label>
          <p className={subtleTextClass}>
            Private-company shares can require important tax and corporate decisions after death. This question helps identify whether further discussion with your professional team may be worthwhile.
          </p>
          <YesNoCard
            selectedValue={branch.postMortemFlexibility}
            onClick={(v) => onUpdate({ postMortemFlexibility: v as BusinessOwnerBranch['postMortemFlexibility'] })}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: "I'm not sure" }, { value: 'not_discussed', label: "This hasn't been discussed with my lawyer/accountant" }]}
          />
        </div>

        <div>
          <label className={labelClass}>Do you know whether post-mortem planning for your private-company shares was specifically considered when your Will was prepared?</label>
          <YesNoCard
            selectedValue={branch.postMortemConsidered}
            onClick={(v) => onUpdate({ postMortemConsidered: v as BusinessOwnerBranch['postMortemConsidered'] })}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: "I'm not sure" }]}
          />
        </div>

        <div>
          <label className={labelClass}>Are there any planning notes, memoranda, instructions or other documents relating to this?</label>
          <YesNoCard
            selectedValue={branch.hasPlanningDocuments}
            onClick={(v) => onUpdate({ hasPlanningDocuments: v as BusinessOwnerBranch['hasPlanningDocuments'] })}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: "I'm not sure" }]}
          />
        </div>

        {branch.hasPlanningDocuments === 'yes' && (
          <div>
            <label className={labelClass}>Where can these documents be found?</label>
            <DocumentLocationPicker
              value={branch.planningDocumentLocation?.accessMethod || ''}
              otherValue={branch.planningDocumentLocation?.accessMethodOther}
              locationValue={branch.planningDocumentLocation?.location}
              locationOtherValue={branch.planningDocumentLocation?.locationOther}
              onAccessMethodChange={(v) => onUpdate({ planningDocumentLocation: { ...(branch.planningDocumentLocation || {}), accessMethod: v } })}
              onAccessMethodOtherChange={(v) => onUpdate({ planningDocumentLocation: { ...(branch.planningDocumentLocation || {}), accessMethodOther: v } })}
              onLocationChange={(v) => onUpdate({ planningDocumentLocation: { ...(branch.planningDocumentLocation || {}), location: v } })}
              onLocationOtherChange={(v) => onUpdate({ planningDocumentLocation: { ...(branch.planningDocumentLocation || {}), locationOther: v } })}
            />
          </div>
        )}
      </div>

      {/* Professionals to contact */}
      <div className="space-y-4 pt-4 border-t border-gray-700">
        <h4 className="text-lg font-semibold text-white">Professionals to Contact</h4>
        <label className={labelClass}>Who should your Estate Trustee contact about the business and post-mortem planning?</label>
        {allProfessionals.length > 0 ? (
          <div className="space-y-2">
            {allProfessionals.map((a) => (
              <OptionButton
                key={a.id}
                label={`${a.name}${a.firm ? ` — ${a.firm}` : ''} (${a.type})`}
                selected={branch.professionalContactIds.includes(a.id)}
                onClick={() => onUpdate({ professionalContactIds: branch.professionalContactIds.includes(a.id) ? branch.professionalContactIds.filter((id) => id !== a.id) : [...branch.professionalContactIds, a.id] })}
              />
            ))}
          </div>
        ) : (
          <p className={subtleTextClass}>No professionals have been entered in your Professional Team yet.</p>
        )}
      </div>

      {/* Business succession family discussion */}
      <div className="space-y-4 pt-4 border-t border-gray-700">
        <h4 className="text-lg font-semibold text-white">Family Discussion</h4>
        <div>
          <label className={labelClass}>Have the people involved been told what you would ideally like to happen to {assetName}?</label>
          <YesNoCard
            selectedValue={branch.businessDiscussedWithFamily}
            onClick={(v) => onUpdate({ businessDiscussedWithFamily: v as BusinessOwnerBranch['businessDiscussedWithFamily'] })}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'somewhat', label: 'Somewhat' }, { value: 'no', label: 'No' }, { value: 'not_applicable', label: 'Not applicable' }]}
          />
        </div>

        {branch.managementSuccession !== 'not_sure' && branch.managementSuccession !== 'business_should_not_continue' && (
          <div>
            <label className={labelClass}>
              Has the person you would want to run the business agreed to or discussed this role?
            </label>
            <YesNoCard
              selectedValue={branch.successorHasDiscussed}
              onClick={(v) => onUpdate({ successorHasDiscussed: v as BusinessOwnerBranch['successorHasDiscussed'] })}
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_yet', label: 'Not yet' }, { value: 'not_sure', label: "I'm not sure" }]}
            />
          </div>
        )}
      </div>

      {/* Already-identified documents */}
      {(hasShareholderAgreement || minuteBookLocation) && (
        <div className="space-y-3 pt-4 border-t border-gray-700">
          <h4 className="text-lg font-semibold text-white">Already Identified Documents</h4>
          {hasShareholderAgreement && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-sm text-white">Shareholder Agreement</p>
              <p className="text-xs text-green-400">Already identified</p>
              {shareholderAgreementLocation && <p className="text-xs text-gray-400 mt-1">Location: {shareholderAgreementLocation}</p>}
            </div>
          )}
          {minuteBookLocation && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-sm text-white">Minute Book</p>
              <p className="text-xs text-green-400">Already identified</p>
              <p className="text-xs text-gray-400 mt-1">Location: {minuteBookLocation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Summary Step ─────────────────────────────────────────────────────────

function SummaryStep({ record, assetName }: { record: LegacyIntentRecord; assetName: string }) {
  const flags = generateReviewFlags(record);
  return (
    <div className="space-y-5">
      <StepTitle title={`Summary — ${assetName}`} icon={<CheckCircle2 className="w-5 h-5" />} />

      <div className="space-y-3">
        {record.firstDeath?.outcome && <SummaryRow label="First death" value={outcomeLabel(record.firstDeath.outcome)} recipients={record.firstDeath.recipients} />}
        {record.bothDeceased?.outcome && <SummaryRow label="If neither is living" value={outcomeLabel(record.bothDeceased.outcome)} recipients={record.bothDeceased.recipients} />}
        {record.noSurvivingDescendants?.outcome && <SummaryRow label="If no descendants survive" value={outcomeLabel(record.noSurvivingDescendants.outcome)} recipients={record.noSurvivingDescendants.recipients} />}
        {record.stayInFamilyIntent && <SummaryRow label="Stay in family" value={record.stayInFamilyIntent === 'yes' ? 'Yes' : 'No / Not sure'} />}
        {record.equalizationIntent && <SummaryRow label="Equalization important" value={record.equalizationIntent === 'yes' ? 'Yes' : 'No / Not sure'} />}
        {record.discussedWithFamily && <SummaryRow label="Discussed with family" value={record.discussedWithFamily === 'yes' ? 'Yes' : record.discussedWithFamily === 'somewhat' ? 'Somewhat' : 'No / N/A'} />}
        {record.reflectedInEstateDocuments && <SummaryRow label="In estate documents" value={docStatus(record.reflectedInEstateDocuments)} />}
        {record.asset.isBusiness && record.businessBranch && (
          <>
            <SummaryRow label="Ownership succession" value={outcomeLabel(record.businessBranch.ownershipSuccession)} />
            <SummaryRow label="Immediate management" value={record.businessBranch.managementSuccessionPersonName || outcomeLabel(record.businessBranch.managementSuccession)} />
            <SummaryRow label="Shareholder agreement" value={record.businessBranch.shareholderAgreementConsistent === 'yes' ? 'Consistent' : 'Not sure / Not discussed'} />
            <SummaryRow label="Post-mortem planning" value={record.businessBranch.postMortemConsidered === 'yes' ? 'Considered' : 'Not sure / No'} />
            <SummaryRow label="Professional contacts" value={record.businessBranch.professionalContactIds.length > 0 ? `${record.businessBranch.professionalContactIds.length} selected` : 'None selected'} />
          </>
        )}
      </div>

      {flags.length > 0 && (
        <div className="pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-amber-400 mb-2">Review Flags ({flags.length})</h4>
          <div className="space-y-2">
            {flags.map((f, i) => (
              <div key={i} className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-sm text-amber-300">
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <p className="text-xs text-blue-200/80">
          These are your intentions. They do not replace your Will or other legal documents.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, recipients }: { label: string; value: string; recipients?: RecipientRef[] }) {
  return (
    <div className="flex items-start justify-between text-sm border-b border-gray-700/50 pb-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-white text-right">
        {value}
        {recipients && recipients.length > 0 && (
          <span className="text-gray-400 text-xs block">{recipients.map((r) => r.personName + (r.share ? ` (${r.share})` : '')).join(', ')}</span>
        )}
      </span>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────

function StepTitle({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400">{icon}</div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
  );
}
