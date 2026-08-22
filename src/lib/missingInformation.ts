/**
 * Missing Information Handler
 *
 * Converts missing information into actionable planning items
 * rather than silently failing or displaying "Unknown".
 */

import type { MissingInformationItem, LimitationImportance } from './outputConfidenceTypes';

/**
 * Create an actionable missing-information item.
 */
export function createMissingInfoItem(
  id: string,
  label: string,
  description: string,
  options?: {
    whyItMatters?: string;
    suggestedAction?: string;
    importance?: LimitationImportance;
    sourceFieldId?: string;
  }
): MissingInformationItem {
  return {
    id,
    label,
    description,
    whyItMatters: options?.whyItMatters,
    suggestedAction: options?.suggestedAction,
    importance: options?.importance || 'worthConfirming',
    sourceFieldId: options?.sourceFieldId,
  };
}

/**
 * Detect missing document location for a known document.
 */
export function missingDocumentLocation(
  docName: string,
  childName?: string,
  sourceFieldId?: string
): MissingInformationItem {
  const subject = childName ? `${childName}'s ${docName}` : `the ${docName}`;
  return createMissingInfoItem(
    `missing_doc_${docName.replace(/\s+/g, '_').toLowerCase()}`,
    `Locate ${subject}`,
    `${subject} was identified, but its current location wasn't provided.`,
    {
      whyItMatters:
        childName
          ? `This document may be important if ${childName} changes schools or caregivers. Having it accessible could save time during a transition.`
          : `This document may be important for the people stepping in. Having it accessible could save time during a transition.`,
      suggestedAction: `Consider keeping an up-to-date copy with other important records.`,
      importance: 'worthConfirming',
      sourceFieldId,
    }
  );
}

/**
 * Detect missing guardian conversation confirmation.
 */
export function missingGuardianConversation(
  guardianName: string
): MissingInformationItem {
  return createMissingInfoItem(
    'missing_guardian_conversation',
    `Have the guardian conversation`,
    `${guardianName} is currently identified as your intended guardian, but the Kit does not have confirmation that you've discussed the role with them.`,
    {
      whyItMatters:
        'Your guardian should understand the role, be willing to act, and have the opportunity to ask questions before they are named in your Will.',
      suggestedAction: `Discuss the role with ${guardianName} and confirm they are willing to act.`,
      importance: 'professionalReview',
    }
  );
}

/**
 * Detect missing contact for an important person in a child's life.
 */
export function missingImportantContact(
  personName: string,
  childName: string
): MissingInformationItem {
  return createMissingInfoItem(
    `missing_contact_${personName.replace(/\s+/g, '_').toLowerCase()}`,
    `Add ${personName}'s parent or guardian contact information`,
    `${personName} is identified as one of ${childName}'s most important relationships, but no practical parent or guardian contact has been recorded.`,
    {
      whyItMatters:
        `If ${childName} moves, having a contact could make it much easier for the guardians to help maintain the relationship.`,
      suggestedAction: `Add contact details for ${personName}'s parent or guardian.`,
      importance: 'worthConfirming',
    }
  );
}

/**
 * Detect missing professional contact when one is needed for verification.
 */
export function missingProfessionalContact(
  role: string
): MissingInformationItem {
  return createMissingInfoItem(
    `missing_professional_${role.replace(/\s+/g, '_').toLowerCase()}`,
    `Consider adding ${role} to your Professional Team`,
    `No ${role} was identified in your Professional Team, but one may be helpful for reviewing your estate plan.`,
    {
      importance: 'informational',
    }
  );
}
