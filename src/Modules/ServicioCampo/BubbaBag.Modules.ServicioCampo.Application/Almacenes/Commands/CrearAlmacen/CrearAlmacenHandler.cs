using System;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.Authorization;
using Microsoft.EntityFrameworkCore;
using BubbaBag.SharedKernel.CQRS;

namespace BubbaBag.Modules.ServicioCampo.Application.Almacenes.Commands.CrearAlmacen;

public record CrearAlmacenCommand(
    string Nombre,
    string? Descripcion = null,
    string? Codigo = null,
    int? Tipo = 1,
    Guid? UnidadOrganizativaId = null,
    Guid? RecursoId = null
) : ICommand<Result<Guid>>;

public class CrearAlmacenHandler : ICommandHandler<CrearAlmacenCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;
    private readonly ICurrentUser _currentUser;

    public CrearAlmacenHandler(IServicioCampoDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<Guid>> HandleAsync(CrearAlmacenCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Nombre))
            return Result<Guid>.Failure("El nombre del almacén es obligatorio.");

        if (command.Nombre.Trim().Length > 150)
            return Result<Guid>.Failure("El nombre del almacén no puede superar los 150 caracteres.");
        if (command.Codigo?.Length>30) return Result<Guid>.Failure("El código admite hasta 30 caracteres.");
        if (command.Descripcion?.Length > 500)
            return Result<Guid>.Failure("La descripción no puede superar los 500 caracteres.");

        if (!_currentUser.IsAuthenticated || !_currentUser.HasAnyRole(Roles.SuperAdmin,Roles.ServicioCampoAdmin)) return Result<Guid>.Failure("No puede administrar almacenes.");
        if (!command.UnidadOrganizativaId.HasValue || !await _context.UnidadesOrganizativas.AnyAsync(x=>x.Id==command.UnidadOrganizativaId && x.Activo,cancellationToken)) return Result<Guid>.Failure("Seleccione una unidad organizativa activa.");
        if (command.Tipo is not (1 or 2)) return Result<Guid>.Failure("Tipo de almacén inválido.");
        if (!string.IsNullOrWhiteSpace(command.Codigo) && await _context.Almacenes.AnyAsync(x=>x.Codigo==command.Codigo.Trim().ToUpperInvariant(),cancellationToken)) return Result<Guid>.Failure("El código de almacén ya existe.");
        if (command.Tipo==2 && (!await _context.Recursos.AnyAsync(x=>x.Id==command.RecursoId && x.Activo && x.Tipo==BubbaBag.Modules.ServicioCampo.Domain.Recursos.TipoRecurso.Tecnico && x.UnidadOrganizativaId==command.UnidadOrganizativaId,cancellationToken) || await _context.Almacenes.AnyAsync(x=>x.RecursoId==command.RecursoId && x.Tipo==TipoAlmacen.CustodiaPersonal && x.Activo,cancellationToken))) return Result<Guid>.Failure("El custodio debe ser un técnico activo de la unidad y no tener otra custodia activa.");
        var tipoAlmacen = command.Tipo == 2 ? TipoAlmacen.CustodiaPersonal : TipoAlmacen.Bodega;
        if (tipoAlmacen == TipoAlmacen.CustodiaPersonal && !command.RecursoId.HasValue)
        {
            return Result<Guid>.Failure("La custodia personal requiere un recurso técnico responsable.");
        }

        var almacen = Almacen.Crear(
            command.Nombre,
            command.Descripcion,
            UsuarioActualId(),
            _currentUser.Nombre,
            command.Codigo,
            tipoAlmacen,
            command.UnidadOrganizativaId,
            command.RecursoId);

        await _context.Almacenes.AddAsync(almacen, cancellationToken);
        _context.UbicacionesInventario.Add(UbicacionInventario.Crear(almacen.Id,"PRINCIPAL","Principal",true));
        _context.UsuarioAlmacenAutorizaciones.Add(UsuarioAlmacenAutorizacion.Crear(_currentUser.Id,almacen.Id,esSupervisor:true));
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(almacen.Id);
    }

    private Guid? UsuarioActualId() => _currentUser.Id == Guid.Empty ? null : _currentUser.Id;
}
