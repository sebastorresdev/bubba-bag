using ProgrammingCar.Modules.ServicioCampo.Application.OrdenesTrabajo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Application;
using ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Enums;
using ProgrammingCar.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using ProgrammingCar.Modules.ServicioCampo.Domain.Plantillas;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;
using ProgrammingCar.Modules.ServicioCampo.Infrastructure.Services;
using ProgrammingCar.SharedKernel.Authorization;
using ProgrammingCar.SharedKernel;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Api;

public static class OrdenesTrabajoEndpoints
{
    public static void MapOrdenesTrabajoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/serviciocampo/ordenes")
            .WithTags("Servicio de Campo - Órdenes de Trabajo")
            .RequireAuthorization(Permissions.ServicioCampo.Acceso).AddEndpointFilter<OrdenMutationFilter>();

        group.MapGet("/", ObtenerOrdenesTrabajo);
        group.MapGet("/trabajos", ObtenerListadoTrabajos);
        app.MapGet("/api/serviciocampo/trabajos", ObtenerListadoTrabajos)
            .WithTags("Servicio de Campo - Trabajos")
            .RequireAuthorization(Permissions.ServicioCampo.Acceso);
        group.MapGet("/{id:guid}", ObtenerOrdenTrabajoPorId);
        group.MapPost("/", CrearOrdenTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPut("/{id:guid}", ActualizarOrdenTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPatch("/{id:guid}/estado-sistema", CambiarEstadoSistema);
        group.MapPost("/{id:guid}/programar", ProgramarOrdenTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesAsignar);
        group.MapDelete("/{id:guid}", EliminarOrdenTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPost("/{id:guid}/trabajos", AgregarTrabajoAOrden).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPut("/{id:guid}/trabajos/{trabajoId:guid}", ActualizarTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPost("/{id:guid}/trabajos/{trabajoId:guid}/completar", CompletarTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesOperarCampo);
        group.MapPost("/{id:guid}/trabajos/{trabajoId:guid}/cancelar", CancelarTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPost("/{id:guid}/trabajos/{trabajoId:guid}/rechazar", RechazarTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPost("/{id:guid}/trabajos/cancelar-batch", CancelarTrabajosBatch).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPost("/{id:guid}/trabajos/rechazar-batch", RechazarTrabajosBatch).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapPut("/{id:guid}/trabajos/{trabajoId:guid}/tareas/{tareaId:guid}", CompletarTarea).RequireAuthorization(Permissions.ServicioCampo.OrdenesOperarCampo);
        group.MapDelete("/{id:guid}/trabajos/{trabajoId:guid}", EliminarTrabajoDeOrden).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear);
        group.MapGet("/{id:guid}/acta-pdf", GenerarActaServicioPdf);
        group.MapPost("/{id:guid}/liquidar", LiquidarOrdenTrabajo).RequireAuthorization(Permissions.ServicioCampo.OrdenesOperarCampo);
        group.MapPost("/{id:guid}/visitas/{visitaId:guid}/reprogramar", ReprogramarVisita).RequireAuthorization(Permissions.ServicioCampo.OrdenesAsignar);
        group.MapPost("/{id:guid}/visitas/{visitaId:guid}/cancelar", CancelarVisita).RequireAuthorization(Permissions.ServicioCampo.OrdenesAsignar);
        group.MapPost("/importar-siebel", ImportarOrdenesSiebel).RequireAuthorization(Permissions.ServicioCampo.OrdenesCrear).DisableAntiforgery();
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
            .Include(p => p.Servicios)
            .Include(p => p.Tareas).ThenInclude(t => t.Tarea)
            .Include(p => p.Materiales).ThenInclude(m => m.Producto).ThenInclude(p => p.UnidadMedidaDefecto)
            .Include(p => p.Materiales).ThenInclude(m => m.UnidadMedida);
        var configuracion = item.ConfiguracionServicioId.HasValue
            ? await configuraciones.FirstOrDefaultAsync(p => p.Id == item.ConfiguracionServicioId, ct)
            : await configuraciones.FirstOrDefaultAsync(p => (p.ProductoId == servicio.Id || p.Servicios.Any(s => s.ProductoId == servicio.Id)) && p.Activo, ct);
        if (item.ConfiguracionServicioId.HasValue && configuracion == null)
            throw new BadHttpRequestException("La configuración del servicio no existe.");
        if (configuracion != null && (!configuracion.Activo || (configuracion.ProductoId != servicio.Id && !configuracion.Servicios.Any(s => s.ProductoId == servicio.Id))))
            throw new BadHttpRequestException("La configuración debe estar activa y pertenecer al servicio seleccionado.");

        var codigo = string.IsNullOrWhiteSpace(item.CodigoTrabajo)
            ? $"{orden.CodigoWo}-T{orden.Trabajos.Count + 1:D2}"
            : item.CodigoTrabajo.Trim().ToUpperInvariant();

        if (codigo.Length > 50 || orden.Trabajos.Any(t => t.CodigoTrabajo == codigo))
            throw new BadHttpRequestException("El código del trabajo es inválido o está repetido.");

        var puntosTrabajo = item.Puntos ?? configuracion?.Puntos ?? 1.0m;
        var trabajo = orden.AgregarTrabajo(codigo, servicio.Id, configuracionServicioId: configuracion?.Id,
            tarifaBase: precio.Monto, observaciones: item.Observaciones, codigoExterno: item.CodigoExterno,
            referenciaEquipo: item.ReferenciaEquipo, origenPrecio: $"Lista: {lista.Nombre}", puntos: puntosTrabajo);

        if (configuracion != null) trabajo.AplicarPlantilla(configuracion);
        if (item.Puntos.HasValue && item.Puntos.Value > 0) trabajo.ActualizarPuntos(item.Puntos.Value);
        return trabajo;
    }

    private static async Task<IResult> ActualizarTrabajo(Guid id, Guid trabajoId, ActualizarTrabajoRequest request, IServicioCampoDbContext db, ICurrentUser currentUser, CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var trabajo = await db.Trabajos.Include(t => t.OrdenTrabajo).FirstOrDefaultAsync(t => t.Id == trabajoId && t.OrdenTrabajoId == id, ct);
        if (trabajo == null) return Results.NotFound();
        try { trabajo.OrdenTrabajo.ValidarEditable(); trabajo.ActualizarDatos(request.ReferenciaEquipo, request.Observaciones, request.CodigoExterno); }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> CompletarTarea(Guid id, Guid trabajoId, Guid tareaId, CompletarTareaRequest request, IServicioCampoDbContext db, ICurrentUser currentUser, CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

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

    private static async Task<IResult> CompletarTrabajo(Guid id, Guid trabajoId, IServicioCampoDbContext db, ICurrentUser currentUser, CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var trabajo = await db.Trabajos.Include(t => t.OrdenTrabajo).Include(t => t.Tareas).FirstOrDefaultAsync(t => t.Id == trabajoId && t.OrdenTrabajoId == id, ct);
        if (trabajo == null) return Results.NotFound();
        try { trabajo.OrdenTrabajo.ValidarEditable(); trabajo.Completar(); }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        await db.SaveChangesAsync(ct); return Results.NoContent();
    }

    private static async Task<IResult> CancelarTrabajo(
        Guid id,
        Guid trabajoId,
        CancelarTrabajoRequest? request,
        IServicioCampoDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var orden = await db.OrdenesTrabajo
            .Include(o => o.Trabajos)
                .ThenInclude(t => t.Tareas)
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        var trabajo = orden.Trabajos.FirstOrDefault(t => t.Id == trabajoId);
        if (trabajo == null)
            return Results.NotFound(new { message = $"No se encontró el trabajo con ID {trabajoId}." });

        try
        {
            orden.ValidarEditable();
            trabajo.Cancelar(request?.Motivo);
            orden.SincronizarEstadoDesdeTrabajos(request?.Motivo);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }

        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> RechazarTrabajo(
        Guid id,
        Guid trabajoId,
        RechazarTrabajoRequest request,
        IServicioCampoDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var orden = await db.OrdenesTrabajo
            .Include(o => o.Trabajos)
                .ThenInclude(t => t.Tareas)
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        if (string.IsNullOrWhiteSpace(request?.Motivo))
            return Results.BadRequest(new { message = "El motivo de rechazo es obligatorio." });

        var trabajo = orden.Trabajos.FirstOrDefault(t => t.Id == trabajoId);
        if (trabajo == null)
            return Results.NotFound(new { message = $"No se encontró el trabajo con ID {trabajoId}." });

        try
        {
            orden.ValidarEditable();
            trabajo.Rechazar(request.Motivo);
            orden.SincronizarEstadoDesdeTrabajos(request.Motivo);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }

        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> CancelarTrabajosBatch(
        Guid id,
        BatchEstadoTrabajosRequest request,
        IServicioCampoDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        if (request?.TrabajoIds == null || request.TrabajoIds.Count == 0)
            return Results.BadRequest(new { message = "Debe proporcionar al menos un ID de trabajo." });

        var orden = await db.OrdenesTrabajo
            .Include(o => o.Trabajos)
                .ThenInclude(t => t.Tareas)
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        try
        {
            orden.ValidarEditable();
            foreach (var tId in request.TrabajoIds)
            {
                var trabajo = orden.Trabajos.FirstOrDefault(t => t.Id == tId);
                if (trabajo != null && (trabajo.Estado == EstadoTrabajo.Pendiente || trabajo.Estado == EstadoTrabajo.EnProgreso))
                {
                    trabajo.Cancelar(request.Motivo);
                }
            }
            orden.SincronizarEstadoDesdeTrabajos(request.Motivo);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }

        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> RechazarTrabajosBatch(
        Guid id,
        BatchEstadoTrabajosRequest request,
        IServicioCampoDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        if (request?.TrabajoIds == null || request.TrabajoIds.Count == 0)
            return Results.BadRequest(new { message = "Debe proporcionar al menos un ID de trabajo." });

        if (string.IsNullOrWhiteSpace(request.Motivo))
            return Results.BadRequest(new { message = "El motivo de rechazo es obligatorio." });

        var orden = await db.OrdenesTrabajo
            .Include(o => o.Trabajos)
                .ThenInclude(t => t.Tareas)
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        try
        {
            orden.ValidarEditable();
            foreach (var tId in request.TrabajoIds)
            {
                var trabajo = orden.Trabajos.FirstOrDefault(t => t.Id == tId);
                if (trabajo != null && (trabajo.Estado == EstadoTrabajo.Pendiente || trabajo.Estado == EstadoTrabajo.EnProgreso))
                {
                    trabajo.Rechazar(request.Motivo);
                }
            }
            orden.SincronizarEstadoDesdeTrabajos(request.Motivo);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }

        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> ObtenerOrdenesTrabajo(
        IServicioCampoDbContext db, ICurrentUser currentUser,
        string? search,
        string? estadoSistema,
        string? vista,
        Guid? clienteId,
        Guid? zonaOperativaId,
        Guid? unidadOrganizativaId,
        CancellationToken ct)
    {
        var query = OrdenesAcceso.Consultables(db, currentUser)
            .AsNoTracking()
            .Include(o => o.TipoOrden)
            .Include(o => o.ClienteFacturacion)
            .Include(o => o.ClienteServicio)
            .Include(o => o.UnidadOrganizativa)
            .Include(o => o.ZonaOperativa)
            .Include(o => o.Visitas).ThenInclude(v => v.Recurso)
            .Include(o => o.Trabajos)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(o =>
                o.CodigoWo.ToLower().Contains(term) ||
                (o.NumeroOrden != null && o.NumeroOrden.ToLower().Contains(term)) ||
                (o.ReferenciaExterna != null && o.ReferenciaExterna.ToLower().Contains(term)) ||
                (o.CodigoContrato != null && o.CodigoContrato.ToLower().Contains(term)) ||
                (o.NumeroPedido != null && o.NumeroPedido.ToLower().Contains(term)) ||
                (o.ClienteFacturacion != null && (
                    (o.ClienteFacturacion.RazonSocial != null && o.ClienteFacturacion.RazonSocial.ToLower().Contains(term)) ||
                    o.ClienteFacturacion.Nombres.ToLower().Contains(term) ||
                    o.ClienteFacturacion.CodigoCliente.ToLower().Contains(term) ||
                    (o.ClienteFacturacion.CodigoExterno != null && o.ClienteFacturacion.CodigoExterno.ToLower().Contains(term)) ||
                    (o.ClienteFacturacion.DocumentoIdentidad != null && o.ClienteFacturacion.DocumentoIdentidad.ToLower().Contains(term))
                )) ||
                (o.ClienteServicio != null && (
                    (o.ClienteServicio.RazonSocial != null && o.ClienteServicio.RazonSocial.ToLower().Contains(term)) ||
                    o.ClienteServicio.Nombres.ToLower().Contains(term) ||
                    o.ClienteServicio.CodigoCliente.ToLower().Contains(term) ||
                    (o.ClienteServicio.CodigoExterno != null && o.ClienteServicio.CodigoExterno.ToLower().Contains(term)) ||
                    (o.ClienteServicio.DocumentoIdentidad != null && o.ClienteServicio.DocumentoIdentidad.ToLower().Contains(term)) ||
                    (o.ClienteServicio.TelefonoPrincipal != null && o.ClienteServicio.TelefonoPrincipal.ToLower().Contains(term))
                )) ||
                o.Trabajos.Any(t => t.CodigoExterno != null && t.CodigoExterno.ToLower().Contains(term))
            );
        }

        var vistaNormalizada = (vista ?? string.Empty).Trim().ToLowerInvariant();

        if (vistaNormalizada == "finalizadas_mes")
        {
            var limiteMes = DateTime.UtcNow.AddDays(-30);
            query = query.Where(o => (o.EstadoSistema == EstadoSistema.Completado || o.EstadoSistema == EstadoSistema.Cancelado)
                && ((o.UpdatedAt ?? o.CreatedAt) >= limiteMes));
        }
        else if (vistaNormalizada == "finalizadas_3meses" || vistaNormalizada == "finalizadas_trimestre")
        {
            var limite3Meses = DateTime.UtcNow.AddDays(-90);
            query = query.Where(o => (o.EstadoSistema == EstadoSistema.Completado || o.EstadoSistema == EstadoSistema.Cancelado)
                && ((o.UpdatedAt ?? o.CreatedAt) >= limite3Meses));
        }
        else if (vistaNormalizada == "programadas")
        {
            query = query.Where(o => o.EstadoSistema == EstadoSistema.Programado);
        }
        else if (vistaNormalizada == "pendientes" || vistaNormalizada == "sin_programar")
        {
            query = query.Where(o => o.EstadoSistema == EstadoSistema.PendienteProgramar);
        }
        else if (vistaNormalizada == "en_progreso")
        {
            query = query.Where(o => o.EstadoSistema == EstadoSistema.EnProgreso);
        }
        else if (vistaNormalizada == "borrador")
        {
            query = query.Where(o => o.EstadoSistema == EstadoSistema.Borrador);
        }
        else if (!string.IsNullOrWhiteSpace(estadoSistema) && Enum.TryParse<EstadoSistema>(estadoSistema, true, out var estadoSis))
        {
            query = query.Where(o => o.EstadoSistema == estadoSis);
            if (estadoSis is EstadoSistema.Completado or EstadoSistema.Cancelado)
            {
                var limiteMaximo = DateTime.UtcNow.AddDays(-90);
                query = query.Where(o => (o.UpdatedAt ?? o.CreatedAt) >= limiteMaximo);
            }
        }
        else
        {
            // Vista por defecto ('activas' o sin especificar):
            // Solo órdenes operables / pendientes que se pueden trabajar (NO finalizadas)
            query = query.Where(o => o.EstadoSistema != EstadoSistema.Completado && o.EstadoSistema != EstadoSistema.Cancelado);
        }

        if (clienteId.HasValue)
        {
            query = query.Where(o => o.ClienteFacturacionId == clienteId || o.ClienteServicioId == clienteId);
        }

        if (unidadOrganizativaId.HasValue)
        {
            query = query.Where(o => o.UnidadOrganizativaId == unidadOrganizativaId || (o.UnidadOrganizativaId == null && o.ZonaOperativa != null && o.ZonaOperativa.SucursalId == unidadOrganizativaId));
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

            var primerTrabajoCodExt = o.Trabajos.FirstOrDefault(t => !string.IsNullOrWhiteSpace(t.CodigoExterno))?.CodigoExterno;

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
                FechaCreacion: o.CreatedAt,
                UnidadOrganizativaId: o.UnidadOrganizativaId ?? o.ZonaOperativa?.SucursalId,
                UnidadOrganizativaNombre: o.UnidadOrganizativa?.Nombre,
                TotalPuntos: o.TotalPuntos,
                ClienteServicioCodigo: o.ClienteServicio?.CodigoCliente,
                ClienteServicioCodigoExterno: o.ClienteServicio?.CodigoExterno ?? o.CodigoContrato,
                CodigoExternoTrabajo: primerTrabajoCodExt ?? o.ReferenciaExterna
            );
        }).ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> ObtenerListadoTrabajos(
        IServicioCampoDbContext db, ICurrentUser currentUser,
        string? search,
        string? estado,
        string? estadoSistemaOrden,
        string? vista,
        Guid? clienteId,
        Guid? recursoId,
        Guid? productoId,
        Guid? zonaOperativaId,
        Guid? unidadOrganizativaId,
        CancellationToken ct)
    {
        var ordenesConsultablesIds = OrdenesAcceso.Consultables(db, currentUser).Select(o => o.Id);

        var query = db.Trabajos
            .AsNoTracking()
            .Where(t => ordenesConsultablesIds.Contains(t.OrdenTrabajoId))
            .Include(t => t.Producto)
            .Include(t => t.ConfiguracionServicio)
            .Include(t => t.Tareas)
            .Include(t => t.Materiales)
            .Include(t => t.OrdenTrabajo).ThenInclude(o => o.TipoOrden)
            .Include(t => t.OrdenTrabajo).ThenInclude(o => o.ClienteFacturacion)
            .Include(t => t.OrdenTrabajo).ThenInclude(o => o.ClienteServicio)
            .Include(t => t.OrdenTrabajo).ThenInclude(o => o.UnidadOrganizativa)
            .Include(t => t.OrdenTrabajo).ThenInclude(o => o.ZonaOperativa)
            .Include(t => t.OrdenTrabajo).ThenInclude(o => o.Visitas).ThenInclude(v => v.Recurso)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(t =>
                t.CodigoTrabajo.ToLower().Contains(term) ||
                (t.CodigoExterno != null && t.CodigoExterno.ToLower().Contains(term)) ||
                (t.ReferenciaEquipo != null && t.ReferenciaEquipo.ToLower().Contains(term)) ||
                t.Producto.Nombre.ToLower().Contains(term) ||
                t.Producto.Codigo.ToLower().Contains(term) ||
                t.OrdenTrabajo.CodigoWo.ToLower().Contains(term) ||
                (t.OrdenTrabajo.NumeroOrden != null && t.OrdenTrabajo.NumeroOrden.ToLower().Contains(term)) ||
                (t.OrdenTrabajo.ReferenciaExterna != null && t.OrdenTrabajo.ReferenciaExterna.ToLower().Contains(term)) ||
                (t.OrdenTrabajo.CodigoContrato != null && t.OrdenTrabajo.CodigoContrato.ToLower().Contains(term)) ||
                (t.OrdenTrabajo.ClienteServicio != null && (
                    (t.OrdenTrabajo.ClienteServicio.RazonSocial != null && t.OrdenTrabajo.ClienteServicio.RazonSocial.ToLower().Contains(term)) ||
                    t.OrdenTrabajo.ClienteServicio.Nombres.ToLower().Contains(term) ||
                    t.OrdenTrabajo.ClienteServicio.CodigoCliente.ToLower().Contains(term) ||
                    (t.OrdenTrabajo.ClienteServicio.CodigoExterno != null && t.OrdenTrabajo.ClienteServicio.CodigoExterno.ToLower().Contains(term)) ||
                    (t.OrdenTrabajo.ClienteServicio.DocumentoIdentidad != null && t.OrdenTrabajo.ClienteServicio.DocumentoIdentidad.ToLower().Contains(term))
                ))
            );
        }

        var vistaTrabajoNormalizada = (vista ?? string.Empty).Trim().ToLowerInvariant();

        if (vistaTrabajoNormalizada == "finalizadas_mes" || vistaTrabajoNormalizada == "finalizados_mes")
        {
            var limiteMes = DateTime.UtcNow.AddDays(-30);
            query = query.Where(t => (t.Estado == EstadoTrabajo.Completado || t.Estado == EstadoTrabajo.Cancelado || t.Estado == EstadoTrabajo.Rechazado)
                && ((t.FechaFin ?? t.CreatedAt) >= limiteMes));
        }
        else if (vistaTrabajoNormalizada == "finalizadas_3meses" || vistaTrabajoNormalizada == "finalizados_3meses")
        {
            var limite3Meses = DateTime.UtcNow.AddDays(-90);
            query = query.Where(t => (t.Estado == EstadoTrabajo.Completado || t.Estado == EstadoTrabajo.Cancelado || t.Estado == EstadoTrabajo.Rechazado)
                && ((t.FechaFin ?? t.CreatedAt) >= limite3Meses));
        }
        else if (vistaTrabajoNormalizada == "pendientes")
        {
            query = query.Where(t => t.Estado == EstadoTrabajo.Pendiente
                && t.OrdenTrabajo.EstadoSistema != EstadoSistema.Completado
                && t.OrdenTrabajo.EstadoSistema != EstadoSistema.Cancelado);
        }
        else if (vistaTrabajoNormalizada == "en_progreso")
        {
            query = query.Where(t => t.Estado == EstadoTrabajo.EnProgreso);
        }
        else if (!string.IsNullOrWhiteSpace(estado) && Enum.TryParse<EstadoTrabajo>(estado, true, out var estadoTrab))
        {
            query = query.Where(t => t.Estado == estadoTrab);
            if (estadoTrab is EstadoTrabajo.Completado or EstadoTrabajo.Cancelado or EstadoTrabajo.Rechazado)
            {
                var limiteMaximo = DateTime.UtcNow.AddDays(-90);
                query = query.Where(t => (t.FechaFin ?? t.CreatedAt) >= limiteMaximo);
            }
        }
        else
        {
            // Vista por defecto: Solo trabajos activos / pendientes no finalizados y cuya orden no esté cerrada/cancelada
            query = query.Where(t => (t.Estado == EstadoTrabajo.Pendiente || t.Estado == EstadoTrabajo.EnProgreso)
                && t.OrdenTrabajo.EstadoSistema != EstadoSistema.Completado
                && t.OrdenTrabajo.EstadoSistema != EstadoSistema.Cancelado);
        }

        if (!string.IsNullOrWhiteSpace(estadoSistemaOrden) && Enum.TryParse<EstadoSistema>(estadoSistemaOrden, true, out var estSis))
        {
            query = query.Where(t => t.OrdenTrabajo.EstadoSistema == estSis);
        }

        if (productoId.HasValue)
        {
            query = query.Where(t => t.ProductoId == productoId.Value);
        }

        if (clienteId.HasValue)
        {
            query = query.Where(t => t.OrdenTrabajo.ClienteFacturacionId == clienteId || t.OrdenTrabajo.ClienteServicioId == clienteId);
        }

        if (unidadOrganizativaId.HasValue)
        {
            query = query.Where(t => t.OrdenTrabajo.UnidadOrganizativaId == unidadOrganizativaId ||
                (t.OrdenTrabajo.UnidadOrganizativaId == null && t.OrdenTrabajo.ZonaOperativa != null && t.OrdenTrabajo.ZonaOperativa.SucursalId == unidadOrganizativaId));
        }

        if (zonaOperativaId.HasValue)
        {
            query = query.Where(t => t.OrdenTrabajo.ZonaOperativaId == zonaOperativaId);
        }

        if (recursoId.HasValue)
        {
            query = query.Where(t => t.OrdenTrabajo.Visitas.Any(v => v.RecursoId == recursoId.Value));
        }

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Take(300)
            .ToListAsync(ct);

        var response = items.Select(t =>
        {
            var o = t.OrdenTrabajo;
            var ultimaVisita = o.Visitas.OrderByDescending(v => v.NumeroVisita).FirstOrDefault();
            var cliFactNombre = o.ClienteFacturacion?.RazonSocial ?? $"{o.ClienteFacturacion?.Nombres} {o.ClienteFacturacion?.Apellidos}".Trim();
            var cliServNombre = o.ClienteServicio?.RazonSocial ?? $"{o.ClienteServicio?.Nombres} {o.ClienteServicio?.Apellidos}".Trim();

            return new TrabajoListadoItemDto(
                Id: t.Id,
                OrdenTrabajoId: o.Id,
                CodigoTrabajo: t.CodigoTrabajo,
                CodigoExterno: t.CodigoExterno,
                CodigoWo: o.CodigoWo,
                NumeroOrden: o.NumeroOrden,
                CodigoContrato: o.CodigoContrato,
                ProductoId: t.ProductoId,
                ProductoCodigo: t.Producto?.Codigo ?? "",
                ProductoNombre: t.Producto?.Nombre ?? "Servicio",
                Estado: t.Estado.ToString(),
                EstadoSistemaOrden: o.EstadoSistema.ToString(),
                TipoOrdenNombre: o.TipoOrden?.Nombre ?? "Servicio General",
                TipoOrdenColor: o.TipoOrden?.ColorHex ?? "#0f6cbd",
                ClienteFacturacionNombre: string.IsNullOrWhiteSpace(cliFactNombre) ? "Sin Asignar" : cliFactNombre,
                ClienteServicioNombre: string.IsNullOrWhiteSpace(cliServNombre) ? "Sin Asignar" : cliServNombre,
                ClienteServicioCodigo: o.ClienteServicio?.CodigoCliente,
                ClienteServicioDireccion: o.ClienteServicio?.Direccion,
                RecursoTecnicoId: ultimaVisita?.RecursoId,
                RecursoTecnicoNombre: ultimaVisita?.Recurso?.NombreCompleto,
                FechaProgramada: ultimaVisita?.FechaProgramada.ToString("yyyy-MM-dd"),
                BloqueHorario: ultimaVisita?.BloqueHorario,
                Puntos: t.Puntos,
                TarifaBase: t.TarifaBaseCongelada,
                FechaInicio: t.FechaInicio,
                FechaFin: t.FechaFin,
                UnidadOrganizativaNombre: o.UnidadOrganizativa?.Nombre,
                ZonaOperativaNombre: o.ZonaOperativa?.Nombre,
                CantidadTareas: t.Tareas.Count,
                CantidadTareasCompletadas: t.Tareas.Count(x => x.Estado == EstadoTarea.Completa),
                CantidadMateriales: t.Materiales.Count,
                FechaCreacion: t.CreatedAt
            );
        }).ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> ObtenerOrdenTrabajoPorId(
        Guid id,
        IServicioCampoDbContext db, ICurrentUser currentUser,
        CancellationToken ct)
    {
        var orden = await OrdenesAcceso.Consultables(db, currentUser)
            .AsNoTracking()
            .Include(o => o.TipoOrden)
            .Include(o => o.ClienteFacturacion)
            .Include(o => o.ClienteServicio)
            .Include(o => o.UnidadOrganizativa)
            .Include(o => o.ZonaOperativa)
            .Include(o => o.Visitas).ThenInclude(v => v.Recurso)
            .Include(o => o.Trabajos)
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
            ListaPreciosId: orden.ListaPreciosId, Moneda: orden.Moneda, Version: orden.Version,
            TotalPuntos: orden.TotalPuntos,
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
                Puntos: t.Puntos,
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
            )).ToList(),
            UnidadOrganizativaId: orden.UnidadOrganizativaId ?? orden.ZonaOperativa?.SucursalId,
            UnidadOrganizativaNombre: orden.UnidadOrganizativa?.Nombre
        );

        return Results.Ok(detalle);
    }

    private static async Task<IResult> CrearOrdenTrabajo(
        CrearOrdenTrabajoRequest request,
        IServicioCampoDbContext db, ICurrentUser currentUser,
        ICodigoSecuencialService codigoService,
        CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || currentUser.Id == Guid.Empty) return Results.Unauthorized();
        if (request.RecursoTecnicoId.HasValue && !currentUser.HasPermission(Permissions.ServicioCampo.OrdenesAsignar)) return Results.Forbid();
        Guid creadoPorId = currentUser.Id;

        // Soporte de integración directa con CRM externo: buscar o crear Cliente en línea si no se envía ClienteServicioId
        var clienteServicioId = request.ClienteServicioId;
        var clienteFacturacionId = request.ClienteFacturacionId;

        if (clienteServicioId == Guid.Empty && request.DatosCliente is not null)
        {
            var dc = request.DatosCliente;
            if (string.IsNullOrWhiteSpace(dc.NombreCuenta))
                return Results.BadRequest(new { message = "Debe especificar el nombre del cliente en DatosCliente.NombreCuenta." });

            ProgrammingCar.Modules.ServicioCampo.Domain.Clientes.Cliente? clienteExistente = null;
            if (!string.IsNullOrWhiteSpace(dc.CodigoExterno))
            {
                var codExt = dc.CodigoExterno.Trim();
                clienteExistente = await db.Clientes.FirstOrDefaultAsync(c => c.CodigoExterno == codExt, ct);
            }
            if (clienteExistente == null && !string.IsNullOrWhiteSpace(dc.DocumentoIdentidad))
            {
                var docId = dc.DocumentoIdentidad.Trim();
                clienteExistente = await db.Clientes.FirstOrDefaultAsync(c => c.DocumentoIdentidad == docId, ct);
            }

            if (clienteExistente != null)
            {
                clienteExistente.ActualizarContactoYDireccion(
                    telefono: dc.TelefonoPrincipal ?? clienteExistente.TelefonoPrincipal,
                    direccion: dc.Direccion ?? clienteExistente.Direccion,
                    ubigeoCodigo: dc.UbigeoCodigo ?? clienteExistente.UbigeoCodigo,
                    referencia: dc.ReferenciaUbicacion ?? clienteExistente.ReferenciaUbicacion,
                    lat: dc.CoordenadaLat ?? clienteExistente.CoordenadaLat,
                    lng: dc.CoordenadaLng ?? clienteExistente.CoordenadaLng,
                    nombreCuenta: dc.NombreCuenta.Trim(),
                    documentoIdentidad: dc.DocumentoIdentidad ?? clienteExistente.DocumentoIdentidad,
                    telefonoSecundario: clienteExistente.TelefonoSecundario,
                    email: dc.Email ?? clienteExistente.Email,
                    contactoPrincipalId: clienteExistente.ContactoPrincipalId,
                    codigoExterno: dc.CodigoExterno ?? clienteExistente.CodigoExterno
                );
                clienteServicioId = clienteExistente.Id;
            }
            else
            {
                var codigoCli = await codigoService.SiguienteCodigoAsync(
                    prefijo: "CLI",
                    nombreSecuencia: "seq_clientes",
                    esquema: "crm",
                    longitud: 6,
                    cancellationToken: ct);

                var docNorm = (dc.DocumentoIdentidad ?? string.Empty).Trim();
                var esFacturacion = docNorm.Length == 11 && docNorm.StartsWith("20");

                var nuevoCliente = ProgrammingCar.Modules.ServicioCampo.Domain.Clientes.Cliente.Crear(
                    codigoCliente: codigoCli,
                    documentoIdentidad: string.IsNullOrWhiteSpace(docNorm) ? codigoCli : docNorm,
                    nombres: dc.NombreCuenta.Trim(),
                    apellidos: null,
                    telefonoPrincipal: dc.TelefonoPrincipal ?? string.Empty,
                    direccion: dc.Direccion ?? string.Empty,
                    ubigeoCodigo: string.IsNullOrWhiteSpace(dc.UbigeoCodigo) ? "150101" : dc.UbigeoCodigo.Trim(),
                    esClienteFacturacion: esFacturacion,
                    esClienteServicio: true,
                    razonSocial: dc.NombreCuenta.Trim(),
                    email: dc.Email,
                    referencia: dc.ReferenciaUbicacion,
                    lat: dc.CoordenadaLat,
                    lng: dc.CoordenadaLng,
                    codigoExterno: dc.CodigoExterno
                );
                db.Clientes.Add(nuevoCliente);
                clienteServicioId = nuevoCliente.Id;
            }
        }

        if (clienteServicioId == Guid.Empty)
            return Results.BadRequest(new { message = "Debe seleccionar un Cliente Receptor (Abonado) o enviar DatosCliente." });

        if (clienteFacturacionId == Guid.Empty)
            clienteFacturacionId = clienteServicioId;

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

        // Resolver Unidad Organizativa / Sede de la orden (directa o derivada del territorio)
        var unidadOrgId = request.UnidadOrganizativaId;
        if (!unidadOrgId.HasValue && request.ZonaOperativaId.HasValue)
        {
            var zo = await db.ZonasOperativas.AsNoTracking().FirstOrDefaultAsync(z => z.Id == request.ZonaOperativaId.Value, ct);
            unidadOrgId = zo?.SucursalId;
        }

        // Validación estricta: Si se asigna un técnico de campo, debe pertenecer a la misma Unidad Organizativa (Sede)
        if (request.RecursoTecnicoId.HasValue)
        {
            var recurso = await db.Recursos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == request.RecursoTecnicoId.Value, ct);
            if (recurso != null && unidadOrgId.HasValue && recurso.UnidadOrganizativaId.HasValue && recurso.UnidadOrganizativaId != unidadOrgId)
            {
                return Results.BadRequest(new { message = "El técnico seleccionado no pertenece a la unidad organizativa (sede) asignada a la orden de trabajo." });
            }
        }

        var codigoContrato = !string.IsNullOrWhiteSpace(request.CodigoContrato)
            ? request.CodigoContrato
            : request.DatosCliente?.CodigoExterno;

        var orden = OrdenTrabajo.Crear(
            codigoWo: codigoWo,
            tipoOrdenId: request.TipoOrdenId,
            creadoPorId: creadoPorId,
            clienteFacturacionId: clienteFacturacionId,
            clienteServicioId: clienteServicioId,
            zonaOperativaId: request.ZonaOperativaId,
            numeroOrden: request.NumeroOrden,
            codigoContrato: codigoContrato,
            numeroPedido: request.NumeroPedido,
            estadoOrigen: request.EstadoOrigen,
            referenciaExterna: request.ReferenciaExterna, listaPreciosId: lista.Id, moneda: lista.Moneda,
            unidadOrganizativaId: unidadOrgId
        );

        foreach (var item in request.Trabajos ?? [])
            await PrepararTrabajo(orden, item, db, ct);

        orden.ActualizarObservaciones(request.Observaciones);
        // Si se especificó recurso y fecha, programar visita inicial
        if (request.RecursoTecnicoId.HasValue && !string.IsNullOrWhiteSpace(request.FechaProgramada) &&
            DateOnly.TryParse(request.FechaProgramada, out var fechaProg))
        {
            var nuevaVisita = orden.ProgramarVisita(
                codigoVisita: $"{orden.CodigoWo}-V1",
                recursoTecnicoId: request.RecursoTecnicoId.Value,
                fechaProgramada: fechaProg,
                bloqueHorario: request.BloqueHorario
            );
            ((DbContext)db).Entry(nuevaVisita).State = EntityState.Added;
        }

        db.OrdenesTrabajo.Add(orden);
        await ((DbContext)db).SaveChangesAsync(ct);

        return Results.Created($"/api/serviciocampo/ordenes/{orden.Id}", new { id = orden.Id, codigoWo = orden.CodigoWo });
    }

    private static async Task<IResult> ActualizarOrdenTrabajo(
        Guid id,
        ActualizarOrdenTrabajoRequest request,
        IServicioCampoDbContext db, ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);
        if (request.RecursoTecnicoId.HasValue && !currentUser.HasPermission(Permissions.ServicioCampo.OrdenesAsignar)) return Results.Forbid();

        var orden = await db.OrdenesTrabajo
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        try
        {
            orden.ValidarEditable();
            if (request.Observaciones != null) orden.ActualizarObservaciones(request.Observaciones);
        }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }

        if (request.UnidadOrganizativaId.HasValue)
            orden.AsignarUnidadOrganizativa(request.UnidadOrganizativaId.Value);

        if (request.ZonaOperativaId.HasValue)
            orden.AsignarZonaOperativa(request.ZonaOperativaId.Value);

        // Si se envió reprogramación
        if (request.RecursoTecnicoId.HasValue && !string.IsNullOrWhiteSpace(request.FechaProgramada) &&
            DateOnly.TryParse(request.FechaProgramada, out var fechaProg))
        {
            var recurso = await db.Recursos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == request.RecursoTecnicoId.Value, ct);
            if (recurso == null || !recurso.Activo)
                return Results.BadRequest(new { message = "El técnico seleccionado no existe o está inactivo." });
            if (orden.UnidadOrganizativaId.HasValue && recurso.UnidadOrganizativaId.HasValue && recurso.UnidadOrganizativaId != orden.UnidadOrganizativaId)
                return Results.BadRequest(new { message = "El técnico seleccionado no pertenece a la unidad organizativa (sede) de la orden de trabajo." });

            var visitCount = orden.Visitas.Count + 1;
            var nuevaVisita = orden.ProgramarVisita(
                codigoVisita: $"{orden.CodigoWo}-V{visitCount}",
                recursoTecnicoId: request.RecursoTecnicoId.Value,
                fechaProgramada: fechaProg,
                bloqueHorario: request.BloqueHorario
            );
            ((DbContext)db).Entry(nuevaVisita).State = EntityState.Added;
        }

        await ((DbContext)db).SaveChangesAsync(ct);
        return Results.Ok(new { message = "Orden de trabajo actualizada con éxito." });
    }

