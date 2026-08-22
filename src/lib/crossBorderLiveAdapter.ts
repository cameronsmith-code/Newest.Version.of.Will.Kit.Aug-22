// ─── Cross-Border Live-Data Adapter ───────────────────────────────────────────
//
// Converts current questionnaire state into the existing Cross-Border engine's
// AllCrossBorderSources structure. This is the authoritative bridge between
// the live app and selectAllCrossBorderCandidates() / buildCrossBorderStories().
//
// No tax/legal conclusions. No new client-facing questions.
//
// CANONICAL ID POLICY:
//   Real Estate:   propertiesData[].propertyEntityId  (stable EntityRegistry ID)
//   Corporations:  EntityEntry.id resolved via name match against EntityRegistry
//   Trusts:        familyTrustsData[].id  (canonical) — legacy fields migration-only
//   Executors:     PersonRef.personId  — no role-derived IDs for fresh data

import type { QuestionnaireAnswers } from './steps';
import type { EquityCompensation } from './financialAssetTypes';
import type { FamilyTrust } from './familyTrustTypes';
import type { WorkplaceClientData } from './workplacePensionsTypes';
import type {
  AllCrossBorderSources,
  EquityBenefitForCrossBorder,
  FinancialAssetForCrossBorder,
  RealEstateForCrossBorder,
  CorporateInterestForCrossBorder,
  TrustForCrossBorder,
  ExecutorForCrossBorder,
  CountryCode,
} from './crossBorderTypes';
import { normalizeCountry, isForeign, employerCountryToCode } from './crossBorderTypes';

// ─── Context types (minimal shapes, no hard dependency on context modules) ────

export type EntityEntryLike = {
  id: string;
  entityType: string;
  displayName: string;
  sourceSection?: string;
  sourceEntityRef?: string;
  metadata?: Record<string, unknown>;
  active: boolean;
};

export type PersonEntryLike = {
  id: string;
  displayName: string;
  country: string;
  active: boolean;
};

