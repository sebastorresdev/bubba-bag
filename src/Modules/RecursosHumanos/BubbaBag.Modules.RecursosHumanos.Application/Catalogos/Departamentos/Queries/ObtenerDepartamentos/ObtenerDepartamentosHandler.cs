using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Queries.ObtenerDepartamentos;

public class ObtenerDepartamentosHandler : IQueryHandler<ObtenerDepartamentosQuery, Result<List<DepartamentoDetalleDto>>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerDepartamentosHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<DepartamentoDetalleDto>>> HandleAsync(ObtenerDepartamentosQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Departamentos
            .AsNoTracking()
            .AsQueryable();

        if (query.SoloActivos.HasValue && query.SoloActivos.Value)
        {
            dbQuery = dbQuery.Where(d => d.Activo);
        }

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var term = query.SearchTerm.Trim().ToLower();
            dbQuery = dbQuery.Where(d => d.Nombre.ToLower().Contains(term) || (d.Descripcion != null && d.Descripcion.ToLower().Contains(term)));
        }

        var departamentos = await dbQuery
            .OrderBy(d => d.Nombre)
            .Select(d => new DepartamentoDetalleDto(
                d.Id,
                d.Nombre,
                d.Descripcion,
                d.Activo,
                d.Cargos.Count,
                _context.Empleados.Count(e => e.DepartamentoId == d.Id),
                null
            ))
            .ToListAsync(cancellationToken);

        return Result<List<DepartamentoDetalleDto>>.Success(departamentos);
    }
}
