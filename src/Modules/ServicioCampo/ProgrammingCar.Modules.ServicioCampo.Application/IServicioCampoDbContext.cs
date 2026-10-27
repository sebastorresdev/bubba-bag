using System.Threading;
using System.Threading.Tasks;
using System;
using ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Clientes;
using ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos;
using ProgrammingCar.Modules.ServicioCampo.Domain.OrdenesTrabajo;
using ProgrammingCar.Modules.ServicioCampo.Domain.Organizacion;
using ProgrammingCar.Modules.ServicioCampo.Domain.Plantillas;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Recursos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Ubigeos;
using ProgrammingCar.Modules.ServicioCampo.Domain.Configuracion;
using Microsoft.EntityFrameworkCore;

namespace ProgrammingCar.Modules.ServicioCampo.Application;

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
    DbSet<DevolucionProveedor> DevolucionesProveedor { get; }
    DbSet<AjusteInventario> AjustesInventario { get; }
    DbSet<StockAlmacen> StocksAlmacen { get; }
    DbSet<MovimientoInventario> MovimientosInventario { get; }
    DbSet<MotivoIncidencia> MotivosIncidencia { get; }
    DbSet<Cliente> Clientes { get; }
    DbSet<Contacto> Contactos { get; }
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
    DbSet<MotivoRetiroEquipo> MotivosRetiroEquipo { get; }

    // Plantillas y Catálogos de Tareas
    DbSet<Tarea> Tareas { get; }
    DbSet<ConfiguracionServicio> ConfiguracionesServicio { get; }
    DbSet<ConfiguracionTarea> ConfiguracionesTareas { get; }
    DbSet<ConfiguracionMaterial> ConfiguracionesMateriales { get; }

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
    Task EjecutarConBloqueoAjusteAsync(Guid id, Func<CancellationToken, Task> operacion, CancellationToken cancellationToken = default);
    Task EjecutarConBloqueoOrdenAsync(Guid id, Func<CancellationToken, Task> operacion, CancellationToken cancellationToken = default);
}
