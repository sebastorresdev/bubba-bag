using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Recursos;

/// <summary>
/// Representa un Territorio o zona geográfica de servicio y cobertura de órdenes de trabajo (ej: 'I130010 - Trujillo Centro').
/// Define la cobertura de las órdenes y técnicos, pero NO concede permisos directos de inventario.
/// </summary>
public class Territorio : Entity<Guid>
{
    public string Codigo { get; private set; } = default!;              // Ej: 'I130010'
    public string Nombre { get; private set; } = default!;              // Ej: 'Trujillo - Trujillo Centro'
    public string? DescripcionProveedor { get; private set; }           // Ej: 'PE-I130010-PROGRAMMING...'
    public Guid UnidadOrganizativaId { get; private set; }              // Sede / Base a la que pertenece territorialmente
    public Guid? AlmacenPredeterminadoId { get; private set; }          // Almacén físico que abastece por defecto a este territorio
    public bool Activo { get; private set; }

    private Territorio() { }

    public static Territorio Crear(
        string codigo,
        string nombre,
        Guid unidadOrganizativaId,
        Guid? almacenPredeterminadoId = null,
        string? descripcionProveedor = null,
        Guid? id = null)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new ArgumentException("El código del territorio es obligatorio.", nameof(codigo));
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del territorio es obligatorio.", nameof(nombre));

        return new Territorio
        {
            Id = id ?? Guid.NewGuid(),
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            UnidadOrganizativaId = unidadOrganizativaId,
            AlmacenPredeterminadoId = almacenPredeterminadoId,
            DescripcionProveedor = descripcionProveedor?.Trim(),
            Activo = true
        };
    }

    public void Actualizar(
        string nombre,
        Guid unidadOrganizativaId,
        Guid? almacenPredeterminadoId,
        string? descripcionProveedor)
    {
        Nombre = nombre.Trim();
        UnidadOrganizativaId = unidadOrganizativaId;
        AlmacenPredeterminadoId = almacenPredeterminadoId;
        DescripcionProveedor = descripcionProveedor?.Trim();
    }

    public void Desactivar() => Activo = false;
    public void Activar() => Activo = true;
}
