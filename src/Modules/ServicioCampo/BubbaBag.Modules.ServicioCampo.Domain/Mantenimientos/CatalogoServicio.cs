using System;
using System.Collections.Generic;
using BubbaBag.Modules.Crm.Domain.Clientes;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Agrupador de Servicios de la empresa o provisto por un Contratante (ej: Catálogo DIRECTV, Catálogo Claro, Catálogo Cámaras).
/// </summary>
public class CatalogoServicio : Entity<Guid>
{
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }
    
    // Contratante dueño del catálogo (opcional: ej. DIRECTV PERU S.R.L. o null para propio)
    public Guid? ContratanteId { get; private set; }
    public Cliente? Contratante { get; private set; }

    public bool Activo { get; private set; }

    private readonly List<Servicio> _servicios = new();
    public IReadOnlyCollection<Servicio> Servicios => _servicios.AsReadOnly();

    private CatalogoServicio() { }

    public static CatalogoServicio Crear(
        string nombre,
        Guid? contratanteId = null,
        string? descripcion = null)
    {
        return new CatalogoServicio
        {
            Id = Guid.NewGuid(),
            Nombre = nombre.Trim(),
            ContratanteId = contratanteId,
            Descripcion = descripcion?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(string nombre, Guid? contratanteId, string? descripcion)
    {
        Nombre = nombre.Trim();
        ContratanteId = contratanteId;
        Descripcion = descripcion?.Trim();
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
