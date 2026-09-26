# Roadmap y Estado del Módulo de Listas de Precios y Catálogo

**Fecha de actualización:** 25 de Septiembre de 2026  
**Módulo:** Servicio de Campo / Inventario y Catálogos  
**Filosofía de Diseño:** 100% alineado a Microsoft Dynamics 365 Field Service con Fluent UI v9.

---

## 1. Lo completado en esta sesión

### A. Mejoras en Categorías y Productos (Frontend)
- **Lista de Categorías (`CategoriasListPage.tsx`):**
  - Columna *"Categoría Padre"* ahora es un enlace interactivo `<Link as="button">` que navega a la ficha de la categoría padre cuando existe; muestra `---` cuando es raíz.
- **Formulario de Producto (`ProductoFormPage.tsx`):**
  - Se convirtió el campo *"Categoría"* de un `<Select>` tradicional al nuevo `<TagPicker>` estilo Dynamics 365.
  - Icono de carpeta `Folder16Regular` con token `tokens.colorBrandForeground1`.
  - Etiqueta seleccionada con `<Link as="span">` que permite abrir la categoría en pestaña nueva sin subrayado en reposo.
  - Opciones del dropdown muestran el nombre de la categoría en grande y el padre en subtítulo atenuado con tipografía reducida (`Padre: NOMBRE_PADRE`).
  - Creación rápida (`+ Nuevo`) mediante ventana modal emergente (*Quick Create Dialog*).
- **Navegación (`navigation.data.ts` y `App.tsx`):**
  - Añadido el ítem **"Listas de Precios"** dentro de *Catálogo General* en el menú lateral con icono `Money`.
  - Ruta `/servicio-campo/listas-precios` configurada temporalmente con la vista `PlaceholderPage` ("Módulo en preparación").

### B. Infraestructura y Modelo de Datos (Backend .NET + PostgreSQL)
- **Nuevas Entidades de Dominio:**
  - `ListaPrecios` (`PriceLevel`): `Id`, `Codigo`, `Nombre`, `Moneda` (PEN, USD), `Descripcion`, `FechaInicio`, `FechaFin`, `Activo`.
  - `ElementoListaPrecios` (`ProductPriceLevel`): `ListaPreciosId`, `ProductoId`, `UnidadMedidaId`, `Monto`, `MetodoFijacion`.
  - `MetodoFijacionPrecio`: Enum (*ImporteDivisa = 1, PorcentajeSobreCosto = 2, PorcentajeMargen = 3*).
- **Entidad `Producto`:**
  - Añadido campo `ListaPreciosPredeterminadaId` (Foreign Key hacia `ListaPrecios`).
- **Base de Datos y Seeder Automático:**
  - Configuraciones EF Core mapeadas al esquema `inventario`.
  - Seeder automático en `WebApplicationExtensions.cs`: crea tablas si no existen e inserta la lista por defecto **`Tarifa General` (`LP-ESTANDAR`)** en Soles (`PEN`).
- **CQRS y Endpoints REST en `CatalogosProductoEndpoints.cs`:**
  - `GET /api/inventario/listas-precios`
  - `GET /api/inventario/listas-precios/{id}`
  - `POST /api/inventario/listas-precios`
  - `PUT /api/inventario/listas-precios/{id}`
  - `PATCH /api/inventario/listas-precios/{id}/estado`
  - `POST /api/inventario/listas-precios/{id}/elementos`
  - `DELETE /api/inventario/listas-precios/elementos/{elementoId}`
- **Capa Cliente (Frontend):**
  - Tipos en `listaPrecios.types.ts`.
  - Servicios en `listaPrecios.service.ts`.
  - DTO de Producto actualizado con `listaPreciosPredeterminadaId`.

---

## 2. Lo pendiente para mañana

### Tarea 1: Vincular Lista de Precios Predeterminada en el Producto (`ProductoFormPage.tsx`)
- [ ] En la tarjeta *"Precios y Unidades"*, agregar el campo obligatorio `Lista de precios predeterminada *` usando `TagPicker`.
- [ ] Conectar con `ListaPreciosService.getListasPrecios()` para cargar las listas disponibles.
- [ ] Permitir Quick Create (`+ Nuevo`) para crear una lista de precios al vuelo sin salir del formulario del producto.
- [ ] Enviar `listaPreciosPredeterminadaId` en el payload de creación/actualización de producto.

### Tarea 2: Subcuadrícula de Elementos de Lista de Precios en el Producto
- [ ] En `ProductoFormPage.tsx`, en una pestaña dedicada (ej. *"Detalles Adicionales"* o *"Tarifas y Precios"*), implementar la tabla/subgrid de **Elementos de Lista de Precios**:
  - Ver en qué listas está incluido el producto y a qué precio.
  - Botón para agregar el producto a otra lista con un precio específico.
  - Acciones para editar precio o eliminar el producto de esa lista.

### Tarea 3: Módulo Frontend de Listas de Precios
- [ ] **`ListasPreciosListPage.tsx`:**
  - Tabla de listas de precios (Nombre, Código, Moneda, Fechas de Vigencia, Cantidad de productos, Estado).
  - Vistas filtradas (Activas / Inactivas).
  - Búsqueda en tiempo real.
- [ ] **`ListaPreciosFormPage.tsx`:**
  - Cabecera: Nombre, Código, Moneda (PEN/USD), Fechas Desde/Hasta, Descripción.
  - Subcuadrícula: Tabla con todos los productos asignados a esta lista, sus unidades y montos, con opción de agregar productos rápidamente.
- [ ] **Rutas en `App.tsx`:**
  - Reemplazar el `PlaceholderPage` por las nuevas páginas:
    - `/servicio-campo/listas-precios` -> `ListasPreciosListPage`
    - `/servicio-campo/listas-precios/nuevo` -> `ListaPreciosFormPage`
    - `/servicio-campo/listas-precios/:id` -> `ListaPreciosFormPage`
