import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClienteService } from '../../services/cliente.service';
import { ClienteListadoItemDto } from '../../models/cliente.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzPopconfirmModule,
    NzInputModule,
    NzTagModule,
    NzSelectModule,
    NzTooltipModule,
    NzCardModule,
    NzEmptyModule,
    NzAvatarModule,
    NzCheckboxModule,
    NzDropdownModule,
    NzDrawerModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './clientes-list.html',
  styleUrl: './clientes-list.component.css',
})
export class ClientesListComponent implements OnInit, OnDestroy {
  private clienteService = inject(ClienteService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  clientes: ClienteListadoItemDto[] = [];
  clientesFiltrados: ClienteListadoItemDto[] = [];
  loading = false;

  // Vistas de Sistema (Dynamics 365 View Selector)
  vistaActual: 'Activos' | 'Todos' | 'Facturacion' | 'Servicio' | 'Inactivos' = 'Activos';
  drawerFiltrosVisible = false;
  drawerColumnasVisible = false;

  // Definición de Columnas Visibles (Dynamics 365 Edit Columns)
  columnas = [
    { key: 'codigo', label: 'Código', visible: true, required: false },
    { key: 'cliente', label: 'Cliente / Razón Social', visible: true, required: true },
    { key: 'contacto', label: 'Contacto', visible: true, required: false },
    { key: 'tipoPersona', label: 'Tipo Persona', visible: true, required: false },
    { key: 'tipoDocumento', label: 'Tipo Doc.', visible: true, required: false },
    { key: 'documento', label: 'N° Documento', visible: true, required: false },
    { key: 'telefono', label: 'Teléfono', visible: true, required: false },
    { key: 'email', label: 'Correo Electrónico', visible: true, required: false },
    { key: 'direccion', label: 'Dirección', visible: true, required: false },
    { key: 'distrito', label: 'Distrito', visible: true, required: false },
    { key: 'provincia', label: 'Provincia / Ciudad', visible: true, required: false },
    { key: 'departamento', label: 'Departamento', visible: false, required: false },
    { key: 'clasificacion', label: 'Clasificación', visible: true, required: false },
    { key: 'estado', label: 'Estado', visible: true, required: false },
  ];

  toggleColumnasDrawer(): void {
    this.drawerColumnasVisible = !this.drawerColumnasVisible;
  }

  toggleFiltrosDrawer(): void {
    this.drawerFiltrosVisible = !this.drawerFiltrosVisible;
  }

  isColVisible(key: string): boolean {
    const col = this.columnas.find((c) => c.key === key);
    return col ? col.visible : true;
  }

  restablecerColumnas(): void {
    this.columnas.forEach((c) => (c.visible = true));
  }

  // Filtros
  searchTerm = '';
  searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  filtroTipoPersona: string | null = null;
  filtroClasificacion: string | null = null;

  get vistaActualTitulo(): string {
    switch (this.vistaActual) {
      case 'Activos':
        return 'Clientes Activos';
      case 'Todos':
        return 'Todos los Clientes';
      case 'Facturacion':
        return 'Clientes de Facturación';
      case 'Servicio':
        return 'Clientes de Servicio (Sedes)';
      case 'Inactivos':
        return 'Clientes Inactivos';
      default:
        return 'Clientes Activos';
    }
  }

  get filtrosActivosCount(): number {
    let count = 0;
    if (this.filtroTipoPersona) count++;
    if (this.filtroClasificacion) count++;
    if (this.searchTerm) count++;
    return count;
  }

  // Selección de Filas (NG-ZORRO Native Table Selection)
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<string>();
  listOfCurrentPageData: readonly ClienteListadoItemDto[] = [];
  selectedCliente: ClienteListadoItemDto | null = null;

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  onCurrentPageDataChange(listOfCurrentPageData: readonly ClienteListadoItemDto[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    const checked =
      this.listOfCurrentPageData.length > 0 &&
      this.listOfCurrentPageData.every(({ id }) => this.setOfCheckedId.has(id));
    this.checked = checked;
    this.indeterminate =
      this.listOfCurrentPageData.some(({ id }) => this.setOfCheckedId.has(id)) && !checked;

    if (this.setOfCheckedId.size === 1) {
      const selectedId = Array.from(this.setOfCheckedId)[0];
      this.selectedCliente = this.clientes.find((c) => c.id === selectedId) || null;
    } else {
      this.selectedCliente = null;
    }
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.listOfCurrentPageData.forEach(({ id }) => this.updateCheckedSet(id, checked));
    this.refreshCheckedStatus();
  }

  onRowClick(cliente: ClienteListadoItemDto, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.closest('.ant-checkbox-wrapper') ||
      target.closest('.ant-btn') ||
      target.closest('a')
    ) {
      return;
    }

    const isChecked = this.setOfCheckedId.has(cliente.id);
    this.updateCheckedSet(cliente.id, !isChecked);
    this.refreshCheckedStatus();
  }

  // Barra de Comandos Dynamics 365 con diseño idéntico al estándar institucional
  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Registrar un nuevo cliente',
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
            ? 'Selecciona exactamente un cliente para editar'
            : `Editar a ${this.selectedCliente?.nombreCompletoODenominacion}`,
        execute: () => {
          if (this.selectedCliente) {
            this.editarCliente(this.selectedCliente.id);
          }
        },
      },
      {
        key: 'delete',
        label: this.selectedCliente?.activo === false ? 'Activar' : 'Dar de Baja',
        icon: 'user-delete',
        danger: true,
        iconColor: 'danger',
        disabled: this.setOfCheckedId.size !== 1,
        tooltip:
          this.setOfCheckedId.size !== 1
            ? 'Selecciona un cliente para cambiar su estado'
            : this.selectedCliente?.activo
              ? 'Dar de baja al cliente seleccionado'
              : 'Reactivar al cliente seleccionado',
        execute: () => {
          if (this.selectedCliente) {
            this.toggleEstado(this.selectedCliente);
          }
        },
      },
      { key: 'd1', isDivider: true },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        iconColor: 'success',
        split: true,
        tooltip: 'Exportar clientes directamente a Excel (.xlsx)',
        execute: () => this.exportarCsv(),
        children: [
          {
            key: 'xlsx',
            label: 'Descargar Excel (.xlsx)',
            icon: 'file-excel',
            iconColor: 'success',
            execute: () => this.exportarCsv(),
          },
          {
            key: 'csv',
            label: 'Descargar CSV (.csv)',
            icon: 'file-excel',
            iconColor: 'success',
            execute: () => this.exportarCsv(),
          },
        ],
      },
      { key: 'd2', isDivider: true },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de clientes',
        execute: () => this.cargarClientes(),
      },
    ];
  }

  farItems: CommandBarItem[] = [];

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.aplicarFiltros();
      });

    this.cargarClientes();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  cargarClientes(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data || [];
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudo cargar la lista de clientes.');
        this.cdr.markForCheck();
      },
    });
  }

  onSearchTermChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroTipoPersona = null;
    this.filtroClasificacion = null;
    this.aplicarFiltros();
  }

  cambiarVista(vista: 'Activos' | 'Todos' | 'Facturacion' | 'Servicio' | 'Inactivos'): void {
    this.vistaActual = vista;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let list = [...this.clientes];

    // Filtro por Vista
    switch (this.vistaActual) {
      case 'Activos':
        list = list.filter((c) => c.activo);
        break;
      case 'Facturacion':
        list = list.filter((c) => c.esClienteFacturacion && c.activo);
        break;
      case 'Servicio':
        list = list.filter((c) => c.esClienteServicio && c.activo);
        break;
      case 'Inactivos':
        list = list.filter((c) => !c.activo);
        break;
      case 'Todos':
      default:
        break;
    }

    // Filtro adicional por Tipo Persona
    if (this.filtroTipoPersona) {
      list = list.filter((c) => c.tipoPersona === this.filtroTipoPersona);
    }

    // Filtro adicional por Clasificación
    if (this.filtroClasificacion === 'Facturacion') {
      list = list.filter((c) => c.esClienteFacturacion);
    } else if (this.filtroClasificacion === 'Servicio') {
      list = list.filter((c) => c.esClienteServicio);
    }

    // Filtro por búsqueda de texto
    const term = this.searchTerm?.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (c) =>
          c.codigoCliente.toLowerCase().includes(term) ||
          c.documentoIdentidad.toLowerCase().includes(term) ||
          c.nombreCompletoODenominacion.toLowerCase().includes(term) ||
          (c.nombres && c.nombres.toLowerCase().includes(term)) ||
          (c.apellidos && c.apellidos.toLowerCase().includes(term)) ||
          c.telefonoPrincipal.toLowerCase().includes(term) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.distrito && c.distrito.toLowerCase().includes(term)) ||
          (c.provincia && c.provincia.toLowerCase().includes(term))
      );
    }

    this.clientesFiltrados = list;
    this.refreshCheckedStatus();
    this.cdr.markForCheck();
  }

  crearNuevo(): void {
    this.router.navigate(['/crm/clientes/nuevo']);
  }

  editarCliente(id: string): void {
    this.router.navigate(['/crm/clientes/editar', id]);
  }

  toggleEstado(cliente: ClienteListadoItemDto, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const nuevoEstado = !cliente.activo;
    this.clienteService.cambiarEstado(cliente.id, nuevoEstado).subscribe({
      next: (res) => {
        cliente.activo = nuevoEstado;
        this.message.success(res.message || 'Estado actualizado con éxito.');
        this.aplicarFiltros();
      },
      error: () => {
        this.message.error('No se pudo actualizar el estado del cliente.');
      },
    });
  }

  exportarCsv(): void {
    if (this.clientesFiltrados.length === 0) {
      this.message.warning('No hay datos para exportar.');
      return;
    }

    const headers = [
      'Código',
      'Tipo Persona',
      'Tipo Doc',
      'N° Documento',
      'Nombre / Razón Social',
      'Teléfono',
      'Email',
      'Dirección',
      'Distrito',
      'Provincia',
      'Facturación',
      'Servicio',
      'Estado',
    ];

    const rows = this.clientesFiltrados.map((c) => [
      `"${c.codigoCliente}"`,
      `"${c.tipoPersona}"`,
      `"${c.tipoDocumento}"`,
      `"${c.documentoIdentidad}"`,
      `"${c.nombreCompletoODenominacion}"`,
      `"${c.telefonoPrincipal}"`,
      `"${c.email || ''}"`,
      `"${c.direccion}"`,
      `"${c.distrito}"`,
      `"${c.provincia}"`,
      c.esClienteFacturacion ? 'SÍ' : 'NO',
      c.esClienteServicio ? 'SÍ' : 'NO',
      c.activo ? 'ACTIVO' : 'INACTIVO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_crm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.message.success('Archivo exportado exitosamente.');
  }

  getIniciales(nombre: string): string {
    if (!nombre) return 'CL';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }
}
