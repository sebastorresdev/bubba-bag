# Regla de Arquitectura: Patrón de Endpoints en Minimal APIs

Al crear, modificar o refactorizar endpoints en el backend de BubbaBag (.NET / C#), **SIEMPRE** se debe cumplir con las siguientes reglas:

1. **NO usar lambdas anónimas / delegados inline** en los mapeos de rutas (`group.MapGet("/", async (...) => { ... })` está prohibido).
2. **Usar Route Groups con Named Static Handlers**:
   - Cada ruta HTTP se debe vincular directamente a un método estático con nombre descriptivo.
   - El método de mapeo de rutas (`Map...Endpoints`) debe ser limpio y funcionar como una tabla de contenidos visual.
3. **Nombres de Handlers en español (convención Spanglish)**:
   - Seguir `docs/naming-conventions.md`.
   - Ejemplos de métodos: `ObtenerEmpleados`, `ObtenerEmpleadoPorId`, `CrearEmpleado`, `ActualizarEmpleado`, `EliminarEmpleado`, `IniciarSesion`, `RegistrarUsuario`.
4. **Estructura de Handlers**:
   - `private static async Task<IResult> NombreAccion(IDispatcher dispatcher, ...)`
   - Retornar resultados HTTP mediante `Results.Ok()`, `Results.Created()`, `Results.BadRequest()`, `Results.NotFound()`, `Results.NoContent()`.
5. **Modularidad**:
   - Cuando un módulo tenga múltiples recursos o entidades, separar cada recurso en su propio archivo `Endpoints/<Recurso>Endpoints.cs` y orquestarlos desde el método de extensión principal del módulo.

Consultar la guía completa en [docs/api-endpoints-pattern.md](file:///d:/PROYECTOS/bubba-bag/docs/api-endpoints-pattern.md).
