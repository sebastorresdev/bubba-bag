using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.CambiarEstadoTipoTareaServicio;

public record CambiarEstadoTipoTareaServicioCommand(Guid Id, bool Activo) : ICommand<Result>;
