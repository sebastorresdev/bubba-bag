using BubbaBag.Modules.RecursosHumanos.Application;
using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Dtos;
using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;
using BubbaBag.Modules.RecursosHumanos.Infrastructure.Database;
using BubbaBag.SharedKernel;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.Extensions.DependencyInjection;

namespace BubbaBag.Modules.RecursosHumanos.Api;

public static class RecursosHumanosModule
{
    public static IServiceCollection AddRecursosHumanosModule(this IServiceCollection services)
    {
        // Infrastructure
        services.AddScoped<IRecursosHumanosDbContext>(provider => provider.GetRequiredService<RecursosHumanosDbContext>());

        // Application (CQRS)
        // Commands
        services.AddScoped<ICommandHandler<CrearEmpleadoCommand, Result<Guid>>, CrearEmpleadoHandler>();
        services.AddScoped<ICommandHandler<ActualizarEmpleadoCommand, Result<Guid>>, ActualizarEmpleadoHandler>();
        services.AddScoped<ICommandHandler<EliminarEmpleadoCommand, Result<bool>>, EliminarEmpleadoHandler>();

        // Queries
        services.AddScoped<IQueryHandler<ObtenerEmpleadoQuery, Result<EmpleadoDto>>, ObtenerEmpleadoHandler>();
        services.AddScoped<IQueryHandler<ObtenerEmpleadosQuery, Result<List<EmpleadoDto>>>, ObtenerEmpleadosHandler>();

        return services;
    }
}

