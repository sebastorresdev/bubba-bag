using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Commands.ActualizarServicio;

public class ActualizarServicioHandler : ICommandHandler<ActualizarServicioCommand, Result>
{
    private readonly IServicioCampoDbContext _context;

    public ActualizarServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result> HandleAsync(ActualizarServicioCommand request, CancellationToken cancellationToken = default)
    {
        var servicio = await _context.Servicios
            .Include(s => s.Pasos)
            .Include(s => s.MaterialesTeoricos)
            .Include(s => s.SucursalesHabilitadas)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (servicio == null)
        {
            return Result.Failure($"No se encontró el servicio con ID '{request.Id}'.");
        }

        var existeCatalogo = await _context.CatalogosServicio
            .AnyAsync(c => c.Id == request.CatalogoServicioId, cancellationToken);

        if (!existeCatalogo)
        {
            return Result.Failure($"No se encontró el catálogo de servicios con ID '{request.CatalogoServicioId}'.");
        }

        servicio.Actualizar(
            request.Nombre,
            request.CatalogoServicioId,
            request.DuracionEstimadaMinutos > 0 ? request.DuracionEstimadaMinutos : 60,
            request.Descripcion,
            request.CodigoExterno,
            request.PrecioBase
        );

        if (request.Activo)
            servicio.Activar();
        else
            servicio.Desactivar();

        // Update Steps
        var nuevosPasos = request.Pasos != null
            ? request.Pasos.Select(p => ServicioPaso.Crear(
                servicio.Id,
                p.NumeroPaso,
                p.Descripcion,
                p.RequiereFoto,
                (TipoEvidenciaPaso)p.TipoEvidencia,
                p.EsObligatorio
            )).ToList()
            : new List<ServicioPaso>();
        servicio.ConfigurarPasos(nuevosPasos);

        // Update Materials
        var nuevosMateriales = request.MaterialesTeoricos != null
            ? request.MaterialesTeoricos.Select(m => ServicioMaterial.Crear(
                servicio.Id,
                m.ProductoId,
                m.CantidadTeorica,
                string.IsNullOrWhiteSpace(m.UnidadMedida) ? "Unidades" : m.UnidadMedida
            )).ToList()
            : new List<ServicioMaterial>();
        servicio.ConfigurarMaterialesTeoricos(nuevosMateriales);

        // Update Branches
        var nuevasSucursales = request.SucursalesHabilitadasIds != null
            ? request.SucursalesHabilitadasIds.Select(sucursalId =>
                SucursalServicio.Crear(sucursalId, servicio.Id, true)
            ).ToList()
            : new List<SucursalServicio>();
        servicio.ConfigurarSucursales(nuevasSucursales);

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
