using System.Threading;
using System.Threading.Tasks;
using System;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Clientes;
using BubbaBag.Modules.ServicioCampo.Domain.Mantenimientos;
using BubbaBag.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using BubbaBag.Modules.ServicioCampo.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Plantillas;
using BubbaBag.Modules.ServicioCampo.Domain.Productos;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using BubbaBag.Modules.ServicioCampo.Domain.Ubigeos;
using BubbaBag.Modules.ServicioCampo.Domain.Configuracion;
using Microsoft.EntityFrameworkCore;

namespace BubbaBag.Modules.ServicioCampo.Application;

public interface IServicioCampoDbContext
{
    DbSet<ConfiguracionEmpresa> ConfiguracionEmpresas { get; }
    DbSet<UnidadOrganizativa> UnidadesOrganizativas { get; }
    DbSet<OrdenTrabajo> OrdenesTrabajo { get; }
    DbSet<OrdenTrabajoVisita> OrdenTrabajoVisitas { get; }
    DbSet<OrdenTrabajoVisitaEvidencia> OrdenTrabajoVisitaEvidencias { get; }
    DbSet<OrdenTrabajoTarea> OrdenTrabajoTareas { get; }
    DbSet<OrdenTrabajoMaterial> OrdenTrabajoMateriales { get; }
    DbSet<ZonaOperativa> ZonasOperativas { get; }
    DbSet<Recurso> Recursos { get; }
    DbSet<UbicacionInventario> UbicacionesInventario { get; }
    DbSet<Almacen> Almacenes { get; }
    DbSet<UsuarioAlmacenAutorizacion> UsuarioAlmacenAutorizaciones { get; }
    DbSet<Transferencia> Transferencias { get; }
    DbSet<TransferenciaDetalle> TransferenciaDetalles { get; }
    DbSet<TransferenciaDetalleSerie> TransferenciaDetalleSeries { get; }
    DbSet<RecepcionTransferencia> RecepcionesTransferencia { get; }
    DbSet<RecepcionTransferenciaDetalle> RecepcionTransferenciaDetalles { get; }
    DbSet<ResolucionDiferenciaTransferencia> ResolucionDiferenciaTransferencias { get; }
    DbSet<Compra> Compras { get; }
    DbSet<StockAlmacen> StocksAlmacen { get; }
    DbSet<MovimientoInventario> MovimientosInventario { get; }
    DbSet<MotivoIncidencia> MotivosIncidencia { get; }
    DbSet<Cliente> Clientes { get; }
    DbSet<Ubigeo> Ubigeos { get; }
    DbSet<Producto> Productos { get; }
    DbSet<UnidadMedida> UnidadesMedida { get; }
    DbSet<GrupoUnidadMedida> GruposUnidadMedida { get; }
    DbSet<CategoriaProducto> CategoriasProducto { get; }
    DbSet<ListaPrecios> ListasPrecios { get; }
    DbSet<ElementoListaPrecios> ElementosListaPrecios { get; }
    DbSet<ItemSeriado> ItemsSeriados { get; }
    DbSet<TipoOrdenTrabajo> TiposOrdenTrabajo { get; }
    DbSet<CampoDefinicion> CamposDefinicion { get; }
    DbSet<TipoTareaServicio> TiposTareaServicio { get; }

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
    Task EjecutarEnTransaccionAsync(
        Func<CancellationToken, Task> operacion,
        CancellationToken cancellationToken = default);
}
