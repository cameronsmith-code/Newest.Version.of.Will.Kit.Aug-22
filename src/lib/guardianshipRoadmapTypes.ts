export type ChildStatus = 'minor' | 'adult_dependant' | 'adult_independent';

export type MoveStatus = 'likely' | 'possible' | 'unlikely' | 'undecided';

export type PlanningPerson = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  country: string;
};

export type GuardianHousehold = {
  id: string;
  guardianPersonIds: string[];
  guardianPeople: PlanningPerson[];
  displayName: string;
  city?: string;
  province?: string;
  country?: string;
  isJoint: boolean;
};

export type GuardianAssignment = {
  id: string;
  guardianPersonIds: string[];
  guardianPeople: PlanningPerson[];
  householdId: string;
  alternatePersonIds: string[];
  alternatePeople: PlanningPerson[];
  alternateHouseholdId?: string;
  childIds: string[];
  childNames: string[];
  spokenWith: string;
  inWill: string;
  considered: string;
  notes?: string;
  isHousehold: boolean;
  householdLabel: string;
  guardianCommunity: string;
  currentCommunity: string;
  isCrossBorder: boolean;
  isCrossProvince: boolean;
  moveStatus: MoveStatus;
};

export type AdultSiblingRole = {
  adultSiblingChildId: string;
  adultSiblingName: string;
  role: string;
  notResponsibleFor: string[];
  forMinorChildIds: string[];
  forMinorChildNames: string[];
};

export type ActivityEntry = {
  name: string;
  type: string;
  importance: string;
  frequency: string;
};

export type PersonalProfile = {
  communicationStyle?: string;
  emotionalExpression?: string;
  comfortStrategies?: string;
  socialChallenges?: string;
  behaviouralConsiderations?: string;
  importantRoutines?: string;
  activities: ActivityEntry[];
  socialAdditionalNotes?: string;
  transitionEasier?: string;
  missedMost?: string;
  feelConnected?: string;
};

export type EducationSettingType =
  | 'public'
  | 'catholic'
  | 'private'
  | 'specialized_therapeutic'
  | 'homeschool'
  | 'other'
  | 'not_attending';

export type EducationSettingReason =
  | 'academic_preference'
  | 'learns_better'
  | 'disability_support'
  | 'specialized_programming'
  | 'smaller_class'
  | 'religious_cultural'
  | 'social_continuity'
  | 'family_preference'
  | 'location_practical'
  | 'other';

export type EducationImportance =
  | 'essential_support'
  | 'strong_preference'
  | 'preference_with_flexibility'
  | 'no_strong_preference'
  | 'unsure'
  | 'other';

export type EducationTransition = {
  schoolName?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  currentGrade?: string;
  hasIEP: boolean;
  iepDetails?: string;
  iepDocumentLocation?: string;
  iepImportance?: string;
  schoolChangeExpected?: string;
  newSchoolNotes?: string;
  recordLocation?: string;
  learningStyleNotes?: string;
  schoolExtraSupport?: string;
  schoolFocusHelps?: string;
  // V4.3 additions
  settingType?: EducationSettingType;
  settingTypeDetails?: string;
  settingReasons?: EducationSettingReason[];
  settingReasonsOther?: string;
  settingReasonsNotes?: string;
  educationImportance?: EducationImportance;
  educationImportanceDetails?: string;
};

export type MedicationEntry = {
  name: string;
  treats: string;
  prescribed: boolean;
  prescribedBy?: string;
  otherInfo?: string;
};

export type AllergyEntry = {
  details: string;
  severity: string;
  medications?: string;
  epipen?: string;
};

export type HealthcareProvider = {
  id: string;
  name: string;
  role: string;
  category: string;
  phone?: string;
  email?: string;
  city?: string;
  province?: string;
  resolved: boolean;
};

