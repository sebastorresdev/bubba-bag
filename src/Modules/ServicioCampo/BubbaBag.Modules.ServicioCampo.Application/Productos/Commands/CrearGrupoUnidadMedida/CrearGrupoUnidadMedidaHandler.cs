using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearGrupoUnidadMedida;

/// <summary>
/// Crea un Grupo de Unidades de Medida junto con su unidad base en una transacción atómica.
/// </summary>
public record CrearGrupoUnidadMedidaCommand(
    string Nombre,
    string NombreUnidadBase
) : ICommand<Result<Guid>>;

public class CrearGrupoUnidadMedidaHandler : ICommandHandler<CrearGrupoUnidadMedidaCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearGrupoUnidadMedidaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearGrupoUnidadMedidaCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result<Guid>.Failure("El nombre del grupo es obligatorio.");

        if (string.IsNullOrWhiteSpace(command.NombreUnidadBase))
            return Result<Guid>.Failure("El nombre de la unidad base es obligatorio.");

        var nombreNormalizado = command.Nombre.Trim();
        var existe = await _context.GruposUnidadMedida
            .AnyAsync(g => g.Nombre == nombreNormalizado, cancellationToken);

        if (existe)
            return Result<Guid>.Failure($"Ya existe un grupo de unidades con el nombre '{nombreNormalizado}'.");

        var (grupo, unidadBase) = GrupoUnidadMedida.Crear(command.Nombre, command.NombreUnidadBase);

        await _context.EjecutarEnTransaccionAsync(async ct =>
        {
            await _context.GruposUnidadMedida.AddAsync(grupo, ct);
            await _context.UnidadesMedida.AddAsync(unidadBase, ct);
            await _context.SaveChangesAsync(ct);
        }, cancellationToken);

        return Result<Guid>.Success(grupo.Id);
    }
}
