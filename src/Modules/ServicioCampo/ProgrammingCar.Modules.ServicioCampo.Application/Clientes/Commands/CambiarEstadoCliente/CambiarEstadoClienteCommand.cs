using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Clientes.Commands.CambiarEstadoCliente;

public record CambiarEstadoClienteCommand(Guid Id, bool Activo) : ICommand<Result>;
