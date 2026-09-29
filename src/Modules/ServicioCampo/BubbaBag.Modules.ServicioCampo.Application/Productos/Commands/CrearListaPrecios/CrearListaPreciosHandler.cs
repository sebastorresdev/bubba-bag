using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearListaPrecios;

public record CrearListaPreciosCommand(
    string Nombre,
    string Moneda = "PEN",
    string? Descripcion = null,
    DateTime? FechaInicio = null,
    DateTime? FechaFin = null
) : ICommand<Result<Guid>>;

public class CrearListaPreciosHandler : ICommandHandler<CrearListaPreciosCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearListaPreciosHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearListaPreciosCommand command, CancellationToken cancellationToken = default)
    {
        var lista = ListaPrecios.Crear(
            nombre: command.Nombre,
            moneda: command.Moneda,
            descripcion: command.Descripcion,
            fechaInicio: command.FechaInicio,
            fechaFin: command.FechaFin
        );

        await _context.ListasPrecios.AddAsync(lista, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(lista.Id);
    }
}
