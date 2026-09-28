using System;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.GestionDatos.Domain;

public class DataImportJobError : Entity<Guid>
{
    public Guid DataImportJobId { get; private set; }
    public virtual DataImportJob DataImportJob { get; private set; } = default!;

    public int Fila { get; private set; }
    public string? ClaveIdentificador { get; private set; }
    public string? Columna { get; private set; }
    public string Mensaje { get; private set; } = string.Empty;
    public string? ValorOriginal { get; private set; }

    private DataImportJobError() { }

    public DataImportJobError(
        Guid dataImportJobId,
        int fila,
        string mensaje,
        string? claveIdentificador = null,
        string? columna = null,
        string? valorOriginal = null)
    {
        Id = Guid.NewGuid();
        DataImportJobId = dataImportJobId;
        Fila = fila;
        Mensaje = mensaje;
        ClaveIdentificador = claveIdentificador;
        Columna = columna;
        ValorOriginal = valorOriginal;
    }
}

