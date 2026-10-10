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

export interface GuardarTipoOrdenTrabajoDto {
  nombre: string;
  requiereVisitaCampo: boolean;
  exigeFirmaCliente: boolean;
  exigeEvidenciasFotograficas: boolean;
  descripcion?: string;
  colorHex: string;
}
