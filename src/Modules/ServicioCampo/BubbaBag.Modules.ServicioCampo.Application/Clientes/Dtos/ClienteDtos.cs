using System;
using System.Collections.Generic;

namespace BubbaBag.Modules.ServicioCampo.Application.Clientes.Dtos;

public record ClienteListadoItemDto(
    Guid Id,
    string CodigoCliente,
    string TipoPersona,
    string TipoDocumento,
    string DocumentoIdentidad,
    string Nombres,
    string? Apellidos,
    string? RazonSocial,
    string NombreCompletoODenominacion,
    string TelefonoPrincipal,
    string? Email,
    string Direccion,
    string UbigeoCodigo,
    string Distrito,
    string Provincia,
    string Departamento,
    bool EsClienteFacturacion,
    bool EsClienteServicio,
    bool Activo,
    Guid? ContactoPrincipalId = null,
    string? ContactoPrincipalNombre = null,
    string? CodigoExterno = null
);

public record ClienteDetalleDto(
    Guid Id,
    string CodigoCliente,
    string TipoPersona,
    string TipoDocumento,
    string DocumentoIdentidad,
    string Nombres,
    string? Apellidos,
    string? RazonSocial,
    string NombreCompletoODenominacion,
    string TelefonoPrincipal,
    string? TelefonoSecundario,
    string? Email,
    string Direccion,
    string UbigeoCodigo,
    string Distrito,
    string Provincia,
    string Departamento,
    string? ReferenciaUbicacion,
    decimal? CoordenadaLat,
    decimal? CoordenadaLng,
    bool EsClienteFacturacion,
    bool EsClienteServicio,
    bool Activo,
    Guid? ContactoPrincipalId = null,
    string? ContactoPrincipalNombre = null,
    IReadOnlyList<ContactoDto>? Contactos = null,
    string? CodigoExterno = null
);

public record ContactoDto(
    Guid Id,
    string Nombres,
    string Apellidos,
    string NombreCompleto,
    string? Cargo,
    Guid? CuentaId,
    string? CuentaNombre,
    string? Email,
    string TelefonoMovil,
    string? TelefonoTrabajo,
    string? Direccion,
    string? UbigeoCodigo,
    string? Distrito,
    string? Provincia,
    string? Departamento,
    bool Activo,
    DateTime CreatedAt
);

public record CrearContactoRequest(
    string Nombres,
    string Apellidos,
    string TelefonoMovil,
    string? Cargo = null,
    Guid? CuentaId = null,
    string? Email = null,
    string? TelefonoTrabajo = null,
    string? Direccion = null,
    string? UbigeoCodigo = null
);

public record ActualizarContactoRequest(
    string Nombres,
    string Apellidos,
    string TelefonoMovil,
    string? Cargo = null,
    Guid? CuentaId = null,
    string? Email = null,
    string? TelefonoTrabajo = null,
    string? Direccion = null,
    string? UbigeoCodigo = null
);
