import { jsPDF } from 'jspdf';

interface ChildData {
  name?: string;
  nickname?: string;
  dateOfBirth?: string;
  parentsOption?: string;
  otherParentName?: string;
  otherParentDeceased?: string;
  childSupportStatus?: string;
  childSupportDocLocation?: string;
  disabled?: string;
  independent?: string;
  attendingSchool?: string;
  schoolName?: string;
  hasIEP?: string;
  individualEducationPlan?: string;
  iepDocumentLocation?: string;
  canadianResident?: string;
  provinceTerritory?: string;
  overAgeMajority?: string;
  countryOfResidence?: string;
  cityOfResidence?: string;
  hasSpouse?: string;
  spouseName?: string;
  hasChildren?: string;
  numberOfGrandchildren?: string;
  // Legacy Guardianship fields retained for backward compatibility with saved data.
  // The legacy Guardianship PDF output has been retired; these fields are no longer
  // rendered but may exist in previously saved questionnaire data.
  // All future Guardianship output flows through buildGuardianshipRoadmap().
  disabilityTaxCredit?: string;
  disabilityTaxCreditDocLocation?: string;
  notSureSituation?: string;
  notSureRelianceAreas?: string;
  notSureFuture?: string;
  futureIndependenceLevel?: string;
  futureFinancialHelp?: string;
  futurePersonalHealthHelp?: string;
  futureCareTeamSelection?: string;
  futureCareTeamResponsibility?: string;
  carePlanWritten?: string;
  carePlanStored?: string;
  carePlanWorries?: string;
  carePlanWorriesOther?: string;
  disabilitySupports?: string;
  disabilitySupportsList?: string;
  disabilitySupportsOther?: string;
  supportLocationDependent?: string;
  futureCaregiverSupport?: string;
  futureCareTeamOtherCount?: string;
  futureCareTeamExtra?: string;
  futureCareTeamExtraCount?: string;
  futureCareTeamExtraAdditional?: string;
  medications?: string;
  medicationList?: string;
  allergies?: string;
  allergyList?: string;
  allergyMedication?: string;
  allergyMedicationDescription?: string;
  medicalIssues?: string;
  medicalIssuesDescription?: string;
  additionalEducationInfo?: string;
  additionalEducationDetails?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  schoolStrengths?: string;
  schoolExtraSupport?: string;
  schoolFocusHelps?: string;
  schoolDistractions?: string;
  schoolCalmingStrategies?: string;
  schoolActivitiesImportant?: string;
  homeworkRoutines?: string;
  educationHopes?: string;
  learningStyleNotes?: string;
  behaviouralConsiderations?: string;
  educationAdditionalDetails?: string;
  childSupportStatus?: string;
  childSupportDocLocation?: string;
  [key: string]: string | undefined;
}

interface SolePropLicense {
  nature?: string;
  documentLocation?: string;
}

interface SolePropSocialAccount {
  platform?: string;
  credentialsLocation?: string;
}

interface SolePropOnlinePersona {
  name?: string;
  credentialsLocation?: string;
}

interface SolePropAsset {
  name?: string;
  type?: string;
  recordsLocation?: string;
}

interface SolePropLiability {
  lenderName?: string;
  liabilityType?: string;
  lenderContact?: string;
  documentationLocation?: string;
}

interface SolePropData {
  registeredName?: string;
  natureOfBusiness?: string;
  hasLicenses?: string;
  licenses?: SolePropLicense[];
  bookkeeper?: string;
  bookkeeperFirm?: string;
  bookkeeperContact?: string;
  bookkeeperPhone?: string;
  bookkeeperEmail?: string;
  bookkeeperWebsite?: string;
  accountingRecordsLocation?: string;
  hasDigitalAssets?: string;
  website?: string;
  websiteCredentialsLocation?: string;
  domainProvider?: string;
  domainCredentialsLocation?: string;
  socialAccounts?: SolePropSocialAccount[];
  onlinePersonas?: SolePropOnlinePersona[];
  hasMajorAssets?: string;
  assets?: SolePropAsset[];
  hasLiabilities?: string;
  liabilities?: SolePropLiability[];
  dissolutionPlan?: string;
  dissolutionPlanDocLocation?: string;
  executorAuthority?: string;
}

interface PersonalGuaranteePdf {
  natureOfDebt?: string;
  documentationLocation?: string;
}

interface LiabilityInsurancePolicyPdf {
  description?: string;
  documentationLocation?: string;
}

interface PartnershipItem {
  registeredName?: string;
  natureOfBusiness?: string;
  partnershipType?: string;
  hasWrittenAgreement?: string;
  agreementDocLocation?: string;
  agreementHasDeathProvisions?: string;
  continuityContinues?: string;
  hasBuySellAgreement?: string;
  buySellDocLocation?: string;
  buySellFundedByInsurance?: string;
  buySellInsuranceDocLocation?: string;
  hasValuationMethod?: string;
  valuationMethodDocLocation?: string;
  hasPersonalGuarantees?: string;
  personalGuarantees?: PersonalGuaranteePdf[];
  isProfessionalPartnership?: string;
  hasLiabilityInsurance?: string;
  liabilityInsurancePolicies?: LiabilityInsurancePolicyPdf[];
}

interface FormData {
  fullName?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  hasSpouse?: string;
  spouseName?: string;
  maritalStatus?: string;
  hasMarriageContract?: string;
  marriageContractLocation?: string;
  client1HasPreviousRelationship?: string;
  client1NumberOfPreviousRelationships?: string;
  client1PreviousRelationshipsData?: Array<Record<string, string>>;
  client2HasPreviousRelationship?: string;
  client2NumberOfPreviousRelationships?: string;
  client2PreviousRelationshipsData?: Array<Record<string, string>>;
  client1IsTrustBeneficiary?: string;
  client1BeneficiaryTrustCount?: string;
  client1BeneficiaryTrustsData?: Array<Record<string, string>>;
  client1IsSpousalTrustBeneficiary?: string;
  client1SpousalTrustDocumentLocation?: string;
  client2IsTrustBeneficiary?: string;
  client2BeneficiaryTrustCount?: string;
  client2BeneficiaryTrustsData?: Array<Record<string, string>>;
  spouseSameAddress?: string;
  spouseDateOfBirth?: string;
  spouseAddress?: string;
  spouseCity?: string;
  spouseProvince?: string;
  spousePostalCode?: string;
  spouseCountry?: string;
  spouseEmail?: string;
  spousePhone?: string;
  hasChildren?: string;
  numberOfChildren?: string;
  childrenData?: ChildData[];
  hasFamilyTrust?: string;
  familyTrustsData?: Array<{
    id?: string;
    legalName?: string;
    establishmentDate?: { dateType?: string; exactDate?: string; year?: string };
    trustDeedLocation?: { accessMethod?: string; accessMethodOther?: string; location?: string; locationOther?: string };
    trustDeedMissing?: boolean;
    trustDeedNoCopy?: boolean;
    settlor?: { name?: string; relationshipToClient1?: string; relationshipToClient2?: string; status?: string };
    trustees?: Array<{ id?: string; personId?: string; personName?: string; personType?: string; isClient?: boolean }>;
    trusteeDecisionRule?: string;
    trusteeDecisionRuleOther?: string;
    trusteeContinuity?: Array<{ clientId?: string; knownSuccession?: string; successorTrusteeId?: string; successorTrusteeName?: string; successorTrusteeType?: string; successionDocLocation?: string; successionDocLocationOther?: string }>;
    beneficiaries?: Array<{ id?: string; personId?: string; personName?: string; relationship?: string; entitlement?: string }>;
    additionalBeneficiaryClasses?: string;
    additionalBeneficiaryDescription?: string;
    assetHoldings?: Array<{ id?: string; assetType?: string; corporationId?: string; corporationName?: string; shareClass?: string; ownershipPercentage?: string; votingShares?: string; propertyId?: string; propertyName?: string; description?: string }>;
    hasDebts?: string;
    debts?: Array<{ id?: string; lender?: string; loanType?: string; approximateBalance?: string; secured?: string; hasPersonalGuarantee?: string; guarantorName?: string }>;
    hasReceivables?: string;
    receivables?: Array<{ id?: string; borrower?: string; borrowerType?: string; amountOwingType?: string; approximateAmount?: string; notes?: string }>;
    accountantAdvisor?: { advisorId?: string; advisorName?: string; advisorType?: string; isExisting?: boolean } | null;
    lawyerAdvisor?: { advisorId?: string; advisorName?: string; advisorType?: string; isExisting?: boolean } | null;
    taxRecords?: { documentLocation?: { accessMethod?: string; accessMethodOther?: string; location?: string; locationOther?: string } } | null;
    twentyOneYearRule?: { confirmedByProfessional?: string; confirmedDate?: string; planningCompleted?: string; planningNotes?: string } | null;
    trustDocuments?: Array<{ id?: string; docType?: string; documentLocation?: { accessMethod?: string; accessMethodOther?: string; location?: string; locationOther?: string }; notes?: string }>;
    familyNotes?: string;
    reviewFlags?: string[];
  }>;
  // Legacy fields kept for backward compatibility with saved data
  trustLegalName?: string;
  trustDeedLocation?: string;
  trustYearEstablished?: string;
  trustBeneficiariesData?: Array<{
    beneficiaryName?: string;
    relationshipToSettlor?: string;
    countryOfResidence?: string;
    phoneNumber?: string;
    emailAddress?: string;
  }>;
  hasSoleProprietorship?: string;
  soleProprietorshipCount?: string;
  client1SolePropsData?: SolePropData[];
  hasPartnership?: string;
  partnershipCount?: string;
  client1PartnershipsData?: PartnershipItem[];
  client2HasSoleProprietorship?: string;
  client2SoleProprietorshipCount?: string;
  client2SolePropsData?: SolePropData[];
  client2HasPartnership?: string;
  client2PartnershipCount?: string;
  client2PartnershipsData?: PartnershipItem[];
  spousesPoaPersonalCare?: string;
  spouseIsPoaPersonalCare?: string;
  spousesPoaProperty?: string;
  spouseIsPoaProperty?: string;
  spousePoaPropertyHasDocAccess?: string;
  fpHasAdvisor?: string;
  fpAdvisor1Firm?: string;
  fpAdvisor1Name?: string;
  fpAdvisor1Phone?: string;
  fpAdvisor1Email?: string;
  fpAdvisor1Website?: string;
  fpAdvisor1WorksWith?: string;
  fpAdvisor1Services?: string[];
  fpAdvisor1Duration?: string;
  fpAdvisor1DocLocation?: string;
  fpAdvisor1IncludeInContactList?: string;
  fpHasAdditionalAdvisor?: string;
  fpAdvisor2WorksWith?: string;
  fpAdvisor2IsCameronSmith?: boolean;
  fpAdvisor2Firm?: string;
  fpAdvisor2Name?: string;
  fpAdvisor2Phone?: string;
  fpAdvisor2Email?: string;
  fpAdvisor2Website?: string;
  fpAdvisor2Services?: string[];
  fpAdvisor2Duration?: string;
  fpAdvisor2IncludeInContactList?: string;
  fpAdvisor2HasAdditionalAdvisor?: string;
  fpAdditionalAdvisorsData?: Array<{
    firm?: string;
    name?: string;
    phone?: string;
    email?: string;
    website?: string;
    worksWithClients?: string;
    services?: string;
    duration?: string;
    docLocation?: string;
    includeInContactList?: string;
  }>;
  fpAdditionalHasAdditional?: string[];
  acctHasAccountant?: string;
  acctAdvisor1Firm?: string;
  acctAdvisor1Name?: string;
  acctAdvisor1Phone?: string;
  acctAdvisor1Email?: string;
  acctAdvisor1WorksWith?: string;
  acctAdvisor1Services?: string[];
  acctAdvisor1Duration?: string;
  acctAdvisor1DocLocation?: string;
  acctAdvisor1IncludeInContactList?: string;
  acctHasAdditional?: string;
  acctAdditionalData?: Array<{
    firm?: string;
    name?: string;
    phone?: string;
    email?: string;
    worksWithClients?: string;
    services?: string;
    duration?: string;
    docLocation?: string;
    includeInContactList?: string;
  }>;
  acctAdditionalHasAdditional?: string[];
  lawHasLawyer?: string;
  lawAdvisor1Firm?: string;
  lawAdvisor1Name?: string;
  lawAdvisor1Phone?: string;
  lawAdvisor1Email?: string;
  lawAdvisor1WorksWith?: string;
  lawAdvisor1Services?: string[];
  lawAdvisor1Duration?: string;
  lawAdvisor1DocLocation?: string;
  lawAdvisor1IncludeInContactList?: string;
  lawHasAdditional?: string;
  lawAdditionalData?: Array<{
    firm?: string;
    name?: string;
    phone?: string;
    email?: string;
    worksWithClients?: string;
    services?: string;
    duration?: string;
    docLocation?: string;
    includeInContactList?: string;
  }>;
  lawAdditionalHasAdditional?: string[];
  insHasAdvisor?: string;
  insAdvisor1Firm?: string;
  insAdvisor1Name?: string;
  insAdvisor1Phone?: string;
  insAdvisor1Email?: string;
  insAdvisor1WorksWith?: string;
  insAdvisor1Services?: string[];
  insAdvisor1Duration?: string;
  insAdvisor1DocLocation?: string;
  insAdvisor1IncludeInContactList?: string;
  insHasAdditional?: string;
  insAdvisor2Firm?: string;
  insAdvisor2Name?: string;
  insAdvisor2Phone?: string;
  insAdvisor2Email?: string;
  insAdvisor2WorksWith?: string;
  insAdvisor2Services?: string[];
  insAdvisor2Duration?: string;
  insAdvisor2DocLocation?: string;
  insAdvisor2IncludeInContactList?: string;
  insAdditionalData?: Array<{
    firm?: string;
    name?: string;
    phone?: string;
    email?: string;
    worksWithClients?: string;
    services?: string;
    duration?: string;
    docLocation?: string;
    includeInContactList?: string;
  }>;
  insAdditionalHasAdditional?: string[];
  fp_health_0_name?: string;
  fp_health_0_patients?: string[];
  fp_health_0_clinic?: string;
  fp_health_0_city?: string;
  fp_health_0_phone?: string;
  fp_health_0_has_additional?: string;
  fp_health_1_name?: string;
  fp_health_1_patients?: string[];
  fp_health_1_clinic?: string;
  fp_health_1_city?: string;
  fp_health_1_phone?: string;
  fp_health_1_has_additional?: string;
  fp_health_2_name?: string;
  fp_health_2_patients?: string[];
  fp_health_2_clinic?: string;
  fp_health_2_city?: string;
  fp_health_2_phone?: string;
  fp_health_2_has_additional?: string;
  fp_health_3_name?: string;
  fp_health_3_patients?: string[];
  fp_health_3_clinic?: string;
  fp_health_3_city?: string;
  fp_health_3_phone?: string;
  fp_health_3_has_additional?: string;
  fp_health_4_name?: string;
  fp_health_4_patients?: string[];
  fp_health_4_clinic?: string;
  fp_health_4_city?: string;
  fp_health_4_phone?: string;
  fp_health_4_has_additional?: string;
  sp_health_has?: string;
  sp_health_0_name?: string;
  sp_health_0_patients?: string[];
  sp_health_0_specialty?: string;
  sp_health_0_phone?: string;
  sp_health_0_has_additional?: string;
  sp_health_1_name?: string;
  sp_health_1_patients?: string[];
  sp_health_1_specialty?: string;
  sp_health_1_phone?: string;
  sp_health_1_has_additional?: string;
  sp_health_2_name?: string;
  sp_health_2_patients?: string[];
  sp_health_2_specialty?: string;
  sp_health_2_phone?: string;
  sp_health_2_has_additional?: string;
  sp_health_3_name?: string;
  sp_health_3_patients?: string[];
  sp_health_3_specialty?: string;
  sp_health_3_phone?: string;
  sp_health_3_has_additional?: string;
  sp_health_4_name?: string;
  sp_health_4_patients?: string[];
  sp_health_4_specialty?: string;
  sp_health_4_phone?: string;
  sp_health_4_has_additional?: string;
  ph_health_0_name?: string;
  ph_health_0_patients?: string[];
  ph_health_0_pharmacy?: string;
  ph_health_0_phone?: string;
  ph_health_0_has_additional?: string;
  ph_health_1_name?: string;
  ph_health_1_patients?: string[];
  ph_health_1_pharmacy?: string;
  ph_health_1_phone?: string;
  ph_health_1_has_additional?: string;
  ph_health_2_name?: string;
  ph_health_2_patients?: string[];
  ph_health_2_pharmacy?: string;
  ph_health_2_phone?: string;
  ph_health_2_has_additional?: string;
  ph_health_3_name?: string;
  ph_health_3_patients?: string[];
  ph_health_3_pharmacy?: string;
  ph_health_3_phone?: string;
  ph_health_3_has_additional?: string;
  ph_health_4_name?: string;
  ph_health_4_patients?: string[];
  ph_health_4_pharmacy?: string;
  ph_health_4_phone?: string;
  ph_health_4_has_additional?: string;
  client1HasPoaPersonalCare?: string;
  client1SpouseIsPoaPersonalCare?: string;
  client1PoaPersonalCareName?: string;
  client1PoaPersonalCarePhone?: string;
  client1PoaPersonalCareEmail?: string;
  client1PoaPersonalCareRelationship?: string;
  client1PoaPersonalCareIsCanadaResident?: string;
  client1PoaPersonalCareCountry?: string;
  client1PoaPersonalCareProvince?: string;
  client1PoaPersonalCareCity?: string;
  client1PoaPersonalCareHasDocCopy?: string;
  client1HasAlternatePoaPersonalCare?: string;
  client1AlternatePoaPersonalCareCount?: string;
  client1AlternatePoaPersonalCareData?: Array<Record<string, string>>;
  client1HasContingentPoaPersonalCare?: string;
  client1PoaPersonalCareCount?: string;
  client1PoaPersonalCareDocLocation?: string;
  client1PoaPersonalCareData?: Array<{
    name?: string;
    phone?: string;
    email?: string;
    relationship?: string;
    country?: string;
    otherCountry?: string;
    province?: string;
    city?: string;
    providedCopy?: string;
    isCanadaResident?: string;
    hasDocCopy?: string;
  }>;
  client1HasPoaProperty?: string;
  client1HasContingentPoaProperty?: string;
  client1PoaPropertyCount?: string;
  client1PoaPropertyData?: Array<{
    name?: string;
    phone?: string;
    email?: string;
    relationship?: string;
    country?: string;
    otherCountry?: string;
    province?: string;
    city?: string;
  }>;
  client1HasEstateTrustee?: string;
  client1SpouseIsEstateTrustee?: string;
  client1EstateTrusteeName?: string;
  client1EstateTrusteePhone?: string;
  client1EstateTrusteeEmail?: string;
  client1EstateTrusteeRelationship?: string;
  client1EstateTrusteeIsCanadaResident?: string;
  client1EstateTrusteeCountry?: string;
  client1EstateTrusteeProvince?: string;
  client1EstateTrusteeCity?: string;
  client1EstateTrusteeHasDocCopy?: string;
  client1HasAlternateEstateTrustee?: string;
  client1HasAlternateEstateTrustee2?: string;
  client1HasAlternateEstateTrustee3?: string;
  client1EstateTrusteeCount?: string;
  client1EstateTrusteeData?: Array<{
    type?: string;
    name?: string;
    phone?: string;
    email?: string;
    relationship?: string;
    country?: string;
    otherCountry?: string;
    province?: string;
    city?: string;
    companyName?: string;
    companyAddress?: string;
    contactName?: string;
    providedCopy?: string;
  }>;
  client2HasPoaPersonalCare?: string;
  client2SpouseIsPoaPersonalCare?: string;
  client2PoaPersonalCareName?: string;
  client2PoaPersonalCarePhone?: string;
  client2PoaPersonalCareEmail?: string;
  client2PoaPersonalCareRelationship?: string;
  client2PoaPersonalCareIsCanadaResident?: string;
  client2PoaPersonalCareCountry?: string;
  client2PoaPersonalCareProvince?: string;
  client2PoaPersonalCareCity?: string;
  client2PoaPersonalCareHasDocCopy?: string;
  client2HasAlternatePoaPersonalCare?: string;
  client2AlternatePoaPersonalCareCount?: string;
  client2AlternatePoaPersonalCareData?: Array<Record<string, string>>;
  client2HasContingentPoaPersonalCare?: string;
  client2PoaPersonalCareCount?: string;
  client2PoaPersonalCareDocLocation?: string;
  client2PoaPersonalCareData?: Array<{
    name?: string;
    phone?: string;
    email?: string;
    relationship?: string;
    country?: string;
    otherCountry?: string;
    province?: string;
    city?: string;
    providedCopy?: string;
    isCanadaResident?: string;
    hasDocCopy?: string;
  }>;
  client2HasPoaProperty?: string;
  client2HasContingentPoaProperty?: string;
  client2SpouseIsPoaProperty?: string;
  client2SpousePoaPropertyHasDocAccess?: string;
  client2PoaPropertyCount?: string;
  client2PoaPropertyDocLocation?: string;
  client2PoaPropertyData?: Array<{
    name?: string;
    phone?: string;
    email?: string;
    relationship?: string;
    country?: string;
    otherCountry?: string;
    province?: string;
    city?: string;
  }>;
  client2HasEstateTrustee?: string;
  client2SpouseIsEstateTrustee?: string;
  client2EstateTrusteeName?: string;
  client2EstateTrusteePhone?: string;
  client2EstateTrusteeEmail?: string;
  client2EstateTrusteeRelationship?: string;
  client2EstateTrusteeIsCanadaResident?: string;
  client2EstateTrusteeCountry?: string;
  client2EstateTrusteeProvince?: string;
  client2EstateTrusteeCity?: string;
  client2EstateTrusteeHasDocCopy?: string;
  client2HasAlternateEstateTrustee?: string;
  client2HasAlternateEstateTrustee2?: string;
  client2HasAlternateEstateTrustee3?: string;
  client2EstateTrusteeCount?: string;
  client2EstateTrusteeData?: Array<{
    type?: string;
    name?: string;
    phone?: string;
    email?: string;
    relationship?: string;
    country?: string;
    otherCountry?: string;
    province?: string;
    city?: string;
    companyName?: string;
    companyAddress?: string;
    contactName?: string;
    providedCopy?: string;
  }>;
  client1PoaPersonalCareHasDocCopy?: string;
  client1PoaPropertyHasDocCopy?: string;
  client2PoaPersonalCareHasDocCopy?: string;
  client2PoaPropertyHasDocCopy?: string;
  client1EstateTrusteeKnowsWillLocation?: string;
  client2EstateTrusteeKnowsWillLocation?: string;
  client1HasLivingWill?: string;
  client2HasLivingWill?: string;
  client1HasHensonTrust?: string;
  bankingStructure?: string;
  jointBankCount?: string;
  jointInstitutionsData?: Array<{ name?: string }>;
  client1BankCount?: string;
  client1InstitutionsData?: Array<{ name?: string }>;
  client2BankCount?: string;
  client2InstitutionsData?: Array<{ name?: string }>;
  mixedJointBankCount?: string;
  mixedJointInstitutionsData?: Array<{ name?: string }>;
  mixedClient1BankCount?: string;
  mixedClient1InstitutionsData?: Array<{ name?: string }>;
  mixedClient2BankCount?: string;
  mixedClient2InstitutionsData?: Array<{ name?: string }>;
  propertiesData?: Array<{
    propertyName?: string;
    propertyType?: string;
    propertyOwner?: string;
    trustName?: string;
    corporationName?: string;
    otherDetails?: string;
    hasAdditionalOwners?: string;
    additionalOwnersCount?: string;
    hasSuccessionPlan?: string;
    successionPlanLocation?: string;
    rentalAgreementsLocation?: string;
    revenueExpensesLocation?: string;
    capitalExpendituresLocation?: string;
    leaseDocumentsLocation?: string;
    rentalTaxDocLocation?: string;
    canadianRentalTaxDocLocation?: string;
    foreignRentalTaxDocLocation?: string;
    hasPropertyManager?: string;
    propertyManagerName?: string;
    propertyManagerPhone?: string;
    propertyManagerEmail?: string;
    propertyManagerCompany?: string;
    hasLandlordInsurance?: string;
    landlordInsuranceLocation?: string;
    wasAlwaysRental?: string;
    inhabitedYears?: string[];
    name?: string;
    type?: string;
    purchaseYear?: string;
  }>;
  hasDebts?: string;
  debtsData?: Array<{
    debtType?: string;
    debtOwner?: string;
    hasOtherOnLoan?: string;
    otherPersonName?: string;
    otherPersonPhone?: string;
    isSecured?: string;
    securedBy?: string;
  }>;
  client1HasCreditCards?: string;
  client1CreditCardCount?: string;
  creditCardsData?: Array<{
    company?: string;
    lastFourDigits?: string;
    expiryDate?: string;
    otherParties?: string;
  }>;
  client2HasCreditCards?: string;
  client2CreditCardCount?: string;
  client2CreditCardsData?: Array<{
    company?: string;
    lastFourDigits?: string;
    expiryDate?: string;
    otherParties?: string;
  }>;
  client1HasWorkBenefits?: string;
  client2HasWorkBenefits?: string;
  client1HasLifeInsurance?: string;
  client2HasLifeInsurance?: string;
  client1LifePolicyData?: Array<Record<string, string>>;
  client2LifePolicyData?: Array<Record<string, string>>;
  client1HasDisabilityInsurance?: string;
  client1DisabilityInsuranceCount?: string;
  client2HasDisabilityInsurance?: string;
  client2DisabilityInsuranceCount?: string;
  client1HasCriticalIllness?: string;
  client1CriticalIllnessCount?: string;
  client2HasCriticalIllness?: string;
  client2CriticalIllnessCount?: string;
  client1HasCriticalIllnessInsurance?: string;
  client2HasCriticalIllnessInsurance?: string;
  client1CiPolicyData?: Array<Record<string, string>>;
  client2CiPolicyData?: Array<Record<string, string>>;
  [key: `${'client1' | 'client2'}CiPolicy${number}${string}`]: string | undefined;
  client1HasLifeInsurancePersonal?: string;
  client2HasLifeInsurancePersonal?: string;
  [key: `${'client1' | 'client2'}PersonalLifePolicy${number}${string}`]: string | undefined;
  client1HasCriticalIllnessInsurancePersonal?: string;
  client2HasCriticalIllnessInsurancePersonal?: string;
  [key: `${'client1' | 'client2'}PersonalCiPolicy${number}${string}`]: string | undefined;
  client1HasDisabilityInsurancePersonal?: string;
  client2HasDisabilityInsurancePersonal?: string;
  [key: `${'client1' | 'client2'}PersonalDiPolicy${number}${string}`]: string | undefined;
  client1HasDisabilityInsuranceEmployer?: string;
  client2HasDisabilityInsuranceEmployer?: string;
  client1DiPolicyData?: Array<Record<string, string>>;
  client2DiPolicyData?: Array<Record<string, string>>;
  [key: `${'client1' | 'client2'}DiPolicy${number}${string}`]: string | undefined;
  hasHomeInsurance?: string;
  homeInsuranceDocLocation?: string;
  hasAdditionalProperties?: string;
  additionalPropertiesCount?: string;
  additionalProperty1DocLocation?: string;
  additionalProperty2DocLocation?: string;
  additionalProperty3DocLocation?: string;
  additionalProperty4DocLocation?: string;
  additionalProperty5DocLocation?: string;
  additionalProperty6DocLocation?: string;
  additionalProperty7DocLocation?: string;
  additionalProperty8DocLocation?: string;
  additionalProperty9DocLocation?: string;
  additionalProperty10DocLocation?: string;
  client1HasVehicleInsurance?: string;
  client1VehicleDescription?: string;
  client1VehicleInsuranceDocLocation?: string;
  client2HasVehicleInsurance?: string;
  client2VehicleDescription?: string;
  client2VehicleInsuranceDocLocation?: string;
  hasAdditionalVehicles?: string;
  additionalVehiclesCount?: string;
  additionalVehicle1Description?: string;
  additionalVehicle1DocLocation?: string;
  additionalVehicle2Description?: string;
  additionalVehicle2DocLocation?: string;
  additionalVehicle3Description?: string;
  additionalVehicle3DocLocation?: string;
  additionalVehicle4Description?: string;
  additionalVehicle4DocLocation?: string;
  additionalVehicle5Description?: string;
  additionalVehicle5DocLocation?: string;
  additionalVehicle6Description?: string;
  additionalVehicle6DocLocation?: string;
  additionalVehicle7Description?: string;
  additionalVehicle7DocLocation?: string;
  additionalVehicle8Description?: string;
  additionalVehicle8DocLocation?: string;
  additionalVehicle9Description?: string;
  additionalVehicle9DocLocation?: string;
  additionalVehicle10Description?: string;
  additionalVehicle10DocLocation?: string;
  hasCorporation?: string;
  corporationCount?: string;
  ownsCorporation?: string;
  numberOfCorporations?: string;
  corporationsData?: Array<{
    legalName?: string;
    incorporatedInCanada?: string;
    jurisdiction?: string;
    corporationType?: string;
    corporationTypeOther?: string;
    owners?: string;
    articlesLocation?: string;
    minuteBookLocation?: string;
    hasOtherOwner?: string;
    otherOwners?: string;
    hasShareholderAgreement?: string;
    shareholderAgreementLocation?: string;
  }>;
  client1HasFuneralArrangements?: string;
  client1FuneralArrangementsLocation?: string;
  client1HasDiscussedFuneral?: string;
  client1FuneralWrittenDown?: string;
  client1FuneralDocLocation?: string;
  client2HasFuneralArrangements?: string;
  client2FuneralArrangementsLocation?: string;
  client2HasDiscussedFuneral?: string;
  client2FuneralWrittenDown?: string;
  client2FuneralDocLocation?: string;
  finalWishesData?: unknown;
  client1HasPension?: string;
  client1PensionsData?: Array<Record<string, string>>;
  client2HasPension?: string;
  client2PensionsData?: Array<Record<string, string>>;
  client1RegisteredAccountData?: Record<string, Array<Record<string, unknown>>>;
  client2RegisteredAccountData?: Record<string, Array<Record<string, unknown>>>;
  livingSituation?: string;
  rentLandlordName?: string;
  rentSameAddress?: string;
  rentAddress?: string;
  rentCity?: string;
  rentProvince?: string;
  rentPostalCode?: string;
  rentMonthlyAmount?: string;
  rentLeaseRenewalDate?: string;
  rentLeaseStorage?: string;
  rentAutoPayments?: string;
  rentAutoPaymentsDetails?: string;
  rentSecurityDeposit?: string;
  rentParkingStorage?: string;
  rentNotifyName?: string;
  retLandlordName?: string;
  retSameAddress?: string;
  retAddress?: string;
  retCity?: string;
  retProvince?: string;
  retPostalCode?: string;
  retMonthlyAmount?: string;
  retLeaseRenewalDate?: string;
  retLeaseStorage?: string;
  retAutoPayments?: string;
  retSecurityDeposit?: string;
  retParkingStorage?: string;
  retNotifyName?: string;
  hasRealEstate?: string;
  propertyCount?: string;
  propertyTypes?: string;
  rentKeyLocation?: string;
  retKeyLocation?: string;
  client1HasSecondaryWill?: string;
  client2HasSecondaryWill?: string;
  [key: `property${number}${string}`]: string | undefined;
}

const getOrdinalLabel = (num: number): string => {
  const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  return ordinals[num - 1] || `${num}th`;
};

export const generatePDF = (formData: FormData) => {
  console.log('PDF Generator - Full FormData:', formData);
  console.log('PDF Generator - Previous Relationships Check:', {
    client1HasPreviousRelationship: formData.client1HasPreviousRelationship,
    client1NumberOfPreviousRelationships: formData.client1NumberOfPreviousRelationships,
    client1PreviousRelationshipsData: formData.client1PreviousRelationshipsData,
    client2HasPreviousRelationship: formData.client2HasPreviousRelationship,
    client2NumberOfPreviousRelationships: formData.client2NumberOfPreviousRelationships,
    client2PreviousRelationshipsData: formData.client2PreviousRelationshipsData,
  });

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18; // Increased margin for premium feel
  const fieldWidth = pageWidth - margin * 2;
  let yPosition = margin;
  let pageNumber = 1;

  // Professional Color Palette
  const colors = {
    navyBlue: [30, 58, 95] as [number, number, number],
    mediumGray: [100, 100, 100] as [number, number, number],
    lightGray: [240, 240, 240] as [number, number, number],
    darkText: [40, 40, 40] as [number, number, number],
    black: [0, 0, 0] as [number, number, number],
    borderGray: [200, 200, 200] as [number, number, number],
    tableBorder: [180, 180, 180] as [number, number, number],
    tableHeader: [220, 230, 242] as [number, number, number],
  };

  // Transform POA Personal Care data: merge primary flat fields with alternates
  if (formData.client1HasPoaPersonalCare === 'yes' && formData.client1SpouseIsPoaPersonalCare !== 'yes') {
    const primaryPOA: Record<string, string | undefined> = {
      name: formData.client1PoaPersonalCareName,
      phone: formData.client1PoaPersonalCarePhone,
      email: formData.client1PoaPersonalCareEmail,
      relationship: formData.client1PoaPersonalCareRelationship,
      isCanadaResident: formData.client1PoaPersonalCareIsCanadaResident,
      country: formData.client1PoaPersonalCareCountry,
      province: formData.client1PoaPersonalCareProvince,
      city: formData.client1PoaPersonalCareCity,
      hasDocCopy: formData.client1PoaPersonalCareHasDocCopy,
    };

    const alternates: Array<Record<string, string | undefined>> = [];

    // Collect alternates from flat fields (up to 5)
    for (let i = 1; i <= 5; i++) {
      const nameKey = `client1AlternatePoaPersonalCare${i}Name` as keyof typeof formData;
      if (formData[nameKey]) {
        alternates.push({
          name: formData[`client1AlternatePoaPersonalCare${i}Name` as keyof typeof formData] as string,
          phone: formData[`client1AlternatePoaPersonalCare${i}Phone` as keyof typeof formData] as string,
          email: formData[`client1AlternatePoaPersonalCare${i}Email` as keyof typeof formData] as string,
          relationship: formData[`client1AlternatePoaPersonalCare${i}Relationship` as keyof typeof formData] as string,
          isCanadaResident: formData[`client1AlternatePoaPersonalCare${i}IsCanadaResident` as keyof typeof formData] as string,
          country: formData[`client1AlternatePoaPersonalCare${i}Country` as keyof typeof formData] as string,
          province: formData[`client1AlternatePoaPersonalCare${i}Province` as keyof typeof formData] as string,
          city: formData[`client1AlternatePoaPersonalCare${i}City` as keyof typeof formData] as string,
          hasDocCopy: formData[`client1AlternatePoaPersonalCare${i}HasDocCopy` as keyof typeof formData] as string,
        });
      }
    }

    const allPOAs = [primaryPOA, ...alternates];

    formData.client1PoaPersonalCareData = allPOAs;
    formData.client1PoaPersonalCareCount = allPOAs.length.toString();
    formData.client1HasContingentPoaPersonalCare = alternates.length > 0 ? 'yes' : 'no';
  }

  if (formData.client2HasPoaPersonalCare === 'yes' && formData.client2SpouseIsPoaPersonalCare !== 'yes') {
    const primaryPOA: Record<string, string | undefined> = {
      name: formData.client2PoaPersonalCareName,
      phone: formData.client2PoaPersonalCarePhone,
      email: formData.client2PoaPersonalCareEmail,
      relationship: formData.client2PoaPersonalCareRelationship,
      isCanadaResident: formData.client2PoaPersonalCareIsCanadaResident,
      country: formData.client2PoaPersonalCareCountry,
      province: formData.client2PoaPersonalCareProvince,
      city: formData.client2PoaPersonalCareCity,
      hasDocCopy: formData.client2PoaPersonalCareHasDocCopy,
    };

    const alternates: Array<Record<string, string | undefined>> = [];

    // Collect alternates from flat fields (up to 5)
    for (let i = 1; i <= 5; i++) {
      const nameKey = `client2AlternatePoaPersonalCare${i}Name` as keyof typeof formData;
      if (formData[nameKey]) {
        alternates.push({
          name: formData[`client2AlternatePoaPersonalCare${i}Name` as keyof typeof formData] as string,
          phone: formData[`client2AlternatePoaPersonalCare${i}Phone` as keyof typeof formData] as string,
          email: formData[`client2AlternatePoaPersonalCare${i}Email` as keyof typeof formData] as string,
          relationship: formData[`client2AlternatePoaPersonalCare${i}Relationship` as keyof typeof formData] as string,
          isCanadaResident: formData[`client2AlternatePoaPersonalCare${i}IsCanadaResident` as keyof typeof formData] as string,
          country: formData[`client2AlternatePoaPersonalCare${i}Country` as keyof typeof formData] as string,
          province: formData[`client2AlternatePoaPersonalCare${i}Province` as keyof typeof formData] as string,
          city: formData[`client2AlternatePoaPersonalCare${i}City` as keyof typeof formData] as string,
          hasDocCopy: formData[`client2AlternatePoaPersonalCare${i}HasDocCopy` as keyof typeof formData] as string,
        });
      }
    }

    const allPOAs = [primaryPOA, ...alternates];

    formData.client2PoaPersonalCareData = allPOAs;
    formData.client2PoaPersonalCareCount = allPOAs.length.toString();
    formData.client2HasContingentPoaPersonalCare = alternates.length > 0 ? 'yes' : 'no';
  }

  // Transform Estate Trustee data from flat questionnaire fields into array format
  const mapHasDocCopy = (val: string | undefined): string => {
    if (val === 'yes_on_file') return 'yes_copy';
    if (val === 'no_can_access') return 'yes_instructions';
    if (val === 'no_not_discussed') return 'no';
    return '';
  };

  if (formData.client1HasEstateTrustee === 'yes') {
    const trustees: Array<Record<string, string | undefined>> = [];
    if (formData.client1SpouseIsEstateTrustee === 'yes') {
      trustees.push({
        name: formData.spouseName,
        phone: formData.spousePhone,
        email: formData.spouseEmail,
        relationship: 'Spouse/Common Law Partner',
        country: 'Canada',
        province: formData.spouseProvince,
        city: formData.spouseCity,
        providedCopy: undefined,
      });
    } else if (formData.client1EstateTrusteeName) {
      trustees.push({
        name: formData.client1EstateTrusteeName,
        phone: formData.client1EstateTrusteePhone,
        email: formData.client1EstateTrusteeEmail,
        relationship: formData.client1EstateTrusteeRelationship,
        country: formData.client1EstateTrusteeIsCanadaResident === 'yes' ? 'Canada' : formData.client1EstateTrusteeCountry,
        province: formData.client1EstateTrusteeProvince,
        city: formData.client1EstateTrusteeCity,
        providedCopy: mapHasDocCopy(formData.client1EstateTrusteeHasDocCopy),
      });
    }
    for (let i = 1; i <= 3; i++) {
      const nameKey = `client1AlternateEstateTrustee${i}Name` as keyof typeof formData;
      if (formData[nameKey]) {
        trustees.push({
          name: formData[`client1AlternateEstateTrustee${i}Name` as keyof typeof formData] as string,
          phone: formData[`client1AlternateEstateTrustee${i}Phone` as keyof typeof formData] as string,
          email: formData[`client1AlternateEstateTrustee${i}Email` as keyof typeof formData] as string,
          relationship: formData[`client1AlternateEstateTrustee${i}Relationship` as keyof typeof formData] as string,
          country: (formData[`client1AlternateEstateTrustee${i}IsCanadaResident` as keyof typeof formData] as string) === 'yes'
            ? 'Canada'
            : formData[`client1AlternateEstateTrustee${i}Country` as keyof typeof formData] as string,
          province: formData[`client1AlternateEstateTrustee${i}Province` as keyof typeof formData] as string,
          city: formData[`client1AlternateEstateTrustee${i}City` as keyof typeof formData] as string,
          providedCopy: mapHasDocCopy(formData[`client1AlternateEstateTrustee${i}HasDocCopy` as keyof typeof formData] as string),
        });
      }
    }
    if (trustees.length > 0) {
      formData.client1EstateTrusteeData = trustees;
      formData.client1EstateTrusteeCount = trustees.length.toString();
    }
  }

  if (formData.client2HasEstateTrustee === 'yes') {
    const trustees: Array<Record<string, string | undefined>> = [];
    if (formData.client2SpouseIsEstateTrustee === 'yes') {
      trustees.push({
        name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        relationship: 'Spouse/Common Law Partner',
        country: 'Canada',
        province: formData.province,
        city: formData.city,
        providedCopy: undefined,
      });
    } else if (formData.client2EstateTrusteeName) {
      trustees.push({
        name: formData.client2EstateTrusteeName,
        phone: formData.client2EstateTrusteePhone,
        email: formData.client2EstateTrusteeEmail,
        relationship: formData.client2EstateTrusteeRelationship,
        country: formData.client2EstateTrusteeIsCanadaResident === 'yes' ? 'Canada' : formData.client2EstateTrusteeCountry,
        province: formData.client2EstateTrusteeProvince,
        city: formData.client2EstateTrusteeCity,
        providedCopy: mapHasDocCopy(formData.client2EstateTrusteeHasDocCopy),
      });
    }
    for (let i = 1; i <= 3; i++) {
      const nameKey = `client2AlternateEstateTrustee${i}Name` as keyof typeof formData;
      if (formData[nameKey]) {
        trustees.push({
          name: formData[`client2AlternateEstateTrustee${i}Name` as keyof typeof formData] as string,
          phone: formData[`client2AlternateEstateTrustee${i}Phone` as keyof typeof formData] as string,
          email: formData[`client2AlternateEstateTrustee${i}Email` as keyof typeof formData] as string,
          relationship: formData[`client2AlternateEstateTrustee${i}Relationship` as keyof typeof formData] as string,
          country: (formData[`client2AlternateEstateTrustee${i}IsCanadaResident` as keyof typeof formData] as string) === 'yes'
            ? 'Canada'
            : formData[`client2AlternateEstateTrustee${i}Country` as keyof typeof formData] as string,
          province: formData[`client2AlternateEstateTrustee${i}Province` as keyof typeof formData] as string,
          city: formData[`client2AlternateEstateTrustee${i}City` as keyof typeof formData] as string,
          providedCopy: mapHasDocCopy(formData[`client2AlternateEstateTrustee${i}HasDocCopy` as keyof typeof formData] as string),
        });
      }
    }
    if (trustees.length > 0) {
      formData.client2EstateTrusteeData = trustees;
      formData.client2EstateTrusteeCount = trustees.length.toString();
    }
  }

  // Add a new page, increment counter, and stamp page number top-right
  const addPage = () => {
    doc.addPage();
    pageNumber++;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.mediumGray);
    const numStr = String(pageNumber);
    doc.setFont(undefined, 'bold');
    const numWidth = doc.getTextWidth(numStr);
    doc.setFont(undefined, 'normal');
    doc.text('Page | ', pageWidth - margin - numWidth, 12, { align: 'right' });
    doc.setFont(undefined, 'bold');
    doc.text(numStr, pageWidth - margin, 12, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.setFillColor(255, 255, 255);
    doc.setTextColor(...colors.darkText);
  };

  // Helper function: Check if new page is needed
  const checkPageBreak = (spaceNeeded: number) => {
    if (yPosition + spaceNeeded > pageHeight - 20) {
      addPage();
      yPosition = 22;
      return true;
    }
    return false;
  };

  // Helper function: Draw section header
  const addSectionHeader = (title: string) => {
    checkPageBreak(20);
    yPosition += 14;

    // Background box for section header
    doc.setFillColor(...colors.lightGray);
    doc.rect(margin, yPosition - 4, fieldWidth, 10, 'F');

    // Section title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.navyBlue);
    doc.text(title, margin + 3, yPosition + 3);

    // Accent line
    doc.setDrawColor(...colors.navyBlue);
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition + 6.5, pageWidth - margin, yPosition + 6.5);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.darkText);
    doc.setFillColor(255, 255, 255);
    yPosition += 14;
  };

  // Helper function: Draw subsection header
  const addSubsectionHeader = (title: string) => {
    checkPageBreak(15);
    yPosition += 10;

    // Left accent bar
    doc.setFillColor(...colors.navyBlue);
    doc.rect(margin, yPosition - 3, 2, 8, 'F');

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.mediumGray);
    doc.text(title, margin + 5, yPosition + 3);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.darkText);
    doc.setFillColor(255, 255, 255);
    yPosition += 10;
  };

  // Introduction Page (Page 1)
  yPosition = 35;

  // Title Page Design (at top of page 1)
  // Title background box
  doc.setFillColor(...colors.lightGray);
  doc.rect(margin - 3, yPosition - 8, fieldWidth + 6, 28, 'F');

  // Main title
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.navyBlue);
  doc.text('Estate Planning Questionnaire', pageWidth / 2, yPosition, { align: 'center' });

  // Subtitle
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.mediumGray);
  doc.text('Comprehensive Estate & Financial Planning Document', pageWidth / 2, yPosition, { align: 'center' });

  // Decorative line
  yPosition += 8;
  doc.setDrawColor(...colors.navyBlue);
  doc.setLineWidth(1);
  doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);

  yPosition += 15;

  // Date generated
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.mediumGray);
  doc.text(currentDate, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;

  // Welcome title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.navyBlue);
  const welcomeLines = doc.splitTextToSize('Welcome to your Estate Planning Companion from Clarify Wealth.', fieldWidth);
  welcomeLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  });

  yPosition += 5;

  // Introduction body text
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.darkText);

  const introText = [
    'First, thank you for taking the time to prepare this document. While completing it may take some effort—and you may prefer to work through it in sections—it will ultimately save many times that effort for those who may need to rely on it in the future.',
    '',
    'Most Canadians remain underprepared when it comes to estate planning. A report on Estate Planning published in April 2022 by the National Institute on Aging (NAI), in collaboration with Royal Trust, found that only 28% of Canadians aged 35–54 have a Power of Attorney in place, and just 53% of Canadians over age 55 have one.',
    '',
    'This document is designed to make life significantly easier for your Powers of Attorney and heirs when they are called upon to look after your affairs—whether during your lifetime or after your passing.',
    '',
    'It is not intended to replace or override any appointments or instructions set out in your legal documents. Rather, it is meant to support those documents by helping the individuals responsible for carrying out your wishes do so in an organized and efficient manner.',
    '',
    'Store this document along with your Power of Attorney documents so it will be readily available for those who it will help.',
    '',
    'Congratulations on taking this important step. Your heirs and Powers of Attorney will be grateful that you did.'
  ];

  introText.forEach((paragraph) => {
    if (paragraph === '') {
      yPosition += 5;
    } else {
      const lines = doc.splitTextToSize(paragraph, fieldWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 30) {
          addPage();
          yPosition = 22;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
    }
  });

  // Start new page for questionnaire content
  addPage();
  yPosition = 35;

  // Instructions
  doc.setFontSize(9);
  doc.setTextColor(...colors.mediumGray);
  doc.text('This is a fillable PDF document - click on the fields to enter your information', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setTextColor(...colors.darkText);
  doc.setFontSize(10);

  // Helper function: Add form field
  const addField = (label: string, fieldName: string, value: string, height: number = 7) => {
    checkPageBreak(height + 8);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.mediumGray);
    doc.text(label, margin, yPosition);
    yPosition += 3;

    // Field border
    doc.setDrawColor(...colors.borderGray);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPosition, fieldWidth, height);

    const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
    field.fieldName = fieldName;
    field.Rect = [margin, yPosition, fieldWidth, height];
    field.value = value;
    field.fontSize = 10;
    field.textColor = colors.darkText;
    doc.addField(field);

    yPosition += height + 5;
    doc.setTextColor(...colors.darkText);
  };

  addSectionHeader('Contact Information');

  const basicTableCellHeight = 8;
  const basicLabelWidth = fieldWidth * 0.35;
  const basicValueWidth = fieldWidth * 0.65;

  const renderBasicChart = (title: string, rows: { label: string; value: string }[], prefix: string) => {
    const totalH = rows.length * basicTableCellHeight;
    checkPageBreak(20 + totalH);
    addSubsectionHeader(title);
    yPosition += 2;
    rows.forEach((row, rowIndex) => {
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const labelLines = doc.splitTextToSize(row.label, basicLabelWidth - 3);
      const dynH = Math.max(basicTableCellHeight, labelLines.length * 5 + 3);
      const rowY = yPosition;
      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, rowY, basicLabelWidth, dynH, 'FD');
      doc.setFillColor(...colors.tableHeader);
      doc.rect(margin + basicLabelWidth, rowY, basicValueWidth, dynH, 'FD');

      doc.setTextColor(...colors.darkText);
      doc.text(labelLines, margin + 1, rowY + 5);

      const vf = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      vf.fieldName = `${prefix}_row_${rowIndex}`;
      vf.Rect = [margin + basicLabelWidth + 0.5, rowY + 0.5, basicValueWidth - 1, dynH - 1];
      vf.fontSize = 9;
      vf.textColor = colors.darkText;
      vf.borderStyle = 'none';
      vf.value = row.value || '';
      doc.addField(vf);

      yPosition += dynH;
    });
    yPosition += 6;
  };

  const estLabelWidth = fieldWidth * 0.40;
  const estValueWidth = fieldWidth * 0.60;
  const estRowH = 8;

  const renderEstateRow = (label: string, value: string | undefined, fieldName: string) => {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    const labelLines = doc.splitTextToSize(label, estLabelWidth - 4);
    const dynH = Math.max(estRowH, labelLines.length * 5 + 3);
    checkPageBreak(dynH + 2);
    const rowY = yPosition;
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, rowY, estLabelWidth, dynH, 'FD');
    doc.setFillColor(...colors.tableHeader);
    doc.rect(margin + estLabelWidth, rowY, estValueWidth, dynH, 'FD');
    doc.setTextColor(...colors.darkText);
    doc.text(labelLines, margin + 2, rowY + 5.5);
    const f = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
    f.fieldName = fieldName;
    f.Rect = [margin + estLabelWidth + 0.5, rowY + 0.5, estValueWidth - 1, dynH - 1];
    f.fontSize = 9;
    f.textColor = colors.darkText;
    f.borderStyle = 'none';
    f.value = value;
    doc.addField(f);
    yPosition += dynH;
  };

  const acctLabelWidth = fieldWidth * 0.30;
  const acctCol2Width = fieldWidth * 0.23;
  const acctCol3Width = fieldWidth * 0.23;
  const acctCol4Width = fieldWidth * 0.24;
  const acctRowH = 8;

  const renderAccountRow = (label: string, fieldName: string, isEditable: boolean, col2Val = '', col3Val = '', col4Val = '') => {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    const labelLines = doc.splitTextToSize(label, acctLabelWidth - 4);
    const dynH = Math.max(acctRowH, labelLines.length * 5 + 3);
    checkPageBreak(dynH + 2);
    const rowY = yPosition;
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, rowY, acctLabelWidth, dynH, 'FD');
    doc.setFillColor(...colors.tableHeader);
    doc.rect(margin + acctLabelWidth, rowY, acctCol2Width, dynH, 'FD');
    doc.rect(margin + acctLabelWidth + acctCol2Width, rowY, acctCol3Width, dynH, 'FD');
    doc.rect(margin + acctLabelWidth + acctCol2Width + acctCol3Width, rowY, acctCol4Width, dynH, 'FD');
    doc.setTextColor(...colors.darkText);
    if (isEditable) {
      const lf = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      lf.fieldName = `${fieldName}_col1`;
      lf.Rect = [margin + 0.5, rowY + 0.5, acctLabelWidth - 1, dynH - 1];
      lf.fontSize = 9; lf.textColor = colors.darkText; lf.borderStyle = 'none'; lf.value = label;
      doc.addField(lf);
    } else {
      doc.text(labelLines, margin + 2, rowY + 5.5);
    }
    const f2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
    f2.fieldName = `${fieldName}_col2`;
    f2.Rect = [margin + acctLabelWidth + 0.5, rowY + 0.5, acctCol2Width - 1, dynH - 1];
    f2.fontSize = 9; f2.textColor = colors.darkText; f2.borderStyle = 'none'; f2.value = col2Val;
    doc.addField(f2);
    const f3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
    f3.fieldName = `${fieldName}_col3`;
    f3.Rect = [margin + acctLabelWidth + acctCol2Width + 0.5, rowY + 0.5, acctCol3Width - 1, dynH - 1];
    f3.fontSize = 9; f3.textColor = colors.darkText; f3.borderStyle = 'none'; f3.value = col3Val;
    doc.addField(f3);
    const f4 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
    f4.fieldName = `${fieldName}_col4`;
    f4.Rect = [margin + acctLabelWidth + acctCol2Width + acctCol3Width + 0.5, rowY + 0.5, acctCol4Width - 1, dynH - 1];
    f4.fontSize = 9; f4.textColor = colors.darkText; f4.borderStyle = 'none'; f4.value = col4Val;
    doc.addField(f4);
    yPosition += dynH;
  };

  const renderAccountTable = (prefix: string, rows: { label: string; editable?: boolean; col4?: string }[]) => {
    const headerLabels = ['Account Type', 'Institution', 'Last 4 Digits', 'Beneficiary'];
    checkPageBreak(10);
    const hRowY = yPosition;
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, hRowY, acctLabelWidth, acctRowH, 'FD');
    doc.rect(margin + acctLabelWidth, hRowY, acctCol2Width, acctRowH, 'FD');
    doc.rect(margin + acctLabelWidth + acctCol2Width, hRowY, acctCol3Width, acctRowH, 'FD');
    doc.rect(margin + acctLabelWidth + acctCol2Width + acctCol3Width, hRowY, acctCol4Width, acctRowH, 'FD');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkText);
    doc.text(headerLabels[0], margin + 2, hRowY + 5.5);
    doc.text(headerLabels[1], margin + acctLabelWidth + 2, hRowY + 5.5);
    doc.text(headerLabels[2], margin + acctLabelWidth + acctCol2Width + 2, hRowY + 5.5);
    doc.text(headerLabels[3], margin + acctLabelWidth + acctCol2Width + acctCol3Width + 2, hRowY + 5.5);
    yPosition += acctRowH;
    rows.forEach((row, i) => {
      renderAccountRow(row.label, `${prefix}_row${i}`, !!row.editable, '', '', row.col4 || '');
    });
    yPosition += 4;
  };

  const renderBankTable = (prefix: string, data?: { name?: string; branch?: string; accountType?: string; last4?: string; contact?: string; onlineBanking?: string }) => {
    renderEstateRow('Institution Name:', data?.name || '', `${prefix}_name`);
    renderEstateRow('Branch/Location:', data?.branch || '', `${prefix}_branch`);
    renderEstateRow('Account Type:', data?.accountType || '', `${prefix}_type`);
    renderEstateRow('Last 4 Digits of Account Number:', data?.last4 || '', `${prefix}_last4`);
    renderEstateRow('Primary Contact Person:', data?.contact || '', `${prefix}_contact`);
    renderEstateRow('Online Banking Access:', data?.onlineBanking || '', `${prefix}_online`);
    renderEstateRow('Other Details:', '', `${prefix}_other`);
    yPosition += 4;
  };

  const render4ColTableHeader = (headers: [string, string, string, string], cellH: number) => {
    const cw = fieldWidth / 4;
    checkPageBreak(cellH + 2);
    const rowY = yPosition;
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, rowY, cw, cellH, 'FD');
    doc.rect(margin + cw, rowY, cw, cellH, 'FD');
    doc.rect(margin + cw * 2, rowY, cw, cellH, 'FD');
    doc.rect(margin + cw * 3, rowY, cw, cellH, 'FD');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkText);
    headers.forEach((h, idx) => {
      const lines = h.split('\n');
      lines.forEach((line, li) => doc.text(line, margin + cw * idx + 2, rowY + 3.5 + li * 3.5));
    });
    yPosition += cellH;
  };

  const render4ColTableRow = (labelLines: string[], fieldNames: [string, string, string], cellH: number, isEditable = false) => {
    const cw = fieldWidth / 4;
    checkPageBreak(cellH + 2);
    const rowY = yPosition;
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, rowY, cw, cellH, 'FD');
    doc.rect(margin + cw, rowY, cw, cellH, 'FD');
    doc.rect(margin + cw * 2, rowY, cw, cellH, 'FD');
    doc.rect(margin + cw * 3, rowY, cw, cellH, 'FD');
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkText);
    if (isEditable) {
      const lf = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      lf.fieldName = `${fieldNames[0]}_label`;
      lf.Rect = [margin + 0.5, rowY + 0.5, cw - 1, cellH - 1];
      lf.fontSize = 8; lf.textColor = colors.darkText; lf.borderStyle = 'none';
      lf.value = labelLines.join(' ');
      doc.addField(lf);
    } else {
      labelLines.forEach((line, li) => doc.text(line, margin + 2, rowY + 3.5 + li * 3.5));
    }
    [fieldNames[0], fieldNames[1], fieldNames[2]].forEach((fn, idx) => {
      const f = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      f.fieldName = fn;
      f.Rect = [margin + cw * (idx + 1) + 0.5, rowY + 0.5, cw - 1, cellH - 1];
      f.fontSize = 8; f.textColor = colors.darkText; f.borderStyle = 'none';
      doc.addField(f);
    });
    yPosition += cellH;
  };

  const isCouple = formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law';
  const sameAddress = formData.spouseSameAddress === 'yes';
  const c1Name = formData.fullName || 'Client 1';
  const c2Name = formData.spouseName || 'Client 2';

  const client1Rows = [
    { label: "Client 1's Full Name:", value: c1Name },
    { label: 'Date of Birth:', value: formData.dateOfBirth || '' },
    { label: 'Email Address:', value: formData.email || '' },
    { label: 'Phone Number:', value: formData.phone || '' },
    ...(!sameAddress ? [
      { label: 'Address:', value: formData.address || '' },
      { label: 'City:', value: formData.city || '' },
      { label: 'Province:', value: formData.province || '' },
      { label: 'Postal Code:', value: formData.postalCode || '' },
    ] : []),
  ];
  renderBasicChart(`${c1Name} Contact Information:`, client1Rows, 'basic_client1');

  if (isCouple) {
    const client2Rows = [
      { label: "Client 2's Full Name:", value: c2Name },
      { label: 'Date of Birth:', value: formData.spouseDateOfBirth || '' },
      { label: 'Email Address:', value: formData.spouseEmail || '' },
      { label: 'Phone Number:', value: formData.spousePhone || '' },
      ...(!sameAddress ? [
        { label: 'Address:', value: formData.spouseAddress || '' },
        { label: 'City:', value: formData.spouseCity || '' },
        { label: 'Province:', value: formData.spouseProvince || '' },
        { label: 'Postal Code:', value: formData.spousePostalCode || '' },
      ] : []),
    ];
    renderBasicChart(`${c2Name} Contact Information:`, client2Rows, 'basic_client2');

    if (sameAddress) {
      const jointRows = [
        { label: 'Address:', value: formData.address || '' },
        { label: 'City:', value: formData.city || '' },
        { label: 'Province:', value: formData.province || '' },
        { label: 'Postal Code:', value: formData.postalCode || '' },
      ];
      renderBasicChart(`${c1Name} and ${c2Name} Address Information:`, jointRows, 'basic_joint');
    }
  }

  if (isCouple && formData.hasMarriageContract === 'yes') {
    checkPageBreak(25);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.mediumGray);
    doc.text('Marriage Contract:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...colors.darkText);
    const labelText = `(${c1Name}) and (${c2Name}), have a marriage contract, and the document is located:`;
    doc.text(labelText, margin, yPosition);
    yPosition += 6;

    doc.setDrawColor(...colors.borderGray);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPosition, fieldWidth, 6);

    const marriageContractField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
    marriageContractField.fieldName = 'marriageContractLocation';
    marriageContractField.Rect = [margin, yPosition, fieldWidth, 6];
    marriageContractField.fontSize = 9;
    marriageContractField.textColor = colors.darkText;
    marriageContractField.value = formData.marriageContractLocation || '';
    doc.addField(marriageContractField);

    yPosition += 10;
  }

  const client1Name = formData.fullName || 'Client 1';
  const client2Name = formData.spouseName || 'Client 2';

  const hasAnyPreviousRelationships =
    formData.client1HasPreviousRelationship === 'yes' ||
    formData.client2HasPreviousRelationship === 'yes';

  if (hasAnyPreviousRelationships) {
    addSectionHeader('Previous Relationships');
  }

  if (formData.client1HasPreviousRelationship === 'yes' && formData.client1PreviousRelationshipsData) {
    const prevRelCount = parseInt(formData.client1NumberOfPreviousRelationships || '0');
    const prevRelData = formData.client1PreviousRelationshipsData.slice(0, prevRelCount);

    console.log('Client 1 Previous Relationships Data:', prevRelData);

    prevRelData.forEach((relationship, index) => {
      console.log(`Client 1 Relationship ${index}:`, relationship);

      addSubsectionHeader(`${client1Name}'s Previous Relationship ${index + 1}`);

      const tableWidth = fieldWidth;
      const col1Width = tableWidth * 0.20;
      const col2Width = tableWidth * 0.16;
      const col3Width = tableWidth * 0.20;
      const col4Width = tableWidth * 0.18;
      const col5Width = tableWidth * 0.13;
      const col6Width = tableWidth * 0.13;
      const headerHeight = 12;
      const dataRowHeight = 12;

      checkPageBreak(headerHeight + dataRowHeight + 20);

      doc.setDrawColor(...colors.borderGray);
      doc.setLineWidth(0.3);
      doc.setFontSize(8);

      doc.setFillColor(...colors.lightGray);
      doc.rect(margin, yPosition, col1Width, headerHeight, 'FD');
      doc.rect(margin + col1Width, yPosition, col2Width, headerHeight, 'FD');
      doc.rect(margin + col1Width + col2Width, yPosition, col3Width, headerHeight, 'FD');
      doc.rect(margin + col1Width + col2Width + col3Width, yPosition, col4Width, headerHeight, 'FD');
      doc.rect(margin + col1Width + col2Width + col3Width + col4Width, yPosition, col5Width, headerHeight, 'FD');
      doc.rect(margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPosition, col6Width, headerHeight, 'FD');

      doc.setTextColor(...colors.darkText);
      doc.text('Partner Name:', margin + 1, yPosition + 4, { maxWidth: col1Width - 2 });
      doc.text('Spousal Support?', margin + col1Width + 1, yPosition + 4, { maxWidth: col2Width - 2 });
      doc.text('Spousal Support Termination Date:', margin + col1Width + col2Width + 1, yPosition + 4, { maxWidth: col3Width - 2 });
      doc.text('Document Location:', margin + col1Width + col2Width + col3Width + 1, yPosition + 4, { maxWidth: col4Width - 2 });
      doc.text('Date of Separation:', margin + col1Width + col2Width + col3Width + col4Width + 1, yPosition + 4, { maxWidth: col5Width - 2 });
      doc.text('Date of Divorce:', margin + col1Width + col2Width + col3Width + col4Width + col5Width + 1, yPosition + 4, { maxWidth: col6Width - 2 });

      yPosition += headerHeight;

      doc.rect(margin, yPosition, col1Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width, yPosition, col2Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width + col2Width, yPosition, col3Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width + col2Width + col3Width, yPosition, col4Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width + col2Width + col3Width + col4Width, yPosition, col5Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPosition, col6Width, dataRowHeight, 'D');

      const partnerNameField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      partnerNameField.fieldName = `client1PrevRel${index}Name`;
      partnerNameField.Rect = [margin, yPosition, col1Width, dataRowHeight];
      partnerNameField.value = relationship.name || '';
      partnerNameField.fontSize = 8;
      partnerNameField.textColor = colors.darkText;
      doc.addField(partnerNameField);

      const spousalSupportField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      spousalSupportField.fieldName = `client1PrevRel${index}SpousalSupport`;
      spousalSupportField.Rect = [margin + col1Width, yPosition, col2Width, dataRowHeight];
      spousalSupportField.value = relationship.hasSpousalSupport === 'yes' ? 'Yes' : (relationship.hasSpousalSupport === 'no' ? 'No' : '');
      spousalSupportField.fontSize = 8;
      spousalSupportField.textColor = colors.darkText;
      doc.addField(spousalSupportField);

      const terminationDateField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      terminationDateField.fieldName = `client1PrevRel${index}TerminationDate`;
      terminationDateField.Rect = [margin + col1Width + col2Width, yPosition, col3Width, dataRowHeight];
      terminationDateField.value = relationship.supportTerminationDate || '';
      terminationDateField.fontSize = 8;
      terminationDateField.textColor = colors.darkText;
      doc.addField(terminationDateField);

      const docLocationField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      docLocationField.fieldName = `client1PrevRel${index}DocLocation`;
      docLocationField.Rect = [margin + col1Width + col2Width + col3Width, yPosition, col4Width, dataRowHeight];
      docLocationField.value = relationship.supportDocumentLocation || '';
      docLocationField.fontSize = 8;
      docLocationField.textColor = colors.darkText;
      doc.addField(docLocationField);

      const dateOfSeparationField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      dateOfSeparationField.fieldName = `client1PrevRel${index}DateOfSeparation`;
      dateOfSeparationField.Rect = [margin + col1Width + col2Width + col3Width + col4Width, yPosition, col5Width, dataRowHeight];
      dateOfSeparationField.value = relationship.dateOfSeparation || '';
      dateOfSeparationField.fontSize = 8;
      dateOfSeparationField.textColor = colors.darkText;
      doc.addField(dateOfSeparationField);

      const dateOfDivorceField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      dateOfDivorceField.fieldName = `client1PrevRel${index}DateOfDivorce`;
      dateOfDivorceField.Rect = [margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPosition, col6Width, dataRowHeight];
      dateOfDivorceField.value = relationship.dateOfDivorce || '';
      dateOfDivorceField.fontSize = 8;
      dateOfDivorceField.textColor = colors.darkText;
      doc.addField(dateOfDivorceField);

      yPosition += dataRowHeight + 5;

      checkPageBreak(25);
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkText);
      doc.text('Other Information:', margin, yPosition);
      yPosition += 5;

      doc.setDrawColor(...colors.borderGray);
      doc.setLineWidth(0.3);
      const otherInfoHeight = 20;
      doc.rect(margin, yPosition, tableWidth, otherInfoHeight, 'D');

      const otherInfoField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      otherInfoField.fieldName = `client1PrevRel${index}OtherInfo`;
      otherInfoField.Rect = [margin, yPosition, tableWidth, otherInfoHeight];
      otherInfoField.value = relationship.otherInfo || '';
      otherInfoField.fontSize = 9;
      otherInfoField.textColor = colors.darkText;
      otherInfoField.multiline = true;
      doc.addField(otherInfoField);
      yPosition += otherInfoHeight + 5;
    });
  }

  if ((formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law') && formData.client2HasPreviousRelationship === 'yes' && formData.client2PreviousRelationshipsData) {
    const prevRelCount = parseInt(formData.client2NumberOfPreviousRelationships || '0');
    const prevRelData = formData.client2PreviousRelationshipsData.slice(0, prevRelCount);

    console.log('Client 2 Previous Relationships Data:', prevRelData);

    prevRelData.forEach((relationship, index) => {
      console.log(`Client 2 Relationship ${index}:`, relationship);

      addSubsectionHeader(`${client2Name}'s Previous Relationship ${index + 1}`);

      const tableWidth = fieldWidth;
      const col1Width = tableWidth * 0.20;
      const col2Width = tableWidth * 0.16;
      const col3Width = tableWidth * 0.20;
      const col4Width = tableWidth * 0.18;
      const col5Width = tableWidth * 0.13;
      const col6Width = tableWidth * 0.13;
      const headerHeight = 12;
      const dataRowHeight = 12;

      checkPageBreak(headerHeight + dataRowHeight + 20);

      doc.setDrawColor(...colors.borderGray);
      doc.setLineWidth(0.3);
      doc.setFontSize(8);

      doc.setFillColor(...colors.lightGray);
      doc.rect(margin, yPosition, col1Width, headerHeight, 'FD');
      doc.rect(margin + col1Width, yPosition, col2Width, headerHeight, 'FD');
      doc.rect(margin + col1Width + col2Width, yPosition, col3Width, headerHeight, 'FD');
      doc.rect(margin + col1Width + col2Width + col3Width, yPosition, col4Width, headerHeight, 'FD');
      doc.rect(margin + col1Width + col2Width + col3Width + col4Width, yPosition, col5Width, headerHeight, 'FD');
      doc.rect(margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPosition, col6Width, headerHeight, 'FD');

      doc.setTextColor(...colors.darkText);
      doc.text('Partner Name:', margin + 1, yPosition + 4, { maxWidth: col1Width - 2 });
      doc.text('Spousal Support?', margin + col1Width + 1, yPosition + 4, { maxWidth: col2Width - 2 });
      doc.text('Spousal Support Termination Date:', margin + col1Width + col2Width + 1, yPosition + 4, { maxWidth: col3Width - 2 });
      doc.text('Document Location:', margin + col1Width + col2Width + col3Width + 1, yPosition + 4, { maxWidth: col4Width - 2 });
      doc.text('Date of Separation:', margin + col1Width + col2Width + col3Width + col4Width + 1, yPosition + 4, { maxWidth: col5Width - 2 });
      doc.text('Date of Divorce:', margin + col1Width + col2Width + col3Width + col4Width + col5Width + 1, yPosition + 4, { maxWidth: col6Width - 2 });

      yPosition += headerHeight;

      doc.rect(margin, yPosition, col1Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width, yPosition, col2Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width + col2Width, yPosition, col3Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width + col2Width + col3Width, yPosition, col4Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width + col2Width + col3Width + col4Width, yPosition, col5Width, dataRowHeight, 'D');
      doc.rect(margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPosition, col6Width, dataRowHeight, 'D');

      const partnerNameField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      partnerNameField.fieldName = `client2PrevRel${index}Name`;
      partnerNameField.Rect = [margin, yPosition, col1Width, dataRowHeight];
      partnerNameField.value = relationship.name || '';
      partnerNameField.fontSize = 8;
      partnerNameField.textColor = colors.darkText;
      doc.addField(partnerNameField);

      const spousalSupportField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      spousalSupportField.fieldName = `client2PrevRel${index}SpousalSupport`;
      spousalSupportField.Rect = [margin + col1Width, yPosition, col2Width, dataRowHeight];
      spousalSupportField.value = relationship.hasSpousalSupport === 'yes' ? 'Yes' : (relationship.hasSpousalSupport === 'no' ? 'No' : '');
      spousalSupportField.fontSize = 8;
      spousalSupportField.textColor = colors.darkText;
      doc.addField(spousalSupportField);

      const terminationDateField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      terminationDateField.fieldName = `client2PrevRel${index}TerminationDate`;
      terminationDateField.Rect = [margin + col1Width + col2Width, yPosition, col3Width, dataRowHeight];
      terminationDateField.value = relationship.supportTerminationDate || '';
      terminationDateField.fontSize = 8;
      terminationDateField.textColor = colors.darkText;
      doc.addField(terminationDateField);

      const docLocationField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      docLocationField.fieldName = `client2PrevRel${index}DocLocation`;
      docLocationField.Rect = [margin + col1Width + col2Width + col3Width, yPosition, col4Width, dataRowHeight];
      docLocationField.value = relationship.supportDocumentLocation || '';
      docLocationField.fontSize = 8;
      docLocationField.textColor = colors.darkText;
      doc.addField(docLocationField);

      const dateOfSeparationField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      dateOfSeparationField.fieldName = `client2PrevRel${index}DateOfSeparation`;
      dateOfSeparationField.Rect = [margin + col1Width + col2Width + col3Width + col4Width, yPosition, col5Width, dataRowHeight];
      dateOfSeparationField.value = relationship.dateOfSeparation || '';
      dateOfSeparationField.fontSize = 8;
      dateOfSeparationField.textColor = colors.darkText;
      doc.addField(dateOfSeparationField);

      const dateOfDivorceField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      dateOfDivorceField.fieldName = `client2PrevRel${index}DateOfDivorce`;
      dateOfDivorceField.Rect = [margin + col1Width + col2Width + col3Width + col4Width + col5Width, yPosition, col6Width, dataRowHeight];
      dateOfDivorceField.value = relationship.dateOfDivorce || '';
      dateOfDivorceField.fontSize = 8;
      dateOfDivorceField.textColor = colors.darkText;
      doc.addField(dateOfDivorceField);

      yPosition += dataRowHeight + 5;

      checkPageBreak(25);
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkText);
      doc.text('Other Information:', margin, yPosition);
      yPosition += 5;

      doc.setDrawColor(...colors.borderGray);
      doc.setLineWidth(0.3);
      const otherInfoHeight = 20;
      doc.rect(margin, yPosition, tableWidth, otherInfoHeight, 'D');

      const otherInfoField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      otherInfoField.fieldName = `client2PrevRel${index}OtherInfo`;
      otherInfoField.Rect = [margin, yPosition, tableWidth, otherInfoHeight];
      otherInfoField.value = relationship.otherInfo || '';
      otherInfoField.fontSize = 9;
      otherInfoField.textColor = colors.darkText;
      otherInfoField.multiline = true;
      doc.addField(otherInfoField);
      yPosition += otherInfoHeight + 5;
    });
  }

  // ---------------------------------------------------------------------------
  // Legacy Guardianship PDF output retired.
  //
  // All future Guardianship output must flow through:
  //   buildGuardianshipRoadmap()
  //     -> GuardianshipRoadmapModel
  //     -> Guardianship Narrative Engine
  //     -> Guardianship Output Composer / Renderer
  //
  // The old direct questionnaire-to-PDF Guardianship route is retired.
  // The new Guardianship Roadmap renderer is in development.
  // ---------------------------------------------------------------------------

  if (formData.hasFamilyTrust === 'yes') {
    addPage();
    yPosition = 12;
    addSectionHeader('Family Trust Information');

    const trusts = formData.familyTrustsData || [];
    const hasTrust = formData.hasFamilyTrust === 'yes';

    if (hasTrust && trusts.length > 0) {
      trusts.forEach((trust, trustIdx) => {
        if (trustIdx > 0) { addPage(); yPosition = 12; }
        addSubsectionHeader(trust.legalName || `Family Trust ${trustIdx + 1}`);

        const trustInfoRows = [
          { label: 'Legal Name:', value: trust.legalName || '' },
          { label: 'Establishment Date:', value: trust.establishmentDate?.dateType === 'exact' ? trust.establishmentDate.exactDate || '' : trust.establishmentDate?.dateType === 'year' ? trust.establishmentDate.year || '' : 'Unknown' },
          { label: 'Trust Deed Location:', value: [trust.trustDeedLocation?.accessMethod, trust.trustDeedLocation?.location].filter(Boolean).join(', ') || (trust.trustDeedMissing ? 'Location unknown' : '') },
          { label: 'Settlor:', value: [trust.settlor?.name, trust.settlor?.status ? `(${trust.settlor.status})` : ''].filter(Boolean).join(' ') },
          { label: 'Trustee Decision Rule:', value: trust.trusteeDecisionRule === 'any_one' ? 'Any one trustee may act' : trust.trusteeDecisionRule === 'all_together' ? 'All trustees must act together' : trust.trusteeDecisionRule === 'majority' ? 'Majority of trustees' : trust.trusteeDecisionRule === 'other' ? trust.trusteeDecisionRuleOther || 'Other' : 'Not sure' },
        ];

        const cellHeight = 8;
        const labelWidth = fieldWidth * 0.35;
        const valueWidth = fieldWidth * 0.65;

        trustInfoRows.forEach((row, index) => {
          checkPageBreak(cellHeight + 2);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          const labelLines = doc.splitTextToSize(row.label, labelWidth - 3);
          const dynH = Math.max(cellHeight, labelLines.length * 5 + 3);
          const rowY = yPosition;

          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, rowY, labelWidth, dynH, 'FD');
          doc.rect(margin + labelWidth, rowY, valueWidth, dynH, 'FD');

          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 1, rowY + 5);
          doc.text(row.value, margin + labelWidth + 2, rowY + 5);

          yPosition += dynH;
        });

        yPosition += 6;

        if (trust.trustees && trust.trustees.length > 0) {
          checkPageBreak(20);
          addSubsectionHeader('Trustees:');
          trust.trustees.forEach((t: Record<string, unknown>) => {
            checkPageBreak(8);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...colors.darkText);
            doc.text(`• ${t.personName || ''}${t.isClient ? ' (Client)' : t.personType === 'entity' ? ' (Entity)' : ''}`, margin + 4, yPosition);
            yPosition += 6;
          });
          yPosition += 4;
        }

        if (trust.trusteeContinuity && trust.trusteeContinuity.length > 0) {
          checkPageBreak(20);
          addSubsectionHeader('Trustee Continuity:');
          trust.trusteeContinuity.forEach((c: Record<string, unknown>) => {
            checkPageBreak(8);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...colors.darkText);
            const clientLabel = c.clientId === 'client1' ? 'Client 1' : 'Client 2';
            const successionLabel = c.knownSuccession === 'successor_identified' ? `Successor: ${c.successorTrusteeName || 'TBD'}` : c.knownSuccession === 'remaining_continue' ? 'Remaining trustees continue' : c.knownSuccession === 'other_process' ? 'Another process applies' : 'Not sure';
            doc.text(`• ${clientLabel}: ${successionLabel}`, margin + 4, yPosition);
            yPosition += 6;
          });
          yPosition += 4;
        }

        if (trust.beneficiaries && trust.beneficiaries.length > 0) {
          checkPageBreak(20);
          addSubsectionHeader('Beneficiaries:');
          trust.beneficiaries.forEach((b: Record<string, unknown>) => {
            checkPageBreak(8);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...colors.darkText);
            const entLabel = b.entitlement === 'income' ? ' (Income)' : b.entitlement === 'capital' ? ' (Capital)' : b.entitlement === 'income_and_capital' ? ' (Income & Capital)' : '';
            doc.text(`• ${b.personName || ''}${b.relationship ? ` (${b.relationship})` : ''}${entLabel}`, margin + 4, yPosition);
            yPosition += 6;
          });
          yPosition += 4;
        }

        if (trust.additionalBeneficiaryClasses === 'yes' && trust.additionalBeneficiaryDescription) {
          checkPageBreak(12);
          doc.setFontSize(9);
          doc.setFont(undefined, 'italic');
          doc.setTextColor(...colors.mediumGray);
          const descLines = doc.splitTextToSize(`Additional beneficiary classes: ${trust.additionalBeneficiaryDescription}`, fieldWidth);
          doc.text(descLines, margin, yPosition);
          yPosition += descLines.length * 5 + 4;
        }

        if (trust.assetHoldings && trust.assetHoldings.length > 0) {
          checkPageBreak(20);
          addSubsectionHeader('Trust Assets:');
          trust.assetHoldings.forEach((h: Record<string, unknown>) => {
            checkPageBreak(8);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...colors.darkText);
            const desc = h.corporationName ? `Shares in ${h.corporationName}${h.shareClass ? ` (${h.shareClass})` : ''}${h.ownershipPercentage ? ` — ${h.ownershipPercentage}` : ''}` : h.propertyName ? `Real estate: ${h.propertyName}` : h.description || h.assetType;
            doc.text(`• ${desc}`, margin + 4, yPosition);
            yPosition += 6;
          });
          yPosition += 4;
        }

        if (trust.debts && trust.debts.length > 0) {
          checkPageBreak(20);
          addSubsectionHeader('Trust Debts:');
          trust.debts.forEach((d: Record<string, unknown>) => {
            checkPageBreak(8);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...colors.darkText);
            doc.text(`• ${d.lender || ''}: ${d.approximateBalance || 'Amount unknown'}${d.hasPersonalGuarantee === 'yes' ? ' (personally guaranteed)' : ''}`, margin + 4, yPosition);
            yPosition += 6;
          });
          yPosition += 4;
        }

        if (trust.receivables && trust.receivables.length > 0) {
          checkPageBreak(20);
          addSubsectionHeader('Amounts Owing to Trust:');
          trust.receivables.forEach((r: Record<string, unknown>) => {
            checkPageBreak(8);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...colors.darkText);
            doc.text(`• ${r.borrower || ''}: ${r.approximateAmount || 'Amount unknown'}`, margin + 4, yPosition);
            yPosition += 6;
          });
          yPosition += 4;
        }

        if (trust.accountantAdvisor?.advisorName || trust.lawyerAdvisor?.advisorName) {
          checkPageBreak(16);
          addSubsectionHeader('Professional Advisors:');
          if (trust.accountantAdvisor?.advisorName) {
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...colors.darkText);
            doc.text(`Accountant: ${trust.accountantAdvisor.advisorName}`, margin + 4, yPosition);
            yPosition += 6;
          }
          if (trust.lawyerAdvisor?.advisorName) {
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...colors.darkText);
            doc.text(`Lawyer: ${trust.lawyerAdvisor.advisorName}`, margin + 4, yPosition);
            yPosition += 6;
          }
          yPosition += 4;
        }

        if (trust.twentyOneYearRule) {
          checkPageBreak(24);
          addSubsectionHeader('21-Year Tax Planning:');
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...colors.darkText);
          const estAnniversary = trust.establishmentDate?.dateType === 'year' && trust.establishmentDate?.year ? String(parseInt(trust.establishmentDate.year) + 21) : 'Unknown';
          const confirmedDate = trust.twentyOneYearRule.confirmedDate;
          doc.text(`Estimated anniversary: ${estAnniversary}`, margin + 4, yPosition);
          yPosition += 6;
          if (confirmedDate) {
            doc.text(`Professionally confirmed date: ${confirmedDate}`, margin + 4, yPosition);
            yPosition += 6;
          }
          doc.text(`Professional confirmation: ${trust.twentyOneYearRule.confirmedByProfessional}`, margin + 4, yPosition);
          yPosition += 6;
          doc.text(`Planning completed: ${trust.twentyOneYearRule.planningCompleted}`, margin + 4, yPosition);
          yPosition += 8;
        }

        if (trust.reviewFlags && trust.reviewFlags.length > 0) {
          checkPageBreak(20);
          addSubsectionHeader('Review Flags:');
          doc.setFontSize(9);
          doc.setFont(undefined, 'italic');
          doc.setTextColor(...colors.mediumGray);
          trust.reviewFlags.forEach((flag: string) => {
            checkPageBreak(8);
            const flagLines = doc.splitTextToSize(`⚠ ${flag}`, fieldWidth - 4);
            doc.text(flagLines, margin + 2, yPosition);
            yPosition += flagLines.length * 5 + 2;
          });
          yPosition += 4;
        }

        if (trust.familyNotes) {
          checkPageBreak(16);
          addSubsectionHeader('Family Notes:');
          doc.setFontSize(9);
          doc.setFont(undefined, 'italic');
          doc.setTextColor(...colors.darkText);
          const noteLines = doc.splitTextToSize(trust.familyNotes, fieldWidth);
          doc.text(noteLines, margin, yPosition);
          yPosition += noteLines.length * 5 + 8;
        }
      });
    } else if (hasTrust) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkText);
      doc.text('Family Trust indicated but no trust details have been entered yet.', margin, yPosition);
      yPosition += 12;
    } else if (formData.hasFamilyTrust === 'not_sure') {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkText);
      doc.text('Client is uncertain whether a Family Trust exists. Review flag created.', margin, yPosition);
      yPosition += 12;
    } else {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkText);
      doc.text('No Family Trusts.', margin, yPosition);
      yPosition += 12;
    }

    // ── Helper to render an additional trust block ────────────────────────────
    const renderAdditionalTrust = (
      trustNum: number,
      legalName: string | undefined,
      deedLocation: string | undefined,
      yearEstablished: string | undefined,
      beneficiariesCount: string | undefined,
      beneficiariesData: Array<{ beneficiaryName?: string; relationshipToSettlor?: string; countryOfResidence?: string; phoneNumber?: string; emailAddress?: string; }> | undefined,
    ) => {
      checkPageBreak(30);
      addSubsectionHeader(legalName ? `${legalName}:` : `Family Trust ${trustNum}:`);

      const atRows = [
        { label: legalName ? `${legalName} - Legal Name:` : `Trust ${trustNum} - Legal Name:`, value: legalName || '' },
        { label: 'Trust Deed Location:', value: deedLocation || '' },
        { label: 'Year Established:', value: yearEstablished || '' },
        { label: 'Number of Beneficiaries:', value: (beneficiariesData?.length || 0).toString() },
      ];

      const atLabelW = fieldWidth * 0.35;
      const atValueW = fieldWidth * 0.65;
      const atCellH = 8;

      atRows.forEach((row, idx) => {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const labelLines = doc.splitTextToSize(row.label, atLabelW - 3);
        const dynH = Math.max(atCellH, labelLines.length * 5 + 3);
        checkPageBreak(dynH + 2);
        const rowY = yPosition;
        doc.setDrawColor(...colors.tableBorder);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, rowY, atLabelW, dynH, 'FD');
        doc.rect(margin + atLabelW, rowY, atValueW, dynH, 'FD');
        doc.setTextColor(...colors.darkText);
        doc.text(labelLines, margin + 1, rowY + 5);
        const fld = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        fld.fieldName = `trust${trustNum}_info_${idx}`;
        fld.Rect = [margin + atLabelW + 0.5, rowY + 0.5, atValueW - 1, dynH - 1];
        fld.fontSize = 9;
        fld.textColor = colors.darkText;
        fld.borderStyle = 'none';
        fld.value = row.value;
        doc.addField(fld);
        yPosition += dynH;
      });

      yPosition += 8;

      const bCount = beneficiariesData?.length || 0;
      if (bCount > 0) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...colors.darkText);
        doc.text(legalName ? `${legalName} Beneficiaries:` : 'Trust Beneficiaries:', margin, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 6;

        const bLabelW = fieldWidth * 0.35;
        const bValueW = fieldWidth * 0.65;
        const bCellH = 6;

        for (let i = 0; i < bCount; i++) {
          const bene = beneficiariesData?.[i];
          checkPageBreak(6 + 5 * bCellH + 8);
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(...colors.darkText);
          doc.text(`Beneficiary ${i + 1}:`, margin, yPosition);
          yPosition += 6;

          const beneFields = [
            { label: 'Beneficiary Name:', value: bene?.beneficiaryName || '', fn: 'name' },
            { label: 'Relationship to Settlor:', value: bene?.relationshipToSettlor || '', fn: 'relationship' },
            { label: 'Country of Residence:', value: bene?.countryOfResidence || '', fn: 'country' },
            { label: 'Phone Number:', value: bene?.phoneNumber || '', fn: 'phone' },
            { label: 'Email Address:', value: bene?.emailAddress || '', fn: 'email' },
          ];

          beneFields.forEach((bf) => {
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            const labelLines = doc.splitTextToSize(bf.label, bLabelW - 3);
            const dynH = Math.max(bCellH, labelLines.length * 5 + 3);
            const rowY = yPosition;
            doc.setDrawColor(...colors.tableBorder);
            doc.setLineWidth(0.3);
            doc.setFillColor(255, 255, 255);
            doc.rect(margin, rowY, bLabelW, dynH, 'FD');
            doc.rect(margin + bLabelW, rowY, bValueW, dynH, 'FD');
            doc.setTextColor(...colors.darkText);
            doc.text(labelLines, margin + 1, rowY + 4);
            const inputFld = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
            inputFld.fieldName = `trust${trustNum}_bene_${i + 1}_${bf.fn}`;
            inputFld.Rect = [margin + bLabelW + 0.5, rowY + 0.5, bValueW - 1, dynH - 1];
            inputFld.fontSize = 8;
            inputFld.textColor = colors.darkText;
            inputFld.borderStyle = 'none';
            inputFld.value = bf.value;
            doc.addField(inputFld);
            yPosition += dynH;
          });
          yPosition += 8;
        }
      }

      yPosition += 4;
    };

    if (formData.hasAdditionalFamilyTrust === 'yes') {
      renderAdditionalTrust(2, formData.trust2LegalName, formData.trust2DeedLocation, formData.trust2YearEstablished, undefined, formData.trust2BeneficiariesData);
    }
    if (formData.hasAdditionalFamilyTrust2 === 'yes') {
      renderAdditionalTrust(3, formData.trust3LegalName, formData.trust3DeedLocation, formData.trust3YearEstablished, undefined, formData.trust3BeneficiariesData);
    }
    if (formData.hasAdditionalFamilyTrust3 === 'yes') {
      renderAdditionalTrust(4, formData.trust4LegalName, formData.trust4DeedLocation, formData.trust4YearEstablished, undefined, formData.trust4BeneficiariesData);
    }
  }

  addPage();
  yPosition = 12;
  addSectionHeader('Sole Proprietorships and Partnerships');

  const hasSpouseForBusiness = (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law');
  const businessClient1Name = formData.fullName || 'Client 1';
  const businessClient2Name = formData.spouseName || 'Client 2';

  const renderSolePropDetails = (sp: SolePropData, idx: number, clientName: string) => {
    const pageHeight = doc.internal.pageSize.height;
    const checkPage = (needed: number) => {
      if (yPosition + needed > pageHeight - 15) {
        addPage();
        yPosition = 15;
      }
    };

    checkPage(30);
    yPosition += 6;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.darkText);
    doc.text(`${clientName} — ${sp.registeredName || `Sole Proprietorship ${idx + 1}`}`, margin, yPosition);
    yPosition += 8;

    addSubsectionHeader('Business Identification and Records');

    {
      const spIdRows: [string, string][] = [];
      if (sp.registeredName !== undefined) spIdRows.push(['Registered Name of the Business:', sp.registeredName]);
      if (sp.natureOfBusiness !== undefined) spIdRows.push(['Nature of Business:', sp.natureOfBusiness]);
      if (spIdRows.length > 0) {
        const labelColW = 70;
        const valueColW = fieldWidth - labelColW;
        const rowH = 8;
        checkPage(spIdRows.length * rowH + 2);
        spIdRows.forEach(([label, val], rowIdx) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const labelLines = doc.splitTextToSize(label, labelColW - 3);
          const dynH = Math.max(rowH, labelLines.length * 5 + 3);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, labelColW, dynH, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.rect(margin + labelColW, yPosition, valueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const fldSpIdVal = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          fldSpIdVal.fieldName = `sp_id_val_${idx}_row_${rowIdx}`;
          fldSpIdVal.Rect = [margin + labelColW + 0.5, yPosition + 0.5, valueColW - 1, dynH - 1];
          fldSpIdVal.fontSize = 9;
          fldSpIdVal.textColor = colors.darkText;
          fldSpIdVal.borderStyle = 'none';
          fldSpIdVal.value = val;
          doc.addField(fldSpIdVal);
          yPosition += dynH;
        });
        yPosition += 4;
      }
    }

    if (sp.hasLicenses === 'no') {
      checkPage(10);
      doc.setFont(undefined, 'normal');
      const noLicText = `${clientName} indicated that they do not have any professional or municipal licenses related to ${sp.registeredName || `Sole Proprietorship ${idx + 1}`}.`;
      const noLicLines = doc.splitTextToSize(noLicText, fieldWidth);
      doc.text(noLicLines, margin, yPosition);
      yPosition += noLicLines.length * 6 + 4;
    } else if (sp.hasLicenses === 'yes' && sp.licenses && sp.licenses.length > 0) {
      const licLabelColW = 70;
      const licValueColW = fieldWidth - licLabelColW;
      const licRowH = 8;

      sp.licenses.forEach((lic, li) => {
        checkPage(licRowH * 3 + 10);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text(`License ${li + 1}`, margin, yPosition);
        yPosition += 5;

        const licRows: [string, string, string][] = [
          ['Nature of License:', lic.nature || '', `sp_lic_nature_${idx}_${li}`],
          ['Location of Original Documents:', lic.documentLocation || '', `sp_lic_loc_${idx}_${li}`],
          ['Other Information:', '', `sp_lic_other_${idx}_${li}`],
        ];

        licRows.forEach(([label, value, fieldName]) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          const labelLines = doc.splitTextToSize(label, licLabelColW - 3);
          const dynH = Math.max(licRowH, labelLines.length * 5 + 3);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, licLabelColW, dynH, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.rect(margin + licLabelColW, yPosition, licValueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const licField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          licField.fieldName = fieldName;
          licField.Rect = [margin + licLabelColW + 0.5, yPosition + 0.5, licValueColW - 1, dynH - 1];
          licField.fontSize = 8;
          licField.textColor = colors.darkText;
          licField.borderStyle = 'none';
          licField.value = value;
          doc.addField(licField);
          yPosition += dynH;
        });

        doc.setFontSize(9);
        yPosition += 4;
      });
    }

    if (sp.bookkeeper === 'no' || sp.bookkeeper === 'yes') {
      const acctLabelColW = 70;
      const acctValueColW = fieldWidth - acctLabelColW;
      const acctRowH = 8;

      addSubsectionHeader('Accounting Information:');

      if (sp.bookkeeper === 'no') {
        const noAcctRows: [string, string, string][] = [
          ['Name of Accountant:', `${clientName} does their own accounting`, `sp_acct_name_${idx}`],
          ['Location of Accounting Documents:', sp.accountingRecordsLocation || '', `sp_acct_loc_${idx}`],
        ];
        checkPage(noAcctRows.length * acctRowH + 2);
        noAcctRows.forEach(([label, prefill, fieldName]) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const labelLines = doc.splitTextToSize(label, acctLabelColW - 3);
          const dynH = Math.max(acctRowH, labelLines.length * 5 + 3);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, acctLabelColW, dynH, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.rect(margin + acctLabelColW, yPosition, acctValueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const acctField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          acctField.fieldName = fieldName;
          acctField.Rect = [margin + acctLabelColW + 0.5, yPosition + 0.5, acctValueColW - 1, dynH - 1];
          acctField.fontSize = 8;
          acctField.textColor = colors.darkText;
          acctField.borderStyle = 'none';
          acctField.value = prefill;
          doc.addField(acctField);
          yPosition += dynH;
        });
      } else {
        const yesAcctRows: [string, string, string][] = [
          ['Name of Accounting Firm/Book Keeper:', sp.bookkeeperFirm || '', `sp_acct_firm_${idx}`],
          ['Key Contact:', sp.bookkeeperContact || '', `sp_acct_contact_${idx}`],
          ['Phone Number:', sp.bookkeeperPhone || '', `sp_acct_phone_${idx}`],
          ['Email Address:', sp.bookkeeperEmail || '', `sp_acct_email_${idx}`],
          ['Website:', sp.bookkeeperWebsite || '', `sp_acct_website_${idx}`],
          ['Location of Accounting Records:', sp.accountingRecordsLocation || '', `sp_acct_loc_${idx}`],
        ];
        checkPage(yesAcctRows.length * acctRowH + 2);
        yesAcctRows.forEach(([label, prefill, fieldName]) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const labelLines = doc.splitTextToSize(label, acctLabelColW - 3);
          const dynH = Math.max(acctRowH, labelLines.length * 5 + 3);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, acctLabelColW, dynH, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.rect(margin + acctLabelColW, yPosition, acctValueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const acctField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          acctField.fieldName = fieldName;
          acctField.Rect = [margin + acctLabelColW + 0.5, yPosition + 0.5, acctValueColW - 1, dynH - 1];
          acctField.fontSize = 8;
          acctField.textColor = colors.darkText;
          acctField.borderStyle = 'none';
          acctField.value = prefill;
          doc.addField(acctField);
          yPosition += dynH;
        });
      }
      yPosition += 4;
    }

    if (sp.hasDigitalAssets === 'yes') {
      const daLabelColW = 70;
      const daValueColW = fieldWidth - daLabelColW;
      const daRowH = 8;

      addSubsectionHeader('Digital Assets:');

      const daMainRows: [string, string, string][] = [];
      if (sp.website !== undefined) daMainRows.push(['Website:', sp.website || '', `sp_website_${idx}`]);
      if (sp.websiteCredentialsLocation !== undefined) daMainRows.push(['Website Credentials Location:', sp.websiteCredentialsLocation || '', `sp_website_creds_${idx}`]);
      if (sp.domainProvider !== undefined) daMainRows.push(['Domain Provider:', sp.domainProvider || '', `sp_domain_${idx}`]);
      if (sp.domainCredentialsLocation !== undefined) daMainRows.push(['Domain Credentials Location:', sp.domainCredentialsLocation || '', `sp_domain_creds_${idx}`]);

      if (daMainRows.length > 0) {
        checkPage(daMainRows.length * daRowH + 2);
        daMainRows.forEach(([label, prefill, fieldName]) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const labelLines = doc.splitTextToSize(label, daLabelColW - 3);
          const dynH = Math.max(daRowH, labelLines.length * 5 + 3);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, daLabelColW, dynH, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.rect(margin + daLabelColW, yPosition, daValueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const daField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          daField.fieldName = fieldName;
          daField.Rect = [margin + daLabelColW + 0.5, yPosition + 0.5, daValueColW - 1, dynH - 1];
          daField.fontSize = 8;
          daField.textColor = colors.darkText;
          daField.borderStyle = 'none';
          daField.value = prefill;
          doc.addField(daField);
          yPosition += dynH;
        });
        yPosition += 4;
      }

      if (sp.socialAccounts && sp.socialAccounts.length > 0) {
        addSubsectionHeader('Social Media Accounts:');

        sp.socialAccounts.forEach((sa, si) => {
          const saRows: [string, string, string][] = [];
          if (sa.platform !== undefined) saRows.push([`Account ${si + 1}:`, sa.platform || '', `sp_social_platform_${idx}_${si}`]);
          if (sa.credentialsLocation !== undefined) saRows.push(['Credentials Location:', sa.credentialsLocation || '', `sp_social_creds_${idx}_${si}`]);
          if (saRows.length > 0) {
            checkPage(saRows.length * daRowH + 2);
            saRows.forEach(([label, prefill, fieldName]) => {
              doc.setFont(undefined, 'normal');
              doc.setFontSize(9);
              const labelLines = doc.splitTextToSize(label, daLabelColW - 3);
              const dynH = Math.max(daRowH, labelLines.length * 5 + 3);
              doc.setDrawColor(...colors.tableBorder);
              doc.setLineWidth(0.3);
              doc.setFillColor(255, 255, 255);
              doc.rect(margin, yPosition, daLabelColW, dynH, 'FD');
              doc.setFillColor(255, 255, 255);
              doc.rect(margin + daLabelColW, yPosition, daValueColW, dynH, 'FD');
              doc.setTextColor(...colors.darkText);
              doc.text(labelLines, margin + 2, yPosition + 5.5);
              const saField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
              saField.fieldName = fieldName;
              saField.Rect = [margin + daLabelColW + 0.5, yPosition + 0.5, daValueColW - 1, dynH - 1];
              saField.fontSize = 8;
              saField.textColor = colors.darkText;
              saField.borderStyle = 'none';
              saField.value = prefill;
              doc.addField(saField);
              yPosition += dynH;
            });
            yPosition += 2;
          }
        });
        yPosition += 2;
      }

      if (sp.onlinePersonas && sp.onlinePersonas.length > 0) {
        addSubsectionHeader('Online Personas:');

        sp.onlinePersonas.forEach((op, oi) => {
          const opRows: [string, string, string][] = [];
          if (op.name !== undefined) opRows.push([`Persona ${oi + 1}:`, op.name || '', `sp_persona_name_${idx}_${oi}`]);
          if (op.credentialsLocation !== undefined) opRows.push(['Credentials Location:', op.credentialsLocation || '', `sp_persona_creds_${idx}_${oi}`]);
          if (opRows.length > 0) {
            checkPage(opRows.length * daRowH + 2);
            opRows.forEach(([label, prefill, fieldName]) => {
              doc.setFont(undefined, 'normal');
              doc.setFontSize(9);
              const labelLines = doc.splitTextToSize(label, daLabelColW - 3);
              const dynH = Math.max(daRowH, labelLines.length * 5 + 3);
              doc.setDrawColor(...colors.tableBorder);
              doc.setLineWidth(0.3);
              doc.setFillColor(255, 255, 255);
              doc.rect(margin, yPosition, daLabelColW, dynH, 'FD');
              doc.setFillColor(255, 255, 255);
              doc.rect(margin + daLabelColW, yPosition, daValueColW, dynH, 'FD');
              doc.setTextColor(...colors.darkText);
              doc.text(labelLines, margin + 2, yPosition + 5.5);
              const opField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
              opField.fieldName = fieldName;
              opField.Rect = [margin + daLabelColW + 0.5, yPosition + 0.5, daValueColW - 1, dynH - 1];
              opField.fontSize = 8;
              opField.textColor = colors.darkText;
              opField.borderStyle = 'none';
              opField.value = prefill;
              doc.addField(opField);
              yPosition += dynH;
            });
            yPosition += 2;
          }
        });
        yPosition += 2;
      }
    }

    addSubsectionHeader('Asset and Liability Inventory');

    if (sp.hasMajorAssets === 'no') {
      checkPage(7);
      doc.setFont(undefined, 'normal');
      doc.text('No major assets.', margin, yPosition);
      yPosition += 7;
    } else if (sp.hasMajorAssets === 'yes' && sp.assets && sp.assets.length > 0) {
      checkPage(8);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bolditalic');
      doc.setTextColor(...colors.darkText);
      const majorAssetsHeading = 'Major Assets:';
      doc.text(majorAssetsHeading, margin, yPosition);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition + 1, margin + doc.getTextWidth(majorAssetsHeading), yPosition + 1);
      yPosition += 6;
      const assetLabelColW = 70;
      const assetValueColW = fieldWidth - assetLabelColW;
      const assetRowH = 8;
      sp.assets.forEach((asset, ai) => {
        checkPage(14);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text(`${asset.name || `Asset ${ai + 1}`}:`, margin, yPosition);
        yPosition += 5;
        const assetFields: [string, string, string][] = [
          ['Asset Name:', asset.name || '', `sp_asset_name_${idx}_${ai}`],
          ['Asset Type:', asset.type || '', `sp_asset_type_${idx}_${ai}`],
          ['Location of Records:', asset.recordsLocation || '', `sp_asset_loc_${idx}_${ai}`],
        ];
        assetFields.forEach(([label, val, fieldName]) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const labelLines = doc.splitTextToSize(label, assetLabelColW - 3);
          const dynH = Math.max(assetRowH, labelLines.length * 5 + 3);
          checkPage(dynH + 2);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, assetLabelColW, dynH, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.rect(margin + assetLabelColW, yPosition, assetValueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const fldAssetVal = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          fldAssetVal.fieldName = fieldName;
          fldAssetVal.Rect = [margin + assetLabelColW + 0.5, yPosition + 0.5, assetValueColW - 1, dynH - 1];
          fldAssetVal.fontSize = 9;
          fldAssetVal.textColor = colors.darkText;
          fldAssetVal.borderStyle = 'none';
          fldAssetVal.value = val;
          doc.addField(fldAssetVal);
          yPosition += dynH;
        });
        yPosition += 4;
      });
    }

    if (sp.hasLiabilities === 'no') {
      checkPage(7);
      doc.setFont(undefined, 'normal');
      doc.text('No outstanding liabilities or debts.', margin, yPosition);
      yPosition += 7;
    } else if (sp.hasLiabilities === 'yes' && sp.liabilities && sp.liabilities.length > 0) {
      checkPage(8);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bolditalic');
      doc.setTextColor(...colors.darkText);
      const liabHeading = 'Outstanding Liabilities / Debts:';
      doc.text(liabHeading, margin, yPosition);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition + 1, margin + doc.getTextWidth(liabHeading), yPosition + 1);
      yPosition += 6;
      const liabLabelColW = 70;
      const liabValueColW = fieldWidth - liabLabelColW;
      const liabRowH = 8;
      sp.liabilities.forEach((liability, li) => {
        checkPage(18);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        const liabLabel = [liability.lenderName, liability.liabilityType].filter(Boolean).join(' - ');
        doc.text(liabLabel ? `${liabLabel}:` : `Liability ${li + 1}:`, margin, yPosition);
        yPosition += 5;
        const liabilityFields: [string, string, string][] = [
          ['Lender Name:', liability.lenderName || '', `sp_liab_lender_${idx}_${li}`],
          ['Liability Type:', liability.liabilityType || '', `sp_liab_type_${idx}_${li}`],
          ['Lender Contact:', liability.lenderContact || '', `sp_liab_contact_${idx}_${li}`],
          ['Location of Documentation:', liability.documentationLocation || '', `sp_liab_loc_${idx}_${li}`],
        ];
        liabilityFields.forEach(([label, val, fieldName]) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const labelLines = doc.splitTextToSize(label, liabLabelColW - 3);
          const dynH = Math.max(liabRowH, labelLines.length * 5 + 3);
          checkPage(dynH + 2);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, liabLabelColW, dynH, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.rect(margin + liabLabelColW, yPosition, liabValueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const fldLiabVal = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          fldLiabVal.fieldName = fieldName;
          fldLiabVal.Rect = [margin + liabLabelColW + 0.5, yPosition + 0.5, liabValueColW - 1, dynH - 1];
          fldLiabVal.fontSize = 9;
          fldLiabVal.textColor = colors.darkText;
          fldLiabVal.borderStyle = 'none';
          fldLiabVal.value = val;
          doc.addField(fldLiabVal);
          yPosition += dynH;
        });
        yPosition += 4;
      });
    }

    addSubsectionHeader('Business Continuity and Succession');

    const businessName = sp.registeredName || `Business ${idx + 1}`;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    const dissolutionQuestion = 'Since a sole proprietorship dissolves on death, do you have a plan for the orderly disposal of business assets and liabilities?';
    const dissolutionLines = doc.splitTextToSize(dissolutionQuestion, pageWidth - margin * 2);
    checkPage(dissolutionLines.length * 5 + 10);
    doc.text(dissolutionLines, margin, yPosition);
    yPosition += dissolutionLines.length * 5 + 2;

    doc.setFont(undefined, 'normal');
    if (sp.dissolutionPlan === 'yes') {
      doc.text('Yes', margin + 4, yPosition);
      yPosition += 6;
      if (sp.dissolutionPlanDocLocation) {
        checkPage(7);
        doc.setFont(undefined, 'bold');
        doc.text('Location of Documentation:', margin + 4, yPosition);
        doc.setFont(undefined, 'normal');
        const fldDissolutionLoc1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        fldDissolutionLoc1.fieldName = `sp_dissolution_loc_${idx}`;
        fldDissolutionLoc1.Rect = [margin + 4 + doc.getTextWidth('Location of Documentation:') + 1, yPosition - 5.5, pageWidth - (margin + 4 + doc.getTextWidth('Location of Documentation:') + 1) - margin, 7];
        fldDissolutionLoc1.fontSize = 9;
        fldDissolutionLoc1.textColor = colors.darkText;
        fldDissolutionLoc1.borderStyle = 'none';
        fldDissolutionLoc1.value = sp.dissolutionPlanDocLocation || '';
        doc.addField(fldDissolutionLoc1);
        yPosition += 6;
      }
    } else if (sp.dissolutionPlan === 'beneficiary') {
      const beneficiaryLines = doc.splitTextToSize('I intend for a beneficiary to carry on the business', pageWidth - margin * 2 - 4);
      checkPage(beneficiaryLines.length * 5 + 10);
      doc.text(beneficiaryLines, margin + 4, yPosition);
      yPosition += beneficiaryLines.length * 5 + 2;
      if (sp.dissolutionPlanDocLocation) {
        checkPage(7);
        doc.setFont(undefined, 'bold');
        doc.text('Location of Documentation:', margin + 4, yPosition);
        doc.setFont(undefined, 'normal');
        const fldDissolutionLoc2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        fldDissolutionLoc2.fieldName = `sp_dissolution_loc_${idx}`;
        fldDissolutionLoc2.Rect = [margin + 4 + doc.getTextWidth('Location of Documentation:') + 1, yPosition - 5.5, pageWidth - (margin + 4 + doc.getTextWidth('Location of Documentation:') + 1) - margin, 7];
        fldDissolutionLoc2.fontSize = 9;
        fldDissolutionLoc2.textColor = colors.darkText;
        fldDissolutionLoc2.borderStyle = 'none';
        fldDissolutionLoc2.value = sp.dissolutionPlanDocLocation || '';
        doc.addField(fldDissolutionLoc2);
        yPosition += 6;
      }
    } else if (sp.dissolutionPlan === 'no' || !sp.dissolutionPlan) {
      doc.text('No', margin + 4, yPosition);
      yPosition += 6;
      checkPage(12);
      doc.setFillColor(255, 255, 200);
      const todoText = `TO DO: Develop a plan for the disposal of ${businessName}'s assets and liabilities.`;
      const todoLines = doc.splitTextToSize(todoText, pageWidth - margin * 2 - 12);
      const todoBoxHeight = todoLines.length * 5 + 6;
      doc.rect(margin, yPosition, pageWidth - margin * 2, todoBoxHeight, 'F');
      doc.setDrawColor(180, 140, 0);
      doc.rect(margin, yPosition, pageWidth - margin * 2, todoBoxHeight, 'S');
      doc.setTextColor(80, 60, 0);
      doc.setFont(undefined, 'bold');
      doc.text(todoLines, margin + 4, yPosition + 5);
      doc.setTextColor(...colors.darkText);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200, 200, 200);
      yPosition += todoBoxHeight + 4;
    }

    checkPage(10);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('EXECUTOR INSTRUCTIONS AND AUTHORITY', margin, yPosition);
    yPosition += 7;
    doc.setFontSize(9);

    const executorQuestion = "Does your will authorize your executor to own, manage, and operate business assets until they can be sold or distributed? (without this authority, succession legislation may force an estate trustee to liquidate risky business shares at 'fire-sale' prices)";
    const executorQuestionLines = doc.splitTextToSize(executorQuestion, pageWidth - margin * 2);
    checkPage(executorQuestionLines.length * 5 + 10);
    doc.text(executorQuestionLines, margin, yPosition);
    yPosition += executorQuestionLines.length * 5 + 2;

    doc.setFont(undefined, 'normal');
    const executorAuthorityLabels: Record<string, string> = {
      yes: 'Yes',
      no: 'No',
      unsure: "I'm not sure",
      not_applicable: "The business doesn't have any assets of significant value to worry about",
    };
    if (sp.executorAuthority && executorAuthorityLabels[sp.executorAuthority]) {
      const authorityText = executorAuthorityLabels[sp.executorAuthority];
      const authorityLines = doc.splitTextToSize(authorityText, pageWidth - margin * 2 - 4);
      checkPage(authorityLines.length * 5 + 6);
      doc.text(authorityLines, margin + 4, yPosition);
      yPosition += authorityLines.length * 5 + 4;
    }

    doc.setFontSize(10);

    // Document Summary Table
    type DocRow = { document: string; description: string; location: string };
    const docRows: DocRow[] = [];

    if (sp.hasLicenses === 'yes' && sp.licenses && sp.licenses.length > 0) {
      sp.licenses.forEach((lic, li) => {
        docRows.push({
          document: `License ${li + 1}`,
          description: lic.nature || '—',
          location: lic.documentLocation || '—',
        });
      });
    }

    if (sp.accountingRecordsLocation) {
      docRows.push({
        document: 'Accounting Records',
        description: sp.bookkeeperFirm ? `Maintained by ${sp.bookkeeperFirm}` : 'Business accounting records',
        location: sp.accountingRecordsLocation,
      });
    }

    if (sp.hasDigitalAssets === 'yes') {
      if (sp.websiteCredentialsLocation) {
        docRows.push({
          document: 'Website Credentials',
          description: sp.website ? `Login credentials for ${sp.website}` : 'Business website credentials',
          location: sp.websiteCredentialsLocation,
        });
      }
      if (sp.domainCredentialsLocation) {
        docRows.push({
          document: 'Domain Credentials',
          description: sp.domainProvider ? `Domain registrar credentials (${sp.domainProvider})` : 'Domain registrar credentials',
          location: sp.domainCredentialsLocation,
        });
      }
      if (sp.socialAccounts && sp.socialAccounts.length > 0) {
        sp.socialAccounts.forEach((sa) => {
          if (sa.credentialsLocation) {
            docRows.push({
              document: 'Social Media Credentials',
              description: sa.platform ? `Login credentials for ${sa.platform}` : 'Social media account credentials',
              location: sa.credentialsLocation,
            });
          }
        });
      }
      if (sp.onlinePersonas && sp.onlinePersonas.length > 0) {
        sp.onlinePersonas.forEach((op) => {
          if (op.credentialsLocation) {
            docRows.push({
              document: 'Online Persona Credentials',
              description: op.name ? `Credentials for persona: ${op.name}` : 'Online persona credentials',
              location: op.credentialsLocation,
            });
          }
        });
      }
    }

    if (sp.hasMajorAssets === 'yes' && sp.assets && sp.assets.length > 0) {
      sp.assets.forEach((asset) => {
        if (asset.recordsLocation) {
          docRows.push({
            document: 'Asset Records',
            description: asset.name ? `${asset.name}${asset.type ? ` (${asset.type})` : ''}` : 'Business asset records',
            location: asset.recordsLocation,
          });
        }
      });
    }

    if (sp.hasLiabilities === 'yes' && sp.liabilities && sp.liabilities.length > 0) {
      sp.liabilities.forEach((liability) => {
        if (liability.documentationLocation) {
          docRows.push({
            document: 'Liability Documentation',
            description: liability.lenderName
              ? `${liability.liabilityType ? `${liability.liabilityType} — ` : ''}${liability.lenderName}`
              : liability.liabilityType || 'Outstanding debt/liability',
            location: liability.documentationLocation,
          });
        }
      });
    }

    if (sp.dissolutionPlanDocLocation && (sp.dissolutionPlan === 'yes' || sp.dissolutionPlan === 'beneficiary')) {
      docRows.push({
        document: 'Dissolution / Succession Plan',
        description: sp.dissolutionPlan === 'beneficiary'
          ? 'Plan for beneficiary to carry on the business'
          : 'Plan for orderly disposal of business assets and liabilities',
        location: sp.dissolutionPlanDocLocation,
      });
    }

    if (docRows.length > 0) {
      checkPage(30);
      yPosition += 4;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.setFillColor(...colors.navyBlue);
      doc.rect(margin, yPosition - 4, fieldWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`${businessName} — Document Summary`, margin + 3, yPosition + 2);
      doc.setTextColor(...colors.darkText);
      yPosition += 10;

      const colWidths = [45, 65, fieldWidth - 45 - 65];
      const colX = [margin, margin + 45, margin + 45 + 65];
      const rowHeight = 7;
      const headerHeight = 8;

      checkPage(headerHeight + rowHeight);
      doc.setFillColor(220, 228, 240);
      doc.rect(margin, yPosition, fieldWidth, headerHeight, 'F');
      doc.setDrawColor(...colors.borderGray);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPosition, fieldWidth, headerHeight, 'S');
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colors.navyBlue);
      const headers = ['Document', 'Description', 'Location'];
      headers.forEach((h, hi) => {
        doc.text(h, colX[hi] + 2, yPosition + 5.5);
        if (hi < 2) {
          doc.setDrawColor(...colors.borderGray);
          doc.line(colX[hi + 1], yPosition, colX[hi + 1], yPosition + headerHeight);
        }
      });
      yPosition += headerHeight;

      docRows.forEach((row, ri) => {
        const cellTexts = [
          doc.splitTextToSize(row.document, colWidths[0] - 4),
          doc.splitTextToSize(row.description, colWidths[1] - 4),
          doc.splitTextToSize(row.location, colWidths[2] - 4),
        ];
        const maxLines = Math.max(...cellTexts.map((t) => t.length));
        const cellHeight = maxLines * 5 + 4;

        checkPage(cellHeight + 2);
        if (ri % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPosition, fieldWidth, cellHeight, 'F');
        }
        doc.setDrawColor(...colors.borderGray);
        doc.setLineWidth(0.2);
        doc.rect(margin, yPosition, fieldWidth, cellHeight, 'S');
        cellTexts.forEach((lines, ci) => {
          if (ci < 2) {
            doc.line(colX[ci + 1], yPosition, colX[ci + 1], yPosition + cellHeight);
          }
        });

        doc.setFont(undefined, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.darkText);
        cellTexts.forEach((lines, ci) => {
          lines.forEach((line: string, li: number) => {
            doc.text(line, colX[ci] + 2, yPosition + 5 + li * 5);
          });
        });
        yPosition += cellHeight;
      });

      yPosition += 6;
      doc.setFontSize(10);
    }
  };

  const renderPartnershipDetails = (p: PartnershipItem, idx: number, clientName: string) => {
    const businessName = p.registeredName || `Partnership ${idx + 1}`;
    const pageHeight = doc.internal.pageSize.height;
    const checkPage = (needed: number) => {
      if (yPosition + needed > pageHeight - 15) {
        addPage();
        yPosition = 15;
      }
    };

    checkPage(12);
    yPosition += 4;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(`${clientName}'s Partnership ${idx + 1}: ${businessName}`, margin, yPosition);
    yPosition += 8;

    addSubsectionHeader('Business Identification and Records');

    {
      const pIdRows: [string, string][] = [];
      if (p.registeredName !== undefined) pIdRows.push(['Registered Name of the Business:', p.registeredName]);
      if (p.natureOfBusiness !== undefined) pIdRows.push(['Nature of Business:', p.natureOfBusiness]);
      if (pIdRows.length > 0) {
        const labelColW = 70;
        const valueColW = fieldWidth - labelColW;
        const rowH = 8;
        checkPage(pIdRows.length * rowH + 2);
        pIdRows.forEach(([label, val], rowIdx) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const labelLines = doc.splitTextToSize(label, labelColW - 3);
          const dynH = Math.max(rowH, labelLines.length * 5 + 3);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, labelColW, dynH, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.rect(margin + labelColW, yPosition, valueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const fldPIdVal = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          fldPIdVal.fieldName = `p_id_val_${idx}_row_${rowIdx}`;
          fldPIdVal.Rect = [margin + labelColW + 0.5, yPosition + 0.5, valueColW - 1, dynH - 1];
          fldPIdVal.fontSize = 9;
          fldPIdVal.textColor = colors.darkText;
          fldPIdVal.borderStyle = 'none';
          fldPIdVal.value = val;
          doc.addField(fldPIdVal);
          yPosition += dynH;
        });
        yPosition += 4;
      }
    }

    const pLabelColW = 70;
    const pValueColW = fieldWidth - pLabelColW;
    const pRowH = 8;

    const renderPRow = (label: string, value: string, fieldName: string) => {
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const labelLines = doc.splitTextToSize(label, pLabelColW - 4);
      const dynamicRowH = Math.max(pRowH, labelLines.length * 5 + 3);
      checkPage(dynamicRowH + 2);
      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, yPosition, pLabelColW, dynamicRowH, 'FD');
      doc.setFillColor(255, 255, 255);
      doc.rect(margin + pLabelColW, yPosition, pValueColW, dynamicRowH, 'FD');
      doc.setTextColor(...colors.darkText);
      doc.text(labelLines, margin + 2, yPosition + 5.5);
      const f = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      f.fieldName = fieldName;
      f.Rect = [margin + pLabelColW + 0.5, yPosition + 0.5, pValueColW - 1, dynamicRowH - 1];
      f.fontSize = 8;
      f.textColor = colors.darkText;
      f.borderStyle = 'none';
      f.value = value;
      doc.addField(f);
      yPosition += dynamicRowH;
    };

    const typeLabel = p.partnershipType === 'general'
      ? 'General Partner (with unlimited personal liability)'
      : p.partnershipType === 'limited' ? 'Limited Partner (with limited liability)' : '';
    if (typeLabel) renderPRow('Type of Partnership:', typeLabel, `p_type_${idx}`);

    renderPRow('Written Partnership Agreement:', p.hasWrittenAgreement === 'yes' ? 'Yes' : p.hasWrittenAgreement === 'no' ? 'No' : '', `p_agreement_yesno_${idx}`);

    if (p.hasWrittenAgreement === 'yes') {
      if (p.agreementDocLocation) renderPRow('Location of Original Document:', p.agreementDocLocation, `p_agreement_loc_${idx}`);
      if (p.agreementHasDeathProvisions) {
        const provisionLabels: Record<string, string> = { yes: 'Yes', no: 'No', unsure: "I'm not sure" };
        renderPRow('Contains provisions for death or incapacity of a partner:', provisionLabels[p.agreementHasDeathProvisions] || p.agreementHasDeathProvisions, `p_agreement_provisions_${idx}`);
      }
    }

    addSubsectionHeader('Continuity and Buy-Sell Provisions');

    if (p.continuityContinues) {
      const continuityLabels: Record<string, string> = {
        continues: 'Continues with remaining partners',
        wound_up: 'Wound up',
        unsure: "I'm not sure",
      };
      renderPRow('Business continuation upon death or incapacity:', continuityLabels[p.continuityContinues] || p.continuityContinues, `p_continuity_${idx}`);
    }

    if (p.hasBuySellAgreement) {
      renderPRow('Buy-sell agreement obliging remaining partners to purchase interest:', p.hasBuySellAgreement === 'yes' ? 'Yes' : 'No', `p_buysell_yesno_${idx}`);
    }

    if (p.hasBuySellAgreement === 'yes') {
      if (p.buySellDocLocation) renderPRow('Location of buy/sell document:', p.buySellDocLocation, `p_buysell_loc_${idx}`);
      if (p.buySellFundedByInsurance) renderPRow('Buy/sell agreement funded by life insurance:', p.buySellFundedByInsurance === 'yes' ? 'Yes' : 'No', `p_buysell_insurance_yesno_${idx}`);
      if (p.buySellFundedByInsurance === 'yes' && p.buySellInsuranceDocLocation) {
        renderPRow('Location of buy/sell life insurance documentation:', p.buySellInsuranceDocLocation, `p_buysell_insurance_loc_${idx}`);
      }
    }

    if (p.hasValuationMethod) {
      renderPRow('Written valuation method for partnership interest:', p.hasValuationMethod === 'yes' ? 'Yes' : 'No', `p_valuation_yesno_${idx}`);
    }
    if (p.hasValuationMethod === 'yes' && p.valuationMethodDocLocation) {
      renderPRow('Location of valuation method documentation:', p.valuationMethodDocLocation, `p_valuation_loc_${idx}`);
    }

    addSubsectionHeader('Liability and Fiduciary Risks');

    if (p.hasPersonalGuarantees) {
      renderPRow('Personal guarantees for partnership debts or bank loans:', p.hasPersonalGuarantees === 'yes' ? 'Yes' : 'No', `p_personal_guarantees_yesno_${idx}`);
    }

    if (p.hasPersonalGuarantees === 'yes' && p.personalGuarantees && p.personalGuarantees.length > 0) {
      p.personalGuarantees.forEach((g, gIdx) => {
        checkPage(20);
        yPosition += 4;
        doc.setFont(undefined, 'bolditalic');
        doc.setFontSize(9);
        doc.setTextColor(...colors.darkText);
        const pgLabel = `Personal Guarantee ${gIdx + 1}:`;
        doc.text(pgLabel, margin, yPosition);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition + 1, margin + doc.getTextWidth(pgLabel), yPosition + 1);
        yPosition += 6;
        if (g.natureOfDebt) renderPRow('Nature of the debt:', g.natureOfDebt, `p_guarantee_debt_${idx}_${gIdx}`);
        if (g.documentationLocation) renderPRow('Documentation location:', g.documentationLocation, `p_guarantee_doc_${idx}_${gIdx}`);
        yPosition += 2;
      });
    }

    if (p.isProfessionalPartnership) {
      renderPRow('Professional partnership (law, accounting, etc.):', p.isProfessionalPartnership === 'yes' ? 'Yes' : 'No', `p_professional_yesno_${idx}`);
    }

    if (p.isProfessionalPartnership === 'yes') {
      if (p.hasLiabilityInsurance) {
        renderPRow('Liability or errors and omissions insurance:', p.hasLiabilityInsurance === 'yes' ? 'Yes' : 'No', `p_liability_insurance_yesno_${idx}`);
      }
      if (p.hasLiabilityInsurance === 'yes' && p.liabilityInsurancePolicies && p.liabilityInsurancePolicies.length > 0) {
        p.liabilityInsurancePolicies.forEach((pol, pIdx) => {
          checkPage(20);
          yPosition += 4;
          doc.setFont(undefined, 'bolditalic');
          doc.setFontSize(9);
          doc.setTextColor(...colors.darkText);
          const polLabel = `Policy ${pIdx + 1}:`;
          doc.text(polLabel, margin, yPosition);
          doc.setLineWidth(0.3);
          doc.line(margin, yPosition + 1, margin + doc.getTextWidth(polLabel), yPosition + 1);
          yPosition += 6;
          if (pol.description) renderPRow('Description:', pol.description, `p_policy_desc_${idx}_${pIdx}`);
          if (pol.documentationLocation) renderPRow('Documentation location:', pol.documentationLocation, `p_policy_doc_${idx}_${pIdx}`);
          yPosition += 2;
        });
      }
    }

    doc.setFontSize(10);

    // Document Summary Table
    type PDocRow = { document: string; description: string; location: string };
    const pDocRows: PDocRow[] = [];

    if (p.agreementDocLocation && p.hasWrittenAgreement === 'yes') {
      pDocRows.push({
        document: 'Partnership Agreement',
        description: p.agreementHasDeathProvisions === 'yes'
          ? 'Written agreement including death/incapacity provisions'
          : 'Written partnership agreement',
        location: p.agreementDocLocation,
      });
    }

    if (p.buySellDocLocation && p.hasBuySellAgreement === 'yes') {
      pDocRows.push({
        document: 'Buy-Sell Agreement',
        description: p.buySellFundedByInsurance === 'yes'
          ? 'Buy-sell agreement (funded by life insurance)'
          : 'Buy-sell agreement',
        location: p.buySellDocLocation,
      });
    }

    if (p.buySellInsuranceDocLocation && p.buySellFundedByInsurance === 'yes') {
      pDocRows.push({
        document: 'Buy-Sell Life Insurance',
        description: 'Life insurance funding the buy-sell agreement',
        location: p.buySellInsuranceDocLocation,
      });
    }

    if (p.valuationMethodDocLocation && p.hasValuationMethod === 'yes') {
      pDocRows.push({
        document: 'Valuation Method',
        description: 'Written method for valuing partnership interest',
        location: p.valuationMethodDocLocation,
      });
    }

    if (p.hasPersonalGuarantees === 'yes' && p.personalGuarantees && p.personalGuarantees.length > 0) {
      p.personalGuarantees.forEach((g, gi) => {
        if (g.documentationLocation) {
          pDocRows.push({
            document: `Personal Guarantee ${gi + 1}`,
            description: g.natureOfDebt ? `Guarantee on: ${g.natureOfDebt}` : 'Personal guarantee on partnership debt',
            location: g.documentationLocation,
          });
        }
      });
    }

    if (p.hasLiabilityInsurance === 'yes' && p.liabilityInsurancePolicies && p.liabilityInsurancePolicies.length > 0) {
      p.liabilityInsurancePolicies.forEach((pol, pi) => {
        if (pol.documentationLocation) {
          pDocRows.push({
            document: `Liability Insurance Policy ${pi + 1}`,
            description: pol.description || 'Liability / errors and omissions insurance policy',
            location: pol.documentationLocation,
          });
        }
      });
    }

    if (pDocRows.length > 0) {
      checkPage(30);
      yPosition += 4;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.setFillColor(...colors.navyBlue);
      doc.rect(margin, yPosition - 4, fieldWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`${businessName} — Document Summary`, margin + 3, yPosition + 2);
      doc.setTextColor(...colors.darkText);
      yPosition += 10;

      const pColWidths = [45, 65, fieldWidth - 45 - 65];
      const pColX = [margin, margin + 45, margin + 45 + 65];
      const pHeaderHeight = 8;

      checkPage(pHeaderHeight + 7);
      doc.setFillColor(220, 228, 240);
      doc.rect(margin, yPosition, fieldWidth, pHeaderHeight, 'F');
      doc.setDrawColor(...colors.borderGray);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPosition, fieldWidth, pHeaderHeight, 'S');
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colors.navyBlue);
      const pHeaders = ['Document', 'Description', 'Location'];
      pHeaders.forEach((h, hi) => {
        doc.text(h, pColX[hi] + 2, yPosition + 5.5);
        if (hi < 2) {
          doc.setDrawColor(...colors.borderGray);
          doc.line(pColX[hi + 1], yPosition, pColX[hi + 1], yPosition + pHeaderHeight);
        }
      });
      yPosition += pHeaderHeight;

      pDocRows.forEach((row, ri) => {
        const cellTexts = [
          doc.splitTextToSize(row.document, pColWidths[0] - 4),
          doc.splitTextToSize(row.description, pColWidths[1] - 4),
          doc.splitTextToSize(row.location, pColWidths[2] - 4),
        ];
        const maxLines = Math.max(...cellTexts.map((t) => t.length));
        const cellHeight = maxLines * 5 + 4;

        checkPage(cellHeight + 2);
        if (ri % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPosition, fieldWidth, cellHeight, 'F');
        }
        doc.setDrawColor(...colors.borderGray);
        doc.setLineWidth(0.2);
        doc.rect(margin, yPosition, fieldWidth, cellHeight, 'S');
        cellTexts.forEach((lines, ci) => {
          if (ci < 2) {
            doc.line(pColX[ci + 1], yPosition, pColX[ci + 1], yPosition + cellHeight);
          }
        });

        doc.setFont(undefined, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.darkText);
        cellTexts.forEach((lines, ci) => {
          lines.forEach((line: string, li: number) => {
            doc.text(line, pColX[ci] + 2, yPosition + 5 + li * 5);
          });
        });
        yPosition += cellHeight;
      });

      yPosition += 6;
      doc.setFontSize(10);
    }
  };

  if (formData.hasSoleProprietorship === 'yes' || formData.hasPartnership === 'yes') {
    yPosition += 6;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.darkText);
    doc.text(`${businessClient1Name}'s Business Information`, margin, yPosition);
    yPosition += 10;

    if (formData.hasSoleProprietorship === 'yes') {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkText);
      doc.text(`${businessClient1Name} has ownership in a sole proprietorship.`, margin, yPosition);
      yPosition += 8;
      if (formData.soleProprietorshipCount) {
        doc.setFont(undefined, 'bold');
        doc.text('Number of Sole Proprietorships:', margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(` ${formData.soleProprietorshipCount}`, margin + 58, yPosition);
        yPosition += 8;
      }

      const c1SoleProps = formData.client1SolePropsData || [];
      const c1Count = parseInt(formData.soleProprietorshipCount || '0') || 0;
      for (let i = 0; i < c1Count; i++) {
        renderSolePropDetails(c1SoleProps[i] || {}, i, businessClient1Name);
      }
    }

    if (formData.hasPartnership === 'yes') {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkText);
      doc.text(`${businessClient1Name} has ownership interests in a partnership.`, margin, yPosition);
      yPosition += 8;
      if (formData.partnershipCount) {
        doc.setFont(undefined, 'bold');
        doc.text('Number of Partnerships:', margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(` ${formData.partnershipCount}`, margin + 46, yPosition);
        yPosition += 8;
      }

      const c1Partnerships = formData.client1PartnershipsData || [];
      const c1PCount = parseInt(formData.partnershipCount || '0') || 0;
      for (let i = 0; i < c1PCount; i++) {
        renderPartnershipDetails(c1Partnerships[i] || {}, i, businessClient1Name);
      }
    }
  }

  if (hasSpouseForBusiness && (formData.client2HasSoleProprietorship === 'yes' || formData.client2HasPartnership === 'yes')) {
    yPosition += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.darkText);
    doc.text(`${businessClient2Name}'s Business Information`, margin, yPosition);
    yPosition += 10;

    if (formData.client2HasSoleProprietorship === 'yes') {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkText);
      doc.text(`${businessClient2Name} has ownership in a sole proprietorship.`, margin, yPosition);
      yPosition += 8;
      if (formData.client2SoleProprietorshipCount) {
        doc.setFont(undefined, 'bold');
        doc.text('Number of Sole Proprietorships:', margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(` ${formData.client2SoleProprietorshipCount}`, margin + 58, yPosition);
        yPosition += 8;
      }

      const c2SoleProps = formData.client2SolePropsData || [];
      const c2Count = parseInt(formData.client2SoleProprietorshipCount || '0') || 0;
      for (let i = 0; i < c2Count; i++) {
        renderSolePropDetails(c2SoleProps[i] || {}, i, businessClient2Name);
      }
    }

    if (formData.client2HasPartnership === 'yes') {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkText);
      doc.text(`${businessClient2Name} has ownership interests in a partnership.`, margin, yPosition);
      yPosition += 8;
      if (formData.client2PartnershipCount) {
        doc.setFont(undefined, 'bold');
        doc.text('Number of Partnerships:', margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(` ${formData.client2PartnershipCount}`, margin + 46, yPosition);
        yPosition += 8;
      }

      const c2Partnerships = formData.client2PartnershipsData || [];
      const c2PCount = parseInt(formData.client2PartnershipCount || '0') || 0;
      for (let i = 0; i < c2PCount; i++) {
        renderPartnershipDetails(c2Partnerships[i] || {}, i, businessClient2Name);
      }
    }
  }

  addPage();
  yPosition = 12;
  addSectionHeader('Corporate Information');

  const hasSpouseForCorp = (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law');
  const corpClient1Name = formData.fullName || 'Client 1';
  const corpClient2Name = formData.spouseName || 'Client 2';

  if (formData.ownsCorporation === 'no') {
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.darkText);
    if (hasSpouseForCorp) {
      doc.text(`(${corpClient1Name}) and (${corpClient2Name}), indicated that they do not own a corporation.`, margin, yPosition);
    } else {
      doc.text(`(${corpClient1Name}), indicated that they do not own a corporation.`, margin, yPosition);
    }
    yPosition += 8;
  } else if (formData.ownsCorporation === 'yes') {
    const corporationCount = parseInt(formData.numberOfCorporations || '0');

    if (corporationCount > 0) {
      for (let i = 0; i < corporationCount; i++) {
        const corporation = formData.corporationsData?.[i];
        const ordinal = getOrdinalLabel(i + 1);

        addSubsectionHeader(`${ordinal} Corporation:${corporation?.legalName ? ` ${corporation.legalName}` : ''}`);

        const corporationTypeValue = corporation?.corporationType === 'Other' && corporation?.corporationTypeOther
          ? `${corporation.corporationType} - ${corporation.corporationTypeOther}`
          : (corporation?.corporationType || '');

        let ownersArray: string[] = [];
        if (corporation?.owners) {
          ownersArray = corporation.owners.split(',');
        }
        if (corporation?.otherOwners) {
          try {
            const otherOwnersList = typeof corporation.otherOwners === 'string'
              ? JSON.parse(corporation.otherOwners)
              : corporation.otherOwners;
            if (Array.isArray(otherOwnersList)) {
              ownersArray = [...ownersArray, ...otherOwnersList.filter((owner: string) => owner && owner.trim() !== '')];
            }
          } catch (e) {
            console.error('Error parsing otherOwners:', e);
          }
        }
        const ownersValue = ownersArray.join(', ');

        const shareholderAgreementValue = corporation?.hasShareholderAgreement === 'yes'
          ? (corporation?.shareholderAgreementLocation || '')
          : (corporation?.hasShareholderAgreement === 'no' ? 'No shareholder agreement' : '');

        const corpRows = [
          { label: `${ordinal} Corporation's Name:`, value: corporation?.legalName || '', fieldName: 'name' },
          { label: 'This company was incorporated in:', value: corporation?.jurisdiction || '', fieldName: 'jurisdiction' },
          { label: 'Type of corporation:', value: corporationTypeValue, fieldName: 'type' },
          { label: 'Owner(s):', value: ownersValue, fieldName: 'owners' },
          { label: 'Location of the Articles of Incorporation:', value: corporation?.articlesLocation || '', fieldName: 'articlesLocation' },
          { label: 'Location of Corporate Minute Book:', value: corporation?.minuteBookLocation || '', fieldName: 'minuteBookLocation' },
          { label: 'Shareholder Agreement:', value: shareholderAgreementValue, fieldName: 'shareholderAgreement' },
        ];

        if (corporation?.corporationType === 'Holding Company') {
          corpRows.push({
            label: 'Holding Company Assets:',
            value: corporation?.holdingCompanyAssets || '',
            fieldName: 'holdingCompanyAssets'
          });
        }

        const cellHeight = 8;
        const labelWidth = fieldWidth * 0.40;
        const valueWidth = fieldWidth * 0.60;

        const tableHeight = corpRows.reduce((sum, row) => {
          return sum + (row.fieldName === 'holdingCompanyAssets' ? 24 : cellHeight);
        }, 0);

        if (yPosition + tableHeight > pageHeight - margin) {
          addPage();
          yPosition = 12;
          addSubsectionHeader(`${ordinal} Corporation:${corporation?.legalName ? ` ${corporation.legalName}` : ''}`);
        }

        corpRows.forEach((row, rowIndex) => {
          const isHoldingAssets = row.fieldName === 'holdingCompanyAssets';
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          const labelLines = doc.splitTextToSize(row.label, labelWidth - 3);
          const baseH = isHoldingAssets ? 24 : cellHeight;
          const rowHeight = Math.max(baseH, labelLines.length * 5 + 3);
          const rowY = yPosition;

          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, rowY, labelWidth, rowHeight, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.rect(margin + labelWidth, rowY, valueWidth, rowHeight, 'FD');

          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 1, rowY + 5);

          const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          field.fieldName = `corporation_${i + 1}_${row.fieldName}`;
          field.Rect = [margin + labelWidth + 0.5, rowY + 0.5, valueWidth - 1, rowHeight - 1];
          field.fontSize = 9;
          field.textColor = colors.darkText;
          field.borderStyle = 'none';
          field.value = row.value;
          if (isHoldingAssets) {
            field.multiline = true;
          }
          doc.addField(field);

          yPosition += rowHeight;
        });

        yPosition += 12;

        const corpName = corporation?.legalName || `${ordinal} Corporation`;

        const bpcTableHeight = 14 + (4 * 10) + 8;
        if (yPosition + bpcTableHeight > pageHeight - margin) {
          addPage();
          yPosition = 12;
        }

        const allPtRows = [
          'Lawyer(s):',
          'Accountant/Tax Prep(s):',
          'Trustee(s):',
          'Life/Disability/Critical Illness Provider(s):',
          'Corporate Accountant:',
          'Commercial Banker:',
          'Business Valuator:',
          'Other:',
          'Other:',
        ];
        const ptRowHeight = 10;
        const ptHeaderHeight = 14;
        const ptTableHeight = ptHeaderHeight + (allPtRows.length * ptRowHeight) + 14;

        if (yPosition + ptTableHeight > pageHeight - margin) {
          addPage();
          yPosition = 12;
        }

        addSubsectionHeader(`${corpName} - Professional Team:`);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('These are the professionals that are related to your corporate needs:', margin, yPosition);
        yPosition += 8;

        const ptCol1Width = fieldWidth * 0.25;
        const ptCol2Width = fieldWidth * 0.25;
        const ptCol3Width = fieldWidth * 0.25;
        const ptCol4Width = fieldWidth * 0.25;

        const ptHeaders = ['Professional:', 'Name:', 'Firm & Contact Info:', 'Primary Role:'];

        let currentY = yPosition;
        doc.setLineWidth(0.3);

        ptHeaders.forEach((header, colIdx) => {
          const colWidths = [ptCol1Width, ptCol2Width, ptCol3Width, ptCol4Width];
          const xPos = margin + colWidths.slice(0, colIdx).reduce((a, b) => a + b, 0);
          doc.setDrawColor(...colors.tableBorder);
          doc.setFillColor(250, 250, 250);
          doc.rect(xPos, currentY, colWidths[colIdx], ptHeaderHeight, 'FD');
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(header, colWidths[colIdx] - 2);
          const textY = currentY + (ptHeaderHeight - lines.length * 3) / 2 + 3;
          doc.text(lines, xPos + 1, textY);
        });

        currentY += ptHeaderHeight;

        allPtRows.forEach((rowLabel, rowIdx) => {
          const rowY = currentY;
          doc.setDrawColor(...colors.tableBorder);
          doc.setFillColor(255, 255, 255);
          doc.setLineWidth(0.3);
          doc.rect(margin, rowY, ptCol1Width, ptRowHeight, 'FD');

          doc.setFontSize(7);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...colors.darkText);
          doc.text(rowLabel, margin + 1, rowY + 6);

          [ptCol2Width, ptCol3Width, ptCol4Width].forEach((colWidth, colIdx) => {
            const xPos = margin + ptCol1Width + [0, ptCol2Width, ptCol2Width + ptCol3Width][colIdx];
            doc.rect(xPos, rowY, colWidth, ptRowHeight);

            const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
            field.fieldName = `corp_${i + 1}_pt_${rowIdx}_${colIdx}`;
            field.Rect = [xPos + 0.5, rowY + 0.5, colWidth - 1, ptRowHeight - 1];
            field.fontSize = 7;
            field.textColor = colors.darkText;
            field.borderStyle = 'none';
            field.multiline = true;
            doc.addField(field);
          });

          currentY += ptRowHeight;
        });

        yPosition = currentY + 12;

        const fopgRowHeight = 10;
        const fopgHeaderHeight = 18;
        const fopgRowCount = 4;
        const fopgTableHeight = fopgHeaderHeight + (fopgRowCount * fopgRowHeight) + 8;

        if (yPosition + fopgTableHeight > pageHeight - margin) {
          addPage();
          yPosition = 12;
        }

        addSubsectionHeader(`${corpName} - Financial Obligations and Personal Guarantees:`);

        const fopgCol1Width = fieldWidth * 0.20;
        const fopgCol2Width = fieldWidth * 0.22;
        const fopgCol3Width = fieldWidth * 0.18;
        const fopgCol4Width = fieldWidth * 0.15;
        const fopgCol5Width = fieldWidth * 0.25;

        const fopgHeaders = ['Creditor/Bank:', 'Loan Type (term, LOC, Mortgage):', 'Account Number:', 'Personal Guarantee? (Y/N)', 'Location of Supporting Documents'];

        currentY = yPosition;
        doc.setLineWidth(0.3);

        fopgHeaders.forEach((header, colIdx) => {
          const colWidths = [fopgCol1Width, fopgCol2Width, fopgCol3Width, fopgCol4Width, fopgCol5Width];
          const xPos = margin + colWidths.slice(0, colIdx).reduce((a, b) => a + b, 0);
          doc.setDrawColor(...colors.tableBorder);
          doc.setFillColor(250, 250, 250);
          doc.rect(xPos, currentY, colWidths[colIdx], fopgHeaderHeight, 'FD');
          doc.setFontSize(7);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(header, colWidths[colIdx] - 2);
          const textY = currentY + (fopgHeaderHeight - lines.length * 2.5) / 2 + 2.5;
          doc.text(lines, xPos + 1, textY);
        });

        currentY += fopgHeaderHeight;

        for (let rowIdx = 0; rowIdx < fopgRowCount; rowIdx++) {
          const rowY = currentY;
          [fopgCol1Width, fopgCol2Width, fopgCol3Width, fopgCol4Width, fopgCol5Width].forEach((colWidth, colIdx) => {
            const xPos = margin + [0, fopgCol1Width, fopgCol1Width + fopgCol2Width, fopgCol1Width + fopgCol2Width + fopgCol3Width, fopgCol1Width + fopgCol2Width + fopgCol3Width + fopgCol4Width][colIdx];
            doc.setDrawColor(...colors.tableBorder);
            doc.setLineWidth(0.3);
            doc.rect(xPos, rowY, colWidth, fopgRowHeight);

            const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
            field.fieldName = `corp_${i + 1}_fopg_${rowIdx}_${colIdx}`;
            field.Rect = [xPos + 0.5, rowY + 0.5, colWidth - 1, fopgRowHeight - 1];
            field.fontSize = 7;
            field.textColor = colors.darkText;
            field.borderStyle = 'none';
            field.multiline = true;
            doc.addField(field);
          });

          currentY += fopgRowHeight;
        }

        yPosition = currentY + 12;

        const bcrmRowHeight = 10;
        const bcrmHeaderHeight = 18;
        const bcrmRows = ['Key Person', 'Buy-Sell Funding', 'Overhead Expense', 'Commercial General Liability'];
        const bcrmTableHeight = bcrmHeaderHeight + (bcrmRows.length * bcrmRowHeight) + 14;

        if (yPosition + bcrmTableHeight > pageHeight - margin) {
          addPage();
          yPosition = 12;
        }

        addSubsectionHeader(`${corpName} - Business Continuity and Risk Management:`);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Insurance is often the primary source of liquidity for funding buy/sell agreements or paying terminal taxes.', margin, yPosition);
        yPosition += 8;

        const bcrmCol1Width = fieldWidth * 0.18;
        const bcrmCol2Width = fieldWidth * 0.18;
        const bcrmCol3Width = fieldWidth * 0.18;
        const bcrmCol4Width = fieldWidth * 0.18;
        const bcrmCol5Width = fieldWidth * 0.13;
        const bcrmCol6Width = fieldWidth * 0.15;

        const bcrmHeaders = ['Policy Type:', 'Insurance Carrier:', 'Key Contact:', 'Policy Number:', 'Beneficiary/Purpose:', 'Location of Supporting Documents'];

        currentY = yPosition;
        doc.setLineWidth(0.3);

        bcrmHeaders.forEach((header, colIdx) => {
          const colWidths = [bcrmCol1Width, bcrmCol2Width, bcrmCol3Width, bcrmCol4Width, bcrmCol5Width, bcrmCol6Width];
          const xPos = margin + colWidths.slice(0, colIdx).reduce((a, b) => a + b, 0);
          doc.setDrawColor(...colors.tableBorder);
          doc.setFillColor(250, 250, 250);
          doc.rect(xPos, currentY, colWidths[colIdx], bcrmHeaderHeight, 'FD');
          doc.setFontSize(6.5);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(header, colWidths[colIdx] - 2);
          const textY = currentY + (bcrmHeaderHeight - lines.length * 2.5) / 2 + 2.5;
          doc.text(lines, xPos + 1, textY);
        });

        currentY += bcrmHeaderHeight;

        bcrmRows.forEach((rowLabel, rowIdx) => {
          const rowY = currentY;
          doc.setDrawColor(...colors.tableBorder);
          doc.setFillColor(255, 255, 255);
          doc.setLineWidth(0.3);
          doc.rect(margin, rowY, bcrmCol1Width, bcrmRowHeight, 'FD');

          doc.setFontSize(7);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...colors.darkText);
          doc.text(rowLabel, margin + 1, rowY + 6);

          [bcrmCol2Width, bcrmCol3Width, bcrmCol4Width, bcrmCol5Width, bcrmCol6Width].forEach((colWidth, colIdx) => {
            const xPos = margin + bcrmCol1Width + [0, bcrmCol2Width, bcrmCol2Width + bcrmCol3Width, bcrmCol2Width + bcrmCol3Width + bcrmCol4Width, bcrmCol2Width + bcrmCol3Width + bcrmCol4Width + bcrmCol5Width][colIdx];
            doc.rect(xPos, rowY, colWidth, bcrmRowHeight);

            const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
            field.fieldName = `corp_${i + 1}_bcrm_${rowIdx}_${colIdx}`;
            field.Rect = [xPos + 0.5, rowY + 0.5, colWidth - 1, bcrmRowHeight - 1];
            field.fontSize = 7;
            field.textColor = colors.darkText;
            field.borderStyle = 'none';
            field.multiline = true;
            doc.addField(field);
          });

          currentY += bcrmRowHeight;
        });

        yPosition = currentY + 12;

        const sbstRowHeight = 10;
        const sbstHeaderHeight = 18;
        const sbstRows = [
          { label: 'Chosen Successor:', placeholder: 'e.g. Shareholder Agreement' },
          { label: 'Buy-Sell Trigger Events:', placeholder: 'e.g. Death, Disability, Divorce' },
          { label: 'Valuation Method:', placeholder: 'e.g. Formula vs. Independent Valuation' },
          { label: 'Other Scenario:', placeholder: '' },
          { label: 'Other Scenario:', placeholder: '' }
        ];
        const sbstTableHeight = sbstHeaderHeight + (sbstRows.length * sbstRowHeight) + 14;

        if (yPosition + sbstTableHeight > pageHeight - margin) {
          addPage();
          yPosition = 12;
        }

        addSubsectionHeader(`${corpName} - Succession and Buy-Sell Triggers:`);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Identify the roadmap for who takes control and how they are supposed to pay for it.', margin, yPosition);
        yPosition += 8;

        const sbstCol1Width = fieldWidth * 0.20;
        const sbstCol2Width = fieldWidth * 0.30;
        const sbstCol3Width = fieldWidth * 0.25;
        const sbstCol4Width = fieldWidth * 0.25;

        const sbstHeaders = ['Succession Detail:', 'Response/Instruction:', 'Location of Governing Agreement:', 'Other Information:'];

        currentY = yPosition;
        doc.setLineWidth(0.3);

        sbstHeaders.forEach((header, colIdx) => {
          const colWidths = [sbstCol1Width, sbstCol2Width, sbstCol3Width, sbstCol4Width];
          const xPos = margin + colWidths.slice(0, colIdx).reduce((a, b) => a + b, 0);
          doc.setDrawColor(...colors.tableBorder);
          doc.setFillColor(250, 250, 250);
          doc.rect(xPos, currentY, colWidths[colIdx], sbstHeaderHeight, 'FD');
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(header, colWidths[colIdx] - 2);
          const textY = currentY + (sbstHeaderHeight - lines.length * 3) / 2 + 3;
          doc.text(lines, xPos + 1, textY);
        });

        currentY += sbstHeaderHeight;

        sbstRows.forEach((row, rowIdx) => {
          const rowY = currentY;
          doc.setDrawColor(...colors.tableBorder);
          doc.setFillColor(255, 255, 255);
          doc.setLineWidth(0.3);
          doc.rect(margin, rowY, sbstCol1Width, sbstRowHeight, 'FD');

          doc.setFontSize(7);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...colors.darkText);
          doc.text(row.label, margin + 1, rowY + 6);

          [sbstCol2Width, sbstCol3Width, sbstCol4Width].forEach((colWidth, colIdx) => {
            const xPos = margin + sbstCol1Width + [0, sbstCol2Width, sbstCol2Width + sbstCol3Width][colIdx];
            doc.setDrawColor(...colors.tableBorder);
            doc.rect(xPos, rowY, colWidth, sbstRowHeight);

            const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
            field.fieldName = `corp_${i + 1}_sbst_${rowIdx}_${colIdx}`;
            field.Rect = [xPos + 0.5, rowY + 0.5, colWidth - 1, sbstRowHeight - 1];
            field.fontSize = 7;
            field.textColor = colors.darkText;
            field.borderStyle = 'none';
            field.multiline = true;
            if (colIdx === 0 && row.placeholder) {
              field.value = row.placeholder;
            }
            doc.addField(field);
          });

          currentY += sbstRowHeight;
        });

        yPosition = currentY + 8;
      }
    }
  }

  // ── Life Insurance / Group Benefits ──
  {
    const hasSpouseForLI = (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law');
    const liClient1Name = formData.fullName || 'Client 1';
    const liClient2Name = formData.spouseName || 'Client 2';
    const MAX_POLICIES_PDF = 4;

    const resolveInsuredPersonLabel = (val: string): string => {
      if (val === 'client1') return liClient1Name;
      if (val === 'client2') return liClient2Name;
      if (val === 'other') return 'Other';
      if (val.startsWith('child_')) {
        const idx = parseInt(val.replace('child_', ''));
        const children = (formData.childrenData as Array<Record<string, string>>) || [];
        return children[idx]?.name || `Child ${idx + 1}`;
      }
      if (val.startsWith('c1prevrel_')) {
        const idx = parseInt(val.replace('c1prevrel_', ''));
        const rels = (formData.client1PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      if (val.startsWith('c2prevrel_')) {
        const idx = parseInt(val.replace('c2prevrel_', ''));
        const rels = (formData.client2PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      return val;
    };

    const resolvePolicyOwnerLabel = (val: string): string => {
      if (val === 'client1') return liClient1Name;
      if (val === 'client2') return liClient2Name;
      if (val === 'other') return 'Other';
      if (val.startsWith('child_')) {
        const idx = parseInt(val.replace('child_', ''));
        const children = (formData.childrenData as Array<Record<string, string>>) || [];
        return children[idx]?.name || `Child ${idx + 1}`;
      }
      if (val.startsWith('corp_')) {
        const idx = parseInt(val.replace('corp_', ''));
        const corps = (formData.corporationsData as Array<Record<string, string>>) || [];
        return corps[idx]?.legalName || val;
      }
      if (val.startsWith('trust_')) {
        const t = parseInt(val.replace('trust_', ''));
        const trusts = formData.familyTrustsData || [];
        return trusts[t - 1]?.legalName || val;
      }
      if (val.startsWith('c1prevrel_')) {
        const idx = parseInt(val.replace('c1prevrel_', ''));
        const rels = (formData.client1PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      if (val.startsWith('c2prevrel_')) {
        const idx = parseInt(val.replace('c2prevrel_', ''));
        const rels = (formData.client2PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      return val;
    };

    const resolveBeneficiaryList = (raw: string): string => {
      if (!raw) return '';
      const arr = Array.isArray(raw) ? raw : raw.split(',');
      const labels = arr.map((v: string) => resolvePolicyOwnerLabel(v.trim())).filter(Boolean);
      return labels.join(', ');
    };

    const coverageEndLabel = (val: string): string => {
      if (val === 'retirement') return 'Retirement';
      if (val === 'job_change') return 'Job change';
      if (val === 'specific_date') return 'Specific date';
      return val;
    };

    const renderPolicySection = (
      clientName: string,
      clientPrefix: 'client1' | 'client2',
      policyNum: number
    ): boolean => {
      const p = `${clientPrefix}LifePolicy${policyNum}`;
      const prevGate = policyNum === 1
        ? `${clientPrefix}HasLifeInsurance`
        : `${clientPrefix}LifePolicy${policyNum - 1}HasAdditional`;

      if (formData[prevGate as keyof typeof formData] !== 'yes') return false;

      const insuredPerson = formData[`${p}InsuredPerson` as keyof typeof formData] as string || '';
      const hasAnyField = insuredPerson ||
        formData[`${p}Provider` as keyof typeof formData] ||
        formData[`${p}Employer` as keyof typeof formData] ||
        formData[`${p}CoverageAmount` as keyof typeof formData];
      if (!hasAnyField && policyNum > 1) return false;

      addSubsectionHeader(`${clientName} — Life Insurance Policy ${policyNum}`);
      checkPageBreak(30);

      const insuredLabel = insuredPerson ? resolveInsuredPersonLabel(insuredPerson) : '';
      const insuredOther = formData[`${p}InsuredPersonOther` as keyof typeof formData] as string || '';
      renderEstateRow('Insured Person:', insuredPerson === 'other' ? insuredOther : insuredLabel, `${p}_insured`);

      const ownerVal = formData[`${p}PolicyOwner` as keyof typeof formData] as string || '';
      const ownerOther = formData[`${p}PolicyOwnerOther` as keyof typeof formData] as string || '';
      renderEstateRow('Policy Owner:', ownerVal === 'other' ? ownerOther : resolvePolicyOwnerLabel(ownerVal), `${p}_owner`);

      renderEstateRow('Insurance Provider:', formData[`${p}Provider` as keyof typeof formData] as string || '', `${p}_provider`);
      renderEstateRow('Employer (if applicable):', formData[`${p}Employer` as keyof typeof formData] as string || '', `${p}_employer`);
      renderEstateRow('Coverage Amount:', formData[`${p}CoverageAmount` as keyof typeof formData] as string || '', `${p}_amount`);

      const endType = formData[`${p}CoverageEndType` as keyof typeof formData] as string || '';
      const endDate = formData[`${p}CoverageEndDate` as keyof typeof formData] as string || '';
      renderEstateRow('Coverage End:', endType === 'specific_date' && endDate ? endDate : coverageEndLabel(endType), `${p}_end`);

      renderEstateRow('Purpose:', formData[`${p}Purpose` as keyof typeof formData] as string || '', `${p}_purpose`);

      const benRaw = formData[`${p}Beneficiary` as keyof typeof formData] as string || '';
      const benOther = formData[`${p}BeneficiaryOther` as keyof typeof formData] as string || '';
      const benList = resolveBeneficiaryList(benRaw);
      const benDisplay = benRaw.split(',').includes('other') && benOther
        ? (benList ? `${benList} (Other: ${benOther})` : benOther)
        : benList;
      renderEstateRow('Beneficiary(ies):', benDisplay, `${p}_beneficiary`);

      const hasContingent = formData[`${p}HasContingentBeneficiaries` as keyof typeof formData] as string || '';
      renderEstateRow('Contingent Beneficiaries?', hasContingent === 'yes' ? 'Yes' : 'No', `${p}_hascontingent`);

      if (hasContingent === 'yes') {
        const conRaw = formData[`${p}ContingentBeneficiary` as keyof typeof formData] as string || '';
        const conOther = formData[`${p}ContingentBeneficiaryOther` as keyof typeof formData] as string || '';
        const conList = resolveBeneficiaryList(conRaw);
        const conDisplay = conRaw.split(',').includes('other') && conOther
          ? (conList ? `${conList} (Other: ${conOther})` : conOther)
          : conList;
        renderEstateRow('Contingent Beneficiary(ies):', conDisplay, `${p}_contingent`);
      }

      renderEstateRow('Location of the policy documentation:', formData[`${p}DocLocation` as keyof typeof formData] as string || '', `${p}_doclocation`);

      yPosition += 4;
      return true;
    };

    if (formData.client1HasLifeInsurance === 'yes' || formData.client2HasLifeInsurance === 'yes') {
      addPage();
      yPosition = 12;
      addSectionHeader('Life Insurance / Group Benefits');

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('The following life insurance policies are held through employer or group benefits.', margin, yPosition);
      yPosition += 8;

      if (formData.client1HasLifeInsurance === 'yes') {
        for (let i = 1; i <= MAX_POLICIES_PDF; i++) {
          if (!renderPolicySection(liClient1Name, 'client1', i)) break;
        }
      }

      if (hasSpouseForLI && formData.client2HasLifeInsurance === 'yes') {
        for (let i = 1; i <= MAX_POLICIES_PDF; i++) {
          if (!renderPolicySection(liClient2Name, 'client2', i)) break;
        }
      }
    }
  }

  // ── Critical Illness Insurance / Group Benefits ──
  {
    const hasSpouseForCI = (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law');
    const ciClient1Name = formData.fullName || 'Client 1';
    const ciClient2Name = formData.spouseName || 'Client 2';
    const MAX_CI_POLICIES_PDF = 4;

    const resolveInsuredPersonLabel = (val: string): string => {
      if (val === 'client1') return ciClient1Name;
      if (val === 'client2') return ciClient2Name;
      if (val === 'other') return 'Other';
      if (val.startsWith('child_')) {
        const idx = parseInt(val.replace('child_', ''));
        const children = (formData.childrenData as Array<Record<string, string>>) || [];
        return children[idx]?.name || `Child ${idx + 1}`;
      }
      if (val.startsWith('c1prevrel_')) {
        const idx = parseInt(val.replace('c1prevrel_', ''));
        const rels = (formData.client1PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      if (val.startsWith('c2prevrel_')) {
        const idx = parseInt(val.replace('c2prevrel_', ''));
        const rels = (formData.client2PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      return val;
    };

    const resolvePolicyOwnerLabel = (val: string): string => {
      if (val === 'client1') return ciClient1Name;
      if (val === 'client2') return ciClient2Name;
      if (val === 'other') return 'Other';
      if (val.startsWith('child_')) {
        const idx = parseInt(val.replace('child_', ''));
        const children = (formData.childrenData as Array<Record<string, string>>) || [];
        return children[idx]?.name || `Child ${idx + 1}`;
      }
      if (val.startsWith('corp_')) {
        const idx = parseInt(val.replace('corp_', ''));
        const corps = (formData.corporationsData as Array<Record<string, string>>) || [];
        return corps[idx]?.legalName || val;
      }
      if (val.startsWith('trust_')) {
        const t = parseInt(val.replace('trust_', ''));
        const trusts = formData.familyTrustsData || [];
        return trusts[t - 1]?.legalName || val;
      }
      if (val.startsWith('c1prevrel_')) {
        const idx = parseInt(val.replace('c1prevrel_', ''));
        const rels = (formData.client1PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      if (val.startsWith('c2prevrel_')) {
        const idx = parseInt(val.replace('c2prevrel_', ''));
        const rels = (formData.client2PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      return val;
    };

    const resolveBeneficiaryList = (raw: string): string => {
      if (!raw) return '';
      const arr = Array.isArray(raw) ? raw : raw.split(',');
      const labels = arr.map((v: string) => resolvePolicyOwnerLabel(v.trim())).filter(Boolean);
      return labels.join(', ');
    };

    const coverageEndLabel = (val: string): string => {
      if (val === 'retirement') return 'Retirement';
      if (val === 'job_change') return 'Job change';
      if (val === 'specific_date') return 'Specific date';
      return val;
    };

    const renderCiPolicySection = (
      clientName: string,
      clientPrefix: 'client1' | 'client2',
      policyNum: number
    ): boolean => {
      const p = `${clientPrefix}CiPolicy${policyNum}`;
      const prevGate = policyNum === 1
        ? `${clientPrefix}HasCriticalIllnessInsurance`
        : `${clientPrefix}CiPolicy${policyNum - 1}HasAdditional`;

      if (formData[prevGate as keyof typeof formData] !== 'yes') return false;

      const insuredPerson = formData[`${p}InsuredPerson` as keyof typeof formData] as string || '';
      const hasAnyField = insuredPerson ||
        formData[`${p}Provider` as keyof typeof formData] ||
        formData[`${p}Employer` as keyof typeof formData] ||
        formData[`${p}CoverageAmount` as keyof typeof formData];
      if (!hasAnyField && policyNum > 1) return false;

      addSubsectionHeader(`${clientName} — Critical Illness Policy ${policyNum}`);
      checkPageBreak(30);

      const insuredLabel = insuredPerson ? resolveInsuredPersonLabel(insuredPerson) : '';
      const insuredOther = formData[`${p}InsuredPersonOther` as keyof typeof formData] as string || '';
      renderEstateRow('Insured Person:', insuredPerson === 'other' ? insuredOther : insuredLabel, `${p}_insured`);

      const ownerVal = formData[`${p}PolicyOwner` as keyof typeof formData] as string || '';
      const ownerOther = formData[`${p}PolicyOwnerOther` as keyof typeof formData] as string || '';
      renderEstateRow('Policy Owner:', ownerVal === 'other' ? ownerOther : resolvePolicyOwnerLabel(ownerVal), `${p}_owner`);

      renderEstateRow('Insurance Provider:', formData[`${p}Provider` as keyof typeof formData] as string || '', `${p}_provider`);
      renderEstateRow('Employer (if applicable):', formData[`${p}Employer` as keyof typeof formData] as string || '', `${p}_employer`);
      renderEstateRow('Coverage Amount:', formData[`${p}CoverageAmount` as keyof typeof formData] as string || '', `${p}_amount`);

      const endType = formData[`${p}CoverageEndType` as keyof typeof formData] as string || '';
      const endDate = formData[`${p}CoverageEndDate` as keyof typeof formData] as string || '';
      renderEstateRow('Coverage End:', endType === 'specific_date' && endDate ? endDate : coverageEndLabel(endType), `${p}_end`);

      renderEstateRow('Purpose:', formData[`${p}Purpose` as keyof typeof formData] as string || '', `${p}_purpose`);

      const benRaw = formData[`${p}Beneficiary` as keyof typeof formData] as string || '';
      const benOther = formData[`${p}BeneficiaryOther` as keyof typeof formData] as string || '';
      const benList = resolveBeneficiaryList(benRaw);
      const benDisplay = benRaw.split(',').includes('other') && benOther
        ? (benList ? `${benList} (Other: ${benOther})` : benOther)
        : benList;
      renderEstateRow('Beneficiary(ies):', benDisplay, `${p}_beneficiary`);

      const hasContingent = formData[`${p}HasContingentBeneficiaries` as keyof typeof formData] as string || '';
      renderEstateRow('Contingent Beneficiaries?', hasContingent === 'yes' ? 'Yes' : 'No', `${p}_hascontingent`);

      if (hasContingent === 'yes') {
        const conRaw = formData[`${p}ContingentBeneficiary` as keyof typeof formData] as string || '';
        const conOther = formData[`${p}ContingentBeneficiaryOther` as keyof typeof formData] as string || '';
        const conList = resolveBeneficiaryList(conRaw);
        const conDisplay = conRaw.split(',').includes('other') && conOther
          ? (conList ? `${conList} (Other: ${conOther})` : conOther)
          : conList;
        renderEstateRow('Contingent Beneficiary(ies):', conDisplay, `${p}_contingent`);
      }

      renderEstateRow('Location of the policy documentation:', formData[`${p}DocLocation` as keyof typeof formData] as string || '', `${p}_doclocation`);

      yPosition += 4;
      return true;
    };

    if (formData.client1HasCriticalIllnessInsurance === 'yes' || formData.client2HasCriticalIllnessInsurance === 'yes') {
      addPage();
      yPosition = 12;
      addSectionHeader('Critical Illness Insurance / Group Benefits');

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('The following critical illness insurance policies are held through employer or group benefits.', margin, yPosition);
      yPosition += 8;

      if (formData.client1HasCriticalIllnessInsurance === 'yes') {
        for (let i = 1; i <= MAX_CI_POLICIES_PDF; i++) {
          if (!renderCiPolicySection(ciClient1Name, 'client1', i)) break;
        }
      }

      if (hasSpouseForCI && formData.client2HasCriticalIllnessInsurance === 'yes') {
        for (let i = 1; i <= MAX_CI_POLICIES_PDF; i++) {
          if (!renderCiPolicySection(ciClient2Name, 'client2', i)) break;
        }
      }
    }
  }

  // ── Disability Insurance / Group Benefits ──
  {
    const hasSpouseForDI = (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law');
    const diClient1Name = formData.fullName || 'Client 1';
    const diClient2Name = formData.spouseName || 'Client 2';
    const MAX_DI_POLICIES_PDF = 4;

    const resolveDiInsuredPersonLabel = (val: string): string => {
      if (val === 'client1') return diClient1Name;
      if (val === 'client2') return diClient2Name;
      if (val === 'other') return 'Other';
      if (val.startsWith('child_')) {
        const idx = parseInt(val.replace('child_', ''));
        const children = (formData.childrenData as Array<Record<string, string>>) || [];
        return children[idx]?.name || `Child ${idx + 1}`;
      }
      if (val.startsWith('c1prevrel_')) {
        const idx = parseInt(val.replace('c1prevrel_', ''));
        const rels = (formData.client1PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      if (val.startsWith('c2prevrel_')) {
        const idx = parseInt(val.replace('c2prevrel_', ''));
        const rels = (formData.client2PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      return val;
    };

    const resolveDiPolicyOwnerLabel = (val: string): string => {
      if (val === 'client1') return diClient1Name;
      if (val === 'client2') return diClient2Name;
      if (val === 'other') return 'Other';
      if (val.startsWith('child_')) {
        const idx = parseInt(val.replace('child_', ''));
        const children = (formData.childrenData as Array<Record<string, string>>) || [];
        return children[idx]?.name || `Child ${idx + 1}`;
      }
      if (val.startsWith('corp_')) {
        const idx = parseInt(val.replace('corp_', ''));
        const corps = (formData.corporationsData as Array<Record<string, string>>) || [];
        return corps[idx]?.legalName || val;
      }
      if (val.startsWith('trust_')) {
        const t = parseInt(val.replace('trust_', ''));
        const trusts = formData.familyTrustsData || [];
        return trusts[t - 1]?.legalName || val;
      }
      if (val.startsWith('c1prevrel_')) {
        const idx = parseInt(val.replace('c1prevrel_', ''));
        const rels = (formData.client1PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      if (val.startsWith('c2prevrel_')) {
        const idx = parseInt(val.replace('c2prevrel_', ''));
        const rels = (formData.client2PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      return val;
    };

    const resolveDiBeneficiaryList = (raw: string): string => {
      if (!raw) return '';
      const arr = Array.isArray(raw) ? raw : raw.split(',');
      const labels = arr.map((v: string) => resolveDiPolicyOwnerLabel(v.trim())).filter(Boolean);
      return labels.join(', ');
    };

    const diCoverageEndLabel = (val: string): string => {
      if (val === 'retirement') return 'Retirement';
      if (val === 'job_change') return 'Job change';
      if (val === 'specific_date') return 'Specific date';
      return val;
    };

    const renderDiPolicySection = (
      clientName: string,
      clientPrefix: 'client1' | 'client2',
      policyNum: number
    ): boolean => {
      const p = `${clientPrefix}DiPolicy${policyNum}`;
      const prevGate = policyNum === 1
        ? `${clientPrefix}HasDisabilityInsuranceEmployer`
        : `${clientPrefix}DiPolicy${policyNum - 1}HasAdditional`;

      if (formData[prevGate as keyof typeof formData] !== 'yes') return false;

      const insuredPerson = formData[`${p}InsuredPerson` as keyof typeof formData] as string || '';
      const hasAnyField = insuredPerson ||
        formData[`${p}Provider` as keyof typeof formData] ||
        formData[`${p}Employer` as keyof typeof formData] ||
        formData[`${p}CoverageAmount` as keyof typeof formData];
      if (!hasAnyField && policyNum > 1) return false;

      addSubsectionHeader(`${clientName} — Disability Insurance Policy ${policyNum}`);
      checkPageBreak(30);

      const insuredLabel = insuredPerson ? resolveDiInsuredPersonLabel(insuredPerson) : '';
      const insuredOther = formData[`${p}InsuredPersonOther` as keyof typeof formData] as string || '';
      renderEstateRow('Insured Person:', insuredPerson === 'other' ? insuredOther : insuredLabel, `${p}_insured`);

      const ownerVal = formData[`${p}PolicyOwner` as keyof typeof formData] as string || '';
      const ownerOther = formData[`${p}PolicyOwnerOther` as keyof typeof formData] as string || '';
      renderEstateRow('Policy Owner:', ownerVal === 'other' ? ownerOther : resolveDiPolicyOwnerLabel(ownerVal), `${p}_owner`);

      renderEstateRow('Insurance Provider:', formData[`${p}Provider` as keyof typeof formData] as string || '', `${p}_provider`);
      renderEstateRow('Employer (if applicable):', formData[`${p}Employer` as keyof typeof formData] as string || '', `${p}_employer`);
      renderEstateRow('Coverage Amount:', formData[`${p}CoverageAmount` as keyof typeof formData] as string || '', `${p}_amount`);

      const endType = formData[`${p}CoverageEndType` as keyof typeof formData] as string || '';
      const endDate = formData[`${p}CoverageEndDate` as keyof typeof formData] as string || '';
      renderEstateRow('Coverage End:', endType === 'specific_date' && endDate ? endDate : diCoverageEndLabel(endType), `${p}_end`);

      renderEstateRow('Purpose:', formData[`${p}Purpose` as keyof typeof formData] as string || '', `${p}_purpose`);

      const benRaw = formData[`${p}Beneficiary` as keyof typeof formData] as string || '';
      const benOther = formData[`${p}BeneficiaryOther` as keyof typeof formData] as string || '';
      const benList = resolveDiBeneficiaryList(benRaw);
      const benDisplay = benRaw.split(',').includes('other') && benOther
        ? (benList ? `${benList} (Other: ${benOther})` : benOther)
        : benList;
      renderEstateRow('Beneficiary(ies):', benDisplay, `${p}_beneficiary`);

      const hasContingent = formData[`${p}HasContingentBeneficiaries` as keyof typeof formData] as string || '';
      renderEstateRow('Contingent Beneficiaries?', hasContingent === 'yes' ? 'Yes' : 'No', `${p}_hascontingent`);

      if (hasContingent === 'yes') {
        const conRaw = formData[`${p}ContingentBeneficiary` as keyof typeof formData] as string || '';
        const conOther = formData[`${p}ContingentBeneficiaryOther` as keyof typeof formData] as string || '';
        const conList = resolveDiBeneficiaryList(conRaw);
        const conDisplay = conRaw.split(',').includes('other') && conOther
          ? (conList ? `${conList} (Other: ${conOther})` : conOther)
          : conList;
        renderEstateRow('Contingent Beneficiary(ies):', conDisplay, `${p}_contingent`);
      }

      renderEstateRow('Location of the policy documentation:', formData[`${p}DocLocation` as keyof typeof formData] as string || '', `${p}_doclocation`);

      yPosition += 4;
      return true;
    };

    if (formData.client1HasDisabilityInsuranceEmployer === 'yes' || formData.client2HasDisabilityInsuranceEmployer === 'yes') {
      addPage();
      yPosition = 12;
      addSectionHeader('Disability Insurance / Group Benefits');

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('The following disability insurance policies are held through employer or group benefits.', margin, yPosition);
      yPosition += 8;

      if (formData.client1HasDisabilityInsuranceEmployer === 'yes') {
        for (let i = 1; i <= MAX_DI_POLICIES_PDF; i++) {
          if (!renderDiPolicySection(diClient1Name, 'client1', i)) break;
        }
      }

      if (hasSpouseForDI && formData.client2HasDisabilityInsuranceEmployer === 'yes') {
        for (let i = 1; i <= MAX_DI_POLICIES_PDF; i++) {
          if (!renderDiPolicySection(diClient2Name, 'client2', i)) break;
        }
      }
    }
  }

  // ── Personal Insurance (purchased outside work plans / employer benefits) ──
  {
    const hasSpouseForPI = (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law');
    const piClient1Name = formData.fullName || 'Client 1';
    const piClient2Name = formData.spouseName || 'Client 2';
    const MAX_PI_POLICIES_PDF = 4;

    const resolveInsuredPersonLabel = (val: string, c1: string, c2: string): string => {
      if (val === 'client1') return c1;
      if (val === 'client2') return c2;
      if (val === 'other') return 'Other';
      if (val.startsWith('child_')) {
        const idx = parseInt(val.replace('child_', ''));
        const children = (formData.childrenData as Array<Record<string, string>>) || [];
        return children[idx]?.name || `Child ${idx + 1}`;
      }
      if (val.startsWith('c1prevrel_')) {
        const idx = parseInt(val.replace('c1prevrel_', ''));
        const rels = (formData.client1PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      if (val.startsWith('c2prevrel_')) {
        const idx = parseInt(val.replace('c2prevrel_', ''));
        const rels = (formData.client2PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      return val;
    };

    const resolvePolicyOwnerLabel = (val: string, c1: string, c2: string): string => {
      if (val === 'client1') return c1;
      if (val === 'client2') return c2;
      if (val === 'other') return 'Other';
      if (val.startsWith('child_')) {
        const idx = parseInt(val.replace('child_', ''));
        const children = (formData.childrenData as Array<Record<string, string>>) || [];
        return children[idx]?.name || `Child ${idx + 1}`;
      }
      if (val.startsWith('corp_')) {
        const idx = parseInt(val.replace('corp_', ''));
        const corps = (formData.corporationsData as Array<Record<string, string>>) || [];
        return corps[idx]?.legalName || val;
      }
      if (val.startsWith('trust_')) {
        const t = parseInt(val.replace('trust_', ''));
        const trusts = formData.familyTrustsData || [];
        return trusts[t - 1]?.legalName || val;
      }
      if (val.startsWith('c1prevrel_')) {
        const idx = parseInt(val.replace('c1prevrel_', ''));
        const rels = (formData.client1PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      if (val.startsWith('c2prevrel_')) {
        const idx = parseInt(val.replace('c2prevrel_', ''));
        const rels = (formData.client2PreviousRelationshipsData as Array<Record<string, string>>) || [];
        return rels[idx]?.name || val;
      }
      return val;
    };

    const resolveBeneficiaryList = (raw: string, c1: string, c2: string): string => {
      if (!raw) return '';
      const arr = Array.isArray(raw) ? raw : raw.split(',');
      const labels = arr.map((v: string) => resolvePolicyOwnerLabel(v.trim(), c1, c2)).filter(Boolean);
      return labels.join(', ');
    };

    const coverageEndLabel = (val: string): string => {
      if (val === 'retirement') return 'Retirement';
      if (val === 'job_change') return 'Job change';
      if (val === 'specific_date') return 'Specific date';
      return val;
    };

    type PolicyType = 'Life' | 'Ci' | 'Di';

    const renderPersonalPolicySection = (
      clientName: string,
      clientPrefix: 'client1' | 'client2',
      policyNum: number,
      policyType: PolicyType,
      gateKey: string,
      policyKeyPrefix: string,
      sectionTitle: string
    ): boolean => {
      const p = `${policyKeyPrefix}${policyNum}`;
      const prevGate = policyNum === 1
        ? gateKey
        : `${policyKeyPrefix}${policyNum - 1}HasAdditional`;

      if (formData[prevGate as keyof typeof formData] !== 'yes') return false;

      const insuredPerson = formData[`${p}InsuredPerson` as keyof typeof formData] as string || '';
      const hasAnyField = insuredPerson ||
        formData[`${p}Provider` as keyof typeof formData] ||
        formData[`${p}CoverageAmount` as keyof typeof formData];
      if (!hasAnyField && policyNum > 1) return false;

      addSubsectionHeader(`${clientName} — ${sectionTitle} ${policyNum}`);
      checkPageBreak(30);

      const c1 = clientPrefix === 'client1' ? clientName : piClient1Name;
      const c2 = clientPrefix === 'client2' ? clientName : piClient2Name;

      const insuredLabel = insuredPerson ? resolveInsuredPersonLabel(insuredPerson, c1, c2) : '';
      const insuredOther = formData[`${p}InsuredPersonOther` as keyof typeof formData] as string || '';
      renderEstateRow('Insured Person:', insuredPerson === 'other' ? insuredOther : insuredLabel, `${p}_insured`);

      const ownerVal = formData[`${p}PolicyOwner` as keyof typeof formData] as string || '';
      const ownerOther = formData[`${p}PolicyOwnerOther` as keyof typeof formData] as string || '';
      renderEstateRow('Policy Owner:', ownerVal === 'other' ? ownerOther : resolvePolicyOwnerLabel(ownerVal, c1, c2), `${p}_owner`);

      renderEstateRow('Insurance Provider:', formData[`${p}Provider` as keyof typeof formData] as string || '', `${p}_provider`);
      renderEstateRow('Coverage Amount:', formData[`${p}CoverageAmount` as keyof typeof formData] as string || '', `${p}_amount`);

      const endType = formData[`${p}CoverageEndType` as keyof typeof formData] as string || '';
      const endDate = formData[`${p}CoverageEndDate` as keyof typeof formData] as string || '';
      renderEstateRow('Coverage End:', endType === 'specific_date' && endDate ? endDate : coverageEndLabel(endType), `${p}_end`);

      renderEstateRow('Purpose:', formData[`${p}Purpose` as keyof typeof formData] as string || '', `${p}_purpose`);

      const benRaw = formData[`${p}Beneficiary` as keyof typeof formData] as string || '';
      const benOther = formData[`${p}BeneficiaryOther` as keyof typeof formData] as string || '';
      const benList = resolveBeneficiaryList(benRaw, c1, c2);
      const benDisplay = benRaw.split(',').includes('other') && benOther
        ? (benList ? `${benList} (Other: ${benOther})` : benOther)
        : benList;
      renderEstateRow('Beneficiary(ies):', benDisplay, `${p}_beneficiary`);

      const hasContingent = formData[`${p}HasContingentBeneficiaries` as keyof typeof formData] as string || '';
      renderEstateRow('Contingent Beneficiaries?', hasContingent === 'yes' ? 'Yes' : 'No', `${p}_hascontingent`);

      if (hasContingent === 'yes') {
        const conRaw = formData[`${p}ContingentBeneficiary` as keyof typeof formData] as string || '';
        const conOther = formData[`${p}ContingentBeneficiaryOther` as keyof typeof formData] as string || '';
        const conList = resolveBeneficiaryList(conRaw, c1, c2);
        const conDisplay = conRaw.split(',').includes('other') && conOther
          ? (conList ? `${conList} (Other: ${conOther})` : conOther)
          : conList;
        renderEstateRow('Contingent Beneficiary(ies):', conDisplay, `${p}_contingent`);
      }

      renderEstateRow('Location of the policy documentation:', formData[`${p}DocLocation` as keyof typeof formData] as string || '', `${p}_doclocation`);

      yPosition += 4;
      return true;
    };

    const client1HasAnyPersonal = formData.client1HasLifeInsurancePersonal === 'yes' ||
      formData.client1HasCriticalIllnessInsurancePersonal === 'yes' ||
      formData.client1HasDisabilityInsurancePersonal === 'yes';
    const client2HasAnyPersonal = hasSpouseForPI && (
      formData.client2HasLifeInsurancePersonal === 'yes' ||
      formData.client2HasCriticalIllnessInsurancePersonal === 'yes' ||
      formData.client2HasDisabilityInsurancePersonal === 'yes'
    );

    if (client1HasAnyPersonal || client2HasAnyPersonal) {
      addPage();
      yPosition = 12;
      addSectionHeader('Personal Insurance');

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('The following insurance policies were purchased outside of work plans or employer benefits.', margin, yPosition);
      yPosition += 8;

      if (client1HasAnyPersonal) {
        addSubsectionHeader(`${piClient1Name} - Personal Insurance`);

        if (formData.client1HasLifeInsurancePersonal === 'yes') {
          for (let i = 1; i <= MAX_PI_POLICIES_PDF; i++) {
            if (!renderPersonalPolicySection(piClient1Name, 'client1', i, 'Life',
              'client1HasLifeInsurancePersonal', 'client1PersonalLifePolicy', 'Life Insurance Policy')) break;
          }
        }

        if (formData.client1HasCriticalIllnessInsurancePersonal === 'yes') {
          for (let i = 1; i <= MAX_PI_POLICIES_PDF; i++) {
            if (!renderPersonalPolicySection(piClient1Name, 'client1', i, 'Ci',
              'client1HasCriticalIllnessInsurancePersonal', 'client1PersonalCiPolicy', 'Critical Illness Policy')) break;
          }
        }

        if (formData.client1HasDisabilityInsurancePersonal === 'yes') {
          for (let i = 1; i <= MAX_PI_POLICIES_PDF; i++) {
            if (!renderPersonalPolicySection(piClient1Name, 'client1', i, 'Di',
              'client1HasDisabilityInsurancePersonal', 'client1PersonalDiPolicy', 'Disability Insurance Policy')) break;
          }
        }
      }

      if (client2HasAnyPersonal) {
        addSubsectionHeader(`${piClient2Name} - Personal Insurance`);

        if (formData.client2HasLifeInsurancePersonal === 'yes') {
          for (let i = 1; i <= MAX_PI_POLICIES_PDF; i++) {
            if (!renderPersonalPolicySection(piClient2Name, 'client2', i, 'Life',
              'client2HasLifeInsurancePersonal', 'client2PersonalLifePolicy', 'Life Insurance Policy')) break;
          }
        }

        if (formData.client2HasCriticalIllnessInsurancePersonal === 'yes') {
          for (let i = 1; i <= MAX_PI_POLICIES_PDF; i++) {
            if (!renderPersonalPolicySection(piClient2Name, 'client2', i, 'Ci',
              'client2HasCriticalIllnessInsurancePersonal', 'client2PersonalCiPolicy', 'Critical Illness Policy')) break;
          }
        }

        if (formData.client2HasDisabilityInsurancePersonal === 'yes') {
          for (let i = 1; i <= MAX_PI_POLICIES_PDF; i++) {
            if (!renderPersonalPolicySection(piClient2Name, 'client2', i, 'Di',
              'client2HasDisabilityInsurancePersonal', 'client2PersonalDiPolicy', 'Disability Insurance Policy')) break;
          }
        }
      }
    }

    const corporationsData = formData.corporationsData as Array<Record<string, string>> | undefined;
    const validCorps = (corporationsData || [])
      .map((c, i) => ({ corp: c, index: i }))
      .filter(({ corp }) => corp?.legalName?.trim());

    const corpHasAny = validCorps.some(({ corp, index }) => {
      const prefix = `corp${index + 1}`;
      return formData[`${prefix}HasLifeInsurance` as keyof typeof formData] === 'yes' ||
        formData[`${prefix}HasCriticalIllnessInsurance` as keyof typeof formData] === 'yes' ||
        formData[`${prefix}HasDisabilityInsurance` as keyof typeof formData] === 'yes';
    });

    if (corpHasAny) {
      addPage();
      yPosition = 12;
      addSectionHeader('Corporate Insurance');

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('The following insurance policies are owned by your corporation(s).', margin, yPosition);
      yPosition += 8;

      validCorps.forEach(({ corp, index }) => {
        const corpName = corp.legalName.trim();
        const prefix = `corp${index + 1}`;

        const hasLife = formData[`${prefix}HasLifeInsurance` as keyof typeof formData] === 'yes';
        const hasCi = formData[`${prefix}HasCriticalIllnessInsurance` as keyof typeof formData] === 'yes';
        const hasDi = formData[`${prefix}HasDisabilityInsurance` as keyof typeof formData] === 'yes';

        if (!hasLife && !hasCi && !hasDi) return;

        addSubsectionHeader(`${corpName} - Life Insurance Policies`);

        if (hasLife) {
          for (let i = 1; i <= MAX_PI_POLICIES_PDF; i++) {
            if (!renderPersonalPolicySection(corpName, 'client1', i, 'Life',
              `${prefix}HasLifeInsurance`, `${prefix}LifePolicy`, 'Life Insurance Policy')) break;
          }
        }

        if (hasCi) {
          for (let i = 1; i <= MAX_PI_POLICIES_PDF; i++) {
            if (!renderPersonalPolicySection(corpName, 'client1', i, 'Ci',
              `${prefix}HasCriticalIllnessInsurance`, `${prefix}CiPolicy`, 'Critical Illness Policy')) break;
          }
        }

        if (hasDi) {
          for (let i = 1; i <= MAX_PI_POLICIES_PDF; i++) {
            if (!renderPersonalPolicySection(corpName, 'client1', i, 'Di',
              `${prefix}HasDisabilityInsurance`, `${prefix}DiPolicy`, 'Disability Insurance Policy')) break;
          }
        }
      });
    }
  }

  addPage();
  yPosition = 12;
  addSectionHeader('Who is on your Team?');

  doc.setFontSize(9);
  doc.setTextColor(...colors.mediumGray);
  doc.text('Your Power(s) of Attorney and Estate Trustees should not act in a vacuum.', margin, yPosition);
  yPosition += 5;
  doc.text('This section lists the core professionals who already know your history.', margin, yPosition);
  yPosition += 8;
  doc.setTextColor(...colors.darkText);
  yPosition += 10;

  const hasSpouse = (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law');

  if (formData.client1HasWill === 'no' && (!hasSpouse || formData.client2HasWill === 'no')) {
    checkPageBreak(100);

    const clientsWithoutWill: string[] = [];
    if (formData.client1HasWill === 'no') {
      clientsWithoutWill.push(client1Name);
    }
    if (hasSpouse && formData.client2HasWill === 'no') {
      clientsWithoutWill.push(client2Name);
    }

    const clientNameText = clientsWithoutWill.join(' and ');

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Why Having a Will is Essential (${clientNameText} indicated they don't have one)`, margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const introText = `If you pass away without a valid Will, you are considered to have died "intestate." This creates several serious problems for your loved ones:`;
    const introLines = doc.splitTextToSize(introText, fieldWidth);
    introLines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 3;

    const bulletPoints = [
      { title: 'The Government Decides:', text: 'Instead of you choosing who gets your money and property, provincial laws follow a rigid formula to distribute your assets.' },
      { title: 'Loss of Control:', text: 'You lose the ability to choose your own executor. A court will appoint an administrator, and it may not be the person you would have wanted.' },
      { title: 'Higher Taxes:', text: 'Without a Will, you cannot use tax-planning strategies (like trusts) that help keep more money in your family\'s pockets rather than the government\'s.' },
      { title: 'Family Conflict:', text: 'Intestacy often leads to legal battles and arguments among family members who may disagree on who should get what.' },
      { title: 'Delays and Costs:', text: 'Settling an estate without a Will is much slower and more expensive, meaning your family has to wait longer to receive their inheritance.' }
    ];

    bulletPoints.forEach((bullet) => {
      checkPageBreak(15);
      doc.setFont(undefined, 'bold');
      doc.text('• ' + bullet.title, margin + 3, yPosition);
      yPosition += 5;

      doc.setFont(undefined, 'normal');
      const bulletLines = doc.splitTextToSize(bullet.text, fieldWidth - 6);
      bulletLines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, margin + 6, yPosition);
        yPosition += 5;
      });
      yPosition += 2;
    });

    yPosition += 8;

    const childrenData = formData.childrenData;
    const hasDependentChildren = childrenData && Array.isArray(childrenData) && childrenData.some((child: any) => child?.financiallyIndependent === 'no');

    if (hasDependentChildren) {
      checkPageBreak(100);

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Special Considerations for Minor or Dependent Children', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const introText = `${clientNameText}, you have children who are under the age of majority or who rely on you for support, a Will is your only way to protect them:`;
      const introLines = doc.splitTextToSize(introText, fieldWidth);
      introLines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 3;

      const childBulletPoints = [
        { title: 'Choosing a Guardian:', text: 'You can name a guardian (called a "tutor" in Quebec) to raise your children if both parents are gone. Without this, a judge will decide who takes your children.' },
        { title: 'Setting Up Trusts:', text: 'A Will allows you to create testamentary trusts. This means a trusted person manages the money for your kids so they don\'t receive a massive lump sum at age 18 or 19.' },
        { title: 'Staging Inheritances:', text: 'You can decide that your children receive their inheritance in stages (for example, some at age 25 and the rest at 30) rather than all at once.' },
        { title: 'Protecting Disability Benefits:', text: 'For children with special needs, you can set up a Henson Trust. This allows them to receive an inheritance without losing their government disability payments.' },
        { title: 'Keeping the Government Out:', text: 'If you don\'t have a Will, the Public Trustee may take control of your children\'s money until they turn 18, which can be very restrictive and costly.' }
      ];

      childBulletPoints.forEach((bullet) => {
        checkPageBreak(15);
        doc.setFont(undefined, 'bold');
        doc.text('• ' + bullet.title, margin + 3, yPosition);
        yPosition += 5;

        doc.setFont(undefined, 'normal');
        const bulletLines = doc.splitTextToSize(bullet.text, fieldWidth - 6);
        bulletLines.forEach((line: string) => {
          checkPageBreak(6);
          doc.text(line, margin + 6, yPosition);
          yPosition += 5;
        });
        yPosition += 2;
      });

      yPosition += 8;
    }
  } else if (formData.client1HasWill === 'yes' || formData.client2HasWill === 'yes') {
    const bothHaveWills = formData.client1HasWill === 'yes' && formData.client2HasWill === 'yes';

    // Mapper: read from currentWillData (authoritative) with fallback to legacy flat fields
    const currentWillData = formData.currentWillData as Record<string, unknown> | undefined;
    const willClients = (currentWillData?.['clients'] as Array<Record<string, unknown>>) || [];
    const findWillClient = (clientId: string) => willClients.find(c => c['clientId'] === clientId);
    const c1WillClient = findWillClient('client1');
    const c2WillClient = findWillClient('client2');
    const getDocBasics = (client: Record<string, unknown> | undefined) => (client?.['documentBasics'] as Record<string, unknown> | undefined);
    const c1DocBasics = getDocBasics(c1WillClient);
    const c2DocBasics = getDocBasics(c2WillClient);

    const c1WillYear = (c1DocBasics?.['willYear'] as string) || formData.client1WillYear || '';
    const c1WillLocation = (c1DocBasics?.['willLocation'] as string) || formData.client1WillLocation || '';
    const c1WillJurisdiction = (c1DocBasics?.['willJurisdiction'] as string) || formData.client1WillJurisdiction || '';
    const c1HasSecondaryWill = (c1DocBasics?.['hasSecondaryWill'] as string) || formData.client1HasSecondaryWill || '';
    const c1SecondaryWillLocation = (c1DocBasics?.['secondaryWillLocation'] as string) || formData.client1SecondaryWillLocation || '';
    const c1SecondaryWillJurisdiction = (c1DocBasics?.['secondaryWillJurisdiction'] as string) || formData.client1SecondaryWillJurisdiction || '';
    const c1HasMeaningfulChanges = (c1DocBasics?.['hasMeaningfulChanges'] as string) || formData.client1HasWillMeaningfulChanges || '';
    const c1MeaningfulChangesDetails = (c1DocBasics?.['meaningfulChangesDetails'] as string) || formData.client1WillMeaningfulChangesDetails || '';

    const c2WillYear = (c2DocBasics?.['willYear'] as string) || formData.client2WillYear || '';
    const c2WillLocation = (c2DocBasics?.['willLocation'] as string) || formData.client2WillLocation || '';
    const c2WillJurisdiction = (c2DocBasics?.['willJurisdiction'] as string) || formData.client2WillJurisdiction || '';
    const c2HasSecondaryWill = (c2DocBasics?.['hasSecondaryWill'] as string) || formData.client2HasSecondaryWill || '';
    const c2SecondaryWillLocation = (c2DocBasics?.['secondaryWillLocation'] as string) || formData.client2SecondaryWillLocation || '';
    const c2SecondaryWillJurisdiction = (c2DocBasics?.['secondaryWillJurisdiction'] as string) || formData.client2SecondaryWillJurisdiction || '';
    const c2HasMeaningfulChanges = (c2DocBasics?.['hasMeaningfulChanges'] as string) || formData.client2HasWillMeaningfulChanges || '';
    const c2MeaningfulChangesDetails = (c2DocBasics?.['meaningfulChangesDetails'] as string) || formData.client2WillMeaningfulChangesDetails || '';

    if (formData.client1HasWill === 'yes') {
      addSubsectionHeader(`${client1Name} — Will`);
      checkPageBreak(25);

      if (c1WillYear) {
        const currentYear = new Date().getFullYear();
        const willYear = parseInt(c1WillYear);
        const yearsOld = currentYear - willYear;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`${client1Name} has a Will, created in ${c1WillYear}.`, margin, yPosition);
        yPosition += 6;

        if (yearsOld >= 5) {
          checkPageBreak(40);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          const warningText = `${client1Name}, you indicated that your last Will was prepared in ${c1WillYear}. There is no specific number of years after which a Will legally expires, but many sources emphasize that an out-of-date Will can sometimes be worse than having no Will at all. Most legal professionals and financial advisors recommend that a Will and estate plan should be professionally reviewed at least every three to five years. Reviewing your Will at these intervals ensures that the document remains valid, reflects your current intentions, and complies with any evolving tax or succession laws.`;
          const warningLines = doc.splitTextToSize(warningText, fieldWidth);
          warningLines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }
      }
    }

    if (formData.client1HasWill === 'yes' && c1WillLocation) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`${client1Name}'s Will is located: ${c1WillLocation}`, margin, yPosition);
      yPosition += 6;
    }

    if (c1HasSecondaryWill === 'yes' && c1SecondaryWillLocation) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`${client1Name} has a secondary Will, and it is located: ${c1SecondaryWillLocation}`, margin, yPosition);
      yPosition += 6;
    }

    if (c1HasSecondaryWill === 'yes' && c1SecondaryWillJurisdiction) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`${client1Name}'s secondary Will was prepared in ${c1SecondaryWillJurisdiction}.`, margin, yPosition);
      yPosition += 6;
    }

    if (formData.client1HasWill === 'yes' && c1HasMeaningfulChanges === 'yes' && c1MeaningfulChangesDetails) {
      checkPageBreak(30);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const meaningfulChangesText = `${client1Name} indicated that they have had meaningful changes in their life. They indicated: ${c1MeaningfulChangesDetails} Based on the major changes, it is recommended that they update their Will, so that these changes and ${client1Name}'s wishes are up to date.`;
      const changesLines = doc.splitTextToSize(meaningfulChangesText, fieldWidth);
      changesLines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    } else if (formData.client1HasWill === 'yes' && c1HasMeaningfulChanges === 'no') {
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const noChangesText = `${client1Name} indicated that there have been no meaningful changes in their life, family, or financial situation that could affect their wishes.`;
      const noChangesLines = doc.splitTextToSize(noChangesText, fieldWidth);
      noChangesLines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    if (formData.client1HasWill === 'yes') {
      const childArrangements = (c1WillClient?.['childSpecificArrangements'] as Array<Record<string, unknown>>) || [];
      const hasHensonStyle = childArrangements.some(a => a['knownTypeName'] === 'henson_trust' && a['hasDifferentArrangement'] === 'yes');
      const hasDisabledChild = formData.childrenData && Array.isArray(formData.childrenData) &&
        formData.childrenData.some((child: any) => child?.disabled === 'yes');

      if (hasDisabledChild || hasHensonStyle) {
        checkPageBreak(30);

        const disabledChild = formData.childrenData?.find((child: any) => child?.disabled === 'yes');
        const disabledChildName = disabledChild?.name || 'their disabled child';

        if (hasHensonStyle) {
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.text(`${client1Name} indicated that they understand their Will to include a special arrangement (such as a Henson Trust) for ${disabledChildName}.`, margin, yPosition);
          yPosition += 6;

          checkPageBreak(100);

          doc.setFont(undefined, 'bold');
          doc.setFontSize(11);
          doc.text('Additional Reading - Absolute Discretionary Trusts ("Henson Trusts" in Ontario)', margin, yPosition);
          yPosition += 8;

          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);

          const hensonText = `A Henson Trust is a very important tool for families who have a child with a disability. It is what experts call an "absolute discretionary trust," which means the person you choose to manage the money (the trustee) has the final say on when and how much money is paid out. The big advantage of this structure is that the child does not legally own the assets and has no power to demand payments from the trust. This is key because most provincial government programs have strict limits on how much wealth a person can have before they lose their help; because the child doesn't "own" the trust money, it usually won't be counted against them, allowing them to keep their government disability benefits.

You should explore this as an option with your legal and CFP® professionals because if you simply leave money to a disabled child in a normal way, it could actually hurt them financially. Without a trust, an outright inheritance could push them over the asset limit, causing them to be disqualified from their monthly support check and other essentials like dental care and prescription drug coverage. A Henson Trust protects these benefits while still allowing the child to use the trust money for things that improve their quality of life, such as home care attendants or specialized medical equipment. It is a reliable way to ensure your loved one has financial security and is well taken care of even after you are gone.`;

          const hensonLines = doc.splitTextToSize(hensonText, fieldWidth);
          hensonLines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });

          yPosition += 10;
        }
      }
    }

    if (formData.client2HasWill === 'yes' && hasSpouse) {
      addSubsectionHeader(`${client2Name} — Will`);
      checkPageBreak(25);

      if (c2WillYear) {
        const currentYear = new Date().getFullYear();
        const willYear = parseInt(c2WillYear);
        const yearsOld = currentYear - willYear;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`${client2Name} has a Will, created in ${c2WillYear}.`, margin, yPosition);
        yPosition += 6;

        if (yearsOld >= 5) {
          checkPageBreak(40);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          const warningText = `${client2Name}, you indicated that your last Will was prepared in ${c2WillYear}. There is no specific number of years after which a Will legally expires, but many sources emphasize that an out-of-date Will can sometimes be worse than having no Will at all. Most legal professionals and financial advisors recommend that a Will and estate plan should be professionally reviewed at least every three to five years. Reviewing your Will at these intervals ensures that the document remains valid, reflects your current intentions, and complies with any evolving tax or succession laws.`;
          const warningLines = doc.splitTextToSize(warningText, fieldWidth);
          warningLines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }
      }

      if (c2WillJurisdiction) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`${client2Name}'s Will was prepared in: ${c2WillJurisdiction}`, margin, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 6;
      }
    }

    if (formData.client2HasWill === 'yes' && c2WillLocation && hasSpouse) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`${client2Name} has a Will, and it is located: ${c2WillLocation}`, margin, yPosition);
      yPosition += 6;
    }

    if (c2HasSecondaryWill === 'yes' && c2SecondaryWillLocation && hasSpouse) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`${client2Name} has a secondary Will, and it is located: ${c2SecondaryWillLocation}`, margin, yPosition);
      yPosition += 6;
    }

    if (c2HasSecondaryWill === 'yes' && c2SecondaryWillJurisdiction && hasSpouse) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`${client2Name}'s secondary Will was prepared in ${c2SecondaryWillJurisdiction}.`, margin, yPosition);
      yPosition += 6;
    }

    if (formData.client2HasWill === 'yes' && c2HasMeaningfulChanges === 'yes' && c2MeaningfulChangesDetails && hasSpouse) {
      checkPageBreak(30);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const meaningfulChangesText = `${client2Name} indicated that they have had meaningful changes in their life. They indicated: ${c2MeaningfulChangesDetails} Based on the major changes, it is recommended that they update their Will, so that these changes and ${client2Name}'s wishes are up to date.`;
      const changesLines = doc.splitTextToSize(meaningfulChangesText, fieldWidth);
      changesLines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    } else if (formData.client2HasWill === 'yes' && c2HasMeaningfulChanges === 'no' && hasSpouse) {
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const noChangesText = `${client2Name} indicated that there have been no meaningful changes in their life, family, or financial situation that could affect their wishes.`;
      const noChangesLines = doc.splitTextToSize(noChangesText, fieldWidth);
      noChangesLines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    if ((formData.client1HasWill === 'yes' && (c1WillJurisdiction || c1WillLocation)) ||
        (formData.client2HasWill === 'yes' && (c2WillJurisdiction || c2WillLocation) && hasSpouse)) {
      yPosition += 4;
    }

    // Blended Family & Prior Relationship Considerations
    const blendedWillData = formData.currentWillData as Record<string, unknown> | undefined;
    const willClientsForBlended = (blendedWillData?.['clients'] as Array<Record<string, unknown>>) || [];
    const allBlendedAnswers = willClientsForBlended.map(c => c['blendedFamilyAnswers'] as Record<string, unknown> | undefined).filter(Boolean);
    const hasBlendedContent = allBlendedAnswers.length > 0 && allBlendedAnswers.some(a => Object.keys(a).length > 0);
    const blendedFlags = (blendedWillData?.['blendedFamilyFlags'] as Array<Record<string, unknown>>) || [];

    if (hasBlendedContent || blendedFlags.length > 0) {
      checkPageBreak(30);
      addSubsectionHeader('Blended Family & Prior Relationship Considerations');
      checkPageBreak(20);

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      for (const blendedAns of allBlendedAnswers) {
        if (!blendedAns) continue;
        const clientId = blendedAns['clientId'] as string || 'client1';
        const clientDisplayName = clientId === 'client1' ? client1Name : client2Name;

        if (blendedAns['client1FirstDeathPassToSpouse']) {
          checkPageBreak(8);
          doc.text(`${clientDisplayName}: First death estate passes to spouse — ${blendedAns['client1FirstDeathPassToSpouse']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['client2FirstDeathPassToSpouse']) {
          checkPageBreak(8);
          doc.text(`${clientDisplayName}: First death estate passes to spouse — ${blendedAns['client2FirstDeathPassToSpouse']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['client1ChildProtectionIntent']) {
          checkPageBreak(8);
          doc.text(`${clientDisplayName}: Child protection intent — ${blendedAns['client1ChildProtectionIntent']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['client2ChildProtectionIntent']) {
          checkPageBreak(8);
          doc.text(`${clientDisplayName}: Child protection intent — ${blendedAns['client2ChildProtectionIntent']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['client1ProtectionMechanism']) {
          checkPageBreak(8);
          doc.text(`${clientDisplayName}: Protection mechanism — ${blendedAns['client1ProtectionMechanism']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['client2ProtectionMechanism']) {
          checkPageBreak(8);
          doc.text(`${clientDisplayName}: Protection mechanism — ${blendedAns['client2ProtectionMechanism']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['survivorControlUnderstanding']) {
          checkPageBreak(8);
          doc.text(`Survivor control understanding — ${blendedAns['survivorControlUnderstanding']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['remarriageConcern']) {
          checkPageBreak(8);
          doc.text(`Remarriage concern — ${blendedAns['remarriageConcern']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['currentWillAlignment']) {
          checkPageBreak(8);
          doc.text(`Domestic agreement alignment — ${blendedAns['currentWillAlignment']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['supportObligationAlignment']) {
          checkPageBreak(8);
          doc.text(`Support obligation alignment — ${blendedAns['supportObligationAlignment']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['treatChildrenSameWay']) {
          checkPageBreak(8);
          doc.text(`Treat children same way — ${blendedAns['treatChildrenSameWay']}`, margin, yPosition);
          yPosition += 6;
        }
        if (blendedAns['childrenTreatmentDifferences']) {
          checkPageBreak(12);
          const diffText = `Children treatment differences: ${blendedAns['childrenTreatmentDifferences']}`;
          const diffLines = doc.splitTextToSize(diffText, fieldWidth);
          diffLines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
        }
        if (blendedAns['mirrorWillRiskUnderstanding']) {
          checkPageBreak(8);
          doc.text(`Mirror will risk understanding — ${blendedAns['mirrorWillRiskUnderstanding']}`, margin, yPosition);
          yPosition += 6;
        }
      }

      if (blendedFlags.length > 0) {
        yPosition += 4;
        checkPageBreak(20);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Planning Review Items:', margin, yPosition);
        yPosition += 6;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);

        for (const flag of blendedFlags) {
          const severity = flag['severity'] as string;
          const title = flag['title'] as string;
          const observation = flag['observation'] as string;
          const severityLabel = severity === 'red' ? 'HIGH PRIORITY' : severity === 'yellow' ? 'REVIEW RECOMMENDED' : 'INFORMATIONAL';

          checkPageBreak(15);
          doc.setFont(undefined, 'bold');
          doc.text(`${severityLabel} — ${title}`, margin, yPosition);
          yPosition += 5;
          doc.setFont(undefined, 'normal');
          const obsLines = doc.splitTextToSize(observation, fieldWidth);
          obsLines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
          yPosition += 3;
        }
      }
    }
  }

  if (formData.client1HasPoaPersonalCare === 'yes') {
    const client1Name = formData.fullName || 'Client 1';
    const client2Name = formData.spouseName || 'Client 2';

    addSubsectionHeader(`${client1Name} — Power of Attorney for Personal Care`);
    checkPageBreak(40);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');

    if (formData.client1SpouseIsPoaPersonalCare === 'yes') {
      doc.text(`${client1Name}'s Power of Attorney for Personal Care:`, margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${client2Name} is the primary Power of Attorney for Personal Care.`, margin, yPosition);
      yPosition += 6;

      if (formData.client1PoaPersonalCareHasDocCopy) {
        const docCopyLabel =
          formData.client1PoaPersonalCareHasDocCopy === 'yes_on_file' ? 'Yes, on their files' :
          formData.client1PoaPersonalCareHasDocCopy === 'no_can_access' ? 'No, but they know how to access the document if/when necessary' :
          'No, this has not been discussed';
        doc.text(`Document copy status: ${docCopyLabel}`, margin, yPosition);
        yPosition += 6;
      }
    } else if (formData.spousesPoaPersonalCare === 'yes') {
      doc.text('Powers of Attorney for Personal Care:', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`(${client1Name}) and (${client2Name}), indicated that they are each other's Powers of Attorney for Personal Care.`, margin, yPosition);
      yPosition += 6;
    } else if (formData.client1PoaPersonalCareName) {
      doc.text(`${client1Name}'s Primary Power of Attorney for Personal Care:`, margin, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 6;

      {
        const poaLabelColW = 70;
        const poaValueColW = fieldWidth - poaLabelColW;
        const poaRowH = 8;
        const provinceLabels: Record<string, string> = {
          alberta: 'Alberta', british_columbia: 'British Columbia', manitoba: 'Manitoba',
          new_brunswick: 'New Brunswick', newfoundland_labrador: 'Newfoundland and Labrador',
          northwest_territories: 'Northwest Territories', nova_scotia: 'Nova Scotia',
          nunavut: 'Nunavut', ontario: 'Ontario', prince_edward_island: 'Prince Edward Island',
          quebec: 'Quebec', saskatchewan: 'Saskatchewan', yukon: 'Yukon'
        };
        let locationVal = '';
        if (formData.client1PoaPersonalCareProvince) {
          const pl = provinceLabels[formData.client1PoaPersonalCareProvince] || formData.client1PoaPersonalCareProvince;
          locationVal = formData.client1PoaPersonalCareCity ? `${formData.client1PoaPersonalCareCity}, ${pl}` : pl;
        } else if (formData.client1PoaPersonalCareCountry) {
          locationVal = formData.client1PoaPersonalCareCity ? `${formData.client1PoaPersonalCareCity}, ${formData.client1PoaPersonalCareCountry}` : formData.client1PoaPersonalCareCountry;
        }
        const docCopyVal = formData.client1PoaPersonalCareHasDocCopy === 'yes_on_file' ? 'Yes, on their files' :
          formData.client1PoaPersonalCareHasDocCopy === 'no_can_access' ? 'No, but they know how to access the document if/when necessary' :
          formData.client1PoaPersonalCareHasDocCopy ? 'No, this has not been discussed' : '';
        const c1PcRows: [string, string, string][] = [
          ['Name:', formData.client1PoaPersonalCareName || '', 'c1_poa_pc_name'],
          ['Phone:', formData.client1PoaPersonalCarePhone || '', 'c1_poa_pc_phone'],
          ['Email:', formData.client1PoaPersonalCareEmail || '', 'c1_poa_pc_email'],
          ['Relationship:', formData.client1PoaPersonalCareRelationship || '', 'c1_poa_pc_relationship'],
          ['Location:', locationVal, 'c1_poa_pc_location'],
          ['Document copy:', docCopyVal, 'c1_poa_pc_doc_copy'],
        ].filter(([, val]) => val) as [string, string, string][];
        c1PcRows.forEach(([label, val, fieldName]) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const labelLines = doc.splitTextToSize(label, poaLabelColW - 3);
          const dynH = Math.max(poaRowH, labelLines.length * 5 + 3);
          checkPageBreak(dynH + 2);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, poaLabelColW, dynH, 'FD');
          doc.rect(margin + poaLabelColW, yPosition, poaValueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const fld = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          fld.fieldName = fieldName;
          fld.Rect = [margin + poaLabelColW + 0.5, yPosition + 0.5, poaValueColW - 1, dynH - 1];
          fld.fontSize = 9;
          fld.textColor = colors.darkText;
          fld.borderStyle = 'none';
          fld.value = val;
          doc.addField(fld);
          yPosition += dynH;
        });
        yPosition += 4;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('POA for Personal Care Type:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text('☐ Enduring/Continuing   ☐ Springing', margin + 55, yPosition);
      yPosition += 8;
    } else {
      doc.text(`${client1Name}'s Power of Attorney for Personal Care:`, margin, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 8;
    }

    if (formData.client1HasContingentPoaPersonalCare === 'no') {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Alternate Power(s) of Attorney for Personal Care:', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${client1Name} indicated that they have not named alternate Power(s) of Attorney for Personal Care.`, margin, yPosition);
      yPosition += 10;
    } else if (formData.client1HasContingentPoaPersonalCare === 'yes' && formData.client1PoaPersonalCareCount) {
      const poaCount = parseInt(formData.client1PoaPersonalCareCount, 10);

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Alternate Power(s) of Attorney for Personal Care:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 8;

      const poaCellHeight = 6;
      const totalPoaRows = poaCount + (formData.spouseIsPoaPersonalCare === 'yes' ? 1 : 0);
      checkPageBreak(poaCellHeight + totalPoaRows * poaCellHeight + 4);
      const poaColWidths = [fieldWidth * 0.22, fieldWidth * 0.18, fieldWidth * 0.22, fieldWidth * 0.23, fieldWidth * 0.15];
      let poaTableY = yPosition;

      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...colors.darkText);

      const poaCol1X = margin;
      const poaCol2X = margin + poaColWidths[0];
      const poaCol3X = margin + poaColWidths[0] + poaColWidths[1];
      const poaCol4X = margin + poaColWidths[0] + poaColWidths[1] + poaColWidths[2];
      const poaCol5X = margin + poaColWidths[0] + poaColWidths[1] + poaColWidths[2] + poaColWidths[3];

      doc.rect(poaCol1X, poaTableY, poaColWidths[0], poaCellHeight, 'FD');
      doc.rect(poaCol2X, poaTableY, poaColWidths[1], poaCellHeight, 'FD');
      doc.rect(poaCol3X, poaTableY, poaColWidths[2], poaCellHeight, 'FD');
      doc.rect(poaCol4X, poaTableY, poaColWidths[3], poaCellHeight, 'FD');
      doc.rect(poaCol5X, poaTableY, poaColWidths[4], poaCellHeight, 'FD');

      doc.text('Name:', poaCol1X + 0.5, poaTableY + 4);
      doc.text('Phone Number:', poaCol2X + 0.5, poaTableY + 4);
      doc.text('Email Address:', poaCol3X + 0.5, poaTableY + 4);
      doc.text('Relationship to You:', poaCol4X + 0.5, poaTableY + 4);
      doc.text('Has Access to Documentation?', poaCol5X + 0.5, poaTableY + 4);

      poaTableY += poaCellHeight;

      if (formData.spouseIsPoaPersonalCare === 'yes') {

        doc.setDrawColor(...colors.tableBorder);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.setFont(undefined, 'normal');

        doc.rect(poaCol1X, poaTableY, poaColWidths[0], poaCellHeight, 'FD');
        doc.setFillColor(...colors.tableHeader);
        doc.rect(poaCol2X, poaTableY, poaColWidths[1], poaCellHeight, 'FD');
        doc.rect(poaCol3X, poaTableY, poaColWidths[2], poaCellHeight, 'FD');
        doc.rect(poaCol4X, poaTableY, poaColWidths[3], poaCellHeight, 'FD');
        doc.rect(poaCol5X, poaTableY, poaColWidths[4], poaCellHeight, 'FD');

        const spouseField1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        spouseField1.fieldName = 'poa_personal_care_spouse_name';
        spouseField1.Rect = [poaCol1X + 0.3, poaTableY + 0.3, poaColWidths[0] - 0.6, poaCellHeight - 0.6];
        spouseField1.fontSize = 7;
        spouseField1.textColor = [0, 0, 0];
        spouseField1.borderStyle = 'none';
        spouseField1.value = client2Name;
        doc.addField(spouseField1);

        const spouseField2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        spouseField2.fieldName = 'poa_personal_care_spouse_phone';
        spouseField2.Rect = [poaCol2X + 0.3, poaTableY + 0.3, poaColWidths[1] - 0.6, poaCellHeight - 0.6];
        spouseField2.fontSize = 7;
        spouseField2.textColor = [0, 0, 0];
        spouseField2.borderStyle = 'none';
        spouseField2.value = formData.spousePhone || '';
        doc.addField(spouseField2);

        const spouseField3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        spouseField3.fieldName = 'poa_personal_care_spouse_email';
        spouseField3.Rect = [poaCol3X + 0.3, poaTableY + 0.3, poaColWidths[2] - 0.6, poaCellHeight - 0.6];
        spouseField3.fontSize = 7;
        spouseField3.textColor = [0, 0, 0];
        spouseField3.borderStyle = 'none';
        spouseField3.value = formData.spouseEmail || '';
        doc.addField(spouseField3);

        const spouseField4 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        spouseField4.fieldName = 'poa_personal_care_spouse_relationship';
        spouseField4.Rect = [poaCol4X + 0.3, poaTableY + 0.3, poaColWidths[3] - 0.6, poaCellHeight - 0.6];
        spouseField4.fontSize = 7;
        spouseField4.textColor = [0, 0, 0];
        spouseField4.borderStyle = 'none';
        spouseField4.value = 'Spouse/Common Law Partner';
        doc.addField(spouseField4);

        const spouseField5 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        spouseField5.fieldName = 'poa_personal_care_spouse_providedcopy';
        spouseField5.Rect = [poaCol5X + 0.3, poaTableY + 0.3, poaColWidths[4] - 0.6, poaCellHeight - 0.6];
        spouseField5.fontSize = 7;
        spouseField5.textColor = [0, 0, 0];
        spouseField5.borderStyle = 'none';
        spouseField5.value = '';
        doc.addField(spouseField5);

        poaTableY += poaCellHeight;
      }

      for (let i = 0; i < poaCount; i++) {
        const poaData = formData.client1PoaPersonalCareData?.[i];

        doc.setDrawColor(...colors.tableBorder);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.setFont(undefined, 'normal');

        doc.rect(poaCol1X, poaTableY, poaColWidths[0], poaCellHeight, 'FD');
        doc.setFillColor(...colors.tableHeader);
        doc.rect(poaCol2X, poaTableY, poaColWidths[1], poaCellHeight, 'FD');
        doc.rect(poaCol3X, poaTableY, poaColWidths[2], poaCellHeight, 'FD');
        doc.rect(poaCol4X, poaTableY, poaColWidths[3], poaCellHeight, 'FD');
        doc.rect(poaCol5X, poaTableY, poaColWidths[4], poaCellHeight, 'FD');

        const field1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field1.fieldName = `poa_personal_care_${i}_name`;
        field1.Rect = [poaCol1X + 0.3, poaTableY + 0.3, poaColWidths[0] - 0.6, poaCellHeight - 0.6];
        field1.fontSize = 7;
        field1.textColor = [0, 0, 0];
        field1.borderStyle = 'none';
        field1.value = poaData?.name || '';
        doc.addField(field1);

        const field2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field2.fieldName = `poa_personal_care_${i}_phone`;
        field2.Rect = [poaCol2X + 0.3, poaTableY + 0.3, poaColWidths[1] - 0.6, poaCellHeight - 0.6];
        field2.fontSize = 7;
        field2.textColor = [0, 0, 0];
        field2.borderStyle = 'none';
        field2.value = poaData?.phone || '';
        doc.addField(field2);

        const field3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field3.fieldName = `poa_personal_care_${i}_email`;
        field3.Rect = [poaCol3X + 0.3, poaTableY + 0.3, poaColWidths[2] - 0.6, poaCellHeight - 0.6];
        field3.fontSize = 7;
        field3.textColor = [0, 0, 0];
        field3.borderStyle = 'none';
        field3.value = poaData?.email || '';
        doc.addField(field3);

        const field4 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field4.fieldName = `poa_personal_care_${i}_relationship`;
        field4.Rect = [poaCol4X + 0.3, poaTableY + 0.3, poaColWidths[3] - 0.6, poaCellHeight - 0.6];
        field4.fontSize = 7;
        field4.textColor = [0, 0, 0];
        field4.borderStyle = 'none';
        field4.value = poaData?.relationship || '';
        doc.addField(field4);

        const field5 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field5.fieldName = `poa_personal_care_${i}_providedcopy`;
        field5.Rect = [poaCol5X + 0.3, poaTableY + 0.3, poaColWidths[4] - 0.6, poaCellHeight - 0.6];
        field5.fontSize = 7;
        field5.textColor = [0, 0, 0];
        field5.borderStyle = 'none';
        field5.value = poaData?.providedCopy === 'yes_copy' ? 'Yes - they have a copy' :
                        poaData?.providedCopy === 'yes_instructions' ? 'Yes - instructions provided' :
                        poaData?.providedCopy === 'no' ? 'No' : '';
        doc.addField(field5);

        poaTableY += poaCellHeight;

        if (poaData?.country || poaData?.city) {
          if (poaTableY > 270) {
            addPage();
            poaTableY = 12;
          }

          doc.setFontSize(7);
          doc.setFont(undefined, 'italic');
          const residenceText = `   Residence: ${poaData?.country === 'Other' ? (poaData?.otherCountry || 'Unknown') : (poaData?.country || 'N/A')}${poaData?.country === 'Canada' && poaData?.province ? `, ${poaData.province}` : ''}${poaData?.city ? `, ${poaData.city}` : ''}`;
          doc.text(residenceText, poaCol1X, poaTableY + 4);
          poaTableY += 6;
        }
      }

      yPosition = poaTableY + 10;
    }

    if (formData.client1PoaPersonalCareDocLocation) {
      if (yPosition > 260) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Document Location:', margin, yPosition);
      yPosition += 6;

      doc.setFont(undefined, 'normal');
      const docLocationField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      docLocationField.fieldName = 'client1_poa_personal_care_doc_location';
      docLocationField.Rect = [margin, yPosition, fieldWidth, 8];
      docLocationField.fontSize = 9;
      docLocationField.textColor = [0, 0, 0];
      docLocationField.value = formData.client1PoaPersonalCareDocLocation || '';
      doc.addField(docLocationField);
      yPosition += 10;
    }

    if (formData.client1PoaPersonalCareHasDocCopy) {
      if (yPosition > 260) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const clientName = formData.fullName || 'The client';
      let docCopyText = '';
      if (formData.client1PoaPersonalCareHasDocCopy === 'yes_copy') {
        docCopyText = `${clientName} indicated that the Power(s) of Attorney for Personal Care have a copy of the most recent documentation in their files.`;
      } else if (formData.client1PoaPersonalCareHasDocCopy === 'yes_instructions') {
        docCopyText = `${clientName} indicated that the Power(s) of Attorney for Personal Care have instructions on where/how to access the most recent documentation.`;
      } else if (formData.client1PoaPersonalCareHasDocCopy === 'no') {
        docCopyText = `${clientName} indicated that the Power(s) of Attorney for Personal Care do not have access to the most recent documentation.`;
      }
      const docCopyLines = doc.splitTextToSize(docCopyText, fieldWidth);
      doc.text(docCopyLines, margin, yPosition);
      yPosition += docCopyLines.length * 5 + 5;
    }
  }

  if (formData.client1HasLivingWill === 'yes') {
    if (yPosition > 260) {
      addPage();
      yPosition = 12;
    }

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const clientName = formData.fullName || 'The client';
    const livingWillText = `Note that ${clientName}'s Power of Attorney(ies) for Personal Care also have Living Will instructions.`;
    const livingWillLines = doc.splitTextToSize(livingWillText, fieldWidth);
    doc.text(livingWillLines, margin, yPosition);
    yPosition += livingWillLines.length * 5 + 5;
  }

  if (formData.client2HasPoaPersonalCare === 'yes') {
    const client1Name = formData.fullName || 'Client 1';
    const client2Name = formData.spouseName || 'Client 2';

    addSubsectionHeader(`${client2Name} — Power of Attorney for Personal Care`);
    checkPageBreak(40);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');

    if (formData.client2SpouseIsPoaPersonalCare === 'yes') {
      doc.text(`${client2Name}'s Power of Attorney for Personal Care:`, margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${client1Name} is the primary Power of Attorney for Personal Care.`, margin, yPosition);
      yPosition += 6;

      if (formData.client2PoaPersonalCareHasDocCopy) {
        const docCopyLabel =
          formData.client2PoaPersonalCareHasDocCopy === 'yes_on_file' ? 'Yes, on their files' :
          formData.client2PoaPersonalCareHasDocCopy === 'no_can_access' ? 'No, but they know how to access the document if/when necessary' :
          'No, this has not been discussed';
        doc.text(`Document copy status: ${docCopyLabel}`, margin, yPosition);
        yPosition += 6;
      }
    } else if (formData.spousesPoaPersonalCare === 'yes') {
      doc.text(`${client2Name}'s Power of Attorney for Personal Care:`, margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`(Note: (${client1Name}) and (${client2Name}), are each other's primary POA for Personal Care)`, margin, yPosition);
      yPosition += 6;
    } else if (formData.client2PoaPersonalCareName) {
      doc.text(`${client2Name}'s Primary Power of Attorney for Personal Care:`, margin, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 6;

      {
        const poaLabelColW = 70;
        const poaValueColW = fieldWidth - poaLabelColW;
        const poaRowH = 8;
        const provinceLabels: Record<string, string> = {
          alberta: 'Alberta', british_columbia: 'British Columbia', manitoba: 'Manitoba',
          new_brunswick: 'New Brunswick', newfoundland_labrador: 'Newfoundland and Labrador',
          northwest_territories: 'Northwest Territories', nova_scotia: 'Nova Scotia',
          nunavut: 'Nunavut', ontario: 'Ontario', prince_edward_island: 'Prince Edward Island',
          quebec: 'Quebec', saskatchewan: 'Saskatchewan', yukon: 'Yukon'
        };
        let locationVal = '';
        if (formData.client2PoaPersonalCareProvince) {
          const pl = provinceLabels[formData.client2PoaPersonalCareProvince] || formData.client2PoaPersonalCareProvince;
          locationVal = formData.client2PoaPersonalCareCity ? `${formData.client2PoaPersonalCareCity}, ${pl}` : pl;
        } else if (formData.client2PoaPersonalCareCountry) {
          locationVal = formData.client2PoaPersonalCareCity ? `${formData.client2PoaPersonalCareCity}, ${formData.client2PoaPersonalCareCountry}` : formData.client2PoaPersonalCareCountry;
        }
        const docCopyVal = formData.client2PoaPersonalCareHasDocCopy === 'yes_on_file' ? 'Yes, on their files' :
          formData.client2PoaPersonalCareHasDocCopy === 'no_can_access' ? 'No, but they know how to access the document if/when necessary' :
          formData.client2PoaPersonalCareHasDocCopy ? 'No, this has not been discussed' : '';
        const c2PcRows: [string, string, string][] = [
          ['Name:', formData.client2PoaPersonalCareName || '', 'c2_poa_pc_name'],
          ['Phone:', formData.client2PoaPersonalCarePhone || '', 'c2_poa_pc_phone'],
          ['Email:', formData.client2PoaPersonalCareEmail || '', 'c2_poa_pc_email'],
          ['Relationship:', formData.client2PoaPersonalCareRelationship || '', 'c2_poa_pc_relationship'],
          ['Location:', locationVal, 'c2_poa_pc_location'],
          ['Document copy:', docCopyVal, 'c2_poa_pc_doc_copy'],
        ].filter(([, val]) => val) as [string, string, string][];
        c2PcRows.forEach(([label, val, fieldName]) => {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          const labelLines = doc.splitTextToSize(label, poaLabelColW - 3);
          const dynH = Math.max(poaRowH, labelLines.length * 5 + 3);
          checkPageBreak(dynH + 2);
          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, yPosition, poaLabelColW, dynH, 'FD');
          doc.rect(margin + poaLabelColW, yPosition, poaValueColW, dynH, 'FD');
          doc.setTextColor(...colors.darkText);
          doc.text(labelLines, margin + 2, yPosition + 5.5);
          const fld = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          fld.fieldName = fieldName;
          fld.Rect = [margin + poaLabelColW + 0.5, yPosition + 0.5, poaValueColW - 1, dynH - 1];
          fld.fontSize = 9;
          fld.textColor = colors.darkText;
          fld.borderStyle = 'none';
          fld.value = val;
          doc.addField(fld);
          yPosition += dynH;
        });
        yPosition += 4;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('POA for Personal Care Type:', margin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text('☐ Enduring/Continuing   ☐ Springing', margin + 55, yPosition);
      yPosition += 8;
    } else {
      doc.text(`${client2Name}'s Power of Attorney for Personal Care:`, margin, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 8;
    }
  }

  if (formData.client2HasContingentPoaPersonalCare === 'no') {
    const client2Name = formData.spouseName || 'Client 2';

    if (yPosition > 260) {
      addPage();
      yPosition = 12;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Alternate Power(s) of Attorney for Personal Care:', margin, yPosition);
    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${client2Name} indicated that they have not named alternate Power(s) of Attorney for Personal Care.`, margin, yPosition);
    yPosition += 10;
  } else if (formData.client2HasContingentPoaPersonalCare === 'yes' && formData.client2PoaPersonalCareCount) {
    const poaCount = parseInt(formData.client2PoaPersonalCareCount, 10);

    const poaCellHeight = 6;
    checkPageBreak(8 + poaCellHeight + poaCount * poaCellHeight + 4);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Alternate Power(s) of Attorney for Personal Care:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 8;

    const poaColWidths = [fieldWidth * 0.25, fieldWidth * 0.25, fieldWidth * 0.25, fieldWidth * 0.25];
    let poaTableY = yPosition;

    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkText);

    const poaCol1X = margin;
    const poaCol2X = margin + poaColWidths[0];
    const poaCol3X = margin + poaColWidths[0] + poaColWidths[1];
    const poaCol4X = margin + poaColWidths[0] + poaColWidths[1] + poaColWidths[2];

    doc.rect(poaCol1X, poaTableY, poaColWidths[0], poaCellHeight, 'FD');
    doc.rect(poaCol2X, poaTableY, poaColWidths[1], poaCellHeight, 'FD');
    doc.rect(poaCol3X, poaTableY, poaColWidths[2], poaCellHeight, 'FD');
    doc.rect(poaCol4X, poaTableY, poaColWidths[3], poaCellHeight, 'FD');

    doc.text('Name:', poaCol1X + 0.5, poaTableY + 4);
    doc.text('Phone Number:', poaCol2X + 0.5, poaTableY + 4);
    doc.text('Email Address:', poaCol3X + 0.5, poaTableY + 4);
    doc.text('Relationship to You:', poaCol4X + 0.5, poaTableY + 4);

    poaTableY += poaCellHeight;

    for (let i = 0; i < poaCount; i++) {
      const poaData = formData.client2PoaPersonalCareData?.[i];

      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.setFont(undefined, 'normal');

      doc.rect(poaCol1X, poaTableY, poaColWidths[0], poaCellHeight, 'FD');
      doc.setFillColor(...colors.tableHeader);
      doc.rect(poaCol2X, poaTableY, poaColWidths[1], poaCellHeight, 'FD');
      doc.rect(poaCol3X, poaTableY, poaColWidths[2], poaCellHeight, 'FD');
      doc.rect(poaCol4X, poaTableY, poaColWidths[3], poaCellHeight, 'FD');

      const field1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field1.fieldName = `poa_personal_care_client2_${i}_name`;
      field1.Rect = [poaCol1X + 0.3, poaTableY + 0.3, poaColWidths[0] - 0.6, poaCellHeight - 0.6];
      field1.fontSize = 7;
      field1.textColor = [0, 0, 0];
      field1.borderStyle = 'none';
      field1.value = poaData?.name || '';
      doc.addField(field1);

      const field2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field2.fieldName = `poa_personal_care_client2_${i}_phone`;
      field2.Rect = [poaCol2X + 0.3, poaTableY + 0.3, poaColWidths[1] - 0.6, poaCellHeight - 0.6];
      field2.fontSize = 7;
      field2.textColor = [0, 0, 0];
      field2.borderStyle = 'none';
      field2.value = poaData?.phone || '';
      doc.addField(field2);

      const field3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field3.fieldName = `poa_personal_care_client2_${i}_email`;
      field3.Rect = [poaCol3X + 0.3, poaTableY + 0.3, poaColWidths[2] - 0.6, poaCellHeight - 0.6];
      field3.fontSize = 7;
      field3.textColor = [0, 0, 0];
      field3.borderStyle = 'none';
      field3.value = poaData?.email || '';
      doc.addField(field3);

      const field4 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field4.fieldName = `poa_personal_care_client2_${i}_relationship`;
      field4.Rect = [poaCol4X + 0.3, poaTableY + 0.3, poaColWidths[3] - 0.6, poaCellHeight - 0.6];
      field4.fontSize = 7;
      field4.textColor = [0, 0, 0];
      field4.borderStyle = 'none';
      field4.value = poaData?.relationship || '';
      doc.addField(field4);

      poaTableY += poaCellHeight;

      if (poaData?.country || poaData?.city) {
        if (poaTableY > 270) {
          addPage();
          poaTableY = 12;
        }

        doc.setFontSize(7);
        doc.setFont(undefined, 'italic');
        const residenceText = `   Residence: ${poaData?.country === 'Other' ? (poaData?.otherCountry || 'Unknown') : (poaData?.country || 'N/A')}${poaData?.country === 'Canada' && poaData?.province ? `, ${poaData.province}` : ''}${poaData?.city ? `, ${poaData.city}` : ''}`;
        doc.text(residenceText, poaCol1X, poaTableY + 4);
        poaTableY += 6;
      }
    }

    yPosition = poaTableY + 10;

    if (formData.client2PoaPersonalCareDocLocation) {
      if (yPosition > 260) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Document Location:', margin, yPosition);
      yPosition += 6;

      doc.setFont(undefined, 'normal');
      const docLocationField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      docLocationField.fieldName = 'client2_poa_personal_care_doc_location';
      docLocationField.Rect = [margin, yPosition, fieldWidth, 8];
      docLocationField.fontSize = 9;
      docLocationField.textColor = [0, 0, 0];
      docLocationField.value = formData.client2PoaPersonalCareDocLocation || '';
      doc.addField(docLocationField);
      yPosition += 10;
    }

    if (formData.client2PoaPersonalCareHasDocCopy) {
      if (yPosition > 260) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const client2Name = formData.spouseName || 'Client 2';
      let docCopyText = '';
      if (formData.client2PoaPersonalCareHasDocCopy === 'yes_copy') {
        docCopyText = `${client2Name} indicated that the Power(s) of Attorney for Personal Care have a copy of the most recent documentation in their files.`;
      } else if (formData.client2PoaPersonalCareHasDocCopy === 'yes_instructions') {
        docCopyText = `${client2Name} indicated that the Power(s) of Attorney for Personal Care have instructions on where/how to access the most recent documentation.`;
      } else if (formData.client2PoaPersonalCareHasDocCopy === 'no') {
        docCopyText = `${client2Name} indicated that the Power(s) of Attorney for Personal Care do not have access to the most recent documentation.`;
      }
      const docCopyLines = doc.splitTextToSize(docCopyText, fieldWidth);
      doc.text(docCopyLines, margin, yPosition);
      yPosition += docCopyLines.length * 5 + 5;
    }

    if (formData.client2HasLivingWill === 'yes') {
      if (yPosition > 260) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const livingWillText = `Note that ${client2Name}'s Power of Attorney(ies) for Personal Care also have Living Will instructions.`;
      const livingWillLines = doc.splitTextToSize(livingWillText, fieldWidth);
      doc.text(livingWillLines, margin, yPosition);
      yPosition += livingWillLines.length * 5 + 5;
    }
  }

  // Additional Reading for Powers of Attorney for Personal Care
  if (formData.client1HasWill === 'yes') {
    if (yPosition > 150) {
      addPage();
      yPosition = 12;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Additional Reading - Powers of Attorney for Personal Care', margin, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    const poaReadingText = [
      'In Ontario, a Power of Attorney for Personal Care is a legal document that allows a person (the "grantor" or',
      '"Donor") to appoint someone they trust (the "attorney") to make decisions about their personal life and healthcare',
      'if they become mentally incapable of doing so themselves.',
      '',
      'The following outline details the legal framework in Ontario, responsibilities, and best practices for creating an',
      'effective plan.',
      ''
    ];

    poaReadingText.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 1
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('1. How does a Power of Attorney for Personal Care Come into Force?', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const section1Text = [
      'Unlike a Power of Attorney for Property, which can be effective immediately, a Power of Attorney for Personal',
      'Care is typically "springing" or "enduring"',
      '',
      '• Capacity Trigger: It generally only comes into effect when the grantor is determined to be mentally incapable',
      '  of making their own personal care decisions.',
      '• Defining Incapacity: A person is considered "incapable" if they can no longer understand information relevant',
      '  to making a personal care decision or appreciate the foreseeable consequences of a decision (or lack thereof).',
      '• Activation Mechanisms: To avoid ambiguity, the document can specify a triggering event, such as a functional',
      '  capacity assessment performed by a physician or another qualified person.',
      ''
    ];

    section1Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 2
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Responsibilities and Duties of the Attorney:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const section2Text = [
      'An attorney for personal care acts as a fiduciary, meaning they must act with the utmost good faith and always in',
      'the best interests of the grantor. Their specific responsibilities in Ontario include:',
      '',
      '• Healthcare and Treatment: Consenting to or refusing medical treatments, diagnostic tests, and surgical',
      '  procedures.',
      '• Living Arrangements: Deciding where the grantor lives, such as moving them into an assisted living facility or',
      '  nursing home.',
      '• Daily Quality of Life: Managing decisions regarding diet and nutrition, clothing, hygiene, and general safety.',
      '• Following Wishes: The attorney must follow any specific instructions or known wishes the grantor has expressed',
      '  while capable. If wishes are unknown, the attorney must act based on the grantor\'s known values and beliefs to',
      '  determine their best interests.',
      ''
    ];

    section2Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 3
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Revocation and Rescinding of the POA:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const section3Text = [
      'As long as the grantor remains mentally capable, they maintain full control over the status of their POA:',
      '',
      '• Revocation: The grantor can revoke a POA at any time by providing written notice to the attorney and any',
      '  relevant parties (such as doctors or financial institutions).',
      '• New Documents: Executing a new POA typically revokes any previous version unless the document explicitly',
      '  states that multiple POAs are intended to coexist.',
      '• Death: A POA automatically terminates upon the death of the grantor, at which point the Will becomes the',
      '  governing document.',
      '• Marital Status: In most jurisdictions, including Ontario, a POA in favour of a spouse is not automatically',
      '  revoked by separation or divorce, it must be explicitly rescinded by the grantor.',
      ''
    ];

    section3Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 4
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Best Practices for an Effective POA:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const section4Text = [
      'To ensure the attorney is in the best position to provide seamless care, the following practices are',
      'recommended:',
      '',
      '• Include a "Living Will": Also known as a personal directive, this document provides specific guidance on',
      '  end-of-life care, such as Do Not Resuscitate (DNR) orders or instructions regarding life support. This takes the',
      '  emotion burden off the attorney by documenting exactly what the grantor wants.',
      '• Choose a Competent Succession: Grantors should name a contingent or alternate attorney in case the primary',
      '  choice dies, becomes incapable, or is otherwise unable to act.',
      '• Address Residency and Availability: The attorney should ideally live in the same jurisdiction as the grantor to',
      '  avoid practical and regulatory challenges in giving instructions to local healthcare providers.',
      '• Selection and Communication: The attorney should be someone trustworthy and organized. It is essential to',
      '  discuss these roles with the intended attorney beforehand so they are not surprised by their responsibilities',
      '  during a crisis.',
      '• Strict Witnessing Rules: In Ontario, a POA is only valid if witnessed by people who do not have a conflict of',
      '  interest. A witness cannot be the attorney (or their spouse), the grantor\'s spouse, or a child of the grantor.'
    ];

    section4Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Check if any POA for Personal Care lives in a different location than the client
    const client1Province = formData.province;
    const client1Country = formData.country || 'Canada';
    const client2Province = formData.spouseProvince;
    const client2Country = formData.spouseCountry || (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law' ? 'Canada' : undefined);

    let hasGeographicConcern = false;

    // Check client1's POAs
    if (formData.client1PoaPersonalCareData && Array.isArray(formData.client1PoaPersonalCareData)) {
      for (const poa of formData.client1PoaPersonalCareData) {
        if (poa.country && poa.country !== client1Country) {
          hasGeographicConcern = true;
          break;
        }
        if (poa.country === 'Canada' && client1Country === 'Canada' && poa.province && poa.province !== client1Province) {
          hasGeographicConcern = true;
          break;
        }
      }
    }

    // Check client2's POAs if not already found
    if (!hasGeographicConcern && formData.client2PoaPersonalCareData && Array.isArray(formData.client2PoaPersonalCareData) && client2Country) {
      for (const poa of formData.client2PoaPersonalCareData) {
        if (poa.country && poa.country !== client2Country) {
          hasGeographicConcern = true;
          break;
        }
        if (poa.country === 'Canada' && client2Country === 'Canada' && poa.province && poa.province !== client2Province) {
          hasGeographicConcern = true;
          break;
        }
      }
    }

    // Add Geographic/Jurisdictional Concerns section if needed
    if (hasGeographicConcern) {
      yPosition += 4;

      doc.setFont(undefined, 'bold');
      if (yPosition > 270) {
        addPage();
        yPosition = 12;
      }
      doc.text('Geographic / Jurisdictional Concerns', margin, yPosition);
      yPosition += 6;

      doc.setFont(undefined, 'normal');
      const geoConcernText = [
        'It was indicated that a Power of Attorney for Personal Care resides in a different province, territory or',
        'country. If a Power of Attorney for Personal Care (POAPC) lives in a different province or country, practical',
        'and legal complications can arise when health decisions need to be made quickly. Health-care providers often',
        'prefer dealing with someone who can be physically present to consult with doctors, review care options, and',
        'sign documents. If the attorney cannot attend in person, it may slow decision-making or create communication',
        'gaps during critical moments. In some cases, institutions may be unfamiliar with out-of-province documents or',
        'require additional verification before accepting instructions, which can create delays in urgent care situations.',
        '',
        'To address this, many people structure their personal care powers of attorney with multiple layers of support.',
        'One option is appointing a local primary attorney for personal care who can be physically present with the',
        'patient and medical team. Another approach is naming co-attorneys, pairing a trusted local person with a family',
        'member who lives elsewhere so decisions can still reflect the broader family\'s wishes. Alternatively, the',
        'out-of-province person can remain the primary attorney while a local alternate attorney is named who can step',
        'in if distance becomes a barrier. This structure helps ensure that someone trusted, available, and familiar with',
        'the local healthcare system can act quickly if personal care decisions are required.'
      ];

      geoConcernText.forEach(line => {
        if (yPosition > 280) {
          addPage();
          yPosition = 12;
        }
        doc.text(line, margin, yPosition);
        yPosition += 4.5;
      });
    }

    yPosition += 12;
  }

  if (formData.client1HasPoaProperty === 'yes') {
    const client1Name = formData.fullName || 'Client 1';
    const client2Name = formData.spouseName || 'Client 2';

    addSubsectionHeader(`${client1Name} — Power of Attorney for Property`);

    if (yPosition > 230) {
      addPage();
      yPosition = 12;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');

    if (formData.spouseIsPoaProperty === 'yes') {
      doc.text(`${client1Name}'s Powers of Attorney for Property:`, margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${client1Name} indicated that ${client2Name} (spouse/common law partner) is their POA for Property.`, margin, yPosition);
      yPosition += 6;

      if (formData.spousePoaPropertyHasDocAccess) {
        const docAccessLabel =
          formData.spousePoaPropertyHasDocAccess === 'yes_copy' ? 'Yes - they have a copy' :
          formData.spousePoaPropertyHasDocAccess === 'yes_instructions' ? 'Yes - they have instructions on where/how to access the documentation' :
          'No';
        doc.text(`Does ${client2Name} have access to ${client1Name}'s most recent POA for Property documentation? ${docAccessLabel}`, margin, yPosition);
        yPosition += 6;
      }
    } else if (formData.spousesPoaProperty === 'yes') {
      doc.text('Powers of Attorney for Property:', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`(${client1Name}) and (${client2Name}), indicated that they are each other's Powers of Attorney for Property.`, margin, yPosition);
      yPosition += 6;
    } else {
      doc.text(`${client1Name}'s Powers of Attorney for Property:`, margin, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 8;
    }
  }

  if (formData.client1HasContingentPoaProperty === 'no') {
    const client1Name = formData.fullName || 'Client 1';

    if (yPosition > 260) {
      addPage();
      yPosition = 12;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Contingent Power(s) of Attorney:', margin, yPosition);
    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${client1Name} indicated that they have not named other or contingent Power(s) of Attorney for Property - consider updating this.`, margin, yPosition);
    yPosition += 10;
  } else if (formData.client1HasContingentPoaProperty === 'yes' && formData.client1PoaPropertyCount) {
    const poaPropertyCount = parseInt(formData.client1PoaPropertyCount, 10);

    if (yPosition > 210) {
      addPage();
      yPosition = 12;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Contingent Power(s) of Attorney:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 8;

    const poaPropertyCellHeight = 6;
    const poaPropertyColWidths = [fieldWidth * 0.25, fieldWidth * 0.2, fieldWidth * 0.27, fieldWidth * 0.28];
    let poaPropertyTableY = yPosition;

    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkText);

    const poaPropertyCol1X = margin;
    const poaPropertyCol2X = margin + poaPropertyColWidths[0];
    const poaPropertyCol3X = margin + poaPropertyColWidths[0] + poaPropertyColWidths[1];
    const poaPropertyCol4X = margin + poaPropertyColWidths[0] + poaPropertyColWidths[1] + poaPropertyColWidths[2];

    doc.rect(poaPropertyCol1X, poaPropertyTableY, poaPropertyColWidths[0], poaPropertyCellHeight, 'FD');
    doc.rect(poaPropertyCol2X, poaPropertyTableY, poaPropertyColWidths[1], poaPropertyCellHeight, 'FD');
    doc.rect(poaPropertyCol3X, poaPropertyTableY, poaPropertyColWidths[2], poaPropertyCellHeight, 'FD');
    doc.rect(poaPropertyCol4X, poaPropertyTableY, poaPropertyColWidths[3], poaPropertyCellHeight, 'FD');

    doc.text('Name:', poaPropertyCol1X + 0.5, poaPropertyTableY + 4);
    doc.text('Phone Number:', poaPropertyCol2X + 0.5, poaPropertyTableY + 4);
    doc.text('Email Address:', poaPropertyCol3X + 0.5, poaPropertyTableY + 4);
    doc.text('Relationship to You:', poaPropertyCol4X + 0.5, poaPropertyTableY + 4);

    poaPropertyTableY += poaPropertyCellHeight;

    for (let i = 0; i < poaPropertyCount; i++) {
      if (poaPropertyTableY > 275) {
        addPage();
        poaPropertyTableY = 12;
      }

      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.setFont(undefined, 'normal');

      doc.rect(poaPropertyCol1X, poaPropertyTableY, poaPropertyColWidths[0], poaPropertyCellHeight, 'FD');
      doc.setFillColor(...colors.tableHeader);
      doc.rect(poaPropertyCol2X, poaPropertyTableY, poaPropertyColWidths[1], poaPropertyCellHeight, 'FD');
      doc.rect(poaPropertyCol3X, poaPropertyTableY, poaPropertyColWidths[2], poaPropertyCellHeight, 'FD');
      doc.rect(poaPropertyCol4X, poaPropertyTableY, poaPropertyColWidths[3], poaPropertyCellHeight, 'FD');

      const poaPropertyData = formData.client1PoaPropertyData?.[i];

      const field1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field1.fieldName = `poa_property_${i}_name`;
      field1.Rect = [poaPropertyCol1X + 0.3, poaPropertyTableY + 0.3, poaPropertyColWidths[0] - 0.6, poaPropertyCellHeight - 0.6];
      field1.fontSize = 7;
      field1.textColor = [0, 0, 0];
      field1.borderStyle = 'none';
      field1.value = poaPropertyData?.name || '';
      doc.addField(field1);

      const field2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field2.fieldName = `poa_property_${i}_phone`;
      field2.Rect = [poaPropertyCol2X + 0.3, poaPropertyTableY + 0.3, poaPropertyColWidths[1] - 0.6, poaPropertyCellHeight - 0.6];
      field2.fontSize = 7;
      field2.textColor = [0, 0, 0];
      field2.borderStyle = 'none';
      field2.value = poaPropertyData?.phone || '';
      doc.addField(field2);

      const field3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field3.fieldName = `poa_property_${i}_email`;
      field3.Rect = [poaPropertyCol3X + 0.3, poaPropertyTableY + 0.3, poaPropertyColWidths[2] - 0.6, poaPropertyCellHeight - 0.6];
      field3.fontSize = 7;
      field3.textColor = [0, 0, 0];
      field3.borderStyle = 'none';
      field3.value = poaPropertyData?.email || '';
      doc.addField(field3);

      const field4 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field4.fieldName = `poa_property_${i}_relationship`;
      field4.Rect = [poaPropertyCol4X + 0.3, poaPropertyTableY + 0.3, poaPropertyColWidths[3] - 0.6, poaPropertyCellHeight - 0.6];
      field4.fontSize = 7;
      field4.textColor = [0, 0, 0];
      field4.borderStyle = 'none';
      field4.value = poaPropertyData?.relationship || '';
      doc.addField(field4);

      poaPropertyTableY += poaPropertyCellHeight;

      if (poaPropertyData?.country || poaPropertyData?.city) {
        if (poaPropertyTableY > 270) {
          addPage();
          poaPropertyTableY = 12;
        }

        doc.setFontSize(7);
        doc.setFont(undefined, 'italic');
        const residenceText = `   Residence: ${poaPropertyData?.country === 'Other' ? (poaPropertyData?.otherCountry || 'Unknown') : (poaPropertyData?.country || 'N/A')}${poaPropertyData?.country === 'Canada' && poaPropertyData?.province ? `, ${poaPropertyData.province}` : ''}${poaPropertyData?.city ? `, ${poaPropertyData.city}` : ''}`;
        doc.text(residenceText, poaPropertyCol1X, poaPropertyTableY + 4);
        poaPropertyTableY += 6;
      }
    }

    yPosition = poaPropertyTableY + 10;
  }

  if (formData.client1PoaPropertyHasDocCopy) {
    if (yPosition > 260) {
      addPage();
      yPosition = 12;
    }

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const client1Name = formData.fullName || 'The client';
    let docCopyText = '';
    if (formData.client1PoaPropertyHasDocCopy === 'yes_copy') {
      docCopyText = `${client1Name} indicated that the Power(s) of Attorney for Property have a copy of the most recent documentation in their files.`;
    } else if (formData.client1PoaPropertyHasDocCopy === 'yes_instructions') {
      docCopyText = `${client1Name} indicated that the Power(s) of Attorney for Property have instructions on where/how to access the most recent documentation.`;
    } else if (formData.client1PoaPropertyHasDocCopy === 'no') {
      docCopyText = `${client1Name} indicated that the Power(s) of Attorney for Property do not have access to the most recent documentation.`;
    }
    const docCopyLines = doc.splitTextToSize(docCopyText, fieldWidth);
    doc.text(docCopyLines, margin, yPosition);
    yPosition += docCopyLines.length * 5 + 10;
  }

  if (formData.client2HasPoaProperty === 'yes') {
    const client2Name = formData.spouseName || 'Client 2';

    addSubsectionHeader(`${client2Name} — Power of Attorney for Property`);

    if (yPosition > 230) {
      addPage();
      yPosition = 12;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');

    if (formData.client2SpouseIsPoaProperty === 'yes') {
      const client1Name = formData.fullName || 'Client 1';
      doc.text(`${client2Name}'s Powers of Attorney for Property:`, margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`${client2Name} indicated that ${client1Name} (spouse/common law partner) is their POA for Property.`, margin, yPosition);
      yPosition += 6;

      if (formData.client2SpousePoaPropertyHasDocAccess) {
        const docAccessLabel =
          formData.client2SpousePoaPropertyHasDocAccess === 'yes_copy' ? 'Yes - they have a copy' :
          formData.client2SpousePoaPropertyHasDocAccess === 'yes_instructions' ? 'Yes - they have instructions on where/how to access the documentation' :
          'No';
        doc.text(`Does ${client1Name} have access to ${client2Name}'s most recent POA for Property documentation? ${docAccessLabel}`, margin, yPosition);
        yPosition += 6;
      }
    } else if (formData.spousesPoaProperty === 'yes') {
      const client1Name = formData.fullName || 'Client 1';
      doc.text(`${client2Name}'s Powers of Attorney for Property:`, margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`(Note: (${client1Name}) and (${client2Name}), are each other's primary POA for Property)`, margin, yPosition);
      yPosition += 6;
    } else {
      doc.text(`${client2Name}'s Powers of Attorney for Property:`, margin, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 8;
    }
  }

  if (formData.client2HasContingentPoaProperty === 'no') {
    const client2Name = formData.spouseName || 'Client 2';

    if (yPosition > 260) {
      addPage();
      yPosition = 12;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Contingent Power(s) of Attorney:', margin, yPosition);
    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${client2Name} indicated that they have not named other or contingent Power(s) of Attorney for Property - consider updating this.`, margin, yPosition);
    yPosition += 10;
  } else if (formData.client2HasContingentPoaProperty === 'yes' && formData.client2PoaPropertyCount) {
    const poaPropertyCount = parseInt(formData.client2PoaPropertyCount, 10);

    if (yPosition > 210) {
      addPage();
      yPosition = 12;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Contingent Power(s) of Attorney:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 8;

    const poaPropertyCellHeight = 6;
    const poaPropertyColWidths = [fieldWidth * 0.25, fieldWidth * 0.2, fieldWidth * 0.27, fieldWidth * 0.28];
    let poaPropertyTableY = yPosition;

    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkText);

    const poaPropertyCol1X = margin;
    const poaPropertyCol2X = margin + poaPropertyColWidths[0];
    const poaPropertyCol3X = margin + poaPropertyColWidths[0] + poaPropertyColWidths[1];
    const poaPropertyCol4X = margin + poaPropertyColWidths[0] + poaPropertyColWidths[1] + poaPropertyColWidths[2];

    doc.rect(poaPropertyCol1X, poaPropertyTableY, poaPropertyColWidths[0], poaPropertyCellHeight, 'FD');
    doc.rect(poaPropertyCol2X, poaPropertyTableY, poaPropertyColWidths[1], poaPropertyCellHeight, 'FD');
    doc.rect(poaPropertyCol3X, poaPropertyTableY, poaPropertyColWidths[2], poaPropertyCellHeight, 'FD');
    doc.rect(poaPropertyCol4X, poaPropertyTableY, poaPropertyColWidths[3], poaPropertyCellHeight, 'FD');

    doc.text('Name:', poaPropertyCol1X + 0.5, poaPropertyTableY + 4);
    doc.text('Phone Number:', poaPropertyCol2X + 0.5, poaPropertyTableY + 4);
    doc.text('Email Address:', poaPropertyCol3X + 0.5, poaPropertyTableY + 4);
    doc.text('Relationship to You:', poaPropertyCol4X + 0.5, poaPropertyTableY + 4);

    poaPropertyTableY += poaPropertyCellHeight;

    for (let i = 0; i < poaPropertyCount; i++) {
      if (poaPropertyTableY > 275) {
        addPage();
        poaPropertyTableY = 12;
      }

      const poaData = formData.client2PoaPropertyData?.[i];

      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.setFont(undefined, 'normal');

      doc.rect(poaPropertyCol1X, poaPropertyTableY, poaPropertyColWidths[0], poaPropertyCellHeight, 'FD');
      doc.setFillColor(...colors.tableHeader);
      doc.rect(poaPropertyCol2X, poaPropertyTableY, poaPropertyColWidths[1], poaPropertyCellHeight, 'FD');
      doc.rect(poaPropertyCol3X, poaPropertyTableY, poaPropertyColWidths[2], poaPropertyCellHeight, 'FD');
      doc.rect(poaPropertyCol4X, poaPropertyTableY, poaPropertyColWidths[3], poaPropertyCellHeight, 'FD');

      const field1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field1.fieldName = `poa_property_client2_${i}_name`;
      field1.Rect = [poaPropertyCol1X + 0.3, poaPropertyTableY + 0.3, poaPropertyColWidths[0] - 0.6, poaPropertyCellHeight - 0.6];
      field1.fontSize = 7;
      field1.textColor = [0, 0, 0];
      field1.borderStyle = 'none';
      field1.value = poaData?.name || '';
      doc.addField(field1);

      const field2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field2.fieldName = `poa_property_client2_${i}_phone`;
      field2.Rect = [poaPropertyCol2X + 0.3, poaPropertyTableY + 0.3, poaPropertyColWidths[1] - 0.6, poaPropertyCellHeight - 0.6];
      field2.fontSize = 7;
      field2.textColor = [0, 0, 0];
      field2.borderStyle = 'none';
      field2.value = poaData?.phone || '';
      doc.addField(field2);

      const field3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field3.fieldName = `poa_property_client2_${i}_email`;
      field3.Rect = [poaPropertyCol3X + 0.3, poaPropertyTableY + 0.3, poaPropertyColWidths[2] - 0.6, poaPropertyCellHeight - 0.6];
      field3.fontSize = 7;
      field3.textColor = [0, 0, 0];
      field3.borderStyle = 'none';
      field3.value = poaData?.email || '';
      doc.addField(field3);

      const field4 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field4.fieldName = `poa_property_client2_${i}_relationship`;
      field4.Rect = [poaPropertyCol4X + 0.3, poaPropertyTableY + 0.3, poaPropertyColWidths[3] - 0.6, poaPropertyCellHeight - 0.6];
      field4.fontSize = 7;
      field4.textColor = [0, 0, 0];
      field4.borderStyle = 'none';
      field4.value = poaData?.relationship || '';
      doc.addField(field4);

      poaPropertyTableY += poaPropertyCellHeight;

      if (poaData?.country || poaData?.city) {
        if (poaPropertyTableY > 270) {
          addPage();
          poaPropertyTableY = 12;
        }

        doc.setFontSize(7);
        doc.setFont(undefined, 'italic');
        const residenceText = `   Residence: ${poaData?.country === 'Other' ? (poaData?.otherCountry || 'Unknown') : (poaData?.country || 'N/A')}${poaData?.country === 'Canada' && poaData?.province ? `, ${poaData.province}` : ''}${poaData?.city ? `, ${poaData.city}` : ''}`;
        doc.text(residenceText, poaPropertyCol1X, poaPropertyTableY + 4);
        poaPropertyTableY += 6;
      }
    }

    yPosition = poaPropertyTableY + 10;

    if (formData.client2PoaPropertyDocLocation) {
      if (yPosition > 260) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Document Location:', margin, yPosition);
      yPosition += 6;

      doc.setFont(undefined, 'normal');
      const docLocationField = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      docLocationField.fieldName = 'client2_poa_property_doc_location';
      docLocationField.Rect = [margin, yPosition, fieldWidth, 8];
      docLocationField.fontSize = 9;
      docLocationField.textColor = [0, 0, 0];
      docLocationField.value = formData.client2PoaPropertyDocLocation || '';
      doc.addField(docLocationField);
      yPosition += 10;
    }

    if (formData.client2PoaPropertyHasDocCopy) {
      if (yPosition > 260) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const client2Name = formData.spouseName || 'Client 2';
      let docCopyText = '';
      if (formData.client2PoaPropertyHasDocCopy === 'yes_copy') {
        docCopyText = `${client2Name} indicated that the Power(s) of Attorney for Property have a copy of the most recent documentation in their files.`;
      } else if (formData.client2PoaPropertyHasDocCopy === 'yes_instructions') {
        docCopyText = `${client2Name} indicated that the Power(s) of Attorney for Property have instructions on where/how to access the most recent documentation.`;
      } else if (formData.client2PoaPropertyHasDocCopy === 'no') {
        docCopyText = `${client2Name} indicated that the Power(s) of Attorney for Property do not have access to the most recent documentation.`;
      }
      const docCopyLines = doc.splitTextToSize(docCopyText, fieldWidth);
      doc.text(docCopyLines, margin, yPosition);
      yPosition += docCopyLines.length * 5 + 10;
    }
  }

  // Additional Reading for Powers of Attorney for Property
  if (formData.client1HasWill === 'yes') {
    if (yPosition > 150) {
      addPage();
      yPosition = 12;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Additional Reading - Powers of Attorney for Property', margin, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    const poaPropertyReadingText = [
      'A Power of Attorney for Property (POAP) is a legal document in which one person (the "donor" or "grantor") grants',
      'another person or trust company (the "attorney") the authority to make decisions regarding their finances,',
      'property, and assets. Unlike a personal care directive which handles healthcare, the POAP is a fiduciary tool',
      'focused on maintaining the grantor\'s economic well-being.',
      '',
      'To position the attorney to successfully fulfil their role, the following breakdown outlines the legal requirements',
      'and best practices in Ontario:',
      ''
    ];

    poaPropertyReadingText.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 1: How a POA Comes into Force
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('How a POA Comes into Force:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const poaPropSection1Text = [
      'An attorney must understand precisely when their authority begins to avoid legal liability or administrative delays.',
      '',
      '• Immediate Effect: Unless the document specifies otherwise, the POADP takes effect immediately upon being',
      '  signed and witnessed. However, while the grantor remains capable, their decisions take precedence over the',
      '  attorney\'s.',
      '• Springing POA: A grantor may choose to have the power to "spring" into effect only upon a triggering event,',
      '  such as a formal finding of mental incapacity by a physician or a qualified capacity assessor.',
      '• Enduring (Continuing) Status: For a POA to be useful during a grantor\'s most vulnerable moments, it must be',
      '  "enduring" or "continuing." This requires a specific clause stating the power continues notwithstanding the',
      '  donor\'s loss of mental capacity. Without this clause, the attorney\'s power is extinguished exactly when it is',
      '  often needed most.',
      ''
    ];

    poaPropSection1Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 2: Responsibilities and Fiduciary Duties
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Responsibilities and Fiduciary Duties:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const poaPropSection2Text = [
      'The attorney is a fiduciary, meaning they are legally and ethically bound to act with utmost good faith and always',
      'in the best interests of the grantor.',
      '',
      '• Asset Management: The attorney is responsible for paying bills, managing investment accounts, collecting',
      '  income, and protecting the value of real property.',
      '• Standard of Care: The attorney must exercise a degree of care and skill that a "person of ordinary prudence"',
      '  would use. If the attorney is a professional (like an accountant or lawyer), they may be held to a higher',
      '  standard of care based on their expertise.',
      '• Recordkeeping: Attorneys have a strict duty to keep complete and accurate accounts of all transactions,',
      '  including receipts, disbursements, and investment statements.',
      ''
    ];

    poaPropSection2Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 3: Revocation and Termination
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Revocation and Termination:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const poaPropSection3Text = [
      'A Power of Attorney for Property remains valid until one of the following occurs:',
      '',
      '• Revocation: While the grantor is mentally capable, they may revoke the POA at any time by providing written',
      '  notice to the attorney and relevant third parties, such as banks.',
      '• Automatic Termination: The power terminates upon the death of the grantor (at which point the Will takes',
      '  over) or the death/incapacity of the attorney.',
      '• Relationship Breakdown: In most cases, separation or divorce does not automatically revoke a POA in favor of',
      '  a spouse; it must be explicitly rescinded or replaced by the grantor.',
      ''
    ];

    poaPropSection3Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 4: Best Practices for an Effective POA
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Best Practices for an Effective POA:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const poaPropSection4Text = [
      'To ensure the attorney is in the best position to care for the grantor, the following strategies should be',
      'implemented during the drafting phase:',
      '',
      '• Express Authority for Specific Tasks: Statutory law limits an attorney\'s power. If the grantor wants the',
      '  attorney to have the authority to delegate investment decisions to a professional manager, make charitable gifts,',
      '  or implement estate planning strategies (like an estate freeze), these powers must be explicitly granted in the',
      '  document.',
      '• Naming Contingents: To avoid a total loss of authority if the primary attorney is unable to act, grantors should',
      '  always name a substitute or alternate attorney.',
      '• Jurisdictional Residency: Ideally, the attorney should live in the same jurisdiction as the grantor. A',
      '  non-resident attorney may face compliance hurdles, such as an Ontario financial advisor being legally unable to',
      '  take investment instructions from an attorney residing in the U.S.',
      '• Avoiding Sham Situations: The grantor must genuinely understand that they are transferring control. If the',
      '  grantor retains informal control or has no real intention of losing control of the property, the trust or POA',
      '  arrangement could be ruled a "sham" and invalidated by a court.',
      '• Corporate Considerations: A POA allows an attorney to manage shares of a corporation but does not',
      '  automatically grant them a seat as a director. The attorney must use their voting power as a shareholder to elect',
      '  themselves (or another person) to the board.'
    ];

    poaPropSection4Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 12;
  }

  if (formData.client1HasEstateTrustee === 'yes' && formData.client1EstateTrusteeCount) {
    const estateTrusteeCount = parseInt(formData.client1EstateTrusteeCount, 10);
    const estateTrusteeData = formData.client1EstateTrusteeData || [];

    if (yPosition > 210) {
      addPage();
      yPosition = 12;
    }

    const client1Name = formData.fullName || 'Client 1';
    addSubsectionHeader(`${client1Name}'s Estate Trustees:`);

    const etCellHeight = 6;

    for (let i = 0; i < estateTrusteeCount; i++) {
      const trustee = estateTrusteeData[i] || {};
      const isCorporate = trustee.type === 'corporate';

      if (yPosition > 240) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.darkText);
      doc.text(`Estate Trustee #${i + 1}${isCorporate ? ' (Corporate Trustee)' : ' (Person)'}`, margin, yPosition);
      yPosition += 6;

      if (isCorporate) {
        const etColWidths = [fieldWidth * 0.3, fieldWidth * 0.7];
        let etTableY = yPosition;

        const labelCol = margin;
        const valueCol = margin + etColWidths[0];

        const fields = [
          { label: 'Trust Company Name:', key: 'companyName' },
          { label: 'Trust Company Address:', key: 'companyAddress' },
          { label: 'Key Contact Name:', key: 'contactName' },
          { label: 'Phone Number:', key: 'phone' },
          { label: 'Email:', key: 'email' },
          { label: 'Has Access to Documentation?', key: 'providedCopy' }
        ];

        fields.forEach((field, idx) => {
          if (etTableY > 275) {
            addPage();
            etTableY = 12;
          }

          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...colors.darkText);
          doc.rect(labelCol, etTableY, etColWidths[0], etCellHeight, 'FD');
          doc.text(field.label, labelCol + 0.5, etTableY + 4);

          doc.setFillColor(...colors.tableHeader);
          doc.rect(valueCol, etTableY, etColWidths[1], etCellHeight, 'FD');

          const fieldObj = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          fieldObj.fieldName = `estate_trustee_${i}_${field.key}`;
          fieldObj.Rect = [valueCol + 0.3, etTableY + 0.3, etColWidths[1] - 0.6, etCellHeight - 0.6];
          fieldObj.fontSize = 7;
          fieldObj.textColor = [0, 0, 0];
          fieldObj.borderStyle = 'none';
          const value = trustee[field.key as keyof typeof trustee] || '';
          fieldObj.value = field.key === 'providedCopy' ?
            (value === 'yes_copy' ? 'Yes - they have a copy' :
             value === 'yes_instructions' ? 'Yes - instructions provided' :
             value === 'no' ? 'No' : '') :
            String(value);
          doc.addField(fieldObj);

          etTableY += etCellHeight;
        });

        yPosition = etTableY + 8;
      } else {
        const etColWidths = [fieldWidth * 0.22, fieldWidth * 0.18, fieldWidth * 0.22, fieldWidth * 0.23, fieldWidth * 0.15];
        let etTableY = yPosition;

        const etCol1X = margin;
        const etCol2X = margin + etColWidths[0];
        const etCol3X = margin + etColWidths[0] + etColWidths[1];
        const etCol4X = margin + etColWidths[0] + etColWidths[1] + etColWidths[2];
        const etCol5X = margin + etColWidths[0] + etColWidths[1] + etColWidths[2] + etColWidths[3];

        doc.setDrawColor(...colors.tableBorder);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...colors.darkText);

        doc.rect(etCol1X, etTableY, etColWidths[0], etCellHeight, 'FD');
        doc.rect(etCol2X, etTableY, etColWidths[1], etCellHeight, 'FD');
        doc.rect(etCol3X, etTableY, etColWidths[2], etCellHeight, 'FD');
        doc.rect(etCol4X, etTableY, etColWidths[3], etCellHeight, 'FD');
        doc.rect(etCol5X, etTableY, etColWidths[4], etCellHeight, 'FD');

        doc.text('Name:', etCol1X + 0.5, etTableY + 4);
        doc.text('Phone Number:', etCol2X + 0.5, etTableY + 4);
        doc.text('Email Address:', etCol3X + 0.5, etTableY + 4);
        doc.text('Relationship:', etCol4X + 0.5, etTableY + 4);
        doc.text('Has Access to Documentation?', etCol5X + 0.5, etTableY + 4);

        etTableY += etCellHeight;

        if (etTableY > 275) {
          addPage();
          etTableY = 12;
        }

        doc.setDrawColor(...colors.tableBorder);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.setFont(undefined, 'normal');

        doc.rect(etCol1X, etTableY, etColWidths[0], etCellHeight, 'FD');
        doc.setFillColor(...colors.tableHeader);
        doc.rect(etCol2X, etTableY, etColWidths[1], etCellHeight, 'FD');
        doc.rect(etCol3X, etTableY, etColWidths[2], etCellHeight, 'FD');
        doc.rect(etCol4X, etTableY, etColWidths[3], etCellHeight, 'FD');
        doc.rect(etCol5X, etTableY, etColWidths[4], etCellHeight, 'FD');

        const field1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field1.fieldName = `estate_trustee_${i}_name`;
        field1.Rect = [etCol1X + 0.3, etTableY + 0.3, etColWidths[0] - 0.6, etCellHeight - 0.6];
        field1.fontSize = 7;
        field1.textColor = [0, 0, 0];
        field1.borderStyle = 'none';
        field1.value = trustee.name || '';
        doc.addField(field1);

        const field2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field2.fieldName = `estate_trustee_${i}_phone`;
        field2.Rect = [etCol2X + 0.3, etTableY + 0.3, etColWidths[1] - 0.6, etCellHeight - 0.6];
        field2.fontSize = 7;
        field2.textColor = [0, 0, 0];
        field2.borderStyle = 'none';
        field2.value = trustee.phone || '';
        doc.addField(field2);

        const field3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field3.fieldName = `estate_trustee_${i}_email`;
        field3.Rect = [etCol3X + 0.3, etTableY + 0.3, etColWidths[2] - 0.6, etCellHeight - 0.6];
        field3.fontSize = 7;
        field3.textColor = [0, 0, 0];
        field3.borderStyle = 'none';
        field3.value = trustee.email || '';
        doc.addField(field3);

        const field4 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field4.fieldName = `estate_trustee_${i}_relationship`;
        field4.Rect = [etCol4X + 0.3, etTableY + 0.3, etColWidths[3] - 0.6, etCellHeight - 0.6];
        field4.fontSize = 7;
        field4.textColor = [0, 0, 0];
        field4.borderStyle = 'none';
        field4.value = trustee.relationship || '';
        doc.addField(field4);

        const field5 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field5.fieldName = `estate_trustee_${i}_providedcopy`;
        field5.Rect = [etCol5X + 0.3, etTableY + 0.3, etColWidths[4] - 0.6, etCellHeight - 0.6];
        field5.fontSize = 7;
        field5.textColor = [0, 0, 0];
        field5.borderStyle = 'none';
        field5.value = trustee.providedCopy === 'yes_copy' ? 'Yes - they have a copy' :
                        trustee.providedCopy === 'yes_instructions' ? 'Yes - instructions provided' :
                        trustee.providedCopy === 'no' ? 'No' : '';
        doc.addField(field5);

        etTableY += etCellHeight;

        if (trustee.country || trustee.city) {
          if (etTableY > 270) {
            addPage();
            etTableY = 12;
          }

          doc.setFontSize(7);
          doc.setFont(undefined, 'italic');
          const residenceText = `   Residence: ${trustee.country === 'Other' ? (trustee.otherCountry || 'Unknown') : (trustee.country || 'N/A')}${trustee.country === 'Canada' && trustee.province ? `, ${trustee.province}` : ''}${trustee.city ? `, ${trustee.city}` : ''}`;
          doc.text(residenceText, etCol1X, etTableY + 4);
          etTableY += 6;
        }

        yPosition = etTableY + 8;
      }
    }

    yPosition += 2;

    const clientName = formData.fullName || 'The client';

    if (formData.client1EstateTrusteeKnowsWillLocation === 'yes') {
      if (yPosition > 260) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const knowsLocationText = `${clientName} indicated that their Estate Trustees know where to find/access the most recent copy of their Will.`;
      const knowsLocationLines = doc.splitTextToSize(knowsLocationText, fieldWidth);
      doc.text(knowsLocationLines, margin, yPosition);
      yPosition += knowsLocationLines.length * 5 + 5;
    } else if (formData.client1EstateTrusteeKnowsWillLocation === 'no') {
      if (yPosition > 240) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Recommended Action:', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const recommendedActionText = `${clientName} is advised to speak with their named Estate Trustees to show them the location of their most recent Will. Sharing this completed document with them is also advisable to make their jobs easier.`;
      const recommendedActionLines = doc.splitTextToSize(recommendedActionText, fieldWidth);
      doc.text(recommendedActionLines, margin, yPosition);
      yPosition += recommendedActionLines.length * 5 + 10;
    }
  }

  if (formData.client2HasEstateTrustee === 'yes' && formData.client2EstateTrusteeCount) {
    const etCount = parseInt(formData.client2EstateTrusteeCount, 10);
    const estateTrusteeData = formData.client2EstateTrusteeData || [];

    if (yPosition > 210) {
      addPage();
      yPosition = 12;
    }

    const client2Name = formData.spouseName || 'Client 2';
    addSubsectionHeader(`${client2Name}'s Estate Trustees:`);

    const etCellHeight = 6;

    for (let i = 0; i < etCount; i++) {
      const trustee = estateTrusteeData[i] || {};
      const isCorporate = trustee.type === 'corporate';

      if (yPosition > 240) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.darkText);
      doc.text(`Estate Trustee #${i + 1}${isCorporate ? ' (Corporate Trustee)' : ' (Person)'}`, margin, yPosition);
      yPosition += 6;

      if (isCorporate) {
        const etColWidths = [fieldWidth * 0.3, fieldWidth * 0.7];
        let etTableY = yPosition;

        const labelCol = margin;
        const valueCol = margin + etColWidths[0];

        const fields = [
          { label: 'Trust Company Name:', key: 'companyName' },
          { label: 'Trust Company Address:', key: 'companyAddress' },
          { label: 'Key Contact Name:', key: 'contactName' },
          { label: 'Phone Number:', key: 'phone' },
          { label: 'Email:', key: 'email' },
          { label: 'Has Access to Documentation?', key: 'providedCopy' }
        ];

        fields.forEach((field, idx) => {
          if (etTableY > 275) {
            addPage();
            etTableY = 12;
          }

          doc.setDrawColor(...colors.tableBorder);
          doc.setLineWidth(0.3);
          doc.setFillColor(255, 255, 255);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...colors.darkText);
          doc.rect(labelCol, etTableY, etColWidths[0], etCellHeight, 'FD');
          doc.text(field.label, labelCol + 0.5, etTableY + 4);

          doc.setFillColor(...colors.tableHeader);
          doc.rect(valueCol, etTableY, etColWidths[1], etCellHeight, 'FD');

          const fieldObj = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
          fieldObj.fieldName = `estate_trustee_client2_${i}_${field.key}`;
          fieldObj.Rect = [valueCol + 0.3, etTableY + 0.3, etColWidths[1] - 0.6, etCellHeight - 0.6];
          fieldObj.fontSize = 7;
          fieldObj.textColor = [0, 0, 0];
          fieldObj.borderStyle = 'none';
          fieldObj.value = trustee[field.key] || '';
          doc.addField(fieldObj);

          etTableY += etCellHeight;
        });

        yPosition = etTableY + 8;
      } else {
        const etColWidths = [fieldWidth * 0.22, fieldWidth * 0.18, fieldWidth * 0.22, fieldWidth * 0.23, fieldWidth * 0.15];
        let etTableY = yPosition;

        const etCol1X = margin;
        const etCol2X = margin + etColWidths[0];
        const etCol3X = margin + etColWidths[0] + etColWidths[1];
        const etCol4X = margin + etColWidths[0] + etColWidths[1] + etColWidths[2];
        const etCol5X = margin + etColWidths[0] + etColWidths[1] + etColWidths[2] + etColWidths[3];

        doc.setDrawColor(...colors.tableBorder);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...colors.darkText);

        doc.rect(etCol1X, etTableY, etColWidths[0], etCellHeight, 'FD');
        doc.rect(etCol2X, etTableY, etColWidths[1], etCellHeight, 'FD');
        doc.rect(etCol3X, etTableY, etColWidths[2], etCellHeight, 'FD');
        doc.rect(etCol4X, etTableY, etColWidths[3], etCellHeight, 'FD');
        doc.rect(etCol5X, etTableY, etColWidths[4], etCellHeight, 'FD');

        doc.text('Name:', etCol1X + 0.5, etTableY + 4);
        doc.text('Phone Number:', etCol2X + 0.5, etTableY + 4);
        doc.text('Email Address:', etCol3X + 0.5, etTableY + 4);
        doc.text('Relationship:', etCol4X + 0.5, etTableY + 4);
        doc.text('Has Access to Documentation?', etCol5X + 0.5, etTableY + 4);

        etTableY += etCellHeight;

        if (etTableY > 275) {
          addPage();
          etTableY = 12;
        }

        doc.setDrawColor(...colors.tableBorder);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.setFont(undefined, 'normal');

        doc.rect(etCol1X, etTableY, etColWidths[0], etCellHeight, 'FD');
        doc.setFillColor(...colors.tableHeader);
        doc.rect(etCol2X, etTableY, etColWidths[1], etCellHeight, 'FD');
        doc.rect(etCol3X, etTableY, etColWidths[2], etCellHeight, 'FD');
        doc.rect(etCol4X, etTableY, etColWidths[3], etCellHeight, 'FD');

        const field1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field1.fieldName = `estate_trustee_client2_${i}_name`;
        field1.Rect = [etCol1X + 0.3, etTableY + 0.3, etColWidths[0] - 0.6, etCellHeight - 0.6];
        field1.fontSize = 7;
        field1.textColor = [0, 0, 0];
        field1.borderStyle = 'none';
        field1.value = trustee?.name || '';
        doc.addField(field1);

        const field2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field2.fieldName = `estate_trustee_client2_${i}_phone`;
        field2.Rect = [etCol2X + 0.3, etTableY + 0.3, etColWidths[1] - 0.6, etCellHeight - 0.6];
        field2.fontSize = 7;
        field2.textColor = [0, 0, 0];
        field2.borderStyle = 'none';
        field2.value = trustee?.phone || '';
        doc.addField(field2);

        const field3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field3.fieldName = `estate_trustee_client2_${i}_email`;
        field3.Rect = [etCol3X + 0.3, etTableY + 0.3, etColWidths[2] - 0.6, etCellHeight - 0.6];
        field3.fontSize = 7;
        field3.textColor = [0, 0, 0];
        field3.borderStyle = 'none';
        field3.value = trustee?.email || '';
        doc.addField(field3);

        const field4 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field4.fieldName = `estate_trustee_client2_${i}_relationship`;
        field4.Rect = [etCol4X + 0.3, etTableY + 0.3, etColWidths[3] - 0.6, etCellHeight - 0.6];
        field4.fontSize = 7;
        field4.textColor = [0, 0, 0];
        field4.borderStyle = 'none';
        field4.value = trustee?.relationship || '';
        doc.addField(field4);

        etTableY += etCellHeight;

        if (trustee?.country || trustee?.city) {
          if (etTableY > 270) {
            addPage();
            etTableY = 12;
          }

          doc.setFontSize(7);
          doc.setFont(undefined, 'italic');
          const residenceText = `   Residence: ${trustee.country === 'Other' ? (trustee.otherCountry || 'Unknown') : (trustee.country || 'N/A')}${trustee.country === 'Canada' && trustee.province ? `, ${trustee.province}` : ''}${trustee.city ? `, ${trustee.city}` : ''}`;
          doc.text(residenceText, etCol1X, etTableY + 4);
          etTableY += 6;
        }

        yPosition = etTableY + 8;
      }
    }

    yPosition += 2;

    if (formData.client2EstateTrusteeKnowsWillLocation === 'yes') {
      if (yPosition > 240) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const knowsLocationText = `${client2Name} indicated that their Estate Trustees know where to find/access the most recent copy of their Will.`;
      const knowsLocationLines = doc.splitTextToSize(knowsLocationText, fieldWidth);
      doc.text(knowsLocationLines, margin, yPosition);
      yPosition += knowsLocationLines.length * 5 + 5;
    } else if (formData.client2EstateTrusteeKnowsWillLocation === 'no') {
      if (yPosition > 240) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Recommended Action:', margin, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const recommendedActionText = `${client2Name} is advised to speak with their named Estate Trustees to show them the location of their most recent Will. Sharing this completed document with them is also advisable to make their jobs easier.`;
      const recommendedActionLines = doc.splitTextToSize(recommendedActionText, fieldWidth);
      doc.text(recommendedActionLines, margin, yPosition);
      yPosition += recommendedActionLines.length * 5 + 10;
    }
  }

  // Additional Reading for Estate Trustees
  if (formData.client1HasWill === 'yes') {
    if (yPosition > 150) {
      addPage();
      yPosition = 12;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Additional Reading: Estate Trustees, Executors/Executrix, or Liquidators', margin, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('Estate Trustee (in Ontario, Executor/Executrix or Liquidator in other jurisdictions):', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const estateTrusteeIntroText = [
      'In Ontario, the term Estate Trustee is the specific designation of the individual or institution responsible for',
      'administering a deceased person\'s estate. If named in a Will, the role is officially called Estate Trustee with a',
      'Will. If the person died without a Will, the person appointed by the court is an Estate Trustee without a Will',
      '(formerly \'administrator\').',
      '',
      'The role is a significant fiduciary responsibility that requires settling the estate according to the deceased\'s wishes',
      'and provincial law.',
      ''
    ];

    estateTrusteeIntroText.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 1: Preliminary Duties and Probate
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Preliminary Duties and Probate:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const etSection1Text = [
      'The Estate Trustee\'s work begins immediately following the death.',
      '',
      '• Funeral and Proof of Death: They are responsible for arranging the funeral (unless family members have',
      '  already done so) and obtaining multiple original copies of the proof-of-death certificate from the funeral director',
      '  to provide to various institutions.',
      '• Obtaining a Certificate of Appointment: In Ontario, the process of \'probating\' a Will involves applying to the',
      '  court for a Certificate of Appointment of the Trustee with a Will. This document confirms the trustee\'s legal',
      '  authority to deal with assets like bank accounts and real estate.',
      '• Ontario Probate Taxes: Trustees must pay the Estate Administration Tax (probate tax) to the provincial',
      '  government. In Ontario, this is currently calculated as $15 for every $1,000 (or 1.5%) of the estate\'s value that',
      '  exceeds $50,000.',
      ''
    ];

    etSection1Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 2: Safeguarding and Valuing Assets
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Safeguarding and Valuing Assets:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const etSection2Text = [
      'The Trustee must act as a \'prudent investor\' to protect the estate\'s value.',
      '',
      '• Inventory: They must locate and prepare a comprehensive inventory of all assets (bank accounts, investments,',
      '  real estate and digital assets) and liabilities (debts, loans, and credit cards).',
      '• Protection: This includes changing locks on property, ensuring adequate insurance is in place for vacant homes',
      '  or stored vehicles, and sometimes managing a business for a period to prevent loss of value.',
      '• Estate Account: They should open a specific bank account to manage all incoming funds and pay the estate\'s',
      '  expenses and debts.',
      ''
    ];

    etSection2Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 3: Tax and Legal Obligations
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Tax and Legal Obligations:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const etSection3Text = [
      'Tax compliance is one of the most critical aspects of the role:',
      '',
      '• Filing Returns: The trustee must file the deceased\'s final (terminal) income tax return and potentially an',
      '  optional \'rights or things\' return. They may also need to file annual T3 Trust Returns for any income earned by',
      '  the estate after the date of death.',
      '• Clearance Certificate: Before distributing assets, the trustee should obtain a tax clearance certificate from the',
      '  CRA. This confirms all taxes are paid and relieves the trustee of personal liability for future tax claims.',
      ''
    ];

    etSection3Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 4: Distribution and Final Accounting
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Distribution and Final Accounting:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const etSection4Text = [
      '• Settling Claims: The trustee must advertise for creditors to identify potential claims and ensure all legitimate',
      '  debts are paid before beneficiaries receive anything.',
      '• Distribution: Once debts and taxes are satisfied, the trustee distributes specific bequests and the remaining',
      '  \'residue\' of the estate to the beneficiaries instructed by the Will.',
      '• Accounting and Releases: The final tax is providing an accounting of the estate to the beneficiaries, showing all',
      '  money received and spend. They should obtain signed releases from adult beneficiaries to waive their right to',
      '  sue the trustee in the future.',
      ''
    ];

    etSection4Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 2;

    // Section 5: Compensation
    doc.setFont(undefined, 'bold');
    if (yPosition > 270) {
      addPage();
      yPosition = 12;
    }
    doc.text('Compensation:', margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, 'normal');
    const etSection5Text = [
      'In Ontario, Estate Trustees are entitled to a \'fair and reasonable\' fee for their work, which typically ranges from',
      '3% to 5% of the gross value of the estate, depending on the complexity and time involved.',
      '',
      'Given the number of tasks involved, it is recommended that you select a person(s) or a professional trust company',
      'who is/are geographically close to where you currently reside.'
    ];

    etSection5Text.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 12;
  }

  // Funeral Arrangements Section
  const showFuneralSection =
    formData.client1HasFuneralArrangements === 'yes' ||
    formData.client1HasDiscussedFuneral === 'yes' ||
    formData.client2HasFuneralArrangements === 'yes' ||
    formData.client2HasDiscussedFuneral === 'yes';

  if (showFuneralSection) {
    if (yPosition > 210) {
      addPage();
      yPosition = 12;
    }

    addSubsectionHeader('Funeral and Cemetery Arrangements:');

    if (formData.client1HasFuneralArrangements === 'yes' || formData.client1HasDiscussedFuneral === 'yes') {
      doc.setFontSize(9);

      if (formData.client1HasFuneralArrangements === 'yes') {
        doc.text(`${client1Name} has made arrangements for Funeral and Cemetery services.`, margin, yPosition);
        yPosition += 5;

        doc.text('Document located at:', margin, yPosition);
        yPosition += 6;

        const boxHeight = 8;
        const boxY = yPosition;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, boxY, fieldWidth, boxHeight);

        const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field.fieldName = 'client1_funeral_arrangements_location';
        field.Rect = [margin + 0.5, boxY + 0.5, fieldWidth - 1, boxHeight - 1];
        field.fontSize = 8;
        field.textColor = [0, 0, 0];
        field.borderStyle = 'none';
        if (formData.client1FuneralArrangementsLocation) {
          field.value = formData.client1FuneralArrangementsLocation;
        }
        doc.addField(field);

        yPosition = boxY + boxHeight + 8;
      }

      if (formData.client1HasDiscussedFuneral === 'yes') {
        doc.text(`${client1Name} has discussed the type of funeral they would like.`, margin, yPosition);
        yPosition += 5;
      }

      if (formData.client1FuneralWrittenDown === 'yes') {
        doc.text('This information is written down and located:', margin, yPosition);
        yPosition += 6;

        const boxHeight = 8;
        const boxY = yPosition;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, boxY, fieldWidth, boxHeight);

        const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field.fieldName = 'client1_funeral_doc_location';
        field.Rect = [margin + 0.5, boxY + 0.5, fieldWidth - 1, boxHeight - 1];
        field.fontSize = 8;
        field.textColor = [0, 0, 0];
        field.borderStyle = 'none';
        if (formData.client1FuneralDocLocation) {
          field.value = formData.client1FuneralDocLocation;
        }
        doc.addField(field);

        yPosition = boxY + boxHeight + 8;
      } else {
        yPosition += 3;
      }
    }

    if ((formData.client2HasFuneralArrangements === 'yes' || formData.client2HasDiscussedFuneral === 'yes') && hasSpouse) {
      if (yPosition > 240) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(9);

      if (formData.client2HasFuneralArrangements === 'yes') {
        doc.text(`${client2Name} has made arrangements for Funeral and Cemetery services.`, margin, yPosition);
        yPosition += 5;

        doc.text('Document located at:', margin, yPosition);
        yPosition += 6;

        const boxHeight = 8;
        const boxY = yPosition;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, boxY, fieldWidth, boxHeight);

        const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field.fieldName = 'client2_funeral_arrangements_location';
        field.Rect = [margin + 0.5, boxY + 0.5, fieldWidth - 1, boxHeight - 1];
        field.fontSize = 8;
        field.textColor = [0, 0, 0];
        field.borderStyle = 'none';
        if (formData.client2FuneralArrangementsLocation) {
          field.value = formData.client2FuneralArrangementsLocation;
        }
        doc.addField(field);

        yPosition = boxY + boxHeight + 8;
      }

      if (formData.client2HasDiscussedFuneral === 'yes') {
        doc.text(`${client2Name} has communicated to loved ones what type of funeral they would like to have.`, margin, yPosition);
        yPosition += 5;
      }

      if (formData.client2FuneralWrittenDown === 'yes') {
        doc.text('This information is written down and stored at:', margin, yPosition);
        yPosition += 6;

        const boxHeight = 8;
        const boxY = yPosition;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, boxY, fieldWidth, boxHeight);

        const field = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
        field.fieldName = 'client2_funeral_doc_location';
        field.Rect = [margin + 0.5, boxY + 0.5, fieldWidth - 1, boxHeight - 1];
        field.fontSize = 8;
        field.textColor = [0, 0, 0];
        field.borderStyle = 'none';
        if (formData.client2FuneralDocLocation) {
          field.value = formData.client2FuneralDocLocation;
        }
        doc.addField(field);

        yPosition = boxY + boxHeight + 8;
      } else {
        yPosition += 3;
      }

      if (formData.client2HasDiscussedFuneral === 'no') {
        if (yPosition > 230) {
          addPage();
          yPosition = 12;
        }

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Action Item:', margin, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 5;

        const actionText = 'Discuss and document your wishes related to funeral or remembrance to help your loved ones honor you under your terms.';
        const wrappedActionText = doc.splitTextToSize(actionText, fieldWidth);
        wrappedActionText.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 4.5;
        });
        yPosition += 3;
      }
    }
  }

  // Financial Planner / Wealth Advisor section
  if (formData.fpHasAdvisor === 'yes') {
    if (yPosition > 200) {
      addPage();
      yPosition = 12;
    }

    const serviceLabels: Record<string, string> = {
      investments: 'Investments',
      retirement_planning: 'Retirement planning',
      insurance: 'Insurance',
      estate_planning: 'Estate planning',
      tax_planning: 'Tax planning',
      cash_flow: 'Cash flow',
      business_planning: 'Business planning',
      other: 'Other',
    };

    const renderAdvisorSection = (title: string, advisor: { firm?: string; name?: string; phone?: string; email?: string; website?: string; services?: string[] | string; duration?: string; includeInContactList?: string }, fieldPrefix: string) => {
      if (yPosition > 200) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 4;
      doc.setFontSize(8);
      doc.text('Contact details and scope of work for this professional.', margin, yPosition);
      yPosition += 6;

      const worksWithStr = (advisor as { worksWithClients?: string }).worksWithClients || (advisor as { worksWith?: string }).worksWith || '';
      const worksWithArr = worksWithStr ? worksWithStr.split(',') : [];
      const worksWithLabels = worksWithArr.map((c: string) => c === 'client1' ? client1Name : c === 'client2' ? client2Name : '').filter(Boolean);
      renderEstateRow('Works with:', worksWithLabels.join(', '), `${fieldPrefix}_workswith`);

      renderEstateRow('Firm:', advisor.firm || '', `${fieldPrefix}_firm`);
      renderEstateRow('Advisor Name:', advisor.name || '', `${fieldPrefix}_name`);
      renderEstateRow('Phone:', advisor.phone || '', `${fieldPrefix}_phone`);
      renderEstateRow('Email:', advisor.email || '', `${fieldPrefix}_email`);
      renderEstateRow('Website:', advisor.website || '', `${fieldPrefix}_website`);

      const servicesStr = Array.isArray(advisor.services) ? advisor.services.map(s => serviceLabels[s] || s).join(', ') : (advisor.services ? advisor.services.split(',').map((s: string) => serviceLabels[s.trim()] || s.trim()).join(', ') : '');
      renderEstateRow('Services Provided:', servicesStr, `${fieldPrefix}_services`);

      renderEstateRow('How Long Together:', advisor.duration || '', `${fieldPrefix}_duration`);
      renderEstateRow('Where are your documents stored?:', (advisor as { docLocation?: string }).docLocation || '', `${fieldPrefix}_doclocation`);
      renderEstateRow('Include in Contact List:', advisor.includeInContactList === 'yes' ? 'Yes' : advisor.includeInContactList === 'no' ? 'No' : '', `${fieldPrefix}_include`);
      yPosition += 6;
    };

    renderAdvisorSection('Financial Planner / Wealth Advisor:', {
      firm: formData.fpAdvisor1Firm,
      name: formData.fpAdvisor1Name,
      phone: formData.fpAdvisor1Phone,
      email: formData.fpAdvisor1Email,
      website: formData.fpAdvisor1Website,
      worksWith: formData.fpAdvisor1WorksWith,
      services: formData.fpAdvisor1Services,
      duration: formData.fpAdvisor1Duration,
      docLocation: formData.fpAdvisor1DocLocation,
      includeInContactList: formData.fpAdvisor1IncludeInContactList,
    }, 'fp_adv1');

    if (formData.fpAdvisor1IsCameronSmith && (formData.fpAdvisor2Name || formData.fpAdvisor2Firm)) {
      renderAdvisorSection('Financial Planner / Wealth Advisor — Second Advisor:', {
        firm: formData.fpAdvisor2Firm,
        name: formData.fpAdvisor2Name,
        phone: formData.fpAdvisor2Phone,
        email: formData.fpAdvisor2Email,
        website: formData.fpAdvisor2Website,
        worksWith: formData.fpAdvisor2WorksWith,
        services: formData.fpAdvisor2Services,
        duration: formData.fpAdvisor2Duration,
        includeInContactList: formData.fpAdvisor2IncludeInContactList,
      }, 'fp_adv2');
    }

    const additionalAdvisors = formData.fpAdditionalAdvisorsData || [];
    additionalAdvisors.forEach((advisor, i) => {
      renderAdvisorSection(`Financial Planner / Wealth Advisor — Additional #${i + 1}:`, advisor, `fp_adv${i + 3}`);
    });
  }

  // Accountant (CPA) section
  if (formData.acctHasAccountant === 'yes') {
    if (yPosition > 200) {
      addPage();
      yPosition = 12;
    }

    const acctServiceLabels: Record<string, string> = {
      personal_tax_returns: 'Personal tax returns',
      corporate_tax: 'Corporate tax',
      trust_tax_returns: 'Trust tax returns',
      bookkeeping: 'Bookkeeping',
      payroll: 'Payroll',
      estate_tax: 'Estate tax',
      other: 'Other',
    };

    const renderAccountantSection = (title: string, acct: { firm?: string; name?: string; phone?: string; email?: string; worksWithClients?: string; services?: string[] | string; duration?: string; includeInContactList?: string }, fieldPrefix: string) => {
      if (yPosition > 200) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin, yPosition);
      yPosition += 4;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text('Contact details and scope of work for this professional.', margin, yPosition);
      yPosition += 6;

      const worksWithRaw = (acct as { worksWithClients?: string; worksWith?: string[] | string }).worksWithClients || (acct as { worksWith?: string[] | string }).worksWith || '';
      const worksWithArr = Array.isArray(worksWithRaw) ? worksWithRaw : (worksWithRaw ? worksWithRaw.split(',') : []);
      const worksWithLabels = worksWithArr.map((c: string) => c === 'client1' ? client1Name : c === 'client2' ? client2Name : '').filter(Boolean);
      renderEstateRow('Works with:', worksWithLabels.join(', '), `${fieldPrefix}_workswith`);

      renderEstateRow('Firm:', acct.firm || '', `${fieldPrefix}_firm`);
      renderEstateRow('Accountant Name:', acct.name || '', `${fieldPrefix}_name`);
      renderEstateRow('Phone:', acct.phone || '', `${fieldPrefix}_phone`);
      renderEstateRow('Email:', acct.email || '', `${fieldPrefix}_email`);

      const servicesStr = Array.isArray(acct.services) ? acct.services.map(s => acctServiceLabels[s] || s).join(', ') : (acct.services ? acct.services.split(',').map((s: string) => acctServiceLabels[s.trim()] || s.trim()).join(', ') : '');
      renderEstateRow('Services Provided:', servicesStr, `${fieldPrefix}_services`);

      renderEstateRow('Years Together:', acct.duration || '', `${fieldPrefix}_duration`);
      renderEstateRow('Where are your documents stored?:', (acct as { docLocation?: string }).docLocation || '', `${fieldPrefix}_doclocation`);
      renderEstateRow('Include in Contact List:', acct.includeInContactList === 'yes' ? 'Yes' : acct.includeInContactList === 'no' ? 'No' : '', `${fieldPrefix}_include`);
      yPosition += 6;
    };

    renderAccountantSection('Accountant (CPA):', {
      firm: formData.acctAdvisor1Firm,
      name: formData.acctAdvisor1Name,
      phone: formData.acctAdvisor1Phone,
      email: formData.acctAdvisor1Email,
      worksWithClients: formData.acctAdvisor1WorksWith,
      services: formData.acctAdvisor1Services,
      duration: formData.acctAdvisor1Duration,
      docLocation: formData.acctAdvisor1DocLocation,
      includeInContactList: formData.acctAdvisor1IncludeInContactList,
    }, 'acct_adv1');

    const additionalAccountants = formData.acctAdditionalData || [];
    additionalAccountants.forEach((acct, i) => {
      renderAccountantSection(`Accountant (CPA) — Additional #${i + 1}:`, acct, `acct_adv${i + 2}`);
    });
  }

  // Lawyer section
  if (formData.lawHasLawyer === 'yes') {
    if (yPosition > 200) {
      addPage();
      yPosition = 12;
    }

    const lawServiceLabels: Record<string, string> = {
      wills_powers_of_attorney: 'Wills & Powers of Attorney',
      real_estate: 'Real estate',
      corporate_law: 'Corporate law',
      family_law: 'Family law',
      litigation: 'Litigation',
      other: 'Other',
    };

    const renderLawyerSection = (title: string, lawyer: { firm?: string; name?: string; phone?: string; email?: string; worksWithClients?: string; services?: string[] | string; duration?: string; docLocation?: string; includeInContactList?: string }, fieldPrefix: string) => {
      if (yPosition > 200) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin, yPosition);
      yPosition += 4;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text('Contact details and scope of work for this professional.', margin, yPosition);
      yPosition += 6;

      const worksWithRaw = (lawyer as { worksWithClients?: string; worksWith?: string[] | string }).worksWithClients || (lawyer as { worksWith?: string[] | string }).worksWith || '';
      const worksWithArr = Array.isArray(worksWithRaw) ? worksWithRaw : (worksWithRaw ? worksWithRaw.split(',') : []);
      const worksWithLabels = worksWithArr.map((c: string) => c === 'client1' ? client1Name : c === 'client2' ? client2Name : '').filter(Boolean);
      renderEstateRow('Works with:', worksWithLabels.join(', '), `${fieldPrefix}_workswith`);

      renderEstateRow('Firm:', lawyer.firm || '', `${fieldPrefix}_firm`);
      renderEstateRow('Lawyer Name:', lawyer.name || '', `${fieldPrefix}_name`);
      renderEstateRow('Phone:', lawyer.phone || '', `${fieldPrefix}_phone`);
      renderEstateRow('Email:', lawyer.email || '', `${fieldPrefix}_email`);

      const servicesStr = Array.isArray(lawyer.services) ? lawyer.services.map(s => lawServiceLabels[s] || s).join(', ') : (lawyer.services ? lawyer.services.split(',').map((s: string) => lawServiceLabels[s.trim()] || s.trim()).join(', ') : '');
      renderEstateRow('Services Provided:', servicesStr, `${fieldPrefix}_services`);

      renderEstateRow('Years Together:', lawyer.duration || '', `${fieldPrefix}_duration`);
      renderEstateRow('Where are your documents stored?:', lawyer.docLocation || '', `${fieldPrefix}_doclocation`);
      renderEstateRow('Include in Contact List:', lawyer.includeInContactList === 'yes' ? 'Yes' : lawyer.includeInContactList === 'no' ? 'No' : '', `${fieldPrefix}_include`);
      yPosition += 6;
    };

    renderLawyerSection('Lawyer:', {
      firm: formData.lawAdvisor1Firm,
      name: formData.lawAdvisor1Name,
      phone: formData.lawAdvisor1Phone,
      email: formData.lawAdvisor1Email,
      worksWithClients: formData.lawAdvisor1WorksWith,
      services: formData.lawAdvisor1Services,
      duration: formData.lawAdvisor1Duration,
      docLocation: formData.lawAdvisor1DocLocation,
      includeInContactList: formData.lawAdvisor1IncludeInContactList,
    }, 'law_adv1');

    const additionalLawyers = formData.lawAdditionalData || [];
    additionalLawyers.forEach((lawyer, i) => {
      renderLawyerSection(`Lawyer — Additional #${i + 1}:`, lawyer, `law_adv${i + 2}`);
    });
  }

  // Insurance section
  if (formData.insHasAdvisor && formData.insHasAdvisor !== 'na') {
    if (yPosition > 200) {
      addPage();
      yPosition = 12;
    }

    const insTypeLabels: Record<string, string> = {
      financial_planner: 'Financial Planner',
      insurance_advisor: 'Insurance Advisor',
      other: 'Other',
    };

    const insPolicyLabels: Record<string, string> = {
      life: 'Life Insurance',
      disability: 'Disability Insurance',
      critical_illness: 'Critical Illness Insurance',
      long_term_care: 'Long-Term Care Insurance',
      extended_health_dental: 'Extended Health & Dental',
      home: 'Home Insurance',
      condo: 'Condo Insurance',
      tenant: 'Tenant Insurance',
      auto: 'Auto Insurance',
      umbrella_liability: 'Umbrella Liability Insurance',
      motorcycle_boat_atv_rv: 'Motorcycle / Boat / ATV / RV Insurance',
      business: 'Business Insurance',
      professional_liability: 'Professional Liability Insurance',
      other: 'Other',
    };

    const renderInsuranceSection = (title: string, ins: { firm?: string; name?: string; phone?: string; email?: string; worksWithClients?: string; services?: string[] | string; duration?: string; docLocation?: string; includeInContactList?: string }, fieldPrefix: string) => {
      if (yPosition > 200) {
        addPage();
        yPosition = 12;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin, yPosition);
      yPosition += 4;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text('Contact details and insurance policies for this advisor.', margin, yPosition);
      yPosition += 6;

      const worksWithStr = ins.worksWithClients || '';
      const worksWithArr = worksWithStr ? worksWithStr.split(',') : [];
      const worksWithLabels = worksWithArr.map((c: string) => c === 'client1' ? client1Name : c === 'client2' ? client2Name : '').filter(Boolean);
      renderEstateRow('Works with:', worksWithLabels.join(', '), `${fieldPrefix}_workswith`);

      renderEstateRow('Firm:', ins.firm || '', `${fieldPrefix}_firm`);
      renderEstateRow('Advisor Name:', ins.name || '', `${fieldPrefix}_name`);
      renderEstateRow('Phone:', ins.phone || '', `${fieldPrefix}_phone`);
      renderEstateRow('Email:', ins.email || '', `${fieldPrefix}_email`);

      const servicesStr = Array.isArray(ins.services) ? ins.services.map(s => insPolicyLabels[s] || s).join(', ') : (ins.services ? ins.services.split(',').map((s: string) => insPolicyLabels[s.trim()] || s.trim()).join(', ') : '');
      renderEstateRow('Insurance Policies:', servicesStr, `${fieldPrefix}_services`);

      renderEstateRow('How Long Together:', ins.duration || '', `${fieldPrefix}_duration`);
      renderEstateRow('Where are your documents stored?:', ins.docLocation || '', `${fieldPrefix}_doclocation`);
      renderEstateRow('Include in Contact List:', ins.includeInContactList === 'yes' ? 'Yes' : ins.includeInContactList === 'no' ? 'No' : '', `${fieldPrefix}_include`);
      yPosition += 6;
    };

    renderEstateRow('Insurance Planning By:', insTypeLabels[formData.insHasAdvisor] || formData.insHasAdvisor, 'ins_type');

    renderInsuranceSection('Insurance:', {
      firm: formData.insAdvisor1Firm,
      name: formData.insAdvisor1Name,
      phone: formData.insAdvisor1Phone,
      email: formData.insAdvisor1Email,
      worksWithClients: formData.insAdvisor1WorksWith,
      services: formData.insAdvisor1Services,
      duration: formData.insAdvisor1Duration,
      docLocation: formData.insAdvisor1DocLocation,
      includeInContactList: formData.insAdvisor1IncludeInContactList,
    }, 'ins_adv1');

    if (formData.insHasAdditional === 'yes' && formData.insAdvisor2Name) {
      renderInsuranceSection('Insurance — Second Advisor:', {
        firm: formData.insAdvisor2Firm,
        name: formData.insAdvisor2Name,
        phone: formData.insAdvisor2Phone,
        email: formData.insAdvisor2Email,
        worksWithClients: formData.insAdvisor2WorksWith,
        services: formData.insAdvisor2Services,
        duration: formData.insAdvisor2Duration,
        docLocation: formData.insAdvisor2DocLocation,
        includeInContactList: formData.insAdvisor2IncludeInContactList,
      }, 'ins_adv2');
    }

    const additionalInsurance = formData.insAdditionalData || [];
    additionalInsurance.forEach((ins, i) => {
      renderInsuranceSection(`Insurance — Additional #${i + 1}:`, ins, `ins_adv${i + 2}`);
    });
  }

  // Health Professionals section
  if (yPosition > 200) {
    addPage();
    yPosition = 12;
  }
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Health Professionals', margin, yPosition);
  yPosition += 4;
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Health professionals involved in your care.', margin, yPosition);
  yPosition += 6;

  const renderHealthProRow = (label: string, value: string | undefined, fieldKey: string) => {
    renderEstateRow(label, value, fieldKey);
  };

  // Family Physician cards
  for (let idx = 0; idx < 5; idx++) {
    const name = formData[`fp_health_${idx}_name` as keyof typeof formData] as string;
    if (!name && idx > 0) break;
    if (!name && idx === 0) continue;
    if (yPosition > 200) { addPage(); yPosition = 12; }
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(idx === 0 ? 'Family Physician:' : `Family Physician — Additional #${idx}:`, margin, yPosition);
    yPosition += 5;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    renderHealthProRow('Name:', (formData[`fp_health_${idx}_name` as keyof typeof formData] as string) || '', `fp_health_${idx}_name`);
    const patientsList = (formData[`fp_health_${idx}_patients` as keyof typeof formData] as string[]) || [];
    if (patientsList.length > 0) {
      const c1NameFp = formData.fullName || 'Client 1';
      const c2NameFp = formData.spouseName || 'Client 2';
      const patientLabels = patientsList.map((p: string) => {
        if (p === 'client1') return c1NameFp;
        if (p === 'client2') return c2NameFp;
        if (p.startsWith('child:')) return p.slice(6);
        return p;
      });
      renderHealthProRow('Patients:', patientLabels.join(', '), `fp_health_${idx}_patients`);
    } else {
      renderHealthProRow('Patients:', '', `fp_health_${idx}_patients`);
    }
    renderHealthProRow('Clinic:', (formData[`fp_health_${idx}_clinic` as keyof typeof formData] as string) || '', `fp_health_${idx}_clinic`);
    renderHealthProRow('City:', (formData[`fp_health_${idx}_city` as keyof typeof formData] as string) || '', `fp_health_${idx}_city`);
    renderHealthProRow('Phone:', (formData[`fp_health_${idx}_phone` as keyof typeof formData] as string) || '', `fp_health_${idx}_phone`);
    yPosition += 4;
  }

  // Specialist cards
  if (formData.sp_health_has === 'yes') {
    for (let idx = 0; idx < 5; idx++) {
      const name = formData[`sp_health_${idx}_name` as keyof typeof formData] as string;
      if (!name && idx > 0) break;
      if (!name && idx === 0) continue;
      if (yPosition > 200) { addPage(); yPosition = 12; }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(idx === 0 ? 'Specialist:' : `Specialist — Additional #${idx}:`, margin, yPosition);
      yPosition += 5;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      renderHealthProRow('Name:', (formData[`sp_health_${idx}_name` as keyof typeof formData] as string) || '', `sp_health_${idx}_name`);
      const spPatientsList = (formData[`sp_health_${idx}_patients` as keyof typeof formData] as string[]) || [];
      const spPatientLabels = spPatientsList.map((p: string) => {
        if (p === 'client1') return formData.fullName || 'Client 1';
        if (p === 'client2') return formData.spouseName || 'Client 2';
        if (p.startsWith('child:')) return p.slice(6);
        return p;
      });
      renderHealthProRow('Patients:', spPatientLabels.join(', '), `sp_health_${idx}_patients`);
      renderHealthProRow('Specialty:', (formData[`sp_health_${idx}_specialty` as keyof typeof formData] as string) || '', `sp_health_${idx}_specialty`);
      renderHealthProRow('Phone:', (formData[`sp_health_${idx}_phone` as keyof typeof formData] as string) || '', `sp_health_${idx}_phone`);
      yPosition += 4;
    }
  }

  // Pharmacist cards
  for (let idx = 0; idx < 5; idx++) {
    const name = formData[`ph_health_${idx}_name` as keyof typeof formData] as string;
    if (!name && idx > 0) break;
    if (!name && idx === 0) continue;
    if (yPosition > 200) { addPage(); yPosition = 12; }
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(idx === 0 ? 'Pharmacist:' : `Pharmacist — Additional #${idx}:`, margin, yPosition);
    yPosition += 5;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    renderHealthProRow('Name:', (formData[`ph_health_${idx}_name` as keyof typeof formData] as string) || '', `ph_health_${idx}_name`);
    const phPatientsList = (formData[`ph_health_${idx}_patients` as keyof typeof formData] as string[]) || [];
    const phPatientLabels = phPatientsList.map((p: string) => {
      if (p === 'client1') return formData.fullName || 'Client 1';
      if (p === 'client2') return formData.spouseName || 'Client 2';
      if (p.startsWith('child:')) return p.slice(6);
      return p;
    });
    renderHealthProRow('Patients:', phPatientLabels.join(', '), `ph_health_${idx}_patients`);
    renderHealthProRow('Pharmacy:', (formData[`ph_health_${idx}_pharmacy` as keyof typeof formData] as string) || '', `ph_health_${idx}_pharmacy`);
    renderHealthProRow('Phone:', (formData[`ph_health_${idx}_phone` as keyof typeof formData] as string) || '', `ph_health_${idx}_phone`);
    yPosition += 4;
  }

  const c1RegData = (formData.client1RegisteredAccountData || {}) as Record<string, Array<Record<string, unknown>>>;
  const c2RegData = (formData.client2RegisteredAccountData || {}) as Record<string, Array<Record<string, unknown>>>;
  const benReviewNote = 'Beneficiary Review is Recommended';
  const c1RrspNote = (c1RegData.rrsp || []).some(i => i.successorAnnuitantOrBeneficiary === 'not_sure') ? benReviewNote : '';
  const c1RrifNote = (c1RegData.rrif || []).some(i => i.successorAnnuitantOrBeneficiary === 'not_sure') ? benReviewNote : '';
  const c2RrspNote = (c2RegData.rrsp || []).some(i => i.successorAnnuitantOrBeneficiary === 'not_sure') ? benReviewNote : '';
  const c2RrifNote = (c2RegData.rrif || []).some(i => i.successorAnnuitantOrBeneficiary === 'not_sure') ? benReviewNote : '';
  const c1RespMissingSuccessorSubscriber = (c1RegData.resp || []).some(i => i.hasSuccessorSubscriber === 'no' || i.hasSuccessorSubscriber === 'not_sure');
  const c2RespMissingSuccessorSubscriber = (c2RegData.resp || []).some(i => i.hasSuccessorSubscriber === 'no' || i.hasSuccessorSubscriber === 'not_sure');
  void c1RrspNote; void c1RrifNote; void c2RrspNote; void c2RrifNote;
  void c1RespMissingSuccessorSubscriber; void c2RespMissingSuccessorSubscriber;

  const renderRespSuccessorSubscriberTodo = (clientLabel: string) => {
    checkPageBreak(18);
    doc.setFillColor(255, 255, 200);
    const todoText = `TO DO (${clientLabel} - RESP): A Successor Subscriber has not been named. This is strongly recommended — if you pass away without one, the RESP may need to go through your estate, causing delays and potential loss of grants. Please name a Successor Subscriber in your Will or directly through your financial institution.`;
    const todoLines = doc.splitTextToSize(todoText, pageWidth - margin * 2 - 12);
    const todoBoxH = todoLines.length * 5 + 8;
    doc.rect(margin, yPosition, pageWidth - margin * 2, todoBoxH, 'F');
    doc.setDrawColor(180, 140, 0);
    doc.rect(margin, yPosition, pageWidth - margin * 2, todoBoxH, 'S');
    doc.setTextColor(80, 60, 0);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text(todoLines, margin + 4, yPosition + 5);
    doc.setTextColor(...colors.darkText);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 200);
    doc.setFont(undefined, 'normal');
    yPosition += todoBoxH + 4;
  };

  void renderRespSuccessorSubscriberTodo;

  // Additional Reading Section for Funeral Arrangements
  const needsFuneralReading = formData.client1HasFuneralArrangements === 'no' ||
                               (hasSpouse && formData.client2HasFuneralArrangements === 'no');

  if (needsFuneralReading) {
    if (yPosition > 200) {
      addPage();
      yPosition = 12;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Additional Reading', margin, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    const funeralText = [
      'Prepaying for burial and funeral costs in Canada typically involves establishing an eligible funeral',
      'arrangement (EFA), which is a formal agreement designed to fund these services for one or more',
      'individuals. Prepayment covers "funeral services" (memorials, cremation, or burial arrangements) and',
      '"cemetery services" (property and items like markers, urns, shrubs, and interment vaults).',
      '',
      'If you would like to know more about prepaying funeral services, please reach out to Cameron Smith',
      'to discuss further.'
    ];

    funeralText.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    yPosition += 12;
  }

  // Additional Reading Section for Secondary Wills
  const needsSecondaryWillReading = formData.client1HasSecondaryWill === 'no' ||
                                     (hasSpouse && formData.client2HasSecondaryWill === 'no');

  if (needsSecondaryWillReading) {
    if (yPosition > 120) {
      addPage();
      yPosition = 12;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Additional Reading - How do Secondary Wills Work?', margin, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    const secondaryWillText = [
      'In the intake form it was indicated that one or more parties selected \'No\' to having a Secondary Will.',
      'They are a niche Estate Administration Tax avoidance strategy that people use. Here is a brief overview',
      'of what the strategy entails and how they work.',
      '',
      'How do Secondary Wills work in Ontario?',
      '',
      'Secondary Wills, typically used as part of a multiple Wills strategy, are a financial and estate planning',
      'technique utilized primarily in jurisdictions that impose significant fees on probate, such as Ontario.',
      'The central purpose of employing secondary Wills in Ontario is to minimize or avoid probate fees (also',
      'called estate administration tax) on high-value assets that do not legally require the Will to be validated',
      'in court.',
      '',
      'Here are the details on how Secondary Wills function in Ontario:',
      '',
      'The Mechanism of Multiple Wills:',
      '',
      'The strategy involves deliberately segregating assets into two distinct Wills to control which properties',
      'are subject to the provincial probate process:',
      '',
      'a.  The Primary Will: This document deals exclusively with assets that legally require a grant of probate',
      '    (or Certificate of Appointment of Estate Trustee with a Will, in Ontario) for the executor to obtain',
      '    legal title and distribute the property. These usually include assets held solely in the deceased\'s name',
      '    where the financial institution (like a bank or brokerage firm) requires legal validation, such as bank',
      '    accounts and investment portfolios.',
      '',
      'b.  The Secondary Will: This document covers assets that typically do not require probate to transfer legal',
      '    ownership. In Ontario, the secondary Will is commonly used to transfer specific high-value assets such',
      '    as privately held securities of a private corporation or personal effects like artwork and jewelry.',
      '',
      'Benefits and Application:',
      '',
      'By structuring the estate this way, the executor only needs to submit the primary Will for probate, thereby',
      'avoiding the imposition of probate fees on the assets listed in the non-probated secondary will.',
      '',
      'a.  Non-Probateable Assets: The secondary Will functions successfully because provincial corporate statues',
      '    may grant the corporation\'s directors the authority to transfer the shares of a deceased shareholder',
      '    without requiring the Will to be probated.',
      '',
      'b.  Cost Savings: Since the probate tax is based on the value of the assets that pass through the probated',
      '    Will, this technique is a method to reduce the total probate fee payable. Ontario charges potentially',
      '    significant probate taxes, which provides a strong motivation for implementing this planning.',
      '',
      'Risks and Considerations in Ontario:',
      '',
      'The use of this probate planning technique carries risks and complexity, especially in jurisdictions known',
      'to challenge such arrangements.',
      '',
      'a.  Aggressive Scrutiny: Ontario, especially, has been very aggressive in challenging attempts to reduce',
      '    or bypass probate through this method.',
      '',
      'b.  Ancillary Requirements: Even if the secondary Will is intended to avoid probate, there are circumstances',
      '    where it might still be required. For example, if the secondary Will creates trusts – or if financial',
      '    institutions have internal policies requiring probate documentation to open accounts for the resultant',
      '    trust – a grant of probate may still be necessary.',
      '',
      'c.  Irrevocability: When using Multiple Wills, care must be taken during the drafting process to ensure',
      '    that the execution and revocation clauses are explicitly written so that the execution of one Will does',
      '    not inadvertently revoke the other.'
    ];

    secondaryWillText.forEach(line => {
      if (yPosition > 280) {
        addPage();
        yPosition = 12;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    yPosition += 12;
  }

  const bankingStructure = formData.bankingStructure;
  let totalBankCount = 0;

  if (!hasSpouse) {
    totalBankCount = parseInt(formData.client1BankCount || '0');
  } else if (bankingStructure === 'joint') {
    totalBankCount = parseInt(formData.jointBankCount || '0');
  } else if (bankingStructure === 'individual') {
    totalBankCount = parseInt(formData.client1BankCount || '0') + parseInt(formData.client2BankCount || '0');
  } else if (bankingStructure === 'mixed') {
    totalBankCount = parseInt(formData.mixedJointBankCount || '0') + parseInt(formData.mixedClient1BankCount || '0') + parseInt(formData.mixedClient2BankCount || '0');
  }

  if (totalBankCount > 0) {
    addPage();
    yPosition = 12;
    addSectionHeader('Your Financial Footprint');

    doc.setFontSize(9);
    doc.setTextColor(...colors.mediumGray);
    doc.text('Banking and financial account information', margin, yPosition);
    yPosition += 12;
    doc.setTextColor(...colors.darkText);

    if (bankingStructure === 'joint') {
      const jointCount = parseInt(formData.jointBankCount || '0');
      const jointInstitutions = formData.jointInstitutionsData || [];
      for (let i = 0; i < jointCount; i++) {
        if (yPosition > 180) {
          addPage();
          yPosition = 12;
        }

        const institutionName = jointInstitutions[i]?.name || `Institution ${i + 1}`;
        addSubsectionHeader(`${institutionName} - Joint Banking Account`);
        renderBankTable(`bank_joint_${i + 1}`, jointInstitutions[i]);
      }
    } else if (bankingStructure === 'individual') {
      const client1Count = parseInt(formData.client1BankCount || '0');
      const client1Institutions = formData.client1InstitutionsData || [];
      for (let i = 0; i < client1Count; i++) {
        if (yPosition > 180) {
          addPage();
          yPosition = 12;
        }

        const institutionName = client1Institutions[i]?.name || `Institution ${i + 1}`;
        addSubsectionHeader(`${client1Name} - ${institutionName}`);
        renderBankTable(`bank_client1_${i + 1}`, client1Institutions[i]);
      }

      const client2Count = parseInt(formData.client2BankCount || '0');
      const client2Institutions = formData.client2InstitutionsData || [];
      for (let i = 0; i < client2Count; i++) {
        if (yPosition > 180) {
          addPage();
          yPosition = 12;
        }
        const institutionName = client2Institutions[i]?.name || `Institution ${i + 1}`;
        addSubsectionHeader(`${client2Name} - ${institutionName}`);
        renderBankTable(`bank_client2_${i + 1}`, client2Institutions[i]);
      }
    } else if (bankingStructure === 'mixed') {
      const jointCount = parseInt(formData.mixedJointBankCount || '0');
      const mixedJointInstitutions = formData.mixedJointInstitutionsData || [];
      for (let i = 0; i < jointCount; i++) {
        if (yPosition > 180) {
          addPage();
          yPosition = 12;
        }

        const institutionName = mixedJointInstitutions[i]?.name || `Institution ${i + 1}`;
        addSubsectionHeader(`${institutionName} - Joint Banking Account`);
        renderBankTable(`bank_mixed_joint_${i + 1}`, mixedJointInstitutions[i]);
      }

      const client1Count = parseInt(formData.mixedClient1BankCount || '0');
      const mixedClient1Institutions = formData.mixedClient1InstitutionsData || [];
      for (let i = 0; i < client1Count; i++) {
        if (yPosition > 180) {
          addPage();
          yPosition = 12;
        }

        const institutionName = mixedClient1Institutions[i]?.name || `Institution ${i + 1}`;
        addSubsectionHeader(`${client1Name} - ${institutionName}`);
        renderBankTable(`bank_mixed_client1_${i + 1}`, mixedClient1Institutions[i]);
      }

      const client2Count = parseInt(formData.mixedClient2BankCount || '0');
      const mixedClient2Institutions = formData.mixedClient2InstitutionsData || [];
      for (let i = 0; i < client2Count; i++) {
        if (yPosition > 180) {
          addPage();
          yPosition = 12;
        }

        const institutionName = mixedClient2Institutions[i]?.name || `Institution ${i + 1}`;
        addSubsectionHeader(`${client2Name} - ${institutionName}`);
        renderBankTable(`bank_mixed_client2_${i + 1}`, mixedClient2Institutions[i]);
      }
    } else if (!hasSpouse) {
      const bankCount = parseInt(formData.client1BankCount || '0');
      const client1Institutions = formData.client1InstitutionsData || [];
      for (let i = 0; i < bankCount; i++) {
        if (yPosition > 180) {
          addPage();
          yPosition = 12;
        }

        const institutionName = client1Institutions[i]?.name || `Institution ${i + 1}`;
        addSubsectionHeader(`${institutionName} - Banking Account`);
        renderBankTable(`bank_single_${i + 1}`, client1Institutions[i]);
      }
    }

  // Real Estate section removed

  addSectionHeader('Vehicles and Major Personal Property');

  const vehicleItems = [
      'Automobiles:',
      'Recreational Vehicles\n(RVs, ATVs,\nMotorcycles):',
      'Major Home\nFurnishings:',
      'Other:',
      'Other:',
      'Other:',
      'Other:'
    ];

    const vehicleCellHeight = 10;
    checkPageBreak(vehicleCellHeight + vehicleItems.length * vehicleCellHeight + 4);
    const col1Width = fieldWidth * 0.25;
    const col2Width = fieldWidth * 0.25;
    const col3Width = fieldWidth * 0.25;
    const col4Width = fieldWidth * 0.25;
    let vehicleTableY = yPosition;

    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkText);

    doc.rect(margin, vehicleTableY, col1Width, vehicleCellHeight, 'FD');
    doc.text('Item Description:', margin + 0.5, vehicleTableY + 4.5);

    doc.rect(margin + col1Width, vehicleTableY, col2Width, vehicleCellHeight, 'FD');
    doc.text('Physical Location:', margin + col1Width + 0.5, vehicleTableY + 4.5);

    doc.rect(margin + col1Width + col2Width, vehicleTableY, col3Width, vehicleCellHeight, 'FD');
    doc.text('Ownership\n(Sole/Joint):', margin + col1Width + col2Width + 0.5, vehicleTableY + 3);

    doc.rect(margin + col1Width + col2Width + col3Width, vehicleTableY, col4Width, vehicleCellHeight, 'FD');
    doc.text('Insurance Provider:', margin + col1Width + col2Width + col3Width + 0.5, vehicleTableY + 4.5);

    vehicleTableY += vehicleCellHeight;

    vehicleItems.forEach((item, index) => {
      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...colors.darkText);

      doc.rect(margin, vehicleTableY, col1Width, vehicleCellHeight, 'FD');
      const lines = item.split('\n');
      lines.forEach((line, lineIndex) => {
        doc.text(line, margin + 0.5, vehicleTableY + 3.5 + (lineIndex * 3));
      });

      doc.setFillColor(...colors.tableHeader);
      doc.rect(margin + col1Width, vehicleTableY, col2Width, vehicleCellHeight, 'FD');
      doc.rect(margin + col1Width + col2Width, vehicleTableY, col3Width, vehicleCellHeight, 'FD');
      doc.rect(margin + col1Width + col2Width + col3Width, vehicleTableY, col4Width, vehicleCellHeight, 'FD');

      const field1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field1.fieldName = `vehicle_location_${index}`;
      field1.Rect = [margin + col1Width + 0.3, vehicleTableY + 0.3, col2Width - 0.6, vehicleCellHeight - 0.6];
      field1.fontSize = 7;
      field1.textColor = [0, 0, 0];
      field1.borderStyle = 'none';
      doc.addField(field1);

      const field2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field2.fieldName = `vehicle_ownership_${index}`;
      field2.Rect = [margin + col1Width + col2Width + 0.3, vehicleTableY + 0.3, col3Width - 0.6, vehicleCellHeight - 0.6];
      field2.fontSize = 7;
      field2.textColor = [0, 0, 0];
      field2.borderStyle = 'none';
      doc.addField(field2);

      const field3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      field3.fieldName = `vehicle_insurance_${index}`;
      field3.Rect = [margin + col1Width + col2Width + col3Width + 0.3, vehicleTableY + 0.3, col4Width - 0.6, vehicleCellHeight - 0.6];
      field3.fontSize = 7;
      field3.textColor = [0, 0, 0];
      field3.borderStyle = 'none';
      doc.addField(field3);

      vehicleTableY += vehicleCellHeight;
    });

    yPosition = vehicleTableY + 15;

    checkPageBreak(30);
    addSectionHeader('High-Value Effects and Sentimental Heirlooms');

    doc.setFontSize(8);
    const heirloomText = "Listing these items here creates a 'Memorandum of Personal Effects' which allows for distribution outside the formal Will and can reduce probate complexity and family disputes. Keep in mind things like art and collections are subjective and your heirs might not know the true value of what you have as they are going through your belongings:";
    const splitText = doc.splitTextToSize(heirloomText, fieldWidth);
    splitText.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 4;
    });
    yPosition += 4;

    const heirloomCellHeight = 10;
    checkPageBreak(heirloomCellHeight + 4);
    const hCol1Width = fieldWidth * 0.25;
    const hCol2Width = fieldWidth * 0.25;
    const hCol3Width = fieldWidth * 0.25;
    const hCol4Width = fieldWidth * 0.25;
    let heirloomTableY = yPosition;

    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkText);

    doc.rect(margin, heirloomTableY, hCol1Width, heirloomCellHeight, 'FD');
    doc.text('Item (Art, Jewelry,\nCollectibles)', margin + 0.5, heirloomTableY + 3.5);

    doc.rect(margin + hCol1Width, heirloomTableY, hCol2Width, heirloomCellHeight, 'FD');
    doc.text('Location (e.g., Safe,\nDisplay)', margin + hCol1Width + 0.5, heirloomTableY + 3.5);

    doc.rect(margin + hCol1Width + hCol2Width, heirloomTableY, hCol3Width, heirloomCellHeight, 'FD');
    doc.text('Estimated\nValue/Appraisal:', margin + hCol1Width + hCol2Width + 0.5, heirloomTableY + 3.5);

    doc.rect(margin + hCol1Width + hCol2Width + hCol3Width, heirloomTableY, hCol4Width, heirloomCellHeight, 'FD');
    doc.text('Intended Beneficiary:', margin + hCol1Width + hCol2Width + hCol3Width + 0.5, heirloomTableY + 4.5);

    heirloomTableY += heirloomCellHeight;

    for (let i = 0; i < 12; i++) {
      if (heirloomTableY + heirloomCellHeight > pageHeight - 20) {
        addPage();
        heirloomTableY = 25;
      }

      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkText);

      doc.rect(margin, heirloomTableY, hCol1Width, heirloomCellHeight, 'FD');
      doc.setFillColor(...colors.tableHeader);
      doc.rect(margin + hCol1Width, heirloomTableY, hCol2Width, heirloomCellHeight, 'FD');
      doc.rect(margin + hCol1Width + hCol2Width, heirloomTableY, hCol3Width, heirloomCellHeight, 'FD');
      doc.rect(margin + hCol1Width + hCol2Width + hCol3Width, heirloomTableY, hCol4Width, heirloomCellHeight, 'FD');

      const hField1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      hField1.fieldName = `heirloom_item_${i}`;
      hField1.Rect = [margin + 0.3, heirloomTableY + 0.3, hCol1Width - 0.6, heirloomCellHeight - 0.6];
      hField1.fontSize = 7;
      hField1.textColor = [0, 0, 0];
      hField1.borderStyle = 'none';
      doc.addField(hField1);

      const hField2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      hField2.fieldName = `heirloom_location_${i}`;
      hField2.Rect = [margin + hCol1Width + 0.3, heirloomTableY + 0.3, hCol2Width - 0.6, heirloomCellHeight - 0.6];
      hField2.fontSize = 7;
      hField2.textColor = [0, 0, 0];
      hField2.borderStyle = 'none';
      doc.addField(hField2);

      const hField3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      hField3.fieldName = `heirloom_value_${i}`;
      hField3.Rect = [margin + hCol1Width + hCol2Width + 0.3, heirloomTableY + 0.3, hCol3Width - 0.6, heirloomCellHeight - 0.6];
      hField3.fontSize = 7;
      hField3.textColor = [0, 0, 0];
      hField3.borderStyle = 'none';
      doc.addField(hField3);

      const hField4 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      hField4.fieldName = `heirloom_beneficiary_${i}`;
      hField4.Rect = [margin + hCol1Width + hCol2Width + hCol3Width + 0.3, heirloomTableY + 0.3, hCol4Width - 0.6, heirloomCellHeight - 0.6];
      hField4.fontSize = 7;
      hField4.textColor = [0, 0, 0];
      hField4.borderStyle = 'none';
      doc.addField(hField4);

      heirloomTableY += heirloomCellHeight;
    }

    yPosition = heirloomTableY + 15;

    checkPageBreak(30);
    addSectionHeader('Secure Access and Storage');

    doc.setFontSize(8);
    const storageText = "Your representatives cannot protect what they cannot reach. This table identifies the physical 'gateways' to your assets:";
    const splitStorageText = doc.splitTextToSize(storageText, fieldWidth);
    splitStorageText.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 4;
    });
    yPosition += 4;

    const storageItems = [
      'Safety Deposit Box',
      'Home Safe',
      'Storage Locker',
      'Post Office Box',
      'Other:'
    ];

    const storageCellHeight = 10;
    checkPageBreak(storageCellHeight + storageItems.length * storageCellHeight + 4);
    const sCol1Width = fieldWidth * 0.25;
    const sCol2Width = fieldWidth * 0.25;
    const sCol3Width = fieldWidth * 0.25;
    const sCol4Width = fieldWidth * 0.25;
    let storageTableY = yPosition;

    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkText);

    doc.rect(margin, storageTableY, sCol1Width, storageCellHeight, 'FD');
    doc.text('Storage Type:', margin + 0.5, storageTableY + 4.5);

    doc.rect(margin + sCol1Width, storageTableY, sCol2Width, storageCellHeight, 'FD');
    doc.text('Physical Location:', margin + sCol1Width + 0.5, storageTableY + 4.5);

    doc.rect(margin + sCol1Width + sCol2Width, storageTableY, sCol3Width, storageCellHeight, 'FD');
    doc.text('Key/Combination\nLocation:', margin + sCol1Width + sCol2Width + 0.5, storageTableY + 3.5);

    doc.rect(margin + sCol1Width + sCol2Width + sCol3Width, storageTableY, sCol4Width, storageCellHeight, 'FD');
    doc.text('Box/Locker Number:', margin + sCol1Width + sCol2Width + sCol3Width + 0.5, storageTableY + 4.5);

    storageTableY += storageCellHeight;

    storageItems.forEach((item, index) => {
      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...colors.darkText);

      doc.rect(margin, storageTableY, sCol1Width, storageCellHeight, 'FD');
      doc.text(item, margin + 0.5, storageTableY + 4.5);

      doc.setFillColor(...colors.tableHeader);
      doc.rect(margin + sCol1Width, storageTableY, sCol2Width, storageCellHeight, 'FD');
      doc.rect(margin + sCol1Width + sCol2Width, storageTableY, sCol3Width, storageCellHeight, 'FD');
      doc.rect(margin + sCol1Width + sCol2Width + sCol3Width, storageTableY, sCol4Width, storageCellHeight, 'FD');

      const sField1 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      sField1.fieldName = `storage_location_${index}`;
      sField1.Rect = [margin + sCol1Width + 0.3, storageTableY + 0.3, sCol2Width - 0.6, storageCellHeight - 0.6];
      sField1.fontSize = 7;
      sField1.textColor = [0, 0, 0];
      sField1.borderStyle = 'none';
      doc.addField(sField1);

      const sField2 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      sField2.fieldName = `storage_key_location_${index}`;
      sField2.Rect = [margin + sCol1Width + sCol2Width + 0.3, storageTableY + 0.3, sCol3Width - 0.6, storageCellHeight - 0.6];
      sField2.fontSize = 7;
      sField2.textColor = [0, 0, 0];
      sField2.borderStyle = 'none';
      doc.addField(sField2);

      const sField3 = new (doc as unknown as { AcroFormTextField: new () => any }).AcroFormTextField();
      sField3.fieldName = `storage_box_number_${index}`;
      sField3.Rect = [margin + sCol1Width + sCol2Width + sCol3Width + 0.3, storageTableY + 0.3, sCol4Width - 0.6, storageCellHeight - 0.6];
      sField3.fontSize = 7;
      sField3.textColor = [0, 0, 0];
      sField3.borderStyle = 'none';
      doc.addField(sField3);

      storageTableY += storageCellHeight;
    });

    yPosition = storageTableY + 10;
  }


  // Living situation
  if (formData.livingSituation) {
    const livingSituationLabels: Record<string, string> = {
      own: 'I own my home',
      rent: 'I rent my home',
      family: 'I live with family',
      retirement: 'I live in a retirement residence',
      other: 'Other',
    };
    addSectionHeader('Current Living Situation');
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkText);
    doc.text(livingSituationLabels[formData.livingSituation] || formData.livingSituation, margin, yPosition);
    yPosition += 14;
  }

  // Rental details
  if (formData.livingSituation === 'rent') {
    addSectionHeader('Rental Details');
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkText);

    const rentFields: { label: string; value?: string }[] = [
      { label: 'Landlord / Company', value: formData.rentLandlordName },
      { label: 'Address', value: [formData.rentAddress, formData.rentCity, formData.rentProvince, formData.rentPostalCode].filter(Boolean).join(', ') },
      { label: 'Monthly Rent', value: formData.rentMonthlyAmount },
      { label: 'Lease Renewal Date', value: formData.rentLeaseRenewalDate },
      { label: 'Lease Agreement Stored At', value: formData.rentLeaseStorage },
      { label: 'Automatic Rent Payments', value: formData.rentAutoPayments === 'void_cheques' ? 'Void Cheques' : formData.rentAutoPayments === 'other' ? 'Other' : undefined },
      { label: 'Automatic Rent Payments Details', value: formData.rentAutoPaymentsDetails },
      { label: 'Security Deposit', value: formData.rentSecurityDeposit === 'yes' ? 'Yes' : formData.rentSecurityDeposit === 'no' ? 'No' : undefined },
      { label: 'Parking / Storage Lockers', value: formData.rentParkingStorage === 'yes' ? 'Yes' : formData.rentParkingStorage === 'no' ? 'No' : undefined },
      { label: 'Location of the key to the storage locker', value: formData.rentKeyLocation },
      { label: 'Emergency Contact', value: formData.rentNotifyName },
    ];

    rentFields.forEach(({ label, value }) => {
      if (value) {
        checkPageBreak(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(String(value), margin + 40, yPosition);
        yPosition += 14;
      }
    });
    yPosition += 6;
  }

  // Retirement residence details
  if (formData.livingSituation === 'retirement') {
    addSectionHeader('Retirement Residence Details');
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkText);

    const retFields: { label: string; value?: string }[] = [
      { label: 'Residence Name', value: formData.retLandlordName },
      { label: 'Address', value: [formData.retAddress, formData.retCity, formData.retProvince, formData.retPostalCode].filter(Boolean).join(', ') },
      { label: 'Monthly Fee', value: formData.retMonthlyAmount },
      { label: 'Agreement Renewal Date', value: formData.retLeaseRenewalDate },
      { label: 'Residence Agreement Stored At', value: formData.retLeaseStorage },
      { label: 'Automatic Monthly Payments', value: formData.retAutoPayments === 'yes' ? 'Yes' : formData.retAutoPayments === 'no' ? 'No' : undefined },
      { label: 'Security Deposit', value: formData.retSecurityDeposit === 'yes' ? 'Yes' : formData.retSecurityDeposit === 'no' ? 'No' : undefined },
      { label: 'Parking / Storage Lockers', value: formData.retParkingStorage === 'yes' ? 'Yes' : formData.retParkingStorage === 'no' ? 'No' : undefined },
      { label: 'Location of the key to the storage locker', value: formData.retKeyLocation },
      { label: 'Emergency Contact', value: formData.retNotifyName },
    ];

    retFields.forEach(({ label, value }) => {
      if (value) {
        checkPageBreak(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(String(value), margin + 40, yPosition);
        yPosition += 14;
      }
    });
    yPosition += 6;
  }

  // Will Review — foreign property yellow flags
  if (formData.hasRealEstate === 'yes') {
    const propertiesData = (formData['propertiesData'] as Array<Record<string, unknown>>) || [];
    const foreignProperties = propertiesData.filter((p) => {
      const country = String(p.country || '').toLowerCase();
      return country && country !== 'canada';
    });

    if (foreignProperties.length > 0) {
      addSectionHeader('Will Review — Foreign Property Flags');
      doc.setFontSize(10);
      doc.setTextColor(200, 150, 0); // yellow/amber

      foreignProperties.forEach((p) => {
        const propName = String(p.name || 'Property');
        const country = String(p.country || '');
        const flagText = `⚠ ${propName} is outside of Canada (${country}). Review required to ensure estate plan addresses foreign property jurisdiction and tax implications.`;
        const flagLines = doc.splitTextToSize(flagText, fieldWidth);
        flagLines.forEach((line: string) => {
          checkPageBreak(6);
          doc.text(line, margin, yPosition);
          yPosition += 5;
        });
        yPosition += 3;
      });

      doc.setTextColor(...colors.darkText);
      yPosition += 6;
    }
  }

  // Rental Property — prior inhabitants (wasAlwaysRental / inhabitedYears)
  if (formData.hasRealEstate === 'yes') {
    const propertiesData = (formData['propertiesData'] as Array<Record<string, unknown>>) || [];
    const rentalProps = propertiesData.filter((p) => {
      const type = String(p.type || '').toLowerCase();
      return type.includes('rental') && (p.wasAlwaysRental === 'yes' || p.leaseDocumentsLocation || p.rentalTaxDocLocation || p.canadianRentalTaxDocLocation || p.foreignRentalTaxDocLocation || p.revenueExpensesLocation || p.capitalExpendituresLocation);
    });

    if (rentalProps.length > 0) {
      addSectionHeader('Rental Property Details');
      doc.setFontSize(10);
      doc.setTextColor(...colors.darkText);

      rentalProps.forEach((p) => {
        const propName = String(p.name || p.type || 'Rental Property');
        checkPageBreak(20);
        doc.setFont(undefined, 'bold');
        doc.text(propName, margin, yPosition);
        yPosition += 12;

        const rentalFields: { label: string; value?: string }[] = [
          { label: 'Lease Documents Location', value: String(p.leaseDocumentsLocation || '') },
          { label: `Location of tax documents for ${propName}`, value: String(p.rentalTaxDocLocation || '') },
          { label: `Location of Canadian tax documents for ${propName}`, value: String(p.canadianRentalTaxDocLocation || '') },
          { label: `Location of tax documents for ${propName} (${String(p.country || '')})`, value: String(p.foreignRentalTaxDocLocation || '') },
          { label: 'Revenue/Expense Records Location', value: String(p.revenueExpensesLocation || '') },
          { label: 'Capital Expenditure Records Location', value: String(p.capitalExpendituresLocation || '') },
          { label: 'Always a Rental', value: p.wasAlwaysRental === 'no' ? 'Yes, always a rental' : p.wasAlwaysRental === 'yes' ? 'No, previously inhabited by client/spouse/child' : undefined },
          { label: 'Years Inhabited by Client/Spouse/Child', value: Array.isArray(p.inhabitedYears) ? (p.inhabitedYears as string[]).join(', ') : undefined },
        ];

        rentalFields.forEach(({ label, value }) => {
          if (value) {
            checkPageBreak(14);
            doc.setFont(undefined, 'bold');
            doc.text(`${label}:`, margin, yPosition);
            doc.setFont(undefined, 'normal');
            const valLines = doc.splitTextToSize(String(value), fieldWidth - 40);
            doc.text(valLines, margin + 40, yPosition);
            yPosition += 14;
          }
        });
        yPosition += 6;
      });
    }
  }

  const fileName = `estate-planning-${formData.fullName?.replace(/\s+/g, '-').toLowerCase() || 'form'}.pdf`;
  doc.save(fileName);
};
