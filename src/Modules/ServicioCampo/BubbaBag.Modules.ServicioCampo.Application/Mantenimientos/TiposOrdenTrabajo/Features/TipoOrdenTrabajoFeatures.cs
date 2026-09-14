using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposOrdenTrabajo.Features;

public record TipoOrdenTrabajoDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    bool RequiereVisitaCampo,
    bool ExigeFirmaCliente,
    bool ExigeEvidenciasFotograficas,
    string ColorHex,
    bool Activo);

// =========================================================================
// COMMANDS
// =========================================================================

public record CrearTipoOrdenTrabajoCommand(
    string Codigo,
    string Nombre,
    bool RequiereVisitaCampo = true,
    bool ExigeFirmaCliente = true,
    bool ExigeEvidenciasFotograficas = true,
    string? Descripcion = null,
    string ColorHex = "#0f6cbd"
) : ICommand<Result<Guid>>;

public class CrearTipoOrdenTrabajoHandler : ICommandHandler<CrearTipoOrdenTrabajoCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearTipoOrdenTrabajoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearTipoOrdenTrabajoCommand request, CancellationToken cancellationToken)
    {
        var codigoNormalizado = request.Codigo?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(codigoNormalizado))
            return Result<Guid>.Failure("El código del tipo de orden es obligatorio.");

        var nombreNormalizado = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombreNormalizado))
            return Result<Guid>.Failure("El nombre del tipo de orden es obligatorio.");

        if (await _context.TiposOrdenTrabajo.AnyAsync(t => t.Codigo == codigoNormalizado, cancellationToken))
            return Result<Guid>.Failure($"Ya existe un tipo de orden de trabajo con el código '{codigoNormalizado}'.");

        var tipo = TipoOrdenTrabajo.Crear(
            codigoNormalizado,
            nombreNormalizado,
            request.RequiereVisitaCampo,
            request.ExigeFirmaCliente,
            request.ExigeEvidenciasFotograficas,
            request.Descripcion,
            string.IsNullOrWhiteSpace(request.ColorHex) ? "#0f6cbd" : request.ColorHex.Trim());

        _context.TiposOrdenTrabajo.Add(tipo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(tipo.Id);
    }
}

public record ActualizarTipoOrdenTrabajoCommand(
    Guid Id,
    string Nombre,
    bool RequiereVisitaCampo,
    bool ExigeFirmaCliente,
    bool ExigeEvidenciasFotograficas,
    string? Descripcion = null,
    string ColorHex = "#0f6cbd"
) : ICommand<Result>;

public class ActualizarTipoOrdenTrabajoHandler : ICommandHandler<ActualizarTipoOrdenTrabajoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarTipoOrdenTrabajoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarTipoOrdenTrabajoCommand request, CancellationToken cancellationToken)
    {
        var nombreNormalizado = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombreNormalizado))
            return Result.Failure("El nombre del tipo de orden es obligatorio.");

        var tipo = await _context.TiposOrdenTrabajo.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tipo == null)
            return Result.Failure("Tipo de orden de trabajo no encontrado.");

        tipo.Actualizar(
            nombreNormalizado,
            request.RequiereVisitaCampo,
            request.ExigeFirmaCliente,
            request.ExigeEvidenciasFotograficas,
            request.Descripcion,
            string.IsNullOrWhiteSpace(request.ColorHex) ? "#0f6cbd" : request.ColorHex.Trim());

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record CambiarEstadoTipoOrdenTrabajoCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoTipoOrdenTrabajoHandler : ICommandHandler<CambiarEstadoTipoOrdenTrabajoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoTipoOrdenTrabajoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoTipoOrdenTrabajoCommand request, CancellationToken cancellationToken)
    {
        var tipo = await _context.TiposOrdenTrabajo.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tipo == null)
            return Result.Failure("Tipo de orden de trabajo no encontrado.");

        if (request.Activo)
            tipo.Activar();
        else
            tipo.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// =========================================================================
// QUERIES
// =========================================================================

public record ObtenerTiposOrdenTrabajoQuery(
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<TipoOrdenTrabajoDto>>>;

public class ObtenerTiposOrdenTrabajoHandler : IQueryHandler<ObtenerTiposOrdenTrabajoQuery, Result<List<TipoOrdenTrabajoDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTiposOrdenTrabajoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TipoOrdenTrabajoDto>>> HandleAsync(ObtenerTiposOrdenTrabajoQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TiposOrdenTrabajo.AsNoTracking().AsQueryable();

        if (request.SoloActivos == true)
            query = query.Where(t => t.Activo);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(t => t.Codigo.ToLower().Contains(search) || t.Nombre.ToLower().Contains(search));
        }

        var lista = await query
            .OrderBy(t => t.Codigo)
            .Select(t => new TipoOrdenTrabajoDto(
                t.Id,
                t.Codigo,
                t.Nombre,
                t.Descripcion,
                t.RequiereVisitaCampo,
                t.ExigeFirmaCliente,
                t.ExigeEvidenciasFotograficas,
                t.ColorHex,
                t.Activo))
            .ToListAsync(cancellationToken);

        return Result<List<TipoOrdenTrabajoDto>>.Success(lista);
    }
}

public record ObtenerTipoOrdenTrabajoPorIdQuery(Guid Id) : IQuery<Result<TipoOrdenTrabajoDto>>;

public class ObtenerTipoOrdenTrabajoPorIdHandler : IQueryHandler<ObtenerTipoOrdenTrabajoPorIdQuery, Result<TipoOrdenTrabajoDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTipoOrdenTrabajoPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<TipoOrdenTrabajoDto>> HandleAsync(ObtenerTipoOrdenTrabajoPorIdQuery request, CancellationToken cancellationToken)
    {
        var tipo = await _context.TiposOrdenTrabajo.AsNoTracking()
            .Where(t => t.Id == request.Id)
            .Select(t => new TipoOrdenTrabajoDto(
                t.Id,
                t.Codigo,
                t.Nombre,
                t.Descripcion,
                t.RequiereVisitaCampo,
                t.ExigeFirmaCliente,
                t.ExigeEvidenciasFotograficas,
                t.ColorHex,
                t.Activo))
            .FirstOrDefaultAsync(cancellationToken);

        return tipo != null
            ? Result<TipoOrdenTrabajoDto>.Success(tipo)
            : Result<TipoOrdenTrabajoDto>.Failure("Tipo de orden de trabajo no encontrado.");
    }
}
