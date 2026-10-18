using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.DevolucionesProveedor;

public record LineaDevolucionDto(
    Guid ProductoId,
    string CodigoProducto,
    string NombreProducto,
    string? UnidadMedida,
    decimal Cantidad,
    CondicionInventario Condicion,
    IReadOnlyList<string>? Series = null
);

public record DevolucionProveedorDto(
    Guid Id,
    string Numero,
    string Proveedor,
    Guid AlmacenId,
    string AlmacenNombre,
    Guid? UbicacionId,
    string? UbicacionNombre,
    string TipoDocumento,
    string NumeroDocumento,
    DateOnly FechaDocumento,
    string Motivo,
    string? Observaciones,
    string? DocumentoRespaldoUrl,
    int TotalItems,
    decimal TotalCantidad,
    string Estado,
    Guid UsuarioId,
    string UsuarioNombre,
    DateTime FechaRegistro,
    DateTime? FechaCompletada,
    IReadOnlyList<LineaDevolucionDto> Lineas
);

public record ObtenerDevolucionesProveedorQuery(Guid? AlmacenId = null) : IQuery<Result<List<DevolucionProveedorDto>>>;
public record ObtenerDevolucionProveedorPorIdQuery(Guid Id) : IQuery<Result<DevolucionProveedorDto>>;

public record LineaDevolucionInput(
    Guid ProductoId,
    decimal Cantidad,
    CondicionInventario Condicion = CondicionInventario.Defectuoso,
    IReadOnlyList<string>? Series = null
);

public record CrearDevolucionProveedorCommand(
    string Proveedor,
    Guid AlmacenId,
    Guid? UbicacionId,
    string TipoDocumento,
    string NumeroDocumento,
    DateOnly FechaDocumento,
    string Motivo,
    string? Observaciones,
    string? DocumentoRespaldoUrl,
    IReadOnlyList<LineaDevolucionInput> Lineas,
    bool EsBorrador = false
) : ICommand<Result<Guid>>;

public record ActualizarDevolucionProveedorCommand(
    Guid Id,
    string Proveedor,
    Guid AlmacenId,
    Guid? UbicacionId,
    string TipoDocumento,
    string NumeroDocumento,
    DateOnly FechaDocumento,
    string Motivo,
    string? Observaciones,
    string? DocumentoRespaldoUrl,
    IReadOnlyList<LineaDevolucionInput> Lineas
) : ICommand<Result>;

public record CompletarDevolucionProveedorCommand(Guid Id) : ICommand<Result>;

public record EliminarDevolucionProveedorCommand(Guid Id) : ICommand<Result>;

