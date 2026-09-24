import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

export interface StockItem {
  id: string;
  codigoProducto: string;
  nombreProducto: string;
  almacen: string;
  stockActual: number;
  stockDisponible: number;
  stockReservado: number;
  unidadMedida: string;
  estado: string;
}

@Component({
  selector: 'app-stock-list',
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
        entidad="Control de Existencias"
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
        <ng-template cellDef="codigoProducto" let-item>
          <span class="nombre-link">{{ item.codigoProducto }}</span>
        </ng-template>

        <ng-template cellDef="estado" let-item>
          <nz-tag
            [nzColor]="item.estado === 'Disponible' ? 'success' : (item.estado === 'Bajo Stock' ? 'warning' : 'default')"
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
        background-color: #fff4ce;
        border-color: #795e00;
        color: #795e00;
      }
    `,
  ],
})
export class StockListComponent implements OnInit {
  private msg = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  selectedIds = new Set<string>();
  vistaActual = 'Todos';

  vistasSistema: VistaItem[] = [
    { key: 'Todos', nombre: 'Todo el Stock de Almacenes', esSistema: true, esPredeterminada: true },
    { key: 'Disponible', nombre: 'Stock Disponible', esSistema: true },
    { key: 'Bajo', nombre: 'Stock Crítico / Bajo', esSistema: true },
  ];

  columnas: ColumnDef<StockItem>[] = [
    { key: 'codigoProducto', title: 'Código', width: '130px', sortable: true, dataType: 'text', primaryLink: true },
    { key: 'nombreProducto', title: 'Producto / Material', width: '280px', sortable: true, dataType: 'text' },
    { key: 'almacen', title: 'Almacén / Ubicación', width: '200px', sortable: true, dataType: 'text' },
    { key: 'stockActual', title: 'Stock Físico', width: '120px', sortable: true, dataType: 'number', align: 'right' },
    { key: 'stockDisponible', title: 'Disponible', width: '120px', sortable: true, dataType: 'number', align: 'right' },
    { key: 'stockReservado', title: 'Reservado', width: '120px', sortable: true, dataType: 'number', align: 'right' },
    { key: 'unidadMedida', title: 'U.M.', width: '90px', sortable: true, dataType: 'text', align: 'center' },
    { key: 'estado', title: 'Estado', width: '120px', sortable: true, dataType: 'text', align: 'center' },
  ];

  items: StockItem[] = [
    { id: '1', codigoProducto: 'PROD-001', nombreProducto: 'Cable Drop Fibra Óptica 1 Hilo (Bobina 1000m)', almacen: 'Almacén Central Lima', stockActual: 45, stockDisponible: 40, stockReservado: 5, unidadMedida: 'BOB', estado: 'Disponible' },
    { id: '2', codigoProducto: 'PROD-002', nombreProducto: 'Conector Rápido SC/APC Monomodo', almacen: 'Almacén Central Lima', stockActual: 1200, stockDisponible: 1100, stockReservado: 100, unidadMedida: 'UND', estado: 'Disponible' },
    { id: '3', codigoProducto: 'PROD-003', nombreProducto: 'Router ONT Dual Band Wi-Fi 6 Huawei', almacen: 'Móvil Van #04 (Abraham M.)', stockActual: 8, stockDisponible: 3, stockReservado: 5, unidadMedida: 'UND', estado: 'Bajo Stock' },
    { id: '4', codigoProducto: 'PROD-004', nombreProducto: 'Splitter Óptico PLC 1x8 SC/APC', almacen: 'Almacén Central Lima', stockActual: 80, stockDisponible: 75, stockReservado: 5, unidadMedida: 'UND', estado: 'Disponible' },
    { id: '5', codigoProducto: 'PROD-005', nombreProducto: 'Decodificador 4K DTV Ultra HD', almacen: 'Móvil Van #02 (Allison D.)', stockActual: 12, stockDisponible: 10, stockReservado: 2, unidadMedida: 'UND', estado: 'Disponible' },
  ];

  itemsFiltrados: StockItem[] = [];

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
        action: () => this.msg.info('Exportando reporte de existencias...'),
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
    if (this.vistaActual === 'Disponible') {
      this.itemsFiltrados = this.items.filter((i) => i.estado === 'Disponible');
    } else if (this.vistaActual === 'Bajo') {
      this.itemsFiltrados = this.items.filter((i) => i.estado === 'Bajo Stock');
    } else {
      this.itemsFiltrados = [...this.items];
    }
  }
}
