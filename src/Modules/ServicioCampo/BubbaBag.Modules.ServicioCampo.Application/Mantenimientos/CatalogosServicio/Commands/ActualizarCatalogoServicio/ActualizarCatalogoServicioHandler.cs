using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Commands.ActualizarCatalogoServicio;

public class ActualizarCatalogoServicioHandler : ICommandHandler<ActualizarCatalogoServicioCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarCatalogoServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarCatalogoServicioCommand request, CancellationToken cancellationToken = default)
    {
        var catalogo = await _context.CatalogosServicio
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (catalogo == null)
        {
            return Result.Failure($"No se encontró el catálogo de servicios con ID '{request.Id}'.");
        }

        var existeNombre = await _context.CatalogosServicio
            .AnyAsync(c => c.Id != request.Id && c.Nombre.ToLower() == request.Nombre.Trim().ToLower(), cancellationToken);

        if (existeNombre)
        {
            return Result.Failure($"Ya existe otro catálogo con el nombre '{request.Nombre}'.");
        }

        catalogo.Actualizar(request.Nombre, request.ClienteId, request.Descripcion);

        if (request.Activo)
            catalogo.Activar();
        else
            catalogo.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
