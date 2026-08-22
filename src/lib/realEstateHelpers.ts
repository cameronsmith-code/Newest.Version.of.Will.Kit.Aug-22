import type { StepQuestion } from './steps';

const PROPERTY_TYPES = [
  'Primary residence',
  'Cottage',
  'Vacation property',
  'Rental property',
  'Commercial property',
  'Vacant land',
  'Farm',
  'Condo',
  'Foreign property',
  'Other',
];

const PROPERTY_USE_OPTIONS = [
  { value: 'principal_residence', label: 'Primary residence' },
  { value: 'cottage', label: 'Cottage / Seasonal home' },
  { value: 'vacation', label: 'Vacation property' },
  { value: 'rental', label: 'Rental property' },
  { value: 'mixed', label: 'Mixed personal & rental' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'vacant_land', label: 'Vacant land' },
  { value: 'farm', label: 'Farm' },
  { value: 'other', label: 'Other' },
];

const OWNERSHIP_OPTIONS = [
  { value: 'me', label: 'Me' },
  { value: 'spouse', label: 'My spouse' },
  { value: 'joint_spouse', label: 'Jointly with spouse' },
  { value: 'joint_other', label: 'Jointly with another person' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'trust', label: 'Family Trust' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
];

const OWNERSHIP_HELD_OPTIONS = [
  { value: 'joint_tenancy', label: 'Joint Tenancy' },
  { value: 'tenants_in_common', label: 'Tenants in Common' },
  { value: 'not_sure', label: 'Not sure' },
];

const YES_NO_NOTSURE = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'Not sure' },
];

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

function propCond(n: number, extra?: (formData: Record<string, string>) => boolean) {
  return (formData: Record<string, string>) => {
    if (formData.hasRealEstate !== 'yes') return false;
    const count = parseInt(formData.propertyCount || '0', 10);
    if (count < n) return false;
    if (extra) return extra(formData);
    return true;
  };
}

export function generatePropertyQuestions(n: number): StepQuestion[] {
  const prefix = `property${n}`;
  const questions: StepQuestion[] = [
    {
      key: `${prefix}Name`,
      label: 'Property Name:',
      type: 'text',
      placeholder: 'Enter a name for this property',
      required: false,
      condition: propCond(n),
    },
    {
      key: `${prefix}Country`,
      label: 'Country',
      type: 'text',
      placeholder: 'Enter country',
      required: false,
      condition: propCond(n),
    },
    {
      key: `${prefix}Province`,
      label: 'Province / State',
      type: 'text',
      placeholder: 'Enter province or state',
      required: false,
      condition: propCond(n),
    },
    {
      key: `${prefix}Municipality`,
      label: 'Municipality',
      type: 'text',
      placeholder: 'Enter municipality',
      required: false,
      condition: propCond(n),
    },
    {
      key: `${prefix}Use`,
      label: 'How is this property primarily used?',
      type: 'radio',
      options: PROPERTY_USE_OPTIONS,
      required: false,
      condition: propCond(n),
    },
    {
      key: `${prefix}Ownership`,
      label: 'Who legally owns this property?',
      type: 'radio',
      options: OWNERSHIP_OPTIONS,
      required: false,
      condition: propCond(n),
    },
    {
      key: `${prefix}WhichCorporation`,
      label: 'Which corporation?',
      type: 'text',
      placeholder: 'Enter corporation name',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}Ownership`] === 'corporation'),
    },
    {
      key: `${prefix}WhichTrust`,
      label: 'Which trust?',
      type: 'text',
      placeholder: 'Enter trust name',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}Ownership`] === 'trust'),
    },
    {
      key: `${prefix}WhichPartnership`,
      label: 'Which partnership?',
      type: 'text',
      placeholder: 'Enter partnership name',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}Ownership`] === 'partnership'),
    },
    {
      key: `${prefix}OtherOwnerName`,
      label: 'Name of the other person:',
      type: 'text',
      placeholder: 'Enter full name',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}Ownership`] === 'other' || fd[`${prefix}Ownership`] === 'joint_other'),
    },
    {
      key: `${prefix}OtherOwnerPhone`,
      label: 'Phone number:',
      type: 'tel',
      placeholder: 'Enter phone number',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}Ownership`] === 'other' || fd[`${prefix}Ownership`] === 'joint_other'),
    },
    {
      key: `${prefix}OtherOwnerCity`,
      label: 'City of Residence:',
      type: 'text',
      placeholder: 'Enter city',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}Ownership`] === 'other' || fd[`${prefix}Ownership`] === 'joint_other'),
    },
    {
      key: `${prefix}OwnershipHeld`,
      label: 'How is ownership held?',
      type: 'radio',
      options: OWNERSHIP_HELD_OPTIONS,
      required: false,
      condition: propCond(n, (fd) => {
        const o = fd[`${prefix}Ownership`];
        return o === 'joint_spouse' || o === 'joint_other';
      }),
    },
    {
      key: `${prefix}HasBeneficialOwner`,
      label: 'Does anyone else have a beneficial ownership interest?',
      type: 'radio',
      options: YES_NO_NOTSURE,
      required: false,
      condition: propCond(n),
    },
    {
      key: `${prefix}BeneficialOwnerLabel`,
      label: 'With who?',
      type: 'text',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}HasBeneficialOwner`] === 'yes'),
    },
    {
      key: `${prefix}BeneficialOwnerName`,
      label: 'Name:',
      type: 'text',
      placeholder: 'Enter full name',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}HasBeneficialOwner`] === 'yes'),
    },
    {
      key: `${prefix}BeneficialOwnerPhone`,
      label: 'Phone:',
      type: 'tel',
      placeholder: 'Enter phone number',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}HasBeneficialOwner`] === 'yes'),
    },
    {
      key: `${prefix}BeneficialOwnerCity`,
      label: 'City of Residence:',
      type: 'text',
      placeholder: 'Enter city',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}HasBeneficialOwner`] === 'yes'),
    },
    {
      key: `${prefix}BeneficialOwnerPercent`,
      label: 'Ownership %:',
      type: 'text',
      placeholder: 'e.g., 25%',
      required: false,
      condition: propCond(n, (fd) => fd[`${prefix}HasBeneficialOwner`] === 'yes'),
    },
  ];

  return questions;
}

export const REAL_ESTATE_PROPERTY_TYPES = PROPERTY_TYPES;
export const REAL_ESTATE_YES_NO = YES_NO;
