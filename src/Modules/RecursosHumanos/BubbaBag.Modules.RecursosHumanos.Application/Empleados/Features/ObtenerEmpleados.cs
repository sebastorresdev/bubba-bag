using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Dtos;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;

public record ObtenerEmpleadosQuery(
    string? SearchTerm,
    EstadoEmpleado? Estado = null,
    Guid? DepartamentoId = null,
    Guid? CargoId = null,
    int Page = 1,
    int PageSize = 20
) : IQuery<Result<List<EmpleadoDto>>>;

public class ObtenerEmpleadosHandler : IQueryHandler<ObtenerEmpleadosQuery, Result<List<EmpleadoDto>>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ObtenerEmpleadosHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<List<EmpleadoDto>>> HandleAsync(ObtenerEmpleadosQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Empleados
            .AsNoTracking()
            .Include(e => e.Departamento)
            .Include(e => e.Cargo)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(e => 
                e.Nombres.ToLower().Contains(term) || 
                e.Apellidos.ToLower().Contains(term) || 
                (e.Nombres + " " + e.Apellidos).ToLower().Contains(term) ||
                e.NumeroDocumento.ToLower().Contains(term));
        }

        if (request.Estado.HasValue)
        {
            query = query.Where(e => e.Estado == request.Estado.Value);
        }

        if (request.DepartamentoId.HasValue)
        {
            query = query.Where(e => e.DepartamentoId == request.DepartamentoId.Value);
        }

        if (request.CargoId.HasValue)
        {
            query = query.Where(e => e.CargoId == request.CargoId.Value);
        }

        var tieneAccesoConfidencial = _currentUser.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.AccesoRrhhConfidencial);

        var empleados = await query
            .OrderBy(e => e.Apellidos)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new EmpleadoDto(
                e.Id,
                e.Nombres,
                e.Apellidos,
                e.TipoDocumento,
                e.NumeroDocumento,
                e.Estado.ToString(),
                e.Email,
                e.Telefono,
                e.FechaNacimiento,
                e.Direccion,
                e.FechaIngreso,
                e.DepartamentoId,
                e.Departamento != null ? e.Departamento.Nombre : null,
                e.CargoId,
                e.Cargo != null ? e.Cargo.Nombre : null,
                e.TipoContrato,
                e.FechaCese,
                e.MotivoCese,
                e.ObservacionesCese,
                tieneAccesoConfidencial ? e.SalarioBase : null,
                tieneAccesoConfidencial ? e.MonedaSalario : null,
                e.TieneAsignacionFamiliar,
                tieneAccesoConfidencial ? e.RegimenPensionario : null,
                tieneAccesoConfidencial ? e.Cuspp : null,
                tieneAccesoConfidencial ? e.EntidadFinanciera : null,
                tieneAccesoConfidencial ? e.CuentaBancaria : null,
                tieneAccesoConfidencial ? e.CuentaInterbancaria : null
            ))
            .ToListAsync(cancellationToken);

        return Result<List<EmpleadoDto>>.Success(empleados);
    }
}
