using System;
using ProgrammingCar.Modules.ServicioCampo.Domain.Enums;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Dtos;

public record MotivoIncidenciaDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    AmbitoMotivo Ambito,
    bool Activo);