export type HealthcareTransition = {
  providers: HealthcareProvider[];
  selectedProviders: HealthcareProvider[];
  pharmacyName?: string;
  hasMedications: boolean;
  medications: MedicationEntry[];
  hasAllergies: boolean;
  allergies: AllergyEntry[];
  medicalConditions?: string;
  carePlanWritten?: string;
  carePlanStored?: string;
  providerSelectionsResolved: boolean;
  recordLocation?: string;
  medicationNotes?: string;
};

export type SupportProvider = {
  name: string;
  role: string;
} | undefined;

export type SupportTransitionRow = {
  supportType: string;
  supportTypeLabel: string;
  currentProvider: SupportProvider;
  purpose: string;
  transitionAction: string;
  recordLocation?: string;
  notes?: string;
};

export type ImportantConnection = {
  id: string;
  name: string;
  relationshipTypes: string[];
  contexts: string[];
  whyItMatters: string;
  importance: string;
  importanceLabel: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  continuityIdeas: string[];
  hasContactInfo: boolean;
  moveComplicates: boolean;
};

export type CommunityItem = {
  id: string;
  type: string;
  typeLabel: string;
  name: string;
  importanceNotes: string;
  continuityPreference: string;
};

export type TraditionItem = {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  participantTypes: string[];
  participantNotes: string;
  importanceNotes: string;
  continueIfPractical: string;
};

export type PersonToKeepClose = {
  id: string;
  name: string;
  relationship: string;
  sourceType: 'minor_sibling' | 'adult_sibling' | 'planning_person' | 'parent' | 'important_adults';
  phone?: string;
  email?: string;
  city?: string;
  province?: string;
  resolved: boolean;
};

export type InheritanceStage = {
  age: string;
  fraction: string;
  description: string;
};

export type ClientInheritanceInfo = {
  clientId: 'client1' | 'client2';
  clientName: string;
  inheritanceType?: string;
  stages: InheritanceStage[];
  trusteeName?: string;
  trusteePersonId?: string;
  childSpecificArrangement?: {
    hasDifferentArrangement: string;
    specialArrangement?: string;
    knownTrustType?: string;
    description?: string;
  };
};

export type AdultTransitionInfo = {
  futureIndependenceLevel?: string;
  futureFinancialHelp?: string;
  futurePersonalHealthHelp?: string;
  dtcStatus?: string;
  dtcDocLocation?: string;
  futureCaregiverName?: string;
  futureCaregiverResponsibility?: string;
  reviewNeeded: boolean;
  supportLocationDependent?: string;
  supportLocationDependentDetails?: string;
};

export type FutureEducationPath =
  | 'university'
  | 'college'
  | 'trade_apprenticeship'
  | 'professional_training'
  | 'employment_focused'
  | 'adapted_education'
  | 'whatever_suits'
  | 'too_early_unsure'
  | 'other';

export type FinancialSupportExpectation =
  | 'yes'
  | 'likely'
  | 'unsure'
  | 'no_specific_expectation'
  | 'not_applicable'
  | 'other';

export type FutureEducationInfo = {
  educationPath?: string[];
  educationPathOther?: string;
  financialSupportExpectation?: string;
  notesForGuardian?: string;
  // V4.3 additions
  aspirations?: FutureEducationPath[];
  aspirationsOther?: string;
  aspirationNotes?: string;
  supportExpectation?: FinancialSupportExpectation;
  supportExpectationDetails?: string;
};

export type GuardianshipChildProfile = {
  childId: string;
  index: number;
  name: string;
  nickname: string;
  dateOfBirth?: string;
  age?: number;
  status: ChildStatus;
  planningFocus: string;
  disabled: boolean;
  disabilityUncertain: boolean;
  supportNeedTypes: string[];
  cityOfResidence?: string;
  provinceTerritory?: string;
  countryOfResidence?: string;
  personalProfile: PersonalProfile;
  educationTransition?: EducationTransition;
  healthcareTransition?: HealthcareTransition;
  supportTransition?: SupportTransitionRow[];
  importantConnections?: ImportantConnection[];
  communities?: CommunityItem[];
  traditions?: TraditionItem[];
  peopleToKeepClose?: PersonToKeepClose[];
  adultSiblingRoles: AdultSiblingRole[];
  inheritanceByClient: ClientInheritanceInfo[];
  adultTransition?: AdultTransitionInfo;
  futureEducation?: FutureEducationInfo;
  educationFairness?: EducationFairnessInfo;
  firstDaysPriorities?: string[];
  birthCertificateLocation?: string;
};

