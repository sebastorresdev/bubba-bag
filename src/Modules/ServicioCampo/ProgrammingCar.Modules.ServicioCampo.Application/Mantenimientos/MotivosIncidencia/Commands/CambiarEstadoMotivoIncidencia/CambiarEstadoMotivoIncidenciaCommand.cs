using System;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CambiarEstadoMotivoIncidencia;

public record CambiarEstadoMotivoIncidenciaCommand(Guid Id, bool Activo) : ICommand<Result>;
