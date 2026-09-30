using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.AgregarUnidadMedidaAGrupo;

/// <summary>
/// Agrega una unidad de medida derivada a un grupo existente, especificando su factor de conversión.
/// </summary>
public record AgregarUnidadMedidaAGrupoCommand(
    Guid GrupoUnidadMedidaId,
    string Nombre,
    Guid UnidadMedidaBaseId,
    decimal Cantidad
) : ICommand<Result<Guid>>;

public class AgregarUnidadMedidaAGrupoHandler : ICommandHandler<AgregarUnidadMedidaAGrupoCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public AgregarUnidadMedidaAGrupoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(AgregarUnidadMedidaAGrupoCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result<Guid>.Failure("El nombre de la unidad es obligatorio.");

        if (command.Cantidad <= 0)
            return Result<Guid>.Failure("La cantidad debe ser mayor a 0.");

        var grupo = await _context.GruposUnidadMedida
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == command.GrupoUnidadMedidaId, cancellationToken);

        if (grupo is null)
            return Result<Guid>.Failure("No se encontró el grupo de unidades de medida especificado.");
        if (!grupo.EstaActivo)
            return Result<Guid>.Failure("No se pueden agregar unidades a un grupo inactivo.");

        var unidadReferencia = await _context.UnidadesMedida
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == command.UnidadMedidaBaseId, cancellationToken);

        if (unidadReferencia is null || unidadReferencia.GrupoUnidadMedidaId != command.GrupoUnidadMedidaId)
            return Result<Guid>.Failure("La unidad de referencia no pertenece al grupo especificado.");
        if (!unidadReferencia.EstaActivo)
            return Result<Guid>.Failure("La unidad de referencia debe estar activa.");

        // Verificar que no haya duplicado de nombre en el mismo grupo
        var nombreNorm = command.Nombre.Trim();
        var existe = await _context.UnidadesMedida
            .AnyAsync(u => u.GrupoUnidadMedidaId == command.GrupoUnidadMedidaId && u.Nombre == nombreNorm, cancellationToken);

        if (existe)
            return Result<Guid>.Failure($"Ya existe una unidad llamada '{nombreNorm}' en este grupo.");

        decimal factorTotal;
        try
        {
            factorTotal = checked(command.Cantidad * unidadReferencia.FactorConversionTotal);
        }
        catch (OverflowException)
        {
            return Result<Guid>.Failure("La equivalencia calculada excede el valor permitido.");
        }

        var nuevaUnidad = UnidadMedida.CrearDerivada(
            command.GrupoUnidadMedidaId,
            unidadReferencia.Id,
            command.Nombre,
            command.Cantidad,
            factorTotal);

        await _context.UnidadesMedida.AddAsync(nuevaUnidad, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(nuevaUnidad.Id);
    }
}
