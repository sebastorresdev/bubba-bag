using System;
using System.Collections.Generic;
using ProgrammingCar.Modules.ServicioCampo.Domain.Ubigeos;
using ProgrammingCar.SharedKernel;

namespace ProgrammingCar.Modules.ServicioCampo.Domain.Clientes;

/// <summary>
/// Maestro de Cuentas / Clientes (Abonado o Suscriptor de Servicio y Facturación).
/// </summary>
public class Cliente : Entity<Guid>
{
    public string CodigoCliente { get; private set; } = default!;
    public string? CodigoExterno { get; private set; }
    public string TipoPersona { get; private set; } = "NATURAL"; // Inferido automáticamente o heredado
    
    // Identificación unificada (RUC / DNI / CE)
    public string TipoDocumento { get; private set; } = "DNI";
    public string DocumentoIdentidad { get; private set; } = default!;
    public string Nombres { get; private set; } = default!;
    public string? Apellidos { get; private set; }
    public string? RazonSocial { get; private set; }

    // Contacto directo y Contacto Principal vinculado
    public string TelefonoPrincipal { get; private set; } = default!;
    public string? TelefonoSecundario { get; private set; }
    public string? Email { get; private set; }
    public Guid? ContactoPrincipalId { get; private set; }
    public Contacto? ContactoPrincipal { get; private set; }
    public ICollection<Contacto> Contactos { get; private set; } = new List<Contacto>();

    // Ubicación física y Ubigeo
    public string Direccion { get; private set; } = default!;
    public string UbigeoCodigo { get; private set; } = default!;
    public Ubigeo? Ubigeo { get; private set; }
    public string? ReferenciaUbicacion { get; private set; }
    public decimal? CoordenadaLat { get; private set; }
    public decimal? CoordenadaLng { get; private set; }

    // Clasificación de Rol y Segmentación
    public bool EsClienteFacturacion { get; private set; }
    public bool EsClienteServicio { get; private set; }
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
        string? tipoDocumento = null,
        string? tipoPersona = null,
        string? razonSocial = null,
        string? telefonoSecundario = null,
        string? email = null,
        string? referencia = null,
        decimal? lat = null,
        decimal? lng = null,
        Guid? contactoPrincipalId = null,
        string? codigoExterno = null)
    {
        var docTrim = documentoIdentidad.Trim();
        var esRuc = docTrim.Length == 11 && (docTrim.StartsWith("20") || docTrim.StartsWith("10"));
        var tipoDocInferido = !string.IsNullOrWhiteSpace(tipoDocumento)
            ? tipoDocumento.Trim().ToUpperInvariant()
            : (esRuc ? "RUC" : (docTrim.Length == 8 ? "DNI" : "CE"));
        var tipoPersInferida = !string.IsNullOrWhiteSpace(tipoPersona)
            ? tipoPersona.Trim().ToUpperInvariant()
            : (docTrim.Length == 11 && docTrim.StartsWith("20") ? "JURIDICA" : "NATURAL");

        var nombreUnificado = !string.IsNullOrWhiteSpace(nombres)
            ? nombres.Trim()
            : (razonSocial?.Trim() ?? string.Empty);

        return new Cliente
        {
            Id = Guid.NewGuid(),
            CodigoCliente = codigoCliente.Trim().ToUpperInvariant(),
            CodigoExterno = string.IsNullOrWhiteSpace(codigoExterno) ? null : codigoExterno.Trim().ToUpperInvariant(),
            DocumentoIdentidad = docTrim,
            Nombres = nombreUnificado,
            Apellidos = string.IsNullOrWhiteSpace(apellidos) ? null : apellidos.Trim(),
            TelefonoPrincipal = telefonoPrincipal.Trim(),
            Direccion = direccion.Trim(),
            UbigeoCodigo = ubigeoCodigo.Trim(),
            EsClienteFacturacion = esClienteFacturacion,
            EsClienteServicio = esClienteServicio,
            TipoDocumento = tipoDocInferido,
            TipoPersona = tipoPersInferida,
            RazonSocial = string.IsNullOrWhiteSpace(razonSocial) ? nombreUnificado : razonSocial.Trim(),
            TelefonoSecundario = string.IsNullOrWhiteSpace(telefonoSecundario) ? null : telefonoSecundario.Trim(),
            Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant(),
            ReferenciaUbicacion = string.IsNullOrWhiteSpace(referencia) ? null : referencia.Trim(),
            CoordenadaLat = lat,
            CoordenadaLng = lng,
            ContactoPrincipalId = contactoPrincipalId,
            Activo = true
        };
    }

    public void ActualizarContactoYDireccion(
        string telefono,
        string direccion,
        string ubigeoCodigo,
        string? referencia = null,
        decimal? lat = null,
        decimal? lng = null,
        string? nombreCuenta = null,
        string? documentoIdentidad = null,
        string? telefonoSecundario = null,
        string? email = null,
        Guid? contactoPrincipalId = null,
        string? codigoExterno = null)
    {
        if (!string.IsNullOrWhiteSpace(nombreCuenta))
        {
            Nombres = nombreCuenta.Trim();
            RazonSocial = nombreCuenta.Trim();
            Apellidos = null;
        }
        if (!string.IsNullOrWhiteSpace(documentoIdentidad))
        {
            var docTrim = documentoIdentidad.Trim();
            DocumentoIdentidad = docTrim;
            TipoDocumento = docTrim.Length == 11 ? "RUC" : (docTrim.Length == 8 ? "DNI" : "CE");
            TipoPersona = docTrim.Length == 11 && docTrim.StartsWith("20") ? "JURIDICA" : "NATURAL";
        }
        CodigoExterno = string.IsNullOrWhiteSpace(codigoExterno) ? null : codigoExterno.Trim().ToUpperInvariant();
        TelefonoPrincipal = telefono.Trim();
        TelefonoSecundario = string.IsNullOrWhiteSpace(telefonoSecundario) ? null : telefonoSecundario.Trim();
        Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
        ContactoPrincipalId = contactoPrincipalId;
        Direccion = direccion.Trim();
        UbigeoCodigo = ubigeoCodigo.Trim();
        ReferenciaUbicacion = string.IsNullOrWhiteSpace(referencia) ? null : referencia.Trim();
        CoordenadaLat = lat;
        CoordenadaLng = lng;
    }

    public void Actualizar(
        string nombres,
        string? apellidos,
        string telefonoPrincipal,
        string direccion,
        string ubigeoCodigo,
        string tipoDocumento = "DNI",
        string tipoPersona = "NATURAL",
        string? razonSocial = null,
        string? telefonoSecundario = null,
        string? email = null,
        string? referencia = null)
    {
        Nombres = nombres.Trim();
        Apellidos = apellidos?.Trim();
        TelefonoPrincipal = telefonoPrincipal.Trim();
        Direccion = direccion.Trim();
        UbigeoCodigo = ubigeoCodigo.Trim();
        TipoDocumento = tipoDocumento.Trim().ToUpperInvariant();
        TipoPersona = tipoPersona.Trim().ToUpperInvariant();
        RazonSocial = razonSocial?.Trim() ?? nombres.Trim();
        TelefonoSecundario = telefonoSecundario?.Trim();
        Email = email?.Trim().ToLowerInvariant();
        ReferenciaUbicacion = referencia?.Trim();
    }

    public void ActualizarClasificacion(bool esClienteFacturacion, bool esClienteServicio)
    {
        EsClienteFacturacion = esClienteFacturacion;
        EsClienteServicio = esClienteServicio;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
