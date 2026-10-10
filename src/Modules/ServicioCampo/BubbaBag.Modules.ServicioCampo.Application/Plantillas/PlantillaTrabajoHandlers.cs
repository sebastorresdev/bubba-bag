using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Plantillas.Dtos;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Plantillas;

// Commands
public record CrearPlantillaTrabajoCommand(CrearPlantillaTrabajoRequest Request) : ICommand<Result<Guid>>;
public record ActualizarPlantillaTrabajoCommand(Guid Id, ActualizarPlantillaTrabajoRequest Request) : ICommand<Result>;
public record CambiarEstadoPlantillaTrabajoCommand(Guid Id, bool Activo) : ICommand<Result>;
public record EliminarPlantillaTrabajoCommand(Guid Id) : ICommand<Result>;

public record CrearTareaCommand(CrearTareaRequest Request) : ICommand<Result<Guid>>;
public record ActualizarTareaCommand(Guid Id, ActualizarTareaRequest Request) : ICommand<Result>;
public record EliminarTareaCommand(Guid Id) : ICommand<Result>;

// Queries
public record ObtenerPlantillasTrabajoQuery(Guid? ProductoId, bool? SoloActivos, string? Search) : IQuery<Result<List<PlantillaTrabajoListadoDto>>>;
public record ObtenerPlantillaTrabajoPorIdQuery(Guid Id) : IQuery<Result<PlantillaTrabajoDetalleDto>>;
public record ObtenerTareasQuery(bool? SoloActivas, string? Search) : IQuery<Result<List<TareaDto>>>;
public record ObtenerTareaPorIdQuery(Guid Id) : IQuery<Result<TareaDto>>;

