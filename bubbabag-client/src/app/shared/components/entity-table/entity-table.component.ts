import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ContentChildren,
  QueryList,
  TemplateRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NzTableModule } from 'ng-zorro-antd/table';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

import { ViewSelectorComponent, VistaItem } from '../view-selector';
import { ColumnDef, TableSortState, TableStateSnapshot } from './entity-table.models';
import { CellDefDirective } from './cell-def.directive';
import {
  AdvancedFilterDrawerComponent,
  FilterGroup,
  evaluateFilterGroup,
  ColumnDataType,
} from '../advanced-filter';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzDropdownModule,
    NzCheckboxModule,
    NzDrawerModule,
    NzCardModule,
    NzTagModule,
    NzBadgeModule,
    DragDropModule,
    ViewSelectorComponent,
    AdvancedFilterDrawerComponent,
  ],
  templateUrl: './entity-table.component.html',
  styleUrl: './entity-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTableComponent implements OnInit, OnDestroy, OnChanges {
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) entidad!: string;
  @Input({ required: true }) vistasSistema: VistaItem[] = [];
  @Input() vistaActualKey: string = '';
  @Input({ required: true }) columnas: ColumnDef[] = [];
  @Input({ required: true }) datos: any[] = [];
  @Input() loading: boolean = false;
  @Input() selectedIds: Set<string> = new Set<string>();
  @Input() searchPlaceholder: string = 'Filtrar por palabra clave';
  @Input() pageSize: number = 15;
  @Input() showEditColumns: boolean = true;
  @Input() allowColumnReorder: boolean = true;
  @Input() showAdvancedFilter: boolean = true;
  @Input() showViews: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() rowKey: string = 'id';
  @Input() scrollX?: string;

  @Output() vistaChange = new EventEmitter<VistaItem>();
  @Output() vistaActualKeyChange = new EventEmitter<string>();
  @Output() selectedIdsChange = new EventEmitter<Set<string>>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() rowDblClick = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() advancedFilterChange = new EventEmitter<FilterGroup | null>();
  @Output() recargar = new EventEmitter<void>();

  @ContentChildren(CellDefDirective) cellDefs!: QueryList<CellDefDirective>;

  // Columnas activas y ordenadas
  columnasVisibles: ColumnDef[] = [];

  // Filtros avanzados estilo Dynamics 365
  advancedFilterDrawerVisible: boolean = false;
  activeFilterGroup: FilterGroup | null = null;

  get activeFilterConditionsCount(): number {
    return (
      this.activeFilterGroup?.conditions?.filter((c) => !!c.field)?.length || 0
    );
  }

  get columnTypesMap(): Record<string, ColumnDataType> {
    const map: Record<string, ColumnDataType> = {};
    for (const col of this.columnas) {
      map[col.key] = col.dataType || 'text';
    }
    return map;
  }

  // Búsqueda rápida
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  // Filtros avanzados por columna
  columnFilters: Record<string, any> = {};
  filterTempValues: Record<string, any> = {};
  filterDropdownVisible: Record<string, boolean> = {};

  // Ordenamiento
  sortState: TableSortState = { key: null, order: null };

  // Detección de modificaciones (Asterisco *)
  initialSnapshot: TableStateSnapshot | null = null;
  esModificada: boolean = false;

  // Drawer "Editar Columnas"
  editColumnsDrawerVisible: boolean = false;
  get editColumnsModalVisible(): boolean {
    return this.editColumnsDrawerVisible;
  }
  set editColumnsModalVisible(val: boolean) {
    this.editColumnsDrawerVisible = val;
  }
  columnasEdicion: {
    key: string;
    title: string;
    visible: boolean;
    canHide: boolean;
  }[] = [];

  ngOnInit(): void {
    this.inicializarColumnas();

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchChange.emit(term);
        this.evaluarModificaciones();
        this.cdr.markForCheck();
      });

    this.capturarSnapshotInicial();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columnas']) {
      this.inicializarColumnas();
    }
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  // --- Inicialización y Columnas ---
  private inicializarColumnas(): void {
    this.columnasVisibles = this.columnas.filter((c) => !c.hidden);
  }

  getCellTemplate(columnKey: string): TemplateRef<any> | null {
    if (!this.cellDefs) return null;
    const match = this.cellDefs.find((item) => item.columnName === columnKey);
    return match ? match.templateRef : null;
  }

  // --- Snapshot y Detección de Asterisco (*) ---
  private capturarSnapshotInicial(): void {
    this.initialSnapshot = {
      searchTerm: '',
      sort: { key: null, order: null },
      filters: {},
      advancedFilter: this.activeFilterGroup
        ? JSON.parse(JSON.stringify(this.activeFilterGroup))
        : null,
      visibleColumnKeys: this.columnas.filter((c) => !c.hidden).map((c) => c.key),
    };
    this.esModificada = false;
  }

  private evaluarModificaciones(): void {
    if (!this.initialSnapshot) return;

    const currentVisibleKeys = this.columnasVisibles.map((c) => c.key);
    const hasSearchChange =
      (this.searchTerm.trim() || '') !== (this.initialSnapshot.searchTerm || '');

    const hasSortChange =
      this.sortState.key !== this.initialSnapshot.sort.key ||
      this.sortState.order !== this.initialSnapshot.sort.order;

    const hasColumnChange =
      JSON.stringify(currentVisibleKeys) !==
      JSON.stringify(this.initialSnapshot.visibleColumnKeys);

    const hasActiveFilters = Object.keys(this.columnFilters).some((k) => {
      const v = this.columnFilters[k];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    });

    const activeConds = this.activeFilterGroup?.conditions || [];
    const snapshotConds = this.initialSnapshot.advancedFilter?.conditions || [];
    const hasAdvancedFilterChange =
      JSON.stringify(activeConds) !== JSON.stringify(snapshotConds) ||
      (this.activeFilterGroup?.logic !== this.initialSnapshot.advancedFilter?.logic &&
        activeConds.length > 0);

    this.esModificada =
      hasSearchChange ||
      hasSortChange ||
      hasColumnChange ||
      hasActiveFilters ||
      hasAdvancedFilterChange;
  }

  get filtrosActualesParaGuardar(): any {
    return {
      searchTerm: this.searchTerm.trim(),
      sort: this.sortState,
      filters: this.columnFilters,
      advancedFilter: this.activeFilterGroup,
      visibleColumnKeys: this.columnasVisibles.map((c) => c.key),
    };
  }

  // --- Métodos de Filtros Avanzados (Dynamics 365) ---
  abrirDrawerFiltros(): void {
    this.advancedFilterDrawerVisible = true;
    this.cdr.markForCheck();
  }

  onAplicarFiltroAvanzado(group: FilterGroup | null): void {
    this.activeFilterGroup = group;
    this.advancedFilterChange.emit(group);
    this.evaluarModificaciones();
    this.cdr.markForCheck();
  }

  onLimpiarFiltroAvanzado(): void {
    this.activeFilterGroup = null;
    this.advancedFilterChange.emit(null);
    this.evaluarModificaciones();
    this.cdr.markForCheck();
  }

  // --- Búsqueda ---
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  // --- Ordenamiento ---
  onSortChange(key: string, order: string | null): void {
    this.sortState = {
      key: order ? key : null,
      order: (order as 'ascend' | 'descend' | null) || null,
    };
    this.evaluarModificaciones();
    this.cdr.markForCheck();
  }

  // --- Filtros Avanzados por Columna ---
  abrirMenuFiltro(colKey: string, visible: boolean): void {
    this.filterDropdownVisible[colKey] = visible;
    if (visible && this.filterTempValues[colKey] === undefined) {
      this.filterTempValues[colKey] = this.columnFilters[colKey] || '';
    }
  }

  aplicarFiltroTexto(colKey: string): void {
    const val = (this.filterTempValues[colKey] || '').trim();
    if (val) {
      this.columnFilters[colKey] = val;
    } else {
      delete this.columnFilters[colKey];
    }
    this.filterDropdownVisible[colKey] = false;
    this.evaluarModificaciones();
    this.cdr.markForCheck();
  }

  limpiarFiltroTexto(colKey: string): void {
    this.filterTempValues[colKey] = '';
    delete this.columnFilters[colKey];
    this.filterDropdownVisible[colKey] = false;
    this.evaluarModificaciones();
    this.cdr.markForCheck();
  }

  toggleFiltroOpcion(colKey: string, val: any): void {
    let currentList: any[] = this.columnFilters[colKey] || [];
    if (!Array.isArray(currentList)) currentList = [];

    const idx = currentList.indexOf(val);
    if (idx > -1) {
      currentList = currentList.filter((item) => item !== val);
    } else {
      currentList = [...currentList, val];
    }

    if (currentList.length > 0) {
      this.columnFilters[colKey] = currentList;
    } else {
      delete this.columnFilters[colKey];
    }

    this.evaluarModificaciones();
    this.cdr.markForCheck();
  }

  tieneFiltroActivo(colKey: string): boolean {
    const v = this.columnFilters[colKey];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }

  // --- Datos Procesados (Búsqueda + Filtros + Orden) ---
  get datosFiltrados(): any[] {
    let resultado = [...this.datos];

    // 1. Búsqueda rápida
    if (this.searchTerm && this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      resultado = resultado.filter((row) => {
        return this.columnasVisibles.some((col) => {
          const val = row[col.key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // 2. Filtros avanzados por columna
    for (const [colKey, filterVal] of Object.entries(this.columnFilters)) {
      if (!filterVal && filterVal !== false && filterVal !== 0) continue;

      if (Array.isArray(filterVal)) {
        if (filterVal.length > 0) {
          resultado = resultado.filter((row) => filterVal.includes(row[colKey]));
        }
      } else if (typeof filterVal === 'string' && filterVal.trim()) {
        const q = filterVal.toLowerCase().trim();
        resultado = resultado.filter((row) => {
          const val = row[colKey];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        });
      }
    }

    // 2.5 Filtros avanzados estilo Dynamics 365 (Multi-regla AND/OR tipado)
    if (
      this.showAdvancedFilter &&
      this.activeFilterGroup &&
      this.activeFilterGroup.conditions.length > 0
    ) {
      resultado = resultado.filter((row) =>
        evaluateFilterGroup(row, this.activeFilterGroup, this.columnTypesMap)
      );
    }

    // 3. Ordenamiento
    if (this.sortState.key && this.sortState.order) {
      const key = this.sortState.key;
      const asc = this.sortState.order === 'ascend';

      resultado.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return asc ? 1 : -1;
        if (valB === null || valB === undefined) return asc ? -1 : 1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return asc ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return resultado;
  }

  // --- Drawer "Editar Columnas" Estilo D365 ---
  abrirDrawerEditarColumnas(): void {
    const visiblesSet = new Set(this.columnasVisibles.map((c) => c.key));

    // Mantener las activas en su orden actual, y agregar al final las que estén ocultas
    const listaOrdenada: ColumnDef[] = [
      ...this.columnasVisibles,
      ...this.columnas.filter((c) => !visiblesSet.has(c.key)),
    ];

    this.columnasEdicion = listaOrdenada.map((c) => ({
      key: c.key,
      title: c.title,
      visible: visiblesSet.has(c.key),
      canHide: c.canHide !== false,
    }));

    this.editColumnsDrawerVisible = true;
    this.cdr.markForCheck();
  }

  // Compatibilidad
  abrirModalEditarColumnas(): void {
    this.abrirDrawerEditarColumnas();
  }

  cerrarDrawerEditarColumnas(): void {
    this.editColumnsDrawerVisible = false;
    this.cdr.markForCheck();
  }

  onColumnaDrop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.columnasEdicion, event.previousIndex, event.currentIndex);
    this.cdr.markForCheck();
  }

  moverColumna(index: number, direccion: -1 | 1): void {
    const nuevoIndice = index + direccion;
    if (nuevoIndice < 0 || nuevoIndice >= this.columnasEdicion.length) return;

    moveItemInArray(this.columnasEdicion, index, nuevoIndice);
    this.cdr.markForCheck();
  }

  aplicarColumnasEditadas(): void {
    const mapColumnas = new Map(this.columnas.map((c) => [c.key, c]));
    this.columnasVisibles = this.columnasEdicion
      .filter((c) => c.visible && mapColumnas.has(c.key))
      .map((c) => mapColumnas.get(c.key)!);

    this.editColumnsDrawerVisible = false;
    this.evaluarModificaciones();
    this.cdr.markForCheck();
  }

  restablecerColumnasPorDefecto(): void {
    this.columnasVisibles = this.columnas.filter((c) => !c.hidden);
    this.editColumnsDrawerVisible = false;
    this.evaluarModificaciones();
    this.cdr.markForCheck();
  }

  // --- Gestión de Vistas (Cambiar, Descartar, Guardar) ---
  onVistaChange(vista: VistaItem): void {
    this.vistaActualKey = vista.key;
    this.vistaActualKeyChange.emit(vista.key);
    this.vistaChange.emit(vista);

    // Cargar configuración guardada de la vista si existe
    if (vista.configuracion) {
      const cfg = vista.configuracion;
      if (cfg.visibleColumnKeys && Array.isArray(cfg.visibleColumnKeys)) {
        const map = new Map(this.columnas.map((c) => [c.key, c]));
        this.columnasVisibles = cfg.visibleColumnKeys
          .filter((k: string) => map.has(k))
          .map((k: string) => map.get(k)!);
      }
      this.sortState = cfg.sort || { key: null, order: null };
      this.columnFilters = cfg.filters || {};
      this.searchTerm = cfg.searchTerm || '';
      this.activeFilterGroup = cfg.advancedFilter
        ? JSON.parse(JSON.stringify(cfg.advancedFilter))
        : null;
    } else {
      // Estado por defecto de la vista
      this.sortState = { key: null, order: null };
      this.columnFilters = {};
      this.searchTerm = '';
      this.activeFilterGroup = null;
      this.inicializarColumnas();
    }

    this.capturarSnapshotInicial();
    this.recargar.emit();
  }

  descartarCambios(): void {
    this.searchTerm = '';
    this.sortState = { key: null, order: null };
    this.columnFilters = {};
    this.filterTempValues = {};
    this.activeFilterGroup = this.initialSnapshot?.advancedFilter
      ? JSON.parse(JSON.stringify(this.initialSnapshot.advancedFilter))
      : null;
    this.inicializarColumnas();
    this.esModificada = false;
    this.recargar.emit();
    this.cdr.markForCheck();
  }

  onGuardarCambiosEnVista(vista: VistaItem): void {
    this.capturarSnapshotInicial();
    this.esModificada = false;
    this.cdr.markForCheck();
  }

  // --- Selección de Filas ---
  toggleSelect(id: string): void {
    const nextSet = new Set(this.selectedIds);
    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }
    this.selectedIds = nextSet;
    this.selectedIdsChange.emit(this.selectedIds);
    this.cdr.markForCheck();
  }

  toggleSelectAll(checked: boolean): void {
    const nextSet = new Set<string>();
    if (checked) {
      this.datosFiltrados.forEach((item) => nextSet.add(item[this.rowKey]));
    }
    this.selectedIds = nextSet;
    this.selectedIdsChange.emit(this.selectedIds);
    this.cdr.markForCheck();
  }

  get isAllSelected(): boolean {
    const lista = this.datosFiltrados;
    return (
      lista.length > 0 &&
      lista.every((item) => this.selectedIds.has(item[this.rowKey]))
    );
  }

  get isIndeterminate(): boolean {
    const lista = this.datosFiltrados;
    const selectedCount = lista.filter((item) =>
      this.selectedIds.has(item[this.rowKey])
    ).length;
    return selectedCount > 0 && selectedCount < lista.length;
  }

  onRowClick(item: any): void {
    this.toggleSelect(item[this.rowKey]);
    this.rowClick.emit(item);
  }

  onRowDblClick(item: any): void {
    this.rowDblClick.emit(item);
  }
}
