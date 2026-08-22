import type {
  GuardianshipRoadmapModel,
  GuardianshipChildProfile,
  ChildStatus,
  MoveStatus,
  PlanningPerson,
  GuardianAssignment,
  GuardianHousehold,
  AdultSiblingRole,
  ActivityEntry,
  PersonalProfile,
  EducationTransition,
  HealthcareProvider,
  HealthcareTransition,
  MedicationEntry,
  AllergyEntry,
  SupportTransitionRow,
  SupportProvider,
  ImportantConnection,
  CommunityItem,
  TraditionItem,
  PersonToKeepClose,
  ClientInheritanceInfo,
  AdultTransitionInfo,
  FutureEducationInfo,
  RoleAssignment,
  FinancialResourceSummary,
  EstateTrusteeInfo,
  EstateTrusteePerson,
  DocumentRegistryEntry,
  ReadinessCategory,
  ImmediateAction,
  ChildCareFundingPhilosophy,
  CareFundingCoordination,
  FundingReviewItem,
  GuardianTrustInfo,
  GuardianDiscretionInfo,
  FamilyFairnessInfo,
  EducationFairnessInfo,
  ProfessionalContactSummary,
} from './guardianshipRoadmapTypes';
import { resolvePersonNameField } from './personRepositoryTypes';
import { getAgeOfMajority, getProvinceName, normalizeProvinceCode } from './jurisdiction';
import { getProfessionalAdvisors } from './referentialIntegrity';
import { buildGuardianshipLimitations, buildAllReviewItems } from './guardianshipReviewItemBuilder';
import { getCareFundingCoordinationContext, buildScenarioCoordinations } from './guardianshipRoleResolution';

type AnswersMap = Map<string, Record<string, unknown>>;
type ChildRecord = Record<string, string | undefined>;

function computeAge(dateOfBirth: string | undefined): number | undefined {
  if (!dateOfBirth) return undefined;
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) return undefined;
  const today = new Date();
  const age = (today.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(age);
}

function classifyChild(child: ChildRecord | undefined, ageOfMajority: number): ChildStatus {
  if (!child?.dateOfBirth) return 'minor';
  const age = computeAge(child.dateOfBirth);
  if (age === undefined || age < ageOfMajority) return 'minor';
  const isDisabled = child.disabled === 'yes' || child.disabled === 'not_sure';
  const isIndependent = child.independent === 'yes';
  if (isIndependent && !isDisabled) return 'adult_independent';
  return 'adult_dependant';
}

function derivePlanningFocus(status: ChildStatus, disabled: boolean, disabilityUncertain: boolean): string {
  if (status === 'adult_independent') return 'Adult — independent';
  if (status === 'adult_dependant') {
    if (disabled) return 'Adult — ongoing support needs';
    return 'Adult — may need support';
  }
  if (disabled) return 'Minor — ongoing support needs';
  if (disabilityUncertain) return 'Minor — support needs being assessed';
  return 'Minor';
}

function parseJsonArray<T>(raw: string | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parsePlanningPersons(raw: unknown): PlanningPerson[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p: Record<string, unknown>) => ({
    id: String(p.id || ''),
    name: String(p.name || ''),
    relationship: String(p.relationship || ''),
    phone: String(p.phone || ''),
    email: String(p.email || ''),
    city: String(p.city || ''),
    province: String(p.province || ''),
    country: String(p.country || ''),
  }));
}

function findPerson(persons: PlanningPerson[], id: string | undefined): PlanningPerson | undefined {
  if (!id) return undefined;
  return persons.find(p => p.id === id);
}

function buildCommunityString(city?: string, province?: string, country?: string): string {
  const parts = [city, province ? getProvinceName(province) || province : undefined, country].filter(Boolean);
  return parts.join(', ');
}

function parseMoveStatus(raw: string | undefined): MoveStatus {
  switch (raw) {
    case 'yes_most_likely': return 'likely';
    case 'possibly': return 'possible';
    case 'no_remain_current': return 'unlikely';
    default: return 'undecided';
  }
}

function isCrossBorder(childCountry: string, guardianCountry: string): boolean {
  const c1 = (childCountry || 'Canada').trim().toLowerCase();
  const c2 = (guardianCountry || '').trim().toLowerCase();
  if (!c2) return false;
  return c1 !== c2;
}

function isCrossProvince(childProvince: string, childCountry: string, guardianProvince: string, guardianCountry: string): boolean {
  if (isCrossBorder(childCountry, guardianCountry)) return false;
  const p1 = normalizeProvinceCode(childProvince);
  const p2 = normalizeProvinceCode(guardianProvince);
  if (!p1 || !p2) return false;
  return p1 !== p2;
}

function buildHouseholdLabel(people: PlanningPerson[]): { label: string; isHousehold: boolean } {
  if (people.length === 0) return { label: '', isHousehold: false };
  if (people.length === 1) return { label: people[0].name, isHousehold: false };
  const names = people.map(p => p.name).filter(Boolean);
  if (names.length <= 1) return { label: names[0] || '', isHousehold: false };
  if (names.length === 2) return { label: `${names[0]} & ${names[1]}`, isHousehold: true };
  const last = names[names.length - 1];
  const rest = names.slice(0, -1);
  return { label: `${rest.join(', ')} & ${last}`, isHousehold: true };
}

function makeHouseholdId(personIds: string[]): string {
  return `hh_${personIds.slice().sort().join('_')}`;
}

function buildGuardianHousehold(
  personIds: string[],
  planningPersons: PlanningPerson[]
): GuardianHousehold {
  const people = personIds
    .map(id => findPerson(planningPersons, id))
    .filter((p): p is PlanningPerson => !!p);
  const label = buildHouseholdLabel(people);
  const first = people[0];
  return {
    id: makeHouseholdId(personIds),
    guardianPersonIds: personIds,
    guardianPeople: people,
    displayName: label.label,
    city: first?.city,
    province: first?.province,
    country: first?.country,
    isJoint: label.isHousehold,
  };
}

const ACTIVITY_IMPORTANCE_MAP: Record<string, string> = {
  'Critical': 'Critical',
  'Important': 'Important',
  'Nice to have': 'Nice to have',
};

function buildActivities(child: ChildRecord): ActivityEntry[] {
  const raw = parseJsonArray<{
    activityName?: string; activityType?: string; importanceLevel?: string; frequency?: string;
  }>(child.activityList);
  return raw.map(a => ({
    name: String(a.activityName || ''),
    type: String(a.activityType || ''),
    importance: ACTIVITY_IMPORTANCE_MAP[a.importanceLevel || ''] || a.importanceLevel || '',
    frequency: String(a.frequency || ''),
  }));
}

function buildPersonalProfile(child: ChildRecord): PersonalProfile {
  return {
    communicationStyle: child.communicationStyle,
    emotionalExpression: child.emotionalExpression,
    comfortStrategies: child.comfortStrategies,
    socialChallenges: child.socialChallenges,
    behaviouralConsiderations: child.behaviouralConsiderations,
    importantRoutines: child.importantRoutines,
    activities: buildActivities(child),
    socialAdditionalNotes: child.socialAdditionalNotes,
    transitionEasier: child.transitionEasierText,
    missedMost: child.belongingMissedMost,
    feelConnected: child.belongingFeelConnected,
  };
}

function buildEducationTransition(child: ChildRecord): EducationTransition | undefined {
  if (!child.attendingSchool || child.attendingSchool === 'no') return undefined;
  const settingReasons = (child.educationSettingReasons || '')
    .split(',').map(s => s.trim()).filter(s => s.length > 0);
  return {
    schoolName: child.schoolName,
    schoolPhone: child.schoolPhone,
    schoolAddress: child.schoolAddress,
    currentGrade: child.currentGrade,
    hasIEP: child.hasIEP === 'yes',
    iepDetails: child.individualEducationPlan,
    iepDocumentLocation: resolveLocationRef(child.iepDocumentLocation),
    iepImportance: child.transitionIEPImportance,
    schoolChangeExpected: child.transitionSchoolChangeExpected,
    newSchoolNotes: child.transitionNewSchoolNotes,
    recordLocation: resolveLocationRef(child.transitionEducationRecordLocation),
    learningStyleNotes: child.learningStyleNotes,
    schoolExtraSupport: child.schoolExtraSupport,
    schoolFocusHelps: child.schoolFocusHelps,
    settingType: child.educationSettingType as EducationTransition['settingType'],
    settingTypeDetails: child.educationSettingTypeDetails,
    settingReasons: settingReasons as EducationTransition['settingReasons'],
    settingReasonsOther: child.educationSettingReasonsOther,
    settingReasonsNotes: child.educationSettingReasonsNotes,
    educationImportance: child.educationImportance as EducationTransition['educationImportance'],
    educationImportanceDetails: child.educationImportanceDetails,
  };
}

function buildAllProviders(child: ChildRecord): HealthcareProvider[] {
  const providers: HealthcareProvider[] = [];
  const categories = ['family', 'school', 'doctor', 'other'];
  for (const cat of categories) {
    const count = parseInt(child[`careCoord_${cat}_count`] || '0', 10);
    for (let i = 0; i < count; i++) {
      const name = child[`careCoord_${cat}_${i}_name`];
      if (!name) continue;
      providers.push({
        id: `${cat}_${i}`,
        name,
        role: child[`careCoord_${cat}_${i}_role`] || '',
        category: cat,
        phone: child[`careCoord_${cat}_${i}_phone`],
        email: child[`careCoord_${cat}_${i}_email`],
        city: child[`careCoord_${cat}_${i}_city`],
        province: child[`careCoord_${cat}_${i}_province`],
        resolved: true,
      });
    }
  }
  return providers;
}

function buildMedications(child: ChildRecord): MedicationEntry[] {
  return parseJsonArray<{
    name?: string; treats?: string; prescription?: string; prescribedBy?: string; otherInfo?: string;
  }>(child.medicationList).map(m => ({
    name: String(m.name || ''),
    treats: String(m.treats || ''),
    prescribed: m.prescription === 'yes',
    prescribedBy: m.prescribedBy,
    otherInfo: m.otherInfo,
  }));
}

