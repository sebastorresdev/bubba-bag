export type TipoAlmacen = 'Fisico' | 'Movil';

export interface AlmacenDto {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoAlmacen;
  direccion?: string;
  telefono?: string;
  sucursalId?: string;
  recursoTecnicoId?: string;
  activo: boolean;
}

export interface CrearAlmacenRequest {
  codigo: string;
  nombre: string;
  tipo: TipoAlmacen;
  sucursalId?: string;
  direccion?: string;
  telefono?: string;
  recursoTecnicoId?: string;
}

export interface ActualizarAlmacenRequest {
  nombre: string;
  direccion?: string;
  telefono?: string;
  sucursalId?: string;
}

export interface ResumenAlmacenMovilDto {
  almacenId: string;
  codigoAlmacen: string;
  nombreAlmacen: string;
  recursoTecnicoId?: string;
  activo: boolean;
  totalProductos: number;
  totalUnidades: number;
  totalSeries: number;
}

