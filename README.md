# BubbaBag / SKVIA ERP

Sistema ERP y Servicio de Campo (Field Service) a medida.

## Arquitectura

- **Backend:** Monolito Modular con .NET 10 y C# 13.
- **Frontend:** React 19 con TypeScript, Microsoft Fluent UI v9 y Vite (`skvia-client`).
- **Base de Datos:** PostgreSQL (EF Core 10).
- **Orquestación:** .NET Aspire 13 (`BubbaBag.AppHost`).
- **Patrones:** Clean Architecture, CQRS (implementación interna sin dependencias pesadas).

## Estructura de Proyectos (Backend)

- `src/Host/BubbaBag.Api`: Proyecto principal que expone los endpoints Minimal API, configura inyección de dependencias, base de datos y seguridad.
- `src/Host/BubbaBag.AppHost`: Orquestador de desarrollo local con .NET Aspire (PostgreSQL, API y Frontend Vite).
- `src/Host/BubbaBag.ServiceDefaults`: Telemetría (OpenTelemetry), health checks y resiliencia.
- `src/Shared/BubbaBag.SharedKernel`: Clases base, interfaces, Result pattern, y motor CQRS.
- `src/Modules/`: Módulos de negocio aislados:
  - `ServicioCampo`: Órdenes de trabajo, inventario, almacenes, compras, transferencias, listas de precios, catálogo de productos y mantenimiento operativo.
  - `RecursosHumanos`: Colaboradores, cargos, departamentos, sucursales y asistencia.
  - `Seguridad`: Autenticación JWT, usuarios, roles, permisos y vistas personalizadas.
  - `GestionDatos`: Motor de importación masiva y validación de datos (ETL).

Cada módulo se organiza en cuatro capas: `Domain`, `Application`, `Infrastructure` y `Api`.

## Estructura Frontend

Ubicado en la carpeta `skvia-client`:
- React 19 con componentes funcionales y hooks.
- Sistema de diseño Microsoft Fluent UI v9 (estética Dynamics 365).
- Enrutamiento con React Router DOM v7 (`React.lazy` para carga diferida de módulos).

## Documentación Técnica

- Para ejecutar la API, configurar `JwtSettings:Secret` mediante .NET User Secrets del proyecto `src/Host/BubbaBag.Api` o la variable de entorno `JwtSettings__Secret` (mínimo 32 bytes). La clave no se almacena en el repositorio.
- [Convenciones de interfaz: cabeceras y regreso al listado](docs/convenciones-interfaz.md)
- [Convención de Nombres (Spanglish)](file:///c:/DEV_HOME/PROYECTOS/BUBBA_BAG/docs/naming-conventions.md)
- [Patrón de Endpoints de API (Minimal APIs)](file:///c:/DEV_HOME/PROYECTOS/BUBBA_BAG/docs/api-endpoints-pattern.md)
- [Arquitectura de Seguridad: Roles Fijos y Multi-Rol](file:///c:/DEV_HOME/PROYECTOS/BUBBA_BAG/docs/security-roles-architecture.md)
- [Manual Operativo de Servicio de Campo](file:///c:/DEV_HOME/PROYECTOS/BUBBA_BAG/docs/manual-servicio-campo.md)
- [Flujo de Compras e Inventario](file:///c:/DEV_HOME/PROYECTOS/BUBBA_BAG/docs/compras.md)
