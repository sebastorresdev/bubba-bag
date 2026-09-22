using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Recursos;

/// <summary>
/// Representa una zona o territorio geográfico de despacho y atención (ej: 'I280010 - Huaraz').
/// </summary>
public class ZonaOperativa : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;              // 'I280010'
    public string Nombre { get; private set; } = default!;              // 'Ancash - Huaraz'
    public string? DescripcionProveedor { get; private set; }           // 'PE-I280010-PROGRAMMING...'
    public Guid SucursalId { get; private set; }                        // Sede a la que pertenece territorialmente
    public Guid? AlmacenPredeterminadoId { get; private set; }          // Almacén físico que abastece a los técnicos de esta zona
    public bool Activo { get; private set; }

    private ZonaOperativa() { }

    public static ZonaOperativa Crear(
        string codigo,
        string nombre,
        Guid sucursalId,
        Guid? almacenPredeterminadoId = null,
        string? descripcionProveedor = null)
    {
        return new ZonaOperativa
        {
            Id = Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            SucursalId = sucursalId,
            AlmacenPredeterminadoId = almacenPredeterminadoId,
            DescripcionProveedor = descripcionProveedor?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        Guid sucursalId,
        Guid? almacenPredeterminadoId,
        string? descripcionProveedor)
    {
        Nombre = nombre.Trim();
        SucursalId = sucursalId;
        AlmacenPredeterminadoId = almacenPredeterminadoId;
        DescripcionProveedor = descripcionProveedor?.Trim();
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
