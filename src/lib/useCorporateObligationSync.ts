/**
 * Corporate Obligation Sync Hook — watches the 5 corporate debt data arrays
 * and syncs them to the unified Obligation architecture via obligationSync.
 *
 * Closure Gate fixes:
 * - `enabled` parameter: hook stays mounted but performs no work when disabled.
 * - Stable callback refs: onUpdateArray stored in ref.
 * - Source-signature-driven effect.
 * - getEntityById added to store.
 * - `registry.entities` access replaced with `store.getEntityById`.
 * - All syncObligation callbacks now check `syncGen !== genRef.current`.
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';
import { syncObligation, deleteObligation, normalizeObligationSource, type ObligationInput, type ObligationStore, type ObligationType } from './obligationSync';
import type { ShareholderLoanData } from '../components/ShareholderLoanDetails';
import type { CompanyOwedData } from '../components/CompanyOwedDetails';
import type { IntercompanyLoanData } from '../components/IntercompanyLoanDetails';
import type { RelatedPartyLoanData } from '../components/RelatedPartyLoanDetails';
import type { PersonalGuaranteeData } from '../components/PersonalGuaranteeDetails';
import type { DocumentLocationRef } from './documentLocationTypes';

type CorporateObligationSyncArgs = {
  enabled: boolean;
  shareholderLoans: ShareholderLoanData[];
  companyOwed: CompanyOwedData[];
  intercompanyLoans: IntercompanyLoanData[];
  relatedPartyLoans: RelatedPartyLoanData[];
  personalGuarantees: PersonalGuaranteeData[];
  client1Name: string;
  client2Name: string;
  client1PersonId: string;
  client1EntityId: string;
  client2PersonId: string;
  client2EntityId: string;
  hasSpouse: boolean;
  corporations: Array<{ legalName: string }>;
  onUpdateArray: (key: string, updated: unknown[]) => void;
};

type SyncableEntry = {
  obligationEntityId?: string;
  [key: string]: unknown;
};

const BORROWING_TYPE_MAP: Record<string, ObligationType> = {
  business_loan: 'corporate_term_loan',
  operating_line: 'corporate_operating_loan',
  business_credit_card: 'corporate_operating_loan',
  commercial_mortgage: 'mortgage',
  equipment_financing: 'corporate_term_loan',
  equipment_lease: 'corporate_term_loan',
  other: 'other_liability',
  not_sure: 'other_liability',
};

function resolveDocLocationRef(value: unknown): { label?: string; id?: string } {
  if (!value) return {};
  if (typeof value === 'string') return { label: value };
  if (typeof value === 'object' && value !== null && 'label' in value) {
    const ref = value as DocumentLocationRef;
    return { label: ref.label, id: ref.locationId };
  }
  return {};
}

export function useCorporateObligationSync({
  enabled,
  shareholderLoans,
  companyOwed,
  intercompanyLoans,
  relatedPartyLoans,
  personalGuarantees,
  client1Name,
  client2Name,
  client1PersonId: _client1PersonId,
  client1EntityId,
  client2PersonId: _client2PersonId,
  client2EntityId,
  hasSpouse,
  corporations,
  onUpdateArray,
}: CorporateObligationSyncArgs) {
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
  const genRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Stable ref for callback
  const onUpdateArrayRef = useRef(onUpdateArray);
  onUpdateArrayRef.current = onUpdateArray;

  // Stable refs for source data
  const shareholderLoansRef = useRef(shareholderLoans);
  shareholderLoansRef.current = shareholderLoans;
  const companyOwedRef = useRef(companyOwed);
  companyOwedRef.current = companyOwed;
  const intercompanyLoansRef = useRef(intercompanyLoans);
  intercompanyLoansRef.current = intercompanyLoans;
  const relatedPartyLoansRef = useRef(relatedPartyLoans);
  relatedPartyLoansRef.current = relatedPartyLoans;
  const personalGuaranteesRef = useRef(personalGuarantees);
  personalGuaranteesRef.current = personalGuarantees;

  const updateEntry = useCallback(
    (arrayKey: string, index: number, updates: Record<string, unknown>, current: SyncableEntry[]) => {
      const updated = [...current];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
        onUpdateArrayRef.current(arrayKey, updated);
      }
    },
    []
  );

  const resolveClientEntity = useCallback(
    (label: string): { entityId: string; displayName: string } | null => {
      if (label === 'client1') {
        if (client1EntityId) return { entityId: client1EntityId, displayName: client1Name || 'Client 1' };
        return null;
      }
      if (label === 'client2') {
        if (client2EntityId) return { entityId: client2EntityId, displayName: client2Name || 'Client 2' };
        return null;
      }
      return null;
    },
    [client1EntityId, client1Name, client2EntityId, client2Name]
  );

  const resolveOtherPersonEntity = useCallback(
    async (name: string): Promise<{ entityId: string; displayName: string } | null> => {
      if (!name.trim()) return null;
      const person = await peopleRepo.getOrCreatePerson(name);
      const personRepoId = person?.id;
      const result = await store.getOrCreateEntity(name, 'person', {
        sourceSection: 'corporateFinancialConnections',
        completionStatus: 'identified',
        metadata: personRepoId ? { personRepoId } : undefined,
      });
      return { entityId: result.entity.id, displayName: name };
    },
    [peopleRepo, store]
  );

  const resolvePersonEntity = useCallback(
    async (label: string): Promise<{ entityId: string; displayName: string } | null> => {
      const clientResult = resolveClientEntity(label);
      if (clientResult) return clientResult;
      if (label === 'client1' || label === 'client2') return null;
      return resolveOtherPersonEntity(label);
    },
    [resolveClientEntity, resolveOtherPersonEntity]
  );

  const sourceSignature = useMemo(() => {
    return normalizeObligationSource([shareholderLoans, companyOwed, intercompanyLoans, relatedPartyLoans, personalGuarantees, corporations]);
  }, [shareholderLoans, companyOwed, intercompanyLoans, relatedPartyLoans, personalGuarantees, corporations]);

  useEffect(() => {
    if (!enabledRef.current) return;
    genRef.current++;
    const syncGen = genRef.current;
    const syncAll = async () => {
      const shareholderLoans = shareholderLoansRef.current;
      const companyOwed = companyOwedRef.current;
      const intercompanyLoans = intercompanyLoansRef.current;
      const relatedPartyLoans = relatedPartyLoansRef.current;
      const personalGuarantees = personalGuaranteesRef.current;

      // ── Shareholder Loans (Corporation owes Person) ──
      for (let i = 0; i < shareholderLoans.length; i++) {
        const sl = shareholderLoans[i];
        if (!sl?.selectedCompany?.trim() || !sl?.owedTo?.trim()) continue;

        const corpResult = await store.getOrCreateEntity(sl.selectedCompany, 'corporation', {
          sourceSection: 'corporations',
          completionStatus: 'identified',
        });
        const personInfo = await resolvePersonEntity(sl.owedTo);
        if (!personInfo) continue;

        const { label: docLabel, id: docId } = resolveDocLocationRef(sl.docLocation);

        const input: ObligationInput = {
          obligationEntityId: sl.obligationEntityId,
          obligationType: 'shareholder_loan',
          direction: 'corporation_owes_person',
          borrower: { entityId: corpResult.entity.id, entityType: 'corporation', displayName: sl.selectedCompany },
          borrowers: [{ entityId: corpResult.entity.id, entityType: 'corporation' as const, displayName: sl.selectedCompany }],
          lender: { entityId: personInfo.entityId, entityType: 'person', displayName: personInfo.displayName },
          amount: sl.amount,
          amountUnknown: sl.amountUnknown === 'yes',
          interestRate: sl.paysInterest === 'yes' ? sl.interestRate : undefined,
          secured: 'no',
          guarantors: [],
          documentLocationLabel: docLabel,
          documentLocationId: docId,
          sourceSection: 'corporateFinancialConnections',
          sourceRecordId: `sl_${i}`,
        };

        await syncObligation(input, store, (id) => {
          if (syncGen !== genRef.current) return;
          updateEntry('shareholderLoansData', i, { obligationEntityId: id, borrowerEntityId: corpResult.entity.id, lenderEntityId: personInfo.entityId }, shareholderLoansRef.current);
        });
      }

      // ── Company Owed (Person owes Corporation) ──
      for (let i = 0; i < companyOwed.length; i++) {
        const co = companyOwed[i];
        if (!co?.selectedCompany?.trim() || !co?.owedBy?.trim()) continue;

        const corpResult = await store.getOrCreateEntity(co.selectedCompany, 'corporation', {
          sourceSection: 'corporations',
          completionStatus: 'identified',
        });
        const personInfo = await resolvePersonEntity(co.owedBy);
        if (!personInfo) continue;

        const { label: docLabel, id: docId } = resolveDocLocationRef(co.docLocation);

        const input: ObligationInput = {
          obligationEntityId: co.obligationEntityId,
          obligationType: 'shareholder_loan',
          direction: 'person_owes_corporation',
          borrower: { entityId: personInfo.entityId, entityType: 'person', displayName: personInfo.displayName },
          borrowers: [{ entityId: personInfo.entityId, entityType: 'person' as const, displayName: personInfo.displayName }],
          lender: { entityId: corpResult.entity.id, entityType: 'corporation', displayName: co.selectedCompany },
          amount: co.amount,
          amountUnknown: co.amountUnknown === 'yes',
          interestRate: co.paysInterest === 'yes' ? co.interestRate : undefined,
          secured: 'no',
          guarantors: [],
          documentLocationLabel: docLabel,
          documentLocationId: docId,
          sourceSection: 'corporateFinancialConnections',
          sourceRecordId: `co_${i}`,
        };

        await syncObligation(input, store, (id) => {
          if (syncGen !== genRef.current) return;
          updateEntry('companyOwedData', i, { obligationEntityId: id, borrowerEntityId: personInfo.entityId, lenderEntityId: corpResult.entity.id }, companyOwedRef.current);
        });
      }

      // ── Intercompany Loans ──
      for (let i = 0; i < intercompanyLoans.length; i++) {
        const ic = intercompanyLoans[i];
        if (!ic?.lenderCompany?.trim() || !ic?.borrowerCompany?.trim()) continue;

        const lenderResult = await store.getOrCreateEntity(ic.lenderCompany, 'corporation', {
          sourceSection: 'corporations',
          completionStatus: 'identified',
        });
        const borrowerResult = await store.getOrCreateEntity(ic.borrowerCompany, 'corporation', {
          sourceSection: 'corporations',
          completionStatus: 'identified',
        });

        const { label: docLabel, id: docId } = resolveDocLocationRef(ic.docLocation);

        const input: ObligationInput = {
          obligationEntityId: ic.obligationEntityId,
          obligationType: 'intercompany_loan',
          direction: 'corporation_owes_corporation',
          borrower: { entityId: borrowerResult.entity.id, entityType: 'corporation', displayName: ic.borrowerCompany },
          borrowers: [{ entityId: borrowerResult.entity.id, entityType: 'corporation' as const, displayName: ic.borrowerCompany }],
          lender: { entityId: lenderResult.entity.id, entityType: 'corporation', displayName: ic.lenderCompany },
          amount: ic.amount,
          amountUnknown: ic.amountUnknown === 'yes',
          interestRate: ic.chargesInterest === 'yes' ? ic.interestRate : undefined,
          secured: 'no',
          guarantors: [],
          documentLocationLabel: docLabel,
          documentLocationId: docId,
          sourceSection: 'corporateFinancialConnections',
          sourceRecordId: `ic_${i}`,
        };

        await syncObligation(input, store, (id) => {
          if (syncGen !== genRef.current) return;
          updateEntry('intercompanyLoansData', i, { obligationEntityId: id, lenderEntityId: lenderResult.entity.id, borrowerEntityId: borrowerResult.entity.id }, intercompanyLoansRef.current);
        });
      }

      // ── Related-Party Loans ──
      for (let i = 0; i < relatedPartyLoans.length; i++) {
        const rpl = relatedPartyLoans[i];
        if (!rpl?.direction?.trim()) continue;

        const direction = rpl.direction;
        let borrowerInfo: { entityId: string; displayName: string; entityType: 'person' | 'corporation' } | null = null;
        let lenderInfo: { entityId: string; displayName: string; entityType: 'person' | 'corporation' } | null = null;
        let obligationDirection: ObligationInput['direction'] = 'other';

        if (direction.startsWith('company_owes_other_')) {
          const corpIndex = parseInt(direction.replace('company_owes_other_', ''), 10);
          const corpName = corporations[corpIndex]?.legalName;
          if (!corpName) continue;

          const corpResult = await store.getOrCreateEntity(corpName, 'corporation', {
            sourceSection: 'corporations',
            completionStatus: 'identified',
          });
          const personInfo = await resolvePersonEntity('client1');
          if (!personInfo) continue;

          borrowerInfo = { entityId: corpResult.entity.id, displayName: corpName, entityType: 'corporation' };
          lenderInfo = { entityId: personInfo.entityId, displayName: personInfo.displayName, entityType: 'person' };
          obligationDirection = 'corporation_owes_person';
        } else if (direction.startsWith('other_owes_company_')) {
          const corpIndex = parseInt(direction.replace('other_owes_company_', ''), 10);
          const corpName = corporations[corpIndex]?.legalName;
          if (!corpName) continue;

          const corpResult = await store.getOrCreateEntity(corpName, 'corporation', {
            sourceSection: 'corporations',
            completionStatus: 'identified',
          });
          const personInfo = await resolvePersonEntity('client1');
          if (!personInfo) continue;

          borrowerInfo = { entityId: personInfo.entityId, displayName: personInfo.displayName, entityType: 'person' };
          lenderInfo = { entityId: corpResult.entity.id, displayName: corpName, entityType: 'corporation' };
          obligationDirection = 'person_owes_corporation';
        } else {
          continue;
        }

        if (!borrowerInfo || !lenderInfo) continue;

        const { label: docLabel, id: docId } = resolveDocLocationRef(rpl.docLocation);

        const input: ObligationInput = {
          obligationEntityId: rpl.obligationEntityId,
          obligationType: 'related_party_loan',
          direction: obligationDirection,
          borrower: { entityId: borrowerInfo.entityId, entityType: borrowerInfo.entityType, displayName: borrowerInfo.displayName },
          borrowers: [{ entityId: borrowerInfo.entityId, entityType: borrowerInfo.entityType as 'person' | 'corporation', displayName: borrowerInfo.displayName }],
          lender: { entityId: lenderInfo.entityId, entityType: lenderInfo.entityType, displayName: lenderInfo.displayName },
          amount: rpl.amount,
          amountUnknown: rpl.amountUnknown === 'yes',
          secured: 'no',
          guarantors: [],
          documentLocationLabel: docLabel,
          documentLocationId: docId,
          sourceSection: 'corporateFinancialConnections',
          sourceRecordId: `rpl_${i}`,
        };

        await syncObligation(input, store, (id) => {
          if (syncGen !== genRef.current) return;
          updateEntry('relatedPartyLoansData', i, { obligationEntityId: id, borrowerEntityId: borrowerInfo!.entityId, lenderEntityId: lenderInfo!.entityId }, relatedPartyLoansRef.current);
        });
      }

      // ── Personal / Corporate Guarantees ──
      for (let i = 0; i < personalGuarantees.length; i++) {
        const pg = personalGuarantees[i];
        if (!pg?.selectedCompany?.trim()) continue;

        const corpResult = await store.getOrCreateEntity(pg.selectedCompany, 'corporation', {
          sourceSection: 'corporations',
          completionStatus: 'identified',
        });

        const guarantors: ObligationInput['guarantors'] = [];
        const guarantorLabels = pg.guarantors || [];

        for (const gLabel of guarantorLabels) {
          if (gLabel === 'client1' || gLabel === 'client2' || gLabel === 'both') {
            if (gLabel === 'both' && hasSpouse) {
              const g1 = await resolvePersonEntity('client1');
              const g2 = await resolvePersonEntity('client2');
              if (g1) guarantors.push({ entityId: g1.entityId, entityType: 'person', displayName: g1.displayName });
              if (g2) guarantors.push({ entityId: g2.entityId, entityType: 'person', displayName: g2.displayName });
            } else {
              const gInfo = await resolvePersonEntity(gLabel);
              if (gInfo) guarantors.push({ entityId: gInfo.entityId, entityType: 'person', displayName: gInfo.displayName });
            }
          } else if (gLabel.startsWith('corp_')) {
            const corpIndex = parseInt(gLabel.replace('corp_', ''), 10);
            const corpName = corporations[corpIndex]?.legalName;
            if (corpName) {
              const gResult = await store.getOrCreateEntity(corpName, 'corporation', {
                sourceSection: 'corporations',
                completionStatus: 'identified',
              });
              guarantors.push({ entityId: gResult.entity.id, entityType: 'corporation', displayName: corpName });
            }
          }
        }

        for (const og of (pg.otherGuarantors || [])) {
          if (og.name?.trim()) {
            const gInfo = await resolveOtherPersonEntity(og.name);
            if (gInfo) guarantors.push({ entityId: gInfo.entityId, entityType: 'person', displayName: gInfo.displayName });
          }
        }

        const { label: docLabel, id: docId } = resolveDocLocationRef(pg.docLocation);
        const obligationSelection = pg.obligationSelection || '';
        const selectedObligationId = pg.selectedObligationId || '';

        if (obligationSelection === 'not_sure') {
          if (syncGen !== genRef.current) return;
          updateEntry('personalGuaranteesData', i, {
            guarantorEntityIds: guarantors.map((g) => g.entityId),
            guaranteeLinkRequiresConfirmation: true,
            obligationEntityId: undefined,
          }, personalGuaranteesRef.current);
          continue;
        }

        if (obligationSelection === 'existing_obligation' && selectedObligationId) {
          // Use store.getEntityById instead of registry.entities to avoid
          // depending on the entities collection (self-feedback loop).
          const existingObligation = store.getEntityById(selectedObligationId);
          if (!existingObligation || existingObligation.entityType !== 'obligation') continue;

          const meta = (existingObligation.metadata || {}) as Record<string, unknown>;
          const existingBorrowerId = meta.borrowerEntityId as string;
          const existingLenderId = meta.lenderEntityId as string;

          const input: ObligationInput = {
            obligationEntityId: selectedObligationId,
            obligationType: meta.obligationType as ObligationType || 'other_liability',
            direction: 'other',
            borrower: { entityId: existingBorrowerId, entityType: 'corporation', displayName: corpResult.entity.displayName },
            borrowers: [{ entityId: existingBorrowerId, entityType: 'corporation' as const, displayName: corpResult.entity.displayName }],
            lender: { entityId: existingLenderId, entityType: 'lender', displayName: '' },
            amount: meta.amount as string || '',
            amountUnknown: false,
            secured: 'no',
            guarantors,
            documentLocationLabel: docLabel,
            documentLocationId: docId,
            sourceSection: 'corporateFinancialConnections',
            sourceRecordId: `pg_${i}`,
          };

          await syncObligation(input, store, (id) => {
            if (syncGen !== genRef.current) return;
            updateEntry('personalGuaranteesData', i, {
              obligationEntityId: id,
              borrowerEntityId: existingBorrowerId,
              lenderEntityId: existingLenderId,
              guarantorEntityIds: guarantors.map((g) => g.entityId),
              guaranteeLinkRequiresConfirmation: false,
            }, personalGuaranteesRef.current);
          });
          continue;
        }

        if (obligationSelection === 'another_borrowing' || !obligationSelection) {
          let lenderEntityId: string | undefined;
          let lenderDisplayName = '';

          if (pg.lenderName?.trim() && pg.lenderUnknown !== 'yes') {
            const lenderResult = await store.getOrCreateEntity(pg.lenderName, 'lender', {
              sourceSection: 'corporateFinancialConnections',
              completionStatus: 'identified',
            });
            lenderEntityId = lenderResult.entity.id;
            lenderDisplayName = pg.lenderName;
          }

          if (!lenderEntityId) {
            if (syncGen !== genRef.current) return;
            updateEntry('personalGuaranteesData', i, {
              guarantorEntityIds: guarantors.map((g) => g.entityId),
              guaranteeLinkRequiresConfirmation: true,
            }, personalGuaranteesRef.current);
            continue;
          }

          const borrowingType = BORROWING_TYPE_MAP[pg.borrowingType] || 'other_liability';

          const input: ObligationInput = {
            obligationEntityId: pg.obligationEntityId,
            obligationType: borrowingType,
            direction: 'other',
            borrower: { entityId: corpResult.entity.id, entityType: 'corporation', displayName: pg.selectedCompany },
            borrowers: [{ entityId: corpResult.entity.id, entityType: 'corporation' as const, displayName: pg.selectedCompany }],
            lender: { entityId: lenderEntityId, entityType: 'lender', displayName: lenderDisplayName },
            amount: pg.amountOwed,
            amountUnknown: pg.amountOwedUnknown === 'yes',
            secured: pg.hasPledgedSecurity === 'yes' ? 'yes' : 'no',
            collateralDescription: pg.hasPledgedSecurity === 'yes' ? (pg.pledgedAssets || []).join(', ') : undefined,
            guarantors,
            documentLocationLabel: docLabel,
            documentLocationId: docId,
            notes: pg.arrangementDescription || (pg.guaranteeScope === 'entire_amount' ? 'Guarantee covers the entire amount' : undefined),
            sourceSection: 'corporateFinancialConnections',
            sourceRecordId: `pg_${i}`,
          };

          await syncObligation(input, store, (id) => {
            if (syncGen !== genRef.current) return;
            updateEntry('personalGuaranteesData', i, {
              obligationEntityId: id,
              borrowerEntityId: corpResult.entity.id,
              lenderEntityId,
              guarantorEntityIds: guarantors.map((g) => g.entityId),
              guaranteeLinkRequiresConfirmation: false,
            }, personalGuaranteesRef.current);
          });
          continue;
        }
      }
    };

    syncAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSignature, store, resolveClientEntity, resolveOtherPersonEntity, resolvePersonEntity, updateEntry]);

  const removeObligation = useCallback(
    async (obligationEntityId: string | undefined) => {
      await deleteObligation(obligationEntityId, store);
    },
    [store]
  );

  return { removeObligation };
}
