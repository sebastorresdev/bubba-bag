using System.Text.Json;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Compras;

public record LineaCompra(Guid ProductoId, decimal Cantidad, decimal CostoUnitario, IReadOnlyList<string>? Series, Guid? UnidadMedidaId = null, decimal? FactorConversion = null);
public record LineaCompraDetalle(Guid ProductoId, string Producto, string? Unidad, decimal Cantidad, decimal CostoUnitario, IReadOnlyList<string> Series, decimal? CantidadRecibida = null, IReadOnlyList<string>? SeriesRecibidas = null, Guid? UnidadMedidaId = null, decimal? FactorConversion = null, decimal? CantidadBase = null);
public record CompraDto(Guid Id, string Numero, string Proveedor, string TipoDocumento, string NumeroDocumento,
    DateOnly FechaDocumento, string Moneda, Guid? AlmacenId, string Almacen, decimal Total, string? Observacion, IReadOnlyList<LineaCompraDetalle> Lineas, string Estado,
    Guid? UsuarioRecepcionId = null, string? RecibidoPor = null, string? RecibidoPorEmail = null, DateTime? FechaRecepcion = null,
    Guid? UsuarioId = null, string? CreadoPor = null, string? CreadoPorEmail = null, DateTime? FechaRegistro = null);
public record ObtenerComprasQuery(Guid? Id = null) : IQuery<Result<List<CompraDto>>>;
public record CrearCompraCommand(string Proveedor, string TipoDocumento, string NumeroDocumento, DateOnly FechaDocumento,
    string Moneda, Guid? AlmacenId, IReadOnlyList<LineaCompra>? Lineas, string? Observacion) : ICommand<Result<Guid>>;
public record ActualizarCompraCommand(Guid Id, CrearCompraCommand Datos) : ICommand<Result<Guid>>;
public record ProcesarCompraCommand(Guid Id, string Accion) : ICommand<Result<Guid>>;
public record LineaRecepcion(Guid ProductoId, decimal Cantidad, IReadOnlyList<string>? Series, Guid? UbicacionId = null);
public record RecepcionCompraDatos(string TipoDocumento, string NumeroDocumento, DateOnly FechaDocumento, IReadOnlyList<LineaRecepcion>? Lineas = null, Guid? UbicacionId = null);
public record RecepcionarCompraCommand(Guid Id, RecepcionCompraDatos Datos) : ICommand<Result<Guid>>;
public record RevertirABorradorCompraCommand(Guid Id) : ICommand<Result<Guid>>;

public class RevertirABorradorCompraHandler(IServicioCampoDbContext context) : ICommandHandler<RevertirABorradorCompraCommand, Result<Guid>>
{
    public async Task<Result<Guid>> HandleAsync(RevertirABorradorCompraCommand command, CancellationToken cancellationToken = default)
    {
        var compra = await context.Compras.FindAsync([command.Id], cancellationToken);
        if (compra is null) return Result<Guid>.Failure("La compra no existe.");
        if (compra.Estado == "Recibida") return Result<Guid>.Failure("No se puede revertir una compra ya recibida.");
        compra.RevertirABorrador();
        await context.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(compra.Id);
    }
}

public class ObtenerComprasHandler(IServicioCampoDbContext context, ICurrentUser user) : IQueryHandler<ObtenerComprasQuery, Result<List<CompraDto>>>
{
    public async Task<Result<List<CompraDto>>> HandleAsync(ObtenerComprasQuery query, CancellationToken cancellationToken = default)
    {
        var compras = await context.Compras.AsNoTracking().Include(x => x.Almacen)
            .Where(x => (query.Id == null || x.Id == query.Id) && (user.IsInRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin) || x.AlmacenId.HasValue && InventarioAcceso.AlmacenesConsultables(context,user).Contains(x.AlmacenId.Value))).OrderByDescending(x => x.FechaRegistro).ToListAsync(cancellationToken);
        return Result<List<CompraDto>>.Success(compras.Select(x => new CompraDto(x.Id, x.Numero, x.Proveedor, x.TipoDocumento,
            x.NumeroDocumento, x.FechaDocumento, x.Moneda, x.AlmacenId, x.Almacen?.Nombre ?? "", x.Total, x.Observacion,
            JsonSerializer.Deserialize<List<LineaCompraDetalle>>(x.LineasJson) ?? [], x.Estado,
            x.UsuarioRecepcionId, null, null, x.FechaRecepcion,
            x.UsuarioId, null, null, x.FechaRegistro)).ToList());
    }
}

