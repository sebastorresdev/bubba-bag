import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// NG-ZORRO Modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';

import { VistaItem } from './view-selector.models';
import { ViewSelectorService } from './view-selector.service';

@Component({
  selector: 'app-view-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzDropdownModule,
    NzInputModule,
    NzModalModule,
    NzCheckboxModule,
  ],
  templateUrl: './view-selector.component.html',
  styleUrl: './view-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ViewSelectorComponent implements OnInit {
  private viewService = inject(ViewSelectorService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  /** Nombre de la entidad (ej: 'Clientes', 'CatalogosComerciales', 'OrdenesTrabajo') */
  @Input({ required: true }) entidad!: string;

  /** Vistas base provistas por el componente padre (del sistema) */
  @Input({ required: true }) vistasSistema: VistaItem[] = [];

  /** Clave de la vista seleccionada actualmente */
  @Input() vistaActualKey: string = '';

  /** Estado actual de filtros o búsqueda para incluir en la nueva vista guardada */
  @Input() filtrosActuales: any = null;

  /** Indica si la vista actual tiene cambios sin guardar respecto a su definición base */
  @Input() esModificada: boolean = false;

  /** Emite la vista completa seleccionada */
  @Output() vistaChange = new EventEmitter<VistaItem>();

  /** Emite solo la clave para soporte [(vistaActualKey)] */
  @Output() vistaActualKeyChange = new EventEmitter<string>();

  /** Notifica al componente padre que se deben descartar las modificaciones y restaurar la vista */
  @Output() descartarCambios = new EventEmitter<void>();

  /** Notifica al componente padre para guardar los cambios sobre la vista personalizada activa */
  @Output() guardarCambios = new EventEmitter<VistaItem>();

  // Estado interno
  busqueda: string = '';
  dropdownVisible: boolean = false;
  vistasUsuario: VistaItem[] = [];

  // Modal "Guardar como nueva vista"
  modalVisible: boolean = false;
  guardandoVista: boolean = false;
  nuevoNombre: string = '';
  nuevaDescripcion: string = '';
  marcarComoPredeterminada: boolean = false;

  ngOnInit(): void {
    this.cargarVistas();
  }

  cargarVistas(): void {
    this.viewService.getVistas(this.entidad).subscribe((vistas) => {
      this.vistasUsuario = vistas.filter((v) => !v.esSistema);

      // Determinar la vista predeterminada guardada (de usuario, del sistema en backend, o de localStorage)
      const usuarioPredeterminada = this.vistasUsuario.find((v) => v.esPredeterminada);
      const sistemaPredeterminadaBackend = vistas.find((v) => v.esSistema && v.esPredeterminada);
      const predeterminadaLocal = this.viewService.getPredeterminadaLocal(this.entidad);

      const keyPredeterminada =
        usuarioPredeterminada?.key ||
        sistemaPredeterminadaBackend?.key ||
        sistemaPredeterminadaBackend?.nombre ||
        predeterminadaLocal;

      // Vista por defecto inicial si no hay ninguna personalizada fijada
      const defaultInicial = this.vistasSistema.find((vs) => vs.esPredeterminada) || this.vistasSistema[0];
      const effectiveDefaultKey = keyPredeterminada || defaultInicial?.key;

      // Actualizar marcas de predeterminada en listas
      this.vistasSistema.forEach((vs) => {
        vs.esPredeterminada = vs.key === effectiveDefaultKey || vs.nombre === effectiveDefaultKey;
      });
      this.vistasUsuario.forEach((vu) => {
        vu.esPredeterminada = vu.key === effectiveDefaultKey || vu.id === effectiveDefaultKey;
      });

      // Activar la vista predeterminada al cargar la página si difiere de la clave actual
      const vistaAActivar =
        this.vistasUsuario.find((v) => v.esPredeterminada) ||
        this.vistasSistema.find((v) => v.esPredeterminada) ||
        this.vistasSistema[0];

      if (vistaAActivar && vistaAActivar.key !== this.vistaActualKey) {
        this.seleccionarVista(vistaAActivar, false);
      }

      this.cdr.markForCheck();
    });
  }

  get todasLasVistas(): VistaItem[] {
    return [...this.vistasSistema, ...this.vistasUsuario];
  }

  get vistasFiltradas(): VistaItem[] {
    if (!this.busqueda.trim()) {
      return this.todasLasVistas;
    }
    const q = this.busqueda.toLowerCase().trim();
    return this.todasLasVistas.filter((v) => v.nombre.toLowerCase().includes(q));
  }

  get vistaActualNombre(): string {
    const encontrada = this.todasLasVistas.find(
      (v) => v.key === this.vistaActualKey || (v.id && v.id === this.vistaActualKey)
    );
    return encontrada ? encontrada.nombre : this.vistaActualKey;
  }

  get vistaActualItem(): VistaItem | undefined {
    return this.todasLasVistas.find(
      (v) => v.key === this.vistaActualKey || (v.id && v.id === this.vistaActualKey)
    );
  }

  get esVistaPersonalizada(): boolean {
    const vista = this.vistaActualItem;
    return !!vista && !vista.esSistema;
  }

  onDescartarCambios(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownVisible = false;
    this.descartarCambios.emit();
  }

  onGuardarCambios(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownVisible = false;
    const actual = this.vistaActualItem;
    if (actual) {
      this.guardarCambios.emit(actual);
    }
  }

  seleccionarVista(vista: VistaItem, cerrarMenu: boolean = true): void {
    this.vistaActualKey = vista.key;
    this.vistaActualKeyChange.emit(this.vistaActualKey);
    this.vistaChange.emit(vista);

    if (cerrarMenu) {
      this.dropdownVisible = false;
    }
    this.cdr.markForCheck();
  }

  establecerPredeterminada(vista: VistaItem, event: MouseEvent): void {
    event.stopPropagation();

    // Desmarcar todas
    this.vistasSistema.forEach((v) => (v.esPredeterminada = false));
    this.vistasUsuario.forEach((v) => (v.esPredeterminada = false));

    vista.esPredeterminada = true;

    // Guardar inmediatamente en localStorage como respaldo instantáneo
    this.viewService.guardarPredeterminadaLocal(this.entidad, vista.key);

    this.viewService
      .establecerPredeterminada(this.entidad, vista.esSistema ? undefined : vista.id, vista.key)
      .subscribe({
        next: () => {
          this.message.success(`"${vista.nombre}" establecida como vista predeterminada.`);
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  abrirModalGuardar(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownVisible = false;
    this.nuevoNombre = '';
    this.nuevaDescripcion = '';
    this.marcarComoPredeterminada = false;
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.cdr.markForCheck();
  }

  guardarNuevaVista(): void {
    if (!this.nuevoNombre.trim()) {
      this.message.warning('Por favor ingresa un nombre para la vista.');
      return;
    }

    this.guardandoVista = true;
    const configJson = this.filtrosActuales ? JSON.stringify(this.filtrosActuales) : '{}';

    this.viewService
      .guardarVista({
        entidad: this.entidad,
        nombre: this.nuevoNombre.trim(),
        descripcion: this.nuevaDescripcion.trim() || undefined,
        configuracionJson: configJson,
        esPredeterminada: this.marcarComoPredeterminada,
      })
      .subscribe({
        next: (nuevaVista) => {
          this.guardandoVista = false;
          this.modalVisible = false;

          if (nuevaVista.esPredeterminada) {
            this.vistasSistema.forEach((v) => (v.esPredeterminada = false));
            this.vistasUsuario.forEach((v) => (v.esPredeterminada = false));
          }

          this.vistasUsuario.push(nuevaVista);
          this.seleccionarVista(nuevaVista, true);
          this.message.success(`Vista "${nuevaVista.nombre}" guardada con éxito.`);
          this.cdr.markForCheck();
        },
        error: () => {
          this.guardandoVista = false;
          this.message.error('No se pudo guardar la vista.');
          this.cdr.markForCheck();
        },
      });
  }

  eliminarVista(vista: VistaItem, event: MouseEvent): void {
    event.stopPropagation();
    if (!vista.id || vista.esSistema) return;

    this.viewService.eliminarVista(this.entidad, vista.id).subscribe(() => {
      this.vistasUsuario = this.vistasUsuario.filter((v) => v.id !== vista.id);
      this.message.success(`Vista "${vista.nombre}" eliminada.`);

      // Si la que se eliminó estaba activa, seleccionar la primera del sistema
      if (this.vistaActualKey === vista.key) {
        const defaultVista = this.vistasSistema[0];
        if (defaultVista) {
          this.seleccionarVista(defaultVista);
        }
      }
      this.cdr.markForCheck();
    });
  }
}
