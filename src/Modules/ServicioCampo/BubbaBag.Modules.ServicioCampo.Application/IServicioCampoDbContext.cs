using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.Crm.Domain.Clientes;
using BubbaBag.Modules.Inventario.Domain.Productos;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application;

public interface IServicioCampoDbContext
{
    DbSet<OrdenTrabajo> OrdenesTrabajo { get; }
    DbSet<OrdenTrabajoVisita> OrdenTrabajoVisitas { get; }
    DbSet<OrdenTrabajoVisitaEvidencia> OrdenTrabajoVisitaEvidencias { get; }
    DbSet<OrdenTrabajoTarea> OrdenTrabajoTareas { get; }
    DbSet<MotivoIncidencia> MotivosIncidencia { get; }
    DbSet<Cliente> Clientes { get; }
    DbSet<Producto> Productos { get; }
    DbSet<Sucursal> Sucursales { get; }
    DbSet<TipoOrdenTrabajo> TiposOrdenTrabajo { get; }
    DbSet<CampoDefinicion> CamposDefinicion { get; }
    DbSet<CatalogoServicio> CatalogosServicio { get; }
    DbSet<Servicio> Servicios { get; }
    DbSet<ServicioPaso> ServicioPasos { get; }
    DbSet<ServicioMaterial> ServicioMateriales { get; }
    DbSet<SucursalServicio> SucursalesServicio { get; }
    DbSet<TipoTareaServicio> TiposTareaServicio { get; }
    DbSet<Tarifario> Tarifarios { get; }
    DbSet<TarifarioRegla> TarifarioReglas { get; }
    DbSet<TarifaServicio> TarifasServicio { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
