using BubbaBag.SharedKernel.Authorization;
using System;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class OrganizacionEndpoints
{
    public static void MapOrganizacionEndpoints(this IEndpointRouteBuilder app)
    {
        // =========================================================================
        // UNIDADES ORGANIZATIVAS (Sedes / Bases)
        // =========================================================================
        var sedesGroup = app.MapGroup("/api/serviciocampo/unidades-organizativas")
            .WithTags("Servicio de Campo - Unidades Organizativas (Sedes)")
            .RequireAuthorization(Permissions.Inventario.Acceso);

        sedesGroup.MapGet("/", ObtenerUnidadesOrganizativas);
        sedesGroup.MapGet("/{id:guid}", ObtenerUnidadOrganizativaPorId);
        sedesGroup.MapPost("/", CrearUnidadOrganizativa).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        sedesGroup.MapPut("/{id:guid}", ActualizarUnidadOrganizativa).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        sedesGroup.MapPatch("/{id:guid}/estado", CambiarEstadoUnidadOrganizativa).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);

        // =========================================================================
        // TERRITORIOS (Zonas Operativas de Servicio)
        // =========================================================================
        var territoriosGroup = app.MapGroup("/api/serviciocampo/territorios")
            .WithTags("Servicio de Campo - Territorios")
            .RequireAuthorization(Permissions.Inventario.Acceso);

        territoriosGroup.MapGet("/", ObtenerTerritorios);
        territoriosGroup.MapGet("/{id:guid}", ObtenerTerritorioPorId);
        territoriosGroup.MapPost("/", CrearTerritorio).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        territoriosGroup.MapPut("/{id:guid}", ActualizarTerritorio).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        territoriosGroup.MapPatch("/{id:guid}/estado", CambiarEstadoTerritorio).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);

        // =========================================================================
        // RECURSOS (Técnicos, Despachadores, Cuadrillas)
        // =========================================================================
        var recursosGroup = app.MapGroup("/api/serviciocampo/recursos")
            .WithTags("Servicio de Campo - Recursos")
            .RequireAuthorization(Permissions.Inventario.Acceso);

        recursosGroup.MapGet("/usuarios-vinculables", ObtenerUsuariosVinculables).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        recursosGroup.MapGet("/", ObtenerRecursos);
        recursosGroup.MapGet("/{id:guid}", ObtenerRecursoPorId);
        recursosGroup.MapPost("/", CrearRecurso).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        recursosGroup.MapPut("/{id:guid}", ActualizarRecurso).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
        recursosGroup.MapPatch("/{id:guid}/estado", CambiarEstadoRecurso).RequireAuthorization(Permissions.Inventario.CatalogosGestionar);
    }

    // -------------------------------------------------------------------------
    // HANDLERS UNIDADES ORGANIZATIVAS
    // -------------------------------------------------------------------------
    private static async Task<IResult> ObtenerUnidadesOrganizativas(
        bool? soloActivos,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var query = context.UnidadesOrganizativas.AsNoTracking().AsQueryable();
        if (soloActivos.HasValue) query = query.Where(u => u.Activo == soloActivos.Value);

        var lista = await query
            .OrderByDescending(u => u.EsSedePrincipal)
            .ThenBy(u => u.Nombre)
            .Select(u => new UnidadOrganizativaItemDto(
                u.Id,
                u.Codigo,
                u.Nombre,
                u.Ciudad,
                u.Direccion,
                u.Telefono,
                u.EsSedePrincipal,
                u.Activo,
                u.CreatedAt,
                u.UpdatedAt
            ))
            .ToListAsync(ct);

        return Results.Ok(lista);
    }

    private static async Task<IResult> ObtenerUnidadOrganizativaPorId(
        Guid id,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var item = await context.UnidadesOrganizativas
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new UnidadOrganizativaItemDto(
                u.Id,
                u.Codigo,
                u.Nombre,
                u.Ciudad,
                u.Direccion,
                u.Telefono,
                u.EsSedePrincipal,
                u.Activo,
                u.CreatedAt,
                u.UpdatedAt
            ))
            .FirstOrDefaultAsync(ct);

        return item is not null ? Results.Ok(item) : Results.NotFound("Unidad organizativa no encontrada.");
    }

    private static async Task<IResult> CrearUnidadOrganizativa(
        CrearUnidadOrganizativaRequest request,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Codigo) || string.IsNullOrWhiteSpace(request.Nombre))
            return Results.BadRequest("El código y nombre de la unidad organizativa son obligatorios.");

        var existeCodigo = await context.UnidadesOrganizativas
            .AnyAsync(u => u.Codigo.ToUpper() == request.Codigo.Trim().ToUpper(), ct);
        if (existeCodigo)
            return Results.BadRequest($"Ya existe una unidad organizativa con el código '{request.Codigo.Trim().ToUpper()}'.");

        var unidad = UnidadOrganizativa.Crear(
            request.Codigo,
            request.Nombre,
            request.Ciudad,
            request.Direccion,
            request.Telefono,
            request.EsSedePrincipal
        );

        await context.UnidadesOrganizativas.AddAsync(unidad, ct);
        await context.SaveChangesAsync(ct);

        return Results.Created($"/api/serviciocampo/unidades-organizativas/{unidad.Id}", new { id = unidad.Id });
    }

    private static async Task<IResult> ActualizarUnidadOrganizativa(
        Guid id,
        ActualizarUnidadOrganizativaRequest request,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var unidad = await context.UnidadesOrganizativas.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (unidad is null) return Results.NotFound("Unidad organizativa no encontrada.");

        unidad.Actualizar(
            request.Nombre,
            request.Ciudad,
            request.Direccion,
            request.Telefono,
            request.EsSedePrincipal
        );

        await context.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> CambiarEstadoUnidadOrganizativa(
        Guid id,
        CambiarEstadoGeneralRequest request,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var unidad = await context.UnidadesOrganizativas.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (unidad is null) return Results.NotFound("Unidad organizativa no encontrada.");

        if (request.Activo) unidad.Activar(); else unidad.Desactivar();
        await context.SaveChangesAsync(ct);
        return Results.Ok();
    }

    // -------------------------------------------------------------------------
    // HANDLERS TERRITORIOS (Zonas Operativas)
    // -------------------------------------------------------------------------
    private static async Task<IResult> ObtenerTerritorios(
        Guid? unidadOrganizativaId,
        bool? soloActivos,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var query = context.ZonasOperativas.AsNoTracking().AsQueryable();
        if (unidadOrganizativaId.HasValue && unidadOrganizativaId.Value != Guid.Empty)
            query = query.Where(z => z.SucursalId == unidadOrganizativaId.Value);
        if (soloActivos.HasValue)
            query = query.Where(z => z.Activo == soloActivos.Value);

        var sedesMap = await context.UnidadesOrganizativas.AsNoTracking().ToDictionaryAsync(u => u.Id, u => u.Nombre, ct);
        var almacenesMap = await context.Almacenes.AsNoTracking().ToDictionaryAsync(a => a.Id, a => a.Nombre, ct);

        var zonas = await query.OrderBy(z => z.Nombre).ToListAsync(ct);
        var lista = zonas.Select(z => new TerritorioItemDto(
            z.Id,
            z.Codigo,
            z.Nombre,
            z.SucursalId,
            sedesMap.TryGetValue(z.SucursalId, out var sNom) ? sNom : "Sin sede",
            z.AlmacenPredeterminadoId,
            z.AlmacenPredeterminadoId.HasValue && almacenesMap.TryGetValue(z.AlmacenPredeterminadoId.Value, out var aNom) ? aNom : null,
            z.DescripcionProveedor,
            z.Activo
        )).ToList();

        return Results.Ok(lista);
    }

    private static async Task<IResult> ObtenerTerritorioPorId(
        Guid id,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var z = await context.ZonasOperativas.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (z is null) return Results.NotFound("Territorio no encontrado.");

        var sedeNom = await context.UnidadesOrganizativas.Where(u => u.Id == z.SucursalId).Select(u => u.Nombre).FirstOrDefaultAsync(ct);
        var almNom = z.AlmacenPredeterminadoId.HasValue
            ? await context.Almacenes.Where(a => a.Id == z.AlmacenPredeterminadoId.Value).Select(a => a.Nombre).FirstOrDefaultAsync(ct)
            : null;

        return Results.Ok(new TerritorioItemDto(
            z.Id,
            z.Codigo,
            z.Nombre,
            z.SucursalId,
            sedeNom ?? "Sin sede",
            z.AlmacenPredeterminadoId,
            almNom,
            z.DescripcionProveedor,
            z.Activo
        ));
    }

    private static async Task<IResult> CrearTerritorio(
        CrearTerritorioRequest request,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Codigo) || string.IsNullOrWhiteSpace(request.Nombre))
            return Results.BadRequest("El código y nombre del territorio son obligatorios.");
        if (request.UnidadOrganizativaId == Guid.Empty)
            return Results.BadRequest("Debe seleccionar la unidad organizativa (sede) a la que pertenece el territorio.");

        var existe = await context.ZonasOperativas.AnyAsync(z => z.Codigo.ToUpper() == request.Codigo.Trim().ToUpper(), ct);
        if (existe) return Results.BadRequest($"Ya existe un territorio con el código '{request.Codigo.Trim().ToUpper()}'.");

        var territorio = ZonaOperativa.Crear(
            request.Codigo,
            request.Nombre,
            request.UnidadOrganizativaId,
            request.AlmacenPredeterminadoId,
            request.DescripcionProveedor
        );

        await context.ZonasOperativas.AddAsync(territorio, ct);
        await context.SaveChangesAsync(ct);

        return Results.Created($"/api/serviciocampo/territorios/{territorio.Id}", new { id = territorio.Id });
    }

    private static async Task<IResult> ActualizarTerritorio(
        Guid id,
        ActualizarTerritorioRequest request,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var territorio = await context.ZonasOperativas.FirstOrDefaultAsync(z => z.Id == id, ct);
        if (territorio is null) return Results.NotFound("Territorio no encontrado.");

        territorio.Actualizar(
            request.Nombre,
            request.UnidadOrganizativaId,
            request.AlmacenPredeterminadoId,
            request.DescripcionProveedor
        );

        await context.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> CambiarEstadoTerritorio(
        Guid id,
        CambiarEstadoGeneralRequest request,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var territorio = await context.ZonasOperativas.FirstOrDefaultAsync(z => z.Id == id, ct);
        if (territorio is null) return Results.NotFound("Territorio no encontrado.");

        if (request.Activo) territorio.Activar(); else territorio.Desactivar();
        await context.SaveChangesAsync(ct);
        return Results.Ok();
    }

    // -------------------------------------------------------------------------
    // HANDLERS RECURSOS (Técnicos, Despachadores, etc.)
    // -------------------------------------------------------------------------
    private static async Task<IResult> ObtenerRecursos(
        int? tipo,
        Guid? unidadOrganizativaId,
        bool? soloActivos,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var query = context.Recursos.AsNoTracking().AsQueryable();
        if (tipo.HasValue) query = query.Where(r => (int)r.Tipo == tipo.Value);
        if (unidadOrganizativaId.HasValue && unidadOrganizativaId.Value != Guid.Empty)
            query = query.Where(r => r.UnidadOrganizativaId == unidadOrganizativaId.Value);
        if (soloActivos.HasValue) query = query.Where(r => r.Activo == soloActivos.Value);

        var sedesMap = await context.UnidadesOrganizativas.AsNoTracking().ToDictionaryAsync(u => u.Id, u => u.Nombre, ct);
        var almacenesMap = await context.Almacenes.AsNoTracking().ToDictionaryAsync(a => a.Id, a => a.Nombre, ct);

        var recursos = await query.OrderBy(r => r.NombreCompleto).ToListAsync(ct);
        var lista = recursos.Select(r => new RecursoDetalleDto(
            r.Id,
            r.Codigo,
            r.NombreCompleto,
            (int)r.Tipo,
            r.Tipo.ToString(),
            r.DocumentoIdentidad,
            r.Telefono,
            r.Email,
            r.UnidadOrganizativaId,
            r.UnidadOrganizativaId.HasValue && sedesMap.TryGetValue(r.UnidadOrganizativaId.Value, out var sNom) ? sNom : null,
            r.ZonaOperativaId,
            r.AlmacenBaseId,
            r.AlmacenBaseId.HasValue && almacenesMap.TryGetValue(r.AlmacenBaseId.Value, out var aNom) ? aNom : null,
            context.Almacenes.Where(a=>a.RecursoId==r.Id && a.Activo && a.Tipo==BubbaBag.Modules.ServicioCampo.Domain.Almacenes.TipoAlmacen.CustodiaPersonal).Select(a=>(Guid?)a.Id).FirstOrDefault(),
            r.UsuarioId,
            r.CapacidadMaximaOrdenesPorDia,
            r.ColorHex,
            r.Activo
        )).ToList();

        return Results.Ok(lista);
    }

    private static async Task<IResult> ObtenerRecursoPorId(
        Guid id,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var r = await context.Recursos.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null) return Results.NotFound("Recurso no encontrado.");

        var sedeNom = r.UnidadOrganizativaId.HasValue
            ? await context.UnidadesOrganizativas.Where(u => u.Id == r.UnidadOrganizativaId.Value).Select(u => u.Nombre).FirstOrDefaultAsync(ct)
            : null;
        var almNom = r.AlmacenBaseId.HasValue
            ? await context.Almacenes.Where(a => a.Id == r.AlmacenBaseId.Value).Select(a => a.Nombre).FirstOrDefaultAsync(ct)
            : null;

        return Results.Ok(new RecursoDetalleDto(
            r.Id,
            r.Codigo,
            r.NombreCompleto,
            (int)r.Tipo,
            r.Tipo.ToString(),
            r.DocumentoIdentidad,
            r.Telefono,
            r.Email,
            r.UnidadOrganizativaId,
            sedeNom,
            r.ZonaOperativaId,
            r.AlmacenBaseId,
            almNom,
            await context.Almacenes.Where(a=>a.RecursoId==r.Id && a.Tipo==TipoAlmacen.CustodiaPersonal && a.Activo).Select(a=>(Guid?)a.Id).FirstOrDefaultAsync(ct),
            r.UsuarioId,
            r.CapacidadMaximaOrdenesPorDia,
            r.ColorHex,
            r.Activo
        ));
    }

    private static async Task<IResult> ObtenerUsuariosVinculables(
        Guid? recursoId,
        BubbaBag.Modules.Seguridad.Application.Auth.IAuthService usuarios,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var resultado = await usuarios.ObtenerUsuariosAsync(soloActivos: true);
        if (resultado.IsFailure) return Results.BadRequest(resultado.Error);

        Guid? usuarioActualId = null;
        if (recursoId.HasValue && recursoId.Value != Guid.Empty)
        {
            var recurso = await context.Recursos.FindAsync([recursoId.Value], ct);
            usuarioActualId = recurso?.UsuarioId;
        }

        static bool EsRolTecnico(string rol) =>
            rol.Equals(BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoTecnico, StringComparison.OrdinalIgnoreCase) ||
            rol.Contains("tecnico", StringComparison.OrdinalIgnoreCase) ||
            rol.Contains("técnico", StringComparison.OrdinalIgnoreCase);

        var tecnicos = resultado.Value
            .Where(u => u.Id == usuarioActualId || u.Roles.Any(EsRolTecnico))
            .Select(u => new { u.Id, u.NombreCompleto, u.Email, u.EsActivo, u.Roles })
            .ToList();

        return Results.Ok(tecnicos);
    }

    private static async Task<string?> ValidarUsuarioRecurso(
        Guid? usuarioId,
        BubbaBag.Modules.Seguridad.Application.Auth.IAuthService usuarios,
        Guid? recursoActualId,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        if (!usuarioId.HasValue || usuarioId.Value == Guid.Empty) return null;

        var resultado = await usuarios.ObtenerUsuarioPorIdAsync(usuarioId.Value);
        if (resultado.IsFailure || !resultado.Value.EsActivo)
            return "Seleccione una cuenta de usuario existente y activa.";

        var esTecnico = resultado.Value.Roles.Any(rol =>
            rol.Equals(BubbaBag.SharedKernel.Authorization.Roles.ServicioCampoTecnico, StringComparison.OrdinalIgnoreCase) ||
            rol.Contains("tecnico", StringComparison.OrdinalIgnoreCase) ||
            rol.Contains("técnico", StringComparison.OrdinalIgnoreCase));
        if (!esTecnico)
            return "El usuario seleccionado no cuenta con el rol de Técnico.";

        var asignadoAOtro = await context.Recursos
            .AnyAsync(r => r.UsuarioId == usuarioId.Value && (!recursoActualId.HasValue || r.Id != recursoActualId.Value), ct);
        if (asignadoAOtro)
            return "El usuario ya se encuentra vinculado a otro recurso.";

        return null;
    }

    private static async Task<IResult> CrearRecurso(
        CrearRecursoRequest request,
        BubbaBag.Modules.Seguridad.Application.Auth.IAuthService usuarios,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Codigo) || string.IsNullOrWhiteSpace(request.NombreCompleto))
            return Results.BadRequest("El código y nombre completo del recurso son obligatorios.");

        var existe = await context.Recursos.AnyAsync(r => r.Codigo.ToUpper() == request.Codigo.Trim().ToUpper(), ct);
        if (existe) return Results.BadRequest($"Ya existe un recurso con el código '{request.Codigo.Trim().ToUpper()}'.");

        var errorUsuario = await ValidarUsuarioRecurso(request.UsuarioId, usuarios, null, context, ct);
        if (errorUsuario != null) return Results.BadRequest(errorUsuario);
        var tipo = (TipoRecurso)(request.Tipo <= 0 ? 1 : request.Tipo);
        var recurso = Recurso.Crear(
            request.Codigo,
            request.NombreCompleto,
            tipo,
            request.ZonaOperativaId,
            request.AlmacenBaseId,
            null,
            request.UsuarioId,
            null,
            request.Telefono,
            request.DocumentoIdentidad,
            request.Email,
            request.CapacidadMaximaOrdenesPorDia > 0 ? request.CapacidadMaximaOrdenesPorDia : 6,
            request.ColorHex ?? "#0078d4",
            request.Notas
        );

        if (request.UnidadOrganizativaId.HasValue && request.UnidadOrganizativaId.Value != Guid.Empty)
        {
            recurso.AsignarUnidadOrganizativa(request.UnidadOrganizativaId.Value);
        }

        await context.Recursos.AddAsync(recurso, ct);
        await context.SaveChangesAsync(ct);

        return Results.Created($"/api/serviciocampo/recursos/{recurso.Id}", new { id = recurso.Id });
    }

    private static async Task<IResult> ActualizarRecurso(
        Guid id,
        ActualizarRecursoRequest request,
        BubbaBag.Modules.Seguridad.Application.Auth.IAuthService usuarios,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var recurso = await context.Recursos.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (recurso is null) return Results.NotFound("Recurso no encontrado.");

        var errorUsuario = await ValidarUsuarioRecurso(request.UsuarioId, usuarios, id, context, ct);
        if (errorUsuario != null) return Results.BadRequest(errorUsuario);

        var tipo = (TipoRecurso)(request.Tipo <= 0 ? 1 : request.Tipo);
        var custodia=await context.Almacenes.FirstOrDefaultAsync(a=>a.RecursoId==id && a.Tipo==TipoAlmacen.CustodiaPersonal && a.Activo,ct);
        if(custodia!=null && (request.UnidadOrganizativaId!=custodia.UnidadOrganizativaId || tipo!=TipoRecurso.Tecnico)) return Results.BadRequest("Primero cierre y desactive la custodia personal antes de cambiar de unidad o tipo de recurso.");
        recurso.Actualizar(
            request.NombreCompleto,
            tipo,
            request.ZonaOperativaId,
            request.AlmacenBaseId,
            null,
            request.UsuarioId,
            null,
            request.Telefono,
            request.DocumentoIdentidad,
            request.Email,
            request.CapacidadMaximaOrdenesPorDia > 0 ? request.CapacidadMaximaOrdenesPorDia : 6,
            request.ColorHex ?? "#0078d4",
            request.Notas
        );

        recurso.AsignarUnidadOrganizativa(request.UnidadOrganizativaId);
        await context.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    private static async Task<IResult> CambiarEstadoRecurso(
        Guid id,
        CambiarEstadoGeneralRequest request,
        IServicioCampoDbContext context,
        CancellationToken ct)
    {
        var recurso = await context.Recursos.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (recurso is null) return Results.NotFound("Recurso no encontrado.");

        if (request.Activo) recurso.Activar(); else recurso.Desactivar();
        await context.SaveChangesAsync(ct);
        return Results.Ok();
    }
}

