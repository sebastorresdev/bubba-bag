using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerGruposUnidadMedida;

public record ObtenerGruposUnidadMedidaQuery(
    string? Search = null,
    bool? SoloActivos = null,
    bool IncluirUnidades = true
) : IQuery<Result<List<GrupoUnidadMedidaDetalleDto>>>;

public class ObtenerGruposUnidadMedidaHandler : IQueryHandler<ObtenerGruposUnidadMedidaQuery, Result<List<GrupoUnidadMedidaDetalleDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerGruposUnidadMedidaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<GrupoUnidadMedidaDetalleDto>>> HandleAsync(ObtenerGruposUnidadMedidaQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.GruposUnidadMedida
            .Include(g => g.Unidades)
            .AsNoTracking()
            .AsQueryable();

        if (query.SoloActivos.HasValue)
            dbQuery = dbQuery.Where(g => g.EstaActivo == query.SoloActivos.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(g =>
                g.Nombre.ToLower().Contains(search) ||
                g.Unidades.Any(u => u.EsUnidadBase && u.Nombre.ToLower().Contains(search)));
        }

        var grupos = await dbQuery
            .OrderBy(g => g.Nombre)
            .ToListAsync(cancellationToken);

        var dtos = grupos.Select(g => new GrupoUnidadMedidaDetalleDto(
            g.Id,
            g.Nombre,
            g.Observacion,
            g.EstaActivo,
            g.FechaCreacion,
            g.FechaModificacion,
            g.Unidades.Select(u => new UnidadMedidaDto(
                u.Id,
                u.GrupoUnidadMedidaId,
                g.Nombre,
                u.Nombre,
                u.EsUnidadBase,
                u.UnidadMedidaBaseId,
                u.Cantidad,
                u.FactorConversionTotal,
                u.EstaActivo
            )).OrderBy(u => u.FactorConversionTotal).ToList()
        )).ToList();

        return Result<List<GrupoUnidadMedidaDetalleDto>>.Success(dtos);
    }
}