    private static async Task<IResult> CambiarEstadoSistema(
        Guid id,
        CambiarEstadoSistemaRequest request,
        IServicioCampoDbContext db, ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var orden = await db.OrdenesTrabajo
            .Include(o => o.TipoOrden).Include(o => o.Visitas).ThenInclude(v => v.Evidencias).Include(o => o.Trabajos).ThenInclude(t => t.Tareas).Include(o => o.Tareas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        if (!Enum.TryParse<EstadoSistema>(request.NuevoEstadoSistema, true, out var nuevoEstadoSis) || !Enum.IsDefined(nuevoEstadoSis))
            return Results.BadRequest(new { message = $"Estado del sistema inválido: '{request.NuevoEstadoSistema}'." });
        var permisoEstado = nuevoEstadoSis is EstadoSistema.Completado or EstadoSistema.Cancelado
            ? Permissions.ServicioCampo.OrdenesCerrar : Permissions.ServicioCampo.OrdenesAsignar;
        if (!currentUser.HasPermission(permisoEstado)) return Results.Forbid();

        try
        {
            orden.ValidarEditable();
            if (nuevoEstadoSis == EstadoSistema.Programado && orden.Visitas.Count == 0)
            {
                if (orden.EstadoSistema != EstadoSistema.PendienteProgramar || !request.RecursoTecnicoId.HasValue
                    || !DateOnly.TryParse(request.FechaProgramada, out var fechaProg))
                    return Results.BadRequest(new { message = "Seleccione técnico y fecha para programar la orden." });
                var recurso = await db.Recursos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == request.RecursoTecnicoId && r.Activo, ct);
                if (recurso == null)
                    return Results.BadRequest(new { message = "El técnico seleccionado no existe o está inactivo." });
                if (orden.UnidadOrganizativaId.HasValue && recurso.UnidadOrganizativaId.HasValue && recurso.UnidadOrganizativaId != orden.UnidadOrganizativaId)
                    return Results.BadRequest(new { message = "El técnico seleccionado no pertenece a la unidad organizativa (sede) de la orden de trabajo." });
                var visita = orden.ProgramarVisita($"{orden.CodigoWo}-V1", request.RecursoTecnicoId.Value, fechaProg, request.BloqueHorario);
                ((DbContext)db).Entry(visita).State = EntityState.Added;
            }
            else orden.CambiarEstadoSistema(nuevoEstadoSis, request.MotivoId, request.Observaciones);
        }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        await ((DbContext)db).SaveChangesAsync(ct);
        return Results.Ok(new { message = $"Estado del sistema actualizado a {nuevoEstadoSis}." });
    }

