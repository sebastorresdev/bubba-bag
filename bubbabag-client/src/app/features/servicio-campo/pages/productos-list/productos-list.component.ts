import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import {
  EntityTableComponent,
  CellDefDirective,
  ColumnDef,
} from '../../../../shared/components/entity-table';
import { VistaItem } from '../../../../shared/components/view-selector';

import { ProductoService } from '../../services/producto.service';
import { ProductoDto, TipoProducto } from '../../models/producto.model';

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [
    CommonModule,
    NzTagModule,
    NzIconModule,
    NzButtonModule,
    NzDividerModule,
    NzSpinModule,
    NzTooltipModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  providers: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './productos-list.html',
  styleUrl: './productos-list.component.css',
})
export class ProductosListComponent implements OnInit, OnDestroy {
  private productoService = inject(ProductoService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private decimalPipe = inject(DecimalPipe);

  productos: ProductoDto[] = [];
  productosFiltrados: ProductoDto[] = [];
  loading = false;

  // ─── Vistas D365 ─────────────────────────────────────────────────────────
  vistaActual = 'Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Productos Activos', esSistema: true, esPredeterminada: true },
    { key: 'Inventario', nombre: 'Materiales y Equipos (Físicos)', esSistema: true },
    { key: 'Servicio', nombre: 'Servicios y Mano de Obra', esSistema: true },
    { key: 'Seriados', nombre: 'Equipos con Trazabilidad (Series)', esSistema: true },
    { key: 'Inactivos', nombre: 'Productos Inactivos', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Productos', esSistema: true },
  ];

  onVistaChange(vista: VistaItem): void {
    this.vistaActual = vista.key;
    this.aplicarFiltros();
  }

  // ─── Columnas ─────────────────────────────────────────────────────────────
  columnas: ColumnDef<ProductoDto>[] = [
    { key: 'codigo', title: 'Código', width: '120px', sortable: true, dataType: 'text', primaryLink: true, canHide: false },
    { key: 'nombre', title: 'Nombre / Descripción', width: '280px', sortable: true, dataType: 'text', canHide: false },
    { key: 'categoria', title: 'Categoría', width: '140px', sortable: true, dataType: 'text' },
    { key: 'tipo', title: 'Tipo', width: '130px', sortable: true, dataType: 'text' },
    { key: 'unidadMedida', title: 'U.M.', width: '100px', align: 'center', sortable: true, dataType: 'text' },
    { key: 'esSerializado', title: 'Serializado', width: '110px', align: 'center', sortable: true, dataType: 'boolean' },
    { key: 'precioBase', title: 'Precio Base', width: '120px', align: 'right', sortable: true, dataType: 'currency' },
    { key: 'activo', title: 'Estado', width: '100px', align: 'center', sortable: true, dataType: 'boolean' },
  ];

  // ─── Selección de filas ───────────────────────────────────────────────────
  setOfCheckedId = new Set<string>();
  selectedProducto: ProductoDto | null = null;