function buildAllergies(child: ChildRecord): AllergyEntry[] {
  return parseJsonArray<{
    details?: string; severity?: string; medications?: string; epipen?: string;
  }>(child.allergyList).map(a => ({
    details: String(a.details || ''),
    severity: String(a.severity || ''),
    medications: a.medications,
    epipen: a.epipen,
  }));
}

function buildHealthcareTransition(
  child: ChildRecord,
  allProviders: HealthcareProvider[]
): HealthcareTransition {
  const selectionIds = (child.transitionProviderSelections || '')
    .split(',').filter(Boolean);

  let selectedProviders: HealthcareProvider[] = [];
  if (selectionIds.includes('all_providers')) {
    selectedProviders = allProviders.filter(p => p.category !== 'family');
  } else if (selectionIds.includes('not_sure_providers')) {
    selectedProviders = [];
  } else {
    selectedProviders = selectionIds
      .map(id => {
        const provider = allProviders.find(p => p.id === id);
        if (provider) return provider;
        return {
          id,
          name: '',
          role: '',
          category: '',
          resolved: false,
        } as HealthcareProvider;
      });
  }

  const medications = buildMedications(child);
  const allergies = buildAllergies(child);

  return {
    providers: allProviders,
    selectedProviders,
    pharmacyName: child.pharmacyName,
    hasMedications: child.medications === 'yes' && medications.length > 0,
    medications,
    hasAllergies: child.allergies === 'yes' && allergies.length > 0,
    allergies,
    medicalConditions: child.medicalIssues === 'yes' ? child.medicalIssuesDescription : undefined,
    carePlanWritten: child.carePlanWritten,
    carePlanStored: resolveLocationRef(child.carePlanStored),
    providerSelectionsResolved: selectedProviders.every(p => p.resolved),
    recordLocation: resolveLocationRef(child.transitionHealthRecordLocation),
    medicationNotes: child.transitionMedicationNotes,
  };
}

const SUPPORT_TYPE_RULES: Record<string, { label: string; purpose: string; action: string; providerCategory?: string }> = {
  cognitive_developmental: {
    label: 'Cognitive or developmental',
    purpose: 'Developmental assessment and cognitive supports',
    action: 'Transfer developmental/medical records and request referral or transition support for a local specialist.',
    providerCategory: 'doctor',
  },
  physical: {
    label: 'Physical disability',
    purpose: 'Mobility and physical therapy supports',
    action: 'Share current therapy goals and help establish a local physiotherapy or physical support provider.',
    providerCategory: 'doctor',
  },
  medical_condition: {
    label: 'Medical condition',
    purpose: 'Ongoing medical care and condition management',
    action: 'Transfer medical records and request referral to a local specialist or family physician for continuity of care.',
    providerCategory: 'doctor',
  },
  mental_health: {
    label: 'Mental health',
    purpose: 'Counselling and mental health supports',
    action: 'Share current treatment context and help connect with a local counsellor or mental health provider.',
    providerCategory: 'other',
  },
  learning: {
    label: 'Learning disability',
    purpose: 'Educational accommodations and learning supports',
    action: 'Provide the current IEP and related records to the new school. Share learning assessments.',
    providerCategory: 'school',
  },
  complex_care: {
    label: 'Complex care',
    purpose: 'Complex care coordination across multiple providers',
    action: 'Transfer full care plan, medication lists, and provider contacts. Establish a local care coordinator.',
  },
  prefer_no_label: {
    label: 'General support',
    purpose: 'General support services',
    action: 'Share current support arrangements and help establish equivalent local supports.',
  },
  existing_supports: {
    label: 'All current supports',
    purpose: 'Continuity of all existing supports',
    action: 'Transfer full documentation and establish equivalent providers in the new community.',
  },
  other: {
    label: 'Other support',
    purpose: 'Other identified support needs',
    action: 'Share current arrangements and help establish equivalent local support.',
  },
};

function findSupportProvider(
  supportTypeId: string,
  allProviders: HealthcareProvider[]
): SupportProvider {
  const rules = SUPPORT_TYPE_RULES[supportTypeId];
  if (!rules?.providerCategory) return undefined;
  const provider = allProviders.find(p => p.category === rules.providerCategory && p.name);
  if (!provider) return undefined;
  return { name: provider.name, role: provider.role };
}

function buildSupportTransition(
  child: ChildRecord,
  _moveStatus: MoveStatus,
  allProviders: HealthcareProvider[]
): SupportTransitionRow[] | undefined {
  if (child.disabled !== 'yes' && child.disabled !== 'not_sure') return undefined;

  const selectedIds = (child.transitionSupportSelections || '')
    .split(',').filter(Boolean);
  if (selectedIds.length === 0) return undefined;

  return selectedIds.map(id => {
    const rules = SUPPORT_TYPE_RULES[id] || SUPPORT_TYPE_RULES.other;
    let recordLocation: string | undefined;
    if (id === 'learning' || id === 'existing_supports') {
      recordLocation = child.transitionEducationRecordLocation || child.iepDocumentLocation;
    }
    return {
      supportType: id,
      supportTypeLabel: rules.label,
      currentProvider: findSupportProvider(id, allProviders),
      purpose: rules.purpose,
      transitionAction: rules.action,
      recordLocation,
      notes: child.transitionSupportNotes,
    };
  });
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  best_friend: 'Best friend', close_friend: 'Close friend', school_friend: 'School friend',
  neighbourhood_friend: 'Neighbourhood friend', sports_friend: 'Sports friend', camp_friend: 'Camp friend',
  cousin: 'Cousin', family_friend: 'Family friend', trusted_adult: 'Trusted adult',
  coach_mentor: 'Coach / mentor', other: 'Other',
};

const IMPORTANCE_LABELS: Record<string, string> = {
  especially_important: 'Especially important', important: 'Important',
  nice_to_maintain: 'Nice to maintain', not_sure: 'Not sure',
};

const COMMUNITY_TYPE_LABELS: Record<string, string> = {
  school_group: 'School friend group', neighbourhood: 'Neighbourhood friends', sports_team: 'Sports team',
  camp_community: 'Camp community', faith: 'Faith community', cultural: 'Cultural community',
  club_activity: 'Club / activity group', cousins_family: 'Cousins / extended family', other: 'Other',
};

const TRADITION_TYPE_LABELS: Record<string, string> = {
  overnight_camp: 'Overnight camp', day_camp: 'Day camp', cottage_week: 'Cottage week',
  camping_trip: 'Camping trip', tournament: 'Tournament', cousin_weekend: 'Cousin weekend',
  birthday_tradition: 'Birthday tradition', holiday_gathering: 'Holiday gathering',
  religious_cultural: 'Religious / cultural tradition', other: 'Other',
};

function buildImportantConnections(child: ChildRecord, moveLikely: boolean): ImportantConnection[] {
  const raw = parseJsonArray<{
    id?: string; displayName?: string; connectionType?: string; contexts?: string[];
    importance?: string; relationshipNotes?: string;
    contactName?: string; contactPhone?: string; contactEmail?: string; continuityIdeas?: string[];
  }>(child.belongingConnections);

  return raw.map(c => {
    const types = (c.connectionType || '').split(',').filter(Boolean);
    const hasContact = !!(c.contactName || c.contactPhone || c.contactEmail);
    return {
      id: String(c.id || ''),
      name: String(c.displayName || ''),
      relationshipTypes: types,
      contexts: Array.isArray(c.contexts) ? c.contexts.map(String) : [],
      whyItMatters: String(c.relationshipNotes || ''),
      importance: String(c.importance || ''),
      importanceLabel: IMPORTANCE_LABELS[c.importance || ''] || c.importance || '',
      contactName: c.contactName,
      contactPhone: c.contactPhone,
      contactEmail: c.contactEmail,
      continuityIdeas: Array.isArray(c.continuityIdeas) ? c.continuityIdeas.map(String) : [],
      hasContactInfo: hasContact,
      moveComplicates: moveLikely && c.importance === 'especially_important',
    };
  });
}

function buildCommunities(child: ChildRecord): CommunityItem[] {
  return parseJsonArray<{
    id?: string; type?: string; name?: string; importanceNotes?: string; continuityPreference?: string;
  }>(child.belongingCommunities).map(c => ({
    id: String(c.id || ''),
    type: String(c.type || ''),
    typeLabel: COMMUNITY_TYPE_LABELS[c.type || ''] || c.type || '',
    name: String(c.name || ''),
    importanceNotes: String(c.importanceNotes || ''),
    continuityPreference: String(c.continuityPreference || ''),
  }));
}

function buildTraditions(child: ChildRecord): TraditionItem[] {
  return parseJsonArray<{
    id?: string; type?: string; name?: string; participantTypes?: string[];
    participantNotes?: string; importanceNotes?: string; continueIfPractical?: string;
  }>(child.belongingTraditions).map(t => ({
    id: String(t.id || ''),
    name: String(t.name || ''),
    type: String(t.type || ''),
    typeLabel: TRADITION_TYPE_LABELS[t.type || ''] || t.type || '',
    participantTypes: Array.isArray(t.participantTypes) ? t.participantTypes.map(String) : [],
    participantNotes: String(t.participantNotes || ''),
    importanceNotes: String(t.importanceNotes || ''),
    continueIfPractical: String(t.continueIfPractical || ''),
  }));
}

