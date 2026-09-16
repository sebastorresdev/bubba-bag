using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.CambiarEstadoTipoTareaServicio;

public record CambiarEstadoTipoTareaServicioCommand(Guid Id, bool Activo) : ICommand<Result>;
