using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.Crm.Application.Clientes.Features;

public record ActualizarClienteCommand(
    Guid Id,
    string TelefonoPrincipal,
    string Direccion,
    string Distrito,
    string Provincia,
    string Departamento,
    string? ReferenciaUbicacion = null,
    decimal? CoordenadaLat = null,
    decimal? CoordenadaLng = null
) : ICommand<Result>;

public class ActualizarClienteHandler : ICommandHandler<ActualizarClienteCommand, Result>
{
    private readonly ICrmDbContext _context;

    public ActualizarClienteHandler(ICrmDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarClienteCommand request, CancellationToken cancellationToken)
    {
        var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (cliente == null)
        {
            return Result.Failure("Cliente no encontrado.");
        }

        if (string.IsNullOrWhiteSpace(request.TelefonoPrincipal))
        {
            return Result.Failure("El teléfono principal es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Direccion))
        {
            return Result.Failure("La dirección es obligatoria.");
        }

        cliente.ActualizarContactoYDireccion(
            telefono: request.TelefonoPrincipal,
            direccion: request.Direccion,
            distrito: request.Distrito,
            provincia: request.Provincia,
            departamento: request.Departamento,
            referencia: request.ReferenciaUbicacion,
            lat: request.CoordenadaLat,
            lng: request.CoordenadaLng);

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
