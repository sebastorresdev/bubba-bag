import type { ReactNode } from 'react';
import { DataGrid, type TableColumnDefinition, type SelectionItemId } from '@fluentui/react-components';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { D365MobileRecords } from './D365MobileRecords';
import { TableEmptyState } from './TableEmptyState';

interface Props<T> {
  items: T[];
  columns: TableColumnDefinition<T>[];
  getRowId: (item: T) => SelectionItemId;
  className?: string;
  size?: 'extra-small' | 'small' | 'medium';
  children: ReactNode;
  onMobileOpen?: (item: T) => void;
  mobileLabel?: string;
}

/** Mantiene las celdas editables y las acciones originales al pasar a tarjetas. */
export function D365ResponsiveDataGrid<T>({ onMobileOpen, mobileLabel, children, ...props }: Props<T>) {
  const mobile = useIsMobile(768);
  if (mobile && props.items.length === 0) return <TableEmptyState />;
  if (mobile) return <D365MobileRecords items={props.items} columns={props.columns} getRowId={props.getRowId} onOpen={onMobileOpen} label={mobileLabel} />;
  return <DataGrid {...props}>{children}</DataGrid>;
}
