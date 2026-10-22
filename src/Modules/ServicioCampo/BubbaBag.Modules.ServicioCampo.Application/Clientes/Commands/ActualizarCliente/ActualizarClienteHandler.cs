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
            return Result.Failure("Cuenta no encontrada.");
        }

        if (!string.IsNullOrWhiteSpace(request.DocumentoIdentidad))
        {
            var docNorm = request.DocumentoIdentidad.Trim();
            if (docNorm != cliente.DocumentoIdentidad &&
                await _context.Clientes.AnyAsync(c => c.Id != request.Id && c.DocumentoIdentidad == docNorm, cancellationToken))
            {
                return Result.Failure($"Ya existe otra cuenta registrada con el documento '{docNorm}'.");
            }
        }

        cliente.ActualizarContactoYDireccion(
            telefono: request.TelefonoPrincipal,
            direccion: request.Direccion,
            ubigeoCodigo: request.UbigeoCodigo,
            referencia: request.ReferenciaUbicacion,
            lat: request.CoordenadaLat,
            lng: request.CoordenadaLng,
            nombreCuenta: request.Nombres,
            documentoIdentidad: request.DocumentoIdentidad,
            telefonoSecundario: request.TelefonoSecundario,
            email: request.Email,
            contactoPrincipalId: request.ContactoPrincipalId);

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