public class CrearCompraHandler(IServicioCampoDbContext context, ICurrentUser user, ICodigoSecuencialService? seqService = null) : ICommandHandler<CrearCompraCommand, Result<Guid>>
{
    public Task<Result<Guid>> HandleAsync(CrearCompraCommand command, CancellationToken cancellationToken = default)
        => GuardarAsync(command, null, cancellationToken);

    public async Task<Result<Guid>> GuardarAsync(CrearCompraCommand command, Guid? id, CancellationToken ct)
    {
        if (command.Proveedor is null || command.NumeroDocumento is null || command.Proveedor.Length > 150 || command.NumeroDocumento.Length > 100 || command.Observacion?.Length > 500 ||
            command.Moneda is not ("PEN" or "USD") || command.TipoDocumento is not ("Factura" or "Boleta" or "Guía de remisión") || command.FechaDocumento == default)
            return Result<Guid>.Failure("Revise los datos de la compra.");
        var compra = id.HasValue ? await context.Compras.FindAsync([id.Value], ct) : null;
        if (compra is not null && compra.Estado is "Recibida") return Result<Guid>.Failure("La compra recibida no se puede editar.");
        var lineas = command.Lineas ?? [];
        if (lineas.Count > 500 || lineas.Any(x => x is null || x.Cantidad <= 0 || x.Cantidad >= 1000000000m || x.CostoUnitario < 0 || x.CostoUnitario > 1000000000m || decimal.Round(x.CostoUnitario, 2) != x.CostoUnitario) || lineas.Select(x => x.ProductoId).Distinct().Count() != lineas.Count)
            return Result<Guid>.Failure("Revise las cantidades, costos y productos repetidos.");
        if (command.AlmacenId.HasValue)
        {
            var alm = await context.Almacenes.FirstOrDefaultAsync(x => x.Id == command.AlmacenId && x.Activo, ct);
            if (alm is null) return Result<Guid>.Failure("El almacén no está disponible.");
            if (alm.Tipo == TipoAlmacen.CustodiaPersonal)
                return Result<Guid>.Failure("El almacén de recepción para compras debe ser una bodega física, no de custodia personal.");
        }
        var ids = lineas.Select(x => x.ProductoId).ToList();
        var productos = await context.Productos.Include(x => x.UnidadMedidaDefecto).Where(x => ids.Contains(x.Id) && x.Activo && x.Tipo == TipoProducto.Inventario).ToDictionaryAsync(x => x.Id, ct);
        if (productos.Count != ids.Count) return Result<Guid>.Failure("Los productos deben estar activos y ser inventariables.");

        var uIds = lineas.Where(x => x.UnidadMedidaId.HasValue).Select(x => x.UnidadMedidaId!.Value).Distinct().ToList();
        var unidadesMap = uIds.Count > 0
            ? await context.UnidadesMedida.Where(u => uIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, ct)
            : new Dictionary<Guid, UnidadMedida>();

        var detalles = lineas.Select(x => {
            UnidadMedida? uElegida = null;
            if (x.UnidadMedidaId.HasValue)
            {
                unidadesMap.TryGetValue(x.UnidadMedidaId.Value, out uElegida);
            }
            var nombreUnidad = uElegida?.Nombre ?? productos[x.ProductoId].UnidadMedidaDefecto?.Nombre;
            var factor = uElegida?.FactorConversionTotal ?? (x.FactorConversion is > 0 ? x.FactorConversion.Value : 1m);
            var cantBase = x.Cantidad * factor;
            return new LineaCompraDetalle(
                x.ProductoId,
                productos[x.ProductoId].Nombre,
                nombreUnidad,
                x.Cantidad,
                x.CostoUnitario,
                (x.Series ?? []).Select(s => (s ?? "").Trim().ToUpperInvariant()).ToList(),
                UnidadMedidaId: uElegida?.Id,
                FactorConversion: factor,
                CantidadBase: cantBase
            );
        }).ToList();
        if (detalles.Any(x => decimal.Round(x.Cantidad, Math.Clamp(productos[x.ProductoId].DecimalesCantidad, 0, 5)) != x.Cantidad ||
            (productos[x.ProductoId].EsSerializado && decimal.Truncate(x.Cantidad) != x.Cantidad) || x.Series.Any(s => s.Length > 100))) return Result<Guid>.Failure("Revise las cantidades y series.");
        var total = detalles.Sum(x => decimal.Round(x.Cantidad * x.CostoUnitario, 2, MidpointRounding.AwayFromZero));
        if (total >= 10000000000000000m) return Result<Guid>.Failure("El importe excede el límite permitido.");
        if (compra is null)
        {
            string numeroCompra;
            if (seqService != null)
            {
                do
                {
                    numeroCompra = await seqService.SiguienteCodigoAsync(
                        prefijo: "CMP",
                        nombreSecuencia: "seq_compras",
                        esquema: "inventario",
                        longitud: 6,
                        cancellationToken: ct);
                } while (await context.Compras.AnyAsync(x => x.Numero == numeroCompra, ct));
            }
            else
            {
                var count = await context.Compras.CountAsync(ct);
                numeroCompra = $"CMP-{(count + 1):D6}";
                var i = 1;
                while (await context.Compras.AnyAsync(x => x.Numero == numeroCompra, ct))
                {
                    numeroCompra = $"CMP-{(count + 1 + i):D6}";
                    i++;
                }
            }

            compra = Compra.Registrar(Guid.NewGuid(), numeroCompra, command.Proveedor, command.TipoDocumento, command.NumeroDocumento, command.FechaDocumento, command.Moneda, command.AlmacenId, command.Observacion, JsonSerializer.Serialize(detalles), total, user.Id);
            await context.Compras.AddAsync(compra, ct);
        }
        else compra.Actualizar(command.Proveedor, command.TipoDocumento, command.NumeroDocumento, command.FechaDocumento, command.Moneda, command.AlmacenId, command.Observacion, JsonSerializer.Serialize(detalles), total);
        try { await context.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) { return Result<Guid>.Failure($"No se pudo guardar: {ex.InnerException?.Message ?? ex.Message}"); }
        return Result<Guid>.Success(compra.Id);
    }

