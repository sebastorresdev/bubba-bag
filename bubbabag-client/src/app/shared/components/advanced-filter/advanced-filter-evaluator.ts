import { FilterGroup, FilterCondition, ColumnDataType } from './advanced-filter.models';

export function evaluateFilterGroup(
  item: any,
  group: FilterGroup | null | undefined,
  columnTypes: Record<string, ColumnDataType>
): boolean {
  if (!group || !group.conditions || group.conditions.length === 0) {
    return true;
  }

  // Filtrar solo condiciones válidas que tengan campo seleccionado
  const validConditions = group.conditions.filter((c) => !!c.field);
  if (validConditions.length === 0) {
    return true;
  }

  if (group.logic === 'AND') {
    return validConditions.every((cond) =>
      evaluateCondition(item, cond, columnTypes[cond.field] || 'text')
    );
  } else {
    return validConditions.some((cond) =>
      evaluateCondition(item, cond, columnTypes[cond.field] || 'text')
    );
  }
}

function evaluateCondition(
  item: any,
  cond: FilterCondition,
  dataType: ColumnDataType
): boolean {
  const rawValue = item[cond.field];

  // 1. Operadores unarios de presencia de datos
  if (cond.operator === 'hasValue') {
    return rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== '';
  }
  if (cond.operator === 'noValue') {
    return rawValue === null || rawValue === undefined || String(rawValue).trim() === '';
  }

  // Si el valor del item es nulo o indefinido y no es hasValue/noValue
  if (rawValue === null || rawValue === undefined) {
    return false;
  }

  // 2. Evaluación según tipo de dato
  switch (dataType) {
    case 'number':
    case 'currency':
      return evaluateNumber(Number(rawValue), cond);

    case 'date':
      return evaluateDate(rawValue, cond);

    case 'boolean':
      return evaluateBoolean(rawValue, cond);

    case 'select':
      return evaluateSelect(rawValue, cond);

    case 'text':
    default:
      return evaluateText(String(rawValue), cond);
  }
}

function evaluateText(val: string, cond: FilterCondition): boolean {
  const target = (cond.value !== undefined && cond.value !== null ? String(cond.value) : '').toLowerCase().trim();
  const current = val.toLowerCase().trim();

  switch (cond.operator) {
    case 'contains':
      return current.includes(target);
    case 'notContains':
      return !current.includes(target);
    case 'equals':
      return current === target;
    case 'notEquals':
      return current !== target;
    case 'startsWith':
      return current.startsWith(target);
    case 'endsWith':
      return current.endsWith(target);
    default:
      return true;
  }
}

function evaluateNumber(num: number, cond: FilterCondition): boolean {
  if (isNaN(num)) return false;
  const target = Number(cond.value);
  if (isNaN(target) && cond.operator !== 'between') return true;

  switch (cond.operator) {
    case 'equals':
      return num === target;
    case 'notEquals':
      return num !== target;
    case 'greaterThan':
      return num > target;
    case 'greaterOrEqual':
      return num >= target;
    case 'lessThan':
      return num < target;
    case 'lessOrEqual':
      return num <= target;
    case 'between': {
      const target2 = Number(cond.secondValue);
      if (isNaN(target) || isNaN(target2)) return true;
      const min = Math.min(target, target2);
      const max = Math.max(target, target2);
      return num >= min && num <= max;
    }
    default:
      return true;
  }
}

function evaluateDate(rawDate: any, cond: FilterCondition): boolean {
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return false;

  const toYmd = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;

  const currentYmd = toYmd(d);

  if (cond.operator === 'today') {
    return currentYmd === toYmd(new Date());
  }

  if (cond.operator === 'thisWeek') {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return d >= startOfWeek && d <= endOfWeek;
  }

  if (cond.operator === 'thisMonth') {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  if (!cond.value) return true;
  const targetDate = new Date(cond.value);
  if (isNaN(targetDate.getTime())) return true;
  const targetYmd = toYmd(targetDate);

  switch (cond.operator) {
    case 'equals':
      return currentYmd === targetYmd;
    case 'before':
      return currentYmd < targetYmd;
    case 'after':
      return currentYmd > targetYmd;
    case 'between': {
      if (!cond.secondValue) return true;
      const targetDate2 = new Date(cond.secondValue);
      if (isNaN(targetDate2.getTime())) return true;
      const targetYmd2 = toYmd(targetDate2);
      const min = currentYmd >= (targetYmd < targetYmd2 ? targetYmd : targetYmd2);
      const max = currentYmd <= (targetYmd > targetYmd2 ? targetYmd : targetYmd2);
      return min && max;
    }
    default:
      return true;
  }
}

function evaluateBoolean(val: any, cond: FilterCondition): boolean {
  const boolVal = typeof val === 'boolean' ? val : String(val).toLowerCase() === 'true';
  const target =
    typeof cond.value === 'boolean'
      ? cond.value
      : String(cond.value).toLowerCase() === 'true';

  if (cond.operator === 'equals') {
    return boolVal === target;
  }
  return true;
}

function evaluateSelect(val: any, cond: FilterCondition): boolean {
  const current = String(val);

  switch (cond.operator) {
    case 'equals':
      return current === String(cond.value);
    case 'notEquals':
      return current !== String(cond.value);
    case 'in':
      if (Array.isArray(cond.value)) {
        return cond.value.map(String).includes(current);
      }
      return current === String(cond.value);
    case 'notIn':
      if (Array.isArray(cond.value)) {
        return !cond.value.map(String).includes(current);
      }
      return current !== String(cond.value);
    default:
      return true;
  }
}
