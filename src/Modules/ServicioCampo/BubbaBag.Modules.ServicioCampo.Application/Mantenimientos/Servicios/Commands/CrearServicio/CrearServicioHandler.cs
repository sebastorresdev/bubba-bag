using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Commands.CrearServicio;

public class CrearServicioHandler : ICommandHandler<CrearServicioCommand, Result<Guid>>
{
    private readonly IServicioCampoDbContext _context;

    public CrearServicioHandler(IServicioCampoDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> HandleAsync(CrearServicioCommand request, CancellationToken cancellationToken = default)
    {
        var codigoNormalizado = request.Codigo.Trim().ToUpperInvariant();

        var existeCodigo = await _context.Servicios
            .AnyAsync(s => s.Codigo == codigoNormalizado, cancellationToken);

        if (existeCodigo)
        {
            return Result<Guid>.Failure($"Ya existe un servicio con el código '{codigoNormalizado}'.");
        }

        var existeCatalogo = await _context.CatalogosServicio
            .AnyAsync(c => c.Id == request.CatalogoServicioId, cancellationToken);

        if (!existeCatalogo)
        {
            return Result<Guid>.Failure($"No se encontró el catálogo de servicios con ID '{request.CatalogoServicioId}'.");
        }

        var servicio = Servicio.Crear(
            codigoNormalizado,
            request.Nombre,
            request.CatalogoServicioId,
            request.DuracionEstimadaMinutos > 0 ? request.DuracionEstimadaMinutos : 60,
            request.Descripcion,
            request.CodigoExterno,
            request.PrecioBase
        );

        if (request.Pasos != null && request.Pasos.Any())
        {
            var pasos = request.Pasos.Select(p => ServicioPaso.Crear(
                servicio.Id,
                p.NumeroPaso,
                p.Descripcion,
                p.RequiereFoto,
                (TipoEvidenciaPaso)p.TipoEvidencia,
                p.EsObligatorio
            ));
            servicio.ConfigurarPasos(pasos);
        }

        if (request.MaterialesTeoricos != null && request.MaterialesTeoricos.Any())
        {
            var materiales = request.MaterialesTeoricos.Select(m => ServicioMaterial.Crear(
                servicio.Id,
                m.ProductoId,
                m.CantidadTeorica,
                string.IsNullOrWhiteSpace(m.UnidadMedida) ? "Unidades" : m.UnidadMedida
            ));
            servicio.ConfigurarMaterialesTeoricos(materiales);
        }

        if (request.SucursalesHabilitadasIds != null && request.SucursalesHabilitadasIds.Any())
        {
            var sucursales = request.SucursalesHabilitadasIds.Select(sucursalId =>
                SucursalServicio.Crear(sucursalId, servicio.Id, true)
            );
            servicio.ConfigurarSucursales(sucursales);
        }

        _context.Servicios.Add(servicio);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(servicio.Id);
    }
}
