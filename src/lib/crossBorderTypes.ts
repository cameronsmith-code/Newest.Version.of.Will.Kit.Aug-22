// ─── Cross-Border / Jurisdiction Architecture ─────────────────────────────────
//
// Reusable country model and review-candidate architecture for identifying
// foreign-jurisdiction connections across Employer Equity, Financial Footprint,
// Real Estate, Corporations, Trusts, and Executor records.
//
// This module does NOT make legal or tax conclusions. It identifies
// "something worth reviewing" and prepares structured data for later
// professional / Hidden Risk / Planning Opportunity logic.

import type { WorkplaceClientData, EquityBenefitDetails, EquityIssuerInfo, EmployerCountrySelection } from './workplacePensionsTypes';

// Re-export for convenience
export type { EquityIssuerInfo, EmployerCountrySelection };

// ─── Country Model ────────────────────────────────────────────────────────────

export type CountryCode = 'CA' | 'US' | 'GB' | 'other' | 'unknown';

const COUNTRY_NAMES: Record<CountryCode, string> = {
  CA: 'Canada',
  US: 'United States',
  GB: 'United Kingdom',
  other: 'Another country',
  unknown: "I'm not sure",
};

export function getCountryName(code: CountryCode, otherCountryName?: string): string {
  if (code === 'other' && otherCountryName) return otherCountryName;
  return COUNTRY_NAMES[code] || 'Unknown';
}

const COUNTRY_ALIASES: Record<string, CountryCode> = {
  'canada': 'CA',
  'ca': 'CA',
  'can': 'CA',
  'united states': 'US',
  'us': 'US',
  'usa': 'US',
  'u.s.': 'US',
  'u.s.a.': 'US',
  'united states of america': 'US',
  'america': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'gb': 'GB',
  'gbr': 'GB',
  'great britain': 'GB',
  'england': 'GB',
};

export function normalizeCountry(input: string | undefined | null): CountryCode {
  if (!input) return 'unknown';
  const lower = input.trim().toLowerCase();
  if (COUNTRY_ALIASES[lower]) return COUNTRY_ALIASES[lower];
  // If it doesn't match any known alias, treat as 'other' foreign
  return 'other';
}

export function isForeign(code: CountryCode | undefined): boolean {
  return code === 'US' || code === 'GB' || code === 'other';
}

export function isUS(code: CountryCode | undefined): boolean {
  return code === 'US';
}

// Returns true for confirmed foreign OR unknown (which may need confirmation).
// Use this when the selector should NOT suppress candidates merely because
// the country is unknown — the "requires_confirmation" path should still fire.
export function isForeignOrUnknown(code: CountryCode | undefined): boolean {
  return code !== 'CA';
}

// ─── Cross-Border Review Candidate Model ──────────────────────────────────────

export type CrossBorderSource =
  | 'financial_asset'
  | 'employer_equity'
  | 'real_estate'
  | 'corporation'
  | 'trust'
  | 'executor'
  | 'custody'
  | 'other';

export type CrossBorderReason =
  | 'us_issuer_owned_shares'
  | 'foreign_issuer_owned_shares'
  | 'foreign_employer_equity_requires_review'
  | 'issuer_jurisdiction_requires_confirmation'
  | 'foreign_real_property'
  | 'foreign_corporate_interest'
  | 'cross_border_trust'
  | 'non_resident_executor'
  | 'foreign_custody_administrative_review'
  | 'other_foreign_connection';

export type CrossBorderConfidence =
  | 'confirmed_foreign_connection'
  | 'requires_confirmation';

export type CrossBorderEvidence = {
  field: string;
  value: string;
  description: string;
};

export type CrossBorderReviewCandidate = {
  id: string;
  clientId?: string;
  sourceType: CrossBorderSource;
  sourceId: string;
  countryCode?: CountryCode;
  countryName?: string;
  reason: CrossBorderReason;
  confidence: CrossBorderConfidence;
  evidence: CrossBorderEvidence[];
  suggestedProfessionalTypes?: string[];
  // Optional: linked footprint asset ID for consolidation
  footprintAssetId?: string;
  // Optional: linked Workplace benefit ID for consolidation
  workplaceBenefitId?: string;
  // Grouping key for consolidation (set by buildCrossBorderStories)
  storyGroupId?: string;
};

// ─── Employer / Issuer Country (types imported from workplacePensionsTypes) ───

