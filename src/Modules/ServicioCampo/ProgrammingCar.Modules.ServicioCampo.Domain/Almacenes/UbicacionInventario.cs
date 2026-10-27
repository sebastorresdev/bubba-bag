using System;
using ProgrammingCar.SharedKernel;

namespace ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;

public class UbicacionInventario : Entity<Guid>
{
    public Guid AlmacenId { get; private set; }
    public Almacen Almacen { get; private set; } = default!;
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public bool EsPrincipal { get; private set; }
    public bool Activa { get; private set; } = true;

    /// <summary>
    /// Clasificación operativa de la ubicación: Disponible (operativo / despacho) o Devolución (logística inversa / cuarentena).
    /// </summary>
    public TipoUbicacion TipoUbicacion { get; private set; } = TipoUbicacion.Disponible;

    /// <summary>
    /// Ubicación padre en el mismo almacén (ej. Ubicación DISPONIBLE o DEVOLUCION raíz).
    /// </summary>
    public Guid? UbicacionPadreId { get; private set; }
    public UbicacionInventario? UbicacionPadre { get; private set; }

    private UbicacionInventario() { }

    public static UbicacionInventario Crear(
        Guid almacenId,
        string codigo,
        string nombre,
        bool principal = false,
        TipoUbicacion tipoUbicacion = TipoUbicacion.Disponible,
        Guid? ubicacionPadreId = null)
    {
        if (almacenId == Guid.Empty || string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El almacén, código y nombre de ubicación son obligatorios.");
        if (codigo.Trim().Length > 50 || nombre.Trim().Length > 150)
            throw new ArgumentException("El código admite 50 caracteres y el nombre 150.");

        return new()
        {
            Id = Guid.NewGuid(),
            AlmacenId = almacenId,
            Codigo = codigo.Trim().ToUpperInvariant(),
            Nombre = nombre.Trim(),
            TipoUbicacion = tipoUbicacion,
            UbicacionPadreId = ubicacionPadreId,
            EsPrincipal = principal,
            Activa = true
        };
    }

    public void Actualizar(string nombre, Guid? ubicacionPadreId)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la ubicación es obligatorio.", nameof(nombre));
        if (ubicacionPadreId == Id)
            throw new InvalidOperationException("Una ubicación no puede ser su propio padre.");

        Nombre = nombre.Trim();
        UbicacionPadreId = ubicacionPadreId;
    }

    public void CambiarEstado(bool activa)
    {
        if (EsPrincipal && !activa) throw new InvalidOperationException("La ubicación principal no se puede desactivar.");
        Activa = activa;
    }

    public void NormalizarPredeterminada(string codigo, string nombre, TipoUbicacion tipo, bool principal)
    {
        Codigo = codigo.Trim().ToUpperInvariant();
        Nombre = nombre.Trim();
        TipoUbicacion = tipo;
        EsPrincipal = principal;
    }
}

public enum TipoUbicacion
{
    /// <summary>
    /// Rama de existencias operativas aptas para despacho e instalación.
    /// </summary>
    Disponible = 1,

    /// <summary>
    /// Rama de existencias en logística inversa, cuarentena o retiro (solo aptas para devolución a proveedor, taller o reacondicionamiento).
    /// </summary>
    Devolucion = 2
}

public enum CondicionInventario { Utilizable = 1, Defectuoso = 2 }
