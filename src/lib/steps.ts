/**
 * IMPORTANT:
 * Questionnaire section IDs are permanent identifiers.
 *
 * Never use section order/index as a data identifier.
 * Sections may be reordered without changing their IDs.
 *
 * Cross-section logic must reference semantic section IDs.
 */
export type QuestionnaireSectionId =
  | 'aboutYou'
  | 'previousRelationships'
  | 'children'
  | 'familyTrusts'
  | 'businessInterests'
  | 'corporations'
  | 'corporateFinancialConnections'
  | 'professionalTeam'
  | 'financialFootprint'
  | 'realEstate'
  | 'debtObligations'
  | 'lifeInsurance'
  | 'propertyLiabilityInsurance'
  | 'legacyIntent'
  | 'wills'
  | 'powersOfAttorney'
  | 'estateTrustees'
  | 'funeralArrangements'
  | 'workplacePensionsBenefits';

export type QuestionnaireAnswers = Partial<Record<QuestionnaireSectionId, Record<string, unknown>>>;

export function getSectionAnswers(
  answers: Map<string, Record<string, unknown>>,
  sectionId: QuestionnaireSectionId
): Record<string, unknown> {
  return answers.get(sectionId) ?? {};
}

/** Legacy migration: maps old numeric step positions to permanent section IDs. */
const legacyStepIdMap: Record<number, QuestionnaireSectionId> = {
  1: 'aboutYou',
  2: 'previousRelationships',
  3: 'children',
  4: 'familyTrusts',
  5: 'businessInterests',
  6: 'corporations',
  7: 'corporateFinancialConnections',
  8: 'professionalTeam',
  9: 'financialFootprint',
  10: 'realEstate',
  11: 'debtObligations',
  12: 'lifeInsurance',
  13: 'propertyLiabilityInsurance',
  14: 'legacyIntent',
  15: 'wills',
  16: 'powersOfAttorney',
  17: 'estateTrustees',
  18: 'funeralArrangements',
  19: 'workplacePensionsBenefits',
};

/** Convert a legacy numeric-keyed answers object to section-ID-keyed Map. */
export function migrateLegacyAnswers(
  legacy: Record<string, Record<string, unknown>>
): Map<string, Record<string, unknown>> {
  const migrated = new Map<string, Record<string, unknown>>();
  for (const [numKey, value] of Object.entries(legacy)) {
    const sectionId = legacyStepIdMap[parseInt(numKey, 10)];
    if (sectionId && value && typeof value === 'object') {
      migrated.set(sectionId, value as Record<string, unknown>);
    }
  }
  return migrated;
}

export type StepQuestion = {
  key: string;
  label: string | ((answers: Map<string, Record<string, unknown>>) => string);
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'email' | 'tel' | 'date' | 'number' | 'checkbox-group' | 'dynamic' | 'label' | 'display' | 'location' | 'person' | 'professional';
  placeholder?: string;
  options?: Array<{ value: string; label: string }> | ((answers: Map<string, Record<string, unknown>>) => Array<{ value: string; label: string }>);
  required?: boolean;
  videoUrl?: string;
  description?: string;
  condition?: (formData: Record<string, string>) => boolean | "";
  max?: number;
  allowOther?: boolean;
  multi?: boolean;
  personFilterTypes?: Array<'family' | 'trusted' | 'professional' | 'client' | 'child' | 'other'>;
  personDefaultType?: 'family' | 'trusted' | 'professional' | 'client' | 'child' | 'other';
  personShowContactFields?: boolean;
  professionalCategory?: 'financial' | 'accountant' | 'lawyer' | 'insurance' | 'physician' | 'pharmacist' | 'other';
};

export type Step = {
  id: number;
  sectionId: QuestionnaireSectionId;
  title: string;
  description?: string;
  questions: StepQuestion[];
  videoUrl?: string;
};

type OptionEntry = { value: string; label: string };

