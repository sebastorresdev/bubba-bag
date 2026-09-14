using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.OrigenesOrden.Features;

public record OrigenOrdenDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    bool EsIntegracionExterna,
    bool Activo);

// =========================================================================
// COMMANDS
// =========================================================================

public record CrearOrigenOrdenCommand(
    string Codigo,
    string Nombre,
    bool EsIntegracionExterna = false,
    string? Descripcion = null
) : ICommand<Result<Guid>>;

public class CrearOrigenOrdenHandler : ICommandHandler<CrearOrigenOrdenCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearOrigenOrdenHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearOrigenOrdenCommand request, CancellationToken cancellationToken)
    {
        var codigoNormalizado = request.Codigo?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(codigoNormalizado))
            return Result<Guid>.Failure("El código de origen de orden es obligatorio.");

        var nombreNormalizado = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombreNormalizado))
            return Result<Guid>.Failure("El nombre de origen de orden es obligatorio.");

        if (await _context.OrigenesOrden.AnyAsync(o => o.Codigo == codigoNormalizado, cancellationToken))
            return Result<Guid>.Failure($"Ya existe un origen de orden con el código '{codigoNormalizado}'.");

        var origen = OrigenOrden.Crear(codigoNormalizado, nombreNormalizado, request.EsIntegracionExterna, request.Descripcion);
        _context.OrigenesOrden.Add(origen);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(origen.Id);
    }
}

public record ActualizarOrigenOrdenCommand(
    Guid Id,
    string Nombre,
    bool EsIntegracionExterna,
    string? Descripcion = null
) : ICommand<Result>;

public class ActualizarOrigenOrdenHandler : ICommandHandler<ActualizarOrigenOrdenCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarOrigenOrdenHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarOrigenOrdenCommand request, CancellationToken cancellationToken)
    {
        var nombreNormalizado = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombreNormalizado))
            return Result.Failure("El nombre de origen de orden es obligatorio.");

        var origen = await _context.OrigenesOrden.FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);
        if (origen == null)
            return Result.Failure("Origen de orden no encontrado.");

        origen.Actualizar(nombreNormalizado, request.EsIntegracionExterna, request.Descripcion);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}

public record CambiarEstadoOrigenOrdenCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoOrigenOrdenHandler : ICommandHandler<CambiarEstadoOrigenOrdenCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoOrigenOrdenHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoOrigenOrdenCommand request, CancellationToken cancellationToken)
    {
        var origen = await _context.OrigenesOrden.FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);
        if (origen == null)
            return Result.Failure("Origen de orden no encontrado.");

        if (request.Activo)
            origen.Activar();
        else
            origen.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// =========================================================================
// QUERIES
// =========================================================================

public record ObtenerOrigenesOrdenQuery(
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<OrigenOrdenDto>>>;

public class ObtenerOrigenesOrdenHandler : IQueryHandler<ObtenerOrigenesOrdenQuery, Result<List<OrigenOrdenDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerOrigenesOrdenHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<OrigenOrdenDto>>> HandleAsync(ObtenerOrigenesOrdenQuery request, CancellationToken cancellationToken)
    {
        var query = _context.OrigenesOrden.AsNoTracking().AsQueryable();

        if (request.SoloActivos == true)
            query = query.Where(o => o.Activo);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(o => o.Codigo.ToLower().Contains(search) || o.Nombre.ToLower().Contains(search));
        }

        var lista = await query
            .OrderBy(o => o.Codigo)
            .Select(o => new OrigenOrdenDto(
                o.Id,
                o.Codigo,
                o.Nombre,
                o.Descripcion,
                o.EsIntegracionExterna,
                o.Activo))
            .ToListAsync(cancellationToken);

        return Result<List<OrigenOrdenDto>>.Success(lista);
    }
}

public record ObtenerOrigenOrdenPorIdQuery(Guid Id) : IQuery<Result<OrigenOrdenDto>>;

public class ObtenerOrigenOrdenPorIdHandler : IQueryHandler<ObtenerOrigenOrdenPorIdQuery, Result<OrigenOrdenDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerOrigenOrdenPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrigenOrdenDto>> HandleAsync(ObtenerOrigenOrdenPorIdQuery request, CancellationToken cancellationToken)
    {
        var origen = await _context.OrigenesOrden.AsNoTracking()
            .Where(o => o.Id == request.Id)
            .Select(o => new OrigenOrdenDto(
                o.Id,
                o.Codigo,
                o.Nombre,
                o.Descripcion,
                o.EsIntegracionExterna,
                o.Activo))
            .FirstOrDefaultAsync(cancellationToken);

        return origen != null
            ? Result<OrigenOrdenDto>.Success(origen)
            : Result<OrigenOrdenDto>.Failure("Origen de orden no encontrado.");
    }
}
