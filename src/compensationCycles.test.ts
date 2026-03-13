import { describe, it, expect } from 'vitest';
import {
  compensationCycles,
  filterCyclesByStatus,
  filterCyclesMixed,
} from './compensationCycles.js';

/**
 * These tests mirror the three failing automation scenarios:
 *
 *  - CycleStatusINVerificationOfFiltersOnTheCompensationCyclesPage
 *  - CycleStatusNotINVerificationOfFiltersOnTheCompensationCyclesPage
 *  - MixedFilterLogicVerificationOnTheCompensationCyclesPage
 *
 * Root cause: "Promotion Equity" was missing from the compensation cycles data.
 * Fix: the cycle has been restored with status "Verification" and type "Equity".
 */

describe('CycleStatusINVerificationOfFiltersOnTheCompensationCyclesPage', () => {
  it('should include Promotion Equity when filtering cycles with status IN [Verification]', () => {
    const results = filterCyclesByStatus(compensationCycles, {
      operator: 'IN',
      statuses: ['Verification'],
    });

    const names = results.map(c => c.name);

    expect(names).toContain('Promotion Equity');
    expect(names).toContain('Regression Equity');
    expect(names).toContain('Regression Equity 2');
  });

  it('should not include non-Verification cycles when filtering status IN [Verification]', () => {
    const results = filterCyclesByStatus(compensationCycles, {
      operator: 'IN',
      statuses: ['Verification'],
    });

    const names = results.map(c => c.name);

    expect(names).not.toContain('Regression Promo');
    expect(names).not.toContain('Regression Pending Approval');
    expect(names).not.toContain('Worksheet Final Approval');
  });
});

describe('CycleStatusNotINVerificationOfFiltersOnTheCompensationCyclesPage', () => {
  it('should include Promotion Equity when filtering cycles with status NOT_IN [Draft]', () => {
    const results = filterCyclesByStatus(compensationCycles, {
      operator: 'NOT_IN',
      statuses: ['Draft'],
    });

    const names = results.map(c => c.name);

    expect(names).toContain('Promotion Equity');
  });

  it('should include all non-Draft cycles including Promotion Equity', () => {
    const results = filterCyclesByStatus(compensationCycles, {
      operator: 'NOT_IN',
      statuses: ['Draft'],
    });

    const names = results.map(c => c.name);

    expect(names).toContain('Regression Promo');
    expect(names).toContain('Regression Equity');
    expect(names).toContain('Regression Equity 2');
    expect(names).toContain('Regression Pending Approval');
    expect(names).toContain('Worksheet Final Approval');
    expect(names).toContain('Promotion Equity');
  });

  it('should exclude cycles whose status is in the NOT_IN filter set', () => {
    const results = filterCyclesByStatus(compensationCycles, {
      operator: 'NOT_IN',
      statuses: ['Active', 'PendingApproval', 'WorksheetFinalApproval'],
    });

    const names = results.map(c => c.name);

    // Active cycle excluded
    expect(names).not.toContain('Regression Promo');
    // PendingApproval excluded
    expect(names).not.toContain('Regression Pending Approval');
    // WorksheetFinalApproval excluded
    expect(names).not.toContain('Worksheet Final Approval');

    // Verification cycles still visible
    expect(names).toContain('Regression Equity');
    expect(names).toContain('Regression Equity 2');
    expect(names).toContain('Promotion Equity');
  });
});

describe('MixedFilterLogicVerificationOnTheCompensationCyclesPage', () => {
  it('should return all Equity cycles with Verification status, including Promotion Equity', () => {
    const results = filterCyclesMixed(
      compensationCycles,
      { operator: 'IN', statuses: ['Verification'] },
      { operator: 'IN', types: ['Equity'] },
    );

    const names = results.map(c => c.name);

    expect(names).toEqual(
      expect.arrayContaining(['Regression Equity', 'Regression Equity 2', 'Promotion Equity']),
    );
    expect(names).toHaveLength(3);
  });

  it('should not include Regression Promo when type filter is IN [Equity]', () => {
    const results = filterCyclesMixed(
      compensationCycles,
      { operator: 'IN', statuses: ['Active', 'Verification'] },
      { operator: 'IN', types: ['Equity'] },
    );

    const names = results.map(c => c.name);

    expect(names).not.toContain('Regression Promo');
    expect(names).toContain('Promotion Equity');
  });

  it('should apply NOT_IN status filter correctly alongside type IN filter', () => {
    const results = filterCyclesMixed(
      compensationCycles,
      { operator: 'NOT_IN', statuses: ['Active', 'PendingApproval', 'WorksheetFinalApproval'] },
      { operator: 'IN', types: ['Equity'] },
    );

    const names = results.map(c => c.name);

    expect(names).toContain('Regression Equity');
    expect(names).toContain('Regression Equity 2');
    expect(names).toContain('Promotion Equity');
    expect(names).toHaveLength(3);
  });
});
