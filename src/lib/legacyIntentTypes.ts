import type { DocumentLocation } from './financialAssetTypes';

export type LegacyAssetRef = {
  id: string;
  assetId: string;
  assetSourceSectionId: string;
  assetName: string;
  assetType: 'real_estate' | 'corporation' | 'other';
  assetSubtype?: string;
  ownership?: 'joint' | 'client1' | 'client2' | 'other' | 'unknown';
  isBusiness?: boolean;
};

export type RecipientRef = {
  personId?: string;
  personName: string;
  share?: string;
};

export type SuccessionIntent = {
  outcome: string;
  recipientIds: string[];
  recipients: RecipientRef[];
  notes?: string;
};

export type BusinessOwnerBranch = {
  ownershipSuccession: string;
  ownershipSuccessionRecipients: RecipientRef[];
  managementSuccession: string;
  managementSuccessionPersonId?: string;
  managementSuccessionPersonName?: string;
  shareholderAgreementConsistent: 'yes' | 'no' | 'not_sure' | 'not_discussed';
  postMortemFlexibility: 'yes' | 'no' | 'not_sure' | 'not_discussed';
  postMortemConsidered: 'yes' | 'no' | 'not_sure';
  hasPlanningDocuments: 'yes' | 'no' | 'not_sure';
  planningDocumentLocation?: DocumentLocation;
  professionalContactIds: string[];
  businessDiscussedWithFamily: 'yes' | 'somewhat' | 'no' | 'not_applicable';
  successorHasDiscussed: 'yes' | 'no' | 'not_yet' | 'not_sure';
};

export type LegacyIntentRecord = {
  id: string;
  asset: LegacyAssetRef;
  firstDeath?: SuccessionIntent;
  bothDeceased?: SuccessionIntent;
  noSurvivingDescendants?: SuccessionIntent;
  stayInFamilyIntent?: 'yes' | 'no' | 'no_preference' | 'not_sure';
  stayInFamilyRecipientIds?: string[];
  stayInFamilyFallback?: string;
  equalizationIntent?: 'yes' | 'no' | 'not_necessarily' | 'not_sure';
  discussedWithFamily?: 'yes' | 'somewhat' | 'no' | 'not_applicable';
  discussionNotes?: string;
  reflectedInEstateDocuments?: 'yes' | 'no' | 'not_sure' | 'not_discussed';
  notes?: string;
  businessBranch?: BusinessOwnerBranch | null;
  reviewFlags: string[];
};