export const buildInsuredPersonOptions = (answers: Map<string, Record<string, unknown>>): OptionEntry[] => {
  const step1 = answers.get('aboutYou') || {};
  const step2 = answers.get('previousRelationships') || {};
  const step3 = answers.get('children') || {};
  const opts: OptionEntry[] = [];
  const seen = new Set<string>();

  const add = (value: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = value || trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    opts.push({ value, label: trimmed });
  };

  add('client1', (step1['fullName'] as string) || 'Client 1');
  const ms = step1['maritalStatus'] as string;
  if (ms === 'married' || ms === 'common_law') {
    add('client2', (step1['spouseName'] as string) || 'Client 2');
  }

  const childrenData = (step3['childrenData'] as Array<Record<string, string>>) || [];
  childrenData.forEach((c, i) => {
    const name = (c?.name || '').trim();
    if (name) add(`child_${i}`, name);
  });

  const c1PrevRels = (step2['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
  c1PrevRels.forEach((r, i) => add(`c1prevrel_${i}`, r?.name || ''));
  const c2PrevRels = (step2['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
  c2PrevRels.forEach((r, i) => add(`c2prevrel_${i}`, r?.name || ''));

  opts.push({ value: 'other', label: 'Other' });
  return opts;
};

export const buildPolicyOwnerOptions = (answers: Map<string, Record<string, unknown>>): OptionEntry[] => {
  const step1 = answers.get('aboutYou') || {};
  const step2 = answers.get('previousRelationships') || {};
  const step3 = answers.get('children') || {};
  const step4 = answers.get('familyTrusts') || {};
  const step6 = answers.get('corporations') || {};
  const opts: OptionEntry[] = [];
  const seen = new Set<string>();

  const add = (value: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = value || trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    opts.push({ value, label: trimmed });
  };

  add('client1', (step1['fullName'] as string) || 'Client 1');
  const ms = step1['maritalStatus'] as string;
  if (ms === 'married' || ms === 'common_law') {
    add('client2', (step1['spouseName'] as string) || 'Client 2');
  }

  const childrenData = (step3['childrenData'] as Array<Record<string, string>>) || [];
  childrenData.forEach((c, i) => {
    const name = (c?.name || '').trim();
    if (name) add(`child_${i}`, name);
  });

  const c1PrevRels = (step2['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
  c1PrevRels.forEach((r, i) => add(`c1prevrel_${i}`, r?.name || ''));
  const c2PrevRels = (step2['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
  c2PrevRels.forEach((r, i) => add(`c2prevrel_${i}`, r?.name || ''));

  const corporationsData = (step6['corporationsData'] as Array<Record<string, string>>) || [];
  corporationsData.forEach((c, i) => add(`corp_${i}`, c?.legalName || ''));

  for (let t = 1; t <= 4; t++) {
    const trustKey = t === 1 ? 'trustLegalName' : `trust${t}LegalName`;
    const trustName = step4[trustKey] as string;
    add(`trust_${t}`, trustName || '');
  }

  opts.push({ value: 'other', label: 'Other' });
  return opts;
};

export const buildBeneficiaryOptions = (answers: Map<string, Record<string, unknown>>): OptionEntry[] => {
  const step1 = answers.get('aboutYou') || {};
  const step2 = answers.get('previousRelationships') || {};
  const step3 = answers.get('children') || {};
  const step4 = answers.get('familyTrusts') || {};
  const step6 = answers.get('corporations') || {};
  const opts: OptionEntry[] = [];
  const seen = new Set<string>();

  const add = (value: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = value || trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    opts.push({ value, label: trimmed });
  };

  add('client1', (step1['fullName'] as string) || 'Client 1');
  const ms = step1['maritalStatus'] as string;
  if (ms === 'married' || ms === 'common_law') {
    add('client2', (step1['spouseName'] as string) || 'Client 2');
  }

  const childrenData = (step3['childrenData'] as Array<Record<string, string>>) || [];
  childrenData.forEach((c, i) => {
    const name = (c?.name || '').trim();
    if (name) add(`child_${i}`, name);
  });

  const c1PrevRels = (step2['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
  c1PrevRels.forEach((r, i) => add(`c1prevrel_${i}`, r?.name || ''));
  const c2PrevRels = (step2['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
  c2PrevRels.forEach((r, i) => add(`c2prevrel_${i}`, r?.name || ''));

  const corporationsData = (step6['corporationsData'] as Array<Record<string, string>>) || [];
  corporationsData.forEach((c, i) => add(`corp_${i}`, c?.legalName || ''));

  for (let t = 1; t <= 4; t++) {
    const trustKey = t === 1 ? 'trustLegalName' : `trust${t}LegalName`;
    const trustName = step4[trustKey] as string;
    add(`trust_${t}`, trustName || '');
  }

  opts.push({ value: 'estate', label: 'Estate' });
  opts.push({ value: 'other', label: 'Other' });
  return opts;
};

const MAX_POLICIES = 4;

const generateLifeInsurancePolicyQuestions = (
  prefix: string,
  source: 'employer' | 'personal' | 'corporate' = 'employer'
): StepQuestion[] => {
  const sourcePrefix = source === 'personal' ? 'Personal' : '';
  const policyKey = `${prefix}${sourcePrefix}LifePolicy`;
  const gateKey = `${prefix}HasLifeInsurance${source === 'personal' ? 'Personal' : ''}`;
  const questions: StepQuestion[] = [];

  for (let i = 1; i <= MAX_POLICIES; i++) {
    const p = `${policyKey}${i}`;
    const prevGate = i === 1
      ? gateKey
      : `${policyKey}${i - 1}HasAdditional`;

    const gateCondition = (formData: Record<string, string>): boolean => formData[prevGate] === 'yes';

    questions.push({
      key: p,
      label: i === 1 ? 'Life Insurance Policy Details' : `Additional Life Insurance Policy (${i})`,
      type: 'label',
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}InsuredPerson`,
      label: 'Insured Person',
      type: 'select',
      options: buildInsuredPersonOptions,
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}InsuredPersonOther`,
      label: 'Please specify the insured person:',
      type: 'text',
      placeholder: 'Enter name',
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}InsuredPerson`] === 'other',
    });

    questions.push({
      key: `${p}PolicyOwner`,
      label: 'Policy Owner',
      type: 'select',
      options: buildPolicyOwnerOptions,
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}PolicyOwnerOther`,
      label: 'Please specify the policy owner:',
      type: 'text',
      placeholder: 'Enter name',
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}PolicyOwner`] === 'other',
    });

    questions.push({
      key: `${p}Provider`,
      label: 'Insurance Provider',
      type: 'text',
      placeholder: 'e.g., Sun Life, Manulife',
      required: false,
      condition: gateCondition,
    });

    if (source === 'employer') {
      questions.push({
        key: `${p}Employer`,
        label: 'Employer (if applicable)',
        type: 'text',
        placeholder: 'e.g., ABC Corp, or leave blank if personal',
        required: false,
        condition: gateCondition,
      });
    }

    questions.push({
      key: `${p}CoverageAmount`,
      label: 'Coverage Amount',
      type: 'text',
      placeholder: 'e.g., $500,000',
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}CoverageEndType`,
      label: 'When does the coverage end?',
      type: 'radio',
      options: [
        { value: 'retirement', label: 'Retirement' },
        { value: 'job_change', label: 'Job change' },
        { value: 'specific_date', label: 'Specific date' },
      ],
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}CoverageEndDate`,
      label: 'Please specify the date coverage ends:',
      type: 'date',
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}CoverageEndType`] === 'specific_date',
    });

    questions.push({
      key: `${p}Purpose`,
      label: 'Purpose',
      type: 'textarea',
      placeholder: 'e.g., Income replacement, mortgage protection, estate liquidity',
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}Beneficiary`,
      label: 'Beneficiary(ies)',
      type: 'checkbox-group',
      options: buildBeneficiaryOptions,
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}BeneficiaryOther`,
      label: 'Please specify the beneficiary(ies):',
      type: 'text',
      placeholder: 'Enter beneficiary name(s)',
      required: false,
      condition: (formData: Record<string, string>) => {
        if (!gateCondition(formData)) return false;
        const beneficiaries = formData[`${p}Beneficiary`];
        if (!beneficiaries) return false;
        return beneficiaries.split(',').includes('other');
      },
    });

    questions.push({
      key: `${p}HasContingentBeneficiaries`,
      label: 'Are there any Contingent Beneficiaries?',
      type: 'radio',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}ContingentBeneficiary`,
      label: 'Contingent Beneficiary(ies)',
      type: 'checkbox-group',
      options: buildBeneficiaryOptions,
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}HasContingentBeneficiaries`] === 'yes',
    });

    questions.push({
      key: `${p}ContingentBeneficiaryOther`,
      label: 'Please specify the contingent beneficiary(ies):',
      type: 'text',
      placeholder: 'Enter contingent beneficiary name(s)',
      required: false,
      condition: (formData: Record<string, string>) => {
        if (!gateCondition(formData)) return false;
        if (formData[`${p}HasContingentBeneficiaries`] !== 'yes') return false;
        const contingent = formData[`${p}ContingentBeneficiary`];
        if (!contingent) return false;
        return contingent.split(',').includes('other');
      },
    });

    questions.push({
      key: `${p}DocLocation`,
      label: 'Location of the policy documentation',
      type: 'location',
      placeholder: 'e.g., Home safe, lawyer\'s office, employer HR portal',
      required: false,
      condition: gateCondition,
    });

    if (i < MAX_POLICIES) {
      const clientNameFn = source === 'personal'
        ? () => 'Are there any other Life Insurance Policies purchased outside of work plans or employer benefits?'
        : source === 'corporate'
          ? (answers: Map<string, Record<string, unknown>>) => {
            const corpIdx = parseInt(prefix.replace('corp', '')) - 1;
            const corps = answers.get('corporations')?.['corporationsData'] as Array<Record<string, string>> | undefined;
            const name = corps?.[corpIdx]?.legalName?.trim() || `Corporation ${corpIdx + 1}`;
            return `Does ${name} own any other Life Insurance Policies?`;
          }
          : prefix === 'client1'
            ? (answers: Map<string, Record<string, unknown>>) =>
                `Are there any other Life Insurance Policies owned through your employer or through ${(answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2'}'s employer?`
            : (answers: Map<string, Record<string, unknown>>) =>
                `Are there any other Life Insurance Policies owned through your employer or through ${(answers.get('aboutYou')?.['fullName'] as string) || 'Client 1'}'s employer?`;

      questions.push({
        key: `${p}HasAdditional`,
        label: clientNameFn,
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: gateCondition,
      });
    }
  }

  return questions;
};

const generateCriticalIllnessPolicyQuestions = (
  prefix: string,
  source: 'employer' | 'personal' | 'corporate' = 'employer'
): StepQuestion[] => {
  const sourcePrefix = source === 'personal' ? 'Personal' : '';
  const policyKey = `${prefix}${sourcePrefix}CiPolicy`;
  const gateKey = `${prefix}HasCriticalIllnessInsurance${source === 'personal' ? 'Personal' : ''}`;
  const questions: StepQuestion[] = [];

  for (let i = 1; i <= MAX_POLICIES; i++) {
    const p = `${policyKey}${i}`;
    const prevGate = i === 1
      ? gateKey
      : `${policyKey}${i - 1}HasAdditional`;

    const gateCondition = (formData: Record<string, string>): boolean => formData[prevGate] === 'yes';

    questions.push({
      key: p,
      label: i === 1 ? 'Critical Illness Policy Details' : `Additional Critical Illness Policy (${i})`,
      type: 'label',
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}InsuredPerson`,
      label: 'Insured Person',
      type: 'select',
      options: buildInsuredPersonOptions,
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}InsuredPersonOther`,
      label: 'Please specify the insured person:',
      type: 'text',
      placeholder: 'Enter name',
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}InsuredPerson`] === 'other',
    });

    questions.push({
      key: `${p}PolicyOwner`,
      label: 'Policy Owner',
      type: 'select',
      options: buildPolicyOwnerOptions,
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}PolicyOwnerOther`,
      label: 'Please specify the policy owner:',
      type: 'text',
      placeholder: 'Enter name',
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}PolicyOwner`] === 'other',
    });

    questions.push({
      key: `${p}Provider`,
      label: 'Insurance Provider',
      type: 'text',
      placeholder: 'e.g., Sun Life, Manulife',
      required: false,
      condition: gateCondition,
    });

    if (source === 'employer') {
      questions.push({
        key: `${p}Employer`,
        label: 'Employer (if applicable)',
        type: 'text',
        placeholder: 'e.g., ABC Corp, or leave blank if personal',
        required: false,
        condition: gateCondition,
      });
    }

    questions.push({
      key: `${p}CoverageAmount`,
      label: 'Coverage Amount',
      type: 'text',
      placeholder: 'e.g., $500,000',
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}CoverageEndType`,
      label: 'When does the coverage end?',
      type: 'radio',
      options: [
        { value: 'retirement', label: 'Retirement' },
        { value: 'job_change', label: 'Job change' },
        { value: 'specific_date', label: 'Specific date' },
      ],
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}CoverageEndDate`,
      label: 'Please specify the date coverage ends:',
      type: 'date',
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}CoverageEndType`] === 'specific_date',
    });

    questions.push({
      key: `${p}Purpose`,
      label: 'Purpose',
      type: 'textarea',
      placeholder: 'e.g., Income replacement, mortgage protection, estate liquidity',
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}DocLocation`,
      label: 'Location of the policy documentation',
      type: 'location',
      placeholder: 'e.g., Home safe, lawyer\'s office, employer HR portal',
      required: false,
      condition: gateCondition,
    });

    if (i < MAX_POLICIES) {
      const clientNameFn = source === 'personal'
        ? () => 'Are there any other Critical Illness Policies purchased outside of work plans or employer benefits?'
        : source === 'corporate'
          ? (answers: Map<string, Record<string, unknown>>) => {
            const corpIdx = parseInt(prefix.replace('corp', '')) - 1;
            const corps = answers.get('corporations')?.['corporationsData'] as Array<Record<string, string>> | undefined;
            const name = corps?.[corpIdx]?.legalName?.trim() || `Corporation ${corpIdx + 1}`;
            return `Does ${name} own any other Critical Illness Policies?`;
          }
          : prefix === 'client1'
            ? (answers: Map<string, Record<string, unknown>>) =>
                `Are there any other Critical Illness Policies owned through your employer or through ${(answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2'}'s employer?`
            : (answers: Map<string, Record<string, unknown>>) =>
                `Are there any other Critical Illness Policies owned through your employer or through ${(answers.get('aboutYou')?.['fullName'] as string) || 'Client 1'}'s employer?`;

      questions.push({
        key: `${p}HasAdditional`,
        label: clientNameFn,
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: gateCondition,
      });
    }
  }

  return questions;
};

const generateDisabilityInsurancePolicyQuestions = (
  prefix: string,
  source: 'employer' | 'personal' | 'corporate' = 'employer'
): StepQuestion[] => {
  const sourcePrefix = source === 'personal' ? 'Personal' : '';
  const policyKey = `${prefix}${sourcePrefix}DiPolicy`;
  const gateKey = source === 'personal'
    ? `${prefix}HasDisabilityInsurancePersonal`
    : source === 'employer'
      ? `${prefix}HasDisabilityInsuranceEmployer`
      : `${prefix}HasDisabilityInsurance`;
  const questions: StepQuestion[] = [];

  for (let i = 1; i <= MAX_POLICIES; i++) {
    const p = `${policyKey}${i}`;
    const prevGate = i === 1
      ? gateKey
      : `${policyKey}${i - 1}HasAdditional`;

    const gateCondition = (formData: Record<string, string>): boolean => formData[prevGate] === 'yes';

    questions.push({
      key: p,
      label: i === 1 ? 'Disability Insurance Policy Details' : `Additional Disability Insurance Policy (${i})`,
      type: 'label',
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}InsuredPerson`,
      label: 'Insured Person',
      type: 'select',
      options: buildInsuredPersonOptions,
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}InsuredPersonOther`,
      label: 'Please specify the insured person:',
      type: 'text',
      placeholder: 'Enter name',
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}InsuredPerson`] === 'other',
    });

    questions.push({
      key: `${p}PolicyOwner`,
      label: 'Policy Owner',
      type: 'select',
      options: buildPolicyOwnerOptions,
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}PolicyOwnerOther`,
      label: 'Please specify the policy owner:',
      type: 'text',
      placeholder: 'Enter name',
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}PolicyOwner`] === 'other',
    });

    questions.push({
      key: `${p}Provider`,
      label: 'Insurance Provider',
      type: 'text',
      placeholder: 'e.g., Sun Life, Manulife',
      required: false,
      condition: gateCondition,
    });

    if (source === 'employer') {
      questions.push({
        key: `${p}Employer`,
        label: 'Employer (if applicable)',
        type: 'text',
        placeholder: 'e.g., ABC Corp, or leave blank if personal',
        required: false,
        condition: gateCondition,
      });
    }

    questions.push({
      key: `${p}CoverageAmount`,
      label: 'Coverage Amount',
      type: 'text',
      placeholder: 'e.g., $500,000',
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}CoverageEndType`,
      label: 'When does the coverage end?',
      type: 'radio',
      options: [
        { value: 'retirement', label: 'Retirement' },
        { value: 'job_change', label: 'Job change' },
        { value: 'specific_date', label: 'Specific date' },
      ],
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}CoverageEndDate`,
      label: 'Please specify the date coverage ends:',
      type: 'date',
      required: false,
      condition: (formData: Record<string, string>) =>
        gateCondition(formData) && formData[`${p}CoverageEndType`] === 'specific_date',
    });

    questions.push({
      key: `${p}Purpose`,
      label: 'Purpose',
      type: 'textarea',
      placeholder: 'e.g., Income replacement, mortgage protection, estate liquidity',
      required: false,
      condition: gateCondition,
    });

    questions.push({
      key: `${p}DocLocation`,
      label: 'Location of the policy documentation',
      type: 'location',
      placeholder: 'e.g., Home safe, lawyer\'s office, employer HR portal',
      required: false,
      condition: gateCondition,
    });

    if (i < MAX_POLICIES) {
      const clientNameFn = source === 'personal'
        ? () => 'Are there any other Disability Insurance Policies purchased outside of work plans or employer benefits?'
        : source === 'corporate'
          ? (answers: Map<string, Record<string, unknown>>) => {
            const corpIdx = parseInt(prefix.replace('corp', '')) - 1;
            const corps = answers.get('corporations')?.['corporationsData'] as Array<Record<string, string>> | undefined;
            const name = corps?.[corpIdx]?.legalName?.trim() || `Corporation ${corpIdx + 1}`;
            return `Does ${name} own any other Disability Insurance Policies?`;
          }
          : prefix === 'client1'
            ? (answers: Map<string, Record<string, unknown>>) =>
                `Are there any other Disability Insurance Policies owned through your employer or through ${(answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2'}'s employer?`
            : (answers: Map<string, Record<string, unknown>>) =>
                `Are there any other Disability Insurance Policies owned through your employer or through ${(answers.get('aboutYou')?.['fullName'] as string) || 'Client 1'}'s employer?`;

      questions.push({
        key: `${p}HasAdditional`,
        label: clientNameFn,
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: gateCondition,
      });
    }
  }

  return questions;
};

const MAX_CORPORATIONS = 4;

