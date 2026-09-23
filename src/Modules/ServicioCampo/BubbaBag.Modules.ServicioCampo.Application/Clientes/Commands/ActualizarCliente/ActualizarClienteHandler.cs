using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Clientes.Commands.ActualizarCliente;

public class ActualizarClienteHandler : ICommandHandler<ActualizarClienteCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarClienteHandler(IServicioCampoDbContext context)
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

        cliente.ActualizarContactoYDireccion(
            telefono: request.TelefonoPrincipal,
            direccion: request.Direccion,
            ubigeoCodigo: request.UbigeoCodigo,
            referencia: request.ReferenciaUbicacion,
            lat: request.CoordenadaLat,
            lng: request.CoordenadaLng);

        if (request.EsClienteFacturacion.HasValue || request.EsClienteServicio.HasValue)
        {
            cliente.ActualizarClasificacion(
                request.EsClienteFacturacion ?? cliente.EsClienteFacturacion,
                request.EsClienteServicio ?? cliente.EsClienteServicio);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
