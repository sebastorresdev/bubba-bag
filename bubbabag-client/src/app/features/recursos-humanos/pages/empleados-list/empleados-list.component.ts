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
import { EmpleadoService } from '../../services/empleado.service';
import {
  EmpleadoDto,
  CatalogosRrhhDto,
  DepartamentoCatalogoDto,
  DarDeBajaRequest,
} from '../../models/empleado.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

@Component({
  selector: 'app-empleados-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzPopconfirmModule,
    NzInputModule,
    NzTagModule,
    NzSelectModule,
    NzModalModule,
    NzDatePickerModule,
    NzTooltipModule,
    NzCardModule,
    NzEmptyModule,
    NzAvatarModule,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './empleados-list.html',
})
export class EmpleadosListComponent implements OnInit {
  private empleadoService = inject(EmpleadoService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  empleados: EmpleadoDto[] = [];
  loading = false;

  // Filtros
  searchTerm = '';
  filtroEstado = 'Todos';
  filtroDepartamento: string | null = null;

  // Catálogos
  catalogos?: CatalogosRrhhDto;
  departamentos: DepartamentoCatalogoDto[] = [];
  motivosCese: string[] = [];

  // Modal de Cese / Baja
  modalBajaVisible = false;
  guardandoBaja = false;
  empleadoParaBaja: EmpleadoDto | null = null;
  fechaCese: Date = new Date();
  motivoCeseSeleccionado = '';
  observacionesCese = '';

  ngOnInit() {
    this.cargarCatalogos();
    this.cargarEmpleados();
  }

  cargarCatalogos() {
    this.empleadoService.getCatalogos().subscribe({
      next: (cat) => {
        this.catalogos = cat;
        this.departamentos = cat.departamentos;
        this.motivosCese = cat.motivosCese;
        if (this.motivosCese.length > 0) {
          this.motivoCeseSeleccionado = this.motivosCese[0];
        }
        this.cdr.detectChanges();
      },
    });
  }

  cargarEmpleados() {
    this.loading = true;
    this.empleadoService
      .getEmpleados(this.searchTerm, this.filtroEstado, this.filtroDepartamento || undefined)
      .subscribe({
        next: (data) => {
          this.empleados = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  buscar() {
    this.cargarEmpleados();
  }

  limpiarFiltros() {
    this.searchTerm = '';
    this.filtroEstado = 'Todos';
    this.filtroDepartamento = null;
    this.cargarEmpleados();
  }

  editar(id: string) {
    this.router.navigate(['/rrhh/empleados/editar', id]);
  }

  // --- Flujo de Baja / Cese ---
  abrirModalBaja(empleado: EmpleadoDto) {
    this.empleadoParaBaja = empleado;
    this.fechaCese = new Date();
    this.motivoCeseSeleccionado = this.motivosCese.length > 0 ? this.motivosCese[0] : '';
    this.observacionesCese = '';
    this.modalBajaVisible = true;
  }

  cerrarModalBaja() {
    this.modalBajaVisible = false;
    this.empleadoParaBaja = null;
  }

  confirmarBaja() {
    if (!this.empleadoParaBaja) return;
    if (!this.motivoCeseSeleccionado) {
      this.message.warning('Por favor selecciona el motivo de cese.');
      return;
    }

    this.guardandoBaja = true;
    // Formato YYYY-MM-DD
    const fechaFormatted = this.fechaCese.toISOString().split('T')[0];

    const request: DarDeBajaRequest = {
      fechaCese: fechaFormatted,
      motivoCese: this.motivoCeseSeleccionado,
      observacionesCese: this.observacionesCese ? this.observacionesCese.trim() : null,
    };

    this.empleadoService.darDeBaja(this.empleadoParaBaja.id, request).subscribe({
      next: () => {
        this.message.success('Colaborador dado de baja correctamente');
        this.guardandoBaja = false;
        this.cerrarModalBaja();
        this.cargarEmpleados();
      },
      error: () => {
        this.guardandoBaja = false;
      },
    });
  }

  // --- Flujo de Reactivación ---
  reactivar(id: string) {
    this.empleadoService.reactivar(id).subscribe({
      next: () => {
        this.message.success('Colaborador reactivado a estado Activo exitosamente');
        this.cargarEmpleados();
      },
      error: () => {
        // Manejado por interceptor global
      },
    });
  }

  eliminar(id: string) {
    this.empleadoService.eliminarEmpleado(id).subscribe({
      next: () => {
        this.message.success('Empleado eliminado correctamente');
        this.cargarEmpleados();
      },
      error: () => {
        // Manejado por el interceptor global
      },
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Activo':
        return 'success';
      case 'Vacaciones':
        return 'processing';
      case 'Licencia':
        return 'warning';
      case 'Suspendido':
        return 'purple';
      case 'Cesado':
        return 'error';
      default:
        return 'default';
    }
  }
}
