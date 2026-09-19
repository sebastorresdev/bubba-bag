using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Commands.CrearTipoOrdenTrabajo;

public class CrearTipoOrdenTrabajoHandler : ICommandHandler<CrearTipoOrdenTrabajoCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearTipoOrdenTrabajoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearTipoOrdenTrabajoCommand request, CancellationToken cancellationToken)
    {
        var nombreNormalizado = request.Nombre.Trim();

        if (await _context.TiposOrdenTrabajo.AnyAsync(t => t.Nombre.ToLower() == nombreNormalizado.ToLower(), cancellationToken))
            return Result<Guid>.Failure($"Ya existe un tipo de orden de trabajo con el nombre '{nombreNormalizado}'.");

        var tipo = TipoOrdenTrabajo.Crear(
            nombreNormalizado,
            request.RequiereVisitaCampo,
            request.ExigeFirmaCliente,
            request.ExigeEvidenciasFotograficas,
            request.Descripcion,
            string.IsNullOrWhiteSpace(request.ColorHex) ? "#0f6cbd" : request.ColorHex.Trim());

        _context.TiposOrdenTrabajo.Add(tipo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(tipo.Id);
    }
}
