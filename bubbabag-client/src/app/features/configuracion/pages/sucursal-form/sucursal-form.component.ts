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

  commandBarItems: CommandBarItem[] = [];

  ngOnInit(): void {
    this.initForm();
    this.updateCommandBar();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.sucursalId = id;
        this.cargarSucursal(id);
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

  updateCommandBar(): void {
    this.commandBarItems = [
      {
        key: 'back',
        label: '',
        icon: 'arrow-left',
        action: () => this.descartar(),
      },
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        disabled: this.saving,
        action: () => this.guardar(false),
      },
      {
        key: 'save-close',
        label: 'Guardar y cerrar',
        icon: 'save',
        disabled: this.saving,
        action: () => this.guardar(true),
      },
      {
        key: 'discard',
        label: 'Descartar',
        icon: 'close',
        action: () => this.descartar(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        action: () => {
          if (this.sucursalId) {
            this.cargarSucursal(this.sucursalId);
          } else {
            this.form.reset({ activo: true, esSedePrincipal: false });
          }
        },
      },
    ];
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
    this.updateCommandBar();

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
              this.router.navigate(['/configuracion/sucursales']);
            } else {
              this.cargarSucursal(this.sucursalId!);
            }
          },
          error: (err) => {
            this.saving = false;
            this.updateCommandBar();
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
              this.router.navigate(['/configuracion/sucursales']);
            } else {
              this.router.navigate(['/configuracion/sucursales/editar', res.id]);
            }
          },
          error: (err) => {
            this.saving = false;
            this.updateCommandBar();
            const msg = err?.error?.detail || err?.error || 'Error al crear la sucursal';
            this.message.error(typeof msg === 'string' ? msg : 'Error al crear');
          },
        });
    }
  }

  descartar(): void {
    this.router.navigate(['/configuracion/sucursales']);
  }

  getIniciales(): string {
    const nom = this.form.get('nombre')?.value;
    if (!nom || typeof nom !== 'string') return 'SC';
    const partes = nom.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  }
}
