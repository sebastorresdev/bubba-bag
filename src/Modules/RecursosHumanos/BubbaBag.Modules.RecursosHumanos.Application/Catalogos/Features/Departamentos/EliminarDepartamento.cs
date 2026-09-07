using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features.Departamentos;

public record EliminarDepartamentoCommand(Guid Id) : ICommand<Result<Guid>>;

public class EliminarDepartamentoHandler : ICommandHandler<EliminarDepartamentoCommand, Result<Guid>>
{
    private readonly IRecursosHumanosDbContext _context;

    public EliminarDepartamentoHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(EliminarDepartamentoCommand request, CancellationToken cancellationToken = default)
    {
        var departamento = await _context.Departamentos
            .Include(d => d.Cargos)
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (departamento is null)
        {
            return Result<Guid>.Failure("El departamento no existe.");
        }

        // Validar si tiene colaboradores asignados directamente al departamento
        var empleadosDirectos = await _context.Empleados
            .CountAsync(e => e.DepartamentoId == request.Id, cancellationToken);

        if (empleadosDirectos > 0)
        {
            return Result<Guid>.Failure($"No se puede eliminar el departamento porque tiene {empleadosDirectos} colaborador(es) asignado(s). Le sugerimos desactivarlo en su lugar.");
        }

        // Validar si alguno de sus cargos tiene colaboradores asignados
        var cargosIds = departamento.Cargos.Select(c => c.Id).ToList();
        if (cargosIds.Any())
        {
            var empleadosEnCargos = await _context.Empleados
                .CountAsync(e => e.CargoId.HasValue && cargosIds.Contains(e.CargoId.Value), cancellationToken);

            if (empleadosEnCargos > 0)
            {
                return Result<Guid>.Failure($"No se puede eliminar el departamento porque sus cargos asociados tienen {empleadosEnCargos} colaborador(es) asignado(s). Le sugerimos desactivarlo en su lugar.");
            }
        }

        _context.Departamentos.Remove(departamento);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(departamento.Id);
    }
}