  onSelectedIdsChange(ids: Set<string>): void {
    this.setOfCheckedId = ids;
    this.selectedProducto =
      ids.size === 1
        ? (this.productos.find((p) => p.id === Array.from(ids)[0]) ?? null)
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
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Registrar un nuevo producto en página dedicada',
        execute: () => this.crearNuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: this.setOfCheckedId.size !== 1,
        tooltip:
          this.setOfCheckedId.size !== 1
            ? 'Selecciona un producto para editar'
            : `Editar "${this.selectedProducto?.nombre}"`,
        execute: () => {
          if (this.selectedProducto) this.editarProducto(this.selectedProducto.id);
        },
      },
      {
        key: 'toggle',
        label: this.selectedProducto?.activo === false ? 'Activar' : 'Desactivar',
        icon: this.selectedProducto?.activo === false ? 'check-circle' : 'stop',
        danger: this.selectedProducto?.activo !== false,
        iconColor: this.selectedProducto?.activo === false ? 'success' : 'danger',
        disabled: this.setOfCheckedId.size !== 1,
        tooltip:
          this.setOfCheckedId.size !== 1
            ? 'Selecciona un producto para cambiar su estado'
            : this.selectedProducto?.activo
              ? 'Desactivar el producto seleccionado'
              : 'Reactivar el producto seleccionado',
        execute: () => {
          if (this.selectedProducto) this.toggleEstado(this.selectedProducto);
        },
      },
      { key: 'd1', isDivider: true },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        iconColor: 'success',
        split: true,
        tooltip: 'Descargar catálogo en formato CSV/Excel',
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
        tooltip: 'Recargar catálogo de productos',
        execute: () => this.cargarProductos(),
      },
    ];
  }

  farItems: CommandBarItem[] = [];

  // ─── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.aplicarFiltros());

    this.cargarProductos();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  // ─── Carga de datos ───────────────────────────────────────────────────────
  cargarProductos(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data || [];
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudo cargar el catálogo de productos.');
        this.cdr.markForCheck();
      },
    });
  }

  aplicarFiltros(): void {
    let list = [...this.productos];

    switch (this.vistaActual) {
      case 'Activos':
        list = list.filter((p) => p.activo);
        break;
      case 'Inventario':
        list = list.filter((p) => p.tipo === 'Inventario' && p.activo);
        break;
      case 'Servicio':
        list = list.filter((p) => p.tipo === 'Servicio' && p.activo);
        break;
      case 'Seriados':
        list = list.filter((p) => p.esSerializado && p.activo);
        break;
      case 'Inactivos':
        list = list.filter((p) => !p.activo);
        break;
      case 'Todos':
      default:
        break;
    }

    const term = this.searchTerm?.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          p.codigo.toLowerCase().includes(term) ||
          p.nombre.toLowerCase().includes(term) ||
          p.categoria.toLowerCase().includes(term) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(term))
      );
    }

    this.productosFiltrados = list;
    this.cdr.markForCheck();
  }

  // ─── Navegación a páginas dedicadas ───────────────────────────────────────
  crearNuevo(): void {
    this.router.navigate(['/servicio-campo/materiales/nuevo']);
  }

  editarProducto(id: string): void {
    this.router.navigate(['/servicio-campo/materiales/editar', id]);
  }

  // ─── Toggle Estado ────────────────────────────────────────────────────────
  toggleEstado(producto: ProductoDto): void {
    const nuevoEstado = !producto.activo;
    this.productoService.cambiarEstado(producto.id, nuevoEstado).subscribe({
      next: () => {
        const accion = nuevoEstado ? 'activado' : 'desactivado';
        this.message.success(`Producto ${accion} correctamente.`);
        this.cargarProductos();
      },
      error: () => {
        this.message.error('No se pudo actualizar el estado del producto.');
      },
    });
  }

  // ─── Exportar CSV ─────────────────────────────────────────────────────────
  exportarCsv(): void {
    if (this.productosFiltrados.length === 0) {
      this.message.warning('No hay productos para exportar.');
      return;
    }

    const headers = ['Código', 'Nombre', 'Categoría', 'Tipo', 'U.M.', 'Serializado', 'Precio Base (S/.)', 'Estado'];
    const rows = this.productosFiltrados.map((p) => [
      `"${p.codigo}"`,
      `"${p.nombre}"`,
      `"${p.categoria}"`,
      p.tipo,
      p.unidadMedida,
      p.esSerializado ? 'SÍ' : 'NO',
      p.precioBase.toFixed(2),
      p.activo ? 'ACTIVO' : 'INACTIVO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_productos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.message.success('Catálogo exportado exitosamente.');
  }

  // ─── Helpers de formato ───────────────────────────────────────────────────
  getTipoLabel(tipo: TipoProducto): string {
    switch (tipo) {
      case 'Inventario':
        return 'Inventariable';
      case 'Servicio':
        return 'Servicio';
      case 'NoInventariable':
        return 'Gasto / No Inv.';
      default:
        return tipo;
    }
  }

  getTipoColor(tipo: TipoProducto): string {
    switch (tipo) {
      case 'Inventario':
        return 'blue';
      case 'Servicio':
        return 'purple';
      case 'NoInventariable':
        return 'default';
      default:
        return 'blue';
    }
  }
}
