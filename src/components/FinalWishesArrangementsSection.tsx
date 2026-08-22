import { useState, useMemo, useCallback } from 'react';
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Building,
  Sparkles,
  MessageSquareHeart,
} from 'lucide-react';
import DocumentLocationPicker from './DocumentLocationPicker';
import PersonPicker from './PersonPicker';
import type { DocumentLocationRef } from '../lib/documentLocationTypes';
import type { PersonRef } from '../lib/personRepositoryTypes';
import type {
  FinalWishesProfile,
  ExistingArrangementsStatus,
  ArrangementType,
  PrepaidStatus,
  DispositionPreference,
  GatheringPreference,
  MemorialDonationPreference,
  YesNoNotSure,
  ExternalContact,
} from '../lib/finalWishesTypes';
import {
  emptyProfile,
  loadData,
  ARRANGEMENT_TYPE_LABELS,
  PREPAID_STATUS_LABELS,
  DISPOSITION_LABELS,
  GATHERING_LABELS,
  generateExternalContactId,
  buildExecutorSummary,
} from '../lib/finalWishesTypes';

type Props = {
  answers: Record<string, unknown>;
  allAnswers?: Map<string, Record<string, unknown>>;
  onAnswerChange: (key: string, value: unknown) => void;
};

const DATA_KEY = 'finalWishesData';

