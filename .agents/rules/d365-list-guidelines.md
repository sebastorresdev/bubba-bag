# Estándar de Vistas de Listado Dynamics 365 (d365-list-guidelines)

Esta regla es de **cumplimiento estricto** para todas las vistas de catálogo y listado de entidades en el frontend (`bubbabag-client`).

---

## 1. Patrón Obligatorio: Componente Institucional `<app-entity-table>`
Queda **estrictamente prohibido** construir tablas manuales (`<nz-table>`) o replicar selectores de vistas individuales.
Toda nueva vista de catálogo o listado DEBE consumir el componente institucional:
`src/app/shared/components/entity-table/entity-table.component.ts`

Referencia canónica y completa en:
- **Documentación Técnica**: [docs/entity-table-standard.md](file:///d:/PROYECTOS/bubba-bag/docs/entity-table-standard.md)
- **Ejemplo Canónico**: `src/app/features/configuracion/pages/usuarios-list/usuarios-list.component.ts`

---

## 2. Errores Prohibidos (Tolerancia Cero)

1. **PROHIBIDO crear tablas manuales (`<nz-table>`) para listas de entidades**:
   - Siempre usar `<app-entity-table>`.
2. **PROHIBIDO inventar o duplicar estilos de tabla, hover o selección en el `.component.css`**:
   - Todo el diseño está centralizado en `src/styles/d365-list.css` y `entity-table.component.css`.
   - El `.component.css` de un listado debe tener **máximo 10-20 líneas** (sólo clases específicas de celda).
3. **PROHIBIDO usar colores fijos (`#ffffff`, `#000000`, etc.)**:
   - Respetar siempre el tema activo usando variables `--d365-*` (`--d365-bg-card`, `--d365-border-color`, `--d365-text-primary`, etc.).
4. **PROHIBIDO agregar espacios manuales o alterar el layout de botones NG-ZORRO (`.ant-btn`)**:
   - Ant Design gestiona automáticamente el margen nativo entre el icono y el texto (`8px`).
   - NUNCA aplicar `gap` ni `display: inline-flex` en botones institucionales.
5. **PROHIBIDO poner botones extra no estándar en la Command Bar del Listado**:
   - En vistas de listado, `farItems` debe retornar siempre `[]`.
6. **PROHIBIDO omitir el `dataType` en `ColumnDef`**:
   - Cada columna debe declarar su `dataType: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'select'` para que el Query Builder de Filtros Avanzados (`app-advanced-filter-drawer`) ofrezca los operadores precisos.

---

## 3. Estructura TypeScript Mínima

```typescript
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

@Component({
  selector: 'app-mi-entidad-list',
  standalone: true,
  imports: [
    CommonModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  templateUrl: './mi-entidad-list.html',
  styleUrl: './mi-entidad-list.component.css',
})
export class MiEntidadListComponent implements OnInit {
  items: MiEntidadDto[] = [];
  loading = false;
  selectedIds = new Set<string>();

  vistaActual = 'Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Registros Activos', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Registros Inactivos', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Registros', esSistema: true },
  ];

  columnas: ColumnDef<MiEntidadDto>[] = [
    { key: 'codigo', title: 'Código', width: '120px', sortable: true, dataType: 'text' },
    { key: 'nombre', title: 'Nombre', width: '280px', sortable: true, dataType: 'text', primaryLink: true, canHide: false },
    { key: 'activo', title: 'Estado', width: '110px', align: 'center', sortable: true, dataType: 'boolean' },
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void { /* ... */ }
  onVistaChange(vista: VistaItem): void { /* ... */ }
  onSelectedIdsChange(ids: Set<string>): void { this.selectedIds = ids; }
}
```

---

## 4. Estructura HTML Requerida

```html
<app-command-bar [items]="commandBarItems"></app-command-bar>

<div class="catalogo-view-wrapper">
  <app-entity-table
    entidad="Mi Entidad"
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
    <!-- Template para la columna primaria clickeable -->
    <ng-template cellDef="nombre" let-item>
      <span class="nombre-link" (click)="editar(item.id)">
        {{ item.nombre }}
      </span>
    </ng-template>

    <!-- Template oficial para la píldora de estado -->
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
