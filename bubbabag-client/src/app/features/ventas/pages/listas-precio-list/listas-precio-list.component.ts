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
import { VentasService } from '../../services/ventas.service';
import { ListaPrecioDto } from '../../models/listas-precio.model';

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
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-listas-precio-list',
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
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listas-precio-list.html',
  styleUrl: './listas-precio-list.component.css',
})
export class ListasPrecioListComponent implements OnInit {
  private router = inject(Router);
  private ventasService = inject(VentasService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);

  listasPrecio: ListaPrecioDto[] = [];
  listasPrecioFiltradas: ListaPrecioDto[] = [];
  loading: boolean = false;

  vistaActual: 'Activas' | 'Todas' | 'Inactivas' = 'Activas';
  vistaActualTitulo: string = 'Listas de Precios Activas';
  searchTerm: string = '';

  selectedIds: Set<string> = new Set<string>();

  ngOnInit(): void {
    this.cargarDatos();
  }

  get commandBarItems(): CommandBarItem[] {
    const haySeleccion = this.selectedIds.size > 0;
    const esUnicoSeleccionado = this.selectedIds.size === 1;

    let itemSeleccionado: ListaPrecioDto | undefined;
    if (esUnicoSeleccionado) {
      const id = Array.from(this.selectedIds)[0];
      itemSeleccionado = this.listasPrecio.find((l) => l.id === id);
    }

    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear nueva lista de precios',
        execute: () => this.irANuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: !esUnicoSeleccionado,
        tooltip: 'Editar la lista de precios seleccionada',
        execute: () => {
          if (itemSeleccionado) {
            this.editar(itemSeleccionado.id);
          }
        },
      },
      {
        key: 'toggle-status',
        label: esUnicoSeleccionado
          ? itemSeleccionado?.activo
            ? 'Desactivar'
            : 'Activar'
          : 'Cambiar Estado',
        icon: esUnicoSeleccionado && itemSeleccionado?.activo ? 'stop' : 'check',
        iconColor: esUnicoSeleccionado && itemSeleccionado?.activo ? 'danger' : 'success',
        disabled: !haySeleccion,
        tooltip: 'Activar o desactivar las listas seleccionadas',
        execute: () => this.cambiarEstadoSeleccionados(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar listas de precios',
        execute: () => this.cargarDatos(),
      },
    ];
  }

  cargarDatos(): void {
    this.loading = true;
    this.selectedIds.clear();
    this.cdr.markForCheck();

    let soloActivos: boolean | undefined = undefined;
    if (this.vistaActual === 'Activas') soloActivos = true;
    if (this.vistaActual === 'Inactivas') soloActivos = false;

    this.ventasService.getListasPrecio(this.searchTerm, soloActivos).subscribe({
      next: (data) => {
        this.listasPrecio = data;
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('Error al cargar las listas de precios.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cambiarVista(vista: 'Activas' | 'Todas' | 'Inactivas'): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'Activas':
        this.vistaActualTitulo = 'Listas de Precios Activas';
        break;
      case 'Todas':
        this.vistaActualTitulo = 'Todas las Listas de Precios';
        break;
      case 'Inactivas':
        this.vistaActualTitulo = 'Listas de Precios Inactivas';
        break;
    }
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
    let result = [...this.listasPrecio];
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.nombre.toLowerCase().includes(term) ||
          (l.descripcion && l.descripcion.toLowerCase().includes(term))
      );
    }
    this.listasPrecioFiltradas = result;
    this.cdr.markForCheck();
  }

  // Selección
  get isAllSelected(): boolean {
    return (
      this.listasPrecioFiltradas.length > 0 &&
      this.listasPrecioFiltradas.every((l) => this.selectedIds.has(l.id))
    );
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.listasPrecioFiltradas.filter((l) => this.selectedIds.has(l.id)).length;
    return selectedCount > 0 && selectedCount < this.listasPrecioFiltradas.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.listasPrecioFiltradas.forEach((l) => this.selectedIds.add(l.id));
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
    this.router.navigate(['/ventas/listas-precio/nuevo']);
  }

  editar(id: string): void {
    this.router.navigate(['/ventas/listas-precio/editar', id]);
  }

  cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const primerItem = this.listasPrecio.find((l) => l.id === ids[0]);
    const nuevoEstado = primerItem ? !primerItem.activo : true;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    this.modalService.confirm({
      nzTitle: `¿Desea ${accion} la(s) ${ids.length} lista(s) de precios seleccionada(s)?`,
      nzOkText: 'Sí, continuar',
      nzCancelText: 'Cancelar',
      nzOkType: 'primary',
      nzOkDanger: !nuevoEstado,
      nzOnOk: () => {
        let completados = 0;
        ids.forEach((id) => {
          this.ventasService.cambiarEstadoListaPrecio(id, nuevoEstado).subscribe({
            next: () => {
              completados++;
              if (completados === ids.length) {
                this.message.success('Listas de precios actualizadas correctamente.');
                this.cargarDatos();
              }
            },
            error: () => {
              completados++;
              if (completados === ids.length) {
                this.cargarDatos();
              }
            },
          });
        });
      },
    });
  }
}
