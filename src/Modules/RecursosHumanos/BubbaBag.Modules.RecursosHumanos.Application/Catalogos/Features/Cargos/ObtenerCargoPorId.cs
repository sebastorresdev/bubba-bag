using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Cargos;

public record ObtenerCargoPorIdQuery(Guid Id) : IQuery<Result<CargoDetalleDto>>;

public class ObtenerCargoPorIdHandler : IQueryHandler<ObtenerCargoPorIdQuery, Result<CargoDetalleDto>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerCargoPorIdHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CargoDetalleDto>> HandleAsync(ObtenerCargoPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var cargo = await _context.Cargos
            .AsNoTracking()
            .Include(c => c.Departamento)
            .FirstOrDefaultAsync(c => c.Id == query.Id, cancellationToken);

        if (cargo is null)
        {
            return Result<CargoDetalleDto>.Failure("El cargo no existe.");
        }

        var totalEmpleados = await _context.Empleados
            .CountAsync(e => e.CargoId == cargo.Id, cancellationToken);

        var dto = new CargoDetalleDto(
            cargo.Id,
            cargo.Nombre,
            cargo.DepartamentoId,
            cargo.Departamento.Nombre,
            cargo.SalarioReferencial,
            cargo.Activo,
            totalEmpleados
        );

        return Result<CargoDetalleDto>.Success(dto);
    }
}
