using BubbaBag.Modules.GestionDatos.Application.Dtos;

namespace BubbaBag.Modules.GestionDatos.Application.Services;

public interface IImportacionInventarioTransaccion
{
    Task<DataImportJobDto> EjecutarAsync(Func<CancellationToken, Task<DataImportJobDto>> operacion, CancellationToken ct);
}
