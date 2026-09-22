using System;

namespace BubbaBag.Modules.Seguridad.Domain.Entities;

/// <summary>
/// Asignación de permisos de almacén a un usuario (ej. Almacenero, Despachador de materiales).
/// Permite controlar a qué almacenes físicos o móviles tiene acceso para despachos y liquidaciones.
/// </summary>
public class UsuarioAlmacen
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public Guid AlmacenId { get; set; }
    public bool EsPrincipal { get; set; }
    public DateTime FechaAsignacion { get; set; } = DateTime.UtcNow;
}
