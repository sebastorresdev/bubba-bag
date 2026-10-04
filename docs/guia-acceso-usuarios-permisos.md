# Acceso, usuarios y autorizaciones

Fecha: 3 de octubre de 2026.

## Qué se implementó

Login real en `/login`, cierre de sesión desde el perfil, protección de rutas y navegación según permisos. El cliente verifica la sesión en el servidor; no adopta una identidad de administrador por defecto ni inicia sesión con credenciales fijas. La expiración del token obliga a iniciar sesión nuevamente.

Usuarios del Sistema (`/configuracion/usuarios`) permite búsqueda, filtro de estado, creación, edición, asignación de múltiples roles, activación/desactivación, restablecimiento de contraseña e importación masiva. Roles (`/configuracion/roles`) muestra el catálogo y los permisos reales de cada rol. Los roles son definiciones fijas del sistema, no perfiles personalizados editables desde la pantalla.

Las pantallas reutilizan Fluent UI, D365CommandBar, D365EntityHeader, D365FormField, D365MessageBar, los estilos de formularios/listas y una tabla compartida D365EntityTable. La ficha completa sirve para datos, roles y almacenes; el drawer muestra permisos sin salir de la ficha; el diálogo se reserva para restablecer contraseña. La importación reutiliza ImportacionDrawer.

La cabecera de Usuarios conserva el nombre, correo e iniciales del registro guardado mientras se edita. Un alta muestra «Nuevo usuario» hasta guardar y obtener la ficha creada; una edición actualiza la cabecera al guardar y recargar los datos del servidor. El botón de regreso muestra sólo la flecha, con etiqueta accesible. Estas convenciones se documentan en [Convenciones de interfaz](convenciones-interfaz.md).

## Arranque sin datos de ejemplo

La clave JWT se configura fuera del repositorio. En desarrollo, la API carga .NET User Secrets del proyecto `src/Host/BubbaBag.Api`; en otros entornos, se puede usar `JwtSettings__Secret`. Debe tener al menos 32 bytes. El archivo `appsettings.json` no contiene una clave de respaldo. Cambiar la clave requiere reiniciar la API y volver a iniciar sesión.

La conexión de PostgreSQL con credenciales tampoco se versiona. Al ejecutar la API directamente, se configura `ConnectionStrings:sqldb` en User Secrets o `ConnectionStrings__sqldb` como variable de entorno. Aspire proporciona la conexión de su base administrada al iniciar el proyecto completo.

El servidor aplica cambios de esquema y asegura las definiciones técnicas de roles. No crea cuentas, empleados, clientes, productos, sedes, recursos, stock, precios ni unidades de medida de ejemplo. Los datos preexistentes se conservan; no se borran ni se renombra un administrador al iniciar.

La ubicación Principal de un almacén forma parte de su estructura de inventario. La migración conserva ese requisito para almacenes existentes; no representa material ni stock de prueba.

No se aplicaron migraciones ni se cargaron datos sobre la base habitual durante este trabajo. Para usar las pantallas nuevas se deben reiniciar API y cliente con el código actualizado. La migración de inventario sigue requiriendo respaldo y revisión de inconsistencias indicadas en la guía logística.

## Secuencia para cargar tus datos

1. Abrir `/login`. Si no hay usuarios, completar manualmente **Configurar primer administrador** con tus datos y contraseña. Si ya hay cuentas, entrar con una cuenta existente; el sistema no crea otra automáticamente.
2. Ir a **Centro de administración → Seguridad → Usuarios del Sistema** y crear las cuentas que usarás. Los datos generales y los roles se guardan juntos.
3. En **Roles y permisos**, asignar las capacidades. Puedes combinar roles de módulos diferentes. **Ver permisos resultantes** abre el drawer.
4. Con una cuenta administrativa, crear tus unidades organizativas, recursos, bodegas y custodias personales. En la ficha de un recurso, seleccionar **Usuario de acceso vinculado** cuando corresponda. El vínculo no concede permisos de almacenero.
5. Regresar a la ficha del usuario → **Autorizaciones por almacén**. Marcar las facultades y **Autorización activa** para cada almacén; guardar cada fila modificada. También es posible hacerlo desde **Almacenes y Ubicaciones → ficha → Ubicaciones y permisos**.
6. Cerrar sesión desde el perfil y entrar como almacenero. Probar el acceso y los movimientos sobre los almacenes que acabas de autorizar. SuperAdmin tiene acceso global: no sirve para comprobar restricciones territoriales.

## Roles y alcance por almacén

