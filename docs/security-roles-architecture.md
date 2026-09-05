# Arquitectura de Seguridad: Roles Fijos y Modelo Multi-Rol

Este documento define la estructura de roles del sistema BubbaBag ERP, su jerarquía/escala de acceso y el soporte multi-rol para usuarios con responsabilidades transversales.

---

## 1. Los 4 Roles Fijos del Sistema

El sistema establece una escala corporativa realista con 4 roles fijos (definidos en [Roles.cs](file:///d:/PROYECTOS/bubba-bag/src/Shared/BubbaBag.SharedKernel/Authorization/Roles.cs)):

```csharp
namespace BubbaBag.SharedKernel.Authorization;

public static class Roles
{
    public const string SuperAdmin    = "SuperAdmin";
    public const string Gerencia      = "Gerencia";
    public const string RrhhAdmin     = "RrhhAdmin";
    public const string RrhhAsistente = "RrhhAsistente";
}
```

### Descripción y Alcance de Cada Rol

| Rol | Nivel | Responsabilidades y Alcance |
|---|---|---|
| **`SuperAdmin`** | Global / Técnico | Desarrollador y administrador global del sistema. Acceso irrestricto a todos los módulos, migraciones, auditoría y administración de usuarios y roles. |
| **`Gerencia`** | Directivo / Jefatura | Jefatura o gerencia general. Puede ver información sensible y confidencial (reportes financieros, métricas, salarios de empleados) de los módulos a los que tenga acceso sin ser superadmin técnico. |
| **`RrhhAdmin`** | Módulo RRHH (Nivel 1) | Administrador / Jefatura de Recursos Humanos. Acceso **total** sobre personal: altas, bajas/ceses, contratos, salarios, régimen pensionario y cuentas bancarias. |
| **`RrhhAsistente`** | Módulo RRHH (Nivel 2) | Asistente / Operador de Recursos Humanos. Gestión operativa: registro y consulta de colaboradores, datos de contacto y laborales, pero **SIN VISIBILIDAD NI CAPACIDAD DE EDICIÓN sobre salarios base, monedas ni cuentas bancarias**. Tampoco puede eliminar ni dar de baja colaboradores. |

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

* `GET /api/seguridad/roles` -> Lista todos los roles disponibles del sistema.
* `GET /api/seguridad/usuarios/{id}/roles` -> Obtiene los roles asignados a un usuario.
* `PUT /api/seguridad/usuarios/{id}/roles` -> Asigna/reemplaza la lista de roles de un usuario (Multi-Rol).
