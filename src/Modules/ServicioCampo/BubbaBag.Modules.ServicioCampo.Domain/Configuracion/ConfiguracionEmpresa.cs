using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Configuracion;

public class ConfiguracionEmpresa : Entity<Guid>
{
    public string RazonSocial { get; private set; } = "Mi Empresa S.A.C.";
    public string? NombreComercial { get; private set; }
    public string? Ruc { get; private set; }
    public string? DireccionFiscal { get; private set; }
    public string? Telefono { get; private set; }
    public string? Email { get; private set; }
    public string? LogoBase64 { get; private set; }
    public string? PiePaginaDocumentos { get; private set; }
    public DateTime FechaActualizacion { get; private set; } = DateTime.UtcNow;

    private ConfiguracionEmpresa() { }

    public static ConfiguracionEmpresa CrearDefault()
    {
        return new ConfiguracionEmpresa
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            RazonSocial = "BUBBA BAG LOGISTICS",
            NombreComercial = "BubbaBag",
            Ruc = "20601234567",
            DireccionFiscal = "Av. Principal 123, Lima, Perú",
            Telefono = "(01) 555-1234",
            Email = "contacto@bubbabag.com",
            PiePaginaDocumentos = "Documento oficial de control y custodia de existencias.",
            FechaActualizacion = DateTime.UtcNow
        };
    }

    public void Actualizar(
        string razonSocial,
        string? nombreComercial,
        string? ruc,
        string? direccionFiscal,
        string? telefono,
        string? email,
        string? logoBase64,
        string? piePaginaDocumentos)
    {
        if (string.IsNullOrWhiteSpace(razonSocial))
            throw new ArgumentException("La razón social es obligatoria.");

        RazonSocial = razonSocial.Trim();
        NombreComercial = string.IsNullOrWhiteSpace(nombreComercial) ? null : nombreComercial.Trim();
        Ruc = string.IsNullOrWhiteSpace(ruc) ? null : ruc.Trim();
        DireccionFiscal = string.IsNullOrWhiteSpace(direccionFiscal) ? null : direccionFiscal.Trim();
        Telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim();
        Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim();
        LogoBase64 = string.IsNullOrWhiteSpace(logoBase64) ? null : logoBase64.Trim();
        PiePaginaDocumentos = string.IsNullOrWhiteSpace(piePaginaDocumentos) ? null : piePaginaDocumentos.Trim();
        FechaActualizacion = DateTime.UtcNow;
    }
}
