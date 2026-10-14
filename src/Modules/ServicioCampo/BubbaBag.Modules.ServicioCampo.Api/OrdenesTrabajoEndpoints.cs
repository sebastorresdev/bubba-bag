using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class OrdenesTrabajoEndpoints
{
    public static void MapOrdenesTrabajoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/serviciocampo/ordenes")
            .WithTags("Servicio de Campo - Órdenes de Trabajo")
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);

        group.MapGet("/", ObtenerOrdenesTrabajo);
        group.MapGet("/{id:guid}", ObtenerOrdenTrabajoPorId);
        group.MapPost("/", CrearOrdenTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPut("/{id:guid}", ActualizarOrdenTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPatch("/{id:guid}/estado-sistema", CambiarEstadoSistema).RequireAuthorization(Permissions.ServicioCampo.OrdenesAsignar);
        group.MapPost("/{id:guid}/programar", ProgramarOrdenTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesAsignar);
        group.MapDelete("/{id:guid}", EliminarOrdenTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPost("/{id:guid}/trabajos", AgregarTrabajoAOrden).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPut("/{id:guid}/trabajos/{trabajoId:guid}", ActualizarTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPost("/{id:guid}/trabajos/{trabajoId:guid}/completar", CompletarTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesOperarCampo);
        group.MapPut("/{id:guid}/trabajos/{trabajoId:guid}/tareas/{tareaId:guid}", CompletarTarea).RequireAuthorization(Permissions.ServicioCampo.OrdenesOperarCampo);
        group.MapDelete("/{id:guid}/trabajos/{trabajoId:guid}", EliminarTrabajoDeOrden).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
    }

    private static async Task<ListaPrecios> ObtenerLista(Guid? id, IServicioCampoDbContext db, CancellationToken ct)
    {
        var ahora = DateTime.UtcNow;
        var lista = await db.ListasPrecios.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id, ct);
        if (lista == null || !lista.Activo || lista.FechaInicio > ahora || lista.FechaFin < ahora)
            throw new BadHttpRequestException("Seleccione una lista de precios activa y vigente para la orden.");
        return lista;
    }

    private static async Task<Trabajo> PrepararTrabajo(OrdenTrabajo orden, CrearOrdenTrabajoItemRequest item, IServicioCampoDbContext db, CancellationToken ct)
    {
        try { orden.ValidarEditable(); } catch (InvalidOperationException ex) { throw new BadHttpRequestException(ex.Message); }
        var servicio = await db.Productos.AsNoTracking().FirstOrDefaultAsync(p => p.Id == item.ProductoId && p.Activo && p.Tipo == TipoProducto.Servicio, ct);
        if (servicio == null) throw new BadHttpRequestException("Seleccione un servicio activo del catálogo.");
        var lista = await ObtenerLista(orden.ListaPreciosId, db, ct);
        var precio = await db.ElementosListaPrecios.AsNoTracking().FirstOrDefaultAsync(p => p.ListaPreciosId == lista.Id && p.ProductoId == servicio.Id, ct);
        if (precio == null) throw new BadHttpRequestException($"El servicio '{servicio.Nombre}' no tiene precio en la lista '{lista.Nombre}'. Configure su precio, incluso si es cero.");
        if (precio.Monto < 0) throw new BadHttpRequestException("El precio del servicio no puede ser negativo.");
        if (item.TarifaBase.HasValue && item.TarifaBase.Value != precio.Monto)
            throw new BadHttpRequestException("El precio cambió o no coincide con la lista de la orden. Actualice antes de guardar.");
        var configuraciones = db.ConfiguracionesServicio.AsNoTracking()
            .Include(p => p.Tareas).ThenInclude(t => t.Tarea)
            .Include(p => p.Materiales).ThenInclude(m => m.Producto).ThenInclude(p => p.UnidadMedidaDefecto)
            .Include(p => p.Materiales).ThenInclude(m => m.UnidadMedida);
        var configuracion = item.ConfiguracionServicioId.HasValue
            ? await configuraciones.FirstOrDefaultAsync(p => p.Id == item.ConfiguracionServicioId, ct)
            : await configuraciones.SingleOrDefaultAsync(p => p.ProductoId == servicio.Id && p.Activo, ct);
        if (item.ConfiguracionServicioId.HasValue && configuracion == null)
            throw new BadHttpRequestException("La configuración del servicio no existe.");
        if (configuracion != null && (!configuracion.Activo || configuracion.ProductoId != servicio.Id))
            throw new BadHttpRequestException("La configuración debe estar activa y pertenecer al servicio seleccionado.");

        var codigo = string.IsNullOrWhiteSpace(item.CodigoTrabajo)
            ? $"{orden.CodigoWo}-T{orden.Trabajos.Count + 1:D2}"
            : item.CodigoTrabajo.Trim().ToUpperInvariant();

        if (codigo.Length > 50 || orden.Trabajos.Any(t => t.CodigoTrabajo == codigo))
            throw new BadHttpRequestException("El código del trabajo es inválido o está repetido.");

        var trabajo = orden.AgregarTrabajo(codigo, servicio.Id, configuracionServicioId: configuracion?.Id,
            tarifaBase: precio.Monto, observaciones: item.Observaciones, codigoExterno: item.CodigoExterno,
            referenciaEquipo: item.ReferenciaEquipo, origenPrecio: $"Lista: {lista.Nombre}");

        if (configuracion != null) trabajo.AplicarPlantilla(configuracion);
        return trabajo;
    }

    private static async Task<IResult> ActualizarTrabajo(Guid id, Guid trabajoId, ActualizarTrabajoRequest request, IServicioCampoDbContext db, CancellationToken ct)
    {
        var trabajo = await db.Trabajos.Include(t => t.OrdenTrabajo).FirstOrDefaultAsync(t => t.Id == trabajoId && t.OrdenTrabajoId == id, ct);
        if (trabajo == null) return Results.NotFound();
        try { trabajo.OrdenTrabajo.ValidarEditable(); trabajo.ActualizarDatos(request.ReferenciaEquipo, request.Observaciones, request.CodigoExterno); }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> CompletarTarea(Guid id, Guid trabajoId, Guid tareaId, CompletarTareaRequest request, IServicioCampoDbContext db, CancellationToken ct)
    {
        var trabajo = await db.Trabajos.Include(t => t.OrdenTrabajo).Include(t => t.Tareas).FirstOrDefaultAsync(t => t.Id == trabajoId && t.OrdenTrabajoId == id, ct);
        var tarea = trabajo?.Tareas.FirstOrDefault(t => t.Id == tareaId);
        if (trabajo == null || tarea == null) return Results.NotFound();
        try
        {
            trabajo.OrdenTrabajo.ValidarEditable();
            if (trabajo.Estado is not (EstadoTrabajo.Pendiente or EstadoTrabajo.EnProgreso)) return Results.BadRequest(new { message = "El trabajo ya está cerrado." });
            tarea.Completar(request.EvidenciaUrl, request.Observaciones); trabajo.Iniciar();
        }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        await db.SaveChangesAsync(ct); return Results.NoContent();
    }

    private static async Task<IResult> CompletarTrabajo(Guid id, Guid trabajoId, IServicioCampoDbContext db, CancellationToken ct)
    {
        var trabajo = await db.Trabajos.Include(t => t.OrdenTrabajo).Include(t => t.Tareas).FirstOrDefaultAsync(t => t.Id == trabajoId && t.OrdenTrabajoId == id, ct);
        if (trabajo == null) return Results.NotFound();
        try { trabajo.OrdenTrabajo.ValidarEditable(); trabajo.Completar(); }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        await db.SaveChangesAsync(ct); return Results.NoContent();
    }

    private static async Task<IResult> ObtenerOrdenesTrabajo(
        IServicioCampoDbContext db,
        string? search,
        string? estadoSistema,
        Guid? clienteId,
        Guid? zonaOperativaId,
        CancellationToken ct)
    {
        var query = db.OrdenesTrabajo
            .AsNoTracking()
            .Include(o => o.TipoOrden)
            .Include(o => o.ClienteFacturacion)
            .Include(o => o.ClienteServicio)
            .Include(o => o.ZonaOperativa)
            .Include(o => o.Visitas).ThenInclude(v => v.Recurso)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(o =>
                o.CodigoWo.ToLower().Contains(term) ||
                (o.NumeroOrden != null && o.NumeroOrden.ToLower().Contains(term)) ||
                (o.ReferenciaExterna != null && o.ReferenciaExterna.ToLower().Contains(term)) ||
                (o.ClienteFacturacion != null && (
                    o.ClienteFacturacion.RazonSocial!.ToLower().Contains(term) ||
                    o.ClienteFacturacion.Nombres.ToLower().Contains(term)
                )) ||
                (o.ClienteServicio != null && (
                    o.ClienteServicio.RazonSocial!.ToLower().Contains(term) ||
                    o.ClienteServicio.Nombres.ToLower().Contains(term)
                ))
            );
        }

        if (!string.IsNullOrWhiteSpace(estadoSistema) && Enum.TryParse<EstadoSistema>(estadoSistema, true, out var estadoSis))
        {
            query = query.Where(o => o.EstadoSistema == estadoSis);
        }

        if (clienteId.HasValue)
        {
            query = query.Where(o => o.ClienteFacturacionId == clienteId || o.ClienteServicioId == clienteId);
        }

        if (zonaOperativaId.HasValue)
        {
            query = query.Where(o => o.ZonaOperativaId == zonaOperativaId);
        }

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Take(200)
            .ToListAsync(ct);

        var response = items.Select(o =>
        {
            var ultimaVisita = o.Visitas.OrderByDescending(v => v.NumeroVisita).FirstOrDefault();
            var cliFactNombre = o.ClienteFacturacion?.RazonSocial ?? $"{o.ClienteFacturacion?.Nombres} {o.ClienteFacturacion?.Apellidos}".Trim();
            var cliServNombre = o.ClienteServicio?.RazonSocial ?? $"{o.ClienteServicio?.Nombres} {o.ClienteServicio?.Apellidos}".Trim();

            return new OrdenTrabajoListadoItemDto(
                Id: o.Id,
                CodigoWo: o.CodigoWo,
                TipoOrdenId: o.TipoOrdenId,
                TipoOrdenNombre: o.TipoOrden?.Nombre ?? "Servicio General",
                TipoOrdenColor: o.TipoOrden?.ColorHex ?? "#0f6cbd",
                ClienteFacturacionId: o.ClienteFacturacionId,
                ClienteFacturacionNombre: string.IsNullOrWhiteSpace(cliFactNombre) ? "Sin Asignar" : cliFactNombre,
                ClienteServicioId: o.ClienteServicioId,
                ClienteServicioNombre: string.IsNullOrWhiteSpace(cliServNombre) ? "Sin Asignar" : cliServNombre,
                ZonaOperativaId: o.ZonaOperativaId,
                ZonaOperativaNombre: o.ZonaOperativa?.Nombre,
                NumeroOrden: o.NumeroOrden,
                ReferenciaExterna: o.ReferenciaExterna,
                CodigoContrato: o.CodigoContrato,
                NumeroPedido: o.NumeroPedido,
                Estado: o.Estado.ToString(),
                EstadoSistema: o.EstadoSistema.ToString(),
                RecursoTecnicoId: ultimaVisita?.RecursoId,
                RecursoTecnicoNombre: ultimaVisita?.Recurso?.NombreCompleto,
                FechaProgramada: ultimaVisita?.FechaProgramada.ToString("yyyy-MM-dd"),
                BloqueHorario: ultimaVisita?.BloqueHorario,
                DireccionServicio: o.ClienteServicio?.Direccion,
                UbigeoTexto: o.ClienteServicio?.UbigeoCodigo,
                FechaCreacion: o.CreatedAt
            );
        }).ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> ObtenerOrdenTrabajoPorId(
        Guid id,
        IServicioCampoDbContext db,
        CancellationToken ct)
    {
        var orden = await db.OrdenesTrabajo
            .AsNoTracking()
            .Include(o => o.TipoOrden)
            .Include(o => o.ClienteFacturacion)
            .Include(o => o.ClienteServicio)
            .Include(o => o.ZonaOperativa)
            .Include(o => o.Visitas).ThenInclude(v => v.Recurso)
            .Include(o => o.Materiales)
            .Include(o => o.Tareas).ThenInclude(t => t.TipoTarea)
            .Include(o => o.Trabajos).ThenInclude(t => t.Producto)
            .Include(o => o.Trabajos).ThenInclude(t => t.ConfiguracionServicio)
            .Include(o => o.Trabajos).ThenInclude(t => t.Tareas)
            .Include(o => o.Trabajos).ThenInclude(t => t.Materiales).ThenInclude(m => m.Producto)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        var ultimaVisita = orden.Visitas.OrderByDescending(v => v.NumeroVisita).FirstOrDefault();
        var cliFactNombre = orden.ClienteFacturacion?.RazonSocial ?? $"{orden.ClienteFacturacion?.Nombres} {orden.ClienteFacturacion?.Apellidos}".Trim();
        var cliServNombre = orden.ClienteServicio?.RazonSocial ?? $"{orden.ClienteServicio?.Nombres} {orden.ClienteServicio?.Apellidos}".Trim();

        var matProdIds = orden.Materiales.Select(m => m.ProductoId)
            .Concat(orden.Trabajos.SelectMany(t => t.Materiales).Select(m => m.ProductoId))
            .Distinct().ToList();
        var productosDict = await db.Productos.AsNoTracking()
            .Where(p => matProdIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p, ct);

        var materialesList = new List<OrdenTrabajoMaterialDto>();
        // Materiales directos de la orden
        foreach (var m in orden.Materiales)
        {
            productosDict.TryGetValue(m.ProductoId, out var prod);
            materialesList.Add(new OrdenTrabajoMaterialDto(
                Id: m.Id,
                ProductoId: m.ProductoId,
                CodigoProducto: prod?.Codigo ?? "N/A",
                NombreProducto: prod?.Nombre ?? "Artículo",
                Cantidad: m.Cantidad,
                TipoAccion: m.EsRetiro ? "Retiro" : "Instalacion",
                NumeroSerie: m.NumeroSerie,
                Observaciones: m.Observaciones,
                TrabajoCodigo: null
            ));
        }
        // Materiales de cada incidente o trabajo solicitado
        foreach (var trab in orden.Trabajos.OrderBy(t => t.ItemNumero))
        {
            foreach (var mt in trab.Materiales)
            {
                productosDict.TryGetValue(mt.ProductoId, out var prod);
                materialesList.Add(new OrdenTrabajoMaterialDto(
                    Id: mt.Id,
                    ProductoId: mt.ProductoId,
                    CodigoProducto: mt.Producto?.Codigo ?? prod?.Codigo ?? "N/A",
                    NombreProducto: mt.Producto?.Nombre ?? prod?.Nombre ?? "Artículo",
                    Cantidad: mt.CantidadUtilizada > 0 ? mt.CantidadUtilizada : mt.CantidadPrevista,
                    TipoAccion: mt.EsRetiro ? "Retiro" : "Instalacion",
                    NumeroSerie: mt.NumeroSerie,
                    Observaciones: mt.Observaciones ?? $"Trabajo: {trab.CodigoTrabajo}",
                    TrabajoCodigo: trab.CodigoTrabajo
                ));
            }
        }

        var tareasList = new List<OrdenTrabajoTareaDto>();
        // Tareas directas de la orden
        foreach (var t in orden.Tareas)
        {
            tareasList.Add(new OrdenTrabajoTareaDto(
                Id: t.Id,
                NombreTarea: t.TipoTarea?.Nombre ?? t.CodigoTarea,
                EstadoTarea: t.EstadoTarea.ToString(),
                EsObligatoria: true,
                Observaciones: t.Descripcion ?? t.ObservacionesCierre,
                TrabajoCodigo: null
            ));
        }
        // Tareas de cada incidente o trabajo solicitado
        foreach (var trab in orden.Trabajos.OrderBy(t => t.ItemNumero))
        {
            foreach (var tt in trab.Tareas.OrderBy(t => t.OrdenSecuencia))
            {
                tareasList.Add(new OrdenTrabajoTareaDto(
                    Id: tt.Id,
                    NombreTarea: tt.NombreTarea,
                    EstadoTarea: tt.Estado.ToString(),
                    EsObligatoria: tt.EsObligatoria,
                    Observaciones: tt.ObservacionesTecnico ?? $"Trabajo: {trab.CodigoTrabajo}",
                    TrabajoCodigo: trab.CodigoTrabajo
                ));
            }
        }

        var detalle = new OrdenTrabajoDetalleDto(
            ListaPreciosId: orden.ListaPreciosId, Moneda: orden.Moneda,
            Id: orden.Id,
            CodigoWo: orden.CodigoWo,
            TipoOrdenId: orden.TipoOrdenId,
            TipoOrdenNombre: orden.TipoOrden?.Nombre ?? "Servicio General",
            TipoOrdenColor: orden.TipoOrden?.ColorHex ?? "#0f6cbd",
            ClienteFacturacionId: orden.ClienteFacturacionId,
            ClienteFacturacionNombre: string.IsNullOrWhiteSpace(cliFactNombre) ? "Sin Asignar" : cliFactNombre,
            ClienteFacturacionRuc: orden.ClienteFacturacion?.DocumentoIdentidad,
            ClienteServicioId: orden.ClienteServicioId,
            ClienteServicioNombre: string.IsNullOrWhiteSpace(cliServNombre) ? "Sin Asignar" : cliServNombre,
            ClienteServicioDni: orden.ClienteServicio?.DocumentoIdentidad,
            ClienteServicioTelefono: orden.ClienteServicio?.TelefonoPrincipal,
            ClienteServicioEmail: orden.ClienteServicio?.Email,
            ZonaOperativaId: orden.ZonaOperativaId,
            ZonaOperativaNombre: orden.ZonaOperativa?.Nombre,
            NumeroOrden: orden.NumeroOrden,
            ReferenciaExterna: orden.ReferenciaExterna,
            CodigoContrato: orden.CodigoContrato,
            NumeroPedido: orden.NumeroPedido,
            Estado: orden.Estado.ToString(),
            EstadoSistema: orden.EstadoSistema.ToString(),
            ObservacionesCierre: orden.ObservacionesCierre,
            ObservacionesGenerales: orden.ObservacionesGenerales,
            RecursoTecnicoId: ultimaVisita?.RecursoId,
            RecursoTecnicoNombre: ultimaVisita?.Recurso?.NombreCompleto,
            FechaProgramada: ultimaVisita?.FechaProgramada.ToString("yyyy-MM-dd"),
            BloqueHorario: ultimaVisita?.BloqueHorario,
            DireccionServicio: orden.ClienteServicio?.Direccion,
            ReferenciaUbicacion: orden.ClienteServicio?.ReferenciaUbicacion,
            UbigeoTexto: orden.ClienteServicio?.UbigeoCodigo,
            FechaCreacion: orden.CreatedAt,
            Trabajos: orden.Trabajos.OrderBy(t => t.ItemNumero).Select(t => new OrdenTrabajoItemDto(
                Id: t.Id,
                CodigoTrabajo: t.CodigoTrabajo,
                CodigoExterno: t.CodigoExterno,
                ProductoId: t.ProductoId,
                ProductoNombre: t.Producto?.Nombre ?? "Servicio",
                ProductoCodigo: t.Producto?.Codigo,
                ConfiguracionServicioId: t.ConfiguracionServicioId,
                ConfiguracionServicioNombre: t.ConfiguracionServicio?.Nombre,
                ItemNumero: t.ItemNumero,
                Estado: t.Estado.ToString(),
                TarifaBaseCongelada: t.TarifaBaseCongelada,
                ReferenciaEquipo: t.ReferenciaEquipo, OrigenPrecio: t.OrigenPrecio,
                Observaciones: t.Observaciones,
                TotalTareas: t.Tareas.Count,
                TotalMateriales: t.Materiales.Count,
                Tareas: t.Tareas.OrderBy(tt => tt.OrdenSecuencia).Select(tt => new OrdenTrabajoTareaDto(
                    Id: tt.Id,
                    NombreTarea: tt.NombreTarea,
                    EstadoTarea: tt.Estado.ToString(),
                    EsObligatoria: tt.EsObligatoria,
                    Observaciones: tt.ObservacionesTecnico,
                    TrabajoCodigo: t.CodigoTrabajo
                )).ToList(),
                Materiales: t.Materiales.Select(mt => {
                    productosDict.TryGetValue(mt.ProductoId, out var p);
                    return new OrdenTrabajoMaterialDto(
                        Id: mt.Id,
                        ProductoId: mt.ProductoId,
                        CodigoProducto: mt.Producto?.Codigo ?? p?.Codigo ?? "N/A",
                        NombreProducto: mt.Producto?.Nombre ?? p?.Nombre ?? "Artículo",
                        Cantidad: mt.CantidadUtilizada > 0 ? mt.CantidadUtilizada : mt.CantidadPrevista,
                        TipoAccion: mt.EsRetiro ? "Retiro" : "Instalacion",
                        NumeroSerie: mt.NumeroSerie,
                        Observaciones: mt.Observaciones,
                        TrabajoCodigo: t.CodigoTrabajo
                    );
                }).ToList()
            )).ToList(),
            Materiales: materialesList,
            Tareas: tareasList,
            Visitas: orden.Visitas.OrderBy(v => v.NumeroVisita).Select(v => new OrdenTrabajoVisitaDto(
                Id: v.Id,
                CodigoVisita: v.CodigoVisita,
                NumeroVisita: v.NumeroVisita,
                RecursoId: v.RecursoId,
                RecursoNombre: v.Recurso?.NombreCompleto ?? "Técnico",
                FechaProgramada: v.FechaProgramada.ToString("yyyy-MM-dd"),
                BloqueHorario: v.BloqueHorario,
                Estado: v.Estado.ToString()
            )).ToList()
        );

        return Results.Ok(detalle);
    }

    private static async Task<IResult> CrearOrdenTrabajo(
        CrearOrdenTrabajoRequest request,
        IServicioCampoDbContext db,
        ClaimsPrincipal user,
        CancellationToken ct)
    {
        var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid creadoPorId = Guid.TryParse(userIdStr, out var parsedGuid) ? parsedGuid : Guid.NewGuid();

        // Generar CodigoWo si no se envió
        var anioActual = DateTime.UtcNow.Year;
        var codigoWo = request.CodigoWo?.Trim();
        if (string.IsNullOrWhiteSpace(codigoWo))
        {
            var count = await db.OrdenesTrabajo.CountAsync(ct) + 1;
            codigoWo = $"WO-{anioActual}-{count:D6}";
        }

        var tipo = await db.TiposOrdenTrabajo.AsNoTracking().FirstOrDefaultAsync(t => t.Id == request.TipoOrdenId && t.Activo, ct);
        if (tipo == null) return Results.BadRequest(new { message = "Seleccione un tipo de orden activo." });
        var lista = await ObtenerLista(request.ListaPreciosId ?? tipo.ListaPreciosId, db, ct);

        var orden = OrdenTrabajo.Crear(
            codigoWo: codigoWo,
            tipoOrdenId: request.TipoOrdenId,
            creadoPorId: creadoPorId,
            clienteFacturacionId: request.ClienteFacturacionId,
            clienteServicioId: request.ClienteServicioId,
            zonaOperativaId: request.ZonaOperativaId,
            numeroOrden: request.NumeroOrden,
            codigoContrato: request.CodigoContrato,
            numeroPedido: request.NumeroPedido,
            estadoOrigen: request.EstadoOrigen,
            referenciaExterna: request.ReferenciaExterna, listaPreciosId: lista.Id, moneda: lista.Moneda
        );

        foreach (var item in request.Trabajos ?? [])
            await PrepararTrabajo(orden, item, db, ct);

        // Si se especificó recurso y fecha, programar visita inicial
        if (request.RecursoTecnicoId.HasValue && !string.IsNullOrWhiteSpace(request.FechaProgramada) &&
            DateOnly.TryParse(request.FechaProgramada, out var fechaProg))
        {
            orden.ProgramarVisita(
                codigoVisita: $"{orden.CodigoWo}-V1",
                recursoTecnicoId: request.RecursoTecnicoId.Value,
                fechaProgramada: fechaProg,
                bloqueHorario: request.BloqueHorario
            );
        }

        db.OrdenesTrabajo.Add(orden);
        await ((DbContext)db).SaveChangesAsync(ct);

        return Results.Created($"/api/serviciocampo/ordenes/{orden.Id}", new { id = orden.Id, codigoWo = orden.CodigoWo });
    }

    private static async Task<IResult> ActualizarOrdenTrabajo(
        Guid id,
        ActualizarOrdenTrabajoRequest request,
        IServicioCampoDbContext db,
        CancellationToken ct)
    {
        var orden = await db.OrdenesTrabajo
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        if (request.ZonaOperativaId.HasValue)
            orden.AsignarZonaOperativa(request.ZonaOperativaId.Value);

        // Si se envió reprogramación
        if (request.RecursoTecnicoId.HasValue && !string.IsNullOrWhiteSpace(request.FechaProgramada) &&
            DateOnly.TryParse(request.FechaProgramada, out var fechaProg))
        {
            var visitCount = orden.Visitas.Count + 1;
            orden.ProgramarVisita(
                codigoVisita: $"{orden.CodigoWo}-V{visitCount}",
                recursoTecnicoId: request.RecursoTecnicoId.Value,
                fechaProgramada: fechaProg,
                bloqueHorario: request.BloqueHorario
            );
        }

        await ((DbContext)db).SaveChangesAsync(ct);
        return Results.Ok(new { message = "Orden de trabajo actualizada con éxito." });
    }

    private static async Task<IResult> CambiarEstadoSistema(
        Guid id,
        CambiarEstadoSistemaRequest request,
        IServicioCampoDbContext db,
        CancellationToken ct)
    {
        var orden = await db.OrdenesTrabajo
            .Include(o => o.Visitas).Include(o => o.Trabajos)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        if (!Enum.TryParse<EstadoSistema>(request.NuevoEstadoSistema, true, out var nuevoEstadoSis))
            return Results.BadRequest(new { message = $"Estado del sistema inválido: '{request.NuevoEstadoSistema}'." });

        // Si el estado es Programado y no tiene visita, validar o crear una
        if (nuevoEstadoSis == EstadoSistema.Programado && orden.Visitas.Count == 0 && request.RecursoTecnicoId.HasValue &&
            !string.IsNullOrWhiteSpace(request.FechaProgramada) && DateOnly.TryParse(request.FechaProgramada, out var fechaProg))
        {
            orden.ProgramarVisita(
                codigoVisita: $"{orden.CodigoWo}-V1",
                recursoTecnicoId: request.RecursoTecnicoId.Value,
                fechaProgramada: fechaProg,
                bloqueHorario: request.BloqueHorario
            );
        }
        else
        {
            // Transición a través de reflexión o cambio directo de backing fields de EstadoSistema y Estado
            if (nuevoEstadoSis == EstadoSistema.Completado)
            {
                try { orden.ValidarCierreTrabajos(); }
                catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
            }
            typeof(OrdenTrabajo).GetProperty(nameof(OrdenTrabajo.EstadoSistema))?.SetValue(orden, nuevoEstadoSis);
            
            var nuevoEstadoOperativo = nuevoEstadoSis switch
            {
                EstadoSistema.Borrador => EstadoOrdenTrabajo.Pendiente,
                EstadoSistema.PendienteProgramar => EstadoOrdenTrabajo.Pendiente,
                EstadoSistema.Programado => EstadoOrdenTrabajo.Programada,
                EstadoSistema.EnProgreso => EstadoOrdenTrabajo.EnProgreso,
                EstadoSistema.Completado => EstadoOrdenTrabajo.Finalizada,
                EstadoSistema.Cancelado => EstadoOrdenTrabajo.Cancelada,
                _ => orden.Estado
            };
            typeof(OrdenTrabajo).GetProperty(nameof(OrdenTrabajo.Estado))?.SetValue(orden, nuevoEstadoOperativo);
        }

        await ((DbContext)db).SaveChangesAsync(ct);
        return Results.Ok(new { message = $"Estado del sistema actualizado a {nuevoEstadoSis}." });
    }

    private static async Task<IResult> ProgramarOrdenTrabajo(
        Guid id,
        ProgramarOrdenTrabajoRequest request,
        IServicioCampoDbContext db,
        CancellationToken ct)
    {
        var orden = await db.OrdenesTrabajo
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        if (!DateOnly.TryParse(request.FechaProgramada, out var fechaProg))
            return Results.BadRequest(new { message = "Fecha programada inválida." });

        var visitCount = orden.Visitas.Count + 1;
        var visita = orden.ProgramarVisita(
            codigoVisita: $"{orden.CodigoWo}-V{visitCount}",
            recursoTecnicoId: request.RecursoTecnicoId,
            fechaProgramada: fechaProg,
            bloqueHorario: request.BloqueHorario
        );

        await ((DbContext)db).SaveChangesAsync(ct);
        return Results.Ok(new { message = "Visita programada exitosamente.", visitaId = visita.Id });
    }

    private static async Task<IResult> EliminarOrdenTrabajo(
        Guid id,
        IServicioCampoDbContext db,
        CancellationToken ct)
    {
        var orden = await db.OrdenesTrabajo
            .Include(o => o.Visitas)
            .Include(o => o.Materiales)
            .Include(o => o.Tareas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        if (orden.EstadoSistema != EstadoSistema.Borrador && orden.EstadoSistema != EstadoSistema.Cancelado)
            return Results.BadRequest(new { message = "Solo se pueden eliminar órdenes de trabajo en estado Borrador o Cancelado." });

        db.OrdenesTrabajo.Remove(orden);
        await ((DbContext)db).SaveChangesAsync(ct);

        return Results.Ok(new { message = "Orden de trabajo eliminada correctamente." });
    }

    private static async Task<IResult> AgregarTrabajoAOrden(
        Guid id,
        CrearOrdenTrabajoItemRequest request,
        IServicioCampoDbContext db,
        CancellationToken ct)
    {
        var orden = await db.OrdenesTrabajo
            .Include(o => o.Trabajos)
            .Include(o => o.TipoOrden)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        var trabajo = await PrepararTrabajo(orden, request, db, ct);

        db.Trabajos.Add(trabajo);
        await ((DbContext)db).SaveChangesAsync(ct);
        return Results.Created($"/api/serviciocampo/ordenes/{orden.Id}/trabajos/{trabajo.Id}", new { id = trabajo.Id, codigoTrabajo = trabajo.CodigoTrabajo });
    }

    private static async Task<IResult> EliminarTrabajoDeOrden(
        Guid id,
        Guid trabajoId,
        IServicioCampoDbContext db,
        CancellationToken ct)
    {
        var trabajo = await db.Trabajos
            .Include(t => t.Tareas)
            .Include(t => t.Materiales)
            .FirstOrDefaultAsync(t => t.Id == trabajoId && t.OrdenTrabajoId == id, ct);

        if (trabajo == null)
            return Results.NotFound(new { message = $"No se encontró el trabajo con ID {trabajoId} en la orden {id}." });

        if (trabajo.Estado != EstadoTrabajo.Pendiente)
            return Results.BadRequest(new { message = "Solo se pueden eliminar líneas de trabajo en estado Pendiente." });

        db.Trabajos.Remove(trabajo);
        await ((DbContext)db).SaveChangesAsync(ct);
        return Results.Ok(new { message = "Trabajo eliminado exitosamente de la orden." });
    }
}

// =============================================================================
// DTOS & REQUEST MODELS
// =============================================================================

public record OrdenTrabajoListadoItemDto(
    Guid Id,
    string CodigoWo,
    Guid TipoOrdenId,
    string TipoOrdenNombre,
    string TipoOrdenColor,
    Guid ClienteFacturacionId,
    string ClienteFacturacionNombre,
    Guid ClienteServicioId,
    string ClienteServicioNombre,
    Guid? ZonaOperativaId,
    string? ZonaOperativaNombre,
    string? NumeroOrden,
    string? ReferenciaExterna,
    string? CodigoContrato,
    string? NumeroPedido,
    string Estado,
    string EstadoSistema,
    Guid? RecursoTecnicoId,
    string? RecursoTecnicoNombre,
    string? FechaProgramada,
    string? BloqueHorario,
    string? DireccionServicio,
    string? UbigeoTexto,
    DateTime FechaCreacion
);

public record OrdenTrabajoItemDto(
    Guid Id,
    string CodigoTrabajo,
    string? CodigoExterno,
    Guid ProductoId,
    string ProductoNombre,
    string? ProductoCodigo,
    Guid? ConfiguracionServicioId,
    string? ConfiguracionServicioNombre,
    int ItemNumero,
    string Estado,
    decimal TarifaBaseCongelada,
    string? Observaciones,
    int TotalTareas,
    int TotalMateriales,
    List<OrdenTrabajoTareaDto>? Tareas = null,
    List<OrdenTrabajoMaterialDto>? Materiales = null,
    string? ReferenciaEquipo = null,
    string? OrigenPrecio = null
);

public record OrdenTrabajoDetalleDto(
    Guid Id,
    string CodigoWo,
    Guid TipoOrdenId,
    string TipoOrdenNombre,
    string TipoOrdenColor,
    Guid ClienteFacturacionId,
    string ClienteFacturacionNombre,
    string? ClienteFacturacionRuc,
    Guid ClienteServicioId,
    string ClienteServicioNombre,
    string? ClienteServicioDni,
    string? ClienteServicioTelefono,
    string? ClienteServicioEmail,
    Guid? ZonaOperativaId,
    string? ZonaOperativaNombre,
    string? NumeroOrden,
    string? ReferenciaExterna,
    string? CodigoContrato,
    string? NumeroPedido,
    string Estado,
    string EstadoSistema,
    string? ObservacionesCierre,
    string? ObservacionesGenerales,
    Guid? RecursoTecnicoId,
    string? RecursoTecnicoNombre,
    string? FechaProgramada,
    string? BloqueHorario,
    string? DireccionServicio,
    string? ReferenciaUbicacion,
    string? UbigeoTexto,
    DateTime FechaCreacion,
    List<OrdenTrabajoItemDto> Trabajos,
    List<OrdenTrabajoMaterialDto> Materiales,
    List<OrdenTrabajoTareaDto> Tareas,
    List<OrdenTrabajoVisitaDto> Visitas,
    Guid? ListaPreciosId = null,
    string Moneda = "PEN"
);

public record OrdenTrabajoMaterialDto(
    Guid Id,
    Guid ProductoId,
    string CodigoProducto,
    string NombreProducto,
    decimal Cantidad,
    string TipoAccion,
    string? NumeroSerie,
    string? Observaciones,
    string? TrabajoCodigo = null,
    decimal? CantidadPrevista = null,
    decimal? CantidadUtilizada = null,
    string? UnidadMedida = null
);

public record OrdenTrabajoTareaDto(
    Guid Id,
    string NombreTarea,
    string EstadoTarea,
    bool EsObligatoria,
    string? Observaciones,
    string? TrabajoCodigo = null,
    string? Instrucciones = null,
    bool RequiereEvidencia = false,
    string? EvidenciaUrl = null
);

public record OrdenTrabajoVisitaDto(
    Guid Id,
    string CodigoVisita,
    int NumeroVisita,
    Guid RecursoId,
    string RecursoNombre,
    string FechaProgramada,
    string? BloqueHorario,
    string Estado
);

public record CrearOrdenTrabajoItemRequest(
    string? CodigoTrabajo,
    string? CodigoExterno,
    Guid ProductoId,
    Guid? ConfiguracionServicioId,
    decimal? TarifaBase,
    string? Observaciones,
    string? ReferenciaEquipo = null
);

public record CrearOrdenTrabajoRequest(
    string? CodigoWo,
    Guid TipoOrdenId,
    Guid ClienteFacturacionId,
    Guid ClienteServicioId,
    Guid? ZonaOperativaId,
    string? NumeroOrden,
    string? ReferenciaExterna,
    string? CodigoContrato,
    string? NumeroPedido,
    string? EstadoOrigen,
    Guid? RecursoTecnicoId,
    string? FechaProgramada,
    string? BloqueHorario,
    string? Observaciones,
    List<CrearOrdenTrabajoItemRequest>? Trabajos,
    Guid? ListaPreciosId = null
);

public record ActualizarOrdenTrabajoRequest(
    Guid? ZonaOperativaId,
    Guid? RecursoTecnicoId,
    string? FechaProgramada,
    string? BloqueHorario,
    string? Observaciones
);

public record CambiarEstadoSistemaRequest(
    string NuevoEstadoSistema,
    Guid? RecursoTecnicoId,
    string? FechaProgramada,
    string? BloqueHorario
);

public record ProgramarOrdenTrabajoRequest(
    Guid RecursoTecnicoId,
    string FechaProgramada,
    string? BloqueHorario
);

public record ActualizarTrabajoRequest(string? ReferenciaEquipo, string? Observaciones, string? CodigoExterno);
public record CompletarTareaRequest(string? EvidenciaUrl, string? Observaciones);
