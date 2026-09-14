using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.TiposTareaServicio.Features;

public record TipoTareaServicioDto(
    Guid Id,
    string CodigoTarea,
    string Nombre,
    string Categoria,
    int DuracionEstimadaMinutos,
    bool EsTareaSiebel,
    bool Activo);

// =========================================================================
// COMMANDS
// =========================================================================

public record CrearTipoTareaServicioCommand(
    string CodigoTarea,
    string Nombre,
    string Categoria,
    int DuracionEstimadaMinutos = 60,
    bool EsTareaSiebel = true
) : ICommand<Result<Guid>>;

public class CrearTipoTareaServicioHandler : ICommandHandler<CrearTipoTareaServicioCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearTipoTareaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearTipoTareaServicioCommand request, CancellationToken cancellationToken)
    {
        var codigoNormalizado = request.CodigoTarea?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(codigoNormalizado))
            return Result<Guid>.Failure("El código de la tarea es obligatorio.");

        var nombreNormalizado = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombreNormalizado))
            return Result<Guid>.Failure("El nombre de la tarea es obligatorio.");

        var categoriaNormalizada = request.Categoria?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(categoriaNormalizada))
            return Result<Guid>.Failure("La categoría de la tarea es obligatoria.");

        if (await _context.TiposTareaServicio.AnyAsync(t => t.CodigoTarea == codigoNormalizado, cancellationToken))
            return Result<Guid>.Failure($"Ya existe un tipo de tarea de servicio con el código '{codigoNormalizado}'.");

        var tarea = TipoTareaServicio.Crear(
            codigoNormalizado,
            nombreNormalizado,
            categoriaNormalizada,
            request.DuracionEstimadaMinutos <= 0 ? 60 : request.DuracionEstimadaMinutos,
            request.EsTareaSiebel);

        _context.TiposTareaServicio.Add(tarea);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(tarea.Id);
    }
}

public record ActualizarTipoTareaServicioCommand(
    Guid Id,
    string Nombre,
    string Categoria,
    int DuracionEstimadaMinutos,
    bool EsTareaSiebel
) : ICommand<Result>;

public class ActualizarTipoTareaServicioHandler : ICommandHandler<ActualizarTipoTareaServicioCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarTipoTareaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarTipoTareaServicioCommand request, CancellationToken cancellationToken)
    {
        var nombreNormalizado = request.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombreNormalizado))
            return Result.Failure("El nombre de la tarea es obligatorio.");

        var categoriaNormalizada = request.Categoria?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(categoriaNormalizada))
            return Result.Failure("La categoría de la tarea es obligatoria.");

        var tarea = await _context.TiposTareaServicio.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tarea == null)
            return Result.Failure("Tipo de tarea de servicio no encontrado.");

        tarea.Actualizar(
            nombreNormalizado,
            categoriaNormalizada,
            request.DuracionEstimadaMinutos <= 0 ? 60 : request.DuracionEstimadaMinutos,
            request.EsTareaSiebel);

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public record CambiarEstadoTipoTareaServicioCommand(Guid Id, bool Activo) : ICommand<Result>;

public class CambiarEstadoTipoTareaServicioHandler : ICommandHandler<CambiarEstadoTipoTareaServicioCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public CambiarEstadoTipoTareaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(CambiarEstadoTipoTareaServicioCommand request, CancellationToken cancellationToken)
    {
        var tarea = await _context.TiposTareaServicio.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tarea == null)
            return Result.Failure("Tipo de tarea de servicio no encontrado.");

        if (request.Activo)
            tarea.Activar();
        else
            tarea.Desactivar();

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

// =========================================================================
// QUERIES
// =========================================================================

public record ObtenerTiposTareaServicioQuery(
    string? Categoria = null,
    bool? SoloActivos = null,
    string? Search = null
) : IQuery<Result<List<TipoTareaServicioDto>>>;

public class ObtenerTiposTareaServicioHandler : IQueryHandler<ObtenerTiposTareaServicioQuery, Result<List<TipoTareaServicioDto>>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTiposTareaServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TipoTareaServicioDto>>> HandleAsync(ObtenerTiposTareaServicioQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TiposTareaServicio.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Categoria))
        {
            var cat = request.Categoria.Trim().ToUpperInvariant();
            query = query.Where(t => t.Categoria == cat);
        }

        if (request.SoloActivos == true)
            query = query.Where(t => t.Activo);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(t => t.CodigoTarea.ToLower().Contains(search) || t.Nombre.ToLower().Contains(search));
        }

        var lista = await query
            .OrderBy(t => t.Categoria)
            .ThenBy(t => t.CodigoTarea)
            .Select(t => new TipoTareaServicioDto(
                t.Id,
                t.CodigoTarea,
                t.Nombre,
                t.Categoria,
                t.DuracionEstimadaMinutos,
                t.EsTareaSiebel,
                t.Activo))
            .ToListAsync(cancellationToken);

        return Result<List<TipoTareaServicioDto>>.Success(lista);
    }
}

public record ObtenerTipoTareaServicioPorIdQuery(Guid Id) : IQuery<Result<TipoTareaServicioDto>>;

public class ObtenerTipoTareaServicioPorIdHandler : IQueryHandler<ObtenerTipoTareaServicioPorIdQuery, Result<TipoTareaServicioDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerTipoTareaServicioPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<TipoTareaServicioDto>> HandleAsync(ObtenerTipoTareaServicioPorIdQuery request, CancellationToken cancellationToken)
    {
        var tarea = await _context.TiposTareaServicio.AsNoTracking()
            .Where(t => t.Id == request.Id)
            .Select(t => new TipoTareaServicioDto(
                t.Id,
                t.CodigoTarea,
                t.Nombre,
                t.Categoria,
                t.DuracionEstimadaMinutos,
                t.EsTareaSiebel,
                t.Activo))
            .FirstOrDefaultAsync(cancellationToken);

        return tarea != null
            ? Result<TipoTareaServicioDto>.Success(tarea)
            : Result<TipoTareaServicioDto>.Failure("Tipo de tarea de servicio no encontrado.");
    }
}
