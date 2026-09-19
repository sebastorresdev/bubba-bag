# Estándar de Vistas de Listado Dynamics 365 (d365-list-guidelines)

Esta regla es de **cumplimiento estricto** para todas las vistas de catálogo y listado de entidades en el frontend (`bubbabag-client`).

---

## 1. Patrón Espejo Obligatorio
El modelo canónico y de referencia absoluta es:
- **HTML**: `src/app/features/configuracion/pages/usuarios-list/usuarios-list.html`
- **TypeScript**: `src/app/features/configuracion/pages/usuarios-list/usuarios-list.component.ts`
- **CSS**: `src/app/features/configuracion/pages/usuarios-list/usuarios-list.component.css`

---

## 2. Errores Prohibidos

1. **PROHIBIDO usar `[nzScroll]` con alturas calculadas** (`[nzScroll]="{ y: 'calc(...)' }"`):
   - **Por qué**: Rompe el layout flex, genera una barra de scroll vertical innecesaria a la derecha y desconecta la paginación, dejándola flotando a media pantalla.
2. **PROHIBIDO poner botones extra no estándar en la Command Bar del Listado**:
   - En vistas de listado, `farItems` debe retornar siempre un arreglo vacío `[]` (sin botón Compartir flotante).
3. **PROHIBIDO dejar la paginación flotando**:
   - La paginación siempre debe estar fija al pie inferior de la tarjeta D365 con el total a la izquierda (`1 - X de Y`) y los controles de página a la derecha.
4. **PROHIBIDO usar puntos, círculos sueltos o celdas manuales para el estado**:
   - El estado en las tablas siempre debe ser la píldora oficial D365: `<nz-tag class="d365-status-tag" [class.tag-active]="item.activo" [class.tag-inactive]="!item.activo">{{ item.activo ? 'Activo' : 'Inactivo' }}</nz-tag>` (estilizado en `common.css`). NUNCA usar dots o círculos.

---

## 3. Estructura HTML Requerida

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
            placeholder="Filtrar por término..."
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

    <!-- 4. Tabla Dynamics 365 (Sin nzScroll, nzSize small, d365-grid d365-table) -->
    <nz-table
      #basicTable
      [nzData]="items"
      [nzLoading]="loading"
      [nzShowPagination]="true"
      [nzShowTotal]="totalRangeTpl"
      [nzPageSize]="15"
      nzSize="small"
      class="d365-grid d365-table"
    >
      <ng-template #totalRangeTpl let-range="range" let-total="total">
        {{ range[0] }} - {{ range[1] }} de {{ total }}
      </ng-template>

      <thead>
        <tr>
          <th [nzWidth]="'48px'" [nzChecked]="checked" [nzIndeterminate]="indeterminate" (nzCheckedChange)="onAllChecked($event)"></th>
          <!-- Columnas con nzWidth fijo donde aplique -->
        </tr>
      </thead>
      <tbody>
        @for (item of basicTable.data; track item.id) {
          <tr
            [class.fluent-row-selected]="selectedIds.has(item.id)"
            (click)="onItemChecked(item.id, !selectedIds.has(item.id))"
            style="cursor: pointer;"
          >
            <td [nzChecked]="selectedIds.has(item.id)" (nzCheckedChange)="onItemChecked(item.id, $event)" (click)="$event.stopPropagation()"></td>
            <td class="col-primary-text">
              <span class="nombre-link" (click)="$event.stopPropagation(); irAEditar(item.id)">
                <nz-icon [nzType]="iconoEntidad" class="row-user-icon" />
                {{ item.nombre }}
              </span>
            </td>
            <!-- Resto de celdas -->
          </tr>
        }
      </tbody>
    </nz-table>
  </nz-card>
</div>
```

---

## 4. Reglas CSS Obligatorias (`.component.css`)

El archivo CSS del componente debe incluir la distribución flexbox que ancla la paginación al pie:

```css
:host {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;
}

.catalogo-view-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.d365-table {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 !important;
  min-height: 0 !important;
  height: 100% !important;
}

:host ::ng-deep .d365-table .ant-table-wrapper,
:host ::ng-deep .d365-table .ant-spin-nested-loading,
:host ::ng-deep .d365-table .ant-spin-container {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 !important;
  min-height: 0 !important;
  height: 100% !important;
}

:host ::ng-deep .d365-table .ant-table-container {
  flex: 1 !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

/* Paginador pegado al pie con total a la izquierda */
:host ::ng-deep .d365-table .ant-table-pagination.ant-pagination {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 8px 16px !important;
  border-top: 1px solid rgba(0, 0, 0, 0.06) !important;
  background-color: #ffffff !important;
  flex-shrink: 0 !important;
}

:host ::ng-deep .d365-table .ant-pagination-total-text {
  order: -1 !important;
  margin-right: auto !important;
  font-size: 12px !important;
  color: #605e5c !important;
  font-weight: 500 !important;
}
```
