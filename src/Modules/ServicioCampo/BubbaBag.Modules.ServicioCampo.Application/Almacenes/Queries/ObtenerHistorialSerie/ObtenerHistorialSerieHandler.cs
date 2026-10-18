using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerHistorialSerie;

public record MovimientoHistorialItemDto(
    Guid Id,
    DateTime Fecha,
    string Tipo,
    int TipoCodigo,
    string? Origen,
    string? Destino,
    string? Documento,
    string? Responsable,
    string Condicion,
    string? Observaciones
);

public record HistorialSerieDto(
    Guid Id,
    string NumeroSerie,
    string? NumeroSmartCard,
    string? MacAddress,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    string? CategoriaNombre,
    string Estado,
    string Condicion,
    string UbicacionActual,
    Guid? AlmacenActualId,
    string? AlmacenActualNombre,
    Guid? UbicacionActualId,
    string? UbicacionActualNombre,
    string? ClienteActualNombre,
    DateTime FechaIngreso,
    int DiasEnEmpresa,
    DateTime? FechaUltimoMovimiento,
    List<MovimientoHistorialItemDto> Movimientos
);

public record ObtenerHistorialSerieQuery(string NumeroSerie) : IQuery<Result<HistorialSerieDto>>;

public class ObtenerHistorialSerieHandler(IServicioCampoDbContext context)
    : IQueryHandler<ObtenerHistorialSerieQuery, Result<HistorialSerieDto>>
{
    public async Task<Result<HistorialSerieDto>> HandleAsync(
        ObtenerHistorialSerieQuery query,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query.NumeroSerie))
            return Result<HistorialSerieDto>.Failure("Debe ingresar un número de serie válido.");

        var numeroNormalizado = query.NumeroSerie.Trim().ToUpperInvariant();

        var item = await context.ItemsSeriados
            .AsNoTracking()
            .Include(x => x.Producto).ThenInclude(p => p.CategoriaProducto)
            .Include(x => x.UbicacionActual).ThenInclude(u => u!.Almacen)
            .FirstOrDefaultAsync(x => x.NumeroSerie == numeroNormalizado, cancellationToken);

        if (item == null)
            return Result<HistorialSerieDto>.Failure($"No se encontró la serie '{numeroNormalizado}' en el sistema.");

        // Consultar movimientos de Kardex para este ItemSeriadoId
        var movimientosRaw = await context.MovimientosInventario
            .AsNoTracking()
            .Include(m => m.AlmacenOrigen)
            .Include(m => m.AlmacenDestino)
            .Where(m => m.ItemSeriadoId == item.Id)
            .OrderBy(m => m.FechaMovimiento)
            .ThenBy(m => m.FechaRegistro)
            .ToListAsync(cancellationToken);

        // Clientes y OTs involucrados
        var clienteIds = movimientosRaw.Where(m => m.ClienteId.HasValue).Select(m => m.ClienteId!.Value).Distinct().ToList();
        if (item.ClienteActualId.HasValue && !clienteIds.Contains(item.ClienteActualId.Value))
            clienteIds.Add(item.ClienteActualId.Value);

        var otIds = movimientosRaw.Where(m => m.OrdenTrabajoId.HasValue).Select(m => m.OrdenTrabajoId!.Value).Distinct().ToList();
        if (item.OrdenTrabajoInstalacionId.HasValue && !otIds.Contains(item.OrdenTrabajoInstalacionId.Value))
            otIds.Add(item.OrdenTrabajoInstalacionId.Value);

        var dictClientes = clienteIds.Count > 0
            ? await context.Clientes.AsNoTracking()
                .Where(c => clienteIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => !string.IsNullOrWhiteSpace(c.RazonSocial) ? c.RazonSocial : $"{c.Nombres} {c.Apellidos}".Trim(), cancellationToken)
            : new Dictionary<Guid, string>();

        var dictOTs = otIds.Count > 0
            ? await context.OrdenesTrabajo.AsNoTracking()
                .Where(o => otIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id, o => o.CodigoWo, cancellationToken)
            : new Dictionary<Guid, string>();

        // Transferencias registradas con la serie
        var transferenciasRelacionadas = await context.Transferencias
            .AsNoTracking()
            .Include(t => t.AlmacenOrigen)
            .Include(t => t.AlmacenDestino)
            .Where(t => t.Lineas.Any(l => l.Series.Any(s => s.NumeroSerie == numeroNormalizado)))
            .ToListAsync(cancellationToken);

        var movimientosDto = new List<MovimientoHistorialItemDto>();

        foreach (var m in movimientosRaw)
        {
            var tipoDesc = ObtenerDescripcionTipoMovimiento(m.Tipo);
            string? clienteNombre = m.ClienteId.HasValue && dictClientes.TryGetValue(m.ClienteId.Value, out var cNom) ? cNom : null;
            string? otNumero = m.OrdenTrabajoId.HasValue && dictOTs.TryGetValue(m.OrdenTrabajoId.Value, out var otNum) ? otNum : null;

            string? origen = m.AlmacenOrigen?.Nombre ?? (m.Tipo == TipoMovimientoInventario.IngresoProveedor ? "Proveedor / DIRECTV" : null);
            string? destino = m.AlmacenDestino?.Nombre 
                ?? (m.Tipo == TipoMovimientoInventario.ConsumoEnOrdenTrabajo ? (clienteNombre ?? "Cliente Domicilio")
                : m.Tipo == TipoMovimientoInventario.DevolucionAProveedor ? "Proveedor / DIRECTV"
                : null);

            var documentoRef = m.NumeroDocumento;
            if (string.IsNullOrWhiteSpace(documentoRef) && !string.IsNullOrWhiteSpace(otNumero))
                documentoRef = $"OT-{otNumero}";

            movimientosDto.Add(new MovimientoHistorialItemDto(
                m.Id,
                m.FechaMovimiento,
                tipoDesc,
                (int)m.Tipo,
                origen,
                destino,
                documentoRef,
                m.UsuarioResponsableId.HasValue ? m.UsuarioResponsableId.Value.ToString()[..8] : null,
                m.Condicion.ToString(),
                m.Observaciones
            ));
        }

        // Si alguna transferencia no está en movimientosRaw por número de documento
        foreach (var trf in transferenciasRelacionadas)
        {
            if (!movimientosDto.Any(x => x.Documento == trf.Numero))
            {
                movimientosDto.Add(new MovimientoHistorialItemDto(
                    trf.Id,
                    trf.FechaRegistro,
                    "Transferencia de Inventario",
                    (int)TipoMovimientoInventario.TransferenciaAlmacenes,
                    trf.AlmacenOrigen?.Nombre ?? "Almacén Origen",
                    trf.AlmacenDestino?.Nombre ?? "Almacén Destino",
                    trf.Numero,
                    trf.DespachadoPorNombre ?? trf.CreadoPorNombre,
                    item.Condicion.ToString(),
                    trf.Observaciones
                ));
            }
        }

        movimientosDto = movimientosDto.OrderBy(x => x.Fecha).ToList();

        // Determinar ubicación actual
        string? almacenActualNombre = item.UbicacionActual?.Almacen?.Nombre;
        string? ubicacionActualNombre = item.UbicacionActual?.Nombre;
        string? clienteActualNombre = item.ClienteActualId.HasValue && dictClientes.TryGetValue(item.ClienteActualId.Value, out var cAct) ? cAct : null;

        string ubicacionActualDesc = item.Estado switch
        {
            EstadoItemSeriado.EnAlmacen => $"{almacenActualNombre ?? "Bodega"}{(string.IsNullOrWhiteSpace(ubicacionActualNombre) ? "" : $" ({ubicacionActualNombre})")}",
            EstadoItemSeriado.EnCustodiaTecnico => $"Custodia Técnico: {almacenActualNombre ?? "Almacén Móvil"}",
            EstadoItemSeriado.InstaladoEnCliente => $"Instalado en Cliente: {clienteActualNombre ?? "Abonado"}",
            EstadoItemSeriado.DevueltoAProveedor => "Devuelto a Proveedor (DIRECTV / Logística Inversa)",
            EstadoItemSeriado.AveriadoEnAlmacen => $"Averiado en {almacenActualNombre ?? "Bodega"}{(string.IsNullOrWhiteSpace(ubicacionActualNombre) ? "" : $" ({ubicacionActualNombre})")}",
            EstadoItemSeriado.EnTransito => "En Tránsito entre sedes",
            EstadoItemSeriado.BajaPorPerdida => "Dado de baja por pérdida / robo / merma",
            EstadoItemSeriado.RetiradoPorAveria => $"Retirado por avería - Custodia: {almacenActualNombre ?? "Técnico"}",
            _ => item.Estado.ToString()
        };

        var fechaIngreso = movimientosDto.FirstOrDefault()?.Fecha ?? item.CreatedAt;
        var diasEnEmpresa = Math.Max(0, (int)(DateTime.UtcNow - fechaIngreso).TotalDays);
        var fechaUltimoMovimiento = movimientosDto.LastOrDefault()?.Fecha ?? item.UpdatedAt;

        var dto = new HistorialSerieDto(
            item.Id,
            item.NumeroSerie,
            item.NumeroSmartCard,
            item.MacAddress,
            item.ProductoId,
            item.Producto?.Codigo ?? string.Empty,
            item.Producto?.Nombre ?? string.Empty,
            item.Producto?.CategoriaProducto?.Nombre,
            item.Estado.ToString(),
            item.Condicion.ToString(),
            ubicacionActualDesc,
            item.UbicacionActual?.AlmacenId,
            almacenActualNombre,
            item.UbicacionActualId,
            ubicacionActualNombre,
            clienteActualNombre,
            fechaIngreso,
            diasEnEmpresa,
            fechaUltimoMovimiento,
            movimientosDto
        );

        return Result<HistorialSerieDto>.Success(dto);
    }

    private static string ObtenerDescripcionTipoMovimiento(TipoMovimientoInventario tipo) => tipo switch
    {
        TipoMovimientoInventario.IngresoProveedor => "Ingreso por Recepción de Compra / Proveedor",
        TipoMovimientoInventario.TransferenciaAlmacenes => "Transferencia entre Almacenes",
        TipoMovimientoInventario.DespachoATecnico => "Despacho a Técnico (Custodia Personal)",
        TipoMovimientoInventario.DevolucionTecnico => "Devolución de Técnico a Bodega",
        TipoMovimientoInventario.ConsumoEnOrdenTrabajo => "Instalación en Domicilio de Cliente (OT)",
        TipoMovimientoInventario.RetiroEnOrdenTrabajo => "Retiro de Equipo Averiado en Domicilio (OT)",
        TipoMovimientoInventario.AjusteInventario => "Ajuste de Inventario (Kardex)",
        TipoMovimientoInventario.DevolucionAProveedor => "Devolución a Proveedor (Logística Inversa)",
        TipoMovimientoInventario.SalidaATransito => "Salida a Tránsito interprovincial",
        TipoMovimientoInventario.RecepcionDeTransito => "Recepción de Tránsito interprovincial",
        TipoMovimientoInventario.ResolucionTransito => "Resolución de Diferencia en Tránsito",
        _ => tipo.ToString()
    };
}
