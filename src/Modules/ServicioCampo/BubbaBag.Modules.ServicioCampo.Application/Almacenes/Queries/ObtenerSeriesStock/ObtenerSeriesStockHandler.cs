using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerSeriesStock;

public record ItemSeriadoStockDto(
    Guid Id,
    Guid ProductoId,
    string CodigoProducto,
    string NombreProducto,
    Guid? AlmacenId,
    string? NombreAlmacen,
    string NumeroSerie,
    string? NumeroSmartCard,
    string? MacAddress,
    string Estado,
    DateTime CreatedAt,
    Guid? UbicacionId,
    string? NombreUbicacion,
    string Condicion,
    Guid? TransferenciaEnTransitoId,
    string? TransferenciaNumero,
    DateTime? FechaLlegadaAlmacen = null,
    int? DiasEnAlmacen = null,
    string? EstadoSla = null
);

public record ObtenerSeriesStockQuery(
    Guid? AlmacenId = null,
    Guid? ProductoId = null,
    string? Buscar = null, Guid? UbicacionId = null, bool IncluirTransito = false
) : IQuery<Result<List<ItemSeriadoStockDto>>>;

public class ObtenerSeriesStockHandler(IServicioCampoDbContext context, ICurrentUser user)
    : IQueryHandler<ObtenerSeriesStockQuery, Result<List<ItemSeriadoStockDto>>>
{
    public async Task<Result<List<ItemSeriadoStockDto>>> HandleAsync(
        ObtenerSeriesStockQuery query,
        CancellationToken cancellationToken = default)
    {
        var items = context.ItemsSeriados
            .AsNoTracking()
            .Include(x => x.Producto)
            .Include(x => x.UbicacionActual).ThenInclude(x=>x!.Almacen)
            .Where(x=>x.UbicacionActual != null && InventarioAcceso.AlmacenesConsultables(context,user).Contains(x.UbicacionActual.AlmacenId) ||
                query.IncluirTransito && x.TransferenciaEnTransitoId.HasValue && context.Transferencias.Any(t=>t.Id==x.TransferenciaEnTransitoId && (InventarioAcceso.AlmacenesConsultables(context,user).Contains(t.AlmacenOrigenId) || InventarioAcceso.AlmacenesConsultables(context,user).Contains(t.AlmacenDestinoId))));

        if (query.AlmacenId.HasValue)
            items = items.Where(x => x.UbicacionActual != null && x.UbicacionActual.AlmacenId == query.AlmacenId.Value || query.IncluirTransito && context.Transferencias.Any(t=>t.Id==x.TransferenciaEnTransitoId && (t.AlmacenOrigenId==query.AlmacenId.Value || t.AlmacenDestinoId==query.AlmacenId.Value)));

        if (query.UbicacionId.HasValue) items = items.Where(x=>x.UbicacionActualId == query.UbicacionId.Value);
        if (query.ProductoId.HasValue)
            items = items.Where(x => x.ProductoId == query.ProductoId.Value);

        if (!string.IsNullOrWhiteSpace(query.Buscar))
        {
            var buscar = query.Buscar.Trim().ToUpperInvariant();
            items = items.Where(x =>
                x.NumeroSerie.Contains(buscar) ||
                (x.NumeroSmartCard != null && x.NumeroSmartCard.Contains(buscar)) ||
                (x.MacAddress != null && x.MacAddress.Contains(buscar)));
        }

        var ahora = DateTime.UtcNow;

        var rawItems = await items
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.ProductoId,
                Codigo = x.Producto.Codigo,
                Nombre = x.Producto.Nombre,
                AlmacenId = x.UbicacionActual != null ? (Guid?)x.UbicacionActual.AlmacenId : null,
                AlmacenNombre = x.UbicacionActual != null ? x.UbicacionActual.Almacen.Nombre : null,
                x.NumeroSerie,
                x.NumeroSmartCard,
                x.MacAddress,
                Estado = x.Estado.ToString(),
                x.CreatedAt,
                x.UpdatedAt,
                x.FechaInstalacion,
                x.UbicacionActualId,
                UbicacionNombre = x.UbicacionActual != null ? x.UbicacionActual.Nombre : null,
                Condicion = x.Condicion.ToString(),
                x.TransferenciaEnTransitoId,
                TransferenciaNumero = context.Transferencias.Where(t => t.Id == x.TransferenciaEnTransitoId).Select(t => t.Numero).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var resultado = rawItems.Select(x =>
        {
            var fechaLlegada = x.UpdatedAt ?? x.CreatedAt;
            int? diasEnAlmacen = null;
            string estadoSla = "EnSla";

            if (x.Estado == "InstaladoEnCliente")
            {
                estadoSla = "Instalado";
                if (x.FechaInstalacion.HasValue)
                {
                    diasEnAlmacen = Math.Max(0, (int)(x.FechaInstalacion.Value - x.CreatedAt).TotalDays);
                }
            }
            else
            {
                diasEnAlmacen = Math.Max(0, (int)(ahora - fechaLlegada).TotalDays);
                if (diasEnAlmacen <= 15)
                    estadoSla = "EnSla";
                else if (diasEnAlmacen <= 30)
                    estadoSla = "EnRiesgo";
                else
                    estadoSla = "Vencido";
            }

            return new ItemSeriadoStockDto(
                x.Id,
                x.ProductoId,
                x.Codigo,
                x.Nombre,
                x.AlmacenId,
                x.AlmacenNombre,
                x.NumeroSerie,
                x.NumeroSmartCard,
                x.MacAddress,
                x.Estado,
                x.CreatedAt,
                x.UbicacionActualId,
                x.UbicacionNombre,
                x.Condicion,
                x.TransferenciaEnTransitoId,
                x.TransferenciaNumero,
                fechaLlegada,
                diasEnAlmacen,
                estadoSla
            );
        }).ToList();

        return Result<List<ItemSeriadoStockDto>>.Success(resultado);
    }
}
