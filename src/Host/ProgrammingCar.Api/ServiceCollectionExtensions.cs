using System.Text;
using ProgrammingCar.Api.Services;
using ProgrammingCar.Modules.Seguridad.Application.Auth;
using ProgrammingCar.Modules.Seguridad.Domain.Entities;
using ProgrammingCar.Modules.Seguridad.Infrastructure.Auth;
using ProgrammingCar.Modules.Seguridad.Infrastructure.Persistence;
using ProgrammingCar.SharedKernel;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace ProgrammingCar.Api;

public static class ServiceCollectionExtensions
{
    private static async Task ValidarSesionAsync(TokenValidatedContext context)
    {
        var id = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var stamp = context.Principal?.FindFirst("security_stamp")?.Value;
        var manager = context.HttpContext.RequestServices.GetRequiredService<UserManager<Usuario>>();
        var usuario = id == null ? null : await manager.FindByIdAsync(id);
        if (usuario == null || !usuario.EsActivo || string.IsNullOrEmpty(stamp) || stamp != usuario.SecurityStamp)
            context.Fail("La sesión ha vencido o los permisos han cambiado.");
    }

    public static IServiceCollection AddProgrammingCarServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<ICodigoSecuencialService, PostgresCodigoSecuencialService>();
        services.AddScoped<ProgrammingCar.SharedKernel.CQRS.IDispatcher, ProgrammingCar.SharedKernel.CQRS.Dispatcher>();

        // Seguridad Module
        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ProgrammingCar.Modules.GestionDatos.Application.Services.IEntityImportProvider, UsuariosImportProvider>();
        services.AddScoped<ProgrammingCar.Modules.GestionDatos.Application.Services.IImportacionInventarioTransaccion, ImportacionInventarioTransaccion>();
        services.AddScoped<ProgrammingCar.Modules.Seguridad.Application.Vistas.IVistasService, ProgrammingCar.Modules.Seguridad.Infrastructure.Vistas.VistasService>();
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        services.AddIdentity<Usuario, Rol>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequiredLength = 8;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        })
            .AddEntityFrameworkStores<SeguridadDbContext>()
            .AddDefaultTokenProviders();

        var jwtSettings = new JwtSettings();
        configuration.Bind(JwtSettings.SectionName, jwtSettings);
        if (string.IsNullOrWhiteSpace(jwtSettings.Secret) || Encoding.UTF8.GetByteCount(jwtSettings.Secret) < 32)
            throw new InvalidOperationException("Configure JwtSettings:Secret con una clave de al menos 32 bytes mediante User Secrets o la variable JwtSettings__Secret.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.Events = new JwtBearerEvents { OnTokenValidated = ValidarSesionAsync };
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
            };
        });

        services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, ProgrammingCar.Api.Authorization.PermissionAuthorizationHandler>();

        services.AddAuthorization(options =>
        {
            // Registrar dinámicamente cada permiso atómico como una política en ASP.NET Core
            foreach (var permission in ProgrammingCar.SharedKernel.Authorization.Permissions.GetAll())
            {
                options.AddPolicy(permission, policy =>
                    policy.Requirements.Add(new ProgrammingCar.Api.Authorization.PermissionRequirement(permission)));
            }
        });

        return services;
    }
}
