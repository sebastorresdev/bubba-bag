using System;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Commands.CrearCatalogoServicio;

public record CrearCatalogoServicioCommand(
    string Nombre,
    Guid? ClienteId,
    string? Descripcion
) : ICommand<Result<Guid>>;
