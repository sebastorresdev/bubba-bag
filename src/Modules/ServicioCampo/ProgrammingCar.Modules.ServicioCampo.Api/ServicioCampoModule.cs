using System.Linq;
using ProgrammingCar.Modules.ServicioCampo.Application;
using ProgrammingCar.Modules.ServicioCampo.Infrastructure.Database;
using ProgrammingCar.SharedKernel.CQRS;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace ProgrammingCar.Modules.ServicioCampo.Api;

public static class ServicioCampoModule
{
    public static IServiceCollection AddServicioCampoModule(this IServiceCollection services)
    {
        // Infrastructure
        services.AddScoped<IServicioCampoDbContext>(provider => provider.GetRequiredService<ServicioCampoDbContext>());
        services.AddScoped<ProgrammingCar.Modules.ServicioCampo.Application.Productos.Services.IInventarioExcelService, ProgrammingCar.Modules.ServicioCampo.Infrastructure.Services.InventarioExcelService>();
        services.AddScoped<ProgrammingCar.Modules.GestionDatos.Application.Services.IEntityImportProvider, ProgrammingCar.Modules.ServicioCampo.Infrastructure.Services.ServicioCampoImportProvider>();
        services.AddScoped<ProgrammingCar.Modules.ServicioCampo.Application.OrdenesTrabajo.SiebelImportadorService>();

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

