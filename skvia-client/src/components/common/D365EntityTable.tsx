import React, { useState, useMemo, useRef } from 'react';
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
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MenuDivider,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowSortDown16Regular,
  ArrowSortUp16Regular,
  ChevronDown16Regular,
  DataFunnel20Regular,
  Dismiss16Regular,
  Filter16Regular,
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

const useStyles = makeStyles({
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
    gap: '4px',
    cursor: 'pointer',
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: tokens.fontWeightSemibold,
    ':hover': {
      color: tokens.colorCompoundBrandForeground1,
    },
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    marginLeft: '4px',
    flexShrink: 0,
  },
  sortIcon: {
    color: tokens.colorCompoundBrandForeground1,
  },
  colFilterIcon: {
    color: tokens.colorCompoundBrandForeground1,
    backgroundColor: tokens.colorCompoundBrandBackgroundHover,
    borderRadius: '4px',
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
  tableToolsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  activeFilterBtn: {
    color: tokens.colorCompoundBrandForeground1,
  },
  filterBadge: {
    marginLeft: '4px',
  },
  quickFilterPopup: {
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '220px',
  },
});

export function matchFilterCondition<T>(item: T, cond: D365FilterCondition): boolean {
  const rawValue = (item as Record<string, unknown>)[cond.field];
  const strVal = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  const target = cond.value || '';

  switch (cond.operator) {
    case 'contains':
      return strVal.toLowerCase().includes(target.toLowerCase());
    case 'not_contains':
      return !strVal.toLowerCase().includes(target.toLowerCase());
    case 'equals':
      return strVal.toLowerCase() === target.toLowerCase();
    case 'not_equals':
      return strVal.toLowerCase() !== target.toLowerCase();
    case 'starts_with':
      return strVal.toLowerCase().startsWith(target.toLowerCase());
    case 'ends_with':
      return strVal.toLowerCase().endsWith(target.toLowerCase());
    case 'greater_than':
      return Number(rawValue) > Number(target);
    case 'less_than':
      return Number(rawValue) < Number(target);
    case 'greater_or_equal':
      return Number(rawValue) >= Number(target);
    case 'less_or_equal':
      return Number(rawValue) <= Number(target);
    case 'is_empty':
      return strVal.trim() === '';
    case 'not_empty':
      return strVal.trim() !== '';
    default:
      return true;
  }
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
}

export interface D365EntityTableRef {
  openFilters: () => void;
  openColumns: () => void;
  getActiveFilterCount: () => number;
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
  const handleFilters = () => {
    if (tableRef?.current) tableRef.current.openFilters();
    else if (onOpenFilters) onOpenFilters();
  };

  const handleColumns = () => {
    if (tableRef?.current) tableRef.current.openColumns();
    else if (onOpenColumns) onOpenColumns();
  };

  const count = tableRef?.current ? tableRef.current.getActiveFilterCount() : activeFilterCount;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {/* 1° Editar columnas */}
      <Button
        appearance="subtle"
        icon={<TableEdit16Regular />}
        title="Editar columnas"
        aria-label="Editar columnas"
        onClick={handleColumns}
      >
        Editar columnas
      </Button>

      {/* 2° Editar filtros */}
      <Button
        appearance={count > 0 ? 'secondary' : 'subtle'}
        icon={<DataFunnel20Regular />}
        title="Editar filtros (aplicar filtros)"
        aria-label="Editar filtros"
        onClick={handleFilters}
      >
        Editar filtros
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
          style={{ minWidth: '220px' }}
        />
      )}
    </div>
  );
}

