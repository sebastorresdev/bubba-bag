import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { ProductoService } from '../../services/producto.service';
import { ProductoDto, TipoProducto } from '../../models/producto.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzSwitchModule,
    NzIconModule,
    NzTagModule,
    NzCardModule,
    NzTooltipModule,
    NzAvatarModule,
    NzTabsModule,
    NzInputNumberModule,
    NzDividerModule,
    NzSpinModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.component.css',
})
export class ProductoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  productoId: string | null = null;
  productoActual?: ProductoDto;
  isEdit = false;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  categorias = [
    'Materiales',
    'Equipos y Terminales',
    'Conectividad y Fibra',
    'Herramientas',
    'Insumos y Ferretería',
    'Servicios de Campo',
    'Otros',
  ];

  unidadesMedida = [
    { label: 'Unidades (UND)', value: 'Unidades' },
    { label: 'Metros (MTR)', value: 'Metros' },
    { label: 'Rollos (ROL)', value: 'Rollos' },
    { label: 'Cajas (CAJ)', value: 'Cajas' },
    { label: 'Kilos (KG)', value: 'Kilos' },
    { label: 'Servicio / Mano de Obra (SRV)', value: 'Servicios' },
  ];

  tiposProducto: { label: string; value: TipoProducto; icon: string; desc: string }[] = [
    {
      label: 'Inventario (Físico)',
      value: 'Inventario',
      icon: 'inbox',
      desc: 'Control de stock físico en almacenes, kardex y conteos.',
    },
    {
      label: 'Servicio (Mano de Obra)',
      value: 'Servicio',
      icon: 'tool',
      desc: 'No maneja stock; se utiliza para tareas, instalaciones y reparaciones.',
    },
    {
      label: 'Gasto / No Inventariable',
      value: 'NoInventariable',
      icon: 'tag',
      desc: 'Consumibles menores sin control estricto de existencias.',
    },
  ];

  get nombreProductoEnFormulario(): string {
    return this.form?.get('nombre')?.value?.trim() || (this.isEdit ? 'Producto' : 'Nuevo Producto');
  }

  get codigoProducto(): string {
    return this.form?.get('codigo')?.value?.trim() || (this.isEdit ? 'SIN CÓDIGO' : 'NUEVO-PRODUCTO');
  }

  get loadingTip(): string {
    if (this.saving) return 'Guardando información del producto...';
    if (this.loading) return 'Cargando datos del producto...';
    return 'Procesando...';
  }

  // ─── CommandBar Items ─────────────────────────────────────────────────────
  get commandBarItems(): CommandBarItem[] {
    const items: CommandBarItem[] = [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'primary',
        disabled: this.saving,
        tooltip: 'Guardar los cambios del producto (Ctrl+S)',
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y Cerrar',
        icon: 'check',
        disabled: this.saving,
        tooltip: 'Guardar cambios y regresar al catálogo',
        execute: () => this.guardar(true),
      },
    ];

    if (this.isEdit) {
      items.push({
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Crear un nuevo producto',
        execute: () => this.router.navigate(['/servicio-campo/materiales/nuevo']),
      });

      items.push({
        key: 'toggle',
        label: this.productoActual?.activo ? 'Desactivar' : 'Activar',
        icon: this.productoActual?.activo ? 'stop' : 'check-circle',
        danger: this.productoActual?.activo,
        iconColor: this.productoActual?.activo ? 'danger' : 'success',
        tooltip: this.productoActual?.activo ? 'Desactivar producto' : 'Reactivar producto',
        execute: () => this.toggleEstado(),
      });
    }

    items.push({ key: 'd1', isDivider: true });
    items.push({
      key: 'refresh',
      label: 'Actualizar',
      icon: 'reload',
      tooltip: 'Recargar datos del formulario',
      execute: () => this.recargar(),
    });

    return items;
  }

  commandBarFarItems: CommandBarItem[] = [];

  // ─── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForm();
    this.productoId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.productoId && this.productoId !== 'nuevo';

    if (this.isEdit && this.productoId) {
      this.cargarProducto(this.productoId);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(30)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      categoria: ['Materiales', Validators.required],
      tipo: ['Inventario' as TipoProducto, Validators.required],
      unidadMedida: ['Unidades', Validators.required],
      precioBase: [0, [Validators.min(0)]],
      esSerializado: [false],
      descripcion: [''],
    });

    // Si el tipo es Servicio, desactivar serializado
    this.form.get('tipo')?.valueChanges.subscribe((tipo: TipoProducto) => {
      if (tipo === 'Servicio') {
        this.form.patchValue({ esSerializado: false, unidadMedida: 'Servicios' });
      }
    });
  }

  cargarProducto(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.productoService.getProductoById(id).subscribe({
      next: (prod) => {
        this.productoActual = prod;
        this.form.patchValue({
          codigo: prod.codigo,
          nombre: prod.nombre,
          categoria: prod.categoria || 'Materiales',
          tipo: prod.tipo || 'Inventario',
          unidadMedida: prod.unidadMedida || 'Unidades',
          precioBase: prod.precioBase || 0,
          esSerializado: prod.esSerializado || false,
          descripcion: prod.descripcion || '',
        });
        this.form.get('codigo')?.disable(); // El código no es modificable en edición
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudo cargar la información del producto.');
        this.cdr.markForCheck();
      },
    });
  }

  recargar(): void {
    if (this.isEdit && this.productoId) {
      this.cargarProducto(this.productoId);
    } else {
      this.form.reset({
        categoria: 'Materiales',
        tipo: 'Inventario',
        unidadMedida: 'Unidades',
        precioBase: 0,
        esSerializado: false,
      });
    }
  }

  volver(): void {
    this.router.navigate(['/servicio-campo/materiales']);
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────
  guardar(cerrarAlFinal: boolean = false): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      this.message.warning('Por favor completa todos los campos requeridos marcados con asterisco (*).');
      return;
    }

    const v = this.form.getRawValue();
    this.saving = true;
    this.cdr.markForCheck();

    if (this.isEdit && this.productoId) {
      this.productoService
        .actualizarProducto(this.productoId, {
          nombre: v.nombre,
          tipo: v.tipo,
          categoria: v.categoria,
          unidadMedida: v.unidadMedida,
          precioBase: v.precioBase || 0,
          esSerializado: v.esSerializado || false,
          descripcion: v.descripcion || undefined,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.message.success('Producto actualizado correctamente.');
            if (cerrarAlFinal) {
              this.volver();
            } else {
              this.cargarProducto(this.productoId!);
            }
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err?.error || 'No se pudo actualizar el producto.');
            this.cdr.markForCheck();
          },
        });
    } else {
      this.productoService
        .crearProducto({
          codigo: v.codigo,
          nombre: v.nombre,
          tipo: v.tipo,
          categoria: v.categoria,
          unidadMedida: v.unidadMedida,
          precioBase: v.precioBase || 0,
          esSerializado: v.esSerializado || false,
          descripcion: v.descripcion || undefined,
        })
        .subscribe({
          next: (res) => {
            this.saving = false;
            this.message.success('Producto registrado exitosamente.');
            if (cerrarAlFinal) {
              this.volver();
            } else {
              this.router.navigate(['/servicio-campo/materiales/editar', res.id]);
            }
          },
          error: (err) => {
            this.saving = false;
            this.message.error(err?.error || 'No se pudo crear el producto.');
            this.cdr.markForCheck();
          },
        });
    }
  }

  // ─── Toggle Estado ────────────────────────────────────────────────────────
  toggleEstado(): void {
    if (!this.productoActual) return;
    const nuevoEstado = !this.productoActual.activo;

    this.productoService.cambiarEstado(this.productoActual.id, nuevoEstado).subscribe({
      next: () => {
        const accion = nuevoEstado ? 'activado' : 'desactivado';
        this.message.success(`Producto ${accion} correctamente.`);
        if (this.productoId) this.cargarProducto(this.productoId);
      },
      error: () => {
        this.message.error('No se pudo cambiar el estado del producto.');
      },
    });
  }

  getIniciales(codigo: string, nombre: string): string {
    if (codigo && codigo.length >= 2) return codigo.substring(0, 2).toUpperCase();
    if (nombre && nombre.length >= 2) return nombre.substring(0, 2).toUpperCase();
    return 'PR';
  }
}
