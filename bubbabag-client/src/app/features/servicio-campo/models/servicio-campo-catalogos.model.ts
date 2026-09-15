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

// 2. Orígenes de Orden (Siebel, SGA, Mesa de Ayuda, etc.)
export interface OrigenOrdenDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  esIntegracionExterna: boolean;
  activo: boolean;
}

export interface CrearOrigenOrdenCommand {
  codigo: string;
  nombre: string;
  esIntegracionExterna: boolean;
  descripcion?: string;
}

export interface ActualizarOrigenOrdenRequest {
  nombre: string;
  esIntegracionExterna: boolean;
  descripcion?: string;
}

// 3. Tipos de Orden de Trabajo
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

// 4. Tipos de Tarea de Servicio
export interface TipoTareaServicioDto {
  id: string;
  codigoTarea: string;
  nombre: string;
  categoria: string;
  duracionEstimadaMinutos: number;
  esTareaSiebel: boolean;
  activo: boolean;
}

export interface CrearTipoTareaServicioCommand {
  codigoTarea: string;
  nombre: string;
  categoria: string;
  duracionEstimadaMinutos: number;
  esTareaSiebel: boolean;
}

export interface ActualizarTipoTareaServicioRequest {
  nombre: string;
  categoria: string;
  duracionEstimadaMinutos: number;
  esTareaSiebel: boolean;
}

export interface CambiarEstadoCatalogoRequest {
  activo: boolean;
}
