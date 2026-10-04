import { DataGrid, DataGridHeader, DataGridHeaderCell, DataGridBody, DataGridRow, DataGridCell, type TableColumnDefinition } from '@fluentui/react-components';
import { useD365ListStyles } from '../../styles/d365ListStyles';
import { D365ListState } from './D365ListState';
import { TableEmptyState } from './TableEmptyState';

export function D365EntityTable<T extends { id: string }>({ items, columns, loading, error, onRetry }: {
  items: T[]; columns: TableColumnDefinition<T>[]; loading?: boolean; error?: string | null; onRetry?: () => void;
}) {
  const styles = useD365ListStyles();
  return <div className={styles.gridWrapper}><D365ListState loading={loading} error={error} onRetry={onRetry}>
    <DataGrid items={items} columns={columns} getRowId={item => item.id} sortable className={styles.table}>
      <DataGridHeader><DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow></DataGridHeader>
      <DataGridBody<T>>{({ item, rowId }) => <DataGridRow<T> key={rowId} className={styles.dataRow}>{({ renderCell }) => <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>}</DataGridRow>}</DataGridBody>
    </DataGrid>
    {!items.length && <TableEmptyState message="No hay registros. Crea un registro o modifica los filtros." />}
  </D365ListState></div>;
}