// =============================================================================
// DTOs & Records
// =============================================================================
public record CambiarEstadoGeneralRequest(bool Activo);

public record UnidadOrganizativaItemDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Ciudad,
    string? Direccion,
    string? Telefono,
    bool EsSedePrincipal,
    bool Activo,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CrearUnidadOrganizativaRequest(
    string Codigo,
    string Nombre,
    string? Ciudad = null,
    string? Direccion = null,
    string? Telefono = null,
    bool EsSedePrincipal = false
);

public record ActualizarUnidadOrganizativaRequest(
    string Nombre,
    string? Ciudad = null,
    string? Direccion = null,
    string? Telefono = null,
    bool EsSedePrincipal = false
);

public record TerritorioItemDto(
    Guid Id,
    string Codigo,
    string Nombre,
    Guid UnidadOrganizativaId,
    string UnidadOrganizativaNombre,
    Guid? AlmacenPredeterminadoId,
    string? AlmacenPredeterminadoNombre,
    string? DescripcionProveedor,
    bool Activo
);

public record CrearTerritorioRequest(
    string Codigo,
    string Nombre,
    Guid UnidadOrganizativaId,
    Guid? AlmacenPredeterminadoId = null,
    string? DescripcionProveedor = null
);

public record ActualizarTerritorioRequest(
    string Nombre,
    Guid UnidadOrganizativaId,
    Guid? AlmacenPredeterminadoId = null,
    string? DescripcionProveedor = null
);

