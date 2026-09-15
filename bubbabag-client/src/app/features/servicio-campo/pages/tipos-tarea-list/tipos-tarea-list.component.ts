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
import { TipoTareaServicioDto } from '../../models/servicio-campo-catalogos.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzFormModule } from 'ng-zorro-antd/form';
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
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzInputModule,
    NzInputNumberModule,
    NzTagModule,
    NzSwitchModule,
    NzFormModule,
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
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  tareas: TipoTareaServicioDto[] = [];
  tareasFiltradas: TipoTareaServicioDto[] = [];
  loading = false;
  saving = false;

  // Filtros y Vistas
  searchTerm = '';
  filtroCategoria: string = 'TODAS';
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';
  vistaActualTitulo = 'Tipos de Tarea Activos';

  // Selección
  selectedIds = new Set<string>();

  // Modal Crear / Editar
  modalVisible = false;
  isEdit = false;
  itemSeleccionadoId: string | null = null;
  form!: FormGroup;

  // Categorías comunes
  readonly categorias = [
    'INSTALACION',
    'MANTENIMIENTO',
    'REPARACION',
    'CONFIGURACION',
    'DESINSTALACION',
    'INSPECCION',
    'OTRO',
  ];

  ngOnInit(): void {
    this.initForm();
    this.cargarDatos();
  }

  initForm(): void {
    this.form = this.fb.group({
      codigoTarea: ['', [Validators.required, Validators.maxLength(30)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      categoria: ['INSTALACION', [Validators.required]],
      duracionEstimadaMinutos: [60, [Validators.required, Validators.min(1)]],
      esTareaSiebel: [true],
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
        execute: () => this.abrirModalCrear(),
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

    const cat = this.filtroCategoria !== 'TODAS' ? this.filtroCategoria : undefined;

    this.servicioCampoService.getTiposTarea(cat, soloActivos, this.searchTerm).subscribe({
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

  onCategoriaFilterChange(): void {
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
    let result = [...this.tareas];

    if (this.filtroCategoria !== 'TODAS') {
      result = result.filter((t) => t.categoria?.toUpperCase() === this.filtroCategoria);
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.nombre.toLowerCase().includes(term) ||
          t.codigoTarea.toLowerCase().includes(term) ||
          t.categoria.toLowerCase().includes(term)
      );
    }

    this.tareasFiltradas = result;
    this.cdr.markForCheck();
  }

  formatDuracion(minutos: number): string {
    if (!minutos) return '0 min';
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
  }

  // Selección
  get isAllSelected(): boolean {
    return (
      this.tareasFiltradas.length > 0 &&
      this.tareasFiltradas.every((t) => this.selectedIds.has(t.id))
    );
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.tareasFiltradas.filter((t) => this.selectedIds.has(t.id)).length;
    return selectedCount > 0 && selectedCount < this.tareasFiltradas.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.tareasFiltradas.forEach((t) => this.selectedIds.add(t.id));
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

  // Modales
  abrirModalCrear(): void {
    this.isEdit = false;
    this.itemSeleccionadoId = null;
    this.form.reset({
      codigoTarea: '',
      nombre: '',
      categoria: 'INSTALACION',
      duracionEstimadaMinutos: 60,
      esTareaSiebel: true,
    });
    this.form.get('codigoTarea')?.enable();
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(item: TipoTareaServicioDto): void {
    this.isEdit = true;
    this.itemSeleccionadoId = item.id;
    this.form.patchValue({
      codigoTarea: item.codigoTarea,
      nombre: item.nombre,
      categoria: item.categoria || 'OTRO',
      duracionEstimadaMinutos: item.duracionEstimadaMinutos || 60,
      esTareaSiebel: item.esTareaSiebel,
    });
    this.form.get('codigoTarea')?.disable();
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
        .actualizarTipoTarea(this.itemSeleccionadoId, {
          nombre: formVal.nombre,
          categoria: formVal.categoria,
          duracionEstimadaMinutos: formVal.duracionEstimadaMinutos,
          esTareaSiebel: formVal.esTareaSiebel,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.modalVisible = false;
            this.message.success('Tipo de tarea actualizado correctamente.');
            this.cargarDatos();
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al actualizar tipo de tarea.');
            this.cdr.markForCheck();
          },
        });
    } else {
      this.servicioCampoService
        .crearTipoTarea({
          codigoTarea: formVal.codigoTarea,
          nombre: formVal.nombre,
          categoria: formVal.categoria,
          duracionEstimadaMinutos: formVal.duracionEstimadaMinutos,
          esTareaSiebel: formVal.esTareaSiebel,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.modalVisible = false;
            this.message.success('Tipo de tarea registrado exitosamente.');
            this.cargarDatos();
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al crear tipo de tarea.');
            this.cdr.markForCheck();
          },
        });
    }
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
