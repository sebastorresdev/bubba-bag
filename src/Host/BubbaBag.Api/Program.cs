using BubbaBag.Api;
using BubbaBag.Modules.Seguridad.Api;
using BubbaBag.Modules.RecursosHumanos.Api;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddOpenApi();
builder.Services.AddExceptionHandler<BubbaBag.Api.Middlewares.GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.AddNpgsqlDbContext<BubbaBag.Modules.Seguridad.Infrastructure.Persistence.SeguridadDbContext>("sqldb");
builder.AddNpgsqlDbContext<BubbaBag.Modules.RecursosHumanos.Infrastructure.Database.RecursosHumanosDbContext>("sqldb");
builder.Services.AddBubbaBagServices(builder.Configuration);

BubbaBag.Modules.RecursosHumanos.Api.RecursosHumanosModule.AddRecursosHumanosModule(builder.Services);

var app = builder.Build();

app.UseExceptionHandler();
app.MapDefaultEndpoints();
await app.ApplyMigrationsAndSeedAsync();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapSeguridadEndpoints();
app.MapRecursosHumanosEndpoints();


app.Run();
