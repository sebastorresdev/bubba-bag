using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CambiarEstadoAlmacen;

public record CambiarEstadoAlmacenCommand(
    Guid Id,
    bool Activo
) : ICommand<Result>;

public class CambiarEstadoAlmacenHandler : ICommandHandler<CambiarEstadoAlmacenCommand, Result>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _currentUser;

    public CambiarEstadoAlmacenHandler(IServicioCampoDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result> HandleAsync(CambiarEstadoAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        if (!await InventarioAcceso.PuedeAsync(_context,_currentUser,command.Id,"supervisar",cancellationToken)) return Result.Failure("No puede administrar este almacén.");
        var almacen = await _context.Almacenes.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken);
        if (almacen is null)
            return Result.Failure($"No se encontró el almacén con ID '{command.Id}'.");

        if (command.Activo && almacen.Tipo == BubbaBag.Modules.ServicioCampo.Domain.Almacenes.TipoAlmacen.CustodiaPersonal &&
            (!await _context.Recursos.AnyAsync(r=>r.Id==almacen.RecursoId && r.Activo && r.Tipo==BubbaBag.Modules.ServicioCampo.Domain.Recursos.TipoRecurso.Tecnico && r.UnidadOrganizativaId==almacen.UnidadOrganizativaId,cancellationToken) ||
             await _context.Almacenes.AnyAsync(a=>a.Id!=almacen.Id && a.RecursoId==almacen.RecursoId && a.Tipo==almacen.Tipo && a.Activo,cancellationToken)))
            return Result.Failure("El recurso debe ser técnico activo de la misma unidad y no tener otra custodia activa.");

        if (!command.Activo && (await _context.StocksAlmacen.AnyAsync(x=>x.Ubicacion.AlmacenId==command.Id && (x.CantidadDisponible>0 || x.CantidadReservada>0),cancellationToken) || await _context.ItemsSeriados.AnyAsync(x=>x.UbicacionActual!=null && x.UbicacionActual.AlmacenId==command.Id,cancellationToken) || await _context.Transferencias.AnyAsync(x=>(x.AlmacenOrigenId==command.Id || x.AlmacenDestinoId==command.Id) && (x.Estado==BubbaBag.Modules.ServicioCampo.Domain.Almacenes.EstadoTransferencia.EnTransito || x.Estado==BubbaBag.Modules.ServicioCampo.Domain.Almacenes.EstadoTransferencia.ParcialmenteRecibida),cancellationToken))) return Result.Failure("El almacén tiene inventario o transferencias pendientes.");
        almacen.CambiarEstado(command.Activo, _currentUser.Id == Guid.Empty ? null : _currentUser.Id);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
