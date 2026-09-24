using System;
using System.Collections.Generic;
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
    bool? SoloActivos = null
) : IQuery<Result<List<UnidadMedidaDto>>>;

public class ObtenerUnidadesMedidaHandler : IQueryHandler<ObtenerUnidadesMedidaQuery, Result<List<UnidadMedidaDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerUnidadesMedidaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<UnidadMedidaDto>>> HandleAsync(ObtenerUnidadesMedidaQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.UnidadesMedida.AsNoTracking().AsQueryable();

        if (query.SoloActivos.HasValue)
        {
            dbQuery = dbQuery.Where(u => u.Activo == query.SoloActivos.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(u =>
                u.Codigo.ToLower().Contains(search) ||
                u.Nombre.ToLower().Contains(search) ||
                u.Abreviatura.ToLower().Contains(search) ||
                (u.Descripcion != null && u.Descripcion.ToLower().Contains(search)));
        }

        var list = await dbQuery
            .OrderBy(u => u.Nombre)
            .Select(u => new UnidadMedidaDto(
                u.Id,
                u.Codigo,
                u.Nombre,
                u.Abreviatura,
                u.PermiteDecimales,
                u.Descripcion,
                u.Activo
            ))
            .ToListAsync(cancellationToken);

        return Result<List<UnidadMedidaDto>>.Success(list);
    }
}
