using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.MotivosRetiroEquipo;

public record MotivoRetiroEquipoDto(
    Guid Id,
    string Nombre,
    TipoRetiroEquipo TipoRetiro,
    string? Descripcion,
    bool Activo,
    DateTime CreatedAt);

// ==========================================
// QUERIES
// ==========================================
public record ObtenerMotivosRetiroEquipoQuery(
    TipoRetiroEquipo? Tipo = null,
    bool? SoloActivos = null,
    string? Buscar = null) : IQuery<Result<List<MotivoRetiroEquipoDto>>>;

public class ObtenerMotivosRetiroEquipoHandler : IQueryHandler<ObtenerMotivosRetiroEquipoQuery, Result<List<MotivoRetiroEquipoDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerMotivosRetiroEquipoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<MotivoRetiroEquipoDto>>> HandleAsync(ObtenerMotivosRetiroEquipoQuery request, CancellationToken cancellationToken)
    {
        var query = _context.MotivosRetiroEquipo.AsNoTracking();

        if (request.Tipo.HasValue)
        {
            query = query.Where(m => m.TipoRetiro == request.Tipo.Value);
        }

        if (request.SoloActivos.HasValue && request.SoloActivos.Value)
        {
            query = query.Where(m => m.Activo);
        }

        if (!string.IsNullOrWhiteSpace(request.Buscar))
        {
            var b = request.Buscar.Trim().ToLower();
            query = query.Where(m => m.Nombre.ToLower().Contains(b) || (m.Descripcion != null && m.Descripcion.ToLower().Contains(b)));
        }

        var lista = await query
            .OrderBy(m => m.Nombre)
            .Select(m => new MotivoRetiroEquipoDto(
                m.Id,
                m.Nombre,
                m.TipoRetiro,
                m.Descripcion,
                m.Activo,
                m.CreatedAt))
            .ToListAsync(cancellationToken);

        return Result<List<MotivoRetiroEquipoDto>>.Success(lista);
    }
}

public record ObtenerMotivoRetiroEquipoPorIdQuery(Guid Id) : IQuery<Result<MotivoRetiroEquipoDto>>;

public class ObtenerMotivoRetiroEquipoPorIdHandler : IQueryHandler<ObtenerMotivoRetiroEquipoPorIdQuery, Result<MotivoRetiroEquipoDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerMotivoRetiroEquipoPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<MotivoRetiroEquipoDto>> HandleAsync(ObtenerMotivoRetiroEquipoPorIdQuery request, CancellationToken cancellationToken)
    {
        var motivo = await _context.MotivosRetiroEquipo.AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);

        if (motivo == null)
            return Result<MotivoRetiroEquipoDto>.Failure("El motivo de retiro especificado no existe.");

        return Result<MotivoRetiroEquipoDto>.Success(new MotivoRetiroEquipoDto(
            motivo.Id,
            motivo.Nombre,
            motivo.TipoRetiro,
            motivo.Descripcion,
            motivo.Activo,
            motivo.CreatedAt));
    }
}

// ==========================================
// COMMANDS
// ==========================================
public record CrearMotivoRetiroEquipoCommand(
    string Nombre,
    TipoRetiroEquipo TipoRetiro,
    string? Descripcion = null) : ICommand<Result<Guid>>;

public class CrearMotivoRetiroEquipoHandler : ICommandHandler<CrearMotivoRetiroEquipoCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearMotivoRetiroEquipoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearMotivoRetiroEquipoCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return Result<Guid>.Failure("El nombre del motivo de retiro es obligatorio.");

        var nomNorm = request.Nombre.Trim();
        var existe = await _context.MotivosRetiroEquipo
            .AnyAsync(m => m.Nombre.ToLower() == nomNorm.ToLower() && m.TipoRetiro == request.TipoRetiro, cancellationToken);

        if (existe)
            return Result<Guid>.Failure($"Ya existe un motivo con el nombre '{nomNorm}' para este tipo de retiro.");

        var nuevo = MotivoRetiroEquipo.Crear(
            nomNorm,
            request.TipoRetiro,
            request.Descripcion);

        _context.MotivosRetiroEquipo.Add(nuevo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(nuevo.Id);
    }
}

public record ActualizarMotivoRetiroEquipoCommand(
    Guid Id,
    string Nombre,
    TipoRetiroEquipo TipoRetiro,
    string? Descripcion = null) : ICommand<Result>;

public class ActualizarMotivoRetiroEquipoHandler : ICommandHandler<ActualizarMotivoRetiroEquipoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarMotivoRetiroEquipoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarMotivoRetiroEquipoCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return Result.Failure("El nombre del motivo de retiro es obligatorio.");

        var motivo = await _context.MotivosRetiroEquipo.FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        if (motivo == null)
            return Result.Failure("El motivo de retiro especificado no existe.");

        motivo.Actualizar(request.Nombre, request.TipoRetiro, request.Descripcion);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}

public record CambiarEstadoMotivoRetiroEquipoCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoMotivoRetiroEquipoHandler : ICommandHandler<CambiarEstadoMotivoRetiroEquipoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoMotivoRetiroEquipoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoMotivoRetiroEquipoCommand request, CancellationToken cancellationToken)
    {
        var motivo = await _context.MotivosRetiroEquipo.FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        if (motivo == null)
            return Result.Failure("El motivo de retiro especificado no existe.");

        motivo.CambiarEstado(request.Activo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}

public record EliminarMotivoRetiroEquipoCommand(Guid Id) : ICommand<Result>;

public class EliminarMotivoRetiroEquipoHandler : ICommandHandler<EliminarMotivoRetiroEquipoCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public EliminarMotivoRetiroEquipoHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(EliminarMotivoRetiroEquipoCommand request, CancellationToken cancellationToken)
    {
        var motivo = await _context.MotivosRetiroEquipo.FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        if (motivo == null)
            return Result.Failure("El motivo de retiro especificado no existe.");

        _context.MotivosRetiroEquipo.Remove(motivo);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
