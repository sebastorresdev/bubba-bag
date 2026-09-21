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
import { ServicioCampoService } from '../../../servicio-campo/services/servicio-campo.service';
import { ClienteService } from '../../../crm/services/cliente.service';
import { ClienteListadoItemDto } from '../../../crm/models/cliente.model';
import {
  CatalogoServicioDto,
  CrearCatalogoServicioCommand,
  ActualizarCatalogoServicioRequest,
} from '../../../servicio-campo/models/servicio-campo-catalogos.model';

@Component({
  selector: 'app-catalogo-comercial-form',
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalogo-comercial-form.html',
  styleUrl: './catalogo-comercial-form.component.css',
})
export class CatalogoComercialFormComponent implements OnInit {
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
  loading = false;
  saving = false;
  selectedTabIndex = 0;

  catalogoActual: CatalogoServicioDto | null = null;
  clientesContratantes: ClienteListadoItemDto[] = [];
  loadingClientes = false;

  get commandBarItems(): CommandBarItem[] {
    return [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'primary',
        tooltip: 'Guardar cambios y permanecer en el catálogo',
        execute: () => this.guardar(false),
      },
      {
        key: 'save-close',
        label: 'Guardar y cerrar',
        icon: 'check',
        tooltip: 'Guardar y volver a la lista de catálogos comerciales',
        execute: () => this.guardar(true),
      },
      {
        key: 'refresh',
        label: 'Descartar',
        icon: 'undo',
        tooltip: 'Recargar valores originales del catálogo',
        execute: () => {
          if (this.catalogoId) {
            this.cargarCatalogo(this.catalogoId);
          } else {
            this.form.reset({ activo: true });
          }
        },
      },
    ];
  }

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
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      contratanteId: [null],
      descripcion: ['', [Validators.maxLength(500)]],
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
          contratanteId: catalogo.contratanteId,
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

  guardar(cerrarAlFinal: boolean): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      this.message.warning('Por favor completa todos los campos requeridos (*).');
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const val = this.form.value;

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
          this.message.success('Catálogo comercial actualizado exitosamente.');
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
          this.message.success('Catálogo comercial creado exitosamente.');
          this.cdr.markForCheck();
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.router.navigate(['/ventas/catalogos/editar', res.id]);
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
    this.router.navigate(['/ventas/catalogos']);
  }

  getIniciales(nombre?: string): string {
    if (!nombre || nombre.trim().length === 0) return 'CC';
    const partes = nombre.trim().split(' ').filter(p => p.length > 0);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }
}