function resolveFamilySelections(
  selectionsStr: string,
  planningPersons: PlanningPerson[],
  childrenData: ChildRecord[],
  childIndex: number
): PersonToKeepClose[] {
  const ids = (selectionsStr || '').split(',').filter(Boolean);
  const result: PersonToKeepClose[] = [];
  const seen = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);

    if (id.startsWith('adult_sib_')) {
      const sibIdx = parseInt(id.replace('adult_sib_', ''), 10);
      const sib = childrenData[sibIdx];
      if (sib) {
        result.push({
          id,
          name: sib.nickname || sib.name || '',
          relationship: 'Adult sibling',
          sourceType: 'adult_sibling',
          resolved: true,
        });
      } else {
        result.push({ id, name: '', relationship: 'Adult sibling', sourceType: 'adult_sibling', resolved: false });
      }
    } else if (id.startsWith('sibling_')) {
      const sibIdx = parseInt(id.replace('sibling_', ''), 10);
      const sib = childrenData[sibIdx];
      if (sib && sibIdx !== childIndex) {
        result.push({
          id,
          name: sib.nickname || sib.name || '',
          relationship: 'Sibling',
          sourceType: 'minor_sibling',
          resolved: true,
        });
      } else {
        result.push({ id, name: '', relationship: 'Sibling', sourceType: 'minor_sibling', resolved: false });
      }
    } else if (id.startsWith('pp_')) {
      const person = planningPersons.find(p => p.id === id);
      if (person) {
        result.push({
          id,
          name: person.name,
          relationship: person.relationship || 'Family member',
          sourceType: 'planning_person',
          phone: person.phone,
          email: person.email,
          city: person.city,
          province: person.province,
          resolved: true,
        });
      } else {
        result.push({ id, name: '', relationship: '', sourceType: 'planning_person', resolved: false });
      }
    } else if (id === 'parent1') {
      result.push({ id, name: 'Parent / Guardian 1', relationship: 'Parent', sourceType: 'parent', resolved: true });
    } else if (id === 'parent2') {
      result.push({ id, name: 'Parent / Guardian 2', relationship: 'Parent', sourceType: 'parent', resolved: true });
    } else if (id === 'important_adults') {
      result.push({ id, name: 'Important adults', relationship: 'Important adult', sourceType: 'important_adults', resolved: true });
    }
  }

  return result;
}

function buildAdultSiblingRoles(
  childrenData: ChildRecord[],
  childProfiles: GuardianshipChildProfile[],
  _ageOfMajority: number
): AdultSiblingRole[] {
  const roles: AdultSiblingRole[] = [];
  const adultIndependents = childProfiles
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.status === 'adult_independent');

  for (const adult of adultIndependents) {
    const minors = childProfiles
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.status === 'minor');

    const forMinorChildIds: string[] = [];
    const forMinorChildNames: string[] = [];
    let role = '';
    const notResponsibleSet = new Set<string>();

    for (const minor of minors) {
      const minorRecord = childrenData[minor.i];
      if (!minorRecord) continue;
      const roleKey = `transitionAdultSiblingRole_${adult.i}`;
      const notRespKey = `transitionAdultSiblingNotResponsible_${adult.i}`;
      const childRole = minorRecord[roleKey];
      if (childRole) {
        if (!role) role = childRole;
        forMinorChildIds.push(minor.c.childId);
        forMinorChildNames.push(minor.c.nickname || minor.c.name);
      }
      const notResp = (minorRecord[notRespKey] || '').split(',').filter(Boolean);
      notResp.forEach(n => notResponsibleSet.add(n));
    }

    if (forMinorChildIds.length > 0 || role) {
      roles.push({
        adultSiblingChildId: adult.c.childId,
        adultSiblingName: adult.c.nickname || adult.c.name,
        role,
        notResponsibleFor: Array.from(notResponsibleSet),
        forMinorChildIds,
        forMinorChildNames,
      });
    }
  }

  return roles;
}

function buildInheritance(
  childIndex: number,
  willsAnswers: Record<string, unknown>,
  clientNames: string[]
): ClientInheritanceInfo[] {
  const currentWillData = willsAnswers.currentWillData as Record<string, unknown> | undefined;
  const clients = (currentWillData?.clients as Array<Record<string, unknown>>) || [];
  const results: ClientInheritanceInfo[] = [];

  for (const client of clients) {
    const clientId = client.clientId as 'client1' | 'client2';
    const clientName = String(client.clientName || (clientId === 'client1' ? clientNames[0] : clientNames[1]) || clientId);

    const arrangements = (client.childSpecificArrangements as Array<Record<string, unknown>>) || [];
    const match = arrangements.find(a => {
      const cid = String(a.childId || '');
      return cid === `child_${childIndex}` || cid === String(childIndex);
    });

    const stages = ((client.trustStages as Array<Record<string, unknown>>) || []).map(s => ({
      age: String(s.age || ''),
      fraction: String(s.fraction || ''),
      description: String(s.description || ''),
    }));

    const info: ClientInheritanceInfo = {
      clientId,
      clientName,
      inheritanceType: client.inheritanceType as string | undefined,
      stages,
      trusteeName: client.trustTrusteeName as string | undefined,
      trusteePersonId: client.trustTrusteePersonId as string | undefined,
    };

    if (match) {
      info.childSpecificArrangement = {
        hasDifferentArrangement: String(match.hasDifferentArrangement || ''),
        specialArrangement: match.specialArrangement as string | undefined,
        knownTrustType: match.knownTypeName as string | undefined,
        description: match.description as string | undefined,
      };
    }

    if (info.inheritanceType || info.childSpecificArrangement || info.trusteeName) {
      results.push(info);
    }
  }

  return results;
}

function buildAdultTransition(child: ChildRecord): AdultTransitionInfo | undefined {
  if (child.disabled !== 'yes' && child.disabled !== 'not_sure') return undefined;
  const age = computeAge(child.dateOfBirth);
  const reviewNeeded = age !== undefined && age >= 14 && age < 19;
  return {
    futureIndependenceLevel: child.futureIndependenceLevel,
    futureFinancialHelp: child.futureFinancialHelp,
    futurePersonalHealthHelp: child.futurePersonalHealthHelp,
    dtcStatus: child.disabilityTaxCredit,
    dtcDocLocation: resolveLocationRef(child.disabilityTaxCreditDocLocation),
    futureCaregiverName: child.futureCareTeamSelection,
    futureCaregiverResponsibility: child.futureCareTeamResponsibility,
    reviewNeeded,
    supportLocationDependent: child.supportLocationDependent,
    supportLocationDependentDetails: child.supportLocationDependentDetails,
  };
}

function buildFirstDaysPriorities(child: ChildRecord): string[] | undefined {
  const count = parseInt(child.transitionFirstDaysCount || '0', 10);
  if (!count) return undefined;
  const items: string[] = [];
  for (let i = 0; i < count; i++) {
    const val = child[`transitionFirstDays_${i}`];
    if (val) items.push(val);
  }
  return items.length > 0 ? items : undefined;
}

