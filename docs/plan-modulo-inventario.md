# Plan de Implementación: Módulo Completo de Inventario y Gestión de Materiales

Este documento registra la arquitectura y el plan de desarrollo para el **Módulo de Inventario** (Backend CQRS + Endpoints API + Frontend Angular estilo Microsoft Dynamics 365), acordado para su ejecución.

---

## 1. Alcance General
1. **Catálogo de Productos** (CRUD, tipificación, unidad de medida, serializado y **Carga Masiva vía Excel/lote**).
2. **Gestión de Almacenes** (CRUD de bodegas físicas por sede/sucursal y almacenes móviles de cuadrillas).
3. **Ingresos de Mercadería** (Entradas por Guía de Remisión, Comprobante de Compra o Remisión DIRECTV con registro de series).
4. **Despachos y Transferencias entre Almacenes** (Abastecimiento de camionetas de técnicos con selección/escaneo de series y metraje de cable).
5. **Consulta de Existencias y Trazabilidad de Series** (Búsqueda por almacén, sede o consulta de hoja de vida de un decodificador).
6. **Kardex de Movimientos** (Auditoría inmutable de todas las transacciones).

---

## 2. Arquitectura Técnica y Flujo de Datos

```
                                  [ Proveedor DIRECTV ]
                                            │ Guía de Remisión / Comprobante
                                            ▼
                           ┌──────────────────────────────────┐
                           │    Ingreso a Almacén Central     │
                           │   (Crea Series + Aumenta Stock)  │
                           └──────────────────────────────────┘
                                            │ Transferencia
                                            ▼
                           ┌──────────────────────────────────┐
                           │   Almacén Base Regional          │
                           │   (Huaraz, Chimbote, Piura...)   │
                           └──────────────────────────────────┘
                                            │ Despacho a Cuadrilla
                                            ▼
                           ┌──────────────────────────────────┐
                           │    Almacén Móvil (Camioneta)     │
                           │     (Custodia del Técnico)       │
                           └──────────────────────────────────┘
                                            │ Consumo en OT
                                            ▼
                           ┌──────────────────────────────────┐
                           │   Instalado en Cliente Abonado   │
                           └──────────────────────────────────┘
```

---

## 3. Backend: Componentes a Desarrollar

### A. Capa de Aplicación (`BubbaBag.Modules.Inventario.Application`)

#### 1. Productos y Carga Masiva
- `ActualizarProductoCommand`: Actualización de datos de producto.
- `ImportarProductosMasivoCommand`: Importación masiva desde archivo Excel (`.xlsx`) o lote JSON con validación de código único y campos obligatorios.
- `ObtenerProductoPorIdQuery`.

#### 2. Almacenes
- `CrearAlmacenCommand`: Registro de almacén físico o móvil vinculado a sucursal y técnico.
- `ActualizarAlmacenCommand`: Edición de nombre, dirección, teléfono y responsable.
- `CambiarEstadoAlmacenCommand`: Activar / desactivar almacén.
- `ObtenerAlmacenesQuery`: Listado con filtros por tipo (`Fisico`, `Movil`), sucursal y estado activo.
- `ObtenerAlmacenPorIdQuery`.

#### 3. Existencias y Trazabilidad de Series
- `ObtenerStockPorAlmacenQuery`: Retorna el balance de stock disponible y reservado por producto y almacén, con filtro por sede/sucursal.
- `ObtenerItemsSeriadosQuery`: Consulta de series con filtros por producto, almacén actual, estado (`EnAlmacen`, `EnCustodiaTecnico`, `InstaladoEnCliente`, etc.) o búsqueda por serie/SmartCard/MAC.
- `ObtenerHistorialSerieQuery`: Retorna la hoja de vida completa de un decodificador/equipo con todos sus movimientos históricos.

#### 4. Movimientos, Ingresos y Despachos
- `RegistrarIngresoMercaderiaCommand`:
  - Parámetros: `AlmacenDestinoId`, `TipoDocumento` (Guía de Remisión, Factura, etc.), `NumeroDocumento`, `Observaciones`, y lista de items (`ProductoId`, `Cantidad`, `Series` opcionales con SmartCard y MAC).
  - Efecto: Aumenta `StockAlmacen`, crea `ItemSeriado` para cada serie ingresada y registra `MovimientoInventario` con tipo `IngresoProveedor`.
- `TransferirEntreAlmacenesCommand`:
  - Parámetros: `AlmacenOrigenId`, `AlmacenDestinoId`, `NumeroGuiaInterna`, `Observaciones`, y lista de items (`ProductoId`, `Cantidad`, `Series` a transferir).
  - Valida disponibilidad en origen, descuenta origen, incrementa destino, traslada custodia de las series (`DespacharATecnico` o `RecepcionarEnAlmacen`) y registra `MovimientoInventario`.
- `ObtenerMovimientosInventarioQuery`: Kardex con filtros por fecha, almacén origen/destino, producto, serie y tipo de movimiento.

