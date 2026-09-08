using System;
using BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Enums;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.RecursosHumanos.Domain.Asistencia.Justificaciones;

public class SolicitudJustificacion : Entity<Guid>
{
    public Guid EmpleadoId { get; private set; }
    public Empleado Empleado { get; private set; } = default!;

    public DateOnly FechaOperativa { get; private set; }

    public Guid TipoJustificacionId { get; private set; }
    public TipoJustificacion TipoJustificacion { get; private set; } = default!;

    public string Motivo { get; private set; } = default!;
    public string? DocumentoSustentoUrl { get; private set; }

    // Minutos de tardanza o salida temprana que cubre esta justificación (null si cubre el día completo)
    public int? MinutosJustificados { get; private set; }

    public EstadoJustificacion Estado { get; private set; } = EstadoJustificacion.Pendiente;

    // Auditoría de aprobación
    public Guid? AprobadoPorId { get; private set; }
    public DateTime? FechaResolucion { get; private set; }
    public string? ObservacionResolucion { get; private set; }

    public DateTime FechaCreacion { get; private set; } = DateTime.UtcNow;

    private SolicitudJustificacion() { }

    public SolicitudJustificacion(
        Guid id,
        Guid empleadoId,
        DateOnly fechaOperativa,
        Guid tipoJustificacionId,
        string motivo,
        int? minutosJustificados = null,
        string? documentoSustentoUrl = null)
    {
        Id = id;
        EmpleadoId = empleadoId;
        FechaOperativa = fechaOperativa;
        TipoJustificacionId = tipoJustificacionId;
        Motivo = motivo.Trim();
        MinutosJustificados = minutosJustificados;
        DocumentoSustentoUrl = documentoSustentoUrl?.Trim();
        Estado = EstadoJustificacion.Pendiente;
        FechaCreacion = DateTime.UtcNow;
    }

    public void Aprobar(Guid aprobadoPorId, string? observacion = null)
    {
        Estado = EstadoJustificacion.Aprobada;
        AprobadoPorId = aprobadoPorId;
        FechaResolucion = DateTime.UtcNow;
        ObservacionResolucion = observacion?.Trim();
    }

    public void Rechazar(Guid rechazadoPorId, string motivoRechazo)
    {
        Estado = EstadoJustificacion.Rechazada;
        AprobadoPorId = rechazadoPorId;
        FechaResolucion = DateTime.UtcNow;
        ObservacionResolucion = motivoRechazo.Trim();
    }
}
