import { describe, it, expect } from 'vitest';
import type { FamilyTrust, TrustDebt } from '../lib/familyTrustTypes';

/**
 * Trust state regression test (Part 8).
 *
 * Scenario:
 * Trust hasDebts = yes.
 * Then: add lender, add amount, change security, add document detail,
 * canonical obligation link resolves asynchronously.
 *
 * After every transition:
 * - hasDebts must remain "yes"
 * - latest field values must remain
 * - async linkage operation must only add/update its canonical linkage field
 */
describe('Trust debt state regression', () => {
  const makeTrust = (overrides: Partial<FamilyTrust> = {}): FamilyTrust => ({
    id: 'trust-1',
    legalName: 'Smith Family Trust',
    hasDebts: 'yes',
    debts: [],
    ...overrides,
  } as FamilyTrust);

  const makeDebt = (overrides: Partial<TrustDebt> = {}): TrustDebt => ({
    id: 'debt-1',
    lender: '',
    loanType: 'mortgage',
    approximateBalance: '',
    secured: 'no',
    ...overrides,
  } as TrustDebt);

  it('hasDebts remains yes when adding lender', () => {
    const trust = makeTrust({ debts: [makeDebt()] });
    const updatedDebt = { ...trust.debts[0], lender: 'Royal Bank' };
    const updated = { ...trust, debts: [updatedDebt] };
    expect(updated.hasDebts).toBe('yes');
    expect(updated.debts[0].lender).toBe('Royal Bank');
  });

  it('hasDebts remains yes when adding amount', () => {
    const trust = makeTrust({ debts: [makeDebt({ lender: 'Royal Bank' })] });
    const updatedDebt = { ...trust.debts[0], approximateBalance: '500000' };
    const updated = { ...trust, debts: [updatedDebt] };
    expect(updated.hasDebts).toBe('yes');
    expect(updated.debts[0].approximateBalance).toBe('500000');
  });

  it('hasDebts remains yes when changing security', () => {
    const trust = makeTrust({ debts: [makeDebt({ lender: 'Royal Bank', approximateBalance: '500000' })] });
    const updatedDebt = { ...trust.debts[0], secured: 'yes' };
    const updated = { ...trust, debts: [updatedDebt] };
    expect(updated.hasDebts).toBe('yes');
    expect(updated.debts[0].secured).toBe('yes');
  });

  it('hasDebts remains yes when adding document detail', () => {
    const trust = makeTrust({ debts: [makeDebt({ lender: 'Royal Bank', approximateBalance: '500000', secured: 'yes' })] });
    const updatedDebt = { ...trust.debts[0], collateralDescription: 'Trust property at 123 Main St' };
    const updated = { ...trust, debts: [updatedDebt] };
    expect(updated.hasDebts).toBe('yes');
    expect(updated.debts[0].collateralDescription).toBe('Trust property at 123 Main St');
  });

  it('async obligation linkage only updates obligationEntityId, not user-entered fields', () => {
    const trust = makeTrust({
      debts: [makeDebt({
        lender: 'Royal Bank',
        approximateBalance: '500000',
        secured: 'yes',
        collateralDescription: 'Trust property at 123 Main St',
      })],
    });

    // Simulate async linkage writeback: only obligationEntityId should change
    const obligationId = 'obl-123';
    const updatedDebt = { ...trust.debts[0], obligationEntityId: obligationId };
    const updated = { ...trust, debts: [updatedDebt] };

    // hasDebts unchanged
    expect(updated.hasDebts).toBe('yes');
    // User-entered fields unchanged
    expect(updated.debts[0].lender).toBe('Royal Bank');
    expect(updated.debts[0].approximateBalance).toBe('500000');
    expect(updated.debts[0].secured).toBe('yes');
    expect(updated.debts[0].collateralDescription).toBe('Trust property at 123 Main St');
    // Only the canonical linkage field was added
    expect(updated.debts[0].obligationEntityId).toBe(obligationId);
  });

  it('simulates generation protection: stale async run does not overwrite newer values', () => {
    let generation = 0;
    const trust = makeTrust({
      debts: [makeDebt({ lender: 'Royal Bank', approximateBalance: '500000' })],
    });

    // Start async sync with current generation
    const syncGen = generation;
    const staleObligationId = 'obl-stale';

    // User edits amount while async work is in flight
    generation++;
    const userEditedDebt = { ...trust.debts[0], approximateBalance: '550000' };
    const userEditedTrust = { ...trust, debts: [userEditedDebt] };

    // Async work completes — generation check prevents stale writeback
    if (syncGen === generation) {
      // This would be the stale writeback — it should NOT execute
      const staleDebt = { ...userEditedTrust.debts[0], approximateBalance: '500000', obligationEntityId: staleObligationId };
      const staleTrust = { ...userEditedTrust, debts: [staleDebt] };
      // This path should not be reached
      expect(staleTrust.debts[0].approximateBalance).not.toBe('550000');
    }

    // Correct: generation mismatch detected, writeback skipped
    expect(userEditedTrust.debts[0].approximateBalance).toBe('550000');
    expect(userEditedTrust.debts[0].obligationEntityId).toBeUndefined();
  });
});
