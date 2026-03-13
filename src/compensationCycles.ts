export type CycleStatus =
  | 'Active'
  | 'Verification'
  | 'PendingApproval'
  | 'WorksheetFinalApproval'
  | 'Draft';

export type CycleType = 'Merit' | 'Equity' | 'Promo';

export type FilterOperator = 'IN' | 'NOT_IN';

export interface CompensationCycle {
  id: number;
  name: string;
  status: CycleStatus;
  type: CycleType;
}

export interface StatusFilter {
  operator: FilterOperator;
  statuses: CycleStatus[];
}

export interface TypeFilter {
  operator: FilterOperator;
  types: CycleType[];
}

/**
 * All known compensation cycles.
 * "Promotion Equity" (id 6) was previously missing, causing
 * CycleStatusIN, CycleStatusNotIN and MixedFilterLogic test failures.
 */
export const compensationCycles: CompensationCycle[] = [
  { id: 1, name: 'Regression Promo', status: 'Active', type: 'Promo' },
  { id: 2, name: 'Regression Equity', status: 'Verification', type: 'Equity' },
  { id: 3, name: 'Regression Equity 2', status: 'Verification', type: 'Equity' },
  { id: 4, name: 'Regression Pending Approval', status: 'PendingApproval', type: 'Merit' },
  { id: 5, name: 'Worksheet Final Approval', status: 'WorksheetFinalApproval', type: 'Merit' },
  { id: 6, name: 'Promotion Equity', status: 'Verification', type: 'Equity' },
];

/**
 * Filter cycles by their status using IN or NOT_IN operator.
 */
export function filterCyclesByStatus(
  cycles: CompensationCycle[],
  filter: StatusFilter,
): CompensationCycle[] {
  return cycles.filter(cycle => {
    if (filter.operator === 'IN') {
      return filter.statuses.includes(cycle.status);
    }
    return !filter.statuses.includes(cycle.status);
  });
}

/**
 * Filter cycles using a combination of status and optional type filters.
 * Both filters are combined with AND logic.
 */
export function filterCyclesMixed(
  cycles: CompensationCycle[],
  statusFilter: StatusFilter,
  typeFilter?: TypeFilter,
): CompensationCycle[] {
  let result = filterCyclesByStatus(cycles, statusFilter);

  if (typeFilter) {
    result = result.filter(cycle => {
      if (typeFilter.operator === 'IN') {
        return typeFilter.types.includes(cycle.type);
      }
      return !typeFilter.types.includes(cycle.type);
    });
  }

  return result;
}
