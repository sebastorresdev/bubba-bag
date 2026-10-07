using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Domain.Configuracion;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Api;

public record ConfiguracionEmpresaDto(
    Guid Id,
    string RazonSocial,
    string? NombreComercial,
    string? Ruc,
    string? DireccionFiscal,
    string? Telefono,
    string? Email,
    string? LogoBase64,
    string? PiePaginaDocumentos,
    DateTime FechaActualizacion
);

public record ActualizarEmpresaDto(
    string RazonSocial,
    string? NombreComercial,
    string? Ruc,
    string? DireccionFiscal,
    string? Telefono,
    string? Email,
    string? LogoBase64,
    string? PiePaginaDocumentos
);

public static class EmpresaEndpoints
{
    public static void MapEmpresaEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/configuracion/empresa")
            .WithTags("Configuración - Empresa");

        // Lectura permitida a usuarios autenticados para emisión de documentos
        group.MapGet("/", ObtenerEmpresa).RequireAuthorization();

        // Modificación reservada a usuarios con acceso a seguridad / administración
        group.MapPut("/", ActualizarEmpresa).RequireAuthorization(Permissions.Seguridad.Acceso);
    }

    private static async Task<IResult> ObtenerEmpresa(IServicioCampoDbContext db, CancellationToken ct)
    {
        var empresa = await db.ConfiguracionEmpresas.FirstOrDefaultAsync(ct);
        if (empresa == null)
        {
            empresa = ConfiguracionEmpresa.CrearDefault();
            db.ConfiguracionEmpresas.Add(empresa);
            await db.SaveChangesAsync(ct);
        }

        return Results.Ok(new ConfiguracionEmpresaDto(
            empresa.Id,
            empresa.RazonSocial,
            empresa.NombreComercial,
            empresa.Ruc,
            empresa.DireccionFiscal,
            empresa.Telefono,
            empresa.Email,
            empresa.LogoBase64,
            empresa.PiePaginaDocumentos,
            empresa.FechaActualizacion
        ));
    }

    private static async Task<IResult> ActualizarEmpresa(
        ActualizarEmpresaDto dto,
        IServicioCampoDbContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.RazonSocial))
        {
            return Results.BadRequest(new { error = "La razón social es obligatoria." });
        }

        var empresa = await db.ConfiguracionEmpresas.FirstOrDefaultAsync(ct);
        if (empresa == null)
        {
            empresa = ConfiguracionEmpresa.CrearDefault();
            db.ConfiguracionEmpresas.Add(empresa);
        }

        empresa.Actualizar(
            dto.RazonSocial,
            dto.NombreComercial,
            dto.Ruc,
            dto.DireccionFiscal,
            dto.Telefono,
            dto.Email,
            dto.LogoBase64,
            dto.PiePaginaDocumentos
        );

        await db.SaveChangesAsync(ct);

        return Results.Ok(new ConfiguracionEmpresaDto(
            empresa.Id,
            empresa.RazonSocial,
            empresa.NombreComercial,
            empresa.Ruc,
            empresa.DireccionFiscal,
            empresa.Telefono,
            empresa.Email,
            empresa.LogoBase64,
            empresa.PiePaginaDocumentos,
            empresa.FechaActualizacion
        ));
    }
}
