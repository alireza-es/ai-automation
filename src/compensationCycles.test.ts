import { describe, it, expect } from 'vitest';
import {
  compensationCycles,
  filterByStatusIn,
  filterByStatusNotIn,
  filterCycles,
} from './compensationCycles.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const names = (cycles: { name: string }[]) => cycles.map(c => c.name);

// ---------------------------------------------------------------------------
// CycleStatusIN – Verification of Filters on the Compensation Cycles Page
// ---------------------------------------------------------------------------
describe('CycleStatusINVerificationOfFiltersOnTheCompensationCyclesPage', () => {
  it('returns all Active cycles including Promotion Equity', () => {
    const result = filterByStatusIn(compensationCycles, ['Active']);
    const resultNames = names(result);

    expect(resultNames).toContain('Promotion Equity');
    expect(resultNames).toContain('Regression Promo');
    expect(resultNames).toContain('Regression Equity');
    expect(resultNames).toContain('Regression Equity 2');
  });

  it('excludes cycles with PendingApproval and FinalApproval statuses', () => {
    const result = filterByStatusIn(compensationCycles, ['Active']);
    const resultNames = names(result);

    expect(resultNames).not.toContain('Regression Pending Approval');
    expect(resultNames).not.toContain('Worksheet Final Approval');
  });

  it('returns an empty list when filtering by a status that no cycle has', () => {
    const result = filterByStatusIn(compensationCycles, ['Draft']);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// CycleStatusNotIN – Verification of Filters on the Compensation Cycles Page
// ---------------------------------------------------------------------------
describe('CycleStatusNotINVerificationOfFiltersOnTheCompensationCyclesPage', () => {
  it('excludes PendingApproval and FinalApproval cycles while keeping Promotion Equity', () => {
    const result = filterByStatusNotIn(compensationCycles, ['PendingApproval', 'FinalApproval']);
    const resultNames = names(result);

    expect(resultNames).toContain('Promotion Equity');
    expect(resultNames).toContain('Regression Promo');
    expect(resultNames).toContain('Regression Equity');
    expect(resultNames).toContain('Regression Equity 2');
  });

  it('removes cycles whose status matches the exclusion list', () => {
    const result = filterByStatusNotIn(compensationCycles, ['PendingApproval', 'FinalApproval']);
    const resultNames = names(result);

    expect(resultNames).not.toContain('Regression Pending Approval');
    expect(resultNames).not.toContain('Worksheet Final Approval');
  });

  it('returns all cycles when the exclusion list matches no existing status', () => {
    const result = filterByStatusNotIn(compensationCycles, ['Draft']);
    const resultNames = names(result);

    expect(resultNames).toContain('Promotion Equity');
    expect(resultNames).toContain('Regression Promo');
    expect(resultNames).toContain('Regression Equity');
    expect(resultNames).toContain('Regression Equity 2');
    expect(resultNames).toContain('Regression Pending Approval');
    expect(resultNames).toContain('Worksheet Final Approval');
  });
});

// ---------------------------------------------------------------------------
// MixedFilterLogic – Verification on the Compensation Cycles Page
// ---------------------------------------------------------------------------
describe('MixedFilterLogicVerificationOnTheCompensationCyclesPage', () => {
  it('returns all Equity-type cycles including Promotion Equity', () => {
    const result = filterCycles(compensationCycles, [
      { field: 'type', operator: 'IN', values: ['Equity'] },
    ]);
    const resultNames = names(result);

    expect(resultNames).toEqual(
      expect.arrayContaining(['Regression Equity', 'Regression Equity 2', 'Promotion Equity']),
    );
    expect(result).toHaveLength(3);
  });

  it('returns Active Promotion-type cycles including Regression Promo', () => {
    const result = filterCycles(compensationCycles, [
      { field: 'status', operator: 'IN', values: ['Active'] },
      { field: 'type', operator: 'IN', values: ['Promotion'] },
    ]);
    const resultNames = names(result);

    expect(resultNames).toContain('Regression Promo');
    expect(result).toHaveLength(1);
  });

  it('applies NOT_IN type filter correctly, excluding Equity cycles', () => {
    const result = filterCycles(compensationCycles, [
      { field: 'type', operator: 'NOT_IN', values: ['Equity'] },
    ]);
    const resultNames = names(result);

    expect(resultNames).not.toContain('Regression Equity');
    expect(resultNames).not.toContain('Regression Equity 2');
    expect(resultNames).not.toContain('Promotion Equity');
    expect(resultNames).toContain('Regression Promo');
  });

  it('handles combined status IN and type NOT_IN filter', () => {
    const result = filterCycles(compensationCycles, [
      { field: 'status', operator: 'IN', values: ['Active'] },
      { field: 'type', operator: 'NOT_IN', values: ['General'] },
    ]);
    const resultNames = names(result);

    expect(resultNames).toContain('Regression Promo');
    expect(resultNames).toContain('Regression Equity');
    expect(resultNames).toContain('Regression Equity 2');
    expect(resultNames).toContain('Promotion Equity');
  });
});