export function generateLegacyIntentId(): string {
  return `li_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
}

export function emptyLegacyIntent(asset: LegacyAssetRef): LegacyIntentRecord {
  return {
    id: generateLegacyIntentId(),
    asset,
    reviewFlags: [],
  };
}

const INDIVISIBLE_ASSET_TYPES = [
  'family_cottage', 'vacation_home', 'farm', 'investment_property',
  'family_business', 'heirloom', 'collection',
];

export function isIndivisibleAsset(record: LegacyIntentRecord): boolean {
  if (record.asset.assetType === 'corporation') return true;
  const subtype = record.asset.assetSubtype || '';
  return INDIVISIBLE_ASSET_TYPES.some((t) => subtype.includes(t));
}

export function generateReviewFlags(record: LegacyIntentRecord): string[] {
  const flags: string[] = [];
  const name = record.asset.assetName || 'this asset';

  if (record.reflectedInEstateDocuments === 'no') {
    flags.push(`Intentions for ${name} may not be reflected in existing estate-planning documents — consider reviewing with your lawyer`);
  }
  if (record.reflectedInEstateDocuments === 'not_sure') {
    flags.push(`It is unclear whether intentions for ${name} are reflected in existing estate-planning documents — consider confirming with your lawyer`);
  }
  if (record.reflectedInEstateDocuments === 'not_discussed') {
    flags.push(`Intentions for ${name} have not been discussed with your lawyer — consider scheduling a review`);
  }

  if (isIndivisibleAsset(record) && record.bothDeceased?.recipients && record.bothDeceased.recipients.length > 1) {
    flags.push(`${name} is intended for multiple recipients — consider how co-ownership or division would work in practice`);
  }

  if (record.stayInFamilyIntent === 'yes' && (!record.stayInFamilyRecipientIds || record.stayInFamilyRecipientIds.length === 0)) {
    flags.push(`You would like ${name} to stay in the family but no specific recipient has been identified`);
  }

  if (record.discussedWithFamily === 'no' || record.discussedWithFamily === 'somewhat') {
    flags.push(`Intentions for ${name} have not been fully discussed with the people involved — consider having these conversations`);
  }

  if (record.equalizationIntent === 'yes' && record.reflectedInEstateDocuments !== 'yes') {
    flags.push(`Equalization is important for ${name} but it is unclear whether this is addressed in existing documents`);
  }

  if (record.asset.isBusiness && record.businessBranch) {
    const b = record.businessBranch;
    if (b.ownershipSuccession !== 'not_sure' && b.managementSuccession === 'not_sure') {
      flags.push(`Ownership succession is identified for ${name} but management succession is unclear — consider who would run the business day-to-day`);
    }
    if (b.managementSuccession !== 'not_sure' && b.managementSuccession !== 'business_should_not_continue' && b.successorHasDiscussed !== 'yes') {
      flags.push(`The intended management successor for ${name} has not discussed or agreed to the role — consider confirming with them`);
    }
    if (b.shareholderAgreementConsistent === 'not_sure' || b.shareholderAgreementConsistent === 'not_discussed') {
      flags.push(`It is unclear whether intentions for ${name} are consistent with the shareholder agreement — consider reviewing with your lawyer`);
    }
    if (b.postMortemFlexibility === 'not_sure' || b.postMortemFlexibility === 'not_discussed') {
      flags.push(`Post-mortem planning flexibility for ${name} is unknown — consider discussing with your lawyer and accountant`);
    }
    if (b.postMortemConsidered !== 'yes') {
      flags.push(`Post-mortem tax planning for ${name} may not have been specifically considered when the Will was prepared`);
    }
    if (b.businessDiscussedWithFamily === 'no' || b.businessDiscussedWithFamily === 'somewhat') {
      flags.push(`Business succession intentions for ${name} have not been fully discussed with the people involved`);
    }
  }

  if (!record.firstDeath && !record.bothDeceased && !record.noSurvivingDescendants) {
    flags.push(`No succession intentions have been recorded for ${name} yet`);
  }

  return flags;
}

export type AvailableLegacyAsset = {
  assetId: string;
  assetSourceSectionId: string;
  assetName: string;
  assetType: 'real_estate' | 'corporation' | 'other';
  assetSubtype?: string;
  ownership?: 'joint' | 'client1' | 'client2' | 'other' | 'unknown';
  isBusiness?: boolean;
};

export function getAvailableLegacyAssets(allAnswers: Map<string, Record<string, unknown>>): AvailableLegacyAsset[] {
  const assets: AvailableLegacyAsset[] = [];

  const realEstate = allAnswers.get('realEstate') || {};
  const propertiesData = (realEstate['propertiesData'] as Array<Record<string, unknown>>) || [];
  propertiesData.forEach((p, i) => {
    const name = (p.name as string) || (p.type as string) || `Property ${i + 1}`;
    if (!name || !name.trim()) return;
    const type = (p.type as string) || '';
    const owners = (p.owners as string[]) || [];
    let ownership: 'joint' | 'client1' | 'client2' | 'other' | 'unknown' = 'unknown';
    if (owners.length > 1) ownership = 'joint';
    else if (owners.length === 1) {
      const o = owners[0];
      if (o === 'client1') ownership = 'client1';
      else if (o === 'client2') ownership = 'client2';
      else ownership = 'other';
    }
    assets.push({
      assetId: `prop_${i}`,
      assetSourceSectionId: 'realEstate',
      assetName: name,
      assetType: 'real_estate',
      assetSubtype: type,
      ownership,
    });
  });

  const primaryHome = realEstate['primaryHomeData'] as Record<string, unknown> | undefined;
  if (primaryHome?.name || primaryHome?.type) {
    assets.unshift({
      assetId: 'prop_primary',
      assetSourceSectionId: 'realEstate',
      assetName: (primaryHome.name as string) || (primaryHome.type as string) || 'Primary Home',
      assetType: 'real_estate',
      assetSubtype: (primaryHome.type as string) || 'primary_home',
      ownership: 'joint',
    });
  }

  const corpSection = allAnswers.get('corporations') || {};
  const corpData = (corpSection['corporationsData'] as Array<Record<string, unknown>>) || [];
  corpData.forEach((c, i) => {
    const name = (c.legalName as string) || '';
    if (!name || !name.trim()) return;
    const owners = (c.owners as string) || '';
    const ownerList = owners.split(',').map((s) => s.trim()).filter(Boolean);
    let ownership: 'joint' | 'client1' | 'client2' | 'other' | 'unknown' = 'unknown';
    if (ownerList.length > 1) ownership = 'joint';
    else if (ownerList.length === 1) {
      const o = ownerList[0].toLowerCase();
      if (o.includes('client1') || o === 'self') ownership = 'client1';
      else if (o.includes('client2') || o.includes('spouse')) ownership = 'client2';
      else ownership = 'other';
    }
    assets.push({
      assetId: `corp_${i}`,
      assetSourceSectionId: 'corporations',
      assetName: name,
      assetType: 'corporation',
      assetSubtype: 'private_corporation',
      ownership,
      isBusiness: true,
    });
  });

  return assets;
}

export function getCorporationShareholders(corp: Record<string, unknown>): Array<{ id: string; name: string; type: string }> {
  const shareholders: Array<{ id: string; name: string; type: string }> = [];
  const owners = (corp.owners as string) || '';
  owners.split(',').map((s) => s.trim()).filter(Boolean).forEach((name, i) => {
    shareholders.push({ id: `sh_${i}`, name, type: 'owner' });
  });
  const otherOwners = (() => {
    try { return JSON.parse((corp.otherOwners as string) || '[]') as Array<Record<string, string>>; } catch { return []; }
  })();
  otherOwners.forEach((o, i) => {
    if (o?.name) shareholders.push({ id: `osh_${i}`, name: o.name, type: o.type || 'other' });
  });
  return shareholders;
}

export function getCorporationKeyPeople(corp: Record<string, unknown>): Array<{ id: string; name: string; role: string }> {
  const people: Array<{ id: string; name: string; role: string }> = [];
  const im = corp.interimManager as Record<string, string> | undefined;
  if (im?.name) people.push({ id: 'interimManager', name: im.name, role: 'Designated Interim Manager' });
  const addl = (corp.additionalKeyPeople as Array<Record<string, string>>) || [];
  addl.forEach((p, i) => {
    if (p?.name) people.push({ id: `addKey_${i}`, name: p.name, role: 'Additional Key Person' });
  });
  return people;
}

// ─── Scenario-Based Recipient Eligibility ────────────────────────────────

export type LegacyScenario = 'firstDeath' | 'bothDeceased' | 'noSurvivingDescendants';

export type LegacyPerson = {
  id: string;
  name: string;
  relationship: string;
  isDescendant?: boolean;
  isClient?: boolean;
};

export function getLegacyPeople(allAnswers: Map<string, Record<string, unknown>>): LegacyPerson[] {
  const people: LegacyPerson[] = [];
  const aboutYou = allAnswers.get('aboutYou') || {};

  const client1Name = (aboutYou['fullName'] as string) || 'Client 1';
  people.push({ id: 'client1', name: client1Name, relationship: 'Self', isClient: true });

  const maritalStatus = aboutYou['maritalStatus'] as string;
  if (maritalStatus === 'married' || maritalStatus === 'common_law') {
    const client2Name = (aboutYou['spouseName'] as string) || 'Client 2';
    people.push({ id: 'client2', name: client2Name, relationship: 'Spouse', isClient: true });
  }

  const childrenSection = allAnswers.get('children') || {};
  const children = (childrenSection['childrenData'] as Array<Record<string, string>>) || [];
  children.forEach((c, i) => {
    if (c?.name) {
      people.push({ id: `child_${i}`, name: c.name, relationship: 'Child', isDescendant: true });
      const gcCount = parseInt(c.numberOfGrandchildren || '0', 10);
      for (let g = 1; g <= gcCount; g++) {
        const gcName = c[`grandchild${g}Name`];
        if (gcName) {
          people.push({ id: `child_${i}_grandchild_${g}`, name: gcName, relationship: 'Grandchild', isDescendant: true });
        }
      }
    }
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

export function getDescendantIds(allAnswers: Map<string, Record<string, unknown>>): Set<string> {
  const descendants = new Set<string>();
  const childrenSection = allAnswers.get('children') || {};
  const children = (childrenSection['childrenData'] as Array<Record<string, string>>) || [];
  children.forEach((c, i) => {
    if (c?.name) {
      descendants.add(`child_${i}`);
      const gcCount = parseInt(c.numberOfGrandchildren || '0', 10);
      for (let g = 1; g <= gcCount; g++) {
        const gcName = c[`grandchild${g}Name`];
        if (gcName) {
          descendants.add(`child_${i}_grandchild_${g}`);
        }
      }
    }
  });
  return descendants;
}

export function getExcludedPersonIdsForScenario(
  scenario: LegacyScenario,
  allAnswers: Map<string, Record<string, unknown>>,
  deceasedClientId?: string,
): Set<string> {
  const excluded = new Set<string>();
  const aboutYou = allAnswers.get('aboutYou') || {};
  const maritalStatus = aboutYou['maritalStatus'] as string;
  const hasSpouse = maritalStatus === 'married' || maritalStatus === 'common_law';

  switch (scenario) {
    case 'firstDeath':
      if (deceasedClientId) {
        excluded.add(deceasedClientId);
      }
      break;

    case 'bothDeceased':
      excluded.add('client1');
      if (hasSpouse) excluded.add('client2');
      break;

    case 'noSurvivingDescendants':
      excluded.add('client1');
      if (hasSpouse) excluded.add('client2');
      for (const id of getDescendantIds(allAnswers)) {
        excluded.add(id);
      }
      break;
  }

  return excluded;
}

export function getEligibleRecipientsForScenario(
  scenario: LegacyScenario,
  allAnswers: Map<string, Record<string, unknown>>,
  deceasedClientId?: string,
): LegacyPerson[] {
  const allPeople = getLegacyPeople(allAnswers);
  const excluded = getExcludedPersonIdsForScenario(scenario, allAnswers, deceasedClientId);
  return allPeople.filter((p) => !excluded.has(p.id));
}

export function filterValidRecipientIds(
  recipientIds: string[],
  scenario: LegacyScenario,
  allAnswers: Map<string, Record<string, unknown>>,
  deceasedClientId?: string,
): string[] {
  const excluded = getExcludedPersonIdsForScenario(scenario, allAnswers, deceasedClientId);
  return recipientIds.filter((id) => !excluded.has(id) || id.startsWith('other_'));
}

export function filterValidRecipients(
  recipients: RecipientRef[],
  scenario: LegacyScenario,
  allAnswers: Map<string, Record<string, unknown>>,
  deceasedClientId?: string,
): RecipientRef[] {
  const excluded = getExcludedPersonIdsForScenario(scenario, allAnswers, deceasedClientId);
  return recipients.filter((r) => {
    if (!r.personId) return true;
    if (r.personId.startsWith('other_')) return true;
    return !excluded.has(r.personId);
  });
}

export function getFirstDeathDeceasedClientId(
  assetOwnership: 'joint' | 'client1' | 'client2' | 'other' | 'unknown' | undefined,
): string | undefined {
  if (assetOwnership === 'client1') return 'client1';
  if (assetOwnership === 'client2') return 'client2';
  return undefined;
}
