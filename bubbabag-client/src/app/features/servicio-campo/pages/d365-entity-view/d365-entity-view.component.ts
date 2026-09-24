import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

export interface EntityRecord {
  id: string;
  [key: string]: any;
}

interface EntityConfig {
  name: string;
  viewTitle: string;
  icon: string;
  columns: ColumnDef<EntityRecord>[];
  records: EntityRecord[];
}

@Component({
  selector: 'app-d365-entity-view',
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
    <!-- Barra de Comandos Superior Dynamics 365 -->
    <app-command-bar [items]="commandBarItems"></app-command-bar>

    <!-- Contenedor del Listado Full-Height con app-entity-table -->
    <div class="catalogo-view-wrapper">
      <app-entity-table
        [entidad]="config.name"
        [vistasSistema]="vistasSistema"
        [(vistaActualKey)]="vistaActual"
        [columnas]="config.columns"
        [datos]="filteredRecords"
        [loading]="loading"
        [(selectedIds)]="selectedIds"
        (selectedIdsChange)="onSelectedIdsChange($event)"
        (vistaChange)="onVistaChange($event)"
        (recargar)="refresh()"
        (rowDblClick)="onRowDblClick($event)"
      >
        <!-- Enlace en la columna de nombre / identificador -->
        <ng-template cellDef="name" let-item>
          <span class="nombre-link" (click)="onRowDblClick(item)">
            {{ item.name }}
          </span>
        </ng-template>

        <!-- Template para columnas de estado / badges con estilo nativo NG-ZORRO -->
        <ng-template cellDef="status" let-item>
          <nz-tag
            [nzColor]="(item.status === 'Active' || item.status === 'Activo') ? 'success' : 'default'"
          >
            {{ item.status }}
          </nz-tag>
        </ng-template>

        <ng-template cellDef="bookingStatus" let-item>
          <nz-tag
            [nzColor]="item.bookingStatus === 'Canceled' ? 'default' : (item.bookingStatus === 'Completed' ? 'success' : 'processing')"
          >
            {{ item.bookingStatus }}
          </nz-tag>
        </ng-template>

        <ng-template cellDef="priority" let-item>
          <nz-tag
            class="d365-priority-tag"
            [nzColor]="item.priority === 'Critical' || item.priority === 'High' ? 'red' : item.priority === 'Normal' ? 'orange' : 'blue'"
          >
            {{ item.priority }}
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

      .nombre-link:hover {
        text-decoration: underline;
        color: var(--d365-link-hover-color, #106ebe);
      }
    `,
  ],
})
export class D365EntityViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private msg = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  selectedIds = new Set<string>();
  vistaActual = 'Activos';

  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Registros Activos', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Registros Inactivos', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Registros', esSistema: true },
  ];

  config: EntityConfig = {
    name: 'Registros',
    viewTitle: 'Active Records',
    icon: 'table',
    columns: [{ key: 'name', title: 'Nombre', sortable: true, dataType: 'text' }],
    records: [],
  };

  filteredRecords: EntityRecord[] = [];

  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        primary: true,
        action: () => this.onAction('Nuevo'),
      },
      {
        key: 'delete',
        label: 'Eliminar',
        icon: 'delete',
        disabled: this.selectedIds.size === 0,
        action: () => this.onAction('Eliminar'),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        action: () => this.refresh(),
      },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        action: () => this.onAction('Exportar a Excel'),
      },
    ];
  }

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const entityKey = data['entityKey'] || this.route.snapshot.url[0]?.path || 'resources';
      this.config = this.getMockConfig(entityKey);
      this.vistasSistema = [
        { key: 'Activos', nombre: `${this.config.name} Activos`, esSistema: true, esPredeterminada: true },
        { key: 'Inactivos', nombre: `${this.config.name} Inactivos`, esSistema: true },
        { key: 'Todos', nombre: `Todos los ${this.config.name}`, esSistema: true },
      ];
      this.applyFilter();
    });
  }

  onVistaChange(vista: VistaItem): void {
    this.vistaActual = vista.key;
    this.selectedIds.clear();
    this.applyFilter();
  }

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;
    this.cdr.markForCheck();
  }

  applyFilter(): void {
    let result = [...this.config.records];
    if (this.vistaActual === 'Activos') {
      result = result.filter((r) => r['status'] === 'Active' || r['status'] === 'Activo' || !r['status']);
    } else if (this.vistaActual === 'Inactivos') {
      result = result.filter((r) => r['status'] === 'Inactive' || r['status'] === 'Inactivo');
    }
    this.filteredRecords = result;
    this.cdr.markForCheck();
  }

  refresh(): void {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.applyFilter();
      this.msg.success('Vista actualizada correctamente');
      this.cdr.markForCheck();
    }, 250);
  }

  onAction(action: string): void {
    this.msg.info(`Acción ejecutada: ${action}`);
  }

  onRowDblClick(item: any): void {
    this.msg.info(`Registro seleccionado: ${item.name || item.id}`);
  }

  private getMockConfig(key: string): EntityConfig {
    switch (key) {
      case 'resources':
        return {
          name: 'Recursos Reservables',
          viewTitle: 'Active Bookable Resources',
          icon: 'idcard',
          columns: [
            { key: 'name', title: 'Nombre', width: '220px', sortable: true, dataType: 'text', primaryLink: true },
            { key: 'type', title: 'Tipo de Recurso', width: '180px', sortable: true, dataType: 'text' },
            { key: 'timezone', title: 'Zona Horaria', width: '160px', sortable: true, dataType: 'text' },
            { key: 'rate', title: 'Tarifa Hora', width: '120px', sortable: true, dataType: 'text' },
            { key: 'status', title: 'Estado', width: '110px', sortable: true, dataType: 'text', align: 'center' },
          ],
          records: [
            { id: '1', name: 'Abraham McCormick', type: 'User (Técnico Fibra)', timezone: 'UTC-05:00 Lima', rate: 'S/ 35.00', status: 'Active' },
            { id: '2', name: 'Alan Steiner', type: 'User (Cuadrilla Satelital)', timezone: 'UTC-05:00 Lima', rate: 'S/ 42.00', status: 'Active' },
            { id: '3', name: 'Allison Dickson', type: 'User (Instalador FTTH)', timezone: 'UTC-05:00 Lima', rate: 'S/ 38.00', status: 'Active' },
            { id: '4', name: 'Ashley Chinn', type: 'User (Supervisor Campo)', timezone: 'UTC-05:00 Lima', rate: 'S/ 50.00', status: 'Active' },
            { id: '5', name: 'Bernadette Foley', type: 'User (Técnico HFC)', timezone: 'UTC-05:00 Lima', rate: 'S/ 36.00', status: 'Active' },
            { id: '6', name: 'Bob Kozak', type: 'Equipment (Móvil Van #04)', timezone: 'UTC-05:00 Lima', rate: 'S/ 25.00', status: 'Active' },
            { id: '7', name: 'Brady Hannon', type: 'User (Especialista Averías)', timezone: 'UTC-05:00 Lima', rate: 'S/ 40.00', status: 'Active' },
            { id: '8', name: 'Cheri Castaneda', type: 'User (Técnico Campo)', timezone: 'UTC-05:00 Lima', rate: 'S/ 35.00', status: 'Active' },
            { id: '9', name: 'Christal Robles', type: 'User (Instalador Senior)', timezone: 'UTC-05:00 Lima', rate: 'S/ 45.00', status: 'Active' },
            { id: '10', name: 'Christie Dawson', type: 'User (Técnico Lima Norte)', timezone: 'UTC-05:00 Lima', rate: 'S/ 38.00', status: 'Active' },
            { id: '11', name: 'Clarence Desimone', type: 'User (Técnico Lima Sur)', timezone: 'UTC-05:00 Lima', rate: 'S/ 38.00', status: 'Active' },
            { id: '12', name: 'Davis Flournoy', type: 'User (Instalador)', timezone: 'UTC-05:00 Lima', rate: 'S/ 35.00', status: 'Active' },
          ],
        };

      case 'schedule-board':
      case 'bookings':
        return {
          name: 'Reservas (Bookings)',
          viewTitle: 'Active Bookable Resource Bookings',
          icon: 'schedule',
          columns: [
            { key: 'name', title: 'Orden / Reserva', width: '240px', sortable: true, dataType: 'text', primaryLink: true },
            { key: 'resource', title: 'Recurso Asignado', width: '200px', sortable: true, dataType: 'text' },
            { key: 'bookingStatus', title: 'Estado Reserva', width: '130px', sortable: true, dataType: 'text', align: 'center' },
            { key: 'startTime', title: 'Hora Inicio', width: '150px', sortable: true, dataType: 'text' },
            { key: 'endTime', title: 'Hora Fin', width: '150px', sortable: true, dataType: 'text' },
            { key: 'duration', title: 'Duración', width: '100px', sortable: true, dataType: 'text' },
          ],
          records: [
            { id: 'b1', name: 'BK-2026-00101 (OT-2026-0045)', resource: 'Abraham McCormick', bookingStatus: 'In Progress', startTime: '2026-09-23 09:00', endTime: '2026-09-23 11:30', duration: '2.5 hrs' },
            { id: 'b2', name: 'BK-2026-00102 (OT-2026-0046)', resource: 'Allison Dickson', bookingStatus: 'Scheduled', startTime: '2026-09-23 11:00', endTime: '2026-09-23 13:00', duration: '2.0 hrs' },
            { id: 'b3', name: 'BK-2026-00103 (OT-2026-0047)', resource: 'Christal Robles', bookingStatus: 'Completed', startTime: '2026-09-23 08:00', endTime: '2026-09-23 09:45', duration: '1.75 hrs' },
          ],
        };

      case 'cases':
        return {
          name: 'Casos e Incidencias',
          viewTitle: 'Active Cases & Incidents',
          icon: 'alert',
          columns: [
            { key: 'name', title: 'Título del Caso', width: '320px', sortable: true, dataType: 'text', primaryLink: true },
            { key: 'customer', title: 'Cliente / Cuenta', width: '220px', sortable: true, dataType: 'text' },
            { key: 'priority', title: 'Prioridad', width: '110px', sortable: true, dataType: 'text', align: 'center' },
            { key: 'origin', title: 'Origen', width: '130px', sortable: true, dataType: 'text' },
            { key: 'status', title: 'Estado', width: '110px', sortable: true, dataType: 'text', align: 'center' },
          ],
          records: [
            { id: 'c1', name: 'CAS-01492 - Pérdida de señal deco principal', customer: 'DIRECTV PERU S.R.L.', priority: 'High', origin: 'Call Center', status: 'Active' },
            { id: 'c2', name: 'CAS-01493 - Reconexión de fibra óptica corte accidental', customer: 'WIN TELECOM S.A.C.', priority: 'Critical', origin: 'Field Alert', status: 'Active' },
            { id: 'c3', name: 'CAS-01494 - Reemplazo de SmartCard dañada', customer: 'BANCO DE CREDITO DEL PERU', priority: 'Normal', origin: 'Portal Web', status: 'Active' },
          ],
        };

      case 'agreements':
        return {
          name: 'Acuerdos de Servicio (SLA)',
          viewTitle: 'Active Service Agreements',
          icon: 'snippets',
          columns: [
            { key: 'name', title: 'Número de Acuerdo', width: '320px', sortable: true, dataType: 'text', primaryLink: true },
            { key: 'account', title: 'Cuenta de Servicio', width: '220px', sortable: true, dataType: 'text' },
            { key: 'startDate', title: 'Fecha Inicio', width: '130px', sortable: true, dataType: 'date' },
            { key: 'endDate', title: 'Fecha Fin', width: '130px', sortable: true, dataType: 'date' },
            { key: 'status', title: 'Estado', width: '110px', sortable: true, dataType: 'text', align: 'center' },
          ],
          records: [
            { id: 'a1', name: 'AGR-2026-DTV - Mantenimiento Operativo Nacional', account: 'DIRECTV PERU S.R.L.', startDate: '2026-01-01', endDate: '2026-12-31', status: 'Active' },
            { id: 'a2', name: 'AGR-2026-WIN - Despliegue de Última Milla FTTH', account: 'WIN TELECOM S.A.C.', startDate: '2026-03-01', endDate: '2027-02-28', status: 'Active' },
          ],
        };

      case 'assets':
        return {
          name: 'Activos del Cliente',
          viewTitle: 'Active Customer Assets',
          icon: 'database',
          columns: [
            { key: 'name', title: 'Nombre del Activo', width: '250px', sortable: true, dataType: 'text', primaryLink: true },
            { key: 'account', title: 'Cliente / Cuenta', width: '220px', sortable: true, dataType: 'text' },
            { key: 'serial', title: 'Número de Serie', width: '160px', sortable: true, dataType: 'text' },
            { key: 'product', title: 'Producto Asociado', width: '200px', sortable: true, dataType: 'text' },
            { key: 'status', title: 'Estado', width: '110px', sortable: true, dataType: 'text', align: 'center' },
          ],
          records: [
            { id: 'ast1', name: 'Decodificador 4K UHD #01', account: 'DIRECTV PERU S.R.L.', serial: 'DTV-4K-889921', product: 'Decodificador 4K DTV', status: 'Active' },
            { id: 'ast2', name: 'Router ONT Dual Band WiFi 6', account: 'WIN TELECOM S.A.C.', serial: 'ONT-WF6-45520', product: 'ONT Huawei HG8145V5', status: 'Active' },
            { id: 'ast3', name: 'Antena Parabólica Ku 60cm', account: 'DIRECTV PERU S.R.L.', serial: 'ANT-KU-77821', product: 'Kit Antena Ku', status: 'Active' },
          ],
        };

      default:
        return {
          name: key.replace('-', ' ').toUpperCase(),
          viewTitle: `Active ${key.replace('-', ' ')}`,
          icon: 'appstore',
          columns: [
            { key: 'name', title: 'Nombre', width: '280px', sortable: true, dataType: 'text', primaryLink: true },
            { key: 'description', title: 'Descripción', width: '350px', sortable: true, dataType: 'text' },
            { key: 'status', title: 'Estado', width: '110px', sortable: true, dataType: 'text', align: 'center' },
          ],
          records: [
            { id: '1', name: `Registro ${key} #01`, description: 'Configurado en el catálogo de Field Service', status: 'Active' },
            { id: '2', name: `Registro ${key} #02`, description: 'Configurado en el catálogo de Field Service', status: 'Active' },
            { id: '3', name: `Registro ${key} #03`, description: 'Configurado en el catálogo de Field Service', status: 'Active' },
          ],
        };
    }
  }
}
