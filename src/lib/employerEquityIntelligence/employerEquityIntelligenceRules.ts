/**
 * Employer Equity Intelligence — Stage 1 Pure Rules
 *
 * Each rule is a pure function: (benefit, evaluationDate) → IntelligenceItem | null
 * No React, no context, no state writes, no side effects.
 */

import type {
  EmployerEquityBenefitInput,
  EquityIntelligenceClassification,
  EquityIntelligenceConfidence,
  EquityIntelligenceEvidence,
  EquityIntelligenceItem,
  EquityIntelligenceTopic,
} from './employerEquityIntelligenceTypes';
import {
  evaluateOptionExpiry,
  evaluateEmployerEquityDeadline,
  deadlineStatusToClassification,
} from './deadlineEngine';
import type { EquityDeadlineInput } from './employerEquityIntelligenceTypes';
import type { EquityDeadlineResult } from './employerEquityIntelligenceTypes';
import { buildAudienceWording } from './audienceTranslations';

// ── Helpers ──

function isMeaningfulBenefit(benefit: EmployerEquityBenefitInput): boolean {
  // A benefit is "meaningful" if it has any reported value, option count,
  // or the client indicated they own or have contingent awards.
  if (benefit.reportedValueAmount && benefit.reportedValueAmount > 0) return true;
  if (benefit.optionCount && benefit.optionCount > 0) return true;
  const ownership = benefit.ownershipStatus;
  if (ownership === 'currently_own' || ownership === 'both' || ownership === 'future_contingent') return true;
  if (benefit.vestingStatus && benefit.vestingStatus !== 'fully_vested') return true;
  return false;
}

function hasUnexercisedOptions(benefit: EmployerEquityBenefitInput): boolean {
  return (
    benefit.benefitType === 'stock_options' &&
    (benefit.ownershipStatus === 'currently_own' ||
      benefit.ownershipStatus === 'both' ||
      benefit.ownershipStatus === 'future_contingent' ||
      !!benefit.optionCount)
  );
}

function evidence(field: string, label: string, value: unknown): EquityIntelligenceEvidence {
  return { field, label, value: value as EquityIntelligenceEvidence['value'] };
}

function itemId(benefitId: string, topic: EquityIntelligenceTopic): string {
  return `eei_${benefitId}_${topic}`;
}

// ── Rule A: death_treatment_unknown → worth_reviewing ──

