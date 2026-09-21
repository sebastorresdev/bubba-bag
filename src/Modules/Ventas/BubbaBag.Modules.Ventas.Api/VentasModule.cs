using System.Linq;
using BubbaBag.Modules.Ventas.Application;
using BubbaBag.Modules.Ventas.Infrastructure.Database;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Modules.Ventas.Api;

public static class VentasModule
{
    public static IServiceCollection AddVentasModule(this IServiceCollection services)
    {
        services.AddScoped<IVentasDbContext>(provider => provider.GetRequiredService<VentasDbContext>());

        var applicationAssembly = typeof(IVentasDbContext).Assembly;

        foreach (var type in applicationAssembly.GetTypes().Where(t => !t.IsAbstract && !t.IsInterface))
        {
            foreach (var iface in type.GetInterfaces())
            {
                if (iface.IsGenericType &&
                    (iface.GetGenericTypeDefinition() == typeof(ICommandHandler<,>) ||
                     iface.GetGenericTypeDefinition() == typeof(ICommandHandler<>) ||
                     iface.GetGenericTypeDefinition() == typeof(IQueryHandler<,>)))
                {
                    services.AddScoped(iface, type);
                }
            }
        }

        return services;
    }
}
