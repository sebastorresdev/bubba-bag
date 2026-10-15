# Correcciones de prioridad alta — 14 de octubre de 2026

Los cinco puntos están corregidos en el código. Este documento describe el problema anterior, el cambio y su validación. No se ejecutaron cambios sobre la base operativa.

## 1. Ajustes por almacén y aprobación separada

**Antes:** el permiso global de inventario no comprobaba el almacén autorizado y podía aceptar una ubicación de otro almacén.

**Ahora:** listados y consultas se limitan al alcance del usuario. Crear, editar, solicitar aprobación, anular, eliminar y recuperar verifican las autorizaciones vigentes. Entradas requieren recepción; salidas, despacho; ambas requieren consulta. Las escrituras necesitan almacén activo y ubicación activa perteneciente a él.

Se agregó **Aprobar o rechazar ajustes de inventario**, separado de registrar movimientos. El aprobador necesita además acceso a inventario, consulta y supervisión en ese almacén. Super Administrador mantiene su acceso completo. La aprobación registra la identidad autenticada.

**Ejemplo:** Ana sólo está autorizada en Trujillo. No puede consultar, editar, eliminar ni aprobar un ajuste de Chiclayo. Tampoco puede mover un ajuste ajeno a su almacén mediante una edición. Una ubicación de Chiclayo enviada en un ajuste de Trujillo se rechaza sin movimientos.

**Verificado:** dos almacenes, acceso y operaciones ajenas, ubicación incompatible, supervisión sin permiso global, permiso global sin supervisión, aprobación sin permiso de registrar y revocación de alcance con una sesión ya emitida.

## 2. Cantidades, series y Kardex

**Antes:** una cantidad de 1.5 podía aceptar una serie; ingresar una serie existente aumentaba el saldo; una salida podía afectar una serie de otra ubicación.

**Ahora:** productos serializados requieren unidades enteras y una serie por unidad. Se rechazan series vacías, repetidas y demasiado largas, incluso repeticiones entre productos. El catálogo determina serialización y decimales, aunque el cliente envíe otra información.

Una entrada rechaza cualquier serie ya registrada; las devoluciones y restituciones deben utilizar su flujo correspondiente. Una salida comprueba producto, ubicación, condición utilizable, estado disponible y ausencia de tránsito. Todas las líneas se validan antes de modificar saldos, series o documentos.

Las escrituras del mismo ajuste usan un bloqueo transaccional PostgreSQL y recargan el documento. Existencias, series, Kardex y estado se guardan en una transacción; se conservan los controles de concurrencia y los índices únicos de existencias y series. El total admite cinco decimales con numeric(19,5), conservando el rango entero anterior.

**Ejemplo:** ingresar de nuevo EQ-001 no convierte una unidad en dos. Si un ajuste de dos líneas tiene una segunda línea inválida, la primera tampoco modifica stock. Una serie en tránsito no puede darse de baja por ajuste.

**Verificado:** cantidades fraccionarias, series repetidas, entrada duplicada, salida de otra ubicación o en tránsito, error en segunda línea, entrada y salida válidas, repetición de aprobación y correspondencia entre saldo, series y Kardex.

**Validación adicional completada:** se ejecutaron carreras concurrentes, transacciones e índices sobre PostgreSQL temporal real. Los detalles actuales están en correcciones-y-concurrencia.md.

## 3. Alcance y cierre de órdenes

**Antes:** los permisos de consultar asignadas, consultar todas y cerrar no controlaban efectivamente sus acciones.

**Ahora:** listados, detalles y operaciones por ID verifican el alcance. Las asignadas corresponden a la visita más reciente, no cancelada, de un recurso activo vinculado al usuario. El modelo actual vincula usuarios y recursos; no existe un modelo adicional de miembros de cuadrilla. Consultar todas concede alcance organizacional. Quien crea órdenes puede acceder a las propias.

Crear o editar no permite asignar técnicos sin permiso de programación. Completar o cancelar exige **Completar o cancelar órdenes**. Completar conserva la validación de trabajos pendientes.

Las pruebas detectaron además un fallo al persistir nuevas visitas durante la reasignación: ahora se registran explícitamente como nuevas, evitando intentar actualizar una visita inexistente.

**Ejemplo:** al reasignar una orden del técnico A al B, B obtiene acceso y A lo pierde aunque conserve una visita antigua. Un programador puede reasignarla, pero no cerrarla sin permiso de cierre.

**Verificado:** dos técnicos, listados y detalles separados, intento directo de completar un trabajo ajeno, reasignación real y retirada de acceso, programación sin cierre y cierre sin programación. También se verifica la traducción del filtro real a SQL PostgreSQL sin conectar una base.

## 4. Permisos efectivos de Recursos Humanos

