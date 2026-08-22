/**
 * Employer Equity Intelligence — Pure Deadline Engine
 *
 * Accepts plain data, returns plain data. No side effects.
 * Does not calculate tax.
 */

import type {
  EquityDeadlineInput,
  EquityDeadlineResult,
  EquityDeadlineStatus,
  EquityDeadlineType,
} from './employerEquityIntelligenceTypes';
import { DEADLINE_THRESHOLDS } from './employerEquityIntelligenceTypes';

/**
 * Parse a date string into a Date. Returns undefined if unparseable.
 * Accepts ISO, "Month Year", "Month DD, YYYY", and similar formats.
 */
export function parseDeadlineDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  // Try "Month YYYY" (e.g., "December 2030") — new Date handles this
  const retry = new Date(dateStr.replace(/,/g, ''));
  if (!isNaN(retry.getTime())) return retry;
  return undefined;
}

/**
 * Calculate months between two dates (positive if target is in the future).
 */
export function monthsBetween(from: Date, to: Date): number {
  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;
  return (to.getTime() - from.getTime()) / msPerMonth;
}

/**
 * Classify a deadline based on months remaining.
 * Uses centralized thresholds from DEADLINE_THRESHOLDS.
 */
export function classifyDeadline(months: number | undefined): EquityDeadlineStatus {
  if (months === undefined || isNaN(months)) return 'unknown';
  if (months < DEADLINE_THRESHOLDS.urgent) return 'passed';
  if (months < DEADLINE_THRESHOLDS.approaching) return 'urgent';
  if (months < DEADLINE_THRESHOLDS.planningHorizon) return 'approaching';
  if (months < DEADLINE_THRESHOLDS.informational) return 'planning_horizon';
  return 'informational';
}

/**
 * Map a deadline status to an intelligence classification.
 */
export function deadlineStatusToClassification(
  status: EquityDeadlineStatus,
): 'operational_instruction' | 'worth_reviewing' | 'planning_opportunity' | 'needs_attention' {
  switch (status) {
    case 'urgent':
    case 'passed':
      return 'needs_attention';
    case 'approaching':
      return 'operational_instruction';
    case 'planning_horizon':
      return 'planning_opportunity';
    case 'informational':
      return 'planning_opportunity';
    default:
      return 'worth_reviewing';
  }
}

/**
 * Pure deadline evaluator.
 *
 * Input: deadline date string, deadline type, evaluation date, optional trigger/status.
 * Output: status, months remaining, raw date, deadline type.
 */
export function evaluateEmployerEquityDeadline(input: EquityDeadlineInput): EquityDeadlineResult {
  const { deadlineDate, deadlineType, evaluationDate, triggerStatus } = input;

  // If the trigger status indicates the benefit is already forfeited/exercised,
  // we could return passed — but Stage 1 keeps it simple.
  void triggerStatus;

  const parsed = parseDeadlineDate(deadlineDate);
  if (!parsed) {
    return {
      status: 'unknown',
      monthsRemaining: undefined,
      deadlineDate,
      deadlineType,
    };
  }

  const months = monthsBetween(evaluationDate, parsed);
  const status = classifyDeadline(months);

  return {
    status,
    monthsRemaining: Math.round(months * 10) / 10,
    deadlineDate,
    deadlineType,
  };
}

/**
 * Convenience: evaluate an option expiry deadline.
 */
export function evaluateOptionExpiry(
  expiryDate: string | undefined,
  evaluationDate: Date,
): EquityDeadlineResult {
  return evaluateEmployerEquityDeadline({
    deadlineDate: expiryDate,
    deadlineType: 'option_expiry',
    evaluationDate,
  });
}

/**
 * Convenience: evaluate a vesting date deadline.
 */
export function evaluateVestingDeadline(
  vestingDate: string | undefined,
  evaluationDate: Date,
): EquityDeadlineResult {
  return evaluateEmployerEquityDeadline({
    deadlineDate: vestingDate,
    deadlineType: 'vesting',
    evaluationDate,
  });
}

export type { EquityDeadlineType };
