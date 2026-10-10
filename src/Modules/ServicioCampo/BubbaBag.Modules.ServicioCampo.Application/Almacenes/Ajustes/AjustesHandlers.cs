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

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Ajustes;

public class AjustesHandlers :
    ICommandHandler<CrearAjusteCommand, Result<AjusteIdentificadorDto>>,
    ICommandHandler<ActualizarAjusteCommand, Result<AjusteIdentificadorDto>>,
    ICommandHandler<SolicitarAprobacionAjusteCommand, Result<AprobacionAjusteDto>>,
    ICommandHandler<AplicarAjusteCommand, Result>,
    ICommandHandler<RechazarAjusteCommand, Result>,
    ICommandHandler<AnularAjusteCommand, Result>,
    ICommandHandler<EliminarAjusteCommand, Result>,
    IQueryHandler<ObtenerAjustesQuery, Result<List<AjusteInventarioDto>>>,
    IQueryHandler<ObtenerAjustePorIdQuery, Result<AjusteInventarioDto>>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _user;
    private readonly ICodigoSecuencialService? _seqService;

    public AjustesHandlers(
        IServicioCampoDbContext context,
        ICurrentUser user,
        ICodigoSecuencialService? seqService = null)
    {
        _context = context;
        _user = user;
        _seqService = seqService;
    }

    public async Task<Result<AjusteIdentificadorDto>> HandleAsync(CrearAjusteCommand command, CancellationToken ct = default)
    {
        return await GuardarAsync(null, command.Datos, ct);
    }

    public async Task<Result<AjusteIdentificadorDto>> HandleAsync(ActualizarAjusteCommand command, CancellationToken ct = default)
    {
        return await GuardarAsync(command.Id, command.Datos, ct);
    }

    private async Task<Result<AjusteIdentificadorDto>> GuardarAsync(Guid? id, GuardarAjusteInput datos, CancellationToken ct)
    {
        if (datos.AlmacenId == Guid.Empty)
            return Result<AjusteIdentificadorDto>.Failure("Seleccione un almacén válido.");

        var almacen = await _context.Almacenes.FirstOrDefaultAsync(a => a.Id == datos.AlmacenId && a.Activo, ct);
        if (almacen == null)
            return Result<AjusteIdentificadorDto>.Failure("El almacén seleccionado no existe o está inactivo.");

        if (datos.Lineas == null || datos.Lineas.Count == 0)
            return Result<AjusteIdentificadorDto>.Failure("El ajuste debe contener al menos un producto.");

        if (datos.Lineas.Any(l => l.Cantidad <= 0))
            return Result<AjusteIdentificadorDto>.Failure("Todas las cantidades deben ser mayores a 0.");

        var idsProductos = datos.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productosDb = await _context.Productos
            .Include(p => p.UnidadMedidaDefecto)
            .Where(p => idsProductos.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        if (productosDb.Count != idsProductos.Count)
            return Result<AjusteIdentificadorDto>.Failure("Algunos productos del ajuste no existen en el catálogo.");

        // Construir líneas completas
        var lineasDto = new List<LineaAjusteItemDto>();
        int idx = 0;
        foreach (var l in datos.Lineas)
        {
            var p = productosDb[l.ProductoId];
            var seriesNormalizadas = (l.Series ?? new List<string>())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim().ToUpperInvariant())
                .Distinct()
                .ToList();

            if (p.EsSerializado && seriesNormalizadas.Count != (int)l.Cantidad)
            {
                return Result<AjusteIdentificadorDto>.Failure(
                    $"El producto serializado '{p.Nombre}' requiere exactamente {(int)l.Cantidad} número(s) de serie (se ingresaron {seriesNormalizadas.Count}).");
            }

            var subtotal = Math.Round(l.Cantidad * l.CostoUnitario, 2);
            lineasDto.Add(new LineaAjusteItemDto(
                Id: $"lin-{DateTime.UtcNow.Ticks}-{idx++}",
                ProductoId: l.ProductoId,
                CodigoProducto: p.Codigo,
                NombreProducto: p.Nombre,
                Unidad: p.UnidadMedidaDefecto?.Nombre ?? l.Unidad ?? "UND",
                StockActual: 0,
                Tipo: l.Tipo ?? datos.Tipo ?? "Entrada",
                Cantidad: l.Cantidad,
                CostoUnitario: l.CostoUnitario,
                Total: subtotal,
                EsSerializado: p.EsSerializado,
                Series: seriesNormalizadas,
                MotivoLinea: l.MotivoLinea
            ));
        }

        var totalItems = lineasDto.Count;
        var totalCantidad = lineasDto.Sum(l => l.Cantidad);
        var valorTotal = lineasDto.Sum(l => l.Total);
        var lineasJson = JsonSerializer.Serialize(lineasDto);

        if (!DateOnly.TryParse(datos.Fecha, out var fechaDate))
        {
            fechaDate = DateOnly.FromDateTime(DateTime.UtcNow);
        }

        if (id.HasValue && id.Value != Guid.Empty)
        {
            var existente = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == id.Value, ct);
            if (existente == null)
                return Result<AjusteIdentificadorDto>.Failure("El ajuste no existe.");

            existente.Actualizar(
                tipo: datos.Tipo ?? "Entrada",
                almacenId: datos.AlmacenId,
                ubicacionId: datos.UbicacionId,
                fecha: fechaDate,
                motivo: datos.Motivo,
                documentoReferencia: datos.DocumentoReferencia,
                observaciones: datos.Observaciones,
                totalItems: totalItems,
                totalCantidad: totalCantidad,
                valorTotal: valorTotal,
                lineasJson: lineasJson
            );

            await _context.SaveChangesAsync(ct);
            return Result<AjusteIdentificadorDto>.Success(new AjusteIdentificadorDto(existente.Id, existente.Numero));
        }

        // Generar número de ajuste
        string numeroAjuste = "";
        if (_seqService != null)
        {
            try
            {
                numeroAjuste = await _seqService.SiguienteCodigoAsync(
                    prefijo: "AJU",
                    nombreSecuencia: "seq_ajustes",
                    esquema: "inventario",
                    longitud: 6,
                    cancellationToken: ct);
            }
            catch
            {
                var count = await _context.AjustesInventario.CountAsync(ct);
                numeroAjuste = $"AJU-{(count + 1):D6}";
            }
        }
        else
        {
            var count = await _context.AjustesInventario.CountAsync(ct);
            numeroAjuste = $"AJU-{(count + 1):D6}";
        }

        var nuevoId = Guid.NewGuid();
        var nombreUsuario = _user.Email ?? "SuperAdmin";

        var nuevo = AjusteInventario.Registrar(
            id: nuevoId,
            numero: numeroAjuste,
            tipo: datos.Tipo ?? "Entrada",
            almacenId: datos.AlmacenId,
            ubicacionId: datos.UbicacionId,
            fecha: fechaDate,
            motivo: datos.Motivo,
            documentoReferencia: datos.DocumentoReferencia,
            observaciones: datos.Observaciones,
            totalItems: totalItems,
            totalCantidad: totalCantidad,
            valorTotal: valorTotal,
            lineasJson: lineasJson,
            usuarioId: _user.Id != Guid.Empty ? _user.Id : Guid.NewGuid(),
            usuarioRegistro: nombreUsuario
        );

        await _context.AjustesInventario.AddAsync(nuevo, ct);
        await _context.SaveChangesAsync(ct);

        return Result<AjusteIdentificadorDto>.Success(new AjusteIdentificadorDto(nuevo.Id, nuevo.Numero));
    }

    public async Task<Result<AprobacionAjusteDto>> HandleAsync(SolicitarAprobacionAjusteCommand command, CancellationToken ct = default)
    {
        var ajuste = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == command.Id, ct);
        if (ajuste == null)
            return Result<AprobacionAjusteDto>.Failure("El ajuste no existe.");

        string numeroApr = "";
        if (_seqService != null)
        {
            try
            {
                numeroApr = await _seqService.SiguienteCodigoAsync(
                    prefijo: "APR",
                    nombreSecuencia: "seq_aprobaciones_ajuste",
                    esquema: "inventario",
                    longitud: 6,
                    cancellationToken: ct);
            }
            catch
            {
                var count = await _context.AjustesInventario.CountAsync(a => a.NumeroAprobacion != null, ct);
                numeroApr = $"APR-{(count + 1):D6}";
            }
        }
        else
        {
            var count = await _context.AjustesInventario.CountAsync(a => a.NumeroAprobacion != null, ct);
            numeroApr = $"APR-{(count + 1):D6}";
        }

        ajuste.SolicitarAprobacion(numeroApr);
        await _context.SaveChangesAsync(ct);

        return Result<AprobacionAjusteDto>.Success(new AprobacionAjusteDto(ajuste.NumeroAprobacion!));
    }

    public async Task<Result> HandleAsync(RechazarAjusteCommand command, CancellationToken ct = default)
    {
        var ajuste = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == command.Id, ct);
        if (ajuste == null)
            return Result.Failure("El ajuste no existe.");

        ajuste.Observar(command.Motivo);
        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(AnularAjusteCommand command, CancellationToken ct = default)
    {
        var ajuste = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == command.Id, ct);
        if (ajuste == null)
            return Result.Failure("El ajuste no existe.");

        ajuste.Anular();
        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(EliminarAjusteCommand command, CancellationToken ct = default)
    {
        var ajuste = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == command.Id, ct);
        if (ajuste == null)
            return Result.Failure("El ajuste no existe.");

        if (ajuste.Estado != "Borrador")
            return Result.Failure("Solo se pueden eliminar ajustes en estado Borrador.");

        _context.AjustesInventario.Remove(ajuste);
        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(AplicarAjusteCommand command, CancellationToken ct = default)
    {
        var ajuste = await _context.AjustesInventario
            .Include(a => a.Almacen)
            .FirstOrDefaultAsync(a => a.Id == command.Id, ct);

        if (ajuste == null)
            return Result.Failure("El ajuste no existe.");

        if (ajuste.Estado == "Aplicado")
            return Result.Failure("El ajuste ya fue aplicado previamente.");

        if (ajuste.Estado == "Anulado")
            return Result.Failure("No se puede aplicar un ajuste anulado.");

        // Determinar ubicación final del almacén
        Guid ubicacionId = Guid.Empty;
        if (ajuste.UbicacionId.HasValue && ajuste.UbicacionId.Value != Guid.Empty)
        {
            ubicacionId = ajuste.UbicacionId.Value;
        }
        else
        {
            var ubPred = await _context.UbicacionesInventario
                .FirstOrDefaultAsync(u => u.AlmacenId == ajuste.AlmacenId && u.EsPrincipal && u.Activa, ct)
                ?? await _context.UbicacionesInventario
                .FirstOrDefaultAsync(u => u.AlmacenId == ajuste.AlmacenId && u.Activa, ct);

            if (ubPred != null)
            {
                ubicacionId = ubPred.Id;
            }
            else
            {
                // Crear ubicación Principal automáticamente
                var nuevaUb = UbicacionInventario.Crear(
                    ajuste.AlmacenId,
                    "PRINCIPAL",
                    "Principal",
                    principal: true
                );
                await _context.UbicacionesInventario.AddAsync(nuevaUb, ct);
                await _context.SaveChangesAsync(ct);
                ubicacionId = nuevaUb.Id;
            }
        }

        var lineas = JsonSerializer.Deserialize<List<LineaAjusteItemDto>>(ajuste.LineasJson) ?? new List<LineaAjusteItemDto>();
        if (lineas.Count == 0)
            return Result.Failure("El ajuste no contiene líneas de productos.");

        try
        {
            await _context.EjecutarEnTransaccionAsync(async token =>
            {
                foreach (var linea in lineas)
                {
                    bool esEntrada = string.Equals(linea.Tipo, "Entrada", StringComparison.OrdinalIgnoreCase);

                    var stock = await _context.StocksAlmacen.FirstOrDefaultAsync(
                        s => s.UbicacionId == ubicacionId && s.ProductoId == linea.ProductoId && s.Condicion == CondicionInventario.Utilizable,
                        token);

                    if (esEntrada)
                    {
                        if (stock == null)
                        {
                            stock = StockAlmacen.Crear(ubicacionId, linea.ProductoId, condicion: CondicionInventario.Utilizable);
                            await _context.StocksAlmacen.AddAsync(stock, token);
                        }
                        stock.AumentarStock(linea.Cantidad);

                        if (linea.EsSerializado && linea.Series != null && linea.Series.Count > 0)
                        {
                            foreach (var s in linea.Series)
                            {
                                var sUpper = s.Trim().ToUpperInvariant();
                                var item = await _context.ItemsSeriados.FirstOrDefaultAsync(
                                    i => i.NumeroSerie == sUpper && i.ProductoId == linea.ProductoId, token);

                                if (item == null)
                                {
                                    item = ItemSeriado.Crear(linea.ProductoId, sUpper, ubicacionId);
                                    await _context.ItemsSeriados.AddAsync(item, token);
                                }
                                else
                                {
                                    item.Ubicar(ubicacionId, TipoAlmacen.Bodega, CondicionInventario.Utilizable);
                                }

                                await _context.MovimientosInventario.AddAsync(MovimientoInventario.Registrar(
                                    TipoMovimientoInventario.AjusteInventario,
                                    linea.ProductoId,
                                    1,
                                    almacenDestinoId: ajuste.AlmacenId,
                                    itemSeriadoId: item.Id,
                                    numeroDocumento: ajuste.Numero,
                                    usuarioResponsableId: _user.Id != Guid.Empty ? _user.Id : null,
                                    observaciones: $"Ajuste de ingreso (+): {ajuste.Motivo}",
                                    ubicacionDestinoId: ubicacionId,
                                    eventoId: ajuste.Id), token);
                            }
                        }
                        else
                        {
                            await _context.MovimientosInventario.AddAsync(MovimientoInventario.Registrar(
                                TipoMovimientoInventario.AjusteInventario,
                                linea.ProductoId,
                                linea.Cantidad,
                                almacenDestinoId: ajuste.AlmacenId,
                                numeroDocumento: ajuste.Numero,
                                usuarioResponsableId: _user.Id != Guid.Empty ? _user.Id : null,
                                observaciones: $"Ajuste de ingreso (+): {ajuste.Motivo}",
                                ubicacionDestinoId: ubicacionId,
                                eventoId: ajuste.Id), token);
                        }
                    }
                    else
                    {
                        // Salida
                        if (stock == null || stock.CantidadDisponible < linea.Cantidad)
                        {
                            throw new InvalidOperationException(
                                $"Stock insuficiente para '{linea.NombreProducto}'. Disponible: {stock?.CantidadDisponible ?? 0}, a retirar: {linea.Cantidad}.");
                        }
                        stock.DisminuirStock(linea.Cantidad);

                        if (linea.EsSerializado && linea.Series != null && linea.Series.Count > 0)
                        {
                            foreach (var s in linea.Series)
                            {
                                var sUpper = s.Trim().ToUpperInvariant();
                                var item = await _context.ItemsSeriados.FirstOrDefaultAsync(
                                    i => i.NumeroSerie == sUpper && i.ProductoId == linea.ProductoId, token);

                                if (item != null)
                                {
                                    item.DarDeBaja($"Ajuste de salida (-): {ajuste.Motivo}");
                                }

                                await _context.MovimientosInventario.AddAsync(MovimientoInventario.Registrar(
                                    TipoMovimientoInventario.AjusteInventario,
                                    linea.ProductoId,
                                    1,
                                    almacenOrigenId: ajuste.AlmacenId,
                                    itemSeriadoId: item?.Id,
                                    numeroDocumento: ajuste.Numero,
                                    usuarioResponsableId: _user.Id != Guid.Empty ? _user.Id : null,
                                    observaciones: $"Ajuste de salida (-): {ajuste.Motivo}",
                                    ubicacionOrigenId: ubicacionId,
                                    eventoId: ajuste.Id), token);
                            }
                        }
                        else
                        {
                            await _context.MovimientosInventario.AddAsync(MovimientoInventario.Registrar(
                                TipoMovimientoInventario.AjusteInventario,
                                linea.ProductoId,
                                linea.Cantidad,
                                almacenOrigenId: ajuste.AlmacenId,
                                numeroDocumento: ajuste.Numero,
                                usuarioResponsableId: _user.Id != Guid.Empty ? _user.Id : null,
                                observaciones: $"Ajuste de salida (-): {ajuste.Motivo}",
                                ubicacionOrigenId: ubicacionId,
                                eventoId: ajuste.Id), token);
                        }
                    }
                }

                ajuste.Aplicar(command.UsuarioAprobador ?? _user.Email ?? "Supervisor");
                await _context.SaveChangesAsync(token);
            }, ct);
        }
        catch (Exception ex)
        {
            return Result.Failure($"Error al aplicar el ajuste: {ex.Message}");
        }

        return Result.Success();
    }

    public async Task<Result<List<AjusteInventarioDto>>> HandleAsync(ObtenerAjustesQuery query, CancellationToken ct = default)
    {
        var q = _context.AjustesInventario
            .AsNoTracking()
            .Include(a => a.Almacen)
            .Include(a => a.Ubicacion)
            .AsQueryable();

        if (query.AlmacenId.HasValue && query.AlmacenId.Value != Guid.Empty)
        {
            q = q.Where(a => a.AlmacenId == query.AlmacenId.Value);
        }

        var list = await q.OrderByDescending(a => a.FechaRegistro).ToListAsync(ct);
        var dtos = list.Select(MapearADto).ToList();

        return Result<List<AjusteInventarioDto>>.Success(dtos);
    }

    public async Task<Result<AjusteInventarioDto>> HandleAsync(ObtenerAjustePorIdQuery query, CancellationToken ct = default)
    {
        var ajuste = await _context.AjustesInventario
            .AsNoTracking()
            .Include(a => a.Almacen)
            .Include(a => a.Ubicacion)
            .FirstOrDefaultAsync(a => a.Id == query.Id, ct);

        if (ajuste == null)
            return Result<AjusteInventarioDto>.Failure("Ajuste no encontrado.");

        return Result<AjusteInventarioDto>.Success(MapearADto(ajuste));
    }

    private static AjusteInventarioDto MapearADto(AjusteInventario a)
    {
        var lineas = JsonSerializer.Deserialize<List<LineaAjusteItemDto>>(a.LineasJson) ?? new List<LineaAjusteItemDto>();

        return new AjusteInventarioDto(
            Id: a.Id,
            Numero: a.Numero,
            NumeroAprobacion: a.NumeroAprobacion,
            Tipo: a.Tipo,
            AlmacenId: a.AlmacenId,
            NombreAlmacen: a.Almacen?.Nombre ?? "Almacén",
            UbicacionId: a.UbicacionId,
            NombreUbicacion: a.Ubicacion?.Nombre,
            Fecha: a.Fecha.ToString("yyyy-MM-dd"),
            Motivo: a.Motivo,
            DocumentoReferencia: a.DocumentoReferencia,
            Observaciones: a.Observaciones,
            Estado: a.Estado,
            TotalItems: a.TotalItems,
            TotalCantidad: a.TotalCantidad,
            ValorTotal: a.ValorTotal,
            UsuarioRegistro: a.UsuarioRegistro,
            FechaRegistro: a.FechaRegistro,
            UsuarioAprobacion: a.UsuarioAprobacion,
            FechaAprobacion: a.FechaAprobacion,
            Lineas: lineas
        );
    }
}
