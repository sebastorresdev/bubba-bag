using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Cargos;

public record CrearCargoCommand(
    string Nombre,
    Guid DepartamentoId,
    decimal? SalarioReferencial
) : ICommand<Result<Guid>>;

public class CrearCargoHandler : ICommandHandler<CrearCargoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public CrearCargoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearCargoCommand request, CancellationToken cancellationToken = default)
    {
        var nombreNormalizado = request.Nombre.Trim();

        var departamentoExiste = await _context.Departamentos
            .AnyAsync(d => d.Id == request.DepartamentoId, cancellationToken);

        if (!departamentoExiste)
        {
            return Result<Guid>.Failure("El departamento seleccionado no existe.");
        }

        var existeDuplicado = await _context.Cargos
            .AnyAsync(c => c.DepartamentoId == request.DepartamentoId && c.Nombre.ToLower() == nombreNormalizado.ToLower(), cancellationToken);

        if (existeDuplicado)
        {
            return Result<Guid>.Failure($"Ya existe un cargo con el nombre '{nombreNormalizado}' en el departamento seleccionado.");
        }

        var cargo = Cargo.Crear(nombreNormalizado, request.DepartamentoId, request.SalarioReferencial);

        _context.Cargos.Add(cargo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(cargo.Id);
    }
}
