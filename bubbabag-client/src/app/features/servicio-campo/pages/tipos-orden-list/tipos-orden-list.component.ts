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
import { TipoOrdenTrabajoDto } from '../../models/servicio-campo-catalogos.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
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
  templateUrl: './tipos-orden-list.html',
  styleUrl: './tipos-orden-list.component.css',
})
export class TiposOrdenListComponent implements OnInit {
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  tiposOrden: TipoOrdenTrabajoDto[] = [];
  tiposOrdenFiltrados: TipoOrdenTrabajoDto[] = [];
  loading = false;
  saving = false;

  // Filtros y Vistas
  searchTerm = '';
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';
  vistaActualTitulo = 'Tipos de Orden Activos';

  // Selección
  selectedIds = new Set<string>();

  // Modal Crear / Editar
  modalVisible = false;
  isEdit = false;
  itemSeleccionadoId: string | null = null;
  form!: FormGroup;

  // Preset Colors para Tipo de Orden
  readonly colorPresets = [
    '#0f6cbd', '#0078d4', '#107c41', '#d13438',
    '#ffaa00', '#873bf4', '#008272', '#5c2d91',
    '#004e8c', '#a80000', '#498205', '#69797e'
  ];

  ngOnInit(): void {
    this.initForm();
    this.cargarDatos();
  }

  initForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(30)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      requiereVisitaCampo: [true],
      exigeFirmaCliente: [true],
      exigeEvidenciasFotograficas: [true],
      colorHex: ['#0f6cbd', [Validators.required]],
      descripcion: [''],
    });
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
        execute: () => this.abrirModalCrear(),
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

  cambiarVista(vista: 'Activos' | 'Todos' | 'Inactivos'): void {
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
          t.codigo.toLowerCase().includes(term) ||
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

  // Modales
  abrirModalCrear(): void {
    this.isEdit = false;
    this.itemSeleccionadoId = null;
    this.form.reset({
      codigo: '',
      nombre: '',
      requiereVisitaCampo: true,
      exigeFirmaCliente: true,
      exigeEvidenciasFotograficas: true,
      colorHex: '#0f6cbd',
      descripcion: '',
    });
    this.form.get('codigo')?.enable();
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(item: TipoOrdenTrabajoDto): void {
    this.isEdit = true;
    this.itemSeleccionadoId = item.id;
    this.form.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      requiereVisitaCampo: item.requiereVisitaCampo,
      exigeFirmaCliente: item.exigeFirmaCliente,
      exigeEvidenciasFotograficas: item.exigeEvidenciasFotograficas,
      colorHex: item.colorHex || '#0f6cbd',
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
        .actualizarTipoOrden(this.itemSeleccionadoId, {
          nombre: formVal.nombre,
          requiereVisitaCampo: formVal.requiereVisitaCampo,
          exigeFirmaCliente: formVal.exigeFirmaCliente,
          exigeEvidenciasFotograficas: formVal.exigeEvidenciasFotograficas,
          colorHex: formVal.colorHex,
          descripcion: formVal.descripcion,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.modalVisible = false;
            this.message.success('Tipo de orden actualizado correctamente.');
            this.cargarDatos();
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al actualizar tipo de orden.');
            this.cdr.markForCheck();
          },
        });
    } else {
      this.servicioCampoService
        .crearTipoOrden({
          codigo: formVal.codigo,
          nombre: formVal.nombre,
          requiereVisitaCampo: formVal.requiereVisitaCampo,
          exigeFirmaCliente: formVal.exigeFirmaCliente,
          exigeEvidenciasFotograficas: formVal.exigeEvidenciasFotograficas,
          colorHex: formVal.colorHex,
          descripcion: formVal.descripcion,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.modalVisible = false;
            this.message.success('Tipo de orden creado exitosamente.');
            this.cargarDatos();
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al crear tipo de orden.');
            this.cdr.markForCheck();
          },
        });
    }
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