export function ruleDeathTreatmentUnknown(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  const known = benefit.deathIncapacityKnown;
  if (known === 'yes') return null;
  // Fires when unknown or not_sure
  if (known !== 'no' && known !== 'not_sure' && known !== undefined) return null;
  if (known === undefined && !isMeaningfulBenefit(benefit)) return null;

  const topic: EquityIntelligenceTopic = 'death_treatment_unknown';
  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'requires_confirmation',
    title: 'Death treatment unknown',
    summary: `It is not known what happens to this ${benefit.benefitTypeLabel} on death.`,
    whyItMatters:
      'Without knowing whether unvested awards vest, options accelerate, or benefits cancel on death, the estate plan may not account for this asset correctly.',
    suggestedActions: [
      'Obtain the plan document or summary plan description',
      'Confirm post-death treatment with the plan administrator: vesting, cancellation/continuation, exercise/settlement, recipient, deadlines',
    ],
    evidence: [
      evidence('deathIncapacityKnown', 'Death/incapacity rules known', known || 'not provided'),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule B: known post-death deadline → needs_attention / operational instruction ──

export function ruleDeathDeadline(
  benefit: EmployerEquityBenefitInput,
  evaluationDate: Date,
): EquityIntelligenceItem | null {
  const known = benefit.deathIncapacityKnown;
  if (known !== 'yes') return null;
  const notes = benefit.deathIncapacityNotes;
  if (!notes || !notes.trim()) return null;
  // If the notes mention a deadline or time period, this is operational
  const deadlinePattern = /\b(\d+)\s*(day|month|year|week)s?\b/i;
  const hasDeadline = deadlinePattern.test(notes);
  if (!hasDeadline) return null;

  const classification: EquityIntelligenceClassification = 'needs_attention';
  const topic: EquityIntelligenceTopic = 'death_deadline';

  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification,
    confidence: 'client_reported',
    title: 'Post-death deadline identified',
    summary: `The client reports a time-limited rule on death for this ${benefit.benefitTypeLabel}: "${notes.trim()}"`,
    whyItMatters:
      'An executor or estate trustee may need to act within a specific window after death. Missing this deadline could forfeit the benefit.',
    suggestedActions: [
      'Confirm the exact deadline with the plan administrator',
      'Preserve the period/date, administrator, plan documents, and benefit ID',
      'Document the deadline in estate planning instructions',
      'Do not independently verify legal enforceability — flag for confirmation',
    ],
    evidence: [
      evidence('deathIncapacityKnown', 'Death rules known', known),
      evidence('deathIncapacityNotes', 'Death rules notes', notes),
      evidence('benefitId', 'Benefit ID', benefit.benefitId),
    ],
    deadlineResult: evaluateOptionExpiry(undefined, evaluationDate),
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule C: option expiry known → classification via deadline engine ──

export function ruleOptionExpiryKnown(
  benefit: EmployerEquityBenefitInput,
  evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (benefit.benefitType !== 'stock_options') return null;
  if (benefit.optionExpiryStatus !== 'known') return null;
  if (!benefit.optionExpiryDate) return null;

  const deadlineResult = evaluateOptionExpiry(benefit.optionExpiryDate, evaluationDate);
  const classification = deadlineStatusToClassification(deadlineResult.status);
  const topic: EquityIntelligenceTopic = 'option_expiry';

  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification,
    confidence: 'client_reported',
    title: `Stock option expiry ${deadlineResult.status.replace(/_/g, ' ')}`,
    summary: `Options from ${benefit.employerName} expire on ${benefit.optionExpiryDate} (${deadlineResult.monthsRemaining !== undefined ? `${deadlineResult.monthsRemaining} months remaining` : 'date unparseable'}).`,
    whyItMatters:
      'Options that expire unexercised are typically forfeited. The window to act is finite and may be shortened by termination or death.',
    suggestedActions:
      classification === 'needs_attention'
        ? ['Exercise or plan for exercise before expiry', 'Consult a tax advisor on exercise timing']
        : ['Monitor expiry date', 'Plan exercise strategy in advance'],
    evidence: [
      evidence('optionExpiryStatus', 'Option expiry known', benefit.optionExpiryStatus),
      evidence('optionExpiryDate', 'Expiry date', benefit.optionExpiryDate),
      evidence('optionCount', 'Option count', benefit.optionCount),
    ],
    deadlineResult,
    audienceWording: buildAudienceWording(topic, benefit, { monthsRemaining: deadlineResult.monthsRemaining, deadlineDate: benefit.optionExpiryDate }),
  };
}

// ── Rule D: option expiry unknown + unexercised options → worth_reviewing ──

export function ruleOptionExpiryUnknown(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (benefit.benefitType !== 'stock_options') return null;
  if (benefit.optionExpiryStatus === 'known' || benefit.optionExpiryStatus === 'none_reported') return null;
  if (!hasUnexercisedOptions(benefit)) return null;

  // Fires when expiry is unknown or not provided
  const status = benefit.optionExpiryStatus || 'unknown';
  const topic: EquityIntelligenceTopic = 'option_expiry_unknown';

  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'requires_confirmation',
    title: 'Option expiry date unknown',
    summary: `The client has stock options from ${benefit.employerName} but the expiry date is not known.`,
    whyItMatters:
      'Options may expire worthless if not exercised in time. Without knowing the expiry date, there is a risk of unintentional forfeiture.',
    suggestedActions: [
      'Obtain the option agreement or grant documentation',
      'Confirm the expiry date with the plan administrator',
    ],
    evidence: [
      evidence('optionExpiryStatus', 'Option expiry status', status),
      evidence('optionCount', 'Option count', benefit.optionCount),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule E: former employer + outstanding benefit → consolidated worth_reviewing ──
// Consolidates: option_expiry_unknown, missing_administrator, missing_documents
// into ONE former-employer story. The engine suppresses those individual topics
// for former-employer benefits when this rule fires.

export const FORMER_EMPLOYER_CONSOLIDATION_TOPICS: EquityIntelligenceTopic[] = [
  'option_expiry_unknown',
  'missing_administrator',
  'missing_documents',
];

export function ruleFormerEmployerBenefit(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (benefit.employerIsCurrent) return null;
  if (!isMeaningfulBenefit(benefit)) return null;

  const topic: EquityIntelligenceTopic = 'former_employer_benefit';

  // Detect consolidatable issues
  const expiryUnknown =
    benefit.benefitType === 'stock_options' &&
    benefit.optionExpiryStatus !== 'known' &&
    benefit.optionExpiryStatus !== 'none_reported' &&
    hasUnexercisedOptions(benefit);
  const adminMissing = !benefit.administratorName || !benefit.administratorName.trim();
  const docsMissing = !benefit.documentLocationLabel || !benefit.documentLocationLabel.trim();

  const issues: string[] = [];
  if (expiryUnknown) issues.push('option expiry date is unknown');
  if (adminMissing) issues.push('plan administrator is not identified');
  if (docsMissing) issues.push('plan document location is not recorded');

  const ev: EquityIntelligenceEvidence[] = [
    evidence('employerIsCurrent', 'Employer is current', benefit.employerIsCurrent),
    evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
    evidence('optionCount', 'Option count', benefit.optionCount),
  ];
  if (expiryUnknown) ev.push(evidence('optionExpiryStatus', 'Option expiry status', benefit.optionExpiryStatus || 'unknown'));
  if (adminMissing) ev.push(evidence('administratorName', 'Administrator name', 'not provided'));
  if (docsMissing) ev.push(evidence('documentLocationLabel', 'Document location', 'not provided'));

  const actions = [
    'Review post-departure rules in the plan document',
    'Confirm whether any deadlines began running on departure',
  ];
  if (expiryUnknown) actions.push('Obtain the option agreement to confirm the expiry date');
  if (adminMissing) actions.push('Identify the plan administrator or broker');
  if (docsMissing) actions.push('Record where the plan documents are kept');

  const issueSummary = issues.length > 0
    ? ` In addition: ${issues.join(', ')}.`
    : '';

  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'client_reported',
    title: 'Outstanding benefit from former employer',
    summary: `This ${benefit.benefitTypeLabel} from ${benefit.employerName} (a former employer) is still outstanding.${issueSummary}`,
    whyItMatters:
      'Benefits from a former employer may have different rules on vesting, exercise, or payout after departure. These are often overlooked, and missing details (expiry, administrator, documents) make it harder to act.',
    suggestedActions: actions,
    evidence: ev,
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule F: missing administrator on meaningful benefit → worth_reviewing ──

export function ruleMissingAdministrator(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (!isMeaningfulBenefit(benefit)) return null;
  if (benefit.administratorName && benefit.administratorName.trim()) return null;

  const topic: EquityIntelligenceTopic = 'missing_administrator';
  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'confirmed',
    title: 'Plan administrator not identified',
    summary: `No plan administrator has been recorded for this ${benefit.benefitTypeLabel} from ${benefit.employerName}.`,
    whyItMatters:
      'An executor or attorney may not know who to contact. Without an administrator, accessing or managing this benefit in an emergency is harder.',
    suggestedActions: [
      'Identify the plan administrator or broker',
      'Record contact details for estate readiness',
    ],
    evidence: [
      evidence('administratorName', 'Administrator name', benefit.administratorName || 'not provided'),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule G: missing document location on meaningful benefit → worth_reviewing ──

export function ruleMissingDocuments(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (!isMeaningfulBenefit(benefit)) return null;
  if (benefit.documentLocationLabel && benefit.documentLocationLabel.trim()) return null;

  const topic: EquityIntelligenceTopic = 'missing_documents';
  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'confirmed',
    title: 'Plan documents location not recorded',
    summary: `No document location has been recorded for this ${benefit.benefitTypeLabel} from ${benefit.employerName}.`,
    whyItMatters:
      'In an emergency, family or an executor needs to find plan documents quickly. Without a recorded location, critical information may be lost.',
    suggestedActions: [
      'Record where the plan documents are kept',
      'Consider storing a copy in a known location',
    ],
    evidence: [
      evidence('documentLocationLabel', 'Document location', benefit.documentLocationLabel || 'not provided'),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule H: incapacity treatment unknown → worth_reviewing ──

export function ruleIncapacityTreatmentUnknown(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  const known = benefit.deathIncapacityKnown;
  if (known === 'yes') return null;
  if (known === undefined && !isMeaningfulBenefit(benefit)) return null;
  if (known !== 'no' && known !== 'not_sure' && known !== undefined) return null;

  const topic: EquityIntelligenceTopic = 'incapacity_treatment_unknown';
  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'requires_confirmation',
    title: 'Incapacity treatment unknown',
    summary: `It is not known what happens to this ${benefit.benefitTypeLabel} if the holder becomes incapacitated.`,
    whyItMatters:
      'A power of attorney may need to exercise options or manage awards. Without knowing the plan rules, the attorney may be unable to act in time.',
    suggestedActions: [
      'Confirm incapacity treatment rules with the plan administrator',
      'Ensure power of attorney documents cover equity benefits',
      'Confirm what authority is available under the plan and the Power of Attorney',
    ],
    evidence: [
      evidence('deathIncapacityKnown', 'Death/incapacity rules known', known || 'not provided'),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule I: beneficiary designation unknown or no recipient identified → worth_reviewing ──

export function ruleBeneficiaryUnknown(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (!isMeaningfulBenefit(benefit)) return null;
  const allowed = benefit.beneficiaryAllowed;
  // If beneficiary designation status is unknown or not_sure → worth_reviewing
  if (allowed === 'yes') {
    // Designation allowed but no recipient identified (beneficiaryType not set or 'not_sure')
    const hasRecipient = benefit.beneficiaryType && benefit.beneficiaryType !== 'not_sure';
    if (hasRecipient) return null;
  } else if (allowed !== 'not_sure' && allowed !== undefined) {
    // 'no' is a definitive answer — don't fire
    return null;
  }

  const topic: EquityIntelligenceTopic = 'beneficiary_unknown';
  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'requires_confirmation',
    title: allowed === 'yes'
      ? 'Beneficiary allowed but no recipient identified'
      : 'Beneficiary designation status unknown',
    summary: allowed === 'yes'
      ? `This ${benefit.benefitTypeLabel} allows a beneficiary designation, but no recipient has been identified.`
      : `It is not known whether a beneficiary designation is permitted for this ${benefit.benefitTypeLabel}.`,
    whyItMatters:
      'A beneficiary designation can direct the benefit outside the estate. Without confirming whether one exists or is permitted, the benefit may not pass as intended.',
    suggestedActions: [
      'Confirm whether a beneficiary designation is permitted with the plan administrator',
      'If permitted, confirm whether a designation is on file and who the recipient is',
      'Do not assume a beneficiary designation exists unless the client has confirmed it',
    ],
    evidence: [
      evidence('beneficiaryAllowed', 'Beneficiary designation allowed', allowed || 'not provided'),
      evidence('beneficiaryType', 'Beneficiary type', benefit.beneficiaryType || 'not provided'),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule J: termination treatment unknown (current employee) → worth_reviewing ──

export function ruleTerminationTreatmentUnknown(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (!benefit.employerIsCurrent) return null;
  if (!isMeaningfulBenefit(benefit)) return null;
  const known = benefit.terminationKnown;
  if (known === 'yes') return null;
  // Fires when unknown or not_sure or not provided
  if (known !== 'no' && known !== 'not_sure' && known !== undefined) return null;

  const topic: EquityIntelligenceTopic = 'termination_treatment_unknown';
  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'requires_confirmation',
    title: 'Termination treatment unknown',
    summary: `It is not known what happens to this ${benefit.benefitTypeLabel} if employment with ${benefit.employerName} ends.`,
    whyItMatters:
      'Something worth understanding — what happens if you leave your employer. Termination may trigger vesting changes, exercise windows, or forfeiture deadlines that differ from the normal plan rules.',
    suggestedActions: [
      'Review the plan document for post-termination provisions',
      'Confirm with the plan administrator what happens to vesting, exercise, and payout on departure',
    ],
    evidence: [
      evidence('terminationKnown', 'Termination rules known', known || 'not provided'),
      evidence('employerIsCurrent', 'Employer is current', benefit.employerIsCurrent),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule K: known termination deadline → classification via deadline engine ──

export function ruleTerminationDeadline(
  benefit: EmployerEquityBenefitInput,
  evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (!benefit.employerIsCurrent && benefit.terminationKnown !== 'yes') return null;
  // Fires when there's a known deadline or rule on termination
  const hasDeadline = benefit.terminationDeadlineKnown === 'yes' || benefit.terminationDeadlineKnown === 'not_sure';
  if (!hasDeadline && benefit.terminationKnown !== 'yes') return null;
  const deadlineStr = benefit.terminationDeadline;
  if (!deadlineStr || !deadlineStr.trim()) {
    // If termination is known to change the benefit but no specific deadline date,
    // still produce an operational instruction for current employees
    if (benefit.terminationKnown === 'yes' && benefit.employerIsCurrent) {
      const topic: EquityIntelligenceTopic = 'termination_deadline';
      return {
        id: itemId(benefit.benefitId, topic),
        benefitId: benefit.benefitId,
        topic,
        classification: 'worth_reviewing',
        confidence: 'client_reported',
        title: 'Termination may trigger a deadline',
        summary: `Leaving ${benefit.employerName} may trigger a deadline or rule for this ${benefit.benefitTypeLabel}, but no specific date has been recorded.`,
        whyItMatters:
          'A distant hypothetical event now — but worth understanding. If departure becomes expected or imminent, this may escalate to a time-sensitive instruction.',
        suggestedActions: [
          'Confirm the specific post-termination deadline with the plan administrator',
          'Record the deadline period (e.g. "90 days from departure")',
        ],
        evidence: [
          evidence('terminationKnown', 'Termination changes benefit', benefit.terminationKnown),
          evidence('terminationDeadlineKnown', 'Has deadline or rule', benefit.terminationDeadlineKnown || 'not provided'),
          evidence('terminationDeadline', 'Termination deadline', 'not provided'),
        ],
        audienceWording: buildAudienceWording(topic, benefit),
      };
    }
    return null;
  }

  const deadlineInput: EquityDeadlineInput = {
    deadlineDate: deadlineStr,
    deadlineType: 'termination_deadline',
    evaluationDate,
  };
  const deadlineResult = evaluateEmployerEquityDeadline(deadlineInput);
  const topic: EquityIntelligenceTopic = 'termination_deadline';

  // For distant hypothetical events, use worth_reviewing or operational
  // For approaching/expected departure, use planning_opportunity
  // For near/passed, use needs_attention
  const finalClassification: EquityIntelligenceClassification =
    deadlineResult.status === 'passed' || deadlineResult.status === 'urgent' ? 'needs_attention'
    : deadlineResult.status === 'approaching' ? 'planning_opportunity'
    : deadlineResult.status === 'planning_horizon' ? 'planning_opportunity'
    : 'worth_reviewing';

  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: finalClassification,
    confidence: 'client_reported',
    title: `Termination deadline ${deadlineResult.status.replace(/_/g, ' ')}`,
    summary: `Leaving ${benefit.employerName} triggers a deadline for this ${benefit.benefitTypeLabel}: ${deadlineStr} (${deadlineResult.monthsRemaining !== undefined ? `${deadlineResult.monthsRemaining} months remaining` : 'date unparseable'}).`,
    whyItMatters:
      deadlineResult.status === 'passed' || deadlineResult.status === 'urgent'
        ? 'The termination deadline is near or has passed. Action may be needed immediately to avoid forfeiture.'
        : deadlineResult.status === 'approaching' || deadlineResult.status === 'planning_horizon'
          ? 'If departure is expected, this deadline should be part of the planning conversation.'
          : 'A distant hypothetical event for now — but worth understanding in case plans change.',
    suggestedActions: [
      'Confirm the exact termination deadline with the plan administrator',
      'Plan exercise, settlement, or documentation before the deadline',
    ],
    evidence: [
      evidence('terminationDeadlineKnown', 'Has deadline or rule', benefit.terminationDeadlineKnown),
      evidence('terminationDeadline', 'Termination deadline', deadlineStr),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
    ],
    deadlineResult,
    audienceWording: buildAudienceWording(topic, benefit, { monthsRemaining: deadlineResult.monthsRemaining, deadlineDate: deadlineStr }),
  };
}

// ── Rule L: vesting event approaching → planning_opportunity (grouped per benefit) ──

export function ruleVestingEvent(
  benefit: EmployerEquityBenefitInput,
  evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (!isMeaningfulBenefit(benefit)) return null;
  if (benefit.vestingStatus === 'fully_vested') return null;
  const dates = (benefit.vestingDates || []).filter((d) => d && d.trim()).sort();
  if (dates.length === 0) return null;

  // Find the next upcoming vesting date
  const upcoming = dates
    .map((d) => ({ date: d, result: evaluateEmployerEquityDeadline({ deadlineDate: d, deadlineType: 'vesting', evaluationDate }) }))
    .filter((v) => v.result.status !== 'passed');

  if (upcoming.length === 0) return null;

  // Group: produce ONE item per benefit, not one per tranche
  const next = upcoming[0];
  const topic: EquityIntelligenceTopic = 'vesting_event';

  // Planning opportunity where useful — do not warn for every tranche
  const classification: EquityIntelligenceClassification =
    next.result.status === 'urgent' || next.result.status === 'approaching' ? 'planning_opportunity'
    : 'planning_opportunity';

  const allDatesLabel = dates.join(', ');

  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification,
    confidence: 'client_reported',
    title: `Vesting event approaching`,
    summary: `Next vesting date for this ${benefit.benefitTypeLabel} from ${benefit.employerName}: ${next.date} (${next.result.monthsRemaining !== undefined ? `${next.result.monthsRemaining} months` : 'date unparseable'}). All vesting dates: ${allDatesLabel}.`,
    whyItMatters:
      'Vesting events convert contingent awards into owned assets. Tracking these helps with diversification and planning decisions.',
    suggestedActions: [
      'Monitor vesting dates and plan for diversification after vesting',
      'Consider professional review of post-vesting strategy',
    ],
    evidence: [
      evidence('vestingStatus', 'Vesting status', benefit.vestingStatus || 'not provided'),
      evidence('vestingDates', 'All vesting dates', allDatesLabel),
      evidence('nextVestingDate', 'Next vesting date', next.date),
    ],
    deadlineResult: next.result,
    audienceWording: buildAudienceWording(topic, benefit, { monthsRemaining: next.result.monthsRemaining, deadlineDate: next.date }),
  };
}

// ── Rule M: retirement approaching (within 10 years) + meaningful equity → planning_opportunity ──

export function ruleRetirementApproaching(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (!isMeaningfulBenefit(benefit)) return null;
  const years = benefit.yearsToRetirement;
  if (years === undefined || years < 0 || years > 10) return null;

  const topic: EquityIntelligenceTopic = 'retirement_approaching';
  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'planning_opportunity',
    confidence: 'client_reported',
    title: `Retirement approaching (${years} year${years === 1 ? '' : 's'})`,
    summary: `Retirement is within ${years} year${years === 1 ? '' : 's'} and this ${benefit.benefitTypeLabel} from ${benefit.employerName} is meaningful. Worth reviewing vesting, expiry, settlement, and diversification.`,
    whyItMatters:
      'Retirement may trigger vesting, expiry, settlement, or payout changes. Planning ahead allows time for diversification and professional review. No tax recommendations are made.',
    suggestedActions: [
      'Review how retirement affects vesting and expiry for this benefit',
      'Consider settlement and diversification options',
      'Arrange professional review of retirement transition planning',
    ],
    evidence: [
      evidence('yearsToRetirement', 'Years to retirement', years),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
      evidence('employerIsCurrent', 'Employer is current', benefit.employerIsCurrent),
      evidence('reportedValueAmount', 'Reported value', benefit.reportedValueAmount || 'not provided'),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule N: SERP (Supplemental Executive Retirement Plan) → worth_reviewing ──

export function ruleSerpReview(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (benefit.executiveType !== 'serp' && benefit.benefitType !== 'serp') return null;
  if (!isMeaningfulBenefit(benefit)) return null;

  const topic: EquityIntelligenceTopic = 'serp_review';
  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'client_reported',
    title: 'Supplemental Executive Retirement Plan (SERP) worth reviewing',
    summary: `This SERP from ${benefit.employerName} is a supplemental executive retirement arrangement worth reviewing to understand payout, death, and incapacity provisions.`,
    whyItMatters:
      'A SERP may have specific payout schedules, death benefits, and incapacity provisions that differ from standard pension plans. These are often governed by individual agreements rather than standard plan documents.',
    suggestedActions: [
      'Review the SERP agreement for payout, death, and incapacity provisions',
      'Confirm whether benefits vest on death or termination',
      'Identify the plan administrator and document location',
    ],
    evidence: [
      evidence('executiveType', 'Executive type', benefit.executiveType || 'serp'),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
      evidence('reportedValueAmount', 'Reported value', benefit.reportedValueAmount || 'not provided'),
      evidence('employerIsCurrent', 'Employer is current', benefit.employerIsCurrent),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule O: RCA (Retirement Compensation Arrangement) → worth_reviewing ──

export function ruleRcaReview(
  benefit: EmployerEquityBenefitInput,
  _evaluationDate: Date,
): EquityIntelligenceItem | null {
  if (benefit.executiveType !== 'rca' && benefit.benefitType !== 'rca') return null;
  if (!isMeaningfulBenefit(benefit)) return null;

  const topic: EquityIntelligenceTopic = 'rca_review';
  return {
    id: itemId(benefit.benefitId, topic),
    benefitId: benefit.benefitId,
    topic,
    classification: 'worth_reviewing',
    confidence: 'client_reported',
    title: 'Retirement Compensation Arrangement (RCA) worth reviewing',
    summary: `This RCA from ${benefit.employerName} is a Retirement Compensation Arrangement worth reviewing to understand payout, death, and incapacity provisions.`,
    whyItMatters:
      'An RCA may have specific payout schedules, death benefits, and incapacity provisions that differ from standard pension plans. These are often governed by individual agreements and may have unique tax and estate implications.',
    suggestedActions: [
      'Review the RCA agreement for payout, death, and incapacity provisions',
      'Confirm whether benefits vest on death or termination',
      'Identify the plan administrator and document location',
    ],
    evidence: [
      evidence('executiveType', 'Executive type', benefit.executiveType || 'rca'),
      evidence('benefitType', 'Benefit type', benefit.benefitTypeLabel),
      evidence('reportedValueAmount', 'Reported value', benefit.reportedValueAmount || 'not provided'),
      evidence('employerIsCurrent', 'Employer is current', benefit.employerIsCurrent),
    ],
    audienceWording: buildAudienceWording(topic, benefit),
  };
}

// ── Rule Registry ──

export interface EquityIntelligenceRule {
  id: string;
  topic: EquityIntelligenceTopic;
  evaluate: (
    benefit: EmployerEquityBenefitInput,
    evaluationDate: Date,
  ) => EquityIntelligenceItem | null;
}

export const ALL_EQUITY_INTELLIGENCE_RULES: EquityIntelligenceRule[] = [
  { id: 'death_treatment_unknown', topic: 'death_treatment_unknown', evaluate: ruleDeathTreatmentUnknown },
  { id: 'death_deadline', topic: 'death_deadline', evaluate: ruleDeathDeadline },
  { id: 'option_expiry_known', topic: 'option_expiry', evaluate: ruleOptionExpiryKnown },
  { id: 'option_expiry_unknown', topic: 'option_expiry_unknown', evaluate: ruleOptionExpiryUnknown },
  { id: 'former_employer_benefit', topic: 'former_employer_benefit', evaluate: ruleFormerEmployerBenefit },
  { id: 'missing_administrator', topic: 'missing_administrator', evaluate: ruleMissingAdministrator },
  { id: 'missing_documents', topic: 'missing_documents', evaluate: ruleMissingDocuments },
  { id: 'incapacity_treatment_unknown', topic: 'incapacity_treatment_unknown', evaluate: ruleIncapacityTreatmentUnknown },
  { id: 'beneficiary_unknown', topic: 'beneficiary_unknown', evaluate: ruleBeneficiaryUnknown },
  { id: 'termination_treatment_unknown', topic: 'termination_treatment_unknown', evaluate: ruleTerminationTreatmentUnknown },
  { id: 'termination_deadline', topic: 'termination_deadline', evaluate: ruleTerminationDeadline },
  { id: 'vesting_event', topic: 'vesting_event', evaluate: ruleVestingEvent },
  { id: 'retirement_approaching', topic: 'retirement_approaching', evaluate: ruleRetirementApproaching },
  { id: 'serp_review', topic: 'serp_review', evaluate: ruleSerpReview },
  { id: 'rca_review', topic: 'rca_review', evaluate: ruleRcaReview },
];

// ── Re-exports for convenience ──

export type { EquityDeadlineResult };
export type { EquityIntelligenceClassification, EquityIntelligenceConfidence };