    public async Task<Result<Guid>> ProcesarAsync(Guid id, bool recepcionar, CancellationToken cancellationToken, bool enviar = false, RecepcionCompraDatos? recepcion = null)
    {
        var compra = await context.Compras.FindAsync([id], cancellationToken);
        if (compra is null) return Result<Guid>.Failure("La compra no existe.");
        if (recepcionar && compra.Estado != "Solicitada" && compra.Estado != "Enviada" && compra.Estado != "Recibida con faltantes") return Result<Guid>.Failure("El estado de la compra no permite recepcionar.");
        if (enviar && compra.Estado != "Solicitada") return Result<Guid>.Failure("El estado de la compra no permite registrar envío.");
        if (!recepcionar && !enviar && compra.Estado != "Borrador") return Result<Guid>.Failure("El estado de la compra no permite esta operación.");
        if (recepcionar && (!compra.AlmacenId.HasValue || !await InventarioAcceso.PuedeAsync(context,user,compra.AlmacenId.Value,"recibir",cancellationToken))) return Result<Guid>.Failure("No puede recepcionar en este almacén.");
        var guardadas = JsonSerializer.Deserialize<List<LineaCompraDetalle>>(compra.LineasJson) ?? [];
        var command = new CrearCompraCommand(compra.Proveedor, compra.TipoDocumento, compra.NumeroDocumento, compra.FechaDocumento, compra.Moneda, compra.AlmacenId,
            guardadas.Select(x => new LineaCompra(x.ProductoId, x.Cantidad, x.CostoUnitario, x.Series, x.UnidadMedidaId, x.FactorConversion)).ToList(), compra.Observacion);
        if (recepcionar && recepcion is not null)
        {
            if (recepcion.NumeroDocumento is null) return Result<Guid>.Failure("Ingrese el número de comprobante.");
            if (!string.IsNullOrWhiteSpace(compra.NumeroDocumento) &&
                (recepcion.TipoDocumento != compra.TipoDocumento || recepcion.NumeroDocumento.Trim().ToUpperInvariant() != compra.NumeroDocumento || recepcion.FechaDocumento != compra.FechaDocumento))
                return Result<Guid>.Failure("El comprobante registrado no se puede cambiar durante la recepción.");
            command = command with { TipoDocumento = recepcion.TipoDocumento, NumeroDocumento = recepcion.NumeroDocumento, FechaDocumento = recepcion.FechaDocumento };
        }
        if (string.IsNullOrWhiteSpace(command.Proveedor) || command.Proveedor.Length > 150 ||
            (recepcionar && string.IsNullOrWhiteSpace(command.NumeroDocumento)) || command.NumeroDocumento.Length > 100 ||
            command.Observacion?.Length > 500)
            return Result<Guid>.Failure("Complete el proveedor y el número de comprobante en General. Revise los límites de longitud de esos campos y de la observación.");
        if (command.TipoDocumento is not ("Factura" or "Boleta" or "Guía de remisión") || command.Moneda is not ("PEN" or "USD") || command.FechaDocumento == default)
            return Result<Guid>.Failure("El tipo de comprobante, la moneda o la fecha no son válidos.");
        if (command.Lineas is null || command.Lineas.Count == 0 || command.Lineas.Count > 500 ||
            command.Lineas.Any(x => x is null || x.Cantidad <= 0 || x.Cantidad >= 1000000000m || x.CostoUnitario < 0 || x.CostoUnitario > 1000000000m || decimal.Round(x.CostoUnitario, 2) != x.CostoUnitario) ||
            command.Lineas.Select(x => x.ProductoId).Distinct().Count() != command.Lineas.Count)
            return Result<Guid>.Failure("Agregue productos sin repetir, cantidades positivas y costos válidos con hasta dos decimales.");
        if (!await context.Almacenes.AnyAsync(x => x.Id == command.AlmacenId && x.Activo, cancellationToken))
            return Result<Guid>.Failure("Seleccione un almacén activo.");
        var proveedor = command.Proveedor.Trim().ToUpperInvariant();
        var documento = command.NumeroDocumento.Trim().ToUpperInvariant();
        if (documento.Length > 0 && await context.Compras.AnyAsync(x => x.Id != id && x.Proveedor == proveedor && x.TipoDocumento == command.TipoDocumento && x.NumeroDocumento == documento, cancellationToken))
            return Result<Guid>.Failure("Este comprobante ya está registrado para el proveedor.");
        var ids = command.Lineas.Select(x => x.ProductoId).ToList();
        var productos = await context.Productos.Include(x => x.UnidadMedidaDefecto).Where(x => ids.Contains(x.Id) && x.Activo && x.Tipo == TipoProducto.Inventario).ToDictionaryAsync(x => x.Id, cancellationToken);
        if (productos.Count != ids.Count) return Result<Guid>.Failure("Todos los productos deben estar activos y ser inventariables.");

        var uIds = command.Lineas.Where(x => x.UnidadMedidaId.HasValue).Select(x => x.UnidadMedidaId!.Value).Distinct().ToList();
        var unidadesMap = uIds.Count > 0
            ? await context.UnidadesMedida.Where(u => uIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, cancellationToken)
            : new Dictionary<Guid, UnidadMedida>();

        var detalles = new List<LineaCompraDetalle>();
        foreach (var linea in command.Lineas)
        {
            var producto = productos[linea.ProductoId];
            var series = (linea.Series ?? []).Select(x => (x ?? "").Trim().ToUpperInvariant()).ToList();
            if (decimal.Round(linea.Cantidad, Math.Clamp(producto.DecimalesCantidad, 0, 5)) != linea.Cantidad)
                return Result<Guid>.Failure($"Revise los decimales de cantidad de {producto.Nombre}.");
            if (producto.EsSerializado ? ((recepcionar || enviar) ? linea.Cantidad != series.Count : series.Count > linea.Cantidad) || series.Any(x => x.Length == 0 || x.Length > 100) : series.Count != 0)
                return Result<Guid>.Failure($"{producto.Nombre}: registre una serie válida por cada unidad, únicamente para productos serializados.");

            UnidadMedida? uElegida = null;
            if (linea.UnidadMedidaId.HasValue)
            {
                unidadesMap.TryGetValue(linea.UnidadMedidaId.Value, out uElegida);
            }
            var nombreUnidad = uElegida?.Nombre ?? producto.UnidadMedidaDefecto?.Nombre;
            var factor = uElegida?.FactorConversionTotal ?? (linea.FactorConversion is > 0 ? linea.FactorConversion.Value : 1m);
            var cantBase = linea.Cantidad * factor;

            detalles.Add(new LineaCompraDetalle(linea.ProductoId, producto.Nombre, nombreUnidad, linea.Cantidad, linea.CostoUnitario, series, UnidadMedidaId: uElegida?.Id, FactorConversion: factor, CantidadBase: cantBase));
        }
        bool conFaltantes = false;
        var lineasFinales = detalles;
        var lineasActualizadas = new List<LineaCompraDetalle>();
        if (recepcionar && recepcion?.Lineas != null && recepcion.Lineas.Count > 0)
        {
            var mapaRecepcion = recepcion.Lineas.ToDictionary(x => x.ProductoId, x => x);
            lineasFinales = new List<LineaCompraDetalle>();
            foreach (var orig in detalles)
            {
                if (mapaRecepcion.TryGetValue(orig.ProductoId, out var rec))
                {
                    var seriesRec = (rec.Series ?? []).Select(s => (s ?? "").Trim().ToUpperInvariant())
                        .Where(s => !string.IsNullOrEmpty(s) && orig.Series.Contains(s)).Distinct().ToList();
                    var cantRec = orig.Series.Count > 0 ? seriesRec.Count : Math.Clamp(rec.Cantidad, 0, orig.Cantidad);
                    if (cantRec < orig.Cantidad || (orig.Series.Count > 0 && seriesRec.Count < orig.Series.Count))
                    {
                        conFaltantes = true;
                    }
                    if (cantRec > 0)
                    {
                        var factor = orig.FactorConversion ?? 1m;
                        lineasFinales.Add(new LineaCompraDetalle(orig.ProductoId, orig.Producto, orig.Unidad, cantRec, orig.CostoUnitario, seriesRec, UnidadMedidaId: orig.UnidadMedidaId, FactorConversion: factor, CantidadBase: cantRec * factor));
                    }
                    lineasActualizadas.Add(new LineaCompraDetalle(orig.ProductoId, orig.Producto, orig.Unidad, orig.Cantidad, orig.CostoUnitario, orig.Series, cantRec, seriesRec, UnidadMedidaId: orig.UnidadMedidaId, FactorConversion: orig.FactorConversion, CantidadBase: orig.CantidadBase));
                }
                else
                {
                    conFaltantes = true;
                    lineasActualizadas.Add(new LineaCompraDetalle(orig.ProductoId, orig.Producto, orig.Unidad, orig.Cantidad, orig.CostoUnitario, orig.Series, 0, [], UnidadMedidaId: orig.UnidadMedidaId, FactorConversion: orig.FactorConversion, CantidadBase: orig.CantidadBase));
                }
            }
            if (lineasFinales.Count == 0)
                return Result<Guid>.Failure("Debe recepcionar al menos un producto o serie válida.");
        }
        else if (recepcionar)
        {
            foreach (var orig in detalles)
            {
                lineasActualizadas.Add(new LineaCompraDetalle(orig.ProductoId, orig.Producto, orig.Unidad, orig.Cantidad, orig.CostoUnitario, orig.Series, orig.Cantidad, orig.Series, UnidadMedidaId: orig.UnidadMedidaId, FactorConversion: orig.FactorConversion, CantidadBase: orig.CantidadBase));
            }
        }
        var mapaPrevias = guardadas.ToDictionary(g => g.ProductoId, g => g);
        var seriesNuevasTotal = lineasFinales.SelectMany(x =>
        {
            var prevSeries = mapaPrevias.TryGetValue(x.ProductoId, out var prev) && prev.SeriesRecibidas != null ? prev.SeriesRecibidas : [];
            return x.Series.Except(prevSeries);
        }).ToList();
        if (seriesNuevasTotal.Distinct().Count() != seriesNuevasTotal.Count || await context.ItemsSeriados.AnyAsync(x => seriesNuevasTotal.Contains(x.NumeroSerie), cancellationToken))
            return Result<Guid>.Failure("Hay series repetidas o que ya están registradas.");
        var total = detalles.Sum(x => decimal.Round(x.Cantidad * x.CostoUnitario, 2, MidpointRounding.AwayFromZero));
        if (total >= 10000000000000000m) return Result<Guid>.Failure("El importe de la compra excede el límite permitido.");
        if (!recepcionar)
        {
            if (enviar) compra.Enviar(); else compra.Solicitar();
            try { await context.SaveChangesAsync(cancellationToken); }
            catch (DbUpdateException) { return Result<Guid>.Failure("La compra cambió. Actualice antes de procesarla."); }
            return Result<Guid>.Success(compra.Id);
        }
        try
        {
            await context.EjecutarEnTransaccionAsync(async ct =>
            {
                var mapaLineasRecepcion = recepcion?.Lineas?.ToDictionary(x => x.ProductoId, x => x) ?? [];
                var ubicacionPredeterminada = await InventarioAcceso.UbicacionAsync(context, command.AlmacenId!.Value, recepcion?.UbicacionId, ct)
                    ?? await InventarioAcceso.UbicacionAsync(context, command.AlmacenId!.Value, null, ct)
                    ?? throw new InvalidOperationException("Falta la ubicación de recepción en el almacén.");

                var ubicacionesCache = new Dictionary<Guid, UbicacionInventario> { [ubicacionPredeterminada.Id] = ubicacionPredeterminada };

                compra.CompletarComprobanteRecepcion(command.TipoDocumento, command.NumeroDocumento, command.FechaDocumento);
                compra.Recepcionar(user.Id, conFaltantes, JsonSerializer.Serialize(lineasActualizadas));

                foreach (var linea in lineasFinales)
                {
                    Guid idUbicacionFinal = ubicacionPredeterminada.Id;
                    if (mapaLineasRecepcion.TryGetValue(linea.ProductoId, out var linRec) && linRec.UbicacionId.HasValue)
                    {
                        if (!ubicacionesCache.TryGetValue(linRec.UbicacionId.Value, out var ubEspecifica))
                        {
                            ubEspecifica = await InventarioAcceso.UbicacionAsync(context, command.AlmacenId!.Value, linRec.UbicacionId.Value, ct);
                            if (ubEspecifica != null) ubicacionesCache[linRec.UbicacionId.Value] = ubEspecifica;
                        }
                        if (ubEspecifica != null) idUbicacionFinal = ubEspecifica.Id;
                    }

                    mapaPrevias.TryGetValue(linea.ProductoId, out var prevDetalle);
                    decimal cantPrevia = prevDetalle?.CantidadRecibida ?? 0m;
                    decimal deltaCantidad = linea.Cantidad - cantPrevia;
                    decimal factor = linea.FactorConversion ?? 1m;

                    var stock = await context.StocksAlmacen.FirstOrDefaultAsync(x => x.UbicacionId == idUbicacionFinal && x.Condicion == CondicionInventario.Utilizable && x.ProductoId == linea.ProductoId, ct);
                    if (stock == null)
                    {
                        stock = StockAlmacen.Crear(idUbicacionFinal, linea.ProductoId);
                        await context.StocksAlmacen.AddAsync(stock, ct);
                    }

                    if (deltaCantidad > 0)
                    {
                        decimal cantidadAumentar = deltaCantidad * factor;
                        stock.AumentarStock(cantidadAumentar);
                        if (linea.Series.Count == 0)
                        {
                            await context.MovimientosInventario.AddAsync(MovimientoInventario.Registrar(TipoMovimientoInventario.IngresoProveedor, linea.ProductoId, cantidadAumentar,
                                almacenDestinoId: command.AlmacenId, numeroDocumento: compra.Numero, usuarioResponsableId: user.Id, observaciones: factor > 1 ? $"{compra.Numero} ({deltaCantidad} {linea.Unidad} = {cantidadAumentar:G29} base)" : command.Observacion, ubicacionDestinoId: idUbicacionFinal, eventoId: compra.Id), ct);
                        }
                    }
                    else if (deltaCantidad < 0)
                    {
                        decimal cantidadReducir = Math.Abs(deltaCantidad) * factor;
                        stock.DisminuirStock(cantidadReducir);
                    }

                    var seriesPrevias = prevDetalle?.SeriesRecibidas ?? [];
                    var seriesNuevas = linea.Series.Except(seriesPrevias).ToList();
                    foreach (var serie in seriesNuevas)
                    {
                        var item = ItemSeriado.Crear(linea.ProductoId, serie, idUbicacionFinal);
                        await context.ItemsSeriados.AddAsync(item, ct);
                        await context.MovimientosInventario.AddAsync(MovimientoInventario.Registrar(TipoMovimientoInventario.IngresoProveedor, linea.ProductoId, 1,
                            almacenDestinoId: command.AlmacenId, itemSeriadoId: item.Id, numeroDocumento: compra.Numero, usuarioResponsableId: user.Id, observaciones: command.Observacion, ubicacionDestinoId: idUbicacionFinal, eventoId: compra.Id), ct);
                    }

                    var seriesRemovidas = seriesPrevias.Except(linea.Series).ToList();
                    if (seriesRemovidas.Count > 0)
                    {
                        var itemsEliminar = await context.ItemsSeriados.Where(x => x.ProductoId == linea.ProductoId && seriesRemovidas.Contains(x.NumeroSerie)).ToListAsync(ct);
                        context.ItemsSeriados.RemoveRange(itemsEliminar);
                    }
                }
                await context.SaveChangesAsync(ct);
            }, cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            var detalle = ex.InnerException?.Message ?? ex.Message;
            return Result<Guid>.Failure($"No se pudo registrar la compra: {detalle}");
        }
        return Result<Guid>.Success(compra.Id);
    }

    public async Task<Result<Guid>> CerrarFaltantesAsync(Guid id, CancellationToken cancellationToken)
    {
        var compra = await context.Compras.FindAsync([id], cancellationToken);
        if (compra is null) return Result<Guid>.Failure("La compra no existe.");
        if (compra.Estado != "Recibida con faltantes") return Result<Guid>.Failure("Solo se pueden cerrar compras que se encuentren en estado 'Recibida con faltantes'.");
        if (!compra.AlmacenId.HasValue || !await InventarioAcceso.PuedeAsync(context, user, compra.AlmacenId.Value, "recibir", cancellationToken))
            return Result<Guid>.Failure("No tiene permisos para modificar la recepción de este almacén.");

        compra.CerrarFaltantes(user.Id);
        await context.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(compra.Id);
    }
}

public class ActualizarCompraHandler(IServicioCampoDbContext context, ICurrentUser user, ICodigoSecuencialService? seqService = null) : ICommandHandler<ActualizarCompraCommand, Result<Guid>>
{
    public Task<Result<Guid>> HandleAsync(ActualizarCompraCommand command, CancellationToken cancellationToken = default)
        => new CrearCompraHandler(context, user, seqService).GuardarAsync(command.Datos, command.Id, cancellationToken);
}
public class ProcesarCompraHandler(IServicioCampoDbContext context, ICurrentUser user, ICodigoSecuencialService? seqService = null) : ICommandHandler<ProcesarCompraCommand, Result<Guid>>
{
    public Task<Result<Guid>> HandleAsync(ProcesarCompraCommand command, CancellationToken cancellationToken = default)
        => new CrearCompraHandler(context, user, seqService).ProcesarAsync(command.Id, command.Accion == "recepcionar", cancellationToken, command.Accion == "enviar");
}

public record CerrarFaltantesCompraCommand(Guid Id) : ICommand<Result<Guid>>;

public class CerrarFaltantesCompraHandler(IServicioCampoDbContext context, ICurrentUser user, ICodigoSecuencialService? seqService = null) : ICommandHandler<CerrarFaltantesCompraCommand, Result<Guid>>
{
    public Task<Result<Guid>> HandleAsync(CerrarFaltantesCompraCommand command, CancellationToken cancellationToken = default)
        => new CrearCompraHandler(context, user, seqService).CerrarFaltantesAsync(command.Id, cancellationToken);
}
public class RecepcionarCompraHandler(IServicioCampoDbContext context, ICurrentUser user, ICodigoSecuencialService? seqService = null) : ICommandHandler<RecepcionarCompraCommand, Result<Guid>>
{
    public Task<Result<Guid>> HandleAsync(RecepcionarCompraCommand command, CancellationToken cancellationToken = default)
        => new CrearCompraHandler(context, user, seqService).ProcesarAsync(command.Id, true, cancellationToken, recepcion: command.Datos);
}
