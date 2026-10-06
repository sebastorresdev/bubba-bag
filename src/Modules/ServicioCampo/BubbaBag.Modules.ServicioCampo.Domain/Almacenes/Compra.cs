using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.ServicioCampo.Domain.Almacenes;

public class Compra : Entity<Guid>
{
    public string Numero { get; private set; } = default!;
    public string Proveedor { get; private set; } = default!;
    public string TipoDocumento { get; private set; } = default!;
    public string NumeroDocumento { get; private set; } = default!;
    public DateOnly FechaDocumento { get; private set; }
    public string Moneda { get; private set; } = default!;
    public Guid? AlmacenId { get; private set; }
    public Almacen? Almacen { get; private set; }
    public string Estado { get; private set; } = "Borrador";
    public string? Observacion { get; private set; }
    public string LineasJson { get; private set; } = default!;
    public decimal Total { get; private set; }
    public Guid UsuarioId { get; private set; }
    public DateTime FechaRegistro { get; private set; }
    public Guid? UsuarioRecepcionId { get; private set; }
    public DateTime? FechaRecepcion { get; private set; }

    private Compra() { }

    public static Compra Registrar(Guid id, string proveedor, string tipoDocumento, string documento,
        DateOnly fecha, string moneda, Guid? almacenId, string? observacion, string lineasJson, decimal total, Guid usuarioId)
        => new()
        {
            Id = id, Numero = $"CMP-{DateTime.UtcNow:yyyyMMdd}-{id.ToString("N")[..8].ToUpperInvariant()}",
            Proveedor = proveedor.Trim().ToUpperInvariant(), TipoDocumento = tipoDocumento,
            NumeroDocumento = documento.Trim().ToUpperInvariant(), FechaDocumento = fecha,
            Moneda = moneda, AlmacenId = almacenId, Observacion = observacion?.Trim(),
            LineasJson = lineasJson, Total = total, UsuarioId = usuarioId, FechaRegistro = DateTime.UtcNow
        };

    public void Actualizar(string proveedor, string tipoDocumento, string documento, DateOnly fecha,
        string moneda, Guid? almacenId, string? observacion, string lineasJson, decimal total)
    {
        if (Estado is "Enviada" or "Recibida") throw new InvalidOperationException("La compra enviada o recibida no se puede editar.");
        Proveedor = proveedor.Trim().ToUpperInvariant(); TipoDocumento = tipoDocumento;
        NumeroDocumento = documento.Trim().ToUpperInvariant(); FechaDocumento = fecha;
        Moneda = moneda; AlmacenId = almacenId; Observacion = observacion?.Trim(); LineasJson = lineasJson; Total = total;
    }

    public void Solicitar()
    {
        if (Estado != "Borrador") throw new InvalidOperationException("La compra debe estar en borrador.");
        Estado = "Solicitada";
    }

    public void Enviar()
    {
        if (Estado != "Solicitada") throw new InvalidOperationException("La compra debe estar solicitada.");
        Estado = "Enviada";
    }

    public void Recepcionar(Guid? usuarioRecepcionId = null, bool conFaltantes = false, string? lineasActualizadasJson = null)
    {
        if (Estado != "Enviada") throw new InvalidOperationException("La compra debe estar enviada.");
        Estado = conFaltantes ? "Recibida con faltantes" : "Recibida";
        UsuarioRecepcionId = usuarioRecepcionId;
        FechaRecepcion = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(lineasActualizadasJson))
        {
            LineasJson = lineasActualizadasJson;
        }
    }

    public void CompletarComprobanteRecepcion(string tipoDocumento, string documento, DateOnly fecha)
    {
        if (Estado != "Enviada") throw new InvalidOperationException("La compra debe estar enviada.");
        TipoDocumento = tipoDocumento;
        NumeroDocumento = documento.Trim().ToUpperInvariant();
        FechaDocumento = fecha;
    }
}
