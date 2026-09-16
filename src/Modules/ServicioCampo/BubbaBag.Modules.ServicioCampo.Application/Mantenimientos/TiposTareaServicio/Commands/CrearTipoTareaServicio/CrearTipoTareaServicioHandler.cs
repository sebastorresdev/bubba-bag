using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Commands.CrearTipoTareaServicio;

public class CrearTipoTareaServicioHandler : ICommandHandler<CrearTipoTareaServicioCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearTipoTareaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearTipoTareaServicioCommand request, CancellationToken cancellationToken)
    {
        var codigoNormalizado = request.CodigoTarea.Trim().ToUpperInvariant();
        var nombreNormalizado = request.Nombre.Trim();

        if (!await _context.Clientes.AnyAsync(c => c.Id == request.ClienteFacturacionId, cancellationToken))
            return Result<Guid>.Failure("El cliente contratante / facturable especificado no existe o es inválido.");

        if (await _context.TiposTareaServicio.AnyAsync(t => t.ClienteFacturacionId == request.ClienteFacturacionId && t.CodigoTarea == codigoNormalizado, cancellationToken))
            return Result<Guid>.Failure($"Ya existe una tarea con el código '{codigoNormalizado}' para el cliente facturable seleccionado.");

        var tarea = TipoTareaServicio.Crear(
            codigoNormalizado,
            nombreNormalizado,
            request.ClienteFacturacionId,
            request.DuracionEstimadaMinutos);

        _context.TiposTareaServicio.Add(tarea);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(tarea.Id);
    }
}
