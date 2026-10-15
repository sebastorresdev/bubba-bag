# Correcciones y validación de concurrencia

Fecha: 14 de octubre de 2026.

Se corrigieron los tres grupos de problemas de la última revisión. Las pruebas PostgreSQL se ejecutaron sobre una instancia temporal independiente en 127.0.0.1:55439, con bases nuevas de nombre protegido. Cada ejecución eliminó su base al terminar. No se utilizaron datos ni credenciales de la base operativa.

## Importación de inventario inicial

- Ajustes e importaciones comparten la regla de cantidad: positiva, dentro del rango y con la precisión del producto; los equipos serializados requieren unidades enteras.
- Las series repetidas, demasiado largas o existentes se rechazan. La condición física y el estado de cada serie coinciden con su ubicación y con el saldo.
- La fila se valida antes de crear ubicación, saldo, serie o movimiento. Una fila inválida no deja una ubicación nueva.
- Cada envío lleva un identificador de operación persistido por el navegador antes de enviarlo. El mismo archivo y configuración recuperan el mismo identificador entre reintentos, recargas y pestañas.
- El servidor comprueba responsable e identidad del contenido. Reutilizar el identificador con otro archivo o configuración devuelve un conflicto.
- Un reintento confirmado devuelve el resultado anterior y no vuelve a modificar existencias.
- Inventario, series, Kardex y resultado de la importación participan en la misma transacción PostgreSQL, aunque pertenecen a contextos distintos.
- Las cargas iniciales se serializan mediante un bloqueo de base de datos, válido también entre instancias de la API.
- Eliminar un resultado del historial lo oculta, conservando su control de operación para que un reintento tardío no duplique stock.
- Cerrar expresamente un resultado confirmado permite comenzar una nueva carga intencional del mismo archivo. La pantalla advierte que volverá a sumar existencias y que, ante errores parciales, el nuevo archivo debe contener sólo las filas fallidas.
- Si se pierde la respuesta o falla la conexión, el identificador pendiente se conserva.

**Ejemplo:** ocho solicitudes simultáneas con el mismo identificador para cargar dos unidades producen un único resultado y un saldo de dos, no dieciséis. Cargas distintas intencionales sí suman sus cantidades.

## Órdenes, cierre y observaciones

- El cambio de estado utiliza métodos del dominio y valida la transición actual. Las órdenes canceladas, finalizadas, rechazadas o liquidadas no se reabren por este flujo.
- Iniciar atención requiere una visita programada y también actualiza el estado de la visita.
- Completar verifica trabajos terminados, evidencias y firma cuando el tipo las exige, y confirmación de materiales cuando es obligatoria.
- Cancelar deja coherentes la orden, la visita y los trabajos y tareas pendientes; conserva las tareas ya ejecutadas.
- Las observaciones generales se almacenan en la orden, separadas del reporte de la visita. Se valida su longitud; un campo omitido conserva el valor y un texto vacío permite limpiarlo.
- La migración conserva lo que antes mostraba la ficha copiando el reporte de la visita más reciente, sin eliminar el reporte original.

**Ejemplo:** guardar una nota y volver a consultar devuelve el texto guardado. Una orden con trabajo completado y materiales pendientes no puede pasar a Finalizada.

## Operaciones simultáneas

- Las modificaciones de una misma orden se ejecutan bajo un bloqueo transaccional PostgreSQL. Esto incluye su programación, estado, trabajos y tareas.
- La orden usa una versión PostgreSQL. Editar mediante PUT requiere If-Match; omitirlo devuelve HTTP 428. Una versión antigua devuelve HTTP 409 antes de modificar.
- El cliente conserva la versión leída y recibe por ETag exactamente la versión de su propio guardado. No adopta silenciosamente la versión de otro editor.
- Los cambios de trabajos y tareas también renuevan la versión de la orden.
- Se mantienen los controles de concurrencia e índices únicos de existencias y series; los ajustes simultáneos fallidos se revierten y requieren revisar el inventario antes de reintentar.
- La creación inicial de esquemas y secuencias también se bloquea: varias solicitudes de códigos simultáneas no chocan al crear una secuencia nueva.
- Los bloques de limpieza y reversión no dependen de que el usuario mantenga abierta la conexión.

**Ejemplo:** dos personas abren la misma versión y guardan notas diferentes. Una guarda; la otra recibe un conflicto y debe recargar. Ninguna nota se sobrescribe silenciosamente.

## Pruebas ejecutadas

- 31 comprobaciones reales PostgreSQL, con HTTP, autenticación y migraciones.
- 322 comprobaciones HTTP/JWT anteriores sobre bases efímeras.
- 32 pruebas del cliente, incluidas pestañas simultáneas, reintentos, cambio de usuario/archivo/mapeo, identificador dañado y versiones de guardado.
- Flujos de compras, transferencias, custodia y ajustes: 38 comprobaciones de compras, las comprobaciones de inventario y 14 de ajustes.
- TypeScript y compilación de producción de la interfaz correctos.

Los casos PostgreSQL comprueban envíos simultáneos del mismo lote, cargas distintas que comparten stock, series repetidas entre solicitudes, aprobación repetida del mismo ajuste, ajustes distintos sobre la misma serie, incrementos concurrentes, edición con versión antigua, cancelación y ejecución simultáneas, cierre sin materiales/evidencias, bloqueo de órdenes liquidadas y códigos secuenciales únicos.

Se provocó además un fallo SQL en un lote con varias filas. No persistieron ni los incrementos de inventario ni el registro de importación: la reversión entre módulos quedó comprobada.

Estas pruebas verifican las carreras descritas; no constituyen una prueba de carga para cualquier volumen de usuarios o archivos.

## Puesta en marcha

Hay tres migraciones nuevas: versión de órdenes, observaciones persistentes y protección de reintentos/historial. Se aplicaron y verificaron en las bases temporales. El inicio normal de la API las aplica en el despliegue.

La versión de cliente actualizada debe desplegarse junto con la API: la edición de órdenes usa If-Match y la importación inicial exige identificador de operación. Los clientes externos deben adoptar esos contratos.

Para repetir la validación, ejecutar tests/Configuracion.Workflow con CONCURRENCIA_TEST_CONNECTION apuntando a una base NUEVA con formato bubbabag_concurrencia_test_ seguido de 32 caracteres hexadecimales, únicamente en la instancia temporal 127.0.0.1:55439. El programa rechaza otros destinos, crea la base y la elimina al terminar. Para las pruebas anteriores, ejecutar sin esa variable.

Con estas correcciones se puede continuar con las funcionalidades pendientes: ejecución del técnico, liquidación completa, carga de evidencias y adaptación móvil/PWA. Esas funcionalidades no se consideran implementadas por esta corrección.