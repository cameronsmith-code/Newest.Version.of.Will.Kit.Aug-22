import { Users, School, Heart, MapPin, Pill, Activity, UserCheck, Lightbulb, Calendar } from 'lucide-react';
import type { PlanningPerson } from './ChildPlanningSection';

type Props = {
  childIndex: number;
  childData: Record<string, string>;
  childrenData: Array<Record<string, string>>;
  planningPersons: PlanningPerson[];
  minorIndices: number[];
  isDisabled: boolean;
  onChildChange: (index: number, field: string, value: string) => void;
  onChildMultiChange: (index: number, fields: Record<string, string>) => void;
};

const MOVE_OPTIONS = [
  { value: 'yes_most_likely', label: 'Yes, most likely' },
  { value: 'possibly', label: 'Possibly' },
  { value: 'no_remain_current', label: 'No, we would ideally want them to remain in their current community' },
  { value: 'not_decided', label: "We haven't decided" },
  { value: 'not_sure', label: "I'm not sure" },
];

const SCHOOL_CHANGE_OPTIONS = [
  { value: 'yes_most_likely', label: 'Yes, most likely' },
  { value: 'possibly', label: 'Possibly' },
  { value: 'no_stay_current', label: 'No, we would hope they could stay at their current school' },
  { value: 'not_sure', label: "I'm not sure" },
];

const HOUSEHOLD_MOVE_OPTIONS = [
  { value: 'yes_all', label: 'Yes, for all children' },
  { value: 'different_per_child', label: 'It may be different for each child' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "We're not sure" },
];

const ADULT_SIBLING_ROLE_OPTIONS = [
  { value: 'regular_sibling', label: 'Maintain regular contact and a close sibling relationship' },
  { value: 'emotional_support', label: 'Important emotional support' },
  { value: 'family_traditions', label: 'Help preserve family traditions and history' },
  { value: 'family_discussions', label: 'Participate in important family conversations' },
  { value: 'advocate', label: 'Advocate for sibling where appropriate' },
  { value: 'extended_family', label: 'Help maintain extended-family relationships' },
  { value: 'other', label: 'Other' },
];

const ADULT_SIBLING_NOT_RESPONSIBLE_OPTIONS = [
  { value: 'primary_caregiver', label: 'Becoming the primary caregiver' },
  { value: 'managing_finances', label: 'Managing finances' },
  { value: 'providing_housing', label: 'Providing housing' },
  { value: 'medical_decisions', label: 'Making medical decisions' },
  { value: 'career_sacrifice', label: 'Giving up their own career/family plans' },
  { value: 'other', label: 'Other' },
];

const inputClass = 'w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm';
const labelClass = 'block text-sm font-medium text-gray-300 mb-2';

function personName(planningPersons: PlanningPerson[], personId?: string): string {
  if (!personId) return '';
  const p = planningPersons.find(p => p.id === personId);
  return p?.name || '';
}

