using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Services;

public record ImportarServiciosResultadoDto(
    int TotalLeidos,
    int TotalImportados,
    int TotalActualizados,
    int TotalOmitidos,
    List<string> Errores,
    List<string> Advertencias
);

public interface IServicioExcelService
{
    Task<byte[]> GenerarPlantillaExcelAsync(CancellationToken cancellationToken = default);
    Task<ImportarServiciosResultadoDto> ImportarServiciosDesdeExcelAsync(Stream excelStream, CancellationToken cancellationToken = default);
}