function buildFutureEducation(child: ChildRecord): FutureEducationInfo | undefined {
  const paths = (child.futureEducationPaths || '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const other = child.futureEducationPathsOther;
  const expectation = child.futureEducationFinancialSupport;
  const notes = child.futureEducationNotes;

  if (paths.length === 0 && !other && !expectation && !notes) return undefined;

  return {
    educationPath: paths,
    educationPathOther: other,
    financialSupportExpectation: expectation,
    notesForGuardian: notes,
    aspirations: paths as FutureEducationInfo['aspirations'],
    aspirationsOther: other,
    aspirationNotes: notes,
    supportExpectation: expectation as FutureEducationInfo['supportExpectation'],
    supportExpectationDetails: child.futureEducationFinancialSupportOther,
  };
}

function buildEducationFairness(child: ChildRecord): EducationFairnessInfo | undefined {
  const principles = (child.educationFairnessPrinciples || '')
    .split(',').map(s => s.trim()).filter(s => s.length > 0);
  const other = child.educationFairnessPrinciplesOther;
  const details = child.educationFairnessDetails;
  if (principles.length === 0 && !other && !details) return undefined;
  return {
    principles: principles as EducationFairnessInfo['principles'],
    principlesOther: other,
    details,
  };
}

function buildGuardianTrustInfo(childrenData: ChildRecord[]): GuardianTrustInfo | undefined {
  const firstChild = childrenData.find(c => c.guardianWhyChose || c.guardianTrustMessage || c.guardianIfNeededMessage);
  if (!firstChild) return undefined;
  return {
    selectionReason: firstChild.guardianWhyChose,
    trustMessage: firstChild.guardianTrustMessage,
    ifNeededMessage: firstChild.guardianIfNeededMessage,
  };
}

function buildGuardianDiscretionInfo(childrenData: ChildRecord[]): GuardianDiscretionInfo | undefined {
  const firstChild = childrenData.find(c => c.guardianTrustedDecisions || c.guardianEspeciallyImportantWishes);
  if (!firstChild) return undefined;
  return {
    trustedDecisions: firstChild.guardianTrustedDecisions,
    especiallyImportantWishes: firstChild.guardianEspeciallyImportantWishes,
  };
}

function buildFamilyFairnessInfo(childrenData: ChildRecord[]): FamilyFairnessInfo | undefined {
  const firstChild = childrenData.find(c => c.familyFairnessPrinciples || c.familyFairnessPrinciplesOther || c.familyFairnessDetails);
  if (!firstChild) return undefined;
  const principles = (firstChild.familyFairnessPrinciples || '')
    .split(',').map(s => s.trim()).filter(s => s.length > 0);
  return {
    principles: principles as FamilyFairnessInfo['principles'],
    principlesOther: firstChild.familyFairnessPrinciplesOther,
    details: firstChild.familyFairnessDetails,
  };
}

function buildGuardianAssignments(
  childrenData: ChildRecord[],
  childProfiles: GuardianshipChildProfile[],
  planningPersons: PlanningPerson[]
): { assignments: GuardianAssignment[]; households: GuardianHousehold[] } {
  const assignments: GuardianAssignment[] = [];
  const householdsMap = new Map<string, GuardianHousehold>();
  const processed = new Set<number>();

  for (let i = 0; i < childrenData.length; i++) {
    if (processed.has(i)) continue;
    if (childProfiles[i].status !== 'minor') continue;

    const child = childrenData[i];
    const guardianId = child.guardianPersonId;
    const guardian2Id = child.guardianPersonId2;
    const alternateId = child.alternateGuardianPersonId;
    if (!guardianId) continue;

    const guardianPersonIds = [guardianId];
    if (guardian2Id && guardian2Id !== guardianId) {
      guardianPersonIds.push(guardian2Id);
    }

    const household = buildGuardianHousehold(guardianPersonIds, planningPersons);
    householdsMap.set(household.id, household);

    const alternate = findPerson(planningPersons, alternateId);
    const alternatePeople = alternate ? [alternate] : [];
    let alternateHouseholdId: string | undefined;
    if (alternate) {
      const altHousehold = buildGuardianHousehold([alternateId!], planningPersons);
      householdsMap.set(altHousehold.id, altHousehold);
      alternateHouseholdId = altHousehold.id;
    }

    const appliesTo = (child.guardianAppliesTo || '')
      .split(',').filter(Boolean).map(s => parseInt(s, 10));

    const childIds: string[] = [];
    const childNames: string[] = [];
    const childIndices: number[] = [i];
    processed.add(i);

    if (appliesTo.length > 0) {
      for (const sibIdx of appliesTo) {
        if (sibIdx < childrenData.length && !processed.has(sibIdx)) {
          const sibStatus = classifyChild(childrenData[sibIdx], getAgeOfMajority(childrenData[sibIdx].provinceTerritory));
          if (sibStatus === 'minor') {
            childIndices.push(sibIdx);
            processed.add(sibIdx);
          }
        }
      }
    }

    for (const idx of childIndices) {
      childIds.push(childProfiles[idx].childId);
      childNames.push(childProfiles[idx].nickname || childProfiles[idx].name);
    }

    const firstChild = childProfiles[childIndices[0]];
    const currentCommunity = buildCommunityString(
      firstChild.cityOfResidence,
      firstChild.provinceTerritory,
      firstChild.countryOfResidence
    );

    const guardianLabel = buildHouseholdLabel(household.guardianPeople);

    assignments.push({
      id: `ga_${i}`,
      guardianPersonIds: household.guardianPersonIds,
      guardianPeople: household.guardianPeople,
      householdId: household.id,
      alternatePersonIds: alternatePeople.map(p => p.id),
      alternatePeople,
      alternateHouseholdId,
      childIds,
      childNames,
      spokenWith: child.guardianSpokenWith || '',
      inWill: child.guardianInWill || '',
      considered: child.guardianConsidered || '',
      notes: child.guardianNotes,
      isHousehold: guardianLabel.isHousehold,
      householdLabel: guardianLabel.label,
      guardianCommunity: household.city ? buildCommunityString(household.city, household.province, household.country) : '',
      currentCommunity,
      isCrossBorder: household.guardianPeople.length > 0
        ? isCrossBorder(firstChild.countryOfResidence || '', household.country || '')
        : false,
      isCrossProvince: household.guardianPeople.length > 0
        ? isCrossProvince(firstChild.provinceTerritory || '', firstChild.countryOfResidence || '', household.province || '', household.country || '')
        : false,
      moveStatus: parseMoveStatus(child.transitionMoveExpected),
    });
  }

  return { assignments, households: Array.from(householdsMap.values()) };
}

function buildRoles(
  children: GuardianshipChildProfile[],
  guardianAssignments: GuardianAssignment[],
  adultSiblingRoles: AdultSiblingRole[]
): RoleAssignment[] {
  const roles: RoleAssignment[] = [];

  for (const assignment of guardianAssignments) {
    const guardianLabel = assignment.householdLabel || assignment.guardianPeople.map(p => p.name).join(', ');
    const alternateLabel = assignment.alternatePeople.length > 0
      ? buildHouseholdLabel(assignment.alternatePeople).label
      : undefined;

    for (const childName of assignment.childNames) {
      roles.push({
        responsibility: `Day-to-day care of ${childName}`,
        childName,
        firstChoice: guardianLabel,
        backup: alternateLabel,
        isHousehold: assignment.isHousehold,
      });
    }
  }

  for (const child of children) {
    for (const inheritance of child.inheritanceByClient) {
      if (inheritance.trusteeName) {
        roles.push({
          responsibility: `Manage ${child.nickname || child.name}'s inheritance`,
          childName: child.nickname || child.name,
          firstChoice: inheritance.trusteeName,
        });
      }
    }
  }

  for (const role of adultSiblingRoles) {
    if (role.role && role.forMinorChildNames.length > 0) {
      roles.push({
        responsibility: `Maintain sibling connection — ${role.adultSiblingName} for ${role.forMinorChildNames.join(' and ')}`,
        firstChoice: role.adultSiblingName,
      });
    }
  }

  return roles.filter(r => r.firstChoice || r.backup);
}

function matchChildNamesToIds(
  names: string[],
  children: GuardianshipChildProfile[]
): { ids: string[]; names: string[] } {
  const ids: string[] = [];
  const matchedNames: string[] = [];
  for (const name of names) {
    const child = children.find(c =>
      c.name === name || c.nickname === name ||
      `${c.name} ${c.nickname}`.includes(name)
    );
    if (child) {
      ids.push(child.childId);
      matchedNames.push(child.nickname || child.name);
    }
  }
  return { ids, names: matchedNames };
}

function buildFinancialResources(
  children: GuardianshipChildProfile[],
  lifeInsuranceAnswers: Record<string, unknown>,
  financialFootprintAnswers: Record<string, unknown>,
  familyTrustsAnswers: Record<string, unknown>
): FinancialResourceSummary[] {
  const resources: FinancialResourceSummary[] = [];
  const minorChildIds = children.filter(c => c.status === 'minor').map(c => c.childId);
  const minorChildNames = children.filter(c => c.status === 'minor').map(c => c.nickname || c.name);

  const c1HasLI = lifeInsuranceAnswers.client1HasLifeInsurance === 'yes';
  const c2HasLI = lifeInsuranceAnswers.client2HasLifeInsurance === 'yes';
  resources.push({
    type: 'life_insurance',
    exists: c1HasLI || c2HasLI,
    childIds: minorChildIds,
    childNames: minorChildNames,
    crossReference: 'See Family Financial Map for policy details',
  });

  const investments = (financialFootprintAnswers.investmentsData as Array<Record<string, unknown>>) || [];
  const respAccounts = investments.filter(a => String(a.accountType || '').toLowerCase() === 'resp');
  if (respAccounts.length > 0) {
    for (const acct of respAccounts) {
      const beneficiaryChildIds = (acct.respBeneficiaryChildIds as string[]) || [];
      const beneficiaryNames = (acct.respBeneficiaryNames as string[]) || [];
      let childIds: string[] = [];
      let childNames: string[] = [];
      if (beneficiaryChildIds.length > 0) {
        const matched = matchChildNamesToIds(
          beneficiaryNames.length > 0 ? beneficiaryNames : beneficiaryChildIds,
          children
        );
        childIds = matched.ids.length > 0 ? matched.ids : beneficiaryChildIds.map(id => {
          const idx = parseInt(id.replace('child_', ''), 10);
          return children[idx]?.childId || id;
        });
        childNames = matched.names.length > 0 ? matched.names : beneficiaryNames;
      } else {
        childIds = minorChildIds;
        childNames = minorChildNames;
      }
      resources.push({
        type: 'resp',
        exists: true,
        childIds,
        childNames,
        name: String(acct.institution || acct.accountName || ''),
        institution: String(acct.institution || ''),
        crossReference: 'See Family Financial Map for account details',
      });
    }
  } else {
    resources.push({
      type: 'resp',
      exists: false,
      childIds: [],
      childNames: [],
      crossReference: 'See Family Financial Map for account details',
    });
  }

  const rdspAccounts = investments.filter(a => String(a.accountType || '').toLowerCase() === 'rdsp');
  if (rdspAccounts.length > 0) {
    for (const acct of rdspAccounts) {
      const selectedKnown = (acct.selectedKnownBeneficiaries as string[]) || [];
      const customBeneficiaries = (acct.customBeneficiaries as string[]) || [];
      const allBeneficiaryNames = [...selectedKnown, ...customBeneficiaries].filter(Boolean);
      const matched = matchChildNamesToIds(allBeneficiaryNames, children);
      resources.push({
        type: 'rdsp',
        exists: true,
        childIds: matched.ids,
        childNames: matched.names,
        name: String(acct.institution || acct.accountName || ''),
        institution: String(acct.institution || ''),
        crossReference: 'See Family Financial Map for account details',
      });
    }
  } else {
    resources.push({
      type: 'rdsp',
      exists: false,
      childIds: [],
      childNames: [],
      crossReference: 'See Family Financial Map for account details',
    });
  }

  const trusts = (familyTrustsAnswers.familyTrustsData as Array<Record<string, unknown>>) || [];
  resources.push({
    type: 'trust',
    exists: trusts.length > 0,
    childIds: minorChildIds,
    childNames: minorChildNames,
    crossReference: 'See Family Trusts section for details',
  });

  return resources;
}

function buildEstateTrustees(
  estateTrusteesAnswers: Record<string, unknown>,
  clientNames: string[],
  planningPersons: PlanningPerson[]
): EstateTrusteeInfo[] {
  const results: EstateTrusteeInfo[] = [];
  const prefixes = ['client1', 'client2'] as const;

  for (let ci = 0; ci < prefixes.length; ci++) {
    const prefix = prefixes[ci];
    const hasTrustee = estateTrusteesAnswers[`${prefix}HasEstateTrustee`] === 'yes';
    if (!hasTrustee) continue;

    const clientName = clientNames[ci] || (prefix === 'client1' ? 'Client 1' : 'Client 2');
    const trusteeName = resolvePersonNameField(estateTrusteesAnswers[`${prefix}EstateTrusteeName`]);
    const spouseIsTrustee = estateTrusteesAnswers[`${prefix}SpouseIsEstateTrustee`] === 'yes';

    let primaryName = trusteeName;
    if (spouseIsTrustee && !trusteeName) {
      primaryName = clientNames[ci === 0 ? 1 : 0] || '';
    }

    const primary: EstateTrusteePerson | undefined = primaryName ? {
      name: primaryName,
      personId: String(estateTrusteesAnswers[`${prefix}EstateTrusteePersonId`] || '') || undefined
        || planningPersons.find(p => p.name.toLowerCase() === primaryName.toLowerCase())?.id,
      phone: String(estateTrusteesAnswers[`${prefix}EstateTrusteePhone`] || '') || undefined,
      email: String(estateTrusteesAnswers[`${prefix}EstateTrusteeEmail`] || '') || undefined,
      relationship: String(estateTrusteesAnswers[`${prefix}EstateTrusteeRelationship`] || '') || undefined,
      city: String(estateTrusteesAnswers[`${prefix}EstateTrusteeCity`] || '') || undefined,
      province: String(estateTrusteesAnswers[`${prefix}EstateTrusteeProvince`] || '') || undefined,
      country: String(estateTrusteesAnswers[`${prefix}EstateTrusteeCountry`] || '') || undefined,
      isCanadaResident: String(estateTrusteesAnswers[`${prefix}EstateTrusteeIsCanadaResident`] || '') || undefined,
    } : undefined;

    const alternates: EstateTrusteePerson[] = [];
    const hasAlternate = estateTrusteesAnswers[`${prefix}HasAlternateEstateTrustee`] === 'yes';
    if (hasAlternate) {
      const altCount = parseInt(String(estateTrusteesAnswers[`${prefix}EstateTrusteeCount`] || '1'), 10);
      for (let ai = 1; ai <= altCount; ai++) {
        const altName = resolvePersonNameField(estateTrusteesAnswers[`${prefix}AlternateEstateTrustee${ai}Name`]);
        if (altName) {
          alternates.push({
            name: altName,
            phone: String(estateTrusteesAnswers[`${prefix}AlternateEstateTrustee${ai}Phone`] || '') || undefined,
            email: String(estateTrusteesAnswers[`${prefix}AlternateEstateTrustee${ai}Email`] || '') || undefined,
            relationship: String(estateTrusteesAnswers[`${prefix}AlternateEstateTrustee${ai}Relationship`] || '') || undefined,
          });
        }
      }
    }

    if (primary || alternates.length > 0) {
      results.push({
        clientId: prefix,
        clientName,
        hasEstateTrustee: true,
        primaryTrustee: primary,
        alternateTrustees: alternates,
      });
    }
  }

  return results;
}

function normalizeLocationForOutput(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/\s+/g, ' ').replace(/^(our|the)\s+/i, '').replace(/[.,;:!?]+$/g, '');
  if (!trimmed) return undefined;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function resolveLocationRef(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') return normalizeLocationForOutput(raw);
  if (typeof raw === 'object' && raw !== null && 'label' in raw) {
    const label = (raw as { label: string }).label;
    return normalizeLocationForOutput(label);
  }
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (typeof first === 'object' && first !== null && 'label' in first) {
      return normalizeLocationForOutput((first as { label: string }).label);
    }
    if (typeof first === 'string') return normalizeLocationForOutput(first);
  }
  return undefined;
}

