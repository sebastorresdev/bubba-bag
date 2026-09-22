import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServicioCampoService } from '../../services/servicio-campo.service';
import {
  ServicioItemDto,
  CatalogoServicioDto,
  ImportarServiciosResultadoDto,
} from '../../models/servicio-campo-catalogos.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

@Component({
  selector: 'app-servicios-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzCardModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzAvatarModule,
    NzBadgeModule,
    NzSpinModule,
    NzAlertModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './servicios-list.html',
  styleUrl: './servicios-list.component.css',
})
export class ServiciosListComponent implements OnInit {
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  servicios: ServicioItemDto[] = [];
  serviciosFiltrados: ServicioItemDto[] = [];
  catalogos: CatalogoServicioDto[] = [];
  catalogoSeleccionadoId?: string;

  loading = false;
  searchTerm = '';
  vistaActual = 'Activos';
  vistaActualTitulo = 'Servicios Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Servicios Activos', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Servicios Inactivos', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Servicios', esSistema: true },
  ];

  onVistaChange(vista: VistaItem): void {
    this.cambiarVista(vista.key);
  }

  columnas: ColumnDef<ServicioItemDto>[] = [
    {
      key: 'codigo',
      title: 'Código',
      width: '120px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'nombre',
      title: 'Nombre del Servicio',
      width: '300px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
      canHide: false,
    },
    {
      key: 'catalogoServicioNombre',
      title: 'Catálogo',
      width: '180px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'precioBase',
      title: 'Precio Base',
      width: '110px',
      align: 'right',
      sortable: true,
      dataType: 'currency',
    },
    {
      key: 'duracionEstimadaMinutos',
      title: 'Duración',
      width: '100px',
      align: 'center',
      sortable: true,
      dataType: 'number',
    },
    {
      key: 'cantidadPasos',
      title: 'Checklist',
      width: '100px',
      align: 'center',
      sortable: true,
      dataType: 'number',
    },
    {
      key: 'cantidadMateriales',
      title: 'Materiales',
      width: '100px',
      align: 'center',
      sortable: true,
      dataType: 'number',
    },
    {
      key: 'codigoExterno',
      title: 'Código Ext.',
      width: '120px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'activo',
      title: 'Estado',
      width: '100px',
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

  selectedIds = new Set<string>();

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;
    this.cdr.markForCheck();
  }

  // Estado del Modal de Importación Excel
  modalImportacionVisible = false;
  archivoSeleccionado: File | null = null;
  importando = false;
  descargandoPlantilla = false;
  resultadoImportacion: ImportarServiciosResultadoDto | null = null;

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarDatos();
  }

  get commandBarItems(): CommandBarItem[] {
    const haySeleccion = this.selectedIds.size > 0;
    const esUnicoSeleccionado = this.selectedIds.size === 1;

    let itemSeleccionado: ServicioItemDto | undefined;
    if (esUnicoSeleccionado) {
      const id = Array.from(this.selectedIds)[0];
      itemSeleccionado = this.servicios.find((s) => s.id === id);
    }

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nueva plantilla de servicio',
        execute: () => this.irANuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnicoSeleccionado,
        tooltip: 'Editar el servicio seleccionado',
        execute: () => {
          if (itemSeleccionado) {
            this.editar(itemSeleccionado.id);
          }
        },
      },
      {
        key: 'import',
        label: 'Importar Excel',
        icon: 'file-excel',
        iconColor: 'excel',
        tooltip: 'Importar lista de servicios desde un archivo Excel (.xlsx)',
        execute: () => this.abrirModalImportacion(),
      },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        iconColor: 'excel',
        tooltip: 'Exportar servicios visibles a Excel (.csv)',
        execute: () => this.exportarExcel(),
      },
      {
        key: 'template',
        label: 'Descargar Plantilla',
        icon: 'file-excel',
        iconColor: 'excel',
        tooltip: 'Descargar plantilla oficial de Excel con catálogos actuales',
        execute: () => this.descargarPlantilla(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de servicios',
        execute: () => this.cargarDatos(),
      },
    ];
  }

  cargarCatalogos(): void {
    this.servicioCampoService.getCatalogosServicio(undefined, undefined, true).subscribe({
      next: (data) => {
        this.catalogos = data;
        this.cdr.markForCheck();
      },
    });
  }

  cargarDatos(): void {
    this.loading = true;
    this.selectedIds.clear();
    this.cdr.markForCheck();

    let soloActivos: boolean | undefined = undefined;
    if (this.vistaActual === 'Activos') soloActivos = true;
    if (this.vistaActual === 'Inactivos') soloActivos = false;

    this.servicioCampoService.getServicios(this.catalogoSeleccionadoId, soloActivos).subscribe({
      next: (data) => {
        this.servicios = data;
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar la lista de servicios.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: string): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activos':
        this.vistaActualTitulo = 'Servicios Activos';
        break;
      case 'Todos':
        this.vistaActualTitulo = 'Todos los Servicios';
        break;
      case 'Inactivos':
        this.vistaActualTitulo = 'Servicios Inactivos';
        break;
    }
    this.cargarDatos();
  }

  onCatalogoFilterChange(): void {
    this.cargarDatos();
  }

  onSearchChange(): void {
    this.aplicarFiltrosLocales();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltrosLocales();
  }

  aplicarFiltrosLocales(): void {
    let result = [...this.servicios];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.codigo.toLowerCase().includes(term) ||
          s.nombre.toLowerCase().includes(term) ||
          s.catalogoServicioNombre.toLowerCase().includes(term) ||
          (s.codigoExterno && s.codigoExterno.toLowerCase().includes(term))
      );
    }

    this.serviciosFiltrados = result;
    this.cdr.markForCheck();
  }

  get isAllSelected(): boolean {
    return (
      this.serviciosFiltrados.length > 0 &&
      this.serviciosFiltrados.every((s) => this.selectedIds.has(s.id))
    );
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.serviciosFiltrados.filter((s) => this.selectedIds.has(s.id)).length;
    return selectedCount > 0 && selectedCount < this.serviciosFiltrados.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.serviciosFiltrados.forEach((s) => this.selectedIds.add(s.id));
    } else {
      this.selectedIds.clear();
    }
    this.cdr.markForCheck();
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.cdr.markForCheck();
  }

  irANuevo(): void {
    this.router.navigate(['/servicio-campo/servicios/nuevo']);
  }

  editar(id: string): void {
    this.router.navigate(['/servicio-campo/servicios/editar', id]);
  }

  // =========================================================================
  // MÉTODOS DE IMPORTACIÓN Y PLANTILLA EXCEL
  // =========================================================================
  descargarPlantilla(): void {
    this.descargandoPlantilla = true;
    this.message.loading('Generando plantilla Excel con catálogos actuales...', { nzDuration: 2000 });
    this.servicioCampoService.descargarPlantillaServiciosExcel().subscribe({
      next: (blob) => {
        this.descargandoPlantilla = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Plantilla_Importacion_Servicios.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.message.success('Plantilla descargada correctamente.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.descargandoPlantilla = false;
        this.message.error('No se pudo generar la plantilla Excel.');
        this.cdr.markForCheck();
      },
    });
  }

  exportarExcel(): void {
    if (this.serviciosFiltrados.length === 0) {
      this.message.warning('No hay servicios para exportar.');
      return;
    }

    const headers = [
      'Codigo',
      'Nombre',
      'Catalogo',
      'DuracionMinutos',
      'PasosChecklist',
      'Materiales',
      'CodigoExterno',
      'Estado',
    ];

    const rows = this.serviciosFiltrados.map((s) => [
      `"${s.codigo || ''}"`,
      `"${(s.nombre || '').replace(/"/g, '""')}"`,
      `"${(s.catalogoServicioNombre || '').replace(/"/g, '""')}"`,
      s.duracionEstimadaMinutos ?? 0,
      s.cantidadPasos ?? 0,
      s.cantidadMateriales ?? 0,
      `"${s.codigoExterno || ''}"`,
      s.activo ? 'ACTIVO' : 'INACTIVO',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Servicios_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    this.message.success('Servicios exportados correctamente.');
  }

  abrirModalImportacion(): void {
    this.modalImportacionVisible = true;
    this.archivoSeleccionado = null;
    this.resultadoImportacion = null;
    this.importando = false;
    this.cdr.markForCheck();
  }

  cerrarModalImportacion(): void {
    const huboCambios =
      this.resultadoImportacion &&
      (this.resultadoImportacion.totalImportados > 0 || this.resultadoImportacion.totalActualizados > 0);
    this.modalImportacionVisible = false;
    this.archivoSeleccionado = null;
    this.resultadoImportacion = null;
    this.importando = false;
    if (huboCambios) {
      this.cargarDatos();
    }
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoSeleccionado = input.files[0];
      this.resultadoImportacion = null;
      this.cdr.markForCheck();
    }
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        this.archivoSeleccionado = file;
        this.resultadoImportacion = null;
        this.cdr.markForCheck();
      } else {
        this.message.warning('Por favor seleccione únicamente un archivo Excel (.xlsx).');
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  quitarArchivo(): void {
    this.archivoSeleccionado = null;
    this.resultadoImportacion = null;
    this.cdr.markForCheck();
  }

  ejecutarImportacion(): void {
    if (!this.archivoSeleccionado) {
      this.message.warning('Debe seleccionar un archivo Excel para procesar.');
      return;
    }

    this.importando = true;
    this.resultadoImportacion = null;
    this.cdr.markForCheck();

    this.servicioCampoService.importarServiciosExcel(this.archivoSeleccionado).subscribe({
      next: (res) => {
        this.importando = false;
        this.resultadoImportacion = res;
        if (res.totalImportados > 0 || res.totalActualizados > 0) {
          this.message.success(
            `Proceso finalizado: ${res.totalImportados} nuevos servicios creados, ${res.totalActualizados} actualizados.`
          );
        } else if (res.errores.length > 0) {
          this.message.error('El archivo contiene observaciones que impidieron la importación.');
        } else {
          this.message.info('No se encontraron registros de servicios en el archivo.');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.importando = false;
        const msg = err.error?.message || 'Ocurrió un error al procesar el archivo Excel.';
        this.message.error(msg);
        this.cdr.markForCheck();
      },
    });
  }

  formatearBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getIniciales(codigo?: string, nombre?: string): string {
    if (codigo && codigo.trim()) {
      return codigo.trim().substring(0, 3).toUpperCase();
    }
    if (!nombre || !nombre.trim()) return 'SV';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.trim().substring(0, 2).toUpperCase();
  }

  getColor(codigo: string): string {
    let hash = 0;
    for (let i = 0; i < codigo.length; i++) {
      hash = codigo.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#0078d4', '#107c41', '#8764b8', '#008272', '#d13438',
      '#e3008c', '#5c2e91', '#498205', '#004e8c', '#ffaa00'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
