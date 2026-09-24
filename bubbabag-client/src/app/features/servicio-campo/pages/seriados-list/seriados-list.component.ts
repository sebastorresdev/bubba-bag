import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

export interface SeriadoItem {
  id: string;
  numeroSerie: string;
  macAddress: string;
  producto: string;
  ubicacionActual: string;
  responsable: string;
  fechaIngreso: string;
  estado: string;
}

@Component({
  selector: 'app-seriados-list',
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
        entidad="Trazabilidad de Series"
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
        <ng-template cellDef="numeroSerie" let-item>
          <span class="nombre-link">{{ item.numeroSerie }}</span>
        </ng-template>

        <ng-template cellDef="estado" let-item>
          <nz-tag
            [nzColor]="item.estado === 'En Almacén' ? 'success' : (item.estado === 'Asignado a Técnico' ? 'processing' : 'default')"
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
export class SeriadosListComponent implements OnInit {
  private msg = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  selectedIds = new Set<string>();
  vistaActual = 'Todos';

  vistasSistema: VistaItem[] = [
    { key: 'Todos', nombre: 'Todas las Series', esSistema: true, esPredeterminada: true },
    { key: 'Almacen', nombre: 'En Stock de Almacén', esSistema: true },
    { key: 'Tecnico', nombre: 'Asignados a Cuadrilla', esSistema: true },
    { key: 'Instalado', nombre: 'Instalados en Cliente', esSistema: true },
  ];

  columnas: ColumnDef<SeriadoItem>[] = [
    { key: 'numeroSerie', title: 'N° de Serie', width: '170px', sortable: true, dataType: 'text', primaryLink: true },
    { key: 'macAddress', title: 'MAC Address', width: '160px', sortable: true, dataType: 'text' },
    { key: 'producto', title: 'Equipo / Modelo', width: '250px', sortable: true, dataType: 'text' },
    { key: 'ubicacionActual', title: 'Ubicación Actual', width: '220px', sortable: true, dataType: 'text' },
    { key: 'responsable', title: 'Responsable', width: '180px', sortable: true, dataType: 'text' },
    { key: 'fechaIngreso', title: 'Fecha Ingreso', width: '130px', sortable: true, dataType: 'date' },
    { key: 'estado', title: 'Estado', width: '150px', sortable: true, dataType: 'text', align: 'center' },
  ];

  items: SeriadoItem[] = [
    { id: '1', numeroSerie: 'SN-ONT-882910', macAddress: '00:1A:2B:3C:4D:5E', producto: 'ONT Huawei HG8145V5 WiFi 6', ubicacionActual: 'Almacén Central Lima', responsable: 'Jefe de Almacén', fechaIngreso: '2026-08-15', estado: 'En Almacén' },
    { id: '2', numeroSerie: 'SN-ONT-882911', macAddress: '00:1A:2B:3C:4D:5F', producto: 'ONT Huawei HG8145V5 WiFi 6', ubicacionActual: 'Móvil Van #04', responsable: 'Abraham McCormick', fechaIngreso: '2026-08-15', estado: 'Asignado a Técnico' },
    { id: '3', numeroSerie: 'SN-DTV-4K-99210', macAddress: 'F4:5C:89:11:22:33', producto: 'Decodificador 4K DTV Ultra HD', ubicacionActual: 'Cliente: BANCO DE CREDITO', responsable: 'Allison Dickson', fechaIngreso: '2026-07-20', estado: 'Instalado en Cliente' },
  ];

  itemsFiltrados: SeriadoItem[] = [];

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
        action: () => this.msg.info('Exportando reporte de trazabilidad...'),
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
    if (this.vistaActual === 'Almacen') {
      this.itemsFiltrados = this.items.filter((i) => i.estado === 'En Almacén');
    } else if (this.vistaActual === 'Tecnico') {
      this.itemsFiltrados = this.items.filter((i) => i.estado === 'Asignado a Técnico');
    } else if (this.vistaActual === 'Instalado') {
      this.itemsFiltrados = this.items.filter((i) => i.estado === 'Instalado en Cliente');
    } else {
      this.itemsFiltrados = [...this.items];
    }
  }
}
