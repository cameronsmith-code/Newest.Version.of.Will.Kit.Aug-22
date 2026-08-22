import { useState } from 'react';
import { Heart, Users, MapPin, Calendar, Star, Plus, Trash2, ChevronRight, Home } from 'lucide-react';
import type { PlanningPerson } from './ChildPlanningSection';

type Props = {
  childIndex: number;
  childData: Record<string, string>;
  childrenData: Array<Record<string, string>>;
  planningPersons: PlanningPerson[];
  minorIndices: number[];
  classification: 'minor' | 'independent_adult' | 'adult_dependant';
  onChildChange: (index: number, field: string, value: string) => void;
  onChildMultiChange: (index: number, fields: Record<string, string>) => void;
  onPlanningPersonsChange: (persons: PlanningPerson[]) => void;
};

const inputClass = 'w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm';
const labelClass = 'block text-sm font-medium text-gray-300 mb-2';
const cardClass = 'p-4 bg-gray-700/50 border border-gray-600 rounded-lg';

const YES_NO_UNSURE = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: "I'm not sure" },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'best_friend', label: 'Best / very close friend' },
  { value: 'close_friend', label: 'Close friend' },
  { value: 'school_friend', label: 'School friend' },
  { value: 'neighbourhood_friend', label: 'Neighbourhood friend' },
  { value: 'sports_friend', label: 'Sports / activity friend' },
  { value: 'camp_friend', label: 'Camp friend' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'family_friend', label: 'Family friend' },
  { value: 'trusted_adult', label: 'Trusted adult' },
  { value: 'coach_mentor', label: 'Coach / mentor' },
  { value: 'other', label: 'Other' },
];

const CONTEXT_OPTIONS = [
  { value: 'school', label: 'School' },
  { value: 'neighbourhood', label: 'Neighbourhood' },
  { value: 'sports', label: 'Hockey / Sports' },
  { value: 'camp', label: 'Camp' },
  { value: 'club_activity', label: 'Club / Activity' },
  { value: 'family_connection', label: 'Family connection' },
  { value: 'family_friends', label: 'Family friends' },
  { value: 'faith_community', label: 'Faith / Community group' },
  { value: 'other', label: 'Other' },
];

const IMPORTANCE_OPTIONS = [
  { value: 'especially_important', label: 'Especially important' },
  { value: 'important', label: 'Important' },
  { value: 'nice_to_maintain', label: 'Nice to maintain if practical' },
  { value: 'not_sure', label: "I'm not sure" },
];

const CONTINUITY_IDEAS = [
  { value: 'playdates_visits', label: 'Occasional playdates or visits' },
  { value: 'weekend_visits', label: 'Weekend visits' },
  { value: 'sleepovers', label: 'Sleepovers' },
  { value: 'camp_together', label: 'Attend overnight/summer camp together' },
  { value: 'shared_activity', label: 'Continue a shared activity where practical' },
  { value: 'birthdays_occasions', label: 'Birthdays and special occasions' },
  { value: 'school_holiday_visits', label: 'School-holiday visits' },
  { value: 'video_calls', label: 'Video calls' },
  { value: 'gaming_online', label: 'Gaming / online connection (age appropriate)' },
  { value: 'texting_messaging', label: 'Texting / messaging (age appropriate)' },
  { value: 'contact_friend_parents', label: 'Keep in contact with the friend\'s parents' },
  { value: 'let_evolve', label: 'Let the relationship evolve naturally as they get older' },
  { value: 'other', label: 'Other' },
  { value: 'not_sure', label: "I'm not sure" },
];

const CONTACT_OPTIONS = [
  { value: 'existing_person', label: 'Existing person from the questionnaire' },
  { value: 'add_contact', label: 'Add parent/guardian contact' },
  { value: 'no_contact_info', label: "We don't have their contact information" },
  { value: 'not_applicable', label: 'Not applicable' },
];

const COMMUNITY_TYPES = [
  { value: 'school_group', label: 'School friend group' },
  { value: 'neighbourhood', label: 'Neighbourhood friends' },
  { value: 'sports_team', label: 'Sports team' },
  { value: 'camp_community', label: 'Camp community' },
  { value: 'faith', label: 'Faith community' },
  { value: 'cultural', label: 'Cultural community' },
  { value: 'club_activity', label: 'Club / Activity group' },
  { value: 'cousins_family', label: 'Cousins / Extended family group' },
  { value: 'other', label: 'Other' },
];

