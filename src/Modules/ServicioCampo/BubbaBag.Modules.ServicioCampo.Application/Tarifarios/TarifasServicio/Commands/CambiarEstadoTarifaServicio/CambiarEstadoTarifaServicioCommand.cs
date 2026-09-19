using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Tarifarios.TarifasServicio.Commands.CambiarEstadoTarifaServicio;

public record CambiarEstadoTarifaServicioCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoTarifaServicioHandler : ICommandHandler<CambiarEstadoTarifaServicioCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoTarifaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoTarifaServicioCommand request, CancellationToken cancellationToken)
    {
        var tarifa = await _context.TarifasServicio.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tarifa == null)
            return Result.Failure("Tarifa de servicio no encontrada.");

        if (request.Activo)
            tarifa.Activar();
        else
            tarifa.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
