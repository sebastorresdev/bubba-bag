using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerUnidadesMedida;

public record ObtenerUnidadesMedidaQuery(
    string? Search = null,
    bool? SoloActivos = null,
    Guid? GrupoId = null
) : IQuery<Result<System.Collections.Generic.List<UnidadMedidaDto>>>;

public class ObtenerUnidadesMedidaHandler : IQueryHandler<ObtenerUnidadesMedidaQuery, Result<System.Collections.Generic.List<UnidadMedidaDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerUnidadesMedidaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<System.Collections.Generic.List<UnidadMedidaDto>>> HandleAsync(ObtenerUnidadesMedidaQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.UnidadesMedida
            .Include(u => u.GrupoUnidadMedida)
            .AsNoTracking()
            .AsQueryable();

        if (query.SoloActivos.HasValue)
            dbQuery = dbQuery.Where(u => u.EstaActivo == query.SoloActivos.Value);

        if (query.GrupoId.HasValue)
            dbQuery = dbQuery.Where(u => u.GrupoUnidadMedidaId == query.GrupoId.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(u =>
                u.Nombre.ToLower().Contains(search) ||
                (u.GrupoUnidadMedida != null && u.GrupoUnidadMedida.Nombre.ToLower().Contains(search)));
        }

        var list = await dbQuery
            .OrderBy(u => u.GrupoUnidadMedida!.Nombre)
            .ThenBy(u => u.FactorConversionTotal)
            .Select(u => new UnidadMedidaDto(
                u.Id,
                u.GrupoUnidadMedidaId,
                u.GrupoUnidadMedida != null ? u.GrupoUnidadMedida.Nombre : string.Empty,
                u.Nombre,
                u.EsUnidadBase,
                u.UnidadMedidaBaseId,
                u.Cantidad,
                u.FactorConversionTotal,
                u.EstaActivo
            ))
            .ToListAsync(cancellationToken);

        return Result<System.Collections.Generic.List<UnidadMedidaDto>>.Success(list);
    }
}
