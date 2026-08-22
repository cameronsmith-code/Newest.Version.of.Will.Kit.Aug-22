import type { AnyFinancialAsset, ContactInfo } from './financialAssetTypes';
import { getExcludedPersonIdsForScenario, getFirstDeathDeceasedClientId, type LegacyScenario } from './legacyIntentTypes';
import { getClientNames, getClientOwnedCorpNames, getCorporationsData } from './corporateOwnership';
import { resolvePersonNameField } from './personRepositoryTypes';

export type ProfessionalAdvisor = {
  id: string;
  name: string;
  firm: string;
  phone: string;
  email: string;
  website: string;
  worksWith: string[];
  services: string[];
  type: 'financial' | 'accountant' | 'lawyer' | 'insurance';
  active: boolean;
  city?: string;
  province?: string;
  country?: string;
  source?: string;
  corpName?: string;
  title?: string;
};

export type Person = {
  id: string;
  name: string;
  relationship: string;
};

export type Institution = {
  id: string;
  name: string;
};

export type AnswersMap = Map<string, Record<string, unknown>>;

let idCounter = 0;

function generateStableId(): string {
  idCounter += 1;
  return `adv_${Date.now().toString(36)}_${idCounter}_${Math.random().toString(36).substr(2, 6)}`;
}

function ensureAdvisorId(
  profTeam: Record<string, unknown>,
  key: string
): string {
  const existing = profTeam[key] as string | undefined;
  if (existing) return existing;
  const newId = generateStableId();
  return newId;
}

type AdditionalAdvisorRecord = {
  id?: string;
  name?: string;
  firm?: string;
  phone?: string;
  email?: string;
  website?: string;
  worksWith?: string[];
  services?: string[];
  isCameronSmith?: boolean;
  duration?: string;
  recordsLocation?: string;
  includeInContactList?: string;
  hasAdditional?: string;
};

function advisorFromFields(
  id: string,
  name: string,
  firm: string,
  phone: string,
  email: string,
  website: string,
  worksWith: string[],
  services: string[]
): ProfessionalAdvisor {
  return {
    id,
    name: name || '',
    firm: firm || '',
    phone: phone || '',
    email: email || '',
    website: website || '',
    worksWith,
    services,
    type: 'financial',
    active: true,
  };
}