export function employerCountryToCode(selection: EmployerCountrySelection | undefined): CountryCode {
  switch (selection) {
    case 'canada': return 'CA';
    case 'united_states': return 'US';
    case 'another_country': return 'other';
    default: return 'unknown';
  }
}

// ─── Client-Facing Templates ──────────────────────────────────────────────────

export type CrossBorderClientTemplate = {
  title: string;
  body: string;
  professionalReviewSuggestion: string;
};

export const CROSS_BORDER_TEMPLATES: Record<CrossBorderReason, CrossBorderClientTemplate> = {
  us_issuer_owned_shares: {
    title: 'Something worth reviewing — U.S. investments',
    body:
      'You own shares in one or more U.S. companies. That doesn\u2019t necessarily mean you\u2019ll owe U.S. estate tax, ' +
      'but U.S. investments can introduce additional estate and filing considerations for Canadians. ' +
      'Consider having your accountant or estate lawyer review your U.S. holdings as part of your estate plan, ' +
      'particularly as your wealth or U.S. investments grow.',
    professionalReviewSuggestion:
      'U.S. issuer identified \u2014 review U.S.-situs exposure, potential estate-tax filing requirements and available treaty relief.',
  },
  foreign_issuer_owned_shares: {
    title: 'Something worth reviewing — foreign investments',
    body:
      'You own shares in one or more companies based outside Canada. ' +
      'Foreign investments can introduce additional estate and filing considerations. ' +
      'Consider having your accountant or estate lawyer review these holdings as part of your estate plan.',
    professionalReviewSuggestion:
      'Foreign issuer identified \u2014 review situs exposure, potential estate-tax filing requirements and cross-border treatment.',
  },
  foreign_employer_equity_requires_review: {
    title: 'Something worth reviewing — foreign employer equity',
    body:
      'You have workplace equity compensation connected to a company outside Canada. ' +
      'The treatment of these awards after death, incapacity or leaving your employer can depend on the plan and jurisdiction involved. ' +
      'Consider having the plan reviewed as part of your estate and financial planning.',
    professionalReviewSuggestion:
      'Foreign-issuer employer equity identified \u2014 review plan terms, vesting, death/termination provisions and cross-border treatment.',
  },
  issuer_jurisdiction_requires_confirmation: {
    title: 'Something worth reviewing — equity issuer jurisdiction unclear',
    body:
      'You have employer equity compensation where the jurisdiction of the share issuer is not yet confirmed. ' +
      'If the issuer is based outside Canada, additional estate and tax considerations may apply. ' +
      'Consider confirming the issuer\u2019s country and having the plan reviewed.',
    professionalReviewSuggestion:
      'Issuer jurisdiction unknown \u2014 confirm issuer country, then review for potential cross-border estate/tax implications.',
  },
  foreign_real_property: {
    title: 'Something worth reviewing — foreign real estate',
    body:
      'You own property outside Canada. Estate administration, tax and succession rules can differ by jurisdiction. ' +
      'Consider having your estate plan reviewed by a professional experienced in cross-border estates, ' +
      'including whether your existing documents are sufficient.',
    professionalReviewSuggestion:
      'Foreign real property identified \u2014 review succession law, probate, tax and whether a foreign Will or ancillary proceedings are appropriate.',
  },
  foreign_corporate_interest: {
    title: 'Something worth reviewing — foreign corporate interest',
    body:
      'You own an interest in a corporation connected to another country. ' +
      'Corporate ownership in a foreign jurisdiction can introduce additional estate and tax considerations. ' +
      'Consider having your corporate structure and estate plan reviewed.',
    professionalReviewSuggestion:
      'Foreign corporate interest identified \u2014 review corporate jurisdiction, share ownership, and cross-border estate/tax implications.',
  },
  cross_border_trust: {
    title: 'Something worth reviewing — cross-border trust',
    body:
      'A trust in your estate plan has a foreign-jurisdiction connection. ' +
      'Trust residency, taxation and succession rules can vary significantly across borders. ' +
      'Consider having the trust reviewed by a professional experienced in cross-border trust matters.',
    professionalReviewSuggestion:
      'Cross-border trust connection identified \u2014 review trust residency, governing law, and tax/estate implications.',
  },
  non_resident_executor: {
    title: 'Something worth reviewing — non-resident executor',
    body:
      'A proposed executor or estate trustee appears to reside outside Canada. ' +
      'Where an executor or trustee resides can be relevant to estate/trust administration and tax residency. ' +
      'Consider professional review.',
    professionalReviewSuggestion:
      'Non-resident executor identified \u2014 review residency implications for estate administration, trust residency and tax.',
  },
  foreign_custody_administrative_review: {
    title: 'Something worth reviewing — foreign custody / account location',
    body:
      'You hold Canadian investments through a financial institution outside Canada. ' +
      'While the investments themselves are Canadian, the foreign account location can create administrative and reporting considerations. ' +
      'Consider reviewing the account arrangement.',
    professionalReviewSuggestion:
      'Foreign custody identified for domestic issuer shares \u2014 review account reporting, tax compliance and administrative implications.',
  },
  other_foreign_connection: {
    title: 'Something worth reviewing — foreign connection',
    body:
      'Some of your assets or arrangements have a foreign-jurisdiction connection that may warrant cross-border estate review.',
    professionalReviewSuggestion:
      'Foreign connection identified \u2014 review for cross-border estate, tax and administration implications.',
  },
};

