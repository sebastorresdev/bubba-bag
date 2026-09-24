export interface UnidadMedidaDto {
  id: string;
  codigo: string;
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  descripcion?: string;
  activo: boolean;
}

export interface CrearUnidadMedidaRequest {
  codigo: string;
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  descripcion?: string;
}

export interface ActualizarUnidadMedidaRequest {
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  descripcion?: string;
}

export interface CategoriaProductoDto {
  id: string;
  nombre: string;
  familia?: string;
  descripcion?: string;
  activo: boolean;
}

export interface CrearCategoriaProductoRequest {
  nombre: string;
  familia?: string;
  descripcion?: string;
}

export interface ActualizarCategoriaProductoRequest {
  nombre: string;
  familia?: string;
  descripcion?: string;
}
