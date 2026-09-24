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
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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
import { NzMessageService } from 'ng-zorro-antd/message';

// Shared Components & Services
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar/command-bar.component';
import { UnidadMedidaService } from '../../services/unidad-medida.service';
import { UnidadMedidaDto } from '../../models/catalogo-producto.model';

@Component({
  selector: 'app-unidad-medida-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
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
    CommandBarComponent,
  ],
  templateUrl: './unidad-medida-form.html',
  styleUrl: './unidad-medida-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnidadMedidaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private unidadMedidaService = inject(UnidadMedidaService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEdit = false;
  unidadId: string | null = null;
  unidadActual?: UnidadMedidaDto;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  get nombreEnFormulario(): string {
    if (this.isEdit) {
      if (this.unidadActual?.nombre) return this.unidadActual.nombre;
      const formVal = this.form?.get('nombre')?.value?.trim();
      if (formVal) return formVal;
      return this.loading ? 'Cargando...' : 'Unidad de Medida';
    }
    return this.form?.get('nombre')?.value?.trim() || 'Nueva Unidad de Medida';
  }

  get codigoEnFormulario(): string {
    if (this.isEdit) {
      if (this.unidadActual?.codigo) return this.unidadActual.codigo;
      const formVal = this.form?.get('codigo')?.value?.trim();
      if (formVal) return formVal;
      return this.loading ? '...' : '';
    }
    return this.form?.get('codigo')?.value?.trim() || 'NUEVA-UM';
  }

  getIniciales(): string {
    const abrev = this.unidadActual?.abreviatura || this.form?.get('abreviatura')?.value;
    if (abrev && abrev.trim()) return abrev.trim().substring(0, 3).toUpperCase();
    const nom = this.unidadActual?.nombre || this.form?.get('nombre')?.value;
    if (nom && nom.trim()) return nom.trim().substring(0, 2).toUpperCase();
    return this.isEdit && this.loading ? '' : 'UM';
  }

  // ─── CommandBar ──────────────────────────────────────────────────────────
  get commandBarItems(): CommandBarItem[] {
    const items: CommandBarItem[] = [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        disabled: this.saving,
        tooltip: 'Guardar cambios (Ctrl+S)',
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y cerrar',
        icon: 'save',
        iconColor: 'purple',
        disabled: this.saving,
        tooltip: 'Guardar y regresar a la lista de unidades',
        execute: () => this.guardar(true),
      },
    ];

    if (this.isEdit) {
      items.push({
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear una nueva unidad de medida',
        execute: () => this.router.navigate(['/servicio-campo/unidades-medida/nuevo']),
      });

      items.push({
        key: 'toggle',
        label: this.unidadActual?.activo ? 'Desactivar' : 'Activar',
        icon: this.unidadActual?.activo ? 'close-circle' : 'check-circle',
        danger: this.unidadActual?.activo,
        iconColor: this.unidadActual?.activo ? 'danger' : 'success',
        tooltip: this.unidadActual?.activo ? 'Desactivar unidad de medida' : 'Reactivar unidad de medida',
        execute: () => this.toggleEstado(),
      });
    }

    items.push({ key: 'd1', isDivider: true });
    items.push({
      key: 'refresh',
      label: 'Actualizar',
      icon: 'reload',
      tooltip: 'Recargar datos',
      execute: () => this.recargar(),
    });

    return items;
  }

  // ─── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForm();
    this.unidadId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.unidadId && this.unidadId !== 'nuevo';

    if (this.isEdit && this.unidadId) {
      this.loading = true;
      this.cargarUnidad(this.unidadId);
    }
  }

  private poblarFormulario(item: UnidadMedidaDto): void {
    this.form.patchValue({
      codigo: item.codigo,
      nombre: item.nombre,
      abreviatura: item.abreviatura,
      permiteDecimales: item.permiteDecimales,
      descripcion: item.descripcion || '',
    });
    this.form.get('codigo')?.disable();
  }

  private initForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      abreviatura: ['', [Validators.required, Validators.maxLength(10)]],
      permiteDecimales: [false],
      descripcion: ['', [Validators.maxLength(300)]],
    });
  }

  cargarUnidad(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.unidadMedidaService.getUnidadMedidaById(id).subscribe({
      next: (item) => {
        this.unidadActual = item;
        this.form.patchValue({
          codigo: item.codigo,
          nombre: item.nombre,
          abreviatura: item.abreviatura,
          permiteDecimales: item.permiteDecimales,
          descripcion: item.descripcion || '',
        });
        this.form.get('codigo')?.disable();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('No se pudo cargar la unidad de medida solicitada.');
        this.loading = false;
        this.volver();
      },
    });
  }

  guardar(cerrarAlFinal = false): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((ctrl) => {
        if (ctrl.invalid) {
          ctrl.markAsDirty();
          ctrl.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Por favor completa todos los campos requeridos.');
      return;
    }

    const val = this.form.getRawValue();
    this.saving = true;
    this.cdr.markForCheck();

    if (this.isEdit && this.unidadId) {
      this.unidadMedidaService
        .actualizarUnidadMedida(this.unidadId, {
          nombre: val.nombre,
          abreviatura: val.abreviatura,
          permiteDecimales: val.permiteDecimales,
          descripcion: val.descripcion,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.message.success('Unidad de medida actualizada con éxito.');
            if (cerrarAlFinal) {
              this.volver();
            } else {
              this.cargarUnidad(this.unidadId!);
            }
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err?.error || 'Error al guardar los cambios.');
            this.cdr.markForCheck();
          },
        });
    } else {
      this.unidadMedidaService
        .crearUnidadMedida({
          codigo: val.codigo,
          nombre: val.nombre,
          abreviatura: val.abreviatura,
          permiteDecimales: val.permiteDecimales,
          descripcion: val.descripcion,
        })
        .subscribe({
          next: (res) => {
            this.saving = false;
            this.message.success('Unidad de medida creada con éxito.');
            if (cerrarAlFinal) {
              this.volver();
            } else {
              this.router.navigate(['/servicio-campo/unidades-medida/editar', res.id]);
            }
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err?.error || 'Error al crear la unidad de medida.');
            this.cdr.markForCheck();
          },
        });
    }
  }

  toggleEstado(): void {
    if (!this.unidadId || !this.unidadActual) return;
    const nuevoEstado = !this.unidadActual.activo;
    this.unidadMedidaService.cambiarEstado(this.unidadId, nuevoEstado).subscribe({
      next: () => {
        this.message.success(`Unidad ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`);
        this.cargarUnidad(this.unidadId!);
      },
      error: () => this.message.error('Error al cambiar el estado.'),
    });
  }

  recargar(): void {
    if (this.isEdit && this.unidadId) {
      this.cargarUnidad(this.unidadId);
    } else {
      this.form.reset({
        codigo: '',
        nombre: '',
        abreviatura: '',
        permiteDecimales: false,
        descripcion: '',
      });
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/servicio-campo/unidades-medida']);
  }
}
