using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CambiarEstadoListaPrecios;

public record CambiarEstadoListaPreciosCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoListaPreciosHandler : ICommandHandler<CambiarEstadoListaPreciosCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoListaPreciosHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoListaPreciosCommand command, CancellationToken cancellationToken = default)
    {
        var lista = await _context.ListasPrecios.FirstOrDefaultAsync(l => l.Id == command.Id, cancellationToken);
        if (lista == null)
        {
            return Result.Failure($"No se encontró la lista de precios con ID '{command.Id}'.");
        }

        if (command.Activo) lista.Activar();
        else lista.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
