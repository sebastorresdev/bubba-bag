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

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

export interface OrdenTrabajoItemDto {
  id: string;
  numero: string;
  cliente: string;
  servicio: string;
  direccion: string;
  tecnico?: string;
  fechaProgramada: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'Pendiente' | 'EnRuta' | 'EnProceso' | 'Completada' | 'Cancelada';
}

@Component({
  selector: 'app-ordenes-list',
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
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ordenes-list.html',
  styleUrl: './ordenes-list.component.css',
})
export class OrdenesListComponent implements OnInit {
  private router = inject(Router);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  ordenes: OrdenTrabajoItemDto[] = [];
  ordenesFiltradas: OrdenTrabajoItemDto[] = [];
  loading = false;

  searchTerm = '';
  vistaActual = 'Todas';
  vistaActualTitulo = 'Todas las Órdenes de Trabajo';
  vistasSistema: VistaItem[] = [
    { key: 'Todas', nombre: 'Todas las Órdenes de Trabajo', esSistema: true, esPredeterminada: true },
    { key: 'Pendientes', nombre: 'Órdenes Pendientes', esSistema: true },
    { key: 'EnProceso', nombre: 'Órdenes en Progreso', esSistema: true },
    { key: 'Completadas', nombre: 'Órdenes Completadas', esSistema: true },
  ];

  onVistaChange(vista: VistaItem): void {
    this.cambiarVista(vista.key);
  }

  columnas: ColumnDef<OrdenTrabajoItemDto>[] = [
    {
      key: 'numero',
      title: 'N° Orden',
      width: '130px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
      canHide: false,
    },
    {
      key: 'cliente',
      title: 'Cliente',
      width: '240px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'servicio',
      title: 'Servicio',
      width: '200px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'direccion',
      title: 'Dirección de Atención',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'tecnico',
      title: 'Técnico Asignado',
      width: '160px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'fechaProgramada',
      title: 'Fecha Prog.',
      width: '140px',
      align: 'center',
      sortable: true,
      dataType: 'date',
    },
    {
      key: 'prioridad',
      title: 'Prioridad',
      width: '110px',
      align: 'center',
      sortable: true,
      dataType: 'text',
      filterType: 'select',
      filterOptions: [
        { label: 'Alta', value: 'Alta' },
        { label: 'Media', value: 'Media' },
        { label: 'Baja', value: 'Baja' },
      ],
    },
    {
      key: 'estado',
      title: 'Estado',
      width: '120px',
      align: 'center',
      sortable: true,
      dataType: 'text',
      filterType: 'select',
      filterOptions: [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En Ruta', value: 'EnRuta' },
        { label: 'En Proceso', value: 'EnProceso' },
        { label: 'Completada', value: 'Completada' },
        { label: 'Cancelada', value: 'Cancelada' },
      ],
    },
  ];

  selectedIds = new Set<string>();

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;
    this.cdr.markForCheck();
  }

  get isAllSelected(): boolean {
    return (
      this.ordenesFiltradas.length > 0 &&
      this.ordenesFiltradas.every((item) => this.selectedIds.has(item.id))
    );
  }

  get isIndeterminate(): boolean {
    const count = this.selectedCount;
    return count > 0 && count < this.ordenesFiltradas.length;
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
        tooltip: 'Crear nueva orden de trabajo',
        execute: () => this.nuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnico,
        tooltip: esUnico ? 'Editar orden seleccionada' : 'Seleccione exactamente una orden',
        execute: () => {
          const id = Array.from(this.selectedIds)[0];
          if (id) this.editar(id);
        },
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Actualizar lista',
        execute: () => this.cargarDatos(),
      },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        tooltip: 'Exportar datos actuales a Excel',
        execute: () => this.exportar(),
      },
    ];
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.ordenes = [];
      this.aplicarFiltrosLocales();
      this.loading = false;
      this.cdr.markForCheck();
    }, 150);
  }

  cambiarVista(vista: string): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Pendientes':
        this.vistaActualTitulo = 'Órdenes Pendientes';
        break;
      case 'EnProceso':
        this.vistaActualTitulo = 'Órdenes en Progreso';
        break;
      case 'Completadas':
        this.vistaActualTitulo = 'Órdenes Completadas';
        break;
      case 'Todas':
      default:
        this.vistaActualTitulo = 'Todas las Órdenes de Trabajo';
        break;
    }
    this.selectedIds.clear();
    this.aplicarFiltrosLocales();
  }

  onSearchChange(): void {
    this.aplicarFiltrosLocales();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltrosLocales();
  }

  private aplicarFiltrosLocales(): void {
    let result = [...this.ordenes];

    if (this.vistaActual === 'Pendientes') {
      result = result.filter((o) => o.estado === 'Pendiente');
    } else if (this.vistaActual === 'EnProceso') {
      result = result.filter((o) => o.estado === 'EnProceso' || o.estado === 'EnRuta');
    } else if (this.vistaActual === 'Completadas') {
      result = result.filter((o) => o.estado === 'Completada');
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.numero.toLowerCase().includes(term) ||
          o.cliente.toLowerCase().includes(term) ||
          o.servicio.toLowerCase().includes(term) ||
          o.direccion.toLowerCase().includes(term) ||
          (o.tecnico && o.tecnico.toLowerCase().includes(term))
      );
    }

    this.ordenesFiltradas = result;
    this.cdr.markForCheck();
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.ordenesFiltradas.forEach((item) => this.selectedIds.add(item.id));
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
    this.message.info('El flujo de creación de Órdenes de Trabajo estará disponible próximamente.');
  }

  editar(id: string): void {
    this.message.info(`Abriendo orden de trabajo: ${id}`);
  }

  exportar(): void {
    this.message.info('Exportación de órdenes de trabajo generada.');
  }
}
