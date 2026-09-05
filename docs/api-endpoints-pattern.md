# Patrón de Endpoints de API (Minimal APIs con Named Static Handlers)

Este documento define el estándar oficial de arquitectura para la exposición de endpoints HTTP en el backend de BubbaBag (.NET / Minimal APIs).

---

## 1. Regla Fundamental

> **ESTÁ PROHIBIDO** usar funciones lambda anónimas / delegados inline dentro de las llamadas de mapeo (`group.MapGet("/", async (...) => { ... })`).

Toda ruta debe mapearse a un **método estático con nombre descriptivo**. La función de configuración de rutas debe actuar como una **tabla de contenidos limpia y legible**.

---

## 2. Estructura Estándar

Cada módulo define sus endpoints en su capa `Api` (ej. `BubbaBag.Modules.<Modulo>.Api`).

### Reglas de Organización
1. **Método de extensión:** Se expone un método de extensión sobre `IEndpointRouteBuilder` (`Map<Modulo>Endpoints` o `Map<Entidad>Endpoints`).
2. **Grupo de rutas (`MapGroup`):** Se agrupa por prefijo de API (ej. `/api/rrhh/empleados`), asignando tags (`.WithTags(...)`) y políticas de autorización (`.RequireAuthorization()`).
3. **Mapeo declarativo:** La función de mapeo solo asocia la ruta HTTP y verbo con el método manejador.
4. **Manejadores estáticos (`Named Static Handlers`):**
   - Son métodos estáticos (`private static async Task<IResult> <NombreAccion>(...)`).
   - El nombre de la acción debe ser descriptivo y seguir la convención del proyecto en español (según `docs/naming-conventions.md`: *Spanglish*, verbos y sustantivos de negocio en español: `ObtenerEmpleados`, `CrearEmpleado`, `ObtenerEmpleadoPorId`, `ActualizarEmpleado`, `EliminarEmpleado`, `IniciarSesion`, etc.).
   - Reciben servicios inyectados por parámetros (`IDispatcher`, servicios de aplicación, `CancellationToken`, etc.).
   - Retornan `IResult` utilizando `Results.Ok`, `Results.Created`, `Results.BadRequest`, `Results.NotFound`, `Results.NoContent`, etc.

---

## 3. Plantilla de Ejemplo

```csharp
using BubbaBag.Modules.RecursosHumanos.Application.Empleados.Features;
using BubbaBag.SharedKernel.CQRS;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BubbaBag.Modules.RecursosHumanos.Api;

public static class EmpleadoEndpoints
{
    public static void MapEmpleadoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/rrhh/empleados")
            .WithTags("Recursos Humanos")
            .RequireAuthorization();

        // Tabla de contenidos de rutas
        group.MapGet("/", ObtenerEmpleados);
        group.MapGet("/{id:guid}", ObtenerEmpleadoPorId);
        group.MapPost("/", CrearEmpleado);
        group.MapPut("/{id:guid}", ActualizarEmpleado);
        group.MapDelete("/{id:guid}", EliminarEmpleado);
    }

    // Handlers estáticos con nombres descriptivos
    private static async Task<IResult> ObtenerEmpleados(
        IDispatcher dispatcher,
        string? searchTerm,
        int page = 1,
        int pageSize = 20)
    {
        var result = await dispatcher.QueryAsync(new ObtenerEmpleadosQuery(searchTerm, page, pageSize));
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ObtenerEmpleadoPorId(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.QueryAsync(new ObtenerEmpleadoQuery(id));
        if (result.IsFailure)
        {
            return Results.NotFound(new { Error = result.Error });
        }
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> CrearEmpleado(
        IDispatcher dispatcher,
        CrearEmpleadoCommand command)
    {
        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new { Error = result.Error });
        }
        return Results.Created($"/api/rrhh/empleados/{result.Value}", result.Value);
    }

    private static async Task<IResult> ActualizarEmpleado(
        IDispatcher dispatcher,
        Guid id,
        ActualizarEmpleadoCommand command)
    {
        if (id != command.Id)
        {
            return Results.BadRequest(new { Error = "El ID de la ruta no coincide con el del body." });
        }

        var result = await dispatcher.SendAsync(command);
        if (result.IsFailure)
        {
            return Results.BadRequest(new { Error = result.Error });
        }
        return Results.NoContent();
    }

    private static async Task<IResult> EliminarEmpleado(
        IDispatcher dispatcher,
        Guid id)
    {
        var result = await dispatcher.SendAsync(new EliminarEmpleadoCommand(id));
        if (result.IsFailure)
        {
            return Results.BadRequest(new { Error = result.Error });
        }
        return Results.NoContent();
    }
}
```

---

## 4. Separación por Entidades cuando un Módulo Crece

Si un módulo contiene varias entidades o casos de uso (por ejemplo, Recursos Humanos con `Empleados`, `Contratos`, `Asistencias`):

1. Crear un archivo por entidad en la capa `Api`:
   - `Endpoints/EmpleadoEndpoints.cs`
   - `Endpoints/ContratoEndpoints.cs`
   - `Endpoints/AsistenciaEndpoints.cs`
2. En la clase orquestadora del módulo (ej. `RecursosHumanosEndpoints.cs`):
   ```csharp
   public static void MapRecursosHumanosEndpoints(this IEndpointRouteBuilder app)
   {
       app.MapEmpleadoEndpoints();
       app.MapContratoEndpoints();
       app.MapAsistenciaEndpoints();
   }
   ```
3. En `Program.cs` del Host solo se registra el método orquestador del módulo:
   ```csharp
   app.MapRecursosHumanosEndpoints();
   ```

---

## 5. Convenciones de Nomenclatura para Handlers

Siguiendo la regla de Spanglish (`docs/naming-conventions.md`):

| Operación HTTP | Acción CQRS | Nombre del Método Handler |
|---|---|---|
| `GET /` (lista paginada) | `Obtener<Entidades>Query` | `Obtener<Entidades>` |
| `GET /{id}` | `Obtener<Entidad>Query` | `Obtener<Entidad>PorId` |
| `POST /` | `Crear<Entidad>Command` | `Crear<Entidad>` |
| `PUT /{id}` | `Actualizar<Entidad>Command` | `Actualizar<Entidad>` |
| `DELETE /{id}` | `Eliminar<Entidad>Command` | `Eliminar<Entidad>` |
| `POST /login` | `LoginCommand` o Auth Service | `IniciarSesion` |
| `POST /accion-especial` | `Aprobar<Entidad>Command` | `Aprobar<Entidad>` |
