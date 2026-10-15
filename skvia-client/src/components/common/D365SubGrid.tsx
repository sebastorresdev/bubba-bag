import { useIsMobile } from '../../hooks/useMediaQuery';
import { D365MobileRecords } from './D365MobileRecords';
import React from 'react';
import {
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  Button,
  Badge,
  Text,
  Spinner,
  makeStyles,
  tokens,
  type TableColumnDefinition,
  type SelectionItemId,
  type OnSelectionChangeData,
} from '@fluentui/react-components';
import { Add16Regular } from '@fluentui/react-icons';
import { TableEmptyState } from './TableEmptyState';

const useStyles = makeStyles({
  container: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
  containerSubtle: {
    flexShrink: 0,
    border: 'none',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    minHeight: '40px', flexWrap: 'wrap', gap: '8px',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  gridWrapper: {
    width: '100%',
    overflowX: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  table: {
    width: '100%',
    userSelect: 'text',
  },
  headerRow: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerCell: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    userSelect: 'none',
  },
  row: {
    userSelect: 'text',
    cursor: 'pointer',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  rowNonClickable: {
    userSelect: 'text',
    cursor: 'default',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  cell: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    userSelect: 'text',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    gap: '8px',
  },
});

export interface D365SubGridProps<T> {
  title?: React.ReactNode;
  count?: number;
  items: T[];
  columns: TableColumnDefinition<T>[];
  getRowId?: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  onAdd?: () => void;
  addLabel?: string;
  addIcon?: React.ReactElement;
  addDisabled?: boolean;
  actions?: React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactElement;
  subtle?: boolean;
  selectionMode?: 'single' | 'multiselect';
  selectedItems?: SelectionItemId[];
  onSelectionChange?: (selected: SelectionItemId[]) => void;
  size?: 'extra-small' | 'small' | 'medium';
  className?: string;
}

/**
 * Componente estándar de Sub-cuadrícula (Sub-Grid) estilo Microsoft Dynamics 365.
 * Diseñado para listas secundarias dentro de pestañas (Tabs) o tarjetas de formularios.
 */
export function D365SubGrid<T>({
  title,
  count,
  items,
  columns,
  getRowId,
  onRowClick,
  onAdd,
  addLabel = 'Agregar',
  addIcon = <Add16Regular />,
  addDisabled = false,
  actions,
  isLoading = false,
  emptyMessage = 'No hay registros asociados',
  emptyIcon,
  subtle = false,
  selectionMode,
  selectedItems,
  onSelectionChange,
  size = 'small',
  className,
}: D365SubGridProps<T>) {
  const isMobile = useIsMobile(768);
  const styles = useStyles();
  const effectiveCount = count !== undefined ? count : items.length;

  const defaultGetRowId = (item: T, index?: number): string | number => {
    if (getRowId) return getRowId(item);
    const anyItem = item as Record<string, unknown>;
    return (anyItem.id as string | number) ?? (anyItem.idTemp as string | number) ?? index ?? 0;
  };

  const handleSelectionChange = (_: unknown, data: OnSelectionChangeData) => {
    if (onSelectionChange) {
      onSelectionChange(Array.from(data.selectedItems));
    }
  };

  const showToolbar = Boolean(title || onAdd || actions || count !== undefined);

  return (
    <div className={`${subtle ? styles.containerSubtle : styles.container} ${className ?? ''}`}>
      {showToolbar && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            {title && <span className={styles.title}>{title}</span>}
            <Badge appearance="tint" shape="rounded" color="informative" size="small">
              {effectiveCount}
            </Badge>
          </div>
          <div className={styles.toolbarRight}>
            {actions}
            {onAdd && (
              <Button
                icon={addIcon}
                size="small"
                appearance="primary"
                onClick={onAdd}
                disabled={addDisabled}
              >
                {addLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner size="small" />
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Cargando registros...
          </Text>
        </div>
      ) : items.length === 0 ? (
        <TableEmptyState message={emptyMessage} icon={emptyIcon}>
          {onAdd && !addDisabled && (
            <Button
              icon={addIcon}
              size="small"
              appearance="outline"
              onClick={onAdd}
              style={{ marginTop: '8px' }}
            >
              {addLabel}
            </Button>
          )}
        </TableEmptyState>
      ) : (
        <div className={styles.gridWrapper}>
          {isMobile ? <D365MobileRecords items={items} columns={columns} getRowId={defaultGetRowId} selectionMode={selectionMode} selectedItems={selectedItems ? new Set(selectedItems) : undefined} onSelectionChange={handleSelectionChange} onOpen={onRowClick} /> : <DataGrid
            items={items}
            columns={columns}
            getRowId={(item) => defaultGetRowId(item)}
            selectionMode={selectionMode}
            selectedItems={selectedItems ? new Set(selectedItems) : undefined}
            onSelectionChange={handleSelectionChange}
            size={size}
            className={styles.table}
          >
            <DataGridHeader className={styles.headerRow}>
              <DataGridRow selectionCell={selectionMode ? {} : undefined}>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell className={styles.headerCell}>
                    {renderHeaderCell() as React.ReactElement}
                  </DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<T>>
              {({ item, rowId }) => (
                <DataGridRow<T>
                  key={rowId}
                  selectionCell={selectionMode ? {} : undefined}
                  className={onRowClick ? styles.row : styles.rowNonClickable}
                  onClick={event => { if (!(event.target as HTMLElement).closest('button, input, a, [role="checkbox"], [role="radio"]')) onRowClick?.(item); }}
                  onKeyDown={event => { if (event.key === 'Enter' && !(event.target as HTMLElement).closest('button, input, a')) { event.preventDefault(); onRowClick?.(item); } }}
                >
                  {({ renderCell }) => (
                    <DataGridCell className={styles.cell}>
                      {renderCell(item) as React.ReactElement}
                    </DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>}
        </div>
      )}
    </div>
  );
}

export default D365SubGrid;
