using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Cargos;

public record ObtenerCargosQuery(
    Guid? DepartamentoId = null,
    bool? SoloActivos = null,
    string? SearchTerm = null
) : IQuery<Result<List<CargoDetalleDto>>>;

public class ObtenerCargosHandler : IQueryHandler<ObtenerCargosQuery, Result<List<CargoDetalleDto>>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerCargosHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<CargoDetalleDto>>> HandleAsync(ObtenerCargosQuery query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Cargos
            .AsNoTracking()
            .Include(c => c.Departamento)
            .AsQueryable();

        if (query.DepartamentoId.HasValue)
        {
            dbQuery = dbQuery.Where(c => c.DepartamentoId == query.DepartamentoId.Value);
        }

        if (query.SoloActivos.HasValue && query.SoloActivos.Value)
        {
            dbQuery = dbQuery.Where(c => c.Activo);
        }

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var term = query.SearchTerm.Trim().ToLower();
            dbQuery = dbQuery.Where(c => c.Nombre.ToLower().Contains(term) || c.Departamento.Nombre.ToLower().Contains(term));
        }

        var cargos = await dbQuery
            .OrderBy(c => c.Departamento.Nombre)
            .ThenBy(c => c.Nombre)
            .Select(c => new CargoDetalleDto(
                c.Id,
                c.Nombre,
                c.DepartamentoId,
                c.Departamento.Nombre,
                c.SalarioReferencial,
                c.Activo,
                _context.Empleados.Count(e => e.CargoId == c.Id)
            ))
            .ToListAsync(cancellationToken);

        return Result<List<CargoDetalleDto>>.Success(cargos);
    }
}
