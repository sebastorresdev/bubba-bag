using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.EliminarTipoTareaServicio;

public record EliminarTipoTareaServicioCommand(Guid Id) : ICommand<Result>;
