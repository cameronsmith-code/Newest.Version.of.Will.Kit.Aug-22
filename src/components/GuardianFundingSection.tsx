import { useState } from 'react';
import { HandHeart, Wallet, Home, Car, Briefcase, Heart, FileText, Users, MessageSquareHeart, HeartHandshake } from 'lucide-react';

type Props = {
  fundingData: Record<string, unknown>;
  onFundingChange: (field: string, value: string) => void;
  financialDecisionMakerLabels: { role: string; name: string }[];
  coordinationNeeded: boolean;
  childActivityNames: string[];
  professionalContacts: { id: string; name: string; role: string }[];
  minorChildNames: string[];
};

const OVERALL_APPROACH_OPTIONS = [
  { value: 'majorExpensesOnly', label: 'Mostly for larger child-specific expenses', description: 'We would generally expect the guardians to absorb ordinary incidental household costs, while the children\'s resources help with larger expenses, education, activities, healthcare and other significant needs.' },
  { value: 'shareIncrementalCosts', label: 'Share the added cost of raising them', description: 'We would want the children\'s resources used reasonably for both everyday and larger costs that come with adding them to the household.' },
  { value: 'generousHouseholdSupport', label: 'Use the resources generously to support the new household', description: 'We would not want taking in our children to create a financial burden for their guardians. Their resources should reasonably help the household adapt.' },
  { value: 'custom', label: 'We have a different approach' },
  { value: 'unsure', label: 'We\'re not sure yet' },
];

