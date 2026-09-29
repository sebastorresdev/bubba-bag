export interface AlmacenDto {
  id: string;
  nombre: string;
  descripcion?: string | null;
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
}

export interface UpdateAlmacenDto {
  nombre: string;
  descripcion?: string | null;
}

export interface ResumenStockAlmacenDto {
  almacenId: string;
  nombreAlmacen: string;
  activo: boolean;
  totalProductos: number;
  totalUnidades: number;
  totalSeries: number;
}
