using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearListaPrecios;

public record CrearListaPreciosCommand(
    string Codigo,
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
        var codigoUpper = command.Codigo.Trim().ToUpperInvariant();
        var existe = await _context.ListasPrecios.AnyAsync(l => l.Codigo == codigoUpper, cancellationToken);
        if (existe)
        {
            return Result<Guid>.Failure($"Ya existe una lista de precios con el código '{codigoUpper}'.");
        }

        var lista = ListaPrecios.Crear(
            nombre: command.Nombre,
            codigo: codigoUpper,
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
