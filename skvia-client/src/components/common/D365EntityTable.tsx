import { useIsMobile } from '../../hooks/useMediaQuery';
import { D365MobileRecords } from './D365MobileRecords';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  type TableColumnDefinition,
  type SelectionItemId,
  type OnSelectionChangeData,
  Button,
  Badge,
  Input,
  Select,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowSortDown16Regular,
  ArrowSortUp16Regular,
  ChevronLeft16Regular,
  ChevronRight16Regular,
  ChevronDoubleLeft16Regular,
  ChevronDoubleRight16Regular,
  DataFunnel20Regular,
  Search16Regular,
  TableEdit16Regular,
} from '@fluentui/react-icons';
import { useD365ListStyles } from '../../styles/d365ListStyles';
import { D365ListState } from './D365ListState';
import { TableEmptyState } from './TableEmptyState';
import {
  D365FiltrosAvanzadosDrawer,
  type D365FilterCondition,
  type D365FilterField,
} from './D365FiltrosAvanzadosDrawer';
import {
  D365EditarColumnasDrawer,
  type D365ColumnConfig,
} from './D365EditarColumnasDrawer';

export { type D365FilterField, type D365FilterCondition, type D365ColumnConfig };

const useStyles = makeStyles({
  tableRoot: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  headerCell: {
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationFaster,
    userSelect: 'none',
    backgroundColor: tokens.colorNeutralBackground2,
    position: 'sticky',
    top: 0,
    zIndex: 2,
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
    ':active': {
      backgroundColor: tokens.colorSubtleBackgroundPressed,
    },
  },
  headerCellContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    position: 'relative',
    userSelect: 'none',
  },
  headerTitleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: tokens.fontWeightSemibold,
  },
  sortIcon: {
    fontSize: '14px',
  },
  resizeHandle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '10px',
    cursor: 'col-resize',
    zIndex: 10,
    userSelect: 'none',
    borderRight: `2px solid transparent`,
    ':hover': {
      borderRight: `2px solid ${tokens.colorCompoundBrandBackground}`,
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  resizingLine: {
    backgroundColor: tokens.colorCompoundBrandBackground,
  },
  paginationBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    flexWrap: 'wrap',
    gap: '8px',
    minHeight: '42px',
    boxSizing: 'border-box',
    userSelect: 'none',
  },
  paginationLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  paginationRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '8px',
  },
});

