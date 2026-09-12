# Arquitectura de Seguridad: Roles Fijos y Modelo Multi-Rol

Este documento define la estructura de roles del sistema BubbaBag ERP, su jerarquía/escala de acceso y el soporte multi-rol para usuarios con responsabilidades transversales.

---

## 1. Catálogo de Roles Fijos del Sistema

El sistema establece una escala corporativa modular con roles organizados por departamento (definidos en [Roles.cs](file:///c:/DEV_HOME/PROYECTOS/BUBBA_BAG/src/Shared/BubbaBag.SharedKernel/Authorization/Roles.cs)):

```csharp
namespace BubbaBag.SharedKernel.Authorization;

public static class Roles
{
    // Sistema / Globales
    public const string SuperAdmin             = "SuperAdmin";
    public const string Gerencia               = "Gerencia";

    // Recursos Humanos
    public const string RrhhAdmin              = "RrhhAdmin";
    public const string RrhhAsistente          = "RrhhAsistente";

    // Servicio de Campo (Field Service)
    public const string ServicioCampoAdmin     = "ServicioCampoAdmin";
    public const string ServicioCampoBackoffice = "ServicioCampoBackoffice";
    public const string ServicioCampoTecnico   = "ServicioCampoTecnico";

    // CRM y Clientes
    public const string CrmAdmin               = "CrmAdmin";
    public const string CrmOperador            = "CrmOperador";
}
```

### Descripción y Alcance de Cada Rol

| Rol | Módulo | Nombre Visible | Responsabilidades y Alcance |
|---|---|---|---|
| **`SuperAdmin`** | Sistema | Super Administrador | Desarrollador y administrador técnico global. Bypass total y configuración del ERP. |
| **`Gerencia`** | Sistema | Gerencia General | Directivo con acceso a auditorías, métricas globales e información financiera confidencial. |
| **`RrhhAdmin`** | Recursos Humanos | Administrador | Control total sobre personal: altas, ceses, contratos, salarios y cuentas bancarias. |
| **`RrhhAsistente`** | Recursos Humanos | Asistente | Gestión de colaboradores sin acceso a salarios, cuentas bancarias ni ceses. |
| **`ServicioCampoAdmin`** | Servicio de Campo | Administrador / Supervisor | Control total operativo: gestión de tarifarios y precios, creación de tipos de orden y supervisión de cuadrillas. |
| **`ServicioCampoBackoffice`** | Servicio de Campo | Backoffice / Despacho | Mesa de ayuda, importación de órdenes masivas, agendamiento y despacho de cuadrillas. Sin alteración de tarifarios. |
| **`ServicioCampoTecnico`** | Servicio de Campo | Técnico de Campo | Acceso exclusivo a "Mis Órdenes del Día". Inicia traslados, marca llegada en sitio, checklist de tareas, fotos y firma de cliente. |
| **`CrmAdmin`** | CRM y Clientes | Administrador CRM | Control total de la cartera de clientes, contactos, condiciones comerciales y segmentación. |
| **`CrmOperador`** | CRM y Clientes | Operador CRM | Registro y consulta operativa de clientes y contactos. |

---

## 2. Modelo Multi-Rol

Un usuario real en la organización puede cumplir más de una función (por ejemplo, una persona de **Gerencia** que también administra RRHH o Ventas).

* **En Base de Datos:** Relación muchos-a-muchos nativa de ASP.NET Core Identity (`AspNetUserRoles`).
* **En Tokens JWT:** Cada rol asignado al usuario se emite como un claim `ClaimTypes.Role` independiente en el token JWT.
* **En el Backend:** La interfaz `ICurrentUser` expone:
  ```csharp
  IReadOnlyList<string> Roles { get; }
  bool IsInRole(string role);
  bool HasAnyRole(params string[] roles);
  ```

### Ejemplo de Usuario con Múltiples Roles
Un usuario con roles `["Gerencia", "RrhhAdmin"]`:
- Puede acceder al módulo de Recursos Humanos con permisos totales confidenciales.
- Si en el futuro se le agrega `VentasAdmin`, podrá gestionar ventas sin perder su acceso a RRHH.

---

## 3. Matriz de Autorización en Recursos Humanos (Empleados)

| Acción / Endpoint | `SuperAdmin` | `Gerencia` | `RrhhAdmin` | `RrhhAsistente` |
|---|:---:|:---:|:---:|:---:|
| **Acceso al Módulo RRHH** | ✅ | ✅ | ✅ | ✅ |
| **Ver lista de colaboradores** | ✅ | ✅ | ✅ | ✅ |
| **Ver detalle del colaborador** | ✅ | ✅ | ✅ | ✅ |
| **Visibilidad de Salarios y Bancos** | ✅ | ✅ | ✅ | ❌ *(Retorna `null`)* |
| **Registrar Colaborador** | ✅ | ✅ | ✅ | ✅ *(Sin datos de salario/banco)* |
| **Actualizar Datos de Contacto/Laborales** | ✅ | ✅ | ✅ | ✅ |
| **Modificar Salario o Cuentas Bancarias** | ✅ | ✅ | ✅ | ❌ *(Ignorado/Protegido)* |
| **Eliminar o Cesar Colaborador** | ✅ | ✅ | ✅ | ❌ *(Prohibido)* |

---

## 4. Endpoints de Gestión de Roles en Seguridad

* `GET /api/seguridad/roles` -> Retorna la lista de roles del sistema estructurados por módulo para construir interfaces tipo Odoo con selects de permisos:
  ```json
  [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "codigo": "RrhhAdmin",
      "modulo": "Recursos Humanos",
      "nombreVisible": "Administrador",
      "descripcion": "Control total sobre el personal: altas, ceses, contratos, salarios y cuentas bancarias."
    },
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "codigo": "RrhhAsistente",
      "modulo": "Recursos Humanos",
      "nombreVisible": "Asistente",
      "descripcion": "Gestión operativa de colaboradores y contacto. Sin acceso a salarios ni cuentas bancarias."
    },
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "codigo": "Gerencia",
      "modulo": "Sistema",
      "nombreVisible": "Gerencia General",
      "descripcion": "Dirección y jefatura general. Visualización de métricas e información financiera y confidencial."
    },
    {
      "id": "44444444-4444-4444-4444-444444444444",
      "codigo": "SuperAdmin",
      "modulo": "Sistema",
      "nombreVisible": "Super Administrador",
      "descripcion": "Desarrollador y administrador técnico global con control total sobre todos los módulos del sistema."
    }
  ]
  ```
* `GET /api/seguridad/usuarios/{id}/roles` -> Obtiene los roles asignados a un usuario.
* `PUT /api/seguridad/usuarios/{id}/roles` -> Asigna/reemplaza la lista de roles de un usuario (Multi-Rol).
