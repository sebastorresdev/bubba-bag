using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Dtos;
using BubbaBag.Modules.RecursosHumanos.Domain.Empleados;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.RecursosHumanos.Application.Catalogos.Features;

public record ObtenerCatalogosRrhhQuery : IQuery<Result<CatalogosRrhhDto>>;

public class ObtenerCatalogosRrhhHandler : IQueryHandler<ObtenerCatalogosRrhhQuery, Result<CatalogosRrhhDto>>
{
    private readonly IRecursosHumanosDbContext _context;

    public ObtenerCatalogosRrhhHandler(IRecursosHumanosDbContext context)
    {
        _context = context;
    }

    public async Task<Result<CatalogosRrhhDto>> HandleAsync(ObtenerCatalogosRrhhQuery query, CancellationToken cancellationToken = default)
    {
        var departamentosEntities = await _context.Departamentos
            .AsNoTracking()
            .Where(d => d.Activo)
            .Include(d => d.Cargos.Where(c => c.Activo))
            .OrderBy(d => d.Nombre)
            .ToListAsync(cancellationToken);

        var departamentosDto = departamentosEntities.Select(d => new DepartamentoCatalogoDto(
            d.Id,
            d.Nombre,
            d.Descripcion,
            d.Cargos.OrderBy(c => c.Nombre).Select(c => new CargoCatalogoDto(c.Id, c.Nombre, c.SalarioReferencial)).ToList()
        )).ToList();

        var tiposDocumento = new List<string>
        {
            "DNI",
            "Carnet de Extranjería",
            "Pasaporte"
        };

        var tiposContrato = new List<string>
        {
            "Plazo Indeterminado",
            "Plazo Fijo",
            "Tiempo Parcial (Part-time)",
            "Locación de Servicios",
            "Convenio de Prácticas"
        };

        var regimenesPensionarios = new List<string>
        {
            "ONP",
            "AFP Integra",
            "AFP Prima",
            "AFP Profuturo",
            "AFP Habitat"
        };

        var entidadesFinancieras = new List<string>
        {
            "BCP (Banco de Crédito del Perú)",
            "BBVA",
            "Interbank",
            "Scotiabank",
            "BanBif",
            "Banco de la Nación",
            "Banco Pichincha"
        };

        var estados = new List<EstadoEmpleadoCatalogoDto>
        {
            new("Activo", "Activo", "success"),
            new("Vacaciones", "Vacaciones", "processing"),
            new("Licencia", "Licencia", "warning"),
            new("Suspendido", "Suspendido", "purple"),
            new("Cesado", "Cesado / Baja", "error")
        };

        var motivosCese = new List<string>
        {
            "Término / Vencimiento de Contrato",
            "Renuncia Voluntaria",
            "Mutuo Disenso",
            "Despido por Causa Justa",
            "No superó Periodo de Prueba",
            "Jubilación"
        };

        var catalogos = new CatalogosRrhhDto(
            departamentosDto,
            tiposDocumento,
            tiposContrato,
            regimenesPensionarios,
            entidadesFinancieras,
            estados,
            motivosCese
        );

        return Result<CatalogosRrhhDto>.Success(catalogos);
    }
}