function buildDocuments(
  children: GuardianshipChildProfile[],
  willsAnswers: Record<string, unknown>,
  clientNames: string[]
): DocumentRegistryEntry[] {
  const docs: DocumentRegistryEntry[] = [];

  const currentWillData = willsAnswers.currentWillData as Record<string, unknown> | undefined;
  const clients = (currentWillData?.clients as Array<Record<string, unknown>>) || [];

  for (const client of clients) {
    const clientId = client.clientId as 'client1' | 'client2';
    const db = (client.documentBasics as Record<string, unknown>) || {};
    const hasWill = db.hasWill === 'yes';
    const willLocation = resolveLocationRef(db.willLocation);
    const clientName = clientId === 'client1' ? (clientNames[0] || 'Client 1') : (clientNames[1] || 'Client 2');

    docs.push({
      type: 'will',
      label: `${clientName}'s Will`,
      exists: hasWill,
      locationKnown: !!willLocation,
      location: willLocation,
      clientId,
    });

    if (db.hasSecondaryWill === 'yes') {
      const secLocation = resolveLocationRef(db.secondaryWillLocation);
      docs.push({
        type: 'secondary_will',
        label: `${clientName}'s Secondary Will`,
        exists: true,
        locationKnown: !!secLocation,
        location: secLocation,
        clientId,
      });
    }
  }

  for (const child of children) {
    const name = child.nickname || child.name;
    if (child.educationTransition?.iepDocumentLocation) {
      docs.push({
        type: 'iep',
        label: `IEP for ${name}`,
        exists: child.educationTransition.hasIEP,
        locationKnown: true,
        location: normalizeLocationForOutput(child.educationTransition.iepDocumentLocation),
        childId: child.childId,
      });
    }
    if (child.educationTransition?.recordLocation) {
      docs.push({
        type: 'education_records',
        label: `Education records for ${name}`,
        exists: true,
        locationKnown: true,
        location: normalizeLocationForOutput(child.educationTransition.recordLocation),
        childId: child.childId,
      });
    }
    if (child.healthcareTransition?.recordLocation) {
      docs.push({
        type: 'health_records',
        label: `Health records for ${name}`,
        exists: true,
        locationKnown: true,
        location: normalizeLocationForOutput(child.healthcareTransition.recordLocation),
        childId: child.childId,
      });
    }
    if (child.healthcareTransition?.carePlanStored) {
      docs.push({
        type: 'care_plan',
        label: `Care plan for ${name}`,
        exists: child.healthcareTransition.carePlanWritten === 'yes',
        locationKnown: true,
        location: normalizeLocationForOutput(child.healthcareTransition.carePlanStored),
        childId: child.childId,
      });
    }
    if (child.adultTransition?.dtcDocLocation) {
      docs.push({
        type: 'dtc',
        label: `Disability Tax Credit documentation for ${name}`,
        exists: child.adultTransition.dtcStatus === 'yes' || child.adultTransition.dtcStatus === 'in-progress',
        locationKnown: true,
        location: normalizeLocationForOutput(child.adultTransition.dtcDocLocation),
        childId: child.childId,
      });
    }
    if (child.birthCertificateLocation) {
      docs.push({
        type: 'birth_certificate',
        label: `Birth certificate for ${name}`,
        exists: true,
        locationKnown: true,
        location: normalizeLocationForOutput(child.birthCertificateLocation),
        childId: child.childId,
      });
    }
  }

  return docs;
}

function buildReadiness(
  children: GuardianshipChildProfile[],
  guardianAssignments: GuardianAssignment[],
  willsAnswers: Record<string, unknown>
): ReadinessCategory {
  const decisionsMade: string[] = [];
  const thingsWorthConfirming: string[] = [];
  const thingsStillToDo: string[] = [];

  const currentWillData = willsAnswers.currentWillData as Record<string, unknown> | undefined;
  const clients = (currentWillData?.clients as Array<Record<string, unknown>>) || [];
  const hasAnyWill = clients.some(c => (c.documentBasics as Record<string, unknown>)?.hasWill === 'yes');

  for (const child of children) {
    if (child.status !== 'minor') continue;
    const name = child.nickname || child.name;
    const assignment = guardianAssignments.find(a => a.childIds.includes(child.childId));

    if (assignment?.guardianPeople.length) {
      const guardianName = assignment.householdLabel;
      if (assignment.spokenWith === 'yes_agreed' && assignment.inWill === 'yes') {
        decisionsMade.push(`Guardian selected for ${name}: ${guardianName}`);
      } else if (assignment.spokenWith === 'yes_not_confirmed') {
        thingsWorthConfirming.push(`Confirm guardian appointment with ${guardianName} for ${name}`);
      } else if (assignment.spokenWith === 'not_yet' || assignment.spokenWith === 'not_sure') {
        thingsWorthConfirming.push(`Have the guardianship conversation with ${guardianName} for ${name}`);
      } else if (!assignment.spokenWith) {
        thingsStillToDo.push(`Guardian for ${name} selected but not yet contacted`);
      }
      if (assignment.inWill === 'no' || assignment.inWill === 'not_sure') {
        thingsWorthConfirming.push(`Confirm whether ${name}'s guardian is named in the Will`);
      }
      if (assignment.inWill === 'no_will') {
        thingsStillToDo.push(`No Will identified — the intended guardian appointment for ${name} should be reviewed with an estate lawyer`);
      }
      // Alternate guardian: generate a planning confirmation (not an error)
      // Deduplicate across children who share the same primary guardian.
      // We collect these and deduplicate after the loop.
      if (!assignment.alternatePeople.length) {
        // handled in alternateGuardianItems below
      }
      if (!assignment.guardianCommunity) {
        thingsWorthConfirming.push(`Guardian location for ${name} is incomplete — community unknown`);
      }
    } else {
      thingsStillToDo.push(`No guardian selected for ${name}`);
    }

    if (child.status === 'minor' && child.disabled) {
      const ht = child.healthcareTransition;
      if (ht && !ht.recordLocation) {
        thingsStillToDo.push(`Location of important health records for ${name} is not known`);
      }
      const st = child.supportTransition;
      if (!st || st.length === 0) {
        thingsStillToDo.push(`Support needs identified for ${name} but support transition plan incomplete`);
      }
      const at = child.adultTransition;
      if (at?.dtcStatus === 'yes' && !at.dtcDocLocation) {
        thingsStillToDo.push(`DTC documentation location unknown for ${name}`);
      }
      if (at?.reviewNeeded) {
        thingsWorthConfirming.push(`${name} is approaching adulthood — future support review may be needed`);
      }
    }

    const et = child.educationTransition;
    if (et) {
      if (et.schoolChangeExpected === 'yes_most_likely' || et.schoolChangeExpected === 'possibly') {
        if (!et.recordLocation) {
          thingsStillToDo.push(`School change likely for ${name} but education records location unknown`);
        }
      }
    }

    const moveStatus = assignment?.moveStatus;
    if (moveStatus === 'likely' || moveStatus === 'possible') {
      const importantConns = (child.importantConnections || []).filter(c => c.importance === 'especially_important');
      for (const conn of importantConns) {
        if (!conn.hasContactInfo) {
          thingsWorthConfirming.push(`Especially important connection for ${name} — ${conn.name} — has no practical contact info`);
        }
        if (conn.continuityIdeas.length === 0) {
          thingsStillToDo.push(`Move likely for ${name} but no continuity ideas captured for ${conn.name}`);
        }
      }
    }

    for (const inheritance of child.inheritanceByClient) {
      if (!inheritance.trusteeName && inheritance.inheritanceType && inheritance.inheritanceType !== 'outright') {
        thingsWorthConfirming.push(`Trustee for ${name}'s inheritance is unclear in ${inheritance.clientName}'s Will understanding`);
      }
      if (inheritance.inheritanceType === 'not_sure') {
        thingsWorthConfirming.push(`${inheritance.clientName} is unsure how their Will handles ${name}'s inheritance`);
      }
      const arr = inheritance.childSpecificArrangement;
      if (arr?.hasDifferentArrangement === 'yes' && (!arr.description && !arr.knownTrustType)) {
        thingsWorthConfirming.push(`Special arrangement for ${name} in ${inheritance.clientName}'s Will but details unclear`);
      }
    }
  }

  // Alternate-guardian planning confirmations — deduplicated across children
  // who share the same primary guardian. If two children have the same guardian
  // and neither has an alternate, produce one consolidated item rather than two.
  const alternateGuardianItems: Array<{ guardianLabel: string; childNames: string[] }> = [];
  for (const assignment of guardianAssignments) {
    if (!assignment.guardianPeople.length) continue;
    if (assignment.alternatePeople.length > 0) continue;
    const guardianLabel = assignment.householdLabel;
    const childNames = assignment.childNames;
    const existing = alternateGuardianItems.find(a => a.guardianLabel === guardianLabel);
    if (existing) {
      for (const cn of childNames) {
        if (!existing.childNames.includes(cn)) existing.childNames.push(cn);
      }
    } else {
      alternateGuardianItems.push({ guardianLabel, childNames: [...childNames] });
    }
  }
  for (const item of alternateGuardianItems) {
    const childLabel = item.childNames.length === 1
      ? item.childNames[0]
      : item.childNames.join(' and ');
    if (item.childNames.length === 1) {
      thingsWorthConfirming.push(
        `You have identified ${item.guardianLabel} as your first choice for ${childLabel}, but no alternate guardian has been identified if ${item.guardianLabel} were unable or unwilling to act.`
      );
    } else {
      thingsWorthConfirming.push(
        `You have identified ${item.guardianLabel} as your first choice for ${childLabel}, but no alternate guardian has been identified for either child if ${item.guardianLabel} were unable or unwilling to act.`
      );
    }
  }

  if (!hasAnyWill) {
    thingsStillToDo.push('No Will identified — guardian intentions are documented in the Kit, but no Will has been identified containing the appointment. This should be reviewed with an estate lawyer.');
  }

  return { decisionsMade, thingsWorthConfirming, thingsStillToDo };
}

