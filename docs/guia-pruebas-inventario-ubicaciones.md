# Guía de pruebas de inventario desde la interfaz

Fecha: 3 de octubre de 2026. Rutas comprobadas en App.tsx y navigation.data.ts. La guía describe las pantallas implementadas; no certifica una prueba completa en navegador con los datos reales.

## Disponibilidad real

| Función | Estado de la vista |
|---|---|
| Crear unidades, recursos, productos y almacenes | Implementada |
| Crear ubicaciones y configurar autorizaciones de usuarios existentes | Implementada |
| Ingresar material mediante compra y recepción | Implementada |
| Abastecer, devolver, desabastecer y trasladar entre ubicaciones | Implementada mediante Transferencias y Despachos |
| Recibir traslados parcial o totalmente por series y cantidades | Implementada |
| Resolver diferencias de tránsito como supervisor | Implementada |
| Consultar existencias y series disponibles/en tránsito | Implementada |
| Crear usuarios, asignar roles y autorizaciones por almacén | Implementada; Centro de administración → Usuarios del Sistema |
| Iniciar sesión y cambiar entre operadores desde pantalla | Implementada en /login; cierre desde el perfil |
| Elegir el usuario vinculado al recurso desde la ficha | Implementada; selector de cuenta existente y activa |
| Ajustes generales por conteo, sobrantes, faltantes o bajas | Pendiente; el menú Ajustes de Inventario no tiene página funcional |
| Descargar material por trabajos y liquidaciones | Diferido expresamente |

La resolución de diferencias regulariza material pendiente de un traslado concreto. No reemplaza un módulo general de ajustes.

## Antes de comenzar

Usar la API y el frontend actualizados. La API debe iniciar y completar la migración de ubicaciones antes de utilizar estas pantallas. La migración no se aplicó sobre la base habitual durante la implementación: ensayarla primero sobre una copia con respaldo. Si el arranque informa inconsistencias, conciliarlas antes de continuar.

Todos los ejemplos de esta guía son opcionales y se cargan manualmente; el sistema no los crea. Para estas pruebas usar tus propios datos y códigos de prueba. Puede utilizarse la cuenta administrativa existente para comprobar el movimiento y los saldos. SuperAdmin tiene acceso global y no sirve para demostrar restricciones entre usuarios.

## 1. Usuarios y accesos

Entrar por /login con una cuenta existente. Si la instalación no tiene usuarios, crear manualmente el primer administrador en esa misma pantalla. No se generan cuentas ni datos operativos automáticamente.

Centro de administración → Seguridad → Usuarios del Sistema, ruta /configuracion/usuarios. Crear tus cuentas con Nuevo o Importar usuarios. En carga masiva se crean inactivas y sin contraseña: restablecer la contraseña y activar antes de probar login.

Asignar InventarioAlmacenero a operadores y supervisores logísticos; la facultad de supervisión se delimita por almacén. InventarioAdmin permite gestionar catálogos y asignar autorizaciones, pero no concede movimiento global. SuperAdmin es la excepción de acceso global.

Después de crear los almacenes, abrir cada usuario → Autorizaciones por almacén. Seleccionar consulta, despacho, recepción y supervisión según corresponda; activar y guardar cada fila. También se configura desde la ficha del almacén. Consultar la guía de acceso en docs/guia-acceso-usuarios-permisos.md.

Permisos para probar por perfiles:

- Almacenero Trujillo: consulta, despacho y recepción en bodega Trujillo y custodia del técnico de Trujillo.
- Almacenero Chiclayo: consulta, despacho y recepción en bodega Chiclayo.
- Supervisor: consulta y supervisión en ambas bodegas; supervisión en origen y destino para restituciones al origen.
- Técnico: su vínculo con el recurso no le concede despacho ni recepción.

## 2. Crear unidades

Servicio de Campo → Configuración → Estructura Organizacional → Unidades Organizativas (Sedes).

Ruta: /servicio-campo/unidades-organizativas.

Crear PR-TRU / Trujillo prueba y PR-CHI / Chiclayo prueba. Los territorios no son requisito para las pruebas logísticas.

## 3. Crear bodegas

Servicio de Campo → Inventario → Control y Existencias → Almacenes y Ubicaciones.