export function matchFilterCondition<T>(
  item: T,
  cond: D365FilterCondition,
  fields?: D365FilterField[]
): boolean {
  const record = item as Record<string, unknown>;
  const rawValue = record[cond.field];
  const fieldDef = fields?.find((f) => f.id === cond.field);
  const target = (cond.value || '').trim();

  // Operadores de presencia/vacío
  if (cond.operator === 'is_empty') {
    if (rawValue === null || rawValue === undefined) return true;
    return String(rawValue).trim() === '';
  }
  if (cond.operator === 'not_empty') {
    if (rawValue === null || rawValue === undefined) return false;
    return String(rawValue).trim() !== '';
  }

  // Candidatos de valor para este item en este campo
  const candidateValues: string[] = [];

  if (rawValue !== null && rawValue !== undefined) {
    candidateValues.push(String(rawValue));
  }

  if (cond.field === 'codigoAbonado' || cond.field === 'codigoContrato') {
    if (record['clienteServicioCodigo']) candidateValues.push(String(record['clienteServicioCodigo']));
    if (record['clienteServicioCodigoExterno']) candidateValues.push(String(record['clienteServicioCodigoExterno']));
    if (record['codigoContrato']) candidateValues.push(String(record['codigoContrato']));
  }

  if (cond.field === 'codigoExternoTrabajo' || cond.field === 'numeroOrden' || cond.field === 'referenciaExterna') {
    if (record['codigoExternoTrabajo']) candidateValues.push(String(record['codigoExternoTrabajo']));
    if (record['numeroOrden']) candidateValues.push(String(record['numeroOrden']));
    if (record['referenciaExterna']) candidateValues.push(String(record['referenciaExterna']));
    if (record['primerTrabajoCodExt']) candidateValues.push(String(record['primerTrabajoCodExt']));
  }

  // Si existe una versión con nombre legible (ej. cond.field + 'Nombre', o 'tipo' -> 'tipoNombre')
  const fieldNombre = record[`${cond.field}Nombre`];
  if (fieldNombre !== null && fieldNombre !== undefined) {
    candidateValues.push(String(fieldNombre));
  }

  // Si es booleano
  if (typeof rawValue === 'boolean') {
    candidateValues.push(rawValue ? 'activo' : 'inactivo');
    candidateValues.push(rawValue ? 'sí' : 'no');
    candidateValues.push(rawValue ? 'si' : 'no');
    candidateValues.push(rawValue ? 'true' : 'false');
  }

  // Si existen opciones en la definición del campo
  if (fieldDef?.options) {
    for (const opt of fieldDef.options) {
      if (
        String(rawValue).toLowerCase() === opt.value.toLowerCase() ||
        String(rawValue).toLowerCase() === opt.label.toLowerCase()
      ) {
        candidateValues.push(opt.value);
        candidateValues.push(opt.label);
      }
    }
  }

  // Equivalencias estándar de dominio para tipo de almacén (1 = Bodega, 2 = Custodia personal)
  if (cond.field === 'tipo') {
    if (rawValue === 1 || String(rawValue) === '1' || String(rawValue).toLowerCase() === 'bodega') {
      candidateValues.push('1', 'bodega');
    } else if (rawValue === 2 || String(rawValue) === '2' || String(rawValue).toLowerCase().includes('custodia')) {
      candidateValues.push('2', 'custodia personal', 'custodia');
    }
  }

  // Resolver tokens de destino esperados
  const targetTokens: string[] = [target];
  if (fieldDef?.options) {
    for (const opt of fieldDef.options) {
      if (opt.value.toLowerCase() === target.toLowerCase()) {
        targetTokens.push(opt.label);
      } else if (opt.label.toLowerCase() === target.toLowerCase()) {
        targetTokens.push(opt.value);
      }
    }
  }

  // Comparaciones numéricas
  if (
    cond.operator === 'greater_than' ||
    cond.operator === 'less_than' ||
    cond.operator === 'greater_or_equal' ||
    cond.operator === 'less_or_equal'
  ) {
    const numRaw = Number(rawValue);
    const numTarget = Number(target);
    if (!isNaN(numRaw) && !isNaN(numTarget)) {
      switch (cond.operator) {
        case 'greater_than':
          return numRaw > numTarget;
        case 'less_than':
          return numRaw < numTarget;
        case 'greater_or_equal':
          return numRaw >= numTarget;
        case 'less_or_equal':
          return numRaw <= numTarget;
      }
    }
  }

  const isNegation = cond.operator === 'not_equals' || cond.operator === 'not_contains';

  const matchesAny = candidateValues.some((val) => {
    const v = val.toLowerCase();
    return targetTokens.some((t) => {
      const tgt = t.toLowerCase();
      switch (cond.operator) {
        case 'equals':
        case 'not_equals':
          return v === tgt;
        case 'contains':
        case 'not_contains':
          return v.includes(tgt);
        case 'starts_with':
          return v.startsWith(tgt);
        case 'ends_with':
          return v.endsWith(tgt);
        default:
          return true;
      }
    });
  });

  return isNegation ? !matchesAny : matchesAny;
}

