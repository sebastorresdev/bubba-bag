using System;
using System.Collections.Generic;
using BubbaBag.SharedKernel;

namespace BubbaBag.Modules.GestionDatos.Domain;

public class DataImportJob : Entity<Guid>
{
    public string NombreArchivo { get; private set; } = string.Empty;
    public string TipoRegistro { get; private set; } = string.Empty;
    public long TamanoBytes { get; private set; }
    public string Estado { get; private set; } = "Completado"; // "Submitted", "Procesando", "Completado", "ConErrores", "Fallido"
    public string ModoDuplicados { get; private set; } = "Upsert"; // "Upsert", "Skip", "Error"
    public bool PermitirDuplicados { get; private set; }
    public string CreadoPor { get; private set; } = "Usuario Actual";
    public DateTime FechaCreacion { get; private set; } = DateTime.UtcNow;
    public DateTime? FechaFinalizacion { get; private set; }
    public int TotalProcesados { get; private set; }
    public int TotalExitosos { get; private set; }
    public int TotalFallidos { get; private set; }
    public int TotalParciales { get; private set; }
    public string? MapeoCamposJson { get; private set; }
    public string? ParametrosDelimitadorJson { get; private set; }

    public virtual ICollection<DataImportJobError> Errores { get; private set; } = new List<DataImportJobError>();

    private DataImportJob() { }

    public static DataImportJob Iniciar(
        string nombreArchivo,
        string tipoRegistro,
        long tamanoBytes,
        string modoDuplicados,
        bool permitirDuplicados,
        string creadoPor,
        string? mapeoCamposJson = null,
        string? parametrosDelimitadorJson = null)
    {
        return new DataImportJob
        {
            Id = Guid.NewGuid(),
            NombreArchivo = nombreArchivo,
            TipoRegistro = tipoRegistro,
            TamanoBytes = tamanoBytes,
            ModoDuplicados = modoDuplicados,
            PermitirDuplicados = permitirDuplicados,
            CreadoPor = string.IsNullOrWhiteSpace(creadoPor) ? "Usuario Actual" : creadoPor,
            FechaCreacion = DateTime.UtcNow,
            Estado = "Procesando",
            MapeoCamposJson = mapeoCamposJson,
            ParametrosDelimitadorJson = parametrosDelimitadorJson
        };
    }

    public void Finalizar(int totalProcesados, int totalExitosos, int totalFallidos, int totalParciales = 0)
    {
        TotalProcesados = totalProcesados;
        TotalExitosos = totalExitosos;
        TotalFallidos = totalFallidos;
        TotalParciales = totalParciales;
        FechaFinalizacion = DateTime.UtcNow;

        if (totalFallidos == 0)
        {
            Estado = "Completado";
        }
        else if (totalExitosos > 0 && totalFallidos > 0)
        {
            Estado = "ConErrores";
        }
        else
        {
            Estado = "Fallido";
        }
    }

    public void AgregarError(int fila, string mensaje, string? claveIdentificador = null, string? columna = null, string? valorOriginal = null)
    {
        Errores.Add(new DataImportJobError(Id, fila, mensaje, claveIdentificador, columna, valorOriginal));
    }
}

