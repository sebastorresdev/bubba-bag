import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DepartamentoService } from '../../services/departamento.service';
import { DepartamentoDto } from '../../models/departamento.model';

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
import { OrganigramaModalComponent } from '../../components/organigrama-modal/organigrama-modal.component';

@Component({
  selector: 'app-departamentos-list',
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
    OrganigramaModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './departamentos-list.html',
  styleUrl: './departamentos-list.component.css',
})
export class DepartamentosListComponent implements OnInit {
  private departamentoService = inject(DepartamentoService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  departamentos: DepartamentoDto[] = [];
  loading = false;
  searchTerm = '';
  searchSubject = new Subject<string>();

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
  departamentoSeleccionado?: DepartamentoDto;

  deptoForm = this.fb.group({
    id: [''],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(250)]],
    activo: [true],
  });

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.cargarDepartamentos();
      });

    this.route.queryParams.subscribe((params) => {
      const deptoId = params['departamentoId'];
      this.cargarDepartamentos(deptoId);
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
    this.cargarDepartamentos();
  }

  get vistaActualTitulo(): string {
    switch (this.vistaActual) {
      case 'Activos':
        return 'Departamentos Activos';
      case 'Inactivos':
        return 'Departamentos Inactivos';
      case 'Todos':
        return 'Todos los Departamentos';
    }
  }

  get commandBarItems(): CommandBarItem[] {
    const hasSelection = this.selectedIds.size > 0;
    const singleSelection = this.selectedIds.size === 1;
    const selectedItem = singleSelection
      ? this.departamentos.find((d) => this.selectedIds.has(d.id))
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
        key: 'organigrama',
        label: 'Ver Organigrama',
        icon: 'apartment',
        disabled: !singleSelection,
        execute: () => {
          if (selectedItem) {
            this.abrirOrganigrama(selectedItem);
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
        tooltip: 'Exportar departamentos a formato Excel',
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
        execute: () => this.cargarDepartamentos(),
      },
    ];
  }

  get farItems(): CommandBarItem[] {
    return [];
  }

  cargarDepartamentos(targetId?: string): void {
    this.loading = true;
    const soloActivos = this.vistaActual === 'Activos' ? true : this.vistaActual === 'Inactivos' ? false : undefined;

    this.departamentoService.getDepartamentos(this.searchTerm.trim() || undefined, soloActivos).subscribe({
      next: (data) => {
        this.departamentos = data;
        if (targetId) {
          const target = this.departamentos.find((d) => d.id === targetId);
          if (target) {
            this.selectedIds = new Set([target.id]);
          }
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        // Manejado por errorInterceptor con notificación lateral derecha
        this.cdr.markForCheck();
      },
    });
  }

  abrirOrganigrama(depto: DepartamentoDto, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.organigramaDepartamentoId = depto.id;
    this.organigramaVisible = true;
  }

  cambiarVista(vista: 'Activos' | 'Todos' | 'Inactivos'): void {
    if (this.vistaActual === vista) return;
    this.vistaActual = vista;
    this.cargarDepartamentos();
  }

  // Selección de filas
  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.departamentos.forEach((d) => this.selectedIds.add(d.id));
    } else {
      this.selectedIds.clear();
    }
  }

  get isAllSelected(): boolean {
    return (
      this.departamentos.length > 0 &&
      this.departamentos.every((d) => this.selectedIds.has(d.id))
    );
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.departamentos.filter((d) =>
      this.selectedIds.has(d.id)
    ).length;
    return selectedCount > 0 && selectedCount < this.departamentos.length;
  }

  // Modal Crear / Editar
  abrirModalCrear(): void {
    this.modalModo = 'crear';
    this.departamentoSeleccionado = undefined;
    this.deptoForm.reset({
      id: '',
      nombre: '',
      descripcion: '',
      activo: true,
    });
    this.modalVisible = true;
  }

  abrirModalEditar(depto: DepartamentoDto): void {
    this.modalModo = 'editar';
    this.departamentoSeleccionado = depto;
    this.deptoForm.setValue({
      id: depto.id,
      nombre: depto.nombre,
      descripcion: depto.descripcion || '',
      activo: depto.activo,
    });
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.saving = false;
  }

  guardar(): void {
    if (this.deptoForm.invalid) {
      Object.values(this.deptoForm.controls).forEach((c) => {
        if (c.invalid) {
          c.markAsDirty();
          c.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const formVal = this.deptoForm.value;
    this.saving = true;

    if (this.modalModo === 'crear') {
      this.departamentoService
        .crearDepartamento({
          nombre: formVal.nombre!,
          descripcion: formVal.descripcion || undefined,
        })
        .subscribe({
          next: () => {
            this.message.success('Departamento creado exitosamente.');
            this.cerrarModal();
            this.cargarDepartamentos();
          },
          error: () => {
            this.saving = false;
            // Manejado por errorInterceptor con notificación lateral derecha
            this.cdr.markForCheck();
          },
        });
    } else {
      this.departamentoService
        .actualizarDepartamento(formVal.id!, {
          nombre: formVal.nombre!,
          descripcion: formVal.descripcion || undefined,
          activo: formVal.activo ?? true,
        })
        .subscribe({
          next: () => {
            this.message.success('Departamento actualizado exitosamente.');
            this.cerrarModal();
            this.cargarDepartamentos();
          },
          error: () => {
            this.saving = false;
            // Manejado por errorInterceptor con notificación lateral derecha
            this.cdr.markForCheck();
          },
        });
    }
  }

  toggleEstado(depto: DepartamentoDto): void {
    const nuevoEstado = !depto.activo;
    const accionTexto = nuevoEstado ? 'activar' : 'desactivar';

    this.modal.confirm({
      nzTitle: `¿Desea ${accionTexto} el departamento?`,
      nzContent: `El departamento "${depto.nombre}" pasará a estado ${nuevoEstado ? 'Activo' : 'Inactivo'}.`,
      nzOkText: 'Confirmar',
      nzCancelText: 'Cancelar',
      nzOnOk: () => {
        this.departamentoService.cambiarEstado(depto.id, nuevoEstado).subscribe({
          next: () => {
            this.message.success(`Departamento ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`);
            this.cargarDepartamentos();
          },
          error: () => {
            // Manejado por errorInterceptor con notificación lateral derecha
          },
        });
      },
    });
  }

  irACargos(departamentoId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/rrhh/cargos'], { queryParams: { departamentoId } });
  }

  confirmarEliminar(depto: DepartamentoDto): void {
    if (depto.totalEmpleados > 0) {
      this.modal.warning({
        nzTitle: 'No se puede eliminar',
        nzContent: `El departamento "${depto.nombre}" tiene ${depto.totalEmpleados} colaborador(es) asignado(s). Le sugerimos desactivarlo en su lugar.`,
        nzOkText: 'Entendido',
      });
      return;
    }

    this.modal.confirm({
      nzTitle: '¿Eliminar departamento permanentemente?',
      nzContent: `¿Está seguro de que desea eliminar el departamento "${depto.nombre}"? Esta acción no se puede deshacer.`,
      nzOkText: 'Sí, eliminar',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => {
        this.departamentoService.eliminarDepartamento(depto.id).subscribe({
          next: () => {
            this.message.success('Departamento eliminado exitosamente.');
            this.cargarDepartamentos();
          },
          error: () => {
            // Manejado por errorInterceptor con notificación lateral derecha
          },
        });
      },
    });
  }

  exportarCsv(): void {
    if (!this.departamentos.length) {
      this.message.warning('No hay datos para exportar.');
      return;
    }

    const headers = ['Nombre', 'Descripción', 'Cargos', 'Colaboradores', 'Estado'];
    const rows = this.departamentos.map((d) => [
      `"${d.nombre.replace(/"/g, '""')}"`,
      `"${(d.descripcion || '').replace(/"/g, '""')}"`,
      d.totalCargos,
      d.totalEmpleados,
      d.activo ? 'Activo' : 'Inactivo',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Departamentos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.message.success('Archivo CSV exportado exitosamente.');
  }
}
