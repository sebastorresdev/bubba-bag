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

import { ToastService } from '../../../../core/services/toast.service';
import { AppIconComponent } from '../../../../shared/components/icon/icon.component';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import { ProductoService } from '../../services/producto.service';
import { ProductoDto, TipoProducto } from '../../models/producto.model';
import { UnidadMedidaService } from '../../services/unidad-medida.service';
import { CategoriaProductoService } from '../../services/categoria-producto.service';
import { UnidadMedidaDto, CategoriaProductoDto } from '../../models/catalogo-producto.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.component.css',
})
export class ProductoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private unidadMedidaService = inject(UnidadMedidaService);
  private categoriaProductoService = inject(CategoriaProductoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  productoId: string | null = null;
  productoActual?: ProductoDto;
  isEdit = false;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  unidadesMedidaList: UnidadMedidaDto[] = [];
  categoriasList: CategoriaProductoDto[] = [];

  categorias: string[] = [
    'Materiales',
    'Equipos y Terminales',
    'Conectividad y Fibra',
    'Herramientas',
    'Insumos y Ferretería',
    'Servicios de Campo',
    'Otros',
  ];

  unidadesMedida: { label: string; value: string }[] = [
    { label: 'Unidades (UND)', value: 'Unidades' },
    { label: 'Metros (MTR) - Decimal', value: 'Metros' },
    { label: 'Rollos (ROL)', value: 'Rollos' },
    { label: 'Cajas (CAJ)', value: 'Cajas' },
    { label: 'Kilos (KG) - Decimal', value: 'Kilos' },
    { label: 'Servicio / Mano de Obra (SRV)', value: 'Servicios' },
  ];

  get unidadSeleccionada(): UnidadMedidaDto | undefined {
    const val = this.form?.get('unidadMedida')?.value;
    if (!val) return undefined;
    return this.unidadesMedidaList.find(
      (u) =>
        u.nombre.toLowerCase() === val.toLowerCase() ||
        u.codigo.toLowerCase() === val.toLowerCase()
    );
  }

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
    if (this.isEdit) {
      if (this.productoActual?.nombre) return this.productoActual.nombre;
      const formVal = this.form?.get('nombre')?.value?.trim();
      if (formVal) return formVal;
      return this.loading ? 'Cargando producto...' : 'Producto';
    }
    return this.form?.get('nombre')?.value?.trim() || 'Nuevo Producto';
  }

  get codigoProducto(): string {
    if (this.isEdit) {
      if (this.productoActual?.codigo) return this.productoActual.codigo;
      const formVal = this.form?.get('codigo')?.value?.trim();
      if (formVal) return formVal;
      return this.loading ? '...' : '';
    }
    return this.form?.get('codigo')?.value?.trim() || 'NUEVO-PRODUCTO';
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
        iconColor: 'purple',
        disabled: this.saving,
        tooltip: 'Guardar los cambios del producto (Ctrl+S)',
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y cerrar',
        icon: 'save',
        iconColor: 'purple',
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
        icon: this.productoActual?.activo ? 'close-circle' : 'check-circle',
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
    this.cargarCatalogosMaestros();
    this.productoId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.productoId && this.productoId !== 'nuevo';

    if (this.isEdit && this.productoId) {
      this.loading = true;
      this.cargarProducto(this.productoId);
    }
  }

  private poblarFormulario(prod: ProductoDto): void {
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
  }

  cargarCatalogosMaestros(): void {
    this.unidadMedidaService.getUnidadesMedida(true).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.unidadesMedidaList = data;
          this.unidadesMedida = data.map((u) => ({
            label: `${u.nombre} (${u.codigo})${u.permiteDecimales ? ' - Decimal' : ''}`,
            value: u.nombre,
          }));
          this.cdr.markForCheck();
        }
      },
      error: () => {},
    });

    this.categoriaProductoService.getCategorias(true).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.categoriasList = data;
          this.categorias = data.map((c) => c.nombre);
          this.cdr.markForCheck();
        }
      },
      error: () => {},
    });
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
        this.poblarFormulario(prod);
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
    this.router.navigate(['/servicio-campo/productos']);
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
              this.router.navigate(['/servicio-campo/productos/editar', res.id]);
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

  getIniciales(codigo?: string, nombre?: string): string {
    const nom = nombre || this.productoActual?.nombre || this.form?.get('nombre')?.value;
    if (nom && nom !== 'Producto' && nom !== 'Nuevo Producto' && nom !== 'Cargando producto...' && nom.trim().length >= 2) {
      const partes = nom.trim().split(' ').filter(Boolean);
      if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    const cod = codigo || this.productoActual?.codigo || this.form?.get('codigo')?.value;
    if (cod && cod !== 'SIN CÓDIGO' && cod !== '...' && cod !== 'NUEVO-PRODUCTO' && cod.trim().length >= 2) {
      return cod.trim().substring(0, 2).toUpperCase();
    }
    return this.isEdit && this.loading ? '' : 'PR';
  }
}
