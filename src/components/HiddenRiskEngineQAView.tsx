/**
 * Hidden Risk Engine V1 — Developer / QA View
 *
 * Unbranded internal testing view. NOT the final client report.
 * Allows a developer/advisor to inspect every rule's evaluation state,
 * evidence, suppression status, and audit trail.
 *
 * Also runs all 5 test fixtures and 10 edge cases.
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Eye, FileQuestion, CircleSlash, Globe } from 'lucide-react';
import {
  runHiddenRiskEngine,
} from '../lib/hiddenRisks/hiddenRiskEngine';
import type { HiddenRiskEngineResult, HiddenRiskRuleEvaluation } from '../lib/hiddenRisks/hiddenRiskTypes';
import { LEVEL_LABELS, CONFIDENCE_LABELS, STATE_LABELS } from '../lib/hiddenRisks/hiddenRiskTypes';
import {
  fixture1SimpleOrganized,
  fixture2OutdatedEstatePlan,
  fixture3BusinessOwnerGuarantees,
  fixture4TrusteeExposureUnclear,
  fixture5BlendedFamilyContinuity,
  edgeA_UnknownIsNotNo,
  edgeB_DeletedCorporation,
  edgeC_DeletedObligation,
  edgeD_MultipleRolesOnePerson,
  edgeE_SameObligationMultipleGuarantors,
  edgeF_ProfessionalReviewSuppressesHR02,
  edgeG_GuardianDifferentFromTrusteeNoGap,
  edgeH_ShareholderLoanAloneNoTrigger,
  edgeI_IncompleteSectionNoFalseFindings,
  edgeJ_ForeignPropertyNoForeignWillRecommendation,
} from '../lib/hiddenRisks/hiddenRiskTestFixtures';
import type { HiddenRiskEngineInput } from '../lib/hiddenRisks/hiddenRiskTypes';
import {
  selectAllCrossBorderCandidates,
  buildCrossBorderStories,
  deduplicateCrossBorderCandidates,
} from '../lib/crossBorderTypes';
import type {
  CrossBorderReviewCandidate,
  CrossBorderStory,
  AllCrossBorderSources,
} from '../lib/crossBorderTypes';
import type { EquityBenefitDetails, EquityIssuerInfo } from '../lib/workplacePensionsTypes';
import { evaluateLiveCrossBorder } from '../lib/crossBorderLiveAdapter';
import type { CrossBorderLiveContext, EntityEntryLike, PersonEntryLike } from '../lib/crossBorderLiveAdapter';
import type { QuestionnaireAnswers } from '../lib/steps';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import type { QuestionnaireSectionId } from '../lib/steps';

// ─── Cross-Border Test Fixtures ───────────────────────────────────────────────

function makeEquityDetails(
  ownership: 'currently_own' | 'future_contingent' | 'both' | 'not_sure',
  issuer: Partial<EquityIssuerInfo>,
): EquityBenefitDetails {
  return {
    ownershipStatus: ownership,
    equityIssuer: issuer as EquityIssuerInfo,
  };
}

const crossBorderFixtures: Array<{
  name: string;
  description: string;
  sources: AllCrossBorderSources;
  expectCandidateCount: number;
  expectStoryMax: number;
  expectReasons?: string[];
  expectConfidence?: string;
}> = [
  {
    name: 'CB-A: Unknown issuer jurisdiction',
    description: 'Canadian employer, different issuer, issuer country = not_sure. Should create requires_confirmation candidate, NOT suppress.',
    sources: {
      equityBenefits: [{
        benefitId: 'wpb_test_a',
        clientId: 'client1',
        employerName: 'ABC Canada Inc.',
        employerCountryCode: 'CA',
        details: makeEquityDetails('currently_own', {
          issuerSameAsEmployer: 'no',
          issuerCompanyName: 'ABC Corp.',
          issuerCountry: 'not_sure',
        }),
      }],
    },
    expectCandidateCount: 1,
    expectStoryMax: 1,
    expectConfidence: 'requires_confirmation',
    expectReasons: ['issuer_jurisdiction_requires_confirmation'],
  },
  {
    name: 'CB-B: Canadian employer / U.S. issuer, owned shares',
    description: 'Employer Canada, issuer U.S., owned shares. Should create confirmed us_issuer_owned_shares candidate.',
    sources: {
      equityBenefits: [{
        benefitId: 'wpb_test_b',
        clientId: 'client1',
        employerName: 'ABC Canada Inc.',
        employerCountryCode: 'CA',
        details: makeEquityDetails('currently_own', {
          issuerSameAsEmployer: 'no',
          issuerCompanyName: 'ABC Corp.',
          issuerCountry: 'united_states',
        }),
        footprintAssetId: 'eq_123',
      }],
    },
    expectCandidateCount: 1,
    expectStoryMax: 1,
    expectConfidence: 'confirmed_foreign_connection',
    expectReasons: ['us_issuer_owned_shares'],
  },
  {
    name: 'CB-C: U.S. issuer / Canadian custody',
    description: 'Issuer U.S., custody Canadian brokerage. U.S. candidate must NOT be suppressed by Canadian custody.',
    sources: {
      equityBenefits: [{
        benefitId: 'wpb_test_c',
        clientId: 'client1',
        employerName: 'ABC Canada Inc.',
        employerCountryCode: 'CA',
        details: makeEquityDetails('currently_own', {
          issuerSameAsEmployer: 'no',
          issuerCompanyName: 'ABC Corp.',
          issuerCountry: 'united_states',
          custodyContext: 'canadian_brokerage',
        }),
        footprintAssetId: 'eq_456',
      }],
    },
    expectCandidateCount: 1,
    expectStoryMax: 1,
    expectReasons: ['us_issuer_owned_shares'],
  },
  {
    name: 'CB-D: Canadian issuer / U.S. custody',
    description: 'Issuer Canada, custody U.S. brokerage. Must NOT classify as U.S. issuer. Separate custody candidate OK.',
    sources: {
      financialAssets: [{
        assetId: 'eq_test_d',
        clientId: 'client1',
        companyName: 'Canadian Corp',
        countryCode: 'CA',
        custodyCountry: 'US',
      }],
    },
    expectCandidateCount: 1,
    expectStoryMax: 1,
    expectReasons: ['foreign_custody_administrative_review'],
  },
  {
    name: 'CB-E: Foreign real estate (Florida)',
    description: 'Property in United States. Should create foreign_real_property candidate.',
    sources: {
      realEstate: [{
        propertyKey: 'prop_test_e',
        clientId: 'client1',
        address: '123 Florida Blvd, Orlando, FL',
        country: 'United States',
        approximateValue: '450000',
      }],
    },
    expectCandidateCount: 1,
    expectStoryMax: 1,
    expectReasons: ['foreign_real_property'],
  },
  {
    name: 'CB-F: Foreign corporation (UK)',
    description: 'UK Holdings Ltd. Should create foreign_corporate_interest candidate.',
    sources: {
      corporations: [{
        entityId: 'ent_test_f',
        clientId: 'client1',
        entityName: 'UK Holdings Ltd.',
        country: 'United Kingdom',
      }],
    },
    expectCandidateCount: 1,
    expectStoryMax: 1,
    expectReasons: ['foreign_corporate_interest'],
  },
  {
    name: 'CB-G: Foreign trust',
    description: 'Trust with foreign governing jurisdiction. Should create cross_border_trust candidate.',
    sources: {
      trusts: [{
        trustId: 'trust_test_g',
        clientId: 'client1',
        trustName: 'Family Trust',
        governingJurisdiction: 'United Kingdom',
      }],
    },
    expectCandidateCount: 1,
    expectStoryMax: 1,
    expectReasons: ['cross_border_trust'],
  },
  {
    name: 'CB-H: Non-resident executor',
    description: 'Executor residing in United States. Should create non_resident_executor candidate.',
    sources: {
      executors: [{
        personId: 'person_456',
        clientId: 'client1',
        executorName: 'Bob Smith',
        country: 'United States',
      }],
    },
    expectCandidateCount: 1,
    expectStoryMax: 1,
    expectReasons: ['non_resident_executor'],
  },
  {
    name: 'CB-I: Duplicate story consolidation',
    description: 'Financial Footprint ABC Corp shares + Workplace ESPP linked to same asset. Should consolidate into 1 story.',
    sources: {
      financialAssets: [{
        assetId: 'eq_789',
        clientId: 'client1',
        companyName: 'ABC Corp',
        countryCode: 'US',
        linkedWorkplaceBenefitId: 'wpb_espp',
      }],
      equityBenefits: [{
        benefitId: 'wpb_espp',
        clientId: 'client1',
        employerName: 'ABC Canada Inc.',
        employerCountryCode: 'CA',
        details: makeEquityDetails('currently_own', {
          issuerSameAsEmployer: 'no',
          issuerCompanyName: 'ABC Corp',
          issuerCountry: 'united_states',
        }),
        footprintAssetId: 'eq_789',
      }],
    },
    expectCandidateCount: 2,
    expectStoryMax: 1,
  },
  {
    name: 'CB-J: Multiple U.S. equity sources',
    description: 'Apple shares + ABC employer shares + ABC RSUs. Should group into 1 U.S. story.',
    sources: {
      financialAssets: [{
        assetId: 'eq_apple',
        clientId: 'client1',
        companyName: 'Apple Inc.',
        countryCode: 'US',
      }],
      equityBenefits: [
        {
          benefitId: 'wpb_abc_shares',
          clientId: 'client1',
          employerName: 'ABC Canada Inc.',
          employerCountryCode: 'CA',
          details: makeEquityDetails('currently_own', {
            issuerSameAsEmployer: 'no',
            issuerCompanyName: 'ABC Corp',
            issuerCountry: 'united_states',
          }),
          footprintAssetId: 'eq_abc',
        },
        {
          benefitId: 'wpb_abc_rsus',
          clientId: 'client1',
          employerName: 'ABC Canada Inc.',
          employerCountryCode: 'CA',
          details: makeEquityDetails('future_contingent', {
            issuerSameAsEmployer: 'no',
            issuerCompanyName: 'ABC Corp',
            issuerCountry: 'united_states',
          }),
        },
      ],
    },
    expectCandidateCount: 3,
    expectStoryMax: 1,
  },
  {
    name: 'CB-K: Mixed countries (US + UK + Florida)',
    description: 'U.S. shares, Florida condo, UK company. Should support grouped cross-border summary.',
    sources: {
      financialAssets: [{
        assetId: 'eq_us1',
        clientId: 'client1',
        companyName: 'U.S. Corp',
        countryCode: 'US',
      }],
      realEstate: [{
        propertyKey: 'prop_fl',
        clientId: 'client1',
        address: 'Florida Condo',
        country: 'United States',
      }],
      corporations: [{
        entityId: 'ent_uk',
        clientId: 'client1',
        entityName: 'UK Holdings Ltd.',
        country: 'United Kingdom',
      }],
    },
    expectCandidateCount: 3,
    expectStoryMax: 3,
  },
];

function CrossBorderCandidateRow({ candidate }: { candidate: CrossBorderReviewCandidate }) {
  const [expanded, setExpanded] = useState(false);

  const confidenceColor = candidate.confidence === 'confirmed_foreign_connection'
    ? 'text-amber-400'
    : 'text-yellow-400';

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-800 mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-750 transition-colors"
      >
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        <Globe size={16} className="text-blue-400" />
        <span className="font-mono text-xs text-gray-500">{candidate.sourceType}</span>
        <span className="text-sm text-gray-300 flex-1">{candidate.reason}</span>
        <span className={`text-xs ${confidenceColor}`}>{candidate.confidence}</span>
        <span className="text-xs text-gray-500">{candidate.countryName || candidate.countryCode}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-700 pt-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div><span className="text-gray-500">ID:</span> <span className="text-gray-300 font-mono">{candidate.id}</span></div>
            <div><span className="text-gray-500">Source:</span> <span className="text-gray-300">{candidate.sourceType}:{candidate.sourceId}</span></div>
            <div><span className="text-gray-500">Country:</span> <span className="text-gray-300">{candidate.countryCode}</span></div>
          </div>
          {candidate.footprintAssetId && (
            <div className="text-sm"><span className="text-gray-500">Footprint asset:</span> <span className="text-blue-300 font-mono">{candidate.footprintAssetId}</span></div>
          )}
          {candidate.evidence.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Evidence</div>
              <div className="space-y-1">
                {candidate.evidence.map((ev, i) => (
                  <div key={i} className="text-sm text-gray-300 font-mono bg-gray-850 px-2 py-1 rounded">
                    <span className="text-gray-500">[{ev.field}]</span> {ev.description}: <span className="text-blue-300">{ev.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CrossBorderStoryCard({ story }: { story: CrossBorderStory }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-blue-800/40 rounded-lg bg-blue-900/10 mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-900/20 transition-colors"
      >
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        <Globe size={16} className="text-blue-400" />
        <span className="text-sm text-white font-medium flex-1">{story.title}</span>
        <span className="text-xs text-gray-500">{story.primaryCountryName}</span>
        <span className="text-xs text-blue-400">{story.sourceCandidateIds.length} candidates</span>
        <span className="text-xs text-gray-500">{story.tone}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-blue-800/30 pt-3">
          <div className="text-sm text-gray-300">{story.body}</div>
          <div className="text-xs text-gray-500 italic">{story.professionalReviewSuggestion}</div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div><span className="text-gray-500">Reasons:</span> <span className="text-gray-300">{story.reasons.join(', ')}</span></div>
            <div><span className="text-gray-500">Prof types:</span> <span className="text-gray-300">{story.suggestedProfessionalTypes.join(', ')}</span></div>
          </div>
          {story.affectedAssets.length > 0 && (
            <div className="text-sm"><span className="text-gray-500">Affected assets:</span> {story.affectedAssets.map((a) => <span key={a} className="text-blue-300 font-mono mr-2">{a}</span>)}</div>
          )}
          {story.evidence.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Evidence ({story.evidence.length} items)</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {story.evidence.map((ev, i) => (
                  <div key={i} className="text-xs text-gray-300 font-mono bg-gray-850 px-2 py-1 rounded">
                    <span className="text-gray-500">[{ev.field}]</span> {ev.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CrossBorderFixtureResult({
  name,
  description,
  sources,
  expectCandidateCount,
  expectStoryMax,
  expectReasons,
  expectConfidence,
}: {
  name: string;
  description: string;
  sources: AllCrossBorderSources;
  expectCandidateCount: number;
  expectStoryMax: number;
  expectReasons?: string[];
  expectConfidence?: string;
}) {
  const candidates = useMemo(() => deduplicateCrossBorderCandidates(selectAllCrossBorderCandidates(sources)), [sources]);
  const stories = useMemo(() => buildCrossBorderStories(candidates), [candidates]);

  const candidatePass = candidates.length === expectCandidateCount;
  const storyPass = stories.length <= expectStoryMax;
  const reasonPass = expectReasons ? expectReasons.every((r) => candidates.some((c) => c.reason === r)) : true;
  const confidencePass = expectConfidence ? candidates.every((c) => c.confidence === expectConfidence) : true;
  const allPass = candidatePass && storyPass && reasonPass && confidencePass;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
      <p className="text-sm text-gray-400 mb-3">{description}</p>

      <div className="flex gap-4 mb-4 text-sm">
        <span className={allPass ? 'text-green-400' : 'text-red-400'}>
          {allPass ? 'PASS' : 'FAIL'}
        </span>
        <span className={candidatePass ? 'text-green-400' : 'text-red-400'}>
          Candidates: {candidates.length} (expected {expectCandidateCount})
        </span>
        <span className={storyPass ? 'text-green-400' : 'text-red-400'}>
          Stories: {stories.length} (max {expectStoryMax})
        </span>
        {expectConfidence && (
          <span className={confidencePass ? 'text-green-400' : 'text-red-400'}>
            Confidence: {expectConfidence}
          </span>
        )}
      </div>

      {candidates.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Candidates ({candidates.length})</div>
          {candidates.map((c) => <CrossBorderCandidateRow key={c.id} candidate={c} />)}
        </div>
      )}

      {stories.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Stories ({stories.length})</div>
          {stories.map((s) => <CrossBorderStoryCard key={s.id} story={s} />)}
        </div>
      )}
    </div>
  );
}

const fixtures: Array<{ name: string; description: string; input: () => HiddenRiskEngineInput }> = [
  { name: 'Fixture 1: Simple Organized Family', description: 'Couple with current Wills, POAs, guardians, no corp/trust', input: fixture1SimpleOrganized },
  { name: 'Fixture 2: Outdated Estate Plan', description: 'Will 10y old, trust + corp + child added after', input: fixture2OutdatedEstatePlan },
  { name: 'Fixture 3: Business Owner Guarantees', description: 'HoldCo/OpCo, personal + corporate guarantees', input: fixture3BusinessOwnerGuarantees },
  { name: 'Fixture 4: Trustee Exposure Unclear', description: 'Trust with debt, guarantee unknown', input: fixture4TrusteeExposureUnclear },
  { name: 'Fixture 5: Blended Family / Continuity', description: 'Blended family, support, executor access, continuity', input: fixture5BlendedFamilyContinuity },
];

const edgeCases: Array<{ name: string; description: string; input: () => HiddenRiskEngineInput }> = [
  { name: 'Edge A: Unknown ≠ No', description: 'Unknown answer should not be treated as No', input: edgeA_UnknownIsNotNo },
  { name: 'Edge B: Deleted Corporation', description: 'Inactive corp should not trigger HR-16/HR-17', input: edgeB_DeletedCorporation },
  { name: 'Edge C: Deleted Obligation', description: 'Inactive obligation should not trigger HR-21', input: edgeC_DeletedObligation },
  { name: 'Edge D: Multiple Roles One Person', description: 'Same person with multiple roles = one entity', input: edgeD_MultipleRolesOnePerson },
  { name: 'Edge E: Multiple Guarantors One Obligation', description: 'Obligation counted once in borrower debt', input: edgeE_SameObligationMultipleGuarantors },
  { name: 'Edge F: Professional Review Suppresses HR-02', description: 'Review after life event suppresses HR-02', input: edgeF_ProfessionalReviewSuppressesHR02 },
  { name: 'Edge G: Guardian ≠ Trustee No Gap', description: 'Different guardian/trustee without gaps does not trigger HR-08', input: edgeG_GuardianDifferentFromTrusteeNoGap },
  { name: 'Edge H: Shareholder Loan Alone', description: 'Shareholder loan existence alone does not trigger HR-23', input: edgeH_ShareholderLoanAloneNoTrigger },
  { name: 'Edge I: Incomplete Section', description: 'Unvisited section does not create false findings', input: edgeI_IncompleteSectionNoFalseFindings },
  { name: 'Edge J: Foreign Property No Foreign Will', description: 'Foreign property does not automatically recommend foreign Will', input: edgeJ_ForeignPropertyNoForeignWillRecommendation },
];

function StateIcon({ state }: { state: string }) {
  if (state === 'PASS') return <CheckCircle2 size={16} className="text-green-400" />;
  if (state === 'FIRE') return <AlertTriangle size={16} className="text-red-400" />;
  if (state === 'REVIEW') return <Eye size={16} className="text-yellow-400" />;
  if (state === 'NOT_APPLICABLE') return <CircleSlash size={16} className="text-gray-500" />;
  return <FileQuestion size={16} className="text-gray-400" />;
}

function RuleEvaluationRow({ evalItem }: { evalItem: HiddenRiskRuleEvaluation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-800 mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-750 transition-colors"
      >
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        <StateIcon state={evalItem.state} />
        <span className="font-mono text-sm text-gray-300 font-semibold">{evalItem.ruleId}</span>
        <span className="text-sm text-gray-400 flex-1">{evalItem.ruleTitle}</span>
        <span className="text-xs text-gray-500">{STATE_LABELS[evalItem.state as keyof typeof STATE_LABELS] || evalItem.state}</span>
        {evalItem.level && <span className="text-xs text-gray-500">{LEVEL_LABELS[evalItem.level]}</span>}
        {evalItem.suppressedBy && (
          <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
            Suppressed by {evalItem.suppressedBy}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-700 pt-3">
          {/* State / Level / Confidence */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div><span className="text-gray-500">State:</span> <span className="text-gray-300">{evalItem.state}</span></div>
            {evalItem.level && <div><span className="text-gray-500">Level:</span> <span className="text-gray-300">{LEVEL_LABELS[evalItem.level]}</span></div>}
            {evalItem.confidence && <div><span className="text-gray-500">Confidence:</span> <span className="text-gray-300">{CONFIDENCE_LABELS[evalItem.confidence]}</span></div>}
            <div><span className="text-gray-500">Primary:</span> <span className="text-gray-300">{evalItem.isPrimary ? 'Yes' : 'No'}</span></div>
          </div>

          {/* Notes */}
          {evalItem.notes && (
            <div className="text-sm text-gray-400 italic">{evalItem.notes}</div>
          )}

          {/* Evidence */}
          {evalItem.evidence.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Evidence</div>
              <div className="space-y-1">
                {evalItem.evidence.map((ev, i) => (
                  <div key={i} className="text-sm text-gray-300 font-mono bg-gray-850 px-2 py-1 rounded">
                    <span className="text-gray-500">[{ev.type}]</span> {ev.label}
                    {ev.value !== undefined && <span className="text-blue-300"> = {String(ev.value)}</span>}
                    {ev.sourceSection && <span className="text-gray-500"> ({ev.sourceSection})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Items */}
          {evalItem.auditItems.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Audit Trail</div>
              <div className="space-y-1">
                {evalItem.auditItems.map((item, i) => (
                  <div key={i} className="text-sm text-gray-400 font-mono bg-gray-850 px-2 py-1 rounded">
                    <span className="text-gray-500">[{item.ruleId}]</span> {item.condition}
                    <span className={item.result === true ? 'text-green-400' : item.result === 'unknown' ? 'text-yellow-400' : 'text-red-400'}>
                      {' → '}{String(item.result)}
                    </span>
                    {item.notes && <span className="text-gray-500"> ({item.notes})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSummary({ result, name, description }: { result: HiddenRiskEngineResult; name: string; description: string }) {
  const counts = {
    fire: result.evaluations.filter((e) => e.state === 'FIRE').length,
    review: result.evaluations.filter((e) => e.state === 'REVIEW').length,
    pass: result.evaluations.filter((e) => e.state === 'PASS').length,
    na: result.evaluations.filter((e) => e.state === 'NOT_APPLICABLE').length,
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
      <p className="text-sm text-gray-400 mb-3">{description}</p>

      {/* Summary counts */}
      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-red-400">FIRE: {counts.fire}</span>
        <span className="text-yellow-400">REVIEW: {counts.review}</span>
        <span className="text-green-400">PASS: {counts.pass}</span>
        <span className="text-gray-500">N/A: {counts.na}</span>
        <span className="text-blue-400">Primary: {result.primaryFindings.length}</span>
        <span className="text-orange-400">Suppressed: {result.suppressedFindings.length}</span>
        <span className="text-green-300">Positive: {result.positiveFindings.length}</span>
      </div>

      {/* Primary findings by level */}
      {result.primaryFindings.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Primary Findings (sorted)</div>
          {result.primaryFindings.map((f) => (
            <div key={f.id} className="border border-gray-700 rounded-lg bg-gray-800 p-3 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-gray-500">{f.ruleId}</span>
                <span className="text-xs text-gray-400">{LEVEL_LABELS[f.level]}</span>
                <span className="text-xs text-gray-500">{CONFIDENCE_LABELS[f.confidence]}</span>
              </div>
              <div className="text-sm text-white font-medium">{f.title}</div>
              <div className="text-sm text-gray-400 mt-1">{f.summary}</div>
            </div>
          ))}
        </div>
      )}

      {/* Positive findings */}
      {result.positiveFindings.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-green-400 uppercase mb-2">What Looks Good</div>
          {result.positiveFindings.map((p, i) => (
            <div key={i} className="border border-green-800 rounded-lg bg-green-900/20 p-3 mb-2">
              <span className="font-mono text-xs text-gray-500">{p.sourceRuleId}</span>
              <div className="text-sm text-green-300">{p.title}</div>
            </div>
          ))}
        </div>
      )}

      {/* All evaluations */}
      <div className="text-xs text-gray-500 uppercase mb-2">All Rule Evaluations</div>
      {result.evaluations.map((ev) => (
        <RuleEvaluationRow key={ev.ruleId} evalItem={ev} />
      ))}
    </div>
  );
}

export default function HiddenRiskEngineQAView() {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'edges' | 'crossborder' | 'livecrossborder'>('fixtures');

  // Pull live data from application contexts
  const { answers: answersMap } = useQuestionnaire();
  const { people } = usePeopleRepository();
  const { entities } = useEntityRegistry();

  const liveAnswers = useMemo<QuestionnaireAnswers | undefined>(() => {
    if (!answersMap || answersMap.size === 0) return undefined;
    const obj: Partial<Record<QuestionnaireSectionId, Record<string, unknown>>> = {};
    for (const [key, value] of answersMap.entries()) {
      obj[key as QuestionnaireSectionId] = value;
    }
    return obj;
  }, [answersMap]);

  const liveContext = useMemo<CrossBorderLiveContext | undefined>(() => {
    if (!people || people.length === 0) return undefined;
    const peopleData: PersonEntryLike[] = people.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      country: p.country,
      active: p.active,
    }));
    const entityData: EntityEntryLike[] | undefined = entities && entities.length > 0
      ? entities.map((e) => ({
          id: e.id,
          entityType: e.entityType,
          displayName: e.displayName,
          sourceSection: e.sourceSection,
          sourceEntityRef: e.sourceEntityRef,
          metadata: e.metadata,
          active: e.active,
        }))
      : undefined;
    return { peopleData, entities: entityData };
  }, [people, entities]);

  const fixtureResults = useMemo(
    () => fixtures.map((f) => ({ name: f.name, description: f.description, result: runHiddenRiskEngine(f.input()) })),
    []
  );

  const edgeResults = useMemo(
    () => edgeCases.map((e) => ({ name: e.name, description: e.description, result: runHiddenRiskEngine(e.input()) })),
    []
  );

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Hidden Risk Engine V1 — Developer/QA View</h1>
        <p className="text-gray-400 mb-6">
          Internal testing view. Not the final client report. Inspect every rule's evaluation state, evidence, and suppression status.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'fixtures' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Test Fixtures ({fixtures.length})
          </button>
          <button
            onClick={() => setActiveTab('edges')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'edges' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Edge Cases ({edgeCases.length})
          </button>
          <button
            onClick={() => setActiveTab('crossborder')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'crossborder' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Cross-Border ({crossBorderFixtures.length})
          </button>
          <button
            onClick={() => setActiveTab('livecrossborder')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'livecrossborder' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Live Cross-Border
          </button>
        </div>

        {/* Content */}
        {activeTab === 'fixtures' && (
          <div>
            {fixtureResults.map((r) => (
              <ResultSummary key={r.name} result={r.result} name={r.name} description={r.description} />
            ))}
          </div>
        )}

        {activeTab === 'edges' && (
          <div>
            {edgeResults.map((r) => (
              <ResultSummary key={r.name} result={r.result} name={r.name} description={r.description} />
            ))}
          </div>
        )}

        {activeTab === 'crossborder' && (
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Cross-border review candidate and story consolidation tests. Verifies unknown-jurisdiction handling, issuer-vs-custody distinction, and duplicate story consolidation.
            </p>
            {crossBorderFixtures.map((f) => (
              <CrossBorderFixtureResult key={f.name} {...f} />
            ))}
          </div>
        )}

        {activeTab === 'livecrossborder' && (
          <LiveCrossBorderSection answers={liveAnswers} context={liveContext} />
        )}
      </div>
    </div>
  );
}

// ─── Live Cross-Border Section ────────────────────────────────────────────────

function LiveCrossBorderSection({
  answers,
  context,
}: {
  answers: QuestionnaireAnswers | undefined;
  context: CrossBorderLiveContext | undefined;
}) {
  const result = useMemo(
    () => (answers ? evaluateLiveCrossBorder(answers, context) : null),
    [answers, context],
  );

  if (!answers) {
    return (
      <div className="text-sm text-gray-500 italic">
        No questionnaire data available. Start the questionnaire to see live cross-border evaluation.
      </div>
    );
  }

  if (!result) return null;

  const isLegacyId = (id: string) => id.startsWith('legacy_');

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Live cross-border evaluation from current questionnaire state. Reads real
        Financial Footprint, Workplace, Real Estate, Corporation, Trust, and Executor data.
       {' '}
        {context?.peopleData && context.peopleData.length > 0
          ? `People Repository: ${context.peopleData.length} people. `
          : 'People Repository: not loaded. '}
        {context?.entities && context.entities.length > 0
          ? `Entity Registry: ${context.entities.length} entities.`
          : 'Entity Registry: not loaded.'}
      </p>

      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-blue-400">Sources mapped: {Object.values(result.sources).filter((v) => v && v.length > 0).length}/6</span>
        <span className="text-amber-400">Candidates: {result.candidates.length}</span>
        <span className="text-orange-400">Deduplicated: {result.deduplicatedCandidates.length}</span>
        <span className="text-green-400">Stories: {result.stories.length}</span>
      </div>

      {/* Source counts */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase mb-2">Source Mapping</div>
        <div className="space-y-1">
          {Object.entries(result.sources).map(([key, value]) => (
            <div key={key} className="text-sm text-gray-300 bg-gray-800 px-3 py-1.5 rounded flex items-center gap-2">
              <span className="font-mono text-gray-500">{key}</span>
              <span className={value && value.length > 0 ? 'text-blue-300' : 'text-gray-600'}>
                {value?.length || 0} records
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live candidates with canonical ID table */}
      {result.deduplicatedCandidates.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase mb-2">Live Candidates ({result.deduplicatedCandidates.length})</div>

          {/* Canonical ID summary table */}
          <div className="mb-4 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Source Type</th>
                  <th className="text-left px-3 py-2">Source Label</th>
                  <th className="text-left px-3 py-2">Canonical Source ID</th>
                  <th className="text-left px-3 py-2">Country</th>
                  <th className="text-left px-3 py-2">Reason</th>
                  <th className="text-left px-3 py-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {result.deduplicatedCandidates.map((c) => {
                  const legacy = isLegacyId(c.sourceId);
                  const label = c.evidence.find((e) => e.field === 'address' || e.field === 'entityName' || e.field === 'trustName' || e.field === 'executorName' || e.field === 'companyName')?.value || c.sourceId;
                  return (
                    <tr key={c.id} className="border-t border-gray-700">
                      <td className="px-3 py-2 text-gray-400 font-mono">{c.sourceType}</td>
                      <td className="px-3 py-2 text-gray-300">{label}</td>
                      <td className={`px-3 py-2 font-mono ${legacy ? 'text-red-400' : 'text-blue-300'}`}>
                        {c.sourceId}
                        {legacy && <span className="ml-2 text-xs text-red-500">LEGACY</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-300">{c.countryName || c.countryCode || '—'}</td>
                      <td className="px-3 py-2 text-gray-300">{c.reason}</td>
                      <td className={`px-3 py-2 ${c.confidence === 'confirmed_foreign_connection' ? 'text-amber-400' : 'text-yellow-400'}`}>{c.confidence}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expandable candidate details */}
          {result.deduplicatedCandidates.map((c) => (
            <CrossBorderCandidateRow key={c.id} candidate={c} />
          ))}
        </div>
      )}

      {/* Live stories */}
      {result.stories.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase mb-2">Live Stories ({result.stories.length})</div>
          {result.stories.map((s) => (
            <CrossBorderStoryCard key={s.id} story={s} />
          ))}
        </div>
      )}

      {result.deduplicatedCandidates.length === 0 && (
        <div className="text-sm text-gray-500 italic">
          No cross-border candidates generated from current questionnaire state.
          This is expected when no foreign assets, foreign equity, or non-resident executors have been identified.
        </div>
      )}
    </div>
  );
}
