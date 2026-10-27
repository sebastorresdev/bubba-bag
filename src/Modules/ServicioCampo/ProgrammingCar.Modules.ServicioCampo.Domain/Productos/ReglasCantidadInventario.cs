namespace ProgrammingCar.Modules.ServicioCampo.Domain.Productos;

public static class ReglasCantidadInventario
{
    public static bool EsValida(Producto producto, decimal cantidad) => cantidad > 0 && cantidad <= 999999999.99999m
        && decimal.Round(cantidad, Math.Clamp(producto.DecimalesCantidad, 0, 5)) == cantidad
        && (!producto.EsSerializado || decimal.Truncate(cantidad) == cantidad);
}
