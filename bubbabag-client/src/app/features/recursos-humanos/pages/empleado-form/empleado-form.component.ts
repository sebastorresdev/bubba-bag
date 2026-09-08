import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  DarDeBajaRequest,
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
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDividerModule } from 'ng-zorro-antd/divider';
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
    NzTabsModule,
    NzModalModule,
    NzDividerModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './empleado-form.html',
  styleUrl: './empleado-form.component.css',
})
export class EmpleadoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private empleadoService = inject(EmpleadoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  bajaForm!: FormGroup;
  empleadoId: string | null = null;
  empleadoActual?: EmpleadoDto;
  isEdit = false;
  loading = false;
  loadingCatalogos = true;
  loadingBaja = false;
  loadingReactivar = false;
  isModalBajaVisible = false;
  selectedTabIndex = 0;
  fotoPreview: string | null = null;

  // Listas de catálogos dinámicos
  catalogos?: CatalogosRrhhDto;
  tiposDocumento: string[] = ['DNI', 'Carnet de Extranjería', 'Pasaporte'];
  departamentos: DepartamentoCatalogoDto[] = [];
  cargosFiltrados: CargoCatalogoDto[] = [];
  tiposContrato: string[] = [];
  regimenesPensionarios: string[] = [];
  entidadesFinancieras: string[] = [];
  estados: EstadoEmpleadoCatalogoDto[] = [];
  motivosCese: string[] = [];

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.empleadoId = id;
        this.isEdit = true;
        this.cargarEmpleado();
      } else {
        this.empleadoId = null;
        this.isEdit = false;
        this.empleadoActual = undefined;
        this.initForm();
      }
      this.cdr.markForCheck();
    });
  }

  initForm(): void {
    this.fotoPreview = null;
    this.form = this.fb.group({
      // Básicos
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      tipoDocumento: ['DNI', [Validators.required]],
      numeroDocumento: ['', [Validators.required]],
      estado: ['Activo'],
      fotoUrl: [null],

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

    this.bajaForm = this.fb.group({
      fechaCese: [new Date(), [Validators.required]],
      motivoCese: [null, [Validators.required]],
      observacionesCese: [''],
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
        this.motivosCese = cat.motivosCese || [];
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
        this.fotoPreview = empleado.fotoUrl || null;
        this.form.patchValue({
          ...empleado,
        });
        if (empleado.estado === 'Cesado') {
          this.form.disable();
        } else {
          this.form.enable();
        }
        if (empleado.departamentoId) {
          this.onDepartamentoChange(empleado.departamentoId, false);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/rrhh/empleados']);
      },
    });
  }

  get isCesado(): boolean {
    return this.empleadoActual?.estado === 'Cesado';
  }

  get departamentoSeleccionadoNombre(): string {
    const id = this.form?.get('departamentoId')?.value;
    if (!id) return this.empleadoActual?.departamentoNombre || '';
    return this.departamentos.find((d) => d.id === id)?.nombre || this.empleadoActual?.departamentoNombre || '';
  }

  get cargoSeleccionadoNombre(): string {
    const id = this.form?.get('cargoId')?.value;
    if (!id) return this.empleadoActual?.cargoNombre || '';
    const fromList = this.cargosFiltrados.find((c) => c.id === id)?.nombre;
    if (fromList) return fromList;
    for (const d of this.departamentos) {
      const c = d.cargos?.find((x) => x.id === id);
      if (c) return c.nombre;
    }
    return this.empleadoActual?.cargoNombre || '';
  }

  get emailEmpleado(): string {
    return this.form?.get('email')?.value || this.empleadoActual?.email || '';
  }

  get telefonoEmpleado(): string {
    return this.form?.get('telefono')?.value || this.empleadoActual?.telefono || '';
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
        tooltip: this.isCesado ? 'Colaborador cesado (solo lectura)' : 'Guardar cambios del colaborador',
        disabled: this.loading || this.isCesado,
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y cerrar',
        icon: 'check',
        tooltip: this.isCesado ? 'Colaborador cesado (solo lectura)' : 'Guardar cambios y volver a la lista',
        disabled: this.loading || this.isCesado,
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

      if (this.empleadoActual?.estado !== 'Cesado') {
        items.push({
          key: 'baja',
          label: 'Dar de baja',
          icon: 'user-delete',
          tooltip: 'Registrar la baja o cese del colaborador',
          danger: true,
          disabled: this.loading || this.loadingBaja,
          execute: () => this.abrirModalBaja(),
        });
      } else {
        items.push({
          key: 'reactivar',
          label: 'Reactivar colaborador',
          icon: 'check-circle',
          tooltip: 'Reactivar colaborador a estado Activo',
          disabled: this.loading || this.loadingReactivar,
          execute: () => this.reactivarColaborador(),
        });
      }

      items.push({
        key: 'sep-2',
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
    if (this.isCesado) {
      this.message.warning('No se puede modificar la información de un colaborador en estado Cesado. Debe reactivarlo primero.');
      return;
    }

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

    // Formatear fechas estrictamente a 'yyyy-MM-dd' para compatibilidad con DateOnly de .NET
    formValue.fechaNacimiento = this.formatDateOnly(formValue.fechaNacimiento);
    formValue.fechaIngreso = this.formatDateOnly(formValue.fechaIngreso);

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
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      const command: CrearEmpleadoCommand = formValue;

      this.empleadoService.crearEmpleado(command).subscribe({
        next: (res) => {
          this.loading = false;
          this.message.success('Empleado registrado correctamente');
          const nuevoId = typeof res === 'string' ? res : (res as any)?.id || (res as any)?.value;
          if (cerrar) {
            this.volver();
          } else if (nuevoId) {
            this.empleadoId = nuevoId;
            this.isEdit = true;
            this.router.navigate(['/rrhh/empleados/editar', nuevoId]);
            this.cargarEmpleado();
          } else {
            this.volver();
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  abrirModalBaja(): void {
    this.bajaForm.reset({
      fechaCese: new Date(),
      motivoCese: this.motivosCese.length > 0 ? this.motivosCese[0] : null,
      observacionesCese: '',
    });
    this.isModalBajaVisible = true;
  }

  cerrarModalBaja(): void {
    this.isModalBajaVisible = false;
  }

  confirmarBaja(): void {
    if (this.bajaForm.invalid) {
      Object.values(this.bajaForm.controls).forEach((ctrl) => {
        if (ctrl.invalid) {
          ctrl.markAsDirty();
          ctrl.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Por favor completa la fecha y motivo de cese');
      return;
    }

    if (!this.empleadoId) return;

    this.loadingBaja = true;
    const val = this.bajaForm.value;
    const fechaStr = this.formatDateOnly(val.fechaCese) || new Date().toISOString().split('T')[0];

    const request: DarDeBajaRequest = {
      fechaCese: fechaStr,
      motivoCese: val.motivoCese,
      observacionesCese: val.observacionesCese || null,
    };

    this.empleadoService.darDeBaja(this.empleadoId, request).subscribe({
      next: () => {
        this.loadingBaja = false;
        this.isModalBajaVisible = false;
        this.message.success('Colaborador dado de baja exitosamente');
        this.cargarEmpleado();
      },
      error: () => {
        this.loadingBaja = false;
      },
    });
  }

  reactivarColaborador(): void {
    if (!this.empleadoId) return;
    this.loadingReactivar = true;
    this.empleadoService.reactivar(this.empleadoId).subscribe({
      next: () => {
        this.loadingReactivar = false;
        this.message.success('Colaborador reactivado a estado Activo exitosamente');
        this.cargarEmpleado();
      },
      error: () => {
        this.loadingReactivar = false;
      },
    });
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.message.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP)');
      input.value = '';
      return;
    }

    // Validar tamaño máximo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.message.error('La imagen seleccionada es demasiado pesada (máximo 5MB)');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Optimizar / redimensionar a máx 400x400 para avatar ligero y nítido
      this.optimizarImagen(result, 400, 400, 0.85, (optimizedBase64) => {
        this.fotoPreview = optimizedBase64;
        this.form.get('fotoUrl')?.setValue(optimizedBase64);
        this.form.get('fotoUrl')?.markAsDirty();
        this.message.success('Foto de perfil cargada. Recuerda guardar los cambios.');
        input.value = '';
      });
    };
    reader.onerror = () => {
      this.message.error('Ocurrió un error al leer la imagen seleccionada');
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  eliminarFoto(): void {
    this.fotoPreview = null;
    this.form.get('fotoUrl')?.setValue(null);
    this.form.get('fotoUrl')?.markAsDirty();
    this.message.info('Foto de perfil eliminada. Recuerda guardar los cambios.');
  }

  private optimizarImagen(
    base64Str: string,
    maxWidth: number,
    maxHeight: number,
    quality: number,
    callback: (result: string) => void
  ): void {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', quality));
      } else {
        callback(base64Str);
      }
    };
    img.onerror = () => {
      callback(base64Str);
    };
  }

  private formatDateOnly(date: any): string | null {
    if (!date) return null;
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    if (date instanceof Date && !isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return null;
  }
}

