export interface UnidadMedidaDto {
  id: string;
  codigo: string;
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  descripcion?: string | null;
  activo: boolean;
}

export interface CreateUnidadMedidaDto {
  codigo: string;
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  descripcion?: string | null;
}

export interface UpdateUnidadMedidaDto {
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  descripcion?: string | null;
}
