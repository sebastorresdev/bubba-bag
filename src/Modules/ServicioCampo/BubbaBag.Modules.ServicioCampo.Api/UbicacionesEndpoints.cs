using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class UbicacionesEndpoints
{
    public static void MapUbicacionesEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/inventario/almacenes")
            .RequireAuthorization(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.Acceso)
            .WithTags("Inventario - Ubicaciones y autorizaciones");

        g.MapGet("/usuarios-autorizables", ObtenerUsuariosAutorizables);
        g.MapGet("/{id:guid}/ubicaciones", ObtenerUbicaciones);
        g.MapPost("/{id:guid}/ubicaciones", CrearUbicacion);
        g.MapPatch("/{id:guid}/ubicaciones/{ubicacionId:guid}/estado", CambiarEstadoUbicacion);
        g.MapDelete("/{id:guid}/ubicaciones/{ubicacionId:guid}", EliminarUbicacion);
        g.MapGet("/{id:guid}/destinos", ObtenerDestinos);
        g.MapGet("/{id:guid}/autorizaciones", ObtenerAutorizaciones);
        g.MapPut("/{id:guid}/autorizaciones/{usuarioId:guid}", GuardarAutorizacion);
        g.MapDelete("/{id:guid}/autorizaciones/{usuarioId:guid}", EliminarAutorizacion);

        // Reubicación física interna dentro del mismo almacén (misma rama)
        g.MapPost("/{id:guid}/reubicar", ReubicarMaterial);

        // Declaración DOA / Reclasificación (Disponible -> Devolución con Motivo de Retiro)
        g.MapGet("/reclasificaciones-doa", ObtenerReclasificacionesDoa);
        g.MapPost("/{id:guid}/reclasificar-doa", ReclasificarDoa);
        g.MapGet("/{id:guid}/series-disponibles", ObtenerSeriesDisponiblesAlmacen);
        g.MapGet("/{id:guid}/series-por-ubicacion/{ubicacionId:guid}", ObtenerSeriesPorUbicacion);
    }

    private static async Task<IResult> ObtenerUsuariosAutorizables(ICurrentUser user, BubbaBag.Modules.Seguridad.Application.Auth.IAuthService usuarios)
    {
        if (!user.IsAuthenticated || !user.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin, BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoAdmin, BubbaBag.SharedKernel.Authorization.Roles.InventarioAdmin)) return Results.Forbid();
        var resultado = await usuarios.ObtenerUsuariosAsync(soloActivos: true);
        if (resultado.IsFailure) return Results.BadRequest(resultado.Error);

        var autorizables = resultado.Value
            .Where(u => u.EsActivo && EsUsuarioAutorizable(u.Roles))
            .Select(u => new { u.Id, u.NombreCompleto, u.Email, u.EsActivo, u.Roles })
            .ToList();

        return Results.Ok(autorizables);
    }

    private static bool EsUsuarioAutorizable(IEnumerable<string> roles) =>
        roles.Any(rol =>
            rol.Equals(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase) ||
            rol.Equals(BubbaBag.SharedKernel.Authorization.Roles.InventarioAdmin, StringComparison.OrdinalIgnoreCase) ||
            rol.Equals(BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoAdmin, StringComparison.OrdinalIgnoreCase) ||
            rol.Equals(BubbaBag.SharedKernel.Authorization.Roles.InventarioAlmacenero, StringComparison.OrdinalIgnoreCase) ||
            rol.Contains("admin", StringComparison.OrdinalIgnoreCase) ||
            rol.Contains("almacen", StringComparison.OrdinalIgnoreCase) ||
            rol.Contains("almacén", StringComparison.OrdinalIgnoreCase));

    private static async Task<IResult> ObtenerUbicaciones(Guid id, Guid? origenId, IServicioCampoDbContext db, ICurrentUser user, CancellationToken ct)
    {
        var puede = user.HasPermission(BubbaBag.SharedKernel.Authorization.Permissions.Inventario.AccesosGestionar) || await InventarioAcceso.PuedeAsync(db, user, id, "consultar", ct);
        if (!puede && origenId.HasValue && await InventarioAcceso.PuedeAsync(db, user, origenId.Value, "despachar", ct))
        {
            var origen = await db.Almacenes.FindAsync([origenId.Value], ct);
            var destino = await db.Almacenes.FindAsync([id], ct);
            puede = origen != null && destino != null && DestinoPermitido(origen, destino);
        }
        if (!puede) return Results.Forbid();

        var query = await db.UbicacionesInventario
            .AsNoTracking()
            .Where(x => x.AlmacenId == id && x.Activa)
            .OrderByDescending(x => x.EsPrincipal)
            .ThenBy(x => x.Nombre)
            .ToListAsync(ct);

        var resultado = query.Select(x => new
        {
            x.Id,
            x.AlmacenId,
            x.Codigo,
            x.Nombre,
            x.EsPrincipal,
            TipoUbicacion = (int)x.TipoUbicacion,
            TipoUbicacionNombre = x.TipoUbicacion.ToString(),
            x.UbicacionPadreId,
            x.Activa
        });

        return Results.Ok(resultado);
    }

    private static async Task<bool> PuedeGestionarUbicacionesAsync(Guid almacenId, IServicioCampoDbContext db, ICurrentUser user, CancellationToken ct)
    {
        if (!user.IsAuthenticated || user.Id == Guid.Empty) return false;
        if (user.IsInRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin) || user.IsInRole(BubbaBag.SharedKernel.Authorization.Roles.InventarioAdmin)) return true;

        var almacen = await db.Almacenes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == almacenId && x.Activo, ct);
        if (almacen == null) return false;

        // Custodias personales solo operan con las dos ubicaciones básicas
        if (almacen.Tipo == TipoAlmacen.CustodiaPersonal) return false;

        return await InventarioAcceso.PuedeAsync(db, user, almacenId, "supervisar", ct) ||
               await InventarioAcceso.PuedeAsync(db, user, almacenId, "despachar", ct) ||
               await InventarioAcceso.PuedeAsync(db, user, almacenId, "recibir", ct);
    }

    private static async Task<IResult> CrearUbicacion(Guid id, CrearUbicacionRequest r, IServicioCampoDbContext db, ICurrentUser user, CancellationToken ct)
    {
        var almacen = await db.Almacenes.FirstOrDefaultAsync(x => x.Id == id && x.Activo, ct);
        if (almacen == null) return Results.BadRequest("El almacén no existe o no está activo.");
        if (almacen.Tipo == TipoAlmacen.CustodiaPersonal)
            return Results.BadRequest("Los almacenes de custodia personal corresponden a técnicos y solo operan con las ubicaciones predeterminadas.");

        if (!await PuedeGestionarUbicacionesAsync(id, db, user, ct)) return Results.Forbid();
        if (string.IsNullOrWhiteSpace(r.Codigo) || string.IsNullOrWhiteSpace(r.Nombre) || r.Codigo.Length > 50 || r.Nombre.Length > 150)
            return Results.BadRequest("Revise código y nombre.");

        if (await db.UbicacionesInventario.AnyAsync(x => x.AlmacenId == id && x.Codigo == r.Codigo.Trim().ToUpperInvariant(), ct))
            return Results.BadRequest("El código ya existe en el almacén.");

        TipoUbicacion tipo = r.TipoUbicacion ?? TipoUbicacion.Disponible;
        Guid? padreId = r.UbicacionPadreId;

        // Si se indicó un padre, validar que sea del mismo almacén y heredar su tipo
        if (padreId.HasValue && padreId.Value != Guid.Empty)
        {
            var padre = await db.UbicacionesInventario.FirstOrDefaultAsync(u => u.Id == padreId.Value && u.AlmacenId == id, ct);
            if (padre == null) return Results.BadRequest("La ubicación padre no pertenece a este almacén.");
            tipo = padre.TipoUbicacion;
        }
        else
        {
            // Si no se indicó padre, vincularlo a la ubicación raíz del mismo tipo en este almacén (DISPONIBLE o DEVOLUCION)
            var raiz = await db.UbicacionesInventario.FirstOrDefaultAsync(u => u.AlmacenId == id && u.TipoUbicacion == tipo && (u.EsPrincipal || u.UbicacionPadreId == null), ct);
            padreId = raiz?.Id;
        }

        var u = UbicacionInventario.Crear(id, r.Codigo, r.Nombre, principal: false, tipoUbicacion: tipo, ubicacionPadreId: padreId);
        db.UbicacionesInventario.Add(u);
        await db.SaveChangesAsync(ct);
        return Results.Created($"/api/inventario/almacenes/{id}/ubicaciones", new { id = u.Id });
    }

    private static async Task<IResult> CambiarEstadoUbicacion(Guid id, Guid ubicacionId, CambiarEstadoRequest r, IServicioCampoDbContext db, ICurrentUser user, CancellationToken ct)
    {
        if (!await PuedeGestionarUbicacionesAsync(id, db, user, ct)) return Results.Forbid();
        var u = await db.UbicacionesInventario.SingleOrDefaultAsync(x => x.Id == ubicacionId && x.AlmacenId == id, ct);
        if (u == null) return Results.NotFound();

        if (!r.Activo && (u.EsPrincipal || u.Codigo == "DISPONIBLE" || u.Codigo == "DEVOLUCION" ||
            await db.StocksAlmacen.AnyAsync(x => x.UbicacionId == u.Id && (x.CantidadDisponible > 0 || x.CantidadReservada > 0), ct) ||
            await db.ItemsSeriados.AnyAsync(x => x.UbicacionActualId == u.Id, ct) ||
            await db.Transferencias.AnyAsync(x => (x.UbicacionOrigenId == u.Id || x.UbicacionDestinoId == u.Id) && (x.Estado == EstadoTransferencia.EnTransito || x.Estado == EstadoTransferencia.ParcialmenteRecibida), ct)))
        {
            return Results.BadRequest("Ubicación raíz, stock o tránsito pendiente impiden desactivar la ubicación.");
        }

        u.CambiarEstado(r.Activo);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> EliminarUbicacion(Guid id, Guid ubicacionId, IServicioCampoDbContext db, ICurrentUser user, CancellationToken ct)
    {
        if (!await PuedeGestionarUbicacionesAsync(id, db, user, ct)) return Results.Forbid();
        var u = await db.UbicacionesInventario.SingleOrDefaultAsync(x => x.Id == ubicacionId && x.AlmacenId == id, ct);
        if (u == null) return Results.NotFound();

        if (u.EsPrincipal || u.Codigo == "DISPONIBLE" || u.Codigo == "DEVOLUCION")
            return Results.BadRequest("Las ubicaciones raíz del almacén (DISPONIBLE y DEVOLUCION) no se pueden eliminar.");

        if (await db.UbicacionesInventario.AnyAsync(x => x.UbicacionPadreId == u.Id && x.Activa, ct))
            return Results.BadRequest("No se puede eliminar la ubicación porque tiene sububicaciones activas asignadas.");

        if (await db.StocksAlmacen.AnyAsync(x => x.UbicacionId == u.Id && (x.CantidadDisponible > 0 || x.CantidadReservada > 0), ct))
            return Results.BadRequest("No se puede eliminar la ubicación porque contiene existencias de stock activas.");

        if (await db.ItemsSeriados.AnyAsync(x => x.UbicacionActualId == u.Id, ct))
            return Results.BadRequest("No se puede eliminar la ubicación porque tiene números de serie asignados actualmente.");

        if (await db.Transferencias.AnyAsync(x => (x.UbicacionOrigenId == u.Id || x.UbicacionDestinoId == u.Id) && (x.Estado == EstadoTransferencia.EnTransito || x.Estado == EstadoTransferencia.ParcialmenteRecibida), ct))
            return Results.BadRequest("No se puede eliminar la ubicación porque tiene transferencias en tránsito pendientes.");

        var tieneHistorico = await db.MovimientosInventario.AnyAsync(x => x.UbicacionOrigenId == u.Id || x.UbicacionDestinoId == u.Id, ct);
        if (tieneHistorico)
        {
            u.CambiarEstado(false);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { mensaje = "La ubicación poseía historial de movimientos previos; ha sido desactivada para preservar la trazabilidad contable." });
        }

        db.UbicacionesInventario.Remove(u);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    // =========================================================================
    // REUBICACIÓN FÍSICA INTERNA (Mismo Almacén, Misma Rama)
    // =========================================================================
    private static async Task<IResult> ReubicarMaterial(Guid id, ReubicarMaterialRequest r, IServicioCampoDbContext db, ICurrentUser user, CancellationToken ct)
    {
        if (r.UbicacionOrigenId == r.UbicacionDestinoId)
            return Results.BadRequest("La ubicación de origen y destino deben ser distintas.");

        var origen = await db.UbicacionesInventario.FirstOrDefaultAsync(u => u.Id == r.UbicacionOrigenId && u.AlmacenId == id && u.Activa, ct);
        var destino = await db.UbicacionesInventario.FirstOrDefaultAsync(u => u.Id == r.UbicacionDestinoId && u.AlmacenId == id && u.Activa, ct);

        if (origen == null || destino == null)
            return Results.BadRequest("Las ubicaciones de origen y destino deben pertenecer al mismo almacén y estar activas.");

        if (origen.TipoUbicacion != destino.TipoUbicacion)
            return Results.BadRequest("La reubicación interna solo permite mover entre ubicaciones de la misma naturaleza (ej. entre disponibles o entre devoluciones). Para cambiar una serie de Disponible a Devolución use la Declaración DOA.");

        var producto = await db.Productos.FindAsync([r.ProductoId], ct);
        if (producto == null) return Results.BadRequest("Producto no encontrado.");

        decimal cantidadAMover = r.Cantidad;
        var seriesLimpias = r.Series?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim().ToUpperInvariant()).Distinct().ToList() ?? new List<string>();

        if (producto.EsSerializado)
        {
            if (seriesLimpias.Count == 0)
                return Results.BadRequest("El producto es serializado; debe indicar los números de serie a reubicar.");

            cantidadAMover = seriesLimpias.Count;

            var items = await db.ItemsSeriados
                .Where(x => seriesLimpias.Contains(x.NumeroSerie) && x.ProductoId == r.ProductoId)
                .ToListAsync(ct);

            if (items.Count != seriesLimpias.Count)
            {
                var encontrados = items.Select(x => x.NumeroSerie).ToHashSet();
                var faltantes = seriesLimpias.Where(s => !encontrados.Contains(s)).ToList();
                return Results.BadRequest($"Las siguientes series no existen para este producto: {string.Join(", ", faltantes)}.");
            }

            foreach (var item in items)
            {
                if (item.UbicacionActualId != origen.Id)
                    return Results.BadRequest($"La serie {item.NumeroSerie} no se encuentra actualmente en la ubicación de origen seleccionada ({origen.Nombre}).");

                item.ReubicarInterno(destino.Id);
            }
        }
        else
        {
            if (cantidadAMover <= 0)
                return Results.BadRequest("La cantidad a reubicar debe ser mayor a 0.");
        }

        // Actualizar saldo de stock
        var stockOrigen = await db.StocksAlmacen.FirstOrDefaultAsync(s => s.UbicacionId == origen.Id && s.ProductoId == r.ProductoId, ct);
        if (stockOrigen == null || stockOrigen.CantidadDisponible < cantidadAMover)
            return Results.BadRequest($"Stock insuficiente en {origen.Nombre}. Disponible: {stockOrigen?.CantidadDisponible ?? 0}, Solicitado: {cantidadAMover}.");

        stockOrigen.DisminuirStock(cantidadAMover);

        var stockDestino = await db.StocksAlmacen.FirstOrDefaultAsync(s => s.UbicacionId == destino.Id && s.ProductoId == r.ProductoId, ct);
        if (stockDestino == null)
        {
            stockDestino = StockAlmacen.Crear(destino.Id, r.ProductoId, cantidadAMover);
            await db.StocksAlmacen.AddAsync(stockDestino, ct);
        }
        else
        {
            stockDestino.AumentarStock(cantidadAMover);
        }

        // Registrar auditoría Kardex
        var mov = MovimientoInventario.Registrar(
            TipoMovimientoInventario.ReubicacionInterna,
            r.ProductoId,
            cantidadAMover,
            almacenOrigenId: id,
            almacenDestinoId: id,
            ubicacionOrigenId: origen.Id,
            ubicacionDestinoId: destino.Id,
            usuarioResponsableId: user.Id == Guid.Empty ? null : user.Id,
            observaciones: r.Observaciones?.Trim() ?? $"Reubicación física interna de {origen.Nombre} a {destino.Nombre}");

        await db.MovimientosInventario.AddAsync(mov, ct);
        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            mensaje = $"Se reubicaron exitosamente {cantidadAMover} unidad(es) de {origen.Nombre} hacia {destino.Nombre}.",
            cantidad = cantidadAMover
        });
    }

    // =========================================================================
    // DECLARACIÓN DOA / RECLASIFICACIÓN (DISPONIBLE -> DEVOLUCIÓN CON MOTIVO)
    // =========================================================================
    private static async Task<IResult> ReclasificarDoa(Guid id, DeclararDoaRequest r, IServicioCampoDbContext db, ICurrentUser user, CancellationToken ct)
    {
        var origen = await db.UbicacionesInventario.FirstOrDefaultAsync(u => u.Id == r.UbicacionOrigenId && u.AlmacenId == id && u.Activa, ct);
        var destino = await db.UbicacionesInventario.FirstOrDefaultAsync(u => u.Id == r.UbicacionDestinoId && u.AlmacenId == id && u.Activa, ct);

        if (origen == null || destino == null)
            return Results.BadRequest("Las ubicaciones de origen y destino deben pertenecer al almacén seleccionado.");

        if (origen.TipoUbicacion != TipoUbicacion.Disponible)
            return Results.BadRequest("La ubicación de origen para declarar DOA debe pertenecer a la rama DISPONIBLE.");

        if (destino.TipoUbicacion != TipoUbicacion.Devolucion)
            return Results.BadRequest("La ubicación de destino para declarar DOA debe pertenecer a la rama DEVOLUCIÓN.");

        var motivo = await db.MotivosRetiroEquipo.FirstOrDefaultAsync(m => m.Id == r.MotivoRetiroId && m.Activo, ct);
        if (motivo == null)
            return Results.BadRequest("Seleccione un motivo de retiro/falla activo.");

        var seriesLimpias = r.Series?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim().ToUpperInvariant()).Distinct().ToList() ?? new List<string>();
        if (seriesLimpias.Count == 0)
            return Results.BadRequest("Debe ingresar o escanear al menos una serie para declarar DOA / Reclasificación.");

        var items = await db.ItemsSeriados
            .Include(x => x.Producto)
            .Where(x => seriesLimpias.Contains(x.NumeroSerie))
            .ToListAsync(ct);

        if (items.Count != seriesLimpias.Count)
        {
            var encontrados = items.Select(x => x.NumeroSerie).ToHashSet();
            var faltantes = seriesLimpias.Where(s => !encontrados.Contains(s)).ToList();
            return Results.BadRequest($"Las siguientes series no están registradas en el sistema: {string.Join(", ", faltantes)}.");
        }

        // Agrupar por producto para actualizar stock
        var grupos = items.GroupBy(x => x.ProductoId);

        foreach (var grupo in grupos)
        {
            var productoId = grupo.Key;
            var cantidad = grupo.Count();

            foreach (var item in grupo)
            {
                if (item.UbicacionActualId != origen.Id)
                    return Results.BadRequest($"La serie {item.NumeroSerie} no se encuentra en la ubicación {origen.Nombre}.");

                var detalle = $"DOA: {motivo.Nombre} [{motivo.TipoRetiro}]" + (!string.IsNullOrWhiteSpace(r.Observaciones) ? $" - {r.Observaciones.Trim()}" : "");
                item.ReclasificarADevolucion(destino.Id, detalle);

                var mov = MovimientoInventario.Registrar(
                    TipoMovimientoInventario.ReclasificacionDOA,
                    productoId,
                    1m,
                    almacenOrigenId: id,
                    almacenDestinoId: id,
                    itemSeriadoId: item.Id,
                    ubicacionOrigenId: origen.Id,
                    ubicacionDestinoId: destino.Id,
                    usuarioResponsableId: user.Id == Guid.Empty ? null : user.Id,
                    observaciones: detalle,
                    condicion: CondicionInventario.Defectuoso);

                await db.MovimientosInventario.AddAsync(mov, ct);
            }

            // Descontar de stock utilizable en origen
            var stockOrigen = await db.StocksAlmacen.FirstOrDefaultAsync(s => s.UbicacionId == origen.Id && s.ProductoId == productoId && s.Condicion == CondicionInventario.Utilizable, ct);
            if (stockOrigen != null)
            {
                var aDescontar = Math.Min(stockOrigen.CantidadDisponible, cantidad);
                if (aDescontar > 0) stockOrigen.DisminuirStock(aDescontar);
            }

            // Aumentar en stock defectuoso en destino
            var stockDestino = await db.StocksAlmacen.FirstOrDefaultAsync(s => s.UbicacionId == destino.Id && s.ProductoId == productoId && s.Condicion == CondicionInventario.Defectuoso, ct);
            if (stockDestino == null)
            {
                stockDestino = StockAlmacen.Crear(destino.Id, productoId, cantidad, CondicionInventario.Defectuoso);
                await db.StocksAlmacen.AddAsync(stockDestino, ct);
            }
            else
            {
                stockDestino.AumentarStock(cantidad);
            }
        }

        await db.SaveChangesAsync(ct);

        return Results.Ok(new
        {
            mensaje = $"Se declararon con éxito {items.Count} equipo(s) a {destino.Nombre} bajo el motivo '{motivo.Nombre}'.",
            totalSeries = items.Count
        });
    }

    private static async Task<IResult> ObtenerReclasificacionesDoa(Guid? almacenId, IServicioCampoDbContext db, CancellationToken ct)
    {
        var query = db.MovimientosInventario
            .AsNoTracking()
            .Include(m => m.Producto)
            .Include(m => m.ItemSeriado)
            .Include(m => m.AlmacenOrigen)
            .Where(m => m.Tipo == TipoMovimientoInventario.ReclasificacionDOA);

        if (almacenId.HasValue && almacenId.Value != Guid.Empty)
        {
            query = query.Where(m => m.AlmacenOrigenId == almacenId.Value || m.AlmacenDestinoId == almacenId.Value);
        }

        var list = await query
            .OrderByDescending(m => m.FechaMovimiento)
            .Take(300)
            .ToListAsync(ct);

        var ubicacionIds = list.SelectMany(m => new[] { m.UbicacionOrigenId, m.UbicacionDestinoId })
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var ubicacionesMap = await db.UbicacionesInventario
            .AsNoTracking()
            .Where(u => ubicacionIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Nombre, ct);

        var resultado = list.Select(m => new
        {
            m.Id,
            Fecha = m.FechaMovimiento,
            AlmacenId = m.AlmacenOrigenId ?? Guid.Empty,
            AlmacenNombre = m.AlmacenOrigen?.Nombre ?? "Almacén",
            UbicacionOrigenNombre = m.UbicacionOrigenId.HasValue && ubicacionesMap.TryGetValue(m.UbicacionOrigenId.Value, out var uOri) ? uOri : "Disponible",
            UbicacionDestinoNombre = m.UbicacionDestinoId.HasValue && ubicacionesMap.TryGetValue(m.UbicacionDestinoId.Value, out var uDes) ? uDes : "Devolución",
            m.ProductoId,
            ProductoNombre = m.Producto?.Nombre ?? "—",
            ProductoCodigo = m.Producto?.Codigo ?? "—",
            NumeroSerie = m.ItemSeriado?.NumeroSerie ?? "—",
            NumeroSmartCard = m.ItemSeriado?.NumeroSmartCard,
            m.Observaciones,
            Condicion = m.Condicion.ToString()
        });

        return Results.Ok(resultado);
    }

    private static async Task<IResult> ObtenerSeriesDisponiblesAlmacen(Guid id, IServicioCampoDbContext db, CancellationToken ct)
    {
        var series = await db.ItemsSeriados
            .AsNoTracking()
            .Include(x => x.Producto)
            .Include(x => x.UbicacionActual)
            .Where(x => x.UbicacionActual != null &&
                        x.UbicacionActual.AlmacenId == id &&
                        (x.UbicacionActual.TipoUbicacion == TipoUbicacion.Disponible || x.UbicacionActual.EsPrincipal || x.UbicacionActual.Codigo == "DISPONIBLE" || x.UbicacionActual.Codigo == "PRINCIPAL") &&
                        (x.Estado == EstadoItemSeriado.EnAlmacen || (int)x.Estado == 1) &&
                        x.TransferenciaEnTransitoId == null)
            .OrderBy(x => x.NumeroSerie)
            .Select(x => new
            {
                x.Id,
                x.NumeroSerie,
                x.NumeroSmartCard,
                x.MacAddress,
                x.ProductoId,
                ProductoNombre = x.Producto.Nombre,
                ProductoCodigo = x.Producto.Codigo,
                x.UbicacionActualId,
                UbicacionNombre = x.UbicacionActual != null ? x.UbicacionActual.Nombre : string.Empty,
                UbicacionCodigo = x.UbicacionActual != null ? x.UbicacionActual.Codigo : string.Empty,
            })
            .ToListAsync(ct);

        return Results.Ok(series);
    }

    private static async Task<IResult> ObtenerSeriesPorUbicacion(Guid id, Guid ubicacionId, IServicioCampoDbContext db, CancellationToken ct)
    {
        var series = await db.ItemsSeriados
            .AsNoTracking()
            .Include(x => x.Producto)
            .Where(x => x.UbicacionActualId == ubicacionId && x.UbicacionActual != null && x.UbicacionActual.AlmacenId == id)
            .OrderBy(x => x.NumeroSerie)
            .Select(x => new
            {
                x.Id,
                x.NumeroSerie,
                x.NumeroSmartCard,
                x.MacAddress,
                x.ProductoId,
                ProductoNombre = x.Producto.Nombre,
                ProductoCodigo = x.Producto.Codigo,
                Estado = x.Estado.ToString()
            })
            .ToListAsync(ct);

        return Results.Ok(series);
    }

    private static bool DestinoPermitido(Almacen a, Almacen b) =>
        b.Activo &&
        (a.Id == b.Id ||
         (a.Tipo == TipoAlmacen.Bodega && b.Tipo == TipoAlmacen.Bodega) ||
         (a.Tipo == TipoAlmacen.Bodega && b.Tipo == TipoAlmacen.CustodiaPersonal &&
          ((b.AlmacenPadreId.HasValue && b.AlmacenPadreId == a.Id) ||
           (!b.AlmacenPadreId.HasValue && a.UnidadOrganizativaId.HasValue && b.UnidadOrganizativaId.HasValue && a.UnidadOrganizativaId == b.UnidadOrganizativaId))) ||
         (a.Tipo == TipoAlmacen.CustodiaPersonal && b.Tipo == TipoAlmacen.Bodega &&
          ((a.AlmacenPadreId.HasValue && a.AlmacenPadreId == b.Id) ||
           (!a.AlmacenPadreId.HasValue && a.UnidadOrganizativaId.HasValue && b.UnidadOrganizativaId.HasValue && a.UnidadOrganizativaId == b.UnidadOrganizativaId))));

    private static async Task<IResult> ObtenerDestinos(Guid id, IServicioCampoDbContext db, ICurrentUser user, CancellationToken ct)
    {
        if (!await InventarioAcceso.PuedeAsync(db, user, id, "despachar", ct)) return Results.Forbid();
        var origen = await db.Almacenes.FindAsync([id], ct); if (origen == null) return Results.NotFound();
        var almacenes = await db.Almacenes.Where(x => x.Activo).OrderBy(x => x.Nombre).ToListAsync(ct);
        return Results.Ok(almacenes.Where(x => DestinoPermitido(origen, x)).Select(x => new { x.Id, x.Codigo, x.Nombre, Tipo = (int)x.Tipo, x.UnidadOrganizativaId, x.AlmacenPadreId, x.RecursoId, x.Activo }));
    }

    private static async Task<IResult> ObtenerAutorizaciones(Guid id, IServicioCampoDbContext db, ICurrentUser user, BubbaBag.Modules.Seguridad.Application.Auth.IAuthService usuarios, CancellationToken ct)
    {
        if (!await InventarioAcceso.PuedeAsync(db, user, id, "supervisar", ct) && !user.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin, BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoAdmin, BubbaBag.SharedKernel.Authorization.Roles.InventarioAdmin)) return Results.Forbid();
        var lista = await db.UsuarioAlmacenAutorizaciones.Where(x => x.AlmacenId == id).ToListAsync(ct);
        var usuariosRes = await usuarios.ObtenerUsuariosAsync(soloActivos: false);
        var mapa = usuariosRes.IsSuccess ? usuariosRes.Value.ToDictionary(u => u.Id, u => u) : new();
        var resultado = lista.Select(x =>
        {
            mapa.TryGetValue(x.UsuarioId, out var u);
            return new
            {
                x.UsuarioId,
                NombreCompleto = u?.NombreCompleto ?? x.UsuarioId.ToString(),
                Email = u?.Email ?? string.Empty,
                x.PuedeConsultar,
                x.PuedeDespachar,
                x.PuedeRecepcionar,
                x.EsSupervisor,
                x.Activo
            };
        });
        return Results.Ok(resultado);
    }

    private static async Task<IResult> GuardarAutorizacion(Guid id, Guid usuarioId, AutorizacionRequest r, IServicioCampoDbContext db, ICurrentUser user, BubbaBag.Modules.Seguridad.Application.Auth.IAuthService usuarios, CancellationToken ct)
    {
        if (!user.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin, BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoAdmin, BubbaBag.SharedKernel.Authorization.Roles.InventarioAdmin) || !user.IsAuthenticated) return Results.Forbid();
        if (usuarioId == Guid.Empty || !await db.Almacenes.AnyAsync(x => x.Id == id, ct)) return Results.BadRequest("Usuario o almacén inválido.");
        var cuenta = await usuarios.ObtenerUsuarioPorIdAsync(usuarioId);
        if (cuenta.IsFailure || r.Activo && !cuenta.Value.EsActivo) return Results.BadRequest("El usuario no existe o está inactivo.");

        if (!EsUsuarioAutorizable(cuenta.Value.Roles))
            return Results.BadRequest("Solo se pueden asignar y autorizar usuarios que tengan rol operativo de Almacenero o Administrador.");

        if (r.Activo && !r.PuedeConsultar && (r.PuedeDespachar || r.PuedeRecepcionar || r.EsSupervisor)) return Results.BadRequest("Las facultades operativas requieren permiso de consulta.");
        var a = await db.UsuarioAlmacenAutorizaciones.SingleOrDefaultAsync(x => x.UsuarioId == usuarioId && x.AlmacenId == id, ct);
        if (a == null) { a = UsuarioAlmacenAutorizacion.Crear(usuarioId, id, r.PuedeConsultar, r.PuedeDespachar, r.PuedeRecepcionar, r.EsSupervisor); db.UsuarioAlmacenAutorizaciones.Add(a); }
        else a.ActualizarPermisos(r.PuedeConsultar, r.PuedeDespachar, r.PuedeRecepcionar, r.EsSupervisor);
        if (r.Activo) a.Activar(); else a.Desactivar(); await db.SaveChangesAsync(ct); return Results.NoContent();
    }

    private static async Task<IResult> EliminarAutorizacion(Guid id, Guid usuarioId, IServicioCampoDbContext db, ICurrentUser user, CancellationToken ct)
    {
        if (!user.HasAnyRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin, BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoAdmin, BubbaBag.SharedKernel.Authorization.Roles.InventarioAdmin) || !user.IsAuthenticated) return Results.Forbid();
        var a = await db.UsuarioAlmacenAutorizaciones.SingleOrDefaultAsync(x => x.UsuarioId == usuarioId && x.AlmacenId == id, ct);
        if (a == null) return Results.NotFound();
        db.UsuarioAlmacenAutorizaciones.Remove(a);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }
}

public record CrearUbicacionRequest(string Codigo, string Nombre, TipoUbicacion? TipoUbicacion = null, Guid? UbicacionPadreId = null);
public record AutorizacionRequest(bool PuedeConsultar, bool PuedeDespachar, bool PuedeRecepcionar, bool EsSupervisor, bool Activo = true);
public record ReubicarMaterialRequest(Guid UbicacionOrigenId, Guid UbicacionDestinoId, Guid ProductoId, decimal Cantidad, List<string>? Series = null, string? Observaciones = null);
public record DeclararDoaRequest(Guid UbicacionOrigenId, Guid UbicacionDestinoId, Guid MotivoRetiroId, List<string> Series, string? Observaciones = null);