export function getProfessionalAdvisors(allAnswers: AnswersMap): ProfessionalAdvisor[] {
  const profTeam = allAnswers.get('professionalTeam') || {};
  const advisors: ProfessionalAdvisor[] = [];

  if (profTeam['fpHasAdvisor'] === 'yes') {
    const id = ensureAdvisorId(profTeam, 'fpAdvisor1Id');
    advisors.push(
      advisorFromFields(
        id,
        resolvePersonNameField(profTeam['fpAdvisor1Name']),
        (profTeam['fpAdvisor1Firm'] as string) || '',
        (profTeam['fpAdvisor1Phone'] as string) || '',
        (profTeam['fpAdvisor1Email'] as string) || '',
        (profTeam['fpAdvisor1Website'] as string) || '',
        (profTeam['fpAdvisor1WorksWith'] as string[]) || [],
        (profTeam['fpAdvisor1Services'] as string[]) || []
      )
    );
  }

  if (profTeam['fpHasAdditionalAdvisor'] === 'yes') {
    const id = ensureAdvisorId(profTeam, 'fpAdvisor2Id');
    advisors.push(
      advisorFromFields(
        id,
        resolvePersonNameField(profTeam['fpAdvisor2Name']),
        (profTeam['fpAdvisor2Firm'] as string) || '',
        (profTeam['fpAdvisor2Phone'] as string) || '',
        (profTeam['fpAdvisor2Email'] as string) || '',
        (profTeam['fpAdvisor2Website'] as string) || '',
        (profTeam['fpAdvisor2WorksWith'] as string[]) || [],
        (profTeam['fpAdvisor2Services'] as string[]) || []
      )
    );
  }

  const additionalData = profTeam['fpAdditionalAdvisorsData'] as AdditionalAdvisorRecord[] | undefined;
  if (Array.isArray(additionalData)) {
    for (const record of additionalData) {
      if (!record.name && !record.firm && !record.isCameronSmith) continue;
      const id = record.id || generateStableId();
      advisors.push(
        advisorFromFields(
          id,
          record.name || (record.isCameronSmith ? 'Cameron Smith' : ''),
          record.firm || (record.isCameronSmith ? 'Clarify Wealth Ltd.' : ''),
          record.phone || (record.isCameronSmith ? '647-448-5963' : ''),
          record.email || (record.isCameronSmith ? 'cameron.smith@ipcsecurities.com' : ''),
          record.website || (record.isCameronSmith ? 'www.clarifywealth.ca' : ''),
          record.worksWith || [],
          record.services || []
        )
      );
    }
  }

  if (profTeam['acctHasAccountant'] === 'yes') {
    advisors.push({
      id: 'acct_0',
      name: resolvePersonNameField(profTeam['acctAdvisor1Name']),
      firm: (profTeam['acctAdvisor1Firm'] as string) || '',
      phone: (profTeam['acctAdvisor1Phone'] as string) || '',
      email: (profTeam['acctAdvisor1Email'] as string) || '',
      website: '',
      worksWith: (profTeam['acctAdvisor1WorksWith'] as string[]) || [],
      services: (profTeam['acctAdvisor1Services'] as string[]) || [],
      type: 'accountant',
      active: true,
    });
  }

  if (profTeam['lawHasLawyer'] === 'yes') {
    const id = ensureAdvisorId(profTeam, 'lawAdvisor1Id');
    advisors.push({
      id,
      name: resolvePersonNameField(profTeam['lawAdvisor1Name']),
      firm: (profTeam['lawAdvisor1Firm'] as string) || '',
      phone: (profTeam['lawAdvisor1Phone'] as string) || '',
      email: (profTeam['lawAdvisor1Email'] as string) || '',
      website: '',
      worksWith: (profTeam['lawAdvisor1WorksWith'] as string[]) || [],
      services: (profTeam['lawAdvisor1Services'] as string[]) || [],
      type: 'lawyer',
      active: true,
    });
  }

  if (profTeam['insHasAdvisor'] && profTeam['insHasAdvisor'] !== 'na') {
    advisors.push({
      id: 'ins_0',
      name: resolvePersonNameField(profTeam['insAdvisor1Name']),
      firm: (profTeam['insAdvisor1Firm'] as string) || '',
      phone: (profTeam['insAdvisor1Phone'] as string) || '',
      email: (profTeam['insAdvisor1Email'] as string) || '',
      website: '',
      worksWith: (profTeam['insAdvisor1WorksWith'] as string[]) || [],
      services: (profTeam['insAdvisor1Services'] as string[]) || [],
      type: 'insurance',
      active: true,
    });
  }

  if (profTeam['insHasAdditional'] === 'yes') {
    advisors.push({
      id: 'ins_1',
      name: resolvePersonNameField(profTeam['insAdvisor2Name']),
      firm: (profTeam['insAdvisor2Firm'] as string) || '',
      phone: (profTeam['insAdvisor2Phone'] as string) || '',
      email: (profTeam['insAdvisor2Email'] as string) || '',
      website: '',
      worksWith: (profTeam['insAdvisor2WorksWith'] as string[]) || [],
      services: (profTeam['insAdvisor2Services'] as string[]) || [],
      type: 'insurance',
      active: true,
    });
  }

  return advisors;
}

export function getFinancialAdvisors(allAnswers: AnswersMap): ProfessionalAdvisor[] {
  return getProfessionalAdvisors(allAnswers).filter((a) => a.type === 'financial' && a.name);
}

export type WillLawyerRecord = {
  id: string;
  name: string;
  firm: string;
  phone: string;
  email: string;
  website?: string;
  city: string;
  province: string;
  country: string;
  source: 'professionalTeam' | 'corporate' | 'willSection';
  corpName?: string;
  title?: string;
};

function deduplicateLawyers(lawyers: ProfessionalAdvisor[]): ProfessionalAdvisor[] {
  const seen = new Map<string, ProfessionalAdvisor>();
  for (const lawyer of lawyers) {
    if (!lawyer.name && !lawyer.firm) continue;
    if (seen.has(lawyer.id)) continue;
    seen.set(lawyer.id, lawyer);
  }
  return Array.from(seen.values());
}

