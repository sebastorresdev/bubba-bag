using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.EliminarAlmacen;

public record EliminarAlmacenCommand(Guid Id) : ICommand<Result>;

public class EliminarAlmacenHandler : ICommandHandler<EliminarAlmacenCommand, Result>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _currentUser;

    public EliminarAlmacenHandler(IServicioCampoDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result> HandleAsync(EliminarAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.HasAnyRole(Roles.SuperAdmin, Roles.ServicioCampoAdmin, Roles.InventarioAdmin))
        {
            if (!await InventarioAcceso.PuedeAsync(_context, _currentUser, command.Id, "supervisar", cancellationToken))
                return Result.Failure("No tiene permisos para administrar o eliminar este almacén.");
        }

        var almacen = await _context.Almacenes.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken);
        if (almacen is null)
            return Result.Failure($"No se encontró el almacén con ID '{command.Id}'.");

        // 1. Validar existencias / stock positivo
        var tieneStock = await _context.StocksAlmacen.AnyAsync(
            s => s.Ubicacion.AlmacenId == command.Id && (s.CantidadDisponible > 0 || s.CantidadReservada > 0),
            cancellationToken);
        if (tieneStock)
            return Result.Failure("No se puede eliminar el almacén porque contiene existencias de productos. Primero debe transferir o retirar el stock. En su lugar, puede desactivarlo.");

        // 2. Validar ítems seriados
        var tieneSeries = await _context.ItemsSeriados.AnyAsync(
            x => x.UbicacionActual != null && x.UbicacionActual.AlmacenId == command.Id,
            cancellationToken);
        if (tieneSeries)
            return Result.Failure("No se puede eliminar el almacén porque tiene ítems seriados asociados.");

        // 3. Validar transferencias
        var tieneTransferencias = await _context.Transferencias.AnyAsync(
            t => t.AlmacenOrigenId == command.Id || t.AlmacenDestinoId == command.Id,
            cancellationToken);
        if (tieneTransferencias)
            return Result.Failure("No se puede eliminar el almacén porque registra transferencias en su historial. Le sugerimos desactivarlo.");

        // 4. Validar compras
        var tieneCompras = await _context.Compras.AnyAsync(
            c => c.AlmacenId == command.Id,
            cancellationToken);
        if (tieneCompras)
            return Result.Failure("No se puede eliminar el almacén porque tiene órdenes de compra asociadas. Le sugerimos desactivarlo.");

        // 5. Validar ajustes de inventario
        var tieneAjustes = await _context.AjustesInventario.AnyAsync(
            a => a.AlmacenId == command.Id,
            cancellationToken);
        if (tieneAjustes)
            return Result.Failure("No se puede eliminar el almacén porque registra ajustes de inventario. Le sugerimos desactivarlo.");

        // 6. Validar movimientos de inventario históricos
        var tieneMovimientos = await _context.MovimientosInventario.AnyAsync(
            m => m.AlmacenOrigenId == command.Id || m.AlmacenDestinoId == command.Id,
            cancellationToken);
        if (tieneMovimientos)
            return Result.Failure("No se puede eliminar el almacén porque registra movimientos de inventario históricos. Le sugerimos desactivarlo.");

        // 7. Validar asignación a recursos técnicos
        var tieneRecursos = await _context.Recursos.AnyAsync(
            r => r.AlmacenMovilId == command.Id || r.AlmacenBaseId == command.Id,
            cancellationToken);
        if (tieneRecursos)
            return Result.Failure("No se puede eliminar el almacén porque está asignado a un recurso técnico como almacén base o de custodia.");

        // 8. Validar asignación a zonas operativas
        var tieneZonas = await _context.ZonasOperativas.AnyAsync(
            z => z.AlmacenPredeterminadoId == command.Id,
            cancellationToken);
        if (tieneZonas)
            return Result.Failure("No se puede eliminar el almacén porque está configurado como predeterminado en una zona operativa.");

        // Limpiar registros hijos directos
        var stocksCero = await _context.StocksAlmacen
            .Where(s => s.Ubicacion.AlmacenId == command.Id)
            .ToListAsync(cancellationToken);
        if (stocksCero.Count > 0)
            _context.StocksAlmacen.RemoveRange(stocksCero);

        var ubicaciones = await _context.UbicacionesInventario
            .Where(u => u.AlmacenId == command.Id)
            .ToListAsync(cancellationToken);
        if (ubicaciones.Count > 0)
            _context.UbicacionesInventario.RemoveRange(ubicaciones);

        var autorizaciones = await _context.UsuarioAlmacenAutorizaciones
            .Where(a => a.AlmacenId == command.Id)
            .ToListAsync(cancellationToken);
        if (autorizaciones.Count > 0)
            _context.UsuarioAlmacenAutorizaciones.RemoveRange(autorizaciones);

        _context.Almacenes.Remove(almacen);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
