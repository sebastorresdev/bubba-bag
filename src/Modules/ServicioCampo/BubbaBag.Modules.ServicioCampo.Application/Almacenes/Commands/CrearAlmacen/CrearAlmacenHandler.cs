using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearAlmacen;

public record CrearAlmacenCommand(
    string Codigo,
    string Nombre,
    TipoAlmacen Tipo,
    Guid? SucursalId = null,
    string? Direccion = null,
    string? Telefono = null,
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
        var codigoUpper = command.Codigo.Trim().ToUpperInvariant();

        var existe = await _context.Almacenes.AnyAsync(a => a.Codigo == codigoUpper, cancellationToken);
        if (existe)
            return Result<Guid>.Failure($"Ya existe un almacén con el código '{codigoUpper}'.");

        if (command.Tipo == TipoAlmacen.Movil && !command.RecursoTecnicoId.HasValue)
            return Result<Guid>.Failure("El almacén móvil debe tener un técnico responsable asignado.");

        Almacen almacen = command.Tipo == TipoAlmacen.Movil
            ? Almacen.CrearMovil(codigoUpper, command.Nombre, command.RecursoTecnicoId!.Value, command.SucursalId)
            : Almacen.CrearFisico(codigoUpper, command.Nombre, command.SucursalId, command.Direccion, command.Telefono);

        await _context.Almacenes.AddAsync(almacen, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(almacen.Id);
    }
}
