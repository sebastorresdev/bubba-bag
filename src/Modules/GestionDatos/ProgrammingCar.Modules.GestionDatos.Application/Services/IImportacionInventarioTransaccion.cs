using ProgrammingCar.Modules.GestionDatos.Application.Dtos;

namespace ProgrammingCar.Modules.GestionDatos.Application.Services;

public interface IImportacionInventarioTransaccion
{
    Task<DataImportJobDto> EjecutarAsync(Func<CancellationToken, Task<DataImportJobDto>> operacion, CancellationToken ct);
}
