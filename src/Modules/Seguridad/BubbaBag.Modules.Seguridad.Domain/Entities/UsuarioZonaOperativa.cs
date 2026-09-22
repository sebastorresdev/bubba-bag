using System;

namespace BubbaBag.Modules.Seguridad.Domain.Entities;

/// <summary>
/// Asignación de alcance operativo de backoffice/despachador a una Zona Operativa específica.
/// Permite que un usuario gestione órdenes de trabajo únicamente de las zonas asignadas.
/// </summary>
public class UsuarioZonaOperativa
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public Guid ZonaOperativaId { get; set; }
    public DateTime FechaAsignacion { get; set; } = DateTime.UtcNow;
}