const EVERYDAY_OPTIONS = [
  { value: 'no_detailed_reimbursement', label: 'We would not expect detailed reimbursement for normal family life' },
  { value: 'reasonable_contribution', label: 'The children\'s resources can reasonably contribute to added household costs' },
  { value: 'child_specific_tracking', label: 'We would prefer more child-specific tracking' },
  { value: 'defer_to_trustee', label: 'We would defer to the trustee / professional requirements' },
  { value: 'other', label: 'Other' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const MEANINGFUL_OPTIONS = [
  { value: 'resources_help_cover', label: 'We would generally expect the children\'s resources to help cover these' },
  { value: 'when_guardian_cannot_absorb', label: 'Use the resources when the guardian cannot reasonably absorb the cost' },
  { value: 'discuss_larger_costs', label: 'Discuss larger costs with the person managing the money' },
  { value: 'another_approach', label: 'We have another approach' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const MAJOR_HOUSEHOLD_OPTIONS = [
  { value: 'strongly_want_considered', label: 'We would strongly want available resources considered' },
  { value: 'if_reasonably_necessary', label: 'Consider them if reasonably necessary' },
  { value: 'prefer_other_options', label: 'Prefer other options first' },
  { value: 'generally_not', label: 'We would generally prefer not to use the children\'s resources for this' },
  { value: 'depends_on_type', label: 'It depends on the type of expense' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const HOUSING_OPTIONS = [
  { value: 'stronglySupport', label: 'Strongly support it' },
  { value: 'considerIfNecessary', label: 'Consider it if reasonably necessary' },
  { value: 'preferOtherOptions', label: 'Prefer other options first' },
  { value: 'preferNot', label: 'Prefer not to use the children\'s resources for this' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const HOUSING_DISCUSSED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'I\'m not sure' },
  { value: 'want_professional_guidance', label: 'We\'d want professional guidance' },
];

const YES_POTENTIALLY_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'potentially', label: 'Potentially' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const LIFESTYLE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'not_necessarily', label: 'Not necessarily' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const SHARED_BENEFIT_OPTIONS = [
  { value: 'reasonable_shared_okay', label: 'Reasonable shared benefit is okay', description: 'We understand some spending for our children will naturally benefit the whole household. That does not concern us if the expense is reasonable and primarily helps the new family function.' },
  { value: 'identify_child_share', label: 'Prefer to identify the children\'s share where practical' },
  { value: 'depends_on_size', label: 'Depends on the size of the expense' },
  { value: 'discuss_major_first', label: 'Major shared expenses should be discussed first' },
  { value: 'other', label: 'Other' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const RECORD_KEEPING_OPTIONS = [
  { value: 'keep_simple', label: 'Keep it simple', description: 'We don\'t expect guardians to track every ordinary household expense.' },
  { value: 'track_meaningful', label: 'Track meaningful child-specific expenses', description: 'Ordinary family spending doesn\'t need detailed tracking, but larger child-specific expenses should be documented.' },
  { value: 'detailed_accounting', label: 'More detailed accounting', description: 'We would prefer clearer records of amounts being paid from the children\'s resources.' },
  { value: 'defer_to_trustee', label: 'Defer to trustee / professional requirements' },
  { value: 'other', label: 'Other' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const DECISION_MAKING_OPTIONS = [
  { value: 'guardian_led', label: 'Guardian-led, within reason', description: 'We generally trust the guardian\'s judgment about reasonable costs of raising the children and would want that judgment given significant weight.' },
  { value: 'collaborative', label: 'Collaborative', description: 'We would expect them to discuss meaningful expenses together and reach decisions collaboratively.' },
  { value: 'review_for_larger', label: 'More review for larger expenses', description: 'We would want ordinary needs handled with flexibility, but larger expenses should involve more review by the person managing the money.' },
  { value: 'different_approach', label: 'Different approach' },
  { value: 'unsure', label: 'We\'re not sure' },
];

const GUARDIAN_JUDGMENT_OPTIONS = [
  { value: 'significant_weight', label: 'Significant weight — they are living the children\'s needs every day' },
  { value: 'meaningful_weight', label: 'Meaningful weight, balanced with preserving the children\'s resources' },
  { value: 'depends_on_expense', label: 'It depends on the expense' },
  { value: 'describe_view', label: 'We\'d like to describe our view' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const GUARDIAN_SHOULD_UNDERSTAND_OPTIONS = [
  { value: 'resources_may_need_to_last', label: 'The resources may need to last for many years' },
  { value: 'future_education', label: 'Future education needs should be considered' },
  { value: 'disability_adulthood', label: 'Disability / support needs may continue into adulthood' },
  { value: 'large_requests_professional', label: 'Large requests may need professional advice' },
  { value: 'documentation_needed', label: 'Some expenses may require documentation' },
  { value: 'preserve_capital', label: 'Preserving part of the capital is important' },
  { value: 'use_generously_while_young', label: 'We generally want the resources used generously while the children are young' },
  { value: 'other', label: 'Other' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const FDM_SHOULD_UNDERSTAND_OPTIONS = [
  { value: 'sees_needs_every_day', label: 'The guardian sees the children\'s needs every day' },
  { value: 'household_costs_increase', label: 'Household costs will genuinely increase' },
  { value: 'not_perfectly_allocatable', label: 'Not every reasonable expense can be perfectly allocated to one child' },
  { value: 'not_disadvantaged', label: 'The guardians should not be financially disadvantaged for stepping in' },
  { value: 'need_flexibility', label: 'The guardians may need flexibility to respond quickly' },
  { value: 'guardian_family_circumstances', label: 'The guardians\' own family circumstances should be considered' },
  { value: 'other', label: 'Other' },
  { value: 'unsure', label: 'I\'m not sure' },
];

const DISCUSSION_REQUIRED_OPTIONS = [
  { value: 'private_school', label: 'Private school / major education decision' },
  { value: 'major_camp', label: 'Major camp or program' },
  { value: 'significant_healthcare', label: 'Significant healthcare / therapy cost' },
  { value: 'major_travel', label: 'Major travel' },
  { value: 'larger_vehicle', label: 'Larger vehicle' },
  { value: 'home_renovation', label: 'Home renovation' },
  { value: 'larger_home', label: 'Larger home' },
  { value: 'additional_childcare', label: 'Additional childcare / household help' },
  { value: 'guardian_reducing_work', label: 'Guardian reducing work / lost income' },
  { value: 'accessibility_modification', label: 'Accessibility modification' },
  { value: 'other_major_purchase', label: 'Other major purchase' },
  { value: 'other', label: 'Other' },
];

const DISAGREEMENT_OPTIONS = [
  { value: 'talk_it_through', label: 'Talk it through first', description: 'We would want them to understand each other\'s concerns and try to reach agreement.' },
  { value: 'bring_in_professional', label: 'Bring in a trusted professional', description: 'We would want them to involve someone from our professional team before the disagreement becomes personal.' },
  { value: 'specific_sounding_board', label: 'Use a specific person as a sounding board' },
  { value: 'another_approach', label: 'Another approach' },
  { value: 'unsure', label: 'We\'re not sure' },
];

function OptionCard({ value, current, onChange, label, description }: {
  value: string; current: string | undefined; onChange: (v: string) => void;
  label: string; description?: string;
}) {
  const selected = current === value;
  return (
    <label
      className={`block p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'border-blue-400 bg-blue-500/15' : 'border-gray-600 bg-gray-700/40 hover:border-gray-500'}`}
    >
      <div className="flex items-start gap-3">
        <input type="radio" checked={selected} onChange={() => onChange(value)} className="mt-1 accent-blue-400" />
        <div>
          <span className={`text-sm font-medium ${selected ? 'text-blue-200' : 'text-gray-200'}`}>{label}</span>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
      </div>
    </label>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700 p-5 space-y-3">
      <div className="flex items-center gap-2 text-blue-300">
        {icon}
        <h4 className="text-sm font-semibold uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function GuardianFundingSection({
  fundingData,
  onFundingChange,
  financialDecisionMakerLabels,
  coordinationNeeded,
  childActivityNames,
  professionalContacts,
  minorChildNames,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const fdmNames = financialDecisionMakerLabels.map(f => f.name).filter(Boolean).join(' and ');
  const childLabel = minorChildNames.length > 1 ? minorChildNames.join(' and ') : minorChildNames[0] || 'the children';

  const get = (field: string): string | undefined => {
    const v = fundingData[field];
    return v ? String(v) : undefined;
  };

  const getList = (field: string): string[] => {
    const v = fundingData[field];
    if (!v) return [];
    return typeof v === 'string' ? v.split(',').filter(Boolean) : Array.isArray(v) ? v.map(String) : [];
  };

  const toggleListItem = (field: string, value: string) => {
    const current = getList(field);
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFundingChange(field, next.join(','));
  };

  if (!expanded) {
    return (
      <div className="bg-gradient-to-br from-blue-900/30 to-gray-800/30 rounded-xl border border-blue-700/30 p-6 mt-6">
        <div className="flex items-start gap-4">
          <HandHeart className="w-7 h-7 text-blue-300 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Supporting the people who step in</h3>
            <p className="text-sm text-gray-300 mt-2">
              Taking in a child changes more than a household's routine. It can affect groceries, activities, childcare, transportation, housing, work and the everyday cost of family life.
            </p>
            <p className="text-sm text-gray-300 mt-2">
              We'd like to understand how you would want the resources you've left behind to support both your children and the people caring for them.
            </p>
            <p className="text-xs text-gray-400 mt-3 italic">
              These answers do not replace the terms of your Will or trust. They help explain the philosophy behind your plan and identify anything that may be worth confirming with your estate lawyer.
            </p>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Tell us your approach
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-gray-800/30 rounded-xl border border-blue-700/30 p-6 mt-6 space-y-6">
      <div className="flex items-start gap-4">
        <HandHeart className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Supporting the people who step in</h3>
          <p className="text-xs text-gray-400 mt-1 italic">
            These answers do not replace the terms of your Will or trust. They help explain the philosophy behind your plan.
          </p>
        </div>
        <button type="button" onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-gray-200">Collapse</button>
      </div>

      <SectionCard icon={<Wallet className="w-4 h-4" />} title={`How would you want your guardians to think about using the resources you've left for ${childLabel}?`}>
        <div className="space-y-2">
          {OVERALL_APPROACH_OPTIONS.map(o => (
            <OptionCard key={o.value} value={o.value} current={get('overallApproach')} onChange={v => onFundingChange('overallApproach', v)} label={o.label} description={o.description} />
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={<Wallet className="w-4 h-4" />} title="Everyday household life">
        <p className="text-xs text-gray-400 mb-2">Groceries, pizza, utilities, local outings, ordinary transportation, basic clothing, normal family life.</p>
        <p className="text-sm text-gray-300 mb-2">How would you want ordinary household costs involving {childLabel} to be handled?</p>
        <div className="space-y-2">
          {EVERYDAY_OPTIONS.map(o => (
            <OptionCard key={o.value} value={o.value} current={get('everydayExpenseApproach')} onChange={v => onFundingChange('everydayExpenseApproach', v)} label={o.label} />
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={<Wallet className="w-4 h-4" />} title="Meaningful child-specific costs">
        <p className="text-xs text-gray-400 mb-2">Sports, camp, lessons, tutoring, school costs, therapy, healthcare, travel to maintain important relationships.</p>
        <p className="text-sm text-gray-300 mb-2">How would you want meaningful child-specific expenses to be handled?</p>
        <div className="space-y-2">
          {MEANINGFUL_OPTIONS.map(o => (
            <OptionCard key={o.value} value={o.value} current={get('meaningfulExpenseApproach')} onChange={v => onFundingChange('meaningfulExpenseApproach', v)} label={o.label} />
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={<Home className="w-4 h-4" />} title="Household-changing costs">
        <p className="text-xs text-gray-400 mb-2">Larger home, renovation, larger vehicle, childcare / household help, accessibility modifications, guardian reducing work, major relocation costs.</p>
        <p className="text-sm text-gray-300 mb-2">If caring for {childLabel} required a meaningful change to the guardian's household, how would you want those costs considered?</p>
        <div className="space-y-2">
          {MAJOR_HOUSEHOLD_OPTIONS.map(o => (
            <OptionCard key={o.value} value={o.value} current={get('majorHouseholdExpenseApproach')} onChange={v => onFundingChange('majorHouseholdExpenseApproach', v)} label={o.label} />
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={<Home className="w-4 h-4" />} title="If the guardians needed a larger home">
        <p className="text-sm text-gray-300 mb-2">If caring for {childLabel} meant the guardians reasonably needed a larger home or significant renovation, how would you feel about resources left for the children helping make that possible?</p>
        <div className="space-y-2">
          {HOUSING_OPTIONS.map(o => (
            <OptionCard key={o.value} value={o.value} current={get('housingPreference')} onChange={v => onFundingChange('housingPreference', v)} label={o.label} />
          ))}
        </div>
        {get('housingPreference') && get('housingPreference') !== 'preferNot' && get('housingPreference') !== 'unsure' && (
          <div className="mt-3">
            <label className="block text-sm text-gray-300 mb-2">Have you discussed how you would want a major contribution toward a guardian-owned home to be structured or documented?</label>
            <div className="flex flex-wrap gap-3">
              {HOUSING_DISCUSSED_OPTIONS.map(o => (
                <label key={o.value} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${get('housingStructureDiscussed') === o.value ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                  <input type="radio" name="housingDiscussed" checked={get('housingStructureDiscussed') === o.value} onChange={() => onFundingChange('housingStructureDiscussed', o.value)} className="hidden" />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard icon={<Car className="w-4 h-4" />} title="Vehicle">
        <p className="text-sm text-gray-300 mb-2">If adding {childLabel} meant the household reasonably needed a larger vehicle, would you be comfortable with available resources contributing toward that cost?</p>
        <div className="flex flex-wrap gap-3">
          {YES_POTENTIALLY_NO.map(o => (
            <label key={o.value} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${get('vehiclePreference') === o.value ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
              <input type="radio" name="vehiclePref" checked={get('vehiclePreference') === o.value} onChange={() => onFundingChange('vehiclePreference', o.value)} className="hidden" />
              {o.label}
            </label>
          ))}
        </div>
        <input type="text" value={get('vehicleNotes') || ''} onChange={e => onFundingChange('vehicleNotes', e.target.value)} placeholder="Optional notes" className="mt-3 w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm" />
      </SectionCard>

      <SectionCard icon={<Briefcase className="w-4 h-4" />} title="Guardian work / income sacrifice">
        <p className="text-sm text-gray-300 mb-2">If caring for {childLabel} required a guardian to reduce work, take a leave, arrange additional childcare or make another meaningful financial sacrifice, would you want available resources to help offset that impact?</p>
        <div className="flex flex-wrap gap-3">
          {YES_POTENTIALLY_NO.map(o => (
            <label key={o.value} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${get('workReductionPreference') === o.value ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
              <input type="radio" name="workReduction" checked={get('workReductionPreference') === o.value} onChange={() => onFundingChange('workReductionPreference', o.value)} className="hidden" />
              {o.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 italic">For example: We don't want you putting your own family's financial security at risk because you feel uncomfortable asking for help.</p>
        <textarea value={get('workReductionNotes') || ''} onChange={e => onFundingChange('workReductionNotes', e.target.value)} placeholder="What would you want the guardian to understand about this?" rows={2} className="mt-3 w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm" />
      </SectionCard>

      <SectionCard icon={<Users className="w-4 h-4" />} title="Household help / childcare">
        <p className="text-sm text-gray-300 mb-2">Would you be comfortable with the children's resources being used for additional childcare or household help if taking in {childLabel} made that reasonably necessary?</p>
        <div className="flex flex-wrap gap-3">
          {YES_POTENTIALLY_NO.map(o => (
            <label key={o.value} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${get('householdHelpPreference') === o.value ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
              <input type="radio" name="householdHelp" checked={get('householdHelpPreference') === o.value} onChange={() => onFundingChange('householdHelpPreference', o.value)} className="hidden" />
              {o.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Examples: childcare, babysitting, respite, housekeeping, meal support, transportation help.</p>
      </SectionCard>

      {childActivityNames.length > 0 && (
        <SectionCard icon={<Heart className="w-4 h-4" />} title="Keeping important parts of their lives going">
          <p className="text-sm text-gray-300 mb-2">Is it important to you that the resources you leave help {childLabel} maintain important activities, supports and opportunities they have today?</p>
          <div className="flex flex-wrap gap-3 mb-3">
            {LIFESTYLE_OPTIONS.map(o => (
              <label key={o.value} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${get('lifestyleImportance') === o.value ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                <input type="radio" name="lifestyleImp" checked={get('lifestyleImportance') === o.value} onChange={() => onFundingChange('lifestyleImportance', o.value)} className="hidden" />
                {o.label}
              </label>
            ))}
          </div>
          {(get('lifestyleImportance') === 'yes' || get('lifestyleImportance') === 'mostly') && (
            <div>
              <p className="text-sm text-gray-300 mb-2">Which of these would you especially want the children's resources to help preserve if the guardians could not reasonably fund them themselves?</p>
              <div className="flex flex-wrap gap-2">
                {childActivityNames.map(name => {
                  const id = `activity_${name.replace(/\s+/g, '_').toLowerCase()}`;
                  const selected = getList('importantLifestyleSupportIds').includes(id);
                  return (
                    <label key={id} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${selected ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleListItem('importantLifestyleSupportIds', id)} className="hidden" />
                      {name}
                    </label>
                  );
                })}
                <label className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${getList('importantLifestyleSupportIds').includes('travel_relationships') ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                  <input type="checkbox" checked={getList('importantLifestyleSupportIds').includes('travel_relationships')} onChange={() => toggleListItem('importantLifestyleSupportIds', 'travel_relationships')} className="hidden" />
                  Travel to maintain relationships
                </label>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard icon={<Users className="w-4 h-4" />} title="When an expense benefits the whole household">
        <p className="text-sm text-gray-300 mb-2">Some expenses may benefit everyone in the guardian's household — for example, a larger home, family vacation, vehicle or shared activity. How would you want the guardian and the person managing the money to think about those costs?</p>
        <div className="space-y-2">
          {SHARED_BENEFIT_OPTIONS.map(o => (
            <OptionCard key={o.value} value={o.value} current={get('sharedHouseholdBenefitPhilosophy')} onChange={v => onFundingChange('sharedHouseholdBenefitPhilosophy', v)} label={o.label} description={o.description} />
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={<Users className="w-4 h-4" />} title="Fairness to the guardians' own children">
        <p className="text-sm text-gray-300 mb-2">If the guardians have children of their own, is there anything you would want them to understand about balancing opportunities among all the children in the household?</p>
        <p className="text-xs text-gray-400 mb-2 italic">For example, vacations, camps, activities or experiences where treating the children very differently could create tension in the new family.</p>
        <textarea value={get('guardianOwnChildrenFairnessNotes') || ''} onChange={e => onFundingChange('guardianOwnChildrenFairnessNotes', e.target.value)} placeholder="Optional" rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm" />
      </SectionCard>

      <SectionCard icon={<FileText className="w-4 h-4" />} title="How much tracking would you expect?">
        <p className="text-sm text-gray-300 mb-2">How much documentation would you expect for routine spending on {childLabel}?</p>
        <div className="space-y-2">
          {RECORD_KEEPING_OPTIONS.map(o => (
            <OptionCard key={o.value} value={o.value} current={get('recordKeepingPreference')} onChange={v => onFundingChange('recordKeepingPreference', v)} label={o.label} description={o.description} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 italic">Think about everyday groceries and family meals versus tuition, camps, therapy, travel or major purchases.</p>
      </SectionCard>

      {coordinationNeeded && (
        <SectionCard icon={<HeartHandshake className="w-4 h-4" />} title="Working together for the children">
          <p className="text-sm text-gray-300 mb-3">
            The people caring for {childLabel} every day may be different from the people managing the money available for them. That can provide useful checks and balances, but it works best when everyone understands the role they were trusted to play.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">When the guardian and the person managing the children's money are different people, how would you want them to approach spending decisions?</label>
              <div className="space-y-2">
                {DECISION_MAKING_OPTIONS.map(o => (
                  <OptionCard key={o.value} value={o.value} current={get('decisionMakingApproach')} onChange={v => onFundingChange('decisionMakingApproach', v)} label={o.label} description={o.description} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">When considering a reasonable request from the guardian, how much weight would you want the person managing the money to give to the guardian's day-to-day understanding of the children's needs?</label>
              <div className="space-y-2">
                {GUARDIAN_JUDGMENT_OPTIONS.map(o => (
                  <OptionCard key={o.value} value={o.value} current={get('guardianJudgmentWeight')} onChange={v => onFundingChange('guardianJudgmentWeight', v)} label={o.label} />
                ))}
              </div>
              {(get('guardianJudgmentWeight') === 'describe_view' || get('guardianJudgmentWeight') === 'depends_on_expense') && (
                <textarea value={get('guardianJudgmentNotes') || ''} onChange={e => onFundingChange('guardianJudgmentNotes', e.target.value)} placeholder="Describe your view" rows={2} className="mt-2 w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm" />
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">What would you want the guardian to understand about the responsibility of the person managing the children's money?</label>
              <div className="flex flex-wrap gap-2">
                {GUARDIAN_SHOULD_UNDERSTAND_OPTIONS.map(o => {
                  const selected = getList('guardianShouldUnderstand').includes(o.value);
                  return (
                    <label key={o.value} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${selected ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleListItem('guardianShouldUnderstand', o.value)} className="hidden" />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">What would you want the person managing the money to understand about the guardian's role?</label>
              <div className="flex flex-wrap gap-2">
                {FDM_SHOULD_UNDERSTAND_OPTIONS.map(o => {
                  const selected = getList('financialDecisionMakerShouldUnderstand').includes(o.value);
                  return (
                    <label key={o.value} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${selected ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleListItem('financialDecisionMakerShouldUnderstand', o.value)} className="hidden" />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Which kinds of decisions would you generally expect the guardian and the person managing the money to discuss together before committing significant resources?</label>
              <div className="flex flex-wrap gap-2">
                {DISCUSSION_REQUIRED_OPTIONS.map(o => {
                  const selected = getList('discussionRequiredFor').includes(o.value);
                  return (
                    <label key={o.value} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${selected ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleListItem('discussionRequiredFor', o.value)} className="hidden" />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Would you like to identify a dollar amount above which you would generally expect a conversation?</label>
              <div className="flex gap-3 mb-2">
                <label className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${get('hasDiscussionThreshold') === 'no' ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300'}`}>
                  <input type="radio" name="threshold" checked={get('hasDiscussionThreshold') === 'no'} onChange={() => onFundingChange('hasDiscussionThreshold', 'no')} className="hidden" />
                  No
                </label>
                <label className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${get('hasDiscussionThreshold') === 'yes' ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300'}`}>
                  <input type="radio" name="threshold" checked={get('hasDiscussionThreshold') === 'yes'} onChange={() => onFundingChange('hasDiscussionThreshold', 'yes')} className="hidden" />
                  Yes
                </label>
              </div>
              {get('hasDiscussionThreshold') === 'yes' && (
                <input type="number" value={get('discussionThresholdAmount') || ''} onChange={e => onFundingChange('discussionThresholdAmount', e.target.value)} placeholder="Amount" className="px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm w-40" />
              )}
              <p className="text-xs text-gray-400 mt-1 italic">This is a parent preference, not a legal authority threshold.</p>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">If the guardian and the person managing the children's money disagree about a significant expense, how would you hope they work through it?</label>
              <div className="space-y-2">
                {DISAGREEMENT_OPTIONS.map(o => {
                  const selected = getList('disagreementApproach').includes(o.value);
                  return (
                    <label key={o.value} className={`block p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'border-blue-400 bg-blue-500/15' : 'border-gray-600 bg-gray-700/40 hover:border-gray-500'}`}>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={selected} onChange={() => toggleListItem('disagreementApproach', o.value)} className="mt-1 accent-blue-400" />
                        <div>
                          <span className={`text-sm font-medium ${selected ? 'text-blue-200' : 'text-gray-200'}`}>{o.label}</span>
                          {o.description && <p className="text-xs text-gray-400 mt-1">{o.description}</p>}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Who would you want them to contact if they needed help thinking through a significant financial decision?</label>
              <div className="flex flex-wrap gap-2">
                {professionalContacts.map(c => {
                  const selected = getList('escalationPersonIds').includes(c.id);
                  return (
                    <label key={c.id} className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${selected ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-gray-600 text-gray-300 hover:border-gray-500'}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleListItem('escalationPersonIds', c.id)} className="hidden" />
                      {c.name} {c.role && `(${c.role})`}
                    </label>
                  );
                })}
              </div>
              {getList('escalationPersonIds').length > 0 && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-400 mb-1">Who would you want them to contact first?</label>
                  <select value={get('firstEscalationPersonId') || ''} onChange={e => onFundingChange('firstEscalationPersonId', e.target.value)} className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm">
                    <option value="">Select...</option>
                    {getList('escalationPersonIds').map(id => {
                      const contact = professionalContacts.find(c => c.id === id);
                      return <option key={id} value={id}>{contact?.name || id}</option>;
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard icon={<MessageSquareHeart className="w-4 h-4" />} title="What would you want them to remember?">
        <p className="text-sm text-gray-300 mb-2">If disagreements about money ever became frustrating, is there anything you would want them to remember about why you chose each person for their role?</p>
        <p className="text-xs text-gray-400 mb-2 italic">For example: what you trust about the guardian, what you trust about the trustee, or how you would want them to keep the focus on the children.</p>
        <textarea value={get('parentMessageAboutWorkingTogether') || ''} onChange={e => onFundingChange('parentMessageAboutWorkingTogether', e.target.value)} placeholder="Optional" rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm" />
      </SectionCard>

      <SectionCard icon={<MessageSquareHeart className="w-4 h-4" />} title="A message for your guardians">
        <p className="text-sm text-gray-300 mb-2">Is there anything you would want your guardians to hear directly from you about the financial side of taking in {childLabel}?</p>
        <p className="text-xs text-gray-400 mb-2 italic">For example: We chose you because we trust you, not because we expect you to finance our children's lives.</p>
        <textarea value={get('parentMessageToGuardian') || ''} onChange={e => onFundingChange('parentMessageToGuardian', e.target.value)} placeholder="Optional" rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm" />
      </SectionCard>

      <SectionCard icon={<MessageSquareHeart className="w-4 h-4" />} title={`A message for ${fdmNames ? fdmNames : 'the person managing the money'}`}>
        <p className="text-sm text-gray-300 mb-2">Is there anything you would want the person managing the children's money to hear directly from you?</p>
        <textarea value={get('parentMessageToFinancialDecisionMaker') || ''} onChange={e => onFundingChange('parentMessageToFinancialDecisionMaker', e.target.value)} placeholder="Optional" rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm" />
      </SectionCard>
    </div>
  );
}
