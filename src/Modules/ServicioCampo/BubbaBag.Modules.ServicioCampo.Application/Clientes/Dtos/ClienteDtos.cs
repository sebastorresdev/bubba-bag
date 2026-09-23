using System;

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
    bool Activo
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
    bool Activo
);
