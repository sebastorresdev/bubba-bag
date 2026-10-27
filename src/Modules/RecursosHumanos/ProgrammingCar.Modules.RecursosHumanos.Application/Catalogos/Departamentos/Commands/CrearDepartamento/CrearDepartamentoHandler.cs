using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Organizacion;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Departamentos.Commands.CrearDepartamento;

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
