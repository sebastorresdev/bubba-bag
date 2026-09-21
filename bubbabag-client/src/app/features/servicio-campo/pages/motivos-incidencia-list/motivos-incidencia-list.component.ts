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
import { ServicioCampoService } from '../../services/servicio-campo.service';
import {
  MotivoIncidenciaDto,
  AmbitoMotivo,
  AmbitoMotivoLabels,
} from '../../models/servicio-campo-catalogos.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { ViewSelectorComponent, VistaItem } from '../../../../shared/components/view-selector';

@Component({
  selector: 'app-motivos-incidencia-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzInputModule,
    NzTagModule,
    NzSelectModule,
    NzCardModule,
    NzEmptyModule,
    NzCheckboxModule,
    CommandBarComponent,
    ViewSelectorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './motivos-incidencia-list.html',
  styleUrl: './motivos-incidencia-list.component.css',
})
export class MotivosIncidenciaListComponent implements OnInit {
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);

  // Model & Labels
  AmbitoMotivo = AmbitoMotivo;
  AmbitoMotivoLabels = AmbitoMotivoLabels;

  // Datos
  motivos: MotivoIncidenciaDto[] = [];
  motivosFiltrados: MotivoIncidenciaDto[] = [];
  loading = false;
  saving = false;

  // Filtros y Vistas
  searchTerm = '';
  ambitoSeleccionado: AmbitoMotivo | null = null;
  vistaActual = 'Activos';
  vistaActualTitulo = 'Motivos de Incidencia Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Motivos de Incidencia Activos', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Motivos de Incidencia Inactivos', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Motivos de Incidencia', esSistema: true },
  ];

  onVistaChange(vista: VistaItem): void {
    this.cambiarVista(vista.key);
  }

  // Selección
  selectedIds = new Set<string>();

  ngOnInit(): void {
    this.cargarDatos();
  }

  get commandBarItems(): CommandBarItem[] {
    const haySeleccion = this.selectedIds.size > 0;
    const esUnicoSeleccionado = this.selectedIds.size === 1;

    let itemSeleccionado: MotivoIncidenciaDto | undefined;
    if (esUnicoSeleccionado) {
      const id = Array.from(this.selectedIds)[0];
      itemSeleccionado = this.motivos.find((m) => m.id === id);
    }

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nuevo motivo de incidencia',
        execute: () => this.irANuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnicoSeleccionado,
        tooltip: 'Editar el motivo seleccionado',
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
        tooltip: 'Activar o desactivar los motivos seleccionados',
        execute: () => this.cambiarEstadoSeleccionados(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de motivos',
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

    const ambito = this.ambitoSeleccionado !== null ? this.ambitoSeleccionado : undefined;

    this.servicioCampoService.getMotivosIncidencia(ambito, soloActivos, this.searchTerm).subscribe({
      next: (data) => {
        this.motivos = data;
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar motivos de incidencia.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: string): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activos':
        this.vistaActualTitulo = 'Motivos de Incidencia Activos';
        break;
      case 'Todos':
        this.vistaActualTitulo = 'Todos los Motivos de Incidencia';
        break;
      case 'Inactivos':
        this.vistaActualTitulo = 'Motivos de Incidencia Inactivos';
        break;
    }
    this.cargarDatos();
  }

  cambiarFiltroAmbito(ambito: AmbitoMotivo | null): void {
    this.ambitoSeleccionado = ambito;
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
    let result = [...this.motivos];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.nombre.toLowerCase().includes(term) ||
          m.codigo.toLowerCase().includes(term) ||
          (m.descripcion && m.descripcion.toLowerCase().includes(term))
      );
    }

    this.motivosFiltrados = result;
    this.cdr.markForCheck();
  }

  // Selección
  get isAllSelected(): boolean {
    return (
      this.motivosFiltrados.length > 0 &&
      this.motivosFiltrados.every((m) => this.selectedIds.has(m.id))
    );
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.motivosFiltrados.filter((m) => this.selectedIds.has(m.id)).length;
    return selectedCount > 0 && selectedCount < this.motivosFiltrados.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.motivosFiltrados.forEach((m) => this.selectedIds.add(m.id));
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

  getAmbitoBadgeColor(ambito: AmbitoMotivo): string {
    switch (ambito) {
      case AmbitoMotivo.Visita:
        return 'purple';
      case AmbitoMotivo.OrdenTrabajo:
        return 'blue';
      case AmbitoMotivo.Tarea:
        return 'orange';
      default:
        return 'default';
    }
  }

  irANuevo(): void {
    this.router.navigate(['/servicio-campo/motivos-incidencia/nuevo']);
  }

  editar(id: string): void {
    this.router.navigate(['/servicio-campo/motivos-incidencia/editar', id]);
  }

  cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const primerItem = this.motivos.find((m) => m.id === ids[0]);
    const nuevoEstado = primerItem ? !primerItem.activo : true;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    this.modalService.confirm({
      nzTitle: `¿Desea ${accion} el/los ${ids.length} motivo(s) seleccionado(s)?`,
      nzOkText: 'Sí, continuar',
      nzCancelText: 'Cancelar',
      nzOkType: 'primary',
      nzOkDanger: !nuevoEstado,
      nzOnOk: () => {
        let completados = 0;
        ids.forEach((id) => {
          this.servicioCampoService.cambiarEstadoMotivoIncidencia(id, nuevoEstado).subscribe({
            next: () => {
              completados++;
              if (completados === ids.length) {
                this.message.success('Motivos de incidencia actualizados correctamente.');
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
