using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.GestionarElementoListaPrecios;

public record GuardarElementoListaPreciosCommand(
    Guid ListaPreciosId,
    Guid ProductoId,
    decimal Monto,
    Guid? UnidadMedidaId = null,
    MetodoFijacionPrecio MetodoFijacion = MetodoFijacionPrecio.ImporteDivisa,
    Guid? ElementoId = null
) : ICommand<Result<Guid>>;

public record EliminarElementoListaPreciosCommand(Guid ElementoId) : ICommand<Result>;

public class GuardarElementoListaPreciosHandler : ICommandHandler<GuardarElementoListaPreciosCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public GuardarElementoListaPreciosHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(GuardarElementoListaPreciosCommand command, CancellationToken cancellationToken = default)
    {
        ElementoListaPrecios? elemento = null;

        if (command.ElementoId.HasValue && command.ElementoId.Value != Guid.Empty)
        {
            elemento = await _context.ElementosListaPrecios
                .FirstOrDefaultAsync(e => e.Id == command.ElementoId.Value, cancellationToken);
        }

        if (elemento == null)
        {
            elemento = await _context.ElementosListaPrecios
                .FirstOrDefaultAsync(e => e.ListaPreciosId == command.ListaPreciosId 
                                       && e.ProductoId == command.ProductoId 
                                       && e.UnidadMedidaId == command.UnidadMedidaId, cancellationToken);
        }

        if (elemento != null)
        {
            var yaExisteOtro = await _context.ElementosListaPrecios
                .AnyAsync(e => e.ListaPreciosId == command.ListaPreciosId
                            && e.ProductoId == command.ProductoId
                            && e.UnidadMedidaId == command.UnidadMedidaId
                            && e.Id != elemento.Id, cancellationToken);

            if (yaExisteOtro)
            {
                return Result<Guid>.Failure("Ya existe un precio para este producto con la misma unidad de medida.");
            }

            elemento.Actualizar(command.Monto, command.UnidadMedidaId, command.MetodoFijacion);
        }
        else
        {
            elemento = ElementoListaPrecios.Crear(
                command.ListaPreciosId,
                command.ProductoId,
                command.Monto,
                command.UnidadMedidaId,
                command.MetodoFijacion
            );
            await _context.ElementosListaPrecios.AddAsync(elemento, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(elemento.Id);
    }
}

public class EliminarElementoListaPreciosHandler : ICommandHandler<EliminarElementoListaPreciosCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public EliminarElementoListaPreciosHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(EliminarElementoListaPreciosCommand command, CancellationToken cancellationToken = default)
    {
        var elemento = await _context.ElementosListaPrecios.FirstOrDefaultAsync(e => e.Id == command.ElementoId, cancellationToken);
        if (elemento == null)
        {
            return Result.Failure($"No se encontró el elemento de lista de precios con ID '{command.ElementoId}'.");
        }

        _context.ElementosListaPrecios.Remove(elemento);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
