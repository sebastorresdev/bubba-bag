using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;

public record ObtenerEmpleadoQuery(Guid Id) : IQuery<Result<EmpleadoDto>>;

public class ObtenerEmpleadoHandler : IQueryHandler<ObtenerEmpleadoQuery, Result<EmpleadoDto>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ObtenerEmpleadoHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<EmpleadoDto>> HandleAsync(ObtenerEmpleadoQuery request, CancellationToken cancellationToken)
    {
        var empleado = await _context.Empleados
            .AsNoTracking()
            .Include(e => e.Departamento)
            .Include(e => e.Cargo)
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (empleado is null)
        {
            return Result<EmpleadoDto>.Failure("El colaborador no existe.");
        }

        var tieneAccesoConfidencial = _currentUser.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.AccesoRrhhConfidencial);

        return Result<EmpleadoDto>.Success(new EmpleadoDto(
            empleado.Id,
            empleado.Nombres,
            empleado.Apellidos,
            empleado.TipoDocumento,
            empleado.NumeroDocumento,
            empleado.Estado.ToString(),
            empleado.Email,
            empleado.Telefono,
            empleado.FechaNacimiento,
            empleado.Direccion,
            empleado.FotoUrl,
            empleado.FechaIngreso,
            empleado.DepartamentoId,
            empleado.Departamento?.Nombre,
            empleado.CargoId,
            empleado.Cargo?.Nombre,
            empleado.TipoContrato,
            empleado.FechaCese,
            empleado.MotivoCese,
            empleado.ObservacionesCese,
            tieneAccesoConfidencial ? empleado.SalarioBase : null,
            tieneAccesoConfidencial ? empleado.MonedaSalario : null,
            empleado.TieneAsignacionFamiliar,
            tieneAccesoConfidencial ? empleado.RegimenPensionario : null,
            tieneAccesoConfidencial ? empleado.Cuspp : null,
            tieneAccesoConfidencial ? empleado.EntidadFinanciera : null,
            tieneAccesoConfidencial ? empleado.CuentaBancaria : null,
            tieneAccesoConfidencial ? empleado.CuentaInterbancaria : null
        ));
    }
}
