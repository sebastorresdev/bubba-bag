using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.GestionDatos.Application;
using ProgrammingCar.Modules.GestionDatos.Application.Dtos;
using ProgrammingCar.Modules.GestionDatos.Application.Services;
using ProgrammingCar.Modules.GestionDatos.Infrastructure.Database;
using ProgrammingCar.Modules.GestionDatos.Infrastructure.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using ProgrammingCar.SharedKernel.Authorization;

namespace ProgrammingCar.Modules.GestionDatos.Api;

public static class GestionDatosModule
{
    public static IServiceCollection AddGestionDatosModule(this IServiceCollection services)
    {
        services.AddScoped<IGestionDatosDbContext>(sp => sp.GetRequiredService<GestionDatosDbContext>());
        services.AddScoped<IEntityImportMetadataService, EntityImportMetadataService>();
        services.AddScoped<IDataImportEngineService, DataImportEngineService>();

        return services;
    }

    public static void MapGestionDatosEndpoints(this IEndpointRouteBuilder app)
    {
        // 1. Mapeo Canónico en Español
        MapRoutes(app, "/api/gestion-datos");

        // 2. Mapeos de Retrocompatibilidad
        MapRoutes(app, "/api/data-management");
        MapRoutes(app, "/api/servicio-campo/data-management");
    }

    private static void MapRoutes(IEndpointRouteBuilder app, string prefix)
    {
        var group = app.MapGroup(prefix)
            .WithTags("Gestión de Datos - Importaciones Masivas")
            .RequireAuthorization();

        // 1. Obtener catálogo de entidades importables
        group.MapGet("/entities", (IEntityImportMetadataService metadataService) =>
        {
            var entities = metadataService.GetAvailableEntities();
            return Results.Ok(entities);
        }).RequireAuthorization(Permissions.GestionDatos.Importar);

        // 2. Previsualizar archivo
        group.MapPost("/preview", async (
            IFormFile file,
            string? delimiter,
            string? quoteChar,
            bool? hasHeader,
            IDataImportEngineService engineService,
            CancellationToken ct) =>
        {
            if (file == null || file.Length == 0)
                return Results.BadRequest(new { Mensaje = "Debe proporcionar un archivo válido." });

            var request = new PreviewFileRequest
            {
                Delimiter = delimiter,
                QuoteChar = quoteChar,
                HasHeader = hasHeader ?? true
            };

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream, ct);
            memoryStream.Position = 0;

            var preview = await engineService.PreviewFileAsync(memoryStream, file.FileName, request, ct);
            return Results.Ok(preview);
        }).DisableAntiforgery().RequireAuthorization(Permissions.GestionDatos.Importar);

        // 3. Ejecutar importación con mapeo dinámico
        group.MapPost("/execute", async (
            HttpRequest httpRequest,
            IDataImportEngineService engineService,
            CancellationToken ct) =>
        {
            if (!httpRequest.HasFormContentType)
                return Results.BadRequest(new { Mensaje = "Debe enviar un formulario multipart/form-data." });

            var form = await httpRequest.ReadFormAsync(ct);
            var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
            if (file == null || file.Length == 0)
                return Results.BadRequest(new { Mensaje = "Debe proporcionar un archivo válido." });

            string entityName = form["entityName"].ToString();
            if (string.IsNullOrWhiteSpace(entityName))
                entityName = httpRequest.Query["entityName"].ToString();

            if (string.IsNullOrWhiteSpace(entityName))
                return Results.BadRequest(new { Mensaje = "Debe especificar la entidad destino (entityName)." });

            string duplicateMode = form["duplicateMode"].ToString();
            if (string.IsNullOrWhiteSpace(duplicateMode))
                duplicateMode = httpRequest.Query["duplicateMode"].ToString();

            string delimiter = form["delimiter"].ToString();
            string quoteChar = form["quoteChar"].ToString();
            string columnMappingJson = form["columnMappingJson"].ToString();

            Dictionary<string, string> mapping = new(StringComparer.OrdinalIgnoreCase);
            if (!string.IsNullOrWhiteSpace(columnMappingJson))
            {
                try
                {
                    mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(columnMappingJson) ?? mapping;
                }
                catch (Exception ex)
                {
                    return Results.BadRequest(new { Mensaje = $"Formato de mapeo inválido: {ex.Message}" });
                }
            }

            var request = new ExecuteImportRequestDto
            {
                EntityName = entityName,
                OperacionId = Guid.TryParse(form["operacionId"], out var operacionId) ? operacionId : null,
                DuplicateMode = string.IsNullOrWhiteSpace(duplicateMode) ? "Upsert" : duplicateMode,
                Delimiter = delimiter,
                QuoteChar = quoteChar,
                ColumnMapping = mapping
            };

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream, ct);
            memoryStream.Position = 0;

            DataImportJobDto job;
            try { job = await engineService.ExecuteImportAsync(memoryStream, file.FileName, request, ct); }
            catch (InvalidOperationException ex) { return Results.Conflict(new { Mensaje = ex.Message }); }
            return Results.Ok(job);
        }).DisableAntiforgery().RequireAuthorization(Permissions.GestionDatos.Importar);

        // 4. Historial de importaciones
        group.MapGet("/imports", async (
            int? limit,
            IDataImportEngineService engineService,
            CancellationToken ct) =>
        {
            var jobs = await engineService.GetRecentJobsAsync(limit ?? 50, ct);
            return Results.Ok(jobs);
        }).RequireAuthorization(Permissions.GestionDatos.HistorialVer);

        // 5. Detalle de una importación
        group.MapGet("/imports/{id:guid}", async (
            Guid id,
            IDataImportEngineService engineService,
            CancellationToken ct) =>
        {
            var job = await engineService.GetJobByIdAsync(id, ct);
            if (job == null) return Results.NotFound(new { Mensaje = "Registro de importación no encontrado." });
            return Results.Ok(job);
        }).RequireAuthorization(Permissions.GestionDatos.HistorialVer);

        // 6. Eliminar registro de importación
        group.MapDelete("/imports/{id:guid}", async (
            Guid id,
            IDataImportEngineService engineService,
            CancellationToken ct) =>
        {
            bool deleted;
            try { deleted = await engineService.DeleteJobAsync(id, ct); }
            catch (InvalidOperationException ex) { return Results.Conflict(new { Mensaje = ex.Message }); }
            if (!deleted) return Results.NotFound();
            return Results.NoContent();
        }).RequireAuthorization(Permissions.GestionDatos.HistorialEliminar);
    }
}