// ─── Selectors ─────────────────────────────────────────────────────────────────

function generateCandidateId(): string {
  return `cbrc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Employer Equity Selectors ────────────────────────────────────────────────

export type EquityBenefitForCrossBorder = {
  benefitId: string;
  clientId: string;
  employerName: string;
  employerCountryCode?: CountryCode;
  details: EquityBenefitDetails | undefined;
  footprintAssetId?: string;
  footprintAssetValue?: number;
};

export function selectEquityCrossBorderCandidates(
  benefits: EquityBenefitForCrossBorder[],
): CrossBorderReviewCandidate[] {
  const candidates: CrossBorderReviewCandidate[] = [];

  for (const benefit of benefits) {
    const details = benefit.details;
    if (!details) continue;

    const issuer = details.equityIssuer;
    if (!issuer) continue;

    const issuerCountry = issuer.issuerCountry ? employerCountryToCode(issuer.issuerCountry) : 'unknown';

    // Determine effective country: issuer if different from employer, else employer
    // Issuer jurisdiction is authoritative for share-issuer review
    const effectiveCountry =
      issuer.issuerSameAsEmployer === 'no' && issuerCountry !== 'unknown'
        ? issuerCountry
        : issuer.issuerSameAsEmployer === 'yes'
          ? benefit.employerCountryCode || 'unknown'
          : issuerCountry !== 'unknown'
            ? issuerCountry
            : benefit.employerCountryCode || 'unknown';

    // Use isForeignOrUnknown so that unknown issuer country still creates
    // a requires_confirmation candidate rather than being suppressed
    if (!isForeignOrUnknown(effectiveCountry)) continue;

    const ownership = details.ownershipStatus;
    const isOwned = ownership === 'currently_own' || ownership === 'both';
    const isUnknown = effectiveCountry === 'unknown';

    let reason: CrossBorderReason;
    if (isUnknown) {
      reason = 'issuer_jurisdiction_requires_confirmation';
    } else if (isOwned && isUS(effectiveCountry)) {
      reason = 'us_issuer_owned_shares';
    } else if (isOwned) {
      reason = 'foreign_issuer_owned_shares';
    } else {
      reason = 'foreign_employer_equity_requires_review';
    }

    const confidence: CrossBorderConfidence =
      isUnknown ? 'requires_confirmation' : 'confirmed_foreign_connection';

    const evidence: CrossBorderEvidence[] = [
      { field: 'employer', value: benefit.employerName, description: 'Employer name' },
    ];

    if (issuer.issuerSameAsEmployer === 'no' && issuer.issuerCompanyName) {
      evidence.push({ field: 'issuer', value: issuer.issuerCompanyName, description: 'Equity issuer company' });
    }

    evidence.push({
      field: 'issuerCountry',
      value: getCountryName(effectiveCountry, issuer.issuerOtherCountryName),
      description: 'Issuer country',
    });

    if (benefit.footprintAssetId) {
      evidence.push({ field: 'footprintAssetId', value: benefit.footprintAssetId, description: 'Financial Footprint asset ID' });
    }

    if (benefit.footprintAssetValue !== undefined) {
      evidence.push({ field: 'footprintAssetValue', value: String(benefit.footprintAssetValue), description: 'Owned share value' });
    }

    // Custody context — separate from issuer jurisdiction
    if (issuer.custodyContext && issuer.custodyContext !== 'unknown' && issuer.custodyContext !== 'employer_plan_administrator') {
      evidence.push({
        field: 'custodyContext',
        value: issuer.custodyContext,
        description: 'Where shares/account are held (custody)',
      });
    }

    const suggestedTypes = isUS(effectiveCountry)
      ? ['estate_lawyer', 'accountant']
      : ['estate_lawyer'];

    candidates.push({
      id: generateCandidateId(),
      clientId: benefit.clientId,
      sourceType: 'employer_equity',
      sourceId: benefit.benefitId,
      countryCode: effectiveCountry,
      countryName: getCountryName(effectiveCountry, issuer.issuerOtherCountryName),
      reason,
      confidence,
      evidence,
      suggestedProfessionalTypes: suggestedTypes,
      footprintAssetId: benefit.footprintAssetId,
      workplaceBenefitId: benefit.benefitId,
    });
  }

  return candidates;
}

// ─── Financial Footprint Foreign Share Selector ───────────────────────────────

export type FinancialAssetForCrossBorder = {
  assetId: string;
  clientId?: string;
  companyName?: string;
  approximateValue?: string;
  countryCode?: CountryCode;
  countryName?: string;
  custodyCountry?: CountryCode;
  linkedWorkplaceBenefitId?: string;
};

export function selectFinancialAssetCrossBorderCandidates(
  assets: FinancialAssetForCrossBorder[],
): CrossBorderReviewCandidate[] {
  const candidates: CrossBorderReviewCandidate[] = [];

  for (const asset of assets) {
    const issuerCode = asset.countryCode || 'unknown';
    const custodyCode = asset.custodyCountry;

    // Issuer-based candidate (foreign or unknown issuer)
    if (isForeignOrUnknown(issuerCode)) {
      const isUnknown = issuerCode === 'unknown';
      const confidence: CrossBorderConfidence =
        isUnknown ? 'requires_confirmation' : 'confirmed_foreign_connection';

      const reason: CrossBorderReason =
        isUnknown ? 'issuer_jurisdiction_requires_confirmation'
          : isUS(issuerCode) ? 'us_issuer_owned_shares'
          : 'foreign_issuer_owned_shares';

      const evidence: CrossBorderEvidence[] = [
        { field: 'assetId', value: asset.assetId, description: 'Financial Footprint asset ID' },
      ];

      if (asset.companyName) {
        evidence.push({ field: 'companyName', value: asset.companyName, description: 'Company / issuer name' });
      }

      evidence.push({
        field: 'country',
        value: getCountryName(issuerCode, asset.countryName),
        description: 'Issuer country',
      });

      if (asset.approximateValue) {
        evidence.push({ field: 'value', value: asset.approximateValue, description: 'Approximate value' });
      }

      if (asset.linkedWorkplaceBenefitId) {
        evidence.push({ field: 'workplaceBenefitId', value: asset.linkedWorkplaceBenefitId, description: 'Linked Workplace benefit ID' });
      }

      candidates.push({
        id: generateCandidateId(),
        clientId: asset.clientId,
        sourceType: 'financial_asset',
        sourceId: asset.assetId,
        countryCode: issuerCode,
        countryName: getCountryName(issuerCode, asset.countryName),
        reason,
        confidence,
        evidence,
        suggestedProfessionalTypes: isUS(issuerCode) ? ['estate_lawyer', 'accountant'] : ['estate_lawyer'],
        footprintAssetId: asset.assetId,
        workplaceBenefitId: asset.linkedWorkplaceBenefitId,
      });
    }

    // Separate custody-based candidate: domestic issuer, foreign custody
    if (issuerCode === 'CA' && custodyCode && isForeign(custodyCode)) {
      candidates.push({
        id: generateCandidateId(),
        clientId: asset.clientId,
        sourceType: 'custody',
        sourceId: asset.assetId,
        countryCode: custodyCode,
        countryName: getCountryName(custodyCode),
        reason: 'foreign_custody_administrative_review',
        confidence: 'confirmed_foreign_connection',
        evidence: [
          { field: 'assetId', value: asset.assetId, description: 'Financial Footprint asset ID' },
          { field: 'issuerCountry', value: 'Canada', description: 'Issuer country (domestic)' },
          { field: 'custodyCountry', value: getCountryName(custodyCode), description: 'Custody / account country (foreign)' },
        ],
        suggestedProfessionalTypes: ['accountant'],
        footprintAssetId: asset.assetId,
      });
    }
  }

  return candidates;
}

// ─── Real Estate Foreign Property Selector ────────────────────────────────────

export type RealEstateForCrossBorder = {
  propertyKey: string;
  clientId?: string;
  address: string;
  country: string;
  approximateValue?: string;
};

export function selectRealEstateCrossBorderCandidates(
  properties: RealEstateForCrossBorder[],
): CrossBorderReviewCandidate[] {
  const candidates: CrossBorderReviewCandidate[] = [];

  for (const prop of properties) {
    const code = normalizeCountry(prop.country);
    // Blank/unknown country does NOT create a candidate — incomplete address
    // data is not evidence of a foreign property. Only confirmed foreign
    // countries (US, GB, other) generate candidates.
    if (!isForeign(code)) continue;

    const confidence: CrossBorderConfidence = 'confirmed_foreign_connection';

    const evidence: CrossBorderEvidence[] = [
      { field: 'propertyKey', value: prop.propertyKey, description: 'Property reference' },
      { field: 'address', value: prop.address, description: 'Property address' },
      { field: 'country', value: prop.country, description: 'Country' },
    ];

    if (prop.approximateValue) {
      evidence.push({ field: 'value', value: prop.approximateValue, description: 'Approximate value' });
    }

    candidates.push({
      id: generateCandidateId(),
      clientId: prop.clientId,
      sourceType: 'real_estate',
      sourceId: prop.propertyKey,
      countryCode: code,
      countryName: prop.country,
      reason: 'foreign_real_property',
      confidence,
      evidence,
      suggestedProfessionalTypes: ['estate_lawyer', 'real_estate_lawyer'],
    });
  }

  return candidates;
}

// ─── Foreign Corporate Interest Selector ──────────────────────────────────────

export type CorporateInterestForCrossBorder = {
  entityId: string;
  clientId?: string;
  entityName: string;
  country: string;
};

export function selectCorporateCrossBorderCandidates(
  corps: CorporateInterestForCrossBorder[],
): CrossBorderReviewCandidate[] {
  const candidates: CrossBorderReviewCandidate[] = [];

  for (const corp of corps) {
    const code = normalizeCountry(corp.country);
    // Blank/unknown country does NOT create a candidate — no foreign indicator
    // means no cross-border concern. Only confirmed foreign countries generate
    // candidates. (If the client explicitly says the corp is foreign but country
    // is unknown, the adapter should set country to a non-blank indicator.)
    if (!isForeign(code)) continue;

    const confidence: CrossBorderConfidence = 'confirmed_foreign_connection';

    candidates.push({
      id: generateCandidateId(),
      clientId: corp.clientId,
      sourceType: 'corporation',
      sourceId: corp.entityId,
      countryCode: code,
      countryName: corp.country,
      reason: 'foreign_corporate_interest',
      confidence,
      evidence: [
        { field: 'entityId', value: corp.entityId, description: 'Entity ID' },
        { field: 'entityName', value: corp.entityName, description: 'Corporation name' },
        { field: 'country', value: corp.country, description: 'Country' },
      ],
      suggestedProfessionalTypes: ['estate_lawyer', 'accountant'],
    });
  }

  return candidates;
}

// ─── Foreign Trust Selector ───────────────────────────────────────────────────

export type TrustForCrossBorder = {
  trustId: string;
  clientId?: string;
  trustName: string;
  governingJurisdiction?: string;
  hasForeignProperty?: boolean;
  hasForeignTrustee?: boolean;
};

export function selectTrustCrossBorderCandidates(
  trusts: TrustForCrossBorder[],
): CrossBorderReviewCandidate[] {
  const candidates: CrossBorderReviewCandidate[] = [];

  for (const trust of trusts) {
    const jurisdiction = trust.governingJurisdiction;
    const hasForeign = trust.hasForeignProperty || trust.hasForeignTrustee;
    const code = jurisdiction ? normalizeCountry(jurisdiction) : 'unknown';

    const foreignByJurisdiction = isForeign(code);
    const foreignByFlag = hasForeign && !foreignByJurisdiction;

    if (!foreignByJurisdiction && !foreignByFlag) continue;

    const confidence: CrossBorderConfidence = 'confirmed_foreign_connection';

    const evidence: CrossBorderEvidence[] = [
      { field: 'trustId', value: trust.trustId, description: 'Trust ID' },
      { field: 'trustName', value: trust.trustName, description: 'Trust name' },
    ];

    if (jurisdiction) {
      evidence.push({ field: 'governingJurisdiction', value: jurisdiction, description: 'Governing jurisdiction' });
    }

    if (trust.hasForeignProperty) {
      evidence.push({ field: 'foreignProperty', value: 'yes', description: 'Trust holds foreign property' });
    }

    if (trust.hasForeignTrustee) {
      evidence.push({ field: 'foreignTrustee', value: 'yes', description: 'Trust has foreign trustee' });
    }

    candidates.push({
      id: generateCandidateId(),
      clientId: trust.clientId,
      sourceType: 'trust',
      sourceId: trust.trustId,
      countryCode: foreignByJurisdiction ? code : undefined,
      countryName: jurisdiction,
      reason: 'cross_border_trust',
      confidence,
      evidence,
      suggestedProfessionalTypes: ['estate_lawyer', 'accountant'],
    });
  }

  return candidates;
}

// ─── Non-Resident Executor Selector ───────────────────────────────────────────

export type ExecutorForCrossBorder = {
  personId: string;
  clientId?: string;
  executorName: string;
  country: string;
};

export function selectNonResidentExecutorCandidates(
  executors: ExecutorForCrossBorder[],
): CrossBorderReviewCandidate[] {
  const candidates: CrossBorderReviewCandidate[] = [];

  for (const executor of executors) {
    const code = normalizeCountry(executor.country);
    // Unknown residence is NOT evidence of non-residence. Only create a
    // non_resident_executor candidate where current data affirmatively
    // identifies residence outside Canada.
    if (!isForeign(code)) continue;

    const confidence: CrossBorderConfidence = 'confirmed_foreign_connection';

    candidates.push({
      id: generateCandidateId(),
      clientId: executor.clientId,
      sourceType: 'executor',
      sourceId: executor.personId,
      countryCode: code,
      countryName: executor.country,
      reason: 'non_resident_executor',
      confidence,
      evidence: [
        { field: 'personId', value: executor.personId, description: 'Person ID' },
        { field: 'executorName', value: executor.executorName, description: 'Executor name' },
        { field: 'country', value: executor.country, description: 'Country of residence' },
      ],
      suggestedProfessionalTypes: ['estate_lawyer'],
    });
  }

  return candidates;
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

export type AllCrossBorderSources = {
  equityBenefits?: EquityBenefitForCrossBorder[];
  financialAssets?: FinancialAssetForCrossBorder[];
  realEstate?: RealEstateForCrossBorder[];
  corporations?: CorporateInterestForCrossBorder[];
  trusts?: TrustForCrossBorder[];
  executors?: ExecutorForCrossBorder[];
};

export function selectAllCrossBorderCandidates(
  sources: AllCrossBorderSources,
): CrossBorderReviewCandidate[] {
  return [
    ...selectEquityCrossBorderCandidates(sources.equityBenefits || []),
    ...selectFinancialAssetCrossBorderCandidates(sources.financialAssets || []),
    ...selectRealEstateCrossBorderCandidates(sources.realEstate || []),
    ...selectCorporateCrossBorderCandidates(sources.corporations || []),
    ...selectTrustCrossBorderCandidates(sources.trusts || []),
    ...selectNonResidentExecutorCandidates(sources.executors || []),
  ];
}

// ─── Deduplication ────────────────────────────────────────────────────────────

export function deduplicateCrossBorderCandidates(
  candidates: CrossBorderReviewCandidate[],
): CrossBorderReviewCandidate[] {
  const seen = new Set<string>();
  const results: CrossBorderReviewCandidate[] = [];

  for (const c of candidates) {
    const key = `${c.sourceType}:${c.sourceId}:${c.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(c);
  }

  return results;
}

