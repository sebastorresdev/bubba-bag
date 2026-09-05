import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmpleadoService } from '../../services/empleado.service';
import { ActualizarEmpleadoCommand, CrearEmpleadoCommand } from '../../models/empleado.model';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';


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

  ],
  templateUrl: './empleado-form.html'
})
export class EmpleadoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private empleadoService = inject(EmpleadoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);

  form!: FormGroup;
  empleadoId: string | null = null;
  isEdit = false;
  loading = false;

  tiposDocumento = ['DNI', 'CE', 'Pasaporte'];
  estados = ['Activo', 'Inactivo', 'Suspendido'];

  ngOnInit(): void {
    this.initForm();

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
      estado: ['Activo'], // Solo se usará en edición

      // Contacto
      email: ['', [Validators.email]],
      telefono: [''],
      fechaNacimiento: [null],
      direccion: [''],

      // Laborales
      fechaIngreso: [null],
      cargo: [''],
      departamento: [''],
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
      cuentaInterbancaria: ['']
    });
  }

  cargarEmpleado(): void {
    this.loading = true;
    this.empleadoService.getEmpleado(this.empleadoId!).subscribe({
      next: (empleado) => {
        this.form.patchValue({
          ...empleado,
          // Convert string dates to Date objects if needed for nz-date-picker, though strings might work depending on format
        });
        this.loading = false;
      },
      error: () => {
        this.message.error('No se pudo cargar la información del empleado');
        this.router.navigate(['/rrhh/empleados']);
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    if (this.isEdit) {
      const command: ActualizarEmpleadoCommand = {
        ...formValue,
        id: this.empleadoId!
      };

      this.empleadoService.actualizarEmpleado(this.empleadoId!, command).subscribe({
        next: () => {
          this.message.success('Empleado actualizado correctamente');
          this.router.navigate(['/rrhh/empleados']);
        },
        error: (err) => {
          this.loading = false;
          this.message.error(err.error?.error || 'Error al actualizar empleado');
        }
      });
    } else {
      const command: CrearEmpleadoCommand = formValue;

      this.empleadoService.crearEmpleado(command).subscribe({
        next: () => {
          this.message.success('Empleado registrado correctamente');
          this.router.navigate(['/rrhh/empleados']);
        },
        error: (err) => {
          this.loading = false;
          this.message.error(err.error?.error || 'Error al crear empleado');
        }
      });
    }
  }
}
