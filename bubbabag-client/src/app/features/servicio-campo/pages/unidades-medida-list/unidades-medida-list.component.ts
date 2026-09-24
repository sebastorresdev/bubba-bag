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
import { UnidadMedidaService } from '../../services/unidad-medida.service';
import { UnidadMedidaDto } from '../../models/catalogo-producto.model';

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
  selector: 'app-unidades-medida-list',
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
  templateUrl: './unidades-medida-list.html',
  styleUrl: './unidades-medida-list.component.css',
})
export class UnidadesMedidaListComponent implements OnInit {
  private router = inject(Router);
  private unidadMedidaService = inject(UnidadMedidaService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  unidades: UnidadMedidaDto[] = [];
  unidadesFiltradas: UnidadMedidaDto[] = [];
  loading = false;

  // Filtros y Vistas
  searchTerm = '';
  vistaActual = 'Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Unidades Activas', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Unidades Inactivas', esSistema: true },
    { key: 'Todos', nombre: 'Todas las Unidades', esSistema: true },
  ];

  columnas: ColumnDef<UnidadMedidaDto>[] = [
    {
      key: 'codigo',
      title: 'Código',
      width: '130px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
      canHide: false,
    },
    {
      key: 'nombre',
      title: 'Nombre',
      width: '240px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
    },
    {
      key: 'abreviatura',
      title: 'Símbolo / Abreviatura',
      width: '180px',
      align: 'center',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'permiteDecimales',
      title: 'Permite Decimales',
      width: '170px',
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

    let itemSeleccionado: UnidadMedidaDto | undefined;
    if (esUnicoSeleccionado) {
      const id = Array.from(this.selectedIds)[0];
      itemSeleccionado = this.unidades.find((u) => u.id === id);
    }

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nueva unidad de medida',
        execute: () => this.router.navigate(['/servicio-campo/unidades-medida/nuevo']),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnicoSeleccionado,
        tooltip: 'Editar la unidad de medida seleccionada',
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
        tooltip: 'Activar o desactivar las unidades seleccionadas',
        execute: () => this.cambiarEstadoSeleccionados(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de unidades de medida',
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

    this.unidadMedidaService.getUnidadesMedida(soloActivos, this.searchTerm).subscribe({
      next: (data) => {
        this.unidades = data;
        this.unidadesFiltradas = [...data];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar catálogo de unidades de medida.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  abrirEditar(item: UnidadMedidaDto): void {
    this.router.navigate(['/servicio-campo/unidades-medida/editar', item.id], {
      state: { data: item },
    });
  }

  cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const primerItem = this.unidades.find((u) => u.id === ids[0]);
    const nuevoEstado = primerItem ? !primerItem.activo : true;

    let completados = 0;
    ids.forEach((id) => {
      this.unidadMedidaService.cambiarEstado(id, nuevoEstado).subscribe({
        next: () => {
          completados++;
          if (completados === ids.length) {
            this.message.success(
              `Se ${nuevoEstado ? 'activaron' : 'desactivaron'} ${ids.length} unidad(es) de medida.`
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
