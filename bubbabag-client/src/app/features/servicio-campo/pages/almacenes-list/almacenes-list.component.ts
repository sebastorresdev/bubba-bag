import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';
import {
  EntityTableComponent,
  CellDefDirective,
  ColumnDef,
} from '../../../../shared/components/entity-table';
import { VistaItem } from '../../../../shared/components/view-selector';

import { AlmacenService } from '../../services/almacen.service';
import { AlmacenDto, TipoAlmacen } from '../../models/almacen.model';

@Component({
  selector: 'app-almacenes-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzIconModule,
    NzButtonModule,
    NzDividerModule,
    NzSpinModule,
    NzTooltipModule,
    CommandBarComponent,
    EntityTableComponent,
    CellDefDirective,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './almacenes-list.html',
  styleUrl: './almacenes-list.component.css',
})
export class AlmacenesListComponent implements OnInit, OnDestroy {
  private almacenService = inject(AlmacenService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  almacenes: AlmacenDto[] = [];
  almacenesFiltrados: AlmacenDto[] = [];
  loading = false;

  // ─── Modal ───────────────────────────────────────────────────────────────
  modalVisible = false;
  modalLoading = false;
  editandoId: string | null = null;

  get modalTitulo(): string {
    return this.editandoId ? 'Editar Almacén' : 'Nuevo Almacén';
  }

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    tipo: ['Fisico' as TipoAlmacen, Validators.required],
    direccion: [''],
    telefono: [''],
    recursoTecnicoId: [''],
  });

  get esMovil(): boolean {
    return this.form.get('tipo')?.value === 'Movil';
  }

  // ─── Vistas D365 ─────────────────────────────────────────────────────────
  vistaActual = 'Activos';
  vistasSistema: VistaItem[] = [
    { key: 'Activos', nombre: 'Almacenes Activos', esSistema: true, esPredeterminada: true },
    { key: 'Fisicos', nombre: 'Almacenes Físicos', esSistema: true },
    { key: 'Moviles', nombre: 'Almacenes Móviles (Camionetas)', esSistema: true },
    { key: 'Inactivos', nombre: 'Almacenes Inactivos', esSistema: true },
    { key: 'Todos', nombre: 'Todos los Almacenes', esSistema: true },
  ];

  onVistaChange(vista: VistaItem): void {
    this.vistaActual = vista.key;
    this.aplicarFiltros();
  }

  // ─── Columnas ─────────────────────────────────────────────────────────────
  columnas: ColumnDef<AlmacenDto>[] = [
    { key: 'codigo', title: 'Código', width: '110px', sortable: true, dataType: 'text' },
    { key: 'nombre', title: 'Nombre / Descripción', width: '260px', sortable: true, dataType: 'text', primaryLink: true, canHide: false },
    { key: 'tipo', title: 'Tipo', width: '130px', sortable: true, dataType: 'text', filterType: 'select', filterOptions: [{ label: 'Físico', value: 'Fisico' }, { label: 'Móvil', value: 'Movil' }] },
    { key: 'direccion', title: 'Dirección', width: '220px', sortable: true, dataType: 'text' },
    { key: 'telefono', title: 'Teléfono', width: '130px', sortable: true, dataType: 'text' },
    { key: 'activo', title: 'Estado', width: '100px', align: 'center', sortable: true, dataType: 'boolean', filterType: 'select', filterOptions: [{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }] },
  ];

  // ─── Selección de filas ───────────────────────────────────────────────────
  setOfCheckedId = new Set<string>();
  selectedAlmacen: AlmacenDto | null = null;

  onSelectedIdsChange(ids: Set<string>): void {
    this.setOfCheckedId = ids;
    this.selectedAlmacen =
      ids.size === 1
        ? (this.almacenes.find((a) => a.id === Array.from(ids)[0]) ?? null)
        : null;
    this.cdr.markForCheck();
  }

  // ─── Búsqueda ─────────────────────────────────────────────────────────────
  searchTerm = '';
  searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // ─── CommandBar ───────────────────────────────────────────────────────────
  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'new',
        label: 'Nuevo',
        icon: 'plus',
        iconColor: 'success',
        tooltip: 'Registrar un nuevo almacén o bodega',
        execute: () => this.abrirModalNuevo(),
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'edit',
        iconColor: 'primary',
        disabled: this.setOfCheckedId.size !== 1,
        tooltip:
          this.setOfCheckedId.size !== 1
            ? 'Selecciona exactamente un almacén para editar'
            : `Editar "${this.selectedAlmacen?.nombre}"`,
        execute: () => {
          if (this.selectedAlmacen) this.abrirModalEditar(this.selectedAlmacen);
        },
      },
      {
        key: 'toggle',
        label: this.selectedAlmacen?.activo === false ? 'Activar' : 'Desactivar',
        icon: this.selectedAlmacen?.activo === false ? 'check-circle' : 'stop',
        danger: this.selectedAlmacen?.activo !== false,
        iconColor: this.selectedAlmacen?.activo === false ? 'success' : 'danger',
        disabled: this.setOfCheckedId.size !== 1,
        tooltip:
          this.setOfCheckedId.size !== 1
            ? 'Selecciona un almacén para cambiar su estado'
            : this.selectedAlmacen?.activo
              ? 'Desactivar el almacén seleccionado'
              : 'Reactivar el almacén seleccionado',
        execute: () => {
          if (this.selectedAlmacen) this.toggleEstado(this.selectedAlmacen);
        },
      },
      { key: 'd1', isDivider: true },
      {
        key: 'export',
        label: 'Exportar a Excel',
        icon: 'file-excel',
        iconColor: 'success',
        split: true,
        tooltip: 'Exportar listado de almacenes a Excel',
        execute: () => this.exportarCsv(),
        children: [
          {
            key: 'xlsx',
            label: 'Descargar Excel (.xlsx)',
            icon: 'file-excel',
            iconColor: 'success',
            execute: () => this.exportarCsv(),
          },
        ],
      },
      { key: 'd2', isDivider: true },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        tooltip: 'Recargar lista de almacenes',
        execute: () => this.cargarAlmacenes(),
      },
    ];
  }

  farItems: CommandBarItem[] = [];

  // ─── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.aplicarFiltros());

    this.cargarAlmacenes();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  // ─── Carga y filtros ──────────────────────────────────────────────────────
  cargarAlmacenes(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.almacenService.getAlmacenes().subscribe({
      next: (data) => {
        this.almacenes = data || [];
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudo cargar la lista de almacenes.');
        this.cdr.markForCheck();
      },
    });
  }

  aplicarFiltros(): void {
    let list = [...this.almacenes];

    switch (this.vistaActual) {
      case 'Activos':
        list = list.filter((a) => a.activo);
        break;
      case 'Fisicos':
        list = list.filter((a) => a.tipo === 'Fisico' && a.activo);
        break;
      case 'Moviles':
        list = list.filter((a) => a.tipo === 'Movil' && a.activo);
        break;
      case 'Inactivos':
        list = list.filter((a) => !a.activo);
        break;
      default:
        break;
    }

    const term = this.searchTerm?.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (a) =>
          a.codigo.toLowerCase().includes(term) ||
          a.nombre.toLowerCase().includes(term) ||
          (a.direccion && a.direccion.toLowerCase().includes(term)) ||
          (a.telefono && a.telefono.toLowerCase().includes(term))
      );
    }

    this.almacenesFiltrados = list;
    this.cdr.markForCheck();
  }

  // ─── Modal Nuevo / Editar ─────────────────────────────────────────────────
  abrirModalNuevo(): void {
    this.editandoId = null;
    this.form.reset({ tipo: 'Fisico' });
    this.form.get('codigo')?.enable();
    this.modalVisible = true;
  }

  abrirModalEditar(almacen: AlmacenDto): void {
    this.editandoId = almacen.id;
    this.form.patchValue({
      codigo: almacen.codigo,
      nombre: almacen.nombre,
      tipo: almacen.tipo,
      direccion: almacen.direccion ?? '',
      telefono: almacen.telefono ?? '',
      recursoTecnicoId: almacen.recursoTecnicoId ?? '',
    });
    this.form.get('codigo')?.disable(); // El código no se puede cambiar al editar
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.form.reset();
  }

  guardar(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    const v = this.form.getRawValue();
    this.modalLoading = true;

    if (this.editandoId) {
      this.almacenService
        .actualizarAlmacen(this.editandoId, {
          nombre: v.nombre!,
          direccion: v.direccion || undefined,
          telefono: v.telefono || undefined,
        })
        .subscribe({
          next: () => {
            this.message.success('Almacén actualizado correctamente.');
            this.cerrarModal();
            this.cargarAlmacenes();
            this.modalLoading = false;
          },
          error: () => {
            this.message.error('No se pudo actualizar el almacén.');
            this.modalLoading = false;
          },
        });
    } else {
      this.almacenService
        .crearAlmacen({
          codigo: v.codigo!,
          nombre: v.nombre!,
          tipo: v.tipo as TipoAlmacen,
          direccion: v.direccion || undefined,
          telefono: v.telefono || undefined,
          recursoTecnicoId: v.recursoTecnicoId || undefined,
        })
        .subscribe({
          next: () => {
            this.message.success('Almacén creado correctamente.');
            this.cerrarModal();
            this.cargarAlmacenes();
            this.modalLoading = false;
          },
          error: (err) => {
            this.message.error(err?.error || 'No se pudo crear el almacén.');
            this.modalLoading = false;
          },
        });
    }
  }

  // ─── Toggle Estado ────────────────────────────────────────────────────────
  toggleEstado(almacen: AlmacenDto): void {
    const nuevoEstado = !almacen.activo;
    this.almacenService.cambiarEstado(almacen.id, nuevoEstado).subscribe({
      next: () => {
        const accion = nuevoEstado ? 'activado' : 'desactivado';
        this.message.success(`Almacén ${accion} correctamente.`);
        this.cargarAlmacenes();
      },
      error: () => {
        this.message.error('No se pudo cambiar el estado del almacén.');
      },
    });
  }

  // ─── Exportar ─────────────────────────────────────────────────────────────
  exportarCsv(): void {
    if (this.almacenesFiltrados.length === 0) {
      this.message.warning('No hay datos para exportar.');
      return;
    }

    const headers = ['Código', 'Nombre', 'Tipo', 'Dirección', 'Teléfono', 'Estado'];
    const rows = this.almacenesFiltrados.map((a) => [
      `"${a.codigo}"`,
      `"${a.nombre}"`,
      a.tipo === 'Fisico' ? 'Físico' : 'Móvil',
      `"${a.direccion ?? ''}"`,
      `"${a.telefono ?? ''}"`,
      a.activo ? 'ACTIVO' : 'INACTIVO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `almacenes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.message.success('Archivo exportado exitosamente.');
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  getTipoLabel(tipo: TipoAlmacen): string {
    return tipo === 'Fisico' ? 'Físico' : 'Móvil';
  }

  getTipoColor(tipo: TipoAlmacen): string {
    return tipo === 'Fisico' ? 'blue' : 'orange';
  }
}
