export interface CategoriaProductoDto {
  id: string;
  nombre: string;
  categoriaPadreId?: string | null;
  categoriaPadreNombre?: string | null;
  descripcion?: string | null;
  activo: boolean;
}

export interface CreateCategoriaProductoDto {
  nombre: string;
  categoriaPadreId?: string | null;
  descripcion?: string | null;
}

export interface UpdateCategoriaProductoDto {
  nombre: string;
  categoriaPadreId?: string | null;
  descripcion?: string | null;
}
