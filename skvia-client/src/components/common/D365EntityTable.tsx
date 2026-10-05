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
} from '@fluentui/react-components';
import { useD365ListStyles } from '../../styles/d365ListStyles';
import { D365ListState } from './D365ListState';
import { TableEmptyState } from './TableEmptyState';

export function D365EntityTable<T extends { id: string }>({
  items,
  columns,
  loading,
  error,
  onRetry,
  selectionMode,
  selectedItems,
  onSelectionChange,
}: {
  items: T[];
  columns: TableColumnDefinition<T>[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectionMode?: 'single' | 'multiselect';
  selectedItems?: Set<SelectionItemId>;
  onSelectionChange?: (e: unknown, data: OnSelectionChangeData) => void;
}) {
  const styles = useD365ListStyles();
  return (
    <div className={styles.gridWrapper}>
      <D365ListState loading={loading} error={error} onRetry={onRetry}>
        <DataGrid
          items={items}
          columns={columns}
          getRowId={(item) => item.id}
          sortable
          selectionMode={selectionMode}
          selectedItems={selectedItems}
          onSelectionChange={onSelectionChange}
          className={styles.table}
        >
          <DataGridHeader>
            <DataGridRow selectionCell={selectionMode ? {} : undefined}>
              {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<T>>
            {({ item, rowId }) => (
              <DataGridRow<T> key={rowId} className={styles.dataRow} selectionCell={selectionMode ? {} : undefined}>
                {({ renderCell }) => <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
        {!items.length && <TableEmptyState message="No hay registros. Crea un registro o modifica los filtros." />}
      </D365ListState>
    </div>
  );
}