    private static async Task<IResult> ProgramarOrdenTrabajo(
        Guid id,
        ProgramarOrdenTrabajoRequest request,
        IServicioCampoDbContext db, ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var orden = await db.OrdenesTrabajo
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        if (!DateOnly.TryParse(request.FechaProgramada, out var fechaProg))
            return Results.BadRequest(new { message = "Fecha programada inválida." });

        var recurso = await db.Recursos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == request.RecursoTecnicoId && r.Activo, ct);
        if (recurso == null)
            return Results.BadRequest(new { message = "El técnico seleccionado no existe o está inactivo." });
        if (orden.UnidadOrganizativaId.HasValue && recurso.UnidadOrganizativaId.HasValue && recurso.UnidadOrganizativaId != orden.UnidadOrganizativaId)
            return Results.BadRequest(new { message = "El técnico seleccionado no pertenece a la unidad organizativa (sede) de la orden de trabajo." });

        var visitCount = orden.Visitas.Count + 1;
        var visita = orden.ProgramarVisita(
            codigoVisita: $"{orden.CodigoWo}-V{visitCount}",
            recursoTecnicoId: request.RecursoTecnicoId,
            fechaProgramada: fechaProg,
            bloqueHorario: request.BloqueHorario
        );

        ((DbContext)db).Entry(visita).State = EntityState.Added;
        await ((DbContext)db).SaveChangesAsync(ct);
        return Results.Ok(new { message = "Visita programada exitosamente.", visitaId = visita.Id });
    }

    private static async Task<IResult> EliminarOrdenTrabajo(
        Guid id,
        IServicioCampoDbContext db, ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

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
        IServicioCampoDbContext db, ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

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
        IServicioCampoDbContext db, ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        return Results.BadRequest(new { message = "Una vez creado, un trabajo no puede eliminarse; debe cancelarse o rechazarse para mantener la trazabilidad operativa." });
    }

    private static async Task<IResult> GenerarActaServicioPdf(
        Guid id,
        IServicioCampoDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var orden = await db.OrdenesTrabajo
            .Include(o => o.TipoOrden)
            .Include(o => o.ClienteServicio).ThenInclude(c => c.Ubigeo)
            .Include(o => o.ClienteFacturacion)
            .Include(o => o.ZonaOperativa)
            .Include(o => o.Visitas).ThenInclude(v => v.Recurso)
            .Include(o => o.Trabajos)
            .Include(o => o.Visitas).ThenInclude(v => v.Evidencias)
            .Include(o => o.Trabajos).ThenInclude(t => t.Producto)
            .Include(o => o.Trabajos).ThenInclude(t => t.Tareas).ThenInclude(tt => tt.Tarea)
            .Include(o => o.Trabajos).ThenInclude(t => t.Materiales).ThenInclude(m => m.Producto)
            .Include(o => o.Materiales)
            .Include(o => o.LiquidacionesMaterial).ThenInclude(l => l.Items).ThenInclude(i => i.Producto)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        var empresa = await db.ConfiguracionEmpresas.AsNoTracking().FirstOrDefaultAsync(ct);
        var pdfBytes = ActaServicioPdfGenerator.GenerarActa(orden, empresa);

        return Results.File(pdfBytes, "application/pdf", $"Acta-Servicio-{orden.CodigoWo}.pdf");
    }

    private static async Task<IResult> LiquidarOrdenTrabajo(
        Guid id,
        LiquidarOrdenTrabajoRequest request,
        IServicioCampoDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var orden = await db.OrdenesTrabajo
            .Include(o => o.Visitas).ThenInclude(v => v.Recurso)
            .Include(o => o.Trabajos)
            .Include(o => o.Trabajos).ThenInclude(t => t.Materiales)
            .Include(o => o.Trabajos).ThenInclude(t => t.Tareas)
            .Include(o => o.Materiales)
            .Include(o => o.LiquidacionesMaterial).ThenInclude(l => l.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        orden.ValidarEditable();

        if (orden.Estado != EstadoOrdenTrabajo.Completa && orden.EstadoSistema != EstadoSistema.Completado)
            return Results.BadRequest(new { message = "Solo se pueden liquidar materiales cuando la labor técnica en campo ha sido completada." });

        if (orden.DescargaMaterialesConfirmada)
            return Results.BadRequest(new { message = "Los materiales de esta orden ya han sido liquidados previamente." });

        // 1. Determinar el almacén de descarga (Móvil del técnico o provisto)
        Almacen? almacen = null;
        if (request.AlmacenId.HasValue && request.AlmacenId.Value != Guid.Empty)
        {
            almacen = await db.Almacenes.FirstOrDefaultAsync(a => a.Id == request.AlmacenId.Value && a.Activo, ct);
            if (almacen == null)
                return Results.BadRequest(new { message = "El almacén indicado no existe o está inactivo." });
        }
        else
        {
            var ultimaVisita = orden.Visitas.OrderByDescending(v => v.NumeroVisita).FirstOrDefault();
            if (ultimaVisita == null)
                return Results.BadRequest(new { message = "La orden no tiene visitas programadas ni técnico asignado para identificar el almacén móvil de descarga." });

            almacen = await db.Almacenes.FirstOrDefaultAsync(a => a.RecursoId == ultimaVisita.RecursoId && a.Tipo == TipoAlmacen.CustodiaPersonal && a.Activo, ct);
            if (almacen == null)
            {
                return Results.BadRequest(new { message = "No se encontró un almacén de custodia móvil activo para el técnico asignado. Indique el almacén de descarga manualmente." });
            }
        }

        // 2. Ubicación principal del almacén
        var ubicacion = await db.UbicacionesInventario.FirstOrDefaultAsync(u => u.AlmacenId == almacen.Id && u.Activa, ct);
        if (ubicacion == null)
        {
            ubicacion = UbicacionInventario.Crear(almacen.Id, "DISPONIBLE", "Disponible", true, TipoUbicacion.Disponible);
            db.UbicacionesInventario.Add(ubicacion);
            await ((DbContext)db).SaveChangesAsync(ct);
        }

        var liqNumero = $"LIQ-{orden.CodigoWo}";
        var liquidacion = orden.GenerarLiquidacionMaterial(liqNumero, almacen.Id, currentUser.Id, request.Observaciones);

        // 3. Procesar consumos
        if (request.Consumos != null && request.Consumos.Count > 0)
        {
            foreach (var c in request.Consumos)
            {
                var prod = await db.Productos.FirstOrDefaultAsync(p => p.Id == c.ProductoId && p.Activo, ct);
                if (prod == null || prod.Tipo != TipoProducto.Inventario)
                    return Results.BadRequest(new { message = $"El producto con ID {c.ProductoId} no es un artículo de inventario válido." });

                if (prod.EsSerializado)
                {
                    if (string.IsNullOrWhiteSpace(c.NumeroSerie))
                        return Results.BadRequest(new { message = $"El producto '{prod.Nombre}' es serializado y requiere especificar el número de serie instalado." });

                    var serieNorm = c.NumeroSerie.Trim().ToUpperInvariant();
                    var itemSerie = await db.ItemsSeriados.FirstOrDefaultAsync(s => s.ProductoId == prod.Id && s.NumeroSerie == serieNorm, ct);

                    if (itemSerie == null)
                        return Results.BadRequest(new { message = $"La serie '{serieNorm}' del producto '{prod.Nombre}' no existe en el sistema." });

                    if (itemSerie.Estado != EstadoItemSeriado.EnCustodiaTecnico && itemSerie.Estado != EstadoItemSeriado.EnAlmacen)
                        return Results.BadRequest(new { message = $"La serie '{serieNorm}' no está disponible para instalación (Estado: {itemSerie.Estado})." });

                    if (itemSerie.UbicacionActualId != ubicacion.Id)
                        return Results.BadRequest(new { message = $"La serie '{serieNorm}' no se encuentra en el almacén '{almacen.Nombre}' (Ubicación actual no coincide)." });

                    itemSerie.InstalarEnCliente(orden.ClienteServicioId, orden.Id);

                    var stock = await db.StocksAlmacen.FirstOrDefaultAsync(s => s.UbicacionId == ubicacion.Id && s.ProductoId == prod.Id && s.Condicion == CondicionInventario.Utilizable, ct);
                    if (stock == null || stock.CantidadDisponible < 1m)
                        return Results.BadRequest(new { message = $"Stock insuficiente para '{prod.Nombre}' en almacén '{almacen.Nombre}'. Saldo disponible: {stock?.CantidadDisponible ?? 0}." });

                    stock.DisminuirStock(1m);

                    var movKardex = MovimientoInventario.Registrar(
                        TipoMovimientoInventario.ConsumoEnOrdenTrabajo,
                        prod.Id,
                        1m,
                        almacenOrigenId: almacen.Id,
                        itemSeriadoId: itemSerie.Id,
                        clienteId: orden.ClienteServicioId,
                        ordenTrabajoId: orden.Id,
                        numeroDocumento: orden.CodigoWo,
                        usuarioResponsableId: currentUser.Id,
                        observaciones: $"Instalación serie {serieNorm} en OT {orden.CodigoWo}",
                        ubicacionOrigenId: ubicacion.Id,
                        condicion: CondicionInventario.Utilizable
                    );
                    db.MovimientosInventario.Add(movKardex);

                    liquidacion.AgregarItem(prod.Id, 1m, 0m, esSeriado: true, itemSeriadoId: itemSerie.Id, numeroSerie: serieNorm, esRetiro: false, observaciones: c.Observaciones);
                    orden.RegistrarMaterialConsumido(prod.Id, 1m, itemSerie.Id, serieNorm, null, null, c.Observaciones);
                }
                else
                {
                    if (c.Cantidad <= 0)
                        return Results.BadRequest(new { message = $"La cantidad a consumir para '{prod.Nombre}' debe ser mayor a cero." });

                    if (!ReglasCantidadInventario.EsValida(prod, c.Cantidad))
                        return Results.BadRequest(new { message = $"La cantidad '{c.Cantidad}' para '{prod.Nombre}' no cumple con las reglas de precisión e inventario." });

                    var stock = await db.StocksAlmacen.FirstOrDefaultAsync(s => s.UbicacionId == ubicacion.Id && s.ProductoId == prod.Id && s.Condicion == CondicionInventario.Utilizable, ct);
                    if (stock == null || stock.CantidadDisponible < c.Cantidad)
                        return Results.BadRequest(new { message = $"Stock insuficiente para '{prod.Nombre}' en almacén '{almacen.Nombre}'. Saldo disponible: {stock?.CantidadDisponible ?? 0}, solicitado: {c.Cantidad}." });

                    stock.DisminuirStock(c.Cantidad);

                    var movKardex = MovimientoInventario.Registrar(
                        TipoMovimientoInventario.ConsumoEnOrdenTrabajo,
                        prod.Id,
                        c.Cantidad,
                        almacenOrigenId: almacen.Id,
                        clienteId: orden.ClienteServicioId,
                        ordenTrabajoId: orden.Id,
                        numeroDocumento: orden.CodigoWo,
                        usuarioResponsableId: currentUser.Id,
                        observaciones: $"Consumo en OT {orden.CodigoWo}: {c.Observaciones}",
                        ubicacionOrigenId: ubicacion.Id,
                        condicion: CondicionInventario.Utilizable
                    );
                    db.MovimientosInventario.Add(movKardex);

                    liquidacion.AgregarItem(prod.Id, c.Cantidad, 0m, esSeriado: false, esRetiro: false, observaciones: c.Observaciones);
                    orden.RegistrarMaterialConsumido(prod.Id, c.Cantidad, null, null, null, null, c.Observaciones);
                }
            }
        }
        else
        {
            liquidacion.ConsolidarDesdeOrden(orden);
            foreach (var itemLiq in liquidacion.Items.Where(i => !i.EsRetiro))
            {
                var prod = await db.Productos.FirstOrDefaultAsync(p => p.Id == itemLiq.ProductoId, ct);
                if (prod == null) continue;

                if (itemLiq.EsSeriado && !string.IsNullOrWhiteSpace(itemLiq.NumeroSerie))
                {
                    var serieNorm = itemLiq.NumeroSerie.Trim().ToUpperInvariant();
                    var itemSerie = await db.ItemsSeriados.FirstOrDefaultAsync(s => s.ProductoId == prod.Id && s.NumeroSerie == serieNorm, ct);
                    if (itemSerie != null)
                    {
                        itemSerie.InstalarEnCliente(orden.ClienteServicioId, orden.Id);
                    }

                    var stock = await db.StocksAlmacen.FirstOrDefaultAsync(s => s.UbicacionId == ubicacion.Id && s.ProductoId == prod.Id && s.Condicion == CondicionInventario.Utilizable, ct);
                    if (stock != null && stock.CantidadDisponible >= 1m)
                    {
                        stock.DisminuirStock(1m);
                    }

                    var mov = MovimientoInventario.Registrar(
                        TipoMovimientoInventario.ConsumoEnOrdenTrabajo,
                        prod.Id,
                        1m,
                        almacenOrigenId: almacen.Id,
                        itemSeriadoId: itemSerie?.Id,
                        clienteId: orden.ClienteServicioId,
                        ordenTrabajoId: orden.Id,
                        numeroDocumento: orden.CodigoWo,
                        usuarioResponsableId: currentUser.Id,
                        observaciones: $"Consumo automático OT {orden.CodigoWo}",
                        ubicacionOrigenId: ubicacion.Id,
                        condicion: CondicionInventario.Utilizable
                    );
                    db.MovimientosInventario.Add(mov);
                }
                else if (!itemLiq.EsSeriado && itemLiq.CantidadConsumida > 0)
                {
                    var stock = await db.StocksAlmacen.FirstOrDefaultAsync(s => s.UbicacionId == ubicacion.Id && s.ProductoId == prod.Id && s.Condicion == CondicionInventario.Utilizable, ct);
                    if (stock == null || stock.CantidadDisponible < itemLiq.CantidadConsumida)
                        return Results.BadRequest(new { message = $"Stock insuficiente para consolidar '{prod.Nombre}' en almacén '{almacen.Nombre}'. Saldo: {stock?.CantidadDisponible ?? 0}, requerido: {itemLiq.CantidadConsumida}." });

                    stock.DisminuirStock(itemLiq.CantidadConsumida);

                    var mov = MovimientoInventario.Registrar(
                        TipoMovimientoInventario.ConsumoEnOrdenTrabajo,
                        prod.Id,
                        itemLiq.CantidadConsumida,
                        almacenOrigenId: almacen.Id,
                        clienteId: orden.ClienteServicioId,
                        ordenTrabajoId: orden.Id,
                        numeroDocumento: orden.CodigoWo,
                        usuarioResponsableId: currentUser.Id,
                        observaciones: $"Consumo automático OT {orden.CodigoWo}",
                        ubicacionOrigenId: ubicacion.Id,
                        condicion: CondicionInventario.Utilizable
                    );
                    db.MovimientosInventario.Add(mov);
                }
            }
        }

        // 4. Procesar equipos retirados / chatarra / averiados
        if (request.Retiros != null && request.Retiros.Count > 0)
        {
            foreach (var r in request.Retiros)
            {
                if (string.IsNullOrWhiteSpace(r.NumeroSerie))
                    return Results.BadRequest(new { message = "Cada equipo retirado requiere especificar su número de serie." });

                var serieNorm = r.NumeroSerie.Trim().ToUpperInvariant();
                var prod = await db.Productos.FirstOrDefaultAsync(p => p.Id == r.ProductoId && p.Activo, ct);
                if (prod == null)
                    return Results.BadRequest(new { message = $"El equipo con ID {r.ProductoId} no es un producto válido." });

                var itemSerie = await db.ItemsSeriados.FirstOrDefaultAsync(s => s.ProductoId == prod.Id && s.NumeroSerie == serieNorm, ct);
                if (itemSerie != null)
                {
                    itemSerie.RetirarPorAveria(ubicacion.Id, orden.ClienteServicioId, orden.Id, r.Motivo);
                }
                else
                {
                    itemSerie = ItemSeriado.Crear(prod.Id, serieNorm, ubicacion.Id, observaciones: $"Retiro en OT {orden.CodigoWo}: {r.Motivo}");
                    itemSerie.RetirarPorAveria(ubicacion.Id, orden.ClienteServicioId, orden.Id, r.Motivo);
                    db.ItemsSeriados.Add(itemSerie);
                }

                var stockDef = await db.StocksAlmacen.FirstOrDefaultAsync(s => s.UbicacionId == ubicacion.Id && s.ProductoId == prod.Id && s.Condicion == CondicionInventario.Defectuoso, ct);
                if (stockDef == null)
                {
                    stockDef = StockAlmacen.Crear(ubicacion.Id, prod.Id, 1m, CondicionInventario.Defectuoso);
                    db.StocksAlmacen.Add(stockDef);
                }
                else
                {
                    stockDef.AumentarStock(1m);
                }

                var movRetiro = MovimientoInventario.Registrar(
                    TipoMovimientoInventario.RetiroEnOrdenTrabajo,
                    prod.Id,
                    1m,
                    almacenDestinoId: almacen.Id,
                    itemSeriadoId: itemSerie.Id,
                    clienteId: orden.ClienteServicioId,
                    ordenTrabajoId: orden.Id,
                    numeroDocumento: orden.CodigoWo,
                    usuarioResponsableId: currentUser.Id,
                    observaciones: $"Retiro equipo averiado/chatarra OT {orden.CodigoWo}: {r.Motivo}",
                    ubicacionDestinoId: ubicacion.Id,
                    condicion: CondicionInventario.Defectuoso
                );
                db.MovimientosInventario.Add(movRetiro);

                liquidacion.AgregarItem(prod.Id, 0m, 1m, esSeriado: true, itemSeriadoId: itemSerie.Id, numeroSerie: serieNorm, esRetiro: true, observaciones: r.Motivo);
                orden.RegistrarEquipoRetirado(prod.Id, serieNorm, itemSerie.Id, null, null, r.Motivo);
            }
        }

        // 5. Confirmar Liquidación y verificar promoción a Finalizada
        orden.ConfirmarLiquidacionMateriales(liquidacion.Id, request.Observaciones);
        orden.VerificarPromocionAFinalizada();

        await ((DbContext)db).SaveChangesAsync(ct);

        return Results.Ok(new
        {
            message = "Liquidación de materiales procesada y confirmada exitosamente.",
            numeroLiquidacion = liquidacion.NumeroLiquidacion,
            almacen = almacen.Nombre,
            estadoOrden = orden.Estado.ToString(),
            estadoSistema = orden.EstadoSistema.ToString()
        });
    }

    private static async Task<IResult> ReprogramarVisita(
        Guid id,
        Guid visitaId,
        ReprogramarVisitaRequest request,
        IServicioCampoDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var orden = await db.OrdenesTrabajo
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        orden.ValidarEditable();

        var visitaActual = orden.Visitas.FirstOrDefault(v => v.Id == visitaId);
        if (visitaActual == null)
            return Results.NotFound(new { message = $"No se encontró la visita con ID {visitaId} en esta orden." });

        if (visitaActual.Estado == EstadoVisita.Completada)
            return Results.BadRequest(new { message = "No se puede reprogramar una visita que ya ha sido completada." });

        if (!DateOnly.TryParse(request.FechaProgramada, out var nuevaFecha))
            return Results.BadRequest(new { message = "La nueva fecha programada no es válida." });

        var recursoId = request.RecursoTecnicoId ?? visitaActual.RecursoId;
        var recurso = await db.Recursos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == recursoId && r.Activo, ct);
        if (recurso == null)
            return Results.BadRequest(new { message = "El técnico seleccionado no existe o está inactivo." });
        if (orden.UnidadOrganizativaId.HasValue && recurso.UnidadOrganizativaId.HasValue && recurso.UnidadOrganizativaId != orden.UnidadOrganizativaId)
            return Results.BadRequest(new { message = "El técnico seleccionado no pertenece a la unidad organizativa (sede) de la orden de trabajo." });

        visitaActual.CancelarVisita(request.MotivoId, $"Reprogramada: {request.Observaciones}");

        var visitCount = orden.Visitas.Count + 1;
        var nuevaVisita = orden.ProgramarVisita(
            codigoVisita: $"{orden.CodigoWo}-V{visitCount}",
            recursoTecnicoId: recursoId,
            fechaProgramada: nuevaFecha,
            bloqueHorario: request.BloqueHorario
        );
        ((DbContext)db).Entry(nuevaVisita).State = EntityState.Added;

        await ((DbContext)db).SaveChangesAsync(ct);

        return Results.Ok(new
        {
            message = "Visita reprogramada exitosamente.",
            nuevaVisitaId = nuevaVisita.Id,
            codigoVisita = nuevaVisita.CodigoVisita,
            fechaProgramada = nuevaFecha.ToString("yyyy-MM-dd")
        });
    }

    private static async Task<IResult> CancelarVisita(
        Guid id,
        Guid visitaId,
        CancelarVisitaRequest request,
        IServicioCampoDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        await OrdenesAcceso.ExigirAsync(db, currentUser, id, ct);

        var orden = await db.OrdenesTrabajo
            .Include(o => o.Visitas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
            return Results.NotFound(new { message = $"No se encontró la orden de trabajo con ID {id}." });

        orden.ValidarEditable();

        var visita = orden.Visitas.FirstOrDefault(v => v.Id == visitaId);
        if (visita == null)
            return Results.NotFound(new { message = $"No se encontró la visita con ID {visitaId} en esta orden." });

        if (visita.Estado == EstadoVisita.Completada)
            return Results.BadRequest(new { message = "No se puede cancelar una visita que ya ha sido completada." });

        orden.NotificarVisitaCancelada(visitaId, request.MotivoId, request.Observaciones);

        await ((DbContext)db).SaveChangesAsync(ct);

        return Results.Ok(new
        {
            message = "Visita cancelada exitosamente.",
            estadoOrden = orden.Estado.ToString(),
            estadoSistema = orden.EstadoSistema.ToString()
        });
    }

    private static async Task<IResult> ImportarOrdenesSiebel(
        HttpRequest httpRequest,
        SiebelImportadorService importador,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        Stream? fileStream = null;
        try
        {
            if (httpRequest.HasFormContentType && httpRequest.Form.Files.Count > 0)
            {
                var file = httpRequest.Form.Files[0];
                fileStream = file.OpenReadStream();
            }
            else
            {
                string? ruta = null;
                try
                {
                    if (httpRequest.ContentLength > 0)
                    {
                        var body = await httpRequest.ReadFromJsonAsync<ImportarSiebelRequest>(cancellationToken: ct);
                        ruta = body?.RutaArchivo;
                    }
                }
                catch { }

                if (string.IsNullOrWhiteSpace(ruta))
                {
                    ruta = @"c:\Users\sebas\Downloads\output.csv";
                }

                if (!File.Exists(ruta))
                {
                    return Results.BadRequest(new { message = $"No se encontró el archivo a importar en la ruta: {ruta}" });
                }

                fileStream = File.OpenRead(ruta);
            }

            var userId = currentUser.Id;
            var resultado = await importador.ImportarDesdeStreamAsync(fileStream, userId, ct);
            return Results.Ok(resultado);
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new { message = $"Error importando archivo Siebel: {ex.Message}" });
        }
        finally
        {
            fileStream?.Dispose();
        }
    }
}

