import { Plus, X, ShieldCheck, Heart, GraduationCap, Users, Lightbulb } from 'lucide-react';

export type PlanningPerson = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  country: string;
  sourceId?: string;
};

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  source: string;
};

type Props = {
  childIndex: number;
  childData: Record<string, string>;
  childrenData: Array<Record<string, string>>;
  planningPersons: PlanningPerson[];
  prefilledContacts: Contact[];
  classification: 'minor' | 'independent_adult' | 'adult_dependant';
  isDisabled: boolean;
  minorIndices: number[];
  onChildChange: (index: number, field: string, value: string) => void;
  onChildMultiChange: (index: number, fields: Record<string, string>) => void;
  onPlanningPersonsChange: (persons: PlanningPerson[]) => void;
};

const SOURCE_LABELS: Record<string, string> = {
  parent1: 'Parent / Guardian 1',
  parent2: 'Parent / Guardian 2',
  sibling: 'Sibling',
  family: 'Other Family',
  school: 'School Team',
  doctor: 'Doctor / Therapist / Support Worker',
  other: 'Other',
  otherparent: "Child's Other Parent",
  prevrel1: 'Former Partner (Client 1)',
  prevrel2: 'Former Partner (Client 2)',
  et1: 'Estate Trustee (Client 1)',
  et2: 'Estate Trustee (Client 2)',
  poapc1: 'POA — Personal Care (Client 1)',
  poapc2: 'POA — Personal Care (Client 2)',
  poaprop1: 'POA — Property (Client 1)',
  poaprop2: 'POA — Property (Client 2)',
  fa1: 'Financial Advisor (Client 1)',
  fa2: 'Financial Advisor (Client 2)',
  trustben: 'Trust Beneficiary',
  adultchild: 'Adult Child',
};

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

const SPOKEN_OPTIONS = [
  { value: 'yes_agreed', label: 'Yes, and they agreed' },
  { value: 'yes_not_confirmed', label: 'Yes, but we haven\'t formally confirmed' },
  { value: 'not_yet', label: 'Not yet' },
  { value: 'not_sure', label: 'We\'re not sure' },
];

const WILL_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'We\'re not sure' },
  { value: 'no_will', label: 'We do not currently have a Will' },
];

const CONSIDERED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'some_ideas', label: 'We have some ideas, but haven\'t decided' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'We\'re not sure' },
];

function personName(planningPersons: PlanningPerson[], personId?: string): string {
  if (!personId) return '';
  const p = planningPersons.find(p => p.id === personId);
  return p?.name || '';
}

