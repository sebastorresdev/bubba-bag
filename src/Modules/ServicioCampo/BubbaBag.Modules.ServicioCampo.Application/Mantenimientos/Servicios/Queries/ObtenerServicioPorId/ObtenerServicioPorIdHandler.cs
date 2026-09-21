using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Dtos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Queries.ObtenerServicioPorId;

public class ObtenerServicioPorIdHandler : IQueryHandler<ObtenerServicioPorIdQuery, Result<ServicioDetalleDto?>>
{
    private readonly IServicioCampoDbContext _context;

    public ObtenerServicioPorIdHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ServicioDetalleDto?>> HandleAsync(ObtenerServicioPorIdQuery request, CancellationToken cancellationToken = default)
    {
        var servicio = await _context.Servicios
            .AsNoTracking()
            .Include(s => s.CatalogoServicio)
            .Include(s => s.Pasos)
            .Include(s => s.MaterialesTeoricos)
            .Include(s => s.SucursalesHabilitadas)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (servicio == null) return Result<ServicioDetalleDto?>.Success(null);

        // Obtain details of related products
        var productIds = servicio.MaterialesTeoricos.Select(m => m.ProductoId).Distinct().ToList();
        var productos = await _context.Productos
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        // Obtain details of branches
        var sucursalIds = servicio.SucursalesHabilitadas.Select(s => s.SucursalId).Distinct().ToList();
        var sucursales = await _context.Sucursales
            .AsNoTracking()
            .Where(s => sucursalIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, cancellationToken);

        var pasosDtos = servicio.Pasos
            .OrderBy(p => p.NumeroPaso)
            .Select(p => new ServicioPasoDto(
                p.Id,
                p.NumeroPaso,
                p.Descripcion,
                p.RequiereFoto,
                (int)p.TipoEvidencia,
                p.EsObligatorio
            ))
            .ToList();

        var materialesDtos = servicio.MaterialesTeoricos
            .Select(m =>
            {
                productos.TryGetValue(m.ProductoId, out var prod);
                return new ServicioMaterialDto(
                    m.Id,
                    m.ProductoId,
                    prod?.Codigo,
                    prod?.Nombre,
                    m.CantidadTeorica,
                    m.UnidadMedida
                );
            })
            .ToList();

        var sucursalesDtos = servicio.SucursalesHabilitadas
            .Select(s =>
            {
                sucursales.TryGetValue(s.SucursalId, out var suc);
                return new SucursalServicioDto(
                    s.Id,
                    s.SucursalId,
                    suc?.Nombre,
                    suc?.Ciudad,
                    s.Habilitado
                );
            })
            .ToList();

        var detalle = new ServicioDetalleDto(
            servicio.Id,
            servicio.Codigo,
            servicio.Nombre,
            servicio.Descripcion,
            servicio.CatalogoServicioId,
            servicio.CatalogoServicio.Nombre,
            servicio.DuracionEstimadaMinutos,
            servicio.CodigoExterno,
            servicio.PrecioBase,
            servicio.Activo,
            pasosDtos,
            materialesDtos,
            sucursalesDtos
        );

        return Result<ServicioDetalleDto?>.Success(detalle);
    }
}
