export interface UnidadOrganizativaDto {
  id: string;
  codigo: string;
  nombre: string;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  esSedePrincipal: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateUnidadOrganizativaDto {
  codigo: string;
  nombre: string;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  esSedePrincipal: boolean;
}

export interface UpdateUnidadOrganizativaDto {
  nombre: string;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  esSedePrincipal: boolean;
}

export interface TerritorioDto {
  id: string;
  codigo: string;
  nombre: string;
  unidadOrganizativaId: string;
  unidadOrganizativaNombre: string;
  almacenPredeterminadoId?: string | null;
  almacenPredeterminadoNombre?: string | null;
  descripcionProveedor?: string | null;
  activo: boolean;
}

export interface CreateTerritorioDto {
  codigo: string;
  nombre: string;
  unidadOrganizativaId: string;
  almacenPredeterminadoId?: string | null;
  descripcionProveedor?: string | null;
}

export interface UpdateTerritorioDto {
  nombre: string;
  unidadOrganizativaId: string;
  almacenPredeterminadoId?: string | null;
  descripcionProveedor?: string | null;
}

export interface RecursoDto {
  id: string;
  codigo: string;
  nombreCompleto: string;
  tipo: number; // 1: Tecnico, 2: Cuadrilla, 3: Almacen, 4: Despachador, 5: Territorio, 6: Equipamiento
  tipoNombre: string;
  documentoIdentidad?: string | null;
  telefono?: string | null;
  email?: string | null;
  unidadOrganizativaId?: string | null;
  unidadOrganizativaNombre?: string | null;
  zonaOperativaId?: string | null;
  almacenBaseId?: string | null;
  almacenBaseNombre?: string | null;
  almacenMovilId?: string | null;
  usuarioId?: string | null;
  usuarioNombre?: string | null;
  usuarioEmail?: string | null;
  capacidadMaximaOrdenesPorDia: number;
  colorHex?: string | null;
  activo: boolean;
}

export interface CreateRecursoDto {
  codigo: string;
  nombreCompleto: string;
  tipo: number;
  unidadOrganizativaId?: string | null;
  zonaOperativaId?: string | null;
  almacenBaseId?: string | null;
  almacenMovilId?: string | null;
  usuarioId?: string | null;
  telefono?: string | null;
  documentoIdentidad?: string | null;
  email?: string | null;
  capacidadMaximaOrdenesPorDia?: number;
  colorHex?: string | null;
  notas?: string | null;
}

export interface UpdateRecursoDto {
  nombreCompleto: string;
  tipo: number;
  unidadOrganizativaId?: string | null;
  zonaOperativaId?: string | null;
  almacenBaseId?: string | null;
  almacenMovilId?: string | null;
  usuarioId?: string | null;
  telefono?: string | null;
  documentoIdentidad?: string | null;
  email?: string | null;
  capacidadMaximaOrdenesPorDia?: number;
  colorHex?: string | null;
  notas?: string | null;
}
