using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.CatalogosServicio.Commands.CrearCatalogoServicio;

public class CrearCatalogoServicioHandler : ICommandHandler<CrearCatalogoServicioCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearCatalogoServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearCatalogoServicioCommand request, CancellationToken cancellationToken = default)
    {
        var existe = await _context.CatalogosServicio
            .AnyAsync(c => c.Nombre.ToLower() == request.Nombre.Trim().ToLower(), cancellationToken);

        if (existe)
        {
            return Result<Guid>.Failure($"Ya existe un catálogo con el nombre '{request.Nombre}'.");
        }

        var catalogo = CatalogoServicio.Crear(
            request.Nombre,
            request.ClienteId,
            request.Descripcion);

        _context.CatalogosServicio.Add(catalogo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(catalogo.Id);
    }
}
