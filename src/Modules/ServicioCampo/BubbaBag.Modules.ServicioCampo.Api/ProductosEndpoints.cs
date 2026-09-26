using System;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CambiarEstadoProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearProducto;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerProductoPorId;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Queries.ObtenerProductos;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class ProductosEndpoints
{
    public static void MapProductosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/inventario/productos")
            .WithTags("Servicio de Campo - Catálogo de Materiales y Equipos")
            .RequireAuthorization();

        group.MapGet("/", ObtenerProductos);
        group.MapGet("/plantilla-excel", DescargarPlantillaProductos);
        group.MapPost("/importar-excel", ImportarProductosExcel).DisableAntiforgery();
        group.MapGet("/{id:guid}", ObtenerProductoPorId);
        group.MapPost("/", CrearProducto);
        group.MapPut("/{id:guid}", ActualizarProducto);
        group.MapPatch("/{id:guid}/estado", CambiarEstadoProducto);
    }

    private static async Task<IResult> DescargarPlantillaProductos(
        BubbaBag.Modules.ServicioCampo.Application.Productos.Services.IInventarioExcelService excelService,
        System.Threading.CancellationToken cancellationToken)
    {
        var bytes = await excelService.GenerarPlantillaProductosAsync(cancellationToken);
        return Results.File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Plantilla_Productos.xlsx");
    }

    private static async Task<IResult> ImportarProductosExcel(
        IFormFile file,
        BubbaBag.Modules.ServicioCampo.Application.Productos.Services.IInventarioExcelService excelService,
        System.Threading.CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { mensaje = "Debe proporcionar un archivo de Excel válido (.xlsx)." });
        }

        using var stream = file.OpenReadStream();
        var resultado = await excelService.ImportarProductosAsync(stream, cancellationToken);
        return Results.Ok(resultado);
    }

    private static async Task<IResult> ObtenerProductos(
        string? search,
        string? categoria,
        TipoProducto? tipo,
        Guid? catalogoId,
        bool? soloActivos,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerProductosQuery(search, categoria, tipo, catalogoId, soloActivos));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ObtenerProductoPorId(
        Guid id,
        IDispatcher dispatcher)
    {
        var result = await dispatcher.QueryAsync(new ObtenerProductoPorIdQuery(id));
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> CrearProducto(
        CrearProductoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CrearProductoCommand(
            request.Codigo,
            request.Nombre,
            request.Tipo ?? TipoProducto.Inventario,
            request.PrecioBase ?? 0m,
            request.CatalogoId,
            request.Categoria ?? "Materiales",
            request.UnidadMedida ?? "Unidades",
            request.EsSerializado,
            request.Descripcion,
            request.ConvertirEnActivoCliente,
            request.CodigoBarras,
            request.Notas,
            request.CostoActual ?? 0m,
            request.CostoEstandar ?? 0m,
            request.AfectoImpuesto ?? true,
            request.ProveedorDefecto
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess
            ? Results.Created($"/api/inventario/productos/{result.Value}", new { Id = result.Value })
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> ActualizarProducto(
        Guid id,
        ActualizarProductoRequest request,
        IDispatcher dispatcher)
    {
        var command = new ActualizarProductoCommand(
            id,
            request.Nombre,
            request.Categoria ?? "Materiales",
            request.UnidadMedida ?? "Unidades",
            request.EsSerializado,
            request.Descripcion,
            request.Tipo ?? TipoProducto.Inventario,
            request.PrecioBase ?? 0m,
            request.CatalogoId,
            request.ConvertirEnActivoCliente,
            request.CodigoBarras,
            request.Notas,
            request.CostoActual ?? 0m,
            request.CostoEstandar ?? 0m,
            request.AfectoImpuesto ?? true,
            request.ProveedorDefecto
        );

        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> CambiarEstadoProducto(
        Guid id,
        CambiarEstadoProductoRequest request,
        IDispatcher dispatcher)
    {
        var command = new CambiarEstadoProductoCommand(id, request.Activo);
        var result = await dispatcher.SendAsync(command);
        return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
    }
}

public record CrearProductoRequest(
    string Codigo,
    string Nombre,
    TipoProducto? Tipo,
    decimal? PrecioBase,
    Guid? CatalogoId,
    string? Categoria,
    string? UnidadMedida,
    bool EsSerializado,
    string? Descripcion,
    bool ConvertirEnActivoCliente = false,
    string? CodigoBarras = null,
    string? Notas = null,
    decimal? CostoActual = null,
    decimal? CostoEstandar = null,
    bool? AfectoImpuesto = null,
    string? ProveedorDefecto = null
);

public record ActualizarProductoRequest(
    string Nombre,
    TipoProducto? Tipo,
    decimal? PrecioBase,
    Guid? CatalogoId,
    string? Categoria,
    string? UnidadMedida,
    bool EsSerializado,
    string? Descripcion,
    bool ConvertirEnActivoCliente = false,
    string? CodigoBarras = null,
    string? Notas = null,
    decimal? CostoActual = null,
    decimal? CostoEstandar = null,
    bool? AfectoImpuesto = null,
    string? ProveedorDefecto = null
);

public record CambiarEstadoProductoRequest(bool Activo);
