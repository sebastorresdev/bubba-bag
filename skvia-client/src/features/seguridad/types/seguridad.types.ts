export interface UsuarioDto {
  id: string;
  nombreCompleto: string;
  email: string;
  esActivo: boolean;
  roles: string[];
}

export interface PermisoDefinicionDto {
  codigo: string;
  modulo: string;
  titulo: string;
  descripcion: string;
}

export interface RolDto {
  id: string;
  codigo: string;
  modulo: string;
  nombreVisible: string;
  descripcion: string;
  permisos: string[];
  esSistema?: boolean;
  usuariosCount?: number;
}
