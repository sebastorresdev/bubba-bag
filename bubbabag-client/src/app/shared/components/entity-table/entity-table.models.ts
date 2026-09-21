import { TemplateRef } from '@angular/core';

export type ColumnAlign = 'left' | 'center' | 'right';
export type ColumnFilterType = 'text' | 'select' | 'none';

export interface FilterOption {
  label: string;
  value: any;
}

export interface ColumnDef<T = any> {
  key: string;
  title: string;
  width?: string;
  align?: ColumnAlign;
  sortable?: boolean;
  filterType?: ColumnFilterType;
  filterOptions?: FilterOption[];
  hidden?: boolean;
  canHide?: boolean;
  primaryLink?: boolean;
  headerClass?: string;
  cellClass?: string;
}

export interface TableSortState {
  key: string | null;
  order: 'ascend' | 'descend' | null;
}

export interface TableStateSnapshot {
  searchTerm: string;
  sort: TableSortState;
  filters: Record<string, any>;
  visibleColumnKeys: string[];
}
