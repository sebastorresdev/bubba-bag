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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EmpleadoService } from '../../services/empleado.service';
import {
  EmpleadoDto,
  CatalogosRrhhDto,
  DepartamentoCatalogoDto,
  DarDeBajaRequest,
} from '../../models/empleado.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';

@Component({
  selector: 'app-empleados-list',
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
    NzModalModule,
    NzDatePickerModule,
    NzCardModule,
    NzEmptyModule,
    NzAvatarModule,
    NzCheckboxModule,
    NzDrawerModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './empleados-list.html',
  styleUrl: './empleados-list.component.css',
})
export class EmpleadosListComponent implements OnInit {
  private empleadoService = inject(EmpleadoService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  empleados: EmpleadoDto[] = [];
  loading = false;

  // Vistas de Sistema (Dynamics 365 View Selector)
  vistaActual = 'Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Colaboradores Activos', esSistema: true, esPredeterminada: true },
    { key: 'Todos', nombre: 'Todos los Colaboradores', esSistema: true },
    { key: 'Vacaciones', nombre: 'En Vacaciones / Licencia', esSistema: true },
    { key: 'Cesados', nombre: 'Colaboradores Cesados', esSistema: true },
  ];
  drawerFiltrosVisible = false;
  drawerColumnasVisible = false;

  onVistaChange(vista: VistaItem): void {
    this.cambiarVista(vista.key);
  }

  // Definición de Columnas Visibles (Dynamics 365 Edit Columns)
  columnas: ColumnDef[] = [
    {
      key: 'colaborador',
      title: 'Colaborador',
      width: '260px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
      canHide: false,
    },
    {
      key: 'email',
      title: 'Correo Electrónico',
      width: '220px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'documento',
      title: 'Documento',
      width: '160px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'cargoNombre',
      title: 'Cargo',
      width: '200px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'departamentoNombre',
      title: 'Área',
      width: '180px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'tipoContrato',
      title: 'Tipo de Contrato',
      width: '160px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'estado',
      title: 'Estado (KPI)',
      width: '130px',
      align: 'center',
      sortable: true,
      dataType: 'select',
      filterType: 'select',
      filterOptions: [
        { label: 'Activo', value: 'Activo' },
        { label: 'Vacaciones', value: 'Vacaciones' },
        { label: 'Licencia', value: 'Licencia' },
        { label: 'Cesado', value: 'Cesado' },
      ],
    },
    {
      key: 'fechaIngreso',
      title: 'Fecha de Ingreso',
      width: '140px',
      align: 'center',
      sortable: true,
      dataType: 'date',
    },
  ];

  onSelectedIdsChange(ids: Set<string>): void {
    this.setOfCheckedId = ids;
    if (ids.size === 1) {
      const selectedId = Array.from(ids)[0];
      this.selectedEmpleado = this.empleados.find((e) => e.id === selectedId) || null;
    } else {
      this.selectedEmpleado = null;
    }
    this.checked = ids.size > 0 && ids.size === this.empleados.length;
    this.indeterminate = ids.size > 0 && ids.size < this.empleados.length;
    this.cdr.markForCheck();
  }

  // Filtros
  searchTerm = '';
  searchSubject = new Subject<string>();
  filtroEstado = 'Activo';
  filtroDepartamento: string | null = null;

  // Catálogos
  catalogos?: CatalogosRrhhDto;
  departamentos: DepartamentoCatalogoDto[] = [];
  motivosCese: string[] = [];

  get vistaActualTitulo(): string {
    switch (this.vistaActual) {
      case 'Activos':
        return 'Colaboradores Activos';
      case 'Todos':
        return 'Todos los Colaboradores';
      case 'Vacaciones':
        return 'En Vacaciones / Licencia';
      case 'Cesados':
        return 'Colaboradores Cesados';
      default:
        return 'Colaboradores';
    }
  }

  get filtrosActivosCount(): number {
    let count = 0;
    if (this.filtroDepartamento) count++;
    if (this.searchTerm) count++;
    return count;
  }

  // Modal de Cese / Baja
  modalBajaVisible = false;
  guardandoBaja = false;
  empleadoParaBaja: EmpleadoDto | null = null;
  fechaCese: Date = new Date();
  motivoCeseSeleccionado = '';
  observacionesCese = '';

  // Selección de Filas (NG-ZORRO Native Table Selection)
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<string>();
  listOfCurrentPageData: readonly EmpleadoDto[] = [];
  selectedEmpleado: EmpleadoDto | null = null;

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  onCurrentPageDataChange(listOfCurrentPageData: readonly EmpleadoDto[]): void {
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
      this.selectedEmpleado = this.empleados.find((e) => e.id === selectedId) || null;
    } else {
      this.selectedEmpleado = null;
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

  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Registrar un nuevo colaborador',
        execute: () => this.irANuevoColaborador(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: this.setOfCheckedId.size !== 1,
        tooltip:
          this.setOfCheckedId.size !== 1
            ? 'Selecciona exactamente un colaborador para editar'
            : `Editar a ${this.selectedEmpleado?.nombres}`,
        execute: () => {
          if (this.selectedEmpleado) this.editar(this.selectedEmpleado.id);
        },
      },
      {
        key: 'delete',
        label: 'Dar de Baja',
        icon: 'user-delete',
        danger: true,
        iconColor: 'danger',
        disabled: this.setOfCheckedId.size === 0 || this.selectedEmpleado?.estado === 'Cesado',
        tooltip:
          this.setOfCheckedId.size === 0
            ? 'Selecciona un colaborador para dar de baja'
            : `Dar de baja colaborador`,
        execute: () => {
          if (this.selectedEmpleado) this.abrirModalBaja(this.selectedEmpleado);
        },
      },
      { key: 'd1', isDivider: true },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        iconColor: 'success',
        split: true,
        tooltip: 'Exportar colaboradores directamente a Excel (.xlsx)',
        execute: () => this.exportarDatos('xlsx'),
        children: [
          {
            key: 'xlsx',
            label: 'Descargar Excel (.xlsx)',
            icon: 'file-excel',
            iconColor: 'success',
            execute: () => this.exportarDatos('xlsx'),
          },
          {
            key: 'csv',
            label: 'Descargar CSV (.csv)',
            icon: 'file-excel',
            iconColor: 'success',
            execute: () => this.exportarDatos('csv'),
          },
        ],
      },
      {
        key: 'import',
        label: 'Importar desde Excel',
        icon: 'file-excel',
        iconColor: 'excel',
        tooltip: 'Importar colaboradores desde archivo externo',
        execute: () => this.message.info('La importación masiva estará disponible próximamente.'),
      },
      { key: 'd2', isDivider: true },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        iconColor: 'neutral',
        tooltip: 'Recargar lista de colaboradores',
        execute: () => this.cargarEmpleados(),
      },
    ];
  }

  farItems: CommandBarItem[] = [];

  seleccionarEmpleado(emp: EmpleadoDto) {
    if (this.selectedEmpleado?.id === emp.id) {
      this.selectedEmpleado = null;
    } else {
      this.selectedEmpleado = emp;
    }
  }

  irANuevoColaborador() {
    this.router.navigate(['/rrhh/empleados/nuevo']);
  }

  exportarDatos(formato: 'csv' | 'xlsx') {
    if (this.empleados.length === 0) {
      this.message.info('No hay registros para exportar');
      return;
    }
    const headers = ['Documento', 'Nombres', 'Apellidos', 'Email', 'Telefono', 'Cargo', 'Area', 'TipoContrato', 'Estado'];
    const rows = this.empleados.map((e) => [
      `"${e.tipoDocumento}: ${e.numeroDocumento}"`,
      `"${e.nombres}"`,
      `"${e.apellidos}"`,
      `"${e.email || ''}"`,
      `"${e.telefono || ''}"`,
      `"${e.cargoNombre || ''}"`,
      `"${e.departamentoNombre || ''}"`,
      `"${e.tipoContrato || ''}"`,
      `"${e.estado}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `colaboradores_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.message.success(`Exportados ${this.empleados.length} colaboradores correctamente`);
  }


  ngOnInit() {
    this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.cargarEmpleados();
      });

    this.cargarCatalogos();
    this.cargarEmpleados();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  onSearchTermChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  cargarCatalogos() {
    this.empleadoService.getCatalogos().subscribe({
      next: (cat) => {
        this.catalogos = cat;
        this.departamentos = cat.departamentos;
        this.motivosCese = cat.motivosCese;
        if (this.motivosCese.length > 0) {
          this.motivoCeseSeleccionado = this.motivosCese[0];
        }
        this.cdr.detectChanges();
      },
    });
  }

  cargarEmpleados() {
    this.loading = true;
    this.empleadoService
      .getEmpleados(this.searchTerm, this.filtroEstado, this.filtroDepartamento || undefined)
      .subscribe({
        next: (data) => {
          this.empleados = data;
          this.loading = false;
          this.setOfCheckedId.clear();
          this.refreshCheckedStatus();
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  cambiarVista(vista: string) {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activos':
        this.filtroEstado = 'Activo';
        break;
      case 'Todos':
        this.filtroEstado = 'Todos';
        break;
      case 'Vacaciones':
        this.filtroEstado = 'Vacaciones';
        break;
      case 'Cesados':
        this.filtroEstado = 'Cesado';
        break;
    }
    this.selectedEmpleado = null;
    this.cargarEmpleados();
  }

  toggleFiltrosDrawer() {
    this.drawerFiltrosVisible = !this.drawerFiltrosVisible;
  }

  limpiarBusqueda() {
    this.searchTerm = '';
    this.cargarEmpleados();
  }

  buscar() {
    this.cargarEmpleados();
  }

  limpiarFiltros() {
    this.searchTerm = '';
    this.filtroDepartamento = null;
    this.cambiarVista('Activos');
  }

  getEstadoTagClass(estado: string): string {
    switch (estado) {
      case 'Activo':
        return 'tag-active';
      case 'Vacaciones':
        return 'tag-warning';
      case 'Licencia':
        return 'tag-info';
      case 'Suspendido':
        return 'tag-purple';
      case 'Cesado':
        return 'tag-danger';
      default:
        return 'tag-inactive';
    }
  }

  getEstadoDotClass(estado: string): string {
    switch (estado) {
      case 'Activo':
        return 'd365-dot-active';
      case 'Vacaciones':
        return 'd365-dot-warning';
      case 'Licencia':
        return 'd365-dot-info';
      case 'Suspendido':
        return 'd365-dot-purple';
      case 'Cesado':
        return 'd365-dot-danger';
      default:
        return 'd365-dot-default';
    }
  }

  editar(id: string) {
    this.router.navigate(['/rrhh/empleados/editar', id]);
  }

  // --- Flujo de Baja / Cese ---
  abrirModalBaja(empleado: EmpleadoDto) {
    this.empleadoParaBaja = empleado;
    this.fechaCese = new Date();
    this.motivoCeseSeleccionado = this.motivosCese.length > 0 ? this.motivosCese[0] : '';
    this.observacionesCese = '';
    this.modalBajaVisible = true;
  }

  cerrarModalBaja() {
    this.modalBajaVisible = false;
    this.empleadoParaBaja = null;
  }

  confirmarBaja() {
    if (!this.empleadoParaBaja) return;
    if (!this.motivoCeseSeleccionado) {
      this.message.warning('Por favor selecciona el motivo de cese.');
      return;
    }

    this.guardandoBaja = true;
    // Formato YYYY-MM-DD
    const fechaFormatted = this.fechaCese.toISOString().split('T')[0];

    const request: DarDeBajaRequest = {
      fechaCese: fechaFormatted,
      motivoCese: this.motivoCeseSeleccionado,
      observacionesCese: this.observacionesCese ? this.observacionesCese.trim() : null,
    };

    this.empleadoService.darDeBaja(this.empleadoParaBaja.id, request).subscribe({
      next: () => {
        this.message.success('Colaborador dado de baja correctamente');
        this.guardandoBaja = false;
        this.cerrarModalBaja();
        this.cargarEmpleados();
      },
      error: () => {
        this.guardandoBaja = false;
      },
    });
  }

  // --- Flujo de Reactivación ---
  reactivar(id: string) {
    this.empleadoService.reactivar(id).subscribe({
      next: () => {
        this.message.success('Colaborador reactivado a estado Activo exitosamente');
        this.cargarEmpleados();
      },
      error: () => {
        // Manejado por interceptor global
      },
    });
  }

  eliminar(id: string) {
    this.empleadoService.eliminarEmpleado(id).subscribe({
      next: () => {
        this.message.success('Empleado eliminado correctamente');
        this.cargarEmpleados();
      },
      error: () => {
        // Manejado por el interceptor global
      },
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Activo':
        return 'success';
      case 'Vacaciones':
        return 'processing';
      case 'Licencia':
        return 'warning';
      case 'Suspendido':
        return 'purple';
      case 'Cesado':
        return 'error';
      default:
        return 'default';
    }
  }
}
