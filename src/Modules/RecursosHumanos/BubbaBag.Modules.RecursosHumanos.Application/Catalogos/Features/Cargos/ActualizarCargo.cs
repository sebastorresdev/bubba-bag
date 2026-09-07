using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Cargos;

public record ActualizarCargoCommand(
    Guid Id,
    string Nombre,
    Guid DepartamentoId,
    decimal? SalarioReferencial,
    bool Activo
) : ICommand<Result<Guid>>;

public class ActualizarCargoHandler : ICommandHandler<ActualizarCargoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ActualizarCargoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(ActualizarCargoCommand request, CancellationToken cancellationToken = default)
    {
        var cargo = await _context.Cargos
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (cargo is null)
        {
            return Result<Guid>.Failure("El cargo no existe.");
        }

        var departamentoExiste = await _context.Departamentos
            .AnyAsync(d => d.Id == request.DepartamentoId, cancellationToken);

        if (!departamentoExiste)
        {
            return Result<Guid>.Failure("El departamento seleccionado no existe.");
        }

        var nombreNormalizado = request.Nombre.Trim();

        var existeDuplicado = await _context.Cargos
            .AnyAsync(c => c.Id != request.Id && c.DepartamentoId == request.DepartamentoId && c.Nombre.ToLower() == nombreNormalizado.ToLower(), cancellationToken);

        if (existeDuplicado)
        {
            return Result<Guid>.Failure($"Ya existe otro cargo con el nombre '{nombreNormalizado}' en el departamento seleccionado.");
        }

        cargo.Actualizar(nombreNormalizado, request.DepartamentoId, request.SalarioReferencial);

        if (request.Activo)
        {
            cargo.Activar();
        }
        else
        {
            cargo.Desactivar();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(cargo.Id);
    }
}