function D365EntityTableInner<T extends { id: string }>(
  {
    items,
    columns,
    loading,
    error,
    onRetry,
    selectionMode,
    selectedItems,
    onSelectionChange,
    entityName = 'Registros',
    tableId,
    filterFields,
    onRowDoubleClick,
    showToolbarTools = false,
  }: D365EntityTableProps<T>,
  ref: React.ForwardedRef<D365EntityTableRef>
) {
  const styles = useD365ListStyles();
  const customStyles = useStyles();
  const storageId = tableId || entityName.toLowerCase().replace(/\s+/g, '_');

  // 1. Column Config & Visibility State
  const defaultColumnsConfig = useMemo<D365ColumnConfig[]>(() => {
    return columns.map((c) => {
      let label = String(c.columnId);
      try {
        const rendered = c.renderHeaderCell();
        if (typeof rendered === 'string') label = rendered;
      } catch {
        // fallback
      }
      return {
        id: String(c.columnId),
        label,
        visible: true,
      };
    });
  }, [columns]);

  const [columnsConfig, setColumnsConfig] = useState<D365ColumnConfig[]>(() => {
    const saved = localStorage.getItem(`d365_grid_cols_${storageId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as D365ColumnConfig[];
        // Combinar con default para asegurar que no falten nuevas columnas
        const merged: D365ColumnConfig[] = [];
        parsed.forEach((p) => {
          if (defaultColumnsConfig.some((d) => d.id === p.id)) {
            const def = defaultColumnsConfig.find((d) => d.id === p.id);
            merged.push({ ...p, label: def?.label || p.label });
          }
        });
        defaultColumnsConfig.forEach((d) => {
          if (!merged.some((m) => m.id === d.id)) merged.push(d);
        });
        return merged;
      } catch {
        // fallback
      }
    }
    return defaultColumnsConfig;
  });

  // Guardar columnas
  const handleApplyColumns = (newCols: D365ColumnConfig[]) => {
    setColumnsConfig(newCols);
    localStorage.setItem(`d365_grid_cols_${storageId}`, JSON.stringify(newCols));
  };

  // 2. Column Widths & Resizing State
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
    const headerCellEl = (e.currentTarget as HTMLElement).closest('[role="columnheader"]') as HTMLElement | null;
    const measuredWidth = headerCellEl ? Math.round(headerCellEl.getBoundingClientRect().width) : 160;
    const currentWidth = columnWidths[colId] || measuredWidth;
    resizingRef.current = {
      colId,
      startX: e.clientX,
      startWidth: currentWidth,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = moveEvent.clientX - resizingRef.current.startX;
      const newWidth = Math.max(70, resizingRef.current.startWidth + delta);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingRef.current!.colId]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (resizingRef.current) {
        setColumnWidths((latest) => {
          localStorage.setItem(`d365_grid_widths_${storageId}`, JSON.stringify(latest));
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

  // 4. Per-column quick filter State
  const [colQuickFilters, setColQuickFilters] = useState<Record<string, string>>({});

  // 5. Advanced Filter Drawer State
  const [drawerFiltrosOpen, setDrawerFiltrosOpen] = useState(false);
  const [drawerColumnasOpen, setDrawerColumnasOpen] = useState(false);
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
  };

  const handleResetAdvancedFilters = () => {
    setAdvancedConditions([]);
    setAdvancedLogicalOp('and');
    setColQuickFilters({});
    localStorage.removeItem(`d365_grid_filters_${storageId}`);
  };

  // 6. Campos para Filtros Avanzados
  const derivedFields = useMemo<D365FilterField[]>(() => {
    if (filterFields && filterFields.length > 0) return filterFields;
    return columnsConfig.map((c) => ({
      id: c.id,
      label: c.label,
      type: 'string',
    }));
  }, [filterFields, columnsConfig]);

  // 7. Filtrado & Ordenamiento de Datos
  const processedItems = useMemo(() => {
    let result = [...items];

    // Aplicar Filtros Avanzados
    if (advancedConditions.length > 0) {
      result = result.filter((item) =>
        advancedConditions.every((cond) => matchFilterCondition(item, cond))
      );
    }

    // Aplicar Filtros rápidos por columna
    Object.entries(colQuickFilters).forEach(([colId, filterText]) => {
      const q = filterText.trim().toLowerCase();
      if (!q) return;
      result = result.filter((item) => {
        const val = (item as Record<string, unknown>)[colId];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      });
    });

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
  }, [items, advancedConditions, colQuickFilters, sortColumn, sortDirection, columns]);

  // Columnas visibles y ordenadas
  const activeColumns = useMemo(() => {
    const colMap = new Map(columns.map((c) => [String(c.columnId), c]));
    return columnsConfig
      .filter((c) => c.visible && colMap.has(c.id))
      .map((c) => colMap.get(c.id)!);
  }, [columns, columnsConfig]);

  const activeFilterCount =
    advancedConditions.length +
    Object.values(colQuickFilters).filter((v) => v.trim().length > 0).length;

  React.useImperativeHandle(ref, () => ({
    openFilters: () => setDrawerFiltrosOpen(true),
    openColumns: () => setDrawerColumnasOpen(true),
    getActiveFilterCount: () => activeFilterCount,
  }));

  return (
    <>
      {showToolbarTools && (
        <div style={{ padding: '4px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <D365TableToolbarTools
            onOpenFilters={() => setDrawerFiltrosOpen(true)}
            onOpenColumns={() => setDrawerColumnasOpen(true)}
            activeFilterCount={activeFilterCount}
          />
        </div>
      )}

      <div className={styles.gridWrapper}>
        <D365ListState loading={loading} error={error} onRetry={onRetry}>
          <DataGrid
            items={processedItems}
            columns={activeColumns}
            getRowId={(item) => item.id}
            selectionMode={selectionMode}
            selectedItems={selectedItems}
            onSelectionChange={onSelectionChange}
            className={styles.table}
          >
            <DataGridHeader>
              <DataGridRow selectionCell={selectionMode ? {} : undefined}>
                {({ renderHeaderCell, columnId }) => {
                  const idStr = String(columnId);
                  const isSorted = sortColumn === idStr;
                  const isColFiltered = Boolean(colQuickFilters[idStr]?.trim());
                  const width = columnWidths[idStr];
                  const colConfig = columnsConfig.find((c) => c.id === idStr);

                  return (
                    <DataGridHeaderCell
                      sortIcon={null}
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
                        <div
                          className={customStyles.headerTitleBtn}
                          onClick={() => handleToggleSort(idStr)}
                          title="Haga clic para ordenar"
                        >
                          {renderHeaderCell()}
                          {isSorted &&
                            (sortDirection === 'asc' ? (
                              <ArrowSortUp16Regular className={customStyles.sortIcon} />
                            ) : (
                              <ArrowSortDown16Regular className={customStyles.sortIcon} />
                            ))}
                        </div>

                        <div className={customStyles.headerActions}>
                          {/* Menu de filtro por columna */}
                          <Menu>
                            <MenuTrigger disableButtonEnhancement>
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={
                                  isColFiltered ? (
                                    <Filter16Regular className={customStyles.colFilterIcon} />
                                  ) : (
                                    <ChevronDown16Regular />
                                  )
                                }
                                title="Opciones y filtro de columna"
                                aria-label="Opciones y filtro de columna"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </MenuTrigger>
                            <MenuPopover>
                              <MenuList>
                                <MenuItem
                                  icon={<ArrowSortUp16Regular />}
                                  onClick={() => {
                                    setSortColumn(idStr);
                                    setSortDirection('asc');
                                  }}
                                >
                                  Ordenar de menor a mayor
                                </MenuItem>
                                <MenuItem
                                  icon={<ArrowSortDown16Regular />}
                                  onClick={() => {
                                    setSortColumn(idStr);
                                    setSortDirection('desc');
                                  }}
                                >
                                  Ordenar de mayor a menor
                                </MenuItem>
                                <MenuDivider />
                                <div className={customStyles.quickFilterPopup}>
                                  <Text size={200} weight="semibold">
                                    Filtrar por {colConfig?.label || idStr}
                                  </Text>
                                  <Input
                                    size="small"
                                    placeholder="Escriba para filtrar..."
                                    value={colQuickFilters[idStr] || ''}
                                    onChange={(_, d) =>
                                      setColQuickFilters((prev) => ({
                                        ...prev,
                                        [idStr]: d.value,
                                      }))
                                    }
                                  />
                                </div>
                                {isColFiltered && (
                                  <MenuItem
                                    icon={<Dismiss16Regular />}
                                    onClick={() =>
                                      setColQuickFilters((prev) => {
                                        const next = { ...prev };
                                        delete next[idStr];
                                        return next;
                                      })
                                    }
                                  >
                                    Limpiar filtro de columna
                                  </MenuItem>
                                )}
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        </div>

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
              <TableEmptyState />
            ) : (
              <DataGridBody<T>>
                {({ item, rowId }) => (
                  <DataGridRow<T>
                    key={rowId}
                    className={styles.dataRow}
                    selectionCell={selectionMode ? {} : undefined}
                    onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(item)}
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
                        >
                          {renderCell(item)}
                        </DataGridCell>
                      );
                    }}
                  </DataGridRow>
                )}
              </DataGridBody>
            )}
          </DataGrid>
        </D365ListState>
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
