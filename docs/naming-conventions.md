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
| `ActualizarFacturaCommand` | `UpdateFacturaCommand` |
| `ClienteRepository` | `RepositorioCliente` |

## Aplica a

- Nombres de módulos de negocio (carpetas, proyectos, namespaces): `Ventas`, `Inventario`,
  `Contabilidad`, `RecursosHumanos`, `Crm`, `Manufactura`, etc. — no `Sales`, `Inventory`,
  `Accounting`, `HR`.
- Entidades de dominio y sus propiedades de negocio (ej. `Empleado.Salario`, no
  `Employee.Salary`), salvo campos técnicos genéricos (`Id`, `CreatedAtUtc`, etc. pueden quedar en
  inglés como parte de `Entity<TId>` del SharedKernel).
- Comandos, queries, DTOs, validadores, endpoints HTTP (ej. `/api/ventas/clientes`, no
  `/api/sales/customers`).

## NO aplica a (queda en inglés)

- `BubbaBag.SharedKernel`, librerías transversales, etc. — son infraestructura
  técnica transversal, no dominio de negocio de un módulo específico.
- Sufijos/patrones de arquitectura: `Command`, `Query`, `Handler`, `Dto`, `Repository`, `Entity`,
  `Validator`, `DbContext`.
- Nombres de capas: `Domain`, `Application`, `Infrastructure`, `Api`.
- Identificadores técnicos genéricos: `Id`, `CreatedAtUtc`, `IsActive`, etc.

## Módulo de referencia

El módulo `Ventas` (`src/Modules/Ventas/`) sigue esta convención y sirve como plantilla exacta
para los módulos siguientes: `Cliente` (entidad), `ClienteDto`, `CrearClienteCommand`,
`CrearClienteCommandHandler`, `CrearClienteValidator`, `ObtenerClientesQuery`,
`ObtenerClientesQueryHandler`, `IClienteRepository`, `ClienteRepository`, `VentasDbContext`,
`VentasEndpoints`, ruta `/api/ventas/clientes`.
