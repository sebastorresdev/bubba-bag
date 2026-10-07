using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;
namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.RecepcionarTransferencia;
public record LineaRecepcionTransferencia(Guid TransferenciaDetalleId, decimal Cantidad, IReadOnlyCollection<string>? Series = null);
public record RecepcionarTransferenciaCommand(Guid TransferenciaId,IReadOnlyCollection<LineaRecepcionTransferencia> Lineas,string? Observaciones=null,Guid OperacionId=default,DateTime? FechaReal=null):ICommand<Result<string>>;
public class RecepcionarTransferenciaHandler(IServicioCampoDbContext db,ICurrentUser user):ICommandHandler<RecepcionarTransferenciaCommand,Result<string>>
{
    public async Task<Result<string>> HandleAsync(RecepcionarTransferenciaCommand c,CancellationToken cancellationToken=default)
    {
        var t=await db.Transferencias.Include(x=>x.Lineas).ThenInclude(x=>x.Series).FirstOrDefaultAsync(x=>x.Id==c.TransferenciaId,cancellationToken);
        if(t==null) return Result<string>.Failure("La transferencia no existe.");
        if(!await InventarioAcceso.PuedeAsync(db,user,t.AlmacenDestinoId,"recibir",cancellationToken)) return Result<string>.Failure("No tiene autorización para recibir en destino.");
        if(c.OperacionId==Guid.Empty || c.Lineas==null || c.Lineas.Count==0 || c.Lineas.Count>500 || c.Lineas.Any(x=>x.Cantidad<=0 || x.Cantidad>999999999.99999m || (x.Series??[]).Any(string.IsNullOrWhiteSpace)) || c.Lineas.Select(x=>x.TransferenciaDetalleId).Distinct().Count()!=c.Lineas.Count) return Result<string>.Failure("Indique líneas únicas, cantidades positivas, series válidas e identificador de operación.");
        if(c.FechaReal.HasValue && (c.FechaReal.Value.Kind!=DateTimeKind.Utc || c.FechaReal > DateTime.UtcNow.AddMinutes(5))) return Result<string>.Failure("La fecha real debe ser UTC y no futura.");
        var anterior=await db.RecepcionesTransferencia.Include(x=>x.Lineas).FirstOrDefaultAsync(x=>x.OperacionId==c.OperacionId,cancellationToken);
        if(anterior!=null)
        {
            var ids=anterior.Lineas.Select(x=>x.Id).ToList();
            var seriesAnteriores=await db.TransferenciaDetalleSeries.Where(x=>x.RecepcionDetalleId.HasValue && ids.Contains(x.RecepcionDetalleId.Value)).ToListAsync(cancellationToken);
            var igual=anterior.TransferenciaId==t.Id && anterior.Observaciones==c.Observaciones?.Trim() && (!c.FechaReal.HasValue || anterior.FechaReal==c.FechaReal) && anterior.Lineas.Count==c.Lineas.Count && c.Lineas.All(l=>anterior.Lineas.Any(x=>x.TransferenciaDetalleId==l.TransferenciaDetalleId && x.CantidadAceptada==l.Cantidad && seriesAnteriores.Where(s=>s.RecepcionDetalleId==x.Id).Select(s=>s.NumeroSerie).Order().SequenceEqual((l.Series??[]).Select(s=>s.Trim().ToUpperInvariant()).Order())));
            return igual?Result<string>.Success(anterior.NumeroRecepcion):Result<string>.Failure("El identificador ya corresponde a otra recepción.");
        }
        if(t.Estado is not (EstadoTransferencia.EnTransito or EstadoTransferencia.ParcialmenteRecibida)) return Result<string>.Failure("La transferencia no tiene material pendiente en tránsito.");
        var destino=await InventarioAcceso.UbicacionAsync(db,t.AlmacenDestinoId,t.UbicacionDestinoId,cancellationToken);
        if(destino==null) return Result<string>.Failure("La ubicación destino no está activa.");
        var productos=await db.Productos.Where(x=>t.Lineas.Select(l=>l.ProductoId).Contains(x.Id)).ToDictionaryAsync(x=>x.Id,cancellationToken);
        foreach(var l in c.Lineas)
        {
            var d=t.Lineas.FirstOrDefault(x=>x.Id==l.TransferenciaDetalleId);
            if(d==null || l.Cantidad>d.CantidadPendiente || !productos.TryGetValue(d.ProductoId,out var p)) return Result<string>.Failure("La línea no pertenece al envío o supera el pendiente.");
            if(decimal.Round(l.Cantidad,Math.Clamp(p.DecimalesCantidad,0,5))!=l.Cantidad) return Result<string>.Failure("Revise los decimales de cantidad.");
            var series=(l.Series??[]).Select(s=>s.Trim().ToUpperInvariant()).ToList();
            if(p.EsSerializado && (decimal.Truncate(l.Cantidad)!=l.Cantidad || series.Count!=l.Cantidad || series.Distinct().Count()!=series.Count || series.Any(s=>!d.Series.Any(x=>x.NumeroSerie==s && !x.Recibida && !x.ResolucionId.HasValue)))) return Result<string>.Failure("Capture únicamente las series pendientes que llegaron: una serie por unidad.");
            if(!p.EsSerializado && series.Count>0) return Result<string>.Failure("Un no seriado no admite series.");
        }
        var r=RecepcionTransferencia.Crear($"REC-{Guid.NewGuid():N}",t.Id,user.Id,user.Nombre,c.Observaciones,c.OperacionId,c.FechaReal);
        try
        {
            await db.EjecutarEnTransaccionAsync(async ct=>
            {
                foreach(var l in c.Lineas)
                {
                    var d=t.Lineas.Single(x=>x.Id==l.TransferenciaDetalleId); d.RegistrarRecepcion(l.Cantidad);
                    (await InventarioSaldos.ObtenerAsync(db,destino.Id,d.ProductoId,d.Condicion,ct)).AumentarStock(l.Cantidad);
                    var rd=r.AgregarLinea(d.Id,d.ProductoId,l.Cantidad);
                    var series=(l.Series??[]).Select(s=>s.Trim().ToUpperInvariant()).ToList();
                    if(series.Count==0) db.MovimientosInventario.Add(MovimientoInventario.Registrar(TipoMovimientoInventario.RecepcionDeTransito,d.ProductoId,l.Cantidad,almacenDestinoId:t.AlmacenDestinoId,numeroDocumento:r.NumeroRecepcion,usuarioResponsableId:user.Id,ubicacionDestinoId:destino.Id,transferenciaId:t.Id,eventoId:r.Id,fechaReal:r.FechaReal,condicion:d.Condicion));
                    foreach(var s in series)
                    {
                        var sd=d.Series.Single(x=>x.NumeroSerie==s);
                        var item=await db.ItemsSeriados.SingleAsync(x=>x.Id==sd.ItemSeriadoId,ct);
                        if(item.TransferenciaEnTransitoId!=t.Id || item.UbicacionActualId.HasValue) throw new InvalidOperationException("La serie no está en tránsito en este envío.");
                        sd.MarcarRecibida(rd.Id); item.Ubicar(destino.Id,destino.Almacen.Tipo,d.Condicion);
                        db.MovimientosInventario.Add(MovimientoInventario.Registrar(TipoMovimientoInventario.RecepcionDeTransito,d.ProductoId,1,almacenDestinoId:t.AlmacenDestinoId,itemSeriadoId:item.Id,numeroDocumento:r.NumeroRecepcion,usuarioResponsableId:user.Id,ubicacionDestinoId:destino.Id,transferenciaId:t.Id,eventoId:r.Id,fechaReal:r.FechaReal,condicion:d.Condicion));
                    }
                }
                t.ActualizarEstadoPorRecepciones(); db.RecepcionesTransferencia.Add(r); await db.SaveChangesAsync(ct);
            },cancellationToken);
            return Result<string>.Success(r.NumeroRecepcion);
        }
        catch(DbUpdateException){return Result<string>.Failure("La recepción cambió o ya se procesó. Actualice y reintente con el mismo identificador.");}
        catch(InvalidOperationException ex){return Result<string>.Failure(ex.Message);}
    }
}