export type CrossBorderLiveContext = {
  peopleData?: PersonEntryLike[];
  entities?: EntityEntryLike[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSection(
  answers: QuestionnaireAnswers,
  sectionId: string,
): Record<string, unknown> {
  return (answers as Record<string, Record<string, unknown>>)[sectionId] || {};
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  return '';
}

// ─── Financial Footprint Live Mapping ─────────────────────────────────────────
//
// Reads equityCompensationData from the financialFootprint section.
// Maps each EquityCompensation with a foreign or unknown issuer country.
// Issuer country may come from the asset itself (if populated in future)
// or from a linked Employer Equity record's issuer country.

export function mapFinancialFootprintForCrossBorder(
  answers: QuestionnaireAnswers,
  workplaceData?: { client1?: WorkplaceClientData; client2?: WorkplaceClientData },
): FinancialAssetForCrossBorder[] {
  const footprint = getSection(answers, 'financialFootprint');
  const equityAssets = asArray<EquityCompensation>(footprint['equityCompensationData']);

  // Build a map from footprint asset ID → issuer country (from linked workplace equity)
  const footprintIdToIssuerCountry = new Map<string, CountryCode>();
  const footprintIdToWorkplaceBenefitId = new Map<string, string>();

  if (workplaceData) {
    for (const wd of [workplaceData.client1, workplaceData.client2]) {
      if (!wd) continue;
      for (const b of wd.benefits || []) {
        if (b.footprintAccountId && b.equityBenefitDetails?.equityIssuer) {
          const issuer = b.equityBenefitDetails.equityIssuer;
          const country = issuer.issuerCountry ? employerCountryToCode(issuer.issuerCountry) : 'unknown';
          footprintIdToIssuerCountry.set(b.footprintAccountId, country);
          footprintIdToWorkplaceBenefitId.set(b.footprintAccountId, b.id);
        }
      }
    }
  }

  const result: FinancialAssetForCrossBorder[] = [];

  for (const asset of equityAssets) {
    if (!asset.id) continue;

    // Try issuer country from linked workplace equity, else unknown
    const issuerCountry = footprintIdToIssuerCountry.get(asset.id) || 'unknown';

    // Determine custody country from sharesHeldWhere if available
    let custodyCountry: CountryCode | undefined;
    if (asset.sharesHeldWhere) {
      const heldWhere = asset.sharesHeldWhere.toLowerCase();
      if (heldWhere.includes('canad') || heldWhere.includes('rbc') || heldWhere.includes('td ') || heldWhere.includes('bmo') || heldWhere.includes('scotia') || heldWhere.includes('cibc')) {
        custodyCountry = 'CA';
      } else if (heldWhere.includes('us ') || heldWhere.includes('u.s.') || heldWhere.includes('united states') || heldWhere.includes('american')) {
        custodyCountry = 'US';
      }
    }

    result.push({
      assetId: asset.id,
      clientId: asset.ownerIds?.[0],
      companyName: asset.companyName,
      approximateValue: asset.approximateValue,
      countryCode: issuerCountry,
      countryName: asset.companyName, // display name fallback
      custodyCountry,
      linkedWorkplaceBenefitId: footprintIdToWorkplaceBenefitId.get(asset.id),
    });
  }

  return result;
}

// ─── Employer Equity Live Mapping ─────────────────────────────────────────────

export function mapEmployerEquityForCrossBorder(
  clientId: string,
  clientData: WorkplaceClientData | undefined,
): EquityBenefitForCrossBorder[] {
  if (!clientData) return [];

  const benefits = clientData.benefits || [];
  const employers = clientData.employers || [];

  return benefits
    .filter((b) => (b.family === 'employerEquity' || b.family === 'executiveDeferred'))
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

// ─── Real Estate Live Mapping ─────────────────────────────────────────────────
//
// CANONICAL SOURCE: propertiesData[] array in the realEstate section.
// Each property record has a `propertyEntityId` field — this is the stable
// canonical ID that links to the EntityRegistry. It does NOT change when
// properties are reordered.
//
// Legacy flat fields (property1Country, property2Country, etc.) are used
// ONLY as a migration fallback when propertiesData[] does not exist.

export function mapRealEstateForCrossBorder(
  answers: QuestionnaireAnswers,
): RealEstateForCrossBorder[] {
  const realEstate = getSection(answers, 'realEstate');
  const hasRealEstate = asString(realEstate['hasRealEstate']);

  if (hasRealEstate !== 'yes') return [];

  // ── Canonical path: propertiesData[] with propertyEntityId ──
  const propertiesData = asArray<Record<string, unknown>>(realEstate['propertiesData']);

  if (propertiesData.length > 0) {
    const result: RealEstateForCrossBorder[] = [];

    for (const prop of propertiesData) {
      const propertyEntityId = asString(prop['propertyEntityId']);
      const name = asString(prop['name']);
      const country = asString(prop['country']);
      const city = asString(prop['city']);
      const province = asString(prop['province']);
      const streetAddress = asString(prop['streetAddress']);

      // Skip properties with no entity ID and no name — incomplete/stale
      if (!propertyEntityId && !name) continue;

      // Build display address
      const addressParts = [name, streetAddress, city, province, country].filter(Boolean);
      const address = addressParts.join(', ') || name || propertyEntityId;

      // Use canonical propertyEntityId as the source ID
      result.push({
        propertyKey: propertyEntityId || `legacy_prop_${result.length + 1}`,
        clientId: undefined,
        address,
        country: country || '',
        approximateValue: asString(prop['purchasePrice']),
      });
    }

    return result;
  }

  // ── Legacy migration fallback: flat property${n}Country fields ──
  // Only used when old questionnaire data has no propertiesData[] array.
  const count = parseInt(asString(realEstate['propertyCount']) || '0', 10);
  const result: RealEstateForCrossBorder[] = [];

  for (let n = 1; n <= count; n++) {
    const country = asString(realEstate[`property${n}Country`]);
    const name = asString(realEstate[`property${n}Name`]);
    const municipality = asString(realEstate[`property${n}Municipality`]);
    const province = asString(realEstate[`property${n}Province`]);

    if (!country && !name) continue;

    const addressParts = [name, municipality, province, country].filter(Boolean);
    const address = addressParts.join(', ') || `Property ${n}`;

    result.push({
      propertyKey: `legacy_prop_${n}`,
      clientId: undefined,
      address,
      country: country || '',
      approximateValue: asString(realEstate[`property${n}Value`]),
    });
  }

  return result;
}

// ─── Corporation Live Mapping ─────────────────────────────────────────────────
//
// CANONICAL SOURCE: EntityRegistry entities of type 'corporation'.
// corporationsData[] has no stable ID field — the canonical ID is the
// EntityEntry.id from the EntityRegistry, resolved by matching the
// corporation's legalName against entity.displayName.
//
// Country/jurisdiction is read from the EntityEntry.metadata bag (where
// CorporationRegistrySection stores it) or from the corporation data record.
//
// Only active entities are included. Deleted/inactive entities are filtered
// by the `active` flag on EntityEntry.

export function mapCorporationsForCrossBorder(
  answers: QuestionnaireAnswers,
  entities?: EntityEntryLike[],
): CorporateInterestForCrossBorder[] {
  const corps = getSection(answers, 'corporations');
  const corpsData = asArray<Record<string, unknown>>(corps['corporationsData']);

  // Build a name → entity lookup from the EntityRegistry
  const corpEntityByName = new Map<string, EntityEntryLike>();
  if (entities) {
    for (const e of entities) {
      if (!e.active) continue;
      if (e.entityType === 'corporation') {
        corpEntityByName.set(e.displayName.toLowerCase(), e);
      }
    }
  }

  const result: CorporateInterestForCrossBorder[] = [];

  for (const c of corpsData) {
    const legalName = asString(c['legalName']);
    if (!legalName) continue;

    // Resolve canonical entity ID from the EntityRegistry
    const entity = corpEntityByName.get(legalName.toLowerCase());
    const canonicalId = entity?.id;

    // Country may be on the corporation data record or in entity metadata
    const country = asString(c['country'])
      || asString(c['jurisdiction'])
      || asString(c['countryOfIncorporation'])
      || asString(entity?.metadata?.['jurisdiction'])
      || asString(entity?.metadata?.['country']);

    // Use canonical entity ID when available; legacy fallback marked explicitly
    result.push({
      entityId: canonicalId || `legacy_corp_${result.length + 1}`,
      clientId: undefined,
      entityName: legalName,
      country: country || '',
    });
  }

  return result;
}

// ─── Trust Live Mapping ───────────────────────────────────────────────────────
//
// CANONICAL SOURCE: familyTrustsData[] in the familyTrusts section.
// Each FamilyTrust has a stable `id` (generated by generateTrustId()) and
// optionally an `entityId` linking to the EntityRegistry.
//
// Legacy flat fields (trustLegalName, trust2LegalName, etc.) are used ONLY
// as a migration fallback when no familyTrustsData[] exists. If canonical
// trust data exists, legacy entries with the same name are suppressed to
// prevent duplicate candidates.
//
// Foreign connection is derived from:
// - trustee entries linked to PersonEntry with non-Canada country (via personId)
// - asset holdings that reference a property with non-Canada country
// - any explicit jurisdiction field on the trust data
//
// No trust residency conclusion is made.

export function mapTrustsForCrossBorder(
  answers: QuestionnaireAnswers,
  peopleCountryById?: Map<string, string>,
): TrustForCrossBorder[] {
  const trustSection = getSection(answers, 'familyTrusts');
  const trustsData = asArray<FamilyTrust>(trustSection['familyTrustsData']);

  const result: TrustForCrossBorder[] = [];

  // ── Canonical path: familyTrustsData[] ──
  for (const trust of trustsData) {
    if (!trust.id) continue;

    // Check trustees for foreign country
    let hasForeignTrustee = false;
    for (const trustee of trust.trustees || []) {
      if (trustee.personId && peopleCountryById) {
        const country = peopleCountryById.get(trustee.personId);
        if (country && isForeign(normalizeCountry(country))) {
          hasForeignTrustee = true;
          break;
        }
      }
    }

    // Check asset holdings for foreign real estate
    let hasForeignProperty = false;
    const realEstate = getSection(answers, 'realEstate');
    const propertiesData = asArray<Record<string, unknown>>(realEstate['propertiesData']);

    for (const holding of trust.assetHoldings || []) {
      if (holding.assetType === 'real_estate') {
        // Try canonical propertiesData first — match by propertyEntityId
        if (propertiesData.length > 0 && holding.propertyId) {
          const prop = propertiesData.find(
            (p) => asString(p['propertyEntityId']) === holding.propertyId,
          );
          if (prop) {
            const country = asString(prop['country']);
            if (country && isForeign(normalizeCountry(country))) {
              hasForeignProperty = true;
              break;
            }
          }
        } else {
          // Legacy fallback: flat property${n}Country
          const propNum = parseInt(holding.propertyId?.replace(/^prop_/, '') || '', 10);
          if (propNum) {
            const country = asString(realEstate[`property${propNum}Country`]);
            if (country && isForeign(normalizeCountry(country))) {
              hasForeignProperty = true;
              break;
            }
          }
        }
      }
    }

    // Check for explicit jurisdiction in trust (not a standard field yet)
    const governingJurisdiction = asString((trust as unknown as Record<string, unknown>)['governingJurisdiction']);

    result.push({
      trustId: trust.id,
      clientId: undefined,
      trustName: trust.legalName || `Trust ${trust.id}`,
      governingJurisdiction: governingJurisdiction || undefined,
      hasForeignProperty,
      hasForeignTrustee,
    });
  }

  // ── Legacy migration fallback: flat trust name fields ──
  // Only used when no canonical familyTrustsData[] exists.
  // If canonical trusts exist, suppress legacy entries with the same name
  // to prevent duplicate candidates.
  if (trustsData.length === 0) {
    for (let t = 1; t <= 4; t++) {
      const trustKey = t === 1 ? 'trustLegalName' : `trust${t}LegalName`;
      const name = asString(trustSection[trustKey]);
      if (name) {
        result.push({
          trustId: `legacy_trust_${t}`,
          trustName: name,
        });
      }
    }
  }

  return result;
}

// ─── Executor / Estate Trustee Live Mapping ───────────────────────────────────
//
// Reads flat estateTrustees section fields.
// Executor country is captured via:
// - client{n}EstateTrusteeCountry (free text)
// - client{n}EstateTrusteeIsCanadaResident ('yes' means Canada)
// Also checks alternate executors.
//
// CANONICAL PERSON ID: The 'person' type question stores a PersonRef with
// a `personId` field. This is the canonical People Repository ID.
//
// For fresh data: if no PersonRef.personId is found, the record is excluded
// from cross-border evaluation rather than attaching to an invented ID.
// Legacy fallback (role-derived ID) is used ONLY for old unresolved data
// and is explicitly labeled as legacy.

import type { PersonRef } from './personRepositoryTypes';

function extractExecutor(
  answers: QuestionnaireAnswers,
  clientId: 'client1' | 'client2',
  prefix: string,
  isAlternate: boolean,
): ExecutorForCrossBorder | null {
  const section = getSection(answers, 'estateTrustees');

  const hasKey = `${clientId}HasEstateTrustee`;
  const hasAlternateKey = `${clientId}HasAlternateEstateTrustee`;

  if (isAlternate) {
    if (asString(section[hasAlternateKey]) !== 'yes') return null;
  } else {
    if (asString(section[hasKey]) !== 'yes') return null;
  }

  // Name field should be a PersonRef for fresh data
  const nameRaw = section[`${prefix}Name`];
  let personId = '';
  let executorName = '';

  if (nameRaw && typeof nameRaw === 'object' && 'personId' in nameRaw) {
    const ref = nameRaw as PersonRef;
    personId = ref.personId;
    executorName = ref.displayName;
  } else {
    // Legacy unresolved data: plain string name, no canonical Person ID
    executorName = asString(nameRaw);
    // For fresh data, exclude rather than manufacturing a role-derived ID
    // Only proceed if there's a name (legacy fallback)
    if (!executorName) return null;
    // Mark as legacy — no canonical person ID
    personId = '';
  }

  if (!executorName) return null;

  // For fresh data without a canonical Person ID, exclude from evaluation
  // rather than attaching a candidate to an invented person
  if (!personId) return null;

  // Country determination
  const isCanadaResident = asString(section[`${prefix}IsCanadaResident`]);
  const countryField = asString(section[`${prefix}Country`]);

  let country = '';
  if (isCanadaResident === 'yes') {
    country = 'Canada';
  } else if (countryField) {
    country = countryField;
  } else if (isCanadaResident === 'no') {
    // Said not Canada resident but no country specified — unknown foreign
    country = '';
  } else {
    // No residency info — country unknown
    country = '';
  }

  return {
    personId,
    clientId,
    executorName,
    country,
  };
}

export function mapExecutorsForCrossBorder(
  answers: QuestionnaireAnswers,
): ExecutorForCrossBorder[] {
  const result: ExecutorForCrossBorder[] = [];

  // Client 1 primary executor
  const c1Primary = extractExecutor(answers, 'client1', 'client1EstateTrustee', false);
  if (c1Primary) result.push(c1Primary);

  // Client 1 alternate executor
  const c1Alt = extractExecutor(answers, 'client1', 'client1AlternateEstateTrustee1', true);
  if (c1Alt) result.push(c1Alt);

  // Client 2 primary executor
  const c2Primary = extractExecutor(answers, 'client2', 'client2EstateTrustee', false);
  if (c2Primary) result.push(c2Primary);

  // Client 2 alternate executor
  const c2Alt = extractExecutor(answers, 'client2', 'client2AlternateEstateTrustee1', true);
  if (c2Alt) result.push(c2Alt);

  return result;
}

// ─── Workplace Data Extraction ────────────────────────────────────────────────

function extractWorkplaceData(
  answers: QuestionnaireAnswers,
): { client1?: WorkplaceClientData; client2?: WorkplaceClientData } {
  const wpSection = getSection(answers, 'workplacePensionsBenefits');
  return {
    client1: wpSection['client1Data'] as WorkplaceClientData | undefined,
    client2: wpSection['client2Data'] as WorkplaceClientData | undefined,
  };
}

// ─── People Country Map Builder ───────────────────────────────────────────────
//
// Builds a Map<personId, country> from the People Repository data.
// This is used to resolve trustee countries for trust cross-border mapping.

export function buildPeopleCountryMap(
  peopleData: Array<{ id: string; country?: string; active?: boolean }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of peopleData) {
    if (p.active === false) continue;
    if (p.country) map.set(p.id, p.country);
  }
  return map;
}

// ─── Master Adapter ───────────────────────────────────────────────────────────
//
// This is the single entry point that converts questionnaire state into
// AllCrossBorderSources. All future cross-border outputs should call this
// rather than reconstructing cross-border facts independently.

export function buildCrossBorderSourcesFromQuestionnaire(
  answers: QuestionnaireAnswers,
  context?: CrossBorderLiveContext,
): AllCrossBorderSources {
  const workplaceData = extractWorkplaceData(answers);
  const peopleCountryMap = context?.peopleData
    ? buildPeopleCountryMap(context.peopleData)
    : undefined;

  const equityBenefits = [
    ...mapEmployerEquityForCrossBorder('client1', workplaceData.client1),
    ...mapEmployerEquityForCrossBorder('client2', workplaceData.client2),
  ];

  const financialAssets = mapFinancialFootprintForCrossBorder(answers, workplaceData);

  const realEstate = mapRealEstateForCrossBorder(answers);

  const corporations = mapCorporationsForCrossBorder(answers, context?.entities);

  const trusts = mapTrustsForCrossBorder(answers, peopleCountryMap);

  const executors = mapExecutorsForCrossBorder(answers);

  return {
    equityBenefits,
    financialAssets,
    realEstate,
    corporations,
    trusts,
    executors,
  };
}

// ─── Convenience: Full live evaluation ────────────────────────────────────────

import {
  selectAllCrossBorderCandidates,
  deduplicateCrossBorderCandidates,
  buildCrossBorderStories,
} from './crossBorderTypes';

export type LiveCrossBorderResult = {
  sources: AllCrossBorderSources;
  candidates: ReturnType<typeof selectAllCrossBorderCandidates>;
  deduplicatedCandidates: ReturnType<typeof deduplicateCrossBorderCandidates>;
  stories: ReturnType<typeof buildCrossBorderStories>;
};

export function evaluateLiveCrossBorder(
  answers: QuestionnaireAnswers,
  context?: CrossBorderLiveContext,
): LiveCrossBorderResult {
  const sources = buildCrossBorderSourcesFromQuestionnaire(answers, context);
  const candidates = selectAllCrossBorderCandidates(sources);
  const deduplicatedCandidates = deduplicateCrossBorderCandidates(candidates);
  const stories = buildCrossBorderStories(deduplicatedCandidates);

  return {
    sources,
    candidates,
    deduplicatedCandidates,
    stories,
  };
}