export interface D365EntityTableProps<T extends { id: string }> {
  items: T[];
  columns: TableColumnDefinition<T>[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectionMode?: 'single' | 'multiselect';
  selectedItems?: Set<SelectionItemId>;
  onSelectionChange?: (e: unknown, data: OnSelectionChangeData) => void;
  entityName?: string;
  tableId?: string;
  filterFields?: D365FilterField[];
  onRowDoubleClick?: (item: T) => void;
  showToolbarTools?: boolean;
  emptyState?: React.ReactNode;
  pagination?: boolean | { pageSize?: number; pageSizeOptions?: number[] };
}

export interface D365TableConfiguration {
  columnas?: D365ColumnConfig[];
  anchos?: Record<string, number>;
  filtros?:
    | {
        conditions: D365FilterCondition[];
        logicalOperator?: 'and' | 'or';
      }
    | D365FilterCondition[];
}

export interface D365EntityTableRef {
  openFilters: () => void;
  openColumns: () => void;
  getActiveFilterCount: () => number;
  getCurrentConfiguration: () => {
    columnas: D365ColumnConfig[];
    anchos: Record<string, number>;
    filtros: { conditions: D365FilterCondition[]; logicalOperator: 'and' | 'or' };
    defaultColumnas: D365ColumnConfig[];
  };
  applyViewConfiguration: (config: D365TableConfiguration) => void;
  resetFilters: () => void;
  resetToDefault: () => void;
  subscribeConfigChange: (callback: (config: {
    columnas: D365ColumnConfig[];
    anchos: Record<string, number>;
    filtros: { conditions: D365FilterCondition[]; logicalOperator: 'and' | 'or' };
    defaultColumnas: D365ColumnConfig[];
  }) => void) => () => void;
}

export interface D365TableToolbarToolsProps {
  onOpenFilters?: () => void;
  onOpenColumns?: () => void;
  activeFilterCount?: number;
  tableRef?: React.RefObject<D365EntityTableRef | null>;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
}

export function D365TableToolbarTools({
  onOpenFilters,
  onOpenColumns,
  activeFilterCount = 0,
  tableRef,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar',
  searchAriaLabel,
}: D365TableToolbarToolsProps) {
  const isMobile = useIsMobile(768);
  const [filterCount, setFilterCount] = useState<number>(() => {
    return tableRef?.current ? tableRef.current.getActiveFilterCount() : activeFilterCount;
  });

  useEffect(() => {
    setFilterCount(tableRef?.current ? tableRef.current.getActiveFilterCount() : activeFilterCount);
  }, [activeFilterCount, tableRef]);

  useEffect(() => {
    if (!tableRef?.current?.subscribeConfigChange) return;
    const unsub = tableRef.current.subscribeConfigChange((cfg) => {
      setFilterCount(cfg.filtros?.conditions?.length || 0);
    });
    return () => unsub();
  }, [tableRef]);

  const handleFilters = () => {
    if (tableRef?.current) tableRef.current.openFilters();
    else if (onOpenFilters) onOpenFilters();
  };

  const handleColumns = () => {
    if (tableRef?.current) tableRef.current.openColumns();
    else if (onOpenColumns) onOpenColumns();
  };

  const count = filterCount;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
      {/* 1° Editar columnas */}
      <Button
        appearance="subtle"
        icon={<TableEdit16Regular />}
        title="Editar columnas"
        aria-label="Editar columnas"
        onClick={handleColumns}
      >
        {!isMobile && 'Editar columnas'}
      </Button>

      {/* 2° Editar filtros (con Drawer) */}
      <Button
        appearance={count > 0 ? 'secondary' : 'subtle'}
        icon={<DataFunnel20Regular />}
        title="Editar filtros (aplicar filtros)"
        aria-label="Editar filtros"
        onClick={handleFilters}
      >
        {!isMobile && 'Editar filtros'}
        {count > 0 && (
          <Badge appearance="filled" color="brand" size="small" style={{ marginLeft: '4px' }}>
            {count}
          </Badge>
        )}
      </Button>

      {/* 3° Cuadro de búsqueda al final a la derecha */}
      {onSearchChange !== undefined && (
        <Input
          size="medium"
          contentBefore={<Search16Regular />}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel || searchPlaceholder}
          value={searchValue || ''}
          onChange={(_, d) => onSearchChange(d.value)}
        />
      )}
    </div>
  );
}

