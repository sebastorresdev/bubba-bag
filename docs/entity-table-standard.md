# Estándar Institucional de Tablas y Listados: `app-entity-table`

> **Regla de Arquitectura Obligatoria**: Toda nueva pantalla o vista de listado/catálogo de entidades en el sistema `bubbabag-client` DEBE implementar el componente institucional `<app-entity-table>`. Queda estrictamente prohibido crear tablas manuales (`<nz-table>`) o selectores de vista individuales para entidades principales.

---

## 1. Justificación y Objetivos de Diseño

El componente `<app-entity-table>` replica con fidelidad del 100% la experiencia de cuadrícula empresarial de **Microsoft Dynamics 365 / Power Apps**, ofreciendo de forma automática y unificada:

1. **Selector de Vistas de Sistema y Personalizadas (`app-view-selector`)**: Vistas predeterminadas por entidad (Activos, Inactivos, Todos, especializadas) con persistencia en `localStorage`.
2. **Filtros Avanzados tipo Query Builder (`app-advanced-filter-drawer`)**:
   - Selector lógico raíz con `[ Y ⌵ ]` y `[ O ⌵ ]`.
   - Evaluación client-side inmediata (0ms de latencia) mediante `advanced-filter-evaluator.ts`.
   - Operadores fuertemente tipados según el tipo de dato (`text`, `number`, `currency`, `date`, `boolean`, `select`).
   - Guardado automático del árbol de filtros por vista activa.
3. **Editor y Reordenamiento de Columnas (Drag & Drop)**:
   - Panel lateral oficial para activar/desactivar columnas y reordenarlas dinámicamente mediante `@angular/cdk/drag-drop`.
4. **Buscador Rápido Integrado**: Filtro multi-campo con botón de borrado rápido.
5. **Paginación y Selección Estilo Fluent UI**: Checkbox maestro con estado indeterminado, conteo de filas en el footer (`1 - 15 de 45`).
6. **Cumplimiento Nativo de Temas Claro y Oscuro**: 100% compatible con NG-ZORRO y las variables CSS de Dynamics 365 sin desajustes de color ni fuentes invisibles.
7. **Espaciado Nativo de Botones Ant Design**: Sin sobreescrituras arbitrarias de `gap` o `display` en `.ant-btn`.

---

## 2. Ubicación de Archivos del Componente

| Módulo / Archivo | Ruta | Propósito |
| :--- | :--- | :--- |
| **Componente Principal** | `src/app/shared/components/entity-table/entity-table.component.ts` | Cuadrícula completa, barra de herramientas y gestión de estado |
| **Plantilla HTML** | `src/app/shared/components/entity-table/entity-table.component.html` | Layout Dynamics 365, slots de plantilla `cellDef` |
| **Estilos CSS** | `src/app/shared/components/entity-table/entity-table.component.css` | Variables de tema `--d365-*`, adaptabilidad Dark/Light |
| **Modelos de Tabla** | `src/app/shared/components/entity-table/entity-table.models.ts` | Interfaz `ColumnDef<T>`, `TableSortState`, `TableStateSnapshot` |
| **Directiva de Celdas** | `src/app/shared/components/entity-table/cell-def.directive.ts` | Directiva estructural `*cellDef="key"` para renderizado personalizado |
| **Filtros Avanzados** | `src/app/shared/components/advanced-filter/` | Árbol de condiciones, evaluador puro y drawer modal Dynamics 365 |
| **Barrel Export** | `src/app/shared/components/entity-table/index.ts` | Exportación única de todos los símbolos públicos |

---

## 3. Guía Rápida de Implementación (Paso a Paso)

### Paso 1: Importar en el Componente Standalone

En tu archivo `[entidad]-list.component.ts`:

