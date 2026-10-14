using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Plantillas.Dtos;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using BubbaBag.SharedKernel;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Plantillas;

// Commands
public record CrearConfiguracionServicioCommand(CrearConfiguracionServicioRequest Request) : ICommand<Result<Guid>>;
public record ActualizarConfiguracionServicioCommand(Guid Id, ActualizarConfiguracionServicioRequest Request) : ICommand<Result>;
public record CambiarEstadoConfiguracionServicioCommand(Guid Id, bool Activo) : ICommand<Result>;
public record EliminarConfiguracionServicioCommand(Guid Id) : ICommand<Result>;

public record CrearTareaCommand(CrearTareaRequest Request) : ICommand<Result<Guid>>;
public record ActualizarTareaCommand(Guid Id, ActualizarTareaRequest Request) : ICommand<Result>;
public record EliminarTareaCommand(Guid Id) : ICommand<Result>;

// Queries
public record ObtenerConfiguracionesServicioQuery(Guid? ProductoId, bool? SoloActivos, string? Search) : IQuery<Result<List<ConfiguracionServicioListadoDto>>>;
public record ObtenerConfiguracionServicioPorIdQuery(Guid Id) : IQuery<Result<ConfiguracionServicioDetalleDto>>;
public record ObtenerTareasQuery(bool? SoloActivas, string? Search) : IQuery<Result<List<TareaDto>>>;
public record ObtenerTareaPorIdQuery(Guid Id) : IQuery<Result<TareaDto>>;

