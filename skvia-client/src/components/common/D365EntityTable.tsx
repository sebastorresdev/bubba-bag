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
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowSortDown16Regular,
  ArrowSortUp16Regular,
  ChevronDown16Regular,
  Search16Regular,
  TableEdit16Regular,
} from '@fluentui/react-icons';
import { useD365ListStyles } from '../../styles/d365ListStyles';
import { D365ListState } from './D365ListState';
import { TableEmptyState } from './TableEmptyState';
import {
  D365EditarColumnasDrawer,
  type D365ColumnConfig,
} from './D365EditarColumnasDrawer';

export interface D365FilterField {
  id: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
  options?: Array<{ value: string; label: string }>;
}

const useStyles = makeStyles({
  headerCell: {
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationFaster,
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
});

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
  openColumns: () => void;
  openFilters?: () => void;
  getActiveFilterCount?: () => number;
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
  onOpenColumns,
  tableRef,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar',
  searchAriaLabel,
}: D365TableToolbarToolsProps) {
  const handleColumns = () => {
    if (tableRef?.current) tableRef.current.openColumns();
    else if (onOpenColumns) onOpenColumns();
  };

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

      {/* 2° Cuadro de búsqueda al final a la derecha */}
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
    onRowDoubleClick,
    showToolbarTools = false,
  }: D365EntityTableProps<T>,
  ref: React.Ref<D365EntityTableRef>
) {
  const styles = useD365ListStyles();
  const customStyles = useStyles();
  const storageId = tableId || entityName.toLowerCase().replace(/\s+/g, '_');

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
          currentMap.forEach((_, id) => {
            if (!merged.some((m) => m.id === id)) {
              merged.push({ id, label: id, visible: true });
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

  const handleApplyColumns = (updated: D365ColumnConfig[]) => {
    setColumnsConfig(updated);
    localStorage.setItem(`d365_grid_cols_${storageId}`, JSON.stringify(updated));
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

  // 4. Ordenamiento de Datos
  const processedItems = useMemo(() => {
    const result = [...items];

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
  }, [items, sortColumn, sortDirection, columns]);

  // Columnas visibles y ordenadas
  const activeColumns = useMemo(() => {
    const colMap = new Map(columns.map((c) => [String(c.columnId), c]));
    return columnsConfig
      .filter((c) => c.visible && colMap.has(c.id))
      .map((c) => colMap.get(c.id)!);
  }, [columns, columnsConfig]);

  React.useImperativeHandle(ref, () => ({
    openColumns: () => setDrawerColumnasOpen(true),
    openFilters: () => {},
    getActiveFilterCount: () => 0,
  }));

  return (
    <>
      {showToolbarTools && (
        <div style={{ padding: '4px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <D365TableToolbarTools
            onOpenColumns={() => setDrawerColumnasOpen(true)}
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
                  const width = columnWidths[idStr];

                  return (
                    <DataGridHeaderCell
                      sortIcon={null}
                      className={customStyles.headerCell}
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
                          <Menu>
                            <MenuTrigger disableButtonEnhancement>
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<ChevronDown16Regular />}
                                title="Opciones de columna"
                                aria-label="Opciones de columna"
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
                    onDoubleClick={() => onRowDoubleClick?.(item)}
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
