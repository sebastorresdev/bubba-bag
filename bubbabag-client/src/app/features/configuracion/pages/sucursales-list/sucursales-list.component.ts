import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SucursalService } from '../../services/sucursal.service';
import { SucursalDto } from '../../models/sucursal.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

@Component({
  selector: 'app-sucursales-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzSelectModule,
    NzCardModule,
    NzCheckboxModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  templateUrl: './sucursales-list.html',
  styleUrl: './sucursales-list.component.css',
})
export class SucursalesListComponent implements OnInit, OnDestroy {
  private sucursalService = inject(SucursalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  sucursales: SucursalDto[] = [];
  loading = false;

  // Filtros y Búsqueda
  searchTerm = '';
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';

  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Sucursales Activas', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Sucursales Inactivas', esSistema: true, esPredeterminada: false },
    { key: 'Todos', nombre: 'Todas las Sucursales', esSistema: true, esPredeterminada: false },
  ];

  onVistaChange(vista: VistaItem): void {
    this.cambiarVista(vista.key);
  }
  private searchSubject = new Subject<string>();

  columnas: ColumnDef<SucursalDto>[] = [
    {
      key: 'codigo',
      title: 'Código',
      width: '110px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'nombre',
      title: 'Nombre de la Sucursal',
      width: '280px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
      canHide: false,
    },
    {
      key: 'ciudad',
      title: 'Ciudad',
      width: '140px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'direccion',
      title: 'Dirección',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'telefono',
      title: 'Teléfono',
      width: '140px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'esSedePrincipal',
      title: 'Tipo Sede',
      width: '140px',
      align: 'center',
      sortable: true,
      dataType: 'boolean',
    },
    {
      key: 'activo',
      title: 'Estado',
      width: '110px',
      align: 'center',
      sortable: true,
      dataType: 'boolean',
      filterType: 'select',
      filterOptions: [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false },
      ],
    },
  ];

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;
    this.actualizarEstadoSeleccion();
    this.cdr.markForCheck();
  }

  onBuscar(term: string): void {
    this.searchTerm = term;
    this.cargarSucursales();
  }

  // Selección
  selectedIds = new Set<string>();
  checked = false;
  indeterminate = false;

  get vistaActualTitulo(): string {
    switch (this.vistaActual) {
      case 'Activos':
        return 'Sucursales Activas';
      case 'Todos':
        return 'Todas las Sucursales';
      case 'Inactivos':
        return 'Sucursales Inactivas';
      default:
        return 'Sucursales';
    }
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  getSelectedSucursal(): SucursalDto | undefined {
    if (this.selectedIds.size !== 1) return undefined;
    const id = Array.from(this.selectedIds)[0];
    return this.sucursales.find((s) => s.id === id);
  }

  get commandBarItems(): CommandBarItem[] {
    const singleSelected = this.selectedIds.size === 1;
    const selected = singleSelected ? this.getSelectedSucursal() : undefined;
    const isActivo = selected ? selected.activo : false;

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        execute: () => this.irANuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !singleSelected,
        execute: () => this.irAEditar(),
      },
      {
        key: 'toggleStatus',
        label: isActivo ? 'Desactivar' : 'Activar',
        icon: isActivo ? 'close' : 'check',
        disabled: !singleSelected,
        danger: isActivo,
        iconColor: isActivo ? 'danger' : 'success',
        execute: () => this.toggleEstadoSucursal(),
      },
      {
        key: 'div-actions',
        label: '',
        isDivider: true,
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        iconColor: 'neutral',
        execute: () => this.cargarSucursales(),
      },
    ];
  }

  get farItems(): CommandBarItem[] {
    return [];
  }

  ngOnInit(): void {
    this.cargarSucursales();

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.cargarSucursales();
      });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  cargarSucursales(): void {
    this.loading = true;
    const soloActivos =
      this.vistaActual === 'Activos'
        ? true
        : this.vistaActual === 'Inactivos'
        ? false
        : undefined;

    this.sucursalService.getSucursales(this.searchTerm, soloActivos).subscribe({
      next: (data) => {
        this.sucursales = data;
        this.loading = false;
        this.actualizarEstadoSeleccion();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudieron cargar las sucursales');
        this.cdr.markForCheck();
      },
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarSucursales();
  }

  cambiarVista(vista: string): void {
    this.vistaActual = (vista as any) || 'Activos';
    this.selectedIds.clear();
    this.checked = false;
    this.cargarSucursales();
  }

  irANuevo(): void {
    this.router.navigate(['/configuracion/sucursales/nuevo']);
  }

  irAEditar(id?: string): void {
    const targetId = id || Array.from(this.selectedIds)[0];
    if (targetId) {
      this.router.navigate(['/configuracion/sucursales/editar', targetId]);
    }
  }

  toggleEstadoSucursal(): void {
    const selected = this.getSelectedSucursal();
    if (!selected) return;

    const nuevoEstado = !selected.activo;
    this.sucursalService.cambiarEstado(selected.id, nuevoEstado).subscribe({
      next: () => {
        this.message.success(
          nuevoEstado
            ? `Sucursal "${selected.nombre}" activada exitosamente`
            : `Sucursal "${selected.nombre}" desactivada`
        );
        this.cargarSucursales();
      },
      error: () => {
        this.message.error('Error al cambiar el estado de la sucursal');
      },
    });
  }

  onItemChecked(id: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.actualizarEstadoSeleccion();
  }

  onAllChecked(checked: boolean): void {
    if (checked) {
      this.sucursales.forEach((s) => this.selectedIds.add(s.id));
    } else {
      this.selectedIds.clear();
    }
    this.actualizarEstadoSeleccion();
  }

  private actualizarEstadoSeleccion(): void {
    const total = this.sucursales.length;
    const selectedCount = this.selectedIds.size;
    this.checked = total > 0 && selectedCount === total;
    this.indeterminate = selectedCount > 0 && selectedCount < total;
    this.cdr.markForCheck();
  }
}
