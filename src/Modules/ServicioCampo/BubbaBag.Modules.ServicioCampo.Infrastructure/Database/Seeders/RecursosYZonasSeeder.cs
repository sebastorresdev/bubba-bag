using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Domain.Almacenes;
using BubbaBag.Modules.ServicioCampo.Domain.Organizacion;
using BubbaBag.Modules.ServicioCampo.Domain.Recursos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class RecursosYZonasSeeder
{
    public static async Task SeedAsync(ServicioCampoDbContext context, ILogger logger, IReadOnlyDictionary<string, Guid>? sucursalesMap = null)
    {
        await SeedUnidadesOrganizativasAsync(context, logger, sucursalesMap);
        await SeedZonasOperativasAsync(context, logger, sucursalesMap);
        await SeedRecursosTecnicosAsync(context, logger, sucursalesMap);
        await SeedAutorizacionesAlmacenAsync(context, logger);
    }

    private static async Task SeedUnidadesOrganizativasAsync(ServicioCampoDbContext context, ILogger logger, IReadOnlyDictionary<string, Guid>? sucursalesMap)
    {
        if (sucursalesMap == null || !sucursalesMap.Any()) return;

        var unidades = new (string Codigo, string Nombre, string Ciudad, Guid Id)[]
        {
            ("ANC", "Unidad Organizativa Ancash", "Huaraz", sucursalesMap.TryGetValue("ANCASH", out var saId) ? saId : Guid.NewGuid()),
            ("PIU", "Unidad Organizativa Piura", "Piura", sucursalesMap.TryGetValue("PIURA", out var spId) ? spId : Guid.NewGuid()),
            ("CHX", "Unidad Organizativa Chiclayo", "Chiclayo", sucursalesMap.TryGetValue("CHICLAYO", out var scId) ? scId : Guid.NewGuid()),
            ("TRU", "Unidad Organizativa Trujillo", "Trujillo", sucursalesMap.TryGetValue("TRUJILLO", out var stId) ? stId : Guid.NewGuid()),
            ("LIM", "Unidad Organizativa Lima", "Lima", sucursalesMap.TryGetValue("LIMA", out var slId) ? slId : Guid.NewGuid())
        };

        bool huboCambios = false;
        foreach (var u in unidades)
        {
            if (!await context.UnidadesOrganizativas.AnyAsync(uo => uo.Codigo == u.Codigo || uo.Id == u.Id))
            {
                var uo = UnidadOrganizativa.Crear(u.Codigo, u.Nombre, u.Ciudad, esSedePrincipal: u.Codigo == "LIM", id: u.Id);
                await context.UnidadesOrganizativas.AddAsync(uo);
                huboCambios = true;
            }
        }

        if (huboCambios)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Unidades organizativas logísticas sembradas exitosamente.");
        }
    }

    private static async Task SeedZonasOperativasAsync(ServicioCampoDbContext context, ILogger logger, IReadOnlyDictionary<string, Guid>? sucursalesMap)
    {
        if (sucursalesMap == null || !sucursalesMap.Any()) return;

        var almacenes = await context.Almacenes.ToListAsync();

        var sucursalAncashId = sucursalesMap.TryGetValue("ANCASH", out var saId) ? saId : sucursalesMap.Values.First();
        var sucursalPiuraId = sucursalesMap.TryGetValue("PIURA", out var spId) ? spId : sucursalesMap.Values.First();
        var sucursalChiclayoId = sucursalesMap.TryGetValue("CHICLAYO", out var scId) ? scId : sucursalesMap.Values.First();
        var sucursalTrujilloId = sucursalesMap.TryGetValue("TRUJILLO", out var stId) ? stId : sucursalesMap.Values.First();
        var sucursalLimaId = sucursalesMap.TryGetValue("LIMA", out var slId) ? slId : sucursalesMap.Values.First();

        var almHuaraz = almacenes.FirstOrDefault(a => a.Nombre == "Almacén Base Huaraz");
        var almChimbote = almacenes.FirstOrDefault(a => a.Nombre == "Almacén Base Chimbote");
        var almPiura = almacenes.FirstOrDefault(a => a.Nombre == "Almacén Base Piura");
        var almChiclayo = almacenes.FirstOrDefault(a => a.Nombre == "Almacén Base Chiclayo");
        var almTrujillo = almacenes.FirstOrDefault(a => a.Nombre == "Almacén Base Trujillo");
        var almLima = almacenes.FirstOrDefault(a => a.Nombre == "Almacén Central Lima");

        // Actualizar tipo y unidad organizativa en bodegas base
        ActualizarAlmacenBase(almHuaraz, "BOD-ANC-01", sucursalAncashId);
        ActualizarAlmacenBase(almChimbote, "BOD-CHM-01", sucursalAncashId);
        ActualizarAlmacenBase(almPiura, "BOD-PIU-01", sucursalPiuraId);
        ActualizarAlmacenBase(almChiclayo, "BOD-CHX-01", sucursalChiclayoId);
        ActualizarAlmacenBase(almTrujillo, "BOD-TRU-01", sucursalTrujilloId);
        ActualizarAlmacenBase(almLima, "BOD-LIM-01", sucursalLimaId);

        var zonasData = new (string Codigo, string Nombre, string DescripcionProveedor, Guid SucursalId, Guid? AlmacenId)[]
        {
            ("I280010", "Ancash - Huaraz", "PE-I280010-PROGRAMMING-ANCASH-PE_HUARAZ_PRG", sucursalAncashId, almHuaraz?.Id),
            ("I280020", "Ancash - Chimbote", "PE-I280020-PROGRAMMING-ANCASH-PE_CHIMBOTE_PRG", sucursalAncashId, almChimbote?.Id),
            ("I200010", "Piura - Piura Centro", "PE-I200010-PROGRAMMING-PIURA-PE_PIURA_PRG", sucursalPiuraId, almPiura?.Id),
            ("I140010", "Chiclayo - Chiclayo Centro", "PE-I140010-PROGRAMMING-LAMBAYEQUE-PE_CHICLAYO_PRG", sucursalChiclayoId, almChiclayo?.Id),
            ("I130010", "Trujillo - Trujillo Centro", "PE-I130010-PROGRAMMING-LA_LIBERTAD-PE_TRUJILLO_PRG", sucursalTrujilloId, almTrujillo?.Id),
            ("I150010", "Lima - Lima Centro", "PE-I150010-PROGRAMMING-LIMA-PE_LIMA_CENTRO_PRG", sucursalLimaId, almLima?.Id),
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

    private static void ActualizarAlmacenBase(Almacen? alm, string codigo, Guid uoId)
    {
        if (alm == null) return;
        alm.Actualizar(
            alm.Nombre,
            alm.Descripcion,
            alm.ActualizadoPorId,
            codigo: string.IsNullOrWhiteSpace(alm.Codigo) || alm.Codigo.StartsWith("ALM-") ? codigo : alm.Codigo,
            tipo: TipoAlmacen.Bodega,
            unidadOrganizativaId: uoId);
    }

    private static async Task SeedRecursosTecnicosAsync(ServicioCampoDbContext context, ILogger logger, IReadOnlyDictionary<string, Guid>? sucursalesMap)
    {
        var zonas = await context.ZonasOperativas.ToListAsync();
        if (!zonas.Any()) return;

        var almacenes = await context.Almacenes.ToListAsync();

        var tecnicosData = new (string Codigo, string Nombre, string Documento, string Telefono, string Email, string CodigoZona, string NombreAlmacenBase, string CodigoSucursal, int Capacidad, string ColorHex)[]
        {
            ("TEC-ANC01", "Carlos Ramirez", "45678901", "943123456", "carlos.ramirez@empresa.com", "I280010", "Almacén Base Huaraz", "ANCASH", 6, "#0078d4"),
            ("TEC-ANC02", "Marcos Silva", "45678902", "943654321", "marcos.silva@empresa.com", "I280020", "Almacén Base Chimbote", "ANCASH", 6, "#107c41"),
            ("TEC-PIU01", "Jorge Navarro", "45678903", "973112233", "jorge.navarro@empresa.com", "I200010", "Almacén Base Piura", "PIURA", 6, "#5c2d91"),
            ("TEC-CHX01", "Manuel Flores", "45678904", "974445566", "manuel.flores@empresa.com", "I140010", "Almacén Base Chiclayo", "CHICLAYO", 6, "#d83b01"),
            ("TEC-TRU01", "Luis Paredes", "45678905", "944778899", "luis.paredes@empresa.com", "I130010", "Almacén Base Trujillo", "TRUJILLO", 6, "#008272"),
            ("TEC-LIM01", "Victor Sanchez", "45678906", "999888777", "victor.sanchez@empresa.com", "I150010", "Almacén Central Lima", "LIMA", 8, "#004e8c")
        };

        bool huboCambios = false;
        foreach (var t in tecnicosData)
        {
            var zona = zonas.FirstOrDefault(z => z.Codigo == t.CodigoZona);
            var almBase = almacenes.FirstOrDefault(a => a.Nombre == t.NombreAlmacenBase);
            var uoId = sucursalesMap != null && sucursalesMap.TryGetValue(t.CodigoSucursal, out var sId) ? sId : zona?.SucursalId;

            if (zona == null || almBase == null || !uoId.HasValue) continue;

            var recurso = await context.Recursos.FirstOrDefaultAsync(r => r.Codigo == t.Codigo);
            if (recurso == null)
            {
                recurso = Recurso.Crear(
                    t.Codigo,
                    t.Nombre,
                    TipoRecurso.Tecnico,
                    zona.Id,
                    almBase.Id,
                    almacenMovilId: null,
                    usuarioId: null,
                    empleadoId: null,
                    telefono: t.Telefono,
                    documentoIdentidad: t.Documento,
                    email: t.Email,
                    capacidadMaximaOrdenesPorDia: t.Capacidad,
                    colorHex: t.ColorHex);

                recurso.AsignarUnidadOrganizativa(uoId.Value);
                await context.Recursos.AddAsync(recurso);
                huboCambios = true;
            }
            else if (!recurso.UnidadOrganizativaId.HasValue)
            {
                recurso.AsignarUnidadOrganizativa(uoId.Value);
                huboCambios = true;
            }

            // Asegurar que el técnico tenga su almacén de custodia personal
            var almCampo = almacenes.FirstOrDefault(a => a.Tipo == TipoAlmacen.CustodiaPersonal && a.RecursoId == recurso.Id)
                           ?? await context.Almacenes.FirstOrDefaultAsync(a => a.Tipo == TipoAlmacen.CustodiaPersonal && a.RecursoId == recurso.Id);

            if (almCampo == null)
            {
                almCampo = Almacen.CrearCustodiaPersonal(
                    $"CUS-{t.Codigo}",
                    $"Custodia {t.Nombre}",
                    uoId.Value,
                    recurso.Id,
                    $"Custodia personal de material para {t.Nombre}");

                await context.Almacenes.AddAsync(almCampo);
                almacenes.Add(almCampo);
                huboCambios = true;
            }
        }

        if (huboCambios)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Recursos técnicos y almacenes de campo sembrados exitosamente.");
        }
    }

    private static async Task SeedAutorizacionesAlmacenAsync(ServicioCampoDbContext context, ILogger logger)
    {
        var almacenes = await context.Almacenes.ToListAsync();
        if (!almacenes.Any()) return;

        // Autorizar al usuario administrador por defecto
        var adminUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        bool huboCambios = false;

        foreach (var alm in almacenes)
        {
            if (!await context.UsuarioAlmacenAutorizaciones.AnyAsync(a => a.UsuarioId == adminUserId && a.AlmacenId == alm.Id))
            {
                var aut = UsuarioAlmacenAutorizacion.Crear(
                    adminUserId,
                    alm.Id,
                    puedeConsultar: true,
                    puedeDespachar: true,
                    puedeRecepcionar: true,
                    esSupervisor: true);

                await context.UsuarioAlmacenAutorizaciones.AddAsync(aut);
                huboCambios = true;
            }
        }

        if (huboCambios)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Autorizaciones de almacén para usuario administrador sembradas exitosamente.");
        }
    }
}
