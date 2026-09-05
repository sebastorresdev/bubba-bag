using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;

public record ReactivarEmpleadoCommand(Guid EmpleadoId) : ICommand<Result<Guid>>;

public class ReactivarEmpleadoHandler : ICommandHandler<ReactivarEmpleadoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ReactivarEmpleadoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(ReactivarEmpleadoCommand command, CancellationToken cancellationToken = default)
    {
        var empleado = await _context.Empleados.FirstOrDefaultAsync(e => e.Id == command.EmpleadoId, cancellationToken);
        if (empleado == null)
        {
            return Result<Guid>.Failure($"No se encontró ningún colaborador con el ID '{command.EmpleadoId}'.");
        }

        if (empleado.Estado == EstadoEmpleado.Activo)
        {
            return Result<Guid>.Failure("El colaborador ya se encuentra en estado Activo.");
        }

        empleado.Reactivar();
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(empleado.Id);
    }
}
