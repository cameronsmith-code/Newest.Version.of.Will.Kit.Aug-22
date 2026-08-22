/**
 * Employer Equity Intelligence — Stage 1 Pure Test Fixtures
 *
 * Lightweight pure fixtures that exercise the rules without rendering the app.
 * No React, no DOM, no imports of app components.
 */

import type { EmployerEquityBenefitInput } from './employerEquityIntelligenceTypes';
import {
  evaluateEmployerEquityBenefit,
  buildEmployerEquityIntelligenceItems,
} from './employerEquityIntelligenceEngine';
import { buildAllBenefitStories } from './benefitStoryBuilder';
import { buildAllOutputDatasets, identifyStaleStories } from './outputDatasets';
import {
  evaluateOptionExpiry,
  classifyDeadline,
  monthsBetween,
  parseDeadlineDate,
} from './deadlineEngine';

// ── Evaluation date fixed for deterministic tests ──
const EVAL_DATE = new Date('2026-08-20');

// ── Fixtures ──

function baseBenefit(overrides: Partial<EmployerEquityBenefitInput>): EmployerEquityBenefitInput {
  return {
    benefitId: 'test_benefit',
    benefitType: 'stock_options',
    benefitTypeLabel: 'Stock Options',
    employerName: 'Test Employer Inc.',
    employerIsCurrent: true,
    clientId: 'client1',
    ...overrides,
  };
}

export const fixtureRsuDeathTreatmentUnknown: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'rsu_death_unknown',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'both',
  vestingStatus: 'partly_vested',
  optionCount: 500,
  deathIncapacityKnown: 'not_sure',
});

export const fixtureOptionExpiryFourYears: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'opt_4yr',
  benefitType: 'stock_options',
  benefitTypeLabel: 'Stock Options',
  ownershipStatus: 'currently_own',
  optionExpiryStatus: 'known',
  optionExpiryDate: '2030-08-20',
  optionCount: 1000,
  employerIsCurrent: true,
});

export const fixtureOptionExpiryEighteenMonths: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'opt_18mo',
  benefitType: 'stock_options',
  benefitTypeLabel: 'Stock Options',
  ownershipStatus: 'currently_own',
  optionExpiryStatus: 'known',
  optionExpiryDate: '2028-02-20',
  optionCount: 500,
});

export const fixtureOptionExpiryFourMonths: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'opt_4mo',
  benefitType: 'stock_options',
  benefitTypeLabel: 'Stock Options',
  ownershipStatus: 'currently_own',
  optionExpiryStatus: 'known',
  optionExpiryDate: '2026-12-20',
  optionCount: 200,
});

export const fixtureOptionExpiryUnknown: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'opt_unknown',
  benefitType: 'stock_options',
  benefitTypeLabel: 'Stock Options',
  ownershipStatus: 'currently_own',
  optionExpiryStatus: 'unknown',
  optionCount: 800,
});

export const fixtureFormerEmployerOptions: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'former_emp',
  benefitType: 'stock_options',
  benefitTypeLabel: 'Stock Options',
  employerName: 'Old Corp',
  employerIsCurrent: false,
  ownershipStatus: 'currently_own',
  optionCount: 300,
  optionExpiryStatus: 'known',
  optionExpiryDate: '2027-06-15',
});

export const fixtureMissingAdministrator: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'missing_admin',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 50000,
  administratorName: undefined,
  documentLocationLabel: 'Home office',
});

export const fixtureMissingDocuments: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'missing_docs',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 75000,
  administratorName: 'Computershare',
  documentLocationLabel: undefined,
});

export const fixtureDeathDeadlineKnown: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'death_deadline',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 100000,
  deathIncapacityKnown: 'yes',
  deathIncapacityNotes: 'Options must be exercised within 6 months of death',
});

export const fixtureBeneficiaryUnknown: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'benef_unknown',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 60000,
  beneficiaryAllowed: 'not_sure',
});

export const fixtureBeneficiaryAllowedNoRecipient: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'benef_no_recipient',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 80000,
  beneficiaryAllowed: 'yes',
  beneficiaryType: undefined,
});

export const fixtureTerminationUnknown: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'term_unknown',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 90000,
  employerIsCurrent: true,
  terminationKnown: 'not_sure',
});

export const fixtureTerminationDeadlineKnown: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'term_deadline',
  benefitType: 'stock_options',
  benefitTypeLabel: 'Stock Options',
  ownershipStatus: 'currently_own',
  optionCount: 500,
  employerIsCurrent: true,
  terminationKnown: 'yes',
  terminationDeadlineKnown: 'yes',
  terminationDeadline: '2027-03-15',
});

export const fixtureVestingEvent: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'vesting_event',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'future_contingent',
  vestingStatus: 'partly_vested',
  reportedValueAmount: 120000,
  employerIsCurrent: true,
  vestingDates: ['2027-03-01', '2028-03-01', '2029-03-01'],
});

