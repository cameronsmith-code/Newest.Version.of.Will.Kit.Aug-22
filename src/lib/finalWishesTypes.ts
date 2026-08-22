import type { DocumentLocationRef } from './documentLocationTypes';
import type { PersonRef } from './personRepositoryTypes';

export type YesNoNotSure = 'yes' | 'no' | 'not_sure';

export type ExistingArrangementsStatus = 'yes' | 'no' | 'not_sure';

export type ArrangementType =
  | 'funeral_provider'
  | 'prepaid_plan'
  | 'cemetery_plot'
  | 'cremation_arrangements'
  | 'other'
  | 'not_sure_details';

export type PrepaidStatus = 'yes' | 'partially' | 'no' | 'not_sure';

export type DispositionPreference =
  | 'burial'
  | 'cremation'
  | 'other_arrangements'
  | 'no_preference'
  | 'not_sure';

export type GatheringPreference =
  | 'traditional_service'
  | 'celebration_of_life'
  | 'small_private_gathering'
  | 'religious_cultural_service'
  | 'no_formal_service'
  | 'no_preference'
  | 'something_else';

export type MemorialDonationPreference = 'yes' | 'no' | 'no_preference';

export type ProfileStatus = 'active' | 'inactive';

export interface ExternalContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  type: 'organization' | 'provider' | 'community';
}

export interface FinalWishesProfile {
  id: string;
  personId: string;
  personName: string;

  existingArrangementsStatus: ExistingArrangementsStatus;
  arrangementTypes: ArrangementType[];
  providerName?: string;
  providerContact?: string;
  providerPhone?: string;
  providerEmail?: string;
  prepaidStatus?: PrepaidStatus;

  documentLocationRefs: DocumentLocationRef[];

  dispositionPreference: DispositionPreference;
  dispositionNotes?: string;

  gatheringPreferences: GatheringPreference[];
  gatheringNotes?: string;

  traditionsImportant?: YesNoNotSure;
  traditionsNotes?: string;
  traditionsContactPersonRefs: PersonRef[];
  traditionsExternalContacts: ExternalContact[];

  notificationPersonRefs: PersonRef[];

  importantContactPersonRefs: PersonRef[];
  importantExternalContacts: ExternalContact[];

  hasMoreSpecificWishes?: YesNoNotSure;
  additionalWishes?: string;

  memorialDonationPreference?: MemorialDonationPreference;
  memorialOrganization?: string;
  memorialNotes?: string;

  familyGuidance?: string;
  importantToKnow?: YesNoNotSure;
  importantToKnowNotes?: string;

  hasObituaryWritten?: YesNoNotSure;
  obituaryLocationRefs: DocumentLocationRef[];
  hasPreferredPhoto?: YesNoNotSure;
  photoLocationRefs: DocumentLocationRef[];

  status: ProfileStatus;
}

export interface FinalWishesData {
  profiles: FinalWishesProfile[];
}

export const ARRANGEMENT_TYPE_LABELS: Record<ArrangementType, string> = {
  funeral_provider: 'Funeral home / provider arrangements',
  prepaid_plan: 'Prepaid funeral or cremation plan',
  cemetery_plot: 'Cemetery plot or burial rights',
  cremation_arrangements: 'Cremation arrangements',
  other: 'Other',
  not_sure_details: "I'm not sure of the details",
};

export const PREPAID_STATUS_LABELS: Record<PrepaidStatus, string> = {
  yes: 'Yes',
  partially: 'Partially',
  no: 'No',
  not_sure: "I'm not sure",
};

export const DISPOSITION_LABELS: Record<DispositionPreference, string> = {
  burial: 'Burial',
  cremation: 'Cremation',
  other_arrangements: "I've made other arrangements",
  no_preference: "I don't have a preference",
  not_sure: "I'm not sure / I haven't decided",
};

export const GATHERING_LABELS: Record<GatheringPreference, string> = {
  traditional_service: 'Traditional funeral or memorial service',
  celebration_of_life: 'Celebration of life',
  small_private_gathering: 'Small / private gathering',
  religious_cultural_service: 'Religious or cultural service',
  no_formal_service: 'No formal service',
  no_preference: "I don't have a preference",
  something_else: 'Something else',
};