// =============================================================================
// DTOS & REQUEST MODELS
// =============================================================================

public record TrabajoListadoItemDto(
    Guid Id,
    Guid OrdenTrabajoId,
    string CodigoTrabajo,
    string? CodigoExterno,
    string CodigoWo,
    string? NumeroOrden,
    string? CodigoContrato,
    Guid ProductoId,
    string ProductoCodigo,
    string ProductoNombre,
    string Estado,
    string EstadoSistemaOrden,
    string TipoOrdenNombre,
    string TipoOrdenColor,
    string ClienteFacturacionNombre,
    string ClienteServicioNombre,
    string? ClienteServicioCodigo,
    string? ClienteServicioDireccion,
    Guid? RecursoTecnicoId,
    string? RecursoTecnicoNombre,
    string? FechaProgramada,
    string? BloqueHorario,
    decimal Puntos,
    decimal TarifaBase,
    DateTime? FechaInicio,
    DateTime? FechaFin,
    string? UnidadOrganizativaNombre,
    string? ZonaOperativaNombre,
    int CantidadTareas,
    int CantidadTareasCompletadas,
    int CantidadMateriales,
    DateTime FechaCreacion
);

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
    DateTime FechaCreacion,
    Guid? UnidadOrganizativaId = null,
    string? UnidadOrganizativaNombre = null,
    decimal TotalPuntos = 0m,
    string? ClienteServicioCodigo = null,
    string? ClienteServicioCodigoExterno = null,
    string? CodigoExternoTrabajo = null
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
    decimal Puntos,
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
    string Moneda = "PEN",
    uint Version = 0,
    Guid? UnidadOrganizativaId = null,
    string? UnidadOrganizativaNombre = null,
    decimal TotalPuntos = 0m
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
    string? ReferenciaEquipo = null,
    decimal? Puntos = null
);

