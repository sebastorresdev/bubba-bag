using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.FieldService.Domain.Clientes;

/// <summary>
/// Maestro de Clientes (Unificado para Cliente de Facturación y Cliente de Servicio).
/// </summary>
public class Cliente : Entity<Guid>
{
    public string CodigoCliente { get; private set; } = default!;
    public string TipoPersona { get; private set; } = "NATURAL"; // 'NATURAL', 'JURIDICA'
    
    // Identificación
    public string TipoDocumento { get; private set; } = "DNI";    // 'DNI', 'RUC', 'CE', 'PASAPORTE'
    public string DocumentoIdentidad { get; private set; } = default!;
    public string Nombres { get; private set; } = default!;
    public string? Apellidos { get; private set; }
    public string? RazonSocial { get; private set; }

    // Contacto
    public string TelefonoPrincipal { get; private set; } = default!;
    public string? TelefonoSecundario { get; private set; }
    public string? Email { get; private set; }

    // Ubicación física
    public string Direccion { get; private set; } = default!;
    public string Distrito { get; private set; } = default!;
    public string Provincia { get; private set; } = default!;
    public string Departamento { get; private set; } = default!;
    public string? ReferenciaUbicacion { get; private set; }
    public decimal? CoordenadaLat { get; private set; }
    public decimal? CoordenadaLng { get; private set; }

    // Clasificación de Rol
    public bool EsClienteFacturacion { get; private set; } // TRUE para DIRECTV o Empresas que pagan
    public bool EsClienteServicio { get; private set; }    // TRUE para el vecino o domicilio real que recibe la visita
    public bool Activo { get; private set; }

    public string NombreCompletoODenominacion => 
        !string.IsNullOrWhiteSpace(RazonSocial) ? RazonSocial : $"{Nombres} {Apellidos}".Trim();

    private Cliente() { }

    public static Cliente Crear(
        string codigoCliente,
        string documentoIdentidad,
        string nombres,
        string? apellidos,
        string telefonoPrincipal,
        string direccion,
        string distrito,
        string provincia,
        string departamento,
        bool esClienteFacturacion = false,
        bool esClienteServicio = true,
        string tipoDocumento = "DNI",
        string tipoPersona = "NATURAL",
        string? razonSocial = null,
        string? telefonoSecundario = null,
        string? email = null,
        string? referencia = null,
        decimal? lat = null,
        decimal? lng = null)
    {
        return new Cliente
        {
            Id = Guid.NewGuid(),
            CodigoCliente = codigoCliente.Trim().ToUpperInvariant(),
            DocumentoIdentidad = documentoIdentidad.Trim(),
            Nombres = nombres.Trim(),
            Apellidos = apellidos?.Trim(),
            TelefonoPrincipal = telefonoPrincipal.Trim(),
            Direccion = direccion.Trim(),
            Distrito = distrito.Trim(),
            Provincia = provincia.Trim(),
            Departamento = departamento.Trim(),
            EsClienteFacturacion = esClienteFacturacion,
            EsClienteServicio = esClienteServicio,
            TipoDocumento = tipoDocumento.Trim().ToUpperInvariant(),
            TipoPersona = tipoPersona.Trim().ToUpperInvariant(),
            RazonSocial = razonSocial?.Trim(),
            TelefonoSecundario = telefonoSecundario?.Trim(),
            Email = email?.Trim().ToLowerInvariant(),
            ReferenciaUbicacion = referencia?.Trim(),
            CoordenadaLat = lat,
            CoordenadaLng = lng,
            Activo = true
        };
    }

    public void ActualizarContactoYDireccion(
        string telefono,
        string direccion,
        string distrito,
        string provincia,
        string departamento,
        string? referencia = null,
        decimal? lat = null,
        decimal? lng = null)
    {
        TelefonoPrincipal = telefono.Trim();
        Direccion = direccion.Trim();
        Distrito = distrito.Trim();
        Provincia = provincia.Trim();
        Departamento = departamento.Trim();
        ReferenciaUbicacion = referencia?.Trim();
        CoordenadaLat = lat;
        CoordenadaLng = lng;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
