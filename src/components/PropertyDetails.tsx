import { useState, useEffect, useCallback } from 'react';
import { Trash2, AlertTriangle, Home, Plus } from 'lucide-react';
import Subsection from './Subsection';
import DocumentLocationPicker from './DocumentLocationPicker';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';
import type { DocumentLocationRef } from '../lib/documentLocationTypes';
import type { EntityType } from '../lib/entityRegistryTypes';

export type OtherOwner = {
  name: string;
  phone: string;
  city: string;
  relationship: string;
  hasMore: 'yes' | 'no' | '';
};

export type CapitalImprovement = {
  description: string;
  cost: string;
  year: string;
  recordsLocation: DocumentLocationRef | string;
  hasMore?: string;
};

export type PropertyData = {
  type: string;
  name: string;
  country: string;
  province: string;
  state: string;
  city: string;
  streetAddress: string;
  unit: string;
  postalCode: string;
  linkedResidence: string;
  propertyEntityId: string;
  ownerEntityIds: string[];
  ownerEntityTypes: Record<string, EntityType>;
  locationOfDeeds: DocumentLocationRef | string;
  owners: string[];
  otherOwners: OtherOwner[];
  ownershipPercentages: Record<string, string>;
  purchaseYear: string;
  purchasedBy: string;
  purchasedByOtherOwners: OtherOwner[];
  purchasedByOwners: string[];
  purchasedByOwnershipPercentages: Record<string, string>;
  purchasePrice: string;
  documentsLocation: DocumentLocationRef | string;
  hasRenovations: string;
  capitalImprovements: CapitalImprovement[];
  inhabitedAnnually: string;
  usedForIncome: string;
  claimedCCA: string;
  recordsLocation: DocumentLocationRef | string;
  claimedPREOtherProperty: string;
  preDesignatedYears: string[];
  titleHolding: string;
  hasAdditionalOwners: string;
  purchasedByHasAdditionalOwners: string;
  coOwnershipAgreement: string;
  coOwnershipAgreementLocation: DocumentLocationRef | string;
  farmActiveEngagement: string;
  leaseDocumentsLocation: DocumentLocationRef | string;
  rentalTaxDocLocation: DocumentLocationRef | string;
  canadianRentalTaxDocLocation: DocumentLocationRef | string;
  foreignRentalTaxDocLocation: DocumentLocationRef | string;
  hasPropertyManager: string;
  propertyManagerName: string;
  propertyManagerPhone: string;
  propertyManagerEmail: string;
  propertyManagerCompany: string;
  hasLandlordInsurance: string;
  landlordInsuranceLocation: DocumentLocationRef | string;
  wasAlwaysRental: string;
  inhabitedYears: string[];
  hasDebt: string;
  debtType: string;
  mortgageBalance: string;
  mortgageLender: string;
  mortgageNumber: string;
  mortgagePayment: string;
  mortgagePaymentFrequency: string;
  mortgagePaymentFrequencyOther: string;
  mortgageInterestRate: string;
  mortgageInterestRateType: string;
  mortgageRenewalDate: string;
  mortgageRenewalDateUnknown: string;
  mortgageAmortizationYears: string;
  mortgageAmortizationUnknown: string;
  mortgageResponsibleParties: string[];
  mortgageOtherBorrowers: Array<{
    name: string;
    relationship: string;
    otherInfo: string;
    _addMore?: string;
  }>;
  mortgageOtherParties: Array<{
    name: string;
    relationship: string;
    otherInfo: string;
    _addMore?: string;
  }>;
  mortgagePaymentSource?: string;
  mortgagePaymentSourceOther?: string;
  mortgageBrokerLender?: string;
  mortgageBrokerContactName?: string;
  mortgageBrokerContactPhone?: string;
  mortgageBrokerContactEmail?: string;
  mortgageInsuranceTypes?: string[];
  mortgageInsuranceProviders?: Record<string, string>;
  mortgageInsurancePolicyNumbers?: Record<string, string>;
  mortgageInsuranceDocLocations?: Record<string, DocumentLocationRef | string>;
  mortgageSpecialNotes?: string;
  mortgageDocLocation?: DocumentLocationRef | string;
  mortgagePropertyEntityId?: string;
  helocLenderChoice?: string;
  helocLender?: string;
  helocAccountNumber?: string;
  helocNumber?: string;
  helocBalance?: string;
  helocCreditLimit?: string;
  helocInterestRate?: string;
  helocInterestRateType?: string;
  helocPrimePlus?: string;
  helocPaymentType?: string;
  helocPaymentMethod?: string;
  helocPaymentSource?: string;
  helocPaymentSourceOther?: string;
  helocResponsibleParties?: string[];
  helocOtherBorrowers?: Array<{
    name: string;
    relationship: string;
    otherInfo: string;
  }>;
  helocOtherParties: Array<{
    name: string;
    relationship: string;
    otherInfo: string;
    _addMore?: string;
  }>;
  helocPrimaryUses?: string[];
  helocPrimaryUseOther?: string;
  helocActivelyUsed?: string;
  helocSpecialNotes?: string;
  helocDocLocation?: DocumentLocationRef | string;
  helocHasAutoPayments?: string;
  helocAutoPaymentsDescription?: string;
  collateralForCorpDebt?: string;
  collateralCorpName?: string;
};

type ResidenceAddress = {
  label: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

type TrustOption = { name: string; entityId?: string };
type CorporationOption = { legalName: string; entityId?: string };

type Props = {
  index: number;
  propertyType: string;
  data: Partial<PropertyData>;
  client1Name: string;
  client2Name: string;
  hasSpouse: boolean;
  corporations: CorporationOption[];
  trusts: TrustOption[];
  partnerships: string[];
  predefinedPeople: Array<{ name: string; phone?: string; city?: string }>;
  collateralCorporations?: string[];
  residenceAddresses?: ResidenceAddress[];
  onAddTrust?: (name: string) => void;
  onAddCorporation?: (name: string) => void;
  client1EntityId?: string;
  client2EntityId?: string;
  onChange: (field: keyof PropertyData, value: unknown) => void;
  onMultiChange: (updates: Partial<PropertyData>) => void;
};

const inputClass =
  'w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';
const labelClass = 'block text-sm font-medium text-gray-300 mb-2';
const subLabelClass = 'block text-xs font-medium text-gray-400 mb-1';

const CANADA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
  'Northwest Territories', 'Nunavut', 'Yukon',
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

function PersonNameSelect({
  idPrefix,
  people,
  selectedName,
  onSelect,
}: {
  idPrefix: string;
  people: Array<{ name: string; phone?: string; city?: string }>;
  selectedName: string;
  onSelect: (name: string, phone: string, city: string) => void;
}) {
  const OTHER_VALUE = '__other__';
  const currentPerson = people.find(p => p.name.toLowerCase() === (selectedName || '').trim().toLowerCase());
  const isKnownPerson = !!currentPerson;
  const [isOther, setIsOther] = useState(!isKnownPerson && selectedName !== '');
  const selectValue = currentPerson ? currentPerson.name : isOther ? OTHER_VALUE : '';

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === OTHER_VALUE) {
            setIsOther(true);
            onSelect('', '', '');
          } else if (e.target.value === '') {
            setIsOther(false);
            onSelect('', '', '');
          } else {
            setIsOther(false);
            const person = people.find(p => p.name === e.target.value);
            onSelect(person?.name || '', person?.phone || '', person?.city || '');
          }
        }}
        className={inputClass}
      >
        <option value="">Select a person or add a new one</option>
        {people.map((p, i) => (
          <option key={`${idPrefix}-${i}`} value={p.name}>{p.name}</option>
        ))}
        <option value={OTHER_VALUE}>Other (new person)</option>
      </select>
      {isOther && (
        <input
          type="text"
          value={selectedName}
          onChange={(e) => onSelect(e.target.value, '', '')}
          placeholder="Enter name"
          className={inputClass}
        />
      )}
    </div>
  );
}

