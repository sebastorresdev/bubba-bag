export interface ConfiguracionServicioListadoDto {
  id: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  duracionEstimadaMinutos: number;
  slaHorasResolucion?: number | null;
  puntos: number;
  esPredeterminada: boolean;
  activo: boolean;
  cantidadTareas: number;
  cantidadMateriales: number;
  createdAt: string;
}

export interface ConfiguracionServicioDetalleDto {
  id: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  duracionEstimadaMinutos: number;
  slaHorasResolucion?: number | null;
  puntos: number;
  esPredeterminada: boolean;
  activo: boolean;
  createdAt: string;
  tareas: ConfiguracionTareaItemDto[];
  materiales: ConfiguracionMaterialItemDto[];
}

export interface ConfiguracionTareaItemDto {
  id: string;
  tareaId: string;
  tareaCodigo?: string;
  tareaNombre: string;
  ordenSecuencia: number;
  esObligatoria: boolean;
  requiereEvidencia: boolean;
  instrucciones?: string;
  duracionEstimadaMinutos: number;
}

export interface ConfiguracionMaterialItemDto {
  id: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  cantidadPrevista: number;
  esObligatorio: boolean;
  observaciones?: string;
  esSerializado: boolean;
  unidadMedida: string;
  unidadMedidaId?: string | null;
}

export interface GuardarConfiguracionServicioDto {
  codigo?: string;
  nombre: string;
  productoId: string;
  duracionEstimadaMinutos: number;
  slaHorasResolucion?: number | null;
  puntos?: number;
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
    unidadMedidaId?: string | null;
  }[];
}

export interface TareaDto {
  id: string;
  codigo?: string;
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
