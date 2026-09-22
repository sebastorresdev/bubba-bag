using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Recursos;

/// <summary>
/// Representa a un técnico o cuadrilla de campo asignable a órdenes de trabajo.
/// Vincula la identidad de seguridad, el alcance geográfico y los almacenes de abastecimiento.
/// </summary>
public class RecursoTecnico : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;          // 'TEC-001'
    public string NombreCompleto { get; private set; } = default!;
    public string? DocumentoIdentidad { get; private set; }
    public string? Telefono { get; private set; }
    public string? Email { get; private set; }

    // Zona geográfica habitual en la que atiende
    public Guid ZonaOperativaId { get; private set; }
    public ZonaOperativa ZonaOperativa { get; private set; } = default!;

    // Almacén físico base (de donde recoge materiales, ej: Almacén Huaraz)
    public Guid AlmacenBaseId { get; private set; }

    // Almacén móvil propio (su camioneta / maletín)
    public Guid? AlmacenMovilId { get; private set; }

    // Vinculación opcional a cuenta de login en Seguridad (para app móvil)
    public Guid? UsuarioId { get; private set; }

    // Vinculación opcional a nómina interna en Recursos Humanos
    public Guid? EmpleadoId { get; private set; }

    // Capacidad y parámetros de despacho
    public int CapacidadMaximaOrdenesPorDia { get; private set; } = 6;
    public string? ColorHex { get; private set; }                   // Color identificador en el tablero Gantt D365

    public bool Activo { get; private set; }

    private RecursoTecnico() { }

    public static RecursoTecnico Crear(
        string codigo,
        string nombreCompleto,
        Guid zonaOperativaId,
        Guid almacenBaseId,
        Guid? almacenMovilId = null,
        Guid? usuarioId = null,
        Guid? empleadoId = null,
        string? telefono = null,
        string? documentoIdentidad = null,
        string? email = null,
        int capacidadMaximaOrdenesPorDia = 6,
        string? colorHex = "#0078d4")
    {
        return new RecursoTecnico
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            NombreCompleto = nombreCompleto.Trim(),
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
            Activo = true
        };
    }

    public void Actualizar(
        string nombreCompleto,
        Guid zonaOperativaId,
        Guid almacenBaseId,
        Guid? almacenMovilId,
        Guid? usuarioId,
        Guid? empleadoId,
        string? telefono,
        string? documentoIdentidad,
        string? email,
        int capacidadMaximaOrdenesPorDia,
        string? colorHex)
    {
        NombreCompleto = nombreCompleto.Trim();
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
    }

    public void AsignarAlmacenMovil(Guid almacenMovilId) => AlmacenMovilId = almacenMovilId;
    public void VincularUsuario(Guid? usuarioId) => UsuarioId = usuarioId;
    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
