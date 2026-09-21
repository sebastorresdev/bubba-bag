using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Commands.ActualizarCatalogoServicio;

public record ActualizarCatalogoServicioCommand(
    Guid Id,
    string Nombre,
    Guid? ClienteId,
    string? Descripcion,
    bool Activo
) : ICommand<Result>;
