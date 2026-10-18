export type TipoAlmacen = 1 | 2; // 1: Bodega, 2: Custodia personal

export interface AlmacenDto {
  id: string;
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  tipo?: TipoAlmacen;
  tipoNombre?: string;
  unidadOrganizativaId?: string | null;
  unidadOrganizativaNombre?: string | null;
  almacenPadreId?: string | null;
  almacenPadreNombre?: string | null;
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
  almacenPadreId?: string | null;
  recursoId?: string | null;
}

export interface UpdateAlmacenDto {
  nombre: string;
  descripcion?: string | null;
  codigo?: string | null;
  tipo?: TipoAlmacen;
  unidadOrganizativaId?: string | null;
  almacenPadreId?: string | null;
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
  permiteReingreso?: boolean;
  mensaje?: string | null;
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

export type TipoUbicacion = 'Disponible' | 'Devolucion';

export interface UbicacionInventarioDto {
  id: string;
  almacenId: string;
  codigo: string;
  nombre: string;
  esPrincipal: boolean;
  tipoUbicacion: number; // 1 = Disponible, 2 = Devolucion
  tipoUbicacionNombre: TipoUbicacion;
  ubicacionPadreId?: string | null;
  activa: boolean;
}

export interface CrearUbicacionDto {
  codigo: string;
  nombre: string;
  tipoUbicacion?: TipoUbicacion;
  ubicacionPadreId?: string | null;
}

export interface ReubicarMaterialDto {
  ubicacionOrigenId: string;
  ubicacionDestinoId: string;
  productoId: string;
  cantidad: number;
  series?: string[];
  observaciones?: string;
}

export interface DeclararDoaItemDto {
  serie: string;
  motivoRetiroId?: string;
  observaciones?: string;
}

export interface DeclararDoaDto {
  ubicacionOrigenId: string;
  ubicacionDestinoId: string;
  motivoRetiroId?: string;
  series: string[];
  items?: DeclararDoaItemDto[];
  observaciones?: string;
}

export interface SerieDisponibleAlmacenDto {
  id: string;
  numeroSerie: string;
  numeroSmartCard?: string | null;
  macAddress?: string | null;
  productoId: string;
  productoNombre: string;
  productoCodigo: string;
  ubicacionActualId: string;
  ubicacionNombre: string;
  ubicacionCodigo: string;
  observaciones?: string | null;
}

export interface ItemDoaDto {
  id: string;
  productoId: string;
  productoNombre: string;
  productoCodigo: string;
  numeroSerie: string;
  numeroSmartCard?: string | null;
  motivo?: string | null;
  observaciones?: string | null;
  condicion: string;
}

export interface DocumentoDoaDto {
  id: string;
  numero: string;
  fecha: string;
  almacenId: string;
  almacenNombre: string;
  ubicacionOrigenNombre: string;
  ubicacionDestinoNombre: string;
  totalEquipos: number;
  estado: string;
  usuarioNombre?: string | null;
  observaciones?: string | null;
  items: ItemDoaDto[];
}

export type ReclasificacionDoaDto = DocumentoDoaDto;