export default function ChildPlanningSection({
  childIndex,
  childData,
  childrenData,
  planningPersons,
  prefilledContacts,
  classification,
  isDisabled,
  minorIndices,
  onChildChange,
  onChildMultiChange,
  onPlanningPersonsChange,
}: Props) {
  if (classification === 'independent_adult') return null;

  const childName = childData.nickname || childData.name || `Child ${childIndex + 1}`;

  const createPlanningPerson = (data?: Partial<PlanningPerson>): string => {
    const id = `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPerson: PlanningPerson = {
      id,
      name: data?.name || '',
      relationship: data?.relationship || '',
      phone: data?.phone || '',
      email: data?.email || '',
      city: data?.city || '',
      province: data?.province || '',
      country: data?.country || '',
      sourceId: data?.sourceId,
    };
    onPlanningPersonsChange([...planningPersons, newPerson]);
    return id;
  };

  const createFromContact = (contact: Contact): string => {
    const existing = planningPersons.find(p => p.sourceId === contact.id);
    if (existing) return existing.id;
    return createPlanningPerson({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      city: contact.city,
      province: contact.province,
      sourceId: contact.id,
    });
  };

  const updatePlanningPerson = (personId: string, field: string, value: string) => {
    onPlanningPersonsChange(planningPersons.map(p => (p.id === personId ? { ...p, [field]: value } : p)));
  };

  const getPerson = (personId?: string): PlanningPerson | undefined => {
    if (!personId) return undefined;
    return planningPersons.find(p => p.id === personId);
  };

  // Find other minor children who already have a guardian
  const otherMinorsWithGuardians = minorIndices
    .filter(i => i !== childIndex)
    .filter(i => childrenData[i]?.guardianPersonId && getPerson(childrenData[i]?.guardianPersonId))
    .map(i => ({
      index: i,
      name: childrenData[i]?.nickname || childrenData[i]?.name || `Child ${i + 1}`,
      guardianId: childrenData[i]?.guardianPersonId as string,
      guardianName: personName(planningPersons, childrenData[i]?.guardianPersonId),
    }));

  // Deduplicate by guardianId
  const uniqueGuardians = otherMinorsWithGuardians.filter(
    (g, i, arr) => arr.findIndex(x => x.guardianId === g.guardianId) === i
  );

  const renderPersonForm = (personId: string, labelPrefix: string) => {
    const person = getPerson(personId);
    if (!person) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <input type="text" value={person.name} onChange={e => updatePlanningPerson(personId, 'name', e.target.value)} placeholder="Full name" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        <input type="text" value={person.relationship} onChange={e => updatePlanningPerson(personId, 'relationship', e.target.value)} placeholder={`Relationship to ${childName}`} className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        <input type="tel" value={person.phone} onChange={e => updatePlanningPerson(personId, 'phone', e.target.value)} placeholder="Phone" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        <input type="email" value={person.email} onChange={e => updatePlanningPerson(personId, 'email', e.target.value)} placeholder="Email" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        <input type="text" value={person.city} onChange={e => updatePlanningPerson(personId, 'city', e.target.value)} placeholder="City" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        <select value={person.province} onChange={e => updatePlanningPerson(personId, 'province', e.target.value)} className="px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
          <option value="">Province / State</option>
          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          <option value="other">Other</option>
        </select>
        <input type="text" value={person.country} onChange={e => updatePlanningPerson(personId, 'country', e.target.value)} placeholder="Country" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:col-span-2" />
      </div>
    );
  };

  const PARENT_SOURCES = new Set(['parent1', 'parent2', 'otherparent']);

  const renderPersonSelector = (
    selectedPersonId: string | undefined,
    fieldName: string,
    placeholderLabel: string,
    excludeParents = false
  ) => {
    const person = getPerson(selectedPersonId);
    const hasSelection = !!person;
    const selectableContacts = excludeParents
      ? prefilledContacts.filter(c => !PARENT_SOURCES.has(c.source))
      : prefilledContacts;

    const handleSelect = (value: string) => {
      if (value === '') {
        onChildChange(childIndex, fieldName, '');
      } else if (value === 'new') {
        const id = createPlanningPerson();
        onChildChange(childIndex, fieldName, id);
      } else if (value.startsWith('contact_')) {
        const contactId = value.replace('contact_', '');
        const contact = prefilledContacts.find(c => c.id === contactId);
        if (contact) {
          const id = createFromContact(contact);
          onChildChange(childIndex, fieldName, id);
        }
      } else if (value.startsWith('existing_')) {
        const existingId = value.replace('existing_', '');
        onChildChange(childIndex, fieldName, existingId);
      }
    };

    return (
      <div>
        <select
          value={hasSelection ? `existing_${selectedPersonId}` : ''}
          onChange={e => handleSelect(e.target.value)}
          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">{placeholderLabel}</option>
          {planningPersons.length > 0 && (
            <optgroup label="People already added in this step">
              {planningPersons.map(p => (
                <option key={p.id} value={`existing_${p.id}`}>{p.name || 'Unnamed person'}{p.relationship ? ` (${p.relationship})` : ''}</option>
              ))}
            </optgroup>
          )}
          {selectableContacts.length > 0 && (
            <optgroup label="People from elsewhere in your questionnaire">
              {selectableContacts.map(c => (
                <option key={c.id} value={`contact_${c.id}`}>{c.name || SOURCE_LABELS[c.source] || c.id} ({SOURCE_LABELS[c.source] || 'Contact'})</option>
              ))}
            </optgroup>
          )}
          <option value="new">+ Someone new</option>
        </select>
        {hasSelection && renderPersonForm(selectedPersonId!, fieldName)}
      </div>
    );
  };

  const renderGuardianPlanning = () => {
    const considered = childData.guardianConsidered;
    const showQuestions = considered === 'yes' || considered === 'some_ideas';
    const guardianId = childData.guardianPersonId;
    const guardianName = personName(planningPersons, guardianId) || 'this guardian';
    const guardian2Id = childData.guardianPersonId2;
    const guardian2Name = personName(planningPersons, guardian2Id) || 'this person';
    const hasJointGuardian = !!(guardianId && guardian2Id && guardian2Id !== guardianId);
    const jointLabel = hasJointGuardian ? `${guardianName} and ${guardian2Name}` : guardianName;
    const showSameGuardianQ = showQuestions && uniqueGuardians.length > 0;
    const sameGuardianAnswer = childData.guardianSameAsSibling;
    const showPersonSelector = showQuestions && (!showSameGuardianQ || sameGuardianAnswer === 'no' || sameGuardianAnswer === 'not_sure');

    const alternateConsidered = childData.alternateGuardianConsidered;
    const showAlternate = alternateConsidered === 'yes' || alternateConsidered === 'some_ideas';
    const alternateId = childData.alternateGuardianPersonId;
    const alternateName = personName(planningPersons, alternateId) || 'this person';

    // Multi-select: other minor children for this guardian
    const otherMinorChildren = minorIndices.filter(i => i !== childIndex);
    const appliesTo = (childData.guardianAppliesTo || '').split(',').filter(Boolean);

    const toggleAppliesTo = (siblingIndex: number) => {
      const isChecked = appliesTo.includes(String(siblingIndex));
      if (isChecked) {
        const next = appliesTo.filter(v => v !== String(siblingIndex));
        onChildChange(childIndex, 'guardianAppliesTo', next.join(','));
        onChildMultiChange(siblingIndex, {
          guardianPersonId: '',
          guardianPersonId2: '',
          guardianConsidered: '',
          guardianSameAsSibling: '',
          guardianSpokenWith: '',
          guardianInWill: '',
        });
      } else {
        const next = [...appliesTo, String(siblingIndex)];
        onChildChange(childIndex, 'guardianAppliesTo', next.join(','));
        onChildMultiChange(siblingIndex, {
          guardianPersonId: guardianId || '',
          guardianPersonId2: guardian2Id || '',
          guardianConsidered: 'yes',
          guardianSameAsSibling: 'yes',
        });
      }
    };

    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Have you considered who you would ideally want to act as {childName}'s guardian if you were no longer able to care for {childName}?
          </label>
          <div className="flex flex-col gap-2">
            {CONSIDERED_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`guardianConsidered-${childIndex}`} value={value} checked={considered === value} onChange={e => {
                  const val = e.target.value;
                  if (val !== 'yes' && val !== 'some_ideas') {
                    onChildMultiChange(childIndex, {
                      guardianConsidered: val,
                      guardianSameAsSibling: '',
                      guardianPersonId: '',
                      guardianPersonId2: '',
                      guardianSpokenWith: '',
                      guardianInWill: '',
                      guardianNotes: '',
                      guardianAppliesTo: '',
                      alternateGuardianConsidered: '',
                      alternateGuardianPersonId: '',
                      alternateGuardianSpokenWith: '',
                      alternateGuardianInWill: '',
                      alternateGuardianNotes: '',
                    });
                  } else {
                    onChildChange(childIndex, 'guardianConsidered', val);
                  }
                }} className="mr-1" />
                <span className="text-gray-300 text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {showSameGuardianQ && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Would you ideally want the same guardian for {childName} as you identified for {uniqueGuardians.map(g => g.name).join(', ')}?
            </label>
            <div className="flex gap-4">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'not_sure', label: "We're not sure" },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name={`guardianSameAsSibling-${childIndex}`} value={value} checked={sameGuardianAnswer === value} onChange={e => {
                    const val = e.target.value;
                    if (val === 'yes') {
                      const targetGuardian = uniqueGuardians[0];
                      if (uniqueGuardians.length > 1) {
                        // Multiple guardians exist — let user pick below
                        onChildMultiChange(childIndex, {
                          guardianSameAsSibling: val,
                          guardianPersonId: '',
                          guardianPersonId2: '',
                        });
                      } else {
                        onChildMultiChange(childIndex, {
                          guardianSameAsSibling: val,
                          guardianPersonId: targetGuardian.guardianId,
                          guardianPersonId2: '',
                        });
                      }
                    } else {
                      onChildMultiChange(childIndex, {
                        guardianSameAsSibling: val,
                        guardianPersonId: '',
                        guardianPersonId2: '',
                      });
                    }
                  }} className="mr-1" />
                  <span className="text-gray-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
            {sameGuardianAnswer === 'yes' && uniqueGuardians.length > 1 && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">Which guardian would you like to use?</label>
                <select
                  value={guardianId || ''}
                  onChange={e => onChildChange(childIndex, 'guardianPersonId', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select a guardian...</option>
                  {uniqueGuardians.map(g => (
                    <option key={g.guardianId} value={g.guardianId}>{g.guardianName || 'Unnamed'} (guardian for {g.name})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {showPersonSelector && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Who would you ideally want to act as {childName}'s guardian?
            </label>
            {renderPersonSelector(guardianId, 'guardianPersonId', 'Select a person...', true)}
          </div>
        )}

        {showPersonSelector && guardianId && getPerson(guardianId) && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Is there a second person who would act together with {guardianName} as {childName}'s guardian? (Optional)
            </label>
            {renderPersonSelector(guardian2Id, 'guardianPersonId2', 'Select a second person...', true)}
          </div>
        )}

        {guardianId && getPerson(guardianId) && (
          <>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Have you spoken with {jointLabel} about taking on this responsibility?
              </label>
              <div className="flex flex-col gap-2">
                {SPOKEN_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={`guardianSpokenWith-${childIndex}`} value={value} checked={childData.guardianSpokenWith === value} onChange={e => onChildChange(childIndex, 'guardianSpokenWith', e.target.value)} className="mr-1" />
                    <span className="text-gray-300 text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                To your knowledge, is {jointLabel} currently named as guardian for {childName} in your Will?
              </label>
              <div className="flex flex-col gap-2">
                {WILL_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={`guardianInWill-${childIndex}`} value={value} checked={childData.guardianInWill === value} onChange={e => onChildChange(childIndex, 'guardianInWill', e.target.value)} className="mr-1" />
                    <span className="text-gray-300 text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {otherMinorChildren.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Would you ideally want {jointLabel} to act as guardian for any of your other minor children as well?
                </label>
                <div className="flex flex-col gap-2">
                  {otherMinorChildren.map(i => {
                    const sibName = childrenData[i]?.nickname || childrenData[i]?.name || `Child ${i + 1}`;
                    const isChecked = appliesTo.includes(String(i));
                    return (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleAppliesTo(i)} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500" />
                        <span className="text-gray-300 text-sm">{sibName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea value={childData.guardianNotes || ''} onChange={e => onChildChange(childIndex, 'guardianNotes', e.target.value)} placeholder="Any additional notes about this guardian arrangement..." rows={3} className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Have you considered an alternate guardian for {childName} in case {jointLabel} is unable to take on the role?
              </label>
              <div className="flex flex-col gap-2">
                {CONSIDERED_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={`alternateGuardianConsidered-${childIndex}`} value={value} checked={alternateConsidered === value} onChange={e => {
                      const val = e.target.value;
                      if (val !== 'yes' && val !== 'some_ideas') {
                        onChildMultiChange(childIndex, {
                          alternateGuardianConsidered: val,
                          alternateGuardianPersonId: '',
                          alternateGuardianSpokenWith: '',
                          alternateGuardianInWill: '',
                          alternateGuardianNotes: '',
                        });
                      } else {
                        onChildChange(childIndex, 'alternateGuardianConsidered', val);
                      }
                    }} className="mr-1" />
                    <span className="text-gray-300 text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {showAlternate && (
              <>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Who would you ideally want to act as {childName}'s alternate guardian?
                  </label>
                  {renderPersonSelector(alternateId, 'alternateGuardianPersonId', 'Select a person...', true)}
                </div>

                {alternateId && getPerson(alternateId) && (
                  <>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Have you spoken with {alternateName} about taking on this responsibility?
                      </label>
                      <div className="flex flex-col gap-2">
                        {SPOKEN_OPTIONS.map(({ value, label }) => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name={`alternateGuardianSpokenWith-${childIndex}`} value={value} checked={childData.alternateGuardianSpokenWith === value} onChange={e => onChildChange(childIndex, 'alternateGuardianSpokenWith', e.target.value)} className="mr-1" />
                            <span className="text-gray-300 text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        To your knowledge, is {alternateName} currently named as alternate guardian for {childName} in your Will?
                      </label>
                      <div className="flex flex-col gap-2">
                        {WILL_OPTIONS.map(({ value, label }) => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name={`alternateGuardianInWill-${childIndex}`} value={value} checked={childData.alternateGuardianInWill === value} onChange={e => onChildChange(childIndex, 'alternateGuardianInWill', e.target.value)} className="mr-1" />
                            <span className="text-gray-300 text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                      <textarea value={childData.alternateGuardianNotes || ''} onChange={e => onChildChange(childIndex, 'alternateGuardianNotes', e.target.value)} placeholder="Any additional notes about this alternate guardian arrangement..." rows={3} className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </>
    );
  };

  const renderFutureSupportPlanning = () => {
    const considered = childData.supportLeadConsidered;
    const showQuestions = considered === 'yes' || considered === 'some_ideas';
    const leadId = childData.supportLeadPersonId;
    const leadName = personName(planningPersons, leadId) || 'this person';
    const showSupportNetwork = !isDisabled;

    // Support network multi-select (using existing futureCareTeamSelection field)
    const networkSelected = (childData.futureCareTeamSelection || '').split(',').filter(Boolean);
    const toggleNetwork = (id: string) => {
      const next = networkSelected.includes(id) ? networkSelected.filter(v => v !== id) : [...networkSelected, id];
      onChildChange(childIndex, 'futureCareTeamSelection', next.join(','));
    };

    return (
      <>
        {showSupportNetwork && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              If you were no longer able to provide care, who would you hope steps in first? (Select all that apply)
            </label>
            <div className="flex flex-col gap-2">
              {prefilledContacts.map(c => {
                const isSelected = networkSelected.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleNetwork(c.id)} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500" />
                    <span className="text-gray-300 text-sm">{c.name || SOURCE_LABELS[c.source] || c.id}</span>
                    {c.name && <span className="text-xs text-gray-500">({SOURCE_LABELS[c.source]})</span>}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className={showSupportNetwork ? 'mt-4' : ''}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            If you were no longer able to provide the support you currently provide to {childName}, have you considered who you would ideally want to take the lead in helping support them?
          </label>
          <div className="flex flex-col gap-2">
            {CONSIDERED_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`supportLeadConsidered-${childIndex}`} value={value} checked={considered === value} onChange={e => {
                  const val = e.target.value;
                  if (val !== 'yes' && val !== 'some_ideas') {
                    onChildMultiChange(childIndex, {
                      supportLeadConsidered: val,
                      supportLeadPersonId: '',
                      supportLeadSpokenWith: '',
                      supportLeadNotes: '',
                    });
                  } else {
                    onChildChange(childIndex, 'supportLeadConsidered', val);
                  }
                }} className="mr-1" />
                <span className="text-gray-300 text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {showQuestions && (
          <>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Who would you ideally want to take the lead in supporting {childName}?
              </label>
              {renderPersonSelector(leadId, 'supportLeadPersonId', 'Select a person...')}
            </div>

            {leadId && getPerson(leadId) && (
              <>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Have you spoken with {leadName} about taking on this responsibility?
                  </label>
                  <div className="flex flex-col gap-2">
                    {SPOKEN_OPTIONS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`supportLeadSpokenWith-${childIndex}`} value={value} checked={childData.supportLeadSpokenWith === value} onChange={e => onChildChange(childIndex, 'supportLeadSpokenWith', e.target.value)} className="mr-1" />
                        <span className="text-gray-300 text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea value={childData.supportLeadNotes || ''} onChange={e => onChildChange(childIndex, 'supportLeadNotes', e.target.value)} placeholder="Any additional notes about this support arrangement..." rows={3} className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </>
            )}
          </>
        )}
      </>
    );
  };

  const renderWhyWeChoseYou = () => {
    const guardianId = childData.guardianPersonId;
    const guardianPerson = getPerson(guardianId);
    if (!guardianId || !guardianPerson) return null;
    const guardianFirstName = (guardianPerson.name || 'the guardian').split(' ')[0];

    return (
      <div className="mt-6 pt-4 border-t border-gray-600">
        <div className="pb-2 border-b border-gray-500 mb-3">
          <h5 className="text-base font-semibold text-blue-400 flex items-center gap-2">
            <Heart size={18} />
            Why We Chose {guardianFirstName}
          </h5>
        </div>

        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-100 leading-relaxed">
            These questions are a chance to reflect on why you trust {guardianFirstName} with your children. You don't have to answer all of them — just whatever feels right.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Why have you chosen {guardianFirstName} to care for {childName}?
          </label>
          <p className="text-xs text-gray-500 mb-2">
            This can be about the kind of person they are, their relationship with your children, the values you share, the family they've created, the way they make your children feel, or simply what gives you confidence that your children would be safe and loved with them.
          </p>
          <textarea
            value={childData.guardianWhyChose || ''}
            onChange={e => onChildChange(childIndex, 'guardianWhyChose', e.target.value)}
            placeholder="Share whatever feels important to say..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What would you want {guardianFirstName} to understand about the trust you are placing in them?
          </label>
          <p className="text-xs text-gray-500 mb-2">
            You don't need to make this formal. Imagine sitting across from them and explaining why you trust them with the people who matter most to you.
          </p>
          <textarea
            value={childData.guardianTrustMessage || ''}
            onChange={e => onChildChange(childIndex, 'guardianTrustMessage', e.target.value)}
            placeholder="Share whatever feels right..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            If {guardianFirstName} ever actually had to step into this role, is there anything you would want them to hear directly from you?
          </label>
          <p className="text-xs text-gray-500 mb-2">
            This could be reassurance, gratitude, permission to make decisions differently than you would have, or simply something you would want them to remember on a very difficult day.
          </p>
          <textarea
            value={childData.guardianIfNeededMessage || ''}
            onChange={e => onChildChange(childIndex, 'guardianIfNeededMessage', e.target.value)}
            placeholder="Share whatever feels right..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
    );
  };

  const EDUCATION_PATH_OPTIONS = [
    { value: 'university', label: 'University' },
    { value: 'college', label: 'College' },
    { value: 'trade_apprenticeship', label: 'Trade / apprenticeship' },
    { value: 'other_post_secondary', label: 'Other post-secondary or professional training' },
    { value: 'employment', label: 'Employment / work-focused path' },
    { value: 'support_whatever', label: 'We want to support whatever path suits them' },
    { value: 'too_early_unsure', label: 'Too early / unsure' },
    { value: 'other', label: 'Other' },
  ];

  const FINANCIAL_SUPPORT_OPTIONS = [
    { value: 'yes', label: 'Yes' },
    { value: 'likely', label: 'Likely' },
    { value: 'unsure', label: 'Unsure' },
    { value: 'no_specific_expectation', label: 'No specific expectation' },
    { value: 'not_applicable', label: 'Not applicable' },
    { value: 'other', label: 'Other' },
  ];

  const SETTING_TYPE_OPTIONS = [
    { value: 'public', label: 'Public school' },
    { value: 'catholic', label: 'Catholic / other publicly funded school' },
    { value: 'private', label: 'Private school' },
    { value: 'specialized_therapeutic', label: 'Specialized / therapeutic school or program' },
    { value: 'homeschool', label: 'Homeschool' },
    { value: 'other', label: 'Other' },
    { value: 'not_attending', label: 'Not currently attending school / not applicable' },
  ];

  const SETTING_REASON_OPTIONS = [
    { value: 'academic_preference', label: 'Academic preference' },
    { value: 'learns_better', label: `${childName} learns better in this environment` },
    { value: 'disability_support', label: 'Disability or additional support needs' },
    { value: 'specialized_programming', label: 'Specialized programming' },
    { value: 'smaller_class', label: 'Smaller class size / additional individual attention' },
    { value: 'religious_cultural', label: 'Religious or cultural reasons' },
    { value: 'social_continuity', label: 'Social / community continuity' },
    { value: 'family_preference', label: 'Family preference' },
    { value: 'location_practical', label: 'Location / practical reasons' },
    { value: 'other', label: 'Other' },
  ];

  const EDUCATION_IMPORTANCE_OPTIONS = [
    { value: 'essential_support', label: `Essential support — "We consider this setting, or an equivalent level of support, important to ${childName}'s disability, health, learning or wellbeing."` },
    { value: 'strong_preference', label: `Strong preference — "We would very much like this type of education to continue, but recognize circumstances could change."` },
    { value: 'preference_with_flexibility', label: `Preference with flexibility — "We value this arrangement, but would want the Guardian to consider what makes sense for their family and for ${childName} at that time."` },
    { value: 'no_strong_preference', label: `No strong preference — "We trust the Guardian to decide what educational environment makes the most sense."` },
    { value: 'unsure', label: `Unsure / worth discussing — "We have not fully decided how strongly we feel about this."` },
    { value: 'other', label: 'Other' },
  ];

  const EDUCATION_FAIRNESS_OPTIONS = [
    { value: 'preserve_if_need_based', label: `Preserve if need-based — "If the difference is important to ${childName}'s disability, learning, health or wellbeing, we would want that support prioritized where reasonably possible."` },
    { value: 'preserve_if_resources_allow', label: `Preserve if resources allow — "We would like ${childName}'s existing educational opportunity preserved where resources allow."` },
    { value: 'balance_with_guardian_family', label: `Balance with guardian family — "We would want the Guardian to consider how the arrangement affects all of the children and the household."` },
    { value: 'guardian_discretion', label: `Guardian discretion — "We trust the Guardian to make the decision that makes the most sense at the time."` },
    { value: 'guardian_trustee_discussion', label: `Guardian + Trustee discussion — "We would want the Guardian and Trustee to discuss a significant schooling decision together."` },
    { value: 'other', label: 'Other' },
  ];

  const renderFutureEducation = () => {
    const paths = (childData.futureEducationPaths || '').split(',').filter(Boolean);
    const showPathOther = paths.includes('other');
    const showFinancialOther = childData.futureEducationFinancialSupport === 'other';

    const settingType = childData.educationSettingType;
    const showSettingOther = settingType === 'other';
    const showSettingQuestions = settingType && settingType !== 'not_attending';

    const settingReasons = (childData.educationSettingReasons || '').split(',').filter(Boolean);
    const showSettingReasonsOther = settingReasons.includes('other');

    const importance = childData.educationImportance;
    const showImportanceOther = importance === 'other';

    // Education fairness: trigger when private, specialized, strong/essential preference
    const triggersFairness = settingType === 'private' || settingType === 'specialized_therapeutic' ||
      importance === 'essential_support' || importance === 'strong_preference';

    const fairnessPrinciples = (childData.educationFairnessPrinciples || '').split(',').filter(Boolean);
    const showFairnessOther = fairnessPrinciples.includes('other');

    const togglePath = (value: string) => {
      const next = paths.includes(value) ? paths.filter(v => v !== value) : [...paths, value];
      const fields: Record<string, string> = { futureEducationPaths: next.join(',') };
      if (!next.includes('other')) fields.futureEducationPathsOther = '';
      onChildMultiChange(childIndex, fields);
    };

    const toggleSettingReason = (value: string) => {
      const next = settingReasons.includes(value) ? settingReasons.filter(v => v !== value) : [...settingReasons, value];
      const fields: Record<string, string> = { educationSettingReasons: next.join(',') };
      if (!next.includes('other')) fields.educationSettingReasonsOther = '';
      onChildMultiChange(childIndex, fields);
    };

    const toggleFairness = (value: string) => {
      const next = fairnessPrinciples.includes(value) ? fairnessPrinciples.filter(v => v !== value) : [...fairnessPrinciples, value];
      const fields: Record<string, string> = { educationFairnessPrinciples: next.join(',') };
      if (!next.includes('other')) fields.educationFairnessPrinciplesOther = '';
      onChildMultiChange(childIndex, fields);
    };

    return (
      <div className="mt-6 pt-4 border-t border-gray-600">
        <div className="pb-2 border-b border-gray-500 mb-3">
          <h5 className="text-base font-semibold text-blue-400 flex items-center gap-2">
            <GraduationCap size={18} />
            Education & Looking Ahead
          </h5>
        </div>

        {/* Current education environment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What type of school or educational setting does {childName} currently attend?
          </label>
          <div className="flex flex-col gap-2">
            {SETTING_TYPE_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`educationSettingType-${childIndex}`} value={value} checked={settingType === value} onChange={e => {
                  const val = e.target.value;
                  const fields: Record<string, string> = { educationSettingType: val };
                  if (val !== 'other') fields.educationSettingTypeDetails = '';
                  if (val === 'not_attending') {
                    fields.educationSettingReasons = '';
                    fields.educationSettingReasonsOther = '';
                    fields.educationImportance = '';
                    fields.educationImportanceDetails = '';
                    fields.educationFairnessPrinciples = '';
                    fields.educationFairnessPrinciplesOther = '';
                    fields.educationFairnessDetails = '';
                  }
                  onChildMultiChange(childIndex, fields);
                }} className="mr-1" />
                <span className="text-gray-300 text-sm">{label}</span>
              </label>
            ))}
          </div>
          {showSettingOther && (
            <input type="text" value={childData.educationSettingTypeDetails || ''} onChange={e => onChildChange(childIndex, 'educationSettingTypeDetails', e.target.value)} placeholder="Please describe..." className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
          )}
        </div>

        {/* Why this setting */}
        {showSettingQuestions && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Why did you choose this educational setting for {childName}? (Select all that apply)
            </label>
            <div className="flex flex-col gap-2">
              {SETTING_REASON_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={settingReasons.includes(value)} onChange={() => toggleSettingReason(value)} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500" />
                  <span className="text-gray-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
            {showSettingReasonsOther && (
              <input type="text" value={childData.educationSettingReasonsOther || ''} onChange={e => onChildChange(childIndex, 'educationSettingReasonsOther', e.target.value)} placeholder="Please describe..." className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
            )}
            <textarea value={childData.educationSettingReasonsNotes || ''} onChange={e => onChildChange(childIndex, 'educationSettingReasonsNotes', e.target.value)} placeholder="Anything else you would want a future Guardian to understand about why this setting matters? (Optional)" rows={3} className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        )}

        {/* Need vs preference */}
        {showSettingQuestions && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              How would you describe the importance of {childName}'s current educational setting?
            </label>
            <div className="flex flex-col gap-2">
              {EDUCATION_IMPORTANCE_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name={`educationImportance-${childIndex}`} value={value} checked={importance === value} onChange={e => {
                    const val = e.target.value;
                    const fields: Record<string, string> = { educationImportance: val };
                    if (val !== 'other') fields.educationImportanceDetails = '';
                    onChildMultiChange(childIndex, fields);
                  }} className="mr-1 mt-0.5" />
                  <span className="text-gray-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
            {showImportanceOther && (
              <input type="text" value={childData.educationImportanceDetails || ''} onChange={e => onChildChange(childIndex, 'educationImportanceDetails', e.target.value)} placeholder="Please describe..." className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
            )}
          </div>
        )}

        {/* Education-specific fairness */}
        {triggersFairness && (
          <div className="mb-4">
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 mb-3">
              <p className="text-sm text-amber-100 leading-relaxed">
                If {childName}'s schooling were materially different from the schooling available to the Guardian's own children, how would you want that considered?
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {EDUCATION_FAIRNESS_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={fairnessPrinciples.includes(value)} onChange={() => toggleFairness(value)} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500 mt-0.5" />
                  <span className="text-gray-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
            {showFairnessOther && (
              <input type="text" value={childData.educationFairnessPrinciplesOther || ''} onChange={e => onChildChange(childIndex, 'educationFairnessPrinciplesOther', e.target.value)} placeholder="Please describe..." className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
            )}
          </div>
        )}

        {/* Future education aspirations */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <h6 className="text-sm font-semibold text-gray-300 mb-3">Looking Ahead: Future Education & Training</h6>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              When you think about {childName} becoming an adult, what do you currently hope or expect for their education or training?
            </label>
            <div className="flex flex-col gap-2">
              {EDUCATION_PATH_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={paths.includes(value)} onChange={() => togglePath(value)} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500" />
                  <span className="text-gray-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
            {showPathOther && (
              <input type="text" value={childData.futureEducationPathsOther || ''} onChange={e => onChildChange(childIndex, 'futureEducationPathsOther', e.target.value)} placeholder="Please describe..." className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Do you currently expect to financially support {childName} through post-secondary education, training or their transition into independence?
            </label>
            <div className="flex flex-col gap-2">
              {FINANCIAL_SUPPORT_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name={`futureEducationFinancialSupport-${childIndex}`} value={value} checked={childData.futureEducationFinancialSupport === value} onChange={e => {
                    const val = e.target.value;
                    const fields: Record<string, string> = { futureEducationFinancialSupport: val };
                    if (val !== 'other') fields.futureEducationFinancialSupportOther = '';
                    onChildMultiChange(childIndex, fields);
                  }} className="mr-1" />
                  <span className="text-gray-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
            {showFinancialOther && (
              <input type="text" value={childData.futureEducationFinancialSupportOther || ''} onChange={e => onChildChange(childIndex, 'futureEducationFinancialSupportOther', e.target.value)} placeholder="Please describe..." className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Is there anything you would want a future Guardian to understand about your hopes for {childName}'s education, training or path into adulthood? (Optional)
            </label>
            <textarea value={childData.futureEducationNotes || ''} onChange={e => onChildChange(childIndex, 'futureEducationNotes', e.target.value)} placeholder="Any thoughts about education or training goals..." rows={3} className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        </div>
      </div>
    );
  };

  const FAMILY_FAIRNESS_OPTIONS = [
    { value: 'preserve_important_opportunities', label: 'Preserve important opportunities — "Where resources allow, we would like important existing opportunities for our children to continue."' },
    { value: 'prioritize_need_based', label: 'Prioritize need-based supports — "We would give particular priority to expenses connected to disability, health, education, learning or wellbeing."' },
    { value: 'consider_whole_household', label: 'Consider the whole household — "We would want the Guardian and Trustee to consider how significant differences could affect all of the children living in the household."' },
    { value: 'guardian_flexibility', label: 'Guardian flexibility — "We want the Guardian to have meaningful flexibility to adapt our wishes to the realities of their family."' },
    { value: 'shared_household_benefit_reasonable', label: 'Shared-household benefit can be reasonable — "Where our resources and estate plan allow, we would be comfortable with some spending that also benefits the Guardian\'s family when it helps the household function well."' },
    { value: 'childrens_resources_for_them', label: 'Our children\'s resources should remain primarily for them — "We would generally prefer resources intended for our children to remain primarily for their benefit."' },
    { value: 'discuss_significant_differences', label: 'Discuss significant differences — "We would want the Guardian and Trustee to discuss significant differences rather than treating our wishes as rigid instructions."' },
    { value: 'other', label: 'Other' },
  ];

  const renderFamilyFairnessAndTrust = () => {
    const guardianId = childData.guardianPersonId;
    const guardianPerson = getPerson(guardianId);
    if (!guardianId || !guardianPerson) return null;
    const guardianFirstName = (guardianPerson.name || 'the guardian').split(' ')[0];

    const fairnessPrinciples = (childData.familyFairnessPrinciples || '').split(',').filter(Boolean);
    const showFairnessOther = fairnessPrinciples.includes('other');

    const toggleFairness = (value: string) => {
      const next = fairnessPrinciples.includes(value) ? fairnessPrinciples.filter(v => v !== value) : [...fairnessPrinciples, value];
      const fields: Record<string, string> = { familyFairnessPrinciples: next.join(',') };
      if (!next.includes('other')) fields.familyFairnessPrinciplesOther = '';
      onChildMultiChange(childIndex, fields);
    };

    return (
      <div className="mt-6 pt-4 border-t border-gray-600">
        <div className="pb-2 border-b border-gray-500 mb-3">
          <h5 className="text-base font-semibold text-blue-400 flex items-center gap-2">
            <Users size={18} />
            Life in the Guardian Household
          </h5>
        </div>

        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-100 leading-relaxed">
            Sometimes preserving opportunities for one child can affect the household they would be joining. For example, your child may attend a private or specialized school, participate in expensive activities, or have supports that the Guardian's own children do not. There may be very good reasons to preserve those opportunities — particularly where they support a child's disability, health, learning or stability. At the same time, differences can affect how children experience fairness, belonging and family life. There isn't one right answer. The goal is to help your future Guardian and Trustee understand how you would want them to think about these situations.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            If differences in resources or opportunities ever became significant within the Guardian's household, how would you want your Guardian and Trustee to think about them? (Select all that apply)
          </label>
          <div className="flex flex-col gap-2">
            {FAMILY_FAIRNESS_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={fairnessPrinciples.includes(value)} onChange={() => toggleFairness(value)} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500 mt-0.5" />
                <span className="text-gray-300 text-sm">{label}</span>
              </label>
            ))}
          </div>
          {showFairnessOther && (
            <input type="text" value={childData.familyFairnessPrinciplesOther || ''} onChange={e => onChildChange(childIndex, 'familyFairnessPrinciplesOther', e.target.value)} placeholder="Please describe..." className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
          )}
        </div>
      </div>
    );
  };

  const renderWhatWeTrust = () => {
    const guardianId = childData.guardianPersonId;
    const guardianPerson = getPerson(guardianId);
    if (!guardianId || !guardianPerson) return null;
    const guardianFirstName = (guardianPerson.name || 'the guardian').split(' ')[0];

    return (
      <div className="mt-6 pt-4 border-t border-gray-600">
        <div className="pb-2 border-b border-gray-500 mb-3">
          <h5 className="text-base font-semibold text-blue-400 flex items-center gap-2">
            <Lightbulb size={18} />
            What We Trust {guardianFirstName} to Decide
          </h5>
        </div>

        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-100 leading-relaxed">
            No plan can anticipate every circumstance. These questions are about the areas where you have preferences, but would not want {guardianFirstName} to feel they had failed you simply because circumstances required a different choice.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What decisions would you want {guardianFirstName} to feel trusted to make using their own judgment?
          </label>
          <textarea
            value={childData.guardianTrustedDecisions || ''}
            onChange={e => onChildChange(childIndex, 'guardianTrustedDecisions', e.target.value)}
            placeholder="Think about the areas where you have preferences, but would not want to create rigid instructions..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Are there any wishes you've expressed in this Roadmap that you would consider especially important to preserve where reasonably possible?
          </label>
          <textarea
            value={childData.guardianEspeciallyImportantWishes || ''}
            onChange={e => onChildChange(childIndex, 'guardianEspeciallyImportantWishes', e.target.value)}
            placeholder="Share the wishes that matter most to you..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
    );
  };

  const subHeading = classification === 'minor' ? 'Guardian Planning' : 'Future Support Planning';
  const SubIcon = classification === 'minor' ? ShieldCheck : Heart;

  return (
    <>
      <div className="mt-8 pt-6 border-t-2 border-blue-500/30">
        <h4 className="text-lg font-semibold text-white">
          Planning for {childName} if you're unable to provide care
        </h4>
      </div>

      <div className="mt-2 pb-2 border-b border-gray-500 mb-2">
        <h5 className="text-base font-semibold text-blue-400 flex items-center gap-2">
          <SubIcon size={18} />
          {subHeading}
        </h5>
      </div>

      {classification === 'minor' && renderGuardianPlanning()}
      {classification === 'minor' && renderWhyWeChoseYou()}
      {classification === 'adult_dependant' && renderFutureSupportPlanning()}
      {(classification === 'minor' || classification === 'adult_dependant') && renderFutureEducation()}
      {classification === 'minor' && renderFamilyFairnessAndTrust()}
      {classification === 'minor' && renderWhatWeTrust()}
    </>
  );
}
