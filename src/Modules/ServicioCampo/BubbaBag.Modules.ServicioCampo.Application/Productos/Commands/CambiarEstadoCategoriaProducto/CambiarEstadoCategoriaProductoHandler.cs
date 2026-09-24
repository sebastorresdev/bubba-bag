using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CambiarEstadoCategoriaProducto;

public record CambiarEstadoCategoriaProductoCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoCategoriaProductoHandler : ICommandHandler<CambiarEstadoCategoriaProductoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoCategoriaProductoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoCategoriaProductoCommand command, CancellationToken cancellationToken = default)
    {
        var categoria = await _context.CategoriasProducto
            .FirstOrDefaultAsync(c => c.Id == command.Id, cancellationToken);

        if (categoria is null)
            return Result.Failure("La categoría especificada no existe.");

        if (command.Activo)
            categoria.Activar();
        else
            categoria.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
