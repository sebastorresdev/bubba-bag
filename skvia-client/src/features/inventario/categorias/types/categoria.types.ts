export interface CategoriaProductoDto {
  id: string;
  nombre: string;
  familia?: string | null;
  descripcion?: string | null;
  activo: boolean;
}

export interface CreateCategoriaProductoDto {
  nombre: string;
  familia?: string | null;
  descripcion?: string | null;
}

export interface UpdateCategoriaProductoDto {
  nombre: string;
  familia?: string | null;
  descripcion?: string | null;
}
