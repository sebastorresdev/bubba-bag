# BubbaBag ERP

Sistema ERP a medida para BubbaBag.

## Arquitectura

- **Backend:** Monolito Modular con .NET 10.
- **Frontend:** Angular 21 con Standalone Components, ng-zorro-antd y TailwindCSS.
- **Base de Datos:** PostgreSQL (EF Core).
- **Patrones:** Clean Architecture, CQRS (Implementación propia).

## Estructura de Proyectos (Backend)

- src/Host/BubbaBag.Api: Proyecto principal que aloja la aplicación y configura inyección de dependencias, base de datos, etc.
- src/Shared/BubbaBag.SharedKernel: Clases base, interfaces y la implementación de CQRS.
- src/Modules/: Contiene los módulos de negocio.
  - RecursosHumanos: Módulo de Recursos Humanos y asistencia.
  - Ventas: Módulo de Ventas.

Cada módulo se divide en Domain, Application, Infrastructure y Api.

## Estructura Frontend

Ubicado en la carpeta ubbabag-client (Angular workspace).