function D365EntityTableInner<T extends { id: string }>(
  {
    items,
    columns,
    loading = false,
    error = null,
    onRetry,
    selectionMode,
    selectedItems,
    onSelectionChange,
    entityName = 'Registros',
    tableId,
    filterFields,
    onRowDoubleClick,
    showToolbarTools = false,
    emptyState,
    pagination,
  }: D365EntityTableProps<T>,
  ref: React.Ref<D365EntityTableRef>
) {
  const isMobile = useIsMobile(768);
  const styles = useD365ListStyles();
  const customStyles = useStyles();
  const storageId = tableId || entityName.toLowerCase().replace(/\s+/g, '_');

  // Paginación
  const paginationEnabled = pagination !== false;
  const initialPageSize = typeof pagination === 'object' && pagination?.pageSize ? pagination.pageSize : 25;
  const pageSizeOptions = typeof pagination === 'object' && pagination?.pageSizeOptions ? pagination.pageSizeOptions : [15, 25, 50, 100];
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 1. Columnas y persistencia
  const defaultColumnsConfig = useMemo<D365ColumnConfig[]>(() => {
    return columns.map((c) => ({
      id: String(c.columnId),
      label:
        typeof c.renderHeaderCell === 'function' && typeof c.renderHeaderCell() === 'string'
          ? (c.renderHeaderCell() as string)
          : String(c.columnId),
      visible: true,
    }));
  }, [columns]);

  const [columnsConfig, setColumnsConfig] = useState<D365ColumnConfig[]>(() => {
    const saved = localStorage.getItem(`d365_grid_cols_${storageId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as D365ColumnConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const currentMap = new Map(columns.map((c) => [String(c.columnId), c]));
          const merged: D365ColumnConfig[] = parsed.filter((p) => currentMap.has(p.id));
          currentMap.forEach((colDef, id) => {
            if (!merged.some((m) => m.id === id)) {
              const label =
                typeof colDef.renderHeaderCell === 'function' && typeof colDef.renderHeaderCell() === 'string'
                  ? (colDef.renderHeaderCell() as string)
                  : id;
              merged.push({ id, label, visible: true });
            }
          });
          return merged;
        }
      } catch {
        // fallback
      }
    }
    return defaultColumnsConfig;
  });

  const [drawerColumnasOpen, setDrawerColumnasOpen] = useState(false);

  const configListenersRef = useRef<Set<(config: {
    columnas: D365ColumnConfig[];
    anchos: Record<string, number>;
    filtros: { conditions: D365FilterCondition[]; logicalOperator: 'and' | 'or' };
    defaultColumnas: D365ColumnConfig[];
  }) => void>>(new Set());

  const notifyConfigChange = (
    cols = columnsConfig,
    widths = columnWidths,
    conds = advancedConditions,
    op = advancedLogicalOp
  ) => {
    const payload = {
      columnas: cols,
      anchos: widths,
      filtros: { conditions: conds, logicalOperator: op },
      defaultColumnas: defaultColumnsConfig,
    };
    configListenersRef.current.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('Error in config listener', e);
      }
    });
  };

  const handleApplyColumns = (updated: D365ColumnConfig[]) => {
    setColumnsConfig(updated);
    localStorage.setItem(`d365_grid_cols_${storageId}`, JSON.stringify(updated));
    notifyConfigChange(updated, columnWidths, advancedConditions, advancedLogicalOp);
  };

  // 2. Ancho de Columnas (Resizing)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`d365_grid_widths_${storageId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {};
  });

  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  const handleResizeStart = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cellEl = (e.currentTarget.parentElement?.parentElement as HTMLElement) || null;
    const currentWidth = cellEl ? cellEl.getBoundingClientRect().width : (columnWidths[colId] || 150);

    resizingRef.current = {
      colId,
      startX: e.clientX,
      startWidth: Math.max(70, currentWidth),
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const deltaX = moveEvent.clientX - resizingRef.current.startX;
      const newWidth = Math.max(70, resizingRef.current.startWidth + deltaX);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingRef.current!.colId]: Math.round(newWidth),
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (resizingRef.current) {
        setColumnWidths((latest) => {
          localStorage.setItem(`d365_grid_widths_${storageId}`, JSON.stringify(latest));
          notifyConfigChange(columnsConfig, latest, advancedConditions, advancedLogicalOp);
          return latest;
        });
        resizingRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 3. Sorting State
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleToggleSort = (colId: string) => {
    if (sortColumn === colId) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colId);
      setSortDirection('asc');
    }
  };

  // 4. Advanced Filter Drawer State (Dynamics 365)
  const [drawerFiltrosOpen, setDrawerFiltrosOpen] = useState(false);
  const [advancedConditions, setAdvancedConditions] = useState<D365FilterCondition[]>(() => {
    const saved = localStorage.getItem(`d365_grid_filters_${storageId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.conditions)) return parsed.conditions;
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [advancedLogicalOp, setAdvancedLogicalOp] = useState<'and' | 'or'>(() => {
    const saved = localStorage.getItem(`d365_grid_filters_${storageId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.logicalOperator === 'and' || parsed.logicalOperator === 'or')) {
          return parsed.logicalOperator;
        }
      } catch {
        // fallback
      }
    }
    return 'and';
  });

  const handleApplyAdvancedFilters = (
    conditions: D365FilterCondition[],
    logicalOperator: 'and' | 'or' = 'and'
  ) => {
    setAdvancedConditions(conditions);
    setAdvancedLogicalOp(logicalOperator);
    localStorage.setItem(
      `d365_grid_filters_${storageId}`,
      JSON.stringify({ conditions, logicalOperator })
    );
    notifyConfigChange(columnsConfig, columnWidths, conditions, logicalOperator);
  };

  const handleResetAdvancedFilters = () => {
    setAdvancedConditions([]);
    setAdvancedLogicalOp('and');
    localStorage.removeItem(`d365_grid_filters_${storageId}`);
    notifyConfigChange(columnsConfig, columnWidths, [], 'and');
  };

  // Campos para Filtros Avanzados
  const derivedFields = useMemo<D365FilterField[]>(() => {
    if (filterFields && filterFields.length > 0) return filterFields;
    return columnsConfig.map((c) => ({
      id: c.id,
      label: c.label,
      type: 'string',
    }));
  }, [filterFields, columnsConfig]);

  // 5. Filtrado & Ordenamiento de Datos
  const processedItems = useMemo(() => {
    let result = [...items];

    // Aplicar Filtros Avanzados
    if (advancedConditions.length > 0) {
      if (advancedLogicalOp === 'or') {
        result = result.filter((item) =>
          advancedConditions.some((cond) => matchFilterCondition(item, cond, derivedFields))
        );
      } else {
        result = result.filter((item) =>
          advancedConditions.every((cond) => matchFilterCondition(item, cond, derivedFields))
        );
      }
    }

    // Aplicar Ordenamiento
    if (sortColumn) {
      const colDef = columns.find((c) => String(c.columnId) === sortColumn);
      result.sort((a, b) => {
        if (colDef && colDef.compare) {
          const comp = colDef.compare(a, b);
          return sortDirection === 'asc' ? comp : -comp;
        }
        const valA = (a as Record<string, unknown>)[sortColumn];
        const valB = (b as Record<string, unknown>)[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        const strA = String(valA);
        const strB = String(valB);
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [items, advancedConditions, advancedLogicalOp, sortColumn, sortDirection, columns, derivedFields]);

  // Paginación de items procesados
  const totalPages = Math.max(1, Math.ceil(processedItems.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const pagedItems = useMemo(() => {
    if (!paginationEnabled) return processedItems;
    const startIndex = (currentPage - 1) * pageSize;
    return processedItems.slice(startIndex, startIndex + pageSize);
  }, [processedItems, paginationEnabled, currentPage, pageSize]);

  // Columnas visibles y ordenadas
  const activeColumns = useMemo(() => {
    const colMap = new Map(columns.map((c) => [String(c.columnId), c]));
    return columnsConfig
      .filter((c) => c.visible && colMap.has(c.id))
      .map((c) => colMap.get(c.id)!);
  }, [columns, columnsConfig]);

  React.useImperativeHandle(ref, () => ({
    openFilters: () => setDrawerFiltrosOpen(true),
    openColumns: () => setDrawerColumnasOpen(true),
    getActiveFilterCount: () => advancedConditions.length,
    getCurrentConfiguration: () => ({
      columnas: columnsConfig,
      anchos: columnWidths,
      filtros: {
        conditions: advancedConditions,
        logicalOperator: advancedLogicalOp,
      },
      defaultColumnas: defaultColumnsConfig,
    }),
    applyViewConfiguration: (config: D365TableConfiguration) => {
      if (config.columnas && Array.isArray(config.columnas)) {
        setColumnsConfig(config.columnas);
        localStorage.setItem(`d365_grid_cols_${storageId}`, JSON.stringify(config.columnas));
      }
      if (config.anchos) {
        setColumnWidths(config.anchos);
        localStorage.setItem(`d365_grid_widths_${storageId}`, JSON.stringify(config.anchos));
      }
      let nextConds: D365FilterCondition[] = [];
      let nextOp: 'and' | 'or' = 'and';
      if (config.filtros) {
        if (Array.isArray(config.filtros)) {
          nextConds = config.filtros;
        } else if (config.filtros.conditions) {
          nextConds = config.filtros.conditions;
          nextOp = config.filtros.logicalOperator || 'and';
        }
        setAdvancedConditions(nextConds);
        setAdvancedLogicalOp(nextOp);
        localStorage.setItem(
          `d365_grid_filters_${storageId}`,
          JSON.stringify({ conditions: nextConds, logicalOperator: nextOp })
        );
      } else {
        setAdvancedConditions([]);
        setAdvancedLogicalOp('and');
        localStorage.removeItem(`d365_grid_filters_${storageId}`);
      }
    },
    resetFilters: () => {
      setAdvancedConditions([]);
      setAdvancedLogicalOp('and');
      localStorage.removeItem(`d365_grid_filters_${storageId}`);
      notifyConfigChange(columnsConfig, columnWidths, [], 'and');
    },
    resetToDefault: () => {
      setColumnsConfig(defaultColumnsConfig);
      setColumnWidths({});
      setAdvancedConditions([]);
      setAdvancedLogicalOp('and');
      localStorage.removeItem(`d365_grid_cols_${storageId}`);
      localStorage.removeItem(`d365_grid_widths_${storageId}`);
      localStorage.removeItem(`d365_grid_filters_${storageId}`);
      notifyConfigChange(defaultColumnsConfig, {}, [], 'and');
    },
    subscribeConfigChange: (cb: (config: {
      columnas: D365ColumnConfig[];
      anchos: Record<string, number>;
      filtros: { conditions: D365FilterCondition[]; logicalOperator: 'and' | 'or' };
      defaultColumnas: D365ColumnConfig[];
    }) => void) => {
      configListenersRef.current.add(cb);
      return () => {
        configListenersRef.current.delete(cb);
      };
    },
  }));

  return (
    <>
      {showToolbarTools && (
        <div style={{ padding: '4px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <D365TableToolbarTools
            onOpenFilters={() => setDrawerFiltrosOpen(true)}
            onOpenColumns={() => setDrawerColumnasOpen(true)}
            activeFilterCount={advancedConditions.length}
          />
        </div>
      )}

      <div className={customStyles.tableRoot}>
        <div className={styles.gridWrapper} style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
          <D365ListState loading={loading} error={error} onRetry={onRetry}>
            {isMobile ? <>
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', flexWrap: 'wrap' }}>
                <Select aria-label="Ordenar por" value={sortColumn ?? ''} onChange={(_, data) => { setSortColumn(data.value || null); setSortDirection('asc'); }}>
                  <option value="">Sin orden</option>
                  {activeColumns.map(column => <option key={column.columnId} value={String(column.columnId)}>{defaultColumnsConfig.find(c => c.id === String(column.columnId))?.label}</option>)}
                </Select>
                {sortColumn && <Button aria-label={sortDirection === 'asc' ? 'Cambiar a orden descendente' : 'Cambiar a orden ascendente'} icon={sortDirection === 'asc' ? <ArrowSortUp16Regular /> : <ArrowSortDown16Regular />} onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} />}
                {selectionMode === 'multiselect' && processedItems.length > 0 && <Button onClick={event => onSelectionChange?.(event, { selectedItems: processedItems.every(item => selectedItems?.has(item.id)) ? new Set() : new Set(processedItems.map(item => item.id)) })}>{processedItems.every(item => selectedItems?.has(item.id)) ? 'Quitar selección' : 'Seleccionar todos'}</Button>}
              </div>
              {processedItems.length === 0 ? (emptyState || <TableEmptyState />) : <D365MobileRecords items={pagedItems} columns={activeColumns} getRowId={item => item.id} selectionMode={selectionMode} selectedItems={selectedItems} onSelectionChange={onSelectionChange} onOpen={onRowDoubleClick} label={entityName} />}
            </> : <DataGrid
              items={pagedItems}
              columns={activeColumns}
              getRowId={(item) => item.id}
              selectionMode={selectionMode}
              selectedItems={selectedItems}
              onSelectionChange={onSelectionChange}
              className={styles.table}
            >
              <DataGridHeader style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: tokens.colorNeutralBackground2 }}>
                <DataGridRow selectionCell={selectionMode ? {} : undefined}>
                  {({ renderHeaderCell, columnId }) => {
                    const idStr = String(columnId);
                    const isSorted = sortColumn === idStr;
                    const width = columnWidths[idStr];

                    return (
                      <DataGridHeaderCell
                        sortIcon={null}
                        aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        className={customStyles.headerCell}
                        onClick={() => handleToggleSort(idStr)}
                        style={{
                          width: width ? `${width}px` : undefined,
                          minWidth: width ? `${width}px` : '70px',
                          maxWidth: width ? `${width}px` : undefined,
                          flex: width ? `0 0 ${width}px` : undefined,
                          boxSizing: 'border-box',
                          position: 'relative',
                          overflow: 'visible',
                        }}
                      >
                        <div className={customStyles.headerCellContent}>
                          <button
                            type="button"
                            className={customStyles.headerTitleBtn}
                            style={{ background: 'transparent', color: 'inherit', border: 0, padding: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                            title="Haga clic para ordenar"
                            onClick={event => { event.stopPropagation(); handleToggleSort(idStr); }}
                          >
                            {renderHeaderCell()}
                            {isSorted &&
                              (sortDirection === 'asc' ? (
                                <ArrowSortUp16Regular className={customStyles.sortIcon} />
                              ) : (
                                <ArrowSortDown16Regular className={customStyles.sortIcon} />
                              ))}
                          </button>

                          {/* Control de redimensionamiento de columna */}
                          <div
                            className={customStyles.resizeHandle}
                            onMouseDown={(e) => handleResizeStart(idStr, e)}
                            onClick={(e) => e.stopPropagation()}
                            title="Arrastrar para redimensionar columna"
                          />
                        </div>
                      </DataGridHeaderCell>
                    );
                  }}
                </DataGridRow>
              </DataGridHeader>
              {processedItems.length === 0 ? (
                emptyState || <TableEmptyState />
              ) : (
                <DataGridBody<T>>
                  {({ item, rowId }) => (
                    <DataGridRow<T>
                      key={rowId}
                      className={styles.dataRow}
                      onDoubleClick={() => onRowDoubleClick?.(item)}
                      onKeyDown={event => { if (event.key === 'Enter' && onRowDoubleClick && !(event.target as HTMLElement).closest('button, input, a')) { event.preventDefault(); onRowDoubleClick(item); } }}
                    >
                      {({ renderCell, columnId }) => {
                        const idStr = String(columnId);
                        const width = columnWidths[idStr];
                        return (
                          <DataGridCell
                            className={styles.dataCell}
                            style={{
                              width: width ? `${width}px` : undefined,
                              minWidth: width ? `${width}px` : '70px',
                              maxWidth: width ? `${width}px` : undefined,
                              flex: width ? `0 0 ${width}px` : undefined,
                              boxSizing: 'border-box',
                            }}
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest('a, button, [role="button"], input, select, textarea')) {
                                e.stopPropagation();
                              }
                            }}
                          >
                            {renderCell(item)}
                          </DataGridCell>
                        );
                      }}
                    </DataGridRow>
                  )}
                </DataGridBody>
              )}
            </DataGrid>}
          </D365ListState>
        </div>

        {paginationEnabled && (
          <div className={customStyles.paginationBar}>
            <div className={customStyles.paginationLeft}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {processedItems.length === 0
                  ? '0 registros'
                  : `Mostrando ${Math.min((currentPage - 1) * pageSize + 1, processedItems.length)} - ${Math.min(currentPage * pageSize, processedItems.length)} de ${processedItems.length} registros`}
              </Text>
              {selectedItems && selectedItems.size > 0 && (
                <Text size={200} weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
                  ({selectedItems.size} seleccionado{selectedItems.size > 1 ? 's' : ''})
                </Text>
              )}
            </div>
            {processedItems.length > 0 && (
              <div className={customStyles.paginationRight}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Filas por página:</Text>
                  <Select
                    size="small"
                    value={String(pageSize)}
                    onChange={(_, d) => {
                      const newSize = Number(d.value) || 25;
                      setPageSize(newSize);
                      setCurrentPage(1);
                    }}
                  >
                    {pageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                </div>
                <div className={customStyles.paginationControls}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronDoubleLeft16Regular />}
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    title="Primera página"
                    aria-label="Primera página"
                  />
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronLeft16Regular />}
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    title="Página anterior"
                    aria-label="Página anterior"
                  />
                  <Text size={200} weight="semibold" style={{ margin: '0 8px' }}>
                    Página {currentPage} de {totalPages}
                  </Text>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronRight16Regular />}
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    title="Página siguiente"
                    aria-label="Página siguiente"
                  />
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronDoubleRight16Regular />}
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    title="Última página"
                    aria-label="Última página"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Filtros Avanzados (Dynamics 365) */}
      <D365FiltrosAvanzadosDrawer
        open={drawerFiltrosOpen}
        onClose={() => setDrawerFiltrosOpen(false)}
        entityName={entityName}
        fields={derivedFields}
        conditions={advancedConditions}
        logicalOperator={advancedLogicalOp}
        onApply={handleApplyAdvancedFilters}
        onReset={handleResetAdvancedFilters}
      />

      {/* Drawer Editar Columnas (Dynamics 365) */}
      <D365EditarColumnasDrawer
        open={drawerColumnasOpen}
        onClose={() => setDrawerColumnasOpen(false)}
        entityName={entityName}
        columns={columnsConfig}
        defaultColumns={defaultColumnsConfig}
        onApply={handleApplyColumns}
      />
    </>
  );
}

export const D365EntityTable = React.forwardRef(D365EntityTableInner) as <T extends { id: string }>(
  props: D365EntityTableProps<T> & { ref?: React.Ref<D365EntityTableRef> }
) => React.ReactElement;
