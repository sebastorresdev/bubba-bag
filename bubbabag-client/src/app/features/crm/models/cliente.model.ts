export interface ClienteListadoItemDto {
  id: string;
  codigoCliente: string;
  tipoPersona: 'NATURAL' | 'JURIDICA';
  tipoDocumento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  documentoIdentidad: string;
  nombres: string;
  apellidos?: string;
  razonSocial?: string;
  nombreCompletoODenominacion: string;
  telefonoPrincipal: string;
  email?: string;
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
  tipoPersona: 'NATURAL' | 'JURIDICA';
  tipoDocumento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  documentoIdentidad: string;
  nombres: string;
  apellidos?: string;
  razonSocial?: string;
  nombreCompletoODenominacion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  email?: string;
  direccion: string;
  ubigeoCodigo: string;
  distrito: string;
  provincia: string;
  departamento: string;
  referenciaUbicacion?: string;
  coordenadaLat?: number;
  coordenadaLng?: number;
  esClienteFacturacion: boolean;
  esClienteServicio: boolean;
  activo: boolean;
}

export interface CrearClienteCommand {
  codigoCliente: string;
  documentoIdentidad: string;
  nombres: string;
  apellidos?: string;
  telefonoPrincipal: string;
  direccion: string;
  ubigeoCodigo: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  esClienteFacturacion?: boolean;
  esClienteServicio?: boolean;
  tipoDocumento?: string;
  tipoPersona?: string;
  razonSocial?: string;
  telefonoSecundario?: string;
  email?: string;
  referenciaUbicacion?: string;
  coordenadaLat?: number;
  coordenadaLng?: number;
}

export interface ActualizarClienteRequest {
  telefonoPrincipal: string;
  direccion: string;
  ubigeoCodigo: string;
  referenciaUbicacion?: string;
  coordenadaLat?: number;
  coordenadaLng?: number;
}

export interface UbigeoItemDto {
  codigo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  capitalLegal?: string;
  regionNatural?: string;
}
