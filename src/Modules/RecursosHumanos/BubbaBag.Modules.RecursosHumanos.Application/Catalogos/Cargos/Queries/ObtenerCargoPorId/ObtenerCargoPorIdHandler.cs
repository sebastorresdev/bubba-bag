using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Cargos.Queries.ObtenerCargoPorId;

public class ObtenerCargoPorIdHandler : IQueryHandler<ObtenerCargoPorIdQuery, Result<CargoDetalleDto>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ObtenerCargoPorIdHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
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
            _currentUser.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Rrhh.SalariosConfidencial) ? cargo.SalarioReferencial : null,
            cargo.Activo,
            totalEmpleados
        );

        return Result<CargoDetalleDto>.Success(dto);
    }
}
