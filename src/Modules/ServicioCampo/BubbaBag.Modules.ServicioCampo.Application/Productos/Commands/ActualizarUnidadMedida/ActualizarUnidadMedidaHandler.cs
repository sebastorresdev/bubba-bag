using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarUnidadMedida;

public record ActualizarUnidadMedidaCommand(
    Guid Id,
    string Nombre,
    Guid UnidadMedidaBaseId,
    decimal Cantidad
) : ICommand<Result>;

public class ActualizarUnidadMedidaHandler : ICommandHandler<ActualizarUnidadMedidaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarUnidadMedidaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarUnidadMedidaCommand command, CancellationToken cancellationToken = default)
    {
        var unidad = await _context.UnidadesMedida
            .FirstOrDefaultAsync(u => u.Id == command.Id, cancellationToken);

        if (unidad is null)
            return Result.Failure("No se encontró la unidad de medida.");

        var unidadesGrupo = await _context.UnidadesMedida
            .Where(u => u.GrupoUnidadMedidaId == unidad.GrupoUnidadMedidaId)
            .ToListAsync(cancellationToken);

        if (unidad.EsUnidadBase)
            return Result.Failure("La unidad base de un grupo no puede modificarse directamente. Actualice el nombre a través del grupo.");

        if (command.Cantidad <= 0)
            return Result.Failure("La cantidad debe ser mayor a 0.");
        if (command.UnidadMedidaBaseId == unidad.Id)
            return Result.Failure("Una unidad no puede referenciarse a sí misma.");

        var referencia = unidadesGrupo.FirstOrDefault(u => u.Id == command.UnidadMedidaBaseId);
        if (referencia is null || referencia.GrupoUnidadMedidaId != unidad.GrupoUnidadMedidaId)
            return Result.Failure("La unidad de referencia debe pertenecer al mismo grupo.");
        if (!referencia.EstaActivo)
            return Result.Failure("La unidad de referencia debe estar activa.");

        var actual = referencia;
        var visitados = new HashSet<Guid>();
        while (!actual.EsUnidadBase)
        {
            if (!visitados.Add(actual.Id) || actual.Id == unidad.Id)
                return Result.Failure("La unidad de referencia seleccionada genera una dependencia circular.");
            if (!actual.UnidadMedidaBaseId.HasValue)
                return Result.Failure("La cadena de unidades de referencia es inconsistente.");
            actual = unidadesGrupo.FirstOrDefault(u => u.Id == actual.UnidadMedidaBaseId.Value)!;
            if (actual is null)
                return Result.Failure("La cadena de unidades de referencia está incompleta.");
        }

        // Si se intenta modificar el factor de conversión, verificar que la unidad no esté en uso
        if (command.Cantidad != unidad.Cantidad || command.UnidadMedidaBaseId != unidad.UnidadMedidaBaseId)
        {
            var enUsoEnProductos = await _context.Productos
                .AnyAsync(p => p.UnidadMedidaDefectoId == unidad.Id, cancellationToken);

            var enUsoEnListasPrecios = await _context.ElementosListaPrecios
                .AnyAsync(e => e.UnidadMedidaId == unidad.Id, cancellationToken);

            if (enUsoEnProductos || enUsoEnListasPrecios)
            {
                return Result.Failure(
                    "No se puede modificar el factor de conversión de una unidad que ya está asociada a productos o listas de precios. Para cambiar la equivalencia, desactive esta unidad y cree una nueva.");
            }
        }

        // Verificar duplicados de nombre en el mismo grupo (excluyendo esta misma unidad)
        var nombreNorm = command.Nombre.Trim();
        var nombreDuplicado = await _context.UnidadesMedida
            .AnyAsync(u => u.GrupoUnidadMedidaId == unidad.GrupoUnidadMedidaId
                        && u.Id != unidad.Id
                        && u.Nombre == nombreNorm, cancellationToken);

        if (nombreDuplicado)
            return Result.Failure($"Ya existe una unidad llamada '{nombreNorm}' en este grupo.");

        decimal factorTotal;
        try
        {
            factorTotal = checked(command.Cantidad * referencia.FactorConversionTotal);
        }
        catch (OverflowException)
        {
            return Result.Failure("La equivalencia calculada excede el valor permitido.");
        }
        unidad.Actualizar(command.Nombre, referencia.Id, command.Cantidad, factorTotal);

        var porId = unidadesGrupo.ToDictionary(u => u.Id);
        decimal CalcularTotal(UnidadMedida item, HashSet<Guid> ruta)
        {
            if (item.EsUnidadBase) return 1m;
            if (!ruta.Add(item.Id)) throw new InvalidOperationException("Se detectó una dependencia circular entre unidades.");
            if (!item.UnidadMedidaBaseId.HasValue || !porId.TryGetValue(item.UnidadMedidaBaseId.Value, out var padre))
                throw new InvalidOperationException("La cadena de unidades de referencia está incompleta.");
            var total = checked(item.Cantidad * CalcularTotal(padre, ruta));
            ruta.Remove(item.Id);
            return total;
        }

        foreach (var item in unidadesGrupo)
            item.RecalcularFactorConversionTotal(CalcularTotal(item, new HashSet<Guid>()));
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
