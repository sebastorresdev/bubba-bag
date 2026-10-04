using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Define el alcance de autorización de un usuario/almacenero sobre un almacén específico.
/// Gobierna quién puede consultar existencias, despachar y recepcionar transferencias.
/// </summary>
public class UsuarioAlmacenAutorizacion : Entity<Guid>
{
    public Guid UsuarioId { get; private set; }
    public Guid AlmacenId { get; private set; }
    public virtual Almacen? Almacen { get; private set; }

    public bool PuedeConsultar { get; private set; } = true;
    public bool PuedeDespachar { get; private set; } = true;
    public bool PuedeRecepcionar { get; private set; } = true;
    public bool EsSupervisor { get; private set; } = false;         // Para resolver incidencias/diferencias
    public bool Activo { get; private set; } = true;

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private UsuarioAlmacenAutorizacion() { }

    public static UsuarioAlmacenAutorizacion Crear(
        Guid usuarioId,
        Guid almacenId,
        bool puedeConsultar = true,
        bool puedeDespachar = true,
        bool puedeRecepcionar = true,
        bool esSupervisor = false,
        Guid? id = null)
    {
        return new UsuarioAlmacenAutorizacion
        {
            Id = id ?? Guid.NewGuid(),
            UsuarioId = usuarioId,
            AlmacenId = almacenId,
            PuedeConsultar = puedeConsultar,
            PuedeDespachar = puedeDespachar,
            PuedeRecepcionar = puedeRecepcionar,
            EsSupervisor = esSupervisor,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void ActualizarPermisos(
        bool puedeConsultar,
        bool puedeDespachar,
        bool puedeRecepcionar,
        bool esSupervisor)
    {
        PuedeConsultar = puedeConsultar;
        PuedeDespachar = puedeDespachar;
        PuedeRecepcionar = puedeRecepcionar;
        EsSupervisor = esSupervisor;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Desactivar()
    {
        Activo = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activar()
    {
        Activo = true;
        UpdatedAt = DateTime.UtcNow;
    }
}
