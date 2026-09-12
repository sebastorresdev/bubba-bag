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
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
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
    NzDropdownModule,
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

  // Filtros y Vistas Dynamics 365
  vistaActual: 'Todos' | 'Activos' | 'Facturacion' | 'Servicio' | 'Inactivos' = 'Activos';
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Barra de Comandos Dynamics 365
  commandBarItems: CommandBarItem[] = [
    {
      key: 'nuevo',
      label: 'Nuevo Cliente',
      icon: 'plus',
      primary: true,
      action: () => this.crearNuevo(),
    },
    {
      key: 'actualizar',
      label: 'Actualizar',
      icon: 'reload',
      action: () => this.cargarClientes(),
    },
    {
      key: 'exportar',
      label: 'Exportar a CSV',
      icon: 'file-excel',
      action: () => this.exportarCsv(),
    },
  ];

  commandBarFarItems: CommandBarItem[] = [];

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
      error: (err) => {
        this.loading = false;
        this.message.error('No se pudo cargar la lista de clientes.');
        this.cdr.markForCheck();
      },
    });
  }

  onSearchChange(val: string): void {
    this.searchSubject.next(val);
  }

  onVistaChange(vista: 'Todos' | 'Activos' | 'Facturacion' | 'Servicio' | 'Inactivos'): void {
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

    // Filtro por búsqueda de texto
    const term = this.searchTerm?.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (c) =>
          c.codigoCliente.toLowerCase().includes(term) ||
          c.documentoIdentidad.toLowerCase().includes(term) ||
          c.nombreCompletoODenominacion.toLowerCase().includes(term) ||
          c.telefonoPrincipal.toLowerCase().includes(term) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.distrito && c.distrito.toLowerCase().includes(term))
      );
    }

    this.clientesFiltrados = list;
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
        this.message.success(res.message || 'Estado actualizado.');
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

    this.message.success('Archivo CSV exportado exitosamente.');
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
