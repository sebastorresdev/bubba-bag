import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DepartamentoService } from '../../services/departamento.service';
import { CargoService } from '../../services/cargo.service';
import { DepartamentoDto } from '../../models/departamento.model';
import { CargoDto } from '../../models/cargo.model';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-organigrama-modal',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    NzModalModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzTagModule,
    NzTooltipModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organigrama-modal.component.html',
  styleUrl: './organigrama-modal.component.css',
})
export class OrganigramaModalComponent {
  private departamentoService = inject(DepartamentoService);
  private cargoService = inject(CargoService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input()
  set departamentoId(id: string | undefined) {
    this._departamentoId = id;
    if (id && this.visible) {
      this.cargarDatos(id);
    }
  }
  get departamentoId(): string | undefined {
    return this._departamentoId;
  }
  private _departamentoId?: string;

  departamento: DepartamentoDto | null = null;
  cargos: CargoDto[] = [];
  loading = false;
  selectedCargoId?: string;

  ngOnChanges(): void {
    if (this.visible && this._departamentoId && (!this.departamento || this.departamento.id !== this._departamentoId)) {
      this.cargarDatos(this._departamentoId);
    }
  }

  cargarDatos(id: string): void {
    this.loading = true;
    this.selectedCargoId = undefined;
    this.cdr.markForCheck();

    this.departamentoService.getDepartamento(id).subscribe({
      next: (depto: DepartamentoDto) => {
        this.departamento = depto;
        this.cargoService.getCargos(id).subscribe({
          next: (cargos: CargoDto[]) => {
            this.cargos = cargos;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  seleccionarCargo(cargoId: string): void {
    this.selectedCargoId = this.selectedCargoId === cargoId ? undefined : cargoId;
    this.cdr.markForCheck();
  }

  irACargosFiltrados(): void {
    if (!this.departamento) return;
    this.cerrar();
    this.router.navigate(['/rrhh/cargos'], {
      queryParams: { departamentoId: this.departamento.id },
    });
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  getInitials(name?: string): string {
    if (!name) return 'DP';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  getAvatarBg(name?: string): string {
    if (!name) return '#0078d4';
    const colors = [
      '#0078d4', // Fluent Blue
      '#5c2d91', // Fluent Purple
      '#008272', // Fluent Teal
      '#107c41', // Fluent Green
      '#d83b01', // Fluent Orange
      '#b146c2', // Fluent Magenta
      '#004e8c', // Fluent Dark Blue
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
