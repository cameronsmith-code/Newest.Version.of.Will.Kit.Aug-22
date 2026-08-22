export type ProvinceCode =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU'
  | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

const PROVINCE_NAMES: Record<ProvinceCode, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
};

const TEXT_TO_CODE: Record<string, ProvinceCode> = {};
for (const [code, name] of Object.entries(PROVINCE_NAMES)) {
  TEXT_TO_CODE[name.toLowerCase()] = code as ProvinceCode;
  TEXT_TO_CODE[code.toLowerCase()] = code as ProvinceCode;
}
TEXT_TO_CODE['newfoundland'] = 'NL';
TEXT_TO_CODE['newfoundland and labrador'] = 'NL';
TEXT_TO_CODE['british columbia'] = 'BC';
TEXT_TO_CODE['northwest territories'] = 'NT';
TEXT_TO_CODE['prince edward island'] = 'PE';

const HIGHER_MAJORITY: ProvinceCode[] = ['BC', 'NS', 'NB', 'NL', 'NT', 'NU', 'YT'];

export function normalizeProvinceCode(input: string | undefined | null): ProvinceCode | undefined {
  if (!input) return undefined;
  const p = input.trim().toLowerCase();
  if (TEXT_TO_CODE[p]) return TEXT_TO_CODE[p];
  return undefined;
}

export function getAgeOfMajority(provinceInput: string | undefined | null): number {
  const code = normalizeProvinceCode(provinceInput);
  if (!code) return 18;
  return HIGHER_MAJORITY.includes(code) ? 19 : 18;
}

export function getProvinceName(provinceInput: string | undefined | null): string | undefined {
  const code = normalizeProvinceCode(provinceInput);
  if (!code) return undefined;
  return PROVINCE_NAMES[code];
}

export function isHigherMajorityProvince(provinceInput: string | undefined | null): boolean {
  const code = normalizeProvinceCode(provinceInput);
  if (!code) return false;
  return HIGHER_MAJORITY.includes(code);
}
