using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Clientes.Commands.ActualizarCliente;

public record ActualizarClienteCommand(
    Guid Id,
    string TelefonoPrincipal,
    string Direccion,
    string UbigeoCodigo,
    string? ReferenciaUbicacion = null,
    decimal? CoordenadaLat = null,
    decimal? CoordenadaLng = null,
    bool? EsClienteFacturacion = null,
    bool? EsClienteServicio = null
) : ICommand<Result>;
