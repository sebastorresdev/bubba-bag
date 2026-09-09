import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioDto, RolDto } from '../../models/usuario.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzInputModule,
    NzTagModule,
    NzFormModule,
    NzCardModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzDropdownModule,
    NzTooltipModule,
    NzAvatarModule,
    NzBadgeModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.component.css',
})
export class UsuariosListComponent implements OnInit, OnDestroy {
  private usuarioService = inject(UsuarioService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  usuarios: UsuarioDto[] = [];
  rolesDisponibles: RolDto[] = [];
  modulosRoles: { modulo: string; roles: RolDto[] }[] = [];
  loading = false;
  searchTerm = '';
  searchSubject = new Subject<string>();

  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';
  selectedIds = new Set<string>();
  checked = false;
  indeterminate = false;

  // Modal Crear / Editar
  modalVisible = false;
  modalModo: 'crear' | 'editar' = 'crear';
  saving = false;
  usuarioSeleccionado?: UsuarioDto;
  rolesSeleccionados = new Set<string>();

  userForm = this.fb.group({
    id: [''],
    nombreCompleto: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: [''],
  });

  // Modal Restablecer Contraseña
  passwordModalVisible = false;
  passwordSaving = false;
  passwordForm = this.fb.group({
    nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  private router = inject(Router);

  get commandBarItems(): CommandBarItem[] {
    const singleSelected = this.selectedIds.size === 1;
    const selectedUser = singleSelected ? this.getSelectedUser() : undefined;
    const isActivo = selectedUser ? selectedUser.esActivo : false;

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        execute: () => this.irANuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        disabled: !singleSelected,
        execute: () => this.irAEditar(),
      },
      {
        key: 'password',
        label: 'Cambiar Contraseña',
        icon: 'lock',
        disabled: !singleSelected,
        execute: () => this.abrirModalPassword(),
      },
      {
        key: 'toggleStatus',
        label: isActivo ? 'Desactivar' : 'Activar',
        icon: isActivo ? 'close' : 'check',
        disabled: !singleSelected,
        danger: isActivo,
        execute: () => this.toggleEstadoUsuario(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        execute: () => this.cargarUsuarios(),
      },
    ];
  }

  get farItems(): CommandBarItem[] {
    return [];
  }

  irANuevo(): void {
    this.router.navigate(['/configuracion/usuarios/nuevo']);
  }

  irAEditar(id?: string): void {
    const targetId = id || Array.from(this.selectedIds)[0];
    if (targetId) {
      const targetUser = this.usuarios.find((u) => u.id === targetId);
      this.router.navigate(['/configuracion/usuarios/editar', targetId], {
        state: { usuario: targetUser },
      });
    }
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.cargarUsuarios();
      });

    this.cargarRoles();
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  cargarRoles(): void {
    this.usuarioService.getRoles().subscribe({
      next: (roles) => {
        this.rolesDisponibles = roles;
        this.agruparRolesPorModulo(roles);
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('No se pudo cargar el catálogo de roles.');
      },
    });
  }

  private agruparRolesPorModulo(roles: RolDto[]): void {
    const map = new Map<string, RolDto[]>();
    for (const rol of roles) {
      const mod = rol.modulo || 'General';
      if (!map.has(mod)) {
        map.set(mod, []);
      }
      map.get(mod)!.push(rol);
    }
    this.modulosRoles = Array.from(map.entries()).map(([modulo, lista]) => ({
      modulo,
      roles: lista,
    }));
  }

  cargarUsuarios(): void {
    this.loading = true;
    const soloActivos =
      this.vistaActual === 'Activos'
        ? true
        : this.vistaActual === 'Inactivos'
        ? false
        : undefined;

    this.usuarioService.getUsuarios(this.searchTerm, soloActivos).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
        this.actualizarEstadoSeleccion();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.message.error('Error al cargar la lista de usuarios: ' + (err.error?.message || err.message));
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: 'Activos' | 'Todos' | 'Inactivos'): void {
    this.vistaActual = vista;
    this.selectedIds.clear();
    this.cargarUsuarios();
  }

  onSearchTermChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarUsuarios();
  }

  buscar(): void {
    this.cargarUsuarios();
  }

  // Selección
  onItemChecked(id: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.actualizarEstadoSeleccion();
  }

  onAllChecked(checked: boolean): void {
    if (checked) {
      this.usuarios.forEach((item) => this.selectedIds.add(item.id));
    } else {
      this.selectedIds.clear();
    }
    this.actualizarEstadoSeleccion();
  }

  private actualizarEstadoSeleccion(): void {
    const total = this.usuarios.length;
    const selected = this.usuarios.filter((item) => this.selectedIds.has(item.id)).length;
    this.checked = total > 0 && selected === total;
    this.indeterminate = selected > 0 && !this.checked;
  }

  getSelectedUser(): UsuarioDto | undefined {
    const id = Array.from(this.selectedIds)[0];
    return this.usuarios.find((u) => u.id === id);
  }