public class ObtenerDevolucionesProveedorHandler(IServicioCampoDbContext context, ICurrentUser user)
    : IQueryHandler<ObtenerDevolucionesProveedorQuery, Result<List<DevolucionProveedorDto>>>,
      IQueryHandler<ObtenerDevolucionProveedorPorIdQuery, Result<DevolucionProveedorDto>>
{
    public async Task<Result<List<DevolucionProveedorDto>>> HandleAsync(ObtenerDevolucionesProveedorQuery query, CancellationToken cancellationToken = default)
    {
        var permitidos = InventarioAcceso.AlmacenesConsultables(context, user);

        var queryable = context.DevolucionesProveedor
            .AsNoTracking()
            .Include(x => x.Almacen)
            .Include(x => x.Ubicacion)
            .Where(x => permitidos.Contains(x.AlmacenId));

        if (query.AlmacenId.HasValue)
            queryable = queryable.Where(x => x.AlmacenId == query.AlmacenId.Value);

        var devoluciones = await queryable
            .OrderByDescending(x => x.FechaRegistro)
            .ToListAsync(cancellationToken);

        var dtos = devoluciones.Select(MapearDto).ToList();
        return Result<List<DevolucionProveedorDto>>.Success(dtos);
    }

    public async Task<Result<DevolucionProveedorDto>> HandleAsync(ObtenerDevolucionProveedorPorIdQuery query, CancellationToken cancellationToken = default)
    {
        var devolucion = await context.DevolucionesProveedor
            .AsNoTracking()
            .Include(x => x.Almacen)
            .Include(x => x.Ubicacion)
            .FirstOrDefaultAsync(x => x.Id == query.Id, cancellationToken);

        if (devolucion == null)
            return Result<DevolucionProveedorDto>.Failure("No se encontró la devolución a proveedor solicitada.");

        return Result<DevolucionProveedorDto>.Success(MapearDto(devolucion));
    }

    public static DevolucionProveedorDto MapearDto(DevolucionProveedor d)
    {
        var lineas = new List<LineaDevolucionDto>();
        try
        {
            if (!string.IsNullOrWhiteSpace(d.LineasJson))
            {
                lineas = JsonSerializer.Deserialize<List<LineaDevolucionDto>>(d.LineasJson) ?? new List<LineaDevolucionDto>();
            }
        }
        catch { }

        return new DevolucionProveedorDto(
            d.Id,
            d.Numero,
            d.Proveedor,
            d.AlmacenId,
            d.Almacen?.Nombre ?? "Almacén",
            d.UbicacionId,
            d.Ubicacion?.Nombre,
            d.TipoDocumento,
            d.NumeroDocumento,
            d.FechaDocumento,
            d.Motivo,
            d.Observaciones,
            d.DocumentoRespaldoUrl,
            d.TotalItems,
            d.TotalCantidad,
            d.Estado,
            d.UsuarioId,
            d.UsuarioNombre,
            d.FechaRegistro,
            d.FechaCompletada,
            lineas
        );
    }
}

