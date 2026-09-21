import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { VentasService } from '../../services/ventas.service';
import {
  ListaPrecioDetalleDto,
  ListaPrecioItemDto,
  ProductoComercialDto,
} from '../../models/listas-precio.model';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

interface ItemLocalRow {
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  productoTipo: number; // 1 = Inventario, 2 = NoInventario, 3 = Servicio
  precioBaseReferencial: number;
  precioUnitario: number;
}

@Component({
  selector: 'app-lista-precio-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSelectModule,
    NzSwitchModule,
    NzDatePickerModule,
    NzCardModule,
    NzSpinModule,
    NzTabsModule,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    NzModalModule,
    NzEmptyModule,
    NzTooltipModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lista-precio-form.html',
  styleUrl: './lista-precio-form.component.css',
})
export class ListaPrecioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ventasService = inject(VentasService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEditMode: boolean = false;
  id?: string;
  loading: boolean = false;
  guardando: boolean = false;

  // Líneas de precios
  items: ItemLocalRow[] = [];

  // Modal para agregar productos/servicios a la lista
  modalProductosVisible: boolean = false;
  productosDisponibles: ProductoComercialDto[] = [];
  cargandoProductos: boolean = false;
  filtroProductoTerm: string = '';
  filtroTipoProducto?: number;
  productoSeleccionadoId?: string;
  precioUnitarioPropuesto: number = 0;

  ngOnInit(): void {
    this.initForm();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.id = params['id'];
        this.cargarDatos(this.id!);
      }
    });

    this.cargarCatalogoProductos();
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      moneda: ['PEN', [Validators.required]],
      descripcion: ['', [Validators.maxLength(300)]],
      vigenciaRango: [null],
      esPredeterminada: [false],
    });
  }

  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'save',
        label: this.isEditMode ? 'Guardar Cambios' : 'Guardar',
        icon: 'save',
        appearance: 'primary',
        disabled: this.guardando || this.form.invalid,
        tooltip: 'Guardar la lista de precios',
        execute: () => this.guardar(),
      },
      {
        key: 'cancel',
        label: 'Cancelar',
        icon: 'arrow-left',
        tooltip: 'Regresar a la lista',
        execute: () => this.cancelar(),
      },
    ];
  }

  cargarDatos(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.ventasService.getListaPrecioPorId(id).subscribe({
      next: (data) => {
        const rango =
          data.vigenciaDesde && data.vigenciaHasta
            ? [new Date(data.vigenciaDesde), new Date(data.vigenciaHasta)]
            : null;

        this.form.patchValue({
          nombre: data.nombre,
          moneda: data.moneda || 'PEN',
          descripcion: data.descripcion,
          vigenciaRango: rango,
          esPredeterminada: data.esPredeterminada,
        });

        // Mapear items cargados
        this.items = data.items.map((i) => {
          const prod = this.productosDisponibles.find((p) => p.id === i.productoId);
          return {
            productoId: i.productoId,
            productoCodigo: i.productoCodigo || prod?.codigo || '—',
            productoNombre: i.productoNombre || prod?.nombre || 'Producto / Servicio',
            productoTipo: prod?.tipo || 1,
            precioBaseReferencial: prod?.precioBase || 0,
            precioUnitario: i.precioUnitario,
          };
        });

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('No se pudo cargar la información de la lista de precios.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cargarCatalogoProductos(): void {
    this.cargandoProductos = true;
    this.ventasService.getProductosComerciales(undefined, undefined, true).subscribe({
      next: (data) => {
        this.productosDisponibles = data;
        this.cargandoProductos = false;
        // Si ya había items, enriquecer sus nombres
        if (this.items.length > 0) {
          this.items = this.items.map((item) => {
            const prod = data.find((p) => p.id === item.productoId);
            if (prod) {
              return {
                ...item,
                productoCodigo: prod.codigo,
                productoNombre: prod.nombre,
                productoTipo: prod.tipo,
                precioBaseReferencial: prod.precioBase,
              };
            }
            return item;
          });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoProductos = false;
        this.cdr.markForCheck();
      },
    });
  }

  abrirModalAgregarItem(): void {
    this.modalProductosVisible = true;
    this.productoSeleccionadoId = undefined;
    this.precioUnitarioPropuesto = 0;
    this.filtroProductoTerm = '';
    this.filtroTipoProducto = undefined;
    this.cdr.markForCheck();
  }

  cerrarModalAgregarItem(): void {
    this.modalProductosVisible = false;
    this.cdr.markForCheck();
  }

  onProductoSeleccionadoChange(productoId?: string): void {
    if (productoId) {
      const prod = this.productosDisponibles.find((p) => p.id === productoId);
      if (prod) {
        this.precioUnitarioPropuesto = prod.precioBase || 0;
      }
    }
  }

  confirmarAgregarItem(): void {
    if (!this.productoSeleccionadoId) {
      this.message.warning('Por favor seleccione un producto o servicio.');
      return;
    }

    const prod = this.productosDisponibles.find((p) => p.id === this.productoSeleccionadoId);
    if (!prod) return;

    const existe = this.items.find((i) => i.productoId === prod.id);
    if (existe) {
      existe.precioUnitario = this.precioUnitarioPropuesto;
      this.message.info(`Se actualizó la tarifa para "${prod.nombre}".`);
    } else {
      this.items.push({
        productoId: prod.id,
        productoCodigo: prod.codigo,
        productoNombre: prod.nombre,
        productoTipo: prod.tipo,
        precioBaseReferencial: prod.precioBase,
        precioUnitario: Math.max(0, this.precioUnitarioPropuesto),
      });
      this.message.success(`Se agregó "${prod.nombre}" a la lista.`);
    }

    this.items = [...this.items];
    this.cerrarModalAgregarItem();
  }

  removerItem(index: number): void {
    this.items.splice(index, 1);
    this.items = [...this.items];
    this.cdr.markForCheck();
  }

  guardar(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        if (c.invalid) {
          c.markAsDirty();
          c.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    const val = this.form.value;
    const rango = val.vigenciaRango as Date[] | null;

    const payload = {
      nombre: val.nombre,
      moneda: val.moneda || 'PEN',
      descripcion: val.descripcion || null,
      vigenciaDesde: rango && rango[0] ? rango[0].toISOString() : null,
      vigenciaHasta: rango && rango[1] ? rango[1].toISOString() : null,
      esPredeterminada: !!val.esPredeterminada,
      items: this.items.map((i) => ({
        productoId: i.productoId,
        precioUnitario: Math.max(0, i.precioUnitario),
      })),
    };

    if (this.isEditMode && this.id) {
      this.ventasService.actualizarListaPrecio(this.id, payload).subscribe({
        next: () => {
          this.guardando = false;
          this.message.success('Lista de precios actualizada correctamente.');
          this.router.navigate(['/ventas/listas-precio']);
        },
        error: (err) => {
          this.guardando = false;
          this.message.error(err.error?.message || 'Error al actualizar la lista de precios.');
          this.cdr.markForCheck();
        },
      });
    } else {
      this.ventasService.crearListaPrecio(payload).subscribe({
        next: () => {
          this.guardando = false;
          this.message.success('Lista de precios creada exitosamente.');
          this.router.navigate(['/ventas/listas-precio']);
        },
        error: (err) => {
          this.guardando = false;
          this.message.error(err.error?.message || 'Error al crear la lista de precios.');
          this.cdr.markForCheck();
        },
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/ventas/listas-precio']);
  }

  getTipoLabel(tipo: number): string {
    switch (tipo) {
      case 1:
        return 'Inventario';
      case 2:
        return 'No-Inventario';
      case 3:
        return 'Servicio';
      default:
        return 'Producto';
    }
  }

  getTipoClass(tipo: number): string {
    switch (tipo) {
      case 1:
        return 'tipo-pill tipo-inventario';
      case 2:
        return 'tipo-pill tipo-noinventario';
      case 3:
        return 'tipo-pill tipo-servicio';
      default:
        return 'tipo-pill';
    }
  }
}
