using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarCategoriaProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarUnidadMedida;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CambiarEstadoCategoriaProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CambiarEstadoUnidadMedida;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearCategoriaProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearUnidadMedida;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerCategoriasProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerUnidadesMedida;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class CatalogosProductoEndpoints
{
    public static void MapCatalogosProductoEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Unidades de Medida ──
        var umGroup = app.MapGroup("/api/inventario/unidades-medida")
            .WithTags("Servicio de Campo - Unidades de Medida")
            .RequireAuthorization();

        umGroup.MapGet("/", ObtenerUnidadesMedida);
        umGroup.MapGet("/plantilla-excel", DescargarPlantillaUnidadesMedida);
        umGroup.MapPost("/importar-excel", ImportarUnidadesMedidaExcel).DisableAntiforgery();
        umGroup.MapGet("/{id:guid}", ObtenerUnidadMedidaPorId);
        umGroup.MapPost("/", CrearUnidadMedida);
        umGroup.MapPut("/{id:guid}", ActualizarUnidadMedida);
        umGroup.MapPatch("/{id:guid}/estado", CambiarEstadoUnidadMedida);

        // ── Categorías y Familias de Productos ──
        var catGroup = app.MapGroup("/api/inventario/categorias-producto")
            .WithTags("Servicio de Campo - Categorías de Productos")
            .RequireAuthorization();

        catGroup.MapGet("/", ObtenerCategoriasProducto);
        catGroup.MapGet("/plantilla-excel", DescargarPlantillaCategorias);
        catGroup.MapPost("/importar-excel", ImportarCategoriasExcel).DisableAntiforgery();
        catGroup.MapGet("/{id:guid}", ObtenerCategoriaProductoPorId);
        catGroup.MapPost("/", CrearCategoriaProducto);
        catGroup.MapPut("/{id:guid}", ActualizarCategoriaProducto);
        catGroup.MapPatch("/{id:guid}/estado", CambiarEstadoCategoriaProducto);
    }

    private static async Task<IResult> DescargarPlantillaUnidadesMedida(
        BubbaBag.Modules.ServicioCampo.Application.Productos.Services.IInventarioExcelService excelService,
        System.Threading.CancellationToken cancellationToken)
    {
        var bytes = await excelService.GenerarPlantillaUnidadesMedidaAsync(cancellationToken);
        return Results.File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Plantilla_Unidades_Medida.xlsx");
    }

    private static async Task<IResult> ImportarUnidadesMedidaExcel(
        IFormFile file,
        BubbaBag.Modules.ServicioCampo.Application.Productos.Services.IInventarioExcelService excelService,
        System.Threading.CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { mensaje = "Debe proporcionar un archivo de Excel válido (.xlsx)." });
        }

        using var stream = file.OpenReadStream();
        var resultado = await excelService.ImportarUnidadesMedidaAsync(stream, cancellationToken);
        return Results.Ok(resultado);
    }

    private static async Task<IResult> DescargarPlantillaCategorias(
        BubbaBag.Modules.ServicioCampo.Application.Productos.Services.IInventarioExcelService excelService,
        System.Threading.CancellationToken cancellationToken)
    {
        var bytes = await excelService.GenerarPlantillaCategoriasAsync(cancellationToken);
        return Results.File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Plantilla_Categorias.xlsx");
    }

    private static async Task<IResult> ImportarCategoriasExcel(
        IFormFile file,
        BubbaBag.Modules.ServicioCampo.Application.Productos.Services.IInventarioExcelService excelService,
        System.Threading.CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { mensaje = "Debe proporcionar un archivo de Excel válido (.xlsx)." });
        }

        using var stream = file.OpenReadStream();
        var resultado = await excelService.ImportarCategoriasAsync(stream, cancellationToken);
        return Results.Ok(resultado);
    }

    private static async Task<IResult> ObtenerUnidadMedidaPorId(
        Guid id,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerUnidadMedidaPorId.ObtenerUnidadMedidaPorIdQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> ObtenerCategoriaProductoPorId(
        Guid id,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerCategoriaProductoPorId.ObtenerCategoriaProductoPorIdQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    // Handlers Unidades de Medida
    private static async Task<IResult> ObtenerUnidadesMedida(
        string? search,
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerUnidadesMedidaQuery(search, soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CrearUnidadMedida(
        CrearUnidadMedidaRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearUnidadMedidaCommand(
            request.Codigo,
            request.Nombre,
            request.Abreviatura,
            request.PermiteDecimales,
            request.Descripcion
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/inventario/unidades-medida/{result.Value}", new { Id = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ActualizarUnidadMedida(
        Guid id,
        ActualizarUnidadMedidaRequest request,
        IDispatcher dispatcher)
    {
        var command = new ActualizarUnidadMedidaCommand(
            id,
            request.Nombre,
            request.Abreviatura,
            request.PermiteDecimales,
            request.Descripcion
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CambiarEstadoUnidadMedida(
        Guid id,
        CambiarEstadoCatalogoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CambiarEstadoUnidadMedidaCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    // Handlers Categorías de Producto
    private static async Task<IResult> ObtenerCategoriasProducto(
        string? search,
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerCategoriasProductoQuery(search, soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CrearCategoriaProducto(
        CrearCategoriaProductoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearCategoriaProductoCommand(
            request.Nombre,
            request.Familia,
            request.Descripcion
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/inventario/categorias-producto/{result.Value}", new { Id = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ActualizarCategoriaProducto(
        Guid id,
        ActualizarCategoriaProductoRequest request,
        IDispatcher dispatcher)
    {
        var command = new ActualizarCategoriaProductoCommand(
            id,
            request.Nombre,
            request.Familia,
            request.Descripcion
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CambiarEstadoCategoriaProducto(
        Guid id,
        CambiarEstadoCatalogoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CambiarEstadoCategoriaProductoCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }
}

public record CrearUnidadMedidaRequest(
    string Codigo,
    string Nombre,
    string Abreviatura,
    bool PermiteDecimales,
    string? Descripcion
);

public record ActualizarUnidadMedidaRequest(
    string Nombre,
    string Abreviatura,
    bool PermiteDecimales,
    string? Descripcion
);

public record CrearCategoriaProductoRequest(
    string Nombre,
    string? Familia,
    string? Descripcion
);

public record ActualizarCategoriaProductoRequest(
    string Nombre,
    string? Familia,
    string? Descripcion
);
