// =============================================================================
// BubbaBag ERP - Modelos de Catálogos de Servicio de Campo (Field Service)
// =============================================================================

export enum AmbitoMotivo {
  Visita = 1,
  OrdenTrabajo = 2,
  Tarea = 3,
}

export const AmbitoMotivoLabels: Record<AmbitoMotivo, string> = {
  [AmbitoMotivo.Visita]: 'Visita en Campo',
  [AmbitoMotivo.OrdenTrabajo]: 'Orden de Trabajo',
  [AmbitoMotivo.Tarea]: 'Subtarea Técnica',
};

// 1. Motivos de Incidencia / Cancelación
export interface MotivoIncidenciaDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  ambito: AmbitoMotivo;
  activo: boolean;
}

export interface CrearMotivoIncidenciaCommand {
  codigo: string;
  nombre: string;
  ambito: AmbitoMotivo;
  descripcion?: string;
}

export interface ActualizarMotivoIncidenciaRequest {
  nombre: string;
  ambito: AmbitoMotivo;
  descripcion?: string;
}

// 2. Tipos de Orden de Trabajo (Modalidad Operativa: CAMPO, ENCOMIENDA, REMOTO)
export interface TipoOrdenTrabajoDto {
  id: string;
  nombre: string;
  descripcion?: string;
  requiereVisitaCampo: boolean;
  exigeFirmaCliente: boolean;
  exigeEvidenciasFotograficas: boolean;
  colorHex: string;
  activo: boolean;
}

export interface CrearTipoOrdenTrabajoCommand {
  nombre: string;
  requiereVisitaCampo: boolean;
  exigeFirmaCliente: boolean;
  exigeEvidenciasFotograficas: boolean;
  descripcion?: string;
  colorHex: string;
}

export interface ActualizarTipoOrdenTrabajoRequest {
  nombre: string;
  requiereVisitaCampo: boolean;
  exigeFirmaCliente: boolean;
  exigeEvidenciasFotograficas: boolean;
  descripcion?: string;
  colorHex: string;
}

// =============================================================================
// 2.1 Catálogos de Servicios (Agrupadores / Contratantes)
// =============================================================================
export interface CatalogoServicioDto {
  id: string;
  nombre: string;
  descripcion?: string;
  contratanteId?: string | null;
  contratanteNombre?: string | null;
  cantidadServicios: number;
  activo: boolean;
}

export interface CrearCatalogoServicioCommand {
  nombre: string;
  contratanteId?: string | null;
  descripcion?: string | null;
}

export interface ActualizarCatalogoServicioRequest {
  nombre: string;
  contratanteId?: string | null;
  descripcion?: string | null;
  activo: boolean;
}

// =============================================================================
// 2.2 Servicios / Plantillas (Checklist, Fotos, Materiales, Sucursales)
// =============================================================================
export enum TipoEvidenciaPaso {
  Check = 1,
  Foto = 2,
  Texto = 3,
  Firma = 4
}

export const TipoEvidenciaPasoLabels: Record<TipoEvidenciaPaso, string> = {
  [TipoEvidenciaPaso.Check]: 'Check / Confirmación',
  [TipoEvidenciaPaso.Foto]: 'Fotografía Obligatoria',
  [TipoEvidenciaPaso.Texto]: 'Entrada de Texto / Serial',
  [TipoEvidenciaPaso.Firma]: 'Firma Digital'
};

export interface ServicioPasoDto {
  id?: string;
  numeroPaso: number;
  descripcion: string;
  requiereFoto: boolean;
  tipoEvidencia: TipoEvidenciaPaso;
  esObligatorio: boolean;
}

export interface ServicioMaterialDto {
  id?: string;
  productoId: string;
  productoCodigo?: string;
  productoNombre?: string;
  cantidadTeorica: number;
  unidadMedida: string;
}

export interface SucursalServicioDto {
  id?: string;
  sucursalId: string;
  sucursalNombre?: string;
  sucursalCiudad?: string;
  habilitado: boolean;
}

export interface ServicioItemDto {
  id: string;
  codigo: string;
  nombre: string;
  catalogoServicioId: string;
  catalogoServicioNombre: string;
  duracionEstimadaMinutos: number;
  precioBase: number;
  codigoExterno?: string;
  cantidadPasos: number;
  cantidadMateriales: number;
  activo: boolean;
}

export interface ServicioDetalleDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  catalogoServicioId: string;
  catalogoServicioNombre: string;
  duracionEstimadaMinutos: number;
  precioBase: number;
  codigoExterno?: string;
  activo: boolean;
  pasos: ServicioPasoDto[];
  materialesTeoricos: ServicioMaterialDto[];
  sucursalesHabilitadas: SucursalServicioDto[];
}

export interface ServicioPasoInput {
  numeroPaso: number;
  descripcion: string;
  requiereFoto: boolean;
  tipoEvidencia: number;
  esObligatorio: boolean;
}

export interface ServicioMaterialInput {
  productoId: string;
  cantidadTeorica: number;
  unidadMedida: string;
}

export interface CrearServicioRequest {
  codigo: string;
  nombre: string;
  catalogoServicioId: string;
  duracionEstimadaMinutos: number;
  precioBase?: number;
  descripcion?: string;
  codigoExterno?: string;
  pasos?: ServicioPasoInput[];
  materialesTeoricos?: ServicioMaterialInput[];
  sucursalesHabilitadasIds?: string[];
}

export interface ActualizarServicioRequest {
  nombre: string;
  catalogoServicioId: string;
  duracionEstimadaMinutos: number;
  precioBase?: number;
  descripcion?: string;
  codigoExterno?: string;
  activo: boolean;
  pasos?: ServicioPasoInput[];
  materialesTeoricos?: ServicioMaterialInput[];
  sucursalesHabilitadasIds?: string[];
}

// Producto Básico para selección de materiales
export interface ProductoItemDto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  esSerializado: boolean;
  activo: boolean;
}

// 3. Tipos de Tarea de Servicio (Catálogo de Prestaciones Técnicas por Cliente Facturable u Operación Interna)
export interface TipoTareaServicioDto {
  id: string;
  codigoTarea: string;
  nombre: string;
  clienteFacturacionId?: string | null;
  clienteFacturacionNombre?: string;
  clienteFacturacionCodigo?: string;
  duracionEstimadaMinutos: number;
  activo: boolean;
}

export interface CrearTipoTareaServicioCommand {
  codigoTarea: string;
  nombre: string;
  clienteFacturacionId?: string | null;
  duracionEstimadaMinutos: number;
}

export interface ActualizarTipoTareaServicioRequest {
  nombre: string;
  clienteFacturacionId?: string | null;
  duracionEstimadaMinutos: number;
}

export interface CambiarEstadoCatalogoRequest {
  activo: boolean;
}

export interface ImportarServiciosResultadoDto {
  totalLeidos: number;
  totalImportados: number;
  totalActualizados: number;
  totalOmitidos: number;
  errores: string[];
  advertencias: string[];
}