Ruta: /servicio-campo/almacenes.

Crear Bodega prueba Trujillo, tipo Bodega, unidad PR-TRU; crear Bodega prueba Chiclayo, tipo Bodega, unidad PR-CHI. Guardar y comprobar que ambas tienen una ubicación Principal en la pestaña Ubicaciones y permisos.

En Trujillo crear E1 / Estante 1. La bodega no necesita un recurso custodio.

## 4. Crear recurso y su custodia

Servicio de Campo → Configuración → Estructura Organizacional → Recursos Reservables.

Ruta: /servicio-campo/recursos.

Crear PR-TEC-TRU / Técnico prueba Trujillo, tipo Técnico de Campo (Individual), unidad PR-TRU. Seleccionar su cuenta en Usuario de acceso vinculado. Si se utiliza Bodega Base, elegir Bodega prueba Trujillo. Esa preferencia no crea su custodia ni sustituye autorizaciones.

Volver a Almacenes y Ubicaciones y crear Custodia prueba técnico Trujillo, tipo Custodia personal, unidad PR-TRU, recurso PR-TEC-TRU. Guardar. Debe aparecer su ubicación Principal. No debe permitirse otra custodia activa para el mismo recurso.

En cada almacén abrir Ubicaciones y permisos. Si existen usuarios de prueba, asignar los permisos indicados en el paso 1 y pulsar Guardar permisos. El permiso Activo debe estar marcado.

## 5. Crear productos

Servicio de Campo → Configuración → Catálogo General → Unidades de Medida, ruta /servicio-campo/unidades-medida.

Utilizar o crear un grupo con unidad base Unidad. Luego ir a Productos, ruta /servicio-campo/productos.

Crear:

- PR-CABLE: material de tipo Inventario, no seriado, grupo y unidad Unidad, precisión 0.
- PR-ROUTER: producto de tipo Inventario, seriado, grupo y unidad Unidad, precisión 0.

Crear el producto no crea existencias. No modificar unidad o configuración de seriado una vez que tenga inventario.

## 6. Ingresar existencias

Servicio de Campo → Inventario → Operaciones de Almacén → Recepciones de Material.

Ruta: /servicio-campo/recepciones-compra.

Crear una compra con proveedor de prueba y destino Bodega prueba Trujillo. En Productos agregar PR-CABLE, cantidad 100, y PR-ROUTER, cantidad 4. Registrar costos válidos.

Seguir la secuencia: Guardar → Solicitar compra → completar series → Registrar envío → Recepcionar → Confirmar recepción. Registrar el comprobante requerido al recibir.

Series Trujillo: PR-TRU-001, PR-TRU-002, PR-TRU-003 y PR-TRU-004. Registrar las cuatro antes del envío y verificarlas en recepción. Para PR-CABLE comprobar que se recibirán 100 unidades: la recepción de compras actualmente precarga la cantidad esperada de no seriados.

Repetir para Bodega prueba Chiclayo: PR-CABLE, 40 unidades; PR-ROUTER, 3 unidades; series PR-CHI-001, PR-CHI-002 y PR-CHI-003.

El borrador y el envío de la compra no deben aumentar el stock. Solo la recepción lo incorpora a Principal.

## 7. Abastecer al técnico

Servicio de Campo → Inventario → Operaciones de Almacén → Transferencias y Despachos.

Ruta: /servicio-campo/transferencias.

Nuevo → origen Bodega prueba Trujillo / Principal → destino Custodia prueba técnico Trujillo / Principal → entrega Presencial → condición Utilizable.

En Productos agregar PR-CABLE, cantidad 20, y la serie PR-TRU-001. Pulsar Confirmar despacho.

Esperado: bodega Trujillo 80 cables y 3 routers; custodia 20 cables y el router PR-TRU-001. Transferencia cerrada y sin saldo en tránsito.

## 8. Desabastecer o devolver

En la misma pantalla crear otra transferencia, invirtiendo el sentido: origen Custodia prueba técnico Trujillo → destino Bodega prueba Trujillo. Elegir Principal en ambos y entrega Presencial.

Devolver 5 cables y la serie PR-TRU-001. Confirmar despacho.

Esperado: bodega Trujillo 85 cables y 4 routers; custodia 15 cables y ningún router. Lo registra el almacenero, no el técnico.

