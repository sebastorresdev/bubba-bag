using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Enums;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosIncidencia.Features;

public record MotivoIncidenciaDto(
    Guid Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    AmbitoMotivo Ambito,
    bool Activo);

// =========================================================================
// COMMANDS
// =========================================================================

public record CrearMotivoIncidenciaCommand(
    string Codigo,
    string Nombre,
    AmbitoMotivo Ambito,
    string? Descripcion = null
) : ICommand<Result<Guid>>;

public class CrearMotivoIncidenciaHandler : ICommandHandler<CrearMotivoIncidenciaCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearMotivoIncidenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearMotivoIncidenciaCommand request, CancellationToken cancellationToken)
    {
        var codigoNormalizado = request.Codigo?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(codigoNormalizado))
            return Result<Guid>.Failure("El código del motivo es obligatorio.");

        var nombreNormalizado = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombreNormalizado))
            return Result<Guid>.Failure("El nombre del motivo es obligatorio.");

        if (await _context.MotivosIncidencia.AnyAsync(m => m.Codigo == codigoNormalizado, cancellationToken))
            return Result<Guid>.Failure($"Ya existe un motivo de incidencia con el código '{codigoNormalizado}'.");

        var motivo = MotivoIncidencia.Crear(codigoNormalizado, nombreNormalizado, request.Ambito, request.Descripcion);
        _context.MotivosIncidencia.Add(motivo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(motivo.Id);
    }
}

public record ActualizarMotivoIncidenciaCommand(
    Guid Id,
    string Nombre,
    AmbitoMotivo Ambito,
    string? Descripcion = null
) : ICommand<Result>;

public class ActualizarMotivoIncidenciaHandler : ICommandHandler<ActualizarMotivoIncidenciaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarMotivoIncidenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarMotivoIncidenciaCommand request, CancellationToken cancellationToken)
    {
        var nombreNormalizado = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombreNormalizado))
            return Result.Failure("El nombre del motivo es obligatorio.");

        var motivo = await _context.MotivosIncidencia.FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        if (motivo == null)
            return Result.Failure("Motivo de incidencia no encontrado.");

        motivo.Actualizar(nombreNormalizado, request.Ambito, request.Descripcion);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}

public record CambiarEstadoMotivoIncidenciaCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoMotivoIncidenciaHandler : ICommandHandler<CambiarEstadoMotivoIncidenciaCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoMotivoIncidenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoMotivoIncidenciaCommand request, CancellationToken cancellationToken)
    {
        var motivo = await _context.MotivosIncidencia.FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        if (motivo == null)
            return Result.Failure("Motivo de incidencia no encontrado.");

        if (request.Activo)
            motivo.Activar();
        else
            motivo.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// =========================================================================
// QUERIES
// =========================================================================

public record ObtenerMotivosIncidenciaQuery(
    AmbitoMotivo? Ambito = null,
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<MotivoIncidenciaDto>>>;

public class ObtenerMotivosIncidenciaHandler : IQueryHandler<ObtenerMotivosIncidenciaQuery, Result<List<MotivoIncidenciaDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerMotivosIncidenciaHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<MotivoIncidenciaDto>>> HandleAsync(ObtenerMotivosIncidenciaQuery request, CancellationToken cancellationToken)
    {
        var query = _context.MotivosIncidencia.AsNoTracking().AsQueryable();

        if (request.Ambito.HasValue)
            query = query.Where(m => m.Ambito == request.Ambito.Value);

        if (request.SoloActivos == true)
            query = query.Where(m => m.Activo);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(m => m.Codigo.ToLower().Contains(search) || m.Nombre.ToLower().Contains(search));
        }

        var lista = await query
            .OrderBy(m => m.Ambito)
            .ThenBy(m => m.Codigo)
            .Select(m => new MotivoIncidenciaDto(
                m.Id,
                m.Codigo,
                m.Nombre,
                m.Descripcion,
                m.Ambito,
                m.Activo))
            .ToListAsync(cancellationToken);

        return Result<List<MotivoIncidenciaDto>>.Success(lista);
    }
}

public record ObtenerMotivoIncidenciaPorIdQuery(Guid Id) : IQuery<Result<MotivoIncidenciaDto>>;

public class ObtenerMotivoIncidenciaPorIdHandler : IQueryHandler<ObtenerMotivoIncidenciaPorIdQuery, Result<MotivoIncidenciaDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerMotivoIncidenciaPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<MotivoIncidenciaDto>> HandleAsync(ObtenerMotivoIncidenciaPorIdQuery request, CancellationToken cancellationToken)
    {
        var motivo = await _context.MotivosIncidencia.AsNoTracking()
            .Where(m => m.Id == request.Id)
            .Select(m => new MotivoIncidenciaDto(
                m.Id,
                m.Codigo,
                m.Nombre,
                m.Descripcion,
                m.Ambito,
                m.Activo))
            .FirstOrDefaultAsync(cancellationToken);

        return motivo != null
            ? Result<MotivoIncidenciaDto>.Success(motivo)
            : Result<MotivoIncidenciaDto>.Failure("Motivo de incidencia no encontrado.");
    }
}
