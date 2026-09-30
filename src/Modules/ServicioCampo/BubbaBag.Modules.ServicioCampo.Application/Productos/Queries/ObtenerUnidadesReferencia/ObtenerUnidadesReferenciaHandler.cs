using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerUnidadesReferencia;

public record ObtenerUnidadesReferenciaQuery(Guid GrupoId, Guid? ExcluirUnidadId = null)
    : IQuery<Result<List<UnidadMedidaReferenciaDto>>>;

public class ObtenerUnidadesReferenciaHandler
    : IQueryHandler<ObtenerUnidadesReferenciaQuery, Result<List<UnidadMedidaReferenciaDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerUnidadesReferenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<UnidadMedidaReferenciaDto>>> HandleAsync(
        ObtenerUnidadesReferenciaQuery query,
        CancellationToken cancellationToken = default)
    {
        var grupoExiste = await _context.GruposUnidadMedida
            .AsNoTracking()
            .AnyAsync(g => g.Id == query.GrupoId, cancellationToken);

        if (!grupoExiste)
            return Result<List<UnidadMedidaReferenciaDto>>.Failure("No se encontró el grupo de unidades de medida.");

        var unidades = await _context.UnidadesMedida
            .AsNoTracking()
            .Where(u => u.GrupoUnidadMedidaId == query.GrupoId
                     && u.EstaActivo
                     && (!query.ExcluirUnidadId.HasValue || u.Id != query.ExcluirUnidadId.Value))
            .OrderBy(u => u.FactorConversionTotal)
            .ThenBy(u => u.Nombre)
            .Select(u => new UnidadMedidaReferenciaDto(
                u.Id,
                u.Nombre,
                u.FactorConversionTotal,
                u.EsUnidadBase))
            .ToListAsync(cancellationToken);

        return Result<List<UnidadMedidaReferenciaDto>>.Success(unidades);
    }
}
