using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Departamentos;

public record CrearDepartamentoCommand(
    string Nombre,
    string? Descripcion
) : ICommand<Result<Guid>>;

public class CrearDepartamentoHandler : ICommandHandler<CrearDepartamentoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public CrearDepartamentoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearDepartamentoCommand request, CancellationToken cancellationToken = default)
    {
        var nombreNormalizado = request.Nombre.Trim();

        var existe = await _context.Departamentos
            .AnyAsync(d => d.Nombre.ToLower() == nombreNormalizado.ToLower(), cancellationToken);

        if (existe)
        {
            return Result<Guid>.Failure($"Ya existe un departamento con el nombre '{nombreNormalizado}'.");
        }

        var departamento = Departamento.Crear(nombreNormalizado, request.Descripcion);

        _context.Departamentos.Add(departamento);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(departamento.Id);
    }
}
