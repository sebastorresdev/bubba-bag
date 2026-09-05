using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;

public record CrearEmpleadoCommand(
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
    string? CuentaInterbancaria
) : ICommand<Result<Guid>>;

public class CrearEmpleadoHandler : ICommandHandler<CrearEmpleadoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public CrearEmpleadoHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> HandleAsync(CrearEmpleadoCommand request, CancellationToken cancellationToken)
    {
        // Validación básica
        if (await _context.Empleados.AnyAsync(e => e.TipoDocumento == request.TipoDocumento && e.NumeroDocumento == request.NumeroDocumento, cancellationToken))
        {
            return Result<Guid>.Failure("Ya existe un empleado con el mismo documento.");
        }

        var empleado = Empleado.Registrar(request.Nombres, request.Apellidos, request.TipoDocumento, request.NumeroDocumento);
        
        empleado.ActualizarDatosContacto(request.Email, request.Telefono, request.Direccion);
        empleado.ActualizarDatosLaborales(request.FechaIngreso, request.Cargo, request.Departamento, request.TipoContrato);

        var tieneAccesoConfidencial = _currentUser.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.AccesoRrhhConfidencial);
        if (tieneAccesoConfidencial)
        {
            empleado.ActualizarPlanilla(request.SalarioBase, request.MonedaSalario, request.TieneAsignacionFamiliar, request.RegimenPensionario, request.Cuspp);
            empleado.ActualizarDatosBancarios(request.EntidadFinanciera, request.CuentaBancaria, request.CuentaInterbancaria);
        }
        else
        {
            // El rol operativo/asistente no tiene permiso de registrar salarios ni bancos confidenciales
            empleado.ActualizarPlanilla(null, null, request.TieneAsignacionFamiliar, null, null);
        }

        _context.Empleados.Add(empleado);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(empleado.Id);
    }
}