  get vistaActualTitulo(): string {
    switch (this.vistaActual) {
      case 'Activos':
        return 'Usuarios Activos';
      case 'Inactivos':
        return 'Usuarios Inactivos';
      case 'Todos':
        return 'Todos los Usuarios';
    }
  }

  // Modales
  abrirModalCrear(): void {
    this.modalModo = 'crear';
    this.usuarioSeleccionado = undefined;
    this.rolesSeleccionados.clear();
    this.userForm.reset();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.modalVisible = true;
  }

  abrirModalEditar(usuario?: UsuarioDto): void {
    const target = usuario || this.getSelectedUser();
    if (!target) return;

    this.modalModo = 'editar';
    this.usuarioSeleccionado = target;
    this.rolesSeleccionados = new Set(target.roles);

    this.userForm.reset({
      id: target.id,
      nombreCompleto: target.nombreCompleto,
      email: target.email,
      password: '',
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();

    this.modalVisible = true;
  }

  toggleRol(codigoRol: string): void {
    if (this.rolesSeleccionados.has(codigoRol)) {
      this.rolesSeleccionados.delete(codigoRol);
    } else {
      this.rolesSeleccionados.add(codigoRol);
    }
  }

  guardarUsuario(): void {
    if (this.userForm.invalid) {
      Object.values(this.userForm.controls).forEach((ctrl) => {
        if (ctrl.invalid) {
          ctrl.markAsDirty();
          ctrl.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.saving = true;
    const formVal = this.userForm.value;
    const rolesArray = Array.from(this.rolesSeleccionados);

    if (this.modalModo === 'crear') {
      this.usuarioService
        .crearUsuario({
          nombreCompleto: formVal.nombreCompleto!,
          email: formVal.email!,
          password: formVal.password!,
          roles: rolesArray,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.modalVisible = false;
            this.message.success('Usuario creado correctamente.');
            this.cargarUsuarios();
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err.error?.message || 'Error al registrar el usuario.');
            this.cdr.markForCheck();
          },
        });
    } else {
      const id = this.usuarioSeleccionado!.id;
      this.usuarioService
        .actualizarUsuario(id, {
          nombreCompleto: formVal.nombreCompleto!,
          email: formVal.email!,
        })
        .subscribe({
          next: () => {
            // Actualizar roles asignados
            this.usuarioService.asignarRoles(id, rolesArray).subscribe({
              next: () => {
                this.saving = false;
                this.modalVisible = false;
                this.message.success('Usuario y roles actualizados.');
                this.cargarUsuarios();
              },
              error: (err) => {
                this.saving = false;
                this.message.warning('Usuario guardado, pero hubo un error al actualizar los roles: ' + (err.error?.message || err.message));
                this.cargarUsuarios();
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

  // Password Modal
  abrirModalPassword(usuario?: UsuarioDto): void {
    const target = usuario || this.getSelectedUser();
    if (!target) return;

    this.usuarioSeleccionado = target;
    this.passwordForm.reset();
    this.passwordModalVisible = true;
  }

  guardarPassword(): void {
    if (this.passwordForm.invalid || !this.usuarioSeleccionado) {
      Object.values(this.passwordForm.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    this.passwordSaving = true;
    const nuevaPassword = this.passwordForm.value.nuevaPassword!;

    this.usuarioService.cambiarPassword(this.usuarioSeleccionado.id, nuevaPassword).subscribe({
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

  // Toggle Estado
  toggleEstadoUsuario(usuario?: UsuarioDto): void {
    const target = usuario || this.getSelectedUser();
    if (!target) return;

    const accion = target.esActivo ? 'desactivar' : 'activar';
    this.modal.confirm({
      nzTitle: `¿Está seguro de ${accion} a este usuario?`,
      nzContent: `El usuario <b>${target.nombreCompleto}</b> (${target.email}) ${
        target.esActivo ? 'ya no podrá iniciar sesión en el sistema.' : 'recuperará el acceso al sistema.'
      }`,
      nzOkText: target.esActivo ? 'Desactivar' : 'Activar',
      nzOkDanger: target.esActivo,
      nzOnOk: () => {
        this.usuarioService.cambiarEstado(target.id, !target.esActivo).subscribe({
          next: () => {
            this.message.success(`Usuario ${target.esActivo ? 'desactivado' : 'activado'} correctamente.`);
            this.cargarUsuarios();
          },
          error: (err) => {
            this.message.error(err.error?.message || `No se pudo ${accion} al usuario.`);
          },
        });
      },
    });
  }

  // Helpers de UI
  getIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  getRolTagColor(codigo: string): string {
    switch (codigo) {
      case 'SuperAdmin':
        return 'purple';
      case 'Gerencia':
        return 'gold';
      case 'RrhhAdmin':
        return 'blue';
      case 'RrhhAsistente':
        return 'cyan';
      default:
        return 'default';
    }
  }

  getNombreRolVisible(codigo: string): string {
    const r = this.rolesDisponibles.find((x) => x.codigo === codigo);
    return r ? r.nombreVisible : codigo;
  }
}
