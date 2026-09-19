using System;
using System.Linq;
using BubbaBag.Modules.Crm.Application;
using BubbaBag.Modules.Crm.Infrastructure.Database;
using BubbaBag.SharedKernel.CQRS;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Modules.Crm.Api;

public static class CrmModule
{
    public static IServiceCollection AddCrmModule(this IServiceCollection services)
    {
        // Infrastructure
        services.AddScoped<ICrmDbContext>(provider => provider.GetRequiredService<CrmDbContext>());

        // Application Assembly
        var applicationAssembly = typeof(ICrmDbContext).Assembly;

        // FluentValidation
        services.AddValidatorsFromAssembly(applicationAssembly);

        // Registrar dinámicamente todos los ICommandHandler<,> y IQueryHandler<,>
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
