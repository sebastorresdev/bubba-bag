using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.Crm.Application.Clientes.Commands.CrearCliente;

public record CrearClienteCommand(
    string DocumentoIdentidad,
    string Nombres,
    string? Apellidos,
    string TelefonoPrincipal,
    string Direccion,
    string UbigeoCodigo,
    bool EsClienteFacturacion = false,
    bool EsClienteServicio = true,
    string TipoDocumento = "DNI",
    string TipoPersona = "NATURAL",
    string? RazonSocial = null,
    string? TelefonoSecundario = null,
    string? Email = null,
    string? ReferenciaUbicacion = null,
    decimal? CoordenadaLat = null,
    decimal? CoordenadaLng = null
) : ICommand<Result<Guid>>;
