using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Departamentos;

public record ActualizarDepartamentoCommand(
    Guid Id,
    string Nombre,
    string? Descripcion,
    bool Activo
) : ICommand<Result<Guid>>;

public class ActualizarDepartamentoHandler : ICommandHandler<ActualizarDepartamentoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ActualizarDepartamentoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(ActualizarDepartamentoCommand request, CancellationToken cancellationToken = default)
    {
        var departamento = await _context.Departamentos
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (departamento is null)
        {
            return Result<Guid>.Failure("El departamento no existe.");
        }

        var nombreNormalizado = request.Nombre.Trim();

        var existeDuplicado = await _context.Departamentos
            .AnyAsync(d => d.Id != request.Id && d.Nombre.ToLower() == nombreNormalizado.ToLower(), cancellationToken);

        if (existeDuplicado)
        {
            return Result<Guid>.Failure($"Ya existe otro departamento con el nombre '{nombreNormalizado}'.");
        }

        departamento.Actualizar(nombreNormalizado, request.Descripcion);

        if (request.Activo)
        {
            departamento.Activar();
        }
        else
        {
            departamento.Desactivar();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(departamento.Id);
    }
}
