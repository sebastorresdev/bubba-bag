import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CargoService } from '../../services/cargo.service';
import { DepartamentoService } from '../../services/departamento.service';
import { CargoDto } from '../../models/cargo.model';
import { DepartamentoDto } from '../../models/departamento.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { OrganigramaModalComponent } from '../../components/organigrama-modal/organigrama-modal.component';

@Component({
  selector: 'app-cargos-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzInputModule,
    NzInputNumberModule,
    NzTagModule,
    NzSelectModule,
    NzSwitchModule,
    NzFormModule,
    NzCardModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzDropdownModule,
    NzTooltipModule,
    CommandBarComponent,
    OrganigramaModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './cargos-list.html',
  styleUrl: './cargos-list.component.css',
})
export class CargosListComponent implements OnInit {
  private cargoService = inject(CargoService);
  private departamentoService = inject(DepartamentoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  cargos: CargoDto[] = [];
  departamentos: DepartamentoDto[] = [];
  loading = false;
  searchTerm = '';
  searchSubject = new Subject<string>();
  departamentoFiltroId?: string;

  // Organigrama modal
  organigramaVisible = false;
  organigramaDepartamentoId?: string;

  // Vistas D365
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';

  // Selección
  selectedIds = new Set<string>();

  // Modal Crear/Editar
  modalVisible = false;
  modalModo: 'crear' | 'editar' = 'crear';
  saving = false;
  cargoSeleccionado?: CargoDto;

  cargoForm = this.fb.group({
    id: [''],
    departamentoId: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    salarioReferencial: [null as number | null, [Validators.min(0)]],
    activo: [true],
  });

  ngOnInit(): void {
    this.cargarDepartamentos();
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.cargarCargos();
      });

