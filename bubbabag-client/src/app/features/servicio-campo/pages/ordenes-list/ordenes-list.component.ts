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
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

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
    NzDropdownModule,
    NzTooltipModule,
    NzBadgeModule,
    CommandBarComponent,
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
  vistaActual: 'Todas' | 'Pendientes' | 'EnProceso' | 'Completadas' = 'Todas';
  vistaActualTitulo = 'Todas las Órdenes de Trabajo';

  selectedIds = new Set<string>();

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
        label: 'Nueva Orden',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nueva orden de trabajo',
        execute: () => this.nuevaOrden(),
      },
      {
        key: 'view',
        label: 'Ver Detalle',
        icon: 'eye',
        iconColor: 'primary',
        disabled: !esUnico,
        tooltip: esUnico ? 'Ver orden de trabajo seleccionada' : 'Seleccione una orden',
        execute: () => {
          const id = Array.from(this.selectedIds)[0];
          if (id) this.verDetalle(id);
        },
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Refrescar listado',
        execute: () => this.cargarDatos(),
      },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        tooltip: 'Descargar datos actuales',
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

    // Simulación inicial mientras no haya OTs registradas en backend
    setTimeout(() => {
      this.ordenes = [];
      this.aplicarFiltrosLocales();
      this.loading = false;
      this.cdr.markForCheck();
    }, 250);
  }

  cambiarVista(vista: 'Todas' | 'Pendientes' | 'EnProceso' | 'Completadas'): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Pendientes':
        this.vistaActualTitulo = 'Órdenes Pendientes';
        break;
      case 'EnProceso':
        this.vistaActualTitulo = 'Órdenes en Progreso / En Ruta';
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

  onSelectAll(checked: boolean): void {
    if (checked) {
      this.ordenesFiltradas.forEach((item) => this.selectedIds.add(item.id));
    } else {
      this.selectedIds.clear();
    }
    this.cdr.markForCheck();
  }

  onItemSelect(id: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.cdr.markForCheck();
  }

  nuevaOrden(): void {
    this.message.info('El flujo de creación de Órdenes de Trabajo estará disponible próximamente.');
  }

  verDetalle(id: string): void {
    this.message.info(`Abriendo detalle de orden: ${id}`);
  }

  exportar(): void {
    this.message.info('Exportación de órdenes de trabajo generada.');
  }
}
