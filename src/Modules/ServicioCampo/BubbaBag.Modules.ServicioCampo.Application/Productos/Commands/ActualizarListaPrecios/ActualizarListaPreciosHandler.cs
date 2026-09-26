using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarListaPrecios;

public record ActualizarListaPreciosCommand(
    Guid Id,
    string Nombre,
    string Moneda = "PEN",
    string? Descripcion = null,
    DateTime? FechaInicio = null,
    DateTime? FechaFin = null
) : ICommand<Result>;

public class ActualizarListaPreciosHandler : ICommandHandler<ActualizarListaPreciosCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarListaPreciosHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarListaPreciosCommand command, CancellationToken cancellationToken = default)
    {
        var lista = await _context.ListasPrecios.FirstOrDefaultAsync(l => l.Id == command.Id, cancellationToken);
        if (lista == null)
        {
            return Result.Failure($"No se encontró la lista de precios con ID '{command.Id}'.");
        }

        lista.Actualizar(
            nombre: command.Nombre,
            moneda: command.Moneda,
            descripcion: command.Descripcion,
            fechaInicio: command.FechaInicio,
            fechaFin: command.FechaFin
        );

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
