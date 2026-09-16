using System;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Dtos;

public record MotivoIncidenciaDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    AmbitoMotivo Ambito,
    bool Activo);
