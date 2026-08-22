import React, { useState, useEffect, FormEvent } from 'react';
import { Step, buildInsuredPersonOptions, buildPolicyOwnerOptions, buildBeneficiaryOptions } from '../lib/steps';
import FormField from './FormField';
import DocumentLocationPicker from './DocumentLocationPicker';
import VideoPlayer from './VideoPlayer';
import SoleProprietorshipDetails, { SoleProprietorshipData } from './SoleProprietorshipDetails';
import PartnershipDetails, { PartnershipData } from './PartnershipDetails';
import PropertyDetails, { PropertyData } from './PropertyDetails';
import PersonalGuaranteeDetails, { PersonalGuaranteeData } from './PersonalGuaranteeDetails';
import ShareholderLoanDetails, { ShareholderLoanData } from './ShareholderLoanDetails';
import CompanyOwedDetails, { CompanyOwedData } from './CompanyOwedDetails';
import IntercompanyLoanDetails, { IntercompanyLoanData } from './IntercompanyLoanDetails';
import RelatedPartyLoanDetails, { RelatedPartyLoanData } from './RelatedPartyLoanDetails';
import CorporateFinancialReview from './CorporateFinancialReview';
import PoaPropertyAttorneyDetails, { PoaPropertyAttorneyData } from './PoaPropertyAttorneyDetails';
import Subsection from './Subsection';
import ChildPlanningSection, { PlanningPerson } from './ChildPlanningSection';
import { resolvePersonNameField } from '../lib/personRepositoryTypes';
import GuardianTransitionSection from './GuardianTransitionSection';
import ConnectionsBelongingSection from './ConnectionsBelongingSection';
import GuardianFundingSection from './GuardianFundingSection';
import DebtObligations from './DebtObligations';
import FinancialFootprintAssets from './FinancialFootprintAssets';
import WorkplacePensionsBenefits from './WorkplacePensionsBenefits';
import PropertyLiabilityInsuranceSection from './PropertyLiabilityInsuranceSection';
import FamilyTrustSection from './FamilyTrustSection';
import CorporationRegistrySection from './CorporationRegistrySection';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';
import { useCorporateObligationSync } from '../lib/useCorporateObligationSync';
import { usePersonalObligationSync } from '../lib/usePersonalObligationSync';
import { useRealEstateObligationSync } from '../lib/useRealEstateObligationSync';
import LegacyIntentSection from './LegacyIntentSection';
import CurrentWillSection from './CurrentWillSection';
import FinalWishesArrangementsSection from './FinalWishesArrangementsSection';
import { getFinancialAdvisors, getProfessionalAdvisors } from '../lib/referentialIntegrity';
import { areSamePeople } from '../lib/guardianshipRoleResolution';
import { getClientOwnedCorpNames } from '../lib/corporateOwnership';
import { ChevronLeft, ChevronRight, Check, Trash2, Info, X, Plus } from 'lucide-react';

type StepFormProps = {
  step: Step;
  answers: Record<string, unknown>;
  allAnswers?: Map<string, Record<string, unknown>>;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onAnswerChange: (key: string, value: unknown) => void;
  onUpdateFootprint?: (key: string, value: unknown) => void;
  onClearCurrentStep: () => void;
  currentStepNumber: number;
};

export default function StepForm({
  step,
  answers,
  allAnswers,
  isFirstStep,
  isLastStep,
  onNext,
  onPrevious,
  onAnswerChange,
  onUpdateFootprint,
  onClearCurrentStep,
  currentStepNumber,
}: StepFormProps) {
  const [validationError, setValidationError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [openInfoTooltip, setOpenInfoTooltip] = useState<string | null>(null);

  const { getOrCreateEntity: getOrCreateCorpEntity, entities: registryEntities } = useEntityRegistry();
  const peopleRepo = usePeopleRepository();

  const shareholderLoansData = (answers['shareholderLoansData'] as ShareholderLoanData[]) || [];
  const companyOwedData = (answers['companyOwedData'] as CompanyOwedData[]) || [];
  const intercompanyLoansData = (answers['intercompanyLoansData'] as IntercompanyLoanData[]) || [];
  const relatedPartyLoansData = (answers['relatedPartyLoansData'] as RelatedPartyLoanData[]) || [];
  const personalGuaranteesData = (answers['personalGuaranteesData'] as PersonalGuaranteeData[]) || [];

  const aboutYouData = (allAnswers?.get('aboutYou') as Record<string, string> | undefined) || {};
  const syncClient1Name = aboutYouData['fullName'] || '';
  const syncClient2Name = aboutYouData['spouseName'] || '';
  const syncHasSpouse = aboutYouData['maritalStatus'] === 'married' || aboutYouData['maritalStatus'] === 'common_law';
  const syncCorporations = ((answers['corporationsData'] as Array<Record<string, string>>) || [])
    .filter((c) => c?.legalName?.trim())
    .map((c) => ({ legalName: c.legalName }));

  // Stable person IDs for Client 1 / Client 2 — these are created once in the
  // About You step and reused everywhere. Names are display attributes; IDs are identity.
  const client1PersonId = aboutYouData['client1PersonId'] || '';
  const client1EntityId = aboutYouData['client1EntityId'] || '';
  const client2PersonId = aboutYouData['client2PersonId'] || '';
  const client2EntityId = aboutYouData['client2EntityId'] || '';

  // Create / link stable Person + Entity records for Client 1 when name is entered
  useEffect(() => {
    if (step.sectionId !== 'aboutYou') return;
    const name = (answers['fullName'] as string || '').trim();
    if (!name) return;
    if (client1PersonId && client1EntityId) return;

    let cancelled = false;
    (async () => {
      const person = await peopleRepo.getOrCreatePerson(name, { personType: 'client', relationship: 'Client 1' });
      if (cancelled || !person) return;
      const result = await getOrCreateCorpEntity(name, 'person', {
        sourceSection: 'aboutYou',
        completionStatus: 'complete',
        metadata: { personRepoId: person.id, clientRole: 'client1' },
      });
      if (cancelled) return;
      onAnswerChange('client1PersonId', person.id);
      onAnswerChange('client1EntityId', result.entity.id);
    })();
    return () => { cancelled = true; };
  }, [step.sectionId, answers['fullName'], client1PersonId, client1EntityId]);

  // Create / link stable Person + Entity records for Client 2 when name is entered
  useEffect(() => {
    if (step.sectionId !== 'aboutYou') return;
    const name = (answers['spouseName'] as string || '').trim();
    if (!name) return;
    if (client2PersonId && client2EntityId) return;

    let cancelled = false;
    (async () => {
      const person = await peopleRepo.getOrCreatePerson(name, { personType: 'client', relationship: 'Client 2' });
      if (cancelled || !person) return;
      const result = await getOrCreateCorpEntity(name, 'person', {
        sourceSection: 'aboutYou',
        completionStatus: 'complete',
        metadata: { personRepoId: person.id, clientRole: 'client2' },
      });
      if (cancelled) return;
      onAnswerChange('client2PersonId', person.id);
      onAnswerChange('client2EntityId', result.entity.id);
    })();
    return () => { cancelled = true; };
  }, [step.sectionId, answers['spouseName'], client2PersonId, client2EntityId]);

  const { removeObligation: removeCorporateObligation } = useCorporateObligationSync({
    enabled: step.sectionId === 'corporateFinancialConnections',
    shareholderLoans: shareholderLoansData,
    companyOwed: companyOwedData,
    intercompanyLoans: intercompanyLoansData,
    relatedPartyLoans: relatedPartyLoansData,
    personalGuarantees: personalGuaranteesData,
    client1Name: syncClient1Name,
    client2Name: syncClient2Name,
    client1PersonId,
    client1EntityId,
    client2PersonId,
    client2EntityId,
    hasSpouse: syncHasSpouse,
    corporations: syncCorporations,
    onUpdateArray: (key, updated) => onAnswerChange(key, updated),
  });

  // Personal debt obligation sync — syncs additionalDebtsData to canonical obligations
  const debtAnswers = allAnswers?.get('debtObligations') || {};
  const additionalDebtsData = (debtAnswers['additionalDebtsData'] as Array<Record<string, unknown>>) || [];
  usePersonalObligationSync({
    enabled: step.sectionId === 'debtObligations',
    additionalDebts: additionalDebtsData as Array<{ id: string; borrower?: string; borrowerOtherName?: string; description?: string; lender?: string; amount?: string; amountUnknown?: string; interestRate?: string; interestRateUnknown?: string; paymentAmount?: string; paymentFrequency?: string; paymentFrequencyOther?: string; paymentSource?: string; paymentSourceOther?: string; paymentSourceBankRef?: string; isSecured?: string; securedByType?: string; securedByOther?: string; hasDocument?: string; documentLocation?: string; documentLocationOther?: string; specialNotes?: string; obligationEntityId?: string; borrowerEntityId?: string; lenderEntityId?: string }>,
    client1Name: syncClient1Name,
    client2Name: syncClient2Name,
    client1EntityId,
    client2EntityId,
    hasSpouse: syncHasSpouse,
    onUpdateArray: (key, updated) => onAnswerChange(key, updated),
  });

  // Real estate obligation sync — syncs mortgages/HELOCs to canonical obligations
  const realEstateAnswers = allAnswers?.get('realEstate') || {};
  const primaryHomeData = (realEstateAnswers['primaryHomeData'] as Record<string, unknown>) || {};
  const propertiesData = (realEstateAnswers['propertiesData'] as Array<Record<string, unknown>>) || [];
  useRealEstateObligationSync({
    enabled: step.sectionId === 'realEstate',
    primaryHomeData: primaryHomeData as { name?: string; propertyEntityId?: string; hasDebt?: string; debtType?: string; mortgageLender?: string; mortgageBalance?: string; mortgageResponsibleParties?: string[]; mortgageOtherBorrowers?: Array<{ name?: string }>; mortgageInterestRate?: string; mortgagePayment?: string; mortgagePaymentFrequency?: string; mortgageSpecialNotes?: string; mortgageEntityId?: string; helocLender?: string; helocBalance?: string; helocCreditLimit?: string; helocResponsibleParties?: string[]; helocOtherBorrowers?: Array<{ name?: string }>; helocInterestRate?: string; helocSpecialNotes?: string; helocEntityId?: string },
    propertiesData: propertiesData as Array<{ name?: string; propertyEntityId?: string; hasDebt?: string; debtType?: string; mortgageLender?: string; mortgageBalance?: string; mortgageResponsibleParties?: string[]; mortgageOtherBorrowers?: Array<{ name?: string }>; mortgageInterestRate?: string; mortgagePayment?: string; mortgagePaymentFrequency?: string; mortgageSpecialNotes?: string; mortgageEntityId?: string; helocLender?: string; helocBalance?: string; helocCreditLimit?: string; helocResponsibleParties?: string[]; helocOtherBorrowers?: Array<{ name?: string }>; helocInterestRate?: string; helocSpecialNotes?: string; helocEntityId?: string }>,
    client1Name: syncClient1Name,
    client2Name: syncClient2Name,
    client1EntityId,
    client2EntityId,
    hasSpouse: syncHasSpouse,
    onUpdateField: (field, value) => {
      const updated = { ...primaryHomeData, [field]: value };
      onAnswerChange('primaryHomeData', updated);
    },
    onUpdateProperty: (index, updates) => {
      const updated = [...propertiesData];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
        onAnswerChange('propertiesData', updated);
      }
    },
  });

  useEffect(() => {
    if (answers['spouseIsPoaPersonalCare'] === 'no') {
      if (answers['spousePoaPersonalCareHasDocCopy'] !== undefined) {
        onAnswerChange('spousePoaPersonalCareHasDocCopy', undefined);
      }
    }
  }, [answers['spouseIsPoaPersonalCare']]);

  useEffect(() => {
    if (answers['spouseIsPoaProperty'] === 'no') {
      if (answers['spousePoaPropertyHasDocCopy'] !== undefined) {
        onAnswerChange('spousePoaPropertyHasDocCopy', undefined);
      }
    }
  }, [answers['spouseIsPoaProperty']]);

  useEffect(() => {
    if (answers['fpHasAdvisor'] !== 'yes') {
      ['fpAdvisor1Id', 'fpAdvisor1IsCameronSmith', 'fpAdvisor1Firm', 'fpAdvisor1Name', 'fpAdvisor1Phone', 'fpAdvisor1Email', 'fpAdvisor1Website', 'fpAdvisor1Services', 'fpAdvisor1Duration', 'fpAdvisor1RecordsLocation', 'fpAdvisor1DocLocation', 'fpAdvisor1IncludeInContactList', 'fpAdvisor1WorksWith', 'fpHasAdditionalAdvisor', 'fpAdditionalAdvisorsData', 'fpAdditionalHasAdditional',
       'fpAdvisor2Id', 'fpAdvisor2IsCameronSmith', 'fpAdvisor2Firm', 'fpAdvisor2Name', 'fpAdvisor2Phone', 'fpAdvisor2Email', 'fpAdvisor2Website', 'fpAdvisor2Services', 'fpAdvisor2Duration', 'fpAdvisor2RecordsLocation', 'fpAdvisor2IncludeInContactList', 'fpAdvisor2WorksWith', 'fpAdvisor2HasAdditionalAdvisor'].forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['fpHasAdvisor']]);

  // Ensure advisor 1 has a stable ID persisted in Professional Team
  useEffect(() => {
    if (answers['fpHasAdvisor'] === 'yes' && !answers['fpAdvisor1Id']) {
      const stableId = `adv_${Date.now().toString(36)}_a1_${Math.random().toString(36).substr(2, 6)}`;
      onAnswerChange('fpAdvisor1Id', stableId);
    }
  }, [answers['fpHasAdvisor'], answers['fpAdvisor1Id']]);

  // Ensure advisor 2 has a stable ID persisted in Professional Team
  useEffect(() => {
    if (answers['fpHasAdditionalAdvisor'] === 'yes' && !answers['fpAdvisor2Id']) {
      const stableId = `adv_${Date.now().toString(36)}_a2_${Math.random().toString(36).substr(2, 6)}`;
      onAnswerChange('fpAdvisor2Id', stableId);
    }
  }, [answers['fpHasAdditionalAdvisor'], answers['fpAdvisor2Id']]);

  // Ensure each additional advisor record has a stable ID
  useEffect(() => {
    if (answers['fpHasAdvisor'] !== 'yes') return;
    const additionalData = answers['fpAdditionalAdvisorsData'] as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(additionalData) || additionalData.length === 0) return;
    let changed = false;
    const updated = additionalData.map((record) => {
      if (!record.id) {
        changed = true;
        return {
          ...record,
          id: `adv_${Date.now().toString(36)}_x_${Math.random().toString(36).substr(2, 6)}`,
        };
      }
      return record;
    });
    if (changed) {
      onAnswerChange('fpAdditionalAdvisorsData', updated);
    }
  }, [answers['fpHasAdvisor'], answers['fpAdditionalAdvisorsData']]);

  // Clear stale advisor references from financial footprint assets using registry-based cleanup
  useEffect(() => {
    if (answers['fpHasAdvisor'] !== 'yes') {
      const footprint = allAnswers?.get('financialFootprint') || {};
      const assetKeys = ['investmentAccountsData', 'pensionRecordsData', 'equityCompensationData', 'receivablesData', 'otherAssetsData'];

      for (const key of assetKeys) {
        const assets = footprint[key] as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(assets) || assets.length === 0) continue;

        const hasStale = assets.some(
          (a) => (a?.contact as Record<string, unknown>)?.contactPersonId
        );
        if (!hasStale) continue;

        const cleaned = assets.map((a) => {
          const contact = a?.contact as Record<string, unknown> | undefined;
          if (contact?.contactPersonId) {
            return { ...a, contact: {} };
          }
          return a;
        });
        onUpdateFootprint?.(key, cleaned);
      }
    }
  }, [answers['fpHasAdvisor'], allAnswers, onUpdateFootprint]);

  // Auto-populate Cameron Smith CFP® details when checkbox is selected
  useEffect(() => {
    if (answers['fpAdvisor1IsCameronSmith'] === true) {
      onAnswerChange('fpAdvisor1Firm', 'Clarify Wealth Ltd.');
      onAnswerChange('fpAdvisor1Name', 'Cameron Smith');
      onAnswerChange('fpAdvisor1Phone', '647-448-5963');
      onAnswerChange('fpAdvisor1Email', 'cameron.smith@ipcsecurities.com');
      onAnswerChange('fpAdvisor1Website', 'www.clarifywealth.ca');
    } else if (answers['fpAdvisor1IsCameronSmith'] === false) {
      ['fpAdvisor1Firm', 'fpAdvisor1Name', 'fpAdvisor1Phone', 'fpAdvisor1Email', 'fpAdvisor1Website',
       'fpAdvisor2IsCameronSmith', 'fpAdvisor2Firm', 'fpAdvisor2Name', 'fpAdvisor2Phone', 'fpAdvisor2Email', 'fpAdvisor2Website', 'fpAdvisor2Services', 'fpAdvisor2Duration', 'fpAdvisor2RecordsLocation', 'fpAdvisor2IncludeInContactList', 'fpAdvisor2WorksWith', 'fpAdvisor2HasAdditionalAdvisor'].forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['fpAdvisor1IsCameronSmith']]);

  // Auto-populate second Cameron Smith CFP® details when checkbox is selected
  useEffect(() => {
    if (answers['fpAdvisor2IsCameronSmith'] === true) {
      onAnswerChange('fpAdvisor2Firm', 'Clarify Wealth Ltd.');
      onAnswerChange('fpAdvisor2Name', 'Cameron Smith');
      onAnswerChange('fpAdvisor2Phone', '647-448-5963');
      onAnswerChange('fpAdvisor2Email', 'cameron.smith@ipcsecurities.com');
      onAnswerChange('fpAdvisor2Website', 'www.clarifywealth.ca');
    } else if (answers['fpAdvisor2IsCameronSmith'] === false) {
      ['fpAdvisor2Firm', 'fpAdvisor2Name', 'fpAdvisor2Phone', 'fpAdvisor2Email', 'fpAdvisor2Website'].forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['fpAdvisor2IsCameronSmith']]);

  useEffect(() => {
    if (answers['fpHasAdditionalAdvisor'] !== 'yes') {
      if (answers['fpAdditionalAdvisorsData'] !== undefined) {
        onAnswerChange('fpAdditionalAdvisorsData', undefined);
      }
      if (answers['fpAdditionalHasAdditional'] !== undefined) {
        onAnswerChange('fpAdditionalHasAdditional', undefined);
      }
    }
  }, [answers['fpHasAdditionalAdvisor']]);

  useEffect(() => {
    if (answers['acctHasAccountant'] !== 'yes') {
      ['acctAdvisor1Firm', 'acctAdvisor1Name', 'acctAdvisor1Phone', 'acctAdvisor1Email', 'acctAdvisor1Services', 'acctAdvisor1Duration', 'acctAdvisor1DocLocation', 'acctAdvisor1IncludeInContactList', 'acctAdvisor1WorksWith', 'acctHasAdditional', 'acctAdditionalData', 'acctAdditionalHasAdditional'].forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['acctHasAccountant']]);

  useEffect(() => {
    if (answers['acctHasAdditional'] !== 'yes') {
      if (answers['acctAdditionalData'] !== undefined) {
        onAnswerChange('acctAdditionalData', undefined);
      }
      if (answers['acctAdditionalHasAdditional'] !== undefined) {
        onAnswerChange('acctAdditionalHasAdditional', undefined);
      }
    }
  }, [answers['acctHasAdditional']]);

  useEffect(() => {
    if (answers['lawHasLawyer'] !== 'yes') {
      ['lawAdvisor1Firm', 'lawAdvisor1Name', 'lawAdvisor1Phone', 'lawAdvisor1Email', 'lawAdvisor1Services', 'lawAdvisor1Duration', 'lawAdvisor1DocLocation', 'lawAdvisor1IncludeInContactList', 'lawAdvisor1WorksWith', 'lawHasAdditional', 'lawAdditionalData', 'lawAdditionalHasAdditional'].forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['lawHasLawyer']]);

  useEffect(() => {
    if (answers['lawHasAdditional'] !== 'yes') {
      if (answers['lawAdditionalData'] !== undefined) {
        onAnswerChange('lawAdditionalData', undefined);
      }
      if (answers['lawAdditionalHasAdditional'] !== undefined) {
        onAnswerChange('lawAdditionalHasAdditional', undefined);
      }
    }
  }, [answers['lawHasAdditional']]);

  useEffect(() => {
    if (!answers['insHasAdvisor'] || answers['insHasAdvisor'] === 'na') {
      ['insAdvisor1Firm', 'insAdvisor1Name', 'insAdvisor1Phone', 'insAdvisor1Email', 'insAdvisor1Services', 'insAdvisor1Duration', 'insAdvisor1DocLocation', 'insAdvisor1IncludeInContactList', 'insAdvisor1WorksWith', 'insHasAdditional', 'insAdditionalData', 'insAdditionalHasAdditional', 'insAdvisor2Firm', 'insAdvisor2Name', 'insAdvisor2Phone', 'insAdvisor2Email', 'insAdvisor2Services', 'insAdvisor2Duration', 'insAdvisor2DocLocation', 'insAdvisor2IncludeInContactList', 'insAdvisor2WorksWith'].forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['insHasAdvisor']]);

  useEffect(() => {
    if (answers['insHasAdditional'] !== 'yes') {
      if (answers['insAdditionalData'] !== undefined) {
        onAnswerChange('insAdditionalData', undefined);
      }
      if (answers['insAdditionalHasAdditional'] !== undefined) {
        onAnswerChange('insAdditionalHasAdditional', undefined);
      }
      ['insAdvisor2Firm', 'insAdvisor2Name', 'insAdvisor2Phone', 'insAdvisor2Email', 'insAdvisor2Services', 'insAdvisor2Duration', 'insAdvisor2DocLocation', 'insAdvisor2IncludeInContactList', 'insAdvisor2WorksWith'].forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['insHasAdditional']]);

  // Real Estate — hasRealEstate gate cleanup
  useEffect(() => {
    if (answers['hasRealEstate'] !== 'yes') {
      Object.keys(answers).forEach(key => {
        if (key !== 'hasRealEstate' && (key === 'propertyCount' || key === 'propertyTypes' || /^property\d+/.test(key))) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['hasRealEstate']]);

  // Real Estate — propertyCount cleanup (clear excess property data)
  useEffect(() => {
    const count = parseInt(answers['propertyCount'] as string || '0', 10);
    Object.keys(answers).forEach(key => {
      const match = key.match(/^property(\d+)/);
      if (match && parseInt(match[1], 10) > count) {
        onAnswerChange(key, undefined);
      }
    });
  }, [answers['propertyCount']]);

  // Real Estate — primary home cleanup when living situation changes away from 'own'
  useEffect(() => {
    if (answers['livingSituation'] !== 'own') {
      if (answers['primaryHomeData'] !== undefined) {
        onAnswerChange('primaryHomeData', undefined);
      }
    }
  }, [answers['livingSituation']]);

  // Real Estate — living situation gate cleanup
  useEffect(() => {
    if (answers['livingSituation'] !== 'rent') {
      Object.keys(answers).forEach(key => {
        if (key !== 'livingSituation' && key.startsWith('rent')) {
          onAnswerChange(key, undefined);
        }
      });
    }
    if (answers['livingSituation'] !== 'retirement') {
      Object.keys(answers).forEach(key => {
        if (key !== 'livingSituation' && key.startsWith('ret') && !key.startsWith('retirement')) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['livingSituation']]);

  // Real Estate — prefill rental address from About You when rentSameAddress is 'yes'
  useEffect(() => {
    if (answers['rentSameAddress'] === 'yes') {
      const step1 = allAnswers?.get('aboutYou') as Record<string, string> | undefined;
      if (step1) {
        if (step1.address) onAnswerChange('rentAddress', step1.address);
        if (step1.city) onAnswerChange('rentCity', step1.city);
        if (step1.province) onAnswerChange('rentProvince', step1.province);
        if (step1.postalCode) onAnswerChange('rentPostalCode', step1.postalCode);
      }
    } else if (answers['rentSameAddress'] === 'no') {
      ['rentAddress', 'rentCity', 'rentProvince', 'rentPostalCode'].forEach(key => {
        onAnswerChange(key, undefined);
      });
    }
  }, [answers['rentSameAddress']]);

  // Real Estate — prefill retirement residence address from About You when retSameAddress is 'yes'
  useEffect(() => {
    if (answers['retSameAddress'] === 'yes') {
      const step1 = allAnswers?.get('aboutYou') as Record<string, string> | undefined;
      if (step1) {
        if (step1.address) onAnswerChange('retAddress', step1.address);
        if (step1.city) onAnswerChange('retCity', step1.city);
        if (step1.province) onAnswerChange('retProvince', step1.province);
        if (step1.postalCode) onAnswerChange('retPostalCode', step1.postalCode);
      }
    } else if (answers['retSameAddress'] === 'no') {
      ['retAddress', 'retCity', 'retProvince', 'retPostalCode'].forEach(key => {
        onAnswerChange(key, undefined);
      });
    }
  }, [answers['retSameAddress']]);

  // Health Professionals — Specialist gate cleanup
  useEffect(() => {
    if (answers['sp_health_has'] !== 'yes') {
      Object.keys(answers).forEach(key => {
        if (key.startsWith('sp_health_') && key !== 'sp_health_has') {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['sp_health_has']]);

  // Health Professionals — "has additional" cascade cleanup for all three types
  useEffect(() => {
    ['fp', 'sp', 'ph'].forEach(prefix => {
      for (let idx = 0; idx < 10; idx++) {
        const addKey = `${prefix}_health_${idx}_has_additional`;
        if (answers[addKey] !== 'yes') {
          // Clear this and all subsequent cards
          for (let clearIdx = idx + 1; clearIdx <= 10; clearIdx++) {
            Object.keys(answers).forEach(key => {
              if (key.startsWith(`${prefix}_health_${clearIdx}_`)) {
                onAnswerChange(key, undefined);
              }
            });
          }
        }
      }
    });
  }, [answers['fp_health_0_has_additional'], answers['fp_health_1_has_additional'], answers['fp_health_2_has_additional'], answers['sp_health_0_has_additional'], answers['sp_health_1_has_additional'], answers['sp_health_2_has_additional'], answers['sp_health_3_has_additional'], answers['ph_health_0_has_additional'], answers['ph_health_1_has_additional'], answers['ph_health_2_has_additional'], answers['ph_health_3_has_additional'], answers['sp_health_has']]);

  useEffect(() => {
    if (answers['client2SpouseIsPoaPersonalCare'] === 'no') {
      if (answers['client2SpousePoaPersonalCareHasDocCopy'] !== undefined) {
        onAnswerChange('client2SpousePoaPersonalCareHasDocCopy', undefined);
      }
    }
  }, [answers['client2SpouseIsPoaPersonalCare']]);

  useEffect(() => {
    if (answers['client2SpouseIsPoaProperty'] === 'no') {
      if (answers['client2SpousePoaPropertyHasDocCopy'] !== undefined) {
        onAnswerChange('client2SpousePoaPropertyHasDocCopy', undefined);
      }
    }
  }, [answers['client2SpouseIsPoaProperty']]);

  useEffect(() => {
    if (answers['client1HasSecondaryWill'] === 'no') {
      const keysToClear = [
        'client1SecondaryWillLocation',
        'client1SecondaryWillJurisdiction'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client1HasSecondaryWill']]);

  useEffect(() => {
    if (answers['client2HasSecondaryWill'] === 'no') {
      const keysToClear = [
        'client2SecondaryWillLocation',
        'client2SecondaryWillJurisdiction'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client2HasSecondaryWill']]);

  useEffect(() => {
    if (answers['client1HasWill'] === 'no') {
      const keysToClear = [
        'client1HasSecondaryWill',
        'client1HasHensonTrust'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client1HasWill']]);

  useEffect(() => {
    if (answers['client2HasWill'] === 'no') {
      const keysToClear = [
        'client2HasSecondaryWill'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client2HasWill']]);

  useEffect(() => {
    if (answers['client1WillPreparedInCanada'] === 'yes') {
      if (answers['client1WillCountry'] !== undefined) {
        onAnswerChange('client1WillCountry', undefined);
      }
    } else if (answers['client1WillPreparedInCanada'] === 'no') {
      if (answers['client1WillProvince'] !== undefined) {
        onAnswerChange('client1WillProvince', undefined);
      }
    }
  }, [answers['client1WillPreparedInCanada']]);

  useEffect(() => {
    if (answers['client2WillPreparedInCanada'] === 'yes') {
      if (answers['client2WillCountry'] !== undefined) {
        onAnswerChange('client2WillCountry', undefined);
      }
    } else if (answers['client2WillPreparedInCanada'] === 'no') {
      if (answers['client2WillProvince'] !== undefined) {
        onAnswerChange('client2WillProvince', undefined);
      }
    }
  }, [answers['client2WillPreparedInCanada']]);

  useEffect(() => {
    if (answers['client1HasDigitalWillCopy'] === 'no') {
      if (answers['client1DigitalWillLocation'] !== undefined) {
        onAnswerChange('client1DigitalWillLocation', undefined);
      }
    }
  }, [answers['client1HasDigitalWillCopy']]);

  useEffect(() => {
    if (answers['client2HasDigitalWillCopy'] === 'no') {
      if (answers['client2DigitalWillLocation'] !== undefined) {
        onAnswerChange('client2DigitalWillLocation', undefined);
      }
    }
  }, [answers['client2HasDigitalWillCopy']]);

  useEffect(() => {
    if (answers['client1HasPoaPersonalCare'] === 'no') {
      const keysToClear = [
        'client1SpouseIsPoaPersonalCare',
        'client1PoaPersonalCareName',
        'client1PoaPersonalCarePhone',
        'client1PoaPersonalCareEmail',
        'client1PoaPersonalCareRelationship',
        'client1PoaPersonalCareIsCanadaResident',
        'client1PoaPersonalCareCountry',
        'client1PoaPersonalCareProvince',
        'client1PoaPersonalCareCity',
        'client1PoaPersonalCareHasDocCopy'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client1HasPoaPersonalCare']]);

  useEffect(() => {
    if (answers['client2HasPoaPersonalCare'] === 'no') {
      const keysToClear = [
        'client2SpouseIsPoaPersonalCare',
        'client2PoaPersonalCareName',
        'client2PoaPersonalCarePhone',
        'client2PoaPersonalCareEmail',
        'client2PoaPersonalCareRelationship',
        'client2PoaPersonalCareIsCanadaResident',
        'client2PoaPersonalCareCountry',
        'client2PoaPersonalCareProvince',
        'client2PoaPersonalCareCity',
        'client2PoaPersonalCareHasDocCopy'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client2HasPoaPersonalCare']]);

  useEffect(() => {
    if (answers['client1SpouseIsPoaPersonalCare'] === 'yes') {
      const keysToClear = [
        'client1PoaPersonalCareName',
        'client1PoaPersonalCarePhone',
        'client1PoaPersonalCareEmail',
        'client1PoaPersonalCareRelationship',
        'client1PoaPersonalCareIsCanadaResident',
        'client1PoaPersonalCareCountry',
        'client1PoaPersonalCareProvince',
        'client1PoaPersonalCareCity',
        'client1PoaPersonalCareHasDocCopy'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client1SpouseIsPoaPersonalCare']]);

  useEffect(() => {
    if (answers['client2SpouseIsPoaPersonalCare'] === 'yes') {
      const keysToClear = [
        'client2PoaPersonalCareName',
        'client2PoaPersonalCarePhone',
        'client2PoaPersonalCareEmail',
        'client2PoaPersonalCareRelationship',
        'client2PoaPersonalCareIsCanadaResident',
        'client2PoaPersonalCareCountry',
        'client2PoaPersonalCareProvince',
        'client2PoaPersonalCareCity',
        'client2PoaPersonalCareHasDocCopy'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client2SpouseIsPoaPersonalCare']]);

  useEffect(() => {
    if (answers['client1PoaPersonalCareIsCanadaResident'] === 'yes') {
      if (answers['client1PoaPersonalCareCountry'] !== undefined) {
        onAnswerChange('client1PoaPersonalCareCountry', undefined);
      }
    } else if (answers['client1PoaPersonalCareIsCanadaResident'] === 'no') {
      if (answers['client1PoaPersonalCareProvince'] !== undefined) {
        onAnswerChange('client1PoaPersonalCareProvince', undefined);
      }
    }
  }, [answers['client1PoaPersonalCareIsCanadaResident']]);

  useEffect(() => {
    if (answers['client2PoaPersonalCareIsCanadaResident'] === 'yes') {
      if (answers['client2PoaPersonalCareCountry'] !== undefined) {
        onAnswerChange('client2PoaPersonalCareCountry', undefined);
      }
    } else if (answers['client2PoaPersonalCareIsCanadaResident'] === 'no') {
      if (answers['client2PoaPersonalCareProvince'] !== undefined) {
        onAnswerChange('client2PoaPersonalCareProvince', undefined);
      }
    }
  }, [answers['client2PoaPersonalCareIsCanadaResident']]);

  useEffect(() => {
    const isMarried = answers['maritalStatus'] === 'married' || answers['maritalStatus'] === 'common_law';
    if (!isMarried) {
      const keysToClear = [
        'spouseName', 'spouseDateOfBirth', 'spouseEmail', 'spousePhone',
        'spouseSameAddress', 'spouseAddress', 'spouseCity', 'spouseProvince', 'spousePostalCode',
        'hasMarriageContract', 'marriageContractLocation',
        'client2HasPreviousRelationship', 'client2NumberOfPreviousRelationships'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['maritalStatus']]);

  useEffect(() => {
    if (answers['hasMarriageContract'] !== 'yes') {
      if (answers['marriageContractLocation'] !== undefined) {
        onAnswerChange('marriageContractLocation', undefined);
      }
    }
  }, [answers['hasMarriageContract']]);

  useEffect(() => {
    if (answers['hasChildren'] !== 'yes') {
      if (answers['numberOfChildren'] !== undefined) {
        onAnswerChange('numberOfChildren', undefined);
      }
    }
  }, [answers['hasChildren']]);

  useEffect(() => {
    if (answers['client1HasPreviousRelationship'] !== 'yes') {
      if (answers['client1NumberOfPreviousRelationships'] !== undefined) {
        onAnswerChange('client1NumberOfPreviousRelationships', undefined);
      }
    }
  }, [answers['client1HasPreviousRelationship']]);

  useEffect(() => {
    if (answers['client2HasPreviousRelationship'] !== 'yes') {
      if (answers['client2NumberOfPreviousRelationships'] !== undefined) {
        onAnswerChange('client2NumberOfPreviousRelationships', undefined);
      }
    }
  }, [answers['client2HasPreviousRelationship']]);

  // Legacy flat trust keys are cleared when the gateway is not 'yes', but
  // familyTrustsData (the canonical structured records) is preserved per
  // FACTS PERSIST. OUTPUTS DERIVE.
  useEffect(() => {
    if (answers['hasFamilyTrust'] !== 'yes') {
      const legacyKeys = [
        'trustLegalName', 'trustDeedLocation', 'trustYearEstablished',
        'trustBeneficiariesData', 'hasAdditionalFamilyTrust',
        'trust2LegalName', 'trust2DeedLocation', 'trust2YearEstablished',
        'trust2BeneficiariesData', 'hasAdditionalFamilyTrust2',
        'trust3LegalName', 'trust3DeedLocation', 'trust3YearEstablished',
        'trust3BeneficiariesCount', 'trust3BeneficiariesData', 'hasAdditionalFamilyTrust3',
        'trust4LegalName', 'trust4DeedLocation', 'trust4YearEstablished',
        'trust4BeneficiariesCount', 'trust4BeneficiariesData',
      ];
      legacyKeys.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['hasFamilyTrust']]);

  useEffect(() => {
    if (answers['client1HasPoaProperty'] === 'no') {
      const keysToClear = [
        'client1SpouseIsPoaProperty',
        'client1PoaPropertyCount',
        'client1PoaPropertyData',
        'client1AlternatePoaPropertyCount',
        'client1AlternatePoaPropertyData'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client1HasPoaProperty']]);

  useEffect(() => {
    if (answers['client2HasPoaProperty'] === 'no') {
      const keysToClear = [
        'client2SpouseIsPoaProperty',
        'client2PoaPropertyCount',
        'client2PoaPropertyData',
        'client2AlternatePoaPropertyCount',
        'client2AlternatePoaPropertyData'
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client2HasPoaProperty']]);

  useEffect(() => {
    if (answers['client1HasPoaProperty'] !== 'yes') {
      const keysToClear = [
        'spouseIsPoaProperty',
        'client1PoaPropertyAttorneysData',
        'client1PoaPropertyAlternateAttorneysData',
        'client1PoaPropertyAttorneysHowAct',
        'client1PoaPropertyAttorneysHowActOther',
        'client1PoaPropertyAttorneyNotes',
        'client1HasAlternatePoaPropertyAttorney',
        'client1PoaPropertyDocLocationKnown',
        'client1PoaPropertyDocLocation',
        'client1PoaPropertyDocYear',
        'client1PoaPropertyDocJurisdiction',
        'client1PoaPropertyDocCountry',
        'client1PoaPropertyFinancialInstructions',
        'client1PoaPropertyHasImmediateAttention',
        'client1PoaPropertyImmediateAttentionDetails',
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client1HasPoaProperty']]);

  useEffect(() => {
    if (answers['client2HasPoaProperty'] !== 'yes') {
      const keysToClear = [
        'client2SpouseIsPoaProperty',
        'client2PoaPropertyAttorneysData',
        'client2PoaPropertyAlternateAttorneysData',
        'client2PoaPropertyAttorneysHowAct',
        'client2PoaPropertyAttorneysHowActOther',
        'client2PoaPropertyAttorneyNotes',
        'client2HasAlternatePoaPropertyAttorney',
        'client2PoaPropertyDocLocationKnown',
        'client2PoaPropertyDocLocation',
        'client2PoaPropertyDocYear',
        'client2PoaPropertyDocJurisdiction',
        'client2PoaPropertyDocCountry',
        'client2PoaPropertyFinancialInstructions',
        'client2PoaPropertyHasImmediateAttention',
        'client2PoaPropertyImmediateAttentionDetails',
      ];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client2HasPoaProperty']]);

  useEffect(() => {
    if (answers['client1HasAlternatePoaPropertyAttorney'] !== 'yes') {
      const keysToClear = ['client1PoaPropertyAlternateAttorneysData'];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client1HasAlternatePoaPropertyAttorney']]);

  useEffect(() => {
    if (answers['client2HasAlternatePoaPropertyAttorney'] !== 'yes') {
      const keysToClear = ['client2PoaPropertyAlternateAttorneysData'];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client2HasAlternatePoaPropertyAttorney']]);

  useEffect(() => {
    if (answers['client1PoaPropertyDocJurisdiction'] !== 'other') {
      if (answers['client1PoaPropertyDocCountry'] !== undefined) {
        onAnswerChange('client1PoaPropertyDocCountry', undefined);
      }
    }
  }, [answers['client1PoaPropertyDocJurisdiction']]);

  useEffect(() => {
    if (answers['client2PoaPropertyDocJurisdiction'] !== 'other') {
      if (answers['client2PoaPropertyDocCountry'] !== undefined) {
        onAnswerChange('client2PoaPropertyDocCountry', undefined);
      }
    }
  }, [answers['client2PoaPropertyDocJurisdiction']]);

  useEffect(() => {
    if (answers['client1PoaPropertyHasImmediateAttention'] !== 'yes') {
      if (answers['client1PoaPropertyImmediateAttentionDetails'] !== undefined) {
        onAnswerChange('client1PoaPropertyImmediateAttentionDetails', undefined);
      }
    }
  }, [answers['client1PoaPropertyHasImmediateAttention']]);

  useEffect(() => {
    if (answers['client2PoaPropertyHasImmediateAttention'] !== 'yes') {
      if (answers['client2PoaPropertyImmediateAttentionDetails'] !== undefined) {
        onAnswerChange('client2PoaPropertyImmediateAttentionDetails', undefined);
      }
    }
  }, [answers['client2PoaPropertyHasImmediateAttention']]);

  useEffect(() => {
    if (answers['client1HasAlternatePoaPersonalCare'] !== 'yes') {
      const keysToClear = ['client1AlternatePoaPersonalCareCount', 'client1AlternatePoaPersonalCareData'];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client1HasAlternatePoaPersonalCare']]);

  useEffect(() => {
    if (answers['client2HasAlternatePoaPersonalCare'] !== 'yes') {
      const keysToClear = ['client2AlternatePoaPersonalCareCount', 'client2AlternatePoaPersonalCareData'];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client2HasAlternatePoaPersonalCare']]);


  useEffect(() => {
    const count = parseInt(answers['client1PoaPersonalCareCount'] as string) || 0;
    const data = answers['client1PoaPersonalCareData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client1PoaPersonalCareData', data.slice(0, count));
    }
  }, [answers['client1PoaPersonalCareCount']]);

  useEffect(() => {
    const count = parseInt(answers['client1AlternatePoaPersonalCareCount'] as string) || 0;
    const data = answers['client1AlternatePoaPersonalCareData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client1AlternatePoaPersonalCareData', data.slice(0, count));
    }
  }, [answers['client1AlternatePoaPersonalCareCount']]);

  useEffect(() => {
    const count = parseInt(answers['client1PoaPropertyCount'] as string) || 0;
    const data = answers['client1PoaPropertyData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client1PoaPropertyData', data.slice(0, count));
    }
  }, [answers['client1PoaPropertyCount']]);

  useEffect(() => {
    const count = parseInt(answers['client2PoaPersonalCareCount'] as string) || 0;
    const data = answers['client2PoaPersonalCareData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client2PoaPersonalCareData', data.slice(0, count));
    }
  }, [answers['client2PoaPersonalCareCount']]);

  useEffect(() => {
    const count = parseInt(answers['client2AlternatePoaPersonalCareCount'] as string) || 0;
    const data = answers['client2AlternatePoaPersonalCareData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client2AlternatePoaPersonalCareData', data.slice(0, count));
    }
  }, [answers['client2AlternatePoaPersonalCareCount']]);

  useEffect(() => {
    const count = parseInt(answers['client2PoaPropertyCount'] as string) || 0;
    const data = answers['client2PoaPropertyData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client2PoaPropertyData', data.slice(0, count));
    }
  }, [answers['client2PoaPropertyCount']]);

  useEffect(() => {
    const count = parseInt(answers['client1EstateTrusteeCount'] as string) || 0;
    const data = answers['client1EstateTrusteeData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client1EstateTrusteeData', data.slice(0, count));
    }
  }, [answers['client1EstateTrusteeCount']]);

  useEffect(() => {
    const count = parseInt(answers['client2EstateTrusteeCount'] as string) || 0;
    const data = answers['client2EstateTrusteeData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client2EstateTrusteeData', data.slice(0, count));
    }
  }, [answers['client2EstateTrusteeCount']]);

  useEffect(() => {
    const count = parseInt(answers['mixedJointBankCount'] as string) || 0;
    const data = answers['mixedJointInstitutionsData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('mixedJointInstitutionsData', data.slice(0, count));
    }
  }, [answers['mixedJointBankCount']]);

  useEffect(() => {
    const count = parseInt(answers['mixedClient1BankCount'] as string) || 0;
    const data = answers['mixedClient1InstitutionsData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('mixedClient1InstitutionsData', data.slice(0, count));
    }
  }, [answers['mixedClient1BankCount']]);

  useEffect(() => {
    const count = parseInt(answers['mixedClient2BankCount'] as string) || 0;
    const data = answers['mixedClient2InstitutionsData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('mixedClient2InstitutionsData', data.slice(0, count));
    }
  }, [answers['mixedClient2BankCount']]);

  useEffect(() => {
    const count = parseInt(answers['additionalPropertiesCount'] as string) || 0;
    const data = answers['propertiesData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('propertiesData', data.slice(0, count));
    }
  }, [answers['additionalPropertiesCount']]);

  useEffect(() => {
    const count = parseInt((allAnswers?.get('aboutYou') || {})['numberOfChildren'] as string) || 0;
    const data = answers['childrenData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('childrenData', data.slice(0, count));
    }
  }, [(allAnswers?.get('aboutYou') || {})['numberOfChildren']]);

  useEffect(() => {
    const count = parseInt((allAnswers?.get('aboutYou') || {})['client1NumberOfPreviousRelationships'] as string) || 0;
    const data = answers['client1PreviousRelationshipsData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client1PreviousRelationshipsData', data.slice(0, count));
    }
  }, [(allAnswers?.get('aboutYou') || {})['client1NumberOfPreviousRelationships']]);

  useEffect(() => {
    const count = parseInt((allAnswers?.get('aboutYou') || {})['client2NumberOfPreviousRelationships'] as string) || 0;
    const data = answers['client2PreviousRelationshipsData'] as Array<unknown> | undefined;
    if (data && data.length > count) {
      onAnswerChange('client2PreviousRelationshipsData', data.slice(0, count));
    }
  }, [(allAnswers?.get('aboutYou') || {})['client2NumberOfPreviousRelationships']]);

  useEffect(() => {
    if (answers['hasPartnership'] !== 'yes') {
      const keysToClear = ['partnershipCount', 'client1PartnershipsData'];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['hasPartnership']]);

  useEffect(() => {
    if (answers['client2HasPartnership'] !== 'yes') {
      const keysToClear = ['client2PartnershipCount', 'client2PartnershipsData'];
      keysToClear.forEach(key => {
        if (answers[key] !== undefined) {
          onAnswerChange(key, undefined);
        }
      });
    }
  }, [answers['client2HasPartnership']]);

  const clearLifePolicyFields = (prefix: string) => {
    const fields = [
      'InsuredPerson', 'InsuredPersonOther', 'PolicyOwner', 'PolicyOwnerOther',
      'Provider', 'Employer', 'CoverageAmount', 'CoverageEndType', 'CoverageEndDate',
      'Purpose', 'Beneficiary', 'BeneficiaryOther',
      'HasContingentBeneficiaries', 'ContingentBeneficiary', 'ContingentBeneficiaryOther',
      'HasAdditional',
    ];
    fields.forEach(f => {
      const key = `${prefix}${f}`;
      if (answers[key] !== undefined) onAnswerChange(key, undefined);
    });
  };

  useEffect(() => {
    if (answers['client1HasLifeInsurance'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client1LifePolicy${i}`);
    }
  }, [answers['client1HasLifeInsurance']]);

  useEffect(() => {
    if (answers['client2HasLifeInsurance'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client2LifePolicy${i}`);
    }
  }, [answers['client2HasLifeInsurance']]);

  useEffect(() => {
    if (answers['client1LifePolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client1LifePolicy${ni}`);
    }
  }, [answers['client1LifePolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client1LifePolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client1LifePolicy${ni}`);
    }
  }, [answers['client1LifePolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client1LifePolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client1LifePolicy4');
    }
  }, [answers['client1LifePolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client2LifePolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client2LifePolicy${ni}`);
    }
  }, [answers['client2LifePolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client2LifePolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client2LifePolicy${ni}`);
    }
  }, [answers['client2LifePolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client2LifePolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client2LifePolicy4');
    }
  }, [answers['client2LifePolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client1HasCriticalIllnessInsurance'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client1CiPolicy${i}`);
    }
  }, [answers['client1HasCriticalIllnessInsurance']]);

  useEffect(() => {
    if (answers['client2HasCriticalIllnessInsurance'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client2CiPolicy${i}`);
    }
  }, [answers['client2HasCriticalIllnessInsurance']]);

  useEffect(() => {
    if (answers['client1CiPolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client1CiPolicy${ni}`);
    }
  }, [answers['client1CiPolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client1CiPolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client1CiPolicy${ni}`);
    }
  }, [answers['client1CiPolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client1CiPolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client1CiPolicy4');
    }
  }, [answers['client1CiPolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client2CiPolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client2CiPolicy${ni}`);
    }
  }, [answers['client2CiPolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client2CiPolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client2CiPolicy${ni}`);
    }
  }, [answers['client2CiPolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client2CiPolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client2CiPolicy4');
    }
  }, [answers['client2CiPolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client1HasDisabilityInsuranceEmployer'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client1DiPolicy${i}`);
    }
  }, [answers['client1HasDisabilityInsuranceEmployer']]);

  useEffect(() => {
    if (answers['client2HasDisabilityInsuranceEmployer'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client2DiPolicy${i}`);
    }
  }, [answers['client2HasDisabilityInsuranceEmployer']]);

  useEffect(() => {
    if (answers['client1DiPolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client1DiPolicy${ni}`);
    }
  }, [answers['client1DiPolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client1DiPolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client1DiPolicy${ni}`);
    }
  }, [answers['client1DiPolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client1DiPolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client1DiPolicy4');
    }
  }, [answers['client1DiPolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client2DiPolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client2DiPolicy${ni}`);
    }
  }, [answers['client2DiPolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client2DiPolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client2DiPolicy${ni}`);
    }
  }, [answers['client2DiPolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client2DiPolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client2DiPolicy4');
    }
  }, [answers['client2DiPolicy3HasAdditional']]);

  // ── Personal Insurance gate cleanup ──
  useEffect(() => {
    if (answers['client1HasLifeInsurancePersonal'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client1PersonalLifePolicy${i}`);
    }
  }, [answers['client1HasLifeInsurancePersonal']]);

  useEffect(() => {
    if (answers['client2HasLifeInsurancePersonal'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client2PersonalLifePolicy${i}`);
    }
  }, [answers['client2HasLifeInsurancePersonal']]);

  useEffect(() => {
    if (answers['client1PersonalLifePolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client1PersonalLifePolicy${ni}`);
    }
  }, [answers['client1PersonalLifePolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client1PersonalLifePolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client1PersonalLifePolicy${ni}`);
    }
  }, [answers['client1PersonalLifePolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client1PersonalLifePolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client1PersonalLifePolicy4');
    }
  }, [answers['client1PersonalLifePolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client2PersonalLifePolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client2PersonalLifePolicy${ni}`);
    }
  }, [answers['client2PersonalLifePolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client2PersonalLifePolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client2PersonalLifePolicy${ni}`);
    }
  }, [answers['client2PersonalLifePolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client2PersonalLifePolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client2PersonalLifePolicy4');
    }
  }, [answers['client2PersonalLifePolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client1HasCriticalIllnessInsurancePersonal'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client1PersonalCiPolicy${i}`);
    }
  }, [answers['client1HasCriticalIllnessInsurancePersonal']]);

  useEffect(() => {
    if (answers['client2HasCriticalIllnessInsurancePersonal'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client2PersonalCiPolicy${i}`);
    }
  }, [answers['client2HasCriticalIllnessInsurancePersonal']]);

  useEffect(() => {
    if (answers['client1PersonalCiPolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client1PersonalCiPolicy${ni}`);
    }
  }, [answers['client1PersonalCiPolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client1PersonalCiPolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client1PersonalCiPolicy${ni}`);
    }
  }, [answers['client1PersonalCiPolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client1PersonalCiPolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client1PersonalCiPolicy4');
    }
  }, [answers['client1PersonalCiPolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client2PersonalCiPolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client2PersonalCiPolicy${ni}`);
    }
  }, [answers['client2PersonalCiPolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client2PersonalCiPolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client2PersonalCiPolicy${ni}`);
    }
  }, [answers['client2PersonalCiPolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client2PersonalCiPolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client2PersonalCiPolicy4');
    }
  }, [answers['client2PersonalCiPolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client1HasDisabilityInsurancePersonal'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client1PersonalDiPolicy${i}`);
    }
  }, [answers['client1HasDisabilityInsurancePersonal']]);

  useEffect(() => {
    if (answers['client2HasDisabilityInsurancePersonal'] !== 'yes') {
      for (let i = 1; i <= 4; i++) clearLifePolicyFields(`client2PersonalDiPolicy${i}`);
    }
  }, [answers['client2HasDisabilityInsurancePersonal']]);

  useEffect(() => {
    if (answers['client1PersonalDiPolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client1PersonalDiPolicy${ni}`);
    }
  }, [answers['client1PersonalDiPolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client1PersonalDiPolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client1PersonalDiPolicy${ni}`);
    }
  }, [answers['client1PersonalDiPolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client1PersonalDiPolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client1PersonalDiPolicy4');
    }
  }, [answers['client1PersonalDiPolicy3HasAdditional']]);

  useEffect(() => {
    if (answers['client2PersonalDiPolicy1HasAdditional'] !== 'yes') {
      for (let ni = 2; ni <= 4; ni++) clearLifePolicyFields(`client2PersonalDiPolicy${ni}`);
    }
  }, [answers['client2PersonalDiPolicy1HasAdditional']]);

  useEffect(() => {
    if (answers['client2PersonalDiPolicy2HasAdditional'] !== 'yes') {
      for (let ni = 3; ni <= 4; ni++) clearLifePolicyFields(`client2PersonalDiPolicy${ni}`);
    }
  }, [answers['client2PersonalDiPolicy2HasAdditional']]);

  useEffect(() => {
    if (answers['client2PersonalDiPolicy3HasAdditional'] !== 'yes') {
      clearLifePolicyFields('client2PersonalDiPolicy4');
    }
  }, [answers['client2PersonalDiPolicy3HasAdditional']]);

  useEffect(() => {
    const corps = answers['corporationsData'] as Array<Record<string, string>> | undefined;
    for (let ci = 0; ci < 4; ci++) {
      const prefix = `corp${ci + 1}`;
      const stillExists = !!corps?.[ci]?.legalName?.trim();
      if (!stillExists) {
        [
          `${prefix}HasLifeInsurance`, `${prefix}HasCriticalIllnessInsurance`, `${prefix}HasDisabilityInsurance`,
        ].forEach(key => { if (answers[key] !== undefined) onAnswerChange(key, undefined); });
        for (let i = 1; i <= 4; i++) clearLifePolicyFields(`${prefix}LifePolicy${i}`);
        for (let i = 1; i <= 4; i++) clearLifePolicyFields(`${prefix}CiPolicy${i}`);
        for (let i = 1; i <= 4; i++) clearLifePolicyFields(`${prefix}DiPolicy${i}`);
      }
    }
  }, [answers['corporationsData']]);

  useEffect(() => {
    for (let ci = 0; ci < 4; ci++) {
      const prefix = `corp${ci + 1}`;
      if (answers[`${prefix}HasLifeInsurance`] !== 'yes') {
        for (let i = 1; i <= 4; i++) clearLifePolicyFields(`${prefix}LifePolicy${i}`);
      }
      if (answers[`${prefix}HasCriticalIllnessInsurance`] !== 'yes') {
        for (let i = 1; i <= 4; i++) clearLifePolicyFields(`${prefix}CiPolicy${i}`);
      }
      if (answers[`${prefix}HasDisabilityInsurance`] !== 'yes') {
        for (let i = 1; i <= 4; i++) clearLifePolicyFields(`${prefix}DiPolicy${i}`);
      }
    }
  }, [
    answers['corp1HasLifeInsurance'], answers['corp1HasCriticalIllnessInsurance'], answers['corp1HasDisabilityInsurance'],
    answers['corp2HasLifeInsurance'], answers['corp2HasCriticalIllnessInsurance'], answers['corp2HasDisabilityInsurance'],
    answers['corp3HasLifeInsurance'], answers['corp3HasCriticalIllnessInsurance'], answers['corp3HasDisabilityInsurance'],
    answers['corp4HasLifeInsurance'], answers['corp4HasCriticalIllnessInsurance'], answers['corp4HasDisabilityInsurance'],
  ]);

  // Pre-fill Step 11 corporate insurance from Step 6 corporate data
  useEffect(() => {
    if (step.sectionId !== 'lifeInsurance') return;

    const step6Answers = allAnswers?.get('corporations');
    if (!step6Answers) return;

    const corporationsData = step6Answers['corporationsData'] as Array<Record<string, unknown>> | undefined;
    if (!corporationsData || corporationsData.length === 0) return;

    const insuredOpts = buildInsuredPersonOptions(allAnswers || new Map());
    const ownerOpts = buildPolicyOwnerOptions(allAnswers || new Map());
    const beneficiaryOpts = buildBeneficiaryOptions(allAnswers || new Map());

    const matchToOption = (
      options: Array<{ value: string; label: string }>,
      text: string
    ): { value: string; otherText?: string } => {
      if (!text || !text.trim()) return { value: '' };
      const trimmed = text.trim();
      const match = options.find(
        (opt) => opt.label.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (match) return { value: match.value };
      return { value: 'other', otherText: trimmed };
    };

    const setKeys = new Set<string>();
    const setIfEmpty = (key: string, value: unknown) => {
      if (setKeys.has(key)) return;
      if (answers[key] !== undefined) return;
      if (value === undefined || value === null || value === '') return;
      setKeys.add(key);
      onAnswerChange(key, value);
    };

    for (let ci = 0; ci < Math.min(corporationsData.length, 4); ci++) {
      const corp = corporationsData[ci];
      const prefix = `corp${ci + 1}`;

      const buysellPolicies = (corp.buysellInsurance as Array<Record<string, unknown>>) || [];
      const keyPersonPolicies = (corp.keyPersonPolicies as Array<Record<string, unknown>>) || [];

      const lifePolicies: Array<Record<string, unknown>> = [];
      const ciPolicies: Array<Record<string, unknown>> = [];
      const diPolicies: Array<Record<string, unknown>> = [];

      const classify = (policy: Record<string, unknown>) => {
        const insType = policy.insuranceType;
        const types = Array.isArray(insType)
          ? insType.filter(Boolean)
          : [insType as string].filter(Boolean);
        for (const t of types) {
          const lower = String(t).toLowerCase().trim();
          if (lower === 'life') lifePolicies.push(policy);
          else if (lower.includes('critical')) ciPolicies.push(policy);
          else if (lower.includes('disability')) diPolicies.push(policy);
        }
      };

      buysellPolicies.forEach(classify);
      keyPersonPolicies.forEach(classify);

      const fillPolicy = (
        policyKey: string,
        policy: Record<string, unknown>,
        hasBeneficiary: boolean
      ) => {
        const insured = matchToOption(insuredOpts, String(policy.lifeInsured || ''));
        setIfEmpty(`${policyKey}InsuredPerson`, insured.value);
        if (insured.otherText) setIfEmpty(`${policyKey}InsuredPersonOther`, insured.otherText);

        const owner = matchToOption(ownerOpts, String(policy.policyOwner || ''));
        setIfEmpty(`${policyKey}PolicyOwner`, owner.value);
        if (owner.otherText) setIfEmpty(`${policyKey}PolicyOwnerOther`, owner.otherText);

        setIfEmpty(`${policyKey}Provider`, String(policy.insurer || ''));
        setIfEmpty(`${policyKey}CoverageAmount`, String(policy.faceValue || ''));

        if (hasBeneficiary) {
          const beneficiary = matchToOption(beneficiaryOpts, String(policy.beneficiary || ''));
          if (beneficiary.value) {
            setIfEmpty(`${policyKey}Beneficiary`, beneficiary.value);
            if (beneficiary.otherText) setIfEmpty(`${policyKey}BeneficiaryOther`, beneficiary.otherText);
          }
        }

        setIfEmpty(`${policyKey}DocLocation`, String(policy.documentLocation || ''));
      };

      const processType = (
        gateKey: string,
        policyPrefix: string,
        policies: Array<Record<string, unknown>>,
        hasBeneficiary: boolean
      ) => {
        if (policies.length === 0) return;
        setIfEmpty(gateKey, 'yes');
        const maxFill = Math.min(policies.length, 4);
        for (let i = 0; i < maxFill; i++) {
          fillPolicy(`${policyPrefix}${i + 1}`, policies[i], hasBeneficiary);
          if (i < maxFill - 1) {
            setIfEmpty(`${policyPrefix}${i + 1}HasAdditional`, 'yes');
          }
        }
      };

      processType(`${prefix}HasLifeInsurance`, `${prefix}LifePolicy`, lifePolicies, true);
      processType(`${prefix}HasCriticalIllnessInsurance`, `${prefix}CiPolicy`, ciPolicies, false);
      processType(`${prefix}HasDisabilityInsurance`, `${prefix}DiPolicy`, diPolicies, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, allAnswers?.get('corporations')]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const basicAnswers = allAnswers?.get('aboutYou') || {};
    const numberOfChildren = basicAnswers['numberOfChildren'];
    const client1NumberOfPreviousRelationships = basicAnswers['client1NumberOfPreviousRelationships'];
    const client2NumberOfPreviousRelationships = basicAnswers['client2NumberOfPreviousRelationships'];

    if (step.sectionId === 'previousRelationships') {
      const client1Count = client1NumberOfPreviousRelationships ? parseInt(client1NumberOfPreviousRelationships as string) : 0;
      const client2Count = client2NumberOfPreviousRelationships ? parseInt(client2NumberOfPreviousRelationships as string) : 0;
      const totalCount = client1Count + client2Count;

      if (totalCount > 0) {
        const client1PreviousRelationshipsData = answers['client1PreviousRelationshipsData'] as Array<Record<string, string>> | undefined;
        const client2PreviousRelationshipsData = answers['client2PreviousRelationshipsData'] as Array<Record<string, string>> | undefined;

        if (client1Count > 0) {
          if (!client1PreviousRelationshipsData || client1PreviousRelationshipsData.length < client1Count) {
            setValidationError('Please fill in details for all previous relationships.');
            return;
          }

          for (let i = 0; i < client1Count; i++) {
            const relationship = client1PreviousRelationshipsData[i];
            if (!relationship?.name) {
              setValidationError(`Please fill in the name for previous relationship ${i + 1}.`);
              return;
            }
            if (relationship?.hasSpousalSupport === 'yes' && !relationship?.spousalSupportType) {
              setValidationError(`Please specify if you are paying or receiving spousal support for relationship ${i + 1}.`);
              return;
            }
          }
        }

        if (client2Count > 0) {
          if (!client2PreviousRelationshipsData || client2PreviousRelationshipsData.length < client2Count) {
            setValidationError('Please fill in details for all previous relationships.');
            return;
          }

          for (let i = 0; i < client2Count; i++) {
            const relationship = client2PreviousRelationshipsData[i];
            if (!relationship?.name) {
              setValidationError(`Please fill in the name for previous relationship ${i + 1}.`);
              return;
            }
            if (relationship?.hasSpousalSupport === 'yes' && !relationship?.spousalSupportType) {
              setValidationError(`Please specify if paying or receiving spousal support for relationship ${i + 1}.`);
              return;
            }
          }
        }
      }
    } else if (step.sectionId === 'children') {
      if (!numberOfChildren) {
        setValidationError('Please go back and specify number of children.');
        return;
      }

      const childCount = numberOfChildren === '6+' ? 6 : parseInt(numberOfChildren as string);
      const childrenData = answers['childrenData'] as Array<Record<string, string>> | undefined;

      if (!childrenData || childrenData.length < childCount) {
        setValidationError('Please fill in details for all children.');
        return;
      }

      for (let i = 0; i < childCount; i++) {
        const child = childrenData[i];
        if (!child?.name || !child?.dateOfBirth) {
          setValidationError(`Please fill in name and date of birth for child ${i + 1}.`);
          return;
        }
      }
    } else if (step.sectionId === 'familyTrusts') {
      if (answers['hasFamilyTrust'] === 'yes') {
        const trusts = answers['familyTrustsData'] as Array<Record<string, unknown>> | undefined;
        if (trusts && trusts.length > 0) {
          for (let i = 0; i < trusts.length; i++) {
            const trust = trusts[i];
            if (!trust?.legalName) {
              setValidationError(`Please fill in the legal name for Family Trust ${i + 1}.`);
              return;
            }
          }
        }
      }
    } else if (step.sectionId === 'corporations') {
      const corporationsData = answers['corporationsData'] as Array<Record<string, string>> | undefined;
      if (corporationsData && corporationsData.length > 0) {
        for (let i = 0; i < corporationsData.length; i++) {
            const corporation = corporationsData[i];
            if (!corporation?.legalName) {
              setValidationError(`Please fill in the legal name for corporation ${i + 1}.`);
              return;
            }
            if (!corporation?.incorporatedInCanada) {
              setValidationError(`Please specify if corporation ${i + 1} was incorporated in Canada.`);
              return;
            }
            if (!corporation?.jurisdiction) {
              setValidationError(`Please specify the jurisdiction for corporation ${i + 1}.`);
              return;
            }
            if (!corporation?.corporationType) {
              setValidationError(`Please select the type for corporation ${i + 1}.`);
              return;
            }
            if (corporation?.corporationType === 'Other' && !corporation?.corporationTypeOther) {
              setValidationError(`Please describe the corporation type for corporation ${i + 1}.`);
              return;
            }
            if (!corporation?.owners || corporation.owners.trim() === '') {
              setValidationError(`Please select at least one owner for corporation ${i + 1}.`);
              return;
            }

            // Validate "Other" owners if the checkbox is checked
            if (corporation?.hasOtherOwner === 'true') {
              const otherOwnersData: Array<{ type: string; name: string }> = corporation?.otherOwners ? JSON.parse(corporation.otherOwners) : [];
              if (otherOwnersData.length === 0 || otherOwnersData.some((owner: { type: string; name: string }) => !owner.type || !owner.name || owner.name.trim() === '')) {
                setValidationError(`Please complete all "Other" owner details for corporation ${i + 1}.`);
                return;
              }
              if (corporation.otherOwnersDone !== 'no') {
                setValidationError(`Please confirm whether there are additional owners for corporation ${i + 1}.`);
                return;
              }
            }
            // Validate ownership percentages for all selected owners
            const allOwnersList = (corporation?.owners || '').split(',').filter(Boolean);
            const showPct = allOwnersList.length > 0 && (!corporation?.hasOtherOwner || corporation?.hasOtherOwner !== 'true' || corporation?.otherOwnersDone === 'no');
            if (showPct) {
              const shareClasses: string[] = corporation?.shareClasses
                ? (typeof corporation.shareClasses === 'string' ? JSON.parse(corporation.shareClasses) : corporation.shareClasses)
                : [''];
              const shareClassPercentages: Record<string, string>[] = corporation?.shareClassPercentages
                ? (typeof corporation.shareClassPercentages === 'string' ? JSON.parse(corporation.shareClassPercentages) : corporation.shareClassPercentages)
                : [{}];
              for (let ci = 0; ci < shareClasses.length; ci++) {
                const pcts = shareClassPercentages[ci] || {};
                const total = allOwnersList.reduce((sum, name) => sum + (parseFloat(pcts[name] || '0') || 0), 0);
                if (Math.abs(total - 100) > 0.01) {
                  const classLabel = shareClasses[ci] || `Share Class ${ci + 1}`;
                  setValidationError(`${classLabel} ownership for corporation ${i + 1} must total 100% (currently ${total}%).`);
                  return;
                }
              }
            }
          }
        }
    } else {
      const requiredQuestions = step.questions.filter((q) => {
        if (!q.required) return false;
        if (q.condition && typeof q.condition === 'function') {
          const allFormData = Object.fromEntries(
            Array.from(allAnswers?.entries() || []).flatMap(([_, stepAnswers]) =>
              Object.entries(stepAnswers)
            )
          );
          return q.condition(allFormData);
        }
        return true;
      });
      const missingAnswers = requiredQuestions.filter((q) => !answers[q.key]);

      if (missingAnswers.length > 0) {
        setValidationError('Please answer all required questions before continuing.');
        return;
      }
    }

    onNext();
  };

  const numberOfChildren = allAnswers?.get('aboutYou')?.['numberOfChildren'];
  const childCount = numberOfChildren ? (numberOfChildren === '6+' ? 6 : parseInt(numberOfChildren as string)) : 0;
  const childrenData = (answers['childrenData'] as Array<Record<string, string>>) || Array(Math.max(0, childCount || 0)).fill(null).map(() => ({}));
  const planningPersons = (answers['planningPersons'] as Array<PlanningPerson>) || [];

  const handlePlanningPersonsChange = (persons: PlanningPerson[]) => {
    onAnswerChange('planningPersons', persons);
  };

  const getChildClassification = (child: Record<string, string> | undefined): 'minor' | 'independent_adult' | 'adult_dependant' => {
    if (!child?.dateOfBirth) return 'minor';
    const step1 = allAnswers?.get('aboutYou') || {};
    const province = ((step1['province'] as string) || '').toLowerCase();
    const higherMajority = ['bc', 'british columbia', 'nova scotia', 'new brunswick', 'newfoundland', 'nl', 'ns', 'nb'];
    const ageOfMajority = higherMajority.some(p => province.includes(p)) ? 19 : 18;
    const birth = new Date(child.dateOfBirth);
    const today = new Date();
    const age = (today.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < ageOfMajority) return 'minor';
    const isDisabled = child.disabled === 'yes' || child.disabled === 'not_sure';
    const isIndependent = child.independent === 'yes';
    if (isIndependent && !isDisabled) return 'independent_adult';
    return 'adult_dependant';
  };

  const minorIndices = childrenData
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => getChildClassification(c) === 'minor')
    .map(({ i }) => i);

  const client1NumberOfPreviousRelationships = allAnswers?.get('aboutYou')?.['client1NumberOfPreviousRelationships'];
  const client1PrevRelCount = client1NumberOfPreviousRelationships ? parseInt(client1NumberOfPreviousRelationships as string) : 0;
  const client1PreviousRelationshipsData = (answers['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || Array(Math.max(0, client1PrevRelCount || 0)).fill(null).map(() => ({}));

  const client2NumberOfPreviousRelationships = allAnswers?.get('aboutYou')?.['client2NumberOfPreviousRelationships'];
  const client2PrevRelCount = client2NumberOfPreviousRelationships ? parseInt(client2NumberOfPreviousRelationships as string) : 0;
  const client2PreviousRelationshipsData = (answers['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || Array(Math.max(0, client2PrevRelCount || 0)).fill(null).map(() => ({}));

  const CARE_COORD_CATEGORIES = ['family', 'school', 'doctor', 'other'] as const;

  const clearCareCoordCategory = (obj: Record<string, string>, cat: string) => {
    delete obj[`careCoord_${cat}_count`];
    for (let i = 0; i < 10; i++) {
      delete obj[`careCoord_${cat}_${i}_name`];
      delete obj[`careCoord_${cat}_${i}_phone`];
      delete obj[`careCoord_${cat}_${i}_email`];
      delete obj[`careCoord_${cat}_${i}_city`];
      delete obj[`careCoord_${cat}_${i}_province`];
      delete obj[`careCoord_${cat}_${i}_role`];
    }
  };

  const clearCareCoordFromPrefix = (obj: Record<string, string>, prefix: string) => {
    const cat = prefix.replace('careCoord_', '').replace('_', '');
    const count = parseInt(obj[`${prefix}_count`] || '1');
    for (let i = 1; i < count; i++) {
      delete obj[`${prefix}_${i}_name`];
      delete obj[`${prefix}_${i}_phone`];
      delete obj[`${prefix}_${i}_email`];
      delete obj[`${prefix}_${i}_city`];
      delete obj[`${prefix}_${i}_province`];
      delete obj[`${prefix}_${i}_role`];
    }
    obj[`${prefix}_count`] = '1';
  };

  const clearCareCoordFields = (obj: Record<string, string>) => {
    delete obj.careCoordinators;
    delete obj.careCoordSiblingNames;
    CARE_COORD_CATEGORIES.forEach(cat => clearCareCoordCategory(obj, cat));
  };

  const handleRemoveCareCoordEntry = (childIndex: number, cat: string, removeAt: number) => {
    const updated = [...childrenData];
    const obj = { ...updated[childIndex] };
    const countField = `careCoord_${cat}_count`;
    const additionalField = `careCoord_${cat}_additional`;
    const count = parseInt(obj[countField] || '1');
    const fields = ['name', 'phone', 'email', 'city', 'province', 'role'];
    for (let i = removeAt; i < count - 1; i++) {
      fields.forEach(f => {
        const val = obj[`careCoord_${cat}_${i + 1}_${f}`];
        if (val !== undefined) obj[`careCoord_${cat}_${i}_${f}`] = val;
        else delete obj[`careCoord_${cat}_${i}_${f}`];
      });
    }
    fields.forEach(f => delete obj[`careCoord_${cat}_${count - 1}_${f}`]);
    const newCount = count - 1;
    obj[countField] = String(newCount);
    if (newCount <= 1) obj[additionalField] = 'no';
    updated[childIndex] = obj;
    onAnswerChange('childrenData', updated);
  };

  const buildPrefilledContacts = (childIndex: number): { id: string; name: string; phone: string; email: string; city: string; province: string; source: string }[] => {
    const child = childrenData[childIndex] || {};
    const contacts: { id: string; name: string; phone: string; email: string; city: string; province: string; source: string }[] = [];
    const seenNames = new Set<string>();

    const addContact = (c: { id: string; name: string; phone?: string; email?: string; city?: string; province?: string; source: string }) => {
      const trimmed = (c.name || '').trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (seenNames.has(key)) return;
      seenNames.add(key);
      contacts.push({ id: c.id, name: trimmed, phone: c.phone || '', email: c.email || '', city: c.city || '', province: c.province || '', source: c.source });
    };

    const step1 = allAnswers?.get('aboutYou') || {};
    const step2 = allAnswers?.get('previousRelationships') || {};
    const step4 = allAnswers?.get('familyTrusts') || {};
    const step7 = allAnswers?.get('corporateFinancialConnections') || {};
    const step14 = allAnswers?.get('legacyIntent') || {};
    const hasSpouse = step1['maritalStatus'] === 'married' || step1['maritalStatus'] === 'common_law';

    // Parents/clients are NOT guardian candidates — the "if you were no longer
    // able to provide care" scenario logically excludes them. They are still
    // added as general contacts for non-guardian purposes (care coordinators,
    // transition people, etc.) but filtered out when building guardian options.
    const po = child.parentsOption || '';
    if (po === 'both' || po === 'parent1' || po === 'client1-other') {
      addContact({ id: 'parent1', name: step1['fullName'] as string || '', phone: step1['phone'] as string || '', email: step1['email'] as string || '', city: step1['city'] as string || '', province: step1['province'] as string || '', source: 'parent1' });
    }
    if (hasSpouse && (po === 'both' || po === 'parent2' || po === 'client2-other')) {
      addContact({ id: 'parent2', name: step1['spouseName'] as string || '', phone: step1['spousePhone'] as string || '', email: step1['spouseEmail'] as string || '', city: step1['spouseCity'] as string || '', province: step1['spouseProvince'] as string || '', source: 'parent2' });
    }
    if ((po === 'client1-other' || po === 'client2-other') && child.otherParentName && child.otherParentDeceased !== 'yes') {
      addContact({ id: 'otherparent', name: child.otherParentName, source: 'otherparent' });
    }

    if (child.careCoordinators) {
      const selected = child.careCoordinators.split(',').filter(Boolean);

      if (selected.includes('sibling') && child.careCoordSiblingNames) {
        child.careCoordSiblingNames.split(',').map(s => s.trim()).filter(Boolean).forEach((sibName, si) => {
          addContact({ id: `sibling_${si}`, name: sibName, source: 'sibling' });
        });
      }

      CARE_COORD_CATEGORIES.forEach(cat => {
        if (!selected.includes(cat)) return;
        const count = parseInt(child[`careCoord_${cat}_count`] || '1');
        for (let ci = 0; ci < count; ci++) {
          addContact({
            id: `${cat}_${ci}`,
            name: child[`careCoord_${cat}_${ci}_name`],
            phone: child[`careCoord_${cat}_${ci}_phone`] || '',
            email: child[`careCoord_${cat}_${ci}_email`] || '',
            city: child[`careCoord_${cat}_${ci}_city`] || '',
            province: child[`careCoord_${cat}_${ci}_province`] || '',
            source: cat,
          });
        }
      });
    }

    // Past relationships (former partners)
    const c1PrevRels = (step2['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
    c1PrevRels.forEach((r, i) => addContact({ id: `c1prevrel_${i}`, name: r?.name || '', source: 'prevrel1' }));
    const c2PrevRels = (step2['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
    c2PrevRels.forEach((r, i) => addContact({ id: `c2prevrel_${i}`, name: r?.name || '', source: 'prevrel2' }));

    // Estate trustees / executors
    addContact({ id: 'c1et', name: resolvePersonNameField(step14['client1EstateTrusteeName']) || '', phone: step14['client1EstateTrusteePhone'] as string || '', email: step14['client1EstateTrusteeEmail'] as string || '', city: step14['client1EstateTrusteeCity'] as string || '', province: step14['client1EstateTrusteeProvince'] as string || '', source: 'et1' });
    addContact({ id: 'c2et', name: resolvePersonNameField(step14['client2EstateTrusteeName']) || '', phone: step14['client2EstateTrusteePhone'] as string || '', email: step14['client2EstateTrusteeEmail'] as string || '', city: step14['client2EstateTrusteeCity'] as string || '', province: step14['client2EstateTrusteeProvince'] as string || '', source: 'et2' });
    const c1EtData = (step14['client1EstateTrusteeData'] as Array<Record<string, string>>) || [];
    c1EtData.forEach((r, i) => addContact({ id: `c1etalt_${i}`, name: r?.name || '', phone: r?.phone || '', email: r?.email || '', city: r?.city || '', province: r?.province || '', source: 'et1' }));
    const c2EtData = (step14['client2EstateTrusteeData'] as Array<Record<string, string>>) || [];
    c2EtData.forEach((r, i) => addContact({ id: `c2etalt_${i}`, name: r?.name || '', phone: r?.phone || '', email: r?.email || '', city: r?.city || '', province: r?.province || '', source: 'et2' }));

    // Power of Attorney — Personal Care
    addContact({ id: 'c1poapc', name: resolvePersonNameField(step14['client1PoaPersonalCareName']) || '', phone: step14['client1PoaPersonalCarePhone'] as string || '', email: step14['client1PoaPersonalCareEmail'] as string || '', city: step14['client1PoaPersonalCareCity'] as string || '', province: step14['client1PoaPersonalCareProvince'] as string || '', source: 'poapc1' });
    addContact({ id: 'c2poapc', name: resolvePersonNameField(step14['client2PoaPersonalCareName']) || '', phone: step14['client2PoaPersonalCarePhone'] as string || '', email: step14['client2PoaPersonalCareEmail'] as string || '', city: step14['client2PoaPersonalCareCity'] as string || '', province: step14['client2PoaPersonalCareProvince'] as string || '', source: 'poapc2' });
    const c1PoaPcAlt = (step14['client1AlternatePoaPersonalCareData'] as Array<Record<string, string>>) || [];
    c1PoaPcAlt.forEach((r, i) => addContact({ id: `c1poapcalt_${i}`, name: r?.name || '', phone: r?.phone || '', email: r?.email || '', city: r?.city || '', province: r?.province || '', source: 'poapc1' }));
    const c2PoaPcAlt = (step14['client2AlternatePoaPersonalCareData'] as Array<Record<string, string>>) || [];
    c2PoaPcAlt.forEach((r, i) => addContact({ id: `c2poapcalt_${i}`, name: r?.name || '', phone: r?.phone || '', email: r?.email || '', city: r?.city || '', province: r?.province || '', source: 'poapc2' }));

    // Power of Attorney — Property
    addContact({ id: 'c1poaprop', name: step14['client1PoaPropertyName'] as string || '', phone: step14['client1PoaPropertyPhone'] as string || '', email: step14['client1PoaPropertyEmail'] as string || '', city: step14['client1PoaPropertyCity'] as string || '', province: step14['client1PoaPropertyProvince'] as string || '', source: 'poaprop1' });
    addContact({ id: 'c2poaprop', name: step14['client2PoaPropertyName'] as string || '', phone: step14['client2PoaPropertyPhone'] as string || '', email: step14['client2PoaPropertyEmail'] as string || '', city: step14['client2PoaPropertyCity'] as string || '', province: step14['client2PoaPropertyProvince'] as string || '', source: 'poaprop2' });
    const c1PoaPropAlt = (step14['client1AlternatePoaPropertyData'] as Array<Record<string, string>>) || [];
    c1PoaPropAlt.forEach((r, i) => addContact({ id: `c1poapropalt_${i}`, name: r?.name || '', phone: r?.phone || '', email: r?.email || '', city: r?.city || '', province: r?.province || '', source: 'poaprop1' }));
    const c2PoaPropAlt = (step14['client2AlternatePoaPropertyData'] as Array<Record<string, string>>) || [];
    c2PoaPropAlt.forEach((r, i) => addContact({ id: `c2poapropalt_${i}`, name: r?.name || '', phone: r?.phone || '', email: r?.email || '', city: r?.city || '', province: r?.province || '', source: 'poaprop2' }));

    // Trust beneficiaries
    for (let t = 1; t <= 4; t++) {
      const benData = (step4[`trust${t}BeneficiariesData`] as Array<Record<string, string>>) || [];
      benData.forEach((r, i) => addContact({ id: `trust${t}ben_${i}`, name: r?.beneficiaryName || '', phone: r?.phoneNumber || '', email: r?.emailAddress || '', source: 'trustben' }));
    }

    // Adult children (from childrenData — other children who could be caregivers)
    (childrenData || []).forEach((sib, si) => {
      if (si === childIndex) return;
      const sibName = (sib?.name || '').trim();
      if (!sibName) return;
      const dob = sib?.dateOfBirth || '';
      const today = new Date();
      let isAdult = true;
      if (dob) {
        const birth = new Date(dob);
        const age = today.getFullYear() - birth.getFullYear();
        isAdult = age >= 18;
      }
      if (isAdult) {
        addContact({ id: `sibchild_${si}`, name: sibName, source: 'adultchild' });
      }
    });

    return contacts;
  };

  const getPrefilledContact = (childIndex: number, contactId: string) => {
    const contacts = buildPrefilledContacts(childIndex);
    return contacts.find(c => c.id === contactId);
  };

  const clearFutureCareTeamFields = (obj: Record<string, string>) => {
    delete obj.futureCareTeamSelection;
    delete obj.futureCareTeamResponsibility;
    for (let i = 0; i < 20; i++) {
      delete obj[`futureCareTeam_${i}_name`];
      delete obj[`futureCareTeam_${i}_phone`];
      delete obj[`futureCareTeam_${i}_email`];
      delete obj[`futureCareTeam_${i}_city`];
      delete obj[`futureCareTeam_${i}_province`];
      delete obj[`futureCareTeam_${i}_relationship`];
      delete obj[`futureCareTeam_${i}_spoken`];
    }
    delete obj.futureCareTeamOtherCount;
    for (let i = 0; i < 20; i++) {
      delete obj[`futureCareTeamOther_${i}_name`];
      delete obj[`futureCareTeamOther_${i}_phone`];
      delete obj[`futureCareTeamOther_${i}_email`];
      delete obj[`futureCareTeamOther_${i}_city`];
      delete obj[`futureCareTeamOther_${i}_province`];
      delete obj[`futureCareTeamOther_${i}_relationship`];
      delete obj[`futureCareTeamOther_${i}_spoken`];
    }
    delete obj.futureCareTeamExtra;
    delete obj.futureCareTeamExtraCount;
    delete obj.futureCareTeamExtraAdditional;
    for (let i = 0; i < 20; i++) {
      delete obj[`futureCareTeamExtra_${i}_name`];
      delete obj[`futureCareTeamExtra_${i}_phone`];
      delete obj[`futureCareTeamExtra_${i}_email`];
      delete obj[`futureCareTeamExtra_${i}_city`];
      delete obj[`futureCareTeamExtra_${i}_province`];
      delete obj[`futureCareTeamExtra_${i}_relationship`];
      delete obj[`futureCareTeamExtra_${i}_spoken`];
    }
    delete obj.carePlanWritten;
    delete obj.carePlanStored;
    delete obj.carePlanWorries;
    delete obj.carePlanWorriesOther;
    delete obj.disabilitySupports;
    delete obj.disabilitySupportsList;
    delete obj.disabilitySupportsOther;
    delete obj.supportLocationDependent;
    delete obj.supportLocationDependentDetails;
    delete obj.futureCaregiverSupport;
  };

  const handleRemoveFutureCareTeamOther = (childIndex: number, removeAt: number) => {
    const updated = [...childrenData];
    const obj = { ...updated[childIndex] };
    const count = parseInt(obj.futureCareTeamOtherCount || '0');
    const fields = ['name', 'phone', 'email', 'city', 'province', 'relationship', 'spoken'];
    for (let i = removeAt; i < count - 1; i++) {
      fields.forEach(f => {
        const val = obj[`futureCareTeamOther_${i + 1}_${f}`];
        if (val !== undefined) obj[`futureCareTeamOther_${i}_${f}`] = val;
        else delete obj[`futureCareTeamOther_${i}_${f}`];
      });
    }
    fields.forEach(f => delete obj[`futureCareTeamOther_${count - 1}_${f}`]);
    const newCount = count - 1;
    obj.futureCareTeamOtherCount = String(newCount);
    updated[childIndex] = obj;
    onAnswerChange('childrenData', updated);
  };

  const handleRemoveFutureCareTeamExtra = (childIndex: number, removeAt: number) => {
    const updated = [...childrenData];
    const obj = { ...updated[childIndex] };
    const count = parseInt(obj.futureCareTeamExtraCount || '0');
    const fields = ['name', 'phone', 'email', 'city', 'province', 'relationship', 'spoken'];
    for (let i = removeAt; i < count - 1; i++) {
      fields.forEach(f => {
        const val = obj[`futureCareTeamExtra_${i + 1}_${f}`];
        if (val !== undefined) obj[`futureCareTeamExtra_${i}_${f}`] = val;
        else delete obj[`futureCareTeamExtra_${i}_${f}`];
      });
    }
    fields.forEach(f => delete obj[`futureCareTeamExtra_${count - 1}_${f}`]);
    const newCount = count - 1;
    obj.futureCareTeamExtraCount = String(newCount);
    if (newCount <= 0) {
      obj.futureCareTeamExtra = 'no';
      obj.futureCareTeamExtraAdditional = undefined;
    }
    updated[childIndex] = obj;
    onAnswerChange('childrenData', updated);
  };

  const handleChildMultiChange = (index: number, fields: Record<string, string>) => {
    const updated = [...childrenData];
    if (!updated[index]) {
      updated[index] = {};
    }
    Object.entries(fields).forEach(([k, v]) => {
      if (v === '') {
        delete (updated[index] as Record<string, unknown>)[k];
      } else {
        updated[index][k] = v;
      }
    });
    onAnswerChange('childrenData', updated);
  };

  const childDisplayName = (index: number, data = childrenData): string => {
    const child = data[index];
    const name = child?.nickname || child?.name;
    return name || `Child ${index + 1} (details to come)`;
  };

  const handleChildChange = (index: number, field: string, value: string) => {
    const updated = [...childrenData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;

    if (field === 'disabled') {
      const ind = updated[index].independent || '';
      if (value === 'yes') {
        updated[index].notSureSituation = undefined;
        updated[index].notSureRelianceAreas = undefined;
        updated[index].notSureFuture = undefined;
      } else if (value === 'no') {
        updated[index].notSureSituation = undefined;
        updated[index].notSureRelianceAreas = undefined;
        updated[index].notSureFuture = undefined;
        updated[index].supportNeedTypes = undefined;
        updated[index].supportNeedOther = undefined;
        updated[index].disabilityTaxCredit = undefined;
        updated[index].disabilityTaxCreditDocLocation = undefined;
        clearCareCoordFields(updated[index]);
        updated[index].futureIndependenceLevel = undefined;
        updated[index].futureFinancialHelp = undefined;
        updated[index].futurePersonalHealthHelp = undefined;
        clearFutureCareTeamFields(updated[index]);
      } else if (value === 'not_sure') {
        updated[index].supportNeedTypes = undefined;
        updated[index].supportNeedOther = undefined;
        updated[index].disabilityTaxCredit = undefined;
        updated[index].disabilityTaxCreditDocLocation = undefined;
        clearCareCoordFields(updated[index]);
        clearFutureCareTeamFields(updated[index]);
      }
    }

    if (field === 'independent') {
      const dis = updated[index].disabled || '';
      if (dis === 'no') {
        updated[index].supportNeedTypes = undefined;
        updated[index].supportNeedOther = undefined;
        updated[index].disabilityTaxCredit = undefined;
        updated[index].disabilityTaxCreditDocLocation = undefined;
        clearCareCoordFields(updated[index]);
        updated[index].futureIndependenceLevel = undefined;
        updated[index].futureFinancialHelp = undefined;
        updated[index].futurePersonalHealthHelp = undefined;
        clearFutureCareTeamFields(updated[index]);
      }
    }

    if (field === 'disabilityTaxCredit' && value !== 'yes' && value !== 'in-progress') {
      updated[index].disabilityTaxCreditDocLocation = undefined;
    }

    if (field === 'careCoordinators') {
      const newVals = value.split(',').filter(Boolean);
      const oldVals = (updated[index].careCoordinators || '').split(',').filter(Boolean);
      const removed = oldVals.filter(v => !newVals.includes(v));
      removed.forEach(cat => clearCareCoordCategory(updated[index], cat));
      if (!newVals.includes('sibling')) {
        updated[index].careCoordSiblingNames = undefined;
      }
    }

    if (field.startsWith('careCoord') && field.endsWith('Additional') && value === 'no') {
      const prefix = field.replace('Additional', '');
      clearCareCoordFromPrefix(updated[index], prefix);
    }

    if (field === 'futureIndependenceLevel' && (value === 'likely_independent' || value === 'too_early')) {
      updated[index].futureFinancialHelp = undefined;
      updated[index].futurePersonalHealthHelp = undefined;
    }

    if (field === 'medications' && value === 'no') {
      updated[index].medicationList = undefined;
    }

    if (field === 'otherParentDeceased' && value === 'yes') {
      const opName = (updated[index].otherParentName || '').trim();
      if (opName) {
        if (updated[index].careCoordinators) {
          const ccList = updated[index].careCoordinators.split(',').filter(v => v !== 'otherparent');
          updated[index].careCoordinators = ccList.length > 0 ? ccList.join(',') : undefined;
        }
        if (updated[index].futureCareTeamSelection) {
          const fctList = updated[index].futureCareTeamSelection.split(',').map(s => s.trim()).filter(s => s !== opName);
          updated[index].futureCareTeamSelection = fctList.length > 0 ? fctList.join(',') : undefined;
        }
      }
    }

    if (field === 'allergies' && value === 'no') {
      updated[index].allergyList = undefined;
      updated[index].allergyMedication = undefined;
      updated[index].allergyMedicationDescription = undefined;
    }

    if (field === 'medicalIssues' && value === 'no') {
      updated[index].medicalIssuesDescription = undefined;
    }

    if (field === 'attendingSchool' && value === 'yes') {
      updated[index].additionalEducationInfo = undefined;
      updated[index].additionalEducationDetails = undefined;
    }

    if (field === 'attendingSchool' && value === 'no') {
      updated[index].schoolName = undefined;
      updated[index].schoolPhone = undefined;
      updated[index].schoolAddress = undefined;
      updated[index].schoolWebsite = undefined;
      updated[index].currentGrade = undefined;
      updated[index].schoolStrengths = undefined;
      updated[index].schoolExtraSupport = undefined;
      updated[index].schoolFocusHelps = undefined;
      updated[index].schoolDistractions = undefined;
      updated[index].schoolCalmingStrategies = undefined;
      updated[index].hasIEP = undefined;
      updated[index].individualEducationPlan = undefined;
      updated[index].iepDocumentLocation = undefined;
      updated[index].schoolActivitiesImportant = undefined;
      updated[index].homeworkRoutines = undefined;
      updated[index].educationHopes = undefined;
      updated[index].learningStyleNotes = undefined;
      updated[index].behaviouralConsiderations = undefined;
      updated[index].educationAdditionalDetails = undefined;
    }

    if (field === 'additionalEducationInfo' && value === 'no') {
      updated[index].additionalEducationDetails = undefined;
    }

    if (field === 'hasIEP' && value === 'no') {
      updated[index].individualEducationPlan = undefined;
      updated[index].iepDocumentLocation = undefined;
    }

    const clearGuardianFields = (obj: Record<string, string>) => {
      obj.guardianConsidered = undefined;
      obj.guardianSameAsSibling = undefined;
      obj.guardianPersonId = undefined;
      obj.guardianPersonId2 = undefined;
      obj.guardianSpokenWith = undefined;
      obj.guardianInWill = undefined;
      obj.guardianNotes = undefined;
      obj.guardianAppliesTo = undefined;
      obj.alternateGuardianConsidered = undefined;
      obj.alternateGuardianPersonId = undefined;
      obj.alternateGuardianSpokenWith = undefined;
      obj.alternateGuardianInWill = undefined;
      obj.alternateGuardianNotes = undefined;
    };

    const clearSupportLeadFields = (obj: Record<string, string>) => {
      obj.supportLeadConsidered = undefined;
      obj.supportLeadPersonId = undefined;
      obj.supportLeadSpokenWith = undefined;
      obj.supportLeadNotes = undefined;
    };

    if (field === 'dateOfBirth' || field === 'independent' || field === 'disabled') {
      const newClassification = getChildClassification(updated[index]);
      const oldClassification = getChildClassification(childrenData[index]);
      if (newClassification !== oldClassification) {
        if (newClassification === 'independent_adult') {
          clearGuardianFields(updated[index]);
          clearSupportLeadFields(updated[index]);
        } else if (newClassification === 'minor') {
          clearSupportLeadFields(updated[index]);
        } else if (newClassification === 'adult_dependant') {
          clearGuardianFields(updated[index]);
        }
      }
    }

    onAnswerChange('childrenData', updated);
  };

  const handleClient1PrevRelChange = (index: number, field: string, value: string) => {
    const updated = [...client1PreviousRelationshipsData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client1PreviousRelationshipsData', updated);
  };

  const handleClient2PrevRelChange = (index: number, field: string, value: string) => {
    const updated = [...client2PreviousRelationshipsData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client2PreviousRelationshipsData', updated);
  };

  const client1PensionsData = (answers['client1PensionsData'] as Array<Record<string, string>>) || [];
  const client2PensionsData = (answers['client2PensionsData'] as Array<Record<string, string>>) || [];

  const handleClient1PensionChange = (index: number, field: string, value: string) => {
    const updated = [...client1PensionsData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client1PensionsData', updated);
  };

  const handleClient2PensionChange = (index: number, field: string, value: string) => {
    const updated = [...client2PensionsData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client2PensionsData', updated);
  };

  const addClient1Pension = () => {
    const updated = [...client1PensionsData, {}];
    onAnswerChange('client1PensionsData', updated);
  };

  const addClient2Pension = () => {
    const updated = [...client2PensionsData, {}];
    onAnswerChange('client2PensionsData', updated);
  };

  const removeClient1Pension = (index: number) => {
    const updated = client1PensionsData.filter((_, i) => i !== index);
    onAnswerChange('client1PensionsData', updated);
  };

  const removeClient2Pension = (index: number) => {
    const updated = client2PensionsData.filter((_, i) => i !== index);
    onAnswerChange('client2PensionsData', updated);
  };

  const client1PoaPersonalCareCount = parseInt(answers['client1PoaPersonalCareCount'] as string) || 0;
  const client1PoaPersonalCareData = (answers['client1PoaPersonalCareData'] as Array<Record<string, string>>) || Array(Math.max(0, client1PoaPersonalCareCount || 0)).fill(null).map(() => ({}));

  const handlePoaPersonalCareChange = (index: number, field: string, value: string) => {
    const updated = [...client1PoaPersonalCareData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client1PoaPersonalCareData', updated);
  };

  const client1AlternatePoaPersonalCareCount = parseInt(answers['client1AlternatePoaPersonalCareCount'] as string) || 0;
  const client1AlternatePoaPersonalCareData = (answers['client1AlternatePoaPersonalCareData'] as Array<Record<string, string>>) || Array(Math.max(0, client1AlternatePoaPersonalCareCount || 0)).fill(null).map(() => ({}));

  const handleAlternatePoaPersonalCareChange = (index: number, field: string, value: string) => {
    const updated = [...client1AlternatePoaPersonalCareData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client1AlternatePoaPersonalCareData', updated);
  };

  const client2AlternatePoaPersonalCareCount = parseInt(answers['client2AlternatePoaPersonalCareCount'] as string) || 0;
  const client2AlternatePoaPersonalCareData = (answers['client2AlternatePoaPersonalCareData'] as Array<Record<string, string>>) || Array(Math.max(0, client2AlternatePoaPersonalCareCount || 0)).fill(null).map(() => ({}));

  const handleClient2AlternatePoaPersonalCareChange = (index: number, field: string, value: string) => {
    const updated = [...client2AlternatePoaPersonalCareData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client2AlternatePoaPersonalCareData', updated);
  };

  const client1PoaPropertyCount = parseInt(answers['client1PoaPropertyCount'] as string) || 0;
  const client1PoaPropertyData = (answers['client1PoaPropertyData'] as Array<Record<string, string>>) || Array(Math.max(0, client1PoaPropertyCount || 0)).fill(null).map(() => ({}));

  const handlePoaPropertyChange = (index: number, field: string, value: string) => {
    const updated = [...client1PoaPropertyData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client1PoaPropertyData', updated);
  };

  const client2PoaPersonalCareCount = parseInt(answers['client2PoaPersonalCareCount'] as string) || 0;
  const client2PoaPersonalCareData = (answers['client2PoaPersonalCareData'] as Array<Record<string, string>>) || Array(Math.max(0, client2PoaPersonalCareCount || 0)).fill(null).map(() => ({}));

  const handleClient2PoaPersonalCareChange = (index: number, field: string, value: string) => {
    const updated = [...client2PoaPersonalCareData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client2PoaPersonalCareData', updated);
  };

  const client2PoaPropertyCount = parseInt(answers['client2PoaPropertyCount'] as string) || 0;
  const client2PoaPropertyData = (answers['client2PoaPropertyData'] as Array<Record<string, string>>) || Array(Math.max(0, client2PoaPropertyCount || 0)).fill(null).map(() => ({}));

  const handleClient2PoaPropertyChange = (index: number, field: string, value: string) => {
    const updated = [...client2PoaPropertyData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('client2PoaPropertyData', updated);
  };

  const step1Answers = allAnswers?.get('aboutYou') || {};
  const familyMembers: Array<{ id: string; name: string; relationship: string }> = [];
  const client1Name = (step1Answers['fullName'] as string) || '';
  if (client1Name.trim()) {
    familyMembers.push({ id: 'client1', name: client1Name, relationship: 'Client 1' });
  }
  const maritalStatus = step1Answers['maritalStatus'] as string;
  if (maritalStatus === 'married' || maritalStatus === 'common_law') {
    const spouseName = (step1Answers['spouseName'] as string) || '';
    if (spouseName.trim()) {
      familyMembers.push({ id: 'spouse', name: spouseName, relationship: 'Spouse' });
    }
  }
  const step3ChildrenData = ((allAnswers?.get('children') || {})['childrenData'] as Array<Record<string, string>>) || [];
  step3ChildrenData.forEach((child, idx) => {
    const childName = (child['name'] as string) || '';
    if (childName.trim()) {
      familyMembers.push({ id: `child_${idx}`, name: childName, relationship: 'Child' });
    }
  });

  const numberOfCorporations = parseInt(answers['numberOfCorporations'] as string) || 0;
  const corporationsData = (answers['corporationsData'] as Array<Record<string, string>>) || Array(Math.max(0, numberOfCorporations || 0)).fill(null).map(() => ({}));

  const handleCorporationChange = (index: number, field: string, value: string) => {
    const updated = [...corporationsData];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index][field] = value;
    onAnswerChange('corporationsData', updated);
  };

  useEffect(() => {
    corporationsData.forEach((corp, index) => {
      if (corp?.legalName?.trim()) {
        getOrCreateCorpEntity(corp.legalName, 'corporation', {
          sourceSection: 'corporations',
          sourceEntityRef: `corp_${index}`,
          completionStatus: corp.incorporatedInCanada && corp.corporationType ? 'partial' : 'identified',
          metadata: {
            jurisdiction: corp.jurisdiction,
            corporationType: corp.corporationType,
          },
        });
      }
    });
  }, [corporationsData, getOrCreateCorpEntity]);

  return (
    <div>
      {step.videoUrl && (
        <VideoPlayer url={step.videoUrl} title={`${step.title} - Overview`} />
      )}

      <div className="bg-gray-800 rounded-lg shadow-md p-8 mb-6 border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-2">{step.title}</h2>
        {step.description && (
          <div className="text-gray-400 mb-6">
            {step.description.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step.sectionId === 'aboutYou' && (
            <>
              {step.questions.map((question) => {
                if (question.key === 'spouseName' && (answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law')) {
                  return null;
                }
                if (question.key === 'hasMarriageContract' && (answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law')) {
                  return null;
                }
                if (question.key === 'marriageContractLocation' && ((answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law') || answers['hasMarriageContract'] !== 'yes')) {
                  return null;
                }
                if (question.key === 'spouseSameAddress' && (answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law')) {
                  return null;
                }
                if (question.key === 'spouseDateOfBirth' && (answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law')) {
                  return null;
                }
                if (
                  (question.key === 'spouseAddress' ||
                    question.key === 'spouseCity' ||
                    question.key === 'spouseProvince' ||
                    question.key === 'spousePostalCode') &&
                  ((answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law') || answers['spouseSameAddress'] === 'yes')
                ) {
                  return null;
                }
                if (question.key === 'spouseEmail' && (answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law')) {
                  return null;
                }
                if (question.key === 'spousePhone' && (answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law')) {
                  return null;
                }
                if (question.key === 'client1NumberOfPreviousRelationships' && answers['client1HasPreviousRelationship'] !== 'yes') {
                  return null;
                }
                if (question.key === 'client2HasPreviousRelationship' && (answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law')) {
                  return null;
                }
                if (question.key === 'client2NumberOfPreviousRelationships' && ((answers['maritalStatus'] !== 'married' && answers['maritalStatus'] !== 'common_law') || answers['client2HasPreviousRelationship'] !== 'yes')) {
                  return null;
                }
                if (question.key === 'numberOfChildren' && answers['hasChildren'] !== 'yes') {
                  return null;
                }

                let customLabel = typeof question.label === 'function'
                  ? question.label(allAnswers || new Map())
                  : question.label;

                if (question.key === 'client1HasPreviousRelationship' && answers['maritalStatus'] === 'widowed') {
                  customLabel = 'Aside from your former spouse or common law partner\'s passing, have you previously been married or in a common law relationship with another person?';
                }

                const isMarriedOrCommonLaw = answers['maritalStatus'] === 'married' || answers['maritalStatus'] === 'common_law';
                const showRelationshipDivider = question.key === 'hasMarriageContract' && isMarriedOrCommonLaw;
                const showChildrenDivider = question.key === 'hasChildren';

                return (
                  <React.Fragment key={question.key}>
                    {showRelationshipDivider && (
                      <div className="pt-4 pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-gray-600" />
                          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                            Relationship History
                          </span>
                          <div className="flex-1 h-px bg-gray-600" />
                        </div>
                      </div>
                    )}
                    {showChildrenDivider && (
                      <div className="pt-4 pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-gray-600" />
                          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                            Children Information
                          </span>
                          <div className="flex-1 h-px bg-gray-600" />
                        </div>
                      </div>
                    )}
                    <FormField
                      question={{...question, label: customLabel}}
                      value={answers[question.key]}
                      onChange={(value) => onAnswerChange(question.key, value)}
                    />
                  </React.Fragment>
                );
              })}
            </>
          )}

          {step.sectionId === 'familyTrusts' && (
            <FamilyTrustSection
              answers={answers}
              allAnswers={allAnswers || new Map()}
              onAnswerChange={onAnswerChange}
            />
          )}

          {step.sectionId === 'businessInterests' && (
            <>
              {step.questions.map((question) => {
                if (question.condition) {
                  const allFormData = Object.fromEntries(
                    Array.from(allAnswers?.entries() || []).flatMap(([_, stepAnswers]) =>
                      Object.entries(stepAnswers)
                    )
                  );
                  if (!question.condition(allFormData)) {
                    return null;
                  }
                }

                const displayLabel = typeof question.label === 'function'
                  ? question.label(allAnswers || new Map())
                  : question.label;

                const fieldElement = (
                  <FormField
                    key={question.key}
                    question={{ ...question, label: displayLabel }}
                    value={answers[question.key]}
                    onChange={(value) => onAnswerChange(question.key, value)}
                  />
                );

                if (question.key === 'soleProprietorshipCount' && answers['hasSoleProprietorship'] === 'yes') {
                  const count = parseInt(answers['soleProprietorshipCount'] as string) || 0;
                  const client1Name = (allAnswers?.get('aboutYou')?.['fullName'] as string) || 'Client 1';
                  const spData = (answers['client1SolePropsData'] as Array<Partial<SoleProprietorshipData>>) || [];
                  return (
                    <React.Fragment key={question.key}>
                      {fieldElement}
                      {count > 0 && (
                        <div className="space-y-6 mt-2">
                          {Array.from({ length: count }).map((_, i) => (
                            <SoleProprietorshipDetails
                              key={i}
                              index={i}
                              data={spData[i] || {}}
                              clientName={client1Name}
                              onChange={(field, value) => {
                                const updated = [...spData];
                                if (!updated[i]) updated[i] = {};
                                updated[i] = { ...updated[i], [field]: value };
                                onAnswerChange('client1SolePropsData', updated);
                              }}
                              onMultiChange={(updates) => {
                                const updated = [...spData];
                                if (!updated[i]) updated[i] = {};
                                updated[i] = { ...updated[i], ...updates };
                                onAnswerChange('client1SolePropsData', updated);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                }

                if (question.key === 'client2SoleProprietorshipCount') {
                  const maritalStatus = (allAnswers?.get('aboutYou')?.['maritalStatus'] as string);
                  const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';
                  if (hasSpouse && answers['client2HasSoleProprietorship'] === 'yes') {
                    const count = parseInt(answers['client2SoleProprietorshipCount'] as string) || 0;
                    const client2Name = (allAnswers?.get('aboutYou')?.['spouseName'] as string) || 'Client 2';
                    const spData = (answers['client2SolePropsData'] as Array<Partial<SoleProprietorshipData>>) || [];
                    return (
                      <React.Fragment key={question.key}>
                        {fieldElement}
                        {count > 0 && (
                          <div className="space-y-6 mt-2">
                            {Array.from({ length: count }).map((_, i) => (
                              <SoleProprietorshipDetails
                                key={i}
                                index={i}
                                data={spData[i] || {}}
                                clientName={client2Name}
                                onChange={(field, value) => {
                                  const updated = [...spData];
                                  if (!updated[i]) updated[i] = {};
                                  updated[i] = { ...updated[i], [field]: value };
                                  onAnswerChange('client2SolePropsData', updated);
                                }}
                                onMultiChange={(updates) => {
                                  const updated = [...spData];
                                  if (!updated[i]) updated[i] = {};
                                  updated[i] = { ...updated[i], ...updates };
                                  onAnswerChange('client2SolePropsData', updated);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  }
                }

                if (question.key === 'partnershipCount' && answers['hasPartnership'] === 'yes') {
                  const count = parseInt(answers['partnershipCount'] as string) || 0;
                  const client1Name = (allAnswers?.get('aboutYou')?.['fullName'] as string) || 'Client 1';
                  const pData = (answers['client1PartnershipsData'] as Array<Partial<PartnershipData>>) || [];
                  return (
                    <React.Fragment key={question.key}>
                      {fieldElement}
                      {count > 0 && (
                        <div className="space-y-6 mt-2">
                          {Array.from({ length: count }).map((_, i) => (
                            <PartnershipDetails
                              key={i}
                              index={i}
                              data={pData[i] || {}}
                              clientName={client1Name}
                              onChange={(field, value) => {
                                const updated = [...pData];
                                if (!updated[i]) updated[i] = {};
                                updated[i] = { ...updated[i], [field]: value };
                                onAnswerChange('client1PartnershipsData', updated);
                              }}
                              onMultiChange={(updates) => {
                                const updated = [...pData];
                                if (!updated[i]) updated[i] = {};
                                updated[i] = { ...updated[i], ...updates };
                                onAnswerChange('client1PartnershipsData', updated);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                }

                if (question.key === 'client2PartnershipCount') {
                  const maritalStatus = (allAnswers?.get('aboutYou')?.['maritalStatus'] as string);
                  const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';
                  if (hasSpouse && answers['client2HasPartnership'] === 'yes') {
                    const count = parseInt(answers['client2PartnershipCount'] as string) || 0;
                    const client2Name = (allAnswers?.get('aboutYou')?.['spouseName'] as string) || 'Client 2';
                    const pData = (answers['client2PartnershipsData'] as Array<Partial<PartnershipData>>) || [];
                    return (
                      <React.Fragment key={question.key}>
                        {fieldElement}
                        {count > 0 && (
                          <div className="space-y-6 mt-2">
                            {Array.from({ length: count }).map((_, i) => (
                              <PartnershipDetails
                                key={i}
                                index={i}
                                data={pData[i] || {}}
                                clientName={client2Name}
                                onChange={(field, value) => {
                                  const updated = [...pData];
                                  if (!updated[i]) updated[i] = {};
                                  updated[i] = { ...updated[i], [field]: value };
                                  onAnswerChange('client2PartnershipsData', updated);
                                }}
                                onMultiChange={(updates) => {
                                  const updated = [...pData];
                                  if (!updated[i]) updated[i] = {};
                                  updated[i] = { ...updated[i], ...updates };
                                  onAnswerChange('client2PartnershipsData', updated);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  }
                }

                return fieldElement;
              })}

              {false && answers['client1HasAlternatePoaPersonalCare'] === 'yes' && client1AlternatePoaPersonalCareCount > 0 && (
                <div className="space-y-6 mt-6">
                  <h3 className="text-xl font-semibold text-white">Alternate Powers of Attorney for Personal Care - Client 1</h3>
                  {Array.from({ length: client1AlternatePoaPersonalCareCount }).map((_, index) => (
                    <div key={index} className="border border-gray-600 rounded-lg p-6 bg-gray-700">
                      <h4 className="text-lg font-semibold text-white mb-4">Alternate Attorney {index + 1}</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                          <input
                            type="text"
                            value={client1AlternatePoaPersonalCareData[index]?.name || ''}
                            onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'name', e.target.value)}
                            placeholder="Enter full name"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
                          <input
                            type="tel"
                            value={client1AlternatePoaPersonalCareData[index]?.phone || ''}
                            onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'phone', e.target.value)}
                            placeholder="Enter phone number"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                          <input
                            type="email"
                            value={client1AlternatePoaPersonalCareData[index]?.email || ''}
                            onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'email', e.target.value)}
                            placeholder="Enter email address"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Relationship to You *</label>
                          <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Spouse, Child, Sibling, etc.</p>
                          <input
                            type="text"
                            value={client1AlternatePoaPersonalCareData[index]?.relationship || ''}
                            onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'relationship', e.target.value)}
                            placeholder=""
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Is this person a resident of Canada? *</label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="yes"
                                checked={client1AlternatePoaPersonalCareData[index]?.isCanadaResident === 'yes'}
                                onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'isCanadaResident', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="no"
                                checked={client1AlternatePoaPersonalCareData[index]?.isCanadaResident === 'no'}
                                onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'isCanadaResident', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">No</span>
                            </label>
                          </div>
                        </div>
                        {client1AlternatePoaPersonalCareData[index]?.isCanadaResident === 'no' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Country of Residence *</label>
                            <input
                              type="text"
                              value={client1AlternatePoaPersonalCareData[index]?.country || ''}
                              onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'country', e.target.value)}
                              placeholder="Enter country"
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                        {client1AlternatePoaPersonalCareData[index]?.isCanadaResident === 'yes' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Province/Territory *</label>
                            <select
                              value={client1AlternatePoaPersonalCareData[index]?.province || ''}
                              onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'province', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select province/territory</option>
                              <option value="Alberta">Alberta</option>
                              <option value="British Columbia">British Columbia</option>
                              <option value="Manitoba">Manitoba</option>
                              <option value="New Brunswick">New Brunswick</option>
                              <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                              <option value="Northwest Territories">Northwest Territories</option>
                              <option value="Nova Scotia">Nova Scotia</option>
                              <option value="Nunavut">Nunavut</option>
                              <option value="Ontario">Ontario</option>
                              <option value="Prince Edward Island">Prince Edward Island</option>
                              <option value="Quebec">Quebec</option>
                              <option value="Saskatchewan">Saskatchewan</option>
                              <option value="Yukon">Yukon</option>
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">City of Residence *</label>
                          <input
                            type="text"
                            value={client1AlternatePoaPersonalCareData[index]?.city || ''}
                            onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'city', e.target.value)}
                            placeholder="Enter city"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Does this person have a copy of your Power of Attorney for Personal Care document? *</label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="yes_on_file"
                                checked={client1AlternatePoaPersonalCareData[index]?.hasDocCopy === 'yes_on_file'}
                                onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'hasDocCopy', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">Yes, they have a copy on file</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="no_can_access"
                                checked={client1AlternatePoaPersonalCareData[index]?.hasDocCopy === 'no_can_access'}
                                onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'hasDocCopy', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">No, but they know where to access it</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="no_not_discussed"
                                checked={client1AlternatePoaPersonalCareData[index]?.hasDocCopy === 'no_not_discussed'}
                                onChange={(e) => handleAlternatePoaPersonalCareChange(index, 'hasDocCopy', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">No, this has not been discussed</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {false && answers['client2HasAlternatePoaPersonalCare'] === 'yes' && client2AlternatePoaPersonalCareCount > 0 && (
                <div className="space-y-6 mt-6">
                  <h3 className="text-xl font-semibold text-white">Alternate Powers of Attorney for Personal Care - Client 2</h3>
                  {Array.from({ length: client2AlternatePoaPersonalCareCount }).map((_, index) => (
                    <div key={index} className="border border-gray-600 rounded-lg p-6 bg-gray-700">
                      <h4 className="text-lg font-semibold text-white mb-4">Alternate Attorney {index + 1}</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                          <input
                            type="text"
                            value={client2AlternatePoaPersonalCareData[index]?.name || ''}
                            onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'name', e.target.value)}
                            placeholder="Enter full name"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
                          <input
                            type="tel"
                            value={client2AlternatePoaPersonalCareData[index]?.phone || ''}
                            onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'phone', e.target.value)}
                            placeholder="Enter phone number"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                          <input
                            type="email"
                            value={client2AlternatePoaPersonalCareData[index]?.email || ''}
                            onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'email', e.target.value)}
                            placeholder="Enter email address"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Relationship to You *</label>
                          <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Spouse, Child, Sibling, etc.</p>
                          <input
                            type="text"
                            value={client2AlternatePoaPersonalCareData[index]?.relationship || ''}
                            onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'relationship', e.target.value)}
                            placeholder=""
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Is this person a resident of Canada? *</label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="yes"
                                checked={client2AlternatePoaPersonalCareData[index]?.isCanadaResident === 'yes'}
                                onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'isCanadaResident', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="no"
                                checked={client2AlternatePoaPersonalCareData[index]?.isCanadaResident === 'no'}
                                onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'isCanadaResident', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">No</span>
                            </label>
                          </div>
                        </div>
                        {client2AlternatePoaPersonalCareData[index]?.isCanadaResident === 'no' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Country of Residence *</label>
                            <input
                              type="text"
                              value={client2AlternatePoaPersonalCareData[index]?.country || ''}
                              onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'country', e.target.value)}
                              placeholder="Enter country"
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                        {client2AlternatePoaPersonalCareData[index]?.isCanadaResident === 'yes' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Province/Territory *</label>
                            <select
                              value={client2AlternatePoaPersonalCareData[index]?.province || ''}
                              onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'province', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select province/territory</option>
                              <option value="Alberta">Alberta</option>
                              <option value="British Columbia">British Columbia</option>
                              <option value="Manitoba">Manitoba</option>
                              <option value="New Brunswick">New Brunswick</option>
                              <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                              <option value="Northwest Territories">Northwest Territories</option>
                              <option value="Nova Scotia">Nova Scotia</option>
                              <option value="Nunavut">Nunavut</option>
                              <option value="Ontario">Ontario</option>
                              <option value="Prince Edward Island">Prince Edward Island</option>
                              <option value="Quebec">Quebec</option>
                              <option value="Saskatchewan">Saskatchewan</option>
                              <option value="Yukon">Yukon</option>
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">City of Residence *</label>
                          <input
                            type="text"
                            value={client2AlternatePoaPersonalCareData[index]?.city || ''}
                            onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'city', e.target.value)}
                            placeholder="Enter city"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Does this person have a copy of your Power of Attorney for Personal Care document? *</label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="yes_on_file"
                                checked={client2AlternatePoaPersonalCareData[index]?.hasDocCopy === 'yes_on_file'}
                                onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'hasDocCopy', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">Yes, they have a copy on file</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="no_can_access"
                                checked={client2AlternatePoaPersonalCareData[index]?.hasDocCopy === 'no_can_access'}
                                onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'hasDocCopy', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">No, but they know where to access it</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="no_not_discussed"
                                checked={client2AlternatePoaPersonalCareData[index]?.hasDocCopy === 'no_not_discussed'}
                                onChange={(e) => handleClient2AlternatePoaPersonalCareChange(index, 'hasDocCopy', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">No, this has not been discussed</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step.sectionId === 'corporations' && (
            <>
              {step.questions.map((question) => {
                if (question.key === 'ownsCorporation') {
                  return null;
                }
                if (question.key === 'numberOfCorporations') {
                  return null;
                }

                return (
                  <FormField
                    key={question.key}
                    question={question}
                    value={answers[question.key]}
                    onChange={(value) => onAnswerChange(question.key, value)}
                  />
                );
              })}

              <CorporationRegistrySection
                answers={answers}
                onAnswerChange={onAnswerChange}
              />

              {corporationsData.length > 0 && (
                <div className="space-y-6 mt-6">
                  <h3 className="text-xl font-semibold text-white">Corporation Details</h3>
                  {corporationsData.map((_, index) => (
                    <div key={index} className="border border-gray-600 rounded-lg p-6 bg-gray-700">
                      <h4 className="text-lg font-semibold text-white mb-4">Corporation {index + 1}</h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            What is the legal name of the corporation? *
                          </label>
                          <input
                            type="text"
                            value={corporationsData[index]?.legalName || ''}
                            onChange={(e) => handleCorporationChange(index, 'legalName', e.target.value)}
                            placeholder="Enter legal name of corporation"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Was it incorporated in Canada? *
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`corporation-${index}-incorporated-in-canada`}
                                value="yes"
                                checked={corporationsData[index]?.incorporatedInCanada === 'yes'}
                                onChange={(e) => handleCorporationChange(index, 'incorporatedInCanada', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`corporation-${index}-incorporated-in-canada`}
                                value="no"
                                checked={corporationsData[index]?.incorporatedInCanada === 'no'}
                                onChange={(e) => handleCorporationChange(index, 'incorporatedInCanada', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-white">No</span>
                            </label>
                          </div>
                        </div>

                        {corporationsData[index]?.incorporatedInCanada === 'yes' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              In what jurisdiction was it incorporated? *
                            </label>
                            <select
                              value={corporationsData[index]?.jurisdiction || ''}
                              onChange={(e) => handleCorporationChange(index, 'jurisdiction', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select jurisdiction</option>
                              <option value="Canada">Canada</option>
                              <option value="Alberta">Alberta</option>
                              <option value="British Columbia">British Columbia</option>
                              <option value="Manitoba">Manitoba</option>
                              <option value="New Brunswick">New Brunswick</option>
                              <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                              <option value="Nova Scotia">Nova Scotia</option>
                              <option value="Ontario">Ontario</option>
                              <option value="Prince Edward Island">Prince Edward Island</option>
                              <option value="Quebec">Quebec</option>
                              <option value="Saskatchewan">Saskatchewan</option>
                              <option value="Northwest Territories">Northwest Territories</option>
                              <option value="Nunavut">Nunavut</option>
                              <option value="Yukon">Yukon</option>
                            </select>
                          </div>
                        )}

                        {corporationsData[index]?.incorporatedInCanada === 'no' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Where was it incorporated? *
                            </label>
                            <input
                              type="text"
                              value={corporationsData[index]?.jurisdiction || ''}
                              onChange={(e) => handleCorporationChange(index, 'jurisdiction', e.target.value)}
                              placeholder="Enter country/jurisdiction"
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            What type of corporation is this? *
                          </label>
                          <select
                            value={corporationsData[index]?.corporationType || ''}
                            onChange={(e) => handleCorporationChange(index, 'corporationType', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select type</option>
                            <option value="Operating Company">Operating Company</option>
                            <option value="Holding Company">Holding Company</option>
                            <option value="Professional Corporation">Professional Corporation</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {corporationsData[index]?.corporationType === 'Other' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Please describe *
                            </label>
                            <input
                              type="text"
                              value={corporationsData[index]?.corporationTypeOther || ''}
                              onChange={(e) => handleCorporationChange(index, 'corporationTypeOther', e.target.value)}
                              placeholder="Enter corporation type"
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}

                        {corporationsData[index]?.corporationType === 'Holding Company' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Describe the assets of the Holding Company:
                            </label>
                            <textarea
                              value={corporationsData[index]?.holdingCompanyAssets || ''}
                              onChange={(e) => handleCorporationChange(index, 'holdingCompanyAssets', e.target.value)}
                              placeholder="Enter details about the holding company assets"
                              rows={4}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Who has an ownership stake in this corporation? *
                          </label>
                          <div className="space-y-2">
                            {(() => {
                              const basicAnswers = allAnswers?.get('aboutYou') || {};
                              const trustAnswers = allAnswers?.get('familyTrusts') || {};
                              const client1Name = basicAnswers['fullName'] as string || 'Client 1';
                              const client2Name = basicAnswers['spouseName'] as string || '';
                              const hasSpouse = (basicAnswers['maritalStatus'] === 'married' || basicAnswers['maritalStatus'] === 'common_law') && client2Name;
                              const trustName = trustAnswers['trustLegalName'] as string || '';
                              const hasTrust = trustAnswers['hasFamilyTrust'] === 'yes' && trustName;

                              const step2Answers = allAnswers?.get('previousRelationships') || {};
                              const step3Answers = allAnswers?.get('children') || {};
                              const childrenDataAll = step3Answers['childrenData'] as Array<Record<string, string>> | undefined;
                              const childNames = (childrenDataAll || []).map(c => c?.name).filter((n: string) => n && n.trim() !== '') as string[];
                              const client1PrevRels = step2Answers['client1PreviousRelationshipsData'] as Array<Record<string, string>> | undefined;
                              const client2PrevRels = step2Answers['client2PreviousRelationshipsData'] as Array<Record<string, string>> | undefined;
                              const pastSpouseNames = [
                                ...(client1PrevRels || []).map(r => r?.name).filter((n: string) => n && n.trim() !== '') as string[],
                                ...(client2PrevRels || []).map(r => r?.name).filter((n: string) => n && n.trim() !== '') as string[],
                              ];
                              const extraOwnerNames = [...childNames, ...pastSpouseNames];

                              const selectedOwners = corporationsData[index]?.owners ?
                                (typeof corporationsData[index].owners === 'string' ?
                                  corporationsData[index].owners.split(',') :
                                  corporationsData[index].owners) : [];

                              const otherOwners: Array<{ type: string; name: string }> = corporationsData[index]?.otherOwners ?
                                (typeof corporationsData[index].otherOwners === 'string' ?
                                  JSON.parse(corporationsData[index].otherOwners) :
                                  corporationsData[index].otherOwners) : [];

                              const hasOtherChecked = corporationsData[index]?.hasOtherOwner === 'true';

                              const handleOwnerChange = (owner: string, checked: boolean) => {
                                let updatedOwners = [...(Array.isArray(selectedOwners) ? selectedOwners : [])];
                                if (checked) {
                                  if (!updatedOwners.includes(owner)) {
                                    updatedOwners.push(owner);
                                  }
                                } else {
                                  updatedOwners = updatedOwners.filter(o => o !== owner);
                                }
                                handleCorporationChange(index, 'owners', updatedOwners.join(','));
                              };

                              const handleOtherOwnerChange = (otherIndex: number, field: 'type' | 'name', value: string) => {
                                const updated = [...otherOwners];
                                if (!updated[otherIndex]) updated[otherIndex] = { type: '', name: '' };
                                if (field === 'type') {
                                  updated[otherIndex] = { type: value, name: '' };
                                  handleCorporationChange(index, 'otherOwnersDone', '');
                                  handleCorporationChange(index, 'ownershipPercentages', JSON.stringify({}));
                                } else {
                                  updated[otherIndex] = { ...updated[otherIndex], [field]: value };
                                }
                                handleCorporationChange(index, 'otherOwners', JSON.stringify(updated));

                                // Update the owners list
                                const predefinedOwners = [client1Name];
                                if (hasSpouse) predefinedOwners.push(client2Name);
                                if (hasTrust) predefinedOwners.push(trustName);
                                predefinedOwners.push(...extraOwnerNames);
                                corporationsData.forEach((corp, corpIndex) => {
                                  if (corpIndex !== index && corp?.legalName) {
                                    predefinedOwners.push(corp.legalName);
                                  }
                                });

                                const currentSelected = selectedOwners.filter(o => predefinedOwners.includes(o));
                                const validOtherOwners = updated.filter(o => o && o.name && o.name.trim() !== '').map(o => o.name);
                                const allOwners = [...currentSelected, ...validOtherOwners];
                                handleCorporationChange(index, 'owners', allOwners.join(','));
                              };

                              const handleAddMoreOwner = () => {
                                const updated = [...otherOwners, { type: '', name: '' }];
                                handleCorporationChange(index, 'otherOwners', JSON.stringify(updated));
                                handleCorporationChange(index, 'otherOwnersDone', '');
                              };

                              const handleRemoveOwner = (otherIndex: number) => {
                                const updated = otherOwners.filter((_: { type: string; name: string }, i: number) => i !== otherIndex);
                                handleCorporationChange(index, 'otherOwners', JSON.stringify(updated));
                                handleCorporationChange(index, 'otherOwnersDone', '');
                                handleCorporationChange(index, 'ownershipPercentages', JSON.stringify({}));

                                // Update the owners list
                                const predefinedOwners = [client1Name];
                                if (hasSpouse) predefinedOwners.push(client2Name);
                                if (hasTrust) predefinedOwners.push(trustName);
                                predefinedOwners.push(...extraOwnerNames);
                                corporationsData.forEach((corp, corpIndex) => {
                                  if (corpIndex !== index && corp?.legalName) {
                                    predefinedOwners.push(corp.legalName);
                                  }
                                });

                                const currentSelected = selectedOwners.filter(o => predefinedOwners.includes(o));
                                const validOtherOwners = updated.filter(o => o && o.name && o.name.trim() !== '').map(o => o.name);
                                const allOwners = [...currentSelected, ...validOtherOwners];
                                handleCorporationChange(index, 'owners', allOwners.join(','));
                              };

                              const handleOtherCheckboxChange = (checked: boolean) => {
                                handleCorporationChange(index, 'hasOtherOwner', checked.toString());
                                if (checked && otherOwners.length === 0) {
                                  handleCorporationChange(index, 'otherOwners', JSON.stringify([{ type: '', name: '' }]));
                                } else if (!checked) {
                                  handleCorporationChange(index, 'otherOwners', JSON.stringify([]));
                                  handleCorporationChange(index, 'otherOwnersDone', '');
                                  handleCorporationChange(index, 'ownershipPercentages', JSON.stringify({}));

                                  // Remove other owners from the owners list
                                  const predefinedOwners = [client1Name];
                                  if (hasSpouse) predefinedOwners.push(client2Name);
                                  if (hasTrust) predefinedOwners.push(trustName);
                                  corporationsData.forEach((corp, corpIndex) => {
                                    if (corpIndex !== index && corp?.legalName) {
                                      predefinedOwners.push(corp.legalName);
                                    }
                                  });

                                  const currentSelected = selectedOwners.filter(o => predefinedOwners.includes(o));
                                  handleCorporationChange(index, 'owners', currentSelected.join(','));
                                }
                              };

                              return (
                                <>
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedOwners.includes(client1Name)}
                                      onChange={(e) => handleOwnerChange(client1Name, e.target.checked)}
                                      className="mr-2"
                                    />
                                    <span className="text-white">{client1Name}</span>
                                  </label>

                                  {hasSpouse && (
                                    <label className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedOwners.includes(client2Name)}
                                        onChange={(e) => handleOwnerChange(client2Name, e.target.checked)}
                                        className="mr-2"
                                      />
                                      <span className="text-white">{client2Name}</span>
                                    </label>
                                  )}

                                  {hasTrust && (
                                    <label className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedOwners.includes(trustName)}
                                        onChange={(e) => handleOwnerChange(trustName, e.target.checked)}
                                        className="mr-2"
                                      />
                                      <span className="text-white">{trustName}</span>
                                    </label>
                                  )}

                                  {corporationsData.map((corp, corpIndex) => {
                                    if (corpIndex !== index && corp?.legalName) {
                                      return (
                                        <label key={corpIndex} className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={selectedOwners.includes(corp.legalName)}
                                            onChange={(e) => handleOwnerChange(corp.legalName, e.target.checked)}
                                            className="mr-2"
                                          />
                                          <span className="text-white">{corp.legalName}</span>
                                        </label>
                                      );
                                    }
                                    return null;
                                  })}

                                  {childNames.map((childName, ci) => (
                                    <label key={`child-${ci}`} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedOwners.includes(childName)}
                                        onChange={(e) => handleOwnerChange(childName, e.target.checked)}
                                        className="mr-2"
                                      />
                                      <span className="text-white">{childName}</span>
                                    </label>
                                  ))}

                                  {pastSpouseNames.map((spouseName, si) => (
                                    <label key={`past-spouse-${si}`} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedOwners.includes(spouseName)}
                                        onChange={(e) => handleOwnerChange(spouseName, e.target.checked)}
                                        className="mr-2"
                                      />
                                      <span className="text-white">{spouseName}</span>
                                    </label>
                                  ))}

                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={hasOtherChecked}
                                      onChange={(e) => handleOtherCheckboxChange(e.target.checked)}
                                      className="mr-2"
                                    />
                                    <span className="text-white">Other</span>
                                  </label>

                                  {hasOtherChecked && (
                                    <div className="ml-6 mt-4 space-y-4">
                                      {otherOwners.map((owner: { type: string; name: string }, otherIndex: number) => (
                                        <div key={otherIndex} className="space-y-3 p-4 bg-gray-700/50 rounded-lg">
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-300">Owner {otherIndex + 1}</span>
                                            {otherOwners.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveOwner(otherIndex)}
                                                className="text-gray-400 hover:text-red-400"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                              Owner type:
                                            </label>
                                            <div className="flex flex-wrap gap-4">
                                              {[
                                                { value: 'individual', label: 'Individual' },
                                                { value: 'corporation', label: 'Corporation' },
                                                { value: 'trust', label: 'Trust' },
                                                { value: 'partnership', label: 'Partnership' },
                                              ].map(opt => (
                                                <label key={opt.value} className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`otherOwnerType-${index}-${otherIndex}`}
                                                    value={opt.value}
                                                    checked={owner.type === opt.value}
                                                    onChange={() => handleOtherOwnerChange(otherIndex, 'type', opt.value)}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">{opt.label}</span>
                                                </label>
                                              ))}
                                            </div>
                                          </div>
                                          {owner.type && (
                                            <div>
                                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                                {owner.type.charAt(0).toUpperCase() + owner.type.slice(1)} name:
                                              </label>
                                              <input
                                                type="text"
                                                value={owner.name}
                                                onChange={(e) => handleOtherOwnerChange(otherIndex, 'name', e.target.value)}
                                                placeholder="Enter name"
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                          )}
                                          {owner.type && owner.name && owner.name.trim() !== '' && otherIndex === otherOwners.length - 1 && (
                                            <div>
                                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Are there additional owners?
                                              </label>
                                              <div className="flex gap-4">
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`additionalOwners-${index}-${otherIndex}`}
                                                    value="yes"
                                                    checked={corporationsData[index]?.otherOwnersDone === 'yes'}
                                                    onChange={() => {
                                                      handleCorporationChange(index, 'otherOwnersDone', 'yes');
                                                      handleAddMoreOwner();
                                                    }}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`additionalOwners-${index}-${otherIndex}`}
                                                    value="no"
                                                    checked={corporationsData[index]?.otherOwnersDone === 'no'}
                                                    onChange={() => handleCorporationChange(index, 'otherOwnersDone', 'no')}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">No</span>
                                                </label>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {(() => {
                                    const allOwnerNames = selectedOwners.filter(Boolean);
                                    const showOwnership = allOwnerNames.length > 0 && (!hasOtherChecked || corporationsData[index]?.otherOwnersDone === 'no');
                                    if (!showOwnership) return null;
                                    const corp = corporationsData[index];

                                    // shareClasses: string[] of class names (1–10)
                                    const shareClasses: string[] = corp?.shareClasses
                                      ? (typeof corp.shareClasses === 'string' ? JSON.parse(corp.shareClasses) : corp.shareClasses)
                                      : [''];

                                    // shareClassPercentages: Record<ownerName, string>[] — one entry per class
                                    const shareClassPercentages: Record<string, string>[] = corp?.shareClassPercentages
                                      ? (typeof corp.shareClassPercentages === 'string' ? JSON.parse(corp.shareClassPercentages) : corp.shareClassPercentages)
                                      : [{}];

                                    // Pad arrays to match shareClasses length
                                    while (shareClassPercentages.length < shareClasses.length) shareClassPercentages.push({});

                                    const classTotals = shareClasses.map((_, ci) =>
                                      allOwnerNames.reduce((sum, n) => sum + (parseFloat(shareClassPercentages[ci]?.[n] || '0') || 0), 0)
                                    );

                                    const handleClassNameChange = (ci: number, value: string) => {
                                      const updated = [...shareClasses];
                                      updated[ci] = value;
                                      handleCorporationChange(index, 'shareClasses', JSON.stringify(updated));
                                    };

                                    const handleClassPctChange = (ci: number, ownerName: string, value: string) => {
                                      const updatedPcts = shareClassPercentages.map(p => ({ ...p }));
                                      while (updatedPcts.length <= ci) updatedPcts.push({});
                                      updatedPcts[ci] = { ...updatedPcts[ci], [ownerName]: value };
                                      handleCorporationChange(index, 'shareClassPercentages', JSON.stringify(updatedPcts));
                                    };

                                    const addShareClass = () => {
                                      if (shareClasses.length >= 10) return;
                                      const updatedNames = [...shareClasses, ''];
                                      const updatedPcts = [...shareClassPercentages, {}];
                                      handleCorporationChange(index, 'shareClasses', JSON.stringify(updatedNames));
                                      handleCorporationChange(index, 'shareClassPercentages', JSON.stringify(updatedPcts));
                                    };

                                    const removeShareClass = () => {
                                      if (shareClasses.length <= 1) return;
                                      const updatedNames = shareClasses.slice(0, -1);
                                      const updatedPcts = shareClassPercentages.slice(0, -1);
                                      handleCorporationChange(index, 'shareClasses', JSON.stringify(updatedNames));
                                      handleCorporationChange(index, 'shareClassPercentages', JSON.stringify(updatedPcts));
                                    };

                                    return (
                                      <div className="ml-6 mt-4 p-4 bg-gray-700/50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-300 mb-3">Ownership Stake:</p>

                                        <div className="flex flex-col gap-2">

                                          {/* Header row — owner name col flex-1, each class col w-36 */}
                                          <div className="flex items-center gap-3">
                                            <span className="flex-1 min-w-0" />
                                            {shareClasses.map((className, ci) => (
                                              <div key={ci} className="w-36 shrink-0">
                                                <input
                                                  type="text"
                                                  value={className}
                                                  onChange={(e) => handleClassNameChange(ci, e.target.value)}
                                                  placeholder={`Share Class ${ci + 1}`}
                                                  className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                            ))}
                                          </div>

                                          {/* Owner rows */}
                                          {allOwnerNames.map(name => (
                                            <div key={name} className="flex items-center gap-3">
                                              <span className="flex-1 min-w-0 text-white text-sm truncate">{name}</span>
                                              {shareClasses.map((_, ci) => (
                                                <div key={ci} className="relative w-36 shrink-0">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={shareClassPercentages[ci]?.[name] || ''}
                                                    onChange={(e) => handleClassPctChange(ci, name, e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-4 py-2 pr-8 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  />
                                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                                </div>
                                              ))}
                                            </div>
                                          ))}

                                          {/* Total row */}
                                          <div className="flex items-center gap-3 pt-2 mt-1 border-t border-gray-600">
                                            <span className="flex-1 min-w-0 text-xs text-gray-400">Total</span>
                                            {classTotals.map((t, ci) => {
                                              const valid = Math.abs(t - 100) < 0.01;
                                              return (
                                                <div key={ci} className={`w-36 shrink-0 text-sm font-medium text-center ${valid ? 'text-green-400' : t > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                                  {t.toFixed(t % 1 === 0 ? 0 : 2)}%{t > 0 && !valid && ' !'}{valid && ' ✓'}
                                                </div>
                                              );
                                            })}
                                          </div>

                                        </div>

                                        {/* Add / Remove buttons below chart */}
                                        <div className="flex items-center gap-3 mt-4">
                                          {shareClasses.length < 10 && (
                                            <button
                                              type="button"
                                              onClick={addShareClass}
                                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/50 rounded-lg hover:bg-blue-500/10 transition-colors"
                                            >
                                              <span className="text-base leading-none">+</span> Add Share Class
                                            </button>
                                          )}
                                          {shareClasses.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={removeShareClass}
                                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/10 transition-colors"
                                            >
                                              <span className="text-base leading-none">−</span> Remove Share Class
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {(() => {
                          const corpType = corporationsData[index]?.corporationType;
                          const isOperatingOrOther = corpType === 'Operating Company' || corpType === 'Other';
                          if (!isOperatingOrOther) return null;

                          const step3Answers = allAnswers?.get('children') || {};
                          const childrenDataAll = step3Answers['childrenData'] as Array<Record<string, string>> | undefined;
                          const allChildNames = (childrenDataAll || []).map(c => c?.name).filter((n): n is string => !!n && n.trim() !== '');
                          if (allChildNames.length === 0) return null;

                          const corpName = corporationsData[index]?.legalName || 'the corporation';
                          const employedChildren: string[] = corporationsData[index]?.childrenEmployed
                            ? (typeof corporationsData[index].childrenEmployed === 'string'
                                ? JSON.parse(corporationsData[index].childrenEmployed)
                                : corporationsData[index].childrenEmployed)
                            : [];

                          const toggleChild = (name: string, checked: boolean) => {
                            const updated = checked
                              ? [...employedChildren, name]
                              : employedChildren.filter(n => n !== name);
                            handleCorporationChange(index, 'childrenEmployed', JSON.stringify(updated));
                          };

                          return (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Are any of your children employed by {corpName} (greater than 20 hours/week)?
                              </label>
                              <div className="space-y-2">
                                {allChildNames.map(name => (
                                  <label key={name} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={employedChildren.includes(name)}
                                      onChange={e => toggleChild(name, e.target.checked)}
                                      className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-white text-sm">{name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Location of the Articles of Incorporation
                          </label>
                          <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Home office filing cabinet, Safety deposit box, etc.</p>
                          <input
                            type="text"
                            value={corporationsData[index]?.articlesLocation || ''}
                            onChange={(e) => handleCorporationChange(index, 'articlesLocation', e.target.value)}
                            placeholder=""
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Location of Corporate Minute Book
                          </label>
                          <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Home office filing cabinet, Safety deposit box, etc.</p>
                          <input
                            type="text"
                            value={corporationsData[index]?.minuteBookLocation || ''}
                            onChange={(e) => handleCorporationChange(index, 'minuteBookLocation', e.target.value)}
                            placeholder=""
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Is there a shareholder agreement? *
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`hasShareholderAgreement-${index}`}
                                value="yes"
                                checked={corporationsData[index]?.hasShareholderAgreement === 'yes'}
                                onChange={(e) => handleCorporationChange(index, 'hasShareholderAgreement', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-gray-300">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`hasShareholderAgreement-${index}`}
                                value="no"
                                checked={corporationsData[index]?.hasShareholderAgreement === 'no'}
                                onChange={(e) => handleCorporationChange(index, 'hasShareholderAgreement', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-gray-300">No</span>
                            </label>
                          </div>
                        </div>

                        {corporationsData[index]?.hasShareholderAgreement === 'yes' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Location of the shareholder agreement *
                            </label>
                            <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Home office filing cabinet, Safety deposit box, etc.</p>
                            <input
                              type="text"
                              value={corporationsData[index]?.shareholderAgreementLocation || ''}
                              onChange={(e) => handleCorporationChange(index, 'shareholderAgreementLocation', e.target.value)}
                              placeholder=""
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}

                        {corporationsData[index]?.corporationType !== 'Holding Company' && (
                          <Subsection title="Business Continuity and Key Personnel">
                            <p className="text-xs italic text-gray-400 mb-4">
                              A corporation is a separate legal entity that survives the death of a shareholder, but its practical viability depends on a clear continuation strategy.
                            </p>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Designated Interim Manager: Identify who has the immediate "on-the-ground" authority to manage day-to-day operations (payroll, supplier payments) if the owner is incapacitated or deceased.
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                  <input
                                    type="text"
                                    value={corporationsData[index]?.interimManager?.name || ''}
                                    onChange={(e) => handleCorporationChange(index, 'interimManager', { ...(corporationsData[index]?.interimManager || {}), name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={corporationsData[index]?.interimManager?.title || ''}
                                    onChange={(e) => handleCorporationChange(index, 'interimManager', { ...(corporationsData[index]?.interimManager || {}), title: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-400 mb-1">Responsibilities</label>
                                  <textarea
                                    value={corporationsData[index]?.interimManager?.responsibilities || ''}
                                    onChange={(e) => handleCorporationChange(index, 'interimManager', { ...(corporationsData[index]?.interimManager || {}), responsibilities: e.target.value })}
                                    placeholder="e.g., Oversees daily operations, authorizes payroll and supplier payments"
                                    rows={2}
                                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                                  <input
                                    type="tel"
                                    value={corporationsData[index]?.interimManager?.phone || ''}
                                    onChange={(e) => handleCorporationChange(index, 'interimManager', { ...(corporationsData[index]?.interimManager || {}), phone: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                                  <input
                                    type="email"
                                    value={corporationsData[index]?.interimManager?.email || ''}
                                    onChange={(e) => handleCorporationChange(index, 'interimManager', { ...(corporationsData[index]?.interimManager || {}), email: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Are there additional key people?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`hasAdditionalKeyPeople-${index}`}
                                    value="yes"
                                    checked={corporationsData[index]?.hasAdditionalKeyPeople === 'yes'}
                                    onChange={(e) => {
                                      handleCorporationChange(index, 'hasAdditionalKeyPeople', e.target.value);
                                      if (e.target.value === 'no') {
                                        handleCorporationChange(index, 'additionalKeyPeople', undefined);
                                      }
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`hasAdditionalKeyPeople-${index}`}
                                    value="no"
                                    checked={corporationsData[index]?.hasAdditionalKeyPeople === 'no'}
                                    onChange={(e) => {
                                      handleCorporationChange(index, 'hasAdditionalKeyPeople', e.target.value);
                                      handleCorporationChange(index, 'additionalKeyPeople', undefined);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>

                            {corporationsData[index]?.hasAdditionalKeyPeople === 'yes' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Additional Key Person
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={corporationsData[index]?.additionalKeyPeople?.[0]?.name || ''}
                                      onChange={(e) => handleCorporationChange(index, 'additionalKeyPeople', [{ ...((corporationsData[index]?.additionalKeyPeople || [{}])[0] || {}), name: e.target.value }])}
                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                    <input
                                      type="text"
                                      value={corporationsData[index]?.additionalKeyPeople?.[0]?.title || ''}
                                      onChange={(e) => handleCorporationChange(index, 'additionalKeyPeople', [{ ...((corporationsData[index]?.additionalKeyPeople || [{}])[0] || {}), title: e.target.value }])}
                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Responsibilities</label>
                                    <textarea
                                      value={corporationsData[index]?.additionalKeyPeople?.[0]?.responsibilities || ''}
                                      onChange={(e) => handleCorporationChange(index, 'additionalKeyPeople', [{ ...((corporationsData[index]?.additionalKeyPeople || [{}])[0] || {}), responsibilities: e.target.value }])}
                                      placeholder="e.g., Manages client relationships and oversees staff scheduling"
                                      rows={2}
                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                                    <input
                                      type="tel"
                                      value={corporationsData[index]?.additionalKeyPeople?.[0]?.phone || ''}
                                      onChange={(e) => handleCorporationChange(index, 'additionalKeyPeople', [{ ...((corporationsData[index]?.additionalKeyPeople || [{}])[0] || {}), phone: e.target.value }])}
                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                                    <input
                                      type="email"
                                      value={corporationsData[index]?.additionalKeyPeople?.[0]?.email || ''}
                                      onChange={(e) => handleCorporationChange(index, 'additionalKeyPeople', [{ ...((corporationsData[index]?.additionalKeyPeople || [{}])[0] || {}), email: e.target.value }])}
                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Signing Authority */}
                            <div className="mt-6 pt-4 border-t border-gray-600">
                              <label className="block text-sm font-semibold text-gray-200 mb-1">
                                Signing Authority
                              </label>

                              {(() => {
                                const corp = corporationsData[index] || {};

                                // Build list of all people entered so far in this corporate step
                                const listedPeople: { key: string; name: string; role: string }[] = [];
                                if (corp.interimManager?.name) {
                                  listedPeople.push({ key: 'interimManager', name: corp.interimManager.name, role: 'Designated Interim Manager' });
                                }
                                (corp.additionalKeyPeople || []).forEach((p: Record<string, string>, i: number) => {
                                  if (p?.name) listedPeople.push({ key: `addKey_${i}`, name: p.name, role: 'Additional Key Person' });
                                });

                                const selectedSigners = (corp.signingAuthorityPeople as string[]) || [];
                                const hasOtherSigner = selectedSigners.includes('__other__');

                                const toggleSigner = (key: string) => {
                                  const current = [...selectedSigners];
                                  if (current.includes(key)) {
                                    handleCorporationChange(index, 'signingAuthorityPeople', current.filter(k => k !== key));
                                  } else {
                                    handleCorporationChange(index, 'signingAuthorityPeople', [...current, key]);
                                  }
                                };

                                // Bank entries
                                const banks: Record<string, string>[] = corp.signingAuthorityBanks || [{}];

                                return (
                                  <>
                                    <p className="text-sm font-bold text-gray-200 mb-1">
                                      Who is registered to have signing authority over bank accounts?
                                    </p>
                                    <p className="text-xs italic text-gray-400 mb-3">
                                      Check all that apply from the people listed in this section, or select "Other" to add a new person.
                                    </p>

                                    {listedPeople.length > 0 ? (
                                      <div className="space-y-2 mb-3">
                                        {listedPeople.map(person => (
                                          <label key={person.key} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={selectedSigners.includes(person.key)}
                                              onChange={() => toggleSigner(person.key)}
                                              className="rounded"
                                            />
                                            <span className="text-sm text-gray-300">
                                              <span className="font-medium text-gray-200">{person.name}</span>
                                              <span className="text-gray-500"> — {person.role}</span>
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 italic mb-3">Enter the Designated Interim Manager above to see people listed here.</p>
                                    )}

                                    {/* Other signer */}
                                    <label className="flex items-center space-x-3 cursor-pointer mb-3">
                                      <input
                                        type="checkbox"
                                        checked={hasOtherSigner}
                                        onChange={() => {
                                          if (hasOtherSigner) {
                                            handleCorporationChange(index, 'signingAuthorityPeople', selectedSigners.filter(k => k !== '__other__'));
                                            handleCorporationChange(index, 'signingAuthorityOtherPeople', undefined);
                                          } else {
                                            handleCorporationChange(index, 'signingAuthorityPeople', [...selectedSigners, '__other__']);
                                            handleCorporationChange(index, 'signingAuthorityOtherPeople', [{}]);
                                          }
                                        }}
                                        className="rounded"
                                      />
                                      <span className="text-sm text-gray-300 font-medium">Other</span>
                                    </label>

                                    {hasOtherSigner && (corp.signingAuthorityOtherPeople || []).map((person: Record<string, string>, oIdx: number) => {
                                      const others = corp.signingAuthorityOtherPeople || [];
                                      const isLast = oIdx === others.length - 1;
                                      return (
                                        <div key={oIdx} className="p-4 bg-gray-700/50 rounded-lg mb-4">
                                          <h4 className="text-sm font-semibold text-gray-200 mb-3">Other Signing Authority {oIdx + 1}</h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                              <input
                                                type="text"
                                                value={person?.name || ''}
                                                onChange={(e) => {
                                                  const updated = [...others];
                                                  updated[oIdx] = { ...(updated[oIdx] || {}), name: e.target.value };
                                                  handleCorporationChange(index, 'signingAuthorityOtherPeople', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                              <input
                                                type="text"
                                                value={person?.title || ''}
                                                onChange={(e) => {
                                                  const updated = [...others];
                                                  updated[oIdx] = { ...(updated[oIdx] || {}), title: e.target.value };
                                                  handleCorporationChange(index, 'signingAuthorityOtherPeople', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div className="md:col-span-2">
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Responsibilities</label>
                                              <textarea
                                                value={person?.responsibilities || ''}
                                                onChange={(e) => {
                                                  const updated = [...others];
                                                  updated[oIdx] = { ...(updated[oIdx] || {}), responsibilities: e.target.value };
                                                  handleCorporationChange(index, 'signingAuthorityOtherPeople', updated);
                                                }}
                                                rows={2}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                                              <input
                                                type="tel"
                                                value={person?.phone || ''}
                                                onChange={(e) => {
                                                  const updated = [...others];
                                                  updated[oIdx] = { ...(updated[oIdx] || {}), phone: e.target.value };
                                                  handleCorporationChange(index, 'signingAuthorityOtherPeople', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                                              <input
                                                type="email"
                                                value={person?.email || ''}
                                                onChange={(e) => {
                                                  const updated = [...others];
                                                  updated[oIdx] = { ...(updated[oIdx] || {}), email: e.target.value };
                                                  handleCorporationChange(index, 'signingAuthorityOtherPeople', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                          </div>
                                          {isLast && (
                                            <div className="mt-4 flex gap-4">
                                              <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={corp[`signingAuthOtherMore_${oIdx}`] === 'yes'}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      handleCorporationChange(index, `signingAuthOtherMore_${oIdx}`, 'yes');
                                                      handleCorporationChange(index, 'signingAuthorityOtherPeople', [...others, {}]);
                                                    } else {
                                                      handleCorporationChange(index, `signingAuthOtherMore_${oIdx}`, 'no');
                                                    }
                                                  }}
                                                  className="rounded"
                                                />
                                                <span className="text-sm text-gray-300">Add another signing authority</span>
                                              </label>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {/* Bank/Institution entries */}
                                    <div className="mt-4">
                                      <p className="text-sm font-bold text-gray-200 mb-1">Bank/Institution:</p>
                                      <p className="text-xs italic text-gray-400 mb-3">List the bank(s) or financial institution(s) where signing authority applies.</p>
                                      {banks.map((bank: Record<string, string>, bIdx: number) => {
                                        const isLastBank = bIdx === banks.length - 1;
                                        return (
                                          <div key={bIdx} className="mb-3">
                                            <input
                                              type="text"
                                              value={bank?.name || ''}
                                              onChange={(e) => {
                                                const updated = [...banks];
                                                updated[bIdx] = { ...(updated[bIdx] || {}), name: e.target.value };
                                                handleCorporationChange(index, 'signingAuthorityBanks', updated);
                                              }}
                                              placeholder={`Bank/Institution ${bIdx + 1}`}
                                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            {isLastBank && (
                                              <label className="flex items-center space-x-2 cursor-pointer mt-2">
                                                <input
                                                  type="checkbox"
                                                  checked={corp[`signingAuthBankMore_${bIdx}`] === 'yes'}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      handleCorporationChange(index, `signingAuthBankMore_${bIdx}`, 'yes');
                                                      handleCorporationChange(index, 'signingAuthorityBanks', [...banks, {}]);
                                                    } else {
                                                      handleCorporationChange(index, `signingAuthBankMore_${bIdx}`, 'no');
                                                    }
                                                  }}
                                                  className="rounded"
                                                />
                                                <span className="text-sm text-gray-300">Add another bank/institution</span>
                                              </label>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Access to Digital Assets */}
                            <div className="mt-6 pt-4 border-t border-gray-600">
                              <label className="block text-sm font-semibold text-gray-200 mb-1">
                                Access to Digital Assets
                              </label>
                              <p className="text-xs italic text-gray-400 mb-4">
                                Location of passwords for corporate banking, cloud-based bookkeeping (e.g., Xero/QuickBooks), and online personas (websites/social media).
                              </p>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Location of Passwords:
                                </label>
                                <input
                                  type="text"
                                  value={corporationsData[index]?.digitalAssetPasswordLocation || ''}
                                  onChange={(e) => handleCorporationChange(index, 'digitalAssetPasswordLocation', e.target.value)}
                                  placeholder="e.g., 1Password vault, physical safe in office, shared with bookkeeper"
                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Is there anyone else with access to these passwords?
                                </label>
                                <p className="text-xs text-gray-400 mb-3">Check all that apply from the people listed in this section, or select "Other" to add a new person.</p>
                                {(() => {
                                  const corp = corporationsData[index] || {};
                                  const listedPeople: { key: string; name: string; role: string }[] = [];
                                  if (corp.interimManager?.name) {
                                    listedPeople.push({ key: 'interimManager', name: corp.interimManager.name, role: 'Designated Interim Manager' });
                                  }
                                  (corp.additionalKeyPeople || []).forEach((p: Record<string, string>, i: number) => {
                                    if (p?.name) listedPeople.push({ key: `addKey_${i}`, name: p.name, role: 'Additional Key Person' });
                                  });
                                  if (corp.signingAuthSameAsInterim === 'no' && corp.signingAuthority?.name) {
                                    listedPeople.push({ key: 'signingAuthority', name: corp.signingAuthority.name, role: 'Signing Authority' });
                                  }
                                  (corp.signingAuthAdditional || []).forEach((p: Record<string, string>, i: number) => {
                                    if (p?.name) listedPeople.push({ key: `signAuthAdd_${i}`, name: p.name, role: 'Additional Signing Authority' });
                                  });

                                  const selectedPeople = (corp.digitalAssetAccessPeople as string[]) || [];
                                  const hasOther = selectedPeople.includes('__other__');

                                  const togglePerson = (key: string) => {
                                    const current = [...selectedPeople];
                                    if (current.includes(key)) {
                                      handleCorporationChange(index, 'digitalAssetAccessPeople', current.filter(k => k !== key));
                                    } else {
                                      handleCorporationChange(index, 'digitalAssetAccessPeople', [...current, key]);
                                    }
                                  };

                                  return (
                                    <>
                                      {listedPeople.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                          {listedPeople.map(person => (
                                            <label key={person.key} className="flex items-center space-x-3 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={selectedPeople.includes(person.key)}
                                                onChange={() => togglePerson(person.key)}
                                                className="rounded"
                                              />
                                              <span className="text-sm text-gray-300">
                                                <span className="font-medium text-gray-200">{person.name}</span>
                                                <span className="text-gray-500"> — {person.role}</span>
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      )}

                                      <label className="flex items-center space-x-3 cursor-pointer mb-3">
                                        <input
                                          type="checkbox"
                                          checked={hasOther}
                                          onChange={() => {
                                            if (hasOther) {
                                              handleCorporationChange(index, 'digitalAssetAccessPeople', selectedPeople.filter(k => k !== '__other__'));
                                              handleCorporationChange(index, 'digitalAssetOtherPeople', undefined);
                                              handleCorporationChange(index, 'digitalAssetHasMoreOther', undefined);
                                            } else {
                                              handleCorporationChange(index, 'digitalAssetAccessPeople', [...selectedPeople, '__other__']);
                                              handleCorporationChange(index, 'digitalAssetOtherPeople', [{}]);
                                            }
                                          }}
                                          className="rounded"
                                        />
                                        <span className="text-sm text-gray-300 font-medium">Other</span>
                                      </label>

                                      {hasOther && (corporationsData[index]?.digitalAssetOtherPeople || []).map((person: Record<string, string>, oIdx: number) => {
                                        const others = corporationsData[index]?.digitalAssetOtherPeople || [];
                                        const isLast = oIdx === others.length - 1;
                                        return (
                                          <div key={oIdx} className="p-4 bg-gray-700/50 rounded-lg mb-4">
                                            <h4 className="text-sm font-semibold text-gray-200 mb-3">Other Person with Access {oIdx + 1}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                                <input
                                                  type="text"
                                                  value={person?.name || ''}
                                                  onChange={(e) => {
                                                    const updated = [...others];
                                                    updated[oIdx] = { ...(updated[oIdx] || {}), name: e.target.value };
                                                    handleCorporationChange(index, 'digitalAssetOtherPeople', updated);
                                                  }}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                                <input
                                                  type="text"
                                                  value={person?.title || ''}
                                                  onChange={(e) => {
                                                    const updated = [...others];
                                                    updated[oIdx] = { ...(updated[oIdx] || {}), title: e.target.value };
                                                    handleCorporationChange(index, 'digitalAssetOtherPeople', updated);
                                                  }}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                              <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Responsibilities</label>
                                                <textarea
                                                  value={person?.responsibilities || ''}
                                                  onChange={(e) => {
                                                    const updated = [...others];
                                                    updated[oIdx] = { ...(updated[oIdx] || {}), responsibilities: e.target.value };
                                                    handleCorporationChange(index, 'digitalAssetOtherPeople', updated);
                                                  }}
                                                  placeholder="e.g., IT consultant with access to cloud bookkeeping and website admin"
                                                  rows={2}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                                                <input
                                                  type="tel"
                                                  value={person?.phone || ''}
                                                  onChange={(e) => {
                                                    const updated = [...others];
                                                    updated[oIdx] = { ...(updated[oIdx] || {}), phone: e.target.value };
                                                    handleCorporationChange(index, 'digitalAssetOtherPeople', updated);
                                                  }}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                                                <input
                                                  type="email"
                                                  value={person?.email || ''}
                                                  onChange={(e) => {
                                                    const updated = [...others];
                                                    updated[oIdx] = { ...(updated[oIdx] || {}), email: e.target.value };
                                                    handleCorporationChange(index, 'digitalAssetOtherPeople', updated);
                                                  }}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                            </div>

                                            {isLast && (
                                              <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                  Are there other people with access to digital assets?
                                                </label>
                                                <div className="flex gap-4">
                                                  <label className="flex items-center">
                                                    <input
                                                      type="radio"
                                                      name={`digitalAssetMore-${index}-${oIdx}`}
                                                      value="yes"
                                                      checked={corporationsData[index]?.[`digitalAssetMore_${oIdx}`] === 'yes'}
                                                      onChange={(e) => {
                                                        handleCorporationChange(index, `digitalAssetMore_${oIdx}`, e.target.value);
                                                        const updated = [...others, {}];
                                                        handleCorporationChange(index, 'digitalAssetOtherPeople', updated);
                                                      }}
                                                      className="mr-2"
                                                    />
                                                    <span className="text-gray-300">Yes</span>
                                                  </label>
                                                  <label className="flex items-center">
                                                    <input
                                                      type="radio"
                                                      name={`digitalAssetMore-${index}-${oIdx}`}
                                                      value="no"
                                                      checked={corporationsData[index]?.[`digitalAssetMore_${oIdx}`] === 'no'}
                                                      onChange={(e) => {
                                                        handleCorporationChange(index, `digitalAssetMore_${oIdx}`, e.target.value);
                                                      }}
                                                      className="mr-2"
                                                    />
                                                    <span className="text-gray-300">No</span>
                                                  </label>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </Subsection>
                        )}

                            {/* Professional Advisory Directory */}
                            <div className="mt-8 pt-6 border-t border-gray-600">
                              <h3 className="text-base font-semibold text-blue-400 mb-1">
                                Professional Advisory Directory
                              </h3>
                              <p className="text-xs italic text-gray-400 mb-6">
                                {(corporationsData[index]?.legalName || "(Company's name)")}'s key contacts and professional resources that a Power of Attorney or Estate Trustee would coordinate with as a support team of specialists to manage tax filings and valuations.
                              </p>

                              {/* Accountant / Book Keeper */}
                              {(() => {
                                const corp = corporationsData[index] || {};
                                const accountants: Record<string, string>[] = corp.acctBookkeepers || [{}];
                                const responsibilityOptions = ['Accounting', 'Taxes', 'Book Keeping'];

                                return (
                                  <>
                                    <h4 className="text-sm font-semibold text-gray-200 mb-1">Accountant / Book Keeper</h4>
                                    <p className="text-xs text-gray-400 italic mb-4">Name and firm of the person who prepares the annual T2 corporate returns and manages daily ledgers</p>

                                    {accountants.map((acct, aIdx) => {
                                      const isLast = aIdx === accountants.length - 1;
                                      const selectedResponsibilities: string[] = acct.responsibilities ? JSON.parse(acct.responsibilities) : [];

                                      const toggleResp = (resp: string) => {
                                        const updated = [...accountants];
                                        const current = selectedResponsibilities.includes(resp)
                                          ? selectedResponsibilities.filter(r => r !== resp)
                                          : [...selectedResponsibilities, resp];
                                        updated[aIdx] = { ...(updated[aIdx] || {}), responsibilities: JSON.stringify(current) };
                                        handleCorporationChange(index, 'acctBookkeepers', updated);
                                      };

                                      return (
                                        <div key={aIdx} className="p-4 bg-gray-700/50 rounded-lg mb-4">
                                          <div className="flex items-center justify-between mb-3">
                                            {accountants.length > 1 ? (
                                              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Accountant / Book Keeper {aIdx + 1}</h5>
                                            ) : (
                                              <span />
                                            )}
                                            {aIdx > 0 && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = accountants.filter((_, i) => i !== aIdx);
                                                  handleCorporationChange(index, 'acctBookkeepers', updated.length > 0 ? updated : [{}]);
                                                  handleCorporationChange(index, `acctMore_${aIdx - 1}`, undefined);
                                                }}
                                                className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                                              >
                                                Remove
                                              </button>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Firm Name</label>
                                              <input
                                                type="text"
                                                value={acct.firmName || ''}
                                                onChange={(e) => {
                                                  const updated = [...accountants];
                                                  updated[aIdx] = { ...(updated[aIdx] || {}), firmName: e.target.value };
                                                  handleCorporationChange(index, 'acctBookkeepers', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Contact Person</label>
                                              <input
                                                type="text"
                                                value={acct.contactPerson || ''}
                                                onChange={(e) => {
                                                  const updated = [...accountants];
                                                  updated[aIdx] = { ...(updated[aIdx] || {}), contactPerson: e.target.value };
                                                  handleCorporationChange(index, 'acctBookkeepers', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div className="md:col-span-2">
                                              <label className="block text-xs font-medium text-gray-400 mb-2">Responsibilities</label>
                                              <div className="flex flex-wrap gap-3 mb-2">
                                                {responsibilityOptions.map(resp => (
                                                  <label key={resp} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                      type="checkbox"
                                                      checked={selectedResponsibilities.includes(resp)}
                                                      onChange={() => toggleResp(resp)}
                                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <span className="text-sm text-gray-300">{resp}</span>
                                                  </label>
                                                ))}
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedResponsibilities.includes('Other')}
                                                    onChange={() => toggleResp('Other')}
                                                    className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                                  />
                                                  <span className="text-sm text-gray-300">Other</span>
                                                </label>
                                              </div>
                                              {selectedResponsibilities.includes('Other') && (
                                                <input
                                                  type="text"
                                                  placeholder="Describe other responsibilities..."
                                                  value={acct.responsibilitiesOther || ''}
                                                  onChange={(e) => {
                                                    const updated = [...accountants];
                                                    updated[aIdx] = { ...(updated[aIdx] || {}), responsibilitiesOther: e.target.value };
                                                    handleCorporationChange(index, 'acctBookkeepers', updated);
                                                  }}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              )}
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                                              <input
                                                type="tel"
                                                value={acct.phone || ''}
                                                onChange={(e) => {
                                                  const updated = [...accountants];
                                                  updated[aIdx] = { ...(updated[aIdx] || {}), phone: e.target.value };
                                                  handleCorporationChange(index, 'acctBookkeepers', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                                              <input
                                                type="email"
                                                value={acct.email || ''}
                                                onChange={(e) => {
                                                  const updated = [...accountants];
                                                  updated[aIdx] = { ...(updated[aIdx] || {}), email: e.target.value };
                                                  handleCorporationChange(index, 'acctBookkeepers', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                          </div>
                                          {isLast && (
                                            <div className="mt-4">
                                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Are there other Accountants / Book Keepers to add?
                                              </label>
                                              <div className="flex gap-4">
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`acctMore-${index}-${aIdx}`}
                                                    value="yes"
                                                    checked={corp[`acctMore_${aIdx}`] === 'yes'}
                                                    onChange={() => {
                                                      handleCorporationChange(index, `acctMore_${aIdx}`, 'yes');
                                                      handleCorporationChange(index, 'acctBookkeepers', [...accountants, {}]);
                                                    }}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`acctMore-${index}-${aIdx}`}
                                                    value="no"
                                                    checked={corp[`acctMore_${aIdx}`] === 'no'}
                                                    onChange={() => handleCorporationChange(index, `acctMore_${aIdx}`, 'no')}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">No</span>
                                                </label>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </>
                                );
                              })()}

                              {/* Corporate Banker */}
                              {(() => {
                                const corp = corporationsData[index] || {};
                                const bankers: Record<string, string>[] = corp.corpBankers || [{}];
                                const corp1Bankers: Record<string, string>[] = (index > 0 ? corporationsData[0]?.corpBankers : []) || [];
                                const corp1BankerName = corp1Bankers[0]?.contactPerson || corp1Bankers[0]?.bankName || '';
                                const canReuseBanker = index > 0 && !!corp1BankerName;
                                const reuseBanker = corp.reuseCorp1Banker;
                                const currentCorpName = corp.legalName || `Corporation ${index + 1}`;

                                return (
                                  <>
                                    <h4 className="text-sm font-semibold text-gray-200 mt-6 mb-1">Corporate Banker</h4>
                                    <p className="text-xs text-gray-400 italic mb-4">Direct contact for the commercial lending officer or account manager</p>

                                    {canReuseBanker && (
                                      <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Is {currentCorpName} using {corp1BankerName}?
                                        </label>
                                        <div className="flex gap-4">
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`reuseBanker-${index}`}
                                              value="yes"
                                              checked={reuseBanker === 'yes'}
                                              onChange={() => {
                                                handleCorporationChange(index, 'reuseCorp1Banker', 'yes');
                                                handleCorporationChange(index, 'corpBankers', corp1Bankers.map((b: Record<string, string>) => ({ ...b })));
                                              }}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">Yes</span>
                                          </label>
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`reuseBanker-${index}`}
                                              value="no"
                                              checked={reuseBanker === 'no'}
                                              onChange={() => {
                                                handleCorporationChange(index, 'reuseCorp1Banker', 'no');
                                                handleCorporationChange(index, 'corpBankers', [{}]);
                                              }}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">Other</span>
                                          </label>
                                        </div>
                                      </div>
                                    )}

                                    {canReuseBanker && reuseBanker === 'yes' ? (
                                      <div className="p-4 bg-gray-700/50 rounded-lg mb-4">
                                        <p className="text-sm text-gray-300 mb-3">Using {corp1BankerName}, the same Corporate Banker as {corporationsData[0]?.legalName || 'Corporation 1'}.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div><span className="text-xs text-gray-400">Bank Name: </span><span className="text-sm text-gray-200">{corp1Bankers[0]?.bankName || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Contact: </span><span className="text-sm text-gray-200">{corp1Bankers[0]?.contactPerson || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Phone: </span><span className="text-sm text-gray-200">{corp1Bankers[0]?.phone || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Email: </span><span className="text-sm text-gray-200">{corp1Bankers[0]?.email || '—'}</span></div>
                                          {corp1Bankers[0]?.responsibilities && <div className="md:col-span-2"><span className="text-xs text-gray-400">Responsibilities: </span><span className="text-sm text-gray-200">{corp1Bankers[0].responsibilities}</span></div>}
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                    {bankers.map((banker, bIdx) => {
                                      const isLast = bIdx === bankers.length - 1;

                                      return (
                                        <div key={bIdx} className="p-4 bg-gray-700/50 rounded-lg mb-4">
                                          <div className="flex items-center justify-between mb-3">
                                            {bankers.length > 1 ? (
                                              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Corporate Banker {bIdx + 1}</h5>
                                            ) : (
                                              <span />
                                            )}
                                            {bankers.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = bankers.filter((_, i) => i !== bIdx);
                                                  handleCorporationChange(index, 'corpBankers', updated.length > 0 ? updated : [{}]);
                                                  handleCorporationChange(index, `bankerMore_${bIdx - 1}`, undefined);
                                                }}
                                                className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                                              >
                                                Remove
                                              </button>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Bank Name</label>
                                              <input
                                                type="text"
                                                value={banker.bankName || ''}
                                                onChange={(e) => {
                                                  const updated = [...bankers];
                                                  updated[bIdx] = { ...(updated[bIdx] || {}), bankName: e.target.value };
                                                  handleCorporationChange(index, 'corpBankers', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Contact Person</label>
                                              <input
                                                type="text"
                                                value={banker.contactPerson || ''}
                                                onChange={(e) => {
                                                  const updated = [...bankers];
                                                  updated[bIdx] = { ...(updated[bIdx] || {}), contactPerson: e.target.value };
                                                  handleCorporationChange(index, 'corpBankers', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                                              <input
                                                type="tel"
                                                value={banker.phone || ''}
                                                onChange={(e) => {
                                                  const updated = [...bankers];
                                                  updated[bIdx] = { ...(updated[bIdx] || {}), phone: e.target.value };
                                                  handleCorporationChange(index, 'corpBankers', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                                              <input
                                                type="email"
                                                value={banker.email || ''}
                                                onChange={(e) => {
                                                  const updated = [...bankers];
                                                  updated[bIdx] = { ...(updated[bIdx] || {}), email: e.target.value };
                                                  handleCorporationChange(index, 'corpBankers', updated);
                                                }}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div className="md:col-span-2">
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Responsibilities</label>
                                              <textarea
                                                value={banker.responsibilities || ''}
                                                onChange={(e) => {
                                                  const updated = [...bankers];
                                                  updated[bIdx] = { ...(updated[bIdx] || {}), responsibilities: e.target.value };
                                                  handleCorporationChange(index, 'corpBankers', updated);
                                                }}
                                                rows={2}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                              />
                                            </div>
                                          </div>
                                          {isLast && (
                                            <div className="mt-4">
                                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Does {(corporationsData[index]?.legalName || "(Company's name)")} have additional banking relationships?
                                              </label>
                                              <div className="flex gap-4">
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`bankerMore-${index}-${bIdx}`}
                                                    value="yes"
                                                    checked={corp[`bankerMore_${bIdx}`] === 'yes'}
                                                    onChange={() => {
                                                      handleCorporationChange(index, `bankerMore_${bIdx}`, 'yes');
                                                      handleCorporationChange(index, 'corpBankers', [...bankers, {}]);
                                                    }}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`bankerMore-${index}-${bIdx}`}
                                                    value="no"
                                                    checked={corp[`bankerMore_${bIdx}`] === 'no'}
                                                    onChange={() => handleCorporationChange(index, `bankerMore_${bIdx}`, 'no')}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">No</span>
                                                </label>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                      </>
                                    )}
                                  </>
                                );
                              })()}

                              {/* Payroll Provider */}
                              {corporationsData[index]?.corporationType !== 'Holding Company' && (() => {
                                const corp = corporationsData[index] || {};
                                const payrollProviders: Record<string, string>[] = corp.payrollProviders || [{}];
                                const corp1Payroll: Record<string, string>[] = (index > 0 ? corporationsData[0]?.payrollProviders : []) || [];
                                const corp1PayrollName = corp1Payroll[0]?.name || corp1Payroll[0]?.selectedPerson || '';
                                const canReusePayroll = index > 0 && !!corp1PayrollName;
                                const reusePayroll = corp.reuseCorp1Payroll;
                                const currentCorpName = corp.legalName || `Corporation ${index + 1}`;

                                // Build list of internal people from the Corporate Step
                                const internalPeople: { key: string; name: string; role: string }[] = [];
                                if (corp.interimManager?.name) {
                                  internalPeople.push({ key: 'interimManager', name: corp.interimManager.name, role: 'Designated Interim Manager' });
                                }
                                (corp.additionalKeyPeople || []).forEach((p: Record<string, string>, i: number) => {
                                  if (p?.name) internalPeople.push({ key: `addKey_${i}`, name: p.name, role: 'Additional Key Person' });
                                });
                                (corp.signingAuthorityOtherPeople || []).forEach((p: Record<string, string>, i: number) => {
                                  if (p?.name) internalPeople.push({ key: `signOther_${i}`, name: p.name, role: 'Signing Authority' });
                                });

                                return (
                                  <>
                                    <h4 className="text-sm font-semibold text-gray-200 mt-6 mb-1">Payroll Provider</h4>
                                    <p className="text-xs text-gray-400 italic mb-4">Contact info for the internal or external party responsible for staff and shareholder remittances</p>

                                    {canReusePayroll && (
                                      <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Is {currentCorpName} using {corp1PayrollName}?
                                        </label>
                                        <div className="flex gap-4">
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`reusePayroll-${index}`}
                                              value="yes"
                                              checked={reusePayroll === 'yes'}
                                              onChange={() => {
                                                handleCorporationChange(index, 'reuseCorp1Payroll', 'yes');
                                                handleCorporationChange(index, 'payrollProviders', corp1Payroll.map((p: Record<string, string>) => ({ ...p })));
                                              }}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">Yes</span>
                                          </label>
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`reusePayroll-${index}`}
                                              value="no"
                                              checked={reusePayroll === 'no'}
                                              onChange={() => {
                                                handleCorporationChange(index, 'reuseCorp1Payroll', 'no');
                                                handleCorporationChange(index, 'payrollProviders', [{}]);
                                              }}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">Other</span>
                                          </label>
                                        </div>
                                      </div>
                                    )}

                                    {canReusePayroll && reusePayroll === 'yes' ? (
                                      <div className="p-4 bg-gray-700/50 rounded-lg mb-4">
                                        <p className="text-sm text-gray-300 mb-3">Using {corp1PayrollName}, the same Payroll Provider as {corporationsData[0]?.legalName || 'Corporation 1'}.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div><span className="text-xs text-gray-400">Type: </span><span className="text-sm text-gray-200">{corp1Payroll[0]?.type || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Name: </span><span className="text-sm text-gray-200">{corp1Payroll[0]?.name || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Title: </span><span className="text-sm text-gray-200">{corp1Payroll[0]?.title || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Phone: </span><span className="text-sm text-gray-200">{corp1Payroll[0]?.phone || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Email: </span><span className="text-sm text-gray-200">{corp1Payroll[0]?.email || '—'}</span></div>
                                          {corp1Payroll[0]?.responsibilities && <div className="md:col-span-2"><span className="text-xs text-gray-400">Responsibilities: </span><span className="text-sm text-gray-200">{corp1Payroll[0].responsibilities}</span></div>}
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                    {payrollProviders.map((provider, pIdx) => {
                                      const isLast = pIdx === payrollProviders.length - 1;
                                      const providerType = provider.type || '';

                                      return (
                                        <div key={pIdx} className="p-4 bg-gray-700/50 rounded-lg mb-4">
                                          <div className="flex items-center justify-between mb-3">
                                            {payrollProviders.length > 1 ? (
                                              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payroll Provider {pIdx + 1}</h5>
                                            ) : (
                                              <span />
                                            )}
                                            {payrollProviders.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = payrollProviders.filter((_, i) => i !== pIdx);
                                                  handleCorporationChange(index, 'payrollProviders', updated.length > 0 ? updated : [{}]);
                                                  handleCorporationChange(index, `payrollMore_${pIdx - 1}`, undefined);
                                                }}
                                                className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                                              >
                                                Remove
                                              </button>
                                            )}
                                          </div>

                                          {/* Internal or External */}
                                          <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                              Is this party internal or external?
                                            </label>
                                            <div className="flex gap-4">
                                              <label className="flex items-center">
                                                <input
                                                  type="radio"
                                                  name={`payrollType-${index}-${pIdx}`}
                                                  value="internal"
                                                  checked={providerType === 'internal'}
                                                  onChange={() => {
                                                    const updated = [...payrollProviders];
                                                    updated[pIdx] = { type: 'internal' };
                                                    handleCorporationChange(index, 'payrollProviders', updated);
                                                  }}
                                                  className="mr-2"
                                                />
                                                <span className="text-gray-300">Internal</span>
                                              </label>
                                              <label className="flex items-center">
                                                <input
                                                  type="radio"
                                                  name={`payrollType-${index}-${pIdx}`}
                                                  value="external"
                                                  checked={providerType === 'external'}
                                                  onChange={() => {
                                                    const updated = [...payrollProviders];
                                                    updated[pIdx] = { type: 'external' };
                                                    handleCorporationChange(index, 'payrollProviders', updated);
                                                  }}
                                                  className="mr-2"
                                                />
                                                <span className="text-gray-300">External</span>
                                              </label>
                                            </div>
                                          </div>

                                          {/* Internal: select from known people or Other */}
                                          {providerType === 'internal' && (
                                            <div className="mb-4">
                                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Select the internal person responsible for payroll:
                                              </label>
                                              {internalPeople.length > 0 ? (
                                                <div className="space-y-2 mb-3">
                                                  {internalPeople.map(person => (
                                                    <label key={person.key} className="flex items-center space-x-3 cursor-pointer">
                                                      <input
                                                        type="radio"
                                                        name={`payrollInternalPerson-${index}-${pIdx}`}
                                                        value={person.key}
                                                        checked={provider.selectedPerson === person.key}
                                                        onChange={() => {
                                                          const updated = [...payrollProviders];
                                                          updated[pIdx] = {
                                                            type: 'internal',
                                                            selectedPerson: person.key,
                                                            name: person.name,
                                                            role: person.role,
                                                          };
                                                          handleCorporationChange(index, 'payrollProviders', updated);
                                                        }}
                                                        className="mr-2"
                                                      />
                                                      <span className="text-sm text-gray-300">
                                                        <span className="font-medium text-gray-200">{person.name}</span>
                                                        <span className="text-gray-500"> — {person.role}</span>
                                                      </span>
                                                    </label>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-xs text-gray-500 italic mb-3">No internal people have been identified in the Corporate Step yet.</p>
                                              )}

                                              <label className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                  type="radio"
                                                  name={`payrollInternalPerson-${index}-${pIdx}`}
                                                  value="__other__"
                                                  checked={provider.selectedPerson === '__other__'}
                                                  onChange={() => {
                                                    const updated = [...payrollProviders];
                                                    updated[pIdx] = { type: 'internal', selectedPerson: '__other__' };
                                                    handleCorporationChange(index, 'payrollProviders', updated);
                                                  }}
                                                  className="mr-2"
                                                />
                                                <span className="text-sm text-gray-300 font-medium">Other</span>
                                              </label>

                                              {provider.selectedPerson === '__other__' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                                  <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                                    <input
                                                      type="text"
                                                      value={provider.name || ''}
                                                      onChange={(e) => {
                                                        const updated = [...payrollProviders];
                                                        updated[pIdx] = { ...updated[pIdx], name: e.target.value };
                                                        handleCorporationChange(index, 'payrollProviders', updated);
                                                      }}
                                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                                    <input
                                                      type="text"
                                                      value={provider.title || ''}
                                                      onChange={(e) => {
                                                        const updated = [...payrollProviders];
                                                        updated[pIdx] = { ...updated[pIdx], title: e.target.value };
                                                        handleCorporationChange(index, 'payrollProviders', updated);
                                                      }}
                                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                  </div>
                                                  <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Responsibilities</label>
                                                    <textarea
                                                      value={provider.responsibilities || ''}
                                                      onChange={(e) => {
                                                        const updated = [...payrollProviders];
                                                        updated[pIdx] = { ...updated[pIdx], responsibilities: e.target.value };
                                                        handleCorporationChange(index, 'payrollProviders', updated);
                                                      }}
                                                      rows={2}
                                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                                                    <input
                                                      type="tel"
                                                      value={provider.phone || ''}
                                                      onChange={(e) => {
                                                        const updated = [...payrollProviders];
                                                        updated[pIdx] = { ...updated[pIdx], phone: e.target.value };
                                                        handleCorporationChange(index, 'payrollProviders', updated);
                                                      }}
                                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                                                    <input
                                                      type="email"
                                                      value={provider.email || ''}
                                                      onChange={(e) => {
                                                        const updated = [...payrollProviders];
                                                        updated[pIdx] = { ...updated[pIdx], email: e.target.value };
                                                        handleCorporationChange(index, 'payrollProviders', updated);
                                                      }}
                                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* External: name/title/responsibilities/phone/email */}
                                          {providerType === 'external' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                                <input
                                                  type="text"
                                                  value={provider.name || ''}
                                                  onChange={(e) => {
                                                    const updated = [...payrollProviders];
                                                    updated[pIdx] = { ...updated[pIdx], name: e.target.value };
                                                    handleCorporationChange(index, 'payrollProviders', updated);
                                                  }}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                                <input
                                                  type="text"
                                                  value={provider.title || ''}
                                                  onChange={(e) => {
                                                    const updated = [...payrollProviders];
                                                    updated[pIdx] = { ...updated[pIdx], title: e.target.value };
                                                    handleCorporationChange(index, 'payrollProviders', updated);
                                                  }}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                              <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Responsibilities</label>
                                                <textarea
                                                  value={provider.responsibilities || ''}
                                                  onChange={(e) => {
                                                    const updated = [...payrollProviders];
                                                    updated[pIdx] = { ...updated[pIdx], responsibilities: e.target.value };
                                                    handleCorporationChange(index, 'payrollProviders', updated);
                                                  }}
                                                  rows={2}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                                                <input
                                                  type="tel"
                                                  value={provider.phone || ''}
                                                  onChange={(e) => {
                                                    const updated = [...payrollProviders];
                                                    updated[pIdx] = { ...updated[pIdx], phone: e.target.value };
                                                    handleCorporationChange(index, 'payrollProviders', updated);
                                                  }}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                                                <input
                                                  type="email"
                                                  value={provider.email || ''}
                                                  onChange={(e) => {
                                                    const updated = [...payrollProviders];
                                                    updated[pIdx] = { ...updated[pIdx], email: e.target.value };
                                                    handleCorporationChange(index, 'payrollProviders', updated);
                                                  }}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {isLast && (
                                            <div className="mt-4">
                                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Are there additional people responsible for payroll?
                                              </label>
                                              <div className="flex gap-4">
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`payrollMore-${index}-${pIdx}`}
                                                    value="yes"
                                                    checked={corp[`payrollMore_${pIdx}`] === 'yes'}
                                                    onChange={() => {
                                                      handleCorporationChange(index, `payrollMore_${pIdx}`, 'yes');
                                                      handleCorporationChange(index, 'payrollProviders', [...payrollProviders, {}]);
                                                    }}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`payrollMore-${index}-${pIdx}`}
                                                    value="no"
                                                    checked={corp[`payrollMore_${pIdx}`] === 'no'}
                                                    onChange={() => handleCorporationChange(index, `payrollMore_${pIdx}`, 'no')}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">No</span>
                                                </label>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                      </>
                                    )}
                                  </>
                                );
                              })()}

                              {/* Legal Counsel */}
                              {(() => {
                                const corp = corporationsData[index] || {};
                                const hasLawyer = corp.lawHasLawyer;
                                const lawyers: Record<string, any>[] = corp.lawLawyers || [{}];
                                const corp1Lawyers: Record<string, any>[] = (index > 0 ? corporationsData[0]?.lawLawyers : []) || [];
                                const corp1LawyerName = corp1Lawyers[0]?.contactName || corp1Lawyers[0]?.firmName || '';
                                const canReuseLawyer = index > 0 && !!corp1LawyerName;
                                const reuseLawyer = corp.reuseCorp1Lawyer;
                                const currentCorpName = corp.legalName || `Corporation ${index + 1}`;

                                const responsibilityOptions = [
                                  'Incorporation of the business',
                                  'Corporate minute book maintenance',
                                  'Annual corporate resolutions',
                                  'Shareholder agreements',
                                  'Buy-sell agreements',
                                  'Corporate succession planning',
                                  'Estate planning for business owners',
                                  'Secondary Will planning',
                                  'Family trust planning',
                                  'Holding company structure',
                                  'Corporate reorganizations',
                                  'Share freezes',
                                  'Estate freezes',
                                  'Section 85 rollovers',
                                  'Asset protection strategies',
                                  'Professional corporation planning',
                                  'Partnership agreements',
                                  'Business purchases or acquisitions',
                                  'Business sales or succession',
                                  'Commercial contracts',
                                  'Employment agreements',
                                  'Intellectual property or trademarks',
                                  'Real estate owned by the corporation',
                                  'Corporate financing or lending',
                                  'Regulatory or licensing matters',
                                  'Other',
                                ];

                                const updateLawyer = (lIdx: number, patch: Record<string, any>) => {
                                  const updated = [...lawyers];
                                  updated[lIdx] = { ...(updated[lIdx] || {}), ...patch };
                                  handleCorporationChange(index, 'lawLawyers', updated);
                                };

                                const toggleResponsibility = (lIdx: number, resp: string) => {
                                  const current = (lawyers[lIdx]?.responsibilities as string[]) || [];
                                  const next = current.includes(resp)
                                    ? current.filter(r => r !== resp)
                                    : [...current, resp];
                                  const docLocations = { ...(lawyers[lIdx]?.docLocations || {}) };
                                  if (!next.includes(resp)) delete docLocations[resp];
                                  updateLawyer(lIdx, { responsibilities: next, docLocations });
                                };

                                return (
                                  <>
                                    <h4 className="text-sm font-semibold text-gray-200 mt-6 mb-1">Legal Counsel</h4>
                                    <p className="text-xs text-gray-400 italic mb-2">
                                      Your corporate lawyer helps ensure your corporation can continue operating smoothly if you become incapacitated or pass away. They prepare and maintain the legal documents that govern ownership, management, and succession, helping reduce delays, disputes, and unnecessary taxes.
                                    </p>

                                    {canReuseLawyer && (
                                      <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Is {currentCorpName} using {corp1LawyerName}?
                                        </label>
                                        <div className="flex gap-4">
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`reuseLawyer-${index}`}
                                              value="yes"
                                              checked={reuseLawyer === 'yes'}
                                              onChange={() => {
                                                handleCorporationChange(index, 'reuseCorp1Lawyer', 'yes');
                                                handleCorporationChange(index, 'lawHasLawyer', 'yes');
                                                handleCorporationChange(index, 'lawLawyers', corp1Lawyers.map((l: Record<string, any>) => ({ ...l })));
                                              }}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">Yes</span>
                                          </label>
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`reuseLawyer-${index}`}
                                              value="no"
                                              checked={reuseLawyer === 'no'}
                                              onChange={() => {
                                                handleCorporationChange(index, 'reuseCorp1Lawyer', 'no');
                                                handleCorporationChange(index, 'lawHasLawyer', undefined);
                                                handleCorporationChange(index, 'lawLawyers', [{}]);
                                              }}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">Other</span>
                                          </label>
                                        </div>
                                      </div>
                                    )}

                                    {canReuseLawyer && reuseLawyer === 'yes' ? (
                                      <div className="p-4 bg-gray-700/50 rounded-lg mb-4">
                                        <p className="text-sm text-gray-300 mb-3">Using {corp1LawyerName}, the same Legal Counsel as {corporationsData[0]?.legalName || 'Corporation 1'}.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div><span className="text-xs text-gray-400">Firm: </span><span className="text-sm text-gray-200">{corp1Lawyers[0]?.firmName || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Contact: </span><span className="text-sm text-gray-200">{corp1Lawyers[0]?.contactName || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Title: </span><span className="text-sm text-gray-200">{corp1Lawyers[0]?.title || '—'}</span></div>
                                          <div><span className="text-xs text-gray-400">Phone: </span><span className="text-sm text-gray-200">{corp1Lawyers[0]?.phone || '—'}</span></div>
                                          <div className="md:col-span-2"><span className="text-xs text-gray-400">Email: </span><span className="text-sm text-gray-200">{corp1Lawyers[0]?.email || '—'}</span></div>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Do you regularly work with a corporate lawyer?
                                      </label>
                                      <div className="flex gap-4">
                                        <label className="flex items-center">
                                          <input
                                            type="radio"
                                            name={`lawHasLawyer-${index}`}
                                            value="yes"
                                            checked={hasLawyer === 'yes'}
                                            onChange={() => {
                                              handleCorporationChange(index, 'lawHasLawyer', 'yes');
                                              if (!lawyers[0]) handleCorporationChange(index, 'lawLawyers', [{}]);
                                            }}
                                            className="mr-2"
                                          />
                                          <span className="text-gray-300">Yes</span>
                                        </label>
                                        <label className="flex items-center">
                                          <input
                                            type="radio"
                                            name={`lawHasLawyer-${index}`}
                                            value="no"
                                            checked={hasLawyer === 'no'}
                                            onChange={() => {
                                              handleCorporationChange(index, 'lawHasLawyer', 'no');
                                              handleCorporationChange(index, 'lawLawyers', undefined);
                                              handleCorporationChange(index, 'lawMore_0', undefined);
                                            }}
                                            className="mr-2"
                                          />
                                          <span className="text-gray-300">No</span>
                                        </label>
                                      </div>
                                    </div>

                                    {hasLawyer === 'yes' && lawyers.map((lawyer, lIdx) => {
                                      const isLast = lIdx === lawyers.length - 1;
                                      const responsibilities = (lawyer.responsibilities as string[]) || [];
                                      const docLocations = (lawyer.docLocations as Record<string, string>) || {};

                                      return (
                                        <div key={lIdx} className="p-4 bg-gray-700/50 rounded-lg mb-4">
                                          <div className="flex items-center justify-between mb-3">
                                            {lawyers.length > 1 ? (
                                              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Legal Counsel {lIdx + 1}</h5>
                                            ) : (
                                              <span />
                                            )}
                                            {lIdx > 0 && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = lawyers.filter((_, i) => i !== lIdx);
                                                  handleCorporationChange(index, 'lawLawyers', updated.length > 0 ? updated : [{}]);
                                                  handleCorporationChange(index, `lawMore_${lIdx - 1}`, undefined);
                                                }}
                                                className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                                              >
                                                Remove
                                              </button>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Firm Name</label>
                                              <input
                                                type="text"
                                                value={lawyer.firmName || ''}
                                                onChange={(e) => updateLawyer(lIdx, { firmName: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Contact Name</label>
                                              <input
                                                type="text"
                                                value={lawyer.contactName || ''}
                                                onChange={(e) => updateLawyer(lIdx, { contactName: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                              <input
                                                type="text"
                                                value={lawyer.title || ''}
                                                onChange={(e) => updateLawyer(lIdx, { title: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                                              <input
                                                type="tel"
                                                value={lawyer.phone || ''}
                                                onChange={(e) => updateLawyer(lIdx, { phone: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                            <div className="md:col-span-2">
                                              <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                                              <input
                                                type="email"
                                                value={lawyer.email || ''}
                                                onChange={(e) => updateLawyer(lIdx, { email: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              />
                                            </div>
                                          </div>

                                          {/* Responsibilities checklist */}
                                          <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Responsibilities</label>
                                            <div className="space-y-2">
                                              {responsibilityOptions.map((resp) => {
                                                const checked = responsibilities.includes(resp);
                                                const isOther = resp === 'Other';
                                                return (
                                                  <div key={resp}>
                                                    <label className="flex items-center space-x-3 cursor-pointer">
                                                      <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleResponsibility(lIdx, resp)}
                                                        className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                                      />
                                                      <span className="text-sm text-gray-300">{resp}</span>
                                                    </label>
                                                    {checked && (
                                                      <div className="ml-7 mt-2 mb-2">
                                                        <label className="block text-xs font-medium text-gray-400 mb-1">
                                                          Location of the documents
                                                        </label>
                                                        <input
                                                          type="text"
                                                          value={docLocations[resp] || ''}
                                                          onChange={(e) => {
                                                            const next = { ...docLocations, [resp]: e.target.value };
                                                            updateLawyer(lIdx, { docLocations: next });
                                                          }}
                                                          placeholder="Where are these documents stored?"
                                                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                      </div>
                                                    )}
                                                    {isOther && checked && (
                                                      <div className="ml-7 mt-2">
                                                        <label className="block text-xs font-medium text-gray-400 mb-1">
                                                          Please specify
                                                        </label>
                                                        <input
                                                          type="text"
                                                          value={lawyer.otherResponsibility || ''}
                                                          onChange={(e) => updateLawyer(lIdx, { otherResponsibility: e.target.value })}
                                                          placeholder="Describe the other responsibility"
                                                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          {isLast && (
                                            <div className="mt-4">
                                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Are there additional lawyers that you regularly work with?
                                              </label>
                                              <div className="flex gap-4">
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`lawMore-${index}-${lIdx}`}
                                                    value="yes"
                                                    checked={corp[`lawMore_${lIdx}`] === 'yes'}
                                                    onChange={() => {
                                                      handleCorporationChange(index, `lawMore_${lIdx}`, 'yes');
                                                      handleCorporationChange(index, 'lawLawyers', [...lawyers, {}]);
                                                    }}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`lawMore-${index}-${lIdx}`}
                                                    value="no"
                                                    checked={corp[`lawMore_${lIdx}`] === 'no'}
                                                    onChange={() => handleCorporationChange(index, `lawMore_${lIdx}`, 'no')}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">No</span>
                                                </label>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                      </>
                                    )}
                                  </>
                                );
                              })()}

                              {/* Buy/Sell Provisions and Insurance Funding */}
                              {corporationsData[index]?.corporationType !== 'Holding Company' && (
                              <Subsection title="Buy/Sell Provisions and Insurance Funding">
                              {(() => {
                                const corp = corporationsData[index] || {};
                                const companyName = corp.legalName || `Corporation ${index + 1}`;
                                const triggerEvents: string[] = corp.buysellTriggers || [];
                                const noAgreement = triggerEvents.includes('__no_agreement__');
                                const triggerOptions = [
                                  'Death',
                                  'Disability/Incapacity',
                                  'Retirement',
                                  'Marriage Breakdown (Divorce)',
                                  'Bankruptcy',
                                  'Loss of Professional License',
                                  'Unsure',
                                ];

                                const toggleTrigger = (value: string) => {
                                  if (value === '__no_agreement__') {
                                    const next = noAgreement ? [] : ['__no_agreement__'];
                                    handleCorporationChange(index, 'buysellTriggers', next);
                                  } else {
                                    if (noAgreement) return;
                                    const next = triggerEvents.includes(value)
                                      ? triggerEvents.filter(t => t !== value)
                                      : [...triggerEvents, value];
                                    handleCorporationChange(index, 'buysellTriggers', next);
                                  }
                                };

                                return (
                                  <>
                                    <h4 className="sr-only">Buy/Sell Provisions and Insurance Funding</h4>
                                    <p className="text-xs text-gray-400 italic mb-3">
                                      A well-drafted USA (Unanimous Shareholder Agreement) typically contains these provisions to prevent "fire sales" or unwanted business partners.
                                    </p>

                                    <div className="mb-4">
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Triggering Events: Specify which events compel or allow a sale
                                      </label>
                                      <div className="space-y-2">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={noAgreement}
                                            onChange={() => toggleTrigger('__no_agreement__')}
                                            className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                          />
                                          <span className="text-sm text-gray-300">{companyName} does not have a buy/sell agreement</span>
                                        </label>
                                        {triggerOptions.map((opt) => (
                                          <label key={opt} className={`flex items-center space-x-3 ${noAgreement ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <input
                                              type="checkbox"
                                              checked={triggerEvents.includes(opt)}
                                              onChange={() => toggleTrigger(opt)}
                                              disabled={noAgreement}
                                              className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                            />
                                            <span className="text-sm text-gray-300">{opt}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>

                                    {!noAgreement && (() => {
                                      const valuationMethods: string[] = corp.buysellValuation || [];
                                      const valuationOptions = [
                                        { value: 'Book Value', label: 'Book Value: Based on the balance sheet.' },
                                        { value: 'Formula', label: 'Formula: (e.g., a multiple of historical earnings/EBITDA).' },
                                        { value: 'Fixed Price', label: 'Fixed Price: A set value updated periodically by shareholders.' },
                                        { value: 'Independent Valuation', label: 'Independent Valuation: Requirement to hire a professional Business Valuator at the time of the trigger.' },
                                        { value: 'Unsure', label: 'Unsure' },
                                      ];
                                      const toggleValuation = (value: string) => {
                                        const next = valuationMethods.includes(value)
                                          ? valuationMethods.filter(v => v !== value)
                                          : [...valuationMethods, value];
                                        handleCorporationChange(index, 'buysellValuation', next);
                                      };
                                      return (
                                        <div className="mb-4">
                                          <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Valuation Methodology: Identify how the price is determined
                                          </label>
                                          <div className="space-y-2">
                                            {valuationOptions.map((opt) => (
                                              <label key={opt.value} className="flex items-start space-x-3 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={valuationMethods.includes(opt.value)}
                                                  onChange={() => toggleValuation(opt.value)}
                                                  className="w-4 h-4 mt-0.5 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-sm text-gray-300">{opt.label}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {!noAgreement && (() => {
                                      const fundingTypes: string[] = corp.buysellFunding || [];
                                      const fundingNA = fundingTypes.includes('__na__');
                                      const fundingOptions = [
                                        { value: 'Life', label: 'Life' },
                                        { value: 'Disability', label: 'Disability' },
                                        { value: 'Critical Illness', label: 'Critical Illness' },
                                        { value: '__na__', label: 'N/A' },
                                      ];
                                      const toggleFunding = (value: string) => {
                                        if (value === '__na__') {
                                          const next = fundingNA ? [] : ['__na__'];
                                          handleCorporationChange(index, 'buysellFunding', next as unknown as string);
                                        } else {
                                          if (fundingNA) return;
                                          const next = fundingTypes.includes(value)
                                            ? fundingTypes.filter(t => t !== value)
                                            : [...fundingTypes, value];
                                          handleCorporationChange(index, 'buysellFunding', next as unknown as string);
                                        }
                                      };

                                      const policies: Array<Record<string, unknown>> = (corp.buysellInsurance as Array<Record<string, unknown>>) || [{}];
                                      const insuranceTypeOptions = ['Life', 'Disability', 'Critical Illness'];

                                      const handlePolicyChange = (pIdx: number, field: string, value: unknown) => {
                                        const updated = [...policies];
                                        if (!updated[pIdx]) updated[pIdx] = {};
                                        updated[pIdx][field] = value;
                                        handleCorporationChange(index, 'buysellInsurance', updated as unknown as string);
                                      };
                                      const togglePolicyInsuranceType = (pIdx: number, value: string) => {
                                        const updated = [...policies];
                                        if (!updated[pIdx]) updated[pIdx] = {};
                                        const current = (updated[pIdx].insuranceType as string[]) || [];
                                        updated[pIdx].insuranceType = current.includes(value)
                                          ? current.filter(t => t !== value)
                                          : [...current, value];
                                        handleCorporationChange(index, 'buysellInsurance', updated as unknown as string);
                                      };
                                      const addPolicy = () => {
                                        handleCorporationChange(index, 'buysellInsurance', [...policies, {}] as unknown as string);
                                      };
                                      const removePolicy = (pIdx: number) => {
                                        const updated = policies.filter((_, i) => i !== pIdx);
                                        handleCorporationChange(index, 'buysellInsurance', updated as unknown as string);
                                      };

                                      const hasAdditional = corp.buysellHasAdditionalPolicy === 'yes';
                                      const setHasAdditional = (v: string) => {
                                        handleCorporationChange(index, 'buysellHasAdditionalPolicy', v);
                                        if (v === 'yes' && policies.length === 1) {
                                          addPolicy();
                                        }
                                        if (v === 'no') {
                                          handleCorporationChange(index, 'buysellInsurance', [policies[0] || {}] as unknown as string);
                                        }
                                      };

                                      return (
                                        <>
                                          <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                              Funding Strategy: Insurance-Funded: Identify if the buy-sell is funded by life, disability, or critical illness insurance
                                            </label>
                                            <div className="space-y-2">
                                              {fundingOptions.map((opt) => (
                                                <label
                                                  key={opt.value}
                                                  className={`flex items-center space-x-3 ${opt.value !== '__na__' && fundingNA ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={fundingTypes.includes(opt.value)}
                                                    onChange={() => toggleFunding(opt.value)}
                                                    disabled={opt.value !== '__na__' && fundingNA}
                                                    className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                                  />
                                                  <span className="text-sm text-gray-300">{opt.label}</span>
                                                </label>
                                              ))}
                                            </div>
                                          </div>

                                          {!fundingNA && (
                                            <>
                                              <h5 className="text-sm font-semibold text-gray-200 mt-4 mb-2">Insurance Amount and Ownership</h5>
                                              {policies.map((policy, pIdx) => (
                                                <div key={pIdx} className="p-4 bg-gray-700/60 rounded-lg space-y-3 mb-3 relative">
                                                  {pIdx > 0 && (
                                                    <button
                                                      type="button"
                                                      onClick={() => removePolicy(pIdx)}
                                                      className="absolute top-3 right-3 text-red-400 hover:text-red-300"
                                                      aria-label="Remove policy"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                                                  )}
                                                  {pIdx > 0 && <h6 className="text-xs font-semibold text-gray-400">Additional Policy {pIdx}</h6>}

                                                  <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Insurance Type</label>
                                                    <div className="space-y-2">
                                                      {insuranceTypeOptions.map((opt) => (
                                                        <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                                                          <input
                                                            type="checkbox"
                                                            checked={((policy.insuranceType as string[]) || []).includes(opt)}
                                                            onChange={() => togglePolicyInsuranceType(pIdx, opt)}
                                                            className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                                          />
                                                          <span className="text-sm text-gray-300">{opt}</span>
                                                        </label>
                                                      ))}
                                                    </div>
                                                  </div>

                                                  {[
                                                    { field: 'insurer', label: 'Insurer' },
                                                    { field: 'contactPerson', label: 'Contact Person' },
                                                    { field: 'contactPersonFirm', label: 'Contact Person Firm' },
                                                    { field: 'phone', label: 'Phone' },
                                                    { field: 'email', label: 'Email' },
                                                    { field: 'faceValue', label: 'Face Value of Policy' },
                                                    { field: 'lifeInsured', label: 'Life Insured' },
                                                    { field: 'beneficiary', label: 'Beneficiary' },
                                                    { field: 'policyOwner', label: 'Policy Owner' },
                                                    { field: 'documentLocation', label: 'Document Location' },
                                                  ].map((f) => (
                                                    <div key={f.field}>
                                                      <label className="block text-sm font-medium text-gray-300 mb-1">{f.label}</label>
                                                      <input
                                                        type="text"
                                                        value={(policy[f.field] as string) || ''}
                                                        onChange={(e) => handlePolicyChange(pIdx, f.field, e.target.value)}
                                                        className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                      />
                                                    </div>
                                                  ))}
                                                </div>
                                              ))}

                                              <div className="mt-2">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                  Are there additional life, disability, or critical illness policies?
                                                </label>
                                                <div className="flex gap-4">
                                                  <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                      type="radio"
                                                      checked={hasAdditional}
                                                      onChange={() => setHasAdditional('yes')}
                                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <span className="text-sm text-gray-300">Yes</span>
                                                  </label>
                                                  <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                      type="radio"
                                                      checked={corp.buysellHasAdditionalPolicy === 'no'}
                                                      onChange={() => setHasAdditional('no')}
                                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <span className="text-sm text-gray-300">No</span>
                                                  </label>
                                                </div>
                                              </div>

                                              {hasAdditional && (
                                                <button
                                                  type="button"
                                                  onClick={addPolicy}
                                                  className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
                                                >
                                                  <Plus className="w-4 h-4" /> Add Another Policy
                                                </button>
                                              )}
                                            </>
                                          )}
                                        </>
                                      );
                                    })()}

                                    {(() => {
                                      const otherFunding = corp.otherFunding === 'yes';
                                      const setOtherFunding = (v: string) => {
                                        handleCorporationChange(index, 'otherFunding', v);
                                        if (v === 'no') {
                                          handleCorporationChange(index, 'otherFundingDetails', '');
                                        }
                                      };

                                      const keyPersonHas = corp.keyPersonHas === 'yes';
                                      const setKeyPersonHas = (v: string) => {
                                        handleCorporationChange(index, 'keyPersonHas', v);
                                        if (v === 'no') {
                                          handleCorporationChange(index, 'keyPersonPolicies', [{}] as unknown as string);
                                          handleCorporationChange(index, 'keyPersonHasAdditional', 'no');
                                        }
                                      };

                                      const previousInsurers: string[] = [];
                                      const buysellPolicies = (corp.buysellInsurance as Array<Record<string, unknown>>) || [];
                                      buysellPolicies.forEach(p => {
                                        const ins = (p.insurer as string) || '';
                                        if (ins && !previousInsurers.includes(ins)) previousInsurers.push(ins);
                                      });

                                      const keyPolicies: Array<Record<string, unknown>> = (corp.keyPersonPolicies as Array<Record<string, unknown>>) || [{}];
                                      const keyInsuranceTypeOptions = ['Life', 'Disability', 'Critical Illness'];

                                      const handleKeyPolicyChange = (pIdx: number, field: string, value: unknown) => {
                                        const updated = [...keyPolicies];
                                        if (!updated[pIdx]) updated[pIdx] = {};
                                        updated[pIdx][field] = value;
                                        handleCorporationChange(index, 'keyPersonPolicies', updated as unknown as string);
                                      };
                                      const addKeyPolicy = () => {
                                        handleCorporationChange(index, 'keyPersonPolicies', [...keyPolicies, {}] as unknown as string);
                                      };
                                      const removeKeyPolicy = (pIdx: number) => {
                                        const updated = keyPolicies.filter((_, i) => i !== pIdx);
                                        handleCorporationChange(index, 'keyPersonPolicies', updated as unknown as string);
                                      };

                                      const keyHasAdditional = corp.keyPersonHasAdditional === 'yes';
                                      const setKeyHasAdditional = (v: string) => {
                                        handleCorporationChange(index, 'keyPersonHasAdditional', v);
                                        if (v === 'yes' && keyPolicies.length === 1) {
                                          addKeyPolicy();
                                        }
                                        if (v === 'no') {
                                          handleCorporationChange(index, 'keyPersonPolicies', [keyPolicies[0] || {}] as unknown as string);
                                        }
                                      };

                                      return (
                                        <>
                                          <div className="mb-4 mt-6">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                              Other Funding: If not insurance, is there a Sinking Fund, Promissory Note arrangement, or bank financing plan?
                                            </label>
                                            <div className="flex gap-4">
                                              <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                  type="radio"
                                                  checked={otherFunding}
                                                  onChange={() => setOtherFunding('yes')}
                                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-sm text-gray-300">Yes</span>
                                              </label>
                                              <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                  type="radio"
                                                  checked={corp.otherFunding === 'no'}
                                                  onChange={() => setOtherFunding('no')}
                                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-sm text-gray-300">No</span>
                                              </label>
                                            </div>
                                            {otherFunding && (
                                              <div className="mt-3">
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Details:</label>
                                                <textarea
                                                  value={(corp.otherFundingDetails as string) || ''}
                                                  onChange={(e) => handleCorporationChange(index, 'otherFundingDetails', e.target.value)}
                                                  rows={3}
                                                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                              </div>
                                            )}
                                          </div>

                                          <div className="mb-4 mt-6">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                              Does {companyName} have any Key Person Insurance?
                                            </label>
                                            <div className="flex gap-4">
                                              <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                  type="radio"
                                                  checked={keyPersonHas}
                                                  onChange={() => setKeyPersonHas('yes')}
                                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-sm text-gray-300">Yes</span>
                                              </label>
                                              <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                  type="radio"
                                                  checked={corp.keyPersonHas === 'no'}
                                                  onChange={() => setKeyPersonHas('no')}
                                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-sm text-gray-300">No</span>
                                              </label>
                                            </div>
                                          </div>

                                          {keyPersonHas && (
                                            <>
                                              <h5 className="text-sm font-semibold text-gray-200 mt-4 mb-2">Key Person Insurance Details</h5>
                                              {keyPolicies.map((policy, pIdx) => {
                                                const insurerMode = (policy.insurerMode as string) || (previousInsurers.length > 0 ? '' : 'other');
                                                return (
                                                  <div key={pIdx} className="p-4 bg-gray-700/60 rounded-lg space-y-3 mb-3 relative">
                                                    {pIdx > 0 && (
                                                      <button
                                                        type="button"
                                                        onClick={() => removeKeyPolicy(pIdx)}
                                                        className="absolute top-3 right-3 text-red-400 hover:text-red-300"
                                                        aria-label="Remove policy"
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </button>
                                                    )}
                                                    {pIdx > 0 && <h6 className="text-xs font-semibold text-gray-400">Additional Key Person Policy {pIdx}</h6>}

                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-300 mb-2">Insurance Type</label>
                                                      <div className="space-y-2">
                                                        {keyInsuranceTypeOptions.map((opt) => (
                                                          <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                                                            <input
                                                              type="radio"
                                                              checked={(policy.insuranceType as string) === opt}
                                                              onChange={() => handleKeyPolicyChange(pIdx, 'insuranceType', opt)}
                                                              className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                            />
                                                            <span className="text-sm text-gray-300">{opt}</span>
                                                          </label>
                                                        ))}
                                                      </div>
                                                    </div>

                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-300 mb-1">Life Insured</label>
                                                      <input
                                                        type="text"
                                                        value={(policy.lifeInsured as string) || ''}
                                                        onChange={(e) => handleKeyPolicyChange(pIdx, 'lifeInsured', e.target.value)}
                                                        className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                      />
                                                    </div>

                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-300 mb-2">Insurer</label>
                                                      <div className="space-y-2">
                                                        {previousInsurers.map((ins) => (
                                                          <label key={ins} className="flex items-center space-x-3 cursor-pointer">
                                                            <input
                                                              type="radio"
                                                              checked={insurerMode === 'preselect' && (policy.insurer as string) === ins}
                                                              onChange={() => {
                                                                handleKeyPolicyChange(pIdx, 'insurerMode', 'preselect');
                                                                handleKeyPolicyChange(pIdx, 'insurer', ins);
                                                              }}
                                                              className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                            />
                                                            <span className="text-sm text-gray-300">{ins}</span>
                                                          </label>
                                                        ))}
                                                        <label className="flex items-center space-x-3 cursor-pointer">
                                                          <input
                                                            type="radio"
                                                            checked={insurerMode === 'other' || (insurerMode === '' && previousInsurers.length === 0)}
                                                            onChange={() => {
                                                              handleKeyPolicyChange(pIdx, 'insurerMode', 'other');
                                                              if (previousInsurers.length === 0) handleKeyPolicyChange(pIdx, 'insurer', '');
                                                            }}
                                                            className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                          />
                                                          <span className="text-sm text-gray-300">Other</span>
                                                        </label>
                                                      </div>
                                                    </div>

                                                    {(insurerMode === 'other' || (insurerMode === '' && previousInsurers.length === 0)) && (
                                                      <>
                                                        <div>
                                                          <label className="block text-sm font-medium text-gray-300 mb-1">Insurer Name</label>
                                                          <input
                                                            type="text"
                                                            value={(policy.insurer as string) || ''}
                                                            onChange={(e) => handleKeyPolicyChange(pIdx, 'insurer', e.target.value)}
                                                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                          />
                                                        </div>
                                                        {[
                                                          { field: 'contactPerson', label: 'Contact Person' },
                                                          { field: 'contactPersonFirm', label: "Contact Person's Firm" },
                                                          { field: 'phone', label: 'Phone' },
                                                          { field: 'email', label: 'Email' },
                                                        ].map((f) => (
                                                          <div key={f.field}>
                                                            <label className="block text-sm font-medium text-gray-300 mb-1">{f.label}</label>
                                                            <input
                                                              type="text"
                                                              value={(policy[f.field] as string) || ''}
                                                              onChange={(e) => handleKeyPolicyChange(pIdx, f.field, e.target.value)}
                                                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                          </div>
                                                        ))}
                                                      </>
                                                    )}
                                                  </div>
                                                );
                                              })}

                                              <div className="mt-2">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                  Are there additional Key Person Policies?
                                                </label>
                                                <div className="flex gap-4">
                                                  <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                      type="radio"
                                                      checked={keyHasAdditional}
                                                      onChange={() => setKeyHasAdditional('yes')}
                                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <span className="text-sm text-gray-300">Yes</span>
                                                  </label>
                                                  <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                      type="radio"
                                                      checked={corp.keyPersonHasAdditional === 'no'}
                                                      onChange={() => setKeyHasAdditional('no')}
                                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <span className="text-sm text-gray-300">No</span>
                                                  </label>
                                                </div>
                                              </div>

                                              {keyHasAdditional && (
                                                <button
                                                  type="button"
                                                  onClick={addKeyPolicy}
                                                  className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
                                                >
                                                  <Plus className="w-4 h-4" /> Add Another Key Person Policy
                                                </button>
                                              )}
                                            </>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </>
                                );
                              })()}
                              </Subsection>
                              )}
                            </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step.sectionId === 'corporateFinancialConnections' && (() => {
            const step1 = allAnswers?.get('aboutYou') as Record<string, string> | undefined;
            const client1Name = step1?.['fullName'] || 'Client 1';
            const hasSpouse = step1?.['maritalStatus'] === 'married' || step1?.['maritalStatus'] === 'common_law';
            const client2Name = step1?.['spouseName'] || 'Client 2';
            const step6 = allAnswers?.get('corporations') as Record<string, unknown> | undefined;
            const allCorps = ((step6?.['corporationsData'] as Array<Record<string, string>>) || []).map((c) => ({ legalName: c.legalName || '' })).filter((c) => c.legalName.trim());
            const clientOwnedCorpNames = new Set(getClientOwnedCorpNames(allAnswers || new Map()).map((n) => n.toLowerCase()));
            const corporations = allCorps.filter((c) => clientOwnedCorpNames.has(c.legalName.toLowerCase()));
            const allCorporations = allCorps;

            const gateQuestion = step.questions[0];
            const displayLabel = typeof gateQuestion.label === 'function'
              ? gateQuestion.label(allAnswers || new Map())
              : gateQuestion.label;
            const resolvedOptions = typeof gateQuestion.options === 'function'
              ? (gateQuestion.options as (a: Map<string, Record<string, unknown>>) => Array<{ value: string; label: string }>)(allAnswers || new Map())
              : gateQuestion.options;

            const pgAnswer = answers['pgHasPersonalGuarantee'];
            const pgEntries = (answers['personalGuaranteesData'] as PersonalGuaranteeData[]) || [];

            const handlePgChange = (idx: number, field: keyof PersonalGuaranteeData, value: unknown) => {
              const updated = [...pgEntries];
              while (updated.length <= idx) updated.push({} as PersonalGuaranteeData);
              updated[idx] = { ...updated[idx], [field]: value };
              onAnswerChange('personalGuaranteesData', updated);
            };

            const handlePgMultiChange = (idx: number, updates: Partial<PersonalGuaranteeData>) => {
              const updated = [...pgEntries];
              while (updated.length <= idx) updated.push({} as PersonalGuaranteeData);
              updated[idx] = { ...updated[idx], ...updates };
              onAnswerChange('personalGuaranteesData', updated);
            };

            return (
              <>
                <FormField
                  question={{ ...gateQuestion, label: displayLabel, options: resolvedOptions }}
                  value={answers[gateQuestion.key]}
                  onChange={(value) => {
                    onAnswerChange(gateQuestion.key, value);
                    if (value !== 'yes') {
                      // Structured data preserved per FACTS PERSIST — gateway controls visibility, not deletion
                    }
                  }}
                />

                {pgAnswer === 'yes' && (
                  <Subsection title="Personal Guarantees">
                    <p className="text-sm text-gray-400 italic mb-4">
                      A personal guarantee generally means that if the company cannot repay the debt, the lender may be able to require the person who provided the guarantee to repay some or all of it personally.
                    </p>

                    {pgEntries.map((entry, idx) => (
                      <PersonalGuaranteeDetails
                        key={idx}
                        index={idx}
                        data={entry}
                        client1Name={client1Name}
                        client2Name={client2Name}
                        hasSpouse={hasSpouse}
                        corporations={corporations}
                        existingObligations={registryEntities.filter(
                          (e) => e.active && e.entityType === 'obligation' &&
                            (e.metadata as Record<string, unknown>)?.borrowerEntityId ===
                              registryEntities.find(re => re.active && re.entityType === 'corporation' && re.displayName === entry.selectedCompany)?.id
                        ).map((e) => ({
                          id: e.id,
                          label: `${(e.metadata as Record<string, unknown>)?.lenderDisplayName || 'Lender'} — approx. ${(e.metadata as Record<string, unknown>)?.amount || 'unknown'}`,
                          obligationType: (e.metadata as Record<string, unknown>)?.obligationType as string || '',
                          amount: (e.metadata as Record<string, unknown>)?.amount as string || '',
                          lenderDisplayName: (e.metadata as Record<string, unknown>)?.lenderDisplayName as string || '',
                        }))}
                        onChange={(field, value) => handlePgChange(idx, field, value)}
                        onMultiChange={(updates) => handlePgMultiChange(idx, updates)}
                        onRemove={() => {
                          const entry = pgEntries[idx];
                          if (entry?.obligationEntityId) removeCorporateObligation(entry.obligationEntityId);
                          const updated = pgEntries.filter((_, entryIndex) => entryIndex !== idx);
                          onAnswerChange('personalGuaranteesData', updated.length > 0 ? updated : undefined);
                        }}
                      />
                    ))}

                    {pgEntries.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Is there another personal guarantee to add?
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="pg-has-another"
                              value="yes"
                              checked={pgEntries[pgEntries.length - 1]?.hasAdditional === 'yes'}
                              onChange={() => {
                                const updated = [...pgEntries];
                                updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'yes' };
                                onAnswerChange('personalGuaranteesData', [...updated, {} as PersonalGuaranteeData]);
                              }}
                              className="mr-2"
                            />
                            <span className="text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="pg-has-another"
                              value="no"
                              checked={pgEntries[pgEntries.length - 1]?.hasAdditional === 'no' || !pgEntries[pgEntries.length - 1]?.hasAdditional}
                              onChange={() => {
                                const updated = [...pgEntries];
                                updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'no' };
                                onAnswerChange('personalGuaranteesData', updated);
                              }}
                              className="mr-2"
                            />
                            <span className="text-gray-300">No</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {pgEntries.length === 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Would you like to add a personal guarantee?
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="pg-add-initial"
                              value="yes"
                              checked={false}
                              onChange={() => {
                                onAnswerChange('personalGuaranteesData', [{} as PersonalGuaranteeData]);
                              }}
                              className="mr-2"
                            />
                            <span className="text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="pg-add-initial"
                              value="no"
                              checked={false}
                              onChange={() => {}}
                              className="mr-2"
                            />
                            <span className="text-gray-300">No</span>
                          </label>
                        </div>
                      </div>
                    )}

                  </Subsection>
                )}

                {(() => {
                  const slQuestion = step.questions[1];
                  if (!slQuestion) return null;
                  const slDisplayLabel = typeof slQuestion.label === 'function'
                    ? slQuestion.label(allAnswers || new Map())
                    : slQuestion.label;
                  const slResolvedOptions = typeof slQuestion.options === 'function'
                    ? (slQuestion.options as (a: Map<string, Record<string, unknown>>) => Array<{ value: string; label: string }>)(allAnswers || new Map())
                    : slQuestion.options;
                  const slAnswer = answers['slHasShareholderLoan'];

                  const slEntries = (answers['shareholderLoansData'] as ShareholderLoanData[]) || [];

                  const handleSlChange = (idx: number, field: keyof ShareholderLoanData, value: unknown) => {
                    const updated = [...slEntries];
                    while (updated.length <= idx) updated.push({} as ShareholderLoanData);
                    updated[idx] = { ...updated[idx], [field]: value };
                    onAnswerChange('shareholderLoansData', updated);
                  };

                  const handleSlMultiChange = (idx: number, updates: Partial<ShareholderLoanData>) => {
                    const updated = [...slEntries];
                    while (updated.length <= idx) updated.push({} as ShareholderLoanData);
                    updated[idx] = { ...updated[idx], ...updates };
                    onAnswerChange('shareholderLoansData', updated);
                  };

                  return (
                    <>
                      <FormField
                        question={{ ...slQuestion, label: slDisplayLabel, options: slResolvedOptions }}
                        value={slAnswer}
                        onChange={(value) => {
                          onAnswerChange('slHasShareholderLoan', value);
                          if (value !== 'yes') {
                          // Structured data preserved per FACTS PERSIST
                          }
                        }}
                      />

                      {slAnswer === 'yes' && (
                        <Subsection title="Money You Have Put Into Your Company(ies)">
                          {slEntries.map((entry, idx) => (
                            <ShareholderLoanDetails
                              key={idx}
                              index={idx}
                              data={entry}
                              client1Name={client1Name}
                              client2Name={client2Name}
                              hasSpouse={hasSpouse}
                              corporations={corporations}
                              onChange={(field, value) => handleSlChange(idx, field, value)}
                              onMultiChange={(updates) => handleSlMultiChange(idx, updates)}
                              onRemove={() => {
                                const entry = slEntries[idx];
                                if (entry?.obligationEntityId) removeCorporateObligation(entry.obligationEntityId);
                                const updated = slEntries.filter((_, entryIndex) => entryIndex !== idx);
                                onAnswerChange('shareholderLoansData', updated.length > 0 ? updated : undefined);
                              }}
                            />
                          ))}

                          {slEntries.length > 0 && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Is there another amount that one of your companies owes {client1Name}{hasSpouse ? ` or ${client2Name}` : ''}?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="sl-has-another"
                                    value="yes"
                                    checked={slEntries[slEntries.length - 1]?.hasAdditional === 'yes'}
                                    onChange={() => {
                                      const updated = [...slEntries];
                                      updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'yes' };
                                      onAnswerChange('shareholderLoansData', [...updated, {} as ShareholderLoanData]);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="sl-has-another"
                                    value="no"
                                    checked={slEntries[slEntries.length - 1]?.hasAdditional === 'no' || !slEntries[slEntries.length - 1]?.hasAdditional}
                                    onChange={() => {
                                      const updated = [...slEntries];
                                      updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'no' };
                                      onAnswerChange('shareholderLoansData', updated);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {slEntries.length === 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Would you like to add a shareholder loan?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="sl-add-initial"
                                    value="yes"
                                    checked={false}
                                    onChange={() => {
                                      onAnswerChange('shareholderLoansData', [{} as ShareholderLoanData]);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="sl-add-initial"
                                    value="no"
                                    checked={false}
                                    onChange={() => {}}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}
                        </Subsection>
                      )}
                    </>
                  );
                })()}

                {(() => {
                  const coQuestion = step.questions[2];
                  if (!coQuestion) return null;
                  const coDisplayLabel = typeof coQuestion.label === 'function'
                    ? coQuestion.label(allAnswers || new Map())
                    : coQuestion.label;
                  const coResolvedOptions = typeof coQuestion.options === 'function'
                    ? (coQuestion.options as (a: Map<string, Record<string, unknown>>) => Array<{ value: string; label: string }>)(allAnswers || new Map())
                    : coQuestion.options;
                  const coAnswer = answers['slOwesCompany'];

                  const coEntries = (answers['companyOwedData'] as CompanyOwedData[]) || [];

                  const handleCoChange = (idx: number, field: keyof CompanyOwedData, value: unknown) => {
                    const updated = [...coEntries];
                    while (updated.length <= idx) updated.push({} as CompanyOwedData);
                    updated[idx] = { ...updated[idx], [field]: value };
                    onAnswerChange('companyOwedData', updated);
                  };

                  const handleCoMultiChange = (idx: number, updates: Partial<CompanyOwedData>) => {
                    const updated = [...coEntries];
                    while (updated.length <= idx) updated.push({} as CompanyOwedData);
                    updated[idx] = { ...updated[idx], ...updates };
                    onAnswerChange('companyOwedData', updated);
                  };

                  return (
                    <>
                      <FormField
                        question={{ ...coQuestion, label: coDisplayLabel, options: coResolvedOptions }}
                        value={coAnswer}
                        onChange={(value) => {
                          onAnswerChange('slOwesCompany', value);
                          if (value !== 'yes') {
                          // Structured data preserved per FACTS PERSIST
                          }
                        }}
                      />

                      {coAnswer === 'yes' && (
                        <Subsection title="Money You Owe Your Company(ies)">
                          {coEntries.map((entry, idx) => (
                            <CompanyOwedDetails
                              key={idx}
                              index={idx}
                              data={entry}
                              client1Name={client1Name}
                              client2Name={client2Name}
                              hasSpouse={hasSpouse}
                              corporations={corporations}
                              onChange={(field, value) => handleCoChange(idx, field, value)}
                              onMultiChange={(updates) => handleCoMultiChange(idx, updates)}
                              onRemove={() => {
                                const entry = coEntries[idx];
                                if (entry?.obligationEntityId) removeCorporateObligation(entry.obligationEntityId);
                                const updated = coEntries.filter((_, entryIndex) => entryIndex !== idx);
                                onAnswerChange('companyOwedData', updated.length > 0 ? updated : undefined);
                              }}
                            />
                          ))}

                          {coEntries.length > 0 && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Is there another amount that {client1Name}{hasSpouse ? ` or ${client2Name}` : ''} owes to a company?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="co-has-another"
                                    value="yes"
                                    checked={coEntries[coEntries.length - 1]?.hasAdditional === 'yes'}
                                    onChange={() => {
                                      const updated = [...coEntries];
                                      updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'yes' };
                                      onAnswerChange('companyOwedData', [...updated, {} as CompanyOwedData]);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="co-has-another"
                                    value="no"
                                    checked={coEntries[coEntries.length - 1]?.hasAdditional === 'no' || !coEntries[coEntries.length - 1]?.hasAdditional}
                                    onChange={() => {
                                      const updated = [...coEntries];
                                      updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'no' };
                                      onAnswerChange('companyOwedData', updated);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {coEntries.length === 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Would you like to add an amount owed to a company?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="co-add-initial"
                                    value="yes"
                                    checked={false}
                                    onChange={() => {
                                      onAnswerChange('companyOwedData', [{} as CompanyOwedData]);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="co-add-initial"
                                    value="no"
                                    checked={false}
                                    onChange={() => {}}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}
                        </Subsection>
                      )}
                    </>
                  );
                })()}

                {corporations.length >= 2 && (() => {
                  const icQuestion = step.questions[3];
                  if (!icQuestion) return null;
                  const icDisplayLabel = typeof icQuestion.label === 'function'
                    ? icQuestion.label(allAnswers || new Map())
                    : icQuestion.label;
                  const icResolvedOptions = typeof icQuestion.options === 'function'
                    ? (icQuestion.options as (a: Map<string, Record<string, unknown>>) => Array<{ value: string; label: string }>)(allAnswers || new Map())
                    : icQuestion.options;
                  const icAnswer = answers['slIntercompanyLoan'];

                  const icEntries = (answers['intercompanyLoansData'] as IntercompanyLoanData[]) || [];

                  const handleIcChange = (idx: number, field: keyof IntercompanyLoanData, value: unknown) => {
                    const updated = [...icEntries];
                    while (updated.length <= idx) updated.push({} as IntercompanyLoanData);
                    updated[idx] = { ...updated[idx], [field]: value };
                    onAnswerChange('intercompanyLoansData', updated);
                  };

                  const handleIcMultiChange = (idx: number, updates: Partial<IntercompanyLoanData>) => {
                    const updated = [...icEntries];
                    while (updated.length <= idx) updated.push({} as IntercompanyLoanData);
                    updated[idx] = { ...updated[idx], ...updates };
                    onAnswerChange('intercompanyLoansData', updated);
                  };

                  return (
                    <>
                      <FormField
                        question={{ ...icQuestion, label: icDisplayLabel, options: icResolvedOptions }}
                        value={icAnswer}
                        onChange={(value) => {
                          onAnswerChange('slIntercompanyLoan', value);
                          if (value !== 'yes') {
                          // Structured data preserved per FACTS PERSIST
                          }
                        }}
                      />

                      {icAnswer === 'yes' && (
                        <Subsection title="Money Between Your Companies">
                          {icEntries.map((entry, idx) => (
                            <IntercompanyLoanDetails
                              key={idx}
                              index={idx}
                              data={entry}
                              corporations={allCorporations}
                              onChange={(field, value) => handleIcChange(idx, field, value)}
                              onMultiChange={(updates) => handleIcMultiChange(idx, updates)}
                              onRemove={() => {
                                const entry = icEntries[idx];
                                if (entry?.obligationEntityId) removeCorporateObligation(entry.obligationEntityId);
                                const updated = icEntries.filter((_, entryIndex) => entryIndex !== idx);
                                onAnswerChange('intercompanyLoansData', updated.length > 0 ? updated : undefined);
                              }}
                            />
                          ))}

                          {icEntries.length > 0 && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Is there another amount owing between your companies?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="ic-has-another"
                                    value="yes"
                                    checked={icEntries[icEntries.length - 1]?.hasAdditional === 'yes'}
                                    onChange={() => {
                                      const updated = [...icEntries];
                                      updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'yes' };
                                      onAnswerChange('intercompanyLoansData', [...updated, {} as IntercompanyLoanData]);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="ic-has-another"
                                    value="no"
                                    checked={icEntries[icEntries.length - 1]?.hasAdditional === 'no' || !icEntries[icEntries.length - 1]?.hasAdditional}
                                    onChange={() => {
                                      const updated = [...icEntries];
                                      updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'no' };
                                      onAnswerChange('intercompanyLoansData', updated);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {icEntries.length === 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Would you like to add an amount owing between your companies?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="ic-add-initial"
                                    value="yes"
                                    checked={false}
                                    onChange={() => {
                                      onAnswerChange('intercompanyLoansData', [{} as IntercompanyLoanData]);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="ic-add-initial"
                                    value="no"
                                    checked={false}
                                    onChange={() => {}}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}
                        </Subsection>
                      )}
                    </>
                  );
                })()}

                {allCorporations.length >= 1 && (() => {
                  const rplQuestion = step.questions[4];
                  if (!rplQuestion) return null;
                  const rplDisplayLabel = typeof rplQuestion.label === 'function'
                    ? rplQuestion.label(allAnswers || new Map())
                    : rplQuestion.label;
                  const rplResolvedOptions = typeof rplQuestion.options === 'function'
                    ? (rplQuestion.options as (a: Map<string, Record<string, unknown>>) => Array<{ value: string; label: string }>)(allAnswers || new Map())
                    : rplQuestion.options;
                  const rplAnswer = answers['slRelatedPartyLoan'];

                  const rplEntries = (answers['relatedPartyLoansData'] as RelatedPartyLoanData[]) || [];

                  const handleRplChange = (idx: number, field: keyof RelatedPartyLoanData, value: unknown) => {
                    const updated = [...rplEntries];
                    while (updated.length <= idx) updated.push({} as RelatedPartyLoanData);
                    updated[idx] = { ...updated[idx], [field]: value };
                    onAnswerChange('relatedPartyLoansData', updated);
                  };

                  const handleRplMultiChange = (idx: number, updates: Partial<RelatedPartyLoanData>) => {
                    const updated = [...rplEntries];
                    while (updated.length <= idx) updated.push({} as RelatedPartyLoanData);
                    updated[idx] = { ...updated[idx], ...updates };
                    onAnswerChange('relatedPartyLoansData', updated);
                  };

                  return (
                    <>
                      <FormField
                        question={{ ...rplQuestion, label: rplDisplayLabel, options: rplResolvedOptions }}
                        value={rplAnswer}
                        onChange={(value) => {
                          onAnswerChange('slRelatedPartyLoan', value);
                          if (value !== 'yes') {
                          // Structured data preserved per FACTS PERSIST
                          }
                        }}
                      />

                      {rplAnswer === 'yes' && (
                        <Subsection title="Other Related-Party Loans">
                          {rplEntries.map((entry, idx) => (
                            <RelatedPartyLoanDetails
                              key={idx}
                              index={idx}
                              data={entry}
                              corporations={allCorporations}
                              onChange={(field, value) => handleRplChange(idx, field, value)}
                              onMultiChange={(updates) => handleRplMultiChange(idx, updates)}
                              onRemove={() => {
                                const entry = rplEntries[idx];
                                if (entry?.obligationEntityId) removeCorporateObligation(entry.obligationEntityId);
                                const updated = rplEntries.filter((_, entryIndex) => entryIndex !== idx);
                                onAnswerChange('relatedPartyLoansData', updated.length > 0 ? updated : undefined);
                              }}
                            />
                          ))}

                          {rplEntries.length > 0 && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Is there another financial arrangement like this involving one of your companies?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="rpl-has-another"
                                    value="yes"
                                    checked={rplEntries[rplEntries.length - 1]?.hasAdditional === 'yes'}
                                    onChange={() => {
                                      const updated = [...rplEntries];
                                      updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'yes' };
                                      onAnswerChange('relatedPartyLoansData', [...updated, {} as RelatedPartyLoanData]);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="rpl-has-another"
                                    value="no"
                                    checked={rplEntries[rplEntries.length - 1]?.hasAdditional === 'no' || !rplEntries[rplEntries.length - 1]?.hasAdditional}
                                    onChange={() => {
                                      const updated = [...rplEntries];
                                      updated[updated.length - 1] = { ...updated[updated.length - 1], hasAdditional: 'no' };
                                      onAnswerChange('relatedPartyLoansData', updated);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {rplEntries.length === 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Would you like to add a related-party loan?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="rpl-add-initial"
                                    value="yes"
                                    checked={false}
                                    onChange={() => {
                                      onAnswerChange('relatedPartyLoansData', [{} as RelatedPartyLoanData]);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="rpl-add-initial"
                                    value="no"
                                    checked={false}
                                    onChange={() => {}}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}
                        </Subsection>
                      )}
                    </>
                  );
                })()}
              </>
            );
          })()}

          {step.sectionId === 'corporateFinancialConnections' && (() => {
            const step1Answers = allAnswers?.get('aboutYou') || {};
            const client1Name = (step1Answers['fullName'] as string) || 'Client 1';
            const client2Name = (step1Answers['spouseName'] as string) || 'Client 2';
            const maritalStatus = step1Answers['maritalStatus'] as string;
            const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';

            const step6Answers = allAnswers?.get('corporations') || {};
            const corporationsData = step6Answers['corporationsData'] as Array<Record<string, unknown>> | undefined;
            const corporations = (corporationsData || []).map((c) => ({
              legalName: (c['legalName'] as string) || '',
            })).filter((c) => c.legalName.trim());

            const allFormData = Object.fromEntries(
              Array.from(allAnswers?.entries() || []).flatMap(([_, stepAnswers]) =>
                Object.entries(stepAnswers)
              )
            );

            const anyYes =
              allFormData['pgHasPersonalGuarantee'] === 'yes' ||
              allFormData['slHasShareholderLoan'] === 'yes' ||
              allFormData['slOwesCompany'] === 'yes' ||
              allFormData['slIntercompanyLoan'] === 'yes' ||
              allFormData['slRelatedPartyLoan'] === 'yes';

            if (!anyYes) return null;

            const handleRemoveFromReview = (section: string, index: number) => {
              const dataKeys: Record<string, string> = {
                pg: 'personalGuaranteesData',
                sl: 'shareholderLoansData',
                co: 'companyOwedData',
                ic: 'intercompanyLoansData',
                rpl: 'relatedPartyLoansData',
              };
              const dataKey = dataKeys[section];
              if (!dataKey) return;
              const entries = (answers[dataKey] as Array<Record<string, unknown>>) || [];
              const entry = entries[index];
              if (entry?.obligationEntityId) removeCorporateObligation(entry.obligationEntityId as string);
              const updated = entries.filter((_, idx) => idx !== index);
              onAnswerChange(dataKey, updated.length > 0 ? updated : undefined);
            };

            const handleAddAnother = (section: string) => {
              const dataKeys: Record<string, string> = {
                pg: 'personalGuaranteesData',
                sl: 'shareholderLoansData',
                co: 'companyOwedData',
                ic: 'intercompanyLoansData',
                rpl: 'relatedPartyLoansData',
              };
              const dataKey = dataKeys[section];
              if (!dataKey) return;
              const entries = (answers[dataKey] as Array<Record<string, unknown>>) || [];
              onAnswerChange(dataKey, [...entries, {}]);
            };

            return (
              <CorporateFinancialReview
                answers={answers}
                client1Name={client1Name}
                client2Name={client2Name}
                hasSpouse={hasSpouse}
                corporations={corporations}
                onEdit={() => {}}
                onRemove={handleRemoveFromReview}
                onAddAnother={handleAddAnother}
                onConfirm={() => onAnswerChange('cfcReviewConfirmed', 'yes')}
                onMakeChanges={() => onAnswerChange('cfcReviewConfirmed', 'no')}
              />
            );
          })()}

          {step.sectionId === 'professionalTeam' && (() => {
            const allFormData = Object.fromEntries(
              Array.from(allAnswers?.entries() || []).flatMap(([_, stepAnswers]) =>
                Object.entries(stepAnswers)
              )
            );

            const isVisible = (question: typeof step.questions[0]) => {
              if (!question.condition) return true;
              return question.condition(allFormData);
            };

            const renderQuestion = (question: typeof step.questions[0]) => {
              if (!isVisible(question)) return null;

              const displayLabel = typeof question.label === 'function'
                ? question.label(allAnswers || new Map())
                : question.label;

              const resolvedOptions = typeof question.options === 'function'
                ? (question.options as (a: Map<string, Record<string, unknown>>) => Array<{ value: string; label: string }>)(allAnswers || new Map())
                : question.options;

              return (
                <FormField
                  key={question.key}
                  question={{ ...question, label: displayLabel, options: resolvedOptions }}
                  value={answers[question.key]}
                  onChange={(value) => onAnswerChange(question.key, value)}
                />
              );
            };

            const fpKeys = new Set([
              'fpHasAdvisor', 'fpAdvisor1Id', 'fpAdvisor1WorksWith', 'fpAdvisor1IsCameronSmith', 'fpAdvisor1Firm', 'fpAdvisor1Name', 'fpAdvisor1Phone',
              'fpAdvisor1Email', 'fpAdvisor1Website', 'fpAdvisor1Services',
              'fpAdvisor1Duration', 'fpAdvisor1IncludeInContactList', 'fpAdvisor1RecordsLocation', 'fpHasAdditionalAdvisor',
              'fpAdvisor2Id', 'fpAdvisor2WorksWith', 'fpAdvisor2IsCameronSmith', 'fpAdvisor2Firm', 'fpAdvisor2Name', 'fpAdvisor2Phone',
              'fpAdvisor2Email', 'fpAdvisor2Website', 'fpAdvisor2Services',
              'fpAdvisor2Duration', 'fpAdvisor2RecordsLocation', 'fpAdvisor2IncludeInContactList', 'fpAdvisor2HasAdditionalAdvisor',
            ]);
            const fpAdvisor2Keys = new Set([
              'fpAdvisor2WorksWith', 'fpAdvisor2IsCameronSmith', 'fpAdvisor2Firm', 'fpAdvisor2Name', 'fpAdvisor2Phone',
              'fpAdvisor2Email', 'fpAdvisor2Website', 'fpAdvisor2Services',
              'fpAdvisor2Duration', 'fpAdvisor2RecordsLocation', 'fpAdvisor2IncludeInContactList', 'fpAdvisor2HasAdditionalAdvisor',
            ]);
            const acctKeys = new Set([
              'acctHasAccountant', 'acctAdvisor1Firm', 'acctAdvisor1Name', 'acctAdvisor1Phone',
              'acctAdvisor1Email', 'acctAdvisor1WorksWith', 'acctAdvisor1Services',
              'acctAdvisor1Duration', 'acctAdvisor1DocLocation', 'acctAdvisor1IncludeInContactList',
              'acctHasAdditional',
            ]);
            const lawKeys = new Set([
              'lawHasLawyer', 'lawAdvisor1Firm', 'lawAdvisor1Name', 'lawAdvisor1Phone',
              'lawAdvisor1Email', 'lawAdvisor1WorksWith', 'lawAdvisor1Services',
              'lawAdvisor1Duration', 'lawAdvisor1DocLocation', 'lawAdvisor1IncludeInContactList',
              'lawHasAdditional',
            ]);
            const insKeys = new Set([
              'insHasAdvisor', 'insAdvisor1Firm', 'insAdvisor1Name', 'insAdvisor1Phone',
              'insAdvisor1Email', 'insAdvisor1WorksWith', 'insAdvisor1Services',
              'insAdvisor1Duration', 'insAdvisor1DocLocation', 'insAdvisor1IncludeInContactList',
              'insHasAdditional',
            ]);
            const insAdvisor2Keys = new Set([
              'insAdvisor2WorksWith', 'insAdvisor2Firm', 'insAdvisor2Name', 'insAdvisor2Phone',
              'insAdvisor2Email', 'insAdvisor2Services', 'insAdvisor2Duration',
              'insAdvisor2DocLocation', 'insAdvisor2IncludeInContactList',
            ]);
            const fpHealthKeys = new Set([
              'fp_health_0_name', 'fp_health_0_clinic', 'fp_health_0_city', 'fp_health_0_phone', 'fp_health_0_has_additional',
              'fp_health_1_name', 'fp_health_1_clinic', 'fp_health_1_city', 'fp_health_1_phone', 'fp_health_1_has_additional',
              'fp_health_2_name', 'fp_health_2_clinic', 'fp_health_2_city', 'fp_health_2_phone',
            ]);
            const spHealthKeys = new Set([
              'sp_health_has', 'sp_health_0_name', 'sp_health_0_specialty', 'sp_health_0_phone',
              'sp_health_0_has_additional', 'sp_health_1_name', 'sp_health_1_specialty', 'sp_health_1_phone',
              'sp_health_1_has_additional', 'sp_health_2_name', 'sp_health_2_specialty', 'sp_health_2_phone',
              'sp_health_2_has_additional', 'sp_health_3_name', 'sp_health_3_specialty', 'sp_health_3_phone',
              'sp_health_3_has_additional', 'sp_health_4_name', 'sp_health_4_specialty', 'sp_health_4_phone',
            ]);
            const phHealthKeys = new Set([
              'ph_health_0_name', 'ph_health_0_pharmacy', 'ph_health_0_phone', 'ph_health_0_has_additional',
              'ph_health_1_name', 'ph_health_1_pharmacy', 'ph_health_1_phone', 'ph_health_1_has_additional',
              'ph_health_2_name', 'ph_health_2_pharmacy', 'ph_health_2_phone', 'ph_health_2_has_additional',
              'ph_health_3_name', 'ph_health_3_pharmacy', 'ph_health_3_phone', 'ph_health_3_has_additional',
              'ph_health_4_name', 'ph_health_4_pharmacy', 'ph_health_4_phone',
            ]);

            const fpQuestions = step.questions.filter(q => fpKeys.has(q.key) && !fpAdvisor2Keys.has(q.key));
            const fpAdvisor2Questions = step.questions.filter(q => fpAdvisor2Keys.has(q.key));
            const acctQuestions = step.questions.filter(q => acctKeys.has(q.key));
            const lawQuestions = step.questions.filter(q => lawKeys.has(q.key));
            const insQuestions = step.questions.filter(q => insKeys.has(q.key));
            const insAdvisor2Questions = step.questions.filter(q => insAdvisor2Keys.has(q.key));
            const fpHealthQuestions = step.questions.filter(q => fpHealthKeys.has(q.key));
            const spHealthQuestions = step.questions.filter(q => spHealthKeys.has(q.key));
            const phHealthQuestions = step.questions.filter(q => phHealthKeys.has(q.key));

            const fpCheckboxKey = 'fpAdvisor1IsCameronSmith';
            const fpCheckboxIdx = fpQuestions.findIndex(q => q.key === fpCheckboxKey);
            const fpPreCheckbox = fpCheckboxIdx >= 0 ? fpQuestions.slice(0, fpCheckboxIdx) : [];
            const fpCheckboxAndRest = fpCheckboxIdx >= 0 ? fpQuestions.slice(fpCheckboxIdx) : fpQuestions;

            return (
              <>
                <h4 className="text-base font-semibold text-blue-400 mt-4 mb-1">Financial Planner / Wealth Advisor</h4>
                {fpPreCheckbox.map(renderQuestion)}
                {fpCheckboxAndRest.length > 0 && (
                  <>
                    <h5 className="text-sm font-semibold text-blue-300 mt-4 mb-1">Financial Planner or Wealth Advisor Information</h5>
                    {fpCheckboxAndRest.map(renderQuestion)}
                  </>
                )}
                {answers['fpHasAdditionalAdvisor'] === 'yes' && fpAdvisor2Questions.length > 0 && fpAdvisor2Questions.some(q => {
                  if (!q.condition) return true;
                  return q.condition(answers);
                }) && (
                  <>
                    <div className="flex items-center justify-between mt-6 mb-1">
                      <h5 className="text-sm font-semibold text-blue-300">Second Financial Planner or Wealth Advisor Information</h5>
                      <button
                        type="button"
                        onClick={() => {
                          ['fpAdvisor2IsCameronSmith', 'fpAdvisor2Firm', 'fpAdvisor2Name', 'fpAdvisor2Phone', 'fpAdvisor2Email', 'fpAdvisor2Website', 'fpAdvisor2Services', 'fpAdvisor2Duration', 'fpAdvisor2RecordsLocation', 'fpAdvisor2IncludeInContactList', 'fpAdvisor2WorksWith', 'fpAdvisor2HasAdditionalAdvisor'].forEach(key => {
                            onAnswerChange(key, undefined);
                          });
                          onAnswerChange('fpHasAdditionalAdvisor', 'no');
                          onAnswerChange('fpAdditionalAdvisorsData', undefined);
                        }}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
                        aria-label="Remove second advisor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    {fpAdvisor2Questions.map(renderQuestion)}
                  </>
                )}
                {(() => {
                  if (answers['fpAdvisor2HasAdditionalAdvisor'] !== 'yes') return null;
                  const ordinals = ['Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh'];
                  const additionalData = (answers['fpAdditionalAdvisorsData'] as Array<Record<string, unknown>>) || [];
                  const serviceOptions = [
                    { value: 'investments', label: 'Investments' },
                    { value: 'retirement_planning', label: 'Retirement planning' },
                    { value: 'insurance', label: 'Insurance' },
                    { value: 'estate_planning', label: 'Estate planning' },
                    { value: 'tax_planning', label: 'Tax planning' },
                    { value: 'cash_flow', label: 'Cash flow' },
                    { value: 'business_planning', label: 'Business planning' },
                    { value: 'other', label: 'Other' },
                  ];
                  const allStepAnswers = Object.fromEntries(
                    Array.from(allAnswers?.entries() || []).flatMap(([_, s]) => Object.entries(s))
                  );
                  const hasSpouseAdv = (allStepAnswers['maritalStatus'] === 'married' || allStepAnswers['maritalStatus'] === 'common_law');
                  const client1NameAdv = (allStepAnswers['fullName'] as string) || 'Client 1';
                  const client2NameAdv = (allStepAnswers['spouseName'] as string) || 'Client 2';
                  const worksWithOptions = hasSpouseAdv
                    ? [{ value: 'client1', label: client1NameAdv }, { value: 'client2', label: client2NameAdv }]
                    : [{ value: 'client1', label: client1NameAdv }];

                  const updateAdvisor = (idx: number, field: string, val: unknown) => {
                    const updated = [...additionalData];
                    while (updated.length <= idx) updated.push({});
                    updated[idx] = { ...updated[idx], [field]: val };
                    onAnswerChange('fpAdditionalAdvisorsData', updated);
                  };

                  const sections: React.ReactElement[] = [];
                  let showNext = true;
                  for (let i = 0; i < ordinals.length && showNext; i++) {
                    const advisor = additionalData[i] || {};
                    const isCameron = !!(advisor.isCameronSmith);
                    const selectedServices = (advisor.services as string[]) || [];
                    const selectedWorksWith = (advisor.worksWith as string[]) || [];

                    if (isCameron) {
                      if (!advisor.firm) updateAdvisor(i, 'firm', 'Clarify Wealth Ltd.');
                      if (!advisor.name) updateAdvisor(i, 'name', 'Cameron Smith');
                      if (!advisor.phone) updateAdvisor(i, 'phone', '647-448-5963');
                      if (!advisor.email) updateAdvisor(i, 'email', 'cameron.smith@ipcsecurities.com');
                      if (!advisor.website) updateAdvisor(i, 'website', 'www.clarifywealth.ca');
                    }

                    sections.push(
                      <React.Fragment key={i}>
                        <div className="flex items-center justify-between mt-6 mb-1">
                          <h5 className="text-sm font-semibold text-blue-300">{ordinals[i]} Financial Planner or Wealth Advisor Information</h5>
                          <button
                            type="button"
                            onClick={() => {
                              if (i === 0) {
                                onAnswerChange('fpAdvisor2HasAdditionalAdvisor', 'no');
                                onAnswerChange('fpAdditionalAdvisorsData', undefined);
                              } else {
                                const trimmed = additionalData.slice(0, i);
                                if (trimmed.length > 0) {
                                  trimmed[trimmed.length - 1] = { ...trimmed[trimmed.length - 1], hasAdditional: 'no' };
                                }
                                onAnswerChange('fpAdditionalAdvisorsData', trimmed.length > 0 ? trimmed : undefined);
                              }
                            }}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
                            aria-label={`Remove ${ordinals[i].toLowerCase()} advisor`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3">Who does this Financial Planner work with?</label>
                          <div className="space-y-2">
                            {worksWithOptions.map(opt => (
                              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="checkbox" checked={selectedWorksWith.includes(opt.value)}
                                  onChange={(e) => {
                                    const next = e.target.checked ? [...selectedWorksWith, opt.value] : selectedWorksWith.filter(v => v !== opt.value);
                                    updateAdvisor(i, 'worksWith', next);
                                  }}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded" />
                                <span className="ml-3 text-gray-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="mb-6">
                          <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                            <input type="checkbox" checked={isCameron}
                              onChange={(e) => {
                                updateAdvisor(i, 'isCameronSmith', e.target.checked);
                                if (!e.target.checked) {
                                  ['firm','name','phone','email','website'].forEach(f => updateAdvisor(i, f, ''));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded" />
                            <span className="ml-3 text-gray-300">Cameron Smith CFP®</span>
                          </label>
                        </div>
                        {!isCameron && (
                          <>
                            {(['firm','name','phone','email','website'] as const).map(field => (
                              <div key={field} className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                                  {field === 'name' ? 'Advisor name' : field === 'firm' ? 'Firm' : field === 'website' ? 'Website (optional)' : field.charAt(0).toUpperCase() + field.slice(1)}
                                </label>
                                <input type={field === 'email' ? 'email' : 'text'} value={(advisor[field] as string) || ''}
                                  onChange={(e) => updateAdvisor(i, field, e.target.value)}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                              </div>
                            ))}
                          </>
                        )}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3">What do they help you with?</label>
                          <div className="space-y-2">
                            {serviceOptions.map(opt => (
                              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="checkbox" checked={selectedServices.includes(opt.value)}
                                  onChange={(e) => {
                                    const next = e.target.checked ? [...selectedServices, opt.value] : selectedServices.filter(v => v !== opt.value);
                                    updateAdvisor(i, 'services', next);
                                  }}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded" />
                                <span className="ml-3 text-gray-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-2">How long have you worked together?</label>
                          <input type="text" value={(advisor.duration as string) || ''}
                            onChange={(e) => updateAdvisor(i, 'duration', e.target.value)}
                            placeholder="e.g., 5 years"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Where do you keep your records?</label>
                          <input type="text" value={(advisor.recordsLocation as string) || ''}
                            onChange={(e) => updateAdvisor(i, 'recordsLocation', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3">May we include this professional in your executor's contact list and action guide?</label>
                          <div className="space-y-2">
                            {[{value:'yes',label:'Yes'},{value:'no',label:'No'}].map(opt => (
                              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="radio" name={`fpAdditional_${i}_include`} value={opt.value}
                                  checked={advisor.includeInContactList === opt.value}
                                  onChange={() => updateAdvisor(i, 'includeInContactList', opt.value)}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-3 text-gray-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {i < ordinals.length - 1 && (
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-3">Is there an additional Financial Planner/Wealth Advisor that you work with?</label>
                            <div className="space-y-2">
                              {[{value:'yes',label:'Yes'},{value:'no',label:'No'}].map(opt => (
                                <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                  <input type="radio" name={`fpAdditional_${i}_hasMore`} value={opt.value}
                                    checked={advisor.hasAdditional === opt.value}
                                    onChange={() => {
                                      updateAdvisor(i, 'hasAdditional', opt.value);
                                      if (opt.value === 'no') {
                                        const trimmed = additionalData.slice(0, i + 1);
                                        onAnswerChange('fpAdditionalAdvisorsData', trimmed);
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-3 text-gray-300">{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );

                    showNext = advisor.hasAdditional === 'yes' && i < ordinals.length - 1;
                  }
                  return <>{sections}</>;
                })()}

                <h4 className="text-base font-semibold text-blue-400 mt-6 mb-1">Accountant (CPA)</h4>
                {acctQuestions.map(renderQuestion)}
                {(() => {
                  if (answers['acctHasAdditional'] !== 'yes') return null;
                  const ordinals = ['Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
                  const additionalData = (answers['acctAdditionalData'] as Array<Record<string, unknown>>) || [];
                  const acctServiceOptions = [
                    { value: 'personal_tax_returns', label: 'Personal tax returns' },
                    { value: 'corporate_tax', label: 'Corporate tax' },
                    { value: 'trust_tax_returns', label: 'Trust tax returns' },
                    { value: 'bookkeeping', label: 'Bookkeeping' },
                    { value: 'payroll', label: 'Payroll' },
                    { value: 'estate_tax', label: 'Estate tax' },
                    { value: 'other', label: 'Other' },
                  ];
                  const allStepAnswers = Object.fromEntries(
                    Array.from(allAnswers?.entries() || []).flatMap(([_, s]) => Object.entries(s))
                  );
                  const hasSpouseAcct = (allStepAnswers['maritalStatus'] === 'married' || allStepAnswers['maritalStatus'] === 'common_law');
                  const client1NameAcct = (allStepAnswers['fullName'] as string) || 'Client 1';
                  const client2NameAcct = (allStepAnswers['spouseName'] as string) || 'Client 2';
                  const worksWithOptionsAcct = hasSpouseAcct
                    ? [{ value: 'client1', label: client1NameAcct }, { value: 'client2', label: client2NameAcct }]
                    : [{ value: 'client1', label: client1NameAcct }];

                  const updateAcct = (idx: number, field: string, val: unknown) => {
                    const updated = [...additionalData];
                    while (updated.length <= idx) updated.push({});
                    updated[idx] = { ...updated[idx], [field]: val };
                    onAnswerChange('acctAdditionalData', updated);
                  };

                  const sections: React.ReactElement[] = [];
                  let showNext = true;
                  for (let i = 0; i < ordinals.length && showNext; i++) {
                    const advisor = additionalData[i] || {};
                    const selectedServices = (advisor.services as string[]) || [];
                    const selectedWorksWith = (advisor.worksWith as string[]) || [];

                    sections.push(
                      <React.Fragment key={i}>
                        <div className="flex items-center justify-between mt-6 mb-1">
                          <h5 className="text-sm font-semibold text-blue-300">{ordinals[i]} Accountant (CPA) Information</h5>
                          <button
                            type="button"
                            onClick={() => {
                              if (i === 0) {
                                onAnswerChange('acctHasAdditional', 'no');
                                onAnswerChange('acctAdditionalData', undefined);
                              } else {
                                const trimmed = additionalData.slice(0, i);
                                if (trimmed.length > 0) {
                                  trimmed[trimmed.length - 1] = { ...trimmed[trimmed.length - 1], hasAdditional: 'no' };
                                }
                                onAnswerChange('acctAdditionalData', trimmed.length > 0 ? trimmed : undefined);
                              }
                            }}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
                            aria-label={`Remove ${ordinals[i].toLowerCase()} accountant`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3">Who does this accountant work with?</label>
                          <div className="space-y-2">
                            {worksWithOptionsAcct.map(opt => (
                              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="checkbox" checked={selectedWorksWith.includes(opt.value)}
                                  onChange={(e) => {
                                    const next = e.target.checked ? [...selectedWorksWith, opt.value] : selectedWorksWith.filter(v => v !== opt.value);
                                    updateAcct(i, 'worksWith', next);
                                  }}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded" />
                                <span className="ml-3 text-gray-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {(['firm','name','phone','email'] as const).map(field => (
                          <div key={field} className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                              {field === 'name' ? 'Accountant name' : field === 'firm' ? 'Firm' : field.charAt(0).toUpperCase() + field.slice(1)}
                            </label>
                            <input type={field === 'email' ? 'email' : 'text'} value={(advisor[field] as string) || ''}
                              onChange={(e) => updateAcct(i, field, e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                          </div>
                        ))}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3">What do they help you with?</label>
                          <div className="space-y-2">
                            {acctServiceOptions.map(opt => (
                              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="checkbox" checked={selectedServices.includes(opt.value)}
                                  onChange={(e) => {
                                    const next = e.target.checked ? [...selectedServices, opt.value] : selectedServices.filter(v => v !== opt.value);
                                    updateAcct(i, 'services', next);
                                  }}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded" />
                                <span className="ml-3 text-gray-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-2">How long have you worked together?</label>
                          <input type="text" value={(advisor.duration as string) || ''}
                            onChange={(e) => updateAcct(i, 'duration', e.target.value)}
                            placeholder="e.g., 5 years"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Where are your tax documents stored?</label>
                          <input type="text" value={(advisor.docLocation as string) || ''}
                            onChange={(e) => updateAcct(i, 'docLocation', e.target.value)}
                            placeholder="Enter document location"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3">May we include this professional in your executor's contact list and action guide?</label>
                          <div className="space-y-2">
                            {[{value:'yes',label:'Yes'},{value:'no',label:'No'}].map(opt => (
                              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="radio" name={`acctAdditional_${i}_include`} value={opt.value}
                                  checked={advisor.includeInContactList === opt.value}
                                  onChange={() => updateAcct(i, 'includeInContactList', opt.value)}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-3 text-gray-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {i < ordinals.length - 1 && (
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-3">Is there an additional Accountant (CPA) that you work with?</label>
                            <div className="space-y-2">
                              {[{value:'yes',label:'Yes'},{value:'no',label:'No'}].map(opt => (
                                <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                  <input type="radio" name={`acctAdditional_${i}_hasMore`} value={opt.value}
                                    checked={advisor.hasAdditional === opt.value}
                                    onChange={() => {
                                      updateAcct(i, 'hasAdditional', opt.value);
                                      if (opt.value === 'no') {
                                        const trimmed = additionalData.slice(0, i + 1);
                                        onAnswerChange('acctAdditionalData', trimmed);
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-3 text-gray-300">{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                    showNext = advisor.hasAdditional === 'yes' && i < ordinals.length - 1;
                  }
                  return <>{sections}</>;
                })()}

                <h4 className="text-base font-semibold text-blue-400 mt-6 mb-1">Lawyer</h4>
                {lawQuestions.map(renderQuestion)}
                {(() => {
                  if (answers['lawHasAdditional'] !== 'yes') return null;
                  const ordinals = ['Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
                  const additionalData = (answers['lawAdditionalData'] as Array<Record<string, unknown>>) || [];
                  const lawServiceOptions = [
                    { value: 'wills_powers_of_attorney', label: 'Wills & Powers of Attorney' },
                    { value: 'real_estate', label: 'Real estate' },
                    { value: 'corporate_law', label: 'Corporate law' },
                    { value: 'family_law', label: 'Family law' },
                    { value: 'litigation', label: 'Litigation' },
                    { value: 'other', label: 'Other' },
                  ];
                  const allStepAnswers = Object.fromEntries(
                    Array.from(allAnswers?.entries() || []).flatMap(([_, s]) => Object.entries(s))
                  );
                  const hasSpouseLaw = (allStepAnswers['maritalStatus'] === 'married' || allStepAnswers['maritalStatus'] === 'common_law');
                  const client1NameLaw = (allStepAnswers['fullName'] as string) || 'Client 1';
                  const client2NameLaw = (allStepAnswers['spouseName'] as string) || 'Client 2';
                  const worksWithOptionsLaw = hasSpouseLaw
                    ? [{ value: 'client1', label: client1NameLaw }, { value: 'client2', label: client2NameLaw }]
                    : [{ value: 'client1', label: client1NameLaw }];

                  const updateLaw = (idx: number, field: string, val: unknown) => {
                    const updated = [...additionalData];
                    while (updated.length <= idx) updated.push({});
                    updated[idx] = { ...updated[idx], [field]: val };
                    onAnswerChange('lawAdditionalData', updated);
                  };

                  const sections: React.ReactElement[] = [];
                  let showNext = true;
                  for (let i = 0; i < ordinals.length && showNext; i++) {
                    const advisor = additionalData[i] || {};
                    const selectedServices = (advisor.services as string[]) || [];
                    const selectedWorksWith = (advisor.worksWith as string[]) || [];

                    sections.push(
                      <React.Fragment key={i}>
                        <div className="flex items-center justify-between mt-6 mb-1">
                          <h5 className="text-sm font-semibold text-blue-300">{ordinals[i]} Lawyer Information</h5>
                          <button
                            type="button"
                            onClick={() => {
                              if (i === 0) {
                                onAnswerChange('lawHasAdditional', 'no');
                                onAnswerChange('lawAdditionalData', undefined);
                              } else {
                                const trimmed = additionalData.slice(0, i);
                                if (trimmed.length > 0) {
                                  trimmed[trimmed.length - 1] = { ...trimmed[trimmed.length - 1], hasAdditional: 'no' };
                                }
                                onAnswerChange('lawAdditionalData', trimmed.length > 0 ? trimmed : undefined);
                              }
                            }}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
                            aria-label={`Remove ${ordinals[i].toLowerCase()} lawyer`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3">Who does this lawyer work with?</label>
                          <div className="space-y-2">
                            {worksWithOptionsLaw.map(opt => (
                              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="checkbox" checked={selectedWorksWith.includes(opt.value)}
                                  onChange={(e) => {
                                    const next = e.target.checked ? [...selectedWorksWith, opt.value] : selectedWorksWith.filter(v => v !== opt.value);
                                    updateLaw(i, 'worksWith', next);
                                  }}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded" />
                                <span className="ml-3 text-gray-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {(['firm','name','phone','email'] as const).map(field => (
                          <div key={field} className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                              {field === 'name' ? 'Lawyer name' : field === 'firm' ? 'Firm' : field.charAt(0).toUpperCase() + field.slice(1)}
                            </label>
                            <input type={field === 'email' ? 'email' : 'text'} value={(advisor[field] as string) || ''}
                              onChange={(e) => updateLaw(i, field, e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                          </div>
                        ))}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3">What do they help you with?</label>
                          <div className="space-y-2">
                            {lawServiceOptions.map(opt => (
                              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="checkbox" checked={selectedServices.includes(opt.value)}
                                  onChange={(e) => {
                                    const next = e.target.checked ? [...selectedServices, opt.value] : selectedServices.filter(v => v !== opt.value);
                                    updateLaw(i, 'services', next);
                                  }}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded" />
                                <span className="ml-3 text-gray-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-2">How long have you worked together?</label>
                          <input type="text" value={(advisor.duration as string) || ''}
                            onChange={(e) => updateLaw(i, 'duration', e.target.value)}
                            placeholder="e.g., 5 years"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Where are your legal documents stored?</label>
                          <input type="text" value={(advisor.docLocation as string) || ''}
                            onChange={(e) => updateLaw(i, 'docLocation', e.target.value)}
                            placeholder="Enter document location"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3">May we include this professional in your executor's contact list and action guide?</label>
                          <div className="space-y-2">
                            {[{value:'yes',label:'Yes'},{value:'no',label:'No'}].map(opt => (
                              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="radio" name={`lawAdditional_${i}_include`} value={opt.value}
                                  checked={advisor.includeInContactList === opt.value}
                                  onChange={() => updateLaw(i, 'includeInContactList', opt.value)}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                <span className="ml-3 text-gray-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {i < ordinals.length - 1 && (
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-3">Is there an additional Lawyer that you work with?</label>
                            <div className="space-y-2">
                              {[{value:'yes',label:'Yes'},{value:'no',label:'No'}].map(opt => (
                                <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                  <input type="radio" name={`lawAdditional_${i}_hasMore`} value={opt.value}
                                    checked={advisor.hasAdditional === opt.value}
                                    onChange={() => {
                                      updateLaw(i, 'hasAdditional', opt.value);
                                      if (opt.value === 'no') {
                                        const trimmed = additionalData.slice(0, i + 1);
                                        onAnswerChange('lawAdditionalData', trimmed);
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-3 text-gray-300">{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                    showNext = advisor.hasAdditional === 'yes' && i < ordinals.length - 1;
                  }
                  return <>{sections}</>;
                })()}

                <h4 className="text-base font-semibold text-blue-400 mt-6 mb-1">Insurance Advisor</h4>
                {(() => {
                  const splitIdx = insQuestions.findIndex(q => q.key === 'insAdvisor1Firm');
                  const beforeFirm = splitIdx === -1 ? insQuestions : insQuestions.slice(0, splitIdx);
                  const fromFirm = splitIdx === -1 ? [] : insQuestions.slice(splitIdx);
                  const isCameronIns = !!(answers['insAdvisor1IsCameronSmith']);
                  const showInsFields = answers['insHasAdvisor'] && answers['insHasAdvisor'] !== 'na';
                  return (
                    <>
                      {beforeFirm.map(renderQuestion)}
                      {showInsFields && (
                        <>
                          <div className="mb-6">
                            <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isCameronIns}
                                onChange={(e) => {
                                  onAnswerChange('insAdvisor1IsCameronSmith', e.target.checked);
                                  if (e.target.checked) {
                                    onAnswerChange('insAdvisor1Firm', 'Clarify Wealth Ltd.');
                                    onAnswerChange('insAdvisor1Name', 'Cameron Smith');
                                    onAnswerChange('insAdvisor1Phone', '647-448-5963');
                                    onAnswerChange('insAdvisor1Email', 'cameron.smith@ipcsecurities.com');
                                  } else {
                                    onAnswerChange('insAdvisor1Firm', '');
                                    onAnswerChange('insAdvisor1Name', '');
                                    onAnswerChange('insAdvisor1Phone', '');
                                    onAnswerChange('insAdvisor1Email', '');
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                              />
                              <span className="ml-3 text-gray-300">Cameron Smith CFP®</span>
                            </label>
                          </div>
                          <h5 className="text-sm font-semibold text-blue-300 mt-4 mb-1">Insurance Advisor Information</h5>
                          {!isCameronIns && fromFirm.map(renderQuestion)}
                          {isCameronIns && fromFirm.filter(q => !['insAdvisor1Firm','insAdvisor1Name','insAdvisor1Phone','insAdvisor1Email'].includes(q.key)).map(renderQuestion)}
                        </>
                      )}
                      {!showInsFields && fromFirm.map(renderQuestion)}
                      {answers['insHasAdditional'] === 'yes' && insAdvisor2Questions.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mt-6 mb-1">
                            <h5 className="text-sm font-semibold text-blue-300">Second Insurance Advisor Information</h5>
                            <button
                              type="button"
                              onClick={() => {
                                ['insAdvisor2Firm', 'insAdvisor2Name', 'insAdvisor2Phone', 'insAdvisor2Email', 'insAdvisor2Services', 'insAdvisor2Duration', 'insAdvisor2DocLocation', 'insAdvisor2IncludeInContactList', 'insAdvisor2WorksWith'].forEach(key => {
                                  onAnswerChange(key, undefined);
                                });
                                onAnswerChange('insHasAdditional', 'no');
                              }}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
                              aria-label="Remove second insurance advisor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                          {insAdvisor2Questions.map(renderQuestion)}
                        </>
                      )}
                    </>
                  );
                })()}

                {(() => {
                  const basicAns = allAnswers?.get('aboutYou') || {};
                  const step3Ans = allAnswers?.get('children') || {};
                  const hasSpouseFp = (basicAns['maritalStatus'] === 'married' || basicAns['maritalStatus'] === 'common_law');
                  const c1NameFp = (basicAns['fullName'] as string) || 'Client 1';
                  const c2NameFp = (basicAns['spouseName'] as string) || 'Client 2';
                  const provinceFp = ((basicAns['province'] as string) || '').toLowerCase();
                  const higherMajorityFp = ['bc', 'british columbia', 'nova scotia', 'new brunswick', 'newfoundland', 'nl', 'ns', 'nb'];
                  const ageOfMajorityFp = higherMajorityFp.some(p => provinceFp.includes(p)) ? 19 : 18;
                  const todayFp = new Date();
                  const childrenDataFp = (step3Ans['childrenData'] as Array<Record<string, string>>) || [];
                  const eligibleChildPatients = childrenDataFp.filter(c => {
                    if (!c?.name) return false;
                    const isDisabled = c.disabled === 'yes';
                    const isFinanciallyDependent = c.independent === 'no';
                    let isUnderMajority = false;
                    if (c?.dateOfBirth) {
                      const ageMs = todayFp.getTime() - new Date(c.dateOfBirth).getTime();
                      isUnderMajority = (ageMs / (365.25 * 24 * 60 * 60 * 1000)) < ageOfMajorityFp;
                    }
                    return isDisabled || isFinanciallyDependent || isUnderMajority;
                  });
                  const patientOptions: { value: string; label: string }[] = [
                    { value: 'client1', label: c1NameFp },
                    ...(hasSpouseFp ? [{ value: 'client2', label: c2NameFp }] : []),
                    ...eligibleChildPatients.map(c => ({ value: `child:${c.name}`, label: c.name })),
                  ];

                  const renderPatientsBlock = (prefix: string, idx: number) => {
                    const patientsKey = `${prefix}_health_${idx}_patients`;
                    const selectedPatients = (answers[patientsKey] as string[]) || [];
                    const togglePatient = (val: string) => {
                      const next = selectedPatients.includes(val)
                        ? selectedPatients.filter(v => v !== val)
                        : [...selectedPatients, val];
                      onAnswerChange(patientsKey, next);
                    };
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Patients:</label>
                        <div className="space-y-2">
                          {patientOptions.map(opt => (
                            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={selectedPatients.includes(opt.value)}
                                onChange={() => togglePatient(opt.value)}
                                className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500" />
                              <span className="text-gray-300 text-sm">({opt.label})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  };

                  const renderHealthCards = (params: {
                    sectionTitle: string;
                    prefix: 'fp' | 'sp' | 'ph';
                    nameKeys: string[];
                    restKeySets: string[][];
                    questions: typeof step.questions;
                    additionalLabel: string;
                  }) => {
                    const { sectionTitle, prefix, nameKeys, restKeySets, questions, additionalLabel } = params;
                    const cards = nameKeys.map((_, i) => i);
                    return (
                      <>
                        <h4 className="text-base font-semibold text-blue-400 mt-6 mb-1">{sectionTitle}</h4>
                        {cards.map((cardIdx) => {
                          const nameQ = questions.find(q => q.key === nameKeys[cardIdx]);
                          if (!nameQ) return null;
                          if (nameQ.condition && !nameQ.condition(answers)) return null;
                          const restQuestions = restKeySets[cardIdx]
                            .map(k => questions.find(q => q.key === k))
                            .filter(Boolean) as typeof questions;

                          const removeCard = () => {
                            const keysToRemove = [
                              `${prefix}_health_${cardIdx}_name`, `${prefix}_health_${cardIdx}_patients`,
                              ...restKeySets[cardIdx],
                            ];
                            keysToRemove.forEach(key => onAnswerChange(key, undefined));
                            if (cardIdx > 0) {
                              onAnswerChange(`${prefix}_health_${cardIdx - 1}_has_additional`, 'no');
                            } else if (prefix === 'sp') {
                              onAnswerChange('sp_health_has', 'no');
                            }
                          };

                          return (
                            <div key={cardIdx} className="mt-4 pt-3 border-t border-gray-700 first:border-0 first:pt-0 first:mt-0 space-y-4">
                              {cardIdx > 0 && (
                                <div className="flex items-center justify-between -mb-1">
                                  <h5 className="text-sm font-semibold text-blue-300">
                                    {additionalLabel} #{cardIdx}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={removeCard}
                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors"
                                    aria-label={`Remove additional ${sectionTitle.toLowerCase()}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              )}
                              {renderQuestion(nameQ)}
                              {renderPatientsBlock(prefix, cardIdx)}
                              {restQuestions.map(renderQuestion)}
                            </div>
                          );
                        })}
                      </>
                    );
                  };

                  const spGateQ = spHealthQuestions.find(q => q.key === 'sp_health_has');

                  return (
                    <>
                      {renderHealthCards({
                        sectionTitle: 'Family Physician',
                        prefix: 'fp',
                        nameKeys: ['fp_health_0_name', 'fp_health_1_name', 'fp_health_2_name'],
                        restKeySets: [
                          ['fp_health_0_clinic', 'fp_health_0_city', 'fp_health_0_phone', 'fp_health_0_has_additional'],
                          ['fp_health_1_clinic', 'fp_health_1_city', 'fp_health_1_phone', 'fp_health_1_has_additional'],
                          ['fp_health_2_clinic', 'fp_health_2_city', 'fp_health_2_phone'],
                        ],
                        questions: fpHealthQuestions,
                        additionalLabel: 'Additional Family Physician',
                      })}

                      {spGateQ && renderQuestion(spGateQ)}

                      {answers['sp_health_has'] === 'yes' && renderHealthCards({
                        sectionTitle: 'Specialists',
                        prefix: 'sp',
                        nameKeys: ['sp_health_0_name', 'sp_health_1_name', 'sp_health_2_name', 'sp_health_3_name', 'sp_health_4_name'],
                        restKeySets: [
                          ['sp_health_0_specialty', 'sp_health_0_phone', 'sp_health_0_has_additional'],
                          ['sp_health_1_specialty', 'sp_health_1_phone', 'sp_health_1_has_additional'],
                          ['sp_health_2_specialty', 'sp_health_2_phone', 'sp_health_2_has_additional'],
                          ['sp_health_3_specialty', 'sp_health_3_phone', 'sp_health_3_has_additional'],
                          ['sp_health_4_specialty', 'sp_health_4_phone'],
                        ],
                        questions: spHealthQuestions,
                        additionalLabel: 'Additional Specialist',
                      })}

                      {renderHealthCards({
                        sectionTitle: 'Pharmacist',
                        prefix: 'ph',
                        nameKeys: ['ph_health_0_name', 'ph_health_1_name', 'ph_health_2_name', 'ph_health_3_name', 'ph_health_4_name'],
                        restKeySets: [
                          ['ph_health_0_pharmacy', 'ph_health_0_phone', 'ph_health_0_has_additional'],
                          ['ph_health_1_pharmacy', 'ph_health_1_phone', 'ph_health_1_has_additional'],
                          ['ph_health_2_pharmacy', 'ph_health_2_phone', 'ph_health_2_has_additional'],
                          ['ph_health_3_pharmacy', 'ph_health_3_phone', 'ph_health_3_has_additional'],
                          ['ph_health_4_pharmacy', 'ph_health_4_phone'],
                        ],
                        questions: phHealthQuestions,
                        additionalLabel: 'Additional Pharmacist',
                      })}
                    </>
                  );
                })()}

              </>
            );
          })()}

          {step.sectionId === 'financialFootprint' && (() => {
            const basicAnswers = allAnswers?.get('aboutYou') || {};
            const hasSpouse = (basicAnswers['maritalStatus'] === 'married' || basicAnswers['maritalStatus'] === 'common_law');
            const client1Name = basicAnswers['fullName'] as string || 'Client 1';
            const client2Name = basicAnswers['spouseName'] as string || 'Client 2';
            const bankingStructure = answers['bankingStructure'];

            const step2Answers = allAnswers?.get('previousRelationships') || {};
            const step3Answers = allAnswers?.get('children') || {};
            const knownIndividuals: { name: string; relationship: string }[] = [];
            const c1PrevRels = (step2Answers['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
            c1PrevRels.forEach(r => { if (r?.name) knownIndividuals.push({ name: r.name, relationship: 'Previous Partner' }); });
            const c2PrevRels = (step2Answers['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
            c2PrevRels.forEach(r => { if (r?.name) knownIndividuals.push({ name: r.name, relationship: 'Previous Partner' }); });
            const childrenData = (step3Answers['childrenData'] as Array<Record<string, string>>) || [];
            childrenData.forEach(c => { if (c?.name) knownIndividuals.push({ name: c.name, relationship: 'Child' }); });

            const renderInstitutions = (key: string, count: string, label: string) => {
              const institutionCount = parseInt(answers[count] as string) || 0;
              if (institutionCount === 0) return null;

              const institutionsData = (answers[key] as Array<Record<string, unknown>>) || Array(Math.max(0, institutionCount || 0)).fill(null).map(() => ({}));

              const handleInstitutionFieldChange = (index: number, field: string, value: unknown) => {
                const updated = [...institutionsData];
                if (!updated[index]) {
                  updated[index] = {};
                }
                updated[index][field] = value;
                onAnswerChange(key, updated);
              };

              const handleAccountOwnerToggle = (index: number, owner: string) => {
                const updated = [...institutionsData];
                if (!updated[index]) {
                  updated[index] = {};
                }
                const currentOwners = (updated[index].accountOwners as string[]) || [];
                if (currentOwners.includes(owner)) {
                  updated[index].accountOwners = currentOwners.filter(o => o !== owner);
                } else {
                  updated[index].accountOwners = [...currentOwners, owner];
                }
                onAnswerChange(key, updated);
              };

              const handleAdditionalOwnerChange = (institutionIndex: number, ownerIndex: number, value: string) => {
                const updated = [...institutionsData];
                if (!updated[institutionIndex]) {
                  updated[institutionIndex] = {};
                }
                const additionalOwners = (updated[institutionIndex].additionalOwners as string[]) || [];
                additionalOwners[ownerIndex] = value;
                updated[institutionIndex].additionalOwners = additionalOwners;
                onAnswerChange(key, updated);
              };

              const addAdditionalOwner = (institutionIndex: number) => {
                const updated = [...institutionsData];
                if (!updated[institutionIndex]) {
                  updated[institutionIndex] = {};
                }
                const additionalOwners = (updated[institutionIndex].additionalOwners as string[]) || [];
                updated[institutionIndex].additionalOwners = [...additionalOwners, ''];
                onAnswerChange(key, updated);
              };

              const removeLastAdditionalOwner = (institutionIndex: number) => {
                const updated = [...institutionsData];
                if (!updated[institutionIndex]) {
                  return;
                }
                const additionalOwners = (updated[institutionIndex].additionalOwners as string[]) || [];
                if (additionalOwners.length > 0) {
                  updated[institutionIndex].additionalOwners = additionalOwners.slice(0, -1);
                  onAnswerChange(key, updated);
                }
              };

              const handleOtherKnownOwnerToggle = (institutionIndex: number, personName: string) => {
                const updated = [...institutionsData];
                if (!updated[institutionIndex]) updated[institutionIndex] = {};
                const current = (updated[institutionIndex].otherKnownOwners as string[]) || [];
                updated[institutionIndex].otherKnownOwners = current.includes(personName)
                  ? current.filter(n => n !== personName)
                  : [...current, personName];
                onAnswerChange(key, updated);
              };

              const handleCustomOtherToggle = (institutionIndex: number) => {
                const updated = [...institutionsData];
                if (!updated[institutionIndex]) updated[institutionIndex] = {};
                updated[institutionIndex].hasCustomOtherOwner = !updated[institutionIndex].hasCustomOtherOwner;
                if (!updated[institutionIndex].hasCustomOtherOwner) {
                  updated[institutionIndex].customOtherOwnerName = '';
                  updated[institutionIndex].customOtherOwnerRelationship = '';
                }
                onAnswerChange(key, updated);
              };

              const handleOwnershipPercentageChange = (institutionIndex: number, ownerKey: string, value: string) => {
                const updated = [...institutionsData];
                if (!updated[institutionIndex]) updated[institutionIndex] = {};
                const percentages = ({ ...(updated[institutionIndex].ownershipPercentages as Record<string, string> || {}) });
                percentages[ownerKey] = value;
                updated[institutionIndex].ownershipPercentages = percentages;
                onAnswerChange(key, updated);
              };

              return (
                <div className="space-y-6 mt-6">
                  <h3 className="text-md font-semibold text-white">{label}</h3>
                  {Array.from({ length: institutionCount }).map((_, index) => {
                    const institution = institutionsData[index] || {};
                    const accountOwners = (institution.accountOwners as string[]) || [];
                    const hasOtherOwner = accountOwners.includes('other');
                    const additionalOwners = (institution.additionalOwners as string[]) || [];
                    const otherKnownOwners = (institution.otherKnownOwners as string[]) || [];
                    const hasCustomOtherOwner = !!(institution.hasCustomOtherOwner);
                    const customOtherOwnerName = (institution.customOtherOwnerName as string) || '';
                    const customOtherOwnerRelationship = (institution.customOtherOwnerRelationship as string) || '';
                    const accountOwnershipType = (institution.accountOwnershipType as string) || '';
                    const ownershipPercentages = (institution.ownershipPercentages as Record<string, string>) || {};

                    const allOwnerLabels: { key: string; label: string }[] = [];
                    if (accountOwners.includes('client1')) allOwnerLabels.push({ key: 'client1', label: client1Name });
                    if (hasSpouse && accountOwners.includes('client2')) allOwnerLabels.push({ key: 'client2', label: client2Name });
                    otherKnownOwners.forEach(name => allOwnerLabels.push({ key: name, label: name }));
                    if (hasCustomOtherOwner && customOtherOwnerName) allOwnerLabels.push({ key: '__custom__', label: customOtherOwnerName });

                    const totalPct = allOwnerLabels.reduce((sum, o) => sum + (parseFloat(ownershipPercentages[o.key] || '0') || 0), 0);
                    const pctValid = Math.abs(totalPct - 100) < 0.01;

                    return (
                      <div key={index} className="p-4 bg-gray-700 rounded-lg space-y-4">
                        <h4 className="text-sm font-semibold text-gray-200">Institution {index + 1}</h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Institution Name:
                          </label>
                          <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., TD Bank, RBC, Scotiabank</p>
                          <input
                            type="text"
                            value={(institution.name as string) || ''}
                            onChange={(e) => handleInstitutionFieldChange(index, 'name', e.target.value)}
                            placeholder=""
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Account Type:
                          </label>
                          <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Checking, Savings, TFSA</p>
                          <input
                            type="text"
                            value={(institution.accountType as string) || ''}
                            onChange={(e) => handleInstitutionFieldChange(index, 'accountType', e.target.value)}
                            placeholder=""
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Account Owner:
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={accountOwners.includes('client1')}
                                onChange={() => handleAccountOwnerToggle(index, 'client1')}
                                className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-white">{client1Name}</span>
                            </label>
                            {hasSpouse && (
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={accountOwners.includes('client2')}
                                  onChange={() => handleAccountOwnerToggle(index, 'client2')}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <span className="text-white">{client2Name}</span>
                              </label>
                            )}
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasOtherOwner}
                                onChange={() => handleAccountOwnerToggle(index, 'other')}
                                className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-white">Other</span>
                            </label>
                          </div>
                        </div>

                        {hasOtherOwner && (
                          <div className="pl-4 border-l-2 border-blue-500/40 space-y-3">
                            <label className="block text-sm font-medium text-gray-300">
                              Select from known individuals:
                            </label>
                            {knownIndividuals.length === 0 && (
                              <p className="text-xs text-gray-400 italic">No individuals from previous steps found.</p>
                            )}
                            {knownIndividuals.map((person) => (
                              <label key={person.name} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={otherKnownOwners.includes(person.name)}
                                  onChange={() => handleOtherKnownOwnerToggle(index, person.name)}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <span className="text-white">{person.name}</span>
                                <span className="text-xs text-gray-400">({person.relationship})</span>
                              </label>
                            ))}
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasCustomOtherOwner}
                                onChange={() => handleCustomOtherToggle(index)}
                                className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-white">Other</span>
                            </label>
                            {hasCustomOtherOwner && (
                              <div className="pl-4 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Enter Owner Name:
                                  </label>
                                  <input
                                    type="text"
                                    value={customOtherOwnerName}
                                    onChange={(e) => handleInstitutionFieldChange(index, 'customOtherOwnerName', e.target.value)}
                                    placeholder="Full name"
                                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Relationship to You:
                                  </label>
                                  <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Sibling, Parent, Friend</p>
                                  <input
                                    type="text"
                                    value={customOtherOwnerRelationship}
                                    onChange={(e) => handleInstitutionFieldChange(index, 'customOtherOwnerRelationship', e.target.value)}
                                    placeholder=""
                                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {hasOtherOwner && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              Is the account:
                            </label>
                            <div className="space-y-2">
                              {[
                                { value: 'joint_survivorship', label: 'Joint with Right-of-Survivorship' },
                                { value: 'joint_tenancy', label: 'Joint Tenancy-in-Common' },
                                { value: 'not_sure', label: "I'm not sure" },
                              ].map(opt => (
                                <label key={opt.value} className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`ownershipType-${key}-${index}`}
                                    value={opt.value}
                                    checked={accountOwnershipType === opt.value}
                                    onChange={() => handleInstitutionFieldChange(index, 'accountOwnershipType', opt.value)}
                                    className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500 focus:ring-2"
                                  />
                                  <span className="text-white">{opt.label}</span>
                                </label>
                              ))}
                            </div>

                            {accountOwnershipType === 'joint_tenancy' && allOwnerLabels.length > 0 && (
                              <div className="mt-4 pl-4 border-l-2 border-blue-500/40 space-y-3">
                                <label className="block text-sm font-medium text-gray-300">
                                  Enter ownership percentage for each owner (must total 100%):
                                </label>
                                {allOwnerLabels.map(owner => (
                                  <div key={owner.key} className="flex items-center gap-3">
                                    <span className="text-white text-sm w-40 shrink-0">{owner.label}</span>
                                    <div className="relative flex-1 max-w-[140px]">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={ownershipPercentages[owner.key] || ''}
                                        onChange={(e) => handleOwnershipPercentageChange(index, owner.key, e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-2 pr-8 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                    </div>
                                  </div>
                                ))}
                                <div className={`flex items-center gap-2 text-sm font-medium ${pctValid ? 'text-green-400' : totalPct > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                  <span>Total: {totalPct.toFixed(totalPct % 1 === 0 ? 0 : 2)}%</span>
                                  {totalPct > 0 && !pctValid && <span>— must equal 100%</span>}
                                  {pctValid && <span>✓</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            };

            return (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
                  <h3 className="text-sm font-semibold tracking-widest text-blue-400 uppercase whitespace-nowrap">Personal Banking Information</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-blue-500/50 to-transparent" />
                </div>
                {step.questions.map((question) => {
                  if (question.key === 'bankingStructure' && !hasSpouse) {
                    return null;
                  }

                  if (question.key === 'jointBankCount' && bankingStructure !== 'joint') {
                    return null;
                  }

                  if (question.key === 'jointInstitutionsData') {
                    return null;
                  }

                  if (question.key === 'client1BankCount') {
                    if (hasSpouse && bankingStructure !== 'individual') {
                      return null;
                    }
                    const customLabel = !hasSpouse ? question.label : `${client1Name}, how many banks, trust companies or credit unions do you have accounts with?`;
                    return (
                      <React.Fragment key={question.key}>
                        <FormField
                          question={{ ...question, label: customLabel }}
                          value={answers[question.key]}
                          onChange={(value) => onAnswerChange(question.key, value)}
                        />
                        {renderInstitutions('client1InstitutionsData', 'client1BankCount', !hasSpouse ? 'Your Banking Institutions' : `${client1Name}'s Banking Institutions`)}
                      </React.Fragment>
                    );
                  }

                  if (question.key === 'client1InstitutionsData') {
                    return null;
                  }

                  if (question.key === 'client2BankCount') {
                    if (!hasSpouse || bankingStructure !== 'individual') {
                      return null;
                    }
                    return (
                      <React.Fragment key={question.key}>
                        <FormField
                          question={{ ...question, label: `${client2Name}, how many banks, trust companies or credit unions do you have accounts with?` }}
                          value={answers[question.key]}
                          onChange={(value) => onAnswerChange(question.key, value)}
                        />
                        {renderInstitutions('client2InstitutionsData', 'client2BankCount', `${client2Name}'s Banking Institutions`)}
                      </React.Fragment>
                    );
                  }

                  if (question.key === 'client2InstitutionsData') {
                    return null;
                  }

                  if (question.key === 'jointBankCount') {
                    if (bankingStructure !== 'joint') {
                      return null;
                    }
                    return (
                      <React.Fragment key={question.key}>
                        <FormField
                          question={question}
                          value={answers[question.key]}
                          onChange={(value) => onAnswerChange(question.key, value)}
                        />
                        {renderInstitutions('jointInstitutionsData', 'jointBankCount', 'Joint Banking Institutions')}
                      </React.Fragment>
                    );
                  }

                  if (question.key === 'mixedJointBankCount') {
                    if (bankingStructure !== 'mixed') {
                      return null;
                    }
                    return (
                      <React.Fragment key={question.key}>
                        <FormField
                          question={question}
                          value={answers[question.key]}
                          onChange={(value) => onAnswerChange(question.key, value)}
                        />
                        {renderInstitutions('mixedJointInstitutionsData', 'mixedJointBankCount', 'Joint Banking Institutions')}
                      </React.Fragment>
                    );
                  }

                  if (question.key === 'mixedJointInstitutionsData') {
                    return null;
                  }

                  if (question.key === 'mixedClient1BankCount') {
                    if (bankingStructure !== 'mixed') {
                      return null;
                    }
                    return (
                      <React.Fragment key={question.key}>
                        <FormField
                          question={{ ...question, label: `${client1Name}, how many individually held accounts do you have?` }}
                          value={answers[question.key]}
                          onChange={(value) => onAnswerChange(question.key, value)}
                        />
                        {renderInstitutions('mixedClient1InstitutionsData', 'mixedClient1BankCount', `${client1Name}'s Individual Banking Institutions`)}
                      </React.Fragment>
                    );
                  }

                  if (question.key === 'mixedClient1InstitutionsData') {
                    return null;
                  }

                  if (question.key === 'mixedClient2BankCount') {
                    if (bankingStructure !== 'mixed') {
                      return null;
                    }
                    return (
                      <React.Fragment key={question.key}>
                        <FormField
                          question={{ ...question, label: `${client2Name}, how many individually held accounts do you have?` }}
                          value={answers[question.key]}
                          onChange={(value) => onAnswerChange(question.key, value)}
                        />
                        {renderInstitutions('mixedClient2InstitutionsData', 'mixedClient2BankCount', `${client2Name}'s Individual Banking Institutions`)}
                      </React.Fragment>
                    );
                  }

                  if (question.key === 'mixedClient2InstitutionsData') {
                    return null;
                  }

                  // Financial Assets & Retirement Benefits — rendered as a single composite component
                  if (question.key === 'hasInvestments') {
                    return (
                      <React.Fragment key="financial-assets-section">
                        <FinancialFootprintAssets
                          answers={answers}
                          allAnswers={allAnswers}
                          onAnswerChange={onAnswerChange}
                        />
                      </React.Fragment>
                    );
                  }
                  if (question.key === 'investmentAccountsData' ||
                      question.key === 'hasPensions' ||
                      question.key === 'pensionRecordsData' ||
                      question.key === 'hasEquity' ||
                      question.key === 'equityCompensationData' ||
                      question.key === 'hasReceivables' ||
                      question.key === 'receivablesData' ||
                      question.key === 'hasOtherAssets' ||
                      question.key === 'otherAssetsData') {
                    return null;
                  }

                  if (question.key === 'primaryResidenceOwner') {
                    const ownerOptions = [
                      { value: 'joint_survivorship', label: 'Jointly with right of survivorship' },
                      { value: 'joint_tenants', label: 'Jointly as tenants in common' },
                      { value: 'client1', label: client1Name },
                    ];
                    if (hasSpouse) {
                      ownerOptions.push({ value: 'client2', label: client2Name });
                    }
                    return (
                      <FormField
                        key={question.key}
                        question={{ ...question, options: ownerOptions }}
                        value={answers[question.key]}
                        onChange={(value) => onAnswerChange(question.key, value)}
                      />
                    );
                  }

                  if (question.key === 'additionalPropertiesCount') {
                    const propertyCount = parseInt(answers['additionalPropertiesCount'] as string) || 0;
                    const propertiesData = (answers['propertiesData'] as Array<Record<string, string>>) || Array(Math.max(0, propertyCount || 0)).fill(null).map(() => ({}));

                    const handlePropertyChange = (index: number, field: string, value: string) => {
                      const updated = [...propertiesData];
                      if (!updated[index]) {
                        updated[index] = {};
                      }
                      updated[index][field] = value;
                      onAnswerChange('propertiesData', updated);
                    };

                    const trustAnswers = allAnswers?.get('familyTrusts') || {};
                    const corporationAnswers = allAnswers?.get('businessInterests') || {};

                    const ownerOptions = [
                      { value: 'joint_survivorship', label: 'Jointly with right of survivorship' },
                      { value: 'joint_tenants', label: 'Jointly as tenants in common' },
                      { value: 'client1', label: client1Name },
                    ];
                    if (hasSpouse) {
                      ownerOptions.push({ value: 'client2', label: client2Name });
                    }

                    if (trustAnswers['hasFamilyTrust'] === 'yes') {
                      const trustName = trustAnswers['trustLegalName'] as string || 'Trust 1';
                      ownerOptions.push({ value: 'trust', label: trustName });
                    }

                    if (corporationAnswers['ownsCorporation'] === 'yes') {
                      const corporationsData = corporationAnswers['corporationsData'] as Array<Record<string, string>> | undefined;
                      if (corporationsData && corporationsData.length > 0) {
                        corporationsData.forEach((corp, idx) => {
                          const corpName = corp?.legalName || `Corporation ${idx + 1}`;
                          ownerOptions.push({ value: `corporation_${idx}`, label: corpName });
                        });
                      }
                    }

                    ownerOptions.push({ value: 'other', label: 'Other' });

                    return (
                      <React.Fragment key={question.key}>
                        <FormField
                          question={question}
                          value={answers[question.key]}
                          onChange={(value) => onAnswerChange(question.key, value)}
                        />
                        {propertyCount > 0 && (
                          <div className="space-y-8 mt-6">
                            {Array.from({ length: propertyCount }).map((_, index) => (
                              <div key={index} className="border border-gray-600 rounded-lg p-6 bg-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                  {propertiesData[index]?.propertyName
                                    ? propertiesData[index].propertyName
                                    : `Additional Property ${index + 1}`}
                                </h3>
                                <div className="space-y-6">
                                  <div>
                                    <div className="pb-1 border-b border-gray-500 mb-3">
                                      <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Property Details</h4>
                                    </div>
                                    <div className="space-y-4">
                                    <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      What is the name of this property?
                                    </label>
                                    <input
                                      type="text"
                                      value={propertiesData[index]?.propertyName || ''}
                                      onChange={(e) => handlePropertyChange(index, 'propertyName', e.target.value)}
                                      placeholder="Enter property name"
                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      What type of property do you own?
                                    </label>
                                    <select
                                      value={propertiesData[index]?.propertyType || ''}
                                      onChange={(e) => handlePropertyChange(index, 'propertyType', e.target.value)}
                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="">Select property type</option>
                                      <option value="Residential">Residential</option>
                                      <option value="Commercial">Commercial</option>
                                      <option value="Cottage/Vacation">Cottage/Vacation</option>
                                      <option value="Rental">Rental</option>
                                      <option value="Land">Land</option>
                                      <option value="Farm">Farm</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  {(propertiesData[index]?.propertyType === 'Rental' || propertiesData[index]?.propertyType === 'Commercial') && (
                                    <>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Location of Rental Agreements
                                        </label>
                                        <input
                                          type="text"
                                          value={propertiesData[index]?.rentalAgreementsLocation || ''}
                                          onChange={(e) => handlePropertyChange(index, 'rentalAgreementsLocation', e.target.value)}
                                          placeholder="Enter location"
                                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Where do you keep records of your revenues and expenses?
                                        </label>
                                        <input
                                          type="text"
                                          value={propertiesData[index]?.revenueExpensesLocation || ''}
                                          onChange={(e) => handlePropertyChange(index, 'revenueExpensesLocation', e.target.value)}
                                          placeholder="Enter location"
                                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Where do you keep records of your capital expenditures?
                                        </label>
                                        <input
                                          type="text"
                                          value={propertiesData[index]?.capitalExpendituresLocation || ''}
                                          onChange={(e) => handlePropertyChange(index, 'capitalExpendituresLocation', e.target.value)}
                                          placeholder="Enter location"
                                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                    </>
                                  )}
                                  {propertiesData[index]?.propertyType === 'Rental' && (
                                    <>
                                      {/* Property manager */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Is there a designated property manager?
                                        </label>
                                        <div className="flex gap-4">
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`hasPropertyManager-${index}`}
                                              value="yes"
                                              checked={propertiesData[index]?.hasPropertyManager === 'yes'}
                                              onChange={(e) => handlePropertyChange(index, 'hasPropertyManager', e.target.value)}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">Yes</span>
                                          </label>
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`hasPropertyManager-${index}`}
                                              value="no"
                                              checked={propertiesData[index]?.hasPropertyManager === 'no'}
                                              onChange={(e) => {
                                                handlePropertyChange(index, 'hasPropertyManager', e.target.value);
                                                handlePropertyChange(index, 'propertyManagerName', '');
                                                handlePropertyChange(index, 'propertyManagerPhone', '');
                                                handlePropertyChange(index, 'propertyManagerEmail', '');
                                                handlePropertyChange(index, 'propertyManagerCompany', '');
                                              }}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">No</span>
                                          </label>
                                        </div>
                                      </div>

                                      {/* Property manager contact details (conditional on hasPropertyManager = yes) */}
                                      {propertiesData[index]?.hasPropertyManager === 'yes' && (
                                        <div className="ml-6 space-y-4">
                                          <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Contact Name:</label>
                                            <input
                                              type="text"
                                              value={propertiesData[index]?.propertyManagerName || ''}
                                              onChange={(e) => handlePropertyChange(index, 'propertyManagerName', e.target.value)}
                                              placeholder="Enter contact name"
                                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                                            <input
                                              type="text"
                                              value={propertiesData[index]?.propertyManagerPhone || ''}
                                              onChange={(e) => handlePropertyChange(index, 'propertyManagerPhone', e.target.value)}
                                              placeholder="Enter phone number"
                                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                            <input
                                              type="text"
                                              value={propertiesData[index]?.propertyManagerEmail || ''}
                                              onChange={(e) => handlePropertyChange(index, 'propertyManagerEmail', e.target.value)}
                                              placeholder="Enter email address"
                                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Company:</label>
                                            <input
                                              type="text"
                                              value={propertiesData[index]?.propertyManagerCompany || ''}
                                              onChange={(e) => handlePropertyChange(index, 'propertyManagerCompany', e.target.value)}
                                              placeholder="Enter company name"
                                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Landlord insurance */}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                          Do you have a specific Landlord insurance policy?
                                        </label>
                                        <div className="flex gap-4">
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`hasLandlordInsurance-${index}`}
                                              value="yes"
                                              checked={propertiesData[index]?.hasLandlordInsurance === 'yes'}
                                              onChange={(e) => handlePropertyChange(index, 'hasLandlordInsurance', e.target.value)}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">Yes</span>
                                          </label>
                                          <label className="flex items-center">
                                            <input
                                              type="radio"
                                              name={`hasLandlordInsurance-${index}`}
                                              value="no"
                                              checked={propertiesData[index]?.hasLandlordInsurance === 'no'}
                                              onChange={(e) => {
                                                handlePropertyChange(index, 'hasLandlordInsurance', e.target.value);
                                                handlePropertyChange(index, 'landlordInsuranceLocation', '');
                                              }}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">No</span>
                                          </label>
                                        </div>
                                      </div>

                                      {/* Landlord insurance document location (conditional on hasLandlordInsurance = yes) */}
                                      {propertiesData[index]?.hasLandlordInsurance === 'yes' && (
                                        <div className="ml-6">
                                          <label className="block text-sm font-medium text-gray-300 mb-2">Landlord insurance policy document location:</label>
                                          <input
                                            type="text"
                                            value={propertiesData[index]?.landlordInsuranceLocation || ''}
                                            onChange={(e) => handlePropertyChange(index, 'landlordInsuranceLocation', e.target.value)}
                                            placeholder="Enter where the policy document is kept"
                                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                  </div>{/* end Property Details space-y-4 */}
                                  </div>{/* end Property Details subsection */}

                                  <div>
                                    <div className="pb-1 border-b border-gray-500 mb-3">
                                      <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Ownership</h4>
                                    </div>
                                    <div className="space-y-4">
                                  {(() => {
                                    const selectedOwners: string[] = JSON.parse(propertiesData[index]?.propertyOwners || '[]');
                                    const toggleOwner = (val: string) => {
                                      const updated = selectedOwners.includes(val)
                                        ? selectedOwners.filter(o => o !== val)
                                        : [...selectedOwners, val];
                                      handlePropertyChange(index, 'propertyOwners', JSON.stringify(updated));
                                      if (!updated.includes('other')) {
                                        handlePropertyChange(index, 'otherOwnerName', '');
                                        handlePropertyChange(index, 'otherOwnerPhone', '');
                                        handlePropertyChange(index, 'otherOwnerPercent', '');
                                        handlePropertyChange(index, 'hasAdditionalOtherOwners', '');
                                        handlePropertyChange(index, 'additionalOtherOwners', '[]');
                                      }
                                    };

                                    type ExtraOwner = { name: string; phone: string; percent: string };
                                    const additionalOtherOwners: ExtraOwner[] = JSON.parse(propertiesData[index]?.additionalOtherOwners || '[]');
                                    const updateAdditionalOwner = (oIdx: number, field: keyof ExtraOwner, val: string) => {
                                      const updated = [...additionalOtherOwners];
                                      if (!updated[oIdx]) updated[oIdx] = { name: '', phone: '', percent: '' };
                                      updated[oIdx][field] = val;
                                      handlePropertyChange(index, 'additionalOtherOwners', JSON.stringify(updated));
                                    };

                                    const ownerCheckboxOptions = [
                                      { value: 'client1', label: client1Name },
                                      ...(hasSpouse ? [{ value: 'client2', label: client2Name }] : []),
                                      { value: 'other', label: 'Other' },
                                    ];

                                    return (
                                      <div className="space-y-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Who owns the property? <span className="text-gray-500 font-normal">(Select all that apply)</span>
                                          </label>
                                          <div className="space-y-2">
                                            {ownerCheckboxOptions.map(opt => (
                                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={selectedOwners.includes(opt.value)}
                                                  onChange={() => toggleOwner(opt.value)}
                                                  className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                                                />
                                                <span className="text-gray-300">{opt.label}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>

                                        {selectedOwners.includes('other') && (
                                          <div className="pl-4 border-l-2 border-blue-500 space-y-3">
                                            <p className="text-sm font-medium text-gray-300">Other owner's details:</p>
                                            <input
                                              type="text"
                                              value={propertiesData[index]?.otherOwnerName || ''}
                                              onChange={(e) => handlePropertyChange(index, 'otherOwnerName', e.target.value)}
                                              placeholder="Full name"
                                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <input
                                              type="text"
                                              value={propertiesData[index]?.otherOwnerPhone || ''}
                                              onChange={(e) => handlePropertyChange(index, 'otherOwnerPhone', e.target.value)}
                                              placeholder="Phone number"
                                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., 33%</p>
                                            <input
                                              type="text"
                                              value={propertiesData[index]?.otherOwnerPercent || ''}
                                              onChange={(e) => handlePropertyChange(index, 'otherOwnerPercent', e.target.value)}
                                              placeholder="Ownership percentage"
                                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />

                                            <div>
                                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Are there any additional owners?
                                              </label>
                                              <div className="flex gap-4">
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`has-additional-other-owners-${index}`}
                                                    value="yes"
                                                    checked={propertiesData[index]?.hasAdditionalOtherOwners === 'yes'}
                                                    onChange={(e) => {
                                                      handlePropertyChange(index, 'hasAdditionalOtherOwners', e.target.value);
                                                      if (additionalOtherOwners.length === 0) {
                                                        handlePropertyChange(index, 'additionalOtherOwners', JSON.stringify([{ name: '', phone: '', percent: '' }]));
                                                      }
                                                    }}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">Yes</span>
                                                </label>
                                                <label className="flex items-center">
                                                  <input
                                                    type="radio"
                                                    name={`has-additional-other-owners-${index}`}
                                                    value="no"
                                                    checked={propertiesData[index]?.hasAdditionalOtherOwners === 'no'}
                                                    onChange={(e) => {
                                                      handlePropertyChange(index, 'hasAdditionalOtherOwners', e.target.value);
                                                      handlePropertyChange(index, 'additionalOtherOwners', '[]');
                                                    }}
                                                    className="mr-2"
                                                  />
                                                  <span className="text-gray-300">No</span>
                                                </label>
                                              </div>
                                            </div>

                                            {propertiesData[index]?.hasAdditionalOtherOwners === 'yes' && (
                                              <div className="space-y-4">
                                                {additionalOtherOwners.map((owner, oIdx) => (
                                                  <div key={oIdx} className="pl-4 border-l-2 border-gray-500 space-y-3">
                                                    <p className="text-sm font-medium text-gray-400">Additional owner {oIdx + 1}:</p>
                                                    <input
                                                      type="text"
                                                      value={owner.name || ''}
                                                      onChange={(e) => updateAdditionalOwner(oIdx, 'name', e.target.value)}
                                                      placeholder="Full name"
                                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <input
                                                      type="text"
                                                      value={owner.phone || ''}
                                                      onChange={(e) => updateAdditionalOwner(oIdx, 'phone', e.target.value)}
                                                      placeholder="Phone number"
                                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., 33%</p>
                                                    <input
                                                      type="text"
                                                      value={owner.percent || ''}
                                                      onChange={(e) => updateAdditionalOwner(oIdx, 'percent', e.target.value)}
                                                      placeholder="Ownership percentage"
                                                      className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    {oIdx === additionalOtherOwners.length - 1 && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handlePropertyChange(index, 'additionalOtherOwners', JSON.stringify([...additionalOtherOwners, { name: '', phone: '', percent: '' }]))}
                                                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                                      >
                                                        + Add another owner
                                                      </button>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  </div>{/* end Ownership space-y-4 */}
                                  </div>{/* end Ownership subsection */}

                                  <div>
                                    <div className="pb-1 border-b border-gray-500 mb-3">
                                      <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Succession</h4>
                                    </div>
                                    <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Do you have a Property Succession Plan/Agreement in place for the property?
                                    </label>
                                    <div className="flex gap-4">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`succession-plan-${index}`}
                                          value="yes"
                                          checked={propertiesData[index]?.hasSuccessionPlan === 'yes'}
                                          onChange={(e) => handlePropertyChange(index, 'hasSuccessionPlan', e.target.value)}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">Yes</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`succession-plan-${index}`}
                                          value="no"
                                          checked={propertiesData[index]?.hasSuccessionPlan === 'no'}
                                          onChange={(e) => handlePropertyChange(index, 'hasSuccessionPlan', e.target.value)}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">No</span>
                                      </label>
                                    </div>
                                  </div>
                                  {propertiesData[index]?.hasSuccessionPlan === 'yes' && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Where is this document stored?
                                      </label>
                                      <input
                                        type="text"
                                        value={propertiesData[index]?.successionPlanLocation || ''}
                                        onChange={(e) => handlePropertyChange(index, 'successionPlanLocation', e.target.value)}
                                        placeholder="Enter document location"
                                        className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                  )}
                                  </div>{/* end Succession space-y-4 */}
                                  </div>{/* end Succession subsection */}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  }

                  return (
                    <FormField
                      key={question.key}
                      question={question}
                      value={answers[question.key]}
                      onChange={(value) => onAnswerChange(question.key, value)}
                    />
                  );
                })}
                <div className="flex items-center gap-3 mt-8 mb-5">
                  <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
                  <h3 className="text-sm font-semibold tracking-widest text-blue-400 uppercase whitespace-nowrap">Investment Account Information: {client1Name}</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-blue-500/50 to-transparent" />
                </div>

                {(() => {
                  const REGISTERED_ACCOUNT_TYPES = [
                    { key: 'rrsp', label: 'Registered Retirement Savings Plan (RRSP)' },
                    { key: 'rrif', label: 'Registered Retirement Income Fund (RRIF)' },
                    { key: 'tfsa', label: 'Tax-Free Savings Account (TFSA)' },
                    { key: 'fhsa', label: 'Tax-Free First Home Savings Account (FHSA)' },
                    { key: 'resp', label: 'Registered Education Savings Plan (RESP)' },
                    { key: 'rdsp', label: 'Registered Disability Savings Plan (RDSP)' },
                    { key: 'lira', label: 'Locked-In Retirement Account (LIRA) or Locked-In RRSP' },
                    { key: 'ipp', label: 'Individual Pension Plan (IPP)' },
                    { key: 'rca', label: 'Retirement Compensation Arrangement (RCA)' },
                  ];

                  const s2 = allAnswers?.get('previousRelationships') || {};
                  const s3 = allAnswers?.get('children') || {};
                  const s7 = allAnswers?.get('corporateFinancialConnections') || {};
                  const knownNames: string[] = [];
                  if (hasSpouse) knownNames.push(client2Name);
                  (s2['client1PreviousRelationshipsData'] as Array<Record<string,string>> || []).forEach(r => { if (r?.name && !knownNames.includes(r.name)) knownNames.push(r.name); });
                  (s2['client2PreviousRelationshipsData'] as Array<Record<string,string>> || []).forEach(r => { if (r?.name && !knownNames.includes(r.name)) knownNames.push(r.name); });
                  (s3['childrenData'] as Array<Record<string,string>> || []).forEach(c => { if (c?.name && !knownNames.includes(c.name)) knownNames.push(c.name); });
                  if (!knownNames.includes('Estate')) knownNames.push('Estate');

                  const selectedTypes = (answers['client1RegisteredAccountTypes'] as string[]) || [];
                  const accountData = (answers['client1RegisteredAccountData'] as Record<string, Array<Record<string, unknown>>>) || {};

                  const toggleAccountType = (typeKey: string) => {
                    const updated = selectedTypes.includes(typeKey)
                      ? selectedTypes.filter(t => t !== typeKey)
                      : [...selectedTypes, typeKey];
                    if (selectedTypes.includes(typeKey)) {
                      const d = { ...accountData };
                      delete d[typeKey];
                      onAnswerChange('client1RegisteredAccountData', d);
                    }
                    onAnswerChange('client1RegisteredAccountTypes', updated);
                  };

                  const accountDecisions = (answers['client1RegisteredAccountDecisions'] as Record<string, 'yes'|'no'>) || {};

                  const setAccountDecision = (typeKey: string, decision: 'yes'|'no') => {
                    onAnswerChange('client1RegisteredAccountDecisions', { ...accountDecisions, [typeKey]: decision });
                    if (decision === 'yes') {
                      if (!selectedTypes.includes(typeKey)) {
                        onAnswerChange('client1RegisteredAccountTypes', [...selectedTypes, typeKey]);
                      }
                      if (!accountData[typeKey] || accountData[typeKey].length === 0) {
                        onAnswerChange('client1RegisteredAccountData', { ...accountData, [typeKey]: [{ institution: '' }] });
                      }
                    } else {
                      const d = { ...accountData };
                      delete d[typeKey];
                      onAnswerChange('client1RegisteredAccountData', d);
                      onAnswerChange('client1RegisteredAccountTypes', selectedTypes.filter(t => t !== typeKey));
                    }
                  };

                  const getInsts = (typeKey: string): Array<Record<string, unknown>> => accountData[typeKey] || [];

                  const setInsts = (typeKey: string, insts: Array<Record<string, unknown>>) => {
                    onAnswerChange('client1RegisteredAccountData', { ...accountData, [typeKey]: insts });
                  };

                  const updateInstField = (typeKey: string, idx: number, field: string, value: unknown) => {
                    const insts = [...getInsts(typeKey)];
                    insts[idx] = { ...insts[idx], [field]: value };
                    setInsts(typeKey, insts);
                  };

                  const toggleKnownBen = (typeKey: string, idx: number, name: string) => {
                    const insts = [...getInsts(typeKey)];
                    const cur = (insts[idx]?.selectedKnownBeneficiaries as string[]) || [];
                    insts[idx] = { ...insts[idx], selectedKnownBeneficiaries: cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name] };
                    setInsts(typeKey, insts);
                  };

                  const addCustomBen = (typeKey: string, idx: number) => {
                    const insts = [...getInsts(typeKey)];
                    const cur = (insts[idx]?.customBeneficiaries as string[]) || [];
                    insts[idx] = { ...insts[idx], customBeneficiaries: [...cur, ''] };
                    setInsts(typeKey, insts);
                  };

                  const updateCustomBen = (typeKey: string, idx: number, bIdx: number, value: string) => {
                    const insts = [...getInsts(typeKey)];
                    const cur = [...((insts[idx]?.customBeneficiaries as string[]) || [])];
                    cur[bIdx] = value;
                    insts[idx] = { ...insts[idx], customBeneficiaries: cur };
                    setInsts(typeKey, insts);
                  };

                  const removeLastCustomBen = (typeKey: string, idx: number) => {
                    const insts = [...getInsts(typeKey)];
                    const cur = [...((insts[idx]?.customBeneficiaries as string[]) || [])];
                    if (cur.length > 0) cur.pop();
                    insts[idx] = { ...insts[idx], customBeneficiaries: cur };
                    setInsts(typeKey, insts);
                  };

                  const updateBenPct = (typeKey: string, idx: number, name: string, value: string) => {
                    const insts = [...getInsts(typeKey)];
                    const pcts = { ...((insts[idx]?.beneficiaryPercentages as Record<string,string>) || {}) };
                    pcts[name] = value;
                    insts[idx] = { ...insts[idx], beneficiaryPercentages: pcts };
                    setInsts(typeKey, insts);
                  };

                  const toggleKnownContingentBen = (typeKey: string, idx: number, name: string) => {
                    const insts = [...getInsts(typeKey)];
                    const cur = (insts[idx]?.selectedKnownContingentBeneficiaries as string[]) || [];
                    insts[idx] = { ...insts[idx], selectedKnownContingentBeneficiaries: cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name] };
                    setInsts(typeKey, insts);
                  };

                  const addCustomContingentBen = (typeKey: string, idx: number) => {
                    const insts = [...getInsts(typeKey)];
                    const cur = (insts[idx]?.customContingentBeneficiaries as string[]) || [];
                    insts[idx] = { ...insts[idx], customContingentBeneficiaries: [...cur, ''] };
                    setInsts(typeKey, insts);
                  };

                  const updateCustomContingentBen = (typeKey: string, idx: number, bIdx: number, value: string) => {
                    const insts = [...getInsts(typeKey)];
                    const cur = [...((insts[idx]?.customContingentBeneficiaries as string[]) || [])];
                    cur[bIdx] = value;
                    insts[idx] = { ...insts[idx], customContingentBeneficiaries: cur };
                    setInsts(typeKey, insts);
                  };

                  const removeLastCustomContingentBen = (typeKey: string, idx: number) => {
                    const insts = [...getInsts(typeKey)];
                    const cur = [...((insts[idx]?.customContingentBeneficiaries as string[]) || [])];
                    if (cur.length > 0) cur.pop();
                    insts[idx] = { ...insts[idx], customContingentBeneficiaries: cur };
                    setInsts(typeKey, insts);
                  };

                  const updateContingentBenPct = (typeKey: string, idx: number, name: string, value: string) => {
                    const insts = [...getInsts(typeKey)];
                    const pcts = { ...((insts[idx]?.contingentBeneficiaryPercentages as Record<string,string>) || {}) };
                    pcts[name] = value;
                    insts[idx] = { ...insts[idx], contingentBeneficiaryPercentages: pcts };
                    setInsts(typeKey, insts);
                  };

                  const renderBeneficiarySection = (typeKey: string, instIdx: number, inst: Record<string, unknown>) => {
                    const hasPrimaryBen = (inst.hasPrimaryBeneficiary as string) || '';
                    const hasMultipleBen = (inst.hasMultipleBeneficiaries as string) || '';
                    const selectedKnown = (inst.selectedKnownBeneficiaries as string[]) || [];
                    const customBens = (inst.customBeneficiaries as string[]) || [];
                    const benPcts = (inst.beneficiaryPercentages as Record<string,string>) || {};
                    const allBens = [...selectedKnown, ...customBens.filter(b => b.trim())];
                    const totalPct = allBens.reduce((sum, n) => sum + (parseFloat(benPcts[n] || '0') || 0), 0);
                    const pctValid = Math.abs(totalPct - 100) < 0.01;
                    const hasSuccessorHolder = (inst.hasSuccessorHolder as string) || '';
                    const hasBenIfPredecease = (inst.hasBenIfPredecease as string) || '';
                    const saOrBen = (inst.successorAnnuitantOrBeneficiary as string) || '';
                    const hasContingentBen = (inst.hasContingentBeneficiary as string) || '';
                    const hasMultipleContingentBen = (inst.hasMultipleContingentBeneficiaries as string) || '';
                    const selectedKnownContingent = (inst.selectedKnownContingentBeneficiaries as string[]) || [];
                    const customContingentBens = (inst.customContingentBeneficiaries as string[]) || [];
                    const contingentBenPcts = (inst.contingentBeneficiaryPercentages as Record<string,string>) || {};
                    const allContingentBens = [...selectedKnownContingent, ...customContingentBens.filter(b => b.trim())];
                    const totalContingentPct = allContingentBens.reduce((sum, n) => sum + (parseFloat(contingentBenPcts[n] || '0') || 0), 0);
                    const contingentPctValid = Math.abs(totalContingentPct - 100) < 0.01;

                    const isResp = typeKey === 'resp';
                    const allChildren = (s3['childrenData'] as Array<Record<string,string>>) || [];
                    const respChildNames: string[] = allChildren.map(c => c?.name).filter((n): n is string => Boolean(n));
                    const respGrandchildNames: string[] = [];
                    allChildren.forEach(c => {
                      const gcCount = parseInt(c?.numberOfGrandchildren || '0');
                      for (let i = 1; i <= gcCount; i++) {
                        const gcName = c?.[`grandchild${i}Name`];
                        if (gcName) respGrandchildNames.push(gcName);
                      }
                    });
                    const respHasChildSelected = isResp && selectedKnown.some(n => respChildNames.includes(n));
                    const respHasGrandchildSelected = isResp && selectedKnown.some(n => respGrandchildNames.includes(n));

                    const isRdsp = typeKey === 'rdsp';
                    const dtcQualifyingNames: string[] = allChildren
                      .filter(c => c?.disabilityTaxCredit === 'yes' && c?.name)
                      .map(c => c.name as string);

                    const isSingle = hasMultipleBen === 'no';
                    const singleIsCustom = isSingle && customBens.length > 0;
                    const singleSelected = isSingle ? (singleIsCustom ? '__custom__' : (selectedKnown[0] || '')) : '';
                    const isContingentSingle = hasMultipleContingentBen === 'no';
                    const contingentSingleIsCustom = isContingentSingle && customContingentBens.length > 0;
                    const contingentSingleSelected = isContingentSingle ? (contingentSingleIsCustom ? '__custom__' : (selectedKnownContingent[0] || '')) : '';

                    const selectSingleBen = (name: string, isCustom: boolean) => {
                      const cur = [...getInsts(typeKey)];
                      cur[instIdx] = {
                        ...cur[instIdx],
                        selectedKnownBeneficiaries: isCustom ? [] : [name],
                        customBeneficiaries: isCustom ? [''] : [],
                        beneficiaryPercentages: isCustom ? {} : { [name]: '100' },
                      };
                      setInsts(typeKey, cur);
                    };

                    const updateSingleCustomBen = (value: string) => {
                      const cur = [...getInsts(typeKey)];
                      cur[instIdx] = {
                        ...cur[instIdx],
                        customBeneficiaries: [value],
                        beneficiaryPercentages: value.trim() ? { [value]: '100' } : {},
                      };
                      setInsts(typeKey, cur);
                    };

                    const selectSingleContingentBen = (name: string, isCustom: boolean) => {
                      const cur = [...getInsts(typeKey)];
                      cur[instIdx] = {
                        ...cur[instIdx],
                        selectedKnownContingentBeneficiaries: isCustom ? [] : [name],
                        customContingentBeneficiaries: isCustom ? [''] : [],
                        contingentBeneficiaryPercentages: isCustom ? {} : { [name]: '100' },
                      };
                      setInsts(typeKey, cur);
                    };

                    const updateSingleCustomContingentBen = (value: string) => {
                      const cur = [...getInsts(typeKey)];
                      cur[instIdx] = {
                        ...cur[instIdx],
                        customContingentBeneficiaries: [value],
                        contingentBeneficiaryPercentages: value.trim() ? { [value]: '100' } : {},
                      };
                      setInsts(typeKey, cur);
                    };

                    const saInfoKey = `sa-${typeKey}-${instIdx}`;

                    const saFollowUp = (
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="block text-sm font-medium text-gray-300">Are they named as a Successor Annuitant or Beneficiary?</label>
                            <button type="button" onClick={() => setOpenInfoTooltip(openInfoTooltip === saInfoKey ? null : saInfoKey)} className="text-gray-400 hover:text-blue-400 transition-colors flex-shrink-0" aria-label="More information">
                              <Info size={15} />
                            </button>
                          </div>
                          {openInfoTooltip === saInfoKey && (
                            <div className="mb-3 p-3 bg-gray-700 border border-blue-500/40 rounded-lg text-sm text-gray-300 leading-relaxed">
                              Naming your spouse as a beneficiary instead of a successor annuitant may provide additional flexibility to optimize taxes after death. While a successor annuitant designation is usually simpler administratively, a beneficiary designation can allow your executor and surviving spouse to decide how much of the RRIF should be rolled over versus taxed on your final return, depending on the family's circumstances at the time of death.
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4">
                            {(['successor_annuitant', 'beneficiary', 'not_sure'] as const).map(opt => (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name={`saorben-${typeKey}-${instIdx}`} value={opt} checked={saOrBen === opt}
                                  onChange={() => {
                                    const cur = [...getInsts(typeKey)];
                                    cur[instIdx] = { ...cur[instIdx], successorAnnuitantOrBeneficiary: opt, hasMultipleBeneficiaries: '', selectedKnownBeneficiaries: [], customBeneficiaries: [], beneficiaryPercentages: {}, hasContingentBeneficiary: '', hasMultipleContingentBeneficiaries: '', selectedKnownContingentBeneficiaries: [], customContingentBeneficiaries: [], contingentBeneficiaryPercentages: {} };
                                    setInsts(typeKey, cur);
                                  }}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                <span className="text-white text-sm">{opt === 'successor_annuitant' ? 'Successor Annuitant' : opt === 'beneficiary' ? 'Beneficiary' : "I'm not sure"}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    );

                    const saContingentSection = (
                      <div className="pt-3 border-t border-gray-600 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Have you named any contingent beneficiaries, should {client2Name} predecease?
                          </label>
                          <div className="flex flex-wrap gap-4">
                            {(['yes', 'no', 'not_sure'] as const).map(opt => (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name={`sacben-${typeKey}-${instIdx}`} value={opt} checked={hasContingentBen === opt}
                                  onChange={() => {
                                    const cur = [...getInsts(typeKey)];
                                    cur[instIdx] = { ...cur[instIdx], hasContingentBeneficiary: opt, hasMultipleContingentBeneficiaries: '', selectedKnownContingentBeneficiaries: [], customContingentBeneficiaries: [], contingentBeneficiaryPercentages: {} };
                                    setInsts(typeKey, cur);
                                  }}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : "I'm not sure"}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {hasContingentBen === 'yes' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Are there multiple contingent beneficiaries?</label>
                              <div className="flex gap-4">
                                {(['yes', 'no'] as const).map(opt => (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`samcben-${typeKey}-${instIdx}`} value={opt} checked={hasMultipleContingentBen === opt}
                                      onChange={() => {
                                        const cur = [...getInsts(typeKey)];
                                        cur[instIdx] = { ...cur[instIdx], hasMultipleContingentBeneficiaries: opt, selectedKnownContingentBeneficiaries: [], customContingentBeneficiaries: [], contingentBeneficiaryPercentages: {} };
                                        setInsts(typeKey, cur);
                                      }}
                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                    <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : 'No'}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {isContingentSingle && (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Select contingent beneficiary:</label>
                                {knownNames.map(name => (
                                  <label key={name} className="flex items-center gap-3 cursor-pointer">
                                    <input type="radio" name={`sascben-${typeKey}-${instIdx}`} value={name} checked={contingentSingleSelected === name} onChange={() => selectSingleContingentBen(name, false)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                    <span className="text-white text-sm">{name}</span>
                                  </label>
                                ))}
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="radio" name={`sascben-${typeKey}-${instIdx}`} value="__custom__" checked={contingentSingleSelected === '__custom__'} onChange={() => selectSingleContingentBen('', true)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                  <span className="text-white text-sm">Other</span>
                                </label>
                                {contingentSingleIsCustom && (
                                  <input type="text" value={customContingentBens[0] || ''} onChange={e => updateSingleCustomContingentBen(e.target.value)} placeholder="Enter beneficiary name"
                                    className="ml-7 w-full max-w-xs px-3 py-2 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                )}
                              </div>
                            )}
                            {!isContingentSingle && hasMultipleContingentBen === 'yes' && (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Select contingent beneficiaries:</label>
                                {knownNames.map(name => (
                                  <label key={name} className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={selectedKnownContingent.includes(name)} onChange={() => toggleKnownContingentBen(typeKey, instIdx, name)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                    <span className="text-white text-sm">{name}</span>
                                  </label>
                                ))}
                                {customContingentBens.map((name, bIdx) => (
                                  <div key={bIdx} className="space-y-2 pl-2">
                                    <div className="flex items-center gap-3">
                                      <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      </div>
                                      <input type="text" value={name} onChange={e => updateCustomContingentBen(typeKey, instIdx, bIdx, e.target.value)} placeholder="Enter beneficiary name"
                                        className="flex-1 px-3 py-2 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                    </div>
                                    {bIdx === customContingentBens.length - 1 && (
                                      <div className="pl-7 space-y-2">
                                        <p className="text-sm text-gray-300">Are there other contingent beneficiaries?</p>
                                        <div className="flex gap-3">
                                          <button type="button" onClick={() => addCustomContingentBen(typeKey, instIdx)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">Yes</button>
                                          <button type="button" onClick={() => removeLastCustomContingentBen(typeKey, instIdx)} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">No</button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {customContingentBens.length === 0 && (
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={false} onChange={() => addCustomContingentBen(typeKey, instIdx)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                    <span className="text-white text-sm">Other</span>
                                  </label>
                                )}
                              </div>
                            )}
                            {allContingentBens.length > 0 && isContingentSingle && (
                              <div className="pl-4 border-l-2 border-blue-500/40">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Beneficial Ownership:</label>
                                <div className="flex items-center gap-3">
                                  <span className="text-white text-sm w-40 shrink-0 truncate">{allContingentBens[0]}</span>
                                  <span className="text-green-400 text-sm font-medium">100%</span>
                                </div>
                              </div>
                            )}
                            {allContingentBens.length > 0 && !isContingentSingle && (
                              <div className="space-y-3 pl-4 border-l-2 border-blue-500/40">
                                <label className="block text-sm font-medium text-gray-300">Beneficial Ownership %: (must total 100%)</label>
                                {allContingentBens.map(name => (
                                  <div key={name} className="flex items-center gap-3">
                                    <span className="text-white text-sm w-40 shrink-0 truncate">{name}</span>
                                    <div className="relative flex-1 max-w-[140px]">
                                      <input type="number" min="0" max="100" step="0.01" value={contingentBenPcts[name] || ''} onChange={e => updateContingentBenPct(typeKey, instIdx, name, e.target.value)} placeholder="0"
                                        className="w-full px-4 py-2 pr-8 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                    </div>
                                  </div>
                                ))}
                                <p className={`text-sm font-medium ${contingentPctValid ? 'text-green-400' : totalContingentPct > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                  Total: {totalContingentPct.toFixed(totalContingentPct % 1 === 0 ? 0 : 2)}%{totalContingentPct > 0 && !contingentPctValid ? ' — must equal 100%' : ''}{contingentPctValid ? ' ✓' : ''}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );

                    const primaryBenLabel = (typeKey === 'rrif' || typeKey === 'rrsp') && hasSpouse
                      ? `Is ${client2Name} named as a Successor Annuitant or Beneficiary?`
                      : 'Have you named a primary beneficiary(ies)?';

                    const primaryBenQuestion = (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{primaryBenLabel}</label>
                        <div className="flex flex-wrap gap-4">
                          {(['yes', 'no', 'not_sure'] as const).map(opt => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name={`pben-${typeKey}-${instIdx}`} value={opt} checked={hasPrimaryBen === opt}
                                onChange={() => updateInstField(typeKey, instIdx, 'hasPrimaryBeneficiary', opt)}
                                className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                              <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : "I'm not sure"}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );

                    const beneficiaryDetails = (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {isResp
                              ? 'Is this an individual plan (one beneficiary) or a family plan (multiple beneficiaries on the same account)?'
                              : 'Are there multiple primary beneficiaries?'}
                          </label>
                          <div className="flex flex-wrap gap-4">
                            {(isResp
                              ? [{ value: 'no', label: 'Individual plan' }, { value: 'yes', label: 'Family plan' }]
                              : [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]
                            ).map(opt => (
                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name={`mben-${typeKey}-${instIdx}`} value={opt.value} checked={hasMultipleBen === opt.value}
                                  onChange={() => { const cur = [...getInsts(typeKey)]; cur[instIdx] = { ...cur[instIdx], hasMultipleBeneficiaries: opt.value, selectedKnownBeneficiaries: [], customBeneficiaries: [], beneficiaryPercentages: {} }; setInsts(typeKey, cur); }}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                <span className="text-white text-sm">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {isSingle && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Select primary beneficiary:</label>
                            {(isResp ? [...respChildNames, ...respGrandchildNames] : isRdsp ? dtcQualifyingNames : knownNames).map(name => (
                              <label key={name} className="flex items-center gap-3 cursor-pointer">
                                <input type="radio" name={`sben-${typeKey}-${instIdx}`} value={name} checked={singleSelected === name} onChange={() => selectSingleBen(name, false)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                <span className="text-white text-sm">{name}</span>
                              </label>
                            ))}
                            {!isResp && (
                              <>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="radio" name={`sben-${typeKey}-${instIdx}`} value="__custom__" checked={singleSelected === '__custom__'} onChange={() => selectSingleBen('', true)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                  <span className="text-white text-sm">Other</span>
                                </label>
                                {singleIsCustom && (
                                  <input type="text" value={customBens[0] || ''} onChange={e => updateSingleCustomBen(e.target.value)} placeholder="Enter beneficiary name"
                                    className="ml-7 w-full max-w-xs px-3 py-2 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                )}
                              </>
                            )}
                            {isResp && respChildNames.length === 0 && respGrandchildNames.length === 0 && (
                              <p className="text-sm text-gray-400">No children or grandchildren found. Please add them in the Children section.</p>
                            )}
                            {isRdsp && dtcQualifyingNames.length === 0 && (
                              <p className="text-sm text-gray-400">No one has been identified as qualifying for the Disability Tax Credit. You can still enter a beneficiary manually using "Other".</p>
                            )}
                          </div>
                        )}
                        {!isSingle && hasMultipleBen === 'yes' && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Select primary beneficiaries:</label>
                            {isResp ? (
                              <div className="space-y-3">
                                {respChildNames.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Children</p>
                                    {respChildNames.map(name => (
                                      <label key={name} className={`flex items-center gap-3 ${respHasGrandchildSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                        <input type="checkbox" checked={selectedKnown.includes(name)} disabled={respHasGrandchildSelected}
                                          onChange={() => !respHasGrandchildSelected && toggleKnownBen(typeKey, instIdx, name)}
                                          className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                        <span className="text-white text-sm">{name}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {respGrandchildNames.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Grandchildren</p>
                                    {respGrandchildNames.map(name => (
                                      <label key={name} className={`flex items-center gap-3 ${respHasChildSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                        <input type="checkbox" checked={selectedKnown.includes(name)} disabled={respHasChildSelected}
                                          onChange={() => !respHasChildSelected && toggleKnownBen(typeKey, instIdx, name)}
                                          className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                        <span className="text-white text-sm">{name}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {respChildNames.length === 0 && respGrandchildNames.length === 0 && (
                                  <p className="text-sm text-gray-400">No children or grandchildren found. Please add them in the Children section.</p>
                                )}
                                {(respHasChildSelected || respHasGrandchildSelected) && (
                                  <p className="text-xs text-amber-400">Children and grandchildren cannot be mixed as beneficiaries on the same RESP.</p>
                                )}
                              </div>
                            ) : (
                              <>
                                {(isRdsp ? dtcQualifyingNames : knownNames).map(name => (
                                  <label key={name} className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={selectedKnown.includes(name)} onChange={() => toggleKnownBen(typeKey, instIdx, name)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                    <span className="text-white text-sm">{name}</span>
                                  </label>
                                ))}
                                {isRdsp && dtcQualifyingNames.length === 0 && (
                                  <p className="text-sm text-gray-400">No one has been identified as qualifying for the Disability Tax Credit. You can still enter a beneficiary manually using "Other".</p>
                                )}
                                {customBens.map((name, bIdx) => (
                                  <div key={bIdx} className="space-y-2 pl-2">
                                    <div className="flex items-center gap-3">
                                      <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      </div>
                                      <input type="text" value={name} onChange={e => updateCustomBen(typeKey, instIdx, bIdx, e.target.value)} placeholder="Enter beneficiary name"
                                        className="flex-1 px-3 py-2 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                    </div>
                                    {bIdx === customBens.length - 1 && (
                                      <div className="pl-7 space-y-2">
                                        <p className="text-sm text-gray-300">Are there other primary beneficiaries?</p>
                                        <div className="flex gap-3">
                                          <button type="button" onClick={() => addCustomBen(typeKey, instIdx)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">Yes</button>
                                          <button type="button" onClick={() => removeLastCustomBen(typeKey, instIdx)} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">No</button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {customBens.length === 0 && (
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={false} onChange={() => addCustomBen(typeKey, instIdx)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                    <span className="text-white text-sm">Other</span>
                                  </label>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        {allBens.length > 0 && isSingle && (
                          <div className="pl-4 border-l-2 border-blue-500/40">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Beneficial Ownership:</label>
                            <div className="flex items-center gap-3">
                              <span className="text-white text-sm w-40 shrink-0 truncate">{allBens[0]}</span>
                              <span className="text-green-400 text-sm font-medium">100%</span>
                            </div>
                          </div>
                        )}
                        {allBens.length > 0 && !isSingle && (
                          <div className="space-y-3 pl-4 border-l-2 border-blue-500/40">
                            <label className="block text-sm font-medium text-gray-300">Beneficial Ownership %: (must total 100%)</label>
                            {allBens.map(name => (
                              <div key={name} className="flex items-center gap-3">
                                <span className="text-white text-sm w-40 shrink-0 truncate">{name}</span>
                                <div className="relative flex-1 max-w-[140px]">
                                  <input type="number" min="0" max="100" step="0.01" value={benPcts[name] || ''} onChange={e => updateBenPct(typeKey, instIdx, name, e.target.value)} placeholder="0"
                                    className="w-full px-4 py-2 pr-8 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                </div>
                              </div>
                            ))}
                            <p className={`text-sm font-medium ${pctValid ? 'text-green-400' : totalPct > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                              Total: {totalPct.toFixed(totalPct % 1 === 0 ? 0 : 2)}%{totalPct > 0 && !pctValid ? ' — must equal 100%' : ''}{pctValid ? ' ✓' : ''}
                            </p>
                          </div>
                        )}

                        {allBens.length > 0 && !isResp && (
                          <div className="pt-3 border-t border-gray-600 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Have you named any contingent beneficiaries, should {allBens.length === 1 ? allBens[0] : 'your primary beneficiary(ies)'} predecease?
                              </label>
                              <div className="flex flex-wrap gap-4">
                                {(['yes', 'no', 'not_sure'] as const).map(opt => (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`cben-${typeKey}-${instIdx}`} value={opt} checked={hasContingentBen === opt}
                                      onChange={() => {
                                        const cur = [...getInsts(typeKey)];
                                        cur[instIdx] = { ...cur[instIdx], hasContingentBeneficiary: opt, hasMultipleContingentBeneficiaries: '', selectedKnownContingentBeneficiaries: [], customContingentBeneficiaries: [], contingentBeneficiaryPercentages: {} };
                                        setInsts(typeKey, cur);
                                      }}
                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                    <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : "I'm not sure"}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {hasContingentBen === 'yes' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Are there multiple contingent beneficiaries?</label>
                                  <div className="flex gap-4">
                                    {(['yes', 'no'] as const).map(opt => (
                                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name={`mcben-${typeKey}-${instIdx}`} value={opt} checked={hasMultipleContingentBen === opt}
                                          onChange={() => {
                                            const cur = [...getInsts(typeKey)];
                                            cur[instIdx] = { ...cur[instIdx], hasMultipleContingentBeneficiaries: opt, selectedKnownContingentBeneficiaries: [], customContingentBeneficiaries: [], contingentBeneficiaryPercentages: {} };
                                            setInsts(typeKey, cur);
                                          }}
                                          className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                        <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : 'No'}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {isContingentSingle && (
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">Select contingent beneficiary:</label>
                                    {knownNames.map(name => (
                                      <label key={name} className="flex items-center gap-3 cursor-pointer">
                                        <input type="radio" name={`scben-${typeKey}-${instIdx}`} value={name} checked={contingentSingleSelected === name} onChange={() => selectSingleContingentBen(name, false)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                        <span className="text-white text-sm">{name}</span>
                                      </label>
                                    ))}
                                    <label className="flex items-center gap-3 cursor-pointer">
                                      <input type="radio" name={`scben-${typeKey}-${instIdx}`} value="__custom__" checked={contingentSingleSelected === '__custom__'} onChange={() => selectSingleContingentBen('', true)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                      <span className="text-white text-sm">Other</span>
                                    </label>
                                    {contingentSingleIsCustom && (
                                      <input type="text" value={customContingentBens[0] || ''} onChange={e => updateSingleCustomContingentBen(e.target.value)} placeholder="Enter beneficiary name"
                                        className="ml-7 w-full max-w-xs px-3 py-2 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                    )}
                                  </div>
                                )}

                                {!isContingentSingle && hasMultipleContingentBen === 'yes' && (
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">Select contingent beneficiaries:</label>
                                    {knownNames.map(name => (
                                      <label key={name} className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={selectedKnownContingent.includes(name)} onChange={() => toggleKnownContingentBen(typeKey, instIdx, name)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                        <span className="text-white text-sm">{name}</span>
                                      </label>
                                    ))}
                                    {customContingentBens.map((name, bIdx) => (
                                      <div key={bIdx} className="space-y-2 pl-2">
                                        <div className="flex items-center gap-3">
                                          <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                          </div>
                                          <input type="text" value={name} onChange={e => updateCustomContingentBen(typeKey, instIdx, bIdx, e.target.value)} placeholder="Enter beneficiary name"
                                            className="flex-1 px-3 py-2 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        {bIdx === customContingentBens.length - 1 && (
                                          <div className="pl-7 space-y-2">
                                            <p className="text-sm text-gray-300">Are there other contingent beneficiaries?</p>
                                            <div className="flex gap-3">
                                              <button type="button" onClick={() => addCustomContingentBen(typeKey, instIdx)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">Yes</button>
                                              <button type="button" onClick={() => removeLastCustomContingentBen(typeKey, instIdx)} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">No</button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {customContingentBens.length === 0 && (
                                      <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={false} onChange={() => addCustomContingentBen(typeKey, instIdx)} className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                        <span className="text-white text-sm">Other</span>
                                      </label>
                                    )}
                                  </div>
                                )}

                                {allContingentBens.length > 0 && isContingentSingle && (
                                  <div className="pl-4 border-l-2 border-blue-500/40">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Beneficial Ownership:</label>
                                    <div className="flex items-center gap-3">
                                      <span className="text-white text-sm w-40 shrink-0 truncate">{allContingentBens[0]}</span>
                                      <span className="text-green-400 text-sm font-medium">100%</span>
                                    </div>
                                  </div>
                                )}

                                {allContingentBens.length > 0 && !isContingentSingle && (
                                  <div className="space-y-3 pl-4 border-l-2 border-blue-500/40">
                                    <label className="block text-sm font-medium text-gray-300">Beneficial Ownership %: (must total 100%)</label>
                                    {allContingentBens.map(name => (
                                      <div key={name} className="flex items-center gap-3">
                                        <span className="text-white text-sm w-40 shrink-0 truncate">{name}</span>
                                        <div className="relative flex-1 max-w-[140px]">
                                          <input type="number" min="0" max="100" step="0.01" value={contingentBenPcts[name] || ''} onChange={e => updateContingentBenPct(typeKey, instIdx, name, e.target.value)} placeholder="0"
                                            className="w-full px-4 py-2 pr-8 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                        </div>
                                      </div>
                                    ))}
                                    <p className={`text-sm font-medium ${contingentPctValid ? 'text-green-400' : totalContingentPct > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                      Total: {totalContingentPct.toFixed(totalContingentPct % 1 === 0 ? 0 : 2)}%{totalContingentPct > 0 && !contingentPctValid ? ' — must equal 100%' : ''}{contingentPctValid ? ' ✓' : ''}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </>
                    );

                    return (
                      <div className="mt-3 space-y-4 pl-4 border-l-2 border-gray-500">
                        {(typeKey === 'tfsa' || typeKey === 'fhsa') && hasSpouse ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Is {client2Name} named as your Successor Holder?</label>
                              <div className="flex gap-4">
                                {(['yes', 'no', 'not_sure'] as const).map(opt => (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`sh-${typeKey}-${instIdx}`} value={opt} checked={hasSuccessorHolder === opt}
                                      onChange={() => {
                                        const cur = [...getInsts(typeKey)];
                                        cur[instIdx] = { ...cur[instIdx], hasSuccessorHolder: opt, successorHolder: opt === 'yes' ? client2Name : '', hasBenIfPredecease: '', hasPrimaryBeneficiary: '', hasMultipleBeneficiaries: '', selectedKnownBeneficiaries: [], customBeneficiaries: [], beneficiaryPercentages: {} };
                                        setInsts(typeKey, cur);
                                      }}
                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                    <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : "I'm not sure"}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {hasSuccessorHolder === 'yes' && (
                              <>
                                <div className="text-sm text-gray-300">Successor Holder: <span className="text-white font-medium">{client2Name}</span></div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Have you named any beneficiaries, should your successor holder predecease?</label>
                                  <div className="flex gap-4">
                                    {(['yes', 'no', 'not_sure'] as const).map(opt => (
                                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name={`bip-${typeKey}-${instIdx}`} value={opt} checked={hasBenIfPredecease === opt}
                                          onChange={() => {
                                            const cur = [...getInsts(typeKey)];
                                            cur[instIdx] = { ...cur[instIdx], hasBenIfPredecease: opt, hasPrimaryBeneficiary: '', hasMultipleBeneficiaries: '', selectedKnownBeneficiaries: [], customBeneficiaries: [], beneficiaryPercentages: {} };
                                            setInsts(typeKey, cur);
                                          }}
                                          className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                        <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : "I'm not sure"}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                {hasBenIfPredecease === 'yes' && beneficiaryDetails}
                              </>
                            )}
                            {hasSuccessorHolder === 'no' && beneficiaryDetails}
                          </>
                        ) : (typeKey === 'rrif' || typeKey === 'rrsp') && hasSpouse ? (
                          <>
                            {primaryBenQuestion}
                            {hasPrimaryBen === 'yes' && (
                              <>
                                {saFollowUp}
                                {saOrBen === 'successor_annuitant' && saContingentSection}
                                {saOrBen === 'beneficiary' && beneficiaryDetails}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {beneficiaryDetails}
                            {isResp && (() => {
                              const hasSuccSub = (inst.hasSuccessorSubscriber as string) || '';
                              const additionalSubscriber = (inst.additionalSubscriber as string) || '';
                              const andCoSubscriber = additionalSubscriber ? ` (and ${additionalSubscriber} if applicable)` : '';

                              // Compute adult-eligible names based on province age of majority
                              const province = ((basicAnswers['province'] as string) || '').toLowerCase();
                              const higherMajorityProvinces = ['bc', 'british columbia', 'nova scotia', 'new brunswick', 'newfoundland', 'nl', 'ns', 'nb'];
                              const ageOfMajority = higherMajorityProvinces.some(p => province.includes(p)) ? 19 : 18;
                              const today = new Date();
                              const adultKnownOptions: string[] = [];
                              if (hasSpouse && client2Name) adultKnownOptions.push(client2Name);
                              ((s2['client1PreviousRelationshipsData'] as Array<Record<string,string>>) || []).forEach(r => {
                                if (r?.name && !adultKnownOptions.includes(r.name)) adultKnownOptions.push(r.name);
                              });
                              allChildren.forEach(c => {
                                if (!c?.name || !c?.dateOfBirth) return;
                                const ageMs = today.getTime() - new Date(c.dateOfBirth).getTime();
                                if (ageMs / (365.25 * 24 * 60 * 60 * 1000) >= ageOfMajority && !adultKnownOptions.includes(c.name)) adultKnownOptions.push(c.name);
                              });

                              const succSubSelected = (inst.succSubSelected as string[]) || [];
                              const other1Active = (inst.succSubOther1Active as string) === 'yes';
                              const other2Active = (inst.succSubOther2Active as string) === 'yes';
                              const other1 = (inst.succSubOther1 as Record<string,string>) || {};
                              const other2 = (inst.succSubOther2 as Record<string,string>) || {};
                              const otherRelationship = (inst.succSubOtherRelationship as string) || '';

                              const toggleKnownSuccSub = (name: string) => {
                                const cur = [...getInsts(typeKey)];
                                const prev = (cur[instIdx].succSubSelected as string[]) || [];
                                cur[instIdx] = { ...cur[instIdx], succSubSelected: prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name] };
                                setInsts(typeKey, cur);
                              };

                              const updateOther = (slot: 1 | 2, field: string, value: string) => {
                                const key = slot === 1 ? 'succSubOther1' : 'succSubOther2';
                                const cur = [...getInsts(typeKey)];
                                const prev = (cur[instIdx][key] as Record<string,string>) || {};
                                cur[instIdx] = { ...cur[instIdx], [key]: { ...prev, [field]: value } };
                                setInsts(typeKey, cur);
                              };

                              const contactFields = [
                                { key: 'name', label: 'Name', placeholder: 'Full name', type: 'text' },
                                { key: 'city', label: 'City', placeholder: 'City', type: 'text' },
                                { key: 'province', label: 'Province', placeholder: 'Province', type: 'text' },
                                { key: 'country', label: 'Country', placeholder: 'Country', type: 'text' },
                                { key: 'phone', label: 'Phone', placeholder: 'Phone number', type: 'tel' },
                                { key: 'email', label: 'Email', placeholder: 'Email address', type: 'email' },
                              ];

                              const inputClass = 'w-full px-2 py-1.5 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';

                              return (
                                <div className="pt-3 border-t border-gray-600 space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Have you named a Successor Subscriber (the person(s) who would oversee the account should you{andCoSubscriber} pass away)?
                                    </label>
                                    <div className="flex flex-wrap gap-4">
                                      {(['yes', 'no', 'not_sure'] as const).map(opt => (
                                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                          <input type="radio" name={`succsub-${typeKey}-${instIdx}`} value={opt}
                                            checked={hasSuccSub === opt}
                                            onChange={() => {
                                              const cur = [...getInsts(typeKey)];
                                              cur[instIdx] = { ...cur[instIdx], hasSuccessorSubscriber: opt, succSubSelected: [], succSubOther1Active: '', succSubOther2Active: '', succSubOther1: {}, succSubOther2: {}, succSubOtherRelationship: '' };
                                              setInsts(typeKey, cur);
                                            }}
                                            className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                          <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : "I'm not sure"}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {hasSuccSub === 'yes' && (() => {
                                    // Compute total selected count and display names for relationship question
                                    const other1DisplayName = other1Active ? (other1.name?.trim() || 'Other (1)') : null;
                                    const other2DisplayName = other2Active ? (other2.name?.trim() || 'Other (2)') : null;
                                    const allSelectedNames: string[] = [
                                      ...succSubSelected,
                                      ...(other1DisplayName ? [other1DisplayName] : []),
                                      ...(other2DisplayName ? [other2DisplayName] : []),
                                    ];
                                    const totalSelected = allSelectedNames.length;
                                    const atMax = totalSelected >= 2;
                                    const canAddOther = !other1Active && !atMax;

                                    return (
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                          Select Successor Subscriber(s): <span className="text-gray-400 font-normal">(maximum 2)</span>
                                        </label>

                                        {adultKnownOptions.map(name => {
                                          const isChecked = succSubSelected.includes(name);
                                          const isDisabled = atMax && !isChecked;
                                          return (
                                            <label key={name} className={`flex items-center gap-3 ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                              <input type="checkbox" checked={isChecked} disabled={isDisabled}
                                                onChange={() => !isDisabled && toggleKnownSuccSub(name)}
                                                className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                              <span className="text-white text-sm">{name}</span>
                                            </label>
                                          );
                                        })}

                                        {/* Other — checkbox only shown when not already at max or already active */}
                                        {(canAddOther || other1Active) && (
                                          <label className={`flex items-center gap-3 ${!other1Active && atMax ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <input type="checkbox" checked={other1Active} disabled={!other1Active && atMax}
                                              onChange={() => {
                                                const cur = [...getInsts(typeKey)];
                                                const nowActive = !other1Active;
                                                cur[instIdx] = { ...cur[instIdx], succSubOther1Active: nowActive ? 'yes' : '', succSubOther1: {}, succSubOther2Active: '', succSubOther2: {}, succSubOtherRelationship: '' };
                                                setInsts(typeKey, cur);
                                              }}
                                              className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                            <span className="text-white text-sm">Other</span>
                                          </label>
                                        )}

                                        {other1Active && (
                                          <div className="pl-7 space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                              {contactFields.map(f => (
                                                <div key={f.key}>
                                                  <label className="block text-xs text-gray-400 mb-1">{f.label}:</label>
                                                  <input type={f.type} value={other1[f.key] || ''} onChange={e => updateOther(1, f.key, e.target.value)} placeholder={f.placeholder} className={inputClass} />
                                                </div>
                                              ))}
                                            </div>

                                            {/* Second other — only available if fewer than 2 total are selected */}
                                            {(other2Active || !atMax || other2Active) && (
                                              <label className={`flex items-center gap-3 ${!other2Active && atMax ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <input type="checkbox" checked={other2Active} disabled={!other2Active && atMax}
                                                  onChange={() => {
                                                    const cur = [...getInsts(typeKey)];
                                                    const nowActive = !other2Active;
                                                    cur[instIdx] = { ...cur[instIdx], succSubOther2Active: nowActive ? 'yes' : '', succSubOther2: {}, succSubOtherRelationship: '' };
                                                    setInsts(typeKey, cur);
                                                  }}
                                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2" />
                                                <span className="text-white text-sm">Add a second person</span>
                                              </label>
                                            )}

                                            {other2Active && (
                                              <div className="pl-7 space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                  {contactFields.map(f => (
                                                    <div key={f.key}>
                                                      <label className="block text-xs text-gray-400 mb-1">{f.label}:</label>
                                                      <input type={f.type} value={other2[f.key] || ''} onChange={e => updateOther(2, f.key, e.target.value)} placeholder={f.placeholder} className={inputClass} />
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Relationship question — shown whenever exactly 2 people are selected */}
                                        {totalSelected === 2 && (
                                          <div className="pt-2">
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                              What is the relationship between {allSelectedNames[0]} and {allSelectedNames[1]}?
                                            </label>
                                            <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g. siblings, spouses, friends</p>
                                            <input type="text" value={otherRelationship}
                                              onChange={e => updateInstField(typeKey, instIdx, 'succSubOtherRelationship', e.target.value)}
                                              placeholder=""
                                              className={inputClass} />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {(hasSuccSub === 'no' || hasSuccSub === 'not_sure') && (
                                    <div className="flex items-start gap-2 p-3 bg-amber-900/30 border border-amber-600/40 rounded-lg">
                                      <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                      <p className="text-amber-300 text-xs">Naming a Successor Subscriber is recommended. This will be flagged as an action item in your estate planning summary.</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div className="mt-6 space-y-6">
                      <div className="pb-2 border-b border-gray-600">
                        <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Registered Accounts</h4>
                      </div>

                      {REGISTERED_ACCOUNT_TYPES.map(({ key, label }) => {
                        const decision = accountDecisions[key] || (selectedTypes.includes(key) ? 'yes' : undefined);
                        const insts = getInsts(key);
                        return (
                          <div key={key} className="space-y-3 pb-4 border-b border-gray-700 last:border-0 last:pb-0">
                            <div>
                              <p className="text-sm font-medium text-gray-200 mb-2">Do you have a {label}?</p>
                              <div className="flex gap-4">
                                {(['yes', 'no'] as const).map(opt => (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`has-account-${key}`} value={opt}
                                      checked={decision === opt}
                                      onChange={() => setAccountDecision(key, opt)}
                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                    <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : 'No'}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {decision === 'yes' && (
                            <div className="p-4 bg-gray-700 rounded-lg space-y-4">
                            <h5 className="text-sm font-semibold text-white">{label}</h5>
                            {insts.map((inst, instIdx) => {
                              const instLabel = (inst.institution as string) || '';

                              const CAMERON_SMITH_INFO = {
                                firm: 'Clarify Wealth Ltd.',
                                name: 'Cameron Smith',
                                phone: '647-448-5963',
                                email: 'cameron.smith@ipcsecurities.com',
                                website: 'www.clarifywealth.ca',
                              };
                              const renderAdvisorQuestion = () => {
                                const registryAdvisors = getFinancialAdvisors(allAnswers || new Map());
                                type AdvisorContact = { id: string; firm: string; name: string; phone: string; email: string; website: string };
                                const advisorOptions: AdvisorContact[] = registryAdvisors.map(a => ({
                                  id: a.id,
                                  name: a.name,
                                  firm: a.firm,
                                  phone: a.phone,
                                  email: a.email,
                                  website: a.website,
                                }));

                                const dropdownVal = instLabel;
                                const isOther = dropdownVal === '__other__';
                                const selectAdvisor = (name: string) => {
                                  const contact = advisorOptions.find(a => a.name === name);
                                  const cur = [...getInsts(key)];
                                  cur[instIdx] = { ...cur[instIdx], institution: name, advisorFirm: contact?.firm || '', advisorPhone: contact?.phone || '', advisorEmail: contact?.email || '', advisorWebsite: contact?.website || '' };
                                  setInsts(key, cur);
                                };
                                const updateOther = (field: string, val: unknown) => {
                                  const cur = [...getInsts(key)];
                                  cur[instIdx] = { ...cur[instIdx], [field]: val };
                                  setInsts(key, cur);
                                };
                                const otherServices = (inst.otherServices as string[]) || [];
                                const fpServiceOptions = [
                                  { value: 'investments', label: 'Investments' },
                                  { value: 'retirement_planning', label: 'Retirement planning' },
                                  { value: 'insurance', label: 'Insurance' },
                                  { value: 'estate_planning', label: 'Estate planning' },
                                  { value: 'tax_planning', label: 'Tax planning' },
                                  { value: 'cash_flow', label: 'Cash flow' },
                                  { value: 'business_planning', label: 'Business planning' },
                                  { value: 'other', label: 'Other' },
                                ];
                                const selectedAdvisor = advisorOptions.find(a => a.name === dropdownVal);

                                return (
                                  <div className="space-y-3">
                                    <select
                                      value={dropdownVal}
                                      onChange={e => {
                                        if (e.target.value === '__other__') {
                                          updateInstField(key, instIdx, 'institution', '__other__');
                                        } else {
                                          selectAdvisor(e.target.value);
                                        }
                                      }}
                                      className="w-full px-4 py-2.5 bg-gray-500 border border-gray-400 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                                    >
                                      <option value="" className="bg-gray-700">— Select an advisor —</option>
                                      {advisorOptions.map(opt => (
                                        <option key={opt.name} value={opt.name} className="bg-gray-700">{opt.firm ? `${opt.name} — ${opt.firm}` : opt.name}</option>
                                      ))}
                                      <option value="__other__" className="bg-gray-700">Other</option>
                                    </select>

                                    {selectedAdvisor && (
                                      <div className="p-3 bg-gray-600 border border-gray-500 rounded-lg space-y-1">
                                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-1">Linked Advisor Details</p>
                                        <p className="text-sm text-white"><span className="text-gray-400">Firm:</span> {selectedAdvisor.firm || '—'}</p>
                                        <p className="text-sm text-white"><span className="text-gray-400">Phone:</span> {selectedAdvisor.phone || '—'}</p>
                                        <p className="text-sm text-white"><span className="text-gray-400">Email:</span> {selectedAdvisor.email || '—'}</p>
                                        <p className="text-sm text-white"><span className="text-gray-400">Website:</span> {selectedAdvisor.website || '—'}</p>
                                      </div>
                                    )}

                                    {isOther && (
                                      <div className="mt-3 p-4 bg-gray-500 border border-gray-400 rounded-lg space-y-4">
                                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Other Financial Planner / Wealth Advisor</p>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Firm</label>
                                          <input type="text" value={(inst.otherFirm as string) || ''}
                                            onChange={e => updateOther('otherFirm', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Advisor Name</label>
                                          <input type="text" value={(inst.otherAdvisorName as string) || ''}
                                            onChange={e => updateOther('otherAdvisorName', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                                          <input type="text" value={(inst.otherPhone as string) || ''}
                                            onChange={e => updateOther('otherPhone', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                          <input type="email" value={(inst.otherEmail as string) || ''}
                                            onChange={e => updateOther('otherEmail', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Website (optional)</label>
                                          <input type="text" value={(inst.otherWebsite as string) || ''}
                                            onChange={e => updateOther('otherWebsite', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-2">What do they help you with?</label>
                                          <div className="space-y-1.5">
                                            {fpServiceOptions.map(opt => (
                                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox"
                                                  checked={otherServices.includes(opt.value)}
                                                  onChange={e => {
                                                    const next = e.target.checked ? [...otherServices, opt.value] : otherServices.filter(v => v !== opt.value);
                                                    updateOther('otherServices', next);
                                                  }}
                                                  className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500" />
                                                <span className="text-sm text-gray-200">{opt.label}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">How long have you worked together?</label>
                                          <input type="text" value={(inst.otherDuration as string) || ''}
                                            onChange={e => updateOther('otherDuration', e.target.value)}
                                            placeholder="e.g., 5 years"
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <DocumentLocationPicker
                                          label="Where do you keep your records?"
                                          value={inst.otherRecordsLocation as unknown}
                                          onChange={(val) => updateOther('otherRecordsLocation', val)}
                                        />
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-2">May we include this professional in your executor's contact list and action guide?</label>
                                          <div className="flex gap-4">
                                            {[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }].map(opt => (
                                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name={`other-include-${key}-${instIdx}`} value={opt.value}
                                                  checked={(inst.otherInclude as string) === opt.value}
                                                  onChange={() => updateOther('otherInclude', opt.value)}
                                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                                <span className="text-sm text-gray-200">{opt.label}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              };

                              return (
                                <div key={instIdx} className="p-4 bg-gray-600 rounded-lg space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Institution / Advisor {instIdx + 1}</p>
                                    {instIdx > 0 && (
                                      <button type="button"
                                        onClick={() => {
                                          const cur = [...getInsts(key)];
                                          cur.splice(instIdx);
                                          setInsts(key, cur);
                                        }}
                                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                        </svg>
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                  {renderAdvisorQuestion()}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Account Balance:</label>
                                    <div className="relative max-w-xs">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                      <input type="text" value={(inst.accountBalance as string) || ''}
                                        onChange={e => updateInstField(key, instIdx, 'accountBalance', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-7 pr-4 py-2 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                    </div>
                                  </div>
                                  {key === 'resp' && (() => {
                                    const isSoleSubscriber = (inst.isSoleSubscriber as string) || '';
                                    const additionalSubscriber = (inst.additionalSubscriber as string) || '';
                                    const prevRels = (s2['client1PreviousRelationshipsData'] as Array<Record<string,string>>) || [];
                                    const children = (s3['childrenData'] as Array<Record<string,string>>) || [];
                                    const prevNamesWithChildren = new Set(
                                      children
                                        .filter(c => c?.parentsOption === 'client1-other' && c?.otherParentName)
                                        .map(c => c.otherParentName)
                                    );
                                    const subscriberOptions: { value: string; label: string }[] = [];
                                    if (hasSpouse) subscriberOptions.push({ value: client2Name, label: `${client2Name} (current spouse / common-law partner)` });
                                    prevRels.forEach(r => {
                                      if (r?.name && prevNamesWithChildren.has(r.name)) {
                                        subscriberOptions.push({ value: r.name, label: `${r.name} (previous spouse / common-law partner)` });
                                      }
                                    });
                                    return (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-2">Are you the sole subscriber, or is there another subscriber?</label>
                                          <div className="flex flex-wrap gap-4">
                                            {[{ value: 'sole', label: 'I am the sole subscriber' }, { value: 'joint', label: 'There is another subscriber' }].map(opt => (
                                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name={`sub-${key}-${instIdx}`} value={opt.value}
                                                  checked={isSoleSubscriber === opt.value}
                                                  onChange={() => {
                                                    const cur = [...getInsts(key)];
                                                    cur[instIdx] = { ...cur[instIdx], isSoleSubscriber: opt.value, additionalSubscriber: '' };
                                                    setInsts(key, cur);
                                                  }}
                                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                                <span className="text-white text-sm">{opt.label}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                        {isSoleSubscriber === 'joint' && (
                                          <div className="pl-4 border-l-2 border-gray-500">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Who is the additional subscriber?</label>
                                            {subscriberOptions.length > 0 ? (
                                              <div className="space-y-2">
                                                {subscriberOptions.map(opt => (
                                                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name={`addsub-${key}-${instIdx}`} value={opt.value}
                                                      checked={additionalSubscriber === opt.value}
                                                      onChange={() => updateInstField(key, instIdx, 'additionalSubscriber', opt.value)}
                                                      className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                                    <span className="text-white text-sm">{opt.label}</span>
                                                  </label>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-400">No eligible co-subscribers found. An additional subscriber must be your current or a previous spouse or common-law partner with whom you have children.</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  {renderBeneficiarySection(key, instIdx, inst)}
                                </div>
                              );
                            })}
                            <button type="button" onClick={() => { const insts2 = [...getInsts(key), { institution: '' }]; setInsts(key, insts2); }}
                              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                              <span>+</span><span>Add Additional {label}</span>
                            </button>
                            </div>
                            )}
                          </div>
                        );
                      })}

                      <div className="pb-2 border-b border-gray-600">
                        <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Non-Registered Account</h4>
                      </div>
                      <div className="space-y-3 pb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-200 mb-2">Do you have a non-registered (taxable) account?</p>
                          <div className="flex gap-4">
                            {(['yes', 'no'] as const).map(opt => (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="has-non-registered-account" value={opt}
                                  checked={(answers['client1HasNonRegisteredAccount'] as string) === opt}
                                  onChange={() => {
                                    onAnswerChange('client1HasNonRegisteredAccount', opt);
                                    if (opt === 'no') {
                                      onAnswerChange('client1NonRegisteredAccountData', []);
                                    } else {
                                      const existing = (answers['client1NonRegisteredAccountData'] as Array<Record<string, unknown>>) || [];
                                      if (existing.length === 0) onAnswerChange('client1NonRegisteredAccountData', [{ institution: '' }]);
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                <span className="text-white text-sm">{opt === 'yes' ? 'Yes' : 'No'}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {(answers['client1HasNonRegisteredAccount'] as string) === 'yes' && (
                          <div className="p-4 bg-gray-700 rounded-lg space-y-4">
                            <h5 className="text-sm font-semibold text-white">Non-Registered (Taxable) Account</h5>
                            {(() => {
                              const rawNrData = (answers['client1NonRegisteredAccountData'] as Array<Record<string, unknown>>) || [];
                              const nrData = rawNrData.length === 0 ? [{ institution: '' }] : rawNrData;
                              const setNrInsts = (insts: Array<Record<string, unknown>>) => onAnswerChange('client1NonRegisteredAccountData', insts);
                              const updateNrField = (idx: number, field: string, value: unknown) => {
                                const insts = [...nrData];
                                insts[idx] = { ...insts[idx], [field]: value };
                                setNrInsts(insts);
                              };
                              const CAMERON_SMITH_INFO = {
                                firm: 'Clarify Wealth Ltd.',
                                name: 'Cameron Smith',
                                phone: '647-448-5963',
                                email: 'cameron.smith@ipcsecurities.com',
                                website: 'www.clarifywealth.ca',
                              };
                              const renderAdvisorQuestion = (instIdx: number, inst: Record<string, unknown>) => {
                                const registryAdvisors = getFinancialAdvisors(allAnswers || new Map());
                                type AdvisorContact = { firm: string; name: string; phone: string; email: string; website: string };
                                const advisorOptions: AdvisorContact[] = registryAdvisors.map(a => ({
                                  name: a.name,
                                  firm: a.firm,
                                  phone: a.phone,
                                  email: a.email,
                                  website: a.website,
                                }));

                                const dropdownVal = (inst.institution as string) || '';
                                const isOther = dropdownVal === '__other__';
                                const selectAdvisor = (name: string) => {
                                  const contact = advisorOptions.find(a => a.name === name);
                                  const cur = [...nrData];
                                  cur[instIdx] = { ...cur[instIdx], institution: name, advisorFirm: contact?.firm || '', advisorPhone: contact?.phone || '', advisorEmail: contact?.email || '', advisorWebsite: contact?.website || '' };
                                  setNrInsts(cur);
                                };
                                const updateOther = (field: string, val: unknown) => {
                                  const cur = [...nrData];
                                  cur[instIdx] = { ...cur[instIdx], [field]: val };
                                  setNrInsts(cur);
                                };
                                const otherServices = (inst.otherServices as string[]) || [];
                                const fpServiceOptions = [
                                  { value: 'investments', label: 'Investments' },
                                  { value: 'retirement_planning', label: 'Retirement planning' },
                                  { value: 'insurance', label: 'Insurance' },
                                  { value: 'estate_planning', label: 'Estate planning' },
                                  { value: 'tax_planning', label: 'Tax planning' },
                                  { value: 'cash_flow', label: 'Cash flow' },
                                  { value: 'business_planning', label: 'Business planning' },
                                  { value: 'other', label: 'Other' },
                                ];
                                const selectedAdvisor = advisorOptions.find(a => a.name === dropdownVal);

                                return (
                                  <div className="space-y-3">
                                    <select
                                      value={dropdownVal}
                                      onChange={e => {
                                        if (e.target.value === '__other__') {
                                          updateNrField(instIdx, 'institution', '__other__');
                                        } else {
                                          selectAdvisor(e.target.value);
                                        }
                                      }}
                                      className="w-full px-4 py-2.5 bg-gray-500 border border-gray-400 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                                    >
                                      <option value="" className="bg-gray-700">— Select an advisor —</option>
                                      {advisorOptions.map(opt => (
                                        <option key={opt.name} value={opt.name} className="bg-gray-700">{opt.firm ? `${opt.name} — ${opt.firm}` : opt.name}</option>
                                      ))}
                                      <option value="__other__" className="bg-gray-700">Other</option>
                                    </select>

                                    {selectedAdvisor && (
                                      <div className="p-3 bg-gray-600 border border-gray-500 rounded-lg space-y-1">
                                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-1">Linked Advisor Details</p>
                                        <p className="text-sm text-white"><span className="text-gray-400">Firm:</span> {selectedAdvisor.firm || '—'}</p>
                                        <p className="text-sm text-white"><span className="text-gray-400">Phone:</span> {selectedAdvisor.phone || '—'}</p>
                                        <p className="text-sm text-white"><span className="text-gray-400">Email:</span> {selectedAdvisor.email || '—'}</p>
                                        <p className="text-sm text-white"><span className="text-gray-400">Website:</span> {selectedAdvisor.website || '—'}</p>
                                      </div>
                                    )}

                                    {isOther && (
                                      <div className="mt-3 p-4 bg-gray-500 border border-gray-400 rounded-lg space-y-4">
                                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Other Financial Planner / Wealth Advisor</p>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Firm</label>
                                          <input type="text" value={(inst.otherFirm as string) || ''}
                                            onChange={e => updateOther('otherFirm', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Advisor Name</label>
                                          <input type="text" value={(inst.otherAdvisorName as string) || ''}
                                            onChange={e => updateOther('otherAdvisorName', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                                          <input type="text" value={(inst.otherPhone as string) || ''}
                                            onChange={e => updateOther('otherPhone', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                          <input type="email" value={(inst.otherEmail as string) || ''}
                                            onChange={e => updateOther('otherEmail', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">Website (optional)</label>
                                          <input type="text" value={(inst.otherWebsite as string) || ''}
                                            onChange={e => updateOther('otherWebsite', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-2">What do they help you with?</label>
                                          <div className="space-y-1.5">
                                            {fpServiceOptions.map(opt => (
                                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox"
                                                  checked={otherServices.includes(opt.value)}
                                                  onChange={e => {
                                                    const next = e.target.checked ? [...otherServices, opt.value] : otherServices.filter(v => v !== opt.value);
                                                    updateOther('otherServices', next);
                                                  }}
                                                  className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500" />
                                                <span className="text-sm text-gray-200">{opt.label}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-1">How long have you worked together?</label>
                                          <input type="text" value={(inst.otherDuration as string) || ''}
                                            onChange={e => updateOther('otherDuration', e.target.value)}
                                            placeholder="e.g., 5 years"
                                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        </div>
                                        <DocumentLocationPicker
                                          label="Where do you keep your records?"
                                          value={inst.otherRecordsLocation as unknown}
                                          onChange={(val) => updateOther('otherRecordsLocation', val)}
                                        />
                                        <div>
                                          <label className="block text-sm font-medium text-gray-300 mb-2">May we include this professional in your executor's contact list and action guide?</label>
                                          <div className="flex gap-4">
                                            {[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }].map(opt => (
                                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name={`nr-other-include-${instIdx}`} value={opt.value}
                                                  checked={(inst.otherInclude as string) === opt.value}
                                                  onChange={() => updateOther('otherInclude', opt.value)}
                                                  className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                                                <span className="text-sm text-gray-200">{opt.label}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              };

                              return (
                                <>
                                  {nrData.map((inst, instIdx) => (
                                    <div key={instIdx} className="p-4 bg-gray-600 rounded-lg space-y-3">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Institution / Advisor {instIdx + 1}</p>
                                        {instIdx > 0 && (
                                          <button type="button"
                                            onClick={() => {
                                              const cur = [...nrData];
                                              cur.splice(instIdx, 1);
                                              setNrInsts(cur);
                                            }}
                                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                            </svg>
                                            Remove
                                          </button>
                                        )}
                                      </div>
                                      {renderAdvisorQuestion(instIdx, inst)}
                                      <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Account Balance:</label>
                                        <div className="relative max-w-xs">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                          <input type="text" value={(inst.accountBalance as string) || ''}
                                            onChange={e => updateNrField(instIdx, 'accountBalance', e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-7 pr-4 py-2 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Book Value:</label>
                                        <div className="relative max-w-xs">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                          <input type="text" value={(inst.bookValue as string) || ''}
                                            onChange={e => updateNrField(instIdx, 'bookValue', e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-7 pr-4 py-2 bg-gray-500 border border-gray-400 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <button type="button" onClick={() => setNrInsts([...nrData, { institution: '' }])}
                                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                    <span>+</span><span>Add Additional Non-registered (taxable) account</span>
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            );
          })()}

          {step.sectionId === 'previousRelationships' && (client1PrevRelCount > 0 || client2PrevRelCount > 0) && (() => {
            const basicAnswers = allAnswers?.get('aboutYou') || {};
            const client1Name = basicAnswers['fullName'] as string || 'Client 1';
            const client2Name = basicAnswers['spouseName'] as string || 'Client 2';

            return (
              <div className="space-y-8">
                {client1PrevRelCount > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
                      {client1Name}'s Previous Relationships
                    </h3>
                    {Array.from({ length: client1PrevRelCount }).map((_, index) => (
                      <div key={`client1-prev-${index}`} className="border border-gray-600 rounded-lg p-6 bg-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4">Previous Relationship {index + 1}</h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              What is the name of the person you previously had a marriage or common law relationship with? *
                            </label>
                            <input
                              type="text"
                              value={client1PreviousRelationshipsData[index]?.name || ''}
                              onChange={(e) => handleClient1PrevRelChange(index, 'name', e.target.value)}
                              placeholder="Enter name"
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Date of Separation
                            </label>
                            <input
                              type="date"
                              value={client1PreviousRelationshipsData[index]?.dateOfSeparation || ''}
                              onChange={(e) => handleClient1PrevRelChange(index, 'dateOfSeparation', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Date of Divorce
                            </label>
                            <input
                              type="date"
                              value={client1PreviousRelationshipsData[index]?.dateOfDivorce || ''}
                              onChange={(e) => handleClient1PrevRelChange(index, 'dateOfDivorce', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Other Information
                            </label>
                            <textarea
                              value={client1PreviousRelationshipsData[index]?.otherInfo || ''}
                              onChange={(e) => handleClient1PrevRelChange(index, 'otherInfo', e.target.value)}
                              placeholder="Enter any other relevant information"
                              rows={4}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Are you paying or receiving spousal support?
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`client1-spousal-support-${index}`}
                                  value="yes"
                                  checked={client1PreviousRelationshipsData[index]?.hasSpousalSupport === 'yes'}
                                  onChange={(e) => handleClient1PrevRelChange(index, 'hasSpousalSupport', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">Yes</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`client1-spousal-support-${index}`}
                                  value="no"
                                  checked={client1PreviousRelationshipsData[index]?.hasSpousalSupport === 'no'}
                                  onChange={(e) => handleClient1PrevRelChange(index, 'hasSpousalSupport', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">No</span>
                              </label>
                            </div>
                          </div>

                          {client1PreviousRelationshipsData[index]?.hasSpousalSupport === 'yes' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Are you paying or receiving spousal support? *
                                </label>
                                <div className="flex gap-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`client1-support-type-${index}`}
                                      value="paying"
                                      checked={client1PreviousRelationshipsData[index]?.spousalSupportType === 'paying'}
                                      onChange={(e) => handleClient1PrevRelChange(index, 'spousalSupportType', e.target.value)}
                                      className="mr-2"
                                    />
                                    <span className="text-gray-300">Paying</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`client1-support-type-${index}`}
                                      value="receiving"
                                      checked={client1PreviousRelationshipsData[index]?.spousalSupportType === 'receiving'}
                                      onChange={(e) => handleClient1PrevRelChange(index, 'spousalSupportType', e.target.value)}
                                      className="mr-2"
                                    />
                                    <span className="text-gray-300">Receiving</span>
                                  </label>
                                </div>
                              </div>

                              <DocumentLocationPicker
                                label="Where is the document outlining this arrangement located?"
                                value={client1PreviousRelationshipsData[index]?.supportDocumentLocation as unknown}
                                onChange={(val) => handleClient1PrevRelChange(index, 'supportDocumentLocation', val)}
                                placeholder="Enter document location"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {client2PrevRelCount > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
                      {client2Name}'s Previous Relationships
                    </h3>
                    {Array.from({ length: client2PrevRelCount }).map((_, index) => (
                      <div key={`client2-prev-${index}`} className="border border-gray-600 rounded-lg p-6 bg-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4">Previous Relationship {index + 1}</h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              What is the name of the person they previously had a marriage or common law relationship with? *
                            </label>
                            <input
                              type="text"
                              value={client2PreviousRelationshipsData[index]?.name || ''}
                              onChange={(e) => handleClient2PrevRelChange(index, 'name', e.target.value)}
                              placeholder="Enter name"
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Date of Separation
                            </label>
                            <input
                              type="date"
                              value={client2PreviousRelationshipsData[index]?.dateOfSeparation || ''}
                              onChange={(e) => handleClient2PrevRelChange(index, 'dateOfSeparation', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Date of Divorce
                            </label>
                            <input
                              type="date"
                              value={client2PreviousRelationshipsData[index]?.dateOfDivorce || ''}
                              onChange={(e) => handleClient2PrevRelChange(index, 'dateOfDivorce', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Other Information
                            </label>
                            <textarea
                              value={client2PreviousRelationshipsData[index]?.otherInfo || ''}
                              onChange={(e) => handleClient2PrevRelChange(index, 'otherInfo', e.target.value)}
                              placeholder="Enter any other relevant information"
                              rows={4}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Are they paying or receiving spousal support?
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`client2-spousal-support-${index}`}
                                  value="yes"
                                  checked={client2PreviousRelationshipsData[index]?.hasSpousalSupport === 'yes'}
                                  onChange={(e) => handleClient2PrevRelChange(index, 'hasSpousalSupport', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">Yes</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`client2-spousal-support-${index}`}
                                  value="no"
                                  checked={client2PreviousRelationshipsData[index]?.hasSpousalSupport === 'no'}
                                  onChange={(e) => handleClient2PrevRelChange(index, 'hasSpousalSupport', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">No</span>
                              </label>
                            </div>
                          </div>

                          {client2PreviousRelationshipsData[index]?.hasSpousalSupport === 'yes' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Are they paying or receiving spousal support? *
                                </label>
                                <div className="flex gap-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`client2-support-type-${index}`}
                                      value="paying"
                                      checked={client2PreviousRelationshipsData[index]?.spousalSupportType === 'paying'}
                                      onChange={(e) => handleClient2PrevRelChange(index, 'spousalSupportType', e.target.value)}
                                      className="mr-2"
                                    />
                                    <span className="text-gray-300">Paying</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`client2-support-type-${index}`}
                                      value="receiving"
                                      checked={client2PreviousRelationshipsData[index]?.spousalSupportType === 'receiving'}
                                      onChange={(e) => handleClient2PrevRelChange(index, 'spousalSupportType', e.target.value)}
                                      className="mr-2"
                                    />
                                    <span className="text-gray-300">Receiving</span>
                                  </label>
                                </div>
                              </div>

                              <DocumentLocationPicker
                                label="Where is the document outlining this arrangement located?"
                                value={client2PreviousRelationshipsData[index]?.supportDocumentLocation as unknown}
                                onChange={(val) => handleClient2PrevRelChange(index, 'supportDocumentLocation', val)}
                                placeholder="Enter document location"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {step.sectionId === 'children' && childCount > 0 && (() => {
            const basicAnswers = allAnswers?.get('aboutYou') || {};
            const client1Name = basicAnswers['fullName'] as string || 'Client 1';
            const client2Name = basicAnswers['spouseName'] as string || 'Client 2';
            const hasSpouse = (basicAnswers['maritalStatus'] === 'married' || basicAnswers['maritalStatus'] === 'common_law');

            return (
              <div className="space-y-8">
                {Array.from({ length: childCount }).map((_, index) => (
                  <div key={index} className="border border-gray-600 rounded-lg p-6 bg-gray-700">
                    <h3 className="text-xl font-bold text-white mb-6">
                      {childrenData[index]?.name ? childrenData[index].name : `Child ${index + 1}`}
                    </h3>

                    <div className="space-y-4">
                      <div className="pb-2 border-b border-gray-500 mb-2">
                        <h4 className="text-base font-semibold text-blue-400">Guardian Information</h4>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Child's Full Name *
                        </label>
                        <input
                          type="text"
                          value={childrenData[index]?.name || ''}
                          onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                          placeholder="Enter full name"
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Preferred Name/Nickname:
                        </label>
                        <input
                          type="text"
                          value={childrenData[index]?.nickname || ''}
                          onChange={(e) => handleChildChange(index, 'nickname', e.target.value)}
                          placeholder="Enter preferred name or nickname"
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Child's parents names?
                        </label>
                        <select
                          value={childrenData[index]?.parentsOption || ''}
                          onChange={(e) => handleChildChange(index, 'parentsOption', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select parents</option>
                          {hasSpouse && (
                            <option value="both">{client1Name} and {client2Name}</option>
                          )}
                          <option value="client1-other">{client1Name} and other</option>
                          {hasSpouse && (
                            <option value="client2-other">{client2Name} and other</option>
                          )}
                        </select>
                      </div>

                      {(childrenData[index]?.parentsOption === 'client1-other' || childrenData[index]?.parentsOption === 'client2-other') && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Other parent's name:
                            </label>
                            <input
                              type="text"
                              value={childrenData[index]?.otherParentName || ''}
                              onChange={(e) => handleChildChange(index, 'otherParentName', e.target.value)}
                              placeholder="Enter other parent's name"
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <label className="flex items-center gap-2 mt-3 cursor-pointer w-fit">
                              <input
                                type="checkbox"
                                checked={childrenData[index]?.otherParentDeceased === 'yes'}
                                onChange={(e) => handleChildChange(index, 'otherParentDeceased', e.target.checked ? 'yes' : 'no')}
                                className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-700"
                              />
                              <span className="text-sm text-gray-300">This person is deceased</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Are you paying or receiving child support payments related to this child?
                            </label>
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`childSupport-${index}`}
                                  value="receiving"
                                  checked={childrenData[index]?.childSupportStatus === 'receiving'}
                                  onChange={(e) => handleChildChange(index, 'childSupportStatus', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">Receiving Child Support Payments</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`childSupport-${index}`}
                                  value="paying"
                                  checked={childrenData[index]?.childSupportStatus === 'paying'}
                                  onChange={(e) => handleChildChange(index, 'childSupportStatus', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">Paying Child Support Payments</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`childSupport-${index}`}
                                  value="neither"
                                  checked={childrenData[index]?.childSupportStatus === 'neither'}
                                  onChange={(e) => handleChildChange(index, 'childSupportStatus', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">Neither paying nor receiving child support payments</span>
                              </label>
                            </div>
                          </div>

                          {(childrenData[index]?.childSupportStatus === 'receiving' || childrenData[index]?.childSupportStatus === 'paying') && (
                            <DocumentLocationPicker
                              label="Where is/are the supporting document related to Child Support Payments located?"
                              value={childrenData[index]?.childSupportDocLocation as unknown}
                              onChange={(val) => handleChildChange(index, 'childSupportDocLocation', val)}
                              placeholder="Enter document location"
                            />
                          )}
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Date of Birth *
                        </label>
                      <input
                        type="date"
                        value={childrenData[index]?.dateOfBirth || ''}
                        onChange={(e) => handleChildChange(index, 'dateOfBirth', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                      <h4 className="text-base font-semibold text-blue-400">Residency &amp; Family Status</h4>
                    </div>

                    <div className="mt-2 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Are they a resident of Canada?
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`canadianResident-${index}`}
                              value="yes"
                              checked={childrenData[index]?.canadianResident === 'yes'}
                              onChange={(e) => handleChildChange(index, 'canadianResident', e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`canadianResident-${index}`}
                              value="no"
                              checked={childrenData[index]?.canadianResident === 'no'}
                              onChange={(e) => handleChildChange(index, 'canadianResident', e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-gray-300">No</span>
                          </label>
                        </div>
                      </div>

                      {childrenData[index]?.canadianResident === 'yes' && (
                        <>
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Province/Territory of Residence
                            </label>
                            <select
                              value={childrenData[index]?.provinceTerritory || ''}
                              onChange={(e) => handleChildChange(index, 'provinceTerritory', e.target.value)}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select province/territory</option>
                              <option value="Alberta">Alberta</option>
                              <option value="British Columbia">British Columbia</option>
                              <option value="Manitoba">Manitoba</option>
                              <option value="New Brunswick">New Brunswick</option>
                              <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                              <option value="Northwest Territories">Northwest Territories</option>
                              <option value="Nova Scotia">Nova Scotia</option>
                              <option value="Nunavut">Nunavut</option>
                              <option value="Ontario">Ontario</option>
                              <option value="Prince Edward Island">Prince Edward Island</option>
                              <option value="Quebec">Quebec</option>
                              <option value="Saskatchewan">Saskatchewan</option>
                              <option value="Yukon">Yukon</option>
                            </select>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              City of residence:
                            </label>
                            <input
                              type="text"
                              value={childrenData[index]?.cityOfResidence || ''}
                              onChange={(e) => handleChildChange(index, 'cityOfResidence', e.target.value)}
                              placeholder="Enter city of residence"
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                        </>
                      )}

                      {childrenData[index]?.canadianResident === 'no' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            In what country is this child a resident of?
                          </label>
                          <input
                            type="text"
                            value={childrenData[index]?.countryOfResidence || ''}
                            onChange={(e) => handleChildChange(index, 'countryOfResidence', e.target.value)}
                            placeholder="Enter country of residence"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      {childrenData[index]?.canadianResident === 'no' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            City of residence:
                          </label>
                          <input
                            type="text"
                            value={childrenData[index]?.cityOfResidence || ''}
                            onChange={(e) => handleChildChange(index, 'cityOfResidence', e.target.value)}
                            placeholder="Enter city of residence"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Do they have a spouse or common law partner?
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`hasSpouse-${index}`}
                              value="yes"
                              checked={childrenData[index]?.hasSpouse === 'yes'}
                              onChange={(e) => handleChildChange(index, 'hasSpouse', e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`hasSpouse-${index}`}
                              value="no"
                              checked={childrenData[index]?.hasSpouse === 'no'}
                              onChange={(e) => handleChildChange(index, 'hasSpouse', e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-gray-300">No</span>
                          </label>
                        </div>
                      </div>

                      {childrenData[index]?.hasSpouse === 'yes' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Enter the spouse or common law partner's name:
                          </label>
                          <input
                            type="text"
                            value={childrenData[index]?.spouseName || ''}
                            onChange={(e) => handleChildChange(index, 'spouseName', e.target.value)}
                            placeholder="Enter spouse/partner's name"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Does {childrenData[index]?.name || 'this child'} have any children?
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`hasChildren-${index}`}
                              value="yes"
                              checked={childrenData[index]?.hasChildren === 'yes'}
                              onChange={(e) => handleChildChange(index, 'hasChildren', e.target.value)}
                              className="mr-2"
                            />
                            <span className="text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`hasChildren-${index}`}
                              value="no"
                              checked={childrenData[index]?.hasChildren === 'no'}
                              onChange={(e) => {
                                handleChildChange(index, 'hasChildren', e.target.value);
                                const count = parseInt(childrenData[index]?.numberOfGrandchildren || '0');
                                handleChildChange(index, 'numberOfGrandchildren', '');
                                for (let i = 1; i <= Math.max(count, 20); i++) {
                                  handleChildChange(index, `grandchild${i}Name`, '');
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-gray-300">No</span>
                          </label>
                        </div>
                      </div>

                      {childrenData[index]?.hasChildren === 'yes' && (
                        <div className="space-y-4 mt-4 p-4 bg-gray-600 rounded">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              How many?
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={childrenData[index]?.numberOfGrandchildren || ''}
                              onChange={(e) => handleChildChange(index, 'numberOfGrandchildren', e.target.value)}
                              placeholder="Enter number of grandchildren"
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {childrenData[index]?.numberOfGrandchildren && parseInt(childrenData[index]?.numberOfGrandchildren || '0') > 0 && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-gray-300">Grandchildren's Names:</p>
                              {Array.from({ length: Math.min(parseInt(childrenData[index]?.numberOfGrandchildren || '0'), 20) }).map((_, gcIndex) => (
                                <div key={gcIndex} className="space-y-2">
                                  <label className="block text-xs text-gray-400 mb-1">
                                    Grandchild {gcIndex + 1}:
                                  </label>
                                  <input
                                    type="text"
                                    value={childrenData[index]?.[`grandchild${gcIndex + 1}Name`] || ''}
                                    onChange={(e) => handleChildChange(index, `grandchild${gcIndex + 1}Name`, e.target.value)}
                                    placeholder={`Enter grandchild ${gcIndex + 1}'s name`}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <label className="block text-xs text-gray-400 mb-1">
                                    {childrenData[index]?.[`grandchild${gcIndex + 1}Name`]
                                      ? `${childrenData[index][`grandchild${gcIndex + 1}Name`]}'s other parent's name:`
                                      : `Grandchild ${gcIndex + 1}'s other parent's name:`}
                                  </label>
                                  {childrenData[index]?.spouseName && (
                                    <div className="mb-2">
                                      <button
                                        type="button"
                                        onClick={() => handleChildChange(index, `grandchild${gcIndex + 1}OtherParent`, childrenData[index]!.spouseName!)}
                                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                                      >
                                        Use {childrenData[index]?.nickname || childrenData[index]?.name || 'this child'}'s partner: {childrenData[index]?.spouseName}
                                      </button>
                                    </div>
                                  )}
                                  <input
                                    type="text"
                                    value={childrenData[index]?.[`grandchild${gcIndex + 1}OtherParent`] || ''}
                                    onChange={(e) => handleChildChange(index, `grandchild${gcIndex + 1}OtherParent`, e.target.value)}
                                    placeholder="Enter other parent's name"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Does {childrenData[index]?.nickname || childrenData[index]?.name || 'this child'} have a disability, medical condition, or support need that may affect their long-term care or independence?
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`disabled-${index}`}
                            value="yes"
                            checked={childrenData[index]?.disabled === 'yes'}
                            onChange={(e) => handleChildChange(index, 'disabled', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-gray-300">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`disabled-${index}`}
                            value="no"
                            checked={childrenData[index]?.disabled === 'no'}
                            onChange={(e) => handleChildChange(index, 'disabled', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-gray-300">No</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`disabled-${index}`}
                            value="not_sure"
                            checked={childrenData[index]?.disabled === 'not_sure'}
                            onChange={(e) => handleChildChange(index, 'disabled', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-gray-300">We're not sure yet</span>
                        </label>
                      </div>
                    </div>

                    <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                      <h4 className="text-base font-semibold text-blue-400">Financial Independence</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Are they financially independent?
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`independent-${index}`}
                            value="yes"
                            checked={childrenData[index]?.independent === 'yes'}
                            onChange={(e) => handleChildChange(index, 'independent', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-gray-300">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`independent-${index}`}
                            value="no"
                            checked={childrenData[index]?.independent === 'no'}
                            onChange={(e) => handleChildChange(index, 'independent', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-gray-300">No</span>
                        </label>
                      </div>
                    </div>

                    {childrenData[index]?.disabled === 'not_sure' && (
                      <>
                        <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                          <h4 className="text-base font-semibold text-blue-400">Potential Future Support &amp; Independence</h4>
                        </div>
                        <p className="text-sm text-gray-300 italic mb-4">
                          That's completely okay. Many parents don't yet know what level of independence their child will have as an adult. The next few questions simply help us identify whether additional planning may be helpful in the future.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            What best describes your situation today?
                          </label>
                          <div className="flex flex-col gap-2">
                            {[
                              { value: 'expect_independent', label: "We expect they'll become fully independent." },
                              { value: 'some_support', label: "We think they'll need some extra support as they get older." },
                              { value: 'professionals_unsure', label: "Doctors or professionals aren't sure yet." },
                              { value: 'too_young', label: "They're still too young to know." },
                              { value: 'not_sure', label: "We're not sure." },
                            ].map(({ value, label }) => (
                              <label key={value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`notSureSituation-${index}`}
                                  value={value}
                                  checked={childrenData[index]?.notSureSituation === value}
                                  onChange={(e) => handleChildChange(index, 'notSureSituation', e.target.value)}
                                  className="mr-1"
                                />
                                <span className="text-gray-300 text-sm">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Are there any areas where they currently rely on adults more than most children their age? (Select all that apply)
                          </label>
                          <div className="flex flex-col gap-2">
                            {[
                              { value: 'communication', label: 'Communication' },
                              { value: 'learning', label: 'Learning' },
                              { value: 'money', label: 'Money' },
                              { value: 'safety_awareness', label: 'Safety awareness' },
                              { value: 'medical_care', label: 'Medical care' },
                              { value: 'personal_care', label: 'Personal care' },
                              { value: 'mobility', label: 'Mobility' },
                              { value: 'behaviour', label: 'Behaviour or emotional regulation' },
                              { value: 'none', label: 'None of these' },
                              { value: 'not_sure_reliance', label: "We're not sure" },
                            ].map(({ value, label }) => {
                              const current = (childrenData[index]?.notSureRelianceAreas || '').split(',').filter(Boolean);
                              const checked = current.includes(value);
                              return (
                                <label key={value} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const next = checked ? current.filter(v => v !== value) : [...current, value];
                                      handleChildChange(index, 'notSureRelianceAreas', next.join(','));
                                    }}
                                    className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-300 text-sm">{label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Thinking 10 years from now, which statement feels closest to what you expect?
                          </label>
                          <div className="flex flex-col gap-2">
                            {[
                              { value: 'fully_independent', label: "They'll likely live completely independently." },
                              { value: 'occasional_support', label: "They'll probably need occasional support." },
                              { value: 'always_support', label: "They'll probably always have someone helping them make important decisions." },
                              { value: 'dont_know', label: "We honestly don't know yet." },
                            ].map(({ value, label }) => (
                              <label key={value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`notSureFuture-${index}`}
                                  value={value}
                                  checked={childrenData[index]?.notSureFuture === value}
                                  onChange={(e) => handleChildChange(index, 'notSureFuture', e.target.value)}
                                  className="mr-1"
                                />
                                <span className="text-gray-300 text-sm">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {(childrenData[index]?.disabled === 'yes' || childrenData[index]?.disabled === 'not_sure') && (
                      <>
                        <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                          <h4 className="text-base font-semibold text-blue-400">Future Support &amp; Independence</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            What best describes the support need? (Select all that apply)
                          </label>
                          <div className="flex flex-col gap-2">
                            {[
                              { value: 'cognitive_developmental', label: 'Cognitive or developmental disability' },
                              { value: 'physical', label: 'Physical disability' },
                              { value: 'medical_condition', label: 'Medical condition' },
                              { value: 'mental_health', label: 'Mental health condition' },
                              { value: 'learning', label: 'Learning disability' },
                              { value: 'complex_care', label: 'Complex care needs' },
                              { value: 'prefer_no_label', label: 'Prefer not to label it - but planning support is needed' },
                            ].map(({ value, label }) => {
                              const current = (childrenData[index]?.supportNeedTypes || '').split(',').filter(Boolean);
                              const checked = current.includes(value);
                              return (
                                <label key={value} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const next = checked ? current.filter(v => v !== value) : [...current, value];
                                      handleChildChange(index, 'supportNeedTypes', next.join(','));
                                    }}
                                    className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-300 text-sm">{label}</span>
                                </label>
                              );
                            })}
                            <div className="mt-1">
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(childrenData[index]?.supportNeedTypes || '').split(',').includes('other')}
                                  onChange={() => {
                                    const current = (childrenData[index]?.supportNeedTypes || '').split(',').filter(Boolean);
                                    const checked = current.includes('other');
                                    const next = checked ? current.filter(v => v !== 'other') : [...current, 'other'];
                                    handleChildChange(index, 'supportNeedTypes', next.join(','));
                                    if (checked) handleChildChange(index, 'supportNeedOther', '');
                                  }}
                                  className="w-4 h-4 mt-0.5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-gray-300 text-sm">Other</span>
                              </label>
                              {(childrenData[index]?.supportNeedTypes || '').split(',').includes('other') && (
                                <input
                                  type="text"
                                  value={childrenData[index]?.supportNeedOther || ''}
                                  onChange={(e) => handleChildChange(index, 'supportNeedOther', e.target.value)}
                                  placeholder="Please describe the situation"
                                  className="mt-2 ml-6 w-full max-w-md px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Do they qualify for the Disability Tax Credit (DTC)?
                          </label>
                        <div className="flex flex-col gap-2">
                          {[
                            { value: 'yes', label: 'Yes' },
                            { value: 'no', label: 'No' },
                            { value: 'in-progress', label: 'Application is in progress' },
                            { value: 'denied', label: 'Previously denied' },
                            { value: 'not-looked', label: "I/we haven't looked into this" },
                          ].map(({ value, label }) => (
                            <label key={value} className="flex items-center">
                              <input
                                type="radio"
                                name={`disabilityTaxCredit-${index}`}
                                value={value}
                                checked={childrenData[index]?.disabilityTaxCredit === value}
                                onChange={(e) => handleChildChange(index, 'disabilityTaxCredit', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-gray-300">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {childrenData[index]?.disabilityTaxCredit === 'yes' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Location of supporting documentation (T2201 Disability Tax Credit Certificate)
                          </label>
                          <input
                            type="text"
                            value={childrenData[index]?.disabilityTaxCreditDocLocation || ''}
                            onChange={(e) => handleChildChange(index, 'disabilityTaxCreditDocLocation', e.target.value)}
                            placeholder="Enter document location"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      {childrenData[index]?.disabilityTaxCredit === 'in-progress' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            If/when the CRA approval is complete, you will be given a T2001 Disability Tax Credit Certificate, where will this document be stored?
                          </label>
                          <input
                            type="text"
                            value={childrenData[index]?.disabilityTaxCreditDocLocation || ''}
                            onChange={(e) => handleChildChange(index, 'disabilityTaxCreditDocLocation', e.target.value)}
                            placeholder="Enter planned document location"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Who helps coordinate their care today? (Select all that apply)
                        </label>
                        <div className="flex flex-col gap-2">
                          {(() => {
                            const s1 = allAnswers?.get('aboutYou') || {};
                            const pg1Name = (s1['fullName'] as string) || 'Parent / guardian 1';
                            const pg2Name = (s1['spouseName'] as string) || 'Parent / guardian 2';
                            const hasSpouse = (s1['maritalStatus'] === 'married' || s1['maritalStatus'] === 'common_law');
                            const childPo = childrenData[index]?.parentsOption || '';
                            const otherParentName = childrenData[index]?.otherParentName || '';
                            const otherParentDeceased = childrenData[index]?.otherParentDeceased === 'yes';
                            const coordOpts: { value: string; label: string }[] = [
                              ...(childPo !== 'client2-other' ? [{ value: 'parent1', label: pg1Name }] : []),
                              ...(childPo === 'client1-other' && otherParentName && !otherParentDeceased ? [{ value: 'otherparent', label: otherParentName }] : []),
                              ...(hasSpouse && childPo !== 'client1-other' ? [{ value: 'parent2', label: pg2Name }] : []),
                              ...(childPo === 'client2-other' && otherParentName && !otherParentDeceased ? [{ value: 'otherparent', label: otherParentName }] : []),
                              { value: 'sibling', label: 'Sibling' },
                              { value: 'family', label: 'Other family' },
                              { value: 'school', label: 'School team' },
                              { value: 'doctor', label: 'Doctor / therapist / support worker' },
                              { value: 'other', label: 'Other' },
                            ];
                            const current = (childrenData[index]?.careCoordinators || '').split(',').filter(Boolean);
                            return coordOpts.map(({ value, label }) => {
                              const checked = current.includes(value);
                              return (
                                <label key={value} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const next = checked ? current.filter(v => v !== value) : [...current, value];
                                      handleChildChange(index, 'careCoordinators', next.join(','));
                                    }}
                                    className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-300 text-sm">{label}</span>
                                </label>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {childrenData[index]?.careCoordinators?.split(',').includes('sibling') && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Sibling name(s)
                          </label>
                          <input
                            type="text"
                            value={childrenData[index]?.careCoordSiblingNames || ''}
                            onChange={(e) => handleChildChange(index, 'careCoordSiblingNames', e.target.value)}
                            placeholder="Enter sibling name(s)"
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      {(['family', 'school', 'doctor', 'other'] as const).map(cat => {
                        const catSelected = childrenData[index]?.careCoordinators?.split(',').includes(cat);
                        if (!catSelected) return null;
                        const catLabels: Record<string, string> = {
                          family: 'Other family member',
                          school: 'School team member',
                          doctor: 'Doctor / therapist / support worker',
                          other: 'Other contact',
                        };
                        const catLabel = catLabels[cat];
                        const countField = `careCoord_${cat}_count`;
                        const additionalField = `careCoord_${cat}_additional`;
                        const count = parseInt(childrenData[index]?.[countField] || '1');
                        const showRole = cat !== 'family';
                        return (
                          <div key={cat} className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                            <p className="text-sm font-medium text-blue-400 mb-3">{catLabel}(s)</p>
                            {Array.from({ length: count }).map((_, ci) => (
                              <div key={ci} className={ci > 0 ? 'mt-4 pt-4 border-t border-gray-600' : ''}>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-gray-400">{catLabel} {ci + 1}</p>
                                  {ci > 0 && (
                                    <button type="button" onClick={() => handleRemoveCareCoordEntry(index, cat, ci)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                      <X size={14} /> Remove
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <input type="text" value={childrenData[index]?.[`careCoord_${cat}_${ci}_name`] || ''} onChange={(e) => handleChildChange(index, `careCoord_${cat}_${ci}_name`, e.target.value)} placeholder="Name" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                  <input type="tel" value={childrenData[index]?.[`careCoord_${cat}_${ci}_phone`] || ''} onChange={(e) => handleChildChange(index, `careCoord_${cat}_${ci}_phone`, e.target.value)} placeholder="Phone" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                  <input type="email" value={childrenData[index]?.[`careCoord_${cat}_${ci}_email`] || ''} onChange={(e) => handleChildChange(index, `careCoord_${cat}_${ci}_email`, e.target.value)} placeholder="Email" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                  <input type="text" value={childrenData[index]?.[`careCoord_${cat}_${ci}_city`] || ''} onChange={(e) => handleChildChange(index, `careCoord_${cat}_${ci}_city`, e.target.value)} placeholder="City" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                  <select value={childrenData[index]?.[`careCoord_${cat}_${ci}_province`] || ''} onChange={(e) => handleChildChange(index, `careCoord_${cat}_${ci}_province`, e.target.value)} className="px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                                    <option value="">Province</option>
                                    <option value="AB">Alberta</option>
                                    <option value="BC">British Columbia</option>
                                    <option value="MB">Manitoba</option>
                                    <option value="NB">New Brunswick</option>
                                    <option value="NL">Newfoundland and Labrador</option>
                                    <option value="NS">Nova Scotia</option>
                                    <option value="NT">Northwest Territories</option>
                                    <option value="NU">Nunavut</option>
                                    <option value="ON">Ontario</option>
                                    <option value="PE">Prince Edward Island</option>
                                    <option value="QC">Quebec</option>
                                    <option value="SK">Saskatchewan</option>
                                    <option value="YT">Yukon</option>
                                  </select>
                                  {showRole && <input type="text" value={childrenData[index]?.[`careCoord_${cat}_${ci}_role`] || ''} onChange={(e) => handleChildChange(index, `careCoord_${cat}_${ci}_role`, e.target.value)} placeholder="Role in support" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:col-span-2" />}
                                </div>
                              </div>
                            ))}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {`Are there additional ${catLabel.toLowerCase()}s to add?`}
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input type="radio" name={`${countField}-additional-${index}`} value="yes" checked={childrenData[index]?.[additionalField] === 'yes'} onChange={() => { handleChildChange(index, countField, String(count + 1)); handleChildChange(index, additionalField, 'yes'); }} className="mr-2" />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="radio" name={`${countField}-additional-${index}`} value="no" checked={childrenData[index]?.[additionalField] === 'no'} onChange={() => handleChildChange(index, additionalField, 'no')} className="mr-2" />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    </>
                    )}

                    {(childrenData[index]?.disabled === 'yes' || childrenData[index]?.disabled === 'not_sure') && (
                    <>
                    <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                      <h4 className="text-base font-semibold text-blue-400">Looking Ahead to Adulthood</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        As they get older, what level of independence do you expect?
                      </label>
                      <div className="flex flex-col gap-2">
                        {[
                          { value: 'likely_independent', label: 'Likely independent as an adult' },
                          { value: 'mostly_independent', label: 'Mostly independent, with some support' },
                          { value: 'support_money', label: 'Will likely need ongoing support with money decisions' },
                          { value: 'support_health', label: 'Will likely need ongoing support with health or personal care decisions' },
                          { value: 'significant_lifelong', label: 'Will likely need significant lifelong support' },
                          { value: 'too_early', label: 'Too early to know' },
                        ].map(({ value, label }) => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`futureIndependence-${index}`}
                              value={value}
                              checked={childrenData[index]?.futureIndependenceLevel === value}
                              onChange={(e) => handleChildChange(index, 'futureIndependenceLevel', e.target.value)}
                              className="mr-1"
                            />
                            <span className="text-gray-300 text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {(() => {
                      const lvl = childrenData[index]?.futureIndependenceLevel;
                      return lvl && lvl !== 'likely_independent' && lvl !== 'too_early';
                    })() && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Do you expect they may need help with financial decisions as an adult?
                          </label>
                          <div className="flex gap-4">
                            {[
                              { value: 'yes', label: 'Yes' },
                              { value: 'no', label: 'No' },
                              { value: 'unsure', label: 'Unsure' },
                            ].map(({ value, label }) => (
                              <label key={value} className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name={`futureFinancialHelp-${index}`}
                                  value={value}
                                  checked={childrenData[index]?.futureFinancialHelp === value}
                                  onChange={(e) => handleChildChange(index, 'futureFinancialHelp', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300 text-sm">{label}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 italic mt-2">
                            Examples: Managing bank accounts, government benefits, RDSP, rent, bills, investments, signing documents.
                          </p>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Do you expect they may need help with personal or healthcare decisions as an adult?
                          </label>
                          <div className="flex gap-4">
                            {[
                              { value: 'yes', label: 'Yes' },
                              { value: 'no', label: 'No' },
                              { value: 'unsure', label: 'Unsure' },
                            ].map(({ value, label }) => (
                              <label key={value} className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name={`futurePersonalHealthHelp-${index}`}
                                  value={value}
                                  checked={childrenData[index]?.futurePersonalHealthHelp === value}
                                  onChange={(e) => handleChildChange(index, 'futurePersonalHealthHelp', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300 text-sm">{label}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 italic mt-2">
                            Examples: Medical consent, housing, daily care, safety, services, appointments.
                          </p>
                        </div>
                      </>
                    )}

                    <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                      <h4 className="text-base font-semibold text-blue-400">Future Care Team</h4>
                    </div>

                    {(() => {
                      const childDisplayName = childrenData[index]?.nickname || childrenData[index]?.name || 'this child';
                      const prefilled = buildPrefilledContacts(index);
                      const selected = (childrenData[index]?.futureCareTeamSelection || '').split(',').filter(Boolean);
                      const otherCount = parseInt(childrenData[index]?.futureCareTeamOtherCount || '0');
                      const otherSelected = selected.includes('other');
                      const extraSelected = childrenData[index]?.futureCareTeamExtra === 'yes';
                      const extraCount = parseInt(childrenData[index]?.futureCareTeamExtraCount || '0');

                      const toggleSelect = (id: string) => {
                        const next = selected.includes(id) ? selected.filter(v => v !== id) : [...selected, id];
                        handleChildChange(index, 'futureCareTeamSelection', next.join(','));
                      };

                      const _step1ForLabels = allAnswers?.get('aboutYou') || {};
                      const _client1Name = (_step1ForLabels['fullName'] as string) || 'Client 1';
                      const _client2Name = (_step1ForLabels['spouseName'] as string) || 'Client 2';
                      const sourceLabels: Record<string, string> = {
                        parent1: 'Parent / Guardian 1',
                        parent2: 'Parent / Guardian 2',
                        sibling: 'Sibling',
                        family: 'Other Family',
                        school: 'School Team',
                        doctor: 'Doctor / Therapist / Support Worker',
                        other: 'Other',
                        otherparent: "Child's Other Parent",
                        prevrel1: `Former Partner (${_client1Name})`,
                        prevrel2: `Former Partner (${_client2Name})`,
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

                      const renderContactFields = (fieldPrefix: string, ci: number, defaults?: { name?: string; phone?: string; email?: string; city?: string; province?: string }) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input type="text" value={childrenData[index]?.[`${fieldPrefix}_name`] ?? defaults?.name ?? ''} onChange={(e) => handleChildChange(index, `${fieldPrefix}_name`, e.target.value)} placeholder="Name" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                          <input type="tel" value={childrenData[index]?.[`${fieldPrefix}_phone`] ?? defaults?.phone ?? ''} onChange={(e) => handleChildChange(index, `${fieldPrefix}_phone`, e.target.value)} placeholder="Phone" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                          <input type="email" value={childrenData[index]?.[`${fieldPrefix}_email`] ?? defaults?.email ?? ''} onChange={(e) => handleChildChange(index, `${fieldPrefix}_email`, e.target.value)} placeholder="Email" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                          <input type="text" value={childrenData[index]?.[`${fieldPrefix}_city`] ?? defaults?.city ?? ''} onChange={(e) => handleChildChange(index, `${fieldPrefix}_city`, e.target.value)} placeholder="City" className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                          <select value={childrenData[index]?.[`${fieldPrefix}_province`] ?? defaults?.province ?? ''} onChange={(e) => handleChildChange(index, `${fieldPrefix}_province`, e.target.value)} className="px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                            <option value="">Province</option>
                            <option value="AB">Alberta</option>
                            <option value="BC">British Columbia</option>
                            <option value="MB">Manitoba</option>
                            <option value="NB">New Brunswick</option>
                            <option value="NL">Newfoundland and Labrador</option>
                            <option value="NS">Nova Scotia</option>
                            <option value="NT">Northwest Territories</option>
                            <option value="NU">Nunavut</option>
                            <option value="ON">Ontario</option>
                            <option value="PE">Prince Edward Island</option>
                            <option value="QC">Quebec</option>
                            <option value="SK">Saskatchewan</option>
                            <option value="YT">Yukon</option>
                          </select>
                          <input type="text" value={childrenData[index]?.[`${fieldPrefix}_relationship`] ?? ''} onChange={(e) => handleChildChange(index, `${fieldPrefix}_relationship`, e.target.value)} placeholder={`Relationship to ${childDisplayName}`} className="px-3 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:col-span-2" />
                        </div>
                      );

                      const renderSpokenQuestion = (fieldPrefix: string) => (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Have you spoken with this person about the role?</label>
                          <div className="flex gap-4">
                            {[
                              { value: 'yes', label: 'Yes' },
                              { value: 'no', label: 'No' },
                              { value: 'partly', label: 'Partly' },
                            ].map(({ value, label }) => (
                              <label key={value} className="flex items-center cursor-pointer">
                                <input type="radio" name={`${fieldPrefix}-spoken`} value={value} checked={childrenData[index]?.[`${fieldPrefix}_spoken`] === value} onChange={(e) => handleChildChange(index, `${fieldPrefix}_spoken`, e.target.value)} className="mr-2" />
                                <span className="text-gray-300 text-sm">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );

                      return (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              If you were no longer able to provide care, who would you hope steps in first? (Select all that apply)
                            </label>
                            <div className="flex flex-col gap-2">
                              {prefilled.map(c => {
                                const isSelected = selected.includes(c.id);
                                return (
                                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(c.id)} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500" />
                                    <span className="text-gray-300 text-sm">{c.name || sourceLabels[c.source] || c.id}</span>
                                    {c.name && <span className="text-xs text-gray-500">({sourceLabels[c.source]})</span>}
                                  </label>
                                );
                              })}
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={otherSelected} onChange={() => { toggleSelect('other'); if (!otherSelected && otherCount === 0) { handleChildChange(index, 'futureCareTeamOtherCount', '1'); } }} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500" />
                                <span className="text-gray-300 text-sm">Other (new person not previously identified)</span>
                              </label>
                            </div>
                          </div>

                          {prefilled.filter(c => selected.includes(c.id)).map((c, pi) => {
                            const fieldPrefix = `futureCareTeam_${pi}`;
                            return (
                              <div key={c.id} className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                <p className="text-sm font-medium text-blue-400 mb-3">{c.name || sourceLabels[c.source]}</p>
                                {renderContactFields(fieldPrefix, pi, { name: c.name, phone: c.phone, email: c.email, city: c.city, province: c.province })}
                                {renderSpokenQuestion(fieldPrefix)}
                              </div>
                            );
                          })}

                          {otherSelected && Array.from({ length: otherCount }).map((_, oi) => {
                            const fieldPrefix = `futureCareTeamOther_${oi}`;
                            return (
                              <div key={`other-${oi}`} className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-sm font-medium text-blue-400">Other Contact {oi + 1}</p>
                                  {oi > 0 && (
                                    <button type="button" onClick={() => handleRemoveFutureCareTeamOther(index, oi)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                      <X size={14} /> Remove
                                    </button>
                                  )}
                                </div>
                                {renderContactFields(fieldPrefix, oi)}
                                {renderSpokenQuestion(fieldPrefix)}
                              </div>
                            );
                          })}

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Are there additional people you would hope would step in to provide care for {childDisplayName}?</label>
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <input type="radio" name={`futureCareTeamExtra-${index}`} value="yes" checked={extraSelected} onChange={() => { if (extraCount === 0) handleChildChange(index, 'futureCareTeamExtraCount', '1'); handleChildChange(index, 'futureCareTeamExtra', 'yes'); }} className="mr-2" />
                                <span className="text-gray-300">Yes</span>
                              </label>
                              <label className="flex items-center">
                                <input type="radio" name={`futureCareTeamExtra-${index}`} value="no" checked={childrenData[index]?.futureCareTeamExtra === 'no'} onChange={() => { const obj = { ...childrenData[index] }; const cur = parseInt(obj.futureCareTeamExtraCount || '0'); const fields = ['name', 'phone', 'email', 'city', 'province', 'relationship', 'spoken']; for (let i = 0; i < cur; i++) { fields.forEach(f => delete obj[`futureCareTeamExtra_${i}_${f}`]); } delete obj.futureCareTeamExtraCount; delete obj.futureCareTeamExtraAdditional; obj.futureCareTeamExtra = 'no'; const updated = [...childrenData]; updated[index] = obj; onAnswerChange('childrenData', updated); }} className="mr-2" />
                                <span className="text-gray-300">No</span>
                              </label>
                            </div>
                          </div>

                          {extraSelected && Array.from({ length: extraCount }).map((_, ei) => {
                            const fieldPrefix = `futureCareTeamExtra_${ei}`;
                            return (
                              <div key={`extra-${ei}`} className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-sm font-medium text-blue-400">Additional Person {ei + 1}</p>
                                  {ei > 0 && (
                                    <button type="button" onClick={() => handleRemoveFutureCareTeamExtra(index, ei)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                      <X size={14} /> Remove
                                    </button>
                                  )}
                                </div>
                                {renderContactFields(fieldPrefix, ei)}
                                {renderSpokenQuestion(fieldPrefix)}
                              </div>
                            );
                          })}

                          {extraSelected && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-2">Are there more additional people to add?</label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input type="radio" name={`futureCareTeamExtra-additional-${index}`} value="yes" checked={childrenData[index]?.futureCareTeamExtraAdditional === 'yes'} onChange={() => { handleChildChange(index, 'futureCareTeamExtraCount', String(extraCount + 1)); handleChildChange(index, 'futureCareTeamExtraAdditional', 'yes'); }} className="mr-2" />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="radio" name={`futureCareTeamExtra-additional-${index}`} value="no" checked={childrenData[index]?.futureCareTeamExtraAdditional === 'no'} onChange={() => { handleChildChange(index, 'futureCareTeamExtraAdditional', 'no'); const cur = parseInt(childrenData[index]?.futureCareTeamExtraCount || '0'); if (cur > 1) { const obj = { ...childrenData[index] }; const fields = ['name', 'phone', 'email', 'city', 'province', 'relationship', 'spoken']; for (let i = 1; i < cur; i++) { fields.forEach(f => delete obj[`futureCareTeamExtra_${i}_${f}`]); } obj.futureCareTeamExtraCount = '1'; const updated = [...childrenData]; updated[index] = obj; onAnswerChange('childrenData', updated); } }} className="mr-2" />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {(selected.length > 0 || otherCount > 0 || extraCount > 0) && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-2">What would you want them to understand about this responsibility?</label>
                              <textarea value={childrenData[index]?.futureCareTeamResponsibility || ''} onChange={(e) => handleChildChange(index, 'futureCareTeamResponsibility', e.target.value)} placeholder="Enter your response" rows={4} className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                          )}

                          {/* Future Care Plan */}
                          <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                            <h4 className="text-base font-semibold text-blue-400">Future Care Plan</h4>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Have you written down a future care plan yet?</label>
                            <div className="flex flex-col gap-2">
                              {['yes', 'no', 'talked', 'need-help'].map((opt) => (
                                <label key={opt} className="flex items-center">
                                  <input type="radio" name={`carePlanWritten-${index}`} value={opt} checked={childrenData[index]?.carePlanWritten === opt} onChange={(e) => {
                                    const val = e.target.value;
                                    const obj: Record<string, string> = { carePlanWritten: val };
                                    if (val !== 'yes') { obj.carePlanStored = ''; obj.carePlanWorries = ''; obj.carePlanWorriesOther = ''; }
                                    handleChildMultiChange(index, obj);
                                  }} className="mr-2" />
                                  <span className="text-gray-300">{opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : opt === 'talked' ? "We've talked about it, but nothing is written" : 'We need help starting'}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {childrenData[index]?.carePlanWritten === 'yes' && (
                            <>
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Where is the plan stored?</label>
                                <input type="text" value={childrenData[index]?.carePlanStored || ''} onChange={(e) => handleChildChange(index, 'carePlanStored', e.target.value)} placeholder="Enter your response" className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                              </div>
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">What worries you most about the future plan?</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {['Who would provide care', 'Where they would live', 'Money / funding', 'Government benefits', 'Sibling responsibilities', 'Medical care', 'School-to-adult transition', 'Other'].map((opt) => {
                                    const current = (childrenData[index]?.carePlanWorries || '').split(',').filter(Boolean);
                                    const isChecked = current.includes(opt);
                                    return (
                                      <label key={opt} className="flex items-center">
                                        <input type="checkbox" checked={isChecked} onChange={() => {
                                          const next = isChecked ? current.filter(v => v !== opt) : [...current, opt];
                                          const fields: Record<string, string> = { carePlanWorries: next.join(',') };
                                          if (isChecked && opt === 'Other') fields.carePlanWorriesOther = '';
                                          handleChildMultiChange(index, fields);
                                        }} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500 mr-2" />
                                        <span className="text-gray-300">{opt}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                {(childrenData[index]?.carePlanWorries || '').split(',').includes('Other') && (
                                  <input type="text" value={childrenData[index]?.carePlanWorriesOther || ''} onChange={(e) => handleChildChange(index, 'carePlanWorriesOther', e.target.value)} placeholder="Please specify" className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                )}
                              </div>
                            </>
                          )}

                          {/* Disability supports */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Are any benefits, funding, housing supports, or services connected to their disability or care needs?</label>
                            <div className="flex flex-col gap-2">
                              {['yes', 'no', 'not-sure'].map((opt) => (
                                <label key={opt} className="flex items-center">
                                  <input type="radio" name={`disabilitySupports-${index}`} value={opt} checked={childrenData[index]?.disabilitySupports === opt} onChange={(e) => {
                                    const val = e.target.value;
                                    const obj: Record<string, string> = { disabilitySupports: val };
                                    if (val !== 'yes') { obj.disabilitySupportsList = ''; obj.disabilitySupportsOther = ''; }
                                    handleChildMultiChange(index, obj);
                                  }} className="mr-2" />
                                  <span className="text-gray-300">{opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Not sure'}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {childrenData[index]?.disabilitySupports === 'yes' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-2">Which ones?</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {['DTC', 'RDSP', 'ODSP / provincial disability support', 'School supports', 'Housing supports', 'Private insurance', 'Other'].map((opt) => {
                                  const current = (childrenData[index]?.disabilitySupportsList || '').split(',').filter(Boolean);
                                  const isChecked = current.includes(opt);
                                  return (
                                    <label key={opt} className="flex items-center">
                                      <input type="checkbox" checked={isChecked} onChange={() => {
                                        const next = isChecked ? current.filter(v => v !== opt) : [...current, opt];
                                        const fields: Record<string, string> = { disabilitySupportsList: next.join(',') };
                                        if (isChecked && opt === 'Other') fields.disabilitySupportsOther = '';
                                        handleChildMultiChange(index, fields);
                                      }} className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500 mr-2" />
                                      <span className="text-gray-300">{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                              {(childrenData[index]?.disabilitySupportsList || '').split(',').includes('Other') && (
                                <input type="text" value={childrenData[index]?.disabilitySupportsOther || ''} onChange={(e) => handleChildChange(index, 'disabilitySupportsOther', e.target.value)} placeholder="Please specify" className="mt-2 w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                              )}
                            </div>
                          )}

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Does any support depend on where they live or who provides care?</label>
                            <div className="flex flex-col gap-2">
                              {['yes', 'no', 'not-sure'].map((opt) => (
                                <label key={opt} className="flex items-center">
                                  <input type="radio" name={`supportLocationDependent-${index}`} value={opt} checked={childrenData[index]?.supportLocationDependent === opt} onChange={(e) => {
                                    const val = e.target.value;
                                    const fields: Record<string, string> = { supportLocationDependent: val };
                                    if (val !== 'yes') fields.supportLocationDependentDetails = '';
                                    handleChildMultiChange(index, fields);
                                  }} className="mr-2" />
                                  <span className="text-gray-300">{opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Not sure'}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">What would help a future caregiver support this person well?</label>
                      <p className="text-xs text-gray-400 italic mb-2">Think about routines, comfort items, communication style, triggers, food, sleep, friends, school, therapies, medical contacts, technology, safety, and what helps them feel calm.</p>
                      <textarea
                        value={childrenData[index]?.futureCaregiverSupport || ''}
                        onChange={(e) => handleChildChange(index, 'futureCaregiverSupport', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter information here..."
                      />
                    </div>
                    </>
                    )}

{childrenData[index]?.independent === 'no' && (
                      <>
                        <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                          <h4 className="text-base font-semibold text-blue-400">Medical &amp; Care</h4>
                        </div>

                        <div className="mt-2 pb-1 border-b border-gray-600 mb-2">
                          <h5 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Medications</h5>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Are they on any long-term medications?
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`medications-${index}`}
                                value="yes"
                                checked={childrenData[index]?.medications === 'yes'}
                                onChange={(e) => handleChildChange(index, 'medications', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-gray-300">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`medications-${index}`}
                                value="no"
                                checked={childrenData[index]?.medications === 'no'}
                                onChange={(e) => handleChildChange(index, 'medications', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-gray-300">No</span>
                            </label>
                          </div>
                        </div>

                        {childrenData[index]?.medications === 'yes' && (
                          <>
                            {(() => {
                              type MedEntry = { name: string; treats: string; prescription: string; prescribedBy: string; otherInfo: string; hasAdditional: string };
                              const medicationList = JSON.parse(childrenData[index]?.medicationList || '[]') as MedEntry[];

                              const handleMedicationChange = (medIndex: number, field: keyof MedEntry, value: string) => {
                                const updated = [...medicationList];
                                if (!updated[medIndex]) {
                                  updated[medIndex] = { name: '', treats: '', prescription: '', prescribedBy: '', otherInfo: '', hasAdditional: '' };
                                }
                                if (field === 'prescription' && value === 'no') {
                                  updated[medIndex] = { ...updated[medIndex], prescription: 'no', prescribedBy: '' };
                                } else {
                                  updated[medIndex][field] = value;
                                }
                                handleChildChange(index, 'medicationList', JSON.stringify(updated));
                              };

                              if (medicationList.length === 0) {
                                medicationList.push({ name: '', treats: '', prescription: '', prescribedBy: '', otherInfo: '', hasAdditional: '' });
                              }

                              return medicationList.map((medication, medIndex) => (
                                <div key={medIndex} className="space-y-4 border-l-2 border-blue-500 pl-4">
                                  {medIndex > 0 && (
                                    <div className="text-sm font-medium text-blue-400 -ml-4 pl-4">
                                      Additional Medication #{medIndex + 1}
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Name of Medication:
                                    </label>
                                    <input
                                      type="text"
                                      value={medication.name || ''}
                                      onChange={(e) => handleMedicationChange(medIndex, 'name', e.target.value)}
                                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      What does it treat?
                                    </label>
                                    <input
                                      type="text"
                                      value={medication.treats || ''}
                                      onChange={(e) => handleMedicationChange(medIndex, 'treats', e.target.value)}
                                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Does it require a prescription?
                                    </label>
                                    <div className="flex gap-4">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`medPrescription-${index}-${medIndex}`}
                                          value="yes"
                                          checked={medication.prescription === 'yes'}
                                          onChange={(e) => handleMedicationChange(medIndex, 'prescription', e.target.value)}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">Yes</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`medPrescription-${index}-${medIndex}`}
                                          value="no"
                                          checked={medication.prescription === 'no'}
                                          onChange={(e) => handleMedicationChange(medIndex, 'prescription', e.target.value)}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">No</span>
                                      </label>
                                    </div>
                                  </div>

                                  {medication.prescription === 'yes' && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Prescribed by:
                                      </label>
                                      <input
                                        type="text"
                                        value={medication.prescribedBy || ''}
                                        onChange={(e) => handleMedicationChange(medIndex, 'prescribedBy', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Other information:
                                    </label>
                                    <input
                                      type="text"
                                      value={medication.otherInfo || ''}
                                      onChange={(e) => handleMedicationChange(medIndex, 'otherInfo', e.target.value)}
                                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Are there any additional long-term medications?
                                    </label>
                                    <div className="flex gap-4">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`hasAdditionalMedication-${index}-${medIndex}`}
                                          value="yes"
                                          checked={medication.hasAdditional === 'yes'}
                                          onChange={(e) => {
                                            handleMedicationChange(medIndex, 'hasAdditional', e.target.value);
                                            if (e.target.value === 'yes' && medIndex === medicationList.length - 1) {
                                              const updated = [...medicationList, { name: '', treats: '', prescription: '', prescribedBy: '', otherInfo: '', hasAdditional: '' }];
                                              handleChildChange(index, 'medicationList', JSON.stringify(updated));
                                            }
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">Yes</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`hasAdditionalMedication-${index}-${medIndex}`}
                                          value="no"
                                          checked={medication.hasAdditional === 'no'}
                                          onChange={(e) => {
                                            const trimmed = medicationList.slice(0, medIndex + 1);
                                            trimmed[medIndex] = { ...trimmed[medIndex], hasAdditional: 'no' };
                                            handleChildChange(index, 'medicationList', JSON.stringify(trimmed));
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">No</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ));
                            })()}
                          </>
                        )}

                        <div className="mt-6 pb-1 border-b border-gray-600 mb-2">
                          <h5 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Allergies</h5>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Do they have any allergies?
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`allergies-${index}`}
                                value="yes"
                                checked={childrenData[index]?.allergies === 'yes'}
                                onChange={(e) => handleChildChange(index, 'allergies', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-gray-300">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`allergies-${index}`}
                                value="no"
                                checked={childrenData[index]?.allergies === 'no'}
                                onChange={(e) => handleChildChange(index, 'allergies', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-gray-300">No</span>
                            </label>
                          </div>
                        </div>

                        {childrenData[index]?.allergies === 'yes' && (
                          <>
                            {(() => {
                              type AllergyEntry = { details: string; severity: string; medications: string; epipen: string; requiredFor: string; otherInfo: string; hasAdditional?: string };
                              const allergyList = JSON.parse(childrenData[index]?.allergyList || '[]') as AllergyEntry[];

                              const handleAllergyChange = (allergyIndex: number, field: keyof AllergyEntry, value: string) => {
                                const updated = [...allergyList];
                                if (!updated[allergyIndex]) {
                                  updated[allergyIndex] = { details: '', severity: '', medications: '', epipen: '', requiredFor: '', otherInfo: '', hasAdditional: '' };
                                }
                                updated[allergyIndex][field] = value;
                                handleChildChange(index, 'allergyList', JSON.stringify(updated));
                              };

                              if (allergyList.length === 0) {
                                allergyList.push({ details: '', severity: '', medications: '', epipen: '', requiredFor: '', otherInfo: '', hasAdditional: '' });
                              }

                              return allergyList.map((allergy, allergyIndex) => (
                                <div key={allergyIndex} className="space-y-4 border-l-2 border-blue-500 pl-4">
                                  {allergyIndex > 0 && (
                                    <div className="text-sm font-medium text-blue-400 -ml-4 pl-4">
                                      Additional Allergy #{allergyIndex + 1}
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      What is {childDisplayName(index)} allergic to?
                                    </label>
                                    <input
                                      type="text"
                                      value={allergy.details || ''}
                                      onChange={(e) => handleAllergyChange(allergyIndex, 'details', e.target.value)}
                                      placeholder="List allergy"
                                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      What is the severity?
                                    </label>
                                    <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Mild, Moderate, Severe, Life-threatening</p>
                                    <input
                                      type="text"
                                      value={allergy.severity || ''}
                                      onChange={(e) => handleAllergyChange(allergyIndex, 'severity', e.target.value)}
                                      placeholder=""
                                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      What medications are used to treat this allergy?
                                    </label>
                                    <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Antihistamines, Corticosteroids</p>
                                    <input
                                      type="text"
                                      value={allergy.medications || ''}
                                      onChange={(e) => handleAllergyChange(allergyIndex, 'medications', e.target.value)}
                                      placeholder=""
                                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Do they carry an EpiPen?
                                    </label>
                                    <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Yes, No, Yes - carried at all times</p>
                                    <input
                                      type="text"
                                      value={allergy.epipen || ''}
                                      onChange={(e) => handleAllergyChange(allergyIndex, 'epipen', e.target.value)}
                                      placeholder=""
                                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Where is this allergy plan required?
                                    </label>
                                    <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., School, activities</p>
                                    <input
                                      type="text"
                                      value={allergy.requiredFor || ''}
                                      onChange={(e) => handleAllergyChange(allergyIndex, 'requiredFor', e.target.value)}
                                      placeholder=""
                                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Any other information about this allergy?
                                    </label>
                                    <input
                                      type="text"
                                      value={allergy.otherInfo || ''}
                                      onChange={(e) => handleAllergyChange(allergyIndex, 'otherInfo', e.target.value)}
                                      placeholder="Any additional details"
                                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Does {childDisplayName(index)} have any additional allergies?
                                    </label>
                                    <div className="flex gap-4">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`hasAdditionalAllergy-${index}-${allergyIndex}`}
                                          value="yes"
                                          checked={allergy.hasAdditional === 'yes'}
                                          onChange={(e) => {
                                            handleAllergyChange(allergyIndex, 'hasAdditional', e.target.value);
                                            if (allergyIndex === allergyList.length - 1) {
                                              const updated = [...allergyList];
                                              updated.push({ details: '', severity: '', medications: '', epipen: '', requiredFor: '', otherInfo: '', hasAdditional: '' });
                                              handleChildChange(index, 'allergyList', JSON.stringify(updated));
                                            }
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">Yes</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`hasAdditionalAllergy-${index}-${allergyIndex}`}
                                          value="no"
                                          checked={allergy.hasAdditional === 'no'}
                                          onChange={(e) => handleAllergyChange(allergyIndex, 'hasAdditional', e.target.value)}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">No</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ));
                            })()}
                          </>
                        )}

                        <div className="mt-6 pb-1 border-b border-gray-600 mb-2">
                          <h5 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Additional Medical Information</h5>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Are there any additional medical related information that a guardian should be aware of with respect to {childDisplayName(index)}?
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`medicalIssues-${index}`}
                                value="yes"
                                checked={childrenData[index]?.medicalIssues === 'yes'}
                                onChange={(e) => handleChildChange(index, 'medicalIssues', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-gray-300">Yes</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`medicalIssues-${index}`}
                                value="no"
                                checked={childrenData[index]?.medicalIssues === 'no'}
                                onChange={(e) => handleChildChange(index, 'medicalIssues', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-gray-300">No</span>
                            </label>
                          </div>
                        </div>

                        {childrenData[index]?.medicalIssues === 'yes' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Please provide details:
                            </label>
                            <textarea
                              value={childrenData[index]?.medicalIssuesDescription || ''}
                              onChange={(e) => handleChildChange(index, 'medicalIssuesDescription', e.target.value)}
                              placeholder="Describe any additional medical information a guardian should be aware of"
                              rows={4}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                          </div>
                        )}

                        <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                          <h4 className="text-base font-semibold text-blue-400">Academic Snapshot</h4>
                        </div>
                        <div className="mt-2">

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Is {childDisplayName(index)} attending school?
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`attendingSchool-${index}`}
                                  value="yes"
                                  checked={childrenData[index]?.attendingSchool === 'yes'}
                                  onChange={(e) => handleChildChange(index, 'attendingSchool', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">Yes</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`attendingSchool-${index}`}
                                  value="no"
                                  checked={childrenData[index]?.attendingSchool === 'no'}
                                  onChange={(e) => handleChildChange(index, 'attendingSchool', e.target.value)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">No</span>
                              </label>
                            </div>
                          </div>

                          {childrenData[index]?.attendingSchool === 'yes' && (
                            <div className="space-y-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  School Name:
                                </label>
                                <input
                                  type="text"
                                  value={childrenData[index]?.schoolName || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolName', e.target.value)}
                                  placeholder="Enter school name"
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Current Grade / Year:
                                </label>
                                <input
                                  type="text"
                                  value={childrenData[index]?.currentGrade || ''}
                                  onChange={(e) => handleChildChange(index, 'currentGrade', e.target.value)}
                                  placeholder="e.g., Grade 3, Year 2, Kindergarten"
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  School Phone Number:
                                </label>
                                <input
                                  type="text"
                                  value={childrenData[index]?.schoolPhone || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolPhone', e.target.value)}
                                  placeholder=""
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  School Address:
                                </label>
                                <input
                                  type="text"
                                  value={childrenData[index]?.schoolAddress || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolAddress', e.target.value)}
                                  placeholder=""
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  School Website:
                                </label>
                                <input
                                  type="text"
                                  value={childrenData[index]?.schoolWebsite || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolWebsite', e.target.value)}
                                  placeholder=""
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  What subjects does {childDisplayName(index)} naturally enjoy or succeed in?
                                </label>
                                <textarea
                                  value={childrenData[index]?.schoolStrengths || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolStrengths', e.target.value)}
                                  placeholder="Describe subjects or areas they naturally enjoy or excel at"
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Where do they typically need extra support?
                                </label>
                                <textarea
                                  value={childrenData[index]?.schoolExtraSupport || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolExtraSupport', e.target.value)}
                                  placeholder="Describe areas where they typically need extra support"
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  What helps {childDisplayName(index)} stay focused?
                                </label>
                                <textarea
                                  value={childrenData[index]?.schoolFocusHelps || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolFocusHelps', e.target.value)}
                                  placeholder="Describe what helps them stay focused"
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  What tends to distract or overwhelm them?
                                </label>
                                <textarea
                                  value={childrenData[index]?.schoolDistractions || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolDistractions', e.target.value)}
                                  placeholder="Describe what tends to distract or overwhelm them"
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Is there an Individual Education Plan (IEP)?
                                </label>
                                <div className="flex gap-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`hasIEP-${index}`}
                                      value="yes"
                                      checked={childrenData[index]?.hasIEP === 'yes'}
                                      onChange={(e) => handleChildChange(index, 'hasIEP', e.target.value)}
                                      className="mr-2"
                                    />
                                    <span className="text-gray-300">Yes</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`hasIEP-${index}`}
                                      value="no"
                                      checked={childrenData[index]?.hasIEP === 'no'}
                                      onChange={(e) => handleChildChange(index, 'hasIEP', e.target.value)}
                                      className="mr-2"
                                    />
                                    <span className="text-gray-300">No</span>
                                  </label>
                                </div>
                              </div>
                              {childrenData[index]?.hasIEP === 'yes' && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Provide Details:
                                    </label>
                                    <textarea
                                      value={childrenData[index]?.individualEducationPlan || ''}
                                      onChange={(e) => handleChildChange(index, 'individualEducationPlan', e.target.value)}
                                      placeholder="Provide details about the individual education plan"
                                      rows={3}
                                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      Location of the IEP document:
                                    </label>
                                    <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., filing cabinet, school office, digital folder</p>
                                    <input
                                      type="text"
                                      value={childrenData[index]?.iepDocumentLocation || ''}
                                      onChange={(e) => handleChildChange(index, 'iepDocumentLocation', e.target.value)}
                                      placeholder=""
                                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                  </div>
                                </>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Which school activities are most important for your child's confidence and social life?
                                </label>
                                <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., sports teams, drama, art club, recess friendships</p>
                                <textarea
                                  value={childrenData[index]?.schoolActivitiesImportant || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolActivitiesImportant', e.target.value)}
                                  placeholder=""
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  What are your homework routines?
                                </label>
                                <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., time, location, who helps, any challenges</p>
                                <textarea
                                  value={childrenData[index]?.homeworkRoutines || ''}
                                  onChange={(e) => handleChildChange(index, 'homeworkRoutines', e.target.value)}
                                  placeholder=""
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  What are your hopes or expectations for your child's education over the next few years?
                                </label>
                                <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., post-secondary goals, skill development, personal growth</p>
                                <textarea
                                  value={childrenData[index]?.educationHopes || ''}
                                  onChange={(e) => handleChildChange(index, 'educationHopes', e.target.value)}
                                  placeholder=""
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Learning style notes or concerns:
                                </label>
                                <textarea
                                  value={childrenData[index]?.learningStyleNotes || ''}
                                  onChange={(e) => handleChildChange(index, 'learningStyleNotes', e.target.value)}
                                  placeholder="Describe any learning style notes or concerns"
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Behavioural considerations:
                                </label>
                                <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., anxiety, ADHD triggers</p>
                                <textarea
                                  value={childrenData[index]?.behaviouralConsiderations || ''}
                                  onChange={(e) => handleChildChange(index, 'behaviouralConsiderations', e.target.value)}
                                  placeholder="Describe any behavioural considerations"
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  If {childDisplayName(index)} is having a difficult day at school, what strategies work best to calm or support them?
                                </label>
                                <textarea
                                  value={childrenData[index]?.schoolCalmingStrategies || ''}
                                  onChange={(e) => handleChildChange(index, 'schoolCalmingStrategies', e.target.value)}
                                  placeholder="Describe strategies that work best to calm or support them"
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Additional details:
                                </label>
                                <textarea
                                  value={childrenData[index]?.educationAdditionalDetails || ''}
                                  onChange={(e) => handleChildChange(index, 'educationAdditionalDetails', e.target.value)}
                                  placeholder="Any other educational information a guardian should know"
                                  rows={3}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                              </div>
                            </div>
                          )}

                          {childrenData[index]?.attendingSchool === 'no' && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Is there any additional information regarding {childDisplayName(index)} and education?
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`additionalEducationInfo-${index}`}
                                    value="yes"
                                    checked={childrenData[index]?.additionalEducationInfo === 'yes'}
                                    onChange={(e) => handleChildChange(index, 'additionalEducationInfo', e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">Yes</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`additionalEducationInfo-${index}`}
                                    value="no"
                                    checked={childrenData[index]?.additionalEducationInfo === 'no'}
                                    onChange={(e) => handleChildChange(index, 'additionalEducationInfo', e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-gray-300">No</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {childrenData[index]?.attendingSchool === 'no' && childrenData[index]?.additionalEducationInfo === 'yes' && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Please provide details:
                              </label>
                              <textarea
                                value={childrenData[index]?.additionalEducationDetails || ''}
                                onChange={(e) => handleChildChange(index, 'additionalEducationDetails', e.target.value)}
                                placeholder="Provide any additional educational information"
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                          <h4 className="text-base font-semibold text-blue-400">Routines &amp; Activities</h4>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            What daily or weekly routines are most important to {childDisplayName(index)}'s sense of stability?
                          </label>
                          <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., bedtime rituals, meals, weekend traditions, after-school habits, Friday movie nights, annual camping trip</p>
                          <textarea
                            value={childrenData[index]?.importantRoutines || ''}
                            onChange={(e) => handleChildChange(index, 'importantRoutines', e.target.value)}
                            placeholder=""
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                          />
                        </div>
                          {(() => {
                            type ActivityFriendEntry = {
                              friendName: string;
                              relationship: string;
                              cityLocation: string;
                              parentGuardianName: string;
                              parentPhone: string;
                              parentEmail: string;
                              whyImportant: string;
                              activitiesTogether: string;
                              hasAdditional: string;
                            };
                            type ActivityEntry = {
                              activityName: string;
                              activityType: string;
                              importanceLevel: string;
                              frequency: string;
                              hasSharedFriends: string;
                              sharedFriendIds: string[];
                              otherFriends: ActivityFriendEntry[];
                              hasAdditional: string;
                            };
                            const activityList = JSON.parse(childrenData[index]?.activityList || '[]') as ActivityEntry[];
                            if (activityList.length === 0) {
                              activityList.push({ activityName: '', activityType: '', importanceLevel: '', frequency: '', hasSharedFriends: '', sharedFriendIds: [], otherFriends: [], hasAdditional: '' });
                            }
                            const existingFriends = JSON.parse(childrenData[index]?.belongingConnections || '[]') as Array<{ displayName: string }>;
                            const childName = childDisplayName(index);

                            const handleActivityChange = (ai: number, field: keyof ActivityEntry, value: string | string[]) => {
                              const updated = [...activityList];
                              if (!updated[ai]) {
                                updated[ai] = { activityName: '', activityType: '', importanceLevel: '', frequency: '', hasSharedFriends: '', sharedFriendIds: [], otherFriends: [], hasAdditional: '' };
                              }
                              (updated[ai] as Record<string, unknown>)[field] = value;
                              if (field === 'hasAdditional' && value === 'yes' && ai === activityList.length - 1) {
                                updated.push({ activityName: '', activityType: '', importanceLevel: '', frequency: '', hasSharedFriends: '', sharedFriendIds: [], otherFriends: [], hasAdditional: '' });
                              }
                              if (field === 'hasAdditional' && value === 'no') {
                                const trimmed = updated.slice(0, ai + 1);
                                trimmed[ai] = { ...trimmed[ai], hasAdditional: 'no' };
                                handleChildChange(index, 'activityList', JSON.stringify(trimmed));
                                return;
                              }
                              handleChildChange(index, 'activityList', JSON.stringify(updated));
                            };

                            const handleActivityOtherFriendChange = (ai: number, fi: number, field: keyof ActivityFriendEntry, value: string) => {
                              const updated = [...activityList];
                              const friends = [...(updated[ai].otherFriends || [])];
                              if (!friends[fi]) {
                                friends[fi] = { friendName: '', relationship: '', cityLocation: '', parentGuardianName: '', parentPhone: '', parentEmail: '', whyImportant: '', activitiesTogether: '', hasAdditional: '' };
                              }
                              friends[fi][field] = value;
                              if (field === 'hasAdditional' && value === 'yes' && fi === friends.length - 1) {
                                friends.push({ friendName: '', relationship: '', cityLocation: '', parentGuardianName: '', parentPhone: '', parentEmail: '', whyImportant: '', activitiesTogether: '', hasAdditional: '' });
                              }
                              if (field === 'hasAdditional' && value === 'no') {
                                const trimmed = friends.slice(0, fi + 1);
                                trimmed[fi] = { ...trimmed[fi], hasAdditional: 'no' };
                                updated[ai] = { ...updated[ai], otherFriends: trimmed };
                                handleChildChange(index, 'activityList', JSON.stringify(updated));
                                return;
                              }
                              updated[ai] = { ...updated[ai], otherFriends: friends };
                              handleChildChange(index, 'activityList', JSON.stringify(updated));
                            };

                            const toggleSharedFriend = (ai: number, friendName: string) => {
                              const updated = [...activityList];
                              const current = updated[ai].sharedFriendIds || [];
                              const next = current.includes(friendName)
                                ? current.filter(f => f !== friendName)
                                : [...current, friendName];
                              updated[ai] = { ...updated[ai], sharedFriendIds: next };
                              handleChildChange(index, 'activityList', JSON.stringify(updated));
                            };

                            return (
                              <div className="space-y-4">
                                <div className="pb-1">
                                  <label className="block text-sm font-medium text-gray-300">
                                    What extracurricular activities, hobbies, interests or identity anchors are most important to {childName}?
                                  </label>
                                </div>
                                {activityList.map((activity, ai) => (
                                  <div key={ai} className="bg-gray-750 border border-gray-600 rounded-lg p-4 space-y-4">
                                    {ai > 0 && (
                                      <div className="pb-2 border-b border-gray-600 mb-2">
                                        <span className="text-sm font-semibold text-gray-300">Identity Anchor #{ai + 1}</span>
                                      </div>
                                    )}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Activity Name:</label>
                                      <input
                                        type="text"
                                        value={activity.activityName}
                                        onChange={(e) => handleActivityChange(ai, 'activityName', e.target.value)}
                                        placeholder="Enter activity name"
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Type:</label>
                                      <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., sport / music / art / academic / social</p>
                                      <input
                                        type="text"
                                        value={activity.activityType}
                                        onChange={(e) => handleActivityChange(ai, 'activityType', e.target.value)}
                                        placeholder=""
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Importance Level:</label>
                                      <div className="flex gap-4 flex-wrap">
                                        {['Critical', 'Important', 'Nice to have'].map((level) => (
                                          <label key={level} className="flex items-center cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`importanceLevel-${index}-${ai}`}
                                              value={level}
                                              checked={activity.importanceLevel === level}
                                              onChange={(e) => handleActivityChange(ai, 'importanceLevel', e.target.value)}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">{level}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Frequency:</label>
                                      <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., weekly, every Saturday, daily</p>
                                      <input
                                        type="text"
                                        value={activity.frequency}
                                        onChange={(e) => handleActivityChange(ai, 'frequency', e.target.value)}
                                        placeholder=""
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Do they participate with specific friends?</label>
                                      <div className="flex gap-4">
                                        {['yes', 'no'].map((val) => (
                                          <label key={val} className="flex items-center cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`hasSharedFriends-${index}-${ai}`}
                                              value={val}
                                              checked={activity.hasSharedFriends === val}
                                              onChange={(e) => handleActivityChange(ai, 'hasSharedFriends', e.target.value)}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300 capitalize">{val}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                    {activity.hasSharedFriends === 'yes' && (
                                      <div className="space-y-3 pl-4 border-l border-gray-600">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Select friends who participate:</label>
                                        <div className="space-y-2">
                                          {existingFriends.filter(f => f.displayName).map((f, fi) => (
                                            <label key={fi} className="flex items-center cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={(activity.sharedFriendIds || []).includes(f.displayName)}
                                                onChange={() => toggleSharedFriend(ai, f.displayName)}
                                                className="mr-2"
                                              />
                                              <span className="text-gray-300">{f.displayName}</span>
                                            </label>
                                          ))}
                                          <label className="flex items-center cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={(activity.sharedFriendIds || []).includes('__other__')}
                                              onChange={() => toggleSharedFriend(ai, '__other__')}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300">Other</span>
                                          </label>
                                        </div>
                                        {(activity.sharedFriendIds || []).includes('__other__') && (
                                          <div className="space-y-4 mt-3">
                                            {(activity.otherFriends?.length ? activity.otherFriends : [{ friendName: '', relationship: '', cityLocation: '', parentGuardianName: '', parentPhone: '', parentEmail: '', whyImportant: '', activitiesTogether: '', hasAdditional: '' }]).map((otherFriend, ofi) => (
                                              <div key={ofi} className="bg-gray-700 border border-gray-600 rounded-lg p-4 space-y-3">
                                                {ofi > 0 && <div className="pb-1 border-b border-gray-600"><span className="text-xs font-semibold text-gray-400">Additional Friend #{ofi + 1}</span></div>}
                                                {[
                                                  { field: 'friendName' as keyof ActivityFriendEntry, label: "Friend's Name:", placeholder: "Enter friend's name", hint: '' },
                                                  { field: 'relationship' as keyof ActivityFriendEntry, label: 'Relationship:', placeholder: '', hint: 'e.g., best friend, teammate, neighbor, cousin' },
                                                  { field: 'cityLocation' as keyof ActivityFriendEntry, label: 'City / Location:', placeholder: 'City or general location', hint: '' },
                                                  { field: 'parentGuardianName' as keyof ActivityFriendEntry, label: 'Parent / Guardian Name:', placeholder: 'Enter parent or guardian name', hint: '' },
                                                  { field: 'parentPhone' as keyof ActivityFriendEntry, label: 'Parent Phone Number:', placeholder: 'Enter parent phone number', hint: '' },
                                                  { field: 'parentEmail' as keyof ActivityFriendEntry, label: 'Parent Email:', placeholder: 'Enter parent email address', hint: '' },
                                                ].map(({ field, label, placeholder, hint }) => (
                                                  <div key={field}>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                                                    {hint && <p className="text-xs italic text-gray-400 mt-1 mb-2">{hint}</p>}
                                                    <input
                                                      type="text"
                                                      value={otherFriend[field] as string}
                                                      onChange={(e) => handleActivityOtherFriendChange(ai, ofi, field, e.target.value)}
                                                      placeholder={placeholder}
                                                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                                    />
                                                  </div>
                                                ))}
                                                {[
                                                  { field: 'whyImportant' as keyof ActivityFriendEntry, label: `Why is this relationship important to ${childName}?`, placeholder: 'Describe why this relationship matters', hint: '' },
                                                  { field: 'activitiesTogether' as keyof ActivityFriendEntry, label: 'What clubs, activities, camps, etc. do they do together?', placeholder: '', hint: 'e.g., soccer team, art camp, chess club' },
                                                ].map(({ field, label, placeholder, hint }) => (
                                                  <div key={field}>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                                                    {hint && <p className="text-xs italic text-gray-400 mt-1 mb-2">{hint}</p>}
                                                    <textarea
                                                      value={otherFriend[field] as string}
                                                      onChange={(e) => handleActivityOtherFriendChange(ai, ofi, field, e.target.value)}
                                                      placeholder={placeholder}
                                                      rows={2}
                                                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                                    />
                                                  </div>
                                                ))}
                                                <div>
                                                  <label className="block text-xs font-medium text-gray-400 mb-1">Are there additional friends to add for this activity?</label>
                                                  <div className="flex gap-4">
                                                    {['yes', 'no'].map((val) => (
                                                      <label key={val} className="flex items-center cursor-pointer">
                                                        <input
                                                          type="radio"
                                                          name={`activityOtherFriendAdditional-${index}-${ai}-${ofi}`}
                                                          value={val}
                                                          checked={otherFriend.hasAdditional === val}
                                                          onChange={(e) => handleActivityOtherFriendChange(ai, ofi, 'hasAdditional', e.target.value)}
                                                          className="mr-2"
                                                        />
                                                        <span className="text-gray-300 capitalize text-sm">{val}</span>
                                                      </label>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Are there any additional identity anchors we should add?
                                      </label>
                                      <div className="flex gap-4">
                                        {['yes', 'no'].map((val) => (
                                          <label key={val} className="flex items-center cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`activityHasAdditional-${index}-${ai}`}
                                              value={val}
                                              checked={activity.hasAdditional === val}
                                              onChange={(e) => handleActivityChange(ai, 'hasAdditional', e.target.value)}
                                              className="mr-2"
                                            />
                                            <span className="text-gray-300 capitalize">{val}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              How does {childDisplayName(index)} best communicate and like to be spoken to?
                            </label>
                            <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., responds well to direct explanations, needs time to process, prefers visual cues, responds to tone of voice</p>
                            <textarea
                              value={childrenData[index]?.communicationStyle || ''}
                              onChange={(e) => handleChildChange(index, 'communicationStyle', e.target.value)}
                              placeholder=""
                              rows={3}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              How does {childDisplayName(index)} typically express or manage difficult emotions?
                            </label>
                            <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., withdraws, talks it out, physical activity, art, needs space</p>
                            <textarea
                              value={childrenData[index]?.emotionalExpression || ''}
                              onChange={(e) => handleChildChange(index, 'emotionalExpression', e.target.value)}
                              placeholder=""
                              rows={3}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              What comforts {childDisplayName(index)} when they are upset, scared, or overwhelmed?
                            </label>
                            <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., specific people, objects, activities, words of reassurance</p>
                            <textarea
                              value={childrenData[index]?.comfortStrategies || ''}
                              onChange={(e) => handleChildChange(index, 'comfortStrategies', e.target.value)}
                              placeholder=""
                              rows={3}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Are there any social or emotional challenges a guardian should be aware of?
                            </label>
                            <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., social anxiety, difficulty with transitions, peer conflicts, sensitivities</p>
                            <textarea
                              value={childrenData[index]?.socialChallenges || ''}
                              onChange={(e) => handleChildChange(index, 'socialChallenges', e.target.value)}
                              placeholder=""
                              rows={3}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Additional notes about {childDisplayName(index)}'s social and emotional world:
                            </label>
                            <textarea
                              value={childrenData[index]?.socialAdditionalNotes || ''}
                              onChange={(e) => handleChildChange(index, 'socialAdditionalNotes', e.target.value)}
                              placeholder="Any other information that would help a guardian maintain relationships and emotional stability"
                              rows={3}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                          </div>

                        <div className="mt-6 pb-2 border-b border-gray-500 mb-2">
                          <h4 className="text-base font-semibold text-blue-400">Digital Identity and Access</h4>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-400 mb-4">
                            Modern parenting includes school portals, social accounts and gaming platforms that guardians must manage. Provide the information that you believe would best assist a potential guardian:
                          </p>
                          <div className="text-xs text-gray-400 italic mb-2">
                            Note: Detailed access information will be captured in the PDF form
                          </div>
                        </div>
                      </>
                    )}

                  </div>

                  <ChildPlanningSection
                    childIndex={index}
                    childData={childrenData[index] || {}}
                    childrenData={childrenData}
                    planningPersons={planningPersons}
                    prefilledContacts={buildPrefilledContacts(index)}
                    classification={getChildClassification(childrenData[index])}
                    isDisabled={childrenData[index]?.disabled === 'yes' || childrenData[index]?.disabled === 'not_sure'}
                    minorIndices={minorIndices}
                    onChildChange={handleChildChange}
                    onChildMultiChange={handleChildMultiChange}
                    onPlanningPersonsChange={handlePlanningPersonsChange}
                  />

                  {getChildClassification(childrenData[index]) === 'minor' && childrenData[index]?.guardianPersonId && (
                    <GuardianTransitionSection
                      childIndex={index}
                      childData={childrenData[index] || {}}
                      childrenData={childrenData}
                      planningPersons={planningPersons}
                      minorIndices={minorIndices}
                      isDisabled={childrenData[index]?.disabled === 'yes' || childrenData[index]?.disabled === 'not_sure'}
                      onChildChange={handleChildChange}
                      onChildMultiChange={handleChildMultiChange}
                    />
                  )}

                  {(() => {
                    const classification = getChildClassification(childrenData[index]);
                    if (classification === 'independent_adult') return null;
                    if (classification === 'minor' && !childrenData[index]?.guardianPersonId) return null;
                    return (
                      <ConnectionsBelongingSection
                        childIndex={index}
                        childData={childrenData[index] || {}}
                        childrenData={childrenData}
                        planningPersons={planningPersons}
                        minorIndices={minorIndices}
                        classification={classification}
                        onChildChange={handleChildChange}
                        onChildMultiChange={handleChildMultiChange}
                        onPlanningPersonsChange={handlePlanningPersonsChange}
                      />
                    );
                  })()}
                </div>
              ))}
            </div>
            );
          })()}

          {/* Guardian Funding Philosophy — shown once after all children, only when there are minor children with guardians */}
          {step.sectionId === 'children' && (() => {
            const childrenData = (answers['childrenData'] as Array<Record<string, string>>) || [];
            const planningPersons = (answers['planningPersons'] as Array<Record<string, string>>) || [];
            const minorIndices = childrenData
              .map((c, i) => ({ c, i }))
              .filter(({ c }) => {
                if (c.disabled === 'yes' || c.disabled === 'not_sure') return c.independent !== 'yes';
                if (c.independent === 'yes') return false;
                return true;
              })
              .map(({ i }) => i);

            if (minorIndices.length === 0) return null;

            const hasGuardian = minorIndices.some(i => childrenData[i]?.guardianPersonId);
            if (!hasGuardian) return null;

            const fundingData = (answers['fundingPhilosophyData'] as Record<string, unknown>) || {};

            const handleFundingChange = (field: string, value: string) => {
              const updated = { ...fundingData, [field]: value };
              if (value === '') delete updated[field];
              onAnswerChange('fundingPhilosophyData', updated);
            };

            const guardianPersonIds: string[] = [];
            for (const i of minorIndices) {
              const gid = childrenData[i]?.guardianPersonId;
              if (gid && !guardianPersonIds.includes(gid)) guardianPersonIds.push(gid);
              const gid2 = childrenData[i]?.guardianPersonId2;
              if (gid2 && !guardianPersonIds.includes(gid2)) guardianPersonIds.push(gid2);
            }

            const allAns = allAnswers || new Map();
            const aboutYou = allAns.get('aboutYou') || {};
            void aboutYou;
            const minorChildNames = minorIndices.map(i => childrenData[i]?.nickname || childrenData[i]?.name || `Child ${i + 1}`);

            const childActivityNames: string[] = [];
            for (const i of minorIndices) {
              const activities = childrenData[i]?.activityList;
              if (activities) {
                try {
                  const parsed = JSON.parse(activities);
                  if (Array.isArray(parsed)) {
                    for (const a of parsed) {
                      if (a?.activityName && !childActivityNames.includes(a.activityName)) {
                        childActivityNames.push(a.activityName);
                      }
                    }
                  }
                } catch { /* ignore */ }
              }
            }

            const profAdvisors = getProfessionalAdvisors(allAns);
            const professionalContacts: { id: string; name: string; role: string }[] = profAdvisors
              .filter(a => a.active && a.name)
              .map(a => ({
                id: a.id,
                name: a.name,
                role: a.type === 'financial' ? 'Financial Planner'
                   : a.type === 'accountant' ? 'Accountant'
                   : a.type === 'lawyer' ? 'Lawyer'
                   : a.type === 'insurance' ? 'Insurance Advisor'
                   : 'Advisor',
              }));

            const estateTrustees = allAns.get('estateTrustees') || {};
            const wills = allAns.get('wills') || {};
            const willClients = ((wills.currentWillData as Record<string, unknown>)?.clients as Array<Record<string, unknown>>) || [];

            const fdmLabels: { role: string; name: string }[] = [];
            if (estateTrustees.client1HasEstateTrustee === 'yes' && estateTrustees.client1EstateTrusteeName) {
              fdmLabels.push({ role: 'Estate Trustee', name: String(estateTrustees.client1EstateTrusteeName) });
            }
            if (estateTrustees.client2HasEstateTrustee === 'yes' && estateTrustees.client2EstateTrusteeName) {
              fdmLabels.push({ role: 'Estate Trustee', name: String(estateTrustees.client2EstateTrusteeName) });
            }
            for (const client of willClients) {
              if (client.trustTrusteeName) {
                fdmLabels.push({ role: 'Inheritance Trustee', name: String(client.trustTrusteeName) });
              }
            }
            const powersOfAttorney = allAns.get('powersOfAttorney') || {};
            const poaPropData = (powersOfAttorney.poaPropertyData as Array<Record<string, unknown>>) || [];
            for (const atty of poaPropData) {
              if (atty.attorneyName) fdmLabels.push({ role: 'Attorney for Property', name: String(atty.attorneyName) });
            }

            const fundingPlanningPersons = (allAns.get('children')?.planningPersons as Array<{ id: string; name: string }>) || [];
            const fdmPersonIds = fdmLabels
              .map(f => {
                const pp = fundingPlanningPersons.find(p => p.name.toLowerCase() === f.name.toLowerCase());
                return pp?.id || `unresolved_${f.name.toLowerCase().replace(/\s+/g, '_')}`;
              });
            const fdmUnresolvedNames = fdmLabels
              .filter(f => !fundingPlanningPersons.some(p => p.name.toLowerCase() === f.name.toLowerCase()))
              .map(f => f.name);

            const coordinationCheck = areSamePeople(
              guardianPersonIds,
              [...new Set(fdmPersonIds)],
              [],
              fdmUnresolvedNames
            );
            const coordinationNeeded = fdmPersonIds.length > 0 && !coordinationCheck.same;

            return (
              <GuardianFundingSection
                fundingData={fundingData}
                onFundingChange={handleFundingChange}
                financialDecisionMakerLabels={fdmLabels}
                coordinationNeeded={coordinationNeeded}
                childActivityNames={childActivityNames}
                professionalContacts={professionalContacts}
                minorChildNames={minorChildNames}
              />
            );
          })()}



          {step.sectionId === 'realEstate' && (() => {
            const basicAnswers = allAnswers?.get('aboutYou') || {};
            const client1Name = (basicAnswers['fullName'] as string) || 'Client 1';
            const maritalStatus = basicAnswers['maritalStatus'] as string;
            const hasSpouseStep9 = maritalStatus === 'married' || maritalStatus === 'common_law';
            const client2Name = (basicAnswers['spouseName'] as string) || 'Client 2';

            // Keys suppressed because we render them in the custom ownership block
            const suppressedOwnershipKeys = new Set<string>([
              ...Array.from({ length: 10 }, (_, i) => [
                `property${i + 1}BeneficialOwnerLabel`,
              ]).flat(),
            ]);

            type OtherOwner = { name: string; phone: string; city: string; hasMore: 'yes' | 'no' | '' };

            const allFormData = Object.fromEntries(
              Array.from(allAnswers?.entries() || []).flatMap(([_, stepAnswers]) =>
                Object.entries(stepAnswers)
              )
            );

            const pgEntriesForCollateral = (allFormData['personalGuaranteesData'] as Array<{ selectedCompany?: string; pledgedAssets?: string[] }>) || [];
            const collateralCorporations = Array.from(new Set(
              pgEntriesForCollateral
                .filter(pg => pg.pledgedAssets?.some(a => a === 'personal_residence' || a === 'other_real_estate'))
                .map(pg => pg.selectedCompany)
                .filter((name): name is string => !!name?.trim())
            ));

            const isVisible = (question: typeof step.questions[0]) => {
              if (!question.condition) return true;
              return question.condition(allFormData);
            };

            // Separate global questions from per-property questions
            const globalQuestions = step.questions.filter(q => !/^property\d+/.test(q.key));
            const propertyCount = parseInt(answers['propertyCount'] as string || '0') || 0;

            // Split global questions into sections
            const rentQuestionKeys = new Set([
              'rentLandlordName', 'rentSameAddress', 'rentAddress', 'rentCity',
              'rentProvince', 'rentPostalCode', 'rentMonthlyAmount',
              'rentLeaseRenewalDate', 'rentLeaseStorage', 'rentAutoPayments',
              'rentSecurityDeposit', 'rentParkingStorage', 'rentKeyLocation', 'rentNotifyName',
            ]);
            const retQuestionKeys = new Set([
              'retLandlordName', 'retSameAddress', 'retAddress', 'retCity',
              'retProvince', 'retPostalCode', 'retMonthlyAmount',
              'retLeaseRenewalDate', 'retLeaseStorage', 'retAutoPayments',
              'retSecurityDeposit', 'retParkingStorage', 'retKeyLocation', 'retNotifyName',
            ]);
            const livingSituationQuestions = globalQuestions.filter(q => !rentQuestionKeys.has(q.key) && !retQuestionKeys.has(q.key) && q.key !== 'hasRealEstate' && q.key !== 'propertyCount' && q.key !== 'propertyTypes');
            const rentQuestions = globalQuestions.filter(q => rentQuestionKeys.has(q.key));
            const retQuestions = globalQuestions.filter(q => retQuestionKeys.has(q.key));
            const ownershipGateQuestions = globalQuestions.filter(q => q.key === 'hasRealEstate' || q.key === 'propertyCount' || q.key === 'propertyTypes');

            const renderQuestion = (question: typeof step.questions[0]) => {
              if (!isVisible(question)) return null;
              if (suppressedOwnershipKeys.has(question.key)) return null;

              const displayLabel = typeof question.label === 'function'
                ? question.label(allAnswers || new Map())
                : question.label;

              return (
                <FormField
                  key={question.key}
                  question={{ ...question, label: displayLabel }}
                  value={answers[question.key]}
                  onChange={(value) => onAnswerChange(question.key, value)}
                  answers={allAnswers}
                />
              );
            };

            return (
              <>
                {/* Where you live now subheading */}
                <h4 className="text-base font-semibold text-blue-400 mt-4 mb-1">Where you live now</h4>

                {/* Living situation questions */}
                {livingSituationQuestions.map(renderQuestion)}

                {/* Rent questions */}
                {rentQuestions.length > 0 && answers['livingSituation'] === 'rent' && (
                  <>
                    <h4 className="text-base font-semibold text-blue-400 mt-6 mb-1">Where you rent now</h4>
                    {rentQuestions.map(renderQuestion)}
                  </>
                )}

                {/* Retirement residence questions */}
                {retQuestions.length > 0 && answers['livingSituation'] === 'retirement' && (
                  <>
                    <h4 className="text-base font-semibold text-blue-400 mt-6 mb-1">Your retirement residence</h4>
                    {retQuestions.map(renderQuestion)}
                  </>
                )}

                {/* Primary Home subsection (only when living situation is 'own') */}
                {answers['livingSituation'] === 'own' && (() => {
                  // Build residence addresses from About You for reuse
                  const aboutYou = allAnswers?.get('aboutYou') || {};
                  const residenceAddresses: Array<{ label: string; streetAddress: string; city: string; province: string; postalCode: string; country: string }> = [];
                  const c1Addr = (aboutYou['address'] as string) || '';
                  if (c1Addr.trim()) {
                    residenceAddresses.push({
                      label: `${client1Name || 'Client 1'}'s residence`,
                      streetAddress: c1Addr,
                      city: (aboutYou['city'] as string) || '',
                      province: (aboutYou['province'] as string) || '',
                      postalCode: (aboutYou['postalCode'] as string) || '',
                      country: 'Canada',
                    });
                  }
                  const sameAddr = (aboutYou['spouseSameAddress'] as string) === 'yes';
                  if (hasSpouseStep9 && !sameAddr) {
                    const c2Addr = (aboutYou['spouseAddress'] as string) || '';
                    if (c2Addr.trim()) {
                      residenceAddresses.push({
                        label: `${client2Name || 'Client 2'}'s residence`,
                        streetAddress: c2Addr,
                        city: (aboutYou['spouseCity'] as string) || '',
                        province: (aboutYou['spouseProvince'] as string) || '',
                        postalCode: (aboutYou['spousePostalCode'] as string) || '',
                        country: 'Canada',
                      });
                    }
                  }

                  const primaryHomeData = (answers['primaryHomeData'] as Partial<PropertyData>) || { type: 'Primary Home', name: '', country: '', province: '', state: '', city: '', locationOfDeeds: '', owners: [], otherOwners: [], ownershipPercentages: {}, purchasePrice: '', documentsLocation: '', hasRenovations: '', capitalImprovements: [], coOwnershipAgreement: '', coOwnershipAgreementLocation: '', hasDebt: '', debtType: '' };

                  const handlePrimaryHomeChange = (field: keyof PropertyData, value: unknown) => {
                    const updated = { ...primaryHomeData, [field]: value };
                    onAnswerChange('primaryHomeData', updated);
                  };
                  const handlePrimaryHomeMultiChange = (updates: Partial<PropertyData>) => {
                    const updated = { ...primaryHomeData, ...updates };
                    onAnswerChange('primaryHomeData', updated);
                  };

                  // Gather predefined entities — trusts from familyTrustsData (canonical source)
                  const corporationsData = (allFormData['corporationsData'] as Array<Record<string, string>>) || [];
                  const familyTrustsData = (allFormData['familyTrustsData'] as Array<Record<string, unknown>>) || [];
                  const trusts: Array<{ name: string; entityId?: string }> = Array.from(new Set(
                    familyTrustsData
                      .map(t => ({ name: (t['legalName'] as string) || '', entityId: (t['entityId'] as string) || undefined }))
                      .filter(t => t.name.trim())
                    .concat(
                      // Legacy fallback: flat trust fields
                      [1,2,3,4].map(i => ({ name: (allFormData[`trust${i > 1 ? i : ''}LegalName`] as string) || '', entityId: undefined }))
                        .filter(t => t.name.trim())
                    )
                  ).values()).filter((t, i, arr) => arr.findIndex(x => x.name.toLowerCase() === t.name.toLowerCase()) === i);
                  const partnerships: string[] = [];
                  const c1Partnerships = (allFormData['client1PartnershipsData'] as Array<Record<string, string>>) || [];
                  c1Partnerships.forEach(p => { if (p.registeredName) partnerships.push(p.registeredName); });
                  const c2Partnerships = (allFormData['client2PartnershipsData'] as Array<Record<string, string>>) || [];
                  c2Partnerships.forEach(p => { if (p.registeredName) partnerships.push(p.registeredName); });

                  // Build corporations with entityId from entity registry
                  const trustEntities = registryEntities.filter(e => e.entityType === 'trust' && e.active);
                  const corpEntities = registryEntities.filter(e => e.entityType === 'corporation' && e.active);
                  const corporations: Array<{ legalName: string; entityId?: string }> = corporationsData.map(c => {
                    const match = corpEntities.find(e => e.normalizedName === (c.legalName || '').toLowerCase().replace(/\s+/g, ' ').trim());
                    return { legalName: c.legalName, entityId: match?.id };
                  }).filter(c => c.legalName?.trim());
                  // Enrich trusts with entity IDs from registry
                  trusts.forEach(t => {
                    if (!t.entityId) {
                      const match = trustEntities.find(e => e.normalizedName === t.name.toLowerCase().replace(/\s+/g, ' ').trim());
                      if (match) t.entityId = match.id;
                    }
                  });

                  // Retroactive entity creation callbacks
                  const handleAddTrustFromRE = (name: string) => {
                    const current = (allFormData['familyTrustsData'] as Array<Record<string, unknown>>) || [];
                    if (current.some(t => (t['legalName'] as string) === name)) return;
                    const newTrust = { id: `re-trust-${Date.now()}`, legalName: name, entityId: '' };
                    onAnswerChange('familyTrustsData', [...current, newTrust]);
                  };
                  const handleAddCorporationFromRE = (name: string) => {
                    const current = (allFormData['corporationsData'] as Array<Record<string, string>>) || [];
                    if (current.some(c => c.legalName === name)) return;
                    onAnswerChange('corporationsData', [...current, { legalName: name }]);
                  };

                  const predefinedPeople: Array<{ name: string; phone?: string; city?: string }> = [];
                  const seenPeople = new Set<string>();
                  const addPerson = (name?: string, phone?: string, city?: string) => {
                    const trimmed = (name || '').trim();
                    if (!trimmed || seenPeople.has(trimmed.toLowerCase())) return;
                    seenPeople.add(trimmed.toLowerCase());
                    predefinedPeople.push({ name: trimmed, phone: (phone || '').trim() || undefined, city: (city || '').trim() || undefined });
                  };
                  addPerson(basicAnswers['fullName'] as string);
                  if (hasSpouseStep9) addPerson(basicAnswers['spouseName'] as string, basicAnswers['spousePhone'] as string, basicAnswers['spouseCity'] as string);
                  ((allFormData['childrenData'] as Array<Record<string, string>>) || []).forEach(c => addPerson(c.name, c.phone, c.city));
                  ((allFormData['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || []).forEach(r => addPerson(r.name, r.phone, r.city));
                  ((allFormData['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || []).forEach(r => addPerson(r.name, r.phone, r.city));
                  const c1SoleProps = (allFormData['client1SolePropsData'] as Array<Record<string, string>>) || [];
                  c1SoleProps.forEach(sp => addPerson(sp.registeredName));

                  return (
                    <div className="mt-6 space-y-4">
                      <h4 className="text-base font-semibold text-blue-400 mb-1">Primary Home</h4>
                      <PropertyDetails
                        index={0}
                        propertyType="Primary Home"
                        data={primaryHomeData}
                        client1Name={client1Name}
                        client2Name={client2Name}
                        hasSpouse={hasSpouseStep9}
                        corporations={corporations}
                        trusts={trusts}
                        partnerships={partnerships}
                        predefinedPeople={predefinedPeople}
                        collateralCorporations={collateralCorporations}
                        residenceAddresses={residenceAddresses}
                        onAddTrust={handleAddTrustFromRE}
                        onAddCorporation={handleAddCorporationFromRE}
                        client1EntityId={client1EntityId}
                        client2EntityId={client2EntityId}
                        onChange={(field, value) => handlePrimaryHomeChange(field, value)}
                        onMultiChange={(updates) => handlePrimaryHomeMultiChange(updates)}
                      />
                    </div>
                  );
                })()}

                {/* Additional Properties subheading */}
                <h4 className="text-base font-semibold text-blue-400 mt-6 mb-1">Additional Properties</h4>

                {/* Real estate ownership question */}
                {ownershipGateQuestions.filter(q => q.key === 'hasRealEstate').map(renderQuestion)}

                {/* Property types and inline property forms */}
                {answers['hasRealEstate'] === 'yes' && (() => {
                  // Build residence addresses from About You for reuse
                  const aboutYou = allAnswers?.get('aboutYou') || {};
                  const residenceAddresses: Array<{ label: string; streetAddress: string; city: string; province: string; postalCode: string; country: string }> = [];
                  const c1Addr = (aboutYou['address'] as string) || '';
                  if (c1Addr.trim()) {
                    residenceAddresses.push({
                      label: `${client1Name || 'Client 1'}'s residence`,
                      streetAddress: c1Addr,
                      city: (aboutYou['city'] as string) || '',
                      province: (aboutYou['province'] as string) || '',
                      postalCode: (aboutYou['postalCode'] as string) || '',
                      country: 'Canada',
                    });
                  }
                  const sameAddr = (aboutYou['spouseSameAddress'] as string) === 'yes';
                  if (hasSpouseStep9 && !sameAddr) {
                    const c2Addr = (aboutYou['spouseAddress'] as string) || '';
                    if (c2Addr.trim()) {
                      residenceAddresses.push({
                        label: `${client2Name || 'Client 2'}'s residence`,
                        streetAddress: c2Addr,
                        city: (aboutYou['spouseCity'] as string) || '',
                        province: (aboutYou['spouseProvince'] as string) || '',
                        postalCode: (aboutYou['spousePostalCode'] as string) || '',
                        country: 'Canada',
                      });
                    }
                  }

                  const PROPERTY_TYPES = answers['livingSituation'] === 'own'
                    ? ['Secondary residence', 'Cottage', 'Vacation property', 'Rental property',
                       'Commercial property', 'Vacant land', 'Farm', 'Condo', 'Foreign property', 'Other']
                    : ['Primary residence', 'Cottage', 'Vacation property', 'Rental property',
                       'Commercial property', 'Vacant land', 'Farm', 'Condo', 'Foreign property', 'Other'];
                  const selectedTypes = (answers['propertyTypes'] as string[]) || [];
                  const propertiesData = (answers['propertiesData'] as Array<Partial<PropertyData>>) || [];

                  const handleTypeToggle = (type: string, checked: boolean) => {
                    let updated: string[];
                    if (checked) {
                      updated = [...selectedTypes, type];
                    } else {
                      updated = selectedTypes.filter(t => t !== type);
                      const newPropsData = propertiesData.filter(p => p.type !== type);
                      onAnswerChange('propertiesData', newPropsData);
                    }
                    onAnswerChange('propertyTypes', updated);
                  };

                  const handlePropertyChange = (propIndex: number, field: keyof PropertyData, value: unknown) => {
                    const updated = [...propertiesData];
                    if (!updated[propIndex]) updated[propIndex] = { type: selectedTypes[propIndex] };
                    updated[propIndex] = { ...updated[propIndex], [field]: value };
                    onAnswerChange('propertiesData', updated);
                  };

                  const handlePropertyMultiChange = (propIndex: number, updates: Partial<PropertyData>) => {
                    const updated = [...propertiesData];
                    if (!updated[propIndex]) updated[propIndex] = { type: selectedTypes[propIndex] };
                    updated[propIndex] = { ...updated[propIndex], ...updates };
                    onAnswerChange('propertiesData', updated);
                  };

                  // Gather predefined entities — trusts from familyTrustsData (canonical source)
                  const corporationsData = (allFormData['corporationsData'] as Array<Record<string, string>>) || [];
                  const familyTrustsData = (allFormData['familyTrustsData'] as Array<Record<string, unknown>>) || [];
                  const trusts: Array<{ name: string; entityId?: string }> = Array.from(new Set(
                    familyTrustsData
                      .map(t => ({ name: (t['legalName'] as string) || '', entityId: (t['entityId'] as string) || undefined }))
                      .filter(t => t.name.trim())
                    .concat(
                      [1,2,3,4].map(i => ({ name: (allFormData[`trust${i > 1 ? i : ''}LegalName`] as string) || '', entityId: undefined }))
                        .filter(t => t.name.trim())
                    )
                  ).values()).filter((t, i, arr) => arr.findIndex(x => x.name.toLowerCase() === t.name.toLowerCase()) === i);
                  const partnerships: string[] = [];
                  const c1Partnerships = (allFormData['client1PartnershipsData'] as Array<Record<string, string>>) || [];
                  c1Partnerships.forEach(p => { if (p.registeredName) partnerships.push(p.registeredName); });
                  const c2Partnerships = (allFormData['client2PartnershipsData'] as Array<Record<string, string>>) || [];
                  c2Partnerships.forEach(p => { if (p.registeredName) partnerships.push(p.registeredName); });

                  // Build corporations with entityId from entity registry
                  const trustEntities = registryEntities.filter(e => e.entityType === 'trust' && e.active);
                  const corpEntities = registryEntities.filter(e => e.entityType === 'corporation' && e.active);
                  const corporations: Array<{ legalName: string; entityId?: string }> = corporationsData.map(c => {
                    const match = corpEntities.find(e => e.normalizedName === (c.legalName || '').toLowerCase().replace(/\s+/g, ' ').trim());
                    return { legalName: c.legalName, entityId: match?.id };
                  }).filter(c => c.legalName?.trim());
                  trusts.forEach(t => {
                    if (!t.entityId) {
                      const match = trustEntities.find(e => e.normalizedName === t.name.toLowerCase().replace(/\s+/g, ' ').trim());
      if (match) t.entityId = match.id;
                    }
                  });

                  // Retroactive entity creation callbacks
                  const handleAddTrustFromRE = (name: string) => {
                    const current = (allFormData['familyTrustsData'] as Array<Record<string, unknown>>) || [];
                    if (current.some(t => (t['legalName'] as string) === name)) return;
                    const newTrust = { id: `re-trust-${Date.now()}`, legalName: name, entityId: '' };
                    onAnswerChange('familyTrustsData', [...current, newTrust]);
                  };
                  const handleAddCorporationFromRE = (name: string) => {
                    const current = (allFormData['corporationsData'] as Array<Record<string, string>>) || [];
                    if (current.some(c => c.legalName === name)) return;
                    onAnswerChange('corporationsData', [...current, { legalName: name }]);
                  };

                  // Predefined people (already identified)
                  const predefinedPeople: Array<{ name: string; phone?: string; city?: string }> = [];
                  const seenPeople = new Set<string>();
                  const addPerson = (name?: string, phone?: string, city?: string) => {
                    const trimmed = (name || '').trim();
                    if (!trimmed || seenPeople.has(trimmed.toLowerCase())) return;
                    seenPeople.add(trimmed.toLowerCase());
                    predefinedPeople.push({ name: trimmed, phone: (phone || '').trim() || undefined, city: (city || '').trim() || undefined });
                  };
                  addPerson(basicAnswers['fullName'] as string);
                  if (hasSpouseStep9) addPerson(basicAnswers['spouseName'] as string, basicAnswers['spousePhone'] as string, basicAnswers['spouseCity'] as string);
                  ((allFormData['childrenData'] as Array<Record<string, string>>) || []).forEach(c => addPerson(c.name, c.phone, c.city));
                  ((allFormData['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || []).forEach(r => addPerson(r.name, r.phone, r.city));
                  ((allFormData['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || []).forEach(r => addPerson(r.name, r.phone, r.city));
                  const c1SoleProps = (allFormData['client1SolePropsData'] as Array<Record<string, string>>) || [];
                  c1SoleProps.forEach(sp => addPerson(sp.registeredName));

                  return (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Which types of property do you own?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {PROPERTY_TYPES.map((type) => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedTypes.includes(type)}
                                onChange={(e) => handleTypeToggle(type, e.target.checked)}
                                className="mr-2"
                              />
                              <span className="text-white">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {selectedTypes.map((type, typeIndex) => {
                        const propIndex = propertiesData.findIndex(p => p.type === type);
                        const actualIndex = propIndex >= 0 ? propIndex : propertiesData.length;
                        if (propIndex < 0) {
                          // Initialize property data for this type
                          setTimeout(() => {
                            const updated = [...propertiesData];
                            updated[actualIndex] = { type, name: '', country: '', province: '', state: '', city: '', locationOfDeeds: '', owners: [], otherOwners: [], ownershipPercentages: {}, purchasePrice: '', documentsLocation: '', hasRenovations: '', capitalImprovements: [], coOwnershipAgreement: '', coOwnershipAgreementLocation: '', hasDebt: '', debtType: '' };
                            onAnswerChange('propertiesData', updated);
                          }, 0);
                        }
                        return (
                          <PropertyDetails
                            key={type}
                            index={typeIndex}
                            propertyType={type}
                            data={propertiesData[actualIndex] || { type }}
                            client1Name={client1Name}
                            client2Name={client2Name}
                            hasSpouse={hasSpouseStep9}
                            corporations={corporations}
                            trusts={trusts}
                            partnerships={partnerships}
                            predefinedPeople={predefinedPeople}
                            collateralCorporations={collateralCorporations}
                            residenceAddresses={residenceAddresses}
                            onAddTrust={handleAddTrustFromRE}
                            onAddCorporation={handleAddCorporationFromRE}
                            client1EntityId={client1EntityId}
                            client2EntityId={client2EntityId}
                            onChange={(field, value) => handlePropertyChange(actualIndex, field, value)}
                            onMultiChange={(updates) => handlePropertyMultiChange(actualIndex, updates)}
                          />
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            );
          })()}

          {step.sectionId === 'debtObligations' && (
            <DebtObligations
              answers={answers}
              allAnswers={allAnswers}
              onAnswerChange={onAnswerChange}
              onUpdateFootprint={onUpdateFootprint}
            />
          )}

          {step.sectionId === 'workplacePensionsBenefits' && (
            <WorkplacePensionsBenefits
              answers={answers}
              allAnswers={allAnswers}
              onAnswerChange={onAnswerChange}
              onUpdateFootprint={onUpdateFootprint}
            />
          )}

          {step.sectionId === 'propertyLiabilityInsurance' && (
            <PropertyLiabilityInsuranceSection
              answers={answers}
              allAnswers={allAnswers}
              onAnswerChange={onAnswerChange}
              onUpdateFootprint={onUpdateFootprint}
            />
          )}
          {step.sectionId === 'funeralArrangements' && (
            <FinalWishesArrangementsSection
              answers={answers}
              allAnswers={allAnswers || new Map()}
              onAnswerChange={onAnswerChange}
            />
          )}

          {step.sectionId === 'powersOfAttorney' && (() => {
            const basicAnswers = allAnswers?.get('aboutYou') || {};
            const client1Name = (basicAnswers['fullName'] as string) || 'Client 1';
            const client2Name = (basicAnswers['spouseName'] as string) || 'Client 2';
            const maritalStatus = basicAnswers['maritalStatus'] as string;
            const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';

            const allFormData = Object.fromEntries(
              Array.from(allAnswers?.entries() || []).flatMap(([_, stepAnswers]) =>
                Object.entries(stepAnswers)
              )
            );

            const isVisible = (question: typeof step.questions[0]) => {
              if (!question.condition) return true;
              return question.condition(allFormData);
            };

            const renderQuestion = (question: typeof step.questions[0]) => {
              if (!isVisible(question)) return null;
              const displayLabel = typeof question.label === 'function'
                ? question.label(allAnswers || new Map())
                : question.label;
              return (
                <FormField
                  key={question.key}
                  question={{ ...question, label: displayLabel }}
                  value={answers[question.key]}
                  onChange={(value) => onAnswerChange(question.key, value)}
                  answers={allAnswers}
                />
              );
            };

            // Personal Care question keys (rendered via FormField, preserving existing behavior)
            const personalCareKeys = new Set([
              'client1HasPoaPersonalCare', 'client1SpouseIsPoaPersonalCare', 'client1PoaPersonalCareName',
              'client1PoaPersonalCarePhone', 'client1PoaPersonalCareEmail', 'client1PoaPersonalCareRelationship',
              'client1PoaPersonalCareIsCanadaResident', 'client1PoaPersonalCareCountry', 'client1PoaPersonalCareProvince',
              'client1PoaPersonalCareCity', 'client1PoaPersonalCareHasDocCopy',
              'client1HasAlternatePoaPersonalCare', 'client1AlternatePoaPersonalCareCount',
              'client1HasLivingWill',
              'client2HasPoaPersonalCare', 'client2SpouseIsPoaPersonalCare', 'client2PoaPersonalCareName',
              'client2PoaPersonalCarePhone', 'client2PoaPersonalCareEmail', 'client2PoaPersonalCareRelationship',
              'client2PoaPersonalCareCountry', 'client2PoaPersonalCareProvince', 'client2PoaPersonalCareCity',
              'client2PoaPersonalCareHasDocCopy',
              'client2HasAlternatePoaPersonalCare', 'client2AlternatePoaPersonalCareCount',
              'client2HasLivingWill',
            ]);

            // POA Property gate question keys (rendered via FormField)
            const poaPropertyGateKeys = new Set([
              'client1HasPoaProperty', 'spouseIsPoaProperty',
              'client2HasPoaProperty', 'client2SpouseIsPoaProperty',
            ]);

            // Build predefined people list from all answers
            const predefinedPeople: Array<{ name: string; phone?: string; city?: string }> = [];
            const seenPeople = new Set<string>();
            const addPerson = (name?: string, phone?: string, city?: string) => {
              const trimmed = (name || '').trim();
              if (!trimmed || seenPeople.has(trimmed.toLowerCase())) return;
              seenPeople.add(trimmed.toLowerCase());
              predefinedPeople.push({ name: trimmed, phone: (phone || '').trim() || undefined, city: (city || '').trim() || undefined });
            };
            addPerson(basicAnswers['fullName'] as string);
            if (hasSpouse) addPerson(basicAnswers['spouseName'] as string, basicAnswers['spousePhone'] as string, basicAnswers['spouseCity'] as string);
            ((allFormData['childrenData'] as Array<Record<string, string>>) || []).forEach(c => addPerson(c.name, c.phone, c.city));
            ((allFormData['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || []).forEach(r => addPerson(r.name, r.phone, r.city));
            ((allFormData['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || []).forEach(r => addPerson(r.name, r.phone, r.city));

            const labelClass = 'block text-sm font-medium text-gray-300 mb-2';
            const inputClass = 'w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

            const renderContingentAttorneys = (prefix: 'client1' | 'client2', clientName: string) => {
              const count = prefix === 'client1' ? client1AlternatePoaPersonalCareCount : client2AlternatePoaPersonalCareCount;
              const data = prefix === 'client1' ? client1AlternatePoaPersonalCareData : client2AlternatePoaPersonalCareData;
              const handleChange = prefix === 'client1' ? handleAlternatePoaPersonalCareChange : handleClient2AlternatePoaPersonalCareChange;
              const hasAlternate = answers[`${prefix}HasAlternatePoaPersonalCare`] as string;

              if (hasAlternate !== 'yes' || count === 0) return null;

              return (
                <div className="space-y-6 mt-6">
                  <h4 className="text-base font-semibold text-white">Contingent Attorneys for Personal Care</h4>
                  {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-5">
                      <div className="flex items-center gap-3 pb-3 border-b border-gray-600">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
                          {index + 1}
                        </div>
                        <h5 className="text-lg font-semibold text-white">{data[index]?.name?.trim() || `Contingent Attorney ${index + 1}`}</h5>
                      </div>

                      {/* Name */}
                      <div>
                        <label className={labelClass}>Attorney Name</label>
                        <input type="text" value={data[index]?.name || ''} onChange={(e) => handleChange(index, 'name', e.target.value)} placeholder="Enter full name" className={inputClass} />
                      </div>
                      {/* Phone */}
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input type="tel" value={data[index]?.phone || ''} onChange={(e) => handleChange(index, 'phone', e.target.value)} placeholder="Enter phone number" className={inputClass} />
                      </div>
                      {/* Email */}
                      <div>
                        <label className={labelClass}>Email</label>
                        <input type="email" value={data[index]?.email || ''} onChange={(e) => handleChange(index, 'email', e.target.value)} placeholder="Enter email address" className={inputClass} />
                      </div>
                      {/* Relationship */}
                      <div>
                        <label className={labelClass}>Relationship to {clientName}</label>
                        <input type="text" value={data[index]?.relationship || ''} onChange={(e) => handleChange(index, 'relationship', e.target.value)} placeholder="e.g., Spouse, Son, Daughter, Friend" className={inputClass} />
                      </div>
                      {/* Canadian resident? */}
                      <div>
                        <label className={labelClass}>Canadian resident?</label>
                        <div className="flex gap-4">
                          {['yes', 'no', 'unknown'].map((val) => (
                            <label key={val} className="flex items-center">
                              <input type="radio" name={`cont-pc-canada-${prefix}-${index}`} value={val} checked={data[index]?.isCanadaResident === val} onChange={() => handleChange(index, 'isCanadaResident', val)} className="mr-2" />
                              <span className="text-gray-300">{val === 'unknown' ? 'Unknown' : val === 'yes' ? 'Yes' : 'No'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Country (if not Canadian resident) */}
                      {data[index]?.isCanadaResident !== 'yes' && (
                        <div>
                          <label className={labelClass}>Country</label>
                          <input type="text" value={data[index]?.country || ''} onChange={(e) => handleChange(index, 'country', e.target.value)} placeholder="Enter country" className={inputClass} />
                        </div>
                      )}
                      {/* Province */}
                      <div>
                        <label className={labelClass}>Province</label>
                        <input type="text" value={data[index]?.province || ''} onChange={(e) => handleChange(index, 'province', e.target.value)} placeholder="Enter province" className={inputClass} />
                      </div>
                      {/* City */}
                      <div>
                        <label className={labelClass}>City</label>
                        <input type="text" value={data[index]?.city || ''} onChange={(e) => handleChange(index, 'city', e.target.value)} placeholder="Enter city" className={inputClass} />
                      </div>
                      {/* Has doc copy */}
                      <div>
                        <label className={labelClass}>Does {data[index]?.name?.trim() || `this attorney`} have a copy of your Power of Attorney for Personal Care document?</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="radio" name={`cont-pc-doc-${prefix}-${index}`} value="yes_on_file" checked={data[index]?.hasDocCopy === 'yes_on_file'} onChange={() => handleChange(index, 'hasDocCopy', 'yes_on_file')} className="mr-2" />
                            <span className="text-gray-300">Yes, they have a copy on file</span>
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name={`cont-pc-doc-${prefix}-${index}`} value="no_can_access" checked={data[index]?.hasDocCopy === 'no_can_access'} onChange={() => handleChange(index, 'hasDocCopy', 'no_can_access')} className="mr-2" />
                            <span className="text-gray-300">No, but they know where to access it</span>
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name={`cont-pc-doc-${prefix}-${index}`} value="no_not_discussed" checked={data[index]?.hasDocCopy === 'no_not_discussed'} onChange={() => handleChange(index, 'hasDocCopy', 'no_not_discussed')} className="mr-2" />
                            <span className="text-gray-300">No, this has not been discussed</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            };

            // --- Attorney data helpers ---
            const getAttorneys = (prefix: 'client1' | 'client2'): PoaPropertyAttorneyData[] => {
              const data = answers[`${prefix}PoaPropertyAttorneysData`] as PoaPropertyAttorneyData[] | undefined;
              return data || [];
            };

            const getAlternateAttorneys = (prefix: 'client1' | 'client2'): PoaPropertyAttorneyData[] => {
              const data = answers[`${prefix}PoaPropertyAlternateAttorneysData`] as PoaPropertyAttorneyData[] | undefined;
              return data || [];
            };

            const updateAttorneys = (prefix: 'client1' | 'client2', data: PoaPropertyAttorneyData[]) => {
              onAnswerChange(`${prefix}PoaPropertyAttorneysData`, data.length > 0 ? data : undefined);
            };

            const updateAlternateAttorneys = (prefix: 'client1' | 'client2', data: PoaPropertyAttorneyData[]) => {
              onAnswerChange(`${prefix}PoaPropertyAlternateAttorneysData`, data.length > 0 ? data : undefined);
            };

            const addAttorney = (prefix: 'client1' | 'client2') => {
              const current = getAttorneys(prefix);
              updateAttorneys(prefix, [...current, { id: `att-${prefix}-${Date.now()}-${current.length}` } as PoaPropertyAttorneyData]);
            };

            const addAlternateAttorney = (prefix: 'client1' | 'client2') => {
              const current = getAlternateAttorneys(prefix);
              updateAlternateAttorneys(prefix, [...current, { id: `alt-${prefix}-${Date.now()}-${current.length}` } as PoaPropertyAttorneyData]);
            };

            const removeAttorney = (prefix: 'client1' | 'client2', index: number) => {
              const current = getAttorneys(prefix);
              updateAttorneys(prefix, current.filter((_, i) => i !== index));
            };

            const removeAlternateAttorney = (prefix: 'client1' | 'client2', index: number) => {
              const current = getAlternateAttorneys(prefix);
              updateAlternateAttorneys(prefix, current.filter((_, i) => i !== index));
            };

            const handleAttorneyChange = (prefix: 'client1' | 'client2', index: number, field: keyof PoaPropertyAttorneyData, value: unknown) => {
              const current = getAttorneys(prefix);
              const updated = [...current];
              updated[index] = { ...updated[index], [field]: value as string };
              updateAttorneys(prefix, updated);
            };

            const handleAttorneyMultiChange = (prefix: 'client1' | 'client2', index: number, updates: Partial<PoaPropertyAttorneyData>) => {
              const current = getAttorneys(prefix);
              const updated = [...current];
              updated[index] = { ...updated[index], ...updates };
              updateAttorneys(prefix, updated);
            };

            const handleAlternateAttorneyChange = (prefix: 'client1' | 'client2', index: number, field: keyof PoaPropertyAttorneyData, value: unknown) => {
              const current = getAlternateAttorneys(prefix);
              const updated = [...current];
              updated[index] = { ...updated[index], [field]: value as string };
              updateAlternateAttorneys(prefix, updated);
            };

            const handleAlternateAttorneyMultiChange = (prefix: 'client1' | 'client2', index: number, updates: Partial<PoaPropertyAttorneyData>) => {
              const current = getAlternateAttorneys(prefix);
              const updated = [...current];
              updated[index] = { ...updated[index], ...updates };
              updateAlternateAttorneys(prefix, updated);
            };

            const PROVINCES = [
              'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
              'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
              'Quebec', 'Saskatchewan', 'Yukon',
            ];

            const renderPoaPropertySection = (prefix: 'client1' | 'client2', clientName: string, spouseName: string) => {
              const hasPoa = answers[`${prefix}HasPoaProperty`] as string;
              const gateQuestions = step.questions.filter(q =>
                (prefix === 'client1' ? ['client1HasPoaProperty', 'spouseIsPoaProperty'] : ['client2HasPoaProperty', 'client2SpouseIsPoaProperty']).includes(q.key)
              );
              const attorneys = getAttorneys(prefix);
              const alternateAttorneys = getAlternateAttorneys(prefix);
              const hasAlternate = answers[`${prefix}HasAlternatePoaPropertyAttorney`] as string;
              const howAct = answers[`${prefix}PoaPropertyAttorneysHowAct`] as string;
              const docLocationKnown = answers[`${prefix}PoaPropertyDocLocationKnown`] as string;
              const docJurisdiction = answers[`${prefix}PoaPropertyDocJurisdiction`] as string;
              const hasImmediateAttention = answers[`${prefix}PoaPropertyHasImmediateAttention`] as string;

              return (
                <div className="space-y-6">
                  {/* A. Gate questions */}
                  {gateQuestions.map(renderQuestion)}

                  {/* Hidden risk flag — no POA */}
                  {hasPoa === 'no' && (
                    <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                      <p className="text-sm text-amber-300">
                        No Power of Attorney for Property has been identified for {clientName}. This will be flagged in the Hidden Risks Report.
                      </p>
                    </div>
                  )}

                  {/* Review flag — not sure */}
                  {hasPoa === 'not_sure' && (
                    <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                      <p className="text-sm text-blue-300">
                        This will be flagged for review. You may want to confirm whether {clientName} has a Power of Attorney for Property.
                      </p>
                    </div>
                  )}

                  {hasPoa === 'yes' && (
                    <>
                      {/* B. Primary attorneys */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-semibold text-white">Attorneys for Property</h4>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); addAttorney(prefix); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-400 rounded-lg transition-colors hover:bg-blue-400/10"
                          >
                            <Plus size={16} /> Add Attorney
                          </button>
                        </div>
                        {attorneys.length === 0 && (
                          <p className="text-sm text-gray-400">No attorneys added yet. Click "Add Attorney" to add one.</p>
                        )}
                        {attorneys.map((attorney, index) => (
                          <PoaPropertyAttorneyDetails
                            key={attorney.id || index}
                            index={index}
                            data={attorney}
                            clientName={clientName}
                            variant="primary"
                            predefinedPeople={predefinedPeople}
                            onChange={(field, value) => handleAttorneyChange(prefix, index, field, value)}
                            onMultiChange={(updates) => handleAttorneyMultiChange(prefix, index, updates)}
                            onRemove={() => removeAttorney(prefix, index)}
                            canRemove={attorneys.length > 1}
                          />
                        ))}
                      </div>

                      {/* C. Multiple attorneys */}
                      {attorneys.length > 1 && (
                        <div className="space-y-4">
                          <div>
                            <label className={labelClass}>How are your attorneys authorized to make decisions?</label>
                            <div className="space-y-2">
                              {[
                                { value: 'together', label: 'They must act together' },
                                { value: 'separately', label: 'They may act separately' },
                                { value: 'mixed', label: 'Some decisions require them to act together' },
                                { value: 'not_sure', label: "I'm not sure" },
                                { value: 'other', label: 'Other' },
                              ].map((opt) => (
                                <label key={opt.value} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`${prefix}-poa-property-how-act`}
                                    value={opt.value}
                                    checked={howAct === opt.value}
                                    onChange={() => onAnswerChange(`${prefix}PoaPropertyAttorneysHowAct`, opt.value)}
                                    className="mr-3"
                                  />
                                  <span className="text-gray-300">{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          {howAct === 'other' && (
                            <div>
                              <label className={labelClass}>Please explain</label>
                              <input
                                type="text"
                                value={(answers[`${prefix}PoaPropertyAttorneysHowActOther`] as string) || ''}
                                onChange={(e) => onAnswerChange(`${prefix}PoaPropertyAttorneysHowActOther`, e.target.value)}
                                placeholder="Explain how they are authorized to act"
                                className={inputClass}
                              />
                            </div>
                          )}
                          <div>
                            <label className={labelClass}>Is there anything important about how your attorneys are expected to work together?</label>
                            <textarea
                              value={(answers[`${prefix}PoaPropertyAttorneyNotes`] as string) || ''}
                              onChange={(e) => onAnswerChange(`${prefix}PoaPropertyAttorneyNotes`, e.target.value)}
                              placeholder="Optional — share any details about how your attorneys should work together"
                              rows={3}
                              className={inputClass}
                            />
                            <p className="text-xs text-gray-500 mt-1">This is for informational purposes only and does not constitute legal advice.</p>
                          </div>
                        </div>
                      )}

                      {/* D. Alternate attorneys */}
                      <div className="space-y-4">
                        <div>
                          <label className={labelClass}>Is anyone named to act if your primary attorney(s) cannot or will not act?</label>
                          <div className="flex gap-4">
                            {['yes', 'no', 'not_sure'].map((val) => (
                              <label key={val} className="flex items-center">
                                <input
                                  type="radio"
                                  name={`${prefix}-poa-property-has-alt`}
                                  value={val}
                                  checked={hasAlternate === val}
                                  onChange={() => onAnswerChange(`${prefix}HasAlternatePoaPropertyAttorney`, val)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">{val === 'not_sure' ? "I'm not sure" : val === 'yes' ? 'Yes' : 'No'}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {hasAlternate === 'yes' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-semibold text-white">Alternate Attorneys</h4>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); addAlternateAttorney(prefix); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-400 rounded-lg transition-colors hover:bg-blue-400/10"
                              >
                                <Plus size={16} /> Add Alternate
                              </button>
                            </div>
                            {alternateAttorneys.length === 0 && (
                              <p className="text-sm text-gray-400">No alternate attorneys added yet. Click "Add Alternate" to add one.</p>
                            )}
                            {alternateAttorneys.map((attorney, index) => (
                              <PoaPropertyAttorneyDetails
                                key={attorney.id || index}
                                index={index}
                                data={attorney}
                                clientName={clientName}
                                variant="alternate"
                                predefinedPeople={predefinedPeople}
                                onChange={(field, value) => handleAlternateAttorneyChange(prefix, index, field, value)}
                                onMultiChange={(updates) => handleAlternateAttorneyMultiChange(prefix, index, updates)}
                                onRemove={() => removeAlternateAttorney(prefix, index)}
                                canRemove={alternateAttorneys.length > 1}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* F. Document location */}
                      <div className="space-y-4">
                        <div>
                          <label className={labelClass}>Do you know where the original Power of Attorney for Property document is located?</label>
                          <div className="flex gap-4">
                            {['yes', 'no', 'not_sure'].map((val) => (
                              <label key={val} className="flex items-center">
                                <input
                                  type="radio"
                                  name={`${prefix}-poa-property-doc-loc-known`}
                                  value={val}
                                  checked={docLocationKnown === val}
                                  onChange={() => onAnswerChange(`${prefix}PoaPropertyDocLocationKnown`, val)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">{val === 'not_sure' ? "I'm not sure" : val === 'yes' ? 'Yes' : 'No'}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {docLocationKnown === 'yes' && (
                          <div>
                            <DocumentLocationPicker
                              label="Where is the original Power of Attorney for Property stored?"
                              value={answers[`${prefix}PoaPropertyDocLocation`] as unknown}
                              onChange={(val) => onAnswerChange(`${prefix}PoaPropertyDocLocation`, val)}
                              placeholder="e.g., Home safe, Lawyer's office, Bank safety deposit box"
                            />
                          </div>
                        )}
                      </div>

                      {/* G. Document details */}
                      <div className="space-y-4">
                        <div>
                          <label className={labelClass}>Approximately when was your Power of Attorney for Property signed?</label>
                          <input
                            type="text"
                            value={(answers[`${prefix}PoaPropertyDocYear`] as string) || ''}
                            onChange={(e) => onAnswerChange(`${prefix}PoaPropertyDocYear`, e.target.value)}
                            placeholder="Year (e.g., 2020) — or 'I'm not sure'"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Which province or territory is the document from?</label>
                          <select
                            value={docJurisdiction || ''}
                            onChange={(e) => onAnswerChange(`${prefix}PoaPropertyDocJurisdiction`, e.target.value)}
                            className={inputClass}
                          >
                            <option value="">Select province or territory</option>
                            {PROVINCES.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                            <option value="other">Other / Outside Canada</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">This is informational only and does not provide a legal conclusion about validity.</p>
                        </div>
                        {docJurisdiction === 'other' && (
                          <div>
                            <label className={labelClass}>Jurisdiction / Country</label>
                            <input
                              type="text"
                              value={(answers[`${prefix}PoaPropertyDocCountry`] as string) || ''}
                              onChange={(e) => onAnswerChange(`${prefix}PoaPropertyDocCountry`, e.target.value)}
                              placeholder="Enter jurisdiction or country"
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>

                      {/* H. Financial continuity instructions */}
                      <div className="space-y-4">
                        <div>
                          <label className={labelClass}>
                            If your attorney ever needed to step in unexpectedly, is there anything about your financial affairs that you would especially want them to know?
                          </label>
                          <textarea
                            value={(answers[`${prefix}PoaPropertyFinancialInstructions`] as string) || ''}
                            onChange={(e) => onAnswerChange(`${prefix}PoaPropertyFinancialInstructions`, e.target.value)}
                            placeholder="Consider important responsibilities, unusual arrangements, people they should contact, or anything that may not be obvious from your financial records. You do not need to repeat information you've already provided elsewhere in the questionnaire."
                            rows={4}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Are there any payments, financial responsibilities or arrangements that would need someone's immediate attention?</label>
                          <div className="flex gap-4">
                            {['yes', 'no', 'not_sure'].map((val) => (
                              <label key={val} className="flex items-center">
                                <input
                                  type="radio"
                                  name={`${prefix}-poa-property-immediate`}
                                  value={val}
                                  checked={hasImmediateAttention === val}
                                  onChange={() => onAnswerChange(`${prefix}PoaPropertyHasImmediateAttention`, val)}
                                  className="mr-2"
                                />
                                <span className="text-gray-300">{val === 'not_sure' ? "I'm not sure" : val === 'yes' ? 'Yes' : 'No'}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {hasImmediateAttention === 'yes' && (
                          <div>
                            <label className={labelClass}>What would need attention?</label>
                            <textarea
                              value={(answers[`${prefix}PoaPropertyImmediateAttentionDetails`] as string) || ''}
                              onChange={(e) => onAnswerChange(`${prefix}PoaPropertyImmediateAttentionDetails`, e.target.value)}
                              placeholder="Describe what would need immediate attention. Do not re-enter mortgages, loans or other obligations already captured elsewhere — this is for practical instructions or things the structured questionnaire may not reveal."
                              rows={3}
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            };

            const personalCareQuestions = step.questions.filter(q => personalCareKeys.has(q.key));
            const client1PersonalCare = personalCareQuestions.filter(q => !q.key.startsWith('client2'));
            const client2PersonalCare = personalCareQuestions.filter(q => q.key.startsWith('client2'));

            return (
              <>
                <Subsection title={`${client1Name} — Power of Attorney for Personal Care`}>
                  {client1PersonalCare.map(renderQuestion)}
                  {renderContingentAttorneys('client1', client1Name)}
                </Subsection>
                {hasSpouse && (
                  <Subsection title={`${client2Name} — Power of Attorney for Personal Care`}>
                    {client2PersonalCare.map(renderQuestion)}
                    {renderContingentAttorneys('client2', client2Name)}
                  </Subsection>
                )}
                <Subsection title={`${client1Name} — Power of Attorney for Property`}>
                  {renderPoaPropertySection('client1', client1Name, client2Name)}
                </Subsection>
                {hasSpouse && (
                  <Subsection title={`${client2Name} — Power of Attorney for Property`}>
                    {renderPoaPropertySection('client2', client2Name, client1Name)}
                  </Subsection>
                )}
              </>
            );
          })()}

          {step.sectionId === 'estateTrustees' && (() => {
            const basicAnswers = allAnswers?.get('aboutYou') || {};
            const client1Name = (basicAnswers['fullName'] as string) || 'Client 1';
            const client2Name = (basicAnswers['spouseName'] as string) || 'Client 2';
            const maritalStatus = basicAnswers['maritalStatus'] as string;
            const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';

            const allFormData = Object.fromEntries(
              Array.from(allAnswers?.entries() || []).flatMap(([_, stepAnswers]) =>
                Object.entries(stepAnswers)
              )
            );

            const isVisible = (question: typeof step.questions[0]) => {
              if (!question.condition) return true;
              return question.condition(allFormData);
            };

            const renderQuestion = (question: typeof step.questions[0]) => {
              if (!isVisible(question)) return null;
              const displayLabel = typeof question.label === 'function'
                ? question.label(allAnswers || new Map())
                : question.label;
              return (
                <FormField
                  key={question.key}
                  question={{ ...question, label: displayLabel }}
                  value={answers[question.key]}
                  onChange={(value) => onAnswerChange(question.key, value)}
                  answers={allAnswers}
                />
              );
            };

            const client1Questions = step.questions.filter(q => !q.key.startsWith('client2'));
            const client2Questions = step.questions.filter(q => q.key.startsWith('client2'));

            return (
              <>
                <Subsection title={`${client1Name} — Estate Trustee (Executor)`}>
                  {client1Questions.map(renderQuestion)}
                </Subsection>
                {hasSpouse && (
                  <Subsection title={`${client2Name} — Estate Trustee (Executor)`}>
                    {client2Questions.map(renderQuestion)}
                  </Subsection>
                )}
              </>
            );
          })()}

          {step.sectionId === 'legacyIntent' && (
            <LegacyIntentSection
              answers={answers}
              allAnswers={allAnswers || new Map()}
              onAnswerChange={onAnswerChange}
            />
          )}

          {step.sectionId === 'wills' && (() => {
            const allFormData = Object.fromEntries(
              Array.from(allAnswers?.entries() || []).flatMap(([_, stepAnswers]) =>
                Object.entries(stepAnswers)
              )
            );
            const renderBasicQuestion = (question: typeof step.questions[0]) => {
              if (question.condition && !question.condition(allFormData)) return null;
              const displayLabel = typeof question.label === 'function'
                ? question.label(allAnswers || new Map())
                : question.label;
              return (
                <FormField
                  key={question.key}
                  question={{ ...question, label: displayLabel }}
                  value={answers[question.key]}
                  onChange={(value) => onAnswerChange(question.key, value)}
                  answers={allAnswers}
                />
              );
            };
            const basicQuestionKeys = new Set(step.questions.map(q => q.key));
            const hasAnsweredHasWill = answers['client1HasWill'] !== undefined || answers['client2HasWill'] !== undefined;
            return (
              <>
                <Subsection title="Will Document Basics">
                  {step.questions.map(renderBasicQuestion)}
                </Subsection>
                {hasAnsweredHasWill && (
                  <CurrentWillSection
                    answers={answers}
                    allAnswers={allAnswers || new Map()}
                    onAnswerChange={onAnswerChange}
                  />
                )}
              </>
            );
          })()}

          {step.sectionId === 'lifeInsurance' && (() => {
            const basicAnswers = allAnswers?.get('aboutYou') || {};
            const client1Name = (basicAnswers['fullName'] as string) || 'Client 1';
            const maritalStatus = basicAnswers['maritalStatus'] as string;
            const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';
            const client2Name = (basicAnswers['spouseName'] as string) || 'Client 2';

            const allFormData = Object.fromEntries(
              Array.from(allAnswers?.entries() || []).flatMap(([_, stepAnswers]) =>
                Object.entries(stepAnswers)
              )
            );

            const isVisible = (question: typeof step.questions[0]) => {
              if (!question.condition) return true;
              return question.condition(allFormData);
            };

            const isClient1GroupKey = (key: string) =>
              key === 'client1HasLifeInsurance' || key.startsWith('client1LifePolicy') ||
              key === 'client1HasCriticalIllnessInsurance' || key.startsWith('client1CiPolicy') ||
              key === 'client1HasDisabilityInsuranceEmployer' || key.startsWith('client1DiPolicy');

            const isClient1PersonalKey = (key: string) =>
              key === 'client1HasLifeInsurancePersonal' || key.startsWith('client1PersonalLifePolicy') ||
              key === 'client1HasCriticalIllnessInsurancePersonal' || key.startsWith('client1PersonalCiPolicy') ||
              key === 'client1HasDisabilityInsurancePersonal' || key.startsWith('client1PersonalDiPolicy');

            const isClient2GroupKey = (key: string) =>
              key === 'client2HasLifeInsurance' || key.startsWith('client2LifePolicy') ||
              key === 'client2HasCriticalIllnessInsurance' || key.startsWith('client2CiPolicy') ||
              key === 'client2HasDisabilityInsuranceEmployer' || key.startsWith('client2DiPolicy');

            const isClient2PersonalKey = (key: string) =>
              key === 'client2HasLifeInsurancePersonal' || key.startsWith('client2PersonalLifePolicy') ||
              key === 'client2HasCriticalIllnessInsurancePersonal' || key.startsWith('client2PersonalCiPolicy') ||
              key === 'client2HasDisabilityInsurancePersonal' || key.startsWith('client2PersonalDiPolicy');

            const isCorpKey = (key: string, corpIndex: number) => {
              const prefix = `corp${corpIndex + 1}`;
              return key === `${prefix}HasLifeInsurance` || key.startsWith(`${prefix}LifePolicy`) ||
                key === `${prefix}HasCriticalIllnessInsurance` || key.startsWith(`${prefix}CiPolicy`) ||
                key === `${prefix}HasDisabilityInsurance` || key.startsWith(`${prefix}DiPolicy`);
            };

            const renderQuestion = (question: typeof step.questions[0]) => {
              if (!isVisible(question)) return null;
              const displayLabel = typeof question.label === 'function'
                ? question.label(allAnswers || new Map())
                : question.label;
              return (
                <FormField
                  key={question.key}
                  question={{ ...question, label: displayLabel }}
                  value={answers[question.key]}
                  onChange={(value) => onAnswerChange(question.key, value)}
                  answers={allAnswers}
                />
              );
            };

            return (
              <>
                <Subsection title={`${client1Name} - Group Benefits`}>
                  {step.questions.filter(q => isClient1GroupKey(q.key)).map(renderQuestion)}
                </Subsection>
                <Subsection title={`${client1Name} - Personally Owned Insurance Policies`}>
                  {step.questions.filter(q => isClient1PersonalKey(q.key)).map(renderQuestion)}
                </Subsection>
                {hasSpouse && (
                  <>
                    <Subsection title={`${client2Name} - Group Benefits`}>
                      {step.questions.filter(q => isClient2GroupKey(q.key)).map(renderQuestion)}
                    </Subsection>
                    <Subsection title={`${client2Name} - Personally Owned Insurance Policies`}>
                      {step.questions.filter(q => isClient2PersonalKey(q.key)).map(renderQuestion)}
                    </Subsection>
                  </>
                )}

                {(() => {
                  const corporationsData = (allAnswers?.get('corporations') as Record<string, unknown> | undefined)?.['corporationsData'] as Array<Record<string, string>> | undefined;
                  if (!corporationsData || corporationsData.length === 0) return null;
                  const validCorps = corporationsData
                    .map((c, i) => ({ corp: c, index: i }))
                    .filter(({ corp }) => corp?.legalName?.trim());
                  if (validCorps.length === 0) return null;
                  return (
                    <>
                      {validCorps.map(({ corp, index }) => {
                        const corpName = corp.legalName.trim();
                        const corpQuestions = step.questions.filter(q => isCorpKey(q.key, index));
                        if (corpQuestions.length === 0) return null;
                        return (
                          <Subsection
                            key={`corp-insurance-${index}`}
                            title={`${corpName} — Life Insurance Policies`}
                            description={`Insurance policies owned by ${corpName}`}
                          >
                            {corpQuestions.map(renderQuestion)}
                          </Subsection>
                        );
                      })}
                    </>
                  );
                })()}
              </>
            );
          })()}

          {validationError && (
            <div className="mt-6 p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-sm text-red-300">{validationError}</p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onPrevious}
              disabled={isFirstStep}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${
                isFirstStep
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4" />
                  Complete Questionnaire
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
