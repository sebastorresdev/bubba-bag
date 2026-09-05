# Regla de Seguridad: Roles del Sistema y Multi-Rol

1. **Roles Fijos**:
   - `Roles.SuperAdmin`: Control total del sistema y desarrollo.
   - `Roles.Gerencia`: Nivel directivo / jefatura con acceso a información confidencial.
   - `Roles.RrhhAdmin`: Administrador total de Recursos Humanos (salarios, ceses, contratos).
   - `Roles.RrhhAsistente`: Operador de Recursos Humanos (gestión de personas, pero SIN acceso a datos de salarios ni cuentas bancarias).

2. **Convención**:
   - Usar siempre las constantes de `BubbaBag.SharedKernel.Authorization.Roles` en lugar de cadenas mágicas.
   - Grupos de conveniencia: `Roles.AccesoRrhhConfidencial` y `Roles.AccesoRrhhModulo`.

3. **Multi-Rol**:
   - Los usuarios pueden tener múltiples roles. Usar `currentUser.HasAnyRole(...)` o `currentUser.IsInRole(...)`.
   - Al registrar o asignar roles a un usuario, soportar colecciones de roles (`IEnumerable<string> roles`).

4. **Metadatos de Roles (Estilo Odoo)**:
   - La entidad `Rol` posee `Modulo`, `NombreVisible` y `Descripcion` para renderizar interfaces agrupadas por módulo con selectores de nivel.

5. **Confidencialidad en Recursos Humanos**:
   - Los queries (`ObtenerEmpleado`, `ObtenerEmpleados`) deben verificar `currentUser.HasAnyRole(Roles.AccesoRrhhConfidencial)`. Si no lo tiene (ej. `RrhhAsistente`), campos como `SalarioBase`, `MonedaSalario`, `CuentaBancaria`, etc., deben retornar `null`.
   - Las operaciones destructivas o de baja (eliminación, cese) solo están autorizadas para `Roles.AccesoRrhhConfidencial`.