public record RecursoDetalleDto(
    Guid Id,
    string Codigo,
    string NombreCompleto,
    int Tipo,
    string TipoNombre,
    string? DocumentoIdentidad,
    string? Telefono,
    string? Email,
    Guid? UnidadOrganizativaId,
    string? UnidadOrganizativaNombre,
    Guid? ZonaOperativaId,
    Guid? AlmacenBaseId,
    string? AlmacenBaseNombre,
    Guid? AlmacenMovilId,
    Guid? UsuarioId,
    int CapacidadMaximaOrdenesPorDia,
    string? ColorHex,
    bool Activo
);

public record CrearRecursoRequest(
    string Codigo,
    string NombreCompleto,
    int Tipo = 1,
    Guid? UnidadOrganizativaId = null,
    Guid? ZonaOperativaId = null,
    Guid? AlmacenBaseId = null,
    Guid? AlmacenMovilId = null,
    Guid? UsuarioId = null,
    string? Telefono = null,
    string? DocumentoIdentidad = null,
    string? Email = null,
    int CapacidadMaximaOrdenesPorDia = 6,
    string? ColorHex = null,
    string? Notas = null
);

public record ActualizarRecursoRequest(
    string NombreCompleto,
    int Tipo = 1,
    Guid? UnidadOrganizativaId = null,
    Guid? ZonaOperativaId = null,
    Guid? AlmacenBaseId = null,
    Guid? AlmacenMovilId = null,
    Guid? UsuarioId = null,
    string? Telefono = null,
    string? DocumentoIdentidad = null,
    string? Email = null,
    int CapacidadMaximaOrdenesPorDia = 6,
    string? ColorHex = null,
    string? Notas = null
);
