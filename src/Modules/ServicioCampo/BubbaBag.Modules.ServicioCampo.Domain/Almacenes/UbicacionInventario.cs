using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

public class UbicacionInventario : Entity<Guid>
{
    public Guid AlmacenId { get; private set; }
    public Almacen Almacen { get; private set; } = default!;
    public string Codigo { get; private set; } = default!;
    public string Nombre { get; private set; } = default!;
    public bool EsPrincipal { get; private set; }
    public bool Activa { get; private set; } = true;

    private UbicacionInventario() { }

    public static UbicacionInventario Crear(Guid almacenId, string codigo, string nombre, bool principal = false)
    {
        if (almacenId == Guid.Empty || string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El almacén, código y nombre de ubicación son obligatorios.");
        if (codigo.Trim().Length > 50 || nombre.Trim().Length > 150)
            throw new ArgumentException("El código admite 50 caracteres y el nombre 150.");
        return new() { Id = Guid.NewGuid(), AlmacenId = almacenId, Codigo = codigo.Trim().ToUpperInvariant(), Nombre = nombre.Trim(), EsPrincipal = principal };
    }

    public void CambiarEstado(bool activa)
    {
        if (EsPrincipal && !activa) throw new InvalidOperationException("La ubicación principal no se puede desactivar.");
        Activa = activa;
    }
}

public enum CondicionInventario { Utilizable = 1, Defectuoso = 2 }
