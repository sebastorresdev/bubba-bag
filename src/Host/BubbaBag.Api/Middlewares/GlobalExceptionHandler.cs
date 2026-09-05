using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel.Exceptions;
using BubbaBag.SharedKernel.Http;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Api.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
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

            DbUpdateException dbEx when dbEx.InnerException != null && dbEx.InnerException.Message.Contains("22001") => (
                StatusCodes.Status400BadRequest,
                "Longitud de datos excedida",
                "Uno o más valores ingresados superan el límite de caracteres permitido por el sistema.",
                null
            ),

            DbUpdateException dbEx when dbEx.InnerException != null && dbEx.InnerException.Message.Contains("23505") => (
                StatusCodes.Status409Conflict,
                "Registro duplicado",
                "Ya existe un registro con los mismos datos únicos (por ejemplo documento o correo electrónico).",
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
                "Ocurrió un error inesperado al procesar la solicitud. Si el problema persiste, contacte con soporte técnico.",
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
}