### B. Capa API (`BubbaBag.Modules.Inventario.Api`)
- `ProductosEndpoints.cs`:
  - `PUT /api/inventario/productos/{id}`
  - `POST /api/inventario/productos/importar-masivo` (multipart/form-data Excel o payload lote)
- `AlmacenesEndpoints.cs`:
  - `GET /api/inventario/almacenes`
  - `GET /api/inventario/almacenes/{id}`
  - `POST /api/inventario/almacenes`
  - `PUT /api/inventario/almacenes/{id}`
  - `PATCH /api/inventario/almacenes/{id}/estado`
- `StockEndpoints.cs`:
  - `GET /api/inventario/stock` (stock consolidado por almacén / producto)
  - `GET /api/inventario/seriados` (listado y búsqueda de decos/routers por serie)
  - `GET /api/inventario/seriados/{serie}/historial` (trazabilidad 360°)
- `MovimientosEndpoints.cs`:
  - `GET /api/inventario/movimientos` (Kardex)
  - `POST /api/inventario/movimientos/ingreso` (Guías de remisión / compras)
  - `POST /api/inventario/movimientos/transferencia` (Despachos a técnicos / traspasos entre sedes)

---

## 4. Frontend Angular (`bubbabag-client`)

### A. Navegación y Rutas
- `navigation.service.ts`:
  - Agregar módulo `inventario` con icono `appstore`, shortCode `INV`, y menú:
    - *Catálogo de Materiales*: `/inventario/productos`
    - *Almacenes y Bodegas*: `/inventario/almacenes`
    - *Control de Existencias (Stock)*: `/inventario/stock`
    - *Trazabilidad de Series*: `/inventario/seriados`
    - *Ingresos y Guías*: `/inventario/ingresos`
    - *Despachos y Transferencias*: `/inventario/transferencias`
    - *Kardex de Movimientos*: `/inventario/movimientos`
- `app.routes.ts`:
  - Registrar ruta `inventario` con lazy loading a `INVENTARIO_ROUTES`.

### B. Páginas y Componentes D365

1. **`pages/productos-list`**:
   - Tabla D365 con `app-entity-table`, filtros por categoría (`Materiales`, `Equipos`, `Insumos`), unidad de medida y estado.
   - Toolbar D365: Botón *Nuevo Producto*, *Carga Masiva Excel*, *Exportar Excel*, *Actualizar*.
   - Drawer / Modal para creación y edición de producto.
   - Modal de carga masiva con drag & drop de Excel y descarga de plantilla.

2. **`pages/almacenes-list`**:
   - Listado de almacenes con badge de tipo (`Físico` vs `Móvil`), sucursal/sede vinculada y técnico responsable.
   - Modal de creación y edición de almacenes.

3. **`pages/stock-list`**:
   - Vista agrupada por almacén o sede con selector desplegable de bodega.
   - Columnas: Código, Producto, Categoría, Unidad de Medida, Stock Disponible, Stock Reservado, Alerta de Mínimo.
   - Acceso directo a *Ver Series Disponibles*.

4. **`pages/seriados-list`**:
   - Buscador rápido estilo D365 por Serie, SmartCard o MAC.
   - Estados con tags de color (*En Almacén*, *En Camioneta*, *Instalado en Cliente*, *Averiado*).
   - Drawer lateral "Hoja de Vida de la Serie": Muestra cliente actual, dirección, OT de instalación y línea de tiempo de todos sus movimientos históricos.

5. **`pages/ingreso-mercaderia` / `modal-ingreso`**:
   - Formulario de entrada: Selección de almacén destino, tipo de documento (Guía de Remisión, Comprobante de Compra), número de documento y proveedor.
   - Grilla de artículos: permite agregar líneas de materiales y, en caso de productos seriados, caja de texto o lector de código de barras para pegar/escanear lista de números de serie.

6. **`pages/transferencias-list` / `modal-despacho`**:
   - Formulario de despacho: Almacén Origen (ej. Bodega Huaraz) &rarr; Almacén Destino (ej. Camioneta Carlos Ramírez).
   - Selección de materiales y series a despachar.
   - Impresión/Visualización de Vale de Despacho.

7. **`pages/movimientos-list` (Kardex)**:
   - Tabla cronológica completa con filtros de fecha, tipo de movimiento, almacén y documento.

---

## 5. Fases de Ejecución
- **Fase 1: Backend - Catálogo de Productos y Carga Masiva**
- **Fase 2: Backend - Almacenes, Stock, Seriados y Movimientos (Ingresos y Despachos)**
- **Fase 3: Frontend - Integración de Rutas y Menú de Navegación**
- **Fase 4: Frontend - Vistas D365 de Productos y Almacenes**
- **Fase 5: Frontend - Vistas D365 de Stock, Seriados, Ingresos y Despachos**
- **Fase 6: Verificación y Pruebas Integrales**