export default function PropertyDetails({
  index,
  propertyType,
  data,
  client1Name,
  client2Name,
  hasSpouse,
  corporations,
  trusts,
  partnerships,
  predefinedPeople,
  collateralCorporations,
  residenceAddresses = [],
  onAddTrust,
  onAddCorporation,
  client1EntityId,
  client2EntityId,
  onChange,
  onMultiChange,
}: Props) {
  const country = data.country || '';
  const owners = data.owners || [];
  const otherOwners = data.otherOwners || [];
  const ownershipPercentages = data.ownershipPercentages || {};
  const ownerEntityTypes = data.ownerEntityTypes || {};
  const propertyName = data.name || propertyType;

  const entityRegistry = useEntityRegistry();
  const peopleRepo = usePeopleRepository();

  const [showAddTrust, setShowAddTrust] = useState(false);
  const [newTrustName, setNewTrustName] = useState('');
  const [showAddCorp, setShowAddCorp] = useState(false);
  const [newCorpName, setNewCorpName] = useState('');

  // Build a name → EntityType resolution map for all possible owner names
  const ownerTypeMap: Record<string, EntityType> = {};
  if (client1Name) ownerTypeMap[client1Name] = 'person';
  if (hasSpouse && client2Name) ownerTypeMap[client2Name] = 'person';
  corporations.forEach(c => { if (c.legalName) ownerTypeMap[c.legalName] = 'corporation'; });
  trusts.forEach(t => { if (t.name) ownerTypeMap[t.name] = 'trust'; });
  partnerships.forEach(p => { if (p) ownerTypeMap[p] = 'partnership'; });
  otherOwners.forEach(o => { if (o.name?.trim()) ownerTypeMap[o.name] = 'person'; });

  // Create / reuse stable Property entity in the Entity Registry
  useEffect(() => {
    if (!propertyName.trim()) return;
    if (data.propertyEntityId) return;

    let cancelled = false;
    (async () => {
      const result = await entityRegistry.getOrCreateEntity(propertyName, 'property', {
        sourceSection: 'realEstate',
        completionStatus: 'identified',
        metadata: { propertyType },
      });
      if (cancelled) return;
      onMultiChange({ propertyEntityId: result.entity.id });
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyName, data.propertyEntityId]);

  // Sync mortgage/HELOC property entity ID when property entity is created
  useEffect(() => {
    if (data.propertyEntityId && data.hasDebt === 'yes' && !data.mortgagePropertyEntityId) {
      onMultiChange({ mortgagePropertyEntityId: data.propertyEntityId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.propertyEntityId, data.hasDebt]);

  // Resolve an owner name to its correct entity ID and entity type.
  // Uses existing canonical entities — never creates a person for a trust/corporation.
  const resolveOwnerEntity = useCallback(async (ownerName: string): Promise<{ id: string; type: EntityType } | null> => {
    const trimmed = ownerName.trim();
    if (!trimmed) return null;

    const expectedType = ownerTypeMap[trimmed] || 'person';

    // For clients, use existing entity IDs first — never create duplicates
    if (expectedType === 'person' && (trimmed === client1Name || trimmed === client2Name)) {
      // Use existing entity ID if available
      if (trimmed === client1Name && client1EntityId) {
        return { id: client1EntityId, type: 'person' };
      }
      if (trimmed === client2Name && client2EntityId) {
        return { id: client2EntityId, type: 'person' };
      }
      // Fall back to People Repository
      const person = await peopleRepo.getOrCreatePerson(trimmed, { personType: 'client' });
      if (person) {
        const result = await entityRegistry.getOrCreateEntity(trimmed, 'person', {
          sourceSection: 'aboutYou',
          sourceEntityRef: person.id,
          completionStatus: 'complete',
        });
        return { id: result.entity.id, type: 'person' };
      }
    }

    // For trusts, resolve from entity registry with type 'trust' — never 'person'
    if (expectedType === 'trust') {
      // Check if we already have a trust entity by exact name
      const existing = entityRegistry.getEntitiesByType('trust').find(
        e => e.normalizedName === trimmed.toLowerCase().replace(/\s+/g, ' ').trim()
      );
      if (existing) return { id: existing.id, type: 'trust' };
      // Create as trust (partial)
      const result = await entityRegistry.getOrCreateEntity(trimmed, 'trust', {
        sourceSection: 'realEstate',
        completionStatus: 'identified',
      });
      return { id: result.entity.id, type: 'trust' };
    }

    // For corporations, resolve from entity registry with type 'corporation' — never 'person'
    if (expectedType === 'corporation') {
      const existing = entityRegistry.getEntitiesByType('corporation').find(
        e => e.normalizedName === trimmed.toLowerCase().replace(/\s+/g, ' ').trim()
      );
      if (existing) return { id: existing.id, type: 'corporation' };
      const result = await entityRegistry.getOrCreateEntity(trimmed, 'corporation', {
        sourceSection: 'realEstate',
        completionStatus: 'identified',
      });
      return { id: result.entity.id, type: 'corporation' };
    }

    // For partnerships, use 'partnership' type
    if (expectedType === 'partnership') {
      const existing = entityRegistry.getEntitiesByType('partnership').find(
        e => e.normalizedName === trimmed.toLowerCase().replace(/\s+/g, ' ').trim()
      );
      if (existing) return { id: existing.id, type: 'partnership' };
      const result = await entityRegistry.getOrCreateEntity(trimmed, 'partnership', {
        sourceSection: 'realEstate',
        completionStatus: 'identified',
      });
      return { id: result.entity.id, type: 'partnership' };
    }

    // For other persons, create through People Repository then link to entity registry
    const person = await peopleRepo.getOrCreatePerson(trimmed);
    const result = await entityRegistry.getOrCreateEntity(trimmed, 'person', {
      sourceSection: 'realEstate',
      sourceEntityRef: person?.id,
      completionStatus: 'identified',
    });
    return { id: result.entity.id, type: 'person' };
  }, [entityRegistry, peopleRepo, ownerTypeMap, client1Name, client2Name, client1EntityId, client2EntityId]);

  // Create ownership relationships in the entity registry — uses correct entity types
  const syncOwnershipRelationships = useCallback(async (propertyId: string, ownerNames: string[], pcts: Record<string, string>) => {
    // Get current active ownership relationships for this property
    const currentRels = entityRegistry.getOwnersOf(propertyId);
    const resolvedOwnerIds = new Set<string>();

    for (const ownerName of ownerNames) {
      if (!ownerName.trim()) continue;
      const resolved = await resolveOwnerEntity(ownerName);
      if (!resolved) continue;
      resolvedOwnerIds.add(resolved.id);

      // Store entity type on the PropertyData
      const pct = pcts[ownerName] || '';
      await entityRegistry.createRelationship(resolved.id, propertyId, 'owns', {
        ownershipPercentage: pct,
        metadata: { sourceSection: 'realEstate', ownerEntityType: resolved.type },
      });
    }

    // Remove relationships for owners no longer in the list
    for (const rel of currentRels) {
      if (!resolvedOwnerIds.has(rel.sourceEntityId)) {
        await entityRegistry.removeRelationship(rel.id);
      }
    }

    // Update ownerEntityIds and ownerEntityTypes on PropertyData
    const newOwnerEntityTypes: Record<string, EntityType> = { ...ownerEntityTypes };
    for (const ownerName of ownerNames) {
      const resolved = await resolveOwnerEntity(ownerName);
      if (resolved) newOwnerEntityTypes[ownerName] = resolved.type;
    }
    const newOwnerEntityIds = Array.from(resolvedOwnerIds);
    onMultiChange({ ownerEntityIds: newOwnerEntityIds, ownerEntityTypes: newOwnerEntityTypes });
  }, [entityRegistry, resolveOwnerEntity, ownerEntityTypes]);


  // Handle residence address linking
  const handleResidenceLink = (residence: ResidenceAddress | 'manual') => {
    if (residence === 'manual') {
      onMultiChange({
        linkedResidence: 'manual',
        streetAddress: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
      });
    } else {
      onMultiChange({
        linkedResidence: residence.label,
        streetAddress: residence.streetAddress,
        city: residence.city,
        province: residence.province,
        postalCode: residence.postalCode,
        country: residence.country || 'Canada',
      });
    }
  };



  const capitalImprovements = data.capitalImprovements || [];

  const handleCapitalImprovementChange = (i: number, field: keyof CapitalImprovement, value: string | DocumentLocationRef | undefined) => {
    const updated = [...capitalImprovements];
    if (!updated[i]) updated[i] = { description: '', cost: '', year: '', recordsLocation: '' };
    updated[i] = { ...updated[i], [field]: value };
    onChange('capitalImprovements', updated);
  };

  const isCanada = country.toLowerCase() === 'canada';
  const isUS = country.toLowerCase() === 'united states' || country.toLowerCase() === 'usa' || country.toLowerCase() === 'us';

  const validOwnerOptions: string[] = Array.from(new Set([
    client1Name,
    ...(hasSpouse ? [client2Name] : []),
    ...corporations.map(c => c.legalName).filter(Boolean),
    ...trusts.map(t => t.name).filter(Boolean),
    ...partnerships.filter(Boolean),
    ...otherOwners.map(o => o.name).filter(n => n?.trim()),
  ]));
  const allOwnerNames: string[] = validOwnerOptions.filter(n => owners.includes(n));

  // Sync ownership relationships to the entity registry
  useEffect(() => {
    if (!data.propertyEntityId || allOwnerNames.length === 0) return;
    syncOwnershipRelationships(data.propertyEntityId, allOwnerNames, ownershipPercentages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.propertyEntityId, allOwnerNames.join('|'), JSON.stringify(ownershipPercentages)]);

  useEffect(() => {
    const stale = owners.filter(o => o?.trim() && !validOwnerOptions.includes(o));
    if (stale.length > 0) {
      const cleanedOwners = owners.filter(o => validOwnerOptions.includes(o));
      const cleanedPct = { ...ownershipPercentages };
      stale.forEach(name => delete cleanedPct[name]);
      onMultiChange({ owners: cleanedOwners, ownershipPercentages: cleanedPct });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validOwnerOptions.join('|')]);

  const hasOtherOwners = otherOwners.some(o => o.name?.trim());

  useEffect(() => {
    if (allOwnerNames.length === 1 && !hasOtherOwners) {
      const name = allOwnerNames[0];
      const updates: Partial<PropertyData> = {};
      if (ownershipPercentages[name] !== '100') {
        updates.ownershipPercentages = { [name]: '100' };
      }
      if (!data.purchasedBy) {
        updates.purchasedBy = 'clients';
      }
      if (Object.keys(updates).length > 0) onMultiChange(updates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allOwnerNames.join('|'), hasOtherOwners]);

  const totalPct = allOwnerNames.reduce((sum, name) => {
    const pct = parseFloat(ownershipPercentages[name] || '0');
    return sum + (isNaN(pct) ? 0 : pct);
  }, 0);

  const handleOwnerToggle = (name: string, checked: boolean) => {
    let updated: string[];
    if (checked) {
      updated = [...owners, name];
    } else {
      updated = owners.filter(o => o !== name);
      const newPct = { ...ownershipPercentages };
      delete newPct[name];
      onMultiChange({ ownershipPercentages: newPct });
    }
    onChange('owners', updated);
  };

  const handleOtherOwnerChange = (i: number, field: keyof OtherOwner, value: string) => {
    const updated = [...otherOwners];
    if (!updated[i]) updated[i] = { name: '', phone: '', city: '', relationship: '', hasMore: '' };
    updated[i] = { ...updated[i], [field]: value };
    onChange('otherOwners', updated);
  };

  const handleAddOtherOwner = () => {
    const updated = [...otherOwners, { name: '', phone: '', city: '', relationship: '', hasMore: '' }];
    onChange('otherOwners', updated);
  };

  const handleRemoveOtherOwner = (i: number) => {
    const removed = otherOwners[i];
    const updated = otherOwners.filter((_, idx) => idx !== i);
    if (removed?.name) {
      const newPct = { ...ownershipPercentages };
      delete newPct[removed.name];
      onMultiChange({ otherOwners: updated, ownershipPercentages: newPct });
    } else {
      onChange('otherOwners', updated);
    }
  };

  const handlePctChange = (name: string, value: string) => {
    const newPct = { ...ownershipPercentages, [name]: value };
    onChange('ownershipPercentages', newPct);
  };

  const purchasedByOwners = data.purchasedByOwners || [];
  const purchasedByOtherOwners = data.purchasedByOtherOwners || [];
  const purchasedByOwnershipPercentages = data.purchasedByOwnershipPercentages || {};



  const validPurchasedByOptions: string[] = Array.from(new Set([
    client1Name,
    ...(hasSpouse ? [client2Name] : []),
    ...corporations.map(c => c.legalName).filter(Boolean),
    ...trusts.map(t => t.name).filter(Boolean),
    ...partnerships.filter(Boolean),
    ...purchasedByOtherOwners.map(o => o.name).filter(n => n?.trim()),
  ]));
  const purchasedByAllOwnerNames: string[] = validPurchasedByOptions.filter(n => purchasedByOwners.includes(n));

  useEffect(() => {
    const stale = purchasedByOwners.filter(o => o?.trim() && !validPurchasedByOptions.includes(o));
    if (stale.length > 0) {
      const cleanedOwners = purchasedByOwners.filter(o => validPurchasedByOptions.includes(o));
      const cleanedPct = { ...purchasedByOwnershipPercentages };
      stale.forEach(name => delete cleanedPct[name]);
      onMultiChange({ purchasedByOwners: cleanedOwners, purchasedByOwnershipPercentages: cleanedPct });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validPurchasedByOptions.join('|')]);

  const purchasedByTotalPct = purchasedByAllOwnerNames.reduce((sum, name) => {
    const pct = parseFloat(purchasedByOwnershipPercentages[name] || '0');
    return sum + (isNaN(pct) ? 0 : pct);
  }, 0);

  const handlePurchasedByOwnerToggle = (name: string, checked: boolean) => {
    let updated: string[];
    if (checked) {
      updated = [...purchasedByOwners, name];
    } else {
      updated = purchasedByOwners.filter(o => o !== name);
      const newPct = { ...purchasedByOwnershipPercentages };
      delete newPct[name];
      onMultiChange({ purchasedByOwnershipPercentages: newPct });
    }
    onChange('purchasedByOwners', updated);
  };

  const handlePurchasedByOtherOwnerChange = (i: number, field: keyof OtherOwner, value: string) => {
    const updated = [...purchasedByOtherOwners];
    if (!updated[i]) updated[i] = { name: '', phone: '', city: '', relationship: '', hasMore: '' };
    updated[i] = { ...updated[i], [field]: value };
    onChange('purchasedByOtherOwners', updated);
  };

  const handleAddPurchasedByOtherOwner = () => {
    const updated = [...purchasedByOtherOwners, { name: '', phone: '', city: '', relationship: '', hasMore: '' }];
    onChange('purchasedByOtherOwners', updated);
  };

  const handleRemovePurchasedByOtherOwner = (i: number) => {
    const removed = purchasedByOtherOwners[i];
    const updated = purchasedByOtherOwners.filter((_, idx) => idx !== i);
    if (removed?.name) {
      const newPct = { ...purchasedByOwnershipPercentages };
      delete newPct[removed.name];
      onMultiChange({ purchasedByOtherOwners: updated, purchasedByOwnershipPercentages: newPct });
    } else {
      onChange('purchasedByOtherOwners', updated);
    }
  };

  const handlePurchasedByPctChange = (name: string, value: string) => {
    const newPct = { ...purchasedByOwnershipPercentages, [name]: value };
    onChange('purchasedByOwnershipPercentages', newPct);
  };

  const currentYear = new Date().getFullYear();

  const yearOptions: number[] = [];
  for (let y = currentYear; y >= 1900; y--) yearOptions.push(y);

  const isRental = propertyType.toLowerCase().includes('rental');
  const c1Pct = ownershipPercentages[client1Name] || '';
  const c2Pct = ownershipPercentages[client2Name] || '';

  const handlePurchasedByChange = (value: string) => {
    if (value !== 'other') {
      onMultiChange({
        purchasedBy: value,
        purchasedByOwners: [],
        purchasedByOtherOwners: [],
        purchasedByOwnershipPercentages: {},
      });
    } else {
      onChange('purchasedBy', value);
    }
  };

  return (
    <div className="border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-5 mt-2">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-600">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
          {index + 1}
        </div>
        <h3 className="text-lg font-semibold text-white">
          {data.name || `${propertyType} ${index + 1}`}
        </h3>
        {!isCanada && country && (
          <span className="flex items-center gap-1 ml-auto text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
            <AlertTriangle size={12} />
            Outside Canada
          </span>
        )}
      </div>

      {/* Property Name */}
      <div>
        <label className={labelClass}>Property Name</label>
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Enter a name for this property"
          className={inputClass}
        />
      </div>

      {/* Collateral for corporate debt — only shown when real estate was pledged in the Corporate Financial Connections step */}
      {collateralCorporations && collateralCorporations.length > 0 && (
        <div className="ml-2">
          <label className={labelClass}>
            {collateralCorporations.length === 1
              ? `Is this the property that is used as collateral for the debt of ${collateralCorporations[0]} as identified earlier in this questionnaire?`
              : `Is this the property that is used as collateral for the debt of one of the following companies as identified earlier in this questionnaire?`}
          </label>
          {collateralCorporations.length > 1 && (
            <ul className="text-sm text-gray-400 mb-3 ml-4 list-disc">
              {collateralCorporations.map((corp) => (
                <li key={corp}>{corp}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`collateral-corp-${index}-${propertyType}`}
                value="yes"
                checked={data.collateralForCorpDebt === 'yes'}
                onChange={() => onMultiChange({ collateralForCorpDebt: 'yes' })}
                className="mr-2"
              />
              <span className="text-gray-300">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`collateral-corp-${index}-${propertyType}`}
                value="no"
                checked={data.collateralForCorpDebt === 'no'}
                onChange={() => onMultiChange({ collateralForCorpDebt: 'no', collateralCorpName: undefined })}
                className="mr-2"
              />
              <span className="text-gray-300">No</span>
            </label>
          </div>
        </div>
      )}

      {/* Residence linking — reuse About You address */}
      {residenceAddresses.length > 0 && !data.linkedResidence && (
        <div className="border border-blue-600/30 rounded-lg bg-blue-900/10 p-4">
          <label className={labelClass}>
            <Home size={14} className="inline mr-1" />
            Is {propertyName} one of the residences already entered?
          </label>
          <div className="space-y-2">
            {residenceAddresses.map((res) => {
              const fullAddr = [res.streetAddress, res.city, res.province, res.postalCode].filter(Boolean).join(', ');
              return (
                <label key={res.label} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name={`residence-link-${index}`}
                    checked={false}
                    onChange={() => handleResidenceLink(res)}
                    className="mr-3"
                  />
                  <span className="text-gray-300">{res.label} — {fullAddr}</span>
                </label>
              );
            })}
            <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={`residence-link-${index}`}
                checked={false}
                onChange={() => handleResidenceLink('manual')}
                className="mr-3"
              />
              <span className="text-gray-300">No — another address</span>
            </label>
          </div>
        </div>
      )}

      {/* Linked residence indicator */}
      {data.linkedResidence && data.linkedResidence !== 'manual' && (
        <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-900/20 px-3 py-2 rounded-lg">
          <Home size={14} />
          <span>Linked to: {data.linkedResidence}</span>
          <button
            type="button"
            onClick={() => handleResidenceLink('manual')}
            className="ml-auto text-xs text-gray-400 hover:text-white underline"
          >
            Use a different address
          </button>
        </div>
      )}

      {/* Street Address */}
      <div>
        <label className={labelClass}>Street Address</label>
        <input
          type="text"
          value={data.streetAddress || ''}
          onChange={(e) => onChange('streetAddress', e.target.value)}
          placeholder="Enter street address"
          className={inputClass}
        />
      </div>

      {/* Unit / Suite */}
      <div>
        <label className={labelClass}>Unit / Suite <span className="text-gray-500 font-normal">(if applicable)</span></label>
        <input
          type="text"
          value={data.unit || ''}
          onChange={(e) => onChange('unit', e.target.value)}
          placeholder="Enter unit or suite number"
          className={inputClass}
        />
      </div>

      {/* Country */}
      <div>
        <label className={labelClass}>Country</label>
        <input
          type="text"
          value={country}
          onChange={(e) => onChange('country', e.target.value)}
          placeholder="Enter country"
          className={inputClass}
        />
      </div>

      {/* Province (Canada) */}
      {isCanada && (
        <div>
          <label className={labelClass}>Province</label>
          <select
            value={data.province || ''}
            onChange={(e) => onChange('province', e.target.value)}
            className={inputClass}
          >
            <option value="">Select province</option>
            {CANADA_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}

      {/* State (US) */}
      {isUS && (
        <div>
          <label className={labelClass}>State</label>
          <select
            value={data.state || ''}
            onChange={(e) => onChange('state', e.target.value)}
            className={inputClass}
          >
            <option value="">Select state</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* City */}
      {country && (
        <div>
          <label className={labelClass}>City</label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Enter city"
            className={inputClass}
          />
        </div>
      )}

      {/* Postal / ZIP Code */}
      {country && (
        <div>
          <label className={labelClass}>Postal / ZIP Code</label>
          <input
            type="text"
            value={data.postalCode || ''}
            onChange={(e) => onChange('postalCode', e.target.value)}
            placeholder="Enter postal or ZIP code"
            className={inputClass}
          />
        </div>
      )}

      {/* Location of Deeds — global Document Location Repository */}
      {country && (
        <div>
          <label className={labelClass}>Where are the deed/title documents for {propertyName} kept?</label>
          <DocumentLocationPicker
            label={`Deed/title documents for ${propertyName}`}
            value={data.locationOfDeeds}
            onChange={(ref) => onChange('locationOfDeeds', ref)}
            placeholder="Select or add a location"
          />
        </div>
      )}

      {/* Farm active engagement — Farm properties only */}
      {propertyType === 'Farm' && country && (
        <div>
          <label className={labelClass}>
            Has {client1Name}{hasSpouse ? `, ${client2Name}` : ''} or any children been actively engaged in the farm on a regular basis for at least two years?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`farmActiveEngagement-${index}`}
                value="yes"
                checked={data.farmActiveEngagement === 'yes'}
                onChange={() => onChange('farmActiveEngagement', 'yes')}
                className="mr-2"
              />
              <span className="text-gray-300">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`farmActiveEngagement-${index}`}
                value="no"
                checked={data.farmActiveEngagement === 'no'}
                onChange={() => onChange('farmActiveEngagement', 'no')}
                className="mr-2"
              />
              <span className="text-gray-300">No</span>
            </label>
          </div>
        </div>
      )}

      {/* Ownership */}
      {country && (
        <div className="pt-2 border-t border-gray-700">
          <label className="block text-sm font-semibold text-gray-200 mb-3">Current Ownership of {propertyName}</label>
          <div className="space-y-4">
            {/* People */}
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">People</span>
              <div className="space-y-2">
                {/* Client 1 */}
                {client1Name && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={owners.includes(client1Name)}
                      onChange={(e) => handleOwnerToggle(client1Name, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-white">{client1Name}</span>
                  </label>
                )}

                {/* Client 2 */}
                {hasSpouse && client2Name && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={owners.includes(client2Name)}
                      onChange={(e) => handleOwnerToggle(client2Name, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-white">{client2Name}</span>
                  </label>
                )}

                {/* Other persons added so far */}
                {otherOwners.map((oo, oi) => (
                  oo.name?.trim() ? (
                    <label key={`oo-${oi}`} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={owners.includes(oo.name)}
                        onChange={(e) => handleOwnerToggle(oo.name, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-white">{oo.name}</span>
                    </label>
                  ) : null
                ))}
              </div>
            </div>

            {/* Family Trusts */}
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">Family Trusts</span>
              {trusts.length > 0 ? (
                <div className="space-y-2">
                  {trusts.map((trust, ti) => {
                    if (!trust.name) return null;
                    return (
                      <label key={`trust-${ti}`} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={owners.includes(trust.name)}
                          onChange={(e) => handleOwnerToggle(trust.name, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-white">{trust.name}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic mb-2">No Family Trusts have been added yet.</div>
              )}
              {onAddTrust && (
                <button
                  type="button"
                  onClick={() => setShowAddTrust(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                >
                  <Plus size={14} /> Add a Family Trust
                </button>
              )}
            </div>

            {/* Corporations */}
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">Corporations</span>
              {corporations.length > 0 ? (
                <div className="space-y-2">
                  {corporations.map((corp, ci) => {
                    if (!corp.legalName) return null;
                    return (
                      <label key={`corp-${ci}`} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={owners.includes(corp.legalName)}
                          onChange={(e) => handleOwnerToggle(corp.legalName, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-white">{corp.legalName}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic mb-2">No Corporations have been added yet.</div>
              )}
              {onAddCorporation && (
                <button
                  type="button"
                  onClick={() => setShowAddCorp(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                >
                  <Plus size={14} /> Add a Corporation
                </button>
              )}
            </div>

            {/* Partnerships */}
            {partnerships.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">Partnerships</span>
                <div className="space-y-2">
                  {partnerships.map((pName, pi) => {
                    if (!pName) return null;
                    return (
                      <label key={`partner-${pi}`} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={owners.includes(pName)}
                          onChange={(e) => handleOwnerToggle(pName, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-white">{pName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Add Trust inline form */}
          {showAddTrust && (
            <div className="mt-3 ml-6 border border-blue-600/30 rounded-lg bg-blue-900/10 p-4 space-y-3">
              <label className={labelClass}>Family Trust Name</label>
              <input
                type="text"
                value={newTrustName}
                onChange={(e) => setNewTrustName(e.target.value)}
                placeholder="Enter the legal name of the Family Trust"
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newTrustName.trim() && onAddTrust) {
                      onAddTrust(newTrustName.trim());
                      handleOwnerToggle(newTrustName.trim(), true);
                      setNewTrustName('');
                      setShowAddTrust(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
                >
                  Add Trust as Owner
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddTrust(false); setNewTrustName(''); }}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add Corporation inline form */}
          {showAddCorp && (
            <div className="mt-3 ml-6 border border-blue-600/30 rounded-lg bg-blue-900/10 p-4 space-y-3">
              <label className={labelClass}>Corporation Legal Name</label>
              <input
                type="text"
                value={newCorpName}
                onChange={(e) => setNewCorpName(e.target.value)}
                placeholder="Enter the legal name of the Corporation"
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newCorpName.trim() && onAddCorporation) {
                      onAddCorporation(newCorpName.trim());
                      handleOwnerToggle(newCorpName.trim(), true);
                      setNewCorpName('');
                      setShowAddCorp(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
                >
                  Add Corporation as Owner
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddCorp(false); setNewCorpName(''); }}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Other owner collection */}
          <div className="mt-4 ml-6 space-y-4">
            {otherOwners.map((oo, oi) => (
              <div key={oi} className="border border-gray-600 rounded-lg p-4 bg-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Additional owner {oi + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOtherOwner(oi)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div>
                  <label className={labelClass}>Name</label>
                  <PersonNameSelect
                    idPrefix={`other-owner-${index}-${oi}`}
                    people={predefinedPeople}
                    selectedName={oo.name}
                    onSelect={(name, phone, city) => {
                      const updated = [...otherOwners];
                      const oldName = updated[oi].name;
                      updated[oi] = { ...updated[oi], name, phone, city };
                      const oldKey = oldName || '';
                      let newOwners = [...owners];
                      if (newOwners.includes(oldKey)) {
                        newOwners = newOwners.map(o => o === oldKey ? name : o);
                      }
                      newOwners = newOwners.filter(n => n?.trim());
                      const newPct: Record<string, string> = { ...ownershipPercentages };
                      if (newPct[oldKey] !== undefined) {
                        newPct[name] = newPct[oldKey];
                        delete newPct[oldKey];
                      }
                      onMultiChange({ otherOwners: updated, owners: newOwners, ownershipPercentages: newPct });
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="text"
                      value={oo.phone}
                      onChange={(e) => handleOtherOwnerChange(oi, 'phone', e.target.value)}
                      placeholder="Enter phone"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>City of Residence</label>
                    <input
                      type="text"
                      value={oo.city}
                      onChange={(e) => handleOtherOwnerChange(oi, 'city', e.target.value)}
                      placeholder="Enter city"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Relationship</label>
                    <input
                      type="text"
                      value={oo.relationship}
                      onChange={(e) => handleOtherOwnerChange(oi, 'relationship', e.target.value)}
                      placeholder="Enter relationship"
                      className={inputClass}
                    />
                  </div>
                </div>
                {oi === otherOwners.length - 1 && (
                  <div>
                    <label className={labelClass}>Are there additional owners of {propertyName}?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`hasMore-${index}-${oi}`}
                          value="yes"
                          checked={oo.hasMore === 'yes'}
                          onChange={() => {
                            handleOtherOwnerChange(oi, 'hasMore', 'yes');
                            handleAddOtherOwner();
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-300">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`hasMore-${index}-${oi}`}
                          value="no"
                          checked={oo.hasMore === 'no'}
                          onChange={() => {
                            handleOtherOwnerChange(oi, 'hasMore', 'no');
                            const trimmed = otherOwners.slice(0, oi + 1).map((o, idx) =>
                              idx === oi ? { ...o, hasMore: 'no' as const } : o
                            );
                            const removedNames = otherOwners.slice(oi + 1).map((o) => o.name).filter(Boolean);
                            const newPct = { ...ownershipPercentages };
                            removedNames.forEach((n) => delete newPct[n]);
                            onMultiChange({ otherOwners: trimmed, ownershipPercentages: newPct });
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-300">No</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {otherOwners.length === 0 && (
              <div>
                <label className={labelClass}>Are there additional owners of {propertyName}?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`hasAdditionalOwners-${index}`}
                      value="yes"
                      checked={data.hasAdditionalOwners === 'yes'}
                      onChange={() => {
                        onMultiChange({ hasAdditionalOwners: 'yes' });
                        handleAddOtherOwner();
                      }}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`hasAdditionalOwners-${index}`}
                      value="no"
                      checked={data.hasAdditionalOwners === 'no'}
                      onChange={() => {
                        onMultiChange({ hasAdditionalOwners: 'no', otherOwners: [], ownershipPercentages: Object.fromEntries(Object.entries(ownershipPercentages).filter(([n]) => owners.includes(n))), coOwnershipAgreement: '', coOwnershipAgreementLocation: '' });
                      }}
                      className="mr-2"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Ownership percentages */}
          {allOwnerNames.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-200 mb-3">{propertyName} Ownership Percentages</label>
                <div className="space-y-3">
                  {allOwnerNames.map((name) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-white text-sm flex-1">{name}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ownershipPercentages[name] || ''}
                        onChange={(e) => handlePctChange(name, e.target.value)}
                        placeholder="0"
                        className="w-20 px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-right"
                      />
                      <span className="text-gray-400 text-sm">%</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                    <span className="text-sm font-medium text-gray-300">Total:</span>
                    <span className={`text-sm font-bold ${totalPct === 100 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalPct}%
                    </span>
                    {totalPct !== 100 && totalPct > 0 && (
                      <span className="text-xs text-red-400 ml-2">Must add up to 100%</span>
                    )}
                  </div>
                </div>
            </div>
          )}

          {/* Title holding — only when more than one owner */}
          {allOwnerNames.length > 1 && (
            <div className="mt-5 pt-4 border-t border-gray-700">
              <label className="block text-sm font-semibold text-gray-200 mb-1">Ownership Details</label>
              <p className="text-sm text-gray-300 mb-3">
                Is the title for {propertyName} held as Joint Tenants with Right-of-Survivorship, or as Tenants-in-Common?
              </p>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`titleHolding-${index}`}
                    value="joint_tenants"
                    checked={data.titleHolding === 'joint_tenants'}
                    onChange={() => onChange('titleHolding', 'joint_tenants')}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Joint Tenants with Right-of-Survivorship</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`titleHolding-${index}`}
                    value="tenants_in_common"
                    checked={data.titleHolding === 'tenants_in_common'}
                    onChange={() => onChange('titleHolding', 'tenants_in_common')}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Tenants-in-Common</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`titleHolding-${index}`}
                    value="not_sure"
                    checked={data.titleHolding === 'not_sure'}
                    onChange={() => onChange('titleHolding', 'not_sure')}
                    className="mr-2"
                  />
                  <span className="text-gray-300">I/We are not sure</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Co-ownership agreement — shown when any non-spouse other owner exists */}
      {(() => {
        const nonSpouseOthers = otherOwners.filter(o => o.name?.trim() && o.name !== client2Name);
        return nonSpouseOthers.length > 0 ? (
          <div className="pt-4 border-t border-gray-700 space-y-4">
            <div>
              <label className={labelClass}>Is there a co-ownership agreement for {propertyName}?</label>
              <p className="text-xs text-gray-400 mb-3 italic">
                If {propertyName} is owned with someone other than a spouse, is there a written agreement detailing how expenses are shared or how a buyout is triggered?
              </p>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`coOwnershipAgreement-${index}`}
                    value="yes"
                    checked={data.coOwnershipAgreement === 'yes'}
                    onChange={() => onChange('coOwnershipAgreement', 'yes')}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`coOwnershipAgreement-${index}`}
                    value="no"
                    checked={data.coOwnershipAgreement === 'no'}
                    onChange={() => onMultiChange({ coOwnershipAgreement: 'no', coOwnershipAgreementLocation: '' })}
                    className="mr-2"
                  />
                  <span className="text-gray-300">No</span>
                </label>
              </div>
            </div>
            {data.coOwnershipAgreement === 'yes' && (
              <div>
                <label className={labelClass}>Location of the co-ownership agreement for {propertyName}</label>
                <DocumentLocationPicker
                  label={`Co-ownership agreement for ${propertyName}`}
                  value={data.coOwnershipAgreementLocation}
                  onChange={(ref) => onChange('coOwnershipAgreementLocation', ref)}
                  placeholder="Select or add a location"
                />
              </div>
            )}
          </div>
        ) : null;
      })()}

      {/* Purchase year + purchased by (shown once ownership structure is established) */}
      {country && allOwnerNames.length > 0 && (
        <div className="pt-4 border-t border-gray-700 space-y-5">
          {/* Purchase year */}
          <div>
            <label className={labelClass}>What year was {propertyName} purchased?</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <select
                value={data.purchaseYear && data.purchaseYear !== 'not_sure' ? data.purchaseYear : ''}
                onChange={(e) => onChange('purchaseYear', e.target.value)}
                className={inputClass}
                disabled={data.purchaseYear === 'not_sure'}
              >
                <option value="">Select year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
              <label className="flex items-center whitespace-nowrap">
                <input
                  type="radio"
                  name={`purchaseYearNotsure-${index}`}
                  checked={data.purchaseYear === 'not_sure'}
                  onChange={() => onChange('purchaseYear', 'not_sure')}
                  className="mr-2"
                />
                <span className="text-gray-300">I'm/We're not sure</span>
              </label>
            </div>
          </div>

          {/* Purchased by */}
          <div>
            <label className={labelClass}>Who purchased {propertyName}?</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`purchasedBy-${index}`}
                  value="clients"
                  checked={data.purchasedBy === 'clients'}
                  onChange={() => handlePurchasedByChange('clients')}
                  className="mr-2"
                />
                <span className="text-white">
                  {allOwnerNames.length > 0
                    ? allOwnerNames.map((name, i) => {
                        const pct = ownershipPercentages[name];
                        return (i > 0 ? ' and ' : '') + name + (pct ? ` (${pct}%)` : '');
                      }).join('')
                    : client1Name + (c1Pct ? ` (${c1Pct}%)` : '') + (hasSpouse && client2Name ? ` and ${client2Name}${c2Pct ? ` (${c2Pct}%)` : ''}` : '')}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`purchasedBy-${index}`}
                  value="other"
                  checked={data.purchasedBy === 'other'}
                  onChange={() => handlePurchasedByChange('other')}
                  className="mr-2"
                />
                <span className="text-white">Other</span>
              </label>
            </div>

            {/* Other: repeat ownership field/logic */}
            {data.purchasedBy === 'other' && (
              <div className="mt-4 ml-6">
                <label className="block text-sm font-semibold text-gray-200 mb-3">Who purchased {propertyName}?</label>
                <div className="space-y-2">
                  {/* Client 1 */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={purchasedByOwners.includes(client1Name)}
                      onChange={(e) => handlePurchasedByOwnerToggle(client1Name, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-white">{client1Name}</span>
                  </label>

                  {/* Client 2 */}
                  {hasSpouse && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={purchasedByOwners.includes(client2Name)}
                        onChange={(e) => handlePurchasedByOwnerToggle(client2Name, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-white">{client2Name}</span>
                    </label>
                  )}

                  {/* Corporations */}
                  {corporations.map((corp, ci) => {
                    if (!corp.legalName) return null;
                    return (
                      <label key={`pb-corp-${ci}`} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={purchasedByOwners.includes(corp.legalName)}
                          onChange={(e) => handlePurchasedByOwnerToggle(corp.legalName, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-white">{corp.legalName}</span>
                      </label>
                    );
                  })}

                  {/* Family Trusts */}
                  {trusts.map((trust, ti) => {
                    if (!trust.name) return null;
                    return (
                      <label key={`pb-trust-${ti}`} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={purchasedByOwners.includes(trust.name)}
                          onChange={(e) => handlePurchasedByOwnerToggle(trust.name, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-white">{trust.name}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Partnerships */}
                {partnerships.map((pName, pi) => {
                  if (!pName) return null;
                  return (
                    <label key={`pb-partner-${pi}`} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={purchasedByOwners.includes(pName)}
                        onChange={(e) => handlePurchasedByOwnerToggle(pName, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-white">{pName}</span>
                    </label>
                  );
                })}

                {/* Other owners added so far */}
                {purchasedByOtherOwners.map((oo, oi) => (
                  oo.name?.trim() ? (
                    <label key={`pb-oo-${oi}`} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={purchasedByOwners.includes(oo.name)}
                        onChange={(e) => handlePurchasedByOwnerToggle(oo.name, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-white">{oo.name}</span>
                    </label>
                  ) : null
                ))}

              {/* Other owner collection */}
              <div className="mt-4 ml-6 space-y-4">
                {purchasedByOtherOwners.map((oo, oi) => (
                  <div key={oi} className="border border-gray-600 rounded-lg p-4 bg-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Additional purchaser {oi + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePurchasedByOtherOwner(oi)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div>
                      <label className={labelClass}>Name</label>
                      <PersonNameSelect
                        idPrefix={`purchasedby-owner-${index}-${oi}`}
                        people={predefinedPeople}
                        selectedName={oo.name}
                        onSelect={(name, phone, city) => {
                          const updated = [...purchasedByOtherOwners];
                          const oldName = updated[oi].name;
                          updated[oi] = { ...updated[oi], name, phone, city };
                          const oldKey = oldName || '';
                          let newOwners = [...purchasedByOwners];
                          if (newOwners.includes(oldKey)) {
                            newOwners = newOwners.map(o => o === oldKey ? name : o);
                          }
                          newOwners = newOwners.filter(n => n?.trim());
                          const newPct: Record<string, string> = { ...purchasedByOwnershipPercentages };
                          if (newPct[oldKey] !== undefined) {
                            newPct[name] = newPct[oldKey];
                            delete newPct[oldKey];
                          }
                          onMultiChange({ purchasedByOtherOwners: updated, purchasedByOwners: newOwners, purchasedByOwnershipPercentages: newPct });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input
                          type="text"
                          value={oo.phone}
                          onChange={(e) => handlePurchasedByOtherOwnerChange(oi, 'phone', e.target.value)}
                          placeholder="Enter phone"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>City of Residence</label>
                        <input
                          type="text"
                          value={oo.city}
                          onChange={(e) => handlePurchasedByOtherOwnerChange(oi, 'city', e.target.value)}
                          placeholder="Enter city"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Relationship</label>
                        <input
                          type="text"
                          value={oo.relationship}
                          onChange={(e) => handlePurchasedByOtherOwnerChange(oi, 'relationship', e.target.value)}
                          placeholder="Enter relationship"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    {oi === purchasedByOtherOwners.length - 1 && (
                      <div>
                        <label className={labelClass}>Are there additional purchasers of {propertyName}?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`purchasedBy-hasMore-${index}-${oi}`}
                              value="yes"
                              checked={oo.hasMore === 'yes'}
                              onChange={() => {
                                handlePurchasedByOtherOwnerChange(oi, 'hasMore', 'yes');
                                handleAddPurchasedByOtherOwner();
                              }}
                              className="mr-2"
                            />
                            <span className="text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`purchasedBy-hasMore-${index}-${oi}`}
                              value="no"
                              checked={oo.hasMore === 'no'}
                              onChange={() => {
                                handlePurchasedByOtherOwnerChange(oi, 'hasMore', 'no');
                                const trimmed = purchasedByOtherOwners.slice(0, oi + 1).map((o, idx) =>
                                  idx === oi ? { ...o, hasMore: 'no' as const } : o
                                );
                                const removedNames = purchasedByOtherOwners.slice(oi + 1).map((o) => o.name).filter(Boolean);
                                const newPct = { ...purchasedByOwnershipPercentages };
                                removedNames.forEach((n) => delete newPct[n]);
                                onMultiChange({ purchasedByOtherOwners: trimmed, purchasedByOwnershipPercentages: newPct });
                              }}
                              className="mr-2"
                            />
                            <span className="text-gray-300">No</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {purchasedByOtherOwners.length === 0 && (
                  <div>
                    <label className={labelClass}>Are there additional purchasers of {propertyName}?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`purchasedByHasAdditionalOwners-${index}`}
                          value="yes"
                          checked={data.purchasedByHasAdditionalOwners === 'yes'}
                          onChange={() => {
                            onMultiChange({ purchasedByHasAdditionalOwners: 'yes' });
                            handleAddPurchasedByOtherOwner();
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-300">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`purchasedByHasAdditionalOwners-${index}`}
                          value="no"
                          checked={data.purchasedByHasAdditionalOwners === 'no'}
                          onChange={() => {
                            onMultiChange({ purchasedByHasAdditionalOwners: 'no', purchasedByOtherOwners: [], purchasedByOwnershipPercentages: Object.fromEntries(Object.entries(purchasedByOwnershipPercentages).filter(([n]) => purchasedByOwners.includes(n))) });
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-300">No</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Ownership percentages */}
              {purchasedByAllOwnerNames.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">{propertyName} Ownership Percentages</label>
                  <div className="space-y-3">
                    {purchasedByAllOwnerNames.map((name) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-white text-sm flex-1">{name}</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={purchasedByOwnershipPercentages[name] || ''}
                          onChange={(e) => handlePurchasedByPctChange(name, e.target.value)}
                          placeholder="0"
                          className="w-20 px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-right"
                        />
                        <span className="text-gray-400 text-sm">%</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                      <span className="text-sm font-medium text-gray-300">Total:</span>
                      <span className={`text-sm font-bold ${purchasedByTotalPct === 100 ? 'text-green-400' : 'text-red-400'}`}>
                        {purchasedByTotalPct}%
                      </span>
                      {purchasedByTotalPct !== 100 && purchasedByTotalPct > 0 && (
                        <span className="text-xs text-red-400 ml-2">Must add up to 100%</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Total purchase price */}
      <div>
        <label className={labelClass}>What was the total purchase price of {propertyName} including legal fees and land transfer taxes?</label>
        <input
          type="text"
          value={data.purchasePrice || ''}
          onChange={(e) => onChange('purchasePrice', e.target.value)}
          placeholder="Enter total purchase price"
          className={inputClass}
        />
      </div>

      {/* Documents location */}
      <div>
        <label className={labelClass}>Where are the documents for {propertyName} kept?</label>
        <DocumentLocationPicker
          label={`General property documents for ${propertyName}`}
          value={data.documentsLocation}
          onChange={(ref) => onChange('documentsLocation', ref)}
          placeholder="Select or add a location"
        />
      </div>

      <div>
        <label className={labelClass}>Is there a mortgage or debt associated with {propertyName}?</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name={`hasDebt-${index}`}
              value="yes"
              checked={data.hasDebt === 'yes'}
              onChange={() => onMultiChange({ hasDebt: 'yes' })}
              className="mr-2"
            />
            <span className="text-white">Yes</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name={`hasDebt-${index}`}
              value="no"
              checked={data.hasDebt === 'no'}
              onChange={() => onMultiChange({
                hasDebt: 'no', debtType: '',
                mortgageBalance: '', mortgageLender: '', mortgageNumber: '',
                mortgagePayment: '', mortgagePaymentFrequency: '', mortgagePaymentFrequencyOther: '',
                mortgageInterestRate: '', mortgageInterestRateType: '', mortgageRenewalDate: '', mortgageRenewalDateUnknown: '',
                mortgageAmortizationYears: '', mortgageAmortizationUnknown: '',
                mortgageResponsibleParties: [], mortgageOtherBorrowers: [], mortgageOtherParties: [],
                mortgagePaymentSource: '', mortgagePaymentSourceOther: '',
                mortgageBrokerLender: '', mortgageBrokerContactName: '', mortgageBrokerContactPhone: '', mortgageBrokerContactEmail: '',
                mortgageInsuranceTypes: [], mortgageInsuranceProviders: {}, mortgageInsurancePolicyNumbers: {}, mortgageInsuranceDocLocations: {},
                mortgageSpecialNotes: '', mortgageDocLocation: '',
                helocLenderChoice: '', helocLender: '', helocAccountNumber: '', helocNumber: '', helocBalance: '', helocCreditLimit: '', helocInterestRate: '', helocInterestRateType: '', helocPrimePlus: '', helocPaymentType: '', helocPaymentMethod: '', helocPaymentSource: '', helocPaymentSourceOther: '', helocResponsibleParties: [], helocOtherBorrowers: [], helocOtherParties: [], helocPrimaryUses: [], helocPrimaryUseOther: '', helocActivelyUsed: '', helocSpecialNotes: '', helocDocLocation: '', helocHasAutoPayments: '', helocAutoPaymentsDescription: '',
              })}
              className="mr-2"
            />
            <span className="text-white">No</span>
          </label>
        </div>
      </div>

      {data.hasDebt === 'yes' && (
        <Subsection title={`${propertyName} - Debt Information`}>
          <div>
                <label className={labelClass}>What type of debt is associated with {propertyName}?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`debtType-${index}`}
                      value="mortgage"
                      checked={data.debtType === 'mortgage'}
                      onChange={() => onMultiChange({
                        debtType: 'mortgage',
                        mortgageBalance: '', mortgageLender: '', mortgageNumber: '',
                        mortgagePayment: '', mortgagePaymentFrequency: '', mortgagePaymentFrequencyOther: '',
                        mortgageInterestRate: '', mortgageRenewalDate: '', mortgageRenewalDateUnknown: '',
                        mortgageAmortizationYears: '', mortgageAmortizationUnknown: '',
                        mortgageResponsibleParties: [], mortgageOtherBorrowers: [], mortgageOtherParties: [],
                        mortgagePaymentSource: '', mortgagePaymentSourceOther: '',
                    mortgageBrokerLender: '', mortgageBrokerContactName: '', mortgageBrokerContactPhone: '', mortgageBrokerContactEmail: '',
                    mortgageInsuranceTypes: [], mortgageInsuranceProviders: {}, mortgageInsurancePolicyNumbers: {}, mortgageInsuranceDocLocations: {},
                    mortgageSpecialNotes: '', mortgageDocLocation: '',
                    helocLenderChoice: '', helocLender: '', helocAccountNumber: '', helocNumber: '', helocBalance: '', helocCreditLimit: '', helocInterestRate: '', helocInterestRateType: '', helocPrimePlus: '', helocPaymentType: '', helocPaymentMethod: '', helocPaymentSource: '', helocPaymentSourceOther: '', helocResponsibleParties: [], helocOtherBorrowers: [], helocOtherParties: [], helocPrimaryUses: [], helocPrimaryUseOther: '', helocActivelyUsed: '', helocSpecialNotes: '', helocDocLocation: '', helocHasAutoPayments: '', helocAutoPaymentsDescription: '',
                      })}
                      className="mr-2"
                    />
                    <span className="text-white">Mortgage</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`debtType-${index}`}
                      value="heloc"
                      checked={data.debtType === 'heloc'}
                      onChange={() => onMultiChange({
                        debtType: 'heloc',
                        helocLenderChoice: '', helocLender: '', helocAccountNumber: '', helocNumber: '', helocBalance: '', helocCreditLimit: '', helocInterestRate: '', helocInterestRateType: '', helocPrimePlus: '', helocPaymentType: '', helocPaymentMethod: '', helocPaymentSource: '', helocPaymentSourceOther: '', helocResponsibleParties: [], helocOtherBorrowers: [], helocOtherParties: [], helocPrimaryUses: [], helocPrimaryUseOther: '', helocActivelyUsed: '', helocSpecialNotes: '', helocDocLocation: '', helocHasAutoPayments: '', helocAutoPaymentsDescription: '',
                      })}
                      className="mr-2"
                    />
                    <span className="text-white">Home Equity Line of Credit (HELOC)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`debtType-${index}`}
                      value="both"
                      checked={data.debtType === 'both'}
                      onChange={() => onMultiChange({
                        debtType: 'both',
                        helocLenderChoice: '', helocLender: '', helocAccountNumber: '', helocNumber: '', helocBalance: '', helocCreditLimit: '', helocInterestRate: '', helocInterestRateType: '', helocPrimePlus: '', helocPaymentType: '', helocPaymentMethod: '', helocPaymentSource: '', helocPaymentSourceOther: '', helocResponsibleParties: [], helocOtherBorrowers: [], helocOtherParties: [], helocPrimaryUses: [], helocPrimaryUseOther: '', helocActivelyUsed: '', helocSpecialNotes: '', helocDocLocation: '', helocHasAutoPayments: '', helocAutoPaymentsDescription: '',
                      })}
                      className="mr-2"
                    />
                    <span className="text-white">Both</span>
                  </label>
                </div>
              </div>

              {/* Mortgage branch — shows when Mortgage or Both is selected */}
              {(data.debtType === 'mortgage' || data.debtType === 'both') && (
                <div className="ml-6 space-y-5">
                  <Subsection title={`${propertyName} - Mortgage`}>
                    <div>
                      <label className={labelClass}>Approximately how much is still owing on the mortgage for {propertyName}?</label>
                      <p className="text-xs text-gray-400 mb-2 italic">Outstanding Balance</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="text"
                          value={data.mortgageBalance || ''}
                          onChange={(e) => onChange('mortgageBalance', e.target.value)}
                          placeholder="___________"
                          className={`${inputClass} pl-7`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Who is the lender for the mortgage on {propertyName}?</label>
                      <p className="text-xs text-gray-400 mb-2 italic">Institution / Lender</p>
                      <input
                        type="text"
                        value={data.mortgageLender || ''}
                        onChange={(e) => onChange('mortgageLender', e.target.value)}
                        placeholder="Enter institution / lender"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Mortgage Number for {propertyName} (Optional)</label>
                      <p className="text-xs text-gray-400 mb-2 italic">Mortgage / Loan Number</p>
                      <input
                        type="text"
                        value={data.mortgageNumber || ''}
                        onChange={(e) => onChange('mortgageNumber', e.target.value)}
                        placeholder="Enter mortgage / loan number"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>What is the regular mortgage payment for {propertyName}?</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="text"
                          value={data.mortgagePayment || ''}
                          onChange={(e) => onChange('mortgagePayment', e.target.value)}
                          placeholder="___________"
                          className={`${inputClass} pl-7`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>How often is the mortgage payment for {propertyName} made?</label>
                      <div className="space-y-2">
                        {['Weekly', 'Bi-weekly', 'Semi-monthly', 'Monthly'].map((freq) => (
                          <label key={freq} className="flex items-center">
                            <input
                              type="radio"
                              name={`mortgagePaymentFreq-${index}`}
                              value={freq.toLowerCase().replace('-', '_')}
                              checked={data.mortgagePaymentFrequency === freq.toLowerCase().replace('-', '_')}
                              onChange={() => onMultiChange({ mortgagePaymentFrequency: freq.toLowerCase().replace('-', '_'), mortgagePaymentFrequencyOther: '' })}
                              className="mr-2"
                            />
                            <span className="text-white">{freq}</span>
                          </label>
                        ))}
                        <div>
                          <label className="flex items-center mb-2">
                            <input
                              type="radio"
                              name={`mortgagePaymentFreq-${index}`}
                              value="other"
                              checked={data.mortgagePaymentFrequency === 'other'}
                              onChange={() => onChange('mortgagePaymentFrequency', 'other')}
                              className="mr-2"
                            />
                            <span className="text-white">Other</span>
                          </label>
                          {data.mortgagePaymentFrequency === 'other' && (
                            <input
                              type="text"
                              value={data.mortgagePaymentFrequencyOther || ''}
                              onChange={(e) => onChange('mortgagePaymentFrequencyOther', e.target.value)}
                              placeholder="Specify other frequency"
                              className={inputClass}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>What is the current interest rate on the mortgage for {propertyName}?</label>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="relative max-w-[120px]">
                          <input
                            type="text"
                            value={data.mortgageInterestRate || ''}
                            onChange={(e) => onChange('mortgageInterestRate', e.target.value)}
                            placeholder="____"
                            className={inputClass}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                          {['Fixed Rate', 'Floating Rate', 'I/We are not sure'].map((rateType) => (
                            <label key={rateType} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`mortgageInterestRateType-${index}`}
                                value={rateType}
                                checked={data.mortgageInterestRateType === rateType}
                                onChange={() => onChange('mortgageInterestRateType', rateType)}
                                className="mr-1"
                              />
                              <span className="text-white">{rateType}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>When is the mortgage for {propertyName} up for renewal?</label>
                      <input
                        type="date"
                        value={data.mortgageRenewalDate || ''}
                        onChange={(e) => onChange('mortgageRenewalDate', e.target.value)}
                        disabled={data.mortgageRenewalDateUnknown === 'yes'}
                        className={inputClass}
                      />
                      <label className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={data.mortgageRenewalDateUnknown === 'yes'}
                          onChange={(e) => onChange('mortgageRenewalDateUnknown', e.target.checked ? 'yes' : '')}
                          className="mr-2"
                        />
                        <span className="text-white">I don't know</span>
                      </label>
                    </div>

                    <div>
                      <label className={labelClass}>Approximately how many years remain on the amortization for the mortgage on {propertyName}?</label>
                      <select
                        value={data.mortgageAmortizationYears || ''}
                        onChange={(e) => onChange('mortgageAmortizationYears', e.target.value)}
                        disabled={data.mortgageAmortizationUnknown === 'yes'}
                        className={inputClass}
                      >
                        <option value="">Select years</option>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((y) => (
                          <option key={y} value={String(y)}>{y} Year{y > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      <label className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={data.mortgageAmortizationUnknown === 'yes'}
                          onChange={(e) => onMultiChange({
                            mortgageAmortizationUnknown: e.target.checked ? 'yes' : '',
                            mortgageAmortizationYears: e.target.checked ? '' : data.mortgageAmortizationYears,
                          })}
                          className="mr-2"
                        />
                        <span className="text-white">Not sure</span>
                      </label>
                    </div>

                    {/* Who is legally responsible for this mortgage? */}
                    <div>
                      <label className={labelClass}>Who is legally responsible for the mortgage on {propertyName}?</label>
                      <div className="space-y-2">
                        {/* Client 1 */}
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(data.mortgageResponsibleParties || []).includes('client1')}
                            onChange={(e) => {
                              const current = data.mortgageResponsibleParties || [];
                              const updated = e.target.checked
                                ? [...current, 'client1']
                                : current.filter((p) => p !== 'client1');
                              onChange('mortgageResponsibleParties', updated);
                            }}
                            className="mr-2"
                          />
                          <span className="text-white">{client1Name} - ({ownershipPercentages[client1Name] || '___'}% Owner)</span>
                        </label>

                        {/* Client 2 (if spouse exists) */}
                        {hasSpouse && client2Name && (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(data.mortgageResponsibleParties || []).includes('client2')}
                              onChange={(e) => {
                                const current = data.mortgageResponsibleParties || [];
                                const updated = e.target.checked
                                  ? [...current, 'client2']
                                  : current.filter((p) => p !== 'client2');
                                onChange('mortgageResponsibleParties', updated);
                              }}
                              className="mr-2"
                            />
                            <span className="text-white">{client2Name} - ({ownershipPercentages[client2Name] || '___'}% Owner)</span>
                          </label>
                        )}

                        {/* Anyone indicated previously as an owner */}
                        {otherOwners.filter((o) => o.name?.trim()).length > 0 && (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(data.mortgageResponsibleParties || []).includes('other-owners')}
                              onChange={(e) => {
                                const current = data.mortgageResponsibleParties || [];
                                const updated = e.target.checked
                                  ? [...current, 'other-owners']
                                  : current.filter((p) => p !== 'other-owners');
                                onChange('mortgageResponsibleParties', updated);
                              }}
                              className="mr-2"
                            />
                            <span className="text-white">
                              {otherOwners.filter((o) => o.name?.trim()).map((o) => `${o.name} - (${ownershipPercentages[o.name] || '___'}% Owner)`).join(', ')}
                            </span>
                          </label>
                        )}

                        {/* Other borrower(s) */}
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(data.mortgageResponsibleParties || []).includes('other-borrowers')}
                            onChange={(e) => {
                              const current = data.mortgageResponsibleParties || [];
                              const updated = e.target.checked
                                ? [...current, 'other-borrowers']
                                : current.filter((p) => p !== 'other-borrowers');
                              onMultiChange({
                                mortgageResponsibleParties: updated,
                                mortgageOtherBorrowers: e.target.checked ? (data.mortgageOtherBorrowers || []) : [],
                              });
                            }}
                            className="mr-2"
                          />
                          <span className="text-white">Other borrower(s)</span>
                        </label>

                        {/* Other borrower details — shown when "Other borrower(s)" is checked */}
                        {(data.mortgageResponsibleParties || []).includes('other-borrowers') && (
                          <div className="ml-6 space-y-5 mt-3">
                            {/* Select family members from predefined people */}
                            {predefinedPeople.filter((p) => p.name?.trim()).length > 0 && (
                              <div>
                                <label className={labelClass}>Select any family members who are other borrowers on the mortgage for {propertyName}:</label>
                                <div className="space-y-2">
                                  {predefinedPeople.filter((p) => p.name?.trim()).map((person) => {
                                    const borrowers = data.mortgageOtherBorrowers || [];
                                    const isSelected = borrowers.some((b) => b.name === person.name);
                                    return (
                                      <label key={person.name} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const current = data.mortgageOtherBorrowers || [];
                                            if (e.target.checked) {
                                              onChange('mortgageOtherBorrowers', [...current, { name: person.name, relationship: '', otherInfo: '' }]);
                                            } else {
                                              onChange('mortgageOtherBorrowers', current.filter((b) => b.name !== person.name));
                                            }
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-white">{person.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Detail fields for each selected other borrower */}
                            {(data.mortgageOtherBorrowers || []).map((borrower, bIdx) => {
                              const debtLabel = data.debtType === 'both' ? 'mortgage' : (data.debtType || 'mortgage');
                              return (
                                <div key={bIdx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 space-y-4">
                                  <h4 className="text-sm font-semibold text-white">Other Borrower {bIdx + 1}</h4>

                                  <div>
                                    <label className={labelClass}>Name</label>
                                    <input
                                      type="text"
                                      value={borrower.name || ''}
                                      onChange={(e) => {
                                        const updated = [...(data.mortgageOtherBorrowers || [])];
                                        updated[bIdx] = { ...updated[bIdx], name: e.target.value };
                                        onChange('mortgageOtherBorrowers', updated);
                                      }}
                                      placeholder="Enter name"
                                      className={inputClass}
                                    />
                                  </div>

                                  <div>
                                    <label className={labelClass}>Relationship to {client1Name}{hasSpouse && client2Name ? ` and ${client2Name}` : ''}</label>
                                    <input
                                      type="text"
                                      value={borrower.relationship || ''}
                                      onChange={(e) => {
                                        const updated = [...(data.mortgageOtherBorrowers || [])];
                                        updated[bIdx] = { ...updated[bIdx], relationship: e.target.value };
                                        onChange('mortgageOtherBorrowers', updated);
                                      }}
                                      placeholder="Enter relationship"
                                      className={inputClass}
                                    />
                                  </div>

                                  <div>
                                    <label className={labelClass}>
                                      Other information about {borrower.name || 'this borrower'} and the {debtLabel} on {propertyName}?
                                    </label>
                                    <textarea
                                      value={borrower.otherInfo || ''}
                                      onChange={(e) => {
                                        const updated = [...(data.mortgageOtherBorrowers || [])];
                                        updated[bIdx] = { ...updated[bIdx], otherInfo: e.target.value };
                                        onChange('mortgageOtherBorrowers', updated);
                                      }}
                                      placeholder="Enter any additional information"
                                      rows={3}
                                      className={inputClass}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Other */}
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(data.mortgageResponsibleParties || []).includes('other')}
                            onChange={(e) => {
                              const current = data.mortgageResponsibleParties || [];
                              const updated = e.target.checked
                                ? [...current, 'other']
                                : current.filter((p) => p !== 'other');
                              onMultiChange({
                                mortgageResponsibleParties: updated,
                                mortgageOtherParties: e.target.checked
                                  ? (data.mortgageOtherParties && data.mortgageOtherParties.length > 0 ? data.mortgageOtherParties : [{ name: '', relationship: '', otherInfo: '' }])
                                  : [],
                              });
                            }}
                            className="mr-2"
                          />
                          <span className="text-white">Other</span>
                        </label>

                        {/* Other party details — shown when "Other" is checked */}
                        {(data.mortgageResponsibleParties || []).includes('other') && (
                          <div className="ml-6 space-y-5 mt-3">
                            {(data.mortgageOtherParties || []).map((party, pIdx) => (
                              <div key={pIdx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-white">Other {pIdx + 1}</h4>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...(data.mortgageOtherParties || [])];
                                      const afterRemove = updated.filter((_, idx) => idx !== pIdx);
                                      if (afterRemove.length === 0) {
                                        const parties = (data.mortgageResponsibleParties || []).filter((p) => p !== 'other');
                                        onMultiChange({
                                          mortgageOtherParties: [],
                                          mortgageResponsibleParties: parties,
                                        });
                                      } else {
                                        onChange('mortgageOtherParties', afterRemove);
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                    Remove
                                  </button>
                                </div>

                                <div>
                                  <label className={labelClass}>Name</label>
                                  <input
                                    type="text"
                                    value={party.name || ''}
                                    onChange={(e) => {
                                      const updated = [...(data.mortgageOtherParties || [])];
                                      updated[pIdx] = { ...updated[pIdx], name: e.target.value };
                                      onChange('mortgageOtherParties', updated);
                                    }}
                                    placeholder="Enter name"
                                    className={inputClass}
                                  />
                                </div>

                                <div>
                                  <label className={labelClass}>Relationship to {client1Name}{hasSpouse && client2Name ? ` and ${client2Name}` : ''}</label>
                                  <input
                                    type="text"
                                    value={party.relationship || ''}
                                    onChange={(e) => {
                                      const updated = [...(data.mortgageOtherParties || [])];
                                      updated[pIdx] = { ...updated[pIdx], relationship: e.target.value };
                                      onChange('mortgageOtherParties', updated);
                                    }}
                                    placeholder="Enter relationship"
                                    className={inputClass}
                                  />
                                </div>

                                <div>
                                  <label className={labelClass}>Additional information</label>
                                  <textarea
                                    value={party.otherInfo || ''}
                                    onChange={(e) => {
                                      const updated = [...(data.mortgageOtherParties || [])];
                                      updated[pIdx] = { ...updated[pIdx], otherInfo: e.target.value };
                                      onChange('mortgageOtherParties', updated);
                                    }}
                                    placeholder="Enter any additional information"
                                    rows={3}
                                    className={inputClass}
                                  />
                                </div>

                                {/* Are there additional parties responsible? Yes/No — only on last entry */}
                                {pIdx === (data.mortgageOtherParties || []).length - 1 && (
                                  <div>
                                    <label className={labelClass}>Are there additional parties responsible for the mortgage on {propertyName}?</label>
                                    <div className="flex gap-4">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`addOtherParty-${index}`}
                                          value="yes"
                                          checked={party._addMore === 'yes'}
                                          onChange={() => {
                                            const updated = [...(data.mortgageOtherParties || [])];
                                            updated[pIdx] = { ...updated[pIdx], _addMore: 'yes' };
                                            onChange('mortgageOtherParties', [...updated, { name: '', relationship: '', otherInfo: '' }]);
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">Yes</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`addOtherParty-${index}`}
                                          value="no"
                                          checked={party._addMore === 'no' || !party._addMore}
                                          onChange={() => {
                                            const updated = [...(data.mortgageOtherParties || [])];
                                            updated[pIdx] = { ...updated[pIdx], _addMore: 'no' };
                                            onChange('mortgageOtherParties', updated);
                                          }}
                                          className="mr-2"
                                        />
                                        <span className="text-gray-300">No</span>
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Where do the mortgage payments usually come from? */}
                    <div>
                      <label className={labelClass}>Where do the mortgage payments for {propertyName} usually come from?</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`mortgagePaymentSource-${index}`}
                            value="client1"
                            checked={data.mortgagePaymentSource === 'client1'}
                            onChange={() => onMultiChange({ mortgagePaymentSource: 'client1', mortgagePaymentSourceOther: '' })}
                            className="mr-2"
                          />
                          <span className="text-white">{client1Name} personal account</span>
                        </label>

                        {hasSpouse && client2Name && (
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`mortgagePaymentSource-${index}`}
                              value="client2"
                              checked={data.mortgagePaymentSource === 'client2'}
                              onChange={() => onMultiChange({ mortgagePaymentSource: 'client2', mortgagePaymentSourceOther: '' })}
                              className="mr-2"
                            />
                            <span className="text-white">{client2Name} personal account</span>
                          </label>
                        )}

                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`mortgagePaymentSource-${index}`}
                            value="joint"
                            checked={data.mortgagePaymentSource === 'joint'}
                            onChange={() => onMultiChange({ mortgagePaymentSource: 'joint', mortgagePaymentSourceOther: '' })}
                            className="mr-2"
                          />
                          <span className="text-white">Joint account</span>
                        </label>

                        {trusts.filter(t => t.name?.trim()).map((trust) => (
                          <label key={trust.name} className="flex items-center">
                            <input
                              type="radio"
                              name={`mortgagePaymentSource-${index}`}
                              value={`trust:${trust.name}`}
                              checked={data.mortgagePaymentSource === `trust:${trust.name}`}
                              onChange={() => onMultiChange({ mortgagePaymentSource: `trust:${trust.name}`, mortgagePaymentSourceOther: '' })}
                              className="mr-2"
                            />
                            <span className="text-white">{trust.name}'s bank account</span>
                          </label>
                        ))}

                        {corporations.filter((c) => c.legalName?.trim()).map((corp) => (
                          <label key={corp.legalName} className="flex items-center">
                            <input
                              type="radio"
                              name={`mortgagePaymentSource-${index}`}
                              value={`corp:${corp.legalName}`}
                              checked={data.mortgagePaymentSource === `corp:${corp.legalName}`}
                              onChange={() => onMultiChange({ mortgagePaymentSource: `corp:${corp.legalName}`, mortgagePaymentSourceOther: '' })}
                              className="mr-2"
                            />
                            <span className="text-white">{corp.legalName}'s bank account</span>
                          </label>
                        ))}

                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`mortgagePaymentSource-${index}`}
                            value="other"
                            checked={data.mortgagePaymentSource === 'other'}
                            onChange={() => onChange('mortgagePaymentSource', 'other')}
                            className="mr-2"
                          />
                          <span className="text-white">Other</span>
                        </label>

                        {data.mortgagePaymentSource === 'other' && (
                          <div className="ml-6 mt-2">
                            <input
                              type="text"
                              value={data.mortgagePaymentSourceOther || ''}
                              onChange={(e) => onChange('mortgagePaymentSourceOther', e.target.value)}
                              placeholder="Enter details"
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mortgage Broker Information */}
                    <div>
                      <label className={labelClass}>Mortgage Broker Information for {propertyName}</label>
                      <div className="space-y-3 mt-2">
                        <div>
                          <label className={subLabelClass}>Contact Name</label>
                          <input
                            type="text"
                            value={data.mortgageBrokerContactName || ''}
                            onChange={(e) => onChange('mortgageBrokerContactName', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        {data.mortgageBrokerContactName?.trim() && (
                          <>
                            <div>
                              <label className={subLabelClass}>{data.mortgageBrokerContactName}'s Phone</label>
                              <input
                                type="tel"
                                value={data.mortgageBrokerContactPhone || ''}
                                onChange={(e) => onChange('mortgageBrokerContactPhone', e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={subLabelClass}>{data.mortgageBrokerContactName}'s Email</label>
                              <input
                                type="email"
                                value={data.mortgageBrokerContactEmail || ''}
                                onChange={(e) => onChange('mortgageBrokerContactEmail', e.target.value)}
                                className={inputClass}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mortgage Insurance */}
                    <div>
                      <label className={labelClass}>Is there insurance associated with the mortgage on {propertyName}?</label>
                      <div className="space-y-2">
                        {['Mortgage Life Insurance', 'Mortgage Disability Insurance', 'Creditor Insurance', 'No', 'Not Sure'].map((opt) => {
                          const current = data.mortgageInsuranceTypes || [];
                          const isChecked = current.includes(opt);
                          const isNoOrNotSure = opt === 'No' || opt === 'Not Sure';
                          return (
                            <label key={opt} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const next = isNoOrNotSure
                                      ? [opt]
                                      : current.filter((o) => o !== 'No' && o !== 'Not Sure').concat(opt);
                                    onMultiChange({
                                      mortgageInsuranceTypes: next,
                                    });
                                  } else {
                                    const next = current.filter((o) => o !== opt);
                                    onMultiChange({
                                      mortgageInsuranceTypes: next,
                                    });
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-white">{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      {(data.mortgageInsuranceTypes || []).filter(
                        (t) => t !== 'No' && t !== 'Not Sure'
                      ).length > 0 && (
                        <div className="mt-4 space-y-6">
                          {(data.mortgageInsuranceTypes || [])
                            .filter((t) => t !== 'No' && t !== 'Not Sure')
                            .map((insType) => (
                              <div key={insType} className="border-l-2 border-white/20 pl-4">
                                <h4 className="text-white font-medium mb-3">{insType}</h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className={subLabelClass}>Provider</label>
                                    <input
                                      type="text"
                                      value={data.mortgageInsuranceProviders?.[insType] || ''}
                                      onChange={(e) =>
                                        onMultiChange({
                                          mortgageInsuranceProviders: {
                                            ...(data.mortgageInsuranceProviders || {}),
                                            [insType]: e.target.value,
                                          },
                                        })
                                      }
                                      className={inputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={subLabelClass}>Policy Number (Optional)</label>
                                    <input
                                      type="text"
                                      value={data.mortgageInsurancePolicyNumbers?.[insType] || ''}
                                      onChange={(e) =>
                                        onMultiChange({
                                          mortgageInsurancePolicyNumbers: {
                                            ...(data.mortgageInsurancePolicyNumbers || {}),
                                            [insType]: e.target.value,
                                          },
                                        })
                                      }
                                      className={inputClass}
                                    />
                                  </div>
                                  <div>
                                    <label className={subLabelClass}>Document Location</label>
                                    <input
                                      type="text"
                                      value={(() => {
                                        const v = data.mortgageInsuranceDocLocations?.[insType];
                                        if (typeof v === 'string') return v;
                                        if (v && typeof v === 'object' && 'label' in v) return v.label;
                                        return '';
                                      })()}
                                      onChange={(e) =>
                                        onMultiChange({
                                          mortgageInsuranceDocLocations: {
                                            ...(data.mortgageInsuranceDocLocations || {}),
                                            [insType]: e.target.value,
                                          },
                                        })
                                      }
                                      className={inputClass}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Special notes about this mortgage */}
                    <div>
                      <label className={labelClass}>
                        Is there anything someone managing your affairs (like a Power of Attorney for Property or Executor) should know about the mortgage on {propertyName}?
                      </label>
                      <p className="text-xs text-gray-400 mb-3 italic">
                        Examples: Variable-rate mortgage, Private lender, Family loan, HELOC attached,
                        Special payment arrangements, Payments are temporarily interest-only
                      </p>
                      <textarea
                        value={data.mortgageSpecialNotes || ''}
                        onChange={(e) => onChange('mortgageSpecialNotes', e.target.value)}
                        placeholder="Enter any special details about this mortgage"
                        rows={5}
                        className={inputClass}
                      />
                    </div>

                    {/* Mortgage document location */}
                    <div>
                      <label className={labelClass}>Where are the mortgage documents for {propertyName} kept?</label>
                      <DocumentLocationPicker
                        label={`Mortgage documents for ${propertyName}`}
                        value={data.mortgageDocLocation}
                        onChange={(ref) => onChange('mortgageDocLocation', ref)}
                        placeholder="Select or add a location"
                      />
                    </div>
                  </Subsection>
                </div>
              )}

              {/* HELOC branch — shows when HELOC or Both is selected */}
              {(data.debtType === 'heloc' || data.debtType === 'both') && (
                <div className="ml-6 space-y-5">
                  <Subsection title={`${propertyName} - Home Equity Line of Credit (HELOC)`}>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Who is the lender for the HELOC on {propertyName}?</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`helocLenderChoice-${index}`}
                              value="previous"
                              checked={data.helocLenderChoice === 'previous'}
                              onChange={() => onMultiChange({
                                helocLenderChoice: 'previous',
                                helocLender: data.mortgageLender || '',
                              })}
                              className="mr-2"
                            />
                            <span className="text-gray-300">{data.mortgageLender ? `${data.mortgageLender} (Lender/Institution previously entered)` : 'Lender/Institution previously entered'}</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`helocLenderChoice-${index}`}
                              value="other"
                              checked={data.helocLenderChoice === 'other'}
                              onChange={() => onMultiChange({
                                helocLenderChoice: 'other',
                                helocLender: '',
                              })}
                              className="mr-2"
                            />
                            <span className="text-gray-300">Other Lender/Institution</span>
                          </label>
                        </div>
                      </div>
                      {data.helocLenderChoice === 'other' && (
                        <div>
                          <label className={labelClass}>Institution / Lender for the HELOC on {propertyName}</label>
                          <input
                            type="text"
                            value={data.helocLender || ''}
                            onChange={(e) => onChange('helocLender', e.target.value)}
                            placeholder="Enter the name of the lender/institution"
                            className={inputClass}
                          />
                        </div>
                      )}
                      <div>
                        <label className={labelClass}>Account Number for the HELOC on {propertyName} <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <input
                          type="text"
                          value={data.helocAccountNumber || ''}
                          onChange={(e) => onChange('helocAccountNumber', e.target.value)}
                          placeholder="Enter account number (optional)"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Approximately how much is currently owing on the HELOC for {propertyName}? (Outstanding Balance)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="text"
                            value={data.helocBalance || ''}
                            onChange={(e) => onChange('helocBalance', e.target.value)}
                            placeholder="0.00"
                            className={`${inputClass} pl-7`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>What is the available credit limit on the HELOC for {propertyName}?</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="text"
                            value={data.helocCreditLimit || ''}
                            onChange={(e) => onChange('helocCreditLimit', e.target.value)}
                            placeholder="0.00"
                            className={`${inputClass} pl-7`}
                          />
                        </div>
                      </div>

                      {/* Interest rate + type */}
                      <div>
                        <label className={labelClass}>What is the current interest rate on the HELOC for {propertyName}?</label>
                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="relative max-w-[120px]">
                            <input
                              type="text"
                              value={data.helocInterestRate || ''}
                              onChange={(e) => onChange('helocInterestRate', e.target.value)}
                              placeholder="____"
                              className={inputClass}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                          </div>
                          <div className="flex gap-4 flex-wrap">
                            {['Variable', 'Fixed'].map((rateType) => (
                              <label key={rateType} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`helocInterestRateType-${index}`}
                                  value={rateType.toLowerCase()}
                                  checked={data.helocInterestRateType === rateType.toLowerCase()}
                                  onChange={() => onMultiChange({
                                    helocInterestRateType: rateType.toLowerCase(),
                                    helocPrimePlus: rateType.toLowerCase() === 'variable' ? data.helocPrimePlus || '' : '',
                                  })}
                                  className="mr-1"
                                />
                                <span className="text-white">{rateType}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* If Variable: Prime + ___% */}
                      {data.helocInterestRateType === 'variable' && (
                        <div className="ml-6">
                          <label className={labelClass}>Prime + <span className="text-gray-400 font-normal">(optional)</span></label>
                          <div className="relative max-w-[120px]">
                            <input
                              type="text"
                              value={data.helocPrimePlus || ''}
                              onChange={(e) => onChange('helocPrimePlus', e.target.value)}
                              placeholder="____"
                              className={inputClass}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                          </div>
                        </div>
                      )}

                      {/* How are payments normally made? */}
                      <div>
                        <label className={labelClass}>How are HELOC payments for {propertyName} normally made?</label>
                        <div className="space-y-2">
                          {['Interest only', 'Fixed monthly payment'].map((pt) => (
                            <label key={pt} className="flex items-center">
                              <input
                                type="radio"
                                name={`helocPaymentType-${index}`}
                                value={pt.toLowerCase().replace(/\s+/g, '_')}
                                checked={data.helocPaymentType === pt.toLowerCase().replace(/\s+/g, '_')}
                                onChange={() => onChange('helocPaymentType', pt.toLowerCase().replace(/\s+/g, '_'))}
                                className="mr-2"
                              />
                              <span className="text-white">{pt}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Paid Automatically / Paid Manually */}
                      <div>
                        <label className={labelClass}>How are HELOC payments for {propertyName} made?</label>
                        <div className="space-y-2">
                          {['Paid Automatically', 'Paid Manually'].map((pm) => (
                            <label key={pm} className="flex items-center">
                              <input
                                type="radio"
                                name={`helocPaymentMethod-${index}`}
                                value={pm.toLowerCase().replace(/\s+/g, '_')}
                                checked={data.helocPaymentMethod === pm.toLowerCase().replace(/\s+/g, '_')}
                                onChange={() => onChange('helocPaymentMethod', pm.toLowerCase().replace(/\s+/g, '_'))}
                                className="mr-2"
                              />
                              <span className="text-white">{pm}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Where do the payments usually come from? — same as mortgage flow */}
                      <div>
                        <label className={labelClass}>Where do the HELOC payments for {propertyName} usually come from?</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`helocPaymentSource-${index}`}
                              value="client1"
                              checked={data.helocPaymentSource === 'client1'}
                              onChange={() => onMultiChange({ helocPaymentSource: 'client1', helocPaymentSourceOther: '' })}
                              className="mr-2"
                            />
                            <span className="text-white">{client1Name} personal account</span>
                          </label>

                          {hasSpouse && client2Name && (
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`helocPaymentSource-${index}`}
                                value="client2"
                                checked={data.helocPaymentSource === 'client2'}
                                onChange={() => onMultiChange({ helocPaymentSource: 'client2', helocPaymentSourceOther: '' })}
                                className="mr-2"
                              />
                              <span className="text-white">{client2Name} personal account</span>
                            </label>
                          )}

                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`helocPaymentSource-${index}`}
                              value="joint"
                              checked={data.helocPaymentSource === 'joint'}
                              onChange={() => onMultiChange({ helocPaymentSource: 'joint', helocPaymentSourceOther: '' })}
                              className="mr-2"
                            />
                            <span className="text-white">Joint account</span>
                          </label>

                          {trusts.filter(t => t.name?.trim()).map((trust) => (
                            <label key={trust.name} className="flex items-center">
                              <input
                                type="radio"
                                name={`helocPaymentSource-${index}`}
                                value={`trust:${trust.name}`}
                                checked={data.helocPaymentSource === `trust:${trust.name}`}
                                onChange={() => onMultiChange({ helocPaymentSource: `trust:${trust.name}`, helocPaymentSourceOther: '' })}
                                className="mr-2"
                              />
                              <span className="text-white">{trust.name}'s bank account</span>
                            </label>
                          ))}

                          {corporations.filter((c) => c.legalName?.trim()).map((corp) => (
                            <label key={corp.legalName} className="flex items-center">
                              <input
                                type="radio"
                                name={`helocPaymentSource-${index}`}
                                value={`corp:${corp.legalName}`}
                                checked={data.helocPaymentSource === `corp:${corp.legalName}`}
                                onChange={() => onMultiChange({ helocPaymentSource: `corp:${corp.legalName}`, helocPaymentSourceOther: '' })}
                                className="mr-2"
                              />
                              <span className="text-white">{corp.legalName}'s bank account</span>
                            </label>
                          ))}

                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`helocPaymentSource-${index}`}
                              value="other"
                              checked={data.helocPaymentSource === 'other'}
                              onChange={() => onChange('helocPaymentSource', 'other')}
                              className="mr-2"
                            />
                            <span className="text-white">Other</span>
                          </label>

                          {data.helocPaymentSource === 'other' && (
                            <div className="ml-6 mt-2">
                              <input
                                type="text"
                                value={data.helocPaymentSourceOther || ''}
                                onChange={(e) => onChange('helocPaymentSourceOther', e.target.value)}
                                placeholder="Enter details"
                                className={inputClass}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Who is legally responsible? */}
                      <div>
                        <label className={labelClass}>Who is legally responsible for the HELOC on {propertyName}?</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(data.helocResponsibleParties || []).includes('client1')}
                              onChange={(e) => {
                                const current = data.helocResponsibleParties || [];
                                const updated = e.target.checked
                                  ? [...current, 'client1']
                                  : current.filter((p) => p !== 'client1');
                                onChange('helocResponsibleParties', updated);
                              }}
                              className="mr-2"
                            />
                            <span className="text-white">{client1Name} - ({ownershipPercentages[client1Name] || '___'}% Owner)</span>
                          </label>

                          {hasSpouse && client2Name && (
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(data.helocResponsibleParties || []).includes('client2')}
                                onChange={(e) => {
                                  const current = data.helocResponsibleParties || [];
                                  const updated = e.target.checked
                                    ? [...current, 'client2']
                                    : current.filter((p) => p !== 'client2');
                                  onChange('helocResponsibleParties', updated);
                                }}
                                className="mr-2"
                              />
                              <span className="text-white">{client2Name} - ({ownershipPercentages[client2Name] || '___'}% Owner)</span>
                            </label>
                          )}

                          {/* Other owners listed on the property */}
                          {otherOwners.filter((o) => o.name?.trim()).length > 0 && (
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(data.helocResponsibleParties || []).includes('other-owners')}
                                onChange={(e) => {
                                  const current = data.helocResponsibleParties || [];
                                  const updated = e.target.checked
                                    ? [...current, 'other-owners']
                                    : current.filter((p) => p !== 'other-owners');
                                  onChange('helocResponsibleParties', updated);
                                }}
                                className="mr-2"
                              />
                              <span className="text-white">
                                {otherOwners.filter((o) => o.name?.trim()).map((o) => `${o.name} - (${ownershipPercentages[o.name] || '___'}% Owner)`).join(', ')}
                              </span>
                            </label>
                          )}

                          {/* Other borrower(s) */}
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(data.helocResponsibleParties || []).includes('other-borrowers')}
                              onChange={(e) => {
                                const current = data.helocResponsibleParties || [];
                                const updated = e.target.checked
                                  ? [...current, 'other-borrowers']
                                  : current.filter((p) => p !== 'other-borrowers');
                                onMultiChange({
                                  helocResponsibleParties: updated,
                                  helocOtherBorrowers: e.target.checked ? (data.helocOtherBorrowers || []) : [],
                                });
                              }}
                              className="mr-2"
                            />
                            <span className="text-white">Other borrower(s)</span>
                          </label>

                          {/* Other borrower details — shown when "Other borrower(s)" is checked */}
                          {(data.helocResponsibleParties || []).includes('other-borrowers') && (
                            <div className="ml-6 space-y-5 mt-3">
                              {/* Select family members from predefined people */}
                              {predefinedPeople.filter((p) => p.name?.trim()).length > 0 && (
                                <div>
                                  <label className={labelClass}>Select any family members who are other borrowers on the HELOC for {propertyName}:</label>
                                  <div className="space-y-2">
                                    {predefinedPeople.filter((p) => p.name?.trim()).map((person) => {
                                      const borrowers = data.helocOtherBorrowers || [];
                                      const isSelected = borrowers.some((b) => b.name === person.name);
                                      return (
                                        <label key={person.name} className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              const current = data.helocOtherBorrowers || [];
                                              if (e.target.checked) {
                                                onChange('helocOtherBorrowers', [...current, { name: person.name, relationship: '', otherInfo: '' }]);
                                              } else {
                                                onChange('helocOtherBorrowers', current.filter((b) => b.name !== person.name));
                                              }
                                            }}
                                            className="mr-2"
                                          />
                                          <span className="text-white">{person.name}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Detail fields for each selected other borrower */}
                              {(data.helocOtherBorrowers || []).map((borrower, bIdx) => {
                                const debtLabel = 'HELOC';
                                return (
                                  <div key={bIdx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 space-y-4">
                                    <h4 className="text-sm font-semibold text-white">Other Borrower {bIdx + 1}</h4>

                                    <div>
                                      <label className={labelClass}>Name</label>
                                      <input
                                        type="text"
                                        value={borrower.name || ''}
                                        onChange={(e) => {
                                          const updated = [...(data.helocOtherBorrowers || [])];
                                          updated[bIdx] = { ...updated[bIdx], name: e.target.value };
                                          onChange('helocOtherBorrowers', updated);
                                        }}
                                        placeholder="Enter name"
                                        className={inputClass}
                                      />
                                    </div>

                                    <div>
                                      <label className={labelClass}>Relationship to {client1Name}{hasSpouse && client2Name ? ` and ${client2Name}` : ''}</label>
                                      <input
                                        type="text"
                                        value={borrower.relationship || ''}
                                        onChange={(e) => {
                                          const updated = [...(data.helocOtherBorrowers || [])];
                                          updated[bIdx] = { ...updated[bIdx], relationship: e.target.value };
                                          onChange('helocOtherBorrowers', updated);
                                        }}
                                        placeholder="Enter relationship"
                                        className={inputClass}
                                      />
                                    </div>

                                    <div>
                                      <label className={labelClass}>
                                        Other information about {borrower.name || 'this borrower'} and the {debtLabel} on {propertyName}?
                                      </label>
                                      <textarea
                                        value={borrower.otherInfo || ''}
                                        onChange={(e) => {
                                          const updated = [...(data.helocOtherBorrowers || [])];
                                          updated[bIdx] = { ...updated[bIdx], otherInfo: e.target.value };
                                          onChange('helocOtherBorrowers', updated);
                                        }}
                                        placeholder="Enter any additional information"
                                        rows={3}
                                        className={inputClass}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(data.helocResponsibleParties || []).includes('other')}
                              onChange={(e) => {
                                const current = data.helocResponsibleParties || [];
                                const updated = e.target.checked
                                  ? [...current, 'other']
                                  : current.filter((p) => p !== 'other');
                                onMultiChange({
                                  helocResponsibleParties: updated,
                                  helocOtherParties: e.target.checked
                                    ? (data.helocOtherParties && data.helocOtherParties.length > 0 ? data.helocOtherParties : [{ name: '', relationship: '', otherInfo: '' }])
                                    : [],
                                });
                              }}
                              className="mr-2"
                            />
                            <span className="text-white">Other</span>
                          </label>

                          {(data.helocResponsibleParties || []).includes('other') && (
                            <div className="ml-6 space-y-5 mt-3">
                              {(data.helocOtherParties || []).map((party, pIdx) => (
                                <div key={pIdx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-white">Other {pIdx + 1}</h4>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...(data.helocOtherParties || [])];
                                        const afterRemove = updated.filter((_, idx) => idx !== pIdx);
                                        if (afterRemove.length === 0) {
                                          const parties = (data.helocResponsibleParties || []).filter((p) => p !== 'other');
                                          onMultiChange({
                                            helocOtherParties: [],
                                            helocResponsibleParties: parties,
                                          });
                                        } else {
                                          onChange('helocOtherParties', afterRemove);
                                        }
                                      }}
                                      className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                      Remove
                                    </button>
                                  </div>

                                  <div>
                                    <label className={labelClass}>Name</label>
                                    <input
                                      type="text"
                                      value={party.name || ''}
                                      onChange={(e) => {
                                        const updated = [...(data.helocOtherParties || [])];
                                        updated[pIdx] = { ...updated[pIdx], name: e.target.value };
                                        onChange('helocOtherParties', updated);
                                      }}
                                      placeholder="Enter name"
                                      className={inputClass}
                                    />
                                  </div>

                                  <div>
                                    <label className={labelClass}>Relationship to {client1Name}{hasSpouse && client2Name ? ` and ${client2Name}` : ''}</label>
                                    <input
                                      type="text"
                                      value={party.relationship || ''}
                                      onChange={(e) => {
                                        const updated = [...(data.helocOtherParties || [])];
                                        updated[pIdx] = { ...updated[pIdx], relationship: e.target.value };
                                        onChange('helocOtherParties', updated);
                                      }}
                                      placeholder="Enter relationship"
                                      className={inputClass}
                                    />
                                  </div>

                                  <div>
                                    <label className={labelClass}>Additional information</label>
                                    <textarea
                                      value={party.otherInfo || ''}
                                      onChange={(e) => {
                                        const updated = [...(data.helocOtherParties || [])];
                                        updated[pIdx] = { ...updated[pIdx], otherInfo: e.target.value };
                                        onChange('helocOtherParties', updated);
                                      }}
                                      placeholder="Enter any additional information"
                                      rows={3}
                                      className={inputClass}
                                    />
                                  </div>

                                  {pIdx === (data.helocOtherParties || []).length - 1 && (
                                    <div>
                                      <label className={labelClass}>Is there anyone else who is legally responsible for the HELOC on {propertyName}?</label>
                                      <div className="flex gap-4">
                                        <label className="flex items-center">
                                          <input
                                            type="radio"
                                            name={`helocAddOtherParty-${index}`}
                                            value="yes"
                                            checked={party._addMore === 'yes'}
                                            onChange={() => {
                                              const updated = [...(data.helocOtherParties || [])];
                                              updated[pIdx] = { ...updated[pIdx], _addMore: 'yes' };
                                              onChange('helocOtherParties', [...updated, { name: '', relationship: '', otherInfo: '' }]);
                                            }}
                                            className="mr-2"
                                          />
                                          <span className="text-gray-300">Yes</span>
                                        </label>
                                        <label className="flex items-center">
                                          <input
                                            type="radio"
                                            name={`helocAddOtherParty-${index}`}
                                            value="no"
                                            checked={party._addMore === 'no' || !party._addMore}
                                            onChange={() => {
                                              const updated = [...(data.helocOtherParties || [])];
                                              updated[pIdx] = { ...updated[pIdx], _addMore: 'no' };
                                              onChange('helocOtherParties', updated);
                                            }}
                                            className="mr-2"
                                          />
                                          <span className="text-gray-300">No</span>
                                        </label>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* What is this HELOC primarily used for? */}
                      <div>
                        <label className={labelClass}>What is the HELOC on {propertyName} primarily used for?</label>
                        <div className="space-y-2">
                          {[
                            { value: 'emergency_fund', label: 'Emergency Fund' },
                            { value: 'home_renovations', label: 'Home Renovations' },
                            { value: 'investment_borrowing', label: 'Investment Borrowing' },
                            { value: 'rental_property', label: 'Rental Property' },
                            { value: 'business', label: 'Business' },
                            { value: 'everyday_expenses', label: 'Everyday Expenses' },
                            { value: 'other', label: 'Other' },
                          ].map((opt) => (
                            <label key={opt.value} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(data.helocPrimaryUses || []).includes(opt.value)}
                                onChange={(e) => {
                                  const current = data.helocPrimaryUses || [];
                                  const updated = e.target.checked
                                    ? [...current, opt.value]
                                    : current.filter((v) => v !== opt.value);
                                  onMultiChange({
                                    helocPrimaryUses: updated,
                                    helocPrimaryUseOther: e.target.checked && opt.value === 'other' ? data.helocPrimaryUseOther || '' : (opt.value === 'other' ? '' : data.helocPrimaryUseOther || ''),
                                  });
                                }}
                                className="mr-2"
                              />
                              <span className="text-white">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        {(data.helocPrimaryUses || []).includes('other') && (
                          <div className="ml-6 mt-2">
                            <input
                              type="text"
                              value={data.helocPrimaryUseOther || ''}
                              onChange={(e) => onChange('helocPrimaryUseOther', e.target.value)}
                              placeholder="Please specify"
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>

                      {/* Is this HELOC actively used? */}
                      <div>
                        <label className={labelClass}>Is the HELOC on {propertyName} actively used?</label>
                        <div className="space-y-2">
                          {[
                            { value: 'frequently', label: 'Frequently' },
                            { value: 'occasionally', label: 'Occasionally' },
                            { value: 'rarely', label: 'Rarely' },
                            { value: 'zero_balance', label: 'Zero balance / Available only' },
                          ].map((opt) => (
                            <label key={opt.value} className="flex items-center">
                              <input
                                type="radio"
                                name={`helocActivelyUsed-${index}`}
                                value={opt.value}
                                checked={data.helocActivelyUsed === opt.value}
                                onChange={() => onChange('helocActivelyUsed', opt.value)}
                                className="mr-2"
                              />
                              <span className="text-white">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Special notes */}
                      <div>
                        <label className={labelClass}>Is there anything important someone managing your affairs should know about the HELOC on {propertyName}?</label>
                        <textarea
                          value={data.helocSpecialNotes || ''}
                          onChange={(e) => onChange('helocSpecialNotes', e.target.value)}
                          placeholder="Enter any important notes"
                          rows={3}
                          className={inputClass}
                        />
                      </div>

                      {/* Document location */}
                      <div>
                        <label className={labelClass}>Where are the HELOC documents for {propertyName} kept?</label>
                        <DocumentLocationPicker
                          label={`HELOC documents for ${propertyName}`}
                          value={data.helocDocLocation}
                          onChange={(ref) => onChange('helocDocLocation', ref)}
                          placeholder="Select or add a location"
                        />
                      </div>

                      {/* Automatic payments or recurring withdrawals */}
                      <div>
                        <label className={labelClass}>Are automatic payments or recurring withdrawals made using the HELOC on {propertyName}?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`helocHasAutoPayments-${index}`}
                              value="yes"
                              checked={data.helocHasAutoPayments === 'yes'}
                              onChange={() => onChange('helocHasAutoPayments', 'yes')}
                              className="mr-2"
                            />
                            <span className="text-white">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`helocHasAutoPayments-${index}`}
                              value="no"
                              checked={data.helocHasAutoPayments === 'no'}
                              onChange={() => onMultiChange({ helocHasAutoPayments: 'no', helocAutoPaymentsDescription: '' })}
                              className="mr-2"
                            />
                            <span className="text-white">No</span>
                          </label>
                        </div>
                      </div>
                      {data.helocHasAutoPayments === 'yes' && (
                        <div className="ml-6">
                          <label className={labelClass}>Describe the automatic payments or recurring withdrawals on the HELOC for {propertyName}.</label>
                          <textarea
                            value={data.helocAutoPaymentsDescription || ''}
                            onChange={(e) => onChange('helocAutoPaymentsDescription', e.target.value)}
                            placeholder="Describe the automatic payments or recurring withdrawals"
                            rows={3}
                            className={inputClass}
                          />
                        </div>
                      )}
                    </div>
                  </Subsection>
                </div>
              )}
            </Subsection>
          )}



          {/* History subsection */}
          <Subsection title={`${propertyName} - History`}>

          {/* Renovations */}
          <div>
            <label className={labelClass}>Have there been any Capital Improvements to {propertyName}?</label>
            <p className="text-xs text-gray-400 mb-3 italic">
              Note: the CRA distinguishes between these two based on whether the work improves the property beyond its original condition or merely maintains it. Examples of Capital Improvement are structural additions, substantial upgrades (replacing carpeting with hardwood floors, replacing a bathroom/kitchen), or new major systems (new roof, HVAC system). Things that typically do not qualify are expenses/maintenance (routine repairs, cleaning). When in doubt of which is which, include it here.
            </p>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`hasRenovations-${index}`}
                  value="yes"
                  checked={data.hasRenovations === 'yes'}
                  onChange={() => {
                    const existing = data.capitalImprovements || [];
                    onMultiChange({
                      hasRenovations: 'yes',
                      capitalImprovements: existing.length > 0 ? existing : [{ description: '', cost: '', year: '', recordsLocation: '' }],
                    });
                  }}
                  className="mr-2"
                />
                <span className="text-gray-300">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`hasRenovations-${index}`}
                  value="no"
                  checked={data.hasRenovations === 'no'}
                  onChange={() => {
                    onMultiChange({
                      hasRenovations: 'no',
                      capitalImprovements: [],
                    });
                  }}
                  className="mr-2"
                />
                <span className="text-gray-300">No</span>
              </label>
            </div>
          </div>

          {/* Capital improvements (conditional on hasRenovations = yes) */}
          {data.hasRenovations === 'yes' && capitalImprovements.length > 0 && (
            <div className="ml-6 space-y-5">
              {capitalImprovements.map((imp, impIndex) => (
                <div key={impIndex} className="bg-gray-750 rounded-lg p-4 border border-gray-600 space-y-4">
                  <h4 className="text-sm font-semibold text-white">Capital Improvement {impIndex + 1}</h4>
                  <div>
                    <label className={labelClass}>Description</label>
                    <input
                      type="text"
                      value={imp.description || ''}
                      onChange={(e) => handleCapitalImprovementChange(impIndex, 'description', e.target.value)}
                      placeholder="Enter description of the improvement"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Cost</label>
                      <input
                        type="text"
                        value={imp.cost || ''}
                        onChange={(e) => handleCapitalImprovementChange(impIndex, 'cost', e.target.value)}
                        placeholder="Enter cost"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Year</label>
                      <select
                        value={imp.year || ''}
                        onChange={(e) => handleCapitalImprovementChange(impIndex, 'year', e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select year</option>
                        {yearOptions.map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Location of the receipt/records for this improvement to {propertyName}</label>
                    <DocumentLocationPicker
                      label={`Capital improvement records for ${propertyName} #${impIndex + 1}`}
                      value={imp.recordsLocation}
                      onChange={(ref) => handleCapitalImprovementChange(impIndex, 'recordsLocation', Array.isArray(ref) ? ref[0] : ref)}
                      placeholder="Select or add a location"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Are there any additional capital improvements to {propertyName} to add?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`addMoreImprovements-${index}-${impIndex}`}
                          value="yes"
                          checked={capitalImprovements[impIndex]?.hasMore === 'yes'}
                          onChange={() => {
                            const updated = [...capitalImprovements];
                            updated[impIndex] = { ...updated[impIndex], hasMore: 'yes' };
                            onChange('capitalImprovements', [...updated, { description: '', cost: '', year: '', recordsLocation: '' }]);
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-300">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`addMoreImprovements-${index}-${impIndex}`}
                          value="no"
                          checked={capitalImprovements[impIndex]?.hasMore === 'no'}
                          onChange={() => {
                            const updated = capitalImprovements.slice(0, impIndex + 1);
                            updated[impIndex] = { ...updated[impIndex], hasMore: 'no' };
                            onChange('capitalImprovements', updated);
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-300">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rental-specific questions */}
          {isRental && (
            <>
              {/* Lease documents location */}
              <div>
                <label className={labelClass}>Where are lease documents and rental agreements for {propertyName} kept?</label>
                <DocumentLocationPicker
                  label={`Lease/rental documents for ${propertyName}`}
                  value={data.leaseDocumentsLocation}
                  onChange={(ref) => onChange('leaseDocumentsLocation', ref)}
                  placeholder="Select or add a location"
                />
              </div>

              {/* Was it always a rental or ever inhabited by client/spouse/child */}
              <div>
                <label className={labelClass}>
                  Has {propertyName} always been a rental, or was it ever inhabited by {client1Name}{hasSpouse && client2Name ? `, ${client2Name}` : ''} or a child?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`wasAlwaysRental-${index}`}
                      value="yes"
                      checked={data.wasAlwaysRental === 'yes'}
                      onChange={() => onChange('wasAlwaysRental', 'yes')}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Yes, it was inhabited by {client1Name}{hasSpouse && client2Name ? `, ${client2Name}` : ''} or a child</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`wasAlwaysRental-${index}`}
                      value="no"
                      checked={data.wasAlwaysRental === 'no'}
                      onChange={() => onMultiChange({ wasAlwaysRental: 'no', inhabitedYears: [] })}
                      className="mr-2"
                    />
                    <span className="text-gray-300">No, it has always been a rental</span>
                  </label>
                </div>
              </div>

              {/* Inhabited years (conditional on wasAlwaysRental = yes) */}
              {data.wasAlwaysRental === 'yes' && (() => {
                const purchaseYearNum = parseInt(data.purchaseYear || '', 10);
                const selectedYears: string[] = data.inhabitedYears || [];
                const years: number[] = [];
                if (!isNaN(purchaseYearNum) && purchaseYearNum <= currentYear) {
                  for (let y = purchaseYearNum; y <= currentYear; y++) years.push(y);
                }
                const toggleYear = (year: number) => {
                  const yearStr = String(year);
                  const updated = selectedYears.includes(yearStr)
                    ? selectedYears.filter(y => y !== yearStr)
                    : [...selectedYears, yearStr].sort((a, b) => Number(a) - Number(b));
                  onChange('inhabitedYears', updated);
                };
                return (
                  <div className="ml-6 space-y-3">
                    <label className={labelClass}>
                      What years was {propertyName} inhabited by {client1Name}{hasSpouse && client2Name ? `, ${client2Name}` : ''}, or a child?
                    </label>
                    <p className="text-xs text-gray-400 italic">
                      Select all years that apply, from the purchase date to the present.
                    </p>
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {years.map(year => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => toggleYear(year)}
                          className={`px-2 py-1.5 text-sm rounded-lg border transition-colors ${
                            selectedYears.includes(String(year))
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-gray-600 border-gray-500 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                    {years.length === 0 && (
                      <p className="text-xs text-gray-400 italic">
                        Enter a purchase date for this property above to enable year selection.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Property manager */}
              <div>
                <label className={labelClass}>Is there a designated property manager for {propertyName}?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`hasPropertyManager-${index}`}
                      value="yes"
                      checked={data.hasPropertyManager === 'yes'}
                      onChange={() => onChange('hasPropertyManager', 'yes')}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`hasPropertyManager-${index}`}
                      value="no"
                      checked={data.hasPropertyManager === 'no'}
                      onChange={() => onMultiChange({
                        hasPropertyManager: 'no',
                        propertyManagerName: '',
                        propertyManagerPhone: '',
                        propertyManagerEmail: '',
                        propertyManagerCompany: '',
                      })}
                      className="mr-2"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
              </div>

              {/* Property manager contact details (conditional on hasPropertyManager = yes) */}
              {data.hasPropertyManager === 'yes' && (
                <div className="ml-6 space-y-4">
                  <div>
                    <label className={labelClass}>Contact Name:</label>
                    <input
                      type="text"
                      value={data.propertyManagerName || ''}
                      onChange={(e) => onChange('propertyManagerName', e.target.value)}
                      placeholder="Enter contact name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="text"
                      value={data.propertyManagerPhone || ''}
                      onChange={(e) => onChange('propertyManagerPhone', e.target.value)}
                      placeholder="Enter phone number"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="text"
                      value={data.propertyManagerEmail || ''}
                      onChange={(e) => onChange('propertyManagerEmail', e.target.value)}
                      placeholder="Enter email address"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Company:</label>
                    <input
                      type="text"
                      value={data.propertyManagerCompany || ''}
                      onChange={(e) => onChange('propertyManagerCompany', e.target.value)}
                      placeholder="Enter company name"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Landlord insurance */}
              <div>
                <label className={labelClass}>Do you have a specific Landlord insurance policy for {propertyName}?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`hasLandlordInsurance-${index}`}
                      value="yes"
                      checked={data.hasLandlordInsurance === 'yes'}
                      onChange={() => onChange('hasLandlordInsurance', 'yes')}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`hasLandlordInsurance-${index}`}
                      value="no"
                      checked={data.hasLandlordInsurance === 'no'}
                      onChange={() => onMultiChange({ hasLandlordInsurance: 'no', landlordInsuranceLocation: '' })}
                      className="mr-2"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                </div>
              </div>

              {/* Landlord insurance document location (conditional on hasLandlordInsurance = yes) */}
              {data.hasLandlordInsurance === 'yes' && (
                <div className="ml-6">
                  <label className={labelClass}>Landlord insurance policy document location for {propertyName}:</label>
                  <DocumentLocationPicker
                    label={`Landlord insurance for ${propertyName}`}
                    value={data.landlordInsuranceLocation}
                    onChange={(ref) => onChange('landlordInsuranceLocation', ref)}
                    placeholder="Select or add a location"
                  />
                </div>
              )}

              {/* Tax document locations */}
              <div>
                <label className={labelClass}>Location of tax documents for {propertyName}</label>
                <DocumentLocationPicker
                  label={`Rental tax documents for ${propertyName}`}
                  value={data.rentalTaxDocLocation}
                  onChange={(ref) => onChange('rentalTaxDocLocation', ref)}
                  placeholder="Select or add a location"
                />
              </div>
              {!isCanada && country && (
                <>
                  <div>
                    <label className={labelClass}>Location of Canadian tax documents for {propertyName}</label>
                    <DocumentLocationPicker
                      label={`Canadian tax documents for ${propertyName}`}
                      value={data.canadianRentalTaxDocLocation}
                      onChange={(ref) => onChange('canadianRentalTaxDocLocation', ref)}
                      placeholder="Select or add a location"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location of tax documents for {propertyName} for {country}?</label>
                    <DocumentLocationPicker
                      label={`${country} tax documents for ${propertyName}`}
                      value={data.foreignRentalTaxDocLocation}
                      onChange={(ref) => onChange('foreignRentalTaxDocLocation', ref)}
                      placeholder="Select or add a location"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Inhabited annually / used for income / PRE — hidden for Rental properties */}
          {!isRental && (
            <>
          <div>
            <label className={labelClass}>
              Has {propertyName} been inhabited by {client1Name}{hasSpouse && client2Name ? `, ${client2Name}` : ''} or one or more of your children for at least some part of every year since {propertyName} was purchased?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`inhabitedAnnually-${index}`}
                  value="yes"
                  checked={data.inhabitedAnnually === 'yes'}
                  onChange={() => onChange('inhabitedAnnually', 'yes')}
                  className="mr-2"
                />
                <span className="text-gray-300">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`inhabitedAnnually-${index}`}
                  value="no"
                  checked={data.inhabitedAnnually === 'no'}
                  onChange={() => onChange('inhabitedAnnually', 'no')}
                  className="mr-2"
                />
                <span className="text-gray-300">No</span>
              </label>
            </div>
          </div>

          {/* Used for income */}
          <div>
            <label className={labelClass}>
              Since the date of purchase, has {propertyName} ever been used primarily to earn income (e.g., rented to third parties)?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`usedForIncome-${index}`}
                  value="yes"
                  checked={data.usedForIncome === 'yes'}
                  onChange={() => onMultiChange({ usedForIncome: 'yes' })}
                  className="mr-2"
                />
                <span className="text-gray-300">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`usedForIncome-${index}`}
                  value="no"
                  checked={data.usedForIncome === 'no'}
                  onChange={() => onMultiChange({ usedForIncome: 'no', claimedCCA: '', recordsLocation: '' })}
                  className="mr-2"
                />
                <span className="text-gray-300">No</span>
              </label>
            </div>
          </div>

          {/* CCA claim (conditional on usedForIncome = yes) */}
          {data.usedForIncome === 'yes' && (
            <div className="ml-6 space-y-5">
              <div>
                <label className={labelClass}>
                  Did you ever claim Capital Cost Allowance (depreciation) for {propertyName} when filing with the CRA?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`claimedCCA-${index}`}
                      value="yes"
                      checked={data.claimedCCA === 'yes'}
                      onChange={() => onChange('claimedCCA', 'yes')}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`claimedCCA-${index}`}
                      value="no"
                      checked={data.claimedCCA === 'no'}
                      onChange={() => onMultiChange({ claimedCCA: 'no', recordsLocation: '' })}
                      className="mr-2"
                    />
                    <span className="text-gray-300">No</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`claimedCCA-${index}`}
                      value="not_sure"
                      checked={data.claimedCCA === 'not_sure'}
                      onChange={() => onMultiChange({ claimedCCA: 'not_sure', recordsLocation: '' })}
                      className="mr-2"
                    />
                    <span className="text-gray-300">I'm/We're not sure</span>
                  </label>
                </div>
              </div>

              {/* Records location (conditional on claimedCCA = yes) */}
              {data.claimedCCA === 'yes' && (
                <div>
                  <label className={labelClass}>Where are your records for {propertyName} kept?</label>
                  <DocumentLocationPicker
                    label={`CCA records for ${propertyName}`}
                    value={data.recordsLocation}
                    onChange={(ref) => onChange('recordsLocation', ref)}
                    placeholder="Select or add a location"
                  />
                </div>
              )}
            </div>
          )}

          {/* PRE claimed for another property */}
          <div>
            <label className={labelClass}>
              Aside from the year you purchased {propertyName}, were there any other years where you already claimed the Principal Residence Exemption for a different property you sold?
            </label>
            <p className="text-xs text-gray-400 mb-3 italic">
              Guidance: If you sold your previous home in 2011 and bought {propertyName} in 2011, the 'one-plus' rule covers both for that year, so you would answer 'No' unless you sold another property later during your ownership of {propertyName}.
            </p>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`claimedPREOtherProperty-${index}`}
                  value="yes"
                  checked={data.claimedPREOtherProperty === 'yes'}
                  onChange={() => onChange('claimedPREOtherProperty', 'yes')}
                  className="mr-2"
                />
                <span className="text-gray-300">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`claimedPREOtherProperty-${index}`}
                  value="no"
                  checked={data.claimedPREOtherProperty === 'no'}
                  onChange={() => onMultiChange({ claimedPREOtherProperty: 'no', preDesignatedYears: [] })}
                  className="mr-2"
                />
                <span className="text-gray-300">No</span>
              </label>
            </div>
          </div>

          {/* Designated years checkboxes (conditional on claimedPREOtherProperty = yes) */}
          {data.claimedPREOtherProperty === 'yes' && (
            <div className="ml-6">
              <label className={labelClass}>What specific years were designated for the other property(ies) sold while you owned {propertyName}?</label>
              <p className="text-xs text-yellow-400 mb-3">
                This data will be important for a POA or Executor to use when filing taxes.
              </p>
              {(() => {
                const startYear = parseInt(data.purchaseYear || '', 10);
                if (isNaN(startYear)) {
                  return (
                    <p className="text-sm text-gray-400">
                      Please select a purchase year above to see the list of eligible years.
                    </p>
                  );
                }
                const selectedYears = data.preDesignatedYears || [];
                const yearList: number[] = [];
                for (let y = startYear; y <= currentYear; y++) yearList.push(y);
                const toggleYear = (year: string) => {
                  if (selectedYears.includes(year)) {
                    onChange('preDesignatedYears', selectedYears.filter(yr => yr !== year));
                  } else {
                    onChange('preDesignatedYears', [...selectedYears, year]);
                  }
                };
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {yearList.map((y) => (
                      <label key={y} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedYears.includes(String(y))}
                          onChange={() => toggleYear(String(y))}
                          className="mr-2"
                        />
                        <span className="text-gray-300 text-sm">{y}</span>
                      </label>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
            </>
          )}
          </Subsection>
    </div>
  );
}
