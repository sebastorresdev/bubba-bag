# Estándar de Diseño y Catálogo de Componentes D365 / Fluent UI v9

> **Regla de Oro del Proyecto**: Cualquier nueva pantalla, formulario, listado o panel que se cree o modifique debe cumplir estrictamente con este catálogo de componentes, estilos y estructuras. Queda prohibido inventar estructuras ad-hoc o tarjetas con diseños divergentes.

---

## 1. Ficha / Formulario Estándar (`D365FormPage`)

Todo formulario de creación, edición o detalle debe estructurarse exactamente con la siguiente jerarquía:

```
<div className={formStyles.root}>
  ├── <D365CommandBar>                 // Barra superior de acciones
  │     ├── <D365CommandButton icon={<ArrowLeft16Regular />} aria-label="Volver" />  // Flecha atrás (sin texto)
  │     ├── <D365CommandButton text="Guardar" icon={<Save16Regular />} primary />
  │     ├── <D365CommandButton text="Guardar y cerrar" icon={<SaveMultiple16Regular />} />
  │     └── Acciones contextuales (Completar, Anular, etc.)
  │
  ├── <D365EntityHeader>               // Cabecera inmutable del registro
  │     ├── title: Datos guardados del servidor (ej. "Nuevo Retiro" o "DEV-000001") - NUNCA cambia al tipear
  │     ├── subtitle: Breve descripción de la entidad
  │     └── Metadatos a la derecha: Estado, Fecha de emisión, Total unidades, etc.
  │
  ├── [Opcional: Barra de Etapas / Pipeline] // Proceso de negocio (Borrador -> En Tránsito -> Recibido)
  │
  ├── <TabList selectedValue={selectedTab}> // Pestañas estándar
  │     ├── <Tab value="general">General</Tab>
  │     ├── <Tab value="productos">Productos ({totalUnidades})</Tab>
  │     └── <Tab value="adjuntos">Documentos y Fotos</Tab>
  │
  └── <D365FormContent>                // Cuerpo del formulario con scroll y bloqueo al enviar
        └── Pestaña Activa:
              ├── <div className={formStyles.card}>
              │     <div className={formStyles.cardSectionTitle}>1. DATOS DEL DOCUMENTO</div>
              │     <D365FormField label="Empresa Proveedora" required>
              │       <Input ... />
              │     </D365FormField>
              │   </div>
```

### Reglas de Formularios:
1. **Cabecera (`D365EntityHeader`)**: Se alimenta de los datos del servidor (`savedHeader`). Si el usuario escribe en un campo de texto, la cabecera **no debe parpadear ni actualizarse** hasta que se guarde exitosamente.
2. **Botón Volver**: Solo icono `<ArrowLeft16Regular />`, con `title="Volver al listado"` y `aria-label="Volver"`. Sin texto visible «Atrás».
3. **Campos (`D365FormField`)**:
   - Etiqueta fija horizontal de 180px a la izquierda en pantallas de escritorio, apilada en móviles.
   - **Sin placeholders redundantes**: Si la etiqueta dice "Empresa Proveedora", el campo no debe tener placeholder "Ingrese la empresa proveedora" ni guiones `---`.
   - Campos vacíos inician vacíos.

---

## 2. Pestaña de Productos: Panel de Pistoleo y DataGrid

Cualquier pantalla que involucre ingreso o retiro de materiales y series (DOA, Devolución a Proveedor, Despacho, Desabastecimiento, Traslados) debe usar el **mismo componente y distribución**:

### A. Panel de Pistoleo (`scannerPanel`)
- Ubicado en la parte superior de la pestaña Productos.
- Cuadrícula con 4 columnas alineadas:
  1. **Pistola / Escaneo de Serie o SKU**: Input con icono `BarcodeScanner20Regular` que procesa la búsqueda al presionar `[Enter]`.
  2. **Selector de Existencias del Almacén**: Menú `<Select>` o buscador con las existencias reales del almacén seleccionado.
  3. **Cantidad**: Input numérico (habilitado principalmente para insumos/materiales no seriados).
  4. **Botón AGREGAR**: `appearance="primary"`, icono `<Add16Regular />`, texto "Agregar".
