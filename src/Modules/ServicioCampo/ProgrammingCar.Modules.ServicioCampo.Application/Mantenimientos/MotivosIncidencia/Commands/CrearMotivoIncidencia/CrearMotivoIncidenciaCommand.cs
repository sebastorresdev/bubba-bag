using System;
using ProgrammingCar.Modules.ServicioCampo.Domain.Enums;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CrearMotivoIncidencia;

public record CrearMotivoIncidenciaCommand(
    string Codigo,
    string Nombre,
    AmbitoMotivo Ambito,
    string? Descripcion = null
) : ICommand<Result<Guid>>;
