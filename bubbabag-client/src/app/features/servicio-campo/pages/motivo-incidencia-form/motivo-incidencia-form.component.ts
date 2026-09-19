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

// Shared Components & Services
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar/command-bar.component';
import { ServicioCampoService } from '../../services/servicio-campo.service';
import {
  MotivoIncidenciaDto,
  AmbitoMotivo,
  AmbitoMotivoLabels,
  CrearMotivoIncidenciaCommand,
  ActualizarMotivoIncidenciaRequest,
} from '../../models/servicio-campo-catalogos.model';

@Component({
  selector: 'app-motivo-incidencia-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSwitchModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    NzSpinModule,
    NzAvatarModule,
    NzDividerModule,
    NzTagModule,
    CommandBarComponent,
  ],
  templateUrl: './motivo-incidencia-form.html',
  styleUrl: './motivo-incidencia-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MotivoIncidenciaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  AmbitoMotivo = AmbitoMotivo;
  AmbitoMotivoLabels = AmbitoMotivoLabels;

  form!: FormGroup;
  isEdit = false;
  motivoId: string | null = null;
  motivoActual?: MotivoIncidenciaDto;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  ambitos = [
    { value: AmbitoMotivo.OrdenTrabajo, label: AmbitoMotivoLabels[AmbitoMotivo.OrdenTrabajo] },
    { value: AmbitoMotivo.Visita, label: AmbitoMotivoLabels[AmbitoMotivo.Visita] },
    { value: AmbitoMotivo.Tarea, label: AmbitoMotivoLabels[AmbitoMotivo.Tarea] },
  ];

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.motivoId = id;
      this.cargarMotivo(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      ambito: [AmbitoMotivo.OrdenTrabajo, [Validators.required]],
      descripcion: [''],
      activo: [true],
    });
  }

  private cargarMotivo(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.servicioCampoService.getMotivoIncidenciaPorId(id).subscribe({
      next: (motivo) => {
        this.motivoActual = motivo;
        this.form.patchValue({
          codigo: motivo.codigo,
          nombre: motivo.nombre,
          ambito: motivo.ambito,
          descripcion: motivo.descripcion || '',
          activo: motivo.activo,
        });

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar motivo de incidencia:', err);
        this.message.error('No se pudo cargar el motivo de incidencia.');
        this.loading = false;
        this.volver();
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
        tooltip: 'Guardar cambios del motivo de incidencia',
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
          if (this.motivoId) this.cargarMotivo(this.motivoId);
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

    if (this.isEdit && this.motivoId) {
      const request: ActualizarMotivoIncidenciaRequest = {
        nombre: val.nombre.trim(),
        ambito: val.ambito,
        descripcion: val.descripcion?.trim() || undefined,
      };

      this.servicioCampoService.actualizarMotivoIncidencia(this.motivoId, request).subscribe({
        next: () => {
          this.saving = false;
          this.message.success('Motivo de incidencia actualizado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else if (this.motivoId) {
            this.cargarMotivo(this.motivoId);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          console.error('Error al actualizar motivo de incidencia:', err);
          this.message.error(err?.error?.message || 'Error al actualizar el motivo de incidencia.');
        },
      });
    } else {
      const command: CrearMotivoIncidenciaCommand = {
        codigo: val.codigo.trim().toUpperCase(),
        nombre: val.nombre.trim(),
        ambito: val.ambito,
        descripcion: val.descripcion?.trim() || undefined,
      };

      this.servicioCampoService.crearMotivoIncidencia(command).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success('Motivo de incidencia registrado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.router.navigate(['/servicio-campo/motivos-incidencia/editar', res.id]);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          console.error('Error al crear motivo de incidencia:', err);
          this.message.error(err?.error?.message || 'Error al registrar el motivo de incidencia.');
        },
      });
    }
  }

  volver(): void {
    this.router.navigate(['/servicio-campo/motivos-incidencia']);
  }

  getAmbitoLabel(): string {
    const val = this.form.get('ambito')?.value;
    return AmbitoMotivoLabels[val as AmbitoMotivo] || 'ORDEN DE TRABAJO';
  }

  getIniciales(nombre?: string): string {
    if (!nombre || !nombre.trim()) return 'MI';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.trim().substring(0, 2).toUpperCase();
  }
}
