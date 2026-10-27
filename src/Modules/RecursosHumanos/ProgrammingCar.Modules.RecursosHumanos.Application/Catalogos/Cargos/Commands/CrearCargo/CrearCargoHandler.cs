using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.Modules.RecursosHumanos.Domain.Organizacion;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.CrearCargo;

public class CrearCargoHandler : ICommandHandler<CrearCargoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public CrearCargoHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> HandleAsync(CrearCargoCommand request, CancellationToken cancellationToken = default)
    {
        if (request.SalarioReferencial.HasValue && !_currentUser.HasPermission(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.SalariosConfidencial)) throw new UnauthorizedAccessException();
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