export const fixtureRetirementApproaching: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'retire_approaching',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 200000,
  employerIsCurrent: true,
  yearsToRetirement: 5,
});

export const fixtureDeathDeadline90Days: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'death_90day',
  benefitType: 'stock_options',
  benefitTypeLabel: 'Stock Options',
  ownershipStatus: 'currently_own',
  optionCount: 1000,
  deathIncapacityKnown: 'yes',
  deathIncapacityNotes: 'Options must be exercised within 90 days of death',
});

export const fixtureOwnedAndContingent: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'owned_contingent',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'both',
  vestingStatus: 'partly_vested',
  reportedValueAmount: 150000,
  vestingDates: ['2027-06-01'],
});

export const fixtureIncapacityUnknown: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'incapacity_unknown',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 70000,
  deathIncapacityKnown: 'not_sure',
  deathIncapacityNotes: 'Death rules confirmed but incapacity treatment not discussed',
});

export const fixtureSerp: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'serp_benefit',
  benefitType: 'serp',
  benefitTypeLabel: 'SERP',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 300000,
  executiveType: 'serp',
  employerIsCurrent: true,
});

export const fixtureRca: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'rca_benefit',
  benefitType: 'rca',
  benefitTypeLabel: 'RCA',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 250000,
  executiveType: 'rca',
  employerIsCurrent: true,
});

export const fixtureRetirement7Years: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'retire_7yr',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 180000,
  employerIsCurrent: true,
  yearsToRetirement: 7,
});

export const fixtureCrossBorderRsu: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'crossborder_rsu',
  benefitType: 'rsu',
  benefitTypeLabel: 'RSUs',
  ownershipStatus: 'currently_own',
  reportedValueAmount: 100000,
  employerName: 'US Tech Corp',
  employerIsCurrent: true,
});

export const fixtureFormerEmployerConsolidated: EmployerEquityBenefitInput = baseBenefit({
  benefitId: 'former_consolidated',
  benefitType: 'stock_options',
  benefitTypeLabel: 'Stock Options',
  employerName: 'Defunct Startup',
  employerIsCurrent: false,
  ownershipStatus: 'currently_own',
  optionCount: 400,
  optionExpiryStatus: 'unknown',
  administratorName: undefined,
  documentLocationLabel: undefined,
});

// ── Test Runner (pure, no test framework required) ──

export interface FixtureTestResult {
  name: string;
  topicChecks: string;
  classificationChecks: string;
  passed: boolean;
  items: ReturnType<typeof evaluateEmployerEquityBenefit>;
}

