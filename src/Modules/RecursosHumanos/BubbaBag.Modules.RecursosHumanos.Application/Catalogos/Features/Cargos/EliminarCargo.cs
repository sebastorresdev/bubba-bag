using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Cargos;

public record EliminarCargoCommand(Guid Id) : ICommand<Result<Guid>>;

public class EliminarCargoHandler : ICommandHandler<EliminarCargoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public EliminarCargoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(EliminarCargoCommand request, CancellationToken cancellationToken = default)
    {
        var cargo = await _context.Cargos
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (cargo is null)
        {
            return Result<Guid>.Failure("El cargo no existe.");
        }

        // Validar si tiene colaboradores asignados a este cargo
        var empleadosEnCargo = await _context.Empleados
            .CountAsync(e => e.CargoId == request.Id, cancellationToken);

        if (empleadosEnCargo > 0)
        {
            return Result<Guid>.Failure($"No se puede eliminar el cargo porque tiene {empleadosEnCargo} colaborador(es) asignado(s). Le sugerimos desactivarlo en su lugar.");
        }

        _context.Cargos.Remove(cargo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(cargo.Id);
    }
}
