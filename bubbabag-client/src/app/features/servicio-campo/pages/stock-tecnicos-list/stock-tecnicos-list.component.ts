import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzCardModule } from 'ng-zorro-antd/card';

import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import {
  EntityTableComponent,
  CellDefDirective,
  ColumnDef,
} from '../../../../shared/components/entity-table';
import { VistaItem } from '../../../../shared/components/view-selector';

import { AlmacenService } from '../../services/almacen.service';
import { ResumenAlmacenMovilDto } from '../../models/almacen.model';

@Component({
  selector: 'app-stock-tecnicos-list',
  standalone: true,
  imports: [
    CommonModule,
    NzTagModule,
    NzIconModule,
    NzButtonModule,
    NzDividerModule,
    NzSpinModule,
    NzTooltipModule,
    NzDrawerModule,
    NzCardModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './stock-tecnicos-list.html',
  styleUrl: './stock-tecnicos-list.component.css',
})
export class StockTecnicosListComponent implements OnInit, OnDestroy {
  private almacenService = inject(AlmacenService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  almacenesMoviles: ResumenAlmacenMovilDto[] = [];
  almacenesFiltrados: ResumenAlmacenMovilDto[] = [];
  loading = false;

  // Drawer de detalle
  drawerVisible = false;
  tecnicoSeleccionado: ResumenAlmacenMovilDto | null = null;

  // ─── Vistas D365 ─────────────────────────────────────────────────────────
  vistaActual = 'Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Técnicos Activos', esSistema: true, esPredeterminada: true },
    { key: 'ConCarga', nombre: 'Con Material a Bordo', esSistema: true },
    { key: 'SinCarga', nombre: 'Sin Carga (Vacíos)', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Almacenes Móviles', esSistema: true },
  ];

  onVistaChange(vista: VistaItem): void {
    this.vistaActual = vista.key;
    this.aplicarFiltros();
  }

  // ─── Columnas ─────────────────────────────────────────────────────────────
  columnas: ColumnDef<ResumenAlmacenMovilDto>[] = [
    { key: 'codigoAlmacen', title: 'Código Camioneta', width: '130px', sortable: true, dataType: 'text', primaryLink: true, canHide: false },
    { key: 'nombreAlmacen', title: 'Técnico / Unidad Móvil', width: '280px', sortable: true, dataType: 'text', canHide: false },
    { key: 'totalProductos', title: 'Tipos de Material', width: '140px', align: 'center', sortable: true, dataType: 'number' },
    { key: 'totalUnidades', title: 'Total Unidades a Bordo', width: '170px', align: 'center', sortable: true, dataType: 'number' },
    { key: 'totalSeries', title: 'Equipos Seriados', width: '140px', align: 'center', sortable: true, dataType: 'number' },
    { key: 'activo', title: 'Estado', width: '100px', align: 'center', sortable: true, dataType: 'boolean' },
  ];

  // ─── Selección de filas ───────────────────────────────────────────────────
  setOfCheckedId = new Set<string>();
  selectedTecnico: ResumenAlmacenMovilDto | null = null;

  onSelectedIdsChange(ids: Set<string>): void {
    this.setOfCheckedId = ids;
    this.selectedTecnico =
      ids.size === 1
        ? (this.almacenesMoviles.find((a) => a.almacenId === Array.from(ids)[0]) ?? null)
        : null;
    this.cdr.markForCheck();
  }

  // ─── Búsqueda ─────────────────────────────────────────────────────────────
  searchTerm = '';
  searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // ─── CommandBar ───────────────────────────────────────────────────────────
  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'detail',
        label: 'Ver Detalle de Carga',
        icon: 'profile',
        iconColor: 'primary',
        disabled: this.setOfCheckedId.size !== 1,
        tooltip:
          this.setOfCheckedId.size !== 1
            ? 'Selecciona un técnico para consultar su saldo'
            : `Consultar saldo de "${this.selectedTecnico?.nombreAlmacen}"`,
        execute: () => {
          if (this.selectedTecnico) this.abrirDetalle(this.selectedTecnico);
        },
      },
      { key: 'd1', isDivider: true },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        iconColor: 'success',
        split: true,
        tooltip: 'Exportar inventario de técnicos a Excel (.csv)',
        execute: () => this.exportarCsv(),
        children: [
          {
            key: 'csv',
            label: 'Descargar Archivo (.csv)',
            icon: 'file-text',
            execute: () => this.exportarCsv(),
          },
        ],
      },
      { key: 'd2', isDivider: true },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar saldo de los técnicos',
        execute: () => this.cargarStockTecnicos(),
      },
    ];
  }

  farItems: CommandBarItem[] = [];

  // ─── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.aplicarFiltros());

    this.cargarStockTecnicos();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  // ─── Carga de datos ───────────────────────────────────────────────────────
  cargarStockTecnicos(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.almacenService.getStockTecnicos(false).subscribe({
      next: (data) => {
        this.almacenesMoviles = data || [];
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudo cargar el saldo de los técnicos.');
        this.cdr.markForCheck();
      },
    });
  }

  aplicarFiltros(): void {
    let list = [...this.almacenesMoviles];

    switch (this.vistaActual) {
      case 'Activos':
        list = list.filter((a) => a.activo);
        break;
      case 'ConCarga':
        list = list.filter((a) => a.totalUnidades > 0 && a.activo);
        break;
      case 'SinCarga':
        list = list.filter((a) => a.totalUnidades === 0 && a.activo);
        break;
      case 'Todos':
      default:
        break;
    }

    const term = this.searchTerm?.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (a) =>
          a.codigoAlmacen.toLowerCase().includes(term) ||
          a.nombreAlmacen.toLowerCase().includes(term)
      );
    }

    this.almacenesFiltrados = list;
    this.cdr.markForCheck();
  }

  // ─── Drawer Detalle ───────────────────────────────────────────────────────
  abrirDetalle(tecnico: ResumenAlmacenMovilDto): void {
    this.tecnicoSeleccionado = tecnico;
    this.drawerVisible = true;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.drawerVisible = false;
    this.tecnicoSeleccionado = null;
    this.cdr.markForCheck();
  }

  // ─── Exportar CSV ─────────────────────────────────────────────────────────
  exportarCsv(): void {
    if (this.almacenesFiltrados.length === 0) {
      this.message.warning('No hay datos para exportar.');
      return;
    }

    const headers = ['Código Almacén', 'Técnico / Camioneta', 'Tipos de Material', 'Total Unidades', 'Equipos Seriados', 'Estado'];
    const rows = this.almacenesFiltrados.map((a) => [
      `"${a.codigoAlmacen}"`,
      `"${a.nombreAlmacen}"`,
      a.totalProductos,
      a.totalUnidades,
      a.totalSeries,
      a.activo ? 'ACTIVO' : 'INACTIVO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `saldo_tecnicos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.message.success('Reporte de saldos de técnicos exportado exitosamente.');
  }
}
