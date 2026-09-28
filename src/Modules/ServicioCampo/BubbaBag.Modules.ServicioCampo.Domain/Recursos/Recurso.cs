using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Recursos;

/// <summary>
/// Representa a un Recurso de Servicio de Campo (estándar Dynamics 365 Bookable Resource).
/// Puede ser un técnico, cuadrilla, almacén, despachador, territorio o equipamiento asignable a órdenes de trabajo.
/// </summary>
public class Recurso : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;          // Ej: 'TEC-001', 'ALM-001', 'CUA-NORTE'
    public string NombreCompleto { get; private set; } = default!;
    public TipoRecurso Tipo { get; private set; } = TipoRecurso.Tecnico;

    public string? DocumentoIdentidad { get; private set; }
    public string? Telefono { get; private set; }
    public string? Email { get; private set; }

    // Zona geográfica habitual / Territorio de servicio en el que opera
    public Guid? ZonaOperativaId { get; private set; }
    public virtual ZonaOperativa? ZonaOperativa { get; private set; }

    // Almacén físico base (de donde recoge materiales o abastece)
    public Guid? AlmacenBaseId { get; private set; }

    // Almacén móvil propio (camioneta / maletín) cuando aplica
    public Guid? AlmacenMovilId { get; private set; }

    // Vinculación opcional a cuenta de login en Seguridad (para app móvil / portal)
    public Guid? UsuarioId { get; private set; }

    // Vinculación opcional a nómina interna en Recursos Humanos
    public Guid? EmpleadoId { get; private set; }

    // Capacidad y parámetros de despacho / tablero Gantt
    public int CapacidadMaximaOrdenesPorDia { get; private set; } = 6;
    public string? ColorHex { get; private set; }                   // Color identificador en el tablero Gantt / Schedule Board
    public string? Notas { get; private set; }

    public bool Activo { get; private set; }

    private Recurso() { }

    public static Recurso Crear(
        string codigo,
        string nombreCompleto,
        TipoRecurso tipo = TipoRecurso.Tecnico,
        Guid? zonaOperativaId = null,
        Guid? almacenBaseId = null,
        Guid? almacenMovilId = null,
        Guid? usuarioId = null,
        Guid? empleadoId = null,
        string? telefono = null,
        string? documentoIdentidad = null,
        string? email = null,
        int capacidadMaximaOrdenesPorDia = 6,
        string? colorHex = "#0078d4",
        string? notas = null)
    {
        return new Recurso
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            NombreCompleto = nombreCompleto.Trim(),
            Tipo = tipo,
            ZonaOperativaId = zonaOperativaId,
            AlmacenBaseId = almacenBaseId,
            AlmacenMovilId = almacenMovilId,
            UsuarioId = usuarioId,
            EmpleadoId = empleadoId,
            Telefono = telefono?.Trim(),
            DocumentoIdentidad = documentoIdentidad?.Trim(),
            Email = email?.Trim(),
            CapacidadMaximaOrdenesPorDia = Math.Max(1, capacidadMaximaOrdenesPorDia),
            ColorHex = string.IsNullOrWhiteSpace(colorHex) ? "#0078d4" : colorHex.Trim(),
            Notas = notas?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombreCompleto,
        TipoRecurso tipo,
        Guid? zonaOperativaId,
        Guid? almacenBaseId,
        Guid? almacenMovilId,
        Guid? usuarioId,
        Guid? empleadoId,
        string? telefono,
        string? documentoIdentidad,
        string? email,
        int capacidadMaximaOrdenesPorDia,
        string? colorHex,
        string? notas = null)
    {
        NombreCompleto = nombreCompleto.Trim();
        Tipo = tipo;
        ZonaOperativaId = zonaOperativaId;
        AlmacenBaseId = almacenBaseId;
        AlmacenMovilId = almacenMovilId;
        UsuarioId = usuarioId;
        EmpleadoId = empleadoId;
        Telefono = telefono?.Trim();
        DocumentoIdentidad = documentoIdentidad?.Trim();
        Email = email?.Trim();
        CapacidadMaximaOrdenesPorDia = Math.Max(1, capacidadMaximaOrdenesPorDia);
        ColorHex = string.IsNullOrWhiteSpace(colorHex) ? "#0078d4" : colorHex.Trim();
        Notas = notas?.Trim();
    }

    public void AsignarAlmacenMovil(Guid? almacenMovilId) => AlmacenMovilId = almacenMovilId;
    public void VincularUsuario(Guid? usuarioId) => UsuarioId = usuarioId;
    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
