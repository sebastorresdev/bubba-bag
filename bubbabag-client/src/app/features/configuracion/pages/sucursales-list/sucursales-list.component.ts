import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SucursalService } from '../../services/sucursal.service';
import { SucursalDto } from '../../models/sucursal.model';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-sucursales-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzSelectModule,
    NzCheckboxModule,
    NzTooltipModule,
    NzBadgeModule,
    CommandBarComponent,
  ],
  templateUrl: './sucursales-list.html',
  styleUrl: './sucursales-list.component.css',
})
export class SucursalesListComponent implements OnInit {
  private sucursalService = inject(SucursalService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  sucursales: SucursalDto[] = [];
  loading = false;

  // Filtros
  searchTerm = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'activos';
  private searchSubject = new Subject<string>();

  // Selección
  selectedIds = new Set<string>();

  commandBarItems: CommandBarItem[] = [];

  ngOnInit(): void {
    this.updateCommandBar();
    this.cargarSucursales();

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.cargarSucursales();
      });
  }

  cargarSucursales(): void {
    this.loading = true;
    const soloActivos =
      this.filtroEstado === 'activos'
        ? true
        : this.filtroEstado === 'inactivos'
        ? false
        : undefined;

    this.sucursalService.getSucursales(this.searchTerm, soloActivos).subscribe({
      next: (data) => {
        this.sucursales = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudieron cargar las sucursales');
        this.cdr.markForCheck();
      },
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  onFiltroEstadoChange(val: 'todos' | 'activos' | 'inactivos'): void {
    this.filtroEstado = val;
    this.cargarSucursales();
  }

  updateCommandBar(): void {
    const hasSelection = this.selectedIds.size > 0;
    const singleSelection = this.selectedIds.size === 1;

    this.commandBarItems = [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        action: () => this.router.navigate(['/configuracion/sucursales/nuevo']),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        disabled: !singleSelection,
        action: () => {
          const id = Array.from(this.selectedIds)[0];
          this.router.navigate(['/configuracion/sucursales/editar', id]);
        },
      },
      {
        key: 'toggle-status',
        label: 'Cambiar Estado',
        icon: 'check-circle',
        disabled: !hasSelection,
        action: () => this.cambiarEstadoSeleccionados(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        action: () => this.cargarSucursales(),
      },
    ];
  }

  cambiarEstadoSeleccionados(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const first = this.sucursales.find((s) => s.id === ids[0]);
    const nuevoEstado = !(first?.activo ?? true);

    let completed = 0;
    ids.forEach((id) => {
      this.sucursalService.cambiarEstado(id, nuevoEstado).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) {
            this.message.success('Estado actualizado correctamente');
            this.selectedIds.clear();
            this.updateCommandBar();
            this.cargarSucursales();
          }
        },
        error: () => {
          this.message.error(`Error al actualizar estado`);
        },
      });
    });
  }

  onItemSelect(id: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.updateCommandBar();
  }

  onAllChecked(checked: boolean): void {
    if (checked) {
      this.sucursales.forEach((s) => this.selectedIds.add(s.id));
    } else {
      this.selectedIds.clear();
    }
    this.updateCommandBar();
  }

  get isAllSelected(): boolean {
    return (
      this.sucursales.length > 0 &&
      this.sucursales.every((s) => this.selectedIds.has(s.id))
    );
  }

  get isIndeterminate(): boolean {
    return (
      this.sucursales.some((s) => this.selectedIds.has(s.id)) &&
      !this.isAllSelected
    );
  }

  navegarAEditar(id: string): void {
    this.router.navigate(['/configuracion/sucursales/editar', id]);
  }
}
