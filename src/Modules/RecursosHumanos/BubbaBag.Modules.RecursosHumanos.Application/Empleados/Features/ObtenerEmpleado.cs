using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;

public record ObtenerEmpleadoQuery(Guid Id) : IQuery<Result<EmpleadoDto>>;

public class ObtenerEmpleadoHandler : IQueryHandler<ObtenerEmpleadoQuery, Result<EmpleadoDto>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerEmpleadoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<EmpleadoDto>> HandleAsync(ObtenerEmpleadoQuery request, CancellationToken cancellationToken)
    {
        var empleado = await _context.Empleados
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (empleado is null)
        {
            return Result<EmpleadoDto>.Failure("El empleado no existe.");
        }

        return Result<EmpleadoDto>.Success(new EmpleadoDto(
            empleado.Id,
            empleado.Nombres,
            empleado.Apellidos,
            empleado.TipoDocumento,
            empleado.NumeroDocumento,
            empleado.Estado,
            empleado.Email,
            empleado.Telefono,
            empleado.FechaNacimiento,
            empleado.Direccion,
            empleado.FechaIngreso,
            empleado.Cargo,
            empleado.Departamento,
            empleado.TipoContrato,
            empleado.SalarioBase,
            empleado.MonedaSalario,
            empleado.TieneAsignacionFamiliar,
            empleado.RegimenPensionario,
            empleado.Cuspp,
            empleado.EntidadFinanciera,
            empleado.CuentaBancaria,
            empleado.CuentaInterbancaria
        ));
    }
}

