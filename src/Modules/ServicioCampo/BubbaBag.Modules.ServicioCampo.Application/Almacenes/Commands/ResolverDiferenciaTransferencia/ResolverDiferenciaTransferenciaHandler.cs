using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;
namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.ResolverDiferenciaTransferencia;

public record ResolverDiferenciaTransferenciaCommand(Guid TransferenciaId,Guid DetalleId,decimal Cantidad,TipoResolucionDiferencia Resultado,string Motivo,string Evidencia,IReadOnlyCollection<string>? Series,Guid OperacionId):ICommand<Result<Guid>>;
public class ResolverDiferenciaTransferenciaHandler(IServicioCampoDbContext db,ICurrentUser user):ICommandHandler<ResolverDiferenciaTransferenciaCommand,Result<Guid>>
{
    public async Task<Result<Guid>> HandleAsync(ResolverDiferenciaTransferenciaCommand c,CancellationToken cancellationToken=default)
    {
        var t=await db.Transferencias.Include(x=>x.Lineas).ThenInclude(x=>x.Series).SingleOrDefaultAsync(x=>x.Id==c.TransferenciaId,cancellationToken);
        if(t==null)return Result<Guid>.Failure("La transferencia no existe.");
        if(!await InventarioAcceso.PuedeAsync(db,user,t.AlmacenDestinoId,"supervisar",cancellationToken) || c.Resultado==TipoResolucionDiferencia.RestitucionAOrigen && !await InventarioAcceso.PuedeAsync(db,user,t.AlmacenOrigenId,"supervisar",cancellationToken))return Result<Guid>.Failure("Se requiere supervisión sobre los almacenes afectados.");
        if(c.OperacionId==Guid.Empty || c.Cantidad<=0 || !Enum.IsDefined(c.Resultado) || string.IsNullOrWhiteSpace(c.Motivo) || string.IsNullOrWhiteSpace(c.Evidencia))return Result<Guid>.Failure("Complete cantidad, resultado, motivo, evidencia e identificador de operación.");
        if((c.Series??[]).Any(string.IsNullOrWhiteSpace) || c.Motivo.Length>500 || c.Evidencia.Length>500 || c.Cantidad>999999999.99999m) return Result<Guid>.Failure("Revise cantidades, series y longitud de las referencias.");
        var series=(c.Series??[]).Select(x=>x.Trim().ToUpperInvariant()).ToList();
        var anterior=await db.ResolucionDiferenciaTransferencias.SingleOrDefaultAsync(x=>x.OperacionId==c.OperacionId,cancellationToken);
        if(anterior!=null)
        {
            var anteriores=await db.TransferenciaDetalleSeries.Where(x=>x.ResolucionId==anterior.Id).Select(x=>x.NumeroSerie).ToListAsync(cancellationToken);
            var coincide=anterior.TransferenciaId==t.Id && anterior.TransferenciaDetalleId==c.DetalleId && anterior.CantidadAfectada==c.Cantidad && anterior.Resultado==c.Resultado && anterior.Motivo==c.Motivo.Trim() && anterior.EvidenciaDocumentaria==c.Evidencia.Trim() && anteriores.Order().SequenceEqual(series.Order());
            return coincide?Result<Guid>.Success(anterior.Id):Result<Guid>.Failure("El identificador corresponde a otra resolución.");
        }
        var d=t.Lineas.SingleOrDefault(x=>x.Id==c.DetalleId);
        if(d==null || c.Cantidad>d.CantidadPendiente || t.Estado is not (EstadoTransferencia.EnTransito or EstadoTransferencia.ParcialmenteRecibida))return Result<Guid>.Failure("La cantidad excede el pendiente o el envío está cerrado.");
        var p=await db.Productos.SingleAsync(x=>x.Id==d.ProductoId,cancellationToken);
        if(decimal.Round(c.Cantidad,Math.Clamp(p.DecimalesCantidad,0,5))!=c.Cantidad || (p.EsSerializado && (decimal.Truncate(c.Cantidad)!=c.Cantidad || series.Count!=c.Cantidad || series.Distinct().Count()!=series.Count || series.Any(s=>!d.Series.Any(x=>x.NumeroSerie==s && !x.Recibida && !x.ResolucionId.HasValue)))) || (!p.EsSerializado && series.Count>0))return Result<Guid>.Failure("Revise cantidad y series pendientes.");
        var r=ResolucionDiferenciaTransferencia.Crear(t.Id,d.Id,c.Cantidad,c.Resultado,c.Motivo,user.Id,user.Nombre,c.Evidencia,c.OperacionId);
        var origen=c.Resultado==TipoResolucionDiferencia.RestitucionAOrigen;
        var perdido=c.Resultado==TipoResolucionDiferencia.PerdidaExtravio;
        var condicion=c.Resultado==TipoResolucionDiferencia.DanioAveria?CondicionInventario.Defectuoso:d.Condicion;
        var ubicacion=perdido?null:await InventarioAcceso.UbicacionAsync(db,origen?t.AlmacenOrigenId:t.AlmacenDestinoId,origen?t.UbicacionOrigenId:t.UbicacionDestinoId,cancellationToken);
        if(!perdido && ubicacion==null)return Result<Guid>.Failure("La ubicación de regularización no está activa.");
        try
        {
            await db.EjecutarEnTransaccionAsync(async ct=>
            {
                d.RegistrarResolucion(c.Cantidad);
                if(ubicacion!=null)(await InventarioSaldos.ObtenerAsync(db,ubicacion.Id,d.ProductoId,condicion,ct)).AumentarStock(c.Cantidad);
                if(series.Count==0) db.MovimientosInventario.Add(MovimientoInventario.Registrar(TipoMovimientoInventario.ResolucionTransito,d.ProductoId,c.Cantidad,almacenDestinoId:ubicacion?.AlmacenId,numeroDocumento:t.Numero,usuarioResponsableId:user.Id,observaciones:c.Motivo,ubicacionDestinoId:ubicacion?.Id,transferenciaId:t.Id,eventoId:r.Id,condicion:condicion));
                foreach(var s in series)
                {
                    var sd=d.Series.Single(x=>x.NumeroSerie==s);var item=await db.ItemsSeriados.SingleAsync(x=>x.Id==sd.ItemSeriadoId,ct);
                    if(item.TransferenciaEnTransitoId!=t.Id)throw new InvalidOperationException("La serie no está en este tránsito.");
                    sd.Resolver(r.Id);if(perdido)item.DarDeBaja(c.Motivo);else item.Ubicar(ubicacion!.Id,ubicacion.Almacen.Tipo,condicion);
                    db.MovimientosInventario.Add(MovimientoInventario.Registrar(TipoMovimientoInventario.ResolucionTransito,d.ProductoId,1,almacenDestinoId:ubicacion?.AlmacenId,itemSeriadoId:item.Id,numeroDocumento:t.Numero,usuarioResponsableId:user.Id,observaciones:c.Motivo,ubicacionDestinoId:ubicacion?.Id,transferenciaId:t.Id,eventoId:r.Id,condicion:condicion));
                }
                db.ResolucionDiferenciaTransferencias.Add(r);t.ActualizarEstadoPorRecepciones();await db.SaveChangesAsync(ct);
            },cancellationToken);
            return Result<Guid>.Success(r.Id);
        }
        catch(DbUpdateException){return Result<Guid>.Failure("La diferencia cambió o ya se resolvió. Actualice antes de continuar.");}
        catch(InvalidOperationException ex){return Result<Guid>.Failure(ex.Message);}
    }
}
