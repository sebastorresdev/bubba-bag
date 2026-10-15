# Última revisión antes de liquidación y PWA

Fecha: 14 de octubre de 2026.

## Resultado

Las correcciones anteriores siguen pasando sus pruebas. La revisión adicional encontró tres grupos de problemas que conviene corregir antes de avanzar con la liquidación. Los tres grupos ya están corregidos; sus casos anteriores se conservan abajo como antecedente. La validación actual está en correcciones-y-concurrencia.md. Los escenarios se reprodujeron mediante HTTP/JWT sobre EF InMemory aislado; no se utilizó la base operativa.

## 1. Alta: integridad de la importación de inventario inicial

La validación corregida de ajustes no se aplica al importador de inventario inicial.

Casos reproducidos:
- Cargar 1.5 unidades de un producto serializado con una sola serie resulta en una fila exitosa. El stock contiene 1.5 unidades, pero existe una sola serie y su movimiento es de una unidad.
- Cargar una serie con condición Defectuoso la deja con condición Utilizable y estado EnAlmacen. El stock sí utiliza la condición solicitada: serie y saldo discrepan.
- Enviar dos veces la misma carga de dos unidades no serializadas deja un saldo de cuatro. El flujo no distingue un reintento de una nueva carga intencional.

También se encontró que una ubicación nueva se incorpora al contexto antes de validar las series. Una fila inválida puede terminar creando una ubicación aunque no importe existencias.

Código: ServicioCampoImportProvider.cs, líneas 967, 977, 1005, 1034 y 1040; DataImportEngineService.ExecuteImportAsync.

Corrección recomendada:
1. Compartir las reglas de cantidades, precisión y series con los demás movimientos.
2. Aplicar a las series la ubicación, tipo de almacén y condición correctos.
3. Validar la fila completa antes de crear ubicación, saldo, serie o Kardex.
4. Incorporar identificador de operación persistido por el cliente para los reintentos. Una carga nueva intencional debe poder distinguirse del mismo envío repetido.
5. Verificar transacciones, índices y solicitudes simultáneas sobre PostgreSQL aislado.

## 2. Alta: transiciones y cierre de órdenes

El endpoint de cambio de estado escribe los estados mediante reflexión y no verifica una transición válida desde el estado actual.

Caso reproducido: la orden ALTA-OA estaba Cancelada. Un usuario con Programar órdenes, sin permiso de cierre, envió EnProgreso y recibió HTTP 200. La orden terminó EnProgreso.

La inspección adicional muestra que:
- Completar escribe Finalizada tras validar trabajos, sin usar la comprobación de evidencias y descarga de materiales que existe en el dominio.
- Cancelar mediante ese endpoint no llama a CancelarOrden, que cancela visitas, trabajos y tareas pendientes y registra el motivo.
- ValidarEditable no incluye Liquidada entre los estados cerrados.

Código: OrdenesTrabajoEndpoints.cs, líneas 544, 547 y 559; OrdenTrabajo.cs, líneas 167–170, CancelarOrden y VerificarPromocionAFinalizada.

Corrección recomendada:
1. Concentrar las transiciones en métodos del dominio.
2. Bloquear cambios de órdenes cerradas o liquidadas; si se necesita reapertura, definir permiso, motivo y auditoría específicos.
3. Separar terminar el trabajo técnico, confirmar evidencias, confirmar materiales y liquidar.
4. Cancelar coherentemente los registros relacionados.
5. Añadir pruebas de transiciones inválidas y cierre con evidencias o materiales pendientes.

Esto debe resolverse antes de conectar la liquidación: el aplicativo necesita estados confiables.

## 3. Alta funcional: observaciones que no se guardan

El formulario envía Observaciones al actualizar una orden, pero ActualizarOrdenTrabajo no las aplica. La respuesta indica éxito.

Caso reproducido: enviar OBSERVACION-REVISION-PERSISTIR devolvió HTTP 200. La consulta posterior de la orden no contiene el texto.

Código: OrdenesTrabajoEndpoints.cs, método ActualizarOrdenTrabajo desde línea 469 y request en línea 834; OrdenTrabajoFormPage.tsx, línea 847.

Corrección recomendada: definir si el campo corresponde a observaciones generales de la orden o al reporte de una visita, persistirlo en esa entidad y devolverlo consistentemente. La pantalla debe confirmar éxito sólo después de guardar el dato. Probar guardar, recargar y volver a consultar.

## Validaciones que pasaron

- 322 comprobaciones HTTP/JWT: 183 de configuración y 139 de permisos, alcance de inventario, series, RRHH e importación.
- 23 pruebas de servicios del cliente.
- TypeScript sin errores.
- Compras.Workflow: 38 comprobaciones de compras, flujos de transferencias/custodia y 14 comprobaciones de ajustes.
- Revisión de diferencias sin errores de espacios.

La compilación de producción de la interfaz y la coherencia de las dos migraciones se verificaron en la etapa anterior. No se cambiaron sus implementaciones durante esta revisión.

La validación PostgreSQL ya se completó en una instancia temporal independiente. Véase correcciones-y-concurrencia.md para los casos y resultados actuales.

## Funcionalidades pendientes y orden recomendado

Después de corregir los puntos anteriores:

1. Completar el flujo de atención del técnico: consultar trabajos, ejecutar tareas, reportar consumos, identificar series y enviar evidencias.
2. Implementar la liquidación de materiales: borrador, envío, revisión, observación y confirmación; aplicar existencias y Kardex una sola vez.
3. Implementar carga real de evidencias. Actualmente se recibe una URL en la tarea; no se encontró un flujo completo de subida y validación de fotos en las rutas revisadas.
4. Preparar las pantallas de técnicos y vendedores para celular usando React y Fluent UI. El formulario actual de órdenes tiene llamadas para gestión administrativa; el flujo de ejecución necesita sus controles específicos.
5. Añadir PWA, guardado de pendientes y sincronización: identificadores estables, reintentos seguros, conflictos y confirmación del servidor.
6. Probar atención y liquidación completas en Android e iPhone.

La liquidación tiene entidades de dominio, pero no se encontró un endpoint completo para procesarla. No debe considerarse una funcionalidad terminada. Si también se requiere liquidación económica o pago al técnico, debe definirse como un flujo distinto de la descarga de materiales.

## Validación actual

Las sondas de investigación fueron sustituidas por PostgresConcurrencyWorkflow, que verifica las correcciones con solicitudes simultáneas y una base PostgreSQL temporal. Las instrucciones están en correcciones-y-concurrencia.md.