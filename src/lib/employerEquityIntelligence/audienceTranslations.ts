/**
 * Employer Equity Intelligence — Stage 3 Audience Translations
 *
 * Pure function: generates client, executor, POA, and professional wording
 * for a given topic + benefit context.
 *
 * One fact → one item → four audience translations.
 * Does NOT create four separate items.
 */

import type {
  EquityIntelligenceTopic,
  EmployerEquityBenefitInput,
} from './employerEquityIntelligenceTypes';

export type EquityIntelligenceAudience = 'client' | 'executor' | 'poa' | 'professional';

export interface AudienceWording {
  client: string;
  executor: string;
  poa: string;
  professional: string;
}

export const AUDIENCE_LABELS: Record<EquityIntelligenceAudience, string> = {
  client: 'Client',
  executor: 'Executor',
  poa: 'Power of Attorney',
  professional: 'Professional',
};

export const AUDIENCE_ORDER: Record<EquityIntelligenceAudience, number> = {
  client: 0,
  executor: 1,
  poa: 2,
  professional: 3,
};

interface AudienceOpts {
  monthsRemaining?: number;
  deadlineDate?: string;
}

function adminOrFallback(benefit: EmployerEquityBenefitInput): string {
  return benefit.administratorName?.trim() || 'the plan administrator';
}

/**
 * Build audience-specific wording for a given intelligence topic.
 * Pure: no side effects, no state writes.
 */