const inputClass = 'w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const sectionCardClass = 'border border-gray-700 rounded-xl p-6 bg-gray-800/50 space-y-4';

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left ${
        selected
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-750'
      }`}
    >
      {label}
    </button>
  );
}

function YesNoNotSureButtons({
  value,
  onClick,
  includeNoPreference = false,
}: {
  value: string | undefined;
  onClick: (v: string) => void;
  includeNoPreference?: boolean;
}) {
  const options = includeNoPreference
    ? [
        { v: 'yes', l: 'Yes' },
        { v: 'no', l: 'No' },
        { v: 'no_preference', l: 'No preference' },
        { v: 'not_sure', l: "I'm not sure" },
      ]
    : [
        { v: 'yes', l: 'Yes' },
        { v: 'no', l: 'No' },
        { v: 'not_sure', l: "I'm not sure" },
      ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {options.map((o) => (
        <OptionButton key={o.v} label={o.l} selected={value === o.v} onClick={() => onClick(o.v)} />
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-300 mb-2">{children}</label>;
}

type Screen = 'intro' | 'profile' | 'review';

export default function FinalWishesArrangementsSection({ answers, allAnswers, onAnswerChange }: Props) {

  const aboutAnswers = allAnswers?.get('aboutYou') || {};
  const client1Name = (aboutAnswers['fullName'] as string) || 'Client 1';
  const hasSpouse = aboutAnswers['maritalStatus'] === 'married' || aboutAnswers['maritalStatus'] === 'common_law';
  const client2Name = (aboutAnswers['spouseName'] as string) || 'Client 2';
  const client1PersonId = (aboutAnswers['client1PersonId'] as string) || 'client1';
  const client2PersonId = (aboutAnswers['client2PersonId'] as string) || 'client2';

  const data = useMemo(() => loadData(answers), [answers]);
  const [screen, setScreen] = useState<Screen>('intro');
  const [activePersonId, setActivePersonId] = useState<string | null>(null);

  const activeProfiles = data.profiles.filter((p) => p.status === 'active');

  const getOrCreateProfile = useCallback(
    (personId: string, personName: string): FinalWishesProfile => {
      const existing = data.profiles.find((p) => p.personId === personId && p.status === 'active');
      if (existing) return existing;
      const profile = emptyProfile(personId, personName);
      const newData = { ...data, profiles: [...data.profiles, profile] };
      onAnswerChange(DATA_KEY, newData);
      return profile;
    },
    [data, onAnswerChange],
  );

  const updateProfile = useCallback(
    (personId: string, updates: Partial<FinalWishesProfile>) => {
      const newData = {
        ...data,
        profiles: data.profiles.map((p) =>
          p.personId === personId && p.status === 'active' ? { ...p, ...updates } : p,
        ),
      };
      onAnswerChange(DATA_KEY, newData);
    },
    [data, onAnswerChange],
  );

  const activeProfile = activePersonId
    ? data.profiles.find((p) => p.personId === activePersonId && p.status === 'active')
    : undefined;

  // ── INTRO ──
  if (screen === 'intro') {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-7 h-7 text-rose-400" />
            <h2 className="text-2xl font-bold text-white">Final Wishes &amp; Arrangements</h2>
          </div>
          <p className="text-gray-400 leading-relaxed">
            This doesn't need to be a detailed funeral plan.
          </p>
          <p className="text-gray-400 leading-relaxed mt-3">
            Some people have very specific wishes. Others simply want their family to know what matters
            to them — or to know they're comfortable leaving the decisions to the people they love.
          </p>
          <p className="text-gray-400 leading-relaxed mt-3">
            We'll help you capture as much or as little as you'd like, along with where any existing
            arrangements or documents can be found.
          </p>
          <p className="text-sm text-gray-500 mt-4 italic">
            These are your wishes and practical instructions for the people looking after your affairs.
            If you have formal arrangements or documents, we'll also help your family know where to find them.
          </p>
        </div>

        <div className={sectionCardClass}>
          <h3 className="text-lg font-semibold text-white">Whose wishes would you like to start with?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                getOrCreateProfile(client1PersonId, client1Name);
                setActivePersonId(client1PersonId);
                setScreen('profile');
              }}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
            >
              {client1Name}
              <ArrowRight className="w-5 h-5" />
            </button>
            {hasSpouse && (
              <button
                type="button"
                onClick={() => {
                  getOrCreateProfile(client2PersonId, client2Name);
                  setActivePersonId(client2PersonId);
                  setScreen('profile');
                }}
                className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
              >
                {client2Name}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
          {hasSpouse && (
            <p className="text-sm text-gray-500 mt-2">
              Each person's wishes are captured separately. You can complete both, or just one for now.
            </p>
          )}
        </div>

        {activeProfiles.length > 0 && (
          <div className={sectionCardClass}>
            <h3 className="text-lg font-semibold text-white">Already started</h3>
            <div className="space-y-2">
              {activeProfiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div>
                    <span className="text-white font-medium">{p.personName}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {p.existingArrangementsStatus === 'yes'
                        ? 'Arrangements recorded'
                        : p.dispositionPreference !== 'no_preference'
                          ? `${DISPOSITION_LABELS[p.dispositionPreference]}`
                          : 'Started'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setActivePersonId(p.personId); setScreen('profile'); }}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Continue
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setScreen('review')}
                className="w-full text-sm text-gray-400 hover:text-gray-200 py-2"
              >
                Review all wishes
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── PROFILE ──
  if (screen === 'profile' && activeProfile) {
    const p = activeProfile;
    const update = (updates: Partial<FinalWishesProfile>) => updateProfile(p.personId, updates);

    const toggleArrangementType = (t: ArrangementType) => {
      const has = p.arrangementTypes.includes(t);
      update({
        arrangementTypes: has
          ? p.arrangementTypes.filter((x) => x !== t)
          : [...p.arrangementTypes, t],
      });
    };

    const toggleGathering = (g: GatheringPreference) => {
      const has = p.gatheringPreferences.includes(g);
      update({
        gatheringPreferences: has
          ? p.gatheringPreferences.filter((x) => x !== g)
          : [...p.gatheringPreferences, g],
      });
    };

    const addExternalContact = (field: 'traditionsExternalContacts' | 'importantExternalContacts') => {
      const newContact: ExternalContact = {
        id: generateExternalContactId(),
        name: '',
        type: 'organization',
      };
      update({ [field]: [...p[field], newContact] } as Partial<FinalWishesProfile>);
    };

    const updateExternalContact = (
      field: 'traditionsExternalContacts' | 'importantExternalContacts',
      id: string,
      contactUpdates: Partial<ExternalContact>,
    ) => {
      update({
        [field]: p[field].map((c) => (c.id === id ? { ...c, ...contactUpdates } : c)),
      } as Partial<FinalWishesProfile>);
    };

    const removeExternalContact = (
      field: 'traditionsExternalContacts' | 'importantExternalContacts',
      id: string,
    ) => {
      update({ [field]: p[field].filter((c) => c.id !== id) } as Partial<FinalWishesProfile>);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen('intro')}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">{p.personName}'s Final Wishes</h2>
        </div>

        {/* ── Existing Arrangements ── */}
        <div className={sectionCardClass}>
          <h3 className="text-base font-semibold text-white">Existing Arrangements</h3>
          <div>
            <Label>Have you already made any funeral, burial, cremation or related arrangements?</Label>
            <YesNoNotSureButtons
              value={p.existingArrangementsStatus}
              onClick={(v) => update({ existingArrangementsStatus: v as ExistingArrangementsStatus })}
            />
          </div>

          {p.existingArrangementsStatus === 'yes' && (
            <>
              <div>
                <Label>What arrangements have you made?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(ARRANGEMENT_TYPE_LABELS) as ArrangementType[]).map((t) => (
                    <OptionButton
                      key={t}
                      label={ARRANGEMENT_TYPE_LABELS[t]}
                      selected={p.arrangementTypes.includes(t)}
                      onClick={() => toggleArrangementType(t)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Who are the arrangements with?</Label>
                <input
                  type="text"
                  value={p.providerName || ''}
                  onChange={(e) => update({ providerName: e.target.value })}
                  placeholder="Funeral home or provider name"
                  className={inputClass}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <input
                    type="text"
                    value={p.providerContact || ''}
                    onChange={(e) => update({ providerContact: e.target.value })}
                    placeholder="Contact person (optional)"
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    value={p.providerPhone || ''}
                    onChange={(e) => update({ providerPhone: e.target.value })}
                    placeholder="Phone (optional)"
                    className={inputClass}
                  />
                </div>
                <input
                  type="email"
                  value={p.providerEmail || ''}
                  onChange={(e) => update({ providerEmail: e.target.value })}
                  placeholder="Email (optional)"
                  className={`${inputClass} mt-3`}
                />
              </div>

              <div>
                <Label>Have any of these arrangements been prepaid?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(Object.keys(PREPAID_STATUS_LABELS) as PrepaidStatus[]).map((s) => (
                    <OptionButton
                      key={s}
                      label={PREPAID_STATUS_LABELS[s]}
                      selected={p.prepaidStatus === s}
                      onClick={() => update({ prepaidStatus: s })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Where could your family find the documents or details?</Label>
                <DocumentLocationPicker
                  label=""
                  value={p.documentLocationRefs.length > 0 ? p.documentLocationRefs : undefined}
                  onChange={(v) => {
                    const refs = Array.isArray(v) ? v : v ? [v] : [];
                    update({ documentLocationRefs: refs as DocumentLocationRef[] });
                  }}
                  multi={true}
                  placeholder="Select or add a location"
                />
              </div>
            </>
          )}
        </div>

        {/* ── Disposition ── */}
        <div className={sectionCardClass}>
          <p className="text-sm text-gray-400 italic">
            Some people have strong preferences about what happens after they die. Others don't. Either answer is completely fine.
          </p>
          <div>
            <Label>Do you have a preference for burial or cremation?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(DISPOSITION_LABELS) as DispositionPreference[]).map((d) => (
                <OptionButton
                  key={d}
                  label={DISPOSITION_LABELS[d]}
                  selected={p.dispositionPreference === d}
                  onClick={() => update({ dispositionPreference: d })}
                />
              ))}
            </div>
          </div>

          {p.dispositionPreference === 'burial' && (
            <div>
              <Label>Is there a particular cemetery or place that's important to you?</Label>
              <input
                type="text"
                value={p.dispositionNotes || ''}
                onChange={(e) => update({ dispositionNotes: e.target.value })}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
          )}

          {p.dispositionPreference === 'cremation' && (
            <div>
              <Label>Do you have any wishes for your ashes?</Label>
              <input
                type="text"
                value={p.dispositionNotes || ''}
                onChange={(e) => update({ dispositionNotes: e.target.value })}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
          )}

          {p.dispositionPreference === 'other_arrangements' && (
            <div>
              <Label>What would you want your family to know?</Label>
              <textarea
                value={p.dispositionNotes || ''}
                onChange={(e) => update({ dispositionNotes: e.target.value })}
                placeholder="Optional"
                rows={2}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* ── Gathering ── */}
        <div className={sectionCardClass}>
          <div>
            <Label>Is there anything you'd want your family to know about how you'd like to be remembered or brought together?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(GATHERING_LABELS) as GatheringPreference[]).map((g) => (
                <OptionButton
                  key={g}
                  label={GATHERING_LABELS[g]}
                  selected={p.gatheringPreferences.includes(g)}
                  onClick={() => toggleGathering(g)}
                />
              ))}
            </div>
          </div>
          {p.gatheringPreferences.length > 0 && p.gatheringPreferences[0] !== 'no_preference' && (
            <div>
              <Label>Anything you'd like to add?</Label>
              <textarea
                value={p.gatheringNotes || ''}
                onChange={(e) => update({ gatheringNotes: e.target.value })}
                placeholder="Optional"
                rows={2}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* ── Traditions ── */}
        <div className={sectionCardClass}>
          <div>
            <Label>Are there any religious, cultural or family traditions that would be important to you?</Label>
            <YesNoNotSureButtons
              value={p.traditionsImportant}
              includeNoPreference={true}
              onClick={(v) => update({ traditionsImportant: v as YesNoNotSure })}
            />
          </div>

          {p.traditionsImportant === 'yes' && (
            <>
              <div>
                <Label>Tell us what you'd want your family to know.</Label>
                <textarea
                  value={p.traditionsNotes || ''}
                  onChange={(e) => update({ traditionsNotes: e.target.value })}
                  placeholder="Optional"
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <Label>Is there a person or community your family should contact?</Label>
                <p className="text-xs text-gray-500 mb-2">
                  A member of your family, close friend, priest, minister, rabbi, imam, spiritual leader, church, synagogue, mosque, temple or another community.
                </p>
                <PersonPicker
                  label=""
                  value={p.traditionsContactPersonRefs.length > 0 ? p.traditionsContactPersonRefs : undefined}
                  onChange={(v) => {
                    const refs = Array.isArray(v) ? v : v ? [v] : [];
                    update({ traditionsContactPersonRefs: refs as PersonRef[] });
                  }}
                  multi={true}
                  defaultPersonType="trusted"
                  showContactFields={true}
                  placeholder="Select or add a person"
                />
                <div className="mt-3 space-y-2">
                  {p.traditionsExternalContacts.map((c) => (
                    <ExternalContactEditor
                      key={c.id}
                      contact={c}
                      onUpdate={(cu) => updateExternalContact('traditionsExternalContacts', c.id, cu)}
                      onRemove={() => removeExternalContact('traditionsExternalContacts', c.id)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => addExternalContact('traditionsExternalContacts')}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add an organization or community
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── People to Notify ── */}
        <div className={sectionCardClass}>
          <div>
            <Label>Are there people who may not be obvious to your family, but who you would want notified if you died?</Label>
            <p className="text-xs text-gray-500 mb-2">
              For example, a close friend, former colleague, neighbour, extended family member, community member or someone who lives elsewhere.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <OptionButton label="Yes" selected={p.notificationPersonRefs.length > 0} onClick={() => {}} />
              <OptionButton label="No" selected={p.notificationPersonRefs.length === 0} onClick={() => update({ notificationPersonRefs: [] })} />
            </div>
          </div>
          {p.notificationPersonRefs.length > 0 || true ? (
            <PersonPicker
              label=""
              value={p.notificationPersonRefs.length > 0 ? p.notificationPersonRefs : undefined}
              onChange={(v) => {
                const refs = Array.isArray(v) ? v : v ? [v] : [];
                update({ notificationPersonRefs: refs as PersonRef[] });
              }}
              multi={true}
              defaultPersonType="trusted"
              showContactFields={true}
              placeholder="Select or add people to notify"
            />
          ) : null}
        </div>

        {/* ── Important Contact ── */}
        <div className={sectionCardClass}>
          <div>
            <Label>Is there someone your family should contact about your wishes or arrangements?</Label>
            <YesNoNotSureButtons
              value={p.importantContactPersonRefs.length > 0 || p.importantExternalContacts.length > 0 ? 'yes' : undefined}
              onClick={(v) => {
                if (v === 'no' || v === 'not_sure') {
                  update({ importantContactPersonRefs: [], importantExternalContacts: [] });
                }
              }}
            />
          </div>
          {(p.importantContactPersonRefs.length > 0 || p.importantExternalContacts.length > 0) && (
            <>
              <PersonPicker
                label="Person"
                value={p.importantContactPersonRefs.length > 0 ? p.importantContactPersonRefs : undefined}
                onChange={(v) => {
                  const refs = Array.isArray(v) ? v : v ? [v] : [];
                  update({ importantContactPersonRefs: refs as PersonRef[] });
                }}
                multi={true}
                defaultPersonType="trusted"
                showContactFields={true}
                placeholder="Select or add a person"
              />
              <div className="mt-3 space-y-2">
                {p.importantExternalContacts.map((c) => (
                  <ExternalContactEditor
                    key={c.id}
                    contact={c}
                    onUpdate={(cu) => updateExternalContact('importantExternalContacts', c.id, cu)}
                    onRemove={() => removeExternalContact('importantExternalContacts', c.id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addExternalContact('importantExternalContacts')}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add an organization or provider
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Additional Wishes ── */}
        <div className={sectionCardClass}>
          <div>
            <Label>Would you like to leave any more specific wishes?</Label>
            <YesNoNotSureButtons
              value={p.hasMoreSpecificWishes}
              onClick={(v) => update({ hasMoreSpecificWishes: v as YesNoNotSure })}
            />
          </div>
          {p.hasMoreSpecificWishes === 'yes' && (
            <div>
              <textarea
                value={p.additionalWishes || ''}
                onChange={(e) => update({ additionalWishes: e.target.value })}
                placeholder="You might include music, readings, photos, people you'd like involved, where you'd like people to gather, flowers, charitable donations, or anything else that would make the day feel like you."
                rows={4}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* ── Memorial Donations ── */}
        <div className={sectionCardClass}>
          <div>
            <Label>Is there a charity, cause or organization you'd like people to support in your memory?</Label>
            <p className="text-xs text-gray-500 mb-2">
              This is about memorial donations or how you'd like people to honour you. It is not a legal charitable gift from your estate.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { v: 'yes', l: 'Yes' },
                { v: 'no', l: 'No' },
                { v: 'no_preference', l: 'No preference' },
              ].map((o) => (
                <OptionButton
                  key={o.v}
                  label={o.l}
                  selected={p.memorialDonationPreference === o.v}
                  onClick={() => update({ memorialDonationPreference: o.v as MemorialDonationPreference })}
                />
              ))}
            </div>
          </div>
          {p.memorialDonationPreference === 'yes' && (
            <>
              <input
                type="text"
                value={p.memorialOrganization || ''}
                onChange={(e) => update({ memorialOrganization: e.target.value })}
                placeholder="Organization or cause"
                className={inputClass}
              />
              <textarea
                value={p.memorialNotes || ''}
                onChange={(e) => update({ memorialNotes: e.target.value })}
                placeholder="Optional note"
                rows={2}
                className={inputClass}
              />
            </>
          )}
        </div>

        {/* ── Human Question ── */}
        <div className={sectionCardClass}>
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-rose-400" />
            <Label>When your family is making these decisions, what would you most want them to keep in mind?</Label>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            You might have a very specific wish. Or it may simply be something like "keep it simple," "don't spend a lot of money," "make it a celebration," or "do whatever brings everyone comfort."
          </p>
          <textarea
            value={p.familyGuidance || ''}
            onChange={(e) => update({ familyGuidance: e.target.value })}
            placeholder="Optional"
            rows={3}
            className={inputClass}
          />
        </div>

        {/* ── Important to Know ── */}
        <div className={sectionCardClass}>
          <div>
            <Label>Is there anything here that would be especially important for your family to know ahead of time?</Label>
            <YesNoNotSureButtons
              value={p.importantToKnow}
              onClick={(v) => update({ importantToKnow: v as YesNoNotSure })}
            />
          </div>
          {p.importantToKnow === 'yes' && (
            <textarea
              value={p.importantToKnowNotes || ''}
              onChange={(e) => update({ importantToKnowNotes: e.target.value })}
              placeholder="What would you want them to understand?"
              rows={3}
              className={inputClass}
            />
          )}
        </div>

        {/* ── Obituary ── */}
        <div className={sectionCardClass}>
          <div>
            <Label>Have you already written anything you'd want your family to use for an obituary, memorial or announcement?</Label>
            <YesNoNotSureButtons
              value={p.hasObituaryWritten}
              onClick={(v) => update({ hasObituaryWritten: v as YesNoNotSure })}
            />
          </div>
          {p.hasObituaryWritten === 'yes' && (
            <>
              <DocumentLocationPicker
                label="Where can it be found?"
                value={p.obituaryLocationRefs.length > 0 ? p.obituaryLocationRefs : undefined}
                onChange={(v) => {
                  const refs = Array.isArray(v) ? v : v ? [v] : [];
                  update({ obituaryLocationRefs: refs as DocumentLocationRef[] });
                }}
                multi={true}
                placeholder="Select or add a location"
              />
              <div className="mt-3">
                <Label>Is there a photo you'd particularly want your family to use?</Label>
                <YesNoNotSureButtons
                  value={p.hasPreferredPhoto}
                  onClick={(v) => update({ hasPreferredPhoto: v as YesNoNotSure })}
                />
              </div>
              {p.hasPreferredPhoto === 'yes' && (
                <DocumentLocationPicker
                  label="Where can the photo be found?"
                  value={p.photoLocationRefs.length > 0 ? p.photoLocationRefs : undefined}
                  onChange={(v) => {
                    const refs = Array.isArray(v) ? v : v ? [v] : [];
                    update({ photoLocationRefs: refs as DocumentLocationRef[] });
                  }}
                  multi={true}
                  placeholder="Select or add a location"
                />
              )}
            </>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => setScreen('intro')}
            className="px-5 py-2.5 text-gray-400 hover:text-gray-200 font-medium transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setScreen('review')}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-all"
          >
            <Check className="w-4 h-4" />
            Save &amp; Review
          </button>
        </div>
      </div>
    );
  }

  // ── REVIEW ──
  if (screen === 'review') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen('intro')}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">Final Wishes Review</h2>
        </div>

        {activeProfiles.length === 0 && (
          <div className={sectionCardClass}>
            <p className="text-gray-400">No final wishes have been recorded yet.</p>
            <button
              type="button"
              onClick={() => setScreen('intro')}
              className="text-blue-400 hover:text-blue-300"
            >
              Start with {client1Name}
            </button>
          </div>
        )}

        {activeProfiles.map((profile) => {
          const summary = buildExecutorSummary(profile);
          const isLowPreference =
            profile.existingArrangementsStatus === 'no' &&
            profile.dispositionPreference === 'no_preference' &&
            profile.gatheringPreferences.length === 0 &&
            profile.traditionsImportant !== 'yes' &&
            !profile.additionalWishes;

          return (
            <div key={profile.id} className={sectionCardClass}>
              <h3 className="text-lg font-semibold text-white">{profile.personName}'s Final Wishes</h3>

              {isLowPreference ? (
                <div className="py-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Sparkles className="w-5 h-5 text-rose-400" />
                    <p>You've chosen to leave these decisions largely to the people you trust.</p>
                  </div>
                  {profile.familyGuidance && (
                    <p className="text-sm text-gray-400 mt-3 italic">"{profile.familyGuidance}"</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.hasArrangements && (
                    <ReviewRow label="Existing arrangements" value={summary.arrangementTypes.map((t) => ARRANGEMENT_TYPE_LABELS[t]).join(', ')} />
                  )}
                  {summary.providerName && <ReviewRow label="Provider" value={summary.providerName} />}
                  {summary.isPrepaid && <ReviewRow label="Prepaid" value={summary.prepaidStatus ? PREPAID_STATUS_LABELS[summary.prepaidStatus] : 'Yes'} />}
                  {summary.documentLocations.length > 0 && (
                    <ReviewRow label="Documents" value={summary.documentLocations.map((l) => l.label).join(', ')} />
                  )}
                  <ReviewRow label="Preference" value={DISPOSITION_LABELS[summary.disposition]} />
                  {summary.dispositionNotes && <ReviewRow label="" value={summary.dispositionNotes} />}
                  {summary.gatheringPreferences.length > 0 && (
                    <ReviewRow label="Gathering" value={summary.gatheringPreferences.map((g) => GATHERING_LABELS[g]).join(', ')} />
                  )}
                  {summary.gatheringNotes && <ReviewRow label="" value={summary.gatheringNotes} />}
                  {summary.traditionsImportant === 'yes' && summary.traditionsNotes && (
                    <ReviewRow label="Traditions" value={summary.traditionsNotes} />
                  )}
                  {summary.traditionsContacts.length > 0 && (
                    <ReviewRow label="Tradition contacts" value={summary.traditionsContacts.join(', ')} />
                  )}
                  {summary.notificationPeople.length > 0 && (
                    <ReviewRow label="People to notify" value={summary.notificationPeople.join(', ')} />
                  )}
                  {summary.importantContacts.length > 0 && (
                    <ReviewRow label="Important contact" value={summary.importantContacts.join(', ')} />
                  )}
                  {summary.additionalWishes && (
                    <ReviewRow label="Additional wishes" value={summary.additionalWishes} />
                  )}
                  {summary.memorialDonationPreference === 'yes' && summary.memorialOrganization && (
                    <ReviewRow label="Memorial donations" value={summary.memorialOrganization} />
                  )}
                  {summary.hasObituaryWritten === 'yes' && summary.obituaryLocations.length > 0 && (
                    <ReviewRow label="Obituary" value={summary.obituaryLocations.map((l) => l.label).join(', ')} />
                  )}

                  {profile.familyGuidance && (
                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">What {profile.personName} would like their family to know</p>
                      <p className="text-sm text-gray-200 italic">"{profile.familyGuidance}"</p>
                    </div>
                  )}

                  {profile.importantToKnow === 'yes' && profile.importantToKnowNotes && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Important to know ahead of time</p>
                      <p className="text-sm text-gray-200 italic">"{profile.importantToKnowNotes}"</p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => { setActivePersonId(profile.personId); setScreen('profile'); }}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
              >
                Edit {profile.personName}'s wishes
              </button>
            </div>
          );
        })}

        {hasSpouse && activeProfiles.length < 2 && (
          <div className={sectionCardClass}>
            <p className="text-gray-400">
              {activeProfiles.find((p) => p.personId === client1PersonId) ? client2Name : client1Name}'s wishes haven't been recorded yet.
            </p>
            <button
              type="button"
              onClick={() => {
                const personId = activeProfiles.find((p) => p.personId === client1PersonId) ? client2PersonId : client1PersonId;
                const personName = activeProfiles.find((p) => p.personId === client1PersonId) ? client2Name : client1Name;
                getOrCreateProfile(personId, personName);
                setActivePersonId(personId);
                setScreen('profile');
              }}
              className="text-blue-400 hover:text-blue-300 mt-2"
            >
              Add {activeProfiles.find((p) => p.personId === client1PersonId) ? client2Name : client1Name}'s wishes
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setScreen('intro')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
      {label && <span className="text-xs text-gray-500 uppercase tracking-wide sm:w-40 sm:flex-shrink-0">{label}</span>}
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  );
}

function ExternalContactEditor({
  contact,
  onUpdate,
  onRemove,
}: {
  contact: ExternalContact;
  onUpdate: (updates: Partial<ExternalContact>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-2">
      <div className="flex items-start justify-between">
        <Building className="w-4 h-4 text-gray-500 mt-2" />
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        type="text"
        value={contact.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Organization or community name"
        className={inputClass}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="tel"
          value={contact.phone || ''}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          placeholder="Phone (optional)"
          className={inputClass}
        />
        <input
          type="email"
          value={contact.email || ''}
          onChange={(e) => onUpdate({ email: e.target.value })}
          placeholder="Email (optional)"
          className={inputClass}
        />
      </div>
      <input
        type="text"
        value={contact.relationship || ''}
        onChange={(e) => onUpdate({ relationship: e.target.value })}
        placeholder="Role or relationship (optional)"
        className={inputClass}
      />
    </div>
  );
}
