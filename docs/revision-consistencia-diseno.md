# Revisión de consistencia del diseño

Fecha: 14 de octubre de 2026.

Revisión de componentes, estilos y vistas del cliente React. Las correcciones se implementaron sobre los componentes compartidos y se extendieron a las vistas existentes. La validación visual usa navegador Chromium con tamaños de escritorio y celular; aún corresponde comprobar Safari y dispositivos físicos cuando se disponga de ellos.

## Dirección recomendada

Mantener Fluent UI y el estilo empresarial actual. Consolidar una guía vigente y extender los componentes compartidos, aplicándolos gradualmente a las vistas existentes. La versión móvil debe conservar la identidad y las reglas de interacción, adaptando la distribución y la cantidad de información.

## Prioridades

| Prioridad | Mejora | Evidencia y efecto |
|---|---|---|
| Alta | Actualizar el estándar de diseño | entity-table-standard.md exige componentes Angular y NG-ZORRO que no corresponden al cliente actual. La guía debe señalar D365EntityTable y los componentes React reales, evitando patrones contradictorios en nuevas implementaciones. |
| Alta | Unificar acciones y confirmaciones | Hay window.confirm y alert en importaciones, órdenes, almacenes y catálogos, mientras otras vistas usan Dialog. Usar confirmaciones Fluent UI con título, consecuencia y acción concreta. |
| Alta | Preparar formularios y acciones para móvil | D365FormField fija etiquetas de 180 px; algunos diálogos tienen mínimos de 480 px y las tablas de 800 px. Conservar diseño horizontal en escritorio y pasar a etiqueta superior, ancho disponible y acciones agrupadas en celular. Un mínimo de tabla puede ser correcto en escritorio, pero necesita una presentación alternativa en móvil. |
| Media | Establecer jerarquía visual única | Unificar tamaño de títulos, separación entre secciones, relleno de tarjetas y densidad de campos mediante estilos compartidos. Evitar ajustes distintos por cada pantalla. |
| Media | Centralizar estados y colores | semanticTokens y D365StatusBadge ya existen. Usarlos en todas las vistas y retirar colores visuales manuales cuando correspondan a estados o acciones. Los colores configurables de tipos de orden y recursos son datos del negocio y deben conservarse. |
| Media | Unificar mensajes y resultados | Diferenciar error de campo, error de operación, guardado ordinario y confirmación de una operación relevante. Evitar que cada pantalla elija indistintamente alert, toast o diálogo de éxito. |
| Media | Limpiar vocabulario y ayudas | Hay estados con Scheduled/Unscheduled, texto trabajo/trabajo, emojis decorativos y placeholders explicativos. Aplicar las convenciones existentes: español, etiquetas breves, campos vacíos sin ejemplos y ayudas sólo cuando aportan una condición concreta. |
| Media | Mejorar interacción accesible | Revisar navegación por teclado, foco en errores y diálogos, contraste, campos deshabilitados y zonas táctiles. No quitar indicadores de foco ni depender únicamente del color para representar un estado. |

## Patrones concretos

- Listado: misma barra de acciones, buscador, filtros, selector de vista, selección y estado vacío.
- Ficha: flecha de regreso, identidad del registro guardado, estado y acciones principales en posiciones estables.
- Guardar: confirmación breve sin bloquear la tarea; errores junto al campo cuando sea posible.
- Eliminar o cancelar: diálogo con consecuencia y verbo específico, por ejemplo Eliminar borrador o Cancelar orden.
- Operación pendiente: mostrar progreso y deshabilitar el envío repetido; no presentar el borrador como dato guardado.
- Celular: tarjetas para listas de trabajo, campos en una columna y una acción principal visible. Las acciones secundarias se agrupan.

Ejemplo: la misma orden utiliza una ficha amplia en escritorio y tarjetas de trabajos en celular. Mantiene textos, estados y permisos; cambia la distribución.

## Orden de implementación

1. Actualizar la guía y acordar los patrones comunes.
2. Ajustar campos, cabecera, barra de acciones, mensajes y confirmaciones compartidas.
3. Aplicar el patrón a una ficha y un listado de órdenes como referencia.
4. Revisar esa referencia en escritorio y pantallas pequeñas, incluyendo teclado y errores.
5. Extender el patrón a clientes, inventario, seguridad y demás vistas.
6. Construir atención del técnico y liquidación utilizando estos mismos patrones.

