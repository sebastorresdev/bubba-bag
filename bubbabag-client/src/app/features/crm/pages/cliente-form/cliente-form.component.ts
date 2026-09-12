import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import {
  ClienteDetalleDto,
  CrearClienteCommand,
  ActualizarClienteRequest,
} from '../../models/cliente.model';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzSwitchModule,
    NzIconModule,
    NzTagModule,
    NzCardModule,
    NzTooltipModule,
    NzAvatarModule,
    NzTabsModule,
    NzRadioModule,
    NzInputNumberModule,
    NzDividerModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.component.css',
})
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  clienteId: string | null = null;
  clienteActual?: ClienteDetalleDto;
  isEdit = false;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  tiposDocumento = [
    { label: 'DNI (Documento Nacional de Identidad)', value: 'DNI' },
    { label: 'RUC (Registro Único de Contribuyentes)', value: 'RUC' },
    { label: 'Carnet de Extranjería (CE)', value: 'CE' },
    { label: 'Pasaporte', value: 'PASAPORTE' },
  ];

  departamentosSugeridos = ['Lima', 'Arequipa', 'Cusco', 'La Libertad', 'Piura', 'Junín', 'Lambayeque', 'Áncash', 'Ica', 'San Martín'];

  get emailCliente(): string {
    return this.form?.get('email')?.value || '';
  }

  get telefonoCliente(): string {
    return this.form?.get('telefonoPrincipal')?.value || '';
  }

  commandBarItems: CommandBarItem[] = [];
  commandBarFarItems: CommandBarItem[] = [];

  ngOnInit(): void {
    this.initForm();
    this.clienteId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.clienteId;

    this.updateCommandBar();

    if (this.isEdit && this.clienteId) {
      this.cargarCliente(this.clienteId);
    } else {
      // Autogenerar código sugerido si es nuevo
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      this.form.patchValue({
        codigoCliente: `CLI-${new Date().getFullYear()}-${randomSuffix}`,
      });
    }

    // Escuchar cambios en tipoPersona para adaptar validaciones
    this.form.get('tipoPersona')?.valueChanges.subscribe((tipo) => {
      this.actualizarValidacionesPorTipo(tipo);
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      codigoCliente: ['', [Validators.required, Validators.maxLength(30)]],
      tipoPersona: ['NATURAL', [Validators.required]],
      tipoDocumento: ['DNI', [Validators.required]],
      documentoIdentidad: ['', [Validators.required, Validators.maxLength(20)]],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.maxLength(100)]],
      razonSocial: ['', [Validators.maxLength(150)]],
      telefonoPrincipal: ['', [Validators.required, Validators.maxLength(20)]],
      telefonoSecundario: ['', [Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      direccion: ['', [Validators.required, Validators.maxLength(250)]],
      distrito: ['Lima', [Validators.required, Validators.maxLength(80)]],
      provincia: ['Lima', [Validators.required, Validators.maxLength(80)]],
      departamento: ['Lima', [Validators.required, Validators.maxLength(80)]],
      referenciaUbicacion: ['', [Validators.maxLength(250)]],
      coordenadaLat: [null],
      coordenadaLng: [null],
      esClienteFacturacion: [false],
      esClienteServicio: [true],
      activo: [true],
    });
  }

  private actualizarValidacionesPorTipo(tipo: 'NATURAL' | 'JURIDICA'): void {
    const nombresCtrl = this.form.get('nombres');
    const razonSocialCtrl = this.form.get('razonSocial');
    const tipoDocCtrl = this.form.get('tipoDocumento');

    if (tipo === 'JURIDICA') {
      razonSocialCtrl?.setValidators([Validators.required, Validators.maxLength(150)]);
      nombresCtrl?.clearValidators();
      if (tipoDocCtrl?.value === 'DNI') {
        tipoDocCtrl.setValue('RUC');
      }
    } else {
      nombresCtrl?.setValidators([Validators.required, Validators.maxLength(100)]);
      razonSocialCtrl?.clearValidators();
      if (tipoDocCtrl?.value === 'RUC') {
        tipoDocCtrl.setValue('DNI');
      }
    }

    nombresCtrl?.updateValueAndValidity();
    razonSocialCtrl?.updateValueAndValidity();
  }

  recargar(): void {
    if (this.clienteId) {
      this.cargarCliente(this.clienteId);
    } else {
      this.initForm();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      this.form.patchValue({
        codigoCliente: `CLI-${new Date().getFullYear()}-${randomSuffix}`,
      });
    }
  }

  private updateCommandBar(): void {
    this.commandBarItems = [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar cambios del cliente',
        disabled: this.saving,
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y cerrar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar cambios y volver a la lista',
        disabled: this.saving,
        execute: () => this.guardar(true),
      },
      {
        key: 'discard',
        label: 'Descartar',
        icon: 'close',
        iconColor: 'neutral',
        tooltip: 'Descartar cambios y volver',
        execute: () => this.volver(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        iconColor: 'neutral',
        tooltip: 'Recargar datos del formulario',
        disabled: this.loading,
        execute: () => this.recargar(),
      },
    ];

    this.commandBarFarItems = [
      {
        key: 'share',
        label: 'Compartir',
        icon: 'export',
        appearance: 'primary',
        tooltip: 'Compartir ficha del cliente',
        execute: () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            this.message.success('Enlace del cliente copiado al portapapeles');
          }
        },
      },
    ];

    if (this.isEdit && this.clienteActual) {
      this.commandBarFarItems.unshift({
        key: 'toggle-estado',
        label: this.clienteActual.activo ? 'Dar de baja' : 'Activar cliente',
        icon: this.clienteActual.activo ? 'user-delete' : 'check-circle',
        danger: this.clienteActual.activo,
        iconColor: this.clienteActual.activo ? 'danger' : 'success',
        tooltip: this.clienteActual.activo ? 'Desactivar cliente' : 'Reactivar cliente',
        execute: () => this.toggleEstado(),
      });
    }
  }

  private cargarCliente(id: string): void {
    this.loading = true;
    this.clienteService.getClientePorId(id).subscribe({
      next: (c) => {
        this.clienteActual = c;
        this.form.patchValue({
          codigoCliente: c.codigoCliente,
          tipoPersona: c.tipoPersona,
          tipoDocumento: c.tipoDocumento,
          documentoIdentidad: c.documentoIdentidad,
          nombres: c.nombres,
          apellidos: c.apellidos,
          razonSocial: c.razonSocial,
          telefonoPrincipal: c.telefonoPrincipal,
          telefonoSecundario: c.telefonoSecundario,
          email: c.email,
          direccion: c.direccion,
          distrito: c.distrito,
          provincia: c.provincia,
          departamento: c.departamento,
          referenciaUbicacion: c.referenciaUbicacion,
          coordenadaLat: c.coordenadaLat,
          coordenadaLng: c.coordenadaLng,
          esClienteFacturacion: c.esClienteFacturacion,
          esClienteServicio: c.esClienteServicio,
          activo: c.activo,
        });

        // En edición, el código y documento no deben alterarse para mantener integridad fiscal
        this.form.get('codigoCliente')?.disable();
        this.form.get('tipoPersona')?.disable();
        this.form.get('tipoDocumento')?.disable();
        this.form.get('documentoIdentidad')?.disable();

        this.loading = false;
        this.updateCommandBar();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudo cargar la información del cliente.');
        this.volver();
      },
    });
  }

  guardar(cerrarAlFinal: boolean = true): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((ctrl) => {
        if (ctrl.invalid) {
          ctrl.markAsDirty();
          ctrl.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Por favor completa los campos obligatorios del formulario.');
      return;
    }

    this.saving = true;
    this.updateCommandBar();

    const formVal = this.form.getRawValue();

    if (this.isEdit && this.clienteId) {
      const updateReq: ActualizarClienteRequest = {
        telefonoPrincipal: formVal.telefonoPrincipal,
        direccion: formVal.direccion,
        distrito: formVal.distrito,
        provincia: formVal.provincia,
        departamento: formVal.departamento,
        referenciaUbicacion: formVal.referenciaUbicacion,
        coordenadaLat: formVal.coordenadaLat,
        coordenadaLng: formVal.coordenadaLng,
      };

      this.clienteService.actualizarCliente(this.clienteId, updateReq).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success(res.message || 'Cliente actualizado correctamente.');
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.cargarCliente(this.clienteId!);
          }
        },
        error: (err) => {
          this.saving = false;
          this.updateCommandBar();
          const errorMsg = err?.error?.message || 'Error al actualizar cliente.';
          this.message.error(errorMsg);
        },
      });
    } else {
      const createCmd: CrearClienteCommand = {
        codigoCliente: formVal.codigoCliente,
        documentoIdentidad: formVal.documentoIdentidad,
        nombres: formVal.nombres || '',
        apellidos: formVal.apellidos,
        telefonoPrincipal: formVal.telefonoPrincipal,
        direccion: formVal.direccion,
        distrito: formVal.distrito,
        provincia: formVal.provincia,
        departamento: formVal.departamento,
        esClienteFacturacion: formVal.esClienteFacturacion ?? false,
        esClienteServicio: formVal.esClienteServicio ?? true,
        tipoDocumento: formVal.tipoDocumento,
        tipoPersona: formVal.tipoPersona,
        razonSocial: formVal.razonSocial,
        telefonoSecundario: formVal.telefonoSecundario,
        email: formVal.email,
        referenciaUbicacion: formVal.referenciaUbicacion,
        coordenadaLat: formVal.coordenadaLat,
        coordenadaLng: formVal.coordenadaLng,
      };

      this.clienteService.crearCliente(createCmd).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success(res.message || 'Cliente creado exitosamente.');
          if (cerrarAlFinal) {
            this.volver();
          } else if (res.id) {
            this.router.navigate(['/crm/clientes/editar', res.id]);
          }
        },
        error: (err) => {
          this.saving = false;
          this.updateCommandBar();
          const errorMsg = err?.error?.message || 'Error al registrar cliente.';
          this.message.error(errorMsg);
        },
      });
    }
  }

  toggleEstado(): void {
    if (!this.clienteId || !this.clienteActual) return;
    const nuevo = !this.clienteActual.activo;
    this.clienteService.cambiarEstado(this.clienteId, nuevo).subscribe({
      next: (res) => {
        this.clienteActual!.activo = nuevo;
        this.message.success(res.message || 'Estado actualizado.');
        this.updateCommandBar();
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('No se pudo cambiar el estado.');
      },
    });
  }

  volver(): void {
    this.router.navigate(['/crm/clientes']);
  }

  getIniciales(nombre?: string): string {
    if (!nombre) return 'CL';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }
}
