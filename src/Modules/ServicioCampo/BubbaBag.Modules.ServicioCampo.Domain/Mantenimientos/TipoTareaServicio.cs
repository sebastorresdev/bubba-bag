using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Catálogo de Tipos de Tarea / Subtareas de Servicio (Incident Types de Dynamics 365).
/// Cada tarea pertenece a un Cliente Facturable / Contratante (ej: DIRECTV, Claro, Venta Propia).
/// Ejemplos: 'IB01' (Instalación Básica), 'MB01' (Mudanza), 'S06' (Avería Decos), 'ENC01' (Envío Encomienda).
/// </summary>
public class TipoTareaServicio : Entity<Guid>
{
    public string CodigoTarea { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public Guid? ClienteFacturacionId { get; private set; }
    public Cliente? ClienteFacturacion { get; private set; }
    public int DuracionEstimadaMinutos { get; private set; }
    public bool Activo { get; private set; }

    private TipoTareaServicio() { }

    public static TipoTareaServicio Crear(
        string codigoTarea,
        string nombre,
        Guid? clienteFacturacionId,
        int duracionMinutos = 60)
    {
        return new TipoTareaServicio
        {
            Id = Guid.NewGuid(),
            CodigoTarea = codigoTarea.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            ClienteFacturacionId = clienteFacturacionId,
            DuracionEstimadaMinutos = duracionMinutos,
            Activo = true
        };
    }

    public void Actualizar(string nombre, Guid? clienteFacturacionId, int duracionMinutos)
    {
        Nombre = nombre.Trim();
        ClienteFacturacionId = clienteFacturacionId;
        DuracionEstimadaMinutos = duracionMinutos;
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