const COMMUNITY_CONTINUE_OPTIONS = [
  { value: 'yes_practical', label: 'Yes, where practical' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no_preference', label: 'No particular preference' },
  { value: 'not_sure', label: "I'm not sure" },
];

const TRADITION_TYPES = [
  { value: 'overnight_camp', label: 'Overnight camp' },
  { value: 'day_camp', label: 'Day camp' },
  { value: 'cottage_week', label: 'Annual family cottage week' },
  { value: 'camping_trip', label: 'Camping trip' },
  { value: 'tournament', label: 'Hockey tournament / Sports event' },
  { value: 'cousin_weekend', label: 'Cousin weekend' },
  { value: 'birthday_tradition', label: 'Birthday tradition' },
  { value: 'holiday_gathering', label: 'Holiday gathering' },
  { value: 'religious_cultural', label: 'Religious / Cultural event' },
  { value: 'other', label: 'Other' },
];

const TRADITION_CONTINUE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'not_sure', label: "I'm not sure" },
];

const TRADITION_PARTICIPANT_OPTIONS = [
  { value: 'sibling', label: 'Sibling' },
  { value: 'close_friend', label: 'Close friend' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'grandparents', label: 'Grandparents' },
  { value: 'other_family', label: 'Other family' },
  { value: 'existing_connection', label: 'Existing connection' },
  { value: 'add_someone', label: 'Add someone else' },
];

function personName(planningPersons: PlanningPerson[], personId?: string): string {
  if (!personId) return '';
  const p = planningPersons.find(p => p.id === personId);
  return p?.name || '';
}

