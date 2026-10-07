using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Documento principal que controla el envío, tránsito y saldo pendiente entre almacenes.
/// </summary>
public class Transferencia : Entity<Guid>
{
    public Guid? UbicacionOrigenId { get; private set; }
    public Guid? UbicacionDestinoId { get; private set; }
    public Guid OperacionId { get; private set; }
    public DateTime FechaReal { get; private set; }
    public Guid CreadoPorId { get; private set; }
    public string? CreadoPorNombre { get; private set; }
    public string Numero { get; private set; } = default!;          // Ej: 'TRF-20261001-0001'
    public Guid AlmacenOrigenId { get; private set; }
    public virtual Almacen? AlmacenOrigen { get; private set; }

    public Guid AlmacenDestinoId { get; private set; }
    public virtual Almacen? AlmacenDestino { get; private set; }

    // Congelamos las Unidades Organizativas al momento de la operación para trazabilidad histórica
    public Guid UnidadOrganizativaOrigenId { get; private set; }
    public Guid UnidadOrganizativaDestinoId { get; private set; }

    public ModalidadTransferencia Modalidad { get; private set; }
    public EstadoTransferencia Estado { get; private set; }

    // Fechas
    public DateTime FechaRegistro { get; private set; }
    public DateTime? FechaDespacho { get; private set; }
    public DateTime? FechaCierre { get; private set; }

    // Responsable y referencias documentarias
    public Guid? DespachadoPorId { get; private set; }
    public string? DespachadoPorNombre { get; private set; }
    public string? NumeroGuiaRemision { get; private set; }
    public string? Observaciones { get; private set; }

    public virtual ICollection<TransferenciaDetalle> Lineas { get; private set; } = new List<TransferenciaDetalle>();
    public virtual ICollection<RecepcionTransferencia> Recepciones { get; private set; } = new List<RecepcionTransferencia>();

    private Transferencia() { }

    public static Transferencia Crear(
        string numero,
        Guid almacenOrigenId,
        Guid almacenDestinoId,
        Guid unidadOrganizativaOrigenId,
        Guid unidadOrganizativaDestinoId,
        ModalidadTransferencia modalidad,
        Guid creadoPorId,
        string? creadoPorNombre,
        string? observaciones = null,
        string? numeroGuiaRemision = null,
        Guid ubicacionOrigenId = default, Guid ubicacionDestinoId = default, Guid operacionId = default, DateTime? fechaReal = null)
    {
        if (ubicacionOrigenId == Guid.Empty || ubicacionDestinoId == Guid.Empty || ubicacionOrigenId == ubicacionDestinoId)
            throw new ArgumentException("El almacén de origen y destino no pueden ser el mismo.");

        return new Transferencia
        {
            Id = Guid.NewGuid(),
            UbicacionOrigenId = ubicacionOrigenId,
            UbicacionDestinoId = ubicacionDestinoId,
            OperacionId = operacionId == Guid.Empty ? Guid.NewGuid() : operacionId,
            FechaReal = fechaReal ?? DateTime.UtcNow,
            CreadoPorId = creadoPorId,
            CreadoPorNombre = creadoPorNombre,
            Numero = numero.Trim().ToUpperInvariant(),
            AlmacenOrigenId = almacenOrigenId,
            AlmacenDestinoId = almacenDestinoId,
            UnidadOrganizativaOrigenId = unidadOrganizativaOrigenId,
            UnidadOrganizativaDestinoId = unidadOrganizativaDestinoId,
            Modalidad = modalidad,
            Estado = EstadoTransferencia.Borrador,
            FechaRegistro = DateTime.UtcNow,

            Observaciones = observaciones?.Trim(),
            NumeroGuiaRemision = numeroGuiaRemision?.Trim()
        };
    }

    public void ActualizarBorrador(string? observaciones, string? numeroGuiaRemision = null)
    {
        if (Estado != EstadoTransferencia.Borrador)
            throw new InvalidOperationException("Solo se pueden modificar los datos de una transferencia en estado Borrador.");
        Observaciones = observaciones?.Trim();
        if (!string.IsNullOrWhiteSpace(numeroGuiaRemision))
            NumeroGuiaRemision = numeroGuiaRemision.Trim().ToUpperInvariant();
    }

    public TransferenciaDetalle AgregarLinea(Guid productoId, decimal cantidad, CondicionInventario condicion = CondicionInventario.Utilizable, Guid? unidadMedidaId = null, string? unidadMedidaNombre = null)
    {
        if (Estado != EstadoTransferencia.Borrador)
            throw new InvalidOperationException("Solo se pueden agregar líneas a una transferencia en estado Borrador.");

        var detalle = TransferenciaDetalle.Crear(Id, productoId, cantidad, condicion, unidadMedidaId, unidadMedidaNombre);
        Lineas.Add(detalle);
        return detalle;
    }

    public void Despachar(Guid despachadorId, string? despachadorNombre, string? guiaRemision = null)
    {
        if (Estado != EstadoTransferencia.Borrador)
            throw new InvalidOperationException("Solo se puede despachar una transferencia en estado Borrador.");
        if (!Lineas.Any())
            throw new InvalidOperationException("La transferencia debe contener al menos un producto.");

        DespachadoPorId = despachadorId;
        DespachadoPorNombre = despachadorNombre;
        NumeroGuiaRemision = string.IsNullOrWhiteSpace(guiaRemision) ? NumeroGuiaRemision : guiaRemision.Trim();
        FechaDespacho = DateTime.UtcNow;

        if (Modalidad == ModalidadTransferencia.Inmediata)
        {
            // Entrega presencial mano a mano en ventanilla: cierre directo sin tránsito
            Estado = EstadoTransferencia.Cerrada;
            FechaCierre = DateTime.UtcNow;
            foreach (var linea in Lineas)
            {
                linea.RegistrarRecepcion(linea.CantidadEnviada);
                foreach (var serie in linea.Series) serie.MarcarRecibida();
            }
        }
        else
        {
            // Mercadería en carretera hacia otra sede física: queda en tránsito
            Estado = EstadoTransferencia.EnTransito;
        }
    }

    public void ActualizarEstadoPorRecepciones()
    {
        if (Estado == EstadoTransferencia.Cancelada || Estado == EstadoTransferencia.Borrador)
            return;

        var totalPendiente = Lineas.Sum(l => l.CantidadPendiente);
        if (totalPendiente == 0)
        {
            Estado = EstadoTransferencia.Cerrada;
            FechaCierre = DateTime.UtcNow;
        }
        else
        {
            var totalRecibido = Lineas.Sum(l => l.CantidadRecibida);
            Estado = totalRecibido > 0 ? EstadoTransferencia.ParcialmenteRecibida : EstadoTransferencia.EnTransito;
        }
    }

    public void Cancelar()
    {
        if (Estado != EstadoTransferencia.Borrador)
            throw new InvalidOperationException("Solo se puede cancelar una transferencia que no haya sido despachada.");

        Estado = EstadoTransferencia.Cancelada;
    }
}
