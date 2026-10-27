using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Dtos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Queries.ObtenerCargos;

public class ObtenerCargosHandler : IQueryHandler<ObtenerCargosQuery, Result<List<CargoDetalleDto>>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ObtenerCargosHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
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

        if (query.SoloActivos.HasValue)
        {
            dbQuery = dbQuery.Where(c => c.Activo == query.SoloActivos.Value);
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
                _currentUser.HasPermission(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.SalariosConfidencial) ? c.SalarioReferencial : null,
                c.Activo,
                _context.Empleados.Count(e => e.CargoId == c.Id)
            ))
            .ToListAsync(cancellationToken);

        return Result<List<CargoDetalleDto>>.Success(cargos);
    }
}