**Antes:** el nombre del rol fijo condicionaba el acceso; las casillas de roles personalizados no controlaban efectivamente el módulo, los catálogos y la información confidencial.

**Ahora:** acceso, consulta de colaboradores, gestión laboral, catálogos e información confidencial utilizan sus permisos respectivos. Los perfiles predefinidos siguen siendo combinaciones listas para asignar. Los personalizados pueden recibir las mismas autorizaciones.

Las consultas ocultan salarios, pensiones y cuentas bancarias sin autorización confidencial. El salario referencial también se oculta en fichas, listas y catálogos combinados. Enviar valores confidenciales sin permiso rechaza la solicitud antes de modificar datos. Una edición laboral o de nombre de cargo conserva los valores confidenciales existentes. Eliminar colaboradores requiere gestión y autorización confidencial.

**Ejemplo:** un asistente puede corregir el nombre de una persona conservando su salario y cuenta bancaria. Si envía además una cuenta nueva sin permiso, se rechaza toda la solicitud. Un rol personalizado autorizado sí puede consultar y modificar salarios.

**Verificado:** roles personalizados de consulta, gestión y confidencialidad; consulta sin gestión de catálogos; ocultamiento de salarios referenciales en cuatro consultas; inyección de salario y banco; conservación de información oculta y edición confidencial autorizada.

## 5. Importación, historial y eliminación separados

**Antes:** acceso por roles fijos, historial sin alcance por autor o entidad, eliminación sin permiso separado y autoría textual con un nombre de respaldo.

**Ahora:** cuatro permisos claros:
- **Importar datos desde archivos:** requiere también gestionar la entidad.
- **Consultar mis importaciones:** historial propio de entidades autorizadas.
- **Consultar importaciones de otras personas de mi área:** amplía el alcance al equipo; requiere consulta de historial.
- **Eliminar registros del historial:** elimina registros terminados dentro del alcance autorizado; no borra datos importados ni permite eliminar procesos en curso.

El asistente sólo ofrece entidades gestionables. Crear clientes no concede actualizar los existentes. El inventario inicial exige consulta y recepción en el almacén. Importar sedes respeta los permisos de configuración y el permiso separado para cambiar la principal.

Los trabajos nuevos guardan el ID autenticado y su correo o ID como autor visible. Un nombre enviado por el navegador no suplanta al responsable. Los históricos conservan su texto original y un ID nulo: no se atribuye una identidad por coincidencia de nombres. Los históricos sin propietario sólo son consultables por responsables con alcance de equipo de la entidad o Super Administrador.

**Ejemplo:** el importador de sedes puede cargar un CSV y consultar sus resultados; no ve importaciones de usuarios ni elimina historial por tener permiso de importar. Un responsable con consulta del equipo puede ver las importaciones de sedes de sus compañeros.

**Verificado:** CSV real de sede, catálogo restringido, autor autenticado pese a nombre falsificado, historial propio y del equipo, entidad ajena, consulta sin importación ni eliminación, eliminación autorizada y protección de procesos activos. Las rutas anteriores mantienen los mismos controles.

## Perfiles listos para usar y puesta en marcha

- Administrador de inventario, Administrador de Servicio de Campo y Gerencia reciben aprobación de ajustes. Necesitan además supervisión explícita en los almacenes donde aprobarán.
- Administradores de inventario, Servicio de Campo, CRM y RR. HH., y Gerencia reciben importación y consulta del historial de su área. Las entidades siguen dependiendo de sus permisos de negocio.
- Eliminar historial queda inicialmente reservado a Super Administrador; puede asignarse expresamente a un rol personalizado.
- Al iniciar la API se sincronizan los roles fijos. Los usuarios cuyos perfiles cambien deben iniciar sesión nuevamente. Los permisos personalizados se conservan.
- Hay dos migraciones: autor autenticado de importaciones y precisión de cantidades. Se verificó que ambas coinciden con sus modelos, sin aplicarlas sobre la base operativa. El inicio normal de la API aplica las migraciones.

## Validación reproducible

El proyecto tests/Configuracion.Workflow pasó 322 comprobaciones: 139 sobre estos cinco puntos y 183 sobre empresa/sucursales, incluyendo un PDF real. Utiliza HTTP y JWT reales sobre bases efímeras. tests/Compras.Workflow verifica compras, transferencias, custodia, ajustes, recuperación e identidad. Los 23 casos del navegador verifican recuperación y separación de datos de empresa. También pasaron TypeScript y la compilación de producción de la interfaz; la revisión estática no produjo errores y conserva advertencias de React existentes.

La validación de concurrencia e índices ya se completó sobre PostgreSQL aislado; véase correcciones-y-concurrencia.md. Las migraciones y la actualización de perfiles se aplicarán al iniciar la versión actualizada.