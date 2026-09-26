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
    Guid? CategoriaPadreId = null,
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

        if (command.CategoriaPadreId.HasValue && command.CategoriaPadreId.Value == command.Id)
            return Result.Failure("Una categoría no puede ser su propia categoría padre.");

        var categoria = await _context.CategoriasProducto
            .FirstOrDefaultAsync(c => c.Id == command.Id, cancellationToken);

        if (categoria is null)
            return Result.Failure("La categoría especificada no existe.");

        if (command.CategoriaPadreId.HasValue)
        {
            var existePadre = await _context.CategoriasProducto
                .AnyAsync(c => c.Id == command.CategoriaPadreId.Value, cancellationToken);
            if (!existePadre)
                return Result.Failure("La categoría padre seleccionada no existe.");
        }

        categoria.Actualizar(command.Nombre, command.CategoriaPadreId, command.Descripcion);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