    this.route.queryParams.subscribe((params) => {
      if (params['departamentoId']) {
        this.departamentoFiltroId = params['departamentoId'];
      }
      this.cargarCargos();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarCargos();
  }

  get vistaActualTitulo(): string {
    switch (this.vistaActual) {
      case 'Activos':
        return 'Cargos y Puestos Activos';
      case 'Inactivos':
        return 'Cargos y Puestos Inactivos';
      case 'Todos':
        return 'Todos los Cargos y Puestos';
    }
  }

  get commandBarItems(): CommandBarItem[] {
    const singleSelection = this.selectedIds.size === 1;
    const selectedItem = singleSelection
      ? this.cargos.find((c) => this.selectedIds.has(c.id))
      : undefined;

    return [
      {
        key: 'nuevo',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        execute: () => this.abrirModalCrear(),
      },
      {
        key: 'editar',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !singleSelection,
        execute: () => {
          if (selectedItem) {
            this.abrirModalEditar(selectedItem);
          }
        },
      },
      {
        key: 'estado',
        label: selectedItem?.activo ? 'Desactivar' : 'Activar',
        icon: selectedItem?.activo ? 'close' : 'check',
        disabled: !singleSelection,
        execute: () => {
          if (selectedItem) {
            this.toggleEstado(selectedItem);
          }
        },
      },
      {
        key: 'eliminar',
        label: 'Eliminar',
        icon: 'delete',
        iconColor: 'danger',
        danger: true,
        disabled: !singleSelection,
        execute: () => {
          if (selectedItem) {
            this.confirmarEliminar(selectedItem);
          }
        },
      },
      {
        key: 'exportar',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        iconColor: 'success',
        split: true,
        tooltip: 'Exportar cargos a formato Excel',
        execute: () => this.exportarCsv(),
        children: [
          {
            key: 'export-csv',
            label: 'Exportar a CSV (.csv)',
            icon: 'file-excel',
            iconColor: 'success',
            execute: () => this.exportarCsv(),
          },
        ],
      },
      {
        key: 'actualizar',
        label: 'Actualizar',
        icon: 'reload',
        iconColor: 'neutral',
        execute: () => this.cargarCargos(),
      },
    ];
  }

  get farItems(): CommandBarItem[] {
    return [];
  }

  cargarDepartamentos(): void {
    this.departamentoService.getDepartamentos(undefined, true).subscribe({
      next: (data) => {
        this.departamentos = data;
        this.cdr.markForCheck();
      },
    });
  }

  cargarCargos(): void {
    this.loading = true;
    const soloActivos = this.vistaActual === 'Activos' ? true : this.vistaActual === 'Inactivos' ? false : undefined;

    this.cargoService.getCargos(this.departamentoFiltroId, this.searchTerm.trim() || undefined, soloActivos).subscribe({
      next: (data) => {
        this.cargos = data;
        this.loading = false;
        this.selectedIds.clear();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        // Manejado por errorInterceptor con notificación lateral derecha
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: 'Activos' | 'Todos' | 'Inactivos'): void {
    if (this.vistaActual === vista) return;
    this.vistaActual = vista;
    this.cargarCargos();
  }

  onDepartamentoFiltroChange(): void {
    this.cargarCargos();
  }

  // Selección
  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.cargos.forEach((c) => this.selectedIds.add(c.id));
    } else {
      this.selectedIds.clear();
    }
  }

  get isAllSelected(): boolean {
    return (
      this.cargos.length > 0 &&
      this.cargos.every((c) => this.selectedIds.has(c.id))
    );
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.cargos.filter((c) =>
      this.selectedIds.has(c.id)
    ).length;
    return selectedCount > 0 && selectedCount < this.cargos.length;
  }

  // Modal
  abrirModalCrear(): void {
    this.modalModo = 'crear';
    this.cargoSeleccionado = undefined;
    this.cargoForm.reset({
      id: '',
      departamentoId: this.departamentoFiltroId || '',
      nombre: '',
      salarioReferencial: null,
      activo: true,
    });
    this.modalVisible = true;
  }

  abrirModalEditar(cargo: CargoDto): void {
    this.modalModo = 'editar';
    this.cargoSeleccionado = cargo;
    this.cargoForm.setValue({
      id: cargo.id,
      departamentoId: cargo.departamentoId,
      nombre: cargo.nombre,
      salarioReferencial: cargo.salarioReferencial ?? null,
      activo: cargo.activo,
    });
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.saving = false;
  }

  guardar(): void {
    if (this.cargoForm.invalid) {
      Object.values(this.cargoForm.controls).forEach((c) => {
        if (c.invalid) {
          c.markAsDirty();
          c.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const formVal = this.cargoForm.value;
    this.saving = true;

    if (this.modalModo === 'crear') {
      this.cargoService
        .crearCargo({
          departamentoId: formVal.departamentoId!,
          nombre: formVal.nombre!,
          salarioReferencial: formVal.salarioReferencial ?? undefined,
        })
        .subscribe({
          next: () => {
            this.message.success('Cargo creado exitosamente.');
            this.cerrarModal();
            this.cargarCargos();
          },
          error: () => {
            this.saving = false;
            // Manejado por errorInterceptor con notificación lateral derecha
            this.cdr.markForCheck();
          },
        });
    } else {
      this.cargoService
        .actualizarCargo(formVal.id!, {
          departamentoId: formVal.departamentoId!,
          nombre: formVal.nombre!,
          salarioReferencial: formVal.salarioReferencial ?? undefined,
          activo: formVal.activo ?? true,
        })
        .subscribe({
          next: () => {
            this.message.success('Cargo actualizado exitosamente.');
            this.cerrarModal();
            this.cargarCargos();
          },
          error: () => {
            this.saving = false;
            // Manejado por errorInterceptor con notificación lateral derecha
            this.cdr.markForCheck();
          },
        });
    }
  }

  toggleEstado(cargo: CargoDto): void {
    const nuevoEstado = !cargo.activo;
    const accionTexto = nuevoEstado ? 'activar' : 'desactivar';

    this.modal.confirm({
      nzTitle: `¿Desea ${accionTexto} el cargo?`,
      nzContent: `El cargo "${cargo.nombre}" pasará a estado ${nuevoEstado ? 'Activo' : 'Inactivo'}.`,
      nzOkText: 'Confirmar',
      nzCancelText: 'Cancelar',
      nzOnOk: () => {
        this.cargoService.cambiarEstado(cargo.id, nuevoEstado).subscribe({
          next: () => {
            this.message.success(`Cargo ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`);
            this.cargarCargos();
          },
          error: () => {
            // Manejado por errorInterceptor con notificación lateral derecha
          },
        });
      },
    });
  }

  confirmarEliminar(cargo: CargoDto): void {
    if (cargo.totalEmpleados > 0) {
      this.modal.warning({
        nzTitle: 'No se puede eliminar',
        nzContent: `El cargo "${cargo.nombre}" tiene ${cargo.totalEmpleados} colaborador(es) asignado(s). Le sugerimos desactivarlo en su lugar.`,
        nzOkText: 'Entendido',
      });
      return;
    }

    this.modal.confirm({
      nzTitle: '¿Eliminar cargo permanentemente?',
      nzContent: `¿Está seguro de que desea eliminar el cargo "${cargo.nombre}"? Esta acción no se puede deshacer.`,
      nzOkText: 'Sí, eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => {
        this.cargoService.eliminarCargo(cargo.id).subscribe({
          next: () => {
            this.message.success('Cargo eliminado exitosamente.');
            this.cargarCargos();
          },
          error: () => {
            // Manejado por errorInterceptor con notificación lateral derecha
          },
        });
      },
    });
  }

  irADepartamento(departamentoId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/rrhh/departamentos'], { queryParams: { departamentoId } });
  }

  abrirOrganigramaDepartamento(departamentoId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.organigramaDepartamentoId = departamentoId;
    this.organigramaVisible = true;
  }

  exportarCsv(): void {
    if (!this.cargos.length) {
      this.message.warning('No hay datos para exportar.');
      return;
    }

    const headers = ['Cargo', 'Departamento', 'Salario Referencial', 'Colaboradores', 'Estado'];
    const rows = this.cargos.map((c) => [
      `"${c.nombre.replace(/"/g, '""')}"`,
      `"${c.departamentoNombre.replace(/"/g, '""')}"`,
      c.salarioReferencial ?? 0,
      c.totalEmpleados,
      c.activo ? 'Activo' : 'Inactivo',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cargos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.message.success('Archivo CSV exportado exitosamente.');
  }
}