export function runEmployerEquityIntelligenceFixtures(): FixtureTestResult[] {
  const results: FixtureTestResult[] = [];

  // 1. RSU death treatment unknown
  {
    const items = evaluateEmployerEquityBenefit(fixtureRsuDeathTreatmentUnknown, EVAL_DATE);
    const hasDeathUnknown = items.some((i) => i.topic === 'death_treatment_unknown');
    const hasIncapacity = items.some((i) => i.topic === 'incapacity_treatment_unknown');
    const allWorthReviewing = items.every((i) => i.classification === 'worth_reviewing');
    const passed = hasDeathUnknown && hasIncapacity && allWorthReviewing;
    results.push({
      name: 'RSU death treatment unknown',
      topicChecks: `death_treatment_unknown=${hasDeathUnknown}, incapacity_treatment_unknown=${hasIncapacity}`,
      classificationChecks: `all worth_reviewing=${allWorthReviewing}`,
      passed,
      items,
    });
  }

  // 2. Option expiry 4 years away → informational
  {
    const items = evaluateEmployerEquityBenefit(fixtureOptionExpiryFourYears, EVAL_DATE);
    const expiryItem = items.find((i) => i.topic === 'option_expiry');
    const isInformational = expiryItem?.deadlineResult?.status === 'informational';
    const isPlanningOpportunity = expiryItem?.classification === 'planning_opportunity';
    const passed = !!expiryItem && isInformational && isPlanningOpportunity;
    results.push({
      name: 'Option expiry 4 years away',
      topicChecks: `option_expiry present=${!!expiryItem}, status=${expiryItem?.deadlineResult?.status}`,
      classificationChecks: `informational=${isInformational}, planning_opportunity=${isPlanningOpportunity}`,
      passed,
      items,
    });
  }

  // 3. Option expiry 18 months away → planning_horizon
  {
    const items = evaluateEmployerEquityBenefit(fixtureOptionExpiryEighteenMonths, EVAL_DATE);
    const expiryItem = items.find((i) => i.topic === 'option_expiry');
    const isPlanningHorizon = expiryItem?.deadlineResult?.status === 'planning_horizon';
    const passed = !!expiryItem && isPlanningHorizon;
    results.push({
      name: 'Option expiry 18 months away',
      topicChecks: `option_expiry present=${!!expiryItem}, status=${expiryItem?.deadlineResult?.status}`,
      classificationChecks: `planning_horizon=${isPlanningHorizon}`,
      passed,
      items,
    });
  }

  // 4. Option expiry 4 months away → urgent
  {
    const items = evaluateEmployerEquityBenefit(fixtureOptionExpiryFourMonths, EVAL_DATE);
    const expiryItem = items.find((i) => i.topic === 'option_expiry');
    const isUrgent = expiryItem?.deadlineResult?.status === 'urgent';
    const isNeedsAttention = expiryItem?.classification === 'needs_attention';
    const passed = !!expiryItem && isUrgent && isNeedsAttention;
    results.push({
      name: 'Option expiry 4 months away',
      topicChecks: `option_expiry present=${!!expiryItem}, status=${expiryItem?.deadlineResult?.status}`,
      classificationChecks: `urgent=${isUrgent}, needs_attention=${isNeedsAttention}`,
      passed,
      items,
    });
  }

  // 5. Option expiry unknown + unexercised options → worth_reviewing
  {
    const items = evaluateEmployerEquityBenefit(fixtureOptionExpiryUnknown, EVAL_DATE);
    const unknownItem = items.find((i) => i.topic === 'option_expiry_unknown');
    const isWorthReviewing = unknownItem?.classification === 'worth_reviewing';
    const passed = !!unknownItem && isWorthReviewing;
    results.push({
      name: 'Option expiry unknown',
      topicChecks: `option_expiry_unknown present=${!!unknownItem}`,
      classificationChecks: `worth_reviewing=${isWorthReviewing}`,
      passed,
      items,
    });
  }

  // 6. Former employer options → worth_reviewing
  {
    const items = evaluateEmployerEquityBenefit(fixtureFormerEmployerOptions, EVAL_DATE);
    const formerItem = items.find((i) => i.topic === 'former_employer_benefit');
    const isWorthReviewing = formerItem?.classification === 'worth_reviewing';
    const passed = !!formerItem && isWorthReviewing;
    results.push({
      name: 'Former employer options',
      topicChecks: `former_employer_benefit present=${!!formerItem}`,
      classificationChecks: `worth_reviewing=${isWorthReviewing}`,
      passed,
      items,
    });
  }

  // 7. Missing administrator → worth_reviewing
  {
    const items = evaluateEmployerEquityBenefit(fixtureMissingAdministrator, EVAL_DATE);
    const adminItem = items.find((i) => i.topic === 'missing_administrator');
    const isWorthReviewing = adminItem?.classification === 'worth_reviewing';
    const passed = !!adminItem && isWorthReviewing;
    results.push({
      name: 'Missing administrator',
      topicChecks: `missing_administrator present=${!!adminItem}`,
      classificationChecks: `worth_reviewing=${isWorthReviewing}`,
      passed,
      items,
    });
  }

  // 8. Missing documents → worth_reviewing
  {
    const items = evaluateEmployerEquityBenefit(fixtureMissingDocuments, EVAL_DATE);
    const docsItem = items.find((i) => i.topic === 'missing_documents');
    const isWorthReviewing = docsItem?.classification === 'worth_reviewing';
    const passed = !!docsItem && isWorthReviewing;
    results.push({
      name: 'Missing documents',
      topicChecks: `missing_documents present=${!!docsItem}`,
      classificationChecks: `worth_reviewing=${isWorthReviewing}`,
      passed,
      items,
    });
  }

  // 9. Death deadline known → needs_attention + has audience wording
  {
    const items = evaluateEmployerEquityBenefit(fixtureDeathDeadlineKnown, EVAL_DATE);
    const deathDeadlineItem = items.find((i) => i.topic === 'death_deadline');
    const isNeedsAttention = deathDeadlineItem?.classification === 'needs_attention';
    const hasAudienceWording = !!deathDeadlineItem?.audienceWording;
    const hasExecutorWording = !!deathDeadlineItem?.audienceWording?.executor;
    const passed = !!deathDeadlineItem && isNeedsAttention && hasAudienceWording && hasExecutorWording;
    results.push({
      name: 'Death deadline known',
      topicChecks: `death_deadline present=${!!deathDeadlineItem}, audienceWording=${hasAudienceWording}`,
      classificationChecks: `needs_attention=${isNeedsAttention}, executor_has_wording=${hasExecutorWording}`,
      passed,
      items,
    });
  }

  // 10. Beneficiary unknown → worth_reviewing + has audience wording
  {
    const items = evaluateEmployerEquityBenefit(fixtureBeneficiaryUnknown, EVAL_DATE);
    const benefItem = items.find((i) => i.topic === 'beneficiary_unknown');
    const isWorthReviewing = benefItem?.classification === 'worth_reviewing';
    const hasAudienceWording = !!benefItem?.audienceWording;
    const passed = !!benefItem && isWorthReviewing && hasAudienceWording;
    results.push({
      name: 'Beneficiary unknown',
      topicChecks: `beneficiary_unknown present=${!!benefItem}, audienceWording=${hasAudienceWording}`,
      classificationChecks: `worth_reviewing=${isWorthReviewing}`,
      passed,
      items,
    });
  }

  // 11. Beneficiary allowed but no recipient → worth_reviewing
  {
    const items = evaluateEmployerEquityBenefit(fixtureBeneficiaryAllowedNoRecipient, EVAL_DATE);
    const benefItem = items.find((i) => i.topic === 'beneficiary_unknown');
    const isWorthReviewing = benefItem?.classification === 'worth_reviewing';
    const passed = !!benefItem && isWorthReviewing;
    results.push({
      name: 'Beneficiary allowed no recipient',
      topicChecks: `beneficiary_unknown present=${!!benefItem}`,
      classificationChecks: `worth_reviewing=${isWorthReviewing}`,
      passed,
      items,
    });
  }

  // 12. Termination treatment unknown (current employee) → worth_reviewing
  {
    const items = evaluateEmployerEquityBenefit(fixtureTerminationUnknown, EVAL_DATE);
    const termItem = items.find((i) => i.topic === 'termination_treatment_unknown');
    const isWorthReviewing = termItem?.classification === 'worth_reviewing';
    const hasAudience = !!termItem?.audienceWording;
    const passed = !!termItem && isWorthReviewing && hasAudience;
    results.push({
      name: 'Termination treatment unknown',
      topicChecks: `termination_treatment_unknown present=${!!termItem}, audienceWording=${hasAudience}`,
      classificationChecks: `worth_reviewing=${isWorthReviewing}`,
      passed,
      items,
    });
  }

  // 13. Termination deadline known → planning_opportunity (distant)
  {
    const items = evaluateEmployerEquityBenefit(fixtureTerminationDeadlineKnown, EVAL_DATE);
    const termItem = items.find((i) => i.topic === 'termination_deadline');
    const hasDeadlineResult = !!termItem?.deadlineResult;
    const hasAudience = !!termItem?.audienceWording;
    const passed = !!termItem && hasDeadlineResult && hasAudience;
    results.push({
      name: 'Termination deadline known',
      topicChecks: `termination_deadline present=${!!termItem}, deadlineResult=${hasDeadlineResult}, status=${termItem?.deadlineResult?.status}`,
      classificationChecks: `classification=${termItem?.classification}, audienceWording=${hasAudience}`,
      passed,
      items,
    });
  }

  // 14. Vesting event approaching → planning_opportunity (grouped per benefit)
  {
    const items = evaluateEmployerEquityBenefit(fixtureVestingEvent, EVAL_DATE);
    const vestingItem = items.find((i) => i.topic === 'vesting_event');
    const isPlanningOpportunity = vestingItem?.classification === 'planning_opportunity';
    const hasAudience = !!vestingItem?.audienceWording;
    // Should produce ONE item, not one per tranche
    const vestingItemCount = items.filter((i) => i.topic === 'vesting_event').length;
    const isGrouped = vestingItemCount === 1;
    const passed = !!vestingItem && isPlanningOpportunity && hasAudience && isGrouped;
    results.push({
      name: 'Vesting event grouped',
      topicChecks: `vesting_event present=${!!vestingItem}, count=${vestingItemCount} (expected 1), audienceWording=${hasAudience}`,
      classificationChecks: `planning_opportunity=${isPlanningOpportunity}`,
      passed,
      items,
    });
  }

  // 15. Retirement approaching (within 10 years) → planning_opportunity
  {
    const items = evaluateEmployerEquityBenefit(fixtureRetirementApproaching, EVAL_DATE);
    const retireItem = items.find((i) => i.topic === 'retirement_approaching');
    const isPlanningOpportunity = retireItem?.classification === 'planning_opportunity';
    const hasAudience = !!retireItem?.audienceWording;
    const passed = !!retireItem && isPlanningOpportunity && hasAudience;
    results.push({
      name: 'Retirement approaching',
      topicChecks: `retirement_approaching present=${!!retireItem}, audienceWording=${hasAudience}`,
      classificationChecks: `planning_opportunity=${isPlanningOpportunity}`,
      passed,
      items,
    });
  }

  // 16. Former employer consolidation — missing admin + missing docs + unknown expiry folded into ONE item
  {
    const items = evaluateEmployerEquityBenefit(fixtureFormerEmployerConsolidated, EVAL_DATE);
    const formerItem = items.find((i) => i.topic === 'former_employer_benefit');
    const hasNoSeparateAdmin = !items.some((i) => i.topic === 'missing_administrator');
    const hasNoSeparateDocs = !items.some((i) => i.topic === 'missing_documents');
    const hasNoSeparateExpiry = !items.some((i) => i.topic === 'option_expiry_unknown');
    const isWorthReviewing = formerItem?.classification === 'worth_reviewing';
    const passed = !!formerItem && isWorthReviewing && hasNoSeparateAdmin && hasNoSeparateDocs && hasNoSeparateExpiry;
    results.push({
      name: 'Former employer consolidation',
      topicChecks: `former_employer_benefit present=${!!formerItem}, no_separate_admin=${hasNoSeparateAdmin}, no_separate_docs=${hasNoSeparateDocs}, no_separate_expiry=${hasNoSeparateExpiry}`,
      classificationChecks: `worth_reviewing=${isWorthReviewing}`,
      passed,
      items,
    });
  }

  // 17. 90-day death deadline → needs_attention
  {
    const items = evaluateEmployerEquityBenefit(fixtureDeathDeadline90Days, EVAL_DATE);
    const deathItem = items.find((i) => i.topic === 'death_deadline');
    const isNeedsAttention = deathItem?.classification === 'needs_attention';
    const passed = !!deathItem && isNeedsAttention;
    results.push({
      name: '90-day death deadline',
      topicChecks: `death_deadline present=${!!deathItem}`,
      classificationChecks: `needs_attention=${isNeedsAttention}`,
      passed,
      items,
    });
  }

  // 18. Owned + contingent shares → multiple items produced
  {
    const items = evaluateEmployerEquityBenefit(fixtureOwnedAndContingent, EVAL_DATE);
    const hasVesting = items.some((i) => i.topic === 'vesting_event');
    const hasMultiple = items.length >= 2;
    const passed = hasVesting && hasMultiple;
    results.push({
      name: 'Owned and contingent shares',
      topicChecks: `vesting_event=${hasVesting}, item_count=${items.length}`,
      classificationChecks: `multiple_items=${hasMultiple}`,
      passed,
      items,
    });
  }

  // 19. Incapacity unknown → worth_reviewing
  {
    const items = evaluateEmployerEquityBenefit(fixtureIncapacityUnknown, EVAL_DATE);
    const incapItem = items.find((i) => i.topic === 'incapacity_treatment_unknown');
    const passed = !!incapItem;
    results.push({
      name: 'Incapacity unknown',
      topicChecks: `incapacity_treatment_unknown present=${!!incapItem}`,
      classificationChecks: `present=${!!incapItem}`,
      passed,
      items,
    });
  }

  // 20. SERP → review item
  {
    const items = evaluateEmployerEquityBenefit(fixtureSerp, EVAL_DATE);
    const serpItem = items.find((i) => i.topic === 'serp_review');
    const passed = !!serpItem;
    results.push({
      name: 'SERP',
      topicChecks: `serp_review present=${!!serpItem}`,
      classificationChecks: `present=${!!serpItem}`,
      passed,
      items,
    });
  }

  // 21. RCA → review item
  {
    const items = evaluateEmployerEquityBenefit(fixtureRca, EVAL_DATE);
    const rcaItem = items.find((i) => i.topic === 'rca_review');
    const passed = !!rcaItem;
    results.push({
      name: 'RCA',
      topicChecks: `rca_review present=${!!rcaItem}`,
      classificationChecks: `present=${!!rcaItem}`,
      passed,
      items,
    });
  }

  // 22. Retirement within 7 years → planning_opportunity
  {
    const items = evaluateEmployerEquityBenefit(fixtureRetirement7Years, EVAL_DATE);
    const retireItem = items.find((i) => i.topic === 'retirement_approaching');
    const isPlanningOpportunity = retireItem?.classification === 'planning_opportunity';
    const passed = !!retireItem && isPlanningOpportunity;
    results.push({
      name: 'Retirement within 7 years',
      topicChecks: `retirement_approaching present=${!!retireItem}`,
      classificationChecks: `planning_opportunity=${isPlanningOpportunity}`,
      passed,
      items,
    });
  }

  // 23. Cross-border RSUs → produces items, crossBorderStoryId linkable
  {
    const items = evaluateEmployerEquityBenefit(fixtureCrossBorderRsu, EVAL_DATE);
    const hasItems = items.length > 0;
    const passed = hasItems;
    results.push({
      name: 'Cross-border RSUs',
      topicChecks: `items present=${hasItems}, count=${items.length}`,
      classificationChecks: `produces_items=${hasItems}`,
      passed,
      items,
    });
  }

  return results;
}

