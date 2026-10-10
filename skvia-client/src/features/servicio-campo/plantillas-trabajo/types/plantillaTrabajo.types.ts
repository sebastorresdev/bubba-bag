export interface PlantillaTrabajoListadoDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  duracionEstimadaMinutos: number;
  esPredeterminada: boolean;
  activo: boolean;
  cantidadTareas: number;
  cantidadMateriales: number;
  createdAt: string;
}

export interface PlantillaTrabajoDetalleDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  duracionEstimadaMinutos: number;
  esPredeterminada: boolean;
  activo: boolean;
  createdAt: string;
  tareas: PlantillaTareaItemDto[];
  materiales: PlantillaMaterialItemDto[];
}

export interface PlantillaTareaItemDto {
  id: string;
  tareaId: string;
  tareaCodigo: string;
  tareaNombre: string;
  ordenSecuencia: number;
  esObligatoria: boolean;
  requiereEvidencia: boolean;
  instrucciones?: string;
  duracionEstimadaMinutos: number;
}

export interface PlantillaMaterialItemDto {
  id: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  cantidadPrevista: number;
  esObligatorio: boolean;
  observaciones?: string;
  esSerializado: boolean;
  unidadMedida: string;
}

export interface GuardarPlantillaTrabajoDto {
  codigo?: string;
  nombre: string;
  productoId: string;
  duracionEstimadaMinutos: number;
  descripcion?: string;
  esPredeterminada: boolean;
  tareas: {
    tareaId: string;
    ordenSecuencia: number;
    esObligatoria: boolean;
    requiereEvidencia: boolean;
    instrucciones?: string;
  }[];
  materiales: {
    productoId: string;
    cantidadPrevista: number;
    esObligatorio: boolean;
    observaciones?: string;
  }[];
}

export interface TareaDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  duracionEstimadaMinutos: number;
  requiereEvidenciaFotografica: boolean;
  activo: boolean;
}

export interface GuardarTareaDto {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  duracionEstimadaMinutos: number;
  requiereEvidenciaFotografica: boolean;
}
