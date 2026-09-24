using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Productos.Commands.CrearUnidadMedida;

public record CrearUnidadMedidaCommand(
    string Codigo,
    string Nombre,
    string Abreviatura,
    bool PermiteDecimales = false,
    string? Descripcion = null
) : ICommand<Result<Guid>>;

public class CrearUnidadMedidaHandler : ICommandHandler<CrearUnidadMedidaCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearUnidadMedidaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearUnidadMedidaCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Codigo))
            return Result<Guid>.Failure("El código es obligatorio.");

        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result<Guid>.Failure("El nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(command.Abreviatura))
            return Result<Guid>.Failure("La abreviatura o símbolo es obligatorio.");

        var codigoNormalizado = command.Codigo.Trim().ToUpperInvariant();
        var existeCodigo = await _context.UnidadesMedida
            .AnyAsync(u => u.Codigo == codigoNormalizado, cancellationToken);

        if (existeCodigo)
            return Result<Guid>.Failure($"Ya existe una unidad de medida con el código '{codigoNormalizado}'.");

        var unidad = UnidadMedida.Crear(
            codigoNormalizado,
            command.Nombre,
            command.Abreviatura,
            command.PermiteDecimales,
            command.Descripcion
        );

        await _context.UnidadesMedida.AddAsync(unidad, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(unidad.Id);
    }
}
