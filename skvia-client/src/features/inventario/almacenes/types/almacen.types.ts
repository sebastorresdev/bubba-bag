export type TipoAlmacen = 1 | 2; // 1: Bodega, 2: Custodia personal

export interface AlmacenDto {
  id: string;
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  tipo?: TipoAlmacen;
  unidadOrganizativaId?: string | null;
  unidadOrganizativaNombre?: string | null;
  recursoId?: string | null;
  recursoNombre?: string | null;
  puedeDespachar?: boolean;
  esSupervisor?: boolean;
  puedeRecepcionar?: boolean;
  activo: boolean;
  creadoPorId?: string | null;
  creadoPorNombre?: string | null;
  createdAt: string;
  actualizadoPorId?: string | null;
  updatedAt?: string | null;
}

export interface CreateAlmacenDto {
  nombre: string;
  descripcion?: string | null;
  codigo?: string | null;
  tipo?: TipoAlmacen;
  unidadOrganizativaId?: string | null;
  recursoId?: string | null;
}

export interface UpdateAlmacenDto {
  nombre: string;
  descripcion?: string | null;
  codigo?: string | null;
  tipo?: TipoAlmacen;
  unidadOrganizativaId?: string | null;
  recursoId?: string | null;
}

export interface UnidadOrganizativaDto {
  id: string;
  codigo: string;
  nombre: string;
  ciudad?: string | null;
  esSedePrincipal: boolean;
}

export interface RecursoTecnicoDto {
  id: string;
  codigo: string;
  nombreCompleto: string;
  tipo: string;
  unidadOrganizativaId?: string | null;
  almacenMovilId?: string | null;
  email?: string | null;
  telefono?: string | null;
}

export interface SerieExistenteDetalle {
  numeroSerie: string;
  estado: string;
  almacenId?: string | null;
  almacenNombre?: string | null;
  productoNombre: string;
}

export interface ValidarSeriesResponse {
  existentes: SerieExistenteDetalle[];
}

export interface ResumenStockAlmacenDto {
  almacenId: string;
  nombreAlmacen: string;
  activo: boolean;
  totalProductos: number;
  totalUnidades: number;
  totalSeries: number;
}

export interface UbicacionInventarioDto { id:string; almacenId:string; codigo:string; nombre:string; esPrincipal:boolean; activa:boolean; }