public class ConfiguracionServicioHandlers :
    ICommandHandler<CrearConfiguracionServicioCommand, Result<Guid>>,
    ICommandHandler<ActualizarConfiguracionServicioCommand, Result>,
    ICommandHandler<CambiarEstadoConfiguracionServicioCommand, Result>,
    ICommandHandler<EliminarConfiguracionServicioCommand, Result>,
    ICommandHandler<CrearTareaCommand, Result<Guid>>,
    ICommandHandler<ActualizarTareaCommand, Result>,
    ICommandHandler<EliminarTareaCommand, Result>,
    IQueryHandler<ObtenerConfiguracionesServicioQuery, Result<List<ConfiguracionServicioListadoDto>>>,
    IQueryHandler<ObtenerConfiguracionServicioPorIdQuery, Result<ConfiguracionServicioDetalleDto>>,
    IQueryHandler<ObtenerTareasQuery, Result<List<TareaDto>>>,
    IQueryHandler<ObtenerTareaPorIdQuery, Result<TareaDto>>
{
    private readonly IServicioCampoDbContext _context;

    public ConfiguracionServicioHandlers(IServicioCampoDbContext context)
    {
        _context = context;
    }

    private async Task<string?> ValidarConfiguracion(Guid productoId,
        List<GuardarConfiguracionTareaDto>? tareas, List<GuardarConfiguracionMaterialDto>? materiales, Guid? id, bool activa, CancellationToken ct)
    {
        if (!await _context.Productos.AnyAsync(p => p.Id == productoId && p.Tipo == TipoProducto.Servicio && p.Activo, ct))
            return "Seleccione un producto activo de tipo Servicio.";
        if (activa && await _context.ConfiguracionesServicio.AnyAsync(x => x.ProductoId == productoId && x.Activo && x.Id != id, ct))
            return "Ya existe una configuración activa para este servicio. Edítela o desactívela antes de crear otra.";
        foreach (var tarea in tareas ?? [])
            if (!await _context.Tareas.AnyAsync(t => t.Id == tarea.TareaId && t.Activo, ct)) return "Seleccione tareas activas del catálogo.";
        foreach (var material in materiales ?? [])
        {
            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == material.ProductoId, ct);
            if (producto == null || !producto.Activo || producto.Tipo != TipoProducto.Inventario || material.CantidadPrevista <= 0)
                return "Los materiales deben ser productos activos de inventario con cantidad mayor que cero.";
            if (material.UnidadMedidaId.HasValue && !await _context.UnidadesMedida.AnyAsync(u => u.Id == material.UnidadMedidaId && u.GrupoUnidadMedidaId == producto.GrupoUnidadMedidaId, ct))
                return "La unidad del material no pertenece a su grupo de unidades.";
        }
        return null;
    }

    public async Task<Result<Guid>> HandleAsync(CrearConfiguracionServicioCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return Result<Guid>.Failure("El nombre de la plantilla es obligatorio.");

        var error = await ValidarConfiguracion(req.ProductoId, req.Tareas, req.Materiales, null, true, ct);
        if (error != null) return Result<Guid>.Failure(error);

        var plantilla = ConfiguracionServicio.Crear(
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
                    plantilla.AgregarMaterial(m.ProductoId, m.CantidadPrevista, m.EsObligatorio, m.Observaciones, m.UnidadMedidaId);
                }
            }
        }

        _context.ConfiguracionesServicio.Add(plantilla);
        await ((DbContext)_context).SaveChangesAsync(ct);

        return Result<Guid>.Success(plantilla.Id);
    }

    public async Task<Result> HandleAsync(ActualizarConfiguracionServicioCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return Result.Failure("El nombre de la plantilla es obligatorio.");

        var plantilla = await _context.ConfiguracionesServicio
            .Include(p => p.Tareas)
            .Include(p => p.Materiales)
            .FirstOrDefaultAsync(p => p.Id == command.Id, ct);

        if (plantilla == null)
            return Result.Failure("Configuración del servicio no encontrada.");

        if (plantilla.ProductoId != req.ProductoId)
            return Result.Failure("El servicio de una configuración existente no puede cambiar. Cree otra configuración.");
        var error = await ValidarConfiguracion(req.ProductoId, req.Tareas, req.Materiales, command.Id, plantilla.Activo, ct);
        if (error != null) return Result.Failure(error);

        plantilla.Actualizar(req.Nombre, req.DuracionEstimadaMinutos, req.Descripcion, req.EsPredeterminada, req.ProductoId);

        if (plantilla.Tareas.Any())
        {
            _context.ConfiguracionesTareas.RemoveRange(plantilla.Tareas);
        }
        if (plantilla.Materiales.Any())
        {
            _context.ConfiguracionesMateriales.RemoveRange(plantilla.Materiales);
        }

        if (req.Tareas != null)
        {
            var sec = 1;
            foreach (var t in req.Tareas)
            {
                if (t.TareaId != Guid.Empty)
                {
                    var nuevaTarea = ConfiguracionTarea.Crear(
                        plantilla.Id,
                        t.TareaId,
                        t.OrdenSecuencia > 0 ? t.OrdenSecuencia : sec,
                        t.EsObligatoria,
                        t.RequiereEvidencia,
                        t.Instrucciones
                    );
                    _context.ConfiguracionesTareas.Add(nuevaTarea);
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
                    var nuevoMaterial = ConfiguracionMaterial.Crear(
                        plantilla.Id,
                        m.ProductoId,
                        m.CantidadPrevista,
                        m.EsObligatorio,
                        m.Observaciones,
                        m.UnidadMedidaId
                    );
                    _context.ConfiguracionesMateriales.Add(nuevoMaterial);
                }
            }
        }

        await ((DbContext)_context).SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(CambiarEstadoConfiguracionServicioCommand command, CancellationToken ct = default)
    {
        var plantilla = await _context.ConfiguracionesServicio.FirstOrDefaultAsync(p => p.Id == command.Id, ct);
        if (plantilla == null)
            return Result.Failure("Configuración del servicio no encontrada.");

        if (command.Activo && await _context.ConfiguracionesServicio.AnyAsync(x => x.Id != command.Id && x.ProductoId == plantilla.ProductoId && x.Activo, ct))
            return Result.Failure("Ya existe una configuración activa para este servicio.");
        if (command.Activo)
            plantilla.Activar();
        else
            plantilla.Desactivar();

        await ((DbContext)_context).SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(EliminarConfiguracionServicioCommand command, CancellationToken ct = default)
    {
        var plantilla = await _context.ConfiguracionesServicio
            .Include(p => p.Tareas)
            .Include(p => p.Materiales)
            .FirstOrDefaultAsync(p => p.Id == command.Id, ct);

        if (plantilla == null)
            return Result.Failure("Configuración del servicio no encontrada.");

        if (await _context.Trabajos.AnyAsync(t => t.ConfiguracionServicioId == command.Id, ct))
            return Result.Failure("La configuración tiene trabajos asociados. Desactívela para conservar el historial.");
        _context.ConfiguracionesServicio.Remove(plantilla);
        await ((DbContext)_context).SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<Guid>> HandleAsync(CrearTareaCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return Result<Guid>.Failure("El nombre de la tarea es obligatorio.");

        var tarea = Tarea.Crear(
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

        var enUso = await _context.ConfiguracionesTareas.AnyAsync(pt => pt.TareaId == command.Id, ct);
        if (enUso)
            return Result.Failure("No se puede eliminar la tarea porque forma parte de una o más configuraciones de servicio.");

        _context.Tareas.Remove(tarea);
        await ((DbContext)_context).SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<List<ConfiguracionServicioListadoDto>>> HandleAsync(ObtenerConfiguracionesServicioQuery query, CancellationToken ct = default)
    {
        var q = _context.ConfiguracionesServicio
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
            q = q.Where(p => p.Nombre.ToLower().Contains(search) ||
                             (p.Producto != null && p.Producto.Nombre.ToLower().Contains(search)));
        }

        var items = await q.OrderBy(p => p.Nombre).ToListAsync(ct);

        var dtos = items.Select(p => new ConfiguracionServicioListadoDto(
            p.Id,
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

        return Result<List<ConfiguracionServicioListadoDto>>.Success(dtos);
    }

    public async Task<Result<ConfiguracionServicioDetalleDto>> HandleAsync(ObtenerConfiguracionServicioPorIdQuery query, CancellationToken ct = default)
    {
        var p = await _context.ConfiguracionesServicio
            .AsNoTracking()
            .Include(x => x.Producto)
            .Include(x => x.Tareas)
                .ThenInclude(t => t.Tarea)
            .Include(x => x.Materiales)
                .ThenInclude(m => m.Producto)
                    .ThenInclude(prod => prod.UnidadMedidaDefecto)
            .Include(x => x.Materiales)
                .ThenInclude(m => m.UnidadMedida)
            .FirstOrDefaultAsync(x => x.Id == query.Id, ct);

        if (p == null)
            return Result<ConfiguracionServicioDetalleDto>.Failure("Configuración del servicio no encontrada.");

        var tareasDto = p.Tareas
            .OrderBy(t => t.OrdenSecuencia)
            .Select(t => new ConfiguracionTareaItemDto(
                t.Id,
                t.TareaId,
                t.Tarea != null ? t.Tarea.Nombre : string.Empty,
                t.OrdenSecuencia,
                t.EsObligatoria,
                t.RequiereEvidencia,
                t.Instrucciones,
                t.Tarea != null ? t.Tarea.DuracionEstimadaMinutos : 15
            )).ToList();

        var materialesDto = p.Materiales.Select(m => new ConfiguracionMaterialItemDto(
            m.Id,
            m.ProductoId,
            m.Producto != null ? m.Producto.Codigo : string.Empty,
            m.Producto != null ? m.Producto.Nombre : string.Empty,
            m.CantidadPrevista,
            m.EsObligatorio,
            m.Observaciones,
            m.Producto != null && m.Producto.EsSerializado,
            m.UnidadMedida?.Nombre ?? m.Producto?.UnidadMedidaDefecto?.Nombre ?? "UND",
            m.UnidadMedidaId ?? m.Producto?.UnidadMedidaDefectoId
        )).ToList();

        var dto = new ConfiguracionServicioDetalleDto(
            p.Id,
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

        return Result<ConfiguracionServicioDetalleDto>.Success(dto);
    }

    public async Task<Result<List<TareaDto>>> HandleAsync(ObtenerTareasQuery query, CancellationToken ct = default)
    {
        var q = _context.Tareas.AsNoTracking().AsQueryable();

        if (query.SoloActivas == true)
            q = q.Where(t => t.Activo);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            q = q.Where(t => t.Nombre.ToLower().Contains(search));
        }

        var items = await q.OrderBy(t => t.Nombre).ToListAsync(ct);
        var dtos = items.Select(t => new TareaDto(
            t.Id,
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
            t.Nombre,
            t.Descripcion,
            t.DuracionEstimadaMinutos,
            t.RequiereEvidenciaFotografica,
            t.Activo
        );

        return Result<TareaDto>.Success(dto);
    }
}
