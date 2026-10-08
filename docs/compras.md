# Compras

Inventario → Compra → Recepciones contiene el listado y la ficha de compras. El código interno correlativo `CMP-000001` se genera al primer Guardar mediante secuencia atómica y se conserva en las ediciones y cambios de estado; es independiente del comprobante.

## Flujo

- **Borrador:** permite guardar sin proveedor, almacén, comprobante ni productos, reabrir la ficha y continuar editando. No modifica inventario.
- **Solicitada:** Solicitar compra exige proveedor, almacén activo y al menos un producto válido. Conserva las cantidades y costos pedidos. Permite completar comprobante, fecha, observación y series. No modifica inventario.
- **Enviada:** Registrar envío exige una serie única por cada unidad serializada. Confirma el envío del proveedor sin modificar stock; conserva productos, cantidades, costos y series. La ficha queda de solo lectura, incluidos comprobante, fecha y observación. Guardar queda deshabilitado. Recepcionar abre un drawer dedicado: si falta comprobante se captura allí; un comprobante ya registrado se conserva. El comprobante y el stock se guardan juntos al confirmar la recepción.
- **Recibida:** Recepcionar solo se habilita después del envío y exige comprobante. Registra stock, series, movimientos y estado en una transacción. La compra recibida no admite edición ni una segunda recepción.

## Interfaz

El formulario utiliza DatePicker de Fluent UI. Productos muestra un DataGrid con comandos Agregar producto, Editar y Eliminar. La captura de cada línea se hace en un drawer con Combobox y autocompletado por nombre o código. El autocompletado consulta la base por nombre o código a partir de dos caracteres, espera 300 ms entre pulsaciones, cancela consultas anteriores y limita la respuesta a 20 productos activos inventariables. No se carga el catálogo completo al abrir la compra. No se crean productos desde la compra. Las series se completan después de solicitar la compra, mediante Registrar series, antes de Registrar envío. Las series se agregan una por fila en una tabla con eliminación y validación de duplicados. La columna Series muestra un icono y el contador pendiente/completo; su enlace abre la tabla guardada. Para productos no serializados muestra No aplica y no habilita Registrar series. La ficha muestra el recorrido Borrador → Solicitada → Enviada → Recibida; Guardar conserva el estado actual. El almacén usa el selector compartido y Nuevo para creación rápida sin abandonar la ficha.

El listado permite buscar código de compra, proveedor, almacén, comprobante y estado, y elegir vistas de borradores, solicitadas, enviadas y recibidas.

## API y almacenamiento

- `GET /api/inventario/compras`: listado.
- `GET /api/inventario/compras/{id}`: ficha y líneas.
- `POST /api/inventario/compras`: primer guardado del borrador.
- `PUT /api/inventario/compras/{id}`: actualización.
- `POST /api/inventario/compras/{id}/solicitar`: solicitud.
- `POST /api/inventario/compras/{id}/enviar`: confirmación de envío.
- `POST /api/inventario/compras/{id}/recepcionar`: recepción completa.

La tabla `inventario.Compras` se inicializa al arrancar la API siguiendo el mecanismo existente. Las líneas guardan una copia de nombre, unidad, cantidad, costo y series en `LineasJson`. Un índice único filtrado evita comprobantes duplicados por proveedor y tipo; permite varios borradores sin comprobante. Las filas de compra y stock usan `xmin` de PostgreSQL para detectar actualizaciones concurrentes.

El total suma importes de líneas redondeados a dos decimales. Este flujo no calcula IGV, pagos, asientos, conversiones monetarias ni costo maestro del producto. El proveedor sigue siendo un campo de texto. Las recepciones parciales y el catálogo de proveedores quedan fuera de esta implementación.

## Verificación

`dotnet run --project tests/Compras.Workflow` ejecuta 38 comprobaciones con EF InMemory: borrador parcial, código estable, solicitud y envío sin stock, series obligatorias para envío, bloqueo de la ficha enviada y comprobante en la recepción, edición restringida, recepción con productos normales y serializados, y bloqueo de doble recepción y edición posterior. No sustituye pruebas de transacciones, índices ni concurrencia de PostgreSQL.

Se verificaron compilación de TypeScript, build de Vite, compilación de la API y la interfaz local. No se introdujeron compras de prueba en la base del usuario.
