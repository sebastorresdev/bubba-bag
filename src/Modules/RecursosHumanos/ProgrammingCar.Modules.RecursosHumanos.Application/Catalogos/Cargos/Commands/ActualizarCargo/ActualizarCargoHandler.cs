using System;
using System.Threading;
using System.Threading.Tasks;
using ProgrammingCar.SharedKernel;
using ProgrammingCar.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.RecursosHumanos.Application.Catalogos.Cargos.Commands.ActualizarCargo;

public class ActualizarCargoHandler : ICommandHandler<ActualizarCargoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ActualizarCargoHandler(IRecursosHumanosDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> HandleAsync(ActualizarCargoCommand request, CancellationToken cancellationToken = default)
    {
        if (request.SalarioReferencial.HasValue && !_currentUser.HasPermission(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.SalariosConfidencial)) throw new UnauthorizedAccessException();
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

        cargo.Actualizar(nombreNormalizado, request.DepartamentoId, _currentUser.HasPermission(ProgrammingCar.SharedKernel.Authorization.Permissions.Rrhh.SalariosConfidencial) ? request.SalarioReferencial : cargo.SalarioReferencial);

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
