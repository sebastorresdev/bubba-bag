using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Inventario.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Inventario.Application.Productos.Commands.CrearProducto;

public record CrearProductoCommand(
    string Codigo,
    string Nombre,
    string Categoria = "Materiales",
    string UnidadMedida = "Unidades",
    bool EsSerializado = false,
    string? Descripcion = null
) : ICommand<Result<Guid>>;

public class CrearProductoHandler : ICommandHandler<CrearProductoCommand, Result<Guid>>
{
    private readonly IInventarioDbContext _context;

    public CrearProductoHandler(IInventarioDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearProductoCommand command, CancellationToken cancellationToken = default)
    {
        var codigoUpper = command.Codigo.Trim().ToUpperInvariant();
        var existe = await _context.Productos.AnyAsync(p => p.Codigo == codigoUpper, cancellationToken);
        if (existe)
        {
            return Result<Guid>.Failure($"Ya existe un producto con el código '{codigoUpper}'.");
        }

        var producto = Producto.Crear(
            codigoUpper,
            command.Nombre,
            command.Categoria,
            command.UnidadMedida,
            command.EsSerializado,
            command.Descripcion
        );

        await _context.Productos.AddAsync(producto, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(producto.Id);
    }
}
