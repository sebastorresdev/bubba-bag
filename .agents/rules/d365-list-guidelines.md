# Estándar de Vistas de Listado Dynamics 365 (d365-list-guidelines)

Esta regla es de **cumplimiento estricto** para todas las vistas de catálogo y listado de entidades en el frontend (`bubbabag-client`).

---

## 1. Patrón Espejo Obligatorio
El modelo canónico y de referencia absoluta es:
- **HTML**: `src/app/features/configuracion/pages/usuarios-list/usuarios-list.html`
- **TypeScript**: `src/app/features/configuracion/pages/usuarios-list/usuarios-list.component.ts`
- **CSS**: `src/app/features/configuracion/pages/usuarios-list/usuarios-list.component.css`

---

## 2. Errores Prohibidos (Tolerancia Cero)

1. **PROHIBIDO inventar o duplicar estilos de tabla, hover o selección en el `.component.css`**:
   - Todo el diseño está centralizado globalmente en `src/styles/d365-list.css`.
   - El archivo `.component.css` de un nuevo listado debe tener **máximo 10-20 líneas** (únicamente para anchos específicos de columnas de la entidad).
2. **PROHIBIDO usar colores azules/celestes en hover o selección**:
   - El hover **SIEMPRE es gris neutro ultra sutil** (`rgba(0,0,0,0.03)` en claro / `rgba(255,255,255,0.04)` en oscuro). NUNCA usar `rgba(0, 120, 212, ...)` en filas.
   - La selección **SIEMPRE es gris cálido Fluent UI** (`#edebe9` en claro / `rgba(255,255,255,0.08)` en oscuro). NUNCA usar tonos celestes como `#edf5fd` o `var(--ant-primary-1)`.
   - El color azul (`#0078d4` / `#2899f5`) se reserva **exclusivamente** para el enlace clickeable del nombre (`.nombre-link`).
3. **PROHIBIDO usar `[nzScroll]` con alturas calculadas** (`[nzScroll]="{ y: 'calc(...)' }"`):
   - Rompe el layout flex, genera doble barra de scroll y desconecta el paginador.
4. **PROHIBIDO poner botones extra no estándar en la Command Bar del Listado**:
   - En vistas de listado, `farItems` debe retornar siempre `[]`.
5. **PROHIBIDO usar puntos, círculos sueltos o celdas manuales para el estado**:
   - El estado en las tablas siempre debe ser la píldora oficial D365:
     ```html
     <nz-tag class="d365-status-tag" [class.tag-active]="item.activo" [class.tag-inactive]="!item.activo">
       {{ item.activo ? 'Activo' : 'Inactivo' }}
     </nz-tag>
     ```

---

## 3. Estructura HTML Requerida (Template Canónico)

```html
<!-- 1. Command Bar Superior -->
<app-command-bar [items]="commandBarItems" [farItems]="farItems"></app-command-bar>

<div class="catalogo-view-wrapper">
  <!-- 2. Tarjeta Contenedora D365 Full Height -->
  <nz-card [nzBordered]="true" [nzBodyStyle]="{ padding: '0' }" class="d365-table-card">
    
    <!-- 3. Toolbar: Selector de Vista (Dropdown) + Buscador Fluent -->
    <div class="d365-toolbar-row">
      <div>
        <button
          nz-button
          nzType="text"
          nz-dropdown
          [nzDropdownMenu]="viewsMenu"
          nzTrigger="click"
          class="view-title-btn"
        >
          <h1 class="view-title-text">{{ vistaActualTitulo }}</h1>
          <nz-icon nzType="down" class="view-title-icon" />
        </button>

        <nz-dropdown-menu #viewsMenu="nzDropdownMenu">
          <ul nz-menu>
            <li nz-menu-item (click)="cambiarVista('Activos')" [nzSelected]="vistaActual === 'Activos'">
              <nz-icon nzType="check" [style.visibility]="vistaActual === 'Activos' ? 'visible' : 'hidden'" />
              <span>Entidades Activas</span>
            </li>
            <li nz-menu-item (click)="cambiarVista('Todos')" [nzSelected]="vistaActual === 'Todos'">
              <nz-icon nzType="check" [style.visibility]="vistaActual === 'Todos' ? 'visible' : 'hidden'" />
              <span>Todas las Entidades</span>
            </li>
            <li nz-menu-item (click)="cambiarVista('Inactivos')" [nzSelected]="vistaActual === 'Inactivos'">
              <nz-icon nzType="check" [style.visibility]="vistaActual === 'Inactivos' ? 'visible' : 'hidden'" />
              <span>Entidades Inactivas</span>
            </li>
          </ul>
        </nz-dropdown-menu>
      </div>

      <div class="view-tools-group">
        <div class="d365-search-box">
          <input
            type="text"
            placeholder="Filtrar..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchTermChange()"
            class="search-input"
          />
          @if (searchTerm) {
            <button class="search-clear-btn" (click)="limpiarBusqueda()" title="Borrar búsqueda">
              <nz-icon nzType="close" />
            </button>
          }
          <button class="search-icon-btn" (click)="cargarDatos()" title="Buscar">
            <nz-icon nzType="search" />
          </button>
        </div>
      </div>
    </div>

    <!-- 4. Tabla Dynamics 365 (Sin nzScroll, nzSize small, d365-table) -->
    <nz-table
      #basicTable
      [nzData]="items"
      [nzLoading]="loading"
      [nzShowPagination]="true"
      [nzShowTotal]="totalRangeTpl"
      [nzPageSize]="15"
      nzSize="small"
      class="d365-table"
    >
      <ng-template #totalRangeTpl let-range="range" let-total="total">
        {{ range[0] }} - {{ range[1] }} de {{ total }}
      </ng-template>

      <thead>
        <tr>
          <th [nzWidth]="'48px'" [nzChecked]="checked" [nzIndeterminate]="indeterminate" (nzCheckedChange)="onAllChecked($event)"></th>
          <th>Nombre</th>
          <th [nzWidth]="'120px'" nzAlign="center">Estado</th>
        </tr>
      </thead>
      <tbody>
        @for (item of basicTable.data; track item.id) {
          <tr
            class="d365-data-row"
            [class.fluent-row-selected]="selectedIds.has(item.id)"
            (click)="onItemChecked(item.id, !selectedIds.has(item.id))"
          >
            <td [nzChecked]="selectedIds.has(item.id)" (nzCheckedChange)="onItemChecked(item.id, $event)" (click)="$event.stopPropagation()"></td>
            <td class="col-primary-text">
              <span class="nombre-link" (click)="$event.stopPropagation(); irAEditar(item.id)">
                {{ item.nombre }}
              </span>
            </td>
            <td nzAlign="center">
              <nz-tag class="d365-status-tag" [class.tag-active]="item.activo" [class.tag-inactive]="!item.activo">
                {{ item.activo ? 'Activo' : 'Inactivo' }}
              </nz-tag>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  </nz-card>
</div>
```

---

## 4. Archivo CSS del Componente (`.component.css`)

Gracias al archivo global `src/styles/d365-list.css`, el archivo `.component.css` del componente **NO debe contener estilos de layout, tarjetas, toolbar, buscador ni tablas**. Solo contendrá ajustes mínimos de columnas específicas si es necesario:

```css
/* Estilos particulares de la entidad (opcional) */
.col-codigo {
  font-family: 'Consolas', monospace;
  font-weight: 600;
}
```
