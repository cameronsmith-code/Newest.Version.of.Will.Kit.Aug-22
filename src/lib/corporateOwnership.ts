type CorporationRecord = Record<string, unknown>;

export interface ClientNames {
  client1Name: string;
  client2Name: string;
}

export function getClientNames(
  answers: Map<string, Record<string, unknown>>
): ClientNames {
  const aboutYou = answers.get('aboutYou') || {};
  return {
    client1Name: ((aboutYou['fullName'] as string) || '').trim(),
    client2Name: ((aboutYou['spouseName'] as string) || '').trim(),
  };
}

function getOwners(corp: CorporationRecord): string[] {
  const raw = corp['owners'];
  if (!raw) return [];
  const str = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join(',') : String(raw);
  return str
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function corpHasOwner(corp: CorporationRecord, ownerName: string): boolean {
  if (!ownerName) return false;
  const owners = getOwners(corp);
  return owners.some((o) => o.toLowerCase() === ownerName.toLowerCase());
}

export function getCorporationsData(
  answers: Map<string, Record<string, unknown>>
): CorporationRecord[] {
  const corpSection = answers.get('corporations') || {};
  const data = corpSection['corporationsData'];
  if (!data || !Array.isArray(data)) return [];
  return data as CorporationRecord[];
}

export function getClientOwnedCorporations(
  answers: Map<string, Record<string, unknown>>,
  clientNames?: ClientNames
): CorporationRecord[] {
  const names = clientNames || getClientNames(answers);
  const corps = getCorporationsData(answers);
  const clientNamesList = [names.client1Name, names.client2Name].filter(Boolean);
  if (clientNamesList.length === 0) return [];
  return corps.filter((corp) =>
    clientNamesList.some((name) => corpHasOwner(corp, name))
  );
}

export function hasClientShareOwnership(
  answers: Map<string, Record<string, unknown>>,
  clientNames?: ClientNames
): boolean {
  return getClientOwnedCorporations(answers, clientNames).length > 0;
}

export function getClientOwnedCorpNames(
  answers: Map<string, Record<string, unknown>>,
  clientNames?: ClientNames
): string[] {
  return getClientOwnedCorporations(answers, clientNames)
    .map((c) => ((c['legalName'] as string) || '').trim())
    .filter(Boolean);
}

export function getAllCorpNames(
  answers: Map<string, Record<string, unknown>>
): string[] {
  return getCorporationsData(answers)
    .map((c) => ((c['legalName'] as string) || '').trim())
    .filter(Boolean);
}
