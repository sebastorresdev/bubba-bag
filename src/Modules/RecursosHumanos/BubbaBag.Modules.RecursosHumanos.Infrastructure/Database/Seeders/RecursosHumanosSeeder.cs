using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BubbaBag.Modules.RecursosHumanos.Domain.Organizacion;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.Seeders;

public static class RecursosHumanosSeeder
{
    public static async Task SeedAsync(RecursosHumanosDbContext context, ILogger logger)
    {
        if (await context.Departamentos.AnyAsync())
        {
            logger.LogInformation("Los departamentos y cargos de RRHH ya se encuentran inicializados.");
            return;
        }

        logger.LogInformation("Inicializando sembrado de Departamentos y Cargos de RRHH...");

        var datosIniciales = new (string Depto, string? Desc, (string Cargo, decimal? SalarioRef)[] Cargos)[]
        {
            (
                "Ventas y Tiendas",
                "Personal de atención en tiendas retail, cajas y gestión de ventas de Bubba Bag",
                new[]
                {
                    ("Vendedora de Tienda", (decimal?)1200m),
                    ("Cajero(a)", (decimal?)1300m),
                    ("Encargado(a) de Tienda", (decimal?)1800m),
                    ("Supervisor(a) Zonal de Tiendas", (decimal?)2800m)
                }
            ),
            (
                "Almacén y Logística",
                "Gestión de inventarios, recepción de mercadería y despacho para tiendas y e-commerce",
                new[]
                {
                    ("Encargado de Almacén", (decimal?)2000m),
                    ("Auxiliar de Despacho", (decimal?)1250m),
                    ("Operario de Picking y Empaque", (decimal?)1150m)
                }
            ),
            (
                "Administración y Finanzas",
                "Gestión financiera, contabilidad, compras y tesorería corporativa",
                new[]
                {
                    ("Asistente Administrativo", (decimal?)1500m),
                    ("Contador(a) General", (decimal?)3500m),
                    ("Analista de Facturación y Cobranzas", (decimal?)2000m)
                }
            ),
            (
                "Recursos Humanos",
                "Gestión del talento humano, bienestar, nómina y clima laboral",
                new[]
                {
                    ("Asistente de RRHH", (decimal?)1500m),
                    ("Generalista de Gestión Humana", (decimal?)2500m)
                }
            ),
            (
                "Marketing y E-commerce",
                "Estrategia digital, redes sociales, diseño y ventas en canales online",
                new[]
                {
                    ("Especialista en Marketing Digital", (decimal?)2600m),
                    ("Diseñador(a) Gráfico", (decimal?)2000m),
                    ("Atención al Cliente E-commerce", (decimal?)1300m)
                }
            )
        };

        foreach (var (deptoNombre, deptoDesc, cargos) in datosIniciales)
        {
            var depto = Departamento.Crear(deptoNombre, deptoDesc);
            await context.Departamentos.AddAsync(depto);
            await context.SaveChangesAsync();

            foreach (var (cargoNombre, salarioRef) in cargos)
            {
                var cargo = Cargo.Crear(cargoNombre, depto.Id, salarioRef);
                await context.Cargos.AddAsync(cargo);
            }
            await context.SaveChangesAsync();
        }

        logger.LogInformation("Departamentos y Cargos de RRHH sembrados exitosamente.");

        await SeedSucursalesAsync(context, logger);
    }

    private static async Task SeedSucursalesAsync(RecursosHumanosDbContext context, ILogger logger)
    {
        if (await context.Sucursales.AnyAsync())
        {
            return;
        }

        logger.LogInformation("Sembrando catálogo oficial de Sucursales y Sedes...");

        var sucursales = new List<Sucursal>
        {
            Sucursal.Crear("LIMA", "Sede Central Lima", "Lima", "Av. Javier Prado Este 444, San Isidro", "01-2004600", esSedePrincipal: true),
            Sucursal.Crear("CHICLAYO", "Sucursal Chiclayo", "Chiclayo", "Av. José Balta 850", "074-234567", esSedePrincipal: false),
            Sucursal.Crear("PIURA", "Sucursal Piura", "Piura", "Av. Grau 430", "073-345678", esSedePrincipal: false),
            Sucursal.Crear("TRUJILLO", "Sucursal Trujillo", "Trujillo", "Av. España 1120", "044-456789", esSedePrincipal: false),
            Sucursal.Crear("AREQUIPA", "Sucursal Arequipa", "Arequipa", "Calle Mercaderes 210", "054-567890", esSedePrincipal: false)
        };

        await context.Sucursales.AddRangeAsync(sucursales);
        await context.SaveChangesAsync();

        logger.LogInformation("Se sembraron {Count} sucursales exitosamente.", sucursales.Count);
    }
}
