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

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { OrdenTrabajoItemDto } from '../ordenes-list/ordenes-list.component';

@Component({
  selector: 'app-mis-ordenes-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzEmptyModule,
    NzDropdownModule,
    NzTooltipModule,
    NzBadgeModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mis-ordenes-list.html',
  styleUrl: './mis-ordenes-list.component.css',
})
export class MisOrdenesListComponent implements OnInit {
  private router = inject(Router);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  ordenes: OrdenTrabajoItemDto[] = [];
  ordenesFiltradas: OrdenTrabajoItemDto[] = [];
  loading = false;

  searchTerm = '';
  vistaActual: 'Hoy' | 'EnRuta' | 'Completadas' = 'Hoy';
  vistaActualTitulo = 'Mis Órdenes del Día';

  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Refrescar mis órdenes',
        execute: () => this.cargarDatos(),
      },
    ];
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.ordenes = [];
      this.aplicarFiltrosLocales();
      this.loading = false;
      this.cdr.markForCheck();
    }, 200);
  }

  cambiarVista(vista: 'Hoy' | 'EnRuta' | 'Completadas'): void {
    this.vistaActual = vista;
    switch (vista) {
      case 'EnRuta':
        this.vistaActualTitulo = 'Mis Órdenes en Ruta';
        break;
      case 'Completadas':
        this.vistaActualTitulo = 'Mis Órdenes Realizadas Hoy';
        break;
      case 'Hoy':
      default:
        this.vistaActualTitulo = 'Mis Órdenes del Día';
        break;
    }
    this.aplicarFiltrosLocales();
  }

  onSearchChange(): void {
    this.aplicarFiltrosLocales();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.aplicarFiltrosLocales();
  }

  private aplicarFiltrosLocales(): void {
    let result = [...this.ordenes];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.numero.toLowerCase().includes(term) ||
          o.cliente.toLowerCase().includes(term) ||
          o.servicio.toLowerCase().includes(term) ||
          o.direccion.toLowerCase().includes(term)
      );
    }

    this.ordenesFiltradas = result;
    this.cdr.markForCheck();
  }
}
