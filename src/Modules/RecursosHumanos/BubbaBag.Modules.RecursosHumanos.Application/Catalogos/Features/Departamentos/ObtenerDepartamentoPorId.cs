using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Departamentos;

public record ObtenerDepartamentoPorIdQuery(Guid Id) : IQuery<Result<DepartamentoDetalleDto>>;

public class ObtenerDepartamentoPorIdHandler : IQueryHandler<ObtenerDepartamentoPorIdQuery, Result<DepartamentoDetalleDto>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerDepartamentoPorIdHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<DepartamentoDetalleDto>> HandleAsync(ObtenerDepartamentoPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var departamento = await _context.Departamentos
            .AsNoTracking()
            .Include(d => d.Cargos)
            .FirstOrDefaultAsync(d => d.Id == query.Id, cancellationToken);

        if (departamento is null)
        {
            return Result<DepartamentoDetalleDto>.Failure("El departamento no existe.");
        }

        var totalEmpleados = await _context.Empleados.CountAsync(e => e.DepartamentoId == departamento.Id, cancellationToken);

        var dto = new DepartamentoDetalleDto(
            departamento.Id,
            departamento.Nombre,
            departamento.Descripcion,
            departamento.Activo,
            departamento.Cargos.Count,
            totalEmpleados,
            departamento.Cargos
                .OrderBy(c => c.Nombre)
                .Select(c => new CargoCatalogoDto(c.Id, c.Nombre, c.SalarioReferencial))
                .ToList()
        );

        return Result<DepartamentoDetalleDto>.Success(dto);
    }
}