## 9. Mover entre ubicaciones

Nueva transferencia → origen y destino Bodega prueba Trujillo → origen Principal → destino Estante 1 → entrega Presencial.

Mover 10 cables. Esperado: Principal 75, Estante 1 10, total de la bodega 85. La reubicación no aumenta ni reduce el stock total.

## 10. Trasladar entre unidades y recibir parcialmente

Nueva transferencia → origen Bodega prueba Trujillo / Principal → destino Bodega prueba Chiclayo / Principal → entrega Con tránsito.

Enviar 20 cables y las series PR-TRU-002 y PR-TRU-003. Confirmar despacho.

Antes de recibir: Trujillo tiene 65 cables en total (55 Principal + 10 Estante 1); Chiclayo sigue con 40; hay 20 pendientes de recepción. Los dos routers salen de stock disponible y aparecen en tránsito en Trazabilidad de Series.

Abrir el documento en Transferencias y Despachos → Recepcionar mercadería. Ingresar PR-CABLE con cantidad 15 y capturar solamente PR-TRU-003. Confirmar recepción.

Esperado: Chiclayo 55 cables y 4 routers; pendientes 5 cables y PR-TRU-002. La transferencia permanece ParcialmenteRecibida. Capturar PR-TRU-003 no debe recibir PR-TRU-002.

## 11. Regularizar la diferencia

En el documento abrir Resolver diferencia con un supervisor autorizado. Se regulariza una línea por operación.

Para el escenario de devolución comprobada al origen:

1. Elegir la línea PR-CABLE, cantidad 5, resultado Restituir al origen; completar motivo y referencia de evidencia; confirmar.
2. Elegir la línea PR-ROUTER, serie PR-TRU-002, mismo resultado; completar motivo y evidencia; confirmar.

Esperado: transferencia cerrada; Trujillo 70 cables en total y 3 routers; Chiclayo 55 cables y 4 routers; custodia 15 cables y ningún router. No hay tránsito pendiente. Se conservan los 140 cables y 7 routers iniciales.

Alternativa: si se comprueba que el pendiente llegó a destino, elegir Ingreso comprobado en destino. En ese caso el resultado final será Trujillo 65 cables y 2 routers, Chiclayo 60 cables y 5 routers, custodia 15 cables.

La evidencia representa una verificación física; no asumir que un faltante está en origen solo porque no se recibió en destino.

## 12. Consultar y probar restricciones

Existencias de Productos: /servicio-campo/inventario-productos. Filtrar producto y almacén; revisar cada ubicación y condición. Para el total de un producto en una bodega, considerar todas sus ubicaciones.

Trazabilidad de Series: /servicio-campo/series. Buscar una serie enviada y comprobar su tránsito o ubicación final.

Almacenes y Ubicaciones → ficha → Existencias / Stock: consultar saldo por ubicación.

Transferencias y Despachos → documento → Recepciones: revisar cantidades/series realmente recibidas y regularizaciones con supervisor, motivo y evidencia.

Casos que deben impedir la operación:

- Chiclayo abastece directamente la custodia de Trujillo: ese destino no debe ofrecerse.
- Transferencia inmediata entre Trujillo y Chiclayo: se exige tránsito.
- Cantidad mayor al disponible: rechazo y saldos sin cambios.
- Serie ajena al origen o serie ya en tránsito: rechazo.
- Serie recibida dos veces o cantidad mayor que el pendiente: rechazo.
- Desactivar un almacén con stock o tránsito: rechazo.
- Reasignar unidad o custodio de un almacén existente: no permitido.

Las pruebas de aislamiento entre usuarios y la prohibición de movimientos al técnico requieren sesiones con usuarios normales. La cuenta SuperAdmin no demuestra esos límites. Usa el login y las cuentas normales creadas en Usuarios, con el rol y las autorizaciones por almacén del paso 1.

## Pendientes para el recorrido íntegro

Completar el módulo de ajustes generales y los proveedores de carga masiva para sedes, recursos y almacenes. El login, los usuarios, la asignación de roles y el selector de usuario del recurso ya están implementados. La liquidación por trabajos permanece diferida por decisión del usuario. Estas carencias no se deben confundir con las funciones logísticas ya implementadas.