// Extract capitalized proper-noun-like names from free text (e.g., "Jimmy", "Don").
// Only extracts standalone capitalized words that are unlikely to be sentence starts.
function extractNamesFromText(text: string): string[] {
  if (!text) return [];
  // Match capitalized words of 2+ chars that aren't common sentence-start words
  const stopWords = new Set(['The', 'This', 'That', 'These', 'Those', 'They', 'Their',
    'We', 'Our', 'Us', 'I', 'He', 'She', 'His', 'Her', 'It', 'Its', 'A', 'An',
    'And', 'But', 'Or', 'So', 'If', 'When', 'While', 'What', 'Who', 'How', 'Why',
    'Playdates', 'Overnight', 'Camp', 'Christmas', 'Thanksgiving', 'Easter',
    'Birthday', 'Birthdays', 'School', 'Home', 'Family', 'Families', 'Friends',
    'Parents', 'Guardian', 'Guardians', 'Visits', 'Sleepovers', 'Summer',
    'Video', 'Calls', 'Contact', 'Tradition', 'Traditions', 'Market', 'Markets',
    'Maintaining', 'Keeping', 'Helping', 'Making', 'Regular', 'Deliberate',
    'Effort', 'Important', 'Especially', 'Would', 'Could', 'Should', 'May',
    'Might', 'Can', 'Will', 'Has', 'Have', 'Had', 'Are', 'Is', 'Was', 'Were',
    'For', 'With', 'From', 'About', 'Into', 'After', 'Before', 'During',
    'Not', 'No', 'Yes', 'More', 'Most', 'Both', 'Each', 'Other', 'Another',
    'Some', 'Such', 'Very', 'Also', 'Even', 'Still', 'Just', 'Only', 'Once']);
  const matches = text.match(/\b[A-Z][a-z]{1,15}\b/g) || [];
  return matches.filter(m => !stopWords.has(m));
}

function buildImmediateActions(
  children: GuardianshipChildProfile[],
  guardianAssignments: GuardianAssignment[],
  adultSiblingRoles: AdultSiblingRole[],
  willsAnswers: Record<string, unknown>,
  estateTrustees: EstateTrusteeInfo[],
  clientNames: string[]
): ImmediateAction[] {
  const actions: ImmediateAction[] = [];
  const seen = new Set<string>();

  const addAction = (id: string, action: string, priority: number, childIds: string[], childNames: string[], conditional = false, isParentWish = false) => {
    if (seen.has(id)) return;
    seen.add(id);
    actions.push({ id, action, priority, childIds, childNames, conditional, isParentWish });
  };

  for (const assignment of guardianAssignments) {
    if (!assignment.guardianPeople.length) continue;
    const guardianName = assignment.householdLabel;
    const phone = assignment.guardianPeople[0]?.phone ? ` at ${assignment.guardianPeople[0].phone}` : '';
    const childLabel = assignment.childNames.length > 1
      ? assignment.childNames.join(' and ')
      : assignment.childNames[0];
    addAction(
      `guardian_contact_${assignment.id}`,
      `Contact ${guardianName}${phone} — the intended guardian${assignment.isHousehold ? 's' : ''} for ${childLabel}`,
      1,
      assignment.childIds,
      assignment.childNames,
    );
  }

  const minorChildren = children.filter(c => c.status === 'minor');
  if (minorChildren.length > 1) {
    addAction(
      'keep_together',
      'Keep the minor children together where reasonably possible',
      2,
      minorChildren.map(c => c.childId),
      minorChildren.map(c => c.nickname || c.name),
    );
  }

  for (const role of adultSiblingRoles) {
    if (role.forMinorChildNames.length > 0) {
      addAction(
        `sibling_contact_${role.adultSiblingChildId}`,
        `Contact ${role.adultSiblingName} — important sibling connection for ${role.forMinorChildNames.join(' and ')}`,
        3,
        [],
        role.forMinorChildNames,
      );
    }
  }

  for (const child of minorChildren) {
    // Merge all relationship/continuity sources into a single per-child action.
    // Sources: peopleToKeepClose (non-sibling) + importantConnections + missedMost/feelConnected text
    const peopleNames: string[] = [];
    const relationshipDetail: string[] = [];
    const seenNames = new Set<string>();
    const normName = (n: string) => n.toLowerCase().replace(/\s+/g, ' ').trim();
    const addName = (name: string) => {
      const key = normName(name);
      if (key && !seenNames.has(key)) {
        seenNames.add(key);
        peopleNames.push(name);
      }
    };

    // peopleToKeepClose — non-sibling people the child would miss
    const people = (child.peopleToKeepClose || []).filter(p =>
      p.resolved && p.name &&
      p.sourceType !== 'minor_sibling' &&
      p.sourceType !== 'adult_sibling'
    );
    for (const p of people) {
      addName(p.name);
    }

    // importantConnections — all named connections (not just especially_important)
    const important = (child.importantConnections || []).filter(c => c.name);
    for (const c of important) {
      addName(c.name);
      if (c.importance === 'especially_important') {
        const detail = c.whyItMatters
          ? `${c.name} is especially important to ${child.nickname || child.name}. ${c.whyItMatters}`
          : `${c.name} is an especially important relationship for ${child.nickname || child.name}.`;
        relationshipDetail.push(detail);
      }
      if (c.continuityIdeas && c.continuityIdeas.length > 0) {
        relationshipDetail.push(`${c.name}: ${c.continuityIdeas.join(', ')}`);
      }
    }

    // Extract names from free-text fields: missedMost, feelConnected, transitionEasier
    const pp = child.personalProfile;
    if (pp?.missedMost) {
      relationshipDetail.push(`${child.nickname || child.name} would especially miss: ${pp.missedMost}`);
      extractNamesFromText(pp.missedMost).forEach(addName);
    }
    if (pp?.feelConnected) {
      relationshipDetail.push(`What could help ${child.nickname || child.name} feel connected: ${pp.feelConnected}`);
      extractNamesFromText(pp.feelConnected).forEach(addName);
    }

    if (peopleNames.length > 0) {
      const childName = child.nickname || child.name;
      const names = peopleNames.join(', ');
      const detailText = relationshipDetail.length > 0 ? relationshipDetail.join(' ') : '';
      addAction(
        `keep_connected_${child.childId}`,
        detailText || `Help ${childName} stay connected — identify ${names} as key relationships`,
        7,
        [child.childId],
        [childName],
      );
      // Flag missing contact information for important relationships
      const missingContact = (child.importantConnections || []).filter(c =>
        c.importance === 'especially_important' && c.name && !c.hasContactInfo
      );
      if (missingContact.length > 0) {
        const namesWithoutContact = missingContact.map(c => c.name);
        addAction(
          `obtain_contacts_${child.childId}`,
          `Obtain contact information for ${namesWithoutContact.join(', ')} while ${clientNames.length > 1 ? clientNames.join(' and ') : (clientNames[0] || 'the parents')} are available to provide it`,
          7,
          [child.childId],
          [childName],
          true,
        );
      }
    }
  }

  const currentWillData = willsAnswers.currentWillData as Record<string, unknown> | undefined;
  const clients = (currentWillData?.clients as Array<Record<string, unknown>>) || [];
  const hasWill = clients.some(c => (c.documentBasics as Record<string, unknown>)?.hasWill === 'yes');

  if (hasWill && estateTrustees.length > 0) {
    const allTrusteeNames = estateTrustees
      .map(et => et.primaryTrustee?.name)
      .filter(Boolean);
    const uniqueNames = Array.from(new Set(allTrusteeNames));
    const clientLabel = clientNames.length > 1 ? clientNames.join(' and ') : clientNames[0] || '';
    if (uniqueNames.length === 1) {
      addAction('estate_trustee', `Locate ${clientLabel}'s Wills and contact ${uniqueNames[0]}, their Estate Trustee`, 5, [], []);
    } else if (uniqueNames.length > 1) {
      const parts = estateTrustees.map(et =>
        `${et.primaryTrustee?.name} (${et.clientName}'s Estate Trustee)`
      );
      addAction('estate_trustee', `Locate Wills and contact Estate Trustees: ${parts.join('; ')}`, 5, [], []);
    }
  }

  const recordActions: Array<{ childId: string; childName: string; parts: string[] }> = [];
  for (const child of minorChildren) {
    const parts: string[] = [];
    if (child.educationTransition?.recordLocation) {
      parts.push(`education records from ${normalizeLocationForOutput(child.educationTransition.recordLocation)}`);
    }
    if (child.healthcareTransition?.recordLocation) {
      parts.push(`health records from ${normalizeLocationForOutput(child.healthcareTransition.recordLocation)}`);
    }
    if (child.birthCertificateLocation) {
      parts.push(`birth certificate from ${normalizeLocationForOutput(child.birthCertificateLocation)}`);
    }
    if (parts.length > 0) {
      recordActions.push({ childId: child.childId, childName: child.nickname || child.name, parts });
    }
  }
  // Deduplicate record-location parts across children (same location + doc type)
  if (recordActions.length === 1) {
    const r = recordActions[0];
    addAction('gather_records', `Gather ${r.parts.join(' and ')} for ${r.childName}`, 6, [r.childId], [r.childName]);
  } else if (recordActions.length > 1) {
    const seenParts = new Set<string>();
    const allParts: string[] = [];
    for (const r of recordActions) {
      for (const part of r.parts) {
        if (!seenParts.has(part)) {
          seenParts.add(part);
          allParts.push(part);
        }
      }
    }
    addAction('gather_records_all', `Gather records: ${allParts.join('; ')}`, 6,
      recordActions.map(r => r.childId), recordActions.map(r => r.childName));
  }

  addAction('avoid_changes', 'Avoid unnecessary extra changes initially — allow time for adjustment before making non-essential transitions', 8, [], [], true);

  for (const child of minorChildren) {
    if (child.firstDaysPriorities && child.firstDaysPriorities.length > 0) {
      const name = child.nickname || child.name;
      for (let i = 0; i < child.firstDaysPriorities.length; i++) {
        const item = child.firstDaysPriorities[i];
        if (item) {
          addAction(
            `firstdays_${child.childId}_${i}`,
            `${name}: ${item}`,
            9 + i,
            [child.childId],
            [name],
            false,
            true,
          );
        }
      }
    }
  }

  return actions.sort((a, b) => a.priority - b.priority);
}

