using System.Linq;
using BubbaBag.Modules.Inventario.Application;
using BubbaBag.Modules.Inventario.Infrastructure.Database;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Modules.Inventario.Api;

public static class InventarioModule
{
    public static IServiceCollection AddInventarioModule(this IServiceCollection services)
    {
        services.AddScoped<IInventarioDbContext>(provider => provider.GetRequiredService<InventarioDbContext>());

        var applicationAssembly = typeof(IInventarioDbContext).Assembly;

        foreach (var type in applicationAssembly.GetTypes().Where(t => !t.IsAbstract && !t.IsInterface))
        {
            foreach (var iface in type.GetInterfaces())
            {
                if (iface.IsGenericType &&
                    (iface.GetGenericTypeDefinition() == typeof(ICommandHandler<,>) ||
                     iface.GetGenericTypeDefinition() == typeof(IQueryHandler<,>)))
                {
                    services.AddScoped(iface, type);
                }
            }
        }

        return services;
    }
}
