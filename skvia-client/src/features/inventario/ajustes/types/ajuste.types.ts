export type TipoAjuste = 'Entrada' | 'Salida';
export type EstadoAjuste = 'Borrador' | 'EnRevision' | 'Aplicado' | 'Anulado';

export const MOTIVOS_AJUSTE = [
  'Diferencia en inventario físico',
  'Merma o deterioro',
  'Pérdida o extravío',
  'Caducidad o desuso',
  'Regularización inicial de existencias',
  'Devolución de cliente no registrada',
  'Error administrativo en documento anterior',
  'Otro',
] as const;

export type MotivoAjuste = typeof MOTIVOS_AJUSTE[number];

export interface LineaAjusteDto {
  id: string;
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  unidad: string;
  stockActual: number;
  tipo: 'Entrada' | 'Salida';
  cantidad: number;
  costoUnitario: number;
  total: number;
  esSerializado: boolean;
  series: string[];
  motivoLinea?: string;
}

export interface AjusteInventarioDto {
  id: string;
  numero: string;
  numeroAprobacion?: string | null;
  tipo: TipoAjuste;
  almacenId: string;
  nombreAlmacen: string;
  ubicacionId?: string | null;
  nombreUbicacion?: string | null;
  fecha: string;
  motivo: string;
  documentoReferencia?: string | null;
  observaciones?: string | null;
  estado: EstadoAjuste;
  totalItems: number;
  totalCantidad: number;
  valorTotal: number;
  usuarioRegistro: string;
  fechaRegistro: string;
  usuarioAprobacion?: string | null;
  fechaAprobacion?: string | null;
  lineas: LineaAjusteDto[];
}

export interface GuardarAjusteInput {
  tipo: TipoAjuste;
  almacenId: string;
  ubicacionId?: string | null;
  fecha: string;
  motivo: string;
  documentoReferencia?: string | null;
  observaciones?: string | null;
  lineas: Array<{
    productoId: string;
    codigoProducto?: string;
    nombreProducto?: string;
    unidad?: string;
    esSerializado?: boolean;
    tipo: 'Entrada' | 'Salida';
    cantidad: number;
    costoUnitario: number;
    series: string[];
    motivoLinea?: string;
  }>;
}
