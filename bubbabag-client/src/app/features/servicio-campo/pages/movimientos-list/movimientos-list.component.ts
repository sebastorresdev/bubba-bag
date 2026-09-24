import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

export interface MovimientoItem {
  id: string;
  numeroMovimiento: string;
  tipoMovimiento: string;
  origen: string;
  destino: string;
  fecha: string;
  usuario: string;
  estado: string;
}

@Component({
  selector: 'app-movimientos-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzTagModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  template: `
    <app-command-bar [items]="commandBarItems"></app-command-bar>

    <div class="catalogo-view-wrapper">
      <app-entity-table
        entidad="Kardex de Movimientos"
        [vistasSistema]="vistasSistema"
        [(vistaActualKey)]="vistaActual"
        [columnas]="columnas"
        [datos]="itemsFiltrados"
        [loading]="loading"
        [(selectedIds)]="selectedIds"
        (selectedIdsChange)="onSelectedIdsChange($event)"
        (vistaChange)="onVistaChange($event)"
        (recargar)="cargarDatos()"
      >
        <ng-template cellDef="numeroMovimiento" let-item>
          <span class="nombre-link">{{ item.numeroMovimiento }}</span>
        </ng-template>

        <ng-template cellDef="tipoMovimiento" let-item>
          <nz-tag
            [nzColor]="item.tipoMovimiento === 'Entrada por Compra' || item.tipoMovimiento === 'Devolución' ? 'blue' : 'orange'"
          >
            {{ item.tipoMovimiento }}
          </nz-tag>
        </ng-template>

        <ng-template cellDef="estado" let-item>
          <nz-tag
            [nzColor]="item.estado === 'Confirmado' ? 'success' : (item.estado === 'Pendiente' ? 'warning' : 'default')"
          >
            {{ item.estado }}
          </nz-tag>
        </ng-template>
      </app-entity-table>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;
      }

      .catalogo-view-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        gap: 0;
        padding: 0;
        box-sizing: border-box;
        overflow: hidden;
      }

      .nombre-link {
        color: var(--d365-link-color, #0078d4);
        font-weight: 600;
        cursor: pointer;
      }

      .d365-status-tag {
        border-radius: 2px;
        font-size: 12px;
        font-weight: 500;
        padding: 1px 8px;
        margin: 0;
      }

      .tag-active {
        background-color: #dff6dd;
        border-color: #107c41;
        color: #107c41;
      }

      .tag-inactive {
        background-color: #f3f2f1;
        border-color: #8a8886;
        color: #605e5c;
      }
    `,
  ],
})
export class MovimientosListComponent implements OnInit {
  private msg = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  selectedIds = new Set<string>();
  vistaActual = 'Todos';

  vistasSistema: VistaItem[] = [
    { key: 'Todos', nombre: 'Todos los Movimientos', esSistema: true, esPredeterminada: true },
    { key: 'Despachos', nombre: 'Despachos a Técnicos', esSistema: true },
    { key: 'Consumos', nombre: 'Consumos en Órdenes', esSistema: true },
    { key: 'Entradas', nombre: 'Entradas y Devoluciones', esSistema: true },
  ];

  columnas: ColumnDef<MovimientoItem>[] = [
    { key: 'numeroMovimiento', title: 'N° Movimiento', width: '150px', sortable: true, dataType: 'text', primaryLink: true },
    { key: 'tipoMovimiento', title: 'Tipo de Operación', width: '180px', sortable: true, dataType: 'text' },
    { key: 'origen', title: 'Origen', width: '200px', sortable: true, dataType: 'text' },
    { key: 'destino', title: 'Destino', width: '200px', sortable: true, dataType: 'text' },
    { key: 'fecha', title: 'Fecha', width: '130px', sortable: true, dataType: 'date' },
    { key: 'usuario', title: 'Responsable', width: '160px', sortable: true, dataType: 'text' },
    { key: 'estado', title: 'Estado', width: '120px', sortable: true, dataType: 'text', align: 'center' },
  ];

  items: MovimientoItem[] = [
    { id: '1', numeroMovimiento: 'MOV-2026-00450', tipoMovimiento: 'Despacho a Técnico', origen: 'Almacén Central Lima', destino: 'Móvil Van #04 (Abraham M.)', fecha: '2026-09-23', usuario: 'Jefe Almacén', estado: 'Confirmado' },
    { id: '2', numeroMovimiento: 'MOV-2026-00451', tipoMovimiento: 'Consumo en Orden', origen: 'Móvil Van #04', destino: 'OT-2026-0045 (Cliente Directv)', fecha: '2026-09-23', usuario: 'Abraham McCormick', estado: 'Confirmado' },
    { id: '3', numeroMovimiento: 'MOV-2026-00452', tipoMovimiento: 'Entrada por Compra', origen: 'Proveedor Fibra Perú SAC', destino: 'Almacén Central Lima', fecha: '2026-09-22', usuario: 'Jefe Almacén', estado: 'Confirmado' },
  ];

  itemsFiltrados: MovimientoItem[] = [];

  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        action: () => this.cargarDatos(),
      },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        action: () => this.msg.info('Exportando kardex general...'),
      },
    ];
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  onVistaChange(vista: VistaItem): void {
    this.vistaActual = vista.key;
    this.selectedIds.clear();
    this.aplicarFiltro();
  }

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;
    this.cdr.markForCheck();
  }

  cargarDatos(): void {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.aplicarFiltro();
      this.cdr.markForCheck();
    }, 200);
  }

  aplicarFiltro(): void {
    if (this.vistaActual === 'Despachos') {
      this.itemsFiltrados = this.items.filter((i) => i.tipoMovimiento === 'Despacho a Técnico');
    } else if (this.vistaActual === 'Consumos') {
      this.itemsFiltrados = this.items.filter((i) => i.tipoMovimiento === 'Consumo en Orden');
    } else if (this.vistaActual === 'Entradas') {
      this.itemsFiltrados = this.items.filter((i) => i.tipoMovimiento === 'Entrada por Compra' || i.tipoMovimiento === 'Devolución');
    } else {
      this.itemsFiltrados = [...this.items];
    }
  }
}
