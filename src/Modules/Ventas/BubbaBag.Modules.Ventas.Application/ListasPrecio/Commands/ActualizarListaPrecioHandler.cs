using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Ventas.Application.ListasPrecio.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Ventas.Application.ListasPrecio.Commands;

public record ActualizarListaPrecioCommand(
    Guid Id,
    string Nombre,
    string Moneda,
    string? Descripcion,
    DateTime? VigenciaDesde,
    DateTime? VigenciaHasta,
    bool EsPredeterminada,
    Guid? ClienteId,
    List<GuardarItemListaPrecioRequest>? Items = null
) : ICommand<Result>;

public class ActualizarListaPrecioHandler : ICommandHandler<ActualizarListaPrecioCommand, Result>
{
    private readonly IVentasDbContext _context;

    public ActualizarListaPrecioHandler(IVentasDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarListaPrecioCommand command, CancellationToken cancellationToken = default)
    {
        var lp = await _context.ListasPrecio
            .Include(l => l.Items)
            .FirstOrDefaultAsync(l => l.Id == command.Id, cancellationToken);

        if (lp == null)
        {
            return Result.Failure($"No se encontró la lista de precios con ID '{command.Id}'.");
        }

        var nombreTrim = command.Nombre.Trim();
        var existeNombre = await _context.ListasPrecio
            .AnyAsync(l => l.Id != command.Id && l.Nombre == nombreTrim, cancellationToken);
        if (existeNombre)
        {
            return Result.Failure($"Ya existe otra lista de precios con el nombre '{nombreTrim}'.");
        }

        if (command.EsPredeterminada && !lp.EsPredeterminada)
        {
            var otras = await _context.ListasPrecio
                .Where(l => l.Id != command.Id && l.EsPredeterminada)
                .ToListAsync(cancellationToken);
            foreach (var o in otras)
            {
                o.MarcarComoPredeterminada(false);
            }
        }

        lp.Actualizar(
            nombreTrim,
            command.Moneda,
            command.Descripcion,
            command.VigenciaDesde,
            command.VigenciaHasta,
            command.EsPredeterminada,
            command.ClienteId
        );

        if (command.Items != null)
        {
            lp.LimpiarItems();
            foreach (var item in command.Items)
            {
                lp.AgregarOActualizarItem(item.ProductoId, item.PrecioUnitario);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record CambiarEstadoListaPrecioCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoListaPrecioHandler : ICommandHandler<CambiarEstadoListaPrecioCommand, Result>
{
    private readonly IVentasDbContext _context;

    public CambiarEstadoListaPrecioHandler(IVentasDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoListaPrecioCommand command, CancellationToken cancellationToken = default)
    {
        var lp = await _context.ListasPrecio.FirstOrDefaultAsync(l => l.Id == command.Id, cancellationToken);
        if (lp == null)
        {
            return Result.Failure($"No se encontró la lista de precios con ID '{command.Id}'.");
        }

        if (command.Activo) lp.Activar();
        else lp.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
