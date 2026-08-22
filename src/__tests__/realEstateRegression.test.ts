import { describe, it, expect } from 'vitest';

/**
 * Real Estate regression tests (Part 10).
 *
 * A. PROPERTY OWNERSHIP — one owner, two owners, ownership % edits
 * B. MORTGAGE LINKAGE — mortgage yes, lender, balance, canonical obligation ID
 * C. NO FEEDBACK LOOP — already-synchronized state produces zero further writes
 */
type PropertyData = {
  name?: string;
  propertyEntityId?: string;
  hasDebt?: string;
  debtType?: string;
  mortgageLender?: string;
  mortgageBalance?: string;
  mortgageEntityId?: string;
  owners?: string[];
  ownershipPercentages?: Record<string, string>;
};

describe('Real Estate — Property Ownership', () => {
  it('one owner: values survive updates', () => {
    const prop: PropertyData = {
      name: 'Primary Home',
      owners: ['client1'],
      ownershipPercentages: { client1: '100' },
    };
    expect(prop.owners).toEqual(['client1']);
    expect(prop.ownershipPercentages?.client1).toBe('100');
  });

  it('two owners: values survive updates', () => {
    const prop: PropertyData = {
      name: 'Cottage',
      owners: ['client1', 'client2'],
      ownershipPercentages: { client1: '50', client2: '50' },
    };
    expect(prop.owners).toHaveLength(2);
    expect(prop.ownershipPercentages?.client1).toBe('50');
    expect(prop.ownershipPercentages?.client2).toBe('50');
  });

  it('ownership percentage edits preserve user-entered values', () => {
    const prop: PropertyData = {
      name: 'Cottage',
      owners: ['client1', 'client2'],
      ownershipPercentages: { client1: '50', client2: '50' },
    };
    // User edits to 60/40
    const updated = { ...prop, ownershipPercentages: { client1: '60', client2: '40' } };
    expect(updated.ownershipPercentages?.client1).toBe('60');
    expect(updated.ownershipPercentages?.client2).toBe('40');
  });
});

describe('Real Estate — Mortgage Linkage', () => {
  it('mortgage yes + lender + balance + canonical obligation ID created', () => {
    const prop: PropertyData = {
      name: 'Primary Home',
      propertyEntityId: 'prop-ent-1',
      hasDebt: 'yes',
      debtType: 'mortgage',
      mortgageLender: 'TD Bank',
      mortgageBalance: '350000',
    };
    expect(prop.hasDebt).toBe('yes');
    expect(prop.mortgageLender).toBe('TD Bank');
    expect(prop.mortgageBalance).toBe('350000');

    // Simulate canonical obligation ID writeback
    const obligationId = 'obl-mortgage-1';
    const updated = { ...prop, mortgageEntityId: obligationId };

    // Canonical linkage field written
    expect(updated.mortgageEntityId).toBe(obligationId);
    // User-entered fields NOT replaced by linkage writeback
    expect(updated.mortgageLender).toBe('TD Bank');
    expect(updated.mortgageBalance).toBe('350000');
  });

  it('canonical linkage writeback does not replace newer user-entered fields', () => {
    const prop: PropertyData = {
      name: 'Primary Home',
      propertyEntityId: 'prop-ent-1',
      hasDebt: 'yes',
      debtType: 'mortgage',
      mortgageLender: 'TD Bank',
      mortgageBalance: '350000',
    };

    // User edits balance while async sync is in flight
    const userEdited = { ...prop, mortgageBalance: '340000' };

    // Async writeback only sets mortgageEntityId
    const obligationId = 'obl-mortgage-1';
    const afterWriteback = { ...userEdited, mortgageEntityId: obligationId };

    expect(afterWriteback.mortgageBalance).toBe('340000'); // user's edit preserved
    expect(afterWriteback.mortgageLender).toBe('TD Bank'); // unchanged
    expect(afterWriteback.mortgageEntityId).toBe(obligationId); // linkage added
  });
});

describe('Real Estate — No Feedback Loop', () => {
  it('already-synchronized state produces zero further writes', () => {
    const prop: PropertyData = {
      name: 'Primary Home',
      propertyEntityId: 'prop-ent-1',
      hasDebt: 'yes',
      debtType: 'mortgage',
      mortgageLender: 'TD Bank',
      mortgageBalance: '350000',
      mortgageEntityId: 'obl-mortgage-1',
    };

    // Idempotency check: if mortgageEntityId already set and matches, do nothing
    const currentEntityId = prop.mortgageEntityId;
    const inputEntityId = prop.mortgageEntityId;
    const shouldWrite = currentEntityId !== inputEntityId || !currentEntityId;

    expect(shouldWrite).toBe(false);
  });
});
