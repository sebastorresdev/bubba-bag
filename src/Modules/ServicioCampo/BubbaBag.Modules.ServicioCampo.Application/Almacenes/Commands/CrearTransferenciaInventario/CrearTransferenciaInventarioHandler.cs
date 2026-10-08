using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;
namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearTransferenciaInventario;

public record LineaTransferenciaInventario(Guid ProductoId, decimal Cantidad, IReadOnlyCollection<string>? Series = null, CondicionInventario Condicion = CondicionInventario.Utilizable);
public record CrearTransferenciaInventarioCommand(Guid AlmacenOrigenId, Guid AlmacenDestinoId, IReadOnlyCollection<LineaTransferenciaInventario>? Lineas,
    string? Observacion = null, string? GuiaRemision = null, Guid? UbicacionOrigenId = null, Guid? UbicacionDestinoId = null,
    ModalidadTransferencia? Modalidad = null, Guid OperacionId = default, DateTime? FechaReal = null, bool EsBorrador = false, Guid? TransferenciaId = null) : ICommand<Result<string>>;

public class CrearTransferenciaInventarioHandler(IServicioCampoDbContext db, ICurrentUser user, ICodigoSecuencialService? seqService = null) : ICommandHandler<CrearTransferenciaInventarioCommand, Result<string>>
{
    public async Task<Result<string>> HandleAsync(CrearTransferenciaInventarioCommand c, CancellationToken cancellationToken = default)
    {
        if (!await InventarioAcceso.PuedeAsync(db,user,c.AlmacenOrigenId,"despachar",cancellationToken)) return Result<string>.Failure("No tiene autorización para despachar desde el origen.");
        if (c.OperacionId == Guid.Empty) return Result<string>.Failure("Falta el identificador de operación.");
        var lineas = c.Lineas ?? Array.Empty<LineaTransferenciaInventario>();
        if (!c.EsBorrador && lineas.Count == 0) return Result<string>.Failure("Debe agregar al menos un producto a la transferencia.");
        if (lineas.Count > 0 && (lineas.Count > 500 || lineas.Any(x=>x.Cantidad<=0 || x.Cantidad>999999999.99999m || (x.Series??[]).Any(string.IsNullOrWhiteSpace) || x.ProductoId==Guid.Empty || !Enum.IsDefined(x.Condicion)))) return Result<string>.Failure("Revise las líneas de productos y cantidades.");
        if (c.FechaReal.HasValue && (c.FechaReal.Value.Kind != DateTimeKind.Utc || c.FechaReal > DateTime.UtcNow.AddMinutes(5))) return Result<string>.Failure("La fecha real debe ser UTC y no futura.");
        if(c.Observacion?.Length>500 || c.GuiaRemision?.Length>100) return Result<string>.Failure("La observación o guía supera la longitud permitida.");
        var origen = await InventarioAcceso.UbicacionAsync(db,c.AlmacenOrigenId,c.UbicacionOrigenId,cancellationToken);
        if (origen == null) return Result<string>.Failure("La ubicación de origen especificada no existe, está inactiva o no pertenece al almacén de origen seleccionado.");

        var destino = await InventarioAcceso.UbicacionAsync(db,c.AlmacenDestinoId,c.UbicacionDestinoId,cancellationToken);
        if (destino == null) return Result<string>.Failure("La ubicación de destino especificada no existe, está inactiva o no pertenece al almacén/custodia de destino seleccionado.");

        if (origen.Id == destino.Id) return Result<string>.Failure("La ubicación de origen y la ubicación de destino no pueden ser la misma.");
        var a=origen.Almacen; var b=destino.Almacen;
        if (!a.UnidadOrganizativaId.HasValue || !b.UnidadOrganizativaId.HasValue) return Result<string>.Failure("Ambos almacenes deben tener unidad organizativa.");
        if (a.Tipo==TipoAlmacen.CustodiaPersonal && b.Tipo==TipoAlmacen.CustodiaPersonal && a.Id!=b.Id) return Result<string>.Failure("El material debe retornar a bodega antes de abastecer otra custodia personal.");
        var mismaUnidad=a.UnidadOrganizativaId==b.UnidadOrganizativaId;
        if (!mismaUnidad && (a.Tipo==TipoAlmacen.CustodiaPersonal || b.Tipo==TipoAlmacen.CustodiaPersonal)) return Result<string>.Failure("La custodia personal solo intercambia material con bodegas de su unidad.");
        var modalidad=c.Modalidad ?? (mismaUnidad ? ModalidadTransferencia.Inmediata : ModalidadTransferencia.ConTransito);
        if (!Enum.IsDefined(modalidad) || !mismaUnidad && modalidad!=ModalidadTransferencia.ConTransito) return Result<string>.Failure("Entre unidades se exige despacho y recepción separados.");
        if (modalidad==ModalidadTransferencia.Inmediata && !c.EsBorrador && !await InventarioAcceso.PuedeAsync(db,user,b.Id,"recibir",cancellationToken)) return Result<string>.Failure("La entrega inmediata requiere autorización de recepción en destino.");
        var agrupadas=lineas.GroupBy(x=>new{x.ProductoId,x.Condicion}).Select(g=>new LineaTransferenciaInventario(g.Key.ProductoId,g.Sum(x=>x.Cantidad),g.SelectMany(x=>x.Series??[]).Select(x=>x.Trim().ToUpperInvariant()).ToList(),g.Key.Condicion)).ToList();
        var anterior = await db.Transferencias
            .Include(x => x.Lineas).ThenInclude(x => x.Series)
            .FirstOrDefaultAsync(x => (c.TransferenciaId.HasValue && x.Id == c.TransferenciaId.Value) || x.OperacionId == c.OperacionId, cancellationToken);
        if (anterior != null)
        {
            if (anterior.Estado != EstadoTransferencia.Borrador)
            {
                var coincide = anterior.UbicacionOrigenId == origen.Id && anterior.UbicacionDestinoId == destino.Id && anterior.Modalidad == modalidad && anterior.Observaciones == c.Observacion?.Trim() && anterior.NumeroGuiaRemision == c.GuiaRemision?.Trim() && (!c.FechaReal.HasValue || anterior.FechaReal == c.FechaReal.Value) && anterior.Lineas.Count == agrupadas.Count && agrupadas.All(l => anterior.Lineas.Any(x => x.ProductoId == l.ProductoId && x.Condicion == l.Condicion && x.CantidadEnviada == l.Cantidad && x.Series.Select(s => s.NumeroSerie).Order().SequenceEqual((l.Series ?? []).Order())));
                return coincide ? Result<string>.Success(anterior.Numero) : Result<string>.Failure("El identificador de operación ya pertenece a otro envío.");
            }
        }

        var productos = await db.Productos.Include(x => x.UnidadMedidaDefecto).Where(x => agrupadas.Select(l => l.ProductoId).Contains(x.Id) && x.Activo && x.Tipo == TipoProducto.Inventario).ToDictionaryAsync(x => x.Id, cancellationToken);
        if (productos.Count != agrupadas.Select(x => x.ProductoId).Distinct().Count()) return Result<string>.Failure("Algún producto no es inventariable o está inactivo.");
        if (agrupadas.Any(x => x.Cantidad > 999999999.99999m)) return Result<string>.Failure("La cantidad supera el límite permitido.");
        var todas = agrupadas.SelectMany(x => x.Series ?? []).ToList();
        if (todas.Any(string.IsNullOrWhiteSpace) || todas.Distinct().Count() != todas.Count) return Result<string>.Failure("Hay series vacías o repetidas.");
        var items = await db.ItemsSeriados.Where(x => todas.Contains(x.NumeroSerie)).ToDictionaryAsync(x => x.NumeroSerie, cancellationToken);
        foreach (var l in agrupadas)
        {
            var p = productos[l.ProductoId];
            if (decimal.Round(l.Cantidad, Math.Clamp(p.DecimalesCantidad, 0, 5)) != l.Cantidad) return Result<string>.Failure("Cantidad con decimales no permitidos.");
            if (p.EsSerializado)
            {
                if (decimal.Truncate(l.Cantidad) != l.Cantidad || l.Series!.Count != l.Cantidad) return Result<string>.Failure("Indique una serie única por cada unidad.");
                foreach (var s in l.Series) if (!items.TryGetValue(s, out var i) || i.ProductoId != p.Id || i.UbicacionActualId != origen.Id || i.TransferenciaEnTransitoId.HasValue) return Result<string>.Failure($"La serie '{s}' no corresponde al producto o no está disponible en la ubicación de origen.");
            }
            else if (l.Series!.Count > 0) return Result<string>.Failure("Un producto no seriado no admite series.");
        }

        var correlativo = $"{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..15].ToUpperInvariant();
        var numeroTransferencia = $"TRF-{correlativo}";
        string numeroGuia;
        if (!string.IsNullOrWhiteSpace(c.GuiaRemision))
        {
            numeroGuia = c.GuiaRemision.Trim().ToUpperInvariant();
        }
        else if (anterior != null && !string.IsNullOrWhiteSpace(anterior.NumeroGuiaRemision))
        {
            numeroGuia = anterior.NumeroGuiaRemision;
        }
        else if (seqService != null)
        {
            numeroGuia = await seqService.SiguienteCodigoAsync(
                prefijo: "GR",
                nombreSecuencia: "seq_guias_remision",
                esquema: "serviciocampo",
                longitud: 7,
                cancellationToken: cancellationToken);
        }
        else
        {
            var count = await db.Transferencias.CountAsync(cancellationToken);
            numeroGuia = $"GR-{(count + 1):D7}";
        }

        var t = anterior ?? Transferencia.Crear(numeroTransferencia, a.Id, b.Id, a.UnidadOrganizativaId.Value, b.UnidadOrganizativaId.Value, modalidad, user.Id, user.Nombre, c.Observacion, numeroGuia, origen.Id, destino.Id, c.OperacionId, c.FechaReal);
        if (anterior != null)
        {
            anterior.ActualizarBorrador(c.Observacion, numeroGuia);
            if (anterior.Lineas.Count > 0)
            {
                db.TransferenciaDetalleSeries.RemoveRange(anterior.Lineas.SelectMany(x => x.Series));
                db.TransferenciaDetalles.RemoveRange(anterior.Lineas);
                anterior.Lineas.Clear();
            }
        }

        foreach (var l in agrupadas)
        {
            var d = t.AgregarLinea(l.ProductoId, l.Cantidad, l.Condicion, productos[l.ProductoId].UnidadMedidaDefectoId, productos[l.ProductoId].UnidadMedidaDefecto?.Nombre);
            db.TransferenciaDetalles.Add(d);
            foreach (var s in l.Series ?? [])
            {
                d.AgregarSerie(items[s].Id, s);
            }
        }

        if (c.EsBorrador)
        {
            if (anterior == null) db.Transferencias.Add(t);
            await db.SaveChangesAsync(cancellationToken);
            return Result<string>.Success(t.Numero);
        }
        try
        {
            await db.EjecutarEnTransaccionAsync(async ct =>
            {
                foreach (var l in t.Lineas)
                {
                    var tipo = modalidad == ModalidadTransferencia.ConTransito ? TipoMovimientoInventario.SalidaATransito : a.Tipo == TipoAlmacen.Bodega && b.Tipo == TipoAlmacen.CustodiaPersonal ? TipoMovimientoInventario.DespachoATecnico : a.Tipo == TipoAlmacen.CustodiaPersonal && b.Tipo == TipoAlmacen.Bodega ? TipoMovimientoInventario.DevolucionTecnico : TipoMovimientoInventario.TransferenciaAlmacenes;

                    if (l.Series.Count > 0)
                    {
                        var seriesPorCondicionOrigen = l.Series.GroupBy(s => items[s.NumeroSerie].Condicion);
                        foreach (var grp in seriesPorCondicionOrigen)
                        {
                            var saldoOrigenCondicion = await InventarioSaldos.ObtenerAsync(db, origen.Id, l.ProductoId, grp.Key, ct);
                            saldoOrigenCondicion.DisminuirStock(grp.Count());
                        }

                        if (modalidad == ModalidadTransferencia.Inmediata)
                        {
                            var saldoDestino = await InventarioSaldos.ObtenerAsync(db, destino.Id, l.ProductoId, l.Condicion, ct);
                            saldoDestino.AumentarStock(l.CantidadEnviada);
                        }

                        foreach (var s in l.Series)
                        {
                            var item = items[s.NumeroSerie];
                            if (modalidad == ModalidadTransferencia.Inmediata) item.Ubicar(destino.Id, b.Tipo, l.Condicion);
                            else item.DespacharEnTransito(t.Id);
                            db.MovimientosInventario.Add(MovimientoInventario.Registrar(tipo, l.ProductoId, 1, a.Id, modalidad == ModalidadTransferencia.Inmediata ? b.Id : null, itemSeriadoId: item.Id, numeroDocumento: t.Numero, usuarioResponsableId: user.Id, ubicacionOrigenId: origen.Id, ubicacionDestinoId: modalidad == ModalidadTransferencia.Inmediata ? destino.Id : null, transferenciaId: t.Id, eventoId: t.Id, fechaReal: t.FechaReal, condicion: l.Condicion));
                        }
                    }
                    else
                    {
                        var saldoOrigen = await InventarioSaldos.ObtenerAsync(db, origen.Id, l.ProductoId, l.Condicion, ct);
                        if (saldoOrigen.CantidadDisponible < l.CantidadEnviada && l.Condicion != CondicionInventario.Utilizable)
                        {
                            var saldoUtilizable = await InventarioSaldos.ObtenerAsync(db, origen.Id, l.ProductoId, CondicionInventario.Utilizable, ct);
                            if (saldoUtilizable.CantidadDisponible >= l.CantidadEnviada)
                            {
                                saldoOrigen = saldoUtilizable;
                            }
                        }
                        saldoOrigen.DisminuirStock(l.CantidadEnviada);

                        if (modalidad == ModalidadTransferencia.Inmediata)
                        {
                            var saldoDestino = await InventarioSaldos.ObtenerAsync(db, destino.Id, l.ProductoId, l.Condicion, ct);
                            saldoDestino.AumentarStock(l.CantidadEnviada);
                        }

                        db.MovimientosInventario.Add(MovimientoInventario.Registrar(tipo, l.ProductoId, l.CantidadEnviada, a.Id, modalidad == ModalidadTransferencia.Inmediata ? b.Id : null, numeroDocumento: t.Numero, usuarioResponsableId: user.Id, observaciones: c.Observacion, ubicacionOrigenId: origen.Id, ubicacionDestinoId: modalidad == ModalidadTransferencia.Inmediata ? destino.Id : null, transferenciaId: t.Id, eventoId: t.Id, fechaReal: t.FechaReal, condicion: l.Condicion));
                    }
                }
                t.Despachar(user.Id, user.Nombre, t.NumeroGuiaRemision ?? numeroGuia);
                if (anterior == null) db.Transferencias.Add(t);
                await db.SaveChangesAsync(ct);
            }, cancellationToken);
            return Result<string>.Success(t.Numero);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var entries = string.Join("; ", ex.Entries.Select(e => $"{e.Entity.GetType().Name} ({e.State})"));
            return Result<string>.Failure($"El inventario cambió. Actualice antes de confirmar. [Detalles: {entries} | {ex.Message}]");
        }
        catch (DbUpdateException ex) { return Result<string>.Failure($"La operación ya se procesó o el inventario cambió. Actualice y reintente con el mismo identificador. [{ex.InnerException?.Message ?? ex.Message}]"); }
        catch (InvalidOperationException ex) { return Result<string>.Failure(ex.Message); }
    }
}
