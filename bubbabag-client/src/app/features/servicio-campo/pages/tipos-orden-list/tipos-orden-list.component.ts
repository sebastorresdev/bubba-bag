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
import { TipoOrdenTrabajoDto } from '../../models/servicio-campo-catalogos.model';

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
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

@Component({
  selector: 'app-tipos-orden-list',
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
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tipos-orden-list.html',
  styleUrl: './tipos-orden-list.component.css',
})
export class TiposOrdenListComponent implements OnInit {
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  tiposOrden: TipoOrdenTrabajoDto[] = [];
  tiposOrdenFiltrados: TipoOrdenTrabajoDto[] = [];
  loading = false;
  saving = false;

  // Filtros y Vistas
  searchTerm = '';
  vistaActual = 'Activos';
  vistaActualTitulo = 'Tipos de Orden Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Tipos de Orden Activos', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Tipos de Orden Inactivos', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Tipos de Orden', esSistema: true },
  ];

  onVistaChange(vista: VistaItem): void {
    this.cambiarVista(vista.key);
  }

  columnas: ColumnDef<TipoOrdenTrabajoDto>[] = [
    {
      key: 'nombre',
      title: 'Modalidad Operativa',
      width: '280px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
      canHide: false,
    },
    {
      key: 'requiereVisitaCampo',
      title: 'Visita Campo',
      width: '130px',
      align: 'center',
      sortable: true,
      dataType: 'boolean',
    },
    {
      key: 'exigeFirmaCliente',
      title: 'Exige Firma',
      width: '120px',
      align: 'center',
      sortable: true,
      dataType: 'boolean',
    },
    {
      key: 'exigeEvidenciasFotograficas',
      title: 'Evidencias Foto',
      width: '140px',
      align: 'center',
      sortable: true,
      dataType: 'boolean',
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

  // Selección
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

    let itemSeleccionado: TipoOrdenTrabajoDto | undefined;
    if (esUnicoSeleccionado) {
      const id = Array.from(this.selectedIds)[0];
      itemSeleccionado = this.tiposOrden.find((t) => t.id === id);
    }

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nuevo tipo de orden de trabajo',
        execute: () => this.irANuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnicoSeleccionado,
        tooltip: 'Editar el tipo de orden seleccionado',
        execute: () => {
          if (itemSeleccionado) {
            this.editar(itemSeleccionado.id);
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
        icon: esUnicoSeleccionado && itemSeleccionado?.activo ? 'stop' : 'check',
        iconColor: esUnicoSeleccionado && itemSeleccionado?.activo ? 'danger' : 'success',
        disabled: !haySeleccion,
        tooltip: 'Activar o desactivar los tipos de orden seleccionados',
        execute: () => this.cambiarEstadoSeleccionados(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de tipos de orden',
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

    this.servicioCampoService.getTiposOrden(soloActivos, this.searchTerm).subscribe({
      next: (data) => {
        this.tiposOrden = data;
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar tipos de orden de trabajo.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: string): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activos':
        this.vistaActualTitulo = 'Tipos de Orden Activos';
        break;
      case 'Todos':
        this.vistaActualTitulo = 'Todos los Tipos de Orden';
        break;
      case 'Inactivos':
        this.vistaActualTitulo = 'Tipos de Orden Inactivos';
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
    let result = [...this.tiposOrden];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.nombre.toLowerCase().includes(term) ||
          (t.descripcion && t.descripcion.toLowerCase().includes(term))
      );
    }

    this.tiposOrdenFiltrados = result;
    this.cdr.markForCheck();
  }


  // Selección
  get isAllSelected(): boolean {
    return (
      this.tiposOrdenFiltrados.length > 0 &&
      this.tiposOrdenFiltrados.every((t) => this.selectedIds.has(t.id))
    );
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.tiposOrdenFiltrados.filter((t) => this.selectedIds.has(t.id)).length;
    return selectedCount > 0 && selectedCount < this.tiposOrdenFiltrados.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.tiposOrdenFiltrados.forEach((t) => this.selectedIds.add(t.id));
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
    this.router.navigate(['/servicio-campo/tipos-orden/nuevo']);
  }

  editar(id: string): void {
    this.router.navigate(['/servicio-campo/tipos-orden/editar', id]);
  }

  cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const primerItem = this.tiposOrden.find((t) => t.id === ids[0]);
    const nuevoEstado = primerItem ? !primerItem.activo : true;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    this.modalService.confirm({
      nzTitle: `¿Desea ${accion} el/los ${ids.length} tipo(s) de orden seleccionado(s)?`,
      nzOkText: 'Sí, continuar',
      nzCancelText: 'Cancelar',
      nzOkType: 'primary',
      nzOkDanger: !nuevoEstado,
      nzOnOk: () => {
        let completados = 0;
        ids.forEach((id) => {
          this.servicioCampoService.cambiarEstadoTipoOrden(id, nuevoEstado).subscribe({
            next: () => {
              completados++;
              if (completados === ids.length) {
                this.message.success(`Tipos de orden actualizados correctamente.`);
                this.cargarDatos();
              }
            },
            error: () => {
              completados++;
              if (completados === ids.length) {
                this.cargarDatos();
              }
            },
          });
        });
      },
    });
  }
}
