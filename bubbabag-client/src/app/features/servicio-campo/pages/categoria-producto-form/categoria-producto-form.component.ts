import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// NG-ZORRO Modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';

// Shared Components & Services
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar/command-bar.component';
import { CategoriaProductoService } from '../../services/categoria-producto.service';
import { CategoriaProductoDto } from '../../models/catalogo-producto.model';

@Component({
  selector: 'app-categoria-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    NzSpinModule,
    NzAvatarModule,
    NzDividerModule,
    CommandBarComponent,
  ],
  templateUrl: './categoria-producto-form.html',
  styleUrl: './categoria-producto-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriaProductoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoriaService = inject(CategoriaProductoService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEdit = false;
  categoriaId: string | null = null;
  categoriaActual?: CategoriaProductoDto;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  get nombreEnFormulario(): string {
    if (this.isEdit) {
      if (this.categoriaActual?.nombre) return this.categoriaActual.nombre;
      const formVal = this.form?.get('nombre')?.value?.trim();
      if (formVal) return formVal;
      return this.loading ? 'Cargando categoría...' : 'Categoría';
    }
    return this.form?.get('nombre')?.value?.trim() || 'Nueva Categoría';
  }

  getIniciales(): string {
    const nom = this.categoriaActual?.nombre || this.form?.get('nombre')?.value;
    if (nom && nom.trim()) {
      const partes = nom.trim().split(' ').filter(Boolean);
      if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return this.isEdit && this.loading ? '' : 'CAT';
  }

  // ─── CommandBar ──────────────────────────────────────────────────────────
  get commandBarItems(): CommandBarItem[] {
    const items: CommandBarItem[] = [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        disabled: this.saving,
        tooltip: 'Guardar cambios (Ctrl+S)',
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y cerrar',
        icon: 'save',
        iconColor: 'purple',
        disabled: this.saving,
        tooltip: 'Guardar y regresar a la lista de categorías',
        execute: () => this.guardar(true),
      },
    ];

    if (this.isEdit) {
      items.push({
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear una nueva categoría',
        execute: () => this.router.navigate(['/servicio-campo/categorias-producto/nuevo']),
      });

      items.push({
        key: 'toggle',
        label: this.categoriaActual?.activo ? 'Desactivar' : 'Activar',
        icon: this.categoriaActual?.activo ? 'close-circle' : 'check-circle',
        danger: this.categoriaActual?.activo,
        iconColor: this.categoriaActual?.activo ? 'danger' : 'success',
        tooltip: this.categoriaActual?.activo ? 'Desactivar categoría' : 'Reactivar categoría',
        execute: () => this.toggleEstado(),
      });
    }

    items.push({ key: 'd1', isDivider: true });
    items.push({
      key: 'refresh',
      label: 'Actualizar',
      icon: 'reload',
      tooltip: 'Recargar datos',
      execute: () => this.recargar(),
    });

    return items;
  }

  // ─── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForm();
    this.categoriaId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.categoriaId && this.categoriaId !== 'nuevo';

    if (this.isEdit && this.categoriaId) {
      this.loading = true;
      this.cargarCategoria(this.categoriaId);
    }
  }

  private poblarFormulario(item: CategoriaProductoDto): void {
    this.form.patchValue({
      nombre: item.nombre,
      familia: item.familia || '',
      descripcion: item.descripcion || '',
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      familia: ['', [Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(300)]],
    });
  }

  cargarCategoria(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.categoriaService.getCategoriaById(id).subscribe({
      next: (item) => {
        this.categoriaActual = item;
        this.poblarFormulario(item);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('No se pudo cargar la categoría solicitada.');
        this.loading = false;
        this.volver();
      },
    });
  }

  guardar(cerrarAlFinal = false): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((ctrl) => {
        if (ctrl.invalid) {
          ctrl.markAsDirty();
          ctrl.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Por favor completa todos los campos requeridos.');
      return;
    }

    const val = this.form.getRawValue();
    this.saving = true;
    this.cdr.markForCheck();

    if (this.isEdit && this.categoriaId) {
      this.categoriaService
        .actualizarCategoria(this.categoriaId, {
          nombre: val.nombre,
          familia: val.familia,
          descripcion: val.descripcion,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.message.success('Categoría actualizada con éxito.');
            if (cerrarAlFinal) {
              this.volver();
            } else {
              this.cargarCategoria(this.categoriaId!);
            }
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err?.error || 'Error al guardar los cambios.');
            this.cdr.markForCheck();
          },
        });
    } else {
      this.categoriaService
        .crearCategoria({
          nombre: val.nombre,
          familia: val.familia,
          descripcion: val.descripcion,
        })
        .subscribe({
          next: (res) => {
            this.saving = false;
            this.message.success('Categoría creada con éxito.');
            if (cerrarAlFinal) {
              this.volver();
            } else {
              this.router.navigate(['/servicio-campo/categorias-producto/editar', res.id]);
            }
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err?.error || 'Error al crear la categoría.');
            this.cdr.markForCheck();
          },
        });
    }
  }

  toggleEstado(): void {
    if (!this.categoriaId || !this.categoriaActual) return;
    const nuevoEstado = !this.categoriaActual.activo;
    this.categoriaService.cambiarEstado(this.categoriaId, nuevoEstado).subscribe({
      next: () => {
        this.message.success(`Categoría ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`);
        this.cargarCategoria(this.categoriaId!);
      },
      error: () => this.message.error('Error al cambiar el estado.'),
    });
  }

  recargar(): void {
    if (this.isEdit && this.categoriaId) {
      this.cargarCategoria(this.categoriaId);
    } else {
      this.form.reset({
        nombre: '',
        familia: '',
        descripcion: '',
      });
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/servicio-campo/categorias-producto']);
  }
}