public class DevolucionesProveedorCommandsHandler(IServicioCampoDbContext context, ICurrentUser user, ICodigoSecuencialService? seqService = null)
    : ICommandHandler<CrearDevolucionProveedorCommand, Result<Guid>>,
      ICommandHandler<ActualizarDevolucionProveedorCommand, Result>,
      ICommandHandler<CompletarDevolucionProveedorCommand, Result>,
      ICommandHandler<EliminarDevolucionProveedorCommand, Result>
{
    public async Task<Result<Guid>> HandleAsync(CrearDevolucionProveedorCommand command, CancellationToken cancellationToken = default)
    {
        var validacion = await ValidarSalidaAsync(command.Proveedor, command.AlmacenId, command.UbicacionId, command.NumeroDocumento, command.Motivo, command.Lineas, command.EsBorrador, cancellationToken);
        if (validacion.IsFailure) return Result<Guid>.Failure(validacion.Error);

        var (almacen, ubicacionOrigen, lineasDto, totalCantidad, itemsSeriados, productos) = validacion.Value;

        // Generar correlativo DEV-20261017-0001
        string numeroDevolucion;
        if (seqService != null)
        {
            numeroDevolucion = await seqService.SiguienteCodigoAsync(
                prefijo: "DEV",
                nombreSecuencia: "seq_devoluciones_proveedor",
                esquema: "inventario",
                longitud: 6,
                cancellationToken: cancellationToken);
        }
        else
        {
            var count = await context.DevolucionesProveedor.CountAsync(cancellationToken);
            numeroDevolucion = $"DEV-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";
        }

        var devolucion = DevolucionProveedor.Registrar(
            Guid.NewGuid(),
            numeroDevolucion,
            command.Proveedor,
            command.AlmacenId,
            ubicacionOrigen.Id,
            command.TipoDocumento,
            command.NumeroDocumento,
            command.FechaDocumento,
            command.Motivo,
            command.Observaciones,
            command.DocumentoRespaldoUrl,
            JsonSerializer.Serialize(lineasDto),
            lineasDto.Count,
            totalCantidad,
            user.Id,
            user.Nombre,
            completarInmediato: !command.EsBorrador
        );

        if (command.EsBorrador)
        {
            await context.DevolucionesProveedor.AddAsync(devolucion, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
            return Result<Guid>.Success(devolucion.Id);
        }

        // Si se completa de inmediato, impactar kardex y stock en transacción
        await context.EjecutarEnTransaccionAsync(async ct =>
        {
            await context.DevolucionesProveedor.AddAsync(devolucion, ct);
            await DescontarStockYKardexAsync(devolucion, lineasDto, itemsSeriados, productos, ubicacionOrigen, ct);
            await context.SaveChangesAsync(ct);
        }, cancellationToken);

        return Result<Guid>.Success(devolucion.Id);
    }

    public async Task<Result> HandleAsync(ActualizarDevolucionProveedorCommand command, CancellationToken cancellationToken = default)
    {
        var devolucion = await context.DevolucionesProveedor.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken);
        if (devolucion == null) return Result.Failure("La devolución a proveedor no existe.");
        if (devolucion.Estado != "Borrador") return Result.Failure("Solo se pueden editar devoluciones en estado Borrador.");

        var validacion = await ValidarSalidaAsync(command.Proveedor, command.AlmacenId, command.UbicacionId, command.NumeroDocumento, command.Motivo, command.Lineas, esBorrador: true, cancellationToken);
        if (validacion.IsFailure) return Result.Failure(validacion.Error);

        var (_, ubicacionOrigen, lineasDto, totalCantidad, _, _) = validacion.Value;

        devolucion.Actualizar(
            command.Proveedor,
            command.AlmacenId,
            ubicacionOrigen.Id,
            command.TipoDocumento,
            command.NumeroDocumento,
            command.FechaDocumento,
            command.Motivo,
            command.Observaciones,
            command.DocumentoRespaldoUrl,
            JsonSerializer.Serialize(lineasDto),
            lineasDto.Count,
            totalCantidad
        );

        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(CompletarDevolucionProveedorCommand command, CancellationToken cancellationToken = default)
    {
        var devolucion = await context.DevolucionesProveedor.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken);
        if (devolucion == null) return Result.Failure("La devolución a proveedor no existe.");
        if (devolucion.Estado != "Borrador") return Result.Failure("Solo se pueden completar devoluciones en estado Borrador.");

        var lineas = JsonSerializer.Deserialize<List<LineaDevolucionDto>>(devolucion.LineasJson) ?? new List<LineaDevolucionDto>();
        var lineasInput = lineas.Select(l => new LineaDevolucionInput(l.ProductoId, l.Cantidad, l.Condicion, l.Series)).ToList();

        var validacion = await ValidarSalidaAsync(devolucion.Proveedor, devolucion.AlmacenId, devolucion.UbicacionId, devolucion.NumeroDocumento, devolucion.Motivo, lineasInput, esBorrador: false, cancellationToken);
        if (validacion.IsFailure) return Result.Failure(validacion.Error);

        var (_, ubicacionOrigen, lineasDto, _, itemsSeriados, productos) = validacion.Value;

        await context.EjecutarEnTransaccionAsync(async ct =>
        {
            devolucion.Completar();
            await DescontarStockYKardexAsync(devolucion, lineasDto, itemsSeriados, productos, ubicacionOrigen, ct);
            await context.SaveChangesAsync(ct);
        }, cancellationToken);

        return Result.Success();
    }

    public async Task<Result> HandleAsync(EliminarDevolucionProveedorCommand command, CancellationToken cancellationToken = default)
    {
        var devolucion = await context.DevolucionesProveedor.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken);
        if (devolucion == null) return Result.Failure("La devolución a proveedor no existe.");
        if (devolucion.Estado != "Borrador") return Result.Failure("Solo se pueden eliminar devoluciones en estado Borrador.");

        context.DevolucionesProveedor.Remove(devolucion);
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    private async Task<Result<(Almacen Almacen, UbicacionInventario UbicacionOrigen, List<LineaDevolucionDto> LineasDto, decimal TotalCantidad, Dictionary<string, ItemSeriado> ItemsSeriados, Dictionary<Guid, Producto> Productos)>>
        ValidarSalidaAsync(string proveedor, Guid almacenId, Guid? ubicacionId, string numeroDocumento, string motivo, IReadOnlyList<LineaDevolucionInput> lineas, bool esBorrador, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(proveedor))
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("Debe ingresar la empresa proveedora destinataria.");
        if (!esBorrador && string.IsNullOrWhiteSpace(numeroDocumento))
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("Debe ingresar el número de documento / guía / acta de devolución.");
        if (string.IsNullOrWhiteSpace(motivo))
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("Debe indicar el motivo de la devolución.");
        if (!esBorrador && (lineas == null || lineas.Count == 0))
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("Debe agregar al menos un material o equipo para devolver.");

        var almacen = await context.Almacenes.AsNoTracking().FirstOrDefaultAsync(a => a.Id == almacenId, ct);
        if (almacen == null)
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("El almacén seleccionado no existe.");

        // Regla de negocio: Las salidas solo se hacen de un almacén/bodega física, no de una custodia personal de técnico
        if (almacen.Tipo == TipoAlmacen.CustodiaPersonal)
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("Las salidas o devoluciones a proveedor solo se realizan desde un almacén o bodega física, no desde una custodia de técnico.");

        if (!await InventarioAcceso.PuedeAsync(context, user, almacenId, "despachar", ct))
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("No tiene autorización para registrar salidas o devoluciones desde este almacén.");

        var ubicacionOrigen = await InventarioAcceso.UbicacionAsync(context, almacenId, ubicacionId, ct);
        if (ubicacionOrigen == null)
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("La ubicación de origen no existe o no pertenece al almacén seleccionado.");

        if (lineas == null || lineas.Count == 0)
        {
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>
                .Success((almacen, ubicacionOrigen, new List<LineaDevolucionDto>(), 0m, new Dictionary<string, ItemSeriado>(), new Dictionary<Guid, Producto>()));
        }

        var ubicacionesAlmacenIds = await context.UbicacionesInventario
            .Where(u => u.AlmacenId == almacenId)
            .Select(u => u.Id)
            .ToListAsync(ct);

        var idsProductos = lineas.Select(x => x.ProductoId).Distinct().ToList();
        var productos = await context.Productos
            .Include(x => x.UnidadMedidaDefecto)
            .Where(x => idsProductos.Contains(x.Id) && x.Activo && x.Tipo == TipoProducto.Inventario)
            .ToDictionaryAsync(x => x.Id, ct);

        if (productos.Count != idsProductos.Count)
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("Uno o más productos seleccionados están inactivos o no son inventariables.");

        var todasLasSeries = lineas.SelectMany(x => (x.Series ?? []).Select(s => s.Trim().ToUpperInvariant())).ToList();
        if (todasLasSeries.Distinct().Count() != todasLasSeries.Count)
            return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure("Existen números de serie duplicados en la devolución.");

        Dictionary<string, ItemSeriado> itemsSeriados = new();
        if (todasLasSeries.Count > 0)
        {
            itemsSeriados = await context.ItemsSeriados
                .Where(x => todasLasSeries.Contains(x.NumeroSerie))
                .ToDictionaryAsync(x => x.NumeroSerie, ct);

            foreach (var serie in todasLasSeries)
            {
                if (!itemsSeriados.TryGetValue(serie, out var item))
                    return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure($"La serie '{serie}' no existe en el sistema.");

                // Las series pueden estar en cualquier ubicación interna del almacén
                if (!item.UbicacionActualId.HasValue || !ubicacionesAlmacenIds.Contains(item.UbicacionActualId.Value))
                    return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure($"La serie '{serie}' no se encuentra en el almacén '{almacen.Nombre}'.");

                if (item.TransferenciaEnTransitoId.HasValue)
                    return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure($"La serie '{serie}' se encuentra en tránsito y no puede devolverse.");
            }
        }

        var lineasDto = new List<LineaDevolucionDto>();
        decimal totalCantidad = 0m;

        foreach (var linea in lineas)
        {
            var p = productos[linea.ProductoId];
            if (linea.Cantidad <= 0)
                return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure($"La cantidad del producto '{p.Nombre}' debe ser mayor a 0.");

            if (p.EsSerializado)
            {
                if (decimal.Truncate(linea.Cantidad) != linea.Cantidad || (linea.Series?.Count ?? 0) != (int)linea.Cantidad)
                    return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Failure($"Para el producto seriado '{p.Nombre}' debe ingresar exactamente una serie por cada unidad.");
            }

            var seriesLimpias = (linea.Series ?? []).Select(s => s.Trim().ToUpperInvariant()).ToList();
            lineasDto.Add(new LineaDevolucionDto(
                p.Id,
                p.Codigo,
                p.Nombre,
                p.UnidadMedidaDefecto?.Nombre ?? "UND",
                linea.Cantidad,
                linea.Condicion,
                seriesLimpias.Count > 0 ? seriesLimpias : null
            ));

            totalCantidad += linea.Cantidad;
        }

        return Result<(Almacen, UbicacionInventario, List<LineaDevolucionDto>, decimal, Dictionary<string, ItemSeriado>, Dictionary<Guid, Producto>)>.Success(
            (almacen, ubicacionOrigen, lineasDto, totalCantidad, itemsSeriados, productos)
        );
    }

    private async Task DescontarStockYKardexAsync(
        DevolucionProveedor devolucion,
        List<LineaDevolucionDto> lineasDto,
        Dictionary<string, ItemSeriado> itemsSeriados,
        Dictionary<Guid, Producto> productos,
        UbicacionInventario ubicacionOrigen,
        CancellationToken ct)
    {
        var ahoraUtc = DateTime.UtcNow;
        var fechaMovimientoReal = devolucion.FechaDocumento == DateOnly.FromDateTime(ahoraUtc)
            ? ahoraUtc
            : devolucion.FechaDocumento.ToDateTime(TimeOnly.FromDateTime(ahoraUtc), DateTimeKind.Utc);

        foreach (var l in lineasDto)
        {
            var p = productos[l.ProductoId];

            if (p.EsSerializado && l.Series != null)
            {
                foreach (var s in l.Series)
                {
                    var item = itemsSeriados[s];
                    // La serie se descuenta de SU PROPIA ubicación física real dentro del almacén
                    var ubicSerieId = item.UbicacionActualId ?? ubicacionOrigen.Id;
                    var stockSerie = await InventarioSaldos.ObtenerAsync(context, ubicSerieId, l.ProductoId, l.Condicion, ct);
                    stockSerie.DisminuirStock(1);

                    item.DevolverAProveedor(devolucion.NumeroDocumento);

                    await context.MovimientosInventario.AddAsync(MovimientoInventario.Registrar(
                        TipoMovimientoInventario.DevolucionAProveedor,
                        l.ProductoId,
                        1,
                        almacenOrigenId: devolucion.AlmacenId,
                        almacenDestinoId: null,
                        itemSeriadoId: item.Id,
                        numeroDocumento: devolucion.Numero,
                        observaciones: $"Devolución a proveedor {devolucion.Proveedor}. Doc: {devolucion.NumeroDocumento}. Motivo: {devolucion.Motivo}",
                        usuarioResponsableId: user.Id,
                        ubicacionOrigenId: ubicSerieId,
                        condicion: l.Condicion,
                        fechaReal: fechaMovimientoReal
                    ), ct);
                }
            }
            else
            {
                // Insumos no seriados
                var stock = await InventarioSaldos.ObtenerAsync(context, ubicacionOrigen.Id, l.ProductoId, l.Condicion, ct);
                stock.DisminuirStock(l.Cantidad);

                await context.MovimientosInventario.AddAsync(MovimientoInventario.Registrar(
                    TipoMovimientoInventario.DevolucionAProveedor,
                    l.ProductoId,
                    l.Cantidad,
                    almacenOrigenId: devolucion.AlmacenId,
                    almacenDestinoId: null,
                    numeroDocumento: devolucion.Numero,
                    observaciones: $"Devolución a proveedor {devolucion.Proveedor}. Doc: {devolucion.NumeroDocumento}. Motivo: {devolucion.Motivo}",
                    usuarioResponsableId: user.Id,
                    ubicacionOrigenId: ubicacionOrigen.Id,
                    condicion: l.Condicion,
                    fechaReal: fechaMovimientoReal
                ), ct);
            }
        }
    }
}
