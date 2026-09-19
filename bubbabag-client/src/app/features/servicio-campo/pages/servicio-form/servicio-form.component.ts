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
  FormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// NG-ZORRO Modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';

// Services & Models
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar/command-bar.component';
import { ServicioCampoService } from '../../services/servicio-campo.service';
import { SucursalService } from '../../../configuracion/services/sucursal.service';
import { SucursalDto } from '../../../configuracion/models/sucursal.model';
import {
  CatalogoServicioDto,
  ServicioDetalleDto,
  CrearServicioRequest,
  ActualizarServicioRequest,
  ProductoItemDto,
  TipoEvidenciaPaso,
  TipoEvidenciaPasoLabels,
} from '../../models/servicio-campo-catalogos.model';

@Component({
  selector: 'app-servicio-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSwitchModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    NzSpinModule,
    NzAvatarModule,
    NzDividerModule,
    NzTagModule,
    NzTableModule,
    NzCheckboxModule,
    CommandBarComponent,
  ],
  templateUrl: './servicio-form.html',
  styleUrl: './servicio-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private sucursalService = inject(SucursalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEdit = false;
  servicioId: string | null = null;
  servicioActual?: ServicioDetalleDto;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  catalogos: CatalogoServicioDto[] = [];
  productosCatalogo: ProductoItemDto[] = [];
  sucursales: SucursalDto[] = [];
  sucursalesHabilitadasIds = new Set<string>();

  TipoEvidenciaPasoLabels = TipoEvidenciaPasoLabels;
  tiposEvidencia = [
    { value: TipoEvidenciaPaso.Check, label: 'Check / Confirmación' },
    { value: TipoEvidenciaPaso.Foto, label: 'Fotografía Obligatoria' },
    { value: TipoEvidenciaPaso.Texto, label: 'Texto / Serial' },
    { value: TipoEvidenciaPaso.Firma, label: 'Firma Digital' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();
    this.cargarProductos();
    this.cargarSucursales();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.servicioId = id;
      this.cargarServicio(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(30)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      catalogoServicioId: [null, [Validators.required]],
      duracionEstimadaMinutos: [60, [Validators.required, Validators.min(1)]],
      codigoExterno: [''],
      descripcion: [''],
      activo: [true],
      pasos: this.fb.array([]),
      materialesTeoricos: this.fb.array([]),
    });
  }

  get pasosArray(): FormArray {
    return this.form.get('pasos') as FormArray;
  }

  get materialesArray(): FormArray {
    return this.form.get('materialesTeoricos') as FormArray;
  }

  private cargarCatalogos(): void {
    this.servicioCampoService.getCatalogosServicio(undefined, undefined, true).subscribe({
      next: (data) => {
        this.catalogos = data;
        this.cdr.markForCheck();
      },
    });
  }

  private cargarProductos(): void {
    this.servicioCampoService.getProductos(undefined, undefined, true).subscribe({
      next: (data) => {
        this.productosCatalogo = data;
        this.cdr.markForCheck();
      },
    });
  }

  private cargarSucursales(): void {
    this.sucursalService.getSucursales().subscribe({
      next: (data) => {
        this.sucursales = data;
        if (!this.isEdit) {
          // By default on new service, enable for all active branches
          data.forEach((s) => this.sucursalesHabilitadasIds.add(s.id));
        }
        this.cdr.markForCheck();
      },
    });
  }

  private cargarServicio(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.servicioCampoService.getServicioPorId(id).subscribe({
      next: (servicio) => {
        this.servicioActual = servicio;
        this.form.patchValue({
          codigo: servicio.codigo,
          nombre: servicio.nombre,
          catalogoServicioId: servicio.catalogoServicioId,
          duracionEstimadaMinutos: servicio.duracionEstimadaMinutos,
          codigoExterno: servicio.codigoExterno || '',
          descripcion: servicio.descripcion || '',
          activo: servicio.activo,
        });

        // Cargar Pasos
        this.pasosArray.clear();
        servicio.pasos.forEach((p) => {
          this.pasosArray.push(
            this.fb.group({
              numeroPaso: [p.numeroPaso, [Validators.required]],
              descripcion: [p.descripcion, [Validators.required]],
              requiereFoto: [p.requiereFoto],
              tipoEvidencia: [p.tipoEvidencia],
              esObligatorio: [p.esObligatorio],
            })
          );
        });

        // Cargar Materiales
        this.materialesArray.clear();
        servicio.materialesTeoricos.forEach((m) => {
          this.materialesArray.push(
            this.fb.group({
              productoId: [m.productoId, [Validators.required]],
              cantidadTeorica: [m.cantidadTeorica, [Validators.required, Validators.min(0.01)]],
              unidadMedida: [m.unidadMedida || 'Unidades'],
            })
          );
        });

        // Cargar Sucursales
        this.sucursalesHabilitadasIds.clear();
        servicio.sucursalesHabilitadas.forEach((s) => {
          if (s.habilitado) {
            this.sucursalesHabilitadasIds.add(s.sucursalId);
          }
        });

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('No se pudo cargar la información del servicio.');
        this.loading = false;
        this.volver();
      },
    });
  }

  // Métodos de Pasos / Checklist
  agregarPaso(): void {
    const nuevoNumero = this.pasosArray.length + 1;
    this.pasosArray.push(
      this.fb.group({
        numeroPaso: [nuevoNumero, [Validators.required]],
        descripcion: ['', [Validators.required]],
        requiereFoto: [false],
        tipoEvidencia: [TipoEvidenciaPaso.Check],
        esObligatorio: [true],
      })
    );
    this.cdr.markForCheck();
  }

  eliminarPaso(index: number): void {
    this.pasosArray.removeAt(index);
    // Renumerar
    this.pasosArray.controls.forEach((ctrl, idx) => {
      ctrl.patchValue({ numeroPaso: idx + 1 });
    });
    this.cdr.markForCheck();
  }

  onRequiereFotoChange(index: number, requiere: boolean): void {
    const pasoCtrl = this.pasosArray.at(index);
    if (requiere) {
      pasoCtrl.patchValue({ tipoEvidencia: TipoEvidenciaPaso.Foto });
    } else if (pasoCtrl.get('tipoEvidencia')?.value === TipoEvidenciaPaso.Foto) {
      pasoCtrl.patchValue({ tipoEvidencia: TipoEvidenciaPaso.Check });
    }
  }

  onTipoEvidenciaChange(index: number, tipo: TipoEvidenciaPaso): void {
    const pasoCtrl = this.pasosArray.at(index);
    if (tipo === TipoEvidenciaPaso.Foto) {
      pasoCtrl.patchValue({ requiereFoto: true });
    }
  }

  // Métodos de Materiales Teóricos
  agregarMaterial(): void {
    this.materialesArray.push(
      this.fb.group({
        productoId: [null, [Validators.required]],
        cantidadTeorica: [1, [Validators.required, Validators.min(0.01)]],
        unidadMedida: ['Unidades'],
      })
    );
    this.cdr.markForCheck();
  }

  eliminarMaterial(index: number): void {
    this.materialesArray.removeAt(index);
    this.cdr.markForCheck();
  }

  onProductoSelect(index: number, productoId: string): void {
    const prod = this.productosCatalogo.find((p) => p.id === productoId);
    if (prod) {
      this.materialesArray.at(index).patchValue({
        unidadMedida: prod.unidadMedida || 'Unidades',
      });
    }
  }

  // Métodos de Sucursales
  toggleSucursal(sucursalId: string, checked: boolean): void {
    if (checked) {
      this.sucursalesHabilitadasIds.add(sucursalId);
    } else {
      this.sucursalesHabilitadasIds.delete(sucursalId);
    }
    this.cdr.markForCheck();
  }

  isSucursalHabilitada(sucursalId: string): boolean {
    return this.sucursalesHabilitadasIds.has(sucursalId);
  }

  toggleTodasSucursales(checked: boolean): void {
    if (checked) {
      this.sucursales.forEach((s) => this.sucursalesHabilitadasIds.add(s.id));
    } else {
      this.sucursalesHabilitadasIds.clear();
    }
    this.cdr.markForCheck();
  }

  get todasSucursalesHabilitadas(): boolean {
    return (
      this.sucursales.length > 0 &&
      this.sucursales.every((s) => this.sucursalesHabilitadasIds.has(s.id))
    );
  }

  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar servicio y sus plantillas',
        disabled: this.saving,
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y cerrar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar y volver al listado',
        disabled: this.saving,
        execute: () => this.guardar(true),
      },
      { key: 'd1', isDivider: true },
      {
        key: 'discard',
        label: 'Descartar',
        icon: 'close',
        iconColor: 'neutral',
        tooltip: 'Descartar cambios',
        disabled: this.saving,
        execute: () => this.volver(),
      },
      { key: 'd2', isDivider: true },
      {
        key: 'reload',
        label: 'Actualizar',
        icon: 'reload',
        iconColor: 'neutral',
        tooltip: 'Recargar formulario',
        disabled: this.loading,
        execute: () => {
          if (this.servicioId) this.cargarServicio(this.servicioId);
        },
      },
    ];
  }

  guardar(cerrarAlFinal: boolean): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      this.message.warning('Por favor completa todos los campos requeridos marcados con (*).');
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const val = this.form.getRawValue();

    const pasosInput = (val.pasos || []).map((p: any) => ({
      numeroPaso: Number(p.numeroPaso),
      descripcion: p.descripcion.trim(),
      requiereFoto: Boolean(p.requiereFoto),
      tipoEvidencia: Number(p.tipoEvidencia),
      esObligatorio: Boolean(p.esObligatorio),
    }));

    const materialesInput = (val.materialesTeoricos || []).map((m: any) => ({
      productoId: m.productoId,
      cantidadTeorica: Number(m.cantidadTeorica),
      unidadMedida: m.unidadMedida || 'Unidades',
    }));

    const sucursalesIds = Array.from(this.sucursalesHabilitadasIds);

    if (this.isEdit && this.servicioId) {
      const request: ActualizarServicioRequest = {
        nombre: val.nombre.trim(),
        catalogoServicioId: val.catalogoServicioId,
        duracionEstimadaMinutos: Number(val.duracionEstimadaMinutos) || 60,
        descripcion: val.descripcion?.trim() || undefined,
        codigoExterno: val.codigoExterno?.trim() || undefined,
        activo: val.activo,
        pasos: pasosInput,
        materialesTeoricos: materialesInput,
        sucursalesHabilitadasIds: sucursalesIds,
      };

      this.servicioCampoService.actualizarServicio(this.servicioId, request).subscribe({
        next: () => {
          this.saving = false;
          this.message.success('Servicio y plantillas actualizados correctamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else if (this.servicioId) {
            this.cargarServicio(this.servicioId);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          this.message.error(err?.error?.message || 'Error al actualizar el servicio.');
        },
      });
    } else {
      const command: CrearServicioRequest = {
        codigo: val.codigo.trim().toUpperCase(),
        nombre: val.nombre.trim(),
        catalogoServicioId: val.catalogoServicioId,
        duracionEstimadaMinutos: Number(val.duracionEstimadaMinutos) || 60,
        descripcion: val.descripcion?.trim() || undefined,
        codigoExterno: val.codigoExterno?.trim() || undefined,
        pasos: pasosInput,
        materialesTeoricos: materialesInput,
        sucursalesHabilitadasIds: sucursalesIds,
      };

      this.servicioCampoService.crearServicio(command).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success('Servicio registrado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.router.navigate(['/servicio-campo/servicios/editar', res.id]);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          this.message.error(err?.error?.message || 'Error al crear el servicio.');
        },
      });
    }
  }

  volver(): void {
    this.router.navigate(['/servicio-campo/servicios']);
  }

  getIniciales(codigo?: string, nombre?: string): string {
    if (codigo && codigo.trim()) {
      return codigo.trim().substring(0, 3).toUpperCase();
    }
    if (!nombre || !nombre.trim()) return 'SV';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.trim().substring(0, 2).toUpperCase();
  }

  getCatalogoNombre(): string {
    const id = this.form.get('catalogoServicioId')?.value;
    const cat = this.catalogos.find((c) => c.id === id);
    return cat ? cat.nombre : 'Sin Catálogo';
  }
}