| Configuración | Capacidad |
|---|---|
| SuperAdmin | Administración global y excepción de acceso global a inventario |
| InventarioAdmin | Catálogos y asignación de autorizaciones; los movimientos requieren autorización por almacén |
| InventarioAlmacenero | Consulta y operaciones de inventario dentro de sus almacenes autorizados; no modifica catálogos ni administra cuentas |
| Gerencia | Consulta de usuarios y roles; sus otros permisos se conservan en el catálogo existente |
| ServicioCampoTecnico | Capacidades de Servicio de Campo; ser custodio de material no le da permiso para despachar |
| Consulta por almacén | Acceso al inventario de ese almacén |
| Despacho por almacén | Registrar salidas desde ese almacén |
| Recepción por almacén | Confirmar entradas al almacén |
| Supervisión por almacén | Resolver diferencias según las reglas del traslado y administrar sus ubicaciones |

La administración de autorizaciones por almacén corresponde a SuperAdmin, InventarioAdmin o ServicioCampoAdmin. Un supervisor local no puede delegar acceso ni elevarse permisos. Los permisos operativos requieren consulta y una autorización activa. Cada fila se guarda de forma independiente; las filas pendientes no se consideran aplicadas.

Para Trujillo: autoriza al almacenero en su bodega y en las custodias personales que deba abastecer y desabastecer. Para Chiclayo: configura sus propios almacenes. La regla que impide abastecer directamente una custodia de otra unidad sigue vigente. El material intersede debe pasar por una transferencia de bodega a bodega y su recepción.

## Carga masiva de usuarios

Desde Usuarios → **Importar usuarios**, usar el asistente existente con CSV o Excel, vista previa, mapeo y resultado por fila. Campos:

| Campo | Regla |
|---|---|
| Email | Correo único y obligatorio |
| NombreCompleto | Nombre obligatorio |
| Roles | Opcional; códigos separados por `;`, por ejemplo el código `InventarioAlmacenero` |

Los códigos se consultan en Roles → **Código para importación**. No se admiten roles inventados.

Las cuentas nuevas importadas quedan **inactivas y sin contraseña**. Abrir cada ficha, restablecer su contraseña y activar la cuenta. No incluir contraseñas en los archivos. Las opciones de duplicados permiten error, omitir o actualizar; una actualización conserva contraseña y estado, y aplica los datos/roles mapeados. Si dejas Roles vacío en modo actualización, se retirarán los roles salvo que eso elimine al último administrador activo.

La carga masiva existente de productos, categorías, unidades de medida y clientes se conserva y ahora comprueba permisos por entidad. La importación de sedes, recursos y almacenes todavía no dispone de proveedor; sus formularios permiten la carga manual. La carga de stock debe efectuarse mediante documentos y recepción para conservar trazabilidad.

## Pruebas de acceso

| Caso | Resultado esperado |
|---|---|
| Abrir una ruta interna sin sesión | Redirección a login |
| Login con cuenta inactiva | Acceso rechazado |
| Cinco contraseñas incorrectas consecutivas | Bloqueo temporal por 15 minutos |
| Almacenero intenta administrar cuentas o modificar productos | Rechazo por política del servidor |
| Usuario sin roles | No obtiene capacidades ni navegación operativa |
| Cambiar roles, datos, contraseña o estado de una cuenta | Sus tokens anteriores quedan inválidos; debe entrar nuevamente |
| Quitar el rol o desactivar al último administrador activo | Operación rechazada |
| Dos solicitudes simultáneas de primer administrador | Sólo una completa la configuración inicial |
| Importar fila con rol inválido | Error por fila, sin cuenta parcialmente creada |

La protección del último administrador y la configuración inicial se serializan mediante bloqueo de transacción PostgreSQL. Registro y edición de usuario/roles son atómicos. La contraseña usa ASP.NET Identity; el JWT incorpora la versión de seguridad de la cuenta y se valida contra la cuenta activa en cada solicitud.

## Verificación realizada

Build de API y cliente, TypeScript y pruebas HTTP de seguridad sobre PostgreSQL aislado. Se comprobaron login, políticas, configuración simultánea, último administrador, cambios de roles/estado/contraseña, carga masiva y bloqueo por intentos. Las pruebas existentes de compras e inventario siguen pasando. En navegador se revisaron login, listado, ficha, roles agrupados, drawer de permisos, cierre de sesión y redirección de una ruta protegida. No se ejecutó una prueba integral de todos los módulos usando datos reales.

La suite está en `tests/Seguridad.Workflow`. Requiere `SEGURIDAD_TEST_CONNECTION` hacia una base vacía cuyo nombre empiece con `seguridad_test_`; no usa la conexión de la aplicación. Sus cuentas sintéticas sólo existen en esa base descartable.

La suite utiliza `NpgsqlRetryingExecutionStrategy`, como el servidor configurado con Aspire. Las escrituras de Seguridad ejecutan el bloqueo, la operación y la confirmación dentro de `CreateExecutionStrategy().ExecuteAsync`; cada intento recarga las entidades de Identity. Las 36 comprobaciones incluyen un fallo transitorio después de insertar un usuario: la transacción se revierte, se reintenta y conserva una sola cuenta con su rol.

Los ajustes generales y la liquidación de material por trabajo de campo siguen pendientes o diferidos según lo acordado; este cambio cubre el acceso y la administración de cuentas.
