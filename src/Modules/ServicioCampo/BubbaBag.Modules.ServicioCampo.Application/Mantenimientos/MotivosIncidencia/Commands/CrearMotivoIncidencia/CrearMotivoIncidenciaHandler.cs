using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Commands.CrearMotivoIncidencia;

public class CrearMotivoIncidenciaHandler : ICommandHandler<CrearMotivoIncidenciaCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearMotivoIncidenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearMotivoIncidenciaCommand request, CancellationToken cancellationToken)
    {
        var codigoNormalizado = request.Codigo.Trim().ToUpperInvariant();
        var nombreNormalizado = request.Nombre.Trim();

        if (await _context.MotivosIncidencia.AnyAsync(m => m.Codigo == codigoNormalizado, cancellationToken))
            return Result<Guid>.Failure($"Ya existe un motivo de incidencia con el código '{codigoNormalizado}'.");

        var motivo = MotivoIncidencia.Crear(codigoNormalizado, nombreNormalizado, request.Ambito, request.Descripcion);
        _context.MotivosIncidencia.Add(motivo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(motivo.Id);
    }
}
