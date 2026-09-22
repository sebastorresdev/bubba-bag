using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class RecursosYZonasSeeder
{
    public static async Task SeedAsync(ServicioCampoDbContext context, ILogger logger)
    {
        await SeedZonasOperativasAsync(context, logger);
        await SeedRecursosTecnicosAsync(context, logger);
    }

    private static async Task SeedZonasOperativasAsync(ServicioCampoDbContext context, ILogger logger)
    {
        var sucursales = await context.Sucursales.ToListAsync();
        if (!sucursales.Any())
        {
            return;
        }

        var almacenes = await context.Almacenes.ToListAsync();

        var sucursalAncash = sucursales.FirstOrDefault(s => s.Codigo == "ANCASH") ?? sucursales.First();
        var sucursalPiura = sucursales.FirstOrDefault(s => s.Codigo == "PIURA") ?? sucursales.First();
        var sucursalChiclayo = sucursales.FirstOrDefault(s => s.Codigo == "CHICLAYO") ?? sucursales.First();
        var sucursalTrujillo = sucursales.FirstOrDefault(s => s.Codigo == "TRUJILLO") ?? sucursales.First();
        var sucursalLima = sucursales.FirstOrDefault(s => s.Codigo == "LIMA") ?? sucursales.First();

        var almHuaraz = almacenes.FirstOrDefault(a => a.Codigo == "ALM-BASE-ANC-HZ");
        var almChimbote = almacenes.FirstOrDefault(a => a.Codigo == "ALM-BASE-ANC-CH");
        var almPiura = almacenes.FirstOrDefault(a => a.Codigo == "ALM-BASE-PIU");
        var almChiclayo = almacenes.FirstOrDefault(a => a.Codigo == "ALM-BASE-CHX");
        var almTrujillo = almacenes.FirstOrDefault(a => a.Codigo == "ALM-BASE-TRU");
        var almLima = almacenes.FirstOrDefault(a => a.Codigo == "ALM-BASE-LIM");

        var zonasData = new (string Codigo, string Nombre, string DescripcionProveedor, Guid SucursalId, Guid? AlmacenId)[]
        {
            ("I280010", "Ancash - Huaraz", "PE-I280010-PROGRAMMING-ANCASH-PE_HUARAZ_PRG", sucursalAncash.Id, almHuaraz?.Id),
            ("I280020", "Ancash - Chimbote", "PE-I280020-PROGRAMMING-ANCASH-PE_CHIMBOTE_PRG", sucursalAncash.Id, almChimbote?.Id),
            ("I200010", "Piura - Piura Centro", "PE-I200010-PROGRAMMING-PIURA-PE_PIURA_PRG", sucursalPiura.Id, almPiura?.Id),
            ("I140010", "Chiclayo - Chiclayo Centro", "PE-I140010-PROGRAMMING-LAMBAYEQUE-PE_CHICLAYO_PRG", sucursalChiclayo.Id, almChiclayo?.Id),
            ("I130010", "Trujillo - Trujillo Centro", "PE-I130010-PROGRAMMING-LA_LIBERTAD-PE_TRUJILLO_PRG", sucursalTrujillo.Id, almTrujillo?.Id),
            ("I150010", "Lima - Lima Centro", "PE-I150010-PROGRAMMING-LIMA-PE_LIMA_CENTRO_PRG", sucursalLima.Id, almLima?.Id),
        };

        bool huboCambios = false;
        foreach (var z in zonasData)
        {
            if (!await context.ZonasOperativas.AnyAsync(zo => zo.Codigo == z.Codigo))
            {
                var zona = ZonaOperativa.Crear(
                    z.Codigo,
                    z.Nombre,
                    z.SucursalId,
                    z.AlmacenId,
                    z.DescripcionProveedor);

                await context.ZonasOperativas.AddAsync(zona);
                huboCambios = true;
            }
        }

        if (huboCambios)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Zonas operativas de despacho sembradas exitosamente.");
        }
    }

    private static async Task SeedRecursosTecnicosAsync(ServicioCampoDbContext context, ILogger logger)
    {
        var zonas = await context.ZonasOperativas.ToListAsync();
        if (!zonas.Any())
        {
            return;
        }

        var almacenes = await context.Almacenes.ToListAsync();

        var tecnicosData = new (string Codigo, string Nombre, string Documento, string Telefono, string Email, string CodigoZona, string CodigoAlmacenBase, int Capacidad, string ColorHex)[]
        {
            ("TEC-ANC01", "Carlos Ramirez", "45678901", "943123456", "carlos.ramirez@empresa.com", "I280010", "ALM-BASE-ANC-HZ", 6, "#0078d4"),
            ("TEC-ANC02", "Marcos Silva", "45678902", "943654321", "marcos.silva@empresa.com", "I280020", "ALM-BASE-ANC-CH", 6, "#107c41"),
            ("TEC-PIU01", "Jorge Navarro", "45678903", "973112233", "jorge.navarro@empresa.com", "I200010", "ALM-BASE-PIU", 6, "#5c2d91"),
            ("TEC-CHX01", "Manuel Flores", "45678904", "974445566", "manuel.flores@empresa.com", "I140010", "ALM-BASE-CHX", 6, "#d83b01"),
            ("TEC-TRU01", "Luis Paredes", "45678905", "944778899", "luis.paredes@empresa.com", "I130010", "ALM-BASE-TRU", 6, "#008272"),
            ("TEC-LIM01", "Victor Sanchez", "45678906", "999888777", "victor.sanchez@empresa.com", "I150010", "ALM-BASE-LIM", 8, "#004e8c")
        };

        bool huboCambios = false;
        foreach (var t in tecnicosData)
        {
            var zona = zonas.FirstOrDefault(z => z.Codigo == t.CodigoZona);
            var almBase = almacenes.FirstOrDefault(a => a.Codigo == t.CodigoAlmacenBase);

            if (zona == null || almBase == null)
            {
                continue;
            }

            if (!await context.RecursosTecnicos.AnyAsync(r => r.Codigo == t.Codigo))
            {
                var recurso = RecursoTecnico.Crear(
                    t.Codigo,
                    t.Nombre,
                    zona.Id,
                    almBase.Id,
                    almacenMovilId: null,
                    usuarioId: null,
                    empleadoId: null,
                    documentoIdentidad: t.Documento,
                    telefono: t.Telefono,
                    email: t.Email,
                    capacidadMaximaOrdenesPorDia: t.Capacidad,
                    colorHex: t.ColorHex);

                await context.RecursosTecnicos.AddAsync(recurso);
                huboCambios = true;
            }
        }

        if (huboCambios)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Recursos técnicos de campo sembrados exitosamente.");
        }
    }
}