- **Feedback**: Mensaje inmediato debajo del panel en verde (éxito) o rojo (error de serie no encontrada, duplicada o en estado incorrecto).

### B. Tabla de Productos (`DataGrid`)
- **Estructura Plana (1 Fila = 1 Unidad o Serie)**:
  - Cada serie pistoleada o seleccionada es una fila individual.
  - Para insumos no seriados, es una fila con su cantidad correspondiente.
- **Columnas Estándar**:
  1. `N° de Serie / Referencia`: Monospace con color institucional (`tokens.colorBrandForeground1`). Si no es seriado, badge `Material no seriado`.
  2. `Producto / Modelo`: Nombre del producto en negrita mediana y código de producto en subtítulo.
  3. `Tipo`: Badge `Equipo Seriado` (color brand) o `Material / Insumo` (color informative).
  4. `Cantidad`: Número de unidades.
  5. `Acción`: Botón icono basura `<Delete16Regular />`.
- **Eliminación Individual**: Al hacer clic en el botón de eliminar de una fila, **se elimina única y exclusivamente esa serie**, nunca el producto entero ni otras series.
- **Barra de Totales (`totalsBar`)**: Al pie de la tabla, con el total de líneas registradas y el total acumulado de unidades.
- **Estado Vacío (`TableEmptyState`)**: Si no hay productos, mostrar el estado vacío estándar con icono y mensaje explicativo.

---

## 3. Listados Principales (`D365EntityTable`)

Todos los listados de entidades (Devoluciones, DOA, Despachos, Compras, etc.) deben seguir estas directrices:

1. **Modo de Selección**:
   - `selectionMode="multiselect"` **SIEMPRE**.
   - **PROHIBIDO el uso de `single` (radio buttons)** en las tablas principales. Dynamics 365 utiliza casillas de verificación (checkboxes) multiselección.
2. **Columna N° de Documento / Identificador**:
   - Debe ser un enlace navegable estándar:
     ```tsx
     <Link as="button" onClick={() => navigate(`/ruta/${item.id}`)}>
       {item.numero}
     </Link>
     ```
   - **PROHIBIDO** envolver el código en botones con fondos personalizados, bordes o estilos `font-weight: bold` manuales que desentonen con la grilla.
3. **Acciones de Fila y Command Bar (Regla de Oro)**:
   - **PROHIBIDO colocar botones de acción dentro de las celdas de la tabla** (descargar, imprimir, compartir por WhatsApp, eliminar). Las celdas de la tabla deben permanecer limpias.
   - **Toda acción contextual vive en la `D365CommandBar` superior**: Se activan condicionalmente cuando el usuario selecciona 1 fila (o varias) mediante el checkbox (ej. `Cargo PDF`, `Imprimir`, `WhatsApp`, `Ver detalle`, `Eliminar`).
   - `onRowDoubleClick`: Al hacer doble clic en cualquier fila, navega directamente al detalle del registro.
4. **Entidades Relacionadas en Tablas**:
   - Siempre que una columna haga referencia a otra entidad del sistema (ej. Almacén Origen, Almacén Destino, Proveedor, Cliente), debe renderizarse como un enlace navegable `<Link>` con `e.stopPropagation()` hacia la ruta de la entidad relacionada (ej. `/servicio-campo/almacenes/${item.almacenOrigenId}`).
5. **Columnas de Fecha**: Formateadas en formato local `DD/MM/YYYY`.

---

## 4. Estándar de Fechas y Timezone (Perú UTC-5)

1. **Problema Detectado**:
   - Cuando se guarda una fecha de documento como `DateOnly` (ej. `2026-10-18`) y se convierte a `DateTime.Utc` a las `00:00:00`, al enviarse al cliente web en Perú (UTC-5), el navegador resta 5 horas y muestra `17/10/2026, 19:00`.
2. **Regla de Persistencia**:
   - Los movimientos de Kardex e inventario que ocurren en tiempo real deben registrar `FechaMovimiento = DateTime.UtcNow` (hora exacta del evento).
   - Las fechas de documentos comerciales (guías, facturas) deben mantenerse como fechas puras (`DateOnly`) o parsearse sin desfase horario (`YYYY-MM-DD` a mediodía local o UTC explícito) para que nunca retrocedan al día anterior.