```typescript
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import {
  EntityTableComponent,
  CellDefDirective,
  ColumnDef,
} from '../../../../shared/components/entity-table';
import { MiEntidadDto } from '../../models/mi-entidad.model';
import { MiEntidadService } from '../../services/mi-entidad.service';

@Component({
  selector: 'app-mi-entidad-list',
  standalone: true,
  imports: [
    CommonModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
    // Demás módulos de NG-ZORRO que necesites para tus celdas (ej. NzTagModule, NzAvatarModule)
  ],
  templateUrl: './mi-entidad-list.html',
  styleUrl: './mi-entidad-list.component.css',
})
export class MiEntidadListComponent implements OnInit {
  private service = inject(MiEntidadService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // 1. Datos y Estado
  items: MiEntidadDto[] = [];
  loading = false;
  selectedIds = new Set<string>();

  // 2. Vistas del Sistema
  vistaActual = 'Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Registros Activos', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Registros Inactivos', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Registros', esSistema: true },
  ];

  // 3. Definición Tipada de Columnas
  columnas: ColumnDef<MiEntidadDto>[] = [
    {
      key: 'codigo',
      title: 'Código',
      width: '120px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'nombre',
      title: 'Nombre de la Entidad',
      width: '280px',
      sortable: true,
      dataType: 'text',
      primaryLink: true, // Estilo azul clickeable D365
      canHide: false,    // Columna obligatoria
    },
    {
      key: 'precio',
      title: 'Precio Base',
      width: '120px',
      align: 'right',
      sortable: true,
      dataType: 'currency',
    },
    {
      key: 'fechaRegistro',
      title: 'Fecha de Registro',
      width: '140px',
      align: 'center',
      sortable: true,
      dataType: 'date',
    },
    {
      key: 'activo',
      title: 'Estado',
      width: '110px',
      align: 'center',
      sortable: true,
      dataType: 'boolean',
      filterType: 'select',
      filterOptions: [
        { label: 'Activo', value: true },
        { label: 'Inactivo', value: false },
      ],
    },
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.service.getTodos().subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onVistaChange(vista: VistaItem): void {
    this.vistaActual = vista.key;
    this.selectedIds.clear();
    this.cargarDatos();
  }

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;
    this.cdr.markForCheck();
  }

  editar(id: string): void {
    this.router.navigate(['/ruta/editar', id]);
  }
}
```

---

### Paso 2: Estructurar la Plantilla HTML

En tu archivo `[entidad]-list.html`:

```html
<!-- 1. Barra de Comandos Superior Dynamics 365 -->
<app-command-bar [items]="commandBarItems"></app-command-bar>

<!-- 2. Contenedor del Listado Reutilizable -->
<div class="catalogo-view-wrapper">
  <app-entity-table
    entidad="Nombre de Entidad"
    [vistasSistema]="vistasSistema"
    [(vistaActualKey)]="vistaActual"
    [columnas]="columnas"
    [datos]="items"
    [loading]="loading"
    [(selectedIds)]="selectedIds"
    (selectedIdsChange)="onSelectedIdsChange($event)"
    (vistaChange)="onVistaChange($event)"
    (recargar)="cargarDatos()"
    (rowDblClick)="editar($event.id)"
  >
    <!-- Template para la columna primaria (enlace) -->
    <ng-template cellDef="nombre" let-item>
      <span class="nombre-link" (click)="editar(item.id)">
        {{ item.nombre }}
      </span>
    </ng-template>

    <!-- Template para montos monetarios -->
    <ng-template cellDef="precio" let-item>
      <span>{{ item.precio | currency:'PEN':'symbol':'1.2-2' }}</span>
    </ng-template>

    <!-- Template institucional para estado activo/inactivo -->
    <ng-template cellDef="activo" let-item>
      <nz-tag
        class="d365-status-tag"
        [class.tag-active]="item.activo"
        [class.tag-inactive]="!item.activo"
      >
        {{ item.activo ? 'Activo' : 'Inactivo' }}
      </nz-tag>
    </ng-template>
  </app-entity-table>
</div>
```

---

## 4. Referencia de Configuración de Columnas (`ColumnDef`)

La interfaz `ColumnDef<T>` configura el comportamiento de cada columna:

```typescript
export interface ColumnDef<T = any> {
  key: string;                    // Clave del campo en el objeto de datos (ej: 'nombre', 'activo')
  title: string;                  // Título mostrado en el encabezado
  width?: string;                 // Ancho CSS (ej: '120px', '280px')
  align?: 'left' | 'center' | 'right'; // Alineación del texto
  sortable?: boolean;             // Si permite ordenar haciendo click en la cabecera
  dataType?: ColumnDataType;      // Tipo de dato: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'select'
  filterType?: 'text' | 'select' | 'none'; // Tipo de filtro de cabecera rápida
  filterOptions?: FilterOption[]; // Opciones cuando filterType es 'select'
  hidden?: boolean;               // Si inicia oculta por defecto
  canHide?: boolean;              // Si false, el usuario no puede ocultarla en Editar Columnas
  primaryLink?: boolean;          // Aplica estilo visual de enlace principal D365
  headerClass?: string;           // Clase CSS personalizada para <th>
  cellClass?: string;             // Clase CSS personalizada para <td>
}
```

### Tipos de Datos Soportados (`ColumnDataType`)
Indicar el `dataType` es fundamental para que el **Filtro Avanzado (Query Builder)** muestre los operadores correctos de Dynamics 365:

| `dataType` | Operadores Automáticos | Control de Entrada en Drawer |
| :--- | :--- | :--- |
| `'text'` | Es igual a, No es igual a, Contiene, No contiene, Comienza con, Termina con, Tiene datos, No tiene datos | Input de texto |
| `'number'` / `'currency'` | Es igual a, No es igual a, Es mayor que, Es mayor o igual que, Es menor que, Es menor o igual que, Entre, Tiene datos, No tiene datos | Input numérico / Doble input para "Entre" |
| `'date'` | Es igual a, Anterior a, Posterior a, En o antes de, En o después de, Entre, Hoy, Ayer, Este mes, Tiene datos, No tiene datos | DatePicker / Rango de fechas |
| `'boolean'` | Es igual a (Verdadero / Falso) | Selector Sí / No |
| `'select'` | Es igual a, No es igual a, En la lista, No en la lista | Selector con las `filterOptions` definidas |

---

## 5. Propiedades y Eventos de `<app-entity-table>`

### Inputs

| Propiedad | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `[entidad]` | `string` | *(Requerido)* | Nombre legible de la entidad (ej. `'Colaboradores'`, `'Clientes'`) |
| `[vistasSistema]` | `VistaItem[]` | `[]` | Lista de vistas del sistema disponibles para el selector |
| `[(vistaActualKey)]` | `string` | `''` | Clave de la vista seleccionada actualmente |
| `[columnas]` | `ColumnDef[]` | `[]` | Colección de columnas a mostrar y configurar |
| `[datos]` | `any[]` | `[]` | Array con los registros de la entidad |
| `[loading]` | `boolean` | `false` | Activa el spinner de carga en la tabla |
| `[(selectedIds)]` | `Set<string>` | `new Set()` | Conjunto con los IDs seleccionados |
| `[pageSize]` | `number` | `15` | Cantidad de registros por página |
| `[rowKey]` | `string` | `'id'` | Nombre de la propiedad identificadora del registro |
| `[scrollX]` | `string?` | `undefined` | Ancho total para scroll horizontal en tablas muy anchas (ej. `'1900px'`) |
| `[searchPlaceholder]` | `string` | `'Filtrar por palabra clave'` | Placeholder del cuadro de búsqueda |
| `[showEditColumns]` | `boolean` | `true` | Muestra el botón para editar y reordenar columnas |
| `[allowColumnReorder]`| `boolean` | `true` | Permite arrastrar y soltar columnas en el drawer |
| `[showAdvancedFilter]`| `boolean` | `true` | Muestra el botón de Filtros Avanzados (Query Builder) |
| `[showViews]` | `boolean` | `true` | Muestra el selector de vistas D365 |
| `[showSearch]` | `boolean` | `true` | Muestra el buscador rápido en la toolbar |

### Outputs

| Evento | Tipo de Emisión | Descripción |
| :--- | :--- | :--- |
| `(vistaChange)` | `VistaItem` | Emitido cuando el usuario selecciona una vista diferente |
| `(selectedIdsChange)`| `Set<string>` | Emitido cuando cambia la selección de filas |
| `(recargar)` | `void` | Emitido cuando el usuario solicita refrescar la información |
| `(rowClick)` | `any` | Emitido al hacer un click simple sobre una fila |
| `(rowDblClick)` | `any` | Emitido al hacer doble click en una fila (ideal para abrir edición) |
| `(searchChange)` | `string` | Emitido en tiempo real al escribir en el buscador rápido |
| `(advancedFilterChange)`| `FilterGroup \| null` | Emitido cuando se aplican filtros avanzados personalizados |

