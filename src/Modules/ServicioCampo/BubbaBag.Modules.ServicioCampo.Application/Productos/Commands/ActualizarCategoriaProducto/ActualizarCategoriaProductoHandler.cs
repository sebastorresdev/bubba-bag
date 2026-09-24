using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarCategoriaProducto;

public record ActualizarCategoriaProductoCommand(
    Guid Id,
    string Nombre,
    string? Familia = null,
    string? Descripcion = null
) : ICommand<Result>;

public class ActualizarCategoriaProductoHandler : ICommandHandler<ActualizarCategoriaProductoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarCategoriaProductoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarCategoriaProductoCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result.Failure("El nombre es obligatorio.");

        var categoria = await _context.CategoriasProducto
            .FirstOrDefaultAsync(c => c.Id == command.Id, cancellationToken);

        if (categoria is null)
            return Result.Failure("La categoría especificada no existe.");

        categoria.Actualizar(command.Nombre, command.Familia, command.Descripcion);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
