import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmpleadoService } from '../../services/empleado.service';
import {
  ActualizarEmpleadoCommand,
  CrearEmpleadoCommand,
  CatalogosRrhhDto,
  DepartamentoCatalogoDto,
  CargoCatalogoDto,
  EstadoEmpleadoCatalogoDto,
  EmpleadoDto,
} from '../../models/empleado.model';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-empleado-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSwitchModule,
    NzIconModule,
    NzTagModule,
    NzAlertModule,
    NzCardModule,
    NzTooltipModule,
    NzAvatarModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './empleado-form.html',
  styleUrl: './empleado-form.component.css',
})
export class EmpleadoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private empleadoService = inject(EmpleadoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);

  form!: FormGroup;
  empleadoId: string | null = null;
  empleadoActual?: EmpleadoDto;
  isEdit = false;
  loading = false;
  loadingCatalogos = true;

  // Listas de catálogos dinámicos
  catalogos?: CatalogosRrhhDto;
  tiposDocumento: string[] = ['DNI', 'Carnet de Extranjería', 'Pasaporte'];
  departamentos: DepartamentoCatalogoDto[] = [];
  cargosFiltrados: CargoCatalogoDto[] = [];
  tiposContrato: string[] = [];
  regimenesPensionarios: string[] = [];
  entidadesFinancieras: string[] = [];
  estados: EstadoEmpleadoCatalogoDto[] = [];

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();

    this.empleadoId = this.route.snapshot.paramMap.get('id');
    if (this.empleadoId) {
      this.isEdit = true;
      this.cargarEmpleado();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      // Básicos
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      tipoDocumento: ['DNI', [Validators.required]],
      numeroDocumento: ['', [Validators.required]],
      estado: ['Activo'],

      // Contacto
      email: ['', [Validators.email]],
      telefono: [''],
      fechaNacimiento: [null],
      direccion: [''],

      // Laborales y Organizacionales
      fechaIngreso: [null],
      departamentoId: [null],
      cargoId: [null],
      tipoContrato: [''],

      // Planilla
      salarioBase: [null],
      monedaSalario: ['PEN'],
      tieneAsignacionFamiliar: [false],
      regimenPensionario: [''],
      cuspp: [''],

      // Bancarios
      entidadFinanciera: [''],
      cuentaBancaria: [''],
      cuentaInterbancaria: [''],
    });
  }

  cargarCatalogos(): void {
    this.loadingCatalogos = true;
    this.empleadoService.getCatalogos().subscribe({
      next: (cat) => {
        this.catalogos = cat;
        this.tiposDocumento = cat.tiposDocumento;
        this.departamentos = cat.departamentos;
        this.tiposContrato = cat.tiposContrato;
        this.regimenesPensionarios = cat.regimenesPensionarios;
        this.entidadesFinancieras = cat.entidadesFinancieras;
        this.estados = cat.estados;
        this.loadingCatalogos = false;

        // Si ya hay un departamentoId en el formulario (por carga en edición), poblar cargos
        const currentDeptoId = this.form.get('departamentoId')?.value;
        if (currentDeptoId) {
          this.onDepartamentoChange(currentDeptoId, false);
        }
      },
      error: () => {
        this.loadingCatalogos = false;
      },
    });
  }

  onDepartamentoChange(departamentoId: string | null, resetCargo: boolean = true): void {
    if (!departamentoId) {
      this.cargosFiltrados = [];
      if (resetCargo) {
        this.form.get('cargoId')?.setValue(null);
      }
      return;
    }

    const depto = this.departamentos.find((d) => d.id === departamentoId);
    this.cargosFiltrados = depto ? depto.cargos : [];

    if (resetCargo) {
      const currentCargoId = this.form.get('cargoId')?.value;
      if (currentCargoId && !this.cargosFiltrados.some((c) => c.id === currentCargoId)) {
        this.form.get('cargoId')?.setValue(null);
      }
    }
  }

  cargarEmpleado(): void {
    this.loading = true;
    this.empleadoService.getEmpleado(this.empleadoId!).subscribe({
      next: (empleado) => {
        this.empleadoActual = empleado;
        this.form.patchValue({
          ...empleado,
        });
        if (empleado.departamentoId) {
          this.onDepartamentoChange(empleado.departamentoId, false);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/rrhh/empleados']);
      },
    });
  }

  get departamentoSeleccionadoNombre(): string {
    const id = this.form?.get('departamentoId')?.value;
    if (!id) return '';
    return this.departamentos.find((d) => d.id === id)?.nombre || '';
  }

  get cargoSeleccionadoNombre(): string {
    const id = this.form?.get('cargoId')?.value;
    if (!id) return '';
    return this.cargosFiltrados.find((c) => c.id === id)?.nombre || '';
  }

  getEstadoDotClass(estado?: string): string {
    switch (estado) {
      case 'Activo':
        return 'd365-dot-active';
      case 'Vacaciones':
        return 'd365-dot-warning';
      case 'Licencia':
        return 'd365-dot-info';
      case 'Suspendido':
        return 'd365-dot-purple';
      case 'Cesado':
        return 'd365-dot-danger';
      default:
        return 'd365-dot-default';
    }
  }

  volver(): void {
    this.router.navigate(['/rrhh/empleados']);
  }

  recargar(): void {
    if (this.empleadoId) {
      this.cargarEmpleado();
    } else {
      this.initForm();
    }
  }

  get commandBarItems(): CommandBarItem[] {
    const items: CommandBarItem[] = [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        tooltip: 'Guardar cambios del colaborador',
        disabled: this.loading,
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y cerrar',
        icon: 'check',
        tooltip: 'Guardar cambios y volver a la lista',
        disabled: this.loading,
        execute: () => this.guardar(true),
      },
      {
        key: 'discard',
        label: 'Descartar',
        icon: 'close',
        tooltip: 'Descartar cambios y volver',
        execute: () => this.volver(),
      },
    ];

    if (this.isEdit) {
      items.push({
        key: 'sep-1',
        label: '',
        isDivider: true,
      });

      items.push({
        key: 'new',
        label: 'Crear nuevo',
        icon: 'plus',
        tooltip: 'Registrar un nuevo colaborador',
        execute: () => this.router.navigate(['/rrhh/empleados/nuevo']),
      });
    }

    return items;
  }

  get farItems(): CommandBarItem[] {
    return [
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar datos del colaborador',
        disabled: this.loading,
        execute: () => this.recargar(),
      },
    ];
  }

  guardar(cerrar: boolean = false): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Por favor completa los campos obligatorios requeridos');
      return;
    }

    this.loading = true;
    const formValue = { ...this.form.value };
    // Normalizar campos opcionales vacíos a null
    Object.keys(formValue).forEach((key) => {
      if (typeof formValue[key] === 'string' && formValue[key].trim() === '') {
        formValue[key] = null;
      }
    });

    if (this.isEdit) {
      const command: ActualizarEmpleadoCommand = {
        ...formValue,
        id: this.empleadoId!,
      };

      this.empleadoService.actualizarEmpleado(this.empleadoId!, command).subscribe({
        next: () => {
          this.loading = false;
          this.message.success('Empleado actualizado correctamente');
          if (cerrar) {
            this.volver();
          } else {
            this.cargarEmpleado();
          }
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      const command: CrearEmpleadoCommand = formValue;

      this.empleadoService.crearEmpleado(command).subscribe({
        next: (res) => {
          this.loading = false;
          this.message.success('Empleado registrado correctamente');
          if (cerrar) {
            this.volver();
          } else if (res) {
            this.router.navigate(['/rrhh/empleados', res, 'editar']);
          } else {
            this.volver();
          }
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }
}
