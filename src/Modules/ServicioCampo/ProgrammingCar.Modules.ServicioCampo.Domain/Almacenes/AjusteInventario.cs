using System;
using ProgrammingCar.SharedKernel;

namespace ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;

public class AjusteInventario : Entity<Guid>
{
    public string Numero { get; private set; } = default!;
    public string? NumeroAprobacion { get; private set; }
    public string Tipo { get; private set; } = "Entrada";
    public Guid AlmacenId { get; private set; }
    public Almacen? Almacen { get; private set; }
    public Guid? UbicacionId { get; private set; }
    public UbicacionInventario? Ubicacion { get; private set; }
    public DateOnly Fecha { get; private set; }
    public string Motivo { get; private set; } = default!;
    public string? DocumentoReferencia { get; private set; }
    public string? Observaciones { get; private set; }
    public string Estado { get; private set; } = "Borrador";
    public int TotalItems { get; private set; }
    public decimal TotalCantidad { get; private set; }
    public decimal ValorTotal { get; private set; }
    public string LineasJson { get; private set; } = "[]";
    public Guid UsuarioId { get; private set; }
    public string UsuarioRegistro { get; private set; } = default!;
    public DateTime FechaRegistro { get; private set; }
    public string? UsuarioAprobacion { get; private set; }
    public DateTime? FechaAprobacion { get; private set; }

    private AjusteInventario() { }

    public static AjusteInventario Registrar(
        Guid id,
        string numero,
        string tipo,
        Guid almacenId,
        Guid? ubicacionId,
        DateOnly fecha,
        string motivo,
        string? documentoReferencia,
        string? observaciones,
        int totalItems,
        decimal totalCantidad,
        decimal valorTotal,
        string lineasJson,
        Guid usuarioId,
        string usuarioRegistro)
    {
        return new AjusteInventario
        {
            Id = id,
            Numero = numero.Trim().ToUpperInvariant(),
            Tipo = tipo.Trim(),
            AlmacenId = almacenId,
            UbicacionId = ubicacionId,
            Fecha = fecha,
            Motivo = motivo.Trim(),
            DocumentoReferencia = documentoReferencia?.Trim(),
            Observaciones = observaciones?.Trim(),
            Estado = "Borrador",
            TotalItems = totalItems,
            TotalCantidad = totalCantidad,
            ValorTotal = valorTotal,
            LineasJson = lineasJson,
            UsuarioId = usuarioId,
            UsuarioRegistro = usuarioRegistro.Trim(),
            FechaRegistro = DateTime.UtcNow
        };
    }

    public void Actualizar(
        string tipo,
        Guid almacenId,
        Guid? ubicacionId,
        DateOnly fecha,
        string motivo,
        string? documentoReferencia,
        string? observaciones,
        int totalItems,
        decimal totalCantidad,
        decimal valorTotal,
        string lineasJson)
    {
        if (Estado is "Aplicado" or "Anulado")
            throw new InvalidOperationException("No se puede editar un ajuste aplicado o anulado.");

        Tipo = tipo.Trim();
        AlmacenId = almacenId;
        UbicacionId = ubicacionId;
        Fecha = fecha;
        Motivo = motivo.Trim();
        DocumentoReferencia = documentoReferencia?.Trim();
        Observaciones = observaciones?.Trim();
        TotalItems = totalItems;
        TotalCantidad = totalCantidad;
        ValorTotal = valorTotal;
        LineasJson = lineasJson;
    }

    public void SolicitarAprobacion(string numeroAprobacion)
    {
        if (Estado != "Borrador")
            throw new InvalidOperationException("Solo los ajustes en borrador pueden enviarse a revisión.");

        Estado = "EnRevision";
        NumeroAprobacion = numeroAprobacion.Trim().ToUpperInvariant();
    }

    public void Observar(string? motivoObservacion)
    {
        if (Estado != "EnRevision")
            throw new InvalidOperationException("Solo los ajustes en revisión pueden ser observados.");

        Estado = "Borrador";
        if (!string.IsNullOrWhiteSpace(motivoObservacion))
        {
            Observaciones = string.IsNullOrWhiteSpace(Observaciones)
                ? $"[Observación]: {motivoObservacion.Trim()}"
                : $"{Observaciones}\n[Observación]: {motivoObservacion.Trim()}";
        }
    }

    public void Aplicar(string usuarioAprobador)
    {
        if (Estado is not ("Borrador" or "EnRevision"))
            throw new InvalidOperationException("El ajuste no se encuentra en estado válido para ser aplicado.");

        Estado = "Aplicado";
        UsuarioAprobacion = string.IsNullOrWhiteSpace(usuarioAprobador) ? "Supervisor" : usuarioAprobador.Trim();
        FechaAprobacion = DateTime.UtcNow;
    }

    public void Anular()
    {
        if (Estado == "Aplicado")
            throw new InvalidOperationException("No se puede anular un ajuste que ya ha sido aplicado al stock.");

        Estado = "Anulado";
    }
}
