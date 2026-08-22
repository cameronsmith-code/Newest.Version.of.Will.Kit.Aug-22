/**
 * Personal Obligation Sync Hook — watches additionalDebtsData from the
 * Debt & Obligations section and syncs each entry to the unified Obligation
 * architecture via syncObligation.
 *
 * Each additional personal debt creates/reuses one canonical Obligation entity
 * with borrower_of / lender_of relationships. The obligationEntityId is written
 * back to the source array entry for stable identity across edits.
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';
import { syncObligation, deleteObligation, type ObligationInput, type ObligationStore, type ObligationType } from './obligationSync';

type AdditionalDebt = {
  id: string;
  borrower?: string;
  borrowerOtherName?: string;
  borrowerOtherRelationship?: string;
  description?: string;
  lender?: string;
  amount?: string;
  amountUnknown?: string;
  interestRate?: string;
  interestRateUnknown?: string;
  paymentAmount?: string;
  paymentFrequency?: string;
  paymentFrequencyOther?: string;
  paymentSource?: string;
  paymentSourceOther?: string;
  paymentSourceBankRef?: string;
  isSecured?: string;
  securedByType?: string;
  securedByOther?: string;
  hasDocument?: string;
  documentLocation?: string;
  documentLocationOther?: string;
  specialNotes?: string;
  collateralPropertyEntityId?: string;
  documentLocationId?: string;
  obligationEntityId?: string;
  borrowerEntityId?: string;
  lenderEntityId?: string;
};

type PersonalObligationSyncArgs = {
  additionalDebts: AdditionalDebt[];
  client1Name: string;
  client2Name: string;
  client1EntityId: string;
  client2EntityId: string;
  hasSpouse: boolean;
  onUpdateArray: (key: string, updated: unknown[]) => void;
};

function resolveDebtType(debt: AdditionalDebt): ObligationType {
  const desc = (debt.description || '').toLowerCase();
  if (desc.includes('line of credit') || desc.includes('loc')) return 'personal_loc';
  if (desc.includes('vehicle') || desc.includes('car') || desc.includes('auto')) return 'vehicle_loan';
  if (desc.includes('tax')) return 'tax_obligation';
  if (desc.includes('student')) return 'student_loan';
  if (desc.includes('family') || desc.includes('private')) return 'family_private_loan';
  if (desc.includes('credit card')) return 'credit_facility';
  return 'personal_loan';
}

export function usePersonalObligationSync({
  additionalDebts,
  client1Name,
  client2Name,
  client1EntityId,
  client2EntityId,
  hasSpouse,
  onUpdateArray,
}: PersonalObligationSyncArgs) {
  const registry = useEntityRegistry();
  const peopleRepo = usePeopleRepository();

  const store: ObligationStore = useMemo(() => ({
    getOrCreateEntity: registry.getOrCreateEntity,
    updateEntity: registry.updateEntity,
    createRelationship: registry.createRelationship,
    removeRelationship: registry.removeRelationship,
    getRelationshipsByTarget: registry.getRelationshipsByTarget,
    getRelationshipsBySource: registry.getRelationshipsBySource,
    getRelationshipsByEntity: registry.getRelationshipsByEntity,
  }), [
    registry.getOrCreateEntity,
    registry.updateEntity,
    registry.createRelationship,
    registry.removeRelationship,
    registry.getRelationshipsByTarget,
    registry.getRelationshipsBySource,
    registry.getRelationshipsByEntity,
  ]);
  const genRef = useRef(0);

  const updateEntry = useCallback(
    (index: number, updates: Record<string, unknown>, current: AdditionalDebt[]) => {
      const updated = [...current];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
        onUpdateArray('additionalDebtsData', updated);
      }
    },
    [onUpdateArray]
  );

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
        sourceSection: 'debtObligations',
        completionStatus: 'identified',
        metadata: person?.id ? { personRepoId: person.id } : undefined,
      });
      return { entityId: result.entity.id, entityType: 'person' as const, displayName: name };
    },
    [peopleRepo, store]
  );

  useEffect(() => {
    genRef.current++;
    const syncGen = genRef.current;
    const syncAll = async () => {
      for (let i = 0; i < additionalDebts.length; i++) {
        const debt = additionalDebts[i];
        if (!debt?.id) continue;

        // Resolve borrower set — supports joint (multiple borrowers on one obligation)
        const borrowerLabel = debt.borrower || 'client1';
        const borrowers: Array<{ entityId: string; entityType: 'person'; displayName: string }> = [];

        if (borrowerLabel === 'joint') {
          const c1 = resolveClientEntity('client1');
          const c2 = resolveClientEntity('client2');
          if (c1) borrowers.push(c1);
          if (c2) borrowers.push(c2);
        } else if (borrowerLabel === 'client1' || borrowerLabel === 'client2') {
          const info = resolveClientEntity(borrowerLabel);
          if (info) borrowers.push(info);
        } else if (borrowerLabel === 'other' && debt.borrowerOtherName?.trim()) {
          const info = await resolveOtherPersonEntity(debt.borrowerOtherName);
          if (info) borrowers.push(info);
        }

        if (borrowers.length === 0) continue;
        const borrowerInfo = borrowers[0];

        // Resolve lender
        const lenderName = debt.lender?.trim() || 'Unknown Lender';
        const lenderResult = await store.getOrCreateEntity(lenderName, 'lender', {
          sourceSection: 'debtObligations',
          completionStatus: 'identified',
        });

        const obligationType = resolveDebtType(debt);
        const isSecured = debt.isSecured === 'yes';

        // Build guarantors (joint = co-borrower, not guarantor)
        const guarantors: ObligationInput['guarantors'] = [];

        // For joint borrowers, add client2 as co-borrower via a second borrower_of relationship
        // syncObligation only supports one borrower, so we add client2 as a relationship after sync

        const input: ObligationInput = {
          obligationEntityId: debt.obligationEntityId,
          obligationType,
          direction: 'person_owes',
          borrower: { entityId: borrowerInfo.entityId, entityType: 'person', displayName: borrowerInfo.displayName },
          borrowers,
          lender: { entityId: lenderResult.entity.id, entityType: 'lender', displayName: lenderName },
          amount: debt.amount,
          amountUnknown: debt.amountUnknown === 'yes',
          interestRate: debt.interestRateUnknown === 'yes' ? undefined : debt.interestRate,
          secured: isSecured ? 'yes' : (debt.isSecured === 'not_sure' ? 'not_sure' : 'no'),
          collateralEntityId: isSecured && debt.collateralPropertyEntityId ? debt.collateralPropertyEntityId : undefined,
          collateralDescription: isSecured ? (debt.securedByOther || debt.securedByType) : undefined,
          guarantors,
          notes: debt.specialNotes,
          documentLocationId: debt.documentLocationId,
          documentLocationLabel: debt.documentLocation,
          paymentAmount: debt.paymentAmount,
          paymentFrequency: debt.paymentFrequency || debt.paymentFrequencyOther,
          paymentSourceBankRef: debt.paymentSourceBankRef,
          sourceSection: 'debtObligations',
          sourceRecordId: debt.id,
        };

        await syncObligation(input, store, (id) => {
          if (syncGen !== genRef.current) return;
          const updates: Record<string, unknown> = {
            obligationEntityId: id,
            borrowerEntityId: borrowerInfo!.entityId,
            lenderEntityId: lenderResult.entity.id,
          };
          updateEntry(i, updates, additionalDebts);
        });


      }
    };

    syncAll();
  }, [additionalDebts, client1Name, client2Name, client1EntityId, client2EntityId, hasSpouse, store, resolveClientEntity, resolveOtherPersonEntity, updateEntry]);

  const removeObligation = useCallback(
    async (obligationEntityId: string | undefined) => {
      await deleteObligation(obligationEntityId, store);
    },
    [store]
  );

  return { removeObligation };
}
