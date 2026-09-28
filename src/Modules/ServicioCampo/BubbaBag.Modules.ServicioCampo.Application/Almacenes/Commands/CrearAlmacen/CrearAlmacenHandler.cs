using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearAlmacen;

public record CrearAlmacenCommand(
    string Nombre,
    string? Descripcion = null,
    string? Codigo = null,
    TipoAlmacen Tipo = TipoAlmacen.Fisico,
    Guid? SucursalId = null,
    string? Direccion = null,
    string? Telefono = null,
    Guid? RecursoId = null,
    Guid? RecursoTecnicoId = null
) : ICommand<Result<Guid>>;

public class CrearAlmacenHandler : ICommandHandler<CrearAlmacenCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearAlmacenHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result<Guid>.Failure("El nombre del almacén es obligatorio.");

        var codigoUpper = !string.IsNullOrWhiteSpace(command.Codigo)
            ? command.Codigo.Trim().ToUpperInvariant()
            : $"ALM-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        var existe = await _context.Almacenes.AnyAsync(a => a.Codigo == codigoUpper, cancellationToken);
        if (existe)
            return Result<Guid>.Failure($"Ya existe un almacén con el código '{codigoUpper}'.");

        var almacen = Almacen.Crear(command.Nombre, command.Descripcion, codigoUpper);

        await _context.Almacenes.AddAsync(almacen, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(almacen.Id);
    }
}
