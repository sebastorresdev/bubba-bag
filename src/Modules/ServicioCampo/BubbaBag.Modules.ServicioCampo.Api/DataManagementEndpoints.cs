using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.DataManagement.Dtos;
using BubbaBag.Modules.ServicioCampo.Application.DataManagement.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class DataManagementEndpoints
{
    public static void MapDataManagementEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/servicio-campo/data-management")
            .WithTags("Data Management - Importaciones");

        // 1. Obtener catálogo de entidades importables y sus metadatos
        group.MapGet("/entities", (IEntityImportMetadataService metadataService) =>
        {
            var entities = metadataService.GetAvailableEntities();
            return Results.Ok(entities);
        });

        // 2. Previsualizar archivo (XLSX o CSV) y detectar delimitadores/encabezados
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
        }).DisableAntiforgery();

        // 3. Ejecutar importación con mapeo dinámico de campos
        group.MapPost("/execute", async (
            HttpRequest httpRequest,
            HttpContext httpContext,
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
                DuplicateMode = string.IsNullOrWhiteSpace(duplicateMode) ? "Upsert" : duplicateMode,
                Delimiter = delimiter,
                QuoteChar = quoteChar,
                ColumnMapping = mapping
            };

            string currentUser = httpContext.User.FindFirst("nombre_completo")?.Value 
                ?? httpContext.User.FindFirst(ClaimTypes.Name)?.Value 
                ?? httpContext.User.FindFirst("name")?.Value 
                ?? httpContext.User.FindFirst(ClaimTypes.Email)?.Value
                ?? form["creadoPor"].ToString();

            if (string.IsNullOrWhiteSpace(currentUser) || currentUser.Equals("Usuario del Sistema", StringComparison.OrdinalIgnoreCase))
            {
                currentUser = "Sebastián Torres";
            }

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream, ct);
            memoryStream.Position = 0;

            var job = await engineService.ExecuteImportAsync(memoryStream, file.FileName, request, currentUser, ct);
            return Results.Ok(job);
        }).DisableAntiforgery();

        // 4. Historial de importaciones (My Imports / All Imports)
        group.MapGet("/imports", async (
            int? limit,
            IDataImportEngineService engineService,
            CancellationToken ct) =>
        {
            var jobs = await engineService.GetRecentJobsAsync(limit ?? 50, ct);
            return Results.Ok(jobs);
        });

        // 5. Detalle de una importación específica (con pestaña General y Fallos)
        group.MapGet("/imports/{id:guid}", async (
            Guid id,
            IDataImportEngineService engineService,
            CancellationToken ct) =>
        {
            var job = await engineService.GetJobByIdAsync(id, ct);
            if (job == null) return Results.NotFound(new { Mensaje = "Registro de importación no encontrado." });
            return Results.Ok(job);
        });

        // 6. Eliminar registro de importación
        group.MapDelete("/imports/{id:guid}", async (
            Guid id,
            IDataImportEngineService engineService,
            CancellationToken ct) =>
        {
            var deleted = await engineService.DeleteJobAsync(id, ct);
            if (!deleted) return Results.NotFound();
            return Results.NoContent();
        });
    }
}
