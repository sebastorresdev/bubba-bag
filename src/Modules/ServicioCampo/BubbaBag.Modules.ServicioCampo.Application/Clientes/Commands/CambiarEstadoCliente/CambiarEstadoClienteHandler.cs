using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Clientes.Commands.CambiarEstadoCliente;

public class CambiarEstadoClienteHandler : ICommandHandler<CambiarEstadoClienteCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoClienteHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoClienteCommand request, CancellationToken cancellationToken)
    {
        var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (cliente == null)
        {
            return Result.Failure("Cliente no encontrado.");
        }

        if (request.Activo)
        {
            cliente.Activar();
        }
        else
        {
            cliente.Desactivar();
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
