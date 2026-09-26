using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Productos;

/// <summary>
/// Elemento de Lista de Precios que asocia un Producto, su Unidad de Medida y el Precio/Monto pactado en dicha lista.
/// Equivalente a la entidad 'ProductPriceLevel' (Price List Item) de Microsoft Dynamics 365.
/// </summary>
public class ElementoListaPrecios : Entity<Guid>
{
    public Guid ListaPreciosId { get; private set; }
    public virtual ListaPrecios ListaPrecios { get; private set; } = default!;

    public Guid ProductoId { get; private set; }
    public virtual Producto Producto { get; private set; } = default!;

    public Guid? UnidadMedidaId { get; private set; }
    public virtual UnidadMedida? UnidadMedida { get; private set; }

    public decimal Monto { get; private set; }
    public MetodoFijacionPrecio MetodoFijacion { get; private set; } = MetodoFijacionPrecio.ImporteDivisa;

    private ElementoListaPrecios() { }

    public static ElementoListaPrecios Crear(
        Guid listaPreciosId,
        Guid productoId,
        decimal monto,
        Guid? unidadMedidaId = null,
        MetodoFijacionPrecio metodoFijacion = MetodoFijacionPrecio.ImporteDivisa)
    {
        return new ElementoListaPrecios
        {
            Id = Guid.NewGuid(),
            ListaPreciosId = listaPreciosId,
            ProductoId = productoId,
            UnidadMedidaId = unidadMedidaId,
            Monto = Math.Max(0, monto),
            MetodoFijacion = metodoFijacion
        };
    }

    public void Actualizar(decimal monto, Guid? unidadMedidaId, MetodoFijacionPrecio metodoFijacion)
    {
        Monto = Math.Max(0, monto);
        UnidadMedidaId = unidadMedidaId;
        MetodoFijacion = metodoFijacion;
    }
}
