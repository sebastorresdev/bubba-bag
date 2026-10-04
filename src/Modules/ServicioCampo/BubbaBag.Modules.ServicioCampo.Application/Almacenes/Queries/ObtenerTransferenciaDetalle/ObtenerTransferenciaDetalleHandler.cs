using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerTransferenciaDetalle;

public record TransferenciaDetalleLineaDto(
    Guid Id,
    Guid ProductoId,
    string CodigoProducto,
    string ProductoNombre,
    decimal CantidadEnviada,
    decimal CantidadRecibida,
    decimal CantidadResuelta,
    decimal CantidadPendiente, string Condicion, IReadOnlyCollection<SerieTransferenciaDto> Series, string? UnidadMedidaNombre
);

public record SerieTransferenciaDto(string NumeroSerie, bool Recibida, bool Resuelta);

public record RecepcionTransferenciaDto(
    Guid Id,
    string NumeroRecepcion,
    DateTime FechaRecepcion,
    Guid RecibidoPorId,
    string RecibidoPorNombre,
    string? Observaciones, DateTime FechaReal, IReadOnlyCollection<CapturaRecepcionDto> Lineas
);

public record CapturaRecepcionDto(string CodigoProducto, decimal Cantidad, IReadOnlyCollection<string> Series);
public record ResolucionTransferenciaDto(Guid Id, Guid DetalleId, decimal Cantidad, string Resultado, string Motivo, string? Evidencia, string Supervisor, DateTime Fecha, IReadOnlyCollection<string> Series);

public record TransferenciaDetalladaDto(
    Guid Id,
    string Numero,
    Guid AlmacenOrigenId,
    string AlmacenOrigenNombre,
    Guid AlmacenDestinoId,
    string AlmacenDestinoNombre,
    Guid UnidadOrganizativaOrigenId,
    Guid UnidadOrganizativaDestinoId,
    string Modalidad,
    string Estado,
    DateTime FechaRegistro,
    DateTime? FechaDespacho,
    DateTime? FechaCierre,
    string? DespachadoPorNombre,
    string? NumeroGuiaRemision,
    string? Observaciones,
    IReadOnlyCollection<TransferenciaDetalleLineaDto> Lineas,
    IReadOnlyCollection<RecepcionTransferenciaDto> Recepciones, Guid? UbicacionOrigenId, Guid? UbicacionDestinoId, bool PuedeRecepcionar, bool PuedeResolver, string? UbicacionOrigenNombre, string? UbicacionDestinoNombre, DateTime FechaReal, IReadOnlyCollection<ResolucionTransferenciaDto> Resoluciones
);

public record ObtenerTransferenciaDetalleQuery(Guid Id) : IQuery<Result<TransferenciaDetalladaDto>>;