export type RoleAssignment = {
  responsibility: string;
  childId?: string;
  childName?: string;
  firstChoice?: string;
  backup?: string;
  isHousehold?: boolean;
};

export type FinancialResourceSummary = {
  type: 'life_insurance' | 'resp' | 'rdsp' | 'trust';
  exists: boolean;
  childIds: string[];
  childNames: string[];
  name?: string;
  institution?: string;
  crossReference: string;
};

export type EstateTrusteePerson = {
  name: string;
  personId?: string;
  phone?: string;
  email?: string;
  relationship?: string;
  city?: string;
  province?: string;
  country?: string;
  isCanadaResident?: string;
};

export type EstateTrusteeInfo = {
  clientId: 'client1' | 'client2';
  clientName: string;
  hasEstateTrustee: boolean;
  primaryTrustee?: EstateTrusteePerson;
  alternateTrustees: EstateTrusteePerson[];
};

export type ProfessionalContactSummary = {
  id: string;
  name: string;
  role: string;
  type: 'financial' | 'accountant' | 'lawyer' | 'insurance';
  firm?: string;
  phone?: string;
  email?: string;
  isAppointedRole: false;
};

export type DocumentRegistryEntry = {
  type: string;
  label: string;
  exists: boolean;
  locationKnown: boolean;
  location?: string;
  clientId?: 'client1' | 'client2';
  childId?: string;
};

export type ReadinessCategory = {
  decisionsMade: string[];
  thingsWorthConfirming: string[];
  thingsStillToDo: string[];
  fundingReviewItems?: FundingReviewItem[];
};

export type ImmediateAction = {
  id: string;
  action: string;
  priority: number;
  childIds: string[];
  childNames: string[];
  conditional: boolean;
  isParentWish: boolean;
};

export type FundingOverallApproach =
  | 'majorExpensesOnly'
  | 'shareIncrementalCosts'
  | 'generousHouseholdSupport'
  | 'custom'
  | 'unsure';

export type FinancialDecisionMakerRole =
  | 'attorneyForProperty'
  | 'estateTrustee'
  | 'inheritanceTrustee';

export type CoordinationScenario =
  | 'parentalIncapacity'
  | 'afterDeath'
  | 'ongoingInheritance';

export type CareFundingCoordination = {
  scenario: CoordinationScenario;
  childIds: string[];
  caregiverPersonIds: string[];
  financialDecisionMakers: {
    role: FinancialDecisionMakerRole;
    personIds: string[];
  }[];
  samePeople: boolean;
  coordinationNeeded: boolean;
  identityConfidence?: 'high' | 'low';
};

export type ChildCareFundingPhilosophy = {
  overallApproach?: FundingOverallApproach;
  everydayExpenseApproach?: string;
  meaningfulExpenseApproach?: string;
  majorHouseholdExpenseApproach?: string;
  housingPreference?: string;
  housingStructureDiscussed?: string;
  vehiclePreference?: string;
  vehicleNotes?: string;
  workReductionPreference?: string;
  workReductionNotes?: string;
  householdHelpPreference?: string;
  importantLifestyleSupportIds?: string[];
  sharedHouseholdBenefitPhilosophy?: string;
  guardianOwnChildrenFairnessNotes?: string;
  recordKeepingPreference?: string;
  decisionMakingApproach?: string;
  guardianJudgmentWeight?: string;
  guardianJudgmentNotes?: string;
  guardianShouldUnderstand?: string[];
  financialDecisionMakerShouldUnderstand?: string[];
  discussionRequiredFor?: string[];
  hasDiscussionThreshold?: string;
  discussionThresholdAmount?: number;
  disagreementApproach?: string[];
  escalationPersonIds?: string[];
  firstEscalationPersonId?: string;
  parentMessageToGuardian?: string;
  parentMessageToFinancialDecisionMaker?: string;
  parentMessageAboutWorkingTogether?: string;
};

