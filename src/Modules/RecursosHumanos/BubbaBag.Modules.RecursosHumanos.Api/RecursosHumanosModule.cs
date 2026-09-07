using System;
using System.Collections.Generic;
using System.Linq;
using BubbaBag.Modules.RecursosHumanos.Application;
using BubbaBag.Modules.RecursosHumanos.Infrastructure.Database;
using BubbaBag.SharedKernel.CQRS;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Modules.RecursosHumanos.Api;

public static class RecursosHumanosModule
{
    public static IServiceCollection AddRecursosHumanosModule(this IServiceCollection services)
    {
        // Infrastructure
        services.AddScoped<IRecursosHumanosDbContext>(provider => provider.GetRequiredService<RecursosHumanosDbContext>());

        // Application Assembly
        var applicationAssembly = typeof(BubbaBag.Modules.RecursosHumanos.Application.IRecursosHumanosDbContext).Assembly;

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