const generateCorporationInsuranceQuestions = (corpIndex: number): StepQuestion[] => {
  const prefix = `corp${corpIndex + 1}`;
  const questions: StepQuestion[] = [];

  const corpNameFn = (answers: Map<string, Record<string, unknown>>): string => {
    const corps = answers.get('corporations')?.['corporationsData'] as Array<Record<string, string>> | undefined;
    const name = corps?.[corpIndex]?.legalName;
    return (name && name.trim()) ? name.trim() : `Corporation ${corpIndex + 1}`;
  };

  const corpNameCondition = (formData: Record<string, string>): boolean => {
    const corps = formData['corporationsData'] as unknown as Array<Record<string, string>> | undefined;
    return !!corps?.[corpIndex]?.legalName?.trim();
  };

  questions.push({
    key: `${prefix}HasLifeInsurance`,
    label: (answers) => `Does ${corpNameFn(answers)} own any Life Insurance Policies?`,
    type: 'radio',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    required: false,
    condition: corpNameCondition,
  });
  questions.push(...generateLifeInsurancePolicyQuestions(prefix, 'corporate'));

  questions.push({
    key: `${prefix}HasCriticalIllnessInsurance`,
    label: (answers) => `Does ${corpNameFn(answers)} own any Critical Illness Insurance Policies?`,
    type: 'radio',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    required: false,
    condition: corpNameCondition,
  });
  questions.push(...generateCriticalIllnessPolicyQuestions(prefix, 'corporate'));

  questions.push({
    key: `${prefix}HasDisabilityInsurance`,
    label: (answers) => `Does ${corpNameFn(answers)} own any Disability Insurance Policies?`,
    type: 'radio',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    required: false,
    condition: corpNameCondition,
  });
  questions.push(...generateDisabilityInsurancePolicyQuestions(prefix, 'corporate'));

  return questions;
};

