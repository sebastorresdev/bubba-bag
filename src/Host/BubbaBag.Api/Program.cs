using BubbaBag.Api;
using BubbaBag.Modules.Seguridad.Api;
using BubbaBag.Modules.RecursosHumanos.Api;
using BubbaBag.Modules.ServicioCampo.Api;
using BubbaBag.Modules.GestionDatos.Api;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

var allowedCorsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:4300", "http://localhost:4301"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return uri.Host is "localhost" or "127.0.0.1" || allowedCorsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
                }
                return false;
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
        }
        else
        {
            policy.WithOrigins(allowedCorsOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

builder.Services.AddOpenApi();
builder.Services.AddExceptionHandler<BubbaBag.Api.Middlewares.GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.AddNpgsqlDbContext<BubbaBag.Modules.Seguridad.Infrastructure.Persistence.SeguridadDbContext>("sqldb");
builder.AddNpgsqlDbContext<BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.RecursosHumanosDbContext>("sqldb");
builder.AddNpgsqlDbContext<BubbaBag.Modules.ServicioCampo.Infrastructure.Database.ServicioCampoDbContext>("sqldb", configureDbContextOptions: options =>
{
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});
builder.AddNpgsqlDbContext<BubbaBag.Modules.GestionDatos.Infrastructure.Database.GestionDatosDbContext>("sqldb");
builder.Services.AddBubbaBagServices(builder.Configuration);

BubbaBag.Modules.RecursosHumanos.Api.RecursosHumanosModule.AddRecursosHumanosModule(builder.Services);
builder.Services.AddServicioCampoModule();
builder.Services.AddGestionDatosModule();

var app = builder.Build();

app.UseExceptionHandler();
app.MapDefaultEndpoints();
await app.ApplyMigrationsAsync();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapSeguridadEndpoints();
app.MapRecursosHumanosEndpoints();
app.MapSucursalesEndpoints();
app.MapServicioCampoEndpoints();
app.MapGestionDatosEndpoints();

app.Run();
