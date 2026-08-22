/**
 * Employer Equity Intelligence — Stage 1 Public API
 */

export type {
  EquityIntelligenceClassification,
  EquityIntelligenceConfidence,
  EquityIntelligenceTopic,
  EquityIntelligenceItem,
  EquityIntelligenceEvidence,
  EquityDeadlineStatus,
  EquityDeadlineType,
  EquityDeadlineInput,
  EquityDeadlineResult,
  EmployerEquityBenefitInput,
  AudienceWording,
} from './employerEquityIntelligenceTypes';

export {
  DEADLINE_THRESHOLDS,
  DEADLINE_STATUS_LABELS,
  DEADLINE_STATUS_ORDER,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_ORDER,
  CONFIDENCE_LABELS,
  CONFIDENCE_ORDER,
} from './employerEquityIntelligenceTypes';

export {
  parseDeadlineDate,
  monthsBetween,
  classifyDeadline,
  deadlineStatusToClassification,
  evaluateEmployerEquityDeadline,
  evaluateOptionExpiry,
  evaluateVestingDeadline,
} from './deadlineEngine';

export {
  ALL_EQUITY_INTELLIGENCE_RULES,
  ruleDeathTreatmentUnknown,
  ruleDeathDeadline,
  ruleOptionExpiryKnown,
  ruleOptionExpiryUnknown,
  ruleFormerEmployerBenefit,
  ruleMissingAdministrator,
  ruleMissingDocuments,
  ruleIncapacityTreatmentUnknown,
  ruleBeneficiaryUnknown,
  ruleTerminationTreatmentUnknown,
  ruleTerminationDeadline,
  ruleVestingEvent,
  ruleRetirementApproaching,
  ruleSerpReview,
  ruleRcaReview,
  FORMER_EMPLOYER_CONSOLIDATION_TOPICS,
} from './employerEquityIntelligenceRules';
export type { EquityIntelligenceRule } from './employerEquityIntelligenceRules';

export {
  evaluateEmployerEquityBenefit,
  buildEmployerEquityIntelligenceItems,
} from './employerEquityIntelligenceEngine';
export type { EquityIntelligenceEngineResult, EquityIntelligenceResult } from './employerEquityIntelligenceEngine';

export {
  runEmployerEquityIntelligenceFixtures,
  runDeadlineEngineUnitTests,
  runFullEngineTest,
  runStoryConsolidationTests,
  runOutputDatasetTests,
  runStage5FullTest,
} from './employerEquityIntelligenceFixtures';
export type {
  FixtureTestResult,
  DeadlineUnitTestResult,
  FullEngineTestResult,
  StoryTestResult,
  OutputDatasetTestResult,
  Stage5TestResult,
} from './employerEquityIntelligenceFixtures';

export {
  mapWorkplaceBenefitToEngineInput,
  extractEquityBenefitsFromClient,
  buildLiveEquityIntelligenceInputs,
} from './employerEquityIntelligenceLiveAdapter';

export {
  buildAudienceWording,
  AUDIENCE_LABELS,
  AUDIENCE_ORDER,
} from './audienceTranslations';
export type { EquityIntelligenceAudience } from './audienceTranslations';

// ── Stage 5: Consolidation + Output Readiness ──

export {
  buildBenefitStory,
  buildAllBenefitStories,
} from './benefitStoryBuilder';
export type {
  EquityBenefitStory,
  EquityStoryClassification,
  BenefitStoryInput,
  BuildStoriesInput,
} from './benefitStoryBuilder';

export {
  buildOutputDataset,
  buildAllOutputDatasets,
  buildCrossBorderLinkMap,
  identifyStaleStories,
  AUDIENCE_LABELS as OUTPUT_AUDIENCE_LABELS,
} from './outputDatasets';
export type {
  OutputAudience,
  OutputDataset,
  OutputStoryEntry,
  AllOutputDatasets,
} from './outputDatasets';