---

## 6. Personalización de Celdas con `cellDef`

Si una columna no tiene `ng-template cellDef`, la tabla mostrará el valor directo en texto plano.
Para renderizado personalizado, utiliza la directiva `cellDef="[keyDeLaColumna]"`:

```html
<!-- Ejemplo: Avatar con iniciales y enlace -->
<ng-template cellDef="nombreCompleto" let-item>
  <div style="display: flex; align-items: center; gap: 8px;">
    <nz-avatar [nzText]="item.nombre[0]" nzSize="small"></nz-avatar>
    <span class="nombre-link" (click)="irAEditar(item.id)">
      {{ item.nombreCompleto }}
    </span>
  </div>
</ng-template>

<!-- Ejemplo: Píldora de estado oficial D365 -->
<ng-template cellDef="activo" let-item>
  <nz-tag
    class="d365-status-tag"
    [class.tag-active]="item.activo"
    [class.tag-inactive]="!item.activo"
  >
    {{ item.activo ? 'Activo' : 'Inactivo' }}
  </nz-tag>
</ng-template>
```

---

## 7. Reglas de Estilo y Cumplimiento de Temas (Tolerancia Cero)

1. **NO usar colores fijos (`#ffffff`, `#000000`, etc.)**:
   - Emplea siempre las variables institucionales:
     - `var(--d365-bg-card)` para fondos de contenedor.
     - `var(--d365-border-color)` para bordes de tablas y separadores.
     - `var(--d365-text-primary)` para textos principales.
     - `var(--d365-subtext-color)` para textos secundarios y placeholders.
     - `var(--d365-link-color)` para enlaces `.nombre-link`.
2. **NO modificar el espaciado interno de botones NG-ZORRO (`.ant-btn`)**:
   - NG-ZORRO maneja de forma nativa el espaciado entre icono y texto (`margin-left: 8px`).
   - NUNCA agregues `gap: 6px` o `display: inline-flex` sobre botones estándar.
3. **El archivo `.component.css` de tu listado debe ser mínimo**:
   - No dupliques estilos de tablas, scrolls ni cabeceras; todo está provisto por `d365-list.css` y `entity-table.component.css`.

---

## 8. Inventario de Pantallas Migradas

Todas las entidades del ERP cuentan con este estándar implementado y verificado:

- **Recursos Humanos**:
  - `CargosListComponent` (`src/app/features/recursos-humanos/pages/cargos-list`)
  - `DepartamentosListComponent` (`src/app/features/recursos-humanos/pages/departamentos-list`)
  - `EmpleadosListComponent` (`src/app/features/recursos-humanos/pages/empleados-list`)
- **Configuración**:
  - `UsuariosListComponent` (`src/app/features/configuracion/pages/usuarios-list`)
  - `SucursalesListComponent` (`src/app/features/configuracion/pages/sucursales-list`)
- **CRM**:
  - `ClientesListComponent` (`src/app/features/crm/pages/clientes-list`)
- **Ventas**:
  - `CatalogosComercialesListComponent` (`src/app/features/ventas/pages/catalogos-comerciales-list`)
  - `ListasPrecioListComponent` (`src/app/features/ventas/pages/listas-precio-list`)
- **Servicio de Campo**:
  - `OrdenesListComponent` (`src/app/features/servicio-campo/pages/ordenes-list`)
  - `ServiciosListComponent` (`src/app/features/servicio-campo/pages/servicios-list`)
  - `CatalogosServicioListComponent` (`src/app/features/servicio-campo/pages/catalogos-servicio-list`)
  - `TarifasServicioListComponent` (`src/app/features/servicio-campo/pages/tarifas-servicio-list`)
  - `TiposOrdenListComponent` (`src/app/features/servicio-campo/pages/tipos-orden-list`)
  - `MotivosIncidenciaListComponent` (`src/app/features/servicio-campo/pages/motivos-incidencia-list`)
