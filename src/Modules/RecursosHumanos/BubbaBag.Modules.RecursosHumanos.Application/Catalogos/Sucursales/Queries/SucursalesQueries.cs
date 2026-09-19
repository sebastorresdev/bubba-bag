using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Sucursales.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Sucursales.Queries;

public record ObtenerSucursalesQuery(
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<SucursalDto>>>;

public class ObtenerSucursalesHandler : IQueryHandler<ObtenerSucursalesQuery, Result<List<SucursalDto>>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerSucursalesHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<SucursalDto>>> HandleAsync(ObtenerSucursalesQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Sucursales.AsNoTracking().AsQueryable();

        if (query.SoloActivos.HasValue)
        {
            dbQuery = dbQuery.Where(s => s.Activo == query.SoloActivos.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            dbQuery = dbQuery.Where(s =>
                s.Codigo.ToLower().Contains(search) ||
                s.Nombre.ToLower().Contains(search) ||
                (s.Ciudad != null && s.Ciudad.ToLower().Contains(search)) ||
                (s.Direccion != null && s.Direccion.ToLower().Contains(search)));
        }

        var list = await dbQuery
            .OrderByDescending(s => s.EsSedePrincipal)
            .ThenBy(s => s.Nombre)
            .Select(s => new SucursalDto(
                s.Id,
                s.Codigo,
                s.Nombre,
                s.Ciudad,
                s.Direccion,
                s.Telefono,
                s.EsSedePrincipal,
                s.Activo))
            .ToListAsync(cancellationToken);

        return Result<List<SucursalDto>>.Success(list);
    }
}

public record ObtenerSucursalPorIdQuery(Guid Id) : IQuery<Result<SucursalDto>>;

public class ObtenerSucursalPorIdHandler : IQueryHandler<ObtenerSucursalPorIdQuery, Result<SucursalDto>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerSucursalPorIdHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<SucursalDto>> HandleAsync(ObtenerSucursalPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var s = await _context.Sucursales.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == query.Id, cancellationToken);

        if (s == null)
        {
            return Result<SucursalDto>.Failure($"No se encontró la sucursal con id '{query.Id}'.");
        }

        return Result<SucursalDto>.Success(new SucursalDto(
            s.Id,
            s.Codigo,
            s.Nombre,
            s.Ciudad,
            s.Direccion,
            s.Telefono,
            s.EsSedePrincipal,
            s.Activo));
    }
}