export function getCurrentLawyers(allAnswers: AnswersMap): ProfessionalAdvisor[] {
  const advisors = getProfessionalAdvisors(allAnswers);
  const profTeamLawyers = advisors.filter(a => a.type === 'lawyer' && a.active);

  const corpData = allAnswers.get('corporations')?.['corporationsData'] as Array<Record<string, unknown>> | undefined;
  const corpLawyers: ProfessionalAdvisor[] = [];
  if (corpData) {
    corpData.forEach((corp, corpIdx) => {
      if (corp['lawHasLawyer'] !== 'yes') return;
      const lawyers = corp['lawLawyers'] as Array<Record<string, unknown>> | undefined;
      if (!lawyers) return;
      lawyers.forEach((lawyer, lIdx) => {
        const name = (lawyer['contactName'] as string) || '';
        const firm = (lawyer['firmName'] as string) || '';
        if (!name && !firm) return;
        const id = `corplaw_${corpIdx}_${lIdx}`;
        corpLawyers.push({
          id,
          name,
          firm,
          phone: (lawyer['phone'] as string) || '',
          email: (lawyer['email'] as string) || '',
          website: '',
          worksWith: [],
          services: (lawyer['responsibilities'] as string[]) || [],
          type: 'lawyer',
          active: true,
          source: 'corporate',
          corpName: (corp['legalName'] as string) || '',
          title: (lawyer['title'] as string) || '',
        });
      });
    });
  }

  const willSection = allAnswers.get('wills') || {};
  const willLawyersData = willSection['willLawyersData'] as Array<Record<string, unknown>> | undefined;
  const willLawyers: ProfessionalAdvisor[] = [];
  if (willLawyersData) {
    willLawyersData.forEach((lawyer) => {
      const name = (lawyer['name'] as string) || '';
      const firm = (lawyer['firm'] as string) || '';
      if (!name && !firm) return;
      const id = (lawyer['id'] as string) || generateStableId();
      willLawyers.push({
        id,
        name,
        firm,
        phone: (lawyer['phone'] as string) || '',
        email: (lawyer['email'] as string) || '',
        website: (lawyer['website'] as string) || '',
        worksWith: [],
        services: [],
        type: 'lawyer',
        active: true,
        city: (lawyer['city'] as string) || '',
        province: (lawyer['province'] as string) || '',
        country: (lawyer['country'] as string) || '',
        source: 'willSection',
      });
    });
  }

  return deduplicateLawyers([...profTeamLawyers, ...corpLawyers, ...willLawyers]);
}

export function createWillLawyerRecord(
  data: { name: string; firm: string; phone: string; email: string; website?: string; city: string; province: string; country: string }
): { id: string; record: Record<string, unknown> } {
  const id = generateStableId();
  const record: Record<string, unknown> = {
    id,
    name: data.name,
    firm: data.firm,
    phone: data.phone,
    email: data.email,
    website: data.website || '',
    city: data.city,
    province: data.province,
    country: data.country,
  };
  return { id, record };
}

export function addWillLawyerToRegistry(
  allAnswers: AnswersMap,
  record: Record<string, unknown>
): AnswersMap {
  const willsSection = allAnswers.get('wills') || {};
  const existing = (willsSection['willLawyersData'] as Array<Record<string, unknown>>) || [];
  const updated = new Map(allAnswers);
  updated.set('wills', {
    ...willsSection,
    willLawyersData: [...existing, record],
  });
  return updated;
}

export function resolveProfessionalReference(
  id: string | undefined,
  registry: ProfessionalAdvisor[]
): ProfessionalAdvisor | null {
  if (!id) return null;
  return registry.find((a) => a.id === id && a.active) || null;
}

export function resolvePersonReference(
  id: string | undefined,
  people: Person[]
): Person | null {
  if (!id) return null;
  return people.find((p) => p.id === id) || null;
}

export function resolveInstitutionReference(
  id: string | undefined,
  institutions: Institution[]
): Institution | null {
  if (!id) return null;
  return institutions.find((i) => i.id === id) || null;
}

export function clearStaleContact(contact: ContactInfo | undefined): ContactInfo {
  if (!contact) return {};
  if (!contact.contactPersonId) return contact;
  return {};
}

export function cleanStaleAdvisorReferences(
  allAnswers: AnswersMap
): AnswersMap {
  const advisors = getProfessionalAdvisors(allAnswers);
  const activeIds = new Set(advisors.map((a) => a.id));
  const updated = new Map(allAnswers);
  let changed = false;

  const assetKeys = [
    'investmentAccountsData',
    'pensionRecordsData',
    'equityCompensationData',
    'receivablesData',
    'otherAssetsData',
  ];

  for (const [sectionId, sectionData] of updated) {
    if (!sectionData || typeof sectionData !== 'object') continue;

    for (const assetKey of assetKeys) {
      const assets = sectionData[assetKey] as AnyFinancialAsset[] | undefined;
      if (!Array.isArray(assets) || assets.length === 0) continue;

      let assetChanged = false;
      const cleanedAssets = assets.map((asset) => {
        const contact = asset.contact;
        if (!contact || !contact.contactPersonId) return asset;

        if (!activeIds.has(contact.contactPersonId)) {
          assetChanged = true;
          return { ...asset, contact: {} };
        }
        return asset;
      });

      if (assetChanged) {
        if (!changed) changed = true;
        updated.set(sectionId, {
          ...sectionData,
          [assetKey]: cleanedAssets,
        });
      }
    }
  }

  return changed ? updated : allAnswers;
}

