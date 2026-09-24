import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoriaProductoService } from '../../services/categoria-producto.service';
import { CategoriaProductoDto } from '../../models/catalogo-producto.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

@Component({
  selector: 'app-categorias-producto-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzCardModule,
    NzEmptyModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categorias-producto-list.html',
  styleUrl: './categorias-producto-list.component.css',
})
export class CategoriasProductoListComponent implements OnInit {
  private router = inject(Router);
  private categoriaService = inject(CategoriaProductoService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  categorias: CategoriaProductoDto[] = [];
  categoriasFiltradas: CategoriaProductoDto[] = [];
  loading = false;

  // Filtros y Vistas
  searchTerm = '';
  vistaActual = 'Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Categorías Activas', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Categorías Inactivas', esSistema: true },
    { key: 'Todos', nombre: 'Todas las Categorías', esSistema: true },
  ];

  columnas: ColumnDef<CategoriaProductoDto>[] = [
    {
      key: 'nombre',
      title: 'Nombre de la Categoría',
      width: '280px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
      canHide: false,
    },
    {
      key: 'familia',
      title: 'Familia / Grupo',
      width: '220px',
      sortable: true,
      dataType: 'text',
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
      width: '120px',
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

  // Selección
  selectedIds = new Set<string>();

  ngOnInit(): void {
    this.cargarDatos();
  }

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;
    this.cdr.markForCheck();
  }

  onVistaChange(vista: VistaItem): void {
    this.vistaActual = vista.key;
    this.cargarDatos();
  }

  get commandBarItems(): CommandBarItem[] {
    const haySeleccion = this.selectedIds.size > 0;
    const esUnicoSeleccionado = this.selectedIds.size === 1;

    let itemSeleccionado: CategoriaProductoDto | undefined;
    if (esUnicoSeleccionado) {
      const id = Array.from(this.selectedIds)[0];
      itemSeleccionado = this.categorias.find((c) => c.id === id);
    }

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nueva categoría o familia de producto',
        execute: () => this.router.navigate(['/servicio-campo/categorias-producto/nuevo']),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnicoSeleccionado,
        tooltip: 'Editar la categoría seleccionada',
        execute: () => {
          if (itemSeleccionado) {
            this.abrirEditar(itemSeleccionado);
          }
        },
      },
      {
        key: 'toggle-status',
        label: esUnicoSeleccionado
          ? itemSeleccionado?.activo
            ? 'Desactivar'
            : 'Activar'
          : 'Cambiar Estado',
        icon: esUnicoSeleccionado && itemSeleccionado?.activo ? 'close-circle' : 'check-circle',
        iconColor: esUnicoSeleccionado && itemSeleccionado?.activo ? 'danger' : 'success',
        disabled: !haySeleccion,
        tooltip: 'Activar o desactivar las categorías seleccionadas',
        execute: () => this.cambiarEstadoSeleccionados(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de categorías',
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

    this.categoriaService.getCategorias(soloActivos, this.searchTerm).subscribe({
      next: (data) => {
        this.categorias = data;
        this.categoriasFiltradas = [...data];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar catálogo de categorías.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  abrirEditar(item: CategoriaProductoDto): void {
    this.router.navigate(['/servicio-campo/categorias-producto/editar', item.id], {
      state: { data: item },
    });
  }

  cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const primerItem = this.categorias.find((c) => c.id === ids[0]);
    const nuevoEstado = primerItem ? !primerItem.activo : true;

    let completados = 0;
    ids.forEach((id) => {
      this.categoriaService.cambiarEstado(id, nuevoEstado).subscribe({
        next: () => {
          completados++;
          if (completados === ids.length) {
            this.message.success(
              `Se ${nuevoEstado ? 'activaron' : 'desactivaron'} ${ids.length} categoría(s).`
            );
            this.cargarDatos();
          }
        },
        error: () => {
          this.message.error('Error al actualizar estado.');
        },
      });
    });
  }
}