public class ObtenerTransferenciaDetalleHandler
    : IQueryHandler<ObtenerTransferenciaDetalleQuery, Result<TransferenciaDetalladaDto>>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _user;

    public ObtenerTransferenciaDetalleHandler(IServicioCampoDbContext context, ICurrentUser user) { _context = context; _user = user; }

    public async Task<Result<TransferenciaDetalladaDto>> HandleAsync(
        ObtenerTransferenciaDetalleQuery query,
        CancellationToken cancellationToken = default)
    {
        var t = await _context.Transferencias
            .AsNoTracking()
            .Include(x => x.AlmacenOrigen)
            .Include(x => x.AlmacenDestino)
            .Include(x => x.Lineas).ThenInclude(x=>x.Series)
            .Include(x => x.Recepciones).ThenInclude(x=>x.Lineas)
            .FirstOrDefaultAsync(x => x.Id == query.Id && (InventarioAcceso.AlmacenesConsultables(_context,_user).Contains(x.AlmacenOrigenId) || InventarioAcceso.AlmacenesConsultables(_context,_user).Contains(x.AlmacenDestinoId)), cancellationToken);

        if (t == null)
            return Result<TransferenciaDetalladaDto>.Failure("Transferencia no encontrada.");

        var productosIds = t.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productosMap = await _context.Productos
            .AsNoTracking()
            .Where(p => productosIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var lineasDto = t.Lineas.Select(l => new TransferenciaDetalleLineaDto(
            l.Id,
            l.ProductoId,
            productosMap.TryGetValue(l.ProductoId, out var prod) ? prod.Codigo : "—",
            productosMap.TryGetValue(l.ProductoId, out prod) ? prod.Nombre : "Producto",
            l.CantidadEnviada,
            l.CantidadRecibida,
            l.CantidadResuelta,
            l.CantidadPendiente, l.Condicion.ToString(), l.Series.Select(s=>new SerieTransferenciaDto(s.NumeroSerie,s.Recibida,s.ResolucionId.HasValue)).ToList(), l.UnidadMedidaNombre
        )).ToList();

        var recepcionesDto = t.Recepciones.OrderByDescending(r => r.FechaRecepcion).Select(r => new RecepcionTransferenciaDto(
            r.Id,
            r.NumeroRecepcion,
            r.FechaRecepcion,
            r.RecibidoPorId,
            r.RecibidoPorNombre,
            r.Observaciones, r.FechaReal, r.Lineas.Select(l=>new CapturaRecepcionDto(productosMap.TryGetValue(l.ProductoId,out var p)?p.Codigo:"—",l.CantidadAceptada,t.Lineas.SelectMany(x=>x.Series).Where(s=>s.RecepcionDetalleId==l.Id).Select(s=>s.NumeroSerie).ToList())).ToList()
        )).ToList();

        var resoluciones=await _context.ResolucionDiferenciaTransferencias.AsNoTracking().Where(x=>x.TransferenciaId==t.Id).OrderBy(x=>x.FechaResolucion).ToListAsync(cancellationToken);
        var resolucionesDto=resoluciones.Select(r=>new ResolucionTransferenciaDto(r.Id,r.TransferenciaDetalleId,r.CantidadAfectada,r.Resultado.ToString(),r.Motivo,r.EvidenciaDocumentaria,r.SupervisorNombre,r.FechaResolucion,t.Lineas.SelectMany(x=>x.Series).Where(s=>s.ResolucionId==r.Id).Select(s=>s.NumeroSerie).ToList())).ToList();
        var dto = new TransferenciaDetalladaDto(
            t.Id,
            t.Numero,
            t.AlmacenOrigenId,
            t.AlmacenOrigen?.Nombre ?? "Origen",
            t.AlmacenDestinoId,
            t.AlmacenDestino?.Nombre ?? "Destino",
            t.UnidadOrganizativaOrigenId,
            t.UnidadOrganizativaDestinoId,
            t.Modalidad.ToString(),
            t.Estado.ToString(),
            t.FechaRegistro,
            t.FechaDespacho,
            t.FechaCierre,
            t.DespachadoPorNombre,
            t.NumeroGuiaRemision,
            t.Observaciones,
            lineasDto,
            recepcionesDto, t.UbicacionOrigenId,t.UbicacionDestinoId,
            await InventarioAcceso.PuedeAsync(_context,_user,t.AlmacenDestinoId,"recibir",cancellationToken),
            await InventarioAcceso.PuedeAsync(_context,_user,t.AlmacenDestinoId,"supervisar",cancellationToken),
            await _context.UbicacionesInventario.Where(x=>x.Id==t.UbicacionOrigenId).Select(x=>x.Nombre).FirstOrDefaultAsync(cancellationToken),
            await _context.UbicacionesInventario.Where(x=>x.Id==t.UbicacionDestinoId).Select(x=>x.Nombre).FirstOrDefaultAsync(cancellationToken), t.FechaReal, resolucionesDto
        );

        return Result<TransferenciaDetalladaDto>.Success(dto);
    }
}