// ── Deadline Engine Unit Tests ──

export interface DeadlineUnitTestResult {
  name: string;
  passed: boolean;
  detail: string;
}

export function runDeadlineEngineUnitTests(): DeadlineUnitTestResult[] {
  const results: DeadlineUnitTestResult[] = [];

  // parseDeadlineDate
  {
    const d = parseDeadlineDate('2030-08-20');
    const passed = !!d && !isNaN(d.getTime());
    results.push({ name: 'parseDeadlineDate ISO', passed, detail: `parsed=${d?.toISOString()}` });
  }
  {
    const d = parseDeadlineDate(undefined);
    const passed = d === undefined;
    results.push({ name: 'parseDeadlineDate undefined', passed, detail: `parsed=${d}` });
  }
  {
    const d = parseDeadlineDate('December 2030');
    const passed = !!d && !isNaN(d.getTime());
    results.push({ name: 'parseDeadlineDate Month Year', passed, detail: `parsed=${d?.toISOString()}` });
  }

  // monthsBetween
  {
    const from = new Date('2026-08-20');
    const to = new Date('2030-08-20');
    const m = monthsBetween(from, to);
    const passed = Math.abs(m - 48) < 1;
    results.push({ name: 'monthsBetween 4 years', passed, detail: `months=${m?.toFixed(1)}` });
  }

  // classifyDeadline thresholds
  {
    const passed = classifyDeadline(48) === 'informational';
    results.push({ name: 'classifyDeadline >24mo informational', passed, detail: `48mo=${classifyDeadline(48)}` });
  }
  {
    const passed = classifyDeadline(18) === 'planning_horizon';
    results.push({ name: 'classifyDeadline 12-24mo planning_horizon', passed, detail: `18mo=${classifyDeadline(18)}` });
  }
  {
    const passed = classifyDeadline(9) === 'approaching';
    results.push({ name: 'classifyDeadline 6-12mo approaching', passed, detail: `9mo=${classifyDeadline(9)}` });
  }
  {
    const passed = classifyDeadline(4) === 'urgent';
    results.push({ name: 'classifyDeadline 0-6mo urgent', passed, detail: `4mo=${classifyDeadline(4)}` });
  }
  {
    const passed = classifyDeadline(-3) === 'passed';
    results.push({ name: 'classifyDeadline <0 passed', passed, detail: `-3mo=${classifyDeadline(-3)}` });
  }
  {
    const passed = classifyDeadline(undefined) === 'unknown';
    results.push({ name: 'classifyDeadline undefined unknown', passed, detail: `undefined=${classifyDeadline(undefined)}` });
  }

  // evaluateOptionExpiry
  {
    const r = evaluateOptionExpiry('2030-08-20', EVAL_DATE);
    const passed = r.status === 'informational' && r.deadlineType === 'option_expiry';
    results.push({ name: 'evaluateOptionExpiry 4yr', passed, detail: `status=${r.status}, type=${r.deadlineType}` });
  }
  {
    const r = evaluateOptionExpiry(undefined, EVAL_DATE);
    const passed = r.status === 'unknown';
    results.push({ name: 'evaluateOptionExpiry undefined', passed, detail: `status=${r.status}` });
  }

  return results;
}

