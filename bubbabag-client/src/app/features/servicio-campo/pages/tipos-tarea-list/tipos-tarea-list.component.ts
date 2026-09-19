import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServicioCampoService } from '../../services/servicio-campo.service';
import { TipoTareaServicioDto } from '../../models/servicio-campo-catalogos.model';
import { ClienteService } from '../../../crm/services/cliente.service';
import { ClienteListadoItemDto } from '../../../crm/models/cliente.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-tipos-tarea-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzTagModule,
    NzCardModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzDropdownModule,
    NzTooltipModule,
    NzSelectModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tipos-tarea-list.html',
  styleUrl: './tipos-tarea-list.component.css',
})
export class TiposTareaListComponent implements OnInit {
  private servicioCampoService = inject(ServicioCampoService);
  private clienteService = inject(ClienteService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  tareas: TipoTareaServicioDto[] = [];
  tareasFiltradas: TipoTareaServicioDto[] = [];
  clientesFacturables: ClienteListadoItemDto[] = [];
  loading = false;

  // Filtros y Vistas
  searchTerm = '';
  filtroCliente = 'TODOS';
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';
  vistaActualTitulo = 'Tipos de Tarea Activos';

  // Selección
  selectedIds = new Set<string>();

  ngOnInit(): void {
    this.cargarClientesFacturables();
    this.cargarDatos();
  }

  cargarClientesFacturables(): void {
    this.clienteService.getClientes(undefined, true, undefined, true).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.clientesFacturables = data;
          this.cdr.markForCheck();
        } else {
          this.clienteService.getClientes(undefined, undefined, undefined, true).subscribe({
            next: (todos) => {
              this.clientesFacturables = todos;
              this.cdr.markForCheck();
            },
          });
        }
      },
      error: () => {
        this.clienteService.getClientes(undefined, undefined, undefined, true).subscribe({
          next: (todos) => {
            this.clientesFacturables = todos;
            this.cdr.markForCheck();
          },
        });
      },
    });
  }

  get commandBarItems(): CommandBarItem[] {
    const haySeleccion = this.selectedIds.size > 0;
    const esUnicoSeleccionado = this.selectedIds.size === 1;

    let itemSeleccionado: TipoTareaServicioDto | undefined;
    if (esUnicoSeleccionado) {
      const id = Array.from(this.selectedIds)[0];
      itemSeleccionado = this.tareas.find((t) => t.id === id);
    }

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nuevo tipo de tarea de servicio',
        execute: () => this.irANuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnicoSeleccionado,
        tooltip: 'Editar el tipo de tarea seleccionado',
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
        tooltip: 'Activar o desactivar las tareas seleccionadas',
        execute: () => this.cambiarEstadoSeleccionados(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de tareas',
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

    const clienteId = this.filtroCliente !== 'TODOS' ? this.filtroCliente : undefined;

    this.servicioCampoService.getTiposTarea(clienteId, soloActivos, this.searchTerm).subscribe({
      next: (data) => {
        this.tareas = data;
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar tipos de tarea de servicio.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: 'Activos' | 'Todos' | 'Inactivos'): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activos':
        this.vistaActualTitulo = 'Tipos de Tarea Activos';
        break;
      case 'Todos':
        this.vistaActualTitulo = 'Todos los Tipos de Tarea';
        break;
      case 'Inactivos':
        this.vistaActualTitulo = 'Tipos de Tarea Inactivos';
        break;
    }
    this.cargarDatos();
  }

  onClienteFilterChange(): void {
    this.aplicarFiltrosLocales();
  }

  onSearchChange(): void {
    this.aplicarFiltrosLocales();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltrosLocales();
  }

  aplicarFiltrosLocales(): void {
    let filtradas = [...this.tareas];

    if (this.filtroCliente !== 'TODOS') {
      filtradas = filtradas.filter((t) => t.clienteFacturacionId === this.filtroCliente);
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const q = this.searchTerm.toLowerCase().trim();
      filtradas = filtradas.filter(
        (t) =>
          t.codigoTarea.toLowerCase().includes(q) ||
          t.nombre.toLowerCase().includes(q) ||
          (t.clienteFacturacionNombre && t.clienteFacturacionNombre.toLowerCase().includes(q))
      );
    }

    this.tareasFiltradas = filtradas;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // Selección
  get isAllSelected(): boolean {
    return (
      this.tareasFiltradas.length > 0 &&
      this.tareasFiltradas.every((item) => this.selectedIds.has(item.id))
    );
  }

  get isIndeterminate(): boolean {
    const count = this.tareasFiltradas.filter((item) => this.selectedIds.has(item.id)).length;
    return count > 0 && count < this.tareasFiltradas.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.tareasFiltradas.forEach((item) => this.selectedIds.add(item.id));
    } else {
      this.tareasFiltradas.forEach((item) => this.selectedIds.delete(item.id));
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

  formatDuracion(minutos?: number): string {
    if (!minutos) return '0 min';
    const hrs = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins} min`;
  }

  // Navegación a Páginas Dedicadas (Cero Modales)
  irANuevo(): void {
    this.router.navigate(['/servicio-campo/tipos-tarea/nuevo']);
  }

  editar(id: string): void {
    this.router.navigate(['/servicio-campo/tipos-tarea/editar', id]);
  }

  cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const primerItem = this.tareas.find((t) => t.id === ids[0]);
    const nuevoEstado = primerItem ? !primerItem.activo : true;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    this.modalService.confirm({
      nzTitle: `¿Desea ${accion} el/los ${ids.length} tipo(s) de tarea seleccionado(s)?`,
      nzOkText: 'Sí, continuar',
      nzCancelText: 'Cancelar',
      nzOkType: 'primary',
      nzOkDanger: !nuevoEstado,
      nzOnOk: () => {
        let completados = 0;
        ids.forEach((id) => {
          this.servicioCampoService.cambiarEstadoTipoTarea(id, nuevoEstado).subscribe({
            next: () => {
              completados++;
              if (completados === ids.length) {
                this.message.success('Tipos de tarea actualizados correctamente.');
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
