using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Clientes.Commands.CambiarEstadoCliente;

public record CambiarEstadoClienteCommand(Guid Id, bool Activo) : ICommand<Result>;