export function buildAudienceWording(
  topic: EquityIntelligenceTopic,
  benefit: EmployerEquityBenefitInput,
  opts?: AudienceOpts,
): AudienceWording {
  const label = benefit.benefitTypeLabel;
  const employer = benefit.employerName;
  const admin = adminOrFallback(benefit);
  const notes = benefit.deathIncapacityNotes?.trim() || '';
  const benefitId = benefit.benefitId;
  const expiryDate = benefit.optionExpiryDate || opts?.deadlineDate || '';
  const months = opts?.monthsRemaining;

  switch (topic) {
    case 'death_treatment_unknown':
      return {
        client: `Something worth reviewing — what happens to this ${label} if you die.`,
        executor: `Contact ${admin} to confirm what happens to this ${label} on death: whether unvested awards vest, options accelerate, benefits cancel, who the recipient is, and any deadlines that apply.`,
        poa: `Confirm what happens to this ${label} if the holder becomes incapacitated or dies. Contact ${admin} for details on vesting, cancellation, exercise, settlement, and deadlines.`,
        professional: `Post-death treatment of this ${label} is unconfirmed. Recommend obtaining plan documents to clarify vesting, acceleration, cancellation, recipient provisions, and any post-death deadlines.`,
      };

    case 'death_deadline':
      return {
        client: `There's a time-sensitive rule after death for this ${label} — make sure your executor knows about it.`,
        executor: `TIME-SENSITIVE: The client reports a post-death deadline for this ${label}: "${notes}". Contact ${admin} immediately. Preserve: the period/date, administrator, plan documents, and benefit ID (${benefitId}). Do not delay — missing this deadline could forfeit the benefit.`,
        poa: `A post-death deadline has been reported for this ${label}. If acting under a Power of Attorney, confirm what authority is available under the plan and the POA before the deadline expires.`,
        professional: `Client reports a post-death deadline for this ${label}. Preserve the stated period/date, administrator, documents, and benefit ID. Do not independently verify legal enforceability — flag for confirmation with the plan administrator.`,
      };

    case 'beneficiary_unknown':
      return {
        client: `It's worth confirming who receives this ${label} if something happens to you.`,
        executor: `Confirm whether a beneficiary designation exists for this ${label}. If none is on file, the benefit may pass through the estate rather than directly to a named recipient.`,
        poa: `Confirm whether a beneficiary designation is permitted and on file for this ${label}. Do not assume a designation exists unless the client has confirmed it.`,
        professional: `Beneficiary designation status for this ${label} is unconfirmed. If designation is allowed but no recipient is identified, recommend the client confirm designation with the plan administrator.`,
      };

    case 'incapacity_treatment_unknown':
      return {
        client: `It's worth confirming what happens to this ${label} if you can't manage your own affairs.`,
        executor: `Confirm what happens to this ${label} on incapacity. Contact ${admin} for rules on exercise, settlement, and payment.`,
        poa: `Confirm what authority is available under the plan and the Power of Attorney for this ${label}. The POA may not automatically have authority to exercise options or manage equity awards.`,
        professional: `Incapacity treatment for this ${label} is unconfirmed. The Power of Attorney may not have authority under the plan. Recommend confirming plan rules and POA scope.`,
      };

    case 'option_expiry':
      return {
        client: `Your stock options from ${employer} expire on ${expiryDate}.${months !== undefined ? ` That's about ${months} months from now.` : ''} It's worth planning ahead.`,
        executor: `Stock options from ${employer} expire on ${expiryDate}. If the holder has died, confirm whether options must be exercised before expiry and whether the window has shortened.`,
        poa: `Stock options from ${employer} expire on ${expiryDate}. Confirm what authority is available under the plan and the POA to exercise options before they expire.`,
        professional: `Stock options from ${employer} expire on ${expiryDate}${months !== undefined ? ` (${months} months remaining)` : ''}. Recommend planning exercise strategy and confirming post-death or termination acceleration provisions.`,
      };

    case 'option_expiry_unknown':
      return {
        client: `You have stock options from ${employer} but the expiry date isn't known — worth confirming.`,
        executor: `Stock options from ${employer} have an unknown expiry date. Obtain the option agreement to confirm — options may expire worthless if not exercised in time.`,
        poa: `Stock options from ${employer} have an unknown expiry date. Confirm what authority is available under the plan and the POA, and obtain the expiry date to avoid forfeiture.`,
        professional: `Expiry date for stock options from ${employer} is unconfirmed. Recommend obtaining grant documentation to establish the exercise window.`,
      };

    case 'former_employer_benefit':
      return {
        client: `You still have a ${label} from ${employer}, a former employer — worth reviewing the rules that apply after leaving.`,
        executor: `This ${label} from ${employer} (former employer) is still outstanding. Post-departure rules on vesting, exercise, or payout may differ — confirm with the plan administrator.`,
        poa: `This ${label} from ${employer} (former employer) is still outstanding. Confirm what authority is available under the plan and the POA, and whether any deadlines began running on departure.`,
        professional: `Outstanding ${label} from former employer ${employer}. Post-departure rules may have different vesting, exercise, or payout provisions. Recommend reviewing the plan document.`,
      };

    case 'missing_administrator':
      return {
        client: `No plan administrator has been recorded for this ${label} — worth noting who to contact.`,
        executor: `No plan administrator is recorded for this ${label} from ${employer}. Identify the administrator or broker — without this, accessing the benefit in an emergency is harder.`,
        poa: `No plan administrator is recorded for this ${label}. Identify the administrator so the POA knows who to contact if action is needed.`,
        professional: `Plan administrator not identified for this ${label} from ${employer}. Recommend recording contact details for estate readiness.`,
      };

    case 'missing_documents':
      return {
        client: `The location of the plan documents for this ${label} hasn't been recorded — worth noting where they are.`,
        executor: `No document location is recorded for this ${label} from ${employer}. In an emergency, plan documents are needed quickly — identify where they are kept.`,
        poa: `No document location is recorded for this ${label}. The POA may need plan documents to act — identify where they are kept.`,
        professional: `Plan document location not recorded for this ${label} from ${employer}. Recommend recording the location for estate readiness.`,
      };

    case 'termination_treatment_unknown':
      return {
        client: `It's worth confirming what happens to this ${label} if you leave your employer.`,
        executor: `Confirm what happens to this ${label} on termination of employment. Contact ${admin} for rules on vesting, exercise, and payout after departure.`,
        poa: `Confirm what happens to this ${label} on termination. The POA may need to act within specific deadlines — confirm what authority is available under the plan and the POA.`,
        professional: `Termination treatment for this ${label} is unconfirmed. Recommend reviewing post-departure provisions in the plan document.`,
      };

    case 'termination_deadline':
      return {
        client: `There may be a time-sensitive rule if you leave your employer — worth noting.`,
        executor: `TIME-SENSITIVE: A post-termination deadline may apply to this ${label}. Contact ${admin} immediately to confirm the deadline and required actions. Preserve: the period/date, administrator, plan documents, and benefit ID (${benefitId}).`,
        poa: `A post-termination deadline may apply to this ${label}. If acting under a POA, confirm what authority is available under the plan and the POA before the deadline expires.`,
        professional: `Client reports or plan indicates a post-termination deadline for this ${label}. Preserve the stated period/date, administrator, documents, and benefit ID. Do not independently verify legal enforceability.`,
      };

    case 'vesting_event':
      return {
        client: `A vesting event is approaching for this ${label} — worth tracking.`,
        executor: `A vesting event is approaching for this ${label}. Confirm whether the vesting still occurs if the holder has died, and whether any action is needed.`,
        poa: `A vesting event is approaching for this ${label}. Confirm what authority is available under the plan and the POA to manage the vesting event.`,
        professional: `Vesting event approaching for this ${label}. Recommend confirming post-death vesting treatment and any actions required.`,
      };

    case 'retirement_approaching':
      return {
        client: `Retirement is approaching — worth reviewing how this ${label} fits into your plans.`,
        executor: `Retirement is approaching for the holder of this ${label}. Confirm whether retirement affects vesting, exercise, or payout.`,
        poa: `Retirement is approaching. Confirm what authority is available under the plan and the POA to manage this ${label} through the transition.`,
        professional: `Retirement approaching for holder of this ${label}. Recommend reviewing commencement, vesting, and payout implications.`,
      };

    case 'serp_review':
      return {
        client: `This supplemental retirement arrangement is worth reviewing to understand what you're entitled to.`,
        executor: `This supplemental retirement arrangement (${label}) may have specific payout and death provisions. Contact ${admin} to confirm terms.`,
        poa: `This supplemental retirement arrangement may have specific incapacity and death provisions. Confirm what authority is available under the plan and the POA.`,
        professional: `Supplemental retirement arrangement (${label}) warrants review. Recommend confirming payout, death, and incapacity provisions.`,
      };

    case 'rca_review':
      return {
        client: `This Retirement Compensation Arrangement is worth reviewing to understand what you're entitled to.`,
        executor: `This RCA (${label}) may have specific payout and death provisions. Contact ${admin} to confirm terms.`,
        poa: `This RCA may have specific incapacity and death provisions. Confirm what authority is available under the plan and the POA.`,
        professional: `Retirement Compensation Arrangement (${label}) warrants review. Recommend confirming payout, death, and incapacity provisions.`,
      };

    default:
      return {
        client: `This ${label} is worth reviewing.`,
        executor: `Review this ${label} from ${employer} and confirm details with ${admin}.`,
        poa: `Confirm what authority is available under the plan and the POA for this ${label}.`,
        professional: `This ${label} from ${employer} warrants professional review.`,
      };
  }
}
