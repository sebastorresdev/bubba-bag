using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;

public record EliminarEmpleadoCommand(Guid Id) : ICommand<Result<bool>>;

public class EliminarEmpleadoHandler : ICommandHandler<EliminarEmpleadoCommand, Result<bool>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public EliminarEmpleadoHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<bool>> HandleAsync(EliminarEmpleadoCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.AccesoRrhhConfidencial))
        {
            return Result<bool>.Failure("No tiene permisos para dar de baja o eliminar colaboradores.");
        }

        var empleado = await _context.Empleados.FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

        if (empleado is null)
        {
            return Result<bool>.Failure("El empleado no existe.");
        }

        try
        {
            _context.Empleados.Remove(empleado);
            await _context.SaveChangesAsync(cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (DbUpdateException ex)
        {
            // Capturar restriccion de base de datos (Ej: 23503 foreign_key_violation en PostgreSQL)
            if (ex.InnerException != null && ex.InnerException.Message.Contains("23503"))
            {
                return Result<bool>.Failure("No se puede eliminar el empleado porque tiene registros relacionados (ej. planillas, asistencia, contratos, reportes). Se recomienda cambiar el estado a 'Inactivo' para darlo de baja sin perder el historial.");
            }
            
            // Si es otro error de base de datos
            return Result<bool>.Failure("Ocurrió un error al intentar eliminar el empleado debido a restricciones del sistema. Se recomienda cambiar el estado a 'Inactivo'.");
        }
    }
}

