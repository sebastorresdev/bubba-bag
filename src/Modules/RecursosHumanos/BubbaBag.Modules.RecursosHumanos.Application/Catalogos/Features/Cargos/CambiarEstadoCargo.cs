using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Cargos;

public record CambiarEstadoCargoCommand(Guid Id, bool Activo) : ICommand<Result<Guid>>;

public class CambiarEstadoCargoHandler : ICommandHandler<CambiarEstadoCargoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public CambiarEstadoCargoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CambiarEstadoCargoCommand request, CancellationToken cancellationToken = default)
    {
        var cargo = await _context.Cargos
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (cargo is null)
        {
            return Result<Guid>.Failure("El cargo no existe.");
        }

        if (request.Activo)
        {
            cargo.Activar();
        }
        else
        {
            cargo.Desactivar();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(cargo.Id);
    }
}
