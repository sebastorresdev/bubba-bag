using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.ActualizarTipoTareaServicio;

public class ActualizarTipoTareaServicioHandler : ICommandHandler<ActualizarTipoTareaServicioCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarTipoTareaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarTipoTareaServicioCommand request, CancellationToken cancellationToken)
    {
        var nombreNormalizado = request.Nombre.Trim();

        var tarea = await _context.TiposTareaServicio.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tarea == null)
            return Result.Failure("Tipo de tarea de servicio no encontrado.");

        if (request.ClienteFacturacionId.HasValue)
        {
            if (!await _context.Clientes.AnyAsync(c => c.Id == request.ClienteFacturacionId.Value, cancellationToken))
                return Result.Failure("El cliente contratante / facturable especificado no existe o es inválido.");
        }

        tarea.Actualizar(nombreNormalizado, request.ClienteFacturacionId, request.DuracionEstimadaMinutos);

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
