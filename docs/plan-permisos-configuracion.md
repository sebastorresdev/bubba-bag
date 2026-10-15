# Permisos de empresa y sucursales

Estado: implementado el 14 de octubre de 2026. Los permisos aparecen en el catálogo al crear y revisar roles.

## Distribución aplicada

| Operación | Roles predefinidos autorizados |
| --- | --- |
| Modificar razón social, nombre comercial, RUC y dirección fiscal | SuperAdmin y Gerencia |
| Modificar logo, teléfono, correo y pie de documentos | SuperAdmin y Gerencia |
| Crear y editar sucursales, sedes y bases | SuperAdmin, Gerencia y RrhhAdmin |
| Marcar o desmarcar la sede principal | SuperAdmin y Gerencia |
| Activar o desactivar sucursales, sedes y bases | SuperAdmin y Gerencia |
| Consultar empresa, sucursales y sedes | Todos los usuarios autenticados |

Los roles personalizados pueden recibir estos permisos desde la matriz. Consultar usuarios y roles en Seguridad ya no concede autorización para modificar la empresa.

## Permisos disponibles

| Permiso | Código |
| --- | --- |
| Modificar datos fiscales de la empresa | `configuracion.empresa.datos_fiscales.gestionar` |
| Modificar logo y contacto de la empresa | `configuracion.empresa.presentacion.gestionar` |
| Crear y editar sucursales, sedes y bases | `configuracion.sucursales.gestionar` |
| Cambiar la sede principal | `configuracion.sucursales.sede_principal.gestionar` |
| Activar o desactivar sucursales, sedes y bases | `configuracion.sucursales.estado.gestionar` |

El permiso de sede principal se utiliza junto al de creación/edición. El permiso de estado permite activar/desactivar sin conceder edición de los otros campos.

## Empresa y documentos

La consulta de empresa sigue disponible con una sesión válida. Generar un cargo PDF conserva las autorizaciones de la transferencia y del almacén; no exige permiso para editar empresa.

- `GET /api/configuracion/empresa`: consulta, sin insertar configuración al leer.
- `PUT /api/configuracion/empresa`: modificación completa; exige ambos permisos de empresa.
- `PATCH /api/configuracion/empresa/datos-fiscales`: sólo datos fiscales.
- `PATCH /api/configuracion/empresa/presentacion`: sólo contacto, logo y pie de documentos.

Los formularios deshabilitan los campos no autorizados y envían únicamente el grupo permitido cuando un rol tiene acceso parcial. La API ignora campos del otro grupo en los endpoints parciales y rechaza el PUT completo si falta uno de los dos permisos.

## Sucursales y sedes operativas

La misma matriz protege `/api/configuracion/sucursales` y `/api/serviciocampo/unidades-organizativas`. Son registros de módulos distintos; la separación no los fusiona ni mueve datos existentes.

Crear/editar no autoriza cambios de estado ni de sede principal. En una actualización, omitir `esSedePrincipal` preserva su valor actual. Si un usuario sin el permiso de principal envía ese campo, se rechaza la solicitud; no se interpreta la omisión como desmarcar la sede.

La creación rápida desde almacenes usa las mismas restricciones. La importación de sedes verifica los permisos de gestión y de principal por fila, para evitar saltarse las restricciones usando un archivo. El acceso general a la importación masiva todavía está reservado a sus roles fijos anteriores; en los formularios no se ofrece importar a un usuario que no pueda acceder. La separación del acceso y el historial de importaciones se detalla en `revision-prioridades-altas.md`.

## Actualización de instalaciones existentes

Al iniciar la API, el catálogo actualiza los perfiles predefinidos con los permisos definidos por el sistema. No cambia los permisos elegidos en roles personalizados. Los usuarios de un perfil cuyo conjunto de permisos haya cambiado deberán volver a iniciar sesión; las siguientes inicializaciones no revocan sesiones si el perfil sigue igual.

## Validación

- 183 comprobaciones HTTP/JWT con datos efímeros en memoria: roles predefinidos, roles personalizados, edición parcial, 401/403, conservación de datos rechazados, sede principal, importación por fila y actualización del catálogo existente.
- Generación real de un PDF por un almacenero autorizado sin permiso de edición de empresa.
- 4 pruebas frontend de consulta y separación de payloads fiscales/presentación.
- API, TypeScript y compilación de frontend correctos. El análisis estático conserva advertencias previas de React.

Para repetir las pruebas: `dotnet run --project tests/Configuracion.Workflow/Configuracion.Workflow.csproj` y `npm test` desde `skvia-client`. La prueba HTTP utiliza únicamente EF InMemory; no se conecta a la base operativa.
