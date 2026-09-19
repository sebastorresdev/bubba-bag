using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;

/// <summary>
/// Plantilla Maestra de un Servicio / Actividad Concreta que ofrece la empresa.
/// Modela sus datos descriptivos, su checklist/secuencia de pasos, materiales teóricos y disponibilidad por sucursal.
/// </summary>
public class Servicio : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public string? Descripcion { get; private set; }

    public Guid CatalogoServicioId { get; private set; }
    public CatalogoServicio CatalogoServicio { get; private set; } = default!;

    public int DuracionEstimadaMinutos { get; private set; } = 60;
    public string? CodigoExterno { get; private set; }
    public bool Activo { get; private set; }

    // Plantilla de Tareas / Checklist secuencial
    private readonly List<ServicioPaso> _pasos = new();
    public IReadOnlyCollection<ServicioPaso> Pasos => _pasos.OrderBy(p => p.NumeroPaso).ToList().AsReadOnly();

    // Receta de Materiales Teóricos
    private readonly List<ServicioMaterial> _materialesTeoricos = new();
    public IReadOnlyCollection<ServicioMaterial> MaterialesTeoricos => _materialesTeoricos.AsReadOnly();

    // Matriz de disponibilidad por sucursal
    private readonly List<SucursalServicio> _sucursalesHabilitadas = new();
    public IReadOnlyCollection<SucursalServicio> SucursalesHabilitadas => _sucursalesHabilitadas.AsReadOnly();

    private Servicio() { }

    public static Servicio Crear(
        string codigo,
        string nombre,
        Guid catalogoServicioId,
        int duracionEstimadaMinutos = 60,
        string? descripcion = null,
        string? codigoExterno = null)
    {
        return new Servicio
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            CatalogoServicioId = catalogoServicioId,
            DuracionEstimadaMinutos = duracionEstimadaMinutos,
            Descripcion = descripcion?.Trim(),
            CodigoExterno = codigoExterno?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        Guid catalogoServicioId,
        int duracionEstimadaMinutos,
        string? descripcion,
        string? codigoExterno)
    {
        Nombre = nombre.Trim();
        CatalogoServicioId = catalogoServicioId;
        DuracionEstimadaMinutos = duracionEstimadaMinutos;
        Descripcion = descripcion?.Trim();
        CodigoExterno = codigoExterno?.Trim();
    }

    public void ConfigurarPasos(IEnumerable<ServicioPaso> pasos)
    {
        _pasos.Clear();
        _pasos.AddRange(pasos);
    }

    public void ConfigurarMaterialesTeoricos(IEnumerable<ServicioMaterial> materiales)
    {
        _materialesTeoricos.Clear();
        _materialesTeoricos.AddRange(materiales);
    }

    public void ConfigurarSucursales(IEnumerable<SucursalServicio> sucursales)
    {
        _sucursalesHabilitadas.Clear();
        _sucursalesHabilitadas.AddRange(sucursales);
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
