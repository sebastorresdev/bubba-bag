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
import { OrigenOrdenDto } from '../../models/servicio-campo-catalogos.model';

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
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-origenes-orden-list',
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
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './origenes-orden-list.html',
  styleUrl: './origenes-orden-list.component.css',
})
export class OrigenesOrdenListComponent implements OnInit {
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  origenes: OrigenOrdenDto[] = [];
  origenesFiltrados: OrigenOrdenDto[] = [];
  loading = false;
  saving = false;

  // Filtros y Vistas
  searchTerm = '';
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';
  vistaActualTitulo = 'Orígenes de Orden Activos';

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
      esIntegracionExterna: [false],
      descripcion: [''],
    });
  }

  get commandBarItems(): CommandBarItem[] {
    const haySeleccion = this.selectedIds.size > 0;
    const esUnicoSeleccionado = this.selectedIds.size === 1;

    let itemSeleccionado: OrigenOrdenDto | undefined;
    if (esUnicoSeleccionado) {
      const id = Array.from(this.selectedIds)[0];
      itemSeleccionado = this.origenes.find((o) => o.id === id);
    }

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nuevo origen de orden',
        execute: () => this.abrirModalCrear(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnicoSeleccionado,
        tooltip: 'Editar el origen seleccionado',
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
        tooltip: 'Activar o desactivar los orígenes seleccionados',
        execute: () => this.cambiarEstadoSeleccionados(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de orígenes',
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

    this.servicioCampoService.getOrigenesOrden(soloActivos, this.searchTerm).subscribe({
      next: (data) => {
        this.origenes = data;
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar orígenes de orden.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: 'Activos' | 'Todos' | 'Inactivos'): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activos':
        this.vistaActualTitulo = 'Orígenes de Orden Activos';
        break;
      case 'Todos':
        this.vistaActualTitulo = 'Todos los Orígenes de Orden';
        break;
      case 'Inactivos':
        this.vistaActualTitulo = 'Orígenes de Orden Inactivos';
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
    let result = [...this.origenes];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.nombre.toLowerCase().includes(term) ||
          o.codigo.toLowerCase().includes(term) ||
          (o.descripcion && o.descripcion.toLowerCase().includes(term))
      );
    }

    this.origenesFiltrados = result;
    this.cdr.markForCheck();
  }

  // Selección
  get isAllSelected(): boolean {
    return (
      this.origenesFiltrados.length > 0 &&
      this.origenesFiltrados.every((o) => this.selectedIds.has(o.id))
    );
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.origenesFiltrados.filter((o) => this.selectedIds.has(o.id)).length;
    return selectedCount > 0 && selectedCount < this.origenesFiltrados.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.origenesFiltrados.forEach((o) => this.selectedIds.add(o.id));
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
      esIntegracionExterna: false,
      descripcion: '',
    });
    this.form.get('codigo')?.enable();
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(item: OrigenOrdenDto): void {
    this.isEdit = true;
    this.itemSeleccionadoId = item.id;
    this.form.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      esIntegracionExterna: item.esIntegracionExterna,
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
        .actualizarOrigenOrden(this.itemSeleccionadoId, {
          nombre: formVal.nombre,
          esIntegracionExterna: formVal.esIntegracionExterna,
          descripcion: formVal.descripcion,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.modalVisible = false;
            this.message.success('Origen de orden actualizado correctamente.');
            this.cargarDatos();
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al actualizar origen de orden.');
            this.cdr.markForCheck();
          },
        });
    } else {
      this.servicioCampoService
        .crearOrigenOrden({
          codigo: formVal.codigo,
          nombre: formVal.nombre,
          esIntegracionExterna: formVal.esIntegracionExterna,
          descripcion: formVal.descripcion,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.modalVisible = false;
            this.message.success('Origen de orden registrado exitosamente.');
            this.cargarDatos();
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al crear origen de orden.');
            this.cdr.markForCheck();
          },
        });
    }
  }

  cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const primerItem = this.origenes.find((o) => o.id === ids[0]);
    const nuevoEstado = primerItem ? !primerItem.activo : true;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    this.modalService.confirm({
      nzTitle: `¿Desea ${accion} el/los ${ids.length} origen(es) seleccionado(s)?`,
      nzOkText: 'Sí, continuar',
      nzCancelText: 'Cancelar',
      nzOkType: 'primary',
      nzOkDanger: !nuevoEstado,
      nzOnOk: () => {
        let completados = 0;
        ids.forEach((id) => {
          this.servicioCampoService.cambiarEstadoOrigenOrden(id, nuevoEstado).subscribe({
            next: () => {
              completados++;
              if (completados === ids.length) {
                this.message.success('Orígenes de orden actualizados correctamente.');
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
