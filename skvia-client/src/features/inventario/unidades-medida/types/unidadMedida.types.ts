// ── Tipos base ──

export interface UnidadMedidaDto {
  id: string;
  grupoUnidadMedidaId: string;
  nombreGrupo: string;
  nombre: string;
  esUnidadBase: boolean;
  unidadMedidaBaseId?: string | null;
  cantidad: number;
  factorConversionTotal: number;
  estaActivo: boolean;

}

export interface GrupoUnidadMedidaDto {
  id: string;
  nombre: string;
  observacion?: string | null;
  estaActivo: boolean;
  fechaCreacion: string;
  fechaModificacion?: string | null;
  unidades: UnidadMedidaDto[];
}

export interface GrupoUnidadMedidaResumenDto {
  id: string;
  nombre: string;
  estaActivo: boolean;
  cantidadUnidades: number;
}

// ── DTOs de creación/edición ──

export interface CreateGrupoUnidadMedidaDto {
  nombre: string;
  nombreUnidadBase: string;
}

export interface UpdateGrupoUnidadMedidaDto {
  nombre: string;
  observacion?: string | null;
}

export interface AgregarUnidadMedidaDto {
  nombre: string;
  unidadMedidaBaseId: string;
  cantidad: number;
}

export interface UnidadMedidaReferenciaDto {
  id: string;
  nombre: string;
  factorConversionTotal: number;
  esUnidadBase: boolean;
}

export interface CreateUnidadMedidaDto {
  nombre: string;
  grupoUnidadMedidaId?: string;
  unidadMedidaBaseId?: string;
  cantidad?: number;
}

export interface UpdateUnidadMedidaDto {
  nombre: string;
  unidadMedidaBaseId: string;
  cantidad: number;
}