export const STEPS: Step[] = [
  {
    id: 1,
    sectionId: 'aboutYou',
    title: 'About You',
    description: 'Let\'s get started with a few quick questions',
    questions: [
      {
        key: 'fullName',
        label: 'Client 1 — Full Name',
        type: 'text',
        placeholder: 'Enter full name',
        required: true,
      },
      {
        key: 'dateOfBirth',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}'s Date of Birth`;
        },
        type: 'date',
        required: true,
      },
      {
        key: 'address',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}'s Address`;
        },
        type: 'text',
        placeholder: 'Enter street address',
        required: true,
      },
      {
        key: 'city',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}'s City`;
        },
        type: 'text',
        placeholder: 'Enter city',
        required: true,
      },
      {
        key: 'province',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}'s Province`;
        },
        type: 'text',
        placeholder: 'Enter province',
        required: true,
      },
      {
        key: 'postalCode',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}'s Postal Code`;
        },
        type: 'text',
        placeholder: 'Enter postal code',
        required: true,
      },
      {
        key: 'email',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}'s Email Address`;
        },
        type: 'email',
        placeholder: 'Enter email address',
        required: true,
      },
      {
        key: 'phone',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}'s Phone Number`;
        },
        type: 'text',
        placeholder: 'Enter phone number',
        required: true,
      },
      {
        key: 'maritalStatus',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}'s Marital Status`;
        },
        type: 'select',
        options: [
          { value: 'single', label: 'Single' },
          { value: 'married', label: 'Married' },
          { value: 'divorced', label: 'Divorced' },
          { value: 'widowed', label: 'Widowed' },
          { value: 'legally_separated', label: 'Legally Separated' },
          { value: 'common_law', label: 'Common-Law' },
        ],
        required: true,
      },
      {
        key: 'spouseName',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}'s Spouse or Common-Law Partner's Name`;
        },
        type: 'text',
        placeholder: 'Enter spouse/partner\'s name',
        required: false,
      },
      {
        key: 'spouseSameAddress',
        label: (answers) => {
          const c1Full = answers.get('aboutYou')?.fullName as string || 'Client 1';
          const c2Full = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          const c1 = c1Full.split(' ')[0];
          const c2 = c2Full.split(' ')[0];
          return `Does ${c1} and ${c2} live at the same address?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
      },
      {
        key: 'spouseDateOfBirth',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}'s Date of Birth`;
        },
        type: 'date',
        required: false,
      },
      {
        key: 'spouseAddress',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}'s Address`;
        },
        type: 'text',
        placeholder: 'Enter street address',
        required: false,
      },
      {
        key: 'spouseCity',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}'s City`;
        },
        type: 'text',
        placeholder: 'Enter city',
        required: false,
      },
      {
        key: 'spouseProvince',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}'s Province`;
        },
        type: 'text',
        placeholder: 'Enter province',
        required: false,
      },
      {
        key: 'spousePostalCode',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}'s Postal Code`;
        },
        type: 'text',
        placeholder: 'Enter postal code',
        required: false,
      },
      {
        key: 'spouseEmail',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}'s Email Address`;
        },
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
      },
      {
        key: 'spousePhone',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}'s Phone Number`;
        },
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
      },
      {
        key: 'hasMarriageContract',
        label: (answers) => {
          const c1Full = answers.get('aboutYou')?.fullName as string || 'Client 1';
          const c2Full = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          const c1 = c1Full.split(' ')[0];
          const c2 = c2Full.split(' ')[0];
          return `Does ${c1} and ${c2} have a marriage contract (prenuptial agreement)?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
      },
      {
        key: 'marriageContractLocation',
        label: 'Where is the marriage contract located?',
        type: 'location',
        placeholder: 'Enter location of marriage contract',
        required: false,
      },
      {
        key: 'client1HasPreviousRelationship',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `Has ${name} previously been married or in a common-law relationship?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'client1NumberOfPreviousRelationships',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `How many previous marriages or common-law relationships has ${name} had?`;
        },
        type: 'number',
        placeholder: '0',
        required: false,
      },
      {
        key: 'client2HasPreviousRelationship',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `Has ${name} previously been married or in a common-law relationship?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
      },
      {
        key: 'client2NumberOfPreviousRelationships',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `How many previous marriages or common-law relationships has ${name} had?`;
        },
        type: 'number',
        placeholder: '0',
        required: false,
      },
      {
        key: 'hasChildren',
        label: (answers) => {
          const c1 = answers.get('aboutYou')?.fullName as string || 'Client 1';
          const c2 = answers.get('aboutYou')?.spouseName as string;
          return c2
            ? `Do ${c1} and ${c2} have any children (from their or any other relationship)?`
            : `Does ${c1} have any children (from their or any other relationship)?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'numberOfChildren',
        label: (answers) => {
          const c1 = answers.get('aboutYou')?.fullName as string || 'Client 1';
          const c2 = answers.get('aboutYou')?.spouseName as string;
          return c2 ? `How many children do ${c1} and ${c2} have?` : `How many children does ${c1} have?`;
        },
        type: 'number',
        placeholder: 'Enter number of children',
        required: false,
      },
    ],
  },
  {
    id: 2,
    sectionId: 'previousRelationships',
    title: 'Previous Relationships',
    description: 'Please provide details about previous marriages or common law relationships',
    questions: [],
  },
  {
    id: 3,
    sectionId: 'children',
    title: 'Children Information',
    description: 'Please provide details about each of your children',
    questions: [],
  },
  {
    id: 4,
    sectionId: 'familyTrusts',
    title: 'Family Trusts',
    description: 'Information about existing family trusts you have established',
    questions: [],
  },
  {
    id: 5,
    sectionId: 'businessInterests',
    title: 'Sole Proprietorships and Partnerships',
    description: 'Information about any non-incorporated businesses you have an interest in.',
    questions: [
      {
        key: 'hasSoleProprietorship',
        label: (answers) => {
          const client1Name = answers.get('aboutYou')?.fullName || 'Client 1';
          return `${client1Name}, do you have ownership in a sole proprietorship?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'soleProprietorshipCount',
        label: 'How many sole proprietorships do you own?',
        type: 'number',
        placeholder: '0',
        required: false,
        condition: (formData: Record<string, string>) => formData.hasSoleProprietorship === 'yes',
      },
      {
        key: 'hasPartnership',
        label: (answers) => {
          const client1Name = answers.get('aboutYou')?.fullName || 'Client 1';
          return `${client1Name}, do you have ownership interests in a partnership?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'partnershipCount',
        label: 'How many partnerships do you own?',
        type: 'number',
        placeholder: '0',
        required: false,
        condition: (formData: Record<string, string>) => formData.hasPartnership === 'yes',
      },
      {
        key: 'client2HasSoleProprietorship',
        label: (answers) => {
          const client2Name = answers.get('aboutYou')?.spouseName || 'Client 2';
          return `${client2Name}, do you have ownership in a sole proprietorship?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => {
          const maritalStatus = formData.maritalStatus;
          return maritalStatus === 'married' || maritalStatus === 'common_law';
        },
      },
      {
        key: 'client2SoleProprietorshipCount',
        label: 'How many sole proprietorships do you own?',
        type: 'number',
        placeholder: '0',
        required: false,
        condition: (formData: Record<string, string>) => {
          const maritalStatus = formData.maritalStatus;
          const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';
          return hasSpouse && formData.client2HasSoleProprietorship === 'yes';
        },
      },
      {
        key: 'client2HasPartnership',
        label: (answers) => {
          const client2Name = answers.get('aboutYou')?.spouseName || 'Client 2';
          return `${client2Name}, do you have ownership interests in a partnership?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => {
          const maritalStatus = formData.maritalStatus;
          return maritalStatus === 'married' || maritalStatus === 'common_law';
        },
      },
      {
        key: 'client2PartnershipCount',
        label: 'How many partnerships do you own?',
        type: 'number',
        placeholder: '0',
        required: false,
        condition: (formData: Record<string, string>) => {
          const maritalStatus = formData.maritalStatus;
          const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';
          return hasSpouse && formData.client2HasPartnership === 'yes';
        },
      },
    ],
  },
  {
    id: 6,
    sectionId: 'corporations',
    title: 'Corporate Information',
    description: 'Information about corporations you own',
    questions: [
      {
        key: 'ownsCorporation',
        label: 'Do you own a corporation?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'numberOfCorporations',
        label: 'How many corporations do you own?',
        type: 'select',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6' },
          { value: '7', label: '7' },
          { value: '8', label: '8' },
          { value: '9', label: '9' },
          { value: '10', label: '10' },
          { value: '11', label: '11' },
          { value: '12', label: '12' },
          { value: '13', label: '13' },
          { value: '14', label: '14' },
          { value: '15', label: '15' },
        ],
        required: false,
      },
    ],
  },
  {
    id: 7,
    sectionId: 'corporateFinancialConnections',
    title: 'Corporate Financial Connections',
    description: `Owning one or more company(ies) can create financial connections that aren't always obvious from looking at each company individually.
You may have put personal money into a company, borrowed money from one of your companies, moved money between companies, or personally guaranteed company borrowing.
We'll help you identify these connections so that someone stepping in for you can understand how everything fits together.
Don't worry if you aren't sure about an amount or arrangement. Your accountant or corporate records may be able to confirm the details later.`,
    questions: [
      {
        key: 'pgHasPersonalGuarantee',
        label: (answers) => {
          const step1 = answers.get('aboutYou') || {};
          const client1Name = (step1['fullName'] as string) || 'Client 1';
          const hasSpouse = (step1['maritalStatus'] as string) === 'married' || (step1['maritalStatus'] as string) === 'common_law';
          const client2Name = (step1['spouseName'] as string) || 'Client 2';
          if (hasSpouse) {
            return `Have ${client1Name} or ${client2Name} personally guaranteed any borrowing or debt for one of your companies?`;
          }
          return `Has ${client1Name} personally guaranteed any borrowing or debt for one of your companies?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: 'Not sure' },
        ],
        required: true,
      },
      {
        key: 'slHasShareholderLoan',
        label: (answers) => {
          const step1 = answers.get('aboutYou') || {};
          const client1Name = (step1['fullName'] as string) || 'Client 1';
          const hasSpouse = (step1['maritalStatus'] as string) === 'married' || (step1['maritalStatus'] as string) === 'common_law';
          const client2Name = (step1['spouseName'] as string) || 'Client 2';
          if (hasSpouse) {
            return `Have ${client1Name} or ${client2Name} put personal money into any of your companies that the company still owes back?`;
          }
          return `Has ${client1Name} put personal money into any of your companies that the company still owes back?`;
        },
        type: 'radio',
        description: `This is sometimes called a shareholder loan. For example, you may have personally provided money to help start the business, purchase an asset, fund an investment, or cover company expenses.`,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: 'Not sure' },
        ],
        required: true,
      },
      {
        key: 'slOwesCompany',
        label: (answers) => {
          const step1 = answers.get('aboutYou') || {};
          const client1Name = (step1['fullName'] as string) || 'Client 1';
          const hasSpouse = (step1['maritalStatus'] as string) === 'married' || (step1['maritalStatus'] as string) === 'common_law';
          const client2Name = (step1['spouseName'] as string) || 'Client 2';
          if (hasSpouse) {
            return `Have ${client1Name} or ${client2Name} taken money from any of your companies that is still expected to be repaid to the company?`;
          }
          return `Has ${client1Name} taken money from any of your companies that is still expected to be repaid to the company?`;
        },
        type: 'radio',
        description: `This can happen when money is taken from a company personally and recorded as an amount that is expected to be repaid to the company.`,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: 'Not sure' },
        ],
        required: true,
      },
      {
        key: 'slIntercompanyLoan',
        label: 'Have any of your companies loaned or advanced money to another company you\'ve told us about?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: 'Not sure' },
        ],
        required: true,
      },
      {
        key: 'slRelatedPartyLoan',
        label: 'Do any of your companies owe money to — or are they owed money by — a person or business that isn\'t one of the companies you\'ve told us about?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: 'Not sure' },
        ],
        required: true,
      },
      {
        key: 'cfcReviewConfirmed',
        label: 'Does this look right?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes, continue' },
          { value: 'no', label: 'I need to make changes' },
        ],
        required: false,
        condition: (formData: Record<string, string>) =>
          formData.pgHasPersonalGuarantee === 'yes' ||
          formData.slHasShareholderLoan === 'yes' ||
          formData.slOwesCompany === 'yes' ||
          formData.slIntercompanyLoan === 'yes' ||
          formData.slRelatedPartyLoan === 'yes',
      },
    ],
  },
  {
    id: 8,
    sectionId: 'professionalTeam',
    title: 'Your Professional Team',
    description: 'The people who help manage your family\'s financial, legal, tax, and healthcare affairs.\nIf something happened to you, these are the professionals your executor, attorney for property, attorney for personal care, or future caregiver may need to contact.',
    questions: [
      {
        key: 'fpHasAdvisor',
        label: 'Do you currently work with a Financial Planner or Wealth Advisor?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'fpAdvisor1WorksWith',
        label: 'Who does this Financial Planner work with?',
        type: 'checkbox-group',
        options: (answers: Map<string, Record<string, unknown>>) => {
          const hasSpouse = (answers.get('aboutYou')?.['maritalStatus'] as string) === 'married' || (answers.get('aboutYou')?.['maritalStatus'] as string) === 'common_law';
          if (hasSpouse) {
            return [
              { value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' },
              { value: 'client2', label: (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2' },
            ];
          }
          return [{ value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' }];
        },
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor1IsCameronSmith',
        label: 'Cameron Smith CFP®',
        type: 'checkbox',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor1Firm',
        label: 'Firm',
        type: 'text',
        placeholder: 'Enter firm name',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && !formData.fpAdvisor1IsCameronSmith,
      },
      {
        key: 'fpAdvisor1Name',
        label: 'Advisor name',
        type: 'professional',
        placeholder: 'Select or add a financial advisor',
        required: false,
        professionalCategory: 'financial',
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && !formData.fpAdvisor1IsCameronSmith,
      },
      {
        key: 'fpAdvisor1Phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && !formData.fpAdvisor1IsCameronSmith,
      },
      {
        key: 'fpAdvisor1Email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && !formData.fpAdvisor1IsCameronSmith,
      },
      {
        key: 'fpAdvisor1Website',
        label: 'Website (optional)',
        type: 'text',
        placeholder: 'Enter website URL',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && !formData.fpAdvisor1IsCameronSmith,
      },
      {
        key: 'fpAdvisor1Services',
        label: 'What do they help you with?',
        type: 'checkbox-group',
        options: [
          { value: 'investments', label: 'Investments' },
          { value: 'retirement_planning', label: 'Retirement planning' },
          { value: 'insurance', label: 'Insurance' },
          { value: 'estate_planning', label: 'Estate planning' },
          { value: 'tax_planning', label: 'Tax planning' },
          { value: 'cash_flow', label: 'Cash flow' },
          { value: 'business_planning', label: 'Business planning' },
          { value: 'other', label: 'Other' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor1Duration',
        label: 'How long have you worked together?',
        type: 'text',
        placeholder: 'e.g., 5 years',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor1RecordsLocation',
        label: 'Where do you keep your records?',
        type: 'location',
        placeholder: '',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor1IncludeInContactList',
        label: 'May we include this professional in your executor\'s contact list and action guide?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes',
      },
      {
        key: 'fpHasAdditionalAdvisor',
        label: 'Is there an additional Financial Planner/Wealth Advisor that you work with?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor2WorksWith',
        label: 'Who does this Financial Planner work with?',
        type: 'checkbox-group',
        options: (answers: Map<string, Record<string, unknown>>) => {
          const hasSpouse = (answers.get('aboutYou')?.['maritalStatus'] as string) === 'married' || (answers.get('aboutYou')?.['maritalStatus'] as string) === 'common_law';
          if (hasSpouse) {
            return [
              { value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' },
              { value: 'client2', label: (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2' },
            ];
          }
          return [{ value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' }];
        },
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor2IsCameronSmith',
        label: 'Cameron Smith CFP®',
        type: 'checkbox',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor2Firm',
        label: 'Firm',
        type: 'text',
        placeholder: 'Enter firm name',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes' && !formData.fpAdvisor2IsCameronSmith,
      },
      {
        key: 'fpAdvisor2Name',
        label: 'Advisor name',
        type: 'professional',
        placeholder: 'Select or add a financial advisor',
        required: false,
        professionalCategory: 'financial',
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes' && !formData.fpAdvisor2IsCameronSmith,
      },
      {
        key: 'fpAdvisor2Phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes' && !formData.fpAdvisor2IsCameronSmith,
      },
      {
        key: 'fpAdvisor2Email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes' && !formData.fpAdvisor2IsCameronSmith,
      },
      {
        key: 'fpAdvisor2Website',
        label: 'Website (optional)',
        type: 'text',
        placeholder: 'Enter website URL',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes' && !formData.fpAdvisor2IsCameronSmith,
      },
      {
        key: 'fpAdvisor2Services',
        label: 'What do they help you with?',
        type: 'checkbox-group',
        options: [
          { value: 'investments', label: 'Investments' },
          { value: 'retirement_planning', label: 'Retirement planning' },
          { value: 'insurance', label: 'Insurance' },
          { value: 'estate_planning', label: 'Estate planning' },
          { value: 'tax_planning', label: 'Tax planning' },
          { value: 'cash_flow', label: 'Cash flow' },
          { value: 'business_planning', label: 'Business planning' },
          { value: 'other', label: 'Other' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor2Duration',
        label: 'How long have you worked together?',
        type: 'text',
        placeholder: 'e.g., 5 years',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor2RecordsLocation',
        label: 'Where do you keep your records?',
        type: 'location',
        placeholder: '',
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor2IncludeInContactList',
        label: 'May we include this professional in your executor\'s contact list and action guide?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes',
      },
      {
        key: 'fpAdvisor2HasAdditionalAdvisor',
        label: 'Is there an additional Financial Planner/Wealth Advisor that you work with?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.fpHasAdvisor === 'yes' && formData.fpHasAdditionalAdvisor === 'yes',
      },
      {
        key: 'acctHasAccountant',
        label: 'Do you currently work with an accountant (CPA)?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'acctAdvisor1WorksWith',
        label: 'Who does this accountant work with?',
        type: 'checkbox-group',
        options: (answers: Map<string, Record<string, unknown>>) => {
          const hasSpouse = (answers.get('aboutYou')?.['maritalStatus'] as string) === 'married' || (answers.get('aboutYou')?.['maritalStatus'] as string) === 'common_law';
          if (hasSpouse) {
            return [
              { value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' },
              { value: 'client2', label: (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2' },
            ];
          }
          return [{ value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' }];
        },
        required: false,
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'acctAdvisor1Firm',
        label: 'Firm',
        type: 'text',
        placeholder: 'Enter firm name',
        required: false,
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'acctAdvisor1Name',
        label: 'Accountant name',
        type: 'professional',
        placeholder: 'Select or add an accountant',
        required: false,
        professionalCategory: 'accountant',
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'acctAdvisor1Phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'acctAdvisor1Email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'acctAdvisor1Services',
        label: 'What do they help you with?',
        type: 'checkbox-group',
        options: [
          { value: 'personal_tax_returns', label: 'Personal tax returns' },
          { value: 'corporate_tax', label: 'Corporate tax' },
          { value: 'trust_tax_returns', label: 'Trust tax returns' },
          { value: 'bookkeeping', label: 'Bookkeeping' },
          { value: 'payroll', label: 'Payroll' },
          { value: 'estate_tax', label: 'Estate tax' },
          { value: 'other', label: 'Other' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'acctAdvisor1Duration',
        label: 'How long have you worked together?',
        type: 'text',
        placeholder: 'e.g., 5 years',
        required: false,
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'acctAdvisor1DocLocation',
        label: 'Where are your tax documents stored?',
        type: 'location',
        placeholder: 'Enter document location',
        required: false,
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'acctAdvisor1IncludeInContactList',
        label: 'May we include this professional in your executor\'s contact list and action guide?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'acctHasAdditional',
        label: 'Is there an additional Accountant (CPA) that you work with?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.acctHasAccountant === 'yes',
      },
      {
        key: 'lawHasLawyer',
        label: 'Do you currently work with a lawyer?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'lawAdvisor1WorksWith',
        label: 'Who does this lawyer work with?',
        type: 'checkbox-group',
        options: (answers: Map<string, Record<string, unknown>>) => {
          const hasSpouse = (answers.get('aboutYou')?.['maritalStatus'] as string) === 'married' || (answers.get('aboutYou')?.['maritalStatus'] as string) === 'common_law';
          if (hasSpouse) {
            return [
              { value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' },
              { value: 'client2', label: (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2' },
            ];
          }
          return [{ value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' }];
        },
        required: false,
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'lawAdvisor1Firm',
        label: 'Firm',
        type: 'text',
        placeholder: 'Enter firm name',
        required: false,
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'lawAdvisor1Name',
        label: 'Lawyer name',
        type: 'professional',
        placeholder: 'Select or add a lawyer',
        required: false,
        professionalCategory: 'lawyer',
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'lawAdvisor1Phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'lawAdvisor1Email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'lawAdvisor1Services',
        label: 'What do they help you with?',
        type: 'checkbox-group',
        options: [
          { value: 'wills_powers_of_attorney', label: 'Wills & Powers of Attorney' },
          { value: 'real_estate', label: 'Real estate' },
          { value: 'corporate_law', label: 'Corporate law' },
          { value: 'family_law', label: 'Family law' },
          { value: 'litigation', label: 'Litigation' },
          { value: 'other', label: 'Other' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'lawAdvisor1Duration',
        label: 'How long have you worked together?',
        type: 'text',
        placeholder: 'e.g., 5 years',
        required: false,
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'lawAdvisor1DocLocation',
        label: 'Where are your legal documents stored?',
        type: 'location',
        placeholder: 'Enter document location',
        required: false,
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'lawAdvisor1IncludeInContactList',
        label: 'May we include this professional in your executor\'s contact list and action guide?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'lawHasAdditional',
        label: 'Is there an additional Lawyer that you work with?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.lawHasLawyer === 'yes',
      },
      {
        key: 'insHasAdvisor',
        label: 'Do you currently work with an insurance advisor?',
        type: 'radio',
        options: [
          { value: 'financial_planner', label: 'Yes, a Financial Planner' },
          { value: 'insurance_advisor', label: 'Yes, an Insurance Advisor' },
          { value: 'other', label: 'Yes, Other' },
          { value: 'na', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'insAdvisor1WorksWith',
        label: 'Who does this insurance advisor work with?',
        type: 'checkbox-group',
        options: (answers: Map<string, Record<string, unknown>>) => {
          const hasSpouse = (answers.get('aboutYou')?.['maritalStatus'] as string) === 'married' || (answers.get('aboutYou')?.['maritalStatus'] as string) === 'common_law';
          if (hasSpouse) {
            return [
              { value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' },
              { value: 'client2', label: (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2' },
            ];
          }
          return [{ value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' }];
        },
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insAdvisor1Firm',
        label: 'Firm',
        type: 'text',
        placeholder: 'Enter firm name',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insAdvisor1Name',
        label: 'Advisor name',
        type: 'professional',
        placeholder: 'Select or add an insurance advisor',
        required: false,
        professionalCategory: 'insurance',
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insAdvisor1Phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insAdvisor1Email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insAdvisor1Services',
        label: 'Which insurance policies do they handle?',
        type: 'checkbox-group',
        options: [
          { value: 'life', label: 'Life Insurance' },
          { value: 'disability', label: 'Disability Insurance' },
          { value: 'critical_illness', label: 'Critical Illness Insurance' },
          { value: 'long_term_care', label: 'Long-Term Care Insurance' },
          { value: 'extended_health_dental', label: 'Extended Health & Dental' },
          { value: 'home', label: 'Home Insurance' },
          { value: 'condo', label: 'Condo Insurance' },
          { value: 'tenant', label: 'Tenant Insurance' },
          { value: 'auto', label: 'Auto Insurance' },
          { value: 'umbrella_liability', label: 'Umbrella Liability Insurance' },
          { value: 'motorcycle_boat_atv_rv', label: 'Motorcycle / Boat / ATV / RV Insurance' },
          { value: 'business', label: 'Business Insurance' },
          { value: 'professional_liability', label: 'Professional Liability Insurance' },
          { value: 'other', label: 'Other' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insAdvisor1Duration',
        label: 'How long have you worked together?',
        type: 'text',
        placeholder: 'e.g., 5 years',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insAdvisor1DocLocation',
        label: 'Where are your insurance documents stored?',
        type: 'location',
        placeholder: 'Enter document location',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insAdvisor1IncludeInContactList',
        label: 'May we include this professional in your executor\'s contact list and action guide?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insHasAdditional',
        label: 'Is there an additional Insurance Advisor that you work with?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdvisor && formData.insHasAdvisor !== 'na',
      },
      {
        key: 'insAdvisor2WorksWith',
        label: 'Who does this additional insurance advisor work with?',
        type: 'checkbox-group',
        options: (answers: Map<string, Record<string, unknown>>) => {
          const hasSpouse = (answers.get('aboutYou')?.['maritalStatus'] as string) === 'married' || (answers.get('aboutYou')?.['maritalStatus'] as string) === 'common_law';
          if (hasSpouse) {
            return [
              { value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' },
              { value: 'client2', label: (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2' },
            ];
          }
          return [{ value: 'client1', label: (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1' }];
        },
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdditional === 'yes',
      },
      {
        key: 'insAdvisor2Firm',
        label: 'Firm',
        type: 'text',
        placeholder: 'Enter firm name',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdditional === 'yes',
      },
      {
        key: 'insAdvisor2Name',
        label: 'Advisor name',
        type: 'professional',
        placeholder: 'Select or add an insurance advisor',
        required: false,
        professionalCategory: 'insurance',
        condition: (formData: Record<string, string>) => formData.insHasAdditional === 'yes',
      },
      {
        key: 'insAdvisor2Phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdditional === 'yes',
      },
      {
        key: 'insAdvisor2Email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdditional === 'yes',
      },
      {
        key: 'insAdvisor2Services',
        label: 'Which insurance policies do they handle?',
        type: 'checkbox-group',
        options: [
          { value: 'life', label: 'Life Insurance' },
          { value: 'disability', label: 'Disability Insurance' },
          { value: 'critical_illness', label: 'Critical Illness Insurance' },
          { value: 'long_term_care', label: 'Long-Term Care Insurance' },
          { value: 'extended_health_dental', label: 'Extended Health & Dental' },
          { value: 'home', label: 'Home Insurance' },
          { value: 'condo', label: 'Condo Insurance' },
          { value: 'tenant', label: 'Tenant Insurance' },
          { value: 'auto', label: 'Auto Insurance' },
          { value: 'umbrella_liability', label: 'Umbrella Liability Insurance' },
          { value: 'motorcycle_boat_atv_rv', label: 'Motorcycle / Boat / ATV / RV Insurance' },
          { value: 'business', label: 'Business Insurance' },
          { value: 'professional_liability', label: 'Professional Liability Insurance' },
          { value: 'other', label: 'Other' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdditional === 'yes',
      },
      {
        key: 'insAdvisor2Duration',
        label: 'How long have you worked together?',
        type: 'text',
        placeholder: 'e.g., 5 years',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdditional === 'yes',
      },
      {
        key: 'insAdvisor2DocLocation',
        label: 'Where are your insurance documents stored?',
        type: 'location',
        placeholder: 'Enter document location',
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdditional === 'yes',
      },
      {
        key: 'insAdvisor2IncludeInContactList',
        label: 'May we include this professional in your executor\'s contact list and action guide?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.insHasAdditional === 'yes',
      },
      {
        key: 'fp_health_0_name',
        label: 'Family Physician Name',
        type: 'text',
        placeholder: 'Enter physician name',
        required: false,
      },
      {
        key: 'fp_health_0_clinic',
        label: 'Clinic',
        type: 'text',
        placeholder: 'Enter clinic name',
        required: false,
      },
      {
        key: 'fp_health_0_city',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
      },
      {
        key: 'fp_health_0_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
      },
      {
        key: 'fp_health_0_has_additional',
        label: 'Do you have an additional Family Physician?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
      },
      {
        key: 'fp_health_1_name',
        label: 'Additional Family Physician Name',
        type: 'text',
        placeholder: 'Enter physician name',
        required: false,
        condition: (formData: Record<string, string>) => formData.fp_health_0_has_additional === 'yes',
      },
      {
        key: 'fp_health_1_clinic',
        label: 'Clinic',
        type: 'text',
        placeholder: 'Enter clinic name',
        required: false,
        condition: (formData: Record<string, string>) => formData.fp_health_0_has_additional === 'yes',
      },
      {
        key: 'fp_health_1_city',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.fp_health_0_has_additional === 'yes',
      },
      {
        key: 'fp_health_1_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.fp_health_0_has_additional === 'yes',
      },
      {
        key: 'fp_health_1_has_additional',
        label: 'Do you have another additional Family Physician?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.fp_health_0_has_additional === 'yes',
      },
      {
        key: 'fp_health_2_name',
        label: 'Additional Family Physician Name',
        type: 'text',
        placeholder: 'Enter physician name',
        required: false,
        condition: (formData: Record<string, string>) => formData.fp_health_1_has_additional === 'yes',
      },
      {
        key: 'fp_health_2_clinic',
        label: 'Clinic',
        type: 'text',
        placeholder: 'Enter clinic name',
        required: false,
        condition: (formData: Record<string, string>) => formData.fp_health_1_has_additional === 'yes',
      },
      {
        key: 'fp_health_2_city',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.fp_health_1_has_additional === 'yes',
      },
      {
        key: 'fp_health_2_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.fp_health_1_has_additional === 'yes',
      },
      {
        key: 'sp_health_has',
        label: 'Do you see any specialists?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
      },
      {
        key: 'sp_health_0_name',
        label: 'Specialist Name',
        type: 'text',
        placeholder: 'Enter specialist name',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_has === 'yes',
      },
      {
        key: 'sp_health_0_specialty',
        label: 'Specialty',
        type: 'text',
        placeholder: 'e.g., Cardiologist, Neurologist',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_has === 'yes',
      },
      {
        key: 'sp_health_0_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_has === 'yes',
      },
      {
        key: 'sp_health_0_has_additional',
        label: 'Do you have an additional Specialist?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_has === 'yes',
      },
      {
        key: 'sp_health_1_name',
        label: 'Additional Specialist Name',
        type: 'text',
        placeholder: 'Enter specialist name',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_0_has_additional === 'yes',
      },
      {
        key: 'sp_health_1_specialty',
        label: 'Specialty',
        type: 'text',
        placeholder: 'e.g., Cardiologist, Neurologist',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_0_has_additional === 'yes',
      },
      {
        key: 'sp_health_1_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_0_has_additional === 'yes',
      },
      {
        key: 'sp_health_1_has_additional',
        label: 'Do you have another additional Specialist?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_0_has_additional === 'yes',
      },
      {
        key: 'sp_health_2_name',
        label: 'Additional Specialist Name',
        type: 'text',
        placeholder: 'Enter specialist name',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_1_has_additional === 'yes',
      },
      {
        key: 'sp_health_2_specialty',
        label: 'Specialty',
        type: 'text',
        placeholder: 'e.g., Cardiologist, Neurologist',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_1_has_additional === 'yes',
      },
      {
        key: 'sp_health_2_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_1_has_additional === 'yes',
      },
      {
        key: 'sp_health_2_has_additional',
        label: 'Do you have another additional Specialist?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_1_has_additional === 'yes',
      },
      {
        key: 'sp_health_3_name',
        label: 'Additional Specialist Name',
        type: 'text',
        placeholder: 'Enter specialist name',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_2_has_additional === 'yes',
      },
      {
        key: 'sp_health_3_specialty',
        label: 'Specialty',
        type: 'text',
        placeholder: 'e.g., Cardiologist, Neurologist',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_2_has_additional === 'yes',
      },
      {
        key: 'sp_health_3_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_2_has_additional === 'yes',
      },
      {
        key: 'sp_health_3_has_additional',
        label: 'Do you have another additional Specialist?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_2_has_additional === 'yes',
      },
      {
        key: 'sp_health_4_name',
        label: 'Additional Specialist Name',
        type: 'text',
        placeholder: 'Enter specialist name',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_3_has_additional === 'yes',
      },
      {
        key: 'sp_health_4_specialty',
        label: 'Specialty',
        type: 'text',
        placeholder: 'e.g., Cardiologist, Neurologist',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_3_has_additional === 'yes',
      },
      {
        key: 'sp_health_4_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.sp_health_3_has_additional === 'yes',
      },
      {
        key: 'ph_health_0_name',
        label: 'Pharmacist Name',
        type: 'text',
        placeholder: 'Enter pharmacist name',
        required: false,
      },
      {
        key: 'ph_health_0_pharmacy',
        label: 'Pharmacy',
        type: 'text',
        placeholder: 'Enter pharmacy name',
        required: false,
      },
      {
        key: 'ph_health_0_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
      },
      {
        key: 'ph_health_0_has_additional',
        label: 'Do you have an additional Pharmacist?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
      },
      {
        key: 'ph_health_1_name',
        label: 'Additional Pharmacist Name',
        type: 'text',
        placeholder: 'Enter pharmacist name',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_0_has_additional === 'yes',
      },
      {
        key: 'ph_health_1_pharmacy',
        label: 'Pharmacy',
        type: 'text',
        placeholder: 'Enter pharmacy name',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_0_has_additional === 'yes',
      },
      {
        key: 'ph_health_1_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_0_has_additional === 'yes',
      },
      {
        key: 'ph_health_1_has_additional',
        label: 'Do you have another additional Pharmacist?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_0_has_additional === 'yes',
      },
      {
        key: 'ph_health_2_name',
        label: 'Additional Pharmacist Name',
        type: 'text',
        placeholder: 'Enter pharmacist name',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_1_has_additional === 'yes',
      },
      {
        key: 'ph_health_2_pharmacy',
        label: 'Pharmacy',
        type: 'text',
        placeholder: 'Enter pharmacy name',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_1_has_additional === 'yes',
      },
      {
        key: 'ph_health_2_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_1_has_additional === 'yes',
      },
      {
        key: 'ph_health_2_has_additional',
        label: 'Do you have another additional Pharmacist?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_1_has_additional === 'yes',
      },
      {
        key: 'ph_health_3_name',
        label: 'Additional Pharmacist Name',
        type: 'text',
        placeholder: 'Enter pharmacist name',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_2_has_additional === 'yes',
      },
      {
        key: 'ph_health_3_pharmacy',
        label: 'Pharmacy',
        type: 'text',
        placeholder: 'Enter pharmacy name',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_2_has_additional === 'yes',
      },
      {
        key: 'ph_health_3_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_2_has_additional === 'yes',
      },
      {
        key: 'ph_health_3_has_additional',
        label: 'Do you have another additional Pharmacist?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_2_has_additional === 'yes',
      },
      {
        key: 'ph_health_4_name',
        label: 'Additional Pharmacist Name',
        type: 'text',
        placeholder: 'Enter pharmacist name',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_3_has_additional === 'yes',
      },
      {
        key: 'ph_health_4_pharmacy',
        label: 'Pharmacy',
        type: 'text',
        placeholder: 'Enter pharmacy name',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_3_has_additional === 'yes',
      },
      {
        key: 'ph_health_4_phone',
        label: 'Phone',
        type: 'text',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.ph_health_3_has_additional === 'yes',
      },
    ],
  },
  {
    id: 9,
    sectionId: 'financialFootprint',
    title: 'Your Financial Footprint',
    description: 'Banking and financial account information',
    questions: [
      {
        key: 'bankingStructure',
        label: 'For your personal banking, are your bank accounts joint, individually held, or some individual or joint?',
        type: 'radio',
        options: [
          { value: 'individual', label: 'Individually' },
          { value: 'joint', label: 'They are all joint accounts' },
          { value: 'mixed', label: 'Some are individually held, some are joint accounts' },
        ],
        required: false,
      },
      {
        key: 'jointBankCount',
        label: 'How many banks, trust companies or credit unions do you have accounts with?',
        type: 'number',
        placeholder: '0',
        required: false,
      },
      {
        key: 'jointInstitutionsData',
        label: 'Joint Institution Names',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'client1BankCount',
        label: 'How many banks, trust companies or credit unions do you have accounts with?',
        type: 'number',
        placeholder: '0',
        required: false,
      },
      {
        key: 'client1InstitutionsData',
        label: 'Your Institution Names',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'client2BankCount',
        label: 'How many banks, trust companies or credit unions does your spouse have accounts with?',
        type: 'number',
        placeholder: '0',
        required: false,
      },
      {
        key: 'client2InstitutionsData',
        label: 'Spouse Institution Names',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'mixedJointBankCount',
        label: 'How many joint accounts are held?',
        type: 'number',
        placeholder: '0',
        required: false,
      },
      {
        key: 'mixedJointInstitutionsData',
        label: 'Joint Institution Names',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'mixedClient1BankCount',
        label: 'How many individually held accounts do you have?',
        type: 'number',
        placeholder: '0',
        required: false,
      },
      {
        key: 'mixedClient1InstitutionsData',
        label: 'Your Institution Names',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'mixedClient2BankCount',
        label: 'How many individually held accounts does your spouse have?',
        type: 'number',
        placeholder: '0',
        required: false,
      },
      {
        key: 'mixedClient2InstitutionsData',
        label: 'Spouse Institution Names',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'hasInvestments',
        label: 'Financial Assets — Investments',
        type: 'label',
        required: false,
      },
      {
        key: 'investmentAccountsData',
        label: 'Investment Accounts',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'hasPensions',
        label: 'Financial Assets — Pensions',
        type: 'label',
        required: false,
      },
      {
        key: 'pensionRecordsData',
        label: 'Pension Records',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'hasEquity',
        label: 'Financial Assets — Employer Equity',
        type: 'label',
        required: false,
      },
      {
        key: 'equityCompensationData',
        label: 'Equity Compensation',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'hasReceivables',
        label: 'Financial Assets — Receivables',
        type: 'label',
        required: false,
      },
      {
        key: 'receivablesData',
        label: 'Receivables',
        type: 'dynamic',
        required: false,
      },
      {
        key: 'hasOtherAssets',
        label: 'Financial Assets — Other',
        type: 'label',
        required: false,
      },
      {
        key: 'otherAssetsData',
        label: 'Other Assets',
        type: 'dynamic',
        required: false,
      },
    ],
  },
  {
    id: 10,
    sectionId: 'realEstate',
    title: 'Real Estate',
    description: 'Real estate is often one of the largest and most emotionally significant parts of an estate. This section helps us understand what properties you own or rent, who owns them, where important documents are kept, and whether there are any planning opportunities or potential challenges for your executor and family.',
    questions: [
      {
        key: 'livingSituation',
        label: 'Which best describes your current living situation?',
        type: 'radio',
        options: (answers) => {
          const basicAnswers = answers.get('aboutYou') || {};
          const maritalStatus = basicAnswers['maritalStatus'] as string;
          const hasMultipleClients = maritalStatus === 'married' || maritalStatus === 'common_law';
          if (hasMultipleClients) {
            return [
              { value: 'own', label: 'I/We own a home' },
              { value: 'rent', label: 'I/We rent a home' },
              { value: 'family', label: 'I/We live with family' },
              { value: 'retirement', label: 'I/We live in a retirement residence' },
              { value: 'other', label: 'Other' },
            ];
          }
          return [
            { value: 'own', label: 'I own my home' },
            { value: 'rent', label: 'I rent my home' },
            { value: 'family', label: 'I live with family' },
            { value: 'retirement', label: 'I live in a retirement residence' },
            { value: 'other', label: 'Other' },
          ];
        },
        required: true,
      },
      {
        key: 'rentLandlordName',
        label: 'Landlord / Company Name',
        type: 'text',
        placeholder: 'Enter landlord or company name',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent',
      },
      {
        key: 'rentSameAddress',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const step1 = answers.get('aboutYou') as Record<string, string> | undefined;
          const addr = step1?.address || '';
          const shortAddr = addr.split(',')[0] || addr;
          return `Is the rental address the same as your address (${shortAddr || '123 Main Street'}?)`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent',
      },
      {
        key: 'rentAddress',
        label: 'Rental Street Address',
        type: 'text',
        placeholder: 'Enter street address',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent' && formData.rentSameAddress !== 'yes',
      },
      {
        key: 'rentCity',
        label: 'Rental City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent' && formData.rentSameAddress !== 'yes',
      },
      {
        key: 'rentProvince',
        label: 'Rental Province',
        type: 'text',
        placeholder: 'Enter province',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent' && formData.rentSameAddress !== 'yes',
      },
      {
        key: 'rentPostalCode',
        label: 'Rental Postal Code',
        type: 'text',
        placeholder: 'Enter postal code',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent' && formData.rentSameAddress !== 'yes',
      },
      {
        key: 'rentMonthlyAmount',
        label: 'Monthly Rent',
        type: 'text',
        placeholder: 'Enter monthly rent amount',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent',
      },
      {
        key: 'rentLeaseRenewalDate',
        label: 'Lease Renewal Date',
        type: 'date',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent',
      },
      {
        key: 'rentLeaseStorage',
        label: 'Where is the lease agreement stored?',
        type: 'location',
        placeholder: 'Enter storage location',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent',
      },
      {
        key: 'rentAutoPayments',
        label: 'Do you have automatic rent payments set up?',
        type: 'radio',
        options: [
          { value: 'void_cheques', label: 'Void Cheques' },
          { value: 'other', label: 'Other' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent',
      },
      {
        key: 'rentAutoPaymentsDetails',
        label: 'Provide details',
        type: 'text',
        placeholder: 'Enter details',
        required: false,
        condition: (formData: Record<string, string>) => formData.rentAutoPayments === 'other',
      },
      {
        key: 'rentSecurityDeposit',
        label: 'Did you pay a security deposit?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent',
      },
      {
        key: 'rentParkingStorage',
        label: 'Do you have parking or storage lockers?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent',
      },
      {
        key: 'rentKeyLocation',
        label: 'Location of the key to the storage locker:',
        type: 'location',
        placeholder: 'Enter where the key is located',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent' && formData.rentParkingStorage === 'yes',
      },
      {
        key: 'rentNotifyName',
        label: 'Who should be notified in case of emergency?',
        type: 'text',
        placeholder: 'Enter name and contact information',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'rent',
      },
      {
        key: 'retLandlordName',
        label: 'Retirement Residence Name',
        type: 'text',
        placeholder: 'Enter retirement residence name',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement',
      },
      {
        key: 'retSameAddress',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const step1 = answers.get('aboutYou') as Record<string, string> | undefined;
          const addr = step1?.address || '';
          const shortAddr = addr.split(',')[0] || addr;
          return `Is the retirement residence address the same as your address (${shortAddr || '123 Main Street'}?)`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement',
      },
      {
        key: 'retAddress',
        label: 'Retirement Residence Street Address',
        type: 'text',
        placeholder: 'Enter street address',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement' && formData.retSameAddress !== 'yes',
      },
      {
        key: 'retCity',
        label: 'Retirement Residence City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement' && formData.retSameAddress !== 'yes',
      },
      {
        key: 'retProvince',
        label: 'Retirement Residence Province',
        type: 'text',
        placeholder: 'Enter province',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement' && formData.retSameAddress !== 'yes',
      },
      {
        key: 'retPostalCode',
        label: 'Retirement Residence Postal Code',
        type: 'text',
        placeholder: 'Enter postal code',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement' && formData.retSameAddress !== 'yes',
      },
      {
        key: 'retMonthlyAmount',
        label: 'Monthly Fee',
        type: 'text',
        placeholder: 'Enter monthly fee amount',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement',
      },
      {
        key: 'retLeaseRenewalDate',
        label: 'Agreement Renewal Date',
        type: 'date',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement',
      },
      {
        key: 'retLeaseStorage',
        label: 'Where is the residence agreement stored?',
        type: 'location',
        placeholder: 'Enter storage location',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement',
      },
      {
        key: 'retAutoPayments',
        label: 'Do you have automatic monthly payments set up?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement',
      },
      {
        key: 'retSecurityDeposit',
        label: 'Did you pay a security deposit?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement',
      },
      {
        key: 'retParkingStorage',
        label: 'Do you have parking or storage lockers?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement',
      },
      {
        key: 'retKeyLocation',
        label: 'Location of the key to the storage locker:',
        type: 'location',
        placeholder: 'Enter where the key is located',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement' && formData.retParkingStorage === 'yes',
      },
      {
        key: 'retNotifyName',
        label: 'Who should be notified in case of emergency?',
        type: 'text',
        placeholder: 'Enter name and contact information',
        required: false,
        condition: (formData: Record<string, string>) => formData.livingSituation === 'retirement',
      },
      {
        key: 'hasRealEstate',
        label: 'Do you own any real estate?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
        description: 'This includes your home, cottages, rental properties, vacation homes, commercial buildings, farmland, vacant land, or property owned through a corporation, trust, or partnership.',
      },
    ],
  },
  {
    id: 11,
    sectionId: 'debtObligations',
    title: 'Debt and Obligations',
    description: 'Understanding your liabilities (debts and obligations) is essential for effective estate planning. This section helps us identify outstanding debts that may need to be settled from your estate, and ensures your executor has a complete picture of your financial obligations.',
    questions: [],
  },
  {
    id: 12,
    sectionId: 'lifeInsurance',
    title: 'Life Insurance',
    description: 'Life insurance can play a key role in your estate plan by providing liquidity to cover debts, taxes, and final expenses, and by protecting your loved ones financially. This section helps us understand your existing coverage so we can assess whether it aligns with your estate planning goals.',
    questions: [
      {
        key: 'client1HasLifeInsurance',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          const spouseName = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}, do you have any Life Insurance through your employer or through ${spouseName}'s employer?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      ...generateLifeInsurancePolicyQuestions('client1'),
      {
        key: 'client1HasCriticalIllnessInsurance',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          const spouseName = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}, do you have any Critical Illness Insurance through your employer or through ${spouseName}'s employer?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      ...generateCriticalIllnessPolicyQuestions('client1'),
      {
        key: 'client1HasDisabilityInsuranceEmployer',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          const spouseName = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}, do you have any Disability Insurance through your employer or through ${spouseName}'s employer?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      ...generateDisabilityInsurancePolicyQuestions('client1'),

      {
        key: 'client1HasLifeInsurancePersonal',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}, do you have any Life Insurance purchased outside of work plans or employer benefits?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      ...generateLifeInsurancePolicyQuestions('client1', 'personal'),
      {
        key: 'client1HasCriticalIllnessInsurancePersonal',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}, do you have any Critical Illness Insurance purchased outside of work plans or employer benefits?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
      },
      ...generateCriticalIllnessPolicyQuestions('client1', 'personal'),
      {
        key: 'client1HasDisabilityInsurancePersonal',
        label: (answers) => {
          const name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}, do you have any Disability Insurance purchased outside of work plans or employer benefits?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
      },
      ...generateDisabilityInsurancePolicyQuestions('client1', 'personal'),

      {
        key: 'client2HasLifeInsurance',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          const client1Name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}, do you have any Life Insurance through your employer or through ${client1Name}'s employer?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => {
          const marital = formData.maritalStatus;
          return marital === 'married' || marital === 'common_law';
        },
      },
      ...generateLifeInsurancePolicyQuestions('client2'),
      {
        key: 'client2HasCriticalIllnessInsurance',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          const client1Name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}, do you have any Critical Illness Insurance through your employer or through ${client1Name}'s employer?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => {
          const marital = formData.maritalStatus;
          return marital === 'married' || marital === 'common_law';
        },
      },
      ...generateCriticalIllnessPolicyQuestions('client2'),
      {
        key: 'client2HasDisabilityInsuranceEmployer',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          const client1Name = answers.get('aboutYou')?.fullName as string || 'Client 1';
          return `${name}, do you have any Disability Insurance through your employer or through ${client1Name}'s employer?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => {
          const marital = formData.maritalStatus;
          return marital === 'married' || marital === 'common_law';
        },
      },
      ...generateDisabilityInsurancePolicyQuestions('client2'),

      {
        key: 'client2HasLifeInsurancePersonal',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}, do you have any Life Insurance purchased outside of work plans or employer benefits?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => {
          const marital = formData.maritalStatus;
          return marital === 'married' || marital === 'common_law';
        },
      },
      ...generateLifeInsurancePolicyQuestions('client2', 'personal'),
      {
        key: 'client2HasCriticalIllnessInsurancePersonal',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}, do you have any Critical Illness Insurance purchased outside of work plans or employer benefits?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => {
          const marital = formData.maritalStatus;
          return marital === 'married' || marital === 'common_law';
        },
      },
      ...generateCriticalIllnessPolicyQuestions('client2', 'personal'),
      {
        key: 'client2HasDisabilityInsurancePersonal',
        label: (answers) => {
          const name = answers.get('aboutYou')?.spouseName as string || 'Client 2';
          return `${name}, do you have any Disability Insurance purchased outside of work plans or employer benefits?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => {
          const marital = formData.maritalStatus;
          return marital === 'married' || marital === 'common_law';
        },
      },
      ...generateDisabilityInsurancePolicyQuestions('client2', 'personal'),
      ...Array.from({ length: MAX_CORPORATIONS }, (_, i) => generateCorporationInsuranceQuestions(i)).flat(),
    ],
  },
  {
    id: 13,
    sectionId: 'propertyLiabilityInsurance',
    title: 'Property and Liability Insurance',
    description: 'This section captures details about your property and liability insurance coverage, including policies for your home, vehicles, and other assets, as well as any umbrella liability policies.',
    questions: [],
  },
  {
    id: 14,
    sectionId: 'legacyIntent',
    title: 'Legacy Intent',
    description: 'Your Will determines who legally inherits your assets. It doesn\'t always explain what you hope will happen to them.\nFor many families, uncertainty—not the legal documents themselves—is what leads to misunderstandings and conflict. This section gives you the opportunity to record your wishes for important assets, identify whether those wishes have been discussed, and note where any supporting documents can be found.\nThis information does not replace your Will or other legal documents, but it can provide valuable guidance to your family, executor, and professional advisors.',
    questions: [],
  },
  {
    id: 15,
    sectionId: 'wills',
    title: 'Wills',
    description: 'A Will is the foundation of your estate plan. It directs how your assets are distributed, names your executor, and can include trusts for beneficiaries with special needs. This section helps us understand the current state of your Will(s) and whether updates may be needed.',
    questions: [
      {
        key: 'client1HasWill',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const name = (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1';
          return `Does ${name} have a Will?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'client2HasWill',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const name = (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2';
          return `Does ${name} have a Will?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => {
          const marital = formData.maritalStatus;
          return marital === 'married' || marital === 'common_law';
        },
      },
    ],
  },
  {
    id: 16,
    sectionId: 'powersOfAttorney',
    title: 'Powers of Attorney',
    description: 'A Power of Attorney (POA) lets you appoint someone to make decisions on your behalf if you become unable to do so. There are two types: one for personal care (health decisions) and one for property (financial decisions).',
    questions: [
      {
        key: 'client1HasPoaPersonalCare',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const name = (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1';
          return `Does ${name} have a Power of Attorney for Personal Care?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'client1SpouseIsPoaPersonalCare',
        label: 'Is your spouse your Attorney for Personal Care?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes' && (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law'),
      },
      {
        key: 'client1PoaPersonalCareName',
        label: 'Attorney Name',
        type: 'person',
        placeholder: 'Select or add a person',
        required: false,
        personDefaultType: 'trusted',
        personFilterTypes: ['family', 'trusted', 'other'],
        personShowContactFields: true,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes' && formData.client1SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client1PoaPersonalCarePhone',
        label: 'Phone',
        type: 'tel',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes' && formData.client1SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client1PoaPersonalCareEmail',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes' && formData.client1SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client1PoaPersonalCareRelationship',
        label: 'Relationship',
        type: 'text',
        placeholder: 'e.g., Son, Daughter, Friend',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes' && formData.client1SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client1PoaPersonalCareIsCanadaResident',
        label: 'Is this person a resident of Canada?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes' && formData.client1SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client1PoaPersonalCareCountry',
        label: 'Country of Residence',
        type: 'text',
        placeholder: 'Enter country',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes' && formData.client1SpouseIsPoaPersonalCare !== 'yes' && formData.client1PoaPersonalCareIsCanadaResident !== 'yes',
      },
      {
        key: 'client1PoaPersonalCareProvince',
        label: 'Province',
        type: 'text',
        placeholder: 'Enter province',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes' && formData.client1SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client1PoaPersonalCareCity',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes' && formData.client1SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client1PoaPersonalCareHasDocCopy',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const step1 = answers.get('aboutYou') || {};
          const attorneyName = step1['spouseIsPoaPersonalCare'] === 'yes'
            ? (step1['spouseName'] as string) || 'the named attorney'
            : (step1['client1PoaPersonalCareName'] as string) || 'the named attorney';
          return `Does ${attorneyName} have a copy of your Power of Attorney for Personal Care document?`;
        },
        type: 'radio',
        options: [
          { value: 'yes_on_file', label: 'Yes, they have a copy on file' },
          { value: 'no_can_access', label: 'No, but they know where to access it' },
          { value: 'no_not_discussed', label: 'No, this has not been discussed' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes',
      },
      {
        key: 'client1HasAlternatePoaPersonalCare',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const step1 = answers.get('aboutYou') || {};
          const attorneyName = step1['spouseIsPoaPersonalCare'] === 'yes'
            ? (step1['spouseName'] as string) || 'the named attorney'
            : (step1['client1PoaPersonalCareName'] as string) || 'the named attorney';
          return `Have you named any contingent Power(s) of Attorney for Personal Care, should ${attorneyName} be unable or unwilling to act?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaPersonalCare === 'yes',
      },
      {
        key: 'client1AlternatePoaPersonalCareCount',
        label: 'How many contingent attorneys for personal care have you named?',
        type: 'select',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasAlternatePoaPersonalCare === 'yes',
      },
      {
        key: 'client1HasLivingWill',
        label: 'Do you have a Living Will (advance directive)?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
      },
      {
        key: 'client1HasPoaProperty',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const name = (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1';
          return `${name}, do you currently have a Power of Attorney for Property?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: "I'm not sure" },
        ],
        required: true,
      },
      {
        key: 'spouseIsPoaProperty',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const spouseName = (answers.get('aboutYou')?.['spouseName'] as string) || 'your spouse';
          return `Is ${spouseName} named as one of your attorneys for property?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: "I'm not sure" },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasPoaProperty === 'yes' && (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law'),
      },
      {
        key: 'client2HasPoaPersonalCare',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const name = (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2';
          return `Does ${name} have a Power of Attorney for Personal Care?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law',
      },
      {
        key: 'client2SpouseIsPoaPersonalCare',
        label: 'Is your spouse your Attorney for Personal Care?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes',
      },
      {
        key: 'client2PoaPersonalCareName',
        label: 'Attorney Name',
        type: 'person',
        placeholder: 'Select or add a person',
        required: false,
        personDefaultType: 'trusted',
        personFilterTypes: ['family', 'trusted', 'other'],
        personShowContactFields: true,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes' && formData.client2SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client2PoaPersonalCarePhone',
        label: 'Phone',
        type: 'tel',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes' && formData.client2SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client2PoaPersonalCareEmail',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes' && formData.client2SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client2PoaPersonalCareRelationship',
        label: 'Relationship',
        type: 'text',
        placeholder: 'e.g., Son, Daughter, Friend',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes' && formData.client2SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client2PoaPersonalCareCountry',
        label: 'Country of Residence',
        type: 'text',
        placeholder: 'Enter country',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes' && formData.client2SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client2PoaPersonalCareProvince',
        label: 'Province',
        type: 'text',
        placeholder: 'Enter province',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes' && formData.client2SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client2PoaPersonalCareCity',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes' && formData.client2SpouseIsPoaPersonalCare !== 'yes',
      },
      {
        key: 'client2PoaPersonalCareHasDocCopy',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const step1 = answers.get('aboutYou') || {};
          const attorneyName = step1['client2SpouseIsPoaPersonalCare'] === 'yes'
            ? (step1['fullName'] as string) || 'the named attorney'
            : (step1['client2PoaPersonalCareName'] as string) || 'the named attorney';
          return `Does ${attorneyName} have a copy of your Power of Attorney for Personal Care document?`;
        },
        type: 'radio',
        options: [
          { value: 'yes_on_file', label: 'Yes, they have a copy on file' },
          { value: 'no_can_access', label: 'No, but they know where to access it' },
          { value: 'no_not_discussed', label: 'No, this has not been discussed' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes',
      },
      {
        key: 'client2HasAlternatePoaPersonalCare',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const step1 = answers.get('aboutYou') || {};
          const attorneyName = step1['client2SpouseIsPoaPersonalCare'] === 'yes'
            ? (step1['fullName'] as string) || 'the named attorney'
            : (step1['client2PoaPersonalCareName'] as string) || 'the named attorney';
          return `Have you named any contingent Power(s) of Attorney for Personal Care, should ${attorneyName} be unable or unwilling to act?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaPersonalCare === 'yes',
      },
      {
        key: 'client2AlternatePoaPersonalCareCount',
        label: 'How many contingent attorneys for personal care have you named?',
        type: 'select',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasAlternatePoaPersonalCare === 'yes',
      },
      {
        key: 'client2HasLivingWill',
        label: 'Does your spouse have a Living Will (advance directive)?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law',
      },
      {
        key: 'client2HasPoaProperty',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const name = (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2';
          return `${name}, do you currently have a Power of Attorney for Property?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: "I'm not sure" },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law',
      },
      {
        key: 'client2SpouseIsPoaProperty',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const spouseName = (answers.get('aboutYou')?.['fullName'] as string) || 'your spouse';
          return `Is ${spouseName} named as one of your attorneys for property?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: "I'm not sure" },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasPoaProperty === 'yes',
      },
    ],
  },
  {
    id: 17,
    sectionId: 'estateTrustees',
    title: 'Estate Trustees (Executors)',
    description: 'An Estate Trustee (also called an Executor) is the person or institution responsible for administering your estate after you pass away. This includes paying debts, filing taxes, and distributing assets according to your Will.',
    questions: [
      {
        key: 'client1HasEstateTrustee',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const name = (answers.get('aboutYou')?.['fullName'] as string) || 'Client 1';
          return `Has ${name} named an Estate Trustee (Executor)?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        key: 'client1SpouseIsEstateTrustee',
        label: 'Is your spouse your Estate Trustee?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes' && (formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law'),
      },
      {
        key: 'client1EstateTrusteeName',
        label: 'Estate Trustee Name',
        type: 'person',
        placeholder: 'Select or add a person',
        required: false,
        personDefaultType: 'trusted',
        personFilterTypes: ['family', 'trusted', 'other'],
        personShowContactFields: true,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes' && formData.client1SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client1EstateTrusteePhone',
        label: 'Phone',
        type: 'tel',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes' && formData.client1SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client1EstateTrusteeEmail',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes' && formData.client1SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client1EstateTrusteeRelationship',
        label: 'Relationship',
        type: 'text',
        placeholder: 'e.g., Son, Daughter, Friend, Trust Company',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes' && formData.client1SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client1EstateTrusteeIsCanadaResident',
        label: 'Is this person a resident of Canada?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes' && formData.client1SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client1EstateTrusteeCountry',
        label: 'Country of Residence',
        type: 'text',
        placeholder: 'Enter country',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes' && formData.client1SpouseIsEstateTrustee !== 'yes' && formData.client1EstateTrusteeIsCanadaResident !== 'yes',
      },
      {
        key: 'client1EstateTrusteeProvince',
        label: 'Province',
        type: 'text',
        placeholder: 'Enter province',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes' && formData.client1SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client1EstateTrusteeCity',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes' && formData.client1SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client1EstateTrusteeHasDocCopy',
        label: 'Does the Estate Trustee have a copy of the Will?',
        type: 'radio',
        options: [
          { value: 'yes_on_file', label: 'Yes, copy on file' },
          { value: 'no_can_access', label: 'No, but can access it' },
          { value: 'no_not_discussed', label: 'No, not discussed' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes',
      },
      {
        key: 'client1EstateTrusteeKnowsWillLocation',
        label: 'Does your Estate Trustee know where your Will is located?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes',
      },
      {
        key: 'client1HasAlternateEstateTrustee',
        label: 'Have you named an alternate Estate Trustee?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasEstateTrustee === 'yes',
      },
      {
        key: 'client1AlternateEstateTrustee1Name',
        label: 'Alternate Estate Trustee Name',
        type: 'person',
        placeholder: 'Select or add a person',
        required: false,
        personDefaultType: 'trusted',
        personFilterTypes: ['family', 'trusted', 'other'],
        personShowContactFields: true,
        condition: (formData: Record<string, string>) => formData.client1HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client1AlternateEstateTrustee1Phone',
        label: 'Phone',
        type: 'tel',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client1AlternateEstateTrustee1Email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client1AlternateEstateTrustee1Relationship',
        label: 'Relationship',
        type: 'text',
        placeholder: 'e.g., Son, Daughter, Friend',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client1AlternateEstateTrustee1IsCanadaResident',
        label: 'Is this person a resident of Canada?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client1AlternateEstateTrustee1Country',
        label: 'Country of Residence',
        type: 'text',
        placeholder: 'Enter country',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasAlternateEstateTrustee === 'yes' && formData.client1AlternateEstateTrustee1IsCanadaResident !== 'yes',
      },
      {
        key: 'client1AlternateEstateTrustee1Province',
        label: 'Province',
        type: 'text',
        placeholder: 'Enter province',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client1AlternateEstateTrustee1City',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client1AlternateEstateTrustee1HasDocCopy',
        label: 'Does the alternate Estate Trustee have a copy of the Will?',
        type: 'radio',
        options: [
          { value: 'yes_on_file', label: 'Yes, copy on file' },
          { value: 'no_can_access', label: 'No, but can access it' },
          { value: 'no_not_discussed', label: 'No, not discussed' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client1HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client2HasEstateTrustee',
        label: (answers: Map<string, Record<string, unknown>>) => {
          const name = (answers.get('aboutYou')?.['spouseName'] as string) || 'Client 2';
          return `Has ${name} named an Estate Trustee (Executor)?`;
        },
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.maritalStatus === 'married' || formData.maritalStatus === 'common_law',
      },
      {
        key: 'client2SpouseIsEstateTrustee',
        label: 'Is your spouse your Estate Trustee?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes',
      },
      {
        key: 'client2EstateTrusteeName',
        label: 'Estate Trustee Name',
        type: 'person',
        placeholder: 'Select or add a person',
        required: false,
        personDefaultType: 'trusted',
        personFilterTypes: ['family', 'trusted', 'other'],
        personShowContactFields: true,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes' && formData.client2SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client2EstateTrusteePhone',
        label: 'Phone',
        type: 'tel',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes' && formData.client2SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client2EstateTrusteeEmail',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes' && formData.client2SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client2EstateTrusteeRelationship',
        label: 'Relationship',
        type: 'text',
        placeholder: 'e.g., Son, Daughter, Friend, Trust Company',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes' && formData.client2SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client2EstateTrusteeIsCanadaResident',
        label: 'Is this person a resident of Canada?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes' && formData.client2SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client2EstateTrusteeCountry',
        label: 'Country of Residence',
        type: 'text',
        placeholder: 'Enter country',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes' && formData.client2SpouseIsEstateTrustee !== 'yes' && formData.client2EstateTrusteeIsCanadaResident !== 'yes',
      },
      {
        key: 'client2EstateTrusteeProvince',
        label: 'Province',
        type: 'text',
        placeholder: 'Enter province',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes' && formData.client2SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client2EstateTrusteeCity',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes' && formData.client2SpouseIsEstateTrustee !== 'yes',
      },
      {
        key: 'client2EstateTrusteeHasDocCopy',
        label: 'Does the Estate Trustee have a copy of the Will?',
        type: 'radio',
        options: [
          { value: 'yes_on_file', label: 'Yes, copy on file' },
          { value: 'no_can_access', label: 'No, but can access it' },
          { value: 'no_not_discussed', label: 'No, not discussed' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes',
      },
      {
        key: 'client2EstateTrusteeKnowsWillLocation',
        label: 'Does your spouse\'s Estate Trustee know where their Will is located?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes',
      },
      {
        key: 'client2HasAlternateEstateTrustee',
        label: 'Has your spouse named an alternate Estate Trustee?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasEstateTrustee === 'yes',
      },
      {
        key: 'client2AlternateEstateTrustee1Name',
        label: 'Alternate Estate Trustee Name',
        type: 'person',
        placeholder: 'Select or add a person',
        required: false,
        personDefaultType: 'trusted',
        personFilterTypes: ['family', 'trusted', 'other'],
        personShowContactFields: true,
        condition: (formData: Record<string, string>) => formData.client2HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client2AlternateEstateTrustee1Phone',
        label: 'Phone',
        type: 'tel',
        placeholder: 'Enter phone number',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client2AlternateEstateTrustee1Email',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email address',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client2AlternateEstateTrustee1Relationship',
        label: 'Relationship',
        type: 'text',
        placeholder: 'e.g., Son, Daughter, Friend',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client2AlternateEstateTrustee1IsCanadaResident',
        label: 'Is this person a resident of Canada?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client2AlternateEstateTrustee1Country',
        label: 'Country of Residence',
        type: 'text',
        placeholder: 'Enter country',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasAlternateEstateTrustee === 'yes' && formData.client2AlternateEstateTrustee1IsCanadaResident !== 'yes',
      },
      {
        key: 'client2AlternateEstateTrustee1Province',
        label: 'Province',
        type: 'text',
        placeholder: 'Enter province',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client2AlternateEstateTrustee1City',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasAlternateEstateTrustee === 'yes',
      },
      {
        key: 'client2AlternateEstateTrustee1HasDocCopy',
        label: 'Does the alternate Estate Trustee have a copy of the Will?',
        type: 'radio',
        options: [
          { value: 'yes_on_file', label: 'Yes, copy on file' },
          { value: 'no_can_access', label: 'No, but can access it' },
          { value: 'no_not_discussed', label: 'No, not discussed' },
        ],
        required: false,
        condition: (formData: Record<string, string>) => formData.client2HasAlternateEstateTrustee === 'yes',
      },
    ],
  },
  {
    id: 18,
    sectionId: 'funeralArrangements',
    title: 'Final Wishes & Arrangements',
    description: 'Help the people looking after your affairs understand what matters to you, what you\'ve already arranged, and who they should contact.',
    questions: [],
  },
  {
    id: 19,
    sectionId: 'workplacePensionsBenefits',
    title: 'Workplace Pensions & Benefits',
    description: 'Some valuable financial benefits don\'t appear on your regular investment statements. Pensions, workplace savings plans, stock compensation and other employer benefits can remain with current or former employers for many years. We\'ll identify what you have, who administers it and where the important information can be found.',
    questions: [],
  },
];
