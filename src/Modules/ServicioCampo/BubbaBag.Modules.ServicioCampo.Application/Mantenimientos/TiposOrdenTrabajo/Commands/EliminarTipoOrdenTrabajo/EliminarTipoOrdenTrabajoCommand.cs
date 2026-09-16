using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.EliminarTipoOrdenTrabajo;

public record EliminarTipoOrdenTrabajoCommand(Guid Id) : ICommand<Result>;
