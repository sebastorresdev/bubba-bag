import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSwitchModule,
    NzIconModule,
    NzCardModule,
    NzAvatarModule,
    NzRadioModule,
    NzModalModule,
    NzSpinModule,
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
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  passwordModalForm!: FormGroup;

  usuarioId: string | null = null;
  usuarioActual?: UsuarioDto;
  isEdit = false;
  loading = false;
  saving = false;
  passwordModalVisible = false;
  passwordSaving = false;

  rolesDisponibles: RolDto[] = [];
  modulosRoles: { modulo: string; roles: RolDto[] }[] = [];
  
  // Regla de Negocio: Máximo 1 rol por módulo (modulo -> codigoRol)
  rolesPorModulo = new Map<string, string>();

  get commandBarItems(): CommandBarItem[] {
    const isWaitingData = this.isEdit && this.loading && !this.usuarioActual;
    const items: CommandBarItem[] = [
      {
        key: 'guardar',
        label: 'Guardar',
        icon: 'save',
        disabled: this.saving || isWaitingData,
        execute: () => this.guardar(false),
      },
      {
        key: 'guardar-cerrar',
        label: 'Guardar y Cerrar',
        icon: 'save',
        disabled: this.saving || isWaitingData,
        execute: () => this.guardar(true),
      },
    ];

    if (this.isEdit) {
      items.push({
        key: 'password',
        label: 'Restablecer Contraseña',
        icon: 'lock',
        disabled: this.saving || isWaitingData,
        execute: () => this.abrirModalPassword(),
      });

      const isActivo = this.usuarioActual?.esActivo ?? true;
      items.push({
        key: 'estado',
        label: isActivo ? 'Desactivar' : 'Activar',
        icon: isActivo ? 'close' : 'check',
        danger: isActivo,
        disabled: this.saving || isWaitingData,
        execute: () => this.toggleEstado(),
      });
    }

    items.push({
      key: 'descartar',
      label: 'Descartar',
      icon: 'close',
      execute: () => this.volver(),
    });

    return items;
  }

  get farItems(): CommandBarItem[] {
    return [];
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
        this.rolesPorModulo.clear();
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

    this.passwordModalForm = this.fb.group({
      nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  cargarRoles(): void {
    this.usuarioService.getRoles().subscribe({
      next: (roles) => {
        this.rolesDisponibles = roles;
        this.agruparRoles(roles);
        if (this.usuarioActual) {
          this.sincronizarRolesConModulos(this.usuarioActual.roles);
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

  private sincronizarRolesConModulos(userRoles: string[]): void {
    this.rolesPorModulo.clear();
    for (const codigo of userRoles) {
      const r = this.rolesDisponibles.find((x) => x.codigo === codigo);
      if (r) {
        this.rolesPorModulo.set(r.modulo, codigo);
      } else {
        this.rolesPorModulo.set('General', codigo);
      }
    }
  }

  private setUsuario(user: UsuarioDto): void {
    this.usuarioActual = user;
    if (this.rolesDisponibles.length > 0) {
      this.sincronizarRolesConModulos(user.roles);
    }
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

  seleccionarRol(modulo: string, codigoRol: string): void {
    // Si ya estaba seleccionado, lo desmarca (permite "Sin Acceso" a ese módulo)
    if (this.rolesPorModulo.get(modulo) === codigoRol) {
      this.rolesPorModulo.delete(modulo);
    } else {
      // Reemplaza cualquier rol anterior en este módulo (1 solo rol por módulo)
      this.rolesPorModulo.set(modulo, codigoRol);
    }
    this.cdr.markForCheck();
  }

  isRolSelected(modulo: string, codigoRol: string): boolean {
    return this.rolesPorModulo.get(modulo) === codigoRol;
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
    const rolesArray = Array.from(this.rolesPorModulo.values());

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

  toggleEstado(): void {
    if (!this.usuarioActual) return;
    const target = this.usuarioActual;
    const accion = target.esActivo ? 'desactivar' : 'activar';

    this.modal.confirm({
      nzTitle: `¿Está seguro de ${accion} a este usuario?`,
      nzContent: `El usuario <b>${target.nombreCompleto}</b> ${
        target.esActivo ? 'ya no podrá iniciar sesión en el sistema.' : 'recuperará el acceso al sistema.'
      }`,
      nzOkText: target.esActivo ? 'Desactivar' : 'Activar',
      nzOkDanger: target.esActivo,
      nzOnOk: () => {
        this.usuarioService.cambiarEstado(target.id, !target.esActivo).subscribe({
          next: () => {
            this.message.success(`Usuario ${target.esActivo ? 'desactivado' : 'activado'} correctamente.`);
            this.cargarUsuario(target.id);
          },
          error: (err) => {
            this.message.error(err.error?.message || `No se pudo ${accion} al usuario.`);
          },
        });
      },
    });
  }

  abrirModalPassword(): void {
    this.passwordModalForm.reset();
    this.passwordModalVisible = true;
  }

  guardarPassword(): void {
    if (this.passwordModalForm.invalid || !this.usuarioId) {
      Object.values(this.passwordModalForm.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    this.passwordSaving = true;
    const nuevaPassword = this.passwordModalForm.value.nuevaPassword!;

    this.usuarioService.cambiarPassword(this.usuarioId, nuevaPassword).subscribe({
      next: () => {
        this.passwordSaving = false;
        this.passwordModalVisible = false;
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

  getIniciales(): string {
    const nombre = this.usuarioActual?.nombreCompleto || this.form?.get('nombreCompleto')?.value || '';
    if (!nombre) return this.isEdit ? '' : 'NU';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
}
