using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.EliminarTipoOrdenTrabajo;

public record EliminarTipoOrdenTrabajoCommand(Guid Id) : ICommand<Result>;
