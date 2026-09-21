using System;
using System.Collections.Generic;
using BubbaBag.Modules.Crm.Domain.Clientes;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Catálogo de Servicios de la empresa o provisto por un Cliente (ej: Catálogo DIRECTV, Catálogo Claro, Catálogo Cámaras).
/// </summary>
public class CatalogoServicio : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    
    // Cliente dueño del catálogo (opcional: ej. DIRECTV PERU S.R.L. o null para catálogo propio)
    public Guid? ClienteId { get; private set; }
    public Cliente? Cliente { get; private set; }

    public bool Activo { get; private set; }

    private readonly List<Servicio> _servicios = new();
    public IReadOnlyCollection<Servicio> Servicios => _servicios.AsReadOnly();

    private CatalogoServicio() { }

    public static CatalogoServicio Crear(
        string nombre,
        Guid? clienteId = null,
        string? descripcion = null)
    {
        return new CatalogoServicio
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            ClienteId = clienteId,
            Descripcion = descripcion?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(string nombre, Guid? clienteId, string? descripcion)
    {
        Nombre = nombre.Trim();
        ClienteId = clienteId;
        Descripcion = descripcion?.Trim();
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
