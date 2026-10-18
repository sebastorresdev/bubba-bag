export type TipoRetiroEquipo =
  | 'AveriaTecnica'
  | 'CambioTecnologia'
  | 'BajaComercial'
  | 'DanoSiniestro'
  | 'DefectoFabricaDOA'
  | 'ObsolescenciaEOL'
  | 'PreventivoDescarte'
  | 'AdministrativoAuditoria';

export interface MotivoRetiroEquipoDto {
  id: string;
  nombre: string;
  tipoRetiro: TipoRetiroEquipo;
  descripcion?: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CrearMotivoRetiroEquipoDto {
  nombre: string;
  tipoRetiro: TipoRetiroEquipo;
  descripcion?: string | null;
}

export interface ActualizarMotivoRetiroEquipoDto {
  nombre: string;
  tipoRetiro: TipoRetiroEquipo;
  descripcion?: string | null;
}

export interface TipoRetiroInfo {
  value: TipoRetiroEquipo;
  label: string;
  badgeLabel: string;
  descripcion: string;
  esOperativo: boolean; // Indica si el equipo típicamente está operativo al retirarse
  badgeAppearance: 'filled' | 'tint' | 'outline';
  badgeColor: 'danger' | 'informative' | 'subtle' | 'warning' | 'important' | 'brand';
}

export const TIPOS_RETIRO_EQUIPO_INFO: Record<TipoRetiroEquipo, TipoRetiroInfo> = {
  AveriaTecnica: {
    value: 'AveriaTecnica',
    label: 'Avería Técnica (Componentes / Hardware)',
    badgeLabel: 'Avería Técnica',
    descripcion: 'Falla técnica de componentes (fuente, tuner, disco, no enciende). Cubierto por garantía estándar.',
    esOperativo: false,
    badgeAppearance: 'tint',
    badgeColor: 'danger',
  },
  CambioTecnologia: {
    value: 'CambioTecnologia',
    label: 'Cambio de Tecnología (Upgrade / Downgrade)',
    badgeLabel: 'Cambio Tecnología',
    descripcion: 'Equipo operativo retirado por migración de tecnología o reducción de decos.',
    esOperativo: true,
    badgeAppearance: 'tint',
    badgeColor: 'brand',
  },
  BajaComercial: {
    value: 'BajaComercial',
    label: 'Baja Comercial (Cancelación / Morosidad)',
    badgeLabel: 'Baja Comercial',
    descripcion: 'Cancelación de contrato o corte. Equipo recuperado 100% operativo.',
    esOperativo: true,
    badgeAppearance: 'tint',
    badgeColor: 'subtle',
  },
  DanoSiniestro: {
    value: 'DanoSiniestro',
    label: 'Daño Físico / Siniestro (No Cubierto)',
    badgeLabel: 'Daño / Siniestro',
    descripcion: 'Golpes, derrame de líquidos o sobretensión imputable al cliente. Fuera de garantía.',
    esOperativo: false,
    badgeAppearance: 'filled',
    badgeColor: 'danger',
  },
  DefectoFabricaDOA: {
    value: 'DefectoFabricaDOA',
    label: 'Defecto de Fábrica / DOA (Dead On Arrival)',
    badgeLabel: 'Fábrica / DOA',
    descripcion: 'Equipo nuevo que falló durante la primera instalación. Aplica garantía directa con proveedor.',
    esOperativo: false,
    badgeAppearance: 'tint',
    badgeColor: 'warning',
  },
  ObsolescenciaEOL: {
    value: 'ObsolescenciaEOL',
    label: 'Fin de Vida Útil / Obsolescencia (EOL)',
    badgeLabel: 'Obsolescencia EOL',
    descripcion: 'Apagón de tecnología antigua o descontinuada. Destinado a disposición o chatarreo.',
    esOperativo: false,
    badgeAppearance: 'tint',
    badgeColor: 'important',
  },
  PreventivoDescarte: {
    value: 'PreventivoDescarte',
    label: 'Preventivo / Descarte (No Fault Found)',
    badgeLabel: 'Preventivo',
    descripcion: 'Cambio por sospecha de falla intermitente durante visita. Requiere validación técnica en laboratorio.',
    esOperativo: true,
    badgeAppearance: 'tint',
    badgeColor: 'informative',
  },
  AdministrativoAuditoria: {
    value: 'AdministrativoAuditoria',
    label: 'Administrativo / Auditoría (Custodia)',
    badgeLabel: 'Auditoría',
    descripcion: 'Retención por discrepancia serial, sospecha de clonación o requerimiento legal.',
    esOperativo: false,
    badgeAppearance: 'tint',
    badgeColor: 'warning',
  },
};
