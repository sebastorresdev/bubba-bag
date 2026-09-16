using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CambiarEstadoTipoOrdenTrabajo;

public record CambiarEstadoTipoOrdenTrabajoCommand(Guid Id, bool Activo) : ICommand<Result>;
