using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.EliminarMotivoIncidencia;

public record EliminarMotivoIncidenciaCommand(Guid Id) : ICommand<Result>;