// ─── Story Consolidation / Grouping ───────────────────────────────────────────
//
// Multiple technical candidates may arise from the same underlying fact.
// Example: ABC Corp U.S. shares appear in both Financial Footprint and
// Workplace ESPP. The presentation layer should show ONE client story,
// not duplicate warnings. Stories group by country + asset/issuer relationship.

export type CrossBorderStoryTone = 'worth_reviewing' | 'planning_opportunity';

export type CrossBorderStory = {
  id: string;
  clientId?: string;
  primaryCountry: CountryCode;
  primaryCountryName: string;
  title: string;
  body: string;
  professionalReviewSuggestion: string;
  tone: CrossBorderStoryTone;
  sourceCandidateIds: string[];
  evidence: CrossBorderEvidence[];
  affectedAssets: string[];
  affectedEntities: string[];
  suggestedProfessionalTypes: string[];
  reasons: CrossBorderReason[];
};

function generateStoryId(): string {
  return `cbs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Group key: clientId + country + a normalized asset/issuer identifier
// when available (footprintAssetId or company/entity name), so candidates
// for the same underlying fact consolidate into one story.
function getStoryGroupKey(c: CrossBorderReviewCandidate): string {
  const country = c.countryCode || 'unknown';
  // If multiple candidates share the same footprint asset, group them
  if (c.footprintAssetId) {
    return `${c.clientId || 'shared'}:${country}:${c.footprintAssetId}`;
  }
  // Otherwise group by source + sourceId (each gets its own story)
  return `${c.clientId || 'shared'}:${country}:${c.sourceType}:${c.sourceId}`;
}

// Map a reason to a story-level title/template
function getStoryTemplate(
  reasons: CrossBorderReason[],
): CrossBorderClientTemplate {
  // Pick the strongest reason
  if (reasons.includes('us_issuer_owned_shares')) return CROSS_BORDER_TEMPLATES.us_issuer_owned_shares;
  if (reasons.includes('foreign_issuer_owned_shares')) return CROSS_BORDER_TEMPLATES.foreign_issuer_owned_shares;
  if (reasons.includes('foreign_employer_equity_requires_review')) return CROSS_BORDER_TEMPLATES.foreign_employer_equity_requires_review;
  if (reasons.includes('issuer_jurisdiction_requires_confirmation')) return CROSS_BORDER_TEMPLATES.issuer_jurisdiction_requires_confirmation;
  if (reasons.includes('foreign_real_property')) return CROSS_BORDER_TEMPLATES.foreign_real_property;
  if (reasons.includes('foreign_corporate_interest')) return CROSS_BORDER_TEMPLATES.foreign_corporate_interest;
  if (reasons.includes('cross_border_trust')) return CROSS_BORDER_TEMPLATES.cross_border_trust;
  if (reasons.includes('non_resident_executor')) return CROSS_BORDER_TEMPLATES.non_resident_executor;
  if (reasons.includes('foreign_custody_administrative_review')) return CROSS_BORDER_TEMPLATES.foreign_custody_administrative_review;
  return CROSS_BORDER_TEMPLATES.other_foreign_connection;
}

export function buildCrossBorderStories(
  candidates: CrossBorderReviewCandidate[],
): CrossBorderStory[] {
  // Phase 1: group by consolidation key (same underlying asset/fact)
  const groups = new Map<string, CrossBorderReviewCandidate[]>();

  for (const c of candidates) {
    const key = getStoryGroupKey(c);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  // Phase 2: further consolidate by clientId + country when the country is
  // the same and the reasons are equity/share-related, to avoid separate
  // "U.S. investments" stories for Apple shares + ABC employer shares + ABC RSUs
  // that should all be one "U.S. investments and employer equity" story.
  const byClientCountry = new Map<string, CrossBorderReviewCandidate[]>();

  for (const [, groupCandidates] of groups) {
    const first = groupCandidates[0];
    const country = first.countryCode || 'unknown';
    const clientKey = `${first.clientId || 'shared'}:${country}`;

    // Equity + financial_asset reasons for the same country consolidate
    const equityReasons: CrossBorderReason[] = [
      'us_issuer_owned_shares',
      'foreign_issuer_owned_shares',
      'foreign_employer_equity_requires_review',
      'issuer_jurisdiction_requires_confirmation',
    ];

    if (equityReasons.includes(first.reason)) {
      if (!byClientCountry.has(clientKey)) byClientCountry.set(clientKey, []);
      byClientCountry.get(clientKey)!.push(...groupCandidates);
    } else {
      // Non-equity reasons get their own story per group
      if (!byClientCountry.has(clientKey)) byClientCountry.set(clientKey, []);
      byClientCountry.get(clientKey)!.push(...groupCandidates);
    }
  }

  // Phase 3: build stories from consolidated groups
  const stories: CrossBorderStory[] = [];

  for (const [, groupCandidates] of byClientCountry) {
    if (groupCandidates.length === 0) continue;

    const first = groupCandidates[0];
    const country = first.countryCode || 'unknown';
    const allReasons = [...new Set(groupCandidates.map((c) => c.reason))];
    const template = getStoryTemplate(allReasons);

    // Merge evidence, assets, entities
    const allEvidence: CrossBorderEvidence[] = [];
    const allAssets = new Set<string>();
    const allEntities = new Set<string>();
    const allProfTypes = new Set<string>();
    const allCandidateIds: string[] = [];

    for (const c of groupCandidates) {
      allCandidateIds.push(c.id);
      allEvidence.push(...c.evidence);
      if (c.footprintAssetId) allAssets.add(c.footprintAssetId);
      if (c.workplaceBenefitId) allEntities.add(c.workplaceBenefitId);
      allEntities.add(c.sourceId);
      if (c.suggestedProfessionalTypes) {
        for (const pt of c.suggestedProfessionalTypes) allProfTypes.add(pt);
      }
    }

    // Merge multiple equity story titles into a combined title when appropriate
    let title = template.title;
    if (allReasons.length > 1 && allReasons.every((r) =>
      r === 'us_issuer_owned_shares' || r === 'foreign_employer_equity_requires_review' || r === 'foreign_issuer_owned_shares'
    )) {
      if (country === 'US') {
        title = 'Something worth reviewing — U.S. investments and employer equity';
      } else {
        title = 'Something worth reviewing — foreign investments and employer equity';
      }
    }

    stories.push({
      id: generateStoryId(),
      clientId: first.clientId,
      primaryCountry: country,
      primaryCountryName: getCountryName(country, first.countryName),
      title,
      body: template.body,
      professionalReviewSuggestion: template.professionalReviewSuggestion,
      tone: 'worth_reviewing',
      sourceCandidateIds: allCandidateIds,
      evidence: allEvidence,
      affectedAssets: [...allAssets],
      affectedEntities: [...allEntities],
      suggestedProfessionalTypes: [...allProfTypes],
      reasons: allReasons,
    });
  }

  // Phase 4: if multiple stories for different countries exist for the same
  // client, they remain separate (different countries = genuinely different
  // legal/tax contexts). But if there are 3+ country stories, add a
  // consolidated "cross-border estate planning" umbrella story.
  const storiesByClient = new Map<string, CrossBorderStory[]>();
  for (const s of stories) {
    const key = s.clientId || 'shared';
    if (!storiesByClient.has(key)) storiesByClient.set(key, []);
    storiesByClient.get(key)!.push(s);
  }

  const finalStories: CrossBorderStory[] = [...stories];

  for (const [, clientStories] of storiesByClient) {
    if (clientStories.length >= 3) {
      const allEvidence = clientStories.flatMap((s) => s.evidence);
      const allAssets = clientStories.flatMap((s) => s.affectedAssets);
      const allEntities = clientStories.flatMap((s) => s.affectedEntities);
      const allProfTypes = new Set(clientStories.flatMap((s) => s.suggestedProfessionalTypes));

      finalStories.push({
        id: generateStoryId(),
        clientId: clientStories[0].clientId,
        primaryCountry: 'other',
        primaryCountryName: 'Multiple countries',
        title: 'Something worth reviewing — cross-border estate planning',
        body:
          'You own property, investments or workplace benefits connected to more than one country outside Canada. ' +
          'That does not necessarily mean there is a problem, but estate administration, tax and succession rules ' +
          'can differ across jurisdictions. Consider having these items reviewed as part of your estate plan ' +
          'by a professional with appropriate cross-border experience.',
        professionalReviewSuggestion:
          'Multiple foreign jurisdictions identified \u2014 comprehensive cross-border estate, tax and succession review recommended.',
        tone: 'worth_reviewing',
        sourceCandidateIds: clientStories.flatMap((s) => s.sourceCandidateIds),
        evidence: allEvidence,
        affectedAssets: allAssets,
        affectedEntities: allEntities,
        suggestedProfessionalTypes: [...allProfTypes],
        reasons: ['other_foreign_connection'],
      });
    }
  }

  return finalStories;
}

// ─── Convenience: Build equity benefits for cross-border from Workplace data ───

export function buildEquityBenefitsForCrossBorder(
  clientId: string,
  clientData: WorkplaceClientData,
): EquityBenefitForCrossBorder[] {
  const benefits = clientData.benefits || [];
  const employers = clientData.employers || [];

  return benefits
    .filter((b) => b.family === 'employerEquity' || b.family === 'executiveDeferred')
    .map((b) => {
      const employer = employers.find((e) => e.id === b.employerId);
      return {
        benefitId: b.id,
        clientId,
        employerName: b.employerName,
        employerCountryCode: employer?.countryCode as CountryCode | undefined,
        details: b.equityBenefitDetails,
        footprintAssetId: b.footprintAccountId,
      };
    });
}