function buildCareFundingCoordination(
  allAnswers: AnswersMap,
  guardianAssignments: GuardianAssignment[],
  childProfiles: GuardianshipChildProfile[],
  estateTrustees: EstateTrusteeInfo[],
  willsAnswers: Record<string, unknown>,
  planningPersons: PlanningPerson[],
  fundingPhilosophy: ChildCareFundingPhilosophy | undefined
): CareFundingCoordination[] {
  const minorChildIds = childProfiles.filter(c => c.status === 'minor').map(c => c.childId);
  if (minorChildIds.length === 0) return [];

  const ctx = getCareFundingCoordinationContext(
    allAnswers,
    guardianAssignments,
    childProfiles,
    estateTrustees,
    willsAnswers,
    planningPersons,
    fundingPhilosophy
  );

  const scenarioCoords = buildScenarioCoordinations(guardianAssignments, ctx);

  return scenarioCoords.map(sc => ({
    scenario: sc.scenario,
    childIds: sc.childIds,
    caregiverPersonIds: sc.caregiverPersonIds,
    financialDecisionMakers: sc.financialDecisionMakers,
    samePeople: sc.samePeople,
    coordinationNeeded: sc.coordinationNeeded,
    identityConfidence: sc.identityConfidence,
  }));
}

function buildFundingPhilosophy(
  childrenAnswers: Record<string, unknown>
): ChildCareFundingPhilosophy | undefined {
  const raw = childrenAnswers.fundingPhilosophyData as Record<string, unknown> | undefined;
  if (!raw) return undefined;

  const philosophy: ChildCareFundingPhilosophy = {};

  if (raw.overallApproach) philosophy.overallApproach = raw.overallApproach as ChildCareFundingPhilosophy['overallApproach'];
  if (raw.everydayExpenseApproach) philosophy.everydayExpenseApproach = String(raw.everydayExpenseApproach);
  if (raw.meaningfulExpenseApproach) philosophy.meaningfulExpenseApproach = String(raw.meaningfulExpenseApproach);
  if (raw.majorHouseholdExpenseApproach) philosophy.majorHouseholdExpenseApproach = String(raw.majorHouseholdExpenseApproach);
  if (raw.housingPreference) philosophy.housingPreference = String(raw.housingPreference);
  if (raw.housingStructureDiscussed) philosophy.housingStructureDiscussed = String(raw.housingStructureDiscussed);
  if (raw.vehiclePreference) philosophy.vehiclePreference = String(raw.vehiclePreference);
  if (raw.vehicleNotes) philosophy.vehicleNotes = String(raw.vehicleNotes);
  if (raw.workReductionPreference) philosophy.workReductionPreference = String(raw.workReductionPreference);
  if (raw.workReductionNotes) philosophy.workReductionNotes = String(raw.workReductionNotes);
  if (raw.householdHelpPreference) philosophy.householdHelpPreference = String(raw.householdHelpPreference);
  if (raw.importantLifestyleSupportIds) {
    const ids = raw.importantLifestyleSupportIds;
    philosophy.importantLifestyleSupportIds = typeof ids === 'string' ? ids.split(',').filter(Boolean) : Array.isArray(ids) ? ids.map(String) : undefined;
  }
  if (raw.sharedHouseholdBenefitPhilosophy) philosophy.sharedHouseholdBenefitPhilosophy = String(raw.sharedHouseholdBenefitPhilosophy);
  if (raw.guardianOwnChildrenFairnessNotes) philosophy.guardianOwnChildrenFairnessNotes = String(raw.guardianOwnChildrenFairnessNotes);
  if (raw.recordKeepingPreference) philosophy.recordKeepingPreference = String(raw.recordKeepingPreference);
  if (raw.decisionMakingApproach) philosophy.decisionMakingApproach = String(raw.decisionMakingApproach);
  if (raw.guardianJudgmentWeight) philosophy.guardianJudgmentWeight = String(raw.guardianJudgmentWeight);
  if (raw.guardianJudgmentNotes) philosophy.guardianJudgmentNotes = String(raw.guardianJudgmentNotes);
  if (raw.guardianShouldUnderstand) {
    const items = raw.guardianShouldUnderstand;
    philosophy.guardianShouldUnderstand = typeof items === 'string' ? items.split(',').filter(Boolean) : Array.isArray(items) ? items.map(String) : undefined;
  }
  if (raw.financialDecisionMakerShouldUnderstand) {
    const items = raw.financialDecisionMakerShouldUnderstand;
    philosophy.financialDecisionMakerShouldUnderstand = typeof items === 'string' ? items.split(',').filter(Boolean) : Array.isArray(items) ? items.map(String) : undefined;
  }
  if (raw.discussionRequiredFor) {
    const items = raw.discussionRequiredFor;
    philosophy.discussionRequiredFor = typeof items === 'string' ? items.split(',').filter(Boolean) : Array.isArray(items) ? items.map(String) : undefined;
  }
  if (raw.hasDiscussionThreshold) philosophy.hasDiscussionThreshold = String(raw.hasDiscussionThreshold);
  if (raw.discussionThresholdAmount) philosophy.discussionThresholdAmount = Number(raw.discussionThresholdAmount);
  if (raw.disagreementApproach) {
    const items = raw.disagreementApproach;
    philosophy.disagreementApproach = typeof items === 'string' ? items.split(',').filter(Boolean) : Array.isArray(items) ? items.map(String) : undefined;
  }
  if (raw.escalationPersonIds) {
    const ids = raw.escalationPersonIds;
    philosophy.escalationPersonIds = typeof ids === 'string' ? ids.split(',').filter(Boolean) : Array.isArray(ids) ? ids.map(String) : undefined;
  }
  if (raw.firstEscalationPersonId) philosophy.firstEscalationPersonId = String(raw.firstEscalationPersonId);
  if (raw.parentMessageToGuardian) philosophy.parentMessageToGuardian = String(raw.parentMessageToGuardian);
  if (raw.parentMessageToFinancialDecisionMaker) philosophy.parentMessageToFinancialDecisionMaker = String(raw.parentMessageToFinancialDecisionMaker);
  if (raw.parentMessageAboutWorkingTogether) philosophy.parentMessageAboutWorkingTogether = String(raw.parentMessageAboutWorkingTogether);

  const hasAny = Object.values(philosophy).some(v =>
    v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  );
  return hasAny ? philosophy : undefined;
}

