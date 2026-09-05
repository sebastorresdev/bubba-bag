# Regla: Convención de Nombres (Spanglish)

Al nombrar clases, archivos, carpetas, métodos y propiedades en BubbaBag:

1. **Arquitectura Técnica en Inglés**:
   - `Command`, `Query`, `Handler`, `Dto`, `Repository`, `Entity`, `ValueObject`, `Validator`, `Domain`, `Application`, `Infrastructure`, `Api`, `Result`.
   - Identificadores técnicos genéricos: `Id`, `CreatedAtUtc`, `IsActive`.

2. **Dominio de Negocio en Español**:
   - Módulos: `Ventas`, `RecursosHumanos`, `Inventario`, `Seguridad`.
   - Entidades y DTOs: `Empleado`, `EmpleadoDto`, `Cliente`, `ClienteDto`.
   - Casos de uso / Handlers: `CrearEmpleadoCommand`, `ObtenerEmpleadoQuery`, `EliminarEmpleadoCommandHandler`.
   - Propiedades de negocio: `Nombres`, `Apellidos`, `SalarioBase`, `TipoDocumento`.
   - Rutas HTTP: `/api/rrhh/empleados`, `/api/ventas/clientes`.