// ── Full Engine Test (all fixtures together) ──

export interface FullEngineTestResult {
  passed: boolean;
  totalEvaluated: number;
  totalFindings: number;
  byClassification: Record<string, number>;
  detail: string;
}

export function runFullEngineTest(): FullEngineTestResult {
  const allFixtures = [
    fixtureRsuDeathTreatmentUnknown,
    fixtureOptionExpiryFourYears,
    fixtureOptionExpiryEighteenMonths,
    fixtureOptionExpiryFourMonths,
    fixtureOptionExpiryUnknown,
    fixtureFormerEmployerOptions,
    fixtureMissingAdministrator,
    fixtureMissingDocuments,
    fixtureDeathDeadlineKnown,
    fixtureBeneficiaryUnknown,
    fixtureBeneficiaryAllowedNoRecipient,
    fixtureTerminationUnknown,
    fixtureTerminationDeadlineKnown,
    fixtureVestingEvent,
    fixtureRetirementApproaching,
    fixtureFormerEmployerConsolidated,
    fixtureDeathDeadline90Days,
    fixtureOwnedAndContingent,
    fixtureIncapacityUnknown,
    fixtureSerp,
    fixtureRca,
    fixtureRetirement7Years,
    fixtureCrossBorderRsu,
  ];

  const result = buildEmployerEquityIntelligenceItems(allFixtures, EVAL_DATE);

  const byClassification = {
    needs_attention: result.byClassification.needsAttention.length,
    operational_instruction: result.byClassification.operationalInstruction.length,
    worth_reviewing: result.byClassification.worthReviewing.length,
    planning_opportunity: result.byClassification.planningOpportunity.length,
  };

  const allHaveAudience = result.items.every((i) => !!i.audienceWording);
  const passed = result.totalFindings > 0 && result.totalEvaluated === 23 && allHaveAudience;

  return {
    passed,
    totalEvaluated: result.totalEvaluated,
    totalFindings: result.totalFindings,
    byClassification,
    detail: `Evaluated ${result.totalEvaluated} benefits, produced ${result.totalFindings} findings`,
  };
}

