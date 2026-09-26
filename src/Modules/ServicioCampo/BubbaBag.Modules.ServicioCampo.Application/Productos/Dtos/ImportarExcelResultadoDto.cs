using System.Collections.Generic;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;

public class ImportarExcelResultadoDto
{
    public int TotalFilas { get; set; }
    public int Creados { get; set; }
    public int Actualizados { get; set; }
    public List<ImportarErrorDto> Errores { get; set; } = new();
    public bool Exitoso => Errores.Count == 0;
}

public class ImportarErrorDto
{
    public int Fila { get; set; }
    public string? Codigo { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}
