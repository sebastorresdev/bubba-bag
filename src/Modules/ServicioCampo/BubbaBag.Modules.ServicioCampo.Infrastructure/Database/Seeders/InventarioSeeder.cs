using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace BubbaBag.Modules.ServicioCampo.Infrastructure.Database.Seeders;

public static class InventarioSeeder
{
    // Catálogos e inventario quedan bajo administración del usuario.
    public static Task SeedAsync(
        ServicioCampoDbContext context,
        ILogger logger,
        Dictionary<string, Guid>? sucursalesMap = null) => Task.CompletedTask;
}
