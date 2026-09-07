using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Departamentos;

public record CambiarEstadoDepartamentoCommand(Guid Id, bool Activo) : ICommand<Result<Guid>>;

public class CambiarEstadoDepartamentoHandler : ICommandHandler<CambiarEstadoDepartamentoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public CambiarEstadoDepartamentoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CambiarEstadoDepartamentoCommand request, CancellationToken cancellationToken = default)
    {
        var departamento = await _context.Departamentos
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (departamento is null)
        {
            return Result<Guid>.Failure("El departamento no existe.");
        }

        if (request.Activo)
        {
            departamento.Activar();
        }
        else
        {
            departamento.Desactivar();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(departamento.Id);
    }
}