export function generateProfileId(): string {
  return `fwp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateExternalContactId(): string {
  return `extc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyProfile(personId: string, personName: string): FinalWishesProfile {
  return {
    id: generateProfileId(),
    personId,
    personName,
    existingArrangementsStatus: 'no',
    arrangementTypes: [],
    documentLocationRefs: [],
    dispositionPreference: 'no_preference',
    gatheringPreferences: [],
    traditionsContactPersonRefs: [],
    traditionsExternalContacts: [],
    notificationPersonRefs: [],
    importantContactPersonRefs: [],
    importantExternalContacts: [],
    obituaryLocationRefs: [],
    photoLocationRefs: [],
    status: 'active',
  };
}

export function loadData(answers: Record<string, unknown>): FinalWishesData {
  const raw = answers['finalWishesData'] as FinalWishesData | undefined;
  if (raw && Array.isArray(raw.profiles)) return raw;
  return { profiles: [] };
}

export function migrateLegacyFuneralAnswers(
  answers: Record<string, unknown>,
  client1PersonId: string,
  client1Name: string,
  hasSpouse: boolean,
  client2PersonId: string,
  client2Name: string,
): FinalWishesData {
  const profiles: FinalWishesProfile[] = [];

  const c1Has = answers['client1HasFuneralArrangements'] as string | undefined;
  const c1Loc = answers['client1FuneralArrangementsLocation'] as string | undefined;
  const c1Written = answers['client1FuneralWrittenDown'] as string | undefined;
  const c1DocLoc = answers['client1FuneralDocLocation'] as string | undefined;

  if ((c1Has && c1Has !== 'no') || (c1Written && c1Written !== 'no')) {
    const profile = emptyProfile(client1PersonId, client1Name);
    profile.existingArrangementsStatus = (c1Has as ExistingArrangementsStatus) || 'no';
    if (c1Has === 'yes') {
      profile.arrangementTypes = ['funeral_provider'];
      if (c1Loc) {
        profile.providerName = c1Loc;
      }
    }
    if (c1Written === 'yes' && c1DocLoc) {
      const locRef: DocumentLocationRef = typeof c1DocLoc === 'string'
        ? { locationId: c1DocLoc, label: c1DocLoc }
        : c1DocLoc as DocumentLocationRef;
      profile.documentLocationRefs = [locRef];
    }
    profiles.push(profile);
  }

  if (hasSpouse) {
    const c2Has = answers['client2HasFuneralArrangements'] as string | undefined;
    const c2Loc = answers['client2FuneralArrangementsLocation'] as string | undefined;
    const c2Written = answers['client2FuneralWrittenDown'] as string | undefined;
    const c2DocLoc = answers['client2FuneralDocLocation'] as string | undefined;

    if ((c2Has && c2Has !== 'no') || (c2Written && c2Written !== 'no')) {
      const profile = emptyProfile(client2PersonId, client2Name);
      profile.existingArrangementsStatus = (c2Has as ExistingArrangementsStatus) || 'no';
      if (c2Has === 'yes') {
        profile.arrangementTypes = ['funeral_provider'];
        if (c2Loc) {
          profile.providerName = c2Loc;
        }
      }
      if (c2Written === 'yes' && c2DocLoc) {
        const locRef: DocumentLocationRef = typeof c2DocLoc === 'string'
          ? { locationId: c2DocLoc, label: c2DocLoc }
          : c2DocLoc as DocumentLocationRef;
        profile.documentLocationRefs = [locRef];
      }
      profiles.push(profile);
    }
  }

  return { profiles };
}

export interface ExecutorArrangementSummary {
  personName: string;
  hasArrangements: boolean;
  arrangementsStatus: ExistingArrangementsStatus;
  arrangementTypes: ArrangementType[];
  isPrepaid: boolean;
  prepaidStatus?: PrepaidStatus;
  providerName?: string;
  providerContact?: string;
  documentLocations: DocumentLocationRef[];
  disposition: DispositionPreference;
  dispositionNotes?: string;
  gatheringPreferences: GatheringPreference[];
  gatheringNotes?: string;
  traditionsImportant?: YesNoNotSure;
  traditionsNotes?: string;
  traditionsContacts: string[];
  notificationPeople: string[];
  importantContacts: string[];
  additionalWishes?: string;
  memorialDonationPreference?: MemorialDonationPreference;
  memorialOrganization?: string;
  memorialNotes?: string;
  familyGuidance?: string;
  importantToKnow?: YesNoNotSure;
  importantToKnowNotes?: string;
  hasObituaryWritten?: YesNoNotSure;
  obituaryLocations: DocumentLocationRef[];
}

export function buildExecutorSummary(profile: FinalWishesProfile): ExecutorArrangementSummary {
  const traditionsContacts = [
    ...profile.traditionsContactPersonRefs.map((r) => r.displayName),
    ...profile.traditionsExternalContacts.map((c) => c.name),
  ];
  const importantContacts = [
    ...profile.importantContactPersonRefs.map((r) => r.displayName),
    ...profile.importantExternalContacts.map((c) => c.name),
  ];

  return {
    personName: profile.personName,
    hasArrangements: profile.existingArrangementsStatus === 'yes',
    arrangementsStatus: profile.existingArrangementsStatus,
    arrangementTypes: profile.arrangementTypes,
    isPrepaid: profile.prepaidStatus === 'yes' || profile.prepaidStatus === 'partially',
    prepaidStatus: profile.prepaidStatus,
    providerName: profile.providerName,
    providerContact: profile.providerContact,
    documentLocations: profile.documentLocationRefs,
    disposition: profile.dispositionPreference,
    dispositionNotes: profile.dispositionNotes,
    gatheringPreferences: profile.gatheringPreferences,
    gatheringNotes: profile.gatheringNotes,
    traditionsImportant: profile.traditionsImportant,
    traditionsNotes: profile.traditionsNotes,
    traditionsContacts,
    notificationPeople: profile.notificationPersonRefs.map((r) => r.displayName),
    importantContacts,
    additionalWishes: profile.additionalWishes,
    memorialDonationPreference: profile.memorialDonationPreference,
    memorialOrganization: profile.memorialOrganization,
    memorialNotes: profile.memorialNotes,
    familyGuidance: profile.familyGuidance,
    importantToKnow: profile.importantToKnow,
    importantToKnowNotes: profile.importantToKnowNotes,
    hasObituaryWritten: profile.hasObituaryWritten,
    obituaryLocations: profile.obituaryLocationRefs,
  };
}
