using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;

public record ActualizarEmpleadoCommand(
    Guid Id,
    string Nombres,
    string Apellidos,
    string TipoDocumento,
    string NumeroDocumento,
    string? Email,
    string? Telefono,
    DateOnly? FechaNacimiento,
    string? Direccion,
    DateOnly? FechaIngreso,
    string? Cargo,
    string? Departamento,
    string? TipoContrato,
    decimal? SalarioBase,
    string? MonedaSalario,
    bool TieneAsignacionFamiliar,
    string? RegimenPensionario,
    string? Cuspp,
    string? EntidadFinanciera,
    string? CuentaBancaria,
    string? CuentaInterbancaria,
    string Estado
) : ICommand<Result<Guid>>;

public class ActualizarEmpleadoHandler : ICommandHandler<ActualizarEmpleadoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ActualizarEmpleadoHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> HandleAsync(ActualizarEmpleadoCommand request, CancellationToken cancellationToken)
    {
        var empleado = await _context.Empleados.FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (empleado is null)
        {
            return Result<Guid>.Failure("El empleado no existe.");
        }

        // Check duplicated document
        if (await _context.Empleados.AnyAsync(e => e.Id != request.Id && e.TipoDocumento == request.TipoDocumento && e.NumeroDocumento == request.NumeroDocumento, cancellationToken))
        {
            return Result<Guid>.Failure("Ya existe otro empleado con el mismo documento.");
        }

        empleado.ActualizarDatosBasicos(request.Nombres, request.Apellidos, request.TipoDocumento, request.NumeroDocumento);
        empleado.ActualizarDatosContacto(request.Email, request.Telefono, request.Direccion);
        empleado.ActualizarDatosLaborales(request.FechaIngreso, request.Cargo, request.Departamento, request.TipoContrato);

        var tieneAccesoConfidencial = _currentUser.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.AccesoRrhhConfidencial);
        if (tieneAccesoConfidencial)
        {
            empleado.ActualizarPlanilla(request.SalarioBase, request.MonedaSalario, request.TieneAsignacionFamiliar, request.RegimenPensionario, request.Cuspp);
            empleado.ActualizarDatosBancarios(request.EntidadFinanciera, request.CuentaBancaria, request.CuentaInterbancaria);
            empleado.CambiarEstado(request.Estado);
        }
        else
        {
            // Conservar los datos confidenciales existentes
            empleado.ActualizarPlanilla(empleado.SalarioBase, empleado.MonedaSalario, request.TieneAsignacionFamiliar, empleado.RegimenPensionario, empleado.Cuspp);
            empleado.ActualizarDatosBancarios(empleado.EntidadFinanciera, empleado.CuentaBancaria, empleado.CuentaInterbancaria);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(empleado.Id);
    }
}

