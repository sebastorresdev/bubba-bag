import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SucursalService } from '../../services/sucursal.service';
import { SucursalDto } from '../../models/sucursal.model';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-sucursal-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSwitchModule,
    NzIconModule,
    NzCardModule,
    NzAvatarModule,
    NzTagModule,
    NzTabsModule,
    NzSpinModule,
    NzDividerModule,
    NzPopconfirmModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './sucursal-form.html',
  styleUrl: './sucursal-form.component.css',
})
export class SucursalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sucursalService = inject(SucursalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEdit = false;
  sucursalId: string | null = null;
  loading = false;
  saving = false;
  selectedTabIndex = 0;
  sucursalActual: SucursalDto | null = null;

  get loadingTip(): string {
    if (this.saving) return 'Guardando información de la sucursal...';
    if (this.loading) return 'Cargando datos de la sucursal...';
    return 'Procesando...';
  }


  get commandBarItems(): CommandBarItem[] {
    const isWaitingData = this.isEdit && this.loading && !this.sucursalActual;
    const items: CommandBarItem[] = [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        disabled: this.saving || isWaitingData,
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y Cerrar',
        icon: 'save',
        iconColor: 'purple',
        disabled: this.saving || isWaitingData,
        execute: () => this.guardar(true),
      },
    ];

    if (this.isEdit) {
      items.push({
        key: 'div-edit-actions',
        label: '',
        isDivider: true,
      });

      items.push({
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear una nueva sucursal o sede',
        execute: () => this.irANuevo(),
      });

      const isActivo = this.sucursalActual?.activo ?? true;
      items.push({
        key: 'estado',
        label: isActivo ? 'Desactivar' : 'Activar',
        icon: isActivo ? 'close' : 'check',
        danger: isActivo,
        iconColor: isActivo ? 'danger' : 'success',
        disabled: this.saving || isWaitingData,
        popconfirm: {
          title: isActivo
            ? `¿Está seguro de desactivar la sucursal "${this.sucursalActual?.nombre || ''}"?`
            : `¿Desea activar la sucursal "${this.sucursalActual?.nombre || ''}"?`,
          okText: isActivo ? 'Desactivar' : 'Activar',
          cancelText: 'Cancelar',
          okDanger: isActivo,
          onConfirm: () => this.ejecutarCambioEstado(!isActivo),
        },
      });
    }

    items.push({
      key: 'div-common-actions',
      label: '',
      isDivider: true,
    });

    items.push({
      key: 'discard',
      label: 'Descartar',
      icon: 'close',
      iconColor: 'neutral',
      execute: () => this.volver(),
    });

    items.push({
      key: 'refresh',
      label: 'Actualizar',
      icon: 'reload',
      iconColor: 'neutral',
      tooltip: 'Recargar datos del formulario',
      disabled: this.saving,
      execute: () => {
        if (this.sucursalId) {
          this.cargarSucursal(this.sucursalId);
        } else {
          this.form.reset({ activo: true, esSedePrincipal: false });
        }
      },
    });

    return items;
  }

  get farItems(): CommandBarItem[] {
    return [
      {
        key: 'share',
        label: 'Compartir',
        icon: 'export',
        appearance: 'primary',
        tooltip: 'Compartir ficha de sucursal',
        children: [
          {
            key: 'copy-link',
            label: 'Copiar vínculo',
            icon: 'link',
            execute: () => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                this.message.success('Vínculo copiado al portapapeles');
              }
            },
          },
        ],
      },
    ];
  }

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.sucursalId = id;
        this.cargarSucursal(id);
      } else {
        this.isEdit = false;
        this.sucursalId = null;
        this.sucursalActual = null;
        this.form.get('codigo')?.enable();
      }
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      ciudad: ['', [Validators.maxLength(100)]],
      direccion: ['', [Validators.maxLength(250)]],
      telefono: ['', [Validators.maxLength(30)]],
      esSedePrincipal: [false],
      activo: [true],
    });
  }

  cargarSucursal(id: string): void {
    this.loading = true;
    this.sucursalService.getSucursalById(id).subscribe({
      next: (data) => {
        this.sucursalActual = data;
        this.form.patchValue({
          codigo: data.codigo,
          nombre: data.nombre,
          ciudad: data.ciudad,
          direccion: data.direccion,
          telefono: data.telefono,
          esSedePrincipal: data.esSedePrincipal,
          activo: data.activo,
        });
        this.form.get('codigo')?.disable();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudo cargar la sucursal');
        this.router.navigate(['/configuracion/sucursales']);
      },
    });
  }

  guardar(cerrar: boolean): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((ctrl) => {
        ctrl.markAsDirty();
        ctrl.updateValueAndValidity();
      });
      this.message.warning('Por favor complete los campos requeridos correctamente');
      return;
    }

    this.saving = true;
    const val = this.form.getRawValue();

    if (this.isEdit && this.sucursalId) {
      this.sucursalService
        .actualizarSucursal(this.sucursalId, {
          nombre: val.nombre,
          ciudad: val.ciudad,
          direccion: val.direccion,
          telefono: val.telefono,
          esSedePrincipal: val.esSedePrincipal,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.message.success('Sucursal actualizada correctamente');
            if (cerrar) {
              this.volver();
            } else {
              this.cargarSucursal(this.sucursalId!);
            }
          },
          error: (err) => {
            this.saving = false;
            const msg = err?.error?.detail || err?.error || 'Error al actualizar la sucursal';
            this.message.error(typeof msg === 'string' ? msg : 'Error al actualizar');
          },
        });
    } else {
      this.sucursalService
        .crearSucursal({
          codigo: val.codigo,
          nombre: val.nombre,
          ciudad: val.ciudad,
          direccion: val.direccion,
          telefono: val.telefono,
          esSedePrincipal: val.esSedePrincipal,
        })
        .subscribe({
          next: (res) => {
            this.saving = false;
            this.message.success('Sucursal creada exitosamente');
            if (cerrar) {
              this.volver();
            } else {
              this.router.navigate(['/configuracion/sucursales/editar', res.id]);
            }
          },
          error: (err) => {
            this.saving = false;
            const msg = err?.error?.detail || err?.error || 'Error al crear la sucursal';
            this.message.error(typeof msg === 'string' ? msg : 'Error al crear');
          },
        });
    }
  }

  ejecutarCambioEstado(nuevoEstado: boolean): void {
    if (!this.sucursalId) return;

    this.saving = true;
    this.sucursalService.cambiarEstado(this.sucursalId, nuevoEstado).subscribe({
      next: () => {
        this.saving = false;
        this.message.success(
          nuevoEstado ? 'Sucursal activada con éxito' : 'Sucursal desactivada'
        );
        this.form.get('activo')?.setValue(nuevoEstado);
        if (this.sucursalActual) {
          this.sucursalActual.activo = nuevoEstado;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.message.error('Error al cambiar el estado de la sucursal');
      },
    });
  }

  volver(): void {
    this.router.navigate(['/configuracion/sucursales']);
  }

  irANuevo(): void {
    this.router.navigate(['/configuracion/sucursales/nuevo']);
  }

  getIniciales(): string {
    const nom = this.sucursalActual?.nombre?.trim();
    if (!nom) return 'SC';
    const partes = nom.split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  }
}
