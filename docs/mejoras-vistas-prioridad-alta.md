# Mejoras de prioridad alta en las vistas

Fecha: 14 de octubre de 2026.

## 1. Protección de cambios sin guardar

Implementada en las 21 fichas de clientes, órdenes, configuración de servicios, tipos de orden, usuarios, roles, empresa, organización e inventario, incluyendo compras, recepción, transferencias, despacho y devolución.

- Cada ficha compara sus datos editables con su punto de carga o último guardado confirmado. Cambiar pestañas, buscar o seleccionar filas para consultar no cuenta como edición.
- Volver, navegar a otra sección y Atrás del navegador solicitan confirmación cuando hay cambios. Cancelar conserva el borrador.
- Cerrar sesión solicita confirmación si existe un borrador pendiente. Al cerrar o recargar la pestaña se utiliza la advertencia nativa del navegador.
- Nuevo, Deshacer y Actualizar que reinician una ficha preguntan antes de modificar sus datos. Una ficha nueva confirmada no hereda una advertencia del registro anterior.
- Guardar y cerrar no pide descartar después de una respuesta correcta del servidor. Un fallo de guardado mantiene el borrador pendiente.
- El seguimiento conserva como pendientes los cambios posteriores al inicio de un envío; las fichas con contenido compartido bloquean sus controles mientras se confirma el guardado.
- La confirmación de eliminación de un registro no deja otra advertencia de cambios sobre el registro ya eliminado.

Se utiliza un único bloqueo de navegación para la aplicación, con un registro compartido de borradores. Se mantiene la configuración de rutas y permisos existentes; el navegador de rutas se cambió a createBrowserRouter para utilizar el bloqueo oficial. Los errores de presentación tienen una pantalla breve de recuperación en español.

Ejemplo: editar el teléfono de un cliente y pulsar Volver muestra Cambios sin guardar. Volver en ese diálogo mantiene el teléfono introducido. Salir sin guardar permite regresar al listado. Si falla Guardar, la advertencia sigue activa.

El seguimiento vive en memoria y no almacena contraseñas ni formularios en el almacenamiento del navegador. No es un sistema de recuperación de borradores después de un cierre forzado, fallo del equipo o vencimiento de sesión.

## 2. Tablas propias adaptadas a celular

Convertidas las cinco tablas propias de las tres vistas pendientes:

| Vista | Tablas y comportamiento |
|---|---|
| Lista de precios | Precios en tarjetas, con producto, unidad, método, monto y acciones. Abrir registro permite editar el precio. |
| Recepción de compra | Series y materiales por cantidad en tarjetas; se puede recibir/desmarcar una serie y editar la cantidad recibida. |
| Detalle de importación | Errores y productos completados en tarjetas; se mantiene la búsqueda y se puede leer el motivo del rechazo. |

La presentación reutiliza las columnas, controles y acciones del escritorio. Los controles editables reciben etiquetas accesibles desde el encabezado de su campo. Las tablas vacías conservan su estado sin registros. También se corrigió la distribución móvil de buscadores y acciones para evitar superposiciones.

Ejemplo: una recepción a 320 px muestra la serie con su botón Recibir y el material con el campo Cantidad recibida. Se conservan los datos y reglas utilizados por la tabla de escritorio.

## 3. Foco en el primer campo incorrecto

- Las validaciones de guardado de las fichas usan un asistente común para esperar a que se muestre el error, enfocar el control y desplazarlo dentro de la vista.
- Las fichas que necesitan volver a su pestaña general lo hacen antes de enfocar. Clientes identifica documento, nombres, razón social, teléfono, dirección y ubigeo; órdenes identifica lista de precios, tipo y clientes; seguridad identifica nombre, correo o contraseña.
- Las fichas con errores por campo reutilizan la asociación de Fluent UI. Cuando el error corresponde a la operación completa y no a un control concreto, se enfoca el mensaje visible.
- Una solicitud nueva cancela el foco pendiente anterior; desmontar la ficha cancela el movimiento pendiente.

Ejemplo: intentar guardar un cliente sin nombres desde Configuración Comercial vuelve a Resumen y enfoca Nombres. No obliga a buscar manualmente el campo.

## Problemas adicionales corregidos durante la comprobación

- Una lista de precios nueva podía anunciar éxito aunque alguno de sus precios hubiera fallado. Ahora conserva la lista creada y los precios confirmados para reintentar los pendientes dentro de la ficha abierta. Editar o retirar un precio ya confirmado actualiza o elimina el mismo registro, sin repetirlo.
- La cabecera de clientes se actualizaba antes de recibir la confirmación de guardado. Ahora actualiza su identidad después de la respuesta correcta.
- Una cabecera con un estado ya representado por un Badge podía mostrar [object Object]. Ahora conserva el componente recibido y sólo convierte los valores primitivos en una insignia de estado.

## Validación

- 40 pruebas del cliente aprobadas, incluidas selección de series por contenido, varios borradores y reintentos de guardado parcial de precios.
- TypeScript y construcción de producción Vite aprobados.
- 25 comprobaciones de navegador aprobadas: navegación limpia, cancelación, salida confirmada, Atrás, aviso de cierre/recarga, cambios durante un envío, fallo de guardado, guardar y cerrar, foco y pestaña del cliente, Nuevo/Deshacer y navegación/cierre de sesión en la aplicación completa.
- Las tres vistas reales se comprobaron a 1440, 390 y 320 px, incluyendo apertura de precios, recepción de series, cantidades y errores de importación, sin errores de presentación.
- Evidencias locales: .artifacts/high-browser-report.json, high-reset-report.json, high-app-report.json y capturas high-prices-*, high-receipt-* y high-import-*.

Las comprobaciones de navegador utilizan respuestas de prueba; no escriben datos reales en el servidor. No equivalen a una prueba física en Android/iPhone ni a validar nuevamente todas las operaciones de negocio.
