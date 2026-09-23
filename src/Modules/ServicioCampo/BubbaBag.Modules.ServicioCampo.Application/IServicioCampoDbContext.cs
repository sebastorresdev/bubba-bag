using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using BubbaBag.Modules.ServicioCampo.Domain.Tarifarios;
using BubbaBag.Modules.ServicioCampo.Domain.Ubigeos;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application;

public interface IServicioCampoDbContext
{
    DbSet<OrdenTrabajo> OrdenesTrabajo { get; }
    DbSet<OrdenTrabajoVisita> OrdenTrabajoVisitas { get; }
    DbSet<OrdenTrabajoVisitaEvidencia> OrdenTrabajoVisitaEvidencias { get; }
    DbSet<OrdenTrabajoTarea> OrdenTrabajoTareas { get; }
    DbSet<OrdenTrabajoMaterial> OrdenTrabajoMateriales { get; }
    DbSet<ZonaOperativa> ZonasOperativas { get; }
    DbSet<RecursoTecnico> RecursosTecnicos { get; }
    DbSet<Almacen> Almacenes { get; }
    DbSet<StockAlmacen> StocksAlmacen { get; }
    DbSet<MovimientoInventario> MovimientosInventario { get; }
    DbSet<MotivoIncidencia> MotivosIncidencia { get; }
    DbSet<Cliente> Clientes { get; }
    DbSet<Ubigeo> Ubigeos { get; }
    DbSet<Producto> Productos { get; }
    DbSet<ItemSeriado> ItemsSeriados { get; }
    DbSet<Sucursal> Sucursales { get; }
    DbSet<TipoOrdenTrabajo> TiposOrdenTrabajo { get; }
    DbSet<CampoDefinicion> CamposDefinicion { get; }
    DbSet<ProductoServicio> Servicios { get; }
    DbSet<TipoTareaServicio> TiposTareaServicio { get; }
    DbSet<Tarifario> Tarifarios { get; }
    DbSet<TarifarioRegla> TarifarioReglas { get; }
    DbSet<TarifaServicio> TarifasServicio { get; }

    // Plantillas y Catálogos de Tareas
    DbSet<Tarea> Tareas { get; }
    DbSet<PlantillaTrabajo> PlantillasTrabajo { get; }
    DbSet<PlantillaTarea> PlantillasTareas { get; }
    DbSet<PlantillaMaterial> PlantillasMateriales { get; }

    // Ejecución de Trabajos y Liquidación de Materiales
    DbSet<Trabajo> Trabajos { get; }
    DbSet<TareaTrabajo> TareasTrabajo { get; }
    DbSet<MaterialTrabajo> MaterialesTrabajo { get; }
    DbSet<LiquidacionMaterial> LiquidacionesMaterial { get; }
    DbSet<LiquidacionMaterialItem> LiquidacionesMaterialItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
