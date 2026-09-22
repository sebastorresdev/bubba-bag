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
import { ServicioCampoService } from '../../services/servicio-campo.service';
import { CatalogoServicioDto } from '../../models/servicio-campo-catalogos.model';

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
  selector: 'app-catalogos-servicio-list',
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
  templateUrl: './catalogos-servicio-list.html',
  styleUrl: './catalogos-servicio-list.component.css',
})
export class CatalogosServicioListComponent implements OnInit {
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  catalogos: CatalogoServicioDto[] = [];
  catalogosFiltrados: CatalogoServicioDto[] = [];
  loading = false;

  searchTerm = '';
  vistaActual = 'Activos';
  vistaActualTitulo = 'Catálogos de Servicios Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Catálogos de Servicios Activos', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Catálogos de Servicios Inactivos', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Catálogos de Servicios', esSistema: true },
  ];

  onVistaChange(vista: VistaItem): void {
    this.cambiarVista(vista.key);
  }

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
      title: 'Servicios Incluidos',
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

  selectedIds = new Set<string>();

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  get commandBarItems(): CommandBarItem[] {
    const haySeleccion = this.selectedIds.size > 0;
    const esUnicoSeleccionado = this.selectedIds.size === 1;

    let itemSeleccionado: CatalogoServicioDto | undefined;
    if (esUnicoSeleccionado) {
      const id = Array.from(this.selectedIds)[0];
      itemSeleccionado = this.catalogos.find((c) => c.id === id);
    }

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nuevo catálogo de servicios',
        execute: () => this.irANuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnicoSeleccionado,
        tooltip: 'Editar el catálogo seleccionado',
        execute: () => {
          if (itemSeleccionado) {
            this.editar(itemSeleccionado.id);
          }
        },
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de catálogos',
        execute: () => this.cargarDatos(),
      },
    ];
  }

  cargarDatos(): void {
    this.loading = true;
    this.selectedIds.clear();
    this.cdr.markForCheck();

    let soloActivos: boolean | undefined = undefined;
    if (this.vistaActual === 'Activos') soloActivos = true;
    if (this.vistaActual === 'Inactivos') soloActivos = false;

    this.servicioCampoService.getCatalogosServicio(this.searchTerm, undefined, soloActivos).subscribe({
      next: (data) => {
        this.catalogos = data;
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar los catálogos de servicio.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: string): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activos':
        this.vistaActualTitulo = 'Catálogos de Servicios Activos';
        break;
      case 'Todos':
        this.vistaActualTitulo = 'Todos los Catálogos de Servicios';
        break;
      case 'Inactivos':
        this.vistaActualTitulo = 'Catálogos de Servicios Inactivos';
        break;
    }
    this.cargarDatos();
  }

  onSearchChange(): void {
    this.aplicarFiltrosLocales();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltrosLocales();
  }

  aplicarFiltrosLocales(): void {
    let result = [...this.catalogos];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(term) ||
          (c.contratanteNombre && c.contratanteNombre.toLowerCase().includes(term)) ||
          (c.descripcion && c.descripcion.toLowerCase().includes(term))
      );
    }

    this.catalogosFiltrados = result;
    this.cdr.markForCheck();
  }

  get isAllSelected(): boolean {
    return (
      this.catalogosFiltrados.length > 0 &&
      this.catalogosFiltrados.every((c) => this.selectedIds.has(c.id))
    );
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.catalogosFiltrados.filter((c) => this.selectedIds.has(c.id)).length;
    return selectedCount > 0 && selectedCount < this.catalogosFiltrados.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.catalogosFiltrados.forEach((c) => this.selectedIds.add(c.id));
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

  irANuevo(): void {
    this.router.navigate(['/servicio-campo/catalogos-servicio/nuevo']);
  }

  editar(id: string): void {
    this.router.navigate(['/servicio-campo/catalogos-servicio/editar', id]);
  }

  getIniciales(nombre?: string): string {
    if (!nombre || !nombre.trim()) return 'CS';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.trim().substring(0, 2).toUpperCase();
  }

  getColor(nombre: string): string {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#0078d4', '#107c41', '#8764b8', '#008272', '#d13438',
      '#e3008c', '#5c2e91', '#498205', '#004e8c', '#ffaa00'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
