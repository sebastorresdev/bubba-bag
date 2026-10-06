using BubbaBag.SharedKernel.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.ActualizarAlmacen;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CambiarEstadoAlmacen;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearAlmacen;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearTransferenciaInventario;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.RecepcionarTransferencia;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Compras;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenPorId;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerAlmacenes;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerInventarioProductos;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerResumenStockAlmacenes;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerSeriesStock;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerTransferenciaDetalle;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Queries.ObtenerTransferenciasInventario;
using BubbaBag.SharedKernel.CQRS;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.ResolverDiferenciaTransferencia;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class AlmacenesEndpoints
{
    public static void MapAlmacenesEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapUbicacionesEndpoints();
        var group = app.MapGroup("/api/inventario/almacenes")
            .WithTags("Servicio de Campo - Almacenes y Bodegas")
            .RequireAuthorization(Permissions.Inventario.Acceso);

        group.MapGet("/", ObtenerAlmacenes);
        group.MapGet("/{id:guid}", ObtenerAlmacenPorId);
        group.MapPost("/", CrearAlmacen).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        group.MapPut("/{id:guid}", ActualizarAlmacen).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        group.MapPatch("/{id:guid}/estado", CambiarEstadoAlmacen).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        group.MapGet("/unidades-organizativas", ObtenerUnidadesOrganizativas);
        group.MapGet("/recursos-tecnicos", ObtenerRecursosTecnicos);

        var stockGroup = app.MapGroup("/api/inventario/stock")
            .WithTags("Servicio de Campo - Stock")
            .RequireAuthorization(Permissions.Inventario.Acceso);
        stockGroup.MapGet("/almacenes", ObtenerResumenStockAlmacenes);
        stockGroup.MapGet("/productos", ObtenerInventarioProductos);
        stockGroup.MapGet("/series", ObtenerSeries);
        stockGroup.MapPost("/series/validar-existentes", ValidarSeriesExistentes).RequireAuthorization(Permissions.Inventario.Operar);

        var transferenciasGroup = app.MapGroup("/api/inventario/transferencias")
            .WithTags("Servicio de Campo - Transferencias")
            .RequireAuthorization(Permissions.Inventario.Acceso);
        transferenciasGroup.MapGet("/", ObtenerTransferencias);
        transferenciasGroup.MapPost("/{id:guid}/resolver", ResolverDiferencia).RequireAuthorization(Permissions.Inventario.Operar);
        transferenciasGroup.MapPost("/", CrearTransferencia).RequireAuthorization(Permissions.Inventario.Operar);
        transferenciasGroup.MapGet("/{id:guid}", ObtenerTransferenciaPorId);
        transferenciasGroup.MapPost("/{id:guid}/recepcionar", RecepcionarTransferencia).RequireAuthorization(Permissions.Inventario.Operar);

        var compras = app.MapGroup("/api/inventario/compras").WithTags("Servicio de Campo - Compras").RequireAuthorization(Permissions.Inventario.Acceso);
        compras.MapGet("/", ObtenerCompras);
        compras.MapPost("/", CrearCompra).RequireAuthorization(Permissions.Inventario.Operar);
        compras.MapGet("/{id:guid}", ObtenerCompra);
        compras.MapPut("/{id:guid}", ActualizarCompra).RequireAuthorization(Permissions.Inventario.Operar);
        compras.MapPost("/{id:guid}/solicitar", SolicitarCompra).RequireAuthorization(Permissions.Inventario.Operar);
        compras.MapPost("/{id:guid}/enviar", EnviarCompra).RequireAuthorization(Permissions.Inventario.Operar);
        compras.MapPost("/{id:guid}/recepcionar", RecepcionarCompra).RequireAuthorization(Permissions.Inventario.Operar);
    }

    private static async Task<IResult> ObtenerCompras(
        IDispatcher dispatcher,
        IServicioCampoDbContext context,
        BubbaBag.Modules.Seguridad.Application.Auth.IAuthService authService,
        CancellationToken ct)
    {
        var resultado = await dispatcher.QueryAsync(new ObtenerComprasQuery());
        if (resultado.IsFailure) return Results.BadRequest(resultado.Error);
        var enriquecidas = await EnriquecerComprasConRecepcion(resultado.Value, context, authService, ct);
        return Results.Ok(enriquecidas);
    }
    private static async Task<IResult> CrearCompra(CrearCompraCommand command, IDispatcher dispatcher)
    {
        var resultado = await dispatcher.SendAsync(command);
        return resultado.IsSuccess ? Results.Created($"/api/inventario/compras/{resultado.Value}", new { id = resultado.Value }) : Results.BadRequest(resultado.Error);
    }
    private static async Task<IResult> ObtenerCompra(
        Guid id,
        IDispatcher dispatcher,
        IServicioCampoDbContext context,
        BubbaBag.Modules.Seguridad.Application.Auth.IAuthService authService,
        CancellationToken ct)
    {
        var resultado = await dispatcher.QueryAsync(new ObtenerComprasQuery(id));
        if (resultado.IsFailure) return Results.BadRequest(resultado.Error);
        if (resultado.Value.Count == 0) return Results.NotFound("La compra no existe.");
        var enriquecidas = await EnriquecerComprasConRecepcion(resultado.Value, context, authService, ct);
        return Results.Ok(enriquecidas[0]);
    }

    private static async Task<List<BubbaBag.Modules.ServicioCampo.Application.Almacenes.Compras.CompraDto>> EnriquecerComprasConRecepcion(
        List<BubbaBag.Modules.ServicioCampo.Application.Almacenes.Compras.CompraDto> compras,
        IServicioCampoDbContext context,
        BubbaBag.Modules.Seguridad.Application.Auth.IAuthService authService,
        CancellationToken ct)
    {
        var comprasRecibidas = compras.Where(c => c.Estado.StartsWith("Recibida")).ToList();
        if (comprasRecibidas.Count == 0) return compras;

        var faltantesIds = comprasRecibidas.Where(c => !c.UsuarioRecepcionId.HasValue).Select(c => c.Id).ToList();
        var faltantesNumeros = comprasRecibidas.Where(c => !c.UsuarioRecepcionId.HasValue).Select(c => c.Numero).ToList();
        var movimientosDict = new Dictionary<Guid, (Guid? usuarioId, DateTime? fecha)>();
        if (faltantesIds.Count > 0)
        {
            var movs = await context.MovimientosInventario.AsNoTracking()
                .Where(m => ((m.EventoId.HasValue && faltantesIds.Contains(m.EventoId.Value)) || (m.NumeroDocumento != null && faltantesNumeros.Contains(m.NumeroDocumento))) && m.Tipo == TipoMovimientoInventario.IngresoProveedor)
                .Select(m => new { CompraId = m.EventoId, m.NumeroDocumento, m.UsuarioResponsableId, m.FechaMovimiento, m.FechaRegistro })
                .ToListAsync(ct);

            var comprasPorNumero = comprasRecibidas.ToDictionary(c => c.Numero, c => c.Id);
            foreach (var m in movs)
            {
                Guid? cid = m.CompraId;
                if ((!cid.HasValue || cid == Guid.Empty) && !string.IsNullOrEmpty(m.NumeroDocumento) && comprasPorNumero.TryGetValue(m.NumeroDocumento, out var idPorNum))
                {
                    cid = idPorNum;
                }
                if (cid.HasValue && !movimientosDict.ContainsKey(cid.Value))
                {
                    movimientosDict[cid.Value] = (m.UsuarioResponsableId, (DateTime?)m.FechaRegistro);
                }
            }

            // Fallback directo a Compra.UsuarioId si aún no se tiene usuario
            var todaviaFaltantes = faltantesIds.Where(id => !movimientosDict.ContainsKey(id)).ToList();
            if (todaviaFaltantes.Count > 0)
            {
                var comprasDb = await context.Compras.AsNoTracking()
                    .Where(c => todaviaFaltantes.Contains(c.Id))
                    .Select(c => new { c.Id, c.UsuarioId, c.FechaRecepcion, c.FechaRegistro })
                    .ToListAsync(ct);
                foreach (var cdb in comprasDb)
                {
                    movimientosDict[cdb.Id] = (cdb.UsuarioId, cdb.FechaRecepcion ?? cdb.FechaRegistro);
                }
            }
        }

        var userIds = new HashSet<Guid>();
        foreach (var c in comprasRecibidas)
        {
            if (c.UsuarioRecepcionId.HasValue) userIds.Add(c.UsuarioRecepcionId.Value);
            else if (movimientosDict.TryGetValue(c.Id, out var m) && m.usuarioId.HasValue) userIds.Add(m.usuarioId.Value);
        }

        var usersMap = new Dictionary<Guid, BubbaBag.Modules.Seguridad.Application.Auth.UsuarioDto>();
        if (userIds.Count > 0)
        {
            var uRes = await authService.ObtenerUsuariosAsync(soloActivos: false);
            if (uRes.IsSuccess)
            {
                usersMap = uRes.Value.Where(u => userIds.Contains(u.Id)).ToDictionary(u => u.Id, u => u);
            }
        }

        return compras.Select(c =>
        {
            if (!c.Estado.StartsWith("Recibida")) return c;

            Guid? usrId = c.UsuarioRecepcionId;
            DateTime? fechaRec = c.FechaRecepcion;
            if (!usrId.HasValue && movimientosDict.TryGetValue(c.Id, out var m))
            {
                usrId = m.usuarioId;
                fechaRec = m.fecha;
            }

            string? nombre = null;
            string? email = null;
            if (usrId.HasValue)
            {
                if (usersMap.TryGetValue(usrId.Value, out var u))
                {
                    nombre = u.NombreCompleto;
                    email = u.Email;
                }
                else
                {
                    nombre = "SuperAdmin";
                    email = "admin@bubbabag.local";
                }
            }

            return c with
            {
                UsuarioRecepcionId = usrId,
                RecibidoPor = nombre,
                RecibidoPorEmail = email,
                FechaRecepcion = fechaRec
            };
        }).ToList();
    }
    private static async Task<IResult> ActualizarCompra(Guid id, CrearCompraCommand datos, IDispatcher dispatcher)
    {
        var resultado = await dispatcher.SendAsync(new ActualizarCompraCommand(id, datos));
        return resultado.IsSuccess ? Results.Ok(new { id = resultado.Value }) : Results.BadRequest(resultado.Error);
    }
    private static Task<IResult> SolicitarCompra(Guid id, IDispatcher dispatcher) => ProcesarCompra(id, "solicitar", dispatcher);
    private static Task<IResult> EnviarCompra(Guid id, IDispatcher dispatcher) => ProcesarCompra(id, "enviar", dispatcher);
    private static async Task<IResult> ProcesarCompra(Guid id, string accion, IDispatcher dispatcher)
    {
        var resultado = await dispatcher.SendAsync(new ProcesarCompraCommand(id, accion));
        return resultado.IsSuccess ? Results.Ok() : Results.BadRequest(resultado.Error);
    }
    private static async Task<IResult> RecepcionarCompra(Guid id, RecepcionCompraDatos datos, IDispatcher dispatcher)
    {
        var resultado = await dispatcher.SendAsync(new RecepcionarCompraCommand(id, datos));
        return resultado.IsSuccess ? Results.Ok() : Results.BadRequest(resultado.Error);
    }

    private static async Task<IResult> ObtenerSeries(Guid? almacenId,Guid? productoId,string? buscar,Guid? ubicacionId,bool? incluirTransito,IDispatcher dispatcher)
    {
        var result=await dispatcher.QueryAsync(new ObtenerSeriesStockQuery(almacenId,productoId,buscar,ubicacionId,incluirTransito??false));
        return result.IsSuccess?Results.Ok(result.Value):Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ResolverDiferencia(Guid id, ResolverDiferenciaRequest r, IDispatcher dispatcher)
    {
        var result=await dispatcher.SendAsync(new ResolverDiferenciaTransferenciaCommand(id,r.DetalleId,r.Cantidad,r.Resultado,r.Motivo,r.Evidencia,r.Series,r.OperacionId));
        return result.IsSuccess?Results.Ok(new{id=result.Value}):Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerTransferencias(IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTransferenciasInventarioQuery());
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CrearTransferencia(
        CrearTransferenciaRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearTransferenciaInventarioCommand(
            request.AlmacenOrigenId,
            request.AlmacenDestinoId,
            request.Lineas.Select(linea => new LineaTransferenciaInventario(linea.ProductoId, linea.Cantidad, linea.Series, linea.Condicion)).ToList(),
            request.Observacion, request.GuiaRemision, request.UbicacionOrigenId, request.UbicacionDestinoId, request.Modalidad, request.OperacionId, request.FechaReal);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/inventario/transferencias/{result.Value}", new { numero = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerTransferenciaPorId(Guid id, IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerTransferenciaDetalleQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> RecepcionarTransferencia(
        Guid id,
        RecepcionarTransferenciaRequest request,
        IDispatcher dispatcher)
    {
        var command = new RecepcionarTransferenciaCommand(
            id,
            request.Lineas.Select(l => new LineaRecepcionTransferencia(l.TransferenciaDetalleId, l.Cantidad, l.Series)).ToList(),
            request.Observaciones, request.OperacionId, request.FechaReal);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Ok(new { numeroRecepcion = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerInventarioProductos(
        Guid? almacenId,
        string? buscar,
        Guid? ubicacionId,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerInventarioProductosQuery(almacenId, buscar, ubicacionId));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerResumenStockAlmacenes(
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerResumenStockAlmacenesQuery(soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerAlmacenes(
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerAlmacenesQuery(soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerAlmacenPorId(
        Guid id,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerAlmacenPorIdQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> ObtenerUnidadesOrganizativas(
        IServicioCampoDbContext context,
        System.Threading.CancellationToken ct)
    {
        var unidades = await context.UnidadesOrganizativas
            .AsNoTracking()
            .Where(u => u.Activo)
            .OrderBy(u => u.Nombre)
            .Select(u => new
            {
                u.Id,
                u.Codigo,
                u.Nombre,
                u.Ciudad,
                u.EsSedePrincipal
            })
            .ToListAsync(ct);

        return Results.Ok(unidades);
    }

    private static async Task<IResult> ObtenerRecursosTecnicos(
        Guid? unidadOrganizativaId,
        IServicioCampoDbContext context,
        System.Threading.CancellationToken ct)
    {
        var query = context.Recursos.AsNoTracking().Where(r => r.Activo);
        if (unidadOrganizativaId.HasValue && unidadOrganizativaId.Value != Guid.Empty)
        {
            query = query.Where(r => r.UnidadOrganizativaId == unidadOrganizativaId.Value);
        }

        var recursos = await query
            .OrderBy(r => r.NombreCompleto)
            .Select(r => new
            {
                r.Id,
                r.Codigo,
                r.NombreCompleto,
                r.Tipo,
                r.UnidadOrganizativaId,
                r.Email,
                r.Telefono
            })
            .ToListAsync(ct);

        return Results.Ok(recursos);
    }

    private static async Task<IResult> ValidarSeriesExistentes(
        ValidarSeriesRequest request,
        IServicioCampoDbContext context,
        ICurrentUser user,
        System.Threading.CancellationToken ct)
    {
        if (request.Series == null || request.Series.Count == 0)
        {
            return Results.Ok(new ValidarSeriesResponse(new List<SerieExistenteDetalle>()));
        }

        var seriesNormalizadas = request.Series
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim().ToUpperInvariant())
            .Distinct()
            .ToList();

        var existentes = await context.ItemsSeriados
            .AsNoTracking()
            .Where(item => seriesNormalizadas.Contains(item.NumeroSerie) && (user.IsInRole(BubbaBag.SharedKernel.Authorization.Roles.SuperAdmin) || item.UbicacionActual != null && InventarioAcceso.AlmacenesConsultables(context,user).Contains(item.UbicacionActual.AlmacenId)))
            .Select(item => new SerieExistenteDetalle(
                item.NumeroSerie,
                item.Estado.ToString(),
                item.UbicacionActual != null ? (Guid?)item.UbicacionActual.AlmacenId : null,
                item.UbicacionActual != null ? item.UbicacionActual.Almacen.Nombre : null,
                item.Producto.Nombre
            ))
            .ToListAsync(ct);

        return Results.Ok(new ValidarSeriesResponse(existentes));
    }

    private static async Task<IResult> CrearAlmacen(
        CrearAlmacenRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearAlmacenCommand(
            request.Nombre,
            request.Descripcion,
            request.Codigo,
            request.Tipo,
            request.UnidadOrganizativaId,
            request.RecursoId
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/inventario/almacenes/{result.Value}", new { Id = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ActualizarAlmacen(
        Guid id,
        ActualizarAlmacenRequest request,
        IDispatcher dispatcher)
    {
        var command = new ActualizarAlmacenCommand(
            id,
            request.Nombre,
            request.Descripcion,
            request.Codigo,
            request.Tipo,
            request.UnidadOrganizativaId,
            request.RecursoId
        );
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CambiarEstadoAlmacen(
        Guid id,
        CambiarEstadoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CambiarEstadoAlmacenCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
    }
}

public record CrearAlmacenRequest(
    string Nombre,
    string? Descripcion = null,
    string? Codigo = null,
    int? Tipo = 1,
    Guid? UnidadOrganizativaId = null,
    Guid? RecursoId = null
);

public record ActualizarAlmacenRequest(
    string Nombre,
    string? Descripcion = null,
    string? Codigo = null,
    int? Tipo = null,
    Guid? UnidadOrganizativaId = null,
    Guid? RecursoId = null
);

public record ValidarSeriesRequest(IReadOnlyCollection<string> Series);
public record SerieExistenteDetalle(
    string NumeroSerie,
    string Estado,
    Guid? AlmacenId,
    string? AlmacenNombre,
    string ProductoNombre
);
public record ValidarSeriesResponse(IReadOnlyCollection<SerieExistenteDetalle> Existentes);

public record CambiarEstadoRequest(bool Activo);

public record CrearTransferenciaRequest(Guid AlmacenOrigenId,Guid AlmacenDestinoId,IReadOnlyCollection<CrearTransferenciaLineaRequest> Lineas,string? Observacion=null,Guid? UbicacionOrigenId=null,Guid? UbicacionDestinoId=null,ModalidadTransferencia? Modalidad=null,Guid OperacionId=default,DateTime? FechaReal=null,string? GuiaRemision=null);

public record CrearTransferenciaLineaRequest(
    Guid ProductoId,
    decimal Cantidad,
    IReadOnlyCollection<string>? Series = null, CondicionInventario Condicion = CondicionInventario.Utilizable);

public record RecepcionarTransferenciaRequest(
    IReadOnlyCollection<RecepcionarTransferenciaLineaRequest> Lineas,
    string? Observaciones = null,Guid OperacionId=default,DateTime? FechaReal=null);

public record RecepcionarTransferenciaLineaRequest(Guid TransferenciaDetalleId,decimal Cantidad,IReadOnlyCollection<string>? Series=null);

public record ResolverDiferenciaRequest(Guid DetalleId,decimal Cantidad,TipoResolucionDiferencia Resultado,string Motivo,string Evidencia,IReadOnlyCollection<string>? Series,Guid OperacionId);
