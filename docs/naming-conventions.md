# Convención de nombres: "Spanglish"

Regla del proyecto: **la arquitectura técnica se nombra en inglés, pero el dominio de negocio de cada módulo se nombra en español**. No se traduce la terminología de patrones de arquitectura.

## Regla

- **Se mantienen en inglés** (son términos de arquitectura/patrones, no de negocio):
  `Command`, `Query`, `Handler`, `Dto`, `Repository`, `Entity`, `ValueObject`, `Validator`,
  `Domain`, `Application`, `Infrastructure`, `Api`, `Result`, y los nombres de capas/proyectos.
- **Se traducen al español** los sustantivos y verbos del dominio de negocio: nombres de módulos,
  entidades, y las acciones de los casos de uso (Crear, Obtener, Actualizar, Eliminar, Cancelar,
  Aprobar, etc.).

## Ejemplos correctos

| Correcto (Spanglish) | Incorrecto |
|---|---|
| `CrearEmpleadoCommand` | `CrearEmpleadoComando`, `CreateEmpleadoCommand`, `CreateEmployeeCommand` |
| `EmpleadoDto` | `EmployeeDto`, `DtoEmpleado` |
| `ObtenerEmpleadoQuery` | `ObtenerEmpleadoConsulta`, `GetEmpleadoQuery` |
| `IEmpleadoRepository` | `IRepositorioEmpleado` |
| `Empleado` (entidad) | `Employee` |
| `Modules/RecursosHumanos/` (módulo) | `Modules/HR/` |
| `CrearClienteCommandHandler` | `CrearClienteCommandManejador` |
| `ActualizarProductoCommand` | `UpdateProductoCommand` |
| `ProductoRepository` | `RepositorioProducto` |

## Aplica a

- Nombres de módulos de negocio (carpetas, proyectos, namespaces): `ServicioCampo`, `RecursosHumanos`,
  `Seguridad`, etc. — no `FieldService`, `HR`, `Security`.
- Entidades de dominio y sus propiedades de negocio (ej. `Empleado.Salario`, `Producto.PrecioBase`), salvo campos técnicos genéricos (`Id`, `CreatedAtUtc`, etc. que forman parte de `Entity<TId>` del SharedKernel).
- Comandos, queries, DTOs, validadores, endpoints HTTP (ej. `/api/inventario/productos`, `/api/rrhh/empleados`).

## NO aplica a (queda en inglés)

- `BubbaBag.SharedKernel`, librerías transversales, middleware — son infraestructura
  técnica transversal, no dominio de negocio de un módulo específico.
- Componentes técnicos de ingestión / ETL: `GestionDatos` utiliza términos técnicos estándar de pipeline de datos (`DataImportJob`, `DataImportEngineService`, `EntityImportDescriptorDto`, `preview`, `mappings`) al tratarse de herramientas genéricas de infraestructura de datos.
- Sufijos/patrones de arquitectura: `Command`, `Query`, `Handler`, `Dto`, `Repository`, `Entity`,
  `Validator`, `DbContext`.
- Nombres de capas: `Domain`, `Application`, `Infrastructure`, `Api`.
- Identificadores técnicos genéricos: `Id`, `CreatedAtUtc`, `IsActive`, etc.

## Módulos de referencia

Los módulos `ServicioCampo` (`src/Modules/ServicioCampo/`) y `RecursosHumanos` (`src/Modules/RecursosHumanos/`) siguen esta convención y sirven como plantilla exacta: `Empleado`, `Producto`, `Almacen`, `CrearEmpleadoCommand`, `ObtenerProductosQuery`, `ServicioCampoDbContext`, etc.
