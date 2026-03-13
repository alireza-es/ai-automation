export type CycleStatus = 'Active' | 'PendingApproval' | 'FinalApproval' | 'Draft';
export type CycleType = 'Promotion' | 'Equity' | 'General';
export type FilterOperator = 'IN' | 'NOT_IN';

export interface CompensationCycle {
  id: string;
  name: string;
  status: CycleStatus;
  type: CycleType;
}

export interface FilterCondition {
  field: keyof CompensationCycle;
  operator: FilterOperator;
  values: string[];
}

/**
 * Master list of compensation cycles.
 *
 * History: "Promotion Equity" was accidentally omitted from this list,
 * causing CycleStatusIN, CycleStatusNotIN, and MixedFilterLogic test
 * failures on the Compensation Cycles page (issue #11).  It has been
 * restored as the fix for those failures.
 */
export const compensationCycles: CompensationCycle[] = [
  { id: '1', name: 'Regression Promo', status: 'Active', type: 'Promotion' },
  { id: '2', name: 'Regression Equity', status: 'Active', type: 'Equity' },
  { id: '3', name: 'Regression Equity 2', status: 'Active', type: 'Equity' },
  { id: '4', name: 'Regression Pending Approval', status: 'PendingApproval', type: 'General' },
  { id: '5', name: 'Worksheet Final Approval', status: 'FinalApproval', type: 'General' },
  { id: '6', name: 'Promotion Equity', status: 'Active', type: 'Equity' },
];

/**
 * Filters compensation cycles based on one or more conditions.
 * All conditions are combined with AND logic.
 *
 * @param cycles - The list of cycles to filter.
 * @param conditions - Filter conditions to apply.
 * @returns Cycles that satisfy every condition.
 */
export function filterCycles(
  cycles: CompensationCycle[],
  conditions: FilterCondition[],
): CompensationCycle[] {
  return cycles.filter(cycle =>
    conditions.every(condition => {
      const value = String(cycle[condition.field]);
      return condition.operator === 'IN'
        ? condition.values.includes(value)
        : !condition.values.includes(value);
    }),
  );
}

/**
 * Convenience wrapper: returns cycles whose status is IN the provided list.
 */
export function filterByStatusIn(
  cycles: CompensationCycle[],
  statuses: CycleStatus[],
): CompensationCycle[] {
  return filterCycles(cycles, [{ field: 'status', operator: 'IN', values: statuses }]);
}

/**
 * Convenience wrapper: returns cycles whose status is NOT IN the provided list.
 */
export function filterByStatusNotIn(
  cycles: CompensationCycle[],
  statuses: CycleStatus[],
): CompensationCycle[] {
  return filterCycles(cycles, [{ field: 'status', operator: 'NOT_IN', values: statuses }]);
}