function parseJsonArray<T>(raw: string | undefined): T[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

type Connection = {
  id: string;
  displayName: string;
  connectionType: string;
  contexts: string[];
  importance: string;
  relationshipNotes: string;
  contactOption: string;
  contactPersonId: string;
  contactName: string;
  contactRelationship: string;
  contactPhone: string;
  contactEmail: string;
  continuityIdeas: string[];
  notes: string;
};

type Community = {
  id: string;
  type: string;
  name: string;
  importanceNotes: string;
  continuityPreference: string;
};

type Tradition = {
  id: string;
  type: string;
  name: string;
  participantTypes: string[];
  participantNotes: string;
  importanceNotes: string;
  continueIfPractical: string;
};

type BelongingData = {
  connections: Connection[];
  communities: Community[];
  traditions: Tradition[];
  familyRelationshipNotes: string;
  trustedAdultsAnswer: string;
  missedMost: string;
  feelConnected: string;
  reviewStatus: string;
};

function loadBelongingData(childData: Record<string, string>): BelongingData {
  return {
    connections: parseJsonArray<Connection>(childData.belongingConnections),
    communities: parseJsonArray<Community>(childData.belongingCommunities),
    traditions: parseJsonArray<Tradition>(childData.belongingTraditions),
    familyRelationshipNotes: childData.belongingFamilyNotes || '',
    trustedAdultsAnswer: childData.belongingTrustedAdults || '',
    missedMost: childData.belongingMissedMost || '',
    feelConnected: childData.belongingFeelConnected || '',
    reviewStatus: childData.belongingReviewStatus || '',
  };
}

function saveBelongingData(
  childIndex: number,
  data: BelongingData,
  onChildMultiChange: (index: number, fields: Record<string, string>) => void,
) {
  onChildMultiChange(childIndex, {
    belongingConnections: JSON.stringify(data.connections),
    belongingCommunities: JSON.stringify(data.communities),
    belongingTraditions: JSON.stringify(data.traditions),
    belongingFamilyNotes: data.familyRelationshipNotes,
    belongingTrustedAdults: data.trustedAdultsAnswer,
    belongingMissedMost: data.missedMost,
    belongingFeelConnected: data.feelConnected,
    belongingReviewStatus: data.reviewStatus,
  });
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function labelFromOptions(value: string, options: Array<{ value: string; label: string }>): string {
  return options.find(o => o.value === value)?.label || value;
}

function labelsFromOptions(values: string[], options: Array<{ value: string; label: string }>): string {
  return values.map(v => labelFromOptions(v, options)).join(' · ');
}

export default function ConnectionsBelongingSection({
  childIndex,
  childData,
  childrenData,
  planningPersons,
  minorIndices,
  classification,
  onChildChange,
  onChildMultiChange,
  onPlanningPersonsChange,
}: Props) {
  const childName = childData.nickname || childData.name || `Child ${childIndex + 1} (details to come)`;
  const data = loadBelongingData(childData);

  // Whether to show this section at all
  const guardianId = childData.guardianPersonId;
  if (classification === 'independent_adult') return null;
  if (classification === 'minor' && !guardianId) return null;

  const [expandedConnectionId, setExpandedConnectionId] = useState<string | null>(null);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [showAddTradition, setShowAddTradition] = useState(false);

  // Family relationship selections
  const familySelections = (childData.belongingFamilySelections || '').split(',').filter(Boolean);
  const toggleFamilySelection = (id: string) => {
    const next = familySelections.includes(id)
      ? familySelections.filter(v => v !== id)
      : [...familySelections, id];
    onChildChange(childIndex, 'belongingFamilySelections', next.join(','));
  };

  // Build family options from existing data
  const familyOptions: Array<{ id: string; name: string; relationship: string }> = [];
  // Adult independent siblings
  childrenData.forEach((c, i) => {
    if (minorIndices.includes(i)) return;
    if (c.independent === 'yes') {
      familyOptions.push({
        id: `adult_sib_${i}`,
        name: c.nickname || c.name || `Child ${i + 1}`,
        relationship: 'Adult sibling',
      });
    }
  });
  // Planning persons with family relationships
  planningPersons.forEach(p => {
    const rel = p.relationship.toLowerCase();
    if (rel.includes('grandparent') || rel.includes('cousin') || rel.includes('aunt') || rel.includes('uncle') || rel.includes('family friend')) {
      familyOptions.push({ id: p.id, name: p.name, relationship: p.relationship });
    }
  });
  // Other minor siblings
  minorIndices.forEach(i => {
    if (i === childIndex) return;
    const sib = childrenData[i];
    familyOptions.push({
      id: `sibling_${i}`,
      name: sib?.nickname || sib?.name || `Child ${i + 1}`,
      relationship: 'Sibling',
    });
  });

  // Existing activities for tradition reuse
  const activities = parseJsonArray<{ activityName: string; activityType: string }>(childData.activityList);

  // Move context from transition data
  const moveExpected = childData.transitionMoveExpected;
  const guardianName = personName(planningPersons, guardianId) || 'their guardian';
  const isLikelyMove = moveExpected === 'yes_most_likely' || moveExpected === 'possibly';

  // Friends main question
  const friendsAnswer = childData.belongingHasFriends || '';
  const communitiesAnswer = childData.belongingHasCommunities || '';
  const traditionsAnswer = childData.belongingHasTraditions || '';
  const trustedAdultsAnswer = childData.belongingHasTrustedAdults || '';

  const update = (newData: Partial<BelongingData>) => {
    const merged = { ...data, ...newData };
    saveBelongingData(childIndex, merged, onChildMultiChange);
  };

  // Connection helpers
  const addConnection = () => {
    const newConn: Connection = {
      id: genId('conn'),
      displayName: '',
      connectionType: '',
      contexts: [],
      importance: '',
      relationshipNotes: '',
      contactOption: '',
      contactPersonId: '',
      contactName: '',
      contactRelationship: '',
      contactPhone: '',
      contactEmail: '',
      continuityIdeas: [],
      notes: '',
    };
    update({ connections: [...data.connections, newConn] });
    setExpandedConnectionId(newConn.id);
    setShowAddConnection(false);
  };

  const updateConnection = (id: string, fields: Partial<Connection>) => {
    update({ connections: data.connections.map(c => c.id === id ? { ...c, ...fields } : c) });
  };

  const removeConnection = (id: string) => {
    update({ connections: data.connections.filter(c => c.id !== id) });
    if (expandedConnectionId === id) setExpandedConnectionId(null);
  };

  // Community helpers
  const addCommunity = () => {
    const newComm: Community = {
      id: genId('comm'),
      type: '',
      name: '',
      importanceNotes: '',
      continuityPreference: '',
    };
    update({ communities: [...data.communities, newComm] });
    setShowAddCommunity(false);
  };

  const updateCommunity = (id: string, fields: Partial<Community>) => {
    update({ communities: data.communities.map(c => c.id === id ? { ...c, ...fields } : c) });
  };

  const removeCommunity = (id: string) => {
    update({ communities: data.communities.filter(c => c.id !== id) });
  };

  // Tradition helpers
  const addTradition = () => {
    const newTrad: Tradition = {
      id: genId('trad'),
      type: '',
      name: '',
      participantTypes: [],
      participantNotes: '',
      importanceNotes: '',
      continueIfPractical: '',
    };
    update({ traditions: [...data.traditions, newTrad] });
    setShowAddTradition(false);
  };

  const updateTradition = (id: string, fields: Partial<Tradition>) => {
    update({ traditions: data.traditions.map(t => t.id === id ? { ...t, ...fields } : t) });
  };

  const removeTradition = (id: string) => {
    update({ traditions: data.traditions.filter(t => t.id !== id) });
  };

  // Create planning person for contact
  const createContactPerson = (): string => {
    const id = `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPerson: PlanningPerson = {
      id, name: '', relationship: '', phone: '', email: '', city: '', province: '', country: '',
    };
    onPlanningPersonsChange([...planningPersons, newPerson]);
    return id;
  };

  return (
    <div className="mt-6 pt-4 border-t border-blue-500/20">
      <h5 className="text-base font-semibold text-blue-400 flex items-center gap-2 mb-2">
        <Heart size={18} />
        Connections & Belonging
      </h5>

      {/* Introduction */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-5">
        <p className="text-sm text-blue-100 leading-relaxed mb-3">
          If {childName} ever had to move to live with their guardian, they could be leaving behind much more than their home. Their school, neighbourhood, activities and close friendships might all change at the same time.
        </p>
        <p className="text-sm text-blue-100 leading-relaxed mb-3">
          We'd like to capture the people and connections you would especially hope remain part of {childName}'s life.
        </p>
        <p className="text-xs text-blue-200/70 leading-relaxed">
          You don't need to list everyone. Just think about the people, groups and traditions that would be especially hard for {childName} to lose.
        </p>
      </div>

      {/* Move context */}
      {isLikelyMove && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 mb-5">
          <p className="text-sm text-amber-100 leading-relaxed">
            Because you've told us {childName} would likely move to {guardianName}'s community, these relationships may take more planning to maintain.
          </p>
        </div>
      )}

      {/* ===== IMPORTANT FRIENDS / CONNECTIONS ===== */}
      <div className="mb-6">
        <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
          <Users size={16} />
          Important Relationships
        </h6>

        <label className={labelClass}>
          Are there friends or other important people in {childName}'s life that you would especially hope they stay connected with?
        </label>
        <div className="flex flex-col gap-2 mb-3">
          {YES_NO_UNSURE.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`belongingHasFriends-${childIndex}`}
                value={value}
                checked={friendsAnswer === value}
                onChange={e => {
                  onChildMultiChange(childIndex, {
                    belongingHasFriends: e.target.value,
                    belongingConnections: '',
                  });
                  setExpandedConnectionId(null);
                  setShowAddConnection(false);
                }}
                className="mr-1"
              />
              <span className="text-gray-300 text-sm">{label}</span>
            </label>
          ))}
        </div>

        {/* Existing connections */}
        {friendsAnswer === 'yes' && data.connections.length > 0 && (
          <div className="space-y-3 mb-4">
            {data.connections.map(conn => (
              <div key={conn.id} className={cardClass}>
                {expandedConnectionId === conn.id ? (
                  <ConnectionEditor
                    conn={conn}
                    childName={childName}
                    planningPersons={planningPersons}
                    onUpdate={f => updateConnection(conn.id, f)}
                    onRemove={() => removeConnection(conn.id)}
                    onCollapse={() => setExpandedConnectionId(null)}
                    onCreateContactPerson={createContactPerson}
                  />
                ) : (
                  <ConnectionSummary
                    conn={conn}
                    onEdit={() => setExpandedConnectionId(conn.id)}
                    onRemove={() => removeConnection(conn.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add connection */}
        {friendsAnswer === 'yes' && (
          <>
            {!showAddConnection && expandedConnectionId === null && (
              <button
                onClick={() => setShowAddConnection(true)}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                <Plus size={16} />
                Add a connection
              </button>
            )}
            {showAddConnection && (
              <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                <label className={labelClass}>Who would you especially hope remains part of {childName}'s life?</label>
                <div className="flex gap-3">
                  <button
                    onClick={addConnection}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    Add someone
                  </button>
                  <button
                    onClick={() => setShowAddConnection(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  You can add friends, trusted adults, coaches or anyone important to {childName}. We'll ask for just enough information to help their guardian understand why this relationship matters.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== COMMUNITIES ===== */}
      <div className="mb-6 pt-4 border-t border-gray-700">
        <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
          <MapPin size={16} />
          Communities that feel like home
        </h6>

        <label className={labelClass}>
          Are there groups or communities that are an important part of {childName}'s sense of belonging?
        </label>
        <div className="flex flex-col gap-2 mb-3">
          {YES_NO_UNSURE.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`belongingHasCommunities-${childIndex}`}
                value={value}
                checked={communitiesAnswer === value}
                onChange={e => {
                  onChildMultiChange(childIndex, {
                    belongingHasCommunities: e.target.value,
                    belongingCommunities: '',
                  });
                  setShowAddCommunity(false);
                }}
                className="mr-1"
              />
              <span className="text-gray-300 text-sm">{label}</span>
            </label>
          ))}
        </div>

        {communitiesAnswer === 'yes' && data.communities.length > 0 && (
          <div className="space-y-3 mb-4">
            {data.communities.map(comm => (
              <div key={comm.id} className={cardClass}>
                <CommunityEditor
                  comm={comm}
                  activities={activities}
                  onUpdate={f => updateCommunity(comm.id, f)}
                  onRemove={() => removeCommunity(comm.id)}
                />
              </div>
            ))}
          </div>
        )}

        {communitiesAnswer === 'yes' && !showAddCommunity && (
          <button
            onClick={() => setShowAddCommunity(true)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            <Plus size={16} />
            Add a community
          </button>
        )}
        {communitiesAnswer === 'yes' && showAddCommunity && (
          <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
            <div className="flex gap-3">
              <button onClick={addCommunity} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
                Add a community
              </button>
              <button onClick={() => setShowAddCommunity(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg text-sm">
                Cancel
              </button>
            </div>
            {activities.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Tip: You can reuse existing activities like {activities.map(a => a.activityName).filter(Boolean).join(', ')} or add something new.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ===== TRADITIONS ===== */}
      <div className="mb-6 pt-4 border-t border-gray-700">
        <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
          <Calendar size={16} />
          Familiar traditions worth keeping
        </h6>

        <label className={labelClass}>
          Are there camps, trips, traditions or recurring activities that you would especially hope {childName} could continue?
        </label>
        <div className="flex flex-col gap-2 mb-3">
          {YES_NO_UNSURE.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`belongingHasTraditions-${childIndex}`}
                value={value}
                checked={traditionsAnswer === value}
                onChange={e => {
                  onChildMultiChange(childIndex, {
                    belongingHasTraditions: e.target.value,
                    belongingTraditions: '',
                  });
                  setShowAddTradition(false);
                }}
                className="mr-1"
              />
              <span className="text-gray-300 text-sm">{label}</span>
            </label>
          ))}
        </div>

        {traditionsAnswer === 'yes' && data.traditions.length > 0 && (
          <div className="space-y-3 mb-4">
            {data.traditions.map(trad => (
              <div key={trad.id} className={cardClass}>
                <TraditionEditor
                  trad={trad}
                  activities={activities}
                  onUpdate={f => updateTradition(trad.id, f)}
                  onRemove={() => removeTradition(trad.id)}
                />
              </div>
            ))}
          </div>
        )}

        {traditionsAnswer === 'yes' && !showAddTradition && (
          <button
            onClick={() => setShowAddTradition(true)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            <Plus size={16} />
            Add a tradition
          </button>
        )}
        {traditionsAnswer === 'yes' && showAddTradition && (
          <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
            <div className="flex gap-3">
              <button onClick={addTradition} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
                Add a tradition
              </button>
              <button onClick={() => setShowAddTradition(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== FAMILY RELATIONSHIPS ===== */}
      <div className="mb-6 pt-4 border-t border-gray-700">
        <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
          <Home size={16} />
          Family relationships to keep close
        </h6>

        {familyOptions.length > 0 ? (
          <>
            <label className={labelClass}>
              Who in the family would be especially important for {childName} to stay close to after a move?
            </label>
            <div className="space-y-2 mb-3">
              {familyOptions.map(opt => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={familySelections.includes(opt.id)}
                    onChange={() => toggleFamilySelection(opt.id)}
                    className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">{opt.name}</span>
                  <span className="text-xs text-gray-500">({opt.relationship})</span>
                </label>
              ))}
            </div>

            {familySelections.length > 0 && (
              <div>
                <label className={labelClass}>
                  What would you want the guardian to understand about these relationships?
                </label>
                <textarea
                  value={data.familyRelationshipNotes}
                  onChange={e => update({ familyRelationshipNotes: e.target.value })}
                  placeholder="For example: how often they see each other, what traditions they share, why these relationships matter to {childName}..."
                  className={inputClass}
                  rows={2}
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">
            No family members have been identified yet in other parts of your questionnaire. You can add people as guardians or contacts elsewhere, and they'll appear here.
          </p>
        )}
      </div>

      {/* ===== TRUSTED ADULTS ===== */}
      <div className="mb-6 pt-4 border-t border-gray-700">
        <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
          <Star size={16} />
          Trusted adults outside the family
        </h6>

        <label className={labelClass}>
          Are there any adults outside the family who are especially important to {childName}?
        </label>
        <p className="text-xs text-gray-400 mb-3">
          For example: a friend's parent, coach, teacher, camp counsellor, mentor, neighbour or family friend.
        </p>
        <div className="flex flex-col gap-2 mb-3">
          {YES_NO_UNSURE.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`belongingHasTrustedAdults-${childIndex}`}
                value={value}
                checked={trustedAdultsAnswer === value}
                onChange={e => onChildChange(childIndex, 'belongingHasTrustedAdults', e.target.value)}
                className="mr-1"
              />
              <span className="text-gray-300 text-sm">{label}</span>
            </label>
          ))}
        </div>
        {trustedAdultsAnswer === 'yes' && (
          <p className="text-xs text-gray-400">
            You can add trusted adults as connections above using "Add a connection."
          </p>
        )}
      </div>

      {/* ===== REFLECTION QUESTIONS ===== */}
      <div className="mb-6 pt-4 border-t border-gray-700">
        <h6 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
          <Heart size={16} />
          What would {childName} miss most?
        </h6>

        <label className={labelClass}>
          If {childName} had to move away, what parts of their current life do you think they would miss the most?
        </label>
        <textarea
          value={data.missedMost}
          onChange={e => update({ missedMost: e.target.value })}
          placeholder="Their best friend, grandparents nearby, hockey teammates, walking to school, the family dog, their bedroom, cousins, summer camp or another familiar part of everyday life."
          className={inputClass}
          rows={3}
        />
      </div>

      <div className="mb-6">
        <label className={labelClass}>
          What could help {childName} feel connected to their old life while they begin building a new one?
        </label>
        <textarea
          value={data.feelConnected}
          onChange={e => update({ feelConnected: e.target.value })}
          placeholder="Visits, calls, traditions, familiar possessions, trips back to the community, continued activities, contact with friends or family..."
          className={inputClass}
          rows={3}
        />
      </div>

      {/* ===== REVIEW ===== */}
      {(data.connections.length > 0 || data.communities.length > 0 || data.traditions.length > 0 || familySelections.length > 0) && (
        <div className="mb-6 pt-4 border-t border-gray-700">
          <h6 className="text-sm font-semibold text-blue-300 mb-3">
            {childName}'s important connections
          </h6>

          <div className="space-y-2 mb-4">
            {data.connections.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{c.displayName || 'Unnamed'}</p>
                  <p className="text-xs text-gray-400">
                    {labelFromOptions(c.connectionType, RELATIONSHIP_OPTIONS)}
                    {c.contexts.length > 0 && ` · ${labelsFromOptions(c.contexts, CONTEXT_OPTIONS)}`}
                  </p>
                </div>
                {c.importance && (
                  <span className="text-xs text-blue-300">{labelFromOptions(c.importance, IMPORTANCE_OPTIONS)}</span>
                )}
              </div>
            ))}
            {data.communities.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{c.name || labelFromOptions(c.type, COMMUNITY_TYPES)}</p>
                  <p className="text-xs text-gray-400">{labelFromOptions(c.type, COMMUNITY_TYPES)}</p>
                </div>
              </div>
            ))}
            {data.traditions.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{t.name || labelFromOptions(t.type, TRADITION_TYPES)}</p>
                  <p className="text-xs text-gray-400">{labelFromOptions(t.type, TRADITION_TYPES)}</p>
                </div>
              </div>
            ))}
            {familySelections.length > 0 && (
              <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Family connections selected</p>
                <p className="text-sm text-white">
                  {familySelections.map(id => {
                    const opt = familyOptions.find(o => o.id === id);
                    return opt?.name || id;
                  }).join(', ')}
                </p>
              </div>
            )}
          </div>

          <label className={labelClass}>
            Does this still reflect the people and parts of life you would especially hope {childName} stays connected with?
          </label>
          <div className="flex gap-4">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'need_update', label: 'I need to update something' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`belongingReview-${childIndex}`}
                  value={value}
                  checked={data.reviewStatus === value}
                  onChange={e => update({ reviewStatus: e.target.value })}
                  className="mr-1"
                />
                <span className="text-gray-300 text-sm">{label}</span>
              </label>
            ))}
          </div>
          {data.reviewStatus === 'need_update' && (
            <p className="text-xs text-gray-400 mt-2">
              You can edit or remove any connection, community or tradition above. Just click on it to make changes.
            </p>
          )}
        </div>
      )}

      {/* Closing principle */}
      <div className="bg-blue-900/10 border border-blue-700/20 rounded-lg p-3">
        <p className="text-xs text-blue-200/80 leading-relaxed italic">
          A new home does not have to mean losing every part of {childName}'s old life.
        </p>
      </div>
    </div>
  );
}

// ===== Connection Editor =====
function ConnectionEditor({
  conn, childName, planningPersons, onUpdate, onRemove, onCollapse, onCreateContactPerson,
}: {
  conn: Connection;
  childName: string;
  planningPersons: PlanningPerson[];
  onUpdate: (fields: Partial<Connection>) => void;
  onRemove: () => void;
  onCollapse: () => void;
  onCreateContactPerson: () => string;
}) {
  const inputCls = 'w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm';
  const lblCls = 'block text-xs font-medium text-gray-400 mb-1';

  const toggleArr = (arr: string[], val: string): string[] => {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  };

  // Existing people for contact selection
  const contactPeople = planningPersons.filter(p => p.name);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">Connection details</span>
        <div className="flex gap-2">
          <button onClick={onCollapse} className="text-xs text-gray-400 hover:text-gray-300">Done</button>
          <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className={lblCls}>First name / name</label>
          <input
            type="text"
            value={conn.displayName}
            onChange={e => onUpdate({ displayName: e.target.value })}
            placeholder="e.g., Ben"
            className={inputCls}
          />
        </div>

        <div>
          <label className={lblCls}>What is their relationship to {childName}?</label>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIP_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conn.connectionType === opt.value || (conn.connectionType.includes(',') && conn.connectionType.split(',').includes(opt.value))}
                  onChange={() => {
                    const current = conn.connectionType ? conn.connectionType.split(',') : [];
                    const next = toggleArr(current, opt.value);
                    onUpdate({ connectionType: next.join(',') });
                  }}
                  className="w-3.5 h-3.5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={lblCls}>How are {childName} and {conn.displayName || 'this person'} connected?</label>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conn.contexts.includes(opt.value)}
                  onChange={() => onUpdate({ contexts: toggleArr(conn.contexts, opt.value) })}
                  className="w-3.5 h-3.5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={lblCls}>What would you want {childName}'s guardian to understand about this relationship?</label>
          <textarea
            value={conn.relationshipNotes}
            onChange={e => onUpdate({ relationshipNotes: e.target.value })}
            placeholder={`For example: how long they've known each other, what they enjoy doing together, whether the families are close, or why this friendship is especially important to ${childName}.`}
            className={inputCls}
            rows={2}
          />
        </div>

        <div>
          <label className={lblCls}>How important would it be to help {childName} maintain this relationship after a move?</label>
          <div className="flex flex-col gap-1">
            {IMPORTANCE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`importance-${conn.id}`}
                  value={opt.value}
                  checked={conn.importance === opt.value}
                  onChange={e => onUpdate({ importance: e.target.value })}
                  className="mr-1"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Contact for friend's parent/guardian */}
        <div>
          <label className={lblCls}>Who could {childName}'s guardian contact to help keep this relationship going?</label>
          <div className="flex flex-col gap-1">
            {CONTACT_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`contact-${conn.id}`}
                  value={opt.value}
                  checked={conn.contactOption === opt.value}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'add_contact') {
                      const newId = onCreateContactPerson();
                      onUpdate({ contactOption: val, contactPersonId: newId });
                    } else {
                      onUpdate({ contactOption: val, contactPersonId: '' });
                    }
                  }}
                  className="mr-1"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>

          {conn.contactOption === 'existing_person' && (
            <select
              value={conn.contactPersonId}
              onChange={e => onUpdate({ contactPersonId: e.target.value })}
              className={`${inputCls} mt-2`}
            >
              <option value="">Select a person...</option>
              {contactPeople.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.relationship || 'contact'})</option>
              ))}
            </select>
          )}

          {conn.contactOption === 'add_contact' && conn.contactPersonId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
              {(() => {
                const person = planningPersons.find(p => p.id === conn.contactPersonId);
                if (!person) return null;
                return (
                  <>
                    <input
                      type="text"
                      value={person.name}
                      onChange={e => {
                        // Update the planning person
                                onUpdate({ contactName: e.target.value });
                      }}
                      placeholder="Parent/guardian name"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={conn.contactRelationship}
                      onChange={e => onUpdate({ contactRelationship: e.target.value })}
                      placeholder="Relationship to the friend"
                      className={inputCls}
                    />
                    <input
                      type="tel"
                      value={conn.contactPhone}
                      onChange={e => onUpdate({ contactPhone: e.target.value })}
                      placeholder="Phone"
                      className={inputCls}
                    />
                    <input
                      type="email"
                      value={conn.contactEmail}
                      onChange={e => onUpdate({ contactEmail: e.target.value })}
                      placeholder="Email"
                      className={inputCls}
                    />
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Continuity ideas */}
        <div>
          <label className={lblCls}>If {childName} moved away, what are some ways you would hope their guardian could help keep this relationship going?</label>
          <div className="flex flex-wrap gap-2">
            {CONTINUITY_IDEAS.map(opt => (
              <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conn.continuityIdeas.includes(opt.value)}
                  onChange={() => onUpdate({ continuityIdeas: toggleArr(conn.continuityIdeas, opt.value) })}
                  className="w-3.5 h-3.5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Connection Summary =====
function ConnectionSummary({
  conn, onEdit, onRemove,
}: {
  conn: Connection;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const typeLabels = conn.connectionType.split(',').map(t => labelFromOptions(t, RELATIONSHIP_OPTIONS)).join(', ');
  const contextLabels = labelsFromOptions(conn.contexts, CONTEXT_OPTIONS);
  const importanceLabel = conn.importance ? labelFromOptions(conn.importance, IMPORTANCE_OPTIONS) : '';

  return (
    <div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-white font-medium">{conn.displayName || 'Unnamed connection'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{typeLabels}{contextLabels && ` · ${contextLabels}`}</p>
          {importanceLabel && <p className="text-xs text-blue-300 mt-0.5">{importanceLabel}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <ChevronRight size={14} /> Edit
          </button>
          <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {conn.relationshipNotes && (
        <p className="text-xs text-gray-300 mt-2 italic leading-relaxed">"{conn.relationshipNotes}"</p>
      )}
      {conn.continuityIdeas.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">
          Stay connected: {labelsFromOptions(conn.continuityIdeas, CONTINUITY_IDEAS)}
        </p>
      )}
    </div>
  );
}

// ===== Community Editor =====
function CommunityEditor({
  comm, activities, onUpdate, onRemove,
}: {
  comm: Community;
  activities: Array<{ activityName: string; activityType: string }>;
  onUpdate: (fields: Partial<Community>) => void;
  onRemove: () => void;
}) {
  const inputCls = 'w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm';
  const lblCls = 'block text-xs font-medium text-gray-400 mb-1';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">Community details</span>
        <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
          <Trash2 size={14} /> Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className={lblCls}>What type of community?</label>
          <div className="flex flex-wrap gap-2">
            {COMMUNITY_TYPES.map(opt => (
              <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name={`commType-${comm.id}`}
                  value={opt.value}
                  checked={comm.type === opt.value}
                  onChange={e => onUpdate({ type: e.target.value })}
                  className="w-3.5 h-3.5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={lblCls}>Name (optional)</label>
          <input
            type="text"
            value={comm.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder="e.g., hockey team, camp community, cultural group name"
            className={inputCls}
          />
          {activities.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Or reuse an existing activity:</p>
              <div className="flex flex-wrap gap-1">
                {activities.map((a, i) => (
                  a.activityName && (
                    <button
                      key={i}
                      onClick={() => onUpdate({ name: a.activityName })}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-xs text-gray-300 rounded"
                    >
                      {a.activityName}
                    </button>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className={lblCls}>What would you want the guardian to understand about their connection to this group?</label>
          <textarea
            value={comm.importanceNotes}
            onChange={e => onUpdate({ importanceNotes: e.target.value })}
            placeholder={`For example: how long they've been part of it, what it means to them, what they would miss about it...`}
            className={inputCls}
            rows={2}
          />
        </div>

        <div>
          <label className={lblCls}>Would you hope they could stay connected to this group after a move?</label>
          <div className="flex flex-col gap-1">
            {COMMUNITY_CONTINUE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`commContinue-${comm.id}`}
                  value={opt.value}
                  checked={comm.continuityPreference === opt.value}
                  onChange={e => onUpdate({ continuityPreference: e.target.value })}
                  className="mr-1"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Tradition Editor =====
function TraditionEditor({
  trad, activities, onUpdate, onRemove,
}: {
  trad: Tradition;
  activities: Array<{ activityName: string; activityType: string }>;
  onUpdate: (fields: Partial<Tradition>) => void;
  onRemove: () => void;
}) {
  const inputCls = 'w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm';
  const lblCls = 'block text-xs font-medium text-gray-400 mb-1';

  const toggleArr = (arr: string[], val: string): string[] => {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">Tradition details</span>
        <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
          <Trash2 size={14} /> Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className={lblCls}>What type of tradition or activity?</label>
          <div className="flex flex-wrap gap-2">
            {TRADITION_TYPES.map(opt => (
              <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name={`tradType-${trad.id}`}
                  value={opt.value}
                  checked={trad.type === opt.value}
                  onChange={e => onUpdate({ type: e.target.value })}
                  className="w-3.5 h-3.5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={lblCls}>Name / description</label>
          <input
            type="text"
            value={trad.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder="e.g., Camp Wabikon, Sunday dinner with grandparents, annual cottage week"
            className={inputCls}
          />
          {activities.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Or reuse an existing activity:</p>
              <div className="flex flex-wrap gap-1">
                {activities.map((a, i) => (
                  a.activityName && (
                    <button
                      key={i}
                      onClick={() => onUpdate({ name: a.activityName })}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-xs text-gray-300 rounded"
                    >
                      {a.activityName}
                    </button>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className={lblCls}>Who usually shares this with them?</label>
          <div className="flex flex-wrap gap-2">
            {TRADITION_PARTICIPANT_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trad.participantTypes.includes(opt.value)}
                  onChange={() => onUpdate({ participantTypes: toggleArr(trad.participantTypes, opt.value) })}
                  className="w-3.5 h-3.5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
          {trad.participantTypes.includes('add_someone') && (
            <input
              type="text"
              value={trad.participantNotes}
              onChange={e => onUpdate({ participantNotes: e.target.value })}
              placeholder="Who else usually shares this?"
              className={`${inputCls} mt-2`}
            />
          )}
        </div>

        <div>
          <label className={lblCls}>Why is this tradition important?</label>
          <textarea
            value={trad.importanceNotes}
            onChange={e => onUpdate({ importanceNotes: e.target.value })}
            placeholder="What makes this tradition meaningful? What would they miss about it?"
            className={inputCls}
            rows={2}
          />
        </div>

        <div>
          <label className={lblCls}>Would you hope this could continue after a move if practical?</label>
          <div className="flex gap-3">
            {TRADITION_CONTINUE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`tradContinue-${trad.id}`}
                  value={opt.value}
                  checked={trad.continueIfPractical === opt.value}
                  onChange={e => onUpdate({ continueIfPractical: e.target.value })}
                  className="mr-1"
                />
                <span className="text-xs text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