// ── Stage 5: Story Consolidation + Output Dataset Tests ──

export interface StoryTestResult {
  name: string;
  passed: boolean;
  detail: string;
}

export function runStoryConsolidationTests(): StoryTestResult[] {
  const results: StoryTestResult[] = [];
  const evalDate = EVAL_DATE;

  // S5-1: Former employer consolidation produces ONE story with supporting evidence
  {
    const benefit = fixtureFormerEmployerConsolidated;
    const items = evaluateEmployerEquityBenefit(benefit, evalDate);
    const stories = buildAllBenefitStories({
      benefits: [benefit],
      itemsByBenefit: new Map([[benefit.benefitId, items]]),
    });
    const storyCount = stories.length;
    const story = stories[0];
    const hasOneStory = storyCount === 1;
    const hasMultipleTopics = story ? story.topics.length >= 2 : false;
    const hasConsolidatedEvidence = story ? story.evidence.length >= 3 : false;
    const passed = hasOneStory && hasMultipleTopics && hasConsolidatedEvidence;
    results.push({
      name: 'Former employer consolidation → one story',
      passed,
      detail: `stories=${storyCount}, topics=${story?.topics.length}, evidence=${story?.evidence.length}`,
    });
  }

  // S5-2: Priority ordering — needs_attention story sorts before worth_reviewing
  {
    const benefits = [fixtureFormerEmployerConsolidated, fixtureOptionExpiryFourMonths];
    const itemsByBenefit = new Map<string, ReturnType<typeof evaluateEmployerEquityBenefit>>();
    for (const b of benefits) {
      itemsByBenefit.set(b.benefitId, evaluateEmployerEquityBenefit(b, evalDate));
    }
    const stories = buildAllBenefitStories({ benefits, itemsByBenefit });
    const firstIsUrgent = stories[0]?.classification === 'needs_attention';
    const passed = stories.length > 1 && firstIsUrgent;
    results.push({
      name: 'Priority ordering — needs_attention first',
      passed,
      detail: `stories=${stories.length}, first=${stories[0]?.classification}`,
    });
  }

  // S5-3: Cross-border linking — story has hasCrossBorderStory when link map provided
  {
    const benefit = fixtureCrossBorderRsu;
    const items = evaluateEmployerEquityBenefit(benefit, evalDate);
    const cbMap = new Map([[benefit.benefitId, 'cbs_test_123']]);
    const stories = buildAllBenefitStories({
      benefits: [benefit],
      itemsByBenefit: new Map([[benefit.benefitId, items]]),
      crossBorderStoryIds: cbMap,
    });
    const hasLink = stories[0]?.hasCrossBorderStory === true;
    const hasId = stories[0]?.crossBorderStoryId === 'cbs_test_123';
    const passed = hasLink && hasId;
    results.push({
      name: 'Cross-border linking',
      passed,
      detail: `hasCrossBorder=${hasLink}, id=${stories[0]?.crossBorderStoryId}`,
    });
  }

  // S5-4: Stale story detection
  {
    const benefits = [fixtureFormerEmployerConsolidated, fixtureOptionExpiryFourMonths];
    const itemsByBenefit = new Map<string, ReturnType<typeof evaluateEmployerEquityBenefit>>();
    for (const b of benefits) {
      itemsByBenefit.set(b.benefitId, evaluateEmployerEquityBenefit(b, evalDate));
    }
    const stories = buildAllBenefitStories({ benefits, itemsByBenefit });
    const stale = identifyStaleStories(stories, [benefits[0].benefitId]);
    const passed = stale.length === 1 && stale[0] === `story_${benefits[0].benefitId}`;
    results.push({
      name: 'Stale story detection',
      passed,
      detail: `stale count=${stale.length}, id=${stale[0]}`,
    });
  }

  return results;
}