export function getKnownPeople(allAnswers: AnswersMap): Person[] {
  const people: Person[] = [];
  const aboutYou = allAnswers.get('aboutYou') || {};

  const client1Name = (aboutYou['fullName'] as string) || 'Client 1';
  people.push({ id: 'client1', name: client1Name, relationship: 'Self' });

  const maritalStatus = aboutYou['maritalStatus'] as string;
  if (maritalStatus === 'married' || maritalStatus === 'common_law') {
    const client2Name = (aboutYou['spouseName'] as string) || 'Client 2';
    people.push({ id: 'client2', name: client2Name, relationship: 'Spouse' });
  }

  const childrenData = allAnswers.get('children') || {};
  const children = (childrenData['childrenData'] as Array<Record<string, string>>) || [];
  children.forEach((c, i) => {
    if (c?.name) people.push({ id: `child_${i}`, name: c.name, relationship: 'Child' });
  });

  const prevRels = allAnswers.get('previousRelationships') || {};
  const c1Rels = (prevRels['client1PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
  c1Rels.forEach((r, i) => {
    if (r?.name) people.push({ id: `c1prev_${i}`, name: r.name, relationship: 'Previous Partner' });
  });
  const c2Rels = (prevRels['client2PreviousRelationshipsData'] as Array<Record<string, string>>) || [];
  c2Rels.forEach((r, i) => {
    if (r?.name) people.push({ id: `c2prev_${i}`, name: r.name, relationship: 'Previous Partner' });
  });

  return people;
}

export function cleanStaleTrustReferences(allAnswers: AnswersMap): AnswersMap {
  const trustSection = allAnswers.get('familyTrusts');
  if (!trustSection) return allAnswers;

  const trusts = trustSection['familyTrustsData'] as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(trusts) || trusts.length === 0) return allAnswers;

  const activePeople = new Set(getKnownPeople(allAnswers).map((p) => p.id));
  const activeAdvisors = new Set(getProfessionalAdvisors(allAnswers).map((a) => a.id));

  const corpData = allAnswers.get('corporations')?.['corporationsData'] as Array<Record<string, string>> | undefined;
  const activeCorps = new Set((corpData || []).map((_c, i) => `corp_${i}`));

  const propData = allAnswers.get('realEstate')?.['propertiesData'] as Array<Record<string, unknown>> | undefined;
  const activeProps = new Set((propData || []).map((_p, i) => `prop_${i}`));
  if (allAnswers.get('realEstate')?.['primaryHomeData']) {
    activeProps.add('prop_primary');
  }

  let changed = false;
  const cleanedTrusts = trusts.map((trust) => {
    let trustChanged = false;

    const cleanedTrustees = (trust['trustees'] as Array<Record<string, unknown>> | undefined)?.map((t) => {
      if (t?.personId && t.personId !== 'client1' && t.personId !== 'client2' && !activePeople.has(t.personId as string)) {
        trustChanged = true;
        return { ...t, personId: undefined };
      }
      return t;
    });
    if (cleanedTrustees && cleanedTrustees.some((t, i) => t !== ((trust['trustees'] as Array<Record<string, unknown>>)[i]))) {
      trustChanged = true;
    }

    const cleanedBeneficiaries = (trust['beneficiaries'] as Array<Record<string, unknown>> | undefined)?.map((b) => {
      if (b?.personId && !activePeople.has(b.personId as string)) {
        trustChanged = true;
        return { ...b, personId: undefined };
      }
      return b;
    });

    const cleanedHoldings = (trust['assetHoldings'] as Array<Record<string, unknown>> | undefined)?.map((h) => {
      if (h?.corporationId && !activeCorps.has(h.corporationId as string)) {
        trustChanged = true;
        return { ...h, corporationId: undefined };
      }
      if (h?.propertyId && !activeProps.has(h.propertyId as string)) {
        trustChanged = true;
        return { ...h, propertyId: undefined };
      }
      return h;
    });

    const accountant = trust['accountantAdvisor'] as Record<string, unknown> | undefined;
    if (accountant?.advisorId && !activeAdvisors.has(accountant.advisorId as string)) {
      trustChanged = true;
    }
    const cleanedAccountant = accountant?.advisorId && !activeAdvisors.has(accountant.advisorId as string)
      ? { ...accountant, advisorId: undefined, isExisting: false }
      : accountant;

    const lawyer = trust['lawyerAdvisor'] as Record<string, unknown> | undefined;
    const cleanedLawyer = lawyer?.advisorId && !activeAdvisors.has(lawyer.advisorId as string)
      ? { ...lawyer, advisorId: undefined, isExisting: false }
      : lawyer;

    if (trustChanged) {
      changed = true;
      return {
        ...trust,
        trustees: cleanedTrustees || trust['trustees'],
        beneficiaries: cleanedBeneficiaries || trust['beneficiaries'],
        assetHoldings: cleanedHoldings || trust['assetHoldings'],
        accountantAdvisor: cleanedAccountant,
        lawyerAdvisor: cleanedLawyer,
      };
    }
    return trust;
  });

  if (changed) {
    const updated = new Map(allAnswers);
    updated.set('familyTrusts', { ...trustSection, familyTrustsData: cleanedTrusts });
    return updated;
  }

  return allAnswers;
}

export function cleanStaleLegacyIntentReferences(allAnswers: AnswersMap): AnswersMap {
  const legacySection = allAnswers.get('legacyIntent');
  if (!legacySection) return allAnswers;

  const intents = legacySection['legacyIntentsData'] as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(intents) || intents.length === 0) return allAnswers;

  const activePeople = new Set(getKnownPeople(allAnswers).map((p) => p.id));
  const activeAdvisors = new Set(getProfessionalAdvisors(allAnswers).map((a) => a.id));

  const corpData = allAnswers.get('corporations')?.['corporationsData'] as Array<Record<string, unknown>> | undefined;
  const activeCorps = new Set((corpData || []).map((_, i) => `corp_${i}`));

  const propData = allAnswers.get('realEstate')?.['propertiesData'] as Array<Record<string, unknown>> | undefined;
  const activeProps = new Set((propData || []).map((_, i) => `prop_${i}`));
  if (allAnswers.get('realEstate')?.['primaryHomeData']) {
    activeProps.add('prop_primary');
  }

  let changed = false;
  const cleanedIntents = intents.map((record) => {
    let recordChanged = false;
    const asset = record['asset'] as Record<string, unknown> | undefined;
    if (asset?.assetId && asset.assetSourceSectionId === 'corporations' && !activeCorps.has(asset.assetId as string)) {
      recordChanged = true;
    }
    if (asset?.assetId && asset.assetSourceSectionId === 'realEstate' && !activeProps.has(asset.assetId as string)) {
      recordChanged = true;
    }

    const cleanRecipientIdsForScenario = (ids: unknown, scenario: LegacyScenario, deceasedClientId?: string): string[] => {
      if (!Array.isArray(ids)) return [];
      const excluded = getExcludedPersonIdsForScenario(scenario, allAnswers, deceasedClientId);
      return ids.filter((id) => {
        if (typeof id !== 'string') return false;
        if (id.startsWith('other_')) return true;
        if (!activePeople.has(id)) return false;
        if (excluded.has(id)) { recordChanged = true; return false; }
        return true;
      });
    };

    const cleanRecipientsForScenario = (recipients: unknown, scenario: LegacyScenario, deceasedClientId?: string): Array<Record<string, unknown>> => {
      if (!Array.isArray(recipients)) return [];
      const excluded = getExcludedPersonIdsForScenario(scenario, allAnswers, deceasedClientId);
      return recipients.filter((r) => {
        if (!r || typeof r !== 'object') return false;
        const rr = r as Record<string, unknown>;
        if (rr.personId && !((rr.personId as string).startsWith('other_'))) {
          if (!activePeople.has(rr.personId as string)) { recordChanged = true; return false; }
          if (excluded.has(rr.personId as string)) { recordChanged = true; return false; }
        }
        return true;
      }) as Array<Record<string, unknown>>;
    };

    const scenarios = ['firstDeath', 'bothDeceased', 'noSurvivingDescendants'] as const;
    const updatedScenarios: Record<string, unknown> = {};
    for (const field of scenarios) {
      const scenario = record[field] as Record<string, unknown> | undefined;
      if (!scenario) continue;
      const deceasedClientId = field === 'firstDeath'
        ? getFirstDeathDeceasedClientId(asset?.ownership as 'other' | 'client1' | 'client2' | 'joint' | 'unknown' | undefined)
        : undefined;
      const cleanedIds = cleanRecipientIdsForScenario(scenario.recipientIds, field, deceasedClientId);
      const cleanedRecipients = cleanRecipientsForScenario(scenario.recipients, field, deceasedClientId);
      updatedScenarios[field] = { ...scenario, recipientIds: cleanedIds, recipients: cleanedRecipients };
    }

    const stayFamilyExcluded = getExcludedPersonIdsForScenario('bothDeceased', allAnswers);
    const stayFamilyIds = (Array.isArray(record.stayInFamilyRecipientIds) ? record.stayInFamilyRecipientIds : []).filter((id: string) => {
      if (id.startsWith('other_')) return true;
      if (!activePeople.has(id)) return false;
      if (stayFamilyExcluded.has(id)) { recordChanged = true; return false; }
      return true;
    });

    const businessBranch = record.businessBranch as Record<string, unknown> | undefined;
    let cleanedBranch: Record<string, unknown> | undefined;
    if (businessBranch) {
      const profIds = (businessBranch.professionalContactIds as string[]) || [];
      const cleanedProfIds = profIds.filter((id) => activeAdvisors.has(id));
      if (cleanedProfIds.length !== profIds.length) recordChanged = true;
      const cleanedBranchRecipients = cleanRecipientsForScenario(businessBranch.ownershipSuccessionRecipients, 'firstDeath', getFirstDeathDeceasedClientId(asset?.ownership as 'other' | 'client1' | 'client2' | 'joint' | 'unknown' | undefined));
      const mgmtPersonId = businessBranch.managementSuccessionPersonId as string | undefined;
      if (mgmtPersonId && !activePeople.has(mgmtPersonId) && !mgmtPersonId.startsWith('other_')) {
        recordChanged = true;
        cleanedBranch = { ...businessBranch, professionalContactIds: cleanedProfIds, ownershipSuccessionRecipients: cleanedBranchRecipients, managementSuccessionPersonId: undefined, managementSuccessionPersonName: undefined };
      } else {
        cleanedBranch = { ...businessBranch, professionalContactIds: cleanedProfIds, ownershipSuccessionRecipients: cleanedBranchRecipients };
      }
    }

    if (recordChanged) {
      changed = true;
      return {
        ...record,
        ...updatedScenarios,
        stayInFamilyRecipientIds: stayFamilyIds,
        businessBranch: cleanedBranch || businessBranch,
      };
    }
    return record;
  });

  if (changed) {
    const updated = new Map(allAnswers);
    updated.set('legacyIntent', { ...legacySection, legacyIntentsData: cleanedIntents });
    return updated;
  }

  return allAnswers;
}