public record DatosClienteOrdenRequest(
    string NombreCuenta,
    string? DocumentoIdentidad = null,
    string? CodigoExterno = null,
    string? TelefonoPrincipal = null,
    string? Email = null,
    string? Direccion = null,
    string? UbigeoCodigo = null,
    string? ReferenciaUbicacion = null,
    decimal? CoordenadaLat = null,
    decimal? CoordenadaLng = null
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
    Guid? ListaPreciosId = null,
    Guid? UnidadOrganizativaId = null,
    DatosClienteOrdenRequest? DatosCliente = null
);

public record ActualizarOrdenTrabajoRequest(
    Guid? ZonaOperativaId,
    Guid? RecursoTecnicoId,
    string? FechaProgramada,
    string? BloqueHorario,
    string? Observaciones,
    Guid? UnidadOrganizativaId = null
);

public record CambiarEstadoSistemaRequest(
    string NuevoEstadoSistema,
    Guid? RecursoTecnicoId,
    string? FechaProgramada,
    string? BloqueHorario,
    Guid? MotivoId = null,
    string? Observaciones = null
);

public record ProgramarOrdenTrabajoRequest(
    Guid RecursoTecnicoId,
    string FechaProgramada,
    string? BloqueHorario
);

public record ActualizarTrabajoRequest(string? ReferenciaEquipo, string? Observaciones, string? CodigoExterno);
public record CancelarTrabajoRequest(string? Motivo);
public record RechazarTrabajoRequest(string Motivo);
public record BatchEstadoTrabajosRequest(List<Guid> TrabajoIds, string? Motivo);
public record CompletarTareaRequest(string? EvidenciaUrl, string? Observaciones);

public record LiquidarOrdenTrabajoRequest(
    Guid? AlmacenId,
    string? Observaciones,
    List<LiquidacionConsumoItemInput>? Consumos = null,
    List<LiquidacionRetiroItemInput>? Retiros = null
);

public record LiquidacionConsumoItemInput(
    Guid ProductoId,
    decimal Cantidad,
    string? NumeroSerie = null,
    Guid? ItemSeriadoId = null,
    string? Observaciones = null
);

public record LiquidacionRetiroItemInput(
    Guid ProductoId,
    string NumeroSerie,
    string? Motivo = null
);

public record ReprogramarVisitaRequest(
    string FechaProgramada,
    string? BloqueHorario = null,
    Guid? RecursoTecnicoId = null,
    Guid? MotivoId = null,
    string? Observaciones = null
);

public record CancelarVisitaRequest(
    Guid MotivoId,
    string? Observaciones = null
);

public record ImportarSiebelRequest(string? RutaArchivo);

