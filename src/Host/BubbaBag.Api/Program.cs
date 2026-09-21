using BubbaBag.Api;
using BubbaBag.Modules.Seguridad.Api;
using BubbaBag.Modules.RecursosHumanos.Api;
using BubbaBag.Modules.Crm.Api;
using BubbaBag.Modules.Inventario.Api;
using BubbaBag.Modules.ServicioCampo.Api;
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
builder.AddNpgsqlDbContext<BubbaBag.Modules.Crm.Infrastructure.Database.CrmDbContext>("sqldb");
builder.AddNpgsqlDbContext<BubbaBag.Modules.Inventario.Infrastructure.Database.InventarioDbContext>("sqldb", configureDbContextOptions: options =>
{
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});
builder.AddNpgsqlDbContext<BubbaBag.Modules.Ventas.Infrastructure.Database.VentasDbContext>("sqldb", configureDbContextOptions: options =>
{
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});
builder.AddNpgsqlDbContext<BubbaBag.Modules.ServicioCampo.Infrastructure.Database.ServicioCampoDbContext>("sqldb", configureDbContextOptions: options =>
{
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});
builder.Services.AddBubbaBagServices(builder.Configuration);

BubbaBag.Modules.RecursosHumanos.Api.RecursosHumanosModule.AddRecursosHumanosModule(builder.Services);
BubbaBag.Modules.Ventas.Api.VentasModule.AddVentasModule(builder.Services);
builder.Services.AddCrmModule();
builder.Services.AddInventarioModule();
builder.Services.AddServicioCampoModule();

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
app.MapSucursalesEndpoints();
app.MapCrmEndpoints();
app.MapInventarioEndpoints();
BubbaBag.Modules.Ventas.Api.ListasPrecioEndpoints.MapVentasEndpoints(app);
app.MapServicioCampoEndpoints();


app.Run();
