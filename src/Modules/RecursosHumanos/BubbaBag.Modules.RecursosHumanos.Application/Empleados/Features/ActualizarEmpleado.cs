using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

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
    Guid? DepartamentoId,
    Guid? CargoId,
    string? TipoContrato,
    decimal? SalarioBase,
    string? MonedaSalario,
    bool TieneAsignacionFamiliar,
    string? RegimenPensionario,
    string? Cuspp,
    string? EntidadFinanciera,
    string? CuentaBancaria,
    string? CuentaInterbancaria,
    EstadoEmpleado Estado
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
            return Result<Guid>.Failure("El colaborador no existe.");
        }

        // Validación de documento duplicado con otro empleado
        if (await _context.Empleados.AnyAsync(e => e.Id != request.Id && e.TipoDocumento == request.TipoDocumento && e.NumeroDocumento == request.NumeroDocumento, cancellationToken))
        {
            return Result<Guid>.Failure("Ya existe otro colaborador con el mismo tipo y número de documento.");
        }

        // Validación de existencia de Departamento y Cargo si fueron enviados
        if (request.DepartamentoId.HasValue && !await _context.Departamentos.AnyAsync(d => d.Id == request.DepartamentoId.Value, cancellationToken))
        {
            return Result<Guid>.Failure("El departamento seleccionado no existe.");
        }

        if (request.CargoId.HasValue && !await _context.Cargos.AnyAsync(c => c.Id == request.CargoId.Value, cancellationToken))
        {
            return Result<Guid>.Failure("El cargo seleccionado no existe.");
        }

        empleado.ActualizarDatosBasicos(request.Nombres, request.Apellidos, request.TipoDocumento, request.NumeroDocumento);
        empleado.ActualizarDatosContacto(request.Email, request.Telefono, request.Direccion);
        empleado.ActualizarDatosLaborales(request.FechaIngreso, request.DepartamentoId, request.CargoId, request.TipoContrato);

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
