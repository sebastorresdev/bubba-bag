using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Ventas.Application.ListasPrecio.Dtos;
using BubbaBag.Modules.Ventas.Domain.ListasPrecio;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Ventas.Application.ListasPrecio.Commands;

public record CrearListaPrecioCommand(
    string Nombre,
    string Moneda = "PEN",
    string? Descripcion = null,
    DateTime? VigenciaDesde = null,
    DateTime? VigenciaHasta = null,
    bool EsPredeterminada = false,
    Guid? ClienteId = null,
    List<GuardarItemListaPrecioRequest>? Items = null
) : ICommand<Result<Guid>>;

public class CrearListaPrecioHandler : ICommandHandler<CrearListaPrecioCommand, Result<Guid>>
{
    private readonly IVentasDbContext _context;

    public CrearListaPrecioHandler(IVentasDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearListaPrecioCommand command, CancellationToken cancellationToken = default)
    {
        var nombreTrim = command.Nombre.Trim();
        var existe = await _context.ListasPrecio.AnyAsync(l => l.Nombre == nombreTrim, cancellationToken);
        if (existe)
        {
            return Result<Guid>.Failure($"Ya existe una lista de precios con el nombre '{nombreTrim}'.");
        }

        // Si se marca como predeterminada, desmarcar las demás
        if (command.EsPredeterminada)
        {
            var otrasPredeterminadas = await _context.ListasPrecio
                .Where(l => l.EsPredeterminada)
                .ToListAsync(cancellationToken);
            foreach (var otra in otrasPredeterminadas)
            {
                otra.MarcarComoPredeterminada(false);
            }
        }

        var listaPrecio = ListaPrecio.Crear(
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
            foreach (var item in command.Items)
            {
                listaPrecio.AgregarOActualizarItem(item.ProductoId, item.PrecioUnitario);
            }
        }

        await _context.ListasPrecio.AddAsync(listaPrecio, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(listaPrecio.Id);
    }
}
