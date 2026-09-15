import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-motivos-incidencia-list',
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
    NzSelectModule,
    NzFormModule,
    NzCardModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzDropdownModule,
    NzTooltipModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './motivos-incidencia-list.html',
  styleUrl: './motivos-incidencia-list.component.css',
})
export class MotivosIncidenciaListComponent implements OnInit {
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private fb = inject(FormBuilder);
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
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';
  vistaActualTitulo = 'Motivos de Incidencia Activos';

  // Selección
  selectedIds = new Set<string>();

  // Modal Crear / Editar
  modalVisible = false;
  isEdit = false;
  itemSeleccionadoId: string | null = null;
  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.cargarDatos();
  }

  initForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      ambito: [AmbitoMotivo.OrdenTrabajo, [Validators.required]],
      descripcion: [''],
    });
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
        execute: () => this.abrirModalCrear(),
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
            this.abrirModalEditar(itemSeleccionado);
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

  cambiarVista(vista: 'Activos' | 'Todos' | 'Inactivos'): void {
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

  // Modales
  abrirModalCrear(): void {
    this.isEdit = false;
    this.itemSeleccionadoId = null;
    this.form.reset({
      codigo: '',
      nombre: '',
      ambito: AmbitoMotivo.OrdenTrabajo,
      descripcion: '',
    });
    this.form.get('codigo')?.enable();
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(item: MotivoIncidenciaDto): void {
    this.isEdit = true;
    this.itemSeleccionadoId = item.id;
    this.form.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      ambito: item.ambito,
      descripcion: item.descripcion || '',
    });
    this.form.get('codigo')?.disable();
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  guardar(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((ctrl) => {
        if (ctrl.invalid) {
          ctrl.markAsDirty();
          ctrl.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.saving = true;
    const formVal = this.form.getRawValue();

    if (this.isEdit && this.itemSeleccionadoId) {
      this.servicioCampoService
        .actualizarMotivoIncidencia(this.itemSeleccionadoId, {
          nombre: formVal.nombre,
          ambito: formVal.ambito,
          descripcion: formVal.descripcion,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.modalVisible = false;
            this.message.success('Motivo de incidencia actualizado correctamente.');
            this.cargarDatos();
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al actualizar motivo de incidencia.');
            this.cdr.markForCheck();
          },
        });
    } else {
      this.servicioCampoService
        .crearMotivoIncidencia({
          codigo: formVal.codigo,
          nombre: formVal.nombre,
          ambito: formVal.ambito,
          descripcion: formVal.descripcion,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.modalVisible = false;
            this.message.success('Motivo de incidencia registrado exitosamente.');
            this.cargarDatos();
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al crear motivo de incidencia.');
            this.cdr.markForCheck();
          },
        });
    }
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