No se propone cambiar la biblioteca ni rehacer todas las vistas de una vez. La prioridad es evitar nuevas diferencias y corregir primero los componentes que afectan varias pantallas.

## Correcciones implementadas

- Guía institucional reescrita para React y Fluent UI, con referencias a componentes y capacidades reales.
- Confirmaciones del navegador sustituidas en almacenes, catálogos, órdenes, importaciones y recepciones por un diálogo común. Los errores que usaban alert ahora son mensajes Fluent UI que se pueden cerrar.
- Campos con etiqueta superior en celular, errores legibles y asociación de InfoLabel con su control. Se corrigió además la compresión de tarjetas y campos que causaba solapamientos al crecer las listas.
- Cabeceras que admiten títulos largos y metadatos en varias líneas. Tarjetas con separación y relleno compartidos, diálogos y paneles limitados al ancho disponible y acciones de documento en filas adaptables.
- Listas de permisos y roles de seguridad, series en almacén y recepción de compra con distribución apilada en celular. Los controles de selección y recepción mantienen su comportamiento.
- Barra de comandos con una acción principal y menú Más en celular; comandos compartidos deshabilitados mientras busy está activo. No se cambiaron permisos ni el origen de los títulos guardados.
- D365EntityTable y D365SubGrid reutilizan sus columnas en tarjetas móviles. Conservan selección y apertura; la tabla principal mantiene filtros, columnas y orden. Las tarjetas incluyen una acción explícita Abrir registro.
- Estados internos conocidos presentados en español. Se retiraron etiquetas Scheduled/Unscheduled, trabajo/trabajo, ayudas redundantes, emojis decorativos y ejemplos en campos vacíos.
- Colores de acciones tomados del tema y mensajes de estado anunciados de manera accesible. Se conservaron los colores configurables de negocio.
- Navegación con Enter para abrir filas, controles táctiles de 44 px, foco inicial en Volver y cierre con Escape. Se corrigió la selección de filas en la subcuadrícula para que el checkbox no abra el registro.
- Al cerrar una confirmación, el foco vuelve al botón original o al menú Más. Cambiar de ruta cancela las confirmaciones pendientes para evitar ejecutar acciones de una pantalla que ya se abandonó.
- Diálogo de comprobante con título accesible, contenido desplazable y copia del número confirmada sólo después de que el portapapeles responde correctamente.

Ejemplo: una orden mantiene tabla y campos horizontales en escritorio. A 390 o 320 px muestra trabajos en tarjetas, etiquetas encima del control, Guardar visible y Eliminar dentro de Más. Al eliminar se abre una confirmación con la consecuencia; Escape cancela y evita el envío.

## Validación y alcance

- Pruebas del cliente: 35 aprobadas, incluidas aceptación, cancelación y rechazo de una segunda confirmación mientras otra está pendiente.
- Compilación TypeScript y construcción de producción Vite aprobadas. Los componentes nuevos y el servicio de confirmación pasan el analizador sin advertencias; el análisis ampliado de los componentes existentes conserva advertencias previas de efectos, referencias y recarga de desarrollo, sin errores.
- Comprobación de componentes reales en navegador a 1440, 390 y 320 px: campos sin solapamiento, selección y apertura de tarjetas, menús de comandos, foco seguro, Escape, diálogo de comprobante y temas claro y oscuro.
- Asignación de permisos comprobada a 320 px con el componente real: selección de todos los permisos visibles, aplicación de dos permisos y superficie de 286 px sin desbordamiento. Comprobado también el retorno del foco al cerrar una confirmación en escritorio y celular.
- Evidencias locales: .artifacts/design-form-*.png, design-list-*.png, design-confirm-*.png, design-success-*.png y design-browser-report.json. La página de comprobación está en skvia-client/.artifacts y no forma parte de la compilación de producción.
- La adaptación cubre los componentes compartidos y sus consumidores. Las tablas especiales de edición que usan Table directamente conservan su flujo y desplazamiento; no se convirtió cada matriz de edición en tarjetas.
- Continuación de prioridades altas: protección de borradores, foco de validación y adaptación de las cinco tablas propias de precios, recepción e importaciones implementadas. Detalle y evidencias en mejoras-vistas-prioridad-alta.md.
- No se probó cada operación de negocio contra el servidor ni equipos Android/iPhone físicos. Esta revisión no implementa todavía instalación PWA, trabajo sin conexión ni liquidación del técnico.
