using BubbaBag.Modules.Crm.Domain.Ubigeos;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.Crm.Domain.Clientes;

/// <summary>
/// Maestro de Clientes (Directorio Central para Facturación, Servicio y CRM).
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

    // Ubicación física y Ubigeo
    public string Direccion { get; private set; } = default!;
    public string UbigeoCodigo { get; private set; } = default!;
    public Ubigeo? Ubigeo { get; private set; }
    public string? ReferenciaUbicacion { get; private set; }
    public decimal? CoordenadaLat { get; private set; }
    public decimal? CoordenadaLng { get; private set; }

    // Clasificación de Rol y Segmentación
    public bool EsClienteFacturacion { get; private set; } // TRUE para Empresas que pagan o contratan
    public bool EsClienteServicio { get; private set; }    // TRUE para el abonado o domicilio que recibe la visita
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
        string ubigeoCodigo,
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
            UbigeoCodigo = ubigeoCodigo.Trim(),
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
        string ubigeoCodigo,
        string? referencia = null,
        decimal? lat = null,
        decimal? lng = null)
    {
        TelefonoPrincipal = telefono.Trim();
        Direccion = direccion.Trim();
        UbigeoCodigo = ubigeoCodigo.Trim();
        ReferenciaUbicacion = referencia?.Trim();
        CoordenadaLat = lat;
        CoordenadaLng = lng;
    }

    public void ActualizarClasificacion(bool esClienteFacturacion, bool esClienteServicio)
    {
        EsClienteFacturacion = esClienteFacturacion;
        EsClienteServicio = esClienteServicio;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
