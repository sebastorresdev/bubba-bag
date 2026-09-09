export interface UsuarioDto {
  id: string;
  email: string;
  nombreCompleto: string;
  esActivo: boolean;
  roles: string[];
}

export interface RolDto {
  id: string;
  codigo: string;
  modulo: string;
  nombreVisible: string;
  descripcion: string;
}

export interface CrearUsuarioRequest {
  email: string;
  password: string;
  nombreCompleto: string;
  roles: string[];
}

export interface ActualizarUsuarioRequest {
  nombreCompleto: string;
  email: string;
}

export interface CambiarPasswordRequest {
  nuevaPassword: string;
}

export interface CambiarEstadoUsuarioRequest {
  esActivo: boolean;
}
