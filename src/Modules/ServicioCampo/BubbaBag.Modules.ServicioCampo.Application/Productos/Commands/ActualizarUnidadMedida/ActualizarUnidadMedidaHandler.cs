using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.ActualizarUnidadMedida;

public record ActualizarUnidadMedidaCommand(
    Guid Id,
    string Nombre,
    string Abreviatura,
    bool PermiteDecimales,
    string? Descripcion = null
) : ICommand<Result>;

public class ActualizarUnidadMedidaHandler : ICommandHandler<ActualizarUnidadMedidaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarUnidadMedidaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarUnidadMedidaCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result.Failure("El nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(command.Abreviatura))
            return Result.Failure("La abreviatura o símbolo es obligatorio.");

        var unidad = await _context.UnidadesMedida
            .FirstOrDefaultAsync(u => u.Id == command.Id, cancellationToken);

        if (unidad is null)
            return Result.Failure("La unidad de medida especificada no existe.");

        unidad.Actualizar(command.Nombre, command.Abreviatura, command.PermiteDecimales, command.Descripcion);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
