import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// NG-ZORRO Modules
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar/command-bar.component';
import { VistaItem } from '../../../../shared/components/view-selector';
import { EntityTableComponent, CellDefDirective, ColumnDef } from '../../../../shared/components/entity-table';
import { ServicioCampoService } from '../../services/servicio-campo.service';
import {
  TarifaServicioDto,
  TipoTareaServicioDto,
} from '../../models/servicio-campo-catalogos.model';

@Component({
  selector: 'app-tarifas-servicio-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzCardModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzSelectModule,
    NzModalModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tarifas-servicio-list.html',
  styleUrl: './tarifas-servicio-list.component.css',
})
export class TarifasServicioListComponent implements OnInit {
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  tarifas: TarifaServicioDto[] = [];
  tarifasFiltradas: TarifaServicioDto[] = [];
  tiposTarea: TipoTareaServicioDto[] = [];
  loading = false;

  // Filtros y Vistas
  searchTerm = '';
  filtroEmpresa = 'TODAS';
  filtroSucursal = 'TODAS';
  filtroTipificacion = 'TODAS';
  empresasDisponibles: string[] = ['DIRECTV PERU S.R.L.'];
  sucursalesDisponibles: string[] = ['GENERAL'];
  tipificacionesDisponibles: string[] = [
    'AUDITORIAS',
    'GENERAL',
    'INSTALACION',
    'MUDANZA',
    'POSTVENTA',
    'SERVICIOS MENORES',
    'SERVICIOS TECNICOS',
  ];
  vistaActual = 'Activos';
  vistaActualTitulo = 'Tarifas de Servicio Activas';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Tarifas de Servicio Activas', esSistema: true, esPredeterminada: true },
    { key: 'Inactivos', nombre: 'Tarifas de Servicio Inactivas', esSistema: true },
    { key: 'Todos', nombre: 'Todas las Tarifas de Servicio', esSistema: true },
  ];

  onVistaChange(vista: VistaItem): void {
    this.cambiarVista(vista.key);
  }

  columnas: ColumnDef<TarifaServicioDto>[] = [
    {
      key: 'tipificacion',
      title: 'Tipificación',
      width: '160px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'codigoServicio',
      title: 'Código',
      width: '90px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'detalleServicio',
      title: 'Detalle del Servicio',
      width: '280px',
      sortable: true,
      dataType: 'text',
      primaryLink: true,
      canHide: false,
    },
    {
      key: 'empresaContratante',
      title: 'Empresa Facturadora',
      width: '170px',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'sucursal',
      title: 'Sucursal',
      width: '110px',
      align: 'center',
      sortable: true,
      dataType: 'text',
    },
    {
      key: 'puntos',
      title: 'Puntos',
      width: '80px',
      align: 'center',
      sortable: true,
      dataType: 'number',
    },
    {
      key: 'totalFijo',
      title: 'Fijo',
      width: '110px',
      align: 'right',
      sortable: true,
      dataType: 'currency',
    },
    {
      key: 'variableTotal',
      title: 'Variable',
      width: '110px',
      align: 'right',
      sortable: true,
      dataType: 'currency',
    },
    {
      key: 'montoTotalTeorico',
      title: 'Total Teórico',
      width: '120px',
      align: 'right',
      sortable: true,
      dataType: 'currency',
    },
    {
      key: 'activo',
      title: 'Estado',
      width: '90px',
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

  // Selección
  selectedIds = new Set<string>();

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const soloActivos =
      this.vistaActual === 'Activos'
        ? true
        : this.vistaActual === 'Inactivos'
        ? false
        : undefined;

    this.servicioCampoService.getTarifasServicio(undefined, undefined, soloActivos).subscribe({
      next: (data) => {
        this.tarifas = data || [];
        this.extraerFiltrosDisponibles();
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar tarifas de servicio:', err);
        this.message.error('No se pudo cargar el tarifario de servicios.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private extraerFiltrosDisponibles(): void {
    const empresas = new Set<string>();
    const sucursales = new Set<string>(['GENERAL']);
    const tipificaciones = new Set<string>();

    this.tarifas.forEach((t) => {
      if (t.empresaContratante?.trim()) empresas.add(t.empresaContratante.trim());
      if (t.sucursal?.trim()) sucursales.add(t.sucursal.trim());
      if (t.tipificacion?.trim()) tipificaciones.add(t.tipificacion.trim());
    });

    if (empresas.size > 0) {
      this.empresasDisponibles = Array.from(empresas).sort();
    }
    if (sucursales.size > 0) {
      this.sucursalesDisponibles = Array.from(sucursales).sort();
    }
    if (tipificaciones.size > 0) {
      this.tipificacionesDisponibles = Array.from(tipificaciones).sort();
    }
  }

  cambiarVista(vista: string): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activos':
        this.vistaActualTitulo = 'Tarifas de Servicio Activas';
        break;
      case 'Inactivos':
        this.vistaActualTitulo = 'Tarifas de Servicio Inactivas';
        break;
      case 'Todos':
        this.vistaActualTitulo = 'Todas las Tarifas de Servicio';
        break;
    }
    this.selectedIds.clear();
    this.cargarDatos();
  }

  onFiltroChange(): void {
    this.aplicarFiltrosLocales();
  }

  onSearchChange(): void {
    this.aplicarFiltrosLocales();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltrosLocales();
  }

  aplicarFiltrosLocales(): void {
    const term = this.searchTerm ? this.searchTerm.trim().toLowerCase() : '';

    this.tarifasFiltradas = this.tarifas.filter((item) => {
      // 1. Filtro de Tipificación
      if (this.filtroTipificacion !== 'TODAS') {
        const itemTip = item.tipificacion ? item.tipificacion.trim().toUpperCase() : '';
        if (itemTip !== this.filtroTipificacion.trim().toUpperCase()) {
          return false;
        }
      }

      // 2. Filtro de Empresa
      if (this.filtroEmpresa !== 'TODAS') {
        const itemEmp = item.empresaContratante ? item.empresaContratante.trim().toUpperCase() : '';
        const targetEmp = this.filtroEmpresa.trim().toUpperCase();
        if (itemEmp !== targetEmp && !itemEmp.includes(targetEmp)) {
          return false;
        }
      }

      // 3. Filtro de Sucursal
      if (this.filtroSucursal !== 'TODAS') {
        const itemSuc = item.sucursal ? item.sucursal.trim().toUpperCase() : '';
        if (this.filtroSucursal === 'GENERAL') {
          if (itemSuc !== '' && itemSuc !== 'GENERAL') return false;
        } else {
          if (itemSuc !== this.filtroSucursal.trim().toUpperCase()) return false;
        }
      }

      // 4. Filtro de Búsqueda por Texto
      if (term) {
        const matchCodigo = item.codigoServicio?.toLowerCase().includes(term) ?? false;
        const matchDetalle = item.detalleServicio?.toLowerCase().includes(term) ?? false;
        const matchTip = item.tipificacion?.toLowerCase().includes(term) ?? false;
        const matchEmp = item.empresaContratante?.toLowerCase().includes(term) ?? false;
        const matchSuc = item.sucursal?.toLowerCase().includes(term) ?? false;
        if (!matchCodigo && !matchDetalle && !matchTip && !matchEmp && !matchSuc) {
          return false;
        }
      }

      return true;
    });

    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // Selección
  get isAllSelected(): boolean {
    return (
      this.tarifasFiltradas.length > 0 &&
      this.tarifasFiltradas.every((item) => this.selectedIds.has(item.id))
    );
  }

  get isIndeterminate(): boolean {
    const count = this.tarifasFiltradas.filter((item) => this.selectedIds.has(item.id)).length;
    return count > 0 && count < this.tarifasFiltradas.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.tarifasFiltradas.forEach((item) => this.selectedIds.add(item.id));
    } else {
      this.tarifasFiltradas.forEach((item) => this.selectedIds.delete(item.id));
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

  // Navegación a Formularios
  irANuevo(): void {
    this.router.navigate(['/servicio-campo/tarifas-servicio/nuevo']);
  }

  editar(id: string): void {
    this.router.navigate(['/servicio-campo/tarifas-servicio/editar', id]);
  }

  editarSeleccionado(): void {
    if (this.selectedIds.size === 1) {
      const id = Array.from(this.selectedIds)[0];
      this.editar(id);
    }
  }

  // Command Bar
  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nueva tarifa de servicio',
        execute: () => this.irANuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: this.selectedIds.size !== 1,
        tooltip:
          this.selectedIds.size !== 1
            ? 'Selecciona una tarifa para editar'
            : 'Editar tarifa seleccionada',
        execute: () => this.editarSeleccionado(),
      },
      {
        key: 'toggleState',
        label: 'Cambiar Estado',
        icon: 'check-circle',
        disabled: this.selectedIds.size === 0,
        tooltip: 'Activar o desactivar las tarifas seleccionadas',
        execute: () => this.cambiarEstadoLote(),
      },
      { key: 'd1', isDivider: true },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        iconColor: 'success',
        tooltip: 'Exportar tarifas visibles a archivo CSV/Excel',
        execute: () => this.exportarExcel(),
      },
      { key: 'd2', isDivider: true },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        iconColor: 'neutral',
        tooltip: 'Recargar tarifas de servicio',
        execute: () => this.cargarDatos(),
      },
    ];
  }

  cambiarEstadoLote(): void {
    if (this.selectedIds.size === 0) return;
    const count = this.selectedIds.size;
    const nuevoEstado = this.vistaActual === 'Activos' ? false : true;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    this.modalService.confirm({
      nzTitle: `¿Deseas ${accion} ${count} tarifa(s) de servicio?`,
      nzContent: `Las tarifas pasarán al estado ${nuevoEstado ? 'Activo' : 'Inactivo'}.`,
      nzOkText: 'Confirmar',
      nzCancelText: 'Cancelar',
      nzOnOk: () => {
        this.loading = true;
        this.cdr.markForCheck();
        let completions = 0;
        this.selectedIds.forEach((id) => {
          this.servicioCampoService.cambiarEstadoTarifaServicio(id, nuevoEstado).subscribe({
            next: () => {
              completions++;
              if (completions === count) {
                this.message.success(`Se ${accion}ron ${count} tarifas exitosamente.`);
                this.selectedIds.clear();
                this.cargarDatos();
              }
            },
            error: () => {
              completions++;
              if (completions === count) {
                this.selectedIds.clear();
                this.cargarDatos();
              }
            },
          });
        });
      },
    });
  }

  exportarExcel(): void {
    if (this.tarifasFiltradas.length === 0) {
      this.message.warning('No hay datos para exportar.');
      return;
    }

    const headers = [
      'Tipificacion',
      'Codigo',
      'Detalle',
      'Empresa',
      'Sucursal',
      'Puntos',
      'FijoBase',
      'FijoAdicional',
      'TotalFijo',
      'VariableTotal',
      'CycleTime',
      'Agenda',
      'Sin30',
      'TotalTeorico',
      'AplicaPago',
      'AplicaGarantia',
      'Estado',
    ];

    const rows = this.tarifasFiltradas.map((t) => [
      `"${t.tipificacion || ''}"`,
      `"${t.codigoServicio}"`,
      `"${t.detalleServicio.replace(/"/g, '""')}"`,
      `"${t.empresaContratante}"`,
      `"${t.sucursal || 'General'}"`,
      t.puntos,
      t.fijoBase,
      t.fijoAdicional,
      t.totalFijo ?? (t.fijoBase + t.fijoAdicional),
      t.variableTotal,
      t.cycleTime,
      t.cumplimientoAgenda,
      t.sin30Dias,
      t.montoTotalTeorico,
      t.aplicaPago ? 'SI' : 'NO',
      t.aplicaGarantia ? 'SI' : 'NO',
      t.activo ? 'ACTIVO' : 'INACTIVO',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tarifas_servicio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.message.success(`Exportadas ${this.tarifasFiltradas.length} tarifas correctamente.`);
  }

  getTipificacionColor(tip: string): string {
    switch (tip?.toUpperCase()) {
      case 'INSTALACION':
      case 'SERVICIOS DE INSTALACION':
        return '#0284c7';
      case 'SERVICIOS MENORES':
      case 'SERVICIOS TECNICOS':
        return '#0d9488';
      case 'AUDITORIAS':
        return '#e11d48';
      case 'MUDANZA':
        return '#d97706';
      case 'POSTVENTA':
        return '#7c3aed';
      default:
        return '#2563eb';
    }
  }
}
