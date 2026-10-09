export type TipoPersona = 'NATURAL' | 'JURIDICA';
export type TipoDocumentoIdentidad = 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';

export interface ClienteListadoItemDto {
  id: string;
  codigoCliente: string;
  tipoPersona: TipoPersona;
  tipoDocumento: TipoDocumentoIdentidad;
  documentoIdentidad: string;
  nombres: string;
  apellidos?: string | null;
  razonSocial?: string | null;
  nombreCompletoODenominacion: string;
  telefonoPrincipal: string;
  email?: string | null;
  direccion: string;
  ubigeoCodigo: string;
  distrito: string;
  provincia: string;
  departamento: string;
  esClienteFacturacion: boolean;
  esClienteServicio: boolean;
  activo: boolean;
}

export interface ClienteDetalleDto {
  id: string;
  codigoCliente: string;
  tipoPersona: TipoPersona;
  tipoDocumento: TipoDocumentoIdentidad;
  documentoIdentidad: string;
  nombres: string;
  apellidos?: string | null;
  razonSocial?: string | null;
  nombreCompletoODenominacion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string | null;
  email?: string | null;
  direccion: string;
  ubigeoCodigo: string;
  distrito: string;
  provincia: string;
  departamento: string;
  referenciaUbicacion?: string | null;
  coordenadaLat?: number | null;
  coordenadaLng?: number | null;
  esClienteFacturacion: boolean;
  esClienteServicio: boolean;
  activo: boolean;
}

export interface CrearClienteDto {
  documentoIdentidad: string;
  nombres: string;
  apellidos?: string;
  telefonoPrincipal: string;
  direccion: string;
  ubigeoCodigo: string;
  esClienteFacturacion?: boolean;
  esClienteServicio?: boolean;
  tipoDocumento?: TipoDocumentoIdentidad;
  tipoPersona?: TipoPersona;
  razonSocial?: string;
  telefonoSecundario?: string;
  email?: string;
  referenciaUbicacion?: string;
  coordenadaLat?: number;
  coordenadaLng?: number;
}

export interface ActualizarClienteDto {
  telefonoPrincipal: string;
  direccion: string;
  ubigeoCodigo: string;
  referenciaUbicacion?: string;
  coordenadaLat?: number;
  coordenadaLng?: number;
  esClienteFacturacion: boolean;
  esClienteServicio: boolean;
}

export interface UbigeoDto {
  codigo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  capitalLegal?: string;
  regionNatural?: string;
}