// ── Output Dataset Tests ──

export interface OutputDatasetTestResult {
  name: string;
  passed: boolean;
  detail: string;
}

export function runOutputDatasetTests(): OutputDatasetTestResult[] {
  const results: OutputDatasetTestResult[] = [];
  const evalDate = EVAL_DATE;

  const allBenefits = [
    fixtureRsuDeathTreatmentUnknown,
    fixtureOptionExpiryFourMonths,
    fixtureFormerEmployerConsolidated,
    fixtureDeathDeadline90Days,
    fixtureRetirement7Years,
  ];

  const itemsByBenefit = new Map<string, ReturnType<typeof evaluateEmployerEquityBenefit>>();
  for (const b of allBenefits) {
    itemsByBenefit.set(b.benefitId, evaluateEmployerEquityBenefit(b, evalDate));
  }

  const stories = buildAllBenefitStories({ benefits: allBenefits, itemsByBenefit });
  const datasets = buildAllOutputDatasets(stories);

  // OD-1: All 6 audience datasets produced
  {
    const hasAll = !!datasets.clientSummary && !!datasets.executor && !!datasets.poaProperty
      && !!datasets.advisorPlanner && !!datasets.lawyerAccountant && !!datasets.hiddenRisk;
    const passed = hasAll;
    results.push({
      name: 'All 6 output datasets produced',
      passed,
      detail: `clientSummary=${!!datasets.clientSummary}, executor=${!!datasets.executor}, poa=${!!datasets.poaProperty}, advisor=${!!datasets.advisorPlanner}, lawyer=${!!datasets.lawyerAccountant}, hiddenRisk=${!!datasets.hiddenRisk}`,
    });
  }

  // OD-2: Executor dataset has executor-specific wording
  {
    const execDataset = datasets.executor;
    const hasExecutorWording = execDataset.stories.every((s) =>
      s.wording.length > 0 && !s.wording.includes('Something worth reviewing — what happens'),
    );
    const passed = execDataset.stories.length > 0 && hasExecutorWording;
    results.push({
      name: 'Executor dataset has executor wording',
      passed,
      detail: `stories=${execDataset.stories.length}, allHaveExecutorWording=${hasExecutorWording}`,
    });
  }

  // OD-3: Client summary filters out executor/POA actions
  {
    const clientDataset = datasets.clientSummary;
    const hasNoExecutorActions = clientDataset.stories.every((s) =>
      s.actions.every((a) => !a.toLowerCase().includes('executor') && !a.toLowerCase().includes('poa')),
    );
    const passed = clientDataset.stories.length > 0 && hasNoExecutorActions;
    results.push({
      name: 'Client summary filters executor/POA actions',
      passed,
      detail: `stories=${clientDataset.stories.length}, noExecutorActions=${hasNoExecutorActions}`,
    });
  }

  // OD-4: Hidden risk dataset has no actions (pure description)
  {
    const hrDataset = datasets.hiddenRisk;
    const hasNoActions = hrDataset.stories.every((s) => s.actions.length === 0);
    const passed = hrDataset.stories.length > 0 && hasNoActions;
    results.push({
      name: 'Hidden risk dataset has no actions',
      passed,
      detail: `stories=${hrDataset.stories.length}, noActions=${hasNoActions}`,
    });
  }

  // OD-5: All datasets have consistent story counts
  {
    const counts = [
      datasets.clientSummary.totalStories,
      datasets.executor.totalStories,
      datasets.poaProperty.totalStories,
      datasets.advisorPlanner.totalStories,
      datasets.lawyerAccountant.totalStories,
      datasets.hiddenRisk.totalStories,
    ];
    const allSame = counts.every((c) => c === counts[0]);
    const passed = allSame && counts[0] > 0;
    results.push({
      name: 'All datasets have consistent story counts',
      passed,
      detail: `counts=${counts.join(',')}`,
    });
  }

  // OD-6: Professional dataset uses professional wording
  {
    const profDataset = datasets.advisorPlanner;
    const hasProfWording = profDataset.stories.every((s) => s.wording.length > 0);
    const passed = profDataset.stories.length > 0 && hasProfWording;
    results.push({
      name: 'Advisor dataset uses professional wording',
      passed,
      detail: `stories=${profDataset.stories.length}, allHaveWording=${hasProfWording}`,
    });
  }

  return results;
}

