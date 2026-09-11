import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioDto, RolDto } from '../../models/usuario.model';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-usuario-form',
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
    NzSelectModule,
    NzDrawerModule,
    NzSpinModule,
    NzTagModule,
    NzCheckboxModule,
    NzTooltipModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.component.css',
})
export class UsuarioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  passwordForm!: FormGroup;

  usuarioId: string | null = null;
  usuarioActual?: UsuarioDto;
  isEdit = false;
  loading = false;
  saving = false;
  passwordDrawerVisible = false;
  passwordSaving = false;

  rolesDisponibles: RolDto[] = [];
  modulosRoles: { modulo: string; roles: RolDto[] }[] = [];
  
  // Selección flexible de roles vía Checkboxes (Estilo Microsoft Dynamics 365)
  rolesSeleccionados = new Set<string>();

  get commandBarItems(): CommandBarItem[] {
    const isWaitingData = this.isEdit && this.loading && !this.usuarioActual;
    const items: CommandBarItem[] = [
      {
        key: 'guardar',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        disabled: this.saving || isWaitingData,
        execute: () => this.guardar(false),
      },
      {
        key: 'guardar-cerrar',
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
        key: 'nuevo',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear un nuevo usuario del sistema',
        execute: () => this.irANuevo(),
      });

      items.push({
        key: 'password',
        label: 'Restablecer Contraseña',
        icon: 'lock',
        iconColor: 'primary',
        tooltip: 'Abrir panel para asignar nueva contraseña',
        disabled: this.saving || isWaitingData,
        execute: () => this.abrirDrawerPassword(),
      });

      const isActivo = this.usuarioActual?.esActivo ?? true;
      items.push({
        key: 'estado',
        label: isActivo ? 'Desactivar' : 'Activar',
        icon: isActivo ? 'close' : 'check',
        danger: isActivo,
        iconColor: isActivo ? 'danger' : 'success',
        disabled: this.saving || isWaitingData,
        popconfirm: {
          title: isActivo
            ? `¿Está seguro de desactivar a ${this.usuarioActual?.nombreCompleto || 'este usuario'}? Ya no podrá iniciar sesión.`
            : `¿Desea activar y restablecer el acceso al sistema para ${this.usuarioActual?.nombreCompleto || 'este usuario'}?`,
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
      key: 'descartar',
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
        if (this.usuarioId) {
          this.cargarUsuario(this.usuarioId);
        } else {
          this.initForms();
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
        tooltip: 'Compartir ficha de usuario',
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
    this.initForms();
    this.cargarRoles();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.usuarioId = id;
        this.isEdit = true;

        // Hidratación instantánea desde el state de navegación para eliminar cualquier parpadeo
        const navState = history.state?.usuario as UsuarioDto | undefined;
        if (navState && navState.id === id) {
          this.setUsuario(navState);
        } else {
          this.loading = true;
        }

        this.cargarUsuario(id);
      } else {
        this.isEdit = false;
        this.loading = false;
        this.usuarioActual = undefined;
        this.rolesSeleccionados.clear();
        this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.form.get('password')?.updateValueAndValidity();
      }
    });
  }

  private initForms(): void {
    this.form = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: [''],
      esActivo: [true],
    });

    this.passwordForm = this.fb.group({
      nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', [Validators.required]],
    });
  }

  cargarRoles(): void {
    this.usuarioService.getRoles().subscribe({
      next: (roles) => {
        this.rolesDisponibles = roles;
        this.agruparRoles(roles);
        if (this.usuarioActual) {
          this.rolesSeleccionados = new Set(this.usuarioActual.roles || []);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('No se pudo cargar el catálogo de roles.');
      },
    });
  }

  private agruparRoles(roles: RolDto[]): void {
    const map = new Map<string, RolDto[]>();
    for (const r of roles) {
      const mod = r.modulo || 'General';
      if (!map.has(mod)) {
        map.set(mod, []);
      }
      map.get(mod)!.push(r);
    }
    this.modulosRoles = Array.from(map.entries()).map(([modulo, lista]) => ({
      modulo,
      roles: lista,
    }));
  }

  private setUsuario(user: UsuarioDto): void {
    this.usuarioActual = user;
    this.rolesSeleccionados = new Set(user.roles || []);
    this.form.patchValue({
      nombreCompleto: user.nombreCompleto,
      email: user.email,
      esActivo: user.esActivo,
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  cargarUsuario(id: string): void {
    if (!this.usuarioActual) {
      this.loading = true;
    }
    this.usuarioService.getUsuarioById(id).subscribe({
      next: (user) => {
        this.setUsuario(user);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err.error?.message || 'Error al cargar los datos del usuario.');
        this.volver();
      },
    });
  }

  /** Selección flexible de roles vía Checkboxes (Estilo Dynamics 365) */
  isRolSeleccionado(codigo: string): boolean {
    return this.rolesSeleccionados.has(codigo);
  }

  onRolCheckboxToggle(codigo: string, checked: boolean): void {
    if (checked) {
      this.rolesSeleccionados.add(codigo);
    } else {
      this.rolesSeleccionados.delete(codigo);
    }
    this.cdr.markForCheck();
  }

  toggleRol(codigo: string): void {
    if (this.rolesSeleccionados.has(codigo)) {
      this.rolesSeleccionados.delete(codigo);
    } else {
      this.rolesSeleccionados.add(codigo);
    }
    this.cdr.markForCheck();
  }

  rolesSeleccionadosEnModulo(grupo: { modulo: string; roles: RolDto[] }): RolDto[] {
    return grupo.roles.filter((r) => this.rolesSeleccionados.has(r.codigo));
  }

  guardar(cerrarAlGuardar = false): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((ctrl) => {
        if (ctrl.invalid) {
          ctrl.markAsDirty();
          ctrl.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Por favor complete los campos obligatorios.');
      return;
    }

    this.saving = true;
    const formVal = this.form.value;
    const rolesArray = Array.from(this.rolesSeleccionados);

    if (!this.isEdit) {
      this.usuarioService
        .crearUsuario({
          nombreCompleto: formVal.nombreCompleto!,
          email: formVal.email!,
          password: formVal.password!,
          roles: rolesArray,
        })
        .subscribe({
          next: (res) => {
            this.saving = false;
            this.message.success('Usuario registrado exitosamente.');
            if (cerrarAlGuardar) {
              this.volver();
            } else {
              this.router.navigate(['/configuracion/usuarios/editar', res.usuarioId]);
            }
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al crear el usuario.');
            this.cdr.markForCheck();
          },
        });
    } else {
      const id = this.usuarioId!;
      this.usuarioService
        .actualizarUsuario(id, {
          nombreCompleto: formVal.nombreCompleto!,
          email: formVal.email!,
        })
        .subscribe({
          next: () => {
            this.usuarioService.asignarRoles(id, rolesArray).subscribe({
              next: () => {
                this.saving = false;
                this.message.success('Usuario y roles actualizados correctamente.');
                if (cerrarAlGuardar) {
                  this.volver();
                } else {
                  this.cargarUsuario(id);
                }
              },
              error: (err) => {
                this.saving = false;
                this.message.warning('Usuario guardado, pero ocurrió un error con los roles: ' + (err.error?.message || err.message));
                this.cdr.markForCheck();
              },
            });
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al actualizar el usuario.');
            this.cdr.markForCheck();
          },
        });
    }
  }

  /** Activación / Desactivación Inmediata vía Popconfirm (Sin modales invasivos) */
  ejecutarCambioEstado(nuevoEstado: boolean): void {
    if (!this.usuarioActual) return;
    const target = this.usuarioActual;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    this.usuarioService.cambiarEstado(target.id, nuevoEstado).subscribe({
      next: () => {
        this.message.success(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
        this.cargarUsuario(target.id);
      },
      error: (err) => {
        this.message.error(err.error?.message || `No se pudo ${accion} al usuario.`);
      },
    });
  }

  /** Drawer Lateral Derecho para Restablecer Contraseña (Estilo Microsoft 365 Admin & D365) */
  abrirDrawerPassword(): void {
    this.passwordForm.reset();
    this.passwordDrawerVisible = true;
  }

  cerrarDrawerPassword(): void {
    this.passwordDrawerVisible = false;
  }

  guardarPassword(): void {
    if (this.passwordForm.invalid || !this.usuarioId) {
      Object.values(this.passwordForm.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    const { nuevaPassword, confirmarPassword } = this.passwordForm.value;
    if (nuevaPassword !== confirmarPassword) {
      this.message.error('Las contraseñas no coinciden. Verifíquelas e intente nuevamente.');
      return;
    }

    this.passwordSaving = true;
    this.usuarioService.cambiarPassword(this.usuarioId, nuevaPassword).subscribe({
      next: () => {
        this.passwordSaving = false;
        this.passwordDrawerVisible = false;
        this.message.success('Contraseña restablecida exitosamente.');
      },
      error: (err) => {
        this.passwordSaving = false;
        this.message.error(err.error?.message || 'Error al restablecer la contraseña.');
        this.cdr.markForCheck();
      },
    });
  }

  volver(): void {
    this.router.navigate(['/configuracion/usuarios']);
  }

  irANuevo(): void {
    if (this.isEdit) {
      this.router.navigate(['/configuracion/usuarios/nuevo']);
    } else {
      this.initForms();
      this.rolesSeleccionados.clear();
      this.message.info('Formulario preparado para registrar un nuevo usuario.');
      this.cdr.markForCheck();
    }
  }

  getIniciales(): string {
    const nombre = this.usuarioActual?.nombreCompleto || this.form?.get('nombreCompleto')?.value || '';
    if (!nombre) return this.isEdit ? '' : 'NU';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  getModuloIcon(modulo: string): string {
    const m = (modulo || '').toLowerCase();
    if (m.includes('venta') || m.includes('factura') || m.includes('caja')) return 'shopping-cart';
    if (m.includes('recurso') || m.includes('empleado') || m.includes('rrhh') || m.includes('personal')) return 'team';
    if (m.includes('inventario') || m.includes('producto') || m.includes('almacen')) return 'inbox';
    if (m.includes('config') || m.includes('ajuste') || m.includes('sistema')) return 'setting';
    if (m.includes('seguridad') || m.includes('usuario') || m.includes('rol')) return 'safety';
    return 'appstore';
  }
}
