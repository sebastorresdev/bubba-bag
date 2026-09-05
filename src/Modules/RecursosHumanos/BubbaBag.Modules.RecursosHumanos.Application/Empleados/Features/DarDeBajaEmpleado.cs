using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;

public record DarDeBajaEmpleadoCommand(
    Guid EmpleadoId,
    DateOnly FechaCese,
    string MotivoCese,
    string? ObservacionesCese
) : ICommand<Result<Guid>>;

public class DarDeBajaEmpleadoHandler : ICommandHandler<DarDeBajaEmpleadoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public DarDeBajaEmpleadoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(DarDeBajaEmpleadoCommand command, CancellationToken cancellationToken = default)
    {
        var empleado = await _context.Empleados.FirstOrDefaultAsync(e => e.Id == command.EmpleadoId, cancellationToken);
        if (empleado == null)
        {
            return Result<Guid>.Failure($"No se encontró ningún colaborador con el ID '{command.EmpleadoId}'.");
        }

        if (empleado.Estado == EstadoEmpleado.Cesado)
        {
            return Result<Guid>.Failure("El colaborador ya se encuentra en estado Cesado / Baja.");
        }

        empleado.DarDeBaja(command.FechaCese, command.MotivoCese, command.ObservacionesCese);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(empleado.Id);
    }
}
