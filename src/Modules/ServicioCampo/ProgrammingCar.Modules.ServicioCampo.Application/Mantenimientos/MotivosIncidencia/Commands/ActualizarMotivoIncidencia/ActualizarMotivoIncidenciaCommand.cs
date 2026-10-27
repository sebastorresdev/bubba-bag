using System;
using ProgrammingCar.Modules.ServicioCampo.Domain.Enums;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.ActualizarMotivoIncidencia;

public record ActualizarMotivoIncidenciaCommand(
    Guid Id,
    string Nombre,
    AmbitoMotivo Ambito,
    string? Descripcion = null
) : ICommand<Result>;
