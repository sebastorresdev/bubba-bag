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
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// NG-ZORRO Modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';

// Shared & Services
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar/command-bar.component';
import { ServicioCampoService } from '../../services/servicio-campo.service';
import { ClienteService } from '../../../crm/services/cliente.service';
import { ClienteListadoItemDto } from '../../../crm/models/cliente.model';
import {
  CatalogoServicioDto,
  CrearCatalogoServicioCommand,
  ActualizarCatalogoServicioRequest,
} from '../../models/servicio-campo-catalogos.model';

@Component({
  selector: 'app-catalogo-servicio-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSwitchModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    NzSpinModule,
    NzAvatarModule,
    NzDividerModule,
    NzTagModule,
    CommandBarComponent,
  ],
  templateUrl: './catalogo-servicio-form.html',
  styleUrl: './catalogo-servicio-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoServicioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicioCampoService = inject(ServicioCampoService);
  private clienteService = inject(ClienteService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isEdit = false;
  catalogoId: string | null = null;
  catalogoActual?: CatalogoServicioDto;
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  clientesContratantes: ClienteListadoItemDto[] = [];
  loadingClientes = false;

  ngOnInit(): void {
    this.initForm();
    this.cargarClientes();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.catalogoId = id;
      this.cargarCatalogo(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      contratanteId: [null],
      descripcion: [''],
      activo: [true],
    });
  }

  private cargarClientes(): void {
    this.loadingClientes = true;
    this.clienteService.getClientes().subscribe({
      next: (res) => {
        this.clientesContratantes = res || [];
        this.loadingClientes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingClientes = false;
        this.cdr.markForCheck();
      },
    });
  }

  private cargarCatalogo(id: string): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.servicioCampoService.getCatalogoServicioPorId(id).subscribe({
      next: (catalogo) => {
        this.catalogoActual = catalogo;
        this.form.patchValue({
          nombre: catalogo.nombre,
          contratanteId: catalogo.contratanteId || null,
          descripcion: catalogo.descripcion || '',
          activo: catalogo.activo,
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('No se pudo cargar la información del catálogo.');
        this.loading = false;
        this.volver();
      },
    });
  }

  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar catálogo',
        disabled: this.saving,
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y cerrar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar y volver a la lista',
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
          if (this.catalogoId) this.cargarCatalogo(this.catalogoId);
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

    if (this.isEdit && this.catalogoId) {
      const request: ActualizarCatalogoServicioRequest = {
        nombre: val.nombre.trim(),
        contratanteId: val.contratanteId || null,
        descripcion: val.descripcion?.trim() || null,
        activo: val.activo,
      };

      this.servicioCampoService.actualizarCatalogoServicio(this.catalogoId, request).subscribe({
        next: () => {
          this.saving = false;
          this.message.success('Catálogo de servicios actualizado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else if (this.catalogoId) {
            this.cargarCatalogo(this.catalogoId);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          this.message.error(err?.error?.message || 'Error al actualizar el catálogo.');
        },
      });
    } else {
      const command: CrearCatalogoServicioCommand = {
        nombre: val.nombre.trim(),
        contratanteId: val.contratanteId || null,
        descripcion: val.descripcion?.trim() || null,
      };

      this.servicioCampoService.crearCatalogoServicio(command).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success('Catálogo de servicios registrado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.router.navigate(['/servicio-campo/catalogos-servicio/editar', res.id]);
          }
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          this.message.error(err?.error?.message || 'Error al crear el catálogo.');
        },
      });
    }
  }

  volver(): void {
    this.router.navigate(['/servicio-campo/catalogos-servicio']);
  }

  getIniciales(nombre?: string): string {
    if (!nombre || !nombre.trim()) return 'CS';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.trim().substring(0, 2).toUpperCase();
  }
}
