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
import { ServicioCampoService } from '../../../servicio-campo/services/servicio-campo.service';
import { CatalogoServicioDto } from '../../../servicio-campo/models/servicio-campo-catalogos.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
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
  selector: 'app-catalogos-comerciales-list',
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
  templateUrl: './catalogos-comerciales-list.html',
  styleUrl: './catalogos-comerciales-list.component.css',
})
export class CatalogosComercialesListComponent implements OnInit {
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);

  catalogos: CatalogoServicioDto[] = [];
  catalogosFiltrados: CatalogoServicioDto[] = [];
  loading = false;

  searchTerm = '';
  vistaActual: 'Activos' | 'Todos' | 'Inactivos' = 'Activos';
  vistaActualTitulo = 'Catálogos Comerciales Activos';

  selectedIds = new Set<string>();

  get isAllSelected(): boolean {
    return (
      this.catalogosFiltrados.length > 0 &&
      this.catalogosFiltrados.every((item) => this.selectedIds.has(item.id))
    );
  }

  get isIndeterminate(): boolean {
    const count = this.selectedCount;
    return count > 0 && count < this.catalogosFiltrados.length;
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get commandBarItems(): CommandBarItem[] {
    const haySeleccion = this.selectedCount > 0;
    const esUnico = this.selectedCount === 1;

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nuevo catálogo comercial',
        execute: () => this.nuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnico,
        tooltip: esUnico ? 'Editar catálogo seleccionado' : 'Seleccione exactamente un catálogo',
        execute: () => {
          const id = Array.from(this.selectedIds)[0];
          if (id) this.editar(id);
        },
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar listado',
        execute: () => this.cargarCatalogos(),
      },
      {
        key: 'toggle-status',
        label: 'Activar / Desactivar',
        icon: 'poweroff',
        disabled: !haySeleccion,
        tooltip: haySeleccion ? 'Cambiar estado de los catálogos seleccionados' : 'Seleccione al menos un catálogo',
        execute: () => this.cambiarEstadoSeleccionados(),
      },
    ];
  }

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const soloActivos = this.vistaActual === 'Activos' ? true : this.vistaActual === 'Inactivos' ? false : undefined;

    this.servicioCampoService.getCatalogosServicio(undefined, undefined, soloActivos).subscribe({
      next: (data) => {
        this.catalogos = data || [];
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar los catálogos comerciales.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: 'Activos' | 'Todos' | 'Inactivos'): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activos':
        this.vistaActualTitulo = 'Catálogos Comerciales Activos';
        break;
      case 'Inactivos':
        this.vistaActualTitulo = 'Catálogos Comerciales Inactivos';
        break;
      case 'Todos':
        this.vistaActualTitulo = 'Todos los Catálogos Comerciales';
        break;
    }
    this.selectedIds.clear();
    this.cargarCatalogos();
  }

  onSearchChange(): void {
    this.aplicarFiltrosLocales();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltrosLocales();
  }

  private aplicarFiltrosLocales(): void {
    let result = [...this.catalogos];

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.contratanteNombre && c.contratanteNombre.toLowerCase().includes(q)) ||
          (c.descripcion && c.descripcion.toLowerCase().includes(q))
      );
    }

    this.catalogosFiltrados = result;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.catalogosFiltrados.forEach((item) => this.selectedIds.add(item.id));
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

  nuevo(): void {
    this.router.navigate(['/ventas/catalogos/nuevo']);
  }

  editar(id: string): void {
    this.router.navigate(['/ventas/catalogos/editar', id]);
  }

  private cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    this.modal.confirm({
      nzTitle: '¿Cambiar estado de los catálogos?',
      nzContent: `Se invertirá el estado de ${ids.length} catálogo(s) seleccionado(s).`,
      nzOkText: 'Sí, cambiar',
      nzCancelText: 'Cancelar',
      nzOnOk: () => {
        this.message.info('Procesando cambios de estado...');
        this.selectedIds.clear();
        this.cargarCatalogos();
      },
    });
  }
}
