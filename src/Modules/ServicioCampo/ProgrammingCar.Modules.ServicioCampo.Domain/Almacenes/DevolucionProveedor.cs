using System;
using ProgrammingCar.SharedKernel;

namespace ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;

/// <summary>
/// Representa una devolución formal de materiales o equipos en garantía, averiados o en exceso
/// hacia la empresa proveedora (Logística Inversa DIRECTV / Proveedores).
/// </summary>
public class DevolucionProveedor : Entity<Guid>
{
    public string Numero { get; private set; } = default!; // Ej: DEV-20261017-0001
    public string Proveedor { get; private set; } = default!; // DIRECTV u otro proveedor
    public Guid AlmacenId { get; private set; }
    public Almacen? Almacen { get; private set; }
    public Guid? UbicacionId { get; private set; }
    public UbicacionInventario? Ubicacion { get; private set; }
    public string TipoDocumento { get; private set; } = "GuiaRemision"; // GuiaRemision, ActaRetiro, ActaDevolucion
    public string NumeroDocumento { get; private set; } = default!; // Número de guía o acta física
    public DateOnly FechaDocumento { get; private set; }
    public string Motivo { get; private set; } = default!; // Garantía, Inoperativo, Exceso de Stock, Cese
    public string? Observaciones { get; private set; }
    public string? DocumentoRespaldoUrl { get; private set; } // Foto o escaneo del acta/guía firmada por la empresa que recoge
    public string LineasJson { get; private set; } = "[]";
    public int TotalItems { get; private set; }
    public decimal TotalCantidad { get; private set; }
    public string Estado { get; private set; } = "Borrador"; // Borrador, Completada, Anulada
    public Guid UsuarioId { get; private set; }
    public string UsuarioNombre { get; private set; } = default!;
    public DateTime FechaRegistro { get; private set; } = DateTime.UtcNow;
    public DateTime? FechaCompletada { get; private set; }

    private DevolucionProveedor() { }

    public static DevolucionProveedor Registrar(
        Guid id,
        string numero,
        string proveedor,
        Guid almacenId,
        Guid? ubicacionId,
        string tipoDocumento,
        string numeroDocumento,
        DateOnly fechaDocumento,
        string motivo,
        string? observaciones,
        string? documentoRespaldoUrl,
        string lineasJson,
        int totalItems,
        decimal totalCantidad,
        Guid usuarioId,
        string usuarioNombre,
        bool completarInmediato = true)
    {
        return new DevolucionProveedor
        {
            Id = id == Guid.Empty ? Guid.NewGuid() : id,
            Numero = numero.Trim().ToUpperInvariant(),
            Proveedor = proveedor.Trim().ToUpperInvariant(),
            AlmacenId = almacenId,
            UbicacionId = ubicacionId,
            TipoDocumento = string.IsNullOrWhiteSpace(tipoDocumento) ? "GuiaRemision" : tipoDocumento.Trim(),
            NumeroDocumento = numeroDocumento.Trim().ToUpperInvariant(),
            FechaDocumento = fechaDocumento,
            Motivo = motivo.Trim(),
            Observaciones = observaciones?.Trim(),
            DocumentoRespaldoUrl = documentoRespaldoUrl?.Trim(),
            LineasJson = lineasJson,
            TotalItems = totalItems,
            TotalCantidad = totalCantidad,
            Estado = completarInmediato ? "Completada" : "Borrador",
            UsuarioId = usuarioId,
            UsuarioNombre = usuarioNombre.Trim(),
            FechaRegistro = DateTime.UtcNow,
            FechaCompletada = completarInmediato ? DateTime.UtcNow : null
        };
    }

    public void Actualizar(
        string proveedor,
        Guid almacenId,
        Guid? ubicacionId,
        string tipoDocumento,
        string numeroDocumento,
        DateOnly fechaDocumento,
        string motivo,
        string? observaciones,
        string? documentoRespaldoUrl,
        string lineasJson,
        int totalItems,
        decimal totalCantidad)
    {
        if (Estado != "Borrador")
            throw new InvalidOperationException("No se puede editar una devolución completada o anulada.");

        Proveedor = proveedor.Trim().ToUpperInvariant();
        AlmacenId = almacenId;
        UbicacionId = ubicacionId;
        TipoDocumento = string.IsNullOrWhiteSpace(tipoDocumento) ? "GuiaRemision" : tipoDocumento.Trim();
        NumeroDocumento = numeroDocumento.Trim().ToUpperInvariant();
        FechaDocumento = fechaDocumento;
        Motivo = motivo.Trim();
        Observaciones = observaciones?.Trim();
        DocumentoRespaldoUrl = documentoRespaldoUrl?.Trim();
        LineasJson = lineasJson;
        TotalItems = totalItems;
        TotalCantidad = totalCantidad;
    }

    public void AdjuntarRespaldo(string url)
    {
        DocumentoRespaldoUrl = url.Trim();
    }

    public void Completar()
    {
        if (Estado != "Borrador")
            throw new InvalidOperationException("Solo las devoluciones en borrador pueden completarse.");

        Estado = "Completada";
        FechaCompletada = DateTime.UtcNow;
    }

    public void Anular()
    {
        if (Estado == "Completada")
            throw new InvalidOperationException("No se puede anular una devolución que ya impactó el kardex.");

        Estado = "Anulada";
    }
}
