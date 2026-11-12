using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ProgrammingCar.Modules.ServicioCampo.Domain.Productos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class InventarioSeeder
{
    public static async Task SeedAsync(
        ServicioCampoDbContext context,
        ILogger? logger = null,
        Dictionary<string, Guid>? sucursalesMap = null)
    {
        await AsegurarCatalogosInicialesAsync(context, logger);
        await AsegurarUbicacionesPredeterminadasAsync(context, logger);
        await AsegurarMotivosRetiroEquipoAsync(context, logger);
    }

    public static async Task AsegurarCatalogosInicialesAsync(
        ServicioCampoDbContext context,
        ILogger? logger = null)
    {
        try
        {
            bool huboCambios = false;

            // 1. Unidades de Medida Básicas
            if (!await context.GruposUnidadMedida.AnyAsync())
            {
                var (grupoUnidades, unidadBase) = GrupoUnidadMedida.Crear("General", "Unidad");
                context.GruposUnidadMedida.Add(grupoUnidades);
                context.UnidadesMedida.Add(unidadBase);

                // Unidades adicionales bajo el mismo grupo
                var (grupoLongitud, metroBase) = GrupoUnidadMedida.Crear("Longitud", "Metro");
                context.GruposUnidadMedida.Add(grupoLongitud);
                context.UnidadesMedida.Add(metroBase);

                var (grupoEmpaque, cajaBase) = GrupoUnidadMedida.Crear("Empaque", "Caja");
                context.GruposUnidadMedida.Add(grupoEmpaque);
                context.UnidadesMedida.Add(cajaBase);

                huboCambios = true;
                logger?.LogInformation("Grupos y unidades de medida iniciales sembrados exitosamente.");
            }

            // 2. Categorías de Producto Base
            if (!await context.CategoriasProducto.AnyAsync())
            {
                context.CategoriasProducto.AddRange(
                    CategoriaProducto.Crear("Servicios", null, "Servicios técnicos de campo, mano de obra e instalaciones"),
                    CategoriaProducto.Crear("Equipos", null, "Equipos de telecomunicaciones, decodificadores y antenas"),
                    CategoriaProducto.Crear("Materiales", null, "Materiales de conexión, cables, conectores y consumibles"),
                    CategoriaProducto.Crear("Herramientas", null, "Herramientas de trabajo e instrumental de medición")
                );
                huboCambios = true;
                logger?.LogInformation("Categorías de producto iniciales sembradas exitosamente.");
            }

            // 3. Tipos de Orden de Trabajo Estándar
            if (!await context.TiposOrdenTrabajo.AnyAsync())
            {
                context.TiposOrdenTrabajo.AddRange(
                    ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos.TipoOrdenTrabajo.Crear(
                        "Instalaciones / Averías",
                        requiereVisitaCampo: true,
                        exigeFirmaCliente: true,
                        exigeEvidenciasFotograficas: true,
                        descripcion: "Órdenes de instalación domiciliaria y atención técnica de averías",
                        colorHex: "#0f6cbd"),
                    ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos.TipoOrdenTrabajo.Crear(
                        "Mantenimiento Preventivo",
                        requiereVisitaCampo: true,
                        exigeFirmaCliente: true,
                        exigeEvidenciasFotograficas: true,
                        descripcion: "Mantenimiento periódico preventivo y calibración",
                        colorHex: "#107c41"),
                    ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos.TipoOrdenTrabajo.Crear(
                        "Mantenimiento Correctivo",
                        requiereVisitaCampo: true,
                        exigeFirmaCliente: true,
                        exigeEvidenciasFotograficas: true,
                        descripcion: "Corrección técnica de fallas operativas reportadas",
                        colorHex: "#d83b01"),
                    ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos.TipoOrdenTrabajo.Crear(
                        "Inspección Técnica",
                        requiereVisitaCampo: true,
                        exigeFirmaCliente: false,
                        exigeEvidenciasFotograficas: true,
                        descripcion: "Auditoría de calidad y relevamiento técnico en sitio",
                        colorHex: "#5c2d91"),
                    ProgrammingCar.Modules.ServicioCampo.Domain.Mantenimientos.TipoOrdenTrabajo.Crear(
                        "Desinstalación / Retiro",
                        requiereVisitaCampo: true,
                        exigeFirmaCliente: true,
                        exigeEvidenciasFotograficas: true,
                        descripcion: "Corte de servicio y recuperación de equipos en campo",
                        colorHex: "#69797e")
                );
                huboCambios = true;
                logger?.LogInformation("Tipos de orden de trabajo iniciales sembrados exitosamente.");
            }

            // 4. Almacén Central Principal Base
            if (!await context.Almacenes.AnyAsync())
            {
                var almacenCentral = ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes.Almacen.Crear(
                    nombre: "Almacén Central Principal",
                    descripcion: "Almacén general y centro de distribución principal",
                    creadoPorId: null,
                    creadoPorNombre: "Sistema",
                    codigo: "ALM-CENTRAL",
                    tipo: ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes.TipoAlmacen.Bodega);

                context.Almacenes.Add(almacenCentral);
                huboCambios = true;
                logger?.LogInformation("Almacén Central Principal base sembrado exitosamente.");
            }

            if (huboCambios)
            {
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Advertencia al sembrar catálogos iniciales de inventario y órdenes.");
        }
    }

    public static async Task AsegurarUbicacionesPredeterminadasAsync(
        ServicioCampoDbContext context,
        ILogger? logger = null)
    {
        try
        {
            var almacenes = await context.Almacenes.ToListAsync();
            bool huboCambios = false;

            foreach (var alm in almacenes)
            {
                var ubicaciones = await context.UbicacionesInventario
                    .Where(u => u.AlmacenId == alm.Id)
                    .ToListAsync();

                // 1. Asegurar y normalizar ubicación DISPONIBLE (nombre limpio "Disponible")
                var disponible = ubicaciones.FirstOrDefault(u => u.Codigo == "DISPONIBLE" || u.Nombre.ToLower() == "disponible")
                                ?? ubicaciones.FirstOrDefault(u => u.EsPrincipal || u.Codigo == "PRINCIPAL" || u.Nombre.ToLower() == "principal" || u.Nombre.ToLower().Contains("stock"));
                if (disponible == null)
                {
                    context.UbicacionesInventario.Add(ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes.UbicacionInventario.Crear(alm.Id, "DISPONIBLE", "Disponible", principal: true, tipoUbicacion: ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Disponible));
                    huboCambios = true;
                }
                else
                {
                    if (disponible.Nombre != "Disponible" || disponible.Codigo != "DISPONIBLE" || !disponible.EsPrincipal)
                    {
                        disponible.NormalizarPredeterminada("DISPONIBLE", "Disponible", ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Disponible, true);
                        huboCambios = true;
                    }
                }

                // 2. Asegurar y normalizar ubicación DEVOLUCION (nombre limpio "Devolución", sin "Recuperados")
                var devolucion = ubicaciones.FirstOrDefault(u => u.Codigo == "DEVOLUCION" || u.Nombre.ToLower().Contains("devoluci"));
                if (devolucion == null)
                {
                    context.UbicacionesInventario.Add(ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes.UbicacionInventario.Crear(alm.Id, "DEVOLUCION", "Devolución", principal: false, tipoUbicacion: ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Devolucion));
                    huboCambios = true;
                }
                else
                {
                    if (devolucion.Nombre != "Devolución" || devolucion.Codigo != "DEVOLUCION")
                    {
                        devolucion.NormalizarPredeterminada("DEVOLUCION", "Devolución", ProgrammingCar.Modules.ServicioCampo.Domain.Almacenes.TipoUbicacion.Devolucion, false);
                        huboCambios = true;
                    }
                }
            }

            if (huboCambios)
            {
                await context.SaveChangesAsync();
                logger?.LogInformation("Ubicaciones predeterminadas (Disponible y Devolución) aseguradas para todos los almacenes.");
            }
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "No se pudieron asegurar las ubicaciones predeterminadas en los almacenes.");
        }
    }

    public static async Task AsegurarMotivosRetiroEquipoAsync(
        ServicioCampoDbContext context,
        ILogger? logger = null)
    {
        // Catálogo de motivos de retiro gestionado por el usuario (sin datos de prueba)
        return;
    }
}
