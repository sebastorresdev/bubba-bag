using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.EliminarTipoTareaServicio;

public record EliminarTipoTareaServicioCommand(Guid Id) : ICommand<Result>;
