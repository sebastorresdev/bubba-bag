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
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

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
    NzDropdownModule,
    NzTooltipModule,
    NzAvatarModule,
    NzBadgeModule,
    CommandBarComponent,
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
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';
  vistaActualTitulo = 'Servicios Activos';

  selectedIds = new Set<string>();

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
        label: 'Nuevo Servicio',
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

  cambiarVista(vista: 'Activos' | 'Todos' | 'Inactivos'): void {
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
