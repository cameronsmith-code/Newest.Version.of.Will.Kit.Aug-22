/**
 * Real Estate Obligation Sync Hook — watches primaryHomeData and propertiesData
 * from the Real Estate section and syncs mortgages/HELOCs to the unified
 * Obligation architecture.
 *
 * Closure Gate fixes:
 * - `enabled` parameter: hook stays mounted but performs no work when disabled.
 * - Stable callback refs: onUpdateField/onUpdateProperty are stored in refs so
 *   their identity churn from StepForm re-renders does not retrigger sync.
 * - Source-signature-driven effect: the sync effect depends on a JSON signature
 *   of the source data, not on callback identity or registry.collections.
 * - getEntityById added to store for idempotent comparison in syncObligation.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';
import { syncObligation, deleteObligation, normalizeObligationSource, type ObligationInput, type ObligationStore } from './obligationSync';

type PropertyData = {
  name?: string;
  propertyEntityId?: string;
  hasDebt?: string;
  debtType?: string;
  mortgageLender?: string;
  mortgageBalance?: string;
  mortgageResponsibleParties?: string[];
  mortgageOtherBorrowers?: Array<{ name?: string }>;
  mortgageInterestRate?: string;
  mortgageInterestRateType?: string;
  mortgagePayment?: string;
  mortgagePaymentFrequency?: string;
  mortgageDocLocation?: string;
  mortgageSpecialNotes?: string;
  mortgageEntityId?: string;
  helocLender?: string;
  helocBalance?: string;
  helocCreditLimit?: string;
  helocResponsibleParties?: string[];
  helocOtherBorrowers?: Array<{ name?: string }>;
  helocInterestRate?: string;
  helocPaymentSource?: string;
  helocDocLocation?: string;
  helocSpecialNotes?: string;
  helocEntityId?: string;
};

type RealEstateObligationSyncArgs = {
  enabled: boolean;
  primaryHomeData: PropertyData;
  propertiesData: PropertyData[];
  client1Name: string;
  client2Name: string;
  client1EntityId: string;
  client2EntityId: string;
  hasSpouse: boolean;
  onUpdateField: (field: string, value: unknown) => void;
  onUpdateProperty: (index: number, updates: Record<string, unknown>) => void;
};

export function useRealEstateObligationSync({
  enabled,
  primaryHomeData,
  propertiesData,
  client1Name,
  client2Name,
  client1EntityId,
  client2EntityId,
  hasSpouse: _hasSpouse,
  onUpdateField,
  onUpdateProperty,
}: RealEstateObligationSyncArgs) {
  const registry = useEntityRegistry();
  const peopleRepo = usePeopleRepository();

  const genRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Stable refs for callbacks — their identity changes every StepForm render
  // but we don't want that to retrigger sync.
  const onUpdateFieldRef = useRef(onUpdateField);
  onUpdateFieldRef.current = onUpdateField;
  const onUpdatePropertyRef = useRef(onUpdateProperty);
  onUpdatePropertyRef.current = onUpdateProperty;

  // Stable refs for source data — used inside syncPropertyDebt to avoid
  // stale closures without depending on object identity in the effect.
  const primaryHomeDataRef = useRef(primaryHomeData);
  primaryHomeDataRef.current = primaryHomeData;
  const propertiesDataRef = useRef(propertiesData);
  propertiesDataRef.current = propertiesData;

  const store: ObligationStore = useMemo(() => ({
    getOrCreateEntity: registry.getOrCreateEntity,
    updateEntity: registry.updateEntity,
    createRelationship: registry.createRelationship,
    removeRelationship: registry.removeRelationship,
    getRelationshipsByTarget: registry.getRelationshipsByTarget,
    getRelationshipsBySource: registry.getRelationshipsBySource,
    getRelationshipsByEntity: registry.getRelationshipsByEntity,
    getEntityById: registry.getEntityById,
  }), [
    registry.getOrCreateEntity,
    registry.updateEntity,
    registry.createRelationship,
    registry.removeRelationship,
    registry.getRelationshipsByTarget,
    registry.getRelationshipsBySource,
    registry.getRelationshipsByEntity,
    registry.getEntityById,
  ]);

  const resolveClientEntity = useCallback(
    (label: string): { entityId: string; entityType: 'person'; displayName: string } | null => {
      if (label === 'client1' && client1EntityId) return { entityId: client1EntityId, entityType: 'person' as const, displayName: client1Name || 'Client 1' };
      if (label === 'client2' && client2EntityId) return { entityId: client2EntityId, entityType: 'person' as const, displayName: client2Name || 'Client 2' };
      return null;
    },
    [client1EntityId, client1Name, client2EntityId, client2Name]
  );

  const resolveOtherPersonEntity = useCallback(
    async (name: string): Promise<{ entityId: string; entityType: 'person'; displayName: string } | null> => {
      if (!name.trim()) return null;
      const person = await peopleRepo.getOrCreatePerson(name);
      const result = await store.getOrCreateEntity(name, 'person', {
        sourceSection: 'realEstate',
        completionStatus: 'identified',
        metadata: person?.id ? { personRepoId: person.id } : undefined,
      });
      return { entityId: result.entity.id, entityType: 'person' as const, displayName: name };
    },
    [peopleRepo, store]
  );

  const syncPropertyDebt = useCallback(
    async (
      property: PropertyData,
      isPrimary: boolean,
      index: number
    ) => {
      if (!property.hasDebt || property.hasDebt !== 'yes') return;
      if (!property.propertyEntityId) return;

      const propertyName = property.name || (isPrimary ? 'Primary Home' : `Property ${index + 1}`);
      const debtType = property.debtType || '';

      // Sync mortgage
      if (debtType === 'mortgage' || debtType === 'both') {
        const lenderName = property.mortgageLender?.trim() || 'Unknown Lender';
        const lenderResult = await store.getOrCreateEntity(lenderName, 'lender', {
          sourceSection: 'realEstate',
          completionStatus: 'identified',
        });

        const parties = property.mortgageResponsibleParties || [];
        const mortgageBorrowers: Array<{ entityId: string; entityType: 'person'; displayName: string }> = [];

        for (const partyLabel of parties) {
          if (partyLabel === 'client1' || partyLabel === 'client2') {
            const info = resolveClientEntity(partyLabel);
            if (info) mortgageBorrowers.push(info);
          } else if (partyLabel === 'other') {
            const otherBorrowers = property.mortgageOtherBorrowers || [];
            for (const ob of otherBorrowers) {
              if (ob?.name?.trim()) {
                const info = await resolveOtherPersonEntity(ob.name);
                if (info) mortgageBorrowers.push(info);
              }
            }
          }
        }
        if (mortgageBorrowers.length === 0) {
          const fallback = resolveClientEntity('client1');
          if (fallback) mortgageBorrowers.push(fallback);
        }
        if (mortgageBorrowers.length === 0) return;

        const input: ObligationInput = {
          obligationEntityId: property.mortgageEntityId,
          obligationType: 'mortgage',
          direction: 'person_owes',
          borrower: { entityId: mortgageBorrowers[0].entityId, entityType: 'person', displayName: mortgageBorrowers[0].displayName },
          borrowers: mortgageBorrowers,
          lender: { entityId: lenderResult.entity.id, entityType: 'lender', displayName: lenderName },
          amount: property.mortgageBalance,
          interestRate: property.mortgageInterestRate,
          secured: 'yes',
          collateralEntityId: property.propertyEntityId,
          collateralDescription: propertyName,
          guarantors: [],
          notes: property.mortgageSpecialNotes,
          paymentAmount: property.mortgagePayment,
          paymentFrequency: property.mortgagePaymentFrequency,
          sourceSection: 'realEstate',
          sourceRecordId: isPrimary ? 'primary_mortgage' : `prop_${index}_mortgage`,
        };

        const syncGen = genRef.current;
        await syncObligation(input, store, (id) => {
          if (syncGen !== genRef.current) return;
          if (isPrimary) {
            const current = primaryHomeDataRef.current;
            if (current.mortgageEntityId !== id) {
              onUpdateFieldRef.current('mortgageEntityId', id);
            }
          } else {
            const currentProps = propertiesDataRef.current;
            if (currentProps[index]?.mortgageEntityId !== id) {
              onUpdatePropertyRef.current(index, { mortgageEntityId: id });
            }
          }
        });
      }

      // Sync HELOC
      if (debtType === 'heloc' || debtType === 'both') {
        const lenderName = property.helocLender?.trim() || 'Unknown Lender';
        const lenderResult = await store.getOrCreateEntity(lenderName, 'lender', {
          sourceSection: 'realEstate',
          completionStatus: 'identified',
        });

        const parties = property.helocResponsibleParties || [];
        const helocBorrowers: Array<{ entityId: string; entityType: 'person'; displayName: string }> = [];

        for (const partyLabel of parties) {
          if (partyLabel === 'client1' || partyLabel === 'client2') {
            const info = resolveClientEntity(partyLabel);
            if (info) helocBorrowers.push(info);
          } else if (partyLabel === 'other') {
            const otherBorrowers = property.helocOtherBorrowers || [];
            for (const ob of otherBorrowers) {
              if (ob?.name?.trim()) {
                const info = await resolveOtherPersonEntity(ob.name);
                if (info) helocBorrowers.push(info);
              }
            }
          }
        }
        if (helocBorrowers.length === 0) {
          const fallback = resolveClientEntity('client1');
          if (fallback) helocBorrowers.push(fallback);
        }
        if (helocBorrowers.length === 0) return;

        const input: ObligationInput = {
          obligationEntityId: property.helocEntityId,
          obligationType: 'heloc',
          direction: 'person_owes',
          borrower: { entityId: helocBorrowers[0].entityId, entityType: 'person', displayName: helocBorrowers[0].displayName },
          borrowers: helocBorrowers,
          lender: { entityId: lenderResult.entity.id, entityType: 'lender', displayName: lenderName },
          amount: property.helocBalance,
          creditLimit: property.helocCreditLimit,
          secured: 'yes',
          collateralEntityId: property.propertyEntityId,
          collateralDescription: propertyName,
          guarantors: [],
          notes: property.helocSpecialNotes,
          sourceSection: 'realEstate',
          sourceRecordId: isPrimary ? 'primary_heloc' : `prop_${index}_heloc`,
        };

        const syncGen = genRef.current;
        await syncObligation(input, store, (id) => {
          if (syncGen !== genRef.current) return;
          if (isPrimary) {
            const current = primaryHomeDataRef.current;
            if (current.helocEntityId !== id) {
              onUpdateFieldRef.current('helocEntityId', id);
            }
          } else {
            const currentProps = propertiesDataRef.current;
            if (currentProps[index]?.helocEntityId !== id) {
              onUpdatePropertyRef.current(index, { helocEntityId: id });
            }
          }
        });
      }
    },
    [store, resolveClientEntity, resolveOtherPersonEntity]
  );

  // Source-signature-driven effect: only re-runs when actual source content
  // changes (normalized JSON), not when callback identities or registry
  // collections change.
  const sourceSignature = useMemo(() => {
    return normalizeObligationSource([primaryHomeData, propertiesData]);
  }, [primaryHomeData, propertiesData]);

  useEffect(() => {
    if (!enabledRef.current) return;
    genRef.current++;
    const syncGen = genRef.current;
    const syncAll = async () => {
      await syncPropertyDebt(primaryHomeDataRef.current, true, 0);
      if (syncGen !== genRef.current) return;
      for (let i = 0; i < propertiesDataRef.current.length; i++) {
        if (syncGen !== genRef.current) return;
        await syncPropertyDebt(propertiesDataRef.current[i], false, i);
      }
    };
    syncAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSignature, syncPropertyDebt]);

  const removeObligation = useCallback(
    async (obligationEntityId: string | undefined) => {
      await deleteObligation(obligationEntityId, store);
    },
    [store]
  );

  return { removeObligation };
}
