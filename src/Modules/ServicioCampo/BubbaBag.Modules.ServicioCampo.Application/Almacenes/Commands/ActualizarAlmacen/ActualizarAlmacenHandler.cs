using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.ActualizarAlmacen;

public record ActualizarAlmacenCommand(
    Guid Id,
    string Nombre,
    string? Descripcion = null,
    string? Codigo = null,
    int? Tipo = null,
    Guid? UnidadOrganizativaId = null,
    Guid? RecursoId = null
) : ICommand<Result>;

public class ActualizarAlmacenHandler : ICommandHandler<ActualizarAlmacenCommand, Result>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ActualizarAlmacenHandler(IServicioCampoDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result> HandleAsync(ActualizarAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        if (!await InventarioAcceso.PuedeAsync(_context,_currentUser,command.Id,"supervisar",cancellationToken)) return Result.Failure("No puede administrar este almacén.");
        var almacen = await _context.Almacenes.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken);
        if (almacen is null)
            return Result.Failure($"No se encontró el almacén con ID '{command.Id}'.");

        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result.Failure("El nombre del almacén es obligatorio.");
        if (command.Nombre.Trim().Length > 150)
            return Result.Failure("El nombre del almacén no puede superar los 150 caracteres.");
        if (command.Descripcion?.Length > 500)
            return Result.Failure("La descripción no puede superar los 500 caracteres.");

        if (command.Tipo.HasValue && command.Tipo is not (1 or 2)) return Result.Failure("Tipo de almacén inválido.");
        if (command.Codigo?.Length>30 || !string.IsNullOrWhiteSpace(command.Codigo) && await _context.Almacenes.AnyAsync(x=>x.Id!=command.Id && x.Codigo==command.Codigo.Trim().ToUpperInvariant(),cancellationToken)) return Result.Failure("Revise longitud y unicidad del código.");
        TipoAlmacen? tipoAlm = command.Tipo.HasValue
            ? (command.Tipo.Value == 2 ? TipoAlmacen.CustodiaPersonal : TipoAlmacen.Bodega)
            : null;

        if ((tipoAlm.HasValue && tipoAlm != almacen.Tipo) || (command.UnidadOrganizativaId.HasValue && command.UnidadOrganizativaId != almacen.UnidadOrganizativaId) || (command.RecursoId.HasValue && command.RecursoId != almacen.RecursoId)) return Result.Failure("Conserve tipo, unidad y custodio; transfiera el material para cambiar custodia.");
        almacen.Actualizar(
            command.Nombre,
            command.Descripcion,
            UsuarioActualId(),
            command.Codigo,
            tipoAlm,
            command.UnidadOrganizativaId,
            command.RecursoId);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private Guid? UsuarioActualId() => _currentUser.Id == Guid.Empty ? null : _currentUser.Id;
}
