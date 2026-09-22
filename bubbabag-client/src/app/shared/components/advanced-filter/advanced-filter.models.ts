export type ColumnDataType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'boolean'
  | 'select';

export type FilterLogic = 'AND' | 'OR';

export type FilterOperator =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'greaterOrEqual'
  | 'lessThan'
  | 'lessOrEqual'
  | 'between'
  | 'before'
  | 'after'
  | 'today'
  | 'thisWeek'
  | 'thisMonth'
  | 'in'
  | 'notIn'
  | 'hasValue'
  | 'noValue';

export interface OperatorOption {
  value: FilterOperator;
  label: string;
  unary?: boolean; // Si es true (ej: 'hasValue', 'noValue', 'today'), no requiere input de valor
  requiresRange?: boolean; // Si es 'between', requiere segundo valor
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  secondValue?: any;
}

export interface FilterGroup {
  id: string;
  logic: FilterLogic;
  conditions: FilterCondition[];
}

export interface AdvancedFilterState {
  active: boolean;
  group: FilterGroup;
}

export const OPERATORS_BY_TYPE: Record<ColumnDataType, OperatorOption[]> = {
  text: [
    { value: 'contains', label: 'Contiene' },
    { value: 'notContains', label: 'No contiene' },
    { value: 'equals', label: 'Es igual a' },
    { value: 'notEquals', label: 'No es igual a' },
    { value: 'startsWith', label: 'Empieza con' },
    { value: 'endsWith', label: 'Termina con' },
    { value: 'hasValue', label: 'Tiene datos', unary: true },
    { value: 'noValue', label: 'No tiene datos', unary: true },
  ],
  number: [
    { value: 'equals', label: 'Es igual a' },
    { value: 'notEquals', label: 'No es igual a' },
    { value: 'greaterThan', label: 'Mayor que' },
    { value: 'greaterOrEqual', label: 'Mayor o igual a' },
    { value: 'lessThan', label: 'Menor que' },
    { value: 'lessOrEqual', label: 'Menor o igual a' },
    { value: 'between', label: 'Entre', requiresRange: true },
    { value: 'hasValue', label: 'Tiene datos', unary: true },
    { value: 'noValue', label: 'No tiene datos', unary: true },
  ],
  currency: [
    { value: 'equals', label: 'Es igual a' },
    { value: 'notEquals', label: 'No es igual a' },
    { value: 'greaterThan', label: 'Mayor que' },
    { value: 'greaterOrEqual', label: 'Mayor o igual a' },
    { value: 'lessThan', label: 'Menor que' },
    { value: 'lessOrEqual', label: 'Menor o igual a' },
    { value: 'between', label: 'Entre', requiresRange: true },
    { value: 'hasValue', label: 'Tiene datos', unary: true },
    { value: 'noValue', label: 'No tiene datos', unary: true },
  ],
  date: [
    { value: 'equals', label: 'Es igual a' },
    { value: 'after', label: 'Posterior a' },
    { value: 'before', label: 'Anterior a' },
    { value: 'between', label: 'Entre', requiresRange: true },
    { value: 'today', label: 'Hoy', unary: true },
    { value: 'thisWeek', label: 'Esta semana', unary: true },
    { value: 'thisMonth', label: 'Este mes', unary: true },
    { value: 'hasValue', label: 'Tiene datos', unary: true },
    { value: 'noValue', label: 'No tiene datos', unary: true },
  ],
  boolean: [
    { value: 'equals', label: 'Es igual a' },
  ],
  select: [
    { value: 'equals', label: 'Es igual a' },
    { value: 'notEquals', label: 'No es igual a' },
    { value: 'in', label: 'Cualquiera de (en la lista)' },
    { value: 'notIn', label: 'Ninguno de (no en la lista)' },
    { value: 'hasValue', label: 'Tiene datos', unary: true },
    { value: 'noValue', label: 'No tiene datos', unary: true },
  ],
};