export type FamilyFairnessPrinciple =
  | 'preserve_important_opportunities'
  | 'prioritize_need_based'
  | 'consider_whole_household'
  | 'guardian_flexibility'
  | 'shared_household_benefit_reasonable'
  | 'childrens_resources_for_them'
  | 'discuss_significant_differences'
  | 'other';

export type EducationFairnessPrinciple =
  | 'preserve_if_need_based'
  | 'preserve_if_resources_allow'
  | 'balance_with_guardian_family'
  | 'guardian_discretion'
  | 'guardian_trustee_discussion'
  | 'other';

export type GuardianTrustInfo = {
  selectionReason?: string;
  trustMessage?: string;
  ifNeededMessage?: string;
};

export type GuardianDiscretionInfo = {
  trustedDecisions?: string;
  especiallyImportantWishes?: string;
};

export type FamilyFairnessInfo = {
  principles?: FamilyFairnessPrinciple[];
  principlesOther?: string;
  details?: string;
};

export type EducationFairnessInfo = {
  principles?: EducationFairnessPrinciple[];
  principlesOther?: string;
  details?: string;
};

export type FundingReviewItem = {
  id: string;
  category: 'housing' | 'workReduction' | 'broadSupport' | 'coordination' | 'documentation';
  description: string;
  severity: 'reviewRecommended' | 'informational';
};

export type GuardianshipLimitations = {
  incompleteItems: import('./outputConfidenceTypes').ClarifyReviewItem[];
  professionalReviewItems: import('./outputConfidenceTypes').ClarifyReviewItem[];
  conflicts: import('./outputConfidenceTypes').ClarifyReviewItem[];
  unresolvedReferences: import('./outputConfidenceTypes').ClarifyReviewItem[];
};

// V1 FROZEN — Guardianship data foundation is frozen as of this build.
// Changes to intake questions or the GuardianshipRoadmapModel require a
// material output problem: misleading output, missing essential info,
// referential-integrity problem, or unrepresentable professional-review item.
// "We could ask another useful question" is NOT sufficient reason to modify.

export type GuardianshipRoadmapModel = {
  family: {
    clientNames: string[];
    children: Array<{ id: string; name: string; nickname: string; status: ChildStatus }>;
    reportDate: Date;
    provinceOfResidence: string;
    ageOfMajority: number;
  };
  guardianHouseholds: GuardianHousehold[];
  guardianAssignments: GuardianAssignment[];
  children: GuardianshipChildProfile[];
  adultSiblingRoles: AdultSiblingRole[];
  roles: RoleAssignment[];
  financialResources: FinancialResourceSummary[];
  estateTrustees: EstateTrusteeInfo[];
  documents: DocumentRegistryEntry[];
  readiness: ReadinessCategory;
  immediateActions: ImmediateAction[];
  fundingPhilosophy?: ChildCareFundingPhilosophy;
  careFundingCoordination?: CareFundingCoordination[];
  fundingReviewItems?: FundingReviewItem[];
  guardianTrust?: GuardianTrustInfo;
  guardianDiscretion?: GuardianDiscretionInfo;
  familyFairness?: FamilyFairnessInfo;
  limitations?: GuardianshipLimitations;
  reviewItems?: import('./outputConfidenceTypes').ClarifyReviewItem[];
  crossReferences: Array<{ section: string; description: string }>;
  professionalContacts?: ProfessionalContactSummary[];
};
