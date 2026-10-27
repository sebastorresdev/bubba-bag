using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CambiarEstadoTipoOrdenTrabajo;

public record CambiarEstadoTipoOrdenTrabajoCommand(Guid Id, bool Activo) : ICommand<Result>;
