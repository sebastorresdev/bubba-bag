# Convenciones de interfaz

Estas decisiones del usuario aplican a los formularios actuales y futuros de SKVIA. Para estos comportamientos sustituyen las indicaciones antiguas de cabeceras que cambian mientras se escribe.

## Identidad del registro en la cabecera

- Separar los datos guardados, obtenidos del servidor, del borrador del formulario.
- Al crear, mostrar «Nuevo usuario», «Nuevo almacén» u otro título equivalente hasta guardar y obtener el registro creado del servidor.
- Al editar, conservar el nombre guardado mientras se escribe. Actualizar la cabecera únicamente después de guardar correctamente y recibir los datos persistidos del servidor.
- Aplicar el mismo criterio al correo, código e iniciales que identifican el registro en la cabecera.
- Si falla el guardado o la recarga, conservar la identidad previamente obtenida. Los cambios del borrador no deben presentarse como guardados.
- Reutilizar `D365EntityHeader`; recibir sus datos desde una copia del registro persistido, no desde los campos editables.

## Regreso al listado

- Mostrar únicamente el icono de flecha hacia atrás, sin texto visible «Volver» ni «Atrás».
- Conservar una etiqueta accesible y una descripción al pasar el cursor.
- Reutilizar `D365CommandButton` con el icono de Fluent UI, manteniendo el estilo de la barra de comandos.

## Texto y campos

- La interfaz sirve para operar. La explicación del modelo y de los procesos pertenece a la capacitación o documentación.
- Usar etiquetas breves, acciones claras y datos del registro. Evitar párrafos de ayuda permanentes y descripciones repetidas bajo campos, pestañas o títulos.
- Dejar vacíos los campos sin valor. No agregar ejemplos, instrucciones ni guiones como placeholder a campos que ya tienen etiqueta.
- Identificar los campos con etiquetas visibles; no depender del placeholder como única identificación.
- Usar «Buscar» en los buscadores. Conservar etiquetas accesibles que indiquen qué se busca.
- Conservar validaciones, requisitos concretos de formato, estados, resultados y avisos breves sobre consecuencias de una acción.
- Reutilizar Fluent UI y los componentes existentes; estos cambios de texto no alteran las reglas de negocio.

## Comprobación manual en Usuarios

1. Abrir un usuario nuevo y escribir su nombre y correo: la cabecera debe continuar mostrando «Nuevo usuario».
2. Guardar: una vez cargada la ficha creada desde el servidor, la cabecera debe mostrar su nombre y correo.
3. Modificar el nombre y correo del usuario existente: la cabecera debe conservar los anteriores hasta guardar y recargar los datos.
4. Provocar una validación fallida: la cabecera debe conservar los datos guardados.
5. Comprobar que el regreso al listado presenta sólo la flecha y mantiene su etiqueta para lectores de pantalla.
