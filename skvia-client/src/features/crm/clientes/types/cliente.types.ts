export type TipoPersona = 'NATURAL' | 'JURIDICA';
export type TipoDocumentoIdentidad = 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';

export interface ClienteListadoItemDto {
  id: string;
  codigoCliente: string;
  codigoExterno?: string | null;
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
  contactoPrincipalId?: string | null;
  contactoPrincipalNombre?: string | null;
}

export interface ClienteDetalleDto {
  id: string;
  codigoCliente: string;
  codigoExterno?: string | null;
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
  contactoPrincipalId?: string | null;
  contactoPrincipalNombre?: string | null;
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
  contactoPrincipalId?: string | null;
  codigoExterno?: string;
}

export interface ActualizarClienteDto {
  nombreCuenta?: string;
  documentoIdentidad?: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  email?: string;
  direccion: string;
  ubigeoCodigo: string;
  referenciaUbicacion?: string;
  coordenadaLat?: number;
  coordenadaLng?: number;
  esClienteFacturacion: boolean;
  esClienteServicio: boolean;
  contactoPrincipalId?: string | null;
  codigoExterno?: string;
}

export interface ContactoDto {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  cargo?: string | null;
  cuentaId?: string | null;
  cuentaNombre?: string | null;
  email?: string | null;
  telefonoMovil: string;
  telefonoTrabajo?: string | null;
  direccion?: string | null;
  ubigeoCodigo?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  activo: boolean;
}

export interface CrearContactoDto {
  nombres: string;
  apellidos: string;
  telefonoMovil: string;
  cargo?: string;
  cuentaId?: string | null;
  email?: string;
  telefonoTrabajo?: string;
  direccion?: string;
  ubigeoCodigo?: string;
}

export interface ActualizarContactoDto {
  nombres: string;
  apellidos: string;
  telefonoMovil: string;
  cargo?: string;
  cuentaId?: string | null;
  email?: string;
  telefonoTrabajo?: string;
  direccion?: string;
  ubigeoCodigo?: string;
}

export interface UbigeoDto {
  codigo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  capitalLegal?: string;
  regionNatural?: string;
}
