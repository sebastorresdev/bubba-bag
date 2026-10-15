# Estándar de tablas, fichas y mensajes del cliente React

Actualizado: 14 de octubre de 2026. Cliente: skvia-client, React y Fluent UI v9.

## Componentes comunes

| Necesidad | Componente | Comportamiento |
|---|---|---|
| Listado principal | D365EntityTable | Tabla en escritorio; tarjetas bajo 768 px. Conserva columnas visibles, filtros, orden y selección. |
| Lista dentro de una ficha | D365SubGrid | Tabla en escritorio y tarjetas móviles; abrir y agregar conservan sus permisos. |
| Tabla propia con celdas editables | D365ResponsiveDataGrid | Conserva la cuadrícula y sus celdas en escritorio, reutilizando las columnas en tarjetas móviles. |
| Acciones de página | D365CommandBar y D365CommandButton | Flecha de regreso y acción principal visibles. Acciones secundarias en Más en celular. busy deshabilita los comandos compartidos. |
| Identidad del registro | D365EntityHeader | Título del registro guardado, metadatos y estado; cabecera adaptable. |
| Campo | D365FormField | Etiqueta horizontal de 180 px en escritorio y superior en celular; error junto al control. |
| Sección | D365Card o useD365FormStyles.card | Mismos colores, separación y relleno; el contenido crece sin comprimir campos. |
| Estado | D365StatusBadge | Color semántico y texto legible en español. No traducir ni alterar los valores enviados al servidor. |
| Error, aviso o resultado | D365MessageBar | Error anunciado como alerta; resultados y avisos como estado. Puede cerrarse sin perder el formulario. |
| Confirmación | confirmAction y D365FeedbackHost | Promesa booleana; título, consecuencia y verbo concreto. Volver y Escape cancelan; foco inicial seguro. |
| Comprobante de movimiento | D365OperacionExitosaDialog | Resultado registrado y acciones de documento. Se reserva para movimientos con comprobante. |

Ubicación de componentes: skvia-client/src/components/common. Estilos: skvia-client/src/styles. Confirmaciones: skvia-client/src/services/uiFeedback.ts. El anfitrión se monta una sola vez en App dentro de ThemeProvider.

## Listados

- Usar D365EntityTable para entidades principales y una identificación tableId estable por listado.
- Definir columnas con createTableColumn. La tarjeta reutiliza renderHeaderCell y renderCell; no crear otro conjunto de datos para celular.
- La búsqueda de texto y las vistas de negocio siguen a cargo de la página. D365TableToolbarTools abre filtros, columnas y buscador con nombre accesible.
- Mantener selectedItems y onSelectionChange controlados cuando las acciones dependen de la selección. Los permisos siguen a cargo de la página y del servidor.
- Las tarjetas muestran las columnas configuradas, selección y Abrir registro cuando existe onRowDoubleClick. El orden puede cambiarse en celular. Las filas de escritorio también se pueden abrir con Enter.
- La selección de todos en móvil se limita a los registros filtrados. Cambiar de presentación no altera la selección controlada.
- Para columnas extensas o tablas de detalle que aún usan Table directamente, conservar desplazamiento horizontal dentro de su contenedor; nunca desbordar la página ni recortar acciones.
- No atribuir paginación al componente: actualmente procesa los items entregados por la página.

## Fichas y tamaños

- Conservar las convenciones de docs/convenciones-interfaz.md: la cabecera refleja datos persistidos, no cambios sin guardar.
- Botón de regreso con flecha, title y aria-label, sin etiqueta visible.
- Escritorio: relleno de tarjeta 20 px por 24 px y separación de secciones 20 px. Celular: relleno 16 px y campos en una columna.
- Los controles táctiles de botones y entrada tienen mínimo 44 px en celular. No quitar el foco visible del navegador o de Fluent UI.
- Diálogos y paneles caben en el ancho disponible y permiten desplazamiento vertical. Las pestañas pueden desplazarse horizontalmente.
- Evitar minWidth fijos en superficies de diálogo y flexShrink en tarjetas que compriman campos.
- Usar tokens de Fluent UI y semanticTokens para colores y jerarquía. Los colores configurables de tipos de orden, recursos y marcas son datos y se conservan.
- Las fichas registran sólo sus datos editables con useUnsavedChanges. Capturar el borrador antes del envío y marcarlo guardado únicamente después de confirmación del servidor. No desactivar la protección cuando falle una operación.
- Nuevo, Deshacer o Actualizar que reinicien datos deben utilizar discardAndRun antes de modificar el formulario. D365FormContent deshabilita los controles durante el guardado, conservando los estilos de contenido.
- Las validaciones de guardado utilizan useValidationFocus después de mostrar el error y activar su pestaña, pasando un identificador o etiqueta cuando no haya error asociado al campo.

## Mensajes y operaciones

- Campo incorrecto: error concreto junto al control y asociación accesible con Field.
- Error de operación: mensaje visible sin borrar los datos introducidos; showError sólo cuando no hay un mensaje local apropiado.
- Guardado común: aviso breve o toast Fluent UI, sin obligar a cerrar un modal.
- Eliminar, anular o cancelar: confirmación antes de enviar al servidor. Pasar opciones title, action y danger cuando el texto no permite deducir la acción correctamente.
- Recepción parcial: explicar cantidades recibidas y pendientes; no usar el color de eliminación.
- El usuario puede cancelar una confirmación con Volver, Escape o cierre permitido por Fluent UI. Una solicitud repetida no reemplaza la operación pendiente.
- Al cerrar, el foco vuelve al botón que abrió la confirmación; si vino de un menú, vuelve a su botón de apertura. Cambiar de ruta cancela las solicitudes pendientes.
- El estado busy debe durar hasta que la operación termine; el servidor mantiene sus validaciones de concurrencia.
- Comprobantes: diálogo de resultado después de confirmación del servidor. Descargar, imprimir y compartir siguen disponibles según el flujo existente.

## Texto y accesibilidad

- Español, frases breves y nombres coherentes. Sin emojis decorativos ni nombres de estados internos en inglés.
- Campos vacíos sin ejemplos; buscadores con Buscar. Mantener las instrucciones de formato o consecuencias realmente necesarias.
- Estados con texto además del color; contraste mediante tokens del tema claro y oscuro.
- Etiquetas asociadas a los controles, nombres para botones con sólo icono y opciones accesibles de selección y orden.

## Comprobación antes de incorporar una vista

Compilar el cliente y verificar a 1440, 390 y 320 px: lectura, campos largos, errores, tarjetas, selección, menús, diálogos, tema oscuro y navegación por teclado. Las pruebas del servicio de confirmación comprueban aceptación, cancelación y solicitud repetida. La revisión de navegador debe incluir foco inicial, Escape y ausencia de solapamientos.
