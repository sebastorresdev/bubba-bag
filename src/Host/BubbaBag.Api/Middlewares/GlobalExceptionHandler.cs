using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel.Exceptions;
using BubbaBag.SharedKernel.Http;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Api.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment env)
    {
        _logger = logger;
        _env = env;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Excepción capturada por GlobalExceptionHandler: {Message}", exception.Message);

        var (statusCode, title, detail, errors) = exception switch
        {
            ValidationException valEx => (
                StatusCodes.Status400BadRequest,
                "Error de validación",
                "Uno o más campos enviados no cumplen con las reglas requeridas.",
                valEx.Errors
            ),

            BadHttpRequestException badHttpEx => (
                StatusCodes.Status400BadRequest,
                "Formato de solicitud inválido",
                badHttpEx.InnerException?.Message ?? badHttpEx.Message,
                null
            ),

            DbUpdateException dbEx when dbEx.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "23505" =>
                ResolverErrorDuplicado(pgEx),

            DbUpdateException dbEx when dbEx.InnerException != null && dbEx.InnerException.Message.Contains("22001") => (
                StatusCodes.Status400BadRequest,
                "Longitud de datos excedida",
                "Uno o más valores ingresados superan el límite de caracteres permitido por el sistema.",
                null
            ),

            DbUpdateException dbEx when dbEx.InnerException != null && dbEx.InnerException.Message.Contains("23505") => (
                StatusCodes.Status409Conflict,
                "Registro duplicado",
                "Ya existe un registro con los mismos datos únicos en el sistema.",
                null
            ),

            DbUpdateException dbEx when dbEx.InnerException != null && dbEx.InnerException.Message.Contains("23503") => (
                StatusCodes.Status409Conflict,
                "Conflicto de integridad de datos",
                "No se puede completar la operación debido a que el registro está relacionado con otros datos en el sistema.",
                null
            ),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                _env.IsDevelopment() 
                    ? $"{exception.Message}{(exception.InnerException != null ? " --> " + exception.InnerException.Message : "")}" 
                    : "Ocurrió un error inesperado al procesar la solicitud. Si el problema persiste, contacte con soporte técnico.",
                null
            )
        };

        var response = new ErrorResponse(
            statusCode,
            title,
            detail,
            errors,
            httpContext.TraceIdentifier
        );

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";

        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);

        return true;
    }

    private static (int StatusCode, string Title, string Detail, IDictionary<string, string[]>? Errors) ResolverErrorDuplicado(Npgsql.PostgresException pgEx)
    {
        var constraint = (pgEx.ConstraintName ?? string.Empty).ToLowerInvariant();
        var detail = (pgEx.Detail ?? string.Empty).ToLowerInvariant();

        if (constraint.Contains("email") || detail.Contains("email"))
        {
            return (
                StatusCodes.Status409Conflict,
                "Correo duplicado",
                "Ya existe un colaborador registrado con este correo electrónico.",
                new Dictionary<string, string[]>
                {
                    ["email"] = new[] { "Este correo electrónico ya se encuentra registrado." }
                }
            );
        }

        if (constraint.Contains("documento") || detail.Contains("documento"))
        {
            return (
                StatusCodes.Status409Conflict,
                "Documento duplicado",
                "Ya existe un colaborador registrado con este tipo y número de documento.",
                new Dictionary<string, string[]>
                {
                    ["numeroDocumento"] = new[] { "Este documento de identidad ya se encuentra registrado." }
                }
            );
        }

        return (
            StatusCodes.Status409Conflict,
            "Registro duplicado",
            $"Ya existe un registro con los mismos datos únicos ({pgEx.ConstraintName ?? "Restricción única"}).",
            null
        );
    }
}