public class PlantillaTrabajoHandlers :
    ICommandHandler<CrearPlantillaTrabajoCommand, Result<Guid>>,
    ICommandHandler<ActualizarPlantillaTrabajoCommand, Result>,
    ICommandHandler<CambiarEstadoPlantillaTrabajoCommand, Result>,
    ICommandHandler<EliminarPlantillaTrabajoCommand, Result>,
    ICommandHandler<CrearTareaCommand, Result<Guid>>,
    ICommandHandler<ActualizarTareaCommand, Result>,
    ICommandHandler<EliminarTareaCommand, Result>,
    IQueryHandler<ObtenerPlantillasTrabajoQuery, Result<List<PlantillaTrabajoListadoDto>>>,
    IQueryHandler<ObtenerPlantillaTrabajoPorIdQuery, Result<PlantillaTrabajoDetalleDto>>,
    IQueryHandler<ObtenerTareasQuery, Result<List<TareaDto>>>,
    IQueryHandler<ObtenerTareaPorIdQuery, Result<TareaDto>>
{
    private readonly IServicioCampoDbContext _context;

    public PlantillaTrabajoHandlers(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearPlantillaTrabajoCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return Result<Guid>.Failure("El nombre de la plantilla es obligatorio.");

        if (req.ProductoId == Guid.Empty)
            return Result<Guid>.Failure("Debe seleccionar un producto o servicio de catálogo.");

        var productoExiste = await _context.Productos.AnyAsync(p => p.Id == req.ProductoId, ct);
        if (!productoExiste)
            return Result<Guid>.Failure("El producto/servicio seleccionado no existe.");

        var codigo = req.Codigo?.Trim();
        if (string.IsNullOrWhiteSpace(codigo))
        {
            var count = await _context.PlantillasTrabajo.CountAsync(ct) + 1;
            codigo = $"PLN-{count:D5}";
        }

        var existeCodigo = await _context.PlantillasTrabajo.AnyAsync(p => p.Codigo == codigo, ct);
        if (existeCodigo)
            return Result<Guid>.Failure($"Ya existe una plantilla con el código '{codigo}'.");

        var plantilla = PlantillaTrabajo.Crear(
            codigo,
            req.Nombre,
            req.ProductoId,
            req.DuracionEstimadaMinutos,
            req.Descripcion,
            req.EsPredeterminada);

        if (req.Tareas != null)
        {
            var sec = 1;
            foreach (var t in req.Tareas)
            {
                if (t.TareaId != Guid.Empty)
                {
                    plantilla.AgregarTarea(t.TareaId, t.OrdenSecuencia > 0 ? t.OrdenSecuencia : sec, t.EsObligatoria, t.RequiereEvidencia, t.Instrucciones);
                    sec++;
                }
            }
        }

        if (req.Materiales != null)
        {
            foreach (var m in req.Materiales)
            {
                if (m.ProductoId != Guid.Empty && m.CantidadPrevista > 0)
                {
                    plantilla.AgregarMaterial(m.ProductoId, m.CantidadPrevista, m.EsObligatorio, m.Observaciones);
                }
            }
        }

        _context.PlantillasTrabajo.Add(plantilla);
        await ((DbContext)_context).SaveChangesAsync(ct);

        return Result<Guid>.Success(plantilla.Id);
    }

    public async Task<Result> HandleAsync(ActualizarPlantillaTrabajoCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return Result.Failure("El nombre de la plantilla es obligatorio.");

        var plantilla = await _context.PlantillasTrabajo
            .Include(p => p.Tareas)
            .Include(p => p.Materiales)
            .FirstOrDefaultAsync(p => p.Id == command.Id, ct);

        if (plantilla == null)
            return Result.Failure("Plantilla de trabajo no encontrada.");

        plantilla.Actualizar(req.Nombre, req.DuracionEstimadaMinutos, req.Descripcion, req.EsPredeterminada, req.ProductoId);

        plantilla.LimpiarTareas();
        plantilla.LimpiarMateriales();

        if (req.Tareas != null)
        {
            var sec = 1;
            foreach (var t in req.Tareas)
            {
                if (t.TareaId != Guid.Empty)
                {
                    plantilla.AgregarTarea(t.TareaId, t.OrdenSecuencia > 0 ? t.OrdenSecuencia : sec, t.EsObligatoria, t.RequiereEvidencia, t.Instrucciones);
                    sec++;
                }
            }
        }

        if (req.Materiales != null)
        {
            foreach (var m in req.Materiales)
            {
                if (m.ProductoId != Guid.Empty && m.CantidadPrevista > 0)
                {
                    plantilla.AgregarMaterial(m.ProductoId, m.CantidadPrevista, m.EsObligatorio, m.Observaciones);
                }
            }
        }

        await ((DbContext)_context).SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(CambiarEstadoPlantillaTrabajoCommand command, CancellationToken ct = default)
    {
        var plantilla = await _context.PlantillasTrabajo.FirstOrDefaultAsync(p => p.Id == command.Id, ct);
        if (plantilla == null)
            return Result.Failure("Plantilla de trabajo no encontrada.");

        if (command.Activo)
            plantilla.Activar();
        else
            plantilla.Desactivar();

        await ((DbContext)_context).SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(EliminarPlantillaTrabajoCommand command, CancellationToken ct = default)
    {
        var plantilla = await _context.PlantillasTrabajo
            .Include(p => p.Tareas)
            .Include(p => p.Materiales)
            .FirstOrDefaultAsync(p => p.Id == command.Id, ct);

        if (plantilla == null)
            return Result.Failure("Plantilla de trabajo no encontrada.");

        _context.PlantillasTrabajo.Remove(plantilla);
        await ((DbContext)_context).SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<Guid>> HandleAsync(CrearTareaCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return Result<Guid>.Failure("El nombre de la tarea es obligatorio.");

        var codigo = req.Codigo?.Trim();
        if (string.IsNullOrWhiteSpace(codigo))
        {
            var count = await _context.Tareas.CountAsync(ct) + 1;
            codigo = $"TAR-{count:D4}";
        }

        var existe = await _context.Tareas.AnyAsync(t => t.Codigo == codigo, ct);
        if (existe)
            return Result<Guid>.Failure($"Ya existe una tarea con el código '{codigo}'.");

        var tarea = Tarea.Crear(
            codigo,
            req.Nombre,
            req.Descripcion,
            req.DuracionEstimadaMinutos,
            req.RequiereEvidenciaFotografica);

        _context.Tareas.Add(tarea);
        await ((DbContext)_context).SaveChangesAsync(ct);

        return Result<Guid>.Success(tarea.Id);
    }

    public async Task<Result> HandleAsync(ActualizarTareaCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        var tarea = await _context.Tareas.FirstOrDefaultAsync(t => t.Id == command.Id, ct);
        if (tarea == null)
            return Result.Failure("Tarea no encontrada.");

        tarea.Actualizar(req.Nombre, req.Descripcion, req.DuracionEstimadaMinutos, req.RequiereEvidenciaFotografica);
        await ((DbContext)_context).SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(EliminarTareaCommand command, CancellationToken ct = default)
    {
        var tarea = await _context.Tareas.FirstOrDefaultAsync(t => t.Id == command.Id, ct);
        if (tarea == null)
            return Result.Failure("Tarea no encontrada.");

        var enUso = await _context.PlantillasTareas.AnyAsync(pt => pt.TareaId == command.Id, ct);
        if (enUso)
            return Result.Failure("No se puede eliminar la tarea porque forma parte de una o más plantillas de trabajo.");

        _context.Tareas.Remove(tarea);
        await ((DbContext)_context).SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<List<PlantillaTrabajoListadoDto>>> HandleAsync(ObtenerPlantillasTrabajoQuery query, CancellationToken ct = default)
    {
        var q = _context.PlantillasTrabajo
            .AsNoTracking()
            .Include(p => p.Producto)
            .Include(p => p.Tareas)
            .Include(p => p.Materiales)
            .AsQueryable();

        if (query.ProductoId.HasValue && query.ProductoId.Value != Guid.Empty)
            q = q.Where(p => p.ProductoId == query.ProductoId.Value);

        if (query.SoloActivos == true)
            q = q.Where(p => p.Activo);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            q = q.Where(p => p.Codigo.ToLower().Contains(search) ||
                             p.Nombre.ToLower().Contains(search) ||
                             (p.Producto != null && p.Producto.Nombre.ToLower().Contains(search)));
        }

        var items = await q.OrderBy(p => p.Nombre).ToListAsync(ct);

        var dtos = items.Select(p => new PlantillaTrabajoListadoDto(
            p.Id,
            p.Codigo,
            p.Nombre,
            p.Descripcion,
            p.ProductoId,
            p.Producto != null ? p.Producto.Codigo : string.Empty,
            p.Producto != null ? p.Producto.Nombre : string.Empty,
            p.DuracionEstimadaMinutos,
            p.EsPredeterminada,
            p.Activo,
            p.Tareas.Count,
            p.Materiales.Count,
            p.CreatedAt
        )).ToList();

        return Result<List<PlantillaTrabajoListadoDto>>.Success(dtos);
    }

    public async Task<Result<PlantillaTrabajoDetalleDto>> HandleAsync(ObtenerPlantillaTrabajoPorIdQuery query, CancellationToken ct = default)
    {
        var p = await _context.PlantillasTrabajo
            .AsNoTracking()
            .Include(x => x.Producto)
            .Include(x => x.Tareas)
                .ThenInclude(t => t.Tarea)
            .Include(x => x.Materiales)
                .ThenInclude(m => m.Producto)
                    .ThenInclude(prod => prod.UnidadMedidaDefecto)
            .FirstOrDefaultAsync(x => x.Id == query.Id, ct);

        if (p == null)
            return Result<PlantillaTrabajoDetalleDto>.Failure("Plantilla de trabajo no encontrada.");

        var tareasDto = p.Tareas
            .OrderBy(t => t.OrdenSecuencia)
            .Select(t => new PlantillaTareaItemDto(
                t.Id,
                t.TareaId,
                t.Tarea != null ? t.Tarea.Codigo : string.Empty,
                t.Tarea != null ? t.Tarea.Nombre : string.Empty,
                t.OrdenSecuencia,
                t.EsObligatoria,
                t.RequiereEvidencia,
                t.Instrucciones,
                t.Tarea != null ? t.Tarea.DuracionEstimadaMinutos : 15
            )).ToList();

        var materialesDto = p.Materiales.Select(m => new PlantillaMaterialItemDto(
            m.Id,
            m.ProductoId,
            m.Producto != null ? m.Producto.Codigo : string.Empty,
            m.Producto != null ? m.Producto.Nombre : string.Empty,
            m.CantidadPrevista,
            m.EsObligatorio,
            m.Observaciones,
            m.Producto != null && m.Producto.EsSerializado,
            m.Producto?.UnidadMedidaDefecto?.Nombre ?? "UND"
        )).ToList();

        var dto = new PlantillaTrabajoDetalleDto(
            p.Id,
            p.Codigo,
            p.Nombre,
            p.Descripcion,
            p.ProductoId,
            p.Producto != null ? p.Producto.Codigo : string.Empty,
            p.Producto != null ? p.Producto.Nombre : string.Empty,
            p.DuracionEstimadaMinutos,
            p.EsPredeterminada,
            p.Activo,
            p.CreatedAt,
            tareasDto,
            materialesDto
        );

        return Result<PlantillaTrabajoDetalleDto>.Success(dto);
    }

    public async Task<Result<List<TareaDto>>> HandleAsync(ObtenerTareasQuery query, CancellationToken ct = default)
    {
        var q = _context.Tareas.AsNoTracking().AsQueryable();

        if (query.SoloActivas == true)
            q = q.Where(t => t.Activo);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            q = q.Where(t => t.Codigo.ToLower().Contains(search) || t.Nombre.ToLower().Contains(search));
        }

        var items = await q.OrderBy(t => t.Nombre).ToListAsync(ct);
        var dtos = items.Select(t => new TareaDto(
            t.Id,
            t.Codigo,
            t.Nombre,
            t.Descripcion,
            t.DuracionEstimadaMinutos,
            t.RequiereEvidenciaFotografica,
            t.Activo
        )).ToList();

        return Result<List<TareaDto>>.Success(dtos);
    }

    public async Task<Result<TareaDto>> HandleAsync(ObtenerTareaPorIdQuery query, CancellationToken ct = default)
    {
        var t = await _context.Tareas.AsNoTracking().FirstOrDefaultAsync(x => x.Id == query.Id, ct);
        if (t == null)
            return Result<TareaDto>.Failure("Tarea no encontrada.");

        var dto = new TareaDto(
            t.Id,
            t.Codigo,
            t.Nombre,
            t.Descripcion,
            t.DuracionEstimadaMinutos,
            t.RequiereEvidenciaFotografica,
            t.Activo
        );

        return Result<TareaDto>.Success(dto);
    }
}
