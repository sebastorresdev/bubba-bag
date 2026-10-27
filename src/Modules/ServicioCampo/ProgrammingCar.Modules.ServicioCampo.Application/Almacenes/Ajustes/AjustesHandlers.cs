using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using ProgrammingCar.SharedKernel.Authorization;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application.Almacenes.Ajustes;

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

    public Task<Result<AjusteIdentificadorDto>> HandleAsync(CrearAjusteCommand command, CancellationToken ct = default) =>
        ModificarAsync(command.RecuperacionId ?? Guid.NewGuid(), () => CrearAsync(command, ct), ct);

    private async Task<Result<AjusteIdentificadorDto>> CrearAsync(CrearAjusteCommand command, CancellationToken ct)
    {
        if (!_user.IsAuthenticated || _user.Id == Guid.Empty)
            return Result<AjusteIdentificadorDto>.Failure("Inicie sesión para registrar el ajuste.");
        if (command.RecuperacionId.HasValue)
        {
            if (command.RecuperacionId == Guid.Empty)
                return Result<AjusteIdentificadorDto>.Failure("Falta el identificador de recuperación.");

            // La misma recuperación devuelve el documento ya creado, incluso si se perdió la respuesta.
            var recuperado = await _context.AjustesInventario.AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == command.RecuperacionId.Value, ct);
            if (recuperado != null)
            {
                await AsegurarAccesoAsync(recuperado.AlmacenId, "consultar", ct);
                return recuperado.UsuarioId == _user.Id
                    ? Result<AjusteIdentificadorDto>.Success(new(recuperado.Id, recuperado.Numero))
                    : Result<AjusteIdentificadorDto>.Failure("No puede recuperar una operación de otro usuario.");
            }
        }
        return await GuardarAsync(null, command.Datos, ct, command.RecuperacionId);
    }

    public async Task<Result<AjusteIdentificadorDto>> HandleAsync(ActualizarAjusteCommand command, CancellationToken ct = default)
    {
        return await ModificarAsync(command.Id, () => GuardarAsync(command.Id, command.Datos, ct), ct);
    }

    private async Task<Result<AjusteIdentificadorDto>> GuardarAsync(Guid? id, GuardarAjusteInput datos, CancellationToken ct, Guid? recuperacionId = null)
    {
        if (!_user.HasPermission(Permissions.Inventario.Operar)) throw new UnauthorizedAccessException();
        if (datos.AlmacenId == Guid.Empty)
            return Result<AjusteIdentificadorDto>.Failure("Seleccione un almacén válido.");

        var almacen = await _context.Almacenes.FirstOrDefaultAsync(a => a.Id == datos.AlmacenId && a.Activo, ct);
        if (almacen == null)
            return Result<AjusteIdentificadorDto>.Failure("El almacén seleccionado no existe o está inactivo.");

        await AsegurarAccesoAsync(datos.AlmacenId, "consultar", ct);
        var ubicacion = await InventarioAcceso.UbicacionAsync(_context, datos.AlmacenId, datos.UbicacionId, ct);
        if (ubicacion == null)
            return Result<AjusteIdentificadorDto>.Failure("Seleccione una ubicación activa perteneciente al almacén del ajuste.");

        if (datos.Tipo is not ("Entrada" or "Salida") || string.IsNullOrWhiteSpace(datos.Motivo)
            || datos.Motivo.Length > 250 || datos.Observaciones?.Length > 1000 || datos.DocumentoReferencia?.Length > 100)
            return Result<AjusteIdentificadorDto>.Failure("Revise el tipo, motivo y longitud de los datos del ajuste.");

        if (datos.Lineas == null || datos.Lineas.Count == 0)
            return Result<AjusteIdentificadorDto>.Failure("El ajuste debe contener al menos un producto.");

        if (datos.Lineas.Count > 500 || datos.Lineas.Any(l => l.Cantidad <= 0 || l.Cantidad > 999999999.99999m || l.CostoUnitario < 0
            || l.Tipo is not ("Entrada" or "Salida")))
            return Result<AjusteIdentificadorDto>.Failure("Todas las cantidades deben ser mayores a 0.");

        if (datos.Lineas.Select(l => l.ProductoId).Distinct().Count() != datos.Lineas.Count)
            return Result<AjusteIdentificadorDto>.Failure("Cada producto debe aparecer una sola vez en el ajuste.");
        foreach (var tipo in datos.Lineas.Select(l => l.Tipo).Distinct())
            await AsegurarAccesoAsync(datos.AlmacenId, tipo == "Entrada" ? "recibir" : "despachar", ct);

        var idsProductos = datos.Lineas.Select(l => l.ProductoId).Distinct().ToList();
        var productosDb = await _context.Productos
            .Include(p => p.UnidadMedidaDefecto)
            .Where(p => idsProductos.Contains(p.Id) && p.Activo && p.Tipo == TipoProducto.Inventario)
            .ToDictionaryAsync(p => p.Id, ct);

        if (productosDb.Count != idsProductos.Count)
            return Result<AjusteIdentificadorDto>.Failure("Algunos productos del ajuste no existen en el catálogo.");

        // Construir líneas completas
        var lineasDto = new List<LineaAjusteItemDto>();
        int idx = 0;
        var todasLasSeries = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var l in datos.Lineas)
        {
            var p = productosDb[l.ProductoId];
            var seriesNormalizadas = (l.Series ?? new List<string>())
                .Select(s => s?.Trim().ToUpperInvariant() ?? "")
                .ToList();

            if ((l.Series ?? []).Any(s => string.IsNullOrWhiteSpace(s) || s.Trim().Length > 100)
                || seriesNormalizadas.Any(s => !todasLasSeries.Add(s)))
                return Result<AjusteIdentificadorDto>.Failure("Hay series vacías, repetidas o demasiado largas.");

            if (decimal.Round(l.Cantidad, Math.Clamp(p.DecimalesCantidad, 0, 5)) != l.Cantidad
                || p.EsSerializado && decimal.Truncate(l.Cantidad) != l.Cantidad)
                return Result<AjusteIdentificadorDto>.Failure("La cantidad no respeta los decimales del producto; los productos serializados requieren unidades enteras.");
            if (!p.EsSerializado && seriesNormalizadas.Count > 0)
                return Result<AjusteIdentificadorDto>.Failure("Un producto no serializado no admite series.");

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
            return Result<AjusteIdentificadorDto>.Failure("Ingrese una fecha válida para el ajuste.");

        if (id.HasValue && id.Value != Guid.Empty)
        {
            var existente = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == id.Value, ct);
            if (existente == null)
                return Result<AjusteIdentificadorDto>.Failure("El ajuste no existe.");
            await AsegurarOperacionAsync(existente, false, ct);
            if (existente.Estado != "Borrador")
                return Result<AjusteIdentificadorDto>.Failure("Sólo se pueden editar ajustes en borrador.");

            existente.Actualizar(
                tipo: datos.Tipo ?? "Entrada",
                almacenId: datos.AlmacenId,
                ubicacionId: ubicacion.Id,
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

        var nuevoId = recuperacionId ?? Guid.NewGuid();
        var nombreUsuario = string.IsNullOrWhiteSpace(_user.Email) ? _user.Id.ToString() : _user.Email;

        var nuevo = AjusteInventario.Registrar(
            id: nuevoId,
            numero: numeroAjuste,
            tipo: datos.Tipo ?? "Entrada",
            almacenId: datos.AlmacenId,
            ubicacionId: ubicacion.Id,
            fecha: fechaDate,
            motivo: datos.Motivo,
            documentoReferencia: datos.DocumentoReferencia,
            observaciones: datos.Observaciones,
            totalItems: totalItems,
            totalCantidad: totalCantidad,
            valorTotal: valorTotal,
            lineasJson: lineasJson,
            usuarioId: _user.Id,
            usuarioRegistro: nombreUsuario
        );

        await _context.AjustesInventario.AddAsync(nuevo, ct);
        await _context.SaveChangesAsync(ct);

        return Result<AjusteIdentificadorDto>.Success(new AjusteIdentificadorDto(nuevo.Id, nuevo.Numero));
    }

    public Task<Result<AprobacionAjusteDto>> HandleAsync(SolicitarAprobacionAjusteCommand command, CancellationToken ct = default) =>
        ModificarAsync(command.Id, () => SolicitarAsync(command, ct), ct);

    private async Task<Result<AprobacionAjusteDto>> SolicitarAsync(SolicitarAprobacionAjusteCommand command, CancellationToken ct)
    {
        var ajuste = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == command.Id, ct);
        if (ajuste == null)
            return Result<AprobacionAjusteDto>.Failure("El ajuste no existe.");
        await AsegurarOperacionAsync(ajuste, false, ct);
        if (ajuste.Estado != "Borrador") return Result<AprobacionAjusteDto>.Failure("Sólo se puede enviar a revisión un borrador.");

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

    public Task<Result> HandleAsync(RechazarAjusteCommand command, CancellationToken ct = default) =>
        ModificarAsync(command.Id, () => RechazarAsync(command, ct), ct);

    private async Task<Result> RechazarAsync(RechazarAjusteCommand command, CancellationToken ct)
    {
        var ajuste = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == command.Id, ct);
        if (ajuste == null)
            return Result.Failure("El ajuste no existe.");

        await AsegurarOperacionAsync(ajuste, true, ct);
        if (ajuste.Estado != "EnRevision") return Result.Failure("Sólo se puede observar un ajuste en revisión.");
        ajuste.Observar(command.Motivo);
        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    public Task<Result> HandleAsync(AnularAjusteCommand command, CancellationToken ct = default) =>
        ModificarAsync(command.Id, () => AnularAsync(command, ct), ct);

    private async Task<Result> AnularAsync(AnularAjusteCommand command, CancellationToken ct)
    {
        var ajuste = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == command.Id, ct);
        if (ajuste == null)
            return Result.Failure("El ajuste no existe.");

        await AsegurarOperacionAsync(ajuste, false, ct);
        if (ajuste.Estado == "Aplicado") return Result.Failure("Un ajuste aplicado no puede anularse.");
        ajuste.Anular();
        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    public Task<Result> HandleAsync(EliminarAjusteCommand command, CancellationToken ct = default) =>
        ModificarAsync(command.Id, () => EliminarAsync(command, ct), ct);

    private async Task<Result> EliminarAsync(EliminarAjusteCommand command, CancellationToken ct)
    {
        var ajuste = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == command.Id, ct);
        if (ajuste == null)
            return Result.Failure("El ajuste no existe.");

        if (ajuste.Estado != "Borrador")
            return Result.Failure("Solo se pueden eliminar ajustes en estado Borrador.");
        await AsegurarOperacionAsync(ajuste, false, ct);

        _context.AjustesInventario.Remove(ajuste);
        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(AplicarAjusteCommand command, CancellationToken ct = default)
    {
        if (!_user.IsAuthenticated || _user.Id == Guid.Empty)
            return Result.Failure("Inicie sesión para aplicar el ajuste.");
        try
        {
            return await ModificarAsync(command.Id, () => AplicarAsync(command.Id, ct), ct);
        }
        catch (UnauthorizedAccessException) { throw; }
        catch (InvalidOperationException ex) { return Result.Failure(ex.Message); }
        catch (DbUpdateException) { return Result.Failure("El inventario cambió o una serie ya fue registrada. Actualice y vuelva a revisar el ajuste."); }
    }

    private async Task<Result> AplicarAsync(Guid id, CancellationToken ct)
    {
        var ajuste = await _context.AjustesInventario.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (ajuste == null) return Result.Failure("El ajuste no existe.");
        await AsegurarOperacionAsync(ajuste, true, ct);
        if (ajuste.Estado is not ("Borrador" or "EnRevision"))
            return Result.Failure("El ajuste no está en un estado válido para aplicarse.");

        var ubicacion = await InventarioAcceso.UbicacionAsync(_context, ajuste.AlmacenId, ajuste.UbicacionId, ct);
        if (ubicacion == null) return Result.Failure("La ubicación está inactiva o no pertenece al almacén del ajuste.");
        var lineas = JsonSerializer.Deserialize<List<LineaAjusteItemDto>>(ajuste.LineasJson) ?? [];
        if (lineas.Count == 0 || lineas.Select(l => l.ProductoId).Distinct().Count() != lineas.Count)
            return Result.Failure("Revise las líneas del ajuste: se necesita un registro por producto.");

        var ids = lineas.Select(l => l.ProductoId).ToList();
        var productos = await _context.Productos.Where(p => ids.Contains(p.Id) && p.Activo && p.Tipo == TipoProducto.Inventario).ToDictionaryAsync(p => p.Id, ct);
        if (productos.Count != ids.Count) return Result.Failure("Hay productos inexistentes, inactivos o que no corresponden a inventario.");
        var numeros = lineas.SelectMany(l => l.Series ?? []).Select(s => s?.Trim().ToUpperInvariant() ?? "").ToList();
        if (numeros.Any(s => string.IsNullOrWhiteSpace(s) || s.Length > 100) || numeros.Distinct(StringComparer.OrdinalIgnoreCase).Count() != numeros.Count)
            return Result.Failure("Las series deben ser válidas y únicas en todo el ajuste.");
        var items = await _context.ItemsSeriados.Where(i => numeros.Contains(i.NumeroSerie)).ToDictionaryAsync(i => i.NumeroSerie, ct);
        var stocks = await _context.StocksAlmacen.Where(s => s.UbicacionId == ubicacion.Id && ids.Contains(s.ProductoId) && s.Condicion == CondicionInventario.Utilizable).ToDictionaryAsync(s => s.ProductoId, ct);

        // Validar todas las líneas antes de tocar saldos, series o el estado del documento.
        foreach (var linea in lineas)
        {
            var producto = productos[linea.ProductoId];
            if (linea.Tipo is not ("Entrada" or "Salida") || linea.Cantidad <= 0 || linea.Cantidad > 999999999.99999m || linea.CostoUnitario < 0
                || !ReglasCantidadInventario.EsValida(producto, linea.Cantidad))
                return Result.Failure("Revise el tipo, costo, cantidad y decimales de las líneas.");
            var series = linea.Series ?? [];
            if (producto.EsSerializado && (decimal.Truncate(linea.Cantidad) != linea.Cantidad || series.Count != linea.Cantidad)
                || !producto.EsSerializado && series.Count > 0)
                return Result.Failure("Los productos serializados requieren una serie por unidad entera; los demás no admiten series.");
            if (linea.Tipo == "Salida" && (!stocks.TryGetValue(linea.ProductoId, out var saldo) || saldo.CantidadDisponible < linea.Cantidad))
                return Result.Failure("El stock de la ubicación no alcanza para la salida solicitada.");
            foreach (var numero in series.Select(s => s.Trim().ToUpperInvariant()))
            {
                if (linea.Tipo == "Entrada" && items.TryGetValue(numero, out var itemEntrada))
                {
                    if (itemEntrada.Estado is not (EstadoItemSeriado.DevueltoAProveedor or EstadoItemSeriado.InstaladoEnCliente))
                    {
                        var ubic = itemEntrada.UbicacionActual?.Almacen?.Nombre ?? "otro almacén";
                        return Result.Failure($"La serie '{numero}' ya existe en la empresa y figura actualmente en '{ubic}' con estado {itemEntrada.Estado}. No se puede volver a ingresar.");
                    }
                }
                if (linea.Tipo == "Salida" && (!items.TryGetValue(numero, out var item) || item.ProductoId != linea.ProductoId
                    || item.UbicacionActualId != ubicacion.Id || item.TransferenciaEnTransitoId.HasValue
                    || item.Condicion != CondicionInventario.Utilizable || item.Estado is not (EstadoItemSeriado.EnAlmacen or EstadoItemSeriado.EnCustodiaTecnico)))
                    return Result.Failure("Una serie de salida no está disponible para ese producto en la ubicación del ajuste.");
            }
        }

        foreach (var linea in lineas)
        {
            var entrada = linea.Tipo == "Entrada";
            if (!stocks.TryGetValue(linea.ProductoId, out var stock))
            {
                stock = StockAlmacen.Crear(ubicacion.Id, linea.ProductoId, condicion: CondicionInventario.Utilizable);
                _context.StocksAlmacen.Add(stock);
                stocks.Add(linea.ProductoId, stock);
            }
            if (entrada) stock.AumentarStock(linea.Cantidad); else stock.DisminuirStock(linea.Cantidad);
            var producto = productos[linea.ProductoId];
            if (producto.EsSerializado)
            {
                foreach (var numero in linea.Series.Select(s => s.Trim().ToUpperInvariant()))
                {
                    ItemSeriado item;
                    if (entrada)
                    {
                        if (items.TryGetValue(numero, out var itemExistente))
                        {
                            itemExistente.Ubicar(ubicacion.Id, ubicacion.Almacen.Tipo, CondicionInventario.Utilizable);
                            item = itemExistente;
                        }
                        else
                        {
                            item = ItemSeriado.Crear(linea.ProductoId, numero, ubicacion.Id);
                            item.Ubicar(ubicacion.Id, ubicacion.Almacen.Tipo, CondicionInventario.Utilizable);
                            _context.ItemsSeriados.Add(item);
                        }
                    }
                    else
                    {
                        item = items[numero];
                        item.DarDeBaja($"Ajuste de salida: {ajuste.Motivo}");
                    }
                    RegistrarMovimiento(ajuste, linea, ubicacion.Id, entrada, 1, item.Id);
                }
            }
            else RegistrarMovimiento(ajuste, linea, ubicacion.Id, entrada, linea.Cantidad, null);
        }
        ajuste.Aplicar(string.IsNullOrWhiteSpace(_user.Email) ? _user.Id.ToString() : _user.Email);
        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    private void RegistrarMovimiento(AjusteInventario ajuste, LineaAjusteItemDto linea, Guid ubicacionId, bool entrada, decimal cantidad, Guid? serieId) =>
        _context.MovimientosInventario.Add(MovimientoInventario.Registrar(
            TipoMovimientoInventario.AjusteInventario, linea.ProductoId, cantidad,
            almacenOrigenId: entrada ? null : ajuste.AlmacenId,
            almacenDestinoId: entrada ? ajuste.AlmacenId : null,
            itemSeriadoId: serieId, numeroDocumento: ajuste.Numero, usuarioResponsableId: _user.Id,
            observaciones: $"Ajuste de {(entrada ? "ingreso" : "salida")}: {ajuste.Motivo}",
            ubicacionOrigenId: entrada ? null : ubicacionId,
            ubicacionDestinoId: entrada ? ubicacionId : null, eventoId: ajuste.Id));

    private async Task AsegurarAccesoAsync(Guid almacenId, string accion, CancellationToken ct)
    {
        if (!_user.IsAuthenticated || _user.Id == Guid.Empty || !_user.HasPermission(Permissions.Inventario.Acceso)
            || !await InventarioAcceso.PuedeAsync(_context, _user, almacenId, "consultar", ct)
            || accion != "consultar" && !await InventarioAcceso.PuedeAsync(_context, _user, almacenId, accion, ct))
            throw new UnauthorizedAccessException();
    }

    private async Task AsegurarOperacionAsync(AjusteInventario ajuste, bool aprobar, CancellationToken ct)
    {
        if (!_user.HasPermission(aprobar ? Permissions.Inventario.AjustesAprobar : Permissions.Inventario.Operar))
            throw new UnauthorizedAccessException();
        await AsegurarAccesoAsync(ajuste.AlmacenId, aprobar ? "supervisar" : "consultar", ct);
        if (!await _context.Almacenes.AnyAsync(a => a.Id == ajuste.AlmacenId && a.Activo, ct))
            throw new InvalidOperationException("El almacén está inactivo.");
        if (!aprobar)
            foreach (var tipo in (JsonSerializer.Deserialize<List<LineaAjusteItemDto>>(ajuste.LineasJson) ?? []).Select(l => l.Tipo).Distinct())
                await AsegurarAccesoAsync(ajuste.AlmacenId, tipo == "Entrada" ? "recibir" : "despachar", ct);
    }

    private async Task<T> ModificarAsync<T>(Guid id, Func<Task<T>> accion, CancellationToken ct)
    {
        T resultado = default!;
        await _context.EjecutarConBloqueoAjusteAsync(id, async token =>
        {
            resultado = await accion();
        }, ct);
        return resultado;
    }


    public async Task<Result<List<AjusteInventarioDto>>> HandleAsync(ObtenerAjustesQuery query, CancellationToken ct = default)
    {
        if (!_user.IsAuthenticated || !_user.HasPermission(Permissions.Inventario.Acceso)) throw new UnauthorizedAccessException();
        var almacenes = InventarioAcceso.AlmacenesConsultables(_context, _user);
        var q = _context.AjustesInventario
            .AsNoTracking()
            .Include(a => a.Almacen)
            .Include(a => a.Ubicacion)
            .Where(a => almacenes.Contains(a.AlmacenId));

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
        await AsegurarAccesoAsync(ajuste.AlmacenId, "consultar", ct);

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
