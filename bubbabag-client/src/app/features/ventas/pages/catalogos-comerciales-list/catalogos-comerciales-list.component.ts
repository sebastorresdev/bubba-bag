import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServicioCampoService } from '../../../servicio-campo/services/servicio-campo.service';
import { CatalogoServicioDto } from '../../../servicio-campo/models/servicio-campo-catalogos.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

@Component({
  selector: 'app-catalogos-comerciales-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzInputModule,
    NzTagModule,
    NzCardModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzSelectModule,
    NzAvatarModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalogos-comerciales-list.html',
  styleUrl: './catalogos-comerciales-list.component.css',
})
export class CatalogosComercialesListComponent implements OnInit {
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);

  catalogos: CatalogoServicioDto[] = [];
  catalogosFiltrados: CatalogoServicioDto[] = [];
  loading = false;

  searchTerm = '';
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';
  vistaActualTitulo = 'Catálogos Comerciales Activos';

  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Catálogos Activos', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Catálogos Inactivos', esSistema: true, esPredeterminada: false },
    { key: 'Todos', nombre: 'Todos los Catálogos', esSistema: true, esPredeterminada: false },
  ];

  columnas: ColumnDef<CatalogoServicioDto>[] = [
    {
      key: 'nombre',
      title: 'Nombre del Catálogo',
      width: '300px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
      canHide: false,
    },
    {
      key: 'contratanteNombre',
      title: 'Cliente',
      width: '260px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'cantidadServicios',
      title: 'Servicios / Productos',
      width: '160px',
      align: 'center',
      sortable: true,
      dataType: 'number',
    },
    {
      key: 'descripcion',
      title: 'Descripción',
      sortable: true,
      dataType: 'text',
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
    this.cdr.markForCheck();
  }

  selectedIds = new Set<string>();

  get isAllSelected(): boolean {
    return (
      this.catalogosFiltrados.length > 0 &&
      this.catalogosFiltrados.every((item) => this.selectedIds.has(item.id))
    );
  }

  get isIndeterminate(): boolean {
    const count = this.selectedCount;
    return count > 0 && count < this.catalogosFiltrados.length;
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get commandBarItems(): CommandBarItem[] {
    const haySeleccion = this.selectedCount > 0;
    const esUnico = this.selectedCount === 1;

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nuevo catálogo comercial',
        execute: () => this.nuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnico,
        tooltip: esUnico ? 'Editar catálogo seleccionado' : 'Seleccione exactamente un catálogo',
        execute: () => {
          const id = Array.from(this.selectedIds)[0];
          if (id) this.editar(id);
        },
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar listado',
        execute: () => this.cargarCatalogos(),
      },
      {
        key: 'toggle-status',
        label: 'Activar / Desactivar',
        icon: 'poweroff',
        disabled: !haySeleccion,
        tooltip: haySeleccion ? 'Cambiar estado de los catálogos seleccionados' : 'Seleccione al menos un catálogo',
        execute: () => this.cambiarEstadoSeleccionados(),
      },
    ];
  }

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const soloActivos = this.vistaActual === 'Activos' ? true : this.vistaActual === 'Inactivos' ? false : undefined;

    this.servicioCampoService.getCatalogosServicio(undefined, undefined, soloActivos).subscribe({
      next: (data) => {
        this.catalogos = data || [];
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar los catálogos comerciales.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onVistaChange(vista: VistaItem): void {
    this.cambiarVista(vista.key);
  }

  cambiarVista(vista: string): void {
    this.vistaActual = (vista as any) || 'Activos';
    switch (vista) {
      case 'Activos':
        this.vistaActualTitulo = 'Catálogos Comerciales Activos';
        break;
      case 'Inactivos':
        this.vistaActualTitulo = 'Catálogos Comerciales Inactivos';
        break;
      case 'Todos':
        this.vistaActualTitulo = 'Todos los Catálogos Comerciales';
        break;
      default:
        this.vistaActualTitulo = vista;
        break;
    }
    this.selectedIds.clear();
    this.cargarCatalogos();
  }

  onSearchChange(): void {
    this.aplicarFiltrosLocales();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltrosLocales();
  }

  private aplicarFiltrosLocales(): void {
    let result = [...this.catalogos];

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.contratanteNombre && c.contratanteNombre.toLowerCase().includes(q)) ||
          (c.descripcion && c.descripcion.toLowerCase().includes(q))
      );
    }

    this.catalogosFiltrados = result;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.catalogosFiltrados.forEach((item) => this.selectedIds.add(item.id));
    } else {
      this.selectedIds.clear();
    }
    this.cdr.markForCheck();
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.cdr.markForCheck();
  }

  nuevo(): void {
    this.router.navigate(['/ventas/catalogos/nuevo']);
  }

  editar(id: string): void {
    this.router.navigate(['/ventas/catalogos/editar', id]);
  }

  private cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    this.modal.confirm({
      nzTitle: '¿Cambiar estado de los catálogos?',
      nzContent: `Se invertirá el estado de ${ids.length} catálogo(s) seleccionado(s).`,
      nzOkText: 'Sí, cambiar',
      nzCancelText: 'Cancelar',
      nzOnOk: () => {
        this.message.info('Procesando cambios de estado...');
        this.selectedIds.clear();
        this.cargarCatalogos();
      },
    });
  }
}