function buildFundingReviewItems(
  philosophy: ChildCareFundingPhilosophy | undefined,
  coordination: CareFundingCoordination[],
  willsAnswers: Record<string, unknown>
): FundingReviewItem[] {
  const items: FundingReviewItem[] = [];
  if (!philosophy) {
    if (coordination.some(c => c.coordinationNeeded)) {
      items.push({
        id: 'funding_coordination_gap',
        category: 'coordination',
        description: 'Guardian and financial decision-maker are different people but no funding or decision-making philosophy has been expressed. Consider documenting how they should work together.',
        severity: 'reviewRecommended',
      });
    }
    return items;
  }

  const currentWillData = willsAnswers.currentWillData as Record<string, unknown> | undefined;
  const willClients = (currentWillData?.clients as Array<Record<string, unknown>>) || [];
  const trustPowersKnown = willClients.some(c =>
    (c.trustPowers || c.trustFlexibility) && c.trustPowers !== 'not_sure' && c.trustPowers !== undefined
  );

  if (philosophy.housingPreference === 'stronglySupport' &&
      (!philosophy.housingStructureDiscussed || philosophy.housingStructureDiscussed === 'no')) {
    items.push({
      id: 'funding_housing_undocumented',
      category: 'housing',
      description: 'Parents strongly support using resources for a larger home but have not discussed how the contribution should be structured or documented. Consider reviewing with an estate lawyer.',
      severity: 'reviewRecommended',
    });
  }

  if (philosophy.workReductionPreference === 'yes' && !trustPowersKnown) {
    items.push({
      id: 'funding_work_reduction_unknown',
      category: 'workReduction',
      description: 'Parents want resources to help offset a guardian\'s reduction in work, but it is not known whether the current estate plan allows this flexibility. Consider reviewing with an estate lawyer.',
      severity: 'reviewRecommended',
    });
  }

  if (philosophy.overallApproach === 'generousHouseholdSupport' && !trustPowersKnown) {
    items.push({
      id: 'funding_broad_support_unknown',
      category: 'broadSupport',
      description: 'Parents want resources used generously to support the guardian household, but the flexibility of the current trust powers is unclear. Consider reviewing with an estate lawyer.',
      severity: 'reviewRecommended',
    });
  }

  if (philosophy.housingPreference === 'stronglySupport' && !trustPowersKnown) {
    items.push({
      id: 'funding_housing_unknown_flexibility',
      category: 'housing',
      description: 'Parents support using estate or trust resources for a larger home but it is not known whether the Will or trust allows this. Consider reviewing with an estate lawyer.',
      severity: 'reviewRecommended',
    });
  }

  if (philosophy.recordKeepingPreference === 'detailedAccounting' ||
      philosophy.recordKeepingPreference === 'trusteeApproval') {
    items.push({
      id: 'funding_detailed_tracking',
      category: 'documentation',
      description: 'Parents prefer detailed accounting or trustee approval for larger expenses. This is a planning preference, not a risk.',
      severity: 'informational',
    });
  }

  if (coordination.some(c => c.coordinationNeeded) && !philosophy.decisionMakingApproach) {
    items.push({
      id: 'funding_no_decision_approach',
      category: 'coordination',
      description: 'Guardian and financial decision-maker are different people but no decision-making approach has been documented.',
      severity: 'reviewRecommended',
    });
  }

  return items;
}

export function buildGuardianshipRoadmap(allAnswers: AnswersMap): GuardianshipRoadmapModel {
  const aboutYou = allAnswers.get('aboutYou') || {};
  const childrenAnswers = allAnswers.get('children') || {};
  const willsAnswers = allAnswers.get('wills') || {};
  const estateTrusteesAnswers = allAnswers.get('estateTrustees') || {};
  const lifeInsuranceAnswers = allAnswers.get('lifeInsurance') || {};
  const financialFootprintAnswers = allAnswers.get('financialFootprint') || {};
  const familyTrustsAnswers = allAnswers.get('familyTrusts') || {};

  const province = String(aboutYou.province || '');
  const ageOfMajority = getAgeOfMajority(province);

  const clientNames: string[] = [];
  const c1Name = String(aboutYou.fullName || '');
  if (c1Name) clientNames.push(c1Name);
  const hasSpouse = aboutYou.maritalStatus === 'married' || aboutYou.maritalStatus === 'common_law';
  if (hasSpouse) {
    const c2Name = String(aboutYou.spouseName || '');
    if (c2Name) clientNames.push(c2Name);
  }

  const childrenData = (childrenAnswers.childrenData as Array<ChildRecord>) || [];
  const planningPersons = parsePlanningPersons(childrenAnswers.planningPersons);

  const childProfiles: GuardianshipChildProfile[] = childrenData.map((child, index) => {
    const status = classifyChild(child, ageOfMajority);
    const disabled = child.disabled === 'yes';
    const disabilityUncertain = child.disabled === 'not_sure';
    const age = computeAge(child.dateOfBirth);
    const moveStatus = parseMoveStatus(child.transitionMoveExpected);
    const moveLikely = moveStatus === 'likely' || moveStatus === 'possible';
    const allProviders = buildAllProviders(child);

    return {
      childId: `child_${index}`,
      index,
      name: child.name || '',
      nickname: child.nickname || '',
      dateOfBirth: child.dateOfBirth,
      age,
      status,
      planningFocus: derivePlanningFocus(status, disabled, disabilityUncertain),
      disabled,
      disabilityUncertain,
      supportNeedTypes: (child.supportNeedTypes || '').split(',').filter(Boolean),
      cityOfResidence: child.cityOfResidence,
      provinceTerritory: child.provinceTerritory,
      countryOfResidence: child.countryOfResidence,
      personalProfile: buildPersonalProfile(child),
      educationTransition: buildEducationTransition(child),
      healthcareTransition: buildHealthcareTransition(child, allProviders),
      supportTransition: buildSupportTransition(child, moveStatus, allProviders),
      importantConnections: buildImportantConnections(child, moveLikely),
      communities: buildCommunities(child),
      traditions: buildTraditions(child),
      peopleToKeepClose: resolveFamilySelections(
        child.transitionPeopleSelections || child.belongingFamilySelections || '',
        planningPersons,
        childrenData,
        index
      ),
      adultSiblingRoles: [],
      inheritanceByClient: buildInheritance(index, willsAnswers, clientNames),
      adultTransition: buildAdultTransition(child),
      futureEducation: buildFutureEducation(child),
      educationFairness: buildEducationFairness(child),
      firstDaysPriorities: buildFirstDaysPriorities(child),
      birthCertificateLocation: resolveLocationRef(child.birthCertificateLocation),
    };
  });

  const { assignments: guardianAssignments, households: guardianHouseholds } =
    buildGuardianAssignments(childrenData, childProfiles, planningPersons);
  const adultSiblingRoles = buildAdultSiblingRoles(childrenData, childProfiles, ageOfMajority);

  for (const child of childProfiles) {
    if (child.status === 'minor') {
      child.adultSiblingRoles = adultSiblingRoles.filter(r => r.forMinorChildIds.includes(child.childId));
    }
  }

  const roles = buildRoles(childProfiles, guardianAssignments, adultSiblingRoles);
  const financialResources = buildFinancialResources(
    childProfiles, lifeInsuranceAnswers, financialFootprintAnswers, familyTrustsAnswers
  );
  const estateTrustees = buildEstateTrustees(estateTrusteesAnswers, clientNames, planningPersons);
  const documents = buildDocuments(childProfiles, willsAnswers, clientNames);
  const fundingPhilosophy = buildFundingPhilosophy(childrenAnswers);
  const careFundingCoordination = buildCareFundingCoordination(
    allAnswers, guardianAssignments, childProfiles, estateTrustees, willsAnswers, planningPersons, fundingPhilosophy
  );
  const fundingReviewItems = buildFundingReviewItems(fundingPhilosophy, careFundingCoordination, willsAnswers);
  const readiness = buildReadiness(childProfiles, guardianAssignments, willsAnswers);
  readiness.fundingReviewItems = fundingReviewItems;
  const immediateActions = buildImmediateActions(
    childProfiles, guardianAssignments, adultSiblingRoles, willsAnswers, estateTrustees, clientNames
  );

  const profTeamAnswers = allAnswers.get('professionalTeam') || {};
  const advisors = getProfessionalAdvisors(allAnswers);
  void profTeamAnswers;

  const professionalContacts: ProfessionalContactSummary[] = advisors
    .filter(a => a.active && a.name)
    .map(a => ({
      id: a.id,
      name: a.name,
      role: a.type === 'financial' ? 'Financial Advisor'
        : a.type === 'accountant' ? 'Accountant'
        : a.type === 'lawyer' ? 'Estate Lawyer'
        : a.type === 'insurance' ? 'Insurance Advisor'
        : 'Professional Contact',
      type: a.type,
      firm: a.firm || undefined,
      phone: a.phone || undefined,
      email: a.email || undefined,
      isAppointedRole: false as const,
    }));

  const model: GuardianshipRoadmapModel = {
    family: {
      clientNames,
      children: childProfiles.map(c => ({
        id: c.childId,
        name: c.name,
        nickname: c.nickname,
        status: c.status,
      })),
      reportDate: new Date(),
      provinceOfResidence: province,
      ageOfMajority,
    },
    guardianHouseholds,
    guardianAssignments,
    children: childProfiles,
    adultSiblingRoles,
    roles,
    financialResources,
    estateTrustees,
    documents,
    readiness,
    immediateActions,
    fundingPhilosophy,
    careFundingCoordination,
    fundingReviewItems,
    guardianTrust: buildGuardianTrustInfo(childrenData),
    guardianDiscretion: buildGuardianDiscretionInfo(childrenData),
    familyFairness: buildFamilyFairnessInfo(childrenData),
    professionalContacts,
    crossReferences: financialResources
      .filter(r => r.exists)
      .map(r => ({ section: r.type, description: r.crossReference })),
  };

  model.limitations = buildGuardianshipLimitations(model, willsAnswers, advisors);
  model.reviewItems = buildAllReviewItems(model, willsAnswers, advisors);

  return model;
}
