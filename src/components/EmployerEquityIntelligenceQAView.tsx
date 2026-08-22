/**
 * Employer Equity Intelligence — Stage 2 Read-Only QA View
 *
 * Internal developer/QA view. Unbranded.
 * Reads live questionnaire state, runs the pure engine, displays results.
 *
 * READ-ONLY: no setters, no persistence, no context mutations.
 * Uses useMemo with canonical source data dependencies only.
 * No useEffect — derived intelligence is never written back.
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Eye, Info, Clock, TrendingUp } from 'lucide-react';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { buildLiveEquityIntelligenceInputs } from '../lib/employerEquityIntelligence/employerEquityIntelligenceLiveAdapter';
import { buildEmployerEquityIntelligenceItems } from '../lib/employerEquityIntelligence/employerEquityIntelligenceEngine';
import {
  runEmployerEquityIntelligenceFixtures,
  runDeadlineEngineUnitTests,
  runFullEngineTest,
} from '../lib/employerEquityIntelligence/employerEquityIntelligenceFixtures';
import type {
  EquityIntelligenceItem,
  EquityIntelligenceClassification,
  EquityDeadlineStatus,
  AudienceWording,
} from '../lib/employerEquityIntelligence/employerEquityIntelligenceTypes';
import {
  CLASSIFICATION_LABELS,
  CLASSIFICATION_ORDER,
  CONFIDENCE_LABELS,
  DEADLINE_STATUS_LABELS,
} from '../lib/employerEquityIntelligence/employerEquityIntelligenceTypes';
import {
  AUDIENCE_LABELS,
  AUDIENCE_ORDER,
} from '../lib/employerEquityIntelligence/audienceTranslations';
import type { EquityIntelligenceAudience } from '../lib/employerEquityIntelligence/audienceTranslations';

function ClassificationIcon({ classification }: { classification: EquityIntelligenceClassification }) {
  switch (classification) {
    case 'needs_attention':
      return <AlertTriangle size={16} className="text-red-400" />;
    case 'operational_instruction':
      return <Clock size={16} className="text-orange-400" />;
    case 'worth_reviewing':
      return <Eye size={16} className="text-yellow-400" />;
    case 'planning_opportunity':
      return <TrendingUp size={16} className="text-green-400" />;
    default:
      return <Info size={16} className="text-gray-400" />;
  }
}

function classificationColor(c: EquityIntelligenceClassification): string {
  switch (c) {
    case 'needs_attention': return 'text-red-400';
    case 'operational_instruction': return 'text-orange-400';
    case 'worth_reviewing': return 'text-yellow-400';
    case 'planning_opportunity': return 'text-green-400';
    default: return 'text-gray-400';
  }
}

function deadlineColor(s: EquityDeadlineStatus | undefined): string {
  if (!s) return 'text-gray-500';
  switch (s) {
    case 'passed': return 'text-red-400';
    case 'urgent': return 'text-red-400';
    case 'approaching': return 'text-orange-400';
    case 'planning_horizon': return 'text-blue-400';
    case 'informational': return 'text-gray-400';
    case 'unknown': return 'text-gray-500';
    default: return 'text-gray-500';
  }
}

function IntelligenceItemRow({ item }: { item: EquityIntelligenceItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-800 mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-750 transition-colors"
      >
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        <ClassificationIcon classification={item.classification} />
        <span className="font-mono text-xs text-gray-500 flex-shrink-0">{item.topic}</span>
        <span className="text-sm text-gray-300 flex-1 truncate">{item.title}</span>
        {item.deadlineResult && (
          <span className={`text-xs ${deadlineColor(item.deadlineResult.status)}`}>
            {DEADLINE_STATUS_LABELS[item.deadlineResult.status]}
            {item.deadlineResult.monthsRemaining !== undefined && ` (${item.deadlineResult.monthsRemaining}mo)`}
          </span>
        )}
        <span className={`text-xs ${classificationColor(item.classification)}`}>
          {CLASSIFICATION_LABELS[item.classification]}
        </span>
        <span className="text-xs text-gray-500">{CONFIDENCE_LABELS[item.confidence]}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-700 pt-3">
          {/* Summary */}
          <div className="text-sm text-gray-300">{item.summary}</div>

          {/* Why it matters */}
          {item.whyItMatters && (
            <div className="text-sm text-gray-400 italic">{item.whyItMatters}</div>
          )}

          {/* Suggested actions */}
          {item.suggestedActions && item.suggestedActions.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Suggested Actions</div>
              <ul className="space-y-1">
                {item.suggestedActions.map((action, i) => (
                  <li key={i} className="text-sm text-gray-300 bg-gray-850 px-2 py-1 rounded">
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence */}
          {item.evidence.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Evidence</div>
              <div className="space-y-1">
                {item.evidence.map((ev, i) => (
                  <div key={i} className="text-sm text-gray-300 font-mono bg-gray-850 px-2 py-1 rounded">
                    <span className="text-gray-500">[{ev.field}]</span> {ev.label}
                    {ev.value !== undefined && <span className="text-blue-300"> = {String(ev.value)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deadline details */}
          {item.deadlineResult && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Deadline State</div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div><span className="text-gray-500">Status:</span> <span className={deadlineColor(item.deadlineResult.status)}>{DEADLINE_STATUS_LABELS[item.deadlineResult.status]}</span></div>
                <div><span className="text-gray-500">Months:</span> <span className="text-gray-300">{item.deadlineResult.monthsRemaining ?? '—'}</span></div>
                <div><span className="text-gray-500">Date:</span> <span className="text-gray-300">{item.deadlineResult.deadlineDate ?? '—'}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className="text-gray-300">{item.deadlineResult.deadlineType}</span></div>
              </div>
            </div>
          )}

          {/* Audience translations */}
          {item.audienceWording && (
            <AudienceWordingDisplay wording={item.audienceWording} />
          )}
        </div>
      )}
    </div>
  );
}

function AudienceWordingDisplay({ wording }: { wording: AudienceWording }) {
  const audiences = Object.keys(AUDIENCE_LABELS) as EquityIntelligenceAudience[];
  const audienceColors: Record<EquityIntelligenceAudience, string> = {
    client: 'text-blue-300',
    executor: 'text-amber-300',
    poa: 'text-green-300',
    professional: 'text-purple-300',
  };
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase mb-2">Audience Translations</div>
      <div className="space-y-2">
        {audiences.sort((a, b) => AUDIENCE_ORDER[a] - AUDIENCE_ORDER[b]).map((audience) => (
          <div key={audience} className="bg-gray-850 px-3 py-2 rounded border-l-2 border-gray-600">
            <div className={`text-xs font-medium mb-1 ${audienceColors[audience]}`}>
              {AUDIENCE_LABELS[audience]}
            </div>
            <div className="text-sm text-gray-300">{wording[audience]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenefitCard({
  benefitId,
  benefitType,
  employerName,
  items,
}: {
  benefitId: string;
  benefitType: string;
  employerName: string;
  items: EquityIntelligenceItem[];
}) {
  const [expanded, setExpanded] = useState(true);

  const sorted = [...items].sort((a, b) =>
    CLASSIFICATION_ORDER[a.classification] - CLASSIFICATION_ORDER[b.classification]
  );

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-850 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-800 transition-colors rounded-t-lg"
      >
        {expanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
        <div className="flex-1">
          <div className="text-sm text-white font-medium">{benefitType}</div>
          <div className="text-xs text-gray-500">
            {employerName} · <span className="font-mono">{benefitId}</span>
          </div>
        </div>
        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">{items.length} findings</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          {sorted.map((item) => (
            <IntelligenceItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function FixtureResultsSection() {
  const fixtureResults = useMemo(() => runEmployerEquityIntelligenceFixtures(), []);
  const deadlineResults = useMemo(() => runDeadlineEngineUnitTests(), []);
  const fullResult = useMemo(() => runFullEngineTest(), []);

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Pure fixture tests run against the Stage 1 engine. No live data required.
      </p>

      {/* Summary */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className={fixtureResults.every(r => r.passed) ? 'text-green-400' : 'text-red-400'}>
          Fixtures: {fixtureResults.filter(r => r.passed).length}/{fixtureResults.length}
        </span>
        <span className={deadlineResults.every(r => r.passed) ? 'text-green-400' : 'text-red-400'}>
          Deadline tests: {deadlineResults.filter(r => r.passed).length}/{deadlineResults.length}
        </span>
        <span className={fullResult.passed ? 'text-green-400' : 'text-red-400'}>
          Full engine: {fullResult.passed ? 'PASS' : 'FAIL'}
        </span>
      </div>

      {/* Full engine breakdown */}
      <div className="mb-6 border border-gray-700 rounded-lg p-4 bg-gray-800">
        <div className="text-xs text-gray-500 uppercase mb-2">Full Engine Classification Breakdown</div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-red-400">Needs Attention: {fullResult.byClassification.needs_attention}</span>
          <span className="text-orange-400">Operational: {fullResult.byClassification.operational_instruction}</span>
          <span className="text-yellow-400">Worth Reviewing: {fullResult.byClassification.worth_reviewing}</span>
          <span className="text-green-400">Planning Opportunity: {fullResult.byClassification.planning_opportunity}</span>
          <span className="text-gray-400">Total: {fullResult.totalFindings}</span>
        </div>
      </div>

      {/* Fixture details */}
      <div className="text-xs text-gray-500 uppercase mb-2">Fixture Results</div>
      {fixtureResults.map((r) => (
        <div key={r.name} className="mb-3 border border-gray-700 rounded-lg p-3 bg-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className={r.passed ? 'text-green-400' : 'text-red-400'}>{r.passed ? 'PASS' : 'FAIL'}</span>
            <span className="text-sm text-white">{r.name}</span>
            <span className="text-xs text-gray-500 ml-auto">{r.items.length} items</span>
          </div>
          <div className="text-xs text-gray-400">{r.topicChecks}</div>
          <div className="text-xs text-gray-400">{r.classificationChecks}</div>
        </div>
      ))}
    </div>
  );
}

function LiveIntelligenceSection() {
  const { answers } = useQuestionnaire();

  // Memoized on canonical source data (the answers map reference)
  const liveInputs = useMemo(
    () => buildLiveEquityIntelligenceInputs(answers),
    [answers],
  );

  const engineResult = useMemo(
    () => buildEmployerEquityIntelligenceItems(liveInputs, new Date()),
    [liveInputs],
  );

  if (!answers || answers.size === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No questionnaire data available. Start the questionnaire and navigate to the
        Employer Equity section to see live intelligence evaluation.
      </div>
    );
  }

  if (liveInputs.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No employer equity or executive compensation benefits found in current questionnaire state.
        Add equity benefits (stock options, RSUs, ESPP, etc.) in the Workplace Pensions &amp; Benefits
        section to see live intelligence.
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Live evaluation from current questionnaire state. {liveInputs.length} equity/executive
        benefit(s) found, producing {engineResult.totalFindings} intelligence item(s).
        This is read-only — no intelligence is written back to questionnaire state.
      </p>

      {/* Summary counts */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <span className="text-gray-400">Benefits: {engineResult.totalEvaluated}</span>
        <span className="text-red-400">Needs Attention: {engineResult.byClassification.needsAttention.length}</span>
        <span className="text-orange-400">Operational: {engineResult.byClassification.operationalInstruction.length}</span>
        <span className="text-yellow-400">Worth Reviewing: {engineResult.byClassification.worthReviewing.length}</span>
        <span className="text-green-400">Planning Opportunity: {engineResult.byClassification.planningOpportunity.length}</span>
      </div>

      {/* By benefit */}
      <div className="text-xs text-gray-500 uppercase mb-2">Intelligence by Benefit</div>
      {Array.from(engineResult.byBenefit.entries()).map(([benefitId, items]) => {
        const input = liveInputs.find((b) => b.benefitId === benefitId);
        if (!input) return null;
        return (
          <BenefitCard
            key={benefitId}
            benefitId={benefitId}
            benefitType={input.benefitTypeLabel}
            employerName={input.employerName}
            items={items}
          />
        );
      })}
    </div>
  );
}

export default function EmployerEquityIntelligenceQAView() {
  const [activeTab, setActiveTab] = useState<'live' | 'fixtures'>('live');

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">
          Employer Equity Intelligence — Developer/QA View (Stage 3)
        </h1>
        <p className="text-gray-400 mb-6">
          Internal read-only testing view. Reads live questionnaire state, runs the pure
          intelligence engine, and displays derived findings. No intelligence is persisted.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'live' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Live Intelligence
          </button>
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'fixtures' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Test Fixtures
          </button>
        </div>

        {/* Content */}
        {activeTab === 'live' && <LiveIntelligenceSection />}
        {activeTab === 'fixtures' && <FixtureResultsSection />}
      </div>
    </div>
  );
}