// ── Stage 5 Full Test ──

export interface Stage5TestResult {
  passed: boolean;
  fixtureTestsPassed: boolean;
  storyTestsPassed: boolean;
  outputTestsPassed: boolean;
  fullEnginePassed: boolean;
  totalScenarios: number;
  detail: string;
}

export function runStage5FullTest(): Stage5TestResult {
  const fixtureResults = runEmployerEquityIntelligenceFixtures();
  const storyResults = runStoryConsolidationTests();
  const outputResults = runOutputDatasetTests();
  const fullEngine = runFullEngineTest();

  const fixturesPassed = fixtureResults.every((r) => r.passed);
  const storiesPassed = storyResults.every((r) => r.passed);
  const outputsPassed = outputResults.every((r) => r.passed);
  const enginePassed = fullEngine.passed;

  const passed = fixturesPassed && storiesPassed && outputsPassed && enginePassed;

  return {
    passed,
    fixtureTestsPassed: fixturesPassed,
    storyTestsPassed: storiesPassed,
    outputTestsPassed: outputsPassed,
    fullEnginePassed: enginePassed,
    totalScenarios: fixtureResults.length,
    detail: `Fixtures: ${fixtureResults.filter(r => r.passed).length}/${fixtureResults.length}, Stories: ${storyResults.filter(r => r.passed).length}/${storyResults.length}, Outputs: ${outputResults.filter(r => r.passed).length}/${outputResults.length}, Engine: ${fullEngine.passed ? 'PASS' : 'FAIL'}`,
  };
}