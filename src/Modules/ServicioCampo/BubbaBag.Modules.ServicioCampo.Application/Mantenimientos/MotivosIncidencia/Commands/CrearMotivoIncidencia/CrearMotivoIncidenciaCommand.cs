using System;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CrearMotivoIncidencia;

public record CrearMotivoIncidenciaCommand(
    string Codigo,
    string Nombre,
    AmbitoMotivo Ambito,
    string? Descripcion = null
) : ICommand<Result<Guid>>;
