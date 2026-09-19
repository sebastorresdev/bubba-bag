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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

// Components & Services
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar/command-bar.component';
import { ServicioCampoService } from '../../services/servicio-campo.service';
import { SucursalService } from '../../../configuracion/services/sucursal.service';
import { SucursalDto } from '../../../configuracion/models/sucursal.model';
import {
  TarifaServicioDto,
  TipoTareaServicioDto,
  CrearTarifaServicioCommand,
  ActualizarTarifaServicioRequest,
} from '../../models/servicio-campo-catalogos.model';

@Component({
  selector: 'app-tarifa-servicio-form',
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
  templateUrl: './tarifa-servicio-form.html',
  styleUrl: './tarifa-servicio-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarifaServicioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private sucursalService = inject(SucursalService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEdit = false;
  tarifaId: string | null = null;
  tarifaActual: TarifaServicioDto | null = null;

  loading = false;
  saving = false;
  selectedTabIndex = 0;

  tiposTarea: TipoTareaServicioDto[] = [];
  sucursalesDisponibles: SucursalDto[] = [];
  tipificacionesDisponibles: string[] = [
    'INSTALACION',
    'SERVICIOS TECNICOS',
    'SERVICIOS MENORES',
    'AUDITORIAS',
    'MUDANZA',
    'POSTVENTA',
    'GENERAL',
  ];

  ngOnInit(): void {
    this.initForm();
    this.cargarTiposTarea();
    this.cargarSucursales();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.tarifaId = id;
        this.cargarTarifa(id);
      } else {
        this.isEdit = false;
        this.tarifaId = null;
      }
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      tipoTareaServicioId: [null],
      tipificacion: ['INSTALACION', [Validators.required, Validators.maxLength(100)]],
      codigoServicio: ['', [Validators.required, Validators.maxLength(30)]],
      detalleServicio: ['', [Validators.required, Validators.maxLength(200)]],
      empresaContratante: ['DIRECTV PERU S.R.L.', [Validators.required, Validators.maxLength(100)]],
      sucursal: [''],
      puntos: [1, [Validators.required, Validators.min(0)]],
      fijoBase: [0, [Validators.required, Validators.min(0)]],
      fijoAdicional: [0, [Validators.required, Validators.min(0)]],
      cycleTime: [0, [Validators.required, Validators.min(0)]],
      cumplimientoAgenda: [0, [Validators.required, Validators.min(0)]],
      sin30Dias: [0, [Validators.required, Validators.min(0)]],
      cycleTimeAdicional: [0, [Validators.required, Validators.min(0)]],
      cumplimientoAgendaAdicional: [0, [Validators.required, Validators.min(0)]],
      sin30DiasAdicional: [0, [Validators.required, Validators.min(0)]],
      aplicaPago: [true],
      aplicaGarantia: [false],
      activo: [true],
    });

    this.form.get('tipoTareaServicioId')?.valueChanges.subscribe((tipoTareaId) => {
      this.onTipoTareaSelect(tipoTareaId);
    });
  }

  private cargarTiposTarea(): void {
    this.servicioCampoService.getTiposTarea(undefined, true).subscribe({
      next: (data) => {
        this.tiposTarea = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar catálogo de tipos de tarea:', err);
      },
    });
  }

  private cargarSucursales(): void {
    this.sucursalService.getSucursales(undefined, true).subscribe({
      next: (data) => {
        this.sucursalesDisponibles = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar sucursales:', err);
      },
    });
  }

  private cargarTarifa(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.servicioCampoService.getTarifaServicioPorId(id).subscribe({
      next: (tarifa) => {
        this.tarifaActual = tarifa;
        this.form.patchValue({
          tipoTareaServicioId: tarifa.tipoTareaServicioId,
          tipificacion: tarifa.tipificacion || 'GENERAL',
          codigoServicio: tarifa.codigoServicio,
          detalleServicio: tarifa.detalleServicio,
          empresaContratante: tarifa.empresaContratante,
          sucursal: tarifa.sucursal || '',
          puntos: tarifa.puntos,
          fijoBase: tarifa.fijoBase,
          fijoAdicional: tarifa.fijoAdicional,
          cycleTime: tarifa.cycleTime,
          cumplimientoAgenda: tarifa.cumplimientoAgenda,
          sin30Dias: tarifa.sin30Dias,
          cycleTimeAdicional: tarifa.cycleTimeAdicional,
          cumplimientoAgendaAdicional: tarifa.cumplimientoAgendaAdicional,
          sin30DiasAdicional: tarifa.sin30DiasAdicional,
          aplicaPago: tarifa.aplicaPago,
          aplicaGarantia: tarifa.aplicaGarantia,
          activo: tarifa.activo,
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar tarifa:', err);
        this.message.error('No se pudo cargar la tarifa de servicio solicitada.');
        this.loading = false;
        this.volver();
      },
    });
  }

  onTipoTareaSelect(tipoTareaId: string | null): void {
    if (!tipoTareaId) return;
    const tarea = this.tiposTarea.find((t) => t.id === tipoTareaId);
    if (tarea) {
      this.form.patchValue({
        codigoServicio: tarea.codigoTarea,
        detalleServicio: tarea.nombre,
        empresaContratante: tarea.clienteFacturacionNombre || 'DIRECTV PERU S.R.L.',
      });
      this.cdr.markForCheck();
    }
  }

  // Cálculos automáticos para visualización
  get totalFijoCalculado(): number {
    const base = Number(this.form.get('fijoBase')?.value) || 0;
    const adic = Number(this.form.get('fijoAdicional')?.value) || 0;
    return base + adic;
  }

  get totalVariableBaseCalculado(): number {
    const ct = Number(this.form.get('cycleTime')?.value) || 0;
    const ag = Number(this.form.get('cumplimientoAgenda')?.value) || 0;
    const s30 = Number(this.form.get('sin30Dias')?.value) || 0;
    return ct + ag + s30;
  }

  get totalVariableAdicionalCalculado(): number {
    const ctAdic = Number(this.form.get('cycleTimeAdicional')?.value) || 0;
    const agAdic = Number(this.form.get('cumplimientoAgendaAdicional')?.value) || 0;
    const s30Adic = Number(this.form.get('sin30DiasAdicional')?.value) || 0;
    return ctAdic + agAdic + s30Adic;
  }

  get totalTeoricoCalculado(): number {
    return this.totalFijoCalculado + this.totalVariableBaseCalculado + this.totalVariableAdicionalCalculado;
  }

  // Command Bar
  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar cambios de la tarifa',
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
        execute: () => this.descartar(),
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
          if (this.tarifaId) this.cargarTarifa(this.tarifaId);
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
      this.message.warning('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    const val = this.form.value;
    this.saving = true;
    this.cdr.markForCheck();

    if (this.isEdit && this.tarifaId) {
      const request: ActualizarTarifaServicioRequest = {
        detalleServicio: val.detalleServicio,
        tipificacion: val.tipificacion,
        tipoTareaServicioId: val.tipoTareaServicioId || null,
        empresaContratante: val.empresaContratante,
        clienteFacturacionId: null,
        sucursal: val.sucursal ? val.sucursal.trim() : null,
        puntos: Number(val.puntos) || 0,
        fijoBase: Number(val.fijoBase) || 0,
        fijoAdicional: Number(val.fijoAdicional) || 0,
        variableTotal: this.totalVariableBaseCalculado,
        cycleTime: Number(val.cycleTime) || 0,
        cumplimientoAgenda: Number(val.cumplimientoAgenda) || 0,
        sin30Dias: Number(val.sin30Dias) || 0,
        variableAdicionalTotal: this.totalVariableAdicionalCalculado,
        cycleTimeAdicional: Number(val.cycleTimeAdicional) || 0,
        cumplimientoAgendaAdicional: Number(val.cumplimientoAgendaAdicional) || 0,
        sin30DiasAdicional: Number(val.sin30DiasAdicional) || 0,
        montoTotalTeorico: this.totalTeoricoCalculado,
        aplicaPago: !!val.aplicaPago,
        aplicaGarantia: !!val.aplicaGarantia,
      };

      this.servicioCampoService.actualizarTarifaServicio(this.tarifaId, request).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success(res.message || 'Tarifa actualizada correctamente.');
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.cargarTarifa(this.tarifaId!);
          }
        },
        error: (err) => {
          console.error('Error al actualizar tarifa:', err);
          this.saving = false;
          this.message.error(err.error?.message || 'Error al actualizar la tarifa.');
          this.cdr.markForCheck();
        },
      });
    } else {
      const command: CrearTarifaServicioCommand = {
        codigoServicio: val.codigoServicio,
        detalleServicio: val.detalleServicio,
        tipificacion: val.tipificacion,
        tipoTareaServicioId: val.tipoTareaServicioId || null,
        empresaContratante: val.empresaContratante,
        clienteFacturacionId: null,
        sucursal: val.sucursal ? val.sucursal.trim() : null,
        puntos: Number(val.puntos) || 0,
        fijoBase: Number(val.fijoBase) || 0,
        fijoAdicional: Number(val.fijoAdicional) || 0,
        variableTotal: this.totalVariableBaseCalculado,
        cycleTime: Number(val.cycleTime) || 0,
        cumplimientoAgenda: Number(val.cumplimientoAgenda) || 0,
        sin30Dias: Number(val.sin30Dias) || 0,
        variableAdicionalTotal: this.totalVariableAdicionalCalculado,
        cycleTimeAdicional: Number(val.cycleTimeAdicional) || 0,
        cumplimientoAgendaAdicional: Number(val.cumplimientoAgendaAdicional) || 0,
        sin30DiasAdicional: Number(val.sin30DiasAdicional) || 0,
        montoTotalTeorico: this.totalTeoricoCalculado,
        aplicaPago: !!val.aplicaPago,
        aplicaGarantia: !!val.aplicaGarantia,
      };

      this.servicioCampoService.crearTarifaServicio(command).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success(res.message || 'Tarifa registrada correctamente.');
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.router.navigate(['/servicio-campo/tarifas-servicio/editar', res.id]);
          }
        },
        error: (err) => {
          console.error('Error al crear tarifa:', err);
          this.saving = false;
          this.message.error(err.error?.message || 'Error al registrar la tarifa.');
          this.cdr.markForCheck();
        },
      });
    }
  }

  descartar(): void {
    if (this.form.dirty) {
      this.modal.confirm({
        nzTitle: '¿Descartar cambios?',
        nzContent: 'Hay modificaciones sin guardar. Si continúas, perderás los cambios.',
        nzOkText: 'Descartar',
        nzOkDanger: true,
        nzCancelText: 'Cancelar',
        nzOnOk: () => {
          if (this.isEdit && this.tarifaId) {
            this.cargarTarifa(this.tarifaId);
          } else {
            this.initForm();
          }
        },
      });
    } else {
      this.volver();
    }
  }

  volver(): void {
    this.router.navigate(['/servicio-campo/tarifas-servicio']);
  }

  getIniciales(nombre?: string): string {
    if (!nombre || !nombre.trim()) return 'TS';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.trim().substring(0, 2).toUpperCase();
  }
}