export function cleanStaleCorporateConnections(
  allAnswers: Map<string, Record<string, unknown>>
): Map<string, Record<string, unknown>> {
  const clientNames = getClientNames(allAnswers);
  const validCorpNames = new Set(
    getClientOwnedCorpNames(allAnswers, clientNames).map((n) => n.toLowerCase())
  );

  if (validCorpNames.size > 0) {
    return allAnswers;
  }

  const cfcSection = allAnswers.get('corporateFinancialConnections');
  if (!cfcSection || Object.keys(cfcSection).length === 0) {
    return allAnswers;
  }

  const allCorpNames = new Set(
    getCorporationsData(allAnswers)
      .map((c) => ((c['legalName'] as string) || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const updated = new Map(allAnswers);
  const updatedCfc: Record<string, unknown> = {};
  let changed = false;

  for (const [key, value] of Object.entries(cfcSection)) {
    if (key === 'cfcReviewConfirmed') {
      updatedCfc[key] = value;
      continue;
    }

    if (key === 'personalGuaranteesData' && Array.isArray(value)) {
      const filtered = (value as Array<Record<string, unknown>>).filter((entry) => {
        const corpName = ((entry['selectedCompany'] as string) || '').trim().toLowerCase();
        return corpName === '' || validCorpNames.has(corpName);
      });
      if (filtered.length === 0) { changed = true; continue; }
      if (filtered.length !== value.length) { changed = true; updatedCfc[key] = filtered; continue; }
      updatedCfc[key] = value;
      continue;
    }

    if (key === 'shareholderLoansData' && Array.isArray(value)) {
      const filtered = (value as Array<Record<string, unknown>>).filter((entry) => {
        const corpName = ((entry['selectedCompany'] as string) || '').trim().toLowerCase();
        return corpName === '' || validCorpNames.has(corpName);
      });
      if (filtered.length === 0) { changed = true; continue; }
      if (filtered.length !== value.length) { changed = true; updatedCfc[key] = filtered; continue; }
      updatedCfc[key] = value;
      continue;
    }

    if (key === 'companyOwedData' && Array.isArray(value)) {
      const filtered = (value as Array<Record<string, unknown>>).filter((entry) => {
        const corpName = ((entry['selectedCompany'] as string) || '').trim().toLowerCase();
        return corpName === '' || validCorpNames.has(corpName);
      });
      if (filtered.length === 0) { changed = true; continue; }
      if (filtered.length !== value.length) { changed = true; updatedCfc[key] = filtered; continue; }
      updatedCfc[key] = value;
      continue;
    }

    if (key === 'intercompanyLoansData' && Array.isArray(value)) {
      const filtered = (value as Array<Record<string, unknown>>).filter((entry) => {
        const corp1 = ((entry['lenderCompany'] as string) || '').trim().toLowerCase();
        const corp2 = ((entry['borrowerCompany'] as string) || '').trim().toLowerCase();
        const corp1Valid = corp1 === '' || allCorpNames.has(corp1);
        const corp2Valid = corp2 === '' || allCorpNames.has(corp2);
        return corp1Valid && corp2Valid;
      });
      if (filtered.length === 0) { changed = true; continue; }
      if (filtered.length !== value.length) { changed = true; updatedCfc[key] = filtered; continue; }
      updatedCfc[key] = value;
      continue;
    }

    if (key === 'relatedPartyLoansData' && Array.isArray(value)) {
      const allCorpsArray = getCorporationsData(allAnswers)
        .map((c) => ((c['legalName'] as string) || '').trim())
        .filter(Boolean);
      const filtered = (value as Array<Record<string, unknown>>).filter((entry) => {
        const direction = ((entry['direction'] as string) || '');
        const match = direction.match(/^(?:company_owes_other_|other_owes_company_)(\d+)$/);
        if (!match) return true;
        const corpIdx = parseInt(match[1], 10);
        if (corpIdx < 0 || corpIdx >= allCorpsArray.length) return false;
        return allCorpNames.has(allCorpsArray[corpIdx].toLowerCase());
      });
      if (filtered.length === 0) { changed = true; continue; }
      if (filtered.length !== value.length) { changed = true; updatedCfc[key] = filtered; continue; }
      updatedCfc[key] = value;
      continue;
    }

    changed = true;
  }

  if (changed) {
    if (Object.keys(updatedCfc).length > 0) {
      updated.set('corporateFinancialConnections', updatedCfc);
    } else {
      updated.delete('corporateFinancialConnections');
    }
  }

  return updated;
}

export function cleanStaleCurrentWillReferences(
  allAnswers: AnswersMap
): AnswersMap {
  const willsSection = allAnswers.get('wills');
  if (!willsSection) return allAnswers;

  const cwData = willsSection['currentWillData'] as Record<string, unknown> | undefined;
  if (!cwData || typeof cwData !== 'object') return allAnswers;

  const activePeople = new Set(getKnownPeople(allAnswers).map((p) => p.id));

  const corpData = allAnswers.get('corporations')?.['corporationsData'] as Array<Record<string, unknown>> | undefined;
  const activeCorps = new Set((corpData || []).map((_, i) => `corp_${i}`));

  const propData = allAnswers.get('realEstate')?.['propertiesData'] as Array<Record<string, unknown>> | undefined;
  const activeProps = new Set((propData || []).map((_, i) => `prop_${i}`));
  if (allAnswers.get('realEstate')?.['primaryHomeData']) {
    activeProps.add('prop_primary');
  }

  const legacySection = allAnswers.get('legacyIntent') || {};
  const legacyIntents = (legacySection['legacyIntentsData'] as Array<Record<string, unknown>>) || [];
  const activeLegacyIntentIds = new Set(legacyIntents.map((li) => li['id'] as string).filter(Boolean));
  const activeLegacyAssetIds = new Set(legacyIntents.map((li) => (li['asset'] as Record<string, unknown>)?.['assetId'] as string).filter(Boolean));

  let changed = false;
  const clients = (cwData['clients'] as Array<Record<string, unknown>>) || [];
  const cleanedClients = clients.map((client) => {
    let clientChanged = false;

    const cleanedResidueRecipients = ((client['residueRecipients'] as string[]) || []).filter((id) => {
      if (id.startsWith('other_')) return true;
      if (!activePeople.has(id)) { clientChanged = true; return false; }
      return true;
    });
    if (cleanedResidueRecipients.length !== ((client['residueRecipients'] as string[]) || []).length) {
      clientChanged = true;
    }

    const cleanedUltimateRecipients = ((client['ultimateContingencyRecipients'] as string[]) || []).filter((id) => {
      if (id.startsWith('other_')) return true;
      if (!activePeople.has(id)) { clientChanged = true; return false; }
      return true;
    });
    if (cleanedUltimateRecipients.length !== ((client['ultimateContingencyRecipients'] as string[]) || []).length) {
      clientChanged = true;
    }

    if (client['trustTrusteePersonId'] && !activePeople.has(client['trustTrusteePersonId'] as string) && !(client['trustTrusteePersonId'] as string).startsWith('other_')) {
      clientChanged = true;
    }
    const cleanedTrusteePersonId = client['trustTrusteePersonId'] && !activePeople.has(client['trustTrusteePersonId'] as string) && !(client['trustTrusteePersonId'] as string).startsWith('other_')
      ? undefined : client['trustTrusteePersonId'];

    const activeLawyerIds = new Set(getCurrentLawyers(allAnswers).map(l => l.id));
    const docBasics = (client['documentBasics'] as Record<string, unknown>) || {};
    let cleanedDocBasics = docBasics;
    if (docBasics['willLawyerId'] && !activeLawyerIds.has(docBasics['willLawyerId'] as string)) {
      clientChanged = true;
      cleanedDocBasics = { ...docBasics, willLawyerId: undefined };
    }

    const alignments = (client['alignments'] as Array<Record<string, unknown>>) || [];
    const cleanedAlignments = alignments.filter((a) => {
      const subjectType = a['subjectType'] as string;
      const subjectId = a['subjectId'] as string;
      const intentionSourceId = a['intentionSourceId'] as string | undefined;

      if (subjectType === 'legacyAsset' && subjectId && !activeLegacyAssetIds.has(subjectId)) {
        clientChanged = true;
        return false;
      }
      if (intentionSourceId && !activeLegacyIntentIds.has(intentionSourceId)) {
        clientChanged = true;
        return false;
      }
      if (subjectType === 'business' && subjectId && subjectId.startsWith('corp_')) {
        const baseId = subjectId.replace(/_flex$/, '');
        if (!activeCorps.has(baseId)) {
          clientChanged = true;
          return false;
        }
      }
      return true;
    });
    if (cleanedAlignments.length !== alignments.length) {
      clientChanged = true;
    }

    const firstDeathExceptions = (client['firstDeathExceptions'] as Array<Record<string, unknown>>) || [];
    const cleanedExceptions = firstDeathExceptions.filter((exc) => {
      const assetId = exc['assetId'] as string | undefined;
      if (assetId && !activeProps.has(assetId) && !assetId.startsWith('corp_') && !activeCorps.has(assetId)) {
        return true;
      }
      return true;
    });

    const specificGifts = (client['specificGifts'] as Array<Record<string, unknown>>) || [];
    const cleanedGifts = specificGifts.map((gift) => {
      if (gift['recipientPersonId'] && !activePeople.has(gift['recipientPersonId'] as string) && !(gift['recipientPersonId'] as string).startsWith('other_')) {
        clientChanged = true;
        return { ...gift, recipientPersonId: undefined };
      }
      return gift;
    });

    const childArrangements = (client['childSpecificArrangements'] as Array<Record<string, unknown>>) || [];
    const cleanedChildArrangements = childArrangements.filter((arr) => {
      const childId = arr['childId'] as string;
      if (childId && !activePeople.has(childId) && !childId.startsWith('other_')) {
        clientChanged = true;
        return false;
      }
      return true;
    });
    if (cleanedChildArrangements.length !== childArrangements.length) {
      clientChanged = true;
    }

    if (clientChanged) {
      changed = true;
      return {
        ...client,
        residueRecipients: cleanedResidueRecipients,
        ultimateContingencyRecipients: cleanedUltimateRecipients,
        trustTrusteePersonId: cleanedTrusteePersonId,
        documentBasics: cleanedDocBasics,
        alignments: cleanedAlignments,
        firstDeathExceptions: cleanedExceptions,
        specificGifts: cleanedGifts,
        childSpecificArrangements: cleanedChildArrangements,
      };
    }
    return client;
  });

  if (changed) {
    const updated = new Map(allAnswers);
    updated.set('wills', {
      ...willsSection,
      currentWillData: { ...cwData, clients: cleanedClients },
    });
    return updated;
  }

  return allAnswers;
}
