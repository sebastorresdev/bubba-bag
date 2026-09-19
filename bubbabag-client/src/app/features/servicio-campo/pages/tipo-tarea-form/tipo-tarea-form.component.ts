import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// NG-ZORRO Modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';

// Shared Components & Services
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar/command-bar.component';
import { ServicioCampoService } from '../../services/servicio-campo.service';
import { ClienteService } from '../../../crm/services/cliente.service';
import { ClienteListadoItemDto } from '../../../crm/models/cliente.model';
import {
  TipoTareaServicioDto,
  CrearTipoTareaServicioCommand,
  ActualizarTipoTareaServicioRequest,
} from '../../models/servicio-campo-catalogos.model';

@Component({
  selector: 'app-tipo-tarea-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSwitchModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    NzSpinModule,
    NzAvatarModule,
    NzDividerModule,
    NzTagModule,
    NzModalModule,
    CommandBarComponent,
  ],
  templateUrl: './tipo-tarea-form.html',
  styleUrl: './tipo-tarea-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipoTareaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private clienteService = inject(ClienteService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEdit = false;
  tareaId: string | null = null;
  tareaActual?: TipoTareaServicioDto;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  clientesFacturables: ClienteListadoItemDto[] = [];

  ngOnInit(): void {
    this.initForm();
    this.cargarClientesFacturables();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.tareaId = id;
      this.cargarTarea(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      codigoTarea: ['', [Validators.required, Validators.maxLength(30)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      esOperacionInterna: [false],
      clienteFacturacionId: [null, [Validators.required]],
      duracionEstimadaMinutos: [60, [Validators.required, Validators.min(1)]],
      activo: [true],
    });

    this.form.get('esOperacionInterna')?.valueChanges.subscribe((val) => {
      this.onOperacionInternaChange(!!val);
    });
  }

  private onOperacionInternaChange(esInterna: boolean): void {
    const clienteCtrl = this.form.get('clienteFacturacionId');
    if (esInterna) {
      clienteCtrl?.clearValidators();
      clienteCtrl?.setValue(null);
      clienteCtrl?.disable();
    } else {
      clienteCtrl?.setValidators([Validators.required]);
      clienteCtrl?.enable();
    }
    clienteCtrl?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  private cargarClientesFacturables(): void {
    this.clienteService.getClientes(undefined, true).subscribe({
      next: (clientes) => {
        this.clientesFacturables = clientes.filter((c) => c.esClienteFacturacion);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar clientes facturables:', err);
      },
    });
  }

  private cargarTarea(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.servicioCampoService.getTipoTareaPorId(id).subscribe({
      next: (tarea) => {
        this.tareaActual = tarea;
        const esInterna = !tarea.clienteFacturacionId;
        this.form.patchValue({
          codigoTarea: tarea.codigoTarea,
          nombre: tarea.nombre,
          esOperacionInterna: esInterna,
          clienteFacturacionId: tarea.clienteFacturacionId,
          duracionEstimadaMinutos: tarea.duracionEstimadaMinutos,
          activo: tarea.activo,
        });

        this.onOperacionInternaChange(esInterna);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar tipo de tarea:', err);
        this.message.error('No se pudo cargar el tipo de tarea.');
        this.loading = false;
        this.router.navigate(['/servicio-campo/tipos-tarea']);
      },
    });
  }

  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar cambios del tipo de tarea',
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
      { key: 'd1', isDivider: true },
      {
        key: 'discard',
        label: 'Descartar',
        icon: 'close',
        iconColor: 'neutral',
        tooltip: 'Descartar cambios y volver',
        disabled: this.saving,
        execute: () => this.volver(),
      },
      { key: 'd2', isDivider: true },
      {
        key: 'reload',
        label: 'Actualizar',
        icon: 'reload',
        iconColor: 'neutral',
        tooltip: 'Recargar datos del formulario',
        disabled: this.loading,
        execute: () => {
          if (this.tareaId) this.cargarTarea(this.tareaId);
        },
      },
    ];
  }

  farItems: CommandBarItem[] = [];

  guardar(cerrarAlFinal: boolean): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      this.message.warning('Por favor completa todos los campos requeridos marcados con (*).');
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const val = this.form.getRawValue();

    if (this.isEdit && this.tareaId) {
      const request: ActualizarTipoTareaServicioRequest = {
        nombre: val.nombre.trim(),
        duracionEstimadaMinutos: val.duracionEstimadaMinutos,
        clienteFacturacionId: val.esOperacionInterna ? null : val.clienteFacturacionId,
      };

      this.servicioCampoService.actualizarTipoTarea(this.tareaId, request).subscribe({
        next: () => {
          this.saving = false;
          this.message.success('Tipo de tarea actualizado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else if (this.tareaId) {
            this.cargarTarea(this.tareaId);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          console.error('Error al actualizar tipo de tarea:', err);
          this.message.error(err?.error?.message || 'Error al actualizar el tipo de tarea.');
        },
      });
    } else {
      const command: CrearTipoTareaServicioCommand = {
        codigoTarea: val.codigoTarea.trim().toUpperCase(),
        nombre: val.nombre.trim(),
        clienteFacturacionId: val.esOperacionInterna ? null : val.clienteFacturacionId,
        duracionEstimadaMinutos: val.duracionEstimadaMinutos,
      };

      this.servicioCampoService.crearTipoTarea(command).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success('Tipo de tarea creado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.router.navigate(['/servicio-campo/tipos-tarea/editar', res.id]);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          console.error('Error al crear tipo de tarea:', err);
          this.message.error(err?.error?.message || 'Error al crear el tipo de tarea.');
        },
      });
    }
  }

  volver(): void {
    this.router.navigate(['/servicio-campo/tipos-tarea']);
  }

  getClienteNombre(): string {
    if (this.form.get('esOperacionInterna')?.value) {
      return 'OPERACIÓN INTERNA';
    }
    const id = this.form.get('clienteFacturacionId')?.value;
    const cli = this.clientesFacturables.find((c) => c.id === id);
    return cli ? cli.nombreCompletoODenominacion : 'SIN CLIENTE ASIGNADO';
  }

  getIniciales(nombre?: string): string {
    if (!nombre || !nombre.trim()) return 'TT';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.trim().substring(0, 2).toUpperCase();
  }
}
