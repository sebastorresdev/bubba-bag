using System.Linq;
using BubbaBag.Modules.ServicioCampo.Application;
using BubbaBag.Modules.ServicioCampo.Infrastructure.Database;
using BubbaBag.SharedKernel.CQRS;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Modules.ServicioCampo.Api;

public static class ServicioCampoModule
{
    public static IServiceCollection AddServicioCampoModule(this IServiceCollection services)
    {
        // Infrastructure
        services.AddScoped<IServicioCampoDbContext>(provider => provider.GetRequiredService<ServicioCampoDbContext>());
        services.AddScoped<BubbaBag.Modules.ServicioCampo.Application.Mantenimientos.Servicios.Services.IServicioExcelService, BubbaBag.Modules.ServicioCampo.Infrastructure.Services.ServicioExcelService>();

        // Application Assembly - Registrar dinámicamente todos los ICommandHandler<,>, IQueryHandler<,> y Validators
        var applicationAssembly = typeof(IServicioCampoDbContext).Assembly;

        services.AddValidatorsFromAssembly(applicationAssembly);

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
