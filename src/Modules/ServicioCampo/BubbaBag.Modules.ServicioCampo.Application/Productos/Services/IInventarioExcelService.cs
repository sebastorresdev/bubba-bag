using System.IO;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Productos.Dtos;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Services;

public interface IInventarioExcelService
{
    Task<byte[]> GenerarPlantillaProductosAsync(CancellationToken cancellationToken = default);
    Task<ImportarExcelResultadoDto> ImportarProductosAsync(Stream stream, CancellationToken cancellationToken = default);

    Task<byte[]> GenerarPlantillaCategoriasAsync(CancellationToken cancellationToken = default);
    Task<ImportarExcelResultadoDto> ImportarCategoriasAsync(Stream stream, CancellationToken cancellationToken = default);

    Task<byte[]> GenerarPlantillaUnidadesMedidaAsync(CancellationToken cancellationToken = default);
    Task<ImportarExcelResultadoDto> ImportarUnidadesMedidaAsync(Stream stream, CancellationToken cancellationToken = default);
}
