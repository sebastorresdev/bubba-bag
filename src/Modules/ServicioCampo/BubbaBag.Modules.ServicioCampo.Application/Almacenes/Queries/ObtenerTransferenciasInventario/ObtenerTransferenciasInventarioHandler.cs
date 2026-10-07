using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Dtos;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerTransferenciasInventario;

public record ObtenerTransferenciasInventarioQuery : IQuery<Result<List<TransferenciaInventarioDto>>>;

public class ObtenerTransferenciasInventarioHandler
    : IQueryHandler<ObtenerTransferenciasInventarioQuery, Result<List<TransferenciaInventarioDto>>>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _user;
    public ObtenerTransferenciasInventarioHandler(IServicioCampoDbContext context, ICurrentUser user) { _context = context; _user = user; }

    public async Task<Result<List<TransferenciaInventarioDto>>> HandleAsync(
        ObtenerTransferenciasInventarioQuery query,
        CancellationToken cancellationToken = default)
    {
        // 1. Obtener desde la tabla oficial de Transferencias
        var consultables = InventarioAcceso.AlmacenesConsultables(_context,_user);
        var transferenciasDb = await _context.Transferencias
            .Where(t=>consultables.Contains(t.AlmacenOrigenId) || consultables.Contains(t.AlmacenDestinoId))
            .AsNoTracking()
            .Include(t => t.AlmacenOrigen)
            .Include(t => t.AlmacenDestino)
            .Include(t => t.Lineas)
            .OrderByDescending(t => t.FechaRegistro)
            .ToListAsync(cancellationToken);

        var resultado = new List<TransferenciaInventarioDto>();
        if (transferenciasDb.Count > 0)
        {
            var productosIds = transferenciasDb.SelectMany(t => t.Lineas.Select(l => l.ProductoId)).Distinct().ToList();
            var productosMap = await _context.Productos
                .AsNoTracking()
                .Where(p => productosIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, cancellationToken);

            foreach (var t in transferenciasDb)
            {
                var nombresProds = t.Lineas
                    .Select(l => productosMap.TryGetValue(l.ProductoId, out var p) ? p.Nombre : "Producto")
                    .Distinct()
                    .ToList();

                var resumen = nombresProds.Count switch
                {
                    0 => "Sin ítems",
                    1 => nombresProds[0],
                    2 => $"{nombresProds[0]}, {nombresProds[1]}",
                    _ => $"{nombresProds[0]} y {nombresProds.Count - 1} más"
                };

                var tipoOp = (t.AlmacenOrigen?.Tipo == TipoAlmacen.Bodega && t.AlmacenDestino?.Tipo == TipoAlmacen.CustodiaPersonal)
                    ? "Despacho"
                    : (t.AlmacenOrigen?.Tipo == TipoAlmacen.CustodiaPersonal && t.AlmacenDestino?.Tipo == TipoAlmacen.Bodega)
                        ? "Devolucion"
                        : "Traslado";

                resultado.Add(new TransferenciaInventarioDto(
                    t.Id,
                    t.Numero,
                    t.FechaDespacho ?? t.FechaRegistro,
                    t.AlmacenOrigenId,
                    t.AlmacenOrigen?.Nombre ?? "Origen",
                    t.AlmacenDestinoId,
                    t.AlmacenDestino?.Nombre ?? "Destino",
                    t.Lineas.Count,
                    t.Lineas.Sum(l => l.CantidadEnviada),
                    t.Observaciones,
                    t.Estado.ToString(),
                    t.Modalidad.ToString(),
                    t.Lineas.Sum(l => l.CantidadRecibida),
                    t.Lineas.Sum(l => l.CantidadPendiente),
                    resumen,
                    tipoOp,
                    (int?)t.AlmacenOrigen?.Tipo,
                    (int?)t.AlmacenDestino?.Tipo,
                    t.NumeroGuiaRemision
                ));
            }

        }

        // 2. Fallback a movimientos históricos si aún no hay transferencias registradas
        var movimientos = await _context.MovimientosInventario
            .AsNoTracking()
            .Where(m=>!m.TransferenciaId.HasValue && !_context.Transferencias.Any(t=>t.Numero==m.NumeroDocumento))
            .Where(movimiento => (consultables.Contains(movimiento.AlmacenOrigenId ?? Guid.Empty) || consultables.Contains(movimiento.AlmacenDestinoId ?? Guid.Empty)) && (movimiento.Tipo == TipoMovimientoInventario.TransferenciaAlmacenes ||
                                 movimiento.Tipo == TipoMovimientoInventario.DespachoATecnico ||
                                 movimiento.Tipo == TipoMovimientoInventario.DevolucionTecnico))
            .Include(m => m.AlmacenOrigen)
            .Include(m => m.AlmacenDestino)
            .Include(m => m.Producto)
            .OrderByDescending(movimiento => movimiento.FechaMovimiento)
            .ToListAsync(cancellationToken);

        var agrupados = movimientos
            .GroupBy(m => string.IsNullOrWhiteSpace(m.NumeroDocumento) ? m.Id.ToString() : m.NumeroDocumento)
            .Select(g =>
            {
                var primero = g.First();
                var tipoOp = primero.Tipo switch
                {
                    TipoMovimientoInventario.DespachoATecnico => "Despacho",
                    TipoMovimientoInventario.DevolucionTecnico => "Devolucion",
                    _ => (primero.AlmacenOrigen?.Tipo == TipoAlmacen.Bodega && primero.AlmacenDestino?.Tipo == TipoAlmacen.CustodiaPersonal)
                        ? "Despacho"
                        : (primero.AlmacenOrigen?.Tipo == TipoAlmacen.CustodiaPersonal && primero.AlmacenDestino?.Tipo == TipoAlmacen.Bodega)
                            ? "Devolucion"
                            : "Traslado"
                };

                return new TransferenciaInventarioDto(
                    primero.Id,
                    primero.NumeroDocumento ?? $"MOV-{primero.Id.ToString()[..6]}",
                    primero.FechaMovimiento,
                    primero.AlmacenOrigenId ?? Guid.Empty,
                    primero.AlmacenOrigen?.Nombre ?? "Origen",
                    primero.AlmacenDestinoId ?? Guid.Empty,
                    primero.AlmacenDestino?.Nombre ?? "Destino",
                    g.Count(),
                    g.Sum(x => x.Cantidad),
                    primero.Observaciones,
                    "Cerrada",
                    "Inmediata",
                    g.Sum(x => x.Cantidad),
                    0,
                    g.First().Producto?.Nombre ?? "Producto",
                    tipoOp,
                    (int?)primero.AlmacenOrigen?.Tipo,
                    (int?)primero.AlmacenDestino?.Tipo,
                    null
                );
            })
            .ToList();

        return Result<List<TransferenciaInventarioDto>>.Success(resultado.Concat(agrupados).OrderByDescending(x=>x.Fecha).ToList());
    }
}
