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
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiereVisitaCampo: boolean;
  exigeFirmaCliente: boolean;
  exigeEvidenciasFotograficas: boolean;
  colorHex: string;
  activo: boolean;
}

export interface CrearTipoOrdenTrabajoCommand {
  codigo: string;
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

// 3. Tipos de Tarea de Servicio (Catálogo de Prestaciones Técnicas por Cliente Facturable)
export interface TipoTareaServicioDto {
  id: string;
  codigoTarea: string;
  nombre: string;
  clienteFacturacionId: string;
  clienteFacturacionNombre?: string;
  clienteFacturacionCodigo?: string;
  duracionEstimadaMinutos: number;
  activo: boolean;
}

export interface CrearTipoTareaServicioCommand {
  codigoTarea: string;
  nombre: string;
  clienteFacturacionId: string;
  duracionEstimadaMinutos: number;
}

export interface ActualizarTipoTareaServicioRequest {
  nombre: string;
  clienteFacturacionId: string;
  duracionEstimadaMinutos: number;
}

export interface CambiarEstadoCatalogoRequest {
  activo: boolean;
}
