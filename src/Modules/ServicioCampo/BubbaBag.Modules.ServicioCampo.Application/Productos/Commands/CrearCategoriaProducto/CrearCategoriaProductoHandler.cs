using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearCategoriaProducto;

public record CrearCategoriaProductoCommand(
    string Nombre,
    string? Familia = null,
    string? Descripcion = null
) : ICommand<Result<Guid>>;

public class CrearCategoriaProductoHandler : ICommandHandler<CrearCategoriaProductoCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearCategoriaProductoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearCategoriaProductoCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result<Guid>.Failure("El nombre de la categoría es obligatorio.");

        var nombreNormalizado = command.Nombre.Trim();
        var existe = await _context.CategoriasProducto
            .AnyAsync(c => c.Nombre.ToLower() == nombreNormalizado.ToLower(), cancellationToken);

        if (existe)
            return Result<Guid>.Failure($"Ya existe una categoría con el nombre '{nombreNormalizado}'.");

        var categoria = CategoriaProducto.Crear(
            nombreNormalizado,
            command.Familia,
            command.Descripcion
        );

        await _context.CategoriasProducto.AddAsync(categoria, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(categoria.Id);
    }
}
