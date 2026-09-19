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
  TipoOrdenTrabajoDto,
  CrearTipoOrdenTrabajoCommand,
  ActualizarTipoOrdenTrabajoRequest,
} from '../../models/servicio-campo-catalogos.model';

@Component({
  selector: 'app-tipo-orden-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
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
  templateUrl: './tipo-orden-form.html',
  styleUrl: './tipo-orden-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipoOrdenFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEdit = false;
  ordenId: string | null = null;
  ordenActual?: TipoOrdenTrabajoDto;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  colorPresets = [
    '#0078d4',
    '#107c41',
    '#d13438',
    '#ffaa00',
    '#8764b8',
    '#008272',
    '#e3008c',
    '#498205',
    '#004e8c',
    '#5c2e91',
  ];

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.ordenId = id;
      this.cargarTipoOrden(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      colorHex: ['#0078d4', [Validators.required]],
      requiereVisitaCampo: [true],
      exigeFirmaCliente: [true],
      exigeEvidenciasFotograficas: [false],
      descripcion: [''],
      activo: [true],
    });
  }

  private cargarTipoOrden(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.servicioCampoService.getTipoOrdenPorId(id).subscribe({
      next: (orden) => {
        this.ordenActual = orden;
        this.form.patchValue({
          nombre: orden.nombre,
          colorHex: orden.colorHex || '#0078d4',
          requiereVisitaCampo: orden.requiereVisitaCampo,
          exigeFirmaCliente: orden.exigeFirmaCliente,
          exigeEvidenciasFotograficas: orden.exigeEvidenciasFotograficas,
          descripcion: orden.descripcion || '',
          activo: orden.activo,
        });

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar tipo de orden:', err);
        this.message.error('No se pudo cargar el tipo de orden.');
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
        tooltip: 'Guardar cambios del tipo de orden',
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
          if (this.ordenId) this.cargarTipoOrden(this.ordenId);
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

    if (this.isEdit && this.ordenId) {
      const request: ActualizarTipoOrdenTrabajoRequest = {
        nombre: val.nombre.trim(),
        descripcion: val.descripcion?.trim() || undefined,
        colorHex: val.colorHex,
        requiereVisitaCampo: val.requiereVisitaCampo,
        exigeFirmaCliente: val.exigeFirmaCliente,
        exigeEvidenciasFotograficas: val.exigeEvidenciasFotograficas,
      };

      this.servicioCampoService.actualizarTipoOrden(this.ordenId, request).subscribe({
        next: () => {
          this.saving = false;
          this.message.success('Tipo de orden actualizado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else if (this.ordenId) {
            this.cargarTipoOrden(this.ordenId);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          console.error('Error al actualizar tipo de orden:', err);
          this.message.error(err?.error?.message || 'Error al actualizar el tipo de orden.');
        },
      });
    } else {
      const command: CrearTipoOrdenTrabajoCommand = {
        nombre: val.nombre.trim(),
        descripcion: val.descripcion?.trim() || undefined,
        colorHex: val.colorHex,
        requiereVisitaCampo: val.requiereVisitaCampo,
        exigeFirmaCliente: val.exigeFirmaCliente,
        exigeEvidenciasFotograficas: val.exigeEvidenciasFotograficas,
      };

      this.servicioCampoService.crearTipoOrden(command).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success('Tipo de orden creado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.router.navigate(['/servicio-campo/tipos-orden/editar', res.id]);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          console.error('Error al crear tipo de orden:', err);
          this.message.error(err?.error?.message || 'Error al crear el tipo de orden.');
        },
      });
    }
  }

  volver(): void {
    this.router.navigate(['/servicio-campo/tipos-orden']);
  }

  getIniciales(nombre?: string): string {
    if (!nombre || !nombre.trim()) return 'TO';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.trim().substring(0, 2).toUpperCase();
  }
}