function parseJsonArray<T>(raw: string | undefined): T[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

export default function GuardianTransitionSection({
  childIndex,
  childData,
  childrenData,
  planningPersons,
  minorIndices,
  isDisabled,
  onChildChange,
  onChildMultiChange,
}: Props) {
  const childName = childData.nickname || childData.name || `Child ${childIndex + 1} (details to come)`;
  const guardianId = childData.guardianPersonId;
  const guardianPerson = planningPersons.find(p => p.id === guardianId);
  const guardianName = personName(planningPersons, guardianId) || 'the guardian';

  if (!guardianId || !guardianPerson) return null;

  const guardianLocation = [guardianPerson.city, guardianPerson.province, guardianPerson.country].filter(Boolean).join(', ');
  const childLocation = [childData.cityOfResidence, childData.provinceTerritory, childData.countryOfResidence || 'Canada'].filter(Boolean).join(', ');

  const moveExpected = childData.transitionMoveExpected;
  const showMoveQuestions = moveExpected === 'yes_most_likely' || moveExpected === 'possibly' || moveExpected === 'not_decided' || moveExpected === 'not_sure' || !moveExpected;

  // Household-level: check if other minors share the same guardian
  const siblingsWithSameGuardian = minorIndices
    .filter(i => i !== childIndex && childrenData[i]?.guardianPersonId === guardianId);

  const isHouseholdLead = siblingsWithSameGuardian.length > 0 && childIndex === Math.min(childIndex, ...siblingsWithSameGuardian);
  const householdMoveAnswer = childData.transitionHouseholdMoveExpected;

  const showPerChildMove = !isHouseholdLead || householdMoveAnswer === 'different_per_child' || !householdMoveAnswer;

  // School info
  const hasSchoolInfo = childData.attendingSchool === 'yes' && (childData.schoolName || childData.schoolAddress || childData.schoolPhone);
  const schoolChangeExpected = childData.transitionSchoolChangeExpected;
  const showSchoolTransition = hasSchoolInfo && (moveExpected === 'yes_most_likely' || moveExpected === 'possibly' || moveExpected === 'not_decided');
  const hasIEP = childData.hasIEP === 'yes';
  const hasEducationalSupports = hasIEP || childData.schoolExtraSupport || childData.individualEducationPlan || childData.additionalEducationDetails;

  // Healthcare providers from care coordinators
  const careCoordinatorCategories = (childData.careCoordinators || '').split(',').filter(Boolean);
  const healthcareProviders: Array<{ id: string; name: string; role: string }> = [];
  for (const cat of careCoordinatorCategories) {
    if (cat === 'family' || cat === 'sibling' || cat === 'parent1' || cat === 'parent2') continue;
    const count = parseInt(childData[`careCoord_${cat}_count`] || '0');
    for (let i = 0; i < count; i++) {
      const name = childData[`careCoord_${cat}_${i}_name`];
      const role = childData[`careCoord_${cat}_${i}_role`];
      if (name) healthcareProviders.push({ id: `${cat}_${i}`, name, role: role || cat });
    }
  }

  // Activities
  const activities = parseJsonArray<{ activityName: string; activityType: string; importanceLevel: string }>(childData.activityList);

  // Medications
  const hasMedications = childData.medications === 'yes' && childData.medicationList;

  // Disability supports
  const supportNeedTypes = (childData.supportNeedTypes || '').split(',').filter(Boolean);
  const disabilitySupports = childData.disabilitySupportsList || childData.disabilitySupports || '';
  const hasDisabilitySupports = isDisabled && (supportNeedTypes.length > 0 || disabilitySupports);

  // Transition support selections
  const transitionSupportSelections = (childData.transitionSupportSelections || '').split(',').filter(Boolean);
  const toggleSupportSelection = (id: string) => {
    const next = transitionSupportSelections.includes(id)
      ? transitionSupportSelections.filter(v => v !== id)
      : [...transitionSupportSelections, id];
    onChildChange(childIndex, 'transitionSupportSelections', next.join(','));
  };

  // Healthcare provider selections for transition
  const transitionProviderSelections = (childData.transitionProviderSelections || '').split(',').filter(Boolean);
  const toggleProviderSelection = (id: string) => {
    const next = transitionProviderSelections.includes(id)
      ? transitionProviderSelections.filter(v => v !== id)
      : [...transitionProviderSelections, id];
    onChildChange(childIndex, 'transitionProviderSelections', next.join(','));
  };

  // Activity selections
  const transitionActivitySelections = (childData.transitionActivitySelections || '').split(',').filter(Boolean);
  const toggleActivitySelection = (name: string) => {
    const next = transitionActivitySelections.includes(name)
      ? transitionActivitySelections.filter(v => v !== name)
      : [...transitionActivitySelections, name];
    onChildChange(childIndex, 'transitionActivitySelections', next.join(','));
  };

  // Important people selections
  const transitionPeopleSelections = (childData.transitionPeopleSelections || '').split(',').filter(Boolean);
  const togglePeopleSelection = (id: string) => {
    const next = transitionPeopleSelections.includes(id)
      ? transitionPeopleSelections.filter(v => v !== id)
      : [...transitionPeopleSelections, id];
    onChildChange(childIndex, 'transitionPeopleSelections', next.join(','));
  };

  // Important people from existing data
  const importantPeopleOptions: Array<{ id: string; name: string; relationship: string }> = [];
  // Siblings
  minorIndices.forEach(i => {
    if (i === childIndex) return;
    const sib = childrenData[i];
    const sibName = sib?.nickname || sib?.name || `Child ${i + 1} (details to come)`;
    importantPeopleOptions.push({ id: `sibling_${i}`, name: sibName, relationship: 'Sibling' });
  });
  // Adult independent children
  const allChildren = childrenData;
  allChildren.forEach((c, i) => {
    if (minorIndices.includes(i)) return;
    if (c.independent === 'yes') {
      const name = c.nickname || c.name || `Child ${i + 1} (details to come)`;
      importantPeopleOptions.push({ id: `adult_sib_${i}`, name, relationship: 'Adult sibling' });
    }
  });
  // Important adults from legacy child data (read-only compatibility)
  if (childData.importantAdults) {
    importantPeopleOptions.push({ id: 'important_adults', name: childData.importantAdults, relationship: 'Important adult(s)' });
  }
  // Friends and trusted adults from belongingConnections (authoritative source)
  try {
    const connections = JSON.parse(childData.belongingConnections || '[]') as Array<{ id: string; displayName: string; connectionType: string }>;
    connections.forEach(c => {
      if (c.displayName) {
        const rel = c.connectionType === 'friend' ? 'Friend'
          : c.connectionType === 'trusted_adult' ? 'Trusted adult'
          : c.connectionType === 'sibling' ? 'Sibling'
          : c.connectionType === 'grandparent' ? 'Grandparent'
          : c.connectionType === 'cousin' ? 'Cousin'
          : c.connectionType === 'other_family' ? 'Family'
          : 'Important person';
        importantPeopleOptions.push({ id: c.id || `conn_${c.displayName}`, name: c.displayName, relationship: rel });
      }
    });
  } catch { /* ignore parse errors */ }
  // Grandparents from planning persons
  planningPersons.forEach(p => {
    if (p.id === guardianId || p.id === childData.alternateGuardianPersonId) return;
    if (p.relationship.toLowerCase().includes('grandparent') || p.relationship.toLowerCase().includes('family friend') || p.relationship.toLowerCase().includes('cousin')) {
      importantPeopleOptions.push({ id: p.id, name: p.name, relationship: p.relationship });
    }
  });

  // First days items
  const firstDaysCount = parseInt(childData.transitionFirstDaysCount || '0');
  const setFirstDaysCount = (n: number) => {
    onChildChange(childIndex, 'transitionFirstDaysCount', String(n));
  };
  const updateFirstDaysItem = (i: number, value: string) => {
    onChildChange(childIndex, `transitionFirstDays_${i}`, value);
  };

  // Adult sibling logic
  const adultIndependentSiblings = allChildren
    .map((c, i) => ({ child: c, index: i }))
    .filter(({ index, child }) => !minorIndices.includes(index) && child.independent === 'yes');

  const sectionLabel = 'Guardian Transition & Continuity Planning';

  return (
    <div className="mt-6 pt-4 border-t border-blue-500/20">
      <h5 className="text-base font-semibold text-blue-400 flex items-center gap-2 mb-2">
        <MapPin size={18} />
        {sectionLabel}
      </h5>

      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-100 leading-relaxed">
          If {childName} needed to live with {guardianName}, there may be practical questions about school, healthcare, activities and other supports. These questions help us think through that transition — not to lock everything in place, but to help {guardianName} understand {childName}'s history, routines and needs.
        </p>
      </div>

      {/* Location context */}
      {(guardianLocation || childLocation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {childLocation && (
            <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{childName}'s current community</p>
              <p className="text-sm text-white">{childLocation}</p>
            </div>
          )}
          {guardianLocation && (
            <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{guardianName}'s community</p>
              <p className="text-sm text-white">{guardianLocation}</p>
            </div>
          )}
        </div>
      )}

      {/* Household-level move question */}
      {isHouseholdLead && (
        <div className="mb-4">
          <label className={labelClass}>
            If the children needed to live with {guardianName}, would you expect them to move to {guardianName}'s community?
          </label>
          <div className="flex flex-col gap-2">
            {HOUSEHOLD_MOVE_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`transitionHouseholdMove-${childIndex}`}
                  value={value}
                  checked={householdMoveAnswer === value}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'yes_all') {
                      onChildMultiChange(childIndex, {
                        transitionHouseholdMoveExpected: val,
                        transitionMoveExpected: 'yes_most_likely',
                      });
                      siblingsWithSameGuardian.forEach(sibIdx => {
                        onChildMultiChange(sibIdx, {
                          transitionHouseholdMoveExpected: val,
                          transitionMoveExpected: 'yes_most_likely',
                        });
                      });
                    } else if (val === 'no') {
                      onChildMultiChange(childIndex, {
                        transitionHouseholdMoveExpected: val,
                        transitionMoveExpected: 'no_remain_current',
                      });
                      siblingsWithSameGuardian.forEach(sibIdx => {
                        onChildMultiChange(sibIdx, {
                          transitionHouseholdMoveExpected: val,
                          transitionMoveExpected: 'no_remain_current',
                        });
                      });
                    } else if (val === 'not_sure') {
                      onChildMultiChange(childIndex, {
                        transitionHouseholdMoveExpected: val,
                        transitionMoveExpected: 'not_sure',
                      });
                      siblingsWithSameGuardian.forEach(sibIdx => {
                        onChildMultiChange(sibIdx, {
                          transitionHouseholdMoveExpected: val,
                          transitionMoveExpected: 'not_sure',
                        });
                      });
                    } else {
                      onChildMultiChange(childIndex, {
                        transitionHouseholdMoveExpected: val,
                        transitionMoveExpected: '',
                      });
                    }
                  }}
                  className="mr-1"
                />
                <span className="text-gray-300 text-sm">{label}</span>
              </label>
            ))}
          </div>
          {householdMoveAnswer === 'different_per_child' && (
            <p className="text-xs text-gray-400 mt-2">
              We'll ask about each child separately below.
            </p>
          )}
        </div>
      )}

      {/* Per-child move question */}
      {showPerChildMove && (
        <div className="mb-4">
          <label className={labelClass}>
            Would you expect {childName} to move to {guardianName}'s community?
          </label>
          <div className="flex flex-col gap-2">
            {MOVE_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`transitionMove-${childIndex}`}
                  value={value}
                  checked={moveExpected === value}
                  onChange={e => {
                    const val = e.target.value;
                    onChildMultiChange(childIndex, {
                      transitionMoveExpected: val,
                      transitionSchoolChangeExpected: '',
                      transitionHealthcareProviders: '',
                      transitionProviderSelections: '',
                      transitionSupportSelections: '',
                      transitionActivitySelections: '',
                      transitionPeopleSelections: '',
                    });
                  }}
                  className="mr-1"
                />
                <span className="text-gray-300 text-sm">{label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            We're asking because a move could mean changing schools, doctors, activities or other supports. Knowing what matters most can help make that transition easier.
          </p>
        </div>
      )}

      {/* School transition */}
      {showSchoolTransition && hasSchoolInfo && (
        <div className="mb-4 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <School size={16} />
            School & Learning
          </h6>

          <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current school</p>
            <p className="text-sm text-white font-medium">{childData.schoolName || 'School name not provided'}</p>
            {childData.schoolAddress && <p className="text-xs text-gray-400 mt-1">{childData.schoolAddress}</p>}
            {childData.schoolPhone && <p className="text-xs text-gray-400">{childData.schoolPhone}</p>}
          </div>

          <div className="mb-3">
            <label className={labelClass}>
              If {childName} moved to live with {guardianName}, would you expect them to change schools?
            </label>
            <div className="flex flex-col gap-2">
              {SCHOOL_CHANGE_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`transitionSchoolChange-${childIndex}`}
                    value={value}
                    checked={schoolChangeExpected === value}
                    onChange={e => onChildChange(childIndex, 'transitionSchoolChangeExpected', e.target.value)}
                    className="mr-1"
                  />
                  <span className="text-gray-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {(schoolChangeExpected === 'yes_most_likely' || schoolChangeExpected === 'possibly') && (
            <div className="space-y-3">
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                <p className="text-sm text-blue-100 leading-relaxed">
                  We'll include {childName}'s current school information in the Guardianship Roadmap so {guardianName} knows where to start when arranging a school transition. The current school may be able to help transfer academic records, report cards, accommodation information, learning plans and other information to the new school.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  Is there anything you would want a new school to understand about {childName} right away?
                </label>
                <textarea
                  value={childData.transitionNewSchoolNotes || ''}
                  onChange={e => onChildChange(childIndex, 'transitionNewSchoolNotes', e.target.value)}
                  placeholder="For example: learning style, academic strengths, areas where they need extra help, social considerations, accommodations, routines, communication needs or things that help them feel comfortable..."
                  className={inputClass}
                  rows={3}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Do you know where {childName}'s important school or learning records are kept?
                </label>
                <input
                  type="text"
                  value={childData.transitionEducationRecordLocation || ''}
                  onChange={e => onChildChange(childIndex, 'transitionEducationRecordLocation', e.target.value)}
                  placeholder="e.g., report cards, IEP, assessments, accommodation plans, psychoeducational assessments..."
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {schoolChangeExpected === 'no_stay_current' && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
              <p className="text-sm text-green-100 leading-relaxed">
                We'll note in the Guardianship Roadmap that staying at {childData.schoolName || 'their current school'} is your preference, if practical. The school information above will be included so {guardianName} has the contact details.
              </p>
            </div>
          )}

          {/* Educational supports */}
          {hasEducationalSupports && (schoolChangeExpected === 'yes_most_likely' || schoolChangeExpected === 'possibly' || schoolChangeExpected === 'not_sure') && (
            <div className="mt-4">
              <label className={labelClass}>
                If {childName} changed schools, which of these would be important to discuss with the new school?
              </label>
              <div className="space-y-2">
                {hasIEP && (
                  <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <p className="text-sm text-white font-medium">IEP / Individual Education Plan</p>
                    {childData.individualEducationPlan && <p className="text-xs text-gray-400 mt-1">{childData.individualEducationPlan}</p>}
                    <div className="flex gap-2 mt-2">
                      {['important_to_transfer', 'no_longer_applicable', 'not_sure'].map(opt => (
                        <label key={opt} className="flex items-center gap-1 cursor-pointer text-xs">
                          <input
                            type="radio"
                            name={`transitionIEP-${childIndex}`}
                            value={opt}
                            checked={childData.transitionIEPImportance === opt}
                            onChange={e => onChildChange(childIndex, 'transitionIEPImportance', e.target.value)}
                            className="mr-1"
                          />
                          <span className="text-gray-300">
                            {opt === 'important_to_transfer' ? 'Important to transfer/discuss' : opt === 'no_longer_applicable' ? 'No longer applicable' : "I'm not sure"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {childData.schoolExtraSupport && (
                  <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <p className="text-sm text-white font-medium">Educational support details</p>
                    <p className="text-xs text-gray-400 mt-1">{childData.schoolExtraSupport}</p>
                  </div>
                )}
                {childData.additionalEducationDetails && (
                  <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <p className="text-sm text-white font-medium">Additional education information</p>
                    <p className="text-xs text-gray-400 mt-1">{childData.additionalEducationDetails}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                These are from the information you provided earlier. We won't ask you to re-enter them.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Healthcare transition */}
      {showMoveQuestions && healthcareProviders.length > 0 && (
        <div className="mb-4 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <Heart size={16} />
            Healthcare & Care Transition
          </h6>

          <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{childName}'s current care team</p>
            <div className="space-y-1">
              {healthcareProviders.map(p => (
                <div key={p.id} className="flex items-baseline gap-2">
                  <span className="text-sm text-white font-medium">{p.name}</span>
                  <span className="text-xs text-gray-400">{p.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-3">
            <p className="text-sm text-blue-100 leading-relaxed">
              These providers know {childName}'s current history. If {childName} moved to another community, they may be important in helping transfer care to new local providers.
            </p>
          </div>

          <div className="mb-3">
            <label className={labelClass}>
              If {childName} moved to another community, which current professionals would you want {guardianName} to contact when arranging new care?
            </label>
            <div className="space-y-2">
              {healthcareProviders.map(p => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transitionProviderSelections.includes(p.id)}
                    onChange={() => toggleProviderSelection(p.id)}
                    className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">{p.name} ({p.role})</span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transitionProviderSelections.includes('all_providers')}
                  onChange={() => toggleProviderSelection('all_providers')}
                  className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">All current healthcare providers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transitionProviderSelections.includes('not_sure_providers')}
                  onChange={() => toggleProviderSelection('not_sure_providers')}
                  className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">I'm not sure</span>
              </label>
            </div>
          </div>

          <div className="mb-3">
            <label className={labelClass}>
              Do you know where {childName}'s birth certificate is located?
            </label>
            <input
              type="text"
              value={childData.birthCertificateLocation || ''}
              onChange={e => onChildChange(childIndex, 'birthCertificateLocation', e.target.value)}
              placeholder="e.g., safe deposit box, filing cabinet, with the lawyer..."
              className={inputClass}
            />
          </div>

          <div className="mb-3">
            <label className={labelClass}>
              Do you know where {childName}'s important health records or care information can be found?
            </label>
            <input
              type="text"
              value={childData.transitionHealthRecordLocation || ''}
              onChange={e => onChildChange(childIndex, 'transitionHealthRecordLocation', e.target.value)}
              placeholder="e.g., medication list, diagnoses, assessments, therapy reports, care plans, vaccination records, allergy information, prescriptions, health card information..."
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Medication transition */}
      {showMoveQuestions && hasMedications && (
        <div className="mb-4 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <Pill size={16} />
            Medication
          </h6>

          <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current medications</p>
            {(() => {
              try {
                const meds = JSON.parse(childData.medicationList || '[]') as Array<{ name: string; treats: string; prescription: string; prescribedBy: string; otherInfo: string }>;
                const valid = meds.filter(m => m.name || m.treats || m.prescribedBy || m.otherInfo);
    if (valid.length === 0) {
      return <p className="text-sm text-gray-400 italic">No medications listed.</p>;
    }
    return (
      <div className="space-y-2">
        {valid.map((m, i) => (
          <div key={i} className="bg-gray-700 border border-gray-600 rounded-lg p-3">
            <p className="text-sm font-medium text-white">{m.name || 'Unnamed medication'}</p>
            {m.treats && <p className="text-xs text-gray-300 mt-1"><span className="text-gray-400">Used for:</span> {m.treats}</p>}
            {m.prescription && <p className="text-xs text-gray-300 mt-1"><span className="text-gray-400">Prescription:</span> {m.prescription === 'yes' ? 'Yes' : 'No'}</p>}
            {m.prescribedBy && <p className="text-xs text-gray-300 mt-1"><span className="text-gray-400">Prescribed by:</span> {m.prescribedBy}</p>}
            {m.otherInfo && <p className="text-xs text-gray-300 mt-1"><span className="text-gray-400">Instructions / Notes:</span> {m.otherInfo}</p>}
          </div>
        ))}
      </div>
    );
              } catch {
                return <p className="text-sm text-gray-400 italic">No medications listed.</p>;
              }
            })()}
          </div>

          <div>
            <label className={labelClass}>
              If {childName} moved, is there anything the guardian should know about managing or transferring their medications?
            </label>
            <textarea
              value={childData.transitionMedicationNotes || ''}
              onChange={e => onChildChange(childIndex, 'transitionMedicationNotes', e.target.value)}
              placeholder="e.g., which pharmacy has the prescriptions, prescribing doctor contact, refill timing, any special handling..."
              className={inputClass}
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Disability / support transition */}
      {showMoveQuestions && hasDisabilitySupports && (
        <div className="mb-4 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <Activity size={16} />
            Transition of Supports
          </h6>

          <div className="space-y-2 mb-3">
            {supportNeedTypes.map(type => (
              <div key={type} className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                <p className="text-sm text-white font-medium">
                  {type === 'cognitive_developmental' ? 'Cognitive or developmental' :
                   type === 'physical' ? 'Physical disability' :
                   type === 'medical_condition' ? 'Medical condition' :
                   type === 'mental_health' ? 'Mental health' :
                   type === 'learning' ? 'Learning disability' :
                   type === 'complex_care' ? 'Complex care' :
                   type === 'prefer_no_label' ? 'Support needed (no label preferred)' :
                   type === 'other' ? (childData.supportNeedOther || 'Other') : type}
                </p>
              </div>
            ))}
            {disabilitySupports && (
              <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current supports</p>
                <p className="text-sm text-white">{disabilitySupports}</p>
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className={labelClass}>
              If {childName} had to move to another community, which supports would be most important to re-establish quickly?
            </label>
            <div className="space-y-2">
              {supportNeedTypes.map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transitionSupportSelections.includes(type)}
                    onChange={() => toggleSupportSelection(type)}
                    className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">
                    {type === 'cognitive_developmental' ? 'Developmental specialist' :
                     type === 'physical' ? 'Physiotherapy/physical support' :
                     type === 'medical_condition' ? 'Medical care' :
                     type === 'mental_health' ? 'Counselling/mental health' :
                     type === 'learning' ? 'Educational supports' :
                     type === 'complex_care' ? 'Complex care coordination' :
                     type === 'prefer_no_label' ? 'General support services' :
                     'Other support'}
                  </span>
                </label>
              ))}
              {childData.disabilitySupports && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transitionSupportSelections.includes('existing_supports')}
                    onChange={() => toggleSupportSelection('existing_supports')}
                    className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">All current supports listed above</span>
                </label>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Is there anything the guardian should know about how to make that transition easier for {childName}?
            </label>
            <textarea
              value={childData.transitionSupportNotes || ''}
              onChange={e => onChildChange(childIndex, 'transitionSupportNotes', e.target.value)}
              placeholder="e.g., what has worked well, what to avoid, who to contact first, what helps {childName} feel safe during changes..."
              className={inputClass}
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Activities & routines */}
      {showMoveQuestions && activities.length > 0 && (
        <div className="mb-4 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <Activity size={16} />
            Routines & Activities Worth Preserving
          </h6>

          <p className="text-sm text-gray-300 mb-3">
            If {childName} moved, which activities or interests would you hope they could continue in their new community? These are about the activity itself — not necessarily the same organization or team.
          </p>

          <div className="space-y-2">
            {activities.map((act, i) => {
              const name = act.activityName || `Activity ${i + 1}`;
              return (
                <label key={i} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transitionActivitySelections.includes(name)}
                    onChange={() => toggleActivitySelection(name)}
                    className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">{name}</span>
                  {act.importanceLevel && <span className="text-xs text-gray-500">({act.importanceLevel})</span>}
                </label>
              );
            })}
          </div>

          {childData.importantRoutines && (
            <div className="mt-3 p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Important routines</p>
              <p className="text-sm text-white">{childData.importantRoutines}</p>
            </div>
          )}
        </div>
      )}

      {/* Important relationships */}
      {showMoveQuestions && importantPeopleOptions.length > 0 && (
        <div className="mb-4 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <UserCheck size={16} />
            People to Keep Close
          </h6>

          <p className="text-sm text-gray-300 mb-3">
            Relationships may need active continuity even if {childName} moves. Who would be especially important for {childName} to stay connected with?
          </p>

          <div className="space-y-2">
            {importantPeopleOptions.map(p => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transitionPeopleSelections.includes(p.id)}
                  onChange={() => togglePeopleSelection(p.id)}
                  className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">{p.name}</span>
                <span className="text-xs text-gray-500">({p.relationship})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Adult sibling role */}
      {showMoveQuestions && adultIndependentSiblings.length > 0 && (
        <div className="mb-4 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <Users size={16} />
            Adult Sibling's Role
          </h6>

          {adultIndependentSiblings.map(({ child: sib, index: sibIdx }) => {
            const sibName = sib.nickname || sib.name || `Child ${sibIdx + 1} (details to come)`;
            const roleValues = (childData[`transitionAdultSiblingRole_${sibIdx}`] || '').split(',').filter(Boolean);
            const toggleRole = (opt: string) => {
              const next = roleValues.includes(opt)
                ? roleValues.filter(v => v !== opt)
                : [...roleValues, opt];
              onChildChange(childIndex, `transitionAdultSiblingRole_${sibIdx}`, next.join(','));
            };
            const notResponsible = (childData[`transitionAdultSiblingNotResponsible_${sibIdx}`] || '').split(',').filter(Boolean);
            const toggleNotResponsible = (opt: string) => {
              const next = notResponsible.includes(opt)
                ? notResponsible.filter(v => v !== opt)
                : [...notResponsible, opt];
              onChildChange(childIndex, `transitionAdultSiblingNotResponsible_${sibIdx}`, next.join(','));
            };
            return (
              <div key={sibIdx} className="mb-4">
                <p className="text-sm text-gray-300 mb-2">What role(s) would you hope {sibName} continues to have in {childName}'s life? Select all that apply.</p>
                <div className="flex flex-col gap-2 mb-3">
                  {ADULT_SIBLING_ROLE_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleValues.includes(opt.value)}
                        onChange={() => toggleRole(opt.value)}
                        className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-gray-300 text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>

                <p className="text-sm text-gray-300 mb-2">
                  Is there anything you specifically would NOT want {sibName} to feel responsible for?
                </p>
                <div className="flex flex-col gap-2">
                  {ADULT_SIBLING_NOT_RESPONSIBLE_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notResponsible.includes(opt.value)}
                        onChange={() => toggleNotResponsible(opt.value)}
                        className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-gray-300 text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* What would make the transition easier */}
      {showMoveQuestions && (
        <div className="mb-4 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <Lightbulb size={16} />
            Helping {childName} Through a Major Change
          </h6>

          <label className={labelClass}>
            If {childName} had to move and begin a new routine, what would make that transition easier for them?
          </label>
          <textarea
            value={childData.transitionEasierText || ''}
            onChange={e => onChildChange(childIndex, 'transitionEasierText', e.target.value)}
            placeholder="Think about familiar routines, favourite possessions, people they rely on, activities, bedtime routines, communication style, pets, foods, traditions or anything else that helps them feel secure."
            className={inputClass}
            rows={3}
          />
        </div>
      )}

      {/* First few days */}
      {showMoveQuestions && (
        <div className="mb-4 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
            <Calendar size={16} />
            If Something Happened Tomorrow
          </h6>

          <label className={labelClass}>
            What are the first things you would want {guardianName} to know or do for {childName}?
          </label>
          <div className="space-y-2">
            {Array.from({ length: Math.max(3, firstDaysCount) }).map((_, i) => (
              <input
                key={i}
                type="text"
                value={childData[`transitionFirstDays_${i}`] || ''}
                onChange={e => {
                  updateFirstDaysItem(i, e.target.value);
                  if (i >= firstDaysCount) setFirstDaysCount(i + 1);
                }}
                placeholder={`Priority ${i + 1}...`}
                className={inputClass}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            For example: Call their grandparents. Keep the children together. Bring comfort items. Contact their current care team. Give them time before making unnecessary major changes.
          </p>
        </div>
      )}

      {/* Cross-province / cross-border flag */}
      {showMoveQuestions && guardianPerson.country && childData.countryOfResidence && (() => {
        const guardianCountry = guardianPerson.country.toLowerCase().trim();
        const childCountry = (childData.countryOfResidence || 'Canada').toLowerCase().trim();
        const guardianProvince = guardianPerson.province;
        const childProvince = childData.provinceTerritory || '';
        const isCrossBorder = guardianCountry !== childCountry;
        const isCrossProvince = !isCrossBorder && guardianCountry === 'canada' && guardianProvince && childProvince && guardianProvince !== childProvince;

        if (!isCrossBorder && !isCrossProvince) return null;

        return (
          <div className={`rounded-lg p-3 border ${isCrossBorder ? 'bg-red-900/20 border-red-700/30' : 'bg-amber-900/20 border-amber-700/30'}`}>
            <p className={`text-sm font-medium mb-1 ${isCrossBorder ? 'text-red-200' : 'text-amber-200'}`}>
              {isCrossBorder ? 'Cross-Border Guardianship Planning' : 'Interprovincial Guardianship Transition'}
            </p>
            <p className={`text-xs leading-relaxed ${isCrossBorder ? 'text-red-300/70' : 'text-amber-300/70'}`}>
              {isCrossBorder
                ? `${guardianName} lives in a different country. This may involve additional considerations around immigration, custody, guardianship validity, health coverage and school enrollment. We recommend reviewing this with a professional.`
                : `${guardianName} lives in a different province. School registration, health coverage, disability services, government programs and professional supports may work differently there. This is worth reviewing with a professional.`}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
