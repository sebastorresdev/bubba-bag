using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;

public record ObtenerEmpleadosQuery(string? SearchTerm, int Page = 1, int PageSize = 20) : IQuery<Result<List<EmpleadoDto>>>;

public class ObtenerEmpleadosHandler : IQueryHandler<ObtenerEmpleadosQuery, Result<List<EmpleadoDto>>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerEmpleadosHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<EmpleadoDto>>> HandleAsync(ObtenerEmpleadosQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Empleados.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(e => 
                e.Nombres.ToLower().Contains(term) || 
                e.Apellidos.ToLower().Contains(term) || 
                (e.Nombres + " " + e.Apellidos).ToLower().Contains(term) ||
                e.NumeroDocumento.ToLower().Contains(term));
        }

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
                e.Estado,
                e.Email,
                e.Telefono,
                e.FechaNacimiento,
                e.Direccion,
                e.FechaIngreso,
                e.Cargo,
                e.Departamento,
                e.TipoContrato,
                e.SalarioBase,
                e.MonedaSalario,
                e.TieneAsignacionFamiliar,
                e.RegimenPensionario,
                e.Cuspp,
                e.EntidadFinanciera,
                e.CuentaBancaria,
                e.CuentaInterbancaria
            ))
            .ToListAsync(cancellationToken);

        return Result<List<EmpleadoDto>>.Success(empleados);
    }
}
