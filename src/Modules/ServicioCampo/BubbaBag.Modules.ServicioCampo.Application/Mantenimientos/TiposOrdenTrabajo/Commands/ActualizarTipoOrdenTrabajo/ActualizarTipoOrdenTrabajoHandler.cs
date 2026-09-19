using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.ActualizarTipoOrdenTrabajo;

public class ActualizarTipoOrdenTrabajoHandler : ICommandHandler<ActualizarTipoOrdenTrabajoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarTipoOrdenTrabajoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarTipoOrdenTrabajoCommand request, CancellationToken cancellationToken)
    {
        var nombreNormalizado = request.Nombre.Trim();

        var tipo = await _context.TiposOrdenTrabajo.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tipo == null)
            return Result.Failure("Tipo de orden de trabajo no encontrado.");

        if (await _context.TiposOrdenTrabajo.AnyAsync(t => t.Id != request.Id && t.Nombre.ToLower() == nombreNormalizado.ToLower(), cancellationToken))
            return Result.Failure($"Ya existe otro tipo de orden de trabajo con el nombre '{nombreNormalizado}'.");

        tipo.Actualizar(
            nombreNormalizado,
            request.RequiereVisitaCampo,
            request.ExigeFirmaCliente,
            request.ExigeEvidenciasFotograficas,
            request.Descripcion,
            string.IsNullOrWhiteSpace(request.ColorHex) ? "#0f6cbd" : request.ColorHex.Trim());

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
